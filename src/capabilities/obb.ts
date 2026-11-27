import * as T from 'three';
import { findOwnNodeByName, hasHiddenAncestor, isHiddenPartName, mountLocalMatrix } from './compose-tree';
import {
  readCapabilities,
  type AssetCapabilities,
  type ClearanceZoneKind,
  type ColliderLayer,
  type ColliderSpec,
} from './schema';

export type Vec3Tuple = [number, number, number];

export interface OrientedBox {
  id: string;
  name: string;
  ownerId: string;
  kind: 'collider' | 'clearance';
  layer: ColliderLayer | ClearanceZoneKind;
  part?: string;
  center: Vec3Tuple;
  halfExtents: Vec3Tuple;
  /** Three orthonormal world-space unit axis vectors [ax, ay, az]. */
  axes: [Vec3Tuple, Vec3Tuple, Vec3Tuple];
  aabbMin: Vec3Tuple;
  aabbMax: Vec3Tuple;
}

export interface ScenePlacementItem {
  id: string;
  /** Live Three.js Object3D (uses live node.matrixWorld and node visibility). */
  object?: T.Object3D;
  /** Capabilities manifest (read from `object` automatically when omitted). */
  capabilities?: AssetCapabilities;
  /** World transform used for headless JSON descriptors when `object` is omitted. */
  position?: Vec3Tuple;
  /** World XYZ Euler rotation in radians (used when `object` is omitted). */
  rotation?: Vec3Tuple;
  /** World scale (used when `object` is omitted; defaults to [1, 1, 1]). */
  scale?: Vec3Tuple | number;
  /** Hidden detachable part names to exclude in headless JSON mode. */
  hiddenParts?: readonly string[];
  /** Optional node name prefix when resolving scoped composite child objects. */
  nodePrefix?: string;
}

export interface ResolveVolumeOptions {
  includeColliders?: boolean;
  includeClearanceZones?: boolean;
  includeNoneLayer?: boolean;
}

export interface PlacementValidationOptions {
  /** Allowed contact tolerance in meters before reporting overlap (default 0.005 m). */
  tolerance?: number;
  /** When true, also flags overlapping swing/slide/access clearance zones across items (default false). */
  checkClearanceOverlap?: boolean;
}

export interface PlacementOverlap {
  kind: 'collision' | 'clearance-blocked' | 'clearance-overlap';
  itemA: string;
  volumeA: string;
  itemB: string;
  volumeB: string;
  penetrationM: number;
}

export interface PlacementValidationResult {
  valid: boolean;
  overlaps: PlacementOverlap[];
  checkedPairs: number;
}

