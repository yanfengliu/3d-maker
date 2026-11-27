import * as T from 'three';
import { parseRecipe, type Recipe } from '../data/recipe';
import { measureRelativeTransform, pickUniquePrefix, reseatCompositeSlot, scopeChildSubtree } from './compose';
import { findLegacyPhysicsOverride } from './compose-scope';
import type { CompositeChildSpec, CompositeRestTransform } from './compose-schema';
import {
  collectClipsForChild,
  collectNodeNamesExcluding,
  computeCompositePhysics,
  disposeUnusedResources,
  findOwnNodeByName,
  measureCompositeLocalBox,
  registerLiveController,
  resolveAnimationPool,
  restoreCompatibleChildState,
  splitFirstSegment,
  unregisterLiveController,
} from './compose-tree';
import type { ModelParamValues } from './param-schema';
import { createAssetController, inspectAsset, type AssetController } from './runtime';
import { readCapabilities, writeCapabilities, type AssetCapabilities } from './schema';

export interface PlayChildClipSpec {
  childId: string;
  clip: string | number;
  loop?: boolean;
  timeScale?: number;
}

export interface CompositeAssetController {
  readonly capabilities: AssetCapabilities;
  listChildren(): string[];
  child(id: string): AssetController;
  childComposite(id: string): CompositeAssetController | undefined;
  getChildSpec(id: string): CompositeChildSpec | undefined;
  getPart(scopedPath: string): number;
  setPart(scopedPath: string, value: number): number;
  openPart(scopedPath: string): number;
  closePart(scopedPath: string): number;
  togglePart(scopedPath: string): number;
  resetParts(): void;
  isVisible(scopedPath: string): boolean;
  setVisible(scopedPath: string, visible: boolean): void;
  setNight(on: boolean, childId?: string): void;
  /** Rebuild one recipe-backed child atomically with updated structural params, keeping siblings intact and re-seating dependents. */
  setChildParams(
    childId: string,
    params: ModelParamValues,
    buildRecipe: (recipe: Recipe) => T.Group,
  ): AssetCapabilities;
  /** Start one or more child animation clips concurrently without interfering with other children or manual poses on separate nodes. */
  playClips(specs: readonly PlayChildClipSpec[]): T.AnimationAction[];
  stopClips(childId?: string): void;
  /** Advance all active concurrent child AnimationMixers by `deltaSeconds`. */
  update(deltaSeconds: number): void;
  /** Return a cloned snapshot of this composite's current animation pool (used by GLB re-export). */
  getAnimations(): T.AnimationClip[];
  /** Re-apply authoritative rigged part poses onto a cloned export graph so live mixers never bake stale frames as rest pose. */
  applyPoseToClone(cloneRoot: T.Object3D): void;
  syncManifest(): AssetCapabilities;
  dispose(): void;
}

interface ChildRuntime {
  spec: CompositeChildSpec;
  slot: T.Object3D;
  inner: T.Object3D;
  controller: AssetController;
  subComposite?: CompositeAssetController | undefined;
  clips: T.AnimationClip[];
  mixer: T.AnimationMixer;
  actionsByClip: Map<T.AnimationClip, T.AnimationAction>;
}

interface InternalCompositeOptions {
  skipRootWrite?: boolean;
  onChange?: () => void;
  onRebuild?: () => void;
  retentionRoot?: T.Object3D;
  outerClipPrefix?: string;
}

function r3(n: number): number {
  return Math.round((n + 1e-9) * 1000) / 1000 || 0;
}

