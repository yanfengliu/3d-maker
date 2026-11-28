import * as T from 'three';
import { fastener } from '../../hd-detail';
import {
  HPI, addKeybed, group, kbox, kcyl, kextrude, kglow, klathe, kmatte, korb, kstrut,
  ring, rotationTrack, shell, slideTrack, spinTrack,
} from './music-stage-kit';
import type { Finish, Point } from './music-stage-kit';

function bodyBoutShape(w1: number, w2: number, h: number): T.Shape {
  const s = new T.Shape();
  s.moveTo(0, -h * 0.5);
  s.bezierCurveTo(w2, -h * 0.5, w2 * 1.04, -h * 0.14, w1 * 0.62, 0.02);
  s.bezierCurveTo(w1 * 0.94, h * 0.16, w1 * 0.94, h * 0.48, 0, h * 0.5);
  s.bezierCurveTo(-w1 * 0.94, h * 0.48, -w1 * 0.94, h * 0.16, -w1 * 0.62, 0.02);
  s.bezierCurveTo(-w2 * 1.04, -h * 0.14, -w2, -h * 0.5, 0, -h * 0.5);
  return s;
}

export function guitarAmpStack(root: T.Group, p: Finish, detail: boolean) {
  const a = group(root, 'AmpStack');
  const tubeGlow = kglow('#ffae52', '#e06612', 'Vacuum tube glow');
  for (const sx of [-0.46, 0.46]) for (const sz of [-0.26, 0.26]) kcyl(a, [sx, 0.045, sz], 0.045, 0.045, 0.09, p.tire, p.hd, 'y', 8);
  // Straight bottom 4x12 cabinet
  shell(a, [0, 0.46, 0], [1.1, 0.78, 0.68], p.primary, 0.12);
  kbox(a, [0, 0.46, 0.35], [0.94, 0.64, 0.036], p.inset, p.hd);
  for (const sx of [-0.22, 0.22]) for (const sy of [0.3, 0.62]) ring(a, [sx, sy, 0.375], 0.14, 0.025, 0.025, p.dark).rotation.x = HPI;
  // Slant upper 4x12 cabinet
  shell(a, [0, 1.18, -0.02], [1.08, 0.7, 0.64], p.primary, 0.12);
  const slant = group(a, '', [0, 1.26, 0.3]);
  slant.rotation.x = -0.18;
  kbox(slant, [0, 0, 0], [0.92, 0.54, 0.04], p.inset, p.hd);
  kbox(slant, [0, 0.2, 0.032], [0.38, 0.06, 0.024], p.stencil, p.hd);
  // Tube head unit crowning the stack
  shell(a, [0, 1.72, -0.04], [1.02, 0.38, 0.54], p.primary, 0.14);
  kbox(a, [0, 1.62, 0.24], [0.9, 0.14, 0.036], p.accent, p.hd);
  kbox(a, [0, 1.79, 0.23], [0.88, 0.12, 0.032], p.inset, p.hd);
  for (let i = 0; i < 4; i++) kcyl(a, [-0.28 + i * 0.18, 1.79, 0.25], 0.026, 0.026, 0.08, tubeGlow, p.hd, 'y', 8);
  const knob = group(root, 'MasterKnob', [0.3, 1.62, 0.27]);
  kcyl(knob, [0, 0, 0], 0.042, 0.046, 0.048, p.dark, p.hd, 'z', 10);
  kbox(knob, [0, 0.026, 0.03], [0.016, 0.03, 0.016], p.stencil, p.hd);
  const handle = group(root, 'CarryHandle', [0, 1.92, -0.04]);
  for (const sx of [-0.22, 0.22]) kbox(handle, [sx, 0.03, 0], [0.055, 0.06, 0.075], p.alloy, p.hd);
  kbox(handle, [0, 0.07, 0], [0.46, 0.04, 0.06], p.tire, p.hd);
  const pedal = group(root, 'FootPedal', [0, 0.05, 0.56]);
  kbox(pedal, [0, 0, 0], [0.28, 0.09, 0.22], p.dark, p.hd);
  kbox(pedal, [0, 0.06, 0], [0.2, 0.04, 0.14], p.accent, p.hd);
  kstrut(pedal, [0, 0.02, -0.1], [0, 0.08, -0.26], 0.014, p.tire, p.hd, 6);
  if (detail) {
    for (let i = 0; i < 5; i++) kcyl(a, [-0.34 + i * 0.12, 1.62, 0.27], 0.024, 0.028, 0.036, p.dark, p.hd, 'z', 8);
    for (const sx of [-0.52, 0.52]) for (const y of [0.1, 0.82, 1.5]) kbox(a, [sx, y, 0.32], [0.08, 0.08, 0.08], p.alloy, p.hd);
    if (p.hd) for (const sx of [-0.42, 0.42]) fastener(a, [sx, 1.72, -0.32], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Crank master dial', 2.4, [rotationTrack('MasterKnob', 'z', [0, 0.6, 1.5, 2.4], [0, -2.4, -2.4, 0])]),
    new T.AnimationClip('Flip carry handle', 2.2, [rotationTrack('CarryHandle', 'x', [0, 0.55, 1.5, 2.2], [0, -0.95, -0.95, 0])]),
  ];
}

export function stageSpotlightTruss(root: T.Group, p: Finish, detail: boolean) {
  const tr = group(root, 'TrussTower');
  const beamGlow = kglow('#ffe698', '#f2aa24', 'Stage lamp');
  shell(tr, [0, 0.05, 0], [1.04, 0.1, 1.04], p.dark, 0.2);
  for (const sx of [-0.15, 0.15]) for (const sz of [-0.15, 0.15]) {
    kstrut(tr, [sx, 0.08, sz], [sx, 2.34, sz], 0.026, p.alloy, p.hd, 8);
    kstrut(tr, [sx * 3.1, 0.08, sz * 3.1], [sx, 0.62, sz], 0.024, p.primary, p.hd, 6);
  }
  // Diagonal lattice bracing along mast
  for (let i = 0; i < 6; i++) {
    const y0 = 0.22 + i * 0.34, y1 = y0 + 0.34;
    kstrut(tr, [-0.15, y0, 0.15], [0.15, y1, 0.15], 0.015, p.alloy, p.hd, 6);
    kstrut(tr, [0.15, y0, -0.15], [-0.15, y1, -0.15], 0.015, p.alloy, p.hd, 6);
    kstrut(tr, [0.15, y0, 0.15], [0.15, y1, -0.15], 0.015, p.alloy, p.hd, 6);
    kstrut(tr, [-0.15, y0, -0.15], [-0.15, y1, 0.15], 0.015, p.alloy, p.hd, 6);
  }
  // Overhead horizontal lighting bridge
  kbox(tr, [0, 2.36, 0], [1.66, 0.12, 0.36], p.primary, p.hd);
  for (const [name, sx] of [['SpotLeft', -0.6], ['SpotCenter', 0], ['SpotRight', 0.6]] as const) {
    kstrut(tr, [sx, 2.3, 0], [sx, 2.12, 0], 0.022, p.dark, p.hd, 6);
    const spot = group(root, name, [sx, 2.1, 0]);
    kcyl(spot, [0, 0, 0.04], 0.1, 0.12, 0.28, p.dark, p.hd, 'z', 10);
    ring(spot, [0, 0, 0.19], 0.115, 0.024, 0.04, p.accent).rotation.x = HPI;
    kcyl(spot, [0, 0, 0.19], 0.088, 0.088, 0.024, beamGlow, p.hd, 'z', 10);
    for (const s of [-1, 1]) kbox(spot, [s * 0.12, 0, 0.24], [0.022, 0.16, 0.1], p.primary, p.hd).rotation.y = s * 0.32;
  }
  if (detail) {
    kbox(tr, [0, 0.42, 0.2], [0.26, 0.34, 0.12], p.accent, p.hd);
    for (const sx of [-0.42, 0.42]) for (const sz of [-0.42, 0.42]) fastener(tr, [sx, 0.11, sz], p, 0.026);
    if (p.hd) for (const sx of [-0.74, 0.74]) fastener(tr, [sx, 2.36, 0.19], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Sweep stage spots', 2.8, [
      rotationTrack('SpotLeft', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.52, 0.12, -0.35, 0]),
      rotationTrack('SpotCenter', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, -0.35, 0.48, 0.12, 0]),
      rotationTrack('SpotRight', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.38, -0.32, 0.45, 0]),
    ]),
  ];
}