function dot(a: Vec3Tuple, b: Vec3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function isVisibleInTree(obj: T.Object3D): boolean {
  let cur: T.Object3D | null = obj;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

export function colliderHalfExtents(spec: ColliderSpec): Vec3Tuple {
  if (spec.shape === 'box' && spec.size) {
    return [spec.size[0] * 0.5, spec.size[1] * 0.5, spec.size[2] * 0.5];
  }
  const r = spec.radius ?? 0.25;
  const h = spec.height ?? 0.5;
  return [r, h * 0.5, r];
}

function localMatrix(at: Vec3Tuple, rotation?: Vec3Tuple): T.Matrix4 {
  const m = new T.Matrix4();
  const q = rotation
    ? new T.Quaternion().setFromEuler(new T.Euler(rotation[0], rotation[1], rotation[2], 'XYZ'))
    : new T.Quaternion();
  m.compose(new T.Vector3(at[0], at[1], at[2]), q, new T.Vector3(1, 1, 1));
  return m;
}

function itemWorldMatrix(item: ScenePlacementItem): T.Matrix4 {
  const pos = item.position ? new T.Vector3(...item.position) : new T.Vector3();
  const q = item.rotation
    ? new T.Quaternion().setFromEuler(new T.Euler(item.rotation[0], item.rotation[1], item.rotation[2], 'XYZ'))
    : new T.Quaternion();
  const s = typeof item.scale === 'number'
    ? new T.Vector3(item.scale, item.scale, item.scale)
    : item.scale
      ? new T.Vector3(...item.scale)
      : new T.Vector3(1, 1, 1);
  return new T.Matrix4().compose(pos, q, s);
}

/** Build an OrientedBox by transforming a local box through a parent world matrix. */
export function buildOrientedBox(
  parentWorld: T.Matrix4,
  at: Vec3Tuple,
  halfExtents: Vec3Tuple,
  meta: {
    id: string;
    name: string;
    ownerId: string;
    kind: 'collider' | 'clearance';
    layer: ColliderLayer | ClearanceZoneKind;
    part?: string;
    rotation?: Vec3Tuple;
  },
): OrientedBox {
  const world = parentWorld.clone().multiply(localMatrix(at, meta.rotation));
  const e = world.elements;
  const cx = e[12], cy = e[13], cz = e[14];
  const col0: Vec3Tuple = [e[0], e[1], e[2]];
  const col1: Vec3Tuple = [e[4], e[5], e[6]];
  const col2: Vec3Tuple = [e[8], e[9], e[10]];
  const sx = Math.hypot(col0[0], col0[1], col0[2]) || 1;
  const sy = Math.hypot(col1[0], col1[1], col1[2]) || 1;
  const sz = Math.hypot(col2[0], col2[1], col2[2]) || 1;
  const ax: Vec3Tuple = [col0[0] / sx, col0[1] / sx, col0[2] / sx];
  const ay: Vec3Tuple = [col1[0] / sy, col1[1] / sy, col1[2] / sy];
  const az: Vec3Tuple = [col2[0] / sz, col2[1] / sz, col2[2] / sz];
  const sheared =
    Math.abs(dot(ax, ay)) > 1e-9 || Math.abs(dot(ay, az)) > 1e-9 || Math.abs(dot(az, ax)) > 1e-9;
  if (sheared) {
    const c0: Vec3Tuple = [col0[0] * Math.abs(halfExtents[0]), col0[1] * Math.abs(halfExtents[0]), col0[2] * Math.abs(halfExtents[0])];
    const c1: Vec3Tuple = [col1[0] * Math.abs(halfExtents[1]), col1[1] * Math.abs(halfExtents[1]), col1[2] * Math.abs(halfExtents[1])];
    const c2: Vec3Tuple = [col2[0] * Math.abs(halfExtents[2]), col2[1] * Math.abs(halfExtents[2]), col2[2] * Math.abs(halfExtents[2])];
    const ox = new T.Vector3(...ax).normalize();
    const oyRaw = new T.Vector3(...ay).addScaledVector(ox, -dot(ay, [ox.x, ox.y, ox.z]));
    const oy = oyRaw.lengthSq() > 1e-8
      ? oyRaw.normalize()
      : new T.Vector3().crossVectors(Math.abs(ox.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0), ox).normalize();
    const oz = new T.Vector3().crossVectors(ox, oy).normalize();
    const oxT: Vec3Tuple = [ox.x, ox.y, ox.z];
    const oyT: Vec3Tuple = [oy.x, oy.y, oy.z];
    const ozT: Vec3Tuple = [oz.x, oz.y, oz.z];
    const ohx = Math.abs(dot(c0, oxT)) + Math.abs(dot(c1, oxT)) + Math.abs(dot(c2, oxT));
    const ohy = Math.abs(dot(c0, oyT)) + Math.abs(dot(c1, oyT)) + Math.abs(dot(c2, oyT));
    const ohz = Math.abs(dot(c0, ozT)) + Math.abs(dot(c1, ozT)) + Math.abs(dot(c2, ozT));
    const rx = Math.abs(c0[0]) + Math.abs(c1[0]) + Math.abs(c2[0]);
    const ry = Math.abs(c0[1]) + Math.abs(c1[1]) + Math.abs(c2[1]);
    const rz = Math.abs(c0[2]) + Math.abs(c1[2]) + Math.abs(c2[2]);
    return {
      id: meta.id,
      name: meta.name,
      ownerId: meta.ownerId,
      kind: meta.kind,
      layer: meta.layer,
      ...(meta.part ? { part: meta.part } : {}),
      center: [cx, cy, cz],
      halfExtents: [ohx, ohy, ohz],
      axes: [oxT, oyT, ozT],
      aabbMin: [cx - rx, cy - ry, cz - rz],
      aabbMax: [cx + rx, cy + ry, cz + rz],
    };
  }
  const hx = Math.abs(halfExtents[0]) * sx;
  const hy = Math.abs(halfExtents[1]) * sy;
  const hz = Math.abs(halfExtents[2]) * sz;
  const rx = Math.abs(ax[0]) * hx + Math.abs(ay[0]) * hy + Math.abs(az[0]) * hz;
  const ry = Math.abs(ax[1]) * hx + Math.abs(ay[1]) * hy + Math.abs(az[1]) * hz;
  const rz = Math.abs(ax[2]) * hx + Math.abs(ay[2]) * hy + Math.abs(az[2]) * hz;
  return {
    id: meta.id,
    name: meta.name,
    ownerId: meta.ownerId,
    kind: meta.kind,
    layer: meta.layer,
    ...(meta.part ? { part: meta.part } : {}),
    center: [cx, cy, cz],
    halfExtents: [hx, hy, hz],
    axes: [ax, ay, az],
    aabbMin: [cx - rx, cy - ry, cz - rz],
    aabbMax: [cx + rx, cy + ry, cz + rz],
  };
}

/** Exact 15-axis Separating Axis Theorem (SAT) overlap test for two OrientedBoxes. */
export function obbOverlap(
  a: OrientedBox,
  b: OrientedBox,
  margin = 0,
): { overlaps: boolean; penetration: number } {
  if (
    a.aabbMax[0] + margin <= b.aabbMin[0] || b.aabbMax[0] + margin <= a.aabbMin[0]
    || a.aabbMax[1] + margin <= b.aabbMin[1] || b.aabbMax[1] + margin <= a.aabbMin[1]
    || a.aabbMax[2] + margin <= b.aabbMin[2] || b.aabbMax[2] + margin <= a.aabbMin[2]
  ) {
    return { overlaps: false, penetration: 0 };
  }
  const t: Vec3Tuple = [
    b.center[0] - a.center[0],
    b.center[1] - a.center[1],
    b.center[2] - a.center[2],
  ];
  const A = a.axes;
  const B = b.axes;
  const ea = a.halfExtents;
  const eb = b.halfExtents;
  const R: [Vec3Tuple, Vec3Tuple, Vec3Tuple] = [
    [dot(A[0], B[0]), dot(A[0], B[1]), dot(A[0], B[2])],
    [dot(A[1], B[0]), dot(A[1], B[1]), dot(A[1], B[2])],
    [dot(A[2], B[0]), dot(A[2], B[1]), dot(A[2], B[2])],
  ];
  const eps = 1e-6;
  const absR: [Vec3Tuple, Vec3Tuple, Vec3Tuple] = [
    [Math.abs(R[0][0]) + eps, Math.abs(R[0][1]) + eps, Math.abs(R[0][2]) + eps],
    [Math.abs(R[1][0]) + eps, Math.abs(R[1][1]) + eps, Math.abs(R[1][2]) + eps],
    [Math.abs(R[2][0]) + eps, Math.abs(R[2][1]) + eps, Math.abs(R[2][2]) + eps],
  ];
  const tA: Vec3Tuple = [dot(t, A[0]), dot(t, A[1]), dot(t, A[2])];

  let minPen = Infinity;
  const testAxis = (dist: number, ra: number, rb: number, axisLen = 1): boolean => {
    const pen = (ra + rb - dist) / axisLen + margin;
    if (pen <= 0) return false;
    if (pen < minPen) minPen = pen;
    return true;
  };

  for (let i = 0; i < 3; i++) {
    const row = absR[i];
    const ra = ea[i];
    const ti = tA[i];
    if (!row || ra === undefined || ti === undefined) continue;
    const rb = eb[0] * row[0] + eb[1] * row[1] + eb[2] * row[2];
    if (!testAxis(Math.abs(ti), ra, rb)) return { overlaps: false, penetration: 0 };
  }
  for (let j = 0; j < 3; j++) {
    const ra = ea[0] * (absR[0][j] ?? 0) + ea[1] * (absR[1][j] ?? 0) + ea[2] * (absR[2][j] ?? 0);
    const rb = eb[j] ?? 0;
    const dist = Math.abs(tA[0] * (R[0][j] ?? 0) + tA[1] * (R[1][j] ?? 0) + tA[2] * (R[2][j] ?? 0));
    if (!testAxis(dist, ra, rb)) return { overlaps: false, penetration: 0 };
  }
  for (let i = 0; i < 3; i++) {
    const i1 = (i + 1) % 3;
    const i2 = (i + 2) % 3;
    const rI = R[i], rI1 = R[i1], rI2 = R[i2];
    const aI = absR[i], aI1 = absR[i1], aI2 = absR[i2];
    if (!rI || !rI1 || !rI2 || !aI || !aI1 || !aI2) continue;
    for (let j = 0; j < 3; j++) {
      const j1 = (j + 1) % 3;
      const j2 = (j + 2) % 3;
      const rij = rI[j] ?? 0;
      const crossSq = 1 - rij * rij;
      if (crossSq < 1e-6) continue;
      const axisLen = Math.sqrt(crossSq);
      const ra = (ea[i1] ?? 0) * (aI2[j] ?? 0) + (ea[i2] ?? 0) * (aI1[j] ?? 0);
      const rb = (eb[j1] ?? 0) * (aI[j2] ?? 0) + (eb[j2] ?? 0) * (aI[j1] ?? 0);
      const dist = Math.abs((tA[i2] ?? 0) * (rI1[j] ?? 0) - (tA[i1] ?? 0) * (rI2[j] ?? 0));
      if (!testAxis(dist, ra, rb, axisLen)) return { overlaps: false, penetration: 0 };
    }
  }
  return { overlaps: true, penetration: Number.isFinite(minPen) ? minPen : 0 };
}

/** Check whether every corner of `inner` lies inside `outer` within `tolerance` meters. */
export function obbContainedIn(inner: OrientedBox, outer: OrientedBox, tolerance = 0.015): boolean {
  const [hx, hy, hz] = inner.halfExtents;
  const [ix, iy, iz] = inner.axes;
  const [ox, oy, oz] = outer.axes;
  const [ohx, ohy, ohz] = outer.halfExtents;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const dx = inner.center[0] + sx * hx * ix[0] + sy * hy * iy[0] + sz * hz * iz[0] - outer.center[0];
        const dy = inner.center[1] + sx * hx * ix[1] + sy * hy * iy[1] + sz * hz * iz[1] - outer.center[1];
        const dz = inner.center[2] + sx * hx * ix[2] + sy * hy * iy[2] + sz * hz * iz[2] - outer.center[2];
        const px = Math.abs(dx * ox[0] + dy * ox[1] + dz * ox[2]);
        const py = Math.abs(dx * oy[0] + dy * oy[1] + dz * oy[2]);
        const pz = Math.abs(dx * oz[0] + dy * oz[1] + dz * oz[2]);
        if (px > ohx + tolerance || py > ohy + tolerance || pz > ohz + tolerance) return false;
      }
    }
  }
  return true;
}

