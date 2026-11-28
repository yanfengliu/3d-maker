import * as T from 'three';
import { MAX_SCOPED_NAME_LEN, type CompositeChildSpec, type CompositeRestTransform } from './compose-schema';
import { findOwnNodeByName, getRiggedRestPose, isHiddenPartName, traverseOwnSubtree } from './compose-tree';
import { axisTuple, slideOffsetFactor } from './rig-math';
import type { AssetCapabilities } from './schema';

export type NodeTransformSnapshot = Map<
  T.Object3D,
  { pos: T.Vector3; rot: T.Euler; quat: T.Quaternion; scale: T.Vector3 }
>;

/** Return `root.matrixWorld` at rest pose (backing out any active pose when `root` itself is a rigged part). */
export function computeRestRootWorld(root: T.Object3D, caps: AssetCapabilities, prefix = ''): T.Matrix4 {
  const rootPart = caps.riggedParts.find(p => findOwnNodeByName(root, p.name, prefix) === root);
  if (!rootPart) return root.matrixWorld;
  const reg = getRiggedRestPose(root);
  let restPos = reg ? reg.pos.clone() : root.position.clone();
  let restQuat = reg ? reg.quat.clone() : root.quaternion.clone();
  if (!reg) {
    const localName = prefix && rootPart.name.startsWith(prefix) ? rootPart.name.slice(prefix.length) : rootPart.name;
    const pose = caps.state?.pose?.[rootPart.name] ?? caps.state?.pose?.[localName] ?? 0;
    if (Math.abs(pose) <= 1e-9) return root.matrixWorld;
    const axis = new T.Vector3(...axisTuple(rootPart.axis));
    if (rootPart.type === 'slide') restPos = restPos.addScaledVector(axis, -pose * slideOffsetFactor(rootPart));
    else restQuat = restQuat.multiply(new T.Quaternion().setFromAxisAngle(axis, -T.MathUtils.degToRad(pose))).normalize();
  }
  const localRest = new T.Matrix4().compose(restPos, restQuat, root.scale);
  return root.parent ? root.parent.matrixWorld.clone().multiply(localRest) : localRest;
}

export function captureOwnNodeTransforms(root: T.Object3D): NodeTransformSnapshot {
  const snap: NodeTransformSnapshot = new Map();
  traverseOwnSubtree(root, node => {
    snap.set(node, {
      pos: node.position.clone(),
      rot: node.rotation.clone(),
      quat: node.quaternion.clone(),
      scale: node.scale.clone(),
    });
  });
  return snap;
}

export function restoreOwnNodeTransforms(snap: NodeTransformSnapshot): void {
  for (const [node, t] of snap) {
    node.position.copy(t.pos);
    node.quaternion.copy(t.quat);
    if (
      Math.abs(node.rotation.x - t.rot.x) > 1e-5
      || Math.abs(node.rotation.y - t.rot.y) > 1e-5
      || Math.abs(node.rotation.z - t.rot.z) > 1e-5
    ) {
      node.rotation.copy(t.rot);
    }
    node.scale.copy(t.scale);
  }
}

/** Capture rest transforms of `root`'s own nodes by temporarily backing out any manual posed parts. */
export function captureRestNodeTransforms(
  root: T.Object3D,
  controller: {
    readonly capabilities?: { riggedParts?: readonly { name: string; mimic?: { part: string } }[] };
    getState(): { pose?: Record<string, number> };
    resetParts(): void;
    setPart(name: string, value: number): number;
  },
): NodeTransformSnapshot {
  const entries = Object.entries(controller.getState().pose ?? {});
  if (entries.length) controller.resetParts();
  const snap = captureOwnNodeTransforms(root);
  const parts = controller.capabilities?.riggedParts ?? [];
  const validNames = new Set(parts.map(p => p.name));
  const coupled = new Set(parts.filter(p => p.mimic && validNames.has(p.mimic.part)).map(p => p.name));
  for (const [p, v] of entries) {
    if (!coupled.has(p)) controller.setPart(p, v);
  }
  return snap;
}

function unprefixedNodeName(node: T.Object3D, prefix: string): string {
  if (typeof node.userData.localName === 'string') return node.userData.localName;
  return prefix && node.name.startsWith(prefix) ? node.name.slice(prefix.length) : node.name;
}

