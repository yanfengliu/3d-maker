import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ImportEntry } from '../imports/library';
import { browseAssets, categories, localBrowseItems, type BrowseLocals, type BrowseQuery } from './browse';
import { catalog } from './recipe';

const empty: BrowseLocals = { recipes: [], imports: [] };
const all: BrowseQuery = { source: 'all', category: 'all', page: 1, query: '' };
const date = '2026-11-26T01:00:00Z';

function savedRecipe() {
  const starter = catalog.find(row => row.id === 'field-rover');
  if (!starter) throw new Error('Missing original');
  return { id: 'rover-copy', recipe: { ...starter.recipe, name: 'Blue Rover' }, updatedAt: date };
}
function savedFile(id: string, source: ImportEntry['source']): ImportEntry {
  const edits = { name: id, tint: '#ffffff', scale: 1, proportion: 1 };
  return { id, name: id, edits, source, updatedAt: date };
}

function stubCatalog(total: number) {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(raw => {
    if (!(raw instanceof URL)) throw new Error('Expected a catalog URL.');
    const query = raw.searchParams;
    const page = Number(query.get('page'));
    const size = Number(query.get('per_page'));
    const type = query.get('class') ?? 'prop';
    const rows = Array.from({ length: Math.max(0, Math.min(size, total - (page - 1) * size)) }, (_, index) => {
      const number = (page - 1) * size + index;
      const id = 'test-asset-' + String(number);
      return {
        id, title: 'Asset ' + String(number), class: type, free: true, triangles: number + 4,
        thumbnail: 'https://polyfork.dev/files/' + id + '/renders/hero.png',
        download: { glb: 'https://polyfork.dev/cdn/' + id + '.glb' },
      };
    });
    return Promise.resolve(Response.json({ assets: rows, total, page, per_page: size }));
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

function classOutage(totals: Record<string,number>, fails: (source: string, page: number) => boolean) {
  const requests: string[] = [];
  vi.stubGlobal('fetch', (raw: URL) => {
    const source = raw.searchParams.get('class') ?? '', page = Number(raw.searchParams.get('page'));
    const size = Number(raw.searchParams.get('per_page')), start = (page - 1) * size;
    requests.push(source + '/' + String(page));
    if (fails(source,page)) return Promise.resolve(new Response(null, {status:503}));
    const total = totals[source] ?? 0;
    const assets = Array.from({length: Math.max(0,Math.min(size,total - start))}, (_, i) => {
      const id = source + '-' + String(start + i);
      return {id, title:id, free:true, class:source, has_skeleton:true, triangles:100, download:{glb:'https://polyfork.dev/cdn/' + id + '.glb'}};
    });
    return Promise.resolve(Response.json({page, per_page:size, total, assets}));
  });
  return requests;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('unified asset browsing', () => {
  it('exposes all nine publisher categories and an uncategorized local import category', () => {
    expect(categories.map(row => row.id).sort()).toEqual(
      ['prop', 'building', 'vehicle', 'character', 'animal', 'terrain', 'ultra', 'attachment', 'hand', 'import'].sort(),
    );
    expect(new Set(categories.map(row => row.label)).size).toBe(categories.length);
  });

  it('paginates originals, saved variants and all remote hits without duplicate or skipped rows', async () => {
    const requests = stubCatalog(32);
    const locals = { recipes: [savedRecipe()], imports: [] };
    const pages = [];
    for (let page = 1; page <= 4; page++) pages.push(await browseAssets({ ...all, page }, locals));
    expect(pages.map(p => p.items.length)).toEqual([12, 12, 12, 3]);
    expect(pages.every(p => p.total === 39 && !p.remoteError)).toBe(true);
    const items = pages.flatMap(p => p.items);
    expect(items.slice(0, 6).map(item => item.key)).toEqual(catalog.map(row => 'original:' + row.id));
    expect(items[6]?.key).toBe('saved:rover-copy');
    expect(items.slice(7).map(item => item.key)).toEqual(
      Array.from({ length: 32 }, (_, n) => 'polyfork:test-asset-' + String(n)),
    );
    expect(requests).toHaveBeenCalledTimes(3);
    const pastLast = await browseAssets({ ...all, page: 999 }, locals);
    expect(pastLast).toEqual(pages[3]);
    expect(requests).toHaveBeenCalledTimes(3);
  });

  it('combines search and category upstream and for both locally available sources', async () => {
    const requests = stubCatalog(14);
    const query: BrowseQuery = { ...all, category: 'vehicle', query: '  rover ' };
    const locals = { recipes: [savedRecipe()], imports: [] };
    const result = await browseAssets(query, locals);
    const url = requests.mock.calls[0]?.[0];
    if (!(url instanceof URL)) throw new Error('Expected a catalog URL.');
    expect(url.searchParams.get('class')).toBe('vehicle');
    expect(url.searchParams.get('q')).toBe('rover');
    expect(url.searchParams.get('free')).toBe('1');
    expect(result.total).toBe(16);
    expect(result.items.slice(0, 2).map(item => item.title)).toEqual(['Field Rover', 'Blue Rover']);
    const publisherOnly = await browseAssets({ ...query, source: 'polyfork' }, locals);
    expect(publisherOnly.items.every(item => item.source === 'polyfork')).toBe(true);
    expect(publisherOnly.total).toBe(14);
    expect(requests).toHaveBeenCalledTimes(1);
  });

  it('filters saved imports and originals without any network reads', async () => {
    const request = stubCatalog(0);
    const source = { kind: 'polyfork' as const, assetId: 'sample-a', title: 'Publisher A', category: 'animal' };
    const remote = savedFile('My creature', source);
    const older = savedFile('Old import', { kind: 'polyfork', assetId: 'old', title: 'Old source' });
    const local = savedFile('Own import', { kind: 'local', filename: 'custom.glb' });
    const locals = { recipes: [savedRecipe()], imports: [remote, older, local] };
    expect((await browseAssets({ ...all, source: 'original', category: 'character' }, locals)).total).toBe(2);
    expect((await browseAssets({ ...all, source: 'saved' }, locals)).total).toBe(4);
    const files = await browseAssets({ ...all, category: 'import' }, locals);
    expect(files.items.map(i => i.title)).toEqual(['Old import', 'Own import']);
    expect(localBrowseItems({ ...all, source: 'saved', category: 'animal' }, locals)).toEqual([
      expect.objectContaining({ title: 'My creature', entry: remote, thumbnailUrl: 'https://polyfork.dev/files/sample-a/renders/hero.png' }),
    ]);
    expect(request).not.toHaveBeenCalled();
  });

  it('joins published humanoids across API classes before counting, filtering and paging', async () => {
    const waiter = 'taverna-waiter-base', future = 'new-publisher-humanoid', kid = 'kid-in-a-cardboard-670f7d', wolf = 'test-wolf';
    const ordinary = Array.from({length: 102}, (_, i) => 'test-character-' + String(i));
    const byClass: Record<string, string[]> = { character: [...ordinary, kid], animal: [waiter, future, wolf] };
    const fetcher = vi.fn<typeof fetch>().mockImplementation(raw => {
      if (!(raw instanceof URL)) throw new Error('Expected a catalog URL.');
      const query = raw.searchParams, apiClass = query.get('class') ?? 'all';
      const page = Number(query.get('page')), size = Number(query.get('per_page'));
      const ids = byClass[apiClass] ?? [waiter, wolf];
      const assets = ids.slice((page - 1) * size, page * size).map(id => ({
        id, class: apiClass === 'all' ? 'animal' : apiClass, title: id, free: true,
        has_skeleton: id !== kid && id !== wolf, triangles: 500, download: { glb: 'https://polyfork.dev/cdn/' + id + '.glb' },
      }));
      return Promise.resolve(Response.json({page, per_page: size, total: ids.length, assets}));
    });
    vi.stubGlobal('fetch', fetcher);
    const filters: BrowseQuery = { ...all, source: 'polyfork', category: 'character', query: 'roster paging' };
    const keys: string[] = [];
    for (let page = 1; page <= 9; page++) {
      const found = await browseAssets({...filters, page}, empty);
      expect(found.total).toBe(105);
      expect(found.remoteError).toBeNull();
      for (const item of found.items) {
        expect(item.category).toBe('character');
        keys.push(item.key);
      }
    }
    expect(keys).toEqual([...ordinary, kid, waiter, future].map(id => 'polyfork:' + id));
    expect(fetcher).toHaveBeenCalledTimes(3);
    const animals = await browseAssets({...filters, category: 'animal'}, empty);
    expect(animals.items.map(i => i.key)).toEqual(['polyfork:' + wolf]);
    expect(animals.total).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(3);
    const unfiltered = await browseAssets({...filters, category: 'all'}, empty);
    expect(unfiltered.items.map(i => [i.key, i.category])).toEqual([['polyfork:' + waiter,'character'],['polyfork:' + wolf,'animal']]);
    expect(unfiltered.total).toBe(2);
    const saved = savedFile('Waiter in blue', {kind:'polyfork', assetId:waiter, category:'animal', title:'Waiter'});
    expect((await browseAssets({...all, source:'saved', category:'animal'}, {recipes:[], imports:[saved]})).total).toBe(0);
    expect((await browseAssets({...all, source:'saved', category:'character'}, {recipes:[], imports:[saved]})).total).toBe(1);
  });

  it('preserves the result page and count when a later publisher page needs a retry', async () => {
    const requests = stubCatalog(15);
    const filters: BrowseQuery = { ...all, source: 'polyfork', query: 'retry second' };
    await browseAssets(filters, empty);
    requests.mockRejectedValueOnce(new Error('temporary failure'));
    const second = { ...filters, page: 2 };
    expect(await browseAssets(second, empty)).toMatchObject({ page: 2, total: 15, items: [], remoteError: 'temporary failure' });
    expect((await browseAssets(second, empty)).items.map(item => item.title)).toEqual(['Asset 12','Asset 13','Asset 14']);
    expect(requests).toHaveBeenCalledTimes(3);
  });

  it.each(['character','animal'])('keeps the other class when %s fails and retries only the missing class', async failed => {
    let outage = true;
    const requests = classOutage({character:2, animal:3}, source => outage && source === failed);
    const filters: BrowseQuery = {...all, source:'polyfork', category:'character', query:'missing ' + failed};
    const partial = await browseAssets(filters,empty);
    const available = failed === 'animal' ? 'character' : 'animal';
    expect(partial.total).toBe(failed === 'animal' ? 2 : 3);
    expect(partial.items.every(item => item.key.startsWith('polyfork:' + available))).toBe(true);
    expect(partial.remoteError).toMatch(/PolyFork.*incomplete.*503/);
    expect(requests.sort()).toEqual(['animal/1','character/1']);
    outage = false;
    const complete = await browseAssets(filters,empty);
    expect(complete.remoteError).toBeNull();
    expect(complete.total).toBe(5);
    expect(requests.slice(2)).toEqual([failed + '/1']);
  });

  it('keeps available pages on either side of a failed class page and reuses them on retry', async () => {
    let outage = true;
    const requests = classOutage({character:201, animal:1}, (source,page) => outage && source === 'character' && page === 2);
    const filters: BrowseQuery = {...all, source:'polyfork', category:'character', query:'middle page outage', page:9};
    const partial = await browseAssets(filters,empty);
    expect(partial.total).toBe(102);
    expect(partial.page).toBe(9);
    expect(partial.items.map(item => item.key)).toEqual([96,97,98,99,200].map(i => 'polyfork:character-' + String(i)).concat('polyfork:animal-0'));
    expect(partial.remoteError).toMatch(/incomplete/);
    expect(requests).toHaveLength(4);
    outage = false;
    const complete = await browseAssets(filters,empty);
    expect(complete.total).toBe(202);
    expect(complete.remoteError).toBeNull();
    expect(complete.items[4]?.key).toBe('polyfork:character-100');
    expect(requests.slice(4)).toEqual(['character/2']);
  });

  it('keeps a still-fresh later page when its first-page count expires and fails to refresh', async () => {
    vi.useFakeTimers({toFake:['Date']});
    const now = Date.now();
    let initial = true;
    const requests = classOutage({character:101, animal:0}, (source,page) => {
      if (initial && page === 2) vi.setSystemTime(now + 30_000);
      return !initial && source === 'character' && page === 1;
    });
    const filters: BrowseQuery = {...all, source:'polyfork', category:'character', query:'retained cached page'};
    expect((await browseAssets(filters,empty)).total).toBe(101);
    initial = false;
    vi.setSystemTime(now + 125_000);
    const partial = await browseAssets(filters,empty);
    expect(partial.items.map(item => item.key)).toEqual(['polyfork:character-100']);
    expect(partial.remoteError).toMatch(/incomplete/);
    expect(requests.filter(value => value === 'character/2')).toHaveLength(1);
  });

  it('shows free models whose triangle count and thumbnail are still unpublished', async () => {
    const id = 'kid-in-a-cardboard-670f7d';
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      page: 1, per_page: 12, total: 1, assets: [{
        id, title: 'Kid in a Cardboard Robot Costume', class: 'character', free: true, triangles: null,
        thumbnail: null, download: { glb: 'https://polyfork.dev/cdn/' + id + '.glb' },
      }],
    })));
    const page = await browseAssets({ ...all, source: 'polyfork', query: 'cardboard' }, empty);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ key: 'polyfork:' + id, thumbnailUrl: '', asset: { triangles: null } });
  });

  it('keeps immediate local matches after an outage, retries the failed request, and respects cancellation', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(
      Response.json({ page: 1, per_page: 12, total: 0, assets: [] }),
    );
    vi.stubGlobal('fetch', request);
    const filters = { ...all, query: 'pilot' };
    const offline = await browseAssets(filters, empty);
    expect(offline.remoteError).toBe('offline');
    expect(offline.items.map(i => i.title)).toEqual(['Field Pilot']);
    expect((await browseAssets(filters, empty)).remoteError).toBeNull();
    const cancelled = new AbortController();
    cancelled.abort();
    await expect(browseAssets(filters, empty, cancelled.signal)).rejects.toThrow();
    expect(request).toHaveBeenCalledTimes(2);
  });
});
