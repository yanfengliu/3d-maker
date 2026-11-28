import type * as T from 'three';
import { box, group, ring, shell, strut, tube, type Finish } from '../../parts';
import {
  HPI, addBibApron, addBrimmedHat, addCoatTorso, addCollarRing, addCuffs, addGlasses,
  addHipBag, addRivets, addStraps, cone, hose, lathe, sphere, startCharacter, torus,
} from './characters-civilian-kit';

export function buildStudioPainter(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable slouched ArtistBeret
  const beret = group(j.head, 'ArtistBeret', [0, 0.245, 0]);
  beret.rotation.z = -0.22;
  sphere(beret, [0.04, 0.055, 0], [0.33, 0.11, 0.31], p.primary, p);
  tube(beret, [0.05, 0.165, 0], 0.02, 0.014, 0.055, p.accent, 10);
  // Canvas painter smock + neck cravat + color dabs
  addCoatTorso(j, p, detail, { coatMat: p.stencil, trimMat: p.primary, skirtH: 0.36 });
  addCollarRing(j.chest, p.accent, 0.2, 0.055);
  box(j.chest, [0, 0.1, 0.262], [0.09, 0.14, 0.028], p.accent);
  // Painter palette on left hand
  const pal = group(j.leftHand, 'ColorPalette', [0.04, -0.04, 0.08]);
  tube(pal, [0, 0, 0.06], 0.18, 0.18, 0.026, p.accent, 16);
  if (detail) {
    for (const [px, pz, mat] of [[-0.08, 0.02, p.primary], [0, 0.12, p.optic], [0.09, 0.05, p.dark], [-0.04, -0.05, p.stencil]] as const) {
      sphere(pal, [px, 0.022, 0.06 + pz], [0.032, 0.016, 0.032], mat, p);
    }
  }
  // Rigged sweeping BrushArm in right hand
  const brush = group(j.rightHand, 'BrushArm', [0, -0.05, 0.04]);
  tube(brush, [0, 0.04, 0.14], 0.016, 0.02, 0.34, p.primary, 10).rotation.x = HPI;
  tube(brush, [0, 0.04, 0.32], 0.024, 0.02, 0.055, p.alloy, 10).rotation.x = HPI;
  cone(brush, [0, 0.04, 0.38], 0.026, 0.075, p.accent, p, 10).rotation.x = HPI;
}

export function buildMasterCarpenter(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Hardcap visor + ear muffs + tucked pencil
  sphere(j.head, [0, 0.145, 0], [0.27, 0.2, 0.275], p.accent, p);
  shell(j.head, [0, 0.12, 0.235], [0.34, 0.03, 0.16], p.accent, 0.5);
  for (const s of [-1, 1]) sphere(j.head, [s * 0.285, 0.06, 0], [0.06, 0.088, 0.085], p.dark, p);
  if (detail) tube(j.head, [0.255, 0.14, 0.08], 0.012, 0.012, 0.18, p.accent, 10).rotation.x = HPI;
  // Tool apron + tape measure on hip
  addBibApron(j, p, detail, p.primary, p.dark);
  shell(j.hips, [-0.31, 0.03, 0.05], [0.095, 0.11, 0.11], p.accent, 0.32);
  // Detachable back SawTote lumber pack
  const tote = group(j.chest, 'SawTote', [0, 0, -0.43]);
  shell(tote, [0, -0.04, -0.03], [0.42, 0.44, 0.2], p.primary, 0.26);
  for (const x of [-0.11, 0.11]) box(tote, [x, 0.22, -0.04], [0.09, 0.38, 0.06], p.accent);
  addStraps(tote, p, 0.165, 0.18, p.dark);
  // Rigged rocking HandSaw in right hand
  const saw = group(j.rightHand, 'HandSaw', [0, -0.05, 0.04]);
  shell(saw, [0, 0, 0.04], [0.045, 0.13, 0.12], p.primary, 0.26);
  box(saw, [0, 0.01, 0.28], [0.018, 0.11, 0.42], p.alloy);
  if (detail) {
    for (let i = 0; i < 6; i++) cone(saw, [0, -0.055, 0.12 + i * 0.062], 0.014, 0.026, p.alloy, p, 6).rotation.x = Math.PI;
  }
}

