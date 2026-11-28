import * as T from 'three';
import { group, rotationTrack, spinTrack } from '../../parts';
import type { Finish } from '../../parts';
import {
  HPI, band, blk, bolt, caster, cyl, lathe, orb, pipe, rod, slab, slideTrack, tone, torus,
} from './sports-play-kit';

export function slateBilliardTable(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'BilliardCabinet');
  const legProf: readonly (readonly [number, number])[] = [
    [0, 0], [0.055, 0], [0.068, 0.08], [0.05, 0.22], [0.075, 0.38], [0.055, 0.5], [0.082, 0.62], [0, 0.62],
  ];
  for (const sx of [-0.52, 0.52]) for (const sz of [-0.92, 0.92]) {
    cyl(g, [sx, 0.03, sz], 0.056, 0.064, 0.06, p.edge, hd);
    lathe(g, [sx, 0.04, sz], legProf, p.primary, hd, 10);
  }
  slab(g, [0, 0.72, 0], [1.26, 0.22, 2.12], p.primary, hd, 0.14);
  blk(g, [0, 0.84, 0], [1.12, 0.04, 1.98], p.accent, hd);
  for (const sz of [-1.01, 1.01]) {
    blk(g, [0, 0.88, sz], [0.94, 0.072, 0.12], p.primary, hd);
    blk(g, [0, 0.87, sz * 0.935], [0.9, 0.045, 0.04], p.accent, hd);
  }
  for (const sx of [-0.58, 0.58]) {
    for (const sz of [-0.49, 0.49]) {
      blk(g, [sx, 0.88, sz], [0.12, 0.072, 0.82], p.primary, hd);
      blk(g, [sx * 0.885, 0.87, sz], [0.04, 0.045, 0.78], p.accent, hd);
    }
    for (const sz of [-1.0, 0, 1.0]) {
      band(g, [sx, 0.885, sz], 0.08, 0.025, 0.068, p.dark, hd);
      cyl(g, [sx, 0.77, sz], 0.062, 0.048, 0.16, p.tire, hd);
    }
  }
  orb(g, [0, 0.892, 0.52], 0.034, p.stencil, hd);
  blk(g, [0, 0.922, 1.01], [0.08, 0.025, 0.04], p.edge, hd);
  const cue = group(root, 'CueStick', [0, 0.942, 0.82]);
  cyl(cue, [0, 0, -0.18], 0.012, 0.016, 0.68, p.stencil, hd, 'z', 8);
  cyl(cue, [0, 0, 0.44], 0.016, 0.022, 0.6, p.dark, hd, 'z', 8);
  cyl(cue, [0, 0, -0.53], 0.011, 0.012, 0.03, p.optic, hd, 'z', 8);
  const rack = group(root, 'BallRack', [0, 0.86, -0.46]);
  const bMats = [p.accent, p.primary, p.optic, p.dark, p.stencil] as const;
  let bi = 0;
  for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) {
    orb(rack, [(c - r * 0.5) * 0.07, 0.031, 0.12 - r * 0.062], 0.033, bMats[bi % 5] ?? p.accent, hd);
    bi++;
  }
  rod(rack, [0, 0.03, 0.2], [-0.17, 0.03, -0.12], 0.016, p.primary, hd, 6);
  rod(rack, [0, 0.03, 0.2], [0.17, 0.03, -0.12], 0.016, p.primary, hd, 6);
  rod(rack, [-0.17, 0.03, -0.12], [0.17, 0.03, -0.12], 0.016, p.primary, hd, 6);
  if (detail) {
    for (const sx of [-0.58, 0.58]) for (const sz of [-0.72, -0.26, 0.26, 0.72]) orb(g, [sx, 0.92, sz], 0.014, p.stencil, hd);
    for (const sx of [-0.26, 0, 0.26]) for (const sz of [-1.01, 1.01]) orb(g, [sx, 0.92, sz], 0.014, p.stencil, hd);
  }
  root.animations = [new T.AnimationClip('Break shot', 2.4, [
    slideTrack('CueStick', [0, 0.942, 0.82], 2, [0, 0.65, 1.15, 1.65, 2.4], [0, 0.24, -0.2, 0.06, 0]),
  ])];
}

