import {
  AnimationClip, type Bone, type Matrix4, Quaternion, QuaternionKeyframeTrack, SkinnedMesh, Vector3, VectorKeyframeTrack,
  type KeyframeTrack, type Object3D,
} from 'three';

interface Joint {
  target: string;
  sources: string[];
  fromParent: Quaternion;
  toSource: Quaternion;
}

export interface CharacterRig {
  joints: Joint[];
  hipsTarget: string;
  restHips: Vector3;
}

const identity = new Quaternion();
const unitScale = new Vector3(1, 1, 1);

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numbers(values: unknown, length: number): values is number[] {
  return Array.isArray(values) && values.length === length &&
    values.every((v: unknown) => typeof v === 'number' && Number.isFinite(v));
}

function parents(studio: boolean) {
  const spineTop = studio ? 'Chest' : 'Spine2';
  const result = new Map<string, string>([['Spine', 'Hips'], ['Neck', spineTop], ['Head', 'Neck']]);
  if (studio) result.set('Chest', 'Spine');
  else { result.set('Spine1', 'Spine'); result.set('Spine2', 'Spine1'); }
  for (const side of ['Left', 'Right']) {
    result.set(side + 'Shoulder', spineTop);
    result.set(side + 'Arm', side + 'Shoulder');
    result.set(side + 'ForeArm', side + 'Arm');
    result.set(side + 'Hand', side + 'ForeArm');
    result.set(side + 'UpLeg', 'Hips');
    result.set(side + 'Leg', side + 'UpLeg');
    result.set(side + 'Foot', side + 'Leg');
    if (!studio) result.set(side + 'ToeBase', side + 'Foot');
  }
  return result;
}

/** Express each joint's bind matrix in the hips parent's frame. glTF primitives
 * may be siblings of Hips, and distinct skins can share joints in different mesh spaces. */
function jointBindMatrices(skins: SkinnedMesh[], parent: Object3D) {
  const result = new Map<Bone, Matrix4>();
  parent.updateWorldMatrix(true, false);
  const parentInverse = parent.matrixWorld.clone().invert();
  for (const skin of skins) {
    skin.updateWorldMatrix(true, false);
    const fromSkin = parentInverse.clone().multiply(skin.matrixWorld).multiply(skin.bindMatrix.clone().invert());
    for (const [i, bone] of skin.skeleton.bones.entries()) {
      const inverse = skin.skeleton.boneInverses[i];
      if (inverse && !result.has(bone)) result.set(bone, inverse.clone().invert().premultiply(fromSkin));
    }
  }
  return result;
}

