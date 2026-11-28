import * as T from 'three';
import {
  addCradleStand, addDockStand, addPedestalStand, band, box, cone, cyl, fastener, group, hose,
  HPI, orb, ring, rotationTrack, shell, slideTrack, spinTrack, strut, torus, tube, type Finish,
} from './handheld-fantasy-scifi-kit';

export function buildPulsePlasmaRifle(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'RifleCradle');
  addCradleStand(stand, p, detail, {
    w: 0.72, d: 1.18, baseH: 0.12, postH: 0.42, span: 0.34, axis: 'z',
    baseMat: p.dark, postMat: p.edge, trimMat: p.accent,
  });
  const rf = group(root, 'PlasmaRifle');
  shell(rf, [0, 0.64, -0.02], [0.16, 0.24, 0.86], p.primary, 0.24);
  shell(rf, [0, 0.61, -0.5], [0.14, 0.26, 0.22], p.dark, 0.24);
  shell(rf, [0, 0.61, -0.61], [0.13, 0.24, 0.055], p.tire, 0.26);
  shell(rf, [0, 0.46, 0.06], [0.095, 0.24, 0.12], p.tire, 0.28).rotation.x = -0.26;
  hose(rf, [[0, 0.37, 0.08], [0, 0.38, 0.22], [0, 0.54, 0.24]], 0.018, p.dark, p.hd);
  shell(rf, [0, 0.66, 0.46], [0.15, 0.18, 0.42], p.edge, 0.24);
  shell(rf, [0, 0.71, 0.7], [0.09, 0.055, 0.24], p.primary, 0.2);
  shell(rf, [0, 0.61, 0.7], [0.09, 0.055, 0.24], p.primary, 0.2);
  cyl(rf, [0, 0.66, 0.56], 0.036, 0.036, 0.44, p.optic, 'z', 14);
  for (const cz of [0.36, 0.46, 0.56]) band(rf, [0, 0.66, cz], 0.088, 0.018, 0.035, p.accent, 'z');
  shell(rf, [0, 0.78, 0.08], [0.08, 0.05, 0.56], p.dark, 0.2);
  shell(rf, [0, 0.88, 0.08], [0.11, 0.12, 0.28], p.dark, 0.24);
  cyl(rf, [0, 0.88, 0.08], 0.044, 0.044, 0.31, p.optic, 'z', 14);
  shell(rf, [0, 0.945, 0.08], [0.075, 0.035, 0.16], p.accent, 0.24);
  const bt = group(root, 'PlasmaBolt', [0.095, 0.7, 0.22]);
  shell(bt, [-0.005, 0, 0], [0.055, 0.068, 0.2], p.alloy, 0.24);
  cyl(bt, [0.045, 0, 0.04], 0.022, 0.022, 0.09, p.accent, 'x', 10);
  orb(bt, [0.09, 0, 0.04], 0.028, p.dark, p.hd);
  const mg = group(root, 'PowerMag', [0, 0.46, -0.28]);
  shell(mg, [0, 0, 0], [0.11, 0.24, 0.16], p.dark, 0.22);
  shell(mg, [0, -0.02, 0], [0.132, 0.14, 0.09], p.accent, 0.24);
  shell(mg, [0, -0.02, 0], [0.148, 0.08, 0.05], p.optic, 0.2);
  shell(mg, [0, -0.125, 0], [0.125, 0.045, 0.18], p.edge, 0.24);
  if (detail) {
    hose(rf, [[-0.08, 0.62, -0.18], [-0.14, 0.66, 0.06], [-0.09, 0.66, 0.3]], 0.018, p.accent, p.hd);
    if (p.hd) for (const sz of [-0.16, 0.14]) fastener(rf, [0.085, 0.6, sz], p, 0.018).rotation.z = -HPI;
  }
  root.animations = [
    new T.AnimationClip('Cycle plasma bolt', 2.4, [slideTrack('PlasmaBolt', [0.095, 0.7, 0.22], 2, [0, 0.65, 1.5, 2.4], [0, -0.18, -0.18, 0])]),
  ];
}

