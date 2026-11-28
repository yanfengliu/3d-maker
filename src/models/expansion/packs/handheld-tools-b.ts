import * as T from 'three';
import {
  addPlinth, addTray, band, box, coil, cone, cyl, group, hollowBell, hose, HPI, orb,
  ring, rotationTrack, shell, slideTrack, solidLathe, spinTrack, strut, torus, tube,
  type Finish,
} from './handheld-tools-kit';

export function buildYellowGeigerCounter(root: T.Group, p: Finish, detail: boolean) {
  const m = group(root, 'GeigerCase');
  addPlinth(m, p, detail, 0.88, 0.76, 0.1, 0);
  shell(m, [-0.04, 0.36, 0], [0.64, 0.52, 0.52], p.primary, 0.2);
  for (const sx of [-0.36, 0.28]) shell(m, [sx, 0.36, 0], [0.06, 0.54, 0.54], p.accent, 0.24);
  hose(m, [[-0.24, 0.61, 0], [-0.24, 0.84, 0], [0.16, 0.84, 0], [0.16, 0.61, 0]], 0.028, p.alloy, p.hd);
  cyl(m, [-0.04, 0.84, 0], 0.042, 0.042, 0.28, p.tire, 'x', 12);
  shell(m, [-0.04, 0.44, 0.265], [0.46, 0.24, 0.042], p.dark, 0.16);
  box(m, [-0.04, 0.44, 0.29], [0.38, 0.17, 0.022], p.stencil);
  const needle = group(root, 'GeigerNeedle', [-0.04, 0.37, 0.312]);
  cyl(needle, [0, 0, 0], 0.024, 0.024, 0.024, p.dark, 'z', 12);
  box(needle, [0, 0.065, 0.008], [0.018, 0.135, 0.016], p.accent);
  cyl(m, [-0.18, 0.22, 0.275], 0.064, 0.07, 0.05, p.accent, 'z', 14);
  box(m, [-0.18, 0.24, 0.305], [0.022, 0.055, 0.018], p.stencil);
  cyl(m, [0.12, 0.22, 0.272], 0.036, 0.036, 0.03, p.optic, 'z', 12);
  for (const y of [0.24, 0.48]) shell(m, [0.34, y, 0.02], [0.12, 0.055, 0.12], p.edge, 0.2);
  coil(m, [0.31, 0.26, -0.14], [0.35, 0.24, -0.02], 4, 0.032, 0.012, p.tire, p.hd);
  const wand = group(root, 'ProbeWand', [0.42, 0.42, 0.02]);
  tube(wand, [0, 0.12, 0], 0.058, 0.058, 0.42, p.alloy, 14);
  tube(wand, [0, 0.18, 0.025], 0.038, 0.038, 0.24, p.optic, 12);
  tube(wand, [0, 0.35, 0], 0.066, 0.062, 0.07, p.accent, 14);
  tube(wand, [0, -0.16, 0], 0.048, 0.054, 0.24, p.tire, 14);
  if (detail) {
    for (let i = 0; i < 4; i++) box(m, [0.14, 0.17 + i * 0.035, 0.275], [0.12, 0.014, 0.016], p.inset);
    box(m, [-0.04, 0.625, 0.14], [0.22, 0.024, 0.09], p.accent);
  }
  root.animations = [new T.AnimationClip('Detect radiation', 2.4, [
    rotationTrack('GeigerNeedle', 'z', [0, 0.45, 0.9, 1.35, 1.85, 2.4], [0, 0.72, -0.4, 0.78, -0.62, 0]),
  ])];
}

