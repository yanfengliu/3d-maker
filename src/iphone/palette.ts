import * as THREE from 'three';

/**
 * The three finishes, and every tone the model derives from one.
 *
 * `materials.ts` holds the materials; this holds the colours they are set to,
 * because the finishes touch more surfaces than the frame and the panel: the
 * polished lens ring, the Camera Control sapphire, the satin logo and the
 * antenna straps are all tints of the finish too, and each needs a different
 * relationship to it. Those relationships live here so `createMaterials` and
 * `applyColorway` cannot disagree about them.
 *
 * Every conversion below names `THREE.SRGBColorSpace` explicitly, and that is
 * load-bearing rather than decoration. `THREE.Color` stores its channels in the
 * renderer's working space, which is linear-sRGB: a `new THREE.Color(0xcf6238)`
 * holds (0.624, 0.122, 0.040), not the (0.81, 0.38, 0.22) those bytes name. An
 * HSL round trip that does not name sRGB is therefore arithmetic on gamma-
 * decoded values, and a "10 % lighter" panel comes out of it visibly darker
 * than the frame it was lifted from — which is exactly how the first pass at
 * these tones went wrong. Measured: unqualified, the orange panel lands at
 * #b73618 against a #9f1f0a frame, both darker than the #cf6238 the palette
 * asked for.
 *
 * Hexes here are sRGB. `#cf6238` is the colour, and the store does the rest.
 */

export type ColorKey = 'cosmic-orange' | 'deep-blue' | 'silver';

export const COLOR_KEYS: readonly ColorKey[] = ['cosmic-orange', 'deep-blue', 'silver'];

export const DEFAULT_COLOR: ColorKey = 'cosmic-orange';

export interface Colorway {
  /** Shown in the dropdown. */
  readonly label: string;
  /** Anodized unibody tint. */
  readonly aluminum: number;
  /** Frame roughness: the anodized sheen is part of the colourway. */
  readonly roughness: number;
  /** Frame clearcoat: the Cosmic Orange depth treatment. */
  readonly clearcoat: number;
  /** How far above the frame's own HSL lightness the panel sits; see below. */
  readonly panelLift: number;
}

/**
 * Frame tints, from Apple's colour-lineup photo. The back panel is *not* here:
 * it is the frame's own hue lifted by `PANEL_LIFT` below, so the panel can
 * never drift into a second colour of its own. It did — a fixed pale panel read
 * salmon-pink on top of the orange frame, and the panel is what fills most of a
 * straight-on back view, so that tint was most of what the colourway looked
 * like.
 */
export const COLORWAYS: Record<ColorKey, Colorway> = {
  // Vivid warm orange with an anodized sheen: slightly smoother than the other
  // two and carrying a little clearcoat, which is what stops it reading flat.
  'cosmic-orange': {
    label: 'Cosmic Orange',
    aluminum: 0xcf6238,
    roughness: 0.62,
    clearcoat: 0.25,
    panelLift: 0.1,
  },
  // Rich, dark navy. The light, grey-blue this used to be read as washed out.
  //
  // The roughest of the three at 0.3, up from 0.24: its rail read 0.530 of its
  // panel against the photo's 0.47 once this round's environment was in, and a
  // rougher lobe is the direction that brings it down.
  'deep-blue': {
    label: 'Deep Blue',
    aluminum: 0x323e57,
    roughness: 0.3,
    clearcoat: 0.18,
    panelLift: 0.1,
  },
  // Cool light silver, not beige: a neutral frame under a near-white panel.
  //
  // Two levers move this rail, and on this finish they move it in opposite
  // directions, which is what makes silver's row the awkward one. Measured on
  // the `back` view, rail band over panel band in relative luminance, with the
  // rail's own cross-section across x 488..510 beside it:
  //
  //   roughness 0.92, tint 0xb8b9bc   rail 191 / panel 228 = 0.670  out of band
  //   roughness 0.42, tint 0xb8b9bc   rail 214 / panel 228 = 0.866  in band
  //
  // A rougher lobe averages more of the dim floor and a smoother one holds more
  // of the bright wall behind the camera, so here roughness *raises* the ratio,
  // and 0.92 sat 0.20 below the 0.87 band. That is why silver's roughness is
  // 0.42 and not the 0.92 the previous round fitted: the environment underneath
  // it changed, and 0.92 no longer lands. The tint then carries the level,
  // walked down from 0xdcdde0 to 0xb8b9bc — 0.7231 to 0.4852 in relative
  // luminance from the built colours — which is what puts the 0.42 rail back on
  // the band. The panel keeps its own albedo through `panelLift` rather than
  // following the tint down: 0.7780 built against 0.7750 before.
  //
  // What this does not fix, because it cannot: on a straight-on back view the
  // rail's visible 26 px is the frame's flat back face, coplanar with the panel
  // beside it, so the two mirror one direction of the room and can differ only
  // in level. A ratio of 0.87 caps that difference at about 14 luma at this
  // exposure, so the mid-grey frame against a light panel that the reference
  // photo shows is not reachable while the ratio stays in band. What the
  // roughness buys is structure wherever the frame's normal actually turns —
  // the profile views, the buttons, the plateau's rolled edges, the hero view —
  // and it is those surfaces the reference's sheen belongs to.
  silver: {
    label: 'Silver',
    aluminum: 0xb8b9bc,
    roughness: 0.42,
    clearcoat: 0.12,
    panelLift: 0.435,
  },
};

