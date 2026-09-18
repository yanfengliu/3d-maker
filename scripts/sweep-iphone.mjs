// Close-range audit harness: drives the REAL viewer controls over CDP.
//
// capture-shots.mjs covers the eight `?view=` presets; this harness starts from a
// preset and then orbits/zooms by dispatching trusted mouse input, so every frame
// is produced by the input path a user drives — no camera state is assigned. Use it
// for macro inspections the presets cannot frame: true profiles, grazing walls,
// logo chirality, port mouths.
//
// Usage: node scripts/sweep-iphone.mjs
// env: SHOT_BASE (default http://localhost:5199), SHOT_OUT (default .shots/sweep),
//      SHOT_W / SHOT_H (default 1400x1000), SWEEP_LIST as
//      `name:view:color[:drag=dx,dy...][:wheel=delta...]`, sweeps separated by `;`. One
//      drag stroke is one press-move-release in canvas pixels and `.` chains strokes
//      (`drag=-260,0.0,-90` reaches a pose no single arc can); a wheel value is a list of
//      notches, one trusted mouseWheel event each (negative zooms in).
//
// ------------------------------------------------------------------ settling
//
// The frame is shot only once the damped controls have stopped, because a fixed sleep
// cannot say that. OrbitControls holds (1 - 0.075) of the pending drag per rendered frame,
// so the pose after a drag depends on how many frames were rendered since the release, not
// on how long the harness waited. The 700 ms sleep this harness used shot a pose still
// carrying a few hundredths of the drag: with identical input, two runs produced frames
// differing on 93 px (worst channel delta 32), and in one of four runs the pose it printed
// was identical while the frame was visibly different — so every audit frame taken through
// it, including a round of "no black band" claims, was shot at a pose the next run would
// not reproduce. Three runs at a fixed 2500 ms sleep were pixel-identical.
//
// So the harness polls the page's own `window.__iphone.debug()` pose every
// SETTLE_POLL_MS, counts rendered frames as it goes, and shoots once the pose has
// held still for SETTLE_STILL_FRAMES frames over at least SETTLE_STILL_POLLS reads
// — or SETTLE_CEILING_MS after the input, whichever comes first. Frames and not
// milliseconds, because the damping is per rendered frame: stillness across N frames
// bounds the drift in that window under one `debug()` bucket, so the pose still left
// damping at the shot moves at most 0.133/N mm, 0.001 mm at 120 frames. That depth is
// not cosmetic: measured on this harness, a three-poll (300 ms) dwell shot a frame
// differing from a fully converged one on 19 scattered pixels, while a six-poll
// (600 ms, 274 frames) dwell was byte-identical to a 2500 ms fixed-sleep frame in two
// runs.
//
// A poll that rendered no frame does not count as still, nor one that added no frame to
// the poll before it: a stalled renderer and a settled camera look identical from
// outside, and a page that will not take the harness's frame counter is a sweep that did
// not run.
//
// What a caller can rely on: two runs with the same SWEEP_LIST produce pixel-identical
// PNGs, and every passing run prints `settled in N ms` with the frames of stillness the
// frame was taken after. Bounds: the page reports its pose only to 0.01 mm, so this is
// frames of stillness and not proof of a sub-micron stop; the ceiling ends a settle on a
// machine too slow for SETTLE_STILL_FRAMES inside it, which is a failure with a message
// rather than a frame with damping in it; and the frame is an artifact, not necessarily
// the pose the audit wanted — that is what the 1:1 crop is for.
//
// One more thing has to hold still: the page. A dev server reloads it when the page's own
// source is edited, and a reload resets the pose to the preset and wipes the counter the
// settle reads. The harness compares the page's navigation time origin before the input
// and after the screenshot, and a page that changed underneath it fails as `did not run`,
// naming the reload. The revision guard below covers what this cannot: a page that kept
// its module after an edit — which is what the time origin cannot see, since nothing
// reloaded — is caught by the served code changing under the sweep. An edit landing
// between two runs still makes them differ by more than the sweep asked for, so a failing
// run is repeated on a tree that is not moving.
//
// ------------------------------------------------------------- the revision guard
//
// A frame is a measurement of the code the page was running, so a frame whose page
// was serving a revision other than the one on disk is not a measurement of this tree
// at all. That is not hypothetical: a round of four `scene.ts` edits produced four
// byte-identical measurements and the whole ladder was invalid, and nothing in the
// harness said so — it was caught only because identical values looked wrong.
//
// So every sweep fingerprints the code the page is running twice: before the input is
// dispatched, and again after the settle and immediately before the screenshot. The
// fingerprint is `crypto.subtle.digest('SHA-256')` over the bytes of every module the
// page loaded, fetched from inside the page — same origin, same module graph, same
// server — with a cache-busting query, so the browser cannot answer from memory
// cache. The two must match: the first covers the revision the control path ran
// against, the second the revision the frame is a picture of. Vite's `?t=` hot-update
// stamp is dropped from the URL before fetching; a moving timestamp is not a change
// of code, and hashing it would report a different revision for the same bytes.
//
// What it covers: the code the page runs — every module under `src/` that loaded,
// plus `/@vite/*` — hashed as the dev server serves it; that a page which kept a
// module when the edit landed is caught by the served bytes changing; and that every
// module the tree promises a file for, the `/src/` ones, still has one.
//
// Only `/src/` is checked against the tree's files. A dev server also serves modules
// that are not files at all — `/@vite/*` (its client and its injected helpers),
// `/node_modules/.vite/*` (the optimized dependency bundles), anything a plugin
// answers under `/@id/*` — so those are named as the server's, never as missing. They
// stay in the digest, because they are code the page runs.
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
//
// ------------------------------------------------------------------ the checks
//
// `swept <file>` for a sweep that never moved is a "did not run" reported as success,
// so `swept` is printed only for a sweep that passed; one that did not writes its
// frame and logs `frame <file>` with the reason, so the non-response is visible and
// the token a reader greps for is not there. A sweep passes when the page reports the
// view and colour it is showing (`render_game_to_text()`, as `check-finishes.mjs`
// confirms its frames), did not reload, held one revision from the input to the
// screenshot and still serves a file for every module the tree promises, threw
// nothing, moved for a sweep that asked for a drag or wheel, and settled. A sweep
// that asked for no input skips the motion check.
//
// Exit codes: 0 every sweep passed; 1 a sweep ran but the page did not respond to the
// motion it asked for, or the camera had not settled when the ceiling ran out; 2 the
// sweep could not run — no Chrome, no DevTools endpoint, an empty SWEEP_LIST, a page
// that never became ready, reloaded mid-sweep, served a revision that changed under
// the sweep or that no longer resolves to a file in this tree, exposes no pose, frame
// count or `render_game_to_text()`, or threw, an input token that is not
// `drag=`/`wheel=`, or a settle that could not be read. 2 says this harness did not
// measure; 1 says it did and the page did not do what the sweep asked.
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env['SHOT_BASE'] ?? 'http://localhost:5199';
const OUT = resolve(process.env['SHOT_OUT'] ?? '.shots/sweep');
const WIDTH = Number(process.env['SHOT_W'] ?? 1400);
const HEIGHT = Number(process.env['SHOT_H'] ?? 1000);
const READY_TIMEOUT_MS = 30000;
/** How far apart the pose reads are while the controls settle. */
const SETTLE_POLL_MS = 100;
/** Rendered frames the pose must hold still for, counted in frames rather than
 *  milliseconds because the damping is per rendered frame: stillness across N frames
 *  leaves at most 0.133/N mm of motion at the shot. Measured: a three-poll (300 ms)
 *  dwell left a frame differing from a fully converged one on 19 scattered pixels, a
 *  six-poll (600 ms) dwell matched a 2500 ms fixed sleep byte for byte. */
