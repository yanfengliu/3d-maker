// Compare a free-assets.json snapshot to the public humanoid gallery, using node scripts/check-humanoid-roster.mjs [snapshot].
// The public Characters page has the authoritative humanoid roster but cannot be read cross-origin.
import { readFile } from 'node:fs/promises';

const page = await fetch('https://polyfork.dev/characters', { signal: AbortSignal.timeout(20_000) });
if (!page.ok) throw new Error('Could not read the public Characters page: HTTP ' + page.status);
const html = await page.text();
const count = Number(html.match(/(\d+) rigged humanoids for three\.js/i)?.[1]);
const grid = html.match(/<h2[^>]*>Every character<\/h2>([\s\S]*?)<h2[\s>]/i)?.[1] ?? '';
const ids = new Set(Array.from(grid.matchAll(/href="\/asset\/([a-z0-9][a-z0-9_-]*)"/g), match => match[1]));
if (!count || ids.size !== count) throw new Error('The Characters grid does not match its advertised roster size.');
const file = process.argv[2] ?? new URL('../dataset/polyfork/free-assets.json', import.meta.url);
const catalog = new Map(JSON.parse(await readFile(file, 'utf8')).map(row => [row.id, row]));
const expected = new Set([...catalog.values()]
  .filter(row => row.free && row.has_skeleton === true && (row.class === 'animal' || row.class === 'character'))
  .map(row => row.id));
const missing = [...ids].filter(id => !expected.has(id));
const extra = [...expected].filter(id => !ids.has(id));
if (missing.length || extra.length) {
  throw new Error(JSON.stringify({ missing, extra }) + '. Check the publisher categories and snapshot date.');
}
const legacy = JSON.parse(await readFile(new URL('../src/data/legacy-humanoids.json', import.meta.url), 'utf8'));
const unexpected = legacy.filter(id => catalog.has(id) && !ids.has(id));
if (unexpected.length) throw new Error('Previously misclassified ID is outside the published gallery: ' + unexpected.join(', '));
console.log('Matched every gallery link: ' + ids.size + ' humanoids, including ' +
  [...ids].filter(id => catalog.get(id).class === 'animal').length + ' in the animal API class.');
