import * as T from 'three';
import { box, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../parts';
import type { Finish, Point } from '../parts';
import { fastener } from '../hd-detail';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';

export interface PropAssetDef {
  id: string; code: string; category: 'Object'; browseCategory: BrowseCategory;
  name: string; primary: string; accent: string; description: string;
  physicsBody: 'static' | 'dynamic';
  riggedParts: readonly RiggedPartSpec[];
  detachableParts: readonly DetachablePartSpec[];
  build: (root: T.Group, p: Finish, detail: boolean) => void;
}

const HPI = Math.PI / 2;
function pane(parent: T.Object3D, at: Point, size: Point) {
  const mat = new T.MeshStandardMaterial({
    name: 'Display glass', color: '#a8dce2', metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.22, depthWrite: false,
  });
  const part = box(parent, at, size, mat);
  part.castShadow = false;
  return part;
}

function orb(parent: T.Object3D, at: Point, r: number, mat: T.Material, hd: boolean, scale?: Point) {
  const part = mesh(parent, new T.SphereGeometry(r, hd ? 20 : 8, hd ? 14 : 6), mat, at);
  if (scale) part.scale.set(...scale);
  return part;
}
const torus = (parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean) =>
  mesh(parent, new T.TorusGeometry(r, t, hd ? 12 : 6, hd ? 28 : 12), mat, at);
function cyl(parent: T.Object3D, at: Point, rt: number, rb: number, h: number, mat: T.Material, axis: Axis, sides = 12) {
  const part = tube(parent, at, rt, rb, h, mat, sides);
  if (axis === 'x') part.rotation.z = HPI;
  else if (axis === 'z') part.rotation.x = HPI;
  return part;
}
function slideTrack(node: string, rest: Point, axis: 0 | 1 | 2, times: number[], offsets: number[]) {
  return new T.VectorKeyframeTrack(node + '.position', times, offsets.flatMap(d => {
    const pt: Point = [rest[0], rest[1], rest[2]];
    pt[axis] += d;
    return pt;
  }));
}

function spokedWheel(parent: T.Object3D, name: string, at: Point, r: number, width: number, p: Finish, detail: boolean, rimMat: T.Material) {
  const wheel = group(parent, name, at);
  const axle = group(wheel, '');
  axle.rotation.z = HPI;
  ring(axle, [0, 0, 0], r, Math.max(0.032, r * 0.14), width, p.tire);
  ring(axle, [0, 0, 0], r * 0.87, Math.max(0.024, r * 0.09), width * 0.78, rimMat);
  tube(axle, [0, 0, 0], r * 0.22, r * 0.22, width * 1.15, p.dark, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    strut(axle, [0, 0, 0], [Math.sin(a) * r * 0.82, 0, Math.cos(a) * r * 0.82], Math.max(0.014, r * 0.045), rimMat, 10);
  }
  if (detail) {
    for (const s of [-1, 1]) tube(axle, [0, s * width * 0.58, 0], r * 0.11, r * 0.14, 0.035, p.alloy, 10);
    if (p.hd) fastener(axle, [0, width * 0.62, 0], p, 0.028);
  }
  return wheel;
}

function treasureChest(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'ChestBody');
  for (const sx of [-0.66, 0.66]) for (const sz of [-0.4, 0.4]) shell(body, [sx, 0.06, sz], [0.18, 0.12, 0.18], p.dark, 0.3);
  shell(body, [0, 0.39, 0], [1.46, 0.62, 0.94], p.primary, 0.18);
  shell(body, [0, 0.65, 0], [1.32, 0.12, 0.8], p.inset, 0.15);
  for (const x of [-0.62, -0.22, 0.22, 0.62]) box(body, [x, 0.39, 0], [0.085, 0.64, 0.98], p.accent);
  shell(body, [0, 0.48, 0.49], [0.22, 0.26, 0.055], p.accent, 0.3);
  box(body, [0, 0.46, 0.52], [0.042, 0.1, 0.025], p.inset);
  for (const sx of [-1, 1]) {
    box(body, [sx * 0.74, 0.42, 0], [0.05, 0.16, 0.18], p.edge);
    torus(body, [sx * 0.78, 0.35, 0], 0.1, 0.022, p.alloy, p.hd).rotation.y = HPI;
  }
  const tray = group(root, 'GoldTray', [0, 0.62, 0]);
  shell(tray, [0, 0, 0], [1.22, 0.08, 0.72], p.dark, 0.2);
  for (const [cx, cz, h] of [[-0.4, -0.14, 0.12], [-0.14, 0.12, 0.16], [0.15, -0.1, 0.14], [0.42, 0.1, 0.11], [0, 0.02, 0.18]] as const) {
    tube(tray, [cx, h * 0.5 + 0.03, cz], 0.11, 0.12, h, p.accent, 12);
  }
  orb(tray, [-0.28, 0.14, 0.08], 0.085, p.optic, p.hd, [1.2, 0.8, 1]);
  orb(tray, [0.28, 0.13, -0.12], 0.075, p.optic, p.hd);
  const lid = group(root, 'ChestLid', [0, 0.7, -0.47]);
  cyl(lid, [0, 0.03, 0.47], 0.46, 0.46, 1.44, p.primary, 'x', 16).scale.set(0.68, 1, 1);
  shell(lid, [0, 0.04, 0.47], [1.48, 0.11, 0.96], p.primary, 0.2);
  for (const x of [-0.62, -0.22, 0.22, 0.62]) {
    const band = ring(lid, [x, 0.04, 0.47], 0.475, 0.045, 0.085, p.accent);
    band.rotation.z = HPI;
    band.scale.set(0.69, 1, 1);
  }
  box(lid, [0, -0.02, 0.96], [0.12, 0.18, 0.05], p.accent);
  if (detail) {
    for (const x of [-0.62, 0.62]) {
      for (const y of [0.22, 0.56]) fastener(body, [x, y, 0.5], p, 0.028).rotation.x = HPI;
      box(body, [x, 0.68, -0.49], [0.12, 0.18, 0.045], p.edge);
    }
    for (const y of [0.26, 0.42, 0.58]) box(body, [0, y, 0.475], [1.38, 0.018, 0.015], p.dark);
    if (p.hd) for (const x of [-0.42, 0, 0.42]) fastener(lid, [x, 0.34, 0.47], p, 0.03);
  }
  root.animations = [new T.AnimationClip('Open chest', 3.2, [rotationTrack('ChestLid', 'x', [0, 0.9, 2.2, 3.2], [0, -1.45, -1.45, 0])])];
}

