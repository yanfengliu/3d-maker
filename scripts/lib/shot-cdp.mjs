// The gate's browser plumbing: it spawns its own headless Chrome, connects over
// the DevTools protocol, opens one shot URL at a time and reads the page's canvas
// back. All four sections the gate runs live in their own modules and run through
// this one; none of them touches a socket.
//
// What it needs: a running dev server and Chrome. `SHOT_BASE` selects the server
// — default `http://localhost:5199`, spelled `localhost` and not `127.0.0.1`
// because Vite listens on the IPv6 loopback — and `SHOT_CHROME` the browser.
// Chrome runs headless on its own port with its own throwaway profile and
// `--enable-unsafe-swiftshader`, over the CDP plumbing `capture-shots.mjs` and
// `sweep-iphone.mjs` already use. The throwaway profile it starts Chrome on is removed
// when this process exits — `chrome-profile.mjs` owns that, and refuses to remove any
// path this process did not create. Pixels are read back with `getImageData` on the
// page's own canvas, the readback the round-7 instrument in `.shots/k2/probe.mjs`
// measured the accepted numbers through, and every statistic — the means, the
// ratio, the run scan — is computed in these scripts from those pixels. No
// package is added.
//
// Everything that means "this measurement never happened" — no DevTools endpoint,
// no `window.__shotReady`, no `render_game_to_text`, a canvas at another size, a
// URL whose parameters never took effect — throws `DidNotRun`, so a harness
// failure can never be read as a verdict about the look.
import { spawn } from 'node:child_process';

import { createChromeProfile, removeChromeProfile } from './chrome-profile.mjs';

export const CHROME = process.env['SHOT_CHROME'] ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const BASE = process.env['SHOT_BASE'] ?? 'http://localhost:5199';

/** The screenshot contract's URL for one frame — `?shot=1` with the `view` and
 *  `color` presets, the same query `capture-shots.mjs` drives, and the reason the
 *  gate's page honors it. */
export const shotUrl = (view, color) => `${BASE}/iphone.html?shot=1&view=${view}&color=${color}`;

// The frame every section is written in: `capture-shots.mjs` at 1400x1000
// produced the round-7 numbers, so the rects are absolute pixels of that frame,
// and any other size is refused rather than scaled — scaling would move them onto
// different surfaces and report a different phenomenon.
export const WIDTH = 1400;
export const HEIGHT = 1000;

const READY_TIMEOUT_MS = 30000;

/** The measurement never happened — a harness or environment failure, not a
 *  verdict about the look, which is why it carries its own exit code. */
export class DidNotRun extends Error {}
export const didNotRun = (message) => new DidNotRun(message);

/** The page's own uncaught exceptions, for the run's "did not run" guard. */
export const exceptions = [];

