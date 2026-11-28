import type * as T from 'three';
import type { Finish } from '../../parts';
import {
  HPI, addArmorTorso, addBackPack, addBracers, addGear, addHandSword, addHingedVisor,
  addRivets, addWideHat, box, cone, group, hose, lathe, ring, shell,
  sphere, startCharacter, strut, torus, tube,
} from './characters-adventure-kit';

export function buildSpaceExobotanist(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Sealed survey bubble helm + rigged hinged BioVisor on j.head (x [0, -48])
  sphere(j.head, [0, 0.115, 0], [0.292, 0.29, 0.288], p.primary, p);
  for (const s of [-1, 1]) shell(j.head, [s * 0.288, 0.13, 0.03], [0.06, 0.075, 0.1], p.dark, 0.34);
  const visor = group(j.head, 'BioVisor', [0, 0.115, 0.03]);
  sphere(visor, [0, 0, 0.165], [0.242, 0.19, 0.165], p.optic, p);
  box(visor, [0, 0.175, 0.165], [0.34, 0.038, 0.13], p.accent);
  // Sealed suit torso + chest bio-analyzer telemetry pad
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, collar: true });
  const pad = group(j.chest, 'AnalyzerPad', [0, 0.01, 0.278]);
  shell(pad, [0, 0, 0], [0.32, 0.23, 0.11], p.primary, 0.34);
  box(pad, [-0.04, 0.02, 0.062], [0.16, 0.12, 0.02], p.optic);
  box(pad, [0.09, 0.02, 0.064], [0.065, 0.11, 0.022], p.accent);
  if (detail) {
    for (const x of [-0.09, -0.03, 0.03]) box(pad, [x, -0.072, 0.062], [0.032, 0.026, 0.018], p.accent);
  }
  addBracers(j, p.primary, p.accent);
  // Detachable glass BioDomePack with alien fern on j.chest back
  const dome = addBackPack(j.chest, 'BioDomePack', p, { y: 0.02, z: -0.44, strapMat: p.alloy });
  tube(dome, [0, -0.14, -0.05], 0.21, 0.19, 0.24, p.primary, 16);
  ring(dome, [0, -0.02, -0.05], 0.22, 0.032, 0.044, p.alloy);
  sphere(dome, [0, 0.08, -0.05], [0.17, 0.22, 0.17], p.optic, p);
  for (const a of [0, HPI]) torus(dome, [0, 0.08, -0.05], 0.215, 0.018, p.alloy, p, Math.PI).rotation.y = a;
  for (const [fx, fz, rz] of [[-0.08, -0.04, 0.42], [0.08, -0.04, -0.42], [0, -0.12, 0.12]] as const) {
    const frond = sphere(dome, [fx, 0.27, fz], [0.065, 0.17, 0.032], p.accent, p);
    frond.rotation.z = rz;
  }
  if (detail) tube(dome, [0, 0.31, -0.05], 0.042, 0.052, 0.045, p.alloy, 12);
}

