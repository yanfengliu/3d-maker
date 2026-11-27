export type ColliderShape = 'box' | 'capsule' | 'cylinder';
export type ColliderLayer = 'solid' | 'walkable' | 'doorway' | 'none';
export type ClearanceZoneKind = 'swing' | 'slide' | 'cavity' | 'access';

export interface SpatialRestPose {
  /** Center in asset-root local meters at rest pose (used by JSON-only planners without a Three.js tree). */
  at: [number, number, number];
  /** Optional asset-root local XYZ Euler rotation in radians at rest pose. */
  rotation?: [number, number, number];
}

export interface ColliderSpec {
  name: string;
  shape: ColliderShape;
  /** Local center in meters (relative to `node` when set, otherwise asset root). */
  at: [number, number, number];
  /** Full box extents [w, h, d] in meters (required when shape === 'box'). */
  size?: [number, number, number];
  /** Cylinder or capsule radius in meters (required when shape === 'cylinder' | 'capsule'). */
  radius?: number;
  /** Cylinder or capsule total height along local Y in meters (required when shape === 'cylinder' | 'capsule'). */
  height?: number;
  /** Optional local XYZ Euler rotation in radians. */
  rotation?: [number, number, number];
  /** Optional Three.js node name this collider follows dynamically (e.g. a hinged door or detachable rack). */
  node?: string;
  /** Asset-root rest pose for node-bound colliders so headless JSON planners can validate without loading meshes. */
  restPose?: SpatialRestPose;
  /** Semantic collision layer for simulations (defaults to 'solid'). */
  layer?: ColliderLayer;
  describe?: string;
}

export interface ClearanceZoneSpec {
  name: string;
  kind: ClearanceZoneKind;
  /** Center in asset-root local meters. */
  at: [number, number, number];
  /** Full oriented box extents [w, h, d] in meters. */
  size: [number, number, number];
  /** Optional asset-root local XYZ Euler rotation in radians. */
  rotation?: [number, number, number];
  /** Optional rigged part name this clearance zone protects. */
  part?: string;
  describe?: string;
}

export interface SurfaceSpec {
  name: string;
  label: string;
  /** Center of the flat support plane in asset-root local meters. */
  at: [number, number, number];
  /** Outward unit normal of the support surface (typically [0, 1, 0]). */
  normal: [number, number, number];
  /** Usable [width, depth] in meters along the surface plane. */
  size: [number, number];
  /** Optional safe vertical headroom above the surface in meters. */
  clearanceY?: number;
  /** Optional node name the surface belongs to (omitted when that detachable part is hidden). */
  node?: string;
  describe?: string;
}

const maxColliders = 64;
const maxClearanceZones = 32;
const maxSurfaces = 32;
const maxNameLen = 160;
const maxDescLen = 280;

const shapes = new Set<ColliderShape>(['box', 'capsule', 'cylinder']);
const layers = new Set<ColliderLayer>(['solid', 'walkable', 'doorway', 'none']);
const clearanceKinds = new Set<ClearanceZoneKind>(['swing', 'slide', 'cavity', 'access']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function trimText(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLen) : undefined;
}

function tuple3(value: unknown): [number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const nums = value.map(Number);
  return nums.every(Number.isFinite) ? [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0] : null;
}

function tuple2(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const nums = value.map(Number);
  return nums.every(Number.isFinite) ? [nums[0] ?? 0, nums[1] ?? 0] : null;
}