export function buildFieldWalkieTalkie(root: T.Group, p: Finish, detail: boolean) {
  const dock = group(root, 'RadioDock');
  shell(dock, [0, 0.06, 0], [0.78, 0.12, 0.74], p.dark, 0.22);
  shell(dock, [0, 0.2, 0], [0.54, 0.22, 0.4], p.dark, 0.2);
  box(dock, [0, 0.17, 0.205], [0.28, 0.04, 0.024], p.optic);
  const r = group(root, 'TransceiverBody', [0, 0.64, 0]);
  shell(r, [0, 0, 0], [0.42, 0.78, 0.26], p.primary, 0.22);
  for (const y of [-0.26, -0.16, -0.06]) shell(r, [0, y, 0], [0.45, 0.045, 0.28], p.tire, 0.26);
  shell(r, [0, 0.22, 0.135], [0.32, 0.22, 0.03], p.dark, 0.16);
  shell(r, [0, 0.01, 0.135], [0.3, 0.14, 0.026], p.inset, 0.14);
  box(r, [0, 0.01, 0.152], [0.24, 0.095, 0.018], p.optic);
  shell(r, [-0.225, 0.08, 0.02], [0.055, 0.24, 0.12], p.accent, 0.26);
  shell(r, [0, 0.04, -0.16], [0.16, 0.44, 0.075], p.edge, 0.22);
  tube(r, [0.14, 0.43, 0], 0.036, 0.04, 0.09, p.dark, 12);
  tube(r, [-0.12, 0.42, 0], 0.042, 0.048, 0.08, p.alloy, 12);
  const dial = group(r, 'ChannelDial', [0.02, 0.42, 0]);
  tube(dial, [0, 0.04, 0], 0.058, 0.064, 0.095, p.dark, 14);
  tube(dial, [0, 0.095, 0], 0.052, 0.052, 0.024, p.accent, 14);
  box(dial, [0, 0.06, 0.058], [0.024, 0.07, 0.034], p.accent);
  const whip = group(r, 'WhipAntenna', [-0.12, 0.42, 0]);
  tube(whip, [0, -0.18, 0], 0.026, 0.026, 0.44, p.edge, 12);
  tube(whip, [0, 0.18, 0], 0.022, 0.028, 0.34, p.alloy, 12);
  tube(whip, [0, 0.48, 0], 0.014, 0.02, 0.34, p.alloy, 12);
  orb(whip, [0, 0.66, 0], 0.03, p.accent, p.hd);
  if (detail) {
    for (let i = 0; i < 4; i++) box(r, [0, 0.15 + i * 0.045, 0.156], [0.24, 0.016, 0.014], p.inset);
    for (let row = 0; row < 2; row++) {
      for (let col = -1; col <= 1; col++) box(r, [col * 0.085, -0.14 - row * 0.075, 0.15], [0.052, 0.04, 0.024], p.stencil);
    }
  }
  root.animations = [new T.AnimationClip('Tune & extend whip', 2.8, [
    spinTrack('ChannelDial', 'y', 2.8, 2),
    slideTrack('WhipAntenna', [-0.12, 0.42, 0], 1, [0, 0.75, 1.9, 2.8], [0, 0.32, 0.32, 0]),
  ])];
}

