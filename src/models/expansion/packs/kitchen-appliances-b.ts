import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { barHandle, cyl, glassPane, grillWheel, HPI, matte, orb, slideTrack, torus } from './kitchen-appliances-kit';

export function dualZoneWineCooler(root: T.Group, p: Finish, detail: boolean) {
  const wc = group(root, 'WineCooler');
  const bottle = matte('#294532', 0.45, 'Wine bottle');
  box(wc, [0, 0.09, 0], [0.88, 0.18, 0.68], p.dark);
  for (let i = 0; i < 4; i++) box(wc, [0, 0.05 + i * 0.032, 0.355], [0.76, 0.016, 0.018], p.alloy);
  box(wc, [0, 1.06, -0.28], [0.92, 1.8, 0.16], p.primary);
  for (const sx of [-0.42, 0.42]) box(wc, [sx, 1.06, 0], [0.09, 1.8, 0.72], p.primary);
  shell(wc, [0, 1.98, 0], [0.96, 0.08, 0.76], p.primary, 0.14);
  box(wc, [0, 1.08, 0.02], [0.78, 0.08, 0.62], p.dark);
  box(wc, [0, 1.08, 0.34], [0.46, 0.055, 0.02], p.optic);
  for (const y of [0.36, 0.68, 1.36, 1.68]) {
    box(wc, [0, y, -0.02], [0.76, 0.035, 0.5], p.accent);
    for (const bx of [-0.24, 0, 0.24]) cyl(wc, [bx, y + 0.06, -0.02], 0.044, 0.048, 0.42, bottle, 'z', 10);
  }
  const shelf = group(root, 'WineShelf', [0, 0.86, 0.02]);
  box(shelf, [0, 0, 0], [0.74, 0.036, 0.48], p.accent);
  for (const bx of [-0.22, 0, 0.22]) cyl(shelf, [bx, 0.06, 0], 0.044, 0.048, 0.4, bottle, 'z', 10);
  const door = group(root, 'CoolerGlassDoor', [-0.46, 1.06, 0.37]);
  for (const dx of [0.04, 0.88]) box(door, [dx, 0, 0], [0.075, 1.78, 0.05], p.alloy);
  for (const y of [-0.85, 0.85]) box(door, [0.46, y, 0], [0.9, 0.075, 0.05], p.alloy);
  glassPane(door, [0.46, 0, 0], [0.76, 1.62, 0.02]);
  barHandle(door, [0.84, 0, 0.03], 0.66, false, p.accent);
  if (detail) {
    for (const y of [0.24, 1.88]) box(wc, [-0.47, y, 0.36], [0.04, 0.06, 0.05], p.alloy);
    if (p.hd) for (const sx of [-0.38, 0.38]) fastener(wc, [sx, 1.98, 0.38], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Inspect wine', 3.4, [
    rotationTrack('CoolerGlassDoor', 'y', [0, 0.9, 2.4, 3.4], [0, -1.38, -1.38, 0]),
    slideTrack('WineShelf', [0, 0.86, 0.02], 2, [0, 1.2, 2.2, 3.4], [0, 0.38, 0.38, 0]),
  ])];
}