export function baseballPitchingMachine(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'TripodBase');
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const a2 = a + (Math.PI * 2) / 3;
    cyl(g, [Math.cos(a) * 0.48, 0.025, Math.sin(a) * 0.48], 0.048, 0.055, 0.05, p.tire, hd);
    rod(g, [Math.cos(a) * 0.48, 0.04, Math.sin(a) * 0.48], [0, 0.94, 0], 0.03, p.dark, hd, 8);
    rod(g, [Math.cos(a) * 0.3, 0.36, Math.sin(a) * 0.3], [Math.cos(a2) * 0.3, 0.36, Math.sin(a2) * 0.3], 0.022, p.primary, hd, 6);
  }
  cyl(g, [0, 0.96, 0], 0.075, 0.088, 0.24, p.primary, hd, 'y', 10);
  blk(g, [0, 1.12, 0], [0.22, 0.14, 0.16], p.dark, hd);
  const head = group(root, 'PitchHead', [0, 1.16, 0]);
  slab(head, [0, 0.04, 0], [0.26, 0.56, 0.32], p.primary, hd, 0.18);
  blk(head, [0.16, 0.04, -0.02], [0.06, 0.22, 0.22], p.dark, hd);
  for (const y of [-0.02, 0.08]) cyl(head, [0.2, y, 0], 0.028, 0.028, 0.03, p.accent, hd, 'x', 8);
  cyl(head, [0, 0.04, -0.2], 0.065, 0.072, 0.2, p.edge, hd, 'z', 10);
  for (const sy of [-1, 1]) blk(head, [0, 0.04 + sy * 0.38, 0.06], [0.18, 0.045, 0.38], p.accent, hd);
  blk(head, [0, 0.04, 0.24], [0.22, 0.78, 0.045], p.accent, hd);
  for (const [name, wy] of [['TopWheel', 0.22], ['BotWheel', -0.14]] as const) {
    const w = group(head, name, [0, wy, 0.08]);
    band(w, [0, 0, 0], 0.17, 0.055, 0.085, p.tire, hd, [0, 0, HPI]);
    cyl(w, [0, 0, 0], 0.12, 0.12, 0.07, p.alloy, hd, 'x', 10);
    blk(w, [0, 0, 0], [0.1, 0.22, 0.036], p.accent, hd);
  }
  const chute = group(head, 'BallChute', [0, 0.04, -0.26]);
  for (const sx of [-0.055, 0.055]) pipe(chute, [[sx, 0, 0], [sx, 0.18, -0.22], [sx, 0.48, -0.34]], 0.016, p.accent, hd);
  for (const [y, z] of [[0.06, -0.08], [0.18, -0.19], [0.31, -0.27], [0.44, -0.32]] as const) orb(chute, [0, y, z], 0.046, p.stencil, hd);
  if (detail) {
    for (const sx of [-0.14, 0.14]) cyl(head, [sx, 0.04, 0.08], 0.06, 0.06, 0.06, p.edge, hd, 'x', 10);
    for (let i = 0; i < 4; i++) bolt(head, [0.14, -0.18 + i * 0.14, 0.16], p, 0.018, 'z');
  }
  root.animations = [new T.AnimationClip('Pitch fastball', 2.4, [
    spinTrack('TopWheel', 'x', 2.4, 3),
    spinTrack('BotWheel', 'x', 2.4, -3),
    rotationTrack('PitchHead', 'x', [0, 0.6, 1.4, 2.4], [0, -0.24, 0.18, 0]),
  ])];
}

export function alpineSkiLiftChair(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'LiftGantry');
  for (const sx of [-0.78, 0.78]) {
    blk(g, [sx, 0.04, 0], [0.24, 0.08, 1.18], p.dark, hd);
    for (const sz of [-0.46, 0.46]) rod(g, [sx, 0.06, sz], [sx * 0.92, 2.38, 0], 0.045, p.primary, hd, 8);
    rod(g, [sx * 0.97, 0.88, -0.3], [sx * 0.97, 0.88, 0.3], 0.032, p.edge, hd, 6);
    rod(g, [sx * 0.94, 1.66, -0.15], [sx * 0.94, 1.66, 0.15], 0.028, p.edge, hd, 6);
  }
  cyl(g, [0, 2.38, 0], 0.055, 0.055, 1.68, p.edge, hd, 'x', 10);
  for (const sx of [-0.56, 0.56]) {
    band(g, [sx, 2.38, 0], 0.14, 0.042, 0.06, p.dark, hd, [0, 0, HPI]);
    cyl(g, [sx, 2.38, 0], 0.075, 0.075, 0.08, p.accent, hd, 'x', 10);
  }
  const chair = group(root, 'LiftChair', [0, 2.38, 0]);
  slab(chair, [0, 0, 0], [0.18, 0.16, 0.16], p.accent, hd, 0.2);
  pipe(chair, [[0, -0.04, 0], [0, -0.78, -0.14], [0, -1.14, -0.26], [0, -1.52, -0.22]], 0.036, p.primary, hd);
  blk(chair, [0, -1.52, -0.02], [1.14, 0.07, 0.44], p.dark, hd);
  for (const sx of [-0.56, 0.56]) {
    blk(chair, [sx, -1.36, -0.02], [0.06, 0.32, 0.44], p.primary, hd);
    blk(chair, [sx, -1.2, 0.02], [0.07, 0.05, 0.46], p.dark, hd);
  }
  for (const sx of [-0.26, 0.26]) {
    slab(chair, [sx, -1.44, 0.02], [0.46, 0.1, 0.42], p.accent, hd, 0.24);
    slab(chair, [sx, -1.16, -0.2], [0.46, 0.48, 0.09], p.accent, hd, 0.22);
  }
  const bar = group(chair, 'SafetyBar', [0, -1.02, -0.16]);
  for (const sx of [-0.52, 0.52]) pipe(bar, [[sx, 0, 0], [sx, -0.12, 0.34], [sx, -0.24, 0.5]], 0.022, p.dark, hd);
  cyl(bar, [0, -0.24, 0.5], 0.024, 0.024, 1.06, p.dark, hd, 'x', 8);
  for (const sx of [-0.26, 0.26]) {
    rod(bar, [sx, -0.24, 0.5], [sx, -0.8, 0.48], 0.018, p.alloy, hd, 6);
    cyl(bar, [sx, -0.8, 0.48], 0.018, 0.018, 0.32, p.alloy, hd, 'x', 8);
  }
  const skis = group(root, 'SkiPair', [-0.88, 0.72, 0]);
  blk(skis, [0.04, 0, 0], [0.14, 0.06, 0.24], p.edge, hd);
  for (const sz of [-0.07, 0.07]) blk(skis, [-0.02, 0.04, sz], [0.036, 1.32, 0.09], sz < 0 ? p.accent : p.stencil, hd);
  if (detail) {
    for (const sx of [-0.78, 0.78]) for (const sz of [-0.46, 0.46]) bolt(g, [sx, 0.085, sz], p, 0.025);
    for (const y of [-1.28, -1.14, -1.0]) blk(chair, [0, y, -0.26], [1.04, 0.045, 0.03], p.primary, hd);
  }
  root.animations = [new T.AnimationClip('Chairlift sway', 3.0, [
    rotationTrack('LiftChair', 'x', [0, 0.75, 1.5, 2.25, 3.0], [0, 0.26, 0, -0.26, 0]),
    rotationTrack('SafetyBar', 'x', [0, 0.85, 1.9, 3.0], [0, -0.95, -0.95, 0]),
  ])];
}

