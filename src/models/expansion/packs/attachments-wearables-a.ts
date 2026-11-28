import * as T from 'three';
import { sphericalVisorShell } from '../../hollow-shells';
import {
  HPI, addHarnessStand, addPlinth, box, cone, cyl, fastener, group, hose, lathe,
  orb, ring, rotationTrack, shell, spinTrack, strut, torus, tube, type Finish,
} from './attachments-wearables-kit';

export function buildTwinScubaTankRig(root: T.Group, p: Finish, detail: boolean) {
  const rigG = group(root, 'ScubaRig');
  addHarnessStand(rigG, p, detail, 0.86, 0.72, 0.62);
  shell(rigG, [0, 0.72, -0.14], [0.64, 0.68, 0.12], p.accent, 0.28);
  for (const sx of [-0.18, 0.18]) {
    tube(rigG, [sx, 0.74, 0.06], 0.145, 0.145, 0.68, p.primary, 14);
    orb(rigG, [sx, 1.08, 0.06], 0.145, p.primary, p.hd, [1, 0.9, 1]);
    orb(rigG, [sx, 0.4, 0.06], 0.145, p.tire, p.hd, [1, 0.65, 1]);
    tube(rigG, [sx, 1.24, 0.06], 0.042, 0.048, 0.1, p.alloy, 12);
    strut(rigG, [sx, 1.0, -0.2], [sx, 0.44, -0.22], 0.036, p.tire, 10);
  }
  for (const y of [0.56, 0.9]) shell(rigG, [0, y, 0.05], [0.68, 0.075, 0.34], p.accent, 0.24);
  strut(rigG, [-0.18, 1.26, 0.06], [0.18, 1.26, 0.06], 0.032, p.alloy, 10);
  hose(rigG, [[0.18, 1.26, 0.06], [0.36, 1.18, 0.18], [0.34, 0.82, 0.24], [0.18, 0.62, 0.18]], 0.026, p.tire, p.hd);
  const valve = group(root, 'ValveDial', [0, 1.32, 0.06]);
  tube(valve, [0, -0.02, 0], 0.026, 0.026, 0.08, p.edge, 10);
  torus(valve, [0, 0.03, 0], 0.078, 0.02, p.accent, p.hd).rotation.x = HPI;
  strut(valve, [-0.07, 0.03, 0], [0.07, 0.03, 0], 0.014, p.alloy, 10);
  const pouch = group(root, 'WeightPouch', [0, 0.56, 0.24]);
  shell(pouch, [0, 0, 0], [0.32, 0.18, 0.12], p.dark, 0.26);
  if (detail) {
    cyl(rigG, [-0.18, 1.26, 0.14], 0.055, 0.055, 0.032, p.stencil, 'z', 12);
    box(pouch, [0, 0.02, 0.068], [0.22, 0.045, 0.018], p.primary);
  }
  root.animations = [new T.AnimationClip('Open tank valve', 2.4, [spinTrack('ValveDial', 'y', 2.4, 2)])];
}

export function buildAlpineHikingRucksack(root: T.Group, p: Finish, detail: boolean) {
  const pk = group(root, 'RucksackBody');
  shell(pk, [0, 0.08, 0], [0.84, 0.16, 0.72], p.dark, 0.24);
  shell(pk, [0, 0.72, 0], [0.68, 1.12, 0.48], p.primary, 0.28);
  for (const sx of [-0.36, 0.36]) {
    shell(pk, [sx, 0.54, 0.02], [0.16, 0.44, 0.32], p.accent, 0.28);
    strut(pk, [sx * 0.65, 0.16, -0.26], [sx * 0.65, 1.18, -0.26], 0.026, p.alloy, 10);
    shell(pk, [sx * 0.6, 0.66, -0.32], [0.14, 0.76, 0.09], p.tire, 0.34);
  }
  for (const y of [0.46, 0.84]) box(pk, [0, y, 0.252], [0.64, 0.045, 0.028], p.dark);
  const lid = group(root, 'RucksackLid', [0, 1.28, -0.22]);
  shell(lid, [0, 0.09, 0.24], [0.72, 0.2, 0.54], p.primary, 0.3);
  for (const sx of [-0.18, 0.18]) box(lid, [sx, -0.06, 0.51], [0.065, 0.28, 0.032], p.accent);
  const poles = group(root, 'TrekPoles', [0.45, 0.72, -0.08]);
  for (const dz of [-0.045, 0.045]) {
    tube(poles, [0, 0, dz], 0.022, 0.018, 1.06, p.alloy, 10);
    tube(poles, [0, 0.5, dz], 0.032, 0.032, 0.14, p.tire, 10);
    ring(poles, [0, -0.44, dz], 0.055, 0.018, 0.02, p.accent);
  }
  box(poles, [-0.04, 0.12, 0], [0.12, 0.05, 0.16], p.dark);
  box(poles, [-0.04, -0.22, 0], [0.12, 0.05, 0.16], p.dark);
  if (detail) {
    shell(pk, [0, 0.34, 0.26], [0.46, 0.22, 0.1], p.accent, 0.24);
    if (p.hd) for (const sx of [-0.28, 0.28]) fastener(pk, [sx, 0.168, 0.24], p, 0.024);
  }
  root.animations = [new T.AnimationClip('Lift rucksack lid', 2.6, [rotationTrack('RucksackLid', 'x', [0, 0.7, 1.8, 2.6], [0, -1.25, -1.25, 0])])];
}

