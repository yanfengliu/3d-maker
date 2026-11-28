import * as T from 'three';
import {
  boltRing, box, closedDish, cyl, deg, displayUnit, fastener, glowMat, group, hexSlab, holoMat,
  hose, HPI, orb, radLoop, ringBand, rotationTrack, shell, spinTrack, strut, torus, type Finish,
} from './scifi-stations-kit';

export function buildMagneticGravityAnchor(root: T.Group, p: Finish, detail: boolean) {
  const anc = group(root, 'GravityAnchor'), flux = glowMat('#ffd042', 0.92, 'Grav flux core');
  radLoop(3, (_, sx, sz) => {
    hexSlab(anc, [sx * 0.64, 0.08, sz * 0.64], 0.28, 0.16, p.dark, p.hd);
    cyl(anc, [sx * 0.62, 0.18, sz * 0.62], 0.14, 0.18, 0.1, p.accent, p.hd);
    strut(anc, [sx * 0.6, 0.18, sz * 0.6], [sx * 0.24, 0.54, sz * 0.24], 0.072, p.primary, p.hd ? 14 : 6);
    strut(anc, [sx * 0.52, 0.22, sz * 0.52], [sx * 0.34, 0.72, sz * 0.34], 0.032, p.alloy, p.hd ? 10 : 6);
  });
  hexSlab(anc, [0, 0.52, 0], 0.42, 0.24, p.edge, p.hd);
  cyl(anc, [0, 0.88, 0], 0.34, 0.38, 0.54, p.primary, p.hd, 'y', 10, 28);
  for (const fy of [0.72, 0.88, 1.04]) ringBand(anc, [0, fy, 0], 0.41, 0.06, 0.065, fy === 0.88 ? flux : p.accent, p.hd);
  for (const s of [-1, 1]) {
    strut(anc, [s * 0.28, 1.08, 0], [s * 0.64, 1.24, 0], 0.064, p.edge, p.hd ? 12 : 6);
    shell(anc, [s * 0.64, 1.64, 0], [0.16, 0.86, 0.24], p.primary, 0.22);
  }
  shell(anc, [0, 2.08, 0], [1.42, 0.14, 0.28], p.dark, 0.24);
  cyl(anc, [0, 1.6, 0], 0.052, 0.052, 0.98, p.alloy, p.hd);
  const outer = group(root, 'OuterGyroRing', [0, 1.6, 0]);
  torus(outer, [0, 0, 0], 0.46, 0.052, p.primary, p.hd, 'z');
  for (const sy of [-0.46, 0.46]) cyl(outer, [0, sy, 0], 0.095, 0.095, 0.12, p.edge, p.hd);
  for (const sx of [-0.46, 0.46]) shell(outer, [sx, 0, 0], [0.12, 0.16, 0.16], p.accent, 0.24);
  const inner = group(root, 'InnerGyroRing', [0, 1.6, 0]);
  torus(inner, [0, 0, 0], 0.3, 0.04, p.accent, p.hd, 'x');
  for (const sy of [-0.3, 0.3]) cyl(inner, [0, sy, 0], 0.075, 0.075, 0.1, p.alloy, p.hd);
  orb(inner, [0, 0, 0], 0.14, flux, p.hd);
  const cap = group(root, 'TopBeaconCap', [0, 2.15, 0]);
  cyl(cap, [0, 0.06, 0], 0.14, 0.18, 0.12, p.edge, p.hd);
  orb(cap, [0, 0.16, 0], 0.09, flux, p.hd);
  if (detail) {
    boltRing(anc, 0, 0.65, 0, 0.36, 6, p);
    for (const s of [-1, 1]) hose(anc, [[s * 0.36, 0.72, 0.16], [s * 0.56, 0.94, 0.24], [s * 0.62, 1.3, 0.1]], 0.024, p.tire, p.hd);
    if (p.hd) for (const s of [-0.52, 0.52]) fastener(anc, [s, 2.16, 0], p, 0.028);
  }
  root.animations = [new T.AnimationClip('Stabilize grav field', 3.6, [spinTrack('OuterGyroRing', 'y', 3.6, 1), spinTrack('InnerGyroRing', 'y', 3.6, -2)])];
}