export function bowlingPinsetterGate(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'PinsetterFrame');
  slab(g, [0, 0.06, 0], [1.48, 0.12, 1.5], p.dark, hd, 0.08);
  blk(g, [0, 0.13, 0.04], [1.06, 0.04, 1.38], tone('#d4a36a', 0.46, 0.08), hd);
  for (const sx of [-0.61, 0.61]) blk(g, [sx, 0.1, 0.04], [0.16, 0.045, 1.4], p.inset, hd);
  for (const sx of [-0.72, 0.72]) {
    blk(g, [sx, 0.48, 0], [0.08, 0.76, 1.46], p.primary, hd);
    blk(g, [sx, 0.88, -0.14], [0.09, 0.24, 1.12], p.dark, hd);
  }
  blk(g, [0, 0.5, -0.68], [1.46, 0.8, 0.12], p.dark, hd);
  slab(g, [0, 1.12, -0.06], [1.52, 0.5, 1.24], p.primary, hd, 0.16);
  blk(g, [0, 1.14, 0.57], [1.34, 0.3, 0.042], p.accent, hd);
  blk(g, [0, 1.14, 0.6], [0.84, 0.16, 0.025], p.optic, hd);
  const rake = group(root, 'SweepGate', [0, 0.86, 0.42]);
  for (const sx of [-0.56, 0.56]) {
    cyl(rake, [sx, 0, 0], 0.036, 0.036, 0.08, p.edge, hd, 'x', 8);
    rod(rake, [sx, 0, 0], [sx, -0.44, 0.16], 0.024, p.alloy, hd, 6);
  }
  slab(rake, [0, -0.45, 0.18], [1.14, 0.14, 0.09], p.accent, hd, 0.18);
  blk(rake, [0, -0.52, 0.18], [1.1, 0.035, 0.07], p.tire, hd);
  const pins = group(root, 'PinTriangle', [0, 0.145, -0.06]);
  const pinProf: readonly (readonly [number, number])[] = [
    [0, 0], [0.03, 0], [0.056, 0.11], [0.048, 0.2], [0.024, 0.28], [0.034, 0.34], [0.026, 0.38], [0, 0.39],
  ];
  for (let row = 0; row < 4; row++) for (let col = 0; col <= row; col++) {
    const px = (col - row * 0.5) * 0.24;
    const pz = 0.34 - row * 0.21;
    lathe(pins, [px, 0, pz], pinProf, p.stencil, hd, 10);
    cyl(pins, [px, 0.275, pz], 0.027, 0.029, 0.032, p.accent, hd, 'y', 10);
  }
  if (detail) {
    for (const sx of [-0.52, -0.38, 0.38, 0.52]) orb(g, [sx, 1.14, 0.6], 0.026, p.stencil, hd);
    for (const sx of [-0.3, 0, 0.3]) blk(g, [sx, 0.156, 0.56], [0.032, 0.012, 0.12], p.dark, hd);
    for (const sx of [-0.4, 0, 0.4]) blk(rake, [sx, -0.45, 0.232], [0.16, 0.06, 0.02], p.stencil, hd);
  }
  root.animations = [new T.AnimationClip('Drop sweep rake', 2.8, [
    rotationTrack('SweepGate', 'x', [0, 0.75, 1.75, 2.8], [0, 0.92, 0.92, 0]),
  ])];
}