function grandfatherClock(root: T.Group, p: Finish, detail: boolean) {
  const c = group(root, 'ClockCase');
  shell(c, [0, 0.12, 0], [0.96, 0.24, 0.72], p.dark, 0.2);
  shell(c, [0, 0.44, 0], [0.84, 0.44, 0.62], p.primary, 0.16);
  box(c, [0, 1.15, -0.14], [0.68, 1.04, 0.24], p.primary);
  for (const sx of [-1, 1]) {
    box(c, [sx * 0.31, 1.15, 0.04], [0.11, 1.04, 0.44], p.primary);
    tube(c, [sx * 0.35, 1.15, 0.24], 0.048, 0.052, 1.02, p.primary, 12);
    tube(c, [sx * 0.35, 1.65, 0.24], 0.068, 0.052, 0.07, p.accent, 12);
    tube(c, [sx * 0.35, 0.67, 0.24], 0.052, 0.068, 0.07, p.accent, 12);
  }
  box(c, [0, 1.15, -0.02], [0.52, 0.96, 0.05], p.inset);
  shell(c, [0, 1.98, 0], [0.88, 0.66, 0.64], p.primary, 0.18);
  shell(c, [0, 2.34, 0], [0.98, 0.13, 0.72], p.dark, 0.22);
  shell(c, [0, 2.44, 0], [0.68, 0.12, 0.56], p.primary, 0.3);
  tube(c, [0, 2.58, 0], 0.018, 0.055, 0.2, p.accent, 12);
  orb(c, [0, 2.68, 0], 0.055, p.accent, p.hd);
  cyl(c, [0, 1.98, 0.31], 0.25, 0.25, 0.045, p.stencil, 'z', 18);
  ring(c, [0, 1.98, 0.33], 0.27, 0.04, 0.055, p.accent).rotation.x = HPI;
  box(c, [0.05, 2.02, 0.355], [0.14, 0.024, 0.018], p.inset).rotation.z = 0.52;
  box(c, [0, 2.07, 0.36], [0.022, 0.19, 0.018], p.inset);
  const pend = group(root, 'ClockPendulum', [0, 1.58, 0.07]);
  strut(pend, [0, 0, 0], [0, -0.78, 0], 0.016, p.accent, 10);
  cyl(pend, [0, -0.82, 0], 0.13, 0.13, 0.042, p.accent, 'z', 16);
  const door = group(root, 'GlassDoor', [-0.26, 1.15, 0.26]);
  for (const x of [0.04, 0.48]) box(door, [x, 0, 0], [0.075, 0.96, 0.05], p.primary);
  for (const y of [-0.44, 0.44]) box(door, [0.26, y, 0], [0.52, 0.08, 0.05], p.primary);
  pane(door, [0.26, 0, 0], [0.38, 0.8, 0.022]);
  orb(door, [0.47, 0, 0.05], 0.036, p.accent, p.hd);
  if (detail) {
    for (const sx of [-0.14, 0.14]) {
      strut(c, [sx, 1.56, 0.04], [sx, 1.02, 0.04], 0.008, p.alloy, 6);
      tube(c, [sx, 0.96, 0.04], 0.044, 0.044, 0.18, p.accent, 12);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      box(c, [Math.sin(a) * 0.2, 1.98 + Math.cos(a) * 0.2, 0.345], [0.018, 0.04, 0.012], p.dark).rotation.z = -a;
    }
    if (p.hd) for (const sx of [-0.36, 0.36]) orb(c, [sx, 2.52, 0], 0.048, p.accent, p.hd);
  }
  root.animations = [
    new T.AnimationClip('Tick pendulum', 2.4, [rotationTrack('ClockPendulum', 'z', [0, 0.6, 1.2, 1.8, 2.4], [0, 0.31, 0, -0.31, 0])]),
    new T.AnimationClip('Open door', 3, [rotationTrack('GlassDoor', 'y', [0, 0.8, 2.1, 3], [0, 1.28, 1.28, 0])]),
  ];
}

