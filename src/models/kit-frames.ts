import * as T from 'three';
import { humanizeLabel, type Axis, type RiggedPartSpec } from '../capabilities/schema';
import { seededNoise } from './merge-static';

export type DirectionSpec = string;

const WORD_ALIASES: Record<string, string> = {
  top: '+Y',
  bottom: '-Y',
  right: '+X',
  left: '-X',
  front: '+Z',
  back: '-Z',
};

function parseDirectionTokens(spec: DirectionSpec): { axis: Axis; sign: 1 | -1 }[] {
  const trimmed = spec.trim();
  const alias = WORD_ALIASES[trimmed.toLowerCase()];
  const normalized = alias ?? trimmed.toUpperCase();
  const out: { axis: Axis; sign: 1 | -1 }[] = [];
  const seen = new Set<Axis>();
  for (const m of normalized.matchAll(/([+-])([XYZ])/g)) {
    const sign: 1 | -1 = m[1] === '-' ? -1 : 1;
    const axis = m[2]?.toLowerCase() as Axis;
    if (!seen.has(axis)) {
      seen.add(axis);
      out.push({ axis, sign });
    }
  }
  if (!out.length) throw new Error(`Invalid direction spec "${spec}". Use "+Y", "-X+Z", "top", "bottom", etc.`);
  return out;
}

function directionToVector(axis: Axis, sign: 1 | -1): T.Vector3 {
  return axis === 'x' ? new T.Vector3(sign, 0, 0) : axis === 'y' ? new T.Vector3(0, sign, 0) : new T.Vector3(0, 0, sign);
}

/**
 * Immutable right-handed orthonormal placement frame (`x` right, `y` up, `z` outward normal)
 * for relative Three.js procedural assembly without hand-computed coordinate arithmetic.
 */
export class KitFrame {
  readonly origin: T.Vector3;
  readonly x: T.Vector3;
  readonly y: T.Vector3;
  readonly z: T.Vector3;

  constructor(origin: T.Vector3, x: T.Vector3, y: T.Vector3, z: T.Vector3) {
    this.origin = origin.clone();
    this.x = x.clone().normalize();
    this.y = y.clone().normalize();
    this.z = z.clone().normalize();
  }

  /** World-aligned frame at the origin (`x = +X`, `y = +Y`, `z = +Z`). */
  static world(origin: readonly [number, number, number] = [0, 0, 0]): KitFrame {
    return new KitFrame(
      new T.Vector3(origin[0], origin[1], origin[2]),
      new T.Vector3(1, 0, 0),
      new T.Vector3(0, 1, 0),
      new T.Vector3(0, 0, 1),
    );
  }

