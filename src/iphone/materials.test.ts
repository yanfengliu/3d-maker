import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { applyColorway, createMaterials, type PhoneMaterials } from './materials.js';
import { COLOR_KEYS, type ColorKey } from './palette.js';

/**
 * The look's *inputs*, pinned: the frame and scene values the 1400x1000 `back`
 * view's rail-over-panel ratio is built from, the mmWave insert's character and
 * tone, the three dark optics (`DARK_OPTICS`) and the port's tongue (`TONGUE`).
 *
 * This bounds inputs, not pixels. The pixels are `scripts/check-finishes.mjs`'s
 * job — it drives Chrome, reads the canvas back and fails when a finish's
 * measured ratio leaves ±0.05 of its reference — and that gate needs a dev
 * server and a browser, so it is a local one. This file is what CI can run with
 * neither, and it catches the drift that matters most: a frame value retuned, a
 * panel tone moved, or the scene's one environment level changed. Neither
 * replaces the other, in both directions. These pins can be green with the look
 * gone, because a material can be right and the environment black — which is
 * exactly what round 7 found, and no file in this repo could see it — and a
 * failing `check:finishes` against green pins here points at the pixels rather
 * than at the values.
 *
 * The literals are transcribed from the measurement each was fitted to — the
 * frame, panel and environment from round 7's, the insert, optics and tongue
 * from theirs — rather than read from `palette.ts` or `materials.ts`: a pin that
 * copies the symbol it checks proves only that the code agrees with itself. A
 * deliberate retune updates this table, the symbols and `check:finishes`'s
 * targets together, and this file goes red until it does.
 */

/** The frame's finish, per colorway. Metalness is one value for all three —
 *  anodized aluminum whose oxide scatters, and where all three ratios land. */
const FRAME = {
  'cosmic-orange': { roughness: 0.62, clearcoat: 0.25, tint: 'cf6238' },
  'deep-blue': { roughness: 0.3, clearcoat: 0.18, tint: '323e57' },
  silver: { roughness: 0.42, clearcoat: 0.12, tint: 'b8b9bc' },
} as const;
const FRAME_METALNESS = 0.7;

/** The back panel each rail is divided by: the frame's own hue, lifted, and the
 *  albedo the ratio's denominator is made of. Silver's panel is the one that
 *  does not follow its tint down; its tint is what carries the ratio instead. */
const PANEL = { 'cosmic-orange': 'cf7754', 'deep-blue': '42506e', silver: 'e3e4e5' } as const;

/** The scene's one environment level: the only brightness control a standard
 *  material's `envMapIntensity` uniform ever receives (see `materials.ts`). */
const ENVIRONMENT_INTENSITY = 1.6;

/**
 * The mmWave insert: a matte polymer window in an anodized metal edge, and the
 * only surface on the phone that is not metal. Its character *is* the claim, so
 * the two bounds are stated rather than inlined — matte is a roughness at or
 * above the floor, a dielectric is a metalness below the ceiling, and no
 * clearcoat is what keeps a second, smoother mirror off a face the reference
 * shows no reflection on at all.
 *
 * `tint` is transcribed from the solved rows rather than read out of
 * `palette.ts`'s `MMWAVE_TONE`: a pin that copies the symbol it checks proves
 * only that the code agrees with itself. The rows were solved by measurement to
 * the reference's 0.83 of the frame's luma on the same row of the `top` view —
 * measured 0.833 Cosmic Orange, 0.831 Deep Blue, 0.836 silver — and a retune
 * that moved any of these hexes has to move this table with it.
 */
const MMWAVE = {
  roughness: 0.82,
  metalness: 0,
  roughnessFloor: 0.7,
  metalnessCeiling: 0.15,
  tint: { 'cosmic-orange': '9c4f31', 'deep-blue': '374157', silver: '8c8d91' },
  /**
   * The insert's albedo over the frame's, in relative luminance, per finish.
   * Darker than the frame wherever the frame's own albedo has room under it —
   * 0.578 on Cosmic Orange and 0.550 on silver — but *not* on Deep Blue, and
   * that exception is the measurement, not a convenience: that frame's albedo
   * is the darkest of the three (0.0481) and it is metal, so it renders at 118
   * luma where a diffuse surface of the same albedo cannot. An insert that
   * lands the reference's step there carries a hair more albedo than the frame
   * does (0.0528 against 0.0481) and still renders at 0.831 of it. Making that
   * row's albedo darker than its frame's costs the step: a two-point fit of
   * rendered on albedo luminance from the two measured Deep Blue rows puts
   * parity of albedo at about 0.79 rendered, 0.04 below the reference and the
   * other two finishes.
   */
  albedoRatio: { 'cosmic-orange': 0.578, 'deep-blue': 1.098, silver: 0.55 },
} as const;

