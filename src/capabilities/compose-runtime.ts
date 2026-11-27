import * as T from 'three';
import { parseRecipe, type Recipe } from '../data/recipe';
import { reseatCompositeSlot, scopeChildSubtree } from './compose';
import type { CompositeChildSpec } from './compose-schema';
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
  syncManifest(): AssetCapabilities;
  dispose(): void;
}

interface ChildRuntime {
  spec: CompositeChildSpec;
  slot: T.Object3D;
  inner: T.Object3D;
  controller: AssetController;
  mixer: T.AnimationMixer;
  actions: T.AnimationAction[];
}

function splitPath(scopedPath: string): [string, string] {
  const slash = scopedPath.indexOf('/');
  if (slash <= 0 || slash === scopedPath.length - 1) {
    throw new Error(`Expected scoped part path "<childId>/<partName>", got "${scopedPath}".`);
  }
  return [scopedPath.slice(0, slash), scopedPath.slice(slash + 1)];
}

function disposeObjectTree(node: T.Object3D): void {
  node.traverse(child => {
    if (!(child instanceof T.Mesh)) return;
    (child.geometry as T.BufferGeometry).dispose();
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of mats) (mat as T.Material).dispose();
  });
}

function collectClipsForChild(
  root: T.Object3D,
  childId: string,
  inner: T.Object3D,
): T.AnimationClip[] {
  if (inner.animations.length) return inner.animations;
  const clipPrefix = `${childId}: `;
  return root.animations
    .filter(clip => clip.name.startsWith(clipPrefix))
    .map(clip => {
      const copy = clip.clone();
      copy.name = clip.name.slice(clipPrefix.length);
      return copy;
    });
}

/**
 * Create a scoped multi-asset runtime controller for any composite asset (live-composed OR re-imported from GLB).
 * Drives each child's rigged parts, detachable parts, night zones, structural knobs, and concurrent AnimationMixers
 * independently with zero cross-child interference.
 */
