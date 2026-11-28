import type * as T from 'three';
import type { Finish } from '../../parts';
import {
  HPI, addArmorTorso, addBackPack, addBracers, addGear, addHandSword, addHingedVisor,
  addPauldrons, addRivets, addWideHat, box, cone, group, hose, lathe, ring, shell,
  sphere, startCharacter, strut, torus, tube,
} from './characters-adventure-kit';

export function buildBattleWarmage(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Horned arcane circlet crown on j.head
  torus(j.head, [0, 0.215, 0.01], 0.245, 0.024, p.accent, p).rotation.x = HPI;
  sphere(j.head, [0, 0.23, 0.262], [0.044, 0.056, 0.03], p.optic, p);
  for (const s of [-1, 1]) {
    hose(j.head, [[s * 0.2, 0.21, 0.14], [s * 0.31, 0.34, 0.15], [s * 0.24, 0.48, 0.05]], 0.024, p.accent, p);
    cone(j.head, [s * 0.23, 0.52, 0.03], 0.026, 0.1, p.accent, p, 10).rotation.set(-0.2, 0, s * 0.25);
  }
  // Battle cuirass + runic waist faulds
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, collar: true });
  box(j.chest, [0, 0.02, 0.265], [0.13, 0.13, 0.026], p.accent).rotation.z = Math.PI / 4;
  sphere(j.chest, [0, 0.02, 0.285], [0.045, 0.045, 0.028], p.optic, p);
  for (const [at, sz] of [
    [[0, -0.11, 0.22], [0.3, 0.32, 0.042]], [[0, -0.11, -0.21], [0.3, 0.32, 0.042]],
    [[0.31, -0.09, 0.01], [0.048, 0.29, 0.27]], [[-0.31, -0.09, 0.01], [0.048, 0.29, 0.27]],
  ] as const) {
    shell(j.hips, [...at], [...sz], p.primary, 0.3);
    if (detail) box(j.hips, [at[0] * 1.07, at[1] - 0.06, at[2] * 1.07], [sz[0] * 0.72, 0.026, sz[2] * 0.72], p.accent);
  }
  addBracers(j, p.alloy, p.accent);
  // Detachable armored WarmageMantle on j.chest
  const mantle = group(j.chest, 'WarmageMantle', [0, 0.1, -0.01]);
  lathe(mantle, [0, -0.02, 0], [
    [0.44, -0.13], [0.4, 0.04], [0.24, 0.155], [0.19, 0.155], [0.36, 0.02], [0.4, -0.13], [0.44, -0.13],
  ], p.alloy, p, 16);
  for (const s of [-1, 1]) {
    const wing = shell(mantle, [s * 0.36, 0.03, 0], [0.22, 0.13, 0.32], p.alloy, 0.42);
    wing.rotation.z = -s * 0.26;
    box(wing, [s * 0.04, 0.072, 0], [0.16, 0.026, 0.26], p.accent);
  }
  shell(mantle, [0, -0.34, -0.285], [0.56, 0.62, 0.072], p.primary, 0.34);
  if (detail) box(mantle, [0, -0.6, -0.295], [0.52, 0.048, 0.08], p.accent);
  // Rigged spinning SpellFocus orb on j.rightHand (y [0, 360])
  const focus = group(j.rightHand, 'SpellFocus', [0, -0.02, 0.09]);
  tube(focus, [0, -0.06, 0], 0.024, 0.026, 0.2, p.dark, 12);
  cone(focus, [0, 0.06, 0], 0.065, 0.08, p.accent, p, 12).rotation.x = Math.PI;
  strut(focus, [0, 0.06, 0], [0, 0.22, 0], 0.016, p.accent, 10);
  torus(focus, [0, 0.22, 0], 0.13, 0.018, p.accent, p);
  torus(focus, [0, 0.22, 0], 0.13, 0.018, p.accent, p).rotation.y = HPI;
  sphere(focus, [0, 0.22, 0], [0.068, 0.085, 0.068], p.optic, p);
  if (detail) torus(focus, [0, 0.22, 0], 0.105, 0.012, p.alloy, p).rotation.x = HPI / 2;
}

