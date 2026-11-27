import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const indexUrl = 'https://polyfork.dev/cdn/anim-index.json';
const cache = new URL('../dataset/character-motions/', import.meta.url);
const output = new URL('../src/animation/motions/', import.meta.url);
const offline = process.argv.includes('--offline');

async function readSource(file, url) {
  const path = new URL(file, cache);
  if (offline) return JSON.parse(await readFile(path, 'utf8'));
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw Error(url + ' returned ' + response.status);
  const bytes = await response.text();
  await writeFile(path, bytes);
  return JSON.parse(bytes);
}

await mkdir(cache, { recursive: true });
const index = await readSource('index.json', indexUrl);
assert.match(index.licence, /^CC0 1\.0\b/);
const motions = index.clips.filter(clip => clip.in_downloads === true);
assert.ok(motions.length && new Set(motions.map(clip => clip.name)).size === motions.length);
const generated = new Map();
// Fetch in small batches. A failure leaves the previous packaged release intact.
for (let i = 0; i < motions.length; i += 4) {
  await Promise.all(motions.slice(i, i + 4).map(async entry => {
    const slug = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = 'anim-' + slug + '.json';
    assert.equal(entry.url, 'https://polyfork.dev/cdn/' + filename);
    const raw = await readSource(filename, entry.url);
    assert.equal(raw.cc0, true);
    assert.equal(raw.name, entry.name);
    assert.ok(raw.times.length > 1 && raw.hips.length === raw.times.length * 3);
    assert.ok(Object.values(raw.tracks).every(values => values.length === raw.times.length * 4));
    const {name, times, hips, tracks} = raw;
    const data = gzipSync(JSON.stringify({name, cc0:true, times, hips, tracks}), {level:9});
    assert.ok(data.length <= 512 * 1024);
    generated.set(slug + '.clip.gz', data);
  }));
}
await mkdir(output, { recursive: true });
for (const [name, bytes] of generated) await writeFile(new URL(name, output), bytes);
for (const name of await readdir(output)) {
  if (name.endsWith('.clip.gz') && !generated.has(name)) await unlink(new URL(name, output));
}
console.log('Packed', generated.size, 'CC0 clips in', fileURLToPath(output), 'using', [...generated.values()].reduce((n, b) => n + b.length, 0), 'bytes.');
