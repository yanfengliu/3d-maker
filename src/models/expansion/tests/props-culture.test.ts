import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { createAssetController } from '../../../capabilities/runtime';
import { writeCapabilities } from '../../../capabilities/schema';
import type { Recipe } from '../../../data/recipe';
import type { ProceduralAssetDef } from '../../collection-types';
import { auditModelCraft } from '../../craft-invariants';
import { finishes } from '../../parts';
import { musicStageMeta } from '../meta/music-stage';
import { musicStagePack } from '../packs/music-stage';

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const EXPANSION_DIR = resolve(SELF_DIR, '..');
const LOCK_PATH = resolve(EXPANSION_DIR, '../variations.lock.json');

interface LockFile {
  entries: Record<string, { template: string }>;
}

const packGroups = [
  { packId: 'music-stage', meta: musicStageMeta, assets: musicStagePack },
] as const;

const allMeta = packGroups.flatMap(g => g.meta);
const allAssets: readonly ProceduralAssetDef[] = packGroups.flatMap(g => g.assets);

function buildExpansionAsset(
  asset: ProceduralAssetDef,
  options: { primary?: string; accent?: string; detail?: boolean; quality?: 'standard' | 'hd' } = {},
): T.Group {
  const recipe: Recipe = {
    version: 1,
    template: 'cargo-pod',
    name: asset.name,
    primary: options.primary ?? asset.primary,
    accent: options.accent ?? asset.accent,
    scale: 1,
    proportion: 1,
    detail: options.detail ?? true,
    quality: options.quality ?? 'standard',
  };
  const root = new T.Group();
  root.name = 'Asset';
  asset.build(root, finishes(recipe), recipe.detail);
  return root;
}

function meshes(root: T.Object3D): PaintedMesh[] {
  const out: PaintedMesh[] = [];
  root.traverse(node => {
    if (node instanceof T.Mesh) out.push(node as PaintedMesh);
  });
  return out;
}

function countVertices(root: T.Object3D): number {
  return meshes(root).reduce((sum, part) => sum + part.geometry.getAttribute('position').count, 0);
}

function countTriangles(root: T.Object3D): number {
  return meshes(root).reduce((sum, part) => {
    const count = part.geometry.index?.count ?? part.geometry.getAttribute('position').count;
    return sum + count / 3;
  }, 0);
}

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(full);
  }
  return out.sort();
}

describe('props-culture metadata, conventions, and collision checks', () => {
  it('defines unique IDs, codes, and names with zero collisions against variations.lock.json', () => {
    const lock = JSON.parse(readFileSync(LOCK_PATH, 'utf8')) as LockFile;
    const lockedIds = new Set(Object.values(lock.entries).map(e => e.template));
    expect(lockedIds.size).toBeGreaterThanOrEqual(106);

    for (const group of packGroups) {
      expect(group.meta).toHaveLength(20);
      expect(group.assets).toHaveLength(20);
      expect(group.meta.every(m => m.pack === group.packId)).toBe(true);
      expect(group.assets.map(a => a.id)).toEqual(group.meta.map(m => m.id));
    }

    expect(new Set(allAssets.map(a => a.id)).size).toBe(allAssets.length);
    expect(new Set(allAssets.map(a => a.code)).size).toBe(allAssets.length);
    expect(new Set(allAssets.map(a => a.name)).size).toBe(allAssets.length);
    expect(allAssets.every(a => a.category === 'Object' && a.browseCategory === 'prop')).toBe(true);
    expect(allMeta.every(m => !lockedIds.has(m.id))).toBe(true);
    expect(allMeta.every(m => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.id))).toBe(true);
  });

  it('keeps meta files free of Three.js imports and all expansion files <= 500 lines', () => {
    const files = walkTsFiles(EXPANSION_DIR);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const lines = text.split(/\r\n|\r|\n/);
      if (lines[lines.length - 1] === '') lines.pop();
      expect(lines.length, `${file} has ${String(lines.length)} lines`).toBeLessThanOrEqual(500);
      expect(text, `${file} must not read control channels`).not.toMatch(/process\.env|import\.meta\.env|window\.location/);
      if (file.includes('/meta/')) {
        expect(text, `${file} must not import three`).not.toMatch(/from\s+['"]three/);
      }
    }
  });
});

