import * as T from 'three';
import { axisTuple, parseAxisSpec, sanitizeMimicLinks, type Axis, type AxisVector, type RiggedMimicSpec } from './rig-math';
import { humanizeLabel, readEmbeddedDecals, type AssetCapabilities, type RiggedPartSpec } from './schema';
import { deriveSpatialMetadata } from './spatial-derive';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;
const MAX_SAND3D_JOINTS = 64;
const MAX_NAME_LEN = 80;

interface RawSand3dJoint {
  node: T.Object3D;
  partName: string;
  extrasName: string;
  kind: 'revolute' | 'continuous' | 'prismatic';
  type: 'rotate' | 'slide';
  axis: Axis | AxisVector;
  range?: [number, number];
  value: number;
  continuous: boolean;
  mimicJoint?: string;
  mimicMultiplier?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function r4(n: number): number {
  return Math.round(n * 1e4) / 1e4 || 0;
}

function r3(n: number): number {
  return Math.round(n * 1e3) / 1e3 || 0;
}

function finiteNum(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readAxisTuple(value: unknown): [number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const x = Number(value[0]);
  const y = Number(value[1]);
  const z = Number(value[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  if (Math.hypot(x, y, z) < 1e-6) return null;
  return [x, y, z];
}

/**
 * Convert Sand3D's node-local Y-up joint axis into Form Foundry's motion axis:
 * - For `revolute`/`continuous`, conjugates across reflection (`det < 0`) so mirrored parts swing symmetrically.
 * - For `prismatic`, rotates by the pivot node's constant rest orientation (plus reflection sign) into parent space
 *   so `node.position = restPos + axis * value` matches `M_rest * T(axis_local * value)` identically.
 */
function convertSand3dAxis(node: T.Object3D, rawAxis: [number, number, number], isSlide: boolean): Axis | AxisVector | null {
  const sx = node.scale.x < 0 ? -1 : 1;
  const sy = node.scale.y < 0 ? -1 : 1;
  const sz = node.scale.z < 0 ? -1 : 1;
  const det = sx * sy * sz;
  const vec = new T.Vector3(rawAxis[0], rawAxis[1], rawAxis[2]);
  if (isSlide) {
    vec.set(sx * rawAxis[0], sy * rawAxis[1], sz * rawAxis[2]).applyQuaternion(node.quaternion);
  } else if (det < 0) {
    vec.set(-sx * rawAxis[0], -sy * rawAxis[1], -sz * rawAxis[2]);
  }
  return parseAxisSpec([vec.x, vec.y, vec.z]);
}

function pickUniqueNodeName(root: T.Object3D, node: T.Object3D, preferred: string, used: Set<string>): string {
  if (node.name && root.getObjectByName(node.name) === node && !used.has(node.name)) {
    used.add(node.name);
    return node.name;
  }
  const base = (preferred.trim() || 'joint').slice(0, MAX_NAME_LEN - 6);
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate) || (root.getObjectByName(candidate) && root.getObjectByName(candidate) !== node)) {
    candidate = `${base}_${String(suffix++)}`;
  }
  node.name = candidate;
  used.add(candidate);
  return candidate;
}

function measureDimensions(root: T.Object3D) {
  root.updateMatrixWorld(true);
  const box = new T.Box3();
  const vertex = new T.Vector3();
  root.traverse(node => {
    if (node.userData.studioOverlay || !(node instanceof T.Mesh)) return;
    const geometry = node.geometry as T.BufferGeometry;
    const pos = geometry.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    if (!pos || !pos.count) return;
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i).applyMatrix4(node.matrixWorld);
      if (Number.isFinite(vertex.x) && Number.isFinite(vertex.y) && Number.isFinite(vertex.z)) box.expandByPoint(vertex);
    }
  });
  if (box.isEmpty()) return undefined;
  const size = box.getSize(new T.Vector3());
  return {
    sizeM: { x: r3(size.x), y: r3(size.y), z: r3(size.z) },
    originY: r3(box.min.y),
  };
}

/** Return true if any node in `root` carries Sand3D's `s3d_joint` glTF extras metadata. */
export function hasSand3dJoints(root: T.Object3D): boolean {
  let found = false;
  root.traverse(node => {
    if (found) return;
    const raw: unknown = node.userData.s3d_joint;
    if (isRecord(raw) && typeof raw.type === 'string') found = true;
  });
  return found;
}

