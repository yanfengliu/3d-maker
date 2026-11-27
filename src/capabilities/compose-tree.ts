import * as T from 'three';
import type { CompositeChildSpec, CompositeMountSpec } from './compose-schema';
import type { AssetCapabilities, AssetPhysicsSpec, SurfaceSpec } from './schema';

export interface CompositeRigidBodySpec {
  rootId: string;
  memberIds: string[];
  body: 'static' | 'dynamic';
  massKg?: number;
}

export interface ExportPoseProvider {
  syncManifest(): AssetCapabilities;
  applyPoseToClone(cloneRoot: T.Object3D): void;
  getAnimations?(): T.AnimationClip[];
}

interface NodeRestPose {
  pos: T.Vector3;
  quat: T.Quaternion;
}

const liveControllers = new WeakMap<T.Object3D, ExportPoseProvider>();
const riggedRestPoses = new WeakMap<T.Object3D, NodeRestPose>();

export function registerRiggedRestPose(node: T.Object3D, pos: T.Vector3, quat: T.Quaternion): void {
  riggedRestPoses.set(node, { pos: pos.clone(), quat: quat.clone() });
}

export function getRiggedRestPose(node: T.Object3D): NodeRestPose | undefined {
  return riggedRestPoses.get(node);
}

function resolveCanonicalTargets(root: T.Object3D): T.Object3D[] {
  const targets: T.Object3D[] = [root];
  let cur: T.Object3D = root;
  for (let depth = 0; depth < 2; depth++) {
    const only = cur.children.length === 1 ? cur.children[0] : undefined;
    if (!only || only.userData.compositeSlot || only.userData.compositeChild) break;
    targets.push(only);
    cur = only;
  }
  return targets;
}

export function registerLiveController(root: T.Object3D, provider: ExportPoseProvider): void {
  for (const target of resolveCanonicalTargets(root)) liveControllers.set(target, provider);
}

export function unregisterLiveController(root: T.Object3D, provider: ExportPoseProvider): void {
  for (const target of resolveCanonicalTargets(root)) {
    if (liveControllers.get(target) === provider) liveControllers.delete(target);
  }
}

export function getLiveController(root: T.Object3D): ExportPoseProvider | undefined {
  const direct = liveControllers.get(root);
  if (direct) return direct;
  for (const target of resolveCanonicalTargets(root)) {
    const hit = liveControllers.get(target);
    if (hit) return hit;
  }
  let up = root.parent;
  for (let depth = 0; depth < 2 && up; depth++) {
    if (up.children.length === 1) {
      const hit = liveControllers.get(up);
      if (hit) return hit;
    }
    up = up.parent;
  }
  return undefined;
}

function r3(n: number): number {
  return Math.round((n + 1e-9) * 1000) / 1000 || 0;
}

/**
 * Traverse a node's own subtree without crossing into nested composite child slots (`userData.compositeSlot`).
 */
export function traverseOwnSubtree(root: T.Object3D, visit: (node: T.Object3D) => void): void {
  const stack: T.Object3D[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    visit(node);
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      if (!child || child.userData.compositeSlot) continue;
      stack.push(child);
    }
  }
}

/**
 * Traverse a child asset's geometry subtree: for a nested composite, descends into its own internal sub-assembly
 * slots while skipping any external dependent slots listed in `skipSlots`.
 */
export function traverseAssetGeometry(
  root: T.Object3D,
  includeNestedSlots: boolean,
  skipSlots: ReadonlySet<T.Object3D> | undefined,
  visit: (node: T.Object3D) => void,
): void {
  const stack: T.Object3D[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    visit(node);
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      if (!child) continue;
      if (skipSlots?.has(child)) continue;
      if (!includeNestedSlots && child.userData.compositeSlot) continue;
      stack.push(child);
    }
  }
}

/**
 * Find a named node strictly inside `root`'s own subtree (never leaking into nested `Slot_*` children).
 * Falls back to `userData.localName` so `scopeNames: false` GLB reloads survive GLTFLoader duplicate renaming.
 */
export function findOwnNodeByName(
  root: T.Object3D,
  name: string,
  prefix?: string,
): T.Object3D | undefined {
  const prefixed = prefix ? `${prefix}${name}` : '';
  let exact: T.Object3D | undefined;
  let fallback: T.Object3D | undefined;
  let byLocalName: T.Object3D | undefined;
  traverseOwnSubtree(root, node => {
    if (prefixed && !exact && node.name === prefixed) exact = node;
    if (!fallback && node.name === name) fallback = node;
    if (!byLocalName && node.userData.localName === name) byLocalName = node;
  });
  return exact ?? fallback ?? byLocalName;
}

