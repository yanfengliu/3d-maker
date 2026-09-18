import * as THREE from 'three';

import {
  antennaColor,
  COLORWAYS,
  DEFAULT_COLOR,
  logoColor,
  magsafeColor,
  panelColor,
  ringColor,
  ringRoughness,
  sapphireColor,
  type ColorKey,
} from './palette.js';
import { brushedNormalMap, glowTexture } from './textures.js';

/**
 * Every material in the phone model, plus the procedural maps that give the
 * surfaces their micro-detail. Nothing here is fetched: the brushed-metal and
 * lens-flare textures are drawn into canvases at module scope in `textures.ts`.
 *
 * Colour is the only thing the dropdown changes, and it changes on these
 * shared instance colours only — no geometry is rebuilt, ever. The finishes
 * themselves, and the tones derived from them, live in `palette.ts`; this file
 * is the materials those tones are set on.
 *
 * The `envMapIntensity` values below are inert while `scene.environment` is set
 * and the material has no `envMap` of its own: the renderer overwrites that
 * uniform with `scene.environmentIntensity` for every standard material, so
 * `scene.ts` is the only brightness control that is read. They are left as they
 * are because they are the values each surface was fitted to, and because
 * giving one material its own `envMap` turns them back on a surface at a time.
 */

export type { ColorKey, Colorway } from './palette.js';
export { COLOR_KEYS, DEFAULT_COLOR, COLORWAYS, isColorKey } from './palette.js';

export interface PhoneMaterials {
  /** Anodized 7000-series unibody and camera plateau. */
  readonly aluminum: THREE.MeshPhysicalMaterial;
  /** Matte Ceramic Shield back panel. */
  readonly backGlass: THREE.MeshPhysicalMaterial;
  /** Polished steel, deliberately light: the USB-C connector tongue. */
  readonly tongue: THREE.MeshPhysicalMaterial;
  /** Near-black glossy cover glass, screen off. */
  readonly frontGlass: THREE.MeshPhysicalMaterial;
  /** The (unlit) OLED behind that glass. */
  readonly screen: THREE.MeshPhysicalMaterial;
  /** Dynamic Island and front-camera window. */
  readonly island: THREE.MeshPhysicalMaterial;
  /** Polished lens barrels, tinted to the frame like the real part. */
  readonly lensRing: THREE.MeshPhysicalMaterial;
  /** Dark, dark-blue pupil at the centre of each lens. */
  readonly lensPupil: THREE.MeshPhysicalMaterial;
  /** Domed lens glass with an iridescent coating. */
  readonly lensGlass: THREE.MeshPhysicalMaterial;
  /** The barrel's interior: dark, smooth gunmetal, drawn double sided. */
  readonly aperture: THREE.MeshPhysicalMaterial;
  /** LED flash window: matte pale, not emissive. */
  readonly flash: THREE.MeshPhysicalMaterial;
  /** LiDAR and pinhole glass. */
  readonly darkGlass: THREE.MeshPhysicalMaterial;
  /** Sapphire Camera Control cover. */
  readonly sapphire: THREE.MeshPhysicalMaterial;
  /** Anodized pill buttons: the frame's own finish, so only the seam reads. */
  readonly button: THREE.MeshPhysicalMaterial;
  /** The thin shadowed gap where a button leaves the frame. */
  readonly seam: THREE.MeshStandardMaterial;
  /** Antenna lines: the rail's own hue, a measured step lighter and muted. */
  readonly antenna: THREE.MeshStandardMaterial;
  /** USB-C shell and speaker/mic bores: opaque black, no reflections. */
  readonly bore: THREE.MeshStandardMaterial;
  /** Satin Apple logo inlay. */
  readonly logo: THREE.MeshPhysicalMaterial;
  /** MagSafe ring: a tonal whisper in the panel, not a chrome wire. */
  readonly magsafe: THREE.MeshPhysicalMaterial;
  /** Sprites that soften the lens hotspots. */
  readonly glow: THREE.SpriteMaterial;
}