export function buildVikingShieldmaiden(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable horned iron NordicHelm on j.head
  const helm = group(j.head, 'NordicHelm', [0, 0.12, 0]);
  sphere(helm, [0, 0.065, 0], [0.275, 0.225, 0.275], p.alloy, p);
  torus(helm, [0, 0.01, 0], 0.268, 0.026, p.accent, p).rotation.x = HPI;
  box(helm, [0, 0.18, 0], [0.048, 0.18, 0.52], p.accent);
  box(helm, [0, -0.05, 0.28], [0.044, 0.17, 0.032], p.alloy);
  for (const s of [-1, 1]) {
    tube(helm, [s * 0.255, 0.12, 0.02], 0.046, 0.052, 0.06, p.accent, 12).rotation.z = -s * 1.1;
    hose(helm, [[s * 0.25, 0.12, 0.02], [s * 0.42, 0.22, 0.06], [s * 0.36, 0.42, 0.09]], 0.036, p.stencil, p);
    cone(helm, [s * 0.34, 0.47, 0.1], 0.036, 0.12, p.stencil, p, 10).rotation.set(0.15, 0, s * 0.32);
  }
  addRivets(helm, [[-0.14, 0.02, 0.26], [0.14, 0.02, 0.26]], p, detail, 0.015, HPI);
  // Nordic brigandine tunic + lush fur pelt shoulder mantle
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, skirtH: 0.3, baldric: true });
  shell(j.chest, [0, 0.15, -0.02], [0.78, 0.18, 0.52], p.stencil, 0.52);
  shell(j.chest, [0, -0.14, -0.29], [0.6, 0.54, 0.085], p.stencil, 0.44);
  for (const s of [-1, 1]) {
    sphere(j.chest, [s * 0.36, 0.14, 0.02], [0.15, 0.12, 0.2], p.stencil, p);
    tube(j.chest, [s * 0.18, 0.13, 0.268], 0.048, 0.048, 0.026, p.accent, 12).rotation.x = HPI;
  }
  addBracers(j, p.dark, p.accent);
  // Battleaxe on j.rightHand
  const axe = group(j.rightHand, 'VikingAxe', [0, -0.05, 0.04]);
  axe.rotation.x = 0.72;
  tube(axe, [0, 0.12, 0], 0.025, 0.027, 0.74, p.dark, 12);
  sphere(axe, [0, -0.25, 0], [0.036, 0.036, 0.036], p.accent, p);
  tube(axe, [0, 0.42, 0], 0.038, 0.038, 0.08, p.accent, 12);
  shell(axe, [0, 0.42, 0.13], [0.038, 0.28, 0.22], p.alloy, 0.42);
  box(axe, [0, 0.42, 0.235], [0.022, 0.3, 0.038], p.edge);
  cone(axe, [0, 0.43, -0.09], 0.032, 0.11, p.alloy, p, 10).rotation.x = -HPI;
  // Rigged rotating ShieldArm round shield on j.leftForeArm (y [-35, 35])
  const shield = group(j.leftForeArm, 'ShieldArm', [0.125, -0.12, 0.02]);
  tube(shield, [-0.04, 0, 0], 0.088, 0.088, 0.16, p.dark, 10).rotation.z = HPI;
  tube(shield, [0.04, 0, 0], 0.28, 0.28, 0.044, p.primary, 16).rotation.z = HPI;
  torus(shield, [0.04, 0, 0], 0.282, 0.036, p.accent, p).rotation.y = HPI;
  sphere(shield, [0.078, 0, 0], [0.052, 0.09, 0.09], p.alloy, p);
  for (let i = 0; i < (detail ? 4 : 2); i++) {
    box(shield, [0.066, 0, 0], [0.024, 0.52, 0.032], p.accent).rotation.x = (i * Math.PI) / (detail ? 4 : 2);
  }
}

