// The gate's arithmetic on the pixels it reads back, and the page-side code that
// hands them over. Nothing here knows what any section bounds: each builder takes
// that section's rects and columns, the page returns channel sums or raw samples
// and never a statistic, and the numbers the gate prints are computed from those
// bytes here.
//
// Two luma quantities are in play and they are not the same one. `luma8` is the
// 8-bit value a viewer reads — BT.709 weights of the sRGB bytes — and it is what
// the ratio table, the port's bands and the graze scan compare and print.
// `luma8Value` is the same before the rounding. The page-side `luminance()` in
// the prelude instead linearises each byte first, and the two agree only on a
// neutral pixel: silver's rail reads 0.938 encoded rather than 0.866 linearised.

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
export const relativeLuminance = (r, g, b) => 0.2126 * LINEAR[r] + 0.7152 * LINEAR[g] + 0.0722 * LINEAR[b];

/** A relative luminance written back as the 8-bit luma a viewer reads, before the
 *  rounding: the port's bands are stated on the value, and its rects are flat
 *  enough that the decimal carries the pose rather than noise. */
export function luma8Value(value) {
  const channel = value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.min(1, Math.max(0, channel)) * 255;
}

/** The same, rounded to the byte a viewer reads: what the `back` table and the
 *  graze scan compare and print. */
export const luma8 = (value) => Math.round(luma8Value(value));

/** Runs inside the page: draws the WebGL canvas onto a 2D one and reads the
 *  bytes. `preserveDrawingBuffer` is on for the poster pipeline, so the drawing
 *  buffer is still there to draw from. The page computes no statistic; it hands
 *  back channel sums and raw samples, and this file does the arithmetic. */
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

/** The `back` view's readback: two named bands' channel sums and every sampled
 *  column's relative luminance — the one readback the ratio section's two bands
 *  and the graze scan's 15 columns both come out of. */
export function frameExpression({ rail, panel, columns, y0, y1, step }) {
  return `(() => {${PAGE_PRELUDE}
  if (canvas === null) return JSON.stringify({ canvas: null });
  const columns = ${JSON.stringify(columns)}.map((x) => {
    const values = [];
    for (let y = ${String(y0)}; y <= ${String(y1)}; y += ${String(step)}) {
      const [r, g, b] = at(x, y);
      values.push(Number(luminance(r, g, b).toFixed(6)));
    }
    return values;
  });
  const size = { width: canvas.width, height: canvas.height };
  return JSON.stringify({ canvas: size, rail: band(${JSON.stringify(rail)}), panel: band(${JSON.stringify(panel)}), columns });
})()`;
}

/** The port section's readback: the same canvas, the same page-side `band`, three
 *  rects of the `bottom` frame instead of the `back` one's two and the columns.
 *  The page computes no statistic here either — it hands back each rect's channel
 *  sums and this file does the arithmetic. */
export function portExpression(rects) {
  return `(() => {${PAGE_PRELUDE}
  if (canvas === null) return JSON.stringify({ canvas: null });
  const size = { width: canvas.width, height: canvas.height };
  return JSON.stringify({
    canvas: size,
    pocket: band(${JSON.stringify(rects.pocket)}),
    tongue: band(${JSON.stringify(rects.tongue)}),
    rail: band(${JSON.stringify(rects.rail)}),
  });
})()`;
}

/** The glass section's readback: every pixel of one rect as BT.709 luma of the
 *  sRGB bytes, because the bounds are on percentiles and a mean cannot give one
 *  back. The page still computes no statistic — it hands back the samples in
 *  rect order and this file sorts them — and the weights are the accepted
 *  instrument's, so this is deliberately not the prelude's `luminance()`, which
 *  linearises the bytes: the two agree only on a neutral pixel. A rect that
 *  leaves the canvas is refused here rather than clamped, because this pixel
 *  addressing wraps silently onto the next row: measured, a rect at x 1400 of a
 *  1400 px canvas read the row below it and this file reported a drifted surface
 *  instead of no measurement. */
export function glassExpression(rect) {
  return `(() => {${PAGE_PRELUDE}
  if (canvas === null) return JSON.stringify({ canvas: null });
  const size = { width: canvas.width, height: canvas.height };
  const rect = ${JSON.stringify(rect)};
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > canvas.width || rect.y + rect.h > canvas.height) {
    return JSON.stringify({ canvas: size, outside: rect });
  }
  const values = [];
  for (let y = ${String(rect.y)}; y < ${String(rect.y + rect.h)}; y += 1) {
    for (let x = ${String(rect.x)}; x < ${String(rect.x + rect.w)}; x += 1) {
      const i = (y * canvas.width + x) * 4;
      values.push(Math.round((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) * 1000) / 1000);
    }
  }
  return JSON.stringify({ canvas: size, values });
})()`;
}
