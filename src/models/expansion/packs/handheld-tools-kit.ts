import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { fastener } from '../../hd-detail';
import { box, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube, type Finish, type Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/handheld-tools';

export { box, fastener, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube };
export type { Finish, Point };

export const HPI = Math.PI / 2;

export function rig(
  name: string, label: string, axis: Axis, range: [number, number], describe: string,
  type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec {
  return { name, label, type, axis, range, describe };
}

export function det(name: string, label: string, describe: string): DetachablePartSpec {
  return { name, label, describe };
}

export function toolAsset(
  meta: ExpansionMetaItem,
  riggedParts: readonly RiggedPartSpec[],
  detachableParts: readonly DetachablePartSpec[],
  build: (root: T.Group, p: Finish, detail: boolean) => void,
): ProceduralAssetDef {
  return {
    id: meta.id, code: meta.code, category: meta.category, browseCategory: meta.browseCategory,
    name: meta.name, primary: meta.primary, accent: meta.accent, description: meta.description,
    physicsBody: 'dynamic', riggedParts, detachableParts, build,
  };
}

export function orb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, scale?: Point) {
  const part = mesh(parent, new T.SphereGeometry(r, hd ? 22 : 8, hd ? 14 : 6), mat, at);
  if (scale) part.scale.set(...scale);
  return part;
}

export function cone(parent: T.Object3D, at: Point, r: number, h: number, mat: T.Material, hd: boolean, sides = 12) {
  return mesh(parent, new T.ConeGeometry(r, h, hd ? sides * 3 : sides), mat, at);
}

export function torus(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean, arc = Math.PI * 2) {
  return mesh(parent, new T.TorusGeometry(r, t, hd ? 14 : 6, hd ? 32 : 12, arc), mat, at);
}

export function solidLathe(
  parent: T.Object3D, at: Point, profile: readonly [number, number][], mat: T.Material, hd: boolean, sides = 12,
) {
  const first = profile[0];
  const last = profile[profile.length - 1];
  if (!first || !last) throw new Error('solidLathe requires a non-empty profile');
  const pts: T.Vector2[] = [
    new T.Vector2(0, first[1]),
    ...profile.map(([r, y]) => new T.Vector2(r, y)),
    new T.Vector2(0, last[1]),
  ];
  const geom = new T.LatheGeometry(pts, hd ? sides * 3 : sides);
  geom.normalizeNormals();
  return mesh(parent, geom, mat, at);
}

export function hollowBell(
  parent: T.Object3D, at: Point, profile: readonly [number, number][], wall: number,
  mat: T.Material, hd: boolean, sides = 14,
) {
  const first = profile[0];
  const last = profile[profile.length - 1];
  if (!first || !last) throw new Error('hollowBell requires a non-empty profile');
  const innerFloorY = Math.min(last[1] - 0.01, first[1] + wall);
  const pts: T.Vector2[] = [
    new T.Vector2(0, first[1]),
    ...profile.map(([r, y]) => new T.Vector2(r, y)),
  ];
  for (let i = profile.length - 1; i >= 0; i--) {
    const pt = profile[i];
    if (!pt) continue;
    const ir = Math.max(0.008, pt[0] - wall);
    const iy = i === 0 ? innerFloorY : Math.max(innerFloorY, pt[1]);
    pts.push(new T.Vector2(ir, iy));
  }
  pts.push(new T.Vector2(0, innerFloorY));
  const geom = new T.LatheGeometry(pts, hd ? sides * 3 : sides);
  geom.normalizeNormals();
  return mesh(parent, geom, mat, at);
}

export function hose(parent: T.Object3D, path: readonly Point[], r: number, mat: T.Material, hd: boolean) {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)));
  return mesh(parent, new T.TubeGeometry(curve, hd ? 22 : 8, r, hd ? 10 : 5), mat, [0, 0, 0]);
}

