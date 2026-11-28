import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { barHandle, burnerGrate, cyl, glassPane, HPI, matte, orb, slideTrack, torus } from './kitchen-appliances-kit';

export function retroRefrigerator(root: T.Group, p: Finish, detail: boolean) {
  const f = group(root, 'FridgeCabinet');
  for (const sx of [-0.36, 0.36]) for (const sz of [-0.3, 0.3]) tube(f, [sx, 0.04, sz], 0.055, 0.06, 0.08, p.dark, 10);
  shell(f, [0, 1.04, -0.04], [0.96, 1.92, 0.78], p.primary, 0.24);
  box(f, [0, 1.04, 0.335], [0.84, 1.76, 0.065], p.inset);
  for (const y of [0.56, 0.96, 1.36, 1.66]) box(f, [0, y, 0.32], [0.8, 0.032, 0.14], p.stencil);
  for (const x of [-0.22, 0, 0.22]) tube(f, [x, 1.08, 0.32], 0.048, 0.052, 0.18, p.optic, 10);
  const frz = group(root, 'FreezerDoor', [-0.46, 1.74, 0.39]);
  shell(frz, [0.46, 0, 0.05], [0.94, 0.52, 0.12], p.primary, 0.26);
  barHandle(frz, [0.82, -0.06, 0.11], 0.24, false, p.alloy);
  box(frz, [0.46, 0.1, 0.12], [0.32, 0.055, 0.024], p.accent);
  const door = group(root, 'FridgeDoor', [-0.46, 0.78, 0.39]);
  shell(door, [0.46, 0, 0.05], [0.94, 1.32, 0.12], p.primary, 0.24);
  barHandle(door, [0.82, 0.34, 0.11], 0.34, false, p.alloy);
  box(door, [0.46, 0.46, 0.12], [0.42, 0.048, 0.022], p.accent);
  if (detail) {
    for (const y of [0.36, 0.44, 0.52]) box(f, [0, y, -0.44], [0.74, 0.03, 0.02], p.dark);
    for (const y of [0.24, 1.32, 1.88]) box(f, [-0.47, y, 0.37], [0.045, 0.065, 0.06], p.alloy);
    if (p.hd) for (const sx of [-0.38, 0.38]) fastener(f, [sx, 1.98, 0.36], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Open doors', 3.2, [
    rotationTrack('FridgeDoor', 'y', [0, 0.9, 2.2, 3.2], [0, -1.35, -1.35, 0]),
    rotationTrack('FreezerDoor', 'y', [0, 1.1, 2.3, 3.2], [0, -1.15, -1.15, 0]),
  ])];
}

