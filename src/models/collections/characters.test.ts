import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { createAssetController } from '../../capabilities/runtime';
import type { AssetCapabilities } from '../../capabilities/schema';
import type { Recipe } from '../../data/recipe';
import { finishes } from '../parts';
import { charactersA, type CharacterAssetDef } from './characters-a';
import { charactersB } from './characters-b';

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const allCharacters: readonly CharacterAssetDef[] = [...charactersA, ...charactersB];

const requiredBones = [
  'Hips', 'Spine', 'Chest', 'Neck', 'Head',
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot',
  'RightUpLeg', 'RightLeg', 'RightFoot',
] as const;

function meshes(root: T.Object3D): PaintedMesh[] {
  const result: PaintedMesh[] = [];
  root.traverse(part => {
    if (part instanceof T.Mesh) result.push(part as PaintedMesh);
  });
  return result;
}

function vertices(root: T.Object3D): number {
  return meshes(root).reduce((sum, item) => sum + item.geometry.getAttribute('position').count, 0);
}

function triangles(root: T.Object3D): number {
  return meshes(root).reduce((sum, item) => {
    const count = item.geometry.index?.count ?? item.geometry.getAttribute('position').count;
    return sum + count / 3;
  }, 0);
}

function buildCharacter(def: CharacterAssetDef, overrides?: Partial<Pick<Recipe, 'primary' | 'accent' | 'detail' | 'quality'>>): T.Group {
  const root = new T.Group();
  root.name = 'Asset';
  const recipe: Recipe = {
    version: 1,
    template: 'field-pilot',
    name: def.name,
    primary: overrides?.primary ?? def.primary,
    accent: overrides?.accent ?? def.accent,
    scale: 1,
    proportion: 1,
    detail: overrides?.detail ?? true,
    quality: overrides?.quality ?? 'hd',
  };
  def.build(root, finishes(recipe), recipe.detail);
  return root;
}

