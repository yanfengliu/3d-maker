import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { cyl, guardGlass, handwheel, HPI, matte, orb, slideTrack } from './workshop-machinery-kit';

export function cabinetTableSaw(root: T.Group, p: Finish, detail: boolean) {
  const s = group(root, 'TableSaw');
  shell(s, [-0.14, 0.06, 0], [0.84, 0.12, 0.78], p.dark, 0.12);
  shell(s, [-0.14, 0.48, 0], [0.78, 0.76, 0.72], p.primary, 0.1);
  box(s, [-0.14, 0.89, 0], [0.92, 0.08, 0.86], p.alloy);
  box(s, [0.56, 0.89, 0], [0.54, 0.06, 0.84], p.primary);
  for (const sz of [-0.36, 0.36]) strut(s, [0.78, 0.02, sz], [0.78, 0.86, sz], 0.03, p.dark, 10);
  box(s, [0.16, 0.88, 0.46], [1.46, 0.06, 0.06], p.dark);
  box(s, [-0.14, 0.935, 0], [0.16, 0.018, 0.42], p.accent);
  const blade = group(root, 'SawBlade', [-0.14, 0.92, 0]);
  cyl(blade, [0, 0, 0], 0.18, 0.18, 0.018, p.alloy, 'x', 18);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    box(blade, [0, Math.sin(a) * 0.18, Math.cos(a) * 0.18], [0.022, 0.036, 0.032], p.accent).rotation.x = -a;
  }
  const fence = group(root, 'RipFence', [0.22, 0.96, 0]);
  box(fence, [0, 0.02, 0], [0.09, 0.11, 0.88], p.dark);
  box(fence, [0, 0.02, 0.46], [0.24, 0.12, 0.08], p.accent);
  handwheel(s, [-0.14, 0.56, 0.4], 0.11, 'z', p);
  handwheel(s, [-0.57, 0.56, 0], 0.1, 'x', p);
  if (detail) {
    box(s, [-0.46, 0.78, 0.42], [0.14, 0.1, 0.08], p.accent);
    cyl(s, [-0.58, 0.24, -0.18], 0.08, 0.08, 0.14, p.dark, 'x', 12);
    if (p.hd) for (const sx of [-0.42, 0.14]) fastener(s, [sx, 0.89, 0.44], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Spin blade', 1.6, [spinTrack('SawBlade', 'x', 1.6, 3)]),
    new T.AnimationClip('Slide fence', 3, [slideTrack('RipFence', [0.22, 0.96, 0], 0, [0, 0.9, 2.1, 3], [0, 0.36, 0.36, 0])]),
  ];
}

export function floorDrillPress(root: T.Group, p: Finish, detail: boolean) {
  const dp = group(root, 'DrillPress');
  shell(dp, [0, 0.06, 0.06], [0.68, 0.12, 0.88], p.dark, 0.16);
  tube(dp, [0, 0.96, -0.16], 0.065, 0.072, 1.78, p.alloy, 14);
  tube(dp, [0, 1.06, -0.16], 0.1, 0.1, 0.14, p.primary, 12);
  box(dp, [0, 1.06, 0.04], [0.16, 0.09, 0.34], p.primary);
  tube(dp, [0, 1.12, 0.16], 0.26, 0.26, 0.06, p.alloy, 16);
  shell(dp, [0, 1.84, 0], [0.42, 0.32, 0.86], p.primary, 0.24);
  tube(dp, [0, 1.72, -0.34], 0.14, 0.14, 0.34, p.dark, 14);
  tube(dp, [0, 1.6, 0.16], 0.065, 0.06, 0.18, p.edge, 12);
  const chuck = group(root, 'DrillChuck', [0, 1.5, 0.16]);
  tube(chuck, [0, -0.06, 0], 0.055, 0.04, 0.14, p.dark, 12);
  tube(chuck, [0, -0.22, 0], 0.016, 0.012, 0.22, p.alloy, 10);
  box(chuck, [0, -0.06, 0.05], [0.025, 0.08, 0.02], p.accent);
  const lever = group(root, 'QuillLever', [0.22, 1.66, 0.16]);
  cyl(lever, [0, 0, 0], 0.045, 0.045, 0.08, p.dark, 'x', 12);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    strut(lever, [0.03, 0, 0], [0.03, Math.sin(a) * 0.24, Math.cos(a) * 0.24], 0.014, p.alloy, 8);
    orb(lever, [0.03, Math.sin(a) * 0.25, Math.cos(a) * 0.25], 0.028, p.accent, p.hd);
  }
  if (detail) {
    box(dp, [0, 1.76, 0.44], [0.16, 0.12, 0.04], p.accent);
    if (p.hd) for (const sx of [-0.24, 0.24]) fastener(dp, [sx, 0.13, 0.4], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Drill bore', 2.4, [
      spinTrack('DrillChuck', 'y', 2.4, 4),
      rotationTrack('QuillLever', 'x', [0, 0.8, 1.7, 2.4], [0, 1.25, 1.25, 0]),
    ]),
  ];
}