/**
 * The back panel: the frame's own hue, lifted and eased. Frosted glass over the
 * same dye lot, not a lighter colour.
 *
 * The lift is HSL lightness, and it carries a term that shrinks as the frame
 * gets brighter. A flat +0.10 put the silver panel at #f7f7f8, lighter than any
 * real back panel, because a bright frame has less room above it — so the lift
 * is proportional to the room that is left. Measured from the built colours,
 * the orange and blue panels land 0.026 to 0.077 of HSL lightness above their
 * frames: `#cf7754` over `#cf6238`, `#42506e` over `#323e57`. All three stay in
 * the frame's hue, which is the point — a fixed pale panel is what read
 * salmon-pink on the orange frame.
 *
 * The lift is per finish because the frame tint is. Silver's frame carries the
 * tint that its rail/panel ratio needs, and its panel has to stay on the albedo
 * its own photo shows rather than follow that tint down; see the silver row in
 * `COLORWAYS` for the measurement behind both numbers.
 */
const PANEL_DESATURATE = 0.08;

/**
 * How far past the frame's own value each finish's polished lens ring goes,
 * and how polished that ring is.
 *
 * Apple's close-up settles the tint: the ring around each lens is clearly
 * orange on Cosmic Orange and blue on Deep Blue, not bare chrome. Silver's ring
 * is the silver frame with a polish on it and nothing more. A polished surface
 * of the same dye reads brighter and more saturated than the matte rail beside
 * it, so the tint is the frame's hue pushed in both directions — the ring still
 * separates from the plateau it sits on instead of merging into it.
 *
 * The roughness is what fixes the glints, and it is not an environment problem.
 * At 0.22 the crown of the first lens carried 111 pixels at 235 luma and above
 * — hard white bands where the reference has soft highlights on tinted metal.
 * Those pixels are #ffe3ca, #fff6ec: the studio lights' own warm white, not the
 * ring's dye. That is Schlick's term at near-grazing incidence, where
 * reflectance goes to 1 whatever the metal is, so the reflection loses the tint
 * and takes the source's colour. The ceiling cards were halved to test whether
 * the source was theirs (1.15 to 0.62) and the count did not fall — 62 pixels
 * at 1.15, 104 at 0.62 — so the environment is not the lever. Fresnel cannot be
 * dimmed; the lobe has to be spread. At 0.42 the same three rings measure no
 * pixel at 235 or above, their maxima 232, 205 and 205, and the crown keeps its
 * orange.
 *
 * Silver is 0.4 rather than 0.42 — a neutral polish was already the rougher of
 * the three before this round and it stays that way.
 */
const RING_POLISH: Record<
  ColorKey,
  { readonly lift: number; readonly saturate: number; readonly roughness: number }
> = {
  'cosmic-orange': { lift: 1.14, saturate: 1.12, roughness: 0.42 },
  'deep-blue': { lift: 1.34, saturate: 1.15, roughness: 0.42 },
  silver: { lift: 1.0, saturate: 1, roughness: 0.4 },
};

/**
 * The Apple logo, and the Camera Control cover: the two surfaces that step
 * *down* from the frame or its panel, per finish.
 *
 * Each row is a hue, a saturation and an HSL lightness, and the lightness came
 * from solving for a target relative luminance rather than from a multiplier on
 * the surface's own value. That distinction is the fix. A multiplier of
 * relative luminance is what "10 % darker" sounds like, and on a dark finish it
 * is unusable: relative luminance is dominated by the green channel and by
 * gamma, so 0.88 of the Deep Blue panel's luminance is near-black, and the
 * orange's 0.88 is a dark chocolate with none of the panel's hue left in it.
 * The last round's scalar logo measured 70 to 85 % of relative luminance below
 * its panel on every finish — that is the "too dark" half of the defect,
 * reached by exactly that arithmetic.
 *
 * `hue` is in turns, three.js's own unit (0.2 = 72° of the 360° wheel).
 */

/**
 * Camera Control: a dark *shade of that finish*, which is why its hue is the
 * frame's. Measured, these rows land at 0.20, 0.30 and 0.32 of their frame's
 * relative luminance — `#141922` on Deep Blue, `#7e8088` on Silver, `#733c2f`
 * on Cosmic Orange. Dark enough to read as the deep glossy strip Apple's photos
 * show, none of the three near-black. A constant fraction of the frame's *own*
 * lightness cannot serve all three: 0.85 of the Deep Blue frame lands three
 * steps from the frame and reads as a smear, while 0.85 of the silver frame is
 * a mid grey with the Camera Control's dark strip nowhere in it.
 */
