import * as T from 'three';
import {
  addPlinth, band, box, coil, cone, cyl, fastener, group, hollowBell, hose, HPI, orb,
  ring, rotationTrack, shell, slideTrack, solidLathe, spinTrack, strut, torus, tube,
  type Finish,
} from './handheld-tools-kit';

export function buildSurveyorTheodolite(root: T.Group, p: Finish, detail: boolean) {
  const tripod = group(root, 'TripodBase');
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const fx = Math.sin(a) * 0.48, fz = Math.cos(a) * 0.48;
    const tx = Math.sin(a) * 0.14, tz = Math.cos(a) * 0.14;
    tube(tripod, [fx, 0.035, fz], 0.036, 0.052, 0.07, p.tire, 10);
    strut(tripod, [fx, 0.05, fz], [tx, 1.04, tz], 0.032, p.accent, 10);
    strut(tripod, [fx * 0.55, 0.52, fz * 0.55], [0, 0.48, 0], 0.02, p.edge, 10);
    tube(tripod, [tx * 1.15, 1.09, tz * 1.15], 0.034, 0.034, 0.11, p.primary, 12);
    ring(tripod, [tx * 1.15, 1.09, tz * 1.15], 0.048, 0.014, 0.03, p.alloy);
  }
  tube(tripod, [0, 0.48, 0], 0.075, 0.075, 0.07, p.dark, 12);
  tube(tripod, [0, 1.04, 0], 0.22, 0.24, 0.055, p.dark, 14);
  tube(tripod, [0, 1.15, 0], 0.21, 0.21, 0.05, p.edge, 14);
  const yaw = group(root, 'TheodoliteYaw', [0, 1.19, 0]);
  ring(yaw, [0, 0.02, 0], 0.22, 0.032, 0.045, p.alloy);
  shell(yaw, [0, 0.08, 0], [0.36, 0.11, 0.26], p.primary, 0.24);
  for (const sx of [-0.15, 0.15]) {
    shell(yaw, [sx, 0.28, 0], [0.085, 0.36, 0.16], p.primary, 0.22);
    cyl(yaw, [sx * 1.24, 0.34, 0], 0.052, 0.052, 0.045, p.edge, 'x', 12);
  }
  cyl(yaw, [0.21, 0.34, 0], 0.105, 0.105, 0.035, p.stencil, 'x', 16);
  band(yaw, [0.215, 0.34, 0], 0.112, 0.018, 0.038, p.accent, 'x');
  const scope = group(yaw, 'SightScope', [0, 0.34, 0]);
  cyl(scope, [0, 0, 0], 0.036, 0.036, 0.38, p.alloy, 'x', 12);
  cyl(scope, [0, 0, 0.02], 0.078, 0.072, 0.48, p.accent, 'z', 16);
  cyl(scope, [0, 0, 0.31], 0.092, 0.082, 0.16, p.primary, 'z', 16);
  cyl(scope, [0, 0, 0.38], 0.072, 0.072, 0.03, p.optic, 'z', 16);
  cyl(scope, [0, 0, -0.26], 0.048, 0.062, 0.12, p.dark, 'z', 14);
  cyl(scope, [0, 0, -0.32], 0.036, 0.036, 0.028, p.optic, 'z', 12);
  if (detail) {
    box(scope, [0, 0.095, 0.04], [0.024, 0.04, 0.24], p.alloy);
    cyl(yaw, [0, 0.135, 0.11], 0.026, 0.026, 0.14, p.optic, 'x', 10);
    if (p.hd) for (const sx of [-0.15, 0.15]) fastener(yaw, [sx, 0.14, 0.085], p, 0.02).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Pan and sight', 3.2, [
    rotationTrack('TheodoliteYaw', 'y', [0, 0.8, 1.6, 2.4, 3.2], [0, 0.95, 0, -0.95, 0]),
    rotationTrack('SightScope', 'x', [0, 0.8, 1.6, 2.4, 3.2], [0, -0.52, 0.38, -0.25, 0]),
  ])];
}