export function castIronGasRange(root: T.Group, p: Finish, detail: boolean) {
  const r = group(root, 'GasRange');
  for (const sx of [-0.54, 0.54]) for (const sz of [-0.34, 0.34]) tube(r, [sx, 0.06, sz], 0.048, 0.054, 0.12, p.alloy, 10);
  shell(r, [0, 0.52, -0.02], [1.26, 0.82, 0.82], p.primary, 0.1);
  box(r, [0, 0.48, 0.34], [0.96, 0.54, 0.14], p.inset);
  box(r, [0, 0.44, 0.34], [0.9, 0.028, 0.16], p.alloy);
  shell(r, [0, 0.96, 0], [1.3, 0.08, 0.88], p.alloy, 0.12);
  box(r, [0, 1.24, -0.38], [1.28, 0.52, 0.1], p.primary);
  shell(r, [0, 1.5, -0.275], [1.3, 0.07, 0.34], p.alloy, 0.14);
  for (const bx of [-0.4, 0, 0.4]) for (const bz of [-0.16, 0.18]) burnerGrate(r, [bx, 1.015, bz], 0.14, p);
  const dial = group(root, 'BurnerDial', [-0.42, 0.86, 0.44]);
  cyl(dial, [0, 0, 0], 0.042, 0.046, 0.045, p.accent, 'z', 12);
  box(dial, [0, 0.018, 0.032], [0.016, 0.036, 0.018], p.stencil);
  for (const x of [-0.22, 0, 0.22, 0.42]) cyl(r, [x, 0.86, 0.44], 0.038, 0.042, 0.04, p.dark, 'z', 12);
  const door = group(root, 'OvenDoor', [0, 0.2, 0.42]);
  shell(door, [0, 0.28, 0.03], [1.04, 0.56, 0.07], p.primary, 0.12);
  box(door, [0, 0.28, 0.07], [0.76, 0.34, 0.02], p.dark);
  glassPane(door, [0, 0.28, 0.082], [0.68, 0.28, 0.016]);
  barHandle(door, [0, 0.5, 0.07], 0.84, true, p.accent);
  if (detail) {
    cyl(r, [0, 1.26, -0.32], 0.09, 0.09, 0.035, p.stencil, 'z', 14);
    if (p.hd) for (const sx of [-0.54, 0.54]) fastener(r, [sx, 1.44, -0.32], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Open oven', 3, [rotationTrack('OvenDoor', 'x', [0, 0.9, 2.1, 3], [0, 1.35, 1.35, 0])]),
    new T.AnimationClip('Turn burner', 2.4, [rotationTrack('BurnerDial', 'z', [0, 0.7, 1.7, 2.4], [0, 2.2, 2.2, 0])]),
  ];
}

export function commercialEspressoMachine(root: T.Group, p: Finish, detail: boolean) {
  const m = group(root, 'EspressoMachine');
  const wood = matte('#6c4428', 0.84, 'Counter plinth');
  shell(m, [0, 0.08, 0], [1.34, 0.16, 0.9], wood, 0.14);
  shell(m, [0, 0.22, 0.04], [1.14, 0.14, 0.76], p.alloy, 0.16);
  box(m, [0, 0.28, 0.28], [0.96, 0.04, 0.22], p.inset);
  shell(m, [0, 0.64, -0.1], [1.12, 0.72, 0.48], p.primary, 0.18);
  shell(m, [0, 0.86, 0.12], [1.08, 0.26, 0.42], p.alloy, 0.2);
  for (const sx of [-0.28, 0.28]) {
    tube(m, [sx, 0.68, 0.24], 0.082, 0.088, 0.14, p.alloy, 12);
    tube(m, [sx, 0.36, 0.24], 0.056, 0.044, 0.11, p.stencil, 12);
  }
  for (const [name, sx] of [['GroupLeverL', -0.28], ['GroupLeverR', 0.28]] as const) {
    const lv = group(root, name, [sx, 0.72, 0.34]);
    strut(lv, [0, 0, 0], [0, 0.28, 0.18], 0.022, p.accent, 10);
    orb(lv, [0, 0.3, 0.2], 0.048, p.dark, p.hd);
  }
  const wand = group(root, 'SteamWand', [0.48, 0.76, 0.24]);
  strut(wand, [0, 0, 0], [0.08, -0.26, 0.1], 0.014, p.alloy, 8);
  orb(wand, [0, 0, 0], 0.036, p.accent, p.hd);
  for (const x of [-0.36, -0.12, 0.12, 0.36]) tube(m, [x, 1.07, -0.06], 0.068, 0.054, 0.13, p.stencil, 12);
  for (const sx of [-0.5, 0.5]) strut(m, [sx, 1.02, -0.28], [sx, 1.14, -0.28], 0.016, p.accent, 8);
  strut(m, [-0.5, 1.14, -0.28], [0.5, 1.14, -0.28], 0.016, p.accent, 8);
  if (detail) {
    cyl(m, [0, 0.86, 0.35], 0.068, 0.068, 0.03, p.stencil, 'z', 14);
    ring(m, [0, 0.86, 0.365], 0.074, 0.014, 0.024, p.accent).rotation.x = HPI;
    if (p.hd) for (const sx of [-0.46, 0.46]) fastener(m, [sx, 0.88, 0.34], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Pull shot', 2.8, [
      rotationTrack('GroupLeverL', 'x', [0, 0.7, 1.8, 2.8], [0, 0.85, 0.85, 0]),
      rotationTrack('GroupLeverR', 'x', [0, 1.0, 2.0, 2.8], [0, 0.85, 0.85, 0]),
    ]),
    new T.AnimationClip('Swing wand', 2.4, [rotationTrack('SteamWand', 'y', [0, 0.7, 1.7, 2.4], [0, 0.65, 0.65, 0])]),
  ];
}

