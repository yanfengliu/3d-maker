import * as T from 'three';
import type { DecalSlotSpec, DetachablePartSpec, NightZoneSpec, RiggedPartSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';
import { character } from '../character';
import { fastener } from '../hd-detail';
import { box, group, mesh, ring, shell, strut, tube, type Finish, type Point } from '../parts';

export interface CharacterAssetDef {
  id: string; code: string; category: 'Character'; browseCategory: Extract<BrowseCategory, 'character'>;
  name: string; primary: string; accent: string; description: string; physicsBody: 'dynamic';
  riggedParts: readonly RiggedPartSpec[]; detachableParts: readonly DetachablePartSpec[];
  nightZones?: readonly NightZoneSpec[]; decals?: readonly DecalSlotSpec[];
  build: (root: T.Group, p: Finish, detail: boolean) => void;
}

export interface CharacterJoints {
  hips: T.Bone; spine: T.Bone; chest: T.Bone; neck: T.Bone; head: T.Bone;
  leftArm: T.Bone; rightArm: T.Bone; leftForeArm: T.Bone; rightForeArm: T.Bone;
  leftHand: T.Bone; rightHand: T.Bone;
}

export function startCharacter(root: T.Group, p: Finish, detail: boolean, human = true): CharacterJoints {
  character(root, p, human, detail);
  const skin = root.getObjectByName('Suit');
  if (!(skin instanceof T.SkinnedMesh)) throw new Error('Missing Suit skinned mesh');
  const bone = (name: string): T.Bone => {
    const found = skin.skeleton.bones.find(b => b.name === name);
    if (!found) throw new Error('Missing skeleton bone ' + name);
    return found;
  };
  return {
    hips: bone('Hips'), spine: bone('Spine'), chest: bone('Chest'), neck: bone('Neck'), head: bone('Head'),
    leftArm: bone('LeftArm'), rightArm: bone('RightArm'),
    leftForeArm: bone('LeftForeArm'), rightForeArm: bone('RightForeArm'),
    leftHand: bone('LeftHand'), rightHand: bone('RightHand'),
  };
}

export function sphere(parent: T.Object3D, at: Point, radii: Point, mat: T.Material, p: Finish) {
  const part = mesh(parent, new T.SphereGeometry(1, p.hd ? 28 : 10, p.hd ? 16 : 6), mat, at);
  part.scale.set(...radii);
  return part;
}

export function cone(parent: T.Object3D, at: Point, radius: number, height: number, mat: T.Material, p: Finish, sides = 12) {
  return mesh(parent, new T.ConeGeometry(radius, height, p.hd ? sides * 3 : sides), mat, at);
}

export function torus(parent: T.Object3D, at: Point, radius: number, tubeR: number, mat: T.Material, p: Finish, arc = Math.PI * 2) {
  return mesh(parent, new T.TorusGeometry(radius, tubeR, p.hd ? 14 : 6, p.hd ? 36 : 14, arc), mat, at);
}

export function lathe(parent: T.Object3D, at: Point, profile: readonly [number, number][], mat: T.Material, p: Finish, sides = 14) {
  const geom = new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), p.hd ? sides * 3 : sides);
  geom.normalizeNormals();
  return mesh(parent, geom, mat, at);
}

export function hose(parent: T.Object3D, pts: readonly Point[], radius: number, mat: T.Material, p: Finish) {
  const curve = new T.CatmullRomCurve3(pts.map(pt => new T.Vector3(...pt)));
  return mesh(parent, new T.TubeGeometry(curve, p.hd ? 22 : 10, radius, p.hd ? 10 : 6), mat, [0, 0, 0]);
}

export function addRivets(parent: T.Object3D, pts: readonly Point[], p: Finish, detail: boolean, r = 0.015, rotX = 0, rotZ = 0) {
  if (!detail) return;
  for (const pt of pts) {
    const rivet = p.hd ? fastener(parent, pt, p, r) : tube(parent, pt, r, r, r * 0.6, p.alloy, 6);
    rivet.rotation.set(rotX, 0, rotZ);
  }
}

export function addStraps(pack: T.Object3D, p: Finish, x = 0.165, topY = 0.19, mat: T.Material = p.dark) {
  for (const s of [-1, 1]) {
    hose(pack, [[s * x, topY - 0.04, 0.04], [s * x, topY + 0.04, 0.24], [s * x, topY - 0.04, 0.44]], 0.022, mat, p);
  }
}

