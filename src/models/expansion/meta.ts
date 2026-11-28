import type { ExpansionMetaItem } from './types';

/**
 * Lightweight startup metadata for all expansion models (no Three.js or builder code).
 * Populated during Phase 2 integration when the 25 expansion packs are merged.
 */
export const expansionMeta: readonly ExpansionMetaItem[] = [];

export const expansionMetaById: ReadonlyMap<string, ExpansionMetaItem> = new Map(
  expansionMeta.map(item => [item.id, item]),
);

/** Return the owning expansion pack id for `id`, or undefined for core/existing templates. */
export function expansionPackOf(id: string): string | undefined {
  return expansionMetaById.get(id)?.pack;
}
