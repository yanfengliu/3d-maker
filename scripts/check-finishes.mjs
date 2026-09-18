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
// What it proves: the one look number the finishes were fitted to, and the port's
// read. On the 1400x1000 `back` view, the mean relative luminance of the rail band
// over the panel band's, for all three finishes, each inside ±0.05 of its
// reference. With `--graze` it also proves the plateau's rolled shoulder renders
// without a black band — the defect was a 26 px run of luma ≤ 3 — over 15 columns
// of a grazing close-up. That frame is settled until the damped controls stop
// rather than pinned to a pose, and the check refuses one the input did not move
// the camera for, so a preset frame cannot be reported as a passed graze; the pose
// the drag lands on is whatever the page's own pointer path reaches, which is a
// neighbouring grazing angle at worst.
//
// The port section (`bottom` preset, cosmic-orange) runs with those checks and
// reads the same canvas back through three named rects of that frame — the one
// preset that looks into the USB-C mouth, since the phone floats 25 mm up and
// `views.ts` aims at the bottom edge from 17 degrees below the front face:
//
//   pocket  x 640 y 470 100x8   mean luma ≤ 25       accepted build 11.0
//   tongue  x 650 y 483  80x3   mean luma 25..70     accepted build 45.3–45.5
//   rail    x 630 y 496 120x8   mean luma 70..200    accepted build 104.7
//
// and then that the pocket sits at least 15 below the tongue and the tongue at
// least 25 below the rail, so the ordering is asserted rather than left implied
// by the bands. The rail is the reference the tongue's band is stated against,
// which is why it is bounded too: a rect that stopped landing on the aluminium
// would leave the tongue's "below the rail" claim with nothing to be below. Those
// are the two facts the port's read is made of — the aperture is dark, and the
// tongue inside it is a detail and not a highlight — and the defect behind the
// second is a real one: the tongue's pre-round-9 light steel (`0xa9aeb6` at
// metalness 1) rendered 111 luma over that strip, brighter than the rail it is
// cut into, which is a floating jewel rather than a connector. Putting that
// albedo back on the live mesh — a CDP hook that recoloured `port-tongue`'s
// material without touching a file — read 146.3 luma over the strip where the
// accepted build reads 45.3 to 45.5, and failed both the band and the ordering at
// exit 1; 146.3 is above the 111 `materials.test.ts` records because only the
// albedo was restored, leaving the roughness and metalness the retune set. Each
// rect is placed strictly inside its surface, because a rect that straddles an
// edge measures the edge: the tongue is 3 px of a strip whose top edge moves by
// about a pixel between Chrome runs, and a rect including that edge moved between
// 36 and 44 luma across runs.
//
// Its bounds: one view (`back`) with two rects on it over three finishes, plus one
// frame (`bottom` on cosmic-orange) with three rects of the port. The front, the
// profiles, the top end, the plateau's face and every other surface go unmeasured,
// and a defect outside those rects is invisible here; the `back` bands are flat
// faces, so this cannot see a surface whose normal turns. `--graze` adds one
// close-up frame and 15 columns of one roll. The port section measures a read and
// not a shape: it cannot see whether the aperture's corners are the documented
// radius, nor whether its outline is a rounded rectangle at all, nor where the
// tongue sits inside the mouth — `src/iphone/aperture.test.ts` is that half of the
// same contract, and `src/iphone/port.test.ts` the through-cut and the tongue's
// sightline, both without a browser. It also reads one finish: cosmic-orange is
// the colorway the strip was fitted on, so a tongue that stayed a detail there and
// went bright on the other two would pass. `src/iphone/materials.test.ts` bounds
// the inputs these reads are built from — the ratio's materials, and the tongue's
// albedo pin over `x 640 y 480 100x4` of the `bottom:cosmic-orange:wheel=-2` sweep
// frame, which is the same strip one zoom closer — and neither gate replaces the
// other. To look at a frame this gate measured, shoot it with
// `scripts/capture-shots.mjs` (or `scripts/sweep-iphone.mjs` for the graze) at
// 1400x1000.
//
// Usage: node scripts/check-finishes.mjs [--graze[=view:color[:drag=dx,dy[.dx,dy]]]]
//        [--targets a=0.73,b=0.47,c=0.87]     env: SHOT_BASE, SHOT_CHROME
// The port section has no flag: it is on for every run, because the read it bounds
// had no bound at all before it, and a section behind a flag is one the next
// defect can hide behind.
//
// Exit codes: 0 every finish inside ±0.05 of its target, the port's three rects
// inside their bands with the ordering held, and the graze clean; 1 a surface
// drifted — a finish out of tolerance, a dark run found, or a port rect out of
// band; 2 the measurement could not be taken, from no dev server, no Chrome, no
// `window.__shotReady`, a thrown page, a canvas not at 1400x1000, a frame or a
// port rect read back black, or a graze the input did not move. 1 and 2 are
// different claims: 1 says a surface is wrong, 2 says this gate did not run.
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

