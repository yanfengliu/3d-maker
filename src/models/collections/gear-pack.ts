import * as T from 'three';
import { box, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../parts';
import type { Finish, Point } from '../parts';
import { fastener } from '../hd-detail';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';

export interface GearAssetDef {
  id: string;
  code: string;
  category: 'Object';
  browseCategory: BrowseCategory;
  name: string;
  primary: string;
  accent: string;
  description: string;
  physicsBody: 'static' | 'dynamic';
  riggedParts: readonly RiggedPartSpec[];
  detachableParts: readonly DetachablePartSpec[];
  build: (root: T.Group, p: Finish, detail: boolean) => void;
}

const HPI = Math.PI / 2;

function orb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, scale?: Point) {
  const part = mesh(parent, new T.SphereGeometry(r, hd ? 20 : 8, hd ? 14 : 6), mat, at);
  if (scale) part.scale.set(...scale);
  return part;
}

function torus(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean) {
  return mesh(parent, new T.TorusGeometry(r, t, hd ? 12 : 6, hd ? 28 : 12), mat, at);
}

function hose(parent: T.Object3D, path: Point[], r: number, mat: T.Material, hd: boolean) {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)));
  return mesh(parent, new T.TubeGeometry(curve, hd ? 18 : 8, r, hd ? 10 : 5), mat, [0, 0, 0]);
}

function cyl(parent: T.Object3D, at: Point, rt: number, rb: number, h: number, mat: T.Material, axis: Axis, sides = 12) {
  const part = tube(parent, at, rt, rb, h, mat, sides);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

function band(parent: T.Object3D, at: Point, r: number, t: number, h: number, mat: T.Material, axis: Axis) {
  const part = ring(parent, at, r, t, h, mat);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}

function slideTrack(node: string, rest: Point, axis: 0 | 1 | 2, times: number[], offsets: number[]) {
  const values = offsets.flatMap(d => {
    const pt: Point = [rest[0], rest[1], rest[2]];
    pt[axis] += d;
    return pt;
  });
  return new T.VectorKeyframeTrack(node + '.position', times, values);
}

function brassSpyglass(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'SpyglassStand');
  shell(stand, [0, 0.06, 0], [0.74, 0.12, 0.96], p.dark, 0.32);
  for (const z of [-0.32, 0.24]) {
    for (const sx of [-0.14, 0.14]) strut(stand, [sx, 0.1, z], [sx, 0.56, z], 0.028, p.primary, 10);
    strut(stand, [-0.14, 0.44, z], [0.14, 0.44, z], 0.024, p.primary, 10);
  }
  const barrel = group(root, 'MainBarrel', [0, 0.58, 0]);
  cyl(barrel, [0, 0, -0.06], 0.145, 0.135, 0.78, p.primary, 'z', 16);
  cyl(barrel, [0, 0, -0.08], 0.155, 0.15, 0.46, p.accent, 'z', 16);
  for (const z of [-0.34, 0.2]) band(barrel, [0, 0, z], 0.165, 0.032, 0.065, p.primary, 'z');
  cyl(barrel, [0, 0, -0.52], 0.092, 0.12, 0.22, p.edge, 'z', 14);
  cyl(barrel, [0, 0, -0.63], 0.068, 0.068, 0.035, p.optic, 'z', 14);
  const lt = group(root, 'LensTube', [0, 0.58, 0.24]);
  cyl(lt, [0, 0, 0.14], 0.118, 0.128, 0.34, p.primary, 'z', 16);
  cyl(lt, [0, 0, 0.36], 0.148, 0.125, 0.2, p.primary, 'z', 16);
  band(lt, [0, 0, 0.46], 0.158, 0.028, 0.055, p.alloy, 'z');
  cyl(lt, [0, 0, 0.44], 0.128, 0.128, 0.04, p.optic, 'z', 16);
  const cap = group(lt, 'LensCap', [0, 0.155, 0.48]);
  cyl(cap, [0, -0.155, 0.02], 0.152, 0.152, 0.045, p.primary, 'z', 16);
  box(cap, [0, 0, -0.01], [0.08, 0.045, 0.055], p.edge);
  if (detail) {
    box(stand, [0, 0.075, 0.485], [0.28, 0.075, 0.02], p.primary);
    for (const z of [-0.24, -0.08, 0.08]) band(barrel, [0, 0, z], 0.159, 0.012, 0.022, p.dark, 'z');
    if (p.hd) for (const sx of [-0.28, 0.28]) fastener(stand, [sx, 0.125, 0.34], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Extend spyglass', 2.6, [slideTrack('LensTube', [0, 0.58, 0.24], 2, [0, 0.8, 1.8, 2.6], [0, 0.42, 0.42, 0])]),
    new T.AnimationClip('Flip lens cap', 2.4, [rotationTrack('LensCap', 'x', [0, 0.7, 1.7, 2.4], [0, -1.75, -1.75, 0])]),
  ];
}

function plasmaWrench(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'WrenchBody');
  shell(b, [0, 0.08, 0], [0.96, 0.16, 0.72], p.dark, 0.24);
  box(b, [0, 0.11, 0.35], [0.56, 0.045, 0.03], p.accent);
  shell(b, [0, 0.2, 0], [0.46, 0.16, 0.36], p.edge, 0.22);
  shell(b, [0, 0.52, 0], [0.22, 0.56, 0.2], p.dark, 0.26);
  for (const y of [0.36, 0.48, 0.6]) shell(b, [0, y, 0], [0.25, 0.065, 0.23], p.tire, 0.3);
  strut(b, [-0.12, 0.34, 0], [-0.24, 0.54, 0], 0.024, p.edge, 8);
  strut(b, [-0.24, 0.54, 0], [-0.12, 0.72, 0], 0.024, p.edge, 8);
  shell(b, [0, 0.94, 0], [0.68, 0.42, 0.3], p.primary, 0.26);
  for (const sx of [-0.34, 0.34]) shell(b, [sx, 0.94, 0], [0.09, 0.32, 0.26], p.accent, 0.24);
  shell(b, [-0.24, 1.32, 0], [0.22, 0.44, 0.26], p.primary, 0.2);
  box(b, [-0.12, 1.34, 0], [0.065, 0.32, 0.22], p.alloy);
  const core = group(root, 'PowerCore', [0, 0.94, 0]);
  band(core, [0, 0, 0], 0.16, 0.042, 0.34, p.optic, 'z');
  cyl(core, [0, 0, 0], 0.075, 0.075, 0.36, p.alloy, 'z', 12);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    box(core, [Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0], [0.09, 0.036, 0.35], p.accent).rotation.z = a;
  }
  const jaw = group(root, 'JawSlide', [0.08, 1.32, 0]);
  shell(jaw, [0.12, 0, 0], [0.22, 0.42, 0.25], p.alloy, 0.18);
  box(jaw, [0.02, 0.02, 0], [0.06, 0.3, 0.22], p.edge);
  shell(jaw, [0.06, -0.22, 0], [0.28, 0.09, 0.16], p.accent, 0.2);
  if (detail) {
    for (const s of [-1, 1]) hose(b, [[s * 0.22, 0.66, s * 0.12], [s * 0.36, 0.78, s * 0.14], [s * 0.32, 0.92, s * 0.12]], 0.022, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.38, 0.38]) fastener(b, [sx, 0.17, 0.26], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Spin power core', 2.4, [spinTrack('PowerCore', 'z', 2.4, 2)]),
    new T.AnimationClip('Adjust jaw', 2.4, [slideTrack('JawSlide', [0.08, 1.32, 0], 0, [0, 0.7, 1.6, 2.4], [0, 0.2, 0.2, 0])]),
  ];
}