export function acousticGuitarRack(root: T.Group, p: Finish, detail: boolean) {
  const rk = group(root, 'GuitarRack');
  for (const sx of [-0.68, 0.68]) {
    kbox(rk, [sx, 0.06, 0], [0.09, 0.12, 0.74], p.dark, p.hd);
    kstrut(rk, [sx, 0.1, 0.3], [sx, 0.88, -0.14], 0.032, p.primary, p.hd, 8);
    kstrut(rk, [sx, 0.1, -0.3], [sx, 0.88, -0.14], 0.032, p.primary, p.hd, 8);
  }
  for (const sz of [-0.12, 0.18]) kbox(rk, [0, 0.18, sz], [1.38, 0.065, 0.075], p.tire, p.hd);
  kbox(rk, [0, 0.86, -0.16], [1.42, 0.07, 0.09], p.primary, p.hd);
  // Three dreadnought acoustic guitars standing side-by-side in rack
  const finishesList = [p.primary, p.accent, p.stencil] as const;
  for (let i = 0; i < 3; i++) {
    const gx = -0.44 + i * 0.44;
    const gtr = group(rk, '', [gx, 0.52, 0.04]);
    gtr.rotation.y = 0.42;
    gtr.rotation.x = -0.16;
    const bodyMat = finishesList[i % 3] ?? p.primary;
    kextrude(gtr, [0, 0, 0], bodyBoutShape(0.16, 0.21, 0.54), 0.12, bodyMat, p.hd);
    kcyl(gtr, [0, 0.05, 0.066], 0.06, 0.06, 0.02, p.inset, p.hd, 'z', 10);
    ring(gtr, [0, 0.05, 0.074], 0.068, 0.015, 0.014, p.accent).rotation.x = HPI;
    kbox(gtr, [0, -0.12, 0.072], [0.14, 0.038, 0.024], p.dark, p.hd);
    kbox(gtr, [0, 0.44, 0.01], [0.055, 0.42, 0.048], p.dark, p.hd);
    kbox(gtr, [0, 0.7, 0], [0.088, 0.14, 0.038], p.primary, p.hd);
  }
  const bar = group(root, 'NeckBar', [-0.68, 0.88, -0.1]);
  kbox(bar, [0.68, 0, 0.14], [1.4, 0.045, 0.05], p.accent, p.hd);
  for (const sx of [0.02, 1.34]) kstrut(bar, [sx, 0, 0], [sx, 0, 0.14], 0.018, p.alloy, p.hd, 6);
  if (detail) {
    for (let i = 0; i < 4; i++) kbox(rk, [-0.58 + i * 0.39, 0.88, -0.11], [0.036, 0.08, 0.12], p.tire, p.hd);
    if (p.hd) for (const sx of [-0.68, 0.68]) fastener(rk, [sx, 0.06, 0.37], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Open neck retainer', 2.6, [rotationTrack('NeckBar', 'x', [0, 0.75, 1.85, 2.6], [0, -1.2, -1.2, 0])]),
  ];
}

export function brassHornPhonograph(root: T.Group, p: Finish, detail: boolean) {
  const ph = group(root, 'PhonographCabinet');
  shell(ph, [0, 0.07, 0], [0.78, 0.14, 0.78], p.dark, 0.2);
  shell(ph, [0, 0.46, 0], [0.66, 0.66, 0.66], p.primary, 0.14);
  shell(ph, [0, 0.84, 0], [0.76, 0.12, 0.76], p.dark, 0.18);
  shell(ph, [0, 0.99, 0], [0.56, 0.2, 0.56], p.primary, 0.16);
  // Spinning shellac disc on brass platter
  const disc = group(root, 'ShellacDisc', [0, 1.11, 0.02]);
  kcyl(disc, [0, 0, 0], 0.2, 0.21, 0.035, p.tire, p.hd, 'y', 12);
  kcyl(disc, [0, 0.024, 0], 0.07, 0.07, 0.018, p.accent, p.hd, 'y', 10);
  kbox(disc, [0.1, 0.022, 0], [0.1, 0.015, 0.028], p.stencil, p.hd);
  // Gooseneck brass arm rising into morning-glory lathe horn (closed solid profile)
  kstrut(ph, [0, 1.06, -0.22], [0, 1.38, -0.26], 0.036, p.accent, p.hd, 8);
  kstrut(ph, [0, 1.38, -0.26], [0, 1.34, -0.06], 0.028, p.accent, p.hd, 8);
  const horn = group(ph, '', [0, 1.42, -0.24]);
  horn.rotation.x = 1.08;
  klathe(horn, [0, 0, 0], [
    [0, 0], [0.055, 0.02], [0.085, 0.18], [0.16, 0.38], [0.34, 0.58],
    [0.37, 0.62], [0.33, 0.63], [0.13, 0.4], [0.05, 0.18], [0, 0.08],
  ], p.accent, p.hd, 10);
  // Side hand-crank flywheel
  const crank = group(root, 'HandCrank', [0.3, 0.98, 0]);
  kcyl(crank, [0.06, 0, 0], 0.02, 0.02, 0.14, p.alloy, p.hd, 'x', 8);
  kstrut(crank, [0.12, 0, 0], [0.12, 0.14, 0], 0.016, p.accent, p.hd, 6);
  kcyl(crank, [0.18, 0.14, 0], 0.024, 0.02, 0.1, p.dark, p.hd, 'x', 8);
  if (detail) {
    for (const sz of [-0.34, 0.34]) kbox(ph, [0, 0.46, sz], [0.46, 0.44, 0.03], p.accent, p.hd);
    if (p.hd) for (const sx of [-0.28, 0.28]) fastener(ph, [sx, 0.84, 0.38], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Wind and play', 2.4, [
      spinTrack('HandCrank', 'x', 2.4, 2),
      spinTrack('ShellacDisc', 'y', 2.4, 2),
    ]),
  ];
}