export function buildHarvestFarmer(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable broad woven StrawHat
  const hat = group(j.head, 'StrawHat', [0, 0.24, 0]);
  lathe(hat, [0, 0, 0], [[0.2, 0], [0.46, -0.04], [0.47, -0.01], [0.25, 0.045], [0.22, 0.15], [0.01, 0.18]], p.accent, p, 16);
  tube(hat, [0, 0.065, 0], 0.245, 0.245, 0.045, p.primary, 16);
  // Denim bib overalls + neckerchief bandana
  addBibApron(j, p, detail, p.primary, p.accent);
  addCollarRing(j.chest, p.accent, 0.21, 0.058);
  cone(j.chest, [0, 0.11, 0.256], 0.11, 0.16, p.accent, p, 6).rotation.x = Math.PI;
  addHipBag(j.hips, 'SeedPouch', 1, p, detail, p.accent, p.dark);
  // Rigged tilting HarvestTool pitchfork in right hand
  const fork = group(j.rightHand, 'HarvestTool', [0, -0.05, 0.04]);
  tube(fork, [0, 0.08, 0.04], 0.022, 0.024, 0.82, p.accent, 12);
  box(fork, [0, 0.49, 0.04], [0.24, 0.032, 0.032], p.alloy);
  for (const x of [-0.1, 0, 0.1]) tube(fork, [x, 0.62, 0.04], 0.01, 0.014, 0.26, p.alloy, 10);
}

export function buildRailwayConductor(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable tall pillbox ConductorCap
  const cap = group(j.head, 'ConductorCap', [0, 0.245, 0]);
  tube(cap, [0, 0.095, 0], 0.245, 0.235, 0.19, p.primary, 16);
  tube(cap, [0, 0.02, 0], 0.244, 0.244, 0.035, p.accent, 16);
  shell(cap, [0, -0.005, 0.21], [0.3, 0.026, 0.16], p.dark, 0.5);
  box(cap, [0, 0.11, 0.248], [0.15, 0.065, 0.022], p.accent);
  // Brass-buttoned conductor vest + pocket watch chain + ticket punch
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, lapels: true, tie: true, buttons: true, skirtH: 0.28 });
  hose(j.chest, [[0, -0.02, 0.268], [0.1, -0.09, 0.278], [0.2, -0.03, 0.268]], 0.012, p.accent, p);
  addCuffs(j, p, p.primary, p.accent);
  // Rigged swinging brass SignalLantern in right hand
  const lant = group(j.rightHand, 'SignalLantern', [0, -0.07, 0.04]);
  torus(lant, [0, -0.02, 0], 0.075, 0.014, p.accent, p);
  tube(lant, [0, -0.1, 0], 0.065, 0.088, 0.048, p.accent, 12);
  tube(lant, [0, -0.21, 0], 0.072, 0.072, 0.17, p.optic, 14);
  tube(lant, [0, -0.31, 0], 0.095, 0.105, 0.045, p.primary, 12);
  if (detail) {
    for (const s of [-1, 1]) strut(lant, [s * 0.085, -0.11, 0], [s * 0.095, -0.3, 0], 0.012, p.accent, 10);
  }
}

export function buildDigArchaeologist(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable expedition BushHat
  addBrimmedHat(j.head, 'BushHat', p, detail, {
    brimR: 0.37, crownR: 0.23, crownH: 0.165, hatMat: p.primary, bandMat: p.accent, tiltZ: 0.07,
  });
  // Khaki field jacket + cross-body straps + map scroll tube on back + hip whip coil
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, lapels: true, buttons: true });
  hose(j.chest, [[-0.2, 0.17, 0.21], [0.18, -0.17, 0.22]], 0.026, p.dark, p);
  hose(j.chest, [[0.2, 0.17, 0.21], [-0.18, -0.17, 0.22]], 0.026, p.dark, p);
  tube(j.chest, [0, 0.04, -0.42], 0.065, 0.065, 0.56, p.accent, 14).rotation.z = 0.55;
  torus(j.hips, [0.31, -0.05, 0.04], 0.105, 0.026, p.dark, p).rotation.y = HPI;
  // Rigged excavation DigTrowel in right hand
  const trowel = group(j.rightHand, 'DigTrowel', [0, -0.05, 0.04]);
  tube(trowel, [0, 0, 0.06], 0.022, 0.024, 0.16, p.dark, 12).rotation.x = HPI;
  const blade = cone(trowel, [0, 0, 0.24], 0.075, 0.2, p.alloy, p, 4);
  blade.rotation.x = HPI;
  blade.scale.set(1, 1, 0.25);
}