export function buildHeavyMechaPilot(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Flight-sync helm + rigged hinged MechaVisor on j.head (x [0, -52])
  sphere(j.head, [0, 0.125, -0.01], [0.278, 0.255, 0.28], p.primary, p);
  for (const s of [-1, 1]) {
    shell(j.head, [s * 0.282, 0.1, 0], [0.068, 0.14, 0.14], p.dark, 0.34);
    strut(j.head, [s * 0.28, 0.15, -0.04], [s * 0.33, 0.36, -0.1], 0.014, p.accent, 10);
  }
  addHingedVisor(j.head, 'MechaVisor', p, {
    y: 0.12, z: 0.05, width: 0.46, height: 0.18, depth: 0.13, frameMat: p.dark, glassMat: p.optic, browMat: p.accent,
  });
  // Exo-harness chest ribs + cooling shoulder fins
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, collar: true });
  for (const y of [-0.08, 0.01, 0.1]) box(j.chest, [0, y, 0.268], [0.44, 0.034, 0.036], p.dark);
  tube(j.chest, [0, 0.01, 0.285], 0.065, 0.065, 0.032, p.optic, 14).rotation.x = HPI;
  for (const [arm, s] of [[j.leftArm, 1], [j.rightArm, -1]] as const) {
    shell(arm, [s * 0.06, 0.06, 0], [0.22, 0.14, 0.28], p.dark, 0.36);
    const fin = shell(arm, [s * 0.12, 0.22, -0.03], [0.055, 0.28, 0.22], p.primary, 0.34);
    fin.rotation.z = -s * 0.28;
    box(fin, [0, 0.145, 0], [0.075, 0.05, 0.245], p.accent);
    if (detail) {
      for (const y of [-0.04, 0.03]) box(fin, [s * 0.032, y, 0], [0.02, 0.024, 0.17], p.alloy);
    }
  }
  addBracers(j, p.dark, p.accent);
  // Detachable SyncPack on j.chest back
  const sync = addBackPack(j.chest, 'SyncPack', p, { y: 0.02, z: -0.43, strapMat: p.dark });
  shell(sync, [0, 0, -0.02], [0.46, 0.48, 0.2], p.dark, 0.34);
  for (const s of [-1, 1]) {
    tube(sync, [s * 0.14, 0, -0.11], 0.075, 0.075, 0.38, p.accent, 14);
    hose(sync, [[s * 0.14, 0.19, -0.04], [s * 0.21, 0.24, 0.16], [s * 0.18, 0.16, 0.36]], 0.022, p.tire, p);
  }
  box(sync, [0, 0, -0.132], [0.065, 0.32, 0.028], p.optic);
}

export function buildForestDruidShaman(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Hooded wildwood wrap + detachable branching AntlerCrown on j.head
  sphere(j.head, [0, 0.11, -0.02], [0.275, 0.26, 0.275], p.primary, p);
  const crown = group(j.head, 'AntlerCrown', [0, 0.21, 0]);
  torus(crown, [0, 0, 0], 0.255, 0.028, p.accent, p).rotation.x = HPI;
  sphere(crown, [0, 0.01, 0.268], [0.042, 0.052, 0.028], p.optic, p);
  for (const s of [-1, 1]) {
    strut(crown, [s * 0.16, 0.01, 0.04], [s * 0.3, 0.22, -0.02], 0.024, p.stencil, 10);
    strut(crown, [s * 0.3, 0.22, -0.02], [s * 0.44, 0.42, -0.06], 0.018, p.stencil, 10);
    strut(crown, [s * 0.26, 0.16, 0], [s * 0.18, 0.34, 0.08], 0.016, p.stencil, 10);
    if (detail) strut(crown, [s * 0.37, 0.32, -0.04], [s * 0.31, 0.48, 0.04], 0.014, p.stencil, 10);
  }
  // Layered leaf mantle + belt charms
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.accent, skirtH: 0.38, cape: true });
  for (let i = 0; i < (detail ? 10 : 8); i++) {
    const a = (i / (detail ? 10 : 8)) * Math.PI * 2;
    const leaf = sphere(j.chest, [Math.sin(a) * 0.34, 0.09, Math.cos(a) * 0.26], [0.11, 0.16, 0.045], i % 2 === 0 ? p.primary : p.accent, p);
    leaf.rotation.set(0.28, a, 0);
  }
  for (const [cx, cz] of [[-0.22, 0.22], [-0.1, 0.235], [0.1, 0.235], [0.22, 0.22]] as const) {
    cone(j.hips, [cx, -0.02, cz], 0.028, 0.11, p.stencil, p, 10).rotation.x = Math.PI;
  }
  // Rigged swaying DruidTotem staff on j.rightHand (z [-25, 25])
  const staff = group(j.rightHand, 'DruidTotem', [0, -0.04, 0.05]);
  tube(staff, [0, 0.06, 0], 0.026, 0.024, 1.18, p.accent, 12);
  torus(staff, [0, 0.72, 0], 0.135, 0.024, p.accent, p);
  strut(staff, [0, 0.62, 0], [0, 0.72, 0], 0.018, p.accent, 10);
  sphere(staff, [0, 0.72, 0], [0.058, 0.068, 0.058], p.optic, p);
  for (const s of [-1, 1]) strut(staff, [s * 0.12, 0.76, 0], [s * 0.22, 0.94, 0], 0.016, p.stencil, 10);
}

