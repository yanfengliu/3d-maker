import { type BufferGeometry, type Material, Mesh, type Group } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

/** Capture the rig at rest, including material and vertex colors at export time. */
export function cloneForExport(source: Group) {
  const root = clone(source);
  const materials = new Map<Material, Material>();
  const paintedGeometry = new Map<BufferGeometry, BufferGeometry>();
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
  function copyNode(original: typeof root, copy: typeof root) {
    copy.uuid = original.uuid;
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
  root.animations = source.animations.map((clip) => clip.clone());
  return {
    root,
    dispose: () => {
      for (const material of materials.values()) material.dispose();
      for (const geometry of paintedGeometry.values()) geometry.dispose();
    },
  };
}
