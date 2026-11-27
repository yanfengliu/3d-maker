import type * as T from 'three';
import { box, group, ring, shell, strut, tube, type Finish } from '../parts';
import {
  addPauldrons, addRivets, addStraps, cone, hose, lathe, sphere, startCharacter, torus,
  type CharacterAssetDef,
} from './characters-a';

function buildSpaceMedic(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Halo visor crown + comms mic
  const halo = torus(j.head, [0, 0.21, 0.02], 0.265, 0.026, p.primary, p);
  halo.rotation.x = Math.PI / 2;
  shell(j.head, [0, 0.145, 0.248], [0.38, 0.095, 0.08], p.optic, 0.55);
  box(j.head, [0, 0.21, 0.28], [0.16, 0.032, 0.024], p.accent);
  hose(j.head, [[0.26, 0.06, 0], [0.24, 0.0, 0.18], [0.1, -0.02, 0.27]], 0.012, p.dark, p);
  // Medical chest vest with raised cross emblem
  shell(j.chest, [0, 0.01, 0.015], [0.68, 0.4, 0.45], p.primary, 0.46);
  shell(j.chest, [0, 0.02, 0.248], [0.2, 0.2, 0.028], p.stencil, 0.35);
  box(j.chest, [0, 0.02, 0.268], [0.044, 0.135, 0.018], p.accent);
  box(j.chest, [0, 0.02, 0.268], [0.135, 0.044, 0.018], p.accent);
  // Cross badges on both shoulders
  for (const [arm, s] of [[j.leftArm, 1], [j.rightArm, -1]] as const) {
    shell(arm, [s * 0.125, -0.04, 0], [0.036, 0.145, 0.145], p.stencil, 0.35);
    box(arm, [s * 0.146, -0.04, 0], [0.016, 0.1, 0.032], p.accent);
    box(arm, [s * 0.146, -0.04, 0], [0.016, 0.032, 0.1], p.accent);
  }
  // Detachable MedPack with cryo canisters
  const pack = group(j.chest, 'MedPack', [0, -0.01, -0.42]);
  shell(pack, [0, 0, -0.03], [0.44, 0.44, 0.21], p.primary, 0.4);
  box(pack, [0, 0.01, -0.142], [0.056, 0.19, 0.02], p.accent);
  box(pack, [0, 0.01, -0.142], [0.19, 0.056, 0.02], p.accent);
  strut(pack, [-0.11, 0.25, -0.03], [0.11, 0.25, -0.03], 0.02, p.accent, 10);
  for (const s of [-1, 1]) {
    tube(pack, [s * 0.245, -0.02, -0.03], 0.042, 0.042, 0.28, p.optic, 12);
    if (detail) {
      tube(pack, [s * 0.245, 0.13, -0.03], 0.048, 0.048, 0.032, p.alloy, 10);
      tube(pack, [s * 0.245, -0.17, -0.03], 0.048, 0.048, 0.032, p.alloy, 10);
    }
  }
  addStraps(pack, p, 0.165, 0.18, p.accent);
  addRivets(pack, [[-0.17, 0.16, -0.138], [0.17, 0.16, -0.138], [-0.17, -0.16, -0.138], [0.17, -0.16, -0.138]], p, detail, 0.014, -Math.PI / 2);
}

