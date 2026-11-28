import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from 'three';
import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../../data/recipe';
import type { ProceduralAssetDef } from '../../collection-types';
import { auditModelCraft } from '../../craft-invariants';
import { finishes } from '../../parts';
import { buildingsWorldMeta } from '../meta/buildings-world';
import { buildingsWorldPack } from '../packs/buildings-world';

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const HERE = dirname(fileURLToPath(import.meta.url));
const EXPANSION_ROOT = resolve(HERE, '..');
const LOCK_PATH = resolve(HERE, '../../variations.lock.json');

const allMeta = [...buildingsWorldMeta];
const allAssets: readonly ProceduralAssetDef[] = [...buildingsWorldPack];

function collectMeshes(root: T.Object3D): PaintedMesh[] {
  const result: PaintedMesh[] = [];
  root.traverse(part => {
    if (part instanceof T.Mesh) result.push(part as PaintedMesh);
  });
  return result;
}

function countVertices(root: T.Object3D): number {
  return collectMeshes(root).reduce((sum, item) => sum + item.geometry.getAttribute('position').count, 0);
}

function countTriangles(root: T.Object3D): number {
  return collectMeshes(root).reduce((sum, item) => {
    const count = item.geometry.index?.count ?? item.geometry.getAttribute('position').count;
    return sum + count / 3;
  }, 0);
}

function buildAsset(
  def: ProceduralAssetDef,
  opts: { primary?: string; accent?: string; detail?: boolean; quality?: 'standard' | 'hd' } = {},
): T.Group {
  const recipe: Recipe = {
    version: 1,
    template: 'signal-tower',
    name: def.name,
    primary: opts.primary ?? def.primary,
    accent: opts.accent ?? def.accent,
    scale: 1,
    proportion: 1,
    detail: opts.detail ?? true,
    quality: opts.quality ?? 'hd',
  };
  const root = new T.Group();
  root.name = 'Asset';
  def.build(root, finishes(recipe), recipe.detail);
  return root;
}

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsFiles(abs));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(abs);
  }
  return out.sort();
}