export function createCompositeController(
  root: T.Object3D,
  initialCapabilities?: AssetCapabilities,
): CompositeAssetController {
  const capabilities = structuredClone(initialCapabilities ?? readCapabilities(root) ?? inspectAsset(root));
  const children = capabilities.children ?? [];
  if (!children.length) {
    throw new Error('Composite controller requires an asset with capabilities.children.');
  }

  const runtimes = new Map<string, ChildRuntime>();
  for (const spec of children) {
    const slotObj = root.getObjectByName(spec.slotNode);
    if (!slotObj) {
      throw new Error(`Composite child "${spec.id}" is missing slot node "${spec.slotNode}".`);
    }
    const inner = slotObj.children[0] ?? slotObj;
    const controller = createAssetController(inner, spec.capabilities, spec.nodePrefix);
    const mixer = new T.AnimationMixer(inner);
    runtimes.set(spec.id, { spec, slot: slotObj, inner, controller, mixer, actions: [] });
  }

  function requireChild(id: string): ChildRuntime {
    const rt = runtimes.get(id);
    if (!rt) throw new Error(`Composite "${capabilities.name}" has no child named "${id}".`);
    return rt;
  }

  function syncManifest(): AssetCapabilities {
    const updatedChildren: CompositeChildSpec[] = [];
    for (const rt of runtimes.values()) {
      rt.spec.capabilities = rt.controller.syncManifest();
      updatedChildren.push(rt.spec);
    }
    capabilities.children = updatedChildren;
    writeCapabilities(root, capabilities);
    return structuredClone(capabilities);
  }

  const api: CompositeAssetController = {
    get capabilities() {
      return capabilities;
    },
    listChildren() {
      return [...runtimes.keys()];
    },
    child(id) {
      return requireChild(id).controller;
    },
    getChildSpec(id) {
      const rt = runtimes.get(id);
      return rt ? structuredClone(rt.spec) : undefined;
    },
    getPart(scopedPath) {
      const [childId, partName] = splitPath(scopedPath);
      return requireChild(childId).controller.getPart(partName);
    },
    setPart(scopedPath, value) {
      const [childId, partName] = splitPath(scopedPath);
      const applied = requireChild(childId).controller.setPart(partName, value);
      syncManifest();
      return applied;
    },
    openPart(scopedPath) {
      const [childId, partName] = splitPath(scopedPath);
      const applied = requireChild(childId).controller.openPart(partName);
      syncManifest();
      return applied;
    },
    closePart(scopedPath) {
      const [childId, partName] = splitPath(scopedPath);
      const applied = requireChild(childId).controller.closePart(partName);
      syncManifest();
      return applied;
    },
    togglePart(scopedPath) {
      const [childId, partName] = splitPath(scopedPath);
      const applied = requireChild(childId).controller.togglePart(partName);
      syncManifest();
      return applied;
    },
    resetParts() {
      for (const rt of runtimes.values()) rt.controller.resetParts();
      syncManifest();
    },
    isVisible(scopedPath) {
      const [childId, partName] = splitPath(scopedPath);
      return requireChild(childId).controller.isVisible(partName);
    },
    setVisible(scopedPath, visible) {
      const [childId, partName] = splitPath(scopedPath);
      requireChild(childId).controller.setVisible(partName, visible);
      syncManifest();
    },
    setNight(on, childId) {
      if (childId) {
        requireChild(childId).controller.setNight(on);
      } else {
        for (const rt of runtimes.values()) {
          if (rt.controller.capabilities.nightZones.length) rt.controller.setNight(on);
        }
      }
      syncManifest();
    },
    setChildParams(childId, nextParams, buildRecipe) {
      const rt = requireChild(childId);
      if (!rt.spec.recipe) {
        throw new Error(`Composite child "${childId}" has no declarative recipe; structural knobs cannot be rebuilt.`);
      }
      const prevState = rt.controller.getState();
      const mergedRecipe = parseRecipe({
        ...rt.spec.recipe,
        params: { ...((rt.spec.recipe.params as ModelParamValues | undefined) ?? {}), ...nextParams },
      });

      // Detach any dependent grandchildren currently parented inside `rt.inner` before swapping geometry.
      const dependentChildren: ChildRuntime[] = [];
      for (const other of runtimes.values()) {
        if (other.spec.mount.parent === childId) {
          other.slot.removeFromParent();
          dependentChildren.push(other);
        }
      }

      const rebuilt = buildRecipe(mergedRecipe);
      const freshCaps = inspectAsset(rebuilt);
      if (rt.spec.nodePrefix) scopeChildSubtree(rebuilt, childId, rt.spec.nodePrefix);
      else rebuilt.userData.compositeChild = childId;

      rt.mixer.stopAllAction();
      rt.mixer.uncacheRoot(rt.inner);
      rt.controller.dispose();
      rt.slot.remove(rt.inner);
      disposeObjectTree(rt.inner);

      rt.slot.add(rebuilt);
      const hostCaps = rt.spec.mount.parent ? runtimes.get(rt.spec.mount.parent)?.spec.capabilities : undefined;
      reseatCompositeSlot(rt.slot, rebuilt, rt.spec.mount, hostCaps);

      rt.inner = rebuilt;
      rt.spec.recipe = structuredClone(mergedRecipe) as unknown as Record<string, unknown>;
      rt.spec.capabilities = freshCaps;
      rt.controller = createAssetController(rebuilt, freshCaps, rt.spec.nodePrefix);
      rt.mixer = new T.AnimationMixer(rebuilt);
      rt.actions = [];

      // Restore compatible interactive state on the rebuilt child.
      for (const [part, val] of Object.entries(prevState.pose ?? {})) {
        if (freshCaps.riggedParts.some(p => p.name === part)) rt.controller.setPart(part, val);
      }
      for (const part of prevState.hiddenParts ?? []) {
        if (freshCaps.detachableParts.some(p => p.name === part)) rt.controller.setVisible(part, false);
      }
      if (prevState.night && freshCaps.nightZones.length) rt.controller.setNight(true);

      // Re-attach and re-seat any children that depend on this rebuilt parent's surfaces or attachNodes.
      for (const dep of dependentChildren) {
        let hostNode: T.Object3D = rebuilt;
        if (dep.spec.mount.attachNode) {
          const prefixed = rt.spec.nodePrefix ? `${rt.spec.nodePrefix}${dep.spec.mount.attachNode}` : dep.spec.mount.attachNode;
          hostNode = rebuilt.getObjectByName(prefixed) ?? rebuilt.getObjectByName(dep.spec.mount.attachNode) ?? rebuilt;
        }
        reseatCompositeSlot(dep.slot, dep.inner, dep.spec.mount, freshCaps);
        hostNode.add(dep.slot);
      }

      // Refresh root animations list for this child cleanly.
      const clipPrefix = `${childId}: `;
      root.animations = [
        ...root.animations.filter(c => !c.name.startsWith(clipPrefix)),
        ...rebuilt.animations.map(c => {
          const copy = c.clone();
          copy.name = `${clipPrefix}${c.name}`;
          return copy;
        }),
      ];

      return syncManifest();
    },
    playClips(specs) {
      const started: T.AnimationAction[] = [];
      for (const item of specs) {
        const rt = requireChild(item.childId);
        const clips = collectClipsForChild(root, item.childId, rt.inner);
        const clipQuery = item.clip;
        const clip = typeof clipQuery === 'number'
          ? clips[clipQuery]
          : clips.find(c => c.name === clipQuery || c.name.toLowerCase() === clipQuery.toLowerCase());
        if (!clip) {
          throw new Error(`Child "${item.childId}" has no animation clip matching "${String(item.clip)}".`);
        }
        const action = rt.mixer.clipAction(clip);
        action.reset();
        action.setLoop(item.loop === false ? T.LoopOnce : T.LoopRepeat, item.loop === false ? 1 : Infinity);
        if (item.loop === false) action.clampWhenFinished = true;
        if (item.timeScale !== undefined) action.timeScale = item.timeScale;
        action.play();
        rt.actions.push(action);
        started.push(action);
      }
      return started;
    },
    stopClips(childId) {
      if (childId) {
        const rt = requireChild(childId);
        rt.mixer.stopAllAction();
        rt.actions = [];
        return;
      }
      for (const rt of runtimes.values()) {
        rt.mixer.stopAllAction();
        rt.actions = [];
      }
    },
    update(deltaSeconds) {
      for (const rt of runtimes.values()) {
        if (rt.actions.length) rt.mixer.update(deltaSeconds);
      }
    },
    syncManifest,
    dispose() {
      for (const rt of runtimes.values()) {
        rt.mixer.stopAllAction();
        rt.mixer.uncacheRoot(rt.inner);
        rt.controller.dispose();
      }
    },
  };

  syncManifest();
  return api;
}
