import type * as T from 'three';
import { addPauldrons } from '../../collections/characters-a';
import { box, group, ring, shell, strut, tube, type Finish } from '../../parts';
import {
  HPI, addBibApron, addBrimmedHat, addCoatTorso, addCollarRing, addCuffs, addGlasses,
  addHipBag, addRivets, addStraps, cone, hose, lathe, sphere, startCharacter, torus,
} from './characters-civilian-kit';

export function buildHospitalSurgeon(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Surgical scrub cap + pleated mask + hinged optical SurgicalLoupes
  sphere(j.head, [0, 0.16, -0.01], [0.275, 0.21, 0.275], p.primary, p);
  tube(j.head, [0, 0.19, 0], 0.268, 0.272, 0.048, p.accent, 16);
  shell(j.head, [0, 0.02, 0.255], [0.28, 0.13, 0.055], p.accent, 0.4);
  const loupes = group(j.head, 'SurgicalLoupes', [0, 0.145, 0.06]);
  for (const s of [-1, 1]) {
    tube(loupes, [s * 0.085, 0, 0.235], 0.042, 0.046, 0.075, p.dark, 12).rotation.x = HPI;
    tube(loupes, [s * 0.085, 0, 0.274], 0.032, 0.032, 0.016, p.optic, 12).rotation.x = HPI;
  }
  box(loupes, [0, 0.045, 0.22], [0.22, 0.028, 0.04], p.alloy);
  tube(loupes, [0, 0.075, 0.235], 0.034, 0.038, 0.048, p.stencil, 12).rotation.x = HPI;
  // Scrub tunic + draped stethoscope
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, skirtH: 0.28 });
  hose(j.chest, [[-0.14, 0.18, 0.12], [-0.16, 0.02, 0.268], [0, -0.09, 0.275], [0.16, 0.02, 0.268], [0.14, 0.18, 0.12]], 0.016, p.dark, p);
  tube(j.chest, [0, -0.1, 0.282], 0.046, 0.046, 0.022, p.alloy, 12).rotation.x = HPI;
  if (detail) {
    box(j.chest, [0.14, 0.05, 0.258], [0.095, 0.11, 0.018], p.stencil);
    box(j.chest, [0.14, 0.06, 0.272], [0.055, 0.018, 0.012], p.accent);
    box(j.chest, [0.14, 0.06, 0.272], [0.018, 0.055, 0.012], p.accent);
  }
  addCuffs(j, p, p.accent);
  // Detachable DoctorSatchel on right hip
  const bag = addHipBag(j.hips, 'DoctorSatchel', -1, p, detail, p.accent, p.primary);
  box(bag, [-0.088, -0.02, 0], [0.018, 0.08, 0.024], p.primary);
  box(bag, [-0.088, -0.02, 0], [0.018, 0.024, 0.08], p.primary);
}

export function buildCommercialAirlinePilot(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable peaked CaptainCap
  const cap = group(j.head, 'CaptainCap', [0, 0.245, 0]);
  tube(cap, [0, 0.055, 0], 0.255, 0.238, 0.11, p.primary, 16);
  sphere(cap, [0, 0.125, -0.01], [0.3, 0.08, 0.3], p.primary, p);
  tube(cap, [0, 0.025, 0], 0.248, 0.248, 0.036, p.accent, 16);
  shell(cap, [0, -0.005, 0.21], [0.34, 0.028, 0.2], p.dark, 0.55);
  box(cap, [0, 0.075, 0.255], [0.12, 0.042, 0.022], p.accent);
  // Rigged swiveling CommsBoom headset mic on j.head
  const boom = group(j.head, 'CommsBoom', [0.255, 0.08, 0.02]);
  tube(boom, [0, 0, 0], 0.068, 0.068, 0.045, p.dark, 12).rotation.z = HPI;
  hose(boom, [[0, -0.02, 0.02], [0.02, -0.05, 0.16], [-0.12, -0.06, 0.26]], 0.012, p.edge, p);
  sphere(boom, [-0.13, -0.06, 0.265], [0.028, 0.022, 0.022], p.tire, p);
  // Navy blazer, tie, epaulets, and flight case in right hand
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, lapels: true, tie: true, buttons: true, skirtH: 0.26 });
  addPauldrons(j, p, detail, 'epaulet');
  addCuffs(j, p, p.primary, p.accent);
  const fcase = group(j.rightHand, 'FlightCase', [-0.04, -0.18, 0.02]);
  shell(fcase, [0, -0.08, 0], [0.16, 0.32, 0.34], p.dark, 0.22);
  strut(fcase, [0, 0.08, -0.08], [0, 0.16, -0.08], 0.018, p.alloy, 10);
  strut(fcase, [0, 0.08, 0.08], [0, 0.16, 0.08], 0.018, p.alloy, 10);
  strut(fcase, [0, 0.16, -0.08], [0, 0.16, 0.08], 0.02, p.accent, 10);
}