export function buildHandheldBioScanner(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'BioCradle');
  addDockStand(stand, p, detail, 0.78, 0.78, 0.12, 0.24);
  const sc = group(root, 'ScannerBody');
  shell(sc, [0, 0.44, -0.06], [0.2, 0.3, 0.22], p.tire, 0.32);
  shell(sc, [0, 0.32, -0.06], [0.24, 0.08, 0.26], p.accent, 0.28);
  shell(sc, [0, 0.68, 0.02], [0.42, 0.32, 0.44], p.primary, 0.28);
  for (const sx of [-0.215, 0.215]) shell(sc, [sx, 0.68, 0.02], [0.055, 0.18, 0.32], p.accent, 0.26);
  shell(sc, [0, 0.842, 0.04], [0.3, 0.052, 0.24], p.dark, 0.2);
  shell(sc, [0, 0.862, 0.04], [0.24, 0.036, 0.18], p.optic, 0.18);
  const hd = group(root, 'ScannerHead', [0, 0.68, 0.24]);
  cyl(hd, [0, 0, 0.05], 0.115, 0.125, 0.16, p.primary, 'z', 16);
  band(hd, [0, 0, 0.12], 0.125, 0.025, 0.048, p.accent, 'z');
  orb(hd, [0, 0, 0.12], 0.086, p.optic, p.hd, [1, 1, 0.65]);
  for (const sx of [-0.115, 0.115]) cyl(hd, [sx, 0, 0.07], 0.032, 0.036, 0.12, p.alloy, 'z', 10);
  const fin = group(root, 'SensorFin', [0, 0.84, -0.16]);
  cyl(fin, [0, 0, 0], 0.03, 0.03, 0.24, p.alloy, 'x', 10);
  shell(fin, [0, 0.045, 0.1], [0.22, 0.048, 0.24], p.primary, 0.28);
  shell(fin, [0, 0.068, 0.14], [0.16, 0.032, 0.09], p.accent, 0.24);
  orb(fin, [0, 0.078, 0.14], 0.028, p.optic, p.hd);
  if (detail) {
    for (const bx of [-0.08, 0, 0.08]) box(sc, [bx, 0.85, 0.195], [0.048, 0.026, 0.04], p.accent);
    if (p.hd) for (const sx of [-0.15, 0.15]) fastener(sc, [sx, 0.68, -0.205], p, 0.018).rotation.x = -HPI;
  }
  root.animations = [
    new T.AnimationClip('Sweep scanner head', 2.8, [rotationTrack('ScannerHead', 'y', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.72, 0, -0.72, 0])]),
    new T.AnimationClip('Flip sensor fin', 2.6, [rotationTrack('SensorFin', 'x', [0, 0.7, 1.8, 2.6], [0, -1.25, -1.25, 0])]),
  ];
}

