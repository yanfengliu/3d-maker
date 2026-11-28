import * as T from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { inspectAsset } from '../../capabilities/runtime';
import { catalog, resolveVariationRecipe, type Recipe } from '../../data/recipe';
import type { ProceduralAssetDef } from '../collection-types';
import { fingerprintGroup } from '../fingerprint';
import { buildModel } from '../index';
import { box, group, rotationTrack } from '../parts';
import { buildStudioModel, ensureStudioTemplateLoaded, needsExpansionLoad } from '../studio-build';
import {
  createExpansionLazyLoader,
  ensureExpansionPackLoaded,
  preloadAllExpansionPacks,
} from './lazy';
import { expansionMeta, expansionMetaById, expansionPackOf } from './meta';
import {
  allLoadedExpansionAssets,
  getExpansionAsset,
  isExpansionPackLoaded,
  registerExpansionPack,
  unregisterExpansionPack,
} from './registry';
import { EXPANSION_PACK_IDS, isExpansionPackId } from './types';

function makeMockAsset(id: string): ProceduralAssetDef {
  return {
    id,
    code: 'MK-01',
    category: 'Object',
    browseCategory: 'prop',
    name: 'Mock Crate',
    primary: '#c44536',
    accent: '#2b59c3',
    description: 'Synthetic expansion crate used to verify lazy loading and registry wiring.',
    physicsBody: 'dynamic',
    riggedParts: [
      { name: 'Lid', label: 'Crate lid', type: 'rotate', axis: 'x', range: [0, -70], describe: 'Opens the crate lid' },
    ],
    build: (root, p, detail) => {
      box(root, [0, 0.35, 0], [0.9, 0.7, 0.9], p.primary);
      const lid = group(root, 'Lid', [0, 0.7, -0.42]);
      box(lid, [0, 0.05, 0.42], [0.92, 0.1, 0.92], p.accent);
      if (detail) box(lid, [0, 0.12, 0.78], [0.22, 0.04, 0.06], p.alloy);
      root.animations.push(new T.AnimationClip('Lid sway', 2, [rotationTrack('Lid', 'x', [0, 1, 2], [0, -0.4, 0])]));
    },
  };
}

const mockPacksToClean = new Set<string>();

afterEach(() => {
  for (const packId of mockPacksToClean) unregisterExpansionPack(packId);
  mockPacksToClean.clear();
});

describe('expansion types, metadata, and registry plumbing', () => {
  it('declares 25 unique kebab-case expansion pack IDs and consistent metadata maps', () => {
    expect(EXPANSION_PACK_IDS).toHaveLength(25);
    expect(new Set(EXPANSION_PACK_IDS).size).toBe(25);
    for (const packId of EXPANSION_PACK_IDS) {
      expect(packId).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(isExpansionPackId(packId)).toBe(true);
    }
    expect(isExpansionPackId('not-a-real-pack')).toBe(false);
    expect(expansionMetaById.size).toBe(expansionMeta.length);
    for (const item of expansionMeta) {
      expect(expansionPackOf(item.id)).toBe(item.pack);
    }
    expect(expansionPackOf('relay-drone')).toBeUndefined();
  });

  it('registers, queries, and unregisters expansion packs cleanly', () => {
    const packId = '__test-registry-pack__';
    const defA = makeMockAsset('__test-reg-a__');
    const defB = makeMockAsset('__test-reg-b__');
    mockPacksToClean.add(packId);

    expect(isExpansionPackLoaded(packId)).toBe(false);
    expect(getExpansionAsset(defA.id)).toBeUndefined();

    registerExpansionPack(packId, [defA, defB]);
    expect(isExpansionPackLoaded(packId)).toBe(true);
    expect(getExpansionAsset(defA.id)).toBe(defA);
    expect(getExpansionAsset(defB.id)).toBe(defB);
    expect(allLoadedExpansionAssets()).toEqual(expect.arrayContaining([defA, defB]));

    unregisterExpansionPack(packId);
    expect(isExpansionPackLoaded(packId)).toBe(false);
    expect(getExpansionAsset(defA.id)).toBeUndefined();
    expect(getExpansionAsset(defB.id)).toBeUndefined();
  });
});

