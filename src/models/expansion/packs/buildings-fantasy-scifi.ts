import type { ProceduralAssetDef } from '../../collection-types';
import { buildingsFantasyScifiMeta } from '../meta/buildings-fantasy-scifi';
import { buildingsFantasyScifiA } from './buildings-fantasy-scifi-a';
import { buildingsFantasyScifiB } from './buildings-fantasy-scifi-b';
import { buildingsFantasyScifiC } from './buildings-fantasy-scifi-c';
import { buildingsFantasyScifiD } from './buildings-fantasy-scifi-d';
import { mergePack } from './buildings-fantasy-scifi-kit';

export const buildingsFantasyScifiPack: readonly ProceduralAssetDef[] = mergePack(
  buildingsFantasyScifiMeta,
  [
    ...buildingsFantasyScifiA,
    ...buildingsFantasyScifiB,
    ...buildingsFantasyScifiC,
    ...buildingsFantasyScifiD,
  ],
);
