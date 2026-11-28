import * as T from 'three';
import {
  addCradleStand, addPedestalStand, band, box, cone, cyl, fastener, group, hose, HPI, orb,
  ring, rotationTrack, shell, slideTrack, spinTrack, strut, torus, tube, type Finish,
} from './handheld-fantasy-scifi-kit';

export function buildKnightBroadswordRack(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'SwordRack');
  addCradleStand(stand, p, detail, {
    w: 1.04, d: 0.72, baseH: 0.12, postH: 0.48, span: 0.34, axis: 'x',
    baseMat: p.dark, postMat: p.primary, trimMat: p.accent,
  });
  for (const sx of [-0.34, 0.34]) {
    for (const sz of [-0.22, 0.22]) strut(stand, [sx, 0.1, sz], [sx, 0.4, 0], 0.024, p.primary, 10);
  }
  const sw = group(root, 'BroadSword', [0, 0.64, 0]);
  shell(sw, [0.18, 0, 0], [1.14, 0.044, 0.14], p.alloy, 0.12);
  shell(sw, [0.16, 0, 0], [1.02, 0.076, 0.052], p.primary, 0.18);
  const tip = cone(sw, [0.85, 0, 0], 0.072, 0.24, p.alloy, p.hd, 10);
  tip.rotation.z = -HPI;
  tip.scale.set(0.35, 1, 1);
  shell(sw, [-0.4, 0, 0], [0.095, 0.088, 0.44], p.accent, 0.28);
  shell(sw, [-0.4, 0, 0], [0.13, 0.118, 0.15], p.accent, 0.32);
  for (const sz of [-0.22, 0.22]) orb(sw, [-0.4, 0, sz], 0.052, p.accent, p.hd);
  cyl(sw, [-0.6, 0, 0], 0.036, 0.042, 0.34, p.tire, 'x', 12);
  for (const gx of [-0.5, -0.6, -0.7]) band(sw, [gx, 0, 0], 0.046, 0.014, 0.028, p.dark, 'x');
  cyl(sw, [-0.81, 0, 0], 0.076, 0.076, 0.082, p.accent, 'z', 14);
  orb(sw, [-0.81, 0, 0], 0.046, p.optic, p.hd, [1, 1, 1.38]);
  if (detail) {
    shell(sw, [0.14, 0, 0], [0.82, 0.094, 0.024], p.accent, 0.2);
    shell(stand, [0, 0.34, 0], [0.22, 0.2, 0.07], p.accent, 0.32);
    if (p.hd) for (const sx of [-0.34, 0.34]) fastener(stand, [sx, 0.46, 0.085], p, 0.02).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Tilt broadsword', 2.8, [rotationTrack('BroadSword', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.4, 0, -0.4, 0])]),
  ];
}

export function buildDwarvenWarhammer(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'HammerStand');
  addPedestalStand(stand, p, detail, 0.44, 0.16, 0.28, 10);
  const wh = group(root, 'WarHammer', [0, 0.44, 0]);
  tube(wh, [0, 0.62, 0], 0.052, 0.058, 1.42, p.dark, 12);
  cone(wh, [0, -0.1, 0], 0.072, 0.14, p.edge, p.hd, 10).rotation.x = Math.PI;
  tube(wh, [0, 0.28, 0], 0.065, 0.065, 0.38, p.tire, 12);
  for (const hy of [0.08, 0.48, 0.86]) ring(wh, [0, hy, 0], 0.074, 0.018, 0.044, p.accent);
  shell(wh, [0, 1.24, 0], [0.34, 0.34, 0.32], p.primary, 0.24);
  for (const sx of [-0.27, 0.27]) {
    shell(wh, [sx, 1.24, 0], [0.24, 0.4, 0.38], p.primary, 0.26);
    shell(wh, [sx * 1.46, 1.24, 0], [0.07, 0.3, 0.28], p.alloy, 0.22);
  }
  for (const sz of [-0.175, 0.175]) shell(wh, [0, 1.24, sz], [0.46, 0.18, 0.056], p.accent, 0.28);
  tube(wh, [0, 1.48, 0], 0.11, 0.15, 0.14, p.accent, 10);
  cone(wh, [0, 1.66, 0], 0.095, 0.24, p.alloy, p.hd, 10);
  if (detail) {
    for (const sz of [-0.205, 0.205]) orb(wh, [0, 1.24, sz], 0.045, p.optic, p.hd, [1, 1, 0.55]);
    for (const sx of [-0.28, 0.28]) shell(wh, [sx, 1.45, 0], [0.14, 0.05, 0.2], p.accent, 0.24);
    if (p.hd) for (const sx of [-0.28, 0.28]) fastener(wh, [sx, 1.24, 0.195], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Rock warhammer', 2.8, [rotationTrack('WarHammer', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.36, 0, -0.36, 0])]),
  ];
}