export function buildGrapplingHookLauncher(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'LauncherDock');
  addCradleStand(stand, p, detail, {
    w: 0.78, d: 1, baseH: 0.12, postH: 0.42, span: 0.28, axis: 'z',
    baseMat: p.dark, postMat: p.edge, trimMat: p.accent,
  });
  const ln = group(root, 'LauncherBody');
  shell(ln, [0, 0.64, -0.02], [0.22, 0.24, 0.7], p.primary, 0.24);
  for (const sx of [-0.115, 0.115]) shell(ln, [sx, 0.66, 0.06], [0.042, 0.09, 0.44], p.accent, 0.22);
  shell(ln, [0, 0.45, -0.22], [0.1, 0.24, 0.13], p.tire, 0.28).rotation.x = -0.22;
  hose(ln, [[0, 0.35, -0.2], [0, 0.36, -0.06], [0, 0.54, -0.04]], 0.018, p.accent, p.hd);
  cyl(ln, [0, 0.66, 0.42], 0.092, 0.105, 0.34, p.edge, 'z', 16);
  band(ln, [0, 0.66, 0.56], 0.112, 0.024, 0.06, p.accent, 'z');
  cyl(ln, [0, 0.5, 0.26], 0.056, 0.056, 0.36, p.alloy, 'z', 14);
  orb(ln, [0, 0.5, 0.44], 0.056, p.dark, p.hd);
  shell(ln, [0, 0.8, 0.06], [0.1, 0.09, 0.24], p.dark, 0.22);
  cyl(ln, [0, 0.8, 0.06], 0.032, 0.032, 0.27, p.optic, 'z', 12);
  const dr = group(root, 'CableDrum', [0.18, 0.62, -0.06]);
  cyl(dr, [0, 0, 0], 0.042, 0.042, 0.2, p.alloy, 'x', 12);
  cyl(dr, [0.02, 0, 0], 0.11, 0.11, 0.11, p.tire, 'x', 16);
  for (const fx of [-0.04, 0.08]) cyl(dr, [fx, 0, 0], 0.155, 0.155, 0.024, p.accent, 'x', 16);
  box(dr, [0.095, 0, 0], [0.024, 0.24, 0.032], p.dark);
  box(dr, [0.095, 0, 0], [0.024, 0.032, 0.24], p.dark);
  const cl = group(root, 'GrappleClaw', [0, 0.66, 0.56]);
  cyl(cl, [0, 0, -0.06], 0.034, 0.034, 0.36, p.alloy, 'z', 12);
  cyl(cl, [0, 0, 0.12], 0.068, 0.054, 0.1, p.dark, 'z', 12);
  cone(cl, [0, 0, 0.21], 0.058, 0.12, p.accent, p.hd, 10).rotation.x = HPI;
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4;
    const ca = Math.cos(a), sa = Math.sin(a);
    hose(cl, [[ca * 0.05, sa * 0.05, 0.13], [ca * 0.16, sa * 0.16, 0.16], [ca * 0.21, sa * 0.21, 0.05]], 0.018, p.alloy, p.hd);
    orb(cl, [ca * 0.21, sa * 0.21, 0.05], 0.024, p.accent, p.hd);
  }
  if (detail) {
    hose(ln, [[-0.1, 0.62, -0.18], [-0.15, 0.6, 0.08], [-0.08, 0.64, 0.32]], 0.018, p.tire, p.hd);
    if (p.hd) for (const sz of [-0.2, 0.18]) fastener(ln, [-0.115, 0.58, sz], p, 0.018).rotation.z = HPI;
  }
  root.animations = [
    new T.AnimationClip('Winch cable drum', 2.4, [spinTrack('CableDrum', 'x', 2.4, 2)]),
    new T.AnimationClip('Launch grapple claw', 2.6, [slideTrack('GrappleClaw', [0, 0.66, 0.56], 2, [0, 0.7, 1.75, 2.6], [0, 0.28, 0.28, 0])]),
  ];
}