export function buildBrassMarineSextant(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'SextantStand');
  addPlinth(stand, p, detail, 0.92, 0.76, 0.11, 0);
  shell(stand, [0, 0.125, 0], [0.76, 0.035, 0.6], p.accent, 0.2);
  for (const sx of [-0.24, 0.24]) {
    strut(stand, [sx, 0.13, 0], [sx * 0.9, 0.56, 0], 0.032, p.edge, 10);
    shell(stand, [sx * 0.9, 0.54, 0], [0.09, 0.06, 0.11], p.dark, 0.2);
  }
  const frame = group(root, 'SextantFrame', [0, 1.16, 0]);
  const arc = torus(frame, [0, 0, 0], 0.72, 0.034, p.primary, p.hd, Math.PI * 0.44);
  arc.rotation.z = -Math.PI * 0.72;
  const scaleArc = torus(frame, [0, 0, 0.024], 0.72, 0.016, p.stencil, p.hd, Math.PI * 0.41);
  scaleArc.rotation.z = -Math.PI * 0.705;
  for (const sx of [-0.45, 0.45]) strut(frame, [0, 0, 0], [sx, -0.56, 0], 0.032, p.primary, 10);
  strut(frame, [-0.28, -0.35, 0], [0.28, -0.35, 0], 0.026, p.primary, 10);
  strut(frame, [0, 0, 0], [0, -0.71, 0], 0.024, p.primary, 10);
  strut(frame, [-0.28, -0.35, 0], [0, -0.71, 0], 0.02, p.primary, 10);
  strut(frame, [0.28, -0.35, 0], [0, -0.71, 0], 0.02, p.primary, 10);
  cyl(frame, [0, 0, 0], 0.085, 0.085, 0.09, p.primary, 'z', 14);
  shell(frame, [0, -0.38, -0.14], [0.1, 0.34, 0.11], p.dark, 0.3);
  strut(frame, [0, -0.25, 0], [0, -0.25, -0.13], 0.024, p.primary, 10);
  strut(frame, [0, -0.5, 0], [0, -0.5, -0.13], 0.024, p.primary, 10);
  shell(frame, [-0.22, -0.24, 0.055], [0.1, 0.11, 0.06], p.edge, 0.18);
  box(frame, [-0.22, -0.24, 0.088], [0.065, 0.075, 0.02], p.optic);
  const scope = cyl(frame, [0.24, -0.26, 0.06], 0.044, 0.054, 0.34, p.accent, 'x', 14);
  scope.rotation.z = HPI + 0.18;
  cyl(frame, [0.08, -0.23, 0.06], 0.048, 0.048, 0.04, p.optic, 'x', 12);
  const arm = group(frame, 'IndexArm', [0, 0, 0.05]);
  cyl(arm, [0, 0, 0.015], 0.064, 0.064, 0.065, p.accent, 'z', 14);
  box(arm, [0, 0.01, 0.055], [0.09, 0.07, 0.022], p.optic);
  shell(arm, [0, -0.38, 0], [0.068, 0.76, 0.032], p.primary, 0.22);
  shell(arm, [0, -0.73, 0.01], [0.14, 0.11, 0.062], p.accent, 0.2);
  cyl(arm, [0.09, -0.74, 0.01], 0.032, 0.032, 0.08, p.alloy, 'x', 12);
  if (detail) {
    for (const [fx, fy] of [[-0.08, -0.12], [-0.14, -0.18]] as const) box(frame, [fx, fy, 0.065], [0.045, 0.065, 0.018], p.optic);
    cyl(frame, [0.4, -0.29, 0.06], 0.036, 0.044, 0.08, p.primary, 'x', 12);
  }
  root.animations = [new T.AnimationClip('Sweep index arm', 2.8, [
    rotationTrack('IndexArm', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.56, 0, -0.56, 0]),
  ])];
}

