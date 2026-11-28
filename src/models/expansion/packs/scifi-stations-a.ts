import * as T from 'three';
import {
  bioMat, boltRing, box, cyl, deg, displayUnit, fastener, glassMat, glowMat, group, hexSlab, holoMat,
  hose, HPI, orb, radLoop, ringBand, rotationTrack, shell, slideTrack, spinTrack, strut, torus, wheelValve,
  type Finish, type Point,
} from './scifi-stations-kit';

export function buildVerticalCryoSleepPod(root: T.Group, p: Finish, detail: boolean) {
  const pod = group(root, 'CryoPodBase'), glass = glassMat('#99e8f2', 0.28), glow = glowMat('#3ae8ff', 0.9, 'Cryo status glow');
  for (const sx of [-0.46, 0.46]) for (const sz of [-0.42, 0.42]) shell(pod, [sx, 0.08, sz], [0.24, 0.16, 0.22], p.edge, 0.24);
  shell(pod, [0, 0.2, 0], [1.14, 0.26, 1.04], p.dark, 0.24);
  cyl(pod, [0, 0.36, 0.04], 0.46, 0.5, 0.14, p.primary, p.hd);
  shell(pod, [0, 1.32, -0.22], [0.96, 1.88, 0.42], p.primary, 0.24);
  for (const sx of [-0.42, 0.42]) shell(pod, [sx, 1.32, 0.04], [0.14, 1.82, 0.3], p.primary, 0.2);
  box(pod, [0, 1.32, -0.02], [0.68, 1.66, 0.08], p.inset);
  for (const [py, ph, pw] of [[1.74, 0.24, 0.42], [1.28, 0.52, 0.54], [0.76, 0.42, 0.46]] as const) shell(pod, [0, py, 0.05], [pw, ph, 0.1], p.dark, 0.28);
  for (const sx of [-0.34, 0.34]) box(pod, [sx, 1.32, 0.08], [0.036, 1.48, 0.036], glow);
  shell(pod, [0, 2.28, 0], [1.08, 0.22, 0.98], p.dark, 0.26);
  cyl(pod, [0, 2.42, -0.02], 0.32, 0.38, 0.14, p.accent, p.hd);
  const hatch = group(root, 'CanopyHatch', [-0.46, 1.32, 0.16]);
  cyl(hatch, [0, 0, 0], 0.045, 0.045, 1.76, p.alloy, p.hd);
  for (const sy of [-0.82, 0.82]) {
    shell(hatch, [0.46, sy, 0.12], [0.92, 0.1, 0.34], p.primary, 0.32);
    box(hatch, [0.46, sy, 0.29], [0.62, 0.045, 0.04], p.accent);
  }
  box(hatch, [0.89, 0, 0.05], [0.08, 1.66, 0.14], p.accent);
  box(hatch, [0.46, 0, 0.26], [0.54, 1.54, 0.04], glass).castShadow = false;
  for (const [gx, gz, ry] of [[0.14, 0.16, -0.62], [0.78, 0.16, 0.62]] as const) {
    const wing = box(hatch, [gx, 0, gz], [0.24, 1.54, 0.04], glass);
    wing.rotation.y = ry;
    wing.castShadow = false;
  }
  const monitor = group(root, 'VitalMonitor', [0.48, 1.54, 0.12]);
  strut(monitor, [0, 0, 0], [0.26, 0.05, 0.14], 0.026, p.alloy, p.hd ? 14 : 8);
  displayUnit(monitor, [0.3, 0.06, 0.16], 0.36, 0.26, 0.06, p.dark, glow, -0.32, -0.1);
  const tanks = group(root, 'CryoTankPack', [0, 1.18, -0.44]);
  box(tanks, [0, 0, 0.04], [0.68, 0.2, 0.12], p.edge);
  for (const sx of [-0.22, 0.22]) {
    cyl(tanks, [sx, 0, -0.1], 0.14, 0.14, 1.32, p.alloy, p.hd);
    cyl(tanks, [sx, 0.68, -0.1], 0.07, 0.12, 0.12, p.accent, p.hd);
    for (const fy of [-0.42, -0.14, 0.14, 0.42]) ringBand(tanks, [sx, fy, -0.1], 0.175, 0.04, 0.045, p.dark, p.hd);
  }
  if (detail) {
    boltRing(pod, 0, 0.34, 0.04, 0.44, 6, p);
    for (const sx of [-0.22, 0.22]) hose(tanks, [[sx, 0.66, -0.1], [sx * 1.15, 0.86, 0.02], [sx * 0.9, 0.98, 0.18]], 0.022, p.tire, p.hd);
    for (let i = 0; i < 4; i++) box(pod, [0, 2.22 + i * 0.04, 0.5], [0.56 - i * 0.1, 0.025, 0.025], p.accent);
    if (p.hd) for (const sx of [-0.42, 0.42]) fastener(pod, [sx, 2.28, 0.49], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Cycle cryo hatch', 3.4, [
    rotationTrack('CanopyHatch', 'y', [0, 0.9, 2.3, 3.4], [0, deg(-92), deg(-92), 0]),
    rotationTrack('VitalMonitor', 'y', [0, 0.9, 2.3, 3.4], [0, deg(28), deg(-18), 0]),
  ])];
}

