import * as T from 'three';
import { box, group, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../parts';
import type { Finish, Point } from '../parts';
import { fastener } from '../hd-detail';
import type { DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';

export interface TownBuildingDef {
  id: string;
  code: string;
  category: 'Object';
  browseCategory: BrowseCategory;
  name: string;
  primary: string;
  accent: string;
  description: string;
  physicsBody: 'static';
  riggedParts: readonly RiggedPartSpec[];
  detachableParts: readonly DetachablePartSpec[];
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

function pitchedRoof(parent: T.Object3D, at: Point, w: number, h: number, d: number, wallMat: T.Material, roofMat: T.Material, p: Finish, detail: boolean) {
  const [x, y, z] = at;
  gablePrism(parent, [x, y, z], w * 0.92, h, d * 0.88, wallMat, p.hd);
  const run = w * 0.54;
  const slopeLen = Math.hypot(run, h) + 0.1;
  const angle = Math.atan2(h, run);
  for (const s of [-1, 1]) {
    box(parent, [x + s * run * 0.5, y + h * 0.5 + 0.02, z], [slopeLen, 0.075, d], roofMat).rotation.z = -s * angle;
    if (p.hd && detail) box(parent, [x + s * run * 0.5, y + h * 0.5 - 0.01, z + d * 0.51], [slopeLen, 0.055, 0.05], p.accent).rotation.z = -s * angle;
  }
  box(parent, [x, y + h + 0.04, z], [0.11, 0.07, d + 0.04], p.edge);
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

function canalBoathouse(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Boathouse');
  box(b, [0, 0.035, 0], [1.14, 0.07, 1.96], p.optic);
  for (const s of [-1, 1]) {
    box(b, [s * 0.88, 0.25, 0], [0.66, 0.08, 1.98], p.accent);
    for (const z of [-0.84, -0.28, 0.28, 0.84]) tube(b, [s * 0.88, 0.11, z], 0.075, 0.085, 0.22, p.dark, 10);
    shell(b, [s * 0.88, 0.84, -0.18], [0.62, 1.1, 1.32], p.primary, 0.08);
    box(b, [s * 0.54, 0.72, 0.44], [0.08, 0.94, 0.08], p.dark);
  }
  box(b, [0, 0.84, -0.8], [1.18, 1.1, 0.12], p.primary);
  box(b, [0, 1.24, 0.42], [1.22, 0.34, 0.14], p.primary);
  pitchedRoof(b, [0, 1.38, -0.16], 2.52, 0.82, 1.56, p.primary, p.dark, p, detail);
  const gateRest: Point = [0, 0.14, 0.44];
  const gate = group(b, 'BoatGate', gateRest);
  box(gate, [0, 0.46, 0], [1.02, 0.92, 0.055], p.accent);
  for (const x of [-0.36, -0.18, 0, 0.18, 0.36]) box(gate, [x, 0.46, 0.025], [0.05, 0.84, 0.03], p.dark);
  box(gate, [0, 0.06, 0.025], [1.0, 0.06, 0.03], p.edge);
  tube(b, [0.92, 0.78, 0.72], 0.058, 0.07, 1.0, p.dark, 12);
  const crane = group(b, 'MooringCrane', [0.92, 1.22, 0.72]);
  tube(crane, [0, 0, 0], 0.08, 0.08, 0.15, p.alloy, 12);
  strut(crane, [0, 0, 0], [-0.46, 0.34, 0.36], 0.038, p.accent, 10);
  strut(crane, [0, -0.34, 0], [-0.3, 0.22, 0.24], 0.026, p.edge, 8);
  strut(crane, [-0.46, 0.34, 0.36], [-0.46, -0.22, 0.36], 0.016, p.alloy, 8);
  ring(crane, [-0.46, -0.25, 0.36], 0.055, 0.016, 0.025, p.alloy);
  if (detail) {
    ring(b, [0, 1.72, 0.55], 0.16, 0.03, 0.05, p.stencil).rotation.x = Math.PI / 2;
    tube(b, [0, 1.72, 0.54], 0.13, 0.13, 0.03, p.optic, 12).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) tube(b, [s * 0.62, 0.34, 0.84], 0.048, 0.055, 0.16, p.dark, 10);
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) {
      ring(b, [s * 0.62, 0.38, 0.84], 0.07, 0.018, 0.03, p.stencil);
      fastener(b, [s * 0.54, 1.18, 0.5], p, 0.03).rotation.x = Math.PI / 2;
    }
    box(b, [-0.88, 0.84, 0.49], [0.34, 0.38, 0.05], p.optic);
  }
  root.animations = [
    new T.AnimationClip('Launch boat', 3.8, [slideTrack('BoatGate', 'y', gateRest, 3.8, 0.5), swingTrack('MooringCrane', 'y', 3.8, 55, true)]),
    new T.AnimationClip('Swing mooring crane', 3.2, [swingTrack('MooringCrane', 'y', 3.2, 55, true)]),
  ];
}

function stoneWatermill(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Watermill');
  shell(b, [0, 0.11, 0], [2.48, 0.22, 1.82], p.dark, 0.08);
  box(b, [0.92, 0.175, 0], [0.52, 0.12, 1.72], p.optic);
  shell(b, [-0.28, 0.88, 0], [1.62, 1.32, 1.5], p.primary, 0.1);
  pitchedRoof(b, [-0.28, 1.54, 0], 1.86, 0.74, 1.72, p.primary, p.accent, p, detail);
  shell(b, [-0.94, 1.98, -0.36], [0.32, 0.86, 0.32], p.edge, 0.14);
  box(b, [0.88, 1.5, -0.58], [0.32, 0.16, 0.72], p.dark);
  box(b, [0.88, 1.565, -0.54], [0.22, 0.05, 0.68], p.optic);
  strut(b, [0.88, 0.22, -0.8], [0.88, 1.44, -0.8], 0.042, p.dark, 10);
  hingedDoor(b, 'MillDoor', [-0.56, 0.22, 0.77], 0.44, 0.84, p.accent, p.edge, p);
  box(b, [0.14, 0.86, 0.76], [0.38, 0.44, 0.055], p.stencil);
  box(b, [0.14, 0.86, 0.775], [0.3, 0.36, 0.04], p.optic);
  const wheel = group(b, 'WaterWheel', [0.84, 0.88, 0.04]);
  tube(wheel, [-0.14, 0, 0], 0.1, 0.1, 0.54, p.alloy, 12).rotation.z = Math.PI / 2;
  for (const x of [-0.14, 0.14]) {
    ring(wheel, [x, 0, 0], 0.62, 0.065, 0.06, p.dark).rotation.z = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      strut(wheel, [x, 0, 0], [x, Math.cos(a) * 0.58, Math.sin(a) * 0.58], 0.024, p.dark, 8);
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const paddle = group(wheel, '', [0, Math.cos(a) * 0.62, Math.sin(a) * 0.62]);
    paddle.rotation.x = -a;
    box(paddle, [0, 0, 0], [0.32, 0.12, 0.045], p.accent);
  }
  if (detail) {
    for (const y of [0.48, 0.88, 1.28]) for (const x of [-1.09, 0.52]) box(b, [x, y, 0.72], [0.1, 0.16, 0.12], p.edge);
    box(b, [0.14, 0.86, 0.8], [0.022, 0.36, 0.02], p.stencil);
    box(b, [0.14, 0.86, 0.8], [0.3, 0.022, 0.02], p.stencil);
  }
  if (detail && p.hd) {
    fastener(wheel, [0.18, 0, 0], p, 0.055).rotation.z = -Math.PI / 2;
    box(b, [-0.28, 1.72, 0.82], [0.1, 0.1, 0.28], p.dark);
  }
  root.animations = [
    new T.AnimationClip('Turn waterwheel', 4, [spinTrack('WaterWheel', 'x', 4, 1)]),
    new T.AnimationClip('Open mill door', 3, [swingTrack('MillDoor', 'y', 3, 75)]),
  ];
}

function domeShell(parent: T.Object3D, r: number, thick: number, phiStart: number, phiLen: number, mat: T.Material, hd: boolean) {
  const steps = hd ? 16 : 6;
  const pts: T.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (Math.PI / 2);
    pts.push(new T.Vector2(Math.max(0.01, r * Math.cos(t)), r * Math.sin(t)));
  }
  for (let i = steps; i >= 0; i--) {
    const t = (i / steps) * (Math.PI / 2);
    pts.push(new T.Vector2(Math.max(0.01, (r - thick) * Math.cos(t)), (r - thick) * Math.sin(t)));
  }
  pts.push(new T.Vector2(r, 0));
  const geo = new T.LatheGeometry(pts, hd ? 32 : 10, phiStart, phiLen);
  geo.computeVertexNormals();
  return mesh(parent, geo, mat, [0, 0, 0]);
}

function domeObservatory(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Observatory');
  tube(b, [0, 0.07, 0], 1.04, 1.08, 0.14, p.dark, 16);
  tube(b, [0, 0.19, 0], 0.94, 0.98, 0.1, p.edge, 16);
  tube(b, [0, 0.85, 0], 0.82, 0.86, 1.22, p.primary, 16);
  ring(b, [0, 1.47, 0], 0.91, 0.1, 0.09, p.stencil);
  shell(b, [0, 0.66, 0.82], [0.62, 0.84, 0.36], p.primary, 0.14);
  box(b, [0, 0.56, 0.98], [0.36, 0.66, 0.06], p.dark);
  box(b, [0, 1.12, 0.86], [0.72, 0.09, 0.44], p.edge);
  const dome = group(b, 'ObservatoryDome', [0, 1.5, 0]);
  ring(dome, [0, 0.04, 0], 0.84, 0.07, 0.09, p.edge);
  domeShell(dome, 0.82, 0.075, 0.32, Math.PI - 0.32, p.accent, p.hd);
  domeShell(dome, 0.82, 0.075, Math.PI, Math.PI - 0.32, p.accent, p.hd);
  for (const s of [-1, 1]) box(dome, [s * 0.25, 0.42, 0.38], [0.06, 0.68, 0.08], p.stencil).rotation.x = -0.62;
  box(dome, [0, 0.14, 0], [0.34, 0.22, 0.28], p.dark);
  const scope = group(dome, 'Telescope', [0, 0.36, 0.02]);
  const aim = group(scope, '', [0, 0, 0]);
  aim.rotation.x = -0.56;
  tube(aim, [0, 0, 0.26], 0.115, 0.13, 0.92, p.stencil, 14).rotation.x = Math.PI / 2;
  tube(aim, [0, 0, 0.76], 0.132, 0.125, 0.14, p.accent, 14).rotation.x = Math.PI / 2;
  tube(aim, [0, 0, 0.83], 0.11, 0.11, 0.04, p.optic, 14).rotation.x = Math.PI / 2;
  tube(aim, [0, 0, -0.24], 0.075, 0.09, 0.14, p.alloy, 12).rotation.x = Math.PI / 2;
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      box(b, [Math.sin(a) * 0.85, 0.85, Math.cos(a) * 0.85], [0.1, 1.18, 0.1], p.stencil).rotation.y = a;
    }
    tube(aim, [0.11, 0.11, 0.3], 0.028, 0.028, 0.44, p.alloy, 10).rotation.x = Math.PI / 2;
  }
  if (detail && p.hd) {
    for (let i = 1; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ring(b, [Math.sin(a) * 0.84, 0.92, Math.cos(a) * 0.84], 0.12, 0.024, 0.04, p.edge).rotation.set(Math.PI / 2, 0, -a);
    }
    ring(dome, [0, 0.14, 0], 0.83, 0.022, 0.04, p.alloy);
  }
  root.animations = [
    new T.AnimationClip('Stargaze sweep', 4.4, [spinTrack('ObservatoryDome', 'y', 4.4, 1), swingTrack('Telescope', 'x', 4.4, 24, true)]),
    new T.AnimationClip('Aim telescope', 3, [swingTrack('Telescope', 'x', 3, 26, true)]),
  ];
}