export function planetaryStandMixer(root: T.Group, p: Finish, detail: boolean) {
  const mx = group(root, 'MixerBase');
  shell(mx, [0, 0.09, 0], [0.84, 0.18, 1.12], p.primary, 0.32);
  shell(mx, [0, 0.44, -0.34], [0.42, 0.64, 0.38], p.primary, 0.28);
  tube(mx, [0, 0.2, 0.14], 0.24, 0.26, 0.06, p.alloy, 14);
  tube(mx, [0, 0.42, 0.14], 0.3, 0.21, 0.42, p.alloy, 16);
  ring(mx, [0, 0.62, 0.14], 0.31, 0.026, 0.04, p.accent);
  torus(mx, [0.32, 0.44, 0.14], 0.09, 0.022, p.alloy, p.hd).rotation.y = HPI;
  const head = group(root, 'MixerHead', [0, 0.74, -0.34]);
  cyl(head, [0, 0.12, 0.3], 0.19, 0.19, 0.88, p.primary, 'z', 16);
  orb(head, [0, 0.12, 0.72], 0.19, p.primary, p.hd, [1, 1, 0.75]);
  orb(head, [0, 0.12, -0.14], 0.19, p.primary, p.hd, [1, 1, 0.7]);
  cyl(head, [0, 0.12, 0.86], 0.068, 0.072, 0.06, p.accent, 'z', 12);
  box(head, [0, 0.14, 0.3], [0.41, 0.06, 0.64], p.accent);
  const whisk = group(head, 'WireWhisk', [0, -0.06, 0.48]);
  tube(whisk, [0, -0.06, 0], 0.036, 0.032, 0.14, p.alloy, 10);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    const loop = torus(whisk, [0, -0.22, 0], 0.12, 0.014, p.alloy, p.hd);
    loop.rotation.y = a;
    loop.scale.set(0.76, 1.35, 1);
  }
  if (detail) {
    cyl(head, [0.22, 0.14, 0.12], 0.026, 0.026, 0.08, p.dark, 'x', 10);
    orb(head, [0.27, 0.14, 0.12], 0.038, p.accent, p.hd);
    if (p.hd) for (const s of [-1, 1]) fastener(mx, [s * 0.22, 0.74, -0.34], p, 0.028).rotation.z = HPI;
  }
  root.animations = [
    new T.AnimationClip('Whip mix', 2.2, [spinTrack('WireWhisk', 'y', 2.2, 3)]),
    new T.AnimationClip('Tilt head', 3, [rotationTrack('MixerHead', 'x', [0, 0.9, 2.1, 3], [0, -0.78, -0.78, 0])]),
  ];
}

export function undercounterDishwasher(root: T.Group, p: Finish, detail: boolean) {
  const dw = group(root, 'DishwasherBody');
  const wood = matte('#a87a4e', 0.84, 'Butcher block');
  box(dw, [0, 0.07, -0.02], [0.84, 0.14, 0.72], p.dark);
  shell(dw, [0, 0.56, -0.04], [0.88, 0.86, 0.76], p.primary, 0.1);
  box(dw, [0, 0.56, 0.3], [0.76, 0.74, 0.1], p.inset);
  shell(dw, [0, 1.03, 0], [0.94, 0.09, 0.84], wood, 0.14);
  const door = group(root, 'WasherDoor', [0, 0.16, 0.36]);
  shell(door, [0, 0.4, 0.03], [0.86, 0.8, 0.07], p.primary, 0.12);
  box(door, [0, 0.73, 0.072], [0.8, 0.1, 0.025], p.dark);
  barHandle(door, [0, 0.62, 0.07], 0.62, true, p.accent);
  const rack = group(root, 'DishRack', [0, 0.44, 0.1]);
  box(rack, [0, 0, 0], [0.68, 0.04, 0.44], p.alloy);
  for (let i = 0; i < 5; i++) cyl(rack, [-0.24 + i * 0.12, 0.14, 0], 0.11, 0.11, 0.024, p.stencil, 'x', 14);
  if (detail) {
    for (const x of [-0.26, -0.14, 0.14, 0.26]) box(door, [x, 0.73, 0.092], [0.06, 0.042, 0.016], p.optic);
    if (p.hd) for (const sx of [-0.36, 0.36]) fastener(dw, [sx, 0.98, 0.38], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Load rack', 3.4, [
    rotationTrack('WasherDoor', 'x', [0, 0.8, 2.4, 3.4], [0, 1.45, 1.45, 0]),
    slideTrack('DishRack', [0, 0.44, 0.1], 2, [0, 1.2, 2.2, 3.4], [0, 0.42, 0.42, 0]),
  ])];
}