export function buildDoubleBitBattleaxe(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'AxeStand');
  shell(stand, [0, 0.07, 0], [0.92, 0.14, 0.74], p.dark, 0.24);
  for (const sx of [-0.14, 0.14]) {
    shell(stand, [sx, 0.36, 0], [0.09, 0.52, 0.24], p.edge, 0.24);
    for (const sz of [-0.24, 0.24]) strut(stand, [sx * 2.2, 0.1, sz], [sx, 0.44, 0], 0.026, p.edge, 10);
  }
  cyl(stand, [0, 0.52, 0], 0.055, 0.055, 0.36, p.alloy, 'x', 12);
  const ax = group(root, 'BattleAxe', [0, 0.52, 0]);
  tube(ax, [0, 0.58, 0], 0.048, 0.054, 1.44, p.primary, 12);
  orb(ax, [0, -0.17, 0], 0.078, p.accent, p.hd);
  tube(ax, [0, 0.26, 0], 0.06, 0.06, 0.34, p.tire, 12);
  for (const hy of [0.08, 0.44, 0.88]) ring(ax, [0, hy, 0], 0.068, 0.018, 0.044, p.accent);
  shell(ax, [0, 1.18, 0], [0.22, 0.32, 0.2], p.dark, 0.24);
  for (const sz of [-0.105, 0.105]) shell(ax, [0, 1.18, sz], [0.16, 0.22, 0.048], p.accent, 0.26);
  for (const s of [-1, 1]) {
    shell(ax, [s * 0.18, 1.18, 0], [0.2, 0.18, 0.088], p.dark, 0.24);
    shell(ax, [s * 0.33, 1.32, 0], [0.24, 0.22, 0.068], p.edge, 0.34).rotation.z = s * 0.38;
    shell(ax, [s * 0.33, 1.04, 0], [0.24, 0.22, 0.068], p.edge, 0.34).rotation.z = -s * 0.38;
    const edge = torus(ax, [s * 0.22, 1.18, 0], 0.25, 0.036, p.alloy, p.hd, Math.PI * 0.76);
    edge.rotation.z = s > 0 ? -Math.PI * 0.38 : Math.PI * 0.62;
    edge.scale.set(1, 1.16, 0.52);
    for (const ty of [-1, 1]) {
      const horn = cone(ax, [s * 0.33, 1.18 + ty * 0.28, 0], 0.04, 0.14, p.alloy, p.hd, 10);
      horn.rotation.z = -s * ty * 0.85;
    }
  }
  tube(ax, [0, 1.42, 0], 0.07, 0.1, 0.14, p.accent, 10);
  cone(ax, [0, 1.66, 0], 0.068, 0.36, p.alloy, p.hd, 10);
  if (detail) {
    box(stand, [0, 0.07, 0.375], [0.34, 0.06, 0.04], p.accent);
    for (const s of [-1, 1]) orb(ax, [s * 0.3, 1.18, 0], 0.048, p.accent, p.hd, [1, 1, 1.6]);
    if (p.hd) for (const sx of [-0.36, 0.36]) fastener(stand, [sx, 0.146, 0.28], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Rock battleaxe', 2.8, [rotationTrack('BattleAxe', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.4, 0, -0.4, 0])]),
  ];
}