function desertAdobeHouse(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'AdobeHouse');
  shell(b, [0, 0.07, 0], [2.46, 0.14, 1.84], p.dark, 0.16);
  shell(b, [0, 0.72, 0], [2.18, 1.16, 1.48], p.primary, 0.14);
  for (const s of [-1, 1]) {
    box(b, [0, 1.36, s * 0.69], [2.12, 0.14, 0.1], p.primary);
    box(b, [s * 1.04, 1.36, 0], [0.1, 0.14, 1.44], p.primary);
    box(b, [-0.44, 2.14, -0.18 + s * 0.44], [1.1, 0.1, 0.09], p.primary);
    box(b, [-0.44 + s * 0.52, 2.14, -0.18], [0.09, 0.1, 0.94], p.primary);
  }
  shell(b, [-0.44, 1.7, -0.18], [1.14, 0.78, 0.98], p.primary, 0.14);
  for (const x of [-0.82, -0.42, 0, 0.42, 0.82]) tube(b, [x, 1.24, 0.78], 0.04, 0.04, 0.24, p.dark, 10).rotation.x = Math.PI / 2;
  for (const x of [-0.78, -0.44, -0.1]) tube(b, [x, 2.02, 0.34], 0.036, 0.036, 0.2, p.dark, 10).rotation.x = Math.PI / 2;
  for (const dx of [-0.14, 0.14]) strut(b, [0.36 + dx, 1.3, 0.34], [0.16 + dx, 2.26, 0.08], 0.022, p.dark, 8);
  box(b, [-0.36, 1.06, 0.75], [0.68, 0.09, 0.1], p.dark);
  const door = hingedDoor(b, 'AdobeDoor', [-0.36, 0.14, 0.75], 0.48, 0.88, p.accent, p.dark, p);
  box(b, [0.52, 0.76, 0.72], [0.46, 0.52, 0.08], p.dark);
  box(b, [0.52, 0.76, 0.735], [0.38, 0.44, 0.045], p.optic);
  const shutter = group(b, 'WindowShutter', [0.74, 0.76, 0.77]);
  box(shutter, [-0.22, 0, 0], [0.44, 0.5, 0.048], p.accent);
  box(b, [-0.44, 1.72, 0.31], [0.34, 0.32, 0.05], p.optic);
  tube(b, [-0.94, 0.3, 0.78], 0.1, 0.22, 0.32, p.primary, 12);
  box(b, [-0.94, 0.24, 0.94], [0.11, 0.14, 0.06], p.inset);
  if (detail) {
    for (let i = 0; i < 5; i++) box(b, [0.34 - (i / 4) * 0.18, 1.44 + (i / 4) * 0.72, 0.32 - (i / 4) * 0.22], [0.28, 0.025, 0.025], p.dark);
    for (const y of [-0.14, 0, 0.14]) box(shutter, [-0.22, y, 0.025], [0.36, 0.03, 0.02], p.dark);
  }
  if (detail && p.hd) {
    for (const y of [0.22, 0.66]) fastener(door, [-0.07, y, 0.032], p, 0.024).rotation.x = Math.PI / 2;
    for (const z of [-0.44, 0, 0.44]) tube(b, [1.12, 1.24, z], 0.036, 0.036, 0.18, p.dark, 10).rotation.z = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Morning breeze', 3.4, [swingTrack('AdobeDoor', 'y', 3.4, 80), swingTrack('WindowShutter', 'y', 3.4, 105)]),
    new T.AnimationClip('Open shutter', 2.8, [swingTrack('WindowShutter', 'y', 2.8, 105)]),
  ];
}

