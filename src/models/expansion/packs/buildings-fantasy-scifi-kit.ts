import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { formedShell } from '../../hd-geometry';
import { group, mesh, rotationTrack, spinTrack } from '../../parts';
import type { Finish, Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/buildings-fantasy-scifi';

export { group, mesh, rotationTrack, spinTrack };
export type { Finish, Point };

export const deg = T.MathUtils.degToRad;
const UP = new T.Vector3(0, 1, 0);

export interface PackBuilderDef {
  readonly id: string;
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts: readonly DetachablePartSpec[];
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void;
}

export const rig = (
  name: string,
  label: string,
  type: 'rotate' | 'slide',
  axis: Axis,
  range: [number, number],
  describe: string,
): RiggedPartSpec => ({ name, label, type, axis, range, describe });

export const det = (name: string, label: string, describe: string): DetachablePartSpec => ({
  name,
  label,
  describe,
});

export function mergePack(
  meta: readonly ExpansionMetaItem[],
  builders: readonly PackBuilderDef[],
): readonly ProceduralAssetDef[] {
  const byId = new Map(builders.map(b => [b.id, b] as const));
  return meta.map(m => {
    const b = byId.get(m.id);
    if (!b) throw new Error(`Missing builder for ${m.id}`);
    return {
      id: m.id,
      code: m.code,
      category: m.category,
      browseCategory: m.browseCategory,
      name: m.name,
      primary: m.primary,
      accent: m.accent,
      description: m.description,
      physicsBody: 'static',
      riggedParts: b.riggedParts,
      detachableParts: b.detachableParts,
      build: b.build,
    };
  });
}

export function matte(color: string, roughness = 0.85, name = 'Matte'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({ name, color, roughness, metalness: 0, side: T.FrontSide });
}

export function metal(color: string, roughness = 0.44, metalness = 0.48, name = 'Metal'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({ name, color, roughness, metalness, side: T.FrontSide });
}

export function glow(color: string, emissive: string, intensity = 0.85, name = 'Glow'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name,
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.36,
    metalness: 0.14,
    side: T.FrontSide,
  });
}

export function glass(color: string, emissive = '#0f303a', name = 'Glass'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name,
    color,
    emissive,
    emissiveIntensity: 0.32,
    roughness: 0.26,
    metalness: 0.38,
    side: T.FrontSide,
  });
}

export function kbox(
  parent: T.Object3D,
  at: Point,
  size: [number, number, number],
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  const thin = Math.min(size[0], size[1], size[2]);
  const geo = hd && thin >= 0.045
    ? new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(0.015, thin * 0.16))
    : new T.BoxGeometry(size[0], size[1], size[2]);
  return mesh(parent, geo, mat, at);
}

export function kshell(
  parent: T.Object3D,
  at: Point,
  size: [number, number, number],
  mat: T.Material,
  hd: boolean,
  cut = 0.16,
): T.Mesh {
  if (hd) return mesh(parent, formedShell(size[0], size[1], size[2], cut), mat, at);
  const [width, height, length] = size;
  const x = width * 0.5;
  const z = length * 0.5;
  const c = Math.min(x, z) * cut;
  const b = Math.min(height * 0.19, x * 0.24, z * 0.24);
  const vertices: number[] = [];
  const indices: number[] = [];
  for (const [y, inset] of [[-height / 2, b], [-height / 2 + b, 0], [height / 2 - b, 0], [height / 2, b]] as const) {
    const w = x - inset;
    const d = z - inset;
    const k = Math.min(c, w * 0.6, d * 0.6);
    for (const [px, pz] of [
      [-w + k, d], [w - k, d], [w, d - k], [w, -d + k],
      [w - k, -d], [-w + k, -d], [-w, -d + k], [-w, d - k],
    ] as const) {
      vertices.push(px, y, pz);
    }
  }
  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8;
    for (let level = 0; level < 3; level++) {
      const a = level * 8 + i;
      const b0 = level * 8 + next;
      indices.push(a, b0, a + 8, a + 8, b0, b0 + 8);
    }
  }
  for (let i = 1; i < 7; i++) indices.push(0, i + 1, i, 24, 24 + i, 25 + i);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  const faceted = geo.toNonIndexed();
  geo.dispose();
  faceted.computeVertexNormals();
  return mesh(parent, faceted, mat, at);
}

