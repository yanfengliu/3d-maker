import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { cyl, glassTube, HPI, labGlass, matte, orb, slideTrack } from './science-medical-kit';

export function compoundMicroscope(root: T.Group, p: Finish, detail: boolean) {
  const m = group(root, 'MicroscopeBody');
  shell(m, [0, 0.08, 0], [0.82, 0.16, 0.94], p.dark, 0.22);
  shell(m, [0, 0.2, 0.12], [0.56, 0.14, 0.62], p.primary, 0.26);
  tube(m, [0, 0.3, 0.24], 0.12, 0.14, 0.1, p.optic, 14);
  shell(m, [0, 0.64, -0.26], [0.22, 0.78, 0.24], p.primary, 0.2);
  shell(m, [0, 0.96, -0.02], [0.24, 0.22, 0.66], p.primary, 0.22);
  cyl(m, [0, 0.36, -0.26], 0.085, 0.085, 0.34, p.accent, 'x', 14);
  const head = group(m, '', [0, 1.08, 0.18]);
  shell(head, [0, 0.06, 0], [0.24, 0.16, 0.26], p.dark, 0.22);
  for (const sx of [-0.08, 0.08]) {
    const eye = tube(head, [sx, 0.24, 0.14], 0.045, 0.052, 0.34, p.dark, 12);
    eye.rotation.x = 0.62;
    tube(eye, [0, 0.17, 0], 0.056, 0.048, 0.06, p.accent, 12);
  }
  const turret = group(root, 'ObjectiveTurret', [0, 0.86, 0.22]);
  tube(turret, [0, 0, 0], 0.14, 0.12, 0.07, p.alloy, 14);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    tube(turret, [Math.sin(a) * 0.075, -0.11, Math.cos(a) * 0.075], 0.032, 0.024, 0.18, i === 0 ? p.accent : p.alloy, 10);
  }
  const stage = group(root, 'SpecimenStage', [0, 0.56, 0.18]);
  shell(stage, [0, 0, 0], [0.46, 0.055, 0.44], p.dark, 0.12);
  box(stage, [0, 0, -0.26], [0.18, 0.12, 0.16], p.primary);
  labGlass(stage, [0, 0.042, 0], [0.28, 0.016, 0.12]);
  for (const sx of [-0.12, 0.12]) box(stage, [sx, 0.055, -0.05], [0.024, 0.016, 0.14], p.alloy);
  if (detail) {
    cyl(m, [0, 0.36, -0.26], 0.052, 0.052, 0.4, p.alloy, 'x', 12);
    if (p.hd) for (const sx of [-0.28, 0.28]) fastener(m, [sx, 0.16, 0.38], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Rotate lenses', 3, [spinTrack('ObjectiveTurret', 'y', 3, 1)]),
    new T.AnimationClip('Focus stage', 2.8, [slideTrack('SpecimenStage', [0, 0.56, 0.18], 1, [0, 0.9, 2, 2.8], [0, 0.16, 0.16, 0])]),
  ];
}

export function benchtopCentrifuge(root: T.Group, p: Finish, detail: boolean) {
  const cf = group(root, 'CentrifugeBase');
  shell(cf, [0, 0.1, 0], [0.98, 0.2, 0.98], p.dark, 0.16);
  shell(cf, [0, 0.44, -0.04], [0.88, 0.52, 0.84], p.primary, 0.24);
  const panel = group(cf, '', [0, 0.34, 0.4]);
  panel.rotation.x = -0.35;
  shell(panel, [0, 0, 0], [0.74, 0.24, 0.09], p.dark, 0.18);
  box(panel, [-0.14, 0.02, 0.055], [0.28, 0.11, 0.02], p.optic);
  for (const x of [0.14, 0.26]) cyl(panel, [x, 0.02, 0.055], 0.036, 0.036, 0.03, p.accent, 'z', 10);
  ring(cf, [0, 0.72, -0.04], 0.34, 0.06, 0.1, p.alloy);
  const rotor = group(root, 'SampleRotor', [0, 0.7, -0.04]);
  tube(rotor, [0, 0, 0], 0.24, 0.26, 0.1, p.dark, 16);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const vial = tube(rotor, [Math.sin(a) * 0.16, 0.08, Math.cos(a) * 0.16], 0.034, 0.028, 0.14, p.accent, 10);
    vial.rotation.z = -Math.sin(a) * 0.35;
    vial.rotation.x = Math.cos(a) * 0.35;
  }
  const lid = group(root, 'CentrifugeLid', [0, 0.74, -0.44]);
  shell(lid, [0, 0.08, 0.4], [0.84, 0.16, 0.8], p.primary, 0.28);
  labGlass(lid, [0, 0.165, 0.4], [0.42, 0.028, 0.42]);
  box(lid, [0, 0.08, 0.81], [0.24, 0.045, 0.04], p.accent);
  if (detail) {
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) box(cf, [s * 0.45, 0.34 + i * 0.075, -0.04], [0.02, 0.026, 0.46], p.dark);
    if (p.hd) for (const sx of [-0.36, 0.36]) fastener(cf, [sx, 0.72, -0.44], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Spin samples', 1.6, [spinTrack('SampleRotor', 'y', 1.6, 4)]),
    new T.AnimationClip('Open lid', 3, [rotationTrack('CentrifugeLid', 'x', [0, 0.9, 2.1, 3], [0, -1.25, -1.25, 0])]),
  ];
}