export function buildRoninWanderer(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable conical sedge KasaHat on j.head
  const kasa = group(j.head, 'KasaHat', [0, 0.245, 0]);
  lathe(kasa, [0, 0, 0], [
    [0.2, -0.01], [0.49, -0.055], [0.5, -0.022], [0.04, 0.19], [0.005, 0.205], [0.005, 0.155], [0.2, -0.01],
  ], p.accent, p, 18);
  tube(kasa, [0, 0.01, 0], 0.23, 0.23, 0.055, p.dark, 14);
  sphere(kasa, [0, 0.205, 0], [0.048, 0.034, 0.048], p.dark, p);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      strut(kasa, [0, 0.19, 0], [Math.cos(a) * 0.47, -0.025, Math.sin(a) * 0.47], 0.011, p.primary, 10);
    }
  }
  // Travel haori cloak, kimono lapels, broad obi & hip twin scabbards
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.accent, skirtH: 0.36, lapels: true, cape: true });
  shell(j.hips, [0, 0.072, 0.014], [0.63, 0.15, 0.45], p.accent, 0.36);
  for (const fore of [j.leftForeArm, j.rightForeArm]) shell(fore, [0, -0.14, -0.01], [0.21, 0.31, 0.26], p.primary, 0.36);
  for (const [yOff, len, zOff] of [[0.03, 0.72, -0.16], [-0.045, 0.52, -0.11]] as const) {
    const sc = tube(j.hips, [0.3, yOff, zOff], 0.028, 0.024, len, p.dark, 12);
    sc.rotation.set(1.36, 0, -0.12);
    if (detail) tube(j.hips, [0.3, yOff + 0.02, zOff + 0.14], 0.033, 0.033, 0.06, p.accent, 10).rotation.set(1.36, 0, -0.12);
  }
  // Rigged pivoting KatanaHilt blade on j.rightHand (x [-35, 35])
  addHandSword(j.rightHand, 'KatanaHilt', p, detail, {
    bladeLen: 0.72, bladeW: 0.042, bladeT: 0.018, guardW: 0.11,
    bladeMat: p.alloy, guardMat: p.accent, gripMat: p.accent, tiltX: 0.92,
  });
}

export function buildPlagueApothecary(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Dark cowl + detachable wide ApothecaryHat on j.head
  sphere(j.head, [0, 0.11, -0.02], [0.278, 0.27, 0.275], p.dark, p);
  addWideHat(j.head, 'ApothecaryHat', p, detail, {
    brimR: 0.44, crownR: 0.23, crownH: 0.18, hatMat: p.primary, bandMat: p.accent,
  });
  // Rigged hinged long PlagueBeak mask on j.head (x [-20, 30])
  const beak = group(j.head, 'PlagueBeak', [0, 0.1, 0.21]);
  shell(beak, [0, 0, 0.05], [0.34, 0.22, 0.12], p.stencil, 0.42);
  for (const s of [-1, 1]) {
    torus(beak, [s * 0.088, 0.035, 0.11], 0.052, 0.015, p.accent, p);
    tube(beak, [s * 0.088, 0.035, 0.105], 0.042, 0.042, 0.02, p.optic, 12).rotation.x = HPI;
  }
  const snout = cone(beak, [0, -0.055, 0.21], 0.09, 0.34, p.stencil, p, 12);
  snout.rotation.x = HPI + 0.32;
  snout.scale.set(0.85, 1, 0.72);
  if (detail) box(beak, [0, -0.02, 0.19], [0.02, 0.03, 0.22], p.accent).rotation.x = 0.32;
  // Oilskin storm coat + shoulder rain capelet + vial belt
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, skirtH: 0.42, lapels: true, buttons: true });
  lathe(j.chest, [0, 0.07, 0], [
    [0.42, -0.12], [0.39, 0.03], [0.23, 0.14], [0.18, 0.14], [0.35, 0.01], [0.39, -0.12], [0.42, -0.12],
  ], p.primary, p, 16);
  for (const x of [-0.22, -0.12, 0.12, 0.22]) {
    tube(j.hips, [x, 0.045, 0.235], 0.028, 0.028, 0.11, p.optic, 10);
    tube(j.hips, [x, 0.105, 0.235], 0.032, 0.032, 0.028, p.accent, 10);
  }
  // Swinging brass censer on j.rightHand
  const censer = group(j.rightHand, 'ApothecaryCenser', [0, -0.06, 0.05]);
  torus(censer, [0, -0.01, 0], 0.055, 0.014, p.accent, p);
  strut(censer, [0, -0.04, 0], [0, -0.22, 0], 0.014, p.alloy, 10);
  sphere(censer, [0, -0.29, 0], [0.088, 0.098, 0.088], p.accent, p);
  torus(censer, [0, -0.29, 0], 0.092, 0.018, p.optic, p).rotation.x = HPI;
  cone(censer, [0, -0.4, 0], 0.038, 0.065, p.accent, p, 10).rotation.x = Math.PI;
}

