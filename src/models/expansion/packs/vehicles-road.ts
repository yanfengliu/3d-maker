import type { ProceduralAssetDef } from '../../collection-types';
import { vehiclesRoadMeta } from '../meta/vehicles-road';
import { vehiclesRoadA } from './vehicles-road-a';
import { vehiclesRoadB } from './vehicles-road-b';
import { vehiclesRoadC } from './vehicles-road-c';
import { buildPack } from './vehicles-road-kit';

export const vehiclesRoadPack: readonly ProceduralAssetDef[] = buildPack(
  vehiclesRoadMeta,
  [...vehiclesRoadA, ...vehiclesRoadB, ...vehiclesRoadC],
);
