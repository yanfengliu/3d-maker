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

/**
 * The reflection environment, generated locally and deterministically — no HDRI
 * fetch. A generic room is not enough for this model. Polished metal has no
 * diffuse term at all: it shows exactly what it mirrors, so a lens ring facing
 * the back camera mirrors whatever sits behind that camera. The old
 * RoomEnvironment is bright in the middle and dim at the rim, so every ring
 * mirrored the dark rim and rendered as a black hole — and the plateau's
 * surface is tilted, so it mirrors the *ceiling*, which is why the plateau
 * looked fine while the rings did not.
 *
 * So this is a softbox cube: a mid-grey shell with a bright emissive panel on
 * all six faces. Every direction a polished surface can mirror — floor and
 * ceiling included — has something bright in it.
 */
function studioEnvironment(): THREE.Texture {
  const studio = new THREE.Scene();
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(2400, 2400, 2400),
    new THREE.MeshBasicMaterial({ color: 0x8d94a2, side: THREE.BackSide }),
  );
  studio.add(shell);

  const softbox = (
    size: [number, number],
    position: [number, number, number],
    rotation: [number, number, number],
    color: number,
    intensity: number,
  ): void => {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(size[0], size[1]),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) }),
    );
    panel.position.set(...position);
    panel.rotation.set(...rotation);
    studio.add(panel);
  };

  // The six softboxes do not tile the cube: the gaps between them are what
  // gives a polished surface a soft-edged highlight instead of a flat wash of
  // one brightness. The shell behind those gaps still has to be bright, which
  // is the part that keeps the lens rings from going black.
  //
  // Each panel's normal has to point back at the cube's centre, which for a
  // plane is `rotation.y = +90°` on the -X wall and `-90°` on the +X one. Both
  // side panels used to face outwards, so they were culled out of the
  // environment entirely: every surface with a normal along ±X — the rail, and
  // every button pill on it — mirrored the dull grey shell behind them, which
  // is what turned the buttons into dark bronze slabs.
  softbox([1700, 1300], [0, 0, -1080], [0, 0, 0], 0xf4f6ff, 1.15);
  softbox([1700, 1300], [0, 0, 1080], [0, Math.PI, 0], 0xeef2ff, 1.05);
  softbox([1700, 1300], [0, 1080, 0], [Math.PI / 2, 0, 0], 0xfff6ec, 1.2);
  softbox([1700, 1300], [0, -1080, 0], [-Math.PI / 2, 0, 0], 0xdfe4ee, 0.8);
  softbox([1300, 1300], [-1080, 0, 0], [0, Math.PI / 2, 0], 0xe6ecff, 1.0);
  softbox([1300, 1300], [1080, 0, 0], [0, -Math.PI / 2, 0], 0xdde6ff, 0.95);

  const pmrem = new THREE.PMREMGenerator(new THREE.WebGLRenderer({ antialias: false }));
  // Blurred enough that a mirror-smooth panel this large does not alias the
  // softbox edges into streaks, sharp enough that the panels still read.
  const target = pmrem.fromScene(studio, 0.05);
  pmrem.dispose();
  return target.texture;
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
  // Kept modest: the environment is deliberately bright enough to keep
  // polished metal off black, and this is what stops it also washing the
  // anodized frame out to a flat pastel.
  scene.environmentIntensity = 0.85;

  // A 16 m floor under a 150 mm phone: the horizon is far enough away that it
  // never presents an edge, and the surface is near-black so it only carries
  // the shadow. There used to be a 40 m one, but keeping the camera's far
  // plane near the floor's own reach is what stops the depth buffer banding
  // across the screen.
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
  const key = new THREE.DirectionalLight(0xfff4ea, 2.1);
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
  const backKey = new THREE.DirectionalLight(0xfff6ec, 1.5);
  backKey.position.set(-180, 380, -430);
  scene.add(backKey);

  // Broad soft fill from behind-left and behind-right, so neither side of the
  // body is left in the near-black maroon the old single-key rig produced.
  const fill = new THREE.DirectionalLight(0xd7e2ff, 1.15);
  fill.position.set(-360, 180, -420);
  scene.add(fill);

  const fillRight = new THREE.DirectionalLight(0xc9d6f5, 1.0);
  fillRight.position.set(380, 150, -340);
  scene.add(fillRight);

  // A rim from above and behind draws the silhouette; a low warm one lifts
  // the bottom edge, which is what makes the ports readable from underneath.
  const rim = new THREE.DirectionalLight(0xe8eeff, 1.1);
  rim.position.set(-60, 520, -260);
  scene.add(rim);

  const under = new THREE.DirectionalLight(0xffe7d2, 0.75);
  under.position.set(60, -400, 120);
  scene.add(under);

  const ambient = new THREE.HemisphereLight(0xd4ddf2, 0x0a0b0d, 0.8);
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

  return {
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
}
