import { animalsOceanMythMeta } from './meta/animals-ocean-myth.ts';
import { animalsWildMeta } from './meta/animals-wild.ts';
import { attachmentsWearablesMeta } from './meta/attachments-wearables.ts';
import { buildingsCivicMeta } from './meta/buildings-civic.ts';
import { buildingsFantasyScifiMeta } from './meta/buildings-fantasy-scifi.ts';
import { buildingsWorldMeta } from './meta/buildings-world.ts';
import { charactersAdventureMeta } from './meta/characters-adventure.ts';
import { charactersCivilianMeta } from './meta/characters-civilian.ts';
import { culinaryMarketMeta } from './meta/culinary-market.ts';
import { fantasyArcaneMeta } from './meta/fantasy-arcane.ts';
import { handheldFantasyScifiMeta } from './meta/handheld-fantasy-scifi.ts';
import { handheldToolsMeta } from './meta/handheld-tools.ts';
import { homeFurnitureMeta } from './meta/home-furniture.ts';
import { kitchenAppliancesMeta } from './meta/kitchen-appliances.ts';
import { musicStageMeta } from './meta/music-stage.ts';
import { scienceMedicalMeta } from './meta/science-medical.ts';
import { scifiStationsMeta } from './meta/scifi-stations.ts';
import { sportsPlayMeta } from './meta/sports-play.ts';
import { streetCivicMeta } from './meta/street-civic.ts';
import { terrainBiomesMeta } from './meta/terrain-biomes.ts';
import { terrainStructuresMeta } from './meta/terrain-structures.ts';
import { vehiclesRoadMeta } from './meta/vehicles-road.ts';
import { vehiclesScifiFantasyMeta } from './meta/vehicles-scifi-fantasy.ts';
import { vehiclesSeaAirMeta } from './meta/vehicles-sea-air.ts';
import { workshopMachineryMeta } from './meta/workshop-machinery.ts';
import type { ExpansionMetaItem } from './types.ts';

/** Lightweight startup metadata for all 500 expansion models (zero Three.js or builder imports). */
export const expansionMeta: readonly ExpansionMetaItem[] = [
  ...homeFurnitureMeta,
  ...kitchenAppliancesMeta,
  ...workshopMachineryMeta,
  ...scienceMedicalMeta,
  ...culinaryMarketMeta,
  ...musicStageMeta,
  ...sportsPlayMeta,
  ...streetCivicMeta,
  ...fantasyArcaneMeta,
  ...scifiStationsMeta,
  ...buildingsWorldMeta,
  ...buildingsCivicMeta,
  ...buildingsFantasyScifiMeta,
  ...terrainBiomesMeta,
  ...terrainStructuresMeta,
  ...vehiclesRoadMeta,
  ...vehiclesSeaAirMeta,
  ...vehiclesScifiFantasyMeta,
  ...animalsWildMeta,
  ...animalsOceanMythMeta,
  ...charactersCivilianMeta,
  ...charactersAdventureMeta,
  ...handheldToolsMeta,
  ...handheldFantasyScifiMeta,
  ...attachmentsWearablesMeta,
];

export const expansionMetaById: ReadonlyMap<string, ExpansionMetaItem> = new Map(
  expansionMeta.map(item => [item.id, item]),
);

/** Return the owning expansion pack id for `id`, or undefined for core/existing templates. */
export function expansionPackOf(id: string): string | undefined {
  return expansionMetaById.get(id)?.pack;
}
