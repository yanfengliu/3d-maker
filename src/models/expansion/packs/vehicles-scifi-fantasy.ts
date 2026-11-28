import type { ProceduralAssetDef } from '../../collection-types';
import { vehiclesScifiFantasyMeta } from '../meta/vehicles-scifi-fantasy';
import { vehiclesScifiA } from './vehicles-scifi-fantasy-a';
import { vehiclesScifiB } from './vehicles-scifi-fantasy-b';
import { vehiclesScifiC } from './vehicles-scifi-fantasy-c';
import { buildSciFiPack } from './vehicles-scifi-fantasy-kit';

export const vehiclesScifiFantasyPack: readonly ProceduralAssetDef[] = buildSciFiPack(
  vehiclesScifiFantasyMeta,
  [...vehiclesScifiA, ...vehiclesScifiB, ...vehiclesScifiC],
);
