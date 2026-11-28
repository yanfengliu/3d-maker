import * as T from 'three';
import { fastener } from '../../hd-detail';
import {
  HPI, addKeybed, group, kbox, kcyl, kextrude, kglow, kmatte, korb, kpane, kstrut,
  ring, rotationTrack, shell, spinTrack,
} from './music-stage-kit';
import type { Finish, Point } from './music-stage-kit';

function grandWingShape(): T.Shape {
  const s = new T.Shape();
  s.moveTo(-0.68, -0.78);
  s.lineTo(0.68, -0.78);
  s.lineTo(0.68, -0.22);
  s.bezierCurveTo(0.68, 0.2, 0.34, 0.38, 0.24, 0.72);
  s.bezierCurveTo(0.14, 1.02, -0.44, 1.06, -0.62, 0.84);
  s.lineTo(-0.68, 0.56);
  s.closePath();
  return s;
}

export function concertGrandPiano(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'PianoBody');
  const legPos: readonly Point[] = [[-0.54, 0, 0.56], [0.54, 0, 0.56], [-0.14, 0, -0.72]];
  for (const [lx, , lz] of legPos) {
    kcyl(body, [lx, 0.05, lz], 0.052, 0.052, 0.1, p.accent, p.hd, 'y', 8);
    kcyl(body, [lx, 0.42, lz], 0.072, 0.048, 0.68, p.primary, p.hd, 'y', 8);
    kbox(body, [lx, 0.74, lz], [0.16, 0.07, 0.16], p.dark, p.hd);
  }
  // Pedal lyre connecting base to case
  kbox(body, [0, 0.14, 0.44], [0.34, 0.09, 0.12], p.primary, p.hd);
  for (const sx of [-0.12, 0.12]) kstrut(body, [sx, 0.18, 0.44], [sx, 0.74, 0.44], 0.022, p.accent, p.hd, 6);
  for (const px of [-0.08, 0, 0.08]) kbox(body, [px, 0.14, 0.54], [0.036, 0.024, 0.12], p.accent, p.hd);
  const rim = kextrude(body, [0, 0.87, -0.04], grandWingShape(), 0.26, p.primary, p.hd);
  rim.rotation.x = -HPI;
  const harp = kextrude(body, [0, 0.96, -0.06], grandWingShape(), 0.045, p.accent, p.hd);
  harp.rotation.x = -HPI;
  harp.scale.set(0.86, 0.86, 1);
  // Keybed apron & cheekblocks
  kbox(body, [0, 0.77, 0.72], [1.34, 0.1, 0.34], p.primary, p.hd);
  for (const sx of [-0.62, 0.62]) kbox(body, [sx, 0.86, 0.72], [0.1, 0.14, 0.34], p.primary, p.hd);
  addKeybed(body, [0, 0.84, 0.74], 1.12, 0.24, p, p.hd);
  // Propped grand lid hinged on left rim
  const lid = group(root, 'PianoLid', [-0.66, 1.02, -0.04]);
  const lidPlate = kextrude(lid, [0.66, 0.03, 0], grandWingShape(), 0.048, p.primary, p.hd);
  lidPlate.rotation.x = -HPI;
  kstrut(body, [0.56, 0.98, 0.16], [0.36, 1.46, 0.16], 0.018, p.accent, p.hd, 6);
  const fall = group(root, 'Fallboard', [0, 0.91, 0.62]);
  kbox(fall, [0, 0.02, 0.12], [1.14, 0.038, 0.24], p.primary, p.hd);
  kbox(fall, [0, 0.044, 0.22], [0.36, 0.018, 0.03], p.accent, p.hd);
  if (detail) {
    for (let i = 0; i < 6; i++) kstrut(body, [-0.46 + i * 0.15, 0.99, 0.45], [-0.42 + i * 0.1, 0.99, -0.68 + i * 0.1], 0.008, p.alloy, p.hd, 6);
    kbox(body, [0, 1.07, 0.56], [0.68, 0.22, 0.028], p.dark, p.hd).rotation.x = -0.22;
    if (p.hd) for (const z of [-0.55, 0.0, 0.42]) fastener(body, [-0.67, 1.0, z], p, 0.022).rotation.z = HPI;
  }
  root.animations = [
    new T.AnimationClip('Lift grand lid', 3.2, [rotationTrack('PianoLid', 'z', [0, 1.0, 2.2, 3.2], [0.46, 0.06, 0.06, 0.46])]),
    new T.AnimationClip('Open fallboard', 2.4, [rotationTrack('Fallboard', 'x', [0, 0.7, 1.7, 2.4], [0, -1.25, -1.25, 0])]),
  ];
}