export function coil(
  parent: T.Object3D, from: Point, to: Point, turns: number, radius: number, wireR: number,
  mat: T.Material, hd: boolean,
) {
  const start = new T.Vector3(...from);
  const end = new T.Vector3(...to);
  const delta = end.clone().sub(start);
  const len = delta.length();
  const dir = delta.clone().normalize();
  const ref = Math.abs(dir.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0);
  const u = new T.Vector3().crossVectors(dir, ref).normalize();
  const v = new T.Vector3().crossVectors(dir, u).normalize();
  const steps = Math.max(18, Math.round(turns * (hd ? 12 : 6)));
  const pts: T.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const env = Math.min(1, t * 7, (1 - t) * 7);
    const a = t * turns * Math.PI * 2;
    const p = start.clone().addScaledVector(dir, t * len)
      .addScaledVector(u, Math.cos(a) * radius * env)
      .addScaledVector(v, Math.sin(a) * radius * env);
    pts.push(p);
  }
  const curve = new T.CatmullRomCurve3(pts);
  return mesh(parent, new T.TubeGeometry(curve, hd ? steps * 2 : steps, wireR, hd ? 10 : 5), mat, [0, 0, 0]);
}

export function cyl(parent: T.Object3D, at: Point, rt: number, rb: number, h: number, mat: T.Material, axis: Axis, sides = 12) {
  const part = tube(parent, at, rt, rb, h, mat, sides);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

export function band(parent: T.Object3D, at: Point, r: number, t: number, h: number, mat: T.Material, axis: Axis) {
  const part = ring(parent, at, r, t, h, mat);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

export function slideTrack(node: string, rest: Point, axis: 0 | 1 | 2, times: number[], offsets: number[]) {
  const values = offsets.flatMap(d => {
    const pt: Point = [rest[0], rest[1], rest[2]];
    pt[axis] += d;
    return pt;
  });
  return new T.VectorKeyframeTrack(node + '.position', times, values);
}

/** Grounded plinth base (minY = 0) with optional pedestal post and non-coplanar plaque. */
export function addPlinth(
  parent: T.Object3D, p: Finish, detail: boolean, w = 0.84, d = 0.78, h = 0.11, postH = 0,
) {
  shell(parent, [0, h * 0.5, 0], [w, h, d], p.dark, 0.22);
  if (postH > 0) {
    tube(parent, [0, h + postH * 0.5 - 0.02, 0], 0.075, 0.115, postH + 0.04, p.edge, 12);
    ring(parent, [0, h + 0.028, 0], 0.145, 0.028, 0.04, p.alloy);
  }
  if (detail) {
    box(parent, [0, h * 0.52, d * 0.5 + 0.006], [w * 0.34, h * 0.42, 0.028], p.accent);
    if (p.hd) for (const sx of [-w * 0.36, w * 0.36]) fastener(parent, [sx, h + 0.008, d * 0.34], p, 0.022);
  }
}

/** Grounded raised-rim workshop/clinic tray (minY = 0) with recessed inner pad. */
export function addTray(
  parent: T.Object3D, p: Finish, detail: boolean,
  w = 0.98, d = 0.78, h = 0.08, rimH = 0.055, baseMat?: T.Material, padMat?: T.Material,
) {
  const mat = baseMat ?? p.dark;
  const pad = padMat ?? p.edge;
  shell(parent, [0, h * 0.5, 0], [w, h, d], mat, 0.16);
  const rt = 0.045;
  const ry = h + rimH * 0.5 - 0.015;
  for (const sz of [-d * 0.5 + 0.045, d * 0.5 - 0.045]) box(parent, [0, ry, sz], [w - 0.08, rimH + 0.02, rt], mat);
  for (const sx of [-w * 0.5 + 0.045, w * 0.5 - 0.045]) box(parent, [sx, ry, 0], [rt, rimH + 0.02, d - 0.08], mat);
  shell(parent, [0, h + 0.008, 0], [w - 0.18, 0.028, d - 0.18], pad, 0.12);
  if (detail) {
    box(parent, [0, h * 0.52, d * 0.5 + 0.006], [w * 0.28, h * 0.44, 0.026], p.stencil);
    if (p.hd) for (const sx of [-w * 0.42, w * 0.42]) fastener(parent, [sx, h + rimH + 0.006, d * 0.42], p, 0.018);
  }
}
