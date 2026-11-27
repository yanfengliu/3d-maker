import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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
  private key = new T.DirectionalLight('#ffefd8', 2.7);
  private host: HTMLElement;
  private renderSize = new T.Vector2();
  private radius = 1;
  private frameHeight = 4;
  private frameWidth = 4;
  private bounds = new T.Box3();
  private center = new T.Vector3();
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
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D model. Drag to orbit and scroll to zoom.',
    );
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.maxPolarAngle = Math.PI * 0.95;
    this.controls.minZoom = 0.24;
    this.controls.maxZoom = 9;
    this.controls.addEventListener('change', () => {
      this.invalidate();
    });
    const room = new RoomEnvironment();
    const generator = new T.PMREMGenerator(this.renderer);
    this.scene.environment = generator.fromScene(room, 0.04).texture;
    this.scene.environmentIntensity = 0.62;
    generator.dispose();
    room.dispose();
    this.scene.add(new T.HemisphereLight(0xfffdf4, 0x8b9287, 1.6));
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
      new ResizeObserver(() => {
        this.resize();
      }).observe(host);
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
      if (!(node instanceof T.Mesh)) return;
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
    this.setClip(0);
    this.place(refit);
    this.settled = 0;
    this.invalidate();
  }
  place(refit: boolean) {
    if (!this.model) return;
    this.model.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(this.model, true);
    if (box.isEmpty()) box.set(new T.Vector3(-1, 0, -1), new T.Vector3(1, 2, 1));
    const size = box.getSize(new T.Vector3());
    const center = box.getCenter(new T.Vector3());
    this.shadow.position.set(center.x, box.min.y - 0.012, center.z);
    this.shadow.scale.set(Math.max(size.x, size.y * 0.45) * 1.42, Math.max(size.z, size.y * 0.45) * 1.42, 1);
    if (refit) {
      this.radius = Math.max(0.01, size.length() / 2);
      this.center.copy(center);
      this.bounds.copy(box);
      this.frameHeight =
        Math.max(size.y * 1.15, Math.max(size.x, size.z) * 0.91, this.radius * 1.12) *
        (this.thumbnailMode ? 1.18 : 1.24);
      this.gridSize = this.radius / 2;
      this.grid.scale.setScalar(this.gridSize);
      this.ground.scale.setScalar(this.gridSize);
      this.view('Perspective');
    }
    this.grid.position.set(center.x, box.min.y - 0.022 * this.gridSize, center.z);
    this.ground.position.set(center.x, box.min.y - 0.027 * this.gridSize, center.z);
    this.key.position.copy(center).addScaledVector(new T.Vector3(-2, 4, 2.5), this.radius);
    this.key.target.position.copy(center);
    const lightCamera = this.key.shadow.camera,
      reach = this.radius * 1.45;
    Object.assign(lightCamera, {
      left: -reach,
      right: reach,
      top: reach,
      bottom: -reach,
      near: 0.005,
      far: this.radius * 12,
    });
    lightCamera.updateProjectionMatrix();
    if (this.scene.fog instanceof T.FogExp2) this.scene.fog.density = 0.034 / this.radius;
    this.invalidate();
  }
  view(view: View) {
    this.camera.zoom = 1;
    this.controls.target.copy(this.center);
    this.camera.position
      .copy(this.center)
      .addScaledVector(new T.Vector3(...directions[view]).normalize(), this.radius * 5.2);
    this.camera.near = this.radius * 0.005;
    this.camera.far = this.radius * 120;
    this.camera.lookAt(this.center);
    this.camera.updateMatrixWorld();
    const projected = new T.Box3();
    for (const x of [this.bounds.min.x, this.bounds.max.x])
      for (const y of [this.bounds.min.y, this.bounds.max.y])
        for (const z of [this.bounds.min.z, this.bounds.max.z]) {
          projected.expandByPoint(new T.Vector3(x, y, z).applyMatrix4(this.camera.matrixWorldInverse));
        }
    const projectedSize = projected.getSize(new T.Vector3());
    this.frameWidth = Math.max(0.001, projectedSize.x) * (this.thumbnailMode ? 1.07 : 1.18);
    this.frameHeight = Math.max(0.001, projectedSize.y) * (this.thumbnailMode ? 1.03 : 1.15);
    this.controls.update();
    this.resize();
  }
  showGrid(show: boolean) {
    this.grid.visible = show;
    this.invalidate();
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
  setClip(index: number) {
    this.action?.stop();
    this.action = null;
    this.clipIndex = index;
    const clip = this.model?.animations[index];
    if (clip && this.mixer) this.action = this.mixer.clipAction(clip).reset().play();
    if (this.action) this.action.paused = !this.playing;
    this.invalidate();
  }
  play(on: boolean) {
    this.playing = on && this.action !== null;
    if (this.action) this.action.paused = !this.playing;
    this.lastTime = 0;
    this.invalidate();
  }
  seek(frac: number) {
    if (!this.action || !this.mixer) return;
    this.action.time = this.action.getClip().duration * Math.min(frac, 0.99999);
    this.mixer.update(0);
    this.invalidate();
  }
  private invalidate() {
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
  restClone<T>(take: () => T): T {
    const time = this.action?.time ?? 0,
      paused = this.action?.paused ?? true,
      wire = this.isWire;
    this.action?.stop();
    this.wireframe(false);
    try {
      return take();
    } finally {
      if (this.action) {
        this.action.play();
        this.action.time = time;
        this.action.paused = paused;
        this.mixer?.update(0);
      }
      this.wireframe(wire);
    }
  }
  snapshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/webp', 0.86);
  }
}