export function celticFloorHarp(root: T.Group, p: Finish, detail: boolean) {
  const frame = group(root, 'HarpFrame');
  shell(frame, [0, 0.07, 0], [0.84, 0.14, 0.78], p.dark, 0.22);
  shell(frame, [0, 0.17, 0], [0.72, 0.08, 0.66], p.primary, 0.22);
  // Tapered soundbox rising rearward
  const sb = group(frame, '', [0, 0.2, 0.14]);
  sb.rotation.x = -0.34;
  kcyl(sb, [0, 0.76, 0], 0.09, 0.2, 1.52, p.primary, p.hd, 'y', 8);
  kbox(sb, [0, 0.76, 0.09], [0.16, 1.44, 0.05], p.accent, p.hd);
  // Carved forepillar column at front
  kcyl(frame, [0, 0.98, 0.24], 0.048, 0.065, 1.62, p.primary, p.hd, 'y', 10);
  ring(frame, [0, 0.3, 0.24], 0.082, 0.024, 0.065, p.accent);
  ring(frame, [0, 1.74, 0.24], 0.078, 0.024, 0.07, p.accent);
  korb(frame, [0, 1.85, 0.24], 0.072, p.accent, p.hd);
  // S-curved harmonic neck joining column top to soundbox crown
  const neckPts: readonly Point[] = [[0, 1.76, 0.24], [0, 1.66, 0.06], [0, 1.58, -0.14], [0, 1.62, -0.36]];
  for (let i = 0; i < neckPts.length - 1; i++) {
    const a = neckPts[i], b = neckPts[i + 1];
    if (a && b) kstrut(frame, a, b, 0.044, p.primary, p.hd, 8);
  }
  // Tensioned vertical brass strings anchored between neck & soundbox
  for (let i = 0; i < 10; i++) {
    const t = (i + 1) / 11;
    const z = 0.18 - t * 0.46;
    const yTop = 1.72 - Math.sin(t * Math.PI) * 0.14;
    const yBot = 0.22 + t * 1.16;
    kstrut(frame, [0, yBot, z], [0, yTop, z], 0.008, p.accent, p.hd, 6);
  }
  const rail = group(root, 'LeverRail', [0.05, 1.64, -0.04]);
  kbox(rail, [0, 0, 0], [0.032, 0.055, 0.52], p.accent, p.hd);
  for (let i = 0; i < 7; i++) kcyl(rail, [0.024, 0, -0.21 + i * 0.07], 0.012, 0.012, 0.035, p.alloy, p.hd, 'x', 8);
  const stand = group(root, 'MusicRest', [0.34, 0.2, 0]);
  kstrut(stand, [0, 0, 0], [0, 0.72, 0], 0.022, p.dark, p.hd, 8);
  kbox(stand, [0, 0.78, 0.02], [0.34, 0.24, 0.03], p.primary, p.hd).rotation.x = -0.32;
  if (detail) {
    for (const s of [-1, 1]) kbox(frame, [s * 0.06, 0.24, 0.18], [0.04, 0.12, 0.28], p.accent, p.hd);
    kbox(stand, [0, 0.79, 0.04], [0.28, 0.18, 0.016], p.stencil, p.hd).rotation.x = -0.32;
    if (p.hd) for (let i = 0; i < 4; i++) fastener(frame, [0, 0.5 + i * 0.34, 0.305], p, 0.02).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Flip sharping levers', 2.6, [rotationTrack('LeverRail', 'z', [0, 0.65, 1.4, 2.6], [0, 0.32, -0.24, 0])]),
  ];
}