export function buildPrismBinoculars(root: T.Group, p: Finish, detail: boolean) {
  const st = group(root, 'BinocularStand');
  addPlinth(st, p, detail, 0.84, 0.78, 0.11, 0.36);
  strut(st, [0, 0.44, -0.1], [0, 0.56, -0.1], 0.048, p.edge, 12);
  strut(st, [0, 0.44, 0.14], [0, 0.56, 0.14], 0.048, p.edge, 12);
  cyl(st, [0, 0.56, 0.02], 0.062, 0.062, 0.44, p.alloy, 'z', 14);
  const addBarrel = (parent: T.Object3D, sign: -1 | 1) => {
    shell(parent, [sign * 0.11, 0, 0.02], [0.18, 0.1, 0.24], p.edge, 0.22);
    shell(parent, [sign * 0.24, 0, 0.06], [0.22, 0.24, 0.28], p.primary, 0.28);
    cyl(parent, [sign * 0.28, 0, 0.26], 0.132, 0.118, 0.28, p.primary, 'z', 18);
    band(parent, [sign * 0.28, 0, 0.39], 0.14, 0.022, 0.048, p.accent, 'z');
    cyl(parent, [sign * 0.28, 0, 0.395], 0.112, 0.112, 0.032, p.optic, 'z', 16);
    cyl(parent, [sign * 0.18, 0, -0.2], 0.08, 0.095, 0.26, p.primary, 'z', 16);
    band(parent, [sign * 0.18, 0, -0.33], 0.088, 0.02, 0.055, p.tire, 'z');
    cyl(parent, [sign * 0.18, 0, -0.34], 0.062, 0.062, 0.03, p.optic, 'z', 14);
  };
  const rightSide = group(st, 'RightBarrel', [0, 0.56, 0]);
  addBarrel(rightSide, 1);
  const leftSide = group(root, 'LeftBarrel', [0, 0.56, 0]);
  addBarrel(leftSide, -1);
  const wheel = group(root, 'FocusWheel', [0, 0.65, -0.02]);
  cyl(wheel, [0, 0, 0], 0.072, 0.072, 0.14, p.accent, 'x', 16);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    box(wheel, [0, Math.cos(a) * 0.072, Math.sin(a) * 0.072], [0.11, 0.018, 0.018], p.dark).rotation.x = a;
  }
  if (detail) {
    for (const s of [-1, 1]) {
      const target = s > 0 ? rightSide : leftSide;
      band(target, [s * 0.28, 0, 0.24], 0.132, 0.014, 0.035, p.tire, 'z');
      cyl(target, [s * 0.36, 0.04, 0.04], 0.022, 0.022, 0.04, p.alloy, 'x', 10);
    }
  }
  root.animations = [new T.AnimationClip('Focus & hinge optics', 2.8, [
    spinTrack('FocusWheel', 'x', 2.8, 2),
    rotationTrack('LeftBarrel', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.28, 0, -0.26, 0]),
  ])];
}

export function buildStormHurricaneLamp(root: T.Group, p: Finish, detail: boolean) {
  const lp = group(root, 'LanternBody');
  solidLathe(lp, [0, 0, 0], [[0.37, 0], [0.38, 0.06], [0.34, 0.16], [0.24, 0.26], [0.16, 0.31]], p.primary, p.hd, 20);
  tube(lp, [0.22, 0.24, 0.14], 0.042, 0.046, 0.08, p.accent, 12);
  tube(lp, [0, 0.34, 0], 0.175, 0.19, 0.1, p.accent, 18);
  solidLathe(lp, [0, 0.39, 0], [[0.145, 0], [0.22, 0.14], [0.24, 0.28], [0.19, 0.44], [0.14, 0.54]], p.optic, p.hd, 18);
  for (const sx of [-1, 1]) {
    hose(lp, [[sx * 0.29, 0.18, 0], [sx * 0.34, 0.48, 0], [sx * 0.32, 0.88, 0], [sx * 0.12, 1.04, 0]], 0.03, p.primary, p.hd);
  }
  solidLathe(lp, [0, 0.92, 0], [[0.18, 0], [0.24, 0.04], [0.17, 0.14], [0.13, 0.24], [0.15, 0.3]], p.primary, p.hd, 18);
  torus(lp, [0, 1.24, 0], 0.068, 0.018, p.alloy, p.hd);
  const bail = group(root, 'LanternBail', [0, 0.96, 0]);
  hose(bail, [[-0.31, 0, 0], [-0.36, 0.24, 0], [-0.2, 0.42, 0], [0.2, 0.42, 0], [0.36, 0.24, 0], [0.31, 0, 0]], 0.018, p.alloy, p.hd);
  cyl(bail, [0, 0.42, 0], 0.034, 0.034, 0.22, p.dark, 'x', 12);
  const wick = group(root, 'WickKnob', [0, 0.34, 0.2]);
  cyl(wick, [0, 0, 0], 0.022, 0.022, 0.14, p.accent, 'z', 12);
  band(wick, [0, 0, 0.06], 0.068, 0.016, 0.024, p.accent, 'z');
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    strut(wick, [0, 0, 0.06], [Math.cos(a) * 0.062, Math.sin(a) * 0.062, 0.06], 0.01, p.edge, 10);
  }
  if (detail) {
    for (const y of [0.54, 0.78]) ring(lp, [0, y, 0], 0.255, 0.014, 0.02, p.alloy);
    for (const a of [0.7, 2.4, 3.8, 5.5]) {
      strut(lp, [Math.cos(a) * 0.24, 0.42, Math.sin(a) * 0.24], [Math.cos(a) * 0.24, 0.92, Math.sin(a) * 0.24], 0.01, p.alloy, 10);
    }
  }
  root.animations = [new T.AnimationClip('Swing lantern & wick', 2.8, [
    rotationTrack('LanternBail', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.72, 0, -0.72, 0]),
    spinTrack('WickKnob', 'z', 2.8, 2),
  ])];
}

