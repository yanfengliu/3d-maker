import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { createAssetController } from '../../../capabilities/runtime';
import type { AssetCapabilities } from '../../../capabilities/schema';
import type { Recipe } from '../../../data/recipe';
import type { ProceduralAssetDef } from '../../collection-types';
import { auditModelCraft } from '../../craft-invariants';
import { finishes } from '../../parts';
import { animalsOceanMythMeta } from '../meta/animals-ocean-myth';
import { animalsWildMeta } from '../meta/animals-wild';
import { vehiclesRoadMeta } from '../meta/vehicles-road';
import { vehiclesScifiFantasyMeta } from '../meta/vehicles-scifi-fantasy';
import { vehiclesSeaAirMeta } from '../meta/vehicles-sea-air';
import { animalsOceanMythPack } from '../packs/animals-ocean-myth';
import { animalsWildPack } from '../packs/animals-wild';
import { vehiclesRoadPack } from '../packs/vehicles-road';
import { vehiclesScifiFantasyPack } from '../packs/vehicles-scifi-fantasy';
import { vehiclesSeaAirPack } from '../packs/vehicles-sea-air';

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const EXPANSION_DIR = resolve(SELF_DIR, '..');
const LOCK_PATH = resolve(EXPANSION_DIR, '..', 'variations.lock.json');

const PACK_META_FILES = [
  'vehicles-road.ts',
  'vehicles-sea-air.ts',
  'vehicles-scifi-fantasy.ts',
  'animals-wild.ts',
  'animals-ocean-myth.ts',
] as const;

const ALL_META = [
  ...vehiclesRoadMeta,
  ...vehiclesSeaAirMeta,
  ...vehiclesScifiFantasyMeta,
  ...animalsWildMeta,
  ...animalsOceanMythMeta,
];

const ALL_ASSETS: readonly ProceduralAssetDef[] = [
  ...vehiclesRoadPack,
  ...vehiclesSeaAirPack,
  ...vehiclesScifiFantasyPack,
  ...animalsWildPack,
  ...animalsOceanMythPack,
];

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

