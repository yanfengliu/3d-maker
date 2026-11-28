import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import { box, group, mesh, ring, rotationTrack, shell, strut } from '../../parts';
import type { Finish, Point } from '../../parts';

export interface WorldBuilderSpec {
  readonly id: string;
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts?: readonly DetachablePartSpec[];
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void;
}

export const deg = T.MathUtils.degToRad;

export const rot = (
  name: string,
  label: string,
  axis: Axis,
  range: [number, number],
  describe: string,
): RiggedPartSpec => ({ name, label, type: 'rotate', axis, range, describe });

export const slide = (
  name: string,
  label: string,
  axis: Axis,
  range: [number, number],
  describe: string,
): RiggedPartSpec => ({ name, label, type: 'slide', axis, range, describe });

export const det = (name: string, label: string, describe: string): DetachablePartSpec =>
  ({ name, label, describe });

export const quad = (fn: (sx: number, sz: number) => void): void => {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fn(sx, sz);
};

export function tone(
  p: Finish,
  name: string,
  color: string,
  roughness = 0.84,
  metalness = 0.04,
  emissive?: string,
): T.MeshStandardMaterial {
  const safeRough = Math.max(0.24, roughness);
  const mat = p.hd
    ? new T.MeshPhysicalMaterial({
      name,
      color,
      roughness: Math.max(0.22, safeRough * 0.9),
      metalness,
      clearcoat: metalness > 0.25 ? 0.28 : 0.02,
      clearcoatRoughness: 0.4,
      side: T.FrontSide,
    })
    : new T.MeshStandardMaterial({
      name,
      color,
      roughness: safeRough,
      metalness,
      flatShading: true,
      side: T.FrontSide,
    });
  if (emissive) {
    mat.emissive.set(emissive);
    mat.emissiveIntensity = 0.55;
  }
  return mat;
}

export function kbox(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  size: [number, number, number],
  mat: T.Material,
): T.Mesh {
  const thin = Math.min(size[0], size[1], size[2]);
  if (p.hd && thin >= 0.045) {
    return mesh(parent, new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(0.014, thin * 0.15)), mat, at);
  }
  return box(parent, at, size, mat);
}

export function cyl(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  top: number,
  bot: number,
  h: number,
  mat: T.Material,
  seg = 8,
  rotRad: Point = [0, 0, 0],
): T.Mesh {
  const m = mesh(parent, new T.CylinderGeometry(top, bot, h, p.hd ? seg * 3 : seg), mat, at);
  m.rotation.set(...rotRad);
  return m;
}

export function cone(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  r: number,
  h: number,
  mat: T.Material,
  seg = 8,
  rotRad: Point = [0, 0, 0],
): T.Mesh {
  const m = mesh(parent, new T.ConeGeometry(r, h, p.hd ? seg * 3 : seg), mat, at);
  m.rotation.set(...rotRad);
  return m;
}

export function orb(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  scale: Point,
  mat: T.Material,
  seg = 8,
): T.Mesh {
  const geo = new T.SphereGeometry(1, p.hd ? seg * 2 : seg, p.hd ? seg + 4 : Math.max(6, seg - 1));
  const m = mesh(parent, geo, mat, at);
  m.scale.set(...scale);
  return m;
}

export function lathe(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  pts: readonly [number, number][],
  mat: T.Material,
  seg = 10,
): T.Mesh {
  const geo = new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), p.hd ? seg * 3 : seg);
  geo.normalizeNormals();
  return mesh(parent, geo, mat, at);
}

export function gable(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  w: number,
  h: number,
  d: number,
  mat: T.Material,
): T.Mesh {
  const shape = new T.Shape();
  shape.moveTo(-w / 2, 0).lineTo(w / 2, 0).lineTo(0, h).closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: p.hd,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -d / 2);
  return mesh(parent, geo, mat, at);
}

export function plinth(
  parent: T.Object3D,
  p: Finish,
  w: number,
  h: number,
  d: number,
  mat: T.Material,
  cut = 0.08,
): T.Mesh {
  return shell(parent, [0, h * 0.5, 0], [w, h, d], mat, cut);
}

export function pitchedRoof(
  parent: T.Object3D,
  p: Finish,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  wallMat: T.Material,
  roofMat: T.Material,
  ridgeMat: T.Material,
  detail: boolean,
): void {
  gable(parent, p, [0, y - 0.01, z], w * 0.9, h, d * 0.88, wallMat);
  const run = w * 0.55;
  const slopeLen = Math.hypot(run, h) + 0.12;
  const angle = Math.atan2(h, run);
  for (const s of [-1, 1]) {
    const slab = kbox(parent, p, [s * run * 0.5, y + h * 0.5 + 0.03, z], [slopeLen, 0.08, d], roofMat);
    slab.rotation.z = -s * angle;
    if (detail) {
      const barge = kbox(parent, p, [s * run * 0.5, y + h * 0.5 + 0.01, z + d * 0.51], [slopeLen, 0.06, 0.05], ridgeMat);
      barge.rotation.z = -s * angle;
    }
  }
  kbox(parent, p, [0, y + h + 0.05, z], [0.12, 0.08, d + 0.06], ridgeMat);
}