export function templeBronzeGong(root: T.Group, p: Finish, detail: boolean) {
  const g = group(root, 'GongArch');
  for (const sx of [-0.62, 0.62]) {
    shell(g, [sx, 0.09, 0], [0.24, 0.18, 0.78], p.dark, 0.18);
    kcyl(g, [sx, 0.96, 0], 0.062, 0.072, 1.66, p.primary, p.hd, 'y', 10);
    kstrut(g, [sx, 0.18, 0.28], [sx, 0.56, 0], 0.032, p.primary, p.hd, 8);
    kstrut(g, [sx, 0.18, -0.28], [sx, 0.56, 0], 0.032, p.primary, p.hd, 8);
    kstrut(g, [sx, 1.44, 0], [sx * 0.58, 1.72, 0], 0.028, p.accent, p.hd, 6);
  }
  // Ceremonial double pagoda lintel beam with carved spacer brackets
  kbox(g, [0, 1.76, 0], [1.56, 0.12, 0.22], p.primary, p.hd);
  for (const bx of [-0.46, 0, 0.46]) kbox(g, [bx, 1.84, 0], [0.12, 0.08, 0.18], p.accent, p.hd);
  kbox(g, [0, 1.9, 0], [1.68, 0.1, 0.28], p.dark, p.hd);
  for (const sx of [-0.82, 0.82]) kbox(g, [sx, 1.96, 0], [0.16, 0.08, 0.26], p.accent, p.hd).rotation.z = sx * 0.45;
  // Swinging hammered bronze gong suspended by twin solid ropes
  const gong = group(root, 'BronzeGong', [0, 1.72, 0]);
  for (const sx of [-0.24, 0.24]) kstrut(gong, [sx, 0, 0], [sx, -0.34, 0], 0.018, p.stencil, p.hd, 6);
  kcyl(gong, [0, -0.68, 0], 0.44, 0.44, 0.07, p.accent, p.hd, 'z', 14);
  ring(gong, [0, -0.68, 0.04], 0.42, 0.048, 0.045, p.dark).rotation.x = HPI;
  korb(gong, [0, -0.68, 0.04], 0.14, p.accent, p.hd, [1, 1, 0.48]);
  // Side-mounted swinging striker mallet
  const mal = group(root, 'GongMallet', [0.62, 1.24, 0.12]);
  kstrut(mal, [0, 0, 0], [-0.2, -0.22, 0], 0.018, p.primary, p.hd, 6);
  korb(mal, [-0.22, -0.24, 0], 0.082, p.stencil, p.hd);
  if (detail) {
    for (const sx of [-0.62, 0.62]) ring(g, [sx, 1.56, 0], 0.088, 0.022, 0.055, p.accent);
    ring(gong, [0, -0.68, -0.04], 0.34, 0.032, 0.03, p.dark).rotation.x = HPI;
    if (p.hd) for (const sx of [-0.52, 0.52]) fastener(g, [sx, 1.76, 0.12], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Strike temple gong', 2.6, [
      rotationTrack('GongMallet', 'z', [0, 0.35, 0.75, 2.6], [0, -0.58, 0.24, 0]),
      rotationTrack('BronzeGong', 'x', [0, 0.4, 1.1, 1.8, 2.6], [0, 0.34, -0.24, 0.14, 0]),
    ]),
  ];
}

