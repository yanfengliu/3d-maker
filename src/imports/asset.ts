import { Color, Group } from 'three';
import type { GLTFLoader as GltfLoaderClass } from 'three/addons/loaders/GLTFLoader.js';
import { createAssetController, inspectAsset, type AssetController } from '../capabilities/runtime';
import {
  readCapabilities,
  sanitizeMimicLinks,
  type AssetCapabilities,
  type AssetDimensionsSpec,
  type ColorZoneSpec,
  type NightZoneSpec,
} from '../capabilities/schema';
import { abortableDelay } from '../data/polyfork';
import { buildPolyforkCapabilities, fetchPolyforkDetail } from '../data/polyfork-detail';
import { cacheGlb, downloadPolyforkGlb, getCachedGlb } from './glb-cache';
import { applyPalette, buildPalette, validatePaint, type ImportPalette } from './paint';

let gltfLoaderPromise: Promise<{ GLTFLoader: typeof GltfLoaderClass }> | null = null;
function loadGltfLoader() {
  gltfLoaderPromise ??= import('three/addons/loaders/GLTFLoader.js');
  return gltfLoaderPromise;
}

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
  baseDimensions?: AssetDimensionsSpec;
  baseColorZones?: ColorZoneSpec[];
  baseNightZones: NightZoneSpec[];
  metadataUnavailable?: boolean;
  preservedUnavailableEdits?: Partial<Pick<ImportEdits, 'paint' | 'pose' | 'hiddenParts' | 'night' | 'decalText'>>;
  droppedPaintSlots?: string[];
}

