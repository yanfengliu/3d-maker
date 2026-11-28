import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { fastener } from '../../hd-detail';
import { box, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube, type Finish, type Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/handheld-fantasy-scifi';

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

export function handheldAsset(
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

export interface CradleOpts {
  w?: number;
  d?: number;
  baseH?: number;
  postH?: number;
  span?: number;
  axis?: 'x' | 'z';
  baseMat?: T.Material;
  postMat?: T.Material;
  trimMat?: T.Material;
}

/** Grounded twin-pillar display cradle (minY = 0) with notched forks and detail plaque. */
export function addCradleStand(parent: T.Object3D, p: Finish, detail: boolean, opts: CradleOpts = {}) {
  const w = opts.w ?? 0.96, d = opts.d ?? 0.72, baseH = opts.baseH ?? 0.12;
  const postH = opts.postH ?? 0.44, span = opts.span ?? 0.28, axis = opts.axis ?? 'x';
  const bMat = opts.baseMat ?? p.dark, pMat = opts.postMat ?? p.edge, tMat = opts.trimMat ?? p.accent;
  shell(parent, [0, baseH * 0.5, 0], [w, baseH, d], bMat, 0.24);
  for (const s of [-1, 1]) {
    const px = axis === 'x' ? s * span : 0;
    const pz = axis === 'z' ? s * span : 0;
    const colW = axis === 'x' ? 0.1 : 0.16;
    const colD = axis === 'x' ? 0.16 : 0.1;
    shell(parent, [px, baseH + postH * 0.5 - 0.025, pz], [colW, postH + 0.05, colD], pMat, 0.24);
    for (const jaw of [-1, 1]) {
      const jx = axis === 'x' ? px : jaw * 0.08;
      const jz = axis === 'x' ? jaw * 0.08 : pz;
      shell(parent, [jx, baseH + postH + 0.045, jz], [0.06, 0.11, 0.06], pMat, 0.28);
    }
  }
  const railA: Point = axis === 'x' ? [-span, baseH + postH * 0.45, 0] : [0, baseH + postH * 0.45, -span];
  const railB: Point = axis === 'x' ? [span, baseH + postH * 0.45, 0] : [0, baseH + postH * 0.45, span];
  strut(parent, railA, railB, 0.026, p.alloy, 10);
  if (detail) {
    box(parent, [0, baseH * 0.5, d * 0.5 + 0.005], [w * 0.34, baseH * 0.44, 0.04], tMat);
    if (p.hd) {
      for (const sx of [-w * 0.38, w * 0.38]) {
        for (const sz of [-d * 0.34, d * 0.34]) fastener(parent, [sx, baseH + 0.006, sz], p, 0.022);
      }
    }
  }
}

/** Grounded polygonal pedestal plinth (minY = 0) with stepped collar and socket cup. */
export function addPedestalStand(
  parent: T.Object3D, p: Finish, detail: boolean,
  r = 0.44, baseH = 0.14, colH = 0.24, sides = 10,
) {
  tube(parent, [0, baseH * 0.5, 0], r * 0.92, r, baseH, p.dark, sides);
  tube(parent, [0, baseH + 0.045, 0], r * 0.68, r * 0.78, 0.13, p.edge, sides);
  ring(parent, [0, baseH + 0.125, 0], r * 0.54, 0.038, 0.052, p.accent);
  tube(parent, [0, baseH + 0.09 + colH * 0.5, 0], r * 0.3, r * 0.4, colH + 0.06, p.dark, sides);
  ring(parent, [0, baseH + 0.115 + colH, 0], r * 0.33, 0.032, 0.048, p.alloy);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const rr = r * 0.96;
      box(parent, [Math.sin(a) * rr, baseH * 0.5, Math.cos(a) * rr], [0.09, baseH * 0.42, 0.032], p.accent).rotation.y = a;
    }
    if (p.hd) {
      for (let i = 0; i < 4; i++) {
        const a = i * HPI + Math.PI / 4;
        fastener(parent, [Math.sin(a) * r * 0.74, baseH + 0.115, Math.cos(a) * r * 0.74], p, 0.022);
      }
    }
  }
}

/** Grounded sloped tech/medbay dock (minY = 0) with rear riser and status trim. */
export function addDockStand(
  parent: T.Object3D, p: Finish, detail: boolean,
  w = 0.82, d = 0.78, baseH = 0.12, riserH = 0.26,
) {
  shell(parent, [0, baseH * 0.5, 0], [w, baseH, d], p.dark, 0.24);
  shell(parent, [0, baseH + riserH * 0.5 - 0.02, -d * 0.14], [w * 0.66, riserH + 0.04, d * 0.46], p.edge, 0.24);
  shell(parent, [0, baseH + 0.04, d * 0.16], [w * 0.72, 0.1, d * 0.22], p.edge, 0.22);
  if (detail) {
    box(parent, [0, baseH * 0.5, d * 0.5 + 0.005], [w * 0.42, baseH * 0.38, 0.04], p.accent);
    for (const sx of [-w * 0.26, w * 0.26]) {
      box(parent, [sx, baseH + 0.095, d * 0.16], [0.1, 0.026, 0.09], p.optic);
    }
    if (p.hd) {
      for (const sx of [-w * 0.36, w * 0.36]) fastener(parent, [sx, baseH + 0.006, d * 0.36], p, 0.022);
    }
  }
}
