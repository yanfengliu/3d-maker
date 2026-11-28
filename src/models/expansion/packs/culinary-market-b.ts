import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { cartWheel, cyl, displayGlass, HPI, matte, orb, slideTrack, stripedAwning, torus } from './culinary-market-kit';

export function teaCeremonyTable(root: T.Group, p: Finish, detail: boolean) {
  const tt = group(root, 'TeaTable');
  const tatami = matte('#b8ae7e', 0.88, 'Tatami mat');
  shell(tt, [0, 0.04, 0], [1.62, 0.08, 1.18], tatami, 0.1);
  for (const sx of [-0.56, 0.56]) for (const sz of [-0.36, 0.36]) shell(tt, [sx, 0.26, sz], [0.12, 0.4, 0.12], p.primary, 0.24);
  shell(tt, [0, 0.48, 0], [1.34, 0.1, 0.92], p.primary, 0.14);
  box(tt, [-0.12, 0.54, 0], [0.46, 0.05, 0.46], p.inset);
  orb(tt, [-0.12, 0.66, 0], 0.16, p.dark, p.hd, [1, 0.78, 1]);
  torus(tt, [-0.12, 0.78, 0], 0.13, 0.016, p.dark, p.hd);
  box(tt, [-0.12, 0.76, -0.095], [0.045, 0.04, 0.035], p.dark);
  const lid = group(root, 'KettleLid', [-0.12, 0.77, -0.09]);
  box(lid, [0, 0.01, 0.01], [0.04, 0.03, 0.04], p.dark);
  tube(lid, [0, 0.02, 0.09], 0.085, 0.095, 0.04, p.dark, 12);
  orb(lid, [0, 0.06, 0.09], 0.032, p.accent, p.hd);
  for (const [cx, cz] of [[0.34, -0.18], [0.34, 0.18], [0.48, 0]] as const) {
    tube(tt, [cx, 0.59, cz], 0.068, 0.048, 0.1, p.accent, 12);
  }
  const drawer = group(root, 'TeaDrawer', [0.34, 0.42, 0.18]);
  shell(drawer, [0, 0, 0.26], [0.42, 0.1, 0.05], p.primary, 0.16);
  box(drawer, [0, -0.02, 0], [0.38, 0.03, 0.46], p.dark);
  orb(drawer, [0, 0, 0.3], 0.026, p.accent, p.hd);
  if (detail) {
    for (const sx of [-0.66, 0.66]) shell(tt, [sx, 0.1, 0.44], [0.24, 0.07, 0.24], p.accent, 0.32);
    if (p.hd) for (const sx of [-0.56, 0.56]) fastener(tt, [sx, 0.48, 0.46], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Serve tea', 3, [
      rotationTrack('KettleLid', 'x', [0, 0.8, 2, 3], [0, -1.1, -1.1, 0]),
      slideTrack('TeaDrawer', [0.34, 0.42, 0.18], 2, [0, 0.9, 2.1, 3], [0, 0.26, 0.26, 0]),
    ]),
  ];
}

