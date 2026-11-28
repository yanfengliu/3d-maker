import * as T from 'three';
import {
  HPI, addHarnessStand, addPlinth, band, box, cone, cyl, fastener, group, hose,
  orb, ring, rotationTrack, shell, slideTrack, spinTrack, strut, torus, tube, type Finish,
} from './attachments-wearables-kit';

export function buildMountedRailCannon(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'RailBase');
  addPlinth(base, p, detail, 0.88, 0.86, 0.14, 0.32);
  shell(base, [0, 0.48, 0], [0.64, 0.2, 0.62], p.primary, 0.32);
  const yaw = group(root, 'RailYaw', [0, 0.62, 0]);
  ring(yaw, [0, 0, 0], 0.28, 0.055, 0.09, p.alloy);
  shell(yaw, [0, 0.14, -0.02], [0.46, 0.22, 0.48], p.dark, 0.24);
  for (const sx of [-0.22, 0.22]) shell(yaw, [sx, 0.32, 0], [0.1, 0.3, 0.3], p.accent, 0.22);
  const pitch = group(yaw, 'RailPitch', [0, 0.34, 0.04]);
  shell(pitch, [0, 0, -0.06], [0.34, 0.26, 0.56], p.primary, 0.22);
  for (const sy of [-0.055, 0.055]) box(pitch, [0, sy, 0.52], [0.16, 0.045, 0.72], p.alloy);
  box(pitch, [0, 0, 0.5], [0.06, 0.055, 0.68], p.optic);
  for (const z of [0.28, 0.48, 0.68]) band(pitch, [0, 0, z], 0.135, 0.028, 0.048, p.accent, 'z');
  cyl(pitch, [0, -0.16, -0.06], 0.11, 0.11, 0.32, p.edge, 'z', 14);
  if (detail) {
    hose(yaw, [[-0.24, 0.2, -0.14], [-0.28, 0.34, -0.22], [-0.14, 0.36, -0.18]], 0.026, p.tire, p.hd);
    if (p.hd) for (const sx of [-0.16, 0.16]) fastener(pitch, [sx, 0.135, 0.04], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Pan rail cannon', 3.2, [rotationTrack('RailYaw', 'y', [0, 0.8, 1.6, 2.4, 3.2], [0, 1.05, 0, -1.05, 0])]),
    new T.AnimationClip('Elevate rail barrel', 2.6, [rotationTrack('RailPitch', 'x', [0, 0.65, 1.3, 1.95, 2.6], [0, -0.45, 0, 0.52, 0])]),
  ];
}

export function buildFieldMedicBackpack(root: T.Group, p: Finish, detail: boolean) {
  const pk = group(root, 'MedicPackBody');
  addHarnessStand(pk, p, detail, 0.86, 0.72, 0.62);
  shell(pk, [0, 0.72, 0.02], [0.7, 0.84, 0.44], p.primary, 0.3);
  shell(pk, [0, 0.74, 0.255], [0.34, 0.34, 0.04], p.stencil, 0.3);
  box(pk, [0, 0.74, 0.282], [0.08, 0.24, 0.024], p.accent);
  box(pk, [0, 0.74, 0.282], [0.24, 0.08, 0.024], p.accent);
  for (const sx of [-0.38, 0.38]) {
    tube(pk, [sx, 0.72, 0.02], 0.068, 0.068, 0.46, p.optic, 14);
    tube(pk, [sx, 0.96, 0.02], 0.075, 0.075, 0.055, p.alloy, 12);
  }
  const lid = group(root, 'MedicLid', [0, 1.14, -0.18]);
  shell(lid, [0, 0.08, 0.2], [0.74, 0.16, 0.48], p.accent, 0.3);
  strut(lid, [-0.14, 0.2, 0.2], [0.14, 0.2, 0.2], 0.024, p.alloy, 10);
  const defib = group(root, 'DefibUnit', [0, 0.44, 0.28]);
  shell(defib, [0, 0, 0], [0.42, 0.24, 0.14], p.dark, 0.26);
  box(defib, [0, 0.02, 0.078], [0.26, 0.1, 0.02], p.optic);
  if (detail) {
    for (const sx of [-0.14, 0.14]) box(defib, [sx, 0.14, 0.02], [0.08, 0.05, 0.08], p.accent);
  }
  root.animations = [new T.AnimationClip('Open triage lid', 2.8, [rotationTrack('MedicLid', 'x', [0, 0.75, 2.0, 2.8], [0, -1.4, -1.4, 0])])];
}