function appendResolvedVolumes(
  volumes: OrientedBox[],
  ownerId: string,
  namePrefix: string,
  object: T.Object3D | undefined,
  caps: AssetCapabilities,
  rootWorld: T.Matrix4,
  hiddenOverride: readonly string[] | undefined,
  nodePrefix: string,
  includeColliders: boolean,
  includeClearanceZones: boolean,
  includeNoneLayer: boolean,
): void {
  if (caps.children?.length) {
    if (object) {
      for (const child of caps.children) {
        const slot = object.getObjectByName(child.slotNode);
        if (!slot || !isVisibleInTree(slot)) continue;
        const inner = slot.children[0] ?? slot;
        if (!isVisibleInTree(inner)) continue;
        appendResolvedVolumes(
          volumes, ownerId, `${namePrefix}${child.id}/`, inner, child.capabilities,
          inner.matrixWorld, undefined, child.nodePrefix ?? '',
          includeColliders, includeClearanceZones, includeNoneLayer,
        );
      }
    } else {
      const childWorldById = new Map<string, T.Matrix4>();
      const childCapsById = new Map<string, AssetCapabilities>();
      for (const child of caps.children) {
        const parentWorld = child.mount.parent ? (childWorldById.get(child.mount.parent) ?? rootWorld) : rootWorld;
        const parentCaps = child.mount.parent ? childCapsById.get(child.mount.parent) : undefined;
        const hostSurface = child.mount.surface ? parentCaps?.surfaces?.find(s => s.name === child.mount.surface) : undefined;
        const childWorld = parentWorld.clone().multiply(mountLocalMatrix(child.mount, hostSurface));
        childWorldById.set(child.id, childWorld);
        childCapsById.set(child.id, child.capabilities);
        appendResolvedVolumes(
          volumes, ownerId, `${namePrefix}${child.id}/`, undefined, child.capabilities,
          childWorld, undefined, child.nodePrefix ?? '',
          includeColliders, includeClearanceZones, includeNoneLayer,
        );
      }
    }
  }

  const hiddenSet = new Set(hiddenOverride ?? caps.state?.hiddenParts ?? []);

  if (includeColliders && caps.colliders) {
    for (const spec of caps.colliders) {
      const layer = spec.layer ?? 'solid';
      if (!includeNoneLayer && layer === 'none') continue;
      const volName = `${namePrefix}${spec.name}`;
      if (spec.node) {
        if (isHiddenPartName(hiddenSet, spec.node, nodePrefix)) continue;
        if (object) {
          const node = findOwnNodeByName(object, spec.node, nodePrefix);
          if (!node || !isVisibleInTree(node) || hasHiddenAncestor(node, object, hiddenSet, nodePrefix)) continue;
          volumes.push(buildOrientedBox(node.matrixWorld, spec.at, colliderHalfExtents(spec), {
            id: `${ownerId}:collider:${volName}`, name: volName, ownerId, kind: 'collider', layer, part: spec.node,
            ...(spec.rotation ? { rotation: spec.rotation } : {}),
          }));
        } else {
          if (!spec.restPose) continue;
          volumes.push(buildOrientedBox(rootWorld, spec.restPose.at, colliderHalfExtents(spec), {
            id: `${ownerId}:collider:${volName}`, name: volName, ownerId, kind: 'collider', layer, part: spec.node,
            ...(spec.restPose.rotation ? { rotation: spec.restPose.rotation } : {}),
          }));
        }
      } else {
        volumes.push(buildOrientedBox(rootWorld, spec.at, colliderHalfExtents(spec), {
          id: `${ownerId}:collider:${volName}`, name: volName, ownerId, kind: 'collider', layer,
          ...(spec.rotation ? { rotation: spec.rotation } : {}),
        }));
      }
    }
  }

  if (includeClearanceZones && caps.clearanceZones) {
    for (const zone of caps.clearanceZones) {
      const volName = `${namePrefix}${zone.name}`;
      if (zone.part && isHiddenPartName(hiddenSet, zone.part, nodePrefix)) continue;
      if (zone.part && object) {
        const node = findOwnNodeByName(object, zone.part, nodePrefix);
        if (node && (!isVisibleInTree(node) || hasHiddenAncestor(node, object, hiddenSet, nodePrefix))) continue;
      }
      volumes.push(buildOrientedBox(
        rootWorld,
        zone.at,
        [zone.size[0] * 0.5, zone.size[1] * 0.5, zone.size[2] * 0.5],
        {
          id: `${ownerId}:clearance:${volName}`,
          name: volName,
          ownerId,
          kind: 'clearance',
          layer: zone.kind,
          ...(zone.part ? { part: zone.part } : {}),
          ...(zone.rotation ? { rotation: zone.rotation } : {}),
        },
      ));
    }
  }
}

