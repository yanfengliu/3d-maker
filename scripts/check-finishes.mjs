// The look gate: renders each of the iPhone viewer's three finishes, reads the
// pixels back, and fails when the look has drifted off the values round 7
// measured it to.
//
// What it needs: a running dev server and Chrome. `SHOT_BASE` selects the server
// — default `http://localhost:5199`, spelled `localhost` and not `127.0.0.1`
// because Vite listens on the IPv6 loopback — and `SHOT_CHROME` the browser.
// Chrome runs headless on its own port with its own throwaway profile and
// `--enable-unsafe-swiftshader`, over the CDP plumbing `capture-shots.mjs` and
// `sweep-iphone.mjs` already use. Pixels are read back with `getImageData` on the
// page's own canvas, the readback the round-7 instrument in `.shots/k2/probe.mjs`
// measured the accepted numbers through, and every statistic — the means, the
// ratio, the run scan — is computed here from those pixels. No package is added.
//
// What it proves: the one look number the finishes were fitted to. On the
// 1400x1000 `back` view, the mean relative luminance of the rail band over the
// panel band's, for all three finishes, each inside ±0.05 of its reference. With
// `--graze` it also proves the plateau's rolled shoulder renders without a black
// band — the defect was a 26 px run of luma ≤ 3 — over 15 columns of a grazing
// close-up. That frame is settled until the damped controls stop rather than
// pinned to a pose, and the check refuses one the input did not move the camera
// for, so a preset frame cannot be reported as a passed graze; the pose the drag
// lands on is whatever the page's own pointer path reaches, which is a
// neighbouring grazing angle at worst.
//
// Its bounds: one view (`back`) and two rects on it, over three finishes. The
// front, the profiles, the top and bottom ends, the plateau's face and every
// other surface go unmeasured, and a defect outside those two rects is invisible
// here; both bands are flat faces of the `back` view, so this cannot see a
// surface whose normal turns. `--graze` adds one close-up frame and 15 columns of
// one roll. `src/iphone/materials.test.ts` bounds the inputs these ratios are
// built from and runs with no browser; neither gate replaces the other. To look
// at a frame this gate measured, shoot it with `scripts/capture-shots.mjs` (or
// `scripts/sweep-iphone.mjs` for the graze) at 1400x1000.
//
// Usage: node scripts/check-finishes.mjs [--graze[=view:color[:drag=dx,dy[.dx,dy]]]]
//        [--targets a=0.73,b=0.47,c=0.87]     env: SHOT_BASE, SHOT_CHROME
//
// Exit codes: 0 every finish inside ±0.05 of its target and the graze clean;
// 1 the look drifted — a finish out of tolerance, or a dark run found; 2 the
// measurement could not be taken, from no dev server, no Chrome, no
// `window.__shotReady`, a thrown page, a canvas not at 1400x1000, a frame read
// back black, or a graze the input did not move. 1 and 2 are different claims:
// 1 says the look is wrong, 2 says this gate did not run.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env['SHOT_CHROME'] ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env['SHOT_BASE'] ?? 'http://localhost:5199';

// The frame the two bands are written in: `capture-shots.mjs` at 1400x1000
// produced the round-7 numbers, so the rects are absolute pixels of that frame,
// and any other size is refused rather than scaled — scaling would move them onto
// different surfaces and report a different phenomenon.
const WIDTH = 1400;
const HEIGHT = 1000;
const RAIL = { label: 'rail band', x: 496, y: 350, w: 18, h: 90 };
const PANEL = { label: 'panel band', x: 560, y: 400, w: 300, h: 160 };

const FINISHES = ['cosmic-orange', 'deep-blue', 'silver'];
/** Reference rail/panel ratios: gsmr-040 (orange), gsmr-019 (blue), the
 *  colour-lineup photo (silver). `--targets` overrides them. */
const TARGETS = { 'cosmic-orange': 0.73, 'deep-blue': 0.47, silver: 0.87 };
const TOLERANCE = 0.05;