/**
 * Compute a deterministic right-handed orthonormal surface frame `(u, n, v)` from an outward surface normal.
 * For `[0, 1, 0]` this yields `u = [1, 0, 0]`, `n = [0, 1, 0]`, `v = [0, 0, 1]`.
 */
export function surfaceBasis(normal: readonly [number, number, number]): {
  u: T.Vector3;
  n: T.Vector3;
  v: T.Vector3;
} {
  const n = new T.Vector3(normal[0], normal[1], normal[2]);
  if (n.lengthSq() < 1e-10) n.set(0, 1, 0);
  else n.normalize();
  const ref = Math.abs(n.y) > 0.9 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
  const u = new T.Vector3().crossVectors(ref, n).normalize();
  const v = new T.Vector3().crossVectors(u, n).normalize();
  return { u, n, v };
}

/**
 * Compute a headless local-to-parent Matrix4 for a `CompositeMountSpec` (used by JSON-only placement checks).
 */
export function mountLocalMatrix(mount: CompositeMountSpec, hostSurface?: SurfaceSpec): T.Matrix4 {
  const offset = mount.at ?? [0, 0, 0];
  let pos: T.Vector3;
  if (hostSurface) {
    const { u, n, v } = surfaceBasis(hostSurface.normal);
    pos = new T.Vector3(...hostSurface.at)
      .addScaledVector(u, offset[0])
      .addScaledVector(n, offset[1])
      .addScaledVector(v, offset[2]);
  } else {
    pos = new T.Vector3(offset[0], offset[1], offset[2]);
  }
  const rot = mount.rotation ?? [0, 0, 0];
  const q = new T.Quaternion().setFromEuler(new T.Euler(rot[0], rot[1], rot[2], 'XYZ'));
  const sc = mount.scale ?? 1;
  const s = typeof sc === 'number' ? new T.Vector3(sc, sc, sc) : new T.Vector3(sc[0], sc[1], sc[2]);
  return new T.Matrix4().compose(pos, q, s);
}

/**
 * Measure the full bounding box of all non-overlay meshes under `root` (including composed children) in `root`'s local frame.
 */
export function measureCompositeLocalBox(root: T.Object3D): T.Box3 {
  root.updateMatrixWorld(true);
  const invRoot = root.matrixWorld.clone().invert();
  const box = new T.Box3();
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  root.traverse(node => {
    if (!(node instanceof T.Mesh) || node.userData.studioOverlay) return;
    const geo = node.geometry as T.BufferGeometry;
    const pos = geo.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    if (!pos) return;
    rel.multiplyMatrices(invRoot, node.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(rel);
      if (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) box.expandByPoint(v);
    }
  });
  return box;
}

/**
 * Partition composite children (recursively across nested composites) into independent rigid bodies
 * by walking `weld` mount edges only. Independent nested `surface`/`joint` bodies are preserved with qualified IDs.
 */
export function computeCompositeBodies(
  capabilities: AssetCapabilities,
): CompositeRigidBodySpec[] {
  const children = capabilities.children ?? [];
  if (!children.length) {
    return capabilities.physics
      ? [{
        rootId: capabilities.name,
        memberIds: [capabilities.name],
        body: capabilities.physics.body,
        ...(capabilities.physics.massKg !== undefined ? { massKg: capabilities.physics.massKg } : {}),
      }]
      : [];
  }

  const byId = new Map(children.map(c => [c.id, c]));
  const primaryId = children[0]?.id;
  const resolveBodyRoot = (child: CompositeChildSpec): CompositeChildSpec => {
    let cur = child;
    const visited = new Set<string>([cur.id]);
    while (cur.mount.coupling === 'weld') {
      if (cur.mount.parent) {
        const next = byId.get(cur.mount.parent);
        if (!next || visited.has(next.id)) break;
        visited.add(next.id);
        cur = next;
      } else if (primaryId && cur.id !== primaryId) {
        const primary = byId.get(primaryId);
        if (!primary || visited.has(primary.id)) break;
        cur = primary;
        break;
      } else {
        break;
      }
    }
    return cur;
  };

  const bodies = new Map<string, { root: CompositeChildSpec; memberIds: string[]; mass: number; hasMass: boolean }>();
  const extraNestedBodies: CompositeRigidBodySpec[] = [];

  for (const child of children) {
    const bodyRoot = resolveBodyRoot(child);
    let entry = bodies.get(bodyRoot.id);
    if (!entry) {
      entry = { root: bodyRoot, memberIds: [], mass: 0, hasMass: false };
      bodies.set(bodyRoot.id, entry);
    }
    entry.memberIds.push(child.id);

    if (child.capabilities.children?.length) {
      const subBodies = computeCompositeBodies(child.capabilities);
      const primarySub = subBodies[0];
      if (primarySub?.massKg !== undefined && primarySub.massKg > 0) {
        entry.mass += primarySub.massKg;
        entry.hasMass = true;
      }
      for (const extra of subBodies.slice(1)) {
        extraNestedBodies.push({
          rootId: `${child.id}/${extra.rootId}`,
          memberIds: extra.memberIds.map(m => `${child.id}/${m}`),
          body: extra.body,
          ...(extra.massKg !== undefined ? { massKg: extra.massKg } : {}),
        });
      }
    } else {
      const m = child.capabilities.physics?.massKg;
      if (typeof m === 'number' && Number.isFinite(m) && m > 0) {
        entry.mass += m;
        entry.hasMass = true;
      }
    }
  }

  return [
    ...[...bodies.values()].map(entry => ({
      rootId: entry.root.id,
      memberIds: entry.memberIds,
      body: entry.root.capabilities.physics?.body ?? 'static',
      ...(entry.hasMass ? { massKg: r3(entry.mass) } : {}),
    })),
    ...extraNestedBodies,
  ];
}

