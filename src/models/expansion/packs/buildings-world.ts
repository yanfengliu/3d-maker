import type { ProceduralAssetDef } from '../../collection-types';
import { buildingsWorldMeta } from '../meta/buildings-world';
import { buildingsWorldA } from './buildings-world-a';
import { buildingsWorldB } from './buildings-world-b';
import { buildingsWorldC } from './buildings-world-c';
import { buildingsWorldD } from './buildings-world-d';
import type { WorldBuilderSpec } from './buildings-world-kit';

const buildersById = new Map<string, WorldBuilderSpec>(
  [...buildingsWorldA, ...buildingsWorldB, ...buildingsWorldC, ...buildingsWorldD].map(spec => [spec.id, spec]),
);

export const buildingsWorldPack: readonly ProceduralAssetDef[] = buildingsWorldMeta.map(meta => {
  const spec = buildersById.get(meta.id);
  if (!spec) throw new Error(`Missing builder spec for ${meta.id}`);
  return {
    ...meta,
    physicsBody: 'static',
    riggedParts: spec.riggedParts,
    ...(spec.detachableParts ? { detachableParts: spec.detachableParts } : {}),
    build: spec.build,
  };
});
