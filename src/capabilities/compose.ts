import * as T from 'three';
import type { Recipe } from '../data/recipe';
import {
  COMPOSITE_CHILD_ID_PATTERN,
  MAX_COMPOSITE_CHILDREN,
  type CompositeChildSpec,
  type CompositeMountSpec,
  type PhysicsCoupling,
} from './compose-schema';
import {
  computeCompositeBodies,
  computeCompositePhysics,
  findOwnNodeByName,
  measureCompositeLocalBox,
  surfaceBasis,
  traverseOwnSubtree,
  type CompositeRigidBodySpec,
} from './compose-tree';
import { inspectAsset } from './runtime';
import {
  writeCapabilities,
  type AssetCapabilities,
  type SurfaceSpec,
} from './schema';

export { computeCompositeBodies };
export type { CompositeRigidBodySpec };
export { validateComposite } from './compose-validate';
export type { CompositeSurfaceIssue, CompositeValidationResult } from './compose-validate';

export interface CompositePartInput {
  id: string;
  label?: string;
  /** Pre-built Three.js asset (GLB scene or procedural Group). Provide either `object` or `recipe`. */
  object?: T.Object3D;
  /** Declarative starter recipe (built automatically and preserved so child structural knobs remain live). */
  recipe?: Recipe;
  /** Attachment parent, surface/node mount, transform, and physics coupling law (`weld` | `surface` | `joint`). */
  mount?: Partial<CompositeMountSpec>;
}

export interface ComposeAssetOptions {
  name: string;
  description?: string;
  parts: readonly CompositePartInput[];
  /** Builder used when a part supplies `recipe` instead of `object`. */
  buildRecipe?: (recipe: Recipe) => T.Group;
  /** Prefix child internal node names and animation track bindings with `${id}__` for collision-free GLB export. Default true. */
  scopeNames?: boolean;
  /** Optional explicit physics body override for the assembled composite. */
  physicsBody?: 'static' | 'dynamic';
}

function r3(n: number): number {
  return Math.round((n + 1e-9) * 1000) / 1000 || 0;
}

function rewriteTrackName(
  trackName: string,
  childRootName: string,
  prefix: string,
  renamedNames: ReadonlySet<string>,
  uuids: ReadonlySet<string>,
): string {
  const parsed = T.PropertyBinding.parseTrackName(trackName) as { nodeName?: string };
  const nodeName = parsed.nodeName ?? '';
  if (!nodeName) {
    // Root-relative track (e.g. `.position`) must target the child root node, never the outer composite root.
    if (!childRootName) return trackName;
    return trackName.startsWith('.') ? `${childRootName}${trackName}` : `${childRootName}.${trackName}`;
  }
  if (uuids.has(nodeName)) {
    // Preserve anonymous UUID bindings intact so GLTFExporter resolves them to the unnamed mesh.
    return trackName;
  }
  if (renamedNames.has(nodeName) && !nodeName.startsWith(prefix)) {
    const idx = trackName.indexOf(nodeName);
    if (idx >= 0) {
      return `${trackName.slice(0, idx)}${prefix}${nodeName}${trackName.slice(idx + nodeName.length)}`;
    }
  }
  return trackName;
}

function scopeNestedChildSpecs(children: CompositeChildSpec[], prefix: string): void {
  for (const sub of children) {
    if (!sub.slotNode.startsWith(prefix)) sub.slotNode = `${prefix}${sub.slotNode}`;
    sub.nodePrefix = sub.nodePrefix
      ? (sub.nodePrefix.startsWith(prefix) ? sub.nodePrefix : `${prefix}${sub.nodePrefix}`)
      : prefix;
    if (sub.capabilities.children?.length) {
      scopeNestedChildSpecs(sub.capabilities.children, prefix);
    }
  }
}

