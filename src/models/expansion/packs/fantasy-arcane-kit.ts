import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import { formedShell } from '../../hd-geometry';
import { group, mesh, rotationTrack, spinTrack, type Finish, type Point } from '../../parts';

export { group, mesh, rotationTrack, spinTrack };
export type { Finish, Point };

export const HPI = Math.PI / 2;

export const rig = (
  name: string, label: string, axis: Axis, range: [number, number], describe: string, type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec => ({ name, label, type, axis, range, describe });

export const det = (name: string, label: string, describe: string): DetachablePartSpec => ({ name, label, describe });

export const matteMat = (name: string, color: string, roughness = 0.85, hd = false): T.MeshStandardMaterial =>
  new T.MeshStandardMaterial({ name, color, roughness, metalness: 0, flatShading: !hd, side: T.FrontSide });

export const metalMat = (name: string, color: string, roughness = 0.4, metalness = 0.55, hd = false): T.MeshStandardMaterial =>
  new T.MeshStandardMaterial({ name, color, roughness, metalness, flatShading: !hd, side: T.FrontSide });

export const glowMat = (name: string, color: string, emissive: string, intensity = 0.9, hd = false): T.MeshStandardMaterial =>
  new T.MeshStandardMaterial({
    name, color, emissive, emissiveIntensity: intensity, roughness: 0.3, metalness: 0.12, flatShading: !hd, side: T.FrontSide,
  });

export const glassMat = (name: string, color = '#bcebf2', opacity = 0.3): T.MeshStandardMaterial =>
  new T.MeshStandardMaterial({
    name, color, metalness: 0.1, roughness: 0.08, transparent: true, opacity, depthWrite: false, side: T.FrontSide,
  });

export interface ArcanePalette {
  stone: T.MeshStandardMaterial; stoneDark: T.MeshStandardMaterial;
  wood: T.MeshStandardMaterial; woodDark: T.MeshStandardMaterial;
  iron: T.MeshStandardMaterial; brass: T.MeshStandardMaterial; copper: T.MeshStandardMaterial;
  bone: T.MeshStandardMaterial; parchment: T.MeshStandardMaterial; cloth: T.MeshStandardMaterial;
  ember: T.MeshStandardMaterial; flame: T.MeshStandardMaterial; rune: T.MeshStandardMaterial;
  vortex: T.MeshStandardMaterial; glass: T.MeshStandardMaterial;
}

export function arcanePalette(p: Finish): ArcanePalette {
  const hd = p.hd;
  return {
    stone: matteMat('Carved stone', '#7c7b78', 0.88, hd),
    stoneDark: matteMat('Basalt stone', '#45474e', 0.88, hd),
    wood: matteMat('Aged oak', '#6c4930', 0.84, hd),
    woodDark: matteMat('Charred oak', '#412c1f', 0.86, hd),
    iron: metalMat('Wrought iron', '#3a3f46', 0.46, 0.48, hd),
    brass: metalMat('Burnished brass', '#cda047', 0.36, 0.62, hd),
    copper: metalMat('Hammered copper', '#b8683a', 0.38, 0.58, hd),
    bone: matteMat('Bleached bone', '#e1d7c0', 0.82, hd),
    parchment: matteMat('Illuminated parchment', '#ede3c9', 0.86, hd),
    cloth: matteMat('Altar velvet', '#8b2638', 0.9, hd),
    ember: glowMat('Glowing ember', '#e85b1c', '#d93d08', 0.95, hd),
    flame: glowMat('Arcane flame', '#ffb830', '#ff6a00', 1.1, hd),
    rune: glowMat('Rune glow', '#59f2e6', '#1bc9c0', 0.95, hd),
    vortex: glowMat('Vortex core', '#9866ff', '#6228e6', 0.95, hd),
    glass: glassMat('Alchemical glass', '#b8e8ef', 0.3),
  };
}

export function kBox(parent: T.Object3D, at: Point, size: Point, mat: T.Material, hd: boolean): T.Mesh {
  const thin = Math.min(size[0], size[1], size[2]);
  const geo = hd && thin >= 0.032
    ? new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(0.014, thin * 0.15))
    : new T.BoxGeometry(size[0], size[1], size[2]);
  return mesh(parent, geo, mat, at);
}

