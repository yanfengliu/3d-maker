import * as T from 'three';
import { box, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../parts';
import type { Finish, Point } from '../parts';
import { fastener } from '../hd-detail';
import type { DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';

export interface TownBuildingDef {
  id: string; code: string; category: 'Object'; browseCategory: BrowseCategory;
  name: string; primary: string; accent: string; description: string; physicsBody: 'static';
  riggedParts: readonly RiggedPartSpec[]; detachableParts: readonly DetachablePartSpec[];
  build: (root: T.Group, p: Finish, detail: boolean) => void;
}

const rot = (name: string, label: string, axis: 'x' | 'y' | 'z', range: [number, number], describe: string): RiggedPartSpec =>
  ({ name, label, type: 'rotate', axis, range, describe });
const slide = (name: string, label: string, axis: 'x' | 'y' | 'z', range: [number, number], describe: string): RiggedPartSpec =>
  ({ name, label, type: 'slide', axis, range, describe });
const det = (name: string, label: string, describe: string): DetachablePartSpec => ({ name, label, describe });
const quad = (fn: (sx: number, sz: number) => void) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) fn(sx, sz); };

function swingTrack(node: string, axis: 'x' | 'y' | 'z', duration: number, peakDeg: number, symmetric = false) {
  const peak = (peakDeg * Math.PI) / 180;
  return symmetric
    ? rotationTrack(node, axis, [0, duration * 0.25, duration * 0.75, duration], [0, peak, -peak, 0])
    : rotationTrack(node, axis, [0, duration * 0.38, duration * 0.62, duration], [0, peak, peak, 0]);
}

function slideTrack(node: string, axis: 'x' | 'y' | 'z', rest: Point, duration: number, delta: number) {
  const moved: Point = [...rest];
  moved[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] += delta;
  return new T.VectorKeyframeTrack(node + '.position', [0, duration * 0.38, duration * 0.62, duration], [...rest, ...moved, ...moved, ...rest]);
}

function gablePrism(parent: T.Object3D, at: Point, w: number, h: number, d: number, mat: T.Material, hd: boolean) {
  const shape = new T.Shape();
  shape.moveTo(-w / 2, 0).lineTo(w / 2, 0).lineTo(0, h).closePath();
  const geo = new T.ExtrudeGeometry(shape, { depth: d, bevelEnabled: hd, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 3 });
  geo.translate(0, 0, -d / 2);
  return mesh(parent, geo, mat, at);
}

function pitchedRoof(parent: T.Object3D, y: number, z: number, w: number, h: number, d: number, wallMat: T.Material, roofMat: T.Material, p: Finish, detail: boolean) {
  gablePrism(parent, [0, y, z], w * 0.94, h, d * 0.9, wallMat, p.hd);
  const run = w * 0.54;
  const slopeLen = Math.hypot(run, h) + 0.1;
  const angle = Math.atan2(h, run);
  for (const s of [-1, 1]) {
    box(parent, [s * run * 0.5, y + h * 0.5 + 0.02, z], [slopeLen, 0.075, d], roofMat).rotation.z = -s * angle;
    if (p.hd && detail) box(parent, [s * run * 0.5, y + h * 0.5 - 0.01, z + d * 0.51], [slopeLen, 0.055, 0.05], p.stencil).rotation.z = -s * angle;
  }
  box(parent, [0, y + h + 0.04, z], [0.11, 0.07, d + 0.04], p.edge);
}

function windowBox(parent: T.Object3D, at: Point, w: number, h: number, p: Finish, detail: boolean, shutters = false) {
  const [x, y, z] = at;
  box(parent, [x, y, z], [w + 0.07, h + 0.07, 0.055], p.stencil);
  box(parent, [x, y, z + 0.016], [w, h, 0.04], p.optic);
  box(parent, [x, y - h / 2 - 0.035, z + 0.03], [w + 0.12, 0.05, 0.08], p.edge);
  if (detail) {
    box(parent, [x, y, z + 0.038], [0.022, h, 0.02], p.stencil);
    box(parent, [x, y, z + 0.038], [w, 0.022, 0.02], p.stencil);
  }
  if (shutters) for (const s of [-1, 1]) box(parent, [x + s * (w * 0.5 + 0.1), y, z + 0.02], [0.13, h + 0.04, 0.045], p.accent);
}

function hingedDoor(parent: T.Object3D, name: string, center: Point, w: number, h: number, leafMat: T.Material, frameMat: T.Material, p: Finish) {
  const [x, y, z] = center;
  box(parent, [x, y + h / 2, z - 0.025], [w + 0.1, h + 0.08, 0.055], frameMat);
  box(parent, [x, y + h / 2, z - 0.01], [w - 0.02, h - 0.02, 0.045], p.inset);
  const door = group(parent, name, [x + w / 2, y, z + 0.015]);
  box(door, [-w / 2, h / 2, 0], [w, h, 0.055], leafMat);
  tube(door, [-w + 0.07, h * 0.48, 0.04], 0.022, 0.022, 0.045, p.alloy, 10).rotation.x = Math.PI / 2;
  return door;
}

