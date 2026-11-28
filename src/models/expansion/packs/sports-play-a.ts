import * as T from 'three';
import { group, rotationTrack, spinTrack } from '../../parts';
import type { Finish, Point } from '../../parts';
import { HPI, band, blk, bolt, caster, cyl, glass, lathe, orb, pipe, rod, slab, slideTrack, tone, torus } from './sports-play-kit';

export function streetBasketballHoop(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'HoopStand');
  slab(g, [0, 0.15, -0.34], [0.92, 0.3, 1.24], p.dark, hd, 0.22);
  slab(g, [0, 0.32, -0.44], [0.76, 0.08, 0.96], p.primary, hd, 0.24);
  for (const sx of [-1, 1]) {
    caster(g, [sx * 0.48, 0.09, 0.22], 0.09, 0.07, p, 'x');
    rod(g, [sx * 0.34, 0.28, -0.68], [sx * 0.05, 1.28, -0.06], 0.028, p.edge, hd, 6);
    rod(g, [sx * 0.34, 2.86, 0.44], [sx * 0.56, 3.24, 0.47], 0.022, p.edge, hd, 6);
    blk(g, [sx * 0.64, 2.94, 0.48], [0.06, 0.9, 0.055], p.primary, hd);
    blk(g, [sx * 0.22, 2.83, 0.495], [0.026, 0.34, 0.02], p.accent, hd);
  }
  cyl(g, [0, 0.37, -0.78], 0.065, 0.075, 0.05, p.accent, hd);
  rod(g, [0, 0.24, -0.2], [0, 1.38, -0.05], 0.076, p.dark, hd, 8);
  rod(g, [0, 0.22, -0.2], [0, 2.74, 0.12], 0.06, p.primary, hd, 8);
  rod(g, [0, 0.28, 0.16], [0, 0.96, -0.1], 0.026, p.edge, hd, 6);
  rod(g, [0, 2.7, 0.11], [0, 2.88, 0.43], 0.05, p.dark, hd, 8);
  rod(g, [0, 2.38, 0.07], [0, 2.72, 0.39], 0.032, p.edge, hd, 6);
  blk(g, [0, 2.86, 0.44], [0.78, 0.075, 0.055], p.edge, hd);
  glass(g, [0, 2.94, 0.48], [1.24, 0.8, 0.022]);
  blk(g, [0, 3.37, 0.48], [1.34, 0.06, 0.055], p.primary, hd);
  blk(g, [0, 2.51, 0.48], [1.34, 0.075, 0.068], p.primary, hd);
  for (const y of [2.67, 2.99]) blk(g, [0, y, 0.495], [0.46, 0.026, 0.02], p.accent, hd);
  const rim = group(root, 'RimAssembly', [0, 2.64, 0.51]);
  blk(rim, [0, -0.02, 0.02], [0.16, 0.14, 0.06], p.accent, hd);
  blk(rim, [0, 0.01, 0.07], [0.1, 0.048, 0.08], p.accent, hd);
  torus(rim, [0, 0.02, 0.3], 0.22, 0.022, p.accent, hd, [HPI, 0, 0]);
  const net = group(rim, 'NetBasket', [0, 0.01, 0.3]);
  torus(net, [0, -0.19, 0], 0.165, 0.011, p.stencil, hd, [HPI, 0, 0]);
  torus(net, [0, -0.37, 0], 0.13, 0.011, p.stencil, hd, [HPI, 0, 0]);
  for (let i = 0; i < 10; i++) {
    const a1 = (i * Math.PI) / 5;
    rod(net, [Math.cos(a1) * 0.21, 0.01, Math.sin(a1) * 0.21], [Math.cos(a1 + 0.63) * 0.13, -0.37, Math.sin(a1 + 0.63) * 0.13], 0.009, p.stencil, hd, 6);
  }
  const ball = group(root, 'CourtBall', [0, 0.32, 0.04]);
  band(ball, [0, 0.01, 0], 0.12, 0.028, 0.04, p.dark, hd);
  orb(ball, [0, 0.12, 0], 0.13, p.accent, hd);
  torus(ball, [0, 0.12, 0], 0.131, 0.007, p.dark, hd, [HPI, 0, 0]);
  torus(ball, [0, 0.12, 0], 0.131, 0.007, p.dark, hd);
  if (detail) {
    for (const sx of [-0.3, 0.3]) for (const sz of [-0.72, -0.18]) bolt(g, [sx, 0.365, sz], p, 0.024);
    for (const y of [0.85, 1.48, 2.02]) band(g, [0, y, -0.14 + y * 0.12], 0.088, 0.02, 0.045, p.alloy, hd);
    for (const sx of [-0.56, 0.56]) bolt(g, [sx, 2.51, 0.515], p, 0.02, 'z');
  }
  root.animations = [new T.AnimationClip('Dunk flex', 2.4, [
    rotationTrack('RimAssembly', 'x', [0, 0.45, 1.0, 1.6, 2.4], [0, 0.34, -0.06, 0.14, 0]),
    rotationTrack('NetBasket', 'z', [0, 0.5, 1.1, 1.7, 2.4], [0, 0.28, -0.24, 0.12, 0]),
  ])];
}

