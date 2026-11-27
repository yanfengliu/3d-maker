import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clipFocusShift, expandedFrame, projectedBoxSize, sampleClipBounds } from './framing';
import {
  DEFAULT_PROJECTION,
  PERSPECTIVE_FOV,
  orthoHalfHeight,
  orthoZoomForPerspective,
  perspectiveDistance,
  perspectiveDistanceForOrtho,
  type Projection,
} from './projection';
import {
  applyNightLighting,
  buildRoomEnvironment,
  disposeModel,
  measureModelBounds,
  softShadow,
  updateStageProps,
} from './stage-env';

export { disposeModel };
export type { Projection };
export const VIEWS = ['Perspective', 'Front', 'Back', 'Left', 'Right', 'Top', 'Bottom', 'Side'] as const;
export type View = (typeof VIEWS)[number];
export const VIEW_DIRECTIONS: Record<View, [number, number, number]> = {
  Perspective: [5, 3.55, 6.5],
  Front: [0, 0.35, 7],
  Back: [0, 0.35, -7],
  Left: [-8, 0.3, 0],
  Right: [8, 0.3, 0],
  Top: [0, 8, 0.001],
  Bottom: [0, -8, 0.05],
  Side: [8, 0.3, 0],
};
export function parseView(raw: string | null | undefined): View | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return VIEWS.find((v) => v.toLowerCase() === key) ?? null;
}