export function buildMegaphoneBullhorn(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'BullhornCradle');
  addPlinth(stand, p, detail, 0.86, 0.94, 0.1, 0);
  for (const [z, yTop, spread] of [[-0.24, 0.44, 0.12], [0.18, 0.42, 0.2]] as const) {
    for (const sx of [-spread, spread]) strut(stand, [sx, 0.09, z], [sx, yTop, z], 0.028, p.edge, 10);
    strut(stand, [-spread, yTop - 0.08, z], [spread, yTop - 0.08, z], 0.026, p.tire, 10);
  }
  const body = group(root, 'BullhornBody', [0, 0.58, 0.02]);
  const horn = hollowBell(body, [0, 0, -0.02], [[0.13, 0], [0.17, 0.18], [0.25, 0.38], [0.35, 0.58]], 0.028, p.primary, p.hd, 18);
  horn.rotation.x = HPI;
  torus(body, [0, 0, 0.56], 0.345, 0.03, p.tire, p.hd);
  cone(body, [0, 0, 0.2], 0.095, 0.24, p.accent, p.hd, 14).rotation.x = HPI;
  cyl(body, [0, 0, -0.18], 0.145, 0.135, 0.34, p.accent, 'z', 16);
  cyl(body, [0, 0, -0.36], 0.132, 0.112, 0.09, p.dark, 'z', 16);
  shell(body, [0, -0.28, -0.22], [0.095, 0.34, 0.12], p.dark, 0.28).rotation.x = -0.22;
  const trig = group(body, 'TriggerLever', [0, -0.14, -0.13]);
  shell(trig, [0, -0.06, 0.035], [0.048, 0.12, 0.065], p.primary, 0.22);
  strut(body, [0, -0.11, -0.16], [0, -0.28, -0.09], 0.016, p.edge, 10);
  strut(body, [0, -0.28, -0.09], [0, -0.32, -0.2], 0.016, p.edge, 10);
  coil(body, [0, -0.14, -0.32], [0, -0.18, -0.44], 4, 0.032, 0.012, p.tire, p.hd);
  strut(body, [0, -0.02, -0.36], [0, -0.02, -0.46], 0.028, p.edge, 10);
  const mic = group(body, 'MicHandset', [0, -0.02, -0.46]);
  shell(mic, [0, -0.06, -0.05], [0.13, 0.22, 0.1], p.accent, 0.28);
  cyl(mic, [0, -0.02, -0.105], 0.052, 0.052, 0.024, p.dark, 'z', 12);
  box(mic, [-0.072, -0.05, -0.04], [0.028, 0.08, 0.045], p.primary);
  if (detail) {
    hose(body, [[-0.08, 0.13, -0.26], [0, 0.22, -0.14], [0.08, 0.13, -0.04]], 0.018, p.dark, p.hd);
    for (const z of [-0.24, -0.18, -0.12]) band(body, [0, 0, z], 0.152, 0.012, 0.02, p.primary, 'z');
  }
  root.animations = [new T.AnimationClip('Broadcast call', 2.6, [
    rotationTrack('MicHandset', 'x', [0, 0.65, 1.3, 1.95, 2.6], [0, -0.48, 0, 0.42, 0]),
    rotationTrack('TriggerLever', 'x', [0, 0.5, 1.3, 1.9, 2.6], [0, -0.42, 0, -0.42, 0]),
  ])];
}

export function buildTravelGramophone(root: T.Group, p: Finish, detail: boolean) {
  const cab = group(root, 'GramophoneCase');
  for (const sx of [-0.38, 0.38]) for (const sz of [-0.34, 0.34]) tube(cab, [sx, 0.025, sz], 0.042, 0.048, 0.05, p.accent, 10);
  shell(cab, [0, 0.22, 0], [0.92, 0.36, 0.84], p.primary, 0.14);
  shell(cab, [0, 0.405, 0], [0.8, 0.032, 0.72], p.dark, 0.12);
  for (const sx of [-0.45, 0.45]) for (const sz of [-0.41, 0.41]) box(cab, [sx, 0.22, sz], [0.055, 0.32, 0.055], p.accent);
  hose(cab, [[-0.14, 0.22, 0.42], [-0.14, 0.22, 0.5], [0.14, 0.22, 0.5], [0.14, 0.22, 0.42]], 0.022, p.tire, p.hd);
  cyl(cab, [0.49, 0.22, 0.04], 0.024, 0.024, 0.1, p.accent, 'x', 10);
  strut(cab, [0.53, 0.22, 0.04], [0.53, 0.34, 0.14], 0.018, p.accent, 10);
  cyl(cab, [0.58, 0.34, 0.14], 0.026, 0.024, 0.1, p.dark, 'x', 10);
  const platter = group(root, 'TurntablePlatter', [-0.04, 0.435, 0.05]);
  tube(platter, [0, 0, 0], 0.32, 0.33, 0.042, p.alloy, 20);
  tube(platter, [0, 0.028, 0], 0.305, 0.305, 0.02, p.tire, 20);
  tube(platter, [0, 0.042, 0], 0.1, 0.1, 0.018, p.accent, 16);
  tube(platter, [0, 0.065, 0], 0.014, 0.014, 0.06, p.alloy, 10);
  box(platter, [0.055, 0.054, 0], [0.055, 0.01, 0.016], p.stencil);
  const arm = group(root, 'ToneArm', [0.3, 0.46, -0.22]);
  tube(arm, [0, 0, 0], 0.055, 0.068, 0.1, p.accent, 12);
  hose(arm, [[0, 0.05, 0], [-0.04, 0.09, 0.12], [-0.14, 0.08, 0.26], [-0.21, 0.05, 0.33]], 0.018, p.accent, p.hd);
  cyl(arm, [-0.22, 0.035, 0.34], 0.048, 0.048, 0.036, p.accent, 'x', 14);
  cyl(arm, [-0.24, 0.035, 0.34], 0.036, 0.036, 0.016, p.stencil, 'x', 12);
  tube(cab, [-0.25, 0.5, -0.26], 0.068, 0.088, 0.2, p.dark, 14);
  const horn = group(root, 'GramophoneHorn', [-0.25, 0.62, -0.26]);
  hose(horn, [[0, -0.05, 0], [0, 0.16, -0.02], [0.08, 0.28, 0.1]], 0.052, p.accent, p.hd);
  const bell = hollowBell(horn, [0.08, 0.28, 0.1], [[0.065, 0], [0.12, 0.18], [0.24, 0.38], [0.37, 0.54]], 0.024, p.accent, p.hd, 18);
  bell.rotation.set(0.95, 0, -0.28);
  if (detail) {
    box(cab, [0, 0.35, 0.425], [0.12, 0.065, 0.028], p.accent);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      strut(bell, [Math.cos(a) * 0.08, 0.06, Math.sin(a) * 0.08], [Math.cos(a) * 0.35, 0.51, Math.sin(a) * 0.35], 0.012, p.primary, 10);
    }
  }
  root.animations = [new T.AnimationClip('Play vinyl record', 3, [
    spinTrack('TurntablePlatter', 'y', 3, 2),
    rotationTrack('ToneArm', 'y', [0, 0.75, 1.5, 2.25, 3], [0, -0.34, 0.22, -0.18, 0]),
  ])];
}

