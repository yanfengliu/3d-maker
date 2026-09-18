// The look gate: renders each of the iPhone viewer's three finishes, reads the
// pixels back, and fails when the look has drifted off the values round 7
// measured it to.
//
// This file is the entry point: argument parsing, the order the four sections
// run in, the one failure list they share, and the exit codes. The sections and
// the plumbing they run on are the modules under `scripts/lib/`, and each
// module's own header carries the rects, the bands and the measurements behind
// what it owns:
//
//   finish-ratio.mjs  the `back` view's rail-over-panel ratio, all three finishes
//   port.mjs          the `bottom` view's USB-C port, three named rects
//   glass.mjs         the cover glass on `front`, `right` and `left`
//   graze.mjs         the `--graze` close-up of the plateau's roll
//   back-frame.mjs    the one `back`-frame readback the ratio and the graze share
//   shot-cdp.mjs      headless Chrome over CDP, the page session and the readback
//   shot-pixels.mjs   the luma arithmetic and the page-side readbacks
//
// What it needs is what `shot-cdp.mjs` documents and sets up: a running dev
// server (`SHOT_BASE`, default `http://localhost:5199`) and Chrome
// (`SHOT_CHROME`). No package is added.
//
// Its bounds: one view (`back`) with two rects on it over three finishes, one
// frame (`bottom` on cosmic-orange) with three rects of the port, and three
// frames (`front`, `right`, `left`) with one rect of the cover glass each. The
// glass at every other angle, the bezel, the Dynamic Island and the hairline
// reveal around them go unmeasured — the island sits in two rects' top rows and
// carries the `right`'s p95 by accident, and nothing bounds it — as do the top end, the plateau's face and
// every other surface, and a defect outside those rects is invisible here; the
// `back` bands are flat faces, so this cannot see a surface whose normal turns.
// `--graze` adds one close-up frame and 15 columns of one roll. The port section
// measures a read and not a shape: it cannot see whether the aperture's corners
// are the documented radius, nor whether its outline is a rounded rectangle at
// all, nor where the tongue sits inside the mouth — `src/iphone/aperture.test.ts`
// is that half of the same contract, and `src/iphone/port.test.ts` the through-cut
// and the tongue's sightline, both without a browser. Both of those sections also
// read one finish: cosmic-orange is the colorway the strip and the glass were
// fitted on, so a tongue or a cover glass that stayed right there and went wrong
// on the other two would pass. `src/iphone/materials.test.ts` bounds the inputs
// these reads are built from — the ratio's materials, and the tongue's albedo pin
// over `x 640 y 480 100x4` of the `bottom:cosmic-orange:wheel=-2` sweep frame,
// which is the same strip one zoom closer — and neither gate replaces the other.
// To look at a frame this gate measured, shoot it with
// `scripts/capture-shots.mjs` (or `scripts/sweep-iphone.mjs` for the graze) at
// 1400x1000.
//
// Usage: node scripts/check-finishes.mjs [--graze[=view:color[:drag=dx,dy[.dx,dy]]]]
//        [--targets a=0.73,b=0.47,c=0.87]     env: SHOT_BASE, SHOT_CHROME
// The port section has no flag: it is on for every run, because the read it bounds
// had no bound at all before it, and a section behind a flag is one the next
// defect can hide behind. The glass section is on for the same reason, and costs
// three more frames in the same run.
//
// Exit codes: 0 every finish inside ±0.05 of its target, the port's three rects
// inside their bands with the ordering held, the glass's three medians inside
// 45..85 with both bounded spreads at or above 70, and the graze clean; 1 a
// surface drifted — a finish out of tolerance, a dark run found, a port rect out
// of band, or a glass median out of its band or a bounded spread under its floor;
// 2 the measurement could not be taken, from no dev server, no Chrome, no
// `window.__shotReady`, a thrown page, a canvas not at 1400x1000, a frame or a
// port or glass rect read back black on every pixel, or a graze the input did not
// move. 1 and 2 are different claims: 1 says a surface is wrong, 2 says this gate
// did not run. A glass rect whose median reads 0 while its neighbours do not is a
// drifted read and exit 1, not a failed measurement.
import { existsSync } from 'node:fs';
import { CHROME, DidNotRun, didNotRun, openBrowser, requireServer } from './lib/shot-cdp.mjs';
import { runFinishRatio } from './lib/finish-ratio.mjs';
import { PORT_COLOR, runPort } from './lib/port.mjs';
import { runGlass } from './lib/glass.mjs';
import { GRAZE_DEFAULT, runGraze } from './lib/graze.mjs';

const FINISHES = ['cosmic-orange', 'deep-blue', 'silver'];
/** Reference rail/panel ratios: gsmr-040 (orange), gsmr-019 (blue), the
 *  colour-lineup photo (silver). `--targets` overrides them. */
const TARGETS = { 'cosmic-orange': 0.73, 'deep-blue': 0.47, silver: 0.87 };

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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(CHROME)) throw didNotRun(`no Chrome at ${CHROME} — install it or point SHOT_CHROME at the binary`);
  await requireServer();

  const { chrome, send } = await openBrowser();

  try {
    const failures = [];
    await runFinishRatio(send, { finishes: FINISHES, targets: options.targets, failures });
    const reading = await runPort(send, failures);
    const glass = await runGlass(send, failures);
    if (options.graze !== null) await runGraze(send, options.graze, failures);

    console.log('');
    if (failures.length > 0) {
      console.error(`check:finishes FAILED — ${failures.join('; ')}`);
      return 1;
    }
    const finishes = FINISHES.map((finish) => `${finish} ${options.targets[finish].toFixed(2)}`).join(', ');
    const portSummary = `the port on ${PORT_COLOR} reading pocket ${reading.pocket.toFixed(1)} / tongue ${reading.tongue.toFixed(1)} / rail ${reading.rail.toFixed(1)} luma`;
    const glassSummary = `the glass reading ${glass
      .map((face) => `${face.view} median ${face.median.toFixed(1)} luma${face.spreadFloor === null ? ' with no spread bound' : ` with a ${face.spread.toFixed(1)} spread`}`)
      .join(', ')}`;
    console.log(
      `check:finishes OK — ${finishes}, and ${portSummary}, and ${glassSummary}${options.graze === null ? '' : ', and no run of luma ≤ 3 along the sampled roll'}`,
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