export function buildSubspaceCommsDish(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'CommsPlinth'), feedGlow = glowMat('#ff7a33', 0.92, 'Subspace feed');
  hexSlab(base, [0, 0.22, 0], 0.72, 0.44, p.dark, p.hd);
  hexSlab(base, [0, 0.5, 0], 0.56, 0.16, p.primary, p.hd);
  radLoop(6, (_, sx, sz) => { strut(base, [sx * 0.7, 0.12, sz * 0.7], [sx * 0.52, 0.48, sz * 0.52], 0.044, p.edge, p.hd ? 10 : 6); });
  const txBox = group(root, 'TransceiverBox', [0.64, 0.28, 0]);
  shell(txBox, [0.06, 0, 0], [0.24, 0.34, 0.44], p.edge, 0.22);
  box(txBox, [0.19, 0.05, 0], [0.03, 0.12, 0.28], p.accent);
  const az = group(root, 'AzimuthTurret', [0, 0.58, 0]);
  cyl(az, [0, 0.08, 0], 0.42, 0.46, 0.18, p.edge, p.hd);
  shell(az, [0, 0.36, -0.04], [0.76, 0.44, 0.74], p.primary, 0.24);
  for (const s of [-1, 1]) {
    shell(az, [s * 0.38, 0.74, 0], [0.14, 0.52, 0.28], p.dark, 0.22);
    strut(az, [s * 0.28, 0.56, -0.26], [s * 0.34, 0.86, -0.06], 0.042, p.alloy, p.hd ? 12 : 6);
  }
  const el = group(az, 'DishElevation', [0, 0.9, 0.02]);
  cyl(el, [0, 0, 0], 0.09, 0.09, 0.88, p.alloy, p.hd, 'x');
  const dishTilt = group(el, '', [0, 0.06, 0.08]);
  dishTilt.rotation.x = 0.62;
  cyl(dishTilt, [0, 0.08, 0], 0.34, 0.22, 0.22, p.dark, p.hd);
  closedDish(dishTilt, [0, 0.16, 0], 0.84, 0.34, 0.06, p.primary, p.hd);
  torus(dishTilt, [0, 0.5, 0], 0.84, 0.032, p.accent, p.hd, 'y');
  cyl(dishTilt, [0, 0.58, 0], 0.055, 0.085, 0.68, p.edge, p.hd);
  radLoop(3, (_, sx, sz) => { strut(dishTilt, [sx * 0.58, 0.34, sz * 0.58], [sx * 0.06, 0.92, sz * 0.06], 0.022, p.alloy, p.hd ? 10 : 6); });
  cyl(dishTilt, [0, 0.94, 0], 0.12, 0.08, 0.14, p.accent, p.hd);
  orb(dishTilt, [0, 1.04, 0], 0.095, feedGlow, p.hd);
  if (detail) {
    boltRing(base, 0, 0.59, 0, 0.48, 6, p);
    radLoop(6, (_, sx, sz) => { strut(dishTilt, [sx * 0.26, 0.14, sz * 0.26], [sx * 0.72, 0.4, sz * 0.72], 0.02, p.edge, p.hd ? 10 : 6); });
    if (p.hd) ringBand(dishTilt, [0, 0.84, 0], 0.16, 0.03, 0.04, p.alloy, true);
  }
  root.animations = [new T.AnimationClip('Sweep subspace band', 4.4, [
    spinTrack('AzimuthTurret', 'y', 4.4, 1),
    rotationTrack('DishElevation', 'x', [0, 1.1, 2.2, 3.3, 4.4], [0, deg(-28), deg(18), deg(-22), 0]),
  ])];
}

export function buildQuantumTeleporterPad(root: T.Group, p: Finish, detail: boolean) {
  const pad = group(root, 'TeleporterDais'), phase = glowMat('#4ce2ff', 0.95, 'Quantum phase');
  cyl(pad, [0, 0.08, 0], 1.02, 1.08, 0.16, p.dark, p.hd, 'y', 12, 32);
  cyl(pad, [0, 0.2, 0], 0.86, 0.92, 0.12, p.primary, p.hd, 'y', 12, 32);
  ringBand(pad, [0, 0.275, 0], 0.82, 0.055, 0.035, phase, p.hd);
  const deck = group(root, 'PhaseCoreDeck', [0, 0.28, 0]);
  cyl(deck, [0, 0.02, 0], 0.64, 0.68, 0.06, p.dark, p.hd, 'y', 12, 32);
  ringBand(deck, [0, 0.055, 0], 0.52, 0.05, 0.03, phase, p.hd);
  ringBand(deck, [0, 0.055, 0], 0.3, 0.04, 0.03, p.accent, p.hd);
  orb(deck, [0, 0.05, 0], 0.16, phase, p.hd, [1, 0.32, 1]);
  radLoop(3, (a, sx, sz) => { box(deck, [sx * 0.42, 0.058, sz * 0.42], [0.07, 0.028, 0.28], p.accent).rotation.y = a; }, Math.PI / 3);
  radLoop(3, (a, sx, sz) => {
    shell(pad, [sx * 0.88, 0.24, sz * 0.88], [0.28, 0.24, 0.32], p.edge, 0.24).rotation.y = a;
    strut(pad, [sx * 0.88, 0.3, sz * 0.88], [sx * 1.0, 1.3, sz * 1.0], 0.088, p.primary, p.hd ? 14 : 8);
    strut(pad, [sx * 1.0, 1.3, sz * 1.0], [sx * 0.72, 2.34, sz * 0.72], 0.078, p.primary, p.hd ? 14 : 8);
    shell(pad, [sx * 1.02, 1.3, sz * 1.02], [0.24, 0.22, 0.26], p.accent, 0.24).rotation.y = a;
    strut(pad, [sx * 0.88, 1.32, sz * 0.88], [sx * 0.66, 2.24, sz * 0.66], 0.028, phase, p.hd ? 10 : 6);
  });
  ringBand(pad, [0, 2.34, 0], 0.76, 0.1, 0.14, p.dark, p.hd);
  const collector = group(root, 'CollectorRing', [0, 2.46, 0]);
  ringBand(collector, [0, 0, 0], 0.8, 0.11, 0.12, p.primary, p.hd);
  torus(collector, [0, -0.05, 0], 0.72, 0.028, phase, p.hd, 'y');
  radLoop(6, (a, sx, sz, i) => { shell(collector, [sx * 0.84, 0.05, sz * 0.84], [0.14, 0.18, 0.2], i % 2 === 0 ? p.accent : p.edge, 0.24).rotation.y = a; });
  const ctrl = group(root, 'ControlPillar', [0.88, 0, 0.72]);
  strut(ctrl, [-0.26, 0.08, -0.22], [0, 0.08, 0], 0.045, p.edge, p.hd ? 10 : 6);
  shell(ctrl, [0, 0.5, 0], [0.26, 0.96, 0.26], p.primary, 0.24);
  displayUnit(ctrl, [0, 1.04, 0.02], 0.34, 0.24, 0.08, p.dark, phase, -0.5, -0.42);
  if (detail) {
    boltRing(pad, 0, 0.17, 0, 0.96, 9, p);
    radLoop(3, (_, sx, sz) => { hose(pad, [[sx * 1.02, 0.36, sz * 1.02], [sx * 1.14, 1.28, sz * 1.14], [sx * 0.88, 2.2, sz * 0.88]], 0.024, p.tire, p.hd); });
    if (p.hd) ringBand(collector, [0, 0.075, 0], 0.78, 0.04, 0.035, p.accent, true);
  }
  root.animations = [new T.AnimationClip('Charge teleporter', 3.6, [spinTrack('CollectorRing', 'y', 3.6, 1), spinTrack('PhaseCoreDeck', 'y', 3.6, -1)])];
}