export function stadiumFoosballTable(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const blue = tone('#2d5fa8', 0.48, 0.15);
  const g = group(root, 'FoosballCabinet');
  for (const sx of [-0.46, 0.46]) {
    for (const sz of [-0.56, 0.56]) { cyl(g, [sx, 0.03, sz], 0.055, 0.065, 0.06, p.alloy, hd); blk(g, [sx, 0.35, sz], [0.1, 0.62, 0.1], p.primary, hd); }
    blk(g, [sx, 0.24, 0], [0.06, 0.06, 1.06], p.dark, hd);
  }
  blk(g, [0, 0.24, 0], [0.86, 0.055, 0.065], p.dark, hd);
  blk(g, [0, 0.665, 0], [1.0, 0.11, 1.28], p.dark, hd);
  blk(g, [0, 0.745, 0], [0.96, 0.04, 1.24], tone('#2c7a48', 0.72, 0.05), hd);
  blk(g, [0, 0.774, 0], [0.92, 0.018, 0.024], p.stencil, hd);
  band(g, [0, 0.774, 0], 0.14, 0.022, 0.018, p.stencil, hd);
  for (const sz of [-0.52, 0.52]) blk(g, [0, 0.774, sz], [0.42, 0.018, 0.022], p.stencil, hd);
  for (const sx of [-0.52, 0.52]) blk(g, [sx, 0.78, 0], [0.08, 0.3, 1.36], p.primary, hd);
  for (const sz of [-0.64, 0.64]) {
    for (const sx of [-0.34, 0.34]) blk(g, [sx, 0.78, sz], [0.28, 0.3, 0.08], p.primary, hd);
    blk(g, [0, 0.89, sz], [0.42, 0.08, 0.08], p.primary, hd);
    blk(g, [0, 0.75, sz * 1.1], [0.42, 0.24, 0.1], p.dark, hd);
  }
  orb(g, [0.08, 0.79, 0.02], 0.028, p.stencil, hd);
  const addRod = (parent: T.Object3D, z: number, xs: readonly number[], kit: T.Material, side: 1 | -1) => {
    cyl(parent, [0, 0, z], 0.016, 0.016, 1.54, p.alloy, hd, 'x', 8);
    cyl(parent, [side * 0.7, 0, z], 0.03, 0.028, 0.16, p.tire, hd, 'x', 8);
    orb(parent, [-side * 0.77, 0, z], 0.024, p.dark, hd);
    for (const px of xs) {
      blk(parent, [px, -0.025, z], [0.044, 0.08, 0.036], kit, hd);
      blk(parent, [px, -0.07, z], [0.032, 0.045, 0.028], p.dark, hd);
      orb(parent, [px, 0.034, z], 0.024, p.stencil, hd);
    }
  };
  const sRods = group(g, '', [0, 0.85, 0]);
  addRod(sRods, -0.38, [-0.22, 0.22], blue, -1);
  addRod(sRods, 0.38, [-0.22, 0.22], p.accent, 1);
  addRod(group(root, 'BlueMidRod', [0, 0.85, -0.12]), 0, [-0.26, 0, 0.26], blue, -1);
  addRod(group(root, 'RedStrikerRod', [0, 0.85, 0.12]), 0, [-0.26, 0, 0.26], p.accent, 1);
  const beads = group(root, 'ScoreBeads', [0, 0.94, 0.65]);
  for (const sx of [-0.24, 0.24]) cyl(beads, [sx, 0.02, 0], 0.014, 0.014, 0.09, p.alloy, hd);
  cyl(beads, [0, 0.06, 0], 0.01, 0.01, 0.5, p.alloy, hd, 'x', 6);
  for (let i = 0; i < 6; i++) cyl(beads, [-0.18 + i * 0.072, 0.06, 0], 0.024, 0.024, 0.038, i < 3 ? p.accent : blue, hd, 'x', 8);
  if (detail) {
    for (const sz of [-0.38, -0.12, 0.12, 0.38]) for (const sx of [-0.56, 0.56]) cyl(g, [sx, 0.85, sz], 0.028, 0.028, 0.028, p.alloy, hd, 'x', 8);
    for (const sx of [-0.545, 0.545]) for (const sz of [-0.665, 0.665]) blk(g, [sx, 0.8, sz], [0.065, 0.26, 0.065], p.accent, hd);
  }
  root.animations = [new T.AnimationClip('Kick volley', 2.4, [
    rotationTrack('RedStrikerRod', 'x', [0, 0.5, 1.1, 1.7, 2.4], [0, -1.15, 0.95, -0.75, 0]),
    slideTrack('BlueMidRod', [0, 0.85, -0.12], 0, [0, 0.6, 1.4, 2.0, 2.4], [0, 0.14, -0.14, 0.08, 0]),
  ])];
}