export function buildDraftingTransitLevel(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'TransitPlinth');
  tube(base, [0, 0.045, 0], 0.38, 0.4, 0.09, p.dark, 18);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const x = Math.sin(a) * 0.24, z = Math.cos(a) * 0.24;
    tube(base, [x, 0.16, z], 0.036, 0.036, 0.18, p.accent, 12);
    ring(base, [x, 0.16, z], 0.072, 0.022, 0.04, p.accent);
  }
  tube(base, [0, 0.24, 0], 0.32, 0.34, 0.06, p.accent, 18);
  const turret = group(root, 'LevelTurret', [0, 0.28, 0]);
  ring(turret, [0, 0.025, 0], 0.29, 0.032, 0.045, p.stencil);
  tube(turret, [0, 0.09, 0], 0.24, 0.26, 0.1, p.primary, 18);
  tube(turret, [0, 0.155, 0], 0.16, 0.16, 0.028, p.optic, 16);
  for (const sz of [-0.14, 0.14]) shell(turret, [0, 0.26, sz], [0.22, 0.24, 0.08], p.primary, 0.22);
  cyl(turret, [0, 0.38, 0.02], 0.092, 0.085, 0.66, p.primary, 'z', 18);
  cyl(turret, [0, 0.38, 0.4], 0.105, 0.095, 0.16, p.accent, 'z', 18);
  cyl(turret, [0, 0.38, 0.47], 0.084, 0.084, 0.03, p.optic, 'z', 16);
  cyl(turret, [0, 0.38, -0.35], 0.058, 0.074, 0.14, p.accent, 'z', 14);
  cyl(turret, [0, 0.38, -0.42], 0.044, 0.044, 0.03, p.optic, 'z', 14);
  cyl(turret, [0, 0.5, 0.02], 0.036, 0.036, 0.34, p.accent, 'z', 12);
  cyl(turret, [0, 0.525, 0.02], 0.024, 0.024, 0.2, p.optic, 'z', 12);
  const knob = group(turret, 'FocusKnob', [0.11, 0.38, 0.04]);
  cyl(knob, [0.035, 0, 0], 0.028, 0.028, 0.08, p.edge, 'x', 12);
  cyl(knob, [0.08, 0, 0], 0.068, 0.068, 0.055, p.accent, 'x', 16);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    box(knob, [0.08, Math.cos(a) * 0.066, Math.sin(a) * 0.066], [0.045, 0.018, 0.018], p.dark).rotation.x = a;
  }
  if (detail) {
    for (const sz of [-0.12, 0.16]) band(turret, [0, 0.38, sz], 0.102, 0.014, 0.028, p.accent, 'z');
    for (const sx of [-0.08, 0.08]) strut(turret, [sx, 0.44, 0.02], [sx * 0.4, 0.5, 0.02], 0.014, p.edge, 10);
  }
  root.animations = [new T.AnimationClip('Sweep transit level', 3.2, [
    rotationTrack('LevelTurret', 'y', [0, 0.8, 1.6, 2.4, 3.2], [0, 1.35, 0, -1.35, 0]),
    spinTrack('FocusKnob', 'x', 3.2, 2),
  ])];
}