const SAPPHIRE: Record<ColorKey, { readonly hue: number; readonly sat: number; readonly light: number }> = {
  'cosmic-orange': { hue: 12 / 360, sat: 0.42, light: 0.317 },
  'deep-blue': { hue: 220 / 360, sat: 0.27, light: 0.106 },
  silver: { hue: 225 / 360, sat: 0.04, light: 0.512 },
};

/**
 * The Apple logo: a satin shading of the panel, and nothing else.
 *
 * Every row is solved to land at half its panel's relative luminance — measured
 * 0.496 to 0.501 from the built colours — because that ratio is what stays a
 * *tonal* step on all three finishes at once. Anchoring to the panel and not the
 * frame is not cosmetic:
 * on the orange finish the frame is already well below the panel, so a logo
 * keyed off the frame lands near-black and reads as a hole cut through the
 * glass. The hues are the finishes' own, saturation eased; the orange's dye at
 * full saturation read as rust rather than as a shading of an orange panel, and
 * the silver frame's S is 0.06, so that row is a plain grey.
 */
const LOGO: Record<ColorKey, { readonly hue: number; readonly sat: number; readonly light: number }> = {
  'cosmic-orange': { hue: 15 / 360, sat: 0.32, light: 0.421 },
  'deep-blue': { hue: 220 / 360, sat: 0.16, light: 0.235 },
  silver: { hue: 225 / 360, sat: 0.03, light: 0.66 },
};

/** The antenna straps: a hair above the frame, a little muted — tonal straps
 *  crossing the rail, not cream ribbons and not a black gap. Both figures are
 *  steps in HSL lightness, for the same reason the logo's are: a ratio of the
 *  frame's own value vanishes on a dark finish and blows out on a light one.
 *  Measured, the strap sits 0.06 of lightness above its frame in every finish. */
const ANTENNA_LIFT = 0.06;
const ANTENNA_DESATURATE = 0.25;

/** The frame's HSL in sRGB. */
function frameHsl(way: Colorway): { readonly h: number; readonly s: number; readonly l: number } {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(way.aluminum).getHSL(hsl, THREE.SRGBColorSpace);
  return hsl;
}

/** A colour from sRGB HSL, with the renderer's own conversion applied. */
function fromHsl(h: number, s: number, l: number): THREE.Color {
  const color = new THREE.Color();
  color.setHSL(h, Math.min(1, Math.max(0, s)), Math.min(1, Math.max(0, l)), THREE.SRGBColorSpace);
  return color;
}

/** The panel: the frame's hue, lifted `panelLift` and eased, with less room to
 *  rise the brighter the frame already is. */
export function panelColor(way: Colorway): THREE.Color {
  const hsl = frameHsl(way);
  const room = 1 - hsl.l * 0.85;
  return fromHsl(hsl.h, hsl.s * (1 - PANEL_DESATURATE), hsl.l + way.panelLift * room);
}

/** The polished ring's colour: the frame's own hue, polished — the dye's chroma
 *  kept while the extra lightness is what makes it read as metal. */
export function ringColor(way: Colorway, key: ColorKey): THREE.Color {
  const polish = RING_POLISH[key];
  const hsl = frameHsl(way);
  return fromHsl(hsl.h, hsl.s * polish.saturate, hsl.l * polish.lift);
}

/** The polished ring's roughness, per finish: silver's ring has to spread the
 *  softbox across its face rather than mirror the studio's dark wall. */
export function ringRoughness(key: ColorKey): number {
  return RING_POLISH[key].roughness;
}

/** Camera Control's cover: a dark shade of the finish's own hue, so it reads as
 *  a glossy dark strip rather than as a hole in the frame. */
export function sapphireColor(key: ColorKey): THREE.Color {
  const tone = SAPPHIRE[key];
  return fromHsl(tone.hue, tone.sat, tone.light);
}

/** The satin logo inlay: a shading of the panel it sits in, never a black
 *  inlay. */
export function logoColor(key: ColorKey): THREE.Color {
  const tone = LOGO[key];
  return fromHsl(tone.hue, tone.sat, tone.light);
}

/** The MagSafe ring: the panel's own colour exactly, with no lift at all.
 *  Apple's photos show no ring on the back panel, and any lift whatsoever drew
 *  a faint circle in the straight-on back view; what separates the part now is
 *  its roughness alone. */
export function magsafeColor(way: Colorway): THREE.Color {
  return panelColor(way);
}

/** The antenna straps: the frame's hue, a step lighter and a little muted —
 *  tonal straps crossing the rail, not cream ribbons. */
export function antennaColor(way: Colorway): THREE.Color {
  const hsl = frameHsl(way);
  return fromHsl(hsl.h, hsl.s * (1 - ANTENNA_DESATURATE), hsl.l + ANTENNA_LIFT);
}

export function isColorKey(value: string | null | undefined): value is ColorKey {
  return value === 'cosmic-orange' || value === 'deep-blue' || value === 'silver';
}


