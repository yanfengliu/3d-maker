import type { Object3D } from 'three';
import { isPolyforkRateLimited, recordPolyforkRateLimit } from './polyfork';
import {
  humanizeLabel,
  parseDecalSlots,
  readEmbeddedDecals,
  type AssetCapabilities,
  type AssetDimensionsSpec,
  type AssetIkSpec,
  type AssetPhysicsSpec,
  type Axis,
  type ColorZoneSpec,
  type ColorwayPresetSpec,
  type DecalSlotSpec,
  type DetachablePartSpec,
  type NightZoneSpec,
  type RiggedPartSpec,
} from '../capabilities/schema';

export interface PolyforkDetail {
  id: string;
  title: string;
  description?: string;
  kit?: string;
  riggedParts: RiggedPartSpec[];
  detachableParts: DetachablePartSpec[];
  nightZones: NightZoneSpec[];
  decals: DecalSlotSpec[];
  colorZones: ColorZoneSpec[];
  presets: ColorwayPresetSpec[];
  dimensions?: AssetDimensionsSpec;
  physics?: AssetPhysicsSpec;
  ik?: AssetIkSpec;
}

const origin = 'https://polyfork.dev';
const hexPattern = /^#[\da-f]{6}$/i;
const axes = new Set<Axis>(['x', 'y', 'z']);
const cache = new Map<string, { value: PolyforkDetail | null; expires: number }>();
const cacheTtl = 15 * 60_000;
const cacheLimit = 64;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function clearPolyforkDetailCache(): void {
  cache.clear();
}

function parseParamsMetadata(raw: unknown): {
  colorZones: ColorZoneSpec[];
  presets: ColorwayPresetSpec[];
  partDescriptions: Map<string, string>;
  nightFallback: NightZoneSpec[];
} {
  const colorZones: ColorZoneSpec[] = [];
  const presets: ColorwayPresetSpec[] = [];
  const partDescriptions = new Map<string, string>();
  const nightFallback: NightZoneSpec[] = [];
  if (!isRecord(raw)) return { colorZones, presets, partDescriptions, nightFallback };

  if (isRecord(raw.params)) {
    for (const [key, entry] of Object.entries(raw.params)) {
      if (!isRecord(entry)) continue;
      if (typeof entry.describe === 'string' && entry.describe.trim()) {
        partDescriptions.set(key, entry.describe.trim());
      }
      if (entry.type === 'color' && typeof entry.default === 'string' && hexPattern.test(entry.default)) {
        colorZones.push({
          name: key,
          label: typeof entry.label === 'string' && entry.label.trim() ? entry.label.trim() : humanizeLabel(key),
          color: entry.default.toLowerCase(),
          ...(typeof entry.describe === 'string' && entry.describe.trim() ? { describe: entry.describe.trim() } : {}),
        });
      }
    }
  }
  if (isRecord(raw.presets)) {
    for (const [key, entry] of Object.entries(raw.presets)) {
      if (!isRecord(entry)) continue;
      const colors: Record<string, string> = {};
      for (const [knob, val] of Object.entries(entry)) {
        if (typeof val === 'string' && hexPattern.test(val)) colors[knob] = val.toLowerCase();
      }
      if (!Object.keys(colors).length) continue;
      presets.push({ name: key, label: humanizeLabel(key), colors });
    }
  }
  if (isRecord(raw.night)) {
    for (const [key, entry] of Object.entries(raw.night)) {
      if (!isRecord(entry)) continue;
      if (entry.findable === false) continue;
      if (typeof entry.color !== 'string' || !hexPattern.test(entry.color)) continue;
      if (typeof entry.albedo !== 'string' || !hexPattern.test(entry.albedo)) continue;
      const intensity = typeof entry.intensity === 'number' && Number.isFinite(entry.intensity) ? entry.intensity : 1;
      nightFallback.push({
        name: key,
        label: humanizeLabel(key),
        color: entry.color.toLowerCase(),
        intensity,
        albedo: entry.albedo.toLowerCase(),
        ...(typeof entry.describe === 'string' && entry.describe.trim() ? { describe: entry.describe.trim() } : {}),
      });
    }
  }
  return { colorZones, presets, partDescriptions, nightFallback };
}

