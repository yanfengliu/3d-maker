import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { cyl, guardGlass, handwheel, HPI, orb, shopWheel, slideTrack, torus } from './workshop-machinery-kit';

export function dieselBackupGenerator(root: T.Group, p: Finish, detail: boolean) {
  const g = group(root, 'DieselGenerator');
  shell(g, [0, 0.1, 0], [1.72, 0.2, 0.94], p.dark, 0.12);
  shell(g, [0, 0.66, 0], [1.56, 0.96, 0.84], p.primary, 0.14);
  box(g, [0, 0.64, 0.382], [0.92, 0.66, 0.11], p.inset);
  for (const x of [-0.22, 0, 0.22]) tube(g, [x, 0.62, 0.24], 0.08, 0.09, 0.44, p.alloy, 12);
  shell(g, [0.58, 0.72, 0.44], [0.34, 0.46, 0.05], p.dark, 0.16);
  box(g, [0.58, 0.82, 0.475], [0.22, 0.14, 0.02], p.optic);
  cyl(g, [-0.34, 1.24, 0], 0.11, 0.11, 0.56, p.edge, 'x', 14);
  tube(g, [-0.58, 1.44, 0], 0.052, 0.06, 0.34, p.dark, 12);
  ring(g, [-0.79, 0.68, 0], 0.32, 0.04, 0.08, p.dark).rotation.z = HPI;
  const fan = group(root, 'RadiatorFan', [-0.79, 0.68, 0]);
  cyl(fan, [0, 0, 0], 0.075, 0.075, 0.08, p.accent, 'x', 12);
  for (let i = 0; i < 6; i++) {
    const b = box(fan, [0, 0, 0], [0.022, 0.54, 0.09], p.accent);
    b.rotation.x = (i * Math.PI) / 3;
    b.rotation.y = 0.25;
  }
  const panel = group(root, 'ServicePanel', [-0.46, 0.64, 0.445]);
  shell(panel, [0.46, 0, 0.02], [0.92, 0.68, 0.05], p.primary, 0.12);
  for (let i = 0; i < 4; i++) box(panel, [0.46, -0.18 + i * 0.12, 0.055], [0.68, 0.03, 0.018], p.dark);
  box(panel, [0.84, 0, 0.06], [0.045, 0.14, 0.025], p.accent);
  if (detail) {
    for (const sx of [-0.74, 0.74]) for (const sz of [-0.44, 0.44]) strut(g, [sx, 0.2, sz], [sx, 1.18, sz], 0.026, p.accent, 8);
    if (p.hd) for (const sx of [-0.68, 0.68]) fastener(g, [sx, 0.12, 0.48], p, 0.026).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Run engine', 1.8, [spinTrack('RadiatorFan', 'x', 1.8, 3)]),
    new T.AnimationClip('Open service', 3, [rotationTrack('ServicePanel', 'y', [0, 0.9, 2.1, 3], [0, -1.3, -1.3, 0])]),
  ];
}

