import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { applyColorway, createMaterials, type PhoneMaterials } from './materials.js';
import { COLOR_KEYS, type ColorKey } from './palette.js';

/**
 * The look's *inputs*, pinned: the frame and scene values the 1400x1000 `back`
 * view's rail-over-panel ratio is built from.
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
 * The literals are transcribed from round 7's measurement rather than read from
 * `palette.ts`: a pin that copies the symbol it checks proves only that the code
 * agrees with itself. A deliberate retune updates this table, `palette.ts` and
 * `check:finishes`'s targets together, and this file goes red until it does.
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
 * `materials.ts`'s `MMWAVE_TONE`: a pin that copies the symbol it checks proves
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
});