export function addPauldrons(j: CharacterJoints, p: Finish, detail: boolean, style: 'plate' | 'layered' | 'epaulet' | 'mantle' | 'brace') {
  for (const [arm, s] of [[j.leftArm, 1], [j.rightArm, -1]] as const) {
    if (style === 'plate') {
      sphere(arm, [s * 0.03, 0.02, 0], [0.165, 0.135, 0.175], p.alloy, p);
      shell(arm, [s * 0.06, -0.075, 0], [0.17, 0.07, 0.24], p.alloy, 0.45);
      box(arm, [s * 0.03, 0.145, 0], [0.035, 0.045, 0.22], p.accent);
      addRivets(arm, [[s * 0.14, -0.075, 0.08], [s * 0.14, -0.075, -0.08]], p, detail, 0.014, 0, -s * Math.PI / 2);
    } else if (style === 'layered') {
      for (let k = 0; k < 3; k++) {
        const plate = shell(arm, [s * (0.07 + k * 0.02), 0.07 - k * 0.075, 0], [0.15, 0.06, 0.27 - k * 0.015], p.primary, 0.35);
        plate.rotation.z = -s * 0.24;
        if (detail) box(plate, [s * 0.075, -0.01, 0], [0.014, 0.022, 0.22], p.accent);
      }
      box(arm, [s * 0.02, 0.125, 0], [0.13, 0.028, 0.22], p.accent);
    } else if (style === 'epaulet') {
      shell(arm, [s * 0.02, 0.095, 0], [0.22, 0.042, 0.16], p.accent, 0.42);
      tube(arm, [s * 0.11, 0.085, 0], 0.078, 0.082, 0.045, p.accent, 12);
      if (detail) {
        for (const z of [-0.045, 0, 0.045]) box(arm, [s * 0.15, 0.045, z], [0.026, 0.065, 0.024], p.accent);
      }
    } else if (style === 'mantle') {
      const cap = shell(arm, [s * 0.015, 0.035, 0], [0.255, 0.11, 0.285], p.primary, 0.55);
      cap.rotation.z = -s * 0.16;
      if (detail) box(arm, [s * 0.12, -0.015, 0], [0.024, 0.03, 0.23], p.accent);
    } else {
      shell(arm, [s * 0.05, 0.03, 0], [0.21, 0.14, 0.29], p.accent, 0.36);
      shell(arm, [s * 0.12, 0.05, 0], [0.065, 0.17, 0.14], p.primary, 0.32);
      strut(arm, [s * 0.11, 0.11, -0.09], [s * 0.12, -0.14, -0.09], 0.018, p.alloy, 10);
      addRivets(arm, [[s * 0.15, 0.08, 0.05], [s * 0.15, 0.02, 0.05]], p, detail, 0.014, 0, -s * Math.PI / 2);
    }
  }
}