function nordicTimberCabin(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'TimberCabin');
  shell(b, [0, 0.11, 0], [2.44, 0.22, 1.98], p.dark, 0.12);
  box(b, [-0.44, 0.08, 1.04], [0.68, 0.16, 0.18], p.edge);
  shell(b, [-0.18, 0.77, -0.14], [1.62, 1.1, 1.34], p.primary, 0.06);
  for (let i = 0; i < 6; i++) {
    const y = 0.31 + i * 0.18;
    for (const sz of [-0.78, 0.5]) tube(b, [-0.18, y, sz], 0.072, 0.072, 1.84, p.primary, 10).rotation.z = Math.PI / 2;
    for (const sx of [-0.96, 0.6]) tube(b, [sx, y, -0.14], 0.072, 0.072, 1.54, p.primary, 10).rotation.x = Math.PI / 2;
  }
  for (const x of [-0.96, -0.02, 0.6]) tube(b, [x, 0.77, 0.84], 0.055, 0.062, 1.1, p.dark, 10);
  pitchedRoof(b, [-0.18, 1.32, 0.02], 2.16, 0.94, 1.96, p.primary, p.dark, p, detail);
  shell(b, [-1.04, 1.24, -0.26], [0.36, 2.04, 0.44], p.edge, 0.14);
  shell(b, [-1.04, 2.32, -0.26], [0.44, 0.12, 0.52], p.dark, 0.14);
  const door = hingedDoor(b, 'CabinDoor', [-0.46, 0.22, 0.57], 0.48, 0.88, p.accent, p.dark, p);
  box(b, [0.24, 0.82, 0.57], [0.42, 0.44, 0.06], p.stencil);
  box(b, [0.24, 0.82, 0.59], [0.34, 0.36, 0.04], p.optic);
  const stack = group(b, 'FirewoodStack', [0.88, 0.22, -0.08]);
  for (const z of [-0.36, 0.36]) box(stack, [0.22, 0.36, z], [0.055, 0.72, 0.055], p.dark);
  box(stack, [0.06, 0.76, 0], [0.46, 0.055, 0.84], p.accent).rotation.z = -0.34;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5 - (row % 2); col++) {
      const z = -0.26 + col * 0.13 + (row % 2) * 0.065;
      tube(stack, [0.06, 0.052 + row * 0.098, z], 0.052, 0.052, 0.36, row % 2 === 0 ? p.primary : p.stencil, 10).rotation.z = Math.PI / 2;
    }
  }
  if (detail) {
    for (const s of [-1, 1]) box(b, [-0.18 + s * 0.11, 2.34, 0.98], [0.34, 0.055, 0.055], p.accent).rotation.z = s * 0.75;
    box(b, [0.24, 0.82, 0.615], [0.022, 0.36, 0.02], p.stencil);
    box(b, [0.24, 0.82, 0.615], [0.34, 0.022, 0.02], p.stencil);
  }
  if (detail && p.hd) {
    for (const y of [0.22, 0.66]) box(door, [-0.14, y, 0.032], [0.24, 0.04, 0.02], p.dark);
    for (const x of [-0.96, 0.6]) fastener(b, [x, 1.24, 0.88], p, 0.026).rotation.x = Math.PI / 2;
  }
  root.animations = [new T.AnimationClip('Open cabin door', 3, [swingTrack('CabinDoor', 'y', 3, 80)])];
}