export function buildSolidbodyElectricGuitar(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'GuitarStand');
  for (const sx of [-0.36, 0.36]) {
    for (const sz of [-0.34, 0.32]) {
      tube(stand, [sx, 0.03, sz], 0.038, 0.044, 0.06, p.tire, 10);
      strut(stand, [sx, 0.04, sz], [sx * 0.5, 0.66, -0.12], 0.026, p.dark, 10);
    }
    strut(stand, [sx * 0.78, 0.2, 0.16], [sx * 0.78, 0.26, 0.3], 0.028, p.tire, 10);
  }
  strut(stand, [-0.26, 0.22, 0.16], [0.26, 0.22, 0.16], 0.026, p.edge, 10);
  strut(stand, [-0.18, 0.66, -0.12], [0.18, 0.66, -0.12], 0.026, p.edge, 10);
  const body = group(root, 'GuitarBody', [0, 0.24, 0.06]);
  shell(body, [0, 0.22, 0], [0.58, 0.36, 0.11], p.primary, 0.42);
  shell(body, [0, 0.44, 0], [0.38, 0.24, 0.105], p.primary, 0.34);
  orb(body, [-0.19, 0.59, 0], 0.12, p.primary, p.hd, [0.85, 1.3, 0.48]);
  orb(body, [0.18, 0.54, 0], 0.11, p.primary, p.hd, [0.82, 1.05, 0.48]);
  shell(body, [0.02, 0.36, 0.056], [0.34, 0.38, 0.024], p.accent, 0.34);
  for (const y of [0.28, 0.44]) {
    box(body, [0, y, 0.072], [0.18, 0.065, 0.028], p.dark);
    box(body, [0, y, 0.088], [0.14, 0.018, 0.012], p.alloy);
  }
  box(body, [0, 0.16, 0.07], [0.2, 0.075, 0.034], p.alloy);
  for (const [kx, ky] of [[0.14, 0.2], [0.18, 0.12]] as const) cyl(body, [kx, ky, 0.075], 0.026, 0.03, 0.035, p.alloy, 'z', 12);
  shell(body, [0, 0.96, 0.015], [0.115, 0.92, 0.062], p.accent, 0.2);
  box(body, [0, 0.98, 0.05], [0.098, 0.88, 0.022], p.dark);
  shell(body, [-0.02, 1.54, 0.01], [0.16, 0.3, 0.055], p.primary, 0.28);
  for (let i = 0; i < 6; i++) cyl(body, [-0.115, 1.43 + i * 0.042, 0.01], 0.014, 0.014, 0.07, p.alloy, 'x', 10);
  const whammy = group(body, 'WhammyBar', [0.09, 0.16, 0.085]);
  cyl(whammy, [0, 0, 0.02], 0.018, 0.018, 0.05, p.alloy, 'z', 10);
  hose(whammy, [[0, 0, 0.03], [0.02, -0.02, 0.12], [0.06, -0.14, 0.14]], 0.01, p.alloy, p.hd);
  cyl(whammy, [0.06, -0.15, 0.14], 0.016, 0.016, 0.05, p.accent, 'y', 10);
  if (detail) {
    for (const x of [-0.032, -0.016, 0, 0.016, 0.032]) strut(body, [x, 0.17, 0.092], [x * 0.8, 1.44, 0.068], 0.004, p.alloy, 10);
    for (let i = 0; i < 6; i++) box(body, [0, 0.62 + i * 0.13, 0.064], [0.1, 0.01, 0.012], p.alloy);
  }
  root.animations = [new T.AnimationClip('Strum & divebomb', 2.8, [
    rotationTrack('GuitarBody', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.14, 0, -0.14, 0]),
    rotationTrack('WhammyBar', 'x', [0, 0.6, 1.4, 2.1, 2.8], [0, 0.38, -0.26, 0.22, 0]),
  ])];
}