function positiveNum(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function parseRestPose(value: unknown): SpatialRestPose | undefined {
  if (!isRecord(value)) return undefined;
  const at = tuple3(value.at);
  if (!at) return undefined;
  const rotation = tuple3(value.rotation) ?? undefined;
  return { at, ...(rotation ? { rotation } : {}) };
}

function humanizeSpatialLabel(raw: string): string {
  const spaced = raw
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : raw;
}

export function parseColliders(value: unknown): ColliderSpec[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: ColliderSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (out.length >= maxColliders) break;
    if (!isRecord(row)) continue;
    const name = trimText(row.name, maxNameLen);
    if (!name || seen.has(name)) continue;
    const shape = row.shape;
    if (typeof shape !== 'string' || !shapes.has(shape as ColliderShape)) continue;
    const at = tuple3(row.at);
    if (!at) continue;
    const typedShape = shape as ColliderShape;
    let size: [number, number, number] | undefined;
    let radius: number | undefined;
    let height: number | undefined;
    if (typedShape === 'box') {
      const parsed = tuple3(row.size);
      if (!parsed || parsed[0] <= 0 || parsed[1] <= 0 || parsed[2] <= 0) continue;
      size = parsed;
    } else {
      radius = positiveNum(row.radius);
      height = positiveNum(row.height);
      if (radius === undefined || height === undefined) continue;
    }
    seen.add(name);
    const rotation = tuple3(row.rotation) ?? undefined;
    const node = trimText(row.node, maxNameLen);
    const restPose = parseRestPose(row.restPose);
    const layer = typeof row.layer === 'string' && layers.has(row.layer as ColliderLayer)
      ? (row.layer as ColliderLayer)
      : undefined;
    const describe = trimText(row.describe, maxDescLen);
    out.push({
      name,
      shape: typedShape,
      at,
      ...(size ? { size } : {}),
      ...(radius !== undefined ? { radius } : {}),
      ...(height !== undefined ? { height } : {}),
      ...(rotation ? { rotation } : {}),
      ...(node ? { node } : {}),
      ...(restPose ? { restPose } : {}),
      ...(layer ? { layer } : {}),
      ...(describe ? { describe } : {}),
    });
  }
  return out.length ? out : undefined;
}

export function parseClearanceZones(value: unknown): ClearanceZoneSpec[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: ClearanceZoneSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (out.length >= maxClearanceZones) break;
    if (!isRecord(row)) continue;
    const name = trimText(row.name, maxNameLen);
    if (!name || seen.has(name)) continue;
    const kind = row.kind;
    if (typeof kind !== 'string' || !clearanceKinds.has(kind as ClearanceZoneKind)) continue;
    const at = tuple3(row.at);
    const size = tuple3(row.size);
    if (!at || !size || size[0] <= 0 || size[1] <= 0 || size[2] <= 0) continue;
    seen.add(name);
    const rotation = tuple3(row.rotation) ?? undefined;
    const part = trimText(row.part, maxNameLen);
    const describe = trimText(row.describe, maxDescLen);
    out.push({
      name,
      kind: kind as ClearanceZoneKind,
      at,
      size,
      ...(rotation ? { rotation } : {}),
      ...(part ? { part } : {}),
      ...(describe ? { describe } : {}),
    });
  }
  return out.length ? out : undefined;
}

export function parseSurfaces(value: unknown): SurfaceSpec[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: SurfaceSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (out.length >= maxSurfaces) break;
    if (!isRecord(row)) continue;
    const name = trimText(row.name, maxNameLen);
    if (!name || seen.has(name)) continue;
    const at = tuple3(row.at);
    const normal = tuple3(row.normal);
    const size = tuple2(row.size);
    if (!at || !normal || !size || size[0] <= 0 || size[1] <= 0) continue;
    const nLen = Math.hypot(normal[0], normal[1], normal[2]);
    if (nLen < 1e-5) continue;
    seen.add(name);
    const label = trimText(row.label, maxNameLen) ?? humanizeSpatialLabel(name);
    const clearanceY = positiveNum(row.clearanceY);
    const node = trimText(row.node, maxNameLen);
    const describe = trimText(row.describe, maxDescLen);
    out.push({
      name,
      label,
      at,
      normal: [normal[0] / nLen, normal[1] / nLen, normal[2] / nLen],
      size,
      ...(clearanceY !== undefined ? { clearanceY } : {}),
      ...(node ? { node } : {}),
      ...(describe ? { describe } : {}),
    });
  }
  return out.length ? out : undefined;
}
