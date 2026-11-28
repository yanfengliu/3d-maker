import * as T from 'three';
import { resolveModelParams } from '../capabilities/param-schema';
import { getModelParamSpecs, type Recipe } from '../data/recipe';
import { attachOriginalCapabilities } from './capabilities';
import { character } from './character';
import { extraAssets } from './collections';
import { drone } from './drone';
import { cargo, rover, tower } from './equipment';
import { ensureExpansionPackLoaded } from './expansion/lazy';
import { expansionPackOf } from './expansion/meta';
import { getExpansionAsset, isExpansionPackLoaded } from './expansion/registry';
import { finishes } from './parts';
import { findVariation } from './variations';

const extraBuilders = new Map(extraAssets.map(asset => [asset.id, asset.build]));

/** Report whether `templateId` belongs to an expansion pack that has not yet been loaded in the studio. */
export function needsExpansionLoad(templateId: string): boolean {
  const packId = expansionPackOf(templateId);
  return packId !== undefined && !isExpansionPackLoaded(packId);
}

/** Dynamically load the expansion pack for `templateId` if needed (no-op for core/existing or loaded packs). */
export async function ensureStudioTemplateLoaded(templateId: string): Promise<void> {
  if (!needsExpansionLoad(templateId)) return;
  await ensureExpansionPackLoaded(templateId);
}

/**
 * Browser-studio synchronous model builder for the 6 core starters, existing 100 collection
 * assets, and any already-loaded expansion pack assets. Never statically imports expansion packs.
 */
export function buildStudioModel(recipe: Recipe): T.Group {
  const root = new T.Group();
  root.name = 'Asset';
  const palette = finishes(recipe);
  const variation = findVariation(recipe.template, recipe.variation);
  const paramSpecs = getModelParamSpecs(recipe.template, recipe.variation);
  const resolvedParams = paramSpecs ? resolveModelParams(paramSpecs, recipe.params) : undefined;
  if (!variation?.replaceBase) {
    switch (recipe.template) {
      case 'relay-drone': drone(root, palette, recipe.detail); break;
      case 'field-rover': rover(root, palette, recipe.detail); break;
      case 'cargo-pod': cargo(root, palette, recipe.detail); break;
      case 'signal-tower': tower(root, palette, recipe.detail); break;
      case 'survey-bot': character(root, palette, false, recipe.detail); break;
      case 'field-pilot': character(root, palette, true, recipe.detail); break;
      default: {
        const build = extraBuilders.get(recipe.template) ?? getExpansionAsset(recipe.template)?.build;
        if (!build) {
          if (needsExpansionLoad(recipe.template)) {
            throw new Error('Expansion pack not loaded for template: ' + recipe.template);
          }
          throw new Error('Unknown template: ' + recipe.template);
        }
        build(root, palette, recipe.detail, resolvedParams);
        break;
      }
    }
  }
  variation?.modify?.(root, palette, recipe.detail, resolvedParams);
  root.userData.recipe = { ...recipe, ...(recipe.params ? { params: { ...recipe.params } } : {}) };
  root.scale.set(recipe.scale * recipe.proportion, recipe.scale, recipe.scale);
  attachOriginalCapabilities(root, recipe);
  return root;
}
