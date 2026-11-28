import type * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import {
  addPauldrons, addRivets, addStraps, cone, hose, lathe, sphere, startCharacter, torus,
  type CharacterJoints,
} from '../../collections/characters-a';
import { box, group, ring, shell, strut, tube, type Finish, type Point } from '../../parts';
import type { ExpansionMetaItem } from '../meta/characters-adventure';

export {
  addPauldrons, addRivets, addStraps, cone, hose, lathe, sphere, startCharacter, torus,
  type CharacterJoints,
};

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

/** Add a tailored armor/coat torso and belt cleanly offset from Suit faces to avoid Z-fighting. */
export function addArmorTorso(j: CharacterJoints, p: Finish, detail: boolean, opts: {
  bodyMat?: T.Material; trimMat?: T.Material; beltMat?: T.Material;
  skirtH?: number; collar?: boolean; baldric?: boolean; cape?: boolean;
  lapels?: boolean; buttons?: boolean; botOffset?: boolean;
} = {}) {
  const bm = opts.bodyMat ?? p.primary;
  const tm = opts.trimMat ?? p.accent;
  const beltMat = opts.beltMat ?? p.dark;
  const zOff = opts.botOffset ? 0.032 : 0.016;
  const depth = opts.botOffset ? 0.5 : 0.46;
  shell(j.chest, [0, 0, zOff], [0.68, 0.4, depth], bm, 0.44);
  shell(j.hips, [0, 0.072, 0.012], [0.61, 0.125, 0.43], beltMat, 0.36);
  box(j.hips, [0, 0.072, 0.24], [0.11, 0.088, 0.028], tm);
  if (opts.skirtH !== undefined && opts.skirtH > 0) {
    shell(j.hips, [0, -opts.skirtH * 0.34, 0.012], [0.62, opts.skirtH, 0.43], bm, 0.38);
    shell(j.hips, [0, -opts.skirtH * 0.84, 0.014], [0.642, 0.044, 0.452], tm, 0.38);
  }
  if (opts.collar) ring(j.chest, [0, 0.19, 0.01], 0.215, 0.048, 0.06, tm);
  if (opts.lapels) {
    for (const s of [-1, 1]) {
      const lap = box(j.chest, [s * 0.135, 0.1, zOff + depth * 0.5 + 0.018], [0.115, 0.21, 0.026], tm);
      lap.rotation.z = -s * 0.22;
    }
  }
  if (opts.baldric) {
    hose(j.chest, [[-0.21, 0.18, 0.2], [0, 0.01, zOff + depth * 0.5 + 0.032], [0.22, -0.17, 0.2]], 0.03, beltMat, p);
  }
  if (opts.cape) {
    shell(j.chest, [0, -0.22, -0.285], [0.56, 0.62, 0.07], bm, 0.36);
  }
  if (opts.buttons && detail) {
    for (const s of [-1, 1]) {
      for (const y of [-0.09, 0, 0.09]) {
        tube(j.chest, [s * 0.09, y, zOff + depth * 0.5 + 0.015], 0.016, 0.016, 0.018, tm, 10).rotation.x = HPI;
      }
    }
  }
}

/** Add armored forearm bracers or cuffs wrapping cleanly outside Suit forearms. */
export function addBracers(
  j: CharacterJoints, mat: T.Material, trim?: T.Material, sides: readonly ('left' | 'right')[] = ['left', 'right'],
) {
  for (const side of sides) {
    const fore = side === 'left' ? j.leftForeArm : j.rightForeArm;
    tube(fore, [0, -0.155, 0.006], 0.118, 0.112, 0.18, mat, 12);
    if (trim) {
      tube(fore, [0, -0.075, 0.006], 0.123, 0.123, 0.026, trim, 12);
      tube(fore, [0, -0.235, 0.006], 0.118, 0.118, 0.026, trim, 12);
    }
  }
}

/** Add a brimmed adventure hat securely mounted on j.head. */
export function addWideHat(head: T.Bone, name: string, p: Finish, detail: boolean, opts: {
  brimR: number; crownR: number; crownH: number; hatMat: T.Material; bandMat: T.Material;
  tiltZ?: number; plumeMat?: T.Material;
}) {
  const hat = group(head, name, [0, 0.24, 0]);
  if (opts.tiltZ !== undefined) hat.rotation.z = opts.tiltZ;
  lathe(hat, [0, 0, 0], [
    [opts.crownR * 0.85, -0.012], [opts.brimR, -0.032], [opts.brimR + 0.012, 0.004],
    [opts.crownR * 1.04, 0.028], [opts.crownR * 0.85, -0.012],
  ], opts.hatMat, p, 16);
  tube(hat, [0, opts.crownH * 0.5 + 0.01, 0], opts.crownR * 0.88, opts.crownR, opts.crownH, opts.hatMat, 16);
  sphere(hat, [0, opts.crownH + 0.01, 0], [opts.crownR * 0.88, 0.048, opts.crownR * 0.88], opts.hatMat, p);
  tube(hat, [0, 0.055, 0], opts.crownR * 1.03, opts.crownR * 1.03, 0.05, opts.bandMat, 16);
  box(hat, [0, 0.06, opts.crownR * 1.06], [0.085, 0.062, 0.026], p.accent);
  if (opts.plumeMat) {
    const count = detail ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const puff = sphere(hat, [
        0.19 + t * 0.12, 0.12 + Math.sin(t * 2.1) * 0.14, 0.06 - t * 0.32,
      ], [0.055, 0.088 - t * 0.018, 0.085], opts.plumeMat, p);
      puff.rotation.set(-0.35 * t, 0, -0.28);
    }
  }
  return hat;
}

