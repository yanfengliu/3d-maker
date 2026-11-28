import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { box, group, mesh, ring, strut, tube } from '../../parts';
import type { Finish, Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/culinary-market';

export const HPI = Math.PI / 2;

export function matte(color: string, roughness = 0.85, name = 'Market matte'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({ name, color, roughness, metalness: 0, side: T.FrontSide });
}

export function displayGlass(parent: T.Object3D, at: Point, size: Point): T.Mesh {
  const mat = new T.MeshStandardMaterial({
    name: 'Display glass', color: '#bce6ed', metalness: 0.1, roughness: 0.08,
    transparent: true, opacity: 0.25, depthWrite: false, side: T.FrontSide,
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

export function cartWheel(parent: T.Object3D, name: string, at: Point, r: number, w: number, p: Finish, detail: boolean): T.Group {
  const wheel = group(parent, name, at);
  const ax = group(wheel, '');
  ax.rotation.z = HPI;
  ring(ax, [0, 0, 0], r, Math.max(0.026, r * 0.14), w, p.tire);
  ring(ax, [0, 0, 0], r * 0.86, Math.max(0.02, r * 0.1), w * 0.78, p.accent);
  tube(ax, [0, 0, 0], r * 0.22, r * 0.22, w * 1.15, p.dark, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    strut(ax, [0, 0, 0], [Math.sin(a) * r * 0.82, 0, Math.cos(a) * r * 0.82], Math.max(0.012, r * 0.042), p.accent, 8);
  }
  if (detail) tube(ax, [0, w * 0.58, 0], r * 0.12, r * 0.14, 0.028, p.alloy, 10);
  return wheel;
}

export function stripedAwning(parent: T.Object3D, y: number, w: number, d: number, tilt: number, p: Finish): void {
  const strips = 6;
  const sw = w / strips;
  for (let i = 0; i < strips; i++) {
    const mat = i % 2 === 0 ? p.accent : p.stencil;
    const panel = box(parent, [-w * 0.5 + sw * (i + 0.5), y, 0], [sw, 0.05, d], mat);
    panel.rotation.x = tilt;
  }
}

export function rig(
  name: string, label: string, axis: Axis, range: [number, number], describe: string, type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec {
  return { name, label, type, axis, range, describe };
}

export function det(name: string, label: string, describe: string): DetachablePartSpec {
  return { name, label, describe };
}

export function makeMarketDef(
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
