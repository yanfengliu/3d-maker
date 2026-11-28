import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { fastener } from '../../hd-detail';
import { airfoil } from '../../hd-geometry';
import { box, group, light, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish, Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/vehicles-sea-air';

export { airfoil, box, fastener, group, light, mesh, ring, rotationTrack, shell, spinTrack, strut, tube };
export type { Finish, Point };

export interface SeaAirSpec {
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
    mat.emissiveIntensity = 0.42;
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

export function lathe(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  pts: readonly [number, number][],
  mat: T.Material,
  rot: Point = [0, 0, 0],
  seg = 12,
): T.Mesh {
  const geo = new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), p.hd ? seg * 3 : seg);
  geo.normalizeNormals();
  const m = mesh(parent, geo, mat, at);
  m.rotation.set(...rot);
  return m;
}

export function arc(
  parent: T.Object3D,
  p: Finish,
  path: readonly Point[],
  r: number,
  mat: T.Material,
  seg = 12,
  rad = 6,
): T.Mesh {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)));
  return mesh(parent, new T.TubeGeometry(curve, p.hd ? seg * 2 : seg, r, p.hd ? rad * 2 : rad, false), mat, [0, 0, 0]);
}

export function billowSail(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  w: number,
  h: number,
  bulge: number,
  mat: T.Material,
): T.Mesh {
  const sh = new T.Shape();
  sh.moveTo(-w * 0.5, 0);
  sh.quadraticCurveTo(0, bulge, w * 0.5, 0);
  sh.lineTo(w * 0.5, -0.05);
  sh.quadraticCurveTo(0, bulge - 0.05, -w * 0.5, -0.05);
  sh.closePath();
  const geo = new T.ExtrudeGeometry(sh, {
    depth: h,
    curveSegments: p.hd ? 18 : 6,
    bevelEnabled: p.hd,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  return mesh(parent, geo, mat, at);
}

export function wavePlinth(parent: T.Object3D, p: Finish, w: number, len: number, h = 0.12) {
  const water = tone(p, 'Sea crest', '#2c6e8f', 0.42, 0.22);
  shell(parent, [0, h * 0.5, 0], [w, h, len], water, 0.52);
  for (const s of [-1, 1]) {
    dome(parent, p, [s * w * 0.34, h * 0.72, len * 0.18], [w * 0.16, h * 0.45, len * 0.24], p.stencil, 8);
    dome(parent, p, [s * w * 0.32, h * 0.68, -len * 0.22], [w * 0.14, h * 0.4, len * 0.2], water, 8);
  }
}

export function rotorBlades(parent: T.Object3D, p: Finish, count: number, len: number, width: number, mat: T.Material, tipMat: T.Material) {
  for (let i = 0; i < count; i++) {
    const holder = group(parent, '');
    holder.rotation.y = (i * Math.PI * 2) / count;
    if (p.hd) {
      mesh(holder, airfoil(), mat, [0, 0, 0]).scale.set(len / 0.56, 1.05, width / 0.09);
      rbox(holder, p, [len * 0.9, 0.022, -len * 0.1], [len * 0.14, 0.02, width * 0.75], tipMat);
    } else {
      box(holder, [len * 0.5, 0, 0], [len, 0.024, width], mat);
      box(holder, [len * 0.92, 0.004, 0], [len * 0.14, 0.026, width * 0.92], tipMat);
    }
  }
}

export function propHub(parent: T.Object3D, name: string, at: Point, p: Finish, radius: number, blades = 3) {
  const hub = group(parent, name, at);
  dome(hub, p, [0, 0, 0.04], [radius * 0.2, radius * 0.2, radius * 0.28], p.alloy, 8);
  for (let i = 0; i < blades; i++) {
    const arm = group(hub, '');
    arm.rotation.z = (i * Math.PI * 2) / blades;
    shell(arm, [0, radius * 0.52, 0], [radius * 0.18, radius * 0.88, 0.03], p.dark, 0.45).rotation.y = 0.28;
    rbox(arm, p, [0, radius * 0.92, 0], [radius * 0.16, radius * 0.12, 0.042], p.accent).rotation.y = 0.28;
  }
  return hub;
}

export function railBogie(parent: T.Object3D, p: Finish, detail: boolean, z: number, halfTrack = 0.5, r = 0.2) {
  shell(parent, [0, r + 0.08, z], [halfTrack * 2 + 0.08, 0.18, 0.78], p.edge, 0.3);
  for (const dz of [-0.24, 0.24]) {
    strut(parent, [-halfTrack, r, z + dz], [halfTrack, r, z + dz], 0.04, p.dark, 8);
    for (const s of [-1, 1]) {
      cyl(parent, p, [s * halfTrack, r, z + dz], r, r, 0.09, p.tire, [0, 0, Math.PI / 2], 10);
      cyl(parent, p, [s * halfTrack, r, z + dz], r * 0.62, r * 0.62, 0.11, p.alloy, [0, 0, Math.PI / 2], 10);
      if (detail) cyl(parent, p, [s * halfTrack, r, z + dz], r * 0.24, r * 0.24, 0.13, p.dark, [0, 0, Math.PI / 2], 8);
    }
  }
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

export function buildSeaAirPack(
  meta: readonly ExpansionMetaItem[],
  specs: readonly SeaAirSpec[],
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