export function charcoalKettleGrill(root: T.Group, p: Finish, detail: boolean) {
  const gr = group(root, 'KettleGrill');
  strut(gr, [0, 0.02, 0.36], [0, 0.72, 0.22], 0.026, p.alloy, 10);
  tube(gr, [0, 0.03, 0.36], 0.036, 0.04, 0.06, p.tire, 10);
  for (const sx of [-0.34, 0.34]) strut(gr, [sx, 0.14, -0.32], [sx * 0.65, 0.72, -0.2], 0.026, p.alloy, 10);
  strut(gr, [-0.36, 0.14, -0.32], [0.36, 0.14, -0.32], 0.02, p.alloy, 8);
  grillWheel(gr, 'GrillWheelL', [-0.4, 0.14, -0.32], 0.14, 0.05, p);
  grillWheel(gr, 'GrillWheelR', [0.4, 0.14, -0.32], 0.14, 0.05, p);
  tube(gr, [0, 0.28, 0], 0.26, 0.24, 0.035, p.alloy, 14);
  for (const pt of [[0, 0.28, 0.31], [-0.3, 0.28, -0.28], [0.3, 0.28, -0.28]] as const) strut(gr, [0, 0.28, 0], [...pt], 0.016, p.alloy, 8);
  orb(gr, [0, 0.84, 0], 0.42, p.primary, p.hd, [1, 0.74, 1]);
  ring(gr, [0, 0.88, 0], 0.43, 0.026, 0.045, p.alloy);
  for (let i = 0; i < 6; i++) box(gr, [-0.25 + i * 0.1, 0.9, 0], [0.016, 0.016, 0.66], p.alloy);
  for (const [cx, cz] of [[-0.12, 0.08], [0.1, -0.06], [0, 0.12]] as const) orb(gr, [cx, 0.82, cz], 0.09, p.accent, p.hd, [1.2, 0.6, 1]);
  const lid = group(root, 'KettleLid', [0, 0.9, -0.42]);
  orb(lid, [0, 0.04, 0.42], 0.42, p.primary, p.hd, [1, 0.68, 1]);
  barHandle(lid, [0, 0.34, 0.38], 0.24, true, p.accent);
  tube(lid, [0.18, 0.28, 0.32], 0.065, 0.065, 0.03, p.alloy, 12);
  if (detail) {
    barHandle(gr, [0, 0.84, 0.44], 0.22, true, p.accent);
    if (p.hd) for (const sx of [-0.34, 0.34]) fastener(gr, [sx, 0.14, -0.32], p, 0.022).rotation.z = HPI;
  }
  root.animations = [
    new T.AnimationClip('Lift grill lid', 3, [rotationTrack('KettleLid', 'x', [0, 0.9, 2.1, 3], [0, -1.15, -1.15, 0])]),
    new T.AnimationClip('Roll grill', 2.8, [spinTrack('GrillWheelL', 'x', 2.8, 2), spinTrack('GrillWheelR', 'x', 2.8, 2)]),
  ];
}

