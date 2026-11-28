import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { cyl, HPI, labGlass, matte, medCaster, orb, slideTrack } from './science-medical-kit';

export function articulatedDentalChair(root: T.Group, p: Finish, detail: boolean) {
  const dc = group(root, 'DentalChair');
  shell(dc, [0, 0.08, 0], [0.84, 0.16, 1.18], p.accent, 0.24);
  shell(dc, [0, 0.38, -0.06], [0.42, 0.48, 0.54], p.dark, 0.2);
  shell(dc, [0, 0.66, 0.08], [0.64, 0.16, 0.72], p.primary, 0.28);
  const leg = shell(dc, [0, 0.46, 0.62], [0.56, 0.14, 0.54], p.primary, 0.24);
  leg.rotation.x = 0.68;
  for (const s of [-1, 1]) shell(dc, [s * 0.38, 0.78, 0.04], [0.1, 0.1, 0.52], p.accent, 0.22);
  const back = group(root, 'ChairBackrest', [0, 0.7, -0.26]);
  shell(back, [0, 0.42, -0.04], [0.6, 0.78, 0.16], p.primary, 0.28);
  shell(back, [0, 0.94, -0.02], [0.34, 0.22, 0.14], p.primary, 0.34);
  strut(back, [0, 0.78, -0.06], [0, 0.9, -0.06], 0.028, p.alloy, 10);
  tube(dc, [0.46, 0.62, -0.18], 0.055, 0.062, 1.16, p.accent, 12);
  strut(dc, [0.46, 0.76, -0.18], [0.76, 0.88, 0.24], 0.024, p.alloy, 8);
  shell(dc, [0.76, 0.9, 0.28], [0.42, 0.06, 0.34], p.stencil, 0.18);
  const lamp = group(root, 'ExamLampArm', [0.46, 1.18, -0.18]);
  strut(lamp, [0, 0, 0], [0.18, 0.48, 0.16], 0.024, p.alloy, 8);
  strut(lamp, [0.18, 0.48, 0.16], [-0.46, 0.64, 0.32], 0.022, p.alloy, 8);
  shell(lamp, [-0.46, 0.6, 0.34], [0.28, 0.18, 0.16], p.accent, 0.28);
  box(lamp, [-0.46, 0.56, 0.43], [0.18, 0.1, 0.02], p.optic);
  if (detail) {
    for (const x of [0.66, 0.76, 0.86]) tube(dc, [x, 0.96, 0.28], 0.018, 0.018, 0.12, p.primary, 8);
    if (p.hd) for (const sx of [-0.32, 0.32]) fastener(dc, [sx, 0.16, 0.5], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Recline patient', 3.2, [
      rotationTrack('ChairBackrest', 'x', [0, 0.9, 2.2, 3.2], [0, -0.78, -0.78, 0]),
      rotationTrack('ExamLampArm', 'y', [0, 0.9, 2.2, 3.2], [0, -0.45, -0.45, 0]),
    ]),
  ];
}