function buildMedievalKnight(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Great helm + plumed crest + hinged visor
  tube(j.head, [0, 0.09, 0], 0.278, 0.292, 0.38, p.alloy, 14);
  sphere(j.head, [0, 0.275, 0], [0.276, 0.105, 0.276], p.alloy, p);
  box(j.head, [0, 0.13, 0.282], [0.042, 0.31, 0.026], p.accent);
  box(j.head, [0, 0.18, 0.274], [0.32, 0.044, 0.032], p.accent);
  const visor = group(j.head, 'HelmVisor', [0, 0.15, 0.15]);
  shell(visor, [0, -0.045, 0.135], [0.34, 0.17, 0.09], p.alloy, 0.45);
  box(visor, [0, 0.005, 0.178], [0.24, 0.026, 0.016], p.inset);
  if (detail) {
    for (const x of [-0.08, -0.04, 0.04, 0.08]) box(visor, [x, -0.07, 0.18], [0.014, 0.075, 0.014], p.inset);
  }
  tube(j.head, [0, 0.39, 0.02], 0.04, 0.055, 0.08, p.accent, 10);
  for (let i = 0; i < (detail ? 6 : 4); i++) {
    const t = i / (detail ? 5 : 3);
    sphere(j.head, [0, 0.48 + Math.sin(t * 2.4) * 0.07, 0.06 - t * 0.34], [0.048, 0.095 - t * 0.02, 0.085], p.primary, p);
  }
  addRivets(j.head, [[-0.22, 0.22, 0.17], [0.22, 0.22, 0.17]], p, detail, 0.016, Math.PI / 2);
  // Breastplate, gorget, heraldic tabard
  ring(j.chest, [0, 0.185, 0.01], 0.22, 0.055, 0.06, p.accent);
  shell(j.chest, [0, 0.01, 0.02], [0.68, 0.39, 0.45], p.alloy, 0.46);
  shell(j.chest, [0, -0.04, 0.252], [0.36, 0.38, 0.045], p.primary, 0.32);
  const crest = box(j.chest, [0, 0.02, 0.28], [0.13, 0.13, 0.024], p.accent);
  crest.rotation.z = Math.PI / 4;
  shell(j.hips, [0, -0.08, 0.195], [0.29, 0.36, 0.036], p.primary, 0.28);
  shell(j.hips, [0, -0.08, -0.185], [0.3, 0.34, 0.036], p.primary, 0.28);
  addPauldrons(j, p, detail, 'plate');
  // Detachable Kite Shield on LeftForeArm
  const shield = group(j.leftForeArm, 'KnightShield', [0.135, -0.11, 0.03]);
  shield.rotation.y = 0.35;
  shell(shield, [0.03, 0.06, 0], [0.055, 0.42, 0.42], p.primary, 0.32);
  const tip = cone(shield, [0.03, -0.25, 0], 0.21, 0.28, p.primary, p, 4);
  tip.rotation.set(Math.PI, 0, 0);
  tip.scale.set(0.13, 1, 1);
  box(shield, [0.062, 0.03, 0], [0.022, 0.48, 0.052], p.accent);
  box(shield, [0.062, 0.09, 0], [0.022, 0.052, 0.36], p.accent);
  sphere(shield, [0.072, 0.09, 0], [0.035, 0.065, 0.065], p.alloy, p);
  tube(shield, [-0.04, 0, 0], 0.095, 0.095, 0.16, p.dark, 10);
  addRivets(shield, [[0.06, 0.22, 0.15], [0.06, 0.22, -0.15], [0.06, -0.1, 0.14], [0.06, -0.1, -0.14]], p, detail, 0.015, 0, -Math.PI / 2);
}

function buildArcaneMage(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable pointed WizardHat
  const hat = group(j.head, 'WizardHat', [0, 0.245, -0.01]);
  lathe(hat, [0, 0, 0], [[0.2, -0.01], [0.46, -0.035], [0.47, 0], [0.26, 0.045], [0.22, 0.08]], p.primary, p, 16);
  const band = torus(hat, [0, 0.055, 0], 0.235, 0.032, p.accent, p);
  band.rotation.x = Math.PI / 2;
  box(hat, [0, 0.06, 0.258], [0.095, 0.075, 0.024], p.accent);
  box(hat, [0, 0.06, 0.272], [0.05, 0.04, 0.014], p.optic);
  const lower = tube(hat, [0, 0.24, -0.025], 0.12, 0.235, 0.34, p.primary, 14);
  lower.rotation.x = -0.16;
  const spire = cone(hat, [0.03, 0.51, -0.11], 0.125, 0.34, p.primary, p, 14);
  spire.rotation.set(-0.52, 0, -0.22);
  if (detail) sphere(hat, [0.08, 0.65, -0.2], [0.032, 0.032, 0.032], p.accent, p);
  // Shoulder mantle, cloak & brooch
  lathe(j.chest, [0, 0.05, 0], [[0.42, -0.14], [0.38, 0.04], [0.23, 0.16], [0.18, 0.16], [0.35, 0.02], [0.39, -0.14], [0.42, -0.14]], p.primary, p, 16);
  const trimRing = torus(j.chest, [0, -0.09, 0], 0.405, 0.022, p.accent, p);
  trimRing.rotation.x = Math.PI / 2;
  shell(j.chest, [0, -0.22, -0.26], [0.56, 0.62, 0.075], p.primary, 0.35);
  box(j.chest, [0, 0.11, 0.245], [0.11, 0.11, 0.035], p.accent).rotation.z = Math.PI / 4;
  sphere(j.chest, [0, 0.11, 0.268], [0.04, 0.04, 0.025], p.optic, p);
  addPauldrons(j, p, detail, 'mantle');
  for (const fore of [j.leftForeArm, j.rightForeArm]) tube(fore, [0, -0.21, 0.01], 0.11, 0.135, 0.1, p.accent, 12);
  // Belt tome (spellbook) on right hip + front robe sash
  shell(j.hips, [0, -0.1, 0.19], [0.24, 0.42, 0.035], p.primary, 0.3);
  box(j.hips, [0, -0.1, 0.21], [0.06, 0.38, 0.015], p.accent);
  const tome = group(j.hips, 'BeltTome', [-0.31, -0.02, 0.06]);
  tome.rotation.z = 0.16;
  box(tome, [0, 0, 0], [0.085, 0.24, 0.19], p.primary);
  box(tome, [0, 0, 0.014], [0.064, 0.21, 0.185], p.stencil);
  box(tome, [-0.046, 0, 0], [0.015, 0.245, 0.195], p.primary);
  box(tome, [-0.056, 0, 0], [0.012, 0.065, 0.065], p.accent).rotation.x = Math.PI / 4;
  addRivets(tome, [[-0.052, 0.09, 0.07], [-0.052, -0.09, 0.07], [-0.052, 0.09, -0.07], [-0.052, -0.09, -0.07]], p, detail, 0.013, 0, Math.PI / 2);
}

