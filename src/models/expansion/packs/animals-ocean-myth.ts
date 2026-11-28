import type { ProceduralAssetDef } from '../../collection-types';
import { animalsOceanMythMeta } from '../meta/animals-ocean-myth';
import { animalsOceanMythA } from './animals-ocean-myth-a';
import { animalsOceanMythB } from './animals-ocean-myth-b';
import { animalsOceanMythC } from './animals-ocean-myth-c';
import { buildOceanMythPack } from './animals-ocean-myth-kit';

export const animalsOceanMythPack: readonly ProceduralAssetDef[] = buildOceanMythPack(
  animalsOceanMythMeta,
  [...animalsOceanMythA, ...animalsOceanMythB, ...animalsOceanMythC],
);