export function buildConcertViolinBow(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'LuthierStand');
  addPlinth(stand, p, detail, 0.78, 0.74, 0.11, 0);
  for (const sx of [-0.18, 0.18]) {
    strut(stand, [sx, 0.1, 0.06], [sx, 0.34, 0.06], 0.026, p.dark, 10);
    shell(stand, [sx, 0.34, 0.06], [0.075, 0.06, 0.12], p.tire, 0.24);
  }
  strut(stand, [0, 0.1, -0.16], [0, 1.18, -0.16], 0.032, p.dark, 12);
  strut(stand, [0, 1.16, -0.16], [0, 1.16, 0.01], 0.026, p.edge, 10);
  const v = group(root, 'ViolinBody', [0, 0.26, 0.04]);
  orb(v, [0, 0.24, 0], 0.25, p.primary, p.hd, [1.05, 0.85, 0.36]);
  shell(v, [0, 0.44, 0], [0.28, 0.24, 0.13], p.primary, 0.26);
  orb(v, [0, 0.62, 0], 0.2, p.primary, p.hd, [1.02, 0.85, 0.38]);
  shell(v, [-0.13, 0.13, 0.085], [0.16, 0.12, 0.045], p.accent, 0.34);
  shell(v, [0, 0.2, 0.092], [0.072, 0.2, 0.026], p.accent, 0.22);
  box(v, [0, 0.42, 0.095], [0.11, 0.055, 0.024], p.stencil);
  shell(v, [0, 0.94, 0.015], [0.068, 0.48, 0.055], p.primary, 0.22);
  box(v, [0, 0.8, 0.075], [0.074, 0.56, 0.026], p.accent);
  shell(v, [0, 1.24, 0.01], [0.074, 0.18, 0.062], p.primary, 0.2);
  torus(v, [0, 1.35, -0.01], 0.048, 0.022, p.primary, p.hd);
  for (const [sx, y] of [[-0.065, 1.2], [0.065, 1.24], [-0.065, 1.28], [0.065, 1.31]] as const) {
    cyl(v, [sx, y, 0.01], 0.014, 0.014, 0.08, p.accent, 'x', 10);
  }
  const bow = group(v, 'ViolinBow', [0, 0.46, 0.125]);
  strut(bow, [-0.52, 0, 0.025], [0.52, 0, 0.025], 0.013, p.primary, 10);
  box(bow, [0, 0, -0.005], [0.98, 0.02, 0.014], p.stencil);
  shell(bow, [-0.46, 0, 0.01], [0.12, 0.05, 0.04], p.accent, 0.22);
  cyl(bow, [-0.55, 0, 0.025], 0.018, 0.018, 0.05, p.alloy, 'x', 10);
  box(bow, [0.51, 0, 0.01], [0.045, 0.042, 0.036], p.stencil);
  if (detail) {
    for (const sx of [-0.1, 0.1]) box(v, [sx, 0.42, 0.088], [0.022, 0.14, 0.016], p.inset).rotation.z = sx < 0 ? 0.18 : -0.18;
    for (const x of [-0.022, -0.007, 0.007, 0.022]) strut(v, [x, 0.26, 0.11], [x * 0.7, 1.14, 0.09], 0.004, p.alloy, 10);
  }
  root.animations = [new T.AnimationClip('Draw violin bow', 2.8, [
    rotationTrack('ViolinBow', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.36, 0, -0.36, 0]),
  ])];
}