export function buildUrbanSkater(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Backwards snapback cap + rigged swiveling SkateHeadset
  sphere(j.head, [0, 0.15, 0], [0.262, 0.18, 0.265], p.primary, p);
  shell(j.head, [0, 0.12, -0.24], [0.3, 0.028, 0.16], p.accent, 0.5);
  const phones = group(j.head, 'SkateHeadset', [0, 0.12, 0]);
  torus(phones, [0, 0.04, 0], 0.275, 0.024, p.dark, p, Math.PI);
  for (const s of [-1, 1]) {
    tube(phones, [s * 0.278, -0.02, 0], 0.072, 0.072, 0.058, p.accent, 14).rotation.z = HPI;
    tube(phones, [s * 0.305, -0.02, 0], 0.048, 0.048, 0.022, p.dark, 12).rotation.z = HPI;
  }
  // Layered hoodie with bunched hood collar + kangaroo pocket
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, skirtH: 0.22 });
  torus(j.chest, [0, 0.19, -0.05], 0.22, 0.068, p.primary, p).rotation.x = HPI;
  shell(j.chest, [0, -0.1, 0.258], [0.36, 0.14, 0.045], p.accent, 0.32);
  // Detachable vertical SkateDeck strapped to chest back
  const deck = group(j.chest, 'SkateDeck', [0, 0.02, -0.43]);
  shell(deck, [0, 0, 0.03], [0.24, 0.36, 0.1], p.dark, 0.28);
  shell(deck, [0, 0, -0.03], [0.27, 0.78, 0.042], p.accent, 0.5);
  box(deck, [0, 0, -0.058], [0.18, 0.52, 0.016], p.primary);
  for (const y of [-0.22, 0.22]) {
    tube(deck, [0, y, -0.085], 0.018, 0.018, 0.24, p.alloy, 10).rotation.z = HPI;
    for (const s of [-1, 1]) tube(deck, [s * 0.125, y, -0.085], 0.045, 0.045, 0.042, p.stencil, 12).rotation.z = HPI;
  }
  addStraps(deck, p, 0.155, 0.18, p.dark);
  addRivets(deck, [[-0.08, 0.24, -0.005], [0.08, 0.24, -0.005]], p, detail, 0.014, HPI);
}

export function buildKimonoSilkWeaver(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable ornamental HairOrnament bun crown
  const crown = group(j.head, 'HairOrnament', [0, 0.24, -0.02]);
  sphere(crown, [0, 0.06, -0.02], [0.16, 0.13, 0.16], p.dark, p);
  strut(crown, [-0.24, 0.09, -0.02], [0.24, 0.09, -0.02], 0.014, p.accent, 10);
  for (const s of [-1, 1]) sphere(crown, [s * 0.245, 0.09, -0.02], [0.036, 0.036, 0.036], p.primary, p);
  if (detail) {
    for (const x of [-0.07, 0, 0.07]) sphere(crown, [x, 0.12, 0.11], [0.034, 0.034, 0.026], p.accent, p);
  }
  // Crossed kimono jacket + wide drape sleeves + broad obi sash with back bow
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, lapels: true, skirtH: 0.44 });
  shell(j.hips, [0, 0.08, 0.01], [0.63, 0.16, 0.44], p.accent, 0.34);
  shell(j.hips, [0, 0.08, -0.28], [0.34, 0.24, 0.14], p.accent, 0.3);
  for (const fore of [j.leftForeArm, j.rightForeArm]) shell(fore, [0, -0.14, -0.02], [0.22, 0.34, 0.28], p.primary, 0.32);
  // Rigged waving SilkFan in right hand
  const fan = group(j.rightHand, 'SilkFan', [0, -0.05, 0.05]);
  for (let i = -2; i <= 2; i++) {
    const zOff = 0.08 + (Math.abs(i) % 2) * 0.018;
    const rib = box(fan, [i * 0.048, 0.12, zOff], [0.058, 0.22, 0.012], i % 2 === 0 ? p.accent : p.stencil);
    rib.rotation.z = -i * 0.24;
  }
  tube(fan, [0, -0.01, 0.086], 0.028, 0.028, 0.08, p.dark, 10);
}

