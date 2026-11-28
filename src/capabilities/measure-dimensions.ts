import * as T from 'three';
import { expandInstancedBounds } from '../instanced-bounds';
import type { AssetCapabilities, AssetDimensionsSpec } from './schema';

export function measureDimensions(root: T.Object3D, prototypeOnly = false) {
  root.updateMatrixWorld(true);
  const box = new T.Box3();
  const vertex = new T.Vector3();
  root.traverse(node => {
    if (node.userData.studioOverlay || !(node instanceof T.Mesh)) return;
    const geometry = node.geometry as T.BufferGeometry;
    const pos = geometry.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    if (!pos || !pos.count) return;
    if (!prototypeOnly && node instanceof T.InstancedMesh) {
      expandInstancedBounds(box, node);
      return;
    }
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i).applyMatrix4(node.matrixWorld);
      box.expandByPoint(vertex);
    }
  });
  if (box.isEmpty()) return undefined;
  const size = box.getSize(new T.Vector3());
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    sizeM: { x: round(size.x), y: round(size.y), z: round(size.z) },
    originY: round(box.min.y),
  };
}

function sameDimensions(a: AssetDimensionsSpec, b: AssetDimensionsSpec | undefined, error: T.Vector3) {
  if (!b) return false;
  return Math.abs(a.originY - b.originY) <= error.y && Math.abs(a.sizeM.y - b.sizeM.y) <= error.y &&
    Math.abs(a.sizeM.x - b.sizeM.x) <= error.x && Math.abs(a.sizeM.z - b.sizeM.z) <= error.z;
}

function studioImportWrapper(node: T.Object3D) {
  return Boolean(node.userData.sourceAsset) && typeof node.userData.studioName === 'string';
}

/** Old raw-file imports wrote inferred dimensions on the studio's own file wrapper.
 * Authored manifests stay on their source node beneath that wrapper.
 */
export function refreshLegacyInstanceDimensions(root: T.Object3D, manifest: AssetCapabilities) {
  const stored = manifest.dimensions;
  if (!stored || stored.origin !== undefined || manifest.source?.kind !== 'local' || manifest.source.kit) return;
  const scales: T.Vector3[] = [];
  let host = root;
  while (!host.userData.formFoundry && host.children.length === 1 && host.children[0]) {
    if (studioImportWrapper(host)) scales.push(host.scale);
    host = host.children[0];
  }
  if (!host.userData.formFoundry || !studioImportWrapper(host) || !root.getObjectByProperty('isInstancedMesh', true)) return;
  scales.push(host.scale);
  const measured = measureDimensions(root);
  const halfMillimetre = 0.0005;
  const error = new T.Vector3().setScalar(halfMillimetre + 1e-9);
  if (!measured || sameDimensions(stored, measured, error)) return;
  // Each nested import scales an already millimetre-rounded value, then rounds its edit again.
  // Work outwards from the original import, propagating that maximum error per axis.
  for (const scale of scales.reverse()) error.multiply(scale).addScalar(halfMillimetre);
  error.addScalar(halfMillimetre); // the comparison prototype was also rounded to millimetres
  if (sameDimensions(stored, measureDimensions(root, true), error)) manifest.dimensions = measured;
}
