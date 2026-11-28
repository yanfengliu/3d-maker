import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import { group, mesh, rotationTrack, spinTrack } from '../../parts';
import type { Finish, Point } from '../../parts';

export interface BiomeBuilderDef {
  readonly id: string;
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts: readonly DetachablePartSpec[];
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void;
}

export function tone(
  p: Finish,
  name: string,
  color: string,
  roughness = 0.82,
  metalness = 0.04,
  emissive?: string,
  faceted = false,
): T.MeshStandardMaterial {
  const shiny = metalness >= 0.18 || Boolean(emissive);
  const stdRough = shiny ? Math.max(0.22, roughness) : Math.max(0.26, roughness);
  const hdRough = shiny ? Math.max(0.22, roughness * 0.92) : Math.max(0.26, roughness * 0.9);
  const mat = p.hd
    ? new T.MeshPhysicalMaterial({
      name,
      color,
      roughness: hdRough,
      metalness,
      clearcoat: shiny ? 0.3 : 0.03,
      clearcoatRoughness: shiny ? 0.28 : 0.45,
      flatShading: faceted,
    })
    : new T.MeshStandardMaterial({
      name,
      color,
      roughness: stdRough,
      metalness,
      flatShading: true,
    });
  if (emissive) {
    mat.emissive.set(emissive);
    mat.emissiveIntensity = 0.42;
  }
  return mat;
}

export function waterTone(p: Finish, name: string, color: string, emissive: string): T.MeshStandardMaterial {
  return tone(p, name, color, 0.24, 0.2, emissive, false);
}

export function crystalTone(p: Finish, name: string, color: string, emissive: string): T.MeshStandardMaterial {
  return tone(p, name, color, 0.23, 0.22, emissive, true);
}

export function orb(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  scale: Point,
  mat: T.Material,
  seg = 8,
  rot: Point = [0, 0, 0],
): T.Mesh {
  const wSeg = p.hd ? Math.round(seg * 2.6) : seg;
  const hSeg = p.hd ? Math.round(seg * 1.8) : Math.max(6, Math.floor(seg * 0.72));
  const m = mesh(parent, new T.SphereGeometry(1, wSeg, hSeg), mat, at);
  m.scale.set(...scale);
  m.rotation.set(...rot);
  return m;
}

export function cone(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  r: number,
  h: number,
  mat: T.Material,
  rot: Point = [0, 0, 0],
  seg = 8,
): T.Mesh {
  const m = mesh(parent, new T.ConeGeometry(r, h, p.hd ? seg * 3 : seg, p.hd ? 2 : 1), mat, at);
  m.rotation.set(...rot);
  return m;
}

export function cyl(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  top: number,
  bot: number,
  h: number,
  mat: T.Material,
  rot: Point = [0, 0, 0],
  seg = 9,
): T.Mesh {
  const m = mesh(parent, new T.CylinderGeometry(top, bot, h, p.hd ? seg * 3 : seg, p.hd ? 2 : 1), mat, at);
  m.rotation.set(...rot);
  return m;
}

export function block(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  size: Point,
  mat: T.Material,
  rot: Point = [0, 0, 0],
): T.Mesh {
  const thin = Math.min(size[0], size[1], size[2]);
  const geo = p.hd && thin >= 0.03
    ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, Math.min(0.025, thin * 0.22))
    : new T.BoxGeometry(size[0], size[1], size[2]);
  const m = mesh(parent, geo, mat, at);
  m.rotation.set(...rot);
  return m;
}

export function lathe(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  pts: readonly (readonly [number, number])[],
  mat: T.Material,
  seg = 12,
): T.Mesh {
  const geo = new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), p.hd ? seg * 3 : seg);
  geo.normalizeNormals();
  return mesh(parent, geo, mat, at);
}

const MOUND_PROFILE: readonly (readonly [number, number])[] = [
  [0.01, 0], [1, 0], [0.97, 0.28], [0.84, 0.66], [0.54, 0.93], [0.01, 1],
];

export function mound(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  rx: number,
  ry: number,
  rz: number,
  mat: T.Material,
  seg = 12,
): T.Mesh {
  const m = lathe(parent, p, at, MOUND_PROFILE, mat, seg);
  m.scale.set(rx, ry, rz);
  return m;
}

export function mesaBase(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  rx: number,
  ry: number,
  rz: number,
  mat: T.Material,
  seg = 12,
): T.Mesh {
  const pts: readonly (readonly [number, number])[] = [
    [0.01, 0], [1, 0], [0.96, 0.34], [0.86, 0.56], [0.82, 0.88], [0.74, 0.98], [0.01, 1],
  ];
  const m = lathe(parent, p, at, pts, mat, seg);
  m.scale.set(rx, ry, rz);
  return m;
}

export function moundY(x: number, z: number, rx: number, ry: number, rz: number): number {
  const u = Math.min(1, Math.hypot(x / rx, z / rz));
  if (u <= 0.54) return ry * (1 - 0.07 * (u / 0.54));
  if (u <= 0.84) return ry * (0.93 - 0.27 * ((u - 0.54) / 0.3));
  if (u <= 0.97) return ry * (0.66 - 0.38 * ((u - 0.84) / 0.13));
  return ry * 0.28 * ((1 - u) / 0.03);
}