export function buildTacticalHoloMapTable(root: T.Group, p: Finish, detail: boolean) {
  const tbl = group(root, 'HoloTableBase'), holo = holoMat('#2ce8d4', 0.38), ringHolo = holoMat('#52f2ff', 0.42), glow = glowMat('#29e0c8', 0.9);
  cyl(tbl, [0, 0.1, 0], 0.66, 0.76, 0.2, p.dark, p.hd, 'y', 8, 24);
  cyl(tbl, [0, 0.5, 0], 0.38, 0.48, 0.66, p.primary, p.hd, 'y', 8, 24);
  radLoop(4, (_, sx, sz) => { strut(tbl, [sx * 0.62, 0.18, sz * 0.62], [sx * 0.42, 0.8, sz * 0.42], 0.068, p.edge, p.hd ? 14 : 6); }, Math.PI / 4);
  cyl(tbl, [0, 0.88, 0], 0.94, 0.84, 0.16, p.primary, p.hd, 'y', 8, 24);
  cyl(tbl, [0, 0.95, 0], 0.64, 0.66, 0.06, p.inset, p.hd, 'y', 8, 24);
  radLoop(8, (a, sx, sz, i) => {
    const panel = group(tbl, '', [sx * 0.8, 0.94, sz * 0.8]);
    panel.rotation.y = a;
    shell(panel, [0, 0.04, 0], [0.46, 0.08, 0.26], p.dark, 0.22).rotation.x = 0.36;
    box(panel, [0, 0.095, 0.03], [0.32, 0.025, 0.08], i % 2 === 0 ? p.accent : glow).rotation.x = 0.36;
  });
  cyl(tbl, [0, 1.17, 0], 0.075, 0.13, 0.4, p.alloy, p.hd);
  orb(tbl, [0, 1.0, 0], 0.17, glow, p.hd, [1, 0.4, 1]);
  const proj = group(root, 'HoloProjector', [0, 1.04, 0]);
  ringBand(proj, [0, 0.03, 0], 0.19, 0.05, 0.06, p.accent, p.hd);
  const terrain = group(proj, 'HoloTerrain', [0, 0.06, 0]);
  cyl(terrain, [0, 0.04, 0], 0.54, 0.58, 0.06, holo, p.hd, 'y', 10, 28);
  cyl(terrain, [0.06, 0.1, -0.04], 0.36, 0.42, 0.07, holo, p.hd, 'y', 10, 28);
  for (const [px, pz, ph, pr] of [[-0.22, 0.16, 0.22, 0.13], [0.22, -0.14, 0.28, 0.15], [0.16, 0.24, 0.18, 0.11], [-0.14, -0.22, 0.24, 0.12]] as const) {
    cyl(terrain, [px, ph * 0.5 + 0.06, pz], 0.02, pr, ph, holo, p.hd, 'y', 6, 18);
  }
  const marker = group(root, 'MarkerRing', [0, 1.33, 0]);
  cyl(marker, [0, 0, 0], 0.1, 0.1, 0.07, p.edge, p.hd);
  torus(marker, [0, 0, 0], 0.62, 0.024, ringHolo, p.hd, 'y');
  radLoop(3, (_, sx, sz) => {
    strut(marker, [0, 0, 0], [sx * 0.62, 0, sz * 0.62], 0.016, p.alloy, p.hd ? 10 : 6);
    orb(marker, [sx * 0.62, 0.03, sz * 0.62], 0.045, p.accent, p.hd);
  });
  if (detail) {
    boltRing(tbl, 0, 0.21, 0, 0.66, 8, p);
    radLoop(4, (_, sx, sz) => { hose(tbl, [[sx * 0.5, 0.22, sz * 0.5], [sx * 0.56, 0.52, sz * 0.56], [sx * 0.44, 0.78, sz * 0.44]], 0.024, p.tire, p.hd); });
    if (p.hd) ringBand(tbl, [0, 0.8, 0], 0.88, 0.05, 0.06, p.accent, true);
  }
  root.animations = [new T.AnimationClip('Scan tactical map', 4, [spinTrack('HoloProjector', 'y', 4, 1), spinTrack('MarkerRing', 'y', 4, -2)])];
}