function isSyntheticSceneWrapper(node: T.Object3D, prefix: string): boolean {
  const base = unprefixedNodeName(node, prefix);
  return base === '' || base === 'Scene' || base === 'AuxScene';
}

/**
 * Determine whether an asset's canonical root is hidden in `hiddenSet`:
 * - With a live `object`, walks synthetic GLTFLoader `Scene`/`AuxScene` wrappers to check the real root node only
 *   (never guessing from an editable display `caps.name`, which may collide with a hidden child's name).
 * - In manifest-only (headless) mode, honors `caps.state?.rootHidden`, falling back to `caps.name` only when no
 *   collider explicitly binds that same name as a child node.
 */
export function isAssetRootHidden(
  caps: AssetCapabilities,
  hiddenSet: ReadonlySet<string>,
  object: T.Object3D | undefined,
  prefix = '',
  usingOverride = false,
): boolean {
  if (!hiddenSet.size) return false;
  if (object) {
    let cur: T.Object3D = object;
    for (;;) {
      if (cur.name && isHiddenPartName(hiddenSet, cur.name, prefix)) return true;
      if (typeof cur.userData.localName === 'string' && hiddenSet.has(cur.userData.localName)) return true;
      if (!isSyntheticSceneWrapper(cur, prefix)) break;
      const only = cur.children.length === 1 ? cur.children[0] : undefined;
      if (!only || only.userData.compositeSlot) break;
      cur = only;
    }
    return false;
  }
  if (!usingOverride && typeof caps.state?.rootHidden === 'boolean') return caps.state.rootHidden;
  if (!caps.name || !isHiddenPartName(hiddenSet, caps.name, prefix)) return false;
  const nameSet = new Set([caps.name]);
  return !caps.colliders?.some(c => Boolean(c.node && isHiddenPartName(nameSet, c.node, prefix)));
}

function r3(n: number): number {
  return Math.round((n + 1e-9) * 1000) / 1000 || 0;
}

export function splitTrackTargetAndProperty(
  trackName: string,
  knownNames: ReadonlySet<string>,
): { targetPart: string; propPart: string } | null {
  if (trackName.startsWith('.')) return { targetPart: '', propPart: trackName };
  // Prefer longest exact node-name prefix followed by `.` so names with dots (e.g. `Arm.L.position`) stay intact.
  let longestMatch = '';
  for (const name of knownNames) {
    if (name.length > longestMatch.length && trackName.startsWith(`${name}.`)) longestMatch = name;
  }
  if (longestMatch) {
    const propPart = trackName.slice(longestMatch.length);
    const parsedProp = T.PropertyBinding.parseTrackName(propPart) as { propertyName?: string };
    if (parsedProp.propertyName) return { targetPart: longestMatch, propPart };
  }
  const parsed = T.PropertyBinding.parseTrackName(trackName) as {
    objectName?: string;
    propertyName?: string;
  };
  let splitIdx = -1;
  if (parsed.objectName) splitIdx = trackName.lastIndexOf(`.${parsed.objectName}`);
  if (splitIdx <= 0 && parsed.propertyName) splitIdx = trackName.lastIndexOf(`.${parsed.propertyName}`);
  if (splitIdx <= 0) splitIdx = trackName.indexOf('.');
  if (splitIdx <= 0) return null;
  return { targetPart: trackName.slice(0, splitIdx), propPart: trackName.slice(splitIdx) };
}

function rewriteTrackName(
  trackName: string,
  childRoot: T.Object3D,
  prefix: string,
  renamedNames: ReadonlySet<string>,
  uuids: ReadonlySet<string>,
  nameToUuid: ReadonlyMap<string, string>,
): string {
  const split = splitTrackTargetAndProperty(trackName, renamedNames);
  if (!split) return trackName;
  const { targetPart, propPart } = split;
  if (!targetPart) {
    if (!prefix) return `${childRoot.uuid}${propPart}`;
    return childRoot.name ? `${childRoot.name}${propPart}` : trackName;
  }
  if (uuids.has(targetPart)) return trackName;

  const tokens = targetPart.split(/([/:])/);
  if (!prefix) {
    const leafToken = tokens[tokens.length - 1] ?? targetPart;
    const uuid = nameToUuid.get(leafToken) ?? nameToUuid.get(targetPart);
    return uuid ? `${uuid}${propPart}` : trackName;
  }

  const rewritten = tokens.map((tok, i) => (i % 2 === 0 && renamedNames.has(tok) ? `${prefix}${tok}` : tok));
  return `${rewritten.join('')}${propPart}`;
}

