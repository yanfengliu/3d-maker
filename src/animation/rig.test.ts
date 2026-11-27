import {
  AnimationMixer, Bone, Group, Matrix4, Object3D, PropertyBinding, Quaternion, Skeleton, SkinnedMesh, Vector3,
} from 'three';
import { describe, expect, it } from 'vitest';
import { catalog } from '../data/recipe';
import { buildModel } from '../models';
import { cloneForExport } from '../studio/export';
import { bindCharacterClip, characterRig } from './rig';

function canonical(height = 0.95, adjust?: (root: Object3D) => void) {
  const root = new Group(), skin = new SkinnedMesh(), bones: Record<string, Bone> = {};
  root.add(skin);
  function add(name: string, parent: Object3D, x: number, y: number): Bone {
    const node = new Bone();
    node.name = name;
    node.position.set(x, y, 0);
    parent.add(node);
    bones[name] = node;
    return node;
  }
  const hips = add('Hips', skin, 0, height);
  let upper = hips;
  for (const name of ['Spine', 'Spine1', 'Spine2']) upper = add(name, upper, 0, 0.1);
  add('Head', add('Neck', upper, 0, 0.2), 0, 0.1);
  for (const [side, sign] of [['Left', 1], ['Right', -1]] as const) {
    let arm = upper, leg = hips;
    for (const name of ['Shoulder', 'Arm', 'ForeArm', 'Hand']) arm = add(side + name, arm, sign * 0.2, 0);
    for (const name of ['UpLeg', 'Leg', 'Foot', 'ToeBase']) leg = add(side + name, leg, 0, -0.2);
  }
  adjust?.(root);
  root.updateMatrixWorld(true);
  skin.bind(new Skeleton(Object.values(bones)));
  return root;
}

const up = new Vector3(0, 1, 0), forward = new Vector3(0, 0, 1);
const identity = new Quaternion(), leftArmDown = new Quaternion().setFromAxisAngle(forward, -Math.PI / 2);
const tip = new Quaternion().setFromAxisAngle(forward, 0.25), turn = new Quaternion().setFromAxisAngle(up, 0.4);
const pair = (first: Quaternion, last: Quaternion) => [...first.toArray(), ...last.toArray()];

const raw = {
  times: [0, 1],
  hips: [0, 0, 0, 0.2, -0.3, -0.4],
  tracks: {
    LeftArm: pair(identity, leftArmDown),
    LeftForeArm: pair(identity, identity),
    LeftHand: pair(identity, identity),
    Spine1: pair(identity, tip),
    Spine2: pair(identity, turn),
  },
};

function mustRig(scene: Object3D) {
  const rig = characterRig(scene);
  if (!rig) throw new Error('Expected a compatible rig');
  return rig;
}

function node(scene: Object3D, name: string) {
  const object = scene.getObjectByName(name);
  if (!object) throw new Error('Missing ' + name);
  return object;
}