export function buildHexagonalShieldEmitter(root: T.Group, p: Finish, detail: boolean) {
  const em = group(root, 'ShieldBase'), aqua = glowMat('#3ae8cf', 0.92), fieldHolo = holoMat('#44f0da', 0.38);
  radLoop(3, (a, sx, sz) => {
    shell(em, [sx * 0.72, 0.07, sz * 0.72], [0.3, 0.14, 0.34], p.dark, 0.24).rotation.y = a;
    strut(em, [sx * 0.68, 0.12, sz * 0.68], [sx * 0.22, 0.56, sz * 0.22], 0.072, p.primary, p.hd ? 14 : 6);
    strut(em, [sx * 0.56, 0.14, sz * 0.56], [sx * 0.26, 0.42, sz * 0.26], 0.036, p.edge, p.hd ? 10 : 6);
  });
  hexSlab(em, [0, 0.52, 0], 0.38, 0.26, p.dark, p.hd);
  cyl(em, [0, 1.14, 0], 0.16, 0.2, 1.16, p.primary, p.hd, 'y', 8, 24);
  for (const [cy, idx] of [[0.78, 0], [1.02, 1], [1.26, 2], [1.5, 3]] as const) ringBand(em, [0, cy, 0], 0.27, 0.07, 0.09, idx % 2 === 0 ? p.accent : p.edge, p.hd);
  shell(em, [0, 1.72, 0], [0.46, 0.16, 0.38], p.dark, 0.24);
  for (const s of [-1, 1]) shell(em, [s * 0.24, 1.88, 0], [0.1, 0.26, 0.24], p.edge, 0.2);
  const cap = group(root, 'RearCapacitor', [0, 1.12, -0.32]);
  box(cap, [0, 0, 0.12], [0.22, 0.44, 0.14], p.edge);
  cyl(cap, [0, 0, -0.02], 0.13, 0.13, 0.62, p.dark, p.hd);
  box(cap, [0, 0, -0.155], [0.06, 0.42, 0.03], aqua);
  const tilt = group(root, 'ProjectorTilt', [0, 1.9, 0]);
  cyl(tilt, [0, 0, 0], 0.065, 0.065, 0.56, p.alloy, p.hd, 'x');
  cyl(tilt, [0, 0, -0.18], 0.2, 0.34, 0.36, p.dark, p.hd, 'z');
  const hexHead = group(tilt, 'HexProjector', [0, 0, 0.08]);
  hexSlab(hexHead, [0, 0, 0], 0.66, 0.14, p.primary, p.hd).rotation.x = HPI;
  hexSlab(hexHead, [0, 0, 0], 0.54, 0.18, p.inset, p.hd).rotation.x = HPI;
  hexSlab(hexHead, [0, 0, 0.11], 0.32, 0.08, fieldHolo, p.hd).rotation.x = HPI;
  orb(hexHead, [0, 0, 0.13], 0.15, aqua, p.hd, [1, 1, 0.65]);
  radLoop(6, (a, sx, sz) => { shell(hexHead, [sx * 0.46, sz * 0.46, 0.08], [0.12, 0.26, 0.09], p.accent, 0.24).rotation.z = -a; });
  if (detail) {
    boltRing(em, 0, 0.66, 0, 0.3, 6, p);
    radLoop(6, (_, sx, sz) => { fastener(hexHead, [sx * 0.59, sz * 0.59, 0.08], p, 0.025).rotation.x = HPI; }, Math.PI / 6);
    if (p.hd) hose(em, [[-0.14, 0.9, -0.24], [-0.26, 1.24, -0.18], [-0.14, 1.62, -0.1]], 0.022, p.tire, true);
  }
  root.animations = [new T.AnimationClip('Project shield array', 3.8, [
    spinTrack('HexProjector', 'z', 3.8, 2),
    rotationTrack('ProjectorTilt', 'x', [0, 0.95, 2.85, 3.8], [0, deg(-28), deg(22), 0]),
  ])];
}