export function buildCryoFreezeBlaster(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'CryoStand');
  addCradleStand(stand, p, detail, {
    w: 0.76, d: 1.06, baseH: 0.12, postH: 0.42, span: 0.3, axis: 'z',
    baseMat: p.dark, postMat: p.edge, trimMat: p.accent,
  });
  const cb = group(root, 'CryoBlaster');
  shell(cb, [0, 0.64, -0.06], [0.22, 0.24, 0.66], p.primary, 0.26);
  shell(cb, [0, 0.45, -0.24], [0.095, 0.22, 0.12], p.tire, 0.28).rotation.x = -0.24;
  cyl(cb, [0, 0.66, 0.38], 0.068, 0.074, 0.44, p.edge, 'z', 14);
  for (const [idx, fz] of ([0.24, 0.33, 0.42, 0.51] as const).entries()) {
    band(cb, [0, 0.66, fz], 0.128, 0.048, 0.032, idx % 2 === 1 ? p.accent : p.alloy, 'z');
  }
  for (const sx of [-0.12, 0.12]) {
    hose(cb, [[sx, 0.68, -0.24], [sx * 1.48, 0.74, 0.02], [sx * 0.9, 0.68, 0.28]], 0.02, p.accent, p.hd);
  }
  const nz = group(root, 'CryoNozzle', [0, 0.66, 0.6]);
  cyl(nz, [0, 0, -0.03], 0.052, 0.052, 0.12, p.alloy, 'z', 12);
  band(nz, [0, 0, 0.06], 0.142, 0.028, 0.09, p.primary, 'z');
  orb(nz, [0, 0, 0.04], 0.062, p.optic, p.hd, [1, 1, 1.35]);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    const vane = shell(nz, [Math.cos(a) * 0.088, Math.sin(a) * 0.088, 0.06], [0.09, 0.024, 0.068], p.accent, 0.24);
    vane.rotation.z = a + 0.35;
  }
  const tk = group(root, 'CryoTank', [0, 0.87, -0.1]);
  shell(tk, [0, -0.1, 0], [0.14, 0.07, 0.26], p.dark, 0.22);
  cyl(tk, [0, 0, 0], 0.105, 0.105, 0.38, p.accent, 'z', 16);
  for (const sz of [-0.19, 0.19]) orb(tk, [0, 0, sz], 0.105, p.primary, p.hd);
  for (const sz of [-0.1, 0.1]) band(tk, [0, 0, sz], 0.114, 0.018, 0.032, p.alloy, 'z');
  orb(tk, [0, 0.108, 0.04], 0.04, p.optic, p.hd);
  if (detail) {
    cyl(cb, [0, 0.64, -0.4], 0.062, 0.062, 0.036, p.optic, 'z', 14);
    if (p.hd) for (const sx of [-0.115, 0.115]) fastener(cb, [sx, 0.58, -0.12], p, 0.018).rotation.z = sx > 0 ? -HPI : HPI;
  }
  root.animations = [
    new T.AnimationClip('Spin cryo nozzle', 2.2, [spinTrack('CryoNozzle', 'z', 2.2, 2)]),
  ];
}

export function buildTwinEnergyBlade(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'AltarCradle');
  shell(stand, [0, 0.07, 0], [1.12, 0.14, 0.72], p.dark, 0.26);
  shell(stand, [0, 0.18, 0], [0.76, 0.12, 0.48], p.edge, 0.28);
  tube(stand, [0, 0.42, 0], 0.11, 0.15, 0.42, p.primary, 12);
  ring(stand, [0, 0.61, 0], 0.135, 0.026, 0.046, p.accent);
  const eh = group(root, 'EnergyHilt', [0, 0.68, 0]);
  shell(eh, [0, -0.045, 0], [0.24, 0.1, 0.16], p.edge, 0.24);
  cyl(eh, [0, 0, 0], 0.056, 0.056, 0.68, p.primary, 'x', 16);
  shell(eh, [0, 0.062, 0], [0.12, 0.048, 0.07], p.alloy, 0.22);
  for (const s of [-1, 1]) {
    cyl(eh, [s * 0.18, 0, 0], 0.062, 0.062, 0.18, p.tire, 'x', 14);
    cyl(eh, [s * 0.35, 0, 0], s > 0 ? 0.088 : 0.062, s > 0 ? 0.062 : 0.088, 0.12, p.alloy, 'x', 14);
    band(eh, [s * 0.4, 0, 0], 0.086, 0.02, 0.04, p.accent, 'x');
    cyl(eh, [s * 0.74, 0, 0], 0.036, 0.036, 0.68, p.accent, 'x', 14);
    cyl(eh, [s * 0.68, 0, 0], 0.045, 0.045, 0.36, p.optic, 'x', 12);
    cone(eh, [s * 1.15, 0, 0], 0.036, 0.16, p.accent, p.hd, 12).rotation.z = s > 0 ? -HPI : HPI;
  }
  const eg = group(eh, 'EmitterGuard', [-0.06, 0, 0]);
  band(eg, [0, 0, 0], 0.088, 0.024, 0.14, p.alloy, 'x');
  for (const sy of [-1, 1]) shell(eg, [0, sy * 0.085, 0], [0.18, 0.038, 0.085], p.accent, 0.26);
  if (detail) {
    box(stand, [0, 0.07, 0.365], [0.46, 0.055, 0.04], p.accent);
    for (const sx of [-0.34, 0.34]) shell(stand, [sx, 0.18, 0.245], [0.18, 0.055, 0.036], p.optic, 0.2);
    if (p.hd) for (const sx of [-0.46, 0.46]) fastener(stand, [sx, 0.146, 0.26], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Display spin hilt', 3, [rotationTrack('EnergyHilt', 'y', [0, 0.75, 1.5, 2.25, 3], [0, 0.68, 0, -0.68, 0])]),
    new T.AnimationClip('Slide emitter guard', 2.4, [slideTrack('EmitterGuard', [-0.06, 0, 0], 0, [0, 0.7, 1.6, 2.4], [0, 0.12, 0.12, 0])]),
  ];
}

