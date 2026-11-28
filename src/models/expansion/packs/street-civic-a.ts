import type * as T from 'three';
import { AnimationClip } from 'three';
import {
  archSlab, boltRing, collar, cyl, dome, fastener, glassMat, group, HPI, kbox, khose,
  kstrut, lampMat, matteMat, orb, pane, polycarbMat, rotationTrack, shell, spinTrack, torus,
} from './street-civic-kit';
import type { Finish } from './street-civic-kit';

export function cantileverTrafficSignal(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'SignalMast');
  shell(b, [-0.88, 0.07, 0], [0.84, 0.14, 0.84], p.edge, 0.25);
  cyl(b, [-0.88, 0.18, 0], 0.26, 0.3, 0.1, p.dark, p.hd, 'y', 8);
  cyl(b, [-0.88, 1.76, 0], 0.11, 0.15, 3.16, p.primary, p.hd, 'y', 10);
  kbox(b, [-0.88, 0.68, 0.14], [0.16, 0.36, 0.05], p.accent, p.hd);
  kbox(b, [-0.88, 0.68, 0.175], [0.1, 0.24, 0.025], p.dark, p.hd);
  collar(b, [-0.88, 0.36, 0], 0.18, 0.04, 0.08, p.accent, p.hd);
  collar(b, [-0.88, 2.92, 0], 0.15, 0.036, 0.08, p.accent, p.hd);
  orb(b, [-0.88, 3.38, 0], 0.12, p.dark, p.hd);
  khose(b, [[-0.88, 2.98, 0], [-0.42, 3.22, 0], [0.28, 3.28, 0], [1.12, 3.24, 0]], 0.075, p.primary, p.hd);
  kstrut(b, [-0.88, 2.52, 0], [-0.1, 3.22, 0], 0.045, p.dark, p.hd);
  orb(b, [1.14, 3.24, 0], 0.095, p.accent, p.hd);
  cyl(b, [0.72, 3.16, 0], 0.055, 0.055, 0.28, p.dark, p.hd, 'y', 8);
  shell(b, [0.72, 2.66, -0.05], [0.46, 0.94, 0.1], p.dark, 0.14);
  shell(b, [0.72, 2.66, 0.06], [0.34, 0.82, 0.22], p.accent, 0.16);
  const lenses = [lampMat('#d93829'), lampMat('#eab308'), lampMat('#22c55e')] as const;
  for (const [idx, ly] of [2.92, 2.66, 2.4].entries()) {
    cyl(b, [0.72, ly + 0.015, 0.21], 0.105, 0.105, 0.14, p.dark, p.hd, 'z', 10);
    orb(b, [0.72, ly, 0.18], 0.082, lenses[idx] ?? p.optic, p.hd, [1, 1, 0.55]);
  }
  kstrut(b, [-0.88, 2.38, 0], [-0.3, 2.38, 0], 0.038, p.dark, p.hd);
  cyl(b, [-0.36, 2.38, 0], 0.055, 0.055, 0.1, p.accent, p.hd, 'z', 8);
  const cw = group(root, 'CrosswalkSignal', [-0.36, 2.38, 0]);
  cyl(cw, [0, -0.1, 0], 0.028, 0.028, 0.2, p.alloy, p.hd, 'y', 8);
  shell(cw, [0, -0.32, 0], [0.34, 0.34, 0.22], p.dark, 0.16);
  kbox(cw, [0, -0.22, 0.13], [0.3, 0.06, 0.1], p.accent, p.hd);
  kbox(cw, [0, -0.34, 0.115], [0.22, 0.22, 0.035], p.optic, p.hd);
  const sb = group(root, 'StreetNameBlade', [0.02, 3.36, 0]);
  for (const sx of [-0.22, 0.22]) cyl(sb, [sx, -0.1, 0], 0.038, 0.038, 0.14, p.alloy, p.hd, 'y', 8);
  kbox(sb, [0, 0.02, 0], [0.74, 0.18, 0.05], matteMat('#1f6b4b', 0.62), p.hd);
  for (const sz of [-0.032, 0.032]) kbox(sb, [0, 0.02, sz], [0.54, 0.06, 0.02], p.stencil, p.hd);
  if (detail) {
    boltRing(b, [-0.88, 0.23, 0], 0.24, 6, p, 0.026);
    for (const x of [-0.18, 0.18, 0.45]) collar(b, [x, 3.26, 0], 0.092, 0.022, 0.045, p.dark, p.hd, 'x');
    if (p.hd) fastener(b, [-0.88, 0.68, 0.195], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new AnimationClip('Swing crosswalk signal', 2.8, [
    rotationTrack('CrosswalkSignal', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.3, 0, -0.3, 0]),
  ])];
}

