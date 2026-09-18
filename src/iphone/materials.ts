import * as THREE from 'three';

import {
  antennaColor,
  COLORWAYS,
  DARK_GLASS_REFLECT,
  DEFAULT_COLOR,
  logoColor,
  magsafeColor,
  mmwaveColor,
  MMWAVE_METALNESS,
  MMWAVE_ROUGHNESS,
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
 * No material here carries an `envMapIntensity`, and the level is not in this
 * file: while `scene.environment` is set and the material has no `envMap` of its
 * own, the renderer overwrites that uniform with `scene.environmentIntensity` on
 * every standard material, every frame (three 0.185, `WebGLRenderer.js` line
 * 2694, guarded by `material.envMap === null && scene.environment !== null`), so
 * `scene.ts`'s one value is the only brightness control that is read. The values
 * that sat here were never read — the `back` frame is byte-identical at 0, 1, 2
 * and 8 — and a material that grows its own `envMap` needs one back.
 *
 * `specularIntensity` is the other lever these materials carry, and it is a
 * live one: three sets `specularF90 = specularIntensity` for a dielectric as
 * soon as the value is not 1 (`lights_physical_fragment`, three 0.185), so it
 * scales both ends of the Fresnel term rather than only its normal-incidence
 * end. That is what matters on the dark optics this round retuned: a dielectric
 * returns its Fresnel fraction of the studio, and at grazing incidence that
 * fraction is 1 whatever the surface is. `palette.ts`'s ring note measured the
 * same thing as an undimmable 235-luma band and spread the lobe instead; on a
 * window facing the camera the lobe is not the problem, the level is. Each
 * retuned material below carries its own measured ladder.
 */

export type { ColorKey, Colorway } from './palette.js';
export { COLOR_KEYS, DEFAULT_COLOR, COLORWAYS, isColorKey } from './palette.js';

export interface PhoneMaterials {
  /** Anodized 7000-series unibody and camera plateau. */
  readonly aluminum: THREE.MeshPhysicalMaterial;
  /** Matte Ceramic Shield back panel. */
  readonly backGlass: THREE.MeshPhysicalMaterial;
  /** Dark steel: the USB-C connector tongue, a strip in the port's pocket. */
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
  /** US mmWave antenna window: a matte polymer insert in the top edge. */
  readonly mmwave: THREE.MeshPhysicalMaterial;
  /** MagSafe ring: a tonal whisper in the panel, not a chrome wire. */
  readonly magsafe: THREE.MeshPhysicalMaterial;
  /** Sprites that soften the lens hotspots. */
  readonly glow: THREE.SpriteMaterial;
}

/** How far the pills' seam's albedo sits below the frame's it is cut into, in
 *  linear luminance: 0.2594 is the shade of the finish that renders the
 *  reference's own 0.494-0.572 base shadow. It is a shade of the *finish* and
 *  not one grey — `optics.test.ts`'s `BUTTON_SEAM` carries the cross-finish
 *  ladder, and why one grey cannot be the same step below all three frames. */
const SEAM_SHADE = 0.2594;

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
  // wrong the other way — no aluminum there at all, the frame's brightness bought
  // by lighting a nearly-diffuse surface with a dark studio; both shipped in
  // earlier rounds. Anodized aluminum is a metal whose oxide scatters, so the
  // frame sits high with a rough lobe, and 0.7 is inside that range and is where
  // all three finishes' ratios land.
  //
  // The ratios are the `back` view's rail band over its panel band, in relative
  // luminance, through the CDP read-back in `.shots/k2/` (ignored scratch),
  // against gsmr-040 (orange 0.73), the colour-lineup photo (silver 0.87) and
  // gsmr-019 (blue 0.47): measured 0.741, 0.518, 0.863 — inside ±0.05, worst +0.048.
  //
  // The per-finish `roughness` is a real lever: at this metalness the frame
  // reflects a bright, structured environment, so a rougher lobe averages more of
  // the dim floor and a smoother one holds more of the bright panels. For silver
  // it is no longer the level control — its roughness is set by what makes its
  // rail look like metal, and its *tint* carries the ratio (`palette.ts`).
  //
  // `anisotropy` stays 0. At 0.55 it drew a hard black band along the plateau's
  // rolled shoulder, where the real part shows a soft dark-to-bright gradient:
  // rgb(0,0,0) beside a 175-luma highlight, a 175:1 line however the surface is
  // lit. Every non-zero value tried (0.55, 0.4, 0.25, 0.12, 0.1) reproduced it
  // and it survived every other candidate — `roughness` 0.6, the studio shell
  // repainted, the normal map removed, the shadow map off — so it is on or off,
  // not a value to tune down. Re-checked after the environment change: five
  // grazing close-up frames across the three finishes, 15 columns each from y 60
  // to 900 at 2 px steps, every column scanned for its longest run at luma 3 or
  // below — 0 px on all five, darkest 5.
  //
  // What this still costs: the plateau's flat face renders as one tone, and that
  // is geometry, not a material — a flat plane sees the same environment and
  // lights, so the column across it is constant to within 1 luma of 255. The
  // reference's falloff there is its own close softbox and a slightly domed face.
  const aluminum = new THREE.MeshPhysicalMaterial({
    color: way.aluminum,
    metalness: 0.7,
    roughness: way.roughness,
    clearcoat: way.clearcoat,
    clearcoatRoughness: 0.28,
    anisotropy: 0,
    normalMap: brushed,
    normalScale: new THREE.Vector2(0.12, 0.12),
  });

  // Matte Ceramic Shield panel: the frame's own hue, lifted by the finish's own
  // `panelLift` with a little saturation eased out — frosted glass over the same
  // dye lot. Its clearcoat is a faint sheen over the frost rather than a polish:
  // 0.14 at 0.42 clearcoat roughness, which keeps the panel matte while it
  // still catches the studio.
  const backGlass = new THREE.MeshPhysicalMaterial({
    color: panelColor(way),
    metalness: 0.05,
    roughness: 0.38,
    clearcoat: 0.14,
    clearcoatRoughness: 0.42,
  });

  // The port's tongue: dark steel, a detail inside a mouth read by its rounded
  // aperture and dark pocket. The `0xa9aeb6` version it replaced rendered 111
  // luma over x 640..740, y 480..484 of the bottom preset against a pocket at 11
  // and a rail at 95 — brighter than the rail, a floating jewel. Albedo through
  // ~0.39 linear of environment and a 1/2.2 encode lands 0x343841 at 43 measured.
  const tongue = new THREE.MeshPhysicalMaterial({
    color: 0x343841,
    metalness: 0.9,
    roughness: 0.42,
    anisotropy: 0.3,
  });

  // Cover glass over an unlit OLED: near-black, glossy, and *smooth*. The display
  // used to carry a coarse procedural map that dithered into a staircase across
  // the panel; both layers are plain now.
  //
  // The albedos came down with the environment — 0x10131a to 0x060709 on the
  // cover glass, 0x0b0e14 to 0x05070a on the OLED — because at the old pair the
  // screen measured 105 luma through the read-back (rgb 105,105,108 at x 500..700,
  // y 300..500 of the front view) against the old build's 1.
  //
  // That was not enough on its own, and the reason is geometric rather than
  // chromatic: a flat mirror shows one direction of the room, and at the `front`
  // preset's 1702 mm stand-off the 141 mm cover glass sweeps its reflection
  // through 2.4 degrees vertically and 1.2 horizontally, so a wall-sized source
  // inside those two degrees returns one value for the whole face — 103 luma with
  // its minimum and maximum *equal*, a grey slab no albedo can rescue, because a
  // dielectric returns only its Fresnel fraction of what it mirrors (0.043 on the
  // base layer at this `ior` plus 0.04 on the clearcoat). `scene.ts` fixed it: the
  // wall in front of the camera is now two small cards whose edges fall inside
  // those degrees — on the same rect, mean 64, p02 44, median 51, maximum 110.
  // Nothing here is a lever for that, and this material carries no `envMapIntensity`:
  // its level is the scene's one value (see the header).
  const frontGlass = new THREE.MeshPhysicalMaterial({
    color: 0x060709,
    metalness: 0,
    roughness: 0.055,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    ior: 1.52,
  });

  const screen = new THREE.MeshPhysicalMaterial({
    color: 0x05070a,
    metalness: 0,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });

  // Dynamic Island. Near-black would be correct for a dark screen, but the pill
  // is then indistinguishable from the display behind it: a faint grey lift and
  // a strong clearcoat catch a highlight and read as a separate part — albedo
  // 0x15181f against the OLED's 0x05070a, clearcoat 0.03 against its 0.05.
  const island = new THREE.MeshPhysicalMaterial({
    color: 0x15181f,
    metalness: 0.12,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  });

  // The polished barrel: polished metal *tinted to the finish*, which is what
  // Apple's close-up shows — the ring around each lens is clearly orange on
  // Cosmic Orange and blue on Deep Blue, not bare chrome. A neutral ring is wrong
  // twice over: it reads as chrome on the two colourways, and on a tinted plateau
  // a matching tint still separates from the matte aluminum because the polished
  // surface is brighter and more saturated than the dye. `palette.ts`'s
  // `RING_POLISH` carries the roughness and its measurement.
  const lensRing = new THREE.MeshPhysicalMaterial({
    color: ringColor(way, DEFAULT_COLOR),
    metalness: 1,
    roughness: ringRoughness(DEFAULT_COLOR),
  });

  // The pupil is the eye-catch: small, brighter near-black blue, proud of the
  // glass so a tight highlight lands on it. It was also the thin bright crescent
  // along the rim of every lens's glass this round, and which surface that was is
  // measured, not reasoned: painting this material red moved the crescent's own
  // pixels from rgb(86,90,99) to rgb(111,91,97) while the glass inside it and the
  // ring outside it did not move, so the liner is the pupil's own rim — a cap 5
  // degrees off its crown normal, reflecting a different direction of the studio.
  // Roughness spreads that slowly, measured on the close-up's 26x6 px band at
  // the pupil's lower rim: p95 169 (max 171) at clearcoat 1 and roughness 0.07;
  // 158 at 0.3; 113 at 0.32 under a 0.35 coat; 94 at 0.5; 84 at 0.7. What
  // lands it is the coat plus the specular level: clearcoat 0 with
  // `specularIntensity` 0.3 renders p95 92 there, and the crown above it is
  // unmoved at 37 luma — the eye-catch survives and the liner does not.
  const lensPupil = new THREE.MeshPhysicalMaterial({
    color: 0x16283f,
    metalness: 0.2,
    roughness: 0.07,
    clearcoat: 0,
    specularIntensity: 0.3,
  });

  // Camera glass: a very dark blue-black element with a trace of iridescence,
  // which carries the blue sheen the real element shows at an angle. What it
  // may not read as is a chrome liner, and the bright crescent at the rim of
  // each lens's glass this round is this surface. Two measurements say so:
  // hiding this material removes the crescent's two pixels entirely (150 and
  // 160 luma down to 99, with the row through the lens centre byte-identical),
  // and painting it red moves them from rgb(167,169,177) to rgb(228,174,179)
  // while the copper band outside them does not move at all. It is the skirt at
  // the rim seen at grazing incidence.
  //
  // Roughness is a weak lever on a grazing term — 169 luma at roughness 0.08
  // under a clearcoat, 133 at 0.3, 147 at 0.55 with none, 143 at 0.9 — because
  // Fresnel at grazing is what it is. `specularIntensity` 0.3 scales both ends
  // of that term and lands it at 102 luma, inside the 88-119 the reference's own
  // rim step measures on the close-up, with the dome unchanged at 35 luma. Its
  // own `envMapIntensity` was once cut to 0.28 for the same reason, and unread.
  const lensGlass = new THREE.MeshPhysicalMaterial({
    color: 0x05070d,
    metalness: 0.0,
    roughness: 0.22,
    clearcoat: 0,
    specularIntensity: 0.3,
    iridescence: 0.45,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [140, 460],
    ior: 1.6,
  });

  // Inside the barrel: dark gunmetal, not the pale grey that flattened the lenses
  // into grey coins. Double sided, because the barrel is an open tube the camera
  // looks into. Also the plateau's LiDAR bezel and mic pinhole, which is why it
  // has no clearcoat: a hairline ring with a highlight draws a bright circle.
  const aperture = new THREE.MeshPhysicalMaterial({
    color: 0x1b1f27,
    metalness: 0.65,
    roughness: 0.34,
    side: THREE.DoubleSide,
  });

  // The LED flash window: a matte pale window, and NOT a light source. It used
  // to carry `emissive: 0xfff2d6` at 0.85, which under ACES tone mapping came
  // out as a pure white blown disc in every view, and at an albedo of 0xe9ebee
  // it measured 230 luma on the back view — brighter than the plateau's own
  // highlight. The reference's window measures 176 at its rim and 216 in the
  // middle; at 0xa9adb2 this one measures 206 there.
  const flash = new THREE.MeshPhysicalMaterial({
    color: 0xa9adb2,
    metalness: 0,
    roughness: 0.6,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
  });

  // LiDAR, the mic pinhole and the island's front camera: the dark glass windows
  // this round's defect was named for. The reference's own measures 12 luma
  // (p05 5, p50 9) over a 94.5-luma plateau, 0.127 of it; this one measured 68
  // against 157 on `back` and 43 against 150 on the close-up, 0.43 and 0.29.
  // Coat and roughness are nearly spent as levers — clearcoat 1 at roughness
  // 0.08 renders 107 luma on the round-7 rect, clearcoat 0.5 at 0.12 is 85,
  // clearcoat 0.2 at 0.3 is 68, clearcoat 0 at roughness 0.62 is still 44 — so
  // the level moves it: 0.45 with no coat renders 30 there and 18 on the
  // close-up, and the gloss survives, since it is the coat and not the polish.
  // One value cannot hold the band, and `palette.ts`'s `DARK_GLASS_REFLECT`
  // carries why: the window reads 30 against plateau faces of 83, 154 and 208,
  // so 0.361 on Deep Blue against a 0.13-0.25 band, orange 0.201 and silver
  // 0.159 inside it. One value would have to be both <= 20.8 luma and >= 27.0;
  // so the reflectivity is per finish and not a tint — the albedo lever made a
  // 180-luma grey disc. `mmwave` and `seam` above are per-finish for the same
  // reason.
  const darkGlass = new THREE.MeshPhysicalMaterial({
    color: 0x090c12,
    metalness: 0.2,
    roughness: 0.3,
    clearcoat: 0,
    specularIntensity: 0.45 * DARK_GLASS_REFLECT[DEFAULT_COLOR],
  });

  // Camera Control's cover: a dark shade of the finish. `palette.ts`'s
  // `SAPPHIRE` rows carry the measurement behind the colour; the polish is
  // what makes it read as a glossy strip rather than a matte dark bar.
  const sapphire = new THREE.MeshPhysicalMaterial({
    color: sapphireColor(DEFAULT_COLOR),
    metalness: 0.28,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });

  // The pills are the same anodized metal as the rail, dyed in the same bath: a
  // separately tinted "button colour" read as dark bronze slabs bolted to the
  // side, and the only separation a button should have is its shadowed seam.
  const button = aluminum.clone();

  // The pills' base shadow, and the hairline the lens rings share (`lens.ts`): the
  // finish's own metal in shadow at `SEAM_SHADE`, not a fixed grey, so the crevice
  // keeps its ratio on a dark frame and a pale one. `0x0a0b0d` rendered its own face
  // at 10 luma, 0.10 of the pill's 101.4; `optics.test.ts` carries the readings.
  const seam = new THREE.MeshStandardMaterial({
    color: new THREE.Color(way.aluminum).multiplyScalar(SEAM_SHADE),
    metalness: 0.2,
    roughness: 0.85,
  });

  // Antenna bands: the frame's own hue, a measured step lighter and muted.
  // `palette.ts`'s `ANTENNA_LIFT` carries the step; the metalness is what keeps
  // the strap legible, because a metal rail *reflects* the softboxes and blows
  // to white along an edge, so a strap within a shade of that albedo blows out
  // with it — while this finish mirrors a *darker* part of the studio than the
  // flat wall beside it, and so reads against the rail instead of dissolving.
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

  // The satin inlay: `palette.ts`'s `LOGO` rows carry the tone and the
  // measurement, and the satin finish is what keeps it a tonal step below the
  // panel rather than a mirror.
  const logo = new THREE.MeshPhysicalMaterial({
    color: logoColor(DEFAULT_COLOR),
    metalness: 0.45,
    roughness: 0.3,
    clearcoat: 0.35,
    clearcoatRoughness: 0.35,
  });

  // The mmWave window, the US top-edge insert. Matte and non-metallic, and its
  // tone is the finish's own muted and stepped down — `palette.ts`'s
  // `MMWAVE_TONE` carries the per-finish rows and the measurement behind them:
  // the reference's 0.83 of the frame's luma on the same row is what they solve to.
  const mmwave = new THREE.MeshPhysicalMaterial({
    color: mmwaveColor(way, DEFAULT_COLOR),
    metalness: MMWAVE_METALNESS,
    roughness: MMWAVE_ROUGHNESS,
  });

  // MagSafe: the panel's own colour exactly, and a hair smoother. Measured, the
  // part renders nothing at all — forcing its colour to 0xff0000 leaves the
  // `back`, `hero`, `left` and `top` frames byte-identical, 0 differing pixels
  // over a threshold of 6 summed channel levels — because all but the outermost
  // sliver of its tube is buried in an opaque panel: geometry, not this material.
  const magsafe = new THREE.MeshPhysicalMaterial({
    color: magsafeColor(way),
    metalness: 0.05,
    roughness: 0.34,
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
    mmwave,
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
 * The optics are in this list deliberately: the ring, Camera Control, the logo,
 * the mmWave insert and the MagSafe ring are all tints of the finish, and a
 * switch that repainted only the frame and the panel would leave an orange lens
 * ring on a Deep Blue phone. `darkGlass` is the one entry whose *tint* is not
 * per finish and whose reflectivity is — see `DARK_GLASS_REFLECT`.
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
  // The seam is the finish's own metal in shadow, repainted from the frame.
  materials.seam.color.copy(materials.aluminum.color).multiplyScalar(SEAM_SHADE);
  // Polished optics: the ring's tint and polish, and Camera Control's dark
  // sapphire.
  materials.lensRing.color.copy(ringColor(way, key));
  materials.lensRing.roughness = ringRoughness(key);
  materials.sapphire.color.copy(sapphireColor(key));
  materials.logo.color.copy(logoColor(key));
  // The window's reflectivity, one row per finish: the tint above is the same
  // dark glass on all three, and this is the level that holds its band.
  materials.darkGlass.specularIntensity = 0.45 * DARK_GLASS_REFLECT[key];
  // The mmWave window is the finish's own hue, muted and stepped down: a
  // colourway switch has to repaint it, or a Deep Blue phone keeps an orange
  // insert in its top edge.
  materials.mmwave.color.copy(mmwaveColor(way, key));
  materials.magsafe.color.copy(magsafeColor(way));
}
