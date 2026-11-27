import * as T from 'three';
import {
  readCapabilities,
  readEmbeddedDecals,
  writeCapabilities,
  type AssetCapabilities,
  type AssetRuntimeState,
  type DecalSlotSpec,
  type NightZoneSpec,
  type RiggedPartSpec,
} from './schema';

interface PartBinding {
  spec: RiggedPartSpec;
  node: T.Object3D;
  restRotation: T.Euler;
  restPosition: T.Vector3;
  value: number;
}

interface NightOverlay {
  mesh: T.Mesh;
  geometry: T.BufferGeometry;
  material: T.MeshBasicMaterial;
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
  setDecalsVisible(on: boolean, labels?: Record<string, string>): void;
  areDecalsVisible(): boolean;
  syncManifest(): AssetCapabilities;
  dispose(): void;
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

/** Inspect any Three.js Group (Form Foundry original, PolyFork import, or exported GLB) for AI/game capabilities. */
export function inspectAsset(root: T.Object3D): AssetCapabilities {
  const existing = readCapabilities(root);
  const clips = root.animations.map(clip => ({ name: clip.name, duration: Math.round(clip.duration * 1000) / 1000 }));
  if (existing) {
    return {
      ...structuredClone(existing),
      ...(clips.length ? { clips } : {}),
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
    ...(clips.length ? { clips } : {}),
  };
}

function colorClose(r: number, g: number, b: number, target: T.Color, tolerance = 0.03): boolean {
  return Math.abs(r - target.r) <= tolerance && Math.abs(g - target.g) <= tolerance && Math.abs(b - target.b) <= tolerance;
}

function buildNightOverlays(root: T.Object3D, zones: NightZoneSpec[]): NightOverlay[] {
  if (!zones.length) return [];
  const targets = zones.map(zone => ({ zone, albedo: new T.Color(zone.albedo) }));
  const overlays: NightOverlay[] = [];
  const hosts: T.Mesh[] = [];
  root.traverse(node => {
    if (node.userData.studioOverlay) return;
    if (node instanceof T.Mesh && !(node instanceof T.SkinnedMesh)) hosts.push(node as T.Mesh);
  });
  for (const mesh of hosts) {
    const geometry = mesh.geometry;
    const position = geometry.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    const colorAttr = geometry.getAttribute('color') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    if (!position || !colorAttr) continue;
    const index = geometry.getIndex();
    const triCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3);
    for (const { zone, albedo } of targets) {
      const positions: number[] = [];
      for (let t = 0; t < triCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
        if (
          colorClose(colorAttr.getX(i0), colorAttr.getY(i0), colorAttr.getZ(i0), albedo) &&
          colorClose(colorAttr.getX(i1), colorAttr.getY(i1), colorAttr.getZ(i1), albedo) &&
          colorClose(colorAttr.getX(i2), colorAttr.getY(i2), colorAttr.getZ(i2), albedo)
        ) {
          positions.push(
            position.getX(i0), position.getY(i0), position.getZ(i0),
            position.getX(i1), position.getY(i1), position.getZ(i1),
            position.getX(i2), position.getY(i2), position.getZ(i2),
          );
        }
      }
      if (!positions.length) continue;
      const glowGeo = new T.BufferGeometry();
      glowGeo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      const glowColor = new T.Color(zone.color).multiplyScalar(Math.max(0.35, Math.min(2, zone.intensity)));
      const glowMat = new T.MeshBasicMaterial({
        color: glowColor,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const overlay = new T.Mesh(glowGeo, glowMat);
      overlay.name = 'night-' + zone.name;
      overlay.userData.studioOverlay = true;
      overlay.visible = false;
      overlay.castShadow = false;
      overlay.receiveShadow = false;
      mesh.add(overlay);
      overlays.push({ mesh: overlay, geometry: glowGeo, material: glowMat });
    }
  }
  return overlays;
}

function makeDecalTexture(label: string, aspect: number): T.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const width = 512;
  const height = Math.max(96, Math.round(width / Math.max(0.5, Math.min(8, aspect))));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255, 250, 238, 0.92)';
  ctx.fillRect(4, 4, width - 8, height - 8);
  ctx.strokeStyle = '#d96a3b';
  ctx.lineWidth = Math.max(4, Math.round(height * 0.05));
  ctx.setLineDash([14, 8]);
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.setLineDash([]);
  ctx.fillStyle = '#252b22';
  const fontSize = Math.max(22, Math.min(Math.round(height * 0.56), Math.round((width * 0.84) / Math.max(4, label.length * 0.62))));
  ctx.font = `700 ${String(fontSize)}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height / 2 + 1, width - 32);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

function buildDecalMesh(slot: DecalSlotSpec, text: string): { mesh: T.Mesh; dispose: () => void } {
  const geo = new T.PlaneGeometry(slot.size[0], slot.size[1]);
  const texture = makeDecalTexture(text || slot.name.toUpperCase(), slot.size[0] / slot.size[1]);
  const mat = new T.MeshBasicMaterial({
    color: texture ? 0xffffff : 0xd96a3b,
    map: texture,
    transparent: true,
    opacity: texture ? 0.96 : 0.4,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
    depthWrite: false,
  });
  const mesh = new T.Mesh(geo, mat);
  mesh.name = 'decal-preview-' + slot.name;
  mesh.userData.studioOverlay = true;
  const normal = new T.Vector3(...slot.normal).normalize();
  const up = new T.Vector3(...slot.up).normalize();
  const right = new T.Vector3().crossVectors(up, normal).normalize();
  const orthoUp = new T.Vector3().crossVectors(normal, right).normalize();
  const basis = new T.Matrix4().makeBasis(right, orthoUp, normal);
  mesh.quaternion.setFromRotationMatrix(basis);
  mesh.position.set(...slot.at).addScaledVector(normal, 0.006);
  return {
    mesh,
    dispose: () => {
      geo.dispose();
      texture?.dispose();
      mat.dispose();
    },
  };
}

/** Synthesize standard glTF-compatible AnimationClips for every rigged part (relative to rest pose). */
export function synthesizeRigClips(root: T.Object3D, capabilities?: AssetCapabilities): T.AnimationClip[] {
  const caps = capabilities ?? inspectAsset(root);
  const clips: T.AnimationClip[] = [];
  for (const part of caps.riggedParts) {
    const node = root.getObjectByName(part.name);
    if (!node) continue;
    const current = caps.state?.pose?.[part.name] ?? 0;
    const far = farRangeEnd(part.range);
    if (part.type === 'slide') {
      const rest = node.position.clone();
      rest[part.axis] -= current;
      const moved = rest.clone();
      moved[part.axis] += far;
      const track = new T.VectorKeyframeTrack(
        part.name + '.position',
        [0, 0.9, 1.5, 2.4],
        [rest.x, rest.y, rest.z, moved.x, moved.y, moved.z, moved.x, moved.y, moved.z, rest.x, rest.y, rest.z],
      );
      clips.push(new T.AnimationClip('Operate ' + part.label.toLowerCase(), 2.4, [track]));
    } else {
      const restEuler = node.rotation.clone();
      restEuler[part.axis] -= T.MathUtils.degToRad(current);
      const restQuat = new T.Quaternion().setFromEuler(restEuler);
      const axisVec = new T.Vector3(part.axis === 'x' ? 1 : 0, part.axis === 'y' ? 1 : 0, part.axis === 'z' ? 1 : 0);
      const endQuat = restQuat.clone().multiply(new T.Quaternion().setFromAxisAngle(axisVec, T.MathUtils.degToRad(far)));
      const q0 = [restQuat.x, restQuat.y, restQuat.z, restQuat.w];
      const q1 = [endQuat.x, endQuat.y, endQuat.z, endQuat.w];
      const track = new T.QuaternionKeyframeTrack(part.name + '.quaternion', [0, 0.9, 1.5, 2.4], [...q0, ...q1, ...q1, ...q0]);
      const verb = /door|gate|lid|hatch|window|drawer/i.test(part.name + ' ' + (part.describe ?? '')) ? 'Open ' : 'Move ';
      clips.push(new T.AnimationClip(verb + part.label.toLowerCase(), 2.4, [track]));
    }
  }
  return clips;
}

/** Build a runtime controller for any model so studio UI, games, and AI code drive parts identically. */
export function createAssetController(root: T.Object3D, initialCapabilities?: AssetCapabilities): AssetController {
  const capabilities = structuredClone(initialCapabilities ?? inspectAsset(root));
  const bindings = new Map<string, PartBinding>();
  for (const spec of capabilities.riggedParts) {
    const node = root.getObjectByName(spec.name);
    if (!node) continue;
    // If this GLB was exported while posed, recover the true rest transform by backing out state.pose.
    const initialVal = clampToRange(spec.range, capabilities.state?.pose?.[spec.name] ?? 0);
    const restRotation = node.rotation.clone();
    const restPosition = node.position.clone();
    if (spec.type === 'slide') restPosition[spec.axis] -= initialVal;
    else restRotation[spec.axis] -= T.MathUtils.degToRad(initialVal);
    bindings.set(spec.name, {
      spec,
      node,
      restRotation,
      restPosition,
      value: initialVal,
    });
  }
  const detachables = new Map<string, T.Object3D>();
  for (const spec of capabilities.detachableParts) {
    const node = root.getObjectByName(spec.name);
    if (node) detachables.set(spec.name, node);
  }
  const hiddenParts = new Set<string>();
  const nightOverlays = buildNightOverlays(root, capabilities.nightZones);
  let nightOn = false;
  let decalsOn = false;
  let decalLabels: Record<string, string> = {};
  let decalOverlays: { mesh: T.Mesh; dispose: () => void }[] = [];

  function applyBinding(binding: PartBinding) {
    const { spec, node, restPosition, restRotation, value } = binding;
    if (spec.type === 'slide') {
      node.position.copy(restPosition);
      node.position[spec.axis] = restPosition[spec.axis] + value;
    } else {
      node.rotation.copy(restRotation);
      node.rotation[spec.axis] = restRotation[spec.axis] + T.MathUtils.degToRad(value);
    }
    node.updateMatrixWorld(true);
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

  function syncManifest(): AssetCapabilities {
    const state = getState();
    if (Object.keys(state).length) capabilities.state = state;
    else delete capabilities.state;
    if (root.animations.length) {
      capabilities.clips = root.animations.map(clip => ({ name: clip.name, duration: Math.round(clip.duration * 1000) / 1000 }));
    } else delete capabilities.clips;
    writeCapabilities(root, capabilities);
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
      applyBinding(binding);
      syncManifest();
      return binding.value;
    },
    openPart(name) {
      const binding = bindings.get(name);
      if (!binding) throw new Error('This model has no rigged part named ' + name + '.');
      return controller.setPart(name, farRangeEnd(binding.spec.range));
    },
    closePart(name) {
      return controller.setPart(name, 0);
    },
    togglePart(name) {
      const binding = bindings.get(name);
      if (!binding) throw new Error('This model has no rigged part named ' + name + '.');
      const far = farRangeEnd(binding.spec.range);
      const isNearRest = Math.abs(binding.value) <= Math.abs(far) * 0.25;
      return controller.setPart(name, isNearRest ? far : 0);
    },
    resetParts() {
      for (const binding of bindings.values()) {
        binding.value = 0;
        applyBinding(binding);
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
    setDecalsVisible(on, labels) {
      decalsOn = on;
      if (labels) decalLabels = { ...labels };
      rebuildDecalOverlays();
      syncManifest();
    },
    areDecalsVisible() {
      return decalsOn;
    },
    syncManifest,
    dispose() {
      for (const overlay of nightOverlays) {
        overlay.mesh.removeFromParent();
        overlay.geometry.dispose();
        overlay.material.dispose();
      }
      clearDecalOverlays();
    },
  };

  // Apply restored non-pose state embedded in a re-imported GLB manifest (poses are already baked in transforms).
  if (capabilities.state?.hiddenParts) {
    for (const name of capabilities.state.hiddenParts) {
      if (detachables.has(name)) controller.setVisible(name, false);
    }
  }
  if (capabilities.state?.night) controller.setNight(true);
  if (capabilities.state?.decalText) decalLabels = { ...capabilities.state.decalText };
  syncManifest();
  return controller;
}
