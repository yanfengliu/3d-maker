import { Color, Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createAssetController, inspectAsset, type AssetController } from '../capabilities/runtime';
import { readCapabilities, type AssetCapabilities } from '../capabilities/schema';
import { abortableDelay } from '../data/polyfork';
import { buildPolyforkCapabilities, fetchPolyforkDetail } from '../data/polyfork-detail';
import { applyPalette, buildPalette, validatePaint, type ImportPalette } from './paint';

export type ImportSource = { kind: 'local'; filename: string } | { kind: 'polyfork'; assetId: string; title: string; category?: string };
export interface ImportEdits {
  name: string;
  tint: string;
  scale: number;
  proportion: number;
  paint?: Record<string, string>;
  pose?: Record<string, number>;
  hiddenParts?: string[];
  night?: boolean;
  decalText?: Record<string, string>;
}

export interface ImportedAsset {
  group: Group;
  source: ImportSource;
  edits: ImportEdits;
  originalFile: Blob | null;
  palette: ImportPalette;
  capabilities: AssetCapabilities;
  controller: AssetController;
  droppedPaintSlots?: string[];
}

export function reconcileSavedEdits(asset: ImportedAsset, saved: ImportEdits): { edits: ImportEdits; dropped: string[] } {
  const dropped: string[] = [];
  const base: ImportEdits = { name: saved.name, tint: saved.tint, scale: saved.scale, proportion: saved.proportion };
  if (saved.paint) {
    const kept: Record<string, string> = {};
    for (const [id, hex] of Object.entries(saved.paint)) {
      if (asset.palette.slots.has(id)) kept[id] = hex;
      else dropped.push(id);
    }
    if (Object.keys(kept).length) base.paint = kept;
  }
  if (saved.pose) {
    const validRigged = new Set(asset.capabilities.riggedParts.map(p => p.name));
    const keptPose: Record<string, number> = {};
    for (const [name, value] of Object.entries(saved.pose)) {
      if (validRigged.has(name) && Number.isFinite(value)) keptPose[name] = value;
    }
    if (Object.keys(keptPose).length) base.pose = keptPose;
  }
  if (saved.hiddenParts?.length) {
    const validDetach = new Set(asset.capabilities.detachableParts.map(p => p.name));
    const keptHidden = saved.hiddenParts.filter(name => validDetach.has(name));
    if (keptHidden.length) base.hiddenParts = [...new Set(keptHidden)];
  }
  if (saved.night && asset.capabilities.nightZones.length) base.night = true;
  if (saved.decalText) {
    const validDecals = new Set(asset.capabilities.decals.map(d => d.name));
    const keptText: Record<string, string> = {};
    for (const [name, text] of Object.entries(saved.decalText)) {
      if (validDecals.has(name) && text.trim()) keptText[name] = text.trim().slice(0, 60);
    }
    if (Object.keys(keptText).length) base.decalText = keptText;
  }
  return { edits: base, dropped };
}

export function listPaintSlots(asset: ImportedAsset) {
  return Array.from(asset.palette.slots.values(), slot => ({
    ...slot, originalColor: slot.color, color: asset.edits.paint?.[slot.id] ?? slot.color,
  }));
}

/** Only binaries from the official free catalogue are fetched. */
export function polyforkGlbUrl(id: string): string {
  if (!/^[a-z0-9][a-z0-9_-]{0,159}$/.test(id)) throw new Error('Invalid PolyFork asset ID.');
  return `https://polyfork.dev/cdn/${id}.glb`;
}

function validatePose(value: unknown): Record<string, number> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Supply a part pose map.');
  const result: Record<string, number> = {};
  for (const [name, angle] of Object.entries(value)) {
    if (!name.trim() || typeof angle !== 'number' || !Number.isFinite(angle)) {
      throw new Error('Invalid part pose value for ' + name + '.');
    }
    if (Math.abs(angle) > 1e-6) result[name] = Math.round(angle * 1000) / 1000;
  }
  return Object.keys(result).length ? result : undefined;
}

function validateHiddenParts(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((v): v is string => typeof v === 'string' && v.trim().length > 0)) {
    throw new Error('Supply a list of hidden part names.');
  }
  const unique = [...new Set(value.map(v => v.trim()))].sort();
  return unique.length ? unique : undefined;
}

function validateDecalText(value: unknown): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Supply a decal text map.');
  const result: Record<string, string> = {};
  for (const [name, text] of Object.entries(value)) {
    if (!name.trim() || typeof text !== 'string') throw new Error('Invalid decal text entry.');
    const trimmed = text.trim().slice(0, 60);
    if (trimmed) result[name] = trimmed;
  }
  return Object.keys(result).length ? result : undefined;
}

