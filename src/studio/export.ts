import { type AnimationClip, type BufferGeometry, type Material, Mesh, type Group, type Object3D } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { CompositeChildSpec } from '../capabilities/compose-schema';
import { splitTrackTargetAndProperty } from '../capabilities/compose-scope';
import { findOwnNodeByName, getLiveController, traverseOwnSubtree, type ExportPoseProvider } from '../capabilities/compose-tree';
import { axisTuple, parseAxisSpec, type RiggedPartSpec } from '../capabilities/rig-math';
import { inspectAsset, isSynthesizedClip, synthesizeRigClips, type AssetController } from '../capabilities/runtime';
import { readCapabilities, writeCapabilities } from '../capabilities/schema';

export interface ExportOptions {
  includePartClips?: boolean;
}

function isIdentityTransform(obj: Object3D): boolean {
  return (
    obj.position.lengthSq() < 1e-10
    && Math.abs(obj.quaternion.w - 1) < 1e-6
    && Math.abs(obj.scale.x - 1) < 1e-6
    && Math.abs(obj.scale.y - 1) < 1e-6
    && Math.abs(obj.scale.z - 1) < 1e-6
  );
}

function collectAnimatedTargets(clips: readonly AnimationClip[]): { targets: Set<string>; hasRootRelative: boolean } {
  const targets = new Set<string>();
  const emptyNames = new Set<string>();
  let hasRootRelative = false;
  for (const clip of clips) {
    for (const track of clip.tracks) {
      const split = splitTrackTargetAndProperty(track.name, emptyNames);
      if (!split) continue;
      if (!split.targetPart) {
        hasRootRelative = true;
        continue;
      }
      targets.add(split.targetPart);
      for (const tok of split.targetPart.split(/[/:]/)) if (tok) targets.add(tok);
    }
  }
  return { targets, hasRootRelative };
}

/**
 * Unwrap only synthetic empty GLTFExporter/GLTFLoader scene wrappers (`name === '' | 'Scene' | 'AuxScene'`,
 * empty `userData`, identity transform, and untargeted by any clip track) so repeated GLB saves never stack wrappers.
 */
function unwrapSceneWrapper(source: Object3D, clips: readonly AnimationClip[]): Object3D {
  const { targets, hasRootRelative } = collectAnimatedTargets(clips);
  if (hasRootRelative) return source;
  let cur: Object3D = source;
  while (
    Object.keys(cur.userData).length === 0
    && (cur.name === '' || cur.name === 'Scene' || cur.name === 'AuxScene')
    && (cur === source || cur.animations.length === 0)
    && !targets.has(cur.name)
    && !targets.has(cur.uuid)
    && cur.children.length === 1
    && cur.children[0]
    && isIdentityTransform(cur)
    && !cur.children[0].userData.compositeSlot
    && !cur.children[0].userData.compositeChild
    && readCapabilities(cur.children[0])
  ) {
    cur = cur.children[0];
  }
  return cur;
}

function stripChildClipPath(clipName: string, childPath: string): string | null {
  let rest = clipName;
  for (const seg of childPath.split('/')) {
    if (rest.startsWith(`${seg}: `)) rest = rest.slice(seg.length + 2);
    else if (rest.startsWith(`${seg}/`)) rest = rest.slice(seg.length + 1);
    else return null;
  }
  return rest.length > 0 ? rest : null;
}

/** Rebind unscoped (or shared-prefix) composite child clip tracks to exact node UUIDs on the export clone. */
function rebindUnscopedChildTracks(
  child: CompositeChildSpec,
  inner: Object3D,
  childPath: string,
  animations: readonly AnimationClip[],
  sharedPrefix: boolean,
): void {
  if (child.nodePrefix && !sharedPrefix) return;
  const ownNames = new Set<string>();
  const ownUuids = new Set<string>();
  traverseOwnSubtree(inner, node => {
    ownUuids.add(node.uuid);
    if (node.name) ownNames.add(node.name);
    if (typeof node.userData.localName === 'string') ownNames.add(node.userData.localName);
  });
  const nestedIds = child.capabilities.children?.map(sub => sub.id) ?? [];
  for (const clip of animations) {
    const rest = stripChildClipPath(clip.name, childPath);
    if (!rest) continue;
    if (nestedIds.some(subId => rest.startsWith(`${subId}: `) || rest.startsWith(`${subId}/`))) continue;
    for (const track of clip.tracks) {
      const split = splitTrackTargetAndProperty(track.name, ownNames);
      if (!split) continue;
      const { targetPart, propPart } = split;
      if (!targetPart) {
        track.name = `${inner.uuid}${propPart}`;
        continue;
      }
      if (ownUuids.has(targetPart)) continue;
      const tokens = targetPart.split(/[/:]/);
      const leaf = tokens[tokens.length - 1] ?? targetPart;
      const unprefixed = child.nodePrefix && leaf.startsWith(child.nodePrefix) ? leaf.slice(child.nodePrefix.length) : leaf;
      const resolved = findOwnNodeByName(inner, unprefixed, child.nodePrefix)
        ?? findOwnNodeByName(inner, leaf, child.nodePrefix)
        ?? findOwnNodeByName(inner, targetPart, child.nodePrefix);
      if (resolved) track.name = `${resolved.uuid}${propPart}`;
    }
  }
}

