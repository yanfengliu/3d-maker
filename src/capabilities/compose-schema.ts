import type { AssetCapabilities, Axis } from './schema';

export type PhysicsCoupling = 'weld' | 'surface' | 'joint';
export type CompositeJointType = 'hinge' | 'slider' | 'ball';

export interface CompositeJointSpec {
  type: CompositeJointType;
  axis?: Axis;
  range?: [number, number];
}

export interface CompositeRestTransform {
  at: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  /** Optional exact 16-element column-major Matrix4 when parent scale + rotation introduces shear. */
  matrix?: number[];
}

export interface CompositeMountSpec {
  /** Optional sibling/parent child ID this child mounts onto (omit to mount directly on composite root). */
  parent?: string;
  /** Optional node name inside the parent hierarchy (e.g. a crane boom or truck bed) to follow dynamically. */
  attachNode?: string;
  /** Optional parent-local rest transform of `attachNode` so headless JSON placement checks resolve accurate world frames. */
  attachRestPose?: CompositeRestTransform;
  /** Optional parent-local rest transform of this child's slot after surface seating and attachment resolution. */
  slotRestPose?: CompositeRestTransform;
  /** Optional SurfaceSpec name on the host to seat this child flush onto. */
  surface?: string;
  /** Local [x, y, z] position in meters (or offset from surface center when `surface` is set). */
  at?: [number, number, number];
  /** Local XYZ Euler rotation in radians. */
  rotation?: [number, number, number];
  /** Local scale multiplier (uniform or per-axis). */
  scale?: number | [number, number, number];
  /** Physics coupling law between this child and its host (`weld`, `surface`, or `joint`). */
  coupling: PhysicsCoupling;
  /** Optional articulated joint metadata when `coupling === 'joint'`. */
  joint?: CompositeJointSpec;
}

export interface CompositeChildSpec {
  /** Unique child identifier within this composite (used for scoped paths like `fridge/FridgeDoor`). */
  id: string;
  /** Human-readable label for UI, debugging, and AI inspection. */
  label: string;
  /** Scene node name of the wrapper group holding this child (`Slot_<id>`). */
  slotNode: string;
  /** Optional prefix applied to child internal node/track names for collision-free GLB export (`${id}__`). */
  nodePrefix?: string;
  /** Placement, attachment target, and physics coupling law. */
  mount: CompositeMountSpec;
  /** Optional declarative starter recipe preserving live structural knobs and rebuildability. */
  recipe?: Record<string, unknown>;
  /** Snapshot of this child's self-describing capability manifest. */
  capabilities: AssetCapabilities;
}

export const COMPOSITE_CHILD_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,59}$/;
export const MAX_COMPOSITE_CHILDREN = 64;
export const MAX_SCOPED_NAME_LEN = 256;

const maxLabelLen = MAX_SCOPED_NAME_LEN;
const couplings = new Set<PhysicsCoupling>(['weld', 'surface', 'joint']);
const jointTypes = new Set<CompositeJointType>(['hinge', 'slider', 'ball']);
const axes = new Set<Axis>(['x', 'y', 'z']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function trimText(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLen) : undefined;
}

function tuple3(value: unknown): [number, number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 3) return undefined;
  const nums = value.map(Number);
  return nums.every(Number.isFinite) ? [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0] : undefined;
}

function tuple2(value: unknown): [number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  const nums = value.map(Number);
  return nums.every(Number.isFinite) ? [nums[0] ?? 0, nums[1] ?? 0] : undefined;
}

function parseJoint(value: unknown): CompositeJointSpec | undefined {
  if (!isRecord(value) || typeof value.type !== 'string' || !jointTypes.has(value.type as CompositeJointType)) {
    return undefined;
  }
  const axis = typeof value.axis === 'string' && axes.has(value.axis as Axis) ? (value.axis as Axis) : undefined;
  const range = tuple2(value.range);
  return {
    type: value.type as CompositeJointType,
    ...(axis ? { axis } : {}),
    ...(range && range[0] !== range[1] ? { range } : {}),
  };
}