/** Add a toothed clockwork gear wheel on any parent. */
export function addGear(
  parent: T.Object3D, at: Point, r: number, teeth: number, thickness: number,
  mat: T.Material, hubMat: T.Material, rot: Point = [0, 0, 0],
) {
  const g = group(parent, '', at);
  g.rotation.set(...rot);
  tube(g, [0, 0, 0], r, r, thickness, mat, 14);
  tube(g, [0, 0, 0], r * 0.34, r * 0.34, thickness * 1.45, hubMat, 10);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = box(g, [Math.cos(a) * (r + 0.018), 0, Math.sin(a) * (r + 0.018)], [0.04, thickness * 0.9, 0.028], mat);
    tooth.rotation.y = -a;
  }
  return g;
}

/** Add a clean detachable backpack frame bridged to j.chest with shoulder straps. */
export function addBackPack(chest: T.Bone, name: string, p: Finish, opts: {
  y?: number; z?: number; strapMat?: T.Material; strapX?: number; strapY?: number;
} = {}) {
  const pack = group(chest, name, [0, opts.y ?? 0.01, opts.z ?? -0.43]);
  addStraps(pack, p, opts.strapX ?? 0.165, opts.strapY ?? 0.18, opts.strapMat ?? p.dark);
  return pack;
}

/** Add a hand-held blade weapon cleanly gripped in j.rightHand with safe world Y clearance. */
export function addHandSword(hand: T.Bone, name: string, p: Finish, detail: boolean, opts: {
  bladeLen: number; bladeW: number; bladeT: number; guardW: number;
  bladeMat: T.Material; guardMat: T.Material; gripMat: T.Material;
  tiltX?: number; sweptBasket?: boolean; iceRidge?: boolean;
}) {
  const wep = group(hand, name, [0, -0.05, 0.04]);
  wep.rotation.x = opts.tiltX ?? 0.85;
  tube(wep, [0, -0.02, 0], 0.024, 0.026, 0.24, opts.gripMat, 12);
  sphere(wep, [0, -0.145, 0], [0.036, 0.036, 0.036], opts.guardMat, p);
  if (opts.sweptBasket) {
    cone(wep, [0, 0.125, 0], 0.088, 0.075, opts.guardMat, p, 14).rotation.x = Math.PI;
    box(wep, [0, 0.11, 0], [opts.guardW, 0.024, 0.024], opts.guardMat);
    torus(wep, [0, 0.0, 0.055], 0.095, 0.014, opts.guardMat, p, Math.PI).rotation.set(0, HPI, -HPI);
    if (detail) torus(wep, [0, 0.02, 0.04], 0.072, 0.011, opts.guardMat, p).rotation.x = HPI;
  } else {
    box(wep, [0, 0.11, 0], [opts.guardW, 0.034, 0.052], opts.guardMat);
    if (opts.iceRidge) {
      for (const s of [-1, 1]) {
        cone(wep, [s * (opts.guardW * 0.52), 0.135, 0], 0.026, 0.09, p.optic, p, 10).rotation.z = -s * 0.7;
      }
    }
  }
  const midY = 0.12 + opts.bladeLen * 0.5;
  box(wep, [0, midY, 0], [opts.bladeW, opts.bladeLen, opts.bladeT], opts.bladeMat);
  const tip = cone(wep, [0, 0.12 + opts.bladeLen + 0.075, 0], opts.bladeW * 0.52, 0.16, opts.bladeMat, p, 10);
  tip.scale.set(1, 1, Math.max(0.28, opts.bladeT / opts.bladeW));
  if (detail && opts.iceRidge) {
    box(wep, [0, midY, 0], [opts.bladeW * 0.36, opts.bladeLen * 0.85, opts.bladeT + 0.018], p.optic);
  }
  return wep;
}

/** Add a hinged helmet blast visor mounted cleanly on j.head. */
export function addHingedVisor(head: T.Bone, name: string, p: Finish, opts: {
  y?: number; z?: number; width?: number; height?: number; depth?: number;
  frameMat: T.Material; glassMat: T.Material; browMat?: T.Material;
}) {
  const visor = group(head, name, [0, opts.y ?? 0.12, opts.z ?? 0.05]);
  const w = opts.width ?? 0.44;
  const h = opts.height ?? 0.17;
  const d = opts.depth ?? 0.12;
  shell(visor, [0, -0.015, 0.215], [w, h, d], opts.frameMat, 0.48);
  shell(visor, [0, -0.015, 0.245], [w * 0.88, h * 0.68, d * 0.78], opts.glassMat, 0.52);
  if (opts.browMat) box(visor, [0, h * 0.42, 0.265], [w * 0.84, 0.028, 0.032], opts.browMat);
  for (const s of [-1, 1]) {
    tube(visor, [s * (w * 0.54), 0, -0.01], 0.034, 0.034, 0.036, opts.frameMat, 10).rotation.z = HPI;
  }
  return visor;
}

export { box, group, ring, shell, strut, tube };
