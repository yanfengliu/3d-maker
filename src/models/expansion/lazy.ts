import type { ProceduralAssetDef } from '../collection-types';
import { expansionPackOf } from './meta';
import { isExpansionPackLoaded, registerExpansionPack } from './registry';
import type { ExpansionPackId } from './types';

export type ExpansionPackLoader = () => Promise<readonly ProceduralAssetDef[]>;

/**
 * Dynamic pack loaders wired in Phase 2 (`() => import('./packs/<pack>').then(...)`).
 * Empty in Phase 1 until the 25 expansion packs are merged.
 */
const packLoaders: Readonly<Partial<Record<ExpansionPackId, ExpansionPackLoader>>> = {};

export interface ExpansionLazyLoader {
  ensurePackLoaded: (packId: string) => Promise<void>;
  ensureTemplateLoaded: (templateId: string) => Promise<void>;
  preloadAll: () => Promise<void>;
}

/** Create a lazy pack loader with in-flight promise deduplication and retry-safe failure cleanup. */
export function createExpansionLazyLoader(
  loaders: Readonly<Partial<Record<string, ExpansionPackLoader>>>,
  resolvePack: (templateId: string) => string | undefined,
): ExpansionLazyLoader {
  const inFlight = new Map<string, Promise<void>>();

  async function ensurePackLoaded(packId: string): Promise<void> {
    if (isExpansionPackLoaded(packId)) return;
    const existing = inFlight.get(packId);
    if (existing) return existing;
    const load = loaders[packId];
    if (!load) {
      throw new Error(`No lazy loader registered for expansion pack "${packId}".`);
    }
    const pending = load()
      .then(defs => {
        registerExpansionPack(packId, defs);
      })
      .finally(() => {
        if (inFlight.get(packId) === pending) inFlight.delete(packId);
      });
    inFlight.set(packId, pending);
    return pending;
  }

  async function ensureTemplateLoaded(templateId: string): Promise<void> {
    const packId = resolvePack(templateId);
    if (!packId) return;
    await ensurePackLoaded(packId);
  }

  async function preloadAll(): Promise<void> {
    const ids = Object.keys(loaders).filter(packId => loaders[packId] !== undefined);
    await Promise.all(ids.map(packId => ensurePackLoaded(packId)));
  }

  return { ensurePackLoaded, ensureTemplateLoaded, preloadAll };
}

const defaultLoader = createExpansionLazyLoader(packLoaders, expansionPackOf);

/** Ensure the expansion pack owning `templateId` is dynamically loaded and registered (no-op for core templates). */
export function ensureExpansionPackLoaded(templateId: string): Promise<void> {
  return defaultLoader.ensureTemplateLoaded(templateId);
}

/** Preload all expansion packs in parallel (used for full thumbnail/poster generation). */
export function preloadAllExpansionPacks(): Promise<void> {
  return defaultLoader.preloadAll();
}