export function mriGantryScanner(root: T.Group, p: Finish, detail: boolean) {
  const mri = group(root, 'MriGantry');
  shell(mri, [0, 0.08, -0.46], [1.96, 0.16, 1.24], p.dark, 0.16);
  for (const sx of [-0.74, 0.74]) shell(mri, [sx, 0.86, -0.46], [0.48, 1.48, 1.12], p.primary, 0.22);
  shell(mri, [0, 1.78, -0.46], [1.96, 0.48, 1.12], p.primary, 0.24);
  shell(mri, [0, 0.24, -0.46], [1.86, 0.26, 1.12], p.primary, 0.22);
  ring(mri, [0, 1.06, -0.46], 0.82, 0.24, 1.14, p.primary).rotation.x = HPI;
  const bore = group(root, 'BoreRing', [0, 1.06, 0.12]);
  ring(bore, [0, 0, 0], 0.62, 0.045, 0.06, p.accent).rotation.x = HPI;
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    box(bore, [Math.sin(a) * 0.62, Math.cos(a) * 0.62, 0.04], [0.08, 0.08, 0.03], p.optic);
  }
  shell(mri, [0, 0.42, 0.88], [0.76, 0.84, 1.18], p.primary, 0.18);
  box(mri, [0, 0.48, 0.28], [0.68, 0.48, 0.42], p.dark);
  const tbl = group(root, 'PatientTable', [0, 0.88, 0.72]);
  shell(tbl, [0, 0, 0], [0.64, 0.09, 1.66], p.dark, 0.18);
  shell(tbl, [0, 0.08, 0], [0.56, 0.09, 1.54], p.accent, 0.28);
  shell(tbl, [0, 0.16, -0.56], [0.34, 0.14, 0.26], p.stencil, 0.3);
  if (detail) {
    box(mri, [0.74, 1.18, 0.12], [0.24, 0.34, 0.04], p.optic);
    if (p.hd) for (const sx of [-0.74, 0.74]) fastener(mri, [sx, 1.72, 0.12], p, 0.028).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Scan cycle', 3.4, [
    slideTrack('PatientTable', [0, 0.88, 0.72], 2, [0, 1.1, 2.3, 3.4], [0, -0.78, -0.78, 0]),
    spinTrack('BoreRing', 'z', 3.4, 2),
  ])];
}