function bakeryShopfront(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Bakery');
  shell(b, [0, 0.06, 0], [2.28, 0.12, 1.66], p.dark, 0.12);
  shell(b, [0, 0.62, -0.04], [2.1, 1.0, 1.44], p.primary, 0.08);
  shell(b, [0, 1.15, -0.02], [2.2, 0.09, 1.54], p.stencil, 0.1);
  shell(b, [0, 1.57, -0.04], [2.04, 0.76, 1.4], p.primary, 0.08);
  pitchedRoof(b, 1.95, -0.04, 2.26, 0.58, 1.64, p.primary, p.dark, p, detail);
  shell(b, [0.72, 2.28, -0.34], [0.28, 0.68, 0.28], p.edge, 0.14);
  tube(b, [0.72, 2.68, -0.34], 0.075, 0.09, 0.18, p.accent, 12);
  box(b, [-0.36, 0.62, 0.67], [1.06, 0.76, 0.07], p.dark);
  box(b, [-0.36, 0.62, 0.695], [0.96, 0.66, 0.045], p.optic);
  box(b, [-0.36, 0.25, 0.72], [1.1, 0.06, 0.12], p.stencil);
  const door = hingedDoor(b, 'FrontDoor', [0.58, 0.12, 0.69], 0.46, 0.88, p.accent, p.dark, p);
  box(door, [-0.23, 0.6, 0.02], [0.3, 0.34, 0.035], p.optic);
  const awning = group(b, 'Awning', [-0.36, 1.07, 0.7]);
  const canopy = group(awning, '', [0, 0, 0]);
  canopy.rotation.x = 0.38;
  for (let i = 0; i < 6; i++) box(canopy, [-0.475 + i * 0.19, 0, 0.24], [0.19, 0.055, 0.54], i % 2 === 0 ? p.accent : p.stencil);
  box(awning, [0, -0.14, 0.48], [1.14, 0.11, 0.045], p.accent);
  const planter = group(b, 'Planter', [-0.36, 0.2, 0.82]);
  shell(planter, [0, 0.06, 0], [0.96, 0.16, 0.22], p.dark, 0.15);
  box(planter, [0, 0.14, 0], [0.88, 0.05, 0.16], p.tire);
  for (const x of [-0.3, -0.1, 0.1, 0.3]) {
    tube(planter, [x, 0.22, 0], 0.075, 0.055, 0.11, p.primary, 10);
    if (detail) tube(planter, [x, 0.29, 0.01], 0.045, 0.045, 0.04, p.accent, 10);
  }
  for (const x of [-0.52, 0.44]) windowBox(b, [x, 1.56, 0.67], 0.34, 0.4, p, detail, true);
  if (detail) {
    box(b, [0, 1.19, 0.77], [1.26, 0.14, 0.05], p.dark);
    box(b, [0, 1.19, 0.8], [1.14, 0.08, 0.02], p.stencil);
    for (const x of [-0.66, -0.36, -0.06]) box(b, [x, 0.62, 0.725], [0.024, 0.66, 0.02], p.stencil);
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) {
      strut(awning, [s * 0.52, -0.04, 0.02], [s * 0.52, -0.16, 0.44], 0.016, p.alloy, 10);
      fastener(b, [s * 0.96, 1.15, 0.77], p, 0.024).rotation.x = Math.PI / 2;
    }
    ring(b, [0.58, 1.19, 0.82], 0.085, 0.022, 0.025, p.accent).rotation.x = Math.PI / 2;
  }
  root.animations = [new T.AnimationClip('Open shop door', 3.2, [swingTrack('FrontDoor', 'y', 3.2, 80)])];
}

