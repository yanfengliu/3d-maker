import type { Object3D } from 'three';
import { parseCompositeChildren, type CompositeChildSpec } from './compose-schema';
import { parseIkSpec, type AssetIkSpec } from './ik-schema';
import { parseModelParamSpecs, type ModelParamSpec } from './param-schema';
import {
  parseClearanceZones,
  parseColliders,
  parseSurfaces,
  type ClearanceZoneSpec,
  type ColliderSpec,
  type SurfaceSpec,
} from './spatial-schema';

export type * from './compose-schema';
export type * from './ik-schema';
export type * from './param-schema';
export type * from './spatial-schema';
export {
  COMPOSITE_CHILD_ID_PATTERN,
  MAX_COMPOSITE_CHILDREN,
  MAX_SCOPED_NAME_LEN,
  parseCompositeChildren,
} from './compose-schema';
export { parseIkSpec } from './ik-schema';
export { parseModelParamSpecs, parseRecipeParams, resolveModelParams } from './param-schema';
export { parseClearanceZones, parseColliders, parseSurfaces } from './spatial-schema';

export type Axis = 'x' | 'y' | 'z';

export interface RiggedPartSpec {
  name: string;
  label: string;
  type: 'rotate' | 'slide';
  axis: Axis;
  range: [number, number];
  describe?: string;
}

export interface DetachablePartSpec {
  name: string;
  label: string;
  describe?: string;
}

export interface NightZoneSpec {
  name: string;
  label: string;
  color: string;
  intensity: number;
  albedo: string;
  describe?: string;
}

export interface DecalSlotSpec {
  name: string;
  at: [number, number, number];
  normal: [number, number, number];
  up: [number, number, number];
  size: [number, number];
  describe?: string;
}

export interface ColorZoneSpec {
  name: string;
  label: string;
  color: string;
  describe?: string;
}

export interface ColorwayPresetSpec {
  name: string;
  label: string;
  colors: Record<string, string>;
}

export interface AssetDimensionsSpec {
  sizeM: { x: number; y: number; z: number };
  originY: number;
  origin?: string;
}

export interface AssetPhysicsSpec {
  body: 'static' | 'dynamic';
  massKg?: number;
  material?: string;
  /** True when the composite author explicitly pinned `physicsBody`, preventing child rebuilds from flipping it. */
  locked?: boolean;
}

export interface AssetRuntimeState {
  pose?: Record<string, number>;
  hiddenParts?: string[];
  /** True when the asset's own canonical root node is hidden (disambiguates editable display names in headless mode). */
  rootHidden?: boolean;
  night?: boolean;
  decalText?: Record<string, string>;
}

export interface VariationSummary {
  id: string;
  label: string;
  situation: string;
}

export interface AssetCapabilities {
  version: 1;
  name: string;
  description?: string;
  source?: {
    kind: 'original' | 'polyfork' | 'local';
    id?: string;
    variation?: string;
    url?: string;
    kit?: string;
  };
  variations?: VariationSummary[];
  riggedParts: RiggedPartSpec[];
  detachableParts: DetachablePartSpec[];
  nightZones: NightZoneSpec[];
  decals: DecalSlotSpec[];
  colorZones?: ColorZoneSpec[];
  presets?: ColorwayPresetSpec[];
  params?: ModelParamSpec[];
  dimensions?: AssetDimensionsSpec;
  physics?: AssetPhysicsSpec;
  ik?: AssetIkSpec;
  colliders?: ColliderSpec[];
  clearanceZones?: ClearanceZoneSpec[];
  surfaces?: SurfaceSpec[];
  children?: CompositeChildSpec[];
  clips?: { name: string; duration: number; synthesized?: boolean }[];
  state?: AssetRuntimeState;
}

const hexPattern = /^#[\da-f]{6}$/i;
const axes = new Set<Axis>(['x', 'y', 'z']);
const maxParts = 64;
const maxZones = 64;
const maxNightZones = 32;
const maxDecals = 32;
const maxPresets = 32;
const maxClips = 256;
const maxNameLen = 256;
const maxDescLen = 280;

/** Canonical identifier pattern shared by colorZones, presets, and `zone-<name>` paint slots. */
export const COLOR_ZONE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;

function trimText(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLen) : undefined;
}