export function adjustableHospitalBed(root: T.Group, p: Finish, detail: boolean) {
  const hb = group(root, 'HospitalBed');
  const sheet = matte('#e8eef2', 0.88, 'Hospital sheet');
  for (const sx of [-0.46, 0.46]) for (const sz of [-0.88, 0.88]) {
    tube(hb, [sx, 0.07, sz], 0.068, 0.068, 0.06, p.tire, 12);
    strut(hb, [sx, 0.1, sz], [sx, 0.54, sz], 0.032, p.alloy, 10);
  }
  shell(hb, [0, 0.56, 0], [1.06, 0.12, 2.02], p.dark, 0.12);
  shell(hb, [0, 0.86, 0.98], [1.08, 0.64, 0.09], p.primary, 0.2);
  shell(hb, [0, 0.94, -0.98], [1.08, 0.78, 0.09], p.primary, 0.2);
  shell(hb, [0, 0.72, 0.34], [0.96, 0.22, 1.24], sheet, 0.22);
  shell(hb, [0, 0.84, 0.56], [0.94, 0.07, 0.74], p.accent, 0.2);
  const head = group(root, 'HeadSection', [0, 0.64, -0.26]);
  shell(head, [0, 0.08, -0.34], [0.96, 0.2, 0.68], sheet, 0.22);
  shell(head, [0, 0.22, -0.44], [0.64, 0.12, 0.32], p.stencil, 0.36);
  for (const [name, sx] of [['SideRailL', -0.54], ['SideRailR', 0.54]] as const) {
    const rail = group(root, name, [sx, 0.64, -0.1]);
    box(rail, [0, 0.34, 0], [0.055, 0.065, 1.04], p.accent);
    for (const sz of [-0.44, 0, 0.44]) strut(rail, [0, 0, sz], [0, 0.34, sz], 0.02, p.alloy, 8);
  }
  tube(hb, [-0.52, 1.38, -0.92], 0.018, 0.022, 1.72, p.alloy, 10);
  strut(hb, [-0.66, 2.22, -0.92], [-0.38, 2.22, -0.92], 0.014, p.alloy, 8);
  shell(hb, [-0.62, 2.08, -0.92], [0.1, 0.22, 0.06], p.optic, 0.24);
  if (detail) {
    box(hb, [0, 0.94, 1.04], [0.44, 0.16, 0.03], p.optic);
    if (p.hd) for (const sx of [-0.46, 0.46]) fastener(hb, [sx, 0.56, 0.94], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Raise backrest', 3.2, [rotationTrack('HeadSection', 'x', [0, 0.9, 2.2, 3.2], [0, 0.68, 0.68, 0])]),
    new T.AnimationClip('Lower side rails', 3, [
      rotationTrack('SideRailL', 'z', [0, 0.9, 2.1, 3], [0, 1.48, 1.48, 0]),
      rotationTrack('SideRailR', 'z', [0, 0.9, 2.1, 3], [0, -1.48, -1.48, 0]),
    ]),
  ];
}

export function bladeServerRack(root: T.Group, p: Finish, detail: boolean) {
  const sr = group(root, 'ServerRack');
  shell(sr, [0, 0.07, 0], [0.96, 0.14, 1.08], p.dark, 0.1);
  box(sr, [0, 1.14, -0.48], [0.92, 2.04, 0.1], p.primary);
  for (const sx of [-0.43, 0.43]) box(sr, [sx, 1.14, 0], [0.09, 2.04, 1.04], p.primary);
  shell(sr, [0, 2.18, 0], [0.98, 0.12, 1.08], p.dark, 0.12);
  for (let i = 0; i < 8; i++) {
    if (i === 4) continue;
    const y = 0.28 + i * 0.24;
    box(sr, [0, y, -0.02], [0.76, 0.18, 0.88], p.dark);
    box(sr, [-0.26, y, 0.435], [0.16, 0.06, 0.02], p.optic);
    box(sr, [0.24, y, 0.435], [0.18, 0.04, 0.02], p.accent);
  }
  const blade = group(root, 'ServerBlade', [0, 1.24, -0.02]);
  box(blade, [0, 0, 0], [0.76, 0.18, 0.88], p.alloy);
  box(blade, [0, 0, 0.455], [0.68, 0.14, 0.03], p.accent);
  box(blade, [-0.2, 0, 0.475], [0.18, 0.05, 0.018], p.optic);
  const door = group(root, 'MeshDoor', [-0.46, 1.14, 0.53]);
  for (const dx of [0.04, 0.88]) box(door, [dx, 0, 0], [0.08, 1.98, 0.045], p.primary);
  for (const y of [-0.95, 0.95]) box(door, [0.46, y, 0], [0.92, 0.08, 0.045], p.primary);
  labGlass(door, [0.46, 0, 0], [0.76, 1.82, 0.018], '#6ca8a8');
  box(door, [0.86, 0, 0.045], [0.045, 0.28, 0.04], p.accent);
  if (detail) {
    for (let i = 0; i < 4; i++) box(sr, [-0.28 + i * 0.18, 2.26, -0.24], [0.1, 0.06, 0.34], p.alloy);
    if (p.hd) for (const sx of [-0.42, 0.42]) fastener(sr, [sx, 2.18, 0.55], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Service blade', 3.4, [
    rotationTrack('MeshDoor', 'y', [0, 0.9, 2.4, 3.4], [0, -1.45, -1.45, 0]),
    slideTrack('ServerBlade', [0, 1.24, -0.02], 2, [0, 1.2, 2.2, 3.4], [0, 0.48, 0.48, 0]),
  ])];
}