export function buildArenaGladiator(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Crested bronze murmillo helm + rigged hinged ArenaVisor grille on j.head (x [0, -48])
  sphere(j.head, [0, 0.12, 0], [0.278, 0.25, 0.278], p.accent, p);
  lathe(j.head, [0, 0.02, -0.02], [[0.24, -0.02], [0.36, -0.06], [0.37, -0.03], [0.25, 0.02], [0.24, -0.02]], p.accent, p, 16);
  shell(j.head, [0, 0.37, -0.02], [0.065, 0.14, 0.44], p.accent, 0.36);
  for (let i = 0; i < (detail ? 6 : 4); i++) {
    const t = i / (detail ? 5 : 3);
    sphere(j.head, [0, 0.48 - t * 0.05, 0.16 - t * 0.42], [0.055, 0.095, 0.088], p.primary, p);
  }
  const visor = group(j.head, 'ArenaVisor', [0, 0.11, 0.05]);
  shell(visor, [0, -0.03, 0.215], [0.38, 0.25, 0.09], p.inset, 0.44);
  torus(visor, [0, -0.03, 0.255], 0.165, 0.026, p.accent, p);
  for (const x of [-0.085, 0, 0.085]) box(visor, [x, -0.03, 0.268], [0.022, 0.26, 0.02], p.accent);
  for (const y of [-0.08, 0.02]) box(visor, [0, y, 0.268], [0.28, 0.022, 0.02], p.accent);
  // Gladiator harness + asymmetric spiked right manica arm guard + gladius
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.accent, baldric: true });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    box(j.hips, [Math.sin(a) * 0.28, -0.09, Math.cos(a) * 0.2], [0.09, 0.24, 0.035], p.primary).rotation.y = a;
  }
  sphere(j.rightArm, [-0.04, 0.03, 0], [0.18, 0.15, 0.19], p.accent, p);
  for (const z of [-0.08, 0, 0.08]) cone(j.rightArm, [-0.22, 0.06, z], 0.028, 0.11, p.alloy, p, 10).rotation.z = HPI;
  addBracers(j, p.accent, p.alloy, ['right']);
  for (const y of [-0.1, -0.19]) cone(j.rightForeArm, [-0.15, y, 0], 0.024, 0.09, p.alloy, p, 10).rotation.z = HPI;
  addHandSword(j.rightHand, 'Gladius', p, detail, {
    bladeLen: 0.48, bladeW: 0.068, bladeT: 0.022, guardW: 0.15,
    bladeMat: p.alloy, guardMat: p.accent, gripMat: p.dark, tiltX: 0.9,
  });
  // Detachable GladiatorBuckler on j.leftForeArm
  const buck = group(j.leftForeArm, 'GladiatorBuckler', [0.125, -0.12, 0.02]);
  tube(buck, [-0.04, 0, 0], 0.088, 0.088, 0.16, p.dark, 10).rotation.z = HPI;
  tube(buck, [0.035, 0, 0], 0.23, 0.23, 0.042, p.accent, 16).rotation.z = HPI;
  torus(buck, [0.055, 0, 0], 0.18, 0.022, p.primary, p).rotation.y = HPI;
  cone(buck, [0.09, 0, 0], 0.055, 0.09, p.alloy, p, 12).rotation.z = -HPI;
}

