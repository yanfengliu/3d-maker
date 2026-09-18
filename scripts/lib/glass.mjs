// The glass section (`front`, `right` and `left`, cosmic-orange) is on for every
// run, and reads one named rect of each frame back through the same canvas.
// This is the surface a visitor notices first and the last one with no bound at
// all: round 7's front face shipped as a void that read 1 luma and its first fix
// as a flat 105, and round 10 found the profiles rendering a uniform 118.1 —
// three regressions measured in a frame, none of which any gate could see. The
// quantity is BT.709 luma of the sRGB bytes and the percentiles are nearest-rank
// over every px of the rect, which is the round-7/round-10 instrument; it is not
// the linearised quantity the ratio and the port's bands are taken in, and the
// two do not agree here, because only a neutral pixel reads the same byte either
// way and this glass is tinted:
//
//   front  x 360 y 120 240x700   p05 12.9  median 60.7  p95 154.1  spread 141.1
//   right  x 660 y 150  60x400   p05 51.4  median 58.4  p95 193.1  spread 141.7
//   left   x 680 y 150  80x500   p05 53.3  median 53.4  p95  55.1  spread   1.9
//
// Three runs of each read those bytes exactly, so the bounds below are headroom
// for a surface that moved rather than for run-to-run noise. What each rect
// covers is measured rather than assumed — `cover-glass`, `display`, `island` and
// `frame` projected through the page's own camera, and each material repainted
// its own hue on the live page — and the three are not equally the glass.
// `cover-glass` projects to x 493..907 on the `front` preset, so 55% of that rect
// (x 360..487) is the studio backdrop, x 487..500 the frame's rail and the rest
// is glass: its median 60.7 is the top of the dark mass and its p95 154.1 the
// backdrop's bright card, while its p05 12.9 is the glass's own darkest pixels.
// The `right` rect is the cover glass except its top ~35 rows, which carry the
// Dynamic Island — a different material, which is how the arms below leave them
// at 189 while the glass beside them goes to 0 — so its p95 193.1 is the island
// and only its median 58.4 and p05 51.4 are the glass. The `left` rect is glass
// with the island's edge in its top rows and a sliver of rail in its bottom
// corner, both under 5% of its pixels (its p95 55.1 is the glass; the outliers
// are its 112.4 maximum), and it is a flat field on purpose: that face mirrors
// the side wall, and round 11 measured its reflected ray sweeping 0.1 degree
// across the face's whole width, so a flat mirror cannot show an image, small
// features are averaged away, and a 1.9-luma spread is the physical result
// rather than a defect. Do not "fix" it by giving this face a spread bound or by
// expecting structure to appear on it: a 0.03-wide and a 0.1-wide bright band in
// that octant each left the spread at 2.1, and only a band spanning the whole
// window moved the face at all (to a flat 207, which the ceiling above would
// catch).
//
// Its bounds: a median band of 45..85 luma on each of the three faces, and a
// spread of at least 70 on `front` and `right`. The accepted three read medians
// 53.4, 58.4 and 60.7, so the ceiling sits 24 above the highest of them and 20
// below the lowest light state any of these defects produced (round 7's 105;
// round 10's profile slab was 118.1), and the floor sits 8 under the lowest of
// them and 16 under the front's 60.7, while clearing by 10 the 34.8 a front glass
// with no return left reads — where the median falls back to the backdrop's dark
// card rather than to black, and where the profiles read 0.0. The spread floor is
// half the accepted 141 and 14x round 10's uniform 4.9.
//
// The median is a band rather than the bare ceiling the two arms were first split
// on, and the reason is measured: a void on the glass cannot fail a spread bound
// on either rect, because neither rect's p95 is the glass. Killing the return
// through CDP — clearcoat 0, roughness 1, specularIntensity 0, albedo untouched —
// leaves the `front` spread at 154.1 (the backdrop card) and the `right` at 189.1
// (the island) while the two medians fall to 34.8 and 0.0, so the floor is what
// catches that arm and the spread bound cannot. The spread still bounds something
// worth bounding — a face that went flat at a level between the dark mass and the
// card, and the composition of the rect itself — but it is not the void's gate.
import { HEIGHT, WIDTH, exceptions, didNotRun, open, readFrame, shotUrl } from './shot-cdp.mjs';
import { glassExpression } from './shot-pixels.mjs';

// The glass section's bounds and frames. The bounds come first because the stops
// below name the spread floor, and a `const` read before its declaration throws.

