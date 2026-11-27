import * as T from 'three';
import type { Recipe } from '../data/recipe';
import {
  COMPOSITE_CHILD_ID_PATTERN,
  type CompositeChildSpec,
  type CompositeMountSpec,
  type PhysicsCoupling,
} from './compose-schema';
import { inspectAsset } from './runtime';
import {
  writeCapabilities,
  type AssetCapabilities,
  type AssetPhysicsSpec,
  type SurfaceSpec,
} from './schema';

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

function prefixTrackName(trackName: string, prefix: string): string {
  const dot = trackName.indexOf('.');
  if (dot <= 0) return trackName;
  const nodeName = trackName.slice(0, dot);
  if (nodeName.startsWith(prefix)) return trackName;
  return `${prefix}${nodeName}${trackName.slice(dot)}`;
}

/** Rename named nodes and animation tracks inside a child subtree so multiple identical children never collide. */
export function scopeChildSubtree(childRoot: T.Object3D, childId: string, prefix: string): void {
  childRoot.traverse(node => {
    node.userData.compositeChild = childId;
    if (!node.name) return;
    if (!node.name.startsWith(prefix)) {
      node.userData.localName = node.name;
      node.name = `${prefix}${node.name}`;
    }
  });
  for (const clip of childRoot.animations) {
    for (const track of clip.tracks) {
      track.name = prefixTrackName(track.name, prefix);
    }
  }
}

function measureLocalMinY(root: T.Object3D): number {
  root.updateMatrixWorld(true);
  const invRoot = root.matrixWorld.clone().invert();
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  let minY = Infinity;
  root.traverse(node => {
    if (!(node instanceof T.Mesh) || node.userData.studioOverlay) return;
    const geo = node.geometry as T.BufferGeometry;
    const pos = geo.getAttribute('position') as T.BufferAttribute | undefined;
    if (!pos) return;
    rel.multiplyMatrices(invRoot, node.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(rel);
      if (Number.isFinite(v.y) && v.y < minY) minY = v.y;
    }
  });
  return Number.isFinite(minY) ? minY : 0;
}

function measureLocalBox(root: T.Object3D): T.Box3 {
  root.updateMatrixWorld(true);
  const invRoot = root.matrixWorld.clone().invert();
  const box = new T.Box3();
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  root.traverse(node => {
    if (!(node instanceof T.Mesh) || node.userData.studioOverlay) return;
    const geo = node.geometry as T.BufferGeometry;
    const pos = geo.getAttribute('position') as T.BufferAttribute | undefined;
    if (!pos) return;
    rel.multiplyMatrices(invRoot, node.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(rel);
      if (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) box.expandByPoint(v);
    }
  });
  return box;
}

function applySlotTransform(
  slot: T.Object3D,
  mount: CompositeMountSpec,
  childRoot: T.Object3D,
  hostSurface?: SurfaceSpec,
): void {
  const scale = mount.scale ?? 1;
  if (typeof scale === 'number') slot.scale.set(scale, scale, scale);
  else slot.scale.set(scale[0], scale[1], scale[2]);

  const rot = mount.rotation ?? [0, 0, 0];
  slot.rotation.set(rot[0], rot[1], rot[2]);

  const offset = mount.at ?? [0, 0, 0];
  if (hostSurface) {
    const childMinY = measureLocalMinY(childRoot);
    const scaleY = typeof scale === 'number' ? scale : scale[1];
    slot.position.set(
      hostSurface.at[0] + offset[0],
      hostSurface.at[1] - childMinY * scaleY + offset[1],
      hostSurface.at[2] + offset[2],
    );
  } else {
    slot.position.set(offset[0], offset[1], offset[2]);
  }
}

function computeCompositePhysics(
  children: readonly CompositeChildSpec[],
  overrideBody?: 'static' | 'dynamic',
): AssetPhysicsSpec {
  const primary = children[0];
  const primaryBody = overrideBody ?? primary?.capabilities.physics?.body ?? 'static';
  let weldedMass = 0;
  let hasMass = false;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) continue;
    const m = child.capabilities.physics?.massKg;
    if (typeof m !== 'number' || !Number.isFinite(m) || m <= 0) continue;
    // Sum mass for the base body and every child rigidly welded onto it (surface/joint children keep independent bodies).
    if (i === 0 || child.mount.coupling === 'weld') {
      weldedMass += m;
      hasMass = true;
    }
  }
  return {
    body: primaryBody,
    ...(hasMass ? { massKg: r3(weldedMass) } : {}),
  };
}

/**
 * Compose two or more independent assets into a single hierarchical Three.js Group while preserving
 * every child's structural recipe/knobs, scoped rigged/detachable/night/decal capabilities, parallel
 * animations, and physics coupling laws (`weld` | `surface` | `joint`).
 */
export function composeAsset(options: ComposeAssetOptions): T.Group {
  if (!options.name.trim()) throw new Error('Composite asset requires a non-empty name.');
  if (!options.parts.length) throw new Error('Composite asset requires at least one child part.');

  const root = new T.Group();
  root.name = options.name.trim();
  const scopeNames = options.scopeNames !== false;
  const slotById = new Map<string, T.Group>();
  const childRootById = new Map<string, T.Object3D>();
  const childSpecById = new Map<string, CompositeChildSpec>();
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

    let hostParent: T.Object3D = root;
    let hostSurface: SurfaceSpec | undefined;
    if (mount.parent) {
      const parentSpec = childSpecById.get(mount.parent);
      const parentObj = childRootById.get(mount.parent);
      if (!parentSpec || !parentObj) {
        throw new Error(`Part "${id}" references unknown or later-declared parent "${mount.parent}". Declare parent parts first.`);
      }
      if (mount.attachNode) {
        const prefixed = parentSpec.nodePrefix ? `${parentSpec.nodePrefix}${mount.attachNode}` : mount.attachNode;
        const target = parentObj.getObjectByName(prefixed) ?? parentObj.getObjectByName(mount.attachNode);
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

    const prefix = scopeNames ? `${id}__` : undefined;
    if (prefix) scopeChildSubtree(childRoot, id, prefix);
    else childRoot.userData.compositeChild = id;

    slot.add(childRoot);
    applySlotTransform(slot, mount, childRoot, hostSurface);
    hostParent.add(slot);

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
  root.updateMatrixWorld(true);
  const overall = measureLocalBox(root);
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
): void {
  const hostSurface = mount.surface ? hostCaps?.surfaces?.find(s => s.name === mount.surface) : undefined;
  applySlotTransform(slot, mount, childRoot, hostSurface);
}
