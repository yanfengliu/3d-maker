// The `--graze` section: it proves the plateau's rolled shoulder renders without
// a black band — the defect was a 26 px run of luma ≤ 3 — over 15 columns of a
// grazing close-up. That frame is settled until the damped controls stop rather
// than pinned to a pose, and the check refuses one the input did not move the
// camera for, so a preset frame cannot be reported as a passed graze; the pose
// the drag lands on is whatever the page's own pointer path reaches, which is a
// neighbouring grazing angle at worst.
import { exceptions, didNotRun, open, cameraPose, poseChanged, drag, readFrame, shotUrl } from './shot-cdp.mjs';
import { FRAME_EXPRESSION, GRAZE_COLUMNS, GRAZE_STEP, GRAZE_Y0, GRAZE_Y1 } from './back-frame.mjs';
import { luma8 } from './shot-pixels.mjs';

/** The default `--graze` spec: the close-up preset dragged 120 px down, which
 *  lays the plateau's rolled shoulder across the frame at a grazing angle. */
export const GRAZE_DEFAULT = 'camera-closeup:cosmic-orange:drag=0,120';
const GRAZE_DARK = 3;
// The damped controls hold (1 - 0.075) of the drag per rendered frame, so a
// 700 ms settle — what `sweep-iphone.mjs` uses — still carries a few hundredths
// of a pixel of it: two runs at 700 ms differed on 93 pixels (worst channel
// delta 32), while three at 2500 ms were pixel-identical. This gate wants its
// frame to be an artifact, so it settles the longer way.
const SETTLE_MS = 2500;

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

/** The grazing close-up, driven through the page's real input, and its scan. */
async function measureGraze(send, graze) {
  const label = `graze ${graze.view}:${graze.color}`;
  exceptions.length = 0;
  await open(send, shotUrl(graze.view, graze.color), label);
  const before = await cameraPose(send);
  if (before === null) throw didNotRun(`${label}: the page exposes no window.__iphone.debug(), so the input's effect cannot be confirmed`);
  for (const [dx, dy] of graze.drag) await drag(send, dx, dy);
  await new Promise((done) => setTimeout(done, SETTLE_MS));
  const after = await cameraPose(send);
  const where = after === null ? 'an unreadable pose' : after.slice(0, 3).join(', ');
  if (!poseChanged(before, after)) throw didNotRun(`${label}: the camera is still at ${where} after the input, so this frame is the preset and not the grazing view the scan claims`);
  const frame = await readFrame(send, { color: graze.color, view: graze.view }, label, FRAME_EXPRESSION);
  if (exceptions.length > 0) throw didNotRun(`${label}: the page threw while rendering the frame — ${exceptions.join(' | ')}`);
  return { label, run: worstDarkRun(frame.columns) };
}

/** Shoots the grazing frame, prints its scan, and pushes any dark run onto
 *  `failures`. */
export async function runGraze(send, graze, failures) {
  const measured = await measureGraze(send, graze);
  const { length, x, y, dark, total, minLuma } = measured.run;
  console.log(
    `\n${measured.label} drag ${graze.drag.map((stroke) => stroke.join(',')).join('.')} — worst run of luma ≤ ${String(GRAZE_DARK)}: ${String(length)} px${x >= 0 ? ` at x=${String(x)} y=${String(y)}` : ''}; pixels ≤ ${String(GRAZE_DARK)}: ${String(dark)}/${String(total)}; darkest luma ${String(minLuma)}`,
  );
  if (length > 0) {
    failures.push(
      `${measured.label}: the plateau's roll has a ${String(length)} px run of luma ≤ ${String(GRAZE_DARK)} starting at x=${String(x)} y=${String(y)}, over ${String(GRAZE_COLUMNS.length)} columns of y ${String(GRAZE_Y0)}..${String(GRAZE_Y1)} step ${String(GRAZE_STEP)} — the anisotropy defect was a 26 px run`,
    );
  }
}
