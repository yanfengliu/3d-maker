import * as T from 'three';
import { measureDimensions, refreshLegacyInstanceDimensions } from './measure-dimensions';
import { isAssetRootHidden } from './compose-scope';
import {
  findOwnNodeByName,
  registerLiveController,
  registerRiggedRestPose,
  resolveLiveRiggedParts,
  unregisterLiveController,
} from './compose-tree';
import { buildDecalMesh, buildNightOverlays, type DecalOverlay } from './overlays';
import { axisTuple, buildClipPoseSchedule, propagateMimicValues, slideOffsetFactor } from './rig-math';
import { readSand3dCapabilities } from './sand3d';
import {
  readCapabilities,
  readEmbeddedDecals,
  writeCapabilities,
  type AssetCapabilities,
  type AssetRuntimeState,
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

function axisVector(axis: RiggedPartSpec['axis']): T.Vector3 {
  return new T.Vector3(...axisTuple(axis));
}

export function farRangeEnd(range: [number, number]): number {
  return Math.abs(range[1]) >= Math.abs(range[0]) ? range[1] : range[0];
}

export function clampToRange(range: [number, number], value: number): number {
  const min = Math.min(range[0], range[1]);
  const max = Math.max(range[0], range[1]);
  return Math.min(max, Math.max(min, value));
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
    refreshLegacyInstanceDimensions(root, existing);
    const out: AssetCapabilities = {
      ...structuredClone(existing),
      ...(clips?.length ? { clips } : {}),
    };
    if (out.state?.hiddenParts?.length) {
      out.state.rootHidden = isAssetRootHidden(out, new Set(out.state.hiddenParts), root);
    }
    return out;
  }
  const sand3d = readSand3dCapabilities(root, { animations: sourceClips });
  if (sand3d) {
    return {
      ...sand3d,
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

function buildPartTrack(
  part: RiggedPartSpec,
  node: T.Object3D,
  trackNode: string,
  current: number,
  times: readonly number[],
  poseValues: readonly number[],
): T.KeyframeTrack {
  const axisVec = axisVector(part.axis);
  if (part.type === 'slide') {
    const slideFactor = slideOffsetFactor(part);
    const rest = node.position.clone().addScaledVector(axisVec, -current * slideFactor);
    const vals: number[] = [];
    const pos = new T.Vector3();
    for (const v of poseValues) {
      pos.copy(rest).addScaledVector(axisVec, v * slideFactor);
      vals.push(pos.x, pos.y, pos.z);
    }
    return new T.VectorKeyframeTrack(trackNode + '.position', [...times], vals);
  }
  const restQuat = node.quaternion.clone()
    .multiply(new T.Quaternion().setFromAxisAngle(axisVec, -T.MathUtils.degToRad(current)))
    .normalize();
  const vals: number[] = [];
  for (const deg of poseValues) {
    const q = restQuat.clone().multiply(new T.Quaternion().setFromAxisAngle(axisVec, T.MathUtils.degToRad(deg))).normalize();
    vals.push(q.x, q.y, q.z, q.w);
  }
  return new T.QuaternionKeyframeTrack(trackNode + '.quaternion', [...times], vals);
}

/** Synthesize standard glTF-compatible AnimationClips for every rigged part (including coupled `mimic` followers). */
export function synthesizeRigClips(
  root: T.Object3D,
  capabilities?: AssetCapabilities,
  nodePrefix?: string,
  exportRoot?: T.Object3D,
): T.AnimationClip[] {
  const caps = capabilities ?? inspectAsset(root);
  const prefix = nodePrefix ?? '';
  const liveParts = resolveLiveRiggedParts(root, caps.riggedParts, prefix);
  const clips: T.AnimationClip[] = [];
  const resolveTrackNode = (node: T.Object3D, partName: string) => {
    const candidateName = node.name || (prefix ? `${prefix}${partName}` : partName);
    return exportRoot && exportRoot.getObjectByName(candidateName) !== node ? node.uuid : candidateName;
  };
  for (const part of liveParts) {
    if (part.mimic) continue;
    const node = findOwnNodeByName(root, part.name, prefix);
    if (!node) continue;
    const current = caps.state?.pose?.[part.name] ?? 0;
    const { times, leaderValues, followerValues } = buildClipPoseSchedule(part, liveParts);
    const tracks: T.KeyframeTrack[] = [
      buildPartTrack(part, node, resolveTrackNode(node, part.name), current, times, leaderValues),
    ];
    const currentCoupled = propagateMimicValues(liveParts, part.name, current);
    for (const [fName, fVals] of followerValues) {
      const fSpec = liveParts.find(p => p.name === fName);
      const fNode = fSpec ? findOwnNodeByName(root, fSpec.name, prefix) : undefined;
      if (!fSpec || !fNode) continue;
      const fCur = caps.state?.pose?.[fSpec.name] ?? currentCoupled.get(fSpec.name) ?? 0;
      tracks.push(buildPartTrack(fSpec, fNode, resolveTrackNode(fNode, fSpec.name), fCur, times, fVals));
    }
    const verb = part.type === 'slide'
      ? 'Operate '
      : /door|gate|lid|hatch|window|drawer/i.test(part.name + ' ' + (part.describe ?? '')) ? 'Open ' : 'Move ';
    clips.push(markSynthesizedClip(new T.AnimationClip(verb + part.label.toLowerCase(), 2.4, tracks)));
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
  capabilities.riggedParts = resolveLiveRiggedParts(root, capabilities.riggedParts, prefix);
  const findNode = (name: string) => findOwnNodeByName(root, name, prefix);
  const bindings = new Map<string, PartBinding>();
  for (const spec of capabilities.riggedParts) {
    const node = findNode(spec.name);
    if (!node) continue;
    // Recover true quaternion/position rest transform by backing out state.pose so posed GLBs never double-rotate past 90 deg.
    const rawInit = capabilities.state?.pose?.[spec.name] ?? 0;
    const initialVal = spec.continuous ? rawInit : clampToRange(spec.range, rawInit);
    const restPosition = node.position.clone();
    const restQuaternion = node.quaternion.clone();
    const axisVec = axisVector(spec.axis);
    if (spec.type === 'slide') {
      restPosition.addScaledVector(axisVec, -initialVal * slideOffsetFactor(spec));
    } else {
      restQuaternion.multiply(new T.Quaternion().setFromAxisAngle(axisVec, -T.MathUtils.degToRad(initialVal))).normalize();
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

  function applyPoseToNode(binding: PartBinding, target: T.Object3D, syncSand3dExtras = false) {
    const { spec, restPosition, restQuaternion, value } = binding;
    const axisVec = axisVector(spec.axis);
    if (spec.type === 'slide') {
      target.position.copy(restPosition).addScaledVector(axisVec, value * slideOffsetFactor(spec));
    } else {
      target.quaternion.copy(restQuaternion)
        .multiply(new T.Quaternion().setFromAxisAngle(axisVec, T.MathUtils.degToRad(value)))
        .normalize();
    }
    if (syncSand3dExtras && target.userData.s3d_joint && typeof target.userData.s3d_joint === 'object' && !Array.isArray(target.userData.s3d_joint)) {
      const siValue = spec.type === 'slide' ? value : T.MathUtils.degToRad(value);
      target.userData.s3d_joint = {
        ...(target.userData.s3d_joint as Record<string, unknown>),
        value: Math.round(siValue * 1e6) / 1e6 || 0,
      };
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
      if (Math.abs(binding.value) > 1e-6) {
        const scale = binding.spec.type === 'slide' ? 10000 : 1000;
        pose[name] = Math.round(binding.value * scale) / scale;
      }
    }
    const hidden = [...hiddenParts].sort();
    const cleanedText = Object.fromEntries(
      Object.entries(decalLabels).filter(([, text]) => text.trim().length > 0),
    );
    const rootHidden = hidden.length > 0 ? isAssetRootHidden(capabilities, hiddenParts, root, prefix) : undefined;
    return {
      ...(Object.keys(pose).length ? { pose } : {}),
      ...(hidden.length ? { hiddenParts: hidden } : {}),
      ...(rootHidden !== undefined ? { rootHidden } : {}),
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

  function applyCoupledFollowers(leaderName: string, leaderValue: number) {
    for (const [fName, fVal] of propagateMimicValues(capabilities.riggedParts, leaderName, leaderValue)) {
      const fBinding = bindings.get(fName);
      if (!fBinding) continue;
      fBinding.value = fBinding.spec.continuous ? fVal : clampToRange(fBinding.spec.range, fVal);
      applyPoseToNode(fBinding, fBinding.node);
    }
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
      if (binding.spec.mimic && bindings.has(binding.spec.mimic.part)) {
        throw new Error(`Part "${name}" is coupled to "${binding.spec.mimic.part}"; pose "${binding.spec.mimic.part}" instead.`);
      }
      if (!Number.isFinite(value)) throw new Error('Part pose value must be a finite number.');
      binding.value = binding.spec.continuous ? value : clampToRange(binding.spec.range, value);
      applyPoseToNode(binding, binding.node);
      applyCoupledFollowers(name, binding.value);
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
        if (binding.spec.mimic && bindings.has(binding.spec.mimic.part)) continue;
        binding.value = binding.spec.continuous ? 0 : clampToRange(binding.spec.range, 0);
        applyPoseToNode(binding, binding.node);
        applyCoupledFollowers(binding.spec.name, binding.value);
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
        if (cloned) applyPoseToNode(binding, cloned, true);
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
