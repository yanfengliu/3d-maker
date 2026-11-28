import * as T from 'three';
import { findOwnNodeByName, getRiggedRestPose, hasHiddenAncestor, resolveLiveRiggedParts, traverseOwnSubtree } from './compose-tree';
import { axisTuple, buildSweepSampleValues, listMimicFollowers, propagateMimicValues, slideOffsetFactor } from './rig-math';
import { readSand3dCapabilities } from './sand3d';
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
  getObstaclesForPart?: (partName: string, movingNode: T.Object3D, movingNodes?: readonly T.Object3D[]) => readonly OrientedBox[];
  /** Optional resolver returning live world-space OBBs for carried children moving with `movingNode` (or coupled followers) at the current step. */
  getCarriedBoxes?: (partName: string, movingNode: T.Object3D, movingNodes?: readonly T.Object3D[]) => readonly OrientedBox[];
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
  return new T.Vector3(...axisTuple(axis));
}

function measureLocalNodeBox(
  node: T.Object3D,
  excludeNodes?: ReadonlySet<T.Object3D>,
): { at: Vec3Tuple; halfExtents: Vec3Tuple } | null {
  node.updateMatrixWorld(true);
  const invNode = node.matrixWorld.clone().invert();
  const box = new T.Box3();
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  traverseOwnSubtree(node, child => {
    if (child !== node && excludeNodes?.has(child)) return;
    if (child.userData.studioOverlay || !(child instanceof T.Mesh) || !isVisibleInTree(child)) return;
    if (excludeNodes) {
      let anc = child.parent;
      while (anc && anc !== node) {
        if (excludeNodes.has(anc)) return;
        anc = anc.parent;
      }
    }
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

function isDescendantOf(candidate: T.Object3D, ancestor: T.Object3D, stopAt?: T.Object3D): boolean {
  let cur: T.Object3D | null = candidate.parent;
  while (cur && cur !== stopAt) {
    if (cur === ancestor) return true;
    cur = cur.parent;
  }
  return cur === ancestor;
}

/** Sweep every rigged part across its declared range, verifying clearance-zone coverage and external obstacles. */
export function checkRiggedSweep(root: T.Object3D, options: RiggedSweepOptions = {}): RiggedSweepReport {
  const tolerance = options.tolerance ?? 0.015;
  const defaultObstacles = options.obstacles ?? [];
  const caps = options.capabilities ?? readCapabilities(root) ?? readSand3dCapabilities(root);
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
  const liveRigged = resolveLiveRiggedParts(root, caps.riggedParts, prefix);
  if (!liveRigged.length) return { valid: true, checkedParts: 0, issues: [] };
  const allDynamicNodes = new Map<string, T.Object3D>();
  for (const col of caps.colliders ?? []) {
    if (!col.node || col.layer === 'none') continue;
    const dn = findOwnNodeByName(root, col.node, prefix);
    if (dn) allDynamicNodes.set(col.node, dn);
  }
  for (const rp of liveRigged) {
    const dn = findOwnNodeByName(root, rp.name, prefix);
    if (dn) allDynamicNodes.set(rp.name, dn);
  }
  for (const dp of caps.detachableParts) {
    const dn = findOwnNodeByName(root, dp.name, prefix);
    if (dn) allDynamicNodes.set(dp.name, dn);
  }

  const issues: RiggedSweepIssue[] = [];
  let checkedParts = 0;

  for (const part of liveRigged) {
    if (part.mimic) continue;
    const localName = prefix && part.name.startsWith(prefix) ? part.name.slice(prefix.length) : part.name;
    const node = findOwnNodeByName(root, part.name, prefix);
    if (!node) continue;
    const leaderVisible = !hiddenSet.has(part.name) && !hiddenSet.has(localName)
      && isVisibleInTree(node) && !hasHiddenAncestor(node, root, hiddenSet, prefix);

    const followerNames = listMimicFollowers(liveRigged, part.name);
    const followers = followerNames
      .map(fname => {
        const fSpec = liveRigged.find(p => p.name === fname);
        const fNode = fSpec ? findOwnNodeByName(root, fSpec.name, prefix) : undefined;
        if (!fSpec || !fNode) return null;
        const fLocal = prefix && fSpec.name.startsWith(prefix) ? fSpec.name.slice(prefix.length) : fSpec.name;
        const visible = !hiddenSet.has(fSpec.name) && !hiddenSet.has(fLocal)
          && isVisibleInTree(fNode) && !hasHiddenAncestor(fNode, root, hiddenSet, prefix);
        const fOrigPos = fNode.position.clone();
        const fOrigQuat = fNode.quaternion.clone();
        const fAxis = axisVector(fSpec.axis);
        const fSlideScale = slideOffsetFactor(fSpec);
        const fReg = getRiggedRestPose(fNode);
        const fRestPos = fReg ? fReg.pos.clone() : fOrigPos.clone();
        const fRestQuat = fReg ? fReg.quat.clone() : fOrigQuat.clone();
        if (!fReg) {
          const fCur = poseMap[fSpec.name] ?? poseMap[fLocal] ?? 0;
          if (Math.abs(fCur) > 1e-9) {
            if (fSpec.type === 'slide') fRestPos.addScaledVector(fAxis, -fCur * fSlideScale);
            else fRestQuat.multiply(new T.Quaternion().setFromAxisAngle(fAxis, -T.MathUtils.degToRad(fCur))).normalize();
          }
        }
        const fCols = visible ? (colliderByNode.get(fSpec.name) ?? colliderByNode.get(fLocal)) : undefined;
        return {
          spec: fSpec, localName: fLocal, node: fNode, visible, origPos: fOrigPos, origQuat: fOrigQuat,
          restPos: fRestPos, restQuat: fRestQuat, axis: fAxis, slideScale: fSlideScale, cols: fCols,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const visibleFollowers = followers.filter(f => f.visible);
    if (!leaderVisible && visibleFollowers.length === 0) continue;
    checkedParts++;

    const origPos = node.position.clone();
    const origQuat = node.quaternion.clone();
    const axis = axisVector(part.axis);
    const leaderSlideScale = slideOffsetFactor(part);
    const registeredRest = getRiggedRestPose(node);
    const restPos = registeredRest ? registeredRest.pos.clone() : origPos.clone();
    const restQuat = registeredRest ? registeredRest.quat.clone() : origQuat.clone();
    if (!registeredRest) {
      const currentPose = poseMap[part.name] ?? poseMap[localName] ?? 0;
      if (Math.abs(currentPose) > 1e-9) {
        if (part.type === 'slide') {
          restPos.addScaledVector(axis, -currentPose * leaderSlideScale);
        } else {
          restQuat.multiply(new T.Quaternion().setFromAxisAngle(axis, -T.MathUtils.degToRad(currentPose))).normalize();
        }
      }
    }

    const activeMovingNodes: T.Object3D[] = [
      ...(leaderVisible ? [node] : []),
      ...visibleFollowers.map(f => f.node),
    ];
    const sweptNodeSet = new Set<T.Object3D>([node, ...followers.map(f => f.node)]);
    const dynamicExclude = new Set<T.Object3D>(allDynamicNodes.values());
    const authoredColliders = leaderVisible ? (colliderByNode.get(part.name) ?? colliderByNode.get(localName)) : undefined;
    const fallbackBox = leaderVisible && !authoredColliders?.length ? measureLocalNodeBox(node, dynamicExclude) : null;
    const followerFallbacks = new Map<T.Object3D, { at: Vec3Tuple; halfExtents: Vec3Tuple } | null>();
    for (const f of visibleFollowers) {
      followerFallbacks.set(f.node, f.cols?.length ? null : measureLocalNodeBox(f.node, dynamicExclude));
    }

    // Collect independently rigged/detachable descendant nodes carried rigidly inside active moving nodes (tagged by deepest carrier).
    const carriedOwnDescendants: {
      name: string;
      carrierName: string;
      zoneKey: string;
      node: T.Object3D;
      cols?: ColliderSpec[];
      fallback: { at: Vec3Tuple; halfExtents: Vec3Tuple } | null;
    }[] = [];
    for (const [dName, dNode] of allDynamicNodes) {
      if (sweptNodeSet.has(dNode)) continue;
      const dLocal = prefix && dName.startsWith(prefix) ? dName.slice(prefix.length) : dName;
      if (hiddenSet.has(dName) || hiddenSet.has(dLocal) || !isVisibleInTree(dNode) || hasHiddenAncestor(dNode, root, hiddenSet, prefix)) {
        continue;
      }
      let carrier: T.Object3D | undefined;
      for (const mn of activeMovingNodes) {
        if (!isDescendantOf(dNode, mn, root)) continue;
        if (!carrier || isDescendantOf(mn, carrier, root)) carrier = mn;
      }
      if (!carrier) continue;
      const carrierFollower = visibleFollowers.find(f => f.node === carrier);
      const dCols = colliderByNode.get(dName) ?? colliderByNode.get(dLocal);
      carriedOwnDescendants.push({
        name: dName,
        carrierName: carrier.name || dName,
        zoneKey: carrierFollower ? carrierFollower.spec.name : part.name,
        node: dNode,
        ...(dCols?.length ? { cols: dCols } : {}),
        fallback: dCols?.length ? null : measureLocalNodeBox(dNode, dynamicExclude),
      });
    }

    const buildZones = (zoneKey: string, localKey: string) =>
      (clearanceByPart.get(zoneKey) ?? clearanceByPart.get(localKey) ?? []).map(z =>
        buildOrientedBox(root.matrixWorld, z.at, [z.size[0] * 0.5, z.size[1] * 0.5, z.size[2] * 0.5], {
          id: `sweep:clearance:${z.name}`, name: z.name, ownerId: root.name || 'Asset',
          kind: 'clearance', layer: z.kind, part: zoneKey,
          ...(z.rotation ? { rotation: z.rotation } : {}),
        }),
      );
    const leaderZones = buildZones(part.name, localName);
    const zonesByPart = new Map<string, OrientedBox[]>([[part.name, leaderZones]]);
    for (const f of visibleFollowers) {
      const fZones = buildZones(f.spec.name, f.localName);
      zonesByPart.set(f.spec.name, fZones.length ? fZones : leaderZones);
    }
    const obstacles = options.getObstaclesForPart ? options.getObstaclesForPart(localName, node, activeMovingNodes) : defaultObstacles;
    const sampleValues = buildSweepSampleValues(part, liveRigged, {
      minSteps: 7,
      degPerStep: 30,
      maxTotalSteps: 96,
      ...(options.steps !== undefined ? { exactSteps: options.steps } : {}),
    });

    try {
      for (const value of sampleValues) {
        node.position.copy(restPos);
        node.quaternion.copy(restQuat);
        if (part.type === 'slide') {
          node.position.addScaledVector(axis, value * leaderSlideScale);
        } else {
          node.quaternion.multiply(new T.Quaternion().setFromAxisAngle(axis, T.MathUtils.degToRad(value)));
        }
        if (followers.length) {
          const coupled = propagateMimicValues(liveRigged, part.name, value);
          for (const f of followers) {
            const fVal = coupled.get(f.spec.name) ?? 0;
            f.node.position.copy(f.restPos);
            f.node.quaternion.copy(f.restQuat);
            if (f.spec.type === 'slide') f.node.position.addScaledVector(f.axis, fVal * f.slideScale);
            else f.node.quaternion.multiply(new T.Quaternion().setFromAxisAngle(f.axis, T.MathUtils.degToRad(fVal)));
          }
          root.updateMatrixWorld(true);
        } else {
          node.updateMatrixWorld(true);
        }

        const e = node.matrixWorld.elements;
        if (!e.every(Number.isFinite)) {
          issues.push({ part: part.name, kind: 'non-finite', value, detail: 'Non-finite world matrix during sweep' });
          break;
        }

        const partBoxes: { box: OrientedBox; zoneKey: string }[] = [];
        const leaderTag = node.name || part.name;
        if (authoredColliders?.length) {
          for (const col of authoredColliders) {
            partBoxes.push({
              zoneKey: part.name,
              box: buildOrientedBox(node.matrixWorld, col.at, colliderHalfExtents(col), {
                id: `sweep:${col.name}`, name: col.name, ownerId: root.name || 'Asset',
                kind: 'collider', layer: col.layer ?? 'solid', part: leaderTag,
                ...(col.rotation ? { rotation: col.rotation } : {}),
              }),
            });
          }
        } else if (fallbackBox) {
          partBoxes.push({
            zoneKey: part.name,
            box: buildOrientedBox(node.matrixWorld, fallbackBox.at, fallbackBox.halfExtents, {
              id: `sweep:${part.name}`, name: part.name, ownerId: root.name || 'Asset',
              kind: 'collider', layer: 'solid', part: leaderTag,
            }),
          });
        }
        for (const f of visibleFollowers) {
          const fTag = f.node.name || f.spec.name;
          if (f.cols?.length) {
            for (const col of f.cols) {
              partBoxes.push({
                zoneKey: f.spec.name,
                box: buildOrientedBox(f.node.matrixWorld, col.at, colliderHalfExtents(col), {
                  id: `sweep:${col.name}`, name: col.name, ownerId: root.name || 'Asset',
                  kind: 'collider', layer: col.layer ?? 'solid', part: fTag,
                  ...(col.rotation ? { rotation: col.rotation } : {}),
                }),
              });
            }
          } else {
            const fb = followerFallbacks.get(f.node);
            if (fb) {
              partBoxes.push({
                zoneKey: f.spec.name,
                box: buildOrientedBox(f.node.matrixWorld, fb.at, fb.halfExtents, {
                  id: `sweep:${f.spec.name}`, name: f.spec.name, ownerId: root.name || 'Asset',
                  kind: 'collider', layer: 'solid', part: fTag,
                }),
              });
            }
          }
        }
        for (const cd of carriedOwnDescendants) {
          if (cd.cols?.length) {
            for (const col of cd.cols) {
              partBoxes.push({
                zoneKey: cd.zoneKey,
                box: buildOrientedBox(cd.node.matrixWorld, col.at, colliderHalfExtents(col), {
                  id: `sweep:${col.name}`, name: col.name, ownerId: root.name || 'Asset',
                  kind: 'collider', layer: col.layer ?? 'solid', part: cd.carrierName,
                  ...(col.rotation ? { rotation: col.rotation } : {}),
                }),
              });
            }
          } else if (cd.fallback) {
            partBoxes.push({
              zoneKey: cd.zoneKey,
              box: buildOrientedBox(cd.node.matrixWorld, cd.fallback.at, cd.fallback.halfExtents, {
                id: `sweep:${cd.name}`, name: cd.name, ownerId: root.name || 'Asset',
                kind: 'collider', layer: 'solid', part: cd.carrierName,
              }),
            });
          }
        }

        for (const { box, zoneKey } of partBoxes) {
          const zones = zonesByPart.get(zoneKey) ?? leaderZones;
          if (zones.length && !zones.some(z => obbContainedIn(box, z, tolerance))) {
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

        const carriedBoxes = options.getCarriedBoxes ? options.getCarriedBoxes(localName, node, activeMovingNodes) : [];
        for (let i = 0; i < carriedBoxes.length; i++) {
          const box = carriedBoxes[i];
          if (!box) continue;
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
          for (let j = i + 1; j < carriedBoxes.length; j++) {
            const other = carriedBoxes[j];
            if (!other || box.ownerId === other.ownerId || (box.part && box.part === other.part)) continue;
            const hit = obbOverlap(box, other, -tolerance);
            if (hit.overlaps) {
              issues.push({
                part: part.name,
                kind: 'obstacle-blocked',
                value: Math.round(value * 1000) / 1000,
                detail: `Carried ${box.ownerId}:${box.name} collides with carried ${other.ownerId}:${other.name} (penetration ${hit.penetration.toFixed(3)}m) at pose ${value.toFixed(2)}`,
              });
            }
          }
          for (const { box: pBox } of partBoxes) {
            if (!box.part || !pBox.part || box.part === pBox.part) continue;
            const hit = obbOverlap(box, pBox, -tolerance);
            if (hit.overlaps) {
              issues.push({
                part: part.name,
                kind: 'obstacle-blocked',
                value: Math.round(value * 1000) / 1000,
                detail: `Carried ${box.ownerId}:${box.name} collides with moving part ${pBox.name} (penetration ${hit.penetration.toFixed(3)}m) at pose ${value.toFixed(2)}`,
              });
            }
          }
        }
      }
    } finally {
      node.position.copy(origPos);
      node.quaternion.copy(origQuat);
      for (const f of followers) {
        f.node.position.copy(f.origPos);
        f.node.quaternion.copy(f.origQuat);
      }
      root.updateMatrixWorld(true);
    }
  }

  return { valid: issues.length === 0, checkedParts, issues };
}
