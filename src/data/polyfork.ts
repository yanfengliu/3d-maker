export interface PolyforkAsset {
  id: string;
  title: string;
  category: string;
  triangles: number | null;
  rigged: boolean;
  remixable: boolean;
  thumbnailUrl: string;
  pageUrl: string;
  glbUrl: string;
}

export interface PolyforkPage {
  assets: PolyforkAsset[];
  total: number;
  page: number;
  perPage: number;
}

const origin = 'https://polyfork.dev';
const perPage = 12;
let retryAfter = 0;

function count(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function parseAsset(value: unknown): PolyforkAsset | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (row.free !== true || typeof row.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,159}$/.test(row.id)) return null;
  if (typeof row.title !== 'string' || !row.title.trim() || typeof row.class !== 'string' || (row.triangles !== null && !count(row.triangles))) return null;
  const { id } = row;
  const glbUrl = `${origin}/cdn/${id}.glb`;
  if (!row.download || typeof row.download !== 'object' || !('glb' in row.download) || row.download.glb !== glbUrl) return null;
  const thumbnailUrl = `${origin}/files/${id}/renders/hero.png`;
  return {
    id, title: row.title, category: row.class, triangles: row.triangles,
    rigged: row.has_rig === true || row.has_skeleton === true, remixable: row.remixable === true,
    thumbnailUrl: row.thumbnail === thumbnailUrl ? thumbnailUrl : '',
    pageUrl: `${origin}/asset/${id}`, glbUrl,
  };
}

function backoff(value: string | null): number {
  if (!value) return 60_000;
  if (/^\d+$/.test(value)) return Number(value) * 1000;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(1000, timestamp - Date.now()) : 60_000;
}

function rateLimitMessage(): string {
  const seconds = Math.max(1, Math.ceil((retryAfter - Date.now()) / 1000));
  return `PolyFork is limiting catalog requests. Try again in ${String(seconds)} seconds.`;
}

/** Search on demand. The API and model downloads stay on PolyFork's own origin. */
export async function searchPolyfork(query: string, signal?: AbortSignal, page = 1, category?: string): Promise<PolyforkPage> {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error('Choose a positive catalog page number.');
  if (Date.now() < retryAfter) throw new Error(rateLimitMessage());
  const url = new URL('/api/assets', origin);
  url.searchParams.set('free', '1');
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('page', String(page));
  if (query.trim()) url.searchParams.set('q', query.trim());
  if (category) url.searchParams.set('class', category);
  const response = await fetch(url, { signal: signal ?? null, credentials: 'omit' });
  if (response.status === 429) {
    retryAfter = Date.now() + backoff(response.headers.get('Retry-After'));
    throw new Error(rateLimitMessage());
  }
  if (!response.ok) throw new Error(`PolyFork catalog request failed (HTTP ${String(response.status)}).`);
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('assets' in result) || !Array.isArray(result.assets)
      || !('page' in result) || !count(result.page) || result.page < 1
      || !('per_page' in result) || !count(result.per_page) || result.per_page < 1
      || !('total' in result) || !count(result.total)) throw new Error('PolyFork returned an unreadable catalog page.');
  return {
    page: result.page, perPage: result.per_page, total: result.total,
    assets: result.assets.map(parseAsset).filter((asset): asset is PolyforkAsset => asset !== null),
  };
}