export function buildChefCleaverBlock(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'KnifeBlock');
  shell(b, [0, 0.05, 0], [0.78, 0.1, 0.84], p.dark, 0.2);
  const blk = group(b, 'BlockBody', [0, 0.4, -0.02]);
  blk.rotation.x = -0.38;
  shell(blk, [0, 0, 0], [0.44, 0.72, 0.42], p.primary, 0.14);
  for (const [kx, kz, h] of [[-0.14, -0.1, 0.28], [0, -0.1, 0.32], [0.14, -0.1, 0.26], [-0.14, 0.04, 0.24]] as const) {
    box(blk, [kx, 0.365, kz], [0.048, 0.024, 0.09], p.inset);
    box(blk, [kx, 0.4, kz], [0.04, 0.075, 0.075], p.accent);
    shell(blk, [kx, 0.4 + h * 0.5, kz], [0.055, h, 0.075], p.dark, 0.26);
  }
  for (const y of [-0.12, 0.16]) ring(blk, [0.24, y, 0.02], 0.052, 0.016, 0.032, p.edge);
  const cleaver = group(blk, 'HeroCleaver', [0.04, 0.36, 0.12]);
  shell(cleaver, [0, 0.08, 0.02], [0.032, 0.38, 0.26], p.accent, 0.16);
  box(cleaver, [0, 0.22, 0.1], [0.038, 0.048, 0.048], p.inset);
  shell(cleaver, [0, 0.42, -0.04], [0.068, 0.3, 0.095], p.dark, 0.28);
  box(cleaver, [0, 0.28, -0.04], [0.088, 0.055, 0.116], p.alloy);
  const hone = group(blk, 'HoningSteel', [0.25, 0.06, 0.02]);
  tube(hone, [0, -0.08, 0], 0.022, 0.016, 0.56, p.accent, 12);
  tube(hone, [0, 0.22, 0], 0.056, 0.056, 0.035, p.alloy, 12);
  shell(hone, [0, 0.38, 0], [0.068, 0.28, 0.068], p.dark, 0.28);
  torus(hone, [0, 0.54, 0], 0.038, 0.012, p.alloy, p.hd);
  if (detail) {
    box(blk, [0, 0, 0.218], [0.3, 0.14, 0.024], p.accent);
    for (const y of [0.36, 0.43, 0.5]) cyl(cleaver, [0, y, -0.04], 0.014, 0.014, 0.078, p.alloy, 'x', 10);
  }
  root.animations = [new T.AnimationClip('Draw chef cleaver', 2.6, [
    rotationTrack('HeroCleaver', 'x', [0, 0.65, 1.85, 2.6], [0, -0.52, -0.52, 0]),
  ])];
}