export function britishTelephoneBox(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'PhoneBooth');
  const glass = glassMat('#a8dce2', 0.26);
  shell(b, [0, 0.07, 0], [1.06, 0.14, 1.06], p.dark, 0.12);
  kbox(b, [0, 0.15, 0], [0.92, 0.06, 0.92], p.primary, p.hd);
  for (const sx of [-0.42, 0.42]) for (const sz of [-0.42, 0.42]) kbox(b, [sx, 1.12, sz], [0.14, 1.96, 0.14], p.primary, p.hd);
  kbox(b, [0, 1.12, -0.42], [0.78, 1.92, 0.1], p.primary, p.hd);
  kbox(b, [0, 1.12, -0.475], [0.56, 1.48, 0.035], p.dark, p.hd);
  for (const sx of [-1, 1]) {
    kbox(b, [sx * 0.42, 0.4, 0], [0.1, 0.52, 0.78], p.primary, p.hd);
    kbox(b, [sx * 0.42, 2, 0], [0.1, 0.16, 0.78], p.primary, p.hd);
    pane(b, [sx * 0.42, 1.29, 0], [0.022, 1.32, 0.76], glass);
    for (const mz of [-0.14, 0.14]) kbox(b, [sx * 0.42, 1.29, mz], [0.048, 1.32, 0.036], p.primary, p.hd);
    for (const my of [0.92, 1.29, 1.66]) kbox(b, [sx * 0.42, my, 0], [0.048, 0.036, 0.76], p.primary, p.hd);
  }
  shell(b, [0, 2.13, 0], [1.06, 0.14, 1.06], p.primary, 0.12);
  for (const s of [-1, 1]) {
    kbox(b, [0, 2.13, s * 0.535], [0.64, 0.085, 0.03], p.stencil, p.hd);
    kbox(b, [s * 0.535, 2.13, 0], [0.03, 0.085, 0.64], p.stencil, p.hd);
  }
  shell(b, [0, 2.24, 0], [0.96, 0.12, 0.96], p.primary, 0.18);
  dome(b, [0, 2.26, 0], 0.47, 0.24, 0.47, p.primary, p.hd);
  cyl(b, [0, 2.52, 0], 0.08, 0.11, 0.08, p.accent, p.hd, 'y', 8);
  orb(b, [0, 2.58, 0], 0.055, p.accent, p.hd);
  cyl(b, [0, 2.24, 0.49], 0.065, 0.065, 0.03, p.accent, p.hd, 'z', 10);
  const ph = group(root, 'InteriorPayphone', [0, 0, 0]);
  kbox(ph, [0, 0.96, -0.26], [0.58, 0.05, 0.22], p.dark, p.hd);
  shell(ph, [0, 1.24, -0.3], [0.28, 0.44, 0.16], p.edge, 0.14);
  kbox(ph, [0, 1.08, -0.2], [0.14, 0.1, 0.05], p.accent, p.hd);
  cyl(ph, [-0.15, 1.28, -0.24], 0.028, 0.028, 0.22, p.dark, p.hd, 'y', 8);
  for (const sy of [1.18, 1.38]) orb(ph, [-0.15, sy, -0.22], 0.036, p.dark, p.hd);
  const door = group(root, 'PhoneDoor', [-0.35, 1.08, 0.46]);
  kbox(door, [0.04, 0, 0], [0.08, 1.84, 0.07], p.primary, p.hd);
  kbox(door, [0.66, 0, 0], [0.08, 1.84, 0.07], p.primary, p.hd);
  kbox(door, [0.35, -0.68, 0], [0.68, 0.48, 0.07], p.primary, p.hd);
  kbox(door, [0.35, 0.87, 0], [0.68, 0.12, 0.07], p.primary, p.hd);
  pane(door, [0.35, 0.19, 0], [0.62, 1.28, 0.02], glass);
  for (const mx of [0.22, 0.48]) kbox(door, [mx, 0.19, 0], [0.034, 1.28, 0.046], p.primary, p.hd);
  for (const my of [-0.14, 0.19, 0.52]) kbox(door, [0.35, my, 0], [0.62, 0.034, 0.046], p.primary, p.hd);
  cyl(door, [0.63, -0.04, 0.068], 0.018, 0.018, 0.24, p.accent, p.hd, 'y', 8);
  for (const dy of [-0.14, 0.06]) kstrut(door, [0.63, dy, 0.02], [0.63, dy, 0.068], 0.014, p.accent, p.hd);
  if (detail) {
    for (const s of [-1, 1]) cyl(b, [s * 0.49, 2.24, 0], 0.058, 0.058, 0.028, p.accent, p.hd, 'x', 10);
    for (const sy of [0.34, 1.84]) cyl(door, [0, sy - 1.08, 0.035], 0.022, 0.022, 0.09, p.dark, p.hd, 'y', 8);
    if (p.hd) fastener(ph, [0.06, 1.34, -0.21], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new AnimationClip('Open phone door', 3, [
    rotationTrack('PhoneDoor', 'y', [0, 0.8, 2.1, 3], [0, -1.35, -1.35, 0]),
  ])];
}