const SETTLE_STILL_FRAMES = 120;
/** Polls that must agree, so one long frame is not the whole of the evidence. */
const SETTLE_STILL_POLLS = 3;
/** The sleep the 0-px, three-run measurement was taken at, kept as the ceiling: a
 *  slower machine reaches the same frame count in more wall-clock time, and one too
 *  slow to finish inside this fails loudly rather than shooting a damping frame. */
const SETTLE_CEILING_MS = 2500;
/** The exit codes the header documents; worst wins. */
const DID_NOT_RUN = 2;
const NO_RESPONSE = 1;

const SWEEPS = (process.env['SWEEP_LIST'] ?? 'plateau-profile:left:cosmic-orange:drag=-260,0:wheel=-3')
  .split(';')
  .map((entry) => entry.trim())
  .filter((entry) => entry.length > 0);

let exitCode = 0;
const failWith = (code) => {
  if (code > exitCode) exitCode = code;
};
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** The page's uncaught exceptions: a page that threw while a sweep ran is not a page
 *  this harness measured. `check-finishes.mjs` refuses a frame the same way. */
const exceptions = [];

async function waitForEndpoint(port) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      // not up yet
    }
    await sleep(200);
  }
  throw new Error('Chrome DevTools endpoint never came up');
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const entry = this.pending.get(message.id);
      if (entry !== undefined) {
        this.pending.delete(message.id);
        if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
        else entry.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        const details = message.params?.exceptionDetails;
        exceptions.push(details?.exception?.description ?? details?.text ?? 'unknown exception');
      }
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise });
      const message = { id, method, params };
      if (sessionId !== undefined) message.sessionId = sessionId;
      this.socket.send(JSON.stringify(message));
    });
  }
}

