import { catalog, type Recipe, type TemplateId } from './recipe';
import type { SavedAsset } from './inventory';
import type { ImportEntry } from '../imports/library';
import { extraAssetsMeta } from '../models/collections/meta';
import { expansionMeta } from '../models/expansion/meta';
import {
  PolyforkRateLimitError,
  searchPolyfork,
  type PolyforkAsset,
  type PolyforkPage,
} from './polyfork';

import legacyIds from './legacy-humanoids.json';

// Saved references created before the category fix only contain the asset ID and the raw API class.
// Keep the small set affected at release so those saves can also be browsed correctly offline.
const legacyHumanoids = new Set(legacyIds);

export const categories = [
  { id: 'prop', label: 'Props' },
  { id: 'character', label: 'Characters' },
  { id: 'vehicle', label: 'Vehicles' },
  { id: 'building', label: 'Buildings' },
  { id: 'animal', label: 'Animals' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'ultra', label: 'Handheld items' },
  { id: 'attachment', label: 'Attachments' },
  { id: 'hand', label: 'Hands' },
  { id: 'import', label: 'Uncategorized imports' },
] as const;

export type BrowseCategory = typeof categories[number]['id'];
export type BrowseSource = 'all' | 'original' | 'polyfork' | 'saved';
export const DEFAULT_PAGE_SIZE = 36;
export const PAGE_SIZE_OPTIONS = [24, 36, 48, 96] as const;
export interface BrowseQuery {
  source: BrowseSource;
  category: BrowseCategory | 'all';
  query: string;
  page: number;
  pageSize?: number;
}
export interface BrowseLocals {
  recipes: readonly SavedAsset[];
  imports: readonly ImportEntry[];
}
interface Card {
  key: string;
  title: string;
  category: BrowseCategory;
  thumbnailUrl: string;
}
export type BrowseItem = Card & (
  { source: 'original'; recipe: Recipe } |
  { source: 'saved'; entry: SavedAsset | ImportEntry } |
  { source: 'polyfork'; asset: PolyforkAsset }
);
export interface BrowsePage {
  items: BrowseItem[];
  page: number;
  pageSize: number;
  total: number;
  remoteError: string | null;
  retryAfterMs?: number;
}

const starterCategories: Record<string, BrowseCategory> = {
  'relay-drone': 'vehicle',
  'field-rover': 'vehicle',
  'survey-bot': 'character',
  'cargo-pod': 'prop',
  'signal-tower': 'building',
  'field-pilot': 'character',
};

const originalCategories = new Map<string, BrowseCategory>([
  ...Object.entries(starterCategories),
  ...extraAssetsMeta.map(asset => [asset.id, asset.browseCategory] as const),
  ...expansionMeta.map(asset => [asset.id, asset.browseCategory] as const),
]);

function originalCategory(id: TemplateId): BrowseCategory {
  return originalCategories.get(id) ?? 'prop';
}

export function categoryLabel(category: BrowseCategory): string {
  return categories.find(row => row.id === category)?.label ?? category;
}

function categoryOf(value: unknown): BrowseCategory {
  return categories.find(row => row.id === value)?.id ?? 'import';
}

function savedCard(entry: SavedAsset | ImportEntry): BrowseItem {
  if ('recipe' in entry) {
    return {
      key: 'saved:' + entry.id, source: 'saved', entry, title: entry.recipe.name,
      category: originalCategory(entry.recipe.template), thumbnailUrl: './previews/' + entry.recipe.template + '.webp',
    };
  }
  const { source } = entry;
  return {
    key: 'saved:' + entry.id, source: 'saved', entry, title: entry.name,
    category: source.kind === 'polyfork' && legacyHumanoids.has(source.assetId)
      ? 'character' : categoryOf('category' in source ? source.category : undefined),
    thumbnailUrl: source.kind === 'polyfork' && /^[a-z0-9][a-z0-9_-]{0,159}$/.test(source.assetId)
      ? 'https://polyfork.dev/files/' + source.assetId + '/renders/hero.png' : '',
  };
}

