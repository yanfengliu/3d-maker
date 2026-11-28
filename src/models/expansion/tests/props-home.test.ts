import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { createAssetController } from '../../../capabilities/runtime';
import { writeCapabilities } from '../../../capabilities/schema';
import type { Recipe } from '../../../data/recipe';
import type { ProceduralAssetDef } from '../../collection-types';
import { extraAssets } from '../../collections';
import { auditModelCraft } from '../../craft-invariants';
import { finishes } from '../../parts';
import { culinaryMarketMeta } from '../meta/culinary-market';
import { homeFurnitureMeta, type ExpansionMetaItem } from '../meta/home-furniture';
import { kitchenAppliancesMeta } from '../meta/kitchen-appliances';
import { scienceMedicalMeta } from '../meta/science-medical';
import { workshopMachineryMeta } from '../meta/workshop-machinery';
import { culinaryMarketPack } from '../packs/culinary-market';
import { homeFurniturePack } from '../packs/home-furniture';
import { kitchenAppliancesPack } from '../packs/kitchen-appliances';
import { scienceMedicalPack } from '../packs/science-medical';
import { workshopMachineryPack } from '../packs/workshop-machinery';

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const EXPANSION_ROOT = resolve(THIS_DIR, '..');
const REPO_ROOT = resolve(EXPANSION_ROOT, '../../..');

const PACK_ENTRIES: readonly {
  readonly packId: string;
  readonly prefix: string;
  readonly meta: readonly ExpansionMetaItem[];
  readonly defs: readonly ProceduralAssetDef[];
}[] = [
  { packId: 'home-furniture', prefix: 'HF', meta: homeFurnitureMeta, defs: homeFurniturePack },
  { packId: 'kitchen-appliances', prefix: 'KA', meta: kitchenAppliancesMeta, defs: kitchenAppliancesPack },
  { packId: 'workshop-machinery', prefix: 'WM', meta: workshopMachineryMeta, defs: workshopMachineryPack },
  { packId: 'science-medical', prefix: 'SM', meta: scienceMedicalMeta, defs: scienceMedicalPack },
  { packId: 'culinary-market', prefix: 'CM', meta: culinaryMarketMeta, defs: culinaryMarketPack },
];

const ALL_ASSETS: readonly ProceduralAssetDef[] = PACK_ENTRIES.flatMap(entry => entry.defs);

function buildAsset(asset: ProceduralAssetDef, options: {
  primary?: string;
  accent?: string;
  detail?: boolean;
  quality?: 'standard' | 'hd';
} = {}): T.Group {
  const recipe: Recipe = {
    version: 1,
    template: 'cargo-pod',
    name: asset.name,
    primary: options.primary ?? asset.primary,
    accent: options.accent ?? asset.accent,
    scale: 1,
    proportion: 1,
    detail: options.detail ?? true,
    quality: options.quality ?? 'hd',
  };
  const root = new T.Group();
  root.name = 'Asset';
  asset.build(root, finishes(recipe), recipe.detail);
  return root;
}

function meshes(root: T.Object3D): PaintedMesh[] {
  const result: PaintedMesh[] = [];
  root.traverse(part => {
    if (part instanceof T.Mesh) result.push(part as PaintedMesh);
  });
  return result;
}

function vertices(root: T.Object3D): number {
  return meshes(root).reduce((sum, part) => sum + part.geometry.getAttribute('position').count, 0);
}