export function kcyl(
  parent: T.Object3D,
  at: Point,
  rTop: number,
  rBot: number,
  h: number,
  mat: T.Material,
  hd: boolean,
  sides = 10,
): T.Mesh {
  const seg = hd ? sides * 3 : sides;
  return mesh(parent, new T.CylinderGeometry(rTop, rBot, h, seg, hd ? 2 : 1, false), mat, at);
}

export function kcone(
  parent: T.Object3D,
  at: Point,
  r: number,
  h: number,
  mat: T.Material,
  hd: boolean,
  sides = 10,
): T.Mesh {
  const seg = hd ? sides * 3 : sides;
  return mesh(parent, new T.ConeGeometry(r, h, seg, hd ? 2 : 1, false), mat, at);
}

export function korb(
  parent: T.Object3D,
  at: Point,
  r: number,
  mat: T.Material,
  hd: boolean,
  wSeg = 10,
  hSeg = 7,
): T.Mesh {
  return mesh(parent, new T.SphereGeometry(r, hd ? wSeg * 3 : wSeg, hd ? hSeg * 2 : hSeg), mat, at);
}

export function klathe(
  parent: T.Object3D,
  at: Point,
  pts: readonly (readonly [number, number])[],
  mat: T.Material,
  hd: boolean,
  sides = 12,
): T.Mesh {
  const vecs = pts.map(([r, y]) => new T.Vector2(r, y));
  const geo = new T.LatheGeometry(vecs, hd ? sides * 3 : sides);
  geo.normalizeNormals();
  return mesh(parent, geo, mat, at);
}

export function kdome(
  parent: T.Object3D,
  at: Point,
  r: number,
  h: number,
  mat: T.Material,
  hd: boolean,
  sides = 12,
): T.Mesh {
  const steps = hd ? 16 : 7;
  const pts: [number, number][] = [[0, 0], [r, 0]];
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push([Math.max(0, Math.cos(a) * r), Math.sin(a) * h]);
  }
  return klathe(parent, at, pts, mat, hd, sides);
}

export function ktorus(
  parent: T.Object3D,
  at: Point,
  r: number,
  tubeR: number,
  mat: T.Material,
  hd: boolean,
  rSeg = 6,
  tSeg = 14,
): T.Mesh {
  return mesh(parent, new T.TorusGeometry(r, tubeR, hd ? rSeg * 3 : rSeg, hd ? tSeg * 3 : tSeg), mat, at);
}

export function khose(
  parent: T.Object3D,
  pts: readonly Point[],
  r: number,
  mat: T.Material,
  hd: boolean,
  tSeg = 10,
  rSeg = 6,
): T.Mesh {
  const curve = new T.CatmullRomCurve3(pts.map(pt => new T.Vector3(...pt)));
  const geo = new T.TubeGeometry(curve, hd ? tSeg * 3 : tSeg, r, hd ? rSeg * 3 : rSeg, false);
  return mesh(parent, geo, mat, [0, 0, 0]);
}

export function kstrut(
  parent: T.Object3D,
  a: Point,
  b: Point,
  r: number,
  mat: T.Material,
  hd: boolean,
  sides = 8,
): T.Mesh {
  const start = new T.Vector3(...a);
  const end = new T.Vector3(...b);
  const dir = end.clone().sub(start);
  const len = Math.max(0.001, dir.length());
  const part = kcyl(parent, [0, 0, 0], r, r, len, mat, hd, sides);
  part.position.copy(start.add(end).multiplyScalar(0.5));
  part.quaternion.setFromUnitVectors(UP, dir.normalize());
  return part;
}

export function kprism(
  parent: T.Object3D,
  at: Point,
  pts: readonly (readonly [number, number])[],
  depth: number,
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  const shape = new T.Shape();
  const first = pts[0];
  if (!first) throw new Error('Empty prism polygon');
  shape.moveTo(first[0], first[1]);
  for (let i = 1; i < pts.length; i++) {
    const pt = pts[i];
    if (pt) shape.lineTo(pt[0], pt[1]);
  }
  shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: hd,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -depth / 2);
  return mesh(parent, geo, mat, at);
}

export function kgable(
  parent: T.Object3D,
  at: Point,
  w: number,
  h: number,
  d: number,
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  return kprism(parent, at, [[-w / 2, 0], [w / 2, 0], [0, h]], d, mat, hd);
}

