import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import { formedShell } from '../../hd-geometry';
import { mesh, shell } from '../../parts';
import type { Finish, Point } from '../../parts';

export const HPI = Math.PI / 2;

export function tone(color: string, roughness = 0.58, metalness = 0.12, emissive?: string): T.MeshStandardMaterial {
  const safeRough = metalness < 0.2 && !emissive ? Math.max(0.28, roughness) : roughness;
  const mat = new T.MeshStandardMaterial({ color, roughness: safeRough, metalness });
  if (emissive) mat.emissive.set(emissive);
  return mat;
}

export function glass(parent: T.Object3D, at: Point, size: Point, rot?: Point): T.Mesh {
  const mat = new T.MeshStandardMaterial({
    name: 'Acrylic glass',
    color: '#a8dce2',
    metalness: 0.1,
    roughness: 0.08,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const part = mesh(parent, new T.BoxGeometry(...size), mat, at);
  part.castShadow = false;
  if (rot) part.rotation.set(...rot);
  return part;
}

export function blk(parent: T.Object3D, at: Point, size: Point, mat: T.Material, hd: boolean, rot?: Point): T.Mesh {
  const thin = Math.min(...size);
  const geom = hd && thin >= 0.026
    ? new RoundedBoxGeometry(...size, 1, Math.min(0.016, thin * 0.2))
    : new T.BoxGeometry(...size);
  const part = mesh(parent, geom, mat, at);
  if (rot) part.rotation.set(...rot);
  return part;
}

export function slab(parent: T.Object3D, at: Point, size: Point, mat: T.Material, hd: boolean, cut = 0.16, rot?: Point): T.Mesh {
  const part = hd
    ? mesh(parent, formedShell(...size, cut), mat, at)
    : shell(parent, at, size, mat, cut);
  if (rot) part.rotation.set(...rot);
  return part;
}

export function cyl(
  parent: T.Object3D,
  at: Point,
  rt: number,
  rb: number,
  h: number,
  mat: T.Material,
  hd: boolean,
  axis: Axis = 'y',
  stdSides = 8,
): T.Mesh {
  const sides = hd ? stdSides * 3 : stdSides;
  const part = mesh(parent, new T.CylinderGeometry(rt, rb, h, sides), mat, at);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

export function rod(parent: T.Object3D, a: Point, b: Point, r: number, mat: T.Material, hd: boolean, stdSides = 6): T.Mesh {
  const start = new T.Vector3(...a);
  const end = new T.Vector3(...b);
  const dir = end.clone().sub(start);
  const len = Math.max(1e-4, dir.length());
  const sides = hd ? stdSides * 3 : stdSides;
  const part = mesh(parent, new T.CylinderGeometry(r, r, len, sides), mat, [0, 0, 0]);
  part.position.copy(start.add(end).multiplyScalar(0.5));
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  return part;
}

export function orb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, scale?: Point): T.Mesh {
  const part = mesh(parent, new T.SphereGeometry(r, hd ? 20 : 8, hd ? 12 : 6), mat, at);
  if (scale) part.scale.set(...scale);
  return part;
}

export function torus(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean, rot?: Point): T.Mesh {
  const part = mesh(parent, new T.TorusGeometry(r, t, hd ? 12 : 6, hd ? 28 : 12), mat, at);
  if (rot) part.rotation.set(...rot);
  return part;
}

export function band(
  parent: T.Object3D,
  at: Point,
  r: number,
  thick: number,
  h: number,
  mat: T.Material,
  hd: boolean,
  rot?: Point,
): T.Mesh {
  const inner = Math.max(0.004, r - thick);
  const bv = Math.min(thick * 0.28, h * 0.25, 0.012);
  const profile = [
    new T.Vector2(inner, -h / 2),
    new T.Vector2(inner, h / 2),
    new T.Vector2(r - bv, h / 2),
    new T.Vector2(r, h / 2 - bv),
    new T.Vector2(r, -h / 2 + bv),
    new T.Vector2(r - bv, -h / 2),
    new T.Vector2(inner, -h / 2),
  ].reverse();
  const geom = new T.LatheGeometry(profile, hd ? 48 : 14);
  geom.normalizeNormals();
  const part = mesh(parent, geom, mat, at);
  if (rot) part.rotation.set(...rot);
  return part;
}

export function lathe(
  parent: T.Object3D,
  at: Point,
  pts: readonly (readonly [number, number])[],
  mat: T.Material,
  hd: boolean,
  stdSides = 10,
): T.Mesh {
  const vecs = pts.map(([r, y]) => new T.Vector2(r, y));
  const geom = new T.LatheGeometry(vecs, hd ? stdSides * 3 : stdSides);
  geom.computeVertexNormals();
  return mesh(parent, geom, mat, at);
}

export function pipe(
  parent: T.Object3D,
  pts: readonly Point[],
  r: number,
  mat: T.Material,
  hd: boolean,
  capEnds = true,
): T.Mesh {
  const curve = new T.CatmullRomCurve3(pts.map(pt => new T.Vector3(...pt)));
  const segs = hd ? Math.max(18, pts.length * 8) : Math.max(8, pts.length * 3);
  const part = mesh(parent, new T.TubeGeometry(curve, segs, r, hd ? 12 : 6, false), mat, [0, 0, 0]);
  if (capEnds) {
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (first) orb(parent, first, r * 1.02, mat, hd);
    if (last) orb(parent, last, r * 1.02, mat, hd);
  }
  return part;
}

export function caster(parent: T.Object3D, at: Point, r: number, w: number, p: Finish, axis: Axis = 'x'): void {
  cyl(parent, at, r, r, w, p.tire, p.hd, axis, 8);
  cyl(parent, at, r * 0.48, r * 0.48, w * 1.18, p.alloy, p.hd, axis, 8);
}

export function bolt(parent: T.Object3D, at: Point, p: Finish, r = 0.022, axis: Axis = 'y'): T.Mesh {
  return cyl(parent, at, r, r * 1.08, r * 0.55, p.alloy, p.hd, axis, 6);
}

export function slideTrack(node: string, rest: Point, axis: 0 | 1 | 2, times: number[], offsets: number[]): T.VectorKeyframeTrack {
  return new T.VectorKeyframeTrack(
    node + '.position',
    times,
    offsets.flatMap(d => {
      const pt: Point = [rest[0], rest[1], rest[2]];
      pt[axis] += d;
      return pt;
    }),
  );
}

export const rig = (
  name: string,
  label: string,
  axis: Axis,
  range: [number, number],
  describe: string,
  type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec => ({ name, label, type, axis, range, describe });

export const det = (name: string, label: string, describe: string): DetachablePartSpec => ({ name, label, describe });