export function uprightBassStand(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'BassStand');
  // Grounded splayed floor tripod & tall neck yoke post
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.52;
    kstrut(b, [Math.cos(a) * 0.46, 0.04, Math.sin(a) * 0.46], [0, 0.26, 0], 0.036, p.dark, p.hd, 8);
    kcyl(b, [Math.cos(a) * 0.46, 0.03, Math.sin(a) * 0.46], 0.044, 0.048, 0.06, p.tire, p.hd, 'y', 8);
  }
  kstrut(b, [0, 0.24, -0.08], [0, 1.52, -0.24], 0.034, p.dark, p.hd, 8);
  kbox(b, [0, 1.5, -0.14], [0.22, 0.065, 0.22], p.tire, p.hd);
  kstrut(b, [0, 0.24, 0.04], [0, 0.42, 0.08], 0.018, p.alloy, p.hd, 8);
  // Monumental upright double bass body
  const bass = group(b, '', [0, 0.94, 0.06]);
  bass.rotation.x = -0.09;
  kextrude(bass, [0, 0, 0], bodyBoutShape(0.28, 0.38, 1.12), 0.22, p.primary, p.hd);
  kbox(bass, [0, 0.22, 0.13], [0.095, 0.72, 0.048], p.inset, p.hd);
  kbox(bass, [0, -0.34, 0.145], [0.11, 0.24, 0.042], p.dark, p.hd);
  kbox(bass, [0, -0.08, 0.15], [0.18, 0.038, 0.055], p.accent, p.hd);
  kbox(bass, [0, 0.82, 0.01], [0.075, 0.56, 0.08], p.primary, p.hd);
  kbox(bass, [0, 0.86, 0.065], [0.082, 0.54, 0.038], p.inset, p.hd);
  korb(bass, [0, 1.16, 0.01], 0.068, p.accent, p.hd);
  for (const sx of [-1, 1]) for (const py of [1.0, 1.1]) kcyl(bass, [sx * 0.082, py, 0.01], 0.022, 0.022, 0.09, p.accent, p.hd, 'x', 8);
  // Side bow bracket + rocking bass bow
  kstrut(b, [0.14, 0.84, -0.14], [0.42, 0.84, 0.08], 0.02, p.accent, p.hd, 6);
  const bow = group(root, 'BassBow', [0.42, 0.84, 0.12]);
  kstrut(bow, [0, -0.46, 0], [0, 0.46, 0], 0.015, p.primary, p.hd, 6);
  kstrut(bow, [-0.035, -0.44, 0], [-0.035, 0.44, 0], 0.008, p.stencil, p.hd, 6);
  kbox(bow, [-0.018, -0.44, 0], [0.052, 0.068, 0.032], p.dark, p.hd);
  if (detail) {
    for (const sx of [-0.18, 0.18]) kbox(bass, [sx, -0.06, 0.12], [0.026, 0.24, 0.02], p.inset, p.hd).rotation.z = sx * 0.9;
    if (p.hd) for (let i = 0; i < 3; i++) fastener(b, [0, 0.5 + i * 0.35, -0.18], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Rock bass bow', 2.6, [rotationTrack('BassBow', 'z', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.38, 0, -0.34, 0])]),
  ];
}