export function classicPinballMachine(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'PinballChassis');
  for (const [lx, lz, topY] of [[-0.34, 0.5, 0.82], [0.34, 0.5, 0.82], [-0.34, -0.46, 0.94], [0.34, -0.46, 0.94]] as const) {
    cyl(g, [lx, 0.025, lz], 0.038, 0.044, 0.05, p.tire, hd);
    rod(g, [lx, 0.04, lz], [lx * 0.95, topY, lz * 0.94], 0.028, p.alloy, hd, 8);
  }
  const cab = group(g, 'PlayfieldDeck', [0, 0.92, 0.02]);
  cab.rotation.x = 0.11;
  slab(cab, [0, -0.1, 0], [0.78, 0.24, 1.24], p.primary, hd, 0.1);
  blk(cab, [0, 0.03, 0], [0.68, 0.04, 1.12], p.inset, hd);
  for (const sx of [-0.36, 0.36]) blk(cab, [sx, 0.08, 0], [0.06, 0.16, 1.22], p.primary, hd);
  blk(cab, [0, 0.08, -0.58], [0.76, 0.16, 0.08], p.primary, hd);
  blk(cab, [0, 0.09, 0.6], [0.83, 0.14, 0.08], p.alloy, hd);
  blk(cab, [-0.04, -0.1, 0.63], [0.36, 0.16, 0.04], p.dark, hd);
  for (const sx of [-0.11, 0.03]) blk(cab, [sx, -0.09, 0.655], [0.06, 0.08, 0.022], p.accent, hd);
  for (const [bx, bz] of [[-0.14, -0.22], [0.14, -0.2], [0, -0.04]] as const) {
    cyl(cab, [bx, 0.085, bz], 0.045, 0.032, 0.075, p.stencil, hd);
    cyl(cab, [bx, 0.125, bz], 0.065, 0.06, 0.03, p.accent, hd);
    orb(cab, [bx, 0.14, bz], 0.036, p.optic, hd);
  }
  for (const sx of [-1, 1]) blk(cab, [sx * 0.2, 0.075, 0.22], [0.06, 0.055, 0.18], p.accent, hd, [0, sx * 0.38, 0]);
  pipe(cab, [[-0.26, 0.06, -0.44], [-0.26, 0.11, -0.24], [-0.1, 0.12, -0.36], [0.22, 0.07, -0.44]], 0.015, p.alloy, hd);
  orb(cab, [0.04, 0.075, 0.14], 0.026, p.alloy, hd);
  glass(cab, [0, 0.16, 0], [0.68, 0.016, 1.12]);
  for (const [name, s] of [['LeftFlipper', -1], ['RightFlipper', 1]] as const) {
    const f = group(cab, name, [s * 0.17, 0.068, 0.42]);
    cyl(f, [0, 0, 0], 0.024, 0.024, 0.045, p.accent, hd);
    blk(f, [-s * 0.065, 0, 0.025], [0.14, 0.038, 0.03], p.accent, hd, [0, s * 0.35, 0]);
  }
  const plunger = group(cab, 'BallPlunger', [0.28, -0.02, 0.64]);
  cyl(plunger, [0, 0, -0.04], 0.016, 0.016, 0.18, p.alloy, hd, 'z', 8);
  orb(plunger, [0, 0, 0.06], 0.034, p.accent, hd);
  slab(g, [0, 1.44, -0.52], [0.82, 0.78, 0.28], p.primary, hd, 0.12);
  blk(g, [0, 1.14, -0.37], [0.74, 0.16, 0.038], p.dark, hd);
  for (const sx of [-0.24, 0.24]) cyl(g, [sx, 1.14, -0.35], 0.055, 0.055, 0.024, p.inset, hd, 'z', 10);
  blk(g, [0, 1.52, -0.37], [0.72, 0.48, 0.04], p.accent, hd);
  blk(g, [0, 1.52, -0.345], [0.56, 0.34, 0.025], p.optic, hd);
  const top = group(root, 'BackboxTopper', [0, 1.84, -0.52]);
  slab(top, [0, 0.05, 0], [0.64, 0.12, 0.14], p.accent, hd, 0.28);
  for (const sx of [-0.22, 0, 0.22]) orb(top, [sx, 0.13, 0], 0.042, p.optic, hd);
  if (detail) {
    for (const sx of [-0.4, 0.4]) blk(cab, [sx, 0.15, -0.03], [0.028, 0.034, 1.14], p.alloy, hd);
    for (const x of [-0.2, -0.07, 0.07, 0.2]) blk(cab, [x, 0.07, -0.46], [0.036, 0.055, 0.024], p.stencil, hd);
    for (const sx of [-0.34, 0.34]) bolt(g, [sx, 1.76, -0.36], p, 0.022, 'z');
  }
  root.animations = [new T.AnimationClip('Pinball rally', 2.4, [
    rotationTrack('LeftFlipper', 'y', [0, 0.4, 0.8, 1.5, 2.4], [0, 0.72, 0, 0.65, 0]),
    rotationTrack('RightFlipper', 'y', [0, 0.55, 1.0, 1.7, 2.4], [0, -0.68, 0, -0.72, 0]),
    slideTrack('BallPlunger', [0.28, -0.02, 0.64], 2, [0, 0.5, 0.9, 1.4, 2.4], [0, 0.12, 0, 0.06, 0]),
  ])];
}