export function buildAutomatedCargoLoader(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'LoaderTracks'), warn = glowMat('#ffaa1e', 0.9, 'Loader beacon');
  for (const sx of [-0.54, 0.54]) {
    shell(base, [sx, 0.24, 0], [0.32, 0.28, 1.64], p.dark, 0.22);
    for (const wz of [-0.62, -0.21, 0.21, 0.62]) {
      cyl(base, [sx, 0.15, wz], 0.15, 0.15, 0.36, p.tire, p.hd, 'x');
      cyl(base, [sx, 0.15, wz], 0.075, 0.075, 0.38, p.alloy, p.hd, 'x');
    }
  }
  shell(base, [0, 0.28, 0], [0.84, 0.24, 1.44], p.primary, 0.18);
  for (const sz of [-0.8, 0.8]) box(base, [0, 0.26, sz], [1.24, 0.12, 0.12], p.edge);
  const turret = group(root, 'TurretColumn', [0, 0.42, -0.12]);
  cyl(turret, [0, 0.06, 0], 0.44, 0.46, 0.12, p.edge, p.hd);
  shell(turret, [0, 0.34, -0.06], [0.76, 0.52, 0.86], p.primary, 0.2);
  shell(turret, [0, 0.64, -0.22], [0.54, 0.14, 0.46], p.dark, 0.22);
  orb(turret, [0, 0.74, -0.28], 0.075, warn, p.hd);
  for (const sx of [-0.24, 0.24]) shell(turret, [sx, 0.56, 0.18], [0.12, 0.28, 0.28], p.accent, 0.2);
  const ballast = group(turret, 'CounterweightBlock', [0, 0.3, -0.56]);
  shell(ballast, [0, 0, 0], [0.72, 0.42, 0.28], p.dark, 0.22);
  box(ballast, [0, 0.04, -0.15], [0.54, 0.12, 0.035], p.accent);
  const lower = group(turret, 'LowerBoom', [0, 0.58, 0.18]);
  cyl(lower, [0, 0, 0], 0.085, 0.085, 0.62, p.alloy, p.hd, 'x');
  for (const sx of [-0.14, 0.14]) {
    strut(lower, [sx, 0, 0], [sx, 0.96, 0.44], 0.062, p.primary, p.hd ? 12 : 6);
    strut(lower, [sx, -0.14, 0.16], [sx, 0.54, 0.34], 0.036, p.alloy, p.hd ? 10 : 6);
  }
  box(lower, [0, 0.48, 0.22], [0.34, 0.14, 0.16], p.accent);
  const forearm = group(lower, 'ForearmBoom', [0, 0.96, 0.44]);
  cyl(forearm, [0, 0, 0], 0.105, 0.105, 0.44, p.accent, p.hd, 'x');
  for (const sx of [-0.1, 0.1]) strut(forearm, [sx, 0, 0], [sx * 0.6, 0.14, 0.9], 0.048, p.primary, p.hd ? 12 : 6);
  cyl(forearm, [0, 0.06, 0.9], 0.12, 0.11, 0.22, p.edge, p.hd);
  radLoop(3, (_, sx, sz) => {
    strut(forearm, [sx * 0.08, -0.04, 0.9 + sz * 0.08], [sx * 0.22, -0.22, 0.9 + sz * 0.22], 0.028, p.dark, p.hd ? 10 : 6);
    strut(forearm, [sx * 0.22, -0.22, 0.9 + sz * 0.22], [sx * 0.1, -0.4, 0.9 + sz * 0.1], 0.024, p.accent, p.hd ? 10 : 6);
  });
  if (detail) {
    for (const sx of [-0.4, 0.4]) box(turret, [sx, 0.34, -0.06], [0.04, 0.26, 0.56], p.accent);
    hose(turret, [[0.14, 0.58, 0.08], [0.22, 0.86, 0.28], [0.16, 1.38, 0.54]], 0.024, p.tire, p.hd);
    if (p.hd) for (const sx of [-0.54, 0.54]) fastener(base, [sx, 0.39, 0.62], p, 0.028);
  }
  root.animations = [new T.AnimationClip('Transfer cargo load', 3.8, [
    rotationTrack('TurretColumn', 'y', [0, 1.1, 2.6, 3.8], [0, deg(68), deg(-54), 0]),
    rotationTrack('LowerBoom', 'x', [0, 0.95, 2.4, 3.8], [0, deg(-18), deg(24), 0]),
    rotationTrack('ForearmBoom', 'x', [0, 0.95, 2.4, 3.8], [0, deg(24), deg(-32), 0]),
  ])];
}

