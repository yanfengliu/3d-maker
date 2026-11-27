import * as T from 'three';
import {
  findOwnNodeByName,
  registerLiveController,
  registerRiggedRestPose,
  unregisterLiveController,
} from './compose-tree';
import { buildDecalMesh, buildNightOverlays, type DecalOverlay } from './overlays';
import {
  readCapabilities,
  readEmbeddedDecals,
  writeCapabilities,
  type AssetCapabilities,
  type AssetRuntimeState,
  type Axis,
  type RiggedPartSpec,
} from './schema';

interface PartBinding {
  spec: RiggedPartSpec;
  node: T.Object3D;
  restQuaternion: T.Quaternion;
  restPosition: T.Vector3;
  value: number;
}

export interface AssetController {
  readonly capabilities: AssetCapabilities;
  getState(): AssetRuntimeState;
  getPart(name: string): number;
  setPart(name: string, value: number): number;
  openPart(name: string): number;
  closePart(name: string): number;
  togglePart(name: string): number;
  resetParts(): void;
  isVisible(name: string): boolean;
  setVisible(name: string, visible: boolean): void;
  resetVisibility(): void;
  isNight(): boolean;
  setNight(on: boolean): void;
  refreshNightOverlays(): void;
  setDecalsVisible(on: boolean, labels?: Record<string, string>): void;
  areDecalsVisible(): boolean;
  applyPoseToClone(cloneRoot: T.Object3D): void;
  syncManifest(): AssetCapabilities;
  dispose(): void;
}

const synthesizedClips = new WeakSet<T.AnimationClip>();

export function isSynthesizedClip(clip: T.AnimationClip): boolean {
  return synthesizedClips.has(clip);
}

export function markSynthesizedClip(clip: T.AnimationClip): T.AnimationClip {
  synthesizedClips.add(clip);
  return clip;
}

function axisVector(axis: Axis): T.Vector3 {
  return axis === 'x' ? new T.Vector3(1, 0, 0) : axis === 'y' ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1);
}

export function farRangeEnd(range: [number, number]): number {
  return Math.abs(range[1]) >= Math.abs(range[0]) ? range[1] : range[0];
}

export function clampToRange(range: [number, number], value: number): number {
  const min = Math.min(range[0], range[1]);
  const max = Math.max(range[0], range[1]);
  return Math.min(max, Math.max(min, value));
}

function measureDimensions(root: T.Object3D) {
  root.updateMatrixWorld(true);
  const box = new T.Box3();
  const vertex = new T.Vector3();
  root.traverse(node => {
    if (node.userData.studioOverlay || !(node instanceof T.Mesh)) return;
    const geometry = node.geometry as T.BufferGeometry;
    const pos = geometry.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    if (!pos || !pos.count) return;
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i).applyMatrix4(node.matrixWorld);
      box.expandByPoint(vertex);
    }
  });
  if (box.isEmpty()) return undefined;
  const size = box.getSize(new T.Vector3());
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    sizeM: { x: round(size.x), y: round(size.y), z: round(size.z) },
    originY: round(box.min.y),
  };
}

function describeClips(
  clips: readonly T.AnimationClip[],
  existing?: readonly { name: string; duration: number; synthesized?: boolean }[],
): { name: string; duration: number; synthesized?: boolean }[] {
  const synthNames = new Set(existing?.filter(c => c.synthesized).map(c => c.name));
  return clips.map(clip => {
    const synthesized = isSynthesizedClip(clip) || synthNames.has(clip.name);
    return {
      name: clip.name,
      duration: Math.round(clip.duration * 1000) / 1000,
      ...(synthesized ? { synthesized: true } : {}),
    };
  });
}