export function buildCyberneticNetrunner(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Cybernetic temple ports + rigged flip-up NeuralVisor on j.head (x [0, -52])
  for (const s of [-1, 1]) {
    tube(j.head, [s * 0.265, 0.09, -0.02], 0.055, 0.055, 0.05, p.dark, 12).rotation.z = HPI;
    tube(j.head, [s * 0.292, 0.09, -0.02], 0.03, 0.03, 0.02, p.accent, 10).rotation.z = HPI;
  }
  const visor = addHingedVisor(j.head, 'NeuralVisor', p, {
    y: 0.125, z: 0.04, width: 0.5, height: 0.15, depth: 0.13, frameMat: p.dark, glassMat: p.optic, browMat: p.accent,
  });
  box(visor, [-0.21, 0.02, 0.265], [0.04, 0.11, 0.04], p.accent);
  // Asymmetric tech collar jacket + wrist cyberdeck
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, skirtH: 0.24 });
  shell(j.chest, [0, 0.22, -0.17], [0.46, 0.18, 0.07], p.primary, 0.36);
  const colL = shell(j.chest, [0.275, 0.23, 0.02], [0.072, 0.22, 0.28], p.primary, 0.34);
  colL.rotation.z = -0.18;
  box(colL, [0.042, 0.01, 0.01], [0.02, 0.16, 0.21], p.accent);
  const colR = shell(j.chest, [-0.265, 0.18, 0.02], [0.068, 0.14, 0.24], p.dark, 0.34);
  colR.rotation.z = 0.16;
  box(j.chest, [-0.12, 0.04, 0.265], [0.16, 0.034, 0.022], p.accent);
  // Wrist cyberdeck on j.leftForeArm
  shell(j.leftForeArm, [0.095, -0.14, 0.02], [0.075, 0.2, 0.15], p.dark, 0.34);
  box(j.leftForeArm, [0.138, -0.13, 0.02], [0.018, 0.13, 0.105], p.optic);
  if (detail) box(j.leftForeArm, [0.142, -0.21, 0.02], [0.018, 0.028, 0.1], p.accent);
  // Detachable DataSpine on j.chest back
  const spine = addBackPack(j.chest, 'DataSpine', p, { y: 0.01, z: -0.41, strapMat: p.dark });
  shell(spine, [0, 0, 0.01], [0.18, 0.56, 0.14], p.dark, 0.34);
  for (let i = 0; i < (detail ? 5 : 4); i++) {
    const vy = -0.2 + i * 0.1;
    shell(spine, [0, vy, -0.075], [0.26 - Math.abs(i - 2) * 0.025, 0.062, 0.11], p.alloy, 0.34);
    box(spine, [0, vy, -0.138], [0.12, 0.026, 0.022], i % 2 === 0 ? p.accent : p.optic);
  }
  for (const s of [-1, 1]) {
    hose(spine, [[s * 0.1, 0.22, -0.02], [s * 0.18, 0.25, 0.14], [s * 0.16, 0.17, 0.34]], 0.02, p.accent, p);
  }
}

