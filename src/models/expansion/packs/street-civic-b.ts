import type * as T from 'three';
import { AnimationClip } from 'three';
import {
  boltRing, collar, cyl, dome, fastener, gablePrism, glassMat, group, HPI, kbox, khose,
  kstrut, lampMat, matteMat, orb, pane, rotationTrack, shell, spinTrack, torus,
} from './street-civic-kit';
import type { Finish } from './street-civic-kit';

export function automatedTollBarrier(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'TollKiosk');
  shell(b, [-1.05, 0.07, 0], [1.06, 0.14, 0.84], p.edge, 0.18);
  for (const sz of [-0.28, 0.28]) {
    cyl(b, [-1.42, 0.36, sz], 0.045, 0.052, 0.52, p.dark, p.hd, 'y', 8);
    collar(b, [-1.42, 0.52, sz], 0.056, 0.018, 0.055, p.accent, p.hd);
  }
  shell(b, [-1.05, 0.18, 0], [0.64, 0.1, 0.62], p.dark, 0.14);
  shell(b, [-1.05, 0.72, 0], [0.56, 1.04, 0.54], p.primary, 0.14);
  shell(b, [-1.05, 1.27, 0], [0.62, 0.1, 0.6], p.dark, 0.16);
  shell(b, [-1.05, 0.88, 0.28], [0.34, 0.42, 0.055], p.dark, 0.16);
  kbox(b, [-1.05, 0.96, 0.315], [0.22, 0.14, 0.025], p.optic, p.hd);
  kbox(b, [-1.05, 0.78, 0.315], [0.2, 0.05, 0.025], p.accent, p.hd);
  const beacon = group(root, 'StatusBeacon', [-1.05, 1.32, 0]);
  const redGlow = lampMat('#ef4444');
  cyl(beacon, [0, 0.03, 0], 0.08, 0.09, 0.07, p.dark, p.hd, 'y', 10);
  cyl(beacon, [0, 0.12, 0], 0.068, 0.072, 0.14, redGlow, p.hd, 'y', 10);
  dome(beacon, [0, 0.19, 0], 0.068, 0.05, 0.068, redGlow, p.hd);
  const arm = group(root, 'BarrierArm', [-0.78, 0.94, 0.12]);
  cyl(arm, [0, 0, -0.06], 0.13, 0.13, 0.24, p.dark, p.hd, 'z', 12);
  cyl(arm, [0, 0, 0.07], 0.075, 0.075, 0.04, p.alloy, p.hd, 'z', 10);
  kbox(arm, [-0.26, 0, 0], [0.46, 0.08, 0.07], p.edge, p.hd);
  cyl(arm, [-0.46, 0, 0], 0.15, 0.15, 0.16, p.dark, p.hd, 'z', 12);
  kbox(arm, [1.14, 0, 0], [2.24, 0.065, 0.045], p.alloy, p.hd);
  for (let i = 0; i < 8; i++) {
    kbox(arm, [0.2 + i * 0.27, 0, 0], [0.255, 0.115, 0.078], i % 2 === 0 ? p.primary : p.accent, p.hd);
  }
  orb(arm, [2.26, 0, 0], 0.065, p.primary, p.hd);
  if (detail) {
    boltRing(b, [-1.05, 0.145, 0], 0.36, 4, p, 0.024);
    for (const y of [0.36, 0.44, 0.52]) kbox(b, [-1.05, y, -0.28], [0.34, 0.032, 0.024], p.dark, p.hd);
    if (p.hd) for (const x of [0.74, 1.28, 1.82]) orb(arm, [x, 0.08, 0], 0.028, lampMat('#ef4444'), p.hd);
  }
  root.animations = [new AnimationClip('Raise toll barrier', 3.2, [
    rotationTrack('BarrierArm', 'z', [0, 0.85, 2.2, 3.2], [0, 1.38, 1.38, 0]),
  ])];
}