function stoneLighthouse(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Lighthouse');
  tube(b, [0, 0.12, 0], 0.88, 0.96, 0.24, p.tire, 14);
  tube(b, [0, 0.32, 0], 0.72, 0.8, 0.16, p.dark, 14);
  const bands = [[0.64, 0.57, 0.63, p.primary], [1.12, 0.52, 0.57, p.accent], [1.6, 0.47, 0.52, p.primary], [2.08, 0.42, 0.47, p.accent], [2.56, 0.38, 0.42, p.primary]] as const;
  for (const [y, top, bot, mat] of bands) tube(b, [0, y, 0], top, bot, 0.48, mat, 16);
  shell(b, [0, 0.62, 0.62], [0.68, 0.76, 0.46], p.primary, 0.14);
  pitchedRoof(b, 1.0, 0.62, 0.76, 0.22, 0.54, p.primary, p.dark, p, detail);
  hingedDoor(b, 'EntryDoor', [0, 0.24, 0.85], 0.4, 0.68, p.accent, p.edge, p);
  tube(b, [0, 2.86, 0], 0.56, 0.42, 0.14, p.dark, 16);
  ring(b, [0, 3.08, 0], 0.54, 0.03, 0.045, p.alloy);
  tube(b, [0, 3.01, 0], 0.36, 0.37, 0.18, p.dark, 16);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.26;
    strut(b, [Math.sin(a) * 0.34, 3.08, Math.cos(a) * 0.34], [Math.sin(a) * 0.34, 3.52, Math.cos(a) * 0.34], 0.022, p.edge, 10);
    if (detail) strut(b, [Math.sin(a) * 0.52, 2.92, Math.cos(a) * 0.52], [Math.sin(a) * 0.52, 3.1, Math.cos(a) * 0.52], 0.018, p.alloy, 10);
  }
  const beacon = group(b, 'BeaconLens', [0, 3.29, 0]);
  tube(beacon, [0, 0, 0], 0.12, 0.14, 0.26, p.alloy, 12);
  for (const s of [-1, 1]) {
    tube(beacon, [0, 0, s * 0.16], 0.12, 0.14, 0.09, p.optic, 14).rotation.x = Math.PI / 2;
    tube(beacon, [0, 0, s * 0.215], 0.085, 0.095, 0.03, p.stencil, 14).rotation.x = Math.PI / 2;
  }
  ring(beacon, [0, 0.11, 0], 0.21, 0.022, 0.03, p.accent);
  tube(b, [0, 3.54, 0], 0.42, 0.38, 0.07, p.dark, 16);
  tube(b, [0, 3.72, 0], 0.05, 0.4, 0.32, p.accent, 16);
  tube(b, [0, 3.94, 0], 0.02, 0.03, 0.16, p.alloy, 10);
  if (detail) {
    for (const [y, z] of [[1.46, 0.49], [2.14, 0.44]] as const) {
      ring(b, [0, y, z], 0.11, 0.024, 0.05, p.dark).rotation.x = Math.PI / 2;
      tube(b, [0, y, z], 0.085, 0.085, 0.03, p.optic, 12).rotation.x = Math.PI / 2;
    }
  }
  if (detail && p.hd) {
    ring(b, [0, 2.78, 0], 0.45, 0.03, 0.04, p.stencil);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      strut(b, [Math.sin(a) * 0.38, 2.74, Math.cos(a) * 0.38], [Math.sin(a) * 0.54, 2.86, Math.cos(a) * 0.54], 0.022, p.edge, 10);
    }
  }
  root.animations = [
    new T.AnimationClip('Beacon sweep', 4, [spinTrack('BeaconLens', 'y', 4, 1)]),
    new T.AnimationClip('Open entry door', 3, [swingTrack('EntryDoor', 'y', 3, 75)]),
  ];
}

function timberWindmill(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Windmill');
  shell(b, [0, 0.44, 0], [1.48, 0.88, 1.48], p.dark, 0.3);
  shell(b, [0, 0.91, 0], [1.56, 0.08, 1.56], p.edge, 0.3);
  shell(b, [0, 1.32, 0], [1.26, 0.74, 1.26], p.primary, 0.3);
  shell(b, [0, 1.98, 0], [1.06, 0.62, 1.06], p.primary, 0.3);
  shell(b, [0, 2.46, 0], [0.92, 0.38, 0.92], p.primary, 0.3);
  ring(b, [0, 1.22, 0], 0.9, 0.24, 0.06, p.dark);
  shell(b, [0, 2.78, -0.04], [1.06, 0.32, 1.22], p.accent, 0.42);
  shell(b, [0, 3.01, -0.08], [0.82, 0.22, 0.98], p.accent, 0.46);
  strut(b, [0, 2.74, -0.58], [0, 0.96, -1.16], 0.042, p.dark, 10);
  for (const s of [-1, 1]) strut(b, [s * 0.32, 2.68, -0.52], [0, 1.38, -1.0], 0.026, p.dark, 10);
  hingedDoor(b, 'MillDoor', [0, 0.06, 0.75], 0.44, 0.78, p.accent, p.edge, p);
  tube(b, [0, 2.58, 0.62], 0.1, 0.12, 0.32, p.dark, 12).rotation.x = Math.PI / 2;
  const rotor = group(b, 'SailRotor', [0, 2.58, 0.78]);
  tube(rotor, [0, 0, 0.04], 0.12, 0.15, 0.16, p.alloy, 12).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const arm = group(rotor, '', [0, 0, 0]);
    arm.rotation.z = (i * Math.PI) / 2 + 0.32;
    box(arm, [0, 0.62, 0], [0.065, 1.24, 0.065], p.dark);
    box(arm, [0.14, 0.72, -0.02], [0.24, 0.94, 0.045], p.stencil).rotation.y = 0.2;
    box(arm, [0.25, 0.72, -0.04], [0.05, 0.96, 0.05], p.accent).rotation.y = 0.2;
    if (detail) for (const y of [0.38, 0.62, 0.86, 1.1]) box(arm, [0.13, y, 0.015], [0.26, 0.026, 0.026], p.dark);
  }
  windowBox(b, [0, 1.98, 0.53], 0.26, 0.32, p, detail);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      strut(b, [Math.sin(a) * 0.86, 1.24, Math.cos(a) * 0.86], [Math.sin(a) * 0.86, 1.48, Math.cos(a) * 0.86], 0.018, p.dark, 8);
    }
    ring(b, [0, 1.48, 0], 0.88, 0.025, 0.03, p.dark);
  }
  if (detail && p.hd) {
    quad((s, f) => strut(b, [s * 0.62, 0.92, f * 0.62], [s * 0.44, 2.6, f * 0.44], 0.028, p.dark, 10));
    fastener(rotor, [0, 0, 0.13], p, 0.05).rotation.x = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Turn sails', 4.5, [spinTrack('SailRotor', 'z', 4.5, 1)]),
    new T.AnimationClip('Open mill door', 3, [swingTrack('MillDoor', 'y', 3, 75)]),
  ];
}

