import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { fastener } from '../../hd-detail';
import { box, group, light, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish, Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/vehicles-road';

export { box, fastener, group, light, mesh, ring, rotationTrack, shell, spinTrack, strut, tube };
export type { Finish, Point };

export interface PackEntrySpec {
  readonly id: string;
  readonly physicsBody: 'static' | 'dynamic';
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts?: readonly DetachablePartSpec[];
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void;
}

export const rp = (
  name: string,
  label: string,
  type: 'rotate' | 'slide',
  axis: Axis,
  range: [number, number],
  describe: string,
): RiggedPartSpec => ({ name, label, type, axis, range, describe });

export const det = (name: string, label: string, describe: string): DetachablePartSpec =>
  ({ name, label, describe });

export function tone(
  p: Finish,
  name: string,
  color: string,
  roughness = 0.65,
  metalness = 0.12,
  emissive?: string,
): T.MeshStandardMaterial {
  const safeRough = Math.max(0.28, roughness);
  const mat = p.hd
    ? new T.MeshPhysicalMaterial({
      name,
      color,
      roughness: Math.max(0.24, safeRough * 0.88),
      metalness,
      clearcoat: metalness > 0.3 ? 0.3 : 0.08,
      clearcoatRoughness: 0.32,
    })
    : new T.MeshStandardMaterial({ name, color, roughness: safeRough, metalness, flatShading: true });
  if (emissive) {
    mat.emissive.set(emissive);
    mat.emissiveIntensity = 0.45;
  }
  return mat;
}

export function rbox(parent: T.Object3D, p: Finish, at: Point, size: Point, mat: T.Material): T.Mesh {
  const thin = Math.min(...size);
  const geo = p.hd && thin >= 0.04
    ? new RoundedBoxGeometry(...size, 1, Math.min(0.018, thin * 0.16))
    : new T.BoxGeometry(...size);
  return mesh(parent, geo, mat, at);
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
  seg = 10,
): T.Mesh {
  const m = mesh(parent, new T.CylinderGeometry(top, bot, h, p.hd ? seg * 3 : seg), mat, at);
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
  seg = 9,
): T.Mesh {
  const m = mesh(parent, new T.ConeGeometry(r, h, p.hd ? seg * 3 : seg), mat, at);
  m.rotation.set(...rot);
  return m;
}

export function dome(parent: T.Object3D, p: Finish, at: Point, scale: Point, mat: T.Material, seg = 10): T.Mesh {
  const m = mesh(parent, new T.SphereGeometry(1, p.hd ? seg * 2 + 4 : seg, p.hd ? seg + 4 : Math.max(6, seg - 2)), mat, at);
  m.scale.set(...scale);
  return m;
}

export function torus(parent: T.Object3D, p: Finish, at: Point, r: number, t: number, mat: T.Material, rot: Point = [0, 0, 0]): T.Mesh {
  const m = mesh(parent, new T.TorusGeometry(r, t, p.hd ? 14 : 7, p.hd ? 30 : 12), mat, at);
  m.rotation.set(...rot);
  return m;
}

export function lathe(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  pts: readonly [number, number][],
  mat: T.Material,
  rot: Point = [0, 0, 0],
  seg = 10,
): T.Mesh {
  const geo = new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), p.hd ? seg * 3 : seg);
  geo.normalizeNormals();
  const m = mesh(parent, geo, mat, at);
  m.rotation.set(...rot);
  return m;
}

export function slideTrack(node: string, axis: Axis, base: Point, times: number[], offsets: number[]) {
  const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  return new T.VectorKeyframeTrack(node + '.position', times, offsets.flatMap(off => {
    const pt: Point = [base[0], base[1], base[2]];
    pt[idx] += off;
    return pt;
  }));
}

export const sway = (node: string, axis: Axis, dur: number, lo: number, hi: number) =>
  rotationTrack(node, axis, [0, dur * 0.25, dur * 0.75, dur], [0, hi, lo, 0]);

export function wheel(
  parent: T.Object3D,
  name: string,
  at: Point,
  r: number,
  w: number,
  p: Finish,
  detail: boolean,
  rim: T.Material = p.alloy,
  spokes = 5,
): T.Group {
  const hub = group(parent, name, at);
  const axle = group(hub, '');
  axle.rotation.z = Math.PI / 2;
  cyl(axle, p, [0, 0, 0], r, r, w, p.tire, [0, 0, 0], 10);
  cyl(axle, p, [0, 0, 0], r * 0.62, r * 0.62, w + 0.024, rim, [0, 0, 0], 10);
  cyl(axle, p, [0, 0, 0], r * 0.24, r * 0.24, w + 0.044, p.dark, [0, 0, 0], 8);
  if (detail) {
    for (let i = 0; i < spokes; i++) {
      const a = (i * Math.PI * 2) / spokes;
      for (const s of [-1, 1]) {
        box(axle, [Math.sin(a) * r * 0.4, s * (w * 0.5 + 0.022), Math.cos(a) * r * 0.4], [r * 0.12, 0.018, r * 0.34], p.edge).rotation.y = a;
      }
    }
    if (p.hd) fastener(axle, [0, w * 0.5 + 0.032, 0], p, Math.min(0.028, r * 0.11));
  }
  return hub;
}

export function axleWheels(
  parent: T.Object3D,
  halfTrack: number,
  r: number,
  z: number,
  w: number,
  p: Finish,
  detail: boolean,
  rim: T.Material = p.alloy,
  spokes = 5,
  names: readonly [string, string] = ['', ''],
) {
  strut(parent, [-halfTrack, r, z], [halfTrack, r, z], Math.min(0.055, r * 0.18), p.dark, 8);
  wheel(parent, names[0], [halfTrack, r, z], r, w, p, detail, rim, spokes);
  wheel(parent, names[1], [-halfTrack, r, z], r, w, p, detail, rim, spokes);
}

export function lightbar(parent: T.Object3D, p: Finish, at: Point, w: number, matL: T.Material, matR: T.Material) {
  const bar = group(parent, '', at);
  rbox(bar, p, [0, 0.02, 0], [w, 0.04, 0.18], p.dark);
  rbox(bar, p, [-w * 0.28, 0.08, 0], [w * 0.38, 0.085, 0.16], matL);
  rbox(bar, p, [w * 0.28, 0.08, 0], [w * 0.38, 0.085, 0.16], matR);
  rbox(bar, p, [0, 0.08, 0], [w * 0.16, 0.075, 0.14], p.stencil);
  return bar;
}

export function buildPack(
  meta: readonly ExpansionMetaItem[],
  specs: readonly PackEntrySpec[],
): readonly ProceduralAssetDef[] {
  const byId = new Map(specs.map(s => [s.id, s]));
  return meta.map(m => {
    const spec = byId.get(m.id);
    if (!spec) throw new Error('Missing builder spec for ' + m.id);
    return {
      id: m.id,
      code: m.code,
      category: m.category,
      browseCategory: m.browseCategory,
      name: m.name,
      primary: m.primary,
      accent: m.accent,
      description: m.description,
      physicsBody: spec.physicsBody,
      riggedParts: spec.riggedParts,
      ...(spec.detachableParts ? { detachableParts: spec.detachableParts } : {}),
      build: spec.build,
    };
  });
}