function runicLanternStaff(root: T.Group, p: Finish, detail: boolean) {
  const s = group(root, 'StaffBody');
  tube(s, [0, 0.08, 0], 0.38, 0.44, 0.16, p.dark, 8);
  ring(s, [0, 0.16, 0], 0.35, 0.04, 0.045, p.accent);
  tube(s, [0, 0.24, 0], 0.14, 0.22, 0.18, p.edge, 10);
  tube(s, [0, 0.98, 0], 0.056, 0.066, 1.44, p.primary, 12);
  tube(s, [0, 0.92, 0], 0.066, 0.066, 0.36, p.tire, 12);
  for (const y of [0.72, 1.12, 1.62]) ring(s, [0, y, 0], 0.078, 0.022, 0.055, p.alloy);
  strut(s, [0, 1.66, 0], [-0.18, 2.02, 0], 0.052, p.primary, 10);
  strut(s, [-0.18, 2.02, 0], [0.06, 2.28, 0], 0.048, p.primary, 10);
  strut(s, [0.06, 2.28, 0], [0.34, 2.16, 0], 0.042, p.primary, 10);
  strut(s, [0.34, 2.16, 0], [0.34, 1.98, 0], 0.026, p.alloy, 10);
  strut(s, [0, 1.54, 0], [-0.28, 1.54, 0], 0.024, p.edge, 8);
  const cage = group(root, 'RuneCage', [0.34, 1.72, 0]);
  for (const [y, r] of [[0.22, 0.16], [-0.22, 0.14]] as const) ring(cage, [0, y, 0], r, 0.032, 0.05, p.edge);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    strut(cage, [Math.sin(a) * 0.15, 0.22, Math.cos(a) * 0.15], [Math.sin(a) * 0.17, 0, Math.cos(a) * 0.17], 0.018, p.alloy, 8);
    strut(cage, [Math.sin(a) * 0.17, 0, Math.cos(a) * 0.17], [Math.sin(a) * 0.13, -0.22, Math.cos(a) * 0.13], 0.018, p.alloy, 8);
  }
  tube(cage, [0, 0.09, 0], 0.01, 0.1, 0.18, p.accent, 8);
  tube(cage, [0, -0.09, 0], 0.1, 0.01, 0.18, p.optic, 8);
  const charm = group(root, 'CharmRing', [-0.28, 1.52, 0]);
  torus(charm, [0, -0.1, 0], 0.09, 0.02, p.alloy, p.hd);
  for (const [cx, cy] of [[-0.06, -0.24], [0, -0.28], [0.06, -0.24]] as const) box(charm, [cx, cy, 0], [0.038, 0.095, 0.022], p.accent);
  if (detail) {
    orb(s, [-0.18, 2.04, 0], 0.072, p.accent, p.hd);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      box(s, [Math.sin(a) * 0.36, 0.08, Math.cos(a) * 0.36], [0.08, 0.06, 0.03], p.stencil).rotation.y = a;
    }
    if (p.hd) ring(cage, [0, 0, 0], 0.19, 0.018, 0.032, p.accent);
  }
  root.animations = [
    new T.AnimationClip('Spin rune cage', 3, [spinTrack('RuneCage', 'y', 3, 1)]),
    new T.AnimationClip('Sway charms', 2.6, [rotationTrack('CharmRing', 'z', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.42, 0, -0.42, 0])]),
  ];
}