function townClockTower(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'ClockTower');
  shell(b, [0, 0.1, 0], [1.66, 0.2, 1.66], p.dark, 0.16);
  quad((sx, sz) => box(b, [sx * 0.54, 0.84, sz * 0.54], [0.28, 1.28, 0.28], p.primary));
  shell(b, [0, 1.54, 0], [1.46, 0.16, 1.46], p.stencil, 0.14);
  const pend = group(b, 'Pendulum', [0, 1.44, 0]);
  strut(pend, [0, 0, 0], [0, -0.94, 0], 0.024, p.alloy, 10);
  tube(pend, [0, -0.96, 0], 0.18, 0.18, 0.06, p.accent, 14).rotation.x = Math.PI / 2;
  ring(pend, [0, -0.96, 0], 0.19, 0.025, 0.07, p.alloy).rotation.x = Math.PI / 2;
  shell(b, [0, 2.02, 0], [1.24, 0.84, 1.24], p.primary, 0.12);
  shell(b, [0, 2.46, 0], [1.38, 0.09, 1.38], p.stencil, 0.12);
  shell(b, [0, 2.86, 0], [1.3, 0.74, 1.3], p.primary, 0.12);
  for (let i = 0; i < 4; i++) {
    const face = group(b, '', [0, 2.86, 0]);
    face.rotation.y = (i * Math.PI) / 2;
    ring(face, [0, 0, 0.66], 0.33, 0.045, 0.06, p.dark).rotation.x = Math.PI / 2;
    tube(face, [0, 0, 0.65], 0.29, 0.29, 0.04, p.stencil, 16).rotation.x = Math.PI / 2;
    if (i > 0) box(face, [0, 0.09, 0.68], [0.032, 0.2, 0.02], p.dark);
    if (detail) for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6;
      box(face, [Math.sin(a) * 0.23, Math.cos(a) * 0.23, 0.675], [0.02, 0.04, 0.015], p.dark).rotation.z = -a;
    }
  }
  const hand = group(b, 'ClockHand', [0, 2.86, 0.68]);
  tube(hand, [0, 0, 0.015], 0.04, 0.04, 0.04, p.alloy, 10).rotation.x = Math.PI / 2;
  box(hand, [0, 0.11, 0.015], [0.036, 0.24, 0.022], p.dark);
  box(hand, [0.08, 0, 0.01], [0.16, 0.042, 0.02], p.accent);
  shell(b, [0, 3.27, 0], [1.44, 0.1, 1.44], p.dark, 0.14);
  tube(b, [0, 3.74, 0], 0.04, 0.78, 0.86, p.accent, 4).rotation.y = Math.PI / 4;
  tube(b, [0, 4.2, 0], 0.03, 0.06, 0.16, p.alloy, 12);
  windowBox(b, [0, 2.02, 0.62], 0.28, 0.44, p, detail);
  if (detail && p.hd) {
    quad((sx, sz) => {
      tube(b, [sx * 0.68, 0.25, sz * 0.68], 0.055, 0.065, 0.22, p.edge, 10);
      fastener(b, [sx * 0.54, 1.54, sz * 0.73], p, 0.03).rotation.x = Math.PI / 2;
    });
    ring(b, [0, 3.34, 0], 0.52, 0.035, 0.05, p.alloy);
  }
  root.animations = [
    new T.AnimationClip('Tick and chime', 4, [swingTrack('Pendulum', 'z', 4, 24, true), spinTrack('ClockHand', 'z', 4, -1)]),
    new T.AnimationClip('Wind clock', 3, [spinTrack('ClockHand', 'z', 3, -1)]),
  ];
}

