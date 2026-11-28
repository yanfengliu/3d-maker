import type { ProceduralAssetDef } from '../collection-types';

const loadedPackIds = new Map<string, readonly string[]>();
const assetsById = new Map<string, ProceduralAssetDef>();

/** Register a loaded expansion pack's procedural asset definitions for synchronous lookup. */
export function registerExpansionPack(packId: string, defs: readonly ProceduralAssetDef[]): void {
  const prevIds = loadedPackIds.get(packId);
  if (prevIds) {
    for (const id of prevIds) assetsById.delete(id);
  }
  const nextIds: string[] = [];
  for (const def of defs) {
    assetsById.set(def.id, def);
    nextIds.push(def.id);
  }
  loadedPackIds.set(packId, nextIds);
}

/** Look up a loaded expansion asset definition by template id. */
export function getExpansionAsset(id: string): ProceduralAssetDef | undefined {
  return assetsById.get(id);
}

/** Return all expansion asset definitions currently loaded in memory. */
export function allLoadedExpansionAssets(): readonly ProceduralAssetDef[] {
  return [...assetsById.values()];
}

/** Report whether the named expansion pack has been registered in memory. */
export function isExpansionPackLoaded(packId: string): boolean {
  return loadedPackIds.has(packId);
}

/** Remove a single registered expansion pack (used by unit tests to isolate mock packs). */
export function unregisterExpansionPack(packId: string): void {
  const ids = loadedPackIds.get(packId);
  if (!ids) return;
  for (const id of ids) assetsById.delete(id);
  loadedPackIds.delete(packId);
}