/** One sweep's input sequence, or a thrown "did not run". Checked before anything is
 *  dispatched: a token that is neither `drag=` nor `wheel=` is a typo the old harness
 *  ignored, which is how it reported `swept` for a sweep that dispatched nothing. */
function parseInput(tokens, name) {
  const parts = [];
  for (const token of tokens) {
    if (token.startsWith('drag=')) {
      const strokes = [];
      for (const stroke of token.slice(5).split('.')) {
        const [dx, dy] = stroke.split(',').map(Number);
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error(`${name}: "${stroke}" is not a drag=dx,dy stroke`);
        strokes.push([dx, dy]);
      }
      parts.push({ kind: 'drag', strokes });
    } else if (token.startsWith('wheel=')) {
      const notches = token.slice(6).split(',').map(Number);
      for (const notch of notches) {
        if (!Number.isFinite(notch)) throw new Error(`${name}: "${token.slice(6)}" is not a wheel=<notch,...> value`);
      }
      parts.push({ kind: 'wheel', notches });
    } else {
      throw new Error(`${name}: "${token}" is not a drag= or wheel= input, so the sweep it describes cannot be dispatched`);
    }
  }
  return parts;
}

const port = 9300 + Math.floor(Math.random() * 400);
const profile = `${tmpdir()}\\iphone-sweep-${randomUUID()}`;

if (!existsSync(CHROME)) {
  console.error(`sweep-iphone DID NOT RUN — no Chrome at ${CHROME}`);
  process.exit(DID_NOT_RUN);
}
if (SWEEPS.length === 0) {
  // An empty or all-separators SWEEP_LIST would otherwise run one unasked-for
  // default sweep and report it swept.
  console.error('sweep-iphone DID NOT RUN — SWEEP_LIST names no sweep');
  process.exit(DID_NOT_RUN);
}

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--enable-unsafe-swiftshader',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

/** One page-side read, with promises awaited: the revision fingerprint fetches the
 *  modules and hashes them inside the page, and without this the CDP result would be
 *  a Promise handle rather than its value. Every other expression here is a plain
 *  value, which `awaitPromise` leaves unchanged. */
async function evaluate(send, expression) {
  const { result } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.value;
}

/** A drag is the page's real input path — pressed, moved in steps, released — never an
 *  assigned camera pose, so a frame the controls could not have reached cannot be
 *  reported as one they did. */
async function drag(send, dx, dy) {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const steps = 14;
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', buttons: 1, clickCount: 1 });
  for (let index = 1; index <= steps; index += 1) {
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: cx + (dx * index) / steps,
      y: cy + (dy * index) / steps,
      button: 'left',
      buttons: 1,
    });
    await sleep(24);
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx + dx, y: cy + dy, button: 'left', buttons: 0, clickCount: 1 });
}

/** Where the page's own camera says it is. `window.__iphone.debug()` exposes the camera
 *  and the orbit target as `[x, y, z]`, read from the live camera — the page's report of
 *  its pose, not an assigned one. Null when the page exposes no hook, a non-response. */
async function cameraPose(send) {
  const value = await evaluate(send, 'JSON.stringify(window.__iphone?.debug?.() ?? null)');
  if (typeof value !== 'string') return null;
  const debug = JSON.parse(value);
  if (debug === null || !Array.isArray(debug.camera) || !Array.isArray(debug.target)) return null;
  return [...debug.camera, ...debug.target].map(Number);
}

/** True when the pose moved. The tolerance is a thousandth of a millimetre, under the
 *  0.01 mm `debug()` rounds to, so this is exact equality of what the page reported —
 *  the predicate `check-finishes.mjs` refuses a graze frame the input did not move. */
function poseChanged(before, after) {
  if (before === null || after === null) return false;
  if (before.length !== after.length) return false;
  return before.some((value, index) => Math.abs(value - after[index]) > 0.001);
}

