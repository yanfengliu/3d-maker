import { addCharacterAnimations } from './animation/library';
import { composeAsset as composeAssetRaw, type ComposeAssetOptions } from './capabilities/compose';
import { parseRecipe } from './data/recipe';
import { buildModel } from './models';
export { catalog, getModelParamSpecs, listVariations, parseRecipe, resolveVariationRecipe } from './data/recipe';
export type { CatalogEntry, ModelVariationEntry, Recipe, TemplateId, VariationSummary } from './data/recipe';
export { createAssetController, inspectAsset, synthesizeRigClips } from './capabilities/runtime';
export type { AssetController } from './capabilities/runtime';
export { computeCompositeBodies, validateComposite } from './capabilities/compose';
export type {
  ComposeAssetOptions,
  CompositePartInput,
  CompositeRigidBodySpec,
  CompositeSurfaceIssue,
  CompositeValidationResult,
} from './capabilities/compose';
export { createCompositeController } from './capabilities/compose-runtime';
export type { CompositeAssetController, PlayChildClipSpec } from './capabilities/compose-runtime';
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
  CompositeChildSpec,
  CompositeJointSpec,
  CompositeJointType,
  CompositeMountSpec,
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
  PhysicsCoupling,
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
/** Compose multiple assets or recipes into a scoped hierarchical Group with preserved knobs, animations, and physics coupling. */
export function composeAsset(options: ComposeAssetOptions) {
  return composeAssetRaw({
    ...options,
    buildRecipe: options.buildRecipe ?? (recipe => createAsset(recipe)),
  });
}
