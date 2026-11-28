import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import { fastener } from '../../hd-detail';
import { box, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish, Point } from '../../parts';

export { box, fastener, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube };
export type { Axis, DetachablePartSpec, Finish, Point, RiggedPartSpec };

export const HPI = Math.PI / 2;
export const TAU = Math.PI * 2;
export const deg = T.MathUtils.degToRad;

export const rig = (
  name: string, label: string, axis: Axis, range: [number, number], describe: string, type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec => ({ name, label, type, axis, range, describe });

export const det = (name: string, label: string, describe: string): DetachablePartSpec => ({ name, label, describe });

export function radLoop(count: number, fn: (a: number, sx: number, sz: number, i: number) => void, offset = 0) {
  for (let i = 0; i < count; i++) {
    const a = (i * TAU) / count + offset;
    fn(a, Math.sin(a), Math.cos(a), i);
  }
}

export function glassMat(color = '#9adfe8', opacity = 0.26) {
  return new T.MeshStandardMaterial({
    name: 'Containment glass', color, metalness: 0.12, roughness: 0.12, transparent: true, opacity, depthWrite: false,
  });
}

export function holoMat(color = '#35e4ff', opacity = 0.36) {
  return new T.MeshStandardMaterial({
    name: 'Hologram field', color, emissive: color, emissiveIntensity: 0.85,
    metalness: 0.06, roughness: 0.24, transparent: true, opacity, depthWrite: false,
  });
}

export function glowMat(color: string, intensity = 0.85, name = 'Plasma emitter') {
  return new T.MeshStandardMaterial({
    name, color, emissive: color, emissiveIntensity: intensity, metalness: 0.12, roughness: 0.28,
  });
}

export function bioMat(color = '#3e944e') {
  return new T.MeshStandardMaterial({ name: 'Hydroponic foliage', color, metalness: 0.02, roughness: 0.78 });
}

export function cyl(
  parent: T.Object3D, at: Point, rt: number, rb: number, h: number, mat: T.Material,
  hd: boolean, axis: Axis = 'y', stdSeg = 8, hdSeg = 24,
) {
  const part = mesh(parent, new T.CylinderGeometry(rt, rb, h, hd ? hdSeg : stdSeg), mat, at);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  if (mat.transparent) part.castShadow = false;
  return part;
}

export function orb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, scale?: Point) {
  const part = mesh(parent, new T.SphereGeometry(r, hd ? 20 : 8, hd ? 14 : 6), mat, at);
  if (scale) part.scale.set(...scale);
  if (mat.transparent) part.castShadow = false;
  return part;
}

export function torus(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean, axis: Axis = 'z') {
  const part = mesh(parent, new T.TorusGeometry(r, t, hd ? 14 : 6, hd ? 32 : 12), mat, at);
  if (axis === 'y') part.rotation.x = HPI;
  else if (axis === 'x') part.rotation.y = HPI;
  if (mat.transparent) part.castShadow = false;
  return part;
}

export function ringBand(
  parent: T.Object3D, at: Point, r: number, thick: number, h: number, mat: T.Material, hd: boolean, axis: Axis = 'y',
) {
  const b = Math.min(thick * 0.25, h * 0.22);
  const inner = Math.max(0.01, r - thick);
  const profile = [
    new T.Vector2(inner, -h / 2), new T.Vector2(r - b, -h / 2), new T.Vector2(r, -h / 2 + b),
    new T.Vector2(r, h / 2 - b), new T.Vector2(r - b, h / 2), new T.Vector2(inner, h / 2),
    new T.Vector2(inner, -h / 2),
  ];
  const geo = new T.LatheGeometry(profile, hd ? 40 : 12);
  geo.normalizeNormals();
  const part = mesh(parent, geo, mat, at);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  if (mat.transparent) part.castShadow = false;
  return part;
}

export function hexSlab(parent: T.Object3D, at: Point, r: number, h: number, mat: T.Material, hd: boolean) {
  const b = Math.min(h * 0.18, r * 0.12);
  if (!hd) {
    const profile = [
      new T.Vector2(0, -h / 2), new T.Vector2(r - b, -h / 2), new T.Vector2(r, -h / 2 + b),
      new T.Vector2(r, h / 2 - b), new T.Vector2(r - b, h / 2), new T.Vector2(0, h / 2),
    ];
    return mesh(parent, new T.LatheGeometry(profile, 6), mat, at);
  }
  const shape = new T.Shape();
  radLoop(6, (_, sx, sz, i) => {
    const x = sx * (r - b), z = sz * (r - b);
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();
  const depth = Math.max(0.01, h - b * 2);
  const geo = new T.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 4,
  });
  geo.rotateX(-HPI);
  geo.translate(0, -depth / 2, 0);
  return mesh(parent, geo, mat, at);
}

export function closedDish(parent: T.Object3D, at: Point, r: number, depth: number, thick: number, mat: T.Material, hd: boolean) {
  const steps = hd ? 10 : 5;
  const profile: T.Vector2[] = [new T.Vector2(0, 0)];
  for (let i = 1; i <= steps; i++) profile.push(new T.Vector2(r * (i / steps), depth * (i / steps) ** 2));
  for (let i = steps; i >= 1; i--) profile.push(new T.Vector2(Math.max(0.01, (r - thick) * (i / steps)), depth * (i / steps) ** 2 + thick));
  profile.push(new T.Vector2(0, thick));
  const geo = new T.LatheGeometry(profile, hd ? 36 : 12);
  geo.normalizeNormals();
  return mesh(parent, geo, mat, at);
}

export function hose(parent: T.Object3D, path: Point[], r: number, mat: T.Material, hd: boolean) {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)));
  return mesh(parent, new T.TubeGeometry(curve, hd ? 18 : 7, r, hd ? 10 : 6), mat, [0, 0, 0]);
}

export function displayUnit(
  parent: T.Object3D, at: Point, w: number, h: number, d: number,
  frameMat: T.Material, screenMat: T.Material, rotY = 0, rotX = 0,
) {
  const g = group(parent, '', at);
  g.rotation.set(rotX, rotY, 0);
  shell(g, [0, 0, 0], [w, h, d], frameMat, 0.22);
  box(g, [0, 0, d * 0.5 + 0.01], [w - 0.08, h - 0.08, 0.028], screenMat);
  return g;
}

export function wheelValve(parent: T.Object3D, r: number, spokes: number, p: Finish) {
  cyl(parent, [0, 0, -0.055], r * 0.38, r * 0.46, 0.15, p.alloy, p.hd, 'z');
  torus(parent, [0, 0, 0.025], r, r * 0.16, p.accent, p.hd, 'z');
  radLoop(spokes, (_, sx, sz) => {
    strut(parent, [0, 0, 0.025], [sz * r * 0.94, sx * r * 0.94, 0.025], r * 0.1, p.edge, p.hd ? 10 : 6);
  });
}

export function boltRing(parent: T.Object3D, cx: number, y: number, cz: number, r: number, count: number, p: Finish) {
  radLoop(count, (_, sx, sz) => { fastener(parent, [cx + sx * r, y, cz + sz * r], p, 0.026); });
}

export function slideTrack(node: string, rest: Point, axis: Axis, times: number[], offsets: number[]) {
  const values = offsets.flatMap(d => [
    rest[0] + (axis === 'x' ? d : 0), rest[1] + (axis === 'y' ? d : 0), rest[2] + (axis === 'z' ? d : 0),
  ]);
  return new T.VectorKeyframeTrack(node + '.position', times, values);
}