/**
 * `createMaterials()` builds two procedural canvas textures, so it wants a
 * `document` a node test has not got. `textures.ts` already tolerates a null 2d
 * context, so a canvas that returns one is enough to reach the real material
 * values — and those are what this file pins. The textures themselves are not
 * measured here; nothing in this file turns on what they look like.
 */
function withCanvasStub<T>(run: () => T): T {
  const scope = globalThis as unknown as { document?: unknown };
  const had = 'document' in scope;
  const previous = scope.document;
  scope.document = {
    createElement: (tag: string): unknown => {
      if (tag !== 'canvas') throw new Error(`the material builders asked for a <${tag}> element`);
      return { width: 0, height: 0, getContext: () => null };
    },
  };
  try {
    return run();
  } finally {
    if (had) scope.document = previous;
    else delete scope.document;
  }
}

/** The real materials, built and switched through the shipped path. */
function materialsFor(key: ColorKey): PhoneMaterials {
  const materials = withCanvasStub(() => createMaterials());
  applyColorway(materials, key);
  return materials;
}

/**
 * WCAG relative luminance of a built colour, 0..1 — the quantity the rail/panel
 * ratio is taken in.
 *
 * The conversion names `THREE.SRGBColorSpace`, and that is load-bearing rather
 * than decoration: `THREE.Color` stores its channels in the renderer's linear
 * working space, so reading `r`/`g`/`b` is already linear and a linear *transfer*
 * applied on top of them would darken every ratio. Asking for the sRGB channels
 * by name and linearising those is the same arithmetic whichever space the store
 * happens to hold.
 */
function relativeLuminance(color: THREE.Color): number {
  const srgb = new THREE.Color();
  color.getRGB(srgb, THREE.SRGBColorSpace);
  const channel = (value: number): number =>
    value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  return 0.2126 * channel(srgb.r) + 0.7152 * channel(srgb.g) + 0.0722 * channel(srgb.b);
}

/** One line of `scene.ts`, read because the value has no node-reachable reader:
 *  `createStage` builds a `WebGLRenderer` and cannot run without a WebGL
 *  context. This pins the declaration, not the live scene — the pixel gate is
 *  what exercises the live one. */
function sceneSource(): string {
  return readFileSync(new URL('./scene.ts', import.meta.url), 'utf8');
}

