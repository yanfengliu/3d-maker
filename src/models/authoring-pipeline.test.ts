import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { deriveIkMetadata } from '../capabilities/ik-derive';
import { inspectAsset } from '../capabilities/runtime';
import { parseCapabilities, parseRecipeParams, resolveModelParams } from '../capabilities/schema';
import { checkRiggedSweep } from '../capabilities/sweep';
import { catalog, parseRecipe, resolveVariationRecipe } from '../data/recipe';
import { auditModelCraft } from './craft-invariants';
import { buildModel } from './index';
import { HARBOR_PAVILION_PARAM_SPECS } from './kits/harbor-pavilion';
import { mergeStaticParts } from './merge-static';

function countMeshes(root: T.Object3D): number {
  let count = 0;
  root.traverse(node => {
    if (node instanceof T.Mesh) count++;
  });
  return count;
}

describe('static mesh merging and deterministic vertex-color tone jitter', () => {
  it('compresses many matte static meshes into 1 draw call while preserving rigged/detachable subtrees', () => {
    const root = new T.Group();
    const matte = new T.MeshStandardMaterial({ color: '#8b6244', roughness: 0.86, metalness: 0 });
    const brass = new T.MeshStandardMaterial({ color: '#b9934c', roughness: 0.44, metalness: 0.55 });
    for (let i = 0; i < 24; i++) {
      const plank = new T.Mesh(new T.BoxGeometry(0.4, 0.08, 0.3), matte);
      plank.position.set(i * 0.42, 0.04, 0);
      root.add(plank);
    }
    for (let i = 0; i < 4; i++) {
      const bolt = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.06), brass);
      bolt.position.set(i * 0.5, 0.11, 0);
      root.add(bolt);
    }
    const door = new T.Group();
    door.name = 'HingedDoor';
    const leaf = new T.Mesh(new T.BoxGeometry(0.8, 1.8, 0.05), matte);
    leaf.position.set(0.4, 0.9, 0);
    door.add(leaf);
    root.add(door);

    expect(countMeshes(root)).toBe(29);
    const report = mergeStaticParts(root, { preserveNames: new Set(['HingedDoor']), tone: 0.45, seed: 99 });
    expect(report.mergedMeshes).toBe(28);
    expect(report.drawCalls).toBe(2); // 1 matte + 1 metal
    expect(report.preservedMeshes).toBe(1);
    expect(countMeshes(root)).toBe(3); // 2 merged + 1 preserved door leaf
    expect(root.getObjectByName('HingedDoor')).toBe(door);

    // Check deterministic per-element vertex-color variation when tone > 0 vs uniform when tone === 0.
    const matteMerged = root.getObjectByName('StaticMatte') as T.Mesh | undefined;
    expect(matteMerged).toBeDefined();
    const colorAttr = matteMerged?.geometry.getAttribute('color') as T.BufferAttribute | undefined;
    expect(colorAttr).toBeDefined();
    const uniqueReds = new Set<string>();
    if (colorAttr) {
      for (let i = 0; i < colorAttr.count; i++) uniqueReds.add(colorAttr.getX(i).toFixed(4));
    }
    expect(uniqueReds.size).toBeGreaterThan(8);

    // Compare against tone = 0: every vertex gets the exact uniform base color.
    const flatRoot = new T.Group();
    for (let i = 0; i < 6; i++) {
      const m = new T.Mesh(new T.BoxGeometry(0.3, 0.1, 0.3), matte);
      m.position.set(i * 0.35, 0.05, 0);
      flatRoot.add(m);
    }
    mergeStaticParts(flatRoot, { tone: 0, seed: 99 });
    const flatMesh = flatRoot.getObjectByName('StaticMatte') as T.Mesh | undefined;
    const flatColors = flatMesh?.geometry.getAttribute('color') as T.BufferAttribute | undefined;
    const flatReds = new Set<string>();
    if (flatColors) {
      for (let i = 0; i < flatColors.count; i++) flatReds.add(flatColors.getX(i).toFixed(4));
    }
    expect(flatReds.size).toBe(1);
  });
});