export function parisianMorrisKiosk(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'MorrisShell');
  const glass = glassMat('#b7dde0', 0.24);
  cyl(b, [0, 0.07, 0], 0.64, 0.68, 0.14, p.dark, p.hd, 'y', 8);
  cyl(b, [0, 0.24, 0], 0.54, 0.58, 0.24, p.primary, p.hd, 'y', 8);
  collar(b, [0, 0.37, 0], 0.56, 0.06, 0.07, p.accent, p.hd);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const px = Math.cos(a) * 0.5;
    const pz = Math.sin(a) * 0.5;
    cyl(b, [px, 1.35, pz], 0.038, 0.044, 1.98, p.primary, p.hd, 'y', 8);
    cyl(b, [px, 0.44, pz], 0.054, 0.054, 0.07, p.accent, p.hd, 'y', 8);
    cyl(b, [px, 2.26, pz], 0.054, 0.054, 0.07, p.accent, p.hd, 'y', 8);
    const ma = a + Math.PI / 8;
    const gp = pane(b, [Math.cos(ma) * 0.465, 1.35, Math.sin(ma) * 0.465], [0.35, 1.76, 0.018], glass);
    gp.rotation.y = -ma + HPI;
  }
  cyl(b, [0, 2.38, 0], 0.64, 0.72, 0.16, p.primary, p.hd, 'y', 8);
  collar(b, [0, 2.31, 0], 0.71, 0.055, 0.07, p.accent, p.hd);
  dome(b, [0, 2.52, 0], 0.56, 0.44, 0.56, p.primary, p.hd);
  cyl(b, [0, 2.94, 0], 0.24, 0.32, 0.16, p.primary, p.hd, 'y', 8);
  collar(b, [0, 2.98, 0], 0.28, 0.04, 0.055, p.accent, p.hd);
  const pd = group(root, 'PosterDrum', [0, 1.35, 0]);
  cyl(pd, [0, 0, 0], 0.1, 0.1, 2.14, p.dark, p.hd, 'y', 8);
  cyl(pd, [0, 0, 0], 0.37, 0.37, 1.74, p.primary, p.hd, 'y', 8);
  const pMats = [p.stencil, p.accent, matteMat('#c95b42', 0.72), matteMat('#386994', 0.72)] as const;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    const poster = kbox(pd, [Math.cos(a) * 0.365, 0, Math.sin(a) * 0.365], [0.24, 1.48, 0.032], pMats[i % 4] ?? p.stencil, p.hd);
    poster.rotation.y = -a + HPI;
  }
  const cf = group(root, 'CupolaFinial', [0, 3.0, 0]);
  cyl(cf, [0, 0.06, 0], 0.12, 0.2, 0.12, p.accent, p.hd, 'y', 8);
  orb(cf, [0, 0.17, 0], 0.1, p.accent, p.hd);
  cyl(cf, [0, 0.34, 0], 0.016, 0.064, 0.28, p.accent, p.hd, 'y', 8);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      orb(b, [Math.cos(a) * 0.69, 2.26, Math.sin(a) * 0.69], 0.042, p.accent, p.hd);
      kstrut(b, [Math.cos(a) * 0.56, 2.48, Math.sin(a) * 0.56], [Math.cos(a) * 0.26, 2.94, Math.sin(a) * 0.26], 0.022, p.accent, p.hd);
    }
  }
  root.animations = [new AnimationClip('Rotate poster drum', 4.2, [spinTrack('PosterDrum', 'y', 4.2, 1)])];
}