export function grandTimpaniPair(root: T.Group, p: Finish, detail: boolean) {
  const tp = group(root, 'TimpaniPlatform');
  shell(tp, [0, 0.04, 0], [1.84, 0.08, 0.94], p.dark, 0.16);
  const specs: readonly [string, number, number][] = [['TuningPedalL', -0.46, 0.38], ['TuningPedalR', 0.46, 0.32]];
  for (const [pedName, cx, r] of specs) {
    kcyl(tp, [cx, 0.15, 0], r * 0.56, r * 0.66, 0.16, p.dark, p.hd, 'y', 10);
    // Closed copper parabolic kettle bowl
    klathe(tp, [cx, 0.22, 0], [
      [0, 0], [r * 0.55, 0.04], [r * 0.88, 0.22], [r * 0.98, 0.46], [r, 0.64], [0, 0.64],
    ], p.primary, p.hd, 12);
    ring(tp, [cx, 0.86, 0], r * 1.04, 0.035, 0.058, p.accent);
    kcyl(tp, [cx, 0.87, 0], r * 0.96, r * 0.96, 0.026, p.stencil, p.hd, 'y', 12);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      kstrut(tp, [cx + Math.cos(a) * r * 0.62, 0.16, Math.sin(a) * r * 0.62], [cx + Math.cos(a) * r * 1.04, 0.86, Math.sin(a) * r * 1.04], 0.016, p.alloy, p.hd, 6);
    }
    const ped = group(root, pedName, [cx, 0.12, 0.24]);
    kbox(ped, [0, -0.03, 0], [0.08, 0.08, 0.09], p.alloy, p.hd);
    kbox(ped, [0, 0.02, 0.1], [0.13, 0.036, 0.22], p.accent, p.hd);
  }
  if (detail) {
    for (const [, cx, r] of specs) {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        kbox(tp, [cx + Math.cos(a) * r * 1.04, 0.92, Math.sin(a) * r * 1.04], [0.06, 0.024, 0.024], p.accent, p.hd);
      }
    }
    if (p.hd) for (const sx of [-0.78, 0.78]) fastener(tp, [sx, 0.09, 0.36], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Tune timpani pedals', 2.4, [
      rotationTrack('TuningPedalL', 'x', [0, 0.6, 1.2, 2.4], [0, 0.45, 0.08, 0]),
      rotationTrack('TuningPedalR', 'x', [0, 0.6, 1.6, 2.4], [0, 0.15, 0.45, 0]),
    ]),
  ];
}