function validDecalBasis(normal: [number, number, number], up: [number, number, number]): boolean {
  const nLen = Math.hypot(normal[0], normal[1], normal[2]);
  const uLen = Math.hypot(up[0], up[1], up[2]);
  if (nLen < 1e-5 || uLen < 1e-5) return false;
  const cx = up[1] * normal[2] - up[2] * normal[1];
  const cy = up[2] * normal[0] - up[0] * normal[2];
  const cz = up[0] * normal[1] - up[1] * normal[0];
  return Math.hypot(cx, cy, cz) / (nLen * uLen) > 1e-4;
}

export function humanizeLabel(raw: string): string {
  const spaced = raw
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : raw;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function tuple3(value: unknown): [number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const nums = value.map(Number);
  return nums.every(Number.isFinite) ? [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0] : null;
}

function tuple2(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const nums = value.map(Number);
  return nums.every(Number.isFinite) ? [nums[0] ?? 0, nums[1] ?? 0] : null;
}

export function parseDecalSlots(value: unknown): DecalSlotSpec[] {
  if (!Array.isArray(value)) return [];
  const slots: DecalSlotSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (slots.length >= maxDecals) break;
    if (!isRecord(row)) continue;
    const name = trimText(row.name, maxNameLen);
    if (!name || seen.has(name)) continue;
    const at = tuple3(row.at), normal = tuple3(row.normal), up = tuple3(row.up), size = tuple2(row.size);
    if (!at || !normal || !up || !size || size[0] <= 0 || size[1] <= 0 || !validDecalBasis(normal, up)) continue;
    seen.add(name);
    const describe = trimText(row.describe, maxDescLen);
    slots.push({ name, at, normal, up, size, ...(describe ? { describe } : {}) });
  }
  return slots;
}

function parseRiggedParts(value: unknown): RiggedPartSpec[] {
  if (!Array.isArray(value)) return [];
  const parts: RiggedPartSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (parts.length >= maxParts) break;
    if (!isRecord(row)) continue;
    const name = trimText(row.name, maxNameLen);
    if (!name || seen.has(name)) continue;
    const axis = row.axis;
    if (typeof axis !== 'string' || !axes.has(axis as Axis)) continue;
    const range = tuple2(row.range);
    if (!range || range[0] === range[1]) continue;
    seen.add(name);
    const type = row.type === 'slide' ? 'slide' : 'rotate';
    const label = trimText(row.label, maxNameLen) ?? humanizeLabel(name);
    const describe = trimText(row.describe, maxDescLen);
    parts.push({ name, label, type, axis: axis as Axis, range, ...(describe ? { describe } : {}) });
  }
  return parts;
}

function parseDetachableParts(value: unknown): DetachablePartSpec[] {
  if (!Array.isArray(value)) return [];
  const parts: DetachablePartSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (parts.length >= maxParts) break;
    if (typeof row === 'string') {
      const name = trimText(row, maxNameLen);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      parts.push({ name, label: humanizeLabel(name) });
    } else if (isRecord(row)) {
      const name = trimText(row.name, maxNameLen);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const label = trimText(row.label, maxNameLen) ?? humanizeLabel(name);
      const describe = trimText(row.describe, maxDescLen);
      parts.push({ name, label, ...(describe ? { describe } : {}) });
    }
  }
  return parts;
}

function parseNightZones(value: unknown): NightZoneSpec[] {
  if (!Array.isArray(value)) return [];
  const zones: NightZoneSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (zones.length >= maxNightZones) break;
    if (!isRecord(row)) continue;
    const name = trimText(row.name, maxNameLen);
    if (!name || seen.has(name)) continue;
    if (typeof row.color !== 'string' || !hexPattern.test(row.color)) continue;
    if (typeof row.albedo !== 'string' || !hexPattern.test(row.albedo)) continue;
    seen.add(name);
    const intensity = typeof row.intensity === 'number' && Number.isFinite(row.intensity) && row.intensity > 0
      ? Math.min(4, row.intensity) : 1;
    const label = trimText(row.label, maxNameLen) ?? humanizeLabel(name);
    const describe = trimText(row.describe, maxDescLen);
    zones.push({
      name,
      label,
      color: row.color.toLowerCase(),
      intensity,
      albedo: row.albedo.toLowerCase(),
      ...(describe ? { describe } : {}),
    });
  }
  return zones;
}