/** Match one skinned humanoid in its bind pose, independently of the displayed animation. */
export function characterRig(root: Object3D): CharacterRig | null {
  const bones = new Map<string, Bone>();
  const skins: SkinnedMesh[] = [];
  const nameCounts = new Map<string, number>();
  const matches = { ambiguous: false, studio: false };
  root.traverse(node => {
    nameCounts.set(node.name, (nameCounts.get(node.name) ?? 0) + 1);
    const recipe: unknown = node.userData.recipe;
    if (record(recipe) && (recipe.template === 'field-pilot' || recipe.template === 'survey-bot')) matches.studio = true;
    if (!(node instanceof SkinnedMesh)) return;
    skins.push(node as SkinnedMesh);
    for (const bone of node.skeleton.bones) {
      // GLTFLoader preserves the authored name here when disambiguating a scene-wide collision.
      const name = typeof bone.userData.name === 'string' ? bone.userData.name : bone.name;
      if (bones.has(name) && bones.get(name) !== bone) matches.ambiguous = true;
      bones.set(name, bone);
    }
  });
  const { ambiguous, studio } = matches;
  const hips = bones.get('Hips');
  if (ambiguous || !hips?.parent || !root.getObjectByProperty('uuid', hips.uuid)) return null;
  const bindMatrices = jointBindMatrices(skins, hips.parent);
  const hierarchy = parents(studio);
  const offsets = new Map<string, Vector3>();
  for (const [name, parentName] of hierarchy) {
    const bone = bones.get(name), parent = bones.get(parentName);
    const bind = bone && bindMatrices.get(bone), parentBind = parent && bindMatrices.get(parent);
    if (!bind || !parentBind || bone.parent !== parent) return null;
    // The clip source uses identity local bind rotations and +Y up. Reject rigs whose
    // names match but whose rotated or mirrored bone coordinate frames would twist the mesh.
    const matrix = parentBind.clone().invert().multiply(bind);
    const offset = new Vector3(), rotation = new Quaternion(), scale = new Vector3();
    matrix.decompose(offset, rotation, scale);
    if (!Number.isFinite(offset.lengthSq()) || offset.lengthSq() === 0 ||
        Math.abs(rotation.w) < 0.99999 || scale.distanceTo(unitScale) > 0.001) return null;
    offsets.set(name, offset);
  }

  const bases = new Map<string, Quaternion>();
  for (const [side, sign] of [['Left', 1], ['Right', -1]] as const) {
    const canonical = new Vector3(sign, 0, 0);
    for (const [joint, child] of [['Arm', 'ForeArm'], ['ForeArm', 'Hand']] as const) {
      const direction = offsets.get(side + child)?.clone().normalize();
      if (!direction) return null;
      if (studio) {
        if (direction.y > -0.85) return null;
        // Rotate the original's downward rest limb onto the source's horizontal T-pose.
        const basis = new Quaternion().setFromUnitVectors(direction, canonical);
        bases.set(side + joint, basis);
        if (joint === 'ForeArm') bases.set(side + 'Hand', basis);
      } else if (direction.dot(canonical) < 0.95) return null;
    }
    if ((offsets.get(side + 'Leg')?.clone().normalize().y ?? 0) > -0.85) return null;
  }

  const joints: Joint[] = [];
  for (const name of ['Hips', ...hierarchy.keys()]) {
    const bone = bones.get(name);
    if (!bone) return null;
    joints.push({
      target: nameCounts.get(bone.name) === 1 ? bone.name : bone.uuid,
      sources: name === 'Chest' ? ['Spine1', 'Spine2'] : [name],
      fromParent: (bases.get(hierarchy.get(name) ?? '') ?? identity).clone().invert(),
      toSource: bases.get(name) ?? identity,
    });
  }

  const hipBind = bindMatrices.get(hips);
  if (!hipBind) return null;
  const restHips = new Vector3(), hipRotation = new Quaternion(), hipScale = new Vector3();
  hipBind.decompose(restHips, hipRotation, hipScale);
  if (Math.abs(hipRotation.w) < 0.99999 || hipScale.distanceTo(unitScale) > 0.001) return null;
  for (let parent: Object3D | null = hips.parent; parent; parent = parent.parent) {
    const rest: unknown = parent.userData.restHips;
    if (numbers(rest, 3)) { restHips.fromArray(rest); break; }
  }
  const hipsTarget = joints[0]?.target;
  if (!hipsTarget || !Number.isFinite(restHips.lengthSq()) || restHips.y <= 0) return null;
  return { joints, hipsTarget, restHips };
}

/** Build ordinary three.js tracks for the selected skeleton, keeping the authored root motion. */
export function bindCharacterClip(rig: CharacterRig, name: string, raw: unknown): AnimationClip {
  if (!record(raw) || !Array.isArray(raw.times) || !numbers(raw.times, raw.times.length) || raw.times.length < 2 ||
      raw.times[0] !== 0 || raw.times.some((t, i, times) => i > 0 && t <= (times[i - 1] ?? Infinity)) ||
      !record(raw.tracks) || !numbers(raw.hips, raw.times.length * 3)) throw new Error('Invalid character clip data for ' + name);
  const { times, hips } = raw;
  const rotations = new Map<string, number[]>();
  for (const [joint, values] of Object.entries(raw.tracks)) {
    if (!numbers(values, times.length * 4)) throw new Error('Invalid rotation track for ' + joint);
    rotations.set(joint, values);
  }
  const tracks: KeyframeTrack[] = [];
  const value = new Quaternion(), part = new Quaternion();
  for (const joint of rig.joints) {
    const inputs = joint.sources.map(source => rotations.get(source));
    if (!inputs.some(input => input !== undefined)) continue;
    const values = new Float32Array(times.length * 4);
    for (let i = 0; i < values.length; i += 4) {
      value.copy(joint.fromParent);
      for (const input of inputs) {
        if (!input) continue;
        part.fromArray(input, i);
        if (part.lengthSq() < 0.000001) throw new Error('Invalid joint rotation for ' + name);
        value.multiply(part);
      }
      value.multiply(joint.toSource).normalize().toArray(values, i);
    }
    tracks.push(new QuaternionKeyframeTrack(joint.target + '.quaternion', times, values));
  }
  if (!tracks.length) throw new Error('Character clip has no matching joint tracks: ' + name);
  const positions = new Float32Array(hips.length);
  const location = new Vector3();
  // PolyFork's source reference hip is 0.95 metres. The GLB and original may be any height.
  for (let i = 0; i < hips.length; i += 3) {
    location.fromArray(hips, i).multiplyScalar(rig.restHips.y / 0.95).add(rig.restHips).toArray(positions, i);
  }
  tracks.push(new VectorKeyframeTrack(rig.hipsTarget + '.position', times, positions));
  return new AnimationClip(name, -1, tracks);
}
