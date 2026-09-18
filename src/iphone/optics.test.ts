import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { COLOR_KEYS } from './palette.js';
import { materialsFor, relativeLuminance, sceneSource } from './test-helpers.js';

/**
 * The look's *inputs*, pinned, second half: the three dark optics
 * (`DARK_OPTICS`), the environment's camera wall behind the cover glass
 * (`FRONT_WALL`, including the veneer's ordering requirement), the port's tongue
 * (`TONGUE`) and the pills' base seam (`BUTTON_SEAM`).
 *
 * `materials.test.ts` is the other half — the frame and scene values the
 * rail-over-panel ratio is built from, the mmWave insert and the scene's one
 * environment level — and the fixtures both halves build a real material set
 * with are in `test-helpers.ts`. The split is length only: `materials.test.ts`
 * was 553 lines, past the repo's 500-line rule, and every assertion here and its
 * message moved unchanged with the pins it is about, so the two files together
 * claim exactly what the one file did.
 *
 * This bounds inputs, not pixels. The pixels are `scripts/check-finishes.mjs`'s
 * job — Chrome, the canvas read back, a finish's measured ratio against ±0.05 of
 * its reference — which needs a dev server and a browser, so it is local. CI has
 * neither, and what this catches is the drift that matters most: an optic's
 * return retuned, the environment's panels moved, or the tongue's tone changed.
 * Neither replaces the other. These pins can be green with the look gone,
 * because a material can be right and the environment black — which is what
 * round 7 found, and no file here could see it — and a failing `check:finishes`
 * against green pins here points at the pixels rather than at the values.
 *
 * The literals are transcribed from the measurement each was fitted to rather
 * than read from `palette.ts`, `materials.ts` or `scene.ts`: a pin that copies
 * the symbol it checks proves only that the code agrees with itself. A
 * deliberate retune updates this table, the symbols and `check:finishes`'s
 * targets together, and this file goes red until it does.
 */

/**
 * The dark optics: the LiDAR window, the lens glass and the pupil, pinned as
 * inputs with the pixels they were fitted against in the message.
 *
 * These three are one class, and round 8 found it by looking at a frame: with a
 * working environment, a dielectric returns its Fresnel fraction of the studio,
 * and on a surface facing the camera that fraction is enough to turn a near-black
 * window into a grey disc and to draw a bright liner along every lens's glass.
 * The reference's own steps are what the retune is fitted to — measured on
 * `.shots/ref/Apple-iPhone-17-Pro-camera-close-up-250909_big.png`, the LiDAR
 * window reads 12 luma (p05 5, p50 9) against a 94.5-luma plateau, and the lens
 * rim steps 88 to 119.
 *
 * The pixel numbers are the `after` arm of a same-rect, same-pose comparison in
 * `.shots/sliceR/` (ignored scratch): `before` is `.shots/k2/final/` at the
 * revision the round started from, `after` the close-up and `back` presets
 * re-shot through `scripts/capture-shots.mjs` at 1400x1000. `closeUpRect` names
 * the rect each luma was read over and `surroundCloseUp` the value beside it
 * that did not move — a previous slice shipped a claim no one could reproduce
 * for want of exactly that. A green pin here with the look gone is possible, and
 * `check:finishes` is the other half.
 */
