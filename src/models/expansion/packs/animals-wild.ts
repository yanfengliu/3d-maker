import type { ProceduralAssetDef } from '../../collection-types';
import { animalsWildMeta } from '../meta/animals-wild';
import { animalsWildA } from './animals-wild-a';
import { animalsWildB } from './animals-wild-b';
import { animalsWildC } from './animals-wild-c';
import { buildWildPack } from './animals-wild-kit';

export const animalsWildPack: readonly ProceduralAssetDef[] = buildWildPack(
  animalsWildMeta,
  [...animalsWildA, ...animalsWildB, ...animalsWildC],
);