export function motorizedTreadmill(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'TreadmillFrame');
  for (const sx of [-0.36, 0.36]) {
    cyl(g, [sx, 0.025, -0.8], 0.05, 0.055, 0.05, p.tire, hd);
    caster(g, [sx * 1.12, 0.055, 0.78], 0.055, 0.05, p, 'x');
  }
  blk(g, [0, 0.06, 0.78], [0.84, 0.075, 0.14], p.dark, hd);
  const deck = group(g, 'RunningDeck', [0, 0.14, 0]);
  deck.rotation.x = -0.075;
  slab(deck, [0, 0, 0], [0.84, 0.12, 1.68], p.primary, hd, 0.15);
  blk(deck, [0, 0.066, -0.14], [0.58, 0.026, 1.34], p.tire, hd);
  for (const sx of [-0.36, 0.36]) {
    blk(deck, [sx, 0.072, -0.12], [0.11, 0.032, 1.36], p.dark, hd);
    blk(deck, [sx, 0.092, -0.12], [0.04, 0.016, 1.24], p.accent, hd);
  }
  slab(deck, [0, 0.13, 0.66], [0.82, 0.22, 0.36], p.primary, hd, 0.2);
  blk(deck, [0, 0.245, 0.66], [0.56, 0.024, 0.16], p.accent, hd);
  const roller = group(deck, 'BeltRoller', [0, 0.02, -0.84]);
  cyl(roller, [0, 0, 0], 0.052, 0.052, 0.64, p.alloy, hd, 'x', 10);
  for (let i = 0; i < 4; i++) blk(roller, [0, Math.sin(i * HPI) * 0.052, Math.cos(i * HPI) * 0.052], [0.56, 0.016, 0.016], p.accent, hd);
  for (const sx of [-0.39, 0.39]) {
    rod(g, [sx, 0.12, 0.74], [sx, 1.18, 0.46], 0.036, p.primary, hd, 8);
    pipe(g, [[sx, 0.94, 0.53], [sx, 0.94, 0.28], [sx, 0.9, -0.06]], 0.026, p.tire, hd);
    cyl(g, [sx, 0.925, 0.16], 0.032, 0.032, 0.18, p.alloy, hd, 'z', 8);
  }
  blk(g, [0, 1.15, 0.46], [0.82, 0.065, 0.1], p.dark, hd);
  const cFace = group(group(root, 'ConsoleTilt', [0, 1.2, 0.46]), '', [0, 0.06, 0]);
  cFace.rotation.x = 0.45;
  slab(cFace, [0, 0, 0], [0.84, 0.12, 0.34], p.dark, hd, 0.2);
  blk(cFace, [0, 0.068, -0.02], [0.46, 0.028, 0.18], p.optic, hd);
  blk(cFace, [0, 0.068, 0.11], [0.22, 0.028, 0.04], p.accent, hd);
  blk(g, [0.34, 1.13, 0.36], [0.14, 0.04, 0.14], p.dark, hd);
  const bottle = group(root, 'WaterBottle', [0.34, 1.15, 0.36]);
  cyl(bottle, [0, 0.09, 0], 0.044, 0.042, 0.18, p.optic, hd);
  cyl(bottle, [0, 0.195, 0], 0.03, 0.042, 0.04, p.accent, hd);
  if (detail) {
    for (let i = 0; i < 6; i++) blk(deck, [0, 0.082, -0.68 + i * 0.22], [0.48, 0.01, 0.032], p.inset, hd);
    for (const sx of [-0.3, 0.3]) blk(cFace, [sx, 0.066, 0], [0.1, 0.026, 0.14], p.edge, hd);
    for (const sx of [-0.36, 0.36]) bolt(g, [sx, 0.1, 0.78], p, 0.02);
  }
  root.animations = [new T.AnimationClip('Sprint workout', 2.4, [
    spinTrack('BeltRoller', 'x', 2.4, 3),
    rotationTrack('ConsoleTilt', 'x', [0, 0.6, 1.4, 2.4], [0, 0.22, -0.16, 0]),
  ])];
}