export function twinTankAirCompressor(root: T.Group, p: Finish, detail: boolean) {
  const c = group(root, 'AirCompressor');
  for (const sz of [-0.24, 0.24]) {
    cyl(c, [0, 0.34, sz], 0.18, 0.18, 1.14, p.primary, 'x', 16);
    for (const sx of [-0.57, 0.57]) orb(c, [sx, 0.34, sz], 0.18, p.primary, p.hd, [0.45, 1, 1]);
  }
  for (const sz of [-0.24, 0.24]) {
    tube(c, [0.44, 0.09, sz], 0.04, 0.046, 0.18, p.tire, 10);
    strut(c, [0.44, 0.38, sz], [0.76, 0.72, sz], 0.024, p.dark, 8);
  }
  strut(c, [0.76, 0.72, -0.24], [0.76, 0.72, 0.24], 0.028, p.tire, 10);
  shopWheel(c, 'CompWheelL', [-0.42, 0.18, -0.46], 0.18, 0.06, p);
  shopWheel(c, 'CompWheelR', [-0.42, 0.18, 0.46], 0.18, 0.06, p);
  cyl(c, [-0.42, 0.18, 0], 0.024, 0.024, 0.92, p.alloy, 'z', 10);
  shell(c, [0, 0.56, 0], [0.88, 0.08, 0.64], p.dark, 0.12);
  box(c, [-0.2, 0.62, 0], [0.24, 0.1, 0.2], p.dark);
  cyl(c, [-0.2, 0.74, 0], 0.14, 0.14, 0.34, p.dark, 'x', 14);
  shell(c, [0.22, 0.64, 0], [0.22, 0.16, 0.26], p.dark, 0.16);
  for (const s of [-1, 1]) {
    const fin = tube(c, [0.22, 0.78, s * 0.1], 0.095, 0.095, 0.28, p.alloy, 12);
    fin.rotation.x = s * 0.45;
  }
  const fly = group(root, 'FlywheelPulley', [0.22, 0.76, 0.32]);
  ring(fly, [0, 0, 0], 0.16, 0.032, 0.055, p.accent).rotation.x = HPI;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    strut(fly, [0, 0, 0], [Math.sin(a) * 0.14, Math.cos(a) * 0.14, 0], 0.016, p.accent, 8);
  }
  if (detail) {
    for (const sz of [-0.08, 0.08]) cyl(c, [0.46, 0.66, sz], 0.055, 0.055, 0.035, p.stencil, 'x', 12);
    if (p.hd) for (const sz of [-0.24, 0.24]) fastener(c, [0, 0.61, sz], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Pump air', 1.8, [spinTrack('FlywheelPulley', 'z', 1.8, 3)]),
    new T.AnimationClip('Roll compressor', 2.8, [spinTrack('CompWheelL', 'z', 2.8, 2), spinTrack('CompWheelR', 'z', 2.8, 2)]),
  ];
}

export function migWelderCart(root: T.Group, p: Finish, detail: boolean) {
  const wc = group(root, 'WelderCart');
  shell(wc, [0, 0.14, 0], [0.76, 0.08, 1.18], p.dark, 0.12);
  for (const sx of [-0.36, 0.36]) {
    tube(wc, [sx, 0.06, 0.44], 0.06, 0.06, 0.12, p.tire, 10);
    ring(wc, [sx, 0.16, -0.44], 0.16, 0.032, 0.06, p.tire).rotation.z = HPI;
    strut(wc, [sx, 0.16, -0.44], [sx, 0.94, -0.34], 0.024, p.dark, 8);
  }
  strut(wc, [-0.36, 0.94, -0.34], [0.36, 0.94, -0.34], 0.026, p.accent, 8);
  shell(wc, [0, 0.5, 0.2], [0.64, 0.64, 0.72], p.primary, 0.14);
  box(wc, [0, 0.58, 0.575], [0.52, 0.42, 0.03], p.dark);
  for (const x of [-0.14, 0.14]) cyl(wc, [x, 0.62, 0.6], 0.048, 0.048, 0.04, p.accent, 'z', 12);
  tube(wc, [0, 0.84, -0.36], 0.15, 0.15, 1.32, p.optic, 16);
  orb(wc, [0, 1.5, -0.36], 0.15, p.optic, p.hd);
  tube(wc, [0, 1.66, -0.36], 0.05, 0.055, 0.12, p.accent, 10);
  const spool = group(root, 'WireSpool', [-0.36, 0.56, 0.2]);
  ring(spool, [0, 0, 0], 0.15, 0.06, 0.09, p.accent).rotation.z = HPI;
  cyl(spool, [0, 0, 0], 0.05, 0.05, 0.12, p.dark, 'x', 10);
  const boom = group(root, 'TorchBoom', [0.32, 0.82, 0.2]);
  strut(boom, [0, 0, 0], [0.06, 0.56, 0.22], 0.022, p.dark, 8);
  strut(boom, [0.06, 0.56, 0.22], [0.04, 0.34, 0.58], 0.018, p.tire, 8);
  tube(boom, [0.04, 0.26, 0.64], 0.022, 0.034, 0.16, p.accent, 10).rotation.x = 0.6;
  if (detail) {
    box(wc, [0, 0.46, 0.6], [0.18, 0.1, 0.02], p.optic);
    if (p.hd) for (const sx of [-0.28, 0.28]) fastener(wc, [sx, 0.8, 0.56], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Feed wire', 2.4, [
      spinTrack('WireSpool', 'x', 2.4, 2),
      rotationTrack('TorchBoom', 'y', [0, 0.6, 1.2, 1.8, 2.4], [0, 0.45, 0, -0.45, 0]),
    ]),
  ];
}

