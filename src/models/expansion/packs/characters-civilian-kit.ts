import type * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import {
  addRivets, addStraps, cone, hose, lathe, sphere, startCharacter, torus,
  type CharacterJoints,
} from '../../collections/characters-a';
import { box, group, ring, shell, strut, tube, type Finish, type Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/characters-civilian';

export { addRivets, addStraps, cone, hose, lathe, sphere, startCharacter, torus, type CharacterJoints };

export const HPI = Math.PI / 2;

export function rig(
  name: string, label: string, axis: Axis, range: [number, number], describe: string,
  type: 'rotate' | 'slide' = 'rotate',
): RiggedPartSpec {
  return { name, label, type, axis, range, describe };
}

export function det(name: string, label: string, describe: string): DetachablePartSpec {
  return { name, label, describe };
}

export function charAsset(
  meta: ExpansionMetaItem,
  riggedParts: readonly RiggedPartSpec[],
  detachableParts: readonly DetachablePartSpec[],
  build: (root: T.Group, p: Finish, detail: boolean) => void,
): ProceduralAssetDef {
  return {
    id: meta.id, code: meta.code, category: meta.category, browseCategory: meta.browseCategory,
    name: meta.name, primary: meta.primary, accent: meta.accent, description: meta.description,
    physicsBody: 'dynamic', riggedParts, detachableParts, build,
  };
}

/** Add a tailored coat/apron torso shell cleanly offset from the Suit chest so no faces Z-fight. */
export function addCoatTorso(j: CharacterJoints, p: Finish, detail: boolean, opts: {
  coatMat?: T.Material; trimMat?: T.Material; skirtH?: number; lapels?: boolean; buttons?: boolean; tie?: boolean;
} = {}) {
  const cm = opts.coatMat ?? p.primary;
  const tm = opts.trimMat ?? p.accent;
  shell(j.chest, [0, 0, 0.016], [0.68, 0.4, 0.46], cm, 0.44);
  if (opts.skirtH && opts.skirtH > 0) {
    shell(j.hips, [0, -opts.skirtH * 0.3, 0.01], [0.61, opts.skirtH, 0.42], cm, 0.38);
    shell(j.hips, [0, 0.075, 0.015], [0.62, 0.085, 0.43], tm, 0.36);
  }
  if (opts.lapels) {
    for (const s of [-1, 1]) {
      const lap = box(j.chest, [s * 0.125, 0.11, 0.258], [0.11, 0.2, 0.026], tm);
      lap.rotation.z = -s * 0.22;
    }
  }
  if (opts.tie) {
    box(j.chest, [0, 0.02, 0.262], [0.052, 0.24, 0.02], tm);
    sphere(j.chest, [0, 0.15, 0.264], [0.042, 0.036, 0.024], tm, p);
  }
  if (opts.buttons && detail) {
    for (const s of [-1, 1]) {
      for (const y of [-0.09, -0.01, 0.07]) {
        tube(j.chest, [s * 0.085, y, 0.258], 0.016, 0.016, 0.018, tm, 10).rotation.x = HPI;
      }
    }
  }
}

/** Add a workshop/service bib apron draped cleanly over chest and hips. */
export function addBibApron(j: CharacterJoints, p: Finish, detail: boolean, apronMat: T.Material, pocketMat: T.Material) {
  shell(j.chest, [0, -0.02, 0.252], [0.42, 0.34, 0.042], apronMat, 0.32);
  shell(j.hips, [0, -0.1, 0.205], [0.48, 0.42, 0.042], apronMat, 0.3);
  shell(j.hips, [0, 0.072, 0.01], [0.59, 0.125, 0.42], pocketMat, 0.36);
  shell(j.hips, [0, -0.12, 0.236], [0.28, 0.14, 0.026], pocketMat, 0.28);
  for (const s of [-1, 1]) {
    hose(j.chest, [[s * 0.15, 0.14, 0.25], [s * 0.16, 0.21, 0.04], [s * 0.14, 0.08, -0.22]], 0.018, pocketMat, p);
  }
  if (detail) {
    for (const x of [-0.08, 0, 0.08]) box(j.hips, [x, -0.07, 0.255], [0.024, 0.08, 0.016], p.alloy);
  }
}

/** Add round spectacles mounted onto the head face. */
export function addGlasses(head: T.Bone, p: Finish, y = 0.115, z = 0.262, frameMat: T.Material = p.accent) {
  for (const s of [-1, 1]) {
    torus(head, [s * 0.09, y, z], 0.056, 0.013, frameMat, p);
    tube(head, [s * 0.09, y, z - 0.004], 0.046, 0.046, 0.014, p.optic, 12).rotation.x = HPI;
    strut(head, [s * 0.145, y, z], [s * 0.24, y, 0.05], 0.01, frameMat, 10);
  }
  strut(head, [-0.036, y, z], [0.036, y, z], 0.01, frameMat, 10);
}

/** Add a clean detachable fedora/brim hat mounted securely on j.head. */
export function addBrimmedHat(head: T.Bone, name: string, p: Finish, detail: boolean, opts: {
  brimR: number; crownR: number; crownH: number; hatMat: T.Material; bandMat: T.Material; tiltZ?: number;
}) {
  const hat = group(head, name, [0, 0.245, 0]);
  if (opts.tiltZ) hat.rotation.z = opts.tiltZ;
  tube(hat, [0, 0, 0], opts.brimR, opts.brimR * 1.03, 0.032, opts.hatMat, 16);
  tube(hat, [0, opts.crownH * 0.5, 0], opts.crownR * 0.9, opts.crownR, opts.crownH, opts.hatMat, 16);
  sphere(hat, [0, opts.crownH, 0], [opts.crownR * 0.9, 0.05, opts.crownR * 0.9], opts.hatMat, p);
  tube(hat, [0, 0.055, 0], opts.crownR * 1.04, opts.crownR * 1.04, 0.055, opts.bandMat, 16);
  if (detail) box(hat, [opts.crownR * 1.04, 0.06, 0.04], [0.025, 0.065, 0.09], p.stencil);
  return hat;
}

/** Add a side hip satchel or pouch connected cleanly to j.hips. */
export function addHipBag(hips: T.Bone, name: string, side: -1 | 1, p: Finish, detail: boolean, bodyMat: T.Material, flapMat: T.Material) {
  const bag = group(hips, name, [side * 0.32, -0.04, 0.03]);
  bag.rotation.z = -side * 0.12;
  shell(bag, [0, 0, 0], [0.14, 0.26, 0.28], bodyMat, 0.36);
  shell(bag, [side * 0.032, 0.085, 0], [0.125, 0.14, 0.3], flapMat, 0.32);
  strut(bag, [-side * 0.05, 0.11, 0], [-side * 0.12, 0.14, 0], 0.028, p.dark, 10);
  if (detail) {
    for (const z of [-0.075, 0.075]) {
      box(bag, [side * 0.095, 0.01, z], [0.02, 0.1, 0.026], p.dark);
      box(bag, [side * 0.105, -0.02, z], [0.018, 0.036, 0.036], p.alloy);
    }
  }
  return bag;
}

/** Add a forearm/hand cuff sleeve cleanly on both forearms. */
export function addCuffs(j: CharacterJoints, p: Finish, mat: T.Material, trim?: T.Material) {
  for (const fore of [j.leftForeArm, j.rightForeArm]) {
    tube(fore, [0, -0.205, 0.01], 0.115, 0.118, 0.095, mat, 12);
    if (trim) tube(fore, [0, -0.258, 0.01], 0.121, 0.121, 0.026, trim, 12);
  }
}

export function addCollarRing(chest: T.Bone, mat: T.Material, r = 0.21, h = 0.06, y = 0.185) {
  return ring(chest, [0, y, 0.008], r, 0.048, h, mat);
}

export function addHandHandle(parent: T.Object3D, at: Point, len: number, r: number, mat: T.Material) {
  return tube(parent, at, r, r, len, mat, 12);
}
