import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { characterRig } from '../../../animation/rig';
import { createAssetController } from '../../../capabilities/runtime';
import { writeCapabilities } from '../../../capabilities/schema';
import { catalog, type Recipe } from '../../../data/recipe';
import type { ProceduralAssetDef } from '../../collection-types';
import { auditModelCraft } from '../../craft-invariants';
import { finishes } from '../../parts';
import { attachmentsWearablesMeta } from '../meta/attachments-wearables';
import { charactersAdventureMeta } from '../meta/characters-adventure';
import { charactersCivilianMeta } from '../meta/characters-civilian';
import { handheldFantasyScifiMeta } from '../meta/handheld-fantasy-scifi';
import { handheldToolsMeta } from '../meta/handheld-tools';
import { attachmentsWearablesPack } from '../packs/attachments-wearables';
import { charactersCivilianPack } from '../packs/characters-civilian';

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const repoRoot = resolve(fileURLToPath(new URL('../../../..', import.meta.url)));
const expansionDir = join(repoRoot, 'src/models/expansion');
const metaFiles = [
  'characters-civilian.ts',
  'characters-adventure.ts',
  'handheld-tools.ts',
  'handheld-fantasy-scifi.ts',
  'attachments-wearables.ts',
] as const;

const allMeta = [
  ...charactersCivilianMeta,
  ...charactersAdventureMeta,
  ...handheldToolsMeta,
  ...handheldFantasyScifiMeta,
  ...attachmentsWearablesMeta,
];

const allPacks: readonly ProceduralAssetDef[] = [
  ...charactersCivilianPack,
  ...attachmentsWearablesPack,
];

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

function buildAsset(def: ProceduralAssetDef, overrides?: {
  primary?: string; accent?: string; detail?: boolean; quality?: 'standard' | 'hd';
}): T.Group {
  const root = new T.Group();
  root.name = 'Asset';
  const recipe: Recipe = {
    version: 1,
    template: def.category === 'Character' ? 'field-pilot' : 'cargo-pod',
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

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(full);
  }
  return out.sort();
}