export function fivePieceDrumKit(root: T.Group, p: Finish, detail: boolean) {
  const kit = group(root, 'DrumKit');
  shell(kit, [0, 0.035, 0], [1.9, 0.07, 1.38], p.dark, 0.16);
  // Kick bass drum
  kcyl(kit, [0, 0.42, 0.06], 0.35, 0.35, 0.56, p.primary, p.hd, 'z', 12);
  for (const sz of [-0.28, 0.36]) {
    ring(kit, [0, 0.42, sz], 0.36, 0.028, 0.05, p.accent).rotation.x = HPI;
    kcyl(kit, [0, 0.42, sz - 0.01 * Math.sign(sz)], 0.33, 0.33, 0.03, p.stencil, p.hd, 'z', 12);
  }
  for (const sx of [-0.34, 0.34]) kstrut(kit, [sx, 0.28, 0.2], [sx * 1.32, 0.06, 0.28], 0.018, p.alloy, p.hd, 6);
  // Twin rack toms mounted on bass drum post
  kstrut(kit, [0, 0.74, 0.06], [0, 1.06, 0.06], 0.022, p.alloy, p.hd, 8);
  for (const [sx, r] of [[-0.22, 0.17], [0.22, 0.19]] as const) {
    kstrut(kit, [0, 1.0, 0.06], [sx, 1.02, 0.04], 0.018, p.alloy, p.hd, 6);
    const tom = group(kit, '', [sx, 1.0, 0.02]);
    tom.rotation.x = 0.28;
    kcyl(tom, [0, 0, 0], r, r, 0.22, p.primary, p.hd, 'y', 10);
    kcyl(tom, [0, 0.115, 0], r * 0.96, r * 0.96, 0.024, p.stencil, p.hd, 'y', 10);
  }
  // Floor tom right & snare drum left
  kcyl(kit, [0.58, 0.52, -0.14], 0.24, 0.24, 0.42, p.primary, p.hd, 'y', 10);
  kcyl(kit, [0.58, 0.735, -0.14], 0.23, 0.23, 0.026, p.stencil, p.hd, 'y', 10);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    kstrut(kit, [0.58 + Math.cos(a) * 0.22, 0.44, -0.14 + Math.sin(a) * 0.22], [0.58 + Math.cos(a) * 0.26, 0.06, -0.14 + Math.sin(a) * 0.26], 0.016, p.alloy, p.hd, 6);
  }
  kstrut(kit, [-0.52, 0.06, -0.18], [-0.52, 0.68, -0.18], 0.022, p.alloy, p.hd, 8);
  kcyl(kit, [-0.52, 0.72, -0.18], 0.2, 0.2, 0.14, p.alloy, p.hd, 'y', 10);
  kcyl(kit, [-0.52, 0.795, -0.18], 0.19, 0.19, 0.022, p.stencil, p.hd, 'y', 10);
  // Hi-hat stand left + crash boom stand right
  kstrut(kit, [-0.74, 0.06, 0.1], [-0.74, 1.16, 0.1], 0.018, p.alloy, p.hd, 8);
  kcyl(kit, [-0.74, 1.06, 0.1], 0.18, 0.2, 0.036, p.accent, p.hd, 'y', 12);
  kstrut(kit, [0.72, 0.06, 0.22], [0.72, 1.32, 0.22], 0.02, p.alloy, p.hd, 8);
  const crash = group(root, 'CrashCymbal', [0.72, 1.34, 0.22]);
  kcyl(crash, [0, 0, 0], 0.08, 0.28, 0.042, p.accent, p.hd, 'y', 12);
  korb(crash, [0, 0.03, 0], 0.042, p.alloy, p.hd);
  const beater = group(root, 'KickBeater', [0, 0.09, -0.32]);
  kbox(beater, [0, 0.02, -0.1], [0.1, 0.03, 0.24], p.alloy, p.hd);
  kstrut(beater, [0, 0.04, 0.02], [0, 0.34, 0.06], 0.014, p.alloy, p.hd, 6);
  korb(beater, [0, 0.35, 0.07], 0.042, p.stencil, p.hd);
  const throne = group(root, 'DrumThrone', [0, 0.07, -0.52]);
  kcyl(throne, [0, 0.24, 0], 0.034, 0.042, 0.48, p.alloy, p.hd, 'y', 8);
  kcyl(throne, [0, 0.5, 0], 0.18, 0.18, 0.09, p.tire, p.hd, 'y', 10);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      kbox(kit, [Math.cos(a) * 0.36, 0.42 + Math.sin(a) * 0.36, 0.06], [0.032, 0.032, 0.48], p.alloy, p.hd);
    }
    if (p.hd) for (const sx of [-0.74, 0.72]) fastener(kit, [sx, 0.08, 0.18], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Kick and crash', 2.0, [
      rotationTrack('KickBeater', 'x', [0, 0.25, 0.6, 1.0, 1.4, 2.0], [0, 0.48, 0, 0.48, 0, 0]),
      rotationTrack('CrashCymbal', 'x', [0, 0.4, 1.0, 1.5, 2.0], [0, 0.36, -0.26, 0.18, 0]),
    ]),
  ];
}

