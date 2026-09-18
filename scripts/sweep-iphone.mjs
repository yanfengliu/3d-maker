// Close-range audit harness: drives the REAL viewer controls over CDP.
//
// capture-shots.mjs covers the eight `?view=` presets; this harness starts from a
// preset and then orbits/zooms by dispatching trusted mouse input, so every frame
// is produced by the input path a user drives — no camera state is assigned. Use it
// for macro inspections the presets cannot frame: true profiles, grazing walls,
// logo chirality, port mouths.
//
// This file is the entry point: the `SWEEP_LIST` grammar, the Chrome it spawns and
// the throwaway profile behind it — both removed on every exit path — the order a
// sweep runs its checks in, the tokens it prints, and the exit codes. What each step
// runs on is the module that owns it under `scripts/lib/`, and each of those carries
// the measurements and bounds behind what it owns in its own header:
//
//   sweep-cdp.mjs       the DevTools endpoint, the one page session, page reads, and
//                       the trusted mouse input — drag strokes and wheel notches
//   sweep-settle.mjs    the pose and frame reads, and the settle that decides when the
//                       frame is shot, with the dwelling measurement behind it
//   sweep-revision.mjs  the served-bytes fingerprint and the digest a passing run
//                       prints, with what it cannot see
//
// Usage: node scripts/sweep-iphone.mjs
// env: SHOT_BASE (default http://localhost:5199), SHOT_OUT (default .shots/sweep),
//      SHOT_W / SHOT_H (default 1400x1000), SWEEP_LIST as
//      `name:view:color[:drag=dx,dy...][:wheel=delta...]`, sweeps separated by `;`. One
//      drag stroke is one press-move-release in canvas pixels and `.` chains strokes
//      (`drag=-260,0.0,-90` reaches a pose no single arc can); a wheel value is a list of
//      notches, one trusted mouseWheel event each (negative zooms in).
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
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createChromeProfile, removeChromeProfile } from './lib/chrome-profile.mjs';
import { Cdp, drag, evaluate, exceptions, openSession, sleep, waitForEndpoint, wheel } from './lib/sweep-cdp.mjs';
import { revisionDetail, revisionFingerprint, revisionSummary, sourceFiles } from './lib/sweep-revision.mjs';
import { cameraPose, poseChanged, settleControls, settleFailure, shownFrame, startFrameCounter, timeOrigin } from './lib/sweep-settle.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env['SHOT_BASE'] ?? 'http://localhost:5199';
const OUT = resolve(process.env['SHOT_OUT'] ?? '.shots/sweep');
const WIDTH = Number(process.env['SHOT_W'] ?? 1400);
const HEIGHT = Number(process.env['SHOT_H'] ?? 1000);
const SIZE = { width: WIDTH, height: HEIGHT };
const READY_TIMEOUT_MS = 30000;
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
const profile = createChromeProfile('sweep');

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

try {
  const version = await waitForEndpoint(port);
  const cdp = await new Promise((done, fail) => {
    const socket = new WebSocket(version.webSocketDebuggerUrl);
    socket.addEventListener('open', () => done(new Cdp(socket)), { once: true });
    socket.addEventListener('error', fail, { once: true });
  });
  const send = await openSession(cdp, SIZE);

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
        for (const [dx, dy] of part.strokes) await drag(send, SIZE, dx, dy);
      } else {
        for (const notch of part.notches) await wheel(send, SIZE, notch);
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
  // Best-effort and after the kill: deletion blocks only while Chrome holds the
  // directory, reports instead of throwing, and never touches `exitCode` below.
  const leftover = removeChromeProfile(profile);
  if (leftover !== null) console.error(`sweep-iphone: ${leftover}`);
}

process.exitCode = exitCode;