function buildSamuraiWarden(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable KabutoHelm with sweeping golden crescent crest
  const helm = group(j.head, 'KabutoHelm', [0, 0.12, 0]);
  sphere(helm, [0, 0.05, 0], [0.275, 0.23, 0.275], p.dark, p);
  for (let i = 0; i < 3; i++) {
    const flap = lathe(helm, [0, -0.03 - i * 0.055, -0.02], [
      [0.24 + i * 0.04, -0.025], [0.27 + i * 0.04, -0.025], [0.25 + i * 0.035, 0.025], [0.22 + i * 0.035, 0.025], [0.24 + i * 0.04, -0.025],
    ], p.primary, p, 14);
    flap.scale.set(1.06, 1, 1.05);
  }
  sphere(helm, [0, 0.17, 0.265], [0.055, 0.055, 0.026], p.accent, p);
  for (const s of [-1, 1]) {
    const horn = box(helm, [s * 0.15, 0.29, 0.24], [0.055, 0.34, 0.024], p.accent);
    horn.rotation.set(0.18, -s * 0.25, -s * 0.56);
    const tip = cone(helm, [s * 0.255, 0.445, 0.215], 0.034, 0.13, p.accent, p, 8);
    tip.rotation.set(0.16, 0, -s * 0.28);
  }
  addRivets(helm, [[-0.14, 0.09, 0.24], [0.14, 0.09, 0.24]], p, detail, 0.015, Math.PI / 2);
  // Lamellar cuirass + layered pauldrons + waist sash & tassets
  shell(j.chest, [0, 0, 0.02], [0.68, 0.39, 0.44], p.primary, 0.42);
  for (const y of [-0.09, 0.01, 0.11]) box(j.chest, [0, y, 0.245], [0.46, 0.026, 0.022], p.accent);
  addPauldrons(j, p, detail, 'layered');
  shell(j.hips, [0, 0.075, 0.01], [0.57, 0.11, 0.39], p.accent, 0.38);
  for (const [at, sz] of [
    [[0, -0.09, 0.195], [0.34, 0.24, 0.045]],
    [[0, -0.09, -0.195], [0.34, 0.24, 0.045]],
    [[0.29, -0.08, 0], [0.05, 0.24, 0.26]],
    [[-0.29, -0.08, 0], [0.05, 0.24, 0.26]],
  ] as const) {
    shell(j.hips, [...at], [...sz], p.primary, 0.32);
    if (detail) box(j.hips, [at[0] * 1.06, at[1] - 0.08, at[2] * 1.06], [sz[0] * 0.85, 0.022, sz[2] * 0.85], p.accent);
  }
}

function buildSteampunkInventor(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Victorian top hat + brass goggles
  const hat = group(j.head, 'TopHat', [0, 0.25, 0]);
  tube(hat, [0, 0, 0], 0.35, 0.35, 0.032, p.dark, 16);
  tube(hat, [0, 0.18, 0], 0.245, 0.215, 0.34, p.dark, 16);
  tube(hat, [0, 0.055, 0], 0.228, 0.224, 0.075, p.primary, 16);
  for (const s of [-1, 1]) {
    tube(hat, [s * 0.095, 0.075, 0.235], 0.068, 0.072, 0.058, p.accent, 14).rotation.x = Math.PI / 2;
    tube(hat, [s * 0.095, 0.075, 0.265], 0.052, 0.052, 0.016, p.optic, 14).rotation.x = Math.PI / 2;
  }
  strut(hat, [-0.04, 0.075, 0.255], [0.04, 0.075, 0.255], 0.014, p.accent, 8);
  // Leather waistcoat + pocket chain + pneumatic gauntlet
  shell(j.chest, [0, 0, 0.02], [0.67, 0.39, 0.44], p.primary, 0.44);
  hose(j.chest, [[-0.02, 0.04, 0.245], [0.09, -0.05, 0.26], [0.19, 0.02, 0.245]], 0.012, p.accent, p);
  tube(j.chest, [-0.15, 0.06, 0.248], 0.055, 0.055, 0.026, p.accent, 12).rotation.x = Math.PI / 2;
  tube(j.rightForeArm, [0, -0.15, 0.01], 0.112, 0.118, 0.16, p.accent, 12);
  addRivets(j.chest, [[0, 0.1, 0.246], [0, 0.02, 0.246], [0, -0.06, 0.246]], p, detail, 0.014, Math.PI / 2);
  // Detachable SteamPack with spinning GearWheel
  const pack = group(j.chest, 'SteamPack', [0, -0.02, -0.43]);
  tube(pack, [0, -0.02, -0.02], 0.185, 0.185, 0.44, p.accent, 16);
  sphere(pack, [0, 0.2, -0.02], [0.185, 0.095, 0.185], p.accent, p);
  sphere(pack, [0, -0.24, -0.02], [0.185, 0.08, 0.185], p.dark, p);
  for (const s of [-1, 1]) {
    tube(pack, [s * 0.16, 0.31, -0.02], 0.036, 0.042, 0.28, p.edge, 12);
    if (detail) tube(pack, [s * 0.16, 0.45, -0.02], 0.048, 0.036, 0.032, p.accent, 12);
  }
  const gear = group(pack, 'GearWheel', [0, -0.01, -0.225]);
  const rim = torus(gear, [0, 0, 0], 0.125, 0.022, p.accent, p);
  tube(rim, [0, 0, 0], 0.04, 0.04, 0.04, p.dark, 10).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tooth = box(gear, [Math.cos(a) * 0.155, Math.sin(a) * 0.155, 0], [0.036, 0.028, 0.03], p.accent);
    tooth.rotation.z = a;
    if (detail && i % 2 === 0) strut(gear, [0, 0, 0], [Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0], 0.014, p.alloy, 8);
  }
  hose(pack, [[-0.17, 0.14, 0.02], [-0.24, 0.02, 0.18], [-0.2, -0.1, 0.35]], 0.02, p.accent, p);
  addStraps(pack, p, 0.17, 0.18, p.primary);
}