describe('shared humanoid clip binding', () => {
  it('plays the authored rotations and scales XYZ root motion to an individual bind-pose height', () => {
    const scene = canonical(0.475);
    const hips = node(scene, 'Hips');
    hips.position.y = 0.125; // A previously scrubbed pose must not become the new reference height.
    const clip = bindCharacterClip(mustRig(scene), 'Motion', raw);
    const mix = new AnimationMixer(scene);
    mix.clipAction(clip).play();
    mix.setTime(0.5);
    expect(hips.position.x).toBeCloseTo(0.05);
    expect(hips.position.y).toBeCloseTo(0.4);
    expect(hips.position.z).toBeCloseTo(-0.1);
    expect(node(scene, 'LeftArm').quaternion.angleTo(identity.clone().slerp(leftArmDown, 0.5))).toBeLessThan(0.001);
  });

  it.each(['native', 'glTF'])('recovers a posed split skin’s local hips from %s inverse binds under nested transforms', format => {
    const scene = canonical(0.475, root => {
      const armature = new Group(), joints = new Group(), skin = root.getObjectByProperty('isSkinnedMesh', true);
      if (!(skin instanceof SkinnedMesh)) throw new Error('Missing test skin');
      root.add(armature);
      armature.position.set(1.1, 0.8, -0.4);
      armature.rotation.z = 0.3;
      armature.scale.setScalar(1.3);
      armature.add(skin, joints);
      skin.position.set(0.4, -0.2, -0.1);
      joints.position.set(-0.2, 0.4, 0.7);
      joints.rotation.x = -0.6;
      joints.add(node(skin, 'Hips'));
    });
    const skin = scene.getObjectByProperty('isSkinnedMesh', true);
    if (!(skin instanceof SkinnedMesh)) throw new Error('Missing test skin');
    const primitive = new SkinnedMesh();
    scene.add(primitive);
    primitive.position.set(0.3, 0.1, 0.2);
    primitive.updateWorldMatrix(true, false);
    primitive.bind(skin.skeleton, primitive.matrixWorld);
    scene.children.reverse();
    if (format === 'glTF') {
      for (const mesh of [skin, primitive]) {
        // Exported inverses include each primitive’s bind matrix. GLTFLoader binds with identity.
        const inverses = mesh.skeleton.boneInverses.map(matrix => matrix.clone().multiply(mesh.bindMatrix));
        mesh.bind(new Skeleton(mesh.skeleton.bones, inverses), new Matrix4());
      }
    }
    scene.position.set(0.8, -2, 0.4);
    scene.rotation.y = 0.7;
    scene.scale.setScalar(1.8);
    const hips = node(scene, 'Hips');
    hips.position.set(0.1, 0.2, 0.3);
    const rig = mustRig(scene);
    expect(rig.restHips.distanceTo(new Vector3(0, 0.475, 0))).toBeLessThan(1e-6);
    const mix = new AnimationMixer(scene);
    mix.clipAction(bindCharacterClip(rig, 'Motion', raw)).play();
    mix.setTime(0.5);
    expect(hips.position.distanceTo(new Vector3(0.05, 0.4, -0.1))).toBeLessThan(1e-6);
  });

  it.each(['field-pilot', 'survey-bot'])('retargets the T-pose and bends the %s elbows about the correct frame', template => {
    const entry = catalog.find(row => row.id === template);
    if (!entry) throw new Error('Missing original');
    const model = buildModel({...entry.recipe, quality:'standard'});
    const elbow = node(model,'LeftForeArm'), hand = node(model,'LeftHand'), arm = node(model,'LeftArm');
    expect(elbow.position.clone().normalize().y).toBeLessThan(-0.95);
    // Bend the source forearm up through 90 degrees at the final sample.
    const bend = new Quaternion().setFromAxisAngle(up, -Math.PI / 2);
    const data = {...raw, tracks: {...raw.tracks, LeftForeArm:pair(identity,bend)}};
    const clip = bindCharacterClip(mustRig(model), 'Reach', data);
    const mix = new AnimationMixer(model);
    const action = mix.clipAction(clip).play();
    action.time = 0;
    mix.update(0);
    const direction = (a:Object3D,b:Object3D) => b.getWorldPosition(new Vector3()).sub(a.getWorldPosition(new Vector3())).normalize();
    expect(direction(arm,elbow).x).toBeCloseTo(1, 5);
    expect(direction(elbow,hand).x).toBeCloseTo(1, 5);
    action.time = 0.999999;
    mix.update(0);
    const chest = node(model,'Chest');
    const spineRotation = tip.clone().multiply(turn);
    expect(chest.quaternion.angleTo(spineRotation)).toBeLessThan(0.001);
    const worldToChest = chest.getWorldQuaternion(new Quaternion()).invert();
    expect(direction(arm,elbow).applyQuaternion(worldToChest).y).toBeCloseTo(-1, 4);
    expect(direction(elbow,hand).applyQuaternion(worldToChest).z).toBeCloseTo(1, 4);
  });

  it('keeps a duplicate-named scene object out of the mixer and the export clone', () => {
    const scene = canonical(), extra = new Object3D();
    extra.name = 'LeftArm';
    const arm = node(scene, 'LeftArm');
    scene.add(extra);
    scene.children.reverse();
    const clip = bindCharacterClip(mustRig(scene), 'Motion', raw);
    scene.animations = [clip];
    const mix = new AnimationMixer(scene);
    mix.clipAction(clip).play();
    mix.setTime(0.5);
    expect(extra.quaternion.equals(identity)).toBe(true);
    expect(arm.quaternion.angleTo(identity)).toBeGreaterThan(0.5);
    const copy = cloneForExport(scene);
    expect(copy.root.animations[0]?.tracks.some(track => track.name === arm.uuid + '.quaternion')).toBe(true);
    expect(PropertyBinding.findNode(copy.root, arm.uuid)).toBeInstanceOf(Bone);
    copy.dispose();
  });

  it('rejects an incomplete skeleton, a rotated bind frame, a different arm pose and a multi-character scene', () => {
    expect(characterRig(canonical(1, b => { node(b, 'LeftForeArm').name = 'FrontLeftLeg'; }))).toBeNull();
    expect(characterRig(canonical(1, b => { node(b, 'LeftHand').rotation.y = 0.3; }))).toBeNull();
    expect(characterRig(canonical(1, b => { node(b, 'Hips').rotation.z = 0.3; }))).toBeNull();
    expect(characterRig(canonical(1, b => { node(b, 'RightForeArm').position.set(0, -0.3, 0); }))).toBeNull();
    expect(characterRig(new Group().add(canonical(), canonical()))).toBeNull();
  });

  it('rejects corrupted, empty, and unbound clips before mixing or export', () => {
    const rig = mustRig(canonical());
    for (const bad of [{}, {...raw, times:[0,0]}, {...raw, hips:[0,0,NaN]}, {...raw, tracks:{}},
      {...raw, tracks:{ Tail:raw.tracks.LeftArm }}, {...raw, tracks:{LeftArm:[NaN]}},
      {...raw, tracks:{LeftArm:new Array<number>(8).fill(0)}}]) {
      expect(() => bindCharacterClip(rig, 'Broken', bad)).toThrow();
    }
  });
});