export function metalworkingLathe(root: T.Group, p: Finish, detail: boolean) {
  const lt = group(root, 'EngineLathe');
  for (const sx of [-0.68, 0.68]) shell(lt, [sx, 0.38, 0], [0.46, 0.76, 0.66], p.primary, 0.12);
  shell(lt, [0, 0.78, 0], [1.92, 0.08, 0.72], p.dark, 0.1);
  for (const sz of [-0.14, 0.14]) box(lt, [0.1, 0.94, sz], [1.46, 0.12, 0.08], p.alloy);
  box(lt, [0.1, 0.86, 0], [1.46, 0.1, 0.34], p.primary);
  shell(lt, [-0.68, 1.14, 0], [0.48, 0.52, 0.56], p.primary, 0.14);
  shell(lt, [0.68, 1.1, 0], [0.34, 0.32, 0.34], p.primary, 0.18);
  cyl(lt, [0.46, 1.14, 0], 0.042, 0.042, 0.24, p.alloy, 'x', 12);
  handwheel(lt, [0.89, 1.12, 0], 0.11, 'x', p);
  const chuck = group(root, 'LatheChuck', [-0.36, 1.14, 0]);
  cyl(chuck, [0, 0, 0], 0.15, 0.15, 0.14, p.dark, 'x', 16);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    box(chuck, [0.09, Math.sin(a) * 0.1, Math.cos(a) * 0.1], [0.09, 0.045, 0.055], p.alloy).rotation.x = a;
  }
  cyl(chuck, [0.22, 0, 0], 0.045, 0.045, 0.36, p.accent, 'x', 14);
  const car = group(root, 'ToolCarriage', [0.08, 0.98, 0.08]);
  shell(car, [0, -0.06, 0.14], [0.34, 0.24, 0.14], p.primary, 0.14);
  box(car, [0, 0.08, -0.04], [0.28, 0.1, 0.42], p.alloy);
  box(car, [0, 0.19, 0.04], [0.12, 0.14, 0.12], p.dark);
  box(car, [-0.08, 0.2, -0.02], [0.14, 0.032, 0.036], p.accent);
  handwheel(car, [-0.08, -0.08, 0.25], 0.09, 'z', p);
  if (detail) {
    for (const y of [1.06, 1.24]) box(lt, [-0.68, y, 0.295], [0.32, 0.09, 0.025], p.accent);
    if (p.hd) for (const sx of [-0.68, 0.68]) fastener(lt, [sx, 0.78, 0.37], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Turn stock', 3, [
    spinTrack('LatheChuck', 'x', 3, 4),
    slideTrack('ToolCarriage', [0.08, 0.98, 0.08], 0, [0, 1.1, 2.2, 3], [0, 0.32, 0.32, 0]),
  ])];
}