function buildForestRanger(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Pointed woodland hood
  sphere(j.head, [0, 0.1, -0.04], [0.285, 0.275, 0.285], p.primary, p);
  const tail = cone(j.head, [0, 0.19, -0.34], 0.17, 0.36, p.primary, p, 12);
  tail.rotation.x = -1.25;
  const trim = torus(j.head, [0, 0.08, 0.14], 0.23, 0.028, p.accent, p);
  trim.scale.set(1.06, 1.06, 0.7);
  // Ranger cloak, shoulder mantle & sculpted leaf cloak clasp
  shell(j.chest, [0, 0.08, -0.02], [0.69, 0.21, 0.45], p.primary, 0.52);
  shell(j.chest, [0, -0.22, -0.26], [0.58, 0.64, 0.075], p.primary, 0.38);
  const clasp = group(j.chest, 'LeafClasp', [0, 0.125, 0.24]);
  box(clasp, [0, 0, 0], [0.095, 0.125, 0.026], p.accent).rotation.z = Math.PI / 4;
  if (detail) {
    box(clasp, [-0.045, 0.02, 0.01], [0.055, 0.08, 0.018], p.primary).rotation.z = 0.5;
    box(clasp, [0.045, 0.02, 0.01], [0.055, 0.08, 0.018], p.primary).rotation.z = -0.5;
  }
  hose(j.chest, [[0.2, 0.18, 0.18], [0, 0, 0.255], [-0.21, -0.17, 0.19]], 0.026, p.accent, p);
  // Archer's bracer & hip pouches
  tube(j.leftForeArm, [0, -0.14, 0], 0.122, 0.122, 0.18, p.accent, 12);
  for (const s of [-1, 1]) shell(j.hips, [s * 0.29, 0.02, 0.06], [0.1, 0.14, 0.15], p.accent, 0.35);
  // Detachable ArrowQuiver slung diagonally across back
  const quiver = group(j.chest, 'ArrowQuiver', [0.04, 0.01, -0.4]);
  quiver.rotation.z = -0.34;
  tube(quiver, [0, -0.02, 0], 0.1, 0.075, 0.5, p.accent, 14);
  for (const y of [-0.14, 0.14]) tube(quiver, [0, y, 0], 0.104, 0.104, 0.036, p.dark, 12);
  const arrows: readonly [number, number][] = detail
    ? [[-0.04, -0.03], [0.04, -0.03], [0, 0.04], [-0.03, 0.03], [0.03, 0.02]]
    : [[-0.03, 0], [0.03, 0], [0, 0.03]];
  for (const [ax, az] of arrows) {
    strut(quiver, [ax, 0.15, az], [ax * 1.3, 0.42, az * 1.3], 0.01, p.edge, 8);
    box(quiver, [ax * 1.3, 0.39, az * 1.3], [0.042, 0.07, 0.01], p.stencil);
  }
}

