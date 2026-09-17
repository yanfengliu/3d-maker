// Close-range audit harness: drives the REAL viewer controls over CDP.
//
// capture-shots.mjs only covers the eight `?view=` presets; this harness
// starts from a preset and then orbits/zooms by dispatching trusted mouse
// input (Input.dispatchMouseEvent / mouseWheel), so every frame is produced
// by the same input path a user drives — no camera state is assigned. Use it
// for macro inspections the presets cannot frame: true profiles, grazing
// walls, logo chirality, port mouths.
//
// Usage: node scripts/sweep-iphone.mjs
// env: SHOT_BASE (default http://localhost:5199), SHOT_OUT (default .shots/sweep),
//      SHOT_W / SHOT_H (default 1400x1000), SWEEP_LIST as
//      `name:view:color[:drag=dx,dy...][:wheel=delta...]` — each drag step is
//      one press-move-release stroke in canvas pixels; each wheel entry is one
//      wheel notch (negative zooms in).
//
// A `drag=` value holds any number of strokes separated by `.`: `drag=-260,0`
// is one stroke, `drag=-260,0.0,-90` is two applied in sequence — useful for
// reaching a pose no single arc can (`part.slice(5).split('.')`). A `wheel=`
// value is a comma-separated list of notches, one trusted mouseWheel event
// each, so `wheel=-3` is zoom in three notches.
//
// The tool checks that the page actually responded: it reads the camera
// position from `window.__iphone.debug()` before and after the input sequence,
// and a sweep that asked for a drag or a wheel but left the camera where it was
// logs `did not move` for that sweep, exits non-zero, and still writes its
// frame so the non-response is visible rather than silent. A sweep that asks
// for no input is skipped by that check. Exit code is non-zero when any
// requested motion did not happen (or when the page never became ready).
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env['SHOT_BASE'] ?? 'http://localhost:5199';
const OUT = resolve(process.env['SHOT_OUT'] ?? '.shots/sweep');
const WIDTH = Number(process.env['SHOT_W'] ?? 1400);
const HEIGHT = Number(process.env['SHOT_H'] ?? 1000);
const SWEEPS = (
  process.env['SWEEP_LIST'] ?? 'plateau-profile:left:cosmic-orange:drag=-260,0:wheel=-3'
).split(';');
const READY_TIMEOUT_MS = 30000;
const SETTLE_MS = 700;

async function waitForEndpoint(port) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      // not up yet
    }
    await new Promise((done) => setTimeout(done, 200));
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

const port = 9300 + Math.floor(Math.random() * 400);
const profile = `${tmpdir()}\\iphone-sweep-${randomUUID()}`;
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
    await new Promise((done) => setTimeout(done, 24));
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx + dx, y: cy + dy, button: 'left', buttons: 0, clickCount: 1 });
}

/**
 * Where the page's own camera says it is. `window.__iphone.debug()` exposes the
 * camera and the orbit target as `[x, y, z]`, read from the live camera — so
 * this is the page's report of its pose, not an assigned one. Null when the
 * page exposes no hook, which is itself a non-response.
 */
async function cameraPose(send) {
  const { result } = await send('Runtime.evaluate', {
    expression: 'JSON.stringify(window.__iphone?.debug?.() ?? null)',
    returnByValue: true,
  });
  if (typeof result.value !== 'string') return null;
  const debug = JSON.parse(result.value);
  if (debug === null || !Array.isArray(debug.camera) || !Array.isArray(debug.target)) return null;
  return [...debug.camera, ...debug.target].map(Number);
}

/** True when the pose moved: same length, and any component differs. The
 *  tolerance is a thousandth of a millimetre, far under any real orbit and far
 *  over the debug output's own rounding. */
function poseChanged(before, after) {
  if (before === null || after === null) return false;
  if (before.length !== after.length) return false;
  return before.some((value, index) => Math.abs(value - after[index]) > 0.001);
}

let exitCode = 0;

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
    await send('Page.navigate', { url: `${BASE}/iphone.html?shot=1&view=${view}&color=${color}` });

    let ready = false;
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const { result } = await send('Runtime.evaluate', { expression: 'window.__shotReady === true', returnByValue: true });
      if (result.value === true) {
        ready = true;
        break;
      }
      await new Promise((done) => setTimeout(done, 150));
    }
    if (!ready) console.log(`TIMEOUT waiting for ready: ${name}`);

    const input = parts.slice(3);
    const requestedMotion = input.some((part) => part.startsWith('drag=') || part.startsWith('wheel='));
    const before = requestedMotion ? await cameraPose(send) : null;

    for (const part of input) {
      if (part.startsWith('drag=')) {
        for (const stroke of part.slice(5).split('.')) {
          const [dx, dy] = stroke.split(',').map(Number);
          await drag(send, dx, dy);
        }
      } else if (part.startsWith('wheel=')) {
        for (const notch of part.slice(6).split(',')) {
          await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: WIDTH / 2, y: HEIGHT / 2, deltaX: 0, deltaY: Number(notch) * 120 });
          await new Promise((done) => setTimeout(done, 120));
        }
      }
    }
    await new Promise((done) => setTimeout(done, SETTLE_MS));

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const file = `${OUT}\\${color}_${name}.png`;
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`swept  ${file}`);

    // The page has to have responded to the input, or the frame above is the
    // preset again and the audit would read it as the swept pose.
    if (requestedMotion) {
      const after = await cameraPose(send);
      if (!poseChanged(before, after)) {
        exitCode = 1;
        console.log(
          before === null || after === null
            ? `did not move: ${name} — the page exposes no camera to compare (window.__iphone.debug() gave nothing), so the input cannot be shown to have been acted on`
            : `did not move: ${name} — the camera is still at ${after.slice(0, 3).join(', ')} after the input, so this frame is not the pose the sweep asked for`,
        );
      }
    }
  }
} finally {
  chrome.kill();
}

process.exitCode = exitCode;