export function buildDiatonicButtonAccordion(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'AccordionCradle');
  addPlinth(stand, p, detail, 0.98, 0.74, 0.11, 0);
  for (const sx of [-0.32, 0.32]) shell(stand, [sx, 0.14, 0], [0.26, 0.06, 0.56], p.tire, 0.2);
  const bass = group(root, 'AccordionLeft');
  shell(bass, [-0.34, 0.51, 0], [0.24, 0.72, 0.46], p.primary, 0.2);
  for (const y of [0.22, 0.8]) shell(bass, [-0.34, y, 0], [0.26, 0.065, 0.48], p.accent, 0.22);
  hose(bass, [[-0.46, 0.24, -0.08], [-0.53, 0.51, -0.08], [-0.46, 0.78, -0.08]], 0.026, p.tire, p.hd);
  for (let i = 0; i < 6; i++) cyl(bass, [-0.465, 0.3 + i * 0.08, 0.08], 0.018, 0.018, 0.032, p.stencil, 'x', 10);
  for (let i = 0; i < 6; i++) {
    const x = -0.2 + i * 0.072;
    shell(bass, [x, 0.51, 0], [0.062, 0.64, 0.41], i % 2 === 0 ? p.dark : p.accent, 0.14);
  }
  shell(bass, [0.02, 0.51, 0], [0.48, 0.52, 0.32], p.dark, 0.12);
  const slide = group(root, 'AccordionSlide', [0.26, 0.51, 0]);
  shell(slide, [-0.18, 0, 0], [0.36, 0.48, 0.28], p.edge, 0.12);
  shell(slide, [0.06, 0, 0], [0.26, 0.74, 0.48], p.primary, 0.2);
  for (const y of [-0.3, 0.3]) shell(slide, [0.06, y, 0], [0.28, 0.065, 0.5], p.accent, 0.22);
  shell(slide, [0.06, 0, 0.25], [0.2, 0.58, 0.04], p.accent, 0.22);
  shell(slide, [0.2, 0, 0.08], [0.07, 0.66, 0.2], p.primary, 0.2);
  for (let i = 0; i < 8; i++) {
    cyl(slide, [0.245, -0.24 + i * 0.068, 0.11], 0.018, 0.018, 0.032, p.stencil, 'x', 10);
    cyl(slide, [0.245, -0.2 + i * 0.068, 0.04], 0.018, 0.018, 0.032, p.accent, 'x', 10);
  }
  if (detail) {
    for (let i = 0; i < 5; i++) box(slide, [0.06, -0.2 + i * 0.1, 0.275], [0.14, 0.028, 0.018], p.inset);
    for (const sz of [-0.22, 0.22]) box(bass, [0, 0.82, sz], [0.16, 0.055, 0.025], p.alloy);
  }
  root.animations = [new T.AnimationClip('Pump bellows', 2.8, [
    slideTrack('AccordionSlide', [0.26, 0.51, 0], 0, [0, 0.7, 1.4, 2.1, 2.8], [0, 0.2, 0.04, 0.2, 0]),
  ])];
}