export function buildOrbitalBatteryTurret(root: T.Group, p: Finish, detail: boolean) {
  const bunker = group(root, 'BunkerRing'), railGlow = glowMat('#ff5633', 0.95, 'Railgun charge');
  cyl(bunker, [0, 0.14, 0], 0.92, 1.02, 0.28, p.dark, p.hd, 'y', 8, 24);
  cyl(bunker, [0, 0.38, 0], 0.72, 0.92, 0.24, p.primary, p.hd, 'y', 8, 24);
  radLoop(4, (a, sx, sz) => { shell(bunker, [sx * 0.84, 0.22, sz * 0.84], [0.4, 0.34, 0.24], p.edge, 0.24).rotation.y = a; }, Math.PI / 4);
  shell(bunker, [0, 0.22, -0.94], [0.46, 0.32, 0.14], p.edge, 0.2);
  const turret = group(root, 'TurretHousing', [0, 0.5, 0]);
  ringBand(turret, [0, 0.04, 0], 0.7, 0.1, 0.1, p.edge, p.hd);
  shell(turret, [0, 0.4, -0.1], [1.26, 0.64, 1.38], p.primary, 0.3);
  shell(turret, [0, 0.76, -0.14], [0.96, 0.18, 1.06], p.dark, 0.28);
  cyl(turret, [-0.26, 0.92, -0.2], 0.18, 0.22, 0.16, p.edge, p.hd);
  box(turret, [-0.26, 0.94, -0.02], [0.16, 0.07, 0.04], p.optic);
  shell(turret, [0, 0.42, -0.84], [0.88, 0.42, 0.32], p.dark, 0.22);
  box(turret, [0, 0.44, -1.01], [0.64, 0.1, 0.035], railGlow);
  const ammo = group(turret, 'AmmoPod', [0.76, 0.38, -0.14]);
  box(ammo, [-0.12, 0, 0], [0.16, 0.32, 0.46], p.dark);
  shell(ammo, [0.06, 0, 0], [0.3, 0.48, 0.66], p.edge, 0.22);
  box(ammo, [0.22, 0, 0], [0.035, 0.14, 0.48], p.accent);
  const guns = group(turret, 'RailgunMantlet', [0, 0.44, 0.54]);
  cyl(guns, [0, 0, 0], 0.24, 0.24, 0.78, p.dark, p.hd, 'x');
  for (const sx of [-0.22, 0.22]) {
    for (const sy of [-0.075, 0.075]) box(guns, [sx, sy, 0.76], [0.12, 0.065, 1.42], p.edge);
    box(guns, [sx, 0, 0.7], [0.07, 0.055, 1.24], railGlow);
    for (const cz of [0.34, 0.78, 1.22]) shell(guns, [sx, 0, cz], [0.18, 0.24, 0.14], cz === 0.78 ? p.accent : p.primary, 0.22);
    shell(guns, [sx, 0, 1.46], [0.18, 0.26, 0.18], p.dark, 0.2);
  }
  if (detail) {
    boltRing(bunker, 0, 0.29, 0, 0.9, 8, p);
    for (const sy of [0.3, 0.44, 0.58]) box(turret, [-0.65, sy, -0.14], [0.04, 0.06, 0.72], p.accent);
    if (p.hd) for (const sx of [-0.36, 0.36]) fastener(turret, [sx, 0.86, 0.26], p, 0.028);
  }
  root.animations = [new T.AnimationClip('Track orbital target', 4.2, [
    rotationTrack('TurretHousing', 'y', [0, 1.2, 2.8, 4.2], [0, deg(85), deg(-75), 0]),
    rotationTrack('RailgunMantlet', 'x', [0, 1.0, 2.6, 4.2], [0, deg(-38), deg(-14), 0]),
  ])];
}