function marketPavilion(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'MarketPavilion');
  shell(b, [0, 0.08, 0], [2.52, 0.16, 2.02], p.dark, 0.16);
  const posts: [number, number][] = [[-1.02, -0.76], [0, -0.76], [1.02, -0.76], [-1.02, 0.76], [1.02, 0.76]];
  for (const [x, z] of posts) {
    box(b, [x, 0.82, z], [0.11, 1.32, 0.11], p.dark);
    shell(b, [x, 0.24, z], [0.2, 0.16, 0.2], p.edge, 0.18);
  }
  for (const z of [-0.76, 0.76]) box(b, [0, 1.44, z], [2.16, 0.11, 0.11], p.dark);
  for (const x of [-1.02, 1.02]) box(b, [x, 1.44, 0], [0.11, 0.11, 1.62], p.dark);
  shell(b, [0, 1.56, 0], [2.56, 0.14, 2.06], p.accent, 0.14);
  shell(b, [0, 1.78, 0], [2.18, 0.3, 1.7], p.primary, 0.18);
  shell(b, [0, 2.04, 0], [1.26, 0.24, 0.98], p.accent, 0.2);
  shell(b, [0, 2.24, 0], [0.92, 0.2, 0.72], p.primary, 0.24);
  tube(b, [0, 2.4, 0], 0.03, 0.055, 0.14, p.alloy, 10);
  strut(b, [-1.02, 1.4, 0.76], [-1.02, 1.4, 1.04], 0.022, p.alloy, 10);
  strut(b, [-1.2, 1.4, 1.02], [-0.84, 1.4, 1.02], 0.02, p.alloy, 10);
  const sign = group(b, 'HangingSign', [-1.02, 1.38, 1.02]);
  for (const dx of [-0.14, 0.14]) strut(sign, [dx, 0.02, 0], [dx, -0.15, 0], 0.012, p.alloy, 8);
  box(sign, [0, -0.28, 0], [0.44, 0.28, 0.05], p.accent);
  box(sign, [0, -0.28, 0], [0.34, 0.2, 0.06], p.stencil);
  const stall = group(b, 'ProduceStall', [0.06, 0.16, 0.02]);
  shell(stall, [0, 0.32, 0], [1.34, 0.64, 0.74], p.dark, 0.1);
  box(stall, [0, 0.66, 0.02], [1.44, 0.07, 0.84], p.accent);
  for (const [x, mat] of [[-0.44, p.primary], [0, p.accent], [0.44, p.stencil]] as const) {
    const crate = group(stall, '', [x, 0.76, 0.06]);
    crate.rotation.x = 0.24;
    box(crate, [0, 0, 0], [0.36, 0.12, 0.44], p.edge);
    quad((gx, gz) => tube(crate, [gx * 0.09, 0.07, gz * 0.1], 0.065, 0.055, 0.09, mat, 10));
  }
  if (detail) {
    for (const [x, z] of posts) strut(b, [x, 1.18, z], [x * 0.78, 1.42, z * 0.78], 0.026, p.dark, 8);
    for (let x = -1.0; x <= 1.0; x += 0.4) box(b, [x, 1.46, 1.04], [0.24, 0.09, 0.04], p.primary);
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) ring(stall, [s * 0.56, 0.16, 0.38], 0.14, 0.028, 0.04, p.edge).rotation.x = Math.PI / 2;
    fastener(b, [-1.02, 1.4, 0.82], p, 0.028).rotation.x = Math.PI / 2;
  }
  root.animations = [new T.AnimationClip('Breeze sway', 3.2, [swingTrack('HangingSign', 'z', 3.2, 20, true)])];
}