export function buildSkyshipCorsair(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Aviator cap + rigged flip-up CorsairGoggles on j.head (x [0, -45])
  sphere(j.head, [0, 0.14, -0.01], [0.275, 0.225, 0.278], p.dark, p);
  for (const s of [-1, 1]) shell(j.head, [s * 0.265, 0.01, -0.01], [0.065, 0.2, 0.16], p.dark, 0.36);
  const gog = group(j.head, 'CorsairGoggles', [0, 0.155, 0.04]);
  torus(gog, [0, 0, 0], 0.268, 0.022, p.dark, p).rotation.x = HPI;
  for (const s of [-1, 1]) {
    tube(gog, [s * 0.092, 0.005, 0.252], 0.058, 0.062, 0.056, p.accent, 14).rotation.x = HPI;
    tube(gog, [s * 0.092, 0.005, 0.282], 0.044, 0.044, 0.016, p.optic, 12).rotation.x = HPI;
  }
  strut(gog, [-0.04, 0.005, 0.26], [0.04, 0.005, 0.26], 0.014, p.accent, 10);
  // Buckled skycoat + shearling collar
  addArmorTorso(j, p, detail, {
    bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, skirtH: 0.4, lapels: true, buttons: true,
  });
  torus(j.chest, [0, 0.195, 0.005], 0.225, 0.062, p.stencil, p).rotation.x = HPI;
  addBracers(j, p.primary, p.accent);
  // Detachable ribbed glider CorsairWings on j.chest back
  const wings = addBackPack(j.chest, 'CorsairWings', p, { y: 0.04, z: -0.41, strapMat: p.dark });
  shell(wings, [0, 0, 0], [0.34, 0.38, 0.14], p.dark, 0.34);
  for (const s of [-1, 1]) {
    strut(wings, [s * 0.12, 0.14, -0.04], [s * 0.92, 0.36, -0.22], 0.024, p.accent, 10);
    for (const [rx, ry, rz] of [[0.42, -0.14, -0.12], [0.68, -0.06, -0.18], [0.92, 0.1, -0.24]] as const) {
      strut(wings, [s * 0.14, 0.08, -0.04], [s * rx, ry, rz], 0.016, p.accent, 10);
    }
    const inner = shell(wings, [s * 0.36, 0.08, -0.11], [0.44, 0.34, 0.036], p.stencil, 0.32);
    inner.rotation.set(0, -s * 0.22, s * 0.22);
    const outer = shell(wings, [s * 0.72, 0.18, -0.19], [0.42, 0.28, 0.034], p.primary, 0.32);
    outer.rotation.set(0, -s * 0.24, s * 0.32);
  }
  addRivets(wings, [[-0.1, 0.12, -0.075], [0.1, 0.12, -0.075]], p, detail, 0.016, -HPI);
}

export function buildTempleMonk(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Serene monastic brow band + forehead mark
  torus(j.head, [0, 0.18, 0], 0.26, 0.02, p.accent, p).rotation.x = HPI;
  box(j.head, [0, 0.16, 0.265], [0.034, 0.062, 0.02], p.accent);
  // Asymmetric saffron robe drape + prayer bead mala
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.accent, skirtH: 0.42 });
  hose(j.chest, [[0.23, 0.18, 0.19], [0.02, 0.01, 0.278], [-0.22, -0.16, 0.21]], 0.048, p.primary, p);
  hose(j.chest, [[0.21, 0.18, 0.21], [0.02, 0.03, 0.298], [-0.2, -0.14, 0.225]], 0.018, p.accent, p);
  const beads = detail ? 12 : 8;
  for (let i = 0; i < beads; i++) {
    const a = (i / beads) * Math.PI * 2;
    sphere(j.chest, [Math.sin(a) * 0.22, 0.14 - Math.cos(a) * 0.1, Math.cos(a) * 0.245], [0.038, 0.038, 0.038], p.accent, p);
  }
  // Detachable back-slung PilgrimHat on j.chest back
  const hat = addBackPack(j.chest, 'PilgrimHat', p, { y: 0.02, z: -0.42, strapMat: p.dark });
  const coneHat = lathe(hat, [0, 0, -0.04], [
    [0.01, 0.19], [0.43, -0.02], [0.44, -0.05], [0.18, 0], [0.01, 0.14], [0.01, 0.19],
  ], p.stencil, p, 18);
  coneHat.rotation.x = -HPI + 0.14;
  torus(hat, [0, 0, -0.06], 0.43, 0.022, p.accent, p);
  // Rigged spinning PrayerWheel staff on j.rightHand (y [0, 360])
  const wheel = group(j.rightHand, 'PrayerWheel', [0, -0.04, 0.05]);
  tube(wheel, [0, 0.02, 0], 0.022, 0.024, 0.56, p.dark, 12);
  tube(wheel, [0, 0.26, 0], 0.096, 0.096, 0.2, p.accent, 16);
  for (const y of [0.16, 0.36]) ring(wheel, [0, y, 0], 0.11, 0.022, 0.028, p.primary);
  cone(wheel, [0, 0.42, 0], 0.055, 0.1, p.accent, p, 12);
  strut(wheel, [0.095, 0.26, 0], [0.165, 0.23, 0], 0.011, p.alloy, 10);
  sphere(wheel, [0.175, 0.225, 0], [0.028, 0.028, 0.028], p.accent, p);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(wheel, [Math.cos(a) * 0.1, 0.26, Math.sin(a) * 0.1], [0.016, 0.14, 0.016], p.primary).rotation.y = -a;
    }
  }
}