function createCompositeControllerInternal(
  root: T.Object3D,
  initialCapabilities: AssetCapabilities | undefined,
  externalAnimations: readonly T.AnimationClip[] | undefined,
  internalOptions?: InternalCompositeOptions,
): CompositeAssetController {
  const retentionRoot = internalOptions?.retentionRoot ?? root;
  const outerClipPrefix = internalOptions?.outerClipPrefix ?? '';
  let currentAnimPool: T.AnimationClip[] = [...resolveAnimationPool(root, externalAnimations)];
  const capabilities = structuredClone(
    initialCapabilities ?? readCapabilities(root) ?? inspectAsset(root, currentAnimPool),
  );
  const children = capabilities.children ?? [];
  if (!children.length) {
    throw new Error('Composite controller requires an asset with capabilities.children.');
  }

  const explicitPhysicsBody: 'static' | 'dynamic' | undefined = capabilities.physics?.locked
    ? capabilities.physics.body
    : findLegacyPhysicsOverride(root);
  if (explicitPhysicsBody && capabilities.physics) {
    capabilities.physics = { ...capabilities.physics, body: explicitPhysicsBody, locked: true };
  }

  let syncing = false;
  let staging = false;
  let initializing = true;
  const runtimes = new Map<string, ChildRuntime>();
  const onChildChange = () => {
    if (!initializing && !syncing && !staging) syncManifest();
  };

  function reseatAndRecordRest(
    rt: ChildRuntime,
    hostRt: ChildRuntime | undefined,
    includeNested: boolean,
    depSlots?: ReadonlySet<T.Object3D>,
  ): void {
    if (!hostRt) {
      reseatCompositeSlot(rt.slot, rt.inner, rt.spec.mount, undefined, undefined, includeNested, depSlots);
      return;
    }
    const hostPose = hostRt.controller.getState().pose;
    const entries = hostPose ? Object.entries(hostPose) : [];
    const prevStaging = staging;
    if (entries.length) staging = true;
    try {
      if (entries.length) hostRt.controller.resetParts();
      reseatCompositeSlot(rt.slot, rt.inner, rt.spec.mount, hostRt.spec.capabilities, hostRt.inner, includeNested, depSlots);
      rt.spec.mount.slotRestPose = measureRelativeTransform(hostRt.inner, rt.slot);
    } finally {
      for (const [p, v] of entries) hostRt.controller.setPart(p, v);
      staging = prevStaging;
    }
  }

  function handleNestedChildRebuild(childId: string): void {
    const rt = runtimes.get(childId);
    if (!rt?.subComposite) return;
    rt.mixer.stopAllAction();
    rt.mixer.uncacheRoot(rt.inner);
    rt.actionsByClip.clear();
    rt.clips = rt.subComposite.getAnimations();
    replaceChildClipsInPool(childId, rt.clips);
    const hostRt = rt.spec.mount.parent ? runtimes.get(rt.spec.mount.parent) : undefined;
    const depSlots = new Set<T.Object3D>();
    for (const other of runtimes.values()) if (other.spec.mount.parent === childId) depSlots.add(other.slot);
    reseatAndRecordRest(rt, hostRt, true, depSlots);
    refreshAggregateMetadata();
    syncManifest();
    internalOptions?.onRebuild?.();
  }

  for (const spec of children) {
    const slotObj = root.getObjectByName(spec.slotNode);
    if (!slotObj) throw new Error(`Composite child "${spec.id}" is missing slot node "${spec.slotNode}".`);
    const inner = slotObj.children[0] ?? slotObj;
    const childClips = collectClipsForChild(currentAnimPool, spec.id, inner);
    const controller = createAssetController(inner, spec.capabilities, spec.nodePrefix, { skipRootWrite: true, onChange: onChildChange });
    const subComposite = spec.capabilities.children?.length
      ? createCompositeControllerInternal(inner, spec.capabilities, childClips, {
        skipRootWrite: true, onChange: onChildChange, onRebuild: () => { handleNestedChildRebuild(spec.id); },
        retentionRoot, outerClipPrefix: `${outerClipPrefix}${spec.id}: `,
      })
      : undefined;
    runtimes.set(spec.id, {
      spec, slot: slotObj, inner, controller, ...(subComposite ? { subComposite } : {}),
      clips: childClips, mixer: new T.AnimationMixer(inner), actionsByClip: new Map(),
    });
  }

  function requireChild(id: string): ChildRuntime {
    const rt = runtimes.get(id);
    if (!rt) throw new Error(`Composite "${capabilities.name}" has no child named "${id}".`);
    return rt;
  }

  function requireNested(id: string): CompositeAssetController {
    const sub = requireChild(id).subComposite;
    if (!sub) throw new Error(`Composite child "${id}" has no nested children.`);
    return sub;
  }

  function routePart<R>(
    scopedPath: string,
    onLeaf: (ctrl: AssetController, part: string) => R,
    onNested: (sub: CompositeAssetController, rest: string) => R,
    syncAfter: boolean,
  ): R {
    const [childId, rest] = splitFirstSegment(scopedPath);
    const rt = requireChild(childId);
    const res = rest.includes('/') ? onNested(requireNested(childId), rest) : onLeaf(rt.controller, rest);
    if (syncAfter) syncManifest();
    return res;
  }

  function syncManifest(): AssetCapabilities {
    if (syncing) return structuredClone(capabilities);
    syncing = true;
    try {
      const updatedChildren: CompositeChildSpec[] = [];
      for (const rt of runtimes.values()) {
        rt.spec.capabilities = rt.subComposite ? rt.subComposite.syncManifest() : rt.controller.syncManifest();
        updatedChildren.push(rt.spec);
      }
      capabilities.children = updatedChildren;
      if (!internalOptions?.skipRootWrite) writeCapabilities(root, capabilities);
      if (!initializing) internalOptions?.onChange?.();
      return structuredClone(capabilities);
    } finally {
      syncing = false;
    }
  }

  function replaceChildClipsInPool(childId: string, nextChildClips: readonly T.AnimationClip[]): void {
    const colonPrefix = `${childId}: `;
    const slashPrefix = `${childId}/`;
    currentAnimPool = [
      ...currentAnimPool.filter(c => !c.name.startsWith(colonPrefix) && !c.name.startsWith(slashPrefix)),
      ...nextChildClips.map(c => {
        const copy = c.clone();
        copy.name = `${colonPrefix}${c.name}`;
        return copy;
      }),
    ];
    root.animations = currentAnimPool;
  }

  function refreshAggregateMetadata(): void {
    const overall = measureCompositeLocalBox(root);
    const size = overall.isEmpty() ? new T.Vector3(1, 1, 1) : overall.getSize(new T.Vector3());
    capabilities.dimensions = {
      sizeM: { x: r3(size.x), y: r3(size.y), z: r3(size.z) },
      originY: r3(overall.isEmpty() ? 0 : overall.min.y),
      origin: capabilities.dimensions?.origin ?? 'composite root frame',
    };
    const updatedChildren = [...runtimes.values()].map(rt => rt.spec);
    capabilities.physics = computeCompositePhysics(updatedChildren, explicitPhysicsBody);
    if (currentAnimPool.length) {
      capabilities.clips = currentAnimPool.map(c => ({ name: c.name, duration: r3(c.duration) }));
    } else delete capabilities.clips;
  }

  const api: CompositeAssetController = {
    get capabilities() { return capabilities; },
    listChildren: () => [...runtimes.keys()],
    child(id) {
      if (!id.includes('/')) return requireChild(id).controller;
      const [head, rest] = splitFirstSegment(id);
      return requireNested(head).child(rest);
    },
    childComposite(id) {
      if (!id.includes('/')) return runtimes.get(id)?.subComposite;
      const [head, rest] = splitFirstSegment(id);
      return requireChild(head).subComposite?.childComposite(rest);
    },
    getChildSpec(id) {
      if (!id.includes('/')) {
        const rt = runtimes.get(id);
        return rt ? structuredClone(rt.spec) : undefined;
      }
      const [head, rest] = splitFirstSegment(id);
      return runtimes.get(head)?.subComposite?.getChildSpec(rest);
    },
    getPart: path => routePart(path, (c, p) => c.getPart(p), (s, r) => s.getPart(r), false),
    setPart: (path, val) => routePart(path, (c, p) => c.setPart(p, val), (s, r) => s.setPart(r, val), true),
    openPart: path => routePart(path, (c, p) => c.openPart(p), (s, r) => s.openPart(r), true),
    closePart: path => routePart(path, (c, p) => c.closePart(p), (s, r) => s.closePart(r), true),
    togglePart: path => routePart(path, (c, p) => c.togglePart(p), (s, r) => s.togglePart(r), true),
    resetParts() {
      for (const rt of runtimes.values()) {
        if (rt.subComposite) rt.subComposite.resetParts();
        else rt.controller.resetParts();
      }
      syncManifest();
    },
    isVisible: path => routePart(path, (c, p) => c.isVisible(p), (s, r) => s.isVisible(r), false),
    setVisible: (path, vis) => { routePart(path, (c, p) => { c.setVisible(p, vis); }, (s, r) => { s.setVisible(r, vis); }, true); },
    setNight(on, childId) {
      if (childId) {
        if (childId.includes('/')) {
          const [head, rest] = splitFirstSegment(childId);
          requireNested(head).setNight(on, rest);
        } else {
          const rt = requireChild(childId);
          if (rt.subComposite) rt.subComposite.setNight(on);
          else rt.controller.setNight(on);
        }
      } else {
        for (const rt of runtimes.values()) {
          if (rt.subComposite) rt.subComposite.setNight(on);
          else if (rt.controller.capabilities.nightZones.length) rt.controller.setNight(on);
        }
      }
      syncManifest();
    },
    setChildParams(childId, nextParams, buildRecipe) {
      if (childId.includes('/')) {
        const [head, rest] = splitFirstSegment(childId);
        requireNested(head).setChildParams(rest, nextParams, buildRecipe);
        return syncManifest();
      }

      const rt = requireChild(childId);
      if (!rt.spec.recipe) {
        throw new Error(`Composite child "${childId}" has no declarative recipe; structural knobs cannot be rebuilt.`);
      }
      const prevState = rt.controller.getState();
      const prevDecalsVisible = rt.controller.areDecalsVisible();
      const mergedRecipe = parseRecipe({
        ...rt.spec.recipe,
        params: { ...((rt.spec.recipe.params as ModelParamValues | undefined) ?? {}), ...nextParams },
      });

      const dependentChildren: ChildRuntime[] = [];
      for (const other of runtimes.values()) {
        if (other.spec.mount.parent === childId) dependentChildren.push(other);
      }
      const depSlotSet = new Set(dependentChildren.map(d => d.slot));

      // Stage 1 (pure preparation with `staging = true` so ZERO live callbacks or manifest mutations occur on failure).
      const rebuilt = buildRecipe(mergedRecipe);
      const freshCaps = inspectAsset(rebuilt);
      const otherNames = collectNodeNamesExcluding(retentionRoot, rt.inner, depSlotSet);
      let nextPrefix = rt.spec.nodePrefix;
      if (nextPrefix) {
        const rebuiltNames: string[] = [];
        rebuilt.traverse(node => { if (node.name) rebuiltNames.push(node.name); });
        if (rebuiltNames.some(name => otherNames.has(`${nextPrefix ?? ''}${name}`))) {
          nextPrefix = pickUniquePrefix(rebuilt, childId, otherNames);
        }
      }

      const resolvedHosts = new Map<string, T.Object3D>();
      const attachRestPoses = new Map<string, CompositeRestTransform>();
      let nextController: AssetController | undefined;
      let nextSubComposite: CompositeAssetController | undefined;
      staging = true;
      try {
        scopeChildSubtree(rebuilt, childId, nextPrefix ?? '', freshCaps, outerClipPrefix);
        for (const dep of dependentChildren) {
          if (dep.spec.mount.surface && !freshCaps.surfaces?.some(s => s.name === dep.spec.mount.surface)) {
            throw new Error(`Rebuild of "${childId}" removed surface "${dep.spec.mount.surface}" required by child "${dep.spec.id}".`);
          }
          if (dep.spec.mount.attachNode) {
            const hostNode = findOwnNodeByName(rebuilt, dep.spec.mount.attachNode, nextPrefix);
            if (!hostNode) throw new Error(`Rebuild of "${childId}" removed attachNode "${dep.spec.mount.attachNode}" required by child "${dep.spec.id}".`);
            resolvedHosts.set(dep.spec.id, hostNode);
            // Measure attachNode rest transform BEFORE restoring any posed state on rebuilt!
            attachRestPoses.set(dep.spec.id, measureRelativeTransform(rebuilt, hostNode));
          } else resolvedHosts.set(dep.spec.id, rebuilt);
        }
        nextController = createAssetController(rebuilt, freshCaps, nextPrefix, { skipRootWrite: true, onChange: onChildChange });
        if (freshCaps.children?.length) {
          nextSubComposite = createCompositeControllerInternal(rebuilt, freshCaps, rebuilt.animations, {
            skipRootWrite: true, onChange: onChildChange, onRebuild: () => { handleNestedChildRebuild(childId); },
            retentionRoot, outerClipPrefix: `${outerClipPrefix}${childId}: `,
          });
        }
      } catch (err) {
        nextSubComposite?.dispose();
        nextController?.dispose();
        disposeUnusedResources(rebuilt, retentionRoot);
        throw err;
      } finally { staging = false; }

      // Stage 2 (infallible atomic commit): swap oldInner -> rebuilt, attach & seat dependents at rest to capture exact
      // slotRestPose, then apply compatible restored pose/visibility/night/decals.
      for (const dep of dependentChildren) dep.slot.removeFromParent();
      const oldInner = rt.inner;
      rt.mixer.stopAllAction();
      rt.mixer.uncacheRoot(oldInner);
      rt.subComposite?.dispose();
      rt.controller.dispose();
      rt.slot.remove(oldInner);

      rt.slot.add(rebuilt);
      rt.inner = rebuilt;
      const hostRt = rt.spec.mount.parent ? runtimes.get(rt.spec.mount.parent) : undefined;
      reseatAndRecordRest(rt, hostRt, Boolean(freshCaps.children?.length));
      if (nextPrefix) rt.spec.nodePrefix = nextPrefix;
      rt.spec.recipe = structuredClone(mergedRecipe) as unknown as Record<string, unknown>;
      rt.spec.capabilities = freshCaps;
      rt.controller = nextController;
      rt.subComposite = nextSubComposite;
      rt.clips = [...rebuilt.animations];
      rt.mixer = new T.AnimationMixer(rebuilt);
      rt.actionsByClip.clear();

      for (const dep of dependentChildren) {
        const hostNode = resolvedHosts.get(dep.spec.id) ?? rebuilt;
        const measuredAttach = attachRestPoses.get(dep.spec.id);
        if (measuredAttach) dep.spec.mount.attachRestPose = measuredAttach;
        hostNode.add(dep.slot);
        reseatCompositeSlot(dep.slot, dep.inner, dep.spec.mount, freshCaps, rebuilt, Boolean(dep.spec.capabilities.children?.length));
        dep.spec.mount.slotRestPose = measureRelativeTransform(rebuilt, dep.slot);
      }

      staging = true;
      try {
        restoreCompatibleChildState(nextController, rebuilt, nextPrefix, freshCaps, prevState, prevDecalsVisible);
      } finally {
        staging = false;
      }

      disposeUnusedResources(oldInner, retentionRoot);
      replaceChildClipsInPool(childId, rebuilt.animations);
      refreshAggregateMetadata();
      const snap = syncManifest();
      internalOptions?.onRebuild?.();
      return snap;
    },
    playClips(specs) {
      const started: T.AnimationAction[] = [];
      for (const item of specs) {
        if (item.childId.includes('/')) {
          const [head, rest] = splitFirstSegment(item.childId);
          started.push(...requireNested(head).playClips([{ ...item, childId: rest }]));
          continue;
        }
        const rt = requireChild(item.childId);
        const clipQuery = item.clip;
        const clip = typeof clipQuery === 'number'
          ? rt.clips[clipQuery]
          : rt.clips.find(c => c.name === clipQuery || c.name.toLowerCase() === clipQuery.toLowerCase());
        if (!clip) throw new Error(`Child "${item.childId}" has no animation clip matching "${String(item.clip)}".`);
        const prev = rt.actionsByClip.get(clip);
        if (prev) {
          prev.stop();
          rt.actionsByClip.delete(clip);
        }
        const action = rt.mixer.clipAction(clip);
        action.reset();
        action.setLoop(item.loop === false ? T.LoopOnce : T.LoopRepeat, item.loop === false ? 1 : Infinity);
        action.clampWhenFinished = item.loop === false;
        action.timeScale = item.timeScale ?? 1;
        action.play();
        rt.actionsByClip.set(clip, action);
        started.push(action);
      }
      return started;
    },
    stopClips(childId) {
      if (childId) {
        if (childId.includes('/')) { const [head, rest] = splitFirstSegment(childId); requireNested(head).stopClips(rest); return; }
        const rt = requireChild(childId);
        rt.mixer.stopAllAction(); rt.actionsByClip.clear(); rt.subComposite?.stopClips();
        return;
      }
      for (const rt of runtimes.values()) { rt.mixer.stopAllAction(); rt.actionsByClip.clear(); rt.subComposite?.stopClips(); }
    },
    update(deltaSeconds) {
      for (const rt of runtimes.values()) { if (rt.actionsByClip.size) rt.mixer.update(deltaSeconds); rt.subComposite?.update(deltaSeconds); }
    },
    getAnimations: () => currentAnimPool.map(clip => clip.clone()),
    applyPoseToClone(cloneRoot) {
      for (const rt of runtimes.values()) {
        const clonedSlot = cloneRoot.getObjectByName(rt.spec.slotNode);
        if (!clonedSlot) continue;
        const clonedInner = clonedSlot.children[0] ?? clonedSlot;
        if (rt.subComposite) rt.subComposite.applyPoseToClone(clonedInner);
        else rt.controller.applyPoseToClone(clonedInner);
      }
    },
    syncManifest,
    dispose() {
      for (const rt of runtimes.values()) {
        rt.mixer.stopAllAction(); rt.mixer.uncacheRoot(rt.inner); rt.actionsByClip.clear();
        rt.subComposite?.dispose(); rt.controller.dispose();
      }
      if (!internalOptions?.skipRootWrite) unregisterLiveController(root, api);
    },
  };

  syncManifest();
  initializing = false;
  if (!internalOptions?.skipRootWrite) registerLiveController(root, api);
  return api;
}

/**
 * Create a scoped multi-asset runtime controller for any composite asset (live-composed OR re-imported from GLB).
 * Pass `gltf.animations` as the optional third argument when loading from `GLTFLoader` so child clips stay playable
 * without mutating `gltf.scene.animations`.
 */
export function createCompositeController(
  root: T.Object3D,
  initialCapabilities?: AssetCapabilities,
  animations?: readonly T.AnimationClip[],
): CompositeAssetController {
  return createCompositeControllerInternal(root, initialCapabilities, animations);
}
