import type { ProceduralAssetDef } from '../../collection-types';
import { terrainBiomesMeta } from '../meta/terrain-biomes';
import type { BiomeBuilderDef } from './terrain-biomes-kit';
import { terrainBiomesBuildersA } from './terrain-biomes-a';
import { terrainBiomesBuildersB } from './terrain-biomes-b';
import { terrainBiomesBuildersC } from './terrain-biomes-c';
import { terrainBiomesBuildersD } from './terrain-biomes-d';

const buildersById = new Map<string, BiomeBuilderDef>(
  [
    ...terrainBiomesBuildersA,
    ...terrainBiomesBuildersB,
    ...terrainBiomesBuildersC,
    ...terrainBiomesBuildersD,
  ].map(def => [def.id, def]),
);

export const terrainBiomesPack: readonly ProceduralAssetDef[] = terrainBiomesMeta.map(meta => {
  const builder = buildersById.get(meta.id);
  if (!builder) {
    throw new Error(`Missing terrain-biomes builder for ${meta.id}`);
  }
  return {
    ...meta,
    physicsBody: 'static',
    riggedParts: builder.riggedParts,
    detachableParts: builder.detachableParts,
    build: builder.build,
  };
});