export function buildPulsingWarpCore(root: T.Group, p: Finish, detail: boolean) {
  const core = group(root, 'WarpReactor'), plasma = glowMat('#4cb8ff', 0.95, 'Warp plasma'), glass = glassMat('#99dcff', 0.26);
  hexSlab(core, [0, 0.15, 0], 0.74, 0.3, p.dark, p.hd);
  hexSlab(core, [0, 0.36, 0], 0.58, 0.16, p.primary, p.hd);
  hexSlab(core, [0, 2.52, 0], 0.64, 0.24, p.primary, p.hd);
  hexSlab(core, [0, 2.7, 0], 0.48, 0.16, p.dark, p.hd);
  cyl(core, [0, 1.46, 0], 0.16, 0.16, 2.16, plasma, p.hd);
  cyl(core, [0, 1.46, 0], 0.26, 0.26, 2.08, glass, p.hd, 'y', 10, 28);
  for (const py of [0.76, 1.46, 2.16]) orb(core, [0, py, 0], 0.21, plasma, p.hd, [1, 0.7, 1]);
  radLoop(4, (_, sx, sz) => {
    const x = sx * 0.52, z = sz * 0.52;
    cyl(core, [x, 1.44, z], 0.068, 0.074, 2.28, p.edge, p.hd);
    cyl(core, [x, 0.52, z], 0.095, 0.105, 0.22, p.primary, p.hd);
    cyl(core, [x, 2.36, z], 0.105, 0.095, 0.22, p.primary, p.hd);
    strut(core, [x * 0.56, 0.38, z * 0.56], [x, 0.56, z], 0.048, p.dark, p.hd ? 12 : 6);
    strut(core, [x * 0.56, 2.52, z * 0.56], [x, 2.34, z], 0.048, p.dark, p.hd ? 12 : 6);
  }, Math.PI / 4);
  const upperRest: Point = [0, 1.88, 0], lowerRest: Point = [0, 1.04, 0];
  for (const [name, rest] of [['UpperFieldRing', upperRest], ['LowerFieldRing', lowerRest]] as const) {
    const rGrp = group(root, name, rest);
    ringBand(rGrp, [0, 0, 0], 0.48, 0.11, 0.16, p.primary, p.hd);
    torus(rGrp, [0, 0, 0], 0.34, 0.032, plasma, p.hd, 'y');
    radLoop(4, (a, sx, sz) => { shell(rGrp, [sx * 0.52, 0, sz * 0.52], [0.16, 0.2, 0.16], p.accent, 0.24).rotation.y = a; }, Math.PI / 4);
  }
  const crown = group(root, 'InjectorCrown', [0, 2.76, 0]);
  cyl(crown, [0, 0.12, 0], 0.12, 0.22, 0.26, p.alloy, p.hd);
  orb(crown, [0, 0.28, 0], 0.11, p.accent, p.hd);
  radLoop(4, (a, sx, sz) => { box(crown, [sx * 0.22, 0.12, sz * 0.22], [0.05, 0.24, 0.2], p.accent).rotation.y = a; });
  if (detail) {
    boltRing(core, 0, 0.31, 0, 0.64, 6, p);
    radLoop(6, (a, sx, sz) => { box(core, [sx * 0.66, 0.15, sz * 0.66], [0.22, 0.14, 0.06], p.inset).rotation.y = a; }, Math.PI / 6);
    if (p.hd) boltRing(core, 0, 2.65, 0, 0.54, 6, p);
  }
  root.animations = [new T.AnimationClip('Pulse warp core', 2.8, [
    slideTrack('UpperFieldRing', upperRest, 'y', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.26, -0.22, 0.26, 0]),
    slideTrack('LowerFieldRing', lowerRest, 'y', [0, 0.7, 1.4, 2.1, 2.8], [0, -0.26, 0.22, -0.26, 0]),
  ])];
}

export function buildBulkheadAirlockConsole(root: T.Group, p: Finish, detail: boolean) {
  const frame = group(root, 'BulkheadFrame'), warn = glowMat('#ff9c2a', 0.9), scr = glowMat('#36e8ff', 0.85);
  shell(frame, [0, 0.08, 0], [2.28, 0.16, 0.88], p.dark, 0.18);
  box(frame, [0, 0.19, 0.02], [1.14, 0.06, 0.26], p.inset);
  for (const sx of [-1, 1]) {
    shell(frame, [sx * 0.78, 1.18, 0], [0.56, 2.04, 0.66], p.primary, 0.18);
    shell(frame, [sx * 1.04, 1.06, -0.02], [0.24, 1.88, 0.58], p.edge, 0.2).rotation.z = sx * 0.11;
    cyl(frame, [sx * 0.78, 1.18, -0.34], 0.055, 0.055, 1.84, p.alloy, p.hd);
  }
  shell(frame, [0, 2.26, 0], [2.06, 0.34, 0.74], p.primary, 0.24);
  shell(frame, [0, 2.46, 0.1], [0.58, 0.14, 0.28], p.dark, 0.22);
  box(frame, [0, 2.46, 0.25], [0.42, 0.07, 0.03], warn);
  box(frame, [0, 1.98, -0.34], [1.74, 0.14, 0.12], p.edge);
  const posL: Point = [-0.26, 1.14, 0.02], posR: Point = [0.26, 1.14, 0.02];
  for (const [name, pos, dir] of [['LeftShutter', posL, -1], ['RightShutter', posR, 1]] as const) {
    const sh = group(root, name, pos);
    shell(sh, [0, 0, 0], [0.5, 1.84, 0.18], p.edge, 0.16);
    box(sh, [dir * 0.04, 0.36, 0.105], [0.24, 0.34, 0.03], p.optic);
    for (const sz of [-0.105, 0.105]) box(sh, [0, -0.38, sz], [0.38, 0.14, 0.035], p.accent);
    box(sh, [-dir * 0.18, 0, 0.01], [0.08, 1.72, 0.21], p.dark);
  }
  wheelValve(group(root, 'LockWheel', [-0.78, 1.16, 0.39]), 0.21, 4, p);
  const keypad = group(root, 'OverrideKeypad', [0.78, 1.18, 0.38]);
  box(keypad, [0, 0, -0.06], [0.22, 0.36, 0.12], p.edge);
  displayUnit(keypad, [0, 0.08, 0.02], 0.28, 0.2, 0.07, p.dark, scr, 0, -0.18);
  shell(keypad, [0, -0.12, 0.06], [0.26, 0.16, 0.1], p.dark, 0.2).rotation.x = 0.28;
  box(keypad, [0, -0.1, 0.115], [0.18, 0.08, 0.025], p.accent).rotation.x = 0.28;
  if (detail) {
    for (const sx of [-0.78, 0.78]) {
      for (const y of [0.46, 1.78]) fastener(frame, [sx, y, 0.34], p, 0.03).rotation.x = HPI;
      for (const y of [0.64, 1.14, 1.64]) box(frame, [sx, y, -0.35], [0.18, 0.1, 0.12], p.dark);
    }
    if (p.hd) hose(frame, [[-0.78, 1.78, -0.34], [-0.36, 1.98, -0.4], [0.36, 1.98, -0.4], [0.78, 1.78, -0.34]], 0.026, p.tire, true);
  }
  root.animations = [new T.AnimationClip('Cycle bulkhead seal', 3.4, [
    rotationTrack('LockWheel', 'z', [0, 0.85, 2.4, 3.4], [0, deg(240), deg(240), 0]),
    slideTrack('LeftShutter', posL, 'x', [0, 0.9, 2.3, 3.4], [0, -0.42, -0.42, 0]),
    slideTrack('RightShutter', posR, 'x', [0, 0.9, 2.3, 3.4], [0, 0.42, 0.42, 0]),
  ])];
}