export function twinParkingMeter(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'MeterPost');
  const glass = glassMat('#bce4ec', 0.3);
  shell(b, [0, 0.045, 0], [0.76, 0.09, 0.72], p.edge, 0.22);
  cyl(b, [0, 0.13, 0], 0.16, 0.21, 0.1, p.dark, p.hd, 'y', 8);
  cyl(b, [0, 0.66, 0], 0.058, 0.068, 1.0, p.primary, p.hd, 'y', 10);
  collar(b, [0, 0.22, 0], 0.11, 0.03, 0.055, p.alloy, p.hd);
  shell(b, [0, 1.14, 0], [0.54, 0.09, 0.12], p.dark, 0.2);
  for (const sx of [-1, 1]) {
    const mx = sx * 0.22;
    cyl(b, [mx, 1.21, 0], 0.052, 0.062, 0.1, p.alloy, p.hd, 'y', 8);
    shell(b, [mx, 1.32, 0], [0.19, 0.18, 0.18], p.dark, 0.2);
    shell(b, [mx, 1.46, 0], [0.22, 0.16, 0.2], p.primary, 0.24);
    dome(b, [mx, 1.54, 0], 0.11, 0.09, 0.1, p.primary, p.hd);
    for (const sz of [-1, 1]) {
      kbox(b, [mx, 1.53, sz * 0.11], [0.17, 0.034, 0.075], p.alloy, p.hd);
      cyl(b, [mx, 1.45, sz * 0.105], 0.068, 0.068, 0.022, p.stencil, p.hd, 'z', 10);
      kbox(b, [mx, 1.47, sz * 0.122], [0.016, 0.05, 0.012], p.dark, p.hd);
      cyl(b, [mx, 1.45, sz * 0.132], 0.072, 0.072, 0.012, glass, p.hd, 'z', 10).castShadow = false;
    }
    kbox(b, [mx, 1.32, 0.1], [0.11, 0.1, 0.024], p.edge, p.hd);
  }
  const fl = group(root, 'FlagLeft', [-0.22, 1.46, 0.02]);
  kstrut(fl, [0, 0, 0], [-0.14, 0.05, 0], 0.014, p.alloy, p.hd);
  kbox(fl, [-0.16, 0.06, 0], [0.11, 0.075, 0.03], p.accent, p.hd);
  const fr = group(root, 'FlagRight', [0.22, 1.46, 0.02]);
  kstrut(fr, [0, 0, 0], [0.14, 0.05, 0], 0.014, p.alloy, p.hd);
  kbox(fr, [0.16, 0.06, 0], [0.11, 0.075, 0.03], p.accent, p.hd);
  const plate = group(root, 'RateSignPlate', [0, 0.82, 0]);
  collar(plate, [0, 0, 0], 0.082, 0.024, 0.07, p.dark, p.hd);
  kbox(plate, [0, 0, 0.085], [0.3, 0.22, 0.032], p.stencil, p.hd);
  kbox(plate, [0, 0.07, 0.108], [0.24, 0.055, 0.018], p.accent, p.hd);
  if (detail) {
    boltRing(b, [0, 0.18, 0], 0.15, 4, p, 0.022);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      kstrut(b, [Math.cos(a) * 0.065, 0.24, Math.sin(a) * 0.065], [Math.cos(a) * 0.058, 1.08, Math.sin(a) * 0.058], 0.012, p.edge, p.hd);
    }
    if (p.hd) for (const sx of [-0.22, 0.22]) fastener(b, [sx, 1.63, 0], p, 0.022);
  }
  root.animations = [new AnimationClip('Pop expired flags', 2.6, [
    rotationTrack('FlagLeft', 'z', [0, 0.65, 1.8, 2.6], [0, -0.95, -0.95, 0]),
    rotationTrack('FlagRight', 'z', [0, 0.65, 1.8, 2.6], [0, 0.95, 0.95, 0]),
  ])];
}

