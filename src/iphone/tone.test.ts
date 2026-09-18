import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { COLOR_KEYS } from './palette.js';
import { materialsFor, relativeLuminance } from './test-helpers.js';

/**
 * The look's *inputs*, pinned: the two small dark parts whose tone is a step
 * down from the frame they are cut into — the port's USB-C tongue (`TONGUE`)
 * and the pills' base seam (`BUTTON_SEAM`, which `lens.ts` also builds the lens
 * rings' hairline from).
 *
 * This is the material-tone half of the look's pins: `materials.test.ts` holds
 * the frame and scene values the rail-over-panel ratio is built from, and
 * `optics.test.ts` the dark optics and the cover glass's environment wall. The
 * two pins here are one class — a small part whose albedo is a measured step
 * down from the frame's, not a grey laid on the model — and they were split off
 * `optics.test.ts` when that file went past the repo's 500-line rule. The
 * fixtures all three build a real material set with are in `test-helpers.ts`.
 * The split is length only: every assertion here and its message moved unchanged
 * with the pins it is about, so the files together claim exactly what the one
 * file did.
 *
 * This bounds inputs, not pixels. The pixels are `scripts/check-finishes.mjs`'s
 * job — Chrome, the canvas read back, a finish's measured ratio against ±0.05 of
 * its reference — which needs a dev server and a browser, so it is local. CI has
 * neither, and what this catches is the drift that matters most: the tongue's
 * tone or the seam's shade of the finish changed. Neither replaces the other.
 * A green pin here with the look gone is possible, and `check:finishes` is the
 * other half.
 *
 * The literals are transcribed from the measurement each was fitted to rather
 * than read from `palette.ts` or `materials.ts`: a pin that copies the symbol it
 * checks proves only that the code agrees with itself. A deliberate retune
 * updates this table, the symbols and `check:finishes`'s targets together, and
 * this file goes red until it does.
 */

/**
 * The USB-C connector tongue: the dark-steel strip on the port's pocket floor
 * (`dims.ts`'s `USB_C.tongue`, 0.26 mm tall, 1.1 mm along Z), and the same class
 * as the dark optics in `optics.test.ts` — a surface that returned more of the
 * studio than the part around it.
 *
 * Its values were fitted to a geometry that no longer exists, and that is why
 * they were wrong rather than merely stale: `0xa9aeb6` at metalness 1 was
 * defensible under a slab that stood proud of the rail and filled the mouth, and
 * this tongue is a strip near the pocket's floor. Measured on the bottom preset
 * after the rebuild, the light material rendered 111 luma over the rect below,
 * against a pocket at 11 and a rail at 95 — brighter than the metal it is cut
 * into, a floating jewel rather than a connector. `0x343841` puts that rect at
 * 43. The brightest pixel on the model is the rail's own edge at 238 (x 1341,
 * y 308, identical in both arms): the strip was never the brightest thing in the
 * frame, it was brighter than the part it is cut into, and that read was wrong.
 *
 * The window it was fitted to is 20–45 — 1.8x to 4x the pocket, well under the
 * rail — so 43 is inside it, though 8 above the 25–35 the handover's arithmetic
 * predicted from a 0.39-linear environment term: that estimate averaged the
 * studio, and this strip mirrors what is *under* the phone instead.
 *
 * The two arms are `.shots/tongue/before/` and `.shots/tongue/after/` (ignored
 * scratch), both the `port` sweep — `bottom:cosmic-orange:wheel=-2` through
 * `scripts/sweep-iphone.mjs` at 1400x1000 — so the comparison holds the pose
 * still. The same sweep's `camera-closeup` frame is byte-identical between them
 * (sha256 489ac92b…), which is the evidence that nothing outside the port moved.
 */