export function buildSpecimenStasisTube(root: T.Group, p: Finish, detail: boolean) {
  const tank = group(root, 'StasisTank'), glass = glassMat('#a4f0c8', 0.26), bioGlow = glowMat('#7eff4c', 0.9);
  cyl(tank, [0, 0.12, 0], 0.56, 0.62, 0.24, p.dark, p.hd, 'y', 10, 28);
  radLoop(4, (a, sx, sz) => { shell(tank, [sx * 0.56, 0.13, sz * 0.56], [0.22, 0.22, 0.26], p.edge, 0.24).rotation.y = a; }, Math.PI / 4);
  cyl(tank, [0, 0.32, 0], 0.48, 0.52, 0.18, p.primary, p.hd, 'y', 10, 28);
  ringBand(tank, [0, 0.42, 0], 0.34, 0.055, 0.04, bioGlow, p.hd);
  cyl(tank, [0, 1.2, 0], 0.37, 0.37, 1.62, glass, p.hd, 'y', 12, 28);
  cyl(tank, [0, 2.08, 0], 0.52, 0.48, 0.18, p.primary, p.hd, 'y', 10, 28);
  cyl(tank, [0, 2.24, 0], 0.36, 0.46, 0.16, p.dark, p.hd, 'y', 10, 28);
  orb(tank, [0, 2.33, 0], 0.16, p.accent, p.hd, [1, 0.65, 1]);
  radLoop(3, (_, sx, sz) => {
    cyl(tank, [sx * 0.47, 1.2, sz * 0.47], 0.036, 0.036, 1.72, p.edge, p.hd);
    for (const cy of [0.52, 1.88]) cyl(tank, [sx * 0.47, cy, sz * 0.47], 0.058, 0.058, 0.12, p.alloy, p.hd);
  });
  const stem = group(root, 'SpecimenStem', [0, 1.2, 0]);
  cyl(stem, [0, 0, 0], 0.034, 0.042, 1.66, p.alloy, p.hd);
  orb(stem, [0, 0.04, 0], 0.17, bioGlow, p.hd, [0.95, 1.35, 0.95]);
  radLoop(6, (_, sx, sz, i) => {
    cyl(stem, [sx * 0.14, i % 2 === 0 ? 0.14 : -0.1, sz * 0.14], 0.012, 0.068, 0.34, i % 2 === 0 ? p.accent : bioGlow, p.hd, 'y', 6, 16)
      .rotation.set(sz * 0.52, 0, -sx * 0.52);
  });
  const collar = group(root, 'ScannerCollar', [0, 1.22, 0]);
  ringBand(collar, [0, 0, 0], 0.53, 0.085, 0.14, p.primary, p.hd);
  ringBand(collar, [0, 0.08, 0], 0.51, 0.045, 0.035, p.accent, p.hd);
  for (const s of [-1, 1]) {
    shell(collar, [s * 0.55, 0, 0], [0.16, 0.22, 0.24], p.dark, 0.24);
    cyl(collar, [s * 0.45, 0, 0], 0.055, 0.055, 0.08, p.optic, p.hd, 'x');
  }
  const bioPack = group(root, 'BioFilterPack', [0, 0.58, -0.52]);
  box(bioPack, [0, 0, 0.08], [0.38, 0.18, 0.14], p.edge);
  for (const sx of [-0.14, 0.14]) cyl(bioPack, [sx, 0, -0.06], 0.095, 0.095, 0.46, p.alloy, p.hd);
  if (detail) {
    boltRing(tank, 0, 0.41, 0, 0.46, 6, p);
    boltRing(tank, 0, 2.18, 0, 0.45, 6, p);
    hose(bioPack, [[-0.14, 0.22, -0.06], [-0.18, 0.38, 0.06], [-0.08, 0.42, 0.18]], 0.02, p.tire, p.hd);
    if (p.hd) ringBand(tank, [0, 2.26, 0], 0.39, 0.035, 0.04, p.accent, true);
  }
  root.animations = [new T.AnimationClip('Scan stasis specimen', 4, [spinTrack('ScannerCollar', 'y', 4, 1), spinTrack('SpecimenStem', 'y', 4, -1)])];
}

