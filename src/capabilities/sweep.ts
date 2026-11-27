import * as T from 'three';
import { findOwnNodeByName, getRiggedRestPose, hasHiddenAncestor, traverseOwnSubtree } from './compose-tree';
import {
  readCapabilities,
  type AssetCapabilities,
  type ClearanceZoneSpec,
  type ColliderSpec,
  type RiggedPartSpec,
} from './schema';
import {
  buildOrientedBox,
  colliderHalfExtents,
  isVisibleInTree,
  obbContainedIn,
  obbOverlap,
  type OrientedBox,
  type Vec3Tuple,
} from './obb';

export interface RiggedSweepOptions {
  /** Number of evenly spaced samples along each part's travel range (default 7). */
  steps?: number;
  /** Clearance containment / collision tolerance in meters (default 0.015 m). */
  tolerance?: number;
  /** Optional external world-space obstacle OBBs to test against the moving part. */
  obstacles?: readonly OrientedBox[];
  /** Optional explicit capabilities override (avoids mutating `root.userData.formFoundry`). */
  capabilities?: AssetCapabilities;
  /** Optional node name prefix for scoped composite children. */
  nodePrefix?: string;
  /** Optional resolver returning external obstacle OBBs for a specific moving part (allows excluding co-moving children). */
  getObstaclesForPart?: (partName: string, movingNode: T.Object3D) => readonly OrientedBox[];
  /** Optional resolver returning live world-space OBBs for carried children moving with `movingNode` at the current step. */
  getCarriedBoxes?: (partName: string, movingNode: T.Object3D) => readonly OrientedBox[];
}

export interface RiggedSweepIssue {
  part: string;
  kind: 'non-finite' | 'exceeds-clearance' | 'obstacle-blocked';
  value: number;
  detail: string;
}

export interface RiggedSweepReport {
  valid: boolean;
  checkedParts: number;
  issues: RiggedSweepIssue[];
}

function axisVector(axis: RiggedPartSpec['axis']): T.Vector3 {
  return axis === 'x' ? new T.Vector3(1, 0, 0) : axis === 'y' ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1);
}

function measureLocalNodeBox(node: T.Object3D): { at: Vec3Tuple; halfExtents: Vec3Tuple } | null {
  node.updateMatrixWorld(true);
  const invNode = node.matrixWorld.clone().invert();
  const box = new T.Box3();
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  traverseOwnSubtree(node, child => {
    if (child.userData.studioOverlay || !(child instanceof T.Mesh) || !isVisibleInTree(child)) return;
    const geo = child.geometry as T.BufferGeometry;
    const pos = geo.getAttribute('position') as T.BufferAttribute | undefined;
    if (!pos || pos.count === 0) return;
    rel.multiplyMatrices(invNode, child.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(rel);
      box.expandByPoint(v);
    }
  });
  if (box.isEmpty()) return null;
  const center = box.getCenter(new T.Vector3());
  const size = box.getSize(new T.Vector3());
  return {
    at: [center.x, center.y, center.z],
    halfExtents: [Math.max(0.005, size.x * 0.5), Math.max(0.005, size.y * 0.5), Math.max(0.005, size.z * 0.5)],
  };
}