function triangles(root: T.Object3D): number {
  return meshes(root).reduce((sum, part) => {
    const count = part.geometry.index?.count ?? part.geometry.getAttribute('position').count;
    return sum + count / 3;
  }, 0);
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

describe('props-home 5-pack expansion metadata & repo contracts', () => {
  it('defines 100 unique props across 5 packs with exact metadata parity and zero lock collisions', () => {
    expect(ALL_ASSETS).toHaveLength(100);
    expect(new Set(ALL_ASSETS.map(a => a.id)).size).toBe(100);
    expect(new Set(ALL_ASSETS.map(a => a.code)).size).toBe(100);
    expect(new Set(ALL_ASSETS.map(a => a.name)).size).toBe(100);

    const baseIds = new Set([
      'relay-drone', 'field-rover', 'survey-bot', 'cargo-pod', 'signal-tower', 'field-pilot',
      ...extraAssets.map(a => a.id),
    ]);
    expect(ALL_ASSETS.filter(a => baseIds.has(a.id)).map(a => a.id)).toEqual([]);

    const lockRaw = readFileSync(join(REPO_ROOT, 'src/models/variations.lock.json'), 'utf8');
    const lockData = JSON.parse(lockRaw) as { entries: Record<string, { template: string }> };
    const lockedIds = new Set(Object.values(lockData.entries).map(e => e.template));
    expect(ALL_ASSETS.filter(a => !lockedIds.has(a.id)).map(a => a.id)).toEqual([]);

    for (const { packId, prefix, meta, defs } of PACK_ENTRIES) {
      expect(meta).toHaveLength(20);
      expect(defs).toHaveLength(20);
      for (let i = 0; i < 20; i++) {
        const m = meta[i];
        const d = defs[i];
        if (!m || !d) throw new Error(`Missing item at ${packId}[${String(i)}]`);
        const expectedCode = `${prefix}-${String(i + 1).padStart(2, '0')}`;
        expect(m.pack).toBe(packId);
        expect(m.code).toBe(expectedCode);
        expect(m.category).toBe('Object');
        expect(m.browseCategory).toBe('prop');
        expect(m.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(d.id).toBe(m.id);
        expect(d.code).toBe(m.code);
        expect(d.name).toBe(m.name);
        expect(d.primary).toBe(m.primary);
        expect(d.accent).toBe(m.accent);
        expect(d.description).toBe(m.description);
        expect(d.category).toBe('Object');
        expect(d.browseCategory).toBe('prop');
        expect(d.riggedParts.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('keeps metadata files free of Three.js imports and all expansion files <= 500 lines and clean', () => {
    for (const { packId } of PACK_ENTRIES) {
      const metaSource = readFileSync(join(EXPANSION_ROOT, `meta/${packId}.ts`), 'utf8');
      expect(metaSource).not.toMatch(/from\s+['"]three/);
      expect(metaSource).not.toMatch(/import\s+['"]three/);
    }
    const envPatterns = [/import\.meta\.env/, /process\.env/, /window\.location/];
    const tsFiles = walkTsFiles(EXPANSION_ROOT);
    expect(tsFiles.length).toBeGreaterThanOrEqual(26);
    for (const file of tsFiles) {
      const raw = readFileSync(file, 'utf8');
      const lines = raw.split(/\r\n|\r|\n/);
      if (lines[lines.length - 1] === '') lines.pop();
      expect(lines.length, `${file} exceeds 500 lines (${String(lines.length)})`).toBeLessThanOrEqual(500);
      for (const pat of envPatterns) {
        expect(pat.test(raw), `${file} matched forbidden pattern ${String(pat)}`).toBe(false);
      }
    }
  });
});

describe.each(ALL_ASSETS)('$code $name ($id)', asset => {
  it('uses primary/accent colors, stays within (0.55, 4.6) m bounds, and sits on y = 0', () => {
    for (const quality of ['standard', 'hd'] as const) {
      const scene = buildAsset(asset, { primary: '#ed5a19', accent: '#b6e623', quality, detail: true });
      const colors = meshes(scene).flatMap(part => [part.material].flat().map(m => m.color.getHexString()));
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

  it('reduces vertices when detail is false and produces > 2x triangles in HD with identical clips', () => {
    const stdFull = buildAsset(asset, { quality: 'standard', detail: true });
    const stdSimple = buildAsset(asset, { quality: 'standard', detail: false });
    const hdFull = buildAsset(asset, { quality: 'hd', detail: true });
    const hdSimple = buildAsset(asset, { quality: 'hd', detail: false });

    expect(vertices(stdSimple)).toBeLessThan(vertices(stdFull));
    expect(vertices(hdSimple)).toBeLessThan(vertices(hdFull));
    expect(triangles(hdFull)).toBeGreaterThan(triangles(stdFull) * 2);

    const bindings = (model: T.Group) => model.animations.map(clip => [clip.name, ...clip.tracks.map(t => t.name)]);
    expect(bindings(hdFull)).toEqual(bindings(stdFull));

    for (const part of asset.riggedParts) {
      expect(stdFull.getObjectByName(part.name)).toBeDefined();
      expect(stdSimple.getObjectByName(part.name)).toBeDefined();
      expect(hdFull.getObjectByName(part.name)).toBeDefined();
      expect(hdSimple.getObjectByName(part.name)).toBeDefined();
    }
    for (const part of asset.detachableParts ?? []) {
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

  it('plays all animation clips and drives rigged/detachable parts cleanly', () => {
    const scene = buildAsset(asset, { quality: 'hd', detail: true });
    expect(scene.animations.length).toBeGreaterThan(0);
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene);
      const tracked = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        const node = scene.getObjectByName(nodeName);
        if (!node) throw new Error(`Missing animated node ${nodeName}`);
        return { node, original: node.matrix.clone() };
      });
      scene.updateMatrixWorld(true);
      for (const entry of tracked) entry.original.copy(entry.node.matrix);
      mixer.clipAction(clip).play();
      mixer.update(clip.duration * 0.193);
      scene.updateMatrixWorld(true);
      expect(tracked.some(({ node, original }) => !node.matrix.equals(original))).toBe(true);
      mixer.stopAllAction();
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

  it('passes craft-invariants audit (watertight, grounded, zero floaters, zero Z-fighting)', () => {
    for (const detail of [true, false] as const) {
      const model = buildAsset(asset, { quality: 'standard', detail });
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
        const detachedAudit = auditModelCraft(model);
        node.visible = true;
        expect(detachedAudit.bottomToTopRatio).toBeGreaterThanOrEqual(0.55);
        expect(detachedAudit.backToFrontRatio).toBeGreaterThanOrEqual(0.55);
        expect(detachedAudit.floatingComponents).toEqual([]);
      }
    }
  });
});