/** Inspect any Three.js Group (Form Foundry original, PolyFork import, or exported GLB) for AI/game capabilities. */
export function inspectAsset(root: T.Object3D, animations?: readonly T.AnimationClip[]): AssetCapabilities {
  const existing = readCapabilities(root);
  const sourceClips = animations?.length ? animations : root.animations;
  const clips = sourceClips.length ? describeClips(sourceClips, existing?.clips) : existing?.clips;
  if (existing) {
    return {
      ...structuredClone(existing),
      ...(clips?.length ? { clips } : {}),
    };
  }
  const decals = readEmbeddedDecals(root);
  const dimensions = measureDimensions(root);
  const studioName = typeof root.userData.studioName === 'string' ? root.userData.studioName : '';
  return {
    version: 1,
    name: studioName || root.name || 'Asset',
    riggedParts: [],
    detachableParts: [],
    nightZones: [],
    decals,
    ...(dimensions ? { dimensions } : {}),
    ...(clips?.length ? { clips } : {}),
  };
}

/** Synthesize standard glTF-compatible AnimationClips for every rigged part (relative to quaternion rest pose). */
export function synthesizeRigClips(
  root: T.Object3D,
  capabilities?: AssetCapabilities,
  nodePrefix?: string,
  exportRoot?: T.Object3D,
): T.AnimationClip[] {
  const caps = capabilities ?? inspectAsset(root);
  const prefix = nodePrefix ?? '';
  const clips: T.AnimationClip[] = [];
  for (const part of caps.riggedParts) {
    const node = findOwnNodeByName(root, part.name, prefix);
    if (!node) continue;
    const candidateName = node.name || (prefix ? `${prefix}${part.name}` : part.name);
    // When unscoped duplicate node names exist in an export graph, bind by UUID so GLTFExporter targets this exact sibling.
    const trackNode = exportRoot && exportRoot.getObjectByName(candidateName) !== node
      ? node.uuid
      : candidateName;
    const current = caps.state?.pose?.[part.name] ?? 0;
    const far = farRangeEnd(part.range);
    if (part.type === 'slide') {
      const rest = node.position.clone();
      rest[part.axis] -= current;
      const moved = rest.clone();
      moved[part.axis] += far;
      const track = new T.VectorKeyframeTrack(
        trackNode + '.position',
        [0, 0.9, 1.5, 2.4],
        [rest.x, rest.y, rest.z, moved.x, moved.y, moved.z, moved.x, moved.y, moved.z, rest.x, rest.y, rest.z],
      );
      clips.push(markSynthesizedClip(new T.AnimationClip('Operate ' + part.label.toLowerCase(), 2.4, [track])));
      continue;
    }
    const axisVec = axisVector(part.axis);
    const restQuat = node.quaternion.clone()
      .multiply(new T.Quaternion().setFromAxisAngle(axisVec, -T.MathUtils.degToRad(current)))
      .normalize();
    const times: number[] = [];
    const values: number[] = [];
    const pushAngle = (t: number, deg: number) => {
      const q = restQuat.clone().multiply(new T.Quaternion().setFromAxisAngle(axisVec, T.MathUtils.degToRad(deg))).normalize();
      times.push(t);
      values.push(q.x, q.y, q.z, q.w);
    };
    if (Math.abs(far) >= 359) {
      // Full-rotation rotor/wheel/dish: sample 8 steps per turn so SLERP rotates smoothly instead of taking a 0-deg shortcut.
      const steps = Math.max(8, Math.ceil(Math.abs(far) / 45));
      for (let i = 0; i <= steps; i++) pushAngle((i / steps) * 2.4, (far * i) / steps);
    } else {
      const steps = Math.max(1, Math.ceil(Math.abs(far) / 45));
      for (let i = 0; i <= steps; i++) pushAngle((i / steps) * 0.9, (far * i) / steps);
      pushAngle(1.5, far);
      for (let i = 1; i <= steps; i++) pushAngle(1.5 + (i / steps) * 0.9, far * (1 - i / steps));
    }
    const track = new T.QuaternionKeyframeTrack(trackNode + '.quaternion', times, values);
    const verb = /door|gate|lid|hatch|window|drawer/i.test(part.name + ' ' + (part.describe ?? '')) ? 'Open ' : 'Move ';
    clips.push(markSynthesizedClip(new T.AnimationClip(verb + part.label.toLowerCase(), 2.4, [track])));
  }
  return clips;
}

export interface AssetControllerInternalOptions {
  skipRootWrite?: boolean;
  onChange?: () => void;
}