export function buildTwinLensReflexCamera(root: T.Group, p: Finish, detail: boolean) {
  const cam = group(root, 'TlrCamera');
  addPlinth(cam, p, detail, 0.78, 0.76, 0.11, 0);
  tube(cam, [0, 0.135, 0], 0.12, 0.14, 0.07, p.alloy, 14);
  shell(cam, [0, 0.53, 0], [0.48, 0.74, 0.44], p.primary, 0.16);
  shell(cam, [0, 0.53, 0.225], [0.42, 0.66, 0.036], p.edge, 0.14);
  box(cam, [0, 0.895, 0], [0.36, 0.026, 0.34], p.optic);
  for (const [ly, r] of [[0.68, 0.115], [0.38, 0.125]] as const) {
    cyl(cam, [0, ly, 0.26], r, r * 1.06, 0.11, p.dark, 'z', 18);
    band(cam, [0, ly, 0.3], r + 0.012, 0.02, 0.038, p.accent, 'z');
    cyl(cam, [0, ly, 0.31], r * 0.74, r * 0.74, 0.03, p.optic, 'z', 16);
  }
  cyl(cam, [-0.26, 0.54, 0.02], 0.088, 0.088, 0.07, p.alloy, 'x', 16);
  cyl(cam, [-0.295, 0.54, 0.02], 0.062, 0.062, 0.024, p.accent, 'x', 14);
  const crank = group(root, 'FilmCrank', [0.25, 0.46, 0.02]);
  cyl(crank, [0.03, 0, 0], 0.048, 0.048, 0.075, p.accent, 'x', 14);
  strut(crank, [0.06, 0, 0], [0.06, -0.18, 0.12], 0.02, p.alloy, 10);
  cyl(crank, [0.12, -0.18, 0.12], 0.032, 0.03, 0.11, p.dark, 'x', 12);
  const hood = group(root, 'FinderHood', [0, 0.91, -0.2]);
  cyl(hood, [0, 0, 0], 0.022, 0.022, 0.38, p.alloy, 'x', 10);
  shell(hood, [0, 0.04, 0.2], [0.46, 0.075, 0.42], p.primary, 0.16);
  box(hood, [0, 0.045, 0.415], [0.14, 0.045, 0.03], p.accent);
  for (const sx of [-0.21, 0.21]) box(hood, [sx, 0.01, 0.2], [0.028, 0.05, 0.36], p.edge);
  if (detail) {
    box(cam, [0, 0.84, 0.246], [0.24, 0.06, 0.02], p.accent);
    cyl(cam, [0.16, 0.22, 0.255], 0.026, 0.026, 0.06, p.alloy, 'z', 10);
  }
  root.animations = [new T.AnimationClip('Open hood & wind film', 2.8, [
    rotationTrack('FinderHood', 'x', [0, 0.7, 1.9, 2.8], [0, -1.48, -1.48, 0]),
    spinTrack('FilmCrank', 'x', 2.8, 2),
  ])];
}

export function buildBrassOilCanFunnel(root: T.Group, p: Finish, detail: boolean) {
  const set = group(root, 'OilCanSet');
  addTray(set, p, detail, 0.98, 0.76, 0.08, 0.055, p.accent, p.dark);
  solidLathe(set, [-0.18, 0.09, 0], [[0.24, 0], [0.25, 0.07], [0.21, 0.26], [0.11, 0.44], [0.08, 0.5]], p.primary, p.hd, 18);
  ring(set, [-0.18, 0.56, 0], 0.092, 0.024, 0.045, p.edge);
  hose(set, [[-0.18, 0.56, 0], [-0.16, 0.78, 0.04], [-0.04, 0.94, 0.12], [0.1, 0.96, 0.18]], 0.026, p.primary, p.hd);
  cone(set, [0.12, 0.96, 0.19], 0.026, 0.08, p.alloy, p.hd, 12).rotation.set(0.3, 0, -1.35);
  hose(set, [[-0.3, 0.46, 0], [-0.46, 0.42, 0], [-0.48, 0.2, 0], [-0.36, 0.14, 0]], 0.024, p.primary, p.hd);
  const lever = group(root, 'PumpLever', [-0.26, 0.5, 0]);
  cyl(lever, [0, 0, 0], 0.032, 0.032, 0.07, p.edge, 'z', 12);
  strut(lever, [0, 0, 0], [-0.15, -0.06, 0], 0.018, p.accent, 10);
  shell(lever, [-0.17, -0.07, 0], [0.08, 0.04, 0.085], p.accent, 0.26);
  ring(set, [0.26, 0.14, 0.02], 0.11, 0.024, 0.05, p.edge);
  const funnel = group(root, 'BrassFunnel', [0.26, 0.14, 0.02]);
  tube(funnel, [0, 0.06, 0], 0.045, 0.026, 0.2, p.primary, 14);
  hollowBell(funnel, [0, 0.15, 0], [[0.045, 0], [0.13, 0.16], [0.21, 0.34], [0.225, 0.38]], 0.022, p.primary, p.hd, 18);
  torus(funnel, [0, 0.53, 0], 0.215, 0.018, p.primary, p.hd).rotation.x = HPI;
  torus(funnel, [0.23, 0.48, 0], 0.044, 0.014, p.edge, p.hd);
  if (detail) {
    ring(set, [-0.18, 0.15, 0], 0.252, 0.014, 0.024, p.edge);
    for (const [fy, fr] of [[0.28, 0.125], [0.4, 0.18]] as const) ring(funnel, [0, fy, 0], fr, 0.014, 0.02, p.edge);
  }
  root.animations = [new T.AnimationClip('Pump oiler', 2.4, [
    rotationTrack('PumpLever', 'z', [0, 0.6, 1.2, 1.8, 2.4], [0, 0.38, 0, -0.34, 0]),
  ])];
}