export function buildElvenRecurveBowStand(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'BowStand');
  shell(stand, [0, 0.06, 0], [0.84, 0.12, 0.78], p.dark, 0.32);
  ring(stand, [0, 0.135, 0], 0.3, 0.036, 0.042, p.accent);
  for (const sx of [-0.22, 0.22]) {
    hose(stand, [[sx, 0.08, 0.06], [sx * 0.72, 0.42, 0.1], [sx * 0.2, 0.82, 0.1]], 0.034, p.primary, p.hd);
    strut(stand, [sx, 0.08, -0.2], [sx * 0.35, 0.56, 0.06], 0.024, p.edge, 10);
  }
  const bow = group(root, 'RecurveBow');
  shell(bow, [0, 1.04, 0.1], [0.095, 0.42, 0.12], p.primary, 0.32);
  tube(bow, [0, 0.96, 0.1], 0.048, 0.05, 0.22, p.tire, 12);
  shell(bow, [0.065, 1.12, 0.11], [0.08, 0.048, 0.1], p.accent, 0.24);
  for (const ly of [0.84, 1.24]) ring(bow, [0, ly, 0.1], 0.064, 0.022, 0.052, p.accent);
  for (const s of [-1, 1]) {
    const pts: [number, number, number][] = [
      [0, 1.04 + s * 0.18, 0.1], [0, 1.04 + s * 0.44, 0.02],
      [0, 1.04 + s * 0.68, -0.16], [0, 1.04 + s * 0.84, -0.09],
    ];
    hose(bow, pts, 0.03, p.primary, p.hd);
    hose(bow, pts.map(([x, y, z]) => [x, y, z + 0.032]), 0.014, p.accent, p.hd);
    orb(bow, [0, 1.04 + s * 0.84, -0.09], 0.038, p.accent, p.hd);
  }
  strut(bow, [0, 1.88, -0.09], [0, 0.2, -0.09], 0.01, p.stencil, 10);
  const ar = group(root, 'DrawArrow', [0.045, 1.165, 0.18]);
  cyl(ar, [0, 0, 0], 0.015, 0.015, 0.72, p.dark, 'z', 10);
  cyl(ar, [0, 0, 0.33], 0.022, 0.018, 0.055, p.accent, 'z', 10);
  const head = cone(ar, [0, 0, 0.41], 0.046, 0.15, p.alloy, p.hd, 10);
  head.rotation.x = HPI;
  head.scale.set(0.36, 1, 1);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const vane = shell(ar, [Math.cos(a) * 0.034, Math.sin(a) * 0.034, -0.25], [0.06, 0.016, 0.14], i === 0 ? p.accent : p.stencil, 0.3);
    vane.rotation.z = a;
  }
  orb(ar, [0, 0, -0.36], 0.022, p.accent, p.hd);
  if (detail) {
    box(stand, [0, 0.06, 0.395], [0.28, 0.055, 0.04], p.accent);
    for (const s of [-1, 1]) orb(bow, [0, 1.04 + s * 0.56, -0.05], 0.032, p.optic, p.hd);
    if (p.hd) for (const sx of [-0.3, 0.3]) fastener(stand, [sx, 0.126, 0.24], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Draw arrow', 2.6, [slideTrack('DrawArrow', [0.045, 1.165, 0.18], 2, [0, 0.8, 1.7, 2.6], [0, -0.22, -0.22, 0])]),
  ];
}

