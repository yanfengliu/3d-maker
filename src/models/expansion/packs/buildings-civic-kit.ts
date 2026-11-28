import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import { group, mesh, rotationTrack, spinTrack } from '../../parts';
import type { Finish, Point } from '../../parts';

export { group, mesh, rotationTrack, spinTrack };
export type { Finish, Point };

export interface CivicBuildDef {
  readonly id: string;
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts: readonly DetachablePartSpec[];
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void;
}

export const rot = (
  name: string, label: string, axis: 'x' | 'y' | 'z', range: [number, number], describe: string,
): RiggedPartSpec => ({ name, label, type: 'rotate', axis, range, describe });

export const slide = (
  name: string, label: string, axis: 'x' | 'y' | 'z', range: [number, number], describe: string,
): RiggedPartSpec => ({ name, label, type: 'slide', axis, range, describe });

export const det = (name: string, label: string, describe: string): DetachablePartSpec => ({ name, label, describe });

export function quad(fn: (sx: number, sz: number) => void): void {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fn(sx, sz);
}

export function matte(color: string, roughness = 0.84, metalness = 0, name = 'Civic matte'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name,
    color,
    roughness: Math.max(0.25, Math.min(0.98, roughness)),
    metalness: Math.max(0, Math.min(0.85, metalness)),
    side: T.FrontSide,
  });
}

export function glow(color: string, emissive: string, intensity = 0.45, name = 'Civic lamp'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name, color, emissive, emissiveIntensity: intensity, roughness: 0.3, metalness: 0.1, side: T.FrontSide,
  });
}

export function bBox(
  parent: T.Object3D, at: Point, size: [number, number, number], mat: T.Material, hd: boolean,
): T.Mesh {
  const thin = Math.min(size[0], size[1], size[2]);
  const geo = hd && thin >= 0.045
    ? new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(0.014, thin * 0.16))
    : new T.BoxGeometry(size[0], size[1], size[2]);
  return mesh(parent, geo, mat, at);
}

export function bCyl(
  parent: T.Object3D, at: Point, rTop: number, rBot: number, h: number,
  mat: T.Material, hd: boolean, sides = 12, keepSides = false,
): T.Mesh {
  const radSegs = !keepSides && hd ? sides * 3 : sides;
  const hSegs = keepSides && hd ? 3 : 1;
  return mesh(parent, new T.CylinderGeometry(rTop, rBot, h, radSegs, hSegs, false), mat, at);
}

export function bCone(
  parent: T.Object3D, at: Point, r: number, h: number,
  mat: T.Material, hd: boolean, sides = 12, keepSides = false,
): T.Mesh {
  const radSegs = !keepSides && hd ? sides * 3 : sides;
  const hSegs = keepSides && hd ? 3 : 1;
  return mesh(parent, new T.ConeGeometry(r, h, radSegs, hSegs, false), mat, at);
}

export function bOrb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, sides = 10): T.Mesh {
  const wSeg = hd ? sides * 3 : sides;
  const hSeg = hd ? Math.max(12, Math.round(sides * 1.8)) : Math.max(6, Math.round(sides * 0.7));
  return mesh(parent, new T.SphereGeometry(r, wSeg, hSeg), mat, at);
}

export function bStrut(
  parent: T.Object3D, a: Point, b: Point, r: number, mat: T.Material, hd: boolean, sides = 8,
): T.Mesh {
  const start = new T.Vector3(...a);
  const end = new T.Vector3(...b);
  const dir = end.clone().sub(start);
  const part = bCyl(parent, [0, 0, 0], r, r, Math.max(0.001, dir.length()), mat, hd, sides);
  part.position.copy(start.add(end).multiplyScalar(0.5));
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  return part;
}