export function curvedEaveTier(
  parent: T.Object3D,
  p: Finish,
  y: number,
  w: number,
  d: number,
  h: number,
  roofMat: T.Material,
  trimMat: T.Material,
  detail: boolean,
): void {
  kbox(parent, p, [0, y, 0], [w * 0.84, 0.08, d * 0.84], trimMat);
  const slopeLenZ = Math.hypot(d * 0.48, h) + 0.06;
  const angZ = Math.atan2(h, d * 0.48);
  for (const sz of [-1, 1]) {
    const slab = kbox(parent, p, [0, y + h * 0.5 + 0.02, sz * d * 0.25], [w * 0.96, 0.08, slopeLenZ], roofMat);
    slab.rotation.x = sz * angZ;
  }
  const slopeLenX = Math.hypot(w * 0.48, h) + 0.04;
  const angX = Math.atan2(h, w * 0.48);
  for (const sx of [-1, 1]) {
    const hip = kbox(parent, p, [sx * w * 0.25, y + h * 0.48, 0], [slopeLenX, 0.075, d * 0.88], roofMat);
    hip.rotation.z = -sx * angX;
  }
  kbox(parent, p, [0, y + h + 0.04, 0], [w * 0.46, 0.1, d * 0.46], roofMat);
  quad((sx, sz) => {
    const spur = kbox(parent, p, [sx * w * 0.46, y + 0.1, sz * d * 0.46], [0.22, 0.06, 0.22], roofMat);
    spur.rotation.set(-sz * 0.24, 0, sx * 0.24);
    if (detail) {
      strut(parent, [sx * w * 0.34, y - 0.06, sz * d * 0.34], [sx * w * 0.46, y + 0.06, sz * d * 0.46], 0.024, trimMat, p.hd ? 10 : 6);
    }
  });
}

export function windowUnit(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  w: number,
  h: number,
  frameMat: T.Material,
  glassMat: T.Material,
  sillMat: T.Material,
  detail: boolean,
  shutterMat?: T.Material,
): void {
  const [x, y, z] = at;
  kbox(parent, p, [x, y, z + 0.01], [w + 0.08, h + 0.08, 0.06], frameMat);
  kbox(parent, p, [x, y, z + 0.032], [w, h, 0.04], glassMat);
  kbox(parent, p, [x, y - h * 0.5 - 0.045, z + 0.045], [w + 0.14, 0.055, 0.09], sillMat);
  if (detail) {
    box(parent, [x, y, z + 0.058], [0.024, h - 0.02, 0.024], frameMat);
    box(parent, [x, y, z + 0.058], [w - 0.02, 0.024, 0.024], frameMat);
  }
  if (shutterMat) {
    for (const s of [-1, 1]) {
      kbox(parent, p, [x + s * (w * 0.5 + 0.11), y, z + 0.035], [0.12, h + 0.04, 0.048], shutterMat);
    }
  }
}

export function hingedDoor(
  parent: T.Object3D,
  p: Finish,
  name: string,
  center: Point,
  w: number,
  h: number,
  leafMat: T.Material,
  frameMat: T.Material,
): T.Group {
  const [x, y, z] = center;
  kbox(parent, p, [x, y + h * 0.5, z - 0.015], [w + 0.12, h + 0.08, 0.06], frameMat);
  kbox(parent, p, [x, y + h * 0.5, z + 0.006], [w - 0.02, h - 0.02, 0.045], p.inset);
  const door = group(parent, name, [x + w * 0.5, y, z + 0.042]);
  kbox(door, p, [-w * 0.5, h * 0.5, 0], [w, h, 0.055], leafMat);
  cyl(door, p, [-w + 0.075, h * 0.48, 0.04], 0.022, 0.022, 0.045, p.alloy, 8, [Math.PI / 2, 0, 0]);
  return door;
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
  const moved: Point = [...rest];
  moved[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] += delta;
  return new T.VectorKeyframeTrack(
    node + '.position',
    [0, duration * 0.35, duration * 0.65, duration],
    [...rest, ...moved, ...moved, ...rest],
  );
}

export function addRingOrnament(parent: T.Object3D, at: Point, r: number, t: number, h: number, mat: T.Material): T.Mesh {
  return ring(parent, at, r, t, h, mat);
}