export function buildNeuralLinkChair(root: T.Group, p: Finish, detail: boolean) {
  const ped = group(root, 'ChairPedestal'), synGlow = glowMat('#44c8ff', 0.92), visorHolo = holoMat('#4ad0ff', 0.42);
  ringBand(ped, [0, 0.045, 0], 0.54, 0.085, 0.09, p.dark, p.hd);
  radLoop(5, (_, sx, sz) => { strut(ped, [0, 0.18, 0], [sx * 0.52, 0.06, sz * 0.52], 0.048, p.edge, p.hd ? 12 : 6); });
  cyl(ped, [0, 0.28, 0], 0.13, 0.18, 0.4, p.alloy, p.hd);
  const chair = group(root, 'ChairAssembly', [0, 0.48, 0]);
  shell(chair, [0, 0.02, 0], [0.52, 0.14, 0.56], p.dark, 0.24);
  shell(chair, [0, 0.14, 0.08], [0.68, 0.14, 0.72], p.primary, 0.26);
  shell(chair, [0, -0.04, 0.52], [0.54, 0.12, 0.42], p.primary, 0.26).rotation.x = 0.62;
  const back = group(chair, '', [0, 0.56, -0.28]);
  back.rotation.x = -0.24;
  shell(back, [0, 0, 0], [0.64, 0.86, 0.18], p.primary, 0.26);
  shell(back, [0, 0, 0.09], [0.22, 0.72, 0.08], p.accent, 0.26);
  shell(back, [0, 0.52, 0.02], [0.38, 0.2, 0.16], p.dark, 0.28);
  for (const sx of [-0.42, 0.42]) {
    strut(chair, [sx * 0.8, 0.08, -0.08], [sx, 0.34, -0.02], 0.042, p.edge, p.hd ? 10 : 6);
    shell(chair, [sx, 0.36, 0.14], [0.16, 0.08, 0.62], p.dark, 0.24);
    displayUnit(chair, [sx, 0.43, 0.34], 0.18, 0.06, 0.22, p.edge, synGlow, 0, -HPI + 0.22);
  }
  strut(chair, [0, 0.06, -0.26], [0, 0.74, -0.52], 0.062, p.dark, p.hd ? 12 : 6);
  strut(chair, [0, 0.74, -0.52], [0, 1.48, -0.34], 0.056, p.dark, p.hd ? 12 : 6);
  const pod = group(chair, 'HeadrestPod', [0, 0.92, -0.56]);
  shell(pod, [0, 0, -0.06], [0.34, 0.36, 0.22], p.edge, 0.22);
  box(pod, [0, 0.02, -0.18], [0.2, 0.1, 0.03], synGlow);
  const visor = group(chair, 'NeuralVisorArm', [0, 1.48, -0.34]);
  cyl(visor, [0, 0, 0], 0.075, 0.075, 0.28, p.alloy, p.hd, 'x');
  strut(visor, [0, 0, 0], [0, 0.1, 0.36], 0.04, p.edge, p.hd ? 10 : 6);
  strut(visor, [0, 0.1, 0.36], [0, -0.22, 0.46], 0.036, p.alloy, p.hd ? 10 : 6);
  shell(visor, [0, -0.26, 0.42], [0.38, 0.22, 0.36], p.primary, 0.3);
  for (const sx of [-0.21, 0.21]) cyl(visor, [sx, -0.28, 0.44], 0.055, 0.055, 0.07, p.accent, p.hd, 'x');
  box(visor, [0, -0.3, 0.59], [0.34, 0.15, 0.06], visorHolo).castShadow = false;
  if (detail) {
    boltRing(ped, 0, 0.1, 0, 0.5, 5, p);
    hose(chair, [[-0.14, 0.74, -0.54], [-0.28, 0.58, -0.38], [-0.38, 0.38, -0.1]], 0.02, p.tire, p.hd);
    if (p.hd) for (const sx of [-0.24, 0.24]) fastener(chair, [sx, 0.15, 0.42], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Engage neural link', 3.4, [
    rotationTrack('NeuralVisorArm', 'x', [0, 0.9, 2.3, 3.4], [0, deg(46), deg(46), 0]),
    rotationTrack('ChairAssembly', 'y', [0, 0.9, 2.3, 3.4], [0, deg(28), deg(-28), 0]),
  ])];
}

export function buildFusionCoolantTower(root: T.Group, p: Finish, detail: boolean) {
  const twr = group(root, 'CoolantTower'), coolGlow = glowMat('#2ae6c8', 0.9, 'Coolant vent');
  shell(twr, [0, 0.12, 0], [2.04, 0.24, 1.32], p.dark, 0.2);
  shell(twr, [0, 0.34, 0], [1.82, 0.24, 1.12], p.primary, 0.2);
  for (const sz of [-0.52, 0.52]) {
    cyl(twr, [0, 0.34, sz], 0.085, 0.085, 1.62, p.alloy, p.hd, 'x');
    for (const sx of [-0.52, 0.52]) ringBand(twr, [sx, 0.34, sz], 0.12, 0.04, 0.09, p.accent, p.hd, 'x');
  }
  for (const [sx, name] of [[-0.5, 'ExhaustTurbineL'], [0.5, 'ExhaustTurbineR']] as const) {
    cyl(twr, [sx, 0.72, 0], 0.38, 0.46, 0.56, p.dark, p.hd, 'y', 10, 28);
    cyl(twr, [sx, 1.62, 0], 0.31, 0.4, 1.32, p.primary, p.hd, 'y', 10, 28);
    for (let i = 0; i < 5; i++) ringBand(twr, [sx, 1.12 + i * 0.24, 0], 0.43 - i * 0.018, 0.075, 0.065, i % 2 === 0 ? p.edge : p.accent, p.hd);
    ringBand(twr, [sx, 2.42, 0], 0.4, 0.075, 0.3, p.dark, p.hd);
    ringBand(twr, [sx, 2.34, 0], 0.32, 0.04, 0.045, coolGlow, p.hd);
    cyl(twr, [sx, 2.36, 0], 0.075, 0.095, 0.26, p.edge, p.hd);
    const fan = group(root, name, [sx, 2.44, 0]);
    cyl(fan, [0, 0, 0], 0.09, 0.11, 0.14, p.alloy, p.hd);
    orb(fan, [0, 0.08, 0], 0.075, p.accent, p.hd);
    radLoop(6, a => {
      const wrap = group(fan, '');
      wrap.rotation.y = a;
      box(wrap, [0, 0, 0.19], [0.095, 0.024, 0.24], p.alloy).rotation.z = 0.42;
    });
  }
  for (const by of [1.28, 2.02]) shell(twr, [0, by, 0], [0.68, 0.14, 0.42], p.edge, 0.2);
  strut(twr, [-0.28, 1.32, 0], [0.28, 1.98, 0], 0.032, p.dark, p.hd ? 10 : 6);
  strut(twr, [0.28, 1.32, 0], [-0.28, 1.98, 0], 0.032, p.dark, p.hd ? 10 : 6);
  const cab = group(root, 'CoolantManifoldBox', [0, 0.46, 0.62]);
  shell(cab, [0, 0, 0], [0.46, 0.46, 0.26], p.edge, 0.22);
  displayUnit(cab, [0, 0.06, 0.12], 0.3, 0.18, 0.05, p.dark, coolGlow);
  if (detail) {
    for (const sx of [-0.5, 0.5]) {
      cyl(twr, [sx, 1.46, -0.44], 0.042, 0.042, 1.72, p.alloy, p.hd);
      for (const sz of [-0.48, 0.48]) fastener(twr, [sx * 1.66, 0.25, sz], p, 0.03);
    }
    if (p.hd) for (const sx of [-0.5, 0.5]) ringBand(twr, [sx, 2.57, 0], 0.39, 0.045, 0.04, p.accent, true);
  }
  root.animations = [new T.AnimationClip('Vent fusion heat', 2.4, [spinTrack('ExhaustTurbineL', 'y', 2.4, 3), spinTrack('ExhaustTurbineR', 'y', 2.4, -3)])];
}