export function buildSolderingIronStation(root: T.Group, p: Finish, detail: boolean) {
  const st = group(root, 'SolderStation');
  addTray(st, p, detail, 1.04, 0.8, 0.08, 0.05, p.dark, p.edge);
  shell(st, [-0.22, 0.28, -0.04], [0.46, 0.38, 0.46], p.primary, 0.18);
  shell(st, [-0.22, 0.34, 0.195], [0.38, 0.26, 0.036], p.dark, 0.14);
  box(st, [-0.12, 0.38, 0.216], [0.16, 0.08, 0.02], p.optic);
  box(st, [-0.34, 0.38, 0.216], [0.055, 0.08, 0.026], p.accent);
  shell(st, [0.24, 0.115, 0.22], [0.24, 0.05, 0.16], p.accent, 0.2);
  const dial = group(root, 'TempDial', [-0.22, 0.26, 0.22]);
  cyl(dial, [0, 0, 0.015], 0.068, 0.072, 0.048, p.dark, 'z', 16);
  box(dial, [0, 0.026, 0.044], [0.022, 0.058, 0.02], p.accent);
  shell(st, [0.24, 0.16, -0.02], [0.22, 0.14, 0.26], p.dark, 0.2);
  coil(st, [0.24, 0.22, 0.02], [0.24, 0.46, -0.12], 5, 0.062, 0.014, p.alloy, p.hd);
  hose(st, [[0, 0.22, -0.14], [0.12, 0.14, -0.04], [0.24, 0.2, 0.04]], 0.018, p.tire, p.hd);
  const iron = group(root, 'SolderIron', [0.24, 0.42, -0.06]);
  const grip = cyl(iron, [0, 0.1, -0.1], 0.042, 0.046, 0.34, p.primary, 'z', 14);
  grip.rotation.x = HPI - 0.56;
  const collar = cyl(iron, [0, 0.01, 0.05], 0.05, 0.046, 0.06, p.accent, 'z', 14);
  collar.rotation.x = HPI - 0.56;
  const barrel = cyl(iron, [0, -0.09, 0.18], 0.022, 0.028, 0.28, p.alloy, 'z', 12);
  barrel.rotation.x = HPI - 0.56;
  const tip = cone(iron, [0, -0.18, 0.31], 0.022, 0.1, p.edge, p.hd, 12);
  tip.rotation.x = HPI + 0.56;
  strut(st, [0.24, 0.1, -0.28], [0.24, 0.68, -0.28], 0.026, p.edge, 10);
  cyl(st, [0.24, 0.64, -0.28], 0.024, 0.024, 0.24, p.edge, 'x', 10);
  const spool = group(root, 'SolderSpool', [0.24, 0.64, -0.28]);
  for (const sx of [-0.085, 0.085]) cyl(spool, [sx, 0, 0], 0.14, 0.14, 0.026, p.dark, 'x', 16);
  cyl(spool, [0, 0, 0], 0.112, 0.112, 0.145, p.alloy, 'x', 16);
  if (detail) {
    for (const sx of [-0.04, 0, 0.04]) band(spool, [sx, 0, 0], 0.118, 0.014, 0.018, p.stencil, 'x');
    tube(st, [0.02, 0.145, 0.22], 0.068, 0.072, 0.09, p.alloy, 14);
  }
  root.animations = [new T.AnimationClip('Heat & tilt iron', 2.8, [
    rotationTrack('TempDial', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 1.65, -1.2, 0.6, 0]),
    rotationTrack('SolderIron', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, -0.52, 0.32, -0.2, 0]),
  ])];
}