// The grazing frame: the close-up preset dragged 120 px down, which lays the
// plateau's rolled shoulder across the frame at a grazing angle. The scan is
// round 7's — 15 columns 40 px apart, y 60..900 at 2 px steps — and the defect it
// guards was a 26 px run at luma ≤ 3.
const GRAZE_DEFAULT = 'camera-closeup:cosmic-orange:drag=0,120';
const GRAZE_COLUMNS = [420, 460, 500, 540, 580, 620, 660, 700, 740, 780, 820, 860, 900, 940, 980];
const GRAZE_Y0 = 60;
const GRAZE_Y1 = 900;
const GRAZE_STEP = 2;
const GRAZE_DARK = 3;
// The damped controls hold (1 - 0.075) of the drag per rendered frame, so a
// 700 ms settle — what `sweep-iphone.mjs` uses — still carries a few hundredths
// of a pixel of it: two runs at 700 ms differed on 93 pixels (worst channel
// delta 32), while three at 2500 ms were pixel-identical. This gate wants its
// frame to be an artifact, so it settles the longer way.
const SETTLE_MS = 2500;
const READY_TIMEOUT_MS = 30000;

/** The measurement never happened — a harness or environment failure, not a
 *  verdict about the look, which is why it carries its own exit code. */
class DidNotRun extends Error {}
const didNotRun = (message) => new DidNotRun(message);

// ---------------------------------------------------------------- the pixels

/** Inverse sRGB transfer for a byte, so a channel becomes its relative luminance
 *  without a `pow` per pixel. */
const LINEAR = new Float64Array(256);
for (let value = 0; value < 256; value += 1) {
  const channel = value / 255;
  LINEAR[value] = channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of one pixel, 0..1. This is the quantity the ratio is
 *  taken in, and the linearisation is the whole point: the channel bytes name
 *  sRGB, so a ratio of the *encoded* bytes is a different number — silver's rail
 *  would read 0.938 rather than 0.866. */
const relativeLuminance = (r, g, b) => 0.2126 * LINEAR[r] + 0.7152 * LINEAR[g] + 0.0722 * LINEAR[b];

/** A relative luminance written back as the 8-bit luma a viewer reads. */
function luma8(value) {
  const channel = value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, channel)) * 255);
}

/** The longest run of pixels at luma ≤ 3 down any sampled column, and where it
 *  starts. `total` is the pixels actually scanned, so a zero cannot be read off a
 *  scan that never ran. */
function worstDarkRun(columns) {
  let worst = { length: 0, x: -1, y: -1 };
  let dark = 0;
  let minLuma = 255;
  for (let index = 0; index < columns.length; index += 1) {
    let start = -1;
    for (let row = 0; row < columns[index].length; row += 1) {
      const value = luma8(columns[index][row]);
      if (value < minLuma) minLuma = value;
      if (value > GRAZE_DARK) start = -1;
      else {
        if (start < 0) start = row;
        dark += 1;
        const length = row - start + 1;
        if (length > worst.length) worst = { length, x: GRAZE_COLUMNS[index], y: GRAZE_Y0 + row * GRAZE_STEP };
      }
    }
  }
  return { ...worst, dark, total: columns.length * columns[0].length, minLuma };
}

// --------------------------------------------------------------- the readback

/** Runs inside the page: draws the WebGL canvas onto a 2D one and reads the
 *  bytes. `preserveDrawingBuffer` is on for the poster pipeline, so the drawing
 *  buffer is still there to draw from. The page computes no statistic; it hands
 *  back the two bands' channel sums and every sampled column's relative
 *  luminance, and this file does the arithmetic. */
const PAGE_PRELUDE = `
  const linear = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const luminance = (r, g, b) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  const canvas = document.getElementById('stage');
  const flat = canvas === null ? null : document.createElement('canvas');
  if (flat !== null) {
    flat.width = canvas.width;
    flat.height = canvas.height;
    const context = flat.getContext('2d', { willReadFrequently: true });
    context.drawImage(canvas, 0, 0);
  }
  const data = flat === null ? null : flat.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  const at = (x, y) => { const i = (y * canvas.width + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
  const band = (rect) => {
    const sum = { n: 0, r: 0, g: 0, b: 0, luminance: 0 };
    for (let y = rect.y; y < rect.y + rect.h; y += 1) {
      for (let x = rect.x; x < rect.x + rect.w; x += 1) {
        const [r, g, b] = at(x, y);
        sum.n += 1; sum.r += r; sum.g += g; sum.b += b; sum.luminance += luminance(r, g, b);
      }
    }
    return sum;
  };
`;

