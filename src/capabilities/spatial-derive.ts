import * as T from 'three';
import type {
  ClearanceZoneSpec,
  ColliderLayer,
  ColliderSpec,
  DetachablePartSpec,
  RiggedPartSpec,
  SurfaceSpec,
} from './schema';

export interface DerivedSpatialMetadata {
  colliders: ColliderSpec[];
  clearanceZones: ClearanceZoneSpec[];
  surfaces: SurfaceSpec[];
}

type TypedMesh = T.Mesh<T.BufferGeometry, T.Material | T.Material[]>;

function r3(n: number): number {
  return Math.round((n + 1e-9) * 1000) / 1000 || 0;
}

function roundVec3(x: number, y: number, z: number): [number, number, number] {
  return [r3(x), r3(y), r3(z)];
}

function isSpinnerPart(part: RiggedPartSpec): boolean {
  return part.type === 'rotate' && Math.abs(part.range[1] - part.range[0]) >= 350;
}

function colliderLayerForPart(part: RiggedPartSpec): ColliderLayer {
  if (isSpinnerPart(part)) return 'none';
  if (/(door|gate|hatch|shutter|ramp|bridge|lid|drawer|flap|visor)/i.test(part.name)) return 'doorway';
  return 'solid';
}

function axisVector(axis: RiggedPartSpec['axis']): T.Vector3 {
  return axis === 'x' ? new T.Vector3(1, 0, 0) : axis === 'y' ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1);
}

function isDescendantOfAny(obj: T.Object3D, ancestors: ReadonlySet<T.Object3D>): boolean {
  let cur: T.Object3D | null = obj;
  while (cur) {
    if (ancestors.has(cur)) return true;
    cur = cur.parent;
  }
  return false;
}

function computeBoxInFrame(
  root: T.Object3D,
  invFrame: T.Matrix4,
  excludeRoots?: ReadonlySet<T.Object3D>,
): T.Box3 {
  const box = new T.Box3();
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  root.traverse(child => {
    if (child.userData.studioOverlay || !(child instanceof T.Mesh)) return;
    if (excludeRoots && isDescendantOfAny(child, excludeRoots)) return;
    const mesh = child as TypedMesh;
    const pos = mesh.geometry.getAttribute('position') as T.BufferAttribute | undefined;
    if (!pos || pos.count === 0) return;
    rel.multiplyMatrices(invFrame, mesh.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(rel);
      if (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) box.expandByPoint(v);
    }
  });
  return box;
}

function boxCorners(box: T.Box3): T.Vector3[] {
  const { min, max } = box;
  return [
    new T.Vector3(min.x, min.y, min.z),
    new T.Vector3(max.x, min.y, min.z),
    new T.Vector3(min.x, max.y, min.z),
    new T.Vector3(max.x, max.y, min.z),
    new T.Vector3(min.x, min.y, max.z),
    new T.Vector3(max.x, min.y, max.z),
    new T.Vector3(min.x, max.y, max.z),
    new T.Vector3(max.x, max.y, max.z),
  ];
}

function computeRestPose(
  node: T.Object3D,
  localCenter: T.Vector3,
  invRoot: T.Matrix4,
): { at: [number, number, number]; rotation?: [number, number, number] } {
  const rel = new T.Matrix4().multiplyMatrices(invRoot, node.matrixWorld);
  const worldCenter = localCenter.clone().applyMatrix4(rel);
  const pos = new T.Vector3();
  const quat = new T.Quaternion();
  const scl = new T.Vector3();
  rel.decompose(pos, quat, scl);
  const euler = new T.Euler().setFromQuaternion(quat, 'XYZ');
  const hasRot = Math.abs(euler.x) > 1e-3 || Math.abs(euler.y) > 1e-3 || Math.abs(euler.z) > 1e-3;
  return {
    at: roundVec3(worldCenter.x, worldCenter.y, worldCenter.z),
    ...(hasRot ? { rotation: roundVec3(euler.x, euler.y, euler.z) } : {}),
  };
}