export function offsetBarrelSmoker(root: T.Group, p: Finish, detail: boolean) {
  const sm = group(root, 'BarrelSmoker');
  for (const sx of [-0.52, 0.42]) for (const sz of [-0.3, 0.3]) strut(sm, [sx, 0.08, sz], [sx, 0.86, sz * 0.72], 0.032, p.dark, 10);
  box(sm, [-0.05, 0.28, 0], [0.98, 0.045, 0.56], p.edge);
  for (const sz of [-0.32, 0.32]) ring(sm, [-0.52, 0.16, sz], 0.16, 0.03, 0.05, p.tire).rotation.x = HPI;
  for (const sz of [-0.3, 0.3]) tube(sm, [0.42, 0.04, sz], 0.042, 0.048, 0.08, p.tire, 10);
  cyl(sm, [-0.1, 1.0, 0], 0.34, 0.34, 1.18, p.primary, 'x', 16);
  shell(sm, [-0.1, 0.88, 0.44], [0.96, 0.05, 0.26], p.accent, 0.14);
  for (const sx of [-0.42, 0.22]) strut(sm, [sx, 0.86, 0.32], [sx, 0.7, 0.22], 0.02, p.dark, 8);
  tube(sm, [-0.62, 1.56, 0], 0.072, 0.082, 0.78, p.dark, 12);
  tube(sm, [-0.62, 1.98, 0], 0.1, 0.09, 0.04, p.accent, 12);
  cyl(sm, [0.7, 0.84, 0], 0.24, 0.24, 0.54, p.dark, 'x', 14);
  const lid = group(root, 'SmokerLid', [-0.1, 1.12, -0.28]);
  cyl(lid, [0, -0.1, 0.28], 0.355, 0.355, 0.96, p.primary, 'x', 16).scale.set(1, 0.65, 1);
  barHandle(lid, [0, -0.06, 0.62], 0.46, true, p.accent);
  cyl(lid, [0, 0.12, 0.56], 0.06, 0.06, 0.035, p.stencil, 'z', 12);
  const fb = group(root, 'FireboxDoor', [0.98, 0.84, -0.22]);
  cyl(fb, [0.02, 0, 0.22], 0.22, 0.22, 0.05, p.accent, 'x', 14);
  if (detail) {
    for (const sx of [-0.56, 0.36]) ring(sm, [sx, 1.0, 0], 0.355, 0.022, 0.045, p.accent).rotation.z = HPI;
    if (p.hd) for (const sx of [-0.4, 0.2]) fastener(sm, [sx, 0.88, 0.58], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Open smoker', 3, [rotationTrack('SmokerLid', 'x', [0, 0.9, 2.1, 3], [0, -1.2, -1.2, 0])]),
    new T.AnimationClip('Stoke firebox', 2.8, [rotationTrack('FireboxDoor', 'y', [0, 0.8, 2, 2.8], [0, 1.3, 1.3, 0])]),
  ];
}

export function commercialWokStation(root: T.Group, p: Finish, detail: boolean) {
  const wk = group(root, 'WokStation');
  for (const sx of [-0.56, 0.56]) for (const sz of [-0.36, 0.36]) tube(wk, [sx, 0.44, sz], 0.036, 0.042, 0.88, p.alloy, 10);
  box(wk, [0, 0.24, 0], [1.14, 0.05, 0.72], p.alloy);
  shell(wk, [0, 0.88, 0], [1.26, 0.22, 0.84], p.primary, 0.1);
  box(wk, [0, 1.34, -0.38], [1.26, 0.76, 0.09], p.primary);
  for (const sx of [-0.32, 0.32]) {
    ring(wk, [sx, 1.04, 0.04], 0.22, 0.032, 0.1, p.dark);
    orb(wk, [sx, 1.08, 0.04], 0.23, p.dark, p.hd, [1, 0.44, 1]);
    strut(wk, [sx + 0.2, 1.12, 0.1], [sx + 0.34, 1.2, 0.2], 0.022, p.accent, 8);
  }
  const faucet = group(root, 'FaucetArm', [0, 1.54, -0.32]);
  strut(faucet, [0, 0, 0], [0, 0.04, 0.32], 0.018, p.alloy, 10);
  strut(faucet, [0, 0.04, 0.32], [0, -0.1, 0.32], 0.016, p.alloy, 10);
  const valve = group(root, 'FlameValve', [-0.32, 0.82, 0.44]);
  cyl(valve, [0, 0, 0], 0.034, 0.034, 0.06, p.accent, 'z', 10);
  box(valve, [0, 0.04, 0.035], [0.03, 0.11, 0.026], p.accent);
  if (detail) {
    box(wk, [0.32, 0.82, 0.44], [0.04, 0.12, 0.04], p.accent);
    for (const x of [-0.38, 0, 0.38]) tube(wk, [x, 0.38, 0], 0.12, 0.1, 0.24, p.stencil, 12);
    if (p.hd) for (const sx of [-0.54, 0.54]) fastener(wk, [sx, 1.64, -0.32], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Swing faucet', 2.8, [rotationTrack('FaucetArm', 'y', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.62, 0, -0.62, 0])]),
    new T.AnimationClip('Adjust flame', 2.4, [rotationTrack('FlameValve', 'z', [0, 0.7, 1.7, 2.4], [0, 1.1, 1.1, 0])]),
  ];
}

export function inductionChefIsland(root: T.Group, p: Finish, detail: boolean) {
  const isl = group(root, 'ChefIsland');
  const stone = matte('#e0dcd0', 0.84, 'Quartz island');
  shell(isl, [0, 0.06, 0], [1.62, 0.12, 0.92], p.dark, 0.1);
  shell(isl, [0, 0.48, 0], [1.68, 0.76, 0.96], p.primary, 0.1);
  shell(isl, [0, 0.92, 0], [1.82, 0.11, 1.08], stone, 0.12);
  box(isl, [-0.14, 0.985, 0], [0.96, 0.024, 0.68], p.inset);
  for (const bx of [-0.38, 0.1]) for (const bz of [-0.16, 0.16]) ring(isl, [bx, 1.005, bz], 0.12, 0.016, 0.014, p.optic);
  for (const sx of [-0.74, 0.74]) strut(isl, [sx, 0.96, -0.38], [sx, 2.02, -0.38], 0.032, p.dark, 10);
  strut(isl, [-0.74, 2.02, -0.38], [0.74, 2.02, -0.38], 0.034, p.dark, 10);
  const drawer = group(root, 'PotDrawer', [0.46, 0.56, 0.14]);
  shell(drawer, [0, 0, 0.36], [0.64, 0.3, 0.06], p.primary, 0.14);
  box(drawer, [0, -0.1, 0], [0.58, 0.04, 0.68], p.dark);
  barHandle(drawer, [0, 0.04, 0.4], 0.44, true, p.accent);
  const hook = group(root, 'PotRackHook', [-0.24, 2.0, -0.38]);
  strut(hook, [0, 0, 0], [0, -0.26, 0], 0.016, p.accent, 8);
  cyl(hook, [0, -0.36, 0], 0.16, 0.16, 0.06, p.accent, 'z', 14);
  if (detail) {
    tube(isl, [0.58, 1.08, 0.12], 0.12, 0.12, 0.2, p.accent, 14);
    for (const x of [-0.46, 0.24]) {
      strut(isl, [x, 2.0, -0.38], [x, 1.76, -0.38], 0.014, p.alloy, 8);
      cyl(isl, [x, 1.66, -0.38], 0.13, 0.13, 0.05, p.alloy, 'z', 12);
    }
    if (p.hd) for (const sx of [-0.74, 0.74]) fastener(isl, [sx, 2.02, -0.34], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Open drawer', 3, [slideTrack('PotDrawer', [0.46, 0.56, 0.14], 2, [0, 0.9, 2.1, 3], [0, 0.38, 0.38, 0])]),
    new T.AnimationClip('Sway pot', 2.6, [rotationTrack('PotRackHook', 'z', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.32, 0, -0.32, 0])]),
  ];
}

export function canopyRangeHood(root: T.Group, p: Finish, detail: boolean) {
  const hd = group(root, 'HoodStation');
  shell(hd, [0, 0.08, 0], [1.42, 0.16, 0.92], p.dark, 0.12);
  for (const sx of [-0.62, 0.62]) for (const sz of [-0.36, 0.36]) strut(hd, [sx, 0.14, sz], [sx, 1.64, sz], 0.036, p.dark, 10);
  shell(hd, [0, 0.88, 0], [1.34, 0.12, 0.84], p.alloy, 0.12);
  shell(hd, [0, 1.68, 0], [1.46, 0.18, 0.96], p.primary, 0.14);
  tube(hd, [0, 1.94, 0], 0.32, 0.78, 0.38, p.primary, 4).rotation.y = Math.PI / 4;
  shell(hd, [0, 2.34, 0], [0.46, 0.52, 0.46], p.alloy, 0.12);
  const fan = group(root, 'ExhaustFan', [0, 1.72, 0]);
  tube(fan, [0, 0, 0], 0.08, 0.08, 0.08, p.dark, 10);
  for (let i = 0; i < 6; i++) {
    const bl = box(fan, [0, 0, 0], [0.56, 0.02, 0.09], p.accent);
    bl.rotation.y = (i * Math.PI) / 3;
    bl.rotation.x = 0.25;
  }
  const baffle = group(root, 'BaffleFilter', [0, 1.58, -0.32]);
  box(baffle, [0, 0, 0.32], [1.1, 0.04, 0.54], p.alloy);
  for (let i = 0; i < 6; i++) box(baffle, [-0.4 + i * 0.16, -0.022, 0.32], [0.055, 0.022, 0.46], p.dark);
  if (detail) {
    for (const sx of [-0.42, 0.42]) orb(hd, [sx, 1.57, 0.36], 0.044, p.optic, p.hd);
    for (const x of [-0.3, 0, 0.3]) box(hd, [x, 1.68, 0.495], [0.1, 0.055, 0.02], p.accent);
    if (p.hd) for (const sx of [-0.62, 0.62]) fastener(hd, [sx, 1.68, 0.49], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Run exhaust', 2, [spinTrack('ExhaustFan', 'y', 2, 3)]),
    new T.AnimationClip('Drop filter', 3, [rotationTrack('BaffleFilter', 'x', [0, 0.9, 2.1, 3], [0, 0.72, 0.72, 0])]),
  ];
}

export function gelatoBatchFreezer(root: T.Group, p: Finish, detail: boolean) {
  const gl = group(root, 'GelatoFreezer');
  for (const sx of [-0.34, 0.34]) for (const sz of [-0.34, 0.34]) tube(gl, [sx, 0.06, sz], 0.05, 0.055, 0.12, p.tire, 10);
  shell(gl, [0, 0.76, -0.02], [0.88, 1.3, 0.88], p.primary, 0.14);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) box(gl, [s * 0.455, 0.38 + i * 0.1, 0], [0.022, 0.036, 0.56], p.dark);
  cyl(gl, [0, 1.12, 0.26], 0.22, 0.22, 0.44, p.alloy, 'z', 16);
  tube(gl, [0, 1.54, -0.06], 0.22, 0.12, 0.24, p.alloy, 14);
  box(gl, [0, 0.72, 0.46], [0.56, 0.06, 0.22], p.alloy);
  tube(gl, [0, 0.84, 0.48], 0.14, 0.12, 0.18, p.stencil, 12);
  const dash = group(root, 'ChurnDasher', [0, 1.12, 0.38]);
  cyl(dash, [0, 0, 0], 0.04, 0.04, 0.28, p.accent, 'z', 10);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    box(dash, [Math.sin(a) * 0.11, Math.cos(a) * 0.11, 0.04], [0.035, 0.14, 0.2], p.accent).rotation.z = -a;
  }
  const chute = group(root, 'FrontChute', [-0.24, 1.12, 0.5]);
  cyl(chute, [0.24, 0, 0.02], 0.24, 0.24, 0.055, p.accent, 'z', 16);
  box(chute, [0.24, -0.18, 0.08], [0.16, 0.14, 0.14], p.alloy);
  if (detail) {
    box(gl, [0.22, 1.32, 0.44], [0.18, 0.1, 0.025], p.optic);
    if (p.hd) for (const sx of [-0.34, 0.34]) fastener(gl, [sx, 1.36, 0.43], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Churn gelato', 2.2, [spinTrack('ChurnDasher', 'z', 2.2, 3)]),
    new T.AnimationClip('Open chute', 3, [rotationTrack('FrontChute', 'y', [0, 0.9, 2.1, 3], [0, -1.25, -1.25, 0])]),
  ];
}

export function bakeryProoferCabinet(root: T.Group, p: Finish, detail: boolean) {
  const pr = group(root, 'ProoferCabinet');
  const dough = matte('#e8d5a8', 0.88, 'Proofing dough');
  for (const sx of [-0.46, 0.46]) for (const sz of [-0.32, 0.32]) tube(pr, [sx, 0.05, sz], 0.05, 0.05, 0.1, p.tire, 10);
  box(pr, [0, 1.02, -0.34], [1.08, 1.84, 0.12], p.primary);
  for (const sx of [-0.5, 0.5]) box(pr, [sx, 1.02, 0], [0.09, 1.84, 0.78], p.primary);
  shell(pr, [0, 1.98, 0], [1.14, 0.22, 0.84], p.alloy, 0.12);
  box(pr, [0, 1.98, 0.435], [0.46, 0.11, 0.025], p.optic);
  const pans = group(root, 'SheetPans', [0, 0.32, 0]);
  for (let row = 0; row < 5; row++) {
    const ry = row * 0.3;
    box(pans, [0, ry, 0], [0.88, 0.032, 0.62], p.alloy);
    for (const bx of [-0.24, 0, 0.24]) orb(pans, [bx, ry + 0.07, 0], 0.095, dough, p.hd, [1.1, 0.65, 1.1]);
  }
  for (const [name, px, dir] of [['ProoferDoorL', -0.48, 1], ['ProoferDoorR', 0.48, -1]] as const) {
    const dr = group(root, name, [px, 1.02, 0.4]);
    for (const dx of [dir * 0.035, dir * 0.435]) box(dr, [dx, 0, 0], [0.07, 1.76, 0.048], p.alloy);
    for (const y of [-0.84, 0.84]) box(dr, [dir * 0.235, y, 0], [0.46, 0.075, 0.048], p.alloy);
    glassPane(dr, [dir * 0.235, 0, 0], [0.34, 1.6, 0.018]);
    barHandle(dr, [dir * 0.4, 0, 0.03], 0.44, false, p.accent);
  }
  if (detail) {
    for (const x of [-0.36, 0.36]) cyl(pr, [x, 1.98, 0.44], 0.038, 0.038, 0.032, p.accent, 'z', 12);
    if (p.hd) for (const sx of [-0.48, 0.48]) fastener(pr, [sx, 2.04, 0.42], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Open proofer', 3.2, [
    rotationTrack('ProoferDoorL', 'y', [0, 0.9, 2.2, 3.2], [0, -1.35, -1.35, 0]),
    rotationTrack('ProoferDoorR', 'y', [0, 0.9, 2.2, 3.2], [0, 1.35, 1.35, 0]),
  ])];
}

export function twinBasketFryer(root: T.Group, p: Finish, detail: boolean) {
  const fr = group(root, 'CommercialFryer');
  for (const sx of [-0.34, 0.34]) for (const sz of [-0.34, 0.34]) tube(fr, [sx, 0.08, sz], 0.038, 0.044, 0.16, p.alloy, 10);
  shell(fr, [0, 0.56, 0], [0.88, 0.84, 0.86], p.primary, 0.1);
  box(fr, [0, 0.5, 0.445], [0.74, 0.62, 0.03], p.alloy);
  box(fr, [0, 1.24, -0.34], [0.86, 0.56, 0.18], p.alloy);
  box(fr, [0, 0.96, 0.06], [0.76, 0.08, 0.6], p.inset);
  for (const [name, sx] of [['FryBasketL', -0.18], ['FryBasketR', 0.18]] as const) {
    const bk = group(root, name, [sx, 1.0, 0.08]);
    shell(bk, [0, 0.06, 0], [0.28, 0.18, 0.44], p.alloy, 0.12);
    box(bk, [0, 0.12, 0], [0.24, 0.08, 0.38], p.accent);
    strut(bk, [0, 0.12, 0.22], [0, 0.24, 0.46], 0.022, p.accent, 10);
    torus(bk, [0, 0.18, -0.22], 0.042, 0.014, p.alloy, p.hd);
  }
  if (detail) {
    for (const sx of [-0.22, 0.22]) cyl(fr, [sx, 0.88, 0.45], 0.036, 0.04, 0.035, p.accent, 'z', 12);
    barHandle(fr, [0, 0.72, 0.46], 0.44, true, p.dark);
    if (p.hd) for (const sx of [-0.34, 0.34]) fastener(fr, [sx, 1.46, -0.24], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Lift baskets', 3, [
    slideTrack('FryBasketL', [-0.18, 1.0, 0.08], 1, [0, 0.8, 1.8, 3], [0, 0.26, 0.26, 0]),
    slideTrack('FryBasketR', [0.18, 1.0, 0.08], 1, [0, 1.2, 2.2, 3], [0, 0.26, 0.26, 0]),
  ])];
}