export const kShell = (parent: T.Object3D, at: Point, size: Point, mat: T.Material, hd: boolean, cut = 0.18): T.Mesh =>
  mesh(parent, hd ? formedShell(size[0], size[1], size[2], cut) : new T.BoxGeometry(size[0], size[1], size[2]), mat, at);

export function kCyl(
  parent: T.Object3D, at: Point, rt: number, rb: number, h: number, mat: T.Material, hd: boolean, axis: Axis = 'y', stdSides = 8,
): T.Mesh {
  const part = mesh(parent, new T.CylinderGeometry(rt, rb, h, hd ? Math.max(18, stdSides * 3) : stdSides), mat, at);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

export function kOrb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, scale?: Point): T.Mesh {
  const part = mesh(parent, new T.SphereGeometry(r, hd ? 20 : 7, hd ? 14 : 5), mat, at);
  if (scale) part.scale.set(scale[0], scale[1], scale[2]);
  return part;
}

export function kTorus(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean, axis: Axis = 'z'): T.Mesh {
  const part = mesh(parent, new T.TorusGeometry(r, t, hd ? 12 : 6, hd ? 28 : 10), mat, at);
  if (axis === 'y') part.rotation.x = HPI;
  else if (axis === 'x') part.rotation.y = HPI;
  return part;
}

export function kRing(
  parent: T.Object3D, at: Point, radius: number, thick: number, height: number, mat: T.Material, hd: boolean, axis: Axis = 'y',
): T.Mesh {
  const inner = Math.max(0.01, radius - thick);
  const bev = Math.min(0.012, thick * 0.25, height * 0.22);
  const pts = [
    new T.Vector2(inner, -height / 2), new T.Vector2(radius - bev, -height / 2),
    new T.Vector2(radius, -height / 2 + bev), new T.Vector2(radius, height / 2 - bev),
    new T.Vector2(radius - bev, height / 2), new T.Vector2(inner, height / 2), new T.Vector2(inner, -height / 2),
  ];
  const geo = new T.LatheGeometry(pts, hd ? 36 : 10);
  geo.normalizeNormals();
  const part = mesh(parent, geo, mat, at);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

export function kStrut(parent: T.Object3D, a: Point, b: Point, r: number, mat: T.Material, hd: boolean, stdSides = 6): T.Mesh {
  const start = new T.Vector3(a[0], a[1], a[2]), end = new T.Vector3(b[0], b[1], b[2]);
  const dir = end.clone().sub(start);
  const part = kCyl(parent, [0, 0, 0], r, r, Math.max(0.004, dir.length()), mat, hd, 'y', stdSides);
  part.position.copy(start.add(end).multiplyScalar(0.5));
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  return part;
}

export function kBowl(
  parent: T.Object3D, at: Point, rBot: number, rMid: number, rTop: number, h: number, wall: number, mat: T.Material, hd: boolean, stdSides = 10,
): T.Mesh {
  const w = Math.min(wall, rBot * 0.4, rTop * 0.4, h * 0.35);
  const pts = [
    new T.Vector2(0, 0), new T.Vector2(rBot, 0), new T.Vector2(rMid, h * 0.45), new T.Vector2(rTop, h),
    new T.Vector2(Math.max(0.02, rTop - w), h), new T.Vector2(Math.max(0.02, rMid - w), h * 0.46),
    new T.Vector2(Math.max(0.02, rBot - w * 0.7), w), new T.Vector2(0, w),
  ];
  const geo = new T.LatheGeometry(pts, hd ? 30 : stdSides);
  geo.normalizeNormals();
  return mesh(parent, geo, mat, at);
}

export function kCrystal(parent: T.Object3D, at: Point, r: number, h: number, mat: T.Material, hd: boolean): T.Mesh {
  const pts = [
    new T.Vector2(0, -h * 0.5), new T.Vector2(r * 0.85, -h * 0.2), new T.Vector2(r, 0),
    new T.Vector2(r * 0.85, h * 0.2), new T.Vector2(0, h * 0.5),
  ];
  const geo = new T.LatheGeometry(pts, hd ? 18 : 6);
  geo.normalizeNormals();
  return mesh(parent, geo, mat, at);
}

export function kArch(
  parent: T.Object3D, at: Point, radius: number, thick: number, depth: number, mat: T.Material, hd: boolean, count = 7, keyMat?: T.Material,
): void {
  const mid = Math.floor(count / 2);
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * (i + 0.5)) / count;
    const isKey = i === mid;
    const w = ((Math.PI * radius) / count) * (isKey ? 1.2 : 1.14);
    const h = thick * (isKey ? 1.24 : 1);
    const d = depth + (isKey ? 0.045 : (i % 2) * 0.022);
    kBox(parent, [at[0] + Math.cos(a) * radius, at[1] + Math.sin(a) * radius, at[2]], [w, h, d], isKey ? (keyMat ?? mat) : mat, hd).rotation.z = a - HPI;
  }
}

