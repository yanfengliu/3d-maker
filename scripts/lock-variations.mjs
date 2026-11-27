import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = resolve(rootDir, 'src/models/variations.lock.json');

function parseArgs(argv) {
  let repairKey = null;
  let reason = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--repair') {
      repairKey = argv[++i] ?? '';
    } else if (arg === '--reason') {
      reason = argv[++i] ?? '';
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run variations:lock [-- --repair <template@variation> --reason "<bug fix reason>"]');
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if ((repairKey !== null) !== (reason !== null)) {
    throw new Error('--repair and --reason must be supplied together.');
  }
  if (reason !== null && reason.trim().length < 12) {
    throw new Error('--reason must explain the bug fix in at least 12 characters.');
  }
  return { repairKey, reason: reason?.trim() ?? null };
}

function sameHashes(a, b) {
  return a.recipeHash === b.recipeHash && a.standardHash === b.standardHash && a.hdHash === b.hdHash;
}

const { repairKey, reason } = parseArgs(process.argv.slice(2));
const server = await createServer({
  root: rootDir,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const [{ listVariations }, { computeVariationLockEntry }, { variationKey }] = await Promise.all([
    server.ssrLoadModule('/src/data/recipe.ts'),
    server.ssrLoadModule('/src/models/fingerprint.ts'),
    server.ssrLoadModule('/src/models/variations.ts'),
  ]);

  const existing = existsSync(lockPath)
    ? JSON.parse(readFileSync(lockPath, 'utf8'))
    : { version: 1, entries: {}, repairs: [] };

  const liveMap = new Map();
  for (const item of listVariations()) {
    const entry = computeVariationLockEntry(item);
    liveMap.set(variationKey(entry.template, entry.variation), entry);
  }

  const errors = [];
  for (const [key, prev] of Object.entries(existing.entries)) {
    const live = liveMap.get(key);
    if (!live) {
      errors.push(`Refusing to update lockfile: previously locked variation "${key}" is missing from code.`);
      continue;
    }
    if (!sameHashes(prev, live) && key !== repairKey) {
      errors.push(
        `Refusing to overwrite "${key}": fingerprint changed. Add a new variation in src/models/variations.ts instead, or pass --repair ${key} --reason "<bug fix>" ONLY for a genuine broken-geometry bug fix.`,
      );
    }
  }
  if (repairKey && !existing.entries[repairKey]) {
    errors.push(`Cannot --repair "${repairKey}": it is not an existing locked variation.`);
  }
  if (errors.length) {
    for (const msg of errors) console.error('ERROR:', msg);
    process.exitCode = 1;
  } else {
    const nextEntries = { ...existing.entries };
    const nextRepairs = [...existing.repairs];
    let added = 0;
    let repaired = false;

    for (const [key, live] of liveMap) {
      const prev = existing.entries[key];
      if (!prev) {
        nextEntries[key] = live;
        added++;
      } else if (key === repairKey && !sameHashes(prev, live)) {
        nextEntries[key] = live;
        nextRepairs.push({
          key,
          date: new Date().toISOString().slice(0, 10),
          reason,
          fromRecipeHash: prev.recipeHash,
          toRecipeHash: live.recipeHash,
          fromStandardHash: prev.standardHash,
          toStandardHash: live.standardHash,
          fromHdHash: prev.hdHash,
          toHdHash: live.hdHash,
        });
        repaired = true;
      } else {
        // Keep metadata labels/situations in sync only when hashes are unchanged.
        nextEntries[key] = { ...prev, label: live.label, situation: live.situation };
      }
    }

    const sortedEntries = Object.fromEntries(
      Object.keys(nextEntries)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .map(key => [key, nextEntries[key]]),
    );

    const payload = { version: 1, entries: sortedEntries, repairs: nextRepairs };
    writeFileSync(lockPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    console.log(
      `Locked ${String(Object.keys(sortedEntries).length)} model variations (${String(added)} added${repaired ? `, repaired ${repairKey}` : ''}).`,
    );
  }
} finally {
  await server.close();
}