export function buildQuadDroneChargingDock(root: T.Group, p: Finish, detail: boolean) {
  const dock = group(root, 'ChargingDock'), amber = glowMat('#ffa928', 0.9, 'Charge beacon');
  shell(dock, [0, 0.09, 0], [1.74, 0.18, 1.74], p.dark, 0.24);
  shell(dock, [0, 0.19, 0], [1.46, 0.06, 1.46], p.primary, 0.24);
  ringBand(dock, [0, 0.235, 0], 0.44, 0.06, 0.032, amber, p.hd);
  cyl(dock, [0, 0.26, 0], 0.24, 0.28, 0.1, p.edge, p.hd);
  for (const sx of [-0.66, 0.66]) for (const sz of [-0.66, 0.66]) {
    shell(dock, [sx, 0.46, sz], [0.22, 0.62, 0.22], p.primary, 0.26);
    shell(dock, [sx, 0.8, sz], [0.26, 0.1, 0.26], p.dark, 0.24);
    box(dock, [sx, 0.5, sz + (sz > 0 ? 0.115 : -0.115)], [0.09, 0.34, 0.03], amber);
    strut(dock, [sx * 0.78, 0.2, sz * 0.78], [sx * 0.94, 0.52, sz * 0.94], 0.032, p.edge, p.hd ? 10 : 6);
  }
  shell(dock, [0, 0.74, -0.68], [0.46, 1.16, 0.34], p.primary, 0.22);
  box(dock, [0, 0.88, -0.49], [0.28, 0.44, 0.04], p.inset);
  box(dock, [0, 0.96, -0.46], [0.18, 0.2, 0.03], amber);
  cyl(dock, [0, 1.38, -0.68], 0.04, 0.075, 0.24, p.alloy, p.hd);
  orb(dock, [0, 1.5, -0.68], 0.065, p.accent, p.hd);
  for (const [name, sx] of [['ClampArmL', -0.48], ['ClampArmR', 0.48]] as const) {
    const dir = sx < 0 ? 1 : -1, arm = group(root, name, [sx, 0.24, 0]);
    cyl(arm, [0, 0, 0], 0.068, 0.068, 0.16, p.edge, p.hd, 'z');
    strut(arm, [0, 0, 0], [dir * 0.12, 0.28, 0], 0.036, p.alloy, p.hd ? 12 : 6);
    strut(arm, [dir * 0.12, 0.28, 0], [dir * 0.24, 0.24, 0], 0.032, p.alloy, p.hd ? 12 : 6);
    shell(arm, [dir * 0.25, 0.22, 0], [0.09, 0.14, 0.2], p.accent, 0.24);
  }
  const drone = group(root, 'DockedDrone', [0, 0.31, 0]);
  for (const sx of [-0.14, 0.14]) box(drone, [sx, 0.03, 0], [0.04, 0.06, 0.34], p.tire);
  shell(drone, [0, 0.16, 0], [0.36, 0.16, 0.4], p.accent, 0.26);
  shell(drone, [0, 0.26, -0.02], [0.24, 0.08, 0.26], p.dark, 0.24);
  orb(drone, [0, 0.16, 0.21], 0.055, p.optic, p.hd);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    strut(drone, [sx * 0.14, 0.16, sz * 0.14], [sx * 0.34, 0.2, sz * 0.34], 0.024, p.dark, p.hd ? 10 : 6);
    ringBand(drone, [sx * 0.36, 0.21, sz * 0.36], 0.14, 0.028, 0.06, p.primary, p.hd);
    cyl(drone, [sx * 0.36, 0.21, sz * 0.36], 0.035, 0.035, 0.065, p.alloy, p.hd);
    box(drone, [sx * 0.36, 0.22, sz * 0.36], [0.2, 0.014, 0.03], p.accent);
  }
  if (detail) {
    for (const sx of [-0.36, 0.36]) box(dock, [sx, 0.23, 0.62], [0.22, 0.03, 0.08], p.accent);
    for (const fy of [0.46, 0.62, 0.78, 0.94]) box(dock, [0, fy, -0.86], [0.34, 0.04, 0.05], p.edge);
    hose(dock, [[-0.18, 0.36, -0.56], [-0.26, 0.28, -0.34], [-0.18, 0.24, -0.18]], 0.024, p.tire, p.hd);
    if (p.hd) for (const sx of [-0.52, 0.52]) fastener(dock, [sx, 0.23, 0.52], p, 0.028);
  }
  root.animations = [new T.AnimationClip('Cycle drone clamps', 2.8, [
    rotationTrack('ClampArmL', 'z', [0, 0.75, 1.9, 2.8], [0, deg(42), deg(42), 0]),
    rotationTrack('ClampArmR', 'z', [0, 0.75, 1.9, 2.8], [0, deg(-42), deg(-42), 0]),
  ])];
}