export function powerSquatRack(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'SquatCage');
  for (const sx of [-0.58, 0.58]) {
    for (const sz of [-0.6, 0.6]) blk(g, [sx, 0.015, sz], [0.16, 0.03, 0.16], p.tire, hd);
    for (const sz of [-0.52, 0.52]) blk(g, [sx, 1.12, sz], [0.085, 2.14, 0.085], p.primary, hd);
    blk(g, [sx, 0.055, 0], [0.1, 0.075, 1.32], p.primary, hd);
    blk(g, [sx, 2.16, 0], [0.08, 0.085, 1.12], p.primary, hd);
    blk(g, [sx, 0.86, 0], [0.065, 0.065, 1.04], p.dark, hd);
    blk(g, [sx, 1.31, 0.59], [0.095, 0.06, 0.13], p.accent, hd);
    blk(g, [sx, 1.36, 0.64], [0.095, 0.09, 0.04], p.accent, hd);
    cyl(g, [sx * 1.16, 0.48, -0.52], 0.025, 0.025, 0.24, p.alloy, hd, 'x', 8);
  }
  blk(g, [0, 0.055, -0.58], [1.14, 0.075, 0.1], p.primary, hd);
  blk(g, [0, 2.16, -0.52], [1.14, 0.085, 0.08], p.dark, hd);
  cyl(g, [0, 2.18, 0.52], 0.024, 0.024, 1.16, p.alloy, hd, 'x', 10);
  for (const sx of [-0.24, 0.24]) cyl(g, [sx, 2.18, 0.6], 0.022, 0.022, 0.18, p.tire, hd, 'z', 8);
  const bar = group(root, 'LoadedBarbell', [0, 1.37, 0.59]);
  cyl(bar, [0, 0, 0], 0.022, 0.022, 1.94, p.alloy, hd, 'x', 10);
  const spare = group(root, 'SparePlates', [0, 0.48, -0.52]);
  for (const sx of [-1, 1]) {
    cyl(bar, [sx * 0.78, 0, 0], 0.036, 0.036, 0.36, p.edge, hd, 'x', 10);
    cyl(bar, [sx * 0.68, 0, 0], 0.22, 0.22, 0.052, p.accent, hd, 'x', 12);
    cyl(bar, [sx * 0.75, 0, 0], 0.19, 0.19, 0.046, p.dark, hd, 'x', 12);
    cyl(bar, [sx * 0.815, 0, 0], 0.155, 0.155, 0.042, p.alloy, hd, 'x', 12);
    cyl(bar, [sx * 0.87, 0, 0], 0.05, 0.05, 0.044, p.edge, hd, 'x', 8);
    cyl(spare, [sx * 0.68, 0, 0], 0.19, 0.19, 0.048, p.accent, hd, 'x', 12);
    cyl(spare, [sx * 0.74, 0, 0], 0.15, 0.15, 0.044, p.dark, hd, 'x', 12);
  }
  if (detail) {
    for (const sx of [-0.58, 0.58]) {
      for (const sz of [-0.52, 0.52]) for (let i = 0; i < 5; i++) bolt(g, [sx, 0.52 + i * 0.32, sz + (sz > 0 ? 0.046 : -0.046)], p, 0.015, 'z');
      blk(g, [sx, 2.04, 0.46], [0.1, 0.14, 0.14], p.accent, hd);
    }
  }
  root.animations = [new T.AnimationClip('Squat lift', 2.8, [slideTrack('LoadedBarbell', [0, 1.37, 0.59], 1, [0, 0.8, 1.6, 2.8], [0, 0.38, 0.38, 0])])];
}

export function foldingPingPongTable(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'TableUndercarriage');
  for (const sx of [-0.56, 0.56]) {
    for (const sz of [-0.26, 0.26]) { caster(g, [sx, 0.06, sz], 0.06, 0.05, p, 'x'); blk(g, [sx, 0.12, sz], [0.07, 0.08, 0.08], p.edge, hd); }
    blk(g, [sx, 0.14, 0], [0.065, 0.065, 0.62], p.dark, hd);
    blk(g, [sx, 0.42, 0], [0.065, 0.58, 0.08], p.dark, hd);
  }
  blk(g, [0, 0.26, 0], [1.14, 0.06, 0.08], p.dark, hd);
  blk(g, [0, 0.72, 0], [1.24, 0.06, 0.1], p.edge, hd);
  for (const sx of [-0.78, 0.78]) { blk(g, [sx, 0.81, 0], [0.048, 0.18, 0.048], p.accent, hd); blk(g, [sx * 0.88, 0.73, 0], [0.18, 0.04, 0.05], p.accent, hd); }
  blk(g, [0, 0.895, 0], [1.58, 0.026, 0.022], p.stencil, hd);
  blk(g, [0, 0.77, 0], [1.56, 0.02, 0.02], p.dark, hd);
  for (let i = -6; i <= 6; i++) blk(g, [i * 0.12, 0.832, 0], [0.016, 0.12, 0.014], p.dark, hd);
  for (const [name, dir] of [['FrontTableLeaf', 1], ['RearTableLeaf', -1]] as const) {
    const lf = group(root, name, [0, 0.74, dir * 0.03]);
    blk(lf, [0, -0.02, dir * 0.59], [1.42, 0.055, 1.14], p.dark, hd);
    blk(lf, [0, 0.02, dir * 0.61], [1.5, 0.042, 1.2], p.primary, hd);
    for (const sx of [-0.72, 0, 0.72]) blk(lf, [sx, 0.048, dir * 0.61], [0.024, 0.014, 1.18], p.stencil, hd);
    blk(lf, [0, 0.048, dir * 1.19], [1.46, 0.014, 0.024], p.stencil, hd);
    for (const sx of [-0.58, 0.58]) {
      rod(lf, [sx, -0.02, dir * 1.02], [sx, -0.71, dir * 1.02], 0.028, p.dark, hd, 8);
      cyl(lf, [sx, -0.72, dir * 1.02], 0.038, 0.042, 0.04, p.tire, hd);
      rod(lf, [sx, -0.34, dir * 1.02], [sx, -0.04, dir * 0.36], 0.018, p.edge, hd, 6);
    }
    blk(lf, [0, -0.42, dir * 1.02], [1.14, 0.04, 0.04], p.edge, hd);
  }
  const pad = group(root, 'PaddleSet', [0.64, 0.52, 0]);
  slab(pad, [0, 0, 0], [0.14, 0.14, 0.28], p.accent, hd, 0.2);
  for (const sz of [-0.06, 0.06]) { cyl(pad, [0.02, 0.1, sz], 0.075, 0.075, 0.02, p.dark, hd, 'x', 10); blk(pad, [0.02, 0.02, sz], [0.024, 0.11, 0.028], p.primary, hd); }
  orb(pad, [-0.01, 0.09, 0], 0.024, p.stencil, hd);
  if (detail) for (const sx of [-0.56, 0.56]) { bolt(g, [sx, 0.75, 0], p, 0.022); for (const sz of [-0.05, 0.05]) blk(g, [sx, 0.42, sz], [0.08, 0.04, 0.04], p.accent, hd); }
  root.animations = [new T.AnimationClip('Fold table', 3.0, [
    rotationTrack('FrontTableLeaf', 'x', [0, 0.9, 1.9, 3.0], [0, -1.25, -1.25, 0]),
    rotationTrack('RearTableLeaf', 'x', [0, 0.9, 1.9, 3.0], [0, 1.25, 1.25, 0]),
  ])];
}