function parseDetailResponse(assetId: string, raw: unknown, paramsRaw: unknown): PolyforkDetail | null {
  if (!isRecord(raw) || raw.id !== assetId) return null;
  const params = parseParamsMetadata(paramsRaw);
  const riggedParts: RiggedPartSpec[] = [];
  if (isRecord(raw.rigged_parts)) {
    for (const [name, entry] of Object.entries(raw.rigged_parts)) {
      if (!isRecord(entry)) continue;
      const axis = entry.axis;
      if (typeof axis !== 'string' || !axes.has(axis as Axis)) continue;
      if (!Array.isArray(entry.range) || entry.range.length !== 2) continue;
      const r0 = Number(entry.range[0]), r1 = Number(entry.range[1]);
      if (!Number.isFinite(r0) || !Number.isFinite(r1) || r0 === r1) continue;
      const type = entry.type === 'slide' ? 'slide' : 'rotate';
      const describe = typeof entry.describe === 'string' && entry.describe.trim()
        ? entry.describe.trim() : params.partDescriptions.get(name);
      riggedParts.push({
        name,
        label: humanizeLabel(name),
        type,
        axis: axis as Axis,
        range: [r0, r1],
        ...(describe ? { describe } : {}),
      });
    }
  }
  const detachableParts: DetachablePartSpec[] = [];
  if (Array.isArray(raw.detachable_parts)) {
    for (const item of raw.detachable_parts) {
      if (typeof item !== 'string' || !item.trim()) continue;
      const describe = params.partDescriptions.get(item);
      detachableParts.push({
        name: item,
        label: humanizeLabel(item),
        ...(describe ? { describe } : {}),
      });
    }
  }
  const nightZones: NightZoneSpec[] = [];
  if (isRecord(raw.night)) {
    for (const [key, entry] of Object.entries(raw.night)) {
      if (!isRecord(entry) || entry.findable === false) continue;
      if (typeof entry.color !== 'string' || !hexPattern.test(entry.color)) continue;
      if (typeof entry.albedo !== 'string' || !hexPattern.test(entry.albedo)) continue;
      const intensity = typeof entry.intensity === 'number' && Number.isFinite(entry.intensity) ? entry.intensity : 1;
      nightZones.push({
        name: key,
        label: humanizeLabel(key),
        color: entry.color.toLowerCase(),
        intensity,
        albedo: entry.albedo.toLowerCase(),
        ...(typeof entry.describe === 'string' && entry.describe.trim() ? { describe: entry.describe.trim() } : {}),
      });
    }
  }
  const decals = parseDecalSlots(raw.decals);
  let dimensions: AssetDimensionsSpec | undefined;
  if (isRecord(raw.size_m)) {
    const x = Number(raw.size_m.x), y = Number(raw.size_m.y), z = Number(raw.size_m.z);
    const originY = typeof raw.origin_y === 'number' && Number.isFinite(raw.origin_y) ? raw.origin_y : 0;
    if ([x, y, z].every(Number.isFinite)) {
      dimensions = {
        sizeM: { x, y, z },
        originY,
        ...(typeof raw.origin === 'string' && raw.origin.trim() ? { origin: raw.origin.trim() } : {}),
      };
    }
  }
  let physics: AssetPhysicsSpec | undefined;
  if (isRecord(raw.physics) && (raw.physics.body === 'static' || raw.physics.body === 'dynamic')) {
    physics = {
      body: raw.physics.body,
      ...(typeof raw.physics.mass_kg === 'number' && Number.isFinite(raw.physics.mass_kg) ? { massKg: raw.physics.mass_kg } : {}),
      ...(typeof raw.physics.material === 'string' && raw.physics.material.trim() ? { material: raw.physics.material.trim() } : {}),
    };
  }
  let ik: AssetIkSpec | undefined;
  if (raw.has_ik === true && (raw.ik_type === 'legs' || raw.ik_type === 'arm')) {
    ik = {
      type: raw.ik_type,
      summary: raw.ik_type === 'legs' ? 'Solvable legged gait rig' : 'Solvable articulated arm IK rig',
    };
  }
  return {
    id: assetId,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : assetId,
    ...(typeof raw.description === 'string' && raw.description.trim() ? { description: raw.description.trim() } : {}),
    ...(typeof raw.kit === 'string' && raw.kit.trim() ? { kit: raw.kit.trim() } : {}),
    riggedParts,
    detachableParts,
    nightZones: nightZones.length ? nightZones : params.nightFallback,
    decals,
    colorZones: params.colorZones,
    presets: params.presets,
    ...(dimensions ? { dimensions } : {}),
    ...(physics ? { physics } : {}),
    ...(ik ? { ik } : {}),
  };
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number, signal?: AbortSignal): Promise<{ data: unknown; failed: boolean }> {
  try {
    const timeout = AbortSignal.timeout(timeoutMs);
    const reqSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const response = await fetch(url, { credentials: 'omit', signal: reqSignal });
    if (response.status === 429) {
      recordPolyforkRateLimit(response.headers.get('Retry-After'));
      return { data: null, failed: true };
    }
    if (!response.ok || !(response.headers.get('content-type') ?? '').includes('json')) {
      return { data: null, failed: true };
    }
    return { data: await response.json(), failed: false };
  } catch {
    return { data: null, failed: true };
  }
}