export function accordionBellowsStand(root: T.Group, p: Finish, detail: boolean) {
  const s = group(root, 'AccordionPedestal');
  const velvet = kmatte('#5a1e28', 'Velvet pad', 0.88);
  shell(s, [0, 0.07, 0], [0.92, 0.14, 0.74], p.dark, 0.2);
  kcyl(s, [0, 0.38, 0], 0.14, 0.2, 0.52, p.dark, p.hd, 'y', 10);
  shell(s, [0, 0.66, 0], [0.84, 0.09, 0.64], velvet, 0.18);
  // Accordion treble side (left) anchored in velvet cradle
  const acc = group(s, '', [-0.14, 0.94, 0]);
  acc.rotation.x = -0.18;
  shell(acc, [-0.18, 0, 0], [0.18, 0.48, 0.34], p.primary, 0.18);
  kbox(acc, [-0.28, 0, 0.06], [0.055, 0.44, 0.16], p.stencil, p.hd);
  for (let i = 0; i < 7; i++) kbox(acc, [-0.31, -0.16 + i * 0.054, 0.09], [0.024, 0.028, 0.08], p.inset, p.hd);
  kbox(acc, [-0.18, 0, 0.18], [0.12, 0.4, 0.03], p.alloy, p.hd);
  // Pleated expanding bellows + pivoting right bass side
  const bass = group(root, 'BassSide', [-0.04, 0.72, 0]);
  for (let i = 0; i < 6; i++) {
    const bx = 0.04 + i * 0.048;
    const h = i % 2 === 0 ? 0.44 : 0.39;
    kbox(bass, [bx, 0.22, 0], [0.044, h, i % 2 === 0 ? 0.31 : 0.27], i % 2 === 0 ? p.dark : p.accent, p.hd);
  }
  shell(bass, [0.36, 0.22, 0], [0.16, 0.45, 0.32], p.primary, 0.18);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    korb(bass, [0.45, 0.08 + r * 0.09, -0.07 + c * 0.07], 0.018, p.stencil, p.hd);
  }
  if (detail) {
    for (let i = 0; i < 4; i++) kbox(acc, [-0.18, -0.12 + i * 0.08, 0.205], [0.08, 0.022, 0.02], p.accent, p.hd);
    if (p.hd) for (const sx of [-0.36, 0.36]) fastener(s, [sx, 0.09, 0.36], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Flex accordion bellows', 2.4, [rotationTrack('BassSide', 'z', [0, 0.6, 1.2, 1.8, 2.4], [0, -0.34, 0, -0.26, 0])]),
  ];
}

