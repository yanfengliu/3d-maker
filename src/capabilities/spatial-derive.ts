import * as T from 'three';
import { axisTuple, buildSweepSampleValues, listMimicFollowers, propagateMimicValues, sanitizeMimicLinks, slideOffsetFactor } from './rig-math';
import type {
  ClearanceZoneSpec,
  ColliderLayer,
  ColliderSpec,
  DetachablePartSpec,
  RiggedPartSpec,
  SpatialRestPose,
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

function isSelfSpinner(part: RiggedPartSpec): boolean {
  return Boolean(part.continuous) || (part.type === 'rotate' && Math.abs(part.range[1] - part.range[0]) >= 350);
}

function isEffectiveSpinner(part: RiggedPartSpec, allParts: readonly RiggedPartSpec[]): boolean {
  if (!isSelfSpinner(part)) return false;
  if (!part.mimic) return true;
  // A bounded mimic follower (even multi-turn) sweeps a finite stroke; skip only unbounded continuous chains.
  if (!part.continuous) return false;
  const byName = new Map(allParts.map(p => [p.name, p]));
  let cur: RiggedPartSpec | undefined = part;
  const seen = new Set<string>();
  while (cur?.mimic && !seen.has(cur.name)) {
    seen.add(cur.name);
    cur = byName.get(cur.mimic.part);
  }
  return !cur || Boolean(cur.continuous);
}

function hasNonSpinnerFollower(part: RiggedPartSpec, allParts: readonly RiggedPartSpec[]): boolean {
  return listMimicFollowers(allParts, part.name).some(name => {
    const f = allParts.find(p => p.name === name);
    return Boolean(f && !isEffectiveSpinner(f, allParts));
  });
}

function colliderLayerForPart(part: RiggedPartSpec, allParts: readonly RiggedPartSpec[]): ColliderLayer {
  if (isEffectiveSpinner(part, allParts)) return 'none';
  if (/(door|gate|hatch|shutter|ramp|bridge|lid|drawer|flap|visor)/i.test(part.name)) return 'doorway';
  return 'solid';
}

function isStrictDescendant(candidate: T.Object3D, ancestor: T.Object3D, stopAtRoot: T.Object3D): boolean {
  let cur: T.Object3D | null = candidate.parent;
  while (cur) {
    if (cur === ancestor) return true;
    if (cur === stopAtRoot) return false;
    cur = cur.parent;
  }
  return false;
}

function axisVector(axis: RiggedPartSpec['axis']): T.Vector3 {
  return new T.Vector3(...axisTuple(axis));
}

function isDescendantOfAny(obj: T.Object3D, ancestors: ReadonlySet<T.Object3D>, stopAt?: T.Object3D): boolean {
  let cur: T.Object3D | null = obj;
  while (cur && cur !== stopAt) {
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
    if (excludeRoots && isDescendantOfAny(child, excludeRoots, root)) return;
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
  const { min: a, max: b } = box;
  return [
    new T.Vector3(a.x, a.y, a.z), new T.Vector3(b.x, a.y, a.z), new T.Vector3(a.x, b.y, a.z), new T.Vector3(b.x, b.y, a.z),
    new T.Vector3(a.x, a.y, b.z), new T.Vector3(b.x, a.y, b.z), new T.Vector3(a.x, b.y, b.z), new T.Vector3(b.x, b.y, b.z),
  ];
}

const p6 = (n: number) => Number(Math.abs(n).toPrecision(6));
const r6 = (n: number) => Math.round(n * 1e6) / 1e6 || 0;

function isShearedMatrix(m: T.Matrix4): boolean {
  const e = m.elements;
  const c0 = new T.Vector3(e[0], e[1], e[2]);
  const c1 = new T.Vector3(e[4], e[5], e[6]);
  const c2 = new T.Vector3(e[8], e[9], e[10]);
  const l0 = c0.length(), l1 = c1.length(), l2 = c2.length();
  if (l0 < 1e-9 || l1 < 1e-9 || l2 < 1e-9) return false;
  c0.divideScalar(l0); c1.divideScalar(l1); c2.divideScalar(l2);
  return Math.abs(c0.dot(c1)) > 1e-4 || Math.abs(c1.dot(c2)) > 1e-4 || Math.abs(c2.dot(c0)) > 1e-4;
}

function computeRestPose(
  node: T.Object3D,
  localCenter: T.Vector3,
  invRoot: T.Matrix4,
): SpatialRestPose {
  const rel = new T.Matrix4().multiplyMatrices(invRoot, node.matrixWorld);
  const worldCenter = localCenter.clone().applyMatrix4(rel);
  const pos = new T.Vector3();
  const quat = new T.Quaternion();
  const scl = new T.Vector3();
  rel.decompose(pos, quat, scl);
  const euler = new T.Euler().setFromQuaternion(quat, 'XYZ');
  const hasRot = Math.abs(euler.x) > 1e-3 || Math.abs(euler.y) > 1e-3 || Math.abs(euler.z) > 1e-3;
  const ax = Math.abs(scl.x), ay = Math.abs(scl.y), az = Math.abs(scl.z);
  const hasScale = ax > 1e-9 && ay > 1e-9 && az > 1e-9
    && (Math.abs(ax - 1) > 1e-4 || Math.abs(ay - 1) > 1e-4 || Math.abs(az - 1) > 1e-4);
  const sheared = isShearedMatrix(rel);
  return {
    at: roundVec3(worldCenter.x, worldCenter.y, worldCenter.z),
    ...(hasRot ? { rotation: roundVec3(euler.x, euler.y, euler.z) } : {}),
    ...(hasScale ? { scale: [p6(ax), p6(ay), p6(az)] } : {}),
    ...(sheared ? { matrix: rel.elements.map(r6) } : {}),
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
  const liveParts = sanitizeMimicLinks(riggedParts.filter(p => Boolean(root.getObjectByName(p.name))));
  const dynamicNodes = new Set<T.Object3D>();
  const activeRigged: { part: RiggedPartSpec; node: T.Object3D }[] = [];
  const sweepLeaders: { part: RiggedPartSpec; node: T.Object3D }[] = [];
  const activeDetachable: { part: DetachablePartSpec; node: T.Object3D }[] = [];

  for (const part of liveParts) {
    const node = root.getObjectByName(part.name);
    if (!node) continue;
    const nonSpinner = !isEffectiveSpinner(part, liveParts);
    if (nonSpinner) {
      dynamicNodes.add(node);
      activeRigged.push({ part, node });
    }
    if (!part.mimic && (nonSpinner || hasNonSpinnerFollower(part, liveParts))) {
      sweepLeaders.push({ part, node });
    }
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

  // 2a. Node-bound colliders for every non-spinner interactive rigged part (leaders and followers alike).
  const localCornersByNode = new Map<T.Object3D, T.Vector3[]>();
  for (const { part, node } of activeRigged) {
    node.updateMatrixWorld(true);
    const invNode = node.matrixWorld.clone().invert();
    const localBox = computeBoxInFrame(node, invNode, dynamicNodes);
    if (localBox.isEmpty()) continue;
    localCornersByNode.set(node, boxCorners(localBox));
    const localCenter = localBox.getCenter(new T.Vector3());
    const localSize = localBox.getSize(new T.Vector3());
    const restPose = computeRestPose(node, localCenter, invRoot);
    const sx = restPose.scale?.[0] ?? 1, sy = restPose.scale?.[1] ?? 1, sz = restPose.scale?.[2] ?? 1;
    colliders.push({
      name: part.name,
      shape: 'box',
      at: roundVec3(localCenter.x, localCenter.y, localCenter.z),
      size: roundVec3(
        Math.max(0.01 / Math.max(1e-4, sx), localSize.x),
        Math.max(0.01 / Math.max(1e-4, sy), localSize.y),
        Math.max(0.01 / Math.max(1e-4, sz), localSize.z),
      ),
      node: part.name,
      restPose,
      layer: colliderLayerForPart(part, liveParts),
      ...(part.describe ? { describe: part.describe } : {}),
    });
  }
  for (const { node } of activeDetachable) {
    node.updateMatrixWorld(true);
    const dBox = computeBoxInFrame(node, node.matrixWorld.clone().invert(), dynamicNodes);
    if (!dBox.isEmpty()) localCornersByNode.set(node, boxCorners(dBox));
  }

  // 2b. Per-part swept clearance zones (tagged with each part's own name so hiding leader or follower independently updates placement).
  for (const { part, node } of sweepLeaders) {
    const restPos = node.position.clone();
    const restQuat = node.quaternion.clone();
    const axis = axisVector(part.axis);
    const leaderSlideScale = slideOffsetFactor(part);
    const followerNames = listMimicFollowers(liveParts, part.name);
    const followerStates = followerNames
      .map(fname => {
        const fSpec = liveParts.find(p => p.name === fname);
        const fNode = root.getObjectByName(fname);
        if (!fSpec || !fNode) return null;
        return {
          spec: fSpec, node: fNode, restPos: fNode.position.clone(), restQuat: fNode.quaternion.clone(),
          axis: axisVector(fSpec.axis), slideScale: slideOffsetFactor(fSpec),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    interface TrackedZone { spec: RiggedPartSpec; host: T.Object3D; boxes: { node: T.Object3D; corners: T.Vector3[] }[]; sweepBox: T.Box3 }
    const movingCarriers: { spec: RiggedPartSpec; node: T.Object3D }[] = [
      ...(!isEffectiveSpinner(part, liveParts) ? [{ spec: part, node }] : []),
      ...followerStates.filter(fs => !isEffectiveSpinner(fs.spec, liveParts)).map(fs => ({ spec: fs.spec, node: fs.node })),
    ];
    const trackedByNode = new Map<T.Object3D, TrackedZone>();
    for (const c of movingCarriers) {
      const ownCorners = localCornersByNode.get(c.node) ?? [];
      trackedByNode.set(c.node, {
        spec: c.spec, host: c.node, sweepBox: new T.Box3(),
        boxes: ownCorners.length ? [{ node: c.node, corners: ownCorners }] : [],
      });
    }
    const sweptNodeSet = new Set<T.Object3D>([node, ...followerStates.map(fs => fs.node)]);
    for (const dn of dynamicNodes) {
      if (sweptNodeSet.has(dn)) continue;
      const dnCorners = localCornersByNode.get(dn);
      if (!dnCorners?.length) continue;
      let carrier: T.Object3D | undefined;
      for (const c of movingCarriers) {
        if (!isStrictDescendant(dn, c.node, root)) continue;
        if (!carrier || isStrictDescendant(c.node, carrier, root)) carrier = c.node;
      }
      if (carrier) trackedByNode.get(carrier)?.boxes.push({ node: dn, corners: dnCorners });
    }
    const activeTracked = [...trackedByNode.values()].filter(tz => tz.boxes.length > 0);
    if (!activeTracked.length) continue;

    const sampleValues = buildSweepSampleValues(part, liveParts, { minSteps: 13, degPerStep: 15, maxTotalSteps: 144 });
    const rel = new T.Matrix4();
    const pt = new T.Vector3();
    try {
      for (const value of sampleValues) {
        node.position.copy(restPos);
        node.quaternion.copy(restQuat);
        if (part.type === 'slide') node.position.addScaledVector(axis, value * leaderSlideScale);
        else node.quaternion.multiply(new T.Quaternion().setFromAxisAngle(axis, T.MathUtils.degToRad(value)));
        if (followerStates.length) {
          const coupled = propagateMimicValues(liveParts, part.name, value);
          for (const fs of followerStates) {
            const fVal = coupled.get(fs.spec.name) ?? 0;
            fs.node.position.copy(fs.restPos);
            fs.node.quaternion.copy(fs.restQuat);
            if (fs.spec.type === 'slide') fs.node.position.addScaledVector(fs.axis, fVal * fs.slideScale);
            else fs.node.quaternion.multiply(new T.Quaternion().setFromAxisAngle(fs.axis, T.MathUtils.degToRad(fVal)));
          }
        }
        root.updateMatrixWorld(true);
        for (const tz of activeTracked) {
          for (const item of tz.boxes) {
            rel.multiplyMatrices(invRoot, item.node.matrixWorld);
            for (const corner of item.corners) {
              pt.copy(corner).applyMatrix4(rel);
              if (Number.isFinite(pt.x) && Number.isFinite(pt.y) && Number.isFinite(pt.z)) tz.sweepBox.expandByPoint(pt);
            }
          }
        }
      }
    } finally {
      node.position.copy(restPos);
      node.quaternion.copy(restQuat);
      for (const fs of followerStates) {
        fs.node.position.copy(fs.restPos);
        fs.node.quaternion.copy(fs.restQuat);
      }
      root.updateMatrixWorld(true);
    }
    for (const tz of activeTracked) {
      if (tz.sweepBox.isEmpty()) continue;
      tz.sweepBox.expandByScalar(0.01);
      const sc = tz.sweepBox.getCenter(new T.Vector3());
      const ss = tz.sweepBox.getSize(new T.Vector3());
      clearanceZones.push({
        name: `${tz.spec.name}Clearance`,
        kind: tz.spec.type === 'slide' ? 'slide' : 'swing',
        at: roundVec3(sc.x, sc.y, sc.z),
        size: roundVec3(Math.max(0.02, ss.x), Math.max(0.02, ss.y), Math.max(0.02, ss.z)),
        part: tz.spec.name,
        describe: `Swept ${tz.spec.type} clearance volume for ${tz.spec.label}`,
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
    const restPose = computeRestPose(node, localCenter, invRoot);
    const sx = restPose.scale?.[0] ?? 1, sy = restPose.scale?.[1] ?? 1, sz = restPose.scale?.[2] ?? 1;
    colliders.push({
      name: part.name,
      shape: 'box',
      at: roundVec3(localCenter.x, localCenter.y, localCenter.z),
      size: roundVec3(
        Math.max(0.01 / Math.max(1e-4, sx), localSize.x),
        Math.max(0.01 / Math.max(1e-4, sy), localSize.y),
        Math.max(0.01 / Math.max(1e-4, sz), localSize.z),
      ),
      node: part.name,
      restPose,
      layer: 'solid',
      ...(part.describe ? { describe: part.describe } : {}),
    });
  }

  // 4. Flat upward-facing placement surfaces.
  const surfaces = detectFlatSurfaces(root, invRoot, dynamicNodes);

  return { colliders, clearanceZones, surfaces };
}