export function gantryCncMill(root: T.Group, p: Finish, detail: boolean) {
  const cnc = group(root, 'CncMill');
  for (const sx of [-0.68, 0.68]) for (const sz of [-0.52, 0.52]) tube(cnc, [sx, 0.38, sz], 0.045, 0.045, 0.76, p.dark, 10);
  box(cnc, [0, 0.22, 0], [1.38, 0.05, 1.04], p.dark);
  shell(cnc, [0, 0.78, 0], [1.54, 0.12, 1.22], p.primary, 0.1);
  box(cnc, [0, 0.86, 0], [1.26, 0.05, 1.04], p.alloy);
  for (const sx of [-0.68, 0.68]) cyl(cnc, [sx, 0.9, 0], 0.024, 0.024, 1.16, p.alloy, 'z', 10);
  box(cnc, [0, 0.91, 0], [0.76, 0.06, 0.62], matte('#b8895a', 0.86, 'Milling stock'));
  const gantry = group(root, 'GantryBridge', [0, 0.9, -0.22]);
  for (const sx of [-0.68, 0.68]) shell(gantry, [sx, 0.28, 0], [0.1, 0.58, 0.24], p.primary, 0.16);
  shell(gantry, [0, 0.54, 0], [1.5, 0.14, 0.16], p.accent, 0.12);
  shell(gantry, [0, 0.44, 0.12], [0.22, 0.34, 0.14], p.dark, 0.16);
  const spindle = group(gantry, 'MillSpindle', [0, 0.22, 0.14]);
  tube(spindle, [0, 0.08, 0], 0.065, 0.065, 0.24, p.alloy, 14);
  tube(spindle, [0, -0.08, 0], 0.036, 0.016, 0.12, p.accent, 12);
  box(spindle, [0, 0.08, 0.072], [0.024, 0.12, 0.018], p.dark);
  if (detail) {
    for (let i = 0; i < 6; i++) box(cnc, [-0.5 + i * 0.2, 0.892, 0], [0.024, 0.016, 0.98], p.dark);
    if (p.hd) for (const sx of [-0.68, 0.68]) fastener(gantry, [sx, 0.54, 0.12], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Mill pass', 3, [
    slideTrack('GantryBridge', [0, 0.9, -0.22], 2, [0, 1.1, 2.2, 3], [0, 0.48, 0.48, 0]),
    spinTrack('MillSpindle', 'y', 3, 5),
  ])];
}

export function corexy3dPrinter(root: T.Group, p: Finish, detail: boolean) {
  const pr = group(root, 'CoreXyPrinter');
  shell(pr, [0, 0.14, 0], [0.88, 0.28, 0.84], p.dark, 0.12);
  box(pr, [0, 0.16, 0.435], [0.36, 0.16, 0.03], p.optic);
  for (const sx of [-0.38, 0.38]) for (const sz of [-0.36, 0.36]) box(pr, [sx, 0.84, sz], [0.06, 1.14, 0.06], p.primary);
  for (const y of [0.3, 1.38]) {
    for (const sz of [-0.36, 0.36]) box(pr, [0, y, sz], [0.82, 0.06, 0.06], p.primary);
    for (const sx of [-0.38, 0.38]) box(pr, [sx, y, 0], [0.06, 0.06, 0.78], p.primary);
  }
  for (const sx of [-0.38, 0.38]) guardGlass(pr, [sx, 0.84, 0], [0.018, 1.0, 0.64]);
  for (const sx of [-0.36, 0.36]) box(pr, [sx, 1.28, 0], [0.04, 0.04, 0.72], p.alloy);
  for (const sz of [-0.28, 0.28]) cyl(pr, [0, 0.84, sz], 0.016, 0.016, 1.12, p.alloy, 'y', 8);
  box(pr, [0, 0.84, -0.36], [0.7, 1.02, 0.035], p.dark);
  strut(pr, [0, 1.4, -0.14], [0, 1.58, -0.14], 0.026, p.dark, 10);
  ring(pr, [0, 1.58, -0.14], 0.18, 0.055, 0.09, p.accent).rotation.z = HPI;
  const bed = group(root, 'BuildPlate', [0, 0.56, 0]);
  box(bed, [0, 0, 0], [0.62, 0.04, 0.62], p.alloy);
  shell(bed, [0, 0.09, 0], [0.22, 0.14, 0.22], p.accent, 0.24);
  const head = group(root, 'PrintHead', [-0.18, 1.24, 0]);
  box(head, [0.18, 0.04, 0], [0.74, 0.038, 0.04], p.alloy);
  shell(head, [0, -0.02, 0], [0.14, 0.16, 0.14], p.accent, 0.2);
  tube(head, [0, -0.13, 0], 0.028, 0.008, 0.08, p.alloy, 10);
  if (detail) {
    for (const sx of [-0.28, 0.28]) cyl(pr, [sx, 0.84, -0.32], 0.014, 0.014, 1.04, p.accent, 'y', 8);
    if (p.hd) for (const sx of [-0.38, 0.38]) fastener(pr, [sx, 1.38, 0.39], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Print layer', 3, [
    slideTrack('PrintHead', [-0.18, 1.24, 0], 0, [0, 0.75, 1.5, 2.25, 3], [0, 0.36, 0.06, 0.32, 0]),
    slideTrack('BuildPlate', [0, 0.56, 0], 1, [0, 1.5, 3], [0, 0.28, 0]),
  ])];
}