function toriiShrine(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'ToriiShrine');
  shell(b, [0, 0.06, 0], [2.72, 0.12, 1.24], p.dark, 0.14);
  box(b, [0, 0.14, 0.18], [1.34, 0.06, 0.68], p.edge);
  for (const s of [-1, 1]) {
    tube(b, [s * 0.78, 0.26, 0], 0.15, 0.18, 0.28, p.tire, 12);
    tube(b, [s * 0.75, 1.32, 0], 0.105, 0.122, 1.88, p.primary, 14).rotation.z = s * 0.035;
    box(b, [s * 1.06, 1.82, 0], [0.1, 0.16, 0.15], p.accent);
  }
  box(b, [0, 1.82, 0], [2.22, 0.13, 0.12], p.primary);
  box(b, [0, 2.04, 0], [0.26, 0.34, 0.1], p.accent);
  box(b, [0, 2.04, 0.052], [0.16, 0.24, 0.02], p.stencil);
  shell(b, [0, 2.26, 0], [2.04, 0.15, 0.22], p.primary, 0.12);
  shell(b, [0, 2.38, 0], [2.14, 0.11, 0.28], p.accent, 0.14);
  for (const s of [-1, 1]) {
    const wing = group(b, '', [s * 0.98, 2.31, 0]);
    wing.rotation.z = s * 0.24;
    box(wing, [s * 0.2, -0.04, 0], [0.42, 0.14, 0.21], p.primary);
    box(wing, [s * 0.22, 0.07, 0], [0.48, 0.1, 0.27], p.accent);
  }
  const bell = group(b, 'ShrineBell', [0, 1.75, 0]);
  strut(bell, [0, 0, 0], [0, -0.2, 0], 0.024, p.dark, 10);
  tube(bell, [0, -0.28, 0], 0.11, 0.16, 0.2, p.alloy, 14);
  ring(bell, [0, -0.36, 0], 0.165, 0.028, 0.045, p.accent);
  strut(bell, [0, -0.36, 0], [0, -0.86, 0], 0.026, p.stencil, 10);
  tube(bell, [0, -0.88, 0], 0.055, 0.035, 0.12, p.primary, 10);
  const lanterns = group(b, 'LanternPair', [0, 0, 0]);
  for (const s of [-1, 1]) {
    const l = group(lanterns, '', [s * 1.12, 0.12, 0.34]);
    shell(l, [0, 0.07, 0], [0.32, 0.14, 0.32], p.edge, 0.24);
    tube(l, [0, 0.32, 0], 0.075, 0.09, 0.38, p.stencil, 12);
    shell(l, [0, 0.56, 0], [0.28, 0.08, 0.28], p.edge, 0.2);
    box(l, [0, 0.72, 0], [0.2, 0.24, 0.2], p.optic);
    tube(l, [0, 0.92, 0], 0.04, 0.26, 0.18, p.accent, 4).rotation.y = Math.PI / 4;
    if (detail) {
      quad((cx, cz) => box(l, [cx * 0.1, 0.72, cz * 0.1], [0.028, 0.24, 0.028], p.edge));
      tube(l, [0, 1.03, 0], 0.035, 0.05, 0.06, p.stencil, 10);
    }
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) {
      ring(b, [s * 0.72, 2.16, 0], 0.135, 0.024, 0.05, p.accent);
      ring(b, [s * 0.78, 0.42, 0], 0.16, 0.028, 0.05, p.edge);
    }
    for (let i = -3; i <= 3; i++) box(b, [i * 0.22, 1.72, 0.075], [0.06, 0.12, 0.025], p.stencil);
  }
  root.animations = [new T.AnimationClip('Ring shrine bell', 3.4, [swingTrack('ShrineBell', 'x', 3.4, 26, true)])];
}

function glassGreenhouse(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Greenhouse');
  shell(b, [0, 0.06, 0], [2.28, 0.12, 1.88], p.dark, 0.1);
  box(b, [0, 0.32, -0.84], [2.16, 0.42, 0.12], p.accent);
  box(b, [0, 0.98, -0.84], [2.04, 0.92, 0.06], p.optic);
  for (const s of [-1, 1]) {
    box(b, [s * 1.02, 0.32, 0], [0.12, 0.42, 1.76], p.accent);
    box(b, [s * 0.68, 0.32, 0.84], [0.76, 0.42, 0.12], p.accent);
    box(b, [s * 1.02, 0.98, 0], [0.06, 0.92, 1.66], p.optic);
    box(b, [s * 0.68, 0.98, 0.84], [0.72, 0.92, 0.06], p.optic);
    box(b, [s * 1.02, 1.46, 0], [0.12, 0.08, 1.82], p.primary);
    box(b, [s * 0.68, 0.53, 0.86], [0.8, 0.06, 0.15], p.stencil);
    for (const z of [-0.84, 0, 0.84]) box(b, [s * 1.04, 0.98, z], [0.08, 0.96, 0.08], p.primary);
  }
  const door = hingedDoor(b, 'GlassDoor', [0, 0.12, 0.86], 0.56, 1.28, p.primary, p.primary, p);
  box(door, [-0.28, 0.78, 0.014], [0.42, 0.8, 0.04], p.optic);
  box(door, [-0.28, 0.22, 0.015], [0.44, 0.28, 0.045], p.accent);
  const roofY = 1.48;
  const roofH = 0.68;
  for (const z of [-0.84, 0.84]) gablePrism(b, [0, roofY, z], 2.08, roofH, 0.08, p.optic, p.hd);
  const slopeLen = Math.hypot(1.08, roofH) + 0.06;
  const angle = Math.atan2(roofH, 1.08);
  for (const s of [-1, 1]) {
    box(b, [s * 0.54, roofY + roofH * 0.5, 0], [slopeLen, 0.055, 1.76], p.optic).rotation.z = -s * angle;
    for (const z of [-0.84, -0.28, 0.28, 0.84]) box(b, [s * 0.54, roofY + roofH * 0.5 + 0.02, z], [slopeLen + 0.04, 0.06, 0.06], p.primary).rotation.z = -s * angle;
  }
  box(b, [0, roofY + roofH + 0.04, 0], [0.1, 0.09, 1.84], p.primary);
  box(b, [0, roofY + roofH + 0.01, 0.04], [0.62, 0.08, 0.44], p.inset);
  const vent = group(b, 'RoofVent', [0, roofY + roofH - 0.01, 0.28]);
  box(vent, [0, 0.08, -0.24], [0.68, 0.06, 0.48], p.primary);
  box(vent, [0, 0.09, -0.24], [0.56, 0.05, 0.36], p.optic);
  if (detail) {
    for (const z of [-0.66, -0.22, 0.22, 0.66]) tube(b, [0, roofY + roofH + 0.13, z], 0.02, 0.03, 0.11, p.primary, 10);
    for (const s of [-1, 1]) for (const z of [-0.42, 0.42]) box(b, [s * 1.04, 0.98, z], [0.05, 0.92, 0.03], p.primary);
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) {
      ring(b, [s * 0.66, 0.98, 0.88], 0.14, 0.022, 0.03, p.primary).rotation.x = Math.PI / 2;
      fastener(b, [s * 1.04, 1.46, 0.84], p, 0.03).rotation.x = Math.PI / 2;
    }
    strut(vent, [0, 0.04, -0.44], [0, -0.1, -0.44], 0.014, p.alloy, 10);
  }
  root.animations = [
    new T.AnimationClip('Ventilate glasshouse', 3.4, [swingTrack('RoofVent', 'x', 3.4, 38), swingTrack('GlassDoor', 'y', 3.4, 65)]),
    new T.AnimationClip('Open glass door', 3, [swingTrack('GlassDoor', 'y', 3, 80)]),
  ];
}