function streetVendingUnit(root: T.Group, p: Finish, detail: boolean) {
  const u = group(root, 'VendingUnit');
  for (const sx of [-0.52, 0.52]) for (const sz of [-0.36, 0.36]) tube(u, [sx, 0.05, sz], 0.055, 0.065, 0.1, p.tire, 10);
  shell(u, [0, 1.12, -0.14], [1.24, 2.04, 0.6], p.primary, 0.12);
  box(u, [0, 0.44, 0.29], [1.22, 0.68, 0.28], p.primary);
  box(u, [0.43, 1.36, 0.29], [0.36, 1.18, 0.28], p.primary);
  box(u, [-0.56, 1.36, 0.29], [0.1, 1.18, 0.28], p.primary);
  shell(u, [0, 2.04, 0.02], [1.24, 0.22, 0.88], p.accent, 0.14);
  box(u, [0, 2.04, 0.465], [0.98, 0.14, 0.025], p.stencil);
  box(u, [-0.13, 1.355, 0.175], [0.76, 1.15, 0.03], p.inset);
  for (const y of [0.92, 1.24, 1.56]) box(u, [-0.13, y, 0.3], [0.74, 0.028, 0.22], p.alloy);
  pane(u, [-0.13, 1.355, 0.422], [0.76, 1.14, 0.014]);
  shell(u, [0.43, 1.26, 0.44], [0.26, 0.72, 0.055], p.dark, 0.2);
  box(u, [0.43, 1.46, 0.475], [0.16, 0.11, 0.02], p.optic);
  box(u, [-0.13, 0.44, 0.435], [0.76, 0.3, 0.03], p.inset);
  const cans = group(root, 'CanDisplay', [-0.13, 0.935, 0.32]);
  const mats = [p.primary, p.accent, p.optic, p.stencil] as const;
  for (const [row, ry] of [0, 0.32, 0.64].entries()) {
    for (let i = 0; i < 4; i++) tube(cans, [-0.24 + i * 0.16, ry + 0.095, 0], 0.052, 0.052, 0.18, mats[(i + row) % 4] ?? p.accent, 12);
  }
  const flap = group(root, 'PickupFlap', [-0.13, 0.56, 0.455]);
  shell(flap, [0, -0.12, 0.01], [0.74, 0.24, 0.048], p.alloy, 0.2);
  box(flap, [0, -0.21, 0.035], [0.58, 0.04, 0.025], p.tire);
  if (detail) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box(u, [0.37 + c * 0.06, 1.08 + r * 0.075, 0.478], [0.038, 0.042, 0.02], p.accent);
    for (const y of [0.35, 0.48, 0.61, 0.74]) box(u, [0, y, -0.45], [0.88, 0.045, 0.022], p.dark);
    if (p.hd) for (const sx of [-0.56, 0.56]) fastener(u, [sx, 2.04, 0.47], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Dispense flap', 2.6, [rotationTrack('PickupFlap', 'x', [0, 0.65, 1.8, 2.6], [0, -0.88, -0.88, 0])])];
}

function blacksmithForge(root: T.Group, p: Finish, detail: boolean) {
  const h = group(root, 'ForgeHearth');
  shell(h, [-0.18, 0.08, 0], [1.46, 0.16, 1.16], p.dark, 0.16);
  shell(h, [-0.18, 0.54, 0], [1.34, 0.78, 1.04], p.primary, 0.14);
  box(h, [-0.18, 0.4, 0.42], [0.68, 0.44, 0.28], p.inset);
  for (const x of [-0.32, -0.18, -0.04]) cyl(h, [x, 0.26, 0.4], 0.055, 0.055, 0.36, p.dark, 'z', 10);
  shell(h, [-0.18, 0.94, 0], [1.14, 0.14, 0.86], p.inset, 0.2);
  for (const [ex, ez, r] of [[-0.32, 0.08, 0.16], [-0.12, -0.06, 0.19], [0.06, 0.1, 0.15], [-0.2, 0.12, 0.14]] as const) {
    orb(h, [ex, 1.0, ez], r, p.accent, p.hd, [1.2, 0.65, 1.1]);
  }
  for (const sx of [-0.74, 0.38]) for (const sz of [-0.42, 0.42]) strut(h, [sx, 0.9, sz], [sx, 1.56, sz], 0.042, p.edge, 10);
  shell(h, [-0.18, 1.64, 0], [1.32, 0.26, 1.02], p.dark, 0.24);
  tube(h, [-0.18, 2.02, -0.08], 0.24, 0.46, 0.56, p.dark, 12);
  ring(h, [-0.18, 1.78, -0.08], 0.44, 0.045, 0.075, p.accent);
  shell(h, [-1.1, 0.42, 0.04], [0.34, 0.84, 0.34], p.edge, 0.25);
  shell(h, [-1.1, 0.85, -0.04], [0.46, 0.065, 0.64], p.dark, 0.42);
  cyl(h, [-0.94, 0.89, 0.26], 0.042, 0.058, 0.38, p.alloy, 'x', 10);
  const bel = group(root, 'BellowsTop', [-1.1, 0.93, 0.26]);
  shell(bel, [0, 0.04, -0.32], [0.46, 0.065, 0.64], p.primary, 0.42);
  shell(bel, [0, -0.03, -0.28], [0.38, 0.1, 0.48], p.tire, 0.35);
  strut(bel, [0, 0.05, -0.62], [0, 0.05, -0.82], 0.03, p.accent, 10);
  const anvil = group(root, 'AnvilBlock', [0.88, 0, 0.14]);
  tube(anvil, [0, 0.32, 0], 0.28, 0.31, 0.64, p.primary, 12);
  ring(anvil, [0, 0.52, 0], 0.295, 0.028, 0.065, p.edge);
  shell(anvil, [0, 0.72, 0], [0.38, 0.16, 0.26], p.edge, 0.22);
  shell(anvil, [0, 0.88, 0], [0.48, 0.14, 0.24], p.alloy, 0.18);
  tube(anvil, [0.34, 0.9, 0], 0.025, 0.095, 0.28, p.alloy, 12).rotation.z = -HPI;
  if (detail) {
    for (const x of [-0.62, -0.28, 0.08, 0.3]) box(h, [x, 0.74, 0.525], [0.22, 0.11, 0.035], p.edge);
    strut(anvil, [-0.14, 0.98, 0.04], [0.06, 0.98, -0.14], 0.018, p.primary, 8);
    box(anvil, [0.08, 0.99, -0.15], [0.07, 0.065, 0.13], p.dark);
    if (p.hd) for (const x of [-0.58, -0.18, 0.22]) fastener(h, [x, 1.64, 0.51], p, 0.028).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Pump bellows', 2, [rotationTrack('BellowsTop', 'x', [0, 0.5, 1, 1.5, 2], [0, 0.45, 0.05, 0.45, 0])])];
}

function espressoBarCart(root: T.Group, p: Finish, detail: boolean) {
  const cart = group(root, 'EspressoCart');
  shell(cart, [0, 0.62, 0], [1.14, 0.54, 0.84], p.primary, 0.16);
  shell(cart, [0, 0.92, 0], [1.28, 0.09, 0.96], p.dark, 0.18);
  for (const sx of [-0.46, 0.46]) {
    strut(cart, [sx, 0.36, -0.32], [sx, 0.05, -0.32], 0.038, p.edge, 10);
    tube(cart, [sx, 0.04, -0.32], 0.055, 0.055, 0.08, p.tire, 10);
    strut(cart, [sx, 0.92, -0.44], [sx, 1.06, -0.58], 0.024, p.accent, 10);
    for (const sz of [-0.4, 0.4]) strut(cart, [sx * 1.18, 0.95, sz], [sx * 1.18, 1.82, sz], 0.022, p.accent, 10);
  }
  strut(cart, [-0.46, 1.06, -0.58], [0.46, 1.06, -0.58], 0.028, p.dark, 10);
  spokedWheel(cart, 'CartWheelL', [-0.66, 0.36, 0.2], 0.36, 0.08, p, detail, p.accent);
  spokedWheel(cart, 'CartWheelR', [0.66, 0.36, 0.2], 0.36, 0.08, p, detail, p.accent);
  shell(cart, [-0.14, 1.02, 0.02], [0.54, 0.14, 0.44], p.alloy, 0.22);
  tube(cart, [-0.14, 1.28, -0.02], 0.19, 0.2, 0.42, p.accent, 16);
  orb(cart, [-0.14, 1.49, -0.02], 0.19, p.accent, p.hd, [1, 0.72, 1]);
  tube(cart, [-0.14, 1.65, -0.02], 0.045, 0.06, 0.1, p.alloy, 12);
  shell(cart, [-0.14, 1.24, 0.18], [0.16, 0.16, 0.18], p.alloy, 0.25);
  const lever = group(root, 'BrewLever', [-0.14, 1.32, 0.24]);
  strut(lever, [0, 0, 0], [0, 0.3, 0.14], 0.02, p.accent, 10);
  orb(lever, [0, 0.32, 0.16], 0.048, p.dark, p.hd);
  for (const x of [0.28, 0.44]) tube(cart, [x, 1.02, 0.14], 0.052, 0.042, 0.11, p.stencil, 12);
  tube(cart, [0.34, 1.12, -0.14], 0.11, 0.08, 0.24, p.optic, 14);
  for (let i = 0; i < 6; i++) {
    const mat = i % 2 === 0 ? p.primary : p.stencil;
    for (const s of [-1, 1]) box(cart, [-0.55 + i * 0.22, 1.9, s * 0.22], [0.22, 0.055, 0.56], mat).rotation.x = s * 0.24;
  }
  if (detail) {
    cyl(cart, [-0.14, 1.26, 0.16], 0.052, 0.052, 0.03, p.stencil, 'z', 12);
    strut(cart, [0.02, 1.24, 0.12], [0.14, 1.06, 0.2], 0.014, p.alloy, 8);
    for (const x of [-0.42, 0, 0.42]) box(cart, [x, 0.62, 0.43], [0.28, 0.34, 0.028], p.accent);
    if (p.hd) for (const sx of [-0.54, 0.54]) fastener(cart, [sx, 1.84, 0.44], p, 0.025);
  }
  root.animations = [
    new T.AnimationClip('Pull brew lever', 2.4, [rotationTrack('BrewLever', 'x', [0, 0.7, 1.6, 2.4], [0, 0.92, 0.92, 0])]),
    new T.AnimationClip('Roll cart', 3, [spinTrack('CartWheelL', 'x', 3, 2), spinTrack('CartWheelR', 'x', 3, 2)]),
  ];
}

function siegeCatapult(root: T.Group, p: Finish, detail: boolean) {
  const f = group(root, 'CatapultFrame');
  for (const sx of [-0.52, 0.52]) {
    shell(f, [sx, 0.34, 0], [0.18, 0.22, 1.96], p.primary, 0.14);
    for (const z of [-0.22, 0.72]) strut(f, [sx, 0.42, z], [sx, 1.32, 0.32], 0.075, p.primary, 10);
    cyl(f, [sx * 1.18, 0.22, -0.74], 0.22, 0.22, 0.12, p.tire, 'x', 12);
  }
  for (const z of [-0.76, 0.76]) shell(f, [0, 0.34, z], [1.24, 0.18, 0.18], p.primary, 0.16);
  shell(f, [0, 1.3, 0.32], [1.26, 0.18, 0.2], p.primary, 0.18);
  shell(f, [0, 1.28, 0.21], [0.46, 0.16, 0.12], p.accent, 0.3);
  cyl(f, [0, 0.48, 0.32], 0.12, 0.12, 1.1, p.accent, 'x', 14);
  spokedWheel(f, 'WheelL', [-0.72, 0.36, 0.42], 0.36, 0.12, p, detail, p.edge);
  spokedWheel(f, 'WheelR', [0.72, 0.36, 0.42], 0.36, 0.12, p, detail, p.edge);
  const arm = group(root, 'ThrowArm', [0, 0.48, 0.32]);
  strut(arm, [0, 0, 0], [0, 1.12, -0.18], 0.068, p.primary, 10);
  ring(arm, [0, 0.56, -0.09], 0.09, 0.025, 0.1, p.edge);
  shell(arm, [0, 1.16, -0.22], [0.36, 0.18, 0.36], p.dark, 0.34);
  orb(arm, [0, 1.24, -0.22], 0.15, p.alloy, p.hd);
  if (detail) {
    cyl(f, [0, 0.52, -0.76], 0.09, 0.09, 1.18, p.edge, 'x', 12);
    for (const sx of [-0.62, 0.62]) {
      shell(f, [sx, 0.35, -0.14], [0.05, 0.28, 0.42], p.accent, 0.3);
      if (p.hd) fastener(f, [sx * 1.02, 0.35, 0.72], p, 0.032).rotation.z = HPI;
    }
    strut(f, [0, 0.52, -0.76], [0, 1.12, -0.18], 0.018, p.stencil, 6);
  }
  root.animations = [
    new T.AnimationClip('Cock and launch', 2.6, [rotationTrack('ThrowArm', 'x', [0, 0.8, 1.85, 2.2, 2.6], [0, -1.25, -1.25, -0.08, 0])]),
    new T.AnimationClip('Roll siege', 3, [spinTrack('WheelL', 'x', 3, 2), spinTrack('WheelR', 'x', 3, 2)]),
  ];
}

function retroArcadeCabinet(root: T.Group, p: Finish, detail: boolean) {
  const cab = group(root, 'ArcadeCabinet');
  shell(cab, [0, 0.09, 0], [1.0, 0.18, 0.96], p.dark, 0.12);
  shell(cab, [0, 0.58, -0.02], [0.98, 0.84, 0.9], p.primary, 0.1);
  shell(cab, [0, 1.44, -0.1], [0.98, 0.92, 0.74], p.primary, 0.1);
  shell(cab, [0, 1.98, 0.02], [1.0, 0.24, 0.96], p.primary, 0.12);
  box(cab, [0, 1.98, 0.505], [0.88, 0.18, 0.028], p.accent);
  box(cab, [0, 1.98, 0.522], [0.68, 0.09, 0.018], p.stencil);
  const scr = group(cab, '', [0, 1.44, 0.27]);
  scr.rotation.x = -0.22;
  shell(scr, [0, 0, 0], [0.84, 0.68, 0.08], p.inset, 0.2);
  shell(scr, [0, 0, 0.035], [0.7, 0.54, 0.05], p.optic, 0.28);
  const deck = group(cab, '', [0, 1.02, 0.36]);
  deck.rotation.x = 0.18;
  shell(deck, [0, 0, 0], [0.96, 0.1, 0.4], p.dark, 0.18);
  for (const [bx, bz, m] of [[0.06, 0.04, p.accent], [0.16, -0.02, p.stencil], [0.26, 0.04, p.accent], [0.34, -0.04, p.primary]] as const) {
    tube(deck, [bx, 0.06, bz], 0.036, 0.04, 0.038, m, 12);
  }
  const stick = group(root, 'Joystick', [-0.22, 1.07, 0.38]);
  tube(stick, [0, 0.015, 0], 0.068, 0.072, 0.028, p.edge, 12);
  strut(stick, [0, 0.02, 0], [0, 0.16, 0], 0.016, p.alloy, 10);
  orb(stick, [0, 0.19, 0], 0.056, p.accent, p.hd);
  const cd = group(root, 'CoinDoor', [-0.24, 0.5, 0.44]);
  shell(cd, [0.24, 0, 0.02], [0.48, 0.52, 0.05], p.dark, 0.15);
  for (const x of [0.15, 0.33]) {
    box(cd, [x, 0.09, 0.052], [0.09, 0.13, 0.024], p.accent);
    box(cd, [x, -0.1, 0.052], [0.09, 0.09, 0.02], p.edge);
  }
  if (detail) {
    for (const sx of [-0.5, 0.5]) {
      box(cab, [sx, 1.04, 0.44], [0.032, 1.88, 0.035], p.accent);
      box(cab, [sx * 1.01, 1.38, -0.06], [0.018, 0.24, 0.56], p.accent).rotation.x = -0.35;
    }
    for (const x of [-0.28, -0.14, 0, 0.14, 0.28]) box(cab, [x, 1.82, 0.34], [0.08, 0.022, 0.02], p.inset);
    if (p.hd) for (const x of [-0.36, 0.36]) fastener(cab, [x, 1.84, 0.46], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Play joystick', 2, [rotationTrack('Joystick', 'x', [0, 0.4, 1, 1.5, 2], [0, 0.42, -0.42, 0.34, 0])]),
    new T.AnimationClip('Open coin door', 2.8, [rotationTrack('CoinDoor', 'y', [0, 0.75, 2, 2.8], [0, 1.28, 1.28, 0])]),
  ];
}

function apothecaryCabinet(root: T.Group, p: Finish, detail: boolean) {
  const cab = group(root, 'ApothecaryCase');
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.28, 0.28]) shell(cab, [sx, 0.07, sz], [0.16, 0.14, 0.16], p.dark, 0.24);
  shell(cab, [0, 0.28, 0], [1.34, 0.32, 0.74], p.primary, 0.14);
  box(cab, [0, 0.84, -0.18], [1.3, 0.82, 0.38], p.primary);
  for (const sx of [-0.6, 0.6]) box(cab, [sx, 0.84, 0.08], [0.12, 0.82, 0.56], p.primary);
  box(cab, [0, 0.84, 0.08], [1.14, 0.06, 0.56], p.dark);
  shell(cab, [0, 1.25, 0], [1.38, 0.08, 0.78], p.dark, 0.16);
  box(cab, [0, 1.58, -0.26], [1.28, 0.62, 0.16], p.primary);
  for (const sx of [-0.58, 0.58]) box(cab, [sx, 1.58, -0.02], [0.12, 0.62, 0.54], p.primary);
  box(cab, [0, 1.58, -0.04], [1.1, 0.045, 0.44], p.primary);
  shell(cab, [0, 1.92, -0.02], [1.4, 0.12, 0.68], p.dark, 0.22);
  for (const [name, y] of [['TopDrawer', 1.04], ['MidDrawer', 0.64]] as const) {
    const dr = group(root, name, [0, y, 0.14]);
    shell(dr, [0, 0, 0.2], [1.06, 0.28, 0.06], p.primary, 0.18);
    box(dr, [0, -0.1, -0.04], [1.0, 0.04, 0.44], p.dark);
    for (const sx of [-0.48, 0.48]) box(dr, [sx, 0, -0.04], [0.045, 0.22, 0.44], p.primary);
    box(dr, [0, 0, -0.24], [1.0, 0.22, 0.045], p.primary);
    for (const sx of [-0.26, 0.26]) {
      box(dr, [sx, 0.02, 0.24], [0.16, 0.075, 0.025], p.stencil);
      torus(dr, [sx, -0.04, 0.25], 0.045, 0.015, p.accent, p.hd).scale.set(1.4, 0.8, 1);
    }
  }
  const jars = group(root, 'PotionJars', [0, 1.29, 0.02]);
  const specs: readonly [number, number, number, number, number, T.Material][] = [
    [-0.38, 0, 0.04, 0.08, 0.2, p.accent], [-0.14, 0, -0.04, 0.095, 0.16, p.optic], [0.14, 0, 0.06, 0.075, 0.22, p.accent],
    [0.38, 0, -0.02, 0.085, 0.18, p.optic], [-0.26, 0.31, -0.06, 0.07, 0.17, p.accent], [0.02, 0.31, -0.04, 0.08, 0.19, p.optic],
    [0.3, 0.31, -0.06, 0.075, 0.15, p.accent],
  ];
  for (const [jx, jy, jz, r, h, mat] of specs) {
    tube(jars, [jx, jy + h * 0.5, jz], r * 0.78, r, h, mat, 12);
    tube(jars, [jx, jy + h + 0.03, jz], r * 0.38, r * 0.46, 0.065, p.dark, 10);
  }
  if (detail) {
    for (const sx of [-0.36, 0, 0.36]) box(cab, [sx, 0.28, 0.385], [0.24, 0.14, 0.028], p.accent);
    for (const sx of [-0.28, 0.28]) orb(jars, [sx, 0.12, 0.18], 0.062, p.stencil, p.hd);
    if (p.hd) for (const sx of [-0.58, 0.58]) fastener(cab, [sx, 1.92, 0.32], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Open drawers', 3, [
    slideTrack('TopDrawer', [0, 1.04, 0.14], 2, [0, 0.85, 2.1, 3], [0, 0.3, 0.3, 0]),
    slideTrack('MidDrawer', [0, 0.64, 0.14], 2, [0, 1.1, 2.2, 3], [0, 0.22, 0.22, 0]),
  ])];
}