describe('chars-gear expansion metadata and repo conventions', () => {
  it('defines 100 unique metadata items with zero Three.js imports and zero lock collisions', () => {
    expect(allMeta).toHaveLength(100);
    expect(new Set(allMeta.map(m => m.id)).size).toBe(100);
    expect(new Set(allMeta.map(m => m.code)).size).toBe(100);
    expect(new Set(allMeta.map(m => m.name)).size).toBe(100);

    const lock = JSON.parse(readFileSync(join(repoRoot, 'src/models/variations.lock.json'), 'utf8')) as {
      entries: Record<string, { template: string }>;
    };
    const lockedIds = new Set(Object.values(lock.entries).map(e => e.template));
    const existingCodes = new Set(catalog.map(c => c.code));
    const existingNames = new Set(catalog.map(c => c.recipe.name));
    for (const item of allMeta) {
      expect(lockedIds.has(item.id), `ID collision with variations.lock.json: ${item.id}`).toBe(false);
      expect(existingCodes.has(item.code), `Code collision with existing catalog: ${item.code}`).toBe(false);
      expect(existingNames.has(item.name), `Name collision with existing catalog: ${item.name}`).toBe(false);
      expect(item.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(item.primary).toMatch(/^#[\da-f]{6}$/i);
      expect(item.accent).toMatch(/^#[\da-f]{6}$/i);
      expect(item.description.trim().length).toBeGreaterThan(20);
    }

    for (const file of metaFiles) {
      const content = readFileSync(join(expansionDir, 'meta', file), 'utf8');
      expect(content).not.toMatch(/from\s+['"]three['"]/);
    }
  });

  it('keeps every expansion file <= 500 physical lines and free of forbidden control channels', () => {
    const files = collectTsFiles(expansionDir);
    expect(files.length).toBeGreaterThanOrEqual(6);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const lines = text.split(/\r\n|\r|\n/);
      if (lines[lines.length - 1] === '') lines.pop();
      expect(lines.length, `${file} exceeds 500 lines (${String(lines.length)})`).toBeLessThanOrEqual(500);
      expect(text, `${file} reads forbidden env/url`).not.toMatch(/process\.env|import\.meta\.env|window\.location/);
    }
  });
});

describe.each(allPacks)('$code $name ($id)', def => {
  it('builds finite geometry with both paint colors and valid bounds at standard and hd', () => {
    for (const quality of ['standard', 'hd'] as const) {
      const scene = buildAsset(def, { primary: '#ed5a19', accent: '#b6e623', quality, detail: true });
      const colors = meshes(scene).flatMap(item => [item.material].flat().map(m => m.color.getHexString()));
      expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']));

      scene.updateMatrixWorld(true);
      const bounds = new T.Box3().setFromObject(scene);
      const size = bounds.getSize(new T.Vector3()).toArray();
      for (const v of size) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(0.55);
        expect(v).toBeLessThan(4.6);
      }
      expect(bounds.min.y).toBeGreaterThanOrEqual(-0.025);
      expect(bounds.min.y).toBeLessThanOrEqual(0.08);
    }
  });

  it('reduces vertices when detail=false and doubles triangles in HD with identical clip bindings', () => {
    const stdFull = buildAsset(def, { quality: 'standard', detail: true });
    const stdSimple = buildAsset(def, { quality: 'standard', detail: false });
    const hdFull = buildAsset(def, { quality: 'hd', detail: true });
    const hdSimple = buildAsset(def, { quality: 'hd', detail: false });

    expect(vertices(stdSimple)).toBeLessThan(vertices(stdFull));
    expect(vertices(hdSimple)).toBeLessThan(vertices(hdFull));
    expect(triangles(hdFull)).toBeGreaterThan(triangles(stdFull) * 2);

    const bindings = (model: T.Group) => model.animations.map(c => [c.name, ...c.tracks.map(t => t.name)]);
    expect(bindings(hdFull)).toEqual(bindings(stdFull));

    for (const part of [...def.riggedParts, ...(def.detachableParts ?? [])]) {
      expect(stdFull.getObjectByName(part.name)).toBeDefined();
      expect(stdSimple.getObjectByName(part.name)).toBeDefined();
      expect(hdFull.getObjectByName(part.name)).toBeDefined();
      expect(hdSimple.getObjectByName(part.name)).toBeDefined();
    }
    for (const clip of stdFull.animations) {
      for (const track of clip.tracks) {
        const nodeName = T.PropertyBinding.parseTrackName(track.name).nodeName;
        expect(stdSimple.getObjectByName(nodeName)).toBeDefined();
        expect(hdFull.getObjectByName(nodeName)).toBeDefined();
      }
    }
  });

  it('plays animation clips via AnimationMixer and supports interactive controls', () => {
    const scene = buildAsset(def, { quality: 'hd', detail: true });
    expect(scene.animations.length).toBeGreaterThanOrEqual(1);
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene);
      const tracked = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        const node = scene.getObjectByName(nodeName);
        if (!node) throw new Error('Missing track target ' + nodeName);
        return { node, original: node.matrix.clone() };
      });
      scene.updateMatrixWorld(true);
      for (const item of tracked) item.original.copy(item.node.matrix);
      mixer.clipAction(clip).play();
      mixer.update(clip.duration * 0.193);
      scene.updateMatrixWorld(true);
      expect(tracked.some(({ node, original }) => !node.matrix.equals(original))).toBe(true);
      mixer.stopAllAction();
    }

    expect(def.riggedParts.length).toBeGreaterThanOrEqual(1);
    writeCapabilities(scene, {
      version: 1,
      name: def.name,
      riggedParts: [...def.riggedParts],
      detachableParts: [...(def.detachableParts ?? [])],
      nightZones: [],
      decals: [],
      physics: { body: def.physicsBody },
    });
    const controller = createAssetController(scene);
    for (const part of def.riggedParts) {
      expect(controller.openPart(part.name)).not.toBe(0);
      controller.closePart(part.name);
    }
    for (const part of def.detachableParts ?? []) {
      expect(controller.isVisible(part.name)).toBe(true);
      controller.setVisible(part.name, false);
      expect(controller.isVisible(part.name)).toBe(false);
      controller.setVisible(part.name, true);
    }
    controller.dispose();
  });

  it('passes auditModelCraft invariants on standard quality including detachable hiding', () => {
    const model = buildAsset(def, { quality: 'standard', detail: true });
    const audit = auditModelCraft(model);
    expect(audit.meshCount).toBeGreaterThan(0);
    expect(audit.nonFiniteVertices).toBe(0);
    expect(audit.doubleSidedMeshes).toEqual([]);
    expect(audit.materialIssues).toEqual([]);
    expect(audit.minY).toBeGreaterThanOrEqual(-0.025);
    expect(audit.minY).toBeLessThanOrEqual(0.08);
    expect(audit.bottomToTopRatio).toBeGreaterThanOrEqual(0.55);
    expect(audit.backToFrontRatio).toBeGreaterThanOrEqual(0.55);
    expect(audit.leftRightBalance).toBeGreaterThanOrEqual(0.45);
    expect(audit.floatingComponents).toEqual([]);
    expect(audit.exposedZFightPairs).toEqual([]);

    for (const part of def.detachableParts ?? []) {
      const node = model.getObjectByName(part.name);
      expect(node).toBeDefined();
      if (!node) continue;
      node.visible = false;
      const detached = auditModelCraft(model);
      node.visible = true;
      expect(detached.bottomToTopRatio).toBeGreaterThanOrEqual(0.55);
      expect(detached.backToFrontRatio).toBeGreaterThanOrEqual(0.55);
      expect(detached.floatingComponents).toEqual([]);
    }
  });

  if (def.category === 'Character') {
    it('keeps 19-bone Suit SkinnedMesh deformation and bone-mounted accessories', () => {
      const scene = buildAsset(def, { quality: 'hd', detail: true });
      expect(characterRig(scene)).not.toBeNull();
      const skin = scene.getObjectByName('Suit');
      if (!(skin instanceof T.SkinnedMesh)) throw new Error('Missing Suit SkinnedMesh');
      const boneNames = skin.skeleton.bones.map(b => b.name);
      for (const name of requiredBones) expect(boneNames).toContain(name);

      const armIndex = skin.skeleton.bones.findIndex(b => b.name === 'LeftArm');
      expect(armIndex).toBeGreaterThan(0);
      const geometry = skin.geometry as T.BufferGeometry;
      const indices = geometry.getAttribute('skinIndex');
      const weights = geometry.getAttribute('skinWeight');
      const vertex = Array.from({ length: indices.count }, (_, i) => i).find(i => indices.getX(i) === armIndex);
      if (vertex === undefined) throw new Error('LeftArm has no bound geometry');
      expect(weights.getX(vertex)).toBe(1);

      scene.updateMatrixWorld(true);
      const rest = skin.getVertexPosition(vertex, new T.Vector3());
      const bone = skin.skeleton.bones[armIndex];
      if (!bone) throw new Error('Missing LeftArm bone');
      bone.rotation.z = 0.6;
      scene.updateMatrixWorld(true);
      expect(rest.distanceTo(skin.getVertexPosition(vertex, new T.Vector3()))).toBeGreaterThan(0.01);

      expect((def.detachableParts ?? []).length).toBeGreaterThanOrEqual(1);
      for (const part of [...def.riggedParts, ...(def.detachableParts ?? [])]) {
        const node = scene.getObjectByName(part.name);
        let cur = node?.parent ?? null;
        let underBone = false;
        while (cur) {
          if (cur instanceof T.Bone) {
            underBone = true;
            break;
          }
          cur = cur.parent;
        }
        expect(underBone, `${part.name} must be mounted under a skeleton Bone`).toBe(true);
      }
    });
  }
});