export function equatorialTelescope(root: T.Group, p: Finish, detail: boolean) {
  const tel = group(root, 'TelescopePier');
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const dx = Math.sin(a), dz = Math.cos(a);
    strut(tel, [dx * 0.56, 0.02, dz * 0.56], [dx * 0.12, 1.16, dz * 0.12], 0.036, p.dark, 10);
    tube(tel, [dx * 0.56, 0.04, dz * 0.56], 0.048, 0.056, 0.08, p.tire, 10);
    strut(tel, [dx * 0.36, 0.48, dz * 0.36], [0, 0.48, 0], 0.018, p.alloy, 8);
  }
  tube(tel, [0, 0.48, 0], 0.2, 0.2, 0.045, p.dark, 12);
  tube(tel, [0, 1.24, 0], 0.14, 0.16, 0.22, p.dark, 14);
  const ra = group(root, 'RightAscension', [0, 1.4, 0]);
  cyl(ra, [0, 0.04, 0], 0.085, 0.085, 0.32, p.accent, 'z', 14).rotation.x = 0.7;
  strut(ra, [0, 0.02, 0], [-0.46, -0.34, 0], 0.02, p.alloy, 8);
  for (const t of [0.68, 0.88]) cyl(ra, [-0.46 * t, -0.34 * t, 0], 0.11, 0.11, 0.075, p.dark, 'x', 14);
  const scope = group(ra, 'TelescopeTube', [0.16, 0.18, 0]);
  scope.rotation.x = -0.45;
  cyl(scope, [0, 0, 0.1], 0.11, 0.11, 1.26, p.primary, 'z', 16);
  cyl(scope, [0, 0, 0.8], 0.145, 0.13, 0.26, p.accent, 'z', 16);
  cyl(scope, [0, 0, 0.88], 0.12, 0.12, 0.04, p.optic, 'z', 14);
  cyl(scope, [0, 0, -0.6], 0.06, 0.085, 0.24, p.dark, 'z', 12);
  tube(scope, [0, 0.1, -0.7], 0.036, 0.044, 0.16, p.accent, 10);
  cyl(scope, [0.12, 0.14, -0.1], 0.035, 0.035, 0.38, p.dark, 'z', 10);
  strut(scope, [0.06, 0.08, -0.1], [0.12, 0.14, -0.1], 0.016, p.alloy, 8);
  if (detail) {
    for (const z of [-0.14, 0.26]) ring(scope, [0, 0, z], 0.125, 0.02, 0.045, p.accent).rotation.x = HPI;
    if (p.hd) for (const z of [-0.14, 0.26]) fastener(scope, [0.12, 0, z], p, 0.02).rotation.z = HPI;
  }
  root.animations = [new T.AnimationClip('Track star', 3.4, [
    rotationTrack('RightAscension', 'y', [0, 1.1, 2.3, 3.4], [0, 1.15, 1.15, 0]),
    rotationTrack('TelescopeTube', 'x', [0, 0.9, 2.2, 3.4], [-0.45, -0.95, -0.25, -0.45]),
  ])];
}

export function steamAutoclave(root: T.Group, p: Finish, detail: boolean) {
  const ac = group(root, 'AutoclaveUnit');
  for (const sx of [-0.42, 0.42]) for (const sz of [-0.46, 0.46]) tube(ac, [sx, 0.06, sz], 0.05, 0.05, 0.12, p.tire, 10);
  shell(ac, [0, 0.48, 0], [1.04, 0.76, 1.12], p.dark, 0.12);
  cyl(ac, [0, 1.2, -0.04], 0.42, 0.42, 1.04, p.primary, 'z', 18);
  orb(ac, [0, 1.2, -0.56], 0.42, p.primary, p.hd, [1, 1, 0.36]);
  for (const z of [-0.36, 0.24]) ring(ac, [0, 1.2, z], 0.44, 0.03, 0.06, p.alloy).rotation.x = HPI;
  tube(ac, [0, 1.66, -0.1], 0.05, 0.06, 0.16, p.accent, 10);
  cyl(ac, [0.22, 1.64, 0.16], 0.09, 0.09, 0.04, p.stencil, 'z', 14);
  const door = group(root, 'PressureDoor', [-0.44, 1.2, 0.49]);
  cyl(door, [0.44, 0, 0.04], 0.44, 0.44, 0.09, p.alloy, 'z', 18);
  const wheel = group(door, 'LockWheel', [0.44, 0, 0.14]);
  cyl(wheel, [0, 0, -0.05], 0.045, 0.045, 0.12, p.dark, 'z', 10);
  ring(wheel, [0, 0, 0], 0.24, 0.032, 0.045, p.accent).rotation.x = HPI;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    strut(wheel, [0, 0, 0], [Math.sin(a) * 0.23, Math.cos(a) * 0.23, 0], 0.018, p.dark, 8);
  }
  if (detail) {
    box(ac, [0, 0.62, 0.575], [0.68, 0.22, 0.03], p.optic);
    if (p.hd) for (const sx of [-0.38, 0.38]) fastener(ac, [sx, 0.84, 0.56], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Unseal autoclave', 3.4, [
    spinTrack('LockWheel', 'z', 3.4, 2),
    rotationTrack('PressureDoor', 'y', [0, 1.0, 2.4, 3.4], [0, -1.3, -1.3, 0]),
  ])];
}