/** The glass's median band, as literals with the accepted measurements behind
 *  each end. The accepted three read 53.4 (`left`), 58.4 (`right`) and 60.7
 *  (`front`), all deterministic over three runs. The ceiling is 24 above the
 *  highest of them and 20 below the lowest light state these defects shipped —
 *  round 7's front slab at 105, round 10's profile slab at 118.1, and the
 *  raised-albedo arm at 111.1. The floor is 8 under the lowest accepted median
 *  (53.4, and 16 under the front's 60.7) and 10 over the 34.8 the front rect
 *  reads with the glass's return gone, where its median is the backdrop's dark
 *  card; the profiles read 0.0 there. */
const GLASS_MEDIAN_CEILING = 85;
const GLASS_MEDIAN_FLOOR = 45;
/** Half the accepted spreads (141.1 and 141.7) and 14x the 4.9 round 10's
 *  uniform profile slab read, so a face that went flat fails by a wide margin.
 *  `left` carries no floor: see this module's header on why its flatness is
 *  physical. */
const GLASS_SPREAD_FLOOR = 70;

// The glass section's three frames and their rects: one named rect per preset,
// each an absolute rect of that 1400x1000 frame, read on cosmic-orange — the
// colorway the front glass and the two profiles were fitted on. `front` and
// `right` carry a spread bound and `left` does not, because that face is a flat
// mirror by construction rather than by defect: see the header.
const GLASS_COLOR = 'cosmic-orange';
const GLASS_STOPS = [
  {
    view: 'front',
    label: 'cover glass',
    rect: { x: 360, y: 120, w: 240, h: 700 },
    /** Accepted build: p05 12.9, median 60.7, p95 154.1, spread 141.1. The rect
     *  is 55% the studio backdrop (see the header), so this floor bounds the
     *  rect's composition rather than the glass's structure; the median floor is
     *  what catches the extinguished glass on this frame. */
    spreadFloor: GLASS_SPREAD_FLOOR,
  },
  {
    view: 'right',
    label: 'cover glass core',
    rect: { x: 660, y: 150, w: 60, h: 400 },
    /** Accepted build: p05 51.4, median 58.4, p95 193.1, spread 141.7. Its top
     *  ~35 rows are the Dynamic Island, so this spread's upper end is the island
     *  and not the glass — but a face that went flat between the glass and the
     *  island still fails it, and round 10's slab read 4.9 here. */
    spreadFloor: GLASS_SPREAD_FLOOR,
  },
  {
    view: 'left',
    label: 'cover glass',
    rect: { x: 680, y: 150, w: 80, h: 500 },
    /** Accepted build: p05 53.3, median 53.4, p95 55.1 — and the 1.9 spread is
     *  physically expected on this face, which is why there is no floor: the
     *  header carries the measurement that says so. */
    spreadFloor: null,
  },
];

/** The accepted build's read on each rect, as one string per preset for the
 *  failure messages: the same numbers the header lists. */
const GLASS_ACCEPTED = {
  front: 'p05 12.9 / median 60.7 / p95 154.1 / spread 141.1',
  right: 'p05 51.4 / median 58.4 / p95 193.1 / spread 141.7',
  left: 'p05 53.3 / median 53.4 / p95 55.1 / spread 1.9',
};

/** One cover-glass face: its rect's median and p05..p95 spread in luma, or a
 *  thrown "did not run". The rect is the whole instrument, so a rect the render
 *  never reached — every pixel of it black, which is what a missing canvas reads
 *  as too — is a harness failure here and not a verdict about the glass. A rect
 *  whose *median* is 0 while its neighbours are not is the opposite: that is a
 *  glass with no return left, which is a drifted surface and exits 1. */
async function measureGlass(send, stop) {
  const { view, rect } = stop;
  const label = `glass ${view}:${GLASS_COLOR}`;
  const where = `${stop.label} (x ${String(rect.x)} y ${String(rect.y)} ${String(rect.w)}x${String(rect.h)})`;
  exceptions.length = 0;
  await open(send, shotUrl(view, GLASS_COLOR), label);
  const frame = await readFrame(send, { color: GLASS_COLOR, view }, label, glassExpression(rect));
  if (exceptions.length > 0) throw didNotRun(`${label}: the page threw while rendering the frame — ${exceptions.join(' | ')}`);
  if (frame.outside !== undefined) {
    throw didNotRun(`${label}: the ${where} runs off the ${String(frame.canvas.width)}x${String(frame.canvas.height)} canvas, so this is not the rect the bound was written for`);
  }
  // The rect's own size is what the sample count is checked against, so a
  // readback that came back short or long stops the run instead of quietly
  // percentiling a different number of pixels than the bound was written for.
  if (!Array.isArray(frame.values)) throw didNotRun(`${label}: the readback returned no samples for the ${where}`);
  if (frame.values.length !== rect.w * rect.h) {
    throw didNotRun(`${label}: the ${where} returned ${String(frame.values.length)} samples, not the ${String(rect.w * rect.h)} its ${String(rect.w)}x${String(rect.h)} px need — a rect other than the one the bound was written for`);
  }
  const values = [...frame.values].sort((left, right) => left - right);
  const percentile = (share) => values[Math.min(values.length - 1, Math.floor((share / 100) * values.length))];
  const p05 = percentile(5);
  const median = percentile(50);
  const p95 = percentile(95);
  if (![p05, median, p95].every(Number.isFinite)) {
    throw didNotRun(`${label}: the ${where} read back p05 ${String(p05)}, median ${String(median)}, p95 ${String(p95)} — the render did not reach the canvas there`);
  }
  if (values[values.length - 1] < 1) {
    throw didNotRun(`${label}: the ${where} read back black on every one of its ${String(values.length)} px — the render did not reach the canvas there`);
  }
  return { view, label, rect, where, p05, median, p95, spread: p95 - p05, spreadFloor: stop.spreadFloor, n: values.length };
}