function buildCyberCourier(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Wide hinged CyberVisor + temple fins
  const visor = group(j.head, 'CyberVisor', [0, 0.11, 0.04]);
  shell(visor, [0, 0, 0.22], [0.5, 0.165, 0.13], p.dark, 0.52);
  shell(visor, [0, 0, 0.248], [0.46, 0.115, 0.1], p.optic, 0.56);
  box(visor, [0, 0.068, 0.285], [0.41, 0.022, 0.022], p.accent);
  for (const s of [-1, 1]) {
    box(j.head, [s * 0.275, 0.13, -0.06], [0.032, 0.18, 0.13], p.primary).rotation.x = -0.38;
    if (detail) box(j.head, [s * 0.295, 0.15, -0.08], [0.014, 0.14, 0.035], p.accent).rotation.x = -0.38;
  }
  // High cyber collar rig & diagonal courier sling strap
  for (const s of [-1, 1]) {
    const fin = shell(j.chest, [s * 0.23, 0.21, -0.02], [0.07, 0.17, 0.26], p.primary, 0.35);
    fin.rotation.z = -s * 0.22;
    box(fin, [-s * 0.036, 0.02, 0.02], [0.014, 0.11, 0.18], p.accent);
  }
  shell(j.chest, [0, 0.21, -0.17], [0.42, 0.16, 0.065], p.primary, 0.4);
  hose(j.chest, [[0.19, 0.18, 0.19], [0.02, 0.02, 0.265], [-0.19, -0.16, 0.21]], 0.028, p.dark, p);
  box(j.chest, [0.02, 0.02, 0.282], [0.095, 0.075, 0.032], p.accent);
  // Forearm holo-scanner pad
  shell(j.leftForeArm, [0.085, -0.14, 0.03], [0.055, 0.17, 0.12], p.dark, 0.4);
  box(j.leftForeArm, [0.115, -0.14, 0.03], [0.012, 0.11, 0.075], p.optic);
  if (detail) box(j.leftForeArm, [0.118, -0.075, 0.03], [0.014, 0.02, 0.075], p.accent);
  // Detachable angled CourierPack
  const pack = group(j.chest, 'CourierPack', [0, -0.01, -0.4]);
  const shellBody = shell(pack, [0, 0, -0.04], [0.46, 0.5, 0.21], p.primary, 0.46);
  shellBody.rotation.z = -0.18;
  for (const y of [-0.07, 0.06]) {
    box(pack, [0, y, -0.152], [0.34, 0.036, 0.022], p.accent).rotation.z = -0.18;
  }
  strut(pack, [-0.12, 0.25, -0.04], [0.12, 0.25, -0.04], 0.02, p.alloy, 10);
  addStraps(pack, p, 0.17, 0.18);
  if (detail) {
    for (const s of [-1, 1]) box(pack, [s * 0.23, -0.04, -0.05], [0.024, 0.12, 0.04], p.optic);
    addRivets(pack, [[-0.17, 0.16, -0.148], [0.17, 0.16, -0.148]], p, detail, 0.015, -Math.PI / 2);
  }
}