function vintageCineCamera(root: T.Group, p: Finish, detail: boolean) {
  const cam = group(root, 'CineCamera');
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const fx = Math.sin(a) * 0.44, fz = Math.cos(a) * 0.44;
    strut(cam, [fx, 0.04, fz], [fx * 0.22, 0.54, fz * 0.22], 0.032, p.accent, 10);
    tube(cam, [fx, 0.03, fz], 0.042, 0.052, 0.06, p.tire, 10);
  }
  tube(cam, [0, 0.56, 0], 0.14, 0.16, 0.1, p.dark, 14);
  shell(cam, [0, 0.8, 0], [0.46, 0.42, 0.68], p.primary, 0.18);
  shell(cam, [0, 0.8, 0.36], [0.36, 0.34, 0.08], p.edge, 0.24);
  cyl(cam, [0, 0.8, 0.46], 0.11, 0.12, 0.22, p.dark, 'z', 16);
  cyl(cam, [0, 0.8, 0.57], 0.088, 0.088, 0.03, p.optic, 'z', 16);
  shell(cam, [0, 0.8, 0.6], [0.3, 0.24, 0.12], p.dark, 0.14);
  for (const [lx, ly] of [[-0.1, 0.9], [0.1, 0.7]] as const) cyl(cam, [lx, ly, 0.42], 0.052, 0.058, 0.12, p.alloy, 'z', 12);
  cyl(cam, [-0.28, 0.88, 0], 0.055, 0.055, 0.42, p.accent, 'z', 12);
  for (const [name, z] of [['ReelFront', 0.23], ['ReelRear', -0.23]] as const) {
    const reel = group(root, name, [0, 1.2, z]);
    for (const sx of [-0.075, 0.075]) {
      band(reel, [sx, 0, 0], 0.22, 0.04, 0.026, p.alloy, 'x');
      for (let i = 0; i < 4; i++) strut(reel, [sx, 0, 0], [sx, Math.sin(i * HPI) * 0.2, Math.cos(i * HPI) * 0.2], 0.016, p.alloy, 8);
    }
    cyl(reel, [0, 0, 0], 0.16, 0.16, 0.12, p.tire, 'x', 16);
    cyl(reel, [0, 0, 0], 0.068, 0.068, 0.19, p.accent, 'x', 12);
  }
  const crank = group(root, 'HandCrank', [0.25, 0.78, 0.02]);
  cyl(crank, [0.04, 0, 0], 0.04, 0.04, 0.08, p.accent, 'x', 12);
  strut(crank, [0.07, 0, 0], [0.07, -0.18, 0.14], 0.02, p.accent, 10);
  cyl(crank, [0.15, -0.18, 0.14], 0.034, 0.03, 0.14, p.dark, 'x', 12);
  if (detail) {
    cyl(cam, [-0.24, 0.76, -0.1], 0.072, 0.072, 0.03, p.stencil, 'x', 12);
    box(cam, [0.24, 0.9, -0.14], [0.025, 0.09, 0.24], p.accent);
    if (p.hd) for (const sz of [-0.24, 0.24]) fastener(cam, [0.24, 0.66, sz], p, 0.024).rotation.z = -HPI;
  }
  root.animations = [new T.AnimationClip('Roll film', 2.4, [
    spinTrack('ReelFront', 'x', 2.4, 2), spinTrack('ReelRear', 'x', 2.4, 2), spinTrack('HandCrank', 'x', 2.4, 2),
  ])];
}