function parseRestTransform(value: unknown): CompositeRestTransform | undefined {
  if (!isRecord(value)) return undefined;
  const poseAt = tuple3(value.at);
  if (!poseAt) return undefined;
  const poseRot = tuple3(value.rotation);
  const poseScale = tuple3(value.scale);
  let matrix: number[] | undefined;
  if (Array.isArray(value.matrix) && value.matrix.length === 16) {
    const nums = value.matrix.map(Number);
    if (nums.every(Number.isFinite)) matrix = nums;
  }
  return {
    at: poseAt,
    ...(poseRot ? { rotation: poseRot } : {}),
    ...(poseScale && poseScale[0] > 0 && poseScale[1] > 0 && poseScale[2] > 0 ? { scale: poseScale } : {}),
    ...(matrix ? { matrix } : {}),
  };
}

function parseMount(value: unknown): CompositeMountSpec | undefined {
  if (!isRecord(value)) return undefined;
  const rawCoupling = typeof value.coupling === 'string' ? value.coupling : 'weld';
  if (!couplings.has(rawCoupling as PhysicsCoupling)) return undefined;
  const parent = trimText(value.parent, 60);
  const attachNode = trimText(value.attachNode, maxLabelLen);
  const attachRestPose = parseRestTransform(value.attachRestPose);
  const slotRestPose = parseRestTransform(value.slotRestPose);
  const surface = trimText(value.surface, maxLabelLen);
  const at = tuple3(value.at);
  const rotation = tuple3(value.rotation);
  let scale: number | [number, number, number] | undefined;
  if (typeof value.scale === 'number' && Number.isFinite(value.scale) && value.scale > 0) {
    scale = value.scale;
  } else {
    const s3 = tuple3(value.scale);
    if (s3 && s3[0] > 0 && s3[1] > 0 && s3[2] > 0) scale = s3;
  }
  const joint = rawCoupling === 'joint' ? parseJoint(value.joint) : undefined;
  return {
    ...(parent ? { parent } : {}),
    ...(attachNode ? { attachNode } : {}),
    ...(attachRestPose ? { attachRestPose } : {}),
    ...(slotRestPose ? { slotRestPose } : {}),
    ...(surface ? { surface } : {}),
    ...(at ? { at } : {}),
    ...(rotation ? { rotation } : {}),
    ...(scale !== undefined ? { scale } : {}),
    coupling: rawCoupling as PhysicsCoupling,
    ...(joint ? { joint } : {}),
  };
}

/** Validate and normalize composite child capability manifests read from GLB extras or JSON. */
export function parseCompositeChildren(
  value: unknown,
  parseChildCapabilities: (raw: unknown) => AssetCapabilities | null,
): CompositeChildSpec[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: CompositeChildSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (out.length >= MAX_COMPOSITE_CHILDREN) break;
    if (!isRecord(row) || typeof row.id !== 'string') continue;
    const id = row.id.trim();
    if (!COMPOSITE_CHILD_ID_PATTERN.test(id) || seen.has(id)) continue;
    const slotNode = trimText(row.slotNode, maxLabelLen);
    const mount = parseMount(row.mount);
    const capabilities = parseChildCapabilities(row.capabilities);
    if (!slotNode || !mount || !capabilities) continue;
    seen.add(id);
    const label = trimText(row.label, maxLabelLen) ?? capabilities.name;
    const nodePrefix = trimText(row.nodePrefix, maxLabelLen);
    const recipe = isRecord(row.recipe) ? structuredClone(row.recipe) : undefined;
    out.push({
      id,
      label,
      slotNode,
      ...(nodePrefix ? { nodePrefix } : {}),
      mount,
      ...(recipe ? { recipe } : {}),
      capabilities,
    });
  }
  return out.length ? out : undefined;
}