export function buildSonicDisruptorEmitter(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'SonicStand');
  addCradleStand(stand, p, detail, {
    w: 0.76, d: 0.98, baseH: 0.12, postH: 0.4, span: 0.26, axis: 'z',
    baseMat: p.dark, postMat: p.edge, trimMat: p.accent,
  });
  const sn = group(root, 'SonicBody');
  shell(sn, [0, 0.62, -0.06], [0.22, 0.24, 0.56], p.primary, 0.28);
  shell(sn, [0, 0.44, -0.18], [0.095, 0.22, 0.13], p.tire, 0.3).rotation.x = -0.22;
  cyl(sn, [0, 0.76, -0.06], 0.062, 0.062, 0.36, p.edge, 'z', 14);
  for (const rz of [-0.16, -0.06, 0.04]) band(sn, [0, 0.76, rz], 0.072, 0.016, 0.036, p.accent, 'z');
  cyl(sn, [0, 0.62, 0.36], 0.048, 0.088, 0.34, p.alloy, 'z', 16);
  orb(sn, [0, 0.62, 0.53], 0.052, p.optic, p.hd);
  const sr = group(root, 'SonicRings', [0, 0.62, 0.24]);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const ca = Math.cos(a), sa = Math.sin(a);
    cyl(sr, [ca * 0.092, sa * 0.092, 0.06], 0.014, 0.014, 0.42, p.alloy, 'z', 10);
    strut(sr, [ca * 0.092, sa * 0.092, 0.14], [ca * 0.15, sa * 0.15, 0.14], 0.012, p.alloy, 10);
    strut(sr, [ca * 0.092, sa * 0.092, 0.24], [ca * 0.19, sa * 0.19, 0.24], 0.012, p.alloy, 10);
  }
  for (const [idx, [rz, rr]] of ([[0.04, 0.112], [0.14, 0.155], [0.24, 0.195]] as const).entries()) {
    band(sr, [0, 0, rz], rr, 0.026, 0.04, idx === 1 ? p.primary : p.accent, 'z');
  }
  const fd = group(root, 'FreqDial', [0, 0.62, -0.35]);
  cyl(fd, [0, 0, 0.02], 0.042, 0.042, 0.1, p.alloy, 'z', 12);
  cyl(fd, [0, 0, -0.03], 0.096, 0.096, 0.042, p.accent, 'z', 16);
  box(fd, [0, 0.035, -0.058], [0.028, 0.09, 0.024], p.dark);
  orb(fd, [0, 0, -0.056], 0.032, p.optic, p.hd);
  if (detail) {
    for (const sx of [-0.115, 0.115]) shell(sn, [sx, 0.62, -0.06], [0.035, 0.1, 0.3], p.accent, 0.24);
    if (p.hd) for (const sx of [-0.115, 0.115]) fastener(sn, [sx, 0.56, 0.12], p, 0.018).rotation.z = sx > 0 ? -HPI : HPI;
  }
  root.animations = [
    new T.AnimationClip('Focus sonic rings', 2.6, [slideTrack('SonicRings', [0, 0.62, 0.24], 2, [0, 0.7, 1.7, 2.6], [0, 0.16, 0.16, 0])]),
    new T.AnimationClip('Tune frequency dial', 2.4, [spinTrack('FreqDial', 'z', 2.4, 2)]),
  ];
}