export function buildGrimoireSpellbookPodium(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'PodiumStand');
  tube(stand, [0, 0.06, 0], 0.4, 0.44, 0.12, p.dark, 10);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4;
    const cx = Math.sin(a), cz = Math.cos(a);
    strut(stand, [cx * 0.42, 0.07, cz * 0.42], [cx * 0.14, 0.24, cz * 0.14], 0.036, p.edge, 10);
    orb(stand, [cx * 0.44, 0.055, cz * 0.44], 0.052, p.accent, p.hd);
  }
  tube(stand, [0, 0.5, 0], 0.11, 0.15, 0.82, p.dark, 12);
  for (const ry of [0.16, 0.5, 0.84]) ring(stand, [0, ry, 0], 0.17, 0.034, 0.048, p.accent);
  const desk = group(root, 'LecternDesk', [0, 0.94, 0]);
  desk.rotation.x = 0.36;
  shell(desk, [0, 0, 0], [0.76, 0.075, 0.58], p.dark, 0.22);
  shell(desk, [0, 0.065, 0.265], [0.72, 0.075, 0.055], p.accent, 0.22);
  shell(desk, [0, 0.055, 0], [0.58, 0.042, 0.46], p.primary, 0.16);
  cyl(desk, [-0.28, 0.115, 0], 0.072, 0.072, 0.46, p.primary, 'z', 14);
  for (const rz of [-0.16, -0.05, 0.05, 0.16]) band(desk, [-0.28, 0.115, rz], 0.078, 0.016, 0.026, p.accent, 'z');
  shell(desk, [0.01, 0.115, 0], [0.51, 0.095, 0.41], p.stencil, 0.12);
  const spineWrap = group(desk, 'CoverHinge', [-0.27, 0.165, 0]);
  spineWrap.rotation.y = Math.PI;
  const cov = group(spineWrap, 'BookCover');
  shell(cov, [-0.28, 0.018, 0], [0.58, 0.044, 0.46], p.primary, 0.16);
  ring(cov, [-0.28, 0.052, 0], 0.11, 0.024, 0.034, p.accent);
  orb(cov, [-0.28, 0.058, 0], 0.056, p.optic, p.hd, [1, 0.55, 1]);
  shell(cov, [-0.57, -0.02, 0], [0.052, 0.08, 0.09], p.accent, 0.24);
  for (const cx of [-0.04, -0.52]) {
    for (const cz of [-0.18, 0.18]) shell(cov, [cx, 0.042, cz], [0.08, 0.036, 0.08], p.accent, 0.24);
  }
  const bm = group(desk, 'BookmarkOrb', [0.1, 0.12, 0.22]);
  shell(bm, [0, 0.01, -0.04], [0.048, 0.026, 0.16], p.accent, 0.2);
  strut(bm, [0, 0.01, 0.04], [0, -0.09, 0.1], 0.014, p.accent, 10);
  orb(bm, [0, -0.14, 0.11], 0.062, p.optic, p.hd, [0.85, 1.2, 0.85]);
  ring(bm, [0, -0.088, 0.105], 0.038, 0.014, 0.024, p.accent);
  if (detail) {
    for (let i = 0; i < 4; i++) {
      const a = i * HPI;
      strut(stand, [Math.sin(a) * 0.145, 0.16, Math.cos(a) * 0.145], [Math.sin(a) * 0.115, 0.84, Math.cos(a) * 0.115], 0.018, p.edge, 10);
    }
    if (p.hd) for (const cz of [-0.12, 0.12]) fastener(cov, [-0.46, 0.044, cz], p, 0.018);
  }
  root.animations = [
    new T.AnimationClip('Open spellbook', 2.8, [rotationTrack('BookCover', 'z', [0, 0.8, 1.9, 2.8], [0, -1.72, -1.72, 0])]),
  ];
}

