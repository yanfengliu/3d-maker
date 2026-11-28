import {
  parseRecipeParams,
  type ModelParamSpec,
  type ModelParamValues,
} from '../capabilities/param-schema.ts';
import { extraAssets } from '../models/collections/index.ts';
import { expansionMeta } from '../models/expansion/meta.ts';
import {
  DEFAULT_VARIATION_ID,
  findVariation,
  variationKey,
  variationsForTemplate,
  type VariationSummary,
} from '../models/variations.ts';

export type TemplateId = string;
export type { VariationSummary };

export interface Recipe {
  version: 1;
  template: TemplateId;
  variation?: string;
  name: string;
  primary: string;
  accent: string;
  scale: number;
  proportion: number;
  detail: boolean;
  quality?: 'standard' | 'hd';
  params?: ModelParamValues;
}

export interface CatalogEntry {
  id: TemplateId;
  code: string;
  category: 'Object' | 'Character';
  recipe: Recipe;
  description: string;
  variations: readonly VariationSummary[];
}

export interface ModelVariationEntry extends VariationSummary {
  key: string;
  template: TemplateId;
  category: CatalogEntry['category'];
  recipe: Recipe;
}

function starter(id: TemplateId, code: string, category: CatalogEntry['category'], name: string, primary: string, accent: string, description: string): CatalogEntry {
  const named = variationsForTemplate(id).map(v => ({ id: v.id, label: v.label, situation: v.situation }));
  return {
    id, code, category, description,
    recipe: { version: 1, template: id, name, primary, accent, scale: 1, proportion: 1, detail: true, quality: 'hd' },
    variations: [{ id: DEFAULT_VARIATION_ID, label: 'Default', situation: description }, ...named],
  };
}

const starterCatalog: readonly CatalogEntry[] = [
  starter('relay-drone', 'RD-01', 'Object', 'Relay Drone', '#efb634', '#e8e4cf', 'A field quadcopter built around a compact sensor pod.'),
  starter('field-rover', 'FR-02', 'Object', 'Field Rover', '#d67c43', '#e9ddc6', 'An all-terrain rover for ground surveys.'),
  starter('survey-bot', 'SB-03', 'Character', 'Survey Bot', '#a6bfc2', '#e9d58b', 'An articulated field robot built for inspection work.'),
  starter('cargo-pod', 'CP-04', 'Object', 'Cargo Pod', '#91a68c', '#e7d9b7', 'A reinforced equipment pod for field transport.'),
  starter('signal-tower', 'ST-05', 'Object', 'Signal Tower', '#ddc5a0', '#d86b4d', 'A remote communications station with a directional antenna.'),
  starter('field-pilot', 'FP-06', 'Character', 'Field Pilot', '#cf8361', '#e7d7bb', 'A suited pilot equipped for field operations.'),
];

export const catalog: readonly CatalogEntry[] = [
  ...starterCatalog,
  ...extraAssets.map(asset =>
    starter(asset.id, asset.code, asset.category, asset.name, asset.primary, asset.accent, asset.description),
  ),
  ...expansionMeta.map(asset =>
    starter(asset.id, asset.code, asset.category, asset.name, asset.primary, asset.accent, asset.description),
  ),
];

const templateIds = new Set<string>(catalog.map(entry => entry.id));

function isTemplate(value: unknown): value is TemplateId {
  return typeof value === 'string' && templateIds.has(value);
}

function color(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) {
    throw new Error(`${field} must be a six-digit hex color such as #e8aa36.`);
  }
  return value.toLowerCase();
}

function dimension(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.65 || value > 1.5) {
    throw new Error(`${field} must be a number from 0.65 to 1.5.`);
  }
  return value;
}

const extraParamsById = new Map<string, readonly ModelParamSpec[] | undefined>([
  ...extraAssets.map(asset => [asset.id, asset.params] as const),
  ...expansionMeta.map(asset => [asset.id, asset.params] as const),
]);