function parseColorZones(value: unknown): ColorZoneSpec[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const zones: ColorZoneSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (zones.length >= maxZones) break;
    if (!isRecord(row) || typeof row.name !== 'string') continue;
    const name = row.name.trim();
    if (!COLOR_ZONE_NAME_PATTERN.test(name) || seen.has(name) || typeof row.color !== 'string' || !hexPattern.test(row.color)) continue;
    seen.add(name);
    const label = trimText(row.label, maxNameLen) ?? humanizeLabel(name);
    const describe = trimText(row.describe, maxDescLen);
    zones.push({ name, label, color: row.color.toLowerCase(), ...(describe ? { describe } : {}) });
  }
  return zones.length ? zones : undefined;
}

function parsePresets(value: unknown): ColorwayPresetSpec[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const presets: ColorwayPresetSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (presets.length >= maxPresets) break;
    if (!isRecord(row) || !isRecord(row.colors)) continue;
    const name = trimText(row.name, maxNameLen);
    if (!name || seen.has(name)) continue;
    const colors: Record<string, string> = {};
    for (const [k, v] of Object.entries(row.colors)) {
      if (Object.keys(colors).length >= maxZones) break;
      const key = k.trim();
      if (COLOR_ZONE_NAME_PATTERN.test(key) && typeof v === 'string' && hexPattern.test(v)) colors[key] = v.toLowerCase();
    }
    if (!Object.keys(colors).length) continue;
    seen.add(name);
    const label = trimText(row.label, maxNameLen) ?? humanizeLabel(name);
    presets.push({ name, label, colors });
  }
  return presets.length ? presets : undefined;
}

function parseClips(value: unknown): { name: string; duration: number; synthesized?: boolean }[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const clips: { name: string; duration: number; synthesized?: boolean }[] = [];
  for (const row of value) {
    if (clips.length >= maxClips) break;
    if (!isRecord(row)) continue;
    const name = trimText(row.name, maxNameLen);
    const duration = typeof row.duration === 'number' && Number.isFinite(row.duration) && row.duration >= 0 ? row.duration : -1;
    if (!name || duration < 0) continue;
    clips.push({ name, duration, ...(row.synthesized === true ? { synthesized: true } : {}) });
  }
  return clips.length ? clips : undefined;
}

function parseVariations(value: unknown): VariationSummary[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows: VariationSummary[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (rows.length >= maxParts) break;
    if (!isRecord(row)) continue;
    const id = trimText(row.id, maxNameLen);
    if (!id || seen.has(id)) continue;
    const label = trimText(row.label, maxNameLen) ?? humanizeLabel(id);
    const situation = trimText(row.situation, maxDescLen) ?? '';
    seen.add(id);
    rows.push({ id, label, situation });
  }
  return rows.length ? rows : undefined;
}