const TONGUE = {
  tint: '343841',
  metalness: 0.9,
  roughness: 0.42,
  anisotropy: 0.3,
  /**
   * The tongue's albedo over the frame's, in relative luminance, on the colorway
   * the pixel was measured on: the bound is the class — a dark detail, not a
   * light one — and the light version it replaced sits at 1.89 of the same
   * quantity. Deep Blue is the finish that does not fit it: that frame's albedo
   * is the darkest of the three (0.0481) and it is metal, so this steel's 0.0394
   * is 0.82 of it, while the frame renders far brighter off that low albedo than
   * this strip does. The step is still a *dark* one in the convention that
   * matters — 43 rendered against a 95-luma rail — and dark in absolute terms on
   * all three.
   */
  frameRatioCeiling: 0.25,
  /** The strip's rendered luma before and after the retune, and the surfaces
   *  beside it that did not move. */
  stripBefore: 111,
  strip: 43,
  stripRect: 'x 640 y 480 100x4 of the bottom preset, `port` sweep, wheel -2',
  pocket: 11,
  rail: 95,
} as const;

/**
 * The pills' base seam: the thin dark line where a button leaves the frame, and
 * the hairline the lens rings share with it, because `lens.ts` builds that one
 * from this same material.
 *
 * The defect is a seam that reads as a *drawn edge* rather than as the shadow at
 * the button's base. `0x0a0b0d` at metalness 0.2 and roughness 0.85 rendered the
 * seam's own fully covered pixels at 10 luma — 0.10 of the pill face's 101.4, at
 * `coveredRect` below — and the 1 px line the flats leave at 25.5 to 30.8, 0.25
 * to 0.30 of that face.
 *
 * The reference's own button base is a soft shadow and not a black line. On
 * `.shots/ref/gsmr-040.jpg` (1200x799, decoded through Chrome, read in the same
 * BT.709 luma the render's rects are), the crevice at a button's base reads 79.5
 * to 82.5 luma against 163.05 for the rail's flat face beside it and 140.83 for
 * the button's own protruding face — **0.494 and 0.572** of the metal, paired
 * row by row, and stable to ±0.01 across all 29 rows.
 *
 * The seam is that shadow as a *shade of the finish* — `SEAM_SHADE` of the
 * frame's albedo — and not one grey: the frames' albedos span 0.0481 (Deep Blue)
 * to 0.4852 (silver), so no fixed grey is the same step below all three. That is
 * measured, not reasoned: a fixed `0x444444`, fitted on Cosmic Orange, rendered
 * 0.89 of Deep Blue's own pill face on the same `left` sweep — a seam that has
 * stopped reading, against the 0.38-0.58 it rendered on the finish it was fitted
 * to.
 *
 * On Cosmic Orange the shade lands the seam between the reference's two ratios.
 * On the `buttons` sweep (`left` four wheel notches in, 1400x1000, through
 * `scripts/sweep-iphone.mjs`'s real input path) the flats' 1 px line averages
 * 57.0 luma over the pill's 31 flat columns (0.5625 of the face) and its darkest
 * pixel reads 46.8 (0.462); the seam's own fully covered pixels read 33.9 to
 * 35.9 (0.334 to 0.354), against a pill face that did not move (101.37,
 * `faceRect`). The same sweep on the other two finishes lands the same rects at
 * 0.584 (Deep Blue) and 0.583 (silver) — `rendered` below — which is what a
 * shade of the finish buys and one grey does not. Metalness and roughness are
 * Z1's: the level was what was wrong, not the lobe.
 *
 * The lens rings' hairline moved with it, and toward its own reference: 20.9
 * luma (0.146 of the 142.8-luma plateau beside it) to 71.5 (0.500), where the
 * reference close-up's own ring base dips to 0.55-0.60 of its plateau.
 *
 * The two bounds on `shade` are the class, and each names a failure mode this
 * slice rendered: an albedo at the near-black it replaced is the drawn edge, and
 * one at the frame's own albedo is a seam that has stopped reading.
 */