function postOfficeKiosk(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'PostKiosk');
  shell(b, [0, 0.07, 0], [1.7, 0.14, 1.48], p.dark, 0.22);
  shell(b, [0, 0.88, 0], [1.48, 1.48, 1.24], p.primary, 0.18);
  shell(b, [0, 1.68, 0], [1.66, 0.14, 1.42], p.accent, 0.2);
  shell(b, [0, 1.88, 0], [1.42, 0.28, 1.18], p.dark, 0.24);
  shell(b, [0, 2.1, 0], [0.96, 0.2, 0.8], p.accent, 0.3);
  tube(b, [0, 2.28, 0], 0.055, 0.08, 0.16, p.alloy, 12);
  box(b, [-0.28, 1.18, 0.62], [0.56, 0.48, 0.06], p.stencil);
  box(b, [-0.28, 1.18, 0.635], [0.46, 0.38, 0.045], p.optic);
  box(b, [-0.28, 0.91, 0.68], [0.64, 0.06, 0.16], p.accent);
  box(b, [-0.28, 0.66, 0.625], [0.48, 0.32, 0.05], p.dark);
  box(b, [-0.28, 0.66, 0.635], [0.38, 0.22, 0.04], p.inset);
  const hatch = group(b, 'MailHatch', [-0.28, 0.54, 0.66]);
  box(hatch, [0, 0.12, 0], [0.4, 0.24, 0.048], p.accent);
  box(hatch, [0, 0.2, 0.032], [0.2, 0.032, 0.025], p.alloy);
  const door = hingedDoor(b, 'ServiceDoor', [0.36, 0.14, 0.63], 0.44, 1.14, p.primary, p.dark, p);
  box(door, [-0.22, 0.82, 0.015], [0.28, 0.4, 0.04], p.optic);
  box(door, [-0.22, 0.32, 0.015], [0.3, 0.36, 0.04], p.accent);
  if (detail) {
    for (const s of [-1, 1]) {
      box(b, [s * 0.74, 0.88, 0], [0.06, 1.32, 0.72], p.stencil);
      box(b, [s * 0.76, 0.88, 0], [0.04, 1.16, 0.58], p.dark);
    }
    box(b, [0, 1.68, 0.72], [0.84, 0.1, 0.04], p.stencil);
  }
  if (detail && p.hd) {
    ring(b, [0, 2.08, 0.42], 0.11, 0.022, 0.035, p.stencil).rotation.x = Math.PI / 2;
    quad((sx, sz) => tube(b, [sx * 0.68, 0.88, sz * 0.56], 0.048, 0.052, 1.44, p.accent, 10));
  }
  root.animations = [
    new T.AnimationClip('Mail drop', 2.8, [swingTrack('MailHatch', 'x', 2.8, 65)]),
    new T.AnimationClip('Open service door', 3, [swingTrack('ServiceDoor', 'y', 3, 80)]),
  ];
}

