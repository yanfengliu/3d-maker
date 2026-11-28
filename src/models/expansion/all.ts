import type { ProceduralAssetDef } from '../collection-types';
import { animalsOceanMythPack } from './packs/animals-ocean-myth';
import { animalsWildPack } from './packs/animals-wild';
import { attachmentsWearablesPack } from './packs/attachments-wearables';
import { buildingsCivicPack } from './packs/buildings-civic';
import { buildingsFantasyScifiPack } from './packs/buildings-fantasy-scifi';
import { buildingsWorldPack } from './packs/buildings-world';
import { charactersAdventurePack } from './packs/characters-adventure';
import { charactersCivilianPack } from './packs/characters-civilian';
import { culinaryMarketPack } from './packs/culinary-market';
import { fantasyArcanePack } from './packs/fantasy-arcane';
import { handheldFantasyScifiPack } from './packs/handheld-fantasy-scifi';
import { handheldToolsPack } from './packs/handheld-tools';
import { homeFurniturePack } from './packs/home-furniture';
import { kitchenAppliancesPack } from './packs/kitchen-appliances';
import { musicStagePack } from './packs/music-stage';
import { scienceMedicalPack } from './packs/science-medical';
import { scifiStationsPack } from './packs/scifi-stations';
import { sportsPlayPack } from './packs/sports-play';
import { streetCivicPack } from './packs/street-civic';
import { terrainBiomesPack } from './packs/terrain-biomes';
import { terrainStructuresPack } from './packs/terrain-structures';
import { vehiclesRoadPack } from './packs/vehicles-road';
import { vehiclesScifiFantasyPack } from './packs/vehicles-scifi-fantasy';
import { vehiclesSeaAirPack } from './packs/vehicles-sea-air';
import { workshopMachineryPack } from './packs/workshop-machinery';
import { registerExpansionPack } from './registry';
import type { ExpansionPackId } from './types';

/**
 * Eagerly imported expansion packs for synchronous consumers
 * (`src/models/index.ts`, `src/sdk.ts`, Vitest, and `scripts/lock-variations.mjs`).
 * Never import this module from `src/studio/*` or `src/data/*`.
 */
const allExpansionPacks: readonly (readonly [ExpansionPackId, readonly ProceduralAssetDef[]])[] = [
  ['home-furniture', homeFurniturePack],
  ['kitchen-appliances', kitchenAppliancesPack],
  ['workshop-machinery', workshopMachineryPack],
  ['science-medical', scienceMedicalPack],
  ['culinary-market', culinaryMarketPack],
  ['music-stage', musicStagePack],
  ['sports-play', sportsPlayPack],
  ['street-civic', streetCivicPack],
  ['fantasy-arcane', fantasyArcanePack],
  ['scifi-stations', scifiStationsPack],
  ['buildings-world', buildingsWorldPack],
  ['buildings-civic', buildingsCivicPack],
  ['buildings-fantasy-scifi', buildingsFantasyScifiPack],
  ['terrain-biomes', terrainBiomesPack],
  ['terrain-structures', terrainStructuresPack],
  ['vehicles-road', vehiclesRoadPack],
  ['vehicles-sea-air', vehiclesSeaAirPack],
  ['vehicles-scifi-fantasy', vehiclesScifiFantasyPack],
  ['animals-wild', animalsWildPack],
  ['animals-ocean-myth', animalsOceanMythPack],
  ['characters-civilian', charactersCivilianPack],
  ['characters-adventure', charactersAdventurePack],
  ['handheld-tools', handheldToolsPack],
  ['handheld-fantasy-scifi', handheldFantasyScifiPack],
  ['attachments-wearables', attachmentsWearablesPack],
];

let registered = false;

/** Synchronously register all expansion packs in memory (idempotent). */
export function ensureAllExpansionPacks(): void {
  if (registered) return;
  for (const [packId, defs] of allExpansionPacks) {
    registerExpansionPack(packId, defs);
  }
  registered = true;
}
