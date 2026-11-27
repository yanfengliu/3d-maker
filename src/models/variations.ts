import * as T from 'three';
import type {
  ClearanceZoneSpec,
  ColliderSpec,
  DecalSlotSpec,
  DetachablePartSpec,
  NightZoneSpec,
  RiggedPartSpec,
  SurfaceSpec,
  VariationSummary,
} from '../capabilities/schema';
import { box, group, ring, rotationTrack, shell, strut, tube, type Finish } from './parts';

export type { VariationSummary };

export interface VariationRecipeOverrides {
  name?: string;
  primary?: string;
  accent?: string;
  scale?: number;
  proportion?: number;
  detail?: boolean;
  quality?: 'standard' | 'hd';
}

export interface VariationInitialState {
  pose?: Record<string, number>;
  hiddenParts?: readonly string[];
  night?: boolean;
  decalText?: Record<string, string>;
}

export interface ModelVariationDef extends VariationSummary {
  /** Base template ID in the catalog (for example 'bakery-shopfront'). */
  template: string;
  /** Optional recipe overrides merged onto the base catalog entry. */
  recipe?: VariationRecipeOverrides;
  /** Optional initial interactive state applied when opening this variation in the studio. */
  state?: VariationInitialState;
  /** Optional geometry modifier layered on top of the base model (or replacement if replaceBase is true). */
  modify?: (root: T.Group, p: Finish, detail: boolean) => void;
  /** When true, modify() builds the entire geometry instead of calling the base template builder first. */
  replaceBase?: boolean;
  riggedParts?: readonly RiggedPartSpec[];
  detachableParts?: readonly DetachablePartSpec[];
  nightZones?: readonly NightZoneSpec[];
  decals?: readonly DecalSlotSpec[];
  colliders?: readonly ColliderSpec[];
  clearanceZones?: readonly ClearanceZoneSpec[];
  surfaces?: readonly SurfaceSpec[];
}

function snowMaterial() {
  return new T.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.86, metalness: 0.02 });
}

function lanternGlowMaterial() {
  return new T.MeshStandardMaterial({
    color: 0xffe4a8,
    emissive: 0xffa63b,
    emissiveIntensity: 0.72,
    roughness: 0.28,
    metalness: 0.04,
  });
}

function addSnowCap(
  parent: T.Object3D,
  center: [number, number, number],
  w: number,
  h: number,
  d: number,
  mat: T.Material,
  hd: boolean,
  detail: boolean,
) {
  const [cx, cy, cz] = center;
  const run = w * 0.54;
  const slopeLen = Math.hypot(run, h) + 0.06;
  const angle = Math.atan2(h, run);
  const nx = Math.sin(angle);
  const ny = Math.cos(angle);
  const offset = 0.068;
  for (const s of [-1, 1]) {
    const x = cx + s * (run * 0.5 + nx * offset);
    const y = cy + h * 0.5 + 0.02 + ny * offset;
    const slab = hd
      ? shell(parent, [x, y, cz], [slopeLen, 0.068, d + 0.02], mat, 0.35)
      : box(parent, [x, y, cz], [slopeLen, 0.064, d + 0.02], mat);
    slab.rotation.z = -s * angle;
    if (detail) {
      for (let i = -2; i <= 2; i++) {
        const z = cz + i * (d * 0.19);
        tube(parent, [cx + s * (run + 0.03), cy - 0.03, z], 0.008, 0.024, 0.11, mat, hd ? 10 : 6);
      }
    }
  }
  if (hd) shell(parent, [cx, cy + h + 0.09, cz], [0.18, 0.075, d + 0.04], mat, 0.45);
  else box(parent, [cx, cy + h + 0.09, cz], [0.16, 0.07, d + 0.04], mat);
}

function addBakeryWinterSnow(root: T.Group, p: Finish, detail: boolean) {
  const snow = snowMaterial();
  const drifts = group(root, 'RoofSnow');
  addSnowCap(drifts, [0, 1.95, -0.04], 2.26, 0.58, 1.64, snow, p.hd, detail);
  // Chimney rim and awning ridge drifts.
  if (p.hd) {
    shell(drifts, [0.72, 2.64, -0.34], [0.32, 0.07, 0.32], snow, 0.42);
    shell(drifts, [-0.36, 1.07, 0.89], [1.12, 0.055, 0.42], snow, 0.38).rotation.x = 0.38;
  } else {
    box(drifts, [0.72, 2.64, -0.34], [0.3, 0.06, 0.3], snow);
    box(drifts, [-0.36, 1.07, 0.89], [1.1, 0.05, 0.4], snow).rotation.x = 0.38;
  }
  if (detail) {
    box(drifts, [-0.36, 0.3, 0.74], [1.06, 0.04, 0.08], snow);
    for (const x of [-0.52, 0.44]) box(drifts, [x, 1.35, 0.72], [0.42, 0.036, 0.07], snow);
  }
}