export function hydraulicShopPress(root: T.Group, p: Finish, detail: boolean) {
  const hp = group(root, 'HydraulicPress');
  for (const sx of [-0.52, 0.52]) {
    box(hp, [sx, 0.06, 0], [0.16, 0.12, 0.88], p.dark);
    box(hp, [sx, 1.04, 0], [0.12, 1.9, 0.2], p.primary);
    for (const sz of [-0.34, 0.34]) strut(hp, [sx, 0.1, sz], [sx, 0.52, sz * 0.26], 0.032, p.primary, 10);
  }
  shell(hp, [0, 1.98, 0], [1.24, 0.18, 0.28], p.primary, 0.1);
  shell(hp, [0, 0.96, 0], [1.18, 0.16, 0.3], p.dark, 0.1);
  for (const sx of [-0.52, 0.52]) cyl(hp, [sx, 0.86, 0], 0.028, 0.028, 0.32, p.accent, 'z', 10);
  tube(hp, [0, 1.78, 0], 0.11, 0.11, 0.38, p.dark, 14);
  cyl(hp, [0.22, 1.96, 0.16], 0.08, 0.08, 0.045, p.stencil, 'z', 14);
  const ram = group(root, 'PressRam', [0, 1.46, 0]);
  tube(ram, [0, 0.1, 0], 0.052, 0.052, 0.34, p.alloy, 12);
  shell(ram, [0, -0.09, 0], [0.24, 0.09, 0.22], p.accent, 0.16);
  const pump = group(root, 'PumpHandle', [0.57, 1.38, 0.08]);
  shell(pump, [0.06, 0, 0], [0.16, 0.22, 0.16], p.dark, 0.18);
  strut(pump, [0.08, 0.06, 0.04], [0.36, 0.38, 0.14], 0.022, p.accent, 10);
  if (detail) {
    for (const sx of [-0.52, 0.52]) for (let i = 0; i < 5; i++) cyl(hp, [sx, 0.64 + i * 0.22, 0.11], 0.022, 0.022, 0.025, p.inset, 'z', 10);
    if (p.hd) for (const sx of [-0.52, 0.52]) fastener(hp, [sx, 1.98, 0.16], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Press stroke', 2.8, [
    slideTrack('PressRam', [0, 1.46, 0], 1, [0, 0.9, 2, 2.8], [0, -0.34, -0.34, 0]),
    rotationTrack('PumpHandle', 'z', [0, 0.5, 1.0, 1.6, 2.2, 2.8], [0, -0.55, 0.05, -0.55, 0.05, 0]),
  ])];
}

export function anvilHammerStation(root: T.Group, p: Finish, detail: boolean) {
  const st = group(root, 'AnvilStation');
  const oak = matte('#6c472c', 0.86, 'Anvil oak');
  shell(st, [0, 0.07, 0], [1.38, 0.14, 0.96], p.dark, 0.14);
  tube(st, [-0.26, 0.42, 0], 0.28, 0.32, 0.62, oak, 14);
  ring(st, [-0.26, 0.56, 0], 0.305, 0.028, 0.06, p.edge);
  shell(st, [-0.26, 0.8, 0], [0.46, 0.16, 0.28], p.primary, 0.2);
  shell(st, [-0.26, 0.96, 0], [0.54, 0.14, 0.24], p.alloy, 0.16);
  tube(st, [-0.64, 0.98, 0], 0.028, 0.092, 0.28, p.alloy, 12).rotation.z = HPI;
  shell(st, [0.46, 0.72, 0], [0.3, 1.24, 0.38], p.primary, 0.14);
  ring(st, [0.46, 1.16, -0.24], 0.24, 0.036, 0.08, p.dark).rotation.x = HPI;
  const ham = group(root, 'PowerHammer', [0.46, 1.26, 0]);
  strut(ham, [0, 0, 0], [-0.72, -0.06, 0], 0.044, p.dark, 10);
  shell(ham, [-0.72, -0.14, 0], [0.22, 0.24, 0.2], p.accent, 0.2);
  const rack = group(root, 'TongRack', [0.46, 0.62, 0.24]);
  box(rack, [0, 0, 0], [0.34, 0.055, 0.1], p.dark);
  for (const sx of [-0.1, 0, 0.1]) strut(rack, [sx, 0.04, 0.02], [sx, -0.4, 0.04], 0.016, p.alloy, 8);
  if (detail) {
    box(st, [-0.26, 1.045, 0], [0.16, 0.036, 0.08], p.accent);
    if (p.hd) for (const sx of [-0.58, 0.58]) fastener(st, [sx, 0.15, 0.42], p, 0.026);
  }
  root.animations = [new T.AnimationClip('Strike anvil', 1.8, [rotationTrack('PowerHammer', 'z', [0, 0.45, 0.9, 1.35, 1.8], [0, -0.28, 0.22, -0.28, 0])])];
}