describe('character collection metadata', () => {
  it('defines 16 unique skinned humanoid characters with valid metadata and hex palettes', () => {
    expect(charactersA).toHaveLength(8);
    expect(charactersB).toHaveLength(8);
    expect(allCharacters).toHaveLength(16);
    expect(new Set(allCharacters.map(c => c.id)).size).toBe(16);
    expect(new Set(allCharacters.map(c => c.code)).size).toBe(16);
    expect(new Set(allCharacters.map(c => c.name)).size).toBe(16);
    for (const def of allCharacters) {
      expect(def.category).toBe('Character');
      expect(def.browseCategory).toBe('character');
      expect(def.physicsBody).toBe('dynamic');
      expect(def.primary).toMatch(/^#[\da-f]{6}$/i);
      expect(def.accent).toMatch(/^#[\da-f]{6}$/i);
      expect(def.description.trim().length).toBeGreaterThan(20);
      expect(def.detachableParts.length + def.riggedParts.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe.each(allCharacters)('$code $name ($id)', def => {
  it('builds finite skinned humanoid geometry using both primary and accent colors within bounds', () => {
    const scene = buildCharacter(def, { primary: '#ed5a19', accent: '#b6e623', quality: 'hd', detail: true });
    const colors = meshes(scene).flatMap(item => [item.material].flat().map(mat => mat.color.getHexString()));
    expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']));

    scene.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(scene);
    const size = bounds.getSize(new T.Vector3()).toArray();
    expect(size.every(v => Number.isFinite(v) && v > 0.5 && v < 5)).toBe(true);
    expect(bounds.min.y).toBeGreaterThan(-0.025);
  });

  it('keeps the 19-joint Suit SkinnedMesh with LeftArm deforming vertices and costume attached to bones', () => {
    const scene = buildCharacter(def, { quality: 'hd', detail: true });
    const skin = scene.getObjectByName('Suit');
    if (!(skin instanceof T.SkinnedMesh)) throw new Error('Missing Suit SkinnedMesh');
    const boneNames = skin.skeleton.bones.map(b => b.name);
    for (const required of requiredBones) expect(boneNames).toContain(required);

    const armIndex = skin.skeleton.bones.findIndex(bone => bone.name === 'LeftArm');
    expect(armIndex).toBeGreaterThan(0);
    const geometry = skin.geometry as T.BufferGeometry;
    const indices = geometry.getAttribute('skinIndex');
    const weights = geometry.getAttribute('skinWeight');
    const vertex = Array.from({ length: indices.count }, (_, i) => i).find(i => indices.getX(i) === armIndex);
    if (vertex === undefined) throw new Error('LeftArm has no bound geometry');
    expect(weights.getX(vertex)).toBe(1);

    scene.updateMatrixWorld(true);
    const rest = skin.getVertexPosition(vertex, new T.Vector3());
    const armBone = skin.skeleton.bones[armIndex];
    if (!armBone) throw new Error('Missing LeftArm bone');
    armBone.rotation.z = 0.6;
    scene.updateMatrixWorld(true);
    expect(rest.distanceTo(skin.getVertexPosition(vertex, new T.Vector3()))).toBeGreaterThan(0.01);

    // Every detachable and rigged part must be mounted under a skeleton bone so it follows animations.
    for (const part of [...def.detachableParts, ...def.riggedParts]) {
      const node = scene.getObjectByName(part.name);
      expect(node).toBeDefined();
      let parent = node?.parent ?? null;
      let underBone = false;
      while (parent) {
        if (parent instanceof T.Bone) {
          underBone = true;
          break;
        }
        parent = parent.parent;
      }
      expect(underBone).toBe(true);
    }
  });

  it('reduces vertices when detail is false while preserving all clips, rigged parts, and detachable parts', () => {
    const detailed = buildCharacter(def, { quality: 'hd', detail: true });
    const simple = buildCharacter(def, { quality: 'hd', detail: false });
    expect(vertices(simple)).toBeLessThan(vertices(detailed));
    for (const clip of detailed.animations) {
      for (const track of clip.tracks) {
        expect(simple.getObjectByName(T.PropertyBinding.parseTrackName(track.name).nodeName)).toBeDefined();
      }
    }
    for (const part of [...def.detachableParts, ...def.riggedParts]) {
      expect(simple.getObjectByName(part.name)).toBeDefined();
    }
  });

  it('doubles triangle density in HD mode with identical animation clip and track bindings', () => {
    const standard = buildCharacter(def, { quality: 'standard', detail: true });
    const hd = buildCharacter(def, { quality: 'hd', detail: true });
    expect(triangles(hd)).toBeGreaterThan(triangles(standard) * 2);
    const bindings = (model: T.Group) => model.animations.map(clip => [clip.name, ...clip.tracks.map(track => track.name)]);
    expect(bindings(hd)).toEqual(bindings(standard));
    for (const clip of hd.animations) {
      for (const track of clip.tracks) {
        expect(hd.getObjectByName(T.PropertyBinding.parseTrackName(track.name).nodeName)).toBeDefined();
      }
    }
  });

  it('plays animations via AnimationMixer and supports interactive detachable and rigged controls', () => {
    const scene = buildCharacter(def, { quality: 'hd', detail: true });
    expect(scene.animations.length).toBeGreaterThanOrEqual(2);
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene);
      const tracks = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        const node = scene.getObjectByName(nodeName);
        if (!node) throw new Error('Missing track target ' + nodeName);
        return { node, original: node.matrix.clone() };
      });
      scene.updateMatrixWorld(true);
      for (const tracked of tracks) tracked.original.copy(tracked.node.matrix);
      mixer.clipAction(clip).play();
      mixer.update(clip.duration * 0.193);
      scene.updateMatrixWorld(true);
      expect(tracks.some(({ node, original }) => !node.matrix.equals(original))).toBe(true);
      mixer.stopAllAction();
    }

    const caps: AssetCapabilities = {
      version: 1,
      name: def.name,
      riggedParts: [...def.riggedParts],
      detachableParts: [...def.detachableParts],
      nightZones: [],
      decals: [],
    };
    const controller = createAssetController(scene, caps);
    for (const part of def.detachableParts) {
      expect(controller.isVisible(part.name)).toBe(true);
      controller.setVisible(part.name, false);
      expect(controller.isVisible(part.name)).toBe(false);
      controller.setVisible(part.name, true);
    }
    for (const part of def.riggedParts) {
      const moved = controller.openPart(part.name);
      expect(moved).not.toBe(0);
      controller.closePart(part.name);
    }
    controller.dispose();
  });
});
