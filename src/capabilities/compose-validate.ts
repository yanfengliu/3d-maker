import * as T from 'three';
import type { CompositeChildSpec } from './compose-schema';
import { findOwnNodeByName, surfaceBasis, traverseOwnSubtree } from './compose-tree';
import {
  buildOrientedBox,
  colliderHalfExtents,
  isVisibleInTree,
  resolveAssetVolumes,
  validateScenePlacement,
  type OrientedBox,
  type PlacementValidationResult,
  type ScenePlacementItem,
} from './obb';
import { readCapabilities, type AssetCapabilities } from './schema';
import { checkRiggedSweep, type RiggedSweepReport } from './sweep';

export interface CompositeSurfaceIssue {
  childId: string;
  hostId: string;
  surface: string;
  kind: 'missing-surface' | 'footprint-overflow' | 'clearance-exceeded' | 'surface-penetration';
  detail: string;
}

export interface CompositeValidationResult {
  valid: boolean;
  surfaceIssues: CompositeSurfaceIssue[];
  placement: PlacementValidationResult;
  sweeps: Record<string, RiggedSweepReport>;
}

interface FlatChildEntry {
  id: string;
  parentId?: string;
  spec: CompositeChildSpec;
  slot: T.Object3D;
  inner: T.Object3D;
}

function isDescendantOrSelf(candidate: T.Object3D, ancestor: T.Object3D): boolean {
  let cur: T.Object3D | null = candidate;
  while (cur) {
    if (cur === ancestor) return true;
    cur = cur.parent;
  }
  return false;
}

function flattenCompositeChildren(
  root: T.Object3D,
  children: readonly CompositeChildSpec[],
  pathPrefix: string,
  out: FlatChildEntry[],
): void {
  for (const child of children) {
    const slot = root.getObjectByName(child.slotNode);
    if (!slot) continue;
    const inner = slot.children[0] ?? slot;
    const qualifiedId = pathPrefix ? `${pathPrefix}/${child.id}` : child.id;
    const parentId = child.mount.parent
      ? (pathPrefix ? `${pathPrefix}/${child.mount.parent}` : child.mount.parent)
      : undefined;
    out.push({
      id: qualifiedId,
      ...(parentId ? { parentId } : {}),
      spec: child,
      slot,
      inner,
    });
    if (child.capabilities.children?.length) {
      flattenCompositeChildren(inner, child.capabilities.children, qualifiedId, out);
    }
  }
}

function makeLeafCapabilities(caps: AssetCapabilities, prefix: string): AssetCapabilities {
  const leaf: AssetCapabilities = structuredClone(caps);
  delete leaf.children;
  if (prefix) {
    for (const col of leaf.colliders ?? []) {
      if (col.node && !col.node.startsWith(prefix)) col.node = `${prefix}${col.node}`;
    }
    for (const p of leaf.riggedParts) {
      if (!p.name.startsWith(prefix)) p.name = `${prefix}${p.name}`;
    }
    for (const z of leaf.clearanceZones ?? []) {
      if (z.part && !z.part.startsWith(prefix)) z.part = `${prefix}${z.part}`;
    }
  }
  return leaf;
}

function resolveLiveOwnColliders(entry: FlatChildEntry): OrientedBox[] {
  const leafCaps = entry.spec.capabilities;
  if (!leafCaps.colliders?.length) return [];
  const prefix = entry.spec.nodePrefix ?? '';
  const hiddenSet = new Set(leafCaps.state?.hiddenParts ?? []);
  const boxes: OrientedBox[] = [];
  for (const spec of leafCaps.colliders) {
    const layer = spec.layer ?? 'solid';
    if (layer === 'none') continue;
    if (spec.node) {
      if (hiddenSet.has(spec.node)) continue;
      const node = findOwnNodeByName(entry.inner, spec.node, prefix);
      if (!node || !isVisibleInTree(node)) continue;
      boxes.push(buildOrientedBox(node.matrixWorld, spec.at, colliderHalfExtents(spec), {
        id: `${entry.id}:carried:${spec.name}`,
        name: spec.name,
        ownerId: entry.id,
        kind: 'collider',
        layer,
        part: spec.node,
        ...(spec.rotation ? { rotation: spec.rotation } : {}),
      }));
    } else {
      boxes.push(buildOrientedBox(entry.inner.matrixWorld, spec.at, colliderHalfExtents(spec), {
        id: `${entry.id}:carried:${spec.name}`,
        name: spec.name,
        ownerId: entry.id,
        kind: 'collider',
        layer,
        ...(spec.rotation ? { rotation: spec.rotation } : {}),
      }));
    }
  }
  return boxes;
}

