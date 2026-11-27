import * as T from 'three';
import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../data/recipe';
import { finishes } from '../parts';
import { buildingsTownA, type TownBuildingDef } from './buildings-town-a';
import { buildingsTownB } from './buildings-town-b';

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>;

const allBuildings: readonly TownBuildingDef[] = [...buildingsTownA, ...buildingsTownB];

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

function buildEntry(def: TownBuildingDef, opts: { primary?: string; accent?: string; detail?: boolean; quality?: 'standard' | 'hd' } = {}) {
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

describe('buildings-town collection metadata', () => {
  it('defines 16 unique building entries with valid codes and hex colors', () => {
    expect(buildingsTownA).toHaveLength(8);
    expect(buildingsTownB).toHaveLength(8);
    expect(allBuildings).toHaveLength(16);
    expect(new Set(allBuildings.map(d => d.id)).size).toBe(16);
    expect(new Set(allBuildings.map(d => d.code)).size).toBe(16);
    expect(new Set(allBuildings.map(d => d.name)).size).toBe(16);
    for (const def of allBuildings) {
      expect(def.category).toBe('Object');
      expect(def.browseCategory).toBe('building');
      expect(def.physicsBody).toBe('static');
      expect(def.primary).toMatch(/^#[\da-f]{6}$/i);
      expect(def.accent).toMatch(/^#[\da-f]{6}$/i);
      expect(def.description.trim().length).toBeGreaterThan(15);
      expect(def.riggedParts.length).toBeGreaterThan(0);
      for (const part of def.riggedParts) {
        expect(['rotate', 'slide']).toContain(part.type);
        expect(['x', 'y', 'z']).toContain(part.axis);
        expect(part.range[0]).not.toBe(part.range[1]);
      }
    }
  });
});

describe.each(allBuildings)('$code $name ($id)', def => {
  it('builds finite grounded geometry using both primary and accent colors', () => {
    for (const quality of ['standard', 'hd'] as const) {
      const scene = buildEntry(def, { primary: '#ed5a19', accent: '#b6e623', detail: true, quality });
      const colors = meshes(scene).flatMap(m => [m.material].flat().map(mat => mat.color.getHexString()));
      expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']));
      scene.updateMatrixWorld(true);
      const bounds = new T.Box3().setFromObject(scene);
      const size = bounds.getSize(new T.Vector3()).toArray();
      expect(size.every(v => Number.isFinite(v) && v > 0.5 && v < 5)).toBe(true);
      expect(bounds.min.y).toBeGreaterThan(-0.025);
    }
  });

  it('reduces vertices when detail is false while preserving all rigged, detachable, and animated nodes', () => {
    const detailed = buildEntry(def, { detail: true, quality: 'hd' });
    const simple = buildEntry(def, { detail: false, quality: 'hd' });
    expect(vertices(simple)).toBeLessThan(vertices(detailed));
    const simpleStd = buildEntry(def, { detail: false, quality: 'standard' });
    const detailedStd = buildEntry(def, { detail: true, quality: 'standard' });
    expect(vertices(simpleStd)).toBeLessThan(vertices(detailedStd));
    for (const part of def.riggedParts) {
      expect(detailed.getObjectByName(part.name)).toBeDefined();
      expect(simple.getObjectByName(part.name)).toBeDefined();
    }
    for (const part of def.detachableParts) {
      expect(detailed.getObjectByName(part.name)).toBeDefined();
      expect(simple.getObjectByName(part.name)).toBeDefined();
    }
    for (const clip of detailed.animations) {
      for (const track of clip.tracks) {
        const { nodeName } = T.PropertyBinding.parseTrackName(track.name);
        expect(simple.getObjectByName(nodeName)).toBeDefined();
      }
    }
  });

  it('produces >2x triangles in HD with identical animation bindings', () => {
    const standard = buildEntry(def, { detail: true, quality: 'standard' });
    const hd = buildEntry(def, { detail: true, quality: 'hd' });
    expect(triangles(hd)).toBeGreaterThan(triangles(standard) * 2);
    const bindings = (model: T.Group) => model.animations.map(clip => [clip.name, ...clip.tracks.map(t => t.name)]);
    expect(bindings(hd)).toEqual(bindings(standard));
    for (const clip of hd.animations) {
      for (const track of clip.tracks) {
        const { nodeName } = T.PropertyBinding.parseTrackName(track.name);
        expect(hd.getObjectByName(nodeName)).toBeDefined();
      }
    }
  });

  it('plays every animation clip with visible matrix motion at t = duration * 0.193', () => {
    const scene = buildEntry(def, { detail: true, quality: 'hd' });
    expect(scene.animations.length).toBeGreaterThan(0);
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene);
      const tracked = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name);
        expect(['quaternion', 'position', 'scale']).toContain(propertyName);
        const node = scene.getObjectByName(nodeName);
        if (!node) throw new Error('Missing animated node ' + nodeName);
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
  });
});
