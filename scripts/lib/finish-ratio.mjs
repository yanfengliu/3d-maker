// The ratio section: the `back` view's mean relative luminance of the rail band
// over the panel band's, for all three finishes, each inside ±0.05 of its
// reference — the one look number the finishes were fitted to, measured on the
// accepted frame `scripts/capture-shots.mjs` shoots at 1400x1000.
import { HEIGHT, WIDTH, exceptions, didNotRun, open, readFrame, shotUrl } from './shot-cdp.mjs';
import { FRAME_EXPRESSION, PANEL, RAIL } from './back-frame.mjs';
import { luma8 } from './shot-pixels.mjs';

const TOLERANCE = 0.05;

/** One finish's `back` frame and its two bands, or a thrown "did not run". */
async function measureFinish(send, finish) {
  const view = 'back';
  exceptions.length = 0;
  await open(send, shotUrl(view, finish), finish);
  const frame = await readFrame(send, { color: finish, view }, finish, FRAME_EXPRESSION);
  if (exceptions.length > 0) throw didNotRun(`${finish}: the page threw while rendering the frame — ${exceptions.join(' | ')}`);
  const rail = frame.rail.luminance / frame.rail.n;
  const panel = frame.panel.luminance / frame.panel.n;
  // A black frame divides to NaN, and NaN compares false against every bound —
  // which would read as a failed check rather than as no render at all.
  if (rail < 1e-6 || panel < 1e-6) throw didNotRun(`${finish}: the ${rail < 1e-6 ? RAIL.label : PANEL.label} read back at relative luminance ${String(rail < 1e-6 ? rail : panel)} — the render did not reach the canvas`);
  return { rail: luma8(rail), panel: luma8(panel), ratio: rail / panel };
}

/** Measures all three finishes, prints the section, and pushes any drift onto
 *  `failures` — the run's shared list, in the order the sections run. */
export async function runFinishRatio(send, { finishes, targets, failures }) {
  console.log(
    `check:finishes — ${String(WIDTH)}x${String(HEIGHT)} back view; ${RAIL.label} x ${String(RAIL.x)} y ${String(RAIL.y)} ${String(RAIL.w)}x${String(RAIL.h)} ÷ ${PANEL.label} x ${String(PANEL.x)} y ${String(PANEL.y)} ${String(PANEL.w)}x${String(PANEL.h)}; mean relative luminance; tolerance ±${String(TOLERANCE)}\n`,
  );
  console.log(
    'finish'.padEnd(16) + 'rail luma'.padEnd(12) + 'panel luma'.padEnd(13) + 'ratio'.padEnd(9) + 'target'.padEnd(9) + 'delta'.padEnd(10) + 'result',
  );

  for (const finish of finishes) {
    const measured = await measureFinish(send, finish);
    const target = targets[finish];
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
}
