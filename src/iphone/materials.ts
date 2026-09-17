import * as THREE from 'three';

/**
 * Every material in the phone model, plus the procedural maps that give the
 * surfaces their micro-detail. Nothing here is fetched: the brushed-metal and
 * lens-flare textures are drawn into canvases at module scope.
 *
 * Colour is the only thing the dropdown changes, and it changes on these
 * shared instance colours only — no geometry is rebuilt, ever.
 */

export type ColorKey = 'cosmic-orange' | 'deep-blue' | 'silver';

export const COLOR_KEYS: readonly ColorKey[] = ['cosmic-orange', 'deep-blue', 'silver'];

export const DEFAULT_COLOR: ColorKey = 'cosmic-orange';

export interface Colorway {
  /** Shown in the dropdown. */
  readonly label: string;
  /** Anodized unibody tint. */
  readonly aluminum: number;
  /** Ceramic Shield back-panel tint, always a touch lighter than the frame. */
  readonly glass: number;
  /** Frame roughness: the anodized sheen is part of the colourway. */
  readonly roughness: number;
  /** Frame clearcoat: the Cosmic Orange depth treatment. */
  readonly clearcoat: number;
}

export const COLORWAYS: Record<ColorKey, Colorway> = {
  // Vivid warm orange with an anodized sheen: slightly smoother than the other
  // two and carrying a little clearcoat, which is what stops it reading flat.
  'cosmic-orange': {
    label: 'Cosmic Orange',
    aluminum: 0xcf6238,
    glass: 0xe07a52,
    roughness: 0.34,
    clearcoat: 0.25,
  },
  // Rich, dark navy. The light, grey-blue this used to be read as washed out.
  'deep-blue': {
    label: 'Deep Blue',
    aluminum: 0x323e57,
    glass: 0x455472,
    roughness: 0.36,
    clearcoat: 0.18,
  },
  // Cool light silver, not beige: a neutral frame under a near-white panel.
  silver: {
    label: 'Silver',
    aluminum: 0xdcdde0,
    glass: 0xf0f1f3,
    roughness: 0.33,
    clearcoat: 0.12,
  },
};

export function isColorKey(value: string | null | undefined): value is ColorKey {
  return value === 'cosmic-orange' || value === 'deep-blue' || value === 'silver';
}

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
  /** Antenna lines: matte, one tonal step down from the rail. */
  readonly antenna: THREE.MeshStandardMaterial;
  /** USB-C shell and speaker/mic bores: opaque black, no reflections. */
  readonly bore: THREE.MeshStandardMaterial;
  /** Polished Apple logo inlay. */
  readonly logo: THREE.MeshPhysicalMaterial;
  /** MagSafe ring: a tonal whisper in the panel, not a chrome wire. */
  readonly magsafe: THREE.MeshPhysicalMaterial;
  /** Sprites that soften the lens hotspots. */
  readonly glow: THREE.SpriteMaterial;
}

/** Fine horizontal streaks; anisotropy needs a rotated map to read as
 *  brushing. A per-row value keeps the pattern as fine as the texture
 *  resolution, which is what stops it aliasing into visible banding on a face
 *  that is large on screen. */
function brushedNormalMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context !== null) {
    const image = context.createImageData(size, size);
    // Deterministic hash: same streaks on every load, no Math.random.
    for (let y = 0; y < size; y += 1) {
      const hashed = Math.sin(y * 127.1 + 311.7) * 43758.5453;
      const value = 128 + (hashed - Math.floor(hashed) - 0.5) * 10;
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        image.data[index] = value;
        image.data[index + 1] = 128;
        image.data[index + 2] = 255;
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

/** Soft round falloff used as a lens hotspot. */
function glowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context !== null) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(0.35, 'rgba(200,225,255,0.35)');
    gradient.addColorStop(1, 'rgba(120,150,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMaterials(): PhoneMaterials {
  const way = COLORWAYS[DEFAULT_COLOR];
  // One brushed map, shared by the rail and the buttons so the pills cannot
  // drift away from the frame's finish.
  const brushed = brushedNormalMap();

  const aluminum = new THREE.MeshPhysicalMaterial({
    color: way.aluminum,
    metalness: 0.9,
    roughness: way.roughness,
    clearcoat: way.clearcoat,
    clearcoatRoughness: 0.28,
    anisotropy: 0.55,
    anisotropyRotation: Math.PI / 2,
    normalMap: brushed,
    normalScale: new THREE.Vector2(0.12, 0.12),
    envMapIntensity: 1.2,
  });

  // Matte Ceramic Shield panel: the same hue family as the frame, only a
  // little lighter. No clearcoat — the real panel is the soft-touch finish.
  const backGlass = new THREE.MeshPhysicalMaterial({
    color: way.glass,
    metalness: 0.05,
    roughness: 0.35,
    clearcoat: 0.18,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.95,
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
  const frontGlass = new THREE.MeshPhysicalMaterial({
    color: 0x090a0d,
    metalness: 0,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.15,
    ior: 1.52,
  });

  const screen = new THREE.MeshPhysicalMaterial({
    color: 0x010103,
    metalness: 0,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 0.55,
  });

  // Dynamic Island. Near-black would be correct for a dark screen but then the
  // pill is indistinguishable from the display behind it, so it carries a
  // faint grey lift and a strong clearcoat — enough to catch a highlight and
  // read as a separate glossy part.
  const island = new THREE.MeshPhysicalMaterial({
    color: 0x1c2028,
    metalness: 0.15,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.9,
  });

  // The polished barrel: a bright polished-metal ring. It deliberately is NOT
  // tinted to the frame — an anodized-orange ring on an anodized-orange
  // plateau reads as one flat surface, and the lens disappears into it.
  const lensRing = new THREE.MeshPhysicalMaterial({
    color: 0xc9ccd2,
    metalness: 1,
    roughness: 0.24,
    envMapIntensity: 1.8,
  });

  // The bright pupil is the eye-catch: small, near-black blue, proud of the
  // glass so a tight highlight lands on it.
  const lensPupil = new THREE.MeshPhysicalMaterial({
    color: 0x1b3350,
    metalness: 0.2,
    roughness: 0.07,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.6,
  });

  // Camera glass, and it has to read as glass: a very dark blue-black element
  // with a clearcoat and a trace of iridescence. The previous element mirrored
  // the studio back at full strength and came out as a slate-grey coin, so its
  // environment response is deliberately most of the way down — the depth is
  // carried by the dark barrel behind it, not by a bright reflection.
  const lensGlass = new THREE.MeshPhysicalMaterial({
    color: 0x05070c,
    metalness: 0.0,
    roughness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    iridescence: 0.35,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [140, 440],
    envMapIntensity: 0.28,
    ior: 1.6,
  });

  // Inside the barrel: dark gunmetal, not the pale grey that flattened the
  // lenses into grey coins. Double sided because the barrel is an open tube and
  // the camera looks into it.
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
  // shaded by the collar around it.
  const flash = new THREE.MeshPhysicalMaterial({
    color: 0xd9d2c2,
    metalness: 0.05,
    roughness: 0.58,
    clearcoat: 0.25,
    clearcoatRoughness: 0.45,
    envMapIntensity: 0.6,
  });

  const darkGlass = new THREE.MeshPhysicalMaterial({
    color: 0x121722,
    metalness: 0.25,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.6,
  });

  const sapphire = new THREE.MeshPhysicalMaterial({
    color: 0x14161c,
    metalness: 0.3,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.5,
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

  // Antenna bands: the same dye lot as the frame, one clear tonal step down.
  //
  // This is tuned against measurement, not against a feeling, because two
  // rounds shipped bands that were present on the model and invisible in every
  // view. At 0.9 of the rail's colour with the rail's own metalness they
  // mirrored the studio identically. A matte pale strap is worse: a metal rail
  // *reflects* the softboxes and blows to white along an edge, so anything
  // within a shade of that albedo blows out with it — measured, a 0.45-albedo
  // matte strap landed within 4 of 255 of the rail in the top view, which is
  // invisible again. This finish keeps some metalness so it mirrors a *darker*
  // part of the studio than the flat wall beside it, and sits 21 to 55 of 255
  // off that wall depending on the view.
  const antenna = new THREE.MeshStandardMaterial({
    color: new THREE.Color(way.aluminum).multiplyScalar(0.55),
    metalness: 0.7,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });

  const bore = new THREE.MeshStandardMaterial({
    color: 0x040406,
    metalness: 0,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  // The inlay is polished, so it is *darker* than the matte panel it sits in —
  // that tonal step is what makes it read, not its shape alone. Tying it to the
  // frame colour alone leaves it brighter than a light panel, where it
  // vanishes.
  const logo = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(way.aluminum).multiplyScalar(0.45),
    metalness: 0.6,
    roughness: 0.14,
    envMapIntensity: 1.5,
  });

  // MagSafe: the panel's own hue, a hair lighter and a hair smoother. It has
  // to be barely there — a chrome wire is the wrong part.
  const magsafe = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(way.glass).multiplyScalar(1.09),
    metalness: 0.15,
    roughness: 0.26,
    envMapIntensity: 0.85,
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
 * the two finish scalars that differ between them.
 */
export function applyColorway(materials: PhoneMaterials, key: ColorKey): void {
  const way = COLORWAYS[key];
  materials.aluminum.color.setHex(way.aluminum);
  materials.aluminum.roughness = way.roughness;
  materials.aluminum.clearcoat = way.clearcoat;
  materials.backGlass.color.setHex(way.glass);
  // The pills carry the frame's finish exactly: same colour, same sheen.
  materials.button.color.setHex(way.aluminum);
  materials.button.roughness = way.roughness;
  materials.button.clearcoat = way.clearcoat;
  // Antenna lines are the same dye lot, one tonal step down.
  materials.antenna.color.setHex(way.aluminum).multiplyScalar(0.55);
  materials.logo.color.setHex(way.aluminum).multiplyScalar(0.45);
  materials.magsafe.color.setHex(way.glass).multiplyScalar(1.09);
}