export function rowingErgometer(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'RowerChassis');
  blk(g, [0, 0.04, 0.68], [0.7, 0.075, 0.12], p.dark, hd);
  blk(g, [0, 0.04, -1.04], [0.64, 0.075, 0.12], p.dark, hd);
  blk(g, [0, 0.32, 0.44], [0.42, 0.06, 0.07], p.dark, hd);
  for (const sx of [-1, 1]) {
    caster(g, [sx * 0.36, 0.055, 0.72], 0.055, 0.045, p, 'x');
    rod(g, [sx * 0.26, 0.06, 0.68], [sx * 0.08, 0.44, 0.68], 0.028, p.primary, hd, 8);
    rod(g, [sx * 0.26, 0.06, -1.04], [sx * 0.05, 0.34, -1.0], 0.026, p.primary, hd, 8);
    blk(g, [sx * 0.16, 0.34, 0.44], [0.12, 0.26, 0.045], p.dark, hd, [-0.55, 0, 0]);
    blk(g, [sx * 0.16, 0.26, 0.39], [0.13, 0.05, 0.09], p.accent, hd);
  }
  blk(g, [0, 0.34, -0.18], [0.11, 0.09, 1.74], p.alloy, hd);
  blk(g, [0, 0.39, -0.18], [0.065, 0.025, 1.66], p.dark, hd);
  rod(g, [0, 0.34, 0.64], [0, 0.56, 0.86], 0.052, p.primary, hd, 8);
  band(g, [0, 0.56, 0.86], 0.27, 0.042, 0.16, p.accent, hd, [0, 0, HPI]);
  cyl(g, [-0.075, 0.56, 0.86], 0.24, 0.24, 0.035, p.primary, hd, 'x', 12);
  const fan = group(root, 'FlywheelFan', [0, 0.56, 0.86]);
  cyl(fan, [0, 0, 0], 0.07, 0.07, 0.18, p.dark, hd, 'x', 10);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    blk(fan, [0.01, Math.sin(a) * 0.14, Math.cos(a) * 0.14], [0.08, 0.026, 0.16], i % 2 === 0 ? p.dark : p.stencil, hd, [a, 0, 0]);
  }
  const seat = group(root, 'SeatCarriage', [0, 0.42, -0.22]);
  blk(seat, [0, -0.05, 0], [0.16, 0.08, 0.22], p.dark, hd);
  slab(seat, [0, 0.035, 0], [0.34, 0.07, 0.28], p.primary, hd, 0.28);
  blk(seat, [0, 0.074, -0.04], [0.24, 0.018, 0.14], p.accent, hd);
  const handle = group(root, 'PullHandle', [0, 0.56, 0.42]);
  rod(handle, [0, 0, 0], [0, 0, 0.44], 0.014, p.alloy, hd, 6);
  blk(handle, [0, 0, 0], [0.08, 0.048, 0.048], p.accent, hd);
  cyl(handle, [0, 0, 0], 0.022, 0.022, 0.44, p.tire, hd, 'x', 8);
  const mon = group(root, 'MonitorArm', [0, 0.64, 0.64]);
  rod(mon, [0, -0.1, 0.06], [0, 0.24, 0], 0.024, p.dark, hd, 8);
  slab(mon, [0, 0.3, -0.02], [0.26, 0.22, 0.06], p.dark, hd, 0.2, [0.22, 0, 0]);
  blk(mon, [0, 0.3, -0.052], [0.2, 0.15, 0.024], p.optic, hd, [0.22, 0, 0]);
  if (detail) {
    for (const sx of [-0.16, 0.16]) blk(g, [sx, 0.36, 0.45], [0.13, 0.035, 0.065], p.tire, hd);
    for (let i = 0; i < 6; i++) bolt(g, [0.07, 0.56 + Math.sin((i * Math.PI) / 3) * 0.24, 0.86 + Math.cos((i * Math.PI) / 3) * 0.24], p, 0.016, 'x');
  }
  root.animations = [new T.AnimationClip('Rowing stroke', 2.4, [
    slideTrack('SeatCarriage', [0, 0.42, -0.22], 2, [0, 0.7, 1.4, 2.4], [0, -0.4, 0.28, 0]),
    slideTrack('PullHandle', [0, 0.56, 0.42], 2, [0, 0.7, 1.4, 2.4], [0, -0.42, 0.18, 0]),
    spinTrack('FlywheelFan', 'x', 2.4, 3),
  ])];
}