export function buildFieldBotanist(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable pith SafariHat
  const hat = addBrimmedHat(j.head, 'SafariHat', p, detail, {
    brimR: 0.37, crownR: 0.24, crownH: 0.16, hatMat: p.accent, bandMat: p.primary,
  });
  sphere(hat, [0, 0.19, 0], [0.036, 0.026, 0.036], p.primary, p);
  // Utility vest + field specimen press pack with sprouting flora
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, buttons: true });
  for (const s of [-1, 1]) shell(j.chest, [s * 0.16, -0.08, 0.258], [0.14, 0.12, 0.036], p.accent, 0.28);
  const press = group(j.chest, 'PlantPress', [0, 0, -0.43]);
  shell(press, [0, 0, -0.03], [0.42, 0.48, 0.19], p.accent, 0.24);
  for (const y of [-0.12, 0.12]) box(press, [0, y, -0.03], [0.45, 0.036, 0.22], p.dark);
  for (const [lx, rot] of [[-0.08, 0.3], [0.04, -0.25], [0.12, -0.45]] as const) {
    const leaf = sphere(press, [lx, 0.32, -0.02], [0.055, 0.12, 0.024], p.primary, p);
    leaf.rotation.z = rot;
  }
  addStraps(press, p, 0.165, 0.18, p.dark);
  // Rigged magnifying SpecimenLens in right hand
  const lens = group(j.rightHand, 'SpecimenLens', [0, -0.05, 0.04]);
  tube(lens, [0, 0, 0.08], 0.024, 0.024, 0.22, p.dark, 12).rotation.x = HPI;
  torus(lens, [0, 0, 0.26], 0.095, 0.022, p.accent, p).rotation.x = HPI;
  tube(lens, [0, 0, 0.26], 0.084, 0.084, 0.018, p.optic, 14);
}

export function buildVillageBlacksmith(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Hinged ForgeGoggles on brow
  const goggles = group(j.head, 'ForgeGoggles', [0, 0.17, 0.04]);
  torus(goggles, [0, 0, 0], 0.262, 0.022, p.dark, p).rotation.x = HPI;
  for (const s of [-1, 1]) {
    tube(goggles, [s * 0.09, 0.01, 0.25], 0.056, 0.06, 0.052, p.accent, 14).rotation.x = HPI;
    tube(goggles, [s * 0.09, 0.01, 0.278], 0.042, 0.042, 0.014, p.optic, 12).rotation.x = HPI;
  }
  // Heavy leather forge apron + steel bracers + forged hammer in right hand
  addBibApron(j, p, detail, p.primary, p.dark);
  for (const fore of [j.leftForeArm, j.rightForeArm]) tube(fore, [0, -0.15, 0], 0.122, 0.114, 0.17, p.edge, 12);
  const hammer = group(j.rightHand, 'HandHammer', [0, -0.05, 0.04]);
  tube(hammer, [0, 0.04, 0.14], 0.024, 0.026, 0.36, p.primary, 12).rotation.x = HPI;
  shell(hammer, [0, 0.04, 0.34], [0.22, 0.11, 0.11], p.alloy, 0.24);
  if (detail) box(hammer, [0, 0.04, 0.34], [0.24, 0.04, 0.04], p.accent);
  // Detachable ForgeToolRoll on chest back
  const roll = group(j.chest, 'ForgeToolRoll', [0, -0.02, -0.43]);
  tube(roll, [0, 0.08, -0.02], 0.105, 0.105, 0.46, p.primary, 14).rotation.z = HPI;
  for (const x of [-0.14, 0.14]) tube(roll, [x, 0.08, -0.02], 0.112, 0.112, 0.032, p.dark, 12).rotation.z = HPI;
  for (const x of [-0.1, 0.08]) strut(roll, [x, -0.14, -0.03], [x, 0.24, -0.03], 0.018, p.alloy, 10);
  addStraps(roll, p, 0.165, 0.18, p.dark);
}