export function smartEvFastCharger(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'ChargerTower');
  shell(b, [0, 0.07, 0], [1.06, 0.14, 0.88], p.edge, 0.16);
  for (const sx of [-1, 1]) {
    khose(b, [[sx * 0.44, 0.12, 0.32], [sx * 0.44, 0.44, 0.32], [sx * 0.26, 0.44, 0.32], [sx * 0.26, 0.12, 0.32]], 0.028, p.dark, p.hd);
  }
  shell(b, [0, 0.18, 0], [0.64, 0.14, 0.4], p.dark, 0.14);
  shell(b, [0, 1.13, 0], [0.74, 1.84, 0.48], p.primary, 0.22);
  shell(b, [0, 2.07, 0], [0.64, 0.09, 0.38], lampMat('#22d3ee', '#0ea5e9', 0.65), 0.22);
  for (const sx of [-0.38, 0.38]) kbox(b, [sx, 1.16, 0.12], [0.032, 1.56, 0.06], p.accent, p.hd);
  shell(b, [0, 1.34, 0.25], [0.48, 0.62, 0.055], p.dark, 0.14);
  kbox(b, [0, 1.44, 0.285], [0.36, 0.28, 0.025], p.optic, p.hd);
  kbox(b, [-0.1, 1.16, 0.285], [0.14, 0.12, 0.025], p.accent, p.hd);
  cyl(b, [0.14, 1.16, 0.29], 0.036, 0.036, 0.035, lampMat('#ef4444'), p.hd, 'z', 10);
  shell(b, [0.39, 1.08, 0.02], [0.09, 0.24, 0.18], p.dark, 0.18);
  khose(b, [[0.36, 0.96, -0.02], [0.49, 0.72, -0.06], [0.51, 0.98, 0.1], [0.42, 1.38, 0.04]], 0.026, p.tire, p.hd);
  const na = group(root, 'ChargeNozzleArm', [0.39, 1.4, 0.04]);
  orb(na, [0, 0, 0], 0.055, p.dark, p.hd);
  kstrut(na, [0, 0, 0], [0.1, 0.46, 0], 0.026, p.alloy, p.hd);
  khose(na, [[0.1, 0.46, 0], [0.24, 0.38, 0.04], [0.22, 0.08, 0.06]], 0.024, p.tire, p.hd);
  shell(na, [0.22, 0.02, 0.06], [0.09, 0.18, 0.14], p.dark, 0.2);
  kbox(na, [0.22, 0.06, 0.14], [0.068, 0.09, 0.08], p.accent, p.hd);
  cyl(na, [0.22, 0.04, 0.19], 0.03, 0.03, 0.06, p.alloy, p.hd, 'z', 8);
  const cv = group(root, 'CanopyVisor', [0, 1.88, 0.24]);
  shell(cv, [0, 0, 0.1], [0.64, 0.06, 0.32], p.dark, 0.16);
  kbox(cv, [0, 0, 0.27], [0.56, 0.036, 0.03], p.accent, p.hd);
  if (detail) {
    for (const y of [0.44, 0.54, 0.64, 0.74]) kbox(b, [-0.38, y, -0.04], [0.026, 0.042, 0.24], p.dark, p.hd);
    for (const sx of [-0.42, 0.42]) fastener(b, [sx, 0.145, -0.32], p, 0.024);
    if (p.hd) kbox(b, [0, 0.56, 0.25], [0.42, 0.12, 0.026], p.stencil, p.hd);
  }
  root.animations = [new AnimationClip('Present charge nozzle', 2.8, [
    rotationTrack('ChargeNozzleArm', 'z', [0, 0.75, 1.9, 2.8], [0, -0.92, -0.92, 0]),
  ])];
}

export function threeBinRecyclingBank(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'RecyclingBank');
  shell(b, [0, 0.06, 0], [2.16, 0.12, 0.8], p.dark, 0.14);
  const binMats = [matteMat('#2b6cb0', 0.62), matteMat('#2f855a', 0.62), p.accent] as const;
  const flapNames = ['PaperFlap', 'GlassFlap', 'MetalFlap'] as const;
  for (const dx of [-0.34, 0.34]) kbox(b, [dx, 0.58, 0], [0.1, 0.92, 0.58], p.edge, p.hd);
  for (let i = 0; i < 3; i++) {
    const cx = (i - 1) * 0.68;
    const bm = binMats[i] ?? p.accent;
    shell(b, [cx, 0.58, 0], [0.62, 0.94, 0.68], p.primary, 0.14);
    shell(b, [cx, 0.64, 0.35], [0.46, 0.56, 0.04], bm, 0.16);
    kbox(b, [cx, 0.72, 0.375], [0.24, 0.12, 0.022], p.stencil, p.hd);
    kbox(b, [cx, 0.72, -0.35], [0.44, 0.16, 0.03], bm, p.hd);
    shell(b, [cx, 1.07, 0], [0.64, 0.08, 0.7], bm, 0.16);
    shell(b, [cx, 1.19, -0.06], [0.6, 0.18, 0.54], p.dark, 0.16);
    kbox(b, [cx, 1.15, 0.22], [0.44, 0.11, 0.06], p.inset, p.hd);
    const fl = group(root, flapNames[i] ?? 'BinFlap', [cx, 1.21, 0.26]);
    shell(fl, [0, -0.06, 0.02], [0.42, 0.14, 0.038], p.alloy, 0.18);
    cyl(fl, [0, -0.11, 0.048], 0.015, 0.015, 0.28, p.dark, p.hd, 'x', 8);
  }
  const sh = group(root, 'SortingHeaderSign', [0, 1.28, -0.26]);
  for (const sx of [-0.68, 0.68]) cyl(sh, [sx, 0.08, 0], 0.032, 0.032, 0.22, p.alloy, p.hd, 'y', 8);
  shell(sh, [0, 0.22, 0], [1.96, 0.22, 0.055], p.dark, 0.14);
  kbox(sh, [0, 0.22, 0.035], [1.78, 0.14, 0.02], p.stencil, p.hd);
  if (detail) {
    for (const cx of [-0.68, 0, 0.68]) {
      kbox(b, [cx, 0.44, 0.378], [0.16, 0.045, 0.018], p.dark, p.hd);
      if (p.hd) fastener(b, [cx + 0.22, 0.22, 0.36], p, 0.022).rotation.x = HPI;
    }
  }
  root.animations = [new AnimationClip('Cycle sorting flaps', 3.0, [
    rotationTrack('PaperFlap', 'x', [0, 0.55, 1.2, 3.0], [0, -0.92, 0, 0]),
    rotationTrack('GlassFlap', 'x', [0, 0.45, 1.1, 1.9, 3.0], [0, -0.35, -0.92, 0, 0]),
    rotationTrack('MetalFlap', 'x', [0, 0.6, 1.6, 2.3, 3.0], [0, -0.22, -0.92, 0, 0]),
  ])];
}