export function climbingBoulderWall(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'WallStructure');
  for (const sx of [-0.64, 0.64]) {
    blk(g, [sx, 0.05, 0], [0.14, 0.1, 1.06], p.dark, hd);
    rod(g, [sx, 0.08, -0.46], [sx, 2.38, -0.14], 0.052, p.edge, hd, 8);
    rod(g, [sx, 0.08, 0.38], [sx, 2.38, -0.14], 0.042, p.edge, hd, 8);
    rod(g, [sx, 1.24, -0.32], [sx, 1.24, 0.22], 0.036, p.dark, hd, 6);
  }
  for (const sz of [-0.47, 0.47]) blk(g, [0, 0.05, sz], [1.4, 0.1, 0.12], p.dark, hd);
  blk(g, [0, 1.42, -0.32], [1.34, 0.08, 0.08], p.dark, hd);
  blk(g, [0, 0.26, 0.14], [1.44, 0.36, 0.1], p.dark, hd);
  blk(g, [0, 1.28, 0.26], [1.46, 1.72, 0.11], p.primary, hd, [0.18, 0, 0]);
  blk(g, [0, 2.24, 0.54], [1.46, 0.6, 0.11], p.primary, hd, [0.46, 0, 0]);
  const holds: readonly [number, number, number, T.Material][] = [
    [-0.46, 0.62, 0.18, p.accent], [0.16, 0.74, 0.2, p.optic], [0.48, 0.92, 0.24, p.stencil],
    [-0.22, 1.06, 0.26, p.accent], [0.34, 1.26, 0.3, p.accent], [-0.48, 1.42, 0.32, p.optic],
    [0.06, 1.56, 0.35, p.dark], [0.46, 1.72, 0.38, p.accent], [-0.28, 1.88, 0.42, p.stencil],
    [0.2, 2.02, 0.45, p.optic], [-0.36, 2.22, 0.56, p.accent], [0.14, 2.34, 0.62, p.accent],
  ];
  for (const [hx, hy, hz, hm] of holds) orb(g, [hx, hy, hz], 0.068, hm, hd, [1.25, 0.72, 0.85]);
  for (const sx of [-0.44, 0.44]) rod(g, [sx, 2.38, 0.48], [sx, 2.52, 0.68], 0.028, p.edge, hd, 6);
  cyl(g, [0, 2.52, 0.68], 0.026, 0.026, 1.02, p.alloy, hd, 'x', 8);
  const bell = group(root, 'SummitBell', [0, 2.52, 0.68]);
  cyl(bell, [0, -0.09, 0], 0.045, 0.072, 0.14, p.accent, hd, 'y', 10);
  rod(bell, [0, -0.14, 0], [0, -0.26, 0], 0.012, p.stencil, hd, 6);
  torus(bell, [0, -0.29, 0], 0.036, 0.012, p.stencil, hd);
  const pad = group(root, 'CrashPad', [0, 0.07, 0.86]);
  slab(pad, [0, 0, 0], [1.4, 0.14, 0.62], p.accent, hd, 0.18);
  blk(pad, [0, 0.02, 0], [0.05, 0.12, 0.6], p.dark, hd);
  if (detail) {
    for (const [vx, vy, vz] of [[-0.08, 1.24, 0.29], [0.36, 1.5, 0.34]] as const) slab(g, [vx, vy, vz], [0.26, 0.22, 0.12], p.dark, hd, 0.35, [0.18, 0, 0.25]);
    for (const sx of [-0.64, 0.64]) bolt(g, [sx, 0.105, -0.46], p, 0.025);
  }
  root.animations = [new T.AnimationClip('Ring summit bell', 2.2, [
    rotationTrack('SummitBell', 'x', [0, 0.45, 1.0, 1.55, 2.2], [0, 0.48, -0.42, 0.32, 0]),
  ])];
}