export function reconcileSavedEdits(
  asset: ImportedAsset,
  saved: ImportEdits,
  knownRiggedParts?: readonly string[],
): { edits: ImportEdits; dropped: string[] } {
  const dropped: string[] = [];
  const preserved: Partial<Pick<ImportEdits, 'paint' | 'pose' | 'hiddenParts' | 'night' | 'decalText'>> = {};
  const base: ImportEdits = { name: saved.name, tint: saved.tint, scale: saved.scale, proportion: saved.proportion };
  if (saved.paint) {
    const kept: Record<string, string> = {};
    const keptUnavailable: Record<string, string> = {};
    for (const [id, hex] of Object.entries(saved.paint)) {
      if (asset.palette.slots.has(id)) {
        kept[id] = hex;
      } else {
        const migrated = asset.palette.legacyMap.get(id);
        if (migrated && asset.palette.slots.has(migrated)) {
          if (!(migrated in kept)) kept[migrated] = hex;
        } else {
          dropped.push(id);
          if (asset.metadataUnavailable && id.startsWith('zone-')) keptUnavailable[id] = hex;
        }
      }
    }
    if (Object.keys(kept).length) base.paint = kept;
    if (Object.keys(keptUnavailable).length) preserved.paint = keptUnavailable;
  }
  const keptPose: Record<string, number> = {};
  const unavailablePose: Record<string, number> = {};
  if (saved.pose) {
    const validRigged = new Set(asset.capabilities.riggedParts.map(p => p.name));
    for (const [name, value] of Object.entries(saved.pose)) {
      if (validRigged.has(name) && Number.isFinite(value)) keptPose[name] = value;
      else {
        dropped.push('pose:' + name);
        if (asset.metadataUnavailable && Number.isFinite(value)) unavailablePose[name] = value;
      }
    }
  }
  // Preserve authored GLB poses for joints that were unknown when the inventory entry was originally saved.
  const authoredPose = asset.edits.pose;
  if (authoredPose) {
    const knownSet = knownRiggedParts ? new Set(knownRiggedParts) : null;
    for (const [name, value] of Object.entries(authoredPose)) {
      if (name in keptPose) continue;
      if (knownSet ? !knownSet.has(name) : saved.pose === undefined) keptPose[name] = value;
    }
  }
  if (Object.keys(keptPose).length) base.pose = keptPose;
  if (Object.keys(unavailablePose).length) preserved.pose = unavailablePose;
  if (saved.hiddenParts?.length) {
    const validDetach = new Set(asset.capabilities.detachableParts.map(p => p.name));
    const unavailableHidden: string[] = [];
    const keptHidden = saved.hiddenParts.filter(name => {
      if (validDetach.has(name)) return true;
      dropped.push('part:' + name);
      if (asset.metadataUnavailable) unavailableHidden.push(name);
      return false;
    });
    if (keptHidden.length) base.hiddenParts = [...new Set(keptHidden)];
    if (unavailableHidden.length) preserved.hiddenParts = [...new Set(unavailableHidden)];
  }
  if (saved.night) {
    if (asset.capabilities.nightZones.length) base.night = true;
    else {
      dropped.push('night');
      if (asset.metadataUnavailable) preserved.night = true;
    }
  }
  if (saved.decalText) {
    const validDecals = new Set(asset.capabilities.decals.map(d => d.name));
    const keptText: Record<string, string> = {};
    const unavailableText: Record<string, string> = {};
    for (const [name, text] of Object.entries(saved.decalText)) {
      if (validDecals.has(name) && text.trim()) keptText[name] = text.trim().slice(0, 60);
      else if (text.trim()) {
        dropped.push('decal:' + name);
        if (asset.metadataUnavailable) unavailableText[name] = text.trim().slice(0, 60);
      }
    }
    if (Object.keys(keptText).length) base.decalText = keptText;
    if (Object.keys(unavailableText).length) preserved.decalText = unavailableText;
  }
  if (Object.keys(preserved).length) asset.preservedUnavailableEdits = preserved;
  else delete asset.preservedUnavailableEdits;
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
    if (Math.abs(angle) > 1e-6) result[name] = Math.round(angle * 10000) / 10000;
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

function recordsEqual(a?: Readonly<Record<string, string>>, b?: Readonly<Record<string, string>>): boolean {
  const keysA = a ? Object.keys(a) : [];
  const keysB = b ? Object.keys(b) : [];
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => a?.[key] === b?.[key]);
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

  const paintChanged = !recordsEqual(asset.edits.paint, edits.paint);
  const decalsChanged = !recordsEqual(asset.edits.decalText, edits.decalText);
  applyPalette(asset.palette, new Color(edits.tint), asset.edits.paint, edits.paint);

  // Keep exported colorZones aligned with current painted colors so re-imported GLBs cluster cleanly.
  if (asset.baseColorZones && asset.capabilities.colorZones) {
    for (let i = 0; i < asset.capabilities.colorZones.length; i++) {
      const zone = asset.capabilities.colorZones[i];
      const baseZone = asset.baseColorZones[i];
      if (!zone || !baseZone) continue;
      zone.color = (edits.paint?.['zone-' + zone.name] ?? baseZone.color).toLowerCase();
    }
  }
  // Keep night zone albedos synchronized only when the user explicitly repaints that zone, preserving upstream albedos otherwise.
  for (let i = 0; i < asset.capabilities.nightZones.length; i++) {
    const zone = asset.capabilities.nightZones[i];
    const baseZone = asset.baseNightZones[i];
    if (!zone || !baseZone) continue;
    const override = edits.paint?.['zone-' + zone.name];
    zone.albedo = (override ?? baseZone.albedo).toLowerCase();
  }
  if (paintChanged && asset.capabilities.nightZones.length) {
    asset.controller.refreshNightOverlays();
  }

  asset.controller.resetParts();
  const clampedPose: Record<string, number> = {};
  const mimicByName = new Map(asset.capabilities.riggedParts.map(p => [p.name, p.mimic]));
  // Only apply independent leaders; coupled mimic followers are strictly derived from their leader (even when leader = 0).
  for (const [name, value] of Object.entries(edits.pose ?? {})) {
    const mimic = mimicByName.get(name);
    if (mimic && riggedSet.has(mimic.part)) continue;
    asset.controller.setPart(name, value);
  }
  for (const part of asset.capabilities.riggedParts) {
    const liveVal = asset.controller.getPart(part.name);
    if (Math.abs(liveVal) > 1e-6) {
      const prec = part.type === 'slide' ? 10000 : 1000;
      clampedPose[part.name] = Math.round(liveVal * prec) / prec;
    }
  }
  if (Object.keys(clampedPose).length) edits.pose = clampedPose;
  else delete edits.pose;

  asset.controller.resetVisibility();
  for (const name of edits.hiddenParts ?? []) asset.controller.setVisible(name, false);

  const nightOn = Boolean(edits.night && asset.capabilities.nightZones.length);
  asset.controller.setNight(nightOn);
  if (nightOn) edits.night = true;
  else delete edits.night;

  if (decalsChanged) {
    if (edits.decalText && Object.keys(edits.decalText).length) {
      asset.controller.setDecalsVisible(true, edits.decalText);
    } else if (asset.controller.areDecalsVisible()) {
      asset.controller.setDecalsVisible(true, {});
    }
  }

  // The transform sits outside the imported scene, including its animated root and skeleton.
  asset.group.scale.set(edits.scale, edits.scale * edits.proportion, edits.scale);
  if (asset.baseDimensions) {
    const round = (n: number) => Math.round(n * 1000) / 1000;
    asset.capabilities.dimensions = {
      sizeM: {
        x: round(asset.baseDimensions.sizeM.x * edits.scale),
        y: round(asset.baseDimensions.sizeM.y * edits.scale * edits.proportion),
        z: round(asset.baseDimensions.sizeM.z * edits.scale),
      },
      originY: round(asset.baseDimensions.originY * edits.scale * edits.proportion),
      ...(asset.baseDimensions.origin ? { origin: asset.baseDimensions.origin } : {}),
    };
  }
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

function intersectWithNodes(group: Group, caps: AssetCapabilities): AssetCapabilities {
  return {
    ...structuredClone(caps),
    riggedParts: sanitizeMimicLinks(caps.riggedParts.filter(part => Boolean(group.getObjectByName(part.name)))),
    detachableParts: caps.detachableParts.filter(part => Boolean(group.getObjectByName(part.name))),
  };
}

async function openBinary(
  bytes: ArrayBuffer,
  source: ImportSource,
  label: string,
  file: Blob | null,
  providedCapabilities?: (group: Group) => AssetCapabilities,
  metadataUnavailable = false,
): Promise<ImportedAsset> {
  checkResources(bytes);
  const { GLTFLoader } = await loadGltfLoader();
  const gltf = await new GLTFLoader().parseAsync(bytes, '');
  if (!gltf.scene.getObjectByProperty('isMesh', true)) throw new Error('This GLB has no mesh in its default scene.');
  const group = new Group();
  group.add(gltf.scene);
  // GLTFExporter builds a new asset header. Carry source credits and licence metadata through the wrapper.
  group.userData.sourceAsset = gltf.asset;
  group.animations = gltf.animations;
  const name = label.trim().slice(0, 80) || 'Imported asset';
  const embedded = readCapabilities(group);
  const capabilities = providedCapabilities ? providedCapabilities(group) : (embedded ? intersectWithNodes(group, embedded) : (() => {
    const inspected = inspectAsset(group);
    return {
      ...inspected,
      name,
      source: source.kind === 'local'
        ? { kind: 'local' as const, id: source.filename, ...(inspected.source?.kit ? { kit: inspected.source.kit } : {}) }
        : { kind: 'polyfork' as const, id: source.assetId },
    };
  })());
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
    group,
    source,
    originalFile: file,
    palette,
    capabilities: controller.capabilities,
    controller,
    edits: initialEdits,
    ...(controller.capabilities.dimensions ? { baseDimensions: structuredClone(controller.capabilities.dimensions) } : {}),
    ...(controller.capabilities.colorZones ? { baseColorZones: structuredClone(controller.capabilities.colorZones) } : {}),
    baseNightZones: structuredClone(controller.capabilities.nightZones),
    ...(metadataUnavailable ? { metadataUnavailable: true } : {}),
  };
  applyImportEdits(asset, initialEdits);
  if (initialEdits.decalText && Object.keys(initialEdits.decalText).length) {
    asset.controller.setDecalsVisible(true, initialEdits.decalText);
  }
  return asset;
}