export function parkBenchLamp(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'BenchAndLamp');
  shell(b, [0, 0.04, 0], [2.38, 0.08, 0.92], p.edge, 0.14);
  for (const fx of [-0.96, -0.28, 0.4]) {
    kstrut(b, [fx, 0.07, 0.24], [fx, 0.46, 0.22], 0.032, p.primary, p.hd);
    kstrut(b, [fx, 0.07, -0.24], [fx, 0.46, -0.2], 0.032, p.primary, p.hd);
    kstrut(b, [fx, 0.44, -0.22], [fx, 0.44, 0.24], 0.028, p.primary, p.hd);
    kstrut(b, [fx, 0.44, -0.2], [fx, 0.98, -0.32], 0.028, p.primary, p.hd);
    kstrut(b, [fx, 0.22, -0.22], [fx, 0.22, 0.22], 0.02, p.dark, p.hd);
    if (fx !== -0.28) {
      kstrut(b, [fx, 0.44, 0.22], [fx, 0.66, 0.18], 0.024, p.primary, p.hd);
      kstrut(b, [fx, 0.66, 0.18], [fx, 0.66, -0.24], 0.024, p.primary, p.hd);
      torus(b, [fx, 0.56, 0.14], 0.075, 0.016, p.primary, p.hd).rotation.y = HPI;
    }
  }
  for (const sz of [-0.14, -0.02, 0.1, 0.22]) kbox(b, [-0.28, 0.475, sz], [1.52, 0.042, 0.095], p.accent, p.hd);
  for (const [by, bz] of [[0.66, -0.23], [0.79, -0.26], [0.92, -0.29]] as const) {
    kbox(b, [-0.28, by, bz], [1.52, 0.095, 0.042], p.accent, p.hd).rotation.x = -0.22;
  }
  cyl(b, [0.9, 0.24, -0.06], 0.14, 0.2, 0.34, p.primary, p.hd, 'y', 8);
  collar(b, [0.9, 0.42, -0.06], 0.17, 0.04, 0.07, p.dark, p.hd);
  cyl(b, [0.9, 1.56, -0.06], 0.056, 0.1, 2.34, p.primary, p.hd, 'y', 10);
  collar(b, [0.9, 2.66, -0.06], 0.11, 0.036, 0.065, p.accent, p.hd);
  orb(b, [0.9, 2.84, -0.06], 0.065, p.accent, p.hd);
  khose(b, [[0.9, 2.68, -0.06], [0.84, 2.94, -0.06], [0.56, 2.96, -0.06], [0.5, 2.86, -0.06]], 0.032, p.primary, p.hd);
  torus(b, [0.76, 2.76, -0.06], 0.1, 0.016, p.primary, p.hd);
  const lh = group(root, 'LanternHead', [0.5, 2.85, -0.06]);
  cyl(lh, [0, -0.05, 0], 0.02, 0.02, 0.12, p.dark, p.hd, 'y', 8);
  cyl(lh, [0, -0.14, 0], 0.05, 0.2, 0.14, p.primary, p.hd, 'y', 6);
  cyl(lh, [0, -0.34, 0], 0.15, 0.11, 0.28, glassMat('#fff3c4', 0.34), p.hd, 'y', 6).castShadow = false;
  orb(lh, [0, -0.33, 0], 0.068, lampMat('#ffd166', '#ffb703', 0.75), p.hd);
  cyl(lh, [0, -0.5, 0], 0.12, 0.04, 0.09, p.dark, p.hd, 'y', 6);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4;
    kstrut(lh, [Math.cos(a) * 0.16, -0.19, Math.sin(a) * 0.16], [Math.cos(a) * 0.12, -0.47, Math.sin(a) * 0.12], 0.014, p.primary, p.hd);
  }
  const lc = group(root, 'LampCrossbar', [0.9, 2.3, -0.06]);
  cyl(lc, [0, 0, 0], 0.024, 0.024, 0.56, p.primary, p.hd, 'x', 8);
  for (const sx of [-0.29, 0.29]) orb(lc, [sx, 0, 0], 0.042, p.accent, p.hd);
  if (detail) {
    for (const fx of [-0.96, -0.28, 0.4]) for (const sz of [-0.14, 0.22]) fastener(b, [fx, 0.5, sz], p, 0.018);
    if (p.hd) boltRing(b, [0.9, 0.085, -0.06], 0.22, 6, p, 0.02);
  }
  root.animations = [new AnimationClip('Sway park lantern', 2.8, [
    rotationTrack('LanternHead', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.34, 0, -0.34, 0]),
  ])];
}