export function buildPirateFlintlockPistol(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'PistolStand');
  addCradleStand(stand, p, detail, {
    w: 0.72, d: 1.06, baseH: 0.12, postH: 0.4, span: 0.28, axis: 'z',
    baseMat: p.dark, postMat: p.primary, trimMat: p.accent,
  });
  const gun = group(root, 'FlintlockBody');
  shell(gun, [0, 0.55, 0.14], [0.11, 0.11, 0.58], p.primary, 0.3);
  shell(gun, [0, 0.51, -0.22], [0.1, 0.12, 0.24], p.primary, 0.32).rotation.x = 0.42;
  shell(gun, [0, 0.41, -0.38], [0.1, 0.12, 0.24], p.primary, 0.34).rotation.x = 0.72;
  orb(gun, [0, 0.33, -0.49], 0.082, p.accent, p.hd, [0.78, 0.92, 1.15]);
  cyl(gun, [0, 0.63, 0.18], 0.044, 0.056, 0.64, p.edge, 'z', 14);
  cyl(gun, [0, 0.63, 0.52], 0.082, 0.046, 0.14, p.edge, 'z', 16);
  band(gun, [0, 0.63, 0.58], 0.088, 0.022, 0.042, p.accent, 'z');
  cyl(gun, [0, 0.63, 0.565], 0.054, 0.054, 0.036, p.inset, 'z', 14);
  for (const bz of [0.04, 0.32]) band(gun, [0, 0.61, bz], 0.068, 0.018, 0.045, p.accent, 'z');
  cyl(gun, [0, 0.48, 0.22], 0.016, 0.016, 0.48, p.dark, 'z', 10);
  orb(gun, [0, 0.48, 0.47], 0.024, p.accent, p.hd);
  shell(gun, [0.065, 0.58, -0.08], [0.036, 0.11, 0.24], p.accent, 0.24);
  shell(gun, [0.09, 0.64, 0.01], [0.04, 0.075, 0.045], p.alloy, 0.2);
  hose(gun, [[0, 0.5, -0.25], [0, 0.4, -0.2], [0, 0.4, -0.06], [0, 0.5, -0.02]], 0.016, p.accent, p.hd);
  const hm = group(root, 'FlintHammer', [0.095, 0.58, -0.11]);
  cyl(hm, [0, 0, 0], 0.024, 0.024, 0.045, p.alloy, 'x', 10);
  hose(hm, [[0.01, 0, 0], [0.01, 0.08, -0.04], [0.01, 0.15, 0.02]], 0.018, p.alloy, p.hd);
  shell(hm, [0.01, 0.155, 0.035], [0.046, 0.045, 0.055], p.accent, 0.24);
  box(hm, [0.01, 0.155, 0.065], [0.03, 0.026, 0.045], p.inset);
  const tr = group(root, 'PistolTrigger', [0, 0.5, -0.14]);
  strut(tr, [0, 0, 0], [0, -0.075, -0.02], 0.014, p.alloy, 10);
  orb(tr, [0, -0.078, -0.022], 0.018, p.accent, p.hd);
  if (detail) {
    shell(gun, [-0.06, 0.56, -0.06], [0.024, 0.055, 0.26], p.accent, 0.26);
    if (p.hd) for (const sz of [-0.15, -0.02]) fastener(gun, [0.088, 0.57, sz], p, 0.016).rotation.z = -HPI;
  }
  root.animations = [
    new T.AnimationClip('Cock flintlock', 2.4, [rotationTrack('FlintHammer', 'x', [0, 0.65, 1.6, 2.4], [0, -0.78, -0.78, 0])]),
    new T.AnimationClip('Pull trigger', 2, [rotationTrack('PistolTrigger', 'x', [0, 0.55, 1.3, 2], [0, -0.42, -0.42, 0])]),
  ];
}

