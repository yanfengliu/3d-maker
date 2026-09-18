/**
 * The repository's two prose-only rules, as gates.
 *
 * AGENTS.md states both under "Invariants & boundaries":
 *   - "Files under 500 LOC — extract helpers or split."
 *   - "A measurement must come from the code on disk": "never add an env read to
 *     `src/` and never use `.env` as a control channel".
 *
 * Neither was caught by anything but a worker happening to notice. Four files
 * broke the line bound in four rounds — `src/iphone/parts.test.ts` at 1383,
 * `src/iphone/materials.test.ts` at 553, `src/iphone/optics.test.ts` at 555 and
 * `scripts/check-finishes.mjs` at 932 — and writing this gate found a fifth
 * nobody had recorded: `scripts/sweep-iphone.mjs` reached exactly 500 lines by
 * round 10, and round 11's served-bytes fingerprint guard took it to 707. Two
 * consecutive rounds also patched the running app from outside it: a repo-root
 * `.env` read through the Vite env object, then a page-URL ladder probe that
 * reddened two sibling slices.
 *
 * This file reads the repository's own sources from disk. It imports nothing
 * from the app and needs no browser, and it walks directories rather than
 * listing files, so a file added today is covered today and a file deleted
 * today stops being a false positive. Every walk is sorted, so a failure
 * message is stable across machines.
 *
 * The three forbidden shapes are written below as escaped regexes, which is
 * also why this scanner's own source matches none of them: it needs no
 * exemption from itself, and the control-channel check scans it like any other
 * file under `src/`.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** Absolute path of this file, and of the repository root that holds it. */
const SELF_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SELF_PATH), '..');

/**
 * The bound AGENTS.md states, as a literal: "Files under 500 LOC — extract
 * helpers or split." It is applied inclusively — a file of exactly this many
 * lines passes — because `src/iphone/materials.ts` is a committed file sitting
 * at exactly 500 lines that no task is splitting. That is one line looser than
 * the prose, and it is the first thing this check cannot see: a file sitting
 * exactly at the bound.
 *
 * The rest of that bound, for the line check:
 *   - only `src/` and `scripts/` are walked, so `public/` (binary posters),
 *     `docs/`, `index.html` and the root configs (`vite.config.ts`,
 *     `vitest.config.ts`, `eslint.config.js`) are never counted;
 *   - generated and task output is skipped by directory name, so an oversized
 *     file under `dist/`, `node_modules/`, `.shots/`, `output/` or `coverage/`
 *     passes;
 *   - it counts physical lines, not statements: a dense 499-line file can still
 *     be too big to read.
 */
const MAX_SOURCE_LINES = 500;

/** The roots walked for the line bound. */
const SOURCE_ROOTS = ['src', 'scripts'];

/**
 * The extensions counted. `.ps1` is plain text, so counting its lines needs no
 * parser; `.js` is here because `scripts/` is allowed to hold one even though
 * it holds none today.
 */
const SOURCE_EXTENSIONS = ['.ts', '.mjs', '.js', '.ps1'];

/** Directory names never descended: vendored, generated, or task output. */
const IGNORED_DIRECTORIES = ['.shots', 'coverage', 'dist', 'node_modules', 'output'];

/**
 * The fewest source files a healthy walk can find. Well under the current
 * count, but a gate that cannot tell "passed" from "did not run" reports the
 * second as the first: a renamed root or a broken walk has to fail loudly
 * rather than measure nothing and look green.
 */
const WALK_FLOOR = 20;

/**
 * The three shapes a worker used, or could use, to patch the running app from
 * outside it: the Vite env object, the Node env object, and the page URL. Every
 * dot is escaped, so this file's own source matches none of them.
 */
const CONTROL_CHANNEL_PATTERNS: readonly RegExp[] = [
  /import\.meta\.env/,
  /process\.env/,
  /window\.location/,
];

/**
 * The runtime inputs `src/` is allowed to read, as `path` -> how many lines of
 * that file may match a pattern above.
 *
 * Both viewer pages must honour the screenshot contract AGENTS.md documents —
 * `?shot=1`, `?view=`, `?color=`, `?noui=1` — so a page entry module reading
 * the page URL is a declared channel, not a defect: `src/index/main.ts` reads
 * `?shot`, `src/iphone/main.ts` reads the four query parameters and writes
 * `?view` and `?color` back into the address bar. Both live in the page entry
 * module and nowhere else.
 *
 * Anywhere else is a channel nobody declared, and an extra read here is a new
 * one: change this declaration in the same commit, or the test fails. So is a
 * removal — the declaration has to match reality in both directions, or it rots
 * into a list of things that used to be true.
 */
const DECLARED_URL_READS: ReadonlyMap<string, number> = new Map([
  ['src/index/main.ts', 1],
  ['src/iphone/main.ts', 2],
]);

/**
 * A declared page-URL read builds a `URL` or a `URLSearchParams` on its own
 * line. That is the query contract's shape; a line that reads the page URL for
 * any other reason is a control channel wearing the contract's path.
 */
const DECLARED_URL_READ_SHAPE = /new URL/;

/** One file the walk found. */
interface ScannedFile {
  /** Repository-relative path, always with `/` separators. */
  readonly path: string;
  /** Absolute path, for reading. */
  readonly absolute: string;
}