export function snackVendingKiosk(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'VendingCabinet');
  shell(b, [0, 0.05, 0], [1.26, 0.1, 0.9], p.dark, 0.14);
  kbox(b, [0, 1.08, -0.14], [1.24, 1.98, 0.56], p.primary, p.hd);
  kbox(b, [0, 0.4, 0.27], [1.24, 0.62, 0.3], p.primary, p.hd);
  kbox(b, [-0.56, 1.36, 0.27], [0.12, 1.32, 0.3], p.primary, p.hd);
  kbox(b, [0.43, 1.36, 0.27], [0.38, 1.32, 0.3], p.primary, p.hd);
  shell(b, [0, 2.09, 0.02], [1.28, 0.2, 0.92], p.accent, 0.14);
  kbox(b, [0, 2.09, 0.49], [0.96, 0.11, 0.03], p.stencil, p.hd);
  kbox(b, [-0.14, 1.34, 0.155], [0.74, 1.24, 0.03], p.inset, p.hd);
  for (const sy of [0.88, 1.22, 1.56]) kbox(b, [-0.14, sy, 0.28], [0.74, 0.026, 0.24], p.alloy, p.hd);
  pane(b, [-0.14, 1.34, 0.405], [0.76, 1.24, 0.016]);
  shell(b, [0.43, 1.28, 0.44], [0.28, 0.76, 0.055], p.dark, 0.18);
  kbox(b, [0.43, 1.52, 0.48], [0.18, 0.1, 0.025], p.optic, p.hd);
  kbox(b, [0.43, 1.36, 0.48], [0.14, 0.05, 0.025], p.accent, p.hd);
  kbox(b, [-0.14, 0.42, 0.43], [0.74, 0.28, 0.028], p.inset, p.hd);
  const stock = group(root, 'SnackStock', [-0.14, 0.895, 0.29]);
  const sMats = [p.accent, matteMat('#c94a38', 0.65), p.stencil, matteMat('#3c8c64', 0.65)] as const;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const sx = -0.24 + c * 0.16;
      const sy = r * 0.34;
      torus(stock, [sx, sy + 0.045, 0.04], 0.034, 0.008, p.alloy, p.hd);
      kbox(stock, [sx, sy + 0.095, -0.01], [0.11, 0.17, 0.06], sMats[(r + c) % 4] ?? p.accent, p.hd);
    }
  }
  const flap = group(root, 'DeliveryFlap', [-0.14, 0.56, 0.45]);
  shell(flap, [0, -0.14, 0.01], [0.72, 0.26, 0.045], p.alloy, 0.18);
  cyl(flap, [0, -0.22, 0.04], 0.018, 0.018, 0.54, p.accent, p.hd, 'x', 8);
  if (detail) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) kbox(b, [0.37 + c * 0.06, 1.06 + r * 0.075, 0.48], [0.036, 0.04, 0.022], p.stencil, p.hd);
    for (const y of [0.42, 0.56, 0.7, 0.84]) kbox(b, [0, y, -0.435], [0.88, 0.045, 0.026], p.dark, p.hd);
    if (p.hd) for (const sx of [-0.54, 0.54]) fastener(b, [sx, 2.09, 0.49], p, 0.025).rotation.x = HPI;
  }
  root.animations = [new AnimationClip('Open delivery bin', 2.6, [
    rotationTrack('DeliveryFlap', 'x', [0, 0.65, 1.8, 2.6], [0, -0.92, -0.92, 0]),
  ])];
}

export function coinNewspaperBox(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'HonorBox');
  shell(b, [0, 0.04, 0], [0.76, 0.08, 0.76], p.edge, 0.2);
  shell(b, [0, 0.12, 0], [0.34, 0.1, 0.34], p.dark, 0.2);
  cyl(b, [0, 0.32, 0], 0.095, 0.115, 0.36, p.dark, p.hd, 'y', 8);
  shell(b, [0, 0.49, 0], [0.46, 0.07, 0.42], p.dark, 0.18);
  kbox(b, [0, 0.84, -0.1], [0.6, 0.66, 0.34], p.primary, p.hd);
  kbox(b, [0, 0.56, 0.02], [0.6, 0.1, 0.56], p.primary, p.hd);
  kbox(b, [0, 1.13, 0.02], [0.6, 0.08, 0.56], p.primary, p.hd);
  for (const sx of [-0.26, 0.26]) kbox(b, [sx, 0.84, 0.02], [0.08, 0.62, 0.56], p.primary, p.hd);
  kbox(b, [0, 0.84, 0.085], [0.44, 0.48, 0.028], p.inset, p.hd);
  shell(b, [0, 1.28, -0.02], [0.58, 0.24, 0.48], p.primary, 0.2);
  shell(b, [0, 1.28, 0.24], [0.44, 0.19, 0.06], p.accent, 0.22);
  kbox(b, [-0.1, 1.3, 0.28], [0.06, 0.09, 0.025], p.dark, p.hd);
  kbox(b, [0.1, 1.3, 0.28], [0.14, 0.08, 0.025], p.stencil, p.hd);
  kbox(b, [0, 1.2, 0.28], [0.1, 0.06, 0.04], p.edge, p.hd);
  const stack = group(root, 'NewsprintStack', [0, 0.61, 0.16]);
  for (let i = 0; i < 4; i++) {
    const w = 0.36 - (i % 2) * 0.02;
    kbox(stack, [0, 0.025 + i * 0.056, 0], [w, 0.058, 0.24], i % 2 === 0 ? p.stencil : matteMat('#d9d4c2', 0.82), p.hd);
  }
  kbox(stack, [0, 0.228, 0.03], [0.26, 0.02, 0.08], p.dark, p.hd);
  const door = group(root, 'DispenserDoor', [0, 1.1, 0.3]);
  for (const sx of [-0.23, 0.23]) kbox(door, [sx, -0.26, 0], [0.06, 0.52, 0.055], p.primary, p.hd);
  kbox(door, [0, -0.02, 0], [0.52, 0.06, 0.055], p.primary, p.hd);
  kbox(door, [0, -0.49, 0], [0.52, 0.08, 0.055], p.primary, p.hd);
  pane(door, [0, -0.25, 0], [0.42, 0.4, 0.018]);
  cyl(door, [0, -0.48, 0.068], 0.018, 0.018, 0.4, p.accent, p.hd, 'x', 8);
  for (const sx of [-0.16, 0.16]) kstrut(door, [sx, -0.48, 0.02], [sx, -0.48, 0.068], 0.014, p.alloy, p.hd);
  if (detail) {
    boltRing(b, [0, 0.17, 0], 0.14, 4, p, 0.022);
    for (const sx of [-0.315, 0.315]) kbox(b, [sx, 0.84, 0.02], [0.024, 0.42, 0.38], p.accent, p.hd);
    if (p.hd) fastener(b, [0.24, 1.32, 0.28], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new AnimationClip('Pull dispenser door', 2.8, [
    rotationTrack('DispenserDoor', 'x', [0, 0.75, 1.9, 2.8], [0, -1.12, -1.12, 0]),
  ])];
}