export function kdoor(
  parent: T.Object3D,
  name: string,
  at: Point,
  w: number,
  h: number,
  leafMat: T.Material,
  frameMat: T.Material,
  p: Finish,
  hingeSide: 1 | -1 = 1,
): T.Group {
  const [x, y, z] = at;
  kbox(parent, [x, y + h / 2, z - 0.02], [w + 0.14, h + 0.1, 0.1], frameMat, p.hd);
  kbox(parent, [x, y + h / 2, z + 0.012], [w - 0.02, h - 0.02, 0.08], p.inset, p.hd);
  const pivotX = x + hingeSide * (w / 2);
  const door = group(parent, name, [pivotX, y, z + 0.045]);
  const offX = -hingeSide * (w / 2);
  kbox(door, [offX, h / 2, 0], [w, h, 0.055], leafMat, p.hd);
  kcyl(door, [offX * 1.65, h * 0.48, 0.045], 0.024, 0.024, 0.045, p.alloy, p.hd, 8).rotation.x = Math.PI / 2;
  return door;
}

export function kwin(
  parent: T.Object3D,
  at: Point,
  w: number,
  h: number,
  frameMat: T.Material,
  glassMat: T.Material,
  sillMat: T.Material,
  hd: boolean,
  detail: boolean,
  rotY = 0,
): T.Group {
  const g = group(parent, '', at);
  g.rotation.y = rotY;
  kbox(g, [0, 0, 0], [w + 0.09, h + 0.09, 0.09], frameMat, hd);
  kbox(g, [0, 0, 0.032], [w, h, 0.06], glassMat, hd);
  kbox(g, [0, -h / 2 - 0.045, 0.052], [w + 0.15, 0.055, 0.11], sillMat, hd);
  if (detail) {
    kbox(g, [0, 0, 0.055], [0.028, h - 0.02, 0.035], frameMat, hd);
    kbox(g, [0, 0, 0.055], [w - 0.02, 0.028, 0.035], frameMat, hd);
  }
  return g;
}

export function kgear(
  parent: T.Object3D,
  at: Point,
  r: number,
  thick: number,
  teeth: number,
  mat: T.Material,
  hubMat: T.Material,
  hd: boolean,
): T.Group {
  const g = group(parent, '', at);
  const rim = ktorus(g, [0, 0, 0], r * 0.82, r * 0.14, mat, hd, 6, 16);
  rim.scale.set(1, 1, Math.max(0.4, thick / Math.max(0.02, r * 0.28)));
  kcyl(g, [0, 0, 0], r * 0.26, r * 0.26, thick * 1.4, hubMat, hd, 10).rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const sp = kbox(g, [Math.cos(a) * r * 0.44, Math.sin(a) * r * 0.44, 0], [r * 0.68, r * 0.11, thick * 0.72], mat, hd);
    sp.rotation.z = a;
  }
  for (let i = 0; i < teeth; i++) {
    const a = (i * Math.PI * 2) / teeth;
    const t = kbox(g, [Math.cos(a) * r * 0.99, Math.sin(a) * r * 0.99, 0], [r * 0.16, r * 0.14, thick * 0.92], mat, hd);
    t.rotation.z = a;
  }
  return g;
}

export function kboltring(
  parent: T.Object3D,
  cx: number,
  y: number,
  cz: number,
  r: number,
  n: number,
  mat: T.Material,
  hd: boolean,
): void {
  for (let i = 0; i < n; i++) {
    const a = (i * Math.PI * 2) / n;
    kcyl(parent, [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r], 0.026, 0.028, 0.032, mat, hd, 6);
  }
}

export function swingTrack(
  node: string,
  axis: Axis,
  duration: number,
  peakDeg: number,
  symmetric = false,
): T.QuaternionKeyframeTrack {
  const peak = deg(peakDeg);
  return symmetric
    ? rotationTrack(node, axis, [0, duration * 0.25, duration * 0.75, duration], [0, peak, -peak, 0])
    : rotationTrack(node, axis, [0, duration * 0.35, duration * 0.65, duration], [0, peak, peak, 0]);
}

export function slideTrack(
  node: string,
  axis: Axis,
  rest: Point,
  duration: number,
  delta: number,
): T.VectorKeyframeTrack {
  const moved: Point = [
    rest[0] + (axis === 'x' ? delta : 0),
    rest[1] + (axis === 'y' ? delta : 0),
    rest[2] + (axis === 'z' ? delta : 0),
  ];
  return new T.VectorKeyframeTrack(
    `${node}.position`,
    [0, duration * 0.35, duration * 0.65, duration],
    [...rest, ...moved, ...moved, ...rest],
  );
}