/** Resolve all world-space collider and clearance OBBs for a live Three.js object or headless JSON descriptor. */
export function resolveAssetVolumes(
  item: ScenePlacementItem,
  options: ResolveVolumeOptions = {},
): OrientedBox[] {
  const includeColliders = options.includeColliders ?? true;
  const includeClearanceZones = options.includeClearanceZones ?? true;
  const includeNoneLayer = options.includeNoneLayer ?? false;
  const caps = item.capabilities ?? (item.object ? readCapabilities(item.object) ?? undefined : undefined);
  if (!caps) return [];

  if (item.object) item.object.updateMatrixWorld(true);
  const rootWorld = item.object ? item.object.matrixWorld : itemWorldMatrix(item);
  const volumes: OrientedBox[] = [];
  appendResolvedVolumes(
    volumes,
    item.id,
    '',
    item.object,
    caps,
    rootWorld,
    item.hiddenParts,
    item.nodePrefix ?? '',
    includeColliders,
    includeClearanceZones,
    includeNoneLayer,
  );
  return volumes;
}

/** Validate a multi-asset scene layout for solid collisions and blocked door/hatch clearance arcs. */
export function validateScenePlacement(
  items: readonly ScenePlacementItem[],
  options: PlacementValidationOptions = {},
): PlacementValidationResult {
  const tolerance = options.tolerance ?? 0.005;
  const checkClearanceOverlap = options.checkClearanceOverlap ?? false;
  const perItem = items.map(item => resolveAssetVolumes(item));
  const overlaps: PlacementOverlap[] = [];
  let checkedPairs = 0;

  for (let i = 0; i < perItem.length; i++) {
    const volsA = perItem[i];
    if (!volsA) continue;
    for (let j = i + 1; j < perItem.length; j++) {
      const volsB = perItem[j];
      if (!volsB) continue;
      for (const a of volsA) {
        if (a.kind === 'clearance' && a.layer === 'cavity') continue;
        for (const b of volsB) {
          if (b.kind === 'clearance' && b.layer === 'cavity') continue;
          if (a.kind === 'clearance' && b.kind === 'clearance' && !checkClearanceOverlap) continue;
          checkedPairs++;
          const res = obbOverlap(a, b, -tolerance);
          if (!res.overlaps) continue;
          const kind = a.kind === 'collider' && b.kind === 'collider'
            ? 'collision'
            : a.kind === 'clearance' && b.kind === 'clearance'
              ? 'clearance-overlap'
              : 'clearance-blocked';
          overlaps.push({
            kind,
            itemA: a.ownerId,
            volumeA: a.name,
            itemB: b.ownerId,
            volumeB: b.name,
            penetrationM: Math.round(res.penetration * 10000) / 10000,
          });
        }
      }
    }
  }

  return { valid: overlaps.length === 0, overlaps, checkedPairs };
}