/** One file's line count, for the line-bound message. */
interface LineCount {
  readonly path: string;
  readonly lines: number;
}

/** One line of a scanned file that matched a control-channel shape. */
interface ChannelHit {
  readonly path: string;
  readonly line: number;
  readonly text: string;
}

/** A repository-relative path with `/` separators, whatever the platform. */
function toRepoPath(absolute: string): string {
  return relative(REPO_ROOT, absolute).split(sep).join('/');
}

/** Every scanned source file, sorted by repository-relative path. */
function walkSourceFiles(): ScannedFile[] {
  const files: ScannedFile[] = [];

  const visit = (directory: string): void => {
    // Sorted here and again at the end, so the offender list cannot depend on
    // the order the filesystem happened to hand back.
    const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    for (const entry of entries) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.includes(entry.name)) visit(absolute);
        continue;
      }
      if (entry.isFile() && SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
        files.push({ path: toRepoPath(absolute), absolute });
      }
    }
  };

  for (const root of SOURCE_ROOTS) {
    const absolute = join(REPO_ROOT, root);
    if (!existsSync(absolute)) {
      throw new Error(`the walk root ${root}/ is missing, so this gate would pass without reading anything`);
    }
    visit(absolute);
  }
  if (files.length < WALK_FLOOR) {
    throw new Error(
      `the walk found ${String(files.length)} source files, under the floor of ${String(WALK_FLOOR)}: this gate is not measuring the tree`,
    );
  }
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/**
 * Lines the way an editor counts them: every `\n` ends a line and a trailing
 * newline does not open another. `\r\n` counts once.
 */
function splitLines(text: string): string[] {
  const lines = text.split(/\r\n|\r|\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Where a control-channel hit is, and the text that matched. */
function formatHit(hit: ChannelHit): string {
  return `${hit.path}:${String(hit.line)} — ${hit.text}`;
}

describe('repository conventions', () => {
  it('keeps every source file under the 500-line bound', () => {
    const offenders = walkSourceFiles()
      .map((file): LineCount => ({
        path: file.path,
        lines: splitLines(readFileSync(file.absolute, 'utf8')).length,
      }))
      .filter((file) => file.lines > MAX_SOURCE_LINES);

    const message = [
      `${String(offenders.length)} source file(s) exceed the ${String(MAX_SOURCE_LINES)}-line bound, which AGENTS.md states as "Files under 500 LOC — extract helpers or split." Split the file or extract helpers:`,
      ...offenders.map((file) => `  ${file.path} — ${String(file.lines)} lines`),
      `The bound is inclusive, so a file at exactly ${String(MAX_SOURCE_LINES)} lines passes. This check walks src/ and scripts/ only, skips generated output, and counts physical lines.`,
    ].join('\n');

    expect(offenders, message).toEqual([]);
  });

  it('keeps src/ free of runtime control channels', () => {
    const files = walkSourceFiles().filter((file) => file.path.startsWith('src/'));
    const hits: ChannelHit[] = [];
    for (const file of files) {
      const lines = splitLines(readFileSync(file.absolute, 'utf8'));
      for (let index = 0; index < lines.length; index += 1) {
        const text = lines[index] ?? '';
        if (CONTROL_CHANNEL_PATTERNS.some((pattern) => pattern.test(text))) {
          hits.push({ path: file.path, line: index + 1, text: text.trim() });
        }
      }
    }

    const problems: string[] = [];

    // Every match has to be a declared page-URL read, on a query-contract line.
    for (const hit of hits) {
      if (!DECLARED_URL_READS.has(hit.path)) {
        problems.push(
          `${formatHit(hit)} — no file under src/ may read a runtime control channel. The only declared reads are the documented screenshot query contract in the two page entry modules, so a measurement comes from the code on disk and never from the environment or a URL probe.`,
        );
        continue;
      }
      if (!DECLARED_URL_READ_SHAPE.test(hit.text)) {
        problems.push(
          `${formatHit(hit)} — a declared page-URL line has to build a URL or a URLSearchParams; this one is not the query contract.`,
        );
      }
    }

    // The declaration has to match reality in both directions.
    const hitsPerFile = new Map<string, number>();
    for (const hit of hits) {
      hitsPerFile.set(hit.path, (hitsPerFile.get(hit.path) ?? 0) + 1);
    }
    for (const [path, declared] of DECLARED_URL_READS) {
      const actual = hitsPerFile.get(path) ?? 0;
      if (actual !== declared) {
        problems.push(
          `${path} declares ${String(declared)} documented page-URL read(s) but has ${String(actual)} — an addition is a new control channel, a removal means the declaration is stale. Update the declaration in ${toRepoPath(SELF_PATH)} in the same commit either way.`,
        );
      }
    }

    const message = [
      'src/ reads a runtime input it did not declare. AGENTS.md: "A measurement must come from the code on disk" — "never add an env read to `src/` and never use `.env` as a control channel".',
      ...problems.map((problem) => `  ${problem}`),
      'This check matches the Vite env object, the Node env object and the page URL, and nothing else: an alias (`globalThis` or `document` in place of `window`, a bare `location`) and a value smuggled through a helper are invisible to it. Removing a declaration is not the fix; the read is.',
    ].join('\n');

    expect(problems, message).toEqual([]);
  });
});
