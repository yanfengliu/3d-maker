import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { cartWheel, cyl, displayGlass, HPI, matte, orb, slideTrack, stripedAwning } from './culinary-market-kit';

export function gelatoUmbrellaCart(root: T.Group, p: Finish, detail: boolean) {
  const c = group(root, 'GelatoCart');
  shell(c, [0, 0.62, 0], [1.22, 0.6, 0.86], p.primary, 0.16);
  shell(c, [0, 0.94, 0], [1.3, 0.08, 0.94], p.alloy, 0.14);
  for (const sx of [-0.46, 0.46]) {
    strut(c, [sx, 0.34, -0.32], [sx, 0.04, -0.32], 0.032, p.dark, 10);
    tube(c, [sx, 0.04, -0.32], 0.048, 0.052, 0.08, p.tire, 10);
    strut(c, [sx, 0.92, -0.44], [sx, 1.06, -0.58], 0.022, p.alloy, 8);
  }
  strut(c, [-0.46, 1.06, -0.58], [0.46, 1.06, -0.58], 0.026, p.accent, 10);
  cartWheel(c, 'CartWheelL', [-0.68, 0.36, 0.16], 0.36, 0.075, p, detail);
  cartWheel(c, 'CartWheelR', [0.68, 0.36, 0.16], 0.36, 0.075, p, detail);
  for (const [gx, col] of [[-0.28, p.accent], [0.28, p.optic]] as const) {
    tube(c, [gx, 0.98, 0], 0.2, 0.2, 0.06, p.alloy, 14);
    orb(c, [gx, 1.0, 0], 0.16, col, p.hd, [1, 0.52, 1]);
  }
  for (const [name, sx] of [['FreezerLidL', -0.28], ['FreezerLidR', 0.28]] as const) {
    const lid = group(root, name, [sx, 1.02, -0.22]);
    tube(lid, [0, 0.03, 0.22], 0.22, 0.23, 0.06, p.alloy, 14);
    orb(lid, [0, 0.09, 0.22], 0.044, p.accent, p.hd);
  }
  tube(c, [0, 1.62, -0.28], 0.034, 0.038, 1.44, p.alloy, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rib = box(c, [Math.sin(a) * 0.44, 2.24, -0.28 + Math.cos(a) * 0.44], [0.48, 0.04, 0.72], i % 2 === 0 ? p.accent : p.stencil);
    rib.rotation.y = a;
    rib.rotation.x = 0.28;
  }
  orb(c, [0, 2.4, -0.28], 0.068, p.accent, p.hd);
  if (detail) {
    for (const x of [-0.36, 0, 0.36]) box(c, [x, 0.62, 0.445], [0.28, 0.34, 0.025], p.stencil);
    if (p.hd) for (const sx of [-0.52, 0.52]) fastener(c, [sx, 0.94, 0.48], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Open tubs', 3, [
      rotationTrack('FreezerLidL', 'x', [0, 0.8, 2.1, 3], [0, -1.25, -1.25, 0]),
      rotationTrack('FreezerLidR', 'x', [0, 1.0, 2.2, 3], [0, -1.25, -1.25, 0]),
    ]),
    new T.AnimationClip('Roll cart', 2.8, [spinTrack('CartWheelL', 'x', 2.8, 2), spinTrack('CartWheelR', 'x', 2.8, 2)]),
  ];
}