/** Closed watertight solid LatheGeometry from bottom-to-top [radius, y] pairs. */
export function bLathe(
  parent: T.Object3D, at: Point, profile: readonly [number, number][],
  mat: T.Material, hd: boolean, sides = 12, keepSides = false,
): T.Mesh {
  const pts: T.Vector2[] = [];
  const first = profile[0];
  const last = profile[profile.length - 1];
  if (first && first[0] > 0.002) pts.push(new T.Vector2(0.001, first[1]));
  for (const [r, y] of profile) pts.push(new T.Vector2(Math.max(0.001, r), y));
  if (last && last[0] > 0.002) pts.push(new T.Vector2(0.001, last[1]));
  const geo = new T.LatheGeometry(pts, !keepSides && hd ? sides * 3 : sides);
  geo.computeVertexNormals();
  return mesh(parent, geo, mat, at);
}

export function bRing(
  parent: T.Object3D, at: Point, radius: number, thick: number, h: number,
  mat: T.Material, hd: boolean, sides = 16,
): T.Mesh {
  const inner = Math.max(0.004, radius - thick);
  const bev = Math.min(0.01, thick * 0.35, h * 0.25);
  const profile = [
    new T.Vector2(inner, -h / 2),
    new T.Vector2(inner, h / 2),
    new T.Vector2(radius - bev, h / 2),
    new T.Vector2(radius, h / 2 - bev),
    new T.Vector2(radius, -h / 2 + bev),
    new T.Vector2(radius - bev, -h / 2),
    new T.Vector2(inner, -h / 2),
  ].reverse();
  const geo = new T.LatheGeometry(profile, hd ? sides * 3 : sides);
  geo.normalizeNormals();
  return mesh(parent, geo, mat, at);
}

export function bGable(
  parent: T.Object3D, at: Point, w: number, h: number, d: number, mat: T.Material, hd: boolean,
): T.Mesh {
  const shape = new T.Shape();
  shape.moveTo(-w / 2, 0).lineTo(w / 2, 0).lineTo(0, h).closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: hd, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3,
  });
  geo.translate(0, 0, -d / 2);
  return mesh(parent, geo, mat, at);
}

export function bGambrel(
  parent: T.Object3D, at: Point, w: number, hKnee: number, hTop: number, wKnee: number,
  d: number, mat: T.Material, hd: boolean,
): T.Mesh {
  const shape = new T.Shape();
  shape.moveTo(-w / 2, 0).lineTo(w / 2, 0).lineTo(wKnee / 2, hKnee).lineTo(0, hTop).lineTo(-wKnee / 2, hKnee).closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: hd, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3,
  });
  geo.translate(0, 0, -d / 2);
  return mesh(parent, geo, mat, at);
}

export function bArchVault(
  parent: T.Object3D, at: Point, w: number, wallH: number, archH: number, d: number, mat: T.Material, hd: boolean,
): T.Mesh {
  const shape = new T.Shape();
  const r = w / 2;
  const steps = hd ? 24 : 8;
  shape.moveTo(-r, 0).lineTo(r, 0).lineTo(r, wallH);
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * Math.PI;
    shape.lineTo(Math.cos(a) * r, wallH + Math.sin(a) * archH);
  }
  shape.lineTo(-r, 0).closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: hd, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2,
  });
  geo.translate(0, 0, -d / 2);
  return mesh(parent, geo, mat, at);
}

export function bArchPortal(
  parent: T.Object3D, at: Point, outerW: number, innerW: number, springH: number,
  d: number, mat: T.Material, hd: boolean,
): T.Mesh {
  const shape = new T.Shape();
  const rOut = outerW / 2;
  const rIn = innerW / 2;
  const steps = hd ? 24 : 8;
  shape.moveTo(-rOut, 0).lineTo(-rIn, 0).lineTo(-rIn, springH);
  for (let i = 1; i <= steps; i++) {
    const a = Math.PI - (i / steps) * Math.PI;
    shape.lineTo(Math.cos(a) * rIn, springH + Math.sin(a) * rIn);
  }
  shape.lineTo(rIn, 0).lineTo(rOut, 0).lineTo(rOut, springH);
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * Math.PI;
    shape.lineTo(Math.cos(a) * rOut, springH + Math.sin(a) * rOut);
  }
  shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: hd, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2,
  });
  geo.translate(0, 0, -d / 2);
  return mesh(parent, geo, mat, at);
}