function pickUniquePrefix(childRoot: T.Object3D, id: string, usedNames: ReadonlySet<string>): string {
  const candidateNames: string[] = [];
  childRoot.traverse(node => {
    if (node.name) candidateNames.push(node.name);
  });
  let attempt = 0;
  for (;;) {
    const prefix = attempt === 0 ? `${id}__` : `${id}__${String(attempt)}__`;
    const collides = candidateNames.some(name => usedNames.has(name.startsWith(prefix) ? name : `${prefix}${name}`));
    if (!collides) return prefix;
    attempt++;
  }
}

/**
 * Strip embedded manifests from a child subtree, clone its animation clips so shared clones never cross-mutate,
 * and optionally prefix named nodes and non-UUID track bindings with `prefix`.
 */
export function scopeChildSubtree(
  childRoot: T.Object3D,
  childId: string,
  prefix: string,
  childCaps?: AssetCapabilities,
): void {
  // Always clone clips first because Object3D.clone() shares AnimationClip references across siblings.
  childRoot.animations = childRoot.animations.map(clip => clip.clone());

  const originalNames = new Set<string>();
  const uuids = new Set<string>();
  let needsRootName = false;
  for (const clip of childRoot.animations) {
    for (const track of clip.tracks) {
      const parsed = T.PropertyBinding.parseTrackName(track.name) as { nodeName?: string };
      if (!parsed.nodeName) needsRootName = true;
    }
  }
  if (needsRootName && !childRoot.name) childRoot.name = 'Root';

  childRoot.traverse(node => {
    node.userData.compositeChild = childId;
    if ('formFoundry' in node.userData) delete node.userData.formFoundry;
    uuids.add(node.uuid);
    if (!node.name) return;
    originalNames.add(node.name);
    if (node.userData.localName === undefined) node.userData.localName = node.name;
    if (prefix && !node.name.startsWith(prefix)) {
      node.name = `${prefix}${node.name}`;
    }
  });

  for (const clip of childRoot.animations) {
    for (const track of clip.tracks) {
      track.name = rewriteTrackName(track.name, childRoot.name, prefix, originalNames, uuids);
    }
  }

  if (prefix && childCaps?.children?.length) {
    scopeNestedChildSpecs(childCaps.children, prefix);
  }
}

function measureMinAlongNormalInHost(
  childRoot: T.Object3D,
  hostRootWorldInv: T.Matrix4,
  normalInHost: T.Vector3,
): number {
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  let minProj = Infinity;
  traverseOwnSubtree(childRoot, node => {
    if (!(node instanceof T.Mesh) || node.userData.studioOverlay) return;
    const geo = node.geometry as T.BufferGeometry;
    const pos = geo.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    if (!pos) return;
    rel.multiplyMatrices(hostRootWorldInv, node.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(rel);
      if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) continue;
      const proj = v.dot(normalInHost);
      if (proj < minProj) minProj = proj;
    }
  });
  return Number.isFinite(minProj) ? minProj : 0;
}

function applySlotTransform(
  slot: T.Object3D,
  mount: CompositeMountSpec,
  childRoot: T.Object3D,
  hostRoot?: T.Object3D,
  hostSurface?: SurfaceSpec,
): void {
  const scale = mount.scale ?? 1;
  if (typeof scale === 'number') slot.scale.set(scale, scale, scale);
  else slot.scale.set(scale[0], scale[1], scale[2]);

  const rot = mount.rotation ?? [0, 0, 0];
  slot.rotation.set(rot[0], rot[1], rot[2]);

  const offset = mount.at ?? [0, 0, 0];
  if (hostSurface && hostRoot && slot.parent) {
    const { u, n, v } = surfaceBasis(hostSurface.normal);
    const desiredInHost = new T.Vector3(...hostSurface.at)
      .addScaledVector(u, offset[0])
      .addScaledVector(n, offset[1])
      .addScaledVector(v, offset[2]);

    hostRoot.updateMatrixWorld(true);
    const parentInv = slot.parent.matrixWorld.clone().invert();
    const desiredWorld = desiredInHost.clone().applyMatrix4(hostRoot.matrixWorld);
    slot.position.copy(desiredWorld.applyMatrix4(parentInv));
    hostRoot.updateMatrixWorld(true);

    // Measure the ALREADY-rotated and scaled child vertices in host root space and shift along surface normal so it sits flush.
    const hostInv = hostRoot.matrixWorld.clone().invert();
    const minProj = measureMinAlongNormalInHost(childRoot, hostInv, n);
    const targetProj = desiredInHost.dot(n);
    const deltaN = targetProj - minProj;
    if (Number.isFinite(deltaN) && Math.abs(deltaN) > 1e-7) {
      const shiftedInHost = desiredInHost.clone().addScaledVector(n, deltaN);
      const shiftedWorld = shiftedInHost.applyMatrix4(hostRoot.matrixWorld);
      slot.position.copy(shiftedWorld.applyMatrix4(parentInv));
      slot.updateMatrixWorld(true);
    }
  } else {
    slot.position.set(offset[0], offset[1], offset[2]);
    slot.updateMatrixWorld(true);
  }
}