export function validateEdits(edits: ImportEdits): ImportEdits {
  if (typeof edits.name !== 'string' || !edits.name.trim() || edits.name.trim().length > 80) {
    throw new Error('Enter a name between 1 and 80 characters.');
  }
  if (!/^#[a-f\d]{6}$/i.test(edits.tint)) throw new Error('Choose a six-digit tint color.');
  if (![edits.scale, edits.proportion].every(value => Number.isFinite(value) && value >= 0.65 && value <= 1.5)) {
    throw new Error('Scale and proportion must be between 0.65 and 1.5.');
  }
  if (edits.night !== undefined && typeof edits.night !== 'boolean') throw new Error('Night mode must be true or false.');
  const paint = validatePaint(edits.paint);
  const pose = validatePose(edits.pose);
  const hiddenParts = validateHiddenParts(edits.hiddenParts);
  const decalText = validateDecalText(edits.decalText);
  return {
    name: edits.name.trim(),
    tint: edits.tint.toLowerCase(),
    scale: edits.scale,
    proportion: edits.proportion,
    ...(paint ? { paint } : {}),
    ...(pose ? { pose } : {}),
    ...(hiddenParts ? { hiddenParts } : {}),
    ...(edits.night ? { night: true } : {}),
    ...(decalText ? { decalText } : {}),
  };
}

export function applyImportEdits(asset: ImportedAsset, next: ImportEdits): void {
  const edits = validateEdits(next);
  // Validate part names before mutating anything so rejected edits leave the scene clean.
  const riggedSet = new Set(asset.capabilities.riggedParts.map(p => p.name));
  for (const name of Object.keys(edits.pose ?? {})) {
    if (!riggedSet.has(name)) throw new Error('This model has no rigged part named ' + name + '.');
  }
  const detachSet = new Set(asset.capabilities.detachableParts.map(p => p.name));
  for (const name of edits.hiddenParts ?? []) {
    if (!detachSet.has(name)) throw new Error('This model has no detachable part named ' + name + '.');
  }
  const decalSet = new Set(asset.capabilities.decals.map(d => d.name));
  for (const name of Object.keys(edits.decalText ?? {})) {
    if (!decalSet.has(name)) throw new Error('This model has no decal area named ' + name + '.');
  }

  applyPalette(asset.palette, new Color(edits.tint), asset.edits.paint, edits.paint);
  // Keep night zone albedos synchronized when a user repaints a zone so exported GLBs stay self-consistent.
  for (const zone of asset.capabilities.nightZones) {
    const slot = asset.palette.slots.get('zone-' + zone.name);
    if (slot) zone.albedo = (edits.paint?.[slot.id] ?? slot.color).toLowerCase();
  }

  asset.controller.resetParts();
  const clampedPose: Record<string, number> = {};
  for (const [name, value] of Object.entries(edits.pose ?? {})) {
    const applied = asset.controller.setPart(name, value);
    if (Math.abs(applied) > 1e-6) clampedPose[name] = Math.round(applied * 1000) / 1000;
  }
  if (Object.keys(clampedPose).length) edits.pose = clampedPose;
  else delete edits.pose;

  asset.controller.resetVisibility();
  for (const name of edits.hiddenParts ?? []) asset.controller.setVisible(name, false);

  const nightOn = Boolean(edits.night && asset.capabilities.nightZones.length);
  asset.controller.setNight(nightOn);
  if (nightOn) edits.night = true;
  else delete edits.night;

  if (edits.decalText && Object.keys(edits.decalText).length) {
    asset.controller.setDecalsVisible(true, edits.decalText);
  } else if (asset.controller.areDecalsVisible()) {
    asset.controller.setDecalsVisible(true, {});
  }

  // The transform sits outside the imported scene, including its animated root and skeleton.
  asset.group.scale.set(edits.scale, edits.scale * edits.proportion, edits.scale);
  asset.group.userData.studioName = edits.name;
  asset.capabilities.name = edits.name;
  asset.controller.capabilities.name = edits.name;
  asset.controller.syncManifest();

  if (asset.source.kind === 'polyfork') {
    const extras: string[] = [];
    if (edits.paint) extras.push('Repainted ' + String(Object.keys(edits.paint).length) + ' color slots.');
    if (edits.pose) extras.push('Posed ' + String(Object.keys(edits.pose).length) + ' parts.');
    if (edits.hiddenParts) extras.push('Hid ' + edits.hiddenParts.join(', ') + '.');
    asset.group.userData.attribution = {
      title: asset.source.title,
      creator: 'Polyfork',
      url: `https://polyfork.dev/asset/${asset.source.assetId}`,
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      changes: `Imported into 3D Maker. Tint ${edits.tint}, scale ${String(edits.scale)}, height multiplier ${String(edits.proportion)}.` +
        (extras.length ? ' ' + extras.join(' ') : ''),
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

async function openBinary(
  bytes: ArrayBuffer,
  source: ImportSource,
  label: string,
  file: Blob | null,
  providedCapabilities?: (group: Group) => AssetCapabilities,
): Promise<ImportedAsset> {
  checkResources(bytes);
  const gltf = await new GLTFLoader().parseAsync(bytes, '');
  if (!gltf.scene.getObjectByProperty('isMesh', true)) throw new Error('This GLB has no mesh in its default scene.');
  const group = new Group();
  group.add(gltf.scene);
  // GLTFExporter builds a new asset header. Carry source credits and licence metadata through the wrapper.
  group.userData.sourceAsset = gltf.asset;
  group.animations = gltf.animations;
  const name = label.trim().slice(0, 80) || 'Imported asset';
  const embedded = readCapabilities(group);
  const capabilities = providedCapabilities ? providedCapabilities(group) : (embedded ? {
    ...embedded,
    riggedParts: embedded.riggedParts.filter(part => Boolean(group.getObjectByName(part.name))),
    detachableParts: embedded.detachableParts.filter(part => Boolean(group.getObjectByName(part.name))),
  } : {
    ...inspectAsset(group),
    name,
    source: source.kind === 'local' ? { kind: 'local' as const, id: source.filename } : { kind: 'polyfork' as const, id: source.assetId },
  });
  capabilities.name = name;
  const palette = buildPalette(gltf.scene, gltf.parser.associations, capabilities.colorZones);
  const controller = createAssetController(group, capabilities);
  const restored = controller.getState();
  const initialEdits: ImportEdits = {
    name,
    tint: '#ffffff',
    scale: 1,
    proportion: 1,
    ...(restored.pose ? { pose: restored.pose } : {}),
    ...(restored.hiddenParts ? { hiddenParts: restored.hiddenParts } : {}),
    ...(restored.night ? { night: true } : {}),
    ...(restored.decalText ? { decalText: restored.decalText } : {}),
  };
  const asset: ImportedAsset = {
    group, source, originalFile: file, palette, capabilities: controller.capabilities, controller, edits: initialEdits,
  };
  applyImportEdits(asset, initialEdits);
  return asset;
}

export function openStoredFile(file: Blob, filename: string): Promise<ImportedAsset> {
  return file.arrayBuffer().then(bytes => openBinary(bytes, { kind: 'local', filename }, filename.replace(/\.glb$/i, ''), file));
}

export function openLocalGlb(file: File): Promise<ImportedAsset> {
  return openStoredFile(file, file.name);
}

const glbTimeoutMs = 25_000;
const retryableStatuses = new Set([429, 502, 503, 504]);

function retryDelayMs(response: Response, attempt: number): number {
  const header = response.headers.get('Retry-After');
  if (header && /^\d+$/.test(header)) return Math.min(8_000, Math.max(500, Number(header) * 1000));
  return 1_000 * (attempt + 1);
}

export async function openPolyforkGlb(assetId: string, name: string, signal?: AbortSignal, category?: string): Promise<ImportedAsset> {
  const url = polyforkGlbUrl(assetId);
  const detailPromise = fetchPolyforkDetail(assetId, signal);
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted();
    const timeout = AbortSignal.timeout(glbTimeoutMs);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    let response: Response;
    try {
      response = await fetch(url, { credentials: 'omit', signal: requestSignal });
    } catch (error) {
      signal?.throwIfAborted();
      if (timeout.aborted) {
        if (attempt < 2) {
          await abortableDelay(800 * (attempt + 1), signal);
          continue;
        }
        throw new Error('PolyFork model download timed out. Try opening it again.', { cause: error });
      }
      throw error;
    }
    if (retryableStatuses.has(response.status) && attempt < 2) {
      void response.body?.cancel();
      await abortableDelay(retryDelayMs(response, attempt), signal);
      continue;
    }
    if (response.status === 429) throw new Error('PolyFork is limiting model downloads. Try again in a moment.');
    if (!response.ok) throw new Error(`PolyFork could not supply this model (HTTP ${String(response.status)}).`);
    let bytes: ArrayBuffer;
    try {
      bytes = await response.arrayBuffer();
    } catch (error) {
      signal?.throwIfAborted();
      if (timeout.aborted) throw new Error('PolyFork model download timed out. Try opening it again.', { cause: error });
      throw error;
    }
    signal?.throwIfAborted();
    const detail = await detailPromise;
    signal?.throwIfAborted();
    return openBinary(
      bytes,
      { kind: 'polyfork', assetId, title: name, ...(category ? { category } : {}) },
      name,
      null,
      group => buildPolyforkCapabilities(group, assetId, name, detail),
    );
  }
  throw new Error('PolyFork could not supply this model.');
}
