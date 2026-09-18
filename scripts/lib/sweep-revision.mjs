// The revision guard: a frame is a measurement of the code the page was running, so a
// frame whose page was serving a revision other than the one on disk is not a
// measurement of this tree at all. That is not hypothetical: a round of four `scene.ts`
// edits produced four byte-identical measurements and the whole ladder was invalid, and
// nothing in the harness said so — it was caught only because identical values looked
// wrong.
//
// So every sweep fingerprints the code the page is running twice: before the input is
// dispatched, and again after the settle and immediately before the screenshot. The
// fingerprint is `crypto.subtle.digest('SHA-256')` over the bytes of every module the
// page loaded, fetched from inside the page — same origin, same module graph, same
// server — with a cache-busting query, so the browser cannot answer from memory cache.
// The two must match: the first covers the revision the control path ran against, the
// second the revision the frame is a picture of. Vite's `?t=` hot-update stamp is
// dropped from the URL before fetching; a moving timestamp is not a change of code, and
// hashing it would report a different revision for the same bytes.
//
// What it covers: the code the page runs — every module under `src/` that loaded, plus
// `/@vite/*` — hashed as the dev server serves it; that a page which kept a module when
// the edit landed is caught by the served bytes changing; and that every module the tree
// promises a file for, the `/src/` ones, still has one.
//
// Only `/src/` is checked against the tree's files. A dev server also serves modules
// that are not files at all — `/@vite/*` (its client and its injected helpers),
// `/node_modules/.vite/*` (the optimized dependency bundles), anything a plugin answers
// under `/@id/*` — so those are named as the server's, never as missing. They stay in
// the digest, because they are code the page runs.
//
// What it cannot, and this is most of what a reader would hope for:
//
//   - The bytes hashed are the dev server's *transform* of a module, not the module.
//     Their length is not the file's — `scene.ts` is 22.6 kB on disk and 59.4 kB as
//     served — and no field of the response carries a hash of the source, so the
//     fingerprint cannot prove the transform was made from the file on disk now. It
//     proves the page and a fresh fetch of the same URLs agree.
//   - A server whose own transform cache is stale serves the same stale bytes to both
//     of those reads, so the two agree and the sweep passes. This is a guard on the
//     page, not on the server: it catches a page running an older revision than the
//     one being served — the failure that cost a ladder of frames — and not a server
//     that has stopped reading its own files.
//   - A page served from `dist/` has no `/src/` module and no disk link at all, and a
//     stale *build* is invisible here.
//   - Nothing here sees a module the page never imported.
//
// A passing sweep prints the digest it measured — on the `swept` line and, per module,
// on the `revision` line under it — so a later session can put the same tree back and
// get the same digest, or see that it does not.

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { evaluate } from './sweep-cdp.mjs';

/** The app modules the page loaded, as sorted paths with every query dropped. A
 *  `?t=` on a module URL is Vite's hot-update stamp, so it must not enter the
 *  fingerprint: a timestamp that moves would read as a changed revision, and the
 *  same code fetched twice would never compare equal. `initiatorType === 'script'`
 *  is the page's own module loads — the entry script and every import below it —
 *  which is what makes the set a report of the page rather than a guess at it.
 *  `/@vite/client` is matched with its queries dropped too, since Vite loads it
 *  verbatim but a caller can rewrite it; `/@vite/*` is Vite's own client-side
 *  machinery, kept in the digest and exempt from the file check below. Whatever else
 *  the server serves — `/@id/*`, the optimized `/node_modules/.vite/*` bundles — is
 *  left out of the set entirely, because it is not code this repo can tie to a file. */
const LOADED_MODULES = `(() => {
  const paths = [];
  for (const entry of performance.getEntriesByType('resource')) {
    if (entry.initiatorType !== 'script') continue;
    const match = /^(?:[a-z]+:)?\\/\\/[^/]+(\\/[^?#]*)/i.exec(entry.name);
    const path = match === null ? entry.name.split('?')[0] : match[1];
    if (!(path.startsWith('/src/') || path.startsWith('/@vite/'))) continue;
    if (!paths.includes(path)) paths.push(path);
  }
  return JSON.stringify(paths.sort());
})()`;

/** The bytes the page is being served for those modules, hashed. Run inside the
 *  page, so the fetch takes the same origin, the same module graph and the same
 *  server the page itself came from; the cache-busting query is there so the
 *  browser cannot answer from its own memory cache with what the page already has.
 *  Each module's own digest comes back as well, so a passing run prints what the
 *  combined digest is made of. */