export function boxingRingCorner(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'RingCornerBase');
  for (const sx of [-0.62, 0.62]) for (const sz of [-0.62, 0.62]) blk(g, [sx, 0.2, sz], [0.12, 0.4, 0.12], p.dark, hd);
  blk(g, [0, 0.24, 0], [1.36, 0.3, 1.36], p.dark, hd);
  slab(g, [0, 0.42, 0], [1.46, 0.08, 1.46], p.stencil, hd, 0.08);
  for (const sz of [-0.71, 0.71]) blk(g, [0, 0.36, sz], [1.4, 0.06, 0.05], p.primary, hd);
  blk(g, [-0.82, 0.18, -0.78], [0.4, 0.14, 0.38], p.edge, hd);
  blk(g, [-0.82, 0.07, -0.92], [0.42, 0.14, 0.26], p.dark, hd);
  cyl(g, [-0.64, 0.78, -0.64], 0.072, 0.078, 1.56, p.dark, hd, 'y', 10);
  orb(g, [-0.64, 1.59, -0.64], 0.082, p.accent, hd);
  cyl(g, [-0.5, 0.98, -0.5], 0.125, 0.125, 0.98, p.primary, hd, 'y', 12);
  for (const [px, pz] of [[0.64, -0.64], [-0.64, 0.64]] as const) { cyl(g, [px, 0.96, pz], 0.048, 0.052, 1.06, p.edge, hd, 'y', 8); orb(g, [px, 1.51, pz], 0.056, p.dark, hd); }
  const ropeMats = [p.primary, p.stencil, p.dark] as const;
  for (const [idx, ry] of [0.72, 1.02, 1.32].entries()) {
    const rMat = ropeMats[idx] ?? p.primary;
    rod(g, [-0.64, ry, -0.64], [-0.5, ry, -0.5], 0.024, p.alloy, hd, 6);
    rod(g, [-0.5, ry, -0.5], [0.64, ry, -0.64], 0.022, rMat, hd, 8);
    rod(g, [-0.5, ry, -0.5], [-0.64, ry, 0.64], 0.022, rMat, hd, 8);
  }
  blk(g, [-0.72, 1.34, -0.64], [0.22, 0.05, 0.05], p.edge, hd);
  const bell = group(root, 'CornerBell', [-0.82, 1.34, -0.64]);
  lathe(bell, [0, -0.22, 0], [[0, 0.22], [0.06, 0.2], [0.09, 0.12], [0.13, 0.02], [0.11, 0], [0, 0]], p.accent, hd, 12);
  rod(bell, [0, 0, 0], [0, -0.24, 0], 0.014, p.dark, hd, 6);
  orb(bell, [0, -0.24, 0], 0.032, p.alloy, hd);
  const stool = group(root, 'RingStool', [0.08, 0.45, 0.08]);
  cyl(stool, [0, 0.34, 0], 0.18, 0.17, 0.065, p.primary, hd, 'y', 12);
  for (let i = 0; i < 3; i++) rod(stool, [Math.cos((i * 2.094)) * 0.11, 0.32, Math.sin(i * 2.094) * 0.11], [Math.cos(i * 2.094) * 0.16, 0, Math.sin(i * 2.094) * 0.16], 0.02, p.dark, hd, 6);
  if (detail) {
    for (const ry of [0.72, 1.02, 1.32]) band(g, [-0.5, ry, -0.5], 0.134, 0.018, 0.035, p.accent, hd);
    rod(g, [0.12, 0.72, -0.58], [0.12, 1.32, -0.58], 0.016, p.accent, hd, 6);
    rod(g, [-0.58, 0.72, 0.12], [-0.58, 1.32, 0.12], 0.016, p.accent, hd, 6);
  }
  root.animations = [new T.AnimationClip('Ring round bell', 2.0, [rotationTrack('CornerBell', 'z', [0, 0.35, 0.75, 1.15, 1.6, 2.0], [0, 0.42, -0.38, 0.32, -0.22, 0])])];
}

