import * as THREE from 'three';

import { createMaterials, DEFAULT_COLOR, isColorKey, type ColorKey } from './materials.js';
import { createPhone, type Phone } from './phone.js';
import { createStage, type PhoneStage } from './scene.js';
import { createUi, type ViewerUi } from './ui.js';
import { applyView, DEFAULT_VIEW, isViewKey, type ViewKey } from './views.js';

/**
 * Entry point. Parses the screenshot contract out of the query string, builds
 * the studio and the model, and exposes the small scripted surface the
 * orchestrator drives.
 *
 * Query parameters:
 *   color  cosmic-orange | deep-blue | silver   (default cosmic-orange)
 *   view   hero | front | back | left | right | top | bottom | camera-closeup
 *   shot   1 disables auto-rotate and the UI entrance, and pins the camera to
 *          the named preset, then sets window.__shotReady after 5 frames
 *
 * Unknown values fall back to the defaults instead of throwing, so a typo in a
 * shoot script produces a default frame rather than a blank page.
 */

declare global {
  interface Window {
    __shotReady?: boolean;
    __iphone?: {
      setColor(name: string): void;
      setView(name: string): void;
      ready: Promise<boolean>;
      debug(): unknown;
    };
    render_game_to_text?(): string;
    advanceTime?(ms: number): void;
  }
}

/** Frames that must have rendered before a screenshot is trustworthy. */
const SHOT_FRAMES = 5;

const params = new URLSearchParams(window.location.search);
const shotMode = params.get('shot') === '1';
const requestedColor = params.get('color');
const requestedView = params.get('view');

const initialColor: ColorKey = isColorKey(requestedColor) ? requestedColor : DEFAULT_COLOR;
const initialView: ViewKey = isViewKey(requestedView) ? requestedView : DEFAULT_VIEW;

function requireCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById('stage');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('#stage canvas is missing');
  return canvas;
}

class Viewer {
  private readonly stage: PhoneStage;
  private readonly phone: Phone;
  private readonly ui: ViewerUi;
  private readonly ready: Promise<boolean>;
  private resolveReady: ((value: boolean) => void) | null = null;
  private frames = 0;
  private color: ColorKey;
  private view: ViewKey;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    const materials = createMaterials();
    this.phone = createPhone(materials);
    this.color = initialColor;
    this.view = initialView;
    this.stage = createStage(canvas);
    this.stage.group.add(this.phone.object);
    this.phone.setColor(this.color);

    this.ui = createUi(document.getElementById('ui') ?? document.body, this.color, this.view, (key) => {
      this.setColor(key);
    });

    // Damping gives the orbit a settling tail; in shot mode the first frame
    // must already be the final pose, so it is stepped synchronously first.
    this.stage.controls.update();
    this.applyView(this.view);

    this.ready = new Promise<boolean>((resolve) => {
      this.resolveReady = resolve;
      if (!shotMode) {
        resolve(true);
      }
    });

    canvas.addEventListener('pointerdown', this.onFirstPointer, { once: true });
    window.addEventListener('keydown', this.onKeyDown);
    document.documentElement.classList.toggle('shot', shotMode);

    window.__iphone = {
      setColor: (name: string) => {
        this.setColor(isColorKey(name) ? name : DEFAULT_COLOR);
      },
      setView: (name: string) => {
        this.setView(isViewKey(name) ? name : DEFAULT_VIEW);
      },
      ready: this.ready,
      debug: () => this.debug(),
    };    window.render_game_to_text = () => this.describe();
    window.advanceTime = (ms: number) => {
      this.advance(ms);
    };