function buildDeepSeaDiver(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Classic brass diving helmet with front & side portholes
  sphere(j.head, [0, 0.11, 0], [0.295, 0.305, 0.295], p.accent, p);
  const frontBezel = torus(j.head, [0, 0.11, 0.285], 0.125, 0.028, p.accent, p);
  sphere(j.head, [0, 0.11, 0.275], [0.118, 0.118, 0.048], p.optic, p);
  if (detail) {
    box(frontBezel, [0, 0, 0.036], [0.23, 0.018, 0.016], p.accent);
    box(frontBezel, [0, 0, 0.036], [0.018, 0.23, 0.016], p.accent);
  }
  for (const s of [-1, 1]) {
    tube(j.head, [s * 0.285, 0.11, 0.02], 0.09, 0.095, 0.05, p.accent, 12).rotation.z = s * Math.PI / 2;
    tube(j.head, [s * 0.308, 0.11, 0.02], 0.068, 0.068, 0.018, p.optic, 12).rotation.z = s * Math.PI / 2;
  }
  tube(j.head, [0, 0.42, 0], 0.055, 0.065, 0.05, p.edge, 12);
  // Bolted brass breastplate corselet
  shell(j.chest, [0, 0.155, 0.01], [0.68, 0.15, 0.47], p.accent, 0.44);
  addRivets(j.chest, [[-0.22, 0.17, 0.235], [0, 0.16, 0.248], [0.22, 0.17, 0.235], [-0.22, 0.17, -0.215], [0.22, 0.17, -0.215]], p, detail, 0.018, Math.PI / 2);
  // Heavy weighted belt
  for (const x of [-0.24, -0.11, 0.11, 0.24]) shell(j.hips, [x, 0.06, 0.18], [0.105, 0.125, 0.075], p.dark, 0.3);
  for (const x of [-0.18, 0, 0.18]) shell(j.hips, [x, 0.06, -0.175], [0.12, 0.125, 0.075], p.dark, 0.3);
  box(j.hips, [0, 0.06, 0.205], [0.1, 0.105, 0.04], p.accent);
  // Detachable twin DiveTanks
  const tanks = group(j.chest, 'DiveTanks', [0, -0.02, -0.43]);
  for (const s of [-1, 1]) {
    tube(tanks, [s * 0.13, -0.02, 0], 0.105, 0.105, 0.46, p.primary, 14);
    sphere(tanks, [s * 0.13, 0.21, 0], [0.105, 0.085, 0.105], p.primary, p);
    sphere(tanks, [s * 0.13, -0.25, 0], [0.105, 0.065, 0.105], p.dark, p);
    tube(tanks, [s * 0.13, 0.31, 0], 0.032, 0.038, 0.07, p.accent, 10);
  }
  strut(tanks, [-0.13, 0.32, 0], [0.13, 0.32, 0], 0.024, p.accent, 10);
  for (const y of [-0.12, 0.1]) box(tanks, [0, y, 0.03], [0.46, 0.045, 0.23], p.dark);
  hose(tanks, [[0.13, 0.32, 0.02], [0.24, 0.28, 0.22], [0.18, 0.19, 0.39]], 0.024, p.tire, p);
  addStraps(tanks, p, 0.16, 0.19, p.dark);
  if (detail) tube(tanks, [0, 0.35, -0.03], 0.042, 0.042, 0.026, p.stencil, 12).rotation.x = Math.PI / 2;
}

function buildArcticExplorer(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Insulated parka hood + thick fur ruff + snow goggles
  sphere(j.head, [0, 0.1, -0.04], [0.295, 0.295, 0.29], p.primary, p);
  const ruff = torus(j.head, [0, 0.09, 0.175], 0.235, 0.068, p.accent, p);
  ruff.scale.set(1.06, 1.08, 0.85);
  if (detail) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      sphere(j.head, [Math.cos(a) * 0.25, 0.09 + Math.sin(a) * 0.255, 0.19], [0.055, 0.055, 0.05], p.stencil, p);
    }
  }
  shell(j.head, [0, 0.12, 0.245], [0.34, 0.125, 0.09], p.dark, 0.48);
  for (const s of [-1, 1]) sphere(j.head, [s * 0.085, 0.12, 0.285], [0.072, 0.052, 0.032], p.optic, p);
  // Quilted parka torso & fleece-trimmed hem skirt
  shell(j.chest, [0, -0.01, 0.02], [0.68, 0.4, 0.44], p.primary, 0.48);
  box(j.chest, [0, -0.01, 0.245], [0.075, 0.36, 0.028], p.dark);
  if (detail) {
    for (const y of [-0.1, 0.02, 0.12]) box(j.chest, [0, y, 0.264], [0.11, 0.024, 0.018], p.accent);
  }
  shell(j.hips, [0, -0.015, 0.01], [0.62, 0.31, 0.44], p.primary, 0.36);
  shell(j.hips, [0, -0.16, 0.01], [0.63, 0.055, 0.45], p.accent, 0.36);
  // Detachable ExpeditionPack with rolled mat & ice axe
  const pack = group(j.chest, 'ExpeditionPack', [0, -0.02, -0.43]);
  shell(pack, [0, -0.02, -0.03], [0.44, 0.48, 0.24], p.primary, 0.42);
  shell(pack, [0, 0.21, -0.03], [0.46, 0.1, 0.26], p.dark, 0.4);
  const matRoll = tube(pack, [0, 0.32, -0.03], 0.085, 0.085, 0.52, p.accent, 14);
  matRoll.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) {
    strut(pack, [s * 0.22, -0.28, 0.06], [s * 0.22, 0.29, 0.06], 0.018, p.alloy, 10);
    if (detail) tube(pack, [s * 0.16, 0.32, -0.03], 0.091, 0.091, 0.03, p.dark, 12).rotation.z = Math.PI / 2;
  }
  strut(pack, [-0.14, -0.24, -0.17], [0.14, 0.22, -0.17], 0.016, p.alloy, 10);
  box(pack, [0.15, 0.22, -0.17], [0.16, 0.032, 0.026], p.edge).rotation.z = -0.5;
  addStraps(pack, p, 0.17, 0.19);
}