export function labFumeHood(root: T.Group, p: Finish, detail: boolean) {
  const fh = group(root, 'FumeHood');
  shell(fh, [0, 0.42, 0], [1.56, 0.84, 0.92], p.primary, 0.1);
  for (const sx of [-0.38, 0.38]) {
    box(fh, [sx, 0.42, 0.475], [0.68, 0.68, 0.03], p.dark);
    box(fh, [sx, 0.62, 0.5], [0.22, 0.036, 0.028], p.accent);
  }
  shell(fh, [0, 0.88, 0], [1.64, 0.08, 0.98], p.inset, 0.1);
  box(fh, [0, 1.48, -0.38], [1.56, 1.18, 0.16], p.primary);
  for (const sx of [-0.72, 0.72]) box(fh, [sx, 1.48, 0], [0.14, 1.18, 0.92], p.primary);
  shell(fh, [0, 2.18, 0], [1.62, 0.34, 0.96], p.primary, 0.14);
  tube(fh, [0, 2.48, -0.14], 0.2, 0.22, 0.34, p.alloy, 14);
  for (const [fx, fz, col] of [[-0.36, 0.04, p.accent], [0, -0.06, p.optic], [0.34, 0.06, p.accent]] as const) {
    tube(fh, [fx, 1.02, fz], 0.04, 0.11, 0.2, col, 12);
    tube(fh, [fx, 1.16, fz], 0.036, 0.04, 0.1, p.stencil, 10);
  }
  const sash = group(root, 'GlassSash', [0, 1.38, 0.44]);
  for (const sx of [-0.62, 0.62]) box(sash, [sx, 0, 0], [0.055, 0.76, 0.04], p.alloy);
  for (const y of [-0.36, 0.36]) box(sash, [0, y, 0], [1.3, 0.055, 0.04], p.alloy);
  labGlass(sash, [0, 0, 0], [1.18, 0.66, 0.018]);
  box(sash, [0, -0.36, 0.045], [0.96, 0.042, 0.04], p.accent);
  const turb = group(root, 'BlowerTurbine', [0, 2.48, -0.14]);
  tube(turb, [0, 0.16, 0], 0.06, 0.06, 0.08, p.dark, 10);
  for (let i = 0; i < 6; i++) box(turb, [0, 0.18, 0], [0.34, 0.024, 0.065], p.accent).rotation.y = (i * Math.PI) / 3;
  if (detail) {
    for (const sx of [-0.72, 0.72]) cyl(fh, [sx, 1.18, 0.48], 0.036, 0.036, 0.04, p.accent, 'z', 10);
    if (p.hd) for (const sx of [-0.66, 0.66]) fastener(fh, [sx, 2.2, 0.49], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Raise sash', 3, [slideTrack('GlassSash', [0, 1.38, 0.44], 1, [0, 0.9, 2.1, 3], [0, 0.34, 0.34, 0])]),
    new T.AnimationClip('Exhaust blower', 1.8, [spinTrack('BlowerTurbine', 'y', 1.8, 3)]),
  ];
}

export function articulatedXrayArm(root: T.Group, p: Finish, detail: boolean) {
  const xr = group(root, 'XrayRig');
  shell(xr, [0, 0.16, 0], [0.88, 0.16, 1.06], p.dark, 0.18);
  for (const sx of [-0.36, 0.36]) for (const sz of [-0.42, 0.42]) tube(xr, [sx, 0.05, sz], 0.055, 0.055, 0.1, p.tire, 10);
  shell(xr, [0, 0.56, -0.12], [0.76, 0.68, 0.72], p.primary, 0.16);
  box(xr, [0, 0.74, 0.255], [0.46, 0.26, 0.04], p.optic);
  const col = group(root, 'ArmColumn', [0, 0.9, -0.16]);
  tube(col, [0, 0.56, 0], 0.09, 0.11, 1.14, p.primary, 14);
  shell(col, [0, 0.98, 0.28], [0.16, 0.16, 0.68], p.alloy, 0.16);
  strut(col, [0, 0.76, 0.06], [0, 0.96, 0.52], 0.032, p.accent, 10);
  const head = group(col, 'XrayHead', [0, 0.96, 0.66]);
  cyl(head, [0, 0, 0], 0.16, 0.16, 0.44, p.primary, 'x', 14);
  shell(head, [0, -0.22, 0], [0.24, 0.22, 0.24], p.dark, 0.16);
  tube(head, [0, -0.36, 0], 0.1, 0.14, 0.1, p.accent, 12);
  for (const sx of [-0.14, 0.14]) strut(head, [sx, -0.2, 0.12], [sx, -0.32, 0.18], 0.016, p.alloy, 8);
  if (detail) {
    strut(xr, [-0.34, 0.88, -0.46], [0.34, 0.88, -0.46], 0.024, p.accent, 8);
    for (const sx of [-0.34, 0.34]) strut(xr, [sx, 0.72, -0.42], [sx, 0.88, -0.46], 0.022, p.dark, 8);
    if (p.hd) for (const sx of [-0.3, 0.3]) fastener(xr, [sx, 0.9, 0.22], p, 0.022);
  }
  root.animations = [new T.AnimationClip('Aim X-ray', 3.2, [
    rotationTrack('ArmColumn', 'y', [0, 0.8, 1.6, 2.4, 3.2], [0, 0.65, 0, -0.65, 0]),
    rotationTrack('XrayHead', 'x', [0, 0.9, 2.1, 3.2], [0, 0.55, -0.35, 0]),
  ])];
}

export function drumSeismograph(root: T.Group, p: Finish, detail: boolean) {
  const sg = group(root, 'Seismograph');
  const granite = matte('#5e6266', 0.86, 'Granite plinth');
  shell(sg, [0, 0.14, 0], [1.26, 0.28, 0.84], granite, 0.14);
  tube(sg, [-0.42, 0.62, 0], 0.048, 0.056, 0.72, p.accent, 12);
  strut(sg, [-0.42, 0.94, 0], [-0.08, 0.68, 0], 0.016, p.alloy, 8);
  for (const sx of [0.02, 0.48]) box(sg, [sx, 0.44, 0], [0.06, 0.34, 0.32], p.primary);
  const drum = group(root, 'ChartDrum', [0.25, 0.5, 0]);
  cyl(drum, [0, 0, 0], 0.18, 0.18, 0.42, p.stencil, 'x', 18);
  for (const x of [-0.14, 0, 0.14]) ring(drum, [x, 0, 0], 0.184, 0.008, 0.014, p.accent).rotation.z = HPI;
  const stylus = group(root, 'StylusArm', [-0.42, 0.64, 0]);
  strut(stylus, [0, 0, 0], [0.34, 0, 0], 0.018, p.accent, 8);
  tube(stylus, [0.32, 0, 0], 0.095, 0.095, 0.16, p.dark, 14);
  strut(stylus, [0.34, 0.02, 0], [0.66, 0.06, 0], 0.01, p.alloy, 8);
  if (detail) {
    for (const sx of [-0.56, 0.56]) for (const sz of [-0.36, 0.36]) box(sg, [sx, 0.64, sz], [0.036, 0.72, 0.036], p.accent);
    labGlass(sg, [0, 0.99, 0], [1.14, 0.022, 0.74]);
    if (p.hd) for (const sx of [-0.52, 0.52]) fastener(sg, [sx, 0.29, 0.34], p, 0.022);
  }
  root.animations = [new T.AnimationClip('Record tremor', 2.4, [
    spinTrack('ChartDrum', 'x', 2.4, 2),
    rotationTrack('StylusArm', 'y', [0, 0.3, 0.6, 0.9, 1.2, 1.6, 2.0, 2.4], [0, 0.22, -0.24, 0.18, -0.16, 0.12, -0.08, 0]),
  ])];
}

export function vanDeGraaffGenerator(root: T.Group, p: Finish, detail: boolean) {
  const vg = group(root, 'VanDeGraaff');
  shell(vg, [0, 0.14, 0], [1.08, 0.28, 0.88], p.dark, 0.18);
  shell(vg, [-0.14, 0.42, 0], [0.58, 0.34, 0.56], p.primary, 0.2);
  glassTube(vg, [-0.14, 1.04, 0], 0.13, 0.13, 0.94, p.hd);
  box(vg, [-0.14, 1.04, 0], [0.09, 0.88, 0.028], p.stencil);
  orb(vg, [-0.14, 1.66, 0], 0.34, p.alloy, p.hd);
  ring(vg, [-0.14, 1.4, 0], 0.16, 0.028, 0.06, p.accent);
  const roller = group(root, 'BeltRoller', [-0.14, 0.58, 0]);
  cyl(roller, [0, 0, 0], 0.072, 0.072, 0.16, p.accent, 'x', 14);
  box(roller, [0, 0.065, 0], [0.14, 0.02, 0.025], p.dark);
  const wand = group(root, 'DischargeWand', [0.36, 0.28, 0]);
  tube(wand, [0, 0.56, 0], 0.028, 0.036, 1.12, p.primary, 10);
  orb(wand, [0, 1.24, 0], 0.14, p.accent, p.hd);
  if (detail) {
    box(vg, [-0.14, 0.42, 0.295], [0.24, 0.14, 0.03], p.optic);
    if (p.hd) for (const sx of [-0.42, 0.42]) fastener(vg, [sx, 0.28, 0.36], p, 0.024);
  }
  root.animations = [new T.AnimationClip('Charge dome', 2.4, [
    spinTrack('BeltRoller', 'x', 2.4, 4),
    rotationTrack('DischargeWand', 'z', [0, 0.7, 1.6, 2.4], [0, 0.32, 0.32, 0]),
  ])];
}

export function labBioIncubator(root: T.Group, p: Finish, detail: boolean) {
  const inc = group(root, 'BioIncubator');
  for (const sx of [-0.36, 0.36]) for (const sz of [-0.34, 0.34]) tube(inc, [sx, 0.05, sz], 0.048, 0.052, 0.1, p.tire, 10);
  box(inc, [0, 0.72, -0.34], [0.96, 1.24, 0.14], p.primary);
  for (const sx of [-0.44, 0.44]) box(inc, [sx, 0.72, 0], [0.09, 1.24, 0.82], p.primary);
  box(inc, [0, 0.16, 0], [0.94, 0.14, 0.82], p.primary);
  shell(inc, [0, 1.44, 0], [1.0, 0.22, 0.86], p.dark, 0.12);
  box(inc, [0, 1.44, 0.445], [0.46, 0.12, 0.026], p.optic);
  for (const y of [0.44, 1.04]) box(inc, [0, y, -0.02], [0.78, 0.03, 0.56], p.alloy);
  const tray = group(root, 'PetriTray', [0, 0.74, 0.02]);
  box(tray, [0, 0, 0], [0.76, 0.032, 0.54], p.alloy);
  for (const px of [-0.22, 0, 0.22]) for (const pz of [-0.14, 0.14]) {
    tube(tray, [px, 0.038, pz], 0.075, 0.075, 0.04, p.accent, 12);
  }
  const door = group(root, 'IncubatorDoor', [-0.46, 0.72, 0.42]);
  for (const dx of [0.05, 0.87]) box(door, [dx, 0, 0], [0.1, 1.18, 0.06], p.primary);
  for (const y of [-0.54, 0.54]) box(door, [0.46, y, 0], [0.92, 0.1, 0.06], p.primary);
  labGlass(door, [0.46, 0, 0], [0.72, 0.98, 0.02]);
  box(door, [0.85, 0, 0.05], [0.04, 0.34, 0.04], p.accent);
  if (detail) {
    for (const sx of [-0.34, 0.34]) cyl(inc, [sx, 1.44, 0.45], 0.034, 0.034, 0.03, p.accent, 'z', 10);
    if (p.hd) for (const sx of [-0.42, 0.42]) fastener(inc, [sx, 1.5, 0.44], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Inspect culture', 3.4, [
    rotationTrack('IncubatorDoor', 'y', [0, 0.9, 2.4, 3.4], [0, -1.35, -1.35, 0]),
    slideTrack('PetriTray', [0, 0.74, 0.02], 2, [0, 1.2, 2.2, 3.4], [0, 0.42, 0.42, 0]),
  ])];
}