export function buildBrassBlowtorch(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'BlowtorchBody');
  shell(b, [0, 0.045, 0], [0.8, 0.09, 0.76], p.accent, 0.22);
  ring(b, [0, 0.11, 0], 0.25, 0.032, 0.045, p.dark);
  solidLathe(b, [0, 0.08, 0], [[0.23, 0], [0.23, 0.52], [0.2, 0.62], [0.11, 0.69]], p.primary, p.hd, 18);
  ring(b, [0, 0.13, 0], 0.24, 0.018, 0.03, p.edge);
  ring(b, [0, 0.56, 0], 0.238, 0.018, 0.03, p.edge);
  strut(b, [-0.21, 0.56, 0], [-0.38, 0.62, 0], 0.024, p.edge, 10);
  strut(b, [-0.21, 0.22, 0], [-0.34, 0.26, 0], 0.024, p.edge, 10);
  strut(b, [-0.38, 0.62, 0], [-0.34, 0.24, 0], 0.042, p.tire, 12);
  cyl(b, [0.28, 0.38, 0], 0.056, 0.062, 0.24, p.edge, 'x', 14);
  const pump = group(root, 'PumpPlunger', [0.36, 0.38, 0]);
  cyl(pump, [-0.04, 0, 0], 0.024, 0.024, 0.3, p.alloy, 'x', 12);
  cyl(pump, [0.12, 0, 0], 0.032, 0.032, 0.22, p.accent, 'z', 12);
  tube(b, [0, 0.89, 0], 0.056, 0.072, 0.32, p.primary, 14);
  ring(b, [0, 0.84, 0], 0.11, 0.026, 0.045, p.dark);
  cyl(b, [0, 1.04, 0.1], 0.078, 0.062, 0.44, p.primary, 'z', 16);
  const noz = hollowBell(b, [0, 1.04, 0.24], [[0.068, 0], [0.088, 0.22]], 0.022, p.accent, p.hd, 16);
  noz.rotation.x = HPI;
  cyl(b, [0, 1.04, 0.38], 0.042, 0.042, 0.06, p.optic, 'z', 12);
  tube(b, [0, 1.15, -0.06], 0.026, 0.03, 0.18, p.alloy, 12);
  const wheel = group(root, 'ValveWheel', [0, 1.24, -0.06]);
  torus(wheel, [0, 0, 0], 0.115, 0.022, p.dark, p.hd).rotation.x = HPI;
  tube(wheel, [0, 0, 0], 0.036, 0.036, 0.04, p.primary, 12);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    strut(wheel, [0, 0, 0], [Math.cos(a) * 0.11, 0, Math.sin(a) * 0.11], 0.014, p.accent, 10);
  }
  if (detail) {
    cyl(b, [0, 0.36, 0.225], 0.072, 0.072, 0.026, p.stencil, 'z', 14);
    for (const z of [0.16, 0.24]) ring(b, [0, 1.04, z], 0.084, 0.014, 0.024, p.edge).rotation.x = HPI;
    if (p.hd) for (const sx of [-0.32, 0.32]) fastener(b, [sx, 0.095, 0.3], p, 0.022);
  }
  root.animations = [new T.AnimationClip('Pump & open valve', 2.8, [
    slideTrack('PumpPlunger', [0.36, 0.38, 0], 0, [0, 0.7, 1.4, 2.1, 2.8], [0, 0.14, 0, 0.14, 0]),
    spinTrack('ValveWheel', 'y', 2.8, 2),
  ])];
}

export function buildCordlessCircularSaw(root: T.Group, p: Finish, detail: boolean) {
  const dock = group(root, 'SawDock');
  shell(dock, [0, 0.055, 0], [0.96, 0.11, 0.78], p.dark, 0.2);
  shell(dock, [0.02, 0.135, 0], [0.76, 0.045, 0.62], p.alloy, 0.16);
  box(dock, [0.34, 0.23, 0.14], [0.08, 0.16, 0.04], p.edge);
  const saw = group(root, 'SawHousing', [0, 0.44, 0]);
  cyl(saw, [-0.04, 0.04, -0.14], 0.16, 0.16, 0.36, p.primary, 'z', 16);
  cyl(saw, [-0.04, 0.04, -0.33], 0.145, 0.135, 0.05, p.accent, 'z', 16);
  hose(saw, [[-0.38, -0.06, -0.1], [-0.36, 0.34, -0.1], [-0.08, 0.38, -0.06], [0.16, 0.22, 0.02]], 0.046, p.accent, p.hd);
  shell(saw, [-0.2, 0.36, -0.08], [0.22, 0.08, 0.09], p.tire, 0.28);
  shell(saw, [-0.4, -0.1, -0.1], [0.26, 0.22, 0.24], p.accent, 0.18);
  box(saw, [-0.4, 0.02, -0.1], [0.2, 0.055, 0.18], p.primary);
  orb(saw, [0.24, 0.28, -0.06], 0.072, p.accent, p.hd);
  strut(saw, [0.2, 0.14, -0.06], [0.24, 0.26, -0.06], 0.032, p.edge, 10);
  const shroud = torus(saw, [0.04, 0.02, 0.18], 0.25, 0.052, p.primary, p.hd, Math.PI * 1.15);
  shroud.rotation.z = -0.15;
  cyl(saw, [0.04, 0.02, 0.13], 0.095, 0.095, 0.16, p.edge, 'z', 14);
  const blade = group(saw, 'SawBlade', [0.04, 0.02, 0.19]);
  cyl(blade, [0, 0, 0], 0.26, 0.26, 0.022, p.alloy, 'z', 24);
  cyl(blade, [0, 0, 0.018], 0.065, 0.065, 0.035, p.dark, 'z', 12);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12;
    box(blade, [Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0], [0.045, 0.024, 0.024], p.edge).rotation.z = a + 0.35;
  }
  const guard = group(saw, 'BladeGuard', [0.04, 0.02, 0.225]);
  const gArc = torus(guard, [0, 0, 0], 0.27, 0.03, p.accent, p.hd, Math.PI * 0.9);
  gArc.rotation.z = -Math.PI * 0.95;
  box(guard, [0.25, -0.06, 0.035], [0.08, 0.04, 0.04], p.primary);
  if (detail) {
    for (const y of [-0.04, 0.04, 0.12]) box(saw, [-0.14, y, -0.35], [0.16, 0.024, 0.018], p.inset);
    box(saw, [-0.535, -0.1, -0.1], [0.02, 0.06, 0.12], p.optic);
  }
  root.animations = [new T.AnimationClip('Rip cut spin', 2.6, [
    spinTrack('SawBlade', 'z', 2.6, 2),
    rotationTrack('BladeGuard', 'z', [0, 0.65, 1.85, 2.6], [0, -0.85, -0.85, 0]),
  ])];
}