export function dualTraceOscilloscope(root: T.Group, p: Finish, detail: boolean) {
  const osc = group(root, 'Oscilloscope');
  shell(osc, [0, 0.14, 0], [1.24, 0.28, 0.9], p.dark, 0.14);
  shell(osc, [0, 0.64, -0.02], [1.06, 0.72, 0.76], p.primary, 0.16);
  shell(osc, [-0.2, 0.68, 0.38], [0.54, 0.48, 0.08], p.dark, 0.16);
  box(osc, [-0.2, 0.68, 0.425], [0.42, 0.34, 0.02], p.optic);
  for (let i = 0; i < 6; i++) {
    const x = -0.36 + i * 0.064;
    box(osc, [x, 0.68 + Math.sin(i * 1.2) * 0.08, 0.44], [0.055, 0.022, 0.015], p.accent);
  }
  box(osc, [0.3, 0.66, 0.38], [0.36, 0.56, 0.04], p.alloy);
  const tDial = group(root, 'TimebaseDial', [0.22, 0.78, 0.42]);
  cyl(tDial, [0, 0, 0], 0.058, 0.062, 0.05, p.accent, 'z', 14);
  box(tDial, [0, 0.022, 0.03], [0.018, 0.044, 0.016], p.stencil);
  const gDial = group(root, 'GainDial', [0.38, 0.78, 0.42]);
  cyl(gDial, [0, 0, 0], 0.052, 0.056, 0.05, p.dark, 'z', 14);
  box(gDial, [0, 0.02, 0.03], [0.018, 0.04, 0.016], p.accent);
  strut(osc, [-0.36, 1.0, 0], [-0.36, 1.14, 0], 0.022, p.alloy, 8);
  strut(osc, [0.36, 1.0, 0], [0.36, 1.14, 0], 0.022, p.alloy, 8);
  strut(osc, [-0.36, 1.14, 0], [0.36, 1.14, 0], 0.026, p.dark, 10);
  const probe = group(root, 'ProbeClip', [0.56, 0.66, 0.1]);
  box(probe, [0, 0, 0], [0.08, 0.14, 0.1], p.dark);
  tube(probe, [0.04, 0.08, 0], 0.022, 0.028, 0.42, p.accent, 10);
  tube(probe, [0.04, 0.34, 0], 0.008, 0.018, 0.12, p.alloy, 8);
  if (detail) {
    for (const x of [0.2, 0.38]) cyl(osc, [x, 0.5, 0.42], 0.032, 0.032, 0.05, p.alloy, 'z', 12);
    if (p.hd) for (const sx of [-0.46, 0.46]) fastener(osc, [sx, 0.94, 0.38], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Sweep trace', 2.8, [
    rotationTrack('TimebaseDial', 'z', [0, 0.9, 1.9, 2.8], [0, -2.1, -2.1, 0]),
    rotationTrack('GainDial', 'z', [0, 0.7, 1.8, 2.8], [0, 1.8, 1.8, 0]),
  ])];
}