export function vintagePopcornWagon(root: T.Group, p: Finish, detail: boolean) {
  const pw = group(root, 'PopcornWagon');
  const corn = matte('#f0d878', 0.88, 'Popcorn');
  shell(pw, [0, 0.56, 0], [1.28, 0.48, 0.84], p.primary, 0.14);
  for (const sx of [-0.48, 0.48]) {
    strut(pw, [sx, 0.34, -0.3], [sx, 0.04, -0.3], 0.03, p.dark, 8);
    tube(pw, [sx, 0.04, -0.3], 0.05, 0.05, 0.08, p.tire, 10);
  }
  cartWheel(pw, 'WagonWheelL', [-0.7, 0.36, 0.12], 0.36, 0.075, p, detail);
  cartWheel(pw, 'WagonWheelR', [0.7, 0.36, 0.12], 0.36, 0.075, p, detail);
  for (const sx of [-0.56, 0.56]) for (const sz of [-0.34, 0.34]) box(pw, [sx, 1.32, sz], [0.065, 1.08, 0.065], p.accent);
  for (const sz of [-0.34, 0.34]) displayGlass(pw, [0, 1.32, sz], [1.06, 0.96, 0.02]);
  for (const sx of [-0.56, 0.56]) displayGlass(pw, [sx, 1.32, 0], [0.02, 0.96, 0.62]);
  for (const [cx, cz, r] of [[-0.24, 0.04, 0.16], [0, -0.04, 0.18], [0.24, 0.06, 0.15]] as const) orb(pw, [cx, 0.88, cz], r, corn, p.hd, [1.2, 0.65, 1.1]);
  shell(pw, [0, 1.9, 0], [1.4, 0.18, 0.96], p.primary, 0.18);
  shell(pw, [0, 2.04, 0], [1.14, 0.12, 0.74], p.accent, 0.24);
  for (const sx of [-0.22, 0.22]) strut(pw, [sx, 1.84, 0], [sx, 1.56, 0], 0.018, p.alloy, 8);
  const kettle = group(root, 'PopcornKettle', [0, 1.56, 0]);
  for (const sx of [-0.2, 0.2]) box(kettle, [sx, 0, 0], [0.06, 0.05, 0.05], p.dark);
  tube(kettle, [0, -0.06, 0], 0.18, 0.15, 0.2, p.alloy, 14);
  tube(kettle, [0, 0.05, 0], 0.19, 0.19, 0.04, p.accent, 14);
  if (detail) {
    box(pw, [0, 0.56, 0.435], [0.92, 0.26, 0.028], p.stencil);
    if (p.hd) for (const sx of [-0.56, 0.56]) fastener(pw, [sx, 1.9, 0.49], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Dump popcorn', 2.8, [rotationTrack('PopcornKettle', 'x', [0, 0.8, 1.9, 2.8], [0, 1.15, 1.15, 0])]),
    new T.AnimationClip('Roll wagon', 2.8, [spinTrack('WagonWheelL', 'x', 2.8, 2), spinTrack('WagonWheelR', 'x', 2.8, 2)]),
  ];
}

export function chromeSodaFountain(root: T.Group, p: Finish, detail: boolean) {
  const sf = group(root, 'SodaFountain');
  shell(sf, [0, 0.44, 0], [1.74, 0.88, 0.88], p.primary, 0.14);
  for (const y of [0.22, 0.44, 0.66]) box(sf, [0, y, 0.455], [1.62, 0.045, 0.024], p.alloy);
  shell(sf, [0, 0.92, 0.04], [1.84, 0.09, 0.98], p.stencil, 0.16);
  shell(sf, [-0.28, 1.18, -0.14], [0.68, 0.46, 0.34], p.alloy, 0.2);
  for (const [name, sx] of [['DraftHandleL', -0.44], ['DraftHandleR', -0.12]] as const) {
    const lv = group(root, name, [sx, 1.32, 0.06]);
    strut(lv, [0, 0, 0], [0, 0.22, 0.08], 0.018, p.alloy, 8);
    orb(lv, [0, 0.25, 0.09], 0.046, p.accent, p.hd);
  }
  tube(sf, [0.46, 1.24, -0.12], 0.075, 0.09, 0.56, p.primary, 14);
  shell(sf, [0.46, 1.5, -0.02], [0.22, 0.14, 0.3], p.alloy, 0.22);
  tube(sf, [0.46, 1.08, 0.06], 0.095, 0.072, 0.24, p.alloy, 14);
  const mixer = group(root, 'MaltMixer', [0.46, 1.34, 0.06]);
  tube(mixer, [0, -0.08, 0], 0.014, 0.014, 0.24, p.alloy, 8);
  tube(mixer, [0, -0.18, 0], 0.056, 0.056, 0.022, p.accent, 12);
  if (detail) {
    for (const sx of [-0.44, -0.12]) tube(sf, [sx, 1.04, 0.12], 0.068, 0.054, 0.16, p.optic, 12);
    if (p.hd) for (const sx of [-0.68, 0.68]) fastener(sf, [sx, 0.92, 0.54], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Pull soda', 2.4, [
      rotationTrack('DraftHandleL', 'x', [0, 0.6, 1.6, 2.4], [0, 0.82, 0.82, 0]),
      rotationTrack('DraftHandleR', 'x', [0, 0.9, 1.8, 2.4], [0, 0.82, 0.82, 0]),
    ]),
    new T.AnimationClip('Blend malt', 1.8, [spinTrack('MaltMixer', 'y', 1.8, 4)]),
  ];
}