export function buildArticulatedMechanicalWings(root: T.Group, p: Finish, detail: boolean) {
  const rigG = group(root, 'WingRig');
  addHarnessStand(rigG, p, detail, 0.92, 0.76, 0.74);
  shell(rigG, [0, 0.88, -0.04], [0.46, 0.72, 0.28], p.dark, 0.3);
  cyl(rigG, [0, 0.94, 0.11], 0.14, 0.14, 0.08, p.accent, 'z', 14);
  cyl(rigG, [0, 0.94, 0.155], 0.085, 0.085, 0.03, p.optic, 'z', 14);
  for (const [name, s] of [['MechWingL', -1], ['MechWingR', 1]] as const) {
    const wing = group(root, name, [s * 0.22, 0.96, -0.02]);
    strut(wing, [0, 0, 0], [s * 0.56, 0.38, -0.06], 0.042, p.accent, 10);
    strut(wing, [s * 0.56, 0.38, -0.06], [s * 1.18, 0.16, -0.14], 0.032, p.alloy, 10);
    for (let k = 0; k < 5; k++) {
      const fLen = 0.78 - k * 0.08;
      const blade = shell(wing, [s * (0.28 + k * 0.18), 0.16 - k * 0.12, -0.06 - k * 0.015], [fLen, 0.11, 0.036], k % 2 === 0 ? p.primary : p.alloy, 0.36);
      blade.rotation.z = s * (0.36 - k * 0.16);
      if (detail) box(blade, [s * fLen * 0.16, 0, 0.022], [fLen * 0.5, 0.032, 0.014], p.accent);
    }
  }
  root.animations = [new T.AnimationClip('Deploy mech wings', 2.8, [
    rotationTrack('MechWingL', 'y', [0, 0.75, 2.0, 2.8], [0, -0.82, -0.82, 0]),
    rotationTrack('MechWingR', 'y', [0, 0.75, 2.0, 2.8], [0, 0.82, 0.82, 0]),
  ])];
}