export function glazedBusShelter(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'BusShelter');
  const glass = glassMat('#a8dce2', 0.26);
  shell(b, [0, 0.04, 0], [2.94, 0.08, 1.44], p.edge, 0.12);
  for (const x of [-1.1, -0.05, 1.0]) {
    cyl(b, [x, 1.17, -0.52], 0.056, 0.066, 2.22, p.primary, p.hd, 'y', 10);
    cyl(b, [x, 0.11, -0.52], 0.095, 0.11, 0.1, p.dark, p.hd, 'y', 8);
    kstrut(b, [x, 2.24, -0.56], [x, 2.24, 0.56], 0.042, p.primary, p.hd);
    kstrut(b, [x, 1.88, -0.52], [x, 2.24, -0.08], 0.03, p.dark, p.hd);
  }
  cyl(b, [-1.1, 1.17, 0.42], 0.046, 0.054, 2.2, p.primary, p.hd, 'y', 10);
  kbox(b, [-0.04, 2.24, -0.52], [2.56, 0.09, 0.09], p.primary, p.hd);
  kbox(b, [-0.04, 2.24, 0.54], [2.56, 0.08, 0.08], p.primary, p.hd);
  archSlab(b, [0, 2.27, 0.02], 1.36, 0.24, 2.74, 0.055, p.primary, p.hd, 'x');
  archSlab(b, [0, 2.34, 0.02], 0.72, 0.16, 2.48, 0.04, polycarbMat(), p.hd, 'x');
  for (const y of [0.22, 2.16]) {
    kbox(b, [-0.05, y, -0.52], [2.14, 0.06, 0.06], p.dark, p.hd);
    kbox(b, [-1.1, y, -0.05], [0.06, 0.06, 0.94], p.dark, p.hd);
  }
  pane(b, [-0.57, 1.19, -0.52], [0.98, 1.88, 0.02], glass);
  pane(b, [0.48, 1.19, -0.52], [0.98, 1.88, 0.02], glass);
  pane(b, [-1.1, 1.19, -0.05], [0.02, 1.88, 0.88], glass);
  shell(b, [1.16, 1.16, -0.04], [0.22, 2.18, 1.06], p.dark, 0.14);
  const adGlow = lampMat('#f4edd3', '#fff4cc', 0.35);
  for (const sx of [-1, 1]) {
    kbox(b, [1.16 + sx * 0.115, 1.18, -0.04], [0.025, 1.66, 0.82], adGlow, p.hd);
    kbox(b, [1.16 + sx * 0.118, 2.1, -0.04], [0.028, 0.12, 0.86], p.accent, p.hd);
  }
  cyl(b, [-1.34, 1.04, 0.5], 0.036, 0.042, 1.98, p.alloy, p.hd, 'y', 8);
  cyl(b, [-1.34, 0.1, 0.5], 0.075, 0.085, 0.09, p.dark, p.hd, 'y', 8);
  const rs = group(root, 'RouteSign', [-1.34, 2.02, 0.5]);
  cyl(rs, [0, 0.14, 0], 0.032, 0.032, 0.32, p.dark, p.hd, 'y', 8);
  cyl(rs, [0, 0.22, 0], 0.24, 0.24, 0.055, p.accent, p.hd, 'z', 14);
  cyl(rs, [0, 0.22, 0], 0.18, 0.18, 0.076, p.primary, p.hd, 'z', 14);
  kbox(rs, [0, 0.22, 0], [0.36, 0.082, 0.094], p.stencil, p.hd);
  const bench = group(root, 'WaitingBench', [-0.08, 0.08, -0.18]);
  for (const bx of [-0.68, 0, 0.68]) {
    kstrut(bench, [bx, 0, 0.14], [bx, 0.38, 0.12], 0.028, p.dark, p.hd);
    kstrut(bench, [bx, 0, -0.16], [bx, 0.38, -0.14], 0.028, p.dark, p.hd);
    kstrut(bench, [bx, 0.38, -0.16], [bx, 0.38, 0.14], 0.026, p.dark, p.hd);
    kstrut(bench, [bx, 0.38, -0.16], [bx, 0.82, -0.24], 0.024, p.dark, p.hd);
  }
  for (const bz of [-0.1, 0.02, 0.14]) kbox(bench, [0, 0.405, bz], [1.62, 0.042, 0.095], p.accent, p.hd);
  for (const [by, bz] of [[0.62, -0.2], [0.76, -0.23]] as const) kbox(bench, [0, by, bz], [1.62, 0.09, 0.04], p.accent, p.hd);
  if (detail) {
    for (const x of [-1.1, -0.05, 1.0]) fastener(b, [x, 0.16, -0.44], p, 0.024);
    kbox(b, [-0.57, 1.18, -0.48], [0.34, 0.42, 0.03], p.stencil, p.hd);
    if (p.hd) for (const x of [-0.8, 0.72]) fastener(b, [x, 2.24, 0.59], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new AnimationClip('Spin route sign', 3.2, [spinTrack('RouteSign', 'y', 3.2, 1)])];
}