describe('worlds-built expansion invariants', () => {
  it('has unique IDs, codes, names and zero collisions with variations.lock.json', () => {
    const lockRaw = JSON.parse(readFileSync(LOCK_PATH, 'utf8')) as { entries?: Record<string, unknown> };
    const lockKeys = Object.keys(lockRaw.entries ?? lockRaw);
    const lockedIds = new Set(lockKeys.map(k => k.split('@')[0] ?? k));
    expect(lockedIds.size).toBeGreaterThanOrEqual(106);

    expect(allAssets.length).toBe(allMeta.length);
    expect(new Set(allAssets.map(a => a.id)).size).toBe(allAssets.length);
    expect(new Set(allAssets.map(a => a.code)).size).toBe(allAssets.length);
    expect(new Set(allAssets.map(a => a.name)).size).toBe(allAssets.length);

    for (const def of allAssets) {
      expect(lockedIds.has(def.id), `ID collision with lockfile: ${def.id}`).toBe(false);
      expect(def.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(def.category).toBe('Object');
      expect(['building', 'terrain']).toContain(def.browseCategory);
      expect(def.physicsBody).toBe('static');
      expect(def.primary).toMatch(/^#[\da-f]{6}$/i);
      expect(def.accent).toMatch(/^#[\da-f]{6}$/i);
      expect(def.description.trim().length).toBeGreaterThan(20);
      expect(def.riggedParts.length).toBeGreaterThan(0);
    }
  });

  it('keeps meta files free of Three.js imports and all expansion files <= 500 lines', () => {
    const metaDir = join(EXPANSION_ROOT, 'meta');
    for (const file of walkTsFiles(metaDir)) {
      const text = readFileSync(file, 'utf8');
      expect(text, `Three import found in ${file}`).not.toMatch(/from\s+['"]three/);
    }
    for (const file of walkTsFiles(EXPANSION_ROOT)) {
      const lines = readFileSync(file, 'utf8').split(/\r\n|\r|\n/);
      if (lines[lines.length - 1] === '') lines.pop();
      expect(lines.length, `${file} exceeds 500 lines (${String(lines.length)})`).toBeLessThanOrEqual(500);
    }
  });
});

describe.each(allAssets)('$code $name ($id)', def => {
  it('passes color, bounds, detail reduction, HD triangle ratio, and animation contracts', () => {
    const stdPainted = buildAsset(def, { primary: '#ed5a19', accent: '#b6e623', detail: true, quality: 'standard' });
    const hdPainted = buildAsset(def, { primary: '#ed5a19', accent: '#b6e623', detail: true, quality: 'hd' });
    for (const scene of [stdPainted, hdPainted]) {
      const colors = collectMeshes(scene).flatMap(m => [m.material].flat().map(mat => mat.color.getHexString()));
      expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']));
      scene.updateMatrixWorld(true);
      const bounds = new T.Box3().setFromObject(scene);
      const size = bounds.getSize(new T.Vector3()).toArray();
      expect(size.every(v => Number.isFinite(v) && v > 0.55 && v < 4.6), `Bad size ${JSON.stringify(size)}`).toBe(true);
      expect(bounds.min.y).toBeGreaterThanOrEqual(-0.025);
      expect(bounds.min.y).toBeLessThanOrEqual(0.08);
    }

    const stdSimple = buildAsset(def, { detail: false, quality: 'standard' });
    const hdSimple = buildAsset(def, { detail: false, quality: 'hd' });
    expect(countVertices(stdSimple)).toBeLessThan(countVertices(stdPainted));
    expect(countVertices(hdSimple)).toBeLessThan(countVertices(hdPainted));
    expect(countTriangles(hdPainted)).toBeGreaterThan(countTriangles(stdPainted) * 2);

    const bindings = (model: T.Group) => model.animations.map(clip => [clip.name, ...clip.tracks.map(t => t.name)]);
    expect(bindings(hdPainted)).toEqual(bindings(stdPainted));

    for (const part of def.riggedParts) {
      expect(stdPainted.getObjectByName(part.name)).toBeDefined();
      expect(stdSimple.getObjectByName(part.name)).toBeDefined();
      expect(hdPainted.getObjectByName(part.name)).toBeDefined();
      expect(hdSimple.getObjectByName(part.name)).toBeDefined();
    }
    for (const part of def.detachableParts ?? []) {
      expect(stdPainted.getObjectByName(part.name)).toBeDefined();
      expect(stdSimple.getObjectByName(part.name)).toBeDefined();
      expect(hdPainted.getObjectByName(part.name)).toBeDefined();
      expect(hdSimple.getObjectByName(part.name)).toBeDefined();
    }

    expect(hdPainted.animations.length).toBeGreaterThan(0);
    for (const clip of hdPainted.animations) {
      const mixer = new T.AnimationMixer(hdPainted);
      const tracked = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        expect(stdSimple.getObjectByName(nodeName)).toBeDefined();
        const node = hdPainted.getObjectByName(nodeName);
        if (!node) throw new Error(`Missing animated node ${nodeName}`);
        return { node, original: node.matrix.clone() };
      });
      hdPainted.updateMatrixWorld(true);
      for (const item of tracked) item.original.copy(item.node.matrix);
      mixer.clipAction(clip).play();
      mixer.update(clip.duration * 0.193);
      hdPainted.updateMatrixWorld(true);
      expect(tracked.some(({ node, original }) => !node.matrix.equals(original))).toBe(true);
      mixer.stopAllAction();
    }
  });

  it('passes auditModelCraft watertight, material, Z-fight, and detachable checks', () => {
    const model = buildAsset(def, { detail: true, quality: 'standard' });
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
});