export function electricPottersWheel(root: T.Group, p: Finish, detail: boolean) {
  const pw = group(root, 'PottersWheel');
  const clay = matte('#b56e4b', 0.85, 'Wet clay');
  for (const [lx, lz] of [[-0.36, -0.32], [0.36, -0.32], [0, 0.38]] as const) {
    strut(pw, [lx, 0.02, lz], [lx * 0.8, 0.56, lz * 0.8], 0.036, p.dark, 10);
    tube(pw, [lx, 0.03, lz], 0.046, 0.05, 0.06, p.tire, 10);
  }
  shell(pw, [0, 0.6, 0], [0.84, 0.16, 0.92], p.primary, 0.26);
  ring(pw, [0, 0.76, 0.1], 0.34, 0.045, 0.18, p.stencil);
  tube(pw, [0, 0.68, 0.1], 0.32, 0.32, 0.05, p.primary, 16);
  box(pw, [0, 0.72, -0.32], [0.66, 0.06, 0.24], p.dark);
  const wh = group(root, 'WheelHead', [0, 0.74, 0.1]);
  tube(wh, [0, 0.02, 0], 0.24, 0.24, 0.045, p.alloy, 16);
  tube(wh, [0, 0.14, 0], 0.11, 0.14, 0.2, clay, 16);
  tube(wh, [0, 0.28, 0], 0.08, 0.11, 0.1, clay, 16);
  ring(wh, [0, 0.34, 0], 0.09, 0.02, 0.035, p.accent);
  box(pw, [0.44, 0.04, 0.12], [0.24, 0.08, 0.38], p.dark);
  strut(pw, [0.32, 0.06, 0.04], [0.16, 0.56, 0.04], 0.018, p.tire, 8);
  const pedal = group(root, 'SpeedPedal', [0.44, 0.1, 0.12]);
  shell(pedal, [0, 0.03, 0], [0.18, 0.045, 0.32], p.accent, 0.18);
  if (detail) {
    tube(pw, [-0.22, 0.82, -0.32], 0.08, 0.065, 0.14, p.optic, 12);
    orb(pw, [0.18, 0.79, -0.32], 0.055, p.accent, p.hd, [1.2, 0.7, 1]);
    if (p.hd) for (const sx of [-0.3, 0.3]) fastener(pw, [sx, 0.6, 0.46], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Throw clay', 2.4, [
      spinTrack('WheelHead', 'y', 2.4, 3),
      rotationTrack('SpeedPedal', 'x', [0, 0.8, 1.8, 2.4], [0, 0.32, 0.32, 0]),
    ]),
  ];
}