export function buildWastelandScavenger(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Scrap respirator gasmask + dust goggles on j.head
  sphere(j.head, [0, 0.13, -0.02], [0.275, 0.24, 0.275], p.primary, p);
  shell(j.head, [0, 0.01, 0.245], [0.24, 0.16, 0.14], p.dark, 0.42);
  for (const s of [-1, 1]) {
    const can = tube(j.head, [s * 0.115, -0.02, 0.305], 0.048, 0.048, 0.095, p.tire, 12);
    can.rotation.set(HPI, 0, -s * 0.42);
    torus(j.head, [s * 0.088, 0.13, 0.268], 0.055, 0.016, p.accent, p);
    tube(j.head, [s * 0.088, 0.13, 0.262], 0.044, 0.044, 0.02, p.optic, 12).rotation.x = HPI;
  }
  // Scavenger harness + spiked tire-tread right shoulder guard
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, baldric: true });
  shell(j.rightArm, [-0.04, 0.03, 0], [0.25, 0.19, 0.3], p.tire, 0.48);
  for (const z of [-0.09, 0, 0.09]) {
    box(j.rightArm, [-0.155, 0.04, z], [0.034, 0.13, 0.042], p.dark);
    cone(j.rightArm, [-0.21, 0.08, z], 0.026, 0.1, p.alloy, p, 10).rotation.z = HPI;
  }
  addBracers(j, p.dark, p.accent);
  // Rigged spinning ScrapRadar dish mounted directly on j.chest (connected even when SalvagePack is hidden!)
  strut(j.chest, [0.23, 0.16, -0.08], [0.25, 0.25, -0.14], 0.024, p.alloy, 10);
  const radar = group(j.chest, 'ScrapRadar', [0.25, 0.25, -0.14]);
  tube(radar, [0, 0.11, 0], 0.022, 0.028, 0.24, p.alloy, 10);
  const dish = lathe(radar, [0, 0.26, -0.02], [
    [0.01, -0.02], [0.16, 0.05], [0.17, 0.07], [0.02, 0.01], [0.01, -0.02],
  ], p.accent, p, 16);
  dish.rotation.x = 0.85;
  strut(radar, [0, 0.26, -0.02], [0, 0.34, 0.08], 0.012, p.alloy, 10);
  sphere(radar, [0, 0.35, 0.09], [0.028, 0.028, 0.028], p.optic, p);
  // Detachable SalvagePack crate on j.chest back
  const crate = addBackPack(j.chest, 'SalvagePack', p, { y: -0.03, z: -0.44, strapMat: p.dark });
  shell(crate, [0, -0.02, -0.04], [0.46, 0.44, 0.24], p.primary, 0.24);
  shell(crate, [0, 0.21, -0.04], [0.48, 0.085, 0.26], p.accent, 0.24);
  tube(crate, [-0.25, -0.04, -0.04], 0.062, 0.062, 0.3, p.alloy, 12);
  addRivets(crate, [[-0.18, 0.13, -0.168], [0.18, 0.13, -0.168], [-0.18, -0.17, -0.168], [0.18, -0.17, -0.168]], p, detail, 0.016, -HPI);
}

