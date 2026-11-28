import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import { fastener } from '../../hd-detail';
import { box, group, mesh, rotationTrack, shell, spinTrack } from '../../parts';
import type { Finish, Point } from '../../parts';

export { box, fastener, group, mesh, rotationTrack, shell, spinTrack };
export type { Finish, Point };

export const HPI = Math.PI / 2;

export function glassMat(color = '#a8dce2', opacity = 0.28): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name: 'Civic glazing', color, metalness: 0.12, roughness: 0.14, transparent: true, opacity, depthWrite: false,
  });
}

export function polycarbMat(color = '#b8dae8', opacity = 0.34): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name: 'Polycarbonate', color, metalness: 0.08, roughness: 0.24, transparent: true, opacity, depthWrite: false,
  });
}

export function lampMat(color: string, emissive = color, intensity = 0.55): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name: 'Signal lamp', color, emissive, emissiveIntensity: intensity, metalness: 0.12, roughness: 0.26,
  });
}

export function matteMat(color: string, roughness = 0.78, metalness = 0.06): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({ name: 'Civic matte', color, metalness, roughness });
}

export function kbox(parent: T.Object3D, at: Point, size: Point, mat: T.Material, hd: boolean): T.Mesh {
  const thin = Math.min(size[0], size[1], size[2]);
  const geo = hd && thin >= 0.032
    ? new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(0.014, thin * 0.16))
    : new T.BoxGeometry(size[0], size[1], size[2]);
  return mesh(parent, geo, mat, at);
}

export function pane(parent: T.Object3D, at: Point, size: Point, mat?: T.Material): T.Mesh {
  const part = mesh(parent, new T.BoxGeometry(size[0], size[1], size[2]), mat ?? glassMat(), at);
  part.castShadow = false;
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
  const segs = hd ? Math.max(18, stdSides * 3) : stdSides;
  const part = mesh(parent, new T.CylinderGeometry(rt, rb, h, segs), mat, at);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

export function orb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, scale?: Point): T.Mesh {
  const part = mesh(parent, new T.SphereGeometry(r, hd ? 20 : 8, hd ? 14 : 6), mat, at);
  if (scale) part.scale.set(...scale);
  return part;
}

export function dome(parent: T.Object3D, at: Point, rx: number, ry: number, rz: number, mat: T.Material, hd: boolean): T.Mesh {
  return orb(parent, at, 1, mat, hd, [rx, ry, rz]);
}

export function torus(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean): T.Mesh {
  return mesh(parent, new T.TorusGeometry(r, t, hd ? 12 : 6, hd ? 28 : 10), mat, at);
}

export function collar(
  parent: T.Object3D,
  at: Point,
  r: number,
  t: number,
  h: number,
  mat: T.Material,
  hd: boolean,
  axis: Axis = 'y',
): T.Mesh {
  const inner = Math.max(0.004, r - t);
  const c = Math.min(t * 0.28, h * 0.22);
  const profile = [
    new T.Vector2(inner, -h / 2),
    new T.Vector2(inner, h / 2),
    new T.Vector2(r - c, h / 2),
    new T.Vector2(r, h / 2 - c),
    new T.Vector2(r, -h / 2 + c),
    new T.Vector2(r - c, -h / 2),
    new T.Vector2(inner, -h / 2),
  ].reverse();
  const geo = new T.LatheGeometry(profile, hd ? 48 : 12);
  geo.normalizeNormals();
  const part = mesh(parent, geo, mat, at);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

export function kstrut(parent: T.Object3D, a: Point, b: Point, r: number, mat: T.Material, hd: boolean, stdSides = 6): T.Mesh {
  const start = new T.Vector3(...a);
  const end = new T.Vector3(...b);
  const dir = end.clone().sub(start);
  const len = Math.max(0.002, dir.length());
  const part = cyl(parent, [0, 0, 0], r, r, len, mat, hd, 'y', stdSides);
  part.position.copy(start.add(end).multiplyScalar(0.5));
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  return part;
}

export function khose(parent: T.Object3D, path: readonly Point[], r: number, mat: T.Material, hd: boolean): T.Mesh {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)));
  const tubePart = mesh(parent, new T.TubeGeometry(curve, hd ? 18 : 7, r, hd ? 10 : 5), mat, [0, 0, 0]);
  const first = path[0];
  const last = path[path.length - 1];
  if (first) orb(parent, first, r * 1.05, mat, hd);
  if (last) orb(parent, last, r * 1.05, mat, hd);
  return tubePart;
}

export function archSlab(
  parent: T.Object3D,
  at: Point,
  span: number,
  rise: number,
  depth: number,
  thick: number,
  mat: T.Material,
  hd: boolean,
  axis: 'x' | 'z' = 'z',
): T.Mesh {
  const segs = hd ? 20 : 6;
  const shape = new T.Shape();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const x = (u - 0.5) * span;
    const y = Math.sin(u * Math.PI) * rise + thick * 0.5;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = segs; i >= 0; i--) {
    const u = i / segs;
    const x = (u - 0.5) * span;
    const y = Math.sin(u * Math.PI) * rise - thick * 0.5;
    shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: hd,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geo.translate(0, 0, -depth * 0.5);
  const part = mesh(parent, geo, mat, at);
  if (axis === 'x') part.rotation.y = HPI;
  if (mat instanceof T.MeshStandardMaterial && mat.transparent) part.castShadow = false;
  return part;
}

export function gablePrism(parent: T.Object3D, at: Point, w: number, h: number, d: number, mat: T.Material, hd: boolean): T.Mesh {
  const shape = new T.Shape();
  shape.moveTo(-w * 0.5, 0);
  shape.lineTo(w * 0.5, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: hd,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -d * 0.5);
  return mesh(parent, geo, mat, at);
}

export function boltRing(parent: T.Object3D, at: Point, r: number, count: number, p: Finish, size = 0.024): void {
  for (let i = 0; i < count; i++) {
    const a = (i * Math.PI * 2) / count;
    fastener(parent, [at[0] + Math.cos(a) * r, at[1], at[2] + Math.sin(a) * r], p, size);
  }
}

export function rig(
  name: string,
  label: string,
  axis: Axis,
  range: [number, number],
  describe: string,
  type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec {
  return { name, label, type, axis, range, describe };
}

export function det(name: string, label: string, describe: string): DetachablePartSpec {
  return { name, label, describe };
}
