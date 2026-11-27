import { catalog, type Recipe, type TemplateId } from './recipe';
import type { SavedAsset } from './inventory';
import type { ImportEntry } from '../imports/library';
import { searchPolyfork, type PolyforkAsset, type PolyforkPage } from './polyfork';

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
export interface BrowseQuery {
  source: BrowseSource;
  category: BrowseCategory | 'all';
  query: string;
  page: number;
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
}

const originalCategories: Record<TemplateId, BrowseCategory> = {
  'relay-drone': 'vehicle',
  'field-rover': 'vehicle',
  'survey-bot': 'character',
  'cargo-pod': 'prop',
  'signal-tower': 'building',
  'field-pilot': 'character',
};

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
      category: originalCategories[entry.recipe.template], thumbnailUrl: './previews/' + entry.recipe.template + '.webp',
    };
  }
  const { source } = entry;
  return {
    key: 'saved:' + entry.id, source: 'saved', entry, title: entry.name,
    category: categoryOf('category' in source ? source.category : undefined),
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
        category: originalCategories[row.id], thumbnailUrl: './previews/' + row.id + '.webp',
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

const pageSize = 12;
// A combined page can straddle two API pages. Keep recent successful reads so
// moving forward or back reuses the overlapping page without another request.
const pageCache = new Map<string, { value: PolyforkPage; expires: number }>();
const cacheLimit = 80;
const cacheLifetime = 120_000;

async function remotePage(filters: BrowseQuery, page: number, signal: AbortSignal): Promise<PolyforkPage> {
  signal.throwIfAborted();
  const key = JSON.stringify([filters.category, filters.query.trim().toLowerCase(), page]);
  const cached = pageCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  const value = await searchPolyfork(filters.query, signal, page, filters.category === 'all' ? undefined : filters.category);
  signal.throwIfAborted();
  if (value.page !== page) throw new Error('PolyFork returned an unexpected catalog page.');
  if (pageCache.size >= cacheLimit) {
    const first = pageCache.keys().next();
    if (!first.done) pageCache.delete(first.value);
  }
  pageCache.set(key, { value, expires: Date.now() + cacheLifetime });
  return value;
}

function localPage(items: BrowseItem[], requested: number, remoteError: string | null = null): BrowsePage {
  const page = pageWithin(requested, items.length);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length, remoteError };
}

function pageWithin(page: number, total: number): number {
  return Math.min(Math.max(1, Math.ceil(total / pageSize)), Math.max(1, Number.isSafeInteger(page) ? page : 1));
}

function remoteCard(asset: PolyforkAsset): BrowseItem {
  return {
    key: 'polyfork:' + asset.id, source: 'polyfork', asset, title: asset.title,
    category: categoryOf(asset.category), thumbnailUrl: asset.thumbnailUrl,
  };
}

export async function browseAssets(filters: BrowseQuery, locals: BrowseLocals, signal?: AbortSignal): Promise<BrowsePage> {
  signal?.throwIfAborted();
  const local = localBrowseItems(filters, locals);
  if (filters.source === 'original' || filters.source === 'saved' || filters.category === 'import') {
    return localPage(local, filters.page);
  }

  const timeout = AbortSignal.timeout(12_000);
  const request = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let knownPage: BrowsePage | undefined;
  try {
    const first = await remotePage(filters, 1, request);
    const total = local.length + first.total;
    const page = pageWithin(filters.page, total);
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const items = local.slice(start, end);
    knownPage = { items, total, page, pageSize, remoteError: null };
    const remoteStart = Math.max(0, start - local.length);
    const remoteEnd = end - local.length;
    if (remoteStart < remoteEnd) {
      const from = Math.floor(remoteStart / first.perPage) + 1;
      const to = Math.ceil(remoteEnd / first.perPage);
      const requests = Array.from({ length: to - from + 1 }, (_, index) => {
        const number = from + index;
        return number === 1 ? Promise.resolve(first) : remotePage(filters, number, request);
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
    const message = timeout.aborted ? 'The PolyFork catalog timed out.' :
      error instanceof Error ? error.message : 'The PolyFork catalog is unavailable.';
    return knownPage ? { ...knownPage, remoteError: message } : localPage(local, filters.page, message);
  }
}
