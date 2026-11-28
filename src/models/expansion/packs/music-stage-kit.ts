import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import { box, group, mesh, ring, rotationTrack, shell, spinTrack, tube } from '../../parts';
import type { Finish, Point } from '../../parts';

export const HPI = Math.PI / 2;

/** Solid box in standard; beveled RoundedBoxGeometry in HD regardless of custom/Finish material. */
export function kbox(parent: T.Object3D, at: Point, size: Point, mat: T.Material, hd: boolean): T.Mesh {
  const thin = Math.min(size[0], size[1], size[2]);
  if (hd && thin >= 0.036) {
    return mesh(parent, new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(0.014, thin * 0.16)), mat, at);
  }
  return box(parent, at, size, mat);
}

/** Watertight cylinder oriented along x, y, or z with crisp 8-seg standard and 24-seg HD. */
export function kcyl(
  parent: T.Object3D, at: Point, rt: number, rb: number, h: number,
  mat: T.Material, hd: boolean, axis: Axis = 'y', stdSegs = 8,
): T.Mesh {
  const segs = hd ? Math.max(20, stdSegs * 3) : stdSegs;
  const part = mesh(parent, new T.CylinderGeometry(rt, rb, h, segs), mat, at);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

/** Watertight sphere with 8x6 standard and 20x14 HD. */
export function korb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, scale?: Point): T.Mesh {
  const part = mesh(parent, new T.SphereGeometry(r, hd ? 20 : 8, hd ? 14 : 6), mat, at);
  if (scale) part.scale.set(...scale);
  return part;
}

/** Closed full-circle torus ring (never partial arc). */
export function ktor(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean): T.Mesh {
  return mesh(parent, new T.TorusGeometry(r, t, hd ? 12 : 6, hd ? 28 : 12), mat, at);
}

/** Point-to-point watertight strut cylinder with HD tessellation scaling. */
export function kstrut(
  parent: T.Object3D, a: Point, b: Point, radius: number, mat: T.Material, hd: boolean, stdSegs = 6,
): T.Mesh {
  const start = new T.Vector3(...a);
  const end = new T.Vector3(...b);
  const dir = end.clone().sub(start);
  const len = Math.max(1e-4, dir.length());
  const part = mesh(parent, new T.CylinderGeometry(radius, radius, len, hd ? Math.max(16, stdSegs * 3) : stdSegs), mat, [0, 0, 0]);
  part.position.copy(start.add(end).multiplyScalar(0.5));
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  return part;
}

/** Extruded closed 2D silhouette centered on Z, beveled in HD for crisp curved instruments. */
export function kextrude(
  parent: T.Object3D, at: Point, shape: T.Shape, depth: number, mat: T.Material, hd: boolean,
): T.Mesh {
  const geo = new T.ExtrudeGeometry(shape, {
    depth,
    curveSegments: hd ? 16 : 4,
    bevelEnabled: hd,
    bevelThickness: Math.min(0.012, depth * 0.14),
    bevelSize: Math.min(0.012, depth * 0.14),
    bevelSegments: 2,
  });
  geo.translate(0, 0, -depth * 0.5);
  return mesh(parent, geo, mat, at);
}

/** Watertight closed lathe revolution from [radius, y] pairs (endpoints closed at r=0). */
export function klathe(
  parent: T.Object3D, at: Point, profile: readonly (readonly [number, number])[],
  mat: T.Material, hd: boolean, stdSegs = 10,
): T.Mesh {
  const pts = profile.map(([r, y]) => new T.Vector2(r, y));
  const geo = new T.LatheGeometry(pts, hd ? Math.max(24, stdSegs * 3) : stdSegs);
  geo.computeVertexNormals();
  return mesh(parent, geo, mat, at);
}

/** Transparent display glass pane that passes craft-invariants material hygiene. */
export function kpane(parent: T.Object3D, at: Point, size: Point): T.Mesh {
  const mat = new T.MeshStandardMaterial({
    name: 'Stage glass', color: '#b4e4ea', metalness: 0.1, roughness: 0.1,
    transparent: true, opacity: 0.24, depthWrite: false,
  });
  const part = box(parent, at, size, mat);
  part.castShadow = false;
  return part;
}

/** Emissive indicator/lamp material (passes craft-invariants via non-zero emissive). */
export function kglow(color: string, emissive: string, name = 'Stage glow'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name, color, emissive, emissiveIntensity: 0.72, roughness: 0.42, metalness: 0.1,
  });
}

/** Matte warm timber or fabric accent material (safe roughness >= 0.65). */
export function kmatte(color: string, name = 'Stage matte', roughness = 0.76): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({ name, color, roughness, metalness: 0.04 });
}

/** Position slide keyframe track along a single cardinal axis relative to rest position. */
export function slideTrack(
  node: string, rest: Point, axis: 0 | 1 | 2, times: number[], offsets: number[],
): T.VectorKeyframeTrack {
  return new T.VectorKeyframeTrack(node + '.position', times, offsets.flatMap(d => {
    const pt: Point = [rest[0], rest[1], rest[2]];
    pt[axis] += d;
    return pt;
  }));
}

/** Piano/organ keybed with stepped white & raised black keys (zero coplanar overlap). */
export function addKeybed(
  parent: T.Object3D, at: Point, width: number, depth: number, p: Finish, hd: boolean, inverted = false,
): void {
  const [x, y, z] = at;
  const baseMat = inverted ? p.inset : p.stencil;
  const sharpMat = inverted ? p.stencil : p.inset;
  kbox(parent, [x, y, z], [width, 0.042, depth], baseMat, hd);
  const count = 10;
  const step = (width - 0.08) / count;
  for (let i = 0; i < count; i++) {
    if (i % 7 === 2 || i % 7 === 6) continue;
    const kx = x - (width - 0.08) * 0.5 + (i + 0.5) * step;
    kbox(parent, [kx, y + 0.028, z - depth * 0.18], [step * 0.52, 0.028, depth * 0.58], sharpMat, hd);
  }
}

export const rig = (
  name: string, label: string, axis: Axis, range: [number, number], describe: string, type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec => ({ name, label, type, axis, range, describe });

export const det = (name: string, label: string, describe: string): DetachablePartSpec =>
  ({ name, label, describe });

export { box, group, mesh, ring, rotationTrack, shell, spinTrack, tube };
export type { Finish, Point };