/**
 * Compute aggregate physics for the primary rigid body of a composite asset (summing only children
 * transitively welded onto the primary body, never children welded onto jointed/surface bodies).
 */
export function computeCompositePhysics(
  children: readonly CompositeChildSpec[],
  overrideBody?: 'static' | 'dynamic',
): AssetPhysicsSpec {
  const bodies = computeCompositeBodies({
    version: 1,
    name: 'Composite',
    riggedParts: [],
    detachableParts: [],
    nightZones: [],
    decals: [],
    children: [...children],
  });
  const primary = bodies[0];
  return {
    body: overrideBody ?? primary?.body ?? 'static',
    ...(primary?.massKg !== undefined ? { massKg: primary.massKg } : {}),
  };
}

type DisposableResource = T.BufferGeometry | T.Material | T.Texture | T.Skeleton;

function collectResources(root: T.Object3D, out: Set<DisposableResource>): void {
  root.traverse(node => {
    if (!(node instanceof T.Mesh)) return;
    out.add(node.geometry as T.BufferGeometry);
    if (node instanceof T.SkinnedMesh) out.add(node.skeleton);
    const mats: T.Material[] = Array.isArray(node.material)
      ? (node.material as T.Material[])
      : [node.material as T.Material];
    for (const mat of mats) {
      out.add(mat);
      for (const value of Object.values(mat)) {
        if (value instanceof T.Texture) out.add(value);
      }
    }
  });
}

/**
 * Dispose geometries, materials, material textures, and skeletons belonging exclusively to `removed`,
 * skipping any resource still referenced elsewhere inside `keepRoot`.
 */
export function disposeUnusedResources(removed: T.Object3D, keepRoot: T.Object3D): void {
  const retained = new Set<DisposableResource>();
  collectResources(keepRoot, retained);
  const candidates = new Set<DisposableResource>();
  collectResources(removed, candidates);
  for (const res of candidates) {
    if (!retained.has(res)) res.dispose();
  }
}

export function collectNodeNamesExcluding(root: T.Object3D, excludeSubtree: T.Object3D): Set<string> {
  const names = new Set<string>();
  const stack: T.Object3D[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node || node === excludeSubtree) continue;
    if (node.name) names.add(node.name);
    for (const child of node.children) stack.push(child);
  }
  return names;
}

export function splitFirstSegment(scopedPath: string): [string, string] {
  const slash = scopedPath.indexOf('/');
  if (slash <= 0 || slash === scopedPath.length - 1) {
    throw new Error(`Expected scoped part path "<childId>/<partName>", got "${scopedPath}".`);
  }
  return [scopedPath.slice(0, slash), scopedPath.slice(slash + 1)];
}

export function resolveAnimationPool(
  root: T.Object3D,
  externalAnimations?: readonly T.AnimationClip[],
): readonly T.AnimationClip[] {
  if (externalAnimations?.length) return externalAnimations;
  if (root.animations.length) return root.animations;
  if (root.children.length === 1 && root.children[0]?.animations.length) {
    return root.children[0].animations;
  }
  return [];
}

export function collectClipsForChild(
  pool: readonly T.AnimationClip[],
  childId: string,
  inner: T.Object3D,
): T.AnimationClip[] {
  if (inner.animations.length) return inner.animations;
  const colonPrefix = `${childId}: `;
  const slashPrefix = `${childId}/`;
  const found: T.AnimationClip[] = [];
  for (const clip of pool) {
    if (clip.name.startsWith(colonPrefix)) {
      const copy = clip.clone();
      copy.name = clip.name.slice(colonPrefix.length);
      found.push(copy);
    } else if (clip.name.startsWith(slashPrefix)) {
      const copy = clip.clone();
      copy.name = clip.name.slice(slashPrefix.length);
      found.push(copy);
    }
  }
  return found;
}