export function verticalWoodBandsaw(root: T.Group, p: Finish, detail: boolean) {
  const bs = group(root, 'WoodBandsaw');
  shell(bs, [0, 0.36, 0], [0.76, 0.72, 0.72], p.dark, 0.12);
  shell(bs, [-0.14, 1.18, 0], [0.24, 1.08, 0.34], p.primary, 0.16);
  cyl(bs, [0.04, 0.74, -0.06], 0.3, 0.3, 0.24, p.primary, 'z', 16);
  cyl(bs, [0.04, 1.76, -0.06], 0.3, 0.3, 0.24, p.primary, 'z', 16);
  strut(bs, [0.3, 0.74, 0.02], [0.3, 1.76, 0.02], 0.014, p.alloy, 8);
  const uWheel = group(root, 'UpperBandWheel', [0.04, 1.76, 0.09]);
  ring(uWheel, [0, 0, 0], 0.25, 0.036, 0.055, p.accent).rotation.x = HPI;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    strut(uWheel, [0, 0, 0], [Math.sin(a) * 0.22, Math.cos(a) * 0.22, 0], 0.016, p.alloy, 8);
  }
  const tbl = group(root, 'SawTable', [0.28, 1.04, 0.02]);
  shell(tbl, [0, 0, 0], [0.64, 0.065, 0.62], p.alloy, 0.1);
  box(tbl, [-0.12, 0.055, 0], [0.05, 0.09, 0.56], p.accent);
  if (detail) {
    tube(bs, [0.04, 2.1, -0.06], 0.035, 0.035, 0.12, p.accent, 10);
    if (p.hd) for (const sx of [-0.26, 0.26]) fastener(bs, [sx, 0.68, 0.37], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Run bandsaw', 1.8, [spinTrack('UpperBandWheel', 'z', 1.8, 3)]),
    new T.AnimationClip('Tilt table', 3, [rotationTrack('SawTable', 'z', [0, 0.9, 2.1, 3], [0, -0.55, -0.55, 0])]),
  ];
}

export function rotaryCementMixer(root: T.Group, p: Finish, detail: boolean) {
  const cm = group(root, 'CementMixer');
  box(cm, [0, 0.24, 0], [0.96, 0.09, 0.58], p.dark);
  for (const sz of [-0.26, 0.26]) strut(cm, [-0.46, 0.02, sz], [-0.46, 0.24, sz], 0.034, p.dark, 8);
  shopWheel(cm, 'MixerWheelL', [0.36, 0.22, -0.4], 0.22, 0.08, p);
  shopWheel(cm, 'MixerWheelR', [0.36, 0.22, 0.4], 0.22, 0.08, p);
  cyl(cm, [0.36, 0.22, 0], 0.028, 0.028, 0.84, p.alloy, 'z', 10);
  for (const sz of [-0.26, 0.26]) strut(cm, [0.1, 0.26, sz], [0.1, 0.96, sz * 1.2], 0.036, p.dark, 10);
  shell(cm, [-0.28, 0.52, 0], [0.36, 0.42, 0.42], p.accent, 0.16);
  const drum = group(root, 'MixerDrum', [0.1, 1.0, 0]);
  drum.rotation.z = -0.48;
  tube(drum, [0, -0.18, 0], 0.38, 0.24, 0.36, p.primary, 16);
  tube(drum, [0, 0.22, 0], 0.22, 0.38, 0.46, p.primary, 16);
  ring(drum, [0, 0.46, 0], 0.23, 0.03, 0.05, p.dark);
  ring(drum, [0, 0.0, 0], 0.395, 0.026, 0.06, p.accent);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    box(drum, [Math.sin(a) * 0.2, 0.18, Math.cos(a) * 0.2], [0.04, 0.34, 0.08], p.dark).rotation.y = a;
  }
  const tilt = group(root, 'TiltWheel', [0.1, 0.96, 0.42]);
  ring(tilt, [0, 0, 0], 0.24, 0.028, 0.045, p.accent).rotation.x = HPI;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    strut(tilt, [0, 0, 0], [Math.sin(a) * 0.22, Math.cos(a) * 0.22, 0], 0.016, p.dark, 8);
  }
  if (detail) {
    strut(cm, [-0.46, 0.24, -0.24], [-0.94, 0.24, 0], 0.024, p.dark, 8);
    strut(cm, [-0.46, 0.24, 0.24], [-0.94, 0.24, 0], 0.024, p.dark, 8);
    if (p.hd) for (const sz of [-0.24, 0.24]) fastener(cm, [0.1, 0.96, sz * 1.25], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Mix batch', 2.4, [spinTrack('MixerDrum', 'y', 2.4, 2)]),
    new T.AnimationClip('Dump tilt', 2.8, [rotationTrack('TiltWheel', 'z', [0, 0.9, 2, 2.8], [0, 1.5, 1.5, 0])]),
  ];
}

