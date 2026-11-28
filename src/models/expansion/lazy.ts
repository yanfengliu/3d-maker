import type { ProceduralAssetDef } from '../collection-types';
import { COLLECTIONS_PACK_ID, extraMetaById } from '../collections/meta';
import { expansionPackOf } from './meta';
import { isExpansionPackLoaded, registerExpansionPack } from './registry';
import type { ExpansionPackId } from './types';

export type ExpansionPackLoader = () => Promise<readonly ProceduralAssetDef[]>;

/** Dynamic pack loaders so the browser studio code-splits base collections and all 25 expansion packs on demand. */
const packLoaders: Readonly<Record<ExpansionPackId | typeof COLLECTIONS_PACK_ID, ExpansionPackLoader>> = {
  [COLLECTIONS_PACK_ID]: () => import('../collections').then(m => m.extraAssets),
  'home-furniture': () => import('./packs/home-furniture').then(m => m.homeFurniturePack),
  'kitchen-appliances': () => import('./packs/kitchen-appliances').then(m => m.kitchenAppliancesPack),
  'workshop-machinery': () => import('./packs/workshop-machinery').then(m => m.workshopMachineryPack),
  'science-medical': () => import('./packs/science-medical').then(m => m.scienceMedicalPack),
  'culinary-market': () => import('./packs/culinary-market').then(m => m.culinaryMarketPack),
  'music-stage': () => import('./packs/music-stage').then(m => m.musicStagePack),
  'sports-play': () => import('./packs/sports-play').then(m => m.sportsPlayPack),
  'street-civic': () => import('./packs/street-civic').then(m => m.streetCivicPack),
  'fantasy-arcane': () => import('./packs/fantasy-arcane').then(m => m.fantasyArcanePack),
  'scifi-stations': () => import('./packs/scifi-stations').then(m => m.scifiStationsPack),
  'buildings-world': () => import('./packs/buildings-world').then(m => m.buildingsWorldPack),
  'buildings-civic': () => import('./packs/buildings-civic').then(m => m.buildingsCivicPack),
  'buildings-fantasy-scifi': () => import('./packs/buildings-fantasy-scifi').then(m => m.buildingsFantasyScifiPack),
  'terrain-biomes': () => import('./packs/terrain-biomes').then(m => m.terrainBiomesPack),
  'terrain-structures': () => import('./packs/terrain-structures').then(m => m.terrainStructuresPack),
  'vehicles-road': () => import('./packs/vehicles-road').then(m => m.vehiclesRoadPack),
  'vehicles-sea-air': () => import('./packs/vehicles-sea-air').then(m => m.vehiclesSeaAirPack),
  'vehicles-scifi-fantasy': () => import('./packs/vehicles-scifi-fantasy').then(m => m.vehiclesScifiFantasyPack),
  'animals-wild': () => import('./packs/animals-wild').then(m => m.animalsWildPack),
  'animals-ocean-myth': () => import('./packs/animals-ocean-myth').then(m => m.animalsOceanMythPack),
  'characters-civilian': () => import('./packs/characters-civilian').then(m => m.charactersCivilianPack),
  'characters-adventure': () => import('./packs/characters-adventure').then(m => m.charactersAdventurePack),
  'handheld-tools': () => import('./packs/handheld-tools').then(m => m.handheldToolsPack),
  'handheld-fantasy-scifi': () => import('./packs/handheld-fantasy-scifi').then(m => m.handheldFantasyScifiPack),
  'attachments-wearables': () => import('./packs/attachments-wearables').then(m => m.attachmentsWearablesPack),
};

export interface ExpansionLazyLoader {
  ensurePackLoaded: (packId: string) => Promise<void>;
  ensureTemplateLoaded: (templateId: string) => Promise<void>;
  preloadAll: () => Promise<void>;
}

/** Create a lazy pack loader with in-flight promise deduplication and retry-safe failure cleanup. */
export function createExpansionLazyLoader(
  loaders: Readonly<Partial<Record<string, ExpansionPackLoader>>>,
  resolvePack: (templateId: string) => string | undefined,
): ExpansionLazyLoader {
  const inFlight = new Map<string, Promise<void>>();

  async function ensurePackLoaded(packId: string): Promise<void> {
    if (isExpansionPackLoaded(packId)) return;
    const existing = inFlight.get(packId);
    if (existing) return existing;
    const load = loaders[packId];
    if (!load) {
      throw new Error(`No lazy loader registered for expansion pack "${packId}".`);
    }
    const pending = load()
      .then(defs => {
        registerExpansionPack(packId, defs);
      })
      .finally(() => {
        if (inFlight.get(packId) === pending) inFlight.delete(packId);
      });
    inFlight.set(packId, pending);
    return pending;
  }

  async function ensureTemplateLoaded(templateId: string): Promise<void> {
    const packId = resolvePack(templateId);
    if (!packId) return;
    await ensurePackLoaded(packId);
  }

  async function preloadAll(): Promise<void> {
    const ids = Object.keys(loaders).filter(packId => loaders[packId] !== undefined);
    await Promise.all(ids.map(packId => ensurePackLoaded(packId)));
  }

  return { ensurePackLoaded, ensureTemplateLoaded, preloadAll };
}

const defaultLoader = createExpansionLazyLoader(
  packLoaders,
  id => (extraMetaById.has(id) ? COLLECTIONS_PACK_ID : expansionPackOf(id)),
);

/** Ensure the expansion pack owning `templateId` is dynamically loaded and registered (no-op for core templates). */
export function ensureExpansionPackLoaded(templateId: string): Promise<void> {
  return defaultLoader.ensureTemplateLoaded(templateId);
}

/** Preload all expansion packs in parallel (used for full thumbnail/poster generation). */
export function preloadAllExpansionPacks(): Promise<void> {
  return defaultLoader.preloadAll();
}
