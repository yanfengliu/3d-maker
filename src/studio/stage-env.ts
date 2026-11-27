import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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

export function softShadow() {
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

export function buildRoomEnvironment(renderer: T.WebGLRenderer): T.Texture {
  const room = new RoomEnvironment();
  const generator = new T.PMREMGenerator(renderer);
  const texture = generator.fromScene(room, 0.04).texture;
  generator.dispose();
  room.dispose();
  return texture;
}

export function measureModelBounds(model: T.Group): T.Box3 {
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
}

export function applyNightLighting(
  scene: T.Scene,
  renderer: T.WebGLRenderer,
  grid: T.GridHelper,
  hemi: T.HemisphereLight,
  key: T.DirectionalLight,
  thumbnailMode: boolean,
  on: boolean,
) {
  if (!thumbnailMode) {
    const clear = on ? 0x181f2e : 0xe7e8e1;
    renderer.setClearColor(clear, 1);
    if (scene.fog instanceof T.FogExp2) scene.fog.color.setHex(clear);
    const gridMat = grid.material;
    if (gridMat instanceof T.Material) {
      gridMat.transparent = on;
      gridMat.opacity = on ? 0.18 : 1;
      gridMat.needsUpdate = true;
    }
  }
  scene.environmentIntensity = on ? 0.16 : 0.62;
  hemi.color.setHex(on ? 0x5c75a8 : 0xfffdf4);
  hemi.groundColor.setHex(on ? 0x1a2030 : 0x8b9287);
  hemi.intensity = on ? 0.55 : 1.6;
  key.color.setHex(on ? 0x99b7eb : 0xffefd8);
  key.intensity = on ? 0.65 : 2.7;
}

export function updateStageProps(
  box: T.Box3,
  radius: number,
  gridSize: number,
  shadow: T.Mesh,
  grid: T.GridHelper,
  ground: T.Mesh,
  key: T.DirectionalLight,
) {
  const size = box.getSize(new T.Vector3());
  const center = box.getCenter(new T.Vector3());
  const reachRadius = Math.max(radius, size.length() / 2);
  shadow.position.set(center.x, box.min.y - 0.012, center.z);
  shadow.scale.set(Math.max(size.x, size.y * 0.45) * 1.42, Math.max(size.z, size.y * 0.45) * 1.42, 1);
  grid.position.set(center.x, box.min.y - 0.022 * gridSize, center.z);
  ground.position.set(center.x, box.min.y - 0.027 * gridSize, center.z);
  key.position.copy(center).addScaledVector(new T.Vector3(-2, 4, 2.5), reachRadius);
  key.target.position.copy(center);
  const lightCamera = key.shadow.camera;
  const reach = reachRadius * 1.45;
  Object.assign(lightCamera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 0.005, far: reachRadius * 12 });
  lightCamera.updateProjectionMatrix();
}