/**
 * The dark optics: the LiDAR window, the lens glass and the pupil, pinned as
 * inputs with the pixels they were fitted against in the message.
 *
 * These three are one class, and round 8 found it by looking at a frame: with a
 * working environment, a dielectric returns its Fresnel fraction of the studio,
 * and on a surface facing the camera that fraction is large enough to turn a
 * near-black window into a grey disc and to draw a bright liner along every
 * lens's glass. The reference's own steps are what the retune is fitted to —
 * measured on `.shots/ref/Apple-iPhone-17-Pro-camera-close-up-250909_big.png`,
 * the LiDAR window reads 12 luma (p05 5, p50 9) against a 94.5-luma plateau, and
 * the lens rim steps 88 to 119.
 *
 * The pixel numbers are the `after` arm of the same-rect, same-pose comparison
 * in `.shots/sliceR/` (ignored scratch, not tracked): `before` is the frame set
 * `.shots/k2/final/` at the revision this round started from, `after` is the
 * close-up and `back` presets re-shot through `scripts/capture-shots.mjs` at
 * 1400x1000. `closeUpRect` names the rect each luma was read over and
 * `surroundCloseUp` the value beside it that did not move — because a previous
 * slice in this repo shipped a claim no one could reproduce for want of exactly
 * that. This file still bounds inputs and not pixels: a green pin here with the
 * look gone is possible, and `check:finishes` is the other half.
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
 * 43. On the model the brightest pixel is the rail's own edge at 238 (x 1341,
 * y 308, identical in both arms), so the strip is not the brightest thing in the
 * frame and never was; it was brighter than the part it is cut into, and that is
 * the read that was wrong.
 *
 * The window it was fitted to is 20–45 — 1.8x to 4x the pocket, well under the
 * rail — so 43 is inside it, though 8 above the 25–35 the handover's arithmetic
 * predicted from a 0.39-linear environment term: that estimate averaged the
 * studio, and this strip mirrors what is *under* the phone instead. The port's
 * read is the mouth plate's rounded aperture and the 11-luma pocket behind it;
 * this is the detail inside.
 *
 * The two arms are `.shots/tongue/before/` and `.shots/tongue/after/` (ignored
 * scratch, not tracked), both the `port` sweep — `bottom:cosmic-orange:wheel=-2`
 * through `scripts/sweep-iphone.mjs` at 1400x1000 — so the comparison holds the
 * pose still. The other arm in the same sweep, the `camera-closeup` frame, is
 * byte-identical between them (sha256 489ac92b…), which is the evidence that
 * nothing outside the port moved.
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

describe('the look’s inputs', () => {
  it('sets every finish’s frame to the values the ratios were fitted with', () => {
    for (const key of COLOR_KEYS) {
      const materials = materialsFor(key);
      const pin = FRAME[key];
      expect(materials.aluminum.metalness, `${key}: the frame's metalness`).toBe(FRAME_METALNESS);
      expect(materials.aluminum.roughness, `${key}: the frame's roughness`).toBe(pin.roughness);
      expect(materials.aluminum.clearcoat, `${key}: the frame's clearcoat`).toBe(pin.clearcoat);
      expect(
        materials.aluminum.anisotropy,
        `${key}: the frame's anisotropy is nonzero — 0.55 drew a hard black band along the plateau's roll`,
      ).toBe(0);
      expect(
        materials.aluminum.color.getHexString(THREE.SRGBColorSpace),
        `${key}: the frame's tint, which is the rail's albedo`,
      ).toBe(pin.tint);

      // The pills are the same anodized metal, cloned: a colourway switch has to
      // leave them carrying the frame's finish, or the ratio's surface and the
      // part beside it disagree.
      expect(materials.button.roughness, `${key}: the button pills' roughness`).toBe(pin.roughness);
      expect(materials.button.clearcoat, `${key}: the button pills' clearcoat`).toBe(pin.clearcoat);
      expect(materials.button.anisotropy, `${key}: the button pills' anisotropy`).toBe(0);
      expect(materials.button.color.getHexString(THREE.SRGBColorSpace), `${key}: the button pills' tint`).toBe(
        pin.tint,
      );
    }
  });

  it('keeps each panel above its frame, silver’s included', () => {
    for (const key of COLOR_KEYS) {
      const materials = materialsFor(key);
      const frame = relativeLuminance(materials.aluminum.color);
      const panel = relativeLuminance(materials.backGlass.color);
      expect(
        panel,
        `${key}: the panel reads ${panel.toFixed(4)} against the frame's ${frame.toFixed(4)} — the rail/panel ratio is the frame divided by a panel that must be lighter than it, or the ratio's own reference is on the wrong side of 1`,
      ).toBeGreaterThan(frame);
      expect(
        materials.backGlass.color.getHexString(THREE.SRGBColorSpace),
        `${key}: the panel's albedo`,
      ).toBe(PANEL[key]);
    }
    // Silver is called out on its own because its frame tint is the ratio's
    // level control and its panel deliberately does not follow that tint down.
    const silver = materialsFor('silver');
    const silverFrame = relativeLuminance(silver.aluminum.color);
    const silverPanel = relativeLuminance(silver.backGlass.color);
    expect(
      silverPanel,
      `silver: the panel reads ${silverPanel.toFixed(4)} against the tinted frame's ${silverFrame.toFixed(4)}`,
    ).toBeGreaterThan(silverFrame);
    expect(silverFrame, 'silver: the frame’s relative luminance is not the 0.4852 its tint solves for').toBeCloseTo(
      0.4852,
      3,
    );
  });

  it('keeps the mmWave insert matte, and a darker, less saturated step below the frame', () => {
    for (const key of COLOR_KEYS) {
      const materials = materialsFor(key);
      const window = materials.mmwave;
      const frame = materials.aluminum;

      // Matte and non-metallic, at a stated floor and ceiling rather than at
      // the literals alone, so the bound names the character it protects. A
      // clearcoat would put a second, smoother mirror over the face — the
      // reference's window carries no reflection at all.
      expect(
        window.roughness,
        `${key}: the insert's roughness is below ${String(MMWAVE.roughnessFloor)}, so it is a polish rather than the matte insert the reference shows`,
      ).toBeGreaterThanOrEqual(MMWAVE.roughnessFloor);
      expect(window.roughness, `${key}: the insert's roughness`).toBe(MMWAVE.roughness);
      expect(
        window.metalness,
        `${key}: the insert's metalness is above ${String(MMWAVE.metalnessCeiling)} — a polymer window is a dielectric, and the frame is the metal in this pair`,
      ).toBeLessThanOrEqual(MMWAVE.metalnessCeiling);
      expect(window.metalness, `${key}: the insert's metalness`).toBe(MMWAVE.metalness);
      expect(window.clearcoat, `${key}: the insert carries a clearcoat, a second mirror over the face`).toBe(0);
      expect(window.color.getHexString(THREE.SRGBColorSpace), `${key}: the insert's albedo`).toBe(MMWAVE.tint[key]);

      // The tone is the finish's own hue and a step off its own saturation, so
      // a colourway switch cannot leave it on the wrong dye.
      const windowHsl = { h: 0, s: 0, l: 0 };
      const frameHsl = { h: 0, s: 0, l: 0 };
      window.color.getHSL(windowHsl, THREE.SRGBColorSpace);
      frame.color.getHSL(frameHsl, THREE.SRGBColorSpace);
      expect(
        windowHsl.s,
        `${key}: the insert reads ${windowHsl.s.toFixed(4)} saturation against the frame's ${frameHsl.s.toFixed(4)} — it is the flatter of the two surfaces, not a second coat of the same dye`,
      ).toBeLessThan(frameHsl.s);

      // Darker than the frame where the frame's own albedo has room under it.
      // The rendered step is the same on all three (0.833 orange, 0.831 Deep
      // Blue, 0.836 silver, measured on the `top` view), and it is *not* this
      // quantity that produces it: the frame's brightness is a metal
      // reflection. `MMWAVE.albedoRatio` carries the Deep Blue exception and
      // the numbers behind it.
      const ratio = relativeLuminance(window.color) / relativeLuminance(frame.color);
      expect(
        ratio,
        `${key}: the insert's albedo reads ${ratio.toFixed(3)} of the frame's — the rows solve to ${String(MMWAVE.albedoRatio[key])}`,
      ).toBeCloseTo(MMWAVE.albedoRatio[key], 1);
    }
  });

  it('carries the environment level in the scene, and no per-material envMapIntensity', () => {
    const assignments = [...sceneSource().matchAll(/scene\.environmentIntensity\s*=\s*([\d.]+)/g)];
    expect(assignments.length, 'scene.ts assigns scene.environmentIntensity more than once').toBe(1);
    expect(assignments[0]?.[1], 'the scene’s environment level').toBe(String(ENVIRONMENT_INTENSITY));

    // The old per-material values are gone rather than kept as a table of dead
    // numbers: the renderer overwrites that uniform from the scene for every
    // standard material with no `envMap` of its own, so a value here is read by
    // nothing. Giving a material its own env map is what would make one live,
    // and that change re-adds the line and this expectation with it.
    const materials = readFileSync(new URL('./materials.ts', import.meta.url), 'utf8');
    const dead = [...materials.matchAll(/^\s*envMapIntensity:/gm)];
    expect(dead.length, 'materials.ts carries a per-material envMapIntensity that nothing reads').toBe(0);
  });

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
    // colourway switch must not move them at all.
    const before = DARK_OPTICS_KEYS.map((key) => materials[key].color.getHexString(THREE.SRGBColorSpace));
    expect(before, 'the dark optics’ albedos').toEqual(DARK_OPTICS_KEYS.map((key) => DARK_OPTICS[key].tint));
    for (const key of COLOR_KEYS) {
      const switched = materialsFor(key);
      expect(
        DARK_OPTICS_KEYS.map((name) => switched[name].color.getHexString(THREE.SRGBColorSpace)),
        `${key}: the dark optics are not finish tints, so their albedos must not follow the dropdown`,
      ).toEqual(before);
      for (const name of DARK_OPTICS_KEYS) {
        expect(switched[name].specularIntensity, `${key}: ${name}'s specular level`).toBeCloseTo(
          DARK_OPTICS[name].specularIntensity,
          3,
        );
      }
    }
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
});
