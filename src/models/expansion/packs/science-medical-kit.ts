import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { box, group, mesh, ring, tube } from '../../parts';
import type { Finish, Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/science-medical';

export const HPI = Math.PI / 2;

export function matte(color: string, roughness = 0.84, name = 'Lab matte'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({ name, color, roughness, metalness: 0, side: T.FrontSide });
}

export function labGlass(parent: T.Object3D, at: Point, size: Point, tint = '#b5e6ee'): T.Mesh {
  const mat = new T.MeshStandardMaterial({
    name: 'Lab glass', color: tint, metalness: 0.12, roughness: 0.08,
    transparent: true, opacity: 0.28, depthWrite: false, side: T.FrontSide,
  });
  const part = box(parent, at, size, mat);
  part.castShadow = false;
  return part;
}

export function glassTube(parent: T.Object3D, at: Point, rt: number, rb: number, h: number, hd: boolean, tint = '#bce9f0'): T.Mesh {
  const mat = new T.MeshStandardMaterial({
    name: 'Lab borosilicate', color: tint, metalness: 0.12, roughness: 0.08,
    transparent: true, opacity: 0.32, depthWrite: false, side: T.FrontSide,
  });
  const part = mesh(parent, new T.CylinderGeometry(rt, rb, h, hd ? 24 : 12), mat, at);
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

export function medCaster(parent: T.Object3D, name: string, at: Point, r: number, w: number, p: Finish): T.Group {
  const wh = group(parent, name, at);
  const ax = group(wh, '');
  ax.rotation.z = HPI;
  ring(ax, [0, 0, 0], r, Math.max(0.022, r * 0.2), w, p.tire);
  tube(ax, [0, 0, 0], r * 0.72, r * 0.72, w * 0.75, p.alloy, 12);
  tube(ax, [0, 0, 0], r * 0.25, r * 0.25, w * 1.15, p.accent, 10);
  return wh;
}

export function rig(
  name: string, label: string, axis: Axis, range: [number, number], describe: string, type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec {
  return { name, label, type, axis, range, describe };
}

export function det(name: string, label: string, describe: string): DetachablePartSpec {
  return { name, label, describe };
}

export function makeScienceDef(
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