export function ramenNoodleStall(root: T.Group, p: Finish, detail: boolean) {
  const st = group(root, 'RamenStall');
  shell(st, [0, 0.46, 0], [1.74, 0.92, 0.96], p.primary, 0.1);
  shell(st, [0, 0.95, 0.1], [1.86, 0.09, 1.18], p.dark, 0.12);
  for (const sx of [-0.82, 0.82]) for (const sz of [-0.42, 0.42]) box(st, [sx, 1.54, sz], [0.09, 1.18, 0.09], p.primary);
  for (const s of [-1, 1]) {
    const roof = box(st, [0, 2.24, s * 0.36], [2.04, 0.09, 0.84], p.dark);
    roof.rotation.x = s * 0.32;
  }
  box(st, [0, 2.38, 0], [2.08, 0.1, 0.14], p.accent);
  tube(st, [-0.42, 1.12, -0.06], 0.24, 0.22, 0.26, p.alloy, 14);
  const lid = group(root, 'BrothPotLid', [-0.42, 1.26, -0.06]);
  tube(lid, [0, 0.025, 0], 0.25, 0.26, 0.05, p.alloy, 14);
  orb(lid, [0, 0.08, 0], 0.045, p.accent, p.hd);
  for (const x of [0.16, 0.52]) tube(st, [x, 1.06, 0.24], 0.13, 0.08, 0.11, p.stencil, 12);
  const noren = group(root, 'NorenCurtain', [0, 2.02, 0.44]);
  cyl(noren, [0, 0, 0], 0.022, 0.022, 1.68, p.dark, 'x', 10);
  for (let i = 0; i < 4; i++) box(noren, [-0.57 + i * 0.38, -0.22, 0], [0.33, 0.42, 0.025], p.accent);
  for (const sx of [-0.46, 0.46]) {
    tube(st, [sx, 0.26, 0.82], 0.16, 0.17, 0.52, p.primary, 12);
    tube(st, [sx, 0.54, 0.82], 0.19, 0.19, 0.05, p.dark, 12);
  }
  if (detail) {
    for (const sx of [-0.94, 0.94]) {
      strut(st, [sx, 2.02, 0.42], [sx, 1.76, 0.42], 0.014, p.dark, 8);
      orb(st, [sx, 1.66, 0.42], 0.13, p.accent, p.hd, [0.85, 1.25, 0.85]);
    }
    if (p.hd) for (const sx of [-0.82, 0.82]) fastener(st, [sx, 0.95, 0.68], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Breeze & simmer', 2.8, [
      rotationTrack('NorenCurtain', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.24, 0.04, -0.18, 0]),
      slideTrack('BrothPotLid', [-0.42, 1.26, -0.06], 1, [0, 0.8, 1.9, 2.8], [0, 0.22, 0.22, 0]),
    ]),
  ];
}

