import { type BufferGeometry, type Material, Mesh, type Group, type Object3D } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { inspectAsset, synthesizeRigClips } from '../capabilities/runtime';
import { writeCapabilities } from '../capabilities/schema';

export interface ExportOptions {
  includePartClips?: boolean;
}

/** Capture the rig at rest, including material/vertex colors, capability manifest, and optional part clips. */
export function cloneForExport(source: Group, options?: ExportOptions) {
  const root = clone(source);
  const materials = new Map<Material, Material>();
  const paintedGeometry = new Map<BufferGeometry, BufferGeometry>();
  const overlays: Object3D[] = [];
  function copyMaterial(material: Material) {
    let copy = materials.get(material);
    if (!copy) {
      copy = material.clone();
      materials.set(material, copy);
    }
    return copy;
  }
  // GLTFLoader can bind tracks to UUIDs on unnamed nodes. Preserve those identities
  // in the isolated export graph so named and anonymous targets both resolve.
  function copyNode(original: Object3D, copy: Object3D) {
    if (original.userData.studioOverlay) {
      overlays.push(copy);
      return;
    }
    copy.uuid = original.uuid;
    copy.visible = original.visible;
    if (copy instanceof Mesh && original instanceof Mesh) {
      const material = original.material as Material | Material[];
      copy.material = Array.isArray(material) ? material.map(copyMaterial) : copyMaterial(material);
      const geometry = original.geometry as BufferGeometry;
      if (geometry.hasAttribute('color')) {
        let snapshot = paintedGeometry.get(geometry);
        if (!snapshot) {
          snapshot = geometry.clone();
          paintedGeometry.set(geometry, snapshot);
        }
        copy.geometry = snapshot;
      }
    }
    original.children.forEach((node, index) => {
      const child = copy.children[index];
      if (child) copyNode(node, child);
    });
  }
  copyNode(source, root);
  for (const overlay of overlays) overlay.removeFromParent();
  root.animations = source.animations.map((clip) => clip.clone());
  const capabilities = inspectAsset(source);
  if (options?.includePartClips && capabilities.riggedParts.length) {
    const existing = new Set(root.animations.map(clip => clip.name));
    for (const clip of synthesizeRigClips(root, capabilities)) {
      if (!existing.has(clip.name)) {
        root.animations.push(clip);
        existing.add(clip.name);
      }
    }
  }
  if (root.animations.length) {
    capabilities.clips = root.animations.map(clip => ({ name: clip.name, duration: Math.round(clip.duration * 1000) / 1000 }));
  } else delete capabilities.clips;
  writeCapabilities(root, capabilities);
  return {
    root,
    dispose: () => {
      for (const material of materials.values()) material.dispose();
      for (const geometry of paintedGeometry.values()) geometry.dispose();
    },
  };
}
