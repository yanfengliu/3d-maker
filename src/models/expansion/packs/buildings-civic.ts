import type { ProceduralAssetDef } from '../../collection-types';
import { buildingsCivicMeta } from '../meta/buildings-civic';
import { buildingsCivicA } from './buildings-civic-a';
import { buildingsCivicB } from './buildings-civic-b';
import { buildingsCivicC } from './buildings-civic-c';
import { buildingsCivicD } from './buildings-civic-d';
import type { CivicBuildDef } from './buildings-civic-kit';

const allDefs: readonly CivicBuildDef[] = [
  ...buildingsCivicA,
  ...buildingsCivicB,
  ...buildingsCivicC,
  ...buildingsCivicD,
];

const byId = new Map<string, CivicBuildDef>(allDefs.map(def => [def.id, def]));

export const buildingsCivicPack: readonly ProceduralAssetDef[] = buildingsCivicMeta.map(meta => {
  const def = byId.get(meta.id);
  if (!def) throw new Error(`Missing buildings-civic builder for ${meta.id}`);
  return {
    ...meta,
    physicsBody: 'static' as const,
    riggedParts: def.riggedParts,
    detachableParts: def.detachableParts,
    build: def.build,
  };
});