const FRAME_EXPRESSION = `(() => {${PAGE_PRELUDE}
  if (canvas === null) return JSON.stringify({ canvas: null });
  const columns = ${JSON.stringify(GRAZE_COLUMNS)}.map((x) => {
    const values = [];
    for (let y = ${String(GRAZE_Y0)}; y <= ${String(GRAZE_Y1)}; y += ${String(GRAZE_STEP)}) {
      const [r, g, b] = at(x, y);
      values.push(Number(luminance(r, g, b).toFixed(6)));
    }
    return values;
  });
  const size = { width: canvas.width, height: canvas.height };
  return JSON.stringify({ canvas: size, rail: band(${JSON.stringify(RAIL)}), panel: band(${JSON.stringify(PANEL)}), columns });
})()`;

// ---------------------------------------------------------------- the browser

/** The page's own uncaught exceptions, for the run's "did not run" guard. */
const exceptions = [];

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
async function open(send, url, label) {
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
 */
async function readFrame(send, expected, label) {
  const report = await evaluate(
    send,
    'typeof window.render_game_to_text === "function" ? window.render_game_to_text() : null',
  );
  if (typeof report !== 'string') throw didNotRun(`${label}: the page exposes no window.render_game_to_text(), so the frame it rendered cannot be confirmed`);
  const shown = JSON.parse(report);
  if (shown.color !== expected.color || shown.view !== expected.view) throw didNotRun(`${label}: the page reports color=${String(shown.color)} view=${String(shown.view)} after being asked for ${expected.color}/${expected.view} — the URL's parameters did not take effect`);
  const value = await evaluate(send, FRAME_EXPRESSION);
  if (typeof value !== 'string') throw didNotRun(`${label}: the readback returned nothing`);
  const frame = JSON.parse(value);
  if (frame.canvas === null) throw didNotRun(`${label}: the page has no #stage canvas to read`);
  if (frame.canvas.width !== WIDTH || frame.canvas.height !== HEIGHT) throw didNotRun(`${label}: the canvas is ${String(frame.canvas.width)}x${String(frame.canvas.height)}, not ${String(WIDTH)}x${String(HEIGHT)} — the bands are written in that frame's pixels`);
  return frame;
}

/** The camera's own pose, as `window.__iphone.debug()` reports it. */
async function cameraPose(send) {
  const value = await evaluate(send, 'JSON.stringify(window.__iphone?.debug?.() ?? null)');
  if (typeof value !== 'string') return null;
  const debug = JSON.parse(value);
  if (debug === null || !Array.isArray(debug.camera) || !Array.isArray(debug.target)) return null;
  return [...debug.camera, ...debug.target].map(Number);
}

/** True when the pose moved: same length, any component differing by more than a
 *  thousandth of a millimetre — far under any orbit, far over the rounding. */
function poseChanged(before, after) {
  if (before === null || after === null || before.length !== after.length) return false;
  return before.some((value, index) => Math.abs(value - after[index]) > 0.001);
}

// A drag is the page's real input path — pressed, moved in steps, released —
// never an assigned camera pose, so a frame the controls could not have reached
// cannot be measured as one the scan passed.
async function drag(send, dx, dy) {
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

// ------------------------------------------------------------------- the run

function parseGrazeSpec(spec) {
  const [view = 'camera-closeup', color = 'cosmic-orange', ...input] = spec.split(':');
  const strokes = [];
  for (const part of input) {
    if (!part.startsWith('drag=')) throw didNotRun(`--graze: "${part}" is not a drag=dx,dy input`);
    for (const stroke of part.slice(5).split('.')) {
      const [dx, dy] = stroke.split(',').map(Number);
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw didNotRun(`--graze: "${stroke}" is not a drag=dx,dy stroke`);
      strokes.push([dx, dy]);
    }
  }
  if (strokes.length === 0) throw didNotRun('--graze: the spec asks for no drag, so the frame would be the preset again');
  return { view, color, drag: strokes };
}

function parseArgs(argv) {
  const options = { graze: null, targets: { ...TARGETS } };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--graze' || arg.startsWith('--graze=')) {
      options.graze = parseGrazeSpec(arg === '--graze' ? GRAZE_DEFAULT : arg.slice('--graze='.length));
    } else if (arg === '--targets') {
      const list = argv[(index += 1)];
      if (list === undefined) throw didNotRun('--targets needs a value, as <finish>=<ratio>[,...]');
      for (const entry of list.split(',')) {
        const [finish, number] = entry.split('=');
        if (!FINISHES.includes(finish)) throw didNotRun(`--targets: "${String(finish)}" is not one of ${FINISHES.join(', ')}`);
        const ratio = Number(number);
        if (!Number.isFinite(ratio)) throw didNotRun(`--targets: "${entry}" is not <finish>=<ratio>`);
        options.targets[finish] = ratio;
      }
    } else {
      throw didNotRun(`unknown argument "${arg}"`);
    }
  }
  return options;
}