export function castIronJointer(root: T.Group, p: Finish, detail: boolean) {
  const j = group(root, 'JointerPlaner');
  shell(j, [0, 0.06, 0], [0.96, 0.12, 0.66], p.dark, 0.12);
  shell(j, [0, 0.44, 0], [0.84, 0.68, 0.54], p.primary, 0.12);
  box(j, [-0.44, 0.84, 0], [0.86, 0.1, 0.44], p.alloy);
  box(j, [0.44, 0.86, 0], [0.86, 0.1, 0.44], p.alloy);
  shell(j, [0, 1.0, -0.18], [0.92, 0.22, 0.08], p.primary, 0.1);
  handwheel(j, [-0.9, 0.8, 0], 0.1, 'x', p);
  handwheel(j, [0.9, 0.82, 0], 0.1, 'x', p);
  const cutter = group(root, 'CutterHead', [0, 0.85, 0]);
  cyl(cutter, [0, 0, 0], 0.065, 0.065, 0.4, p.dark, 'z', 14);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    box(cutter, [Math.sin(a) * 0.065, Math.cos(a) * 0.065, 0], [0.022, 0.022, 0.36], p.accent).rotation.z = -a;
  }
  const guard = group(root, 'BladeGuard', [0.18, 0.92, 0.22]);
  shell(guard, [-0.18, 0, -0.14], [0.34, 0.04, 0.24], p.accent, 0.36);
  if (detail) {
    box(j, [0, 0.56, 0.29], [0.16, 0.12, 0.04], p.accent);
    cyl(j, [0, 0.24, -0.32], 0.09, 0.09, 0.16, p.dark, 'z', 12);
    if (p.hd) for (const sx of [-0.36, 0.36]) fastener(j, [sx, 0.74, 0.28], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Plane board', 2.2, [
      spinTrack('CutterHead', 'z', 2.2, 4),
      rotationTrack('BladeGuard', 'y', [0, 0.7, 1.5, 2.2], [0, -0.95, -0.95, 0]),
    ]),
  ];
}

export function cycloneDustCollector(root: T.Group, p: Finish, detail: boolean) {
  const dc = group(root, 'DustCollector');
  shell(dc, [0, 0.06, 0], [0.96, 0.12, 0.92], p.dark, 0.18);
  for (const sx of [-0.42, 0.42]) for (const sz of [-0.38, 0.38]) strut(dc, [sx, 0.1, sz], [sx, 1.72, sz], 0.032, p.dark, 10);
  tube(dc, [-0.14, 1.24, 0], 0.28, 0.09, 0.64, p.primary, 16);
  tube(dc, [-0.14, 1.66, 0], 0.28, 0.28, 0.26, p.primary, 16);
  cyl(dc, [-0.44, 1.66, 0.14], 0.095, 0.095, 0.34, p.alloy, 'x', 12);
  tube(dc, [-0.14, 1.98, 0], 0.15, 0.15, 0.32, p.dark, 14);
  tube(dc, [0.24, 1.38, 0], 0.22, 0.22, 0.72, p.stencil, 16);
  cyl(dc, [0.06, 1.78, 0], 0.11, 0.11, 0.38, p.alloy, 'x', 12);
  const fan = group(root, 'ImpellerFan', [-0.14, 1.82, 0]);
  tube(fan, [0, 0, 0], 0.07, 0.07, 0.06, p.accent, 10);
  for (let i = 0; i < 6; i++) box(fan, [0, 0, 0], [0.46, 0.03, 0.08], p.accent).rotation.y = (i * Math.PI) / 3;
  const drum = group(root, 'CollectionDrum', [-0.14, 0.12, 0]);
  tube(drum, [0, 0.38, 0], 0.29, 0.27, 0.74, p.accent, 16);
  for (const y of [0.24, 0.54]) ring(drum, [0, y, 0], 0.3, 0.022, 0.04, p.dark);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      box(dc, [0.24 + Math.sin(a) * 0.22, 1.38, Math.cos(a) * 0.22], [0.025, 0.66, 0.025], p.dark).rotation.y = a;
    }
    if (p.hd) for (const sx of [-0.42, 0.42]) fastener(dc, [sx, 1.72, 0.4], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Extract dust', 1.8, [spinTrack('ImpellerFan', 'y', 1.8, 3)])];
}