function buildMechEngineer(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Hard-cap brow + hinged WeldingMask visor
  sphere(j.head, [0, 0.135, -0.01], [0.275, 0.23, 0.275], p.primary, p);
  const mask = group(j.head, 'WeldingMask', [0, 0.13, 0.06]);
  shell(mask, [0, -0.04, 0.215], [0.42, 0.33, 0.12], p.accent, 0.36);
  box(mask, [0, 0.01, 0.278], [0.28, 0.095, 0.024], p.inset);
  box(mask, [0, 0.01, 0.292], [0.22, 0.062, 0.014], p.optic);
  for (const s of [-1, 1]) tube(mask, [s * 0.24, 0, -0.02], 0.036, 0.036, 0.04, p.primary, 10).rotation.z = Math.PI / 2;
  // Heavy utility chest armor & shoulder brace
  shell(j.chest, [0, 0, 0.025], [0.67, 0.39, 0.44], p.primary, 0.38);
  shell(j.chest, [0, 0.04, 0.25], [0.32, 0.14, 0.04], p.accent, 0.35);
  box(j.chest, [0, 0.04, 0.274], [0.16, 0.07, 0.014], p.optic);
  addPauldrons(j, p, detail, 'brace');
  // Detachable ToolHarness exo-frame with wrench & power cells
  const harness = group(j.chest, 'ToolHarness', [0, -0.01, -0.42]);
  shell(harness, [0, -0.02, -0.02], [0.46, 0.44, 0.2], p.accent, 0.36);
  for (const s of [-1, 1]) {
    strut(harness, [s * 0.24, -0.24, -0.04], [s * 0.24, 0.28, -0.04], 0.022, p.primary, 10);
    tube(harness, [s * 0.13, -0.06, -0.145], 0.052, 0.052, 0.24, p.primary, 12);
    if (detail) tube(harness, [s * 0.13, 0.07, -0.145], 0.038, 0.038, 0.04, p.optic, 10);
  }
  strut(harness, [-0.24, 0.28, -0.04], [0.24, 0.28, -0.04], 0.022, p.primary, 10);
  // Clipped mechanical wrench on back
  box(harness, [0, 0.12, -0.15], [0.34, 0.042, 0.028], p.alloy).rotation.z = 0.25;
  torus(harness, [0.16, 0.16, -0.15], 0.045, 0.018, p.alloy, p, Math.PI * 1.5);
  addStraps(harness, p, 0.175, 0.19);
  addRivets(harness, [[-0.18, 0.16, -0.125], [0.18, 0.16, -0.125]], p, detail, 0.015, -Math.PI / 2);
}

function buildRoyalGuard(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable tall bearskin GuardShako
  const shako = group(j.head, 'GuardShako', [0, 0.22, 0]);
  tube(shako, [0, 0.24, 0], 0.245, 0.23, 0.48, p.tire, 16);
  sphere(shako, [0, 0.48, 0], [0.245, 0.12, 0.245], p.tire, p);
  shell(shako, [0, 0.12, 0.245], [0.14, 0.14, 0.03], p.accent, 0.35);
  hose(shako, [[-0.22, 0, 0.05], [-0.14, -0.22, 0.2], [0, -0.27, 0.24], [0.14, -0.22, 0.2], [0.22, 0, 0.05]], 0.014, p.accent, p);
  cone(shako, [0.24, 0.32, 0.02], 0.042, 0.22, p.stencil, p, 10);
  // Scarlet ceremonial tunic + gold frog braid + sash + gold epaulets
  shell(j.chest, [0, 0, 0.02], [0.67, 0.39, 0.45], p.primary, 0.42);
  tube(j.chest, [0, 0.195, 0], 0.165, 0.175, 0.075, p.primary, 14);
  tube(j.chest, [0, 0.225, 0], 0.17, 0.17, 0.022, p.accent, 14);
  hose(j.chest, [[-0.22, 0.17, 0.19], [0, 0, 0.27], [0.21, -0.17, 0.19]], 0.036, p.stencil, p);
  if (detail) {
    for (const y of [-0.1, -0.02, 0.06, 0.14]) box(j.chest, [0, y, 0.254], [0.26, 0.022, 0.018], p.accent);
  }
  addPauldrons(j, p, detail, 'epaulet');
  // Ceremonial belt + tunic skirt
  shell(j.hips, [0, 0.075, 0.01], [0.58, 0.115, 0.42], p.stencil, 0.35);
  box(j.hips, [0, 0.075, 0.228], [0.11, 0.1, 0.03], p.accent);
  shell(j.hips, [0, -0.09, 0.01], [0.58, 0.23, 0.42], p.primary, 0.42);
  shell(j.hips, [0, -0.195, 0.01], [0.59, 0.03, 0.43], p.accent, 0.42);
}

