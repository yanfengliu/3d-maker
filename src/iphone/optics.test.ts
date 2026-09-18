import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { COLOR_KEYS } from './palette.js';
import { materialsFor, sceneSource } from './test-helpers.js';

/**
 * The look's *inputs*, pinned: the three dark optics (`DARK_OPTICS` — the LiDAR
 * window's per-finish reflectivity, the lens glass and the pupil) and the
 * environment's camera wall behind the cover glass (`FRONT_WALL`, including the
 * veneer's ordering requirement).
 *
 * `materials.test.ts` pins the frame and scene values the rail-over-panel ratio
 * is built from, the mmWave insert and the scene's one environment level;
 * `tone.test.ts` pins the port's tongue and the pills' base seam, split off this
 * file when it went past the repo's 500-line rule. The fixtures all three build
 * a real material set with are in `test-helpers.ts`. Each split is length only:
 * every assertion here and its message moved unchanged with the pins it is
 * about, so the files together claim exactly what the one `materials.test.ts`
 * did.
 *
 * This bounds inputs, not pixels. The pixels are `scripts/check-finishes.mjs`'s
 * job — Chrome, the canvas read back, a finish's measured ratio against ±0.05 of
 * its reference — which needs a dev server and a browser, so it is local. CI has
 * neither, and what this catches is the drift that matters most: an optic's
 * return retuned or the environment's panels moved. Neither replaces the other.
 * These pins can be green with the look gone, because a material can be right
 * and the environment black — which is what round 7 found, and no file here
 * could see it — and a failing `check:finishes` against green pins here points
 * at the pixels rather than at the values.
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

describe('the look’s optics and cover glass', () => {
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
});
