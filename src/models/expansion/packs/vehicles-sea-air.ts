import type { ProceduralAssetDef } from '../../collection-types';
import { vehiclesSeaAirMeta } from '../meta/vehicles-sea-air';
import { vehiclesSeaAirA } from './vehicles-sea-air-a';
import { vehiclesSeaAirB } from './vehicles-sea-air-b';
import { vehiclesSeaAirC } from './vehicles-sea-air-c';
import { buildSeaAirPack } from './vehicles-sea-air-kit';

export const vehiclesSeaAirPack: readonly ProceduralAssetDef[] = buildSeaAirPack(
  vehiclesSeaAirMeta,
  [...vehiclesSeaAirA, ...vehiclesSeaAirB, ...vehiclesSeaAirC],
);