function buildDef(
  def: ProceduralAssetDef,
  options: { primary?: string; accent?: string; detail?: boolean; quality?: 'standard' | 'hd' } = {},
): T.Group {
  const recipe: Recipe = {
    version: 1,
    template: 'field-rover',
    name: def.name,
    primary: options.primary ?? def.primary,
    accent: options.accent ?? def.accent,
    scale: 1,
    proportion: 1,
    detail: options.detail ?? true,
    quality: options.quality ?? 'hd',
  };
  const root = new T.Group();
  root.name = 'Asset';
  def.build(root, finishes(recipe), recipe.detail);
  return root;
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

describe('vehicles-life expansion catalog contracts', () => {
  it('defines 100 unique objects across 5 packs (60 vehicle + 40 animal) with zero lock collisions', () => {
    expect(vehiclesRoadPack).toHaveLength(20);
    expect(vehiclesSeaAirPack).toHaveLength(20);
    expect(vehiclesScifiFantasyPack).toHaveLength(20);
    expect(animalsWildPack).toHaveLength(20);
    expect(animalsOceanMythPack).toHaveLength(20);
    expect(ALL_META).toHaveLength(100);
    expect(ALL_ASSETS).toHaveLength(100);

    const ids = ALL_ASSETS.map(a => a.id);
    const codes = ALL_ASSETS.map(a => a.code);
    const names = ALL_ASSETS.map(a => a.name);
    expect(new Set(ids).size).toBe(100);
    expect(new Set(codes).size).toBe(100);
    expect(new Set(names).size).toBe(100);

    const lockJson = JSON.parse(readFileSync(LOCK_PATH, 'utf8')) as {
      entries: Record<string, { template: string }>;
    };
    const existingIds = new Set(Object.values(lockJson.entries).map(e => e.template));
    const collisions = ids.filter(id => existingIds.has(id));
    expect(collisions).toEqual([]);

    expect(ALL_ASSETS.filter(a => a.browseCategory === 'vehicle')).toHaveLength(60);
    expect(ALL_ASSETS.filter(a => a.browseCategory === 'animal')).toHaveLength(40);
    for (const a of ALL_ASSETS) {
      expect(a.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(a.category).toBe('Object');
      expect(a.primary).toMatch(/^#[\da-f]{6}$/i);
      expect(a.accent).toMatch(/^#[\da-f]{6}$/i);
      expect(a.description.trim().length).toBeGreaterThan(15);
      expect(a.riggedParts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps pure metadata files free of Three.js imports and all expansion files <= 500 lines', () => {
    for (const file of PACK_META_FILES) {
      const text = readFileSync(join(EXPANSION_DIR, 'meta', file), 'utf8');
      expect(text).not.toMatch(/from\s+['"]three/);
    }
    const tsFiles = walkTsFiles(EXPANSION_DIR);
    expect(tsFiles.length).toBeGreaterThanOrEqual(30);
    const forbidden = [/import\.meta\.env/, /process\.env/, /window\.location/];
    for (const file of tsFiles) {
      const text = readFileSync(file, 'utf8');
      const lines = text.split(/\r\n|\r|\n/);
      if (lines[lines.length - 1] === '') lines.pop();
      expect(lines.length, file).toBeLessThanOrEqual(500);
      for (const rx of forbidden) expect(text, file).not.toMatch(rx);
    }
  });
});

describe.each(ALL_ASSETS)('$code $name ($id)', def => {
  let cachedStandard: T.Group | undefined;
  let cachedHd: T.Group | undefined;
  let cachedSimple: T.Group | undefined;
  const getStandard = () => (cachedStandard ??= buildDef(def, { quality: 'standard', detail: true }));
  const getHd = () => (cachedHd ??= buildDef(def, { quality: 'hd', detail: true }));
  const getSimple = () => (cachedSimple ??= buildDef(def, { quality: 'hd', detail: false }));

  it('honors primary/accent paint colors and valid grounded world dimensions', () => {
    const painted = buildDef(def, { primary: '#ed5a19', accent: '#b6e623', quality: 'hd', detail: true });
    const builtMeshes = collectMeshes(painted);
    expect(builtMeshes.length).toBeGreaterThan(4);
    const colors = builtMeshes.flatMap(m => [m.material].flat().map(mat => mat.color.getHexString()));
    expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']));

    const bounds = new T.Box3().setFromObject(painted);
    const size = bounds.getSize(new T.Vector3()).toArray();
    for (const dim of size) {
      expect(Number.isFinite(dim)).toBe(true);
      expect(dim).toBeGreaterThan(0.55);
      expect(dim).toBeLessThan(4.6);
    }
    expect(bounds.min.y).toBeGreaterThanOrEqual(-0.025);
    expect(bounds.min.y).toBeLessThanOrEqual(0.08);
  });

  it('supports detail toggle, >2x HD triangles, and identical animation track bindings', () => {
    const standard = getStandard();
    const hd = getHd();
    const simple = getSimple();
    expect(countVertices(simple)).toBeLessThan(countVertices(hd));
    expect(countTriangles(hd)).toBeGreaterThan(countTriangles(standard) * 2);

    const bindings = (model: T.Group) =>
      model.animations.map(clip => [clip.name, ...clip.tracks.map(t => t.name)]);
    expect(bindings(hd)).toEqual(bindings(standard));
    for (const part of def.riggedParts) {
      expect(hd.getObjectByName(part.name)).toBeDefined();
      expect(simple.getObjectByName(part.name)).toBeDefined();
    }
    for (const part of def.detachableParts ?? []) {
      expect(hd.getObjectByName(part.name)).toBeDefined();
      expect(simple.getObjectByName(part.name)).toBeDefined();
    }
    for (const clip of hd.animations) {
      for (const track of clip.tracks) {
        const { nodeName } = T.PropertyBinding.parseTrackName(track.name);
        expect(simple.getObjectByName(nodeName)).toBeDefined();
        expect(hd.getObjectByName(nodeName)).toBeDefined();
      }
    }
  });

  it('plays animation clips at t = 0.193 * duration and drives all rigged/detachable controls', () => {
    const scene = getHd();
    expect(scene.animations.length).toBeGreaterThanOrEqual(1);
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene);
      const tracks = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        const node = scene.getObjectByName(nodeName);
        if (!node) throw new Error('Missing track node ' + nodeName);
        return { node, original: node.matrix.clone() };
      });
      scene.updateMatrixWorld(true);
      for (const tr of tracks) tr.original.copy(tr.node.matrix);
      mixer.clipAction(clip).play();
      mixer.update(clip.duration * 0.193);
      scene.updateMatrixWorld(true);
      expect(tracks.some(({ node, original }) => !node.matrix.equals(original))).toBe(true);
      mixer.stopAllAction();
      scene.updateMatrixWorld(true);
    }

    const caps: AssetCapabilities = {
      version: 1,
      name: def.name,
      riggedParts: [...def.riggedParts],
      detachableParts: [...(def.detachableParts ?? [])],
      nightZones: [],
      decals: [],
      physics: { body: def.physicsBody },
    };
    const controller = createAssetController(scene, caps);
    for (const part of def.riggedParts) {
      const node = scene.getObjectByName(part.name);
      if (!node) throw new Error('Missing rigged part ' + part.name);
      const before = node.matrixWorld.clone();
      const target = Math.abs(part.range[1]) >= 359 ? 90 : (part.range[1] !== 0 ? part.range[1] : part.range[0]);
      controller.setPart(part.name, target);
      expect(node.matrixWorld.equals(before)).toBe(false);
      controller.closePart(part.name);
    }
    controller.dispose();
  });

  it('passes auditModelCraft watertight, grounding, matte, zero-floating, and zero-Z-fighting gates', () => {
    const variants = [
      getStandard(),
      buildDef(def, { quality: 'standard', detail: false }),
      buildDef(def, { primary: '#ed5a19', accent: '#b6e623', quality: 'standard', detail: true }),
    ];
    for (const model of variants) {
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

      for (const m of collectMeshes(model)) {
        for (const mat of [m.material].flat()) {
          if (!mat.transparent && mat.metalness < 0.15) {
            expect(mat.roughness).toBeGreaterThanOrEqual(0.18);
          }
        }
      }
    }

    const model = getStandard();
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