/** Return declared model-specific structural parameter specs for a template/variation pair. */
export function getModelParamSpecs(template: TemplateId, variation?: string): readonly ModelParamSpec[] | undefined {
  const varDef = findVariation(template, variation);
  return varDef?.paramSpecs ?? extraParamsById.get(template);
}

/** Validate inputs at the point of import. Recipes carry data only. */
export function parseRecipe(input: unknown): Recipe {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('A recipe must be a JSON object.');
  const value = input as Record<string, unknown>;
  const allowed = ['version', 'template', 'variation', 'name', 'primary', 'accent', 'scale', 'proportion', 'detail', 'quality', 'params'];
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error('The recipe contains an unknown field.');
  if (value.version !== 1) throw new Error('The recipe must use version 1.');
  if (!isTemplate(value.template)) throw new Error('Choose a template from the studio catalog.');
  let variation: string | undefined;
  if (value.variation !== undefined) {
    if (typeof value.variation !== 'string' || !value.variation.trim()) {
      throw new Error('variation must be a registered variation id.');
    }
    const clean = value.variation.trim();
    if (clean !== DEFAULT_VARIATION_ID) {
      if (!findVariation(value.template, clean)) {
        throw new Error(`Unknown variation "${clean}" for template "${value.template}".`);
      }
      variation = clean;
    }
  }
  if (typeof value.name !== 'string' || !value.name.trim() || Array.from(value.name).length > 80) {
    throw new Error('Give the recipe a name between 1 and 80 characters.');
  }
  if (typeof value.detail !== 'boolean') throw new Error('detail must be true or false.');
  if (value.quality !== undefined && value.quality !== 'standard' && value.quality !== 'hd') {
    throw new Error('quality must be standard or hd.');
  }
  const paramSpecs = getModelParamSpecs(value.template, variation);
  const params = parseRecipeParams(value.params, paramSpecs);
  return {
    version: 1, template: value.template, ...(variation ? { variation } : {}), name: value.name.trim(), detail: value.detail,
    ...(value.quality === undefined ? {} : { quality: value.quality }),
    ...(params ? { params } : {}),
    primary: color(value.primary, 'primary'), accent: color(value.accent, 'accent'),
    scale: dimension(value.scale, 'scale'), proportion: dimension(value.proportion, 'proportion'),
  };
}

/** Resolve the full recipe for a given template and variation id (defaults to the base model). */
export function resolveVariationRecipe(template: TemplateId, variation?: string): Recipe {
  const entry = catalog.find(row => row.id === template);
  if (!entry) throw new Error('Choose a template from the studio catalog.');
  if (!variation || variation === DEFAULT_VARIATION_ID) return { ...entry.recipe };
  const def = findVariation(template, variation);
  if (!def) throw new Error(`Unknown variation "${variation}" for template "${template}".`);
  return parseRecipe({
    ...entry.recipe,
    ...(def.recipe ?? {}),
    template,
    variation: def.id,
  });
}

/** Enumerate all stored variations (including 'default') across the whole dataset or for one template. */
export function listVariations(template?: TemplateId): ModelVariationEntry[] {
  const entries = template ? catalog.filter(row => row.id === template) : catalog;
  const rows: ModelVariationEntry[] = [];
  for (const entry of entries) {
    rows.push({
      key: variationKey(entry.id, DEFAULT_VARIATION_ID),
      template: entry.id,
      id: DEFAULT_VARIATION_ID,
      label: 'Default',
      situation: entry.description,
      category: entry.category,
      recipe: { ...entry.recipe },
    });
    for (const def of variationsForTemplate(entry.id)) {
      rows.push({
        key: variationKey(entry.id, def.id),
        template: entry.id,
        id: def.id,
        label: def.label,
        situation: def.situation,
        category: entry.category,
        recipe: resolveVariationRecipe(entry.id, def.id),
      });
    }
  }
  return rows;
}
