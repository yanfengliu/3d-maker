import * as T from 'three';
import {
  resolveAssetVolumes,
  validateScenePlacement,
  type PlacementValidationResult,
  type ScenePlacementItem,
} from './obb';
import { readCapabilities, type AssetCapabilities } from './schema';
import { checkRiggedSweep, type RiggedSweepReport } from './sweep';

export interface CompositeSurfaceIssue {
  childId: string;
  hostId: string;
  surface: string;
  kind: 'missing-surface' | 'footprint-overflow' | 'clearance-exceeded';
  detail: string;
}

export interface CompositeValidationResult {
  valid: boolean;
  surfaceIssues: CompositeSurfaceIssue[];
  placement: PlacementValidationResult;
  sweeps: Record<string, RiggedSweepReport>;
}

/**
 * Deterministically validate all surface footprints/headroom, sibling/wall OBB overlaps, and per-child
 * rigged-part sweep arcs across an assembled composite asset.
 */
export function validateComposite(
  root: T.Object3D,
  options: { margin?: number; sweepSteps?: number } = {},
): CompositeValidationResult {
  const caps = readCapabilities(root);
  const children = caps?.children ?? [];
  if (!children.length) {
    return {
      valid: true,
      surfaceIssues: [],
      placement: { valid: true, checkedPairs: 0, overlaps: [] },
      sweeps: {},
    };
  }

  root.updateMatrixWorld(true);
  const margin = options.margin ?? 0.01;
  const surfaceIssues: CompositeSurfaceIssue[] = [];
  const childById = new Map(children.map(c => [c.id, c]));
  const childRootById = new Map<string, T.Object3D>();
  for (const child of children) {
    const slot = root.getObjectByName(child.slotNode);
    if (!slot) continue;
    childRootById.set(child.id, slot.children[0] ?? slot);
  }

  // 1. Validate surface seating (footprint bounds and vertical clearanceY headroom).
  for (const child of children) {
    if (!child.mount.surface || !child.mount.parent) continue;
    const host = childById.get(child.mount.parent);
    const hostRoot = childRootById.get(child.mount.parent);
    const childRoot = childRootById.get(child.id);
    if (!host || !hostRoot || !childRoot) continue;
    const surf = host.capabilities.surfaces?.find(s => s.name === child.mount.surface);
    if (!surf) {
      surfaceIssues.push({
        childId: child.id,
        hostId: host.id,
        surface: child.mount.surface,
        kind: 'missing-surface',
        detail: `Host "${host.id}" has no declared surface "${child.mount.surface}"`,
      });
      continue;
    }
    const invHost = hostRoot.matrixWorld.clone().invert();
    const boxInHost = new T.Box3();
    const v = new T.Vector3();
    const rel = new T.Matrix4();
    childRoot.traverse(node => {
      if (!(node instanceof T.Mesh) || node.userData.studioOverlay) return;
      const geo = node.geometry as T.BufferGeometry;
      const pos = geo.getAttribute('position') as T.BufferAttribute | undefined;
      if (!pos) return;
      rel.multiplyMatrices(invHost, node.matrixWorld);
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(rel);
        if (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) boxInHost.expandByPoint(v);
      }
    });
    if (boxInHost.isEmpty()) continue;
    const halfW = surf.size[0] * 0.5 + margin;
    const halfD = surf.size[1] * 0.5 + margin;
    if (
      boxInHost.min.x < surf.at[0] - halfW ||
      boxInHost.max.x > surf.at[0] + halfW ||
      boxInHost.min.z < surf.at[2] - halfD ||
      boxInHost.max.z > surf.at[2] + halfD
    ) {
      surfaceIssues.push({
        childId: child.id,
        hostId: host.id,
        surface: surf.name,
        kind: 'footprint-overflow',
        detail: `Child "${child.id}" extends past surface "${surf.name}" (${surf.size[0].toFixed(2)}x${surf.size[1].toFixed(2)}m)`,
      });
    }
    if (surf.clearanceY !== undefined && boxInHost.max.y > surf.at[1] + surf.clearanceY + margin) {
      surfaceIssues.push({
        childId: child.id,
        hostId: host.id,
        surface: surf.name,
        kind: 'clearance-exceeded',
        detail: `Child "${child.id}" top (${(boxInHost.max.y - surf.at[1]).toFixed(2)}m) exceeds "${surf.name}" clearanceY (${surf.clearanceY.toFixed(2)}m)`,
      });
    }
  }

  // 2. Build scene placement items with scoped node names for live OBB overlap checks.
  const items: ScenePlacementItem[] = [];
  const hostPairs = new Set<string>();
  const scopedCapsById = new Map<string, AssetCapabilities>();
  for (const child of children) {
    const inner = childRootById.get(child.id);
    if (!inner) continue;
    const prefix = child.nodePrefix ?? '';
    const scopedCaps: AssetCapabilities = structuredClone(child.capabilities);
    if (prefix) {
      for (const col of scopedCaps.colliders ?? []) {
        if (col.node && !col.node.startsWith(prefix)) col.node = `${prefix}${col.node}`;
      }
      for (const p of scopedCaps.riggedParts) {
        if (!p.name.startsWith(prefix)) p.name = `${prefix}${p.name}`;
      }
      for (const z of scopedCaps.clearanceZones ?? []) {
        if (z.part && !z.part.startsWith(prefix)) z.part = `${prefix}${z.part}`;
      }
    }
    scopedCapsById.set(child.id, scopedCaps);
    items.push({ id: child.id, object: inner, capabilities: scopedCaps });
    if (child.mount.parent) {
      const pairKey = [child.id, child.mount.parent].sort().join('::');
      hostPairs.add(pairKey);
    }
  }

  const rawPlacement = validateScenePlacement(items, { tolerance: margin });
  const overlaps = rawPlacement.overlaps.filter(overlap => {
    const pairKey = [overlap.itemA, overlap.itemB].sort().join('::');
    if (!hostPairs.has(pairKey)) return true;
    return overlap.kind === 'clearance-blocked';
  });
  const placement: PlacementValidationResult = {
    valid: overlaps.length === 0,
    checkedPairs: rawPlacement.checkedPairs,
    overlaps,
  };

  // 3. Sweep every child's rigged parts against all non-host sibling colliders (and host surface bodies).
  const volumesById = new Map(
    items.map(item => [item.id, resolveAssetVolumes(item, { includeClearanceZones: false })]),
  );
  const sweeps: Record<string, RiggedSweepReport> = {};
  for (const child of children) {
    const inner = childRootById.get(child.id);
    const scopedCaps = scopedCapsById.get(child.id);
    if (!inner || !scopedCaps || !scopedCaps.riggedParts.length) continue;
    const obstacles = items
      .filter(other => other.id !== child.id)
      .flatMap(other => {
        const pairKey = [child.id, other.id].sort().join('::');
        if (hostPairs.has(pairKey) && child.mount.coupling !== 'surface') return [];
        return volumesById.get(other.id) ?? [];
      });
    const prevManifest = inner.userData.formFoundry as unknown;
    inner.userData.formFoundry = scopedCaps;
    try {
      sweeps[child.id] = checkRiggedSweep(inner, {
        steps: options.sweepSteps ?? 7,
        tolerance: Math.max(0.015, margin),
        obstacles,
      });
    } finally {
      if (prevManifest === undefined) delete inner.userData.formFoundry;
      else inner.userData.formFoundry = prevManifest;
    }
  }

  const sweepsValid = Object.values(sweeps).every(r => r.valid);
  return {
    valid: surfaceIssues.length === 0 && placement.valid && sweepsValid,
    surfaceIssues,
    placement,
    sweeps,
  };
}