function buildArtisanChef(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Detachable tall pleated ChefHat (toque)
  const hat = group(j.head, 'ChefHat', [0, 0.24, 0]);
  tube(hat, [0, 0.09, 0], 0.225, 0.235, 0.2, p.primary, 16);
  tube(hat, [0, 0.01, 0], 0.24, 0.242, 0.036, p.accent, 16);
  lathe(hat, [0, 0.18, 0], [[0.21, 0], [0.3, 0.11], [0.31, 0.21], [0.22, 0.3], [0.004, 0.31]], p.primary, p, 18);
  if (detail) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      sphere(hat, [Math.sin(a) * 0.245, 0.31, Math.cos(a) * 0.245], [0.072, 0.125, 0.072], p.stencil, p);
    }
  }
  // Double-breasted chef coat + bistro neckerchief
  shell(j.chest, [0, 0, 0.02], [0.67, 0.39, 0.45], p.primary, 0.45);
  const scarf = torus(j.chest, [0, 0.185, 0.01], 0.19, 0.044, p.accent, p);
  scarf.rotation.x = Math.PI / 2;
  box(j.chest, [-0.035, 0.1, 0.255], [0.055, 0.13, 0.028], p.accent).rotation.z = 0.24;
  box(j.chest, [0.035, 0.1, 0.255], [0.055, 0.13, 0.028], p.accent).rotation.z = -0.24;
  if (detail) {
    for (const x of [-0.08, 0.08]) {
      for (const y of [-0.1, -0.02, 0.06]) tube(j.chest, [x, y, 0.254], 0.018, 0.018, 0.016, p.dark, 8).rotation.x = Math.PI / 2;
    }
    strut(j.chest, [0.16, 0.04, 0.26], [0.18, 0.15, 0.265], 0.01, p.alloy, 8);
  }
  // Waist apron & folded cuffs
  shell(j.hips, [0, 0.07, 0.01], [0.58, 0.125, 0.43], p.accent, 0.35);
  shell(j.hips, [0, -0.14, 0.195], [0.46, 0.42, 0.04], p.primary, 0.25);
  shell(j.hips, [0, -0.14, 0.22], [0.24, 0.14, 0.024], p.accent, 0.25);
  box(j.hips, [0, 0.04, -0.22], [0.14, 0.08, 0.05], p.accent);
  for (const fore of [j.leftForeArm, j.rightForeArm]) {
    tube(fore, [0, -0.21, 0.01], 0.11, 0.118, 0.095, p.primary, 12);
    tube(fore, [0, -0.264, 0.01], 0.114, 0.114, 0.028, p.accent, 12);
  }
}