function brassPocketCompass(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'CompassBase');
  shell(base, [0, 0.08, 0], [0.96, 0.16, 0.96], p.dark, 0.28);
  tube(base, [0, 0.28, 0], 0.28, 0.36, 0.28, p.edge, 14);
  ring(base, [0, 0.42, 0], 0.44, 0.055, 0.09, p.primary);
  tube(base, [0, 0.52, 0], 0.44, 0.4, 0.18, p.primary, 20);
  tube(base, [0, 0.59, 0], 0.38, 0.38, 0.04, p.stencil, 20);
  ring(base, [0, 0.63, 0], 0.44, 0.055, 0.07, p.primary);
  cyl(base, [0, 0.54, 0.48], 0.065, 0.055, 0.12, p.primary, 'z', 12);
  torus(base, [0, 0.54, 0.6], 0.1, 0.024, p.primary, p.hd);
  const needle = group(root, 'Needle', [0, 0.635, 0]);
  tube(needle, [0, 0.02, 0], 0.042, 0.048, 0.045, p.primary, 12);
  cyl(needle, [0, 0.015, 0.16], 0.008, 0.05, 0.3, p.accent, 'z', 8);
  tube(needle, [0, 0.015, -0.16], 0.008, 0.05, 0.3, p.dark, 8).rotation.x = -HPI;
  const lid = group(root, 'CompassLid', [0, 0.665, -0.43]);
  cyl(lid, [0, 0, 0], 0.036, 0.036, 0.16, p.edge, 'x', 10);
  ring(lid, [0, 0.03, 0.43], 0.44, 0.055, 0.065, p.primary);
  orb(lid, [0, 0.055, 0.43], 0.39, p.primary, p.hd, [1, 0.24, 1]);
  tube(lid, [0, 0.12, 0.43], 0.13, 0.14, 0.04, p.optic, 16);
  box(lid, [0, 0.02, 0.87], [0.09, 0.055, 0.055], p.accent);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      box(base, [Math.sin(a) * 0.31, 0.615, Math.cos(a) * 0.31], [0.022, 0.014, 0.09], i === 0 ? p.accent : p.dark).rotation.y = a;
    }
    if (p.hd) for (const sx of [-0.36, 0.36]) fastener(base, [sx, 0.165, 0.36], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Open compass', 2.8, [rotationTrack('CompassLid', 'x', [0, 0.75, 2, 2.8], [0, -1.75, -1.75, 0])]),
    new T.AnimationClip('Seek north', 3, [rotationTrack('Needle', 'y', [0, 0.75, 1.5, 2.25, 3], [0, 1.9, -0.8, 0.35, 0])]),
  ];
}

function acousticLute(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'LuteStand');
  for (const sx of [-0.36, 0.36]) {
    for (const sz of [-0.34, 0.32]) {
      strut(stand, [sx, 0.04, sz], [sx * 0.65, 0.56, -0.08], 0.032, p.dark, 10);
      tube(stand, [sx, 0.03, sz], 0.04, 0.045, 0.06, p.tire, 10);
    }
  }
  strut(stand, [-0.26, 0.24, 0.16], [0.26, 0.24, 0.16], 0.028, p.edge, 10);
  const body = group(root, 'LuteBody', [0, 0.22, 0.06]);
  orb(body, [0, 0.36, -0.06], 0.34, p.primary, p.hd, [1.02, 1.24, 0.72]);
  cyl(body, [0, 0.36, 0.11], 0.31, 0.31, 0.06, p.stencil, 'z', 18);
  band(body, [0, 0.42, 0.15], 0.11, 0.028, 0.024, p.accent, 'z');
  cyl(body, [0, 0.42, 0.142], 0.088, 0.088, 0.022, p.inset, 'z', 14);
  box(body, [0, 0.18, 0.155], [0.24, 0.055, 0.035], p.accent);
  shell(body, [0, 0.98, 0.07], [0.13, 0.68, 0.08], p.primary, 0.22);
  box(body, [0, 0.98, 0.115], [0.11, 0.66, 0.025], p.accent);
  const pb = group(body, '', [0, 1.34, 0.06]);
  pb.rotation.x = -0.82;
  shell(pb, [0, 0.16, 0], [0.12, 0.34, 0.07], p.accent, 0.2);
  const peg = group(pb, 'TuningPeg', [0.09, 0.22, 0]);
  cyl(peg, [0, 0, 0], 0.016, 0.018, 0.14, p.primary, 'x', 10);
  shell(peg, [0.075, 0, 0], [0.032, 0.075, 0.055], p.stencil, 0.3);
  for (const y of [0.08, 0.15, 0.29]) for (const sx of [-0.08, 0.08]) cyl(pb, [sx, y, 0], 0.014, 0.016, 0.1, p.primary, 'x', 8);
  if (detail) {
    for (const x of [-0.04, -0.02, 0, 0.02, 0.04]) strut(body, [x, 0.2, 0.165], [x * 0.7, 1.32, 0.13], 0.004, p.alloy, 6);
    for (const y of [0.76, 0.88, 1.0, 1.12, 1.24]) box(body, [0, y, 0.13], [0.115, 0.012, 0.014], p.alloy);
    if (p.hd) for (const sx of [-0.14, 0, 0.14]) strut(body, [sx, 0.08, -0.18], [sx * 0.5, 0.68, -0.16], 0.016, p.accent, 8);
  }
  root.animations = [
    new T.AnimationClip('Strum sway', 2.8, [rotationTrack('LuteBody', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.18, 0, -0.18, 0])]),
    new T.AnimationClip('Tune peg', 2, [spinTrack('TuningPeg', 'z', 2, 1)]),
  ];
}