const moduleBytes = (paths) => `(async () => {
  const digest = async (text) => {
    const value = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(value)].map((b) => b.toString(16).padStart(2, '0')).join('');
  };
  const modules = [];
  let combined = '';
  for (const path of ${JSON.stringify(paths)}) {
    const response = await fetch(path + '?sweep-revision=1', { cache: 'no-store' });
    const text = await response.text();
    const hash = await digest(text);
    combined += '\\n' + hash;
    modules.push({ path, digest: hash.slice(0, 8), status: response.status });
  }
  return JSON.stringify({ digest: (await digest(combined)).slice(0, 8), modules });
})()`;

/** The page's revision fingerprint: what it loaded, and what it is served for that
 *  now. Null when the page will not report its modules or the fetch fails — a page
 *  whose revision cannot be read is a sweep that cannot be tied to a source, so the
 *  caller refuses it instead of reporting the frame. */
export async function revisionFingerprint(send) {
  const listed = await evaluate(send, LOADED_MODULES);
  if (typeof listed !== 'string') return null;
  const paths = JSON.parse(listed);
  if (!Array.isArray(paths) || paths.length === 0) return null;
  const value = await evaluate(send, moduleBytes(paths));
  if (typeof value !== 'string') return null;
  const served = JSON.parse(value);
  if (!Array.isArray(served.modules) || served.modules.length !== paths.length) return null;
  if (served.modules.some((module) => module.status !== 200)) return null;
  return { digest: served.digest, modules: served.modules, paths };
}

/** Matches one served module URL to the source it comes from, or null when there is
 *  none to check. Only `/src/` is this repo's own TypeScript, and only it is promised
 *  a file per module; a dev server also serves modules that are not files at all —
 *  Vite's own client and injected helpers under `/@vite/`, optimized dependencies
 *  under `/node_modules/.vite/`, and whatever a plugin answers under `/@id/` — so
 *  those come back null and the caller names them as the server's, never as missing. */
function sourceFile(path) {
  const query = path.indexOf('?');
  const name = query < 0 ? path : path.slice(0, query);
  return name.startsWith('/src/') ? resolve(`.${name}`) : null;
}

/** Which of the page's modules are files in this tree, and which are the dev
 *  server's own. This is the whole of the fingerprint's disk half, and it is
 *  deliberately small: the bytes hashed are the dev server's *transform* of a module,
 *  so their length and their content are not the file's — measured on this tree,
 *  `scene.ts` is 22.6 kB on disk and 59.4 kB as served, and no field of the response
 *  carries a hash of the source. What is checkable is that each module the tree
 *  promises — the `/src/` one — still resolves to a file, so a page serving a module
 *  whose file has been deleted is refused. Everything outside `/src/` is classified
 *  as the server's, never as a missing file: `/@vite/client` is the hot-reload client
 *  and not code this repo wrote, and a build served from `dist/` has no `/src/`
 *  module at all. See the header on what this cannot see. */
export function sourceFiles(fingerprint) {
  const known = [];
  const server = [];
  const missing = [];
  for (const module of fingerprint.modules) {
    const file = sourceFile(module.path);
    if (file === null) server.push(module.path);
    else if (existsSync(file)) known.push(module.path);
    else missing.push(module.path);
  }
  return { known, server, missing };
}

/** The `rev` clause of a `swept` line: the modules the digest covers and how many of
 *  them are files in the tree. A reader greps this to see which revision a passing
 *  frame was measured on, and re-runs on the same tree to get the same digest back. */
export function revisionSummary(fingerprint, sources) {
  return (
    `served ${fingerprint.digest} over ${fingerprint.modules.length} modules` +
    `, ${sources.known.length} of them files in this tree` +
    (sources.server.length > 0 ? `, ${sources.server.length} served by the dev server itself` : '') +
    (sources.missing.length > 0 ? `, ${sources.missing.length} with no file on disk (${sources.missing.join(', ')})` : '')
  );
}

/** The per-module `revision` line a passing sweep prints, so the digest above is
 *  auditable: which module it covered and what each one hashed to. */
export function revisionDetail(fingerprint, sources) {
  const listed = fingerprint.modules
    .map((module) => `${module.path}=${module.digest}${sources.missing.includes(module.path) ? ' (no file on disk)' : ''}`)
    .join(' ');
  return `revision ${listed}`;
}