export function localBrowseItems(filters: BrowseQuery, locals: BrowseLocals): BrowseItem[] {
  const items: BrowseItem[] = [];
  if (filters.source === 'all' || filters.source === 'original') {
    for (const row of catalog) {
      items.push({
        key: 'original:' + row.id, source: 'original', recipe: row.recipe, title: row.recipe.name,
        category: originalCategory(row.id), thumbnailUrl: './previews/' + row.id + '.webp',
      });
    }
  }
  if (filters.source === 'all' || filters.source === 'saved') {
    const saved = [...locals.recipes, ...locals.imports].sort(
      (a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
    );
    for (const entry of saved) items.push(savedCard(entry));
  }
  const terms = filters.query.trim().toLowerCase().split(/\s+/);
  return items.filter(item => {
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    const text = [item.title, item.category, categoryLabel(item.category)].join(' ').toLowerCase();
    return terms.every(term => text.includes(term));
  });
}

function resolvePageSize(value?: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 100
    ? value
    : DEFAULT_PAGE_SIZE;
}
// A combined page can straddle two API pages. Keep recent successful reads so
// moving forward or back reuses the overlapping page without another request.
interface InFlightPage {
  promise: Promise<PolyforkPage>;
  controller: AbortController;
  waiters: number;
}
const pageCache = new Map<string, { value: PolyforkPage; expires: number }>();
const inFlight = new Map<string, InFlightPage>();
const cacheLimit = 160;
const cacheLifetime = 120_000;
function cachePrefix(filters: BrowseQuery, category: string, size: number) {
  return JSON.stringify([category, filters.query.trim().toLowerCase(), size]) + '/';
}

function waitFor(entry: InFlightPage, signal: AbortSignal): Promise<PolyforkPage> {
  if (signal.aborted) {
    return Promise.reject(signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'));
  }
  entry.waiters++;
  return new Promise<PolyforkPage>((resolve, reject) => {
    let settled = false;
    const release = () => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', onAbort);
      entry.waiters--;
    };
    const onAbort = () => {
      release();
      if (entry.waiters <= 0) entry.controller.abort(signal.reason);
      reject(signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    entry.promise.then(
      value => {
        if (settled) return;
        release();
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        release();
        reject(error instanceof Error ? error : new Error('The catalog request failed.'));
      },
    );
  });
}

async function remotePage(filters: BrowseQuery, page: number, signal: AbortSignal,
  category: string = filters.category, size = DEFAULT_PAGE_SIZE): Promise<PolyforkPage> {
  signal.throwIfAborted();
  const key = cachePrefix(filters, category, size) + String(page);
  const cached = pageCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  let entry = inFlight.get(key);
  if (!entry) {
    const controller = new AbortController();
    const request = (async () => {
      const value = await searchPolyfork(filters.query, controller.signal, page, category === 'all' ? undefined : category, size);
      if (value.page !== page) throw new Error('PolyFork returned an unexpected catalog page.');
      if (pageCache.size >= cacheLimit) {
        const first = pageCache.keys().next();
        if (!first.done) pageCache.delete(first.value);
      }
      pageCache.set(key, { value, expires: Date.now() + cacheLifetime });
      return value;
    })();
    entry = { promise: request, controller, waiters: 0 };
    inFlight.set(key, entry);
    const created = entry;
    void request.finally(() => {
      if (inFlight.get(key) === created) inFlight.delete(key);
    }).catch(() => undefined);
  }
  return waitFor(entry, signal);
}

// A merged class needs its corrected count before user-visible pagination. Read the affected
// classes in API-sized batches and reuse those pages for subsequent searches with the same terms.
async function classAssets(filters: BrowseQuery, category: string, signal: AbortSignal) {
  const size = 100, prefix = cachePrefix(filters, category, size);
  const pages = new Map<number, PolyforkPage>();
  // Later pages can still be fresh when the first page's count has expired.
  for (const [key, entry] of pageCache) {
    if (key.startsWith(prefix) && entry.expires > Date.now()) pages.set(entry.value.page, entry.value);
  }
  let error: string | null = null, retryAfterMs: number | undefined, last = 1, countKnown = false;
  try {
    const first = await remotePage(filters, 1, signal, category, size);
    pages.set(1, first);
    last = Math.max(1, Math.ceil(first.total / first.perPage));
    countKnown = true;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'The catalog request failed.';
    if (cause instanceof PolyforkRateLimitError) retryAfterMs = cause.retryAfterMs;
    last = 1;
  }
  // Fetch remaining pages in small parallel batches instead of a serial page-by-page waterfall.
  const batchSize = 3;
  for (let startPage = 2; startPage <= last && !signal.aborted && !retryAfterMs; startPage += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, last - startPage + 1) }, (_, idx) => startPage + idx);
    const settled = await Promise.allSettled(batch.map(page => remotePage(filters, page, signal, category, size)));
    for (const [idx, outcome] of settled.entries()) {
      const page = batch[idx] ?? startPage;
      if (outcome.status === 'fulfilled') {
        pages.set(page, outcome.value);
      } else {
        const cause: unknown = outcome.reason;
        error = cause instanceof Error ? cause.message : 'The catalog request failed.';
        if (cause instanceof PolyforkRateLimitError) {
          retryAfterMs = Math.max(retryAfterMs ?? 0, cause.retryAfterMs);
        }
      }
    }
  }
  const assets = [...pages.values()].filter(value => !countKnown || value.page <= last)
    .sort((a,b) => a.page - b.page).flatMap(value => value.assets);
  return { assets, error, retryAfterMs };
}