function bellMesh(parent: T.Object3D, mat: T.Material, hd: boolean) {
  const pts = [
    new T.Vector2(0.02, 0), new T.Vector2(0.11, -0.04), new T.Vector2(0.14, -0.22),
    new T.Vector2(0.24, -0.44), new T.Vector2(0.26, -0.48), new T.Vector2(0.21, -0.48),
    new T.Vector2(0.12, -0.24), new T.Vector2(0.08, -0.07), new T.Vector2(0.02, -0.05),
  ];
  const geo = new T.LatheGeometry(pts, hd ? 48 : 14);
  geo.computeVertexNormals();
  return mesh(parent, geo, mat, [0, 0, 0]);
}

function harborBellTower(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'HarborBellTower');
  shell(b, [0, 0.17, 0], [1.74, 0.34, 1.74], p.dark, 0.22);
  shell(b, [0, 0.84, 0], [1.38, 1.0, 1.38], p.primary, 0.2);
  shell(b, [0, 1.62, 0], [1.18, 0.62, 1.18], p.primary, 0.2);
  shell(b, [0, 1.98, 0], [1.38, 0.12, 1.38], p.edge, 0.2);
  box(b, [0, 0.64, 0.69], [0.46, 0.62, 0.08], p.dark);
  ring(b, [0, 1.56, 0.6], 0.15, 0.032, 0.05, p.dark).rotation.x = Math.PI / 2;
  tube(b, [0, 1.56, 0.59], 0.12, 0.12, 0.03, p.optic, 12).rotation.x = Math.PI / 2;
  quad((sx, sz) => box(b, [sx * 0.44, 2.48, sz * 0.44], [0.2, 0.9, 0.2], p.primary));
  for (const sx of [-1, 1]) box(b, [sx * 0.44, 2.82, 0], [0.12, 0.1, 0.96], p.dark);
  box(b, [0, 2.82, 0], [0.96, 0.1, 0.12], p.dark);
  const bell = group(b, 'HarborBell', [0, 2.78, 0]);
  box(bell, [0, 0.02, 0], [0.46, 0.09, 0.14], p.dark);
  bellMesh(bell, p.alloy, p.hd);
  ring(bell, [0, -0.44, 0], 0.255, 0.02, 0.04, p.accent);
  tube(bell, [0, -0.48, 0], 0.048, 0.048, 0.09, p.dark, 10);
  shell(b, [0, 2.98, 0], [1.34, 0.12, 1.34], p.dark, 0.2);
  tube(b, [0, 3.34, 0], 0.05, 0.84, 0.62, p.accent, 4).rotation.y = Math.PI / 4;
  tube(b, [0, 3.68, 0], 0.022, 0.032, 0.26, p.alloy, 10);
  box(b, [0, 3.66, 0], [0.34, 0.024, 0.024], p.edge);
  box(b, [0, 3.66, 0], [0.024, 0.024, 0.34], p.edge);
  const vane = group(b, 'WeatherVane', [0, 3.78, 0]);
  box(vane, [0, 0, 0], [0.56, 0.035, 0.035], p.alloy);
  tube(vane, [0.3, 0, 0], 0.005, 0.065, 0.14, p.accent, 10).rotation.z = -Math.PI / 2;
  box(vane, [-0.22, 0.04, 0], [0.18, 0.14, 0.022], p.accent);
  if (detail) {
    for (const s of [-1, 1]) ring(b, [s * 0.88, 0.2, 0.2], 0.09, 0.022, 0.03, p.alloy).rotation.z = Math.PI / 2;
    for (const y of [0.54, 0.88, 1.22]) for (const s of [-1, 1]) box(b, [s * 0.68, y, 0.62], [0.09, 0.14, 0.12], p.edge);
  }
  if (detail && p.hd) {
    quad((sx, sz) => strut(b, [sx * 0.56, 1.76, sz * 0.56], [sx * 0.66, 1.94, sz * 0.66], 0.028, p.edge, 10));
    ring(b, [0, 3.04, 0], 0.46, 0.028, 0.04, p.alloy);
  }
  root.animations = [
    new T.AnimationClip('Toll fog bell', 3.6, [swingTrack('HarborBell', 'z', 3.6, 30, true), spinTrack('WeatherVane', 'y', 3.6, 1)]),
    new T.AnimationClip('Wind shift', 4, [spinTrack('WeatherVane', 'y', 4, 1)]),
  ];
}