export function buildScaledDragonWings(root: T.Group, p: Finish, detail: boolean) {
  const rigG = group(root, 'DragonHarness');
  addPlinth(rigG, p, detail, 0.92, 0.78, 0.14, 0.56);
  shell(rigG, [0, 0.86, 0], [0.42, 0.64, 0.28], p.dark, 0.36);
  for (let k = 0; k < 4; k++) {
    cone(rigG, [0, 0.64 + k * 0.16, -0.18], 0.05, 0.14, p.accent, p.hd, 10).rotation.x = -HPI;
  }
  for (const [name, s] of [['DragonWingL', -1], ['DragonWingR', 1]] as const) {
    const wing = group(root, name, [s * 0.18, 0.96, 0]);
    strut(wing, [0, 0, 0], [s * 0.52, 0.42, -0.08], 0.048, p.accent, 10);
    strut(wing, [s * 0.52, 0.42, -0.08], [s * 1.16, 0.54, -0.14], 0.034, p.accent, 10);
    cone(wing, [s * 0.52, 0.56, -0.08], 0.042, 0.18, p.stencil, p.hd, 10).rotation.z = -s * 0.2;
    for (let k = 0; k < 4; k++) {
      const ex = s * (0.48 + k * 0.22);
      const ey = -0.32 + k * 0.22;
      strut(wing, [s * 0.5, 0.4, -0.08], [ex, ey, -0.12], 0.022, p.accent, 10);
      const web = shell(wing, [s * (0.34 + k * 0.17), 0.04 + k * 0.06, -0.09], [0.42, 0.52 - k * 0.05, 0.034], p.primary, 0.4);
      web.rotation.z = s * (0.28 - k * 0.12);
    }
    if (detail) orb(wing, [s * 0.52, 0.42, -0.05], 0.065, p.primary, p.hd);
  }
  root.animations = [new T.AnimationClip('Beat dragon wings', 2.6, [
    rotationTrack('DragonWingL', 'y', [0, 0.65, 1.3, 1.95, 2.6], [0, -0.78, 0.18, -0.78, 0]),
    rotationTrack('DragonWingR', 'y', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.78, -0.18, 0.78, 0]),
  ])];
}

export function buildHornedSamuraiKabuto(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'KabutoStand');
  addPlinth(stand, p, detail, 0.78, 0.74, 0.12, 0.44);
  orb(stand, [0, 0.86, 0], 0.34, p.primary, p.hd, [1, 0.86, 1.02]);
  for (let i = 0; i < 3; i++) {
    lathe(stand, [0, 0.68 - i * 0.085, -0.03], [
      [0.31 + i * 0.055, -0.035], [0.35 + i * 0.055, -0.035], [0.32 + i * 0.045, 0.035], [0.28 + i * 0.045, 0.035], [0.31 + i * 0.055, -0.035],
    ], i === 1 ? p.accent : p.primary, p.hd, 16);
  }
  shell(stand, [0, 0.62, 0.29], [0.34, 0.22, 0.12], p.dark, 0.44);
  const crest = group(root, 'KabutoCrest', [0, 1.02, 0.32]);
  for (const s of [-1, 1]) {
    box(crest, [s * 0.22, 0.2, 0], [0.07, 0.48, 0.032], p.accent).rotation.z = -s * 0.56;
    cone(crest, [s * 0.37, 0.42, 0], 0.045, 0.16, p.accent, p.hd, 10).rotation.z = -s * 0.26;
  }
  const badge = group(root, 'CrestBadge', [0, 1.02, 0.35]);
  cyl(badge, [0, 0, 0], 0.095, 0.095, 0.04, p.accent, 'z', 14);
  orb(badge, [0, 0, 0.022], 0.048, p.optic, p.hd);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      strut(stand, [Math.sin(a) * 0.34, 0.86, Math.cos(a) * 0.34], [0, 1.15, 0], 0.015, p.accent, 10);
    }
  }
  root.animations = [new T.AnimationClip('Display kabuto horns', 2.6, [rotationTrack('KabutoCrest', 'x', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.32, 0, -0.24, 0])])];
}

export function buildBrassDivingHelmet(root: T.Group, p: Finish, detail: boolean) {
  const helm = group(root, 'DiveHelmBase');
  addPlinth(helm, p, detail, 0.84, 0.82, 0.12, 0.18);
  shell(helm, [0, 0.42, 0], [0.76, 0.24, 0.68], p.primary, 0.46);
  orb(helm, [0, 0.82, 0], 0.37, p.primary, p.hd, [1, 1.04, 1]);
  for (const s of [-1, 1]) {
    cyl(helm, [s * 0.36, 0.84, 0.02], 0.115, 0.125, 0.075, p.accent, 'x', 14);
    cyl(helm, [s * 0.395, 0.84, 0.02], 0.088, 0.088, 0.026, p.optic, 'x', 14);
  }
  const hatch = group(root, 'ViewportHatch', [-0.15, 0.84, 0.35]);
  torus(hatch, [0.15, 0, 0.02], 0.15, 0.032, p.accent, p.hd);
  orb(hatch, [0.15, 0, 0.01], 0.135, p.optic, p.hd, [1, 1, 0.42]);
  if (detail) {
    box(hatch, [0.15, 0, 0.06], [0.27, 0.022, 0.018], p.primary);
    box(hatch, [0.15, 0, 0.06], [0.022, 0.27, 0.018], p.primary);
    for (const sx of [-0.26, 0, 0.26]) fastener(helm, [sx, 0.545, 0.26], p, 0.026);
  }
  const valve = group(root, 'ExhaustValve', [0, 1.22, 0]);
  tube(valve, [0, 0, 0], 0.065, 0.078, 0.085, p.accent, 12);
  torus(valve, [0, 0.055, 0], 0.072, 0.018, p.edge, p.hd).rotation.x = HPI;
  root.animations = [
    new T.AnimationClip('Open viewport', 2.8, [rotationTrack('ViewportHatch', 'y', [0, 0.75, 2.0, 2.8], [0, -1.55, -1.55, 0])]),
    new T.AnimationClip('Turn exhaust valve', 2.4, [spinTrack('ExhaustValve', 'y', 2.4, 2)]),
  ];
}