/**
 * Canonicalize untargeted mirrored rotate pivots (`scale.y < 0 || scale.z < 0`) ONLY on the temporary export clone
 * so clip-less GLTFExporter matrix serialization (`Matrix4.decompose` -> negative `scale.x` only) reloads with the
 * exact same basis and conjugated axis, while never mutating pivots targeted by authored scale/quaternion tracks.
 */
function canonicalizeExportMirroredPivots(
  scopeRoot: Object3D,
  riggedParts: RiggedPartSpec[],
  prefix: string,
  animatedTargets: ReadonlySet<string>,
): void {
  for (const part of riggedParts) {
    if (part.type !== 'rotate') continue;
    const node = findOwnNodeByName(scopeRoot, part.name, prefix);
    if (!node || (node.scale.y >= 0 && node.scale.z >= 0)) continue;
    if (animatedTargets.has(node.uuid) || (node.name && animatedTargets.has(node.name)) || animatedTargets.has(part.name)) {
      continue;
    }
    const oldSx = node.scale.x < 0 ? -1 : 1;
    const oldSy = node.scale.y < 0 ? -1 : 1;
    const oldSz = node.scale.z < 0 ? -1 : 1;
    node.updateMatrix();
    node.matrix.decompose(node.position, node.quaternion, node.scale);
    node.updateMatrixWorld(true);
    const newSx = node.scale.x < 0 ? -1 : 1;
    const newSy = node.scale.y < 0 ? -1 : 1;
    const newSz = node.scale.z < 0 ? -1 : 1;
    const [ax, ay, az] = axisTuple(part.axis);
    const updated = parseAxisSpec([oldSx * newSx * ax, oldSy * newSy * ay, oldSz * newSz * az]);
    if (updated) part.axis = updated;
  }
}

/** Collect animations owned by single-child wrapper nodes strictly above the asset capability root. */
function collectDescendantWrapperClips(exportSource: Object3D): AnimationClip[] {
  const clips: AnimationClip[] = [];
  let cur: Object3D = exportSource;
  while (cur.children.length === 1 && cur.children[0]) {
    if (cur !== exportSource && cur.userData.formFoundry) break;
    const child = cur.children[0];
    if (child.userData.compositeSlot || child.userData.compositeChild || child.userData.formFoundry) break;
    if (child.animations.length) {
      for (const clip of child.animations) {
        const copy = clip.clone();
        for (const track of copy.tracks) {
          if (track.name.startsWith('.')) track.name = `${child.uuid}${track.name}`;
        }
        clips.push(copy);
      }
    }
    cur = child;
  }
  return clips;
}