// The port section's frame and rects. `bottom` on cosmic-orange is the one preset
// that looks into the USB-C mouth, and the three rects are absolute pixels of that
// 1400x1000 frame: the pocket behind the aperture, the tongue strip inside it and
// the rail the mouth is cut into. Every one sits strictly inside its surface — see
// the header on why the tongue's 3 px are not the 4 px `materials.test.ts` names.
const PORT_VIEW = 'bottom';
const PORT_COLOR = 'cosmic-orange';
const PORT_RECTS = {
  pocket: { label: 'pocket', x: 640, y: 470, w: 100, h: 8 },
  tongue: { label: 'tongue', x: 650, y: 483, w: 80, h: 3 },
  rail: { label: 'rail', x: 630, y: 496, w: 120, h: 8 },
};

/** The port's bands, as literals with the accepted build's measurement behind
 *  each one. The rows the pocket and the tongue are read on are flat: over four
 *  runs the pocket rect read 11.0 luma on every one of its 800 pixels and the rail
 *  104.7 on every one of its 960, and the tongue moved only between 45.3 and 45.5,
 *  so the bands are headroom for a pose the preset lands a pixel off rather than
 *  tolerance for the surface itself. `TONGUE_CEILING` is `0.67` of the rail's own
 *  luma, and the pre-round-9 tongue's 111 sits 41 above it. */
const POCKET_CEILING = 25; // accepted build 11.0
const TONGUE_FLOOR = 25; // accepted build 45.3–45.5
const TONGUE_CEILING = 70; // accepted build 45.3–45.5; the light steel's 111 is the defect this catches
const RAIL_FLOOR = 70; // accepted build 104.7
const RAIL_CEILING = 200; // the rail is the tongue's upper reference, so it is bounded too
/** How far the tongue must sit above the pocket and below the rail. The first is
 *  the pocket's own ceiling less its value; the second is stated by the class —
 *  a detail is well under the metal it is cut into, not a few luma under it. */
const TONGUE_ABOVE_POCKET = 15;
const TONGUE_BELOW_RAIL = 25;

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

/** A relative luminance written back as the 8-bit luma a viewer reads, before the
 *  rounding: the port's bands are stated on the value, and its rects are flat
 *  enough that the decimal carries the pose rather than noise. */
function luma8Value(value) {
  const channel = value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.min(1, Math.max(0, channel)) * 255;
}

/** The same, rounded to the byte a viewer reads: what the `back` table and the
 *  graze scan compare and print. */
const luma8 = (value) => Math.round(luma8Value(value));

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

/** The port section's readback: the same canvas, the same page-side `band`, three
 *  rects of the `bottom` frame instead of the `back` one's two and the columns.
 *  The page computes no statistic here either — it hands back each rect's channel
 *  sums and this file does the arithmetic. */
