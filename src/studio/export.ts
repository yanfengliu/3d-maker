import { type BufferGeometry, type Material, Mesh, type Group, type Object3D } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { inspectAsset, isSynthesizedClip, synthesizeRigClips, type AssetController } from '../capabilities/runtime';
import { writeCapabilities } from '../capabilities/schema';

export interface ExportOptions {
  includePartClips?: boolean;
}

/** Capture the rig at rest, preserving detachable subtrees, active part poses, capability manifest, and optional part clips. */
export function cloneForExport(source: Group, options?: ExportOptions, controller?: AssetController | null) {
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

  const capabilities = controller ? controller.syncManifest() : inspectAsset(source);
  // Re-apply authoritative rigged part poses onto the clone so animation mixer resets never bake stale transforms.
  controller?.applyPoseToClone(root);

  // Keep declared detachable subtrees in the exported GLB even while hidden; state.hiddenParts restores visibility on load.
  for (const part of capabilities.detachableParts) {
    let node: Object3D | null = root.getObjectByName(part.name) ?? null;
    while (node) {
      node.visible = true;
      node = node === root ? null : node.parent;
    }
  }

  const synthNames = new Set(capabilities.clips?.filter(c => c.synthesized).map(c => c.name));
  if (options?.includePartClips && capabilities.riggedParts.length) {
    const existing = new Set(root.animations.map(clip => clip.name));
    for (const clip of synthesizeRigClips(root, capabilities)) {
      if (!existing.has(clip.name)) {
        root.animations.push(clip);
        existing.add(clip.name);
        synthNames.add(clip.name);
      }
    }
  }
  if (root.animations.length) {
    capabilities.clips = root.animations.map(clip => {
      const synthesized = isSynthesizedClip(clip) || synthNames.has(clip.name);
      return {
        name: clip.name,
        duration: Math.round(clip.duration * 1000) / 1000,
        ...(synthesized ? { synthesized: true } : {}),
      };
    });
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