export class Viewport {
  private renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  private perspectiveCamera = new T.PerspectiveCamera(PERSPECTIVE_FOV, 1, 0.01, 2000);
  private orthoCamera = new T.OrthographicCamera(-2, 2, 2, -2, 0.01, 2000);
  private projection: Projection = DEFAULT_PROJECTION;
  private controls: OrbitControls;
  private grid = new T.GridHelper(160, 240, '#b9bdb1', '#c9ccc0');
  private shadow = softShadow();
  private ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.ShadowMaterial({ opacity: 0.16 }));
  private hemi = new T.HemisphereLight(0xfffdf4, 0x8b9287, 1.6);
  private key = new T.DirectionalLight('#ffefd8', 2.7);
  private raycaster = new T.Raycaster();
  private pickHandler: ((hit: { mesh: T.Mesh; faceIndex: number; materialIndex: number }) => void) | null = null;
  private pointerDownPos: { x: number; y: number } | null = null;
  private nightMode = false;
  private host: HTMLElement;
  private renderSize = new T.Vector2();
  private radius = 1;
  private baseFrameHeight = 4;
  private baseFrameWidth = 4;
  private baseFrameDepth = 2;
  private baseAspect = 1;
  private frameHeight = 4;
  private frameWidth = 4;
  private frameDepth = 2;
  private restBounds = new T.Box3();
  private restCenter = new T.Vector3();
  private bounds = new T.Box3();
  private center = new T.Vector3();
  private appliedShift = new T.Vector3();
  private clipBounds = new Map<T.AnimationClip, T.Box3>();
  private framedClip: T.AnimationClip | null = null;
  private mixer: T.AnimationMixer | null = null;
  private action: T.AnimationAction | null = null;
  private wireMaterials = new Map<T.MeshStandardMaterial, boolean>();
  private lastTime = 0;
  private pendingFrames = 0;
  private frame = 0;
  private settled = 0;
  private isWire = false;
  private thumbnailMode: boolean;
  private gridSize = 1;
  model: T.Group | null = null;
  playing = false;
  playAll = false;
  onAdvance: ((index: number) => void) | undefined;
  speed = 1;
  clipIndex = 0;
  onTick?: (fraction: number) => void;
  onReady?: () => void;
  private get camera(): T.PerspectiveCamera | T.OrthographicCamera {
    return this.projection === 'perspective' ? this.perspectiveCamera : this.orthoCamera;
  }
  private createControls(target?: T.Vector3) {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = false;
    controls.maxPolarAngle = Math.PI - 0.002;
    controls.minZoom = 0.24;
    controls.maxZoom = 9;
    const reachRadius = Math.max(this.radius, this.bounds.isEmpty() ? 1 : this.bounds.getSize(new T.Vector3()).length() / 2);
    controls.minDistance = reachRadius * 0.45;
    controls.maxDistance = reachRadius * 24;
    if (target) controls.target.copy(target);
    controls.addEventListener('change', () => { this.invalidate(); });
    return controls;
  }
  constructor(host: HTMLElement, thumbnail = false, initialProjection: Projection = DEFAULT_PROJECTION) {
    this.host = host;
    this.thumbnailMode = thumbnail;
    this.projection = initialProjection;
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(thumbnail ? 1.5 : Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0xe7e8e1, thumbnail ? 0 : 1);
    this.renderer.shadowMap.enabled = !thumbnail;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D model. Drag to orbit and scroll to zoom.');
    this.controls = this.createControls();
    this.scene.environment = buildRoomEnvironment(this.renderer);
    this.scene.environmentIntensity = 0.62;
    this.scene.add(this.hemi);
    this.key.position.set(-4, 8, 5);
    this.key.castShadow = !thumbnail;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.normalBias = 0.015;
    this.scene.add(this.key, this.key.target, this.shadow);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    if (!thumbnail) {
      this.scene.fog = new T.FogExp2(0xe7e8e1, 0.039);
      this.scene.add(this.grid, this.ground);
      new ResizeObserver(() => { this.resize(); }).observe(host);
      this.renderer.domElement.addEventListener('pointerdown', e => { this.pointerDownPos = { x: e.clientX, y: e.clientY }; });
      this.renderer.domElement.addEventListener('pointerup', event => {
        if (!this.pickHandler || !this.model || !this.pointerDownPos) return;
        const dx = event.clientX - this.pointerDownPos.x, dy = event.clientY - this.pointerDownPos.y;
        this.pointerDownPos = null;
        if (dx * dx + dy * dy > 16) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        this.raycaster.setFromCamera(new T.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1), this.camera);
        const meshes: T.Mesh[] = [];
        this.model.traverseVisible(node => { if (!node.userData.studioOverlay && node instanceof T.Mesh) meshes.push(node as T.Mesh); });
        const [hit] = this.raycaster.intersectObjects(meshes, false);
        if (hit && hit.object instanceof T.Mesh) this.pickHandler({ mesh: hit.object as T.Mesh, faceIndex: hit.faceIndex ?? -1, materialIndex: hit.face?.materialIndex ?? 0 });
      });
    }
    this.resize();
  }
  private viewportAspect() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    return { w, h, aspect: w / h };
  }
  private resize() {
    const { w, h, aspect } = this.viewportAspect();
    this.renderer.getSize(this.renderSize);
    const changed = w !== this.renderSize.x || h !== this.renderSize.y;
    if (changed) this.renderer.setSize(w, h, false);
    const half = orthoHalfHeight(this.frameWidth, this.frameHeight, aspect);
    this.orthoCamera.left = -half * aspect;
    this.orthoCamera.right = half * aspect;
    this.orthoCamera.top = half;
    this.orthoCamera.bottom = -half;
    this.orthoCamera.updateProjectionMatrix();
    this.perspectiveCamera.aspect = aspect;
    const baseDist = perspectiveDistance(this.baseFrameWidth, this.baseFrameHeight, this.baseFrameDepth, this.baseAspect);
    const activeDist = perspectiveDistance(this.frameWidth, this.frameHeight, this.frameDepth, aspect);
    this.perspectiveCamera.zoom = Math.min(1, baseDist / Math.max(0.001, activeDist));
    this.perspectiveCamera.updateProjectionMatrix();
    // ResizeObserver runs after the frame callbacks. Resizing clears WebGL's buffer;
    // draw the new projection before this frame is presented when an inspector tab changes.
    if (changed && this.model) this.renderer.render(this.scene, this.camera);
    this.invalidate();
  }
  getProjection(): Projection {
    return this.projection;
  }
  setProjection(next: Projection) {
    if (next === this.projection) return;
    const { aspect } = this.viewportAspect();
    const target = this.controls.target.clone();
    const offset = this.camera.position.clone().sub(target);
    const prevDist = Math.max(0.01, offset.length());
    const dir = offset.lengthSq() > 1e-8 ? offset.normalize() : new T.Vector3(...VIEW_DIRECTIONS.Perspective).normalize();
    const halfH = orthoHalfHeight(this.frameWidth, this.frameHeight, aspect);
    const reachRadius = Math.max(this.radius, this.bounds.isEmpty() ? 1 : this.bounds.getSize(new T.Vector3()).length() / 2);
    if (next === 'perspective') {
      const baseDist = perspectiveDistance(this.baseFrameWidth, this.baseFrameHeight, this.baseFrameDepth, this.baseAspect);
      const activeDist = perspectiveDistance(this.frameWidth, this.frameHeight, this.frameDepth, aspect);
      const perspZoom = Math.min(1, baseDist / Math.max(0.001, activeDist));
      const matchedDist = Math.min(
        reachRadius * 24,
        Math.max(reachRadius * 0.45, perspectiveDistanceForOrtho(halfH, this.orthoCamera.zoom) * perspZoom),
      );
      this.perspectiveCamera.position.copy(target).addScaledVector(dir, matchedDist);
      this.perspectiveCamera.near = Math.max(0.01, reachRadius * 0.02);
      this.perspectiveCamera.far = Math.max(200, reachRadius * 120);
      this.perspectiveCamera.lookAt(target);
    } else {
      this.orthoCamera.position.copy(target).addScaledVector(dir, reachRadius * 5.2);
      this.orthoCamera.zoom = Math.min(9, Math.max(0.24, orthoZoomForPerspective(halfH, prevDist, this.perspectiveCamera.zoom)));
      this.orthoCamera.near = reachRadius * 0.005;
      this.orthoCamera.far = reachRadius * 120;
      this.orthoCamera.lookAt(target);
    }
    this.projection = next;
    if (this.scene.fog instanceof T.FogExp2) {
      this.scene.fog.density = (next === 'perspective' ? 0.052 : 0.034) / Math.max(0.01, this.radius);
    }
    this.controls.dispose();
    this.controls = this.createControls(target);
    this.controls.update();
    this.resize();
  }
  setModel(model: T.Group, refit = true, autoBind = true) {
    // Actions restore original node transforms when stopped, including skinned poses.
    this.mixer?.stopAllAction();
    if (this.model) {
      this.mixer?.uncacheRoot(this.model);
      this.scene.remove(this.model);
    }
    this.model = model;
    this.scene.add(model);
    this.wireMaterials.clear();
    model.traverse((node) => {
      if (node.userData.studioOverlay || !(node instanceof T.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
      const mats: unknown[] = Array.isArray(node.material) ? (node.material as unknown[]) : [node.material];
      for (const mat of mats)
        if (mat instanceof T.MeshStandardMaterial) this.wireMaterials.set(mat, mat.wireframe);
    });
    this.wireframe(this.isWire);
    this.mixer = new T.AnimationMixer(model);
    this.playing = false;
    this.action = null;
    this.clipIndex = 0;
    this.clipBounds.clear();
    this.framedClip = null;
    if (refit) this.appliedShift.set(0, 0, 0);
    this.place(refit);
    if (autoBind) this.bindClip(0);
    this.settled = 0;
    this.invalidate();
  }
  private atRest<R>(work: () => R): R {
    if (!this.action) return work();
    const time = this.action.time;
    const paused = this.action.paused;
    this.action.stop();
    try {
      return work();
    } finally {
      this.action.play();
      this.action.time = time;
      this.action.paused = paused;
      this.mixer?.update(0);
    }
  }
  private measureRest() {
    if (!this.model) return;
    const model = this.model;
    this.restBounds.copy(this.atRest(() => measureModelBounds(model)));
  }
  private clipBox(clip: T.AnimationClip) {
    const cached = this.clipBounds.get(clip);
    if (cached) return cached;
    if (!this.model) return this.restBounds;
    const model = this.model;
    const sampled = this.atRest(() => sampleClipBounds(model, clip, this.restBounds));
    this.clipBounds.set(clip, sampled);
    return sampled;
  }
  private stageProps(box: T.Box3) {
    updateStageProps(box, this.radius, this.gridSize, this.shadow, this.grid, this.ground, this.key);
  }
  private applyFraming(clip: T.AnimationClip | null, refit: boolean) {
    if (!this.model) return;
    const sampled = clip ? this.clipBox(clip) : this.restBounds;
    const shift = clip ? clipFocusShift(this.restBounds, sampled, this.radius) : new T.Vector3();
    const active = clip ? sampled : this.restBounds;
    this.framedClip = clip;
    this.bounds.copy(active);
    this.stageProps(active);
    const delta = shift.clone().sub(this.appliedShift);
    this.appliedShift.copy(shift);
    this.center.copy(this.restCenter).add(this.appliedShift);
    if (refit) {
      this.view('Perspective');
      return;
    }
    if (delta.lengthSq() > 0) {
      this.controls.target.add(delta);
      this.camera.position.add(delta);
      this.controls.update();
    }
    const reachRadius = Math.max(this.radius, active.getSize(new T.Vector3()).length() / 2);
    this.orthoCamera.near = reachRadius * 0.005;
    this.orthoCamera.far = reachRadius * 120;
    this.perspectiveCamera.near = Math.max(0.01, reachRadius * 0.02);
    this.perspectiveCamera.far = Math.max(200, reachRadius * 120);
    this.controls.minDistance = reachRadius * 0.45;
    this.controls.maxDistance = reachRadius * 24;
    this.camera.updateMatrixWorld();
    const padW = this.thumbnailMode ? 1.07 : 1.18;
    const padH = this.thumbnailMode ? 1.03 : 1.15;
    const frame = expandedFrame(
      this.baseFrameWidth,
      this.baseFrameHeight,
      this.restBounds,
      this.bounds,
      this.camera.matrixWorldInverse,
      this.radius,
      padW,
      padH,
    );
    const currentRadius = Math.max(0.01, this.restBounds.getSize(new T.Vector3()).length() / 2);
    const modelScale = currentRadius / Math.max(0.01, this.radius);
    const activeSize = projectedBoxSize(this.bounds, this.camera.matrixWorldInverse);
    this.frameWidth = frame.width;
    this.frameHeight = frame.height;
    this.frameDepth = Math.max(this.baseFrameDepth, activeSize.z / modelScale);
    this.resize();
  }
  place(refit: boolean) {
    if (!this.model) return;
    this.clipBounds.clear();
    this.measureRest();
    const size = this.restBounds.getSize(new T.Vector3());
    const center = this.restBounds.getCenter(new T.Vector3());
    if (refit) {
      this.radius = Math.max(0.01, size.length() / 2);
      this.restCenter.copy(center);
      this.gridSize = this.radius / 2;
      this.grid.scale.setScalar(this.gridSize);
      this.ground.scale.setScalar(this.gridSize);
      if (this.scene.fog instanceof T.FogExp2) {
        this.scene.fog.density = (this.projection === 'perspective' ? 0.052 : 0.034) / this.radius;
      }
    }
    const activeClip = !this.thumbnailMode ? this.framedClip : null;
    this.applyFraming(activeClip, refit);
  }
  view(view: View) {
    this.orthoCamera.zoom = 1;
    this.perspectiveCamera.zoom = 1;
    const { aspect } = this.viewportAspect();
    this.baseAspect = aspect;
    const reachRadius = Math.max(this.radius, this.bounds.getSize(new T.Vector3()).length() / 2);
    const dir = new T.Vector3(...VIEW_DIRECTIONS[view]).normalize();
    this.controls.target.copy(this.center);
    this.orthoCamera.position.copy(this.center).addScaledVector(dir, reachRadius * 5.2);
    this.orthoCamera.near = reachRadius * 0.005;
    this.orthoCamera.far = reachRadius * 120;
    this.orthoCamera.lookAt(this.center);
    this.orthoCamera.updateMatrixWorld();
    const padW = this.thumbnailMode ? 1.07 : 1.18;
    const padH = this.thumbnailMode ? 1.03 : 1.15;
    const restSize = projectedBoxSize(this.restBounds, this.orthoCamera.matrixWorldInverse);
    const activeSize = projectedBoxSize(this.bounds, this.orthoCamera.matrixWorldInverse);
    this.baseFrameWidth = Math.max(0.001, restSize.x) * padW;
    this.baseFrameHeight = Math.max(0.001, restSize.y) * padH;
    this.baseFrameDepth = Math.max(0.001, restSize.z);
    const frame = expandedFrame(
      this.baseFrameWidth,
      this.baseFrameHeight,
      this.restBounds,
      this.bounds,
      this.orthoCamera.matrixWorldInverse,
      this.radius,
      padW,
      padH,
    );
    this.frameWidth = frame.width;
    this.frameHeight = frame.height;
    this.frameDepth = Math.max(this.baseFrameDepth, activeSize.z);
    const baseDist = perspectiveDistance(this.baseFrameWidth, this.baseFrameHeight, this.baseFrameDepth, aspect);
    this.perspectiveCamera.position.copy(this.center).addScaledVector(dir, baseDist);
    this.perspectiveCamera.near = Math.max(0.01, reachRadius * 0.02);
    this.perspectiveCamera.far = Math.max(200, reachRadius * 120);
    this.perspectiveCamera.lookAt(this.center);
    this.controls.minDistance = reachRadius * 0.45;
    this.controls.maxDistance = reachRadius * 24;
    this.controls.update();
    this.resize();
  }
  showGrid(show: boolean) {
    this.grid.visible = show;
    this.invalidate();
  }
  setNightMode(on: boolean) {
    this.nightMode = on;
    applyNightLighting(this.scene, this.renderer, this.grid, this.hemi, this.key, this.thumbnailMode, on);
    this.invalidate();
  }
  get isNightMode() {
    return this.nightMode;
  }
  setPickHandler(handler: ((hit: { mesh: T.Mesh; faceIndex: number; materialIndex: number }) => void) | null) {
    this.pickHandler = handler;
    this.renderer.domElement.style.cursor = handler ? 'crosshair' : '';
  }
  wireframe(on: boolean) {
    this.isWire = on;
    for (const [mat, original] of this.wireMaterials) mat.wireframe = on || original;
    this.invalidate();
  }
  get clipFraction() {
    const duration = this.action?.getClip().duration;
    return this.action && duration ? this.action.time / duration : 0;
  }
  private bindClip(index: number) {
    this.action?.stop();
    this.action = null;
    this.clipIndex = index;
    const clip = this.model?.animations[index];
    if (clip && this.mixer) this.action = this.mixer.clipAction(clip).reset().play();
    if (this.action) this.action.paused = !this.playing;
  }
  setClip(index: number) {
    this.bindClip(index);
    if (!this.thumbnailMode) this.applyFraming(this.action?.getClip() ?? null, false);
    else this.invalidate();
  }
  /** Drop cached animation bindings without snapping manually posed rigged parts back to load-time transforms. */
  syncExternalPose() {
    this.playing = false;
    if (this.action && this.mixer && this.model) {
      const clip = this.action.getClip();
      this.mixer.uncacheAction(clip, this.model);
      this.mixer.uncacheClip(clip);
      this.action = null;
    }
    this.invalidate();
  }
  play(on: boolean) {
    if (on && !this.action && this.model?.animations[this.clipIndex]) this.bindClip(this.clipIndex);
    this.playing = on && this.action !== null;
    if (this.action) this.action.paused = !this.playing;
    this.lastTime = 0;
    if (this.playing && !this.thumbnailMode && this.action && this.framedClip !== this.action.getClip()) {
      this.applyFraming(this.action.getClip(), false);
      return;
    }
    this.invalidate();
  }
  seek(frac: number) {
    if (!this.action && this.model?.animations[this.clipIndex]) this.bindClip(this.clipIndex);
    if (!this.action || !this.mixer) return;
    if (!this.thumbnailMode && this.framedClip !== this.action.getClip()) {
      this.applyFraming(this.action.getClip(), false);
    }
    this.action.time = this.action.getClip().duration * Math.min(frac, 0.99999);
    this.mixer.update(0);
    this.invalidate();
  }
  invalidate() {
    this.pendingFrames = 6;
    if (!this.frame && !this.thumbnailMode) this.frame = requestAnimationFrame(this.draw);
  }
  private draw = (now: number) => {
    this.frame = 0;
    if (this.playing && this.mixer && this.lastTime) {
      const delta = Math.min(0.12, (now - this.lastTime) / 1000) * this.speed;
      const clips = this.model?.animations;
      const advance = this.playAll && clips && clips.length > 1 && this.action &&
        this.action.time + delta >= this.action.getClip().duration;
      this.mixer.update(delta);
      if (advance) {
        this.setClip((this.clipIndex + 1) % clips.length);
        this.mixer.update(0);
        this.onAdvance?.(this.clipIndex);
      }
    }
    this.lastTime = now;
    this.renderer.render(this.scene, this.camera);
    if (this.action) this.onTick?.(this.action.time / this.action.getClip().duration);
    if (this.model && ++this.settled === 5) this.onReady?.();
    if (--this.pendingFrames > 0 || this.playing) this.frame = requestAnimationFrame(this.draw);
  };
  restClone<R>(take: () => R): R {
    const wire = this.isWire;
    return this.atRest(() => {
      this.wireframe(false);
      try {
        return take();
      } finally {
        this.wireframe(wire);
      }
    });
  }
  snapshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/webp', 0.86);
  }
}
