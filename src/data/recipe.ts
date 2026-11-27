const templates = ['relay-drone', 'field-rover', 'survey-bot', 'cargo-pod', 'signal-tower', 'field-pilot'] as const;

export type TemplateId = typeof templates[number];

export interface Recipe {
  version: 1;
  template: TemplateId;
  name: string;
  primary: string;
  accent: string;
  scale: number;
  proportion: number;
  detail: boolean;
  quality?: 'standard' | 'hd';
}

export interface CatalogEntry {
  id: TemplateId;
  code: string;
  category: 'Object' | 'Character';
  recipe: Recipe;
  description: string;
}

function starter(id: TemplateId, code: string, category: CatalogEntry['category'], name: string, primary: string, accent: string, description: string): CatalogEntry {
  return {
    id, code, category, description,
    recipe: { version: 1, template: id, name, primary, accent, scale: 1, proportion: 1, detail: true, quality: 'hd' },
  };
}

export const catalog: readonly CatalogEntry[] = [
  starter('relay-drone', 'RD-01', 'Object', 'Relay Drone', '#efb634', '#e8e4cf', 'A field quadcopter built around a compact sensor pod.'),
  starter('field-rover', 'FR-02', 'Object', 'Field Rover', '#d67c43', '#e9ddc6', 'An all-terrain rover for ground surveys.'),
  starter('survey-bot', 'SB-03', 'Character', 'Survey Bot', '#a6bfc2', '#e9d58b', 'An articulated field robot built for inspection work.'),
  starter('cargo-pod', 'CP-04', 'Object', 'Cargo Pod', '#91a68c', '#e7d9b7', 'A reinforced equipment pod for field transport.'),
  starter('signal-tower', 'ST-05', 'Object', 'Signal Tower', '#ddc5a0', '#d86b4d', 'A remote communications station with a directional antenna.'),
  starter('field-pilot', 'FP-06', 'Character', 'Field Pilot', '#cf8361', '#e7d7bb', 'A suited pilot equipped for field operations.'),
];

function isTemplate(value: unknown): value is TemplateId {
  return templates.some(id => id === value);
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

/** Validate inputs at the point of import. Recipes carry data only. */
export function parseRecipe(input: unknown): Recipe {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('A recipe must be a JSON object.');
  const value = input as Record<string, unknown>;
  const allowed = ['version', 'template', 'name', 'primary', 'accent', 'scale', 'proportion', 'detail', 'quality'];
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error('The recipe contains an unknown field.');
  if (value.version !== 1) throw new Error('The recipe must use version 1.');
  if (!isTemplate(value.template)) throw new Error('Choose a template from the studio catalog.');
  if (typeof value.name !== 'string' || !value.name.trim() || Array.from(value.name).length > 80) {
    throw new Error('Give the recipe a name between 1 and 80 characters.');
  }
  if (typeof value.detail !== 'boolean') throw new Error('detail must be true or false.');
  if (value.quality !== undefined && value.quality !== 'standard' && value.quality !== 'hd') {
    throw new Error('quality must be standard or hd.');
  }
  return {
    version: 1, template: value.template, name: value.name.trim(), detail: value.detail,
    ...(value.quality === undefined ? {} : { quality: value.quality }),
    primary: color(value.primary, 'primary'), accent: color(value.accent, 'accent'),
    scale: dimension(value.scale, 'scale'), proportion: dimension(value.proportion, 'proportion'),
  };
}