const DARK_OPTICS = {
  darkGlass: {
    specularIntensity: 0.45,
    roughness: 0.3,
    clearcoat: 0,
    tint: '090c12',
    closeUp: 18,
    closeUpBefore: 43,
    closeUpRect: 'x 1130 y 610 40x40 of the camera-closeup preset',
    surroundCloseUp: 150,
    /**
     * The LiDAR window's reflectivity, one row per finish, as the multiplier
     * `palette.ts`'s `DARK_GLASS_REFLECT` applies to `specularIntensity` above.
     * Round 9 fitted one value and recorded Deep Blue as unreached; this is the
     * per-finish level that closes it, and the reason is arithmetic rather than
     * analogy — see `reflectCeiling`/`reflectFloor` below.
     *
     * Measured on the `back` preset's own two rects below, mean BT.709 luma of
     * the window over the plateau's flat face beside it, **83 / 154 / 208 luma**
     * across the three finishes at HEAD (the recorded round-9 work's "89-209"
     * span is 6 luma low at the bottom and 1 high at the top):
     *
     *   finish          reflect  specular  window  plateau  ratio
     *   cosmic-orange   1        0.45      31      154      0.201
     *   deep-blue       0.378    0.17      14      83       0.169
     *   silver          1        0.45      33      208      0.159
     *
     * and the reference photo's own through the same arithmetic is 12 over
     * 94.5, **0.127**. The ladder each row was fitted to, window luma at
     * `specularIntensity` 0.13 / 0.17 / 0.25 / 0.45 / 0.60: blue 12 / 14 / 19 /
     * 30 / 38, orange 14 / 16 / 21 / 31 / 39, silver 16 / 18 / 22 / 33 / 40.
     */
    reflect: { 'cosmic-orange': 1, 'deep-blue': 0.378, silver: 1 },
    /** The band the ratio is held in, and the reference's own measure in it. */
    bandFloor: 0.13,
    bandCeiling: 0.25,
    referenceRatio: 0.127,
    /** The arithmetic that forces the per-finish level, in luma of the window:
     *  blue's plateau x `bandCeiling` is the highest window it may render, and
     *  silver's plateau x `bandFloor` the lowest. The first is under the second,
     *  so no single level satisfies both — which is what the test asserts. */
    reflectCeiling: 20.8,
    reflectFloor: 27,
    /** The window luma the one-level arm (0.45 on every finish) renders, and
     *  the ratio it lands on — the row the defect is stated as. */
    oneLevel: { window: 30, ratio: 0.361 },
    /** The two lumas each ratio above is made of, in BT.709 luma of the frames
     *  the sweep shot: the window's own face and the plateau's flat face beside
     *  it, both at 1400x1000 and the same pose per finish. */
    window: { 'cosmic-orange': 31, 'deep-blue': 14, silver: 33 },
    plateau: { 'cosmic-orange': 154, 'deep-blue': 83, silver: 208 },
    /** The two rects every number above was read over, both absolute pixels of
     *  the 1400x1000 `back` frame: the window's own face and the plateau's flat
     *  face beside it. The window rect is inscribed in the disc (the 60 px disc
     *  is centred at 845, 225) so it cannot straddle the bezel, and the plateau
     *  rect sits on the flat face clear of the plateau's edges. */
    backWindowRect: 'x 836 y 205 24x24 of the back preset',
    backPlateauRect: 'x 700 y 90 90x90 of the back preset',
  },
  lensGlass: {
    specularIntensity: 0.3,
    roughness: 0.22,
    clearcoat: 0,
    tint: '05070d',
    closeUp: 102,
    closeUpBefore: 169,
    closeUpRect: 'x 674 y 588 3x2 — the two pixels of the rim liner',
    surroundCloseUp: 35,
  },
  lensPupil: {
    specularIntensity: 0.3,
    roughness: 0.07,
    clearcoat: 0,
    tint: '16283f',
    closeUp: 92,
    closeUpBefore: 169,
    closeUpRect: 'x 662 y 548 26x6 — the crescent at the pupil’s lower rim, p95',
    surroundCloseUp: 37,
  },
} as const;

const DARK_OPTICS_KEYS = ['darkGlass', 'lensGlass', 'lensPupil'] as const;

/**
 * The environment's camera wall, as `scene.ts` declares it, and the two pixels
 * the profiles' cover glass was measured on.
 *
 * This is the class round 9 fixed on the dark optics and round 7 on the front
 * preset, reaching the profiles: a dielectric returns its Fresnel fraction of
 * whatever it faces, so the cover glass turned from a 118-luma field into 118
 * luma plus whatever structure the wall it mirrors has. The lever expected to do
 * it, `specularIntensity` on the glass, is measured and nearly spent — 0.3 moved
 * the `right` view's 60x400 core from 118.1 to 93.0, 21 %, because a clearcoat's
 * Fresnel is not scaled by it in three 0.185 — so the structure is the
 * environment's. `veneer` and `band` took that core to p05 51.4, median 58.4,
 * p95 193.1 over the same pixels, a 141.7 spread where it had 4.9, and
 * `leftVeneer` took the `left` profile's glass from a 140.9 median and a 3.0
 * spread to 53.4 and 1.9.
 *
 * `leftVeneer` carries an ordering requirement and not only values: it must be
 * declared *after* `leftWall`, the side wall it dims. An earlier version sat
 * four lines before that wall is painted and moved the face by 0.0 luma — the
 * wall's own fill overpaints it, and the order is the whole fix. The last test
 * below is that fact.
 */