export function buildDroidRepairBay(root: T.Group, p: Finish, detail: boolean) {
  const bay = group(root, 'RepairBay'), workLight = glowMat('#fff0c8', 0.9), weldGlow = glowMat('#ff8624', 0.95), scanGlow = glowMat('#36e8ff', 0.9);
  shell(bay, [0, 0.08, 0], [2.04, 0.16, 1.48], p.dark, 0.2);
  shell(bay, [0, 0.18, 0.1], [1.34, 0.06, 1.06], p.edge, 0.18);
  for (const sx of [-0.46, 0.46]) box(bay, [sx, 0.215, 0.1], [0.08, 0.025, 0.88], weldGlow);
  for (const sx of [-0.28, 0.28]) shell(bay, [sx, 0.24, 0.46], [0.16, 0.08, 0.14], p.accent, 0.2);
  for (const sx of [-0.86, 0.86]) {
    shell(bay, [sx, 1.16, -0.18], [0.32, 2.04, 0.48], p.primary, 0.2);
    for (const sy of [0.56, 1.16, 1.76]) box(bay, [sx + (sx > 0 ? 0.17 : -0.17), sy, -0.18], [0.035, 0.26, 0.32], p.accent);
  }
  shell(bay, [0, 2.26, -0.18], [2.08, 0.28, 0.56], p.primary, 0.22);
  box(bay, [0, 2.1, -0.02], [1.36, 0.06, 0.14], workLight);
  shell(bay, [0, 1.18, -0.46], [1.44, 1.76, 0.18], p.dark, 0.18);
  displayUnit(bay, [0, 1.38, -0.35], 1.14, 0.64, 0.07, p.edge, scanGlow);
  for (const [name, sx, tipMat] of [['WeldArmL', -0.7, weldGlow], ['WeldArmR', 0.7, scanGlow]] as const) {
    const dir = sx < 0 ? 1 : -1, arm = group(root, name, [sx, 1.36, 0.08]);
    cyl(arm, [0, 0, 0], 0.095, 0.105, 0.22, p.alloy, p.hd);
    strut(arm, [0, 0, 0], [dir * 0.3, 0.08, 0.36], 0.044, p.primary, p.hd ? 12 : 6);
    cyl(arm, [dir * 0.3, 0.08, 0.36], 0.075, 0.075, 0.14, p.accent, p.hd);
    strut(arm, [dir * 0.3, 0.08, 0.36], [dir * 0.44, -0.16, 0.62], 0.034, p.alloy, p.hd ? 10 : 6);
    cyl(arm, [dir * 0.46, -0.2, 0.66], 0.048, 0.06, 0.14, p.dark, p.hd, 'z');
    orb(arm, [dir * 0.46, -0.2, 0.74], 0.045, tipMat, p.hd);
  }
  const rack = group(root, 'ToolRack', [1.04, 1.14, -0.18]);
  shell(rack, [0.06, 0, 0], [0.12, 0.84, 0.46], p.edge, 0.2);
  for (const [tz, h] of [[-0.14, 0.32], [0, 0.26], [0.14, 0.36]] as const) {
    cyl(rack, [0.14, 0.06, tz], 0.022, 0.022, h, p.alloy, p.hd);
    box(rack, [0.14, 0.06 + h * 0.5, tz], [0.05, 0.07, 0.07], p.accent);
  }
  if (detail) {
    for (const sx of [-0.66, 0.66]) {
      orb(bay, [sx, 2.44, -0.06], 0.07, p.accent, p.hd);
      hose(bay, [[sx * 1.15, 0.64, -0.44], [sx * 0.85, 0.94, -0.58], [sx * 0.55, 1.28, -0.52]], 0.024, p.tire, p.hd);
    }
    if (p.hd) for (const sx of [-0.86, 0.86]) fastener(bay, [sx, 2.26, 0.11], p, 0.03).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Calibrate droid bay', 3.4, [
    rotationTrack('WeldArmL', 'y', [0, 0.85, 1.7, 2.55, 3.4], [0, deg(-34), deg(24), deg(-28), 0]),
    rotationTrack('WeldArmR', 'y', [0, 0.85, 1.7, 2.55, 3.4], [0, deg(32), deg(-24), deg(28), 0]),
  ])];
}