export function buildOrbitalStarMarine(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Angular power-armor helmet + rigged hinged MarineVisor (x [0, -45])
  shell(j.head, [0, 0.165, -0.01], [0.54, 0.36, 0.54], p.primary, 0.44);
  box(j.head, [0, 0.355, -0.03], [0.085, 0.065, 0.38], p.accent);
  shell(j.head, [0, -0.05, 0.2], [0.42, 0.15, 0.24], p.dark, 0.42);
  addHingedVisor(j.head, 'MarineVisor', p, {
    y: 0.115, z: 0.06, width: 0.46, height: 0.18, depth: 0.14, frameMat: p.dark, glassMat: p.optic, browMat: p.accent,
  });
  // Heavy power-armor cuirass + layered pauldrons + bracers
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, collar: true });
  for (const s of [-1, 1]) {
    shell(j.chest, [s * 0.16, 0.05, 0.268], [0.24, 0.21, 0.075], p.primary, 0.36);
    if (detail) box(j.chest, [s * 0.16, 0.05, 0.312], [0.14, 0.032, 0.018], p.accent);
  }
  addPauldrons(j, p, detail, 'layered');
  addBracers(j, p.primary, p.accent);
  // Detachable JumpPack on j.chest back
  const jp = addBackPack(j.chest, 'JumpPack', p, { y: 0.02, z: -0.44, strapMat: p.dark });
  shell(jp, [0, 0.03, -0.02], [0.46, 0.5, 0.22], p.primary, 0.36);
  box(jp, [0, 0.08, -0.14], [0.22, 0.12, 0.03], p.accent);
  for (const s of [-1, 1]) {
    tube(jp, [s * 0.22, 0.01, -0.05], 0.11, 0.12, 0.42, p.dark, 14);
    cone(jp, [s * 0.22, -0.25, -0.06], 0.11, 0.14, p.alloy, p, 14);
    torus(jp, [s * 0.22, 0.21, -0.05], 0.095, 0.024, p.accent, p).rotation.x = HPI;
    const fin = box(jp, [s * 0.34, 0.04, -0.09], [0.14, 0.28, 0.034], p.primary);
    fin.rotation.y = s * 0.35;
  }
  addRivets(jp, [[-0.17, 0.2, -0.135], [0.17, 0.2, -0.135]], p, detail, 0.016, -HPI);
}