async function requireServer() {
  let response;
  try {
    response = await fetch(`${BASE}/iphone.html`, { signal: AbortSignal.timeout(5000) });
  } catch (error) {
    throw didNotRun(`no dev server answered at ${BASE} (${error.message}) — start one with "npm run dev", and set SHOT_BASE if it is not on 5199`);
  }
  if (!response.ok) throw didNotRun(`${BASE}/iphone.html answered HTTP ${String(response.status)} — is the dev server serving this repo?`);
  await response.arrayBuffer();
}

/** One finish's `back` frame and its two bands, or a thrown "did not run". */
async function measureFinish(send, finish) {
  const view = 'back';
  exceptions.length = 0;
  await open(send, `${BASE}/iphone.html?shot=1&view=${view}&color=${finish}`, finish);
  const frame = await readFrame(send, { color: finish, view }, finish);
  if (exceptions.length > 0) throw didNotRun(`${finish}: the page threw while rendering the frame — ${exceptions.join(' | ')}`);
  const rail = frame.rail.luminance / frame.rail.n;
  const panel = frame.panel.luminance / frame.panel.n;
  // A black frame divides to NaN, and NaN compares false against every bound —
  // which would read as a failed check rather than as no render at all.
  if (rail < 1e-6 || panel < 1e-6) throw didNotRun(`${finish}: the ${rail < 1e-6 ? RAIL.label : PANEL.label} read back at relative luminance ${String(rail < 1e-6 ? rail : panel)} — the render did not reach the canvas`);
  return { rail: luma8(rail), panel: luma8(panel), ratio: rail / panel };
}

