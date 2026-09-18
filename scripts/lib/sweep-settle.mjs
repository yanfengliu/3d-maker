// When the frame is shot: the damped controls have to have stopped, and a fixed sleep
// cannot say that. OrbitControls holds (1 - 0.075) of the pending drag per rendered
// frame, so the pose after a drag depends on how many frames were rendered since the
// release, not on how long the harness waited. The 700 ms sleep this harness used
// shot a pose still carrying a few hundredths of the drag: with identical input, two
// runs produced frames differing on 93 px (worst channel delta 32), and in one of four
// runs the pose it printed was identical while the frame was visibly different — so
// every audit frame taken through it, including a round of "no black band" claims, was
// shot at a pose the next run would not reproduce. Three runs at a fixed 2500 ms sleep
// were pixel-identical.
//
// So this module polls the page's own `window.__iphone.debug()` pose every
// SETTLE_POLL_MS, counts rendered frames as it goes, and reports settled once the pose
// has held still for SETTLE_STILL_FRAMES frames over at least SETTLE_STILL_POLLS reads
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
// outside, and a page that will not take the harness's frame counter is a sweep that
// did not run.
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
// naming the reload. The revision fingerprint (`sweep-revision.mjs`) covers what this
// cannot: a page that kept its module after an edit — which is what the time origin
// cannot see, since nothing reloaded — is caught by the served code changing under the
// sweep. An edit landing between two runs still makes them differ by more than the sweep
// asked for, so a failing run is repeated on a tree that is not moving.

import { evaluate, sleep } from './sweep-cdp.mjs';

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

/** Where the page's own camera says it is. `window.__iphone.debug()` exposes the camera
 *  and the orbit target as `[x, y, z]`, read from the live camera — the page's report of
 *  its pose, not an assigned one. Null when the page exposes no hook, a non-response. */
export async function cameraPose(send) {
  const value = await evaluate(send, 'JSON.stringify(window.__iphone?.debug?.() ?? null)');
  if (typeof value !== 'string') return null;
  const debug = JSON.parse(value);
  if (debug === null || !Array.isArray(debug.camera) || !Array.isArray(debug.target)) return null;
  return [...debug.camera, ...debug.target].map(Number);
}

/** True when the pose moved. The tolerance is a thousandth of a millimetre, under the
 *  0.01 mm `debug()` rounds to, so this is exact equality of what the page reported —
 *  the predicate `check-finishes.mjs` refuses a graze frame the input did not move. */
export function poseChanged(before, after) {
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

/** Whether the page took the frame counter. */
export async function startFrameCounter(send) {
  return typeof (await evaluate(send, FRAME_COUNTER)) === 'number';
}

/** The page's frame count, or null when the page will not report one. */
async function frameCount(send) {
  const value = await evaluate(send, 'window.__sweepFrames');
  return typeof value === 'number' ? value : null;
}

/** The page's navigation time origin. A reload gets a new one, so this is how a page
 *  re-served mid-sweep is told from a camera that did not move. */
export async function timeOrigin(send) {
  const value = await evaluate(send, 'window.performance?.timeOrigin ?? null');
  return typeof value === 'number' ? value : null;
}

/** The view and colour the page says it is showing, from the same
 *  `render_game_to_text()` report `check-finishes.mjs` confirms its frames with. The page
 *  falls back to its defaults on an unknown value, so without this a sweep named `bak`
 *  would write a `hero` frame and call it a sweep of `back`. */
export async function shownFrame(send) {
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
export async function settleControls(send, startPose) {
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
export function settleFailure(settle, name) {
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