export function pedestalBenchGrinder(root: T.Group, p: Finish, detail: boolean) {
  const bg = group(root, 'BenchGrinder');
  tube(bg, [0, 0.06, 0], 0.32, 0.36, 0.12, p.dark, 16);
  tube(bg, [0, 0.54, 0], 0.11, 0.16, 0.88, p.primary, 14);
  shell(bg, [0, 1.02, 0], [0.44, 0.1, 0.36], p.dark, 0.18);
  box(bg, [0, 1.11, 0], [0.26, 0.14, 0.2], p.dark);
  cyl(bg, [0, 1.24, 0], 0.14, 0.14, 0.44, p.primary, 'x', 16);
  cyl(bg, [0, 1.24, 0], 0.036, 0.036, 0.82, p.alloy, 'x', 12);
  for (const s of [-1, 1]) {
    cyl(bg, [s * 0.34, 1.24, -0.02], 0.22, 0.22, 0.14, p.primary, 'x', 14);
    box(bg, [s * 0.34, 1.12, 0.2], [0.1, 0.036, 0.14], p.alloy);
  }
  tube(bg, [0, 0.78, 0.18], 0.085, 0.068, 0.14, p.optic, 12);
  const wL = group(root, 'WheelLeft', [-0.34, 1.24, 0.02]);
  cyl(wL, [0, 0, 0], 0.19, 0.19, 0.085, p.stencil, 'x', 16);
  box(wL, [-0.05, 0.08, 0], [0.02, 0.07, 0.04], p.accent);
  const wR = group(root, 'WheelRight', [0.34, 1.24, 0.02]);
  cyl(wR, [0, 0, 0], 0.19, 0.19, 0.085, p.accent, 'x', 16);
  box(wR, [0.05, 0.08, 0], [0.02, 0.07, 0.04], p.dark);
  const shield = group(root, 'SparkShield', [-0.34, 1.44, 0.06]);
  strut(shield, [0, -0.02, -0.02], [0, 0.06, 0.18], 0.016, p.alloy, 8);
  guardGlass(shield, [0, 0.05, 0.18], [0.18, 0.16, 0.02]);
  if (detail) {
    box(bg, [0, 1.14, 0.16], [0.14, 0.08, 0.05], p.accent);
    if (p.hd) for (let i = 0; i < 4; i++) fastener(bg, [Math.sin(i * HPI) * 0.26, 0.13, Math.cos(i * HPI) * 0.26], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Grind steel', 1.6, [spinTrack('WheelLeft', 'x', 1.6, 4), spinTrack('WheelRight', 'x', 1.6, 4)]),
    new T.AnimationClip('Tilt shield', 2.8, [rotationTrack('SparkShield', 'x', [0, 0.8, 2, 2.8], [0, -0.85, -0.85, 0])]),
  ];
}

export function flatbedLaserCutter(root: T.Group, p: Finish, detail: boolean) {
  const lc = group(root, 'LaserCutter');
  for (const sx of [-0.62, 0.62]) for (const sz of [-0.42, 0.42]) tube(lc, [sx, 0.06, sz], 0.05, 0.05, 0.12, p.tire, 10);
  shell(lc, [0, 0.48, 0], [1.46, 0.76, 1.02], p.primary, 0.1);
  box(lc, [0, 0.89, 0], [1.14, 0.06, 0.78], p.inset);
  box(lc, [0.56, 0.94, 0.24], [0.24, 0.14, 0.46], p.dark);
  box(lc, [0.56, 1.02, 0.22], [0.16, 0.02, 0.22], p.optic);
  orb(lc, [0.56, 1.04, 0.4], 0.045, p.accent, p.hd);
  const gantry = group(root, 'LaserGantry', [-0.14, 0.94, -0.22]);
  box(gantry, [0, 0, 0], [1.08, 0.065, 0.075], p.alloy);
  shell(gantry, [0.12, -0.02, 0.04], [0.12, 0.12, 0.12], p.accent, 0.18);
  const lid = group(root, 'AcrylicLid', [-0.14, 0.86, -0.46]);
  for (const sx of [-0.56, 0.56]) box(lid, [sx, 0.09, 0.46], [0.065, 0.18, 0.92], p.dark);
  for (const sz of [0.04, 0.88]) box(lid, [0, 0.09, sz], [1.18, 0.18, 0.065], p.dark);
  guardGlass(lid, [0, 0.16, 0.46], [1.04, 0.028, 0.78]);
  box(lid, [0, 0.16, 0.94], [0.46, 0.04, 0.05], p.accent);
  if (detail) {
    cyl(lc, [-0.78, 0.56, -0.24], 0.11, 0.11, 0.18, p.dark, 'x', 12);
    if (p.hd) for (const sx of [-0.62, 0.62]) fastener(lc, [sx, 0.86, 0.52], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Laser engrave', 2.8, [slideTrack('LaserGantry', [-0.14, 0.94, -0.22], 2, [0, 0.7, 1.4, 2.1, 2.8], [0, 0.44, 0.1, 0.46, 0])]),
    new T.AnimationClip('Open lid', 3, [rotationTrack('AcrylicLid', 'x', [0, 0.9, 2.1, 3], [0, -1.05, -1.05, 0])]),
  ];
}

export function rotaryPipeBender(root: T.Group, p: Finish, detail: boolean) {
  const pb = group(root, 'PipeBender');
  shell(pb, [0, 0.06, 0], [0.84, 0.12, 0.84], p.dark, 0.16);
  tube(pb, [0, 0.54, 0], 0.14, 0.18, 0.86, p.primary, 14);
  shell(pb, [0, 1.0, 0], [0.58, 0.14, 0.58], p.dark, 0.22);
  tube(pb, [0, 1.16, 0], 0.19, 0.19, 0.14, p.accent, 16);
  tube(pb, [0, 1.28, 0], 0.055, 0.055, 0.18, p.alloy, 12);
  torus(pb, [0, 1.16, 0], 0.23, 0.036, p.alloy, p.hd).rotation.x = HPI;
  cyl(pb, [0.36, 1.16, 0.23], 0.036, 0.036, 0.76, p.alloy, 'x', 12);
  const arm = group(root, 'BenderArm', [0, 1.16, 0]);
  box(arm, [0.24, -0.04, 0], [0.56, 0.08, 0.14], p.primary);
  tube(arm, [0.38, 0.02, 0], 0.055, 0.055, 0.16, p.dark, 12);
  const lever = group(arm, 'DieLever', [0.48, 0.02, 0]);
  strut(lever, [0, 0, 0], [0.56, 0.22, 0], 0.028, p.accent, 10);
  orb(lever, [0.58, 0.23, 0], 0.048, p.tire, p.hd);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      tube(pb, [Math.sin(a) * 0.24, 1.08, Math.cos(a) * 0.24], 0.018, 0.018, 0.05, p.alloy, 8);
    }
    if (p.hd) for (const sx of [-0.32, 0.32]) for (const sz of [-0.32, 0.32]) fastener(pb, [sx, 0.13, sz], p, 0.026);
  }
  root.animations = [new T.AnimationClip('Bend pipe', 3, [
    rotationTrack('BenderArm', 'y', [0, 1.1, 2.2, 3], [0, 1.45, 1.45, 0]),
    rotationTrack('DieLever', 'z', [0, 0.75, 1.5, 2.25, 3], [0, 0.35, -0.1, 0.35, 0]),
  ])];
}
