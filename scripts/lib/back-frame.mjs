// The `back` preset's frame, as one readback: the ratio section's rail and panel
// bands and the 15 columns the graze scan samples. Two sections share it — the
// ratio takes the bands and ignores the columns, the graze takes the columns and
// ignores the bands — because it is one `getImageData` of one frame either way,
// and `scripts/lib/shot-pixels.mjs` builds the page-side expression.
import { frameExpression } from './shot-pixels.mjs';

// The two band rects are absolute pixels of the 1400x1000 frame, and the ratio
// the first section is built on is the rail band's mean relative luminance over
// the panel band's.
export const RAIL = { label: 'rail band', x: 496, y: 350, w: 18, h: 90 };
export const PANEL = { label: 'panel band', x: 560, y: 400, w: 300, h: 160 };

// The grazing scan's grid is round 7's — 15 columns 40 px apart, y 60..900 at
// 2 px steps — and the defect it guards was a 26 px run at luma ≤ 3.
export const GRAZE_COLUMNS = [420, 460, 500, 540, 580, 620, 660, 700, 740, 780, 820, 860, 900, 940, 980];
export const GRAZE_Y0 = 60;
export const GRAZE_Y1 = 900;
export const GRAZE_STEP = 2;

/** The one readback of a `back` frame, built once at load: the two band sums and
 *  every sampled column's relative luminance. */
export const FRAME_EXPRESSION = frameExpression({
  rail: RAIL,
  panel: PANEL,
  columns: GRAZE_COLUMNS,
  y0: GRAZE_Y0,
  y1: GRAZE_Y1,
  step: GRAZE_STEP,
});
