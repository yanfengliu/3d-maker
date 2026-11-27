import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { createAssetController } from '../../capabilities/runtime';
import type { AssetCapabilities } from '../../capabilities/schema';
import type { Recipe } from '../../data/recipe';
import { finishes } from '../parts';
import { vehiclesA } from './vehicles-a';
import { vehiclesB } from './vehicles-b';

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const allVehicles = [...vehiclesA, ...vehiclesB];

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

function buildAsset(
  def: typeof allVehicles[number],
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

describe('vehicles collection metadata', () => {
  it('defines 16 unique vehicle assets split 8 + 8 with expected IDs and codes', () => {
    expect(vehiclesA).toHaveLength(8);
    expect(vehiclesB).toHaveLength(8);
    expect(allVehicles.map(v => v.id)).toEqual([
      'vintage-biplane', 'steam-locomotive', 'harbor-tugboat', 'rescue-helicopter',
      'city-tramcar', 'coastal-sailboat', 'warehouse-forklift', 'desert-hover-skiff',
      'deep-submersible', 'parcel-delivery-van', 'hot-air-balloon', 'farm-tractor',
      'arctic-snowcat', 'lunar-lander', 'racing-hoverbike', 'armored-railcar',
    ]);
    expect(allVehicles.map(v => v.code)).toEqual(
      Array.from({ length: 16 }, (_, i) => 'VH-' + String(i + 1).padStart(2, '0')),
    );
    expect(new Set(allVehicles.map(v => v.name)).size).toBe(16);
    for (const v of allVehicles) {
      expect(v.category).toBe('Object');
      expect(v.browseCategory).toBe('vehicle');
      expect(v.physicsBody).toBe('dynamic');
      expect(v.primary).toMatch(/^#[\da-f]{6}$/i);
      expect(v.accent).toMatch(/^#[\da-f]{6}$/i);
      expect(v.description.trim().length).toBeGreaterThan(10);
    }
  });
});

describe.each(allVehicles)('$code $name ($id)', def => {
  it('builds finite grounded geometry using both primary and accent colors', () => {
    const scene = buildAsset(def, { primary: '#ed5a19', accent: '#b6e623', quality: 'hd', detail: true });
    const builtMeshes = meshes(scene);
    expect(builtMeshes.length).toBeGreaterThan(5);
    const colors = builtMeshes.flatMap(item =>
      [item.material].flat().map(mat => mat.color.getHexString()),
    );
    expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']));
    for (const item of builtMeshes) {
      const pos = item.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        expect(Number.isFinite(pos.getX(i))).toBe(true);
        expect(Number.isFinite(pos.getY(i))).toBe(true);
        expect(Number.isFinite(pos.getZ(i))).toBe(true);
      }
    }
    const bounds = new T.Box3().setFromObject(scene);
    const size = bounds.getSize(new T.Vector3()).toArray();
    expect(size.every(v => Number.isFinite(v) && v > 0.5 && v < 5)).toBe(true);
    expect(bounds.min.y).toBeGreaterThan(-0.025);
    expect(bounds.min.y).toBeLessThan(0.05);
  });

  it('reduces vertices with detail: false while keeping all rigged, detachable, and animated nodes', () => {
    const detailed = buildAsset(def, { detail: true, quality: 'hd' });
    const simplified = buildAsset(def, { detail: false, quality: 'hd' });
    expect(vertices(simplified)).toBeLessThan(vertices(detailed));
    for (const part of def.riggedParts) {
      expect(detailed.getObjectByName(part.name)).toBeDefined();
      expect(simplified.getObjectByName(part.name)).toBeDefined();
    }
    for (const part of def.detachableParts) {
      expect(detailed.getObjectByName(part.name)).toBeDefined();
      expect(simplified.getObjectByName(part.name)).toBeDefined();
    }
    for (const clip of detailed.animations) {
      for (const track of clip.tracks) {
        const { nodeName } = T.PropertyBinding.parseTrackName(track.name);
        expect(simplified.getObjectByName(nodeName)).toBeDefined();
      }
    }
  });

  it('produces > 2x triangles in HD with identical clip and track bindings', () => {
    const standard = buildAsset(def, { quality: 'standard', detail: true });
    const hd = buildAsset(def, { quality: 'hd', detail: true });
    expect(triangles(hd)).toBeGreaterThan(triangles(standard) * 2);
    const bindings = (model: T.Group) =>
      model.animations.map(clip => [clip.name, ...clip.tracks.map(track => track.name)]);
    expect(bindings(hd)).toEqual(bindings(standard));
    for (const clip of hd.animations) {
      for (const track of clip.tracks) {
        const { nodeName } = T.PropertyBinding.parseTrackName(track.name);
        expect(hd.getObjectByName(nodeName)).toBeDefined();
      }
    }
  });

  it('plays every animation clip cleanly and moves targeted joints at t = 0.193 * duration', () => {
    const scene = buildAsset(def, { quality: 'hd', detail: true });
    expect(scene.animations.length).toBeGreaterThan(0);
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene);
      const tracks = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        const node = scene.getObjectByName(nodeName);
        if (!node) throw new Error('Missing joint ' + nodeName);
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
  });

  it('drives every rigged part and toggles every detachable part via AssetController', () => {
    const scene = buildAsset(def, { quality: 'hd', detail: true });
    const caps: AssetCapabilities = {
      version: 1,
      name: def.name,
      riggedParts: [...def.riggedParts],
      detachableParts: [...def.detachableParts],
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
    for (const part of def.detachableParts) {
      const node = scene.getObjectByName(part.name);
      if (!node) throw new Error('Missing detachable part ' + part.name);
      controller.setVisible(part.name, false);
      expect(node.visible).toBe(false);
      controller.setVisible(part.name, true);
      expect(node.visible).toBe(true);
    }
    controller.dispose();
  });
});