export function bOctPrism(parent: T.Object3D, at: Point, r: number, h: number, mat: T.Material, hd: boolean): T.Mesh {
  const m = bCyl(parent, at, r, r, h, mat, hd, 8, true);
  m.rotation.y = Math.PI / 8;
  return m;
}

export function pitchedRoof(
  parent: T.Object3D, at: Point, w: number, h: number, d: number,
  wallMat: T.Material, roofMat: T.Material, ridgeMat: T.Material, p: Finish, detail: boolean,
): void {
  const [x, y, z] = at;
  bGable(parent, [x, y, z], w * 0.9, h, d * 0.86, wallMat, p.hd);
  const run = w * 0.54;
  const slopeLen = Math.hypot(run, h) + 0.1;
  const angle = Math.atan2(h, run);
  for (const s of [-1, 1]) {
    bBox(parent, [x + s * run * 0.5, y + h * 0.5 + 0.03, z], [slopeLen, 0.075, d], roofMat, p.hd).rotation.z =
      -s * angle;
    if (p.hd && detail) {
      bBox(parent, [x + s * run * 0.5, y + h * 0.5 + 0.01, z + d * 0.52], [slopeLen, 0.055, 0.045], ridgeMat, p.hd)
        .rotation.z = -s * angle;
    }
  }
  bBox(parent, [x, y + h + 0.06, z], [0.11, 0.075, d + 0.05], ridgeMat, p.hd);
}

export function framedWindow(
  parent: T.Object3D, at: Point, w: number, h: number,
  frameMat: T.Material, sillMat: T.Material, p: Finish, detail: boolean, shutterMat?: T.Material,
): void {
  const [x, y, z] = at;
  bBox(parent, [x, y, z], [w + 0.08, h + 0.08, 0.055], frameMat, p.hd);
  bBox(parent, [x, y, z + 0.025], [w, h, 0.04], p.optic, p.hd);
  bBox(parent, [x, y - h / 2 - 0.04, z + 0.035], [w + 0.14, 0.055, 0.09], sillMat, p.hd);
  if (detail) {
    bBox(parent, [x, y, z + 0.05], [0.022, h - 0.02, 0.018], frameMat, false);
    bBox(parent, [x, y, z + 0.05], [w - 0.02, 0.022, 0.018], frameMat, false);
  }
  if (shutterMat) {
    for (const s of [-1, 1]) {
      bBox(parent, [x + s * (w * 0.5 + 0.1), y, z + 0.022], [0.11, h + 0.03, 0.04], shutterMat, p.hd);
    }
  }
}

export function archedWindow(
  parent: T.Object3D, at: Point, w: number, h: number,
  frameMat: T.Material, sillMat: T.Material, p: Finish, detail: boolean,
): void {
  const [x, y, z] = at;
  const rectH = h * 0.62;
  const archH = h * 0.38;
  bArchVault(parent, [x, y - h / 2, z], w + 0.08, rectH, archH + 0.04, 0.055, frameMat, p.hd);
  bArchVault(parent, [x, y - h / 2 + 0.02, z + 0.022], w, rectH - 0.02, archH, 0.036, p.optic, p.hd);
  bBox(parent, [x, y - h / 2 - 0.03, z + 0.035], [w + 0.15, 0.055, 0.09], sillMat, p.hd);
  if (detail) {
    const mz = z + (p.hd ? 0.058 : 0.046);
    bBox(parent, [x, y - h / 2 + rectH * 0.5, mz], [0.022, rectH - 0.02, 0.018], frameMat, false);
    bBox(parent, [x, y - h / 2 + rectH, mz], [w - 0.02, 0.024, 0.018], frameMat, false);
    bBox(parent, [x, y + h / 2 + 0.03, z + 0.038], [0.065, 0.08, 0.05], sillMat, p.hd);
  }
}