export function opticalSpectrometer(root: T.Group, p: Finish, detail: boolean) {
  const sp = group(root, 'Spectrometer');
  tube(sp, [0, 0.08, 0], 0.38, 0.42, 0.16, p.dark, 16);
  tube(sp, [0, 0.42, 0], 0.12, 0.16, 0.56, p.primary, 14);
  tube(sp, [0, 0.72, 0], 0.36, 0.36, 0.08, p.accent, 18);
  strut(sp, [0, 0.74, 0], [0, 0.88, -0.34], 0.036, p.primary, 10);
  cyl(sp, [0, 0.92, -0.44], 0.068, 0.075, 0.56, p.primary, 'z', 14);
  cyl(sp, [0, 0.92, -0.74], 0.045, 0.065, 0.1, p.accent, 'z', 12);
  const tbl = group(root, 'PrismTable', [0, 0.78, 0]);
  tube(tbl, [0, 0.04, 0], 0.18, 0.18, 0.08, p.dark, 14);
  tube(tbl, [0, 0.18, 0], 0.11, 0.11, 0.22, p.optic, 3);
  const viewer = group(root, 'ViewerArm', [0, 0.74, 0]);
  box(viewer, [0, 0, 0.26], [0.1, 0.065, 0.52], p.dark);
  strut(viewer, [0, 0.02, 0.36], [0, 0.18, 0.36], 0.032, p.primary, 10);
  cyl(viewer, [0, 0.18, 0.46], 0.062, 0.072, 0.54, p.primary, 'z', 14);
  cyl(viewer, [0, 0.18, 0.76], 0.042, 0.052, 0.12, p.accent, 'z', 12);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      box(sp, [Math.sin(a) * 0.33, 0.768, Math.cos(a) * 0.33], [0.02, 0.016, 0.05], p.dark).rotation.y = a;
    }
    if (p.hd) for (let i = 0; i < 3; i++) fastener(sp, [Math.sin((i * Math.PI * 2) / 3) * 0.32, 0.17, Math.cos((i * Math.PI * 2) / 3) * 0.32], p, 0.026);
  }
  root.animations = [new T.AnimationClip('Scan spectrum', 3.2, [
    rotationTrack('ViewerArm', 'y', [0, 0.8, 1.6, 2.4, 3.2], [0, 0.95, 0, -0.95, 0]),
    spinTrack('PrismTable', 'y', 3.2, 1),
  ])];
}

export function dnaThermalCycler(root: T.Group, p: Finish, detail: boolean) {
  const pcr = group(root, 'ThermalCycler');
  shell(pcr, [0, 0.12, 0], [1.08, 0.24, 0.96], p.dark, 0.16);
  shell(pcr, [0, 0.44, -0.04], [0.96, 0.46, 0.84], p.primary, 0.18);
  const screen = group(pcr, '', [0, 0.46, 0.4]);
  screen.rotation.x = -0.45;
  shell(screen, [0, 0, 0], [0.76, 0.28, 0.08], p.dark, 0.16);
  box(screen, [-0.1, 0.01, 0.052], [0.42, 0.18, 0.02], p.optic);
  for (const y of [-0.04, 0.04]) box(screen, [0.22, y, 0.052], [0.14, 0.05, 0.02], p.accent);
  box(pcr, [0, 0.68, -0.06], [0.64, 0.08, 0.54], p.alloy);
  const plate = group(root, 'Microplate', [0, 0.72, -0.06]);
  box(plate, [0, 0.02, 0], [0.54, 0.05, 0.42], p.stencil);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    tube(plate, [-0.2 + c * 0.08, 0.06, -0.12 + r * 0.08], 0.022, 0.022, 0.04, p.accent, 8);
  }
  const lid = group(root, 'HeatedLid', [0, 0.7, -0.42]);
  shell(lid, [0, 0.1, 0.36], [0.8, 0.18, 0.74], p.primary, 0.2);
  tube(lid, [0, 0.23, 0.36], 0.11, 0.13, 0.09, p.accent, 14);
  if (detail) {
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) box(pcr, [s * 0.49, 0.34 + i * 0.065, -0.04], [0.022, 0.026, 0.48], p.dark);
    if (p.hd) for (const sx of [-0.36, 0.36]) fastener(pcr, [sx, 0.68, -0.42], p, 0.022);
  }
  root.animations = [new T.AnimationClip('Open PCR lid', 3, [rotationTrack('HeatedLid', 'x', [0, 0.9, 2.1, 3], [0, -1.25, -1.25, 0])])];
}