export function studioMixingDesk(root: T.Group, p: Finish, detail: boolean) {
  const d = group(root, 'MixingDesk');
  const vu = kglow('#ffd26a', '#e89624', 'VU meter');
  for (const sx of [-0.82, 0.82]) {
    kbox(d, [sx, 0.06, 0], [0.14, 0.12, 0.94], p.dark, p.hd);
    kstrut(d, [sx, 0.1, 0.24], [sx, 0.78, 0.14], 0.045, p.dark, p.hd, 8);
    kstrut(d, [sx, 0.1, -0.28], [sx, 0.78, -0.2], 0.045, p.dark, p.hd, 8);
  }
  kbox(d, [0, 0.26, -0.12], [1.62, 0.08, 0.1], p.dark, p.hd);
  // Sloped console bay with padded bolster armrest & meter bridge
  shell(d, [0, 0.82, -0.02], [1.94, 0.18, 0.96], p.primary, 0.12);
  kbox(d, [0, 0.86, 0.46], [1.92, 0.09, 0.12], p.tire, p.hd);
  for (let ch = 0; ch < 10; ch++) {
    const cx = -0.78 + ch * 0.15;
    kbox(d, [cx, 0.92, 0.02], [0.11, 0.035, 0.64], ch % 2 === 0 ? p.inset : p.edge, p.hd);
    for (let k = 0; k < 3; k++) kcyl(d, [cx, 0.95, -0.2 + k * 0.1], 0.022, 0.024, 0.032, k === 0 ? p.accent : p.alloy, p.hd, 'y', 8);
  }
  kbox(d, [0.74, 0.92, 0.06], [0.28, 0.04, 0.56], p.inset, p.hd);
  const fader = group(root, 'MasterFader', [0.74, 0.94, 0.14]);
  for (const fx of [-0.08, 0, 0.08]) {
    kbox(fader, [fx, -0.005, 0], [0.024, 0.035, 0.024], p.alloy, p.hd);
    kbox(fader, [fx, 0.025, 0], [0.052, 0.042, 0.075], p.accent, p.hd);
  }
  // Raised VU meter bridge & detachable nearfield studio monitors
  shell(d, [0, 1.04, -0.34], [1.92, 0.28, 0.26], p.dark, 0.16);
  for (let i = 0; i < 6; i++) kbox(d, [-0.68 + i * 0.27, 1.05, -0.2], [0.19, 0.15, 0.032], vu, p.hd);
  const mons = group(root, 'StudioMonitors', [0, 1.18, -0.34]);
  for (const sx of [-0.66, 0.66]) {
    kbox(mons, [sx, 0.16, 0], [0.24, 0.32, 0.24], p.dark, p.hd);
    kcyl(mons, [sx, 0.11, 0.125], 0.075, 0.075, 0.022, p.accent, p.hd, 'z', 10);
    korb(mons, [sx, 0.24, 0.12], 0.036, p.alloy, p.hd);
  }
  if (detail) {
    for (let ch = 0; ch < 10; ch++) kbox(d, [-0.78 + ch * 0.15, 0.95, 0.22], [0.044, 0.032, 0.06], p.stencil, p.hd);
    if (p.hd) for (const sx of [-0.88, 0.88]) fastener(d, [sx, 1.04, -0.2], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Ride master faders', 2.4, [slideTrack('MasterFader', [0.74, 0.94, 0.14], 2, [0, 0.6, 1.4, 2.4], [0, -0.14, 0.12, 0])]),
  ];
}

function harpsiWingShape(): T.Shape {
  const s = new T.Shape();
  s.moveTo(-0.56, -0.82);
  s.lineTo(0.56, -0.82);
  s.lineTo(0.56, -0.26);
  s.lineTo(0.24, 0.34);
  s.lineTo(-0.08, 0.98);
  s.lineTo(-0.56, 0.98);
  s.closePath();
  return s;
}

export function baroqueHarpsichord(root: T.Group, p: Finish, detail: boolean) {
  const h = group(root, 'HarpsiBody');
  // Gilded turned 4-leg baroque trestle stand
  const legs: readonly Point[] = [[-0.48, 0, 0.62], [0.48, 0, 0.62], [-0.46, 0, -0.78], [0.04, 0, -0.78]];
  for (const [lx, , lz] of legs) {
    kcyl(h, [lx, 0.38, lz], 0.048, 0.038, 0.76, p.primary, p.hd, 'y', 8);
    ring(h, [lx, 0.2, lz], 0.058, 0.02, 0.05, p.accent);
    ring(h, [lx, 0.66, lz], 0.058, 0.02, 0.05, p.accent);
  }
  kbox(h, [0, 0.2, 0.62], [0.96, 0.055, 0.06], p.accent, p.hd);
  kbox(h, [-0.21, 0.2, -0.78], [0.54, 0.055, 0.06], p.accent, p.hd);
  kstrut(h, [-0.47, 0.2, 0.62], [-0.46, 0.2, -0.78], 0.028, p.accent, p.hd, 6);
  kstrut(h, [0.48, 0.2, 0.62], [0.04, 0.2, -0.78], 0.028, p.accent, p.hd, 6);
  // Angular straight-tailed wing case & gilded soundboard rose
  const body = kextrude(h, [0, 0.85, -0.06], harpsiWingShape(), 0.24, p.primary, p.hd);
  body.rotation.x = -HPI;
  const sb = kextrude(h, [0, 0.985, -0.08], harpsiWingShape(), 0.036, p.accent, p.hd);
  sb.rotation.x = -HPI;
  sb.scale.set(0.86, 0.86, 1);
  ring(h, [-0.08, 1.01, 0.06], 0.12, 0.032, 0.026, p.primary);
  // Twin inverted baroque manuals protruding cleanly forward of wing front (z=0.76)
  kbox(h, [0, 0.78, 0.82], [1.1, 0.09, 0.36], p.primary, p.hd);
  addKeybed(h, [0, 0.85, 0.89], 0.96, 0.18, p, p.hd, true);
  addKeybed(h, [0, 0.93, 0.74], 0.96, 0.16, p, p.hd, true);
  const lid = group(root, 'HarpsiLid', [-0.55, 1.01, -0.06]);
  const plate = kextrude(lid, [0.55, 0.03, 0], harpsiWingShape(), 0.044, p.primary, p.hd);
  plate.rotation.x = -HPI;
  const rack = group(root, 'MusicRack', [0, 1.01, 0.56]);
  kbox(rack, [0, 0.12, 0], [0.64, 0.24, 0.028], p.accent, p.hd);
  if (detail) {
    for (let i = 0; i < 6; i++) kstrut(h, [-0.36 + i * 0.12, 1.01, 0.44], [-0.4 + i * 0.07, 1.01, -0.78 + i * 0.16], 0.008, p.alloy, p.hd, 6);
    for (const sx of [-0.55, 0.55]) kbox(h, [sx, 0.87, 0.78], [0.06, 0.22, 0.42], p.accent, p.hd);
    if (p.hd) for (const z of [-0.6, 0, 0.4]) fastener(h, [-0.56, 1.0, z], p, 0.022).rotation.z = HPI;
  }
  root.animations = [
    new T.AnimationClip('Raise harpsichord lid', 3.0, [rotationTrack('HarpsiLid', 'z', [0, 0.9, 2.1, 3.0], [0.42, 0.04, 0.04, 0.42])]),
    new T.AnimationClip('Fold music rack', 2.4, [rotationTrack('MusicRack', 'x', [0, 0.7, 1.7, 2.4], [0, -0.95, -0.95, 0])]),
  ];
}
