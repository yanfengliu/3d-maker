import { addCharacterAnimations } from './animation/library';
import { parseRecipe } from './data/recipe';
import { buildModel } from './models';
export { catalog, getModelParamSpecs, listVariations, parseRecipe, resolveVariationRecipe } from './data/recipe';
export type { CatalogEntry, ModelVariationEntry, Recipe, TemplateId, VariationSummary } from './data/recipe';
export { createAssetController, inspectAsset, synthesizeRigClips } from './capabilities/runtime';
export type { AssetController } from './capabilities/runtime';
export { obbContainedIn, obbOverlap, resolveAssetVolumes, validateScenePlacement } from './capabilities/obb';
export type {
  OrientedBox,
  PlacementOverlap,
  PlacementValidationOptions,
  PlacementValidationResult,
  ResolveVolumeOptions,
  ScenePlacementItem,
  Vec3Tuple,
} from './capabilities/obb';
export { checkRiggedSweep } from './capabilities/sweep';
export type { RiggedSweepIssue, RiggedSweepOptions, RiggedSweepReport } from './capabilities/sweep';
export { deriveSpatialMetadata } from './capabilities/spatial-derive';
export type { DerivedSpatialMetadata } from './capabilities/spatial-derive';
export { deriveIkMetadata } from './capabilities/ik-derive';
export { resolveModelParams } from './capabilities/param-schema';
export { applyVertexColorTone, mergeStaticParts } from './models/merge-static';
export type { MergeStaticOptions, MergeStaticReport } from './models/merge-static';
export type {
  AssetCapabilities,
  AssetDimensionsSpec,
  AssetIkSpec,
  AssetPhysicsSpec,
  AssetRuntimeState,
  ChoiceParamOption,
  ChoiceParamSpec,
  ClearanceZoneKind,
  ClearanceZoneSpec,
  ColliderLayer,
  ColliderShape,
  ColliderSpec,
  ColorZoneSpec,
  ColorwayPresetSpec,
  DecalSlotSpec,
  DetachablePartSpec,
  IkArmSegmentSpec,
  IkArmSpec,
  IkLegsSpec,
  IkLimbSpec,
  ModelParamSpec,
  ModelParamValue,
  ModelParamValues,
  NightZoneSpec,
  RangeParamSpec,
  RiggedPartSpec,
  SpatialRestPose,
  SurfaceSpec,
  ToggleParamSpec,
} from './capabilities/schema';
/** Build an independent animated Group from validated JSON for a three.js scene. */
export function createAsset(recipe: unknown) {
  return addCharacterAnimations(buildModel(parseRecipe(recipe)));
}
