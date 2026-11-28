import type { ModelParamSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';

export interface ExpansionMetaItem {
  readonly id: string;
  readonly code: string;
  readonly category: 'Object' | 'Character';
  readonly browseCategory: BrowseCategory;
  readonly name: string;
  readonly primary: string;
  readonly accent: string;
  readonly description: string;
  readonly pack: string;
  readonly kit?: string;
  readonly params?: readonly ModelParamSpec[];
}

export const EXPANSION_PACK_IDS = [
  'home-furniture',
  'kitchen-appliances',
  'workshop-machinery',
  'science-medical',
  'culinary-market',
  'music-stage',
  'sports-play',
  'street-civic',
  'fantasy-arcane',
  'scifi-stations',
  'buildings-world',
  'buildings-civic',
  'buildings-fantasy-scifi',
  'terrain-biomes',
  'terrain-structures',
  'vehicles-road',
  'vehicles-sea-air',
  'vehicles-scifi-fantasy',
  'animals-wild',
  'animals-ocean-myth',
  'characters-civilian',
  'characters-adventure',
  'handheld-tools',
  'handheld-fantasy-scifi',
  'attachments-wearables',
] as const;

export type ExpansionPackId = (typeof EXPANSION_PACK_IDS)[number];

export function isExpansionPackId(value: string): value is ExpansionPackId {
  return (EXPANSION_PACK_IDS as readonly string[]).includes(value);
}