  /** Build a right-handed frame whose outward `z` axis points along `normal`. */
  static fromNormal(
    origin: readonly [number, number, number] | T.Vector3,
    normal: readonly [number, number, number] | T.Vector3,
    upHint?: readonly [number, number, number] | T.Vector3,
  ): KitFrame {
    const orig = origin instanceof T.Vector3 ? origin.clone() : new T.Vector3(origin[0], origin[1], origin[2]);
    const z = (normal instanceof T.Vector3 ? normal.clone() : new T.Vector3(normal[0], normal[1], normal[2]));
    if (z.lengthSq() < 1e-10) z.set(0, 1, 0);
    else z.normalize();
    let ref: T.Vector3;
    if (upHint) {
      ref = upHint instanceof T.Vector3 ? upHint.clone() : new T.Vector3(upHint[0], upHint[1], upHint[2]);
      if (ref.lengthSq() < 1e-10 || Math.abs(ref.clone().normalize().dot(z)) > 0.999) {
        ref = Math.abs(z.y) > 0.9 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0);
      }
    } else {
      ref = Math.abs(z.y) > 0.9 ? new T.Vector3(0, 0, z.y > 0 ? -1 : 1) : new T.Vector3(0, 1, 0);
    }
    const x = new T.Vector3().crossVectors(ref, z).normalize();
    const y = new T.Vector3().crossVectors(z, x).normalize();
    return new KitFrame(orig, x, y, z);
  }

  /** Return a translated copy moved `(dx, dy, dz)` along this frame's own `(x, y, z)` axes. */
  move(dx = 0, dy = 0, dz = 0): KitFrame {
    const nextOrigin = this.origin.clone()
      .addScaledVector(this.x, dx)
      .addScaledVector(this.y, dy)
      .addScaledVector(this.z, dz);
    return new KitFrame(nextOrigin, this.x, this.y, this.z);
  }

  /** Return a translated copy shifted `distance` meters along this frame's outward normal `z`. */
  offset(distance: number): KitFrame {
    return this.move(0, 0, distance);
  }

  /** Return a copy rotated `(rxDeg, ryDeg, rzDeg)` degrees around this frame's own `(x, y, z)` axes. */
  turn(rxDeg = 0, ryDeg = 0, rzDeg = 0): KitFrame {
    const q = this.quaternion();
    const localRot = new T.Quaternion().setFromEuler(
      new T.Euler(T.MathUtils.degToRad(rxDeg), T.MathUtils.degToRad(ryDeg), T.MathUtils.degToRad(rzDeg), 'XYZ'),
    );
    q.multiply(localRot).normalize();
    return new KitFrame(
      this.origin,
      new T.Vector3(1, 0, 0).applyQuaternion(q),
      new T.Vector3(0, 1, 0).applyQuaternion(q),
      new T.Vector3(0, 0, 1).applyQuaternion(q),
    );
  }

  /** Project frame-local `(dx, dy, dz)` into a `[x, y, z]` tuple in the frame's parent space. */
  point(dx = 0, dy = 0, dz = 0): [number, number, number] {
    const p = this.move(dx, dy, dz).origin;
    return [p.x, p.y, p.z];
  }

  /** Basis rotation matrix (`x`, `y`, `z` columns) with `origin` translation. */
  matrix(): T.Matrix4 {
    return new T.Matrix4().makeBasis(this.x, this.y, this.z).setPosition(this.origin);
  }

  /** Orientation quaternion mapping local `+X, +Y, +Z` onto this frame's `x, y, z`. */
  quaternion(): T.Quaternion {
    return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(this.x, this.y, this.z));
  }
}

function measureBoxInMatrix(obj: T.Object3D, invSpace: T.Matrix4, space?: T.Object3D | null): T.Box3 {
  if (space) space.updateMatrixWorld(true);
  obj.updateMatrixWorld(true);
  const box = new T.Box3();
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  obj.traverse(node => {
    if (node.userData.studioOverlay || !(node instanceof T.Mesh)) return;
    const geo = node.geometry as T.BufferGeometry;
    const pos = geo.getAttribute('position') as T.BufferAttribute | undefined;
    if (!pos || pos.count === 0) return;
    rel.multiplyMatrices(invSpace, node.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(rel);
      if (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) box.expandByPoint(v);
    }
  });
  return box;
}

function measureBoxInSpace(obj: T.Object3D, space?: T.Object3D | null): T.Box3 {
  if (space) space.updateMatrixWorld(true);
  const invSpace = space ? space.matrixWorld.clone().invert() : new T.Matrix4();
  return measureBoxInMatrix(obj, invSpace, space);
}

/**
 * Read a `KitFrame` on a face center (`"+Y"` / `"top"`), edge midpoint (`"+X+Z"`), or corner (`"+X+Y-Z"`)
 * of `obj`'s bounding box in `inSpace` (defaults to `obj.parent`, or world space when detached).
 * The frame's outward normal points along the first named direction.
 */
export function bboxFrame(obj: T.Object3D, which: DirectionSpec, inSpace?: T.Object3D): KitFrame {
  const tokens = parseDirectionTokens(which);
  const space = inSpace ?? obj.parent ?? undefined;
  const box = measureBoxInSpace(obj, space);
  const center = box.isEmpty() ? obj.position.clone() : box.getCenter(new T.Vector3());
  const origin = center.clone();
  if (!box.isEmpty()) {
    for (const tok of tokens) {
      origin[tok.axis] = tok.sign > 0 ? box.max[tok.axis] : box.min[tok.axis];
    }
  }
  const primary = tokens[0] ?? { axis: 'y' as Axis, sign: 1 as const };
  return KitFrame.fromNormal(origin, directionToVector(primary.axis, primary.sign));
}