/** Counts animation frames in the page, so a stopped camera can be told from a stopped
 *  renderer. Injected from here rather than added to the page: it observes and moves
 *  nothing. A page that will not take it refuses the settle rather than being assumed
 *  to be rendering. */
const FRAME_COUNTER =
  'window.__sweepFrames = 0; if (window.__sweepCounting !== true) { window.__sweepCounting = true; const loop = () => { window.__sweepFrames += 1; requestAnimationFrame(loop); }; requestAnimationFrame(loop); } window.__sweepFrames';

async function startFrameCounter(send) {
  return typeof (await evaluate(send, FRAME_COUNTER)) === 'number';
}
async function frameCount(send) {
  const value = await evaluate(send, 'window.__sweepFrames');
  return typeof value === 'number' ? value : null;
}

/** The page's navigation time origin. A reload gets a new one, so this is how a page
 *  re-served mid-sweep is told from a camera that did not move. */
async function timeOrigin(send) {
  const value = await evaluate(send, 'window.performance?.timeOrigin ?? null');
  return typeof value === 'number' ? value : null;
}

/** The view and colour the page says it is showing, from the same
 *  `render_game_to_text()` report `check-finishes.mjs` confirms its frames with. The page
 *  falls back to its defaults on an unknown value, so without this a sweep named `bak`
 *  would write a `hero` frame and call it a sweep of `back`. */