export function archeryTargetStand(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'TripodEasel');
  for (const [lx, lz] of [[-0.48, 0.32], [0.48, 0.32], [0, -0.58]] as const) {
    cyl(g, [lx, 0.02, lz], 0.036, 0.042, 0.04, p.tire, hd);
    rod(g, [lx, 0.03, lz], [0, 1.62, -0.1], 0.036, p.primary, hd, 8);
  }
  blk(g, [0, 0.68, 0.15], [1.06, 0.07, 0.08], p.primary, hd);
  blk(g, [0, 1.24, 0], [0.56, 0.06, 0.07], p.primary, hd);
  rod(g, [0, 0.68, 0.14], [0, 0.68, -0.38], 0.02, p.edge, hd, 6);
  const butt = group(root, 'TargetButt', [0, 1.06, 0.1]);
  butt.rotation.x = -0.18;
  cyl(butt, [0, 0, 0], 0.5, 0.5, 0.18, tone('#d2b47c', 0.82, 0.04), hd, 'z', 14);
  band(butt, [0, 0, 0], 0.515, 0.024, 0.14, p.dark, hd, [HPI, 0, 0]);
  const rings: readonly [number, number, T.Material][] = [
    [0.46, 0.092, p.stencil], [0.37, 0.104, p.dark], [0.28, 0.116, p.optic], [0.19, 0.128, p.accent], [0.095, 0.14, tone('#e8b828', 0.42, 0.26)],
  ];
  for (const [r, z, rm] of rings) cyl(butt, [0, 0, z], r, r, 0.022, rm, hd, 'z', 14);
  for (const [ax, ay, rx, ry] of [[0.03, 0.02, -0.08, 0.06], [-0.11, 0.08, 0.06, -0.1], [0.09, -0.12, -0.05, 0.09]] as const) {
    const ar = group(butt, '', [ax, ay, 0.14]);
    ar.rotation.set(rx, ry, 0);
    cyl(ar, [0, 0, 0.24], 0.011, 0.011, 0.52, p.alloy, hd, 'z', 6);
    for (const a of [0, 2.1, 4.2]) blk(ar, [Math.cos(a) * 0.024, Math.sin(a) * 0.024, 0.45], [0.042, 0.01, 0.09], p.accent, hd, [0, 0, a]);
  }
  const flag = group(root, 'WindFlag', [0, 1.62, -0.1]);
  cyl(flag, [0, 0.18, 0], 0.014, 0.016, 0.36, p.alloy, hd);
  blk(flag, [0.14, 0.3, 0], [0.28, 0.1, 0.022], p.accent, hd);
  blk(flag, [0.14, 0.3, 0], [0.12, 0.05, 0.034], p.stencil, hd);
  const quiv = group(root, 'ArrowQuiver', [0.38, 0.56, 0.2]);
  cyl(quiv, [0, 0, 0], 0.068, 0.052, 0.42, p.dark, hd, 'y', 10);
  band(quiv, [0, 0.14, 0], 0.075, 0.016, 0.05, p.accent, hd);
  for (const [ox, oz] of [[-0.02, -0.02], [0.02, -0.01], [0, 0.025]] as const) {
    cyl(quiv, [ox, 0.26, oz], 0.01, 0.01, 0.26, p.alloy, hd, 'y', 6);
    blk(quiv, [ox, 0.37, oz], [0.036, 0.07, 0.012], p.accent, hd);
  }
  if (detail) {
    bolt(g, [0, 1.62, -0.06], p, 0.026, 'z');
    for (const sx of [-0.36, 0.36]) blk(g, [sx, 0.68, 0.2], [0.06, 0.09, 0.06], p.edge, hd);
  }
  root.animations = [new T.AnimationClip('Wind check & tilt', 2.6, [
    rotationTrack('WindFlag', 'y', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.62, -0.48, 0.38, 0]),
    rotationTrack('TargetButt', 'x', [0, 0.8, 1.7, 2.6], [-0.18, -0.04, -0.28, -0.18]),
  ])];
}

export function tabletopAirHockey(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'AirHockeyTable');
  for (const sz of [-0.64, 0.64]) {
    for (const sx of [-0.36, 0.36]) cyl(g, [sx, 0.02, sz], 0.048, 0.054, 0.04, p.tire, hd);
    slab(g, [0, 0.34, sz], [0.88, 0.62, 0.24], p.primary, hd, 0.2);
  }
  blk(g, [0, 0.28, 0], [0.24, 0.22, 1.24], p.dark, hd);
  slab(g, [0, 0.72, 0], [1.14, 0.22, 2.02], p.primary, hd, 0.14);
  blk(g, [0, 0.84, 0], [0.98, 0.04, 1.86], p.stencil, hd);
  blk(g, [0, 0.868, 0], [0.94, 0.016, 0.028], p.accent, hd);
  band(g, [0, 0.868, 0], 0.18, 0.024, 0.016, p.optic, hd);
  for (const sx of [-0.52, 0.52]) blk(g, [sx, 0.88, 0], [0.1, 0.075, 1.98], p.dark, hd);
  for (const sz of [-0.96, 0.96]) {
    for (const sx of [-0.36, 0.36]) blk(g, [sx, 0.88, sz], [0.3, 0.075, 0.1], p.dark, hd);
    blk(g, [0, 0.78, sz * 1.02], [0.38, 0.12, 0.09], p.accent, hd);
  }
  for (const sx of [-0.53, 0.53]) for (const sz of [-0.96, 0.96]) slab(g, [sx, 0.88, sz], [0.12, 0.095, 0.12], p.alloy, hd, 0.3);
  const bridge = group(root, 'ScoreBridge', [0, 0.86, 0]);
  for (const sx of [-0.54, 0.54]) rod(bridge, [sx, 0, 0], [sx * 0.94, 0.52, 0], 0.036, p.accent, hd, 8);
  slab(bridge, [0, 0.52, 0], [1.14, 0.22, 0.26], p.primary, hd, 0.18);
  for (const sz of [-0.14, 0.14]) blk(bridge, [0, 0.52, sz], [0.72, 0.13, 0.028], p.optic, hd);
  for (const [name, z, mat] of [['NearStriker', 0.64, p.accent], ['FarStriker', -0.64, p.optic]] as const) {
    const s = group(root, name, [0, 0.872, z]);
    cyl(s, [0, 0, 0], 0.075, 0.078, 0.026, mat, hd, 'y', 12);
    cyl(s, [0, 0.038, 0], 0.03, 0.036, 0.055, p.dark, hd, 'y', 10);
    orb(s, [0, 0.072, 0], 0.034, mat, hd);
  }
  const puck = group(root, 'HockeyPuck', [0, 0.87, 0]);
  cyl(puck, [0, 0, 0], 0.056, 0.056, 0.022, p.accent, hd, 'y', 12);
  cyl(puck, [0, 0.012, 0], 0.034, 0.034, 0.014, p.optic, hd, 'y', 10);
  if (detail) {
    for (const sz of [-0.76, 0.76]) band(g, [0, 0.868, sz], 0.14, 0.022, 0.016, p.accent, hd);
    for (const sx of [-0.58, 0.58]) blk(g, [sx, 0.72, 0], [0.024, 0.05, 1.72], p.accent, hd);
  }
  root.animations = [new T.AnimationClip('Air hockey rally', 2.4, [
    slideTrack('HockeyPuck', [0, 0.87, 0], 2, [0, 0.6, 1.2, 1.8, 2.4], [0, 0.58, -0.58, 0.42, 0]),
    slideTrack('NearStriker', [0, 0.872, 0.64], 0, [0, 0.6, 1.4, 2.4], [0, 0.28, -0.26, 0]),
    slideTrack('FarStriker', [0, 0.872, -0.64], 0, [0, 0.6, 1.4, 2.4], [0, -0.26, 0.28, 0]),
  ])];
}

