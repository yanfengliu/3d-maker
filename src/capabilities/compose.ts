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
  findLegacyPhysicsOverride,
  isAssetRootHidden,
  measureRelativeTransform,
  pickUniquePrefix,
  scopeChildSubtree,
  validateScopedLengths,
} from './compose-scope';
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
  readCapabilities,
  writeCapabilities,
  type AssetCapabilities,
  type SurfaceSpec,
} from './schema';

export { computeCompositeBodies, measureRelativeTransform, pickUniquePrefix, scopeChildSubtree, validateScopedLengths };
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

interface PreparedPart {
  id: string;
  labelOverride?: string;
  childRoot: T.Object3D;
  existingCaps?: AssetCapabilities;
  preservedRecipe?: Record<string, unknown>;
  mount: CompositeMountSpec;
  prefix?: string;
}

function sharesHierarchy(a: T.Object3D, b: T.Object3D): boolean {
  let cur: T.Object3D | null = a;
  while (cur) { if (cur === b) return true; cur = cur.parent; }
  cur = b;
  while (cur) { if (cur === a) return true; cur = cur.parent; }
  return false;
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

  const rootName = options.name.trim();
  const scopeNames = options.scopeNames !== false;

  // Stage 1 (zero-mutation pre-flight): validate IDs, distinct object references, parent order, attachNodes, and
  // scoped lengths across ALL parts BEFORE mutating matrices, renaming nodes, or reparenting ANY caller object!
  const prepared: PreparedPart[] = [];
  const plannedById = new Map<string, PreparedPart>();
  const seenObjects: T.Object3D[] = [];
  const plannedNames = new Set<string>([rootName]);

  for (const part of options.parts) {
    const id = part.id.trim();
    if (!COMPOSITE_CHILD_ID_PATTERN.test(id)) {
      throw new Error(`Invalid composite child id "${part.id}". Use letters, numbers, hyphens, or underscores.`);
    }
    if (plannedById.has(id)) throw new Error(`Duplicate composite child id "${id}".`);

    let childRoot: T.Object3D;
    let preservedRecipe: Record<string, unknown> | undefined;
    if (part.object) {
      childRoot = part.object;
      if (seenObjects.some(prev => sharesHierarchy(prev, childRoot))) {
        throw new Error(`Composite part "${id}" reuses or overlaps an Object3D already supplied by another part; clone it first.`);
      }
      seenObjects.push(childRoot);
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

    // Pure read-only manifest lookup (never calls updateMatrixWorld on caller objects during pre-flight!).
    const existingCaps = readCapabilities(childRoot) ?? undefined;
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

    if (mount.parent) {
      const parentPrep = plannedById.get(mount.parent);
      if (!parentPrep) {
        throw new Error(`Part "${id}" references unknown or later-declared parent "${mount.parent}". Declare parent parts first.`);
      }
      if (mount.attachNode && !findOwnNodeByName(parentPrep.childRoot, mount.attachNode)) {
        throw new Error(`Part "${id}" attachNode "${mount.attachNode}" not found inside parent "${mount.parent}".`);
      }
    }

    const prefix = scopeNames ? pickUniquePrefix(childRoot, id, plannedNames) : undefined;
    validateScopedLengths(childRoot, id, prefix ?? '', existingCaps);
    plannedNames.add(`Slot_${id}`);
    childRoot.traverse(node => {
      if (node.name) plannedNames.add(prefix ? `${prefix}${node.name}` : node.name);
    });

    const entry: PreparedPart = {
      id,
      ...(part.label?.trim() ? { labelOverride: part.label.trim() } : {}),
      childRoot,
      ...(existingCaps ? { existingCaps } : {}),
      ...(preservedRecipe ? { preservedRecipe } : {}),
      mount,
      ...(prefix ? { prefix } : {}),
    };
    prepared.push(entry);
    plannedById.set(id, entry);
  }

  // Stage 2 (commit): all parts passed pre-flight; inspect, upgrade legacy physics locks, scope, attach, and seat.
  const root = new T.Group();
  root.name = rootName;
  const childRootById = new Map<string, T.Object3D>();
  const childSpecById = new Map<string, CompositeChildSpec>();
  const children: CompositeChildSpec[] = [];
  const compositeClips: T.AnimationClip[] = [];

  for (const item of prepared) {
    const { id, childRoot, mount, prefix, preservedRecipe } = item;
    const childCaps = inspectAsset(childRoot);
    if (childCaps.state?.hiddenParts?.length && !childCaps.state.rootHidden) {
      if (isAssetRootHidden(childCaps, new Set(childCaps.state.hiddenParts), childRoot)) {
        childCaps.state = { ...childCaps.state, rootHidden: true };
      }
    }
    const legacyLock = !childCaps.physics?.locked ? findLegacyPhysicsOverride(childRoot) : undefined;
    if (legacyLock) {
      childCaps.physics = { ...childCaps.physics, body: legacyLock, locked: true };
    }
    let hostParent: T.Object3D = root;
    let hostRoot: T.Object3D | undefined;
    let hostSurface: SurfaceSpec | undefined;
    if (mount.parent) {
      const parentSpec = childSpecById.get(mount.parent);
      const parentObj = childRootById.get(mount.parent);
      if (parentSpec && parentObj) {
        hostRoot = parentObj;
        if (mount.attachNode) {
          const target = findOwnNodeByName(parentObj, mount.attachNode, parentSpec.nodePrefix);
          if (target) {
            hostParent = target;
            mount.attachRestPose = measureRelativeTransform(parentObj, target);
          }
        } else {
          hostParent = parentObj;
        }
        if (mount.surface) {
          hostSurface = parentSpec.capabilities.surfaces?.find(s => s.name === mount.surface);
        }
      }
    }

    scopeChildSubtree(childRoot, id, prefix ?? '', childCaps);

    const slotName = `Slot_${id}`;
    const slot = new T.Group();
    slot.name = slotName;
    slot.userData.compositeSlot = id;
    slot.add(childRoot);
    hostParent.add(slot);
    applySlotTransform(slot, mount, childRoot, hostRoot, hostSurface, Boolean(childCaps.children?.length));
    if (hostRoot) {
      mount.slotRestPose = measureRelativeTransform(hostRoot, slot);
    }

    for (const clip of childRoot.animations) {
      const scopedClip = clip.clone();
      scopedClip.name = `${id}: ${clip.name}`;
      compositeClips.push(scopedClip);
    }

    const childSpec: CompositeChildSpec = {
      id,
      label: item.labelOverride || childCaps.name,
      slotNode: slotName,
      ...(prefix ? { nodePrefix: prefix } : {}),
      mount,
      ...(preservedRecipe ? { recipe: preservedRecipe } : {}),
      capabilities: childCaps,
    };
    children.push(childSpec);
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