/** Waits for Chrome's DevTools endpoint, connects, and returns the session. */
async function connect(port) {
  const deadline = Date.now() + 20000;
  let version = null;
  while (version === null && Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${String(port)}/json/version`);
      if (response.ok) version = await response.json();
    } catch {
      // endpoint not up yet
    }
    if (version === null) await new Promise((done) => setTimeout(done, 200));
  }
  if (version === null) throw didNotRun('Chrome started but its DevTools endpoint never came up');
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((done, fail) => {
    socket.addEventListener('open', done, { once: true });
    socket.addEventListener('error', fail, { once: true });
  });
  return new Cdp(socket);
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
      // Flat protocol: the session rides beside `params`, not inside it.
      if (sessionId !== undefined) message.sessionId = sessionId;
      this.socket.send(JSON.stringify(message));
    });
  }
}

async function evaluate(send, expression) {
  const { result } = await send('Runtime.evaluate', { expression, returnByValue: true });
  return result.value;
}

/** Navigates to one shot URL and waits for the page's own ready flag. A page
 *  that never became ready has no trustworthy frame, so its absence is a harness
 *  failure even though a readback would still return numbers. */
export async function open(send, url, label) {
  await send('Page.navigate', { url });
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if ((await evaluate(send, 'window.__shotReady === true')) === true) return;
    await new Promise((done) => setTimeout(done, 150));
  }
  throw didNotRun(`${label}: the page never set window.__shotReady in ${String(READY_TIMEOUT_MS / 1000)} s, so nothing was measured`);
}

/**
 * One readback of the live canvas, after confirming from the page that it is
 * showing the frame the URL asked for. Nothing downstream re-checks any of that,
 * so a canvas of another size or a URL whose parameters never took effect stops
 * the run here, as a "did not run" rather than as a verdict on the look.
 * `expression` is the section's own readback — the `back` view's two bands and
 * columns, the port section's three rects for that frame, the glass section's one
 * rect of samples.
 */
export async function readFrame(send, expected, label, expression) {
  const report = await evaluate(
    send,
    'typeof window.render_game_to_text === "function" ? window.render_game_to_text() : null',
  );
  if (typeof report !== 'string') throw didNotRun(`${label}: the page exposes no window.render_game_to_text(), so the frame it rendered cannot be confirmed`);
  const shown = JSON.parse(report);
  if (shown.color !== expected.color || shown.view !== expected.view) throw didNotRun(`${label}: the page reports color=${String(shown.color)} view=${String(shown.view)} after being asked for ${expected.color}/${expected.view} — the URL's parameters did not take effect`);
  const value = await evaluate(send, expression);
  if (typeof value !== 'string') throw didNotRun(`${label}: the readback returned nothing`);
  const frame = JSON.parse(value);
  if (frame.canvas === null) throw didNotRun(`${label}: the page has no #stage canvas to read`);
  if (frame.canvas.width !== WIDTH || frame.canvas.height !== HEIGHT) throw didNotRun(`${label}: the canvas is ${String(frame.canvas.width)}x${String(frame.canvas.height)}, not ${String(WIDTH)}x${String(HEIGHT)} — the bands are written in that frame's pixels`);
  return frame;
}

/** The camera's own pose, as `window.__iphone.debug()` reports it. */
export async function cameraPose(send) {
  const value = await evaluate(send, 'JSON.stringify(window.__iphone?.debug?.() ?? null)');
  if (typeof value !== 'string') return null;
  const debug = JSON.parse(value);
  if (debug === null || !Array.isArray(debug.camera) || !Array.isArray(debug.target)) return null;
  return [...debug.camera, ...debug.target].map(Number);
}

/** True when the pose moved: same length, any component differing by more than a
 *  thousandth of a millimetre — far under any orbit, far over the rounding. */
export function poseChanged(before, after) {
  if (before === null || after === null || before.length !== after.length) return false;
  return before.some((value, index) => Math.abs(value - after[index]) > 0.001);
}

// A drag is the page's real input path — pressed, moved in steps, released —
// never an assigned camera pose, so a frame the controls could not have reached
// cannot be measured as one the scan passed.
export async function drag(send, dx, dy) {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const steps = 14;
  const at = (x, y, buttons) => ({ x, y, button: 'left', buttons });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...at(cx, cy, 1), clickCount: 1 });
  for (let index = 1; index <= steps; index += 1) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...at(cx + (dx * index) / steps, cy + (dy * index) / steps, 1) });
    await new Promise((done) => setTimeout(done, 24));
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...at(cx + dx, cy + dy, 0), clickCount: 1 });
}

/** Spawns headless Chrome on its own port with a throwaway profile, connects, and
 *  attaches to one target. The caller kills the returned `chrome` when the run is
 *  over, and a failed connect kills it and removes its profile here so a thrown
 *  harness error cannot leave a browser or a directory behind. A run that ends any
 *  other way — the normal end, a non-zero exit code, an uncaught exception — is
 *  cleaned up by `chrome-profile.mjs`'s exit hook. */
export async function openBrowser() {
  const port = 9300 + Math.floor(Math.random() * 400);
  const profile = createChromeProfile('finishes');
  const chrome = spawn(
    CHROME,
    [
      '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
      '--hide-scrollbars', '--force-device-scale-factor=1', '--enable-unsafe-swiftshader',
      `--user-data-dir=${profile}`, `--remote-debugging-port=${String(port)}`,
      `--window-size=${String(WIDTH)},${String(HEIGHT)}`, 'about:blank',
    ],
    { stdio: 'ignore' },
  );

  try {
    const cdp = await connect(port);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params = {}) => cdp.send(method, params, sessionId);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
    return { chrome, send };
  } catch (error) {
    chrome.kill();
    const leftover = removeChromeProfile(profile);
    if (leftover !== null) console.error(`check:finishes: ${leftover}`);
    throw error;
  }
}

/** A dev server that does not answer is a "did not run" and not a failed look:
 *  the look was never measured. The fetch is awaited to completion so a server
 *  that accepts the connection and then fails is caught here too. */
export async function requireServer() {
  let response;
  try {
    response = await fetch(`${BASE}/iphone.html`, { signal: AbortSignal.timeout(5000) });
  } catch (error) {
    throw didNotRun(`no dev server answered at ${BASE} (${error.message}) — start one with "npm run dev", and set SHOT_BASE if it is not on 5199`);
  }
  if (!response.ok) throw didNotRun(`${BASE}/iphone.html answered HTTP ${String(response.status)} — is the dev server serving this repo?`);
  await response.arrayBuffer();
}
