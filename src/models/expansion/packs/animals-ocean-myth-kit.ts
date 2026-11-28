import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { box, group, mesh, ring, rotationTrack, shell, strut } from '../../parts';
import type { Finish, Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/animals-ocean-myth';

export { box, group, mesh, ring, rotationTrack, shell, strut };
export type { Finish, Point };

export interface OceanMythSpec {
  readonly id: string;
  readonly physicsBody: 'static' | 'dynamic';
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts?: readonly DetachablePartSpec[];
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void;
}

export const rot = (
  name: string,
  label: string,
  axis: Axis,
  range: [number, number],
  describe: string,
): RiggedPartSpec => ({ name, label, type: 'rotate', axis, range, describe });

export const det = (name: string, label: string, describe: string): DetachablePartSpec =>
  ({ name, label, describe });

export function tone(
  p: Finish,
  name: string,
  color: string,
  roughness = 0.72,
  metalness = 0.06,
  emissive?: string,
): T.MeshStandardMaterial {
  const safeRough = Math.max(0.3, roughness);
  const mat = p.hd
    ? new T.MeshPhysicalMaterial({
      name,
      color,
      roughness: Math.max(0.26, safeRough * 0.88),
      metalness,
      clearcoat: metalness > 0.25 ? 0.28 : 0.08,
      clearcoatRoughness: 0.34,
    })
    : new T.MeshStandardMaterial({ name, color, roughness: safeRough, metalness, flatShading: true });
  if (emissive) {
    mat.emissive.set(emissive);
    mat.emissiveIntensity = 0.48;
  }
  return mat;
}

export function orb(parent: T.Object3D, p: Finish, at: Point, scale: Point, mat: T.Material, seg = 8): T.Mesh {
  const m = mesh(
    parent,
    new T.SphereGeometry(1, p.hd ? seg * 2 + 4 : seg, p.hd ? seg + 6 : Math.max(5, seg - 2)),
    mat,
    at,
  );
  m.scale.set(...scale);
  return m;
}

export function cap(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  r: number,
  len: number,
  mat: T.Material,
  rotA: Point = [0, 0, 0],
  seg = 8,
): T.Mesh {
  const m = mesh(parent, new T.CapsuleGeometry(r, len, p.hd ? 8 : 3, p.hd ? seg * 2 + 4 : seg), mat, at);
  m.rotation.set(...rotA);
  return m;
}

export function cone(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  r: number,
  h: number,
  mat: T.Material,
  rotA: Point = [0, 0, 0],
  seg = 8,
): T.Mesh {
  const m = mesh(parent, new T.ConeGeometry(r, h, p.hd ? seg * 3 : seg), mat, at);
  m.rotation.set(...rotA);
  return m;
}

export function cyl(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  top: number,
  bot: number,
  h: number,
  mat: T.Material,
  rotA: Point = [0, 0, 0],
  seg = 9,
): T.Mesh {
  const m = mesh(parent, new T.CylinderGeometry(top, bot, h, p.hd ? seg * 3 : seg), mat, at);
  m.rotation.set(...rotA);
  return m;
}

export function lathe(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  pts: readonly [number, number][],
  mat: T.Material,
  rotA: Point = [0, 0, 0],
  seg = 10,
): T.Mesh {
  const geo = new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), p.hd ? seg * 3 : seg);
  geo.normalizeNormals();
  const m = mesh(parent, geo, mat, at);
  m.rotation.set(...rotA);
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

export function eye(parent: T.Object3D, p: Finish, at: Point, r: number, detail: boolean, dir: Point = [0.25, 0.35, 0.85]) {
  orb(parent, p, at, [r, r, r], p.inset, 8);
  if (detail) {
    orb(parent, p, [at[0] + dir[0] * r, at[1] + dir[1] * r, at[2] + dir[2] * r], [r * 0.36, r * 0.36, r * 0.36], p.stencil, 6);
  }
}

export function wavePedestal(parent: T.Object3D, p: Finish, w: number, len: number, columnH: number, colZ = 0) {
  const water = tone(p, 'Ocean wave', '#2a7294', 0.44, 0.2);
  shell(parent, [0, 0.08, 0], [w, 0.16, len], water, 0.56);
  cyl(parent, p, [0, 0.08 + columnH * 0.5, colZ], 0.22, 0.34, columnH, water, [0, 0, 0], 10);
  for (const s of [-1, 1]) {
    orb(parent, p, [s * w * 0.28, 0.16, colZ + len * 0.18], [w * 0.16, 0.09, len * 0.22], p.stencil, 8);
  }
}

export function batWingGeo(p: Finish, span: number, height: number): T.ExtrudeGeometry {
  const sh = new T.Shape();
  sh.moveTo(0.02, 0);
  sh.quadraticCurveTo(span * 0.35, height * 0.9, span * 0.58, height);
  sh.quadraticCurveTo(span * 0.82, height * 0.85, span, height * 0.46);
  sh.quadraticCurveTo(span * 0.84, -height * 0.15, span * 0.72, -height * 0.32);
  sh.quadraticCurveTo(span * 0.52, -height * 0.08, span * 0.36, -height * 0.42);
  sh.quadraticCurveTo(span * 0.18, -height * 0.1, 0.02, -height * 0.32);
  sh.closePath();
  const geo = new T.ExtrudeGeometry(sh, {
    depth: 0.04,
    curveSegments: p.hd ? 16 : 6,
    bevelEnabled: p.hd,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.02);
  return geo;
}

export function quadLegs(
  parent: T.Object3D,
  p: Finish,
  halfX: number,
  frontZ: number,
  rearZ: number,
  frontH: number,
  rearH: number,
  topR: number,
  botR: number,
  legMat: T.Material,
  footMat: T.Material,
) {
  for (const s of [-1, 1]) {
    for (const [z, h] of [[frontZ, frontH], [rearZ, rearH]] as const) {
      cyl(parent, p, [s * halfX, h * 0.54, z], topR, botR, h * 0.88, legMat);
      orb(parent, p, [s * halfX, botR * 0.72, z + botR * 0.35], [botR * 1.18, botR * 0.72, botR * 1.42], footMat, 8);
    }
  }
}

export const sway = (node: string, axis: Axis, dur: number, lo: number, hi: number) =>
  rotationTrack(node, axis, [0, dur * 0.25, dur * 0.75, dur], [0, hi, lo, 0]);

export function buildOceanMythPack(
  meta: readonly ExpansionMetaItem[],
  specs: readonly OceanMythSpec[],
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