export function countertopMicrowave(root: T.Group, p: Finish, detail: boolean) {
  const mw = group(root, 'MicrowaveStation');
  const tile = matte('#ded7c6', 0.86, 'Counter tile');
  shell(mw, [0, 0.14, 0], [1.18, 0.28, 0.82], tile, 0.12);
  box(mw, [0, 0.56, -0.36], [1.14, 0.62, 0.08], tile);
  shell(mw, [0, 0.62, -0.02], [1.04, 0.64, 0.66], p.primary, 0.18);
  box(mw, [-0.14, 0.62, 0.278], [0.64, 0.48, 0.1], p.inset);
  box(mw, [0.36, 0.62, 0.32], [0.24, 0.54, 0.035], p.dark);
  box(mw, [0.36, 0.78, 0.345], [0.16, 0.09, 0.018], p.optic);
  const turn = group(root, 'GlassTurntable', [-0.14, 0.42, 0.18]);
  tube(turn, [0, 0, 0], 0.22, 0.22, 0.028, p.optic, 16);
  tube(turn, [0, 0.075, 0], 0.11, 0.08, 0.11, p.accent, 14);
  const door = group(root, 'MicrowaveDoor', [-0.48, 0.62, 0.335]);
  shell(door, [0.35, 0, 0.03], [0.7, 0.56, 0.06], p.primary, 0.16);
  box(door, [0.35, 0, 0.065], [0.52, 0.38, 0.022], p.dark);
  glassPane(door, [0.35, 0, 0.078], [0.46, 0.32, 0.016]);
  barHandle(door, [0.64, 0, 0.06], 0.32, false, p.accent);
  if (detail) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box(mw, [0.3 + c * 0.06, 0.48 + r * 0.07, 0.345], [0.038, 0.04, 0.018], p.accent);
    if (p.hd) for (const sx of [-0.46, 0.46]) fastener(mw, [sx, 0.9, 0.32], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Cook spin', 2.8, [spinTrack('GlassTurntable', 'y', 2.8, 2)]),
    new T.AnimationClip('Open microwave', 3, [rotationTrack('MicrowaveDoor', 'y', [0, 0.9, 2.1, 3], [0, -1.35, -1.35, 0])]),
  ];
}

export function domedPizzaOven(root: T.Group, p: Finish, detail: boolean) {
  const ov = group(root, 'PizzaOven');
  const stone = matte('#9c9488', 0.88, 'Stone hearth');
  const log = matte('#633e25', 0.86, 'Split oak');
  shell(ov, [0, 0.08, 0], [1.48, 0.16, 1.38], stone, 0.16);
  for (const sx of [-0.56, 0.56]) shell(ov, [sx, 0.48, 0], [0.32, 0.7, 1.24], stone, 0.14);
  box(ov, [0, 0.48, -0.48], [1.24, 0.7, 0.26], stone);
  for (let i = 0; i < 4; i++) cyl(ov, [-0.22 + i * 0.15, 0.24, 0.06], 0.065, 0.072, 0.74, log, 'z', 10);
  shell(ov, [0, 0.9, 0], [1.56, 0.16, 1.46], p.dark, 0.18);
  orb(ov, [0, 0.98, -0.08], 0.68, p.primary, p.hd, [1, 0.92, 1]);
  shell(ov, [0, 1.26, 0.44], [0.64, 0.54, 0.38], p.primary, 0.26);
  box(ov, [0, 1.18, 0.58], [0.42, 0.34, 0.14], p.inset);
  tube(ov, [0, 1.88, 0.44], 0.12, 0.15, 0.74, p.dark, 12);
  tube(ov, [0, 2.3, 0.44], 0.04, 0.22, 0.14, p.accent, 12);
  const door = group(root, 'OvenIronDoor', [-0.22, 1.18, 0.66]);
  shell(door, [0.22, 0, 0.02], [0.46, 0.36, 0.05], p.dark, 0.28);
  barHandle(door, [0.36, 0, 0.05], 0.18, false, p.accent);
  const peel = group(root, 'PizzaPeel', [0, 1.04, 0.42]);
  shell(peel, [0, 0, 0.1], [0.34, 0.03, 0.36], p.accent, 0.32);
  cyl(peel, [0, 0, 0.56], 0.022, 0.022, 0.74, log, 'z', 10);
  tube(peel, [0, 0.032, 0.1], 0.14, 0.14, 0.03, p.stencil, 14);
  if (detail) {
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      box(ov, [Math.sin(a) * 0.26, 1.24 + Math.cos(a) * 0.22, 0.64], [0.1, 0.06, 0.03], p.accent).rotation.z = -a;
    }
    if (p.hd) for (const sx of [-0.56, 0.56]) fastener(ov, [sx, 0.9, 0.74], p, 0.026).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Open oven door', 3, [rotationTrack('OvenIronDoor', 'y', [0, 0.9, 2.1, 3], [0, -1.45, -1.45, 0])]),
    new T.AnimationClip('Slide pizza', 2.8, [slideTrack('PizzaPeel', [0, 1.04, 0.42], 2, [0, 0.8, 2, 2.8], [0, 0.36, 0.36, 0])]),
  ];
}