/**
 * Compose two or more independent assets into a single hierarchical Three.js Group while preserving
 * every child's structural recipe/knobs, scoped rigged/detachable/night/decal capabilities, parallel
 * animations, and physics coupling laws (`weld` | `surface` | `joint`).
 */
export function composeAsset(options: ComposeAssetOptions): T.Group {
  if (!options.name.trim()) throw new Error('Composite asset requires a non-empty name.');
  if (!options.parts.length) throw new Error('Composite asset requires at least one child part.');
  if (options.parts.length > MAX_COMPOSITE_CHILDREN) {
    throw new Error(
      `Composite asset supports at most ${String(MAX_COMPOSITE_CHILDREN)} direct children; received ${String(options.parts.length)}. Nest sub-assemblies instead.`,
    );
  }

  const root = new T.Group();
  root.name = options.name.trim();
  const scopeNames = options.scopeNames !== false;
  const slotById = new Map<string, T.Group>();
  const childRootById = new Map<string, T.Object3D>();
  const childSpecById = new Map<string, CompositeChildSpec>();
  const usedNodeNames = new Set<string>([root.name]);
  const children: CompositeChildSpec[] = [];
  const compositeClips: T.AnimationClip[] = [];

  for (const part of options.parts) {
    const id = part.id.trim();
    if (!COMPOSITE_CHILD_ID_PATTERN.test(id)) {
      throw new Error(`Invalid composite child id "${part.id}". Use letters, numbers, hyphens, or underscores.`);
    }
    if (slotById.has(id)) throw new Error(`Duplicate composite child id "${id}".`);

    let childRoot: T.Object3D;
    let preservedRecipe: Record<string, unknown> | undefined;
    if (part.object) {
      childRoot = part.object;
      const existingRecipe = childRoot.userData.recipe as Record<string, unknown> | undefined;
      if (part.recipe) preservedRecipe = structuredClone(part.recipe) as unknown as Record<string, unknown>;
      else if (existingRecipe && typeof existingRecipe === 'object') preservedRecipe = structuredClone(existingRecipe);
    } else if (part.recipe) {
      if (!options.buildRecipe) {
        throw new Error(`Part "${id}" passed a recipe, but composeAsset was called without buildRecipe.`);
      }
      childRoot = options.buildRecipe(part.recipe);
      preservedRecipe = structuredClone(part.recipe) as unknown as Record<string, unknown>;
    } else {
      throw new Error(`Composite part "${id}" must provide either object or recipe.`);
    }

    const childCaps = inspectAsset(childRoot);
    const defaultCoupling: PhysicsCoupling = part.mount?.surface ? 'surface' : 'weld';
    const mount: CompositeMountSpec = {
      ...(part.mount?.parent ? { parent: part.mount.parent } : {}),
      ...(part.mount?.attachNode ? { attachNode: part.mount.attachNode } : {}),
      ...(part.mount?.surface ? { surface: part.mount.surface } : {}),
      ...(part.mount?.at ? { at: [...part.mount.at] } : {}),
      ...(part.mount?.rotation ? { rotation: [...part.mount.rotation] } : {}),
      ...(part.mount?.scale !== undefined
        ? { scale: Array.isArray(part.mount.scale) ? [...part.mount.scale] : part.mount.scale }
        : {}),
      coupling: part.mount?.coupling ?? defaultCoupling,
      ...(part.mount?.joint ? { joint: { ...part.mount.joint } } : {}),
    };

    const slotName = `Slot_${id}`;
    const slot = new T.Group();
    slot.name = slotName;
    slot.userData.compositeSlot = id;
    usedNodeNames.add(slotName);

    let hostParent: T.Object3D = root;
    let hostRoot: T.Object3D | undefined;
    let hostSurface: SurfaceSpec | undefined;
    if (mount.parent) {
      const parentSpec = childSpecById.get(mount.parent);
      const parentObj = childRootById.get(mount.parent);
      if (!parentSpec || !parentObj) {
        throw new Error(`Part "${id}" references unknown or later-declared parent "${mount.parent}". Declare parent parts first.`);
      }
      hostRoot = parentObj;
      if (mount.attachNode) {
        const target = findOwnNodeByName(parentObj, mount.attachNode, parentSpec.nodePrefix);
        if (!target) {
          throw new Error(`Part "${id}" attachNode "${mount.attachNode}" not found inside parent "${mount.parent}".`);
        }
        hostParent = target;
      } else {
        hostParent = parentObj;
      }
      if (mount.surface) {
        hostSurface = parentSpec.capabilities.surfaces?.find(s => s.name === mount.surface);
      }
    }

    const prefix = scopeNames ? pickUniquePrefix(childRoot, id, usedNodeNames) : undefined;
    scopeChildSubtree(childRoot, id, prefix ?? '', childCaps);
    childRoot.traverse(node => {
      if (node.name) usedNodeNames.add(node.name);
    });

    slot.add(childRoot);
    hostParent.add(slot);
    applySlotTransform(slot, mount, childRoot, hostRoot, hostSurface);

    // Collect scoped composite-level clips so a single GLB export preserves every child's animations without collisions.
    for (const clip of childRoot.animations) {
      const scopedClip = clip.clone();
      scopedClip.name = `${id}: ${clip.name}`;
      compositeClips.push(scopedClip);
    }

    const childSpec: CompositeChildSpec = {
      id,
      label: part.label?.trim() || childCaps.name,
      slotNode: slotName,
      ...(prefix ? { nodePrefix: prefix } : {}),
      mount,
      ...(preservedRecipe ? { recipe: preservedRecipe } : {}),
      capabilities: childCaps,
    };
    children.push(childSpec);
    slotById.set(id, slot);
    childRootById.set(id, childRoot);
    childSpecById.set(id, childSpec);
  }

  root.animations = compositeClips;
  const overall = measureCompositeLocalBox(root);
  const size = overall.isEmpty() ? new T.Vector3(1, 1, 1) : overall.getSize(new T.Vector3());

  const capabilities: AssetCapabilities = {
    version: 1,
    name: root.name,
    ...(options.description ? { description: options.description.trim() } : {}),
    riggedParts: [],
    detachableParts: [],
    nightZones: [],
    decals: [],
    dimensions: {
      sizeM: { x: r3(size.x), y: r3(size.y), z: r3(size.z) },
      originY: r3(overall.isEmpty() ? 0 : overall.min.y),
      origin: 'composite root frame',
    },
    physics: computeCompositePhysics(children, options.physicsBody),
    children,
    ...(compositeClips.length
      ? { clips: compositeClips.map(c => ({ name: c.name, duration: r3(c.duration) })) }
      : {}),
  };
  writeCapabilities(root, capabilities);
  return root;
}

/**
 * Re-seat a child slot onto its host surface (used after rebuilding a child when its structural knobs change).
 */
export function reseatCompositeSlot(
  slot: T.Object3D,
  childRoot: T.Object3D,
  mount: CompositeMountSpec,
  hostCaps?: AssetCapabilities,
  hostRoot?: T.Object3D,
): void {
  const hostSurface = mount.surface ? hostCaps?.surfaces?.find(s => s.name === mount.surface) : undefined;
  applySlotTransform(slot, mount, childRoot, hostRoot, hostSurface);
}