function buildPirateCaptain(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable TricornHat with 3 upturned brim panels & feather plume
  const hat = group(j.head, 'TricornHat', [0, 0.245, 0]);
  sphere(hat, [0, 0.07, 0], [0.235, 0.14, 0.235], p.primary, p);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 3;
    const brim = group(hat, '', [Math.sin(a) * 0.23, 0.08, Math.cos(a) * 0.23]);
    brim.rotation.y = a;
    const flap = shell(brim, [0, 0, 0], [0.46, 0.16, 0.045], p.primary, 0.32);
    flap.rotation.x = 0.32;
    box(flap, [0, 0.082, 0], [0.44, 0.022, 0.052], p.accent);
  }
  sphere(hat, [0, 0.11, 0.26], [0.045, 0.055, 0.025], p.stencil, p);
  const plume = cone(hat, [-0.14, 0.26, -0.08], 0.055, 0.34, p.stencil, p, 10);
  plume.rotation.set(-0.55, 0, 0.42);
  // High upturned coat collar, cravat, baldric & coat tails
  shell(j.chest, [0, 0, 0.02], [0.67, 0.39, 0.45], p.primary, 0.42);
  for (const s of [-1, 1]) {
    const lapel = box(j.chest, [s * 0.16, 0.14, 0.232], [0.14, 0.18, 0.035], p.primary);
    lapel.rotation.set(-0.2, s * 0.22, -s * 0.25);
    box(lapel, [0, 0.085, 0.008], [0.14, 0.022, 0.038], p.accent);
  }
  shell(j.chest, [0, 0.08, 0.245], [0.14, 0.18, 0.04], p.stencil, 0.48);
  hose(j.chest, [[-0.21, 0.17, 0.18], [0, -0.01, 0.275], [0.22, -0.17, 0.19]], 0.034, p.dark, p);
  box(j.chest, [0, -0.01, 0.295], [0.095, 0.095, 0.028], p.accent);
  // Rigged ShoulderParrot perched on right shoulder
  shell(j.chest, [-0.31, 0.19, -0.01], [0.16, 0.045, 0.16], p.dark, 0.42);
  const parrot = group(j.chest, 'ShoulderParrot', [-0.31, 0.22, 0]);
  sphere(parrot, [0, 0.09, 0], [0.068, 0.095, 0.085], p.accent, p);
  sphere(parrot, [0, 0.2, 0.03], [0.052, 0.054, 0.055], p.accent, p);
  const beak = cone(parrot, [0, 0.19, 0.095], 0.026, 0.065, p.stencil, p, 8);
  beak.rotation.x = Math.PI / 2 + 0.25;
  for (const s of [-1, 1]) sphere(parrot, [s * 0.065, 0.09, -0.01], [0.026, 0.075, 0.065], p.primary, p);
  const tail = cone(parrot, [0, -0.01, -0.11], 0.032, 0.16, p.primary, p, 8);
  tail.rotation.x = -2.25;
  // Coat tails & cuffs
  shell(j.hips, [0, -0.1, -0.02], [0.6, 0.34, 0.4], p.primary, 0.38);
  shell(j.hips, [0, 0.075, 0.01], [0.58, 0.09, 0.39], p.accent, 0.38);
  for (const fore of [j.leftForeArm, j.rightForeArm]) {
    tube(fore, [0, -0.2, 0.01], 0.125, 0.108, 0.11, p.primary, 12);
    if (detail) tube(fore, [0, -0.15, 0.01], 0.129, 0.129, 0.024, p.accent, 12);
  }
  addRivets(j.chest, [[-0.12, 0.06, 0.255], [0.12, 0.06, 0.255], [-0.12, -0.06, 0.255], [0.12, -0.06, 0.255]], p, detail, 0.015, Math.PI / 2);
}