export function createMaterials(): PhoneMaterials {
  const way = COLORWAYS[DEFAULT_COLOR];
  // One brushed map, shared by the rail and the buttons so the pills cannot
  // drift away from the frame's finish.
  const brushed = brushedNormalMap();

  // The frame is anodized aluminum with a brushed grain, and the grain is
  // carried by `normalMap` alone (anisotropy is 0; see below).
  //
  // `metalness: 0.7` is the one value here that is a claim about the material
  // rather than a fit to a photograph. A bare mirror at 0.9 was wrong because
  // anodizing grows an oxide layer that scatters, and a dielectric at 0.15 was
  // wrong in the other direction — no aluminum there at all, and the frame's
  // brightness was being bought by lighting a nearly-diffuse surface with a
  // dark studio. Both of those were shipped in earlier rounds. Anodized
  // aluminum is a metal whose oxide scatters, so the frame sits high with a
  // rough lobe; 0.7 is inside that range and, measured on the ladder below, it
  // is where all three finishes' ratios land.
  //
  // The ratios are the `back` view's rail band over its panel band, in relative
  // luminance, through the CDP read-back in `.shots/k2/` (ignored scratch, not
  // tracked), against gsmr-040 (orange 0.73), the colour-lineup photo (silver
  // 0.87) and gsmr-019 (blue 0.47). Measured after this round's environment:
  // orange 0.741, Deep Blue 0.518, silver 0.863 — all three inside the 0.05
  // tolerance, the widest being Deep Blue at +0.048.
  //
  // The per-finish `roughness` is a real lever: at `metalness: 0.7` the frame
  // reflects a bright, structured environment, so a rougher lobe averages more
  // of the dim floor and a smoother one holds more of the bright panels. It is
  // not the only one, and for silver it is no longer the level control at all:
  // silver's roughness is now set by what makes its rail look like metal, and
  // its *tint* carries the ratio. `palette.ts` has that ladder.
  //
  // `anisotropy` stays 0. At 0.55 it drew a hard black band along the plateau's
  // rolled shoulder, where the real part shows a soft dark-to-bright gradient:
  // the stripe's darkest row was rgb(0,0,0) beside a 175-luma highlight —
  // contrast 175:1, a black line however the surface is lit. Every non-zero
  // value tried (0.55, 0.4, 0.25, 0.12, 0.1) reproduced it, so this is not a
  // setting to tune down, it is on or off: it survived every other candidate,
  // including `roughness` 0.6, the studio shell repainted, the normal map
  // removed and the shadow map off, so it is the anisotropy term specifically.
  // Re-checked after this round's environment change, and harder than before:
  // five grazing frames from the closeup preset across the three finishes, 15
  // columns each from y 60 to 900 at 2 px steps, every column scanned for the
  // longest run at luma 3 or below — 0 px on all five, and the darkest luma the
  // scan found anywhere is 5.
  //
  // What this still costs: the plateau's flat face renders as one tone. That is
  // not a material setting — the face is a flat plane with one normal, so every
  // point on it sees the same environment and the same lights, and the measured
  // column across it is constant to within 1 luma out of 255. The reference
  // photo's falloff there is its own softbox being close and the face being
  // very slightly domed; both are geometry, and geometry is not this file.
  const aluminum = new THREE.MeshPhysicalMaterial({
    color: way.aluminum,
    metalness: 0.7,
    roughness: way.roughness,
    clearcoat: way.clearcoat,
    clearcoatRoughness: 0.28,
    anisotropy: 0,
    normalMap: brushed,
    normalScale: new THREE.Vector2(0.12, 0.12),
    envMapIntensity: 1,
  });

  // Matte Ceramic Shield panel: the frame's own hue, lifted in lightness by the
  // finish's own `panelLift` with a little of the saturation eased out —
  // frosted glass over the same dye lot. Its clearcoat is a faint sheen over the
  // frost rather than a polish: 0.14 at 0.42 clearcoat roughness, which keeps
  // the panel matte while it still catches the studio.
  const backGlass = new THREE.MeshPhysicalMaterial({
    color: panelColor(way),
    metalness: 0.05,
    roughness: 0.38,
    clearcoat: 0.14,
    clearcoatRoughness: 0.42,
    envMapIntensity: 0.9,
  });

  // The port's tongue. It is steel, and it has to be *light*: it is the only
  // surface in the port that catches the low key light in the bottom view, and
  // the dark version read as an empty slot rather than a connector.
  const tongue = new THREE.MeshPhysicalMaterial({
    color: 0xa9aeb6,
    metalness: 1,
    roughness: 0.21,
    anisotropy: 0.4,
    envMapIntensity: 1.7,
  });

  // Cover glass over an unlit OLED: near-black, glossy, and *smooth*. The
  // display used to carry a coarse procedural map that dithered into a
  // staircase across the panel; both layers are plain now.
  //
  // The albedos came down with the environment — 0x10131a to 0x060709 on the
  // cover glass, 0x0b0e14 to 0x05070a on the OLED. The old pair was dark
  // because it had to be: the environment it was lit by was black, so the same
  // rebate that kept the face off pure black bought almost no light back. The
  // new environment really does light it, and at the old albedos the screen
  // measured 105 luma through the read-back (rgb 105,105,108 at x 500..700,
  // y 300..500 of the front view) against the old build's 1.
  //
  // That albedo change was not enough on its own, and the reason is geometric
  // rather than chromatic. A flat mirror shows one direction of the room, and
  // the face here is flat: at the `front` preset's 1702 mm stand-off the 141 mm
  // cover glass sweeps its reflection through 2.4 degrees vertically and 1.2
  // horizontally. A wall-sized source inside those two degrees is returned as
  // one value for the whole face, which is how the screen measured 103 luma
  // with its minimum and maximum *equal* — a grey slab that no albedo can
  // rescue, because a dielectric returns only its Fresnel fraction of what it
  // mirrors, 0.043 on the base layer at this `ior` plus 0.04 on the clearcoat.
  // The fix is in `scene.ts`: the wall in front of the camera is now two small
  // cards whose edges fall inside those two degrees. Measured on the same rect:
  // mean 64, second percentile 44, median 51, maximum 110.
  //
  // Nothing here is a lever for that; `envMapIntensity` on this material is
  // dead like every other one (see `scene.ts`), which is why the value below is
  // still 1.9 and still not what sets the level.
  const frontGlass = new THREE.MeshPhysicalMaterial({
    color: 0x060709,
    metalness: 0,
    roughness: 0.055,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.9,
    ior: 1.52,
  });

  const screen = new THREE.MeshPhysicalMaterial({
    color: 0x05070a,
    metalness: 0,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.2,
  });

  // Dynamic Island. Near-black would be correct for a dark screen but then the
  // pill is indistinguishable from the display behind it, so it carries a
  // faint grey lift and a strong clearcoat — enough to catch a highlight and
  // read as a separate glossy part. Its albedo is a hair *above* the OLED's and
  // its environment response stronger (1.7 against 1.2), so the sheen that
  // picks the pill out is its own reflection rather than the display behind it;
  // both stay dark enough that the face reads as a switched-off screen.
  const island = new THREE.MeshPhysicalMaterial({
    color: 0x15181f,
    metalness: 0.12,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.7,
  });

  // The polished barrel: polished metal *tinted to the finish*, which is what
  // Apple's close-up shows — the ring around each lens is clearly orange on
  // Cosmic Orange and blue on Deep Blue, not bare chrome. A neutral ring is
  // wrong twice over: it reads as chrome on the two colourways, and on a
  // tinted plateau a matching tint still separates from the matte aluminum
  // because the polished surface is brighter and more saturated than the dye.
  //
  // The roughness is per finish and it is the whole glint control; `palette.ts`
  // carries the measurement. Silver sits at 0.4 against the tinted finishes'
  // 0.42 — it was already the rougher polish before this round, because a
  // neutral mirror of the studio wall reads as charcoal rather than as silver.
  const lensRing = new THREE.MeshPhysicalMaterial({
    color: ringColor(way, DEFAULT_COLOR),
    metalness: 1,
    roughness: ringRoughness(DEFAULT_COLOR),
    envMapIntensity: 1.6,
  });

  // The pupil is the eye-catch: small, brighter near-black blue, proud of the
  // glass so a tight highlight lands on it.
  const lensPupil = new THREE.MeshPhysicalMaterial({
    color: 0x16283f,
    metalness: 0.2,
    roughness: 0.07,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.7,
  });

  // Camera glass, and it has to read as glass: a very dark blue-black element
  // with a clearcoat and a trace of iridescence. The element before this round
  // had its environment response almost switched off (0.28) to stop it
  // mirroring the studio back as a slate-grey coin, and the cure was worse than
  // the disease — a lens with no reflection at all is a black void, which is
  // exactly how the close-up read. The reflection is back up, the albedo is
  // deep blue-black rather than neutral, and the iridescent coating carries the
  // blue sheen the real element shows at an angle.
  const lensGlass = new THREE.MeshPhysicalMaterial({
    color: 0x05070d,
    metalness: 0.0,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    iridescence: 0.45,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [140, 460],
    envMapIntensity: 1.15,
    ior: 1.6,
  });

  // Inside the barrel: dark gunmetal, not the pale grey that flattened the
  // lenses into grey coins. Double sided because the barrel is an open tube and
  // the camera looks into it. Also the plateau's thin dark surrounds — the
  // LiDAR bezel and the mic pinhole — which is why it has no clearcoat: a
  // hairline ring with a highlight on it draws a bright circle instead of a
  // shadow line.
  const aperture = new THREE.MeshPhysicalMaterial({
    color: 0x1b1f27,
    metalness: 0.65,
    roughness: 0.34,
    envMapIntensity: 0.4,
    side: THREE.DoubleSide,
  });

  // The LED flash window: a matte pale window, and NOT a light source. It used
  // to carry `emissive: 0xfff2d6` at 0.85, which under ACES tone mapping came
  // out as a pure white blown disc in every view — brighter than the studio's
  // own softboxes. The real part is a window you look *at*: pale, matte, and
  // very slightly cool. The warm cream it held until this round is what made
  // it read as a lit lamp against the orange plateau.
  //
  // The albedo came down with the environment. At 0xe9ebee this window
  // measured 230 luma on the back view — the brightest thing on the plateau,
  // brighter than the plateau's own highlight, which is not what a window you
  // look at does. The reference close-up's own flash window measures 176 at its
  // rim and 216 in the middle, and at 0xa9adb2 this one measures 206 there.
  const flash = new THREE.MeshPhysicalMaterial({
    color: 0xa9adb2,
    metalness: 0,
    roughness: 0.6,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
    envMapIntensity: 0.55,
  });

  // LiDAR, the mic pinhole and the island's front camera: dark glass windows.
  //
  // This one is the same over-response as the cover glass, measured the same
  // way. The reference close-up's LiDAR window is at 9 to 19 luma against a
  // 75-luma plateau around it — a near-black window, 0.13 to 0.25 of its
  // surround. This one measured 96 against a 154-luma plateau before the
  // environment existed and 107 against 159 after: 0.67 of its surround, a grey
  // disc, and the brightest it has ever been. Clearcoat 1 over a 0.08 roughness
  // is a mirror for the whole studio on a window that should hold almost none
  // of it. Measured down that ladder on the same rect: clearcoat 1 at roughness
  // 0.08 is 107, clearcoat 0.5 at roughness 0.12 is 85, and clearcoat 0.2 at
  // roughness 0.3 — what is below — is 68, 0.43 of the plateau.
  const darkGlass = new THREE.MeshPhysicalMaterial({
    color: 0x090c12,
    metalness: 0.2,
    roughness: 0.3,
    clearcoat: 0.2,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.6,
  });

  // Camera Control's cover: a *dark shade of the finish*, not a black hole.
  // Measured at 0.20, 0.30 and 0.32 of the frame's relative luminance (Deep
  // Blue, Silver, Cosmic Orange in `palette.ts`'s `SAPPHIRE` rows) — dark
  // enough to read as a deep glossy strip, light enough that the studio sheen
  // and the frame's own hue both survive on it. HSL lightness is not the
  // measure here: the same rows sit at 0.40 to 0.62 of it, a ratio that says
  // nothing about how dark the strip reads.
  const sapphire = new THREE.MeshPhysicalMaterial({
    color: sapphireColor(DEFAULT_COLOR),
    metalness: 0.28,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.7,
  });

  // The pills are the same anodized metal as the rail, dyed in the same bath.
  // A separately tinted "button colour" is what made them read as dark bronze
  // slabs bolted to the side; the only thing that separates a button from the
  // frame is the shadowed seam around its base.
  const button = aluminum.clone();

  const seam = new THREE.MeshStandardMaterial({
    color: 0x0a0b0d,
    metalness: 0.2,
    roughness: 0.85,
  });

  // Antenna bands: the frame's own hue, a hair lighter and muted — the polymer
  // straps Apple's photos show as a slightly paler line crossing the rail, not
  // a cream ribbon.
  //
  // This is tuned against measurement, not against a feeling, because two
  // rounds shipped bands that were present on the model and invisible in every
  // view. The colour is a measured step off the rail rather than a fraction of
  // it; the metalness is what keeps the strap legible, because a metal rail
  // *reflects* the softboxes and blows to white along an edge, so a strap
  // within a shade of that albedo blows out with it. This finish mirrors a
  // *darker* part of the studio than the flat wall beside it, and so reads
  // against the rail instead of dissolving into it.
  const antenna = new THREE.MeshStandardMaterial({
    color: antennaColor(way),
    metalness: 0.62,
    roughness: 0.42,
    side: THREE.DoubleSide,
  });

  const bore = new THREE.MeshStandardMaterial({
    color: 0x040406,
    metalness: 0,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  // The inlay is satin, so it is *darker* than the matte panel it sits in —
  // that tonal step is what makes it read, not its shape alone. Tying it to the
  // frame colour by a scalar is what it used to do, and one scalar cannot serve
  // three panels: 0.45 of the orange rail landed near-black, 0.45 of the silver
  // rail was still a light grey, and the logo came out as an inlay on one
  // colourway and a smudge on another. These rows are solved instead to half
  // the panel's relative luminance — measured 0.496 to 0.501 of it across the
  // three finishes — a step that stays tonal on all of them, satin rather than
  // mirror.
  const logo = new THREE.MeshPhysicalMaterial({
    color: logoColor(DEFAULT_COLOR),
    metalness: 0.45,
    roughness: 0.3,
    clearcoat: 0.35,
    clearcoatRoughness: 0.35,
    envMapIntensity: 1.1,
  });

  // MagSafe: the panel's own colour exactly, and a hair smoother — which turns
  // out to be unobservable, because the part renders nothing at all. All but
  // the outermost sliver of its tube is buried inside an opaque panel, so this
  // ring draws no pixel from any angle a viewer can reach. Measured by forcing
  // its colour to 0xff0000 and diffing against the clean build: the `back`,
  // `hero`, `left` and `top` frames are byte-identical, 0 differing pixels over
  // a threshold of 6 summed channel levels. So there is nothing here for a
  // working environment to expose, and the "invisible straight-on" requirement
  // is met by the geometry rather than by this material's roughness. Kept as
  // the panel tone in case the part is ever posed proud of the panel.
  const magsafe = new THREE.MeshPhysicalMaterial({
    color: magsafeColor(way),
    metalness: 0.05,
    roughness: 0.34,
    envMapIntensity: 0.9,
  });

  const glow = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: 0xcfe0ff,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return {
    aluminum,
    backGlass,
    tongue,
    frontGlass,
    screen,
    island,
    lensRing,
    lensPupil,
    lensGlass,
    aperture,
    flash,
    darkGlass,
    sapphire,
    button,
    seam,
    antenna,
    bore,
    logo,
    magsafe,
    glow,
  };
}

/**
 * Repaints the colour-bearing materials in place. The brushed normal map is
 * shared by every colourway, so switching only nudges a handful of colours and
 * the three finish scalars that differ between them: the frame's roughness and
 * clearcoat, and the polished ring's roughness.
 *
 * The optics are in this list deliberately: the polished ring, the Camera
 * Control sapphire, the logo and the MagSafe ring are all tints of the finish,
 * and a colourway switch that repainted only the frame and the panel would
 * leave an orange lens ring on a Deep Blue phone.
 */
export function applyColorway(materials: PhoneMaterials, key: ColorKey): void {
  const way = COLORWAYS[key];
  materials.aluminum.color.setHex(way.aluminum);
  materials.aluminum.roughness = way.roughness;
  materials.aluminum.clearcoat = way.clearcoat;
  materials.backGlass.color.copy(panelColor(way));
  // The pills carry the frame's finish exactly: same colour, same sheen.
  materials.button.color.setHex(way.aluminum);
  materials.button.roughness = way.roughness;
  materials.button.clearcoat = way.clearcoat;
  // Antenna straps are the same dye lot, a step lighter and muted.
  materials.antenna.color.copy(antennaColor(way));
  // Polished optics: the ring's tint and polish, and Camera Control's dark
  // sapphire.
  materials.lensRing.color.copy(ringColor(way, key));
  materials.lensRing.roughness = ringRoughness(key);
  materials.sapphire.color.copy(sapphireColor(key));
  materials.logo.color.copy(logoColor(key));
  materials.magsafe.color.copy(magsafeColor(way));
}


