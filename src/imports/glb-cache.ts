import { abortableDelay } from '../data/polyfork';

// Session-local bounded LRU cache + resilient downloader for PolyFork GLB binaries so switching
// between recently opened models is instant and avoids redundant CDN requests.
const maxEntries = 8;
const maxTotalBytes = 32 * 1024 * 1024;
const glbTimeoutMs = 25_000;
const retryableStatuses = new Set([429, 502, 503, 504]);
const entries = new Map<string, ArrayBuffer>();
let totalBytes = 0;

function retryDelayMs(response: Response, attempt: number): number {
  const header = response.headers.get('Retry-After');
  if (header && /^\d+$/.test(header)) return Math.min(8_000, Math.max(500, Number(header) * 1000));
  return 1_000 * (attempt + 1);
}

export async function downloadPolyforkGlb(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted();
    const timeout = AbortSignal.timeout(glbTimeoutMs);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    let response: Response;
    try {
      response = await fetch(url, { credentials: 'omit', signal: requestSignal });
    } catch (error) {
      signal?.throwIfAborted();
      if (timeout.aborted && attempt < 2) {
        await abortableDelay(800 * (attempt + 1), signal);
        continue;
      }
      if (timeout.aborted) throw new Error('PolyFork model download timed out. Try opening it again.', { cause: error });
      throw error;
    }
    if (retryableStatuses.has(response.status) && attempt < 2) {
      void response.body?.cancel();
      await abortableDelay(retryDelayMs(response, attempt), signal);
      continue;
    }
    if (response.status === 429) throw new Error('PolyFork is limiting model downloads. Try again in a moment.');
    if (!response.ok) throw new Error(`PolyFork could not supply this model (HTTP ${String(response.status)}).`);
    try {
      return await response.arrayBuffer();
    } catch (error) {
      signal?.throwIfAborted();
      if (timeout.aborted) throw new Error('PolyFork model download timed out. Try opening it again.', { cause: error });
      throw error;
    }
  }
  throw new Error('PolyFork could not supply this model.');
}

export function getCachedGlb(assetId: string): ArrayBuffer | null {
  const hit = entries.get(assetId);
  if (!hit) return null;
  // Refresh LRU recency.
  entries.delete(assetId);
  entries.set(assetId, hit);
  return hit;
}

export function cacheGlb(assetId: string, bytes: ArrayBuffer): void {
  if (bytes.byteLength > maxTotalBytes) return;
  const existing = entries.get(assetId);
  if (existing) {
    totalBytes -= existing.byteLength;
    entries.delete(assetId);
  }
  while (entries.size >= maxEntries || totalBytes + bytes.byteLength > maxTotalBytes) {
    const oldest = entries.entries().next();
    if (oldest.done) break;
    entries.delete(oldest.value[0]);
    totalBytes -= oldest.value[1].byteLength;
  }
  entries.set(assetId, bytes);
  totalBytes += bytes.byteLength;
}

export function clearPolyforkGlbCache(): void {
  entries.clear();
  totalBytes = 0;
}