export function buildMasterWrenchRack(root: T.Group, p: Finish, detail: boolean) {
  const rack = group(root, 'WrenchRack');
  shell(rack, [0, 0.055, 0], [1.08, 0.11, 0.74], p.dark, 0.18);
  for (const sx of [-0.48, 0.48]) {
    strut(rack, [sx, 0.09, 0.12], [sx, 1.18, -0.18], 0.03, p.edge, 10);
    strut(rack, [sx, 0.09, -0.28], [sx, 1.18, -0.18], 0.026, p.edge, 10);
  }
  const board = shell(rack, [0, 0.68, -0.04], [0.92, 1.02, 0.075], p.primary, 0.12);
  board.rotation.x = -0.26;
  const wrenches: readonly [number, number, number][] = [[-0.36, 0.74, 0.64], [-0.19, 0.84, 0.72], [0.19, 0.84, 0.72], [0.36, 0.74, 0.64]];
  for (const [wx, wy, len] of wrenches) {
    const wz = 0.04 - (wy - 0.68) * 0.26;
    cyl(rack, [wx, wy, wz - 0.02], 0.018, 0.018, 0.12, p.edge, 'z', 10);
    shell(rack, [wx, wy - len * 0.45, wz + 0.04], [0.055, len, 0.028], p.alloy, 0.22);
    band(rack, [wx, wy - len + 0.02, wz + 0.04], 0.068, 0.022, 0.032, p.alloy, 'z');
    for (const sx of [-0.036, 0.036]) box(rack, [wx + sx, wy + 0.06, wz + 0.04], [0.026, 0.09, 0.03], p.alloy);
  }
  cyl(rack, [0, 0.94, -0.04], 0.024, 0.024, 0.16, p.edge, 'z', 10);
  const ratchet = group(root, 'CenterRatchet', [0, 0.94, 0.05]);
  cyl(ratchet, [0, 0, 0], 0.072, 0.072, 0.055, p.alloy, 'z', 14);
  cyl(ratchet, [0, 0, 0.035], 0.032, 0.032, 0.032, p.dark, 'z', 12);
  shell(ratchet, [0, -0.26, 0], [0.056, 0.44, 0.032], p.alloy, 0.22);
  shell(ratchet, [0, -0.56, 0], [0.088, 0.26, 0.062], p.accent, 0.28);
  shell(ratchet, [0, -0.56, 0], [0.094, 0.12, 0.068], p.tire, 0.28);
  const tray = group(root, 'SocketTray', [0, 0.135, 0.22]);
  shell(tray, [0, 0, 0], [0.72, 0.055, 0.2], p.accent, 0.2);
  for (let i = 0; i < 6; i++) {
    const r = 0.028 + i * 0.004;
    const h = 0.085 + i * 0.01;
    tube(tray, [-0.25 + i * 0.1, h * 0.5 + 0.02, 0], r, r * 1.05, h, p.alloy, 12);
    tube(tray, [-0.25 + i * 0.1, h + 0.022, 0], r * 0.58, r * 0.58, 0.016, p.inset, 10);
  }
  if (detail) {
    box(rack, [0, 1.12, -0.11], [0.62, 0.085, 0.03], p.stencil);
    for (const sx of [-0.42, 0.42]) fastener(rack, [sx, 0.115, 0.28], p, 0.022);
  }
  root.animations = [new T.AnimationClip('Swing ratchet', 2.6, [
    rotationTrack('CenterRatchet', 'z', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.66, 0, -0.66, 0]),
  ])];
}