export function screwPrintingPress(root: T.Group, p: Finish, detail: boolean) {
  const pr = group(root, 'PrintingPress');
  for (const sx of [-0.56, 0.56]) {
    box(pr, [sx, 0.07, 0], [0.18, 0.14, 1.18], p.dark);
    box(pr, [sx, 1.06, -0.06], [0.16, 1.9, 0.22], p.primary);
    strut(pr, [sx, 0.12, 0.44], [sx, 0.82, -0.06], 0.045, p.primary, 10);
  }
  shell(pr, [0, 1.98, -0.06], [1.38, 0.2, 0.3], p.primary, 0.14);
  shell(pr, [0, 1.46, -0.06], [1.18, 0.16, 0.26], p.dark, 0.14);
  shell(pr, [0, 0.76, 0.12], [1.16, 0.12, 1.08], p.primary, 0.12);
  const screw = group(root, 'PressScrew', [0, 1.56, -0.06]);
  tube(screw, [0, 0.06, 0], 0.072, 0.072, 0.74, p.accent, 12);
  for (let i = 0; i < 4; i++) ring(screw, [0, -0.14 + i * 0.12, 0], 0.088, 0.02, 0.032, p.dark);
  strut(screw, [0, -0.18, 0], [0.56, -0.18, 0.16], 0.026, p.accent, 10);
  orb(screw, [0.58, -0.18, 0.16], 0.048, p.dark, p.hd);
  shell(screw, [0, -0.34, 0], [0.68, 0.09, 0.54], p.dark, 0.14);
  const bed = group(root, 'TypeBed', [0, 0.85, 0.22]);
  shell(bed, [0, 0, 0], [0.76, 0.08, 0.62], p.dark, 0.12);
  box(bed, [0, 0.055, 0], [0.6, 0.03, 0.46], p.stencil);
  for (let i = 0; i < 4; i++) box(bed, [0, 0.076, -0.14 + i * 0.095], [0.48, 0.014, 0.036], p.inset);
  if (detail) {
    for (const sx of [-0.56, 0.56]) orb(pr, [sx, 2.14, -0.06], 0.072, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.56, 0.56]) fastener(pr, [sx, 1.98, 0.1], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Print sheet', 3.2, [
    rotationTrack('PressScrew', 'y', [0, 0.9, 2.2, 3.2], [0, 1.4, 1.4, 0]),
    slideTrack('TypeBed', [0, 0.85, 0.22], 2, [0, 0.9, 2.2, 3.2], [0, 0.34, 0.34, 0]),
  ])];
}

export function floorWeavingLoom(root: T.Group, p: Finish, detail: boolean) {
  const lm = group(root, 'WeavingLoom');
  const yarn = matte('#ede5d0', 0.88, 'Warp yarn');
  for (const sx of [-0.66, 0.66]) {
    box(lm, [sx, 0.06, 0], [0.12, 0.12, 1.24], p.primary);
    box(lm, [sx, 0.92, 0], [0.11, 1.72, 0.14], p.primary);
    for (const sz of [-0.54, 0.54]) box(lm, [sx, 0.54, sz], [0.1, 0.92, 0.1], p.primary);
    box(lm, [sx, 0.96, 0], [0.1, 0.1, 1.16], p.primary);
  }
  shell(lm, [0, 1.76, 0], [1.46, 0.12, 0.18], p.dark, 0.14);
  cyl(lm, [0, 0.92, -0.52], 0.11, 0.11, 1.32, p.dark, 'x', 14);
  box(lm, [0, 0.96, -0.06], [1.08, 0.025, 0.86], yarn);
  for (let i = 0; i < 6; i++) box(lm, [-0.45 + i * 0.18, 0.978, 0.18], [0.12, 0.018, 0.44], i % 2 === 0 ? p.accent : p.optic);
  const beam = group(root, 'ClothBeam', [0, 0.82, 0.52]);
  cyl(beam, [0, 0, 0], 0.095, 0.095, 1.32, p.accent, 'x', 14);
  box(beam, [0.7, 0.04, 0], [0.04, 0.14, 0.04], p.dark);
  const beater = group(root, 'BeaterBar', [0, 1.66, 0.08]);
  for (const sx of [-0.58, 0.58]) strut(beater, [sx, 0, 0], [sx, -0.68, 0], 0.028, p.primary, 10);
  box(beater, [0, -0.66, 0], [1.22, 0.14, 0.08], p.dark);
  for (let i = 0; i < 10; i++) box(beater, [-0.45 + i * 0.1, -0.66, 0.05], [0.016, 0.12, 0.016], p.alloy);
  if (detail) {
    cyl(lm, [0, 0.14, -0.01], 0.022, 0.022, 1.32, p.alloy, 'x', 10);
    for (let i = 0; i < 4; i++) box(lm, [-0.24 + i * 0.16, 0.14, 0.22], [0.08, 0.04, 0.48], p.dark);
    if (p.hd) for (const sx of [-0.66, 0.66]) fastener(lm, [sx, 1.76, 0.1], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Weave weft', 2.4, [
    rotationTrack('BeaterBar', 'x', [0, 0.6, 1.2, 1.8, 2.4], [0, 0.34, -0.14, 0.34, 0]),
    spinTrack('ClothBeam', 'x', 2.4, 1),
  ])];
}