function twinJetpack(root: T.Group, p: Finish, detail: boolean) {
  const pk = group(root, 'JetpackBody');
  shell(pk, [0, 0.06, 0], [0.84, 0.12, 0.72], p.dark, 0.22);
  for (const sx of [-0.32, 0.32]) strut(pk, [sx, 0.1, -0.12], [sx, 0.56, -0.12], 0.032, p.edge, 10);
  shell(pk, [0, 0.8, -0.14], [0.72, 0.76, 0.16], p.dark, 0.26);
  shell(pk, [0, 0.82, 0.02], [0.42, 0.68, 0.24], p.edge, 0.24);
  for (const sx of [-0.34, 0.34]) {
    tube(pk, [sx, 0.84, 0.08], 0.15, 0.16, 0.66, p.primary, 16);
    orb(pk, [sx, 1.18, 0.08], 0.15, p.accent, p.hd, [1, 1.1, 1]);
    ring(pk, [sx, 0.62, 0.08], 0.172, 0.026, 0.065, p.accent);
    box(pk, [sx * 1.48, 0.9, 0.04], [0.22, 0.34, 0.055], p.primary).rotation.z = sx < 0 ? 0.32 : -0.32;
    strut(pk, [sx * 0.68, 1.06, -0.2], [sx * 0.68, 0.52, -0.26], 0.038, p.tire, 10);
  }
  for (const [name, x] of [['NozzleL', -0.34], ['NozzleR', 0.34]] as const) {
    const noz = group(root, name, [x, 0.5, 0.08]);
    tube(noz, [0, -0.12, 0], 0.095, 0.145, 0.24, p.edge, 16);
    ring(noz, [0, -0.22, 0], 0.152, 0.025, 0.045, p.alloy);
    tube(noz, [0, -0.18, 0], 0.085, 0.105, 0.12, p.optic, 14);
  }
  const fuel = group(root, 'FuelCell', [0, 0.84, 0.2]);
  tube(fuel, [0, 0, 0], 0.11, 0.11, 0.44, p.accent, 14);
  tube(fuel, [0, 0, 0.07], 0.036, 0.036, 0.28, p.optic, 12);
  tube(fuel, [0, 0.24, 0], 0.09, 0.115, 0.075, p.primary, 12);
  strut(fuel, [-0.07, 0.29, 0], [0.07, 0.29, 0], 0.018, p.alloy, 8);
  if (detail) {
    for (const s of [-1, 1]) {
      hose(pk, [[s * 0.12, 0.96, 0.2], [s * 0.24, 1.02, 0.22], [s * 0.34, 0.96, 0.18]], 0.022, p.tire, p.hd);
      if (p.hd) fastener(pk, [s * 0.34, 0.84, 0.24], p, 0.025).rotation.x = HPI;
    }
  }
  root.animations = [new T.AnimationClip('Vector thrust', 2.6, [
    rotationTrack('NozzleL', 'x', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.48, 0, -0.48, 0]),
    rotationTrack('NozzleR', 'x', [0, 0.65, 1.3, 1.95, 2.6], [0, -0.48, 0, 0.48, 0]),
  ])];
}