function localPage(items: BrowseItem[], requested: number, size: number, remoteError: string | null = null, retryAfterMs?: number): BrowsePage {
  const page = pageWithin(requested, items.length, size);
  const start = (page - 1) * size;
  return {
    items: items.slice(start, start + size), page, pageSize: size, total: items.length, remoteError,
    ...(retryAfterMs ? { retryAfterMs } : {}),
  };
}

function pageWithin(page: number, total: number, size: number): number {
  return Math.min(Math.max(1, Math.ceil(total / size)), Math.max(1, Number.isSafeInteger(page) ? page : 1));
}

function remoteCard(asset: PolyforkAsset): BrowseItem {
  return {
    key: 'polyfork:' + asset.id, source: 'polyfork', asset, title: asset.title,
    category: categoryOf(asset.category), thumbnailUrl: asset.thumbnailUrl,
  };
}

export async function browseAssets(filters: BrowseQuery, locals: BrowseLocals, signal?: AbortSignal): Promise<BrowsePage> {
  signal?.throwIfAborted();
  const size = resolvePageSize(filters.pageSize);
  const local = localBrowseItems(filters, locals);
  if (filters.source === 'original' || filters.source === 'saved' || filters.category === 'import') {
    return localPage(local, filters.page, size);
  }

  const timeout = AbortSignal.timeout(20_000);
  const request = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let knownPage: BrowsePage | undefined;
  try {
    if (filters.category === 'character' || filters.category === 'animal') {
      const classes = filters.category === 'character' ? ['character', 'animal'] : ['animal'];
      const groups = await Promise.all(classes.map(category => classAssets(filters, category, request)));
      signal?.throwIfAborted();
      const matches = new Map<string, BrowseItem>();
      for (const group of groups) {
        for (const asset of group.assets) {
          if (asset.category === filters.category && !matches.has(asset.id)) matches.set(asset.id, remoteCard(asset));
        }
      }
      const failure = groups.find(group => group.error)?.error;
      const retryAfterMs = groups.reduce((max, group) => Math.max(max, group.retryAfterMs ?? 0), 0) || undefined;
      const warning = failure ? 'PolyFork catalog results are incomplete. ' + failure : null;
      return localPage([...local, ...matches.values()], filters.page, size, warning, retryAfterMs);
    }
    const first = await remotePage(filters, 1, request, filters.category, size);
    const total = local.length + first.total;
    const page = pageWithin(filters.page, total, size);
    const start = (page - 1) * size;
    const end = Math.min(start + size, total);
    const items = local.slice(start, end);
    knownPage = { items, total, page, pageSize: size, remoteError: null };
    const remoteStart = Math.max(0, start - local.length);
    const remoteEnd = end - local.length;
    if (remoteStart < remoteEnd) {
      const from = Math.floor(remoteStart / first.perPage) + 1;
      const to = Math.ceil(remoteEnd / first.perPage);
      const requests = Array.from({ length: to - from + 1 }, (_, index) => {
        const number = from + index;
        return number === 1 ? Promise.resolve(first) : remotePage(filters, number, request, filters.category, size);
      });
      for (const slice of await Promise.all(requests)) {
        const offset = (slice.page - 1) * first.perPage;
        const visible = slice.assets.slice(Math.max(0, remoteStart - offset), remoteEnd - offset);
        items.push(...visible.map(remoteCard));
      }
    }
    return knownPage;
  } catch (error) {
    signal?.throwIfAborted();
    const retryAfterMs = error instanceof PolyforkRateLimitError ? error.retryAfterMs : undefined;
    const message = timeout.aborted ? 'PolyFork catalog request timed out.' :
      error instanceof Error ? error.message : 'PolyFork catalog is unavailable.';
    return knownPage
      ? { ...knownPage, remoteError: message, ...(retryAfterMs ? { retryAfterMs } : {}) }
      : localPage(local, filters.page, size, message, retryAfterMs);
  }
}