describe('semantic structural knobs and kit-grammar harbor-timber-kit showcase', () => {
  it('validates Recipe.params strictly and rejects unknown keys or out-of-range values', () => {
    const valid = parseRecipeParams({ bays: 4, roofPitch: 36, awning: false, colorway: 'cedar-slate', tone: 0.5 }, HARBOR_PAVILION_PARAM_SPECS);
    expect(valid).toEqual({ bays: 4, roofPitch: 36, awning: false, colorway: 'cedar-slate', tone: 0.5 });

    expect(() => parseRecipeParams({ nonexistent: 1 }, HARBOR_PAVILION_PARAM_SPECS)).toThrow(/Unknown model parameter/);
    expect(() => parseRecipeParams({ bays: 9 }, HARBOR_PAVILION_PARAM_SPECS)).toThrow(/between 2 and 4/);
    expect(() => parseRecipeParams({ colorway: 'neon-pink' }, HARBOR_PAVILION_PARAM_SPECS)).toThrow(/must be one of/);
    expect(() => parseRecipeParams({ bays: 3 }, undefined)).toThrow(/does not accept/);

    const defaults = resolveModelParams(HARBOR_PAVILION_PARAM_SPECS);
    expect(defaults).toEqual({ bays: 3, roofPitch: 34, awning: true, colorway: 'harbor-oak', tone: 0.4 });
  });

  it('rebuilds market-pavilion@harbor-timber-kit across structural knob extremes with compact draw calls and clean craft invariants', () => {
    const baseRecipe = resolveVariationRecipe('market-pavilion', 'harbor-timber-kit');
    const baseModel = buildModel(baseRecipe);
    const baseCaps = inspectAsset(baseModel);

    expect(baseCaps.source?.kit).toBe('harbor-timber');
    expect(baseCaps.params?.length).toBe(HARBOR_PAVILION_PARAM_SPECS.length);
    // Static merge compresses 150+ shingles, kerb blocks, posts, and crates into <= 10 draw calls
    // while keeping live primary/accent tint zones, rigged HangingSign, and detachable ProduceStall intact!
    expect(countMeshes(baseModel)).toBeLessThanOrEqual(10);

    // JSON round-trip preserves declared params specs intact.
    const roundTripped = parseCapabilities(JSON.parse(JSON.stringify(baseCaps)));
    expect(roundTripped?.params).toEqual(baseCaps.params);

    const configs = [
      { bays: 2, roofPitch: 24, awning: false, colorway: 'coastal-chalk', tone: 0.2 },
      { bays: 3, roofPitch: 34, awning: true, colorway: 'harbor-oak', tone: 0.4 },
      { bays: 4, roofPitch: 40, awning: true, colorway: 'cedar-slate', tone: 0.85 },
    ] as const;

    const widths: number[] = [];
    const heights: number[] = [];
    for (const params of configs) {
      const recipe = parseRecipe({ ...baseRecipe, params: { ...params } });
      const model = buildModel(recipe);
      const audit = auditModelCraft(model);
      expect(audit.nonFiniteVertices).toBe(0);
      expect(audit.doubleSidedMeshes).toEqual([]);
      expect(audit.materialIssues).toEqual([]);
      expect(audit.minY).toBeGreaterThanOrEqual(-0.02);
      expect(audit.minY).toBeLessThanOrEqual(0.02);
      expect(audit.floatingComponents).toEqual([]);
      expect(audit.exposedZFightPairs).toEqual([]);
      expect(audit.bottomToTopRatio).toBeGreaterThanOrEqual(0.55);
      expect(audit.backToFrontRatio).toBeGreaterThanOrEqual(0.55);
      expect(countMeshes(model)).toBeLessThanOrEqual(12);

      const sweep = checkRiggedSweep(model, { steps: 9, tolerance: 0.015 });
      expect(sweep.issues).toEqual([]);

      const caps = inspectAsset(model);
      widths.push(caps.dimensions?.sizeM.x ?? 0);
      heights.push(caps.dimensions?.sizeM.y ?? 0);
    }

    // 2 bays < 3 bays < 4 bays in width, and 22° < 30° < 38° in ridge height!
    expect((widths[0] ?? 0) < (widths[1] ?? 0) && (widths[1] ?? 0) < (widths[2] ?? 0)).toBe(true);
    expect((heights[0] ?? 0) < (heights[1] ?? 0) && (heights[1] ?? 0) < (heights[2] ?? 0)).toBe(true);
  });
});

describe('measured IK metadata derivation across characters and articulated arms', () => {
  it('derives measured bipedal legs IK with positive segment lengths across all original Character templates', () => {
    const characters = catalog.filter(entry => entry.category === 'Character');
    expect(characters.length).toBeGreaterThanOrEqual(16);

    for (const entry of characters) {
      const model = buildModel({ ...entry.recipe, quality: 'standard' });
      const caps = inspectAsset(model);
      expect(caps.ik?.type, `${entry.id} missing legs IK`).toBe('legs');
      const legs = caps.ik?.legs;
      expect(legs, `${entry.id} missing measured legs block`).toBeDefined();
      expect(legs?.hipHeightM).toBeGreaterThan(0.3);
      expect(legs?.strideM).toBeGreaterThan(0.2);
      expect(legs?.stepHeightM).toBeGreaterThan(0.03);
      expect(legs?.duty).toBeGreaterThan(0.4);
      expect(legs?.limbs.length).toBe(2);
      expect(legs?.phaseOrder).toEqual(['LeftLeg', 'RightLeg']);
      for (const limb of legs?.limbs ?? []) {
        expect(limb.upperM).toBeGreaterThan(0.1);
        expect(limb.lowerM).toBeGreaterThan(0.1);
      }

      // JSON round-trip via parseCapabilities preserves measured IK cleanly.
      const rt = parseCapabilities(JSON.parse(JSON.stringify(caps)));
      expect(rt?.ik).toEqual(caps.ik);
    }
  });

  it('derives measured arm reach IK for crane/arm articulated machinery and returns undefined for static buildings', () => {
    const boathouse = buildModel(resolveVariationRecipe('canal-boathouse'));
    const boatCaps = inspectAsset(boathouse);
    expect(boatCaps.ik?.type).toBe('arm');
    expect(boatCaps.ik?.arm?.reachM).toBeGreaterThan(0.3);
    expect(boatCaps.ik?.arm?.segments.some(s => s.name === 'MooringCrane')).toBe(true);

    const staticProp = new T.Group();
    const boxMesh = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ roughness: 0.85 }));
    boxMesh.position.y = 0.5;
    staticProp.add(boxMesh);
    expect(deriveIkMetadata(staticProp)).toBeUndefined();
  });
});