export function highSpeedBlender(root: T.Group, p: Finish, detail: boolean) {
  const bl = group(root, 'BlenderUnit');
  shell(bl, [0, 0.08, 0], [0.78, 0.16, 0.78], p.dark, 0.22);
  shell(bl, [0, 0.3, 0], [0.56, 0.32, 0.56], p.primary, 0.28);
  box(bl, [0, 0.28, 0.29], [0.36, 0.18, 0.04], p.dark);
  cyl(bl, [-0.08, 0.28, 0.32], 0.056, 0.06, 0.04, p.accent, 'z', 12);
  box(bl, [0.1, 0.28, 0.32], [0.04, 0.09, 0.04], p.alloy);
  tube(bl, [0, 0.49, 0], 0.18, 0.21, 0.08, p.tire, 14);
  const glassMat = new T.MeshStandardMaterial({
    name: 'Pitcher glass', color: '#c4e6ec', metalness: 0.1, roughness: 0.09,
    transparent: true, opacity: 0.32, depthWrite: false, side: T.FrontSide,
  });
  tube(bl, [0, 0.84, 0], 0.26, 0.17, 0.64, glassMat, 16);
  torus(bl, [0.28, 0.84, 0], 0.16, 0.032, p.primary, p.hd).scale.set(0.7, 1.3, 1);
  const rotor = group(root, 'BladeRotor', [0, 0.56, 0]);
  tube(rotor, [0, 0.02, 0], 0.05, 0.06, 0.08, p.alloy, 10);
  for (let i = 0; i < 4; i++) {
    const blade = box(rotor, [0, 0.04, 0], [0.28, 0.018, 0.042], p.alloy);
    blade.rotation.y = (i * Math.PI) / 4;
    blade.rotation.x = 0.25;
  }
  const lid = group(root, 'PitcherLid', [-0.24, 1.16, 0]);
  tube(lid, [0.24, 0.035, 0], 0.27, 0.28, 0.075, p.dark, 16);
  tube(lid, [0.24, 0.095, 0], 0.08, 0.09, 0.06, p.accent, 12);
  if (detail) {
    for (let i = 0; i < 5; i++) box(bl, [-0.14, 0.62 + i * 0.11, 0.21 + i * 0.015], [0.06, 0.016, 0.014], p.accent);
    if (p.hd) for (const sx of [-0.26, 0.26]) fastener(bl, [sx, 0.16, 0.3], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Blend vortex', 1.8, [spinTrack('BladeRotor', 'y', 1.8, 4)]),
    new T.AnimationClip('Open lid', 2.8, [rotationTrack('PitcherLid', 'z', [0, 0.8, 2, 2.8], [0, 1.3, 1.3, 0])]),
  ];
}

export function convectionToasterOven(root: T.Group, p: Finish, detail: boolean) {
  const to = group(root, 'ToasterOven');
  const wood = matte('#9c6e44', 0.84, 'Bake stand');
  shell(to, [0, 0.14, 0], [1.14, 0.28, 0.78], wood, 0.14);
  shell(to, [0, 0.56, -0.02], [1.02, 0.56, 0.66], p.primary, 0.16);
  box(to, [-0.12, 0.54, 0.27], [0.68, 0.42, 0.12], p.inset);
  box(to, [-0.12, 0.48, 0.25], [0.62, 0.025, 0.18], p.alloy);
  for (const x of [-0.24, 0]) shell(to, [x, 0.54, 0.25], [0.18, 0.1, 0.18], p.accent, 0.3);
  box(to, [0.35, 0.56, 0.32], [0.22, 0.48, 0.036], p.alloy);
  const dial = group(root, 'TempDial', [0.35, 0.66, 0.355]);
  cyl(dial, [0, 0, 0], 0.055, 0.06, 0.04, p.accent, 'z', 14);
  box(dial, [0, 0.022, 0.028], [0.018, 0.044, 0.016], p.dark);
  cyl(to, [0.35, 0.46, 0.355], 0.048, 0.052, 0.038, p.dark, 'z', 14);
  const door = group(root, 'GlassOvenDoor', [-0.12, 0.34, 0.345]);
  for (const sx of [-0.32, 0.32]) box(door, [sx, 0.21, 0.02], [0.065, 0.44, 0.045], p.alloy);
  for (const y of [0.02, 0.4]) box(door, [0, y, 0.02], [0.7, 0.065, 0.045], p.alloy);
  glassPane(door, [0, 0.21, 0.02], [0.58, 0.32, 0.018]);
  barHandle(door, [0, 0.4, 0.045], 0.56, true, p.accent);
  if (detail) {
    for (const x of [-0.32, -0.16, 0, 0.16]) box(to, [x, 0.85, 0], [0.08, 0.018, 0.42], p.dark);
    if (p.hd) for (const sx of [-0.46, 0.46]) fastener(to, [sx, 0.8, 0.32], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Open toaster', 3, [rotationTrack('GlassOvenDoor', 'x', [0, 0.9, 2.1, 3], [0, 1.38, 1.38, 0])]),
    new T.AnimationClip('Set temp', 2.4, [rotationTrack('TempDial', 'z', [0, 0.8, 1.7, 2.4], [0, -2.4, -2.4, 0])]),
  ];
}

export function commercialIceDispenser(root: T.Group, p: Finish, detail: boolean) {
  const ice = group(root, 'IceDispenser');
  for (const sx of [-0.36, 0.36]) for (const sz of [-0.3, 0.3]) tube(ice, [sx, 0.05, sz], 0.046, 0.052, 0.1, p.dark, 10);
  shell(ice, [0, 0.56, 0], [0.96, 0.94, 0.8], p.primary, 0.1);
  shell(ice, [0, 1.34, -0.14], [0.94, 0.66, 0.52], p.primary, 0.1);
  box(ice, [0, 1.04, 0.22], [0.88, 0.08, 0.32], p.alloy);
  box(ice, [0, 1.09, 0.24], [0.72, 0.024, 0.22], p.inset);
  shell(ice, [0, 1.88, 0], [0.98, 0.44, 0.82], p.alloy, 0.14);
  for (let i = 0; i < 4; i++) box(ice, [0, 1.78 + i * 0.075, 0.425], [0.76, 0.026, 0.02], p.dark);
  tube(ice, [0, 1.56, 0.24], 0.075, 0.065, 0.18, p.dark, 12);
  const lever = group(root, 'IceChuteLever', [0, 1.48, 0.18]);
  shell(lever, [0, -0.16, 0], [0.22, 0.28, 0.045], p.accent, 0.18);
  const hatch = group(root, 'BinHatch', [0, 0.96, 0.42]);
  shell(hatch, [0, -0.26, 0.02], [0.78, 0.52, 0.055], p.alloy, 0.14);
  barHandle(hatch, [0, -0.44, 0.05], 0.52, true, p.accent);
  if (detail) {
    box(ice, [-0.28, 1.44, 0.135], [0.14, 0.08, 0.022], p.optic);
    tube(ice, [0, 1.2, 0.24], 0.072, 0.056, 0.18, p.stencil, 12);
    if (p.hd) for (const sx of [-0.42, 0.42]) fastener(ice, [sx, 1.98, 0.42], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Dispense ice', 2.4, [rotationTrack('IceChuteLever', 'x', [0, 0.6, 1.7, 2.4], [0, -0.45, -0.45, 0])]),
    new T.AnimationClip('Open service bin', 3, [rotationTrack('BinHatch', 'x', [0, 0.9, 2.1, 3], [0, -1.15, -1.15, 0])]),
  ];
}