const BUTTON_SEAM = {
  /** The seam's albedo over the frame's it is cut into, per finish, in relative
   *  luminance — the quantity the two bounds below are on. */
  shade: 0.2594,
  shadeFloor: 0.05,
  shadeCeiling: 0.35,
  /** The seam's albedo, transcribed from the built materials: the frame's own
   *  dye scaled by `shade`. Cosmic Orange's 0xcf6238 is 0x70321a, Deep Blue's
   *  0x323e57 is 0x161d2c and silver's 0xb8b9bc is 0x636365. */
  tint: { 'cosmic-orange': '70321a', 'deep-blue': '161d2c', silver: '636365' },
  metalness: 0.2,
  roughness: 0.85,
  /** The reference's crevice over the two metals beside it, in luma: the rail
   *  face that the crevice is cut into, and the button's own face beyond it. */
  referenceRailRatio: 0.494,
  referenceButtonRatio: 0.572,
  /** The rendered seam over the pill face before the retune, on Cosmic Orange:
   *  the darkest pixel across the line, and the seam's own fully covered pixel
   *  at the corner — the two readings Z1's near-black seam produced. */
  flatBefore: 0.252,
  coveredBefore: 0.088,
  /** The same two readings after it, per finish: the mean over the pill's 31
   *  flat columns of the darkest pixel across the line, and the seam's own fully
   *  covered pixel at the corner. `scripts/sweep-iphone.mjs`'s real input path,
   *  1400x1000, all three on the same pose. */
  rendered: {
    'cosmic-orange': { flat: 0.5625, covered: 0.354 },
    'deep-blue': { flat: 0.5844, covered: 0.377 },
    silver: { flat: 0.5833, covered: 0.395 },
  },
  /** The render's rects, on `cosmic-orange_buttons.png` at 1400x1000. */
  flatRect: 'x 588..618 y 329..339 — per column, the darkest pixel across the seam line under the pill’s flat',
  faceRect: 'x 588 y 300 31x26 — the pill face above it, mean 101.37',
  coveredRect: 'x 620 y 328..340 and x 626 y 328..340 — the pill’s bottom corner, where the band covers a whole pixel',
  /** The reference's rects, on `.shots/ref/gsmr-040.jpg`, all on rows 250..278
   *  of the vol-up button. */
  referenceSeamRect: 'x 758..760 — the crevice',
  referenceRailRect: 'x 749..755 — the rail’s flat face beside it, 163.05',
  referenceButtonRect: 'x 761..762 — the button’s protruding face, 140.83',
} as const;

