import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { createAssetController } from '../../capabilities/runtime';
import { writeCapabilities } from '../../capabilities/schema';
import type { Recipe } from '../../data/recipe';
import { finishes } from '../parts';
import { gearPack, type GearAssetDef } from './gear-pack';
import { propsPack, type PropAssetDef } from './props-pack';

type PackAsset = PropAssetDef | GearAssetDef;
type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const allAssets: readonly PackAsset[] = [...propsPack, ...gearPack];

function buildPackAsset(asset: PackAsset, options: {
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

describe('props and gear packs metadata', () => {
  it('defines 20 unique models across props, handheld items, and attachments', () => {
    expect(propsPack).toHaveLength(10);
    expect(gearPack).toHaveLength(10);
    expect(allAssets).toHaveLength(20);
    expect(new Set(allAssets.map(a => a.id)).size).toBe(20);
    expect(new Set(allAssets.map(a => a.code)).size).toBe(20);
    expect(new Set(allAssets.map(a => a.name)).size).toBe(20);
    expect(propsPack.every(a => a.browseCategory === 'prop')).toBe(true);
    expect(gearPack.filter(a => a.browseCategory === 'ultra')).toHaveLength(6);
    expect(gearPack.filter(a => a.browseCategory === 'attachment')).toHaveLength(4);
    expect(allAssets.map(a => a.category)).toEqual(Array.from({ length: 20 }, () => 'Object'));
  });

  it('keeps street-vending-unit CanDisplay unobstructed behind transparent glass and grandfather-clock GlassDoor transparent', () => {
    const vendDef = propsPack.find(a => a.id === 'street-vending-unit');
    const clockDef = propsPack.find(a => a.id === 'grandfather-clock');
    if (!vendDef || !clockDef) throw new Error('Missing expected prop defs');

    const vend = buildPackAsset(vendDef, { quality: 'hd', detail: true });
    vend.updateMatrixWorld(true);
    const cans = vend.getObjectByName('CanDisplay');
    const unit = vend.getObjectByName('VendingUnit');
    if (!cans || !unit) throw new Error('Missing vending nodes');
    const canBoxes = meshes(cans).map(can => new T.Box3().setFromObject(can));
    expect(canBoxes).toHaveLength(12);
    const opaqueOccluding = meshes(unit).filter(part => {
      const mats = [part.material].flat();
      if (mats.every(m => m.transparent && m.opacity < 0.5)) return false;
      const box3 = new T.Box3().setFromObject(part);
      return canBoxes.some(cb =>
        box3.min.x < cb.max.x && box3.max.x > cb.min.x &&
        box3.min.y < cb.max.y && box3.max.y > cb.min.y &&
        box3.max.z > cb.min.z + 0.01,
      );
    });
    expect(opaqueOccluding).toHaveLength(0);
    const glassPanes = meshes(unit).filter(part => [part.material].flat().some(m => m.transparent && m.opacity < 0.5));
    expect(glassPanes.length).toBeGreaterThan(0);

    const clock = buildPackAsset(clockDef, { quality: 'hd', detail: true });
    const door = clock.getObjectByName('GlassDoor');
    if (!door) throw new Error('Missing GlassDoor');
    expect(meshes(door).some(part => [part.material].flat().some(m => m.transparent && m.opacity < 0.5))).toBe(true);
  });
});

describe.each(allAssets)('$code $name ($id)', asset => {
  it('builds finite geometry using both primary and accent colors inside bounds', () => {
    for (const quality of ['standard', 'hd'] as const) {
      const scene = buildPackAsset(asset, { primary: '#ed5a19', accent: '#b6e623', quality, detail: true });
      const colors = meshes(scene).flatMap(part => [part.material].flat().map(m => m.color.getHexString()));
      expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']));

      scene.updateMatrixWorld(true);
      const bounds = new T.Box3().setFromObject(scene);
      const size = bounds.getSize(new T.Vector3()).toArray();
      for (const v of size) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(0.5);
        expect(v).toBeLessThan(5);
      }
      expect(bounds.min.y).toBeGreaterThan(-0.025);
      expect(bounds.min.y).toBeLessThan(0.08);
    }
  });

  it('reduces vertices when detail is false while keeping all rigged, detachable, and animated nodes', () => {
    for (const quality of ['standard', 'hd'] as const) {
      const full = buildPackAsset(asset, { detail: true, quality });
      const simple = buildPackAsset(asset, { detail: false, quality });
      expect(vertices(simple)).toBeLessThan(vertices(full));
      for (const part of asset.riggedParts) {
        expect(full.getObjectByName(part.name)).toBeDefined();
        expect(simple.getObjectByName(part.name)).toBeDefined();
      }
      for (const part of asset.detachableParts) {
        expect(full.getObjectByName(part.name)).toBeDefined();
        expect(simple.getObjectByName(part.name)).toBeDefined();
      }
      for (const clip of full.animations) {
        for (const track of clip.tracks) {
          expect(simple.getObjectByName(T.PropertyBinding.parseTrackName(track.name).nodeName)).toBeDefined();
        }
      }
    }
  });

  it('produces > 2x triangles in HD mode with identical clip names and track bindings', () => {
    const standard = buildPackAsset(asset, { quality: 'standard', detail: true });
    const hd = buildPackAsset(asset, { quality: 'hd', detail: true });
    expect(triangles(hd)).toBeGreaterThan(triangles(standard) * 2);
    const bindings = (model: T.Group) => model.animations.map(clip => [clip.name, ...clip.tracks.map(track => track.name)]);
    expect(bindings(hd)).toEqual(bindings(standard));
    for (const clip of hd.animations) {
      for (const track of clip.tracks) {
        expect(hd.getObjectByName(T.PropertyBinding.parseTrackName(track.name).nodeName)).toBeDefined();
      }
    }
  });

  it('plays every animation clip and drives rigged and detachable parts via AssetController', () => {
    const scene = buildPackAsset(asset, { quality: 'hd', detail: true });
    expect(scene.animations.length).toBeGreaterThan(0);
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene);
      const tracked = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        const node = scene.getObjectByName(nodeName);
        if (!node) throw new Error('Missing joint ' + nodeName);
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
      detachableParts: [...asset.detachableParts],
      nightZones: [],
      decals: [],
      physics: { body: asset.physicsBody },
    });
    const controller = createAssetController(scene);
    for (const part of asset.riggedParts) {
      expect(controller.openPart(part.name)).not.toBe(0);
      expect(controller.closePart(part.name)).toBe(0);
    }
    for (const part of asset.detachableParts) {
      controller.setVisible(part.name, false);
      expect(controller.isVisible(part.name)).toBe(false);
      controller.setVisible(part.name, true);
      expect(controller.isVisible(part.name)).toBe(true);
    }
    controller.dispose();
  });
});
