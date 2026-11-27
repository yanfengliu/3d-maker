import * as T from 'three';
import type { Recipe } from '../data/recipe';
import {
  COMPOSITE_CHILD_ID_PATTERN,
  MAX_COMPOSITE_CHILDREN,
  MAX_SCOPED_NAME_LEN,
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
  traverseAssetGeometry,
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

function splitTargetAndProperty(
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
    return { targetPart: longestMatch, propPart: trackName.slice(longestMatch.length) };
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
  const split = splitTargetAndProperty(trackName, renamedNames);
  if (!split) return trackName;
  const { targetPart, propPart } = split;
  if (!targetPart) {
    // Root-relative track (e.g. `.position`) must target the child root node (by UUID when unscoped, or prefixed name).
    if (!prefix) return `${childRoot.uuid}${propPart}`;
    return childRoot.name ? `${childRoot.name}${propPart}` : trackName;
  }
  if (uuids.has(targetPart)) {
    // Preserve anonymous UUID bindings intact so GLTFExporter resolves them to the unnamed mesh.
    return trackName;
  }

  // Split path segments on both `/` and `:` while preserving exact delimiters.
  const tokens = targetPart.split(/([/:])/);
  if (!prefix) {
    // Unscoped mode (`scopeNames: false`): bind every child track by its target node's exact UUID so duplicate names
    // never collide in GLTFExporter regardless of sibling declaration or DFS order.
    const leafToken = tokens[tokens.length - 1] ?? targetPart;
    const uuid = nameToUuid.get(leafToken) ?? nameToUuid.get(targetPart);
    return uuid ? `${uuid}${propPart}` : trackName;
  }

  const rewritten = tokens.map((tok, i) => (i % 2 === 0 && renamedNames.has(tok) ? `${prefix}${tok}` : tok));
  return `${rewritten.join('')}${propPart}`;
}

function assertScopedLength(value: string, label: string): void {
  if (value.length > MAX_SCOPED_NAME_LEN) {
    throw new Error(
      `Scoped ${label} "${value}" (${String(value.length)} chars) exceeds maximum length of ${String(MAX_SCOPED_NAME_LEN)}.`,
    );
  }
}

/** Pure pre-flight length check run BEFORE mutating caller input objects so rejected calls leave inputs intact. */
function validateScopedLengths(
  childRoot: T.Object3D,
  childId: string,
  prefix: string,
  childCaps?: AssetCapabilities,
): void {
  assertScopedLength(`Slot_${childId}`, 'slotNode');
  childRoot.traverse(node => {
    if (node.name) assertScopedLength(prefix ? `${prefix}${node.name}` : node.name, 'node name');
  });
  for (const clip of childRoot.animations) {
    assertScopedLength(`${childId}: ${clip.name}`, 'clip name');
  }
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
    if (sub.capabilities.children?.length) {
      scopeNestedChildSpecs(sub.capabilities.children, prefix);
    }
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

/** Measure `target`'s rest transform relative to `hostRoot` so headless JSON placement honors `attachNode`. */
export function measureAttachRestPose(
  hostRoot: T.Object3D,
  target: T.Object3D,
): { at: [number, number, number]; rotation?: [number, number, number] } {
  hostRoot.updateMatrixWorld(true);
  const rel = hostRoot.matrixWorld.clone().invert().multiply(target.matrixWorld);
  const pos = new T.Vector3();
  const quat = new T.Quaternion();
  const scale = new T.Vector3();
  rel.decompose(pos, quat, scale);
  const euler = new T.Euler().setFromQuaternion(quat, 'XYZ');
  const hasRot = Math.abs(euler.x) > 1e-5 || Math.abs(euler.y) > 1e-5 || Math.abs(euler.z) > 1e-5;
  return {
    at: [r3(pos.x), r3(pos.y), r3(pos.z)],
    ...(hasRot ? { rotation: [r3(euler.x), r3(euler.y), r3(euler.z)] } : {}),
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
): void {
  // Validate every scoped name and clip length BEFORE mutating anything on childRoot!
  validateScopedLengths(childRoot, childId, prefix, childCaps);

  const originalNames = new Set<string>();
  const uuids = new Set<string>();
  const nameToUuid = new Map<string, string>();
  let needsRootName = false;

  // Clone every clip anywhere in the subtree FIRST (Object3D.clone shares clip refs; nested composites keep clips on inner nodes).
  childRoot.traverse(node => {
    if (node.animations.length) {
      node.animations = node.animations.map(clip => clip.clone());
    }
  });
  for (const clip of childRoot.animations) {
    for (const track of clip.tracks) {
      if (track.name.startsWith('.')) needsRootName = true;
    }
  }
  if (needsRootName && !childRoot.name) {
    assertScopedLength(prefix ? `${prefix}Root` : 'Root', 'node name');
    childRoot.name = 'Root';
  }

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

function measureMinAlongNormalInHost(
  childRoot: T.Object3D,
  hostRootWorldInv: T.Matrix4,
  normalInHost: T.Vector3,
  includeNestedSlots: boolean,
  skipSlots?: ReadonlySet<T.Object3D>,
): number {
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  let minProj = Infinity;
  traverseAssetGeometry(childRoot, includeNestedSlots, skipSlots, node => {
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
  includeNestedSlots = false,
  skipSlots?: ReadonlySet<T.Object3D>,
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

    const hostInv = hostRoot.matrixWorld.clone().invert();
    const minProj = measureMinAlongNormalInHost(childRoot, hostInv, n, includeNestedSlots, skipSlots);
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
        mount.attachRestPose = measureAttachRestPose(parentObj, target);
      } else {
        hostParent = parentObj;
      }
      if (mount.surface) {
        hostSurface = parentSpec.capabilities.surfaces?.find(s => s.name === mount.surface);
      }
    }

    const prefix = scopeNames ? pickUniquePrefix(childRoot, id, usedNodeNames) : undefined;
    scopeChildSubtree(childRoot, id, prefix ?? '', childCaps);

    const slotName = `Slot_${id}`;
    const slot = new T.Group();
    slot.name = slotName;
    slot.userData.compositeSlot = id;
    usedNodeNames.add(slotName);
    childRoot.traverse(node => {
      if (node.name) usedNodeNames.add(node.name);
    });

    slot.add(childRoot);
    hostParent.add(slot);
    applySlotTransform(slot, mount, childRoot, hostRoot, hostSurface, Boolean(childCaps.children?.length));

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
  includeNestedSlots = false,
  skipSlots?: ReadonlySet<T.Object3D>,
): void {
  const hostSurface = mount.surface ? hostCaps?.surfaces?.find(s => s.name === mount.surface) : undefined;
  applySlotTransform(slot, mount, childRoot, hostRoot, hostSurface, includeNestedSlots, skipSlots);
}