export function stoneDrinkingFountain(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'FountainPedestal');
  cyl(b, [0, 0.06, 0], 0.44, 0.48, 0.12, p.primary, p.hd, 'y', 8);
  cyl(b, [0, 0.16, 0], 0.3, 0.36, 0.1, p.edge, p.hd, 'y', 8);
  cyl(b, [0, 0.5, 0], 0.2, 0.25, 0.64, p.primary, p.hd, 'y', 8);
  collar(b, [0, 0.52, 0], 0.24, 0.045, 0.08, p.edge, p.hd);
  cyl(b, [0, 0.87, 0], 0.36, 0.2, 0.18, p.primary, p.hd, 'y', 10);
  collar(b, [0, 0.99, 0], 0.39, 0.085, 0.09, p.primary, p.hd);
  cyl(b, [0, 0.942, 0], 0.3, 0.3, 0.03, p.inset, p.hd, 'y', 10);
  cyl(b, [0, 0.972, 0], 0.29, 0.29, 0.036, glassMat('#59b8d1', 0.38), p.hd, 'y', 10).castShadow = false;
  cyl(b, [0, 0.993, 0], 0.056, 0.056, 0.03, p.accent, p.hd, 'y', 10);
  cyl(b, [0, 1.05, -0.29], 0.05, 0.06, 0.09, p.accent, p.hd, 'y', 10);
  khose(b, [[0, 1.08, -0.29], [0, 1.16, -0.24], [0, 1.13, -0.16]], 0.022, p.accent, p.hd);
  dome(b, [0, 1.14, -0.23], 0.048, 0.042, 0.055, p.accent, p.hd);
  cyl(b, [0, 0.94, 0.34], 0.045, 0.045, 0.08, p.accent, p.hd, 'z', 10);
  const pv = group(root, 'PushValve', [0, 0.94, 0.36]);
  cyl(pv, [0, 0, 0.04], 0.018, 0.018, 0.1, p.alloy, p.hd, 'z', 8);
  cyl(pv, [0, 0, 0.09], 0.02, 0.02, 0.16, p.accent, p.hd, 'x', 8);
  for (const sx of [-0.08, 0.08]) orb(pv, [sx, 0, 0.09], 0.026, p.accent, p.hd);
  const db = group(root, 'DogBowl', [0.38, 0.1, 0.04]);
  cyl(db, [0, 0.05, 0], 0.16, 0.18, 0.12, p.primary, p.hd, 'y', 8);
  collar(db, [0, 0.14, 0], 0.19, 0.045, 0.07, p.primary, p.hd);
  cyl(db, [0, 0.12, 0], 0.14, 0.14, 0.04, p.optic, p.hd, 'y', 8);
  kstrut(db, [-0.18, 0.18, 0], [-0.06, 0.18, 0], 0.016, p.accent, p.hd);
  if (detail) {
    for (let i = 0; i < 4; i++) {
      const a = i * HPI + Math.PI / 4;
      kstrut(b, [Math.cos(a) * 0.24, 0.24, Math.sin(a) * 0.24], [Math.cos(a) * 0.21, 0.78, Math.sin(a) * 0.21], 0.026, p.edge, p.hd);
    }
    if (p.hd) fastener(b, [0, 1.04, -0.34], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new AnimationClip('Press bubbler valve', 2.4, [
    rotationTrack('PushValve', 'x', [0, 0.6, 1.6, 2.4], [0, 0.58, 0.58, 0]),
  ])];
}

