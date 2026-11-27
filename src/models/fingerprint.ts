import { createHash } from 'node:crypto';
import * as T from 'three';
import { inspectAsset } from '../capabilities/runtime';
import type { ModelVariationEntry, Recipe } from '../data/recipe';
import { buildModel } from './index';
import { DEFAULT_VARIATION_ID, variationKey } from './variations';

export interface VariationLockEntry {
  template: string;
  variation: string;
  label: string;
  situation: string;
  recipeHash: string;
  standardHash: string;
  hdHash: string;
  clips: string[];
  riggedParts: string[];
  detachableParts: string[];
}

export interface VariationRepairRecord {
  key: string;
  date: string;
  reason: string;
  fromRecipeHash: string;
  toRecipeHash: string;
  fromStandardHash: string;
  toStandardHash: string;
  fromHdHash: string;
  toHdHash: string;
}

export interface VariationLockfile {
  version: 1;
  entries: Record<string, VariationLockEntry>;
  repairs: VariationRepairRecord[];
}

export interface BaselineLock {
  ref: string;
  lock: VariationLockfile;
}

function sha256(payload: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/** Quantize floats to 1e-3 with a tiny bias so exact decimals round identically across arm64 and x64 CPUs. */
function q(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + 1e-7) * 1000) || 0;
}

function qMat(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + 1e-7) * 100) || 0;
}

function summarizeMaterial(mat: T.Material) {
  const std = mat as Partial<T.MeshStandardMaterial>;
  return [
    mat.type,
    std.color instanceof T.Color ? std.color.getHexString() : '',
    std.emissive instanceof T.Color ? std.emissive.getHexString() : '',
    mat.transparent ? 1 : 0,
    qMat(mat.opacity),
    typeof std.roughness === 'number' ? qMat(std.roughness) : 0,
    typeof std.metalness === 'number' ? qMat(std.metalness) : 0,
  ];
}

export function fingerprintRecipe(recipe: Recipe): string {
  const paramEntries = recipe.params
    ? Object.entries(recipe.params).sort(([a], [b]) => a.localeCompare(b))
    : [];
  return sha256({
    version: recipe.version,
    template: recipe.template,
    variation: recipe.variation ?? DEFAULT_VARIATION_ID,
    name: recipe.name,
    primary: recipe.primary.toLowerCase(),
    accent: recipe.accent.toLowerCase(),
    scale: q(recipe.scale),
    proportion: q(recipe.proportion),
    detail: recipe.detail,
    quality: recipe.quality ?? 'standard',
    ...(paramEntries.length ? { params: Object.fromEntries(paramEntries) } : {}),
  });
}

/**
 * Deterministic structural, geometric, material, animation, and capability digest for a built Group.
 * Deliberately excludes the sibling `capabilities.variations` list so adding new variations to a
 * template never alters existing variations' fingerprints.
 */
export function fingerprintGroup(root: T.Group): string {
  const nodes: unknown[] = [];
  const meshes: unknown[] = [];
  const visit = (node: T.Object3D, path: string) => {
    nodes.push([
      path,
      node.type,
      q(node.position.x), q(node.position.y), q(node.position.z),
      q(node.rotation.x), q(node.rotation.y), q(node.rotation.z),
      q(node.scale.x), q(node.scale.y), q(node.scale.z),
    ]);
    if (node instanceof T.Mesh) {
      const geo = node.geometry as T.BufferGeometry;
      if (!geo.boundingBox) geo.computeBoundingBox();
      const box = geo.boundingBox;
      const pos = geo.getAttribute('position') as T.BufferAttribute | undefined;
      const verts = pos ? pos.count : 0;
      const tris = geo.index ? Math.round(geo.index.count / 3) : Math.round(verts / 3);
      const mats = Array.isArray(node.material)
        ? node.material.map(m => summarizeMaterial(m as T.Material))
        : [summarizeMaterial(node.material as T.Material)];
      const bones = node instanceof T.SkinnedMesh ? node.skeleton.bones.map(b => b.name) : [];
      meshes.push([
        path,
        geo.type,
        verts,
        tris,
        box ? [q(box.min.x), q(box.min.y), q(box.min.z), q(box.max.x), q(box.max.y), q(box.max.z)] : null,
        mats,
        bones,
      ]);
    }
    node.children.forEach((child, index) => {
      const segment = child.name ? `${child.name}#${String(index)}` : `#${String(index)}`;
      visit(child, `${path}/${segment}`);
    });
  };
  visit(root, root.name || 'Asset');

  const clips = root.animations.map(clip => [
    clip.name,
    q(clip.duration),
    clip.tracks.map(track => [track.name, track.times.length, track.values.length]),
  ]);

  const caps = inspectAsset(root);
  const capabilitySignature = {
    sourceVariation: caps.source?.variation ?? DEFAULT_VARIATION_ID,
    physics: caps.physics ?? null,
    riggedParts: caps.riggedParts,
    detachableParts: caps.detachableParts,
    nightZones: caps.nightZones,
    decals: caps.decals,
  };

  return sha256({ nodes, meshes, clips, capabilitySignature });
}