export function buildLeatherMedicSatchel(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'MedicSatchel');
  addTray(b, p, detail, 1.06, 0.78, 0.08, 0.05, p.alloy, p.dark);
  shell(b, [-0.04, 0.34, 0], [0.76, 0.48, 0.48], p.primary, 0.22);
  for (const sx of [-0.41, 0.33]) for (const sz of [-0.23, 0.23]) box(b, [sx, 0.16, sz], [0.06, 0.14, 0.06], p.dark);
  for (const sx of [-0.26, 0.18]) {
    box(b, [sx, 0.35, 0.246], [0.075, 0.42, 0.028], p.dark);
    box(b, [sx, 0.36, 0.266], [0.095, 0.075, 0.024], p.alloy);
  }
  cyl(b, [-0.04, 0.36, 0.252], 0.115, 0.115, 0.026, p.stencil, 'z', 16);
  box(b, [-0.04, 0.36, 0.274], [0.14, 0.046, 0.024], p.accent);
  box(b, [-0.04, 0.36, 0.275], [0.046, 0.14, 0.022], p.accent);
  for (const sz of [-0.12, 0.12]) shell(b, [0.36, 0.34, sz], [0.08, 0.18, 0.048], p.dark, 0.2);
  const lid = group(root, 'BagLid', [-0.04, 0.58, -0.23]);
  cyl(lid, [0, 0, 0], 0.024, 0.024, 0.68, p.alloy, 'x', 10);
  shell(lid, [0, 0.08, 0.23], [0.78, 0.17, 0.49], p.primary, 0.24);
  box(lid, [0, 0.01, 0.48], [0.12, 0.075, 0.036], p.alloy);
  hose(lid, [[-0.2, 0.15, 0.23], [-0.18, 0.34, 0.23], [0.18, 0.34, 0.23], [0.2, 0.15, 0.23]], 0.03, p.dark, p.hd);
  for (const sx of [-0.2, 0.2]) torus(lid, [sx, 0.17, 0.23], 0.036, 0.012, p.alloy, p.hd);
  const roll = group(root, 'BandageRoll', [0.43, 0.34, 0]);
  cyl(roll, [0, 0, 0], 0.115, 0.115, 0.38, p.stencil, 'z', 16);
  for (const sz of [-0.195, 0.195]) cyl(roll, [0, 0, sz], 0.045, 0.045, 0.018, p.inset, 'z', 12);
  for (const sz of [-0.11, 0.11]) band(roll, [0, 0, sz], 0.122, 0.014, 0.032, p.accent, 'z');
  if (detail) {
    for (const sx of [-0.2, -0.04, 0.12]) {
      tube(b, [sx, 0.52, 0], 0.044, 0.044, 0.12, p.optic, 12);
      tube(b, [sx, 0.585, 0], 0.03, 0.03, 0.025, p.stencil, 10);
    }
  }
  root.animations = [new T.AnimationClip('Open medic satchel', 2.8, [
    rotationTrack('BagLid', 'x', [0, 0.7, 1.9, 2.8], [0, -1.08, -1.08, 0]),
  ])];
}