export function buildLacqueredKatanaStand(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'KatanaStand');
  for (const sx of [-0.38, 0.38]) {
    shell(stand, [sx, 0.06, 0], [0.16, 0.12, 0.68], p.dark, 0.26);
    shell(stand, [sx, 0.44, 0], [0.09, 0.72, 0.16], p.primary, 0.26);
    for (const sz of [-0.065, 0.065]) shell(stand, [sx, 0.8, sz], [0.075, 0.12, 0.06], p.primary, 0.28);
    shell(stand, [sx, 0.34, 0.02], [0.13, 0.09, 0.22], p.accent, 0.26);
  }
  shell(stand, [0, 0.075, 0], [0.76, 0.09, 0.22], p.dark, 0.22);
  shell(stand, [0, 0.36, -0.08], [0.68, 0.22, 0.048], p.primary, 0.22);
  cyl(stand, [0, 0.36, -0.045], 0.072, 0.072, 0.032, p.accent, 'z', 14);
  const kb = group(root, 'KatanaBlade', [0, 0.79, 0]);
  shell(kb, [-0.1, -0.01, 0], [0.46, 0.068, 0.026], p.alloy, 0.16).rotation.z = 0.04;
  shell(kb, [0.3, 0.02, 0], [0.44, 0.062, 0.024], p.alloy, 0.16).rotation.z = 0.09;
  shell(kb, [0.64, 0.068, 0], [0.3, 0.052, 0.022], p.alloy, 0.18).rotation.z = 0.15;
  const tip = cone(kb, [0.83, 0.105, 0], 0.034, 0.14, p.alloy, p.hd, 10);
  tip.rotation.z = -HPI + 0.2;
  tip.scale.set(1, 1, 0.42);
  shell(kb, [-0.33, -0.02, 0], [0.065, 0.082, 0.046], p.accent, 0.22);
  cyl(kb, [-0.38, -0.022, 0], 0.095, 0.095, 0.026, p.accent, 'x', 16);
  band(kb, [-0.38, -0.022, 0], 0.098, 0.018, 0.036, p.dark, 'x');
  shell(kb, [-0.6, -0.03, 0], [0.42, 0.064, 0.048], p.tire, 0.3);
  for (const gx of [-0.48, -0.56, -0.64, -0.72]) band(kb, [gx, -0.03, 0], 0.04, 0.012, 0.024, p.accent, 'x');
  shell(kb, [-0.82, -0.032, 0], [0.055, 0.068, 0.052], p.accent, 0.28);
  const sy = group(root, 'SayaSheath', [0, 0.39, 0.03]);
  shell(sy, [-0.14, -0.01, 0], [0.62, 0.088, 0.056], p.primary, 0.28).rotation.z = 0.04;
  shell(sy, [0.42, 0.035, 0], [0.58, 0.082, 0.052], p.primary, 0.28).rotation.z = 0.1;
  shell(sy, [-0.45, -0.024, 0], [0.055, 0.095, 0.064], p.accent, 0.24);
  shell(sy, [0.72, 0.066, 0], [0.075, 0.086, 0.058], p.accent, 0.28);
  shell(sy, [-0.18, -0.01, 0], [0.14, 0.105, 0.074], p.dark, 0.3);
  band(sy, [-0.18, -0.01, 0], 0.064, 0.016, 0.04, p.accent, 'x');
  if (detail) {
    for (const sx of [-0.38, 0.38]) box(stand, [sx, 0.065, 0.345], [0.1, 0.05, 0.04], p.accent);
    orb(kb, [-0.58, -0.03, 0.03], 0.018, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.38, 0.38]) fastener(stand, [sx, 0.126, 0.26], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Salute katana', 2.8, [rotationTrack('KatanaBlade', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.34, 0, -0.34, 0])]),
  ];
}

