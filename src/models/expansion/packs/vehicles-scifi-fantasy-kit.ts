import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { fastener } from '../../hd-detail';
import { box, group, light, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish, Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/vehicles-scifi-fantasy';

export { box, fastener, group, light, mesh, ring, rotationTrack, shell, spinTrack, strut, tube };
export type { Finish, Point };

export interface SciFiSpec {
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
  roughness = 0.62,
  metalness = 0.16,
  emissive?: string,
): T.MeshStandardMaterial {
  const safeRough = Math.max(0.28, roughness);
  const mat = p.hd
    ? new T.MeshPhysicalMaterial({
      name,
      color,
      roughness: Math.max(0.24, safeRough * 0.88),
      metalness,
      clearcoat: metalness > 0.3 ? 0.32 : 0.08,
      clearcoatRoughness: 0.3,
    })
    : new T.MeshStandardMaterial({ name, color, roughness: safeRough, metalness, flatShading: true });
  if (emissive) {
    mat.emissive.set(emissive);
    mat.emissiveIntensity = 0.5;
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
  seg = 10,
  rad = 6,
): T.Mesh {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)));
  return mesh(parent, new T.TubeGeometry(curve, p.hd ? seg * 2 : seg, r, p.hd ? rad * 2 : rad, false), mat, [0, 0, 0]);
}

export function spokeWheel(
  parent: T.Object3D,
  name: string,
  at: Point,
  r: number,
  w: number,
  p: Finish,
  detail: boolean,
  rimMat: T.Material,
  spokes = 8,
): T.Group {
  const hub = group(parent, name, at);
  const rot = group(hub, '');
  rot.rotation.z = Math.PI / 2;
  ring(rot, [0, 0, 0], r, Math.max(0.04, r * 0.14), w, rimMat);
  cyl(rot, p, [0, 0, 0], r * 0.22, r * 0.22, w + 0.05, p.dark, [0, 0, 0], 10);
  const count = detail ? spokes : Math.max(4, Math.floor(spokes / 2));
  for (let i = 0; i < count; i++) {
    const a = (i * Math.PI * 2) / count;
    rbox(rot, p, [Math.sin(a) * r * 0.48, 0, Math.cos(a) * r * 0.48], [0.032, w * 0.65, r * 0.84], rimMat).rotation.y = a;
  }
  if (detail && p.hd) fastener(rot, [0, w * 0.5 + 0.035, 0], p, Math.min(0.028, r * 0.1));
  return hub;
}

export function sailExtrude(
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

export const sway = (node: string, axis: Axis, dur: number, lo: number, hi: number) =>
  rotationTrack(node, axis, [0, dur * 0.25, dur * 0.75, dur], [0, hi, lo, 0]);

export function buildSciFiPack(
  meta: readonly ExpansionMetaItem[],
  specs: readonly SciFiSpec[],
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