export function castPillarPostbox(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'PostboxColumn');
  cyl(b, [0, 0.06, 0], 0.38, 0.4, 0.12, p.dark, p.hd, 'y', 8);
  cyl(b, [0, 0.22, 0], 0.27, 0.3, 0.24, p.dark, p.hd, 'y', 12);
  cyl(b, [0, 0.82, 0], 0.245, 0.255, 1.02, p.primary, p.hd, 'y', 14);
  collar(b, [0, 0.38, 0], 0.275, 0.038, 0.065, p.primary, p.hd);
  collar(b, [0, 1.06, 0], 0.272, 0.038, 0.06, p.primary, p.hd);
  cyl(b, [0, 1.34, 0], 0.31, 0.32, 0.09, p.primary, p.hd, 'y', 14);
  collar(b, [0, 1.4, 0], 0.285, 0.05, 0.06, p.dark, p.hd);
  dome(b, [0, 1.41, 0], 0.265, 0.19, 0.265, p.primary, p.hd);
  cyl(b, [0, 1.61, 0], 0.032, 0.055, 0.08, p.accent, p.hd, 'y', 8);
  orb(b, [0, 1.66, 0], 0.042, p.accent, p.hd);
  cyl(b, [0, 0.95, 0.245], 0.068, 0.068, 0.032, p.accent, p.hd, 'z', 10);
  kbox(b, [0, 1.01, 0.258], [0.09, 0.032, 0.024], p.accent, p.hd);
  kbox(b, [0, 1.22, 0.255], [0.24, 0.048, 0.08], p.dark, p.hd);
  kbox(b, [0, 1.17, 0.24], [0.2, 0.065, 0.04], p.inset, p.hd);
  const sf = group(root, 'SlotFlap', [0, 1.195, 0.265]);
  kbox(sf, [0, -0.025, 0.01], [0.19, 0.055, 0.024], p.accent, p.hd);
  const md = group(root, 'MailDoor', [-0.14, 0.66, 0.22]);
  cyl(md, [0, 0, 0], 0.024, 0.024, 0.44, p.dark, p.hd, 'y', 8);
  shell(md, [0.14, 0, 0.025], [0.28, 0.44, 0.055], p.primary, 0.16);
  cyl(md, [0.23, 0, 0.058], 0.03, 0.03, 0.026, p.accent, p.hd, 'z', 8);
  const tt = group(md, 'TimetablePlate', [0.11, 0.04, 0.06]);
  kbox(tt, [0, 0, 0], [0.14, 0.18, 0.024], p.dark, p.hd);
  kbox(tt, [0, 0, 0.015], [0.1, 0.13, 0.016], p.stencil, p.hd);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      if (Math.cos(a) > 0.7 && Math.abs(Math.sin(a)) < 0.7) continue;
      kstrut(b, [Math.sin(a) * 0.25, 0.42, Math.cos(a) * 0.25], [Math.sin(a) * 0.245, 1.02, Math.cos(a) * 0.245], 0.014, p.dark, p.hd);
    }
    if (p.hd) boltRing(b, [0, 0.125, 0], 0.34, 6, p, 0.02);
  }
  root.animations = [new AnimationClip('Open mail slot and door', 3, [
    rotationTrack('SlotFlap', 'x', [0, 0.5, 1.2, 2.2, 3], [0, -0.82, 0, -0.6, 0]),
    rotationTrack('MailDoor', 'y', [0, 0.9, 2.1, 3], [0, -1.25, -1.25, 0]),
  ])];
}

export function castIronFireHydrant(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'HydrantBody');
  cyl(b, [0, 0.04, 0], 0.36, 0.38, 0.08, p.edge, p.hd, 'y', 8);
  cyl(b, [0, 0.12, 0], 0.24, 0.27, 0.11, p.dark, p.hd, 'y', 8);
  cyl(b, [0, 0.49, 0], 0.165, 0.185, 0.68, p.primary, p.hd, 'y', 12);
  collar(b, [0, 0.34, 0], 0.2, 0.038, 0.06, p.primary, p.hd);
  cyl(b, [0, 0.81, 0], 0.22, 0.22, 0.075, p.primary, p.hd, 'y', 10);
  dome(b, [0, 0.83, 0], 0.195, 0.14, 0.195, p.accent, p.hd);
  cyl(b, [0, 0.56, 0.17], 0.095, 0.105, 0.12, p.primary, p.hd, 'z', 10);
  collar(b, [0, 0.56, 0.22], 0.1, 0.025, 0.04, p.alloy, p.hd, 'z');
  for (const sx of [-1, 1]) {
    cyl(b, [sx * 0.18, 0.6, 0], 0.068, 0.075, 0.12, p.primary, p.hd, 'x', 10);
    cyl(b, [sx * 0.24, 0.6, 0], 0.074, 0.074, 0.055, p.accent, p.hd, 'x', 8);
    cyl(b, [sx * 0.275, 0.6, 0], 0.032, 0.032, 0.035, p.dark, p.hd, 'x', 6);
    khose(b, [[sx * 0.26, 0.56, 0.02], [sx * 0.23, 0.44, 0.05], [sx * 0.17, 0.36, 0.03]], 0.012, p.alloy, p.hd);
  }
  const nut = group(root, 'OperatingNut', [0, 0.96, 0]);
  cyl(nut, [0, 0.01, 0], 0.078, 0.088, 0.045, p.dark, p.hd, 'y', 10);
  cyl(nut, [0, 0.06, 0], 0.052, 0.058, 0.07, p.accent, p.hd, 'y', 5);
  const sc = group(root, 'SteamerCap', [0, 0.56, 0.25]);
  cyl(sc, [0, 0, 0], 0.098, 0.098, 0.055, p.accent, p.hd, 'z', 8);
  cyl(sc, [0, 0, 0.035], 0.036, 0.036, 0.035, p.dark, p.hd, 'z', 5);
  if (detail) {
    boltRing(b, [0, 0.175, 0], 0.22, 6, p, 0.022);
    boltRing(b, [0, 0.85, 0], 0.195, 6, p, 0.018);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      kstrut(b, [Math.cos(a) * 0.175, 0.2, Math.sin(a) * 0.175], [Math.cos(a) * 0.165, 0.76, Math.sin(a) * 0.165], 0.015, p.dark, p.hd);
    }
  }
  root.animations = [new AnimationClip('Turn valve nut', 2.6, [spinTrack('OperatingNut', 'y', 2.6, 1)])];
}