function buildDesertNomad(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Layered head wrap scarf + headband cord + flowing side tails
  sphere(j.head, [0, 0.13, -0.01], [0.285, 0.265, 0.28], p.primary, p);
  for (const y of [0.21, 0.26]) {
    const cord = torus(j.head, [0, y, 0], 0.255, 0.026, p.dark, p);
    cord.rotation.x = Math.PI / 2;
  }
  box(j.head, [0, 0.235, 0.265], [0.075, 0.065, 0.024], p.accent);
  for (const s of [-1, 1]) {
    shell(j.head, [s * 0.265, -0.03, -0.05], [0.075, 0.32, 0.22], p.primary, 0.35);
  }
  shell(j.head, [0, -0.04, -0.23], [0.44, 0.34, 0.07], p.accent, 0.38);
  // Asymmetric shoulder drape shawl
  shell(j.chest, [0.02, 0.08, 0.02], [0.72, 0.23, 0.46], p.accent, 0.34);
  hose(j.chest, [[0.24, 0.16, 0.19], [0.02, 0.0, 0.26], [-0.22, -0.17, 0.2]], 0.038, p.accent, p);
  sphere(j.chest, [0.2, 0.13, 0.235], [0.05, 0.05, 0.028], p.alloy, p);
  shell(j.chest, [0, -0.15, -0.25], [0.54, 0.48, 0.07], p.primary, 0.38);
  // Water flask on right hip
  const flask = group(j.hips, 'WaterFlask', [-0.31, -0.03, 0.04]);
  sphere(flask, [0, -0.02, 0], [0.07, 0.115, 0.11], p.primary, p);
  tube(flask, [0, 0.11, 0], 0.028, 0.034, 0.055, p.dark, 10);
  if (detail) torus(flask, [0, -0.02, 0], 0.112, 0.015, p.accent, p).rotation.y = Math.PI / 2;
  // Detachable NomadSatchel on left hip
  const satchel = group(j.hips, 'NomadSatchel', [0.32, -0.05, 0.03]);
  satchel.rotation.z = -0.14;
  shell(satchel, [0, 0, 0], [0.13, 0.25, 0.27], p.primary, 0.36);
  shell(satchel, [0.025, 0.06, 0], [0.125, 0.14, 0.28], p.accent, 0.34);
  if (detail) {
    for (const z of [-0.075, 0.075]) {
      box(satchel, [0.088, 0.02, z], [0.018, 0.11, 0.028], p.dark);
      box(satchel, [0.096, -0.01, z], [0.016, 0.035, 0.035], p.alloy);
    }
  }
}

function buildRescueFirefighter(root: T.Group, p: Finish, detail: boolean) {
  const j = startCharacter(root, p, detail, true);
  // Ribbed fire helmet + ducktail brim + hinged FireVisor
  sphere(j.head, [0, 0.13, -0.01], [0.275, 0.25, 0.285], p.primary, p);
  shell(j.head, [0, 0.345, -0.01], [0.085, 0.11, 0.41], p.primary, 0.45);
  const brim = lathe(j.head, [0, 0.06, -0.04], [[0.24, -0.02], [0.37, -0.07], [0.38, -0.04], [0.25, 0.02]], p.primary, p, 16);
  brim.scale.set(0.95, 1, 1.18);
  shell(j.head, [0, 0.25, 0.26], [0.13, 0.14, 0.035], p.accent, 0.36);
  const visor = group(j.head, 'FireVisor', [0, 0.12, 0.06]);
  shell(visor, [0, -0.035, 0.21], [0.43, 0.18, 0.12], p.optic, 0.55);
  for (const s of [-1, 1]) tube(visor, [s * 0.245, 0, -0.01], 0.032, 0.032, 0.03, p.dark, 10).rotation.z = Math.PI / 2;
  // Turnout coat with high-vis reflective stripes
  shell(j.chest, [0, 0, 0.015], [0.66, 0.39, 0.43], p.primary, 0.44);
  for (const y of [-0.09, 0.07]) shell(j.chest, [0, y, 0.015], [0.68, 0.05, 0.45], p.accent, 0.44);
  box(j.chest, [0.19, 0.1, 0.24], [0.06, 0.09, 0.045], p.dark);
  for (const fore of [j.leftForeArm, j.rightForeArm]) tube(fore, [0, -0.2, 0.01], 0.108, 0.11, 0.06, p.accent, 12);
  addRivets(j.chest, [[0, 0.13, 0.24], [0, 0.01, 0.24], [0, -0.11, 0.24]], p, detail, 0.016, Math.PI / 2);
  // Detachable SCBA AirTank
  const tank = group(j.chest, 'AirTank', [0, -0.02, -0.43]);
  shell(tank, [0, -0.02, 0.06], [0.36, 0.46, 0.08], p.dark, 0.35);
  tube(tank, [0, 0, -0.04], 0.125, 0.125, 0.44, p.accent, 14);
  sphere(tank, [0, 0.22, -0.04], [0.125, 0.09, 0.125], p.accent, p);
  sphere(tank, [0, -0.22, -0.04], [0.125, 0.08, 0.125], p.dark, p);
  for (const y of [-0.1, 0.1]) tube(tank, [0, y, -0.04], 0.133, 0.133, 0.036, p.dark, 14);
  hose(tank, [[0, 0.26, -0.02], [-0.2, 0.25, 0.2], [-0.18, 0.12, 0.4]], 0.022, p.tire, p);
  addStraps(tank, p, 0.17, 0.19);
  if (detail) tube(tank, [0, -0.31, -0.04], 0.045, 0.045, 0.05, p.alloy, 10);
}