export function buildMaritimeHarborCaptain(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable oilskin souwester CaptainOilHat
  const hat = group(j.head, 'CaptainOilHat', [0, 0.235, -0.01]);
  sphere(hat, [0, 0.06, 0], [0.26, 0.16, 0.265], p.accent, p);
  const brim = lathe(hat, [0, 0, -0.03], [[0.23, 0], [0.38, -0.065], [0.39, -0.035], [0.25, 0.025]], p.accent, p, 16);
  brim.scale.set(0.95, 1, 1.18);
  // Sculpted captain beard + heavy slicker coat
  sphere(j.head, [0, -0.055, 0.17], [0.165, 0.125, 0.11], p.stencil, p);
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, lapels: true, buttons: true, skirtH: 0.4 });
  addCollarRing(j.chest, p.accent, 0.22, 0.065);
  addCuffs(j, p, p.accent);
  // Rigged tilting brass spyglass HarborGlass in right hand
  const spy = group(j.rightHand, 'HarborGlass', [0, -0.05, 0.04]);
  tube(spy, [0, 0.02, 0.14], 0.045, 0.032, 0.34, p.accent, 14).rotation.x = HPI;
  ring(spy, [0, 0.02, 0.31], 0.048, 0.012, 0.024, p.alloy).rotation.x = HPI;
  tube(spy, [0, 0.02, 0.31], 0.036, 0.036, 0.016, p.optic, 12).rotation.x = HPI;
}

export function buildAstronomyProfessor(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable academic Mortarboard cap with tassel
  const cap = group(j.head, 'Mortarboard', [0, 0.25, 0]);
  tube(cap, [0, 0.025, 0], 0.235, 0.24, 0.095, p.primary, 16);
  box(cap, [0, 0.088, 0], [0.46, 0.026, 0.46], p.primary).rotation.y = Math.PI / 4;
  sphere(cap, [0, 0.108, 0], [0.028, 0.018, 0.028], p.accent, p);
  hose(cap, [[0, 0.105, 0], [0.22, 0.09, 0.16], [0.26, -0.04, 0.18]], 0.012, p.accent, p);
  addGlasses(j.head, p, 0.11, 0.264, p.accent);
  // Academic gown capelet + gold stole
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, skirtH: 0.42 });
  for (const s of [-1, 1]) box(j.chest, [s * 0.12, -0.01, 0.258], [0.075, 0.38, 0.022], p.accent);
  shell(j.chest, [0, -0.16, -0.26], [0.56, 0.56, 0.075], p.primary, 0.34);
  // Rigged spinning brass ArmillaryOrb in right hand
  const orb = group(j.rightHand, 'ArmillaryOrb', [0, 0.02, 0.1]);
  tube(orb, [0, -0.08, 0], 0.022, 0.024, 0.16, p.accent, 10);
  torus(orb, [0, 0.08, 0], 0.12, 0.016, p.accent, p);
  torus(orb, [0, 0.08, 0], 0.12, 0.016, p.accent, p).rotation.y = HPI;
  torus(orb, [0, 0.08, 0], 0.1, 0.014, p.alloy, p).rotation.x = HPI / 2;
  sphere(orb, [0, 0.08, 0], [0.036, 0.036, 0.036], p.optic, p);
}

export function buildBicycleFlorist(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable flat straw BoaterHat with floral accent band
  const hat = addBrimmedHat(j.head, 'BoaterHat', p, detail, {
    brimR: 0.36, crownR: 0.24, crownH: 0.12, hatMat: p.stencil, bandMat: p.accent,
  });
  for (const x of [-0.08, 0, 0.08]) sphere(hat, [x, 0.06, 0.25], [0.038, 0.038, 0.032], p.accent, p);
  // Scalloped garden apron + back wicker flower basket filled with blooms
  addBibApron(j, p, detail, p.primary, p.accent);
  const basket = group(j.chest, 'FlowerBasket', [0, 0.02, -0.43]);
  tube(basket, [0, -0.02, -0.03], 0.21, 0.16, 0.42, p.stencil, 14);
  ring(basket, [0, 0.19, -0.03], 0.215, 0.024, 0.036, p.primary);
  for (const [bx, by, bz, mat] of [
    [-0.1, 0.26, -0.02, p.accent], [0.09, 0.28, -0.04, p.accent],
    [0, 0.31, -0.06, p.primary], [-0.04, 0.25, 0.05, p.optic],
  ] as const) {
    sphere(basket, [bx, by, bz], [0.072, 0.072, 0.072], mat, p);
  }
  addStraps(basket, p, 0.165, 0.18, p.primary);
  // Rigged tilting WateringCan in right hand
  const can = group(j.rightHand, 'WateringCan', [0, -0.08, 0.04]);
  tube(can, [0, -0.08, 0.02], 0.088, 0.105, 0.2, p.primary, 14);
  strut(can, [0, -0.08, 0.09], [0, 0.02, 0.27], 0.018, p.accent, 10);
  cone(can, [0, 0.035, 0.29], 0.046, 0.052, p.accent, p, 10).rotation.x = -HPI;
  torus(can, [0, -0.04, -0.07], 0.07, 0.014, p.primary, p).rotation.y = HPI;
}

export { addRivets, addHipBag, ring, torus };