export function tennisUmpireChair(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'UmpireFrame');
  for (const sx of [-1, 1]) {
    cyl(g, [sx * 0.42, 0.02, 0.46], 0.038, 0.044, 0.04, p.tire, hd);
    cyl(g, [sx * 0.42, 0.02, -0.48], 0.038, 0.044, 0.04, p.tire, hd);
    rod(g, [sx * 0.42, 0.03, 0.46], [sx * 0.34, 1.54, 0.14], 0.028, p.primary, hd, 8);
    rod(g, [sx * 0.42, 0.03, -0.48], [sx * 0.34, 1.54, -0.34], 0.028, p.primary, hd, 8);
    rod(g, [sx * 0.39, 0.48, 0.36], [sx * 0.39, 0.48, -0.42], 0.02, p.edge, hd, 6);
    rod(g, [sx * 0.36, 1.06, 0.24], [sx * 0.36, 1.06, -0.38], 0.02, p.edge, hd, 6);
    rod(g, [sx * 0.34, 1.54, -0.34], [sx * 0.34, 2.34, -0.34], 0.024, p.primary, hd, 8);
    blk(g, [sx * 0.34, 1.78, -0.06], [0.055, 0.045, 0.56], p.primary, hd);
    rod(g, [sx * 0.34, 1.54, 0.16], [sx * 0.34, 1.78, 0.16], 0.022, p.primary, hd, 6);
  }
  for (let i = 0; i < 5; i++) {
    const f = (i + 0.8) / 5.5;
    blk(g, [0, f * 1.48, 0.46 - f * 0.32], [0.76 - f * 0.12, 0.04, 0.12], p.alloy, hd);
  }
  blk(g, [0, 1.16, 0.38], [0.72, 0.045, 0.22], p.dark, hd);
  blk(g, [0, 1.38, -0.1], [0.64, 0.04, 0.48], p.dark, hd);
  slab(g, [0, 1.56, -0.08], [0.64, 0.08, 0.54], p.stencil, hd, 0.2);
  slab(g, [0, 1.61, -0.06], [0.54, 0.04, 0.44], p.accent, hd, 0.24);
  slab(g, [0, 1.84, -0.32], [0.62, 0.48, 0.085], p.stencil, hd, 0.2);
  blk(g, [0, 1.84, -0.27], [0.5, 0.36, 0.032], p.accent, hd);
  const canopy = group(root, 'SunCanopy', [0, 2.34, -0.34]);
  for (const sx of [-0.42, 0.42]) rod(canopy, [sx, 0, 0], [sx, 0.04, 0.86], 0.02, p.alloy, hd, 6);
  cyl(canopy, [0, 0, 0], 0.022, 0.022, 0.86, p.alloy, hd, 'x', 8);
  for (let i = 0; i < 5; i++) blk(canopy, [-0.36 + i * 0.18, 0.04, 0.42], [0.18, 0.048, 0.92], i % 2 === 0 ? p.primary : p.accent, hd);
  blk(canopy, [0, -0.01, 0.87], [0.9, 0.1, 0.032], p.accent, hd);
  const tab = group(root, 'WritingTablet', [0.35, 1.78, 0.02]);
  cyl(tab, [0, 0, 0], 0.028, 0.028, 0.12, p.alloy, hd, 'z', 8);
  slab(tab, [-0.14, 0.04, 0.16], [0.34, 0.038, 0.42], p.primary, hd, 0.16);
  blk(tab, [-0.14, 0.065, 0.16], [0.24, 0.014, 0.32], p.stencil, hd);
  const flip = group(root, 'ScoreFlipChart', [0, 1.24, 0.46]);
  blk(flip, [0, -0.02, 0], [0.34, 0.14, 0.09], p.dark, hd);
  for (const sx of [-0.09, 0.09]) blk(flip, [sx, 0, 0.052], [0.12, 0.11, 0.022], p.stencil, hd);
  if (detail) {
    for (const sx of [-0.38, 0.38]) rod(g, [sx, 0.48, 0.34], [sx, 1.06, -0.36], 0.016, p.edge, hd, 6);
    blk(tab, [-0.14, 0.075, 0.01], [0.16, 0.018, 0.028], p.accent, hd);
  }
  root.animations = [new T.AnimationClip('Adjust shade & tablet', 2.8, [
    rotationTrack('SunCanopy', 'x', [0, 0.75, 1.7, 2.8], [0, 0.36, -0.24, 0]),
    rotationTrack('WritingTablet', 'z', [0, 0.85, 1.9, 2.8], [0, 1.2, 1.2, 0]),
  ])];
}