export function crosswalkSignalBollard(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'BollardBody');
  shell(b, [0, 0.045, 0], [0.72, 0.09, 0.72], p.edge, 0.22);
  cyl(b, [0, 0.13, 0], 0.19, 0.22, 0.1, p.dark, p.hd, 'y', 8);
  shell(b, [0, 0.66, 0], [0.28, 1.0, 0.28], p.primary, 0.28);
  collar(b, [0, 1.04, 0], 0.172, 0.032, 0.09, p.accent, p.hd);
  collar(b, [0, 0.93, 0], 0.168, 0.028, 0.055, p.stencil, p.hd);
  for (const sx of [-0.145, 0.145]) kbox(b, [sx, 0.58, 0], [0.024, 0.54, 0.07], p.optic, p.hd);
  shell(b, [0, 0.72, 0.155], [0.2, 0.3, 0.06], p.accent, 0.18);
  cyl(b, [0, 0.67, 0.19], 0.058, 0.062, 0.024, p.dark, p.hd, 'z', 10);
  orb(b, [0, 0.67, 0.205], 0.04, p.alloy, p.hd, [1, 1, 0.55]);
  kbox(b, [0, 0.8, 0.192], [0.13, 0.045, 0.02], lampMat('#ef4444'), p.hd);
  const wb = group(root, 'WarningBeacon', [0, 1.15, 0]);
  cyl(wb, [0, 0.03, 0], 0.14, 0.15, 0.08, p.dark, p.hd, 'y', 10);
  cyl(wb, [0, 0.13, 0], 0.115, 0.125, 0.15, glassMat('#fde68a', 0.34), p.hd, 'y', 12).castShadow = false;
  orb(wb, [0, 0.13, 0], 0.055, lampMat('#f59e0b', '#f59e0b', 0.75), p.hd);
  kbox(wb, [0, 0.13, -0.055], [0.1, 0.11, 0.025], p.alloy, p.hd);
  cyl(wb, [0, 0.215, 0], 0.125, 0.125, 0.035, p.accent, p.hd, 'y', 10);
  dome(wb, [0, 0.23, 0], 0.11, 0.05, 0.11, p.dark, p.hd);
  const sh = group(root, 'TactileSignHood', [0, 0.9, 0.15]);
  kbox(sh, [0, 0, 0.02], [0.22, 0.12, 0.035], p.dark, p.hd);
  kbox(sh, [0, 0, 0.042], [0.16, 0.07, 0.018], p.stencil, p.hd);
  if (detail) {
    boltRing(b, [0, 0.18, 0], 0.17, 4, p, 0.022);
    kbox(b, [0, 0.44, -0.145], [0.16, 0.34, 0.024], p.dark, p.hd);
    if (p.hd) for (const sx of [-0.08, 0.08]) fastener(b, [sx, 0.59, 0.19], p, 0.018).rotation.x = HPI;
  }
  root.animations = [new AnimationClip('Spin warning beacon', 2.2, [spinTrack('WarningBeacon', 'y', 2.2, 1)])];
}