export function hingedDoor(
  parent: T.Object3D, name: string, center: Point, w: number, h: number,
  leafMat: T.Material, frameMat: T.Material, p: Finish, hingeSide: 1 | -1 = 1,
): T.Group {
  const [x, y, z] = center;
  bBox(parent, [x, y + h / 2, z - 0.025], [w + 0.1, h + 0.09, 0.055], frameMat, p.hd);
  bBox(parent, [x, y + h / 2, z - 0.005], [w - 0.02, h - 0.02, 0.04], p.inset, false);
  const door = group(parent, name, [x + hingeSide * (w / 2), y, z + 0.025]);
  bBox(door, [-hingeSide * (w / 2), h / 2, 0], [w, h, 0.05], leafMat, p.hd);
  bCyl(door, [-hingeSide * (w - 0.07), h * 0.48, 0.042], 0.022, 0.022, 0.04, p.alloy, p.hd, 10).rotation.x = Math.PI / 2;
  return door;
}

export function bellSolid(
  parent: T.Object3D, at: Point, scale: number, mat: T.Material, clapperMat: T.Material, hd: boolean,
): void {
  const s = scale;
  const profile: [number, number][] = [
    [0.002 * s, -0.44 * s], [0.24 * s, -0.44 * s], [0.26 * s, -0.4 * s], [0.16 * s, -0.22 * s],
    [0.13 * s, -0.07 * s], [0.07 * s, 0], [0.002 * s, 0.02 * s],
  ];
  bLathe(parent, at, profile, mat, hd, 14);
  bOrb(parent, [at[0], at[1] - 0.45 * s, at[2]], 0.055 * s, clapperMat, hd, 8);
}

export function clockDial(
  parent: T.Object3D, at: Point, r: number,
  rimMat: T.Material, faceMat: T.Material, handMat: T.Material, p: Finish, detail: boolean,
): void {
  const [x, y, z] = at;
  bRing(parent, [x, y, z], r, r * 0.16, 0.055, rimMat, p.hd, 16).rotation.x = Math.PI / 2;
  bCyl(parent, [x, y, z - 0.005], r * 0.88, r * 0.88, 0.04, faceMat, p.hd, 16).rotation.x = Math.PI / 2;
  bBox(parent, [x, y + r * 0.25, z + 0.032], [r * 0.1, r * 0.56, 0.018], handMat, false);
  bBox(parent, [x + r * 0.18, y, z + 0.028], [r * 0.42, r * 0.1, 0.016], handMat, false);
  if (detail) {
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6;
      bBox(parent, [x + Math.sin(a) * r * 0.72, y + Math.cos(a) * r * 0.72, z + 0.026], [r * 0.07, r * 0.14, 0.014], handMat, false)
        .rotation.z = -a;
    }
  }
}

export function swingTrack(
  node: string, axis: 'x' | 'y' | 'z', duration: number, peakDeg: number, symmetric = false,
): T.QuaternionKeyframeTrack {
  const peak = (peakDeg * Math.PI) / 180;
  return symmetric
    ? rotationTrack(node, axis, [0, duration * 0.25, duration * 0.75, duration], [0, peak, -peak, 0])
    : rotationTrack(node, axis, [0, duration * 0.38, duration * 0.62, duration], [0, peak, peak, 0]);
}

export function slideTrack(
  node: string, axis: 'x' | 'y' | 'z', rest: Point, duration: number, delta: number,
): T.VectorKeyframeTrack {
  const moved: Point = [...rest];
  moved[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] += delta;
  return new T.VectorKeyframeTrack(
    `${node}.position`,
    [0, duration * 0.38, duration * 0.62, duration],
    [...rest, ...moved, ...moved, ...rest],
  );
}
