import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { catalog, listVariations } from '../data/recipe';
import {
  computeVariationLockEntry,
  validateVariationLock,
  type BaselineLock,
  type VariationLockfile,
} from './fingerprint';
import { DEFAULT_VARIATION_ID, modelVariations, variationKey } from './variations';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lockRelPath = 'src/models/variations.lock.json';
const lockAbsPath = resolve(repoRoot, lockRelPath);

function readGitLockfile(ref: string): VariationLockfile | null {
  try {
    const raw = execFileSync('git', ['show', `${ref}:${lockRelPath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(raw) as VariationLockfile;
  } catch {
    return null;
  }
}

function collectGitBaselines(): BaselineLock[] {
  const seen = new Set<string>();
  const baselines: BaselineLock[] = [];
  for (const ref of ['HEAD', 'HEAD~1', 'main', 'origin/main']) {
    let sha: string;
    try {
      sha = execFileSync('git', ['rev-parse', '--verify', ref], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      continue;
    }
    if (seen.has(sha)) continue;
    seen.add(sha);
    const lock = readGitLockfile(ref);
    if (lock) baselines.push({ ref, lock });
  }
  return baselines;
}

describe('model variation dataset registry and append-only enforcement', () => {
  it('registers valid, unique, kebab-case variations for existing templates', () => {
    const templateIds = new Set(catalog.map(entry => entry.id));
    const seen = new Set<string>();
    for (const variation of modelVariations) {
      expect(templateIds.has(variation.template), `Unknown template "${variation.template}"`).toBe(true);
      expect(variation.id).not.toBe(DEFAULT_VARIATION_ID);
      expect(variation.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(variation.label.trim().length).toBeGreaterThan(0);
      expect(variation.situation.trim().length).toBeGreaterThan(0);
      const key = variationKey(variation.template, variation.id);
      expect(seen.has(key), `Duplicate variation "${key}"`).toBe(false);
      seen.add(key);
    }
    expect(modelVariations.length).toBeGreaterThanOrEqual(5);
  });

  it('preserves every locked variation without deletion, silent overwrite, or Git-history rollback', () => {
    expect(existsSync(lockAbsPath), `Missing ${lockRelPath}; run \`npm run variations:lock\`.`).toBe(true);
    const lock = JSON.parse(readFileSync(lockAbsPath, 'utf8')) as VariationLockfile;
    const live = listVariations().map(computeVariationLockEntry);
    const baselines = collectGitBaselines();
    const errors = validateVariationLock(lock, live, baselines);
    expect(errors, errors.join('\n')).toEqual([]);
  }, 120_000);

  it('deterministically rejects deletions, in-place overwrites, and lockfile tampering', () => {
    const [droneDefault, droneCargo] = listVariations('relay-drone');
    if (!droneDefault || !droneCargo) throw new Error('Expected relay-drone variations');
    const sampleA = computeVariationLockEntry(droneDefault);
    const sampleB = computeVariationLockEntry(droneCargo);
    const keyA = variationKey(sampleA.template, sampleA.variation);
    const keyB = variationKey(sampleB.template, sampleB.variation);
    const baseLock: VariationLockfile = {
      version: 1,
      entries: { [keyA]: sampleA, [keyB]: sampleB },
      repairs: [],
    };

    // Baseline clean pass.
    expect(validateVariationLock(baseLock, [sampleA, sampleB], [{ ref: 'main', lock: baseLock }])).toEqual([]);

    // 1. Deleting a variation in code fails.
    const deleteErrors = validateVariationLock(baseLock, [sampleA], [{ ref: 'main', lock: baseLock }]);
    expect(deleteErrors.some(msg => msg.includes(keyB) && msg.includes('deleted or renamed'))).toBe(true);

    // 2. Modifying an existing variation's geometry or recipe in place fails.
    const mutatedB = { ...sampleB, hdHash: 'sha256:mutated' };
    const overwriteErrors = validateVariationLock(baseLock, [sampleA, mutatedB], [{ ref: 'main', lock: baseLock }]);
    expect(overwriteErrors.some(msg => msg.includes(keyB) && msg.includes('changed its recipe or geometry fingerprint'))).toBe(true);

    // 3. Hand-deleting an entry from BOTH code and lockfile is still caught by Git monotonicity!
    const wipedLock: VariationLockfile = { version: 1, entries: { [keyA]: sampleA }, repairs: [] };
    const tamperDeleteErrors = validateVariationLock(wipedLock, [sampleA], [{ ref: 'main', lock: baseLock }]);
    expect(tamperDeleteErrors.some(msg => msg.includes(keyB) && msg.includes('wiped from src/models/variations.lock.json'))).toBe(true);

    // 4. Hand-editing hashes in the lockfile without an audited repair record is caught by Git monotonicity!
    const tamperedHashLock: VariationLockfile = {
      version: 1,
      entries: { [keyA]: sampleA, [keyB]: mutatedB },
      repairs: [],
    };
    const tamperHashErrors = validateVariationLock(tamperedHashLock, [sampleA, mutatedB], [{ ref: 'main', lock: baseLock }]);
    expect(tamperHashErrors.some(msg => msg.includes(keyB) && msg.includes('without a matching audited repair record'))).toBe(true);

    // 5. Appending a brand-new variation passes cleanly.
    const bakeryWinter = listVariations('bakery-shopfront')[1];
    if (!bakeryWinter) throw new Error('Expected bakery-shopfront variation');
    const sampleC = computeVariationLockEntry(bakeryWinter);
    const keyC = variationKey(sampleC.template, sampleC.variation);
    const appendedLock: VariationLockfile = {
      version: 1,
      entries: { [keyA]: sampleA, [keyB]: sampleB, [keyC]: sampleC },
      repairs: [],
    };
    expect(validateVariationLock(appendedLock, [sampleA, sampleB, sampleC], [{ ref: 'main', lock: baseLock }])).toEqual([]);

    // 6. An explicitly audited bug-fix repair passes cleanly, while erasing the audit trail fails.
    const auditedRepairLock: VariationLockfile = {
      version: 1,
      entries: { [keyA]: sampleA, [keyB]: mutatedB },
      repairs: [{
        key: keyB,
        date: '2026-11-27',
        reason: 'Fixed disconnected winch bracket strut on cargo-lifter',
        fromRecipeHash: sampleB.recipeHash,
        toRecipeHash: mutatedB.recipeHash,
        fromStandardHash: sampleB.standardHash,
        toStandardHash: mutatedB.standardHash,
        fromHdHash: sampleB.hdHash,
        toHdHash: mutatedB.hdHash,
      }],
    };
    expect(validateVariationLock(auditedRepairLock, [sampleA, mutatedB], [{ ref: 'main', lock: baseLock }])).toEqual([]);
    const erasedAuditErrors = validateVariationLock(
      { ...auditedRepairLock, repairs: [] },
      [sampleA, mutatedB],
      [{ ref: 'main', lock: auditedRepairLock }],
    );
    expect(erasedAuditErrors.some(msg => msg.includes('Repair audit record'))).toBe(true);

    // 7. Sequential audited bug-fix repairs across consecutive commits form a valid chain, while a gap fails.
    const mutatedB2 = { ...mutatedB, hdHash: 'sha256:mutated-twice' };
    const chainedRepairLock: VariationLockfile = {
      version: 1,
      entries: { [keyA]: sampleA, [keyB]: mutatedB2 },
      repairs: [
        ...auditedRepairLock.repairs,
        {
          key: keyB,
          date: '2026-11-28',
          reason: 'Fixed mid-motion collision clearance on cargo-lifter',
          fromRecipeHash: mutatedB.recipeHash,
          toRecipeHash: mutatedB2.recipeHash,
          fromStandardHash: mutatedB.standardHash,
          toStandardHash: mutatedB2.standardHash,
          fromHdHash: mutatedB.hdHash,
          toHdHash: mutatedB2.hdHash,
        },
      ],
    };
    expect(validateVariationLock(chainedRepairLock, [sampleA, mutatedB2], [{ ref: 'HEAD~1', lock: baseLock }])).toEqual([]);
    const secondRepair = chainedRepairLock.repairs[1];
    if (!secondRepair) throw new Error('Expected second repair record');
    const brokenChainLock: VariationLockfile = {
      ...chainedRepairLock,
      repairs: [secondRepair],
    };
    const brokenChainErrors = validateVariationLock(brokenChainLock, [sampleA, mutatedB2], [{ ref: 'HEAD~1', lock: baseLock }]);
    expect(brokenChainErrors.some(msg => msg.includes('without a matching audited repair record'))).toBe(true);
  });
});