async function shownFrame(send) {
  const value = await evaluate(send, 'typeof window.render_game_to_text === "function" ? window.render_game_to_text() : null');
  if (typeof value !== 'string') return null;
  const shown = JSON.parse(value);
  return { view: shown.view, color: shown.color };
}

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
async function revisionFingerprint(send) {
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
function sourceFiles(fingerprint) {
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
function revisionSummary(fingerprint, sources) {
  return (
    `served ${fingerprint.digest} over ${fingerprint.modules.length} modules` +
    `, ${sources.known.length} of them files in this tree` +
    (sources.server.length > 0 ? `, ${sources.server.length} served by the dev server itself` : '') +
    (sources.missing.length > 0 ? `, ${sources.missing.length} with no file on disk (${sources.missing.join(', ')})` : '')
  );
}

/** The per-module `revision` line a passing sweep prints, so the digest above is
 *  auditable: which module it covered and what each one hashed to. */
function revisionDetail(fingerprint, sources) {
  const listed = fingerprint.modules
    .map((module) => `${module.path}=${module.digest}${sources.missing.includes(module.path) ? ' (no file on disk)' : ''}`)
    .join(' ');
  return `revision ${listed}`;
}

/** Waits for the damped controls to stop instead of sleeping a fixed time. Polls the
 *  page's own pose and counts rendered frames, and reports `settled` only once the pose
 *  has held still for SETTLE_STILL_FRAMES frames over SETTLE_STILL_POLLS reads — a poll
 *  that rendered nothing breaks that run of stillness, since a stalled page and a
 *  stopped camera are the same reading from outside. `everMoved` tells "the input has
 *  not been applied yet" from "the damping is still running". */
async function settleControls(send, startPose) {
  const started = Date.now();
  const result = { settled: false, reason: 'unreadable', elapsed: 0, stillFrames: 0, stillPolls: 0, rendered: 0, everMoved: false, pose: undefined };
  const finish = (settled, reason) => ({ ...result, settled, reason, elapsed: Date.now() - started });
  let previous = await cameraPose(send);
  if (previous === null) return finish(false, 'unreadable');
  let lastFrames = await frameCount(send);
  if (lastFrames === null) return finish(false, 'unreadable');
  let stalled = false;
  while (Date.now() - started < SETTLE_CEILING_MS) {
    await sleep(SETTLE_POLL_MS);
    const current = await cameraPose(send);
    const now = await frameCount(send);
    if (current === null || now === null) {
      result.pose = previous;
      return finish(false, 'unreadable');
    }
    // Per poll, not cumulative: a page that rendered once and then stalled would
    // otherwise read as a page rendering all the way to the shot.
    const advanced = now - lastFrames;
    lastFrames = now;
    result.pose = current;
    if (advanced <= 0) {
      result.stillFrames = 0;
      result.stillPolls = 0;
      stalled = true;
      previous = current;
      continue;
    }
    stalled = false;
    result.rendered += advanced;
    if (poseChanged(startPose, current)) result.everMoved = true;
    if (poseChanged(previous, current)) {
      result.stillFrames = 0;
      result.stillPolls = 0;
    } else {
      result.stillFrames += advanced;
      result.stillPolls += 1;
    }
    previous = current;
    if (result.stillFrames >= SETTLE_STILL_FRAMES && result.stillPolls >= SETTLE_STILL_POLLS) return finish(true, 'still');
  }
  return finish(false, stalled ? 'stalled' : 'moving');
}

/** Why a settle did not pass, in the terms its cause needs — a camera still moving, a page
 *  that stopped rendering, and a page that never moved are different failures. */
function settleFailure(settle, name) {
  if (settle.reason === 'unreadable') {
    return `did not settle: ${name} — the page did not report a pose and a frame count the settle could compare, so the frame cannot be shown to be from a stopped camera`;
  }
  if (settle.reason === 'stalled') {
    return `did not settle: ${name} — the page rendered no frame in one ${SETTLE_POLL_MS} ms poll while settling, so a stopped camera and a stalled renderer cannot be told apart here`;
  }
  if (!settle.everMoved) {
    return `did not settle: ${name} — the pose has not changed at all since the sweep started (${settle.elapsed} ms in, ${settle.rendered} frames rendered), so this frame is the preset and not a settled sweep`;
  }
  const where = settle.pose === undefined ? 'an unreadable pose' : settle.pose.slice(0, 3).join(', ');
  return `did not settle: ${name} — the camera was still moving ${settle.elapsed} ms after the input (last pose ${where}, ${settle.rendered} frames rendered), so the frame is mid-damping and a second run would not reproduce it`;
}

try {
  const version = await waitForEndpoint(port);
  const cdp = await new Promise((done, fail) => {
    const socket = new WebSocket(version.webSocketDebuggerUrl);
    socket.addEventListener('open', () => done(new Cdp(socket)), { once: true });
    socket.addEventListener('error', fail, { once: true });
  });
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params = {}) => cdp.send(method, params, sessionId);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });

  mkdirSync(OUT, { recursive: true });
  for (const sweep of SWEEPS) {
    const parts = sweep.split(':');
    const [name, view = 'hero', color = 'cosmic-orange'] = parts;
    let input;
    try {
      input = parseInput(parts.slice(3), name);
    } catch (error) {
      failWith(DID_NOT_RUN);
      console.log(`did not run: ${error.message}`);
      continue;
    }

    exceptions.length = 0;
    await send('Page.navigate', { url: `${BASE}/iphone.html?shot=1&view=${view}&color=${color}` });

    let ready = false;
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if ((await evaluate(send, 'window.__shotReady === true')) === true) {
        ready = true;
        break;
      }
      await sleep(150);
    }
    if (!ready) {
      // A frame from a page that never became ready is not a frame this harness
      // measured, so the run reports that rather than a `swept` line.
      failWith(DID_NOT_RUN);
      console.log(`did not run: ${name} — the page never set window.__shotReady in ${READY_TIMEOUT_MS / 1000} s, so nothing was swept`);
      continue;
    }
    if (!(await startFrameCounter(send))) {
      failWith(DID_NOT_RUN);
      console.log(`did not run: ${name} — the page did not take the frame counter, so a stopped camera could not be told from a stopped renderer`);
      continue;
    }

    const requestedMotion = input.length > 0;
    const before = await cameraPose(send);
    const origin = await timeOrigin(send);
    // Before the input: what revision the page is running now, so an edit that lands
    // while this sweep runs is a change the harness can see.
    const fingerprintBefore = await revisionFingerprint(send);

    for (const part of input) {
      if (part.kind === 'drag') {
        for (const [dx, dy] of part.strokes) await drag(send, dx, dy);
      } else {
        for (const notch of part.notches) {
          await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: WIDTH / 2, y: HEIGHT / 2, deltaX: 0, deltaY: notch * 120 });
          await sleep(120);
        }
      }
    }

    const settle = await settleControls(send, before);
    // Again after the settle and immediately before the screenshot: this is the
    // revision the frame is about to be a picture of, so an edit that landed during
    // the settle — or between the two reads — fails the sweep rather than producing a
    // frame that cannot be tied to a source.
    const fingerprintAfter = await revisionFingerprint(send);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    // Read the origin again after the capture: a reload landing between the settle
    // and the screenshot would otherwise pass as a settled frame of the swept page.
    const originAfter = await timeOrigin(send);
    const shown = await shownFrame(send);
    const pose = settle.pose ?? (await cameraPose(send));
    const file = `${OUT}\\${color}_${name}.png`;
    writeFileSync(file, Buffer.from(data, 'base64'));

    const reasons = [];
    if (origin === null || originAfter === null) {
      reasons.push([DID_NOT_RUN, `did not run: ${name} — the page reports no navigation time origin, so a reload during the sweep could not be ruled out`]);
    } else if (originAfter !== origin) {
      reasons.push([
        DID_NOT_RUN,
        `did not run: ${name} — the page's navigation time origin changed mid-sweep, which is what a dev server does when the page's own source is edited during a run; the pose is reset to the preset and the frame counter wiped, and a frame from the new revision is not comparable with one from the old, so the tree has to hold still for a sweep to mean anything`,
      ]);
    }
    // The revision guard. A frame that cannot be tied to the source on disk is not a
    // measurement of this tree, so the sweep is refused with its fingerprints named —
    // the frame is still written, because that is what a failed sweep leaves behind.
    const sources = fingerprintAfter === null ? null : sourceFiles(fingerprintAfter);
    if (fingerprintBefore === null || fingerprintAfter === null) {
      reasons.push([
        DID_NOT_RUN,
        `did not run: ${name} — the page would not report the modules it loaded and the bytes it is served for them, so the revision this frame was shot on cannot be read and the frame is not tied to any source`,
      ]);
    } else if (fingerprintBefore.digest !== fingerprintAfter.digest) {
      reasons.push([
        DID_NOT_RUN,
        `did not run: ${name} — the page's served code changed while the sweep ran: ${fingerprintBefore.digest} before the input, ${fingerprintAfter.digest} before the screenshot, over ${fingerprintBefore.modules.length} and ${fingerprintAfter.modules.length} modules; the control path ran against the first revision and the frame was shot on the second, so it is not a frame of either`,
      ]);
    }
    if (sources !== null && sources.missing.length > 0) {
      reasons.push([
        DID_NOT_RUN,
        `did not run: ${name} — the page is serving ${sources.missing.join(', ')}, which has no file in this tree; a module the tree does not hold is a revision nobody can identify, so this frame is refused (served digest ${fingerprintAfter.digest})`,
      ]);
    }
    if (shown === null) {
      reasons.push([DID_NOT_RUN, `did not run: ${name} — the page exposes no window.render_game_to_text(), so the view and colour it is showing cannot be confirmed`]);
    } else if (shown.view !== view || shown.color !== color) {
      reasons.push([DID_NOT_RUN, `did not run: ${name} — the page reports view=${shown.view} color=${shown.color} after being asked for ${view}/${color}, so the URL's parameters did not take effect and this frame is another preset`]);
    }
    if (requestedMotion && (before === null || pose === null)) {
      reasons.push([DID_NOT_RUN, `no pose to compare: ${name} — window.__iphone.debug() gave the page's camera as nothing readable, so the input cannot be shown to have been acted on`]);
    } else if (requestedMotion && !poseChanged(before, pose)) {
      reasons.push([NO_RESPONSE, `did not move: ${name} — the camera is still at ${pose.slice(0, 3).join(', ')} after the input, so this frame is not the pose the sweep asked for`]);
    }
    if (!settle.settled) reasons.push([settle.reason === 'unreadable' || settle.reason === 'stalled' ? DID_NOT_RUN : NO_RESPONSE, settleFailure(settle, name)]);
    if (exceptions.length > 0) {
      reasons.push([DID_NOT_RUN, `did not run: ${name} — the page threw while the sweep ran, so the frame is not from a page this harness measured: ${exceptions.join(' | ')}`]);
    }

    if (reasons.length === 0) {
      console.log(
        `swept  ${file} — settled in ${settle.elapsed} ms (pose still for ${settle.stillFrames} frames over ${settle.stillPolls} polls, ${settle.rendered} frames rendered); ${revisionSummary(fingerprintAfter, sources)}`,
      );
      console.log(revisionDetail(fingerprintAfter, sources));
    } else {
      // The frame is still written, so a non-response is visible rather than silent —
      // but `swept` is not printed for it. That token is the one a reader greps for,
      // and printing it for a sweep that did not pass is how a "did not run" gets read
      // as success.
      console.log(`frame  ${file} — written for diagnosis; this sweep did not pass`);
      for (const [code, message] of reasons) {
        failWith(code);
        console.log(message);
      }
    }
  }
} catch (error) {
  failWith(DID_NOT_RUN);
  console.error(`sweep-iphone DID NOT RUN — ${error instanceof Error ? error.message : String(error)}`);
} finally {
  chrome.kill();
}

process.exitCode = exitCode;