export function gymnasticPommelHorse(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'GymStationBase');
  slab(g, [0, 0.025, 0.08], [1.74, 0.05, 1.46], p.dark, hd, 0.08);
  blk(g, [0, 0.054, 0.08], [1.58, 0.016, 1.3], p.accent, hd);
  for (const sx of [-0.56, 0.56]) {
    blk(g, [sx, 0.085, -0.26], [0.16, 0.06, 0.72], p.accent, hd);
    rod(g, [sx, 0.09, -0.26], [sx * 0.78, 0.66, -0.26], 0.052, p.accent, hd, 10);
    cyl(g, [sx * 0.78, 0.65, -0.26], 0.065, 0.065, 0.08, p.dark, hd, 'y', 10);
  }
  blk(g, [0, 0.09, -0.26], [1.04, 0.05, 0.08], p.dark, hd);
  rod(g, [-0.5, 0.36, -0.26], [0.5, 0.36, -0.26], 0.028, p.edge, hd, 8);
  const body = group(root, 'HorseBody', [0, 0.78, -0.26]);
  for (const sx of [-0.44, 0.44]) cyl(body, [sx, -0.18, 0], 0.036, 0.036, 0.44, p.alloy, hd, 'y', 10);
  blk(body, [0, 0.04, 0], [1.26, 0.08, 0.24], p.dark, hd);
  cyl(body, [0, 0.19, 0], 0.16, 0.16, 1.24, p.primary, hd, 'x', 14).scale.set(0.86, 1, 1.14);
  for (const sx of [-0.62, 0.62]) orb(body, [sx, 0.19, 0], 0.16, p.primary, hd, [0.72, 0.86, 1.14]);
  for (const px of [-0.24, 0.24]) {
    blk(body, [px, 0.34, 0], [0.09, 0.045, 0.32], p.alloy, hd);
    pipe(body, [[px, 0.35, -0.13], [px, 0.47, -0.09], [px, 0.5, 0], [px, 0.47, 0.09], [px, 0.35, 0.13]], 0.024, p.stencil, hd);
  }
  blk(g, [0, 0.075, 0.44], [0.66, 0.045, 0.96], p.dark, hd);
  for (const sx of [-0.18, 0.18]) for (let k = 0; k < 4; k++) torus(g, [sx, 0.1 + k * 0.034, 0.12], 0.045, 0.013, p.alloy, hd, [HPI, 0, 0]);
  const sb = group(root, 'SpringBoard', [0, 0.095, 0.88]);
  blk(sb, [0, 0.08, -0.44], [0.64, 0.044, 0.94], p.primary, hd, [-0.16, 0, 0]);
  blk(sb, [0, 0.106, -0.44], [0.54, 0.02, 0.84], p.accent, hd, [-0.16, 0, 0]);
  const chalk = group(root, 'ChalkStand', [-0.66, 0.05, 0.44]);
  cyl(chalk, [0, 0.34, 0], 0.022, 0.026, 0.68, p.edge, hd);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    rod(chalk, [0, 0.16, 0], [Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16], 0.018, p.dark, hd, 6);
  }
  cyl(chalk, [0, 0.68, 0], 0.14, 0.1, 0.1, p.edge, hd, 'y', 10);
  orb(chalk, [0, 0.72, 0], 0.095, p.stencil, hd, [1, 0.55, 1]);
  if (detail) {
    for (const sx of [-0.56, 0.56]) for (const sz of [-0.52, 0]) bolt(g, [sx, 0.12, sz], p, 0.022);
    for (const sx of [-0.44, 0.44]) cyl(g, [sx, 0.65, -0.18], 0.026, 0.026, 0.06, p.accent, hd, 'z', 8);
  }
  root.animations = [new T.AnimationClip('Springboard launch', 2.4, [
    rotationTrack('SpringBoard', 'x', [0, 0.45, 0.95, 1.5, 2.4], [0, 0.16, -0.04, 0.12, 0]),
    slideTrack('HorseBody', [0, 0.78, -0.26], 1, [0, 0.8, 1.6, 2.4], [0, 0.18, 0.18, 0]),
  ])];
}