function addBakeryPatioLantern(root: T.Group, p: Finish, detail: boolean) {
  const glow = lanternGlowMaterial();
  const mount = group(root, 'LanternMount', [0.92, 1.08, 0.7]);
  box(mount, [0, 0, 0], [0.06, 0.16, 0.04], p.dark);
  strut(mount, [0, 0.04, 0.02], [0, 0.04, 0.24], 0.014, p.dark, p.hd ? 10 : 6);
  if (detail) strut(mount, [0, -0.05, 0.02], [0, 0.04, 0.18], 0.011, p.dark, p.hd ? 10 : 6);
  const lantern = group(mount, 'PatioLantern', [0, 0.03, 0.22]);
  strut(lantern, [0, 0, 0], [0, -0.07, 0], 0.009, p.alloy, 6);
  tube(lantern, [0, -0.1, 0], 0.02, 0.078, 0.06, p.dark, p.hd ? 14 : 6);
  tube(lantern, [0, -0.18, 0], 0.058, 0.052, 0.12, glow, p.hd ? 14 : 6);
  tube(lantern, [0, -0.255, 0], 0.064, 0.03, 0.035, p.dark, p.hd ? 14 : 6);
  if (detail) {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      box(lantern, [Math.cos(a) * 0.06, -0.18, Math.sin(a) * 0.06], [0.012, 0.12, 0.012], p.dark);
    }
    if (p.hd) ring(lantern, [0, -0.065, 0], 0.022, 0.006, 0.01, p.alloy);
  }
  const peak = (20 * Math.PI) / 180;
  root.animations.push(
    new T.AnimationClip('Lantern sway', 3.4, [
      rotationTrack('PatioLantern', 'z', [0, 0.85, 2.55, 3.4], [0, peak, -peak, 0]),
    ]),
  );
}

function addCabinSnowbound(root: T.Group, p: Finish, detail: boolean) {
  const snow = snowMaterial();
  const drifts = group(root, 'CabinSnow');
  addSnowCap(drifts, [-0.18, 1.32, 0.02], 2.16, 0.94, 1.96, snow, p.hd, detail);
  const stack = root.getObjectByName('FirewoodStack');
  if (p.hd) {
    shell(drifts, [-1.04, 2.41, -0.26], [0.46, 0.08, 0.54], snow, 0.42);
    if (stack) shell(stack, [0.06, 0.81, 0], [0.49, 0.065, 0.89], snow, 0.35).rotation.z = -0.34;
    else shell(drifts, [0.94, 1.03, -0.08], [0.49, 0.065, 0.89], snow, 0.35).rotation.z = -0.34;
  } else {
    box(drifts, [-1.04, 2.41, -0.26], [0.44, 0.07, 0.52], snow);
    if (stack) box(stack, [0.06, 0.81, 0], [0.48, 0.06, 0.88], snow).rotation.z = -0.34;
    else box(drifts, [0.94, 1.03, -0.08], [0.48, 0.06, 0.88], snow).rotation.z = -0.34;
  }
  if (detail) {
    box(drifts, [-0.44, 0.17, 1.06], [0.62, 0.036, 0.14], snow);
    box(drifts, [0.24, 0.61, 0.6], [0.4, 0.032, 0.06], snow);
  }
}

function addDroneCargoWinch(root: T.Group, p: Finish, detail: boolean) {
  const airframe = root.getObjectByName('Airframe') ?? root;
  const winch = group(airframe, 'CargoWinch', [0, 0.67, -0.08]);
  if (p.hd) shell(winch, [0, 0, 0], [0.46, 0.14, 0.44], p.dark, 0.35);
  else box(winch, [0, 0, 0], [0.44, 0.13, 0.42], p.dark);
  tube(winch, [0, -0.02, 0], 0.085, 0.085, 0.3, p.accent, p.hd ? 18 : 8).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) {
    box(winch, [s * 0.19, -0.02, 0], [0.045, 0.18, 0.24], p.edge);
  }
  const hook = group(winch, 'CargoHook', [0, -0.09, 0]);
  strut(hook, [0, 0, 0], [0, -0.24, 0], 0.015, p.alloy, p.hd ? 12 : 6);
  if (p.hd) shell(hook, [0, -0.25, 0], [0.16, 0.08, 0.1], p.primary, 0.35);
  else box(hook, [0, -0.25, 0], [0.15, 0.075, 0.095], p.primary);
  ring(hook, [0, -0.34, 0], 0.068, 0.019, 0.03, p.alloy).rotation.x = Math.PI / 2;
  if (detail) {
    for (const s of [-1, 1]) {
      strut(winch, [s * 0.2, 0.05, 0.14], [s * 0.32, 0.16, 0.24], 0.018, p.edge, p.hd ? 10 : 6);
      strut(winch, [s * 0.2, 0.05, -0.14], [s * 0.32, 0.16, -0.24], 0.018, p.edge, p.hd ? 10 : 6);
    }
    box(hook, [0, -0.25, 0.055], [0.1, 0.036, 0.02], p.accent);
  }
  const peak = (24 * Math.PI) / 180;
  root.animations.push(
    new T.AnimationClip('Winch sway', 3.2, [
      rotationTrack('CargoHook', 'z', [0, 0.8, 2.4, 3.2], [0, peak, -peak, 0]),
    ]),
  );
}