export function buildJazzSaxophonist(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable tilted JazzFedora
  addBrimmedHat(j.head, 'JazzFedora', p, detail, {
    brimR: 0.34, crownR: 0.225, crownH: 0.18, hatMat: p.primary, bandMat: p.accent, tiltZ: 0.14,
  });
  // Dinner jacket with lapels and bow tie
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.dark, lapels: true, buttons: true, skirtH: 0.28 });
  for (const s of [-1, 1]) cone(j.chest, [s * 0.045, 0.14, 0.265], 0.036, 0.065, p.accent, p, 10).rotation.z = s * HPI;
  // Rigged curved golden tenor saxophone mounted across chest
  const sax = group(j.chest, 'SaxBell', [0.02, 0.05, 0.29]);
  hose(sax, [[0, 0.11, -0.04], [0.06, 0.02, 0.05], [0.1, -0.22, 0.07], [0.19, -0.26, 0.09], [0.24, -0.08, 0.12]], 0.034, p.accent, p);
  cone(sax, [0.26, 0.02, 0.14], 0.115, 0.16, p.accent, p, 14).rotation.set(0.3, 0, -0.35);
  ring(sax, [0.275, 0.06, 0.15], 0.11, 0.018, 0.024, p.stencil);
  if (detail) {
    for (const y of [-0.04, -0.1, -0.16]) sphere(sax, [0.08, y, 0.098], [0.018, 0.018, 0.018], p.stencil, p);
  }
}

export function buildCafeBarista(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable knit BaristaBeanie
  const beanie = group(j.head, 'BaristaBeanie', [0, 0.22, -0.01]);
  sphere(beanie, [0, 0.06, -0.02], [0.265, 0.2, 0.275], p.primary, p);
  torus(beanie, [0, -0.02, 0], 0.252, 0.042, p.accent, p).rotation.x = HPI;
  if (detail) sphere(beanie, [0, 0.265, -0.03], [0.052, 0.052, 0.052], p.accent, p);
  // Cross-back cafe apron + folded cuffs + hanging barista cloth
  addBibApron(j, p, detail, p.primary, p.accent);
  addCuffs(j, p, p.stencil);
  shell(j.hips, [0.27, -0.14, 0.09], [0.075, 0.24, 0.12], p.stencil, 0.28);
  // Rigged brass espresso PortafilterArm in right hand
  const pf = group(j.rightHand, 'PortafilterArm', [0, -0.05, 0.04]);
  tube(pf, [0, 0, 0.08], 0.024, 0.028, 0.22, p.primary, 12).rotation.x = HPI;
  tube(pf, [0, 0.01, 0.24], 0.078, 0.068, 0.085, p.alloy, 14);
  ring(pf, [0, 0.055, 0.24], 0.082, 0.016, 0.022, p.accent);
  tube(pf, [0, -0.05, 0.24], 0.016, 0.014, 0.045, p.edge, 10);
}

export function buildPostalCarrier(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable visored PostalCap
  const cap = group(j.head, 'PostalCap', [0, 0.24, 0]);
  sphere(cap, [0, 0.04, 0], [0.258, 0.14, 0.262], p.primary, p);
  shell(cap, [0, -0.01, 0.22], [0.32, 0.026, 0.19], p.dark, 0.55);
  box(cap, [0, 0.065, 0.25], [0.085, 0.055, 0.024], p.accent);
  // Collared postal uniform + diagonal satchel strap
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, tie: true, buttons: true });
  hose(j.chest, [[-0.2, 0.17, 0.18], [0, 0.0, 0.27], [0.24, -0.2, 0.18]], 0.032, p.dark, p);
  // Mailbag on left hip with rigged hinged MailFlap
  const bag = group(j.hips, 'MailBagBody', [0.33, -0.06, 0.02]);
  shell(bag, [0, 0, 0], [0.16, 0.28, 0.3], p.dark, 0.3);
  strut(bag, [-0.06, 0.12, 0], [-0.14, 0.14, 0], 0.026, p.dark, 10);
  if (detail) {
    for (const z of [-0.06, 0.05]) box(bag, [0.02, 0.15, z], [0.028, 0.11, 0.14], p.stencil).rotation.z = -0.18;
  }
  const flap = group(bag, 'MailFlap', [0.04, 0.14, 0]);
  shell(flap, [0.055, -0.075, 0], [0.04, 0.18, 0.31], p.accent, 0.28);
  box(flap, [0.08, -0.13, 0], [0.018, 0.045, 0.06], p.primary);
}