export function rosewoodMarimba(root: T.Group, p: Finish, detail: boolean) {
  const m = group(root, 'MarimbaFrame');
  for (const sx of [-0.82, 0.82]) {
    kbox(m, [sx, 0.46, 0], [0.08, 0.82, 0.74], p.dark, p.hd);
    for (const sz of [-0.3, 0.3]) {
      kcyl(m, [sx, 0.055, sz], 0.055, 0.055, 0.05, p.tire, p.hd, 'x', 8);
      kstrut(m, [sx, 0.08, sz], [sx, 0.86, sz], 0.024, p.alloy, p.hd, 8);
    }
  }
  kbox(m, [0, 0.24, 0], [1.62, 0.065, 0.09], p.dark, p.hd);
  // Stepped rails & 11 graduated rosewood tone bars + tubular brass resonators
  for (const sz of [-0.26, 0.24]) kbox(m, [0, 0.88, sz], [1.72, 0.065, 0.065], p.primary, p.hd);
  kbox(m, [0, 0.82, 0.04], [1.66, 0.06, 0.09], p.dark, p.hd);
  kbox(m, [0, 0.95, -0.22], [1.66, 0.06, 0.09], p.dark, p.hd);
  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const x = -0.68 + i * 0.136;
    const barLen = 0.56 - t * 0.22;
    const pipeH = 0.58 - t * 0.3;
    kbox(m, [x, 0.94, 0.02], [0.092, 0.036, barLen], p.primary, p.hd);
    kcyl(m, [x, 0.85 - pipeH * 0.5, 0.04], 0.036, 0.032, pipeH, p.accent, p.hd, 'y', 8);
    if (i % 7 !== 2 && i % 7 !== 6 && i < 10) {
      kbox(m, [x + 0.065, 1.0, -0.22], [0.075, 0.036, barLen * 0.62], p.dark, p.hd);
    }
  }
  // Articulated mallet bridge mounted to front rail
  const arm = group(root, 'MalletArm', [0, 0.94, 0.32]);
  kbox(arm, [0, 0, 0], [0.44, 0.05, 0.06], p.alloy, p.hd);
  for (const sx of [-0.18, 0.18]) {
    kstrut(arm, [sx, 0.02, 0], [sx, 0.18, -0.26], 0.012, p.stencil, p.hd, 6);
    korb(arm, [sx, 0.19, -0.27], 0.044, p.accent, p.hd);
  }
  if (detail) {
    for (const sx of [-0.82, 0.82]) kbox(m, [sx, 0.54, 0], [0.11, 0.36, 0.56], p.primary, p.hd);
    for (let i = 0; i < 11; i++) korb(m, [-0.68 + i * 0.136, 0.96, 0.2], 0.016, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.82, 0.82]) fastener(m, [sx, 0.88, 0.34], p, 0.026).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Strike marimba', 2.0, [rotationTrack('MalletArm', 'x', [0, 0.4, 0.9, 1.4, 2.0], [0, 0.42, -0.18, 0.42, 0])]),
  ];
}

export function chapelPipeOrgan(root: T.Group, p: Finish, detail: boolean) {
  const o = group(root, 'OrganCase');
  shell(o, [0, 0.07, 0], [1.66, 0.14, 1.04], p.dark, 0.16);
  // Foot pedalboard protruding cleanly at front floor
  kbox(o, [0, 0.12, 0.48], [0.96, 0.06, 0.34], p.dark, p.hd);
  for (let i = 0; i < 8; i++) kbox(o, [-0.38 + i * 0.108, 0.17, 0.52], [0.055, 0.04, 0.28], p.primary, p.hd);
  // Main paneled oak lower console & twin keyboard manuals
  shell(o, [0, 0.66, -0.04], [1.56, 1.08, 0.86], p.primary, 0.12);
  kbox(o, [0, 0.86, 0.44], [1.12, 0.1, 0.32], p.dark, p.hd);
  addKeybed(o, [0, 0.93, 0.46], 1.02, 0.2, p, p.hd);
  addKeybed(o, [0, 1.03, 0.34], 1.02, 0.18, p, p.hd);
  // Upper pipe chest & 11 graduated cathedral prospect pipes
  kbox(o, [0, 1.72, -0.24], [1.52, 1.18, 0.44], p.primary, p.hd);
  for (const sx of [-0.72, 0.72]) kbox(o, [sx, 1.72, 0.04], [0.14, 1.24, 0.56], p.primary, p.hd);
  shell(o, [0, 2.38, -0.06], [1.72, 0.16, 0.84], p.dark, 0.2);
  for (let i = 0; i < 11; i++) {
    const dist = Math.abs(i - 5);
    const h = 1.14 - dist * 0.095;
    const x = -0.55 + i * 0.11;
    kcyl(o, [x, 1.24 + h * 0.5, 0.08], 0.042, 0.042, h, i % 2 === 0 ? p.accent : p.alloy, p.hd, 'y', 8);
    kcyl(o, [x, 1.24, 0.08], 0.042, 0.016, 0.12, p.accent, p.hd, 'y', 8);
  }
  const shL = group(root, 'SwellShutterL', [-0.64, 1.72, 0.28]);
  kbox(shL, [0.3, 0, 0], [0.58, 1.06, 0.05], p.primary, p.hd);
  kbox(shL, [0.3, 0, 0.036], [0.46, 0.88, 0.025], p.accent, p.hd);
  const shR = group(root, 'SwellShutterR', [0.64, 1.72, 0.28]);
  kbox(shR, [-0.3, 0, 0], [0.58, 1.06, 0.05], p.primary, p.hd);
  kbox(shR, [-0.3, 0, 0.036], [0.46, 0.88, 0.025], p.accent, p.hd);
  if (detail) {
    for (const sx of [-0.62, 0.62]) {
      for (const y of [0.96, 1.06, 1.16]) korb(o, [sx, y, 0.42], 0.026, p.stencil, p.hd);
    }
    for (const sx of [-0.74, 0, 0.74]) kcyl(o, [sx, 2.54, -0.06], 0.02, 0.055, 0.18, p.accent, p.hd, 'y', 8);
    if (p.hd) for (const sx of [-0.64, 0.64]) fastener(o, [sx, 2.38, 0.36], p, 0.026).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Open swell shutters', 3.0, [
      rotationTrack('SwellShutterL', 'y', [0, 0.9, 2.1, 3.0], [0, -1.15, -1.15, 0]),
      rotationTrack('SwellShutterR', 'y', [0, 0.9, 2.1, 3.0], [0, 1.15, 1.15, 0]),
    ]),
  ];
}