/** The glass's three rects as one line of the header the section prints. */
function glassRectList() {
  return GLASS_STOPS
    .map((stop) => `${stop.view} ${String(stop.rect.x)} ${String(stop.rect.y)} ${String(stop.rect.w)}x${String(stop.rect.h)}`)
    .join('; ');
}

/** Measures the three faces, prints the section, and pushes any drift onto
 *  `failures`. Returns the faces the run's OK line reads. */
export async function runGlass(send, failures) {
  const glass = [];
  for (const stop of GLASS_STOPS) glass.push(await measureGlass(send, stop));
  console.log(
    `\nglass — ${GLASS_STOPS.map((stop) => `${stop.view}:${GLASS_COLOR}`).join(', ')} presets; BT.709 luma percentiles over every px of one named rect of each ${String(WIDTH)}x${String(HEIGHT)} frame — ${glassRectList()}`,
  );
  console.log(
    'preset'.padEnd(9) + 'rect'.padEnd(26) + 'p05'.padEnd(8) + 'median'.padEnd(9) + 'p95'.padEnd(8) + 'spread'.padEnd(9) + 'bounds'.padEnd(31) + 'result',
  );
  for (const face of glass) {
    const band = `${String(GLASS_MEDIAN_FLOOR)}..${String(GLASS_MEDIAN_CEILING)}`;
    const inBand = face.median >= GLASS_MEDIAN_FLOOR && face.median <= GLASS_MEDIAN_CEILING;
    const boundedSpread = face.spreadFloor === null ? null : face.spread >= face.spreadFloor;
    const inside = inBand && boundedSpread !== false;
    const bounds =
      `median ${band}${face.spreadFloor === null ? ', no spread bound' : `, spread ≥ ${String(face.spreadFloor)}`}`;
    console.log(
      face.view.padEnd(9) +
        `x ${String(face.rect.x)} y ${String(face.rect.y)} ${String(face.rect.w)}x${String(face.rect.h)}`.padEnd(26) +
        face.p05.toFixed(1).padEnd(8) +
        face.median.toFixed(1).padEnd(9) +
        face.p95.toFixed(1).padEnd(8) +
        face.spread.toFixed(1).padEnd(9) +
        bounds.padEnd(31) +
        (inside ? 'pass' : 'FAIL'),
    );
    const accepted = GLASS_ACCEPTED[face.view];
    /** A failure names the preset, the rect, the value it read and the bound it
     *  left, so a reader can tell a drifted face from a rect that moved. */
    if (!inBand) {
      const above = face.median > GLASS_MEDIAN_CEILING;
      const how = above
        ? `so the glass is a light slab rather than a dark one (the accepted build reads ${accepted}; round 7's front slab read 105 and round 10's profile slab 118.1)`
        : `so the glass has no return left rather than being dark (the accepted build reads ${accepted}; the extinguished glass reads 0.0 on the profiles and 34.8 on the front, where the median falls back to the backdrop's dark card)`;
      failures.push(
        `${face.view}:${GLASS_COLOR} — the ${face.where} reads median luma ${face.median.toFixed(1)} over its ${String(face.n)} px, ${above ? 'above' : 'below'} the ${above ? String(GLASS_MEDIAN_CEILING) : String(GLASS_MEDIAN_FLOOR)} ${above ? 'ceiling' : 'floor'} of the ${band} band, ${how}`,
      );
    }
    if (boundedSpread === false) {
      failures.push(
        `${face.view}:${GLASS_COLOR} — the ${face.where} reads a p05..p95 spread of ${face.spread.toFixed(1)} luma, under the ${String(face.spreadFloor)} floor, so the face is flatter than the reflection band it is read for (the accepted build reads ${accepted}, and a face that went flat reads under 5: round 10's uniform profile slab read 4.9)`,
      );
    }
  }
  return glass;
}