export function tacoGriddleCart(root: T.Group, p: Finish, detail: boolean) {
  const tc = group(root, 'TacoCart');
  const meat = matte('#b84928', 0.84, 'Al pastor');
  for (const sx of [-0.56, 0.56]) for (const sz of [-0.34, 0.34]) tube(tc, [sx, 0.08, sz], 0.08, 0.08, 0.07, p.tire, 12);
  shell(tc, [0, 0.54, 0], [1.38, 0.78, 0.84], p.primary, 0.12);
  shell(tc, [0, 0.96, 0], [1.44, 0.08, 0.9], p.alloy, 0.12);
  box(tc, [-0.14, 1.02, 0.04], [0.64, 0.055, 0.62], p.dark);
  for (const [tx, tz] of [[-0.34, 0.08], [-0.14, -0.06], [0.04, 0.06]] as const) tube(tc, [tx, 1.06, tz], 0.09, 0.09, 0.02, p.accent, 12);
  box(tc, [0.42, 1.38, -0.26], [0.34, 0.78, 0.12], p.alloy);
  const spit = group(root, 'TrompoSpit', [0.42, 1.02, 0.04]);
  tube(spit, [0, 0.36, 0], 0.022, 0.022, 0.72, p.alloy, 10);
  tube(spit, [0, 0.34, 0], 0.2, 0.09, 0.44, meat, 14);
  orb(spit, [0, 0.62, 0], 0.11, p.accent, p.hd, [1, 1.1, 1]);
  const shelf = group(root, 'ServingShelf', [-0.72, 0.94, 0]);
  shell(shelf, [-0.24, 0, 0], [0.48, 0.065, 0.76], p.accent, 0.12);
  for (const sx of [-0.62, 0.62]) strut(tc, [sx, 0.98, -0.38], [sx, 1.94, -0.38], 0.024, p.dark, 8);
  stripedAwning(tc, 1.96, 1.56, 0.98, 0.22, p);
  if (detail) {
    for (const sz of [-0.2, 0, 0.2]) box(tc, [-0.56, 1.04, sz], [0.14, 0.08, 0.14], p.optic);
    if (p.hd) for (const sx of [-0.58, 0.58]) fastener(tc, [sx, 0.96, 0.46], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Spin trompo', 2.8, [spinTrack('TrompoSpit', 'y', 2.8, 2)]),
    new T.AnimationClip('Fold shelf', 3, [rotationTrack('ServingShelf', 'z', [0, 0.9, 2.1, 3], [0, 1.48, 1.48, 0])]),
  ];
}

export function tieredFlowerStall(root: T.Group, p: Finish, detail: boolean) {
  const fs = group(root, 'FlowerStall');
  const leaf = matte('#447448', 0.86, 'Stem foliage');
  for (const sx of [-0.72, 0.72]) {
    box(fs, [sx, 0.06, 0], [0.1, 0.12, 0.98], p.dark);
    box(fs, [sx, 0.98, -0.4], [0.09, 1.88, 0.09], p.primary);
    strut(fs, [sx, 0.08, 0.42], [sx, 1.18, -0.38], 0.04, p.primary, 8);
  }
  for (let i = 0; i < 3; i++) box(fs, [0, 0.36 + i * 0.34, 0.28 - i * 0.28], [1.44, 0.08, 0.3], p.primary);
  const shade = group(root, 'SunShade', [0, 1.92, -0.4]);
  box(shade, [0, 0, 0.5], [1.62, 0.06, 1.08], p.primary);
  for (let i = 0; i < 6; i++) box(shade, [-0.62 + i * 0.25, 0.042, 0.5], [0.15, 0.024, 1.02], i % 2 === 0 ? p.accent : p.stencil);
  const bkts = group(root, 'BouquetBuckets', [0, 0.4, 0]);
  const blooms = [p.accent, matte('#ebbd3c', 0.85), matte('#d94c54', 0.85), matte('#8c5ec2', 0.85)] as const;
  for (let t = 0; t < 3; t++) for (let i = 0; i < 4; i++) {
    const bx = -0.5 + i * 0.33, by = t * 0.34, bz = 0.28 - t * 0.28;
    tube(bkts, [bx, by + 0.11, bz], 0.1, 0.08, 0.22, p.alloy, 10);
    orb(bkts, [bx, by + 0.24, bz], 0.11, leaf, p.hd);
    orb(bkts, [bx, by + 0.31, bz], 0.085, blooms[(i + t) % 4] ?? p.accent, p.hd);
  }
  if (detail) {
    box(fs, [0, 1.64, -0.4], [1.46, 0.06, 0.06], p.primary);
    box(fs, [0, 1.64, -0.35], [0.92, 0.26, 0.04], p.inset);
    if (p.hd) for (const sx of [-0.72, 0.72]) fastener(fs, [sx, 1.88, -0.35], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Tilt shade', 3, [rotationTrack('SunShade', 'x', [0, 0.9, 2.1, 3], [0, 0.42, 0.42, 0])])];
}

export function ciderApplePress(root: T.Group, p: Finish, detail: boolean) {
  const ap = group(root, 'CiderPress');
  for (const sx of [-0.46, 0.46]) {
    box(ap, [sx, 0.06, 0], [0.14, 0.12, 0.86], p.dark);
    box(ap, [sx, 0.92, 0], [0.12, 1.66, 0.14], p.primary);
    for (const sz of [-0.32, 0.32]) strut(ap, [sx, 0.1, sz], [sx, 0.56, 0], 0.036, p.primary, 8);
  }
  shell(ap, [0, 1.72, 0], [1.14, 0.16, 0.22], p.primary, 0.12);
  shell(ap, [0, 0.62, 0], [0.88, 0.1, 0.76], p.dark, 0.12);
  box(ap, [0, 0.6, 0.46], [0.16, 0.06, 0.24], p.alloy);
  tube(ap, [0, 0.22, 0.56], 0.14, 0.12, 0.42, p.accent, 12);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    box(ap, [Math.sin(a) * 0.26, 0.98, Math.cos(a) * 0.26], [0.06, 0.58, 0.032], p.primary).rotation.y = a;
  }
  for (const y of [0.8, 1.16]) ring(ap, [0, y, 0], 0.285, 0.024, 0.045, p.dark);
  tube(ap, [0, 1.56, 0], 0.042, 0.042, 0.78, p.alloy, 12);
  const fly = group(root, 'CrankFlywheel', [0, 1.94, 0]);
  ring(fly, [0, 0, 0], 0.34, 0.038, 0.055, p.accent);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    strut(fly, [0, 0, 0], [Math.sin(a) * 0.32, 0, Math.cos(a) * 0.32], 0.018, p.dark, 8);
  }
  tube(fly, [0.3, 0.08, 0], 0.02, 0.024, 0.12, p.primary, 8);
  const platen = group(root, 'PressPlaten', [0, 1.24, 0]);
  tube(platen, [0, 0, 0], 0.23, 0.23, 0.08, p.primary, 14);
  if (detail) {
    for (const [ax, az] of [[-0.24, 0.46], [-0.14, 0.52]] as const) orb(ap, [ax, 0.08, az], 0.068, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.46, 0.46]) fastener(ap, [sx, 1.72, 0.12], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Press cider', 3, [
    spinTrack('CrankFlywheel', 'y', 3, 2),
    slideTrack('PressPlaten', [0, 1.24, 0], 1, [0, 1.1, 2.2, 3], [0, -0.26, -0.26, 0]),
  ])];
}