export function buildFrostPaladin(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable winged glacial FrostHelm on j.head
  const helm = group(j.head, 'FrostHelm', [0, 0.12, 0]);
  sphere(helm, [0, 0.065, 0], [0.278, 0.23, 0.278], p.primary, p);
  torus(helm, [0, 0.03, 0], 0.27, 0.028, p.accent, p).rotation.x = HPI;
  box(helm, [0, -0.04, 0.282], [0.046, 0.18, 0.03], p.accent);
  for (const x of [-0.09, 0, 0.09]) cone(helm, [x, 0.32 - Math.abs(x) * 0.4, 0.16], 0.034, 0.16, p.optic, p, 10);
  for (const s of [-1, 1]) {
    for (let k = 0; k < (detail ? 3 : 2); k++) {
      const w = box(helm, [s * (0.31 + k * 0.045), 0.17 + k * 0.085, -0.05 - k * 0.06], [0.14, 0.052, 0.03], p.accent);
      w.rotation.set(0, -s * 0.42, s * (0.48 + k * 0.16));
    }
  }
  // Glacial cuirass + fur capelet + crystal pauldrons
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.alloy, skirtH: 0.36, cape: true });
  torus(j.chest, [0, 0.18, 0], 0.255, 0.072, p.stencil, p).rotation.x = HPI;
  box(j.chest, [0, 0.02, 0.268], [0.14, 0.14, 0.032], p.optic).rotation.z = Math.PI / 4;
  for (const [arm, s] of [[j.leftArm, 1], [j.rightArm, -1]] as const) {
    shell(arm, [s * 0.05, 0.03, 0], [0.22, 0.15, 0.26], p.primary, 0.38);
    cone(arm, [s * 0.14, 0.17, 0], 0.058, 0.24, p.accent, p, 10).rotation.z = -s * 0.42;
    cone(arm, [s * 0.19, 0.07, 0.07], 0.044, 0.18, p.optic, p, 10).rotation.set(0.3, 0, -s * 0.72);
    if (detail) cone(arm, [s * 0.19, 0.07, -0.07], 0.04, 0.16, p.accent, p, 10).rotation.set(-0.3, 0, -s * 0.72);
  }
  addBracers(j, p.primary, p.accent);
  // Rigged tilting FrostBlade ice sword on j.rightHand (x [-35, 35])
  addHandSword(j.rightHand, 'FrostBlade', p, detail, {
    bladeLen: 0.7, bladeW: 0.088, bladeT: 0.026, guardW: 0.26,
    bladeMat: p.accent, guardMat: p.primary, gripMat: p.dark, tiltX: 0.85, iceRidge: true,
  });
}

