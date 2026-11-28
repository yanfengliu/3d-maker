import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { fastener } from '../../hd-detail';
import { box, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube, type Finish, type Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/attachments-wearables';

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

export function gearAsset(
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

export function cone(parent: T.Object3D, at: Point, r: number, h: number, mat: T.Material, hd: boolean, sides = 10) {
  return mesh(parent, new T.ConeGeometry(r, h, hd ? sides * 3 : sides), mat, at);
}

export function torus(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean, arc = Math.PI * 2) {
  return mesh(parent, new T.TorusGeometry(r, t, hd ? 14 : 6, hd ? 32 : 12, arc), mat, at);
}

export function lathe(parent: T.Object3D, at: Point, profile: readonly [number, number][], mat: T.Material, hd: boolean, sides = 12) {
  const geom = new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), hd ? sides * 3 : sides);
  geom.normalizeNormals();
  return mesh(parent, geom, mat, at);
}

export function hose(parent: T.Object3D, path: readonly Point[], r: number, mat: T.Material, hd: boolean) {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)));
  return mesh(parent, new T.TubeGeometry(curve, hd ? 20 : 8, r, hd ? 10 : 5), mat, [0, 0, 0]);
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

/** Grounded plinth base (minY = 0) with optional pedestal post and corner fasteners in HD. */
export function addPlinth(parent: T.Object3D, p: Finish, detail: boolean, w = 0.84, d = 0.78, h = 0.12, postH = 0.36) {
  shell(parent, [0, h * 0.5, 0], [w, h, d], p.dark, 0.24);
  if (postH > 0) {
    tube(parent, [0, h + postH * 0.5 - 0.02, 0], 0.09, 0.13, postH + 0.04, p.edge, 12);
    ring(parent, [0, h + 0.02, 0], 0.16, 0.032, 0.045, p.alloy);
  }
  if (detail) {
    box(parent, [0, h * 0.52, d * 0.5 + 0.012], [w * 0.34, h * 0.45, 0.02], p.accent);
    if (p.hd) {
      for (const sx of [-w * 0.36, w * 0.36]) fastener(parent, [sx, h + 0.008, d * 0.34], p, 0.022);
    }
  }
}

/** Grounded twin-strut harness stand (minY = 0) for backpacks and wing rigs. */
export function addHarnessStand(parent: T.Object3D, p: Finish, detail: boolean, w = 0.84, d = 0.72, railH = 0.62) {
  shell(parent, [0, 0.06, 0], [w, 0.12, d], p.dark, 0.24);
  for (const sx of [-0.28, 0.28]) {
    strut(parent, [sx, 0.09, -0.14], [sx, railH, -0.14], 0.03, p.edge, 10);
    strut(parent, [sx, 0.09, 0.18], [sx, railH * 0.55, -0.14], 0.024, p.edge, 10);
  }
  strut(parent, [-0.28, railH * 0.75, -0.14], [0.28, railH * 0.75, -0.14], 0.026, p.alloy, 10);
  if (detail) {
    box(parent, [0, 0.065, d * 0.5 + 0.012], [0.3, 0.055, 0.02], p.accent);
    if (p.hd) for (const sx of [-0.32, 0.32]) fastener(parent, [sx, 0.126, 0.24], p, 0.024);
  }
}