describe('expansion lazy loader deduplication and recovery', () => {
  it('deduplicates concurrent loads for templates in the same pack and caches loaded packs', async () => {
    const packA = '__test-lazy-pack-a__';
    const packB = '__test-lazy-pack-b__';
    mockPacksToClean.add(packA);
    mockPacksToClean.add(packB);

    let callsA = 0;
    let releaseA: ((defs: readonly ProceduralAssetDef[]) => void) | undefined;
    let attemptsB = 0;
    const defA1 = makeMockAsset('__test-lazy-a1__');
    const defA2 = makeMockAsset('__test-lazy-a2__');
    const defB1 = makeMockAsset('__test-lazy-b1__');

    const packMap: Record<string, string> = {
      [defA1.id]: packA,
      [defA2.id]: packA,
      [defB1.id]: packB,
    };
    const loader = createExpansionLazyLoader(
      {
        [packA]: () => {
          callsA++;
          return new Promise<readonly ProceduralAssetDef[]>(resolve => {
            releaseA = resolve;
          });
        },
        [packB]: () => {
          attemptsB++;
          if (attemptsB === 1) return Promise.reject(new Error('transient chunk error'));
          return Promise.resolve([defB1]);
        },
      },
      id => packMap[id],
    );

    const first = loader.ensureTemplateLoaded(defA1.id);
    const second = loader.ensureTemplateLoaded(defA2.id);
    expect(callsA).toBe(1);
    releaseA?.([defA1, defA2]);
    await Promise.all([first, second]);

    expect(isExpansionPackLoaded(packA)).toBe(true);
    expect(getExpansionAsset(defA1.id)).toBe(defA1);
    expect(getExpansionAsset(defA2.id)).toBe(defA2);

    // Subsequent calls hit the loaded registry without invoking the loader again.
    await loader.ensureTemplateLoaded(defA1.id);
    expect(callsA).toBe(1);

    // Non-expansion templates resolve immediately as a no-op.
    await loader.ensureTemplateLoaded('relay-drone');

    // Failed loads clear the in-flight map so a retry succeeds cleanly.
    await expect(loader.ensureTemplateLoaded(defB1.id)).rejects.toThrow('transient chunk error');
    expect(isExpansionPackLoaded(packB)).toBe(false);
    await loader.ensureTemplateLoaded(defB1.id);
    expect(attemptsB).toBe(2);
    expect(isExpansionPackLoaded(packB)).toBe(true);
    expect(getExpansionAsset(defB1.id)).toBe(defB1);

    // preloadAll resolves cleanly when packs are already loaded.
    await loader.preloadAll();
    expect(callsA).toBe(1);
    expect(attemptsB).toBe(2);
  });

  it('handles default lazy helpers cleanly on core templates and empty Phase 1 loader map', async () => {
    await expect(ensureExpansionPackLoaded('relay-drone')).resolves.toBeUndefined();
    await expect(ensureStudioTemplateLoaded('relay-drone')).resolves.toBeUndefined();
    await expect(preloadAllExpansionPacks()).resolves.toBeUndefined();
  });
});

describe('studio-build parity with synchronous buildModel', () => {
  it('produces identical geometry and capability fingerprints for core starters and collection variants', () => {
    const samples: Recipe[] = [
      ...catalog.slice(0, 6).map(entry => entry.recipe),
      resolveVariationRecipe('bakery-shopfront', 'winter-frost'),
      resolveVariationRecipe('market-pavilion', 'harbor-timber-kit'),
    ];
    for (const recipe of samples) {
      expect(needsExpansionLoad(recipe.template)).toBe(false);
      for (const quality of ['standard', 'hd'] as const) {
        const dated = { ...recipe, quality };
        const fromStudio = buildStudioModel(dated);
        const fromSync = buildModel(dated);
        expect(fingerprintGroup(fromStudio)).toBe(fingerprintGroup(fromSync));
      }
    }
  });

  it('builds registered expansion assets and attaches capabilities via buildStudioModel', () => {
    const packId = '__test-studio-pack__';
    const def = makeMockAsset('__test-studio-crate__');
    mockPacksToClean.add(packId);
    registerExpansionPack(packId, [def]);

    const recipe: Recipe = {
      version: 1,
      template: def.id,
      name: def.name,
      primary: def.primary,
      accent: def.accent,
      scale: 1,
      proportion: 1,
      detail: true,
      quality: 'standard',
    };
    const model = buildStudioModel(recipe);
    const caps = inspectAsset(model);
    expect(caps.source?.id).toBe(def.id);
    expect(caps.riggedParts.map(part => part.name)).toEqual(['Lid']);
    expect(caps.physics?.body).toBe('dynamic');
    expect(model.animations).toHaveLength(1);
  });
});