export function buildPalmHoloProjector(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'HoloDock');
  addPedestalStand(stand, p, detail, 0.44, 0.14, 0.18, 10);
  const em = group(root, 'HoloEmitter');
  tube(em, [0, 0.5, 0], 0.27, 0.3, 0.16, p.primary, 10);
  ring(em, [0, 0.59, 0], 0.25, 0.038, 0.048, p.edge);
  orb(em, [0, 0.58, 0], 0.135, p.optic, p.hd, [1, 0.42, 1]);
  tube(em, [0, 0.82, 0], 0.088, 0.042, 0.54, p.optic, 14);
  for (const [by, br] of [[0.72, 0.082], [0.86, 0.104]] as const) ring(em, [0, by, 0], br, 0.016, 0.022, p.accent);
  const pr = group(root, 'PetalRing', [0, 0.6, 0]);
  ring(pr, [0, 0, 0], 0.28, 0.032, 0.044, p.alloy);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const petal = group(pr, '', [Math.sin(a) * 0.26, 0.03, Math.cos(a) * 0.26]);
    petal.rotation.y = a;
    shell(petal, [0, 0.035, 0.02], [0.095, 0.11, 0.032], i % 2 === 0 ? p.accent : p.primary, 0.28).rotation.x = 0.45;
  }
  const hc = group(root, 'HoloCore', [0, 1.08, 0]);
  orb(hc, [0, 0, 0], 0.18, p.accent, p.hd);
  ring(hc, [0, 0, 0], 0.195, 0.018, 0.036, p.optic);
  const orbit = group(hc, 'HoloOrbit');
  orbit.rotation.set(0.42, 0, 0.24);
  torus(orbit, [0, 0, 0], 0.31, 0.018, p.optic, p.hd);
  for (const s of [-1, 1]) {
    strut(orbit, [s * 0.16, 0, 0], [s * 0.31, 0, 0], 0.012, p.accent, 10);
    orb(orbit, [s * 0.31, 0, 0], 0.042, p.accent, p.hd);
  }
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      orb(em, [Math.sin(a) * 0.295, 0.5, Math.cos(a) * 0.295], 0.022, p.optic, p.hd);
    }
    if (p.hd) ring(em, [0, 0.44, 0], 0.315, 0.022, 0.032, p.accent);
  }
  root.animations = [
    new T.AnimationClip('Rotate iris petals', 3, [spinTrack('PetalRing', 'y', 3, 1)]),
    new T.AnimationClip('Spin holo planet', 2.6, [spinTrack('HoloCore', 'y', 2.6, 1)]),
  ];
}