/** Build a runtime controller for any model so studio UI, games, and AI code drive parts identically. */
export function createAssetController(
  root: T.Object3D,
  initialCapabilities?: AssetCapabilities,
  nodePrefix?: string,
  options?: AssetControllerInternalOptions,
): AssetController {
  const capabilities = structuredClone(initialCapabilities ?? inspectAsset(root));
  const initialState = capabilities.state ? structuredClone(capabilities.state) : undefined;
  const prefix = nodePrefix ?? '';
  const findNode = (name: string) => findOwnNodeByName(root, name, prefix);
  const bindings = new Map<string, PartBinding>();
  for (const spec of capabilities.riggedParts) {
    const node = findNode(spec.name);
    if (!node) continue;
    // Recover true quaternion/position rest transform by backing out state.pose so posed GLBs never double-rotate past 90 deg.
    const initialVal = clampToRange(spec.range, capabilities.state?.pose?.[spec.name] ?? 0);
    const restPosition = node.position.clone();
    const restQuaternion = node.quaternion.clone();
    if (spec.type === 'slide') {
      restPosition[spec.axis] -= initialVal;
    } else {
      restQuaternion.multiply(new T.Quaternion().setFromAxisAngle(axisVector(spec.axis), -T.MathUtils.degToRad(initialVal))).normalize();
    }
    registerRiggedRestPose(node, restPosition, restQuaternion);
    bindings.set(spec.name, { spec, node, restQuaternion, restPosition, value: initialVal });
  }
  const detachables = new Map<string, T.Object3D>();
  for (const spec of capabilities.detachableParts) {
    const node = findNode(spec.name);
    if (node) detachables.set(spec.name, node);
  }
  const hiddenParts = new Set<string>();
  let nightOverlays = buildNightOverlays(root, capabilities.nightZones);
  let nightOn = false;
  let decalsOn = false;
  let decalLabels: Record<string, string> = {};
  let decalOverlays: DecalOverlay[] = [];

  function applyPoseToNode(binding: PartBinding, target: T.Object3D) {
    const { spec, restPosition, restQuaternion, value } = binding;
    if (spec.type === 'slide') {
      target.position.copy(restPosition);
      target.position[spec.axis] = restPosition[spec.axis] + value;
    } else {
      target.quaternion.copy(restQuaternion)
        .multiply(new T.Quaternion().setFromAxisAngle(axisVector(spec.axis), T.MathUtils.degToRad(value)))
        .normalize();
    }
    target.updateMatrixWorld(true);
  }

  function clearNightOverlays() {
    for (const overlay of nightOverlays) {
      overlay.mesh.removeFromParent();
      overlay.geometry.dispose();
      overlay.material.dispose();
    }
    nightOverlays = [];
  }

  function clearDecalOverlays() {
    for (const entry of decalOverlays) {
      entry.mesh.removeFromParent();
      entry.dispose();
    }
    decalOverlays = [];
  }

  function rebuildDecalOverlays() {
    clearDecalOverlays();
    if (!decalsOn || !capabilities.decals.length) return;
    const targetParent = root.children.find(child => !child.userData.studioOverlay) ?? root;
    for (const slot of capabilities.decals) {
      const built = buildDecalMesh(slot, decalLabels[slot.name] ?? '');
      targetParent.add(built.mesh);
      decalOverlays.push(built);
    }
  }

  function getState(): AssetRuntimeState {
    const pose: Record<string, number> = {};
    for (const [name, binding] of bindings) {
      if (Math.abs(binding.value) > 1e-6) pose[name] = Math.round(binding.value * 1000) / 1000;
    }
    const hidden = [...hiddenParts].sort();
    const cleanedText = Object.fromEntries(
      Object.entries(decalLabels).filter(([, text]) => text.trim().length > 0),
    );
    return {
      ...(Object.keys(pose).length ? { pose } : {}),
      ...(hidden.length ? { hiddenParts: hidden } : {}),
      ...(nightOn ? { night: true } : {}),
      ...(Object.keys(cleanedText).length ? { decalText: cleanedText } : {}),
    };
  }

  let initializing = true;
  function syncManifest(): AssetCapabilities {
    const state = getState();
    if (Object.keys(state).length) capabilities.state = state;
    else delete capabilities.state;
    if (root.animations.length) {
      capabilities.clips = describeClips(root.animations, capabilities.clips);
    } else if (!capabilities.clips?.length) {
      delete capabilities.clips;
    }
    if (!options?.skipRootWrite) writeCapabilities(root, capabilities);
    if (!initializing) options?.onChange?.();
    return structuredClone(capabilities);
  }

  const controller: AssetController = {
    get capabilities() {
      return capabilities;
    },
    getState,
    getPart(name) {
      return bindings.get(name)?.value ?? 0;
    },
    setPart(name, value) {
      const binding = bindings.get(name);
      if (!binding) throw new Error('This model has no rigged part named ' + name + '.');
      if (!Number.isFinite(value)) throw new Error('Part pose value must be a finite number.');
      binding.value = clampToRange(binding.spec.range, value);
      applyPoseToNode(binding, binding.node);
      syncManifest();
      return binding.value;
    },
    openPart(name) {
      const binding = bindings.get(name);
      if (!binding) throw new Error('This model has no rigged part named ' + name + '.');
      return controller.setPart(name, farRangeEnd(binding.spec.range));
    },
    closePart(name) {
      const binding = bindings.get(name);
      if (!binding) throw new Error('This model has no rigged part named ' + name + '.');
      return controller.setPart(name, clampToRange(binding.spec.range, 0));
    },
    togglePart(name) {
      const binding = bindings.get(name);
      if (!binding) throw new Error('This model has no rigged part named ' + name + '.');
      const far = farRangeEnd(binding.spec.range);
      const rest = clampToRange(binding.spec.range, 0);
      const target = Math.abs(far) >= 359 ? far / 2 : far;
      const isNearRest = Math.abs(binding.value - rest) <= Math.abs(target - rest) * 0.25;
      return controller.setPart(name, isNearRest ? target : rest);
    },
    resetParts() {
      for (const binding of bindings.values()) {
        binding.value = clampToRange(binding.spec.range, 0);
        applyPoseToNode(binding, binding.node);
      }
      syncManifest();
    },
    isVisible(name) {
      return !hiddenParts.has(name);
    },
    setVisible(name, visible) {
      const node = detachables.get(name);
      if (!node) throw new Error('This model has no detachable part named ' + name + '.');
      if (visible) hiddenParts.delete(name);
      else hiddenParts.add(name);
      node.visible = visible;
      syncManifest();
    },
    resetVisibility() {
      hiddenParts.clear();
      for (const node of detachables.values()) node.visible = true;
      syncManifest();
    },
    isNight() {
      return nightOn;
    },
    setNight(on) {
      nightOn = on;
      for (const overlay of nightOverlays) overlay.mesh.visible = nightOn;
      syncManifest();
    },
    refreshNightOverlays() {
      clearNightOverlays();
      nightOverlays = buildNightOverlays(root, capabilities.nightZones);
      for (const overlay of nightOverlays) overlay.mesh.visible = nightOn;
    },
    setDecalsVisible(on, labels) {
      decalsOn = on;
      if (labels) decalLabels = { ...labels };
      rebuildDecalOverlays();
      syncManifest();
    },
    areDecalsVisible() {
      return decalsOn;
    },
    applyPoseToClone(cloneRoot) {
      for (const binding of bindings.values()) {
        const cloned = findOwnNodeByName(cloneRoot, binding.spec.name, prefix);
        if (cloned) applyPoseToNode(binding, cloned);
      }
    },
    syncManifest,
    dispose() {
      clearNightOverlays();
      clearDecalOverlays();
      if (!options?.skipRootWrite) unregisterLiveController(root, controller);
    },
  };

  if (initialState?.hiddenParts) {
    for (const name of initialState.hiddenParts) {
      const node = detachables.get(name);
      if (node) {
        hiddenParts.add(name);
        node.visible = false;
      }
    }
  }
  if (initialState?.night) {
    nightOn = true;
    for (const overlay of nightOverlays) overlay.mesh.visible = true;
  }
  if (initialState?.decalText) decalLabels = { ...initialState.decalText };
  syncManifest();
  initializing = false;
  if (!options?.skipRootWrite) registerLiveController(root, controller);
  return controller;
}