export function buildTacticalRadioPack(root: T.Group, p: Finish, detail: boolean) {
  const rad = group(root, 'RadioPackBody');
  addHarnessStand(rad, p, detail, 0.86, 0.72, 0.62);
  shell(rad, [0, 0.72, 0.02], [0.66, 0.78, 0.4], p.primary, 0.22);
  shell(rad, [0, 0.88, 0.24], [0.54, 0.26, 0.055], p.dark, 0.22);
  box(rad, [-0.12, 0.88, 0.275], [0.22, 0.14, 0.02], p.optic);
  for (const [dx, dy] of [[0.1, 0.92], [0.2, 0.92], [0.1, 0.82], [0.2, 0.82]] as const) {
    cyl(rad, [dx, dy, 0.278], 0.032, 0.036, 0.036, p.accent, 'z', 12);
  }
  for (let i = 0; i < (detail ? 5 : 3); i++) {
    box(rad, [0, 0.46 + i * 0.055, 0.235], [0.46, 0.024, 0.024], p.edge);
  }
  tube(rad, [-0.22, 1.16, 0], 0.048, 0.058, 0.16, p.accent, 12);
  const mast = group(root, 'RadioMast', [-0.22, 1.12, 0]);
  tube(mast, [0, 0.24, 0], 0.014, 0.026, 1.08, p.alloy, 10);
  orb(mast, [0, 0.79, 0], 0.028, p.accent, p.hd);
  const hs = group(root, 'RadioHandset', [0.39, 0.76, 0.04]);
  shell(hs, [0, 0, 0], [0.1, 0.34, 0.1], p.dark, 0.32);
  for (const sy of [-0.14, 0.14]) cyl(hs, [0.05, sy, 0], 0.055, 0.055, 0.07, p.tire, 'x', 12);
  hose(hs, [[0, -0.17, 0], [0.04, -0.32, 0.06], [-0.08, -0.28, 0.04]], 0.018, p.tire, p.hd);
  root.animations = [new T.AnimationClip('Extend radio mast', 2.8, [slideTrack('RadioMast', [-0.22, 1.12, 0], 1, [0, 0.75, 2.0, 2.8], [0, 0.34, 0.34, 0])])];
}

export function buildIridescentFairyWings(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'FairyStand');
  addPlinth(stand, p, detail, 0.86, 0.76, 0.12, 0.56);
  shell(stand, [0, 0.88, 0], [0.28, 0.52, 0.2], p.primary, 0.45);
  orb(stand, [0, 0.94, 0.11], 0.09, p.accent, p.hd);
  for (const [name, s] of [['FairyWingL', -1], ['FairyWingR', 1]] as const) {
    const wing = group(root, name, [s * 0.12, 0.94, 0]);
    const upper = orb(wing, [s * 0.52, 0.28, -0.04], 0.48, p.optic, p.hd, [1.15, 0.65, 0.1]);
    upper.rotation.z = s * 0.36;
    const lower = orb(wing, [s * 0.38, -0.22, -0.05], 0.34, p.primary, p.hd, [1.05, 0.58, 0.1]);
    lower.rotation.z = -s * 0.32;
    strut(wing, [0, 0, -0.02], [s * 0.92, 0.46, -0.04], 0.024, p.accent, 10);
    strut(wing, [0, 0, -0.02], [s * 0.64, -0.34, -0.05], 0.02, p.accent, 10);
    if (detail) {
      orb(wing, [s * 0.64, 0.34, 0.015], 0.085, p.accent, p.hd, [1, 1, 0.35]);
      orb(wing, [s * 0.46, -0.24, 0.005], 0.06, p.stencil, p.hd, [1, 1, 0.35]);
    }
  }
  root.animations = [new T.AnimationClip('Flutter fairy wings', 2.4, [
    rotationTrack('FairyWingL', 'y', [0, 0.6, 1.2, 1.8, 2.4], [0, -0.72, 0.12, -0.72, 0]),
    rotationTrack('FairyWingR', 'y', [0, 0.6, 1.2, 1.8, 2.4], [0, 0.72, -0.12, 0.72, 0]),
  ])];
}