export function buildPowerGravityGauntlet(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'GauntletStand');
  shell(stand, [0, 0.07, 0], [0.86, 0.14, 0.84], p.dark, 0.24);
  for (const sx of [-0.2, 0.2]) tube(stand, [sx, 0.28, 0], 0.048, 0.062, 0.36, p.edge, 12);
  ring(stand, [0, 0.42, 0], 0.22, 0.044, 0.09, p.dark);
  const gt = group(root, 'GauntletBody');
  tube(gt, [0, 0.56, 0], 0.18, 0.21, 0.44, p.primary, 14);
  ring(gt, [0, 0.38, 0], 0.225, 0.026, 0.048, p.accent);
  for (const sx of [-0.21, 0.21]) {
    tube(gt, [sx, 0.54, 0], 0.042, 0.046, 0.26, p.edge, 12);
    tube(gt, [sx, 0.74, 0], 0.026, 0.026, 0.28, p.alloy, 10);
    shell(gt, [sx * 0.9, 0.84, 0], [0.1, 0.08, 0.14], p.dark, 0.24);
  }
  shell(gt, [0, 0.96, 0], [0.42, 0.38, 0.24], p.primary, 0.24);
  shell(gt, [0, 1.15, -0.02], [0.44, 0.12, 0.26], p.edge, 0.26);
  band(gt, [0, 0.96, 0.125], 0.14, 0.034, 0.055, p.accent, 'z');
  orb(gt, [0, 0.96, 0.135], 0.095, p.optic, p.hd, [1, 1, 0.65]);
  shell(gt, [0.26, 0.92, 0.06], [0.12, 0.14, 0.12], p.primary, 0.28).rotation.z = -0.45;
  shell(gt, [0.32, 1.04, 0.12], [0.1, 0.16, 0.1], p.alloy, 0.28).rotation.z = -0.22;
  const fc = group(root, 'FingerClaw', [0, 1.18, 0.02]);
  cyl(fc, [0, 0, 0], 0.036, 0.036, 0.42, p.alloy, 'x', 12);
  for (const fx of [-0.15, -0.05, 0.05, 0.15]) {
    shell(fc, [fx, 0.13, 0.01], [0.082, 0.22, 0.1], p.primary, 0.28);
    cyl(fc, [fx, 0.24, 0.03], 0.034, 0.034, 0.09, p.edge, 'x', 10);
    shell(fc, [fx, 0.34, 0.08], [0.072, 0.18, 0.085], p.alloy, 0.3).rotation.x = 0.48;
    cone(fc, [fx, 0.42, 0.14], 0.03, 0.08, p.accent, p.hd, 10).rotation.x = 0.68;
  }
  if (detail) {
    box(stand, [0, 0.07, 0.425], [0.34, 0.055, 0.04], p.accent);
    for (const sx of [-0.1, 0.1]) cyl(gt, [sx, 0.96, -0.14], 0.042, 0.042, 0.22, p.accent, 'y', 12);
    if (p.hd) for (const sx of [-0.34, 0.34]) fastener(stand, [sx, 0.146, 0.32], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Clench gravity claw', 2.6, [rotationTrack('FingerClaw', 'x', [0, 0.7, 1.75, 2.6], [0, 0.8, 0.8, 0])]),
  ];
}

export function buildPortableCyberdeck(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'CyberDock');
  addDockStand(stand, p, detail, 0.94, 0.8, 0.12, 0.22);
  const dk = group(root, 'DeckMount', [0, 0.38, 0.02]);
  dk.rotation.x = 0.24;
  shell(dk, [0, 0, 0], [0.76, 0.14, 0.54], p.primary, 0.2);
  shell(dk, [0, 0.06, -0.195], [0.72, 0.12, 0.19], p.dark, 0.2);
  for (const sx of [-0.385, 0.385]) shell(dk, [sx, 0.01, 0.02], [0.044, 0.07, 0.42], p.accent, 0.24);
  shell(dk, [0, 0.078, 0.06], [0.64, 0.032, 0.3], p.inset, 0.16);
  for (const [idx, kz] of ([-0.03, 0.05, 0.13] as const).entries()) {
    shell(dk, [-0.04, 0.098, kz], [0.46, 0.036, 0.052], idx === 0 ? p.accent : p.edge, 0.22);
  }
  orb(dk, [0.25, 0.096, 0.08], 0.045, p.optic, p.hd);
  cyl(dk, [-0.32, 0.22, -0.22], 0.014, 0.02, 0.26, p.alloy, 'y', 10);
  orb(dk, [-0.32, 0.36, -0.22], 0.024, p.accent, p.hd);
  const sc = group(dk, 'DeckScreen', [0, 0.12, -0.24]);
  cyl(sc, [0, 0, 0], 0.032, 0.032, 0.62, p.alloy, 'x', 12);
  shell(sc, [0, 0.045, 0.22], [0.72, 0.052, 0.44], p.primary, 0.2);
  shell(sc, [0, 0.014, 0.22], [0.6, 0.028, 0.34], p.optic, 0.16);
  shell(sc, [0, 0.08, 0.22], [0.54, 0.03, 0.12], p.accent, 0.24);
  const dc = group(dk, 'DataCart', [0.42, 0.01, -0.1]);
  shell(dc, [0.03, 0, 0], [0.18, 0.095, 0.18], p.dark, 0.22);
  shell(dc, [0.1, 0, 0], [0.06, 0.112, 0.14], p.accent, 0.24);
  orb(dc, [0.125, 0.02, 0.04], 0.02, p.optic, p.hd);
  if (detail) {
    for (const fx of [-0.2, -0.06, 0.08, 0.22]) box(dk, [fx, 0.06, -0.29], [0.04, 0.08, 0.04], p.alloy);
    if (p.hd) hose(stand, [[-0.22, 0.24, -0.22], [-0.36, 0.3, -0.28], [-0.32, 0.4, -0.14]], 0.018, p.tire, p.hd);
  }
  root.animations = [
    new T.AnimationClip('Flip cyberdeck lid', 2.8, [rotationTrack('DeckScreen', 'x', [0, 0.75, 1.95, 2.8], [0, -1.75, -1.75, 0])]),
  ];
}