export function buildVisorAstronautHelmet(root: T.Group, p: Finish, detail: boolean) {
  const eva = group(root, 'EvaHelmetBase');
  addPlinth(eva, p, detail, 0.82, 0.8, 0.12, 0.26);
  ring(eva, [0, 0.44, 0], 0.34, 0.065, 0.095, p.alloy);
  orb(eva, [0, 0.8, -0.02], 0.38, p.primary, p.hd, [1.02, 1.02, 1.02]);
  // Dark recessed viewport face-plate sitting cleanly inside the front aperture.
  sphericalVisorShell(eva, [0, 0.8, -0.02], 0.376, 0.394, 0.92, -0.34, 0.4, p.inset, p.hd);
  // Concentric curved EVA gold sun-shield gliding strictly OUTSIDE the helmet shell (zero solid overlap).
  const visor = group(root, 'EvaSunVisor', [0, 0.8, -0.02]);
  sphericalVisorShell(visor, [0, 0, 0], 0.402, 0.424, 1.06, -0.36, 0.48, p.accent, p.hd);
  for (const s of [-1, 1]) {
    cyl(visor, [s * 0.395, 0, 0], 0.048, 0.048, 0.044, p.dark, 'x', 12);
    strut(visor, [s * 0.395, 0, 0], [s * 0.355, 0.04, 0.2], 0.018, p.dark, 8);
  }
  box(visor, [0, 0.21, 0.37], [0.42, 0.045, 0.08], p.dark);
  const cam = group(root, 'HelmCam', [0.39, 0.84, 0.04]);
  shell(cam, [0.04, 0, 0], [0.14, 0.14, 0.22], p.dark, 0.32);
  cyl(cam, [0.04, 0, 0.12], 0.045, 0.052, 0.05, p.optic, 'z', 12);
  if (detail) {
    shell(eva, [-0.41, 0.84, 0.04], [0.1, 0.12, 0.18], p.dark, 0.32);
    box(eva, [-0.41, 0.84, 0.14], [0.065, 0.065, 0.022], p.optic);
  }
  root.animations = [new T.AnimationClip('Raise sun visor', 2.8, [rotationTrack('EvaSunVisor', 'x', [0, 0.75, 2.0, 2.8], [0, -1.02, -1.02, 0])])];
}

export function buildPointedWizardHat(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'WizardHatStand');
  addPlinth(stand, p, detail, 0.86, 0.86, 0.12, 0.42);
  orb(stand, [0, 0.62, 0], 0.24, p.edge, p.hd);
  lathe(stand, [0, 0.66, 0], [[0.22, -0.02], [0.58, -0.06], [0.59, -0.01], [0.3, 0.06], [0.26, 0.12]], p.primary, p.hd, 18);
  torus(stand, [0, 0.74, 0], 0.29, 0.044, p.accent, p.hd).rotation.x = HPI;
  const spire = group(root, 'HatSpire', [0, 0.78, 0]);
  tube(spire, [0, 0.24, -0.03], 0.14, 0.29, 0.48, p.primary, 16).rotation.x = -0.14;
  cone(spire, [0.05, 0.66, -0.15], 0.15, 0.46, p.primary, p.hd, 16).rotation.set(-0.48, 0, -0.2);
  if (detail) {
    orb(spire, [0.12, 0.85, -0.27], 0.048, p.accent, p.hd);
    for (const [x, y, z] of [[-0.14, 0.24, 0.19], [0.16, 0.36, 0.12], [0, 0.52, 0.05]] as const) {
      orb(spire, [x, y, z], 0.028, p.stencil, p.hd);
    }
  }
  const buckle = group(root, 'HatBuckle', [0, 0.75, 0.325]);
  box(buckle, [0, 0, 0], [0.15, 0.12, 0.04], p.accent);
  box(buckle, [0, 0, 0.022], [0.075, 0.06, 0.02], p.optic);
  root.animations = [new T.AnimationClip('Sway hat spire', 2.8, [rotationTrack('HatSpire', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.32, 0, -0.32, 0])])];
}