export function modularSynthRack(root: T.Group, p: Finish, detail: boolean) {
  const r = group(root, 'SynthRack');
  const led = kglow('#74ff98', '#22cc55', 'Synth LED');
  shell(r, [0, 0.07, 0], [1.18, 0.14, 0.82], p.dark, 0.16);
  for (const sx of [-0.55, 0.55]) {
    kbox(r, [sx, 0.66, -0.04], [0.09, 1.1, 0.72], p.primary, p.hd);
    kbox(r, [sx, 0.66, 0.34], [0.05, 1.04, 0.06], p.accent, p.hd);
  }
  kbox(r, [0, 0.66, -0.14], [1.04, 1.08, 0.48], p.dark, p.hd);
  // Slanted lower rack faceplate & patch jack modules
  const lower = group(r, '', [0, 0.68, 0.18]);
  lower.rotation.x = -0.16;
  kbox(lower, [0, 0, 0], [1.0, 0.94, 0.12], p.inset, p.hd);
  for (let row = 0; row < 3; row++) {
    const ry = -0.28 + row * 0.28;
    kbox(lower, [0, ry, 0.075], [0.94, 0.22, 0.032], row === 1 ? p.primary : p.alloy, p.hd);
    for (let col = 0; col < 5; col++) {
      kcyl(lower, [-0.36 + col * 0.18, ry + 0.04, 0.105], 0.032, 0.036, 0.04, col % 2 === 0 ? p.accent : p.dark, p.hd, 'z', 8);
      kcyl(lower, [-0.36 + col * 0.18, ry - 0.05, 0.1], 0.018, 0.018, 0.025, p.edge, p.hd, 'z', 8);
    }
  }
  // Upper hinged tilting sequencer bay
  const seq = group(root, 'SequencerBay', [0, 1.22, -0.06]);
  kbox(seq, [0, 0.22, 0], [1.14, 0.44, 0.48], p.primary, p.hd);
  kbox(seq, [0, 0.22, 0.26], [0.98, 0.34, 0.04], p.inset, p.hd);
  kbox(seq, [-0.24, 0.24, 0.29], [0.36, 0.22, 0.028], led, p.hd);
  for (let i = 0; i < 4; i++) kbox(seq, [0.12 + i * 0.095, 0.18, 0.29], [0.06, 0.06, 0.03], p.accent, p.hd);
  const wheel = group(root, 'ModWheel', [-0.42, 0.22, 0.34]);
  kcyl(wheel, [0, 0, 0], 0.08, 0.08, 0.065, p.accent, p.hd, 'x', 10);
  if (detail) {
    kstrut(lower, [-0.36, -0.33, 0.11], [-0.1, 0.04, 0.19], 0.012, p.accent, p.hd, 6);
    kstrut(lower, [-0.1, 0.04, 0.19], [0.18, 0.23, 0.11], 0.012, p.accent, p.hd, 6);
    for (let i = 0; i < 6; i++) kbox(r, [-0.35 + i * 0.14, 0.56, -0.39], [0.09, 0.42, 0.024], p.edge, p.hd);
    if (p.hd) for (const sx of [-0.52, 0.52]) fastener(seq, [sx, 0.36, 0.24], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Tilt sequencer bay', 2.8, [rotationTrack('SequencerBay', 'x', [0, 0.8, 1.9, 2.8], [0, 0.42, 0.42, 0])]),
    new T.AnimationClip('Sweep mod wheel', 2.0, [rotationTrack('ModWheel', 'x', [0, 0.5, 1.2, 2.0], [0, 0.72, -0.68, 0])]),
  ];
}

export function clubDjBooth(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'DjBooth');
  const neon = kglow('#74f7ee', '#1ad4c8', 'Club neon');
  shell(b, [0, 0.07, 0], [1.84, 0.14, 0.92], p.dark, 0.14);
  shell(b, [0, 0.54, 0], [1.74, 0.84, 0.84], p.primary, 0.14);
  shell(b, [0, 0.99, 0], [1.86, 0.09, 0.94], p.dark, 0.14);
  for (const y of [0.34, 0.56, 0.78]) kbox(b, [0, y, 0.44], [1.46, 0.06, 0.036], neon, p.hd);
  // Central club mixer & twin spinning platters
  kbox(b, [0, 1.07, 0], [0.46, 0.08, 0.54], p.inset, p.hd);
  for (let i = 0; i < 4; i++) kbox(b, [-0.14 + i * 0.093, 1.12, 0.12], [0.036, 0.036, 0.16], p.accent, p.hd);
  for (const [name, sx] of [['PlatterL', -0.56], ['PlatterR', 0.56]] as const) {
    kbox(b, [sx, 1.06, 0], [0.54, 0.065, 0.54], p.edge, p.hd);
    const plat = group(root, name, [sx, 1.11, 0]);
    kcyl(plat, [0, 0, 0], 0.21, 0.22, 0.04, p.inset, p.hd, 'y', 12);
    ring(plat, [0, 0.01, 0], 0.225, 0.022, 0.032, p.accent);
    kbox(plat, [0.1, 0.026, 0], [0.12, 0.018, 0.034], p.stencil, p.hd);
  }
  // Overhead stage light truss arch
  for (const sx of [-0.84, 0.84]) kstrut(b, [sx, 1.02, -0.34], [sx, 1.94, -0.34], 0.036, p.alloy, p.hd, 8);
  kstrut(b, [-0.86, 1.92, -0.34], [0.86, 1.92, -0.34], 0.036, p.alloy, p.hd, 8);
  for (const sx of [-0.52, 0, 0.52]) {
    kcyl(b, [sx, 1.82, -0.24], 0.06, 0.085, 0.18, p.dark, p.hd, 'z', 8);
    korb(b, [sx, 1.82, -0.14], 0.052, neon, p.hd);
  }
  if (detail) {
    for (let i = 0; i < 4; i++) for (let r = 0; r < 3; r++) kcyl(b, [-0.14 + i * 0.093, 1.12, -0.05 - r * 0.08], 0.022, 0.024, 0.032, p.stencil, p.hd, 'y', 8);
    for (const sx of [-0.84, 0.84]) kstrut(b, [sx, 1.62, -0.34], [sx * 0.72, 1.92, -0.34], 0.02, p.accent, p.hd, 6);
    if (p.hd) for (const sx of [-0.74, 0.74]) fastener(b, [sx, 0.99, 0.47], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Spin club decks', 2.4, [spinTrack('PlatterL', 'y', 2.4, 2), spinTrack('PlatterR', 'y', 2.4, -2)]),
  ];
}

export function wurlitzerJukebox(root: T.Group, p: Finish, detail: boolean) {
  const j = group(root, 'JukeboxBody');
  const amber = kglow('#ffd26a', '#e89624', 'Jukebox tube');
  shell(j, [0, 0.09, 0], [1.12, 0.18, 0.84], p.dark, 0.16);
  shell(j, [0, 0.76, -0.04], [1.06, 1.2, 0.74], p.primary, 0.12);
  // Iconic circular arch crown
  kcyl(j, [0, 1.36, -0.04], 0.53, 0.53, 0.74, p.primary, p.hd, 'z', 14);
  ring(j, [0, 1.36, 0.34], 0.52, 0.065, 0.075, p.accent).rotation.x = HPI;
  ring(j, [0, 1.36, 0.36], 0.43, 0.045, 0.05, amber).rotation.x = HPI;
  // Twin glowing bubble pilasters
  for (const sx of [-0.46, 0.46]) {
    kcyl(j, [sx, 0.76, 0.35], 0.065, 0.065, 1.14, amber, p.hd, 'y', 10);
    for (const y of [0.34, 0.76, 1.18]) ring(j, [sx, y, 0.35], 0.08, 0.022, 0.045, p.alloy);
  }
  // Speaker grille lower bay & glass record showcase upper bay
  kbox(j, [0, 0.54, 0.34], [0.74, 0.66, 0.06], p.inset, p.hd);
  for (let i = 0; i < 5; i++) kbox(j, [-0.26 + i * 0.13, 0.54, 0.38], [0.036, 0.6, 0.032], p.accent, p.hd);
  kbox(j, [0, 1.24, 0.14], [0.74, 0.54, 0.34], p.inset, p.hd);
  kpane(j, [0, 1.24, 0.34], [0.72, 0.5, 0.022]);
  const deck = group(root, 'RecordDeck', [0, 1.06, 0.16]);
  kcyl(deck, [0, 0.02, 0], 0.22, 0.22, 0.032, p.tire, p.hd, 'y', 12);
  kcyl(deck, [0, 0.042, 0], 0.075, 0.075, 0.02, p.accent, p.hd, 'y', 10);
  kbox(deck, [0.1, 0.04, 0], [0.12, 0.015, 0.032], p.stencil, p.hd);
  const arm = group(root, 'SelectorArm', [0.24, 1.12, 0.14]);
  kstrut(arm, [0, 0, 0], [-0.2, 0.04, 0.06], 0.016, p.alloy, p.hd, 6);
  kbox(arm, [-0.21, 0.04, 0.06], [0.05, 0.035, 0.04], p.accent, p.hd);
  if (detail) {
    for (let i = 0; i < 6; i++) kbox(j, [-0.25 + i * 0.1, 0.94, 0.37], [0.065, 0.05, 0.035], p.stencil, p.hd);
    if (p.hd) for (const sx of [-0.36, 0, 0.36]) fastener(j, [sx, 0.1, 0.42], p, 0.026).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Spin jukebox record', 2.8, [
      spinTrack('RecordDeck', 'y', 2.8, 2),
      rotationTrack('SelectorArm', 'y', [0, 0.7, 1.8, 2.8], [0, 0.55, 0.55, 0]),
    ]),
  ];
}