export function buildSteampunkBoilerPack(root: T.Group, p: Finish, detail: boolean) {
  const boil = group(root, 'BoilerBody');
  addHarnessStand(boil, p, detail, 0.88, 0.74, 0.62);
  tube(boil, [0, 0.78, 0.04], 0.28, 0.28, 0.68, p.primary, 16);
  orb(boil, [0, 1.12, 0.04], 0.28, p.accent, p.hd, [1, 0.55, 1]);
  orb(boil, [0, 0.44, 0.04], 0.28, p.dark, p.hd, [1, 0.45, 1]);
  for (const y of [0.6, 0.94]) ring(boil, [0, y, 0.04], 0.305, 0.032, 0.055, p.accent);
  for (const sx of [-0.24, 0.24]) {
    tube(boil, [sx, 1.28, 0.02], 0.055, 0.068, 0.44, p.edge, 14);
    ring(boil, [sx, 1.5, 0.02], 0.072, 0.022, 0.04, p.accent);
  }
  const gear = group(root, 'BoilerGear', [0, 0.78, 0.35]);
  torus(gear, [0, 0, 0], 0.18, 0.032, p.accent, p.hd);
  cyl(gear, [0, 0, 0], 0.065, 0.065, 0.065, p.dark, 'z', 12);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(gear, [Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0], [0.055, 0.042, 0.04], p.accent).rotation.z = a;
    if (detail && i % 2 === 0) strut(gear, [0, 0, 0], [Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0], 0.018, p.alloy, 10);
  }
  const coal = group(root, 'CoalCanister', [0.34, 0.62, 0.04]);
  tube(coal, [0, 0, 0], 0.105, 0.105, 0.36, p.dark, 14);
  ring(coal, [0, 0.16, 0], 0.115, 0.02, 0.038, p.accent);
  root.animations = [new T.AnimationClip('Spin boiler flywheel', 2.4, [spinTrack('BoilerGear', 'z', 2.4, 2)])];
}

export function buildRangerQuiverHarness(root: T.Group, p: Finish, detail: boolean) {
  const rigG = group(root, 'QuiverRig');
  addHarnessStand(rigG, p, detail, 0.84, 0.72, 0.66);
  const qv = group(rigG, 'QuiverBody', [0, 0.78, 0.06]);
  qv.rotation.z = -0.3;
  tube(qv, [0, 0, 0], 0.175, 0.135, 0.82, p.primary, 16);
  for (const y of [-0.24, 0.28]) ring(qv, [0, y, 0], 0.182, 0.028, 0.055, p.accent);
  for (const [ax, az] of [[-0.06, -0.05], [0.06, -0.05], [-0.05, 0.05], [0.05, 0.05]] as const) {
    tube(qv, [ax, 0.56, az], 0.014, 0.014, 0.42, p.edge, 10);
    box(qv, [ax, 0.72, az], [0.075, 0.11, 0.016], p.stencil);
  }
  const hero = group(qv, 'HeroArrow', [0, 0.48, 0]);
  tube(hero, [0, 0.14, 0], 0.018, 0.018, 0.52, p.accent, 10);
  box(hero, [0, 0.36, 0], [0.09, 0.13, 0.018], p.accent);
  box(hero, [0, 0.36, 0], [0.018, 0.13, 0.09], p.stencil);
  const pouch = group(root, 'BeltPouch', [-0.28, 0.42, 0.12]);
  shell(pouch, [0, 0, 0], [0.24, 0.22, 0.18], p.accent, 0.3);
  if (detail) {
    hose(rigG, [[-0.22, 1.05, -0.14], [0, 0.86, 0.2], [0.22, 0.54, -0.14]], 0.028, p.dark, p.hd);
    box(pouch, [0, 0.04, 0.1], [0.075, 0.075, 0.024], p.alloy);
  }
  root.animations = [new T.AnimationClip('Draw hero arrow', 2.4, [slideTrack('HeroArrow', [0, 0.48, 0], 1, [0, 0.7, 1.7, 2.4], [0, 0.24, 0.24, 0])])];
}