function wingedKiteShield(root: T.Group, p: Finish, detail: boolean) {
  const sh = group(root, 'KiteShield');
  shell(sh, [0, 0.06, -0.08], [0.84, 0.12, 0.68], p.dark, 0.22);
  for (const sx of [-0.26, 0.26]) for (const sz of [-0.34, 0.16]) strut(sh, [sx, 0.1, sz], [sx * 0.8, 0.86, -0.02], 0.03, p.edge, 10);
  shell(sh, [0, 1.04, 0.06], [0.76, 0.64, 0.1], p.primary, 0.28);
  shell(sh, [0, 0.64, 0.06], [0.56, 0.42, 0.095], p.primary, 0.38);
  shell(sh, [0, 0.36, 0.06], [0.3, 0.28, 0.09], p.accent, 0.44);
  box(sh, [0, 0.86, 0.115], [0.12, 1.02, 0.03], p.accent);
  box(sh, [0, 1.02, 0.115], [0.68, 0.12, 0.03], p.accent);
  orb(sh, [0, 1.02, 0.14], 0.14, p.accent, p.hd, [1, 1, 0.55]);
  orb(sh, [0, 1.02, 0.2], 0.058, p.optic, p.hd);
  for (const y of [0.82, 1.12]) box(sh, [0, y, -0.01], [0.34, 0.06, 0.06], p.tire);
  for (const [name, side] of [['WingPlateL', -1], ['WingPlateR', 1]] as const) {
    const wing = group(root, name, [side * 0.36, 1.06, 0.06]);
    for (const [idx, yOff, len, ang] of [[0, 0.18, 0.48, 0.26], [1, 0.02, 0.42, 0.08], [2, -0.14, 0.34, -0.12]] as const) {
      shell(wing, [side * len * 0.5, yOff, 0], [len, 0.12, 0.055], idx === 0 ? p.accent : p.alloy, 0.28).rotation.z = side * ang;
    }
  }
  if (detail) {
    for (const sx of [-0.32, 0.32]) for (const y of [0.78, 1.02, 1.26]) fastener(sh, [sx, y, 0.115], p, 0.024).rotation.x = HPI;
    if (p.hd) band(sh, [0, 1.02, 0.135], 0.16, 0.024, 0.032, p.alloy, 'z');
  }
  root.animations = [new T.AnimationClip('Deploy wings', 2.8, [
    rotationTrack('WingPlateL', 'y', [0, 0.75, 2, 2.8], [0, -0.76, -0.76, 0]),
    rotationTrack('WingPlateR', 'y', [0, 0.75, 2, 2.8], [0, 0.76, 0.76, 0]),
  ])];
}

function expeditionBackpack(root: T.Group, p: Finish, detail: boolean) {
  const pk = group(root, 'BackpackBody');
  shell(pk, [0, 0.1, 0], [0.76, 0.2, 0.56], p.tire, 0.24);
  shell(pk, [0, 0.58, 0], [0.74, 0.82, 0.52], p.primary, 0.24);
  shell(pk, [0, 0.97, 0], [0.64, 0.12, 0.42], p.inset, 0.22);
  for (const sx of [-0.34, 0.34]) {
    strut(pk, [sx, 0.12, -0.28], [sx, 1.12, -0.28], 0.022, p.alloy, 10);
    shell(pk, [sx * 0.72, 0.62, -0.34], [0.14, 0.68, 0.09], p.dark, 0.32);
    shell(pk, [sx * 1.18, 0.56, 0], [0.18, 0.44, 0.3], p.primary, 0.26);
    box(pk, [sx * 1.24, 0.58, 0], [0.06, 0.1, 0.26], p.accent);
  }
  shell(pk, [0, 0.62, 0.28], [0.46, 0.36, 0.12], p.primary, 0.22);
  box(pk, [0, 0.72, 0.345], [0.38, 0.04, 0.022], p.dark);
  const flap = group(root, 'TopFlap', [0, 1.0, -0.24]);
  shell(flap, [0, 0.08, 0.26], [0.78, 0.18, 0.58], p.primary, 0.26);
  for (const sx of [-0.2, 0.2]) {
    box(flap, [sx, -0.06, 0.54], [0.075, 0.32, 0.035], p.accent);
    box(flap, [sx, -0.14, 0.56], [0.095, 0.065, 0.025], p.alloy);
  }
  const bed = group(root, 'Bedroll', [0, 0.22, 0.34]);
  cyl(bed, [0, 0, 0], 0.14, 0.14, 0.72, p.accent, 'x', 16);
  for (const sx of [-0.365, 0.365]) band(bed, [sx, 0, 0], 0.11, 0.04, 0.02, p.stencil, 'x');
  for (const sx of [-0.22, 0.22]) band(bed, [sx, 0, 0], 0.148, 0.018, 0.048, p.dark, 'x');
  if (detail) {
    tube(pk, [0.48, 0.34, 0.16], 0.075, 0.07, 0.13, p.stencil, 12);
    strut(pk, [-0.46, 0.18, -0.12], [-0.46, 1.18, -0.12], 0.018, p.edge, 8);
    if (p.hd) for (const sx of [-0.2, 0.2]) fastener(flap, [sx, 0.175, 0.28], p, 0.026);
  }
  root.animations = [new T.AnimationClip('Open top flap', 2.8, [rotationTrack('TopFlap', 'x', [0, 0.75, 2, 2.8], [0, -1.36, -1.36, 0])])];
}