/** Validate and normalize a Form Foundry capability manifest read from GLB extras or JSON. */
export function parseCapabilities(value: unknown): AssetCapabilities | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.name !== 'string' || !value.name.trim()) return null;
  const result: AssetCapabilities = {
    version: 1,
    name: value.name.trim(),
    riggedParts: parseRiggedParts(value.riggedParts),
    detachableParts: parseDetachableParts(value.detachableParts),
    nightZones: parseNightZones(value.nightZones),
    decals: parseDecalSlots(value.decals),
  };
  if (typeof value.description === 'string' && value.description.trim()) result.description = value.description.trim();
  if (isRecord(value.source) && (value.source.kind === 'original' || value.source.kind === 'polyfork' || value.source.kind === 'local')) {
    result.source = {
      kind: value.source.kind,
      ...(typeof value.source.id === 'string' ? { id: value.source.id } : {}),
      ...(typeof value.source.variation === 'string' && value.source.variation.trim()
        ? { variation: value.source.variation.trim().slice(0, maxNameLen) }
        : {}),
      ...(typeof value.source.url === 'string' ? { url: value.source.url } : {}),
      ...(typeof value.source.kit === 'string' ? { kit: value.source.kit } : {}),
    };
  }
  const variations = parseVariations(value.variations);
  if (variations) result.variations = variations;
  const colorZones = parseColorZones(value.colorZones);
  if (colorZones) result.colorZones = colorZones;
  const presets = parsePresets(value.presets);
  if (presets) result.presets = presets;
  const params = parseModelParamSpecs(value.params);
  if (params) result.params = params;
  if (isRecord(value.dimensions) && isRecord(value.dimensions.sizeM)) {
    const { x, y, z } = value.dimensions.sizeM;
    const originY = value.dimensions.originY;
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number' && typeof originY === 'number' &&
        [x, y, z, originY].every(Number.isFinite)) {
      result.dimensions = {
        sizeM: { x, y, z },
        originY,
        ...(typeof value.dimensions.origin === 'string' ? { origin: value.dimensions.origin } : {}),
      };
    }
  }
  if (isRecord(value.physics) && (value.physics.body === 'static' || value.physics.body === 'dynamic')) {
    result.physics = {
      body: value.physics.body,
      ...(typeof value.physics.massKg === 'number' && Number.isFinite(value.physics.massKg) ? { massKg: value.physics.massKg } : {}),
      ...(typeof value.physics.material === 'string' ? { material: value.physics.material } : {}),
      ...(value.physics.locked === true ? { locked: true } : {}),
    };
  }
  const ik = parseIkSpec(value.ik);
  if (ik) result.ik = ik;
  const colliders = parseColliders(value.colliders);
  if (colliders) result.colliders = colliders;
  const clearanceZones = parseClearanceZones(value.clearanceZones);
  if (clearanceZones) result.clearanceZones = clearanceZones;
  const surfaces = parseSurfaces(value.surfaces);
  if (surfaces) result.surfaces = surfaces;
  const children = parseCompositeChildren(value.children, parseCapabilities);
  if (children) result.children = children;
  const clips = parseClips(value.clips);
  if (clips) result.clips = clips;
  if (isRecord(value.state)) {
    const state: AssetRuntimeState = {};
    if (isRecord(value.state.pose)) {
      const pose: Record<string, number> = {};
      for (const [k, v] of Object.entries(value.state.pose)) {
        if (typeof v === 'number' && Number.isFinite(v)) pose[k] = v;
      }
      if (Object.keys(pose).length) state.pose = pose;
    }
    if (Array.isArray(value.state.hiddenParts)) {
      const hidden = value.state.hiddenParts.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      if (hidden.length) state.hiddenParts = [...new Set(hidden)];
    }
    if (typeof value.state.rootHidden === 'boolean') state.rootHidden = value.state.rootHidden;
    if (typeof value.state.night === 'boolean') state.night = value.state.night;
    if (isRecord(value.state.decalText)) {
      const text: Record<string, string> = {};
      for (const [k, v] of Object.entries(value.state.decalText)) {
        if (typeof v === 'string' && v.trim()) text[k] = v.trim().slice(0, 60);
      }
      if (Object.keys(text).length) state.decalText = text;
    }
    if (Object.keys(state).length) result.state = state;
  }
  return result;
}

/** Locate embedded Form Foundry capabilities on an object hierarchy (works across arbitrary GLTFLoader wrapper depth). */
export function readCapabilities(root: Object3D): AssetCapabilities | null {
  let cur: Object3D = root;
  for (;;) {
    const direct = parseCapabilities(cur.userData.formFoundry);
    if (direct) return direct;
    const only = cur.children.length === 1 ? cur.children[0] : undefined;
    if (!only || only.userData.compositeSlot) break;
    cur = only;
  }
  for (const child of root.children) {
    const nested = parseCapabilities(child.userData.formFoundry);
    if (nested) return nested;
    for (const grand of child.children) {
      const deep = parseCapabilities(grand.userData.formFoundry);
      if (deep) return deep;
    }
  }
  return null;
}

/** Collect raw decal slots embedded in node.userData.decals (such as PolyFork GLB exports). */
export function readEmbeddedDecals(root: Object3D): DecalSlotSpec[] {
  const found: DecalSlotSpec[] = [];
  const seen = new Set<string>();
  root.traverse(node => {
    if (found.length >= maxDecals) return;
    for (const slot of parseDecalSlots(node.userData.decals)) {
      if (found.length >= maxDecals) break;
      if (seen.has(slot.name)) continue;
      seen.add(slot.name);
      found.push(slot);
    }
  });
  return found;
}

/** Write a clean JSON snapshot of capabilities onto the canonical manifest host node without duplicating extras. */
export function writeCapabilities(root: Object3D, capabilities: AssetCapabilities): void {
  // Follow any single-child non-composite wrapper chain to locate an existing canonical manifest host at any depth.
  let host: Object3D = root;
  let probe: Object3D = root;
  for (;;) {
    if ('formFoundry' in probe.userData) {
      host = probe;
      break;
    }
    const only = probe.children.length === 1 ? probe.children[0] : undefined;
    if (!only || only.userData.compositeSlot || only.userData.compositeChild) break;
    probe = only;
  }
  root.traverse(node => {
    if (node !== host && 'formFoundry' in node.userData) delete node.userData.formFoundry;
  });
  host.userData.formFoundry = structuredClone(capabilities);
}
