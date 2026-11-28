import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url);
const catalogPath = 'public/datasets/site-assets/catalog.json';
const catalogFile = new URL(catalogPath, root);
interface SiteCatalog {
  schemaVersion: number;
  assets: { id: string; versions: { version: number; file: string; bytes: number; sha256: string }[] }[];
}
const catalog = JSON.parse(readFileSync(catalogFile, 'utf8')) as SiteCatalog;

function unchangedReleases(current: SiteCatalog, earlier: SiteCatalog): boolean {
  return earlier.assets.every((prior) => {
    const asset = current.assets.find((entry) => entry.id === prior.id);
    return asset && prior.versions.every((release, i) => isDeepStrictEqual(asset.versions[i], release));
  });
}

describe('versioned site assets', () => {
  it('retains the complete records of every previously committed version', () => {
    const git = (...args: string[]) => execFileSync('git', args, { cwd: fileURLToPath(root), encoding: 'utf8' }).trim();
    const history = git('log', '--format=%H', 'HEAD', '--', catalogPath);
    for (const sha of history.split(/\s+/).filter(Boolean)) {
      const old = JSON.parse(git('show', sha + ':' + catalogPath)) as SiteCatalog;
      expect(unchangedReleases(catalog, old), sha).toBe(true);
    }
  });

  it('allows appended versions and rejects edits or removal of any prior version', () => {
    const release = { version: 1, file: 'roof/v1.glb', bytes: 42, sha256: 'example', dimensionsMetres: { width: 10 } };
    const before = { schemaVersion: 1, assets: [{ id: 'roof', versions: [release] }] };
    const v2 = { ...release, version: 2, file: 'roof/v2.glb' };
    const after = { schemaVersion: 1, assets: [{ id: 'roof', versions: [structuredClone(release), v2] }] };
    expect(unchangedReleases(after, before)).toBe(true);
    expect(unchangedReleases(before, after)).toBe(false);
    const edited = { ...release, dimensionsMetres: { width: 1 } };
    after.assets = [{ id: 'roof', versions: [edited, v2] }];
    expect(unchangedReleases(after, before)).toBe(false);
  });

  it('pins complete release metadata even when earlier commits are unavailable locally', () => {
    const records: Record<string, string> = {};
    for (const asset of catalog.assets) {
      for (const release of asset.versions) {
        // Sort object keys throughout; retain array order and ignore JSON whitespace.
        const keys = new Set<string>();
        JSON.stringify(release, (key, value: unknown) => { keys.add(key); return value; });
        const bytes = JSON.stringify(release, [...keys].sort());
        records[asset.id + '/' + String(release.version)] = createHash('sha256').update(bytes).digest('hex');
      }
    }
    expect(records).toEqual({
      'sfo-international-roof/1': 'aa283770dec730727f2da3907097185477cceb76753ac7297b019290a5796f55',
    });
  });

  it('serves the original SFO roof version and every listed binary with its recorded digest', () => {
    expect(catalog.schemaVersion).toBe(1);
    expect(new Set(catalog.assets.map(asset => asset.id)).size).toBe(catalog.assets.length);
    const roof = catalog.assets.find(asset => asset.id === 'sfo-international-roof');
    expect(roof?.versions[0]).toMatchObject({
      version: 1,
      file: 'sfo-international-roof/v1.glb',
      sha256: '96957c35b1b56a920176788c6b6a512a804bac540e85427b0fe648cdee09db2c',
    });
    for (const asset of catalog.assets) {
      asset.versions.forEach((release, i) => {
        expect(release.version).toBe(i + 1);
        expect(release.file).toBe(asset.id + '/v' + String(release.version) + '.glb');
        const glb = readFileSync(new URL(release.file, catalogFile));
        expect(glb.toString('ascii', 0, 4)).toBe('glTF');
        expect(glb.readUInt32LE(4)).toBe(2);
        expect(glb.readUInt32LE(8)).toBe(release.bytes);
        expect(glb.length).toBe(release.bytes);
        expect(createHash('sha256').update(glb).digest('hex')).toBe(release.sha256);
      });
    }
  });
});