export function buildVerticalHydroponicColumn(root: T.Group, p: Finish, detail: boolean) {
  const col = group(root, 'HydroponicTower'), leafD = bioMat('#378c49'), leafB = bioMat('#58bf5c');
  const growLed = glowMat('#b66eff', 0.9, 'Grow LED'), waterGlass = glassMat('#7be2f0', 0.32);
  cyl(col, [0, 0.18, 0], 0.56, 0.62, 0.36, p.dark, p.hd, 'y', 10, 28);
  cyl(col, [0, 0.38, 0], 0.59, 0.56, 0.08, p.primary, p.hd, 'y', 10, 28);
  cyl(col, [0, 1.44, 0], 0.19, 0.23, 2.08, p.primary, p.hd, 'y', 10, 28);
  cyl(col, [0, 0.2, 0.56], 0.055, 0.055, 0.26, waterGlass, p.hd);
  for (const sy of [0.06, 0.34]) cyl(col, [0, sy, 0.54], 0.072, 0.072, 0.06, p.edge, p.hd);
  const addPlantTier = (parent: T.Object3D, ty: number, offset: number) => {
    ringBand(parent, [0, ty, 0], 0.29, 0.08, 0.11, p.edge, p.hd);
    radLoop(4, (_, sx, sz) => {
      strut(parent, [sx * 0.18, ty, sz * 0.18], [sx * 0.44, ty + 0.04, sz * 0.44], 0.036, p.alloy, p.hd ? 10 : 6);
      cyl(parent, [sx * 0.44, ty + 0.08, sz * 0.44], 0.13, 0.095, 0.16, p.primary, p.hd);
      ringBand(parent, [sx * 0.44, ty + 0.15, sz * 0.44], 0.14, 0.028, 0.035, p.accent, p.hd);
      orb(parent, [sx * 0.44, ty + 0.22, sz * 0.44], 0.12, leafD, p.hd, [1.1, 0.85, 1.1]);
      orb(parent, [sx * 0.49, ty + 0.27, sz * 0.49], 0.085, leafB, p.hd, [1.1, 0.75, 1.1]);
      orb(parent, [sx * 0.38, ty + 0.28, sz * 0.38], 0.075, p.accent, p.hd);
    }, offset);
  };
  addPlantTier(col, 0.82, 0);
  addPlantTier(group(root, 'NutrientTurret', [0, 1.38, 0]), 0, Math.PI / 4);
  addPlantTier(col, 1.92, 0);
  const halo = group(root, 'GrowHalo', [0, 2.48, 0]);
  cyl(halo, [0, 0.02, 0], 0.22, 0.24, 0.16, p.dark, p.hd);
  ringBand(halo, [0, 0.02, 0], 0.62, 0.085, 0.095, p.primary, p.hd);
  torus(halo, [0, -0.04, 0], 0.56, 0.026, growLed, p.hd, 'y');
  radLoop(4, (_, sx, sz) => { strut(halo, [0, 0.02, 0], [sx * 0.58, 0.02, sz * 0.58], 0.026, p.alloy, p.hd ? 10 : 6); }, Math.PI / 4);
  const pump = group(root, 'PumpModule', [0.58, 0.22, 0]);
  shell(pump, [0, 0, 0], [0.22, 0.24, 0.28], p.edge, 0.22);
  cyl(pump, [0.02, 0.15, 0], 0.06, 0.06, 0.1, p.accent, p.hd);
  if (detail) {
    boltRing(col, 0, 0.43, 0, 0.5, 6, p);
    for (const sx of [-0.25, 0.25]) cyl(col, [sx, 1.38, -0.14], 0.022, 0.022, 2.02, p.alloy, p.hd);
    hose(pump, [[0, 0.16, -0.06], [-0.08, 0.26, -0.12], [-0.24, 0.22, -0.1]], 0.02, p.tire, p.hd);
    if (p.hd) ringBand(halo, [0, 0.075, 0], 0.6, 0.04, 0.03, p.accent, true);
  }
  root.animations = [new T.AnimationClip('Rotate grow halo', 4.4, [spinTrack('GrowHalo', 'y', 4.4, 1), spinTrack('NutrientTurret', 'y', 4.4, -1)])];
}

export function buildHighYieldPlasmaBattery(root: T.Group, p: Finish, detail: boolean) {
  const bat = group(root, 'PlasmaBattery'), plasma = glowMat('#ff7224', 0.95), glass = glassMat('#ffd8a8', 0.26);
  for (const sx of [-0.52, 0.52]) shell(bat, [sx, 0.07, 0], [0.24, 0.14, 1.04], p.dark, 0.2);
  for (const sz of [-0.36, 0.36]) box(bat, [0, 0.11, sz], [0.92, 0.08, 0.12], p.edge);
  shell(bat, [0, 0.24, 0], [1.28, 0.22, 0.94], p.primary, 0.2);
  shell(bat, [0, 0.68, -0.36], [1.14, 0.72, 0.22], p.dark, 0.2);
  box(bat, [0, 0.68, -0.48], [0.84, 0.12, 0.04], p.accent);
  for (const [cx, cz] of [[-0.36, 0.14], [0.36, 0.14], [0, -0.08]] as const) {
    cyl(bat, [cx, 0.38, cz], 0.2, 0.22, 0.12, p.edge, p.hd);
    cyl(bat, [cx, 0.7, cz], 0.135, 0.135, 0.64, plasma, p.hd);
    cyl(bat, [cx, 0.7, cz], 0.185, 0.185, 0.58, glass, p.hd, 'y', 10, 26);
    cyl(bat, [cx, 1.02, cz], 0.09, 0.15, 0.12, p.alloy, p.hd);
    radLoop(3, (_, sx, sz) => { strut(bat, [cx + sx * 0.2, 0.4, cz + sz * 0.2], [cx + sx * 0.2, 0.98, cz + sz * 0.2], 0.018, p.dark, p.hd ? 10 : 6); });
  }
  const cover = group(root, 'TerminalCover', [0, 1.04, -0.38]);
  cyl(cover, [0, 0, 0], 0.055, 0.055, 1.06, p.alloy, p.hd, 'x');
  shell(cover, [0, 0.12, 0.38], [1.28, 0.22, 0.94], p.primary, 0.26);
  shell(cover, [0, 0.24, 0.38], [0.92, 0.08, 0.62], p.dark, 0.24);
  for (const sx of [-0.46, 0.46]) box(cover, [sx, 0.14, 0.86], [0.16, 0.12, 0.04], p.accent);
  strut(cover, [-0.36, 0.32, 0.38], [0.36, 0.32, 0.38], 0.024, p.alloy, p.hd ? 10 : 6);
  for (const sx of [-0.36, 0.36]) strut(cover, [sx, 0.26, 0.38], [sx, 0.32, 0.38], 0.022, p.alloy, p.hd ? 10 : 6);
  wheelValve(group(root, 'LockValve', [0, 0.24, 0.5]), 0.125, 3, p);
  const sink = group(root, 'SideHeatsink', [0.66, 0.66, 0]);
  box(sink, [-0.04, 0, 0], [0.08, 0.64, 0.62], p.edge);
  for (let i = 0; i < 5; i++) box(sink, [0.03, -0.22 + i * 0.11, 0], [0.1, 0.036, 0.56], p.dark);
  box(sink, [0.04, 0, 0.31], [0.08, 0.34, 0.04], p.accent);
  if (detail) {
    box(bat, [-0.62, 0.66, 0], [0.08, 0.64, 0.62], p.dark);
    for (let i = 0; i < 5; i++) box(bat, [-0.68, 0.44 + i * 0.11, 0], [0.1, 0.036, 0.56], p.edge);
    for (const sx of [-0.46, 0.46]) fastener(bat, [sx, 0.24, 0.48], p, 0.028).rotation.x = HPI;
    if (p.hd) for (const sx of [-0.36, 0.36]) fastener(cover, [sx, 0.28, 0.14], p, 0.026);
  }
  root.animations = [new T.AnimationClip('Service plasma battery', 3.2, [
    rotationTrack('LockValve', 'z', [0, 0.8, 2.2, 3.2], [0, deg(270), deg(270), 0]),
    rotationTrack('TerminalCover', 'x', [0, 0.9, 2.2, 3.2], [0, deg(-76), deg(-76), 0]),
  ])];
}