/**
 * Append-only catalog of named model variations.
 *
 * Never delete, rename, or silently overwrite an existing variation here:
 * every registered (template, id) pair is protected by src/models/variations.lock.json
 * and enforced by src/models/variations-guard.test.ts. Add a new variation ID instead.
 */
export const modelVariations: readonly ModelVariationDef[] = [
  {
    template: 'bakery-shopfront',
    id: 'winter-frost',
    label: 'Winter Frost',
    situation: 'Cold-weather snowy street scene with snow drifts on roof, chimney, and awning.',
    recipe: { name: 'Bakery Shopfront (Winter)', primary: '#d8cfc4', accent: '#3d6b7d' },
    modify: addBakeryWinterSnow,
    detachableParts: [
      { name: 'RoofSnow', label: 'Snow drifts', describe: 'Accumulated winter snow along the roof, ridge, and chimney' },
    ],
  },
  {
    template: 'bakery-shopfront',
    id: 'evening-bistro',
    label: 'Evening Bistro',
    situation: 'Dusk and night street dining scene with slate facade, brass awning, and hanging corner lantern.',
    recipe: { name: 'Bakery Shopfront (Evening)', primary: '#475569', accent: '#d97706' },
    modify: addBakeryPatioLantern,
    riggedParts: [
      { name: 'PatioLantern', label: 'Patio lantern', type: 'rotate', axis: 'z', range: [-24, 24], describe: 'Swings the hanging corner bistro lantern in the breeze' },
    ],
    detachableParts: [
      { name: 'LanternMount', label: 'Bistro lantern', describe: 'Removable wrought-iron corner lantern bracket and glowing lamp' },
    ],
  },
  {
    template: 'nordic-timber-cabin',
    id: 'snowbound',
    label: 'Snowbound',
    situation: 'Deep-winter mountain clearing with weathered spruce logs and snow-blanketed pitched roof.',
    recipe: { name: 'Nordic Timber Cabin (Snowbound)', primary: '#7c6552', accent: '#4a7c8c' },
    modify: addCabinSnowbound,
    detachableParts: [
      { name: 'CabinSnow', label: 'Snow blanket', describe: 'Winter snow layer on the cabin roof, chimney, and woodpile' },
    ],
  },
  {
    template: 'relay-drone',
    id: 'cargo-lifter',
    label: 'Cargo Lifter',
    situation: 'Industrial supply drop configuration with high-visibility livery and under-slung cargo winch hook.',
    recipe: { name: 'Relay Drone (Cargo Lifter)', primary: '#e06d2b', accent: '#2c353d' },
    modify: addDroneCargoWinch,
    riggedParts: [
      { name: 'CargoHook', label: 'Cargo hook', type: 'rotate', axis: 'z', range: [-35, 35], describe: 'Swings the under-slung heavy supply hook' },
    ],
    detachableParts: [
      { name: 'CargoWinch', label: 'Cargo winch', describe: 'Removable belly-mounted cargo winch drum and hook rig' },
    ],
  },
  {
    template: 'medieval-knight',
    id: 'obsidian-paladin',
    label: 'Obsidian Paladin',
    situation: 'Dark fantasy night-watch or boss encounter variant with gunmetal plate and crimson trim.',
    recipe: { name: 'Medieval Knight (Obsidian)', primary: '#383d47', accent: '#c0392b' },
  },
];

export const DEFAULT_VARIATION_ID = 'default';

export function variationKey(template: string, variation?: string): string {
  return `${template}@${variation && variation !== DEFAULT_VARIATION_ID ? variation : DEFAULT_VARIATION_ID}`;
}

export function variationsForTemplate(template: string): readonly ModelVariationDef[] {
  return modelVariations.filter(entry => entry.template === template);
}

export function findVariation(template: string, variation?: string): ModelVariationDef | undefined {
  if (!variation || variation === DEFAULT_VARIATION_ID) return undefined;
  return modelVariations.find(entry => entry.template === template && entry.id === variation);
}