export function parkSeesawPlank(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'SeesawFulcrum');
  for (const sx of [-0.34, 0.34]) {
    blk(g, [sx, 0.025, 0], [0.2, 0.05, 0.84], p.dark, hd);
    for (const sz of [-0.34, 0.34]) rod(g, [sx, 0.04, sz], [sx * 0.82, 0.64, 0], 0.034, p.primary, hd, 8);
    rod(g, [sx, 0.3, -0.18], [sx, 0.3, 0.18], 0.024, p.edge, hd, 6);
  }
  cyl(g, [0, 0.64, 0], 0.052, 0.052, 0.66, p.alloy, hd, 'x', 10);
  for (const sx of [-0.28, 0.28]) cyl(g, [sx, 0.64, 0], 0.075, 0.075, 0.08, p.dark, hd, 'x', 10);
  const beam = group(root, 'SeesawBeam', [0, 0.64, 0]);
  blk(beam, [0, 0.01, 0], [0.24, 0.13, 0.32], p.dark, hd);
  blk(beam, [0, -0.01, 0], [0.16, 0.06, 2.66], p.dark, hd);
  slab(beam, [0, 0.06, 0], [0.28, 0.09, 2.86], p.accent, hd, 0.2);
  for (const dir of [-1, 1] as const) {
    const sz = dir * 1.16;
    const hz = sz - dir * 0.28;
    slab(beam, [0, 0.13, sz], [0.34, 0.06, 0.36], p.primary, hd, 0.28);
    slab(beam, [0, 0.22, sz + dir * 0.15], [0.32, 0.14, 0.075], p.primary, hd, 0.25);
    pipe(beam, [[-0.12, 0.09, hz], [-0.12, 0.34, hz], [0.12, 0.34, hz], [0.12, 0.09, hz]], 0.022, p.primary, hd);
    cyl(beam, [0, 0.34, hz], 0.028, 0.028, 0.18, p.tire, hd, 'x', 8);
    cyl(beam, [0, -0.06, hz - dir * 0.06], 0.02, 0.02, 0.42, p.alloy, hd, 'x', 8);
  }
  const tires = group(root, 'BumperTires', [0, 0, 0]);
  for (const sz of [-1.14, 1.14]) {
    blk(tires, [0, 0.03, sz], [0.34, 0.06, 0.32], p.edge, hd);
    torus(tires, [0, 0.15, sz], 0.11, 0.055, p.tire, hd, [0, HPI, 0]);
  }
  if (detail) {
    for (const sx of [-0.34, 0.34]) for (const sz of [-0.32, 0.32]) bolt(g, [sx, 0.055, sz], p, 0.022);
    for (const z of [-0.62, 0.62]) blk(beam, [0, 0.112, z], [0.2, 0.018, 0.34], p.stencil, hd);
  }
  root.animations = [new T.AnimationClip('Teeter-totter', 2.8, [rotationTrack('SeesawBeam', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.24, 0, -0.24, 0])])];
}

export function playgroundMerryGoRound(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'CarouselHub');
  cyl(g, [0, 0.04, 0], 0.42, 0.46, 0.08, p.edge, hd, 'y', 12);
  cyl(g, [0, 0.13, 0], 0.22, 0.26, 0.12, p.dark, hd, 'y', 10);
  const deck = group(root, 'CarouselDeck', [0, 0.18, 0]);
  cyl(deck, [0, 0.05, 0], 1.04, 1.06, 0.1, p.primary, hd, 'y', 12);
  band(deck, [0, 0.06, 0], 1.08, 0.05, 0.09, p.dark, hd);
  cyl(deck, [0, 0.44, 0], 0.075, 0.095, 0.72, p.dark, hd, 'y', 10);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    blk(deck, [Math.cos(a) * 0.56, 0.11, Math.sin(a) * 0.56], [0.68, 0.022, 0.18], i % 2 === 0 ? p.accent : p.stencil, hd, [0, -a, 0]);
  }
  for (let i = 0; i < 4; i++) {
    const ca = Math.cos(i * HPI);
    const sa = Math.sin(i * HPI);
    pipe(deck, [[ca * 0.94, 0.08, sa * 0.94], [ca * 0.94, 0.52, sa * 0.94], [ca * 0.72, 0.76, sa * 0.72], [ca * 0.08, 0.74, sa * 0.08]], 0.028, p.primary, hd);
    rod(deck, [ca * 0.58, 0.08, sa * 0.58], [ca * 0.58, 0.74, sa * 0.58], 0.02, p.alloy, hd, 6);
  }
  const wheel = group(deck, 'CenterWheel', [0, 0.8, 0]);
  cyl(wheel, [0, 0, 0], 0.08, 0.09, 0.08, p.dark, hd, 'y', 10);
  band(wheel, [0, 0.02, 0], 0.29, 0.036, 0.048, p.accent, hd);
  for (let i = 0; i < 4; i++) rod(wheel, [0, 0.02, 0], [Math.cos(i * HPI + 0.785) * 0.27, 0.02, Math.sin(i * HPI + 0.785) * 0.27], 0.018, p.alloy, hd, 6);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      bolt(g, [Math.cos(a) * 0.36, 0.085, Math.sin(a) * 0.36], p, 0.022);
      bolt(deck, [Math.cos(a) * 0.98, 0.11, Math.sin(a) * 0.98], p, 0.02);
    }
  }
  root.animations = [new T.AnimationClip('Spin merry-go-round', 3.6, [spinTrack('CarouselDeck', 'y', 3.6, 1)])];
}