function bowedBodyShape(w1: number, w2: number, h: number): T.Shape {
  const s = new T.Shape();
  s.moveTo(0, -h * 0.5);
  s.bezierCurveTo(w2, -h * 0.5, w2 * 1.06, -h * 0.14, w1 * 0.58, 0.02);
  s.bezierCurveTo(w1 * 0.95, h * 0.16, w1 * 0.96, h * 0.48, 0, h * 0.5);
  s.bezierCurveTo(-w1 * 0.96, h * 0.48, -w1 * 0.95, h * 0.16, -w1 * 0.58, 0.02);
  s.bezierCurveTo(-w2 * 1.06, -h * 0.14, -w2, -h * 0.5, 0, -h * 0.5);
  return s;
}

export function celloDisplayStand(root: T.Group, p: Finish, detail: boolean) {
  const st = group(root, 'CelloStand');
  // Grounded A-frame studio stand
  for (const sx of [-0.38, 0.38]) {
    kstrut(st, [sx, 0.04, 0.38], [sx * 0.46, 0.92, -0.06], 0.034, p.dark, p.hd, 8);
    kstrut(st, [sx, 0.04, -0.38], [sx * 0.46, 0.92, -0.06], 0.034, p.dark, p.hd, 8);
    kcyl(st, [sx, 0.03, 0.38], 0.045, 0.05, 0.06, p.tire, p.hd, 'y', 8);
    kcyl(st, [sx, 0.03, -0.38], 0.045, 0.05, 0.06, p.tire, p.hd, 'y', 8);
  }
  kbox(st, [0, 0.12, 0.28], [0.76, 0.06, 0.08], p.dark, p.hd);
  kbox(st, [0, 0.26, 0.12], [0.68, 0.06, 0.32], p.dark, p.hd);
  kstrut(st, [0, 0.06, 0.12], [0, 0.32, 0.1], 0.018, p.alloy, p.hd, 8);
  // Sculpted cello body leaning slightly back in stand
  const cello = group(st, '', [0, 0.72, 0.08]);
  cello.rotation.x = -0.14;
  kextrude(cello, [0, 0, 0], bowedBodyShape(0.24, 0.3, 0.84), 0.16, p.primary, p.hd);
  kbox(cello, [0, 0.18, 0.095], [0.075, 0.54, 0.04], p.inset, p.hd);
  kbox(cello, [0, -0.26, 0.105], [0.09, 0.2, 0.035], p.dark, p.hd);
  kbox(cello, [0, -0.04, 0.115], [0.14, 0.032, 0.045], p.accent, p.hd);
  kbox(cello, [0, 0.6, 0.01], [0.062, 0.42, 0.065], p.primary, p.hd);
  kbox(cello, [0, 0.64, 0.055], [0.068, 0.42, 0.032], p.inset, p.hd);
  korb(cello, [0, 0.86, 0.01], 0.055, p.accent, p.hd);
  for (const sx of [-1, 1]) for (const py of [0.74, 0.81]) kcyl(cello, [sx * 0.065, py, 0.01], 0.016, 0.016, 0.08, p.dark, p.hd, 'x', 8);
  // Pivoting bow mounted on side stand bracket
  kstrut(st, [0.22, 0.76, -0.04], [0.38, 0.76, 0.16], 0.018, p.accent, p.hd, 6);
  const bow = group(root, 'CelloBow', [0.38, 0.76, 0.18]);
  kstrut(bow, [0, -0.44, 0], [0, 0.46, 0], 0.014, p.primary, p.hd, 6);
  kstrut(bow, [-0.032, -0.42, 0], [-0.032, 0.44, 0], 0.008, p.stencil, p.hd, 6);
  kbox(bow, [-0.016, -0.42, 0], [0.048, 0.06, 0.028], p.dark, p.hd);
  if (detail) {
    for (const sx of [-0.14, 0.14]) kbox(cello, [sx, -0.04, 0.09], [0.022, 0.18, 0.018], p.inset, p.hd).rotation.z = sx * 1.1;
    for (let i = 0; i < 4; i++) kstrut(cello, [-0.024 + i * 0.016, -0.18, 0.12], [-0.018 + i * 0.012, 0.76, 0.08], 0.005, p.alloy, p.hd, 6);
    if (p.hd) for (const sx of [-0.3, 0.3]) fastener(st, [sx, 0.12, 0.325], p, 0.02).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Draw cello bow', 2.6, [rotationTrack('CelloBow', 'z', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.42, 0, -0.36, 0])]),
  ];
}

