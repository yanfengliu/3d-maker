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
// naming the reload. Bound: a hot update that swaps a module without reloading is not
// detected, and an edit landing between two runs makes them differ by more than the sweep
// asked for, so a failing run is repeated on a tree that is not moving.
//
// ------------------------------------------------------------------ the checks
//
// `swept <file>` for a sweep that never moved is a "did not run" reported as success,
// so `swept` is printed only for a sweep that passed; one that did not writes its
// frame and logs `frame <file>` with the reason, so the non-response is visible and
// the token a reader greps for is not there. A sweep passes when the page reports the
// view and colour it is showing (`render_game_to_text()`, as `check-finishes.mjs`
// confirms its frames), did not reload, threw nothing, moved for a sweep that asked
// for a drag or wheel, and settled. A sweep that asked for no input skips the motion
// check.
//
// Exit codes: 0 every sweep passed; 1 a sweep ran but the page did not respond to the
// motion it asked for, or the camera had not settled when the ceiling ran out; 2 the
// sweep could not run — no Chrome, no DevTools endpoint, an empty SWEEP_LIST, a page
// that never became ready, reloaded mid-sweep, exposes no pose, frame count or
// `render_game_to_text()`, or threw, an input token that is not `drag=`/`wheel=`, or a
// settle that could not be read. 2 says this harness did not measure; 1 says it did
// and the page did not do what the sweep asked.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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

async function evaluate(send, expression) {
  const { result } = await send('Runtime.evaluate', { expression, returnByValue: true });
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
        `swept  ${file} — settled in ${settle.elapsed} ms (pose still for ${settle.stillFrames} frames over ${settle.stillPolls} polls, ${settle.rendered} frames rendered)`,
      );
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