/**
 * Inspect a Sand3D-exported GLB (`node.extras.s3d_joint`) and synthesize a native Form Foundry `AssetCapabilities`
 * manifest with live revolute/continuous/prismatic joints, arbitrary 3D axes, coupled `mimic` followers, initial
 * posed state recovery, and rest-pose derived OBB colliders, clearance zones, and placement surfaces.
 */
export function readSand3dCapabilities(
  root: T.Object3D,
  options: { name?: string; animations?: readonly T.AnimationClip[] } = {},
): AssetCapabilities | null {
  const rawJoints: RawSand3dJoint[] = [];
  const usedPartNames = new Set<string>();
  const extrasToPartName = new Map<string, string>();
  const sand3dNodes: T.Object3D[] = [];

  root.traverse(node => {
    const raw: unknown = node.userData.s3d_joint;
    if (!isRecord(raw) || typeof raw.type !== 'string') return;
    sand3dNodes.push(node);
    if (rawJoints.length >= MAX_SAND3D_JOINTS) return;
    if (raw.type !== 'revolute' && raw.type !== 'continuous' && raw.type !== 'prismatic') return;

    const rawAxis = readAxisTuple(raw.axis);
    if (!rawAxis) return;
    const isSlide = raw.type === 'prismatic';
    const axis = convertSand3dAxis(node, rawAxis, isSlide);
    if (!axis) return;

    const extrasName = typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim().slice(0, MAX_NAME_LEN)
      : (node.name || `joint_${String(rawJoints.length + 1)}`);
    const partName = pickUniqueNodeName(root, node, extrasName, usedPartNames);
    if (!extrasToPartName.has(extrasName)) extrasToPartName.set(extrasName, partName);

    const scale = isSlide ? 1 : RAD_TO_DEG;
    const lowerRaw = finiteNum(raw.lower);
    const upperRaw = finiteNum(raw.upper);
    let range: [number, number] | undefined;
    if (lowerRaw !== undefined && upperRaw !== undefined && Math.abs(upperRaw - lowerRaw) > 1e-9) {
      range = isSlide ? [r4(lowerRaw), r4(upperRaw)] : [r3(lowerRaw * scale), r3(upperRaw * scale)];
    }

    const valueRaw = finiteNum(raw.value) ?? 0;
    const value = isSlide ? r4(valueRaw) : r3(valueRaw * scale);

    let mimicJoint: string | undefined;
    let mimicMultiplier: number | undefined;
    if (isRecord(raw.mimic) && typeof raw.mimic.joint === 'string' && raw.mimic.joint.trim()) {
      const mult = finiteNum(raw.mimic.multiplier);
      if (mult !== undefined && Math.abs(mult) > 1e-12) {
        mimicJoint = raw.mimic.joint.trim();
        mimicMultiplier = mult;
      }
    }

    rawJoints.push({
      node,
      partName,
      extrasName,
      kind: raw.type,
      type: isSlide ? 'slide' : 'rotate',
      axis,
      ...(range ? { range } : {}),
      value,
      continuous: raw.type === 'continuous',
      ...(mimicJoint && mimicMultiplier !== undefined ? { mimicJoint, mimicMultiplier } : {}),
    });
  });

  if (!sand3dNodes.length) return null;

  const byPartName = new Map(rawJoints.map(j => [j.partName, j]));
  const builtParts: RiggedPartSpec[] = [];
  const rawBySpecName = new Map<string, RawSand3dJoint>();

  for (const j of rawJoints) {
    let mimic: RiggedMimicSpec | undefined;
    let leader: RawSand3dJoint | undefined;
    if (j.mimicJoint && j.mimicMultiplier !== undefined) {
      const leaderName = extrasToPartName.get(j.mimicJoint) ?? (byPartName.has(j.mimicJoint) ? j.mimicJoint : undefined);
      leader = leaderName ? byPartName.get(leaderName) : undefined;
      if (leader && leader.partName !== j.partName) {
        let mult = j.mimicMultiplier;
        if (leader.type === 'rotate' && j.type === 'slide') mult = j.mimicMultiplier * DEG_TO_RAD;
        else if (leader.type === 'slide' && j.type === 'rotate') mult = j.mimicMultiplier * RAD_TO_DEG;
        mimic = { part: leader.partName, multiplier: Number(mult.toPrecision(12)) };
      }
    }

    const continuous = j.continuous || Boolean(leader?.continuous);
    let range = j.range;
    if (!range) {
      if (mimic && leader) {
        const lRange = leader.range ?? (leader.continuous ? [-360, 360] : [0, 0]);
        const a = lRange[0] * mimic.multiplier;
        const b = lRange[1] * mimic.multiplier;
        if (Math.abs(b - a) > 1e-9) {
          range = j.type === 'slide' ? [r4(Math.min(a, b)), r4(Math.max(a, b))] : [r3(Math.min(a, b)), r3(Math.max(a, b))];
        }
      } else if (j.kind === 'continuous') {
        range = [-360, 360];
      }
    }
    if (!range || Math.abs(range[1] - range[0]) <= 1e-9) continue;

    const unitDesc = j.type === 'slide' ? 'm' : '°';
    const desc = mimic
      ? `Sand3D ${j.kind} joint following ${mimic.part}`
      : continuous
        ? `Sand3D continuous spin joint`
        : `Sand3D ${j.kind} joint (${String(range[0])}${unitDesc} to ${String(range[1])}${unitDesc})`;

    const spec: RiggedPartSpec = {
      name: j.partName,
      label: humanizeLabel(j.extrasName),
      type: j.type,
      axis: j.axis,
      range,
      ...(continuous ? { continuous: true } : {}),
      ...(mimic ? { mimic } : {}),
      describe: desc,
    };
    builtParts.push(spec);
    rawBySpecName.set(spec.name, j);
  }

  const riggedParts = sanitizeMimicLinks(builtParts);
  const initialPose: Record<string, number> = {};
  const savedTransforms: { node: T.Object3D; pos: T.Vector3; quat: T.Quaternion }[] = [];

  // Temporarily back out any posed initial values so derived spatial OBBs, clearance zones, and dimensions reflect rest pose.
  for (const spec of riggedParts) {
    const raw = rawBySpecName.get(spec.name);
    if (!raw || Math.abs(raw.value) <= 1e-6) continue;
    initialPose[spec.name] = raw.value;
    savedTransforms.push({ node: raw.node, pos: raw.node.position.clone(), quat: raw.node.quaternion.clone() });
    const axisVec = new T.Vector3(...axisTuple(spec.axis));
    if (spec.type === 'slide') {
      raw.node.position.addScaledVector(axisVec, -raw.value);
    } else {
      raw.node.quaternion.multiply(new T.Quaternion().setFromAxisAngle(axisVec, -raw.value * DEG_TO_RAD)).normalize();
    }
  }

  let dimensions: ReturnType<typeof measureDimensions>;
  let spatial: ReturnType<typeof deriveSpatialMetadata>;
  try {
    root.updateMatrixWorld(true);
    dimensions = measureDimensions(root);
    spatial = deriveSpatialMetadata(root, riggedParts);
  } finally {
    for (const item of savedTransforms) {
      item.node.position.copy(item.pos);
      item.node.quaternion.copy(item.quat);
    }
    if (savedTransforms.length) root.updateMatrixWorld(true);
  }

  const decals = readEmbeddedDecals(root);
  const studioName = typeof root.userData.studioName === 'string' ? root.userData.studioName : '';
  const firstChildName = root.children.length === 1 ? root.children[0]?.name : '';
  const assetName = (options.name?.trim() || studioName || (root.name && root.name !== 'Scene' && root.name !== 'AuxScene' ? root.name : firstChildName) || 'Sand3D Asset').slice(0, MAX_NAME_LEN);
  const sourceClips = options.animations?.length ? options.animations : root.animations;
  const clips = sourceClips.length
    ? sourceClips.map(clip => ({ name: clip.name, duration: r3(clip.duration) }))
    : undefined;

  return {
    version: 1,
    name: assetName,
    source: { kind: 'local', kit: 'sand3d' },
    riggedParts,
    detachableParts: [],
    nightZones: [],
    decals,
    ...(dimensions ? { dimensions } : {}),
    ...(spatial.colliders.length ? { colliders: spatial.colliders } : {}),
    ...(spatial.clearanceZones.length ? { clearanceZones: spatial.clearanceZones } : {}),
    ...(spatial.surfaces.length ? { surfaces: spatial.surfaces } : {}),
    ...(clips?.length ? { clips } : {}),
    ...(Object.keys(initialPose).length ? { state: { pose: initialPose } } : {}),
  };
}
