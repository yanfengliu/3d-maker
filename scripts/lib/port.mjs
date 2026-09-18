// The port section: the `bottom` preset on cosmic-orange, the one preset that
// looks into the USB-C mouth — the phone floats 25 mm up and `views.ts` aims at
// the bottom edge from 17 degrees below the front face. It runs with the ratio's
// checks and reads the same canvas back through three named rects of that frame:
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
import { HEIGHT, WIDTH, exceptions, didNotRun, open, readFrame, shotUrl } from './shot-cdp.mjs';
import { luma8Value, portExpression } from './shot-pixels.mjs';

// The port section's frame and rects. `bottom` on cosmic-orange is the one preset
// that looks into the USB-C mouth, and the three rects are absolute pixels of that
// 1400x1000 frame: the pocket behind the aperture, the tongue strip inside it and
// the rail the mouth is cut into. Every one sits strictly inside its surface — see
// this module's header on why the tongue's 3 px are not the 4 px
// `materials.test.ts` names.
const PORT_VIEW = 'bottom';
export const PORT_COLOR = 'cosmic-orange';
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

const PORT_EXPRESSION = portExpression(PORT_RECTS);

/** The port's read on the `bottom` preset: each named rect's mean luma, or a
 *  thrown "did not run". The rects are the measurement's whole instrument, so a
 *  rect the render never reached — which reads black, and would divide to the
 *  same zero a missing canvas does — is a harness failure here and not a verdict
 *  about the port. */
async function measurePort(send) {
  const label = `port ${PORT_VIEW}:${PORT_COLOR}`;
  exceptions.length = 0;
  await open(send, shotUrl(PORT_VIEW, PORT_COLOR), label);
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

/** Measures the port, prints the section, and pushes any drift onto `failures`.
 *  Returns the three values the run's OK line reads. */
export async function runPort(send, failures) {
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
  return reading;
}
