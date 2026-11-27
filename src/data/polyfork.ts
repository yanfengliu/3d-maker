export interface PolyforkAsset {
  id: string;
  title: string;
  category: string;
  triangles: number | null;
  rigged: boolean;
  hasSkeleton: boolean;
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
const maxExplicitBackoff = 60_000;
const implicitBackoffs = [2_000, 4_000, 8_000, 15_000];
let retryAfter = 0;
let rateLimitStreak = 0;

export class PolyforkRateLimitError extends Error {
  readonly retryAfterMs: number;
  constructor(retryAfterMs: number) {
    const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    super(`PolyFork is limiting catalog requests. Try again in ${String(seconds)} seconds.`);
    this.name = 'PolyforkRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export function expirePolyforkCooldown(): void {
  retryAfter = 0;
}

export function clearPolyforkBackoff(): void {
  retryAfter = 0;
  rateLimitStreak = 0;
}

export function isPolyforkRateLimited(): boolean {
  return retryAfter - Date.now() > 0;
}

export function recordPolyforkRateLimit(retryAfterHeader: string | null): number {
  const wait = nextBackoff(retryAfterHeader);
  retryAfter = Date.now() + wait;
  return wait;
}

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
  // PolyFork flags a retargetable Mixamo skeleton separately from named posable parts.
  return {
    id, title: row.title, category: row.class === 'animal' && row.has_skeleton === true ? 'character' : row.class,
    triangles: row.triangles, hasSkeleton: row.has_skeleton === true,
    rigged: row.has_rig === true, remixable: row.remixable === true,
    thumbnailUrl: row.thumbnail === thumbnailUrl ? thumbnailUrl : '',
    pageUrl: `${origin}/asset/${id}`, glbUrl,
  };
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+$/.test(value)) return Math.min(maxExplicitBackoff, Math.max(1000, Number(value) * 1000));
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.min(maxExplicitBackoff, Math.max(1000, timestamp - Date.now())) : null;
}

function nextBackoff(header: string | null): number {
  const explicit = parseRetryAfter(header);
  if (explicit !== null) return explicit;
  // Browsers cannot read Retry-After across origins unless Access-Control-Expose-Headers lists it.
  // Use a short progressive cooldown instead of locking out browsing for a full minute.
  const delay = implicitBackoffs[Math.min(rateLimitStreak, implicitBackoffs.length - 1)] ?? 15_000;
  rateLimitStreak++;
  return delay;
}

export function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    signal?.throwIfAborted();
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'));
      return;
    }
    const onAbort = () => {
      globalThis.clearTimeout(timer);
      reject(signal?.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'));
    };
    const timer = globalThis.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Search on demand. The API and model downloads stay on PolyFork's own origin. */
export async function searchPolyfork(query: string, signal?: AbortSignal, page = 1, category?: string, perPage = 12): Promise<PolyforkPage> {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error('Choose a positive catalog page number.');
  const remaining = retryAfter - Date.now();
  if (remaining > 0) throw new PolyforkRateLimitError(remaining);
  const url = new URL('/api/assets', origin);
  url.searchParams.set('free', '1');
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('page', String(page));
  if (query.trim()) url.searchParams.set('q', query.trim());
  if (category) url.searchParams.set('class', category);
  const response = await fetch(url, { signal: signal ?? null, credentials: 'omit' });
  if (response.status === 429) {
    const wait = nextBackoff(response.headers.get('Retry-After'));
    retryAfter = Date.now() + wait;
    throw new PolyforkRateLimitError(wait);
  }
  if (!response.ok) throw new Error(`PolyFork catalog request failed (HTTP ${String(response.status)}).`);
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('assets' in result) || !Array.isArray(result.assets)
      || !('page' in result) || !count(result.page) || result.page < 1
      || !('per_page' in result) || !count(result.per_page) || result.per_page < 1
      || !('total' in result) || !count(result.total)) throw new Error('PolyFork returned an unreadable catalog page.');
  retryAfter = 0;
  rateLimitStreak = 0;
  return {
    page: result.page, perPage: result.per_page, total: result.total,
    assets: result.assets.map(parseAsset).filter((asset): asset is PolyforkAsset => asset !== null),
  };
}