export function buildGalacticBountyHunter(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // T-visor helm with rigged flip-down Rangefinder stalk on j.head (x [0, 85])
  sphere(j.head, [0, 0.13, 0], [0.278, 0.245, 0.278], p.primary, p);
  tube(j.head, [0, 0.04, 0], 0.275, 0.282, 0.22, p.primary, 16);
  box(j.head, [0, 0.125, 0.272], [0.34, 0.065, 0.042], p.inset);
  box(j.head, [0, 0.02, 0.275], [0.068, 0.2, 0.04], p.inset);
  box(j.head, [0, 0.168, 0.274], [0.36, 0.028, 0.044], p.accent);
  for (const s of [-1, 1]) shell(j.head, [s * 0.28, 0.07, 0], [0.055, 0.13, 0.11], p.alloy, 0.34);
  const stalk = group(j.head, 'Rangefinder', [-0.295, 0.11, 0]);
  tube(stalk, [0, 0, 0], 0.034, 0.034, 0.05, p.accent, 10).rotation.z = HPI;
  strut(stalk, [0, 0, 0], [0, 0.3, 0], 0.014, p.alloy, 10);
  shell(stalk, [0.065, 0.305, 0.015], [0.14, 0.068, 0.065], p.dark, 0.3);
  box(stalk, [0.07, 0.305, 0.052], [0.075, 0.038, 0.016], p.optic);
  // Chest beskar plates + left shoulder cape
  addArmorTorso(j, p, detail, { bodyMat: p.dark, trimMat: p.accent, beltMat: p.dark });
  for (const s of [-1, 1]) shell(j.chest, [s * 0.15, 0.08, 0.268], [0.23, 0.17, 0.045], p.primary, 0.34);
  box(j.chest, [0, 0.07, 0.285], [0.07, 0.07, 0.028], p.accent).rotation.z = Math.PI / 4;
  shell(j.chest, [0, -0.08, 0.265], [0.36, 0.11, 0.04], p.primary, 0.34);
  shell(j.chest, [0.27, 0.16, -0.01], [0.28, 0.09, 0.36], p.accent, 0.42);
  shell(j.chest, [0.32, -0.14, -0.19], [0.26, 0.56, 0.07], p.accent, 0.36);
  addBracers(j, p.primary, p.accent);
  // Detachable BountyPack missile jetpack on j.chest back
  const pack = addBackPack(j.chest, 'BountyPack', p, { y: 0.01, z: -0.44, strapMat: p.dark });
  shell(pack, [0, -0.02, -0.01], [0.42, 0.44, 0.18], p.primary, 0.36);
  for (const s of [-1, 1]) {
    tube(pack, [s * 0.18, -0.02, -0.05], 0.085, 0.085, 0.42, p.accent, 14);
    sphere(pack, [s * 0.18, 0.19, -0.05], [0.085, 0.07, 0.085], p.alloy, p);
    cone(pack, [s * 0.18, -0.26, -0.05], 0.075, 0.11, p.alloy, p, 12);
  }
  tube(pack, [0, 0.16, -0.05], 0.058, 0.068, 0.36, p.alloy, 12);
  cone(pack, [0, 0.43, -0.05], 0.068, 0.2, p.accent, p, 12);
  if (detail) box(pack, [0, -0.05, -0.12], [0.16, 0.18, 0.035], p.accent);
}

export function buildClockworkAutomaton(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, false);
  // Brass gearhead crown on bot head (bot head top is y = 0.2295)
  tube(j.head, [0, 0.23, 0], 0.14, 0.17, 0.07, p.primary, 14);
  addGear(j.head, [0, 0.28, 0], 0.185, 8, 0.042, p.primary, p.accent);
  sphere(j.head, [0, 0.33, 0], [0.075, 0.065, 0.075], p.accent, p);
  for (const s of [-1, 1]) addGear(j.head, [s * 0.265, 0.07, 0], 0.082, 6, 0.036, p.primary, p.alloy, [0, 0, HPI]);
  // Brass boiler torso + furnace grate chest core (botOffset clears Suit bot front detail)
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, collar: true, botOffset: true });
  torus(j.chest, [0, 0.01, 0.292], 0.145, 0.03, p.primary, p);
  tube(j.chest, [0, 0.01, 0.285], 0.132, 0.132, 0.034, p.optic, 14).rotation.x = HPI;
  for (const x of [-0.072, 0, 0.072]) box(j.chest, [x, 0.01, 0.312], [0.022, 0.25, 0.02], p.dark);
  box(j.chest, [0, 0.01, 0.312], [0.25, 0.024, 0.02], p.dark);
  for (const [arm, s] of [[j.leftArm, 1], [j.rightArm, -1]] as const) {
    addGear(arm, [s * 0.135, 0.02, 0], 0.095, 6, 0.04, p.primary, p.accent, [0, 0, HPI]);
  }
  addBracers(j, p.primary, p.accent);
  // Rigged spinning WindupKey directly on j.chest back (z [0, 360]) — stays connected if SteamPipes hidden
  const key = group(j.chest, 'WindupKey', [0, -0.01, -0.37]);
  tube(key, [0, 0, -0.07], 0.042, 0.042, 0.24, p.accent, 12).rotation.x = HPI;
  box(key, [0, 0, -0.19], [0.042, 0.26, 0.036], p.accent);
  for (const s of [-1, 1]) torus(key, [0, s * 0.115, -0.215], 0.095, 0.024, p.primary, p);
  if (detail) sphere(key, [0, 0, -0.225], [0.042, 0.042, 0.042], p.alloy, p);
  // Detachable twin SteamPipes on j.chest back
  const pipes = group(j.chest, 'SteamPipes', [0, 0.04, -0.33]);
  for (const s of [-1, 1]) {
    strut(pipes, [s * 0.14, 0.02, 0.12], [s * 0.24, 0.02, -0.06], 0.042, p.dark, 10);
    strut(pipes, [s * 0.14, -0.12, 0.12], [s * 0.24, -0.12, -0.06], 0.034, p.dark, 10);
    tube(pipes, [s * 0.24, 0.16, -0.06], 0.052, 0.062, 0.62, p.primary, 14);
    tube(pipes, [s * 0.24, 0.48, -0.06], 0.074, 0.052, 0.075, p.accent, 14);
    if (detail) torus(pipes, [s * 0.24, 0.22, -0.06], 0.062, 0.016, p.accent, p).rotation.x = HPI;
  }
}