export function buildVigilanteUtilityBelt(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'BeltStand');
  addPlinth(stand, p, detail, 0.84, 0.76, 0.12, 0.32);
  tube(stand, [0, 0.64, 0], 0.32, 0.3, 0.44, p.dark, 16);
  ring(stand, [0, 0.64, 0], 0.36, 0.055, 0.16, p.primary);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (Math.abs(Math.sin(a)) < 0.2 && Math.cos(a) > 0.8) continue;
    const pod = group(stand, '', [Math.sin(a) * 0.37, 0.64, Math.cos(a) * 0.37]);
    pod.rotation.y = a;
    if (i % 2 === 0) shell(pod, [0, 0, 0], [0.12, 0.18, 0.09], p.accent, 0.28);
    else tube(pod, [0, 0, 0], 0.045, 0.045, 0.19, p.accent, 12);
  }
  const pouch = group(root, 'GadgetPouch', [0, 0.72, 0.38]);
  shell(pouch, [0, -0.08, 0.03], [0.22, 0.18, 0.11], p.accent, 0.24);
  box(pouch, [0, -0.08, 0.095], [0.14, 0.075, 0.022], p.dark);
  const grap = group(root, 'BeltGrapple', [0.4, 0.62, 0.16]);
  tube(grap, [0.02, -0.06, 0], 0.048, 0.048, 0.22, p.alloy, 12);
  for (const s of [-1, 1]) cone(grap, [0.02 + s * 0.06, 0.06, 0], 0.028, 0.11, p.edge, p.hd, 8).rotation.z = -s * 0.5;
  if (detail) {
    for (const s of [-1, 1]) box(stand, [s * 0.16, 0.88, 0], [0.08, 0.08, 0.08], p.accent);
  }
  root.animations = [new T.AnimationClip('Open gadget pouch', 2.6, [rotationTrack('GadgetPouch', 'x', [0, 0.7, 1.8, 2.6], [0, -1.25, -1.25, 0])])];
}

export function buildCyberneticExoSpine(root: T.Group, p: Finish, detail: boolean) {
  const exo = group(root, 'ExoSpineBase');
  addPlinth(exo, p, detail, 0.86, 0.78, 0.12, 0.3);
  tube(exo, [0, 0.74, -0.02], 0.075, 0.095, 0.68, p.edge, 12);
  for (let i = 0; i < 5; i++) {
    const y = 0.42 + i * 0.13;
    shell(exo, [0, y, -0.02], [0.34 - i * 0.02, 0.1, 0.24], i % 2 === 0 ? p.primary : p.dark, 0.34);
    for (const s of [-1, 1]) {
      strut(exo, [s * 0.12, y, 0.02], [s * 0.36, y + 0.02, 0.18], 0.024, p.alloy, 10);
    }
  }
  const core = group(root, 'SpineCore', [0, 0.72, -0.15]);
  band(core, [0, 0, 0], 0.14, 0.032, 0.075, p.accent, 'z');
  cyl(core, [0, 0, 0], 0.095, 0.095, 0.055, p.optic, 'z', 14);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    box(core, [Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.02], [0.075, 0.028, 0.035], p.alloy).rotation.z = a;
  }
  const flex = group(root, 'ExoFlex', [0, 1.02, -0.02]);
  shell(flex, [0, 0.12, 0], [0.58, 0.28, 0.26], p.primary, 0.34);
  for (const s of [-1, 1]) {
    hose(flex, [[s * 0.22, 0.22, 0], [s * 0.36, 0.12, 0.16], [s * 0.28, -0.04, 0.22]], 0.028, p.accent, p.hd);
  }
  if (detail) {
    for (const s of [-1, 1]) hose(exo, [[s * 0.14, 0.44, -0.14], [s * 0.18, 0.74, -0.18], [s * 0.14, 1.04, -0.14]], 0.018, p.optic, p.hd);
  }
  root.animations = [
    new T.AnimationClip('Flex exo spine', 2.8, [rotationTrack('ExoFlex', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.38, 0, -0.32, 0])]),
    new T.AnimationClip('Spin neural core', 2.4, [spinTrack('SpineCore', 'z', 2.4, 2)]),
  ];
}