export function pharmacyDispensingRobot(root: T.Group, p: Finish, detail: boolean) {
  const ph = group(root, 'PharmacyRobot');
  shell(ph, [0, 0.08, 0], [1.46, 0.16, 0.96], p.dark, 0.12);
  shell(ph, [0, 0.46, 0], [1.38, 0.66, 0.88], p.primary, 0.1);
  box(ph, [0, 0.48, 0.455], [0.46, 0.24, 0.03], p.inset);
  box(ph, [0, 1.38, -0.36], [1.38, 1.24, 0.16], p.primary);
  for (const sx of [-0.63, 0.63]) box(ph, [sx, 1.38, 0], [0.12, 1.24, 0.86], p.primary);
  shell(ph, [0, 2.08, 0], [1.44, 0.22, 0.92], p.primary, 0.14);
  box(ph, [0, 2.08, 0.475], [0.84, 0.1, 0.024], p.accent);
  labGlass(ph, [0, 1.38, 0.42], [1.14, 1.14, 0.02]);
  const car = group(root, 'CarouselDrum', [0, 1.32, -0.04]);
  tube(car, [0, 0, 0], 0.28, 0.28, 0.96, p.alloy, 14);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    for (const y of [-0.28, 0, 0.28]) tube(car, [Math.sin(a) * 0.3, y, Math.cos(a) * 0.3], 0.06, 0.06, 0.18, i % 2 === 0 ? p.accent : p.optic, 10);
  }
  const pick = group(root, 'PickerGantry', [-0.28, 1.48, 0.28]);
  box(pick, [0.28, 0.4, 0], [1.14, 0.055, 0.06], p.dark);
  strut(pick, [0, 0.4, 0], [0, -0.14, 0], 0.028, p.alloy, 10);
  shell(pick, [0, -0.14, 0], [0.16, 0.16, 0.14], p.accent, 0.2);
  if (detail) {
    box(ph, [0.46, 0.56, 0.455], [0.24, 0.18, 0.03], p.optic);
    if (p.hd) for (const sx of [-0.58, 0.58]) fastener(ph, [sx, 2.08, 0.47], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Dispense rx', 3.2, [
    spinTrack('CarouselDrum', 'y', 3.2, 1),
    slideTrack('PickerGantry', [-0.28, 1.48, 0.28], 0, [0, 1.0, 2.2, 3.2], [0, 0.56, 0.56, 0]),
  ])];
}