export function buildMysticAlchemist(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Turban hood + rigged swiveling AlchemyLens monocle on j.head (z [-40, 40])
  sphere(j.head, [0, 0.16, -0.01], [0.295, 0.24, 0.295], p.primary, p);
  for (const [y, tilt] of [[0.2, 0.14], [0.27, -0.12]] as const) {
    const fold = torus(j.head, [0, y, 0], 0.255, 0.055, p.primary, p);
    fold.rotation.set(HPI + tilt, 0, tilt);
  }
  sphere(j.head, [0, 0.24, 0.285], [0.05, 0.062, 0.032], p.accent, p);
  sphere(j.head, [0, 0.24, 0.305], [0.028, 0.036, 0.018], p.optic, p);
  const lens = group(j.head, 'AlchemyLens', [0.165, 0.135, 0.225]);
  tube(lens, [0, 0, -0.02], 0.032, 0.032, 0.06, p.accent, 10).rotation.x = HPI;
  strut(lens, [0, 0, 0.01], [-0.075, -0.02, 0.05], 0.014, p.accent, 10);
  torus(lens, [-0.08, -0.02, 0.065], 0.062, 0.016, p.accent, p);
  tube(lens, [-0.08, -0.02, 0.065], 0.052, 0.052, 0.02, p.optic, 12).rotation.x = HPI;
  if (detail) torus(lens, [-0.08, -0.02, 0.095], 0.044, 0.012, p.alloy, p);
  // Phial bandolier vest
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark, skirtH: 0.34, lapels: true, baldric: true });
  for (let i = 0; i < (detail ? 4 : 3); i++) {
    const t = i / (detail ? 3 : 2);
    const px = -0.15 + t * 0.3;
    const py = 0.11 - t * 0.22;
    const ph = tube(j.chest, [px, py, 0.285], 0.024, 0.024, 0.095, p.optic, 10);
    ph.rotation.z = -0.55;
    tube(j.chest, [px + 0.025, py + 0.042, 0.285], 0.028, 0.028, 0.026, p.accent, 10).rotation.z = -0.55;
  }
  // Detachable copper AlembicPack on j.chest back
  const pack = addBackPack(j.chest, 'AlembicPack', p, { y: 0.02, z: -0.44, strapMat: p.dark });
  shell(pack, [0, -0.04, 0.03], [0.42, 0.44, 0.1], p.dark, 0.34);
  sphere(pack, [-0.06, -0.02, -0.08], [0.15, 0.16, 0.15], p.accent, p);
  tube(pack, [-0.06, 0.19, -0.08], 0.052, 0.078, 0.18, p.accent, 14);
  sphere(pack, [-0.06, 0.29, -0.08], [0.085, 0.075, 0.085], p.accent, p);
  tube(pack, [0.15, -0.04, -0.08], 0.068, 0.068, 0.32, p.optic, 14);
  for (const y of [-0.2, 0.12]) tube(pack, [0.15, y, -0.08], 0.075, 0.075, 0.036, p.accent, 12);
  hose(pack, [[-0.06, 0.31, -0.08], [0.06, 0.34, -0.13], [0.15, 0.21, -0.08], [0.15, 0.13, -0.08]], 0.018, p.alloy, p);
}