function lanternSignpost(root: T.Group, p: Finish, detail: boolean) {
  const post = group(root, 'SignpostBase');
  shell(post, [0, 0.08, 0], [0.84, 0.16, 0.84], p.edge, 0.26);
  tube(post, [0, 0.34, 0], 0.14, 0.22, 0.38, p.dark, 12);
  tube(post, [0, 1.48, 0], 0.072, 0.11, 2.04, p.primary, 12);
  ring(post, [0, 0.56, 0], 0.17, 0.038, 0.075, p.accent);
  ring(post, [0, 2.38, 0], 0.11, 0.032, 0.065, p.accent);
  orb(post, [0, 2.6, 0], 0.1, p.primary, p.hd);
  tube(post, [0, 2.72, 0], 0.015, 0.048, 0.16, p.accent, 10);
  strut(post, [-0.62, 2.28, 0], [0.64, 2.28, 0], 0.036, p.dark, 10);
  for (const s of [-1, 1]) strut(post, [0, 1.92, 0], [s * 0.43, 2.28, 0], 0.026, p.primary, 10);
  const lan = group(root, 'HangingLantern', [0.54, 2.24, 0]);
  strut(lan, [0, 0, 0], [0, -0.14, 0], 0.016, p.alloy, 8);
  tube(lan, [0, -0.22, 0], 0.04, 0.2, 0.16, p.primary, 12);
  tube(lan, [0, -0.44, 0], 0.13, 0.1, 0.28, p.accent, 12);
  orb(lan, [0, -0.44, 0], 0.072, p.optic, p.hd);
  tube(lan, [0, -0.62, 0], 0.14, 0.04, 0.1, p.dark, 12);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4;
    strut(lan, [Math.sin(a) * 0.16, -0.28, Math.cos(a) * 0.16], [Math.sin(a) * 0.12, -0.58, Math.cos(a) * 0.12], 0.016, p.dark, 8);
  }
  const sign = group(root, 'SignBoard', [-0.46, 1.96, 0]);
  for (const sx of [-0.22, 0.22]) strut(sign, [sx, 0.3, 0], [sx, 0.16, 0], 0.016, p.alloy, 8);
  shell(sign, [0, 0, 0], [0.68, 0.4, 0.085], p.primary, 0.18);
  box(sign, [0, 0, 0], [0.6, 0.32, 0.1], p.accent);
  box(sign, [0, 0, 0], [0.46, 0.2, 0.112], p.stencil);
  if (detail) {
    for (const sx of [-0.3, 0.3]) for (const sz of [-0.3, 0.3]) fastener(post, [sx, 0.17, sz], p, 0.03);
    for (const sx of [-0.22, 0.22]) torus(post, [sx, 2.12, 0], 0.09, 0.018, p.dark, p.hd);
    if (p.hd) orb(lan, [0, -0.7, 0], 0.036, p.accent, p.hd);
  }
  root.animations = [new T.AnimationClip('Sway lantern', 2.8, [rotationTrack('HangingLantern', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.36, 0, -0.36, 0])])];
}