/** The grazing close-up, driven through the page's real input, and its scan. */
async function measureGraze(send, graze) {
  const label = `graze ${graze.view}:${graze.color}`;
  exceptions.length = 0;
  await open(send, `${BASE}/iphone.html?shot=1&view=${graze.view}&color=${graze.color}`, label);
  const before = await cameraPose(send);
  if (before === null) throw didNotRun(`${label}: the page exposes no window.__iphone.debug(), so the input's effect cannot be confirmed`);
  for (const [dx, dy] of graze.drag) await drag(send, dx, dy);
  await new Promise((done) => setTimeout(done, SETTLE_MS));
  const after = await cameraPose(send);
  const where = after === null ? 'an unreadable pose' : after.slice(0, 3).join(', ');
  if (!poseChanged(before, after)) throw didNotRun(`${label}: the camera is still at ${where} after the input, so this frame is the preset and not the grazing view the scan claims`);
  const frame = await readFrame(send, { color: graze.color, view: graze.view }, label);
  if (exceptions.length > 0) throw didNotRun(`${label}: the page threw while rendering the frame — ${exceptions.join(' | ')}`);
  return { label, run: worstDarkRun(frame.columns) };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(CHROME)) throw didNotRun(`no Chrome at ${CHROME} — install it or point SHOT_CHROME at the binary`);
  await requireServer();

  const port = 9300 + Math.floor(Math.random() * 400);
  const profile = join(tmpdir(), `iphone-finishes-${randomUUID()}`);
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

    console.log(
      `check:finishes — ${String(WIDTH)}x${String(HEIGHT)} back view; ${RAIL.label} x ${String(RAIL.x)} y ${String(RAIL.y)} ${String(RAIL.w)}x${String(RAIL.h)} ÷ ${PANEL.label} x ${String(PANEL.x)} y ${String(PANEL.y)} ${String(PANEL.w)}x${String(PANEL.h)}; mean relative luminance; tolerance ±${String(TOLERANCE)}\n`,
    );
    console.log(
      'finish'.padEnd(16) + 'rail luma'.padEnd(12) + 'panel luma'.padEnd(13) + 'ratio'.padEnd(9) + 'target'.padEnd(9) + 'delta'.padEnd(10) + 'result',
    );

    const failures = [];
    for (const finish of FINISHES) {
      const measured = await measureFinish(send, finish);
      const target = options.targets[finish];
      const delta = measured.ratio - target;
      const passed = Math.abs(delta) <= TOLERANCE;
      console.log(
        finish.padEnd(16) +
          String(measured.rail).padEnd(12) +
          String(measured.panel).padEnd(13) +
          measured.ratio.toFixed(3).padEnd(9) +
          target.toFixed(3).padEnd(9) +
          `${delta >= 0 ? '+' : ''}${delta.toFixed(3)}`.padEnd(10) +
          (passed ? 'pass' : 'FAIL'),
      );
      if (!passed) {
        failures.push(
          `${finish}: ${RAIL.label} (x ${String(RAIL.x)}, y ${String(RAIL.y)}, ${String(RAIL.w)}x${String(RAIL.h)}) ÷ ${PANEL.label} (x ${String(PANEL.x)}, y ${String(PANEL.y)}, ${String(PANEL.w)}x${String(PANEL.h)}) = ${measured.ratio.toFixed(3)}, target ${target.toFixed(3)} ±${String(TOLERANCE)}, delta ${delta >= 0 ? '+' : ''}${delta.toFixed(3)}`,
        );
      }
    }

    if (options.graze !== null) {
      const graze = await measureGraze(send, options.graze);
      const { length, x, y, dark, total, minLuma } = graze.run;
      console.log(
        `\n${graze.label} drag ${options.graze.drag.map((stroke) => stroke.join(',')).join('.')} — worst run of luma ≤ ${String(GRAZE_DARK)}: ${String(length)} px${x >= 0 ? ` at x=${String(x)} y=${String(y)}` : ''}; pixels ≤ ${String(GRAZE_DARK)}: ${String(dark)}/${String(total)}; darkest luma ${String(minLuma)}`,
      );
      if (length > 0) {
        failures.push(
          `${graze.label}: the plateau's roll has a ${String(length)} px run of luma ≤ ${String(GRAZE_DARK)} starting at x=${String(x)} y=${String(y)}, over ${String(GRAZE_COLUMNS.length)} columns of y ${String(GRAZE_Y0)}..${String(GRAZE_Y1)} step ${String(GRAZE_STEP)} — the anisotropy defect was a 26 px run`,
        );
      }
    }

    console.log('');
    if (failures.length > 0) {
      console.error(`check:finishes FAILED — ${failures.join('; ')}`);
      return 1;
    }
    const finishes = FINISHES.map((finish) => `${finish} ${options.targets[finish].toFixed(2)}`).join(', ');
    console.log(`check:finishes OK — ${finishes}${options.graze === null ? '' : ', and no run of luma ≤ 3 along the sampled roll'}`);
    return 0;
  } finally {
    chrome.kill();
  }
}

try {
  process.exitCode = await main();
} catch (error) {
  if (error instanceof DidNotRun) console.error(`check:finishes DID NOT RUN — ${error.message}`);
  else console.error(`check:finishes DID NOT RUN — ${error instanceof Error ? error.stack : String(error)}`);
  process.exitCode = 2;
}