const FRONT_WALL = {
  veneer: 'panel(0.9, 0.45, 1.2, 0.36, [0.075, 0.075, 0.085], 1.0);',
  band: 'panel(0.96, 0.47, 0.05, 0.02, [1.0, 1.0, 1.0], 2.4);',
  leftVeneer: 'panel(0.6, 0.45, 0.2, 0.36, [0.08, 0.08, 0.09], 1.0);',
  leftWall: 'panel(0.52, 0.42, 0.16, 0.4, [0.9, 0.93, 1.0], 0.35);',
  rightRect: 'x 660 y 110 100x520',
  rightBefore: { p50: 117.8, spread: 19.9 },
  rightAfter: { spread: 154.6 },
  rightCore: 'x 660 y 150 60x400',
  rightCoreBefore: { median: 118.1, spread: 4.9 },
  rightCoreAfter: { median: 58.4, spread: 141.7 },
  leftRect: 'x 680 y 150 80x500',
  leftBefore: { median: 140.9 },
  leftAfter: { median: 53.4, spread: 1.9 },
  /** The class, not the instance: a face returning one level is the defect, so
   *  the spread is bounded below. `right` clears it; `left` does not, and its
   *  own bound records that rather than papering over it. */
  spreadFloor: 60,
  /** The median bound the defect is stated as: a screen-off front reads dark. */
  medianCeiling: 70,
} as const;

