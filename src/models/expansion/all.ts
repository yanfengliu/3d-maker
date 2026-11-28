import type { ProceduralAssetDef } from '../collection-types';
import { registerExpansionPack } from './registry';
import type { ExpansionPackId } from './types';

/**
 * Eagerly imported expansion packs wired in Phase 2 for synchronous consumers
 * (`src/models/index.ts`, `src/sdk.ts`, Vitest, and `scripts/lock-variations.mjs`).
 * Never import this module from `src/studio/*` or `src/data/*`.
 */
const allExpansionPacks: readonly (readonly [ExpansionPackId, readonly ProceduralAssetDef[]])[] = [];

let registered = false;

/** Synchronously register all expansion packs in memory (idempotent). */
export function ensureAllExpansionPacks(): void {
  if (registered) return;
  for (const [packId, defs] of allExpansionPacks) {
    registerExpansionPack(packId, defs);
  }
  registered = true;
}