export function buildArchivistLibrarian(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Spectacles + sculpted hair bun
  addGlasses(j.head, p, 0.115, 0.264, p.accent);
  sphere(j.head, [0, 0.22, -0.22], [0.13, 0.13, 0.12], p.dark, p);
  strut(j.head, [-0.15, 0.24, -0.22], [0.15, 0.24, -0.22], 0.014, p.accent, 10);
  // Cardigan vest + pleated librarian skirt
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, lapels: true, buttons: true, skirtH: 0.34 });
  addCollarRing(j.chest, p.stencil, 0.19, 0.055);
  // Detachable ScrollSatchel on left hip
  const satchel = addHipBag(j.hips, 'ScrollSatchel', 1, p, detail, p.accent, p.primary);
  tube(satchel, [0.02, 0.16, 0.04], 0.036, 0.036, 0.24, p.stencil, 12).rotation.x = 0.25;
  // Open ledger book in right hand with rigged hinged LedgerCover
  const ledger = group(j.rightHand, 'ArchivistLedger', [0, -0.05, 0.1]);
  box(ledger, [-0.02, 0, 0], [0.04, 0.24, 0.19], p.primary);
  box(ledger, [0.012, 0, 0], [0.028, 0.21, 0.17], p.stencil);
  const cover = group(ledger, 'LedgerCover', [0.01, 0, -0.095]);
  box(cover, [0.045, 0, 0.095], [0.024, 0.24, 0.19], p.primary);
  box(cover, [0.062, 0, 0.095], [0.012, 0.08, 0.08], p.accent);
}

export function buildAlpineMountaineer(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Climbing helmet + rigged tilting ClimbLamp
  sphere(j.head, [0, 0.15, 0], [0.275, 0.21, 0.275], p.primary, p);
  torus(j.head, [0, 0.14, 0], 0.276, 0.018, p.dark, p).rotation.x = HPI;
  const lamp = group(j.head, 'ClimbLamp', [0, 0.16, 0.275]);
  shell(lamp, [0, 0, 0.025], [0.11, 0.075, 0.06], p.dark, 0.35);
  tube(lamp, [0, 0, 0.058], 0.028, 0.032, 0.02, p.optic, 12).rotation.x = HPI;
  // Quilted alpine jacket + diagonal coiled climbing rope + ice axe
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, buttons: true });
  for (let k = 0; k < (detail ? 3 : 2); k++) {
    hose(j.chest, [[0.19 + k * 0.018, 0.18, 0.21], [0, 0.02 - k * 0.025, 0.278], [-0.19, -0.16 + k * 0.02, 0.21]], 0.022, p.stencil, p);
  }
  const axe = group(j.rightHand, 'IceAxe', [0, -0.05, 0.03]);
  tube(axe, [0, -0.08, 0.06], 0.02, 0.02, 0.56, p.alloy, 12);
  box(axe, [0, 0.2, 0.11], [0.036, 0.055, 0.24], p.edge);
  // Detachable tall SummitPack on chest back
  const pack = group(j.chest, 'SummitPack', [0, 0.02, -0.44]);
  shell(pack, [0, 0.02, -0.04], [0.44, 0.56, 0.24], p.accent, 0.38);
  tube(pack, [0, 0.34, -0.04], 0.075, 0.075, 0.48, p.primary, 14).rotation.z = HPI;
  addStraps(pack, p, 0.17, 0.19, p.dark);
  addRivets(pack, [[-0.16, 0.18, -0.165], [0.16, 0.18, -0.165]], p, detail, 0.015, -HPI);
}

export function buildNoirTrenchDetective(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable classic brimmed DetectiveFedora
  addBrimmedHat(j.head, 'DetectiveFedora', p, detail, {
    brimR: 0.36, crownR: 0.23, crownH: 0.17, hatMat: p.primary, bandMat: p.dark, tiltZ: -0.08,
  });
  // High upturned storm collar + belted trench coat
  addCoatTorso(j, p, detail, { coatMat: p.primary, trimMat: p.accent, lapels: true, buttons: true, skirtH: 0.44 });
  shell(j.chest, [0, 0.2, -0.15], [0.46, 0.16, 0.075], p.primary, 0.38);
  for (const s of [-1, 1]) shell(j.chest, [s * 0.24, 0.19, 0.02], [0.065, 0.15, 0.25], p.primary, 0.34);
  box(j.hips, [0, 0.075, 0.235], [0.11, 0.095, 0.03], p.accent);
  // Rigged brass magnifying glass arm in right hand
  const mag = group(j.rightHand, 'MagnifierArm', [0, -0.05, 0.04]);
  tube(mag, [0, 0.02, 0.08], 0.022, 0.024, 0.22, p.dark, 12).rotation.x = HPI;
  torus(mag, [0, 0.02, 0.27], 0.105, 0.024, p.accent, p).rotation.x = HPI;
  tube(mag, [0, 0.02, 0.27], 0.092, 0.092, 0.016, p.optic, 14);
}

export { cone, lathe, ring };