function buildOrbitalAstronaut(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // EVA bubble dome helmet + hinged gold SunVisor + floodlights
  sphere(j.head, [0, 0.11, 0], [0.295, 0.295, 0.29], p.primary, p);
  ring(j.chest, [0, 0.185, 0.005], 0.225, 0.048, 0.058, p.alloy);
  const visor = group(j.head, 'SunVisor', [0, 0.11, 0.02]);
  sphere(visor, [0, 0, 0.165], [0.245, 0.19, 0.165], p.accent, p);
  box(visor, [0, 0.175, 0.16], [0.34, 0.036, 0.14], p.dark);
  for (const s of [-1, 1]) {
    shell(j.head, [s * 0.295, 0.13, 0.03], [0.065, 0.075, 0.11], p.dark, 0.35);
    if (detail) box(j.head, [s * 0.295, 0.13, 0.09], [0.045, 0.045, 0.016], p.optic);
  }
  // Chest Display & Control Module (DCM)
  const dcm = group(j.chest, 'ChestControlUnit', [0, 0.01, 0.26]);
  shell(dcm, [0, 0, 0], [0.32, 0.24, 0.14], p.primary, 0.32);
  box(dcm, [0, 0.08, 0.065], [0.24, 0.065, 0.03], p.dark);
  box(dcm, [-0.055, -0.02, 0.076], [0.095, 0.065, 0.018], p.optic);
  box(dcm, [0.07, -0.02, 0.076], [0.065, 0.05, 0.024], p.accent);
  if (detail) {
    for (const x of [-0.08, -0.02, 0.04, 0.1]) box(dcm, [x, 0.08, 0.086], [0.022, 0.026, 0.016], p.accent);
  }
  // Mission arm bands & wrist checklist
  for (const arm of [j.leftArm, j.rightArm]) tube(arm, [0, -0.15, 0], 0.105, 0.105, 0.048, p.accent, 12);
  shell(j.leftForeArm, [0.08, -0.15, 0.03], [0.05, 0.14, 0.11], p.dark, 0.35);
  // Detachable PLSS LifeSupportPack
  const plss = group(j.chest, 'LifeSupportPack', [0, 0.05, -0.44]);
  shell(plss, [0, 0, -0.05], [0.5, 0.62, 0.27], p.primary, 0.34);
  shell(plss, [0, 0.06, -0.195], [0.36, 0.26, 0.03], p.accent, 0.32);
  for (const s of [-1, 1]) {
    tube(plss, [s * 0.15, -0.34, -0.05], 0.045, 0.058, 0.09, p.alloy, 12);
    hose(plss, [[s * 0.22, -0.18, 0.04], [s * 0.28, -0.12, 0.36], [s * 0.16, -0.04, 0.66]], 0.022, p.edge, p);
  }
  strut(plss, [0.17, 0.3, -0.05], [0.17, 0.54, -0.05], 0.012, p.alloy, 10);
  sphere(plss, [0.17, 0.555, -0.05], [0.026, 0.026, 0.026], p.accent, p);
  addStraps(plss, p, 0.18, 0.16, p.alloy);
  addRivets(plss, [[-0.2, 0.24, -0.185], [0.2, 0.24, -0.185], [-0.2, -0.22, -0.185], [0.2, -0.22, -0.185]], p, detail, 0.015, -Math.PI / 2);
}

