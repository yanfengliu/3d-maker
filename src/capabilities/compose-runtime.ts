import * as T from 'three';
import { parseRecipe, type Recipe } from '../data/recipe';
import { reseatCompositeSlot, scopeChildSubtree } from './compose';
import type { CompositeChildSpec } from './compose-schema';
import {
  computeCompositePhysics,
  disposeUnusedResources,
  findOwnNodeByName,
  measureCompositeLocalBox,
  registerLiveController,
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
  /** Rebuild one recipe-backed child with updated structural params while keeping sibling poses and re-seating dependent children. */
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
  mixer: T.AnimationMixer;
  actionsByClip: Map<string, T.AnimationAction>;
}

interface InternalCompositeOptions {
  skipRootWrite?: boolean;
  onChange?: () => void;
}

function r3(n: number): number {
  return Math.round((n + 1e-9) * 1000) / 1000 || 0;
}

function splitFirstSegment(scopedPath: string): [string, string] {
  const slash = scopedPath.indexOf('/');
  if (slash <= 0 || slash === scopedPath.length - 1) {
    throw new Error(`Expected scoped part path "<childId>/<partName>", got "${scopedPath}".`);
  }
  return [scopedPath.slice(0, slash), scopedPath.slice(slash + 1)];
}

function resolveAnimationPool(
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

function collectClipsForChild(
  pool: readonly T.AnimationClip[],
  childId: string,
  inner: T.Object3D,
): T.AnimationClip[] {
  if (inner.animations.length) return inner.animations;
  const clipPrefix = `${childId}: `;
  return pool
    .filter(clip => clip.name.startsWith(clipPrefix))
    .map(clip => {
      const copy = clip.clone();
      copy.name = clip.name.slice(clipPrefix.length);
      return copy;
    });
}

function createCompositeControllerInternal(
  root: T.Object3D,
  initialCapabilities: AssetCapabilities | undefined,
  externalAnimations: readonly T.AnimationClip[] | undefined,
  internalOptions?: InternalCompositeOptions,
): CompositeAssetController {
  let currentAnimPool: T.AnimationClip[] = [...resolveAnimationPool(root, externalAnimations)];
  const capabilities = structuredClone(
    initialCapabilities ?? readCapabilities(root) ?? inspectAsset(root, currentAnimPool),
  );
  const children = capabilities.children ?? [];
  if (!children.length) {
    throw new Error('Composite controller requires an asset with capabilities.children.');
  }

  let syncing = false;
  let initializing = true;
  const runtimes = new Map<string, ChildRuntime>();
  const onChildChange = () => {
    if (!initializing && !syncing) syncManifest();
  };

  for (const spec of children) {
    const slotObj = root.getObjectByName(spec.slotNode);
    if (!slotObj) {
      throw new Error(`Composite child "${spec.id}" is missing slot node "${spec.slotNode}".`);
    }
    const inner = slotObj.children[0] ?? slotObj;
    const childClips = collectClipsForChild(currentAnimPool, spec.id, inner);
    const controller = createAssetController(inner, spec.capabilities, spec.nodePrefix, {
      skipRootWrite: true,
      onChange: onChildChange,
    });
    const subComposite = spec.capabilities.children?.length
      ? createCompositeControllerInternal(inner, spec.capabilities, childClips, {
        skipRootWrite: true,
        onChange: onChildChange,
      })
      : undefined;
    const mixer = new T.AnimationMixer(inner);
    runtimes.set(spec.id, {
      spec,
      slot: slotObj,
      inner,
      controller,
      ...(subComposite ? { subComposite } : {}),
      mixer,
      actionsByClip: new Map(),
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
    const res = rest.includes('/')
      ? onNested(requireNested(childId), rest)
      : onLeaf(rt.controller, rest);
    if (syncAfter) syncManifest();
    return res;
  }

  function syncManifest(): AssetCapabilities {
    if (syncing) return structuredClone(capabilities);
    syncing = true;
    try {
      const updatedChildren: CompositeChildSpec[] = [];
      for (const rt of runtimes.values()) {
        rt.spec.capabilities = rt.subComposite
          ? rt.subComposite.syncManifest()
          : rt.controller.syncManifest();
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

  function refreshAggregateMetadata(): void {
    const overall = measureCompositeLocalBox(root);
    const size = overall.isEmpty() ? new T.Vector3(1, 1, 1) : overall.getSize(new T.Vector3());
    capabilities.dimensions = {
      sizeM: { x: r3(size.x), y: r3(size.y), z: r3(size.z) },
      originY: r3(overall.isEmpty() ? 0 : overall.min.y),
      origin: capabilities.dimensions?.origin ?? 'composite root frame',
    };
    const updatedChildren = [...runtimes.values()].map(rt => rt.spec);
    capabilities.physics = computeCompositePhysics(updatedChildren);
    if (currentAnimPool.length) {
      capabilities.clips = currentAnimPool.map(c => ({ name: c.name, duration: r3(c.duration) }));
    } else {
      delete capabilities.clips;
    }
  }

  const api: CompositeAssetController = {
    get capabilities() {
      return capabilities;
    },
    listChildren() {
      return [...runtimes.keys()];
    },
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
        refreshAggregateMetadata();
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

      // Build and validate replacement FIRST before detaching grandchildren or mutating the live scene!
      const dependentChildren: ChildRuntime[] = [];
      for (const other of runtimes.values()) {
        if (other.spec.mount.parent === childId) dependentChildren.push(other);
      }

      const rebuilt = buildRecipe(mergedRecipe);
      const freshCaps = inspectAsset(rebuilt);
      scopeChildSubtree(rebuilt, childId, rt.spec.nodePrefix ?? '', freshCaps);

      const resolvedHosts = new Map<string, T.Object3D>();
      for (const dep of dependentChildren) {
        if (dep.spec.mount.attachNode) {
          const hostNode = findOwnNodeByName(rebuilt, dep.spec.mount.attachNode, rt.spec.nodePrefix);
          if (!hostNode) {
            disposeUnusedResources(rebuilt, root);
            throw new Error(
              `Rebuild of "${childId}" removed attachNode "${dep.spec.mount.attachNode}" required by child "${dep.spec.id}".`,
            );
          }
          resolvedHosts.set(dep.spec.id, hostNode);
        } else {
          resolvedHosts.set(dep.spec.id, rebuilt);
        }
      }

      // Commit atomic swap: detach dependents, replace old inner, re-attach & re-seat, then dispose only unshared resources.
      for (const dep of dependentChildren) dep.slot.removeFromParent();
      const oldInner = rt.inner;
      rt.mixer.stopAllAction();
      rt.mixer.uncacheRoot(oldInner);
      rt.subComposite?.dispose();
      rt.controller.dispose();
      rt.slot.remove(oldInner);

      rt.slot.add(rebuilt);
      const hostRt = rt.spec.mount.parent ? runtimes.get(rt.spec.mount.parent) : undefined;
      reseatCompositeSlot(rt.slot, rebuilt, rt.spec.mount, hostRt?.spec.capabilities, hostRt?.inner);

      rt.inner = rebuilt;
      rt.spec.recipe = structuredClone(mergedRecipe) as unknown as Record<string, unknown>;
      rt.spec.capabilities = freshCaps;
      rt.controller = createAssetController(rebuilt, freshCaps, rt.spec.nodePrefix, {
        skipRootWrite: true,
        onChange: onChildChange,
      });
      rt.subComposite = freshCaps.children?.length
        ? createCompositeControllerInternal(rebuilt, freshCaps, rebuilt.animations, {
          skipRootWrite: true,
          onChange: onChildChange,
        })
        : undefined;
      rt.mixer = new T.AnimationMixer(rebuilt);
      rt.actionsByClip.clear();

      // Restore compatible interactive state on the rebuilt child (poses, hidden detachables, night, and decalText).
      for (const [part, val] of Object.entries(prevState.pose ?? {})) {
        if (freshCaps.riggedParts.some(p => p.name === part)) rt.controller.setPart(part, val);
      }
      for (const part of prevState.hiddenParts ?? []) {
        if (freshCaps.detachableParts.some(p => p.name === part)) rt.controller.setVisible(part, false);
      }
      if (prevState.night && freshCaps.nightZones.length) rt.controller.setNight(true);
      if (prevState.decalText && freshCaps.decals.length) {
        rt.controller.setDecalsVisible(prevDecalsVisible, prevState.decalText);
      }

      // Re-attach and re-seat every dependent child onto the rebuilt parent.
      for (const dep of dependentChildren) {
        const hostNode = resolvedHosts.get(dep.spec.id) ?? rebuilt;
        hostNode.add(dep.slot);
        reseatCompositeSlot(dep.slot, dep.inner, dep.spec.mount, freshCaps, rebuilt);
      }

      // Dispose only resources exclusively owned by oldInner (never resources shared with siblings or rebuilt geometry).
      disposeUnusedResources(oldInner, root);

      // Refresh root animations list and aggregate dimensions/physics/clips metadata.
      const clipPrefix = `${childId}: `;
      const updatedClips = [
        ...currentAnimPool.filter(c => !c.name.startsWith(clipPrefix)),
        ...rebuilt.animations.map(c => {
          const copy = c.clone();
          copy.name = `${clipPrefix}${c.name}`;
          return copy;
        }),
      ];
      currentAnimPool = updatedClips;
      root.animations = updatedClips;

      refreshAggregateMetadata();
      return syncManifest();
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
        const clips = collectClipsForChild(currentAnimPool, item.childId, rt.inner);
        const clipQuery = item.clip;
        const clip = typeof clipQuery === 'number'
          ? clips[clipQuery]
          : clips.find(c => c.name === clipQuery || c.name.toLowerCase() === clipQuery.toLowerCase());
        if (!clip) throw new Error(`Child "${item.childId}" has no animation clip matching "${String(item.clip)}".`);
        const prev = rt.actionsByClip.get(clip.name);
        if (prev) {
          prev.stop();
          rt.mixer.uncacheAction(prev.getClip(), rt.inner);
          rt.actionsByClip.delete(clip.name);
        }
        const action = rt.mixer.clipAction(clip);
        action.reset();
        action.setLoop(item.loop === false ? T.LoopOnce : T.LoopRepeat, item.loop === false ? 1 : Infinity);
        if (item.loop === false) action.clampWhenFinished = true;
        if (item.timeScale !== undefined) action.timeScale = item.timeScale;
        action.play();
        rt.actionsByClip.set(clip.name, action);
        started.push(action);
      }
      return started;
    },
    stopClips(childId) {
      if (childId) {
        if (childId.includes('/')) {
          const [head, rest] = splitFirstSegment(childId);
          requireNested(head).stopClips(rest);
          return;
        }
        const rt = requireChild(childId);
        rt.mixer.stopAllAction();
        rt.actionsByClip.clear();
        rt.subComposite?.stopClips();
        return;
      }
      for (const rt of runtimes.values()) {
        rt.mixer.stopAllAction();
        rt.actionsByClip.clear();
        rt.subComposite?.stopClips();
      }
    },
    update(deltaSeconds) {
      for (const rt of runtimes.values()) {
        if (rt.actionsByClip.size) rt.mixer.update(deltaSeconds);
        rt.subComposite?.update(deltaSeconds);
      }
    },
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
        rt.mixer.stopAllAction();
        rt.mixer.uncacheRoot(rt.inner);
        rt.actionsByClip.clear();
        rt.subComposite?.dispose();
        rt.controller.dispose();
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