    if (shotMode) this.stage.render();
    requestAnimationFrame(this.tick);
  }

  private readonly onFirstPointer = (): void => {
    this.stage.setAutoRotate(false);
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const order: ViewKey[] = ['hero', 'right', 'back', 'left'];
    const index = order.indexOf(this.view);
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = order[(index + step + order.length) % order.length] ?? DEFAULT_VIEW;
    this.setView(next);
  };

  private applyView(view: ViewKey): void {
    applyView(this.stage, view, this.phone.bounds);
  }

  private setColor(key: ColorKey): void {
    this.color = key;
    this.phone.setColor(key);
    this.ui.setColor(key);
    this.syncUrl();
  }

  private setView(view: ViewKey): void {
    this.view = view;
    this.applyView(view);
    this.ui.setView(view);
    this.syncUrl();
  }

  private syncUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.set('color', this.color);
    url.searchParams.set('view', this.view);
    window.history.replaceState(null, '', url);
  }

  private readonly tick = (): void => {
    if (this.disposed) return;
    requestAnimationFrame(this.tick);
    this.stage.controls.update();
    this.stage.render();
    this.frames += 1;
    if (shotMode && this.frames >= SHOT_FRAMES && this.resolveReady !== null) {
      const resolve = this.resolveReady;
      this.resolveReady = null;
      window.__shotReady = true;
      resolve(true);
    }
  };

  /** Steps the simulation without waiting for real time; keeps the damped
   *  controls deterministic for scripted captures. */
  private advance(ms: number): void {
    const steps = Math.max(1, Math.round(ms / 16));
    for (let index = 0; index < steps; index += 1) this.stage.controls.update();
    this.stage.render();
  }

  /** Diagnostic snapshot: where the camera actually is versus where the model
   *  actually is, as normalised device coordinates. Used to check that a
   *  preset frames the body without screenshotting it. */
  private debug(): unknown {
    const camera = this.stage.camera;
    const box = this.phone.bounds;
    const corners: THREE.Vector3[] = [];
    for (let index = 0; index < 8; index += 1) {
      corners.push(
        new THREE.Vector3(
          (index & 1) === 0 ? box.min.x : box.max.x,
          (index & 2) === 0 ? box.min.y : box.max.y,
          (index & 4) === 0 ? box.min.z : box.max.z,
        ),
      );
    }
    camera.updateMatrixWorld(true);
    const projected = corners.map((corner) => corner.clone().project(camera));
    const span = (key: 'x' | 'y'): number[] => {
      const values = projected.map((entry) => entry[key]);
      return [round(Math.min(...values)), round(Math.max(...values))];
    };
    return {
      camera: [round(camera.position.x), round(camera.position.y), round(camera.position.z)],
      target: [
        round(this.stage.controls.target.x),
        round(this.stage.controls.target.y),
        round(this.stage.controls.target.z),
      ],
      fov: round(camera.fov),
      near: round(camera.near),
      bounds: {
        min: [round(box.min.x), round(box.min.y), round(box.min.z)],
        max: [round(box.max.x), round(box.max.y), round(box.max.z)],
      },
      // Normalised device space: -1 to +1 is the frame on both axes.
      frameX: span('x'),
      frameY: span('y'),
      lowestPoint: round(box.min.y),
      hits: probeHits(this.stage, this.phone.object),
    };
  }

  private describe(): string {
    const pose = this.stage.camera.position;
    return JSON.stringify({
      page: 'iphone-17-pro',
      family: 'iphone',
      color: this.color,
      view: this.view,
      shotReady: window.__shotReady === true,
      model: { height: 150, width: 71.9, depth: 8.75, unit: 'mm' },
      camera: {
        position: [round(pose.x), round(pose.y), round(pose.z)],
        target: [
          round(this.stage.controls.target.x),
          round(this.stage.controls.target.y),
          round(this.stage.controls.target.z),
        ],
        fov: round(this.stage.camera.fov),
      },
      features: [
        'unibody-frame',
        'camera-plateau',
        'main-lens',
        'ultrawide-lens',
        'telephoto-lens',
        'flash',
        'lidar',
        'back-glass',
        'apple-logo',
        'magsafe-ring',
        'front-glass',
        'dynamic-island',
        'action-button',
        'volume-buttons',
        'power-button',
        'camera-control',
        'usb-c',
        'speaker-bores',
        'mic-bores',
        'antenna-bands',
      ],
    });
  }

  dispose(): void {
    this.disposed = true;
    this.ui.dispose();
    this.phone.dispose();
    this.stage.dispose();
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}


/** What the camera actually sees at a grid of screen points: the frontmost few
 *  meshes under each ray, nearest first. A preset can measure as correctly
 *  framed and still be looking at the wrong surface, which is what this
 *  catches — the back view reported a fully framed body while actually
 *  rendering a logo that sat behind the glass. */
function probeHits(stage: PhoneStage, root: THREE.Object3D): Record<string, string[]> {
  const ray = new THREE.Raycaster();
  const out: Record<string, string[]> = {};
  for (const y of [-0.5, -0.25, 0, 0.5]) {
    for (const x of [-0.2, 0, 0.2]) {
      ray.setFromCamera(new THREE.Vector2(x, y), stage.camera);
      out[`${String(x)},${String(y)}`] = ray
        .intersectObject(root, true)
        .slice(0, 3)
        .map((hit) => `${hit.object.name}@${String(round(hit.distance))}`);
    }
  }
  return out;
}

export function startIphoneViewer(): Viewer {
  return new Viewer(requireCanvas());
}

export const viewer = startIphoneViewer();
