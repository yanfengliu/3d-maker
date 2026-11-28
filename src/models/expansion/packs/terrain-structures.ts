import type { ProceduralAssetDef } from '../../collection-types'
import { terrainStructuresMeta } from '../meta/terrain-structures'
import { terrainStructuresA } from './terrain-structures-a'
import { terrainStructuresB } from './terrain-structures-b'
import { terrainStructuresC } from './terrain-structures-c'
import { terrainStructuresD } from './terrain-structures-d'
import type { TerrainStructureSpec } from './terrain-structures-kit'

const specMap = new Map<string, TerrainStructureSpec>(
  [
    ...terrainStructuresA,
    ...terrainStructuresB,
    ...terrainStructuresC,
    ...terrainStructuresD,
  ].map(spec => [spec.id, spec] as const),
)

export const terrainStructuresPack: readonly ProceduralAssetDef[] = terrainStructuresMeta.map(meta => {
  const spec = specMap.get(meta.id)
  if (!spec) throw new Error(`Missing terrain-structures builder: ${meta.id}`)
  return {
    ...meta,
    physicsBody: 'static' as const,
    riggedParts: spec.riggedParts,
    detachableParts: spec.detachableParts,
    build: spec.build,
  }
})