export function assertScopedLength(value: string, label: string): void {
  if (value.length > MAX_SCOPED_NAME_LEN) {
    throw new Error(
      `Scoped ${label} "${value}" (${String(value.length)} chars) exceeds maximum length of ${String(MAX_SCOPED_NAME_LEN)}.`,
    );
  }
}

/** Pure pre-flight length & track-binding check run BEFORE mutating caller input objects so rejected calls leave inputs intact. */
export function validateScopedLengths(
  childRoot: T.Object3D,
  childId: string,
  prefix: string,
  childCaps?: AssetCapabilities,
  outerClipPrefix = '',
): void {
  assertScopedLength(`Slot_${childId}`, 'slotNode');
  const originalNames = new Set<string>();
  childRoot.traverse(node => {
    if (node.name) {
      originalNames.add(node.name);
      assertScopedLength(prefix ? `${prefix}${node.name}` : node.name, 'node name');
    }
  });
  for (const clip of childRoot.animations) {
    assertScopedLength(`${outerClipPrefix}${childId}: ${clip.name}`, 'clip name');
  }
  childRoot.traverse(node => {
    for (const clip of node.animations) {
      for (const track of clip.tracks) {
        if (track.name.startsWith('.') && !childRoot.name) {
          assertScopedLength(prefix ? `${prefix}Root` : 'Root', 'node name');
        }
        // Fail fast on unparseable track bindings (e.g. a node name with no `.property`) before mutating any part.
        splitTrackTargetAndProperty(track.name, originalNames);
      }
    }
  });
  if (!prefix || !childCaps) return;
  for (const p of childCaps.riggedParts) assertScopedLength(`${prefix}${p.name}`, 'rigged part');
  for (const d of childCaps.detachableParts) assertScopedLength(`${prefix}${d.name}`, 'detachable part');
  const walkNested = (list: readonly CompositeChildSpec[]) => {
    for (const sub of list) {
      assertScopedLength(`${prefix}${sub.slotNode}`, 'slotNode');
      const nextPref = sub.nodePrefix ? `${prefix}${sub.nodePrefix}` : prefix;
      assertScopedLength(nextPref, 'nodePrefix');
      for (const p of sub.capabilities.riggedParts) assertScopedLength(`${nextPref}${p.name}`, 'rigged part');
      for (const d of sub.capabilities.detachableParts) assertScopedLength(`${nextPref}${d.name}`, 'detachable part');
      if (sub.capabilities.children?.length) walkNested(sub.capabilities.children);
    }
  };
  if (childCaps.children?.length) walkNested(childCaps.children);
}

function scopeNestedChildSpecs(children: CompositeChildSpec[], prefix: string): void {
  for (const sub of children) {
    sub.slotNode = `${prefix}${sub.slotNode}`;
    sub.nodePrefix = sub.nodePrefix ? `${prefix}${sub.nodePrefix}` : prefix;
    if (sub.capabilities.children?.length) scopeNestedChildSpecs(sub.capabilities.children, prefix);
  }
}

export function pickUniquePrefix(childRoot: T.Object3D, id: string, usedNames: ReadonlySet<string>): string {
  const candidateNames: string[] = [];
  childRoot.traverse(node => {
    if (node.name) candidateNames.push(node.name);
  });
  let attempt = 0;
  for (;;) {
    const prefix = attempt === 0 ? `${id}__` : `${id}__${String(attempt)}__`;
    const collides = candidateNames.some(name => usedNames.has(`${prefix}${name}`));
    if (!collides) return prefix;
    attempt++;
  }
}

export function findLegacyPhysicsOverride(root: T.Object3D): 'static' | 'dynamic' | undefined {
  let cur: T.Object3D = root;
  for (;;) {
    const raw: unknown = cur.userData.physicsBodyOverride;
    if (raw === 'static' || raw === 'dynamic') return raw;
    const only = cur.children.length === 1 ? cur.children[0] : undefined;
    if (!only || only.userData.compositeSlot) break;
    cur = only;
  }
  return undefined;
}