export function cryogenicDewarCart(root: T.Group, p: Finish, detail: boolean) {
  const dw = group(root, 'DewarCart');
  ring(dw, [0, 0.2, 0], 0.42, 0.045, 0.08, p.dark);
  tube(dw, [0, 0.19, 0], 0.38, 0.38, 0.045, p.dark, 14);
  for (const sz of [-0.36, 0.36]) tube(dw, [0, 0.06, sz], 0.055, 0.055, 0.12, p.tire, 10);
  medCaster(dw, 'CasterL', [-0.46, 0.18, 0], 0.18, 0.06, p);
  medCaster(dw, 'CasterR', [0.46, 0.18, 0], 0.18, 0.06, p);
  tube(dw, [0, 0.72, 0], 0.34, 0.34, 0.98, p.primary, 18);
  orb(dw, [0, 1.21, 0], 0.34, p.primary, p.hd, [1, 0.45, 1]);
  ring(dw, [0, 0.82, 0], 0.36, 0.028, 0.06, p.accent);
  ring(dw, [0, 1.38, 0], 0.32, 0.024, 0.045, p.alloy);
  for (const s of [-1, 1]) strut(dw, [s * 0.3, 1.24, 0], [s * 0.3, 1.4, 0], 0.02, p.alloy, 8);
  tube(dw, [0, 1.42, 0], 0.1, 0.12, 0.24, p.alloy, 14);
  cyl(dw, [0.16, 1.46, 0], 0.06, 0.06, 0.04, p.stencil, 'z', 12);
  const plug = group(root, 'NeckPlug', [0, 1.54, 0]);
  tube(plug, [0, 0.04, 0], 0.11, 0.085, 0.1, p.accent, 14);
  tube(plug, [0, -0.18, 0], 0.04, 0.04, 0.38, p.alloy, 10);
  barHandle(plug, [0, 0.1, 0], 0.18, p.dark);
  if (detail) {
    box(dw, [0, 0.98, 0.345], [0.28, 0.16, 0.024], p.optic);
    if (p.hd) for (const s of [-1, 1]) fastener(dw, [s * 0.36, 0.2, 0], p, 0.024).rotation.z = HPI;
  }
  root.animations = [
    new T.AnimationClip('Pull canister', 3, [slideTrack('NeckPlug', [0, 1.54, 0], 1, [0, 0.9, 2.1, 3], [0, 0.34, 0.34, 0])]),
    new T.AnimationClip('Roll dewar', 2.8, [spinTrack('CasterL', 'x', 2.8, 2), spinTrack('CasterR', 'x', 2.8, 2)]),
  ];
}

function barHandle(parent: T.Object3D, at: [number, number, number], len: number, mat: T.Material) {
  const [x, y, z] = at;
  cyl(parent, [x, y + 0.05, z], 0.018, 0.018, len, mat, 'x', 10);
  for (const s of [-1, 1]) strut(parent, [x + s * len * 0.42, y, z], [x + s * len * 0.42, y + 0.05, z], 0.014, mat, 8);
}