export function buildChronoTinkerer(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Horologist brass headband + rigged hinged multi-lens ChronoLoupe on j.head (x [0, -55])
  torus(j.head, [0, 0.175, 0], 0.264, 0.024, p.accent, p).rotation.x = HPI;
  for (const s of [-1, 1]) addGear(j.head, [s * 0.275, 0.17, 0], 0.068, 6, 0.03, p.accent, p.alloy, [0, 0, HPI]);
  const loupe = group(j.head, 'ChronoLoupe', [0, 0.165, 0.05]);
  box(loupe, [0, 0.01, 0.23], [0.3, 0.026, 0.036], p.accent);
  for (const [lx, ly, lz, r] of [[0.09, -0.03, 0.255, 0.055], [0.11, -0.04, 0.295, 0.038], [-0.085, -0.03, 0.25, 0.05]] as const) {
    tube(loupe, [lx, ly, lz], r, r * 1.06, 0.04, p.accent, 14).rotation.x = HPI;
    tube(loupe, [lx, ly, lz + 0.02], r * 0.78, r * 0.78, 0.016, p.optic, 12).rotation.x = HPI;
  }
  // Horologist waistcoat + glowing hourglass chest core
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, skirtH: 0.34, lapels: true });
  torus(j.chest, [0, 0.01, 0.268], 0.135, 0.024, p.accent, p);
  cone(j.chest, [0, 0.06, 0.275], 0.065, 0.1, p.optic, p, 12).rotation.x = Math.PI;
  cone(j.chest, [0, -0.04, 0.275], 0.065, 0.1, p.accent, p, 12);
  for (const s of [-1, 1]) strut(j.chest, [s * 0.075, -0.09, 0.275], [s * 0.075, 0.11, 0.275], 0.012, p.accent, 10);
  addBracers(j, p.primary, p.accent);
  // Detachable clockface ChronoPack on j.chest back
  const pack = addBackPack(j.chest, 'ChronoPack', p, { y: 0.03, z: -0.44, strapMat: p.dark });
  tube(pack, [0, 0.02, -0.05], 0.255, 0.255, 0.15, p.primary, 16).rotation.x = HPI;
  torus(pack, [0, 0.02, -0.125], 0.25, 0.028, p.accent, p);
  tube(pack, [0, 0.02, -0.128], 0.215, 0.215, 0.018, p.stencil, 16).rotation.x = HPI;
  box(pack, [0, 0.08, -0.145], [0.024, 0.15, 0.018], p.dark);
  box(pack, [0.05, 0.04, -0.152], [0.12, 0.024, 0.018], p.dark).rotation.z = 0.35;
  for (const s of [-1, 1]) sphere(pack, [s * 0.17, 0.27, -0.06], [0.068, 0.068, 0.068], p.accent, p);
  strut(pack, [0, -0.18, -0.08], [0, -0.36, -0.08], 0.016, p.accent, 10);
  tube(pack, [0, -0.38, -0.08], 0.075, 0.075, 0.032, p.accent, 14).rotation.x = HPI;
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      sphere(pack, [Math.cos(a) * 0.18, 0.02 + Math.sin(a) * 0.18, -0.142], [0.018, 0.018, 0.014], p.accent, p);
    }
  }
}

export function buildRoyalMusketeer(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable plumed wide CavalierHat on j.head
  addWideHat(j.head, 'CavalierHat', p, detail, {
    brimR: 0.44, crownR: 0.23, crownH: 0.17, hatMat: p.primary, bandMat: p.accent, tiltZ: -0.1, plumeMat: p.stencil,
  });
  // Heraldic cross tabard + lace collar + powder-charger bandolier
  addArmorTorso(j, p, detail, {
    bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, skirtH: 0.38, baldric: true, cape: true,
  });
  torus(j.chest, [0, 0.195, 0.01], 0.225, 0.048, p.stencil, p).rotation.x = HPI;
  for (const z of [0.268, -0.33]) {
    box(j.chest, [0, 0.01, z], [0.052, 0.25, 0.024], p.accent);
    box(j.chest, [0, 0.02, z], [0.22, 0.052, 0.024], p.accent);
  }
  for (let i = 0; i < (detail ? 4 : 3); i++) {
    const t = i / (detail ? 3 : 2);
    tube(j.chest, [-0.15 + t * 0.3, 0.12 - t * 0.23, 0.295], 0.022, 0.022, 0.08, p.accent, 10).rotation.z = -0.5;
  }
  addBracers(j, p.primary, p.accent);
  // Empty hip scabbard on left hip
  tube(j.hips, [0.3, -0.02, -0.16], 0.022, 0.018, 0.68, p.dark, 10).rotation.set(1.38, 0, -0.12);
  // Rigged swept-hilt RapierBlade on j.rightHand (x [-35, 35])
  addHandSword(j.rightHand, 'RapierBlade', p, detail, {
    bladeLen: 0.78, bladeW: 0.032, bladeT: 0.018, guardW: 0.22,
    bladeMat: p.alloy, guardMat: p.accent, gripMat: p.dark, tiltX: 0.92, sweptBasket: true,
  });
}

export { addGear, ring };