/** Measure `target`'s rest transform relative to `frameRoot`, preserving exact Matrix4 elements when sheared. */
export function measureRelativeTransform(frameRoot: T.Object3D, target: T.Object3D): CompositeRestTransform {
  frameRoot.updateMatrixWorld(true);
  target.updateMatrixWorld(true);
  const rel = frameRoot.matrixWorld.clone().invert().multiply(target.matrixWorld);
  const e = rel.elements;
  const c0 = new T.Vector3(e[0], e[1], e[2]);
  const c1 = new T.Vector3(e[4], e[5], e[6]);
  const c2 = new T.Vector3(e[8], e[9], e[10]);
  const n0 = c0.length() > 1e-9 ? c0.clone().normalize() : new T.Vector3(1, 0, 0);
  const n1 = c1.length() > 1e-9 ? c1.clone().normalize() : new T.Vector3(0, 1, 0);
  const n2 = c2.length() > 1e-9 ? c2.clone().normalize() : new T.Vector3(0, 0, 1);
  const sheared =
    Math.abs(n0.dot(n1)) > 1e-6 || Math.abs(n1.dot(n2)) > 1e-6 || Math.abs(n2.dot(n0)) > 1e-6;
  const pos = new T.Vector3();
  const quat = new T.Quaternion();
  const scale = new T.Vector3();
  rel.decompose(pos, quat, scale);
  const euler = new T.Euler().setFromQuaternion(quat, 'XYZ');
  const hasRot = Math.abs(euler.x) > 1e-5 || Math.abs(euler.y) > 1e-5 || Math.abs(euler.z) > 1e-5;
  const hasScale =
    Math.abs(scale.x - 1) > 1e-5 || Math.abs(scale.y - 1) > 1e-5 || Math.abs(scale.z - 1) > 1e-5;
  return {
    at: [r3(pos.x), r3(pos.y), r3(pos.z)],
    ...(hasRot ? { rotation: [r3(euler.x), r3(euler.y), r3(euler.z)] } : {}),
    ...(hasScale ? { scale: [r3(scale.x), r3(scale.y), r3(scale.z)] } : {}),
    ...(sheared ? { matrix: Array.from(e, v => Math.round(v * 1e6) / 1e6 || 0) } : {}),
  };
}

/**
 * Strip embedded manifests from a child subtree, clone all animation clips across the subtree so shared clones never
 * cross-mutate, and rewrite named nodes and non-UUID track bindings with `prefix` (or UUID when unscoped).
 */
export function scopeChildSubtree(
  childRoot: T.Object3D,
  childId: string,
  prefix: string,
  childCaps?: AssetCapabilities,
  outerClipPrefix = '',
): void {
  validateScopedLengths(childRoot, childId, prefix, childCaps, outerClipPrefix);

  const originalNames = new Set<string>();
  const uuids = new Set<string>();
  const nameToUuid = new Map<string, string>();
  let needsRootName = false;

  childRoot.traverse(node => {
    if (node.animations.length) node.animations = node.animations.map(clip => clip.clone());
  });
  for (const clip of childRoot.animations) {
    for (const track of clip.tracks) {
      if (track.name.startsWith('.')) needsRootName = true;
    }
  }
  if (needsRootName && !childRoot.name) childRoot.name = 'Root';

  childRoot.traverse(node => {
    node.userData.compositeChild = childId;
    if ('formFoundry' in node.userData) delete node.userData.formFoundry;
    uuids.add(node.uuid);
    if (!node.name) return;
    originalNames.add(node.name);
    if (!nameToUuid.has(node.name)) nameToUuid.set(node.name, node.uuid);
    if (node.userData.localName === undefined) node.userData.localName = node.name;
    if (prefix) node.name = `${prefix}${node.name}`;
  });

  childRoot.traverse(node => {
    for (const clip of node.animations) {
      for (const track of clip.tracks) {
        track.name = rewriteTrackName(track.name, childRoot, prefix, originalNames, uuids, nameToUuid);
      }
    }
  });

  if (prefix && childCaps?.children?.length) {
    scopeNestedChildSpecs(childCaps.children, prefix);
  }
}