function railwayBoomGate(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'GatePedestal');
  shell(base, [-1.1, 0.12, 0], [0.96, 0.24, 0.84], p.alloy, 0.18);
  shell(base, [-1.1, 0.66, 0], [0.64, 0.88, 0.62], p.dark, 0.16);
  box(base, [-1.1, 0.66, 0.32], [0.48, 0.68, 0.035], p.primary);
  tube(base, [-1.1, 1.62, -0.06], 0.075, 0.085, 1.16, p.alloy, 12);
  for (const ang of [0.68, -0.68]) box(base, [-1.1, 2.04, 0.04], [0.94, 0.15, 0.045], p.stencil).rotation.z = ang;
  const lamp = group(root, 'WarningLamp', [-1.1, 1.66, 0.08]);
  strut(lamp, [-0.34, 0, 0], [0.34, 0, 0], 0.028, p.dark, 10);
  for (const sx of [-0.3, 0.3]) {
    cyl(lamp, [sx, 0, 0.04], 0.12, 0.12, 0.1, p.dark, 'z', 14);
    cyl(lamp, [sx, 0, 0.095], 0.088, 0.088, 0.03, p.primary, 'z', 14);
    orb(lamp, [sx, 0, 0.1], 0.045, p.accent, p.hd);
  }
  const boom = group(root, 'BoomArm', [-1.1, 1.02, 0.14]);
  cyl(boom, [0, 0, -0.04], 0.12, 0.12, 0.2, p.edge, 'z', 12);
  strut(boom, [0, 0, 0], [-0.56, 0, 0], 0.045, p.edge, 10);
  cyl(boom, [-0.52, 0, 0], 0.18, 0.18, 0.16, p.dark, 'z', 14);
  for (let i = 0; i < 8; i++) shell(boom, [0.22 + i * 0.3, 0, 0], [0.31, 0.12, 0.075], i % 2 === 0 ? p.primary : p.accent, 0.12);
  for (const x of [0.55, 1.15, 1.75, 2.25]) strut(boom, [x, -0.06, 0], [x, -0.44, 0], 0.016, p.alloy, 8);
  strut(boom, [0.55, -0.44, 0], [2.25, -0.44, 0], 0.018, p.primary, 8);
  if (detail) {
    orb(base, [-1.1, 2.26, -0.06], 0.11, p.accent, p.hd, [1, 0.6, 1]);
    for (const sx of [-1.42, -0.78]) for (const sz of [-0.28, 0.28]) fastener(base, [sx, 0.25, sz], p, 0.03);
    if (p.hd) for (const x of [0.85, 1.45, 2.05]) orb(boom, [x, 0.09, 0], 0.034, p.optic, p.hd);
  }
  root.animations = [new T.AnimationClip('Raise barrier', 3.2, [rotationTrack('BoomArm', 'z', [0, 0.9, 2.2, 3.2], [0, 1.38, 1.38, 0])])];
}