export function openStoredFile(file: Blob, filename: string): Promise<ImportedAsset> {
  return file.arrayBuffer().then(bytes => openBinary(bytes, { kind: 'local', filename }, filename.replace(/\.glb$/i, ''), file));
}

export function openLocalGlb(file: File): Promise<ImportedAsset> {
  return openStoredFile(file, file.name);
}

const postGlbDetailWaitMs = 2_500;

export async function openPolyforkGlb(
  assetId: string,
  name: string,
  signal?: AbortSignal,
  category?: string,
  fallbackCapabilities?: AssetCapabilities,
  expectParams = true,
): Promise<ImportedAsset> {
  const url = polyforkGlbUrl(assetId);
  void loadGltfLoader();
  const detailPromise = fetchPolyforkDetail(assetId, signal, expectParams);
  let bytes = getCachedGlb(assetId);
  if (!bytes) {
    bytes = await downloadPolyforkGlb(url, signal);
    cacheGlb(assetId, bytes);
  }
  signal?.throwIfAborted();
  // Bound post-GLB metadata wait so a slow or rate-limited API endpoint never stalls opening a downloaded model.
  const detail = await Promise.race([
    detailPromise,
    abortableDelay(postGlbDetailWaitMs, signal).then(() => null),
  ]);
  signal?.throwIfAborted();
  const metadataUnavailable = !detail && !fallbackCapabilities;
  return openBinary(
    bytes,
    { kind: 'polyfork', assetId, title: name, ...(category ? { category } : {}) },
    name,
    null,
    group => {
      if (detail) {
        const built = buildPolyforkCapabilities(group, assetId, name, detail);
        if (fallbackCapabilities) {
          if (!built.colorZones?.length && fallbackCapabilities.colorZones?.length) {
            built.colorZones = structuredClone(fallbackCapabilities.colorZones);
          }
          if (!built.presets?.length && fallbackCapabilities.presets?.length) {
            built.presets = structuredClone(fallbackCapabilities.presets);
          }
          if (!built.nightZones.length && fallbackCapabilities.nightZones.length) {
            built.nightZones = structuredClone(fallbackCapabilities.nightZones);
          }
        }
        return built;
      }
      if (fallbackCapabilities) return intersectWithNodes(group, fallbackCapabilities);
      return buildPolyforkCapabilities(group, assetId, name, null);
    },
    metadataUnavailable,
  );
}