export function cleanroomLaminarHood(root: T.Group, p: Finish, detail: boolean) {
  const lh = group(root, 'LaminarHood');
  for (const sx of [-0.68, 0.68]) for (const sz of [-0.38, 0.38]) tube(lh, [sx, 0.42, sz], 0.036, 0.04, 0.84, p.dark, 10);
  box(lh, [0, 0.24, 0], [1.38, 0.05, 0.74], p.dark);
  shell(lh, [0, 0.86, 0], [1.54, 0.1, 0.9], p.alloy, 0.1);
  box(lh, [0, 1.38, -0.38], [1.48, 0.98, 0.12], p.primary);
  for (const sx of [-0.72, 0.72]) {
    box(lh, [sx, 1.38, -0.34], [0.06, 0.98, 0.1], p.primary);
    labGlass(lh, [sx, 1.36, 0.02], [0.022, 0.9, 0.74]);
  }
  shell(lh, [0, 2.02, -0.02], [1.54, 0.36, 0.88], p.primary, 0.14);
  box(lh, [0, 2.02, 0.435], [0.58, 0.14, 0.026], p.optic);
  const fan = group(root, 'FilterFan', [0, 2.22, -0.02]);
  tube(fan, [0, 0, 0], 0.08, 0.08, 0.05, p.dark, 10);
  for (let i = 0; i < 6; i++) box(fan, [0, 0.02, 0], [0.54, 0.022, 0.09], p.accent).rotation.y = (i * Math.PI) / 3;
  const shield = group(root, 'FrontShield', [0, 1.48, 0.42]);
  shield.rotation.x = -0.14;
  for (const sx of [-0.68, 0.68]) box(shield, [sx, 0, 0], [0.045, 0.66, 0.035], p.alloy);
  box(shield, [0, -0.32, 0], [1.4, 0.05, 0.04], p.accent);
  labGlass(shield, [0, 0, 0], [1.32, 0.6, 0.018]);
  if (detail) {
    for (const x of [-0.36, 0, 0.36]) tube(lh, [x, 0.98, -0.06], 0.06, 0.075, 0.14, p.accent, 10);
    if (p.hd) for (const sx of [-0.66, 0.66]) fastener(lh, [sx, 2.02, 0.44], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Laminar flow', 1.8, [spinTrack('FilterFan', 'y', 1.8, 3)]),
    new T.AnimationClip('Raise shield', 3, [slideTrack('FrontShield', [0, 1.48, 0.42], 1, [0, 0.9, 2.1, 3], [0, 0.28, 0.28, 0])]),
  ];
}

export function weatherAnemometerMast(root: T.Group, p: Finish, detail: boolean) {
  const wm = group(root, 'WeatherMast');
  shell(wm, [0, 0.08, 0], [0.86, 0.16, 0.86], p.dark, 0.24);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    strut(wm, [Math.sin(a) * 0.34, 0.14, Math.cos(a) * 0.34], [0, 0.72, 0], 0.028, p.alloy, 10);
  }
  tube(wm, [0, 1.18, 0], 0.048, 0.062, 2.18, p.primary, 12);
  tube(wm, [-0.24, 1.25, 0], 0.055, 0.055, 0.26, p.dark, 10);
  for (let i = 0; i < 5; i++) tube(wm, [-0.24, 1.12 + i * 0.065, 0], 0.14, 0.15, 0.04, p.stencil, 14);
  strut(wm, [0, 1.24, 0], [-0.24, 1.24, 0], 0.024, p.alloy, 8);
  const solar = box(wm, [0.24, 1.46, 0.08], [0.36, 0.04, 0.28], p.optic);
  solar.rotation.x = 0.55;
  strut(wm, [0, 1.46, 0], [0.22, 1.46, 0.06], 0.022, p.alloy, 8);
  strut(wm, [-0.46, 2.14, 0], [0.46, 2.14, 0], 0.022, p.alloy, 10);
  const cups = group(root, 'CupRotor', [-0.44, 2.26, 0]);
  tube(cups, [0, -0.06, 0], 0.036, 0.04, 0.14, p.dark, 10);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    strut(cups, [0, 0, 0], [Math.sin(a) * 0.22, 0, Math.cos(a) * 0.22], 0.012, p.alloy, 8);
    orb(cups, [Math.sin(a) * 0.24, 0, Math.cos(a) * 0.24], 0.062, p.accent, p.hd, [1, 1, 0.65]).rotation.y = a;
  }
  const vane = group(root, 'WindVane', [0.44, 2.28, 0]);
  tube(vane, [0, -0.06, 0], 0.032, 0.036, 0.14, p.dark, 10);
  strut(vane, [0, 0, -0.22], [0, 0, 0.22], 0.014, p.alloy, 8);
  box(vane, [0, 0.02, -0.18], [0.024, 0.16, 0.18], p.accent);
  tube(vane, [0, 0, 0.24], 0.008, 0.048, 0.14, p.accent, 10).rotation.x = HPI;
  if (detail) {
    shell(wm, [0, 0.82, 0.12], [0.24, 0.28, 0.14], p.primary, 0.16);
    if (p.hd) for (const sx of [-0.32, 0.32]) for (const sz of [-0.32, 0.32]) fastener(wm, [sx, 0.17, sz], p, 0.024);
  }
  root.animations = [new T.AnimationClip('Measure wind', 2.4, [
    spinTrack('CupRotor', 'y', 2.4, 3),
    rotationTrack('WindVane', 'y', [0, 0.6, 1.2, 1.8, 2.4], [0, 0.78, -0.42, 0.56, 0]),
  ])];
}