function countryTrainDepot(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'TrainDepot');
  shell(b, [0, 0.11, 0], [2.94, 0.22, 1.86], p.dark, 0.08);
  box(b, [0, 0.225, 0.86], [2.9, 0.045, 0.12], p.accent);
  shell(b, [-0.1, 0.84, -0.2], [2.04, 1.24, 1.12], p.primary, 0.08);
  box(b, [-0.1, 0.56, -0.2], [2.1, 0.07, 1.18], p.accent);
  pitchedRoof(b, 1.46, -0.14, 2.46, 0.68, 1.66, p.primary, p.dark, p, detail);
  shell(b, [0.58, 1.98, -0.44], [0.28, 0.56, 0.28], p.edge, 0.12);
  shell(b, [0.46, 0.78, 0.44], [0.72, 0.82, 0.3], p.primary, 0.22);
  windowBox(b, [0.46, 0.88, 0.58], 0.48, 0.38, p, detail);
  box(b, [0.46, 1.24, 0.48], [0.84, 0.07, 0.42], p.dark);
  box(b, [-0.62, 0.68, 0.35], [0.6, 0.92, 0.08], p.inset);
  box(b, [-0.3, 1.21, 0.42], [1.34, 0.06, 0.07], p.edge);
  const fDoorRest: Point = [-0.62, 0.22, 0.4];
  const fDoor = group(b, 'FreightDoor', fDoorRest);
  box(fDoor, [0, 0.47, 0], [0.62, 0.94, 0.055], p.accent);
  box(fDoor, [0, 0.47, 0.025], [0.54, 0.06, 0.03], p.dark);
  for (const s of [-1, 1]) strut(fDoor, [-s * 0.25, 0.08, 0.032], [s * 0.25, 0.86, 0.032], 0.022, p.dark, 8);
  const mastX = 1.24;
  tube(b, [mastX, 1.2, 0.44], 0.048, 0.062, 1.96, p.alloy, 12);
  box(b, [mastX, 0.28, 0.44], [0.22, 0.14, 0.22], p.dark);
  tube(b, [mastX, 2.22, 0.44], 0.055, 0.055, 0.09, p.accent, 10);
  const arm = group(b, 'SignalArm', [mastX, 1.94, 0.49]);
  box(arm, [0.26, 0, 0], [0.56, 0.12, 0.045], p.primary);
  box(arm, [0.42, 0, 0.014], [0.1, 0.11, 0.03], p.stencil);
  tube(arm, [0, 0, 0.03], 0.055, 0.055, 0.05, p.optic, 10).rotation.x = Math.PI / 2;
  if (detail) {
    for (const x of [-1.04, -0.36, 0.32, 0.88]) strut(b, [x, 1.18, 0.38], [x, 1.44, 0.62], 0.026, p.dark, 8);
    for (let y = 0.5; y <= 1.75; y += 0.25) box(b, [mastX, y, 0.38], [0.14, 0.02, 0.02], p.edge);
    box(b, [-0.1, 1.48, 0.68], [0.92, 0.14, 0.05], p.stencil);
  }
  if (detail && p.hd) {
    for (const x of [-0.18, 0.18]) ring(fDoor, [x, 0.99, 0.02], 0.048, 0.018, 0.03, p.alloy).rotation.x = Math.PI / 2;
    box(b, [-1.18, 0.36, 0.56], [0.28, 0.28, 0.28], p.accent);
    box(b, [-1.18, 0.58, 0.54], [0.2, 0.18, 0.2], p.dark);
  }
  root.animations = [
    new T.AnimationClip('Depot arrival', 3.6, [swingTrack('SignalArm', 'z', 3.6, 44), slideTrack('FreightDoor', 'x', fDoorRest, 3.6, 0.55)]),
    new T.AnimationClip('Slide freight door', 3, [slideTrack('FreightDoor', 'x', fDoorRest, 3, 0.55)]),
  ];
}