export function fishmongerIceTable(root: T.Group, p: Finish, detail: boolean) {
  const fm = group(root, 'FishmongerTable');
  const ice = matte('#d8edf2', 0.75, 'Crushed ice');
  for (const sx of [-0.72, 0.72]) for (const sz of [-0.38, 0.38]) tube(fm, [sx, 0.42, sz], 0.044, 0.048, 0.84, p.primary, 10);
  box(fm, [0, 0.24, 0], [1.46, 0.05, 0.76], p.dark);
  shell(fm, [0, 0.86, 0], [1.62, 0.18, 0.94], p.primary, 0.12);
  shell(fm, [0, 0.96, 0], [1.46, 0.12, 0.78], ice, 0.22);
  for (const sx of [-0.74, 0.74]) strut(fm, [sx, 0.92, -0.38], [sx, 2.02, -0.38], 0.036, p.primary, 10);
  shell(fm, [0, 2.04, -0.38], [1.66, 0.22, 0.12], p.dark, 0.14);
  box(fm, [0, 2.04, -0.3], [1.34, 0.14, 0.025], p.stencil);
  strut(fm, [0, 1.96, -0.38], [0, 1.96, 0.08], 0.024, p.alloy, 8);
  const scale = group(root, 'HangingScale', [0, 1.94, 0.06]);
  strut(scale, [0, 0, 0], [0, -0.18, 0], 0.016, p.alloy, 8);
  cyl(scale, [0, -0.26, 0], 0.12, 0.12, 0.06, p.accent, 'z', 14);
  cyl(scale, [0, -0.26, 0.036], 0.09, 0.09, 0.016, p.stencil, 'z', 12);
  for (const s of [-0.14, 0.14]) strut(scale, [0, -0.38, 0], [s, -0.58, 0], 0.01, p.alloy, 6);
  tube(scale, [0, -0.6, 0], 0.18, 0.12, 0.07, p.alloy, 14);
  const catchGrp = group(root, 'CatchDisplay', [0, 1.02, 0]);
  for (let i = 0; i < 4; i++) orb(catchGrp, [-0.45 + i * 0.3, 0.04, 0.06], 0.12, p.alloy, p.hd, [0.55, 0.4, 1.6]);
  for (const sx of [-0.3, 0.3]) orb(catchGrp, [sx, 0.05, -0.22], 0.1, p.accent, p.hd, [1.2, 0.55, 0.9]);
  if (detail) {
    tube(fm, [0.46, 0.16, 0.44], 0.14, 0.11, 0.24, p.dark, 12);
    if (p.hd) for (const sx of [-0.74, 0.74]) fastener(fm, [sx, 2.04, -0.31], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Sway scale', 2.8, [rotationTrack('HangingScale', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.28, 0, -0.28, 0])])];
}

export function streetCrepeStand(root: T.Group, p: Finish, detail: boolean) {
  const cs = group(root, 'CrepeStand');
  const batter = matte('#e8c878', 0.85, 'Golden crepe');
  shell(cs, [0, 0.46, 0], [1.54, 0.92, 0.86], p.primary, 0.12);
  shell(cs, [0, 0.95, 0], [1.64, 0.08, 0.94], p.alloy, 0.12);
  for (const sx of [-0.36, 0.28]) {
    tube(cs, [sx, 1.01, 0.04], 0.24, 0.25, 0.06, p.dark, 16);
    tube(cs, [sx, 1.045, 0.04], 0.2, 0.2, 0.02, batter, 16);
  }
  for (const sz of [-0.2, 0.08]) tube(cs, [0.64, 1.04, sz], 0.09, 0.085, 0.12, p.accent, 12);
  const rake = group(root, 'BatterSpreader', [-0.36, 1.052, 0.04]);
  strut(rake, [0, 0.26, 0], [0.16, 0.01, 0], 0.014, p.primary, 8);
  cyl(rake, [0.16, 0.01, 0], 0.014, 0.014, 0.2, p.accent, 'z', 8);
  const drawer = group(root, 'WarmingDrawer', [0, 0.68, 0.14]);
  shell(drawer, [0, 0, 0.3], [0.84, 0.22, 0.055], p.alloy, 0.14);
  box(drawer, [0, -0.06, 0], [0.78, 0.04, 0.56], p.dark);
  box(drawer, [0, 0, 0.34], [0.36, 0.035, 0.035], p.accent);
  for (const sx of [-0.72, 0.72]) strut(cs, [sx, 0.98, -0.38], [sx, 1.94, -0.38], 0.026, p.dark, 8);
  stripedAwning(cs, 1.96, 1.66, 0.96, 0.18, p);
  if (detail) {
    for (let i = 0; i < 6; i++) box(cs, [-0.55 + i * 0.22, 0.26, 0.445], [0.16, 0.28, 0.024], i % 2 === 0 ? p.stencil : p.accent);
    if (p.hd) for (const sx of [-0.66, 0.66]) fastener(cs, [sx, 0.95, 0.48], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Spread crepe', 2.4, [spinTrack('BatterSpreader', 'y', 2.4, 2)]),
    new T.AnimationClip('Open warmer', 3, [slideTrack('WarmingDrawer', [0, 0.68, 0.14], 2, [0, 0.9, 2.1, 3], [0, 0.32, 0.32, 0])]),
  ];
}

export function oliveOilAmphoraRack(root: T.Group, p: Finish, detail: boolean) {
  const oa = group(root, 'AmphoraRack');
  shell(oa, [0, 0.08, 0], [1.46, 0.16, 0.84], p.dark, 0.16);
  for (const sx of [-0.64, 0, 0.64]) strut(oa, [sx, 0.14, 0], [sx, 0.92, 0], 0.032, p.dark, 10);
  strut(oa, [-0.64, 0.84, 0], [0.64, 0.84, 0], 0.026, p.dark, 8);
  for (const sx of [-0.34, 0.34]) ring(oa, [sx, 0.84, 0], 0.24, 0.028, 0.05, p.dark);
  orb(oa, [-0.34, 0.68, 0], 0.24, p.primary, p.hd, [0.95, 1.38, 0.95]);
  tube(oa, [-0.34, 1.1, 0], 0.1, 0.075, 0.24, p.primary, 14);
  for (const s of [-1, 1]) torus(oa, [-0.34 + s * 0.14, 1.02, 0], 0.08, 0.02, p.accent, p.hd);
  const pour = group(root, 'PourAmphora', [0.34, 0.84, 0]);
  orb(pour, [0, -0.14, 0], 0.23, p.primary, p.hd, [0.95, 1.38, 0.95]);
  tube(pour, [0, 0.26, 0], 0.1, 0.075, 0.24, p.primary, 14);
  for (const s of [-1, 1]) torus(pour, [s * 0.14, 0.18, 0], 0.08, 0.02, p.accent, p.hd);
  const pitcher = group(root, 'OilPitcher', [0.34, 0.16, 0.26]);
  orb(pitcher, [0, 0.12, 0], 0.11, p.accent, p.hd, [1, 1.15, 1]);
  tube(pitcher, [0, 0.26, 0], 0.05, 0.04, 0.1, p.accent, 12);
  torus(pitcher, [0.1, 0.18, 0], 0.06, 0.016, p.accent, p.hd);
  if (detail) {
    for (const sx of [-0.34, 0.34]) tube(oa, [sx, 0.22, 0], 0.16, 0.18, 0.12, p.edge, 12);
    if (p.hd) for (const sx of [-0.62, 0.62]) fastener(oa, [sx, 0.17, 0.34], p, 0.024);
  }
  root.animations = [new T.AnimationClip('Pour olive oil', 3, [rotationTrack('PourAmphora', 'x', [0, 0.9, 2.1, 3], [0, 0.72, 0.72, 0])])];
}

export function dimSumSteamerCart(root: T.Group, p: Finish, detail: boolean) {
  const ds = group(root, 'DimSumCart');
  const bao = matte('#f2ede0', 0.88, 'Steamed bao');
  shell(ds, [0, 0.56, 0], [1.26, 0.54, 0.82], p.primary, 0.14);
  shell(ds, [0, 0.86, 0], [1.34, 0.08, 0.88], p.alloy, 0.12);
  for (const sx of [-0.5, 0.5]) {
    strut(ds, [sx, 0.3, -0.32], [sx, 0.04, -0.32], 0.03, p.alloy, 8);
    tube(ds, [sx, 0.04, -0.32], 0.048, 0.048, 0.08, p.tire, 10);
    strut(ds, [sx, 0.88, -0.4], [sx, 1.04, -0.54], 0.022, p.alloy, 8);
  }
  strut(ds, [-0.5, 1.04, -0.54], [0.5, 1.04, -0.54], 0.026, p.dark, 10);
  cartWheel(ds, 'CartWheelL', [-0.68, 0.28, 0.18], 0.28, 0.065, p, detail);
  cartWheel(ds, 'CartWheelR', [0.68, 0.28, 0.18], 0.28, 0.065, p, detail);
  for (const sx of [-0.32, 0.32]) {
    for (let t = 0; t < 3; t++) {
      tube(ds, [sx, 0.98 + t * 0.14, 0], 0.21, 0.21, 0.13, p.accent, 16);
      ring(ds, [sx, 0.92 + t * 0.14, 0], 0.22, 0.016, 0.025, p.dark);
    }
  }
  for (const [dx, dz] of [[-0.08, 0.06], [0.08, 0.06], [0, -0.07]] as const) orb(ds, [-0.32 + dx, 1.35, dz], 0.062, bao, p.hd, [1.1, 0.72, 1.1]);
  tube(ds, [0.32, 1.36, 0], 0.22, 0.22, 0.05, p.accent, 16);
  box(ds, [-0.32, 1.35, -0.22], [0.07, 0.06, 0.04], p.dark);
  const lid = group(root, 'BambooSteamerLid', [-0.32, 1.36, -0.21]);
  box(lid, [0, 0.02, 0.015], [0.06, 0.04, 0.05], p.dark);
  tube(lid, [0, 0.03, 0.21], 0.22, 0.22, 0.06, p.accent, 16);
  torus(lid, [0, 0.07, 0.21], 0.055, 0.015, p.dark, p.hd);
  if (detail) {
    box(ds, [0, 0.56, 0.425], [0.84, 0.3, 0.026], p.stencil);
    if (p.hd) for (const sx of [-0.52, 0.52]) fastener(ds, [sx, 0.86, 0.45], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Lift steamer lid', 2.8, [rotationTrack('BambooSteamerLid', 'x', [0, 0.8, 2, 2.8], [0, -1.15, -1.15, 0])]),
    new T.AnimationClip('Roll cart', 2.8, [spinTrack('CartWheelL', 'x', 2.8, 2), spinTrack('CartWheelR', 'x', 2.8, 2)]),
  ];
}