export function kChain(parent: T.Object3D, a: Point, b: Point, linkR: number, wireR: number, mat: T.Material, hd: boolean): void {
  const start = new T.Vector3(a[0], a[1], a[2]), end = new T.Vector3(b[0], b[1], b[2]);
  const count = Math.max(2, Math.ceil(start.distanceTo(end) / Math.max(0.02, linkR * 1.45)) + 1);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const pos: Point = [start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t, start.z + (end.z - start.z) * t];
    kTorus(parent, pos, linkR, wireR, mat, hd, i % 2 === 0 ? 'z' : 'x').scale.set(0.75, 1.22, 1);
  }
}

export function kFlask(
  parent: T.Object3D, at: Point, r: number, h: number, liqMat: T.Material, glass: T.Material, cork: T.Material, hd: boolean,
): void {
  const [x, y, z] = at;
  kOrb(parent, [x, y + r * 0.92, z], r * 0.84, liqMat, hd, [1, 0.92, 1]);
  kOrb(parent, [x, y + r * 0.96, z], r, glass, hd, [1, 0.95, 1]).castShadow = false;
  kCyl(parent, [x, y + r * 1.7 + h * 0.25, z], r * 0.34, r * 0.4, h * 0.55, glass, hd, 'y', 8).castShadow = false;
  kRing(parent, [x, y + r * 1.7 + h * 0.52, z], r * 0.44, r * 0.14, r * 0.22, glass, hd);
  kCyl(parent, [x, y + r * 1.7 + h * 0.62, z], r * 0.3, r * 0.24, r * 0.45, cork, hd, 'y', 8);
}

export function kCandle(parent: T.Object3D, at: Point, r: number, h: number, wax: T.Material, flame: T.Material, hd: boolean): void {
  kCyl(parent, [at[0], at[1] + h * 0.5, at[2]], r * 0.92, r, h, wax, hd, 'y', 8);
  kOrb(parent, [at[0], at[1] + h + r * 1.15, at[2]], r * 0.9, flame, hd, [0.75, 1.55, 0.75]);
}

export function kGear(parent: T.Object3D, at: Point, r: number, thick: number, teeth: number, mat: T.Material, hd: boolean, axis: Axis = 'y'): T.Group {
  const g = group(parent, '', at);
  if (axis === 'x') g.rotation.z = HPI;
  else if (axis === 'z') g.rotation.x = HPI;
  kCyl(g, [0, 0, 0], r, r, thick, mat, hd, 'y', 12);
  for (let i = 0; i < teeth; i++) {
    const a = (i * Math.PI * 2) / teeth;
    kBox(g, [Math.cos(a) * (r + r * 0.12), 0, Math.sin(a) * (r + r * 0.12)], [r * 0.24, thick * 0.86, r * 0.16], mat, hd).rotation.y = -a;
  }
  return g;
}