export function buildPolearmHalberdRack(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'HalberdStand');
  addPedestalStand(stand, p, detail, 0.44, 0.16, 0.32, 10);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    strut(stand, [Math.sin(a) * 0.36, 0.14, Math.cos(a) * 0.36], [Math.sin(a) * 0.14, 0.56, Math.cos(a) * 0.14], 0.028, p.primary, 10);
  }
  const hb = group(root, 'HalberdShaft', [0, 0.44, 0]);
  tube(hb, [0, 0.74, 0], 0.042, 0.048, 1.66, p.dark, 12);
  for (const cy of [0.22, 0.64, 1.06, 1.38]) ring(hb, [0, cy, 0], 0.058, 0.016, 0.044, p.accent);
  for (const sx of [-0.045, 0.045]) shell(hb, [sx, 1.36, 0], [0.028, 0.42, 0.056], p.primary, 0.2);
  shell(hb, [0, 1.56, 0], [0.16, 0.26, 0.13], p.primary, 0.22);
  shell(hb, [0.22, 1.56, 0], [0.28, 0.3, 0.052], p.primary, 0.28);
  shell(hb, [0.34, 1.68, 0], [0.16, 0.18, 0.036], p.alloy, 0.34).rotation.z = 0.35;
  shell(hb, [0.34, 1.44, 0], [0.16, 0.18, 0.036], p.alloy, 0.34).rotation.z = -0.35;
  shell(hb, [0.38, 1.56, 0], [0.09, 0.28, 0.032], p.alloy, 0.26);
  shell(hb, [-0.18, 1.59, 0], [0.2, 0.11, 0.052], p.primary, 0.24).rotation.z = 0.16;
  const beak = cone(hb, [-0.32, 1.54, 0], 0.052, 0.2, p.alloy, p.hd, 10);
  beak.rotation.z = HPI + 0.32;
  beak.scale.set(0.65, 1, 0.55);
  tube(hb, [0, 1.72, 0], 0.058, 0.078, 0.1, p.accent, 10);
  const spear = cone(hb, [0, 1.97, 0], 0.062, 0.44, p.alloy, p.hd, 10);
  spear.scale.set(1, 1, 0.55);
  if (detail) {
    tube(hb, [0, 0.42, 0], 0.056, 0.056, 0.32, p.tire, 12);
    for (const sz of [-0.07, 0.07]) orb(hb, [0, 1.56, sz], 0.034, p.accent, p.hd);
    if (p.hd) for (const hy of [1.46, 1.66]) fastener(hb, [0.2, hy, 0.032], p, 0.018).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Tilt halberd', 2.8, [rotationTrack('HalberdShaft', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.3, 0, -0.3, 0])]),
  ];
}

export function buildCrystalScepterStand(root: T.Group, p: Finish, detail: boolean) {
  const stand = group(root, 'ScepterStand');
  addPedestalStand(stand, p, detail, 0.42, 0.16, 0.24, 10);
  const sc = group(root, 'ScepterBody');
  tube(sc, [0, 0.96, 0], 0.048, 0.058, 1.12, p.primary, 12);
  tube(sc, [0, 0.8, 0], 0.064, 0.064, 0.28, p.dark, 12);
  for (const cy of [0.62, 0.98, 1.28]) ring(sc, [0, cy, 0], 0.074, 0.022, 0.048, p.accent);
  tube(sc, [0, 1.52, 0], 0.145, 0.062, 0.18, p.primary, 12);
  ring(sc, [0, 1.61, 0], 0.158, 0.028, 0.046, p.accent);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    const ca = Math.cos(a), sa = Math.sin(a);
    hose(sc, [
      [ca * 0.13, 1.58, sa * 0.13], [ca * 0.215, 1.78, sa * 0.215],
      [ca * 0.16, 1.94, sa * 0.16], [ca * 0.085, 2.02, sa * 0.085],
    ], 0.022, p.accent, p.hd);
  }
  const cr = group(root, 'ManaCrystal', [0, 1.8, 0]);
  tube(cr, [0, -0.15, 0], 0.04, 0.045, 0.18, p.alloy, 10);
  cone(cr, [0, 0.125, 0], 0.122, 0.25, p.accent, p.hd, 10);
  cone(cr, [0, -0.125, 0], 0.122, 0.25, p.accent, p.hd, 10).rotation.x = Math.PI;
  tube(cr, [0, 0, 0], 0.136, 0.136, 0.068, p.optic, 10);
  const sr = group(root, 'ScepterRing', [0, 1.8, 0]);
  torus(sr, [0, 0, 0], 0.215, 0.022, p.accent, p.hd);
  for (const s of [-1, 1]) {
    strut(sr, [s * 0.12, 0, 0], [s * 0.215, 0, 0], 0.014, p.alloy, 10);
    orb(sr, [0, s * 0.215, 0], 0.032, p.optic, p.hd);
    orb(sr, [s * 0.215, 0, 0], 0.032, p.accent, p.hd);
  }
  if (detail) {
    for (let i = 0; i < 4; i++) {
      const a = i * HPI + Math.PI / 4;
      orb(sc, [Math.cos(a) * 0.15, 1.56, Math.sin(a) * 0.15], 0.026, p.optic, p.hd);
    }
    if (p.hd) ring(sc, [0, 1.14, 0], 0.072, 0.018, 0.034, p.alloy);
  }
  root.animations = [
    new T.AnimationClip('Spin crystal', 2.8, [spinTrack('ManaCrystal', 'y', 2.8, 1)]),
    new T.AnimationClip('Orbit ring', 3, [spinTrack('ScepterRing', 'z', 3, 1)]),
  ];
}