export function buildPlumedKnightHelm(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'KnightHelmStand');
  addPlinth(stand, p, detail, 0.8, 0.82, 0.12, 0.34);
  tube(stand, [0, 0.56, 0], 0.28, 0.36, 0.22, p.alloy, 14);
  orb(stand, [0, 0.9, -0.02], 0.33, p.primary, p.hd, [0.96, 1.06, 1.08]);
  shell(stand, [0, 1.24, -0.02], [0.09, 0.14, 0.46], p.alloy, 0.4);
  const visor = group(root, 'ArmetVisor', [0, 0.92, 0.06]);
  cone(visor, [0, -0.04, 0.34], 0.24, 0.32, p.primary, p.hd, 12).rotation.x = HPI;
  box(visor, [0, 0.03, 0.35], [0.34, 0.036, 0.08], p.inset);
  if (detail) {
    for (const s of [-1, 1]) fastener(visor, [s * 0.3, 0, -0.04], p, 0.03).rotation.z = -s * HPI;
  }
  const plume = group(root, 'HelmPlume', [0, 1.32, -0.04]);
  tube(plume, [0, 0.02, 0.02], 0.048, 0.062, 0.09, p.accent, 12);
  for (let i = 0; i < (detail ? 6 : 4); i++) {
    const t = i / (detail ? 5 : 3);
    orb(plume, [0, 0.14 + Math.sin(t * 2.5) * 0.08, 0.06 - t * 0.48], 0.11 - t * 0.02, p.accent, p.hd, [0.65, 1.05, 1.05]);
  }
  root.animations = [new T.AnimationClip('Raise armet visor', 2.8, [rotationTrack('ArmetVisor', 'x', [0, 0.75, 2.0, 2.8], [0, -1.02, -1.02, 0])])];
}

export function buildJeweledCrownCushion(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'CrownPlinth');
  shell(base, [0, 0.09, 0], [0.96, 0.18, 0.96], p.dark, 0.24);
  shell(base, [0, 0.24, 0], [0.82, 0.14, 0.82], p.edge, 0.26);
  orb(base, [0, 0.44, 0], 0.42, p.accent, p.hd, [1.06, 0.48, 1.06]);
  for (const sx of [-0.38, 0.38]) {
    for (const sz of [-0.38, 0.38]) orb(base, [sx, 0.38, sz], 0.075, p.primary, p.hd);
  }
  const crown = group(root, 'RoyalCrown', [0, 0.62, 0]);
  ring(crown, [0, 0.06, 0], 0.29, 0.048, 0.14, p.primary);
  orb(crown, [0, 0.16, 0], 0.25, p.accent, p.hd, [1, 0.72, 1]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.sin(a) * 0.275, z = Math.cos(a) * 0.275;
    cone(crown, [x, 0.22, z], 0.055, 0.18, p.primary, p.hd, 8);
    orb(crown, [x, 0.32, z], 0.032, p.stencil, p.hd);
    if (detail) orb(crown, [Math.sin(a) * 0.302, 0.06, Math.cos(a) * 0.302], 0.032, i % 2 === 0 ? p.optic : p.accent, p.hd);
  }
  orb(crown, [0, 0.35, 0], 0.065, p.primary, p.hd);
  box(crown, [0, 0.45, 0], [0.032, 0.12, 0.032], p.primary);
  box(crown, [0, 0.46, 0], [0.095, 0.032, 0.032], p.primary);
  root.animations = [new T.AnimationClip('Rotate royal crown', 3.2, [spinTrack('RoyalCrown', 'y', 3.2, 1)])];
}