/** Capture the rig at rest, preserving detachable subtrees, active part poses, capability manifest, and optional part clips. */
export function cloneForExport(
  source: Group,
  options?: ExportOptions,
  controller?: AssetController | ExportPoseProvider | null,
) {
  const activeController = controller === undefined ? getLiveController(source) : controller;
  const controllerAnims =
    activeController && 'getAnimations' in activeController ? activeController.getAnimations() : [];
  const candidateClips = source.animations.length ? source.animations : controllerAnims;
  const exportSource = unwrapSceneWrapper(source, candidateClips);
  const root = clone(exportSource);
  const materials = new Map<Material, Material>();
  const paintedGeometry = new Map<BufferGeometry, BufferGeometry>();
  const overlays: Object3D[] = [];
  function copyMaterial(material: Material) {
    let copy = materials.get(material);
    if (!copy) {
      copy = material.clone();
      materials.set(material, copy);
    }
    return copy;
  }
  // GLTFLoader can bind tracks to UUIDs on unnamed nodes. Preserve those identities
  // in the isolated export graph so named and anonymous targets both resolve.
  function copyNode(original: Object3D, copy: Object3D) {
    if (original.userData.studioOverlay) {
      overlays.push(copy);
      return;
    }
    copy.uuid = original.uuid;
    copy.visible = original.visible;
    if (copy instanceof Mesh && original instanceof Mesh) {
      const material = original.material as Material | Material[];
      copy.material = Array.isArray(material) ? material.map(copyMaterial) : copyMaterial(material);
      const geometry = original.geometry as BufferGeometry;
      if (geometry.hasAttribute('color')) {
        let snapshot = paintedGeometry.get(geometry);
        if (!snapshot) {
          snapshot = geometry.clone();
          paintedGeometry.set(geometry, snapshot);
        }
        copy.geometry = snapshot;
      }
    }
    original.children.forEach((node, index) => {
      const child = copy.children[index];
      if (child) copyNode(node, child);
    });
  }
  copyNode(exportSource, root);
  for (const overlay of overlays) overlay.removeFromParent();
  const baseAnims = source.animations.length
    ? source.animations
    : exportSource.animations.length
      ? exportSource.animations
      : controllerAnims;
  const seenNames = new Set(baseAnims.map(c => c.name));
  const wrapperAnims = collectDescendantWrapperClips(exportSource).filter(c => !seenNames.has(c.name));
  root.animations = [...baseAnims.map((clip) => clip.clone()), ...wrapperAnims];

  const resolvedController = controller === undefined
    ? (activeController ?? getLiveController(exportSource))
    : controller;
  const capabilities = resolvedController ? resolvedController.syncManifest() : inspectAsset(exportSource, root.animations);
  // Re-apply authoritative rigged part poses onto the clone so animation mixer resets never bake stale transforms.
  resolvedController?.applyPoseToClone(root);

  // Keep declared detachable subtrees (including nested composite children) in exported GLB even while hidden.
  const ensureVisible = (node: Object3D | undefined) => {
    let cur: Object3D | null = node ?? null;
    while (cur) {
      cur.visible = true;
      cur = cur === root ? null : cur.parent;
    }
  };
  for (const part of capabilities.detachableParts) ensureVisible(findOwnNodeByName(root, part.name));
  const walkChildren = (
    children: readonly CompositeChildSpec[],
    scopeRoot: Object3D,
    pathPrefix: string,
    onChild: (child: CompositeChildSpec, inner: Object3D, childPath: string) => void,
  ) => {
    for (const child of children) {
      const slot = scopeRoot.getObjectByName(child.slotNode);
      if (!slot) continue;
      const inner = slot.children[0] ?? slot;
      const childPath = pathPrefix ? `${pathPrefix}/${child.id}` : child.id;
      onChild(child, inner, childPath);
      if (child.capabilities.children?.length) {
        walkChildren(child.capabilities.children, inner, childPath, onChild);
      }
    }
  };
  if (capabilities.children?.length) {
    const prefixCounts = new Map<string, number>();
    walkChildren(capabilities.children, root, '', child => {
      if (child.nodePrefix) prefixCounts.set(child.nodePrefix, (prefixCounts.get(child.nodePrefix) ?? 0) + 1);
    });
    walkChildren(capabilities.children, root, '', (child, inner, childPath) => {
      for (const part of child.capabilities.detachableParts) {
        ensureVisible(findOwnNodeByName(inner, part.name, child.nodePrefix));
      }
      const shared = Boolean(child.nodePrefix && (prefixCounts.get(child.nodePrefix) ?? 0) > 1);
      rebindUnscopedChildTracks(child, inner, childPath, root.animations, shared);
    });
  }

  const synthNames = new Set(capabilities.clips?.filter(c => c.synthesized).map(c => c.name));
  if (options?.includePartClips) {
    const existing = new Set(root.animations.map(clip => clip.name));
    if (capabilities.riggedParts.length) {
      for (const clip of synthesizeRigClips(root, capabilities)) {
        if (!existing.has(clip.name)) {
          root.animations.push(clip);
          existing.add(clip.name);
          synthNames.add(clip.name);
        }
      }
    }
    if (capabilities.children?.length) {
      walkChildren(capabilities.children, root, '', (child, inner, childPath) => {
        if (!child.capabilities.riggedParts.length) return;
        const clipPrefix = childPath.split('/').join(': ');
        for (const clip of synthesizeRigClips(inner, child.capabilities, child.nodePrefix, root)) {
          clip.name = `${clipPrefix}: ${clip.name}`;
          if (!existing.has(clip.name)) {
            root.animations.push(clip);
            existing.add(clip.name);
            synthNames.add(clip.name);
          }
        }
      });
    }
  }
  if (root.animations.length) {
    capabilities.clips = root.animations.map(clip => {
      const synthesized = isSynthesizedClip(clip) || synthNames.has(clip.name);
      return {
        name: clip.name,
        duration: Math.round(clip.duration * 1000) / 1000,
        ...(synthesized ? { synthesized: true } : {}),
      };
    });
  } else delete capabilities.clips;
  const exportTargets = collectAnimatedTargets(root.animations).targets;
  if (capabilities.riggedParts.length) {
    canonicalizeExportMirroredPivots(root, capabilities.riggedParts, '', exportTargets);
  }
  if (capabilities.children?.length) {
    walkChildren(capabilities.children, root, '', (child, inner) => {
      if (child.capabilities.riggedParts.length) {
        canonicalizeExportMirroredPivots(inner, child.capabilities.riggedParts, child.nodePrefix ?? '', exportTargets);
      }
    });
  }
  writeCapabilities(root, capabilities);
  return {
    root,
    dispose: () => {
      for (const material of materials.values()) material.dispose();
      for (const geometry of paintedGeometry.values()) geometry.dispose();
    },
  };
}