export const charactersB: readonly CharacterAssetDef[] = [
  {
    id: 'space-medic', code: 'CH-09', category: 'Character', browseCategory: 'character',
    name: 'Space Medic', primary: '#e4ebe8', accent: '#d93848', physicsBody: 'dynamic',
    description: 'Orbital field medic with luminous halo visor, shoulder cross badges, and detachable cryo trauma pack.',
    riggedParts: [],
    detachableParts: [
      { name: 'MedPack', label: 'Med pack', describe: 'Back-mounted trauma pack with twin cryo canisters' },
    ],
    build: buildSpaceMedic,
  },
  {
    id: 'samurai-warden', code: 'CH-10', category: 'Character', browseCategory: 'character',
    name: 'Samurai Warden', primary: '#8f242c', accent: '#d6a944', physicsBody: 'dynamic',
    description: 'Armored samurai warden with layered lamellar pauldrons, gilded waist sash, and detachable crescent kabuto.',
    riggedParts: [],
    detachableParts: [
      { name: 'KabutoHelm', label: 'Kabuto helm', describe: 'Lacquered samurai helmet with golden crescent crest' },
    ],
    build: buildSamuraiWarden,
  },
  {
    id: 'steampunk-inventor', code: 'CH-11', category: 'Character', browseCategory: 'character',
    name: 'Steampunk Inventor', primary: '#6b4732', accent: '#d49a42', physicsBody: 'dynamic',
    description: 'Clockwork tinkerer wearing a goggled top hat, leather waistcoat, and detachable boiler pack with spinning gear.',
    riggedParts: [
      { name: 'GearWheel', label: 'Gear wheel', type: 'rotate', axis: 'z', range: [0, 360], describe: 'Spins the brass clockwork gear on the steam pack' },
    ],
    detachableParts: [
      { name: 'SteamPack', label: 'Steam pack', describe: 'Twin-chimney brass boiler backpack with gear drive' },
    ],
    build: buildSteampunkInventor,
  },
  {
    id: 'forest-ranger', code: 'CH-12', category: 'Character', browseCategory: 'character',
    name: 'Forest Ranger', primary: '#355c3c', accent: '#a87843', physicsBody: 'dynamic',
    description: 'Woodland archer with pointed hood, leaf-clasped cloak, leather bracer, and detachable feathered quiver.',
    riggedParts: [],
    detachableParts: [
      { name: 'ArrowQuiver', label: 'Arrow quiver', describe: 'Back-slung leather quiver filled with feathered arrows' },
    ],
    build: buildForestRanger,
  },
  {
    id: 'mech-engineer', code: 'CH-13', category: 'Character', browseCategory: 'character',
    name: 'Mech Engineer', primary: '#d4822a', accent: '#4a6274', physicsBody: 'dynamic',
    description: 'Heavy hangar engineer with hinged welding mask, braced exo-shoulders, and detachable roll-cage tool harness.',
    riggedParts: [
      { name: 'WeldingMask', label: 'Welding mask', type: 'rotate', axis: 'x', range: [0, -68], describe: 'Flips up the armored welding mask shield' },
    ],
    detachableParts: [
      { name: 'ToolHarness', label: 'Tool harness', describe: 'Back exo-frame carrying power cells and heavy wrench' },
    ],
    build: buildMechEngineer,
  },
  {
    id: 'royal-guard', code: 'CH-14', category: 'Character', browseCategory: 'character',
    name: 'Royal Guard', primary: '#b5232b', accent: '#e0b844', physicsBody: 'dynamic',
    description: 'Ceremonial palace sentry in a scarlet braided tunic with gold epaulets, sash, and detachable bearskin shako.',
    riggedParts: [],
    detachableParts: [
      { name: 'GuardShako', label: 'Guard shako', describe: 'Tall bearskin ceremonial shako with chin chain and plume' },
    ],
    build: buildRoyalGuard,
  },
  {
    id: 'pirate-captain', code: 'CH-15', category: 'Character', browseCategory: 'character',
    name: 'Pirate Captain', primary: '#3c2a4d', accent: '#d99e36', physicsBody: 'dynamic',
    description: 'Buccaneer captain in a gold-trimmed frock coat with perched shoulder parrot and detachable plumed tricorn hat.',
    riggedParts: [
      { name: 'ShoulderParrot', label: 'Shoulder parrot', type: 'rotate', axis: 'y', range: [-35, 35], describe: 'Turns the captain shoulder parrot left and right' },
    ],
    detachableParts: [
      { name: 'TricornHat', label: 'Tricorn hat', describe: 'Three-cornered captain hat with gold trim and white plume' },
    ],
    build: buildPirateCaptain,
  },
  {
    id: 'orbital-astronaut', code: 'CH-16', category: 'Character', browseCategory: 'character',
    name: 'Orbital Astronaut', primary: '#e8ecf0', accent: '#e0a628', physicsBody: 'dynamic',
    description: 'Deep-space EVA astronaut with hinged gold sun visor, chest telemetry unit, and detachable life support pack.',
    riggedParts: [
      { name: 'SunVisor', label: 'Sun visor', type: 'rotate', axis: 'x', range: [0, -52], describe: 'Raises the reflective gold EVA dome sun visor' },
    ],
    detachableParts: [
      { name: 'LifeSupportPack', label: 'Life support pack', describe: 'PLSS thermal life support backpack with umbilical hoses' },
    ],
    build: buildOrbitalAstronaut,
  },
];