export function vinylTurntableConsole(root: T.Group, p: Finish, detail: boolean) {
  const c = group(root, 'HiFiConsole');
  const cloth = kmatte('#b8ab92', 'Speaker fabric', 0.88);
  for (const sx of [-0.68, 0.68]) for (const sz of [-0.26, 0.26]) {
    kstrut(c, [sx, 0.04, sz], [sx * 0.92, 0.36, sz * 0.86], 0.036, p.primary, p.hd, 8);
    kcyl(c, [sx, 0.04, sz], 0.036, 0.032, 0.08, p.accent, p.hd, 'y', 8);
  }
  shell(c, [0, 0.64, 0], [1.56, 0.56, 0.7], p.primary, 0.14);
  for (const sx of [-0.52, 0.52]) {
    kbox(c, [sx, 0.64, 0.36], [0.42, 0.44, 0.035], cloth, p.hd);
    for (let i = 0; i < 4; i++) kbox(c, [sx, 0.48 + i * 0.1, 0.385], [0.38, 0.024, 0.02], p.accent, p.hd);
  }
  // Center vinyl record cubby with stacked LP spines
  kbox(c, [0, 0.64, 0.22], [0.46, 0.42, 0.28], p.inset, p.hd);
  for (let i = 0; i < 6; i++) {
    kbox(c, [-0.16 + i * 0.064, 0.62, 0.28], [0.032, 0.36, 0.26], i % 2 === 0 ? p.accent : p.stencil, p.hd).rotation.z = 0.06;
  }
  // Top turntable deck, spinning LP, tonearm & hinged dust cover
  kbox(c, [0, 0.94, 0], [0.76, 0.06, 0.56], p.dark, p.hd);
  const plat = group(root, 'VinylPlatter', [-0.08, 0.99, 0]);
  kcyl(plat, [0, 0, 0], 0.21, 0.22, 0.036, p.tire, p.hd, 'y', 12);
  kcyl(plat, [0, 0.024, 0], 0.072, 0.072, 0.018, p.accent, p.hd, 'y', 10);
  kbox(plat, [0.1, 0.024, 0], [0.11, 0.015, 0.028], p.stencil, p.hd);
  const arm = group(root, 'ToneArm', [0.24, 1.0, -0.16]);
  kcyl(arm, [0, 0, 0], 0.042, 0.048, 0.06, p.alloy, p.hd, 'y', 8);
  kstrut(arm, [0, 0.03, 0], [-0.14, 0.03, 0.28], 0.012, p.alloy, p.hd, 6);
  kbox(arm, [-0.16, 0.02, 0.3], [0.042, 0.028, 0.065], p.accent, p.hd);
  const cover = group(root, 'DustCover', [0, 0.97, -0.27]);
  kpane(cover, [0, 0.14, 0.27], [0.74, 0.024, 0.54]);
  kbox(cover, [0, 0.07, 0.02], [0.74, 0.14, 0.03], p.dark, p.hd);
  for (const sx of [-0.36, 0.36]) kbox(cover, [sx, 0.07, 0.27], [0.026, 0.14, 0.52], p.alloy, p.hd);
  if (detail) {
    for (const sx of [0.46, 0.58]) kcyl(c, [sx, 0.94, 0.24], 0.032, 0.034, 0.045, p.accent, p.hd, 'y', 8);
    if (p.hd) for (const sx of [-0.62, 0.62]) fastener(c, [sx, 0.92, -0.35], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Play vinyl record', 2.8, [
      spinTrack('VinylPlatter', 'y', 2.8, 2),
      rotationTrack('ToneArm', 'y', [0, 0.7, 1.9, 2.8], [0, -0.38, -0.38, 0]),
    ]),
    new T.AnimationClip('Lift dust cover', 2.6, [rotationTrack('DustCover', 'x', [0, 0.75, 1.9, 2.6], [0, -1.05, -1.05, 0])]),
  ];
}
