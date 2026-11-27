import * as T from 'three';

const sampleCount = 7;
const maxSkinSamples = 400;
const maxMeshSamples = 800;

export function fastBounds(root: T.Object3D): T.Box3 {
  root.updateMatrixWorld(true);
  const box = new T.Box3();
  const vertex = new T.Vector3();
  root.traverse((node) => {
    if (!(node instanceof T.Mesh)) return;
    const geometry = node.geometry as T.BufferGeometry;
    const position = geometry.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    if (!position || position.count === 0) return;
    const skinned = node instanceof T.SkinnedMesh;
    if (skinned) node.skeleton.update();
    const limit = skinned ? maxSkinSamples : maxMeshSamples;
    const step = Math.max(1, Math.floor(position.count / limit));
    for (let i = 0; i < position.count; i += step) {
      vertex.fromBufferAttribute(position, i);
      if (skinned) node.applyBoneTransform(i, vertex);
      vertex.applyMatrix4(node.matrixWorld);
      box.expandByPoint(vertex);
    }
    const last = position.count - 1;
    if (last % step !== 0) {
      vertex.fromBufferAttribute(position, last);
      if (skinned) node.applyBoneTransform(last, vertex);
      vertex.applyMatrix4(node.matrixWorld);
      box.expandByPoint(vertex);
    }
  });
  return box;
}

export function sampleClipBounds(root: T.Object3D, clip: T.AnimationClip, fallback: T.Box3): T.Box3 {
  const mixer = new T.AnimationMixer(root);
  const action = mixer.clipAction(clip).reset().play();
  const bounds = new T.Box3();
  const steps = clip.duration > 0 ? sampleCount : 1;
  try {
    for (let i = 0; i < steps; i++) {
      action.time = steps > 1 ? Math.min(clip.duration * 0.99999, (clip.duration * i) / (steps - 1)) : 0;
      mixer.update(0);
      bounds.union(fastBounds(root));
    }
  } finally {
    action.stop();
    mixer.uncacheRoot(root);
    root.updateMatrixWorld(true);
    root.traverse((node) => {
      if (node instanceof T.SkinnedMesh) node.skeleton.update();
    });
  }
  return bounds.isEmpty() ? fallback.clone() : bounds;
}

export function projectedBoxSize(box: T.Box3, inverseCameraMatrix: T.Matrix4): T.Vector3 {
  const projected = new T.Box3();
  const corner = new T.Vector3();
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        projected.expandByPoint(corner.set(x, y, z).applyMatrix4(inverseCameraMatrix));
      }
  return projected.getSize(new T.Vector3());
}

export function clipFocusShift(restBounds: T.Box3, clipBounds: T.Box3, radius: number): T.Vector3 {
  const restCenter = restBounds.getCenter(new T.Vector3());
  const clipCenter = clipBounds.getCenter(new T.Vector3());
  const shift = clipCenter.sub(restCenter);
  const tolerance = Math.max(0.005, radius * 0.02);
  if (shift.length() <= tolerance && Math.abs(clipBounds.min.y - restBounds.min.y) <= tolerance) {
    return new T.Vector3();
  }
  return shift;
}

export function expandedFrame(
  baseWidth: number,
  baseHeight: number,
  restBounds: T.Box3,
  activeBounds: T.Box3,
  inverseCameraMatrix: T.Matrix4,
  restRadius: number,
  padWidth: number,
  padHeight: number,
): { width: number; height: number } {
  const currentRadius = Math.max(0.01, restBounds.getSize(new T.Vector3()).length() / 2);
  const modelScale = currentRadius / Math.max(0.01, restRadius);
  const activeSize = projectedBoxSize(activeBounds, inverseCameraMatrix);
  return {
    width: Math.max(baseWidth, (Math.max(0.001, activeSize.x) / modelScale) * padWidth),
    height: Math.max(baseHeight, (Math.max(0.001, activeSize.y) / modelScale) * padHeight),
  };
}