export function buildMedbayDiagnosticScanner(root: T.Group, p: Finish, detail: boolean) {
  const med = group(root, 'MedbayBase'), scanGlow = glowMat('#2ee6ff', 0.9), holo = holoMat('#38e8ff', 0.4);
  shell(med, [0, 0.08, 0], [1.28, 0.16, 2.28], p.dark, 0.18);
  for (const sx of [-0.54, 0.54]) box(med, [sx, 0.19, 0], [0.1, 0.07, 2.16], p.alloy);
  shell(med, [0, 0.44, -0.34], [0.56, 0.62, 0.58], p.primary, 0.22);
  shell(med, [0, 0.58, -0.84], [0.92, 0.92, 0.44], p.primary, 0.2);
  box(med, [0, 0.72, -1.07], [0.66, 0.12, 0.035], p.accent);
  shell(med, [0, 0.78, 0.08], [0.82, 0.14, 1.98], p.edge, 0.2);
  shell(med, [0, 0.88, -0.68], [0.62, 0.11, 0.34], p.accent, 0.28);
  shell(med, [0, 0.87, -0.02], [0.74, 0.09, 0.92], p.primary, 0.22);
  shell(med, [0, 0.86, 0.72], [0.68, 0.08, 0.54], p.primary, 0.22);
  const archRest: Point = [0, 0.19, 0.14], arch = group(root, 'ScannerArch', archRest);
  for (const sx of [-0.54, 0.54]) {
    shell(arch, [sx, 0.08, 0], [0.18, 0.16, 0.44], p.dark, 0.22);
    shell(arch, [sx, 0.62, 0], [0.16, 0.96, 0.32], p.primary, 0.2);
  }
  for (const [ax, ay, rz] of [[-0.44, 1.24, -0.45], [-0.22, 1.46, -0.95], [0, 1.54, 0], [0.22, 1.46, 0.95], [0.44, 1.24, 0.45]] as const) {
    shell(arch, [ax, ay, 0], [0.28, 0.18, 0.34], p.primary, 0.22).rotation.z = rz;
    box(arch, [ax * 0.88, ay - 0.08, 0], [0.22, 0.04, 0.16], scanGlow).rotation.z = rz;
  }
  shell(arch, [0, 1.66, 0], [0.36, 0.12, 0.38], p.accent, 0.26);
  const arm = group(root, 'HoloMonitorArm', [0.4, 1.04, -0.82]);
  cyl(arm, [0, 0.12, 0], 0.048, 0.056, 0.28, p.alloy, p.hd);
  strut(arm, [0, 0.24, 0], [0.24, 0.34, 0.44], 0.028, p.alloy, p.hd ? 10 : 6);
  displayUnit(arm, [0.24, 0.34, 0.48], 0.44, 0.3, 0.06, p.dark, holo, -0.35, -0.15);
  const tray = group(root, 'MedTray', [-0.46, 0.84, -0.78]);
  strut(tray, [0.06, -0.06, 0], [-0.14, 0, 0], 0.024, p.alloy, p.hd ? 10 : 6);
  shell(tray, [-0.16, 0.02, 0], [0.28, 0.045, 0.42], p.alloy, 0.22);
  for (const vz of [-0.1, 0, 0.1]) cyl(tray, [-0.16, 0.09, vz], 0.026, 0.026, 0.11, p.accent, p.hd);
  if (detail) {
    for (const sx of [-0.44, 0.44]) strut(med, [sx, 0.88, -0.4], [sx, 0.88, 0.72], 0.018, p.alloy, p.hd ? 10 : 6);
    for (const z of [-0.92, 0.92]) for (const sx of [-0.54, 0.54]) fastener(med, [sx, 0.23, z], p, 0.026);
    if (p.hd) hose(med, [[-0.24, 0.44, -0.62], [-0.36, 0.32, -0.3], [-0.26, 0.44, -0.1]], 0.024, p.tire, true);
  }
  root.animations = [new T.AnimationClip('Run diagnostic scan', 3.6, [
    slideTrack('ScannerArch', archRest, 'z', [0, 0.9, 1.8, 2.7, 3.6], [0, 0.48, -0.42, 0.48, 0]),
    rotationTrack('HoloMonitorArm', 'y', [0, 0.9, 2.7, 3.6], [0, deg(-26), deg(22), 0]),
  ])];
}

