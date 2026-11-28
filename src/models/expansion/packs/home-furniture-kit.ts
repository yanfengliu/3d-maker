import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { box, group, mesh, ring, shell, strut, tube } from '../../parts';
import type { Finish, Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/home-furniture';

export const HPI = Math.PI / 2;

export function matte(color: string, roughness = 0.84, name = 'Furniture matte'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({ name, color, roughness, metalness: 0, side: T.FrontSide });
}

export function glassPane(parent: T.Object3D, at: Point, size: Point): T.Mesh {
  const mat = new T.MeshStandardMaterial({
    name: 'Cabinet glass', color: '#b4dfe6', metalness: 0.1, roughness: 0.08,
    transparent: true, opacity: 0.24, depthWrite: false, side: T.FrontSide,
  });
  const part = box(parent, at, size, mat);
  part.castShadow = false;
  return part;
}

export function orb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, scale?: Point): T.Mesh {
  const part = mesh(parent, new T.SphereGeometry(r, hd ? 20 : 8, hd ? 14 : 6), mat, at);
  if (scale) part.scale.set(...scale);
  return part;
}

export function torus(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean): T.Mesh {
  return mesh(parent, new T.TorusGeometry(r, t, hd ? 12 : 6, hd ? 28 : 12), mat, at);
}

export function cyl(
  parent: T.Object3D, at: Point, rt: number, rb: number, h: number, mat: T.Material, axis: Axis, sides = 12,
): T.Mesh {
  const part = tube(parent, at, rt, rb, h, mat, sides);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

export function slideTrack(node: string, rest: Point, axis: 0 | 1 | 2, times: number[], offsets: number[]): T.VectorKeyframeTrack {
  return new T.VectorKeyframeTrack(`${node}.position`, times, offsets.flatMap(d => {
    const pt: Point = [rest[0], rest[1], rest[2]];
    pt[axis] += d;
    return pt;
  }));
}

export function turnedLeg(parent: T.Object3D, x: number, z: number, h: number, r: number, mat: T.Material, accent: T.Material, hd: boolean): void {
  tube(parent, [x, h * 0.5, z], r * 1.15, r * 0.72, h, mat, 10);
  tube(parent, [x, Math.min(0.065, h * 0.24), z], r * 1.12, r * 1.06, Math.min(0.055, h * 0.2), accent, 10);
  if (hd) orb(parent, [x, h * 0.78, z], r * 1.32, mat, hd, [1, 0.72, 1]);
}

export function casterWheel(parent: T.Object3D, name: string, at: Point, r: number, w: number, p: Finish, detail: boolean): T.Group {
  const wh = group(parent, name, at);
  const ax = group(wh, '');
  ax.rotation.z = HPI;
  ring(ax, [0, 0, 0], r, Math.max(0.022, r * 0.18), w, p.tire);
  ring(ax, [0, 0, 0], r * 0.82, Math.max(0.018, r * 0.12), w * 0.76, p.accent);
  tube(ax, [0, 0, 0], r * 0.24, r * 0.24, w * 1.15, p.dark, 10);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    strut(ax, [0, 0, 0], [Math.sin(a) * r * 0.78, 0, Math.cos(a) * r * 0.78], Math.max(0.01, r * 0.06), p.accent, 10);
  }
  if (detail) tube(ax, [0, w * 0.58, 0], r * 0.12, r * 0.14, 0.024, p.alloy, 10);
  return wh;
}

export function drawerBox(
  parent: T.Object3D, name: string, at: Point, w: number, h: number, d: number, p: Finish, detail: boolean,
): T.Group {
  const dr = group(parent, name, at);
  shell(dr, [0, 0, d * 0.44], [w, h, 0.055], p.primary, 0.14);
  box(dr, [0, -h * 0.36, 0], [w - 0.1, 0.036, d - 0.14], p.dark);
  for (const s of [-1, 1]) box(dr, [s * (w * 0.5 - 0.045), -0.02, -0.02], [0.04, h - 0.06, d - 0.06], p.primary);
  box(dr, [0, -0.02, -d * 0.46], [w - 0.06, h - 0.06, 0.04], p.primary);
  for (const sx of w > 0.65 ? [-w * 0.25, w * 0.25] : [0]) {
    box(dr, [sx, 0, d * 0.48], [0.11, 0.036, 0.028], p.accent);
    if (detail) torus(dr, [sx, -0.016, d * 0.505], 0.032, 0.011, p.accent, p.hd).scale.set(1.4, 0.75, 1);
  }
  return dr;
}

export function panelDoor(
  parent: T.Object3D, name: string, pivot: Point, width: number, height: number, dir: 1 | -1,
  p: Finish, glazed: boolean, detail: boolean,
): T.Group {
  const door = group(parent, name, pivot);
  const cx = dir * width * 0.5;
  if (glazed) {
    for (const dx of [dir * 0.04, dir * (width - 0.04)]) box(door, [dx, 0, 0], [0.075, height, 0.05], p.primary);
    for (const y of [-height * 0.5 + 0.04, height * 0.5 - 0.04]) box(door, [cx, y, 0], [width - 0.02, 0.075, 0.05], p.primary);
    glassPane(door, [cx, 0, 0], [width - 0.14, height - 0.14, 0.02]);
    if (detail) box(door, [cx, 0, 0.022], [width - 0.14, 0.024, 0.018], p.accent);
  } else {
    shell(door, [cx, 0, 0], [width, height, 0.052], p.primary, 0.12);
    box(door, [cx, 0, 0.034], [width * 0.72, height * 0.76, 0.022], p.dark);
    if (detail) box(door, [cx, 0, 0.046], [width * 0.58, height * 0.62, 0.016], p.primary);
  }
  const hx = dir * (width - 0.09);
  orb(door, [hx, 0, 0.056], 0.032, p.accent, p.hd);
  return door;
}

export function rig(
  name: string, label: string, axis: Axis, range: [number, number], describe: string, type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec {
  return { name, label, type, axis, range, describe };
}

export function det(name: string, label: string, describe: string): DetachablePartSpec {
  return { name, label, describe };
}

export function makeFurnitureDef(
  meta: ExpansionMetaItem,
  physicsBody: 'static' | 'dynamic',
  riggedParts: readonly RiggedPartSpec[],
  detachableParts: readonly DetachablePartSpec[],
  build: ProceduralAssetDef['build'],
): ProceduralAssetDef {
  return {
    id: meta.id, code: meta.code, category: meta.category, browseCategory: meta.browseCategory,
    name: meta.name, primary: meta.primary, accent: meta.accent, description: meta.description,
    physicsBody, riggedParts, detachableParts, build,
  };
}