function disposeGroup(root: T.Group) {
  root.traverse(node => {
    if (!(node instanceof T.Mesh)) return;
    (node.geometry as T.BufferGeometry).dispose();
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of mats) (mat as T.Material).dispose();
  });
}

export function computeVariationLockEntry(entry: ModelVariationEntry): VariationLockEntry {
  const standard = buildModel({ ...entry.recipe, quality: 'standard' });
  const hd = buildModel({ ...entry.recipe, quality: 'hd' });
  try {
    const caps = inspectAsset(hd);
    return {
      template: entry.template,
      variation: entry.id,
      label: entry.label,
      situation: entry.situation,
      recipeHash: fingerprintRecipe(entry.recipe),
      standardHash: fingerprintGroup(standard),
      hdHash: fingerprintGroup(hd),
      clips: hd.animations.map(c => c.name),
      riggedParts: caps.riggedParts.map(p => p.name),
      detachableParts: caps.detachableParts.map(p => p.name),
    };
  } finally {
    disposeGroup(standard);
    disposeGroup(hd);
  }
}

function sameHashes(a: VariationLockEntry, b: VariationLockEntry): boolean {
  return a.recipeHash === b.recipeHash && a.standardHash === b.standardHash && a.hdHash === b.hdHash;
}

function repairMatches(
  repairs: readonly VariationRepairRecord[],
  key: string,
  prev: VariationLockEntry,
  next: VariationLockEntry,
): boolean {
  return repairs.some(
    record =>
      record.key === key &&
      record.fromRecipeHash === prev.recipeHash &&
      record.toRecipeHash === next.recipeHash &&
      record.fromStandardHash === prev.standardHash &&
      record.toStandardHash === next.standardHash &&
      record.fromHdHash === prev.hdHash &&
      record.toHdHash === next.hdHash &&
      record.reason.trim().length >= 12 &&
      Number.isFinite(Date.parse(record.date)),
  );
}

/**
 * Pure append-only verification of the committed lockfile against live models and Git baselines.
 * Returns a list of human-readable violation messages (empty when all invariants hold).
 */
export function validateVariationLock(
  lock: VariationLockfile,
  liveEntries: readonly VariationLockEntry[],
  baselines: readonly BaselineLock[] = [],
): string[] {
  const errors: string[] = [];
  const raw = lock as unknown as Record<string, unknown>;
  if (raw.version !== 1 || !raw.entries || typeof raw.entries !== 'object' || !Array.isArray(raw.repairs)) {
    return ['src/models/variations.lock.json has an invalid header; expected { version: 1, entries, repairs }.'];
  }

  const liveByKey = new Map<string, VariationLockEntry>();
  for (const entry of liveEntries) {
    const key = variationKey(entry.template, entry.variation);
    if (liveByKey.has(key)) errors.push(`Duplicate live variation key "${key}".`);
    liveByKey.set(key, entry);
  }

  for (const [key, locked] of Object.entries(lock.entries)) {
    const expectedKey = variationKey(locked.template, locked.variation);
    if (key !== expectedKey) {
      errors.push(`Lockfile key "${key}" does not match "${expectedKey}".`);
      continue;
    }
    const live = liveByKey.get(key);
    if (!live) {
      errors.push(
        `Variation "${key}" was deleted or renamed in code. Stored model variations are append-only so older versions stay available; restore "${key}" and add a new variation ID instead.`,
      );
      continue;
    }
    if (!sameHashes(locked, live)) {
      errors.push(
        `Variation "${key}" changed its recipe or geometry fingerprint in place. Do not overwrite an existing variation for a new look or geometry — add a new variation in src/models/variations.ts and run \`npm run variations:lock\`. Only genuine broken-geometry bug fixes may use \`npm run variations:lock -- --repair ${key} --reason "<bug fix>"\`.`,
      );
    }
  }

  for (const key of liveByKey.keys()) {
    if (!(key in lock.entries)) {
      errors.push(`Live variation "${key}" is not recorded in src/models/variations.lock.json. Run \`npm run variations:lock\` to lock new variations.`);
    }
  }

  for (const baseline of baselines) {
    for (const [key, prev] of Object.entries(baseline.lock.entries)) {
      const current = lock.entries[key];
      if (!current) {
        errors.push(
          `Variation "${key}" existed in Git baseline (${baseline.ref}) but was wiped from src/models/variations.lock.json. Deleting stored variations is forbidden.`,
        );
        continue;
      }
      if (!sameHashes(prev, current) && !repairMatches(lock.repairs, key, prev, current)) {
        errors.push(
          `Variation "${key}" changed fingerprints relative to Git baseline (${baseline.ref}) without a matching audited repair record in variations.lock.json. Add a new variation instead of overwriting "${key}".`,
        );
      }
    }
    for (const prevRepair of baseline.lock.repairs) {
      const stillPresent = lock.repairs.some(r => JSON.stringify(r) === JSON.stringify(prevRepair));
      if (!stillPresent) {
        errors.push(`Repair audit record for "${prevRepair.key}" (${prevRepair.date}) from ${baseline.ref} was removed from variations.lock.json.`);
      }
    }
  }

  return errors;
}