describe('the look’s material tones', () => {
  it('keeps the port’s tongue a dark detail, below the frame whose mouth it sits in', () => {
    // The class first, on the colorway the pixel was measured on: a tongue whose
    // albedo is not far below the frame's own is the defect this pins — the
    // light version sat at 1.89 of it and rendered `stripBefore` luma on the
    // strip, 16 above the rail it is cut into.
    const orange = materialsFor('cosmic-orange');
    const albedo = relativeLuminance(orange.tongue.color);
    const frame = relativeLuminance(orange.aluminum.color);
    const ratio = albedo / frame;
    expect(
      ratio,
      `Cosmic Orange: the tongue's albedo reads ${ratio.toFixed(3)} of the frame's (${albedo.toFixed(4)} against ${frame.toFixed(4)}), above the ${String(TONGUE.frameRatioCeiling)} that makes it a dark detail — over ${TONGUE.stripRect} the light version rendered ${String(TONGUE.stripBefore)} luma against a pocket at ${String(TONGUE.pocket)} and a rail at ${String(TONGUE.rail)}, and this one renders ${String(TONGUE.strip)}`,
    ).toBeLessThan(TONGUE.frameRatioCeiling);

    // The values, and that they do not follow the dropdown: the tongue is steel,
    // not a finish tint, and `applyColorway` leaves this material alone.
    for (const key of COLOR_KEYS) {
      const material = materialsFor(key).tongue;
      expect(material.color.getHexString(THREE.SRGBColorSpace), `${key}: the tongue's albedo`).toBe(TONGUE.tint);
      expect(material.metalness, `${key}: the tongue's metalness`).toBeCloseTo(TONGUE.metalness, 3);
      expect(material.roughness, `${key}: the tongue's roughness`).toBeCloseTo(TONGUE.roughness, 3);
      expect(material.anisotropy, `${key}: the tongue's anisotropy`).toBeCloseTo(TONGUE.anisotropy, 3);
    }
  });

  it('keeps the pills’ seam a shade of the finish, at the reference’s ratio on all three', () => {
    for (const key of COLOR_KEYS) {
      const materials = materialsFor(key);
      const frame = materials.aluminum.color;
      const albedo = relativeLuminance(materials.seam.color);
      const shade = albedo / relativeLuminance(frame);
      // The class first, at both ends of the ratio: an albedo at the near-black
      // it replaced is the drawn edge, and one at the frame's own is a seam that
      // has stopped reading. Each message carries the pixels its own arm
      // produced, and both arms were shot on this tree.
      expect(
        shade,
        `${key}: the seam's albedo reads ${shade.toFixed(4)} of the frame's (${albedo.toFixed(4)} against ${relativeLuminance(frame).toFixed(4)}), at or under the ${String(BUTTON_SEAM.shadeFloor)} a near-black seam sits at — 0x0a0b0d rendered ${BUTTON_SEAM.coveredRect} at ${String(BUTTON_SEAM.coveredBefore)} of the face, a near-black ring rather than the reference's ${String(BUTTON_SEAM.referenceRailRatio)}-${String(BUTTON_SEAM.referenceButtonRatio)} shadow over ${BUTTON_SEAM.referenceSeamRect}`,
      ).toBeGreaterThan(BUTTON_SEAM.shadeFloor);
      expect(
        shade,
        `${key}: the seam's albedo reads ${shade.toFixed(4)} of the frame's, at or above the ${String(BUTTON_SEAM.shadeCeiling)} a seam that has stopped reading sits at — 0x606060 was 0.5249 on Cosmic Orange and rendered 0.67 of the face over ${BUTTON_SEAM.flatRect}, a hairline the eye loses`,
      ).toBeLessThan(BUTTON_SEAM.shadeCeiling);
      expect(
        shade,
        `${key}: the seam's shade of the frame, the quantity the tint solves — on the finish the reference is it lands the seam at ${String(BUTTON_SEAM.rendered['cosmic-orange'].flat)} of ${BUTTON_SEAM.faceRect} against the reference's ${String(BUTTON_SEAM.referenceButtonRatio)} over ${BUTTON_SEAM.referenceButtonRect}, and this finish's own rects render ${String(BUTTON_SEAM.rendered[key].flat)} (line) and ${String(BUTTON_SEAM.rendered[key].covered)} (the seam's covered pixel)`,
      ).toBeCloseTo(BUTTON_SEAM.shade, 3);

      // The crevice is the frame's own dye in shadow, not a grey laid over it:
      // the three channels scale the frame's by one factor. A neutral seam is
      // what rendered 0.89 of Deep Blue's pill face — a step the eye loses —
      // because 0.0578 of albedo is a shadow of a bright frame and nearly the
      // whole of a dark one.
      const shares = [
        materials.seam.color.r / frame.r,
        materials.seam.color.g / frame.g,
        materials.seam.color.b / frame.b,
      ];
      expect(
        Math.max(...shares) - Math.min(...shares),
        `${key}: the seam's channels scale the frame's by ${shares.map((share) => share.toFixed(4)).join(', ')} — a spread here is one grey laid over the finish rather than the finish in shadow`,
      ).toBeLessThan(0.01);

      expect(
        materials.seam.color.getHexString(THREE.SRGBColorSpace),
        `${key}: the seam's albedo, the frame's dye at ${String(BUTTON_SEAM.shade)}`,
      ).toBe(BUTTON_SEAM.tint[key]);
      expect(materials.seam.metalness, `${key}: the seam's metalness`).toBeCloseTo(BUTTON_SEAM.metalness, 3);
      expect(materials.seam.roughness, `${key}: the seam's roughness`).toBeCloseTo(BUTTON_SEAM.roughness, 3);
    }
  });
});