/** Sweep every rigged part across its declared range, verifying clearance-zone coverage and external obstacles. */
export function checkRiggedSweep(root: T.Object3D, options: RiggedSweepOptions = {}): RiggedSweepReport {
  const steps = Math.max(2, options.steps ?? 7);
  const tolerance = options.tolerance ?? 0.015;
  const defaultObstacles = options.obstacles ?? [];
  const caps = options.capabilities ?? readCapabilities(root);
  if (!caps || !caps.riggedParts.length) return { valid: true, checkedParts: 0, issues: [] };

  const prefix = options.nodePrefix ?? '';
  const hiddenSet = new Set(caps.state?.hiddenParts ?? []);
  const poseMap = caps.state?.pose ?? {};

  root.updateMatrixWorld(true);
  const clearanceByPart = new Map<string, ClearanceZoneSpec[]>();
  for (const zone of caps.clearanceZones ?? []) {
    if (!zone.part || zone.kind === 'cavity') continue;
    const list = clearanceByPart.get(zone.part) ?? [];
    list.push(zone);
    clearanceByPart.set(zone.part, list);
  }
  const colliderByNode = new Map<string, ColliderSpec[]>();
  for (const col of caps.colliders ?? []) {
    if (!col.node || col.layer === 'none') continue;
    const list = colliderByNode.get(col.node) ?? [];
    list.push(col);
    colliderByNode.set(col.node, list);
  }

  const issues: RiggedSweepIssue[] = [];
  let checkedParts = 0;

  for (const part of caps.riggedParts) {
    const localName = prefix && part.name.startsWith(prefix) ? part.name.slice(prefix.length) : part.name;
    if (hiddenSet.has(part.name) || hiddenSet.has(localName)) continue;
    const node = findOwnNodeByName(root, part.name, prefix);
    if (!node || !isVisibleInTree(node) || hasHiddenAncestor(node, root, hiddenSet, prefix)) continue;
    checkedParts++;
    const origPos = node.position.clone();
    const origQuat = node.quaternion.clone();
    const axis = axisVector(part.axis);
    const registeredRest = getRiggedRestPose(node);
    const restPos = registeredRest ? registeredRest.pos.clone() : origPos.clone();
    const restQuat = registeredRest ? registeredRest.quat.clone() : origQuat.clone();
    if (!registeredRest) {
      const currentPose = poseMap[part.name] ?? poseMap[localName] ?? 0;
      if (Math.abs(currentPose) > 1e-9) {
        if (part.type === 'slide') {
          restPos.addScaledVector(axis, -currentPose);
        } else {
          restQuat.multiply(new T.Quaternion().setFromAxisAngle(axis, -T.MathUtils.degToRad(currentPose))).normalize();
        }
      }
    }
    const authoredColliders = colliderByNode.get(part.name) ?? colliderByNode.get(localName);
    const fallbackBox = authoredColliders?.length ? null : measureLocalNodeBox(node);
    const partClearanceSpecs = clearanceByPart.get(part.name) ?? clearanceByPart.get(localName) ?? [];
    const clearanceZones = partClearanceSpecs.map(z =>
      buildOrientedBox(root.matrixWorld, z.at, [z.size[0] * 0.5, z.size[1] * 0.5, z.size[2] * 0.5], {
        id: `sweep:clearance:${z.name}`,
        name: z.name,
        ownerId: root.name || 'Asset',
        kind: 'clearance',
        layer: z.kind,
        part: part.name,
        ...(z.rotation ? { rotation: z.rotation } : {}),
      }),
    );
    const obstacles = options.getObstaclesForPart ? options.getObstaclesForPart(localName, node) : defaultObstacles;

    try {
      for (let s = 0; s < steps; s++) {
        const t = steps === 1 ? 0 : s / (steps - 1);
        const value = part.range[0] + (part.range[1] - part.range[0]) * t;
        node.position.copy(restPos);
        node.quaternion.copy(restQuat);
        if (part.type === 'slide') {
          node.position.addScaledVector(axis, value);
        } else {
          node.quaternion.multiply(new T.Quaternion().setFromAxisAngle(axis, T.MathUtils.degToRad(value)));
        }
        node.updateMatrixWorld(true);

        const e = node.matrixWorld.elements;
        if (!e.every(Number.isFinite)) {
          issues.push({ part: part.name, kind: 'non-finite', value, detail: 'Non-finite world matrix during sweep' });
          break;
        }

        const partBoxes: OrientedBox[] = [];
        if (authoredColliders?.length) {
          for (const col of authoredColliders) {
            partBoxes.push(buildOrientedBox(node.matrixWorld, col.at, colliderHalfExtents(col), {
              id: `sweep:${col.name}`,
              name: col.name,
              ownerId: root.name || 'Asset',
              kind: 'collider',
              layer: col.layer ?? 'solid',
              part: part.name,
              ...(col.rotation ? { rotation: col.rotation } : {}),
            }));
          }
        } else if (fallbackBox) {
          partBoxes.push(buildOrientedBox(node.matrixWorld, fallbackBox.at, fallbackBox.halfExtents, {
            id: `sweep:${part.name}`,
            name: part.name,
            ownerId: root.name || 'Asset',
            kind: 'collider',
            layer: 'solid',
            part: part.name,
          }));
        }

        for (const box of partBoxes) {
          if (clearanceZones.length && !clearanceZones.some(z => obbContainedIn(box, z, tolerance))) {
            issues.push({
              part: part.name,
              kind: 'exceeds-clearance',
              value: Math.round(value * 1000) / 1000,
              detail: `${box.name} exceeds declared clearance zone at pose ${value.toFixed(2)}`,
            });
          }
          for (const obs of obstacles) {
            if (obs.kind === 'clearance' && obs.layer === 'cavity') continue;
            const hit = obbOverlap(box, obs, -tolerance);
            if (hit.overlaps) {
              issues.push({
                part: part.name,
                kind: 'obstacle-blocked',
                value: Math.round(value * 1000) / 1000,
                detail: `${box.name} blocked by ${obs.ownerId}:${obs.name} (penetration ${hit.penetration.toFixed(3)}m) at pose ${value.toFixed(2)}`,
              });
            }
          }
        }

        const carriedBoxes = options.getCarriedBoxes ? options.getCarriedBoxes(localName, node) : [];
        for (const box of carriedBoxes) {
          for (const obs of obstacles) {
            if (obs.kind === 'clearance' && obs.layer === 'cavity') continue;
            const hit = obbOverlap(box, obs, -tolerance);
            if (hit.overlaps) {
              issues.push({
                part: part.name,
                kind: 'obstacle-blocked',
                value: Math.round(value * 1000) / 1000,
                detail: `Carried ${box.ownerId}:${box.name} blocked by ${obs.ownerId}:${obs.name} (penetration ${hit.penetration.toFixed(3)}m) at pose ${value.toFixed(2)}`,
              });
            }
          }
        }
      }
    } finally {
      node.position.copy(origPos);
      node.quaternion.copy(origQuat);
      node.updateMatrixWorld(true);
    }
  }

  return { valid: issues.length === 0, checkedParts, issues };
}