const PORT_EXPRESSION = `(() => {${PAGE_PRELUDE}
  if (canvas === null) return JSON.stringify({ canvas: null });
  const size = { width: canvas.width, height: canvas.height };
  return JSON.stringify({
    canvas: size,
    pocket: band(${JSON.stringify(PORT_RECTS.pocket)}),
    tongue: band(${JSON.stringify(PORT_RECTS.tongue)}),
    rail: band(${JSON.stringify(PORT_RECTS.rail)}),
  });
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
 * `expression` is the section's own readback — the `back` view's two bands and
 * columns by default, the port section's three rects for that frame.
 */
async function readFrame(send, expected, label, expression = FRAME_EXPRESSION) {
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

/** The port's read on the `bottom` preset: each named rect's mean luma, or a
 *  thrown "did not run". The rects are the measurement's whole instrument, so a
 *  rect the render never reached — which reads black, and would divide to the
 *  same zero a missing canvas does — is a harness failure here and not a verdict
 *  about the port. */
async function measurePort(send) {
  const label = `port ${PORT_VIEW}:${PORT_COLOR}`;
  exceptions.length = 0;
  await open(send, `${BASE}/iphone.html?shot=1&view=${PORT_VIEW}&color=${PORT_COLOR}`, label);
  const frame = await readFrame(send, { color: PORT_COLOR, view: PORT_VIEW }, label, PORT_EXPRESSION);
  if (exceptions.length > 0) throw didNotRun(`${label}: the page threw while rendering the frame — ${exceptions.join(' | ')}`);
  const measured = {};
  for (const [key, rect] of Object.entries(PORT_RECTS)) {
    const where = `${rect.label} (x ${String(rect.x)} y ${String(rect.y)} ${String(rect.w)}x${String(rect.h)})`;
    const mean = frame[key].luminance / frame[key].n;
    // A black rect divides to a zero and a rect the readback missed to NaN, and
    // NaN compares false against every band — which would read as a drifted
    // surface rather than as no measurement at all.
    if (!Number.isFinite(mean) || mean < 1e-6) throw didNotRun(`${label}: the ${where} read back ${Number.isFinite(mean) ? 'black' : 'nothing'} — the render did not reach the canvas there`);
    measured[key] = luma8Value(mean);
  }
  return measured;
}

/** The port's three rects as one line of the header the section prints. */
function portRectList() {
  return Object.values(PORT_RECTS)
    .map((rect) => `${rect.label} x ${String(rect.x)} y ${String(rect.y)} ${String(rect.w)}x${String(rect.h)}`)
    .join('; ');
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

    // The port section: `bottom` on cosmic-orange, the one preset that looks into
    // the USB-C mouth, read back through the three named rects of that frame.
    const reading = await measurePort(send);
    const where = (key) => {
      const rect = PORT_RECTS[key];
      return `x ${String(rect.x)} y ${String(rect.y)} ${String(rect.w)}x${String(rect.h)}`;
    };
    console.log(`\nport — ${PORT_VIEW}:${PORT_COLOR} preset; mean luma of three named rects of the ${String(WIDTH)}x${String(HEIGHT)} frame — ${portRectList()}`);
    console.log('surface'.padEnd(10) + 'rect'.padEnd(26) + 'luma'.padEnd(9) + 'band'.padEnd(20) + 'result');
    /** The port's three checks. A failure names the surface, its rect, the value
     *  it read and the band it left, because a reader has to be able to tell a
     *  drifted surface from a rect that moved onto another one. */
    const portRows = [
      {
        surface: 'pocket',
        value: reading.pocket,
        band: `≤ ${String(POCKET_CEILING)}`,
        inside: reading.pocket <= POCKET_CEILING,
        drift: (rect) =>
          `the aperture's pocket at ${rect} reads luma ${reading.pocket.toFixed(1)}, so the mouth is not the dark recess it is read as (the accepted build reads 11.0)`,
      },
      {
        surface: 'tongue',
        value: reading.tongue,
        band: `${String(TONGUE_FLOOR)}..${String(TONGUE_CEILING)}`,
        inside: reading.tongue >= TONGUE_FLOOR && reading.tongue <= TONGUE_CEILING,
        drift: (rect) =>
          `the tongue strip at ${rect} reads luma ${reading.tongue.toFixed(1)}, so it is a highlight or no detail at all rather than the connector inside the pocket (the accepted build reads 45.3 to 45.5, and the pre-round-9 light steel read 111)`,
      },
      {
        surface: 'rail',
        value: reading.rail,
        band: `${String(RAIL_FLOOR)}..${String(RAIL_CEILING)}`,
        inside: reading.rail >= RAIL_FLOOR && reading.rail <= RAIL_CEILING,
        drift: (rect) =>
          `the rail beside the mouth at ${rect} reads luma ${reading.rail.toFixed(1)}, so the reference the tongue's band is stated against is not on the aluminium (the accepted build reads 104.7)`,
      },
    ];
    for (const row of portRows) {
      console.log(row.surface.padEnd(10) + where(row.surface).padEnd(26) + row.value.toFixed(1).padEnd(9) + row.band.padEnd(20) + (row.inside ? 'pass' : 'FAIL'));
      if (!row.inside) failures.push(`${PORT_VIEW}:${PORT_COLOR} — ${row.drift(where(row.surface))}, outside ${row.band}`);
    }
    // And the ordering the bands only imply: the tongue above the pocket and
    // below the rail by stated margins, so a build that moved all three together
    // cannot pass by keeping each inside its own band.
    const abovePocket = reading.tongue - reading.pocket;
    const belowRail = reading.rail - reading.tongue;
    const ordered = abovePocket >= TONGUE_ABOVE_POCKET && belowRail >= TONGUE_BELOW_RAIL;
    console.log(
      `order — pocket ${reading.pocket.toFixed(1)} < tongue ${reading.tongue.toFixed(1)} < rail ${reading.rail.toFixed(1)}; tongue − pocket ${abovePocket.toFixed(1)} ≥ ${String(TONGUE_ABOVE_POCKET)}, rail − tongue ${belowRail.toFixed(1)} ≥ ${String(TONGUE_BELOW_RAIL)}: ${ordered ? 'pass' : 'FAIL'}`,
    );
    if (!ordered) {
      failures.push(
        `${PORT_VIEW}:${PORT_COLOR} — the tongue at ${where('tongue')} reads luma ${reading.tongue.toFixed(1)}, ${abovePocket.toFixed(1)} above the pocket at ${where('pocket')} and ${belowRail.toFixed(1)} below the rail at ${where('rail')}; the band is ≥ ${String(TONGUE_ABOVE_POCKET)} above the pocket and ≥ ${String(TONGUE_BELOW_RAIL)} below the rail`,
      );
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
    const portSummary = `the port on ${PORT_COLOR} reading pocket ${reading.pocket.toFixed(1)} / tongue ${reading.tongue.toFixed(1)} / rail ${reading.rail.toFixed(1)} luma`;
    console.log(
      `check:finishes OK — ${finishes}, and ${portSummary}${options.graze === null ? '' : ', and no run of luma ≤ 3 along the sampled roll'}`,
    );
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
