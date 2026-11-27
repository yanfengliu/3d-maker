import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { createAssetController } from '../../capabilities/runtime';
import { writeCapabilities } from '../../capabilities/schema';
import type { Recipe } from '../../data/recipe';
import { finishes } from '../parts';
import { buildingsSciA } from './buildings-sci-a';
import { buildingsSciB } from './buildings-sci-b';

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const allBuildings = [...buildingsSciA, ...buildingsSciB];

function meshes(root: T.Object3D): PaintedMesh[] {
  const result: PaintedMesh[] = [];
  root.traverse(part => {
    if (part instanceof T.Mesh) result.push(part as PaintedMesh);
  });
  return result;
}

function vertices(model: T.Group): number {
  return meshes(model).reduce((count, part) => count + part.geometry.getAttribute('position').count, 0);
}

function triangles(model: T.Group): number {
  return meshes(model).reduce((sum, part) => {
    const count = part.geometry.index?.count ?? part.geometry.getAttribute('position').count;
    return sum + count / 3;
  }, 0);
}

function buildAsset(
  asset: typeof allBuildings[number],
  options: { detail?: boolean; quality?: 'standard' | 'hd'; primary?: string; accent?: string } = {},
): T.Group {
  const recipe: Recipe = {
    version: 1,
    template: 'signal-tower',
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

describe('buildings-sci collection metadata', () => {
  it('exports 14 unique sci-fi, industrial, and fantasy building definitions', () => {
    expect(buildingsSciA).toHaveLength(7);
    expect(buildingsSciB).toHaveLength(7);
    expect(allBuildings).toHaveLength(14);
    expect(new Set(allBuildings.map(item => item.id)).size).toBe(14);
    expect(new Set(allBuildings.map(item => item.code)).size).toBe(14);
    expect(new Set(allBuildings.map(item => item.name)).size).toBe(14);
    for (const item of allBuildings) {
      expect(item.category).toBe('Object');
      expect(item.browseCategory).toBe('building');
      expect(item.physicsBody).toBe('static');
      expect(item.primary).toMatch(/^#[\da-f]{6}$/i);
      expect(item.accent).toMatch(/^#[\da-f]{6}$/i);
      expect(item.description.trim().length).toBeGreaterThan(10);
      expect(item.riggedParts.length).toBeGreaterThan(0);
    }
  });
});

describe.each(allBuildings)('$code $name', asset => {
  it('builds finite grounded geometry using both requested paint colors', () => {
    for (const quality of ['standard', 'hd'] as const) {
      const scene = buildAsset(asset, { quality, primary: '#ed5a19', accent: '#b6e623' });
      const colors = meshes(scene).flatMap(part =>
        [part.material].flat().map(material => material.color.getHexString()),
      );
      expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']));
      const bounds = new T.Box3().setFromObject(scene);
      const size = bounds.getSize(new T.Vector3()).toArray();
      expect(size.every(v => Number.isFinite(v) && v > 0.5 && v < 5)).toBe(true);
      expect(bounds.min.y).toBeGreaterThan(-0.025);
    }
  });

  it('reduces vertices when detail is false while preserving all named nodes', () => {
    for (const quality of ['standard', 'hd'] as const) {
      const detailed = buildAsset(asset, { detail: true, quality });
      const simplified = buildAsset(asset, { detail: false, quality });
      expect(vertices(simplified)).toBeLessThan(vertices(detailed));
      for (const clip of detailed.animations) {
        for (const track of clip.tracks) {
          const { nodeName } = T.PropertyBinding.parseTrackName(track.name);
          expect(simplified.getObjectByName(nodeName)).toBeDefined();
        }
      }
      for (const part of asset.riggedParts) {
        expect(simplified.getObjectByName(part.name)).toBeDefined();
      }
      for (const part of asset.detachableParts) {
        expect(simplified.getObjectByName(part.name)).toBeDefined();
      }
    }
  });

  it('exceeds 2x triangle count in HD with identical clip and track bindings', () => {
    const standard = buildAsset(asset, { quality: 'standard' });
    const hd = buildAsset(asset, { quality: 'hd' });
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

  it('plays every clip through the three.js mixer and moves tracked nodes at 0.193 * duration', () => {
    const scene = buildAsset(asset, { quality: 'hd' });
    expect(scene.animations.length).toBeGreaterThan(0);
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene);
      const tracks = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        const node = scene.getObjectByName(nodeName);
        if (!node) throw new Error('Missing animated node ' + nodeName);
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

  it('exposes working riggedParts and detachableParts through AssetController', () => {
    const scene = buildAsset(asset, { quality: 'hd' });
    writeCapabilities(scene, {
      version: 1,
      name: asset.name,
      description: asset.description,
      source: { kind: 'original', id: asset.id },
      riggedParts: [...asset.riggedParts],
      detachableParts: [...asset.detachableParts],
      nightZones: [],
      decals: [],
      physics: { body: asset.physicsBody },
    });
    const controller = createAssetController(scene);
    for (const part of asset.riggedParts) {
      const node = scene.getObjectByName(part.name);
      expect(node).toBeDefined();
      if (!node) continue;
      scene.updateMatrixWorld(true);
      const rest = node.matrix.clone();
      if (Math.abs(part.range[1]) >= 359) {
        controller.setPart(part.name, 90);
      } else {
        controller.openPart(part.name);
      }
      scene.updateMatrixWorld(true);
      expect(node.matrix.equals(rest)).toBe(false);
      controller.closePart(part.name);
    }
    for (const part of asset.detachableParts) {
      const node = scene.getObjectByName(part.name);
      expect(node).toBeDefined();
      controller.setVisible(part.name, false);
      expect(node?.visible).toBe(false);
      controller.setVisible(part.name, true);
      expect(node?.visible).toBe(true);
    }
    controller.dispose();
  });
});