export function buildRoyalHeraldicCape(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'CapeStand');
  addPlinth(stand, p, detail, 0.92, 0.84, 0.12, 1.24);
  shell(stand, [0, 1.38, 0], [0.84, 0.26, 0.46], p.stencil, 0.46);
  shell(stand, [0, 0.88, -0.14], [0.76, 0.88, 0.18], p.primary, 0.32);
  for (const s of [-1, 1]) {
    shell(stand, [s * 0.36, 0.88, -0.04], [0.16, 0.86, 0.32], p.primary, 0.36);
    if (detail) box(stand, [s * 0.38, 0.88, 0.135], [0.06, 0.8, 0.02], p.accent);
  }
  const hem = group(root, 'CapeHem', [0, 0.48, -0.14]);
  shell(hem, [0, -0.16, -0.02], [0.86, 0.34, 0.2], p.primary, 0.32);
  shell(hem, [0, -0.32, -0.02], [0.88, 0.065, 0.22], p.accent, 0.32);
  const clasp = group(root, 'CapeClasp', [0, 1.34, 0.25]);
  for (const s of [-1, 1]) cyl(clasp, [s * 0.18, 0, 0], 0.075, 0.075, 0.045, p.accent, 'z', 14);
  hose(clasp, [[-0.18, 0, 0.015], [0, -0.09, 0.04], [0.18, 0, 0.015]], 0.02, p.accent, p.hd);
  orb(clasp, [0, -0.09, 0.048], 0.045, p.optic, p.hd);
  root.animations = [new T.AnimationClip('Billow royal cape', 2.8, [rotationTrack('CapeHem', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.42, 0.1, 0.42, 0])])];
}

export function buildFalconerArmoredGauntlet(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'GauntletStand');
  addPlinth(stand, p, detail, 0.84, 0.76, 0.12, 0.34);
  strut(stand, [-0.34, 0.44, 0], [0.34, 0.44, 0], 0.034, p.edge, 12);
  tube(stand, [0, 0.68, 0], 0.24, 0.18, 0.46, p.primary, 16);
  ring(stand, [0, 0.9, 0], 0.255, 0.032, 0.06, p.accent);
  shell(stand, [0, 1.06, 0], [0.34, 0.26, 0.22], p.primary, 0.34);
  for (let i = 0; i < 4; i++) {
    tube(stand, [-0.11 + i * 0.075, 1.24, 0.02], 0.032, 0.036, 0.18, p.alloy, 10);
  }
  tube(stand, [-0.2, 1.08, 0.06], 0.034, 0.038, 0.16, p.alloy, 10).rotation.z = 0.52;
  const guard = group(root, 'CuffGuard', [0, 0.88, 0.21]);
  shell(guard, [0, -0.14, 0.03], [0.3, 0.32, 0.08], p.accent, 0.34);
  orb(guard, [0, -0.14, 0.08], 0.075, p.primary, p.hd, [1, 1, 0.45]);
  const lure = group(root, 'HawkLure', [0.22, 0.66, 0.04]);
  torus(lure, [0.02, 0.06, 0], 0.055, 0.015, p.alloy, p.hd);
  shell(lure, [0.06, -0.12, 0], [0.1, 0.22, 0.16], p.accent, 0.38);
  if (detail) {
    for (const sx of [-0.12, 0.12]) fastener(guard, [sx, -0.04, 0.075], p, 0.02).rotation.x = HPI;
    box(lure, [0.12, -0.12, 0], [0.02, 0.14, 0.055], p.stencil);
  }
  root.animations = [new T.AnimationClip('Flex cuff guard', 2.6, [rotationTrack('CuffGuard', 'x', [0, 0.7, 1.8, 2.6], [0, -0.78, -0.78, 0])])];
}