function entry(
  id: string, code: string, name: string, primary: string, accent: string, description: string,
  riggedParts: readonly RiggedPartSpec[], detachableParts: readonly DetachablePartSpec[], build: TownBuildingDef['build'],
): TownBuildingDef {
  return { id, code, category: 'Object', browseCategory: 'building', name, primary, accent, description, physicsBody: 'static', riggedParts, detachableParts, build };
}

export const buildingsTownB: readonly TownBuildingDef[] = [
  entry('canal-boathouse', 'BT-09', 'Canal Boathouse', '#4e778c', '#d8b478',
    'Stilt-mounted canal boathouse with timber pier, lifting slipway gate, and swinging dockside mooring crane.',
    [slide('BoatGate', 'Boat gate', 'y', [0, 0.5], 'Lifts the slatted slipway boat gate upward'), rot('MooringCrane', 'Mooring crane', 'y', [-60, 60], 'Swings the pier-mounted loading jib crane')],
    [], canalBoathouse),
  entry('stone-watermill', 'BT-10', 'Stone Watermill', '#9e9788', '#a4573b',
    'Riverside cobble stone watermill with millrace flume, spinning wooden waterwheel, clay roof, and hinged mill door.',
    [rot('WaterWheel', 'Water wheel', 'x', [0, 360], 'Spins the side-mounted wooden bucket waterwheel'), rot('MillDoor', 'Mill door', 'y', [0, 80], 'Swings the front stone millhouse door open')],
    [], stoneWatermill),
  entry('dome-observatory', 'BT-11', 'Dome Observatory', '#d8d4c8', '#3b647d',
    'Hilltop masonry observatory with buttressed drum, rotating slotted dome, and tilting refractor telescope.',
    [rot('ObservatoryDome', 'Observatory dome', 'y', [0, 360], 'Rotates the slotted observatory dome in azimuth'), rot('Telescope', 'Telescope', 'x', [-30, 30], 'Tilts the refractor telescope through the viewing slit')],
    [], domeObservatory),
  entry('desert-adobe-house', 'BT-12', 'Desert Adobe House', '#d49a6a', '#3e848d',
    'Stepped terracotta adobe house with projecting cedar vigas, roof ladder, hinged door, and louvered turquoise shutter.',
    [rot('AdobeDoor', 'Adobe door', 'y', [0, 85], 'Swings the timber adobe entry door open'), rot('WindowShutter', 'Window shutter', 'y', [0, 110], 'Swings the louvered window shutter outward')],
    [], desertAdobeHouse),
  entry('nordic-timber-cabin', 'BT-13', 'Nordic Timber Cabin', '#8f593c', '#4a6b5d',
    'Steep-gabled Nordic log cabin with notched corner logs, stone chimney, hinged plank door, and detachable firewood stack.',
    [rot('CabinDoor', 'Cabin door', 'y', [0, 85], 'Swings the front timber plank cabin door open')],
    [det('FirewoodStack', 'Firewood stack', 'Side lean-to wood shelter filled with stacked pine logs')], nordicTimberCabin),
  entry('market-pavilion', 'BT-14', 'Market Pavilion', '#c95c48', '#e2bd6b',
    'Open-sided town square timber pavilion with tiered flared roof, swaying hanging sign, and detachable produce stall.',
    [rot('HangingSign', 'Hanging sign', 'z', [-22, 22], 'Swings the bracket-mounted market sign')],
    [det('ProduceStall', 'Produce stall', 'Central timber counter stacked with produce crates')], marketPavilion),
  entry('post-office-kiosk', 'BT-15', 'Post Office Kiosk', '#3c6282', '#d99a3a',
    'Street-corner civic postal kiosk with crowned dome roof, hinged mail drop hatch, and hinged clerk service door.',
    [rot('MailHatch', 'Mail hatch', 'x', [0, 70], 'Tilts the front letter drop chute hatch outward'), rot('ServiceDoor', 'Service door', 'y', [0, 85], 'Swings the clerk service entrance door open')],
    [], postOfficeKiosk),
  entry('harbor-bell-tower', 'BT-16', 'Harbor Bell Tower', '#c2b9a7', '#3e6e68',
    'Pier-side masonry bell tower with open arched belfry, swinging bronze fog bell, and rotating rooftop weather vane.',
    [rot('HarborBell', 'Harbor bell', 'z', [-32, 32], 'Swings the bronze fog bell inside the belfry'), rot('WeatherVane', 'Weather vane', 'y', [0, 360], 'Rotates the rooftop harbor weather vane')],
    [], harborBellTower),
];