export function sushiConveyorCounter(root: T.Group, p: Finish, detail: boolean) {
  const sc = group(root, 'SushiCounter');
  shell(sc, [0, 0.44, 0], [1.92, 0.88, 1.14], p.primary, 0.14);
  for (let i = 0; i < 9; i++) box(sc, [-0.8 + i * 0.2, 0.44, 0.585], [0.065, 0.76, 0.028], p.dark);
  shell(sc, [0, 0.92, 0], [2.04, 0.09, 1.26], p.dark, 0.16);
  displayGlass(sc, [0, 1.14, 0.52], [1.74, 0.34, 0.022]);
  for (const sx of [-0.82, 0.82]) strut(sc, [sx, 0.96, 0.52], [sx, 1.32, 0.52], 0.02, p.alloy, 8);
  const track = group(root, 'KaitenTrack', [0, 0.98, 0]);
  ring(track, [0, 0.02, 0], 0.46, 0.12, 0.055, p.dark);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    tube(track, [Math.sin(a) * 0.4, 0.065, Math.cos(a) * 0.4], 0.09, 0.075, 0.03, i % 2 === 0 ? p.accent : p.optic, 12);
    shell(track, [Math.sin(a) * 0.4, 0.095, Math.cos(a) * 0.4], [0.09, 0.045, 0.06], p.stencil, 0.3);
  }
  const plates = group(root, 'NigiriPlates', [0, 0.98, 0]);
  for (const sx of [-0.74, 0.74]) {
    box(plates, [sx, 0.02, 0], [0.28, 0.036, 0.46], p.primary);
    for (const sz of [-0.12, 0.12]) {
      shell(plates, [sx, 0.065, sz], [0.14, 0.055, 0.09], p.stencil, 0.3);
      shell(plates, [sx, 0.095, sz], [0.15, 0.026, 0.095], p.accent, 0.3);
    }
  }
  if (detail) {
    tube(sc, [0, 1.06, 0], 0.16, 0.18, 0.16, p.primary, 12);
    if (p.hd) for (const sx of [-0.84, 0.84]) fastener(sc, [sx, 0.92, 0.64], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Run conveyor', 3.4, [spinTrack('KaitenTrack', 'y', 3.4, 1)])];
}

export function curvedBakeryDisplay(root: T.Group, p: Finish, detail: boolean) {
  const bk = group(root, 'BakeryCase');
  shell(bk, [0, 0.48, 0], [1.66, 0.72, 0.94], p.primary, 0.12);
  shell(bk, [0, 0.07, 0], [1.68, 0.14, 0.96], p.dark, 0.1);
  for (const sx of [-0.79, 0.79]) {
    box(bk, [sx, 1.18, -0.06], [0.08, 0.74, 0.8], p.primary);
    displayGlass(bk, [sx, 1.18, 0.04], [0.022, 0.66, 0.68]);
  }
  shell(bk, [0, 1.56, -0.22], [1.7, 0.08, 0.46], p.dark, 0.14);
  for (let i = 0; i < 3; i++) {
    const g = displayGlass(bk, [0, 1.02 + i * 0.22, 0.44 - i * 0.14], [1.54, 0.24, 0.022]);
    g.rotation.x = -0.32 - i * 0.28;
  }
  for (const y of [0.88, 1.16, 1.4]) box(bk, [0, y, -0.04], [1.46, 0.032, 0.56], p.alloy);
  const trays = group(root, 'PastryTrays', [0, 0.9, -0.04]);
  for (const ry of [0, 0.28]) for (let i = 0; i < 4; i++) {
    orb(trays, [-0.48 + i * 0.32, ry + 0.06, 0.04], 0.095, ry === 0 ? p.accent : p.stencil, p.hd, [1.2, 0.65, 0.9]);
  }
  for (const [name, x0, z0] of [['RearDoorL', -0.38, -0.44], ['RearDoorR', 0.38, -0.48]] as const) {
    const dr = group(root, name, [x0, 1.18, z0]);
    for (const dx of [-0.36, 0.36]) box(dr, [dx, 0, 0], [0.055, 0.66, 0.036], p.alloy);
    displayGlass(dr, [0, 0, 0], [0.66, 0.6, 0.018]);
    box(dr, [0, 0, -0.03], [0.04, 0.18, 0.03], p.accent);
  }
  if (detail) {
    for (let i = 0; i < 6; i++) box(bk, [-0.62 + i * 0.25, 0.48, 0.485], [0.08, 0.56, 0.026], p.dark);
    if (p.hd) for (const sx of [-0.72, 0.72]) fastener(bk, [sx, 1.56, 0.02], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Slide clerk doors', 3.2, [
    slideTrack('RearDoorL', [-0.38, 1.18, -0.44], 0, [0, 0.9, 2.2, 3.2], [0, 0.42, 0.42, 0]),
    slideTrack('RearDoorR', [0.38, 1.18, -0.48], 0, [0, 0.9, 2.2, 3.2], [0, -0.42, -0.42, 0]),
  ])];
}