function fireWatchtower(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'FireWatchtower');
  quad((sx, sz) => {
    shell(b, [sx * 0.68, 0.11, sz * 0.68], [0.28, 0.22, 0.28], p.edge, 0.18);
    strut(b, [sx * 0.68, 0.2, sz * 0.68], [sx * 0.48, 2.12, sz * 0.48], 0.052, p.dark, 10);
  });
  for (const [y0, y1, r0, r1] of [[0.28, 1.18, 0.66, 0.57], [1.18, 2.08, 0.57, 0.48]] as const) {
    quad((s, d) => {
      strut(b, [-d * r0, y0, s * r0], [d * r1, y1, s * r1], 0.026, p.edge, 8);
      strut(b, [s * r0, y0, -d * r0], [s * r1, y1, d * r1], 0.026, p.edge, 8);
    });
    shell(b, [0, y1, 0], [r1 * 2.08, 0.07, r1 * 2.08], p.dark, 0.1);
  }
  for (const dx of [-0.14, 0.14]) strut(b, [0.46 + dx, 0.06, 0.56], [0.54 + dx, 2.1, 0.56], 0.022, p.alloy, 8);
  shell(b, [0, 2.14, 0], [1.84, 0.09, 1.84], p.primary, 0.1);
  for (const s of [-1, 1]) {
    box(b, [0, 2.52, s * 0.88], [1.8, 0.055, 0.055], p.dark);
    box(b, [s * 0.88, 2.52, 0], [0.055, 0.055, 1.8], p.dark);
    for (const k of [-0.86, 0, 0.86]) {
      box(b, [k, 2.34, s * 0.88], [0.055, 0.36, 0.055], p.dark);
      box(b, [s * 0.88, 2.34, k], [0.055, 0.36, 0.055], p.dark);
    }
  }
  box(b, [0.56, 2.16, 0.58], [0.42, 0.06, 0.42], p.inset);
  const hatch = group(b, 'TrapHatch', [0.56, 2.19, 0.37]);
  box(hatch, [0, 0.025, 0.21], [0.42, 0.05, 0.42], p.accent);
  box(hatch, [0, 0.055, 0.35], [0.16, 0.025, 0.035], p.alloy);
  shell(b, [0, 2.42, 0], [1.06, 0.48, 1.06], p.primary, 0.08);
  box(b, [0, 2.9, 0], [1.0, 0.48, 1.0], p.optic);
  quad((sx, sz) => box(b, [sx * 0.51, 2.9, sz * 0.51], [0.075, 0.52, 0.075], p.primary));
  shell(b, [0, 3.19, 0], [1.14, 0.1, 1.14], p.dark, 0.1);
  tube(b, [0, 3.55, 0], 0.05, 1.02, 0.64, p.accent, 4).rotation.y = Math.PI / 4;
  tube(b, [0, 3.92, 0], 0.022, 0.032, 0.18, p.alloy, 10);
  tube(b, [-0.56, 2.42, 0.66], 0.075, 0.11, 0.52, p.edge, 12);
  const scope = group(b, 'SpotterScope', [-0.56, 2.7, 0.66]);
  box(scope, [0, 0.03, 0], [0.14, 0.1, 0.12], p.alloy);
  tube(scope, [0, 0.1, 0.12], 0.062, 0.052, 0.42, p.accent, 14).rotation.x = Math.PI / 2;
  tube(scope, [0, 0.1, 0.34], 0.068, 0.068, 0.04, p.optic, 14).rotation.x = Math.PI / 2;
  tube(scope, [0, 0.1, -0.11], 0.036, 0.045, 0.07, p.dark, 12).rotation.x = Math.PI / 2;
  if (detail) {
    for (let y = 0.3; y <= 1.9; y += 0.26) box(b, [0.5, y, 0.56], [0.28, 0.025, 0.025], p.alloy);
    for (const s of [-1, 1]) { box(b, [0, 2.34, s * 0.88], [1.74, 0.03, 0.03], p.edge); box(b, [s * 0.88, 2.34, 0], [0.03, 0.03, 1.74], p.edge); }
  }
  if (detail && p.hd) {
    quad((sx, sz) => strut(b, [sx * 0.52, 1.86, sz * 0.52], [sx * 0.86, 2.1, sz * 0.86], 0.028, p.dark, 10));
    ring(scope, [0, 0.1, 0.28], 0.072, 0.015, 0.03, p.alloy).rotation.x = Math.PI / 2;
  }
  root.animations = [new T.AnimationClip('Horizon scan', 4, [swingTrack('SpotterScope', 'y', 4, 80, true)]), new T.AnimationClip('Open trap hatch', 3, [swingTrack('TrapHatch', 'x', 3, -80)])];
}