export function harborMooringBollard(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'QuayBollard');
  shell(b, [0, 0.12, 0], [1.08, 0.24, 0.96], matteMat('#7e827d', 0.88), 0.14);
  kbox(b, [0, 0.22, 0.485], [0.92, 0.045, 0.03], p.dark, p.hd);
  cyl(b, [-0.1, 0.28, 0], 0.25, 0.28, 0.11, p.dark, p.hd, 'y', 10);
  cyl(b, [-0.1, 0.56, 0], 0.18, 0.15, 0.48, p.primary, p.hd, 'y', 12);
  collar(b, [-0.1, 0.78, 0], 0.22, 0.05, 0.06, p.primary, p.hd);
  dome(b, [-0.1, 0.84, 0], 0.26, 0.14, 0.24, p.primary, p.hd);
  cyl(b, [-0.1, 0.84, 0], 0.11, 0.11, 0.62, p.primary, p.hd, 'x', 10);
  for (const hx of [-0.41, 0.21]) orb(b, [hx, 0.84, 0], 0.115, p.primary, p.hd);
  for (const ry of [0.42, 0.5, 0.58]) torus(b, [-0.1, ry, 0], 0.195, 0.042, p.accent, p.hd).rotation.x = HPI;
  kbox(b, [-0.1, 0.175, 0.475], [0.14, 0.12, 0.045], p.dark, p.hd);
  torus(b, [-0.1, 0.175, 0.505], 0.042, 0.015, p.alloy, p.hd);
  const mr = group(root, 'MooringRing', [-0.1, 0.175, 0.5]);
  torus(mr, [0, -0.065, 0.03], 0.068, 0.018, p.alloy, p.hd);
  const rc = group(root, 'RopeCoil', [0.32, 0.24, 0.14]);
  for (let k = 0; k < 3; k++) torus(rc, [0, 0.036 + k * 0.055, 0], 0.15 - k * 0.015, 0.034, p.accent, p.hd).rotation.x = HPI;
  khose(rc, [[-0.08, 0.08, 0.04], [-0.22, 0.16, -0.06], [-0.36, 0.2, -0.1]], 0.03, p.accent, p.hd);
  if (detail) {
    boltRing(b, [-0.1, 0.335, 0], 0.23, 6, p, 0.022);
    for (const sx of [-0.48, 0.48]) kbox(b, [sx, 0.12, 0.485], [0.06, 0.22, 0.03], p.dark, p.hd);
    if (p.hd) fastener(b, [-0.1, 0.985, 0], p, 0.028);
  }
  root.animations = [new AnimationClip('Swing mooring ring', 2.4, [
    rotationTrack('MooringRing', 'x', [0, 0.6, 1.5, 2.4], [0, -1.18, -1.18, 0]),
  ])];
}

export function metroTicketTurnstile(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'FareGate');
  const acrylic = glassMat('#7cc6f2', 0.36);
  shell(b, [0, 0.03, 0], [1.54, 0.06, 1.44], p.dark, 0.08);
  const goLed = lampMat('#22c55e');
  for (const sx of [-1, 1]) {
    const cx = sx * 0.56;
    shell(b, [cx, 0.54, 0], [0.34, 0.96, 1.06], p.primary, 0.14);
    for (const sz of [-0.52, 0.52]) cyl(b, [cx, 0.54, sz], 0.165, 0.165, 0.96, p.primary, p.hd, 'y', 12);
    shell(b, [cx, 1.02, 0], [0.3, 0.065, 1.24], p.dark, 0.18);
    kbox(b, [cx, 0.16, 0], [0.36, 0.1, 0.98], p.accent, p.hd);
    kbox(b, [cx, 1.06, 0.44], [0.22, 0.04, 0.24], p.inset, p.hd);
    kbox(b, [cx, 1.085, 0.44], [0.15, 0.022, 0.16], p.optic, p.hd);
    cyl(b, [cx, 0.76, 0.675], 0.062, 0.062, 0.035, goLed, p.hd, 'z', 10);
  }
  for (const [name, sx] of [['LeftPaddle', -1], ['RightPaddle', 1]] as const) {
    const pad = group(root, name, [sx * 0.38, 0.62, 0.08]);
    cyl(pad, [0, 0, 0], 0.035, 0.035, 0.44, p.alloy, p.hd, 'y', 10);
    pane(pad, [-sx * 0.18, 0, 0], [0.34, 0.46, 0.024], acrylic);
    kbox(pad, [-sx * 0.19, 0.02, 0], [0.28, 0.09, 0.034], p.accent, p.hd);
  }
  const th = group(root, 'TripodHub', [-0.38, 0.76, -0.34]);
  cyl(th, [0, 0, 0], 0.075, 0.075, 0.1, p.dark, p.hd, 'x', 10);
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3;
    kstrut(th, [0.02, 0, 0], [0.42, Math.cos(a) * 0.26, Math.sin(a) * 0.26], 0.022, p.alloy, p.hd);
  }
  const cr = group(root, 'CardReaderHood', [0.56, 1.06, -0.32]);
  shell(cr, [0, 0.1, 0], [0.22, 0.2, 0.22], p.dark, 0.16);
  kbox(cr, [0, 0.12, 0.115], [0.14, 0.1, 0.025], p.optic, p.hd);
  if (detail) {
    for (const sx of [-1, 1]) {
      for (const z of [-0.3, 0, 0.3]) kbox(b, [sx * 0.74, 0.64, z], [0.024, 0.36, 0.18], p.edge, p.hd);
      if (p.hd) fastener(b, [sx * 0.56, 1.06, -0.52], p, 0.022);
    }
  }
  root.animations = [new AnimationClip('Open fare paddles', 2.8, [
    rotationTrack('LeftPaddle', 'y', [0, 0.7, 1.9, 2.8], [0, 1.32, 1.32, 0]),
    rotationTrack('RightPaddle', 'y', [0, 0.7, 1.9, 2.8], [0, -1.32, -1.32, 0]),
    spinTrack('TripodHub', 'x', 2.8, 1),
  ])];
}

