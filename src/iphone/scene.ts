import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * The studio the phone sits in: renderer, environment, floor and lights.
 *
 * Deliberate choices the shot contract depends on:
 * - `preserveDrawingBuffer` so headless Chrome can grab the canvas.
 * - Tone mapping and output colour space are fixed here, not per view, so a
 *   colour switch can never change exposure.
 * - `scene.background` is a radial canvas gradient with no horizon line and no
 *   lit surface of its own, so every preset gets the same clean backdrop.
 * - The floor is enormous and dark, which pushes its horizon far enough away
 *   that it never reads as a seam, and it is the only shadow receiver.
 */

export interface PhoneStage {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  /** Model space; the presentation tilt lives on the phone itself. */
  readonly group: THREE.Group;
  /** Draws one frame at the current camera pose. */
  render(): void;
  /** Resolves on the next animation frame. */
  raf(): Promise<void>;
  setAutoRotate(enabled: boolean): void;
  dispose(): void;
}

export const ORBIT_MIN_DISTANCE = 120;
export const ORBIT_MAX_DISTANCE = 3200;

/** A seamless studio backdrop: smooth radial falloff, no horizon, no bands.
 *  It is a background texture only — the scene lights never touch it. */
function radialBackdrop(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context !== null) {
    const gradient = context.createRadialGradient(
      size * 0.5,
      size * 0.44,
      size * 0.04,
      size * 0.5,
      size * 0.5,
      size * 0.72,
    );
    gradient.addColorStop(0, '#2b2f37');
    gradient.addColorStop(0.35, '#23262c');
    gradient.addColorStop(0.72, '#171a1f');
    gradient.addColorStop(1, '#0e0f12');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The environment map's resolution: wide enough to hold several panels and a
 *  gradient without banding, small enough to draw instantly. */
const ENV_WIDTH = 1024;
const ENV_HEIGHT = 512;

/** A colour written into the environment as an intensity rather than a byte.
 *  The map is read linearly and is not tone mapped, so a value above 1 is how a
 *  softbox gets to be brighter than white — clamping at white would flatten the
 *  very highlights the polished parts need. */
function encodeEnv(linear: readonly [number, number, number]): string {
  const channel = (value: number): number => {
    const clamped = Math.min(1, Math.max(0, value));
    const encoded = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(encoded * 255);
  };
  return `rgb(${String(channel(linear[0]))}, ${String(channel(linear[1]))}, ${String(channel(linear[2]))})`;
}

/** Scales an RGB triple by an intensity, keeping its hue. */
function scaled(rgb: readonly [number, number, number], factor: number): [number, number, number] {
  return [rgb[0] * factor, rgb[1] * factor, rgb[2] * factor];
}

/**
 * The reflection environment, generated locally and deterministically — no HDRI
 * fetch. It is a softbox studio drawn into one equirectangular canvas as an
 * intensity field, and three.js converts it to the cube-UV form
 * `scene.environment` wants on its way to the shader.
 *
 * That conversion is the route that works here. The previous build made the
 * same studio with `PMREMGenerator.fromScene`, and no surface in the scene saw
 * any light from it: measured on the `back` view, `scene.environment = null`
 * and `scene.environment = envMap` rendered byte-identical PNGs (SHA-256
 * A30D3CCD…), and setting `environmentIntensity` to 0, 0.85, 8, 20 and 30 left
 * the same frame's pixels unchanged. A plain equirectangular canvas texture
 * does change them, so this is the route kept. What was wrong inside the PMREM
 * itself is not narrowed down — the tooling in this repo cannot read a PMREM
 * target back, and the plain canvas route made that moot.
 *
 * What the map contains, and why each part is there:
 * - a vertical gradient, brightest overhead and dimmest underfoot. A flat face
 *   shows the environment it faces, so a uniform environment is a flat face:
 *   the plateau's face used to hold luma 120 for 198 px of one number.
 * - one wide softbox behind the camera, which is what the back panel, the
 *   plateau's face, both rails and the polished lens rings return.
 * - two small cards in front of the camera, where the cover glass looks. The
 *   glass is a flat mirror: see the note beside them for why size is the whole
 *   question there.
 * - two panels across the ceiling at different levels, which is what gives the
 *   plateau's upturned face a left-to-right ramp instead of one value.
 * - one under the floor and one on each side wall, so a rough metal averaging a
 *   wide cone always has something lit to average.
 * - no wide panel over white. A source above white is what a grazing
 *   reflection clips, and Fresnel reflectance reaches 1 at any grazing angle
 *   whatever the surface is, so the old 2.6 ceiling card put hard white bands
 *   on the lens-ring crowns: 111 pixels at 235 luma and above on the upper-left
 *   crown of the first lens alone. The two small cards in front of the camera
 *   are over white on purpose and are the one exception — the cover glass
 *   returns about 8 % of what it is given (0.043 Fresnel on the base layer plus
 *   0.04 clearcoat), so a visible highlight there needs a source above white.
 *   They are 5 px and 2 px across, and the measured front face tops out at 110
 *   luma with no pixel at or above 150.
 *
 * Brightness is carried by `scene.environmentIntensity`, and that is not the
 * obvious reading of the API. `WebGLRenderer` overwrites the `envMapIntensity`
 * uniform of every standard material that has no `envMap` of its own with
 * `scene.environmentIntensity` (three 0.185, `WebGLRenderer.js` line 2694), so
 * the per-material values written in `materials.ts` are dead while the material
 * has no env map. Measured: the `back` frame is byte-identical at a material
 * `envMapIntensity` of 0, 1, 2 and 8, while this one value at 1, 1.6 and 3
 * moves the same frame's panel from 142 to 188 to 214.
 */
function studioEnvironment(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = ENV_WIDTH;
  canvas.height = ENV_HEIGHT;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('the environment needs a 2d canvas context');

  // The horizon sits at the equator, and canvas y grows downwards, so y = 0 is
  // straight up, and a panel's `v` below is the fraction from the top of the
  // canvas — that is `1 - texture v` as the shader sees it. The ramp runs from
  // a bright ceiling to a dim floor, and every stop below the ceiling is dark:
  // the ceiling is the studio's one broad source, and the wall around the
  // camera is the dark it sits against. Every stop is below the map it
  // replaces — 0.95, 0.52, 0.34, 0.2, 0.07 — and the mid-band, which is what
  // a cover glass and a grazing floor both return, came down from 0.34 to 0.2.
  const gradient = context.createLinearGradient(0, 0, 0, ENV_HEIGHT);
  gradient.addColorStop(0, encodeEnv([0.7, 0.72, 0.75]));
  gradient.addColorStop(0.32, encodeEnv([0.42, 0.44, 0.48]));
  gradient.addColorStop(0.5, encodeEnv([0.2, 0.21, 0.23]));
  gradient.addColorStop(0.68, encodeEnv([0.11, 0.115, 0.125]));
  gradient.addColorStop(1, encodeEnv([0.04, 0.042, 0.046]));
  context.fillStyle = gradient;
  context.fillRect(0, 0, ENV_WIDTH, ENV_HEIGHT);

  /** One softbox: a feathered ellipse in environment space. `u` and `v` are
   *  fractions of the map, `size` its share of the map's width and height. A
   *  radial gradient falls off smoothly to nothing, which is what keeps a
   *  mirror from aliasing a hard edge into a streak. */
  const panel = (
    u: number,
    v: number,
    width: number,
    height: number,
    rgb: readonly [number, number, number],
    intensity: number,
  ): void => {
    const x = u * ENV_WIDTH;
    const y = v * ENV_HEIGHT;
    const radiusX = (width * ENV_WIDTH) / 2;
    const radiusY = (height * ENV_HEIGHT) / 2;
    const paint = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    paint.addColorStop(0, encodeEnv(scaled(rgb, intensity)));
    paint.addColorStop(0.62, encodeEnv(scaled(rgb, intensity * 0.94)));
    paint.addColorStop(1, encodeEnv(scaled(rgb, intensity * 0.3)));
    context.save();
    context.translate(x, y);
    context.scale(radiusX, radiusY);
    context.fillStyle = paint;
    context.beginPath();
    context.arc(0, 0, 1, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  // Behind the camera and in front of it: the polished lens rings and the whole
  // back of the phone mirror the first, the cover glass the second.
  //
  // The wall behind the camera — the one a back view looks past — is wide, and
  // it is what the back panel, the plateau's face and both rails return. Down
  // from 1.75, with `environmentIntensity` up from 1.35 to 1.6 to hold the
  // ratios the frame's own level sets.
  panel(0.25, 0.5, 0.36, 0.34, [0.96, 0.97, 1.0], 1.55);

  // The wall in front of the camera is shaped around one fact about a flat
  // mirror: the cover glass seen from the `front` preset's stand-off of 1702 mm
  // (the page's own `debug()` reports the camera there) only sweeps its
  // reflection through 2.4 degrees vertically and 1.2 horizontally. Whatever
  // fills those couple of degrees is what the whole face returns, so a
  // wall-sized panel there is a flat tile edge to edge: this one measured 103
  // luma with the same minimum and maximum, a grey slab, and no card can put a
  // shape on a surface that narrow. A card whose *edge* falls inside those two
  // degrees is a sheen that slides down the glass instead, and a second, much
  // smaller card inside it is a highlight with a boundary. Between them the
  // face now measures 44 at its second percentile and 110 at its maximum.
  // `v` is the fraction from the top of the canvas, so the pair sits above the
  // face's own mirror direction, texture v 0.578, at canvas v 0.414 and 0.4245.
  panel(0.75, 0.414, 0.005, 0.008, [1.0, 1.0, 1.0], 2.2);
  panel(0.7525, 0.4245, 0.0022, 0.0034, [1.0, 1.0, 1.0], 4.0);

  // The ceiling pair, at different levels and offset sideways, so a face that
  // looks up reads a ramp across it rather than one number. Both came down from
  // over white — 2.6 and 1.5 to 1.15 and 0.85 — for the reason in the note
  // above: a source brighter than white is what a grazing reflection clips, and
  // Fresnel reflectance reaches 1 at any grazing angle whatever the material.
  panel(0.4, 0.1, 0.3, 0.2, [1.0, 0.97, 0.92], 1.15);
  panel(0.72, 0.14, 0.26, 0.18, [1.0, 0.97, 0.92], 0.85);
  // The floor: dim, but not black. A black lower hemisphere is what made every
  // rough-metal surface that averages it read as a hole.
  panel(0.5, 0.86, 0.6, 0.24, [0.9, 0.92, 0.96], 0.4);
  // The two side walls, so the rail and its button pills have something to
  // mirror where their normals run along ±X. They are deliberately dim against
  // the wall behind the camera, and that contrast is what puts a break in a
  // frame rail: with both ends of the rail's normal sweep landing on walls of
  // similar brightness, the whole visible band returns one value. Measured on
  // the silver `back` rail the outermost pixel is 163 luma against 214 across
  // the rest of the band; at 1.15 and 0.95 it was 187 against 214. Cost, also
  // measured: it lowered every rail, which took Deep Blue's ratio from 0.518 to
  // 0.530 and is why that finish's roughness is 0.3 now, and it does not band
  // the floor — the same row of the floor reads within 1 luma across x at
  // azimuths that see these walls and azimuths that do not.
  panel(0.02, 0.42, 0.16, 0.4, [0.93, 0.95, 1.0], 0.42);
  panel(0.52, 0.42, 0.16, 0.4, [0.9, 0.93, 1.0], 0.35);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStage(canvas: HTMLCanvasElement): PhoneStage {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = radialBackdrop();
  const envMap = studioEnvironment();
  scene.environment = envMap;
  // The environment's own level, and the one brightness control that is read —
  // `studioEnvironment` carries the measurement behind that. 1.6 is the level
  // at which all three finishes' rail/panel ratios land inside their references
  // over this darker map: measured on the `back` view, orange 0.747, Deep Blue
  // 0.508 and silver 0.866 against 0.73, 0.47 and 0.87.
  scene.environmentIntensity = 1.6;

  // A 16 m floor under a 150 mm phone: the horizon is far enough away that it
  // never presents an edge, and the surface is near-black so it only carries
  // the shadow. There used to be a 40 m one, but keeping the camera's far
  // plane near the floor's own reach is what stops the depth buffer banding
  // across the screen.
  //
  // Its rendered level is the environment's, not its own albedo's: this floor
  // is seen at a grazing angle, so Fresnel reflectance is near 1, and a 4x
  // change of the near-black albedo (0x0e1014 to 0x20232a) moved it only from
  // 93 to 103 luma. The darker gradient below therefore took the backdrop with
  // it, from 141 luma to 93 on the `back` view, and that is the visible cost of
  // this round; the floor's far edge against the backdrop went from 115 luma of
  // step to 67, so the horizon seam itself is softer than it was.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16000, 16000),
    new THREE.MeshPhysicalMaterial({
      color: 0x0e1014,
      metalness: 0.0,
      roughness: 0.62,
      envMapIntensity: 0.22,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // The soft centred contact shadow: a broad, low-opacity pool rather than the
  // hard "shark fin" the near point light used to throw.
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(16000, 16000),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.25 }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.06;
  contact.receiveShadow = true;
  scene.add(contact);

  // Key from high front-right: shapes the frame and lays the contact pool.
  const key = new THREE.DirectionalLight(0xfff4ea, 0.9);
  key.position.set(210, 460, 300);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 60;
  key.shadow.camera.far = 1500;
  key.shadow.camera.left = -170;
  key.shadow.camera.right = 170;
  key.shadow.camera.top = 240;
  key.shadow.camera.bottom = -60;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 1.4;
  key.shadow.radius = 16;
  scene.add(key);

  // The plateau faces -Z, and so does the whole back of the phone: a rig with
  // nothing behind it leaves the lens rings reflecting a black void and the
  // camera cluster invisible. This is the light that makes the back readable.
  const backKey = new THREE.DirectionalLight(0xfff6ec, 0.6);
  backKey.position.set(-180, 380, -430);
  scene.add(backKey);

  // Broad soft fill from behind-left and behind-right, so neither side of the
  // body is left in the near-black maroon the old single-key rig produced.
  const fill = new THREE.DirectionalLight(0xd7e2ff, 0.45);
  fill.position.set(-360, 180, -420);
  scene.add(fill);

  const fillRight = new THREE.DirectionalLight(0xc9d6f5, 0.4);
  fillRight.position.set(380, 150, -340);
  scene.add(fillRight);

  // A rim from above and behind draws the silhouette; a low warm one lifts
  // the bottom edge, which is what makes the ports readable from underneath.
  const rim = new THREE.DirectionalLight(0xe8eeff, 0.4);
  rim.position.set(-60, 520, -260);
  scene.add(rim);

  const under = new THREE.DirectionalLight(0xffe7d2, 0.3);
  under.position.set(60, -400, 120);
  scene.add(under);

  const ambient = new THREE.HemisphereLight(0xd4ddf2, 0x0a0b0d, 0.25);
  scene.add(ambient);

  const group = new THREE.Group();
  scene.add(group);

  const camera = new THREE.PerspectiveCamera(
    32,
    window.innerWidth / Math.max(window.innerHeight, 1),
    1,
    20000,
  );
  camera.position.set(300, 300, 500);

  const onResize = (): void => {
    const width = window.innerWidth;
    const height = Math.max(window.innerHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  // Sized before anything reads the camera: a preset fit needs the real
  // aspect, and the default 1.0 would make every whole-body fit overshoot.
  window.addEventListener('resize', onResize);
  onResize();

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.rotateSpeed = 0.85;
  controls.zoomSpeed = 0.8;
  controls.minDistance = ORBIT_MIN_DISTANCE;
  controls.maxDistance = ORBIT_MAX_DISTANCE;
  controls.autoRotateSpeed = 0.42;
  controls.target.set(0, 76, 0);
  controls.update();

  const stage: PhoneStage = {
    scene,
    camera,
    renderer,
    controls,
    group,
    render: () => {
      renderer.render(scene, camera);
    },
    raf: () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          resolve();
        });
      }),
    setAutoRotate: (enabled: boolean) => {
      controls.autoRotate = enabled;
    },
    dispose: () => {
      window.removeEventListener('resize', onResize);
      controls.dispose();
      envMap.dispose();
      renderer.dispose();
    },
  };
  return stage;
}