export function coveredBikeRack(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'BikeShelter');
  const pc = polycarbMat();
  shell(b, [0, 0.04, 0], [2.62, 0.08, 1.54], p.edge, 0.12);
  kbox(b, [0, 0.095, -0.44], [2.24, 0.04, 0.1], p.dark, p.hd);
  for (const x of [-1.16, 0, 1.16]) {
    cyl(b, [x, 1.06, -0.6], 0.042, 0.048, 2.02, p.primary, p.hd, 'y', 8);
    shell(b, [x, 0.1, -0.6], [0.16, 0.07, 0.16], p.dark, 0.2);
    khose(b, [[x, 2.02, -0.6], [x, 2.18, -0.22], [x, 2.18, 0.24], [x, 2.04, 0.62]], 0.042, p.primary, p.hd);
    kstrut(b, [x, 1.58, -0.6], [x, 2.16, -0.18], 0.03, p.dark, p.hd);
  }
  for (const [py, pz] of [[2.04, -0.58], [2.2, 0], [2.04, 0.58]] as const) cyl(b, [0, py, pz], 0.032, 0.032, 2.48, p.dark, p.hd, 'x', 8);
  archSlab(b, [0, 2.07, 0.02], 1.38, 0.2, 2.54, 0.036, pc, p.hd, 'x');
  kbox(b, [0, 0.1, 0.06], [2.16, 0.055, 0.12], p.dark, p.hd);
  for (const hx of [-0.84, -0.28, 0.28, 0.84]) {
    khose(b, [[hx, 0.1, -0.24], [hx, 0.72, -0.22], [hx, 0.8, 0.06], [hx, 0.72, 0.34], [hx, 0.1, 0.36]], 0.028, p.accent, p.hd);
    for (const hz of [-0.24, 0.36]) cyl(b, [hx, 0.095, hz], 0.05, 0.055, 0.05, p.dark, p.hd, 'y', 8);
  }
  for (const sx of [-1.08, 1.08]) cyl(b, [sx, 0.38, 0.52], 0.038, 0.044, 0.66, p.dark, p.hd, 'y', 8);
  const sb = group(root, 'SecurityBar', [-1.08, 0.64, 0.52]);
  cyl(sb, [0, 0, 0], 0.05, 0.05, 0.08, p.alloy, p.hd, 'z', 8);
  cyl(sb, [1.08, 0, 0], 0.028, 0.028, 2.18, p.accent, p.hd, 'x', 8);
  kbox(sb, [2.1, -0.02, 0], [0.09, 0.1, 0.07], p.dark, p.hd);
  const wp = group(root, 'SideWindPanel', [0, 1.06, -0.6]);
  pane(wp, [0, 0, 0], [2.26, 1.64, 0.02], pc);
  for (const wy of [-0.82, 0.82]) kbox(wp, [0, wy, 0], [2.28, 0.05, 0.05], p.alloy, p.hd);
  if (detail) {
    for (const x of [-1.16, 0, 1.16]) fastener(b, [x, 0.14, -0.52], p, 0.024);
    for (const hx of [-0.84, -0.28, 0.28, 0.84]) kbox(b, [hx, 0.09, 0.58], [0.16, 0.025, 0.08], p.stencil, p.hd);
    if (p.hd) for (const sx of [-1.08, 1.08]) orb(b, [sx, 0.72, 0.52], 0.044, p.alloy, p.hd);
  }
  root.animations = [new AnimationClip('Lift security bar', 2.8, [
    rotationTrack('SecurityBar', 'z', [0, 0.75, 1.9, 2.8], [0, 0.96, 0.96, 0]),
  ])];
}