export function rock(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  scale: Point,
  mat: T.Material,
  seed = 1,
  rot: Point = [0, 0, 0],
): T.Mesh {
  const geo = new T.IcosahedronGeometry(1, p.hd ? 2 : 0);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const warp = 1 + 0.16 * Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 - seed) + 0.08 * Math.sin(y * 4.3 + seed * 2);
    pos.setXYZ(i, x * warp, Math.max(-0.52, y * warp), z * warp);
  }
  geo.computeVertexNormals();
  const m = mesh(parent, geo, mat, [at[0], at[1] + 0.52 * scale[1], at[2]]);
  m.scale.set(...scale);
  m.rotation.set(...rot);
  return m;
}

export function hexColumn(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  r: number,
  h: number,
  mat: T.Material,
  rot: Point = [0, 0, 0],
): T.Group {
  const g = group(parent, '', at);
  g.rotation.set(...rot);
  const bodyH = Math.max(0.06, h - 0.04);
  const hSeg = p.hd ? 5 : 1;
  mesh(g, new T.CylinderGeometry(r * 0.97, r, bodyH, 6, hSeg), mat, [0, bodyH * 0.5, 0]);
  mesh(g, new T.CylinderGeometry(r * 0.84, r * 0.97, 0.055, 6, p.hd ? 2 : 1), mat, [0, bodyH + 0.02, 0]);
  return g;
}

export function crystalPrism(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  r: number,
  h: number,
  mat: T.Material,
  rot: Point = [0, 0, 0],
): T.Group {
  const g = group(parent, '', at);
  g.rotation.set(...rot);
  const shaftH = h * 0.78;
  const tipH = h * 0.28;
  mesh(g, new T.CylinderGeometry(r * 0.84, r, shaftH, 6, p.hd ? 5 : 1), mat, [0, shaftH * 0.5, 0]);
  mesh(g, new T.ConeGeometry(r * 0.84, tipH, 6, p.hd ? 4 : 1), mat, [0, shaftH + tipH * 0.48, 0]);
  return g;
}

export function taperArc(
  parent: T.Object3D,
  p: Finish,
  path: readonly Point[],
  radiusFn: number | ((t: number) => number),
  mat: T.Material,
  seg = 10,
  rad = 6,
  crossScale: readonly [number, number] = [1, 1],
): T.Mesh {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)));
  const steps = p.hd ? Math.round(seg * 2.5) : seg;
  const sides = p.hd ? Math.round(rad * 2.5) : rad;
  const frames = curve.computeFrenetFrames(steps, false);
  const verts: number[] = [];
  const indices: number[] = [];
  const pt = new T.Vector3();
  const radiusAt = typeof radiusFn === 'number' ? () => radiusFn : radiusFn;
  const [scaleN, scaleB] = crossScale;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    curve.getPointAt(t, pt);
    const nrm = frames.normals[i] ?? new T.Vector3(1, 0, 0);
    const bin = frames.binormals[i] ?? new T.Vector3(0, 0, 1);
    const r = Math.max(0.004, radiusAt(t));
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const ca = Math.cos(a) * r * scaleN;
      const sa = Math.sin(a) * r * scaleB;
      verts.push(
        pt.x + nrm.x * ca + bin.x * sa,
        pt.y + nrm.y * ca + bin.y * sa,
        pt.z + nrm.z * ca + bin.z * sa,
      );
    }
  }

  for (let i = 0; i < steps; i++) {
    const rowA = i * sides;
    const rowB = (i + 1) * sides;
    for (let j = 0; j < sides; j++) {
      const jn = (j + 1) % sides;
      const a = rowA + j;
      const b = rowA + jn;
      const c = rowB + j;
      const d = rowB + jn;
      indices.push(a, b, c, b, d, c);
    }
  }

  const startIdx = verts.length / 3;
  curve.getPointAt(0, pt);
  verts.push(pt.x, pt.y, pt.z);
  for (let j = 0; j < sides; j++) {
    indices.push(startIdx, (j + 1) % sides, j);
  }

  const endIdx = verts.length / 3;
  curve.getPointAt(1, pt);
  verts.push(pt.x, pt.y, pt.z);
  const lastRow = steps * sides;
  for (let j = 0; j < sides; j++) {
    indices.push(endIdx, lastRow + j, lastRow + ((j + 1) % sides));
  }

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return mesh(parent, geo, mat, [0, 0, 0]);
}

export function frond(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  len: number,
  width: number,
  arch: number,
  droop: number,
  mat: T.Material,
  yaw = 0,
  pitch = 0,
): T.Group {
  const g = group(parent, '', at);
  g.rotation.set(pitch, yaw, 0, 'YXZ');
  const pts: Point[] = [
    [0, 0, 0],
    [0, arch, len * 0.38],
    [0, arch * 0.65 - droop * 0.3, len * 0.74],
    [0, -droop, len],
  ];
  taperArc(g, p, pts, t => width * (0.28 + 0.72 * Math.sin(t * Math.PI)), mat, 7, 5, [0.24, 1]);
  return g;
}

export function sway(node: string, axis: 'x' | 'y' | 'z', duration: number, lo: number, hi: number): T.QuaternionKeyframeTrack {
  return rotationTrack(node, axis, [0, duration * 0.25, duration * 0.75, duration], [0, hi, lo, 0]);
}

export function spin(node: string, axis: 'x' | 'y' | 'z', duration: number, turns = 1): T.QuaternionKeyframeTrack {
  return spinTrack(node, axis, duration, turns);
}

export function bob(
  node: string,
  duration: number,
  base: Point,
  offsets: readonly number[],
): T.VectorKeyframeTrack {
  const times = offsets.map((_, i) => (duration * i) / (offsets.length - 1));
  const values = offsets.flatMap(dy => [base[0], base[1] + dy, base[2]]);
  return new T.VectorKeyframeTrack(`${node}.position`, times, values);
}