interface SurfaceCandidate {
  y: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  area: number;
}

function detectFlatSurfaces(
  root: T.Object3D,
  invRoot: T.Matrix4,
  excludeRoots: ReadonlySet<T.Object3D>,
): SurfaceSpec[] {
  const byBand = new Map<number, SurfaceCandidate>();
  const meshBoxes: T.Box3[] = [];
  const rel = new T.Matrix4();
  const v0 = new T.Vector3();
  const v1 = new T.Vector3();
  const v2 = new T.Vector3();
  const e1 = new T.Vector3();
  const e2 = new T.Vector3();
  const cross = new T.Vector3();

  root.traverse(child => {
    if (child.userData.studioOverlay || !(child instanceof T.Mesh)) return;
    if (isDescendantOfAny(child, excludeRoots)) return;
    const mesh = child as TypedMesh;
    const pos = mesh.geometry.getAttribute('position') as T.BufferAttribute | undefined;
    if (!pos || pos.count < 3) return;
    rel.multiplyMatrices(invRoot, mesh.matrixWorld);
    const mBox = new T.Box3();
    for (let i = 0; i < pos.count; i++) {
      v0.fromBufferAttribute(pos, i).applyMatrix4(rel);
      mBox.expandByPoint(v0);
    }
    if (!mBox.isEmpty()) meshBoxes.push(mBox);

    const flip = rel.determinant() < 0;
    const idx = mesh.geometry.index;
    const triCount = Math.floor((idx ? idx.count : pos.count) / 3);
    for (let t = 0; t < triCount; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3;
      const i1 = idx ? idx.getX(t * 3 + (flip ? 2 : 1)) : t * 3 + (flip ? 2 : 1);
      const i2 = idx ? idx.getX(t * 3 + (flip ? 1 : 2)) : t * 3 + (flip ? 1 : 2);
      v0.fromBufferAttribute(pos, i0).applyMatrix4(rel);
      v1.fromBufferAttribute(pos, i1).applyMatrix4(rel);
      v2.fromBufferAttribute(pos, i2).applyMatrix4(rel);
      e1.subVectors(v1, v0);
      e2.subVectors(v2, v0);
      cross.crossVectors(e1, e2);
      const mag = cross.length();
      if (mag < 1e-6) continue;
      if (cross.y / mag < 0.992) continue;
      const avgY = (v0.y + v1.y + v2.y) / 3;
      if (avgY < 0.2) continue;
      const area = mag * 0.5;
      const band = Math.round(avgY * 50); // 2cm height bands
      const cur = byBand.get(band);
      const minX = Math.min(v0.x, v1.x, v2.x);
      const maxX = Math.max(v0.x, v1.x, v2.x);
      const minZ = Math.min(v0.z, v1.z, v2.z);
      const maxZ = Math.max(v0.z, v1.z, v2.z);
      if (!cur) {
        byBand.set(band, { y: avgY, minX, maxX, minZ, maxZ, area });
      } else {
        cur.area += area;
        if (minX < cur.minX) cur.minX = minX;
        if (maxX > cur.maxX) cur.maxX = maxX;
        if (minZ < cur.minZ) cur.minZ = minZ;
        if (maxZ > cur.maxZ) cur.maxZ = maxZ;
      }
    }
  });

  const candidates = [...byBand.values()]
    .filter(c => c.area >= 0.16 && (c.maxX - c.minX) >= 0.3 && (c.maxZ - c.minZ) >= 0.3)
    .sort((a, b) => b.area - a.area);

  const selected: SurfaceSpec[] = [];
  const usedHeights: number[] = [];
  for (const c of candidates) {
    if (selected.length >= 4) break;
    if (usedHeights.some(y => Math.abs(y - c.y) < 0.14)) continue;
    const cx = (c.minX + c.maxX) * 0.5;
    const cz = (c.minZ + c.maxZ) * 0.5;
    const w = c.maxX - c.minX;
    const d = c.maxZ - c.minZ;
    // Measure overhead headroom directly above the inner 60% of the surface.
    let headroom = Infinity;
    let occluded = false;
    const innerMinX = cx - w * 0.3, innerMaxX = cx + w * 0.3;
    const innerMinZ = cz - d * 0.3, innerMaxZ = cz + d * 0.3;
    for (const mb of meshBoxes) {
      if (mb.max.x <= innerMinX || mb.min.x >= innerMaxX || mb.max.z <= innerMinZ || mb.min.z >= innerMaxZ) continue;
      if (mb.min.y < c.y + 0.02 && mb.max.y > c.y + 0.05) {
        // A solid mesh passes right through the center of this flat band (e.g. a wall base flange).
        occluded = true;
        break;
      }
      if (mb.min.y >= c.y + 0.02) {
        const gap = mb.min.y - c.y;
        if (gap < headroom) headroom = gap;
      }
    }
    if (occluded || headroom < 0.2) continue;
    usedHeights.push(c.y);
    const index = selected.length + 1;
    const name = selected.length === 0 ? 'TopSurface' : `Surface${String(index)}`;
    selected.push({
      name,
      label: selected.length === 0 ? 'Top surface' : `Surface ${String(index)}`,
      at: roundVec3(cx, c.y, cz),
      normal: [0, 1, 0],
      size: [r3(w), r3(d)],
      ...(Number.isFinite(headroom) ? { clearanceY: r3(headroom) } : {}),
    });
  }
  return selected;
}