function charDef(
  id: string, code: string, name: string, primary: string, accent: string, description: string,
  riggedParts: readonly RiggedPartSpec[], detachableParts: readonly DetachablePartSpec[],
  build: (root: T.Group, p: Finish, detail: boolean) => void,
): CharacterAssetDef {
  return { id, code, category: 'Character', browseCategory: 'character', name, primary, accent, description, physicsBody: 'dynamic', riggedParts, detachableParts, build };
}

export const charactersA: readonly CharacterAssetDef[] = [
  charDef('medieval-knight', 'CH-01', 'Medieval Knight', '#4b5f7a', '#d9a441',
    'Armored medieval knight with plumed great helm, plate pauldrons, heraldic crest, and detachable shield.',
    [{ name: 'HelmVisor', label: 'Helmet visor', type: 'rotate', axis: 'x', range: [0, -52], describe: 'Raises the armored great helm face visor' }],
    [{ name: 'KnightShield', label: 'Knight shield', describe: 'Forearm-mounted heraldic heater shield' }], buildMedievalKnight),
  charDef('arcane-mage', 'CH-02', 'Arcane Mage', '#3f3478', '#e2b14a',
    'Robed arcane spellcaster with draped shoulder mantle, hip-slung spellbook, and detachable wizard hat.',
    [], [{ name: 'WizardHat', label: 'Wizard hat', describe: 'Wide-brimmed crooked arcane wizard hat' }], buildArcaneMage),
  charDef('cyber-courier', 'CH-03', 'Cyber Courier', '#263849', '#2ce0c8',
    'High-speed urban cyber courier with wraparound neon visor, standing collar rig, and detachable sling pack.',
    [{ name: 'CyberVisor', label: 'Cyber visor', type: 'rotate', axis: 'x', range: [0, -48], describe: 'Flips up the wide holographic courier visor' }],
    [{ name: 'CourierPack', label: 'Courier pack', describe: 'Angled hard-shell delivery sling backpack' }], buildCyberCourier),
  charDef('deep-sea-diver', 'CH-04', 'Deep Sea Diver', '#2b5d6b', '#cf9338',
    'Hard-hat deep-sea diver wearing a brass porthole helmet, weighted belt, and detachable twin dive tanks.',
    [], [{ name: 'DiveTanks', label: 'Dive tanks', describe: 'Twin pressurized back-mounted diving cylinders' }], buildDeepSeaDiver),
  charDef('arctic-explorer', 'CH-05', 'Arctic Explorer', '#c94c38', '#e8dfd1',
    'Polar expedition scout in a fur-ruffed down parka with snow goggles and detachable alpine pack.',
    [], [{ name: 'ExpeditionPack', label: 'Expedition pack', describe: 'External-frame polar pack with rolled sleeping mat and ice axe' }], buildArcticExplorer),
  charDef('artisan-chef', 'CH-06', 'Artisan Chef', '#ece8df', '#b83b3b',
    'Culinary artisan wearing a double-breasted coat, bistro neckerchief, waist apron, and detachable pleated toque.',
    [], [{ name: 'ChefHat', label: 'Chef hat', describe: 'Tall pleated white chef toque' }], buildArtisanChef),
  charDef('desert-nomad', 'CH-07', 'Desert Nomad', '#c9975b', '#2f6d7a',
    'Dune wayfarer with layered head wrap, indigo shoulder drape, hip canteen, and detachable woven satchel.',
    [], [{ name: 'NomadSatchel', label: 'Nomad satchel', describe: 'Hip-slung desert travel satchel with brass buckles' }], buildDesertNomad),
  charDef('rescue-firefighter', 'CH-08', 'Rescue Firefighter', '#b82e24', '#e8c43a',
    'Emergency rescue firefighter with ribbed helmet, hinged face visor, reflective turnout gear, and detachable air tank.',
    [{ name: 'FireVisor', label: 'Fire visor', type: 'rotate', axis: 'x', range: [0, -55], describe: 'Lifts the heat-resistant helmet face shield' }],
    [{ name: 'AirTank', label: 'Air tank', describe: 'Back-mounted SCBA breathing cylinder and hose' }], buildRescueFirefighter),
];