export function oakWineBarrelRack(root: T.Group, p: Finish, detail: boolean) {
  const wr = group(root, 'BarrelRack');
  for (const sx of [-0.46, 0.46]) {
    box(wr, [sx, 0.06, 0], [0.14, 0.12, 0.98], p.dark);
    for (const sz of [-0.36, 0.36]) box(wr, [sx, 0.76, sz], [0.12, 1.44, 0.12], p.dark);
    for (const y of [0.36, 1.12]) box(wr, [sx, y, 0], [0.12, 0.12, 0.88], p.dark);
  }
  for (const y of [0.36, 1.12]) {
    for (const sz of [-0.26, 0.26]) box(wr, [0, y, sz], [0.92, 0.09, 0.09], p.dark);
  }
  for (const y of [0.68, 1.44]) {
    cyl(wr, [0, y, 0], 0.34, 0.34, 0.92, p.primary, 'z', 18);
    for (const sz of [-0.34, -0.14, 0.14, 0.34]) ring(wr, [0, y, sz], 0.355, 0.024, 0.045, p.edge).rotation.x = HPI;
  }
  box(wr, [0.74, 0.82, 0], [0.42, 0.07, 0.64], p.dark);
  strut(wr, [0.5, 0.56, 0], [0.84, 0.8, 0], 0.032, p.dark, 8);
  const spigot = group(root, 'BrassSpigot', [0, 1.32, 0.5]);
  cyl(spigot, [0, 0, 0.04], 0.034, 0.034, 0.14, p.accent, 'z', 10);
  tube(spigot, [0, -0.05, 0.1], 0.024, 0.02, 0.1, p.accent, 10);
  box(spigot, [0, 0.05, 0.07], [0.12, 0.03, 0.028], p.accent);
  const glasses = group(root, 'TastingGlasses', [0.74, 0.86, 0]);
  tube(glasses, [-0.08, 0.14, -0.12], 0.05, 0.055, 0.28, p.optic, 12);
  for (const gz of [0.06, 0.2]) {
    tube(glasses, [0.08, 0.06, gz], 0.012, 0.04, 0.12, p.stencil, 10);
    tube(glasses, [0.08, 0.14, gz], 0.05, 0.034, 0.09, p.stencil, 10);
  }
  if (detail) {
    tube(wr, [0, 0.12, 0.58], 0.14, 0.11, 0.24, p.dark, 12);
    if (p.hd) for (const sx of [-0.46, 0.46]) fastener(wr, [sx, 1.12, 0.44], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Pour wine', 2.6, [rotationTrack('BrassSpigot', 'z', [0, 0.7, 1.8, 2.6], [0, 1.35, 1.35, 0])])];
}

export function woodenCheesePress(root: T.Group, p: Finish, detail: boolean) {
  const cp = group(root, 'CheesePress');
  const cheese = matte('#e8c254', 0.85, 'Aged cheese');
  shell(cp, [0, 0.08, 0], [1.46, 0.16, 0.82], p.dark, 0.12);
  for (const sx of [-0.48, 0.34]) box(cp, [sx, 0.84, 0], [0.12, 1.48, 0.16], p.primary);
  shell(cp, [-0.07, 1.54, 0], [1.06, 0.14, 0.22], p.primary, 0.12);
  shell(cp, [-0.07, 0.46, 0], [0.84, 0.08, 0.62], p.primary, 0.12);
  tube(cp, [-0.07, 0.72, 0], 0.26, 0.26, 0.44, p.primary, 16);
  for (const y of [0.58, 0.84]) ring(cp, [-0.07, y, 0], 0.275, 0.022, 0.045, p.edge);
  tube(cp, [-0.07, 0.98, 0], 0.22, 0.22, 0.14, cheese, 16);
  const screw = group(root, 'PressScrew', [-0.07, 1.54, 0]);
  tube(screw, [0, -0.06, 0], 0.05, 0.05, 0.72, p.accent, 12);
  cyl(screw, [0, 0.28, 0], 0.024, 0.024, 0.46, p.accent, 'x', 10);
  const beam = group(root, 'WeightBeam', [-0.48, 1.24, 0.14]);
  box(beam, [0.58, 0, 0], [1.34, 0.09, 0.09], p.primary);
  strut(beam, [1.14, -0.04, 0], [1.14, -0.44, 0], 0.02, p.alloy, 8);
  tube(beam, [1.14, -0.52, 0], 0.14, 0.16, 0.22, p.dark, 14);
  if (detail) {
    tube(cp, [0.52, 0.22, 0.16], 0.14, 0.11, 0.22, p.alloy, 12);
    if (p.hd) for (const sx of [-0.48, 0.34]) fastener(cp, [sx, 1.54, 0.12], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Press curd', 3, [
    spinTrack('PressScrew', 'y', 3, 2),
    rotationTrack('WeightBeam', 'z', [0, 0.9, 2.1, 3], [0, -0.24, -0.24, 0]),
  ])];
}

export function drumCoffeeRoaster(root: T.Group, p: Finish, detail: boolean) {
  const cr = group(root, 'CoffeeRoaster');
  const beans = matte('#4f2e1c', 0.86, 'Roasted beans');
  shell(cr, [0, 0.1, 0], [1.12, 0.2, 1.48], p.dark, 0.14);
  shell(cr, [0, 0.56, -0.18], [0.92, 0.76, 0.94], p.primary, 0.14);
  const drum = group(root, 'RoastDrum', [0, 1.18, -0.18]);
  cyl(drum, [0, 0, 0], 0.34, 0.34, 0.84, p.primary, 'z', 18);
  for (const z of [-0.32, 0, 0.32]) ring(drum, [0, 0, z], 0.355, 0.025, 0.05, p.accent).rotation.x = HPI;
  box(drum, [0, 0.36, 0], [0.05, 0.03, 0.72], p.accent);
  tube(cr, [0, 1.72, -0.06], 0.28, 0.09, 0.38, p.accent, 16);
  tube(cr, [-0.48, 1.38, -0.58], 0.16, 0.14, 1.38, p.dark, 14);
  cyl(cr, [-0.24, 1.76, -0.44], 0.08, 0.08, 0.48, p.alloy, 'x', 12);
  tube(cr, [0, 0.64, 0.52], 0.42, 0.42, 0.22, p.alloy, 18);
  tube(cr, [0, 0.72, 0.52], 0.38, 0.38, 0.08, beans, 16);
  const agit = group(root, 'CoolingAgitator', [0, 0.78, 0.52]);
  tube(agit, [0, 0.02, 0], 0.06, 0.06, 0.1, p.accent, 10);
  for (let i = 0; i < 4; i++) box(agit, [0, 0.04, 0], [0.68, 0.04, 0.032], p.accent).rotation.y = (i * Math.PI) / 4;
  if (detail) {
    cyl(cr, [0, 1.18, 0.25], 0.12, 0.12, 0.05, p.stencil, 'z', 14);
    if (p.hd) for (const sx of [-0.38, 0.38]) fastener(cr, [sx, 0.88, 0.28], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Roast batch', 2.4, [
    spinTrack('RoastDrum', 'z', 2.4, 2),
    spinTrack('CoolingAgitator', 'y', 2.4, 2),
  ])];
}