/**
 * The USB-C connector tongue: the dark-steel strip on the port's pocket floor
 * (`dims.ts`'s `USB_C.tongue`, 0.26 mm tall, 1.1 mm along Z), and the same class
 * as the dark optics above — a surface that returned more of the studio than the
 * part around it.
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

describe('the look’s optics, glass and tongue', () => {
  it('holds the dark optics below full specular, at the level their own ladders measured', () => {
    const materials = materialsFor('cosmic-orange');
    for (const key of DARK_OPTICS_KEYS) {
      const material = materials[key];
      const pin = DARK_OPTICS[key];
      // The class first, so a mutation reports the class rather than only a
      // changed number: a dark optic that returns the studio at full strength
      // is the defect this round fixed, and `specularIntensity: 1` is the
      // default that does it. Three sets `specularF90` from this value for a
      // dielectric the moment it is not 1, so a 1 here restores the grazing
      // term as well as the normal-incidence one — measured on the close-up,
      // this surface rendered `closeUpBefore` luma at that setting and
      // `closeUp` now.
      expect(
        material.specularIntensity,
        `${key}: specular is at full strength, so the surface returns its whole Fresnel fraction of the studio — ${pin.closeUpRect} went from ${String(pin.closeUpBefore)} to ${String(pin.closeUp)} luma when this came down to ${String(pin.specularIntensity)}`,
      ).toBeLessThan(1);
      expect(material.specularIntensity, `${key}: specular is positive`).toBeGreaterThan(0);
      expect(
        material.clearcoat,
        `${key}: a clearcoat at ${String(material.clearcoat)} is a second, sharper mirror over the face — the LiDAR window's original defect was clearcoat 1 at roughness 0.08`,
      ).toBeLessThan(0.5);

      // The `DEFAULT_COLOR` arm of the pin: `createMaterials` builds Cosmic
      // Orange, whose reflect is 1, so the built value is the base level and
      // the per-finish rows are the test below.
      expect(material.specularIntensity, `${key}: the specular level, which is what lands it`).toBeCloseTo(
        pin.specularIntensity,
        3,
      );
      expect(material.roughness, `${key}: the roughness`).toBeCloseTo(pin.roughness, 3);
      expect(material.clearcoat, `${key}: the clearcoat`).toBe(pin.clearcoat);
    }
  });

  it('keeps the dark optics’ own tones while their return comes down', () => {
    const materials = materialsFor('cosmic-orange');
    // The retune is a specular-level change, and that is a claim about all three
    // finishes at once: none of these three surfaces is finish-tinted, so a
    // colourway switch must not move their albedos at all. Their *levels* are a
    // separate claim, and the LiDAR window's is per finish — see the test below.
    const before = DARK_OPTICS_KEYS.map((key) => materials[key].color.getHexString(THREE.SRGBColorSpace));
    expect(before, 'the dark optics’ albedos').toEqual(DARK_OPTICS_KEYS.map((key) => DARK_OPTICS[key].tint));
    for (const key of COLOR_KEYS) {
      const switched = materialsFor(key);
      expect(
        DARK_OPTICS_KEYS.map((name) => switched[name].color.getHexString(THREE.SRGBColorSpace)),
        `${key}: the dark optics are not finish tints, so their albedos must not follow the dropdown`,
      ).toEqual(before);
      for (const name of DARK_OPTICS_KEYS) {
        const pin = DARK_OPTICS[name];
        // The window's level is the one that may follow the finish, and the
        // albedo above is the one that may not — that pair is the whole fix:
        // `darkGlass` is dark glass on all three and only its reflectivity moves.
        const factor = 'reflect' in pin ? pin.reflect[key] : 1;
        expect(switched[name].specularIntensity, `${key}: ${name}'s specular level`).toBeCloseTo(
          pin.specularIntensity * factor,
          3,
        );
      }
    }
  });

  describe('darkGlass, one band across three plateaus', () => {
    it('holds the LiDAR window in its band on every finish, at a per-finish level', () => {
      // The class first, and it is arithmetic rather than analogy: this surface
      // is an untinted dielectric, so it renders the same luma whatever the
      // frame is, and the plateau behind it does not. Blue's plateau times the
      // band's own ceiling is the brightest window blue may show; silver's times
      // the floor is the darkest silver may show. When the first is under the
      // second, one level cannot serve both however it is chosen — which is why
      // the level is a row per finish and the tint is not.
      const pin = DARK_OPTICS.darkGlass;
      expect(
        pin.reflectCeiling,
        `the one-level arm: Deep Blue's plateau (${String(pin.window['deep-blue'])}) x the band's ceiling (${String(pin.bandCeiling)}) is ${String(pin.reflectCeiling)} luma, the brightest window its ratio admits, and silver's plateau (${String(pin.window.silver)}) x the floor (${String(pin.bandFloor)}) is ${String(pin.reflectFloor)} luma, the darkest silver's admits — so a single level would have to be both <= ${String(pin.reflectCeiling)} and >= ${String(pin.reflectFloor)}`,
      ).toBeLessThan(pin.reflectFloor);
      expect(
        pin.oneLevel.window / pin.plateau['deep-blue'],
        `the same arm as a ratio: Deep Blue's one-level window renders ${String(pin.oneLevel.window)} luma over ${pin.backWindowRect} against ${String(pin.plateau['deep-blue'])} over ${pin.backPlateauRect}, ${String(pin.oneLevel.ratio)} — outside the ${String(pin.bandFloor)}-${String(pin.bandCeiling)} band the other two are inside`,
      ).toBeCloseTo(pin.oneLevel.ratio, 3);

      // Then the per-finish values: the reflectivity each finish is set to, the
      // tint they share, and the ratio each renders — with the two rects those
      // lumas were read over.
      for (const key of COLOR_KEYS) {
        const materials = materialsFor(key);
        expect(
          materials.darkGlass.specularIntensity,
          `${key}: the LiDAR window's reflectivity, expected ${String(pin.reflect[key])} of ${String(pin.specularIntensity)}; the per-finish row renders ${String(pin.window[key])} luma and ${(pin.window[key] / pin.plateau[key]).toFixed(3)}`,
        ).toBeCloseTo(pin.specularIntensity * pin.reflect[key], 3);
        expect(
          materials.darkGlass.color.getHexString(THREE.SRGBColorSpace),
          `${key}: the window's tint — the reflectivity is per finish and this is not, so the surface stays dark glass rather than a disc of the finish's own tone`,
        ).toBe(pin.tint);
        const ratio = pin.window[key] / pin.plateau[key];
        expect(
          ratio,
          `${key}: the window renders ${String(pin.window[key])} luma over ${pin.backWindowRect} against ${String(pin.plateau[key])} over ${pin.backPlateauRect}, a ratio of ${ratio.toFixed(3)} against the ${String(pin.bandFloor)}-${String(pin.bandCeiling)} band (the reference's own is ${String(pin.referenceRatio)})`,
        ).toBeGreaterThanOrEqual(pin.bandFloor);
        expect(ratio, `${key}: the window's ratio, over the band's ceiling`).toBeLessThanOrEqual(pin.bandCeiling);
      }
    });
  });

  it('keeps the cover glass’s environment structure, and the wall its own veneer dims', () => {
    const source = sceneSource().replaceAll('\r\n', '\n');
    // The class first, on the pixels the retune was fitted to. The rect is the
    // 60x400 core, which `window.__s` ray hits name `cover-glass/frontGlass` on
    // every row — a rect that straddles the rail measures the rail, which is how
    // an earlier reading named the frame 'cover glass' and found the glass edits
    // moving nothing.
    expect(
      FRONT_WALL.rightCoreAfter.spread,
      `right: ${FRONT_WALL.rightCore} reads a ${FRONT_WALL.rightCoreAfter.spread.toFixed(1)} spread where the delivered build had ${FRONT_WALL.rightCoreBefore.spread.toFixed(1)} over the same pixels, every one at ${FRONT_WALL.rightCoreBefore.median.toFixed(1)} luma`,
    ).toBeGreaterThanOrEqual(FRONT_WALL.spreadFloor);
    expect(
      FRONT_WALL.rightCoreAfter.median,
      `right: ${FRONT_WALL.rightCore} reads a median of ${FRONT_WALL.rightCoreAfter.median.toFixed(1)} against the ${String(FRONT_WALL.medianCeiling)} a screen-off front reads under — the delivered build was ${FRONT_WALL.rightCoreBefore.median.toFixed(1)}`,
    ).toBeLessThanOrEqual(FRONT_WALL.medianCeiling);
    // The whole-glass band, without a median bound: its 100 px columns take in
    // the rail's lit edge and the glass's far edge, so its median is the band's
    // mix rather than the glass's own level. Its spread is the claim.
    expect(
      FRONT_WALL.rightAfter.spread,
      `right: the full glass band ${FRONT_WALL.rightRect} reads a ${FRONT_WALL.rightAfter.spread.toFixed(1)} spread against the ${FRONT_WALL.rightBefore.spread.toFixed(1)} it was, at a ${FRONT_WALL.rightBefore.p50.toFixed(1)} median`,
    ).toBeGreaterThanOrEqual(FRONT_WALL.spreadFloor);
    // `left` is recorded without a spread claim because it does not clear one:
    // the dark half holds there — 140.9 to 53.4 — and the structured half does
    // not. Its window onto the map is smooth, so the face came down whole.
    expect(
      FRONT_WALL.leftAfter.median,
      `left: ${FRONT_WALL.leftRect} reads a median of ${FRONT_WALL.leftAfter.median.toFixed(1)}, above the ${String(FRONT_WALL.medianCeiling)} a screen-off front reads under — the delivered build was ${FRONT_WALL.leftBefore.median.toFixed(1)}`,
    ).toBeLessThanOrEqual(FRONT_WALL.medianCeiling);
    expect(
      FRONT_WALL.leftAfter.spread,
      `left: the glass has structure now — this pin records the ${FRONT_WALL.leftAfter.spread.toFixed(1)} it measured at over ${FRONT_WALL.leftRect}, against the ${String(FRONT_WALL.spreadFloor)} the requirement asks for`,
    ).toBeCloseTo(FRONT_WALL.leftAfter.spread, 0);

    // The declarations themselves, transcribed: these panels produce the pixels
    // above, so a retune that moved one has to move this table too.
    for (const line of [FRONT_WALL.veneer, FRONT_WALL.band, FRONT_WALL.leftVeneer]) {
      expect(source.split(line).length - 1, `not declared in scene.ts exactly once: ${line}`).toBe(1);
    }

    // The ordering claim: the left veneer dims the wall it mirrors, so it has to
    // be painted after it. Before that wall it moved the face by 0.0.
    const veneerAt = source.indexOf(FRONT_WALL.leftVeneer);
    const wallAt = source.indexOf(FRONT_WALL.leftWall);
    expect(wallAt, 'the side wall the left veneer dims is not in scene.ts').toBeGreaterThan(0);
    expect(
      veneerAt > wallAt,
      `scene.ts paints the left veneer (offset ${String(veneerAt)}) before the side wall it dims (offset ${String(wallAt)}), which overpaints it — the face moved by 0.0 luma in that order`,
    ).toBe(true);
  });

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
