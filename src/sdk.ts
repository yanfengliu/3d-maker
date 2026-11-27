import { addCharacterAnimations } from './animation/library';
import { parseRecipe } from './data/recipe';
import { buildModel } from './models';
export { catalog, listVariations, parseRecipe, resolveVariationRecipe } from './data/recipe';
export type { CatalogEntry, ModelVariationEntry, Recipe, TemplateId, VariationSummary } from './data/recipe';
export { createAssetController, inspectAsset, synthesizeRigClips } from './capabilities/runtime';
export type { AssetController } from './capabilities/runtime';
export type {
  AssetCapabilities,
  AssetDimensionsSpec,
  AssetIkSpec,
  AssetPhysicsSpec,
  AssetRuntimeState,
  ColorZoneSpec,
  ColorwayPresetSpec,
  DecalSlotSpec,
  DetachablePartSpec,
  NightZoneSpec,
  RiggedPartSpec,
} from './capabilities/schema';
/** Build an independent animated Group from validated JSON for a three.js scene. */
export function createAsset(recipe: unknown) {
  return addCharacterAnimations(buildModel(parseRecipe(recipe)));
}