export function buildNeonCyberdeckTerminal(root: T.Group, p: Finish, detail: boolean) {
  const desk = group(root, 'CyberdeckStation'), neonMag = glowMat('#ff3399', 0.95), neonCyan = glowMat('#2ce8ff', 0.9);
  for (const sx of [-0.58, 0.58]) {
    shell(desk, [sx, 0.07, 0], [0.38, 0.14, 1.04], p.dark, 0.2);
    shell(desk, [sx, 0.48, -0.02], [0.34, 0.7, 0.88], p.primary, 0.18);
    for (const dy of [0.32, 0.5, 0.68]) box(desk, [sx, dy, 0.44], [0.22, 0.07, 0.035], dy === 0.5 ? neonMag : p.inset);
  }
  shell(desk, [0, 0.46, -0.3], [0.92, 0.56, 0.28], p.dark, 0.18);
  shell(desk, [0, 0.86, 0.04], [1.66, 0.12, 0.96], p.dark, 0.2);
  box(desk, [0, 0.86, 0.53], [1.46, 0.05, 0.03], p.accent);
  shell(desk, [-0.04, 0.95, 0.26], [0.76, 0.07, 0.34], p.edge, 0.22).rotation.x = 0.16;
  for (let r = 0; r < 3; r++) box(desk, [-0.04, 0.985 + (1 - r) * 0.012, 0.19 + r * 0.075], [0.64, 0.025, 0.045], r === 2 ? neonCyan : p.dark).rotation.x = 0.16;
  shell(desk, [0, 1.28, -0.26], [0.24, 0.78, 0.22], p.edge, 0.2);
  displayUnit(desk, [0, 1.38, -0.14], 0.72, 0.5, 0.2, p.primary, neonCyan, 0, -0.08);
  for (const [sx, ry] of [[-0.6, 0.44], [0.6, -0.44]] as const) {
    strut(desk, [0, 1.36, -0.22], [sx * 0.82, 1.36, -0.06], 0.032, p.alloy, p.hd ? 10 : 6);
    displayUnit(desk, [sx, 1.38, 0.04], 0.52, 0.44, 0.18, p.primary, neonMag, ry, -0.06);
  }
  for (const sx of [-0.52, 0.52]) strut(desk, [sx, 1.56, -0.06], [sx, 1.66, -0.06], 0.026, p.alloy, p.hd ? 10 : 6);
  shell(desk, [0, 1.66, -0.06], [1.38, 0.1, 0.24], p.dark, 0.24);
  box(desk, [0, 1.66, 0.07], [1.14, 0.04, 0.03], neonMag);
  const fan = group(root, 'CoolingFan', [-0.58, 0.5, -0.47]);
  ringBand(desk, [-0.58, 0.5, -0.45], 0.14, 0.032, 0.08, p.edge, p.hd, 'z');
  cyl(fan, [0, 0, 0], 0.042, 0.042, 0.06, p.alloy, p.hd, 'z');
  radLoop(5, (a, sx, sz) => { box(fan, [sz * 0.075, sx * 0.075, 0], [0.09, 0.028, 0.018], p.accent).rotation.z = a; });
  const boom = group(root, 'NeuralJackBoom', [0.66, 0.94, 0.12]);
  cyl(boom, [0, 0.05, 0], 0.055, 0.065, 0.12, p.alloy, p.hd);
  strut(boom, [0, 0.1, 0], [0.06, 0.34, 0.2], 0.022, p.edge, p.hd ? 10 : 6);
  strut(boom, [0.06, 0.34, 0.2], [-0.08, 0.28, 0.42], 0.02, p.alloy, p.hd ? 10 : 6);
  cyl(boom, [-0.1, 0.27, 0.45], 0.04, 0.048, 0.1, p.dark, p.hd, 'z');
  orb(boom, [-0.1, 0.27, 0.51], 0.038, neonMag, p.hd);
  const cart = group(root, 'DataCartridge', [-0.62, 0.91, 0.18]);
  shell(cart, [0, 0.07, 0], [0.16, 0.18, 0.24], p.accent, 0.22);
  box(cart, [0, 0.12, 0.13], [0.09, 0.04, 0.025], neonCyan);
  if (detail) {
    for (const y of [0.34, 0.46, 0.58]) box(desk, [0.58, y, -0.47], [0.22, 0.045, 0.03], p.inset);
    hose(desk, [[0.46, 0.66, -0.36], [0.26, 0.72, -0.44], [0.12, 1.04, -0.34]], 0.024, p.tire, p.hd);
    if (p.hd) for (const sx of [-0.58, 0.58]) fastener(desk, [sx, 0.86, 0.48], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Boot cyberdeck', 3, [
    spinTrack('CoolingFan', 'z', 3, 4),
    rotationTrack('NeuralJackBoom', 'y', [0, 0.85, 2.1, 3], [0, deg(-62), deg(-62), 0]),
  ])];
}
