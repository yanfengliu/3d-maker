import { Color, Group, Mesh } from 'three';
import type { Material } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type ImportSource = { kind: 'local'; filename: string } | { kind: 'polyfork'; assetId: string; title: string; category?: string };
export interface ImportEdits {
  name: string;
  tint: string;
  scale: number;
  proportion: number;
}

export interface ImportedAsset {
  group: Group;
  source: ImportSource;
  edits: ImportEdits;
  originalFile: Blob | null;
  colors: Map<Material & { color: Color }, Color>;
}

/** Only binaries from the official free catalogue are fetched. */
export function polyforkGlbUrl(id: string): string {
  if (!/^[a-z0-9][a-z0-9_-]{0,159}$/.test(id)) throw new Error('Invalid PolyFork asset ID.');
  return `https://polyfork.dev/cdn/${id}.glb`;
}

export function validateEdits(edits: ImportEdits): ImportEdits {
  if (typeof edits.name !== 'string' || !edits.name.trim() || edits.name.trim().length > 80) {
    throw new Error('Enter a name between 1 and 80 characters.');
  }
  if (!/^#[a-f\d]{6}$/i.test(edits.tint)) throw new Error('Choose a six-digit tint color.');
  if (![edits.scale, edits.proportion].every(value => Number.isFinite(value) && value >= 0.65 && value <= 1.5)) {
    throw new Error('Scale and proportion must be between 0.65 and 1.5.');
  }
  return { name: edits.name.trim(), tint: edits.tint.toLowerCase(), scale: edits.scale, proportion: edits.proportion };
}

export function applyImportEdits(asset: ImportedAsset, next: ImportEdits): void {
  const edits = validateEdits(next);
  const tint = new Color(edits.tint);
  for (const [material, base] of asset.colors) material.color.copy(base).multiply(tint);
  // The transform sits outside the imported scene, including its animated root and skeleton.
  asset.group.scale.set(edits.scale, edits.scale * edits.proportion, edits.scale);
  asset.group.userData.studioName = edits.name;
  if (asset.source.kind === 'polyfork') {
    asset.group.userData.attribution = {
      title: asset.source.title,
      creator: 'Polyfork',
      url: `https://polyfork.dev/asset/${asset.source.assetId}`,
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      changes: `Imported into 3D Maker. Tint ${edits.tint}, scale ${String(edits.scale)}, height multiplier ${String(edits.proportion)}.`,
    };
  }
  asset.group.updateMatrixWorld(true);
  asset.edits = edits;
}

function documentChunk(bytes: ArrayBuffer): Record<string, unknown> {
  const header = new DataView(bytes);
  if (bytes.byteLength < 20 || header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 ||
    header.getUint32(8, true) !== bytes.byteLength || header.getUint32(16, true) !== 0x4e4f534a) {
    throw new Error('Choose a valid binary glTF 2.0 (.glb) file.');
  }
  const size = header.getUint32(12, true);
  if (20 + size > bytes.byteLength) throw new Error('The GLB file is incomplete.');
  const document: unknown = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, size)));
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new Error('Invalid GLB document.');
  return document as Record<string, unknown>;
}

function checkResources(bytes: ArrayBuffer): void {
  const document = documentChunk(bytes);
  // Check before parsing. Image failures can otherwise be silently converted to missing textures by GLTFLoader.
  for (const collection of [document.buffers, document.images]) {
    if (!Array.isArray(collection)) continue;
    for (const resource of collection as unknown[]) {
      if (resource && typeof resource === 'object' && 'uri' in resource &&
        (typeof resource.uri !== 'string' || !resource.uri.startsWith('data:'))) {
        throw new Error('Embed all textures and buffers in the GLB before importing.');
      }
    }
  }
}

async function openBinary(bytes: ArrayBuffer, source: ImportSource, label: string, file: Blob | null): Promise<ImportedAsset> {
  checkResources(bytes);
  const gltf = await new GLTFLoader().parseAsync(bytes, '');
  const colors: ImportedAsset['colors'] = new Map();
  if (!gltf.scene.getObjectByProperty('isMesh', true)) throw new Error('This GLB has no mesh in its default scene.');
  gltf.scene.traverse(node => {
    if (!(node instanceof Mesh)) return;
    const materials: Material | Material[] = node.material as Material | Material[];
    for (const material of Array.isArray(materials) ? materials : [materials]) {
      if ('color' in material && material.color instanceof Color) {
        const colored = material as Material & { color: Color };
        if (!colors.has(colored)) colors.set(colored, colored.color.clone());
      }
    }
  });
  const group = new Group();
  group.add(gltf.scene);
  // GLTFExporter builds a new asset header. Carry source credits and licence metadata through the wrapper.
  group.userData.sourceAsset = gltf.asset;
  group.animations = gltf.animations;
  const name = label.trim().slice(0, 80) || 'Imported asset';
  const asset = { group, source, originalFile: file, colors, edits: { name, tint: '#ffffff', scale: 1, proportion: 1 } };
  applyImportEdits(asset, asset.edits);
  return asset;
}

export function openStoredFile(file: Blob, filename: string): Promise<ImportedAsset> {
  return file.arrayBuffer().then(bytes => openBinary(bytes, { kind: 'local', filename }, filename.replace(/\.glb$/i, ''), file));
}

export function openLocalGlb(file: File): Promise<ImportedAsset> {
  return openStoredFile(file, file.name);
}

export async function openPolyforkGlb(assetId: string, name: string, signal?: AbortSignal, category?: string): Promise<ImportedAsset> {
  const response = await fetch(polyforkGlbUrl(assetId), { credentials: 'omit', signal: signal ?? null });
  if (!response.ok) throw new Error(`PolyFork could not supply this model (HTTP ${String(response.status)}).`);
  return openBinary(await response.arrayBuffer(), { kind: 'polyfork', assetId, title: name, ...(category ? { category } : {}) }, name, null);
}
