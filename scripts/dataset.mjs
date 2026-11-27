import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const revision = 'b804068935f6d323d3bf2dd13b4a94d604ffe724';
const indexBase = `https://raw.githubusercontent.com/lucas-martinic/polyfork-catalog/${revision}`;
const api = 'https://polyfork.dev/api/assets';
const examples = ['survey-drone-7c71f9', 'family-traveller-9af47e'];
const { values } = parseArgs({ options: { verify: { type: 'boolean' }, out: { type: 'string' } } });
const root = fileURLToPath(new URL('../dataset/polyfork', import.meta.url));
const output = resolve(values.out ?? root);
const pretty = data => JSON.stringify(data, null, 2) + '\n';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function download(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: { 'User-Agent': '3d-maker-studio/1.0 (https://github.com/yanfengliu/3d-maker)' },
      signal: AbortSignal.timeout(90_000),
    });
    if ((response.status === 429 || response.status === 503) && attempt < 3) {
      const retry = response.headers.get('Retry-After');
      const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : 0;
      const until = retry && !seconds ? Date.parse(retry) - Date.now() : 0;
      await response.body?.cancel();
      await delay(Math.max(2000 * 2 ** attempt, seconds * 1000, until || 0));
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
    return Buffer.from(await response.arrayBuffer());
  }
  throw new Error(`Could not read ${url}`);
}

function uniqueAssets(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Missing catalogue rows.');
  const ids = new Set(rows.map(asset => asset.id));
  if (ids.size !== rows.length || [...ids].some(id => typeof id !== 'string' || !id)) throw new Error('Duplicate or missing asset IDs.');
  return ids;
}

async function currentCatalogue() {
  const assets = [];
  const sources = [];
  let total;
  for (let page = 1; total === undefined || assets.length < total; page++) {
    const url = `${api}?free=1&sort=latest&per_page=100&page=${page}`;
    const result = JSON.parse(await download(url));
    if (!Number.isSafeInteger(result.total) || result.total < 1 || result.page !== page || !result.assets?.length ||
      (total !== undefined && total !== result.total) || result.assets.some(row => row.free !== true)) {
      throw new Error('Catalogue pagination changed or returned an invalid page. Run the download again.');
    }
    total = result.total;
    sources.push(url);
    assets.push(...result.assets);
    if (assets.length < total) await delay(250);
  }
  uniqueAssets(assets);
  if (assets.length !== total) throw new Error('Read a different count from the publisher total.');
  return { assets, sources };
}

function readMesh(bytes) {
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length || bytes.toString('ascii', 16, 20) !== 'JSON') throw new Error('Invalid GLB 2 header.');
  const chunkEnd = 20 + bytes.readUInt32LE(12);
  if (chunkEnd > bytes.length) throw new Error('Truncated GLB.');
  const model = JSON.parse(bytes.toString('utf8', 20, chunkEnd));
  if (!model.meshes?.length || !model.meshes.some(mesh => mesh.primitives?.some(primitive => Number.isInteger(primitive.attributes?.POSITION)))) {
    throw new Error('GLB contains no mesh primitives with positions.');
  }
  return { meshes: model.meshes.length, skins: model.skins?.length ?? 0, animations: (model.animations ?? []).map(clip => clip.name) };
}

async function build(directory) {
  const files = [];
  const record = async (name, data, provenance) => {
    const bytes = Buffer.from(data);
    await writeFile(join(directory, name), bytes);
    files.push({ name, bytes: bytes.length, sha256: hash(bytes), ...provenance });
  };
  const indexUrl = `${indexBase}/catalog.json`;
  const indexBytes = await download(indexUrl);
  const index = JSON.parse(indexBytes);
  if (uniqueAssets(index.assets).size !== index.models) throw new Error('Public index model count mismatch.');
  await record('catalog.json', indexBytes, { source: indexUrl, models: index.models, kits: index.kits.length });
  await record('INDEX-LICENSE.md', await download(`${indexBase}/LICENSE.md`), { source: `${indexBase}/LICENSE.md` });
  console.log(`Read ${index.models} models in the publisher's pinned index. Fetching live metadata…`);

  const { assets, sources } = await currentCatalogue();
  await record('free-assets.json', pretty(assets), { sources, models: assets.length });
  const credits = [];
  for (const id of examples) {
    const asset = assets.find(row => row.id === id);
    const url = `https://polyfork.dev/cdn/${id}.glb`;
    if (!asset || asset.download?.glb !== url) throw new Error(`Missing eligible official GLB for ${id}.`);
    const bytes = await download(url);
    const mesh = readMesh(bytes);
    if (asset.class === 'character' && (!mesh.skins || !mesh.animations.length)) throw new Error('Character example lost its skin or animation.');
    const credit = `${asset.title} by Polyfork (${asset.page}), CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Original mesh, unmodified.`;
    await record(`${id}.glb`, bytes, { source: url, page: asset.page, credit, ...mesh });
    credits.push(credit);
  }
  await record('CREDITS.txt', credits.join('\n') + '\n', { license: 'https://polyfork.dev/licensing' });
  await writeFile(join(directory, 'manifest.json'), pretty({ version: 1, downloadedAt: new Date().toISOString(), revision, files }));
}

async function verify(directory) {
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  const expected = new Set(['catalog.json', 'free-assets.json', 'INDEX-LICENSE.md', 'CREDITS.txt', ...examples.map(id => id + '.glb')]);
  if (manifest.version !== 1 || manifest.revision !== revision || manifest.files.length !== expected.size) throw new Error('Invalid manifest.');
  for (const file of manifest.files) {
    if (!expected.delete(file.name)) throw new Error('Unexpected or duplicate manifest entry.');
    const bytes = await readFile(join(directory, file.name));
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error(`Checksum mismatch: ${file.name}`);
    if (file.name.endsWith('.glb')) {
      const mesh = readMesh(bytes);
      if (mesh.meshes !== file.meshes || mesh.skins !== file.skins || String(mesh.animations) !== String(file.animations)) throw new Error('GLB manifest mismatch.');
    }
    if (file.name === 'free-assets.json' && uniqueAssets(JSON.parse(bytes)).size !== file.models) throw new Error('Live roster count mismatch.');
    if (file.name === 'catalog.json' && uniqueAssets(JSON.parse(bytes).assets).size !== file.models) throw new Error('Public index count mismatch.');
  }
  const roster = manifest.files.find(file => file.name === 'free-assets.json');
  console.log(`Verified ${roster.models} free catalogue records and ${examples.length} complete GLBs in ${directory}`);
}

if (values.verify || existsSync(output)) {
  await verify(output);
} else {
  await mkdir(dirname(output), { recursive: true });
  const temp = await mkdtemp(join(dirname(output), '.' + basename(output) + '-'));
  try {
    await build(temp);
    await verify(temp);
    await rename(temp, output);
    console.log(`Saved ${output}`);
  } finally {
    await rm(temp, { force: true, recursive: true });
  }
}
