import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalog, parseRecipe, type Recipe } from './recipe';
import { readInventory, removeAsset, saveAsset } from './inventory';
import { clearPolyforkBackoff, PolyforkRateLimitError, searchPolyfork } from './polyfork';

function starter(): Recipe {
  return { version: 1, template: 'relay-drone', name: 'Relay Drone', primary: '#e8aa36', accent: '#343b40', scale: 1, proportion: 1, detail: true };
}

afterEach(() => {
  clearPolyforkBackoff();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('recipes', () => {
  it('publishes the same fields, choices, and bounds used by the studio', () => {
    const schema = JSON.parse(readFileSync(new URL('../../public/agent-schema.json', import.meta.url), 'utf8')) as {
      required: string[];
      properties: { template: { enum: string[] }; quality: { enum: string[]; default: string }; scale: { minimum: number; maximum: number }; proportion: { minimum: number; maximum: number } };
    };
    expect(schema.required.sort()).toEqual(Object.keys(starter()).sort());
    expect(schema.properties.template.enum).toEqual(catalog.map(row => row.id));
    expect(schema.properties.quality.enum).toEqual(['standard', 'hd']);
    expect(schema.properties.quality.default).toBe('standard');
    for (const entry of catalog) {
      expect(parseRecipe(entry.recipe)).toEqual(entry.recipe);
      expect(entry.recipe.quality).toBe('hd');
    }
    expect(new Set(catalog.map(row => row.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map(row => row.code)).size).toBe(catalog.length);
    expect(new Set(catalog.map(row => row.recipe.name)).size).toBe(catalog.length);
    for (const key of ['scale', 'proportion'] as const) {
      const { minimum, maximum } = schema.properties[key];
      for (const value of [minimum, maximum]) expect(parseRecipe({ ...starter(), [key]: value })[key]).toBe(value);
      for (const value of [minimum - .01, maximum + .01, Infinity, NaN, '1']) {
        expect(() => parseRecipe({ ...starter(), [key]: value })).toThrow();
      }
    }
  });

  it('rejects unknown fields, invalid types and malformed versions before use', () => {
    for (const change of [{ version: 2 }, { template: 'custom' }, { name: '  ' }, { detail: 1 }, { extra: 'value' }, { primary: 'transparent' }, { quality: 'ultra' }]) {
      expect(() => parseRecipe({ ...starter(), ...change })).toThrow();
    }
    expect(parseRecipe({ ...starter(), name: ' Sample ', accent: '#AB12EF' })).toMatchObject({ name: 'Sample', accent: '#ab12ef' });
  });
});

function useStorage() {
  const rows = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    get length() { return rows.size; },
    key: (index: number) => [...rows.keys()][index] ?? null,
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => rows.set(key, value),
    removeItem: (key: string) => rows.delete(key),
  });
  return rows;
}

describe('saved inventory', () => {
  it('opens previous standard recipes without migration and round-trips an HD upgrade', () => {
    const rows = useStorage();
    rows.set('3d-maker:inventory:v1:previous', JSON.stringify({ updatedAt: '2026-10-04T11:00:00Z', recipe: starter() }));
    expect(readInventory()[0]?.recipe).toEqual(starter());
    saveAsset({ ...starter(), quality: 'hd' }, 'previous');
    expect(readInventory()[0]?.recipe).toEqual({ ...starter(), quality: 'hd' });
    saveAsset({ ...starter(), quality: 'standard' }, 'previous');
    expect(readInventory()[0]?.recipe.quality).toBe('standard');
  });

  it('creates independent entries, edits in place, and rejects updates after deletion', () => {
    useStorage();
    const first = saveAsset(starter());
    const second = saveAsset(starter());
    expect(first.id).not.toBe(second.id);
    const revised = saveAsset({ ...first.recipe, name: 'Revised' }, first.id);
    expect(readInventory()).toHaveLength(2);
    expect(readInventory()).toContainEqual(revised);
    removeAsset(first.id);
    expect(() => saveAsset(first.recipe, first.id)).toThrow(/removed/);
    expect(readInventory()).toEqual([second]);
  });

  it('preserves damaged records and unrelated storage while loading the others', () => {
    const rows = useStorage();
    rows.set('other-app', 'unrelated');
    const first = saveAsset(starter());
    const key = [...rows.keys()].find(key => key.endsWith(first.id));
    if (!key) throw new Error('Missing saved row.');
    rows.set(key, '{');
    const valid = saveAsset(starter());
    expect(readInventory()).toEqual([valid]);
    expect(rows.get(key)).toEqual('{');
    expect(rows.get('other-app')).toEqual('unrelated');
  });
});

const polyforkRow = {
  id: 'survey-drone-7c71f9', title: 'Survey Drone', class: 'vehicle', free: true, triangles: 1242,
  has_rig: true, remixable: true, page: 'https://polyfork.dev/asset/survey-drone-7c71f9',
  download: { glb: 'https://polyfork.dev/cdn/survey-drone-7c71f9.glb' },
  thumbnail: 'https://polyfork.dev/files/survey-drone-7c71f9/renders/hero.png',
};

describe('PolyFork search', () => {
  it('queries the official catalog and only returns free rows with an official model', async () => {
    const page = { page: 2, per_page: 12, total: 15, assets: [
      polyforkRow, { ...polyforkRow, free: false }, { ...polyforkRow, id: '../outside' },
      { ...polyforkRow, download: { glb: 'https://third-party.example/mesh.glb' } },
    ] };
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(page));
    vi.stubGlobal('fetch', request);
    const result = await searchPolyfork(' tower & drone ', undefined, 2);
    const call = request.mock.calls[0];
    expect(call?.[0]).toEqual(new URL('https://polyfork.dev/api/assets?free=1&per_page=12&page=2&q=tower+%26+drone'));
    expect(call?.[1]?.credentials).toBe('omit');
    expect(result.assets).toEqual([{
      id: polyforkRow.id, title: polyforkRow.title, category: 'vehicle', triangles: 1242,
      rigged: true, hasSkeleton: false, remixable: true, pageUrl: polyforkRow.page, thumbnailUrl: polyforkRow.thumbnail, glbUrl: polyforkRow.download.glb,
    }]);
  });

  it('surfaces bad responses and honors Retry-After before issuing another request', async () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ wrong: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'Retry-After': '2' } }))
      .mockResolvedValueOnce(Response.json({ page: 1, per_page: 12, total: 0, assets: [] }));
    vi.stubGlobal('fetch', request);
    await expect(searchPolyfork('x')).rejects.toThrow(/unreadable/);
    await expect(searchPolyfork('y')).rejects.toThrow(/2 seconds/);
    await expect(searchPolyfork('z')).rejects.toThrow(/2 seconds/);
    expect(request).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(2001);
    expect((await searchPolyfork('z')).assets).toEqual([]);
  });

  it('uses short progressive backoff when Retry-After is absent over CORS and resets on success or manual retry', async () => {
    vi.useFakeTimers();
    const ok = Response.json({ page: 1, per_page: 12, total: 1, assets: [polyforkRow] });
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(ok)
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(Response.json({ page: 1, per_page: 12, total: 1, assets: [polyforkRow] }));
    vi.stubGlobal('fetch', request);

    let firstError: unknown;
    try { await searchPolyfork('building'); } catch (e) { firstError = e; }
    expect(firstError).toBeInstanceOf(PolyforkRateLimitError);
    expect((firstError as PolyforkRateLimitError).retryAfterMs).toBe(2000);

    vi.advanceTimersByTime(2001);
    let secondError: unknown;
    try { await searchPolyfork('building'); } catch (e) { secondError = e; }
    expect(secondError).toBeInstanceOf(PolyforkRateLimitError);
    expect((secondError as PolyforkRateLimitError).retryAfterMs).toBe(4000);

    vi.advanceTimersByTime(4001);
    expect((await searchPolyfork('building')).assets).toHaveLength(1);

    // Streak reset after success, and clearPolyforkBackoff allows immediate user-triggered retry.
    let thirdError: unknown;
    try { await searchPolyfork('shop'); } catch (e) { thirdError = e; }
    expect((thirdError as PolyforkRateLimitError).retryAfterMs).toBe(2000);
    clearPolyforkBackoff();
    expect((await searchPolyfork('shop')).assets).toHaveLength(1);
    expect(request).toHaveBeenCalledTimes(5);
  });
});