export function solarTrashCompactor(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'CompactorBin');
  shell(b, [0, 0.04, 0], [0.84, 0.08, 0.86], p.edge, 0.16);
  shell(b, [0, 0.62, 0], [0.72, 1.08, 0.74], p.primary, 0.12);
  for (const sx of [-0.355, 0.355]) for (const sz of [-0.365, 0.365]) kbox(b, [sx, 0.62, sz], [0.065, 1.04, 0.065], p.dark, p.hd);
  for (const sx of [-1, 1]) {
    kbox(b, [sx * 0.37, 0.6, 0], [0.03, 0.64, 0.48], p.accent, p.hd);
    kbox(b, [sx * 0.39, 0.6, 0], [0.02, 0.46, 0.34], p.stencil, p.hd);
  }
  kbox(b, [0, 1.06, 0.375], [0.52, 0.09, 0.035], p.dark, p.hd);
  cyl(b, [0.18, 1.06, 0.398], 0.024, 0.024, 0.02, lampMat('#22c55e'), p.hd, 'z', 8);
  kbox(b, [0, 0.8, 0.365], [0.5, 0.28, 0.04], p.inset, p.hd);
  shell(b, [0, 1.22, -0.02], [0.76, 0.18, 0.78], p.dark, 0.16);
  const sp = group(root, 'SolarPanelArray', [0, 1.32, -0.02]);
  sp.rotation.x = 0.2;
  shell(sp, [0, 0.03, 0], [0.68, 0.06, 0.66], p.alloy, 0.12);
  kbox(sp, [0, 0.068, 0], [0.6, 0.026, 0.58], matteMat('#1a365d', 0.24, 0.36), p.hd);
  for (const gx of [-0.15, 0, 0.15]) kbox(sp, [gx, 0.085, 0], [0.016, 0.012, 0.58], p.alloy, p.hd);
  const hc = group(root, 'HopperChute', [0, 0.68, 0.38]);
  shell(hc, [0, 0.13, 0.02], [0.48, 0.28, 0.055], p.primary, 0.16);
  kbox(hc, [0, 0.21, 0.055], [0.4, 0.07, 0.028], p.accent, p.hd);
  cyl(hc, [0, 0.21, 0.105], 0.018, 0.018, 0.36, p.alloy, p.hd, 'x', 8);
  for (const sx of [-0.14, 0.14]) kstrut(hc, [sx, 0.21, 0.04], [sx, 0.21, 0.105], 0.014, p.alloy, p.hd);
  const fp = group(root, 'FootPedal', [0, 0.13, 0.36]);
  for (const sx of [-0.11, 0.11]) kstrut(fp, [sx, 0, -0.04], [sx, 0, 0.12], 0.018, p.dark, p.hd);
  shell(fp, [0, 0.01, 0.12], [0.3, 0.04, 0.09], p.accent, 0.2);
  if (detail) {
    for (const sx of [-0.34, 0.34]) for (const sz of [-0.34, 0.34]) fastener(b, [sx, 0.085, sz], p, 0.022);
    for (const y of [0.36, 0.46, 0.56]) kbox(b, [0, y, -0.385], [0.44, 0.035, 0.024], p.dark, p.hd);
    if (p.hd) for (const gz of [-0.15, 0, 0.15]) kbox(sp, [0, 0.085, gz], [0.6, 0.012, 0.016], p.alloy, p.hd);
  }
  root.animations = [new AnimationClip('Pull hopper chute', 2.8, [
    rotationTrack('HopperChute', 'x', [0, 0.7, 1.85, 2.8], [0, 0.85, 0.85, 0]),
    rotationTrack('FootPedal', 'x', [0, 0.7, 1.85, 2.8], [0, 0.36, 0.36, 0]),
  ])];
}