export function buildStarfleetTricorder(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'TricorderStand');
  addDockStand(stand, p, detail, 0.78, 0.78, 0.12, 0.24);
  const tc = group(root, 'TricorderMount', [0, 0.42, 0.02]);
  tc.rotation.x = 0.34;
  shell(tc, [0, 0, 0], [0.44, 0.14, 0.62], p.primary, 0.28);
  for (const sx of [-0.225, 0.225]) shell(tc, [sx, 0, 0.04], [0.045, 0.085, 0.46], p.dark, 0.26);
  shell(tc, [0, 0.074, 0.08], [0.32, 0.034, 0.24], p.dark, 0.2);
  shell(tc, [0, 0.088, 0.08], [0.24, 0.026, 0.15], p.optic, 0.18);
  shell(tc, [0, 0.076, -0.14], [0.3, 0.032, 0.1], p.accent, 0.22);
  const fl = group(tc, 'TricorderFlap', [0, 0.08, -0.28]);
  cyl(fl, [0, 0, 0], 0.028, 0.028, 0.36, p.alloy, 'x', 10);
  shell(fl, [0, 0.042, 0.2], [0.42, 0.056, 0.4], p.primary, 0.28);
  shell(fl, [0, 0.008, 0.2], [0.32, 0.028, 0.28], p.optic, 0.18);
  shell(fl, [0, 0.076, 0.22], [0.28, 0.034, 0.22], p.edge, 0.24);
  shell(fl, [0, 0.094, 0.26], [0.2, 0.026, 0.075], p.accent, 0.22);
  const ms = group(tc, 'MiniScanner', [0, 0.02, 0.33]);
  cyl(ms, [0, 0, 0], 0.048, 0.052, 0.32, p.edge, 'x', 14);
  band(ms, [0.12, 0, 0], 0.056, 0.016, 0.038, p.accent, 'x');
  orb(ms, [0.165, 0, 0], 0.046, p.optic, p.hd);
  cyl(ms, [-0.08, 0, 0], 0.054, 0.054, 0.14, p.tire, 'x', 12);
  if (detail) {
    for (const bx of [-0.1, 0, 0.1]) box(tc, [bx, 0.078, 0.25], [0.055, 0.024, 0.042], p.accent);
    if (p.hd) for (const sx of [-0.15, 0.15]) fastener(tc, [sx, -0.075, -0.14], p, 0.018).rotation.x = Math.PI;
  }
  root.animations = [
    new T.AnimationClip('Open tricorder flap', 2.8, [rotationTrack('TricorderFlap', 'x', [0, 0.75, 1.95, 2.8], [0, -1.85, -1.85, 0])]),
  ];
}