export function buildStarshipHelmConsole(root: T.Group, p: Finish, detail: boolean) {
  const helm = group(root, 'HelmStation'), navGlow = glowMat('#38d2ff', 0.92), auxGlow = glowMat('#52f2c8', 0.88);
  shell(helm, [0, 0.08, -0.26], [1.96, 0.16, 0.72], p.dark, 0.22);
  for (const sx of [-0.78, 0.78]) {
    shell(helm, [sx, 0.08, 0.2], [0.56, 0.16, 0.88], p.dark, 0.22);
    shell(helm, [sx, 0.48, 0.18], [0.46, 0.68, 0.74], p.primary, 0.22);
  }
  shell(helm, [0, 0.48, -0.3], [1.84, 0.68, 0.6], p.primary, 0.24);
  shell(helm, [0, 0.48, -0.62], [1.14, 0.42, 0.14], p.edge, 0.24);
  box(helm, [0, 0.56, -0.7], [0.84, 0.1, 0.035], p.accent);
  shell(helm, [0, 0.86, -0.2], [1.94, 0.12, 0.68], p.dark, 0.22);
  for (const [sx, ry] of [[-0.76, 0.28], [0.76, -0.28]] as const) {
    const wing = group(helm, '', [sx, 0.88, 0.26]);
    wing.rotation.y = ry;
    shell(wing, [0, 0, 0], [0.54, 0.12, 0.76], p.dark, 0.22);
    box(wing, [0, 0.07, 0.04], [0.36, 0.028, 0.52], auxGlow);
    box(wing, [sx > 0 ? 0.24 : -0.24, 0.02, 0], [0.05, 0.06, 0.6], p.accent);
  }
  displayUnit(helm, [0, 1.18, -0.44], 0.92, 0.44, 0.12, p.edge, navGlow, 0, -0.18);
  for (const [sx, ry] of [[-0.68, 0.42], [0.68, -0.42]] as const) {
    strut(helm, [sx * 0.65, 1.14, -0.46], [sx, 1.14, -0.24], 0.034, p.alloy, p.hd ? 10 : 6);
    displayUnit(helm, [sx, 1.18, -0.2], 0.56, 0.38, 0.12, p.edge, auxGlow, ry, -0.14);
  }
  const hood = group(root, 'HudCanopy', [0, 1.44, -0.34]);
  shell(hood, [0, 0, 0], [1.24, 0.1, 0.38], p.primary, 0.26);
  for (const [sx, ry] of [[-0.74, 0.42], [0.74, -0.42]] as const) shell(hood, [sx, -0.02, 0.18], [0.58, 0.09, 0.32], p.primary, 0.24).rotation.y = ry;
  box(hood, [0, -0.05, 0.19], [0.96, 0.035, 0.035], p.accent);
  const thr = group(root, 'ThrottleLevers', [-0.34, 0.92, -0.06]);
  shell(helm, [-0.34, 0.93, -0.06], [0.28, 0.06, 0.28], p.edge, 0.2);
  for (const sx of [-0.065, 0.065]) strut(thr, [sx, 0, 0], [sx, 0.24, -0.04], 0.018, p.alloy, p.hd ? 10 : 6);
  shell(thr, [0, 0.25, -0.04], [0.24, 0.075, 0.1], p.accent, 0.3);
  box(thr, [0, 0.27, 0.02], [0.16, 0.03, 0.025], navGlow);
  const ball = group(root, 'NavTrackball', [0.24, 0.94, -0.04]);
  ringBand(helm, [0.24, 0.93, -0.04], 0.14, 0.04, 0.055, p.accent, p.hd);
  orb(ball, [0, 0.04, 0], 0.105, navGlow, p.hd);
  torus(ball, [0, 0.04, 0], 0.108, 0.016, p.alloy, p.hd, 'z');
  if (detail) {
    for (const sx of [-0.62, 0.62]) for (const y of [0.34, 0.48, 0.62]) box(helm, [sx, y, -0.61], [0.24, 0.045, 0.03], p.inset);
    hose(helm, [[-0.5, 0.82, -0.44], [-0.32, 0.94, -0.54], [0, 1.06, -0.52]], 0.022, p.tire, p.hd);
    if (p.hd) for (const sx of [-0.78, 0.78]) fastener(helm, [sx, 0.93, 0.56], p, 0.026);
  }
  root.animations = [new T.AnimationClip('Engage warp helm', 3.2, [
    rotationTrack('ThrottleLevers', 'x', [0, 0.8, 2.2, 3.2], [0, deg(-30), deg(28), 0]),
    spinTrack('NavTrackball', 'y', 3.2, 2),
  ])];
}