/**
 * Automatically derive compound colliders, door/slide clearance sweep zones, and usable flat support
 * surfaces from any Three.js asset hierarchy. Coordinates are stored in asset-root (or node-local) space.
 */
export function deriveSpatialMetadata(
  root: T.Object3D,
  riggedParts: readonly RiggedPartSpec[] = [],
  detachableParts: readonly DetachablePartSpec[] = [],
): DerivedSpatialMetadata {
  root.updateMatrixWorld(true);
  const invRoot = root.matrixWorld.clone().invert();
  const dynamicNodes = new Set<T.Object3D>();
  const activeRigged: { part: RiggedPartSpec; node: T.Object3D }[] = [];
  const activeDetachable: { part: DetachablePartSpec; node: T.Object3D }[] = [];

  for (const part of riggedParts) {
    if (isSpinnerPart(part)) continue;
    const node = root.getObjectByName(part.name);
    if (!node) continue;
    dynamicNodes.add(node);
    activeRigged.push({ part, node });
  }
  for (const det of detachableParts) {
    const node = root.getObjectByName(det.name);
    if (!node || dynamicNodes.has(node)) continue;
    dynamicNodes.add(node);
    activeDetachable.push({ part: det, node });
  }

  const colliders: ColliderSpec[] = [];
  const clearanceZones: ClearanceZoneSpec[] = [];

  // 1. Static body collider (excluding articulated doors/slides and detachable groups).
  const staticBox = computeBoxInFrame(root, invRoot, dynamicNodes);
  if (!staticBox.isEmpty()) {
    const center = staticBox.getCenter(new T.Vector3());
    const size = staticBox.getSize(new T.Vector3());
    if (size.x > 0.01 && size.y > 0.01 && size.z > 0.01) {
      colliders.push({
        name: 'Body',
        shape: 'box',
        at: roundVec3(center.x, center.y, center.z),
        size: roundVec3(size.x, size.y, size.z),
        layer: 'solid',
        describe: 'Primary static structure collider',
      });
    }
  }

  // 2. Node-bound colliders + swept clearance zones for interactive doors, hatches, slides, and arms.
  for (const { part, node } of activeRigged) {
    node.updateMatrixWorld(true);
    const invNode = node.matrixWorld.clone().invert();
    const localBox = computeBoxInFrame(node, invNode);
    if (localBox.isEmpty()) continue;
    const localCenter = localBox.getCenter(new T.Vector3());
    const localSize = localBox.getSize(new T.Vector3());
    const safeSize: [number, number, number] = [
      Math.max(0.01, localSize.x),
      Math.max(0.01, localSize.y),
      Math.max(0.01, localSize.z),
    ];
    colliders.push({
      name: part.name,
      shape: 'box',
      at: roundVec3(localCenter.x, localCenter.y, localCenter.z),
      size: roundVec3(safeSize[0], safeSize[1], safeSize[2]),
      node: part.name,
      restPose: computeRestPose(node, localCenter, invRoot),
      layer: colliderLayerForPart(part),
      ...(part.describe ? { describe: part.describe } : {}),
    });

    // Sweep the node-local bounding box across 13 evenly spaced poses to enclose its exact travel volume.
    const restPos = node.position.clone();
    const restQuat = node.quaternion.clone();
    const axis = axisVector(part.axis);
    const corners = boxCorners(localBox);
    const sweepBox = new T.Box3();
    const rel = new T.Matrix4();
    const pt = new T.Vector3();
    const sampleCount = 13;
    try {
      for (let i = 0; i < sampleCount; i++) {
        const t = i / (sampleCount - 1);
        const value = part.range[0] + (part.range[1] - part.range[0]) * t;
        node.position.copy(restPos);
        node.quaternion.copy(restQuat);
        if (part.type === 'slide') {
          node.position.addScaledVector(axis, value);
        } else {
          node.quaternion.multiply(new T.Quaternion().setFromAxisAngle(axis, T.MathUtils.degToRad(value)));
        }
        node.updateMatrixWorld(true);
        rel.multiplyMatrices(invRoot, node.matrixWorld);
        for (const corner of corners) {
          pt.copy(corner).applyMatrix4(rel);
          if (Number.isFinite(pt.x) && Number.isFinite(pt.y) && Number.isFinite(pt.z)) sweepBox.expandByPoint(pt);
        }
      }
    } finally {
      node.position.copy(restPos);
      node.quaternion.copy(restQuat);
      node.updateMatrixWorld(true);
    }
    if (!sweepBox.isEmpty()) {
      sweepBox.expandByScalar(0.01); // Account for discrete arc-chord sagitta
      const sc = sweepBox.getCenter(new T.Vector3());
      const ss = sweepBox.getSize(new T.Vector3());
      clearanceZones.push({
        name: `${part.name}Clearance`,
        kind: part.type === 'slide' ? 'slide' : 'swing',
        at: roundVec3(sc.x, sc.y, sc.z),
        size: roundVec3(Math.max(0.02, ss.x), Math.max(0.02, ss.y), Math.max(0.02, ss.z)),
        part: part.name,
        describe: `Swept ${part.type} clearance volume for ${part.label}`,
      });
    }
  }

  // 3. Node-bound colliders for detachable accessories (skipped automatically when hidden).
  for (const { part, node } of activeDetachable) {
    node.updateMatrixWorld(true);
    const invNode = node.matrixWorld.clone().invert();
    const localBox = computeBoxInFrame(node, invNode);
    if (localBox.isEmpty()) continue;
    const localCenter = localBox.getCenter(new T.Vector3());
    const localSize = localBox.getSize(new T.Vector3());
    colliders.push({
      name: part.name,
      shape: 'box',
      at: roundVec3(localCenter.x, localCenter.y, localCenter.z),
      size: roundVec3(Math.max(0.01, localSize.x), Math.max(0.01, localSize.y), Math.max(0.01, localSize.z)),
      node: part.name,
      restPose: computeRestPose(node, localCenter, invRoot),
      layer: 'solid',
      ...(part.describe ? { describe: part.describe } : {}),
    });
  }

  // 4. Flat upward-facing placement surfaces.
  const surfaces = detectFlatSurfaces(root, invRoot, dynamicNodes);

  return { colliders, clearanceZones, surfaces };
}