export function spiralPlaygroundSlide(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd;
  const g = group(root, 'SlideTower');
  for (const px of [-0.82, -0.02]) for (const pz of [-0.44, 0.36]) {
    blk(g, [px, 0.025, pz], [0.15, 0.05, 0.15], p.dark, hd);
    blk(g, [px, 1.18, pz], [0.09, 2.3, 0.09], p.primary, hd);
  }
  slab(g, [-0.42, 1.38, -0.04], [0.88, 0.1, 0.88], p.dark, hd, 0.12);
  for (const sx of [-0.62, -0.22]) {
    rod(g, [sx, 0.03, -0.78], [sx, 1.42, -0.44], 0.028, p.primary, hd, 8);
    pipe(g, [[sx, 1.42, -0.44], [sx, 1.88, -0.44], [sx, 1.88, -0.24]], 0.024, p.accent, hd);
  }
  for (let i = 0; i < 6; i++) blk(g, [-0.42, 0.04 + ((i + 0.5) / 6) * 1.34, -0.78 + ((i + 0.5) / 6) * 0.34], [0.42, 0.04, 0.08], p.accent, hd);
  blk(g, [-0.82, 1.98, -0.04], [0.06, 0.06, 0.8], p.primary, hd);
  for (const y of [1.74, 1.98]) blk(g, [-0.42, y, 0.36], [0.8, 0.06, 0.06], p.primary, hd);
  for (const o of [-0.26, -0.08, 0.1, 0.26]) {
    blk(g, [-0.82, 1.7, -0.04 + o], [0.032, 0.56, 0.032], p.stencil, hd);
    blk(g, [-0.42 + o, 1.7, 0.36], [0.032, 0.56, 0.032], p.stencil, hd);
  }
  const roof = group(root, 'TowerRoof', [-0.42, 2.3, -0.04]);
  for (const s of [-1, 1]) blk(roof, [s * 0.28, 0.22, 0], [0.64, 0.065, 1.02], p.primary, hd, [0, 0, -s * 0.48]);
  blk(roof, [0, 0.38, 0], [0.1, 0.08, 1.06], p.accent, hd);
  for (const sz of [-0.4, 0.4]) blk(roof, [0, 0.14, sz], [0.82, 0.18, 0.06], p.primary, hd);
  const wheel = group(root, 'ActivityWheel', [-0.42, 1.74, 0.43]);
  cyl(wheel, [0, 0, -0.04], 0.035, 0.035, 0.1, p.edge, hd, 'z', 8);
  band(wheel, [0, 0, 0.02], 0.2, 0.032, 0.04, p.accent, hd, [HPI, 0, 0]);
  for (let i = 0; i < 6; i++) rod(wheel, [0, 0, 0.02], [Math.cos((i * Math.PI) / 3) * 0.19, Math.sin((i * Math.PI) / 3) * 0.19, 0.02], 0.015, p.stencil, hd, 6);
  cyl(g, [0.46, 0.025, -0.04], 0.18, 0.2, 0.05, p.dark, hd, 'y', 10);
  cyl(g, [0.46, 0.82, -0.04], 0.072, 0.082, 1.58, p.edge, hd, 'y', 10);
  const ptAt = (t: number): Point => [0.46 + Math.cos(Math.PI - t * Math.PI * 1.4) * 0.44, 1.38 - t * 1.18, -0.04 + Math.sin(Math.PI - t * Math.PI * 1.4) * 0.44];
  for (let i = 0; i < 15; i++) {
    const p0 = new T.Vector3(...ptAt(Math.max(0, i / 15 - 0.02)));
    const p1 = new T.Vector3(...ptAt(Math.min(1, (i + 1) / 15 + 0.02)));
    const seg = group(g, '', [(p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5, (p0.z + p1.z) * 0.5]);
    seg.lookAt(p1);
    const len = p0.distanceTo(p1) + 0.06;
    blk(seg, [0, 0, 0], [0.44, 0.07, len], p.accent, hd);
    for (const sx of [-0.2, 0.2]) blk(seg, [sx, 0.12, 0], [0.06, 0.22, len], p.accent, hd);
    if (i === 4 || i === 9 || i === 13) rod(g, [0.46, seg.position.y, -0.04], [seg.position.x, seg.position.y, seg.position.z], 0.032, p.edge, hd, 6);
  }
  const ex = ptAt(1);
  cyl(g, [ex[0], 0.1, ex[2]], 0.065, 0.08, 0.2, p.dark, hd);
  if (detail) {
    for (const px of [-0.82, -0.02]) for (const pz of [-0.44, 0.36]) bolt(g, [px, 0.055, pz], p, 0.022);
    for (let i = 0; i < 6; i++) orb(wheel, [Math.cos((i * Math.PI) / 3) * 0.22, Math.sin((i * Math.PI) / 3) * 0.22, 0.02], 0.028, p.optic, hd);
  }
  root.animations = [new T.AnimationClip('Spin activity wheel', 2.6, [spinTrack('ActivityWheel', 'z', 2.6, 1)])];
}
