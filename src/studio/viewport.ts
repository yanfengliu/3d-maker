import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clipFocusShift, expandedFrame, projectedBoxSize, sampleClipBounds } from './framing';

export type View = 'Perspective' | 'Front' | 'Top' | 'Side';
const directions: Record<View, [number, number, number]> = {
  Perspective: [5, 3.55, 6.5],
  Front: [0, 0.35, 7],
  Top: [0, 8, 0.001],
  Side: [8, 0.3, 0],
};
export function disposeModel(root: T.Object3D) {
  const resources = new Set<T.BufferGeometry | T.Material | T.Texture | T.Skeleton>();
  root.traverse((node) => {
    if (!(node instanceof T.Mesh)) return;
    resources.add(node.geometry as T.BufferGeometry);
    if (node instanceof T.SkinnedMesh) resources.add(node.skeleton);
    const materials: T.Material[] = Array.isArray(node.material)
      ? (node.material as T.Material[])
      : [node.material as T.Material];
    for (const mat of materials) {
      resources.add(mat);
      for (const value of Object.values(mat)) if (value instanceof T.Texture) resources.add(value);
    }
  });
  for (const res of resources) res.dispose();
}

function softShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const brush = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);
  brush.addColorStop(0, 'rgba(49,45,31,0.32)');
  brush.addColorStop(0.5, 'rgba(57,53,39,0.17)');
  brush.addColorStop(1, 'rgba(57,53,39,0)');
  ctx.fillStyle = brush;
  ctx.fillRect(0, 0, 128, 128);
  const shadow = new T.Mesh(
    new T.PlaneGeometry(1, 1),
    new T.MeshBasicMaterial({ map: new T.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  return shadow;
}

export class Viewport {
  private renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  private camera = new T.OrthographicCamera(-2, 2, 2, -2, 0.01, 2000);
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
  private frameHeight = 4;
  private frameWidth = 4;
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
  constructor(host: HTMLElement, thumbnail = false) {
    this.host = host;
    this.thumbnailMode = thumbnail;
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(thumbnail ? 1.5 : Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0xe7e8e1, thumbnail ? 0 : 1);
    this.renderer.shadowMap.enabled = !thumbnail;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D model. Drag to orbit and scroll to zoom.');
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.maxPolarAngle = Math.PI * 0.95;
    this.controls.minZoom = 0.24;
    this.controls.maxZoom = 9;
    this.controls.addEventListener('change', () => { this.invalidate(); });
    const room = new RoomEnvironment();
    const generator = new T.PMREMGenerator(this.renderer);
    this.scene.environment = generator.fromScene(room, 0.04).texture;
    this.scene.environmentIntensity = 0.62;
    generator.dispose();
    room.dispose();
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
  private resize() {
    const w = Math.max(1, this.host.clientWidth),
      h = Math.max(1, this.host.clientHeight);
    this.renderer.getSize(this.renderSize);
    const changed = w !== this.renderSize.x || h !== this.renderSize.y;
    if (changed) this.renderer.setSize(w, h, false);
    const half = Math.max(this.frameHeight, (this.frameWidth * h) / w) * 0.5;
    this.camera.left = (-half * w) / h;
    this.camera.right = (half * w) / h;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
    // ResizeObserver runs after the frame callbacks. Resizing clears WebGL's buffer;
    // draw the new projection before this frame is presented when an inspector tab changes.
    if (changed && this.model) this.renderer.render(this.scene, this.camera);
    this.invalidate();
  }
  setModel(model: T.Group, refit = true) {
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
    this.clipBounds.clear();
    this.framedClip = null;
    if (refit) this.appliedShift.set(0, 0, 0);
    this.place(refit);
    this.bindClip(0);
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
    const box = this.atRest(() => {
      model.updateMatrixWorld(true);
      const measured = new T.Box3();
      const vertex = new T.Vector3();
      model.traverse((node) => {
        if (node.userData.studioOverlay || !(node instanceof T.Mesh)) return;
        const geometry = node.geometry as T.BufferGeometry;
        const pos = geometry.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
        if (!pos || !pos.count) return;
        const skinned = node instanceof T.SkinnedMesh;
        if (skinned) node.skeleton.update();
        for (let i = 0; i < pos.count; i++) {
          vertex.fromBufferAttribute(pos, i);
          if (skinned) node.applyBoneTransform(i, vertex);
          vertex.applyMatrix4(node.matrixWorld);
          measured.expandByPoint(vertex);
        }
      });
      if (measured.isEmpty()) measured.set(new T.Vector3(-1, 0, -1), new T.Vector3(1, 2, 1));
      return measured;
    });
    this.restBounds.copy(box);
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
    const size = box.getSize(new T.Vector3());
    const center = box.getCenter(new T.Vector3());
    const reachRadius = Math.max(this.radius, size.length() / 2);
    this.shadow.position.set(center.x, box.min.y - 0.012, center.z);
    this.shadow.scale.set(Math.max(size.x, size.y * 0.45) * 1.42, Math.max(size.z, size.y * 0.45) * 1.42, 1);
    this.grid.position.set(center.x, box.min.y - 0.022 * this.gridSize, center.z);
    this.ground.position.set(center.x, box.min.y - 0.027 * this.gridSize, center.z);
    this.key.position.copy(center).addScaledVector(new T.Vector3(-2, 4, 2.5), reachRadius);
    this.key.target.position.copy(center);
    const lightCamera = this.key.shadow.camera;
    const reach = reachRadius * 1.45;
    Object.assign(lightCamera, {
      left: -reach,
      right: reach,
      top: reach,
      bottom: -reach,
      near: 0.005,
      far: reachRadius * 12,
    });
    lightCamera.updateProjectionMatrix();
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
    this.camera.near = reachRadius * 0.005;
    this.camera.far = reachRadius * 120;
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
    this.frameWidth = frame.width;
    this.frameHeight = frame.height;
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
      if (this.scene.fog instanceof T.FogExp2) this.scene.fog.density = 0.034 / this.radius;
    }
    const activeClip = !this.thumbnailMode ? this.framedClip : null;
    this.applyFraming(activeClip, refit);
  }
  view(view: View) {
    this.camera.zoom = 1;
    const reachRadius = Math.max(this.radius, this.bounds.getSize(new T.Vector3()).length() / 2);
    this.controls.target.copy(this.center);
    this.camera.position
      .copy(this.center)
      .addScaledVector(new T.Vector3(...directions[view]).normalize(), reachRadius * 5.2);
    this.camera.near = reachRadius * 0.005;
    this.camera.far = reachRadius * 120;
    this.camera.lookAt(this.center);
    this.camera.updateMatrixWorld();
    const padW = this.thumbnailMode ? 1.07 : 1.18;
    const padH = this.thumbnailMode ? 1.03 : 1.15;
    const restSize = projectedBoxSize(this.restBounds, this.camera.matrixWorldInverse);
    this.baseFrameWidth = Math.max(0.001, restSize.x) * padW;
    this.baseFrameHeight = Math.max(0.001, restSize.y) * padH;
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
    this.frameWidth = frame.width;
    this.frameHeight = frame.height;
    this.controls.update();
    this.resize();
  }
  showGrid(show: boolean) {
    this.grid.visible = show;
    this.invalidate();
  }
  setNightMode(on: boolean) {
    this.nightMode = on;
    if (!this.thumbnailMode) {
      const clear = on ? 0x181f2e : 0xe7e8e1;
      this.renderer.setClearColor(clear, 1);
      if (this.scene.fog instanceof T.FogExp2) this.scene.fog.color.setHex(clear);
      const gridMat = this.grid.material;
      if (gridMat instanceof T.Material) {
        gridMat.transparent = on;
        gridMat.opacity = on ? 0.18 : 1;
        gridMat.needsUpdate = true;
      }
    }
    this.scene.environmentIntensity = on ? 0.16 : 0.62;
    this.hemi.color.setHex(on ? 0x5c75a8 : 0xfffdf4);
    this.hemi.groundColor.setHex(on ? 0x1a2030 : 0x8b9287);
    this.hemi.intensity = on ? 0.55 : 1.6;
    this.key.color.setHex(on ? 0x99b7eb : 0xffefd8);
    this.key.intensity = on ? 0.65 : 2.7;
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