describe.each(allAssets)('$code $name ($id)', asset => {
  it('uses primary & accent colors inside strict bounds and grounded on y = 0', () => {
    for (const quality of ['standard', 'hd'] as const) {
      const scene = buildExpansionAsset(asset, { primary: '#ed5a19', accent: '#b6e623', quality, detail: true });
      const colors = meshes(scene).flatMap(part => [part.material].flat().map(m => m.color.getHexString()));
      expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']));

      scene.updateMatrixWorld(true);
      const bounds = new T.Box3().setFromObject(scene);
      const size = bounds.getSize(new T.Vector3()).toArray();
      for (const dim of size) {
        expect(Number.isFinite(dim)).toBe(true);
        expect(dim).toBeGreaterThan(0.55);
        expect(dim).toBeLessThan(4.6);
      }
      expect(bounds.min.y).toBeGreaterThanOrEqual(-0.025);
      expect(bounds.min.y).toBeLessThanOrEqual(0.08);
    }
  });

  it('reduces vertices when detail=false and exceeds 2x triangles in HD with identical clip bindings', () => {
    const stdFull = buildExpansionAsset(asset, { quality: 'standard', detail: true });
    const stdSimple = buildExpansionAsset(asset, { quality: 'standard', detail: false });
    const hdFull = buildExpansionAsset(asset, { quality: 'hd', detail: true });
    const hdSimple = buildExpansionAsset(asset, { quality: 'hd', detail: false });

    expect(countVertices(stdSimple)).toBeLessThan(countVertices(stdFull));
    expect(countVertices(hdSimple)).toBeLessThan(countVertices(hdFull));
    expect(countTriangles(hdFull)).toBeGreaterThan(countTriangles(stdFull) * 2);

    const bindings = (m: T.Group) => m.animations.map(c => [c.name, ...c.tracks.map(t => t.name)]);
    expect(bindings(hdFull)).toEqual(bindings(stdFull));
    expect(bindings(stdSimple)).toEqual(bindings(stdFull));

    expect(asset.riggedParts.length).toBeGreaterThanOrEqual(1);
    for (const part of asset.riggedParts) {
      expect(stdFull.getObjectByName(part.name)).toBeDefined();
      expect(stdSimple.getObjectByName(part.name)).toBeDefined();
      expect(hdFull.getObjectByName(part.name)).toBeDefined();
    }
    for (const part of asset.detachableParts ?? []) {
      expect(stdFull.getObjectByName(part.name)).toBeDefined();
      expect(stdSimple.getObjectByName(part.name)).toBeDefined();
    }
  });

  it('plays animation clips via mixer and drives rigged/detachable parts cleanly', () => {
    const scene = buildExpansionAsset(asset, { quality: 'standard', detail: true });
    expect(scene.animations.length).toBeGreaterThanOrEqual(1);
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene);
      const tracked = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        const node = scene.getObjectByName(nodeName);
        if (!node) throw new Error(`Missing animation node ${nodeName}`);
        return { node, original: node.matrix.clone() };
      });
      scene.updateMatrixWorld(true);
      for (const entry of tracked) entry.original.copy(entry.node.matrix);
      mixer.clipAction(clip).play();
      mixer.update(clip.duration * 0.193);
      scene.updateMatrixWorld(true);
      expect(tracked.some(({ node, original }) => !node.matrix.equals(original))).toBe(true);
      mixer.stopAllAction();
      scene.updateMatrixWorld(true);
    }

    writeCapabilities(scene, {
      version: 1,
      name: asset.name,
      riggedParts: [...asset.riggedParts],
      detachableParts: [...(asset.detachableParts ?? [])],
      nightZones: [],
      decals: [],
      physics: { body: asset.physicsBody },
    });
    const controller = createAssetController(scene);
    for (const part of asset.riggedParts) {
      expect(controller.openPart(part.name)).not.toBe(0);
      expect(controller.closePart(part.name)).toBe(0);
    }
    for (const part of asset.detachableParts ?? []) {
      controller.setVisible(part.name, false);
      expect(controller.isVisible(part.name)).toBe(false);
      controller.setVisible(part.name, true);
      expect(controller.isVisible(part.name)).toBe(true);
    }
    controller.dispose();
  });

  it('passes auditModelCraft watertight, grounding, connectivity, and Z-fighting invariants', () => {
    const model = buildExpansionAsset(asset, { quality: 'standard', detail: true });
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

    for (const part of asset.detachableParts ?? []) {
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
});