function shoulderTurretPod(root: T.Group, p: Finish, detail: boolean) {
  const m = group(root, 'ShoulderMount');
  shell(m, [0, 0.08, 0], [0.88, 0.16, 0.84], p.dark, 0.22);
  shell(m, [0, 0.28, 0], [0.76, 0.26, 0.68], p.primary, 0.32);
  shell(m, [0, 0.44, 0], [0.46, 0.14, 0.46], p.edge, 0.3);
  const yaw = group(root, 'PodYaw', [0, 0.54, 0]);
  ring(yaw, [0, 0, 0], 0.26, 0.055, 0.09, p.alloy);
  shell(yaw, [0, 0.14, -0.02], [0.48, 0.2, 0.46], p.primary, 0.22);
  for (const sx of [-0.22, 0.22]) shell(yaw, [sx, 0.32, 0], [0.1, 0.28, 0.32], p.accent, 0.2);
  cyl(yaw, [-0.36, 0.24, -0.06], 0.14, 0.14, 0.22, p.dark, 'x', 14);
  band(yaw, [-0.36, 0.24, -0.06], 0.148, 0.018, 0.055, p.accent, 'x');
  const bar = group(yaw, 'PodBarrel', [0, 0.34, 0.04]);
  shell(bar, [0, 0, 0], [0.32, 0.24, 0.56], p.dark, 0.2);
  shell(bar, [0, 0.14, -0.04], [0.22, 0.075, 0.42], p.primary, 0.24);
  shell(bar, [0, 0.2, 0.06], [0.12, 0.09, 0.18], p.accent, 0.2);
  for (const sx of [-0.08, 0.08]) {
    cyl(bar, [sx, 0.02, 0.48], 0.036, 0.044, 0.52, p.alloy, 'z', 14);
    cyl(bar, [sx, 0.02, 0.74], 0.048, 0.044, 0.09, p.edge, 'z', 14);
  }
  cyl(bar, [0, -0.1, 0.36], 0.045, 0.045, 0.26, p.edge, 'z', 12);
  cyl(bar, [0, -0.1, 0.5], 0.034, 0.034, 0.03, p.optic, 'z', 12);
  if (detail) {
    hose(yaw, [[-0.28, 0.24, -0.06], [-0.2, 0.34, -0.16], [-0.1, 0.34, -0.12]], 0.026, p.tire, p.hd);
    strut(yaw, [0.22, 0.42, -0.14], [0.24, 0.74, -0.18], 0.012, p.alloy, 8);
    if (p.hd) for (const sx of [-0.28, 0.28]) fastener(m, [sx, 0.42, 0.26], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Sweep turret', 3.2, [rotationTrack('PodYaw', 'y', [0, 0.8, 1.6, 2.4, 3.2], [0, 1.1, 0, -1.1, 0])]),
    new T.AnimationClip('Elevate barrels', 2.6, [rotationTrack('PodBarrel', 'x', [0, 0.65, 1.3, 1.95, 2.6], [0, -0.46, 0, 0.65, 0])]),
  ];
}

const rig = (name: string, label: string, axis: Axis, range: [number, number], describe: string, type: 'rotate' | 'slide' = 'rotate'): RiggedPartSpec =>
  ({ name, label, type, axis, range, describe });
const det = (name: string, label: string, describe: string): DetachablePartSpec => ({ name, label, describe });
const gearDef = (
  id: string, code: string, browseCategory: 'ultra' | 'attachment', name: string, primary: string, accent: string,
  description: string, riggedParts: readonly RiggedPartSpec[], detachableParts: readonly DetachablePartSpec[], build: GearAssetDef['build'],
): GearAssetDef => ({
  id, code, category: 'Object', browseCategory, name, primary, accent, description, physicsBody: 'dynamic', riggedParts, detachableParts, build,
});

export const gearPack: readonly GearAssetDef[] = [
  gearDef('brass-spyglass', 'HI-01', 'ultra', 'Brass Spyglass', '#c9973e', '#6e3c25', 'Leather-wrapped brass telescope on a tabletop cradle with a telescoping lens tube and hinged cap.',
    [rig('LensTube', 'Lens tube', 'z', [0, 0.45], 'Extends the telescoping objective drawtube', 'slide'), rig('LensCap', 'Lens cap', 'x', [0, -110], 'Flips open the brass front lens cap')], [], brassSpyglass),
  gearDef('plasma-wrench', 'HI-02', 'ultra', 'Plasma Wrench', '#3f6e8c', '#f08728', 'Powered sci-fi engineering wrench in a charging dock with a sliding jaw and spinning energy core.',
    [rig('JawSlide', 'Jaw slide', 'x', [0, 0.22], 'Slides the adjustable jaw open and shut', 'slide'), rig('PowerCore', 'Power core', 'z', [0, 360], 'Spins the magnetic plasma drive core')], [], plasmaWrench),
  gearDef('runic-lantern-staff', 'HI-03', 'ultra', 'Runic Lantern Staff', '#6b4932', '#3fd1c4', 'Carved wooden lantern staff in a rune plinth with a rotating crystal cage and swaying charm ring.',
    [rig('RuneCage', 'Rune cage', 'y', [0, 360], 'Spins the arcane crystal lantern cage'), rig('CharmRing', 'Charm ring', 'z', [-28, 28], 'Swings the hanging talisman ring')], [], runicLanternStaff),
  gearDef('vintage-cine-camera', 'HI-04', 'ultra', 'Vintage Cine Camera', '#3c424a', '#d6a44e', 'Twin-reel classic film camera on a studio tripod with spinning reels and a side hand crank.',
    [rig('ReelFront', 'Front reel', 'x', [0, 360], 'Spins the front film magazine reel'), rig('ReelRear', 'Rear reel', 'x', [0, 360], 'Spins the rear film magazine reel'), rig('HandCrank', 'Hand crank', 'x', [0, 360], 'Turns the manual film advance crank')], [], vintageCineCamera),
  gearDef('brass-pocket-compass', 'HI-05', 'ultra', 'Brass Pocket Compass', '#cfa045', '#b83c32', 'Hunter-case nautical pocket compass on a navigator plinth with a hinged dome lid and spinning needle.',
    [rig('CompassLid', 'Compass lid', 'x', [0, -110], 'Flips open the domed brass cover'), rig('Needle', 'Compass needle', 'y', [0, 360], 'Rotates the magnetic directional needle')], [], brassPocketCompass),
  gearDef('acoustic-lute', 'HI-06', 'ultra', 'Acoustic Lute', '#b5743c', '#3e291e', 'Ribbed Renaissance lute on a wooden display stand with a rotating tuning peg and swaying body.',
    [rig('TuningPeg', 'Tuning peg', 'z', [0, 360], 'Turns the carved pegbox tuning peg'), rig('LuteBody', 'Lute body', 'z', [-12, 12], 'Sways the stringed lute gently')], [], acousticLute),
  gearDef('twin-jetpack', 'AT-01', 'attachment', 'Twin Jetpack', '#d46233', '#dfe5e2', 'Dual-thruster flight pack on a hangar stand with vectoring nozzles and a detachable center fuel cell.',
    [rig('NozzleL', 'Left nozzle', 'x', [-30, 30], 'Vectors the left thruster bell'), rig('NozzleR', 'Right nozzle', 'x', [-30, 30], 'Vectors the right thruster bell')], [det('FuelCell', 'Fuel cell', 'Removable center pressurized propellant canister')], twinJetpack),
  gearDef('winged-kite-shield', 'AT-02', 'attachment', 'Winged Kite Shield', '#2c5482', '#dfb54b', 'Heraldic kite shield on an armory easel with deploying left and right armored wing plates.',
    [rig('WingPlateL', 'Left wing plate', 'y', [0, -45], 'Deploys the left feathered wing plate'), rig('WingPlateR', 'Right wing plate', 'y', [0, 45], 'Deploys the right feathered wing plate')], [], wingedKiteShield),
  gearDef('expedition-backpack', 'AT-03', 'attachment', 'Expedition Backpack', '#4e6b46', '#c47b3a', 'External-frame canvas alpine pack with a hinged rain flap and detachable rolled bedroll.',
    [rig('TopFlap', 'Top flap', 'x', [0, -85], 'Lifts the top rain flap open')], [det('Bedroll', 'Bedroll', 'Lashed lower canvas and wool sleeping roll')], expeditionBackpack),
  gearDef('shoulder-turret-pod', 'AT-04', 'attachment', 'Shoulder Turret Pod', '#576870', '#e89d2c', 'Pauldron-mounted twin autocannon turret pod with panning azimuth ring and elevating barrels.',
    [rig('PodYaw', 'Turret yaw', 'y', [-70, 70], 'Pans the turret pod horizontally'), rig('PodBarrel', 'Turret barrels', 'x', [-30, 45], 'Elevates and depresses the twin barrels')], [], shoulderTurretPod),
];