/** Best-effort parallel read of PolyFork's public detail + params JSON. Never throws so offline/synthetic GLB opens always work. */
export async function fetchPolyforkDetail(
  assetId: string,
  signal?: AbortSignal,
  expectParams = true,
): Promise<PolyforkDetail | null> {
  if (!/^[a-z0-9][a-z0-9_-]{0,159}$/.test(assetId)) return null;
  const cached = cache.get(assetId);
  if (cached && cached.expires > Date.now()) return cached.value;
  if (isPolyforkRateLimited()) return null;

  const expectedParamsUrl = `${origin}/cdn/${assetId}-params.json`;
  const detailPromise = fetchJsonWithTimeout(`${origin}/api/assets/${assetId}`, 4_000, signal);
  const speculativeParams = expectParams ? fetchJsonWithTimeout(expectedParamsUrl, 3_500, signal) : null;

  const { data: raw, failed: detailFailed } = await detailPromise;
  if (detailFailed || !isRecord(raw)) return null;

  let paramsRaw: unknown = null;
  let paramsFailed = false;
  if (typeof raw.params_url === 'string' && raw.params_url.startsWith(`${origin}/cdn/`)) {
    const paramsResult = raw.params_url === expectedParamsUrl && speculativeParams
      ? await speculativeParams
      : await fetchJsonWithTimeout(raw.params_url, 3_000, signal);
    paramsRaw = paramsResult.data;
    paramsFailed = paramsResult.failed;
  }
  const parsed = parseDetailResponse(assetId, raw, paramsRaw);
  // Do not cache partial records whose params fetch failed so retries and saved fallbacks can recover color zones.
  if (parsed && !paramsFailed) {
    if (cache.size >= cacheLimit) {
      const first = cache.keys().next();
      if (!first.done) cache.delete(first.value);
    }
    cache.set(assetId, { value: parsed, expires: Date.now() + cacheTtl });
  }
  return parsed;
}

/** Combine verified PolyFork metadata with the actual nodes and embedded decals present in the loaded Three.js group. */
export function buildPolyforkCapabilities(
  group: Object3D,
  assetId: string,
  title: string,
  detail: PolyforkDetail | null,
): AssetCapabilities {
  const riggedParts = (detail?.riggedParts ?? []).filter(part => Boolean(group.getObjectByName(part.name)));
  const detachableParts = (detail?.detachableParts ?? []).filter(part => Boolean(group.getObjectByName(part.name)));
  const embeddedDecals = readEmbeddedDecals(group);
  const decals = detail?.decals.length ? detail.decals : embeddedDecals;
  return {
    version: 1,
    name: title,
    ...(detail?.description ? { description: detail.description } : {}),
    source: {
      kind: 'polyfork',
      id: assetId,
      url: `${origin}/asset/${assetId}`,
      ...(detail?.kit ? { kit: detail.kit } : {}),
    },
    riggedParts,
    detachableParts,
    nightZones: detail?.nightZones ?? [],
    decals,
    ...(detail?.colorZones.length ? { colorZones: detail.colorZones } : {}),
    ...(detail?.presets.length ? { presets: detail.presets } : {}),
    ...(detail?.dimensions ? { dimensions: detail.dimensions } : {}),
    ...(detail?.physics ? { physics: detail.physics } : {}),
    ...(detail?.ik ? { ik: detail.ik } : {}),
  };
}