const rig = (name: string, label: string, axis: Axis, range: [number, number], describe: string, type: 'rotate' | 'slide' = 'rotate'): RiggedPartSpec =>
  ({ name, label, type, axis, range, describe });
const det = (name: string, label: string, describe: string): DetachablePartSpec => ({ name, label, describe });
const propDef = (
  id: string, code: string, name: string, primary: string, accent: string, description: string,
  physicsBody: 'static' | 'dynamic', riggedParts: readonly RiggedPartSpec[], detachableParts: readonly DetachablePartSpec[],
  build: PropAssetDef['build'],
): PropAssetDef => ({
  id, code, category: 'Object', browseCategory: 'prop', name, primary, accent, description, physicsBody, riggedParts, detachableParts, build,
});

export const propsPack: readonly PropAssetDef[] = [
  propDef('treasure-chest', 'PR-01', 'Treasure Chest', '#8f5230', '#dfb147', 'Iron-bound timber treasure chest with a vaulted hinged lid and removable gold tray.', 'dynamic',
    [rig('ChestLid', 'Chest lid', 'x', [0, -95], 'Swings the vaulted lid open')], [det('GoldTray', 'Gold tray', 'Removable interior coin and gem tray')], treasureChest),
  propDef('grandfather-clock', 'PR-02', 'Grandfather Clock', '#73422b', '#d9b25f', 'Tall mahogany longcase clock with a swinging brass pendulum and opening glass cabinet door.', 'static',
    [rig('ClockPendulum', 'Clock pendulum', 'z', [-20, 20], 'Swings the brass pendulum bob'), rig('GlassDoor', 'Glass door', 'y', [0, 85], 'Opens the front glass pendulum door')], [], grandfatherClock),
  propDef('street-vending-unit', 'PR-03', 'Street Vending Unit', '#c9493b', '#f0dfba', 'Retro corner beverage vending machine with a hinged dispenser flap and removable stocked cans.', 'static',
    [rig('PickupFlap', 'Pickup flap', 'x', [0, -55], 'Pushes the dispenser flap inward')], [det('CanDisplay', 'Can display', 'Rows of chilled beverage cans inside the window')], streetVendingUnit),
  propDef('blacksmith-forge', 'PR-04', 'Blacksmith Forge', '#6d6661', '#e06c28', 'Stone hearth forge with hooded chimney, pumping bellows, and removable stump-mounted anvil.', 'static',
    [rig('BellowsTop', 'Bellows top', 'x', [0, 28], 'Pumps the upper bellows paddle')], [det('AnvilBlock', 'Anvil block', 'Side timber stump and horned iron anvil')], blacksmithForge),
  propDef('espresso-bar-cart', 'PR-05', 'Espresso Bar Cart', '#2f6d62', '#d89b48', 'Canopied street espresso cart with rolling spoked wheels and a brass lever brew head.', 'dynamic',
    [rig('BrewLever', 'Brew lever', 'x', [0, 55], 'Pulls the manual espresso brew lever'), rig('CartWheelL', 'Left cart wheel', 'x', [0, 360], 'Rolls the left spoked cart wheel'), rig('CartWheelR', 'Right cart wheel', 'x', [0, 360], 'Rolls the right spoked cart wheel')], [], espressoBarCart),
  propDef('siege-catapult', 'PR-06', 'Siege Catapult', '#7c5536', '#c84b31', 'Timber torsion catapult on heavy spoked wheels with a cocking throw arm and stone payload.', 'dynamic',
    [rig('ThrowArm', 'Throw arm', 'x', [0, -75], 'Cocks and releases the throwing arm'), rig('WheelL', 'Left wheel', 'x', [0, 360], 'Rolls the left siege wheel'), rig('WheelR', 'Right wheel', 'x', [0, 360], 'Rolls the right siege wheel')], [], siegeCatapult),
  propDef('retro-arcade-cabinet', 'PR-07', 'Retro Arcade Cabinet', '#3c4c9e', '#f0b429', 'Classic upright CRT arcade machine with a tilting ball-top joystick and hinged coin service door.', 'static',
    [rig('Joystick', 'Joystick', 'x', [-25, 25], 'Tilts the player control joystick'), rig('CoinDoor', 'Coin door', 'y', [0, 85], 'Opens the front coin-box service door')], [], retroArcadeCabinet),
  propDef('apothecary-cabinet', 'PR-08', 'Apothecary Cabinet', '#6b4731', '#4aa39a', 'Walnut herbalist chest with two sliding drawers and a removable collection of glass potion jars.', 'static',
    [rig('TopDrawer', 'Top drawer', 'z', [0, 0.32], 'Slides the upper herb drawer outward', 'slide'), rig('MidDrawer', 'Mid drawer', 'z', [0, 0.32], 'Slides the middle herb drawer outward', 'slide')], [det('PotionJars', 'Potion jars', 'Assorted glass vials and flasks on the hutch')], apothecaryCabinet),
  propDef('lantern-signpost', 'PR-09', 'Lantern Signpost', '#3d4c49', '#f0b84c', 'Wrought-iron street signpost with a swaying amber lantern and detachable hanging tavern sign.', 'static',
    [rig('HangingLantern', 'Hanging lantern', 'z', [-24, 24], 'Swings the suspended street lantern')], [det('SignBoard', 'Sign board', 'Removable hanging tavern signboard')], lanternSignpost),
  propDef('railway-boom-gate', 'PR-10', 'Railway Boom Gate', '#d43f35', '#f2e8cf', 'Counterweighted railway crossing barrier with a lifting striped boom arm and detachable flasher lamps.', 'static',
    [rig('BoomArm', 'Boom arm', 'z', [0, 82], 'Raises and lowers the striped crossing arm')], [det('WarningLamp', 'Warning lamp', 'Twin hooded red crossing signal lights')], railwayBoomGate),
];