export function buildVikingRoundShield(root: T.Group, p: Finish, detail: boolean) {
  const es = group(root, 'ShieldEasel');
  for (const sx of [-0.34, 0.34]) {
    shell(es, [sx, 0.06, -0.02], [0.14, 0.12, 0.86], p.dark, 0.22);
    strut(es, [sx, 0.1, 0.26], [sx * 0.86, 0.86, -0.04], 0.036, p.dark, 10);
    strut(es, [sx, 0.1, -0.34], [sx * 0.86, 0.86, -0.04], 0.036, p.dark, 10);
  }
  for (const sz of [-0.26, 0.26]) shell(es, [0, 0.075, sz], [0.76, 0.09, 0.14], p.dark, 0.2);
  cyl(es, [0, 0.84, -0.04], 0.042, 0.042, 0.68, p.edge, 'x', 12);
  const sh = group(root, 'ShieldTilt', [0, 0.84, 0.02]);
  cyl(sh, [0, 0, 0.05], 0.54, 0.54, 0.072, p.primary, 'z', 20);
  band(sh, [0, 0, 0.05], 0.575, 0.048, 0.098, p.accent, 'z');
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4;
    box(sh, [Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.092], [0.36, 0.075, 0.032], p.stencil).rotation.z = a;
  }
  shell(sh, [0, 0, -0.015], [0.74, 0.085, 0.055], p.edge, 0.22);
  cyl(sh, [0, 0, -0.048], 0.034, 0.034, 0.26, p.tire, 'y', 10);
  const bs = group(sh, 'ShieldBoss', [0, 0, 0.095]);
  band(bs, [0, 0, 0.012], 0.17, 0.045, 0.044, p.accent, 'z');
  orb(bs, [0, 0, 0.02], 0.14, p.alloy, p.hd, [1, 1, 0.72]);
  box(bs, [0, 0, 0.108], [0.22, 0.034, 0.036], p.accent);
  box(bs, [0, 0, 0.108], [0.034, 0.22, 0.036], p.accent);
  orb(bs, [0, 0, 0.128], 0.042, p.optic, p.hd);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      orb(sh, [Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.098], 0.024, p.alloy, p.hd);
    }
    strut(es, [-0.32, 0.42, -0.18], [0.32, 0.42, -0.18], 0.024, p.accent, 10);
    if (p.hd) for (const sx of [-0.34, 0.34]) fastener(es, [sx, 0.126, 0.34], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Tilt shield', 2.8, [rotationTrack('ShieldTilt', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.24, 0, -0.24, 0])]),
    new T.AnimationClip('Spin runic boss', 2.6, [spinTrack('ShieldBoss', 'z', 2.6, 1)]),
  ];
}
