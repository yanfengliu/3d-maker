import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const assetsDir = join(distDir, 'assets');

// Budgets in gzipped KiB: enforce code-splitting so the 585 KiB motion library and GLTF addons never fold back into startup JS.
const MAX_ENTRY_GZIP_KIB = 175;
const MAX_INITIAL_JS_GZIP_KIB = 360;
const REQUIRED_LAZY_CHUNKS = [
  { prefix: 'library-', label: 'humanoid motion library' },
  { prefix: 'GLTFLoader-', label: 'GLTFLoader' },
  { prefix: 'GLTFExporter-', label: 'GLTFExporter' },
];

function gzipKiB(filePath) {
  return gzipSync(readFileSync(filePath)).byteLength / 1024;
}

const indexHtmlPath = join(distDir, 'index.html');
assert.ok(existsSync(indexHtmlPath), 'Missing dist/index.html; run npm run build first.');
const html = readFileSync(indexHtmlPath, 'utf8');

const initialAssets = new Set();
for (const match of html.matchAll(/(?:src|href)="\.\/assets\/([^"]+\.js)"/g)) {
  if (match[1]) initialAssets.add(match[1]);
}
assert.ok(initialAssets.size > 0, 'No startup JS assets found in dist/index.html.');

const entryJs = [...initialAssets].find(file => /^index-.*\.js$/.test(file));
assert.ok(entryJs, `No entry index-*.js script found in dist/index.html (${[...initialAssets].join(', ')}).`);

const entryKiB = gzipKiB(join(assetsDir, entryJs));
let totalInitialKiB = 0;
const breakdown = [];
for (const file of [...initialAssets].sort()) {
  const kib = gzipKiB(join(assetsDir, file));
  totalInitialKiB += kib;
  breakdown.push(`${file}=${kib.toFixed(1)}KiB`);
}

assert.ok(
  entryKiB <= MAX_ENTRY_GZIP_KIB,
  `Startup entry ${entryJs} is ${entryKiB.toFixed(1)} KiB gzip (budget <= ${String(MAX_ENTRY_GZIP_KIB)} KiB). Check for accidental static imports of lazy chunks.`,
);
assert.ok(
  totalInitialKiB <= MAX_INITIAL_JS_GZIP_KIB,
  `Initial JS loaded by index.html is ${totalInitialKiB.toFixed(1)} KiB gzip (budget <= ${String(MAX_INITIAL_JS_GZIP_KIB)} KiB): ${breakdown.join(', ')}.`,
);

const allAssets = readdirSync(assetsDir);
for (const lazy of REQUIRED_LAZY_CHUNKS) {
  const file = allAssets.find(name => name.startsWith(lazy.prefix) && name.endsWith('.js'));
  assert.ok(file, `Expected lazy chunk ${lazy.prefix}*.js (${lazy.label}) in dist/assets/ — it was folded into another bundle.`);
  assert.ok(
    !initialAssets.has(file),
    `Lazy chunk ${file} (${lazy.label}) is referenced by dist/index.html on startup! Keep it dynamically imported.`,
  );
}

// Verify built studio-sdk.js actually exports every symbol documented in public/llms.txt.
const sdkPath = join(distDir, 'studio-sdk.js');
assert.ok(existsSync(sdkPath), 'Missing dist/studio-sdk.js.');
const sdkSource = readFileSync(sdkPath, 'utf8');
const exportBlockMatch = sdkSource.match(/export\s*\{([^}]+)\}\s*;?\s*$/);
assert.ok(exportBlockMatch, 'Could not locate ES export list in built dist/studio-sdk.js.');
const exportedSymbols = new Set(
  exportBlockMatch[1]
    .split(',')
    .map(part => {
      const pieces = part.trim().split(/\s+as\s+/);
      return (pieces[1] ?? pieces[0] ?? '').trim();
    })
    .filter(Boolean),
);
const llmsText = readFileSync(join(repoRoot, 'public/llms.txt'), 'utf8');
const sdkLine = llmsText.match(/studio-sdk\.js` exports ([^\n]+)/)?.[1] ?? '';
const documentedSdkSymbols = [...sdkLine.matchAll(/`([a-zA-Z0-9_]+)(?:\([^)]*\))?`/g)].map(m => m[1]);
assert.ok(documentedSdkSymbols.length >= 3, 'Expected documented studio-sdk.js exports in public/llms.txt.');
for (const sym of documentedSdkSymbols) {
  assert.ok(exportedSymbols.has(sym), `public/llms.txt documents studio-sdk.js export "${sym}", but built dist/studio-sdk.js exports: ${[...exportedSymbols].join(', ')}`);
}

const catalogPath = join(distDir, 'catalog.json');
assert.ok(existsSync(catalogPath), 'Missing dist/catalog.json.');
const parsedCatalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
assert.ok(Array.isArray(parsedCatalog) && parsedCatalog.length >= 106, 'dist/catalog.json is missing original entries.');

console.log(
  `Bundle check passed: startup JS ${totalInitialKiB.toFixed(1)} KiB gzip (${breakdown.join(', ')}); lazy chunks split cleanly; dist/studio-sdk.js exports verified.`,
);