/** Build a `KitFrame` at `(x, y, z)` and `(rx, ry, rz)` degrees inside `parent`'s local space. */
export function localFrame(
  opts: { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number } = {},
): KitFrame {
  return KitFrame.world([opts.x ?? 0, opts.y ?? 0, opts.z ?? 0]).turn(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
}

export interface PlaceOnFrameOptions {
  /** Align a bounding-box face/edge/corner of `obj` (e.g. `"bottom"` / `"-Y"`) flush onto the frame origin. */
  anchor?: DirectionSpec;
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  scale?: number | readonly [number, number, number];
  /**
   * - `false` (default): keep `obj` upright and apply only `rx/ry/rz`.
   * - `'up'`: align `obj`'s local `+Y` axis onto the frame's outward normal `z`.
   * - `'frame'`: adopt the frame's full `(x, y, z)` basis rotation.
   */
  align?: false | 'up' | 'frame';
}

/** Place `obj` onto `frame` with optional scale, orientation alignment, frame-local offset, and exact bbox anchoring. */
export function placeOnFrame<TNode extends T.Object3D>(
  obj: TNode,
  frame: KitFrame,
  opts: PlaceOnFrameOptions = {},
): TNode {
  if (opts.scale !== undefined) {
    if (typeof opts.scale === 'number') obj.scale.set(opts.scale, opts.scale, opts.scale);
    else obj.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
  }
  const movedFrame = frame.move(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  const localRot = (opts.rx || opts.ry || opts.rz)
    ? new T.Quaternion().setFromEuler(
        new T.Euler(
          T.MathUtils.degToRad(opts.rx ?? 0),
          T.MathUtils.degToRad(opts.ry ?? 0),
          T.MathUtils.degToRad(opts.rz ?? 0),
          'XYZ',
        ),
      )
    : null;
  let anchorBasis: T.Matrix4 | null = null;

  if (opts.align === 'frame') {
    const q = movedFrame.quaternion();
    if (localRot) q.multiply(localRot).normalize();
    obj.quaternion.copy(q);
    anchorBasis = new T.Matrix4().makeBasis(movedFrame.x, movedFrame.y, movedFrame.z);
  } else if (opts.align === 'up') {
    const negY = movedFrame.y.clone().negate();
    const upBasis = new T.Matrix4().makeBasis(movedFrame.x, movedFrame.z, negY);
    const q = new T.Quaternion().setFromRotationMatrix(upBasis);
    if (localRot) q.multiply(localRot).normalize();
    obj.quaternion.copy(q);
    anchorBasis = upBasis;
  } else if (localRot) {
    obj.quaternion.copy(localRot);
  }

  obj.position.copy(movedFrame.origin);
  if (opts.anchor) {
    const tokens = parseDirectionTokens(opts.anchor);
    const parent = obj.parent ?? undefined;
    if (parent) parent.updateMatrixWorld(true);
    const basisWorld = parent ? parent.matrixWorld.clone() : new T.Matrix4();
    if (anchorBasis) basisWorld.multiply(anchorBasis);
    const box = measureBoxInMatrix(obj, basisWorld.clone().invert(), parent);
    if (!box.isEmpty()) {
      const anchorPt = box.getCenter(new T.Vector3());
      for (const tok of tokens) anchorPt[tok.axis] = tok.sign > 0 ? box.max[tok.axis] : box.min[tok.axis];
      const originInAnchor = movedFrame.origin.clone();
      if (anchorBasis) originInAnchor.applyMatrix4(anchorBasis.clone().invert());
      const shift = originInAnchor.sub(anchorPt);
      if (anchorBasis) shift.applyMatrix4(anchorBasis);
      obj.position.add(shift);
    }
  }
  obj.updateMatrixWorld(true);
  return obj;
}

export interface FrameHingeOptions {
  label?: string;
  type?: 'rotate' | 'slide';
  /** Cardinal axis in the hinge group's own local space (`'x' | 'y' | 'z'`), or `'normal'` (`'z'` when aligned to frame). */
  axis?: Axis | 'normal';
  range: [number, number];
  /** Align the hinge pivot group's orientation to `frame` (default true). */
  alignFrame?: boolean;
  describe?: string;
}

/**
 * One-frame-per-joint helper: creates a named pivot `THREE.Group` at `frame` and returns its matching
 * `RiggedPartSpec` so placement and hinge declaration share one frame and never drift out of sync.
 */
export function createHingeOnFrame(
  parent: T.Object3D,
  name: string,
  frame: KitFrame,
  opts: FrameHingeOptions,
): { group: T.Group; spec: RiggedPartSpec } {
  const group = new T.Group();
  group.name = name;
  group.position.copy(frame.origin);
  if (opts.alignFrame !== false) group.quaternion.copy(frame.quaternion());
  parent.add(group);
  const axis: Axis = opts.axis === 'normal' ? 'z' : (opts.axis ?? 'y');
  const spec: RiggedPartSpec = {
    name,
    label: opts.label ?? humanizeLabel(name),
    type: opts.type ?? 'rotate',
    axis,
    range: [opts.range[0], opts.range[1]],
    ...(opts.describe ? { describe: opts.describe } : {}),
  };
  return { group, spec };
}

/** Generate a centered `nx × ny` grid of frames spaced `(px, py)` on `on` (defaults to world XZ plane facing `+Y`). */
export function gridFrames(
  nx: number,
  ny: number,
  px: number,
  py: number,
  on: KitFrame = KitFrame.fromNormal([0, 0, 0], [0, 1, 0]),
  stagger = false,
): KitFrame[] {
  const frames: KitFrame[] = [];
  const countX = Math.max(1, Math.round(nx));
  const countY = Math.max(1, Math.round(ny));
  for (let iy = 0; iy < countY; iy++) {
    const rowShift = stagger && iy % 2 === 1 ? px * 0.5 : 0;
    const dy = (iy - (countY - 1) * 0.5) * py;
    for (let ix = 0; ix < countX; ix++) {
      const dx = (ix - (countX - 1) * 0.5) * px + rowShift;
      frames.push(on.move(dx, dy, 0));
    }
  }
  return frames;
}

/** Generate `n` frames arranged on a circle of `radius` on `on` (defaults to world XZ plane facing `+Y`). */
export function ringFrames(
  n: number,
  radius: number,
  on: KitFrame = KitFrame.fromNormal([0, 0, 0], [0, 1, 0]),
  opts: { startDeg?: number; arcDeg?: number; faceOutward?: boolean } = {},
): KitFrame[] {
  const count = Math.max(1, Math.round(n));
  const startDeg = opts.startDeg ?? 0;
  const arcDeg = opts.arcDeg ?? 360;
  const closed = Math.abs(arcDeg) >= 359.999;
  const frames: KitFrame[] = [];
  for (let i = 0; i < count; i++) {
    const frac = closed ? i / count : (count === 1 ? 0 : i / (count - 1));
    const deg = startDeg + frac * arcDeg;
    const rad = T.MathUtils.degToRad(deg);
    const dx = Math.cos(rad) * radius;
    const dy = Math.sin(rad) * radius;
    const site = on.move(dx, dy, 0);
    if (opts.faceOutward) {
      const radial = site.origin.clone().sub(on.origin);
      frames.push(KitFrame.fromNormal(site.origin, radial.lengthSq() > 1e-10 ? radial : on.x, on.z));
    } else {
      frames.push(site.turn(0, 0, deg));
    }
  }
  return frames;
}

function triangularNoise(seed: number, index: number): number {
  return (seededNoise(seed, index * 2) + seededNoise(seed, index * 2 + 1)) * 0.5;
}

/** Deterministically jitter a list of frames with bounded triangular noise along each frame's own axes. */
export function jitterFrames(
  frames: readonly KitFrame[],
  opts: { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; seed?: number },
): KitFrame[] {
  const seed = opts.seed ?? 1337;
  return frames.map((f, i) => {
    const base = i * 6;
    const dx = (opts.x ?? 0) * triangularNoise(seed, base);
    const dy = (opts.y ?? 0) * triangularNoise(seed, base + 1);
    const dz = (opts.z ?? 0) * triangularNoise(seed, base + 2);
    const rx = (opts.rx ?? 0) * triangularNoise(seed, base + 3);
    const ry = (opts.ry ?? 0) * triangularNoise(seed, base + 4);
    const rz = (opts.rz ?? 0) * triangularNoise(seed, base + 5);
    return f.move(dx, dy, dz).turn(rx, ry, rz);
  });
}

/** Deterministically vary `count` scalar values within `[base - spread, base + spread]` with a triangular distribution. */
export function varyValues(base: number, spread: number, count: number, seed = 1337): number[] {
  const out: number[] = [];
  for (let i = 0; i < Math.max(0, Math.round(count)); i++) {
    out.push(base + spread * triangularNoise(seed, i));
  }
  return out;
}