export function townNoticeBoard(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'NoticeFrame');
  const glass = glassMat('#b0dde4', 0.25);
  shell(b, [0, 0.05, 0], [2.1, 0.1, 0.88], p.edge, 0.14);
  for (const sx of [-1, 1]) {
    shell(b, [sx * 0.86, 0.15, 0], [0.22, 0.14, 0.22], p.dark, 0.16);
    kbox(b, [sx * 0.86, 1.09, 0], [0.14, 1.96, 0.14], p.primary, p.hd);
    kstrut(b, [sx * 0.86, 0.6, 0], [sx * 0.56, 0.92, 0], 0.036, p.primary, p.hd);
    gablePrism(b, [sx * 0.86, 1.96, 0], 0.78, 0.38, 0.12, p.primary, p.hd).rotation.y = HPI;
  }
  kbox(b, [0, 0.44, 0], [1.66, 0.1, 0.1], p.primary, p.hd);
  kbox(b, [0, 1.41, -0.07], [1.66, 1.06, 0.12], p.primary, p.hd);
  for (const y of [0.92, 1.9]) kbox(b, [0, y, 0.02], [1.66, 0.09, 0.24], p.primary, p.hd);
  for (const x of [-0.78, 0, 0.78]) kbox(b, [x, 1.41, 0.02], [0.09, 0.96, 0.24], p.primary, p.hd);
  kbox(b, [0, 1.41, 0.005], [1.46, 0.86, 0.032], p.accent, p.hd);
  kbox(b, [0, 2.34, 0], [2.22, 0.1, 0.1], p.dark, p.hd);
  for (const sz of [-1, 1]) kbox(b, [0, 2.16, sz * 0.24], [2.1, 0.065, 0.64], p.accent, p.hd).rotation.x = sz * 0.66;
  kbox(b, [0, 1.94, 0.15], [1.24, 0.13, 0.04], p.dark, p.hd);
  kbox(b, [0, 1.94, 0.175], [1.06, 0.075, 0.02], p.stencil, p.hd);
  const fl = group(root, 'CommunityFlyers', [0, 1.41, 0.032]);
  const fMats = [p.stencil, matteMat('#e0c36e', 0.8), matteMat('#6ba3be', 0.8), matteMat('#d97966', 0.8)] as const;
  const flyers: readonly [number, number, number, number, number][] = [
    [-0.54, 0.18, 0.24, 0.3, 0], [-0.22, 0.12, 0.22, 0.28, 1], [-0.42, -0.18, 0.34, 0.24, 2],
    [0.24, 0.16, 0.26, 0.3, 3], [0.54, 0.1, 0.22, 0.26, 0], [0.38, -0.18, 0.32, 0.24, 1],
  ];
  for (const [fx, fy, fw, fh, mi] of flyers) {
    kbox(fl, [fx, fy, 0], [fw, fh, 0.022], fMats[mi] ?? p.stencil, p.hd);
    orb(fl, [fx, fy + fh * 0.4, 0.018], 0.014, p.alloy, p.hd);
  }
  for (const [name, sx] of [['LeftDoor', -1], ['RightDoor', 1]] as const) {
    const door = group(root, name, [sx * 0.76, 1.41, 0.13]);
    const dir = -sx;
    kbox(door, [dir * 0.03, 0, 0], [0.06, 0.9, 0.05], p.primary, p.hd);
    kbox(door, [dir * 0.71, 0, 0], [0.06, 0.9, 0.05], p.primary, p.hd);
    for (const dy of [-0.42, 0.42]) kbox(door, [dir * 0.37, dy, 0], [0.74, 0.06, 0.05], p.primary, p.hd);
    pane(door, [dir * 0.37, 0, 0], [0.62, 0.78, 0.018], glass);
    orb(door, [dir * 0.69, 0, 0.045], 0.026, p.alloy, p.hd);
  }
  if (detail) {
    for (const sx of [-0.86, 0.86]) for (const sz of [-0.28, 0.28]) fastener(b, [sx, 0.105, sz], p, 0.024);
    for (const x of [-0.72, -0.24, 0.24, 0.72]) kbox(b, [x, 2.38, 0], [0.06, 0.04, 0.12], p.dark, p.hd);
    if (p.hd) for (const sx of [-0.76, 0.76]) for (const dy of [1.14, 1.68]) cyl(b, [sx, dy, 0.145], 0.018, 0.018, 0.07, p.dark, p.hd, 'y', 8);
  }
  root.animations = [new AnimationClip('Open notice doors', 3.0, [
    rotationTrack('LeftDoor', 'y', [0, 0.8, 2.1, 3.0], [0, -1.35, -1.35, 0]),
    rotationTrack('RightDoor', 'y', [0, 0.8, 2.1, 3.0], [0, 1.35, 1.35, 0]),
  ])];
}