export function sousVidePrepStation(root: T.Group, p: Finish, detail: boolean) {
  const sv = group(root, 'SousVideCart');
  for (const sx of [-0.48, 0.48]) for (const sz of [-0.32, 0.32]) {
    tube(sv, [sx, 0.44, sz], 0.028, 0.028, 0.86, p.alloy, 10);
    tube(sv, [sx, 0.04, sz], 0.042, 0.042, 0.08, p.tire, 10);
  }
  box(sv, [0, 0.26, 0], [1.0, 0.05, 0.68], p.primary);
  shell(sv, [0, 0.84, 0], [1.08, 0.08, 0.74], p.primary, 0.12);
  box(sv, [-0.12, 0.9, 0], [0.68, 0.05, 0.56], p.dark);
  glassPane(sv, [-0.12, 1.12, 0], [0.66, 0.4, 0.54], '#8fd8e8');
  for (const x of [-0.3, -0.14, 0.02]) box(sv, [x, 1.08, 0], [0.05, 0.24, 0.38], p.accent);
  tube(sv, [0.34, 1.24, 0], 0.072, 0.068, 0.58, p.dark, 14);
  shell(sv, [0.34, 1.54, 0.04], [0.18, 0.16, 0.2], p.primary, 0.22);
  box(sv, [0.34, 1.56, 0.15], [0.12, 0.08, 0.02], p.optic);
  box(sv, [0.24, 1.32, 0], [0.12, 0.08, 0.12], p.alloy);
  const rotor = group(root, 'CirculatorRotor', [0.34, 0.98, 0]);
  tube(rotor, [0, 0, 0], 0.04, 0.04, 0.08, p.accent, 10);
  for (let i = 0; i < 4; i++) box(rotor, [0, 0, 0], [0.14, 0.022, 0.032], p.accent).rotation.y = (i * Math.PI) / 4;
  const cover = group(root, 'BathCover', [-0.12, 1.32, -0.27]);
  glassPane(cover, [0, 0.02, 0.27], [0.68, 0.032, 0.54]);
  barHandle(cover, [0, 0.04, 0.44], 0.24, true, p.accent);
  if (detail) {
    shell(sv, [0, 0.34, 0], [0.62, 0.12, 0.4], p.stencil, 0.18);
    if (p.hd) for (const sx of [-0.48, 0.48]) fastener(sv, [sx, 0.84, 0.38], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Circulate bath', 2, [spinTrack('CirculatorRotor', 'y', 2, 3)]),
    new T.AnimationClip('Open bath cover', 3, [rotationTrack('BathCover', 'x', [0, 0.9, 2.1, 3], [0, -1.25, -1.25, 0])]),
  ];
}