export function buildShadowShinobi(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Ninja cowl + metallic forehead plate
  sphere(j.head, [0, 0.11, -0.01], [0.275, 0.268, 0.275], p.primary, p);
  shell(j.head, [0, 0.01, 0.22], [0.36, 0.16, 0.14], p.dark, 0.45);
  torus(j.head, [0, 0.195, 0], 0.268, 0.026, p.accent, p).rotation.x = HPI;
  shell(j.head, [0, 0.195, 0.272], [0.24, 0.082, 0.036], p.alloy, 0.32);
  addRivets(j.head, [[-0.095, 0.195, 0.294], [0.095, 0.195, 0.294]], p, detail, 0.012, HPI);
  // Stealth tunic + crossed harness + shuriken forearm bracers
  addArmorTorso(j, p, detail, { bodyMat: p.primary, trimMat: p.accent, beltMat: p.dark });
  hose(j.chest, [[-0.2, 0.17, 0.2], [0.19, -0.17, 0.22]], 0.026, p.dark, p);
  hose(j.chest, [[0.2, 0.17, 0.2], [-0.19, -0.17, 0.22]], 0.026, p.dark, p);
  torus(j.chest, [0, 0.195, 0.01], 0.22, 0.056, p.accent, p).rotation.x = HPI;
  addBracers(j, p.dark, p.accent);
  for (const [fore, s] of [[j.leftForeArm, 1], [j.rightForeArm, -1]] as const) {
    for (let i = 0; i < (detail ? 2 : 1); i++) {
      box(fore, [s * 0.125, -0.14, 0.01], [0.018, 0.11, 0.032], p.alloy).rotation.x = i * HPI;
    }
  }
  // Rigged billowing ShinobiScarf tail on j.chest (x [-25, 35])
  const scarf = group(j.chest, 'ShinobiScarf', [0.13, 0.185, -0.17]);
  hose(scarf, [[0, 0, 0.04], [0.08, -0.02, -0.16], [0.16, -0.14, -0.38], [0.12, -0.26, -0.56]], 0.044, p.accent, p);
  hose(scarf, [[0, -0.02, 0.04], [0.02, -0.09, -0.14], [0.06, -0.24, -0.34]], 0.034, p.accent, p);
  // Detachable crossed TwinScabbards on j.chest back
  const scabs = addBackPack(j.chest, 'TwinScabbards', p, { y: 0.01, z: -0.4, strapMat: p.dark });
  shell(scabs, [0, 0, 0.01], [0.28, 0.34, 0.09], p.dark, 0.34);
  for (const s of [-1, 1]) {
    const blade = group(scabs, '', [0, 0.02, -0.055 + (s > 0 ? 0.022 : -0.022)]);
    blade.rotation.z = s * 0.56;
    tube(blade, [0, -0.04, 0], 0.028, 0.024, 0.68, p.dark, 12);
    tube(blade, [0, 0.38, 0], 0.024, 0.024, 0.22, p.accent, 12);
    box(blade, [0, 0.28, 0], [0.1, 0.022, 0.042], p.alloy);
  }
}

export { ring };