export function brassHotdogCart(root: T.Group, p: Finish, detail: boolean) {
  const hd = group(root, 'HotdogCart');
  shell(hd, [0, 0.62, 0], [1.34, 0.58, 0.82], p.primary, 0.14);
  shell(hd, [0, 0.94, 0], [1.4, 0.08, 0.88], p.accent, 0.14);
  for (const sx of [-0.52, 0.52]) {
    strut(hd, [sx, 0.34, -0.3], [sx, 0.04, -0.3], 0.032, p.dark, 10);
    tube(hd, [sx, 0.04, -0.3], 0.05, 0.05, 0.08, p.tire, 10);
    for (const sz of [-0.38, 0.38]) strut(hd, [sx * 1.18, 0.96, sz], [sx * 1.18, 1.84, sz], 0.022, p.accent, 8);
  }
  cartWheel(hd, 'WheelLeft', [-0.74, 0.34, 0.16], 0.34, 0.075, p, detail);
  cartWheel(hd, 'WheelRight', [0.74, 0.34, 0.16], 0.34, 0.075, p, detail);
  stripedAwning(hd, 1.9, 1.56, 1.06, 0.16, p);
  box(hd, [-0.14, 1.02, 0], [0.78, 0.1, 0.54], p.inset);
  for (const x of [0.42, 0.56]) {
    tube(hd, [x, 1.08, 0.14], 0.045, 0.048, 0.18, x < 0.5 ? p.accent : p.primary, 10);
    tube(hd, [x, 1.2, 0.14], 0.012, 0.036, 0.08, p.stencil, 10);
  }
  const lid = group(root, 'SteamerLid', [-0.14, 1.08, -0.28]);
  shell(lid, [0, 0.06, 0.28], [0.8, 0.12, 0.58], p.accent, 0.22);
  box(lid, [0, 0.15, 0.28], [0.32, 0.035, 0.04], p.dark);
  if (detail) {
    box(hd, [0, 0.62, 0.425], [0.96, 0.26, 0.026], p.stencil);
    if (p.hd) for (const sx of [-0.6, 0.6]) fastener(hd, [sx, 1.84, 0.38], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Open steamer', 2.8, [rotationTrack('SteamerLid', 'x', [0, 0.8, 2, 2.8], [0, -1.25, -1.25, 0])]),
    new T.AnimationClip('Roll cart', 2.8, [spinTrack('WheelLeft', 'x', 2.8, 2), spinTrack('WheelRight', 'x', 2.8, 2)]),
  ];
}

export function tieredSpiceStall(root: T.Group, p: Finish, detail: boolean) {
  const sp = group(root, 'SpiceStall');
  for (const sx of [-0.76, 0.76]) for (const sz of [-0.42, 0.42]) box(sp, [sx, 0.96, sz], [0.09, 1.92, 0.09], p.primary);
  shell(sp, [0, 0.36, 0], [1.62, 0.72, 0.92], p.primary, 0.12);
  for (const sx of [-0.74, 0.74]) box(sp, [sx, 0.96, 0], [0.06, 0.56, 0.84], p.primary);
  for (let t = 0; t < 3; t++) {
    box(sp, [0, 0.78 + t * 0.18, 0.22 - t * 0.26], [1.5, 0.1, 0.32], p.dark);
  }
  const awning = group(root, 'CanopyAwning', [0, 1.94, -0.42]);
  box(awning, [0, 0, 0.56], [1.74, 0.06, 1.24], p.primary);
  for (let i = 0; i < 6; i++) box(awning, [-0.7 + i * 0.28, 0.042, 0.56], [0.16, 0.025, 1.18], i % 2 === 0 ? p.accent : p.stencil);
  const cones = group(root, 'SpiceCones', [0, 0.84, 0]);
  const sCols = [matte('#d9462b', 0.88), matte('#e6ae2e', 0.88), matte('#8a2c3c', 0.88), matte('#5c7e38', 0.88)] as const;
  for (let t = 0; t < 3; t++) {
    for (let i = 0; i < 4; i++) {
      const cx = -0.52 + i * 0.35;
      const cz = 0.22 - t * 0.26;
      const cy = t * 0.18;
      tube(cones, [cx, cy + 0.06, cz], 0.13, 0.1, 0.1, p.primary, 12);
      tube(cones, [cx, cy + 0.16, cz], 0.014, 0.11, 0.18, sCols[(i + t) % 4] ?? p.accent, 12);
    }
  }
  if (detail) {
    for (const sx of [-0.56, 0, 0.56]) box(sp, [sx, 0.36, 0.48], [0.36, 0.44, 0.03], p.accent);
    if (p.hd) for (const sx of [-0.76, 0.76]) fastener(sp, [sx, 1.9, 0.46], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Adjust awning', 3, [rotationTrack('CanopyAwning', 'x', [0, 0.9, 2.1, 3], [0, 0.38, 0.38, 0])])];
}

export function mapleButcherBlock(root: T.Group, p: Finish, detail: boolean) {
  const bb = group(root, 'ButcherBlock');
  for (const sx of [-0.48, 0.48]) for (const sz of [-0.34, 0.34]) tube(bb, [sx, 0.38, sz], 0.056, 0.048, 0.76, p.dark, 12);
  box(bb, [0, 0.24, 0], [0.96, 0.06, 0.68], p.primary);
  shell(bb, [0, 0.88, 0], [1.18, 0.26, 0.86], p.primary, 0.12);
  for (let i = 0; i < 5; i++) box(bb, [-0.42 + i * 0.21, 1.02, 0], [0.09, 0.018, 0.76], i % 2 === 0 ? p.dark : p.accent);
  cyl(bb, [-0.66, 0.84, 0], 0.02, 0.02, 0.62, p.alloy, 'z', 10);
  for (const sz of [-0.26, 0.26]) strut(bb, [-0.58, 0.84, sz], [-0.66, 0.84, sz], 0.018, p.alloy, 8);
  const drawer = group(root, 'CleaverDrawer', [0, 0.66, 0.12]);
  shell(drawer, [0, 0, 0.28], [0.76, 0.16, 0.055], p.primary, 0.14);
  box(drawer, [0, -0.05, 0], [0.7, 0.036, 0.52], p.dark);
  box(drawer, [0, 0, 0.32], [0.24, 0.035, 0.035], p.accent);
  const rack = group(root, 'KnifeRack', [0.62, 0.88, 0]);
  box(rack, [0, 0, 0], [0.06, 0.14, 0.66], p.dark);
  for (const sz of [-0.2, 0, 0.2]) {
    box(rack, [0.045, 0.08, sz], [0.025, 0.12, 0.045], p.accent);
    box(rack, [0.045, -0.09, sz], [0.018, 0.22, 0.08], p.alloy);
  }
  if (detail) {
    tube(bb, [0.28, 1.1, -0.18], 0.075, 0.085, 0.14, p.stencil, 12);
    if (p.hd) for (const sx of [-0.48, 0.48]) fastener(bb, [sx, 0.88, 0.44], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Open cleaver drawer', 2.8, [slideTrack('CleaverDrawer', [0, 0.66, 0.12], 2, [0, 0.8, 2, 2.8], [0, 0.32, 0.32, 0])])];
}