function entry(
  id: string, code: string, name: string, primary: string, accent: string, description: string,
  riggedParts: readonly RiggedPartSpec[], detachableParts: readonly DetachablePartSpec[], build: TownBuildingDef['build'],
): TownBuildingDef {
  return { id, code, category: 'Object', browseCategory: 'building', name, primary, accent, description, physicsBody: 'static', riggedParts, detachableParts, build };
}

export const buildingsTownA: readonly TownBuildingDef[] = [
  entry('bakery-shopfront', 'BT-01', 'Bakery Shopfront', '#d89b6a', '#c84b44', 'Two-story corner bakery with striped awning, display bay, window planter, and hinged shop door.',
    [rot('FrontDoor', 'Front door', 'y', [0, 85], 'Swings the bakery shopfront door open')],
    [det('Awning', 'Shop awning', 'Striped storefront canopy over the display window'), det('Planter', 'Window planter', 'Removable timber flower box beneath the bay window')], bakeryShopfront),
  entry('stone-lighthouse', 'BT-02', 'Stone Lighthouse', '#e4dfd3', '#c4463a', 'Tapered coastal stone lighthouse with striped masonry bands, rotating Fresnel beacon, and hinged entry door.',
    [rot('BeaconLens', 'Beacon lens', 'y', [0, 360], 'Rotates the dual Fresnel beacon assembly'), rot('EntryDoor', 'Entry door', 'y', [0, 80], 'Swings the stone porch entry door open')], [], stoneLighthouse),
  entry('timber-windmill', 'BT-03', 'Timber Windmill', '#c9a679', '#4d6f82', 'Tapered octagonal timber windmill with spinning four-blade lattice sails, stone base, and hinged mill door.',
    [rot('SailRotor', 'Sail rotor', 'z', [0, 360], 'Spins the four-blade timber wind sails'), rot('MillDoor', 'Mill door', 'y', [0, 80], 'Opens the ground-level mill entrance door')], [], timberWindmill),
  entry('town-clock-tower', 'BT-04', 'Town Clock Tower', '#c8b496', '#3e6268', 'Civic sandstone clock tower with open pendulum arcade, four-sided dial, rotating clock hand, and copper spire.',
    [rot('Pendulum', 'Pendulum', 'z', [-25, 25], 'Swings the brass clock pendulum inside the lower arcade'), rot('ClockHand', 'Clock hand', 'z', [0, 360], 'Rotates the front clock dial hands')], [], townClockTower),
  entry('torii-shrine', 'BT-05', 'Torii Shrine', '#c94132', '#2f353b', 'Traditional vermilion torii gate with upturned kasagi lintel, swaying bronze temple bell, and detachable stone lanterns.',
    [rot('ShrineBell', 'Shrine bell', 'x', [-28, 28], 'Swings the suspended bronze bell and pull rope')],
    [det('LanternPair', 'Stone lantern pair', 'Twin flanking carved stone toro lanterns')], toriiShrine),
  entry('glass-greenhouse', 'BT-06', 'Glass Greenhouse', '#5d8a6e', '#d8c59e', 'Victorian botanical glasshouse on a limestone dwarf wall with iron ribs, hinged glass door, and tilting roof vent.',
    [rot('GlassDoor', 'Glass door', 'y', [0, 85], 'Swings the glazed iron entry door open'), rot('RoofVent', 'Roof vent', 'x', [0, 40], 'Tilts the ridge skylight vent open for airflow')], [], glassGreenhouse),
  entry('country-train-depot', 'BT-07', 'Country Train Depot', '#a65c47', '#e0c790', 'Timber-eaved country railway depot with boarding platform, sliding freight door, and tilting trackside semaphore signal.',
    [slide('FreightDoor', 'Freight door', 'x', [0, 0.55], 'Slides the braced freight bay door along its overhead rail'), rot('SignalArm', 'Signal arm', 'z', [0, 45], 'Tilts the trackside semaphore signal arm')], [], countryTrainDepot),
  entry('fire-watchtower', 'BT-08', 'Fire Watchtower', '#b98956', '#c95a3e', 'Cross-braced forestry fire lookout tower with catwalk, glazed cab, hinged floor trap hatch, and rotating spotter scope.',
    [rot('SpotterScope', 'Spotter scope', 'y', [-90, 90], 'Pans the catwalk-mounted horizon spotting scope'), rot('TrapHatch', 'Trap hatch', 'x', [0, -85], 'Lifts the catwalk stair access trap hatch upward')], [], fireWatchtower),
];