/**
 * Deterministically validate all surface footprints/penetration/headroom, sibling/wall OBB overlaps,
 * and per-child rigged-part sweep arcs (including carried loads) across an assembled composite asset.
 */
export function validateComposite(
  root: T.Object3D,
  options: { margin?: number; sweepSteps?: number } = {},
): CompositeValidationResult {
  const caps = readCapabilities(root);
  const topChildren = caps?.children ?? [];
  if (!topChildren.length) {
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
  const entries: FlatChildEntry[] = [];
  flattenCompositeChildren(root, topChildren, '', entries);
  const entryById = new Map(entries.map(e => [e.id, e]));

  // 1. Validate surface seating in the real orthonormal surface frame (footprint, penetration, and clearanceY headroom).
  for (const entry of entries) {
    const { mount } = entry.spec;
    if (!mount.surface || !entry.parentId) continue;
    const host = entryById.get(entry.parentId);
    if (!host) continue;
    const surf = host.spec.capabilities.surfaces?.find(s => s.name === mount.surface);
    if (!surf) {
      surfaceIssues.push({
        childId: entry.id,
        hostId: host.id,
        surface: mount.surface,
        kind: 'missing-surface',
        detail: `Host "${host.id}" has no declared surface "${mount.surface}"`,
      });
      continue;
    }

    const invHost = host.inner.matrixWorld.clone().invert();
    const { u, n, v } = surfaceBasis(surf.normal);
    const surfOrigin = new T.Vector3(...surf.at);
    const pt = new T.Vector3();
    const rel = new T.Matrix4();
    let minU = Infinity, maxU = -Infinity;
    let minN = Infinity, maxN = -Infinity;
    let minV = Infinity, maxV = -Infinity;

    traverseOwnSubtree(entry.inner, node => {
      if (!(node instanceof T.Mesh) || node.userData.studioOverlay) return;
      const geo = node.geometry as T.BufferGeometry;
      const pos = geo.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
      if (!pos) return;
      rel.multiplyMatrices(invHost, node.matrixWorld);
      for (let i = 0; i < pos.count; i++) {
        pt.fromBufferAttribute(pos, i).applyMatrix4(rel);
        if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y) || !Number.isFinite(pt.z)) continue;
        pt.sub(surfOrigin);
        const pu = pt.dot(u);
        const pn = pt.dot(n);
        const pv = pt.dot(v);
        if (pu < minU) minU = pu;
        if (pu > maxU) maxU = pu;
        if (pn < minN) minN = pn;
        if (pn > maxN) maxN = pn;
        if (pv < minV) minV = pv;
        if (pv > maxV) maxV = pv;
      }
    });
    if (!Number.isFinite(minU)) continue;

    const halfW = surf.size[0] * 0.5 + margin;
    const halfD = surf.size[1] * 0.5 + margin;
    if (minU < -halfW || maxU > halfW || minV < -halfD || maxV > halfD) {
      surfaceIssues.push({
        childId: entry.id,
        hostId: host.id,
        surface: surf.name,
        kind: 'footprint-overflow',
        detail: `Child "${entry.id}" extends past surface "${surf.name}" (${surf.size[0].toFixed(2)}x${surf.size[1].toFixed(2)}m)`,
      });
    }
    if (minN < -margin) {
      surfaceIssues.push({
        childId: entry.id,
        hostId: host.id,
        surface: surf.name,
        kind: 'surface-penetration',
        detail: `Child "${entry.id}" penetrates ${Math.abs(minN).toFixed(3)}m below surface "${surf.name}"`,
      });
    }
    if (surf.clearanceY !== undefined && maxN > surf.clearanceY + margin) {
      surfaceIssues.push({
        childId: entry.id,
        hostId: host.id,
        surface: surf.name,
        kind: 'clearance-exceeded',
        detail: `Child "${entry.id}" top (${maxN.toFixed(2)}m) exceeds "${surf.name}" clearanceY (${surf.clearanceY.toFixed(2)}m)`,
      });
    }
  }

  // 2. Build scene placement items with leaf-only scoped capabilities for live OBB overlap checks.
  const items: ScenePlacementItem[] = [];
  const leafCapsById = new Map<string, AssetCapabilities>();
  for (const entry of entries) {
    const leafCaps = makeLeafCapabilities(entry.spec.capabilities, entry.spec.nodePrefix ?? '');
    leafCapsById.set(entry.id, leafCaps);
    items.push({ id: entry.id, object: entry.inner, capabilities: leafCaps });
  }

  const findDirectMountEdge = (idA: string, idB: string): { child: FlatChildEntry; host: FlatChildEntry } | undefined => {
    const a = entryById.get(idA);
    const b = entryById.get(idB);
    if (!a || !b) return undefined;
    if (a.parentId === b.id) return { child: a, host: b };
    if (b.parentId === a.id) return { child: b, host: a };
    return undefined;
  };

  const rawPlacement = validateScenePlacement(items, { tolerance: margin });
  const overlaps = rawPlacement.overlaps.filter(overlap => {
    const edge = findDirectMountEdge(overlap.itemA, overlap.itemB);
    if (!edge) return true;
    if (overlap.kind === 'collision') {
      // Only welded/joined seams legitimately touch or interpenetrate their direct host; surface-mounted penetration is a real defect.
      return edge.child.spec.mount.coupling === 'surface';
    }
    if (overlap.kind === 'clearance-blocked') {
      // A child physically mounted onto a host's moving rigged part moves WITH that part and does not block its own clearance zone.
      const hostVolName = overlap.itemA === edge.host.id ? overlap.volumeA : overlap.volumeB;
      const zone = edge.host.spec.capabilities.clearanceZones?.find(z => z.name === hostVolName);
      if (zone?.part) {
        const partNode = findOwnNodeByName(edge.host.inner, zone.part, edge.host.spec.nodePrefix);
        if (partNode && isDescendantOrSelf(edge.child.slot, partNode)) return false;
      }
    }
    return true;
  });
  const placement: PlacementValidationResult = {
    valid: overlaps.length === 0,
    checkedPairs: rawPlacement.checkedPairs,
    overlaps,
  };

  // 3. Sweep every child's rigged parts against all non-carried external colliders, including carried loads moving with the part.
  const volumesById = new Map(
    items.map(item => [item.id, resolveAssetVolumes(item, { includeClearanceZones: false })]),
  );
  const sweeps: Record<string, RiggedSweepReport> = {};
  for (const entry of entries) {
    if (!entry.spec.capabilities.riggedParts.length) continue;
    sweeps[entry.id] = checkRiggedSweep(entry.inner, {
      steps: options.sweepSteps ?? 7,
      tolerance: Math.max(0.015, margin),
      capabilities: entry.spec.capabilities,
      ...(entry.spec.nodePrefix ? { nodePrefix: entry.spec.nodePrefix } : {}),
      getObstaclesForPart: (_localPartName, movingNode) => {
        const result: OrientedBox[] = [];
        for (const other of entries) {
          if (other.id === entry.id) continue;
          if (isDescendantOrSelf(other.slot, movingNode)) continue;
          const edge = findDirectMountEdge(entry.id, other.id);
          if (edge && edge.child.spec.mount.coupling !== 'surface') continue;
          const vols = volumesById.get(other.id);
          if (vols) result.push(...vols);
        }
        return result;
      },
      getCarriedBoxes: (_localPartName, movingNode) => {
        const carried: OrientedBox[] = [];
        for (const other of entries) {
          if (other.id === entry.id) continue;
          if (!isDescendantOrSelf(other.slot, movingNode)) continue;
          carried.push(...resolveLiveOwnColliders(other));
        }
        return carried;
      },
    });
  }

  const sweepsValid = Object.values(sweeps).every(r => r.valid);
  return {
    valid: surfaceIssues.length === 0 && placement.valid && sweepsValid,
    surfaceIssues,
    placement,
    sweeps,
  };
}
