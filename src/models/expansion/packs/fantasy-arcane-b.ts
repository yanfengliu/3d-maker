import * as T from 'three';
import {
  arcanePalette, glassMat, group, HPI, kArch, kBowl, kBox, kCandle, kChain, kCrystal, kCyl,
  kFlask, kGear, kOrb, kRing, kShell, kStrut, kTorus, rotationTrack, spinTrack, type Finish,
} from './fantasy-arcane-kit';

export function brassWizardTelescope(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const tripod = group(root, 'TelescopeTripod');
  kCyl(tripod, [0, 1.14, 0], 0.15, 0.18, 0.12, p.primary, hd, 'y', 10);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6, fx = Math.cos(a) * 0.56, fz = Math.sin(a) * 0.56;
    kCyl(tripod, [fx, 0.05, fz], 0.036, 0.018, 0.1, m.brass, hd, 'y', 8);
    kStrut(tripod, [fx, 0.08, fz], [Math.cos(a) * 0.12, 1.12, Math.sin(a) * 0.12], 0.036, p.primary, hd, 8);
    kStrut(tripod, [Math.cos(a) * 0.34, 0.62, Math.sin(a) * 0.34], [0, 0.62, 0], 0.022, m.brass, hd, 6);
  }
  const tray = group(root, 'StarChartTray', [0, 0.64, 0]);
  kCyl(tray, [0, 0, 0], 0.28, 0.25, 0.045, p.primary, hd, 'y', 6);
  kCyl(tray, [-0.06, 0.05, 0.04], 0.035, 0.035, 0.32, m.parchment, hd, 'x', 8).rotation.y = 0.4;
  kCyl(tray, [0.1, 0.045, -0.05], 0.065, 0.065, 0.03, m.brass, hd, 'y', 10);
  kOrb(tray, [0.1, 0.065, -0.05], 0.04, m.rune, hd, [1, 0.35, 1]);
  const head = group(root, 'AzimuthHead', [0, 1.21, 0]);
  kGear(head, [0, 0.02, 0], 0.16, 0.045, 12, p.accent, hd, 'y');
  kBox(head, [0, 0.08, 0], [0.34, 0.05, 0.12], m.brass, hd);
  for (const s of [-1, 1]) {
    kBox(head, [s * 0.15, 0.2, 0], [0.05, 0.24, 0.1], m.brass, hd);
    kCyl(head, [s * 0.17, 0.28, 0], 0.045, 0.045, 0.08, p.accent, hd, 'x', 8);
  }
  const tube = group(head, 'TelescopeTube', [0, 0.28, 0]);
  kCyl(tube, [0, 0, -0.02], 0.11, 0.085, 0.66, p.accent, hd, 'z', 14);
  kCyl(tube, [0, 0, 0.42], 0.145, 0.115, 0.3, m.brass, hd, 'z', 14);
  kCyl(tube, [0, 0, 0.54], 0.12, 0.12, 0.04, m.glass, hd, 'z', 14).castShadow = false;
  kCyl(tube, [0, 0, 0.49], 0.11, 0.11, 0.03, m.rune, hd, 'z', 14);
  kCyl(tube, [0, 0, -0.46], 0.055, 0.045, 0.28, m.brass, hd, 'z', 10);
  kCyl(tube, [0, 0, -0.62], 0.04, 0.03, 0.1, m.iron, hd, 'z', 10);
  for (const z of [-0.32, 0, 0.26, 0.56]) kRing(tube, [0, 0, z], z > 0.2 ? 0.15 : 0.115, 0.024, 0.04, m.iron, hd, 'z');
  for (const z of [-0.14, 0.18]) kStrut(tube, [0, 0.1, z], [0, 0.21, z], 0.015, m.brass, hd, 6);
  kCyl(tube, [0, 0.21, 0.02], 0.036, 0.03, 0.46, p.accent, hd, 'z', 10);
  if (detail) {
    for (const s of [-1, 1]) kCyl(tube, [s * 0.095, -0.02, -0.4], 0.038, 0.038, 0.03, m.brass, hd, 'x', 10);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
      kRing(tripod, [Math.cos(a) * 0.45, 0.35, Math.sin(a) * 0.45], 0.05, 0.015, 0.05, m.brass, hd, 'y');
    }
    kTorus(tube, [0, 0, 0.44], 0.148, 0.014, p.accent, hd, 'z');
  }
  root.animations = [new T.AnimationClip('Scan cosmos', 3.6, [
    rotationTrack('TelescopeTube', 'x', [0, 0.85, 1.8, 2.8, 3.6], [0, -0.45, -0.08, 0.28, 0]),
    rotationTrack('AzimuthHead', 'y', [0, 0.9, 2.1, 3.6], [0, 0.72, -0.58, 0]),
  ])];
}

export function dungeonHangingCage(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const frame = group(root, 'GallowsFrame');
  kShell(frame, [-0.16, 0.05, 0], [1.38, 0.1, 1.12], m.stoneDark, hd, 0.12);
  kBox(frame, [-0.18, 0.17, 0], [1.26, 0.14, 0.26], p.primary, hd);
  kBox(frame, [-0.52, 0.19, 0], [0.28, 0.14, 1.02], m.woodDark, hd);
  kBox(frame, [-0.52, 1.44, 0], [0.24, 2.38, 0.24], p.primary, hd);
  for (const s of [-1, 1]) kStrut(frame, [-0.52, 0.24, s * 0.42], [-0.52, 0.92, s * 0.1], 0.055, m.woodDark, hd, 6);
  kStrut(frame, [-0.04, 0.22, 0], [-0.46, 0.86, 0], 0.055, m.woodDark, hd, 6);
  kBox(frame, [-0.12, 2.58, 0], [1.14, 0.22, 0.22], p.primary, hd);
  kStrut(frame, [-0.48, 1.96, 0], [0.06, 2.52, 0], 0.06, m.woodDark, hd, 6);
  kBox(frame, [-0.52, 2.58, 0], [0.28, 0.26, 0.26], p.accent, hd);
  kBox(frame, [0.24, 2.58, 0], [0.16, 0.26, 0.26], p.accent, hd);
  kTorus(frame, [0.24, 2.43, 0], 0.065, 0.02, m.iron, hd, 'z');
  const cage = group(root, 'HangingCage', [0.24, 2.43, 0]);
  kChain(cage, [0, 0, 0], [0, -0.54, 0], 0.052, 0.017, m.iron, hd);
  kCyl(cage, [0, -0.58, 0], 0.08, 0.11, 0.08, p.accent, hd, 'y', 8);
  for (const [ry, r] of [[-0.84, 0.36], [-1.26, 0.38], [-1.68, 0.36]] as const) kRing(cage, [0, ry, 0], r, 0.042, 0.055, p.accent, hd, 'y');
  kCyl(cage, [0, -1.7, 0], 0.34, 0.34, 0.05, m.iron, hd, 'y', 10);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, cx = Math.cos(a) * 0.34, cz = Math.sin(a) * 0.34;
    kStrut(cage, [0, -0.58, 0], [cx, -0.84, cz], 0.018, m.iron, hd, 6);
    kStrut(cage, [cx, -0.84, cz], [cx, -1.7, cz], 0.02, p.accent, hd, 6);
  }
  const lantern = group(root, 'GibbetLantern', [-0.38, 1.88, 0.14]);
  kStrut(lantern, [-0.14, 0, -0.1], [0.06, 0, 0.16], 0.02, m.iron, hd, 6);
  kStrut(lantern, [0.06, 0.01, 0.16], [0.06, -0.07, 0.16], 0.016, m.iron, hd, 6);
  kCyl(lantern, [0.06, -0.09, 0.16], 0.03, 0.1, 0.08, m.iron, hd, 'y', 8);
  kCyl(lantern, [0.06, -0.19, 0.16], 0.08, 0.07, 0.16, m.glass, hd, 'y', 8).castShadow = false;
  kOrb(lantern, [0.06, -0.19, 0.16], 0.045, m.flame, hd);
  kCyl(lantern, [0.06, -0.29, 0.16], 0.09, 0.04, 0.06, m.iron, hd, 'y', 8);
  if (detail) {
    kBox(cage, [0, -1.26, 0.38], [0.1, 0.14, 0.05], m.brass, hd);
    for (const y of [0.88, 1.54]) kBox(frame, [-0.52, y, 0], [0.27, 0.07, 0.27], m.iron, hd);
    kChain(cage, [0, -1.72, 0], [0, -1.96, 0], 0.038, 0.012, m.iron, hd);
  }
  root.animations = [new T.AnimationClip('Sway gibbet cage', 3.2, [rotationTrack('HangingCage', 'z', [0, 0.8, 1.6, 2.4, 3.2], [0, 0.34, 0, -0.34, 0])])];
}

export function goldenReliquaryAltar(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const altar = group(root, 'AltarTable');
  kShell(altar, [0, 0.06, 0], [1.86, 0.12, 1.04], m.stone, hd, 0.12);
  kShell(altar, [0, 0.18, 0], [1.62, 0.12, 0.88], p.primary, hd, 0.12);
  kBox(altar, [0, 0.56, 0], [1.34, 0.66, 0.64], p.primary, hd);
  for (const sx of [-0.64, 0, 0.64]) for (const sz of [-0.32, 0.32]) kBox(altar, [sx, 0.56, sz], [0.12, 0.62, 0.07], m.stone, hd);
  kShell(altar, [0, 0.94, 0], [1.54, 0.1, 0.8], p.primary, hd, 0.12);
  kBox(altar, [0, 1.005, 0], [0.96, 0.028, 0.78], m.cloth, hd);
  kBox(altar, [0, 0.68, 0.375], [0.88, 0.62, 0.04], m.cloth, hd);
  kBox(altar, [0, 0.39, 0.398], [0.84, 0.06, 0.025], p.accent, hd);
  kShell(altar, [0, 1.06, -0.02], [0.58, 0.1, 0.44], p.accent, hd, 0.16);
  kBox(altar, [0, 1.34, -0.17], [0.5, 0.48, 0.08], p.accent, hd);
  for (const s of [-1, 1]) kBox(altar, [s * 0.23, 1.34, -0.02], [0.07, 0.48, 0.34], p.accent, hd);
  kCyl(altar, [0, 1.2, -0.02], 0.08, 0.065, 0.22, m.brass, hd, 'y', 10);
  kCrystal(altar, [0, 1.38, -0.02], 0.068, 0.2, m.rune, hd);
  kCyl(altar, [0, 1.72, -0.02], 0.02, 0.36, 0.32, p.accent, hd, 'y', 4).rotation.y = Math.PI / 4;
  kOrb(altar, [0, 1.9, -0.02], 0.045, m.brass, hd);
  kCrystal(altar, [0, 1.99, -0.02], 0.03, 0.14, m.rune, hd);
  const doorL = group(root, 'ReliquaryDoorL', [-0.21, 1.34, 0.15]);
  kBox(doorL, [0.1, 0, 0], [0.2, 0.46, 0.042], p.accent, hd);
  kBox(doorL, [0.1, 0, 0.028], [0.12, 0.34, 0.022], m.brass, hd);
  const doorR = group(root, 'ReliquaryDoorR', [0.21, 1.34, 0.15]);
  kBox(doorR, [-0.1, 0, 0], [0.2, 0.46, 0.042], p.accent, hd);
  kBox(doorR, [-0.1, 0, 0.028], [0.12, 0.34, 0.022], m.brass, hd);
  const cand = group(root, 'TwinCandelabras', [0, 0.99, 0]);
  for (const s of [-1, 1]) {
    const cx = s * 0.58;
    kCyl(cand, [cx, 0.03, 0], 0.07, 0.11, 0.06, m.brass, hd, 'y', 10);
    kCyl(cand, [cx, 0.24, 0], 0.024, 0.032, 0.38, p.accent, hd, 'y', 8);
    kStrut(cand, [cx - 0.14, 0.4, 0], [cx + 0.14, 0.4, 0], 0.016, m.brass, hd, 6);
    for (const dx of [-0.13, 0, 0.13]) {
      kCyl(cand, [cx + dx, 0.42, 0], 0.04, 0.025, 0.035, p.accent, hd, 'y', 8);
      kCandle(cand, [cx + dx, 0.43, 0], 0.022, dx === 0 ? 0.22 : 0.16, m.parchment, m.flame, hd);
    }
  }
  if (detail) {
    for (const s of [-1, 1]) {
      kCyl(altar, [s * 0.24, 1.66, 0.12], 0.012, 0.038, 0.16, m.brass, hd, 'y', 6);
      kBox(altar, [s * 0.32, 0.58, -0.34], [0.4, 0.38, 0.04], m.stone, hd);
    }
    kCrystal(altar, [0, 0.68, 0.405], 0.06, 0.2, p.accent, hd);
  }
  root.animations = [new T.AnimationClip('Open triptych shrine', 2.8, [
    rotationTrack('ReliquaryDoorL', 'y', [0, 0.85, 2.0, 2.8], [0, -1.75, -1.75, 0]),
    rotationTrack('ReliquaryDoorR', 'y', [0, 0.85, 2.0, 2.8], [0, 1.75, 1.75, 0]),
  ])];
}

export function marbleScryingBasin(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const ped = group(root, 'BasinPedestal');
  kCyl(ped, [0, 0.06, 0], 0.52, 0.56, 0.12, p.primary, hd, 'y', 12);
  kCyl(ped, [0, 0.17, 0], 0.38, 0.44, 0.1, m.stone, hd, 'y', 12);
  kRing(ped, [0, 0.24, 0], 0.32, 0.05, 0.05, m.brass, hd, 'y');
  kCyl(ped, [0, 0.53, 0], 0.22, 0.25, 0.58, p.primary, hd, 'y', 12);
  for (let i = 0; i < 8; i++) kCyl(ped, [Math.cos((i * Math.PI) / 4) * 0.23, 0.53, Math.sin((i * Math.PI) / 4) * 0.23], 0.048, 0.054, 0.52, m.stone, hd, 'y', 8);
  kCyl(ped, [0, 0.84, 0], 0.36, 0.24, 0.1, p.primary, hd, 'y', 12);
  kBowl(ped, [0, 0.84, 0], 0.26, 0.56, 0.62, 0.36, 0.065, p.primary, hd, 14);
  kTorus(ped, [0, 1.2, 0], 0.59, 0.042, m.stone, hd, 'y');
  const serpents = group(root, 'SerpentHandles', [0, 1.02, 0]);
  for (const s of [-1, 1]) {
    kStrut(serpents, [s * 0.52, -0.06, 0], [s * 0.72, 0.08, 0], 0.036, m.brass, hd, 8);
    kStrut(serpents, [s * 0.72, 0.08, 0], [s * 0.66, 0.28, 0], 0.032, m.brass, hd, 8);
    kStrut(serpents, [s * 0.66, 0.28, 0], [s * 0.55, 0.2, 0], 0.028, m.brass, hd, 8);
    kOrb(serpents, [s * 0.54, 0.21, 0], 0.048, m.brass, hd, [1.2, 0.85, 0.9]);
    for (const sz of [-0.032, 0.032]) kOrb(serpents, [s * 0.52, 0.23, sz], 0.015, p.accent, hd);
  }
  const mirror = group(root, 'ScryingMirror', [0, 1.02, 0]);
  kCyl(mirror, [0, -0.06, 0], 0.16, 0.2, 0.16, m.stone, hd, 'y', 10);
  kCyl(mirror, [0, 0.05, 0], 0.51, 0.49, 0.045, p.accent, hd, 'y', 16);
  kCyl(mirror, [0, 0.088, 0], 0.46, 0.46, 0.024, m.glass, hd, 'y', 16).castShadow = false;
  kCrystal(mirror, [0, 0.1, 0], 0.08, 0.12, m.rune, hd);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    kBox(mirror, [Math.cos(a) * 0.26, 0.095, Math.sin(a) * 0.26], [0.28, 0.026, 0.055], i === 0 ? m.vortex : m.rune, hd).rotation.y = -a + 0.45;
  }
  if (detail) {
    for (let i = 0; i < 8; i++) kOrb(ped, [Math.cos((i * Math.PI) / 4) * 0.59, 1.24, Math.sin((i * Math.PI) / 4) * 0.59], 0.026, p.accent, hd);
    kRing(ped, [0, 0.78, 0], 0.27, 0.036, 0.05, m.brass, hd, 'y');
  }
  root.animations = [new T.AnimationClip('Swirl scrying mirror', 4.0, [spinTrack('ScryingMirror', 'y', 4.0, 1)])];
}

export function grimoireBookshelf(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const caseG = group(root, 'BookcaseFrame');
  kShell(caseG, [0, 0.08, 0], [1.48, 0.16, 0.76], m.woodDark, hd, 0.12);
  kShell(caseG, [0, 0.2, 0], [1.36, 0.08, 0.68], p.primary, hd, 0.12);
  kBox(caseG, [0, 1.12, -0.25], [1.18, 1.78, 0.08], m.woodDark, hd);
  for (const s of [-1, 1]) kBox(caseG, [s * 0.62, 1.12, 0], [0.12, 1.78, 0.64], p.primary, hd);
  for (const y of [0.6, 1.04, 1.48, 1.92]) kBox(caseG, [0, y, -0.02], [1.22, 0.055, 0.58], p.primary, hd);
  kBox(caseG, [0, 2.18, -0.26], [1.14, 0.44, 0.09], m.woodDark, hd);
  kBox(caseG, [0, 2.42, -0.26], [0.72, 0.2, 0.09], m.woodDark, hd);
  kArch(caseG, [0, 1.94, 0], 0.64, 0.22, 0.62, p.primary, hd, 7, m.woodDark);
  const covers = [p.accent, m.cloth, m.stoneDark, m.wood, m.brass] as const;
  for (const [sy, xs] of [
    [0.63, [-0.48, -0.37, -0.26, -0.14, -0.02, 0.1]],
    [1.07, [-0.48, -0.36, -0.24, -0.1, 0.02, 0.14, 0.28, 0.44]],
    [1.51, [-0.48, -0.36, -0.24]],
  ] as const) {
    for (const [idx, bx] of xs.entries()) {
      const h = 0.26 + (idx % 3) * 0.045;
      const tome = kBox(caseG, [bx, sy + h * 0.5, 0.02], [0.085, h, 0.34], covers[idx % covers.length] ?? p.accent, hd);
      if (idx === xs.length - 1 && sy > 1.0) tome.rotation.z = -0.16;
      kBox(caseG, [bx, sy + h * 0.5, 0.2], [0.068, h * 0.72, 0.024], m.brass, hd);
    }
  }
  kCyl(caseG, [0.32, 0.66, -0.08], 0.045, 0.045, 0.28, m.rune, hd, 'x', 8);
  const secret = group(root, 'SecretBookPanel', [0.54, 0.82, 0.18]);
  kBox(secret, [-0.2, 0, -0.04], [0.4, 0.34, 0.04], m.woodDark, hd);
  for (let i = 0; i < 4; i++) {
    kBox(secret, [-0.34 + i * 0.095, -0.02, 0.03], [0.08, 0.28 + (i % 2) * 0.04, 0.12], i % 2 === 0 ? p.accent : m.cloth, hd);
    kBox(secret, [-0.34 + i * 0.095, -0.02, 0.1], [0.055, 0.04, 0.02], m.brass, hd);
  }
  const curios = group(root, 'ShelfCurios', [0.22, 1.51, 0.04]);
  kOrb(curios, [-0.08, 0.14, 0], 0.1, m.bone, hd, [0.92, 1.05, 1.02]);
  kBox(curios, [-0.08, 0.05, 0.03], [0.11, 0.08, 0.1], m.bone, hd);
  for (const sx of [-0.04, 0.04]) kOrb(curios, [-0.08 + sx, 0.13, 0.085], 0.026, p.inset, hd);
  for (const [sz, sy] of [[0, 0.04], [0.06, 0.04], [0.03, 0.09]] as const) kCyl(curios, [0.18, sy, sz], 0.034, 0.034, 0.28, m.parchment, hd, 'x', 8);
  if (detail) {
    for (const s of [-1, 1]) for (const y of [0.56, 1.26, 1.84]) kBox(caseG, [s * 0.69, y, 0.18], [0.04, 0.22, 0.14], m.brass, hd);
    kCyl(caseG, [0, 2.68, 0], 0.015, 0.06, 0.24, m.brass, hd, 'y', 6);
  }
  root.animations = [new T.AnimationClip('Open secret books', 3.0, [rotationTrack('SecretBookPanel', 'y', [0, 0.9, 2.1, 3.0], [0, 1.52, 1.52, 0])])];
}

export function alchemistDistillationStill(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const still = group(root, 'DistillationFrame');
  kShell(still, [0, 0.07, 0], [1.78, 0.14, 0.94], m.woodDark, hd, 0.12);
  kShell(still, [-0.48, 0.42, 0], [0.68, 0.56, 0.68], m.cloth, hd, 0.1);
  kShell(still, [-0.48, 0.72, 0], [0.74, 0.08, 0.74], m.stoneDark, hd, 0.12);
  kBox(still, [-0.48, 0.34, 0.34], [0.34, 0.32, 0.05], p.inset, hd);
  for (const x of [-0.56, -0.48, -0.4]) {
    kOrb(still, [x, 0.26, 0.34], 0.055, m.ember, hd);
    kStrut(still, [x, 0.2, 0.37], [x, 0.48, 0.37], 0.014, m.iron, hd, 6);
  }
  kCyl(still, [-0.48, 0.88, 0], 0.28, 0.3, 0.28, p.primary, hd, 'y', 12);
  kRing(still, [-0.48, 1.0, 0], 0.31, 0.042, 0.06, m.brass, hd, 'y');
  kOrb(still, [-0.48, 1.02, 0], 0.28, p.primary, hd);
  kCyl(still, [-0.48, 1.36, 0], 0.09, 0.18, 0.28, m.copper, hd, 'y', 10);
  kStrut(still, [-0.48, 1.46, 0], [-0.24, 1.66, 0], 0.042, p.primary, hd, 8);
  kStrut(still, [-0.24, 1.66, 0], [0.1, 1.56, 0], 0.038, p.primary, hd, 8);
  kStrut(still, [0.1, 1.56, 0], [0.22, 1.24, 0], 0.034, m.copper, hd, 8);
  for (const sz of [-0.18, 0.18]) kStrut(still, [0.22, 0.14, sz], [0.22, 0.62, sz], 0.036, m.wood, hd, 6);
  kCyl(still, [0.22, 0.92, 0], 0.2, 0.2, 0.64, m.glass, hd, 'y', 12).castShadow = false;
  for (const y of [0.6, 1.24]) kCyl(still, [0.22, y, 0], 0.22, 0.22, 0.06, m.copper, hd, 'y', 12);
  for (let i = 0; i < 5; i++) kTorus(still, [0.22, 0.7 + i * 0.11, 0], 0.11, 0.022, m.brass, hd, 'y');
  kStrut(still, [0.22, 0.68, 0], [0.58, 0.56, 0], 0.024, m.brass, hd, 6);
  kCyl(still, [-0.48, 1.04, 0.28], 0.032, 0.036, 0.16, m.brass, hd, 'z', 8);
  const valve = group(root, 'PressureValveWheel', [-0.48, 1.04, 0.37]);
  kRing(valve, [0, 0, 0], 0.14, 0.032, 0.036, m.brass, hd, 'z');
  kCyl(valve, [0, 0, 0], 0.04, 0.04, 0.06, p.accent, hd, 'z', 8);
  for (let i = 0; i < 4; i++) kStrut(valve, [0, 0, 0], [Math.cos(i * HPI) * 0.13, Math.sin(i * HPI) * 0.13, 0], 0.015, m.brass, hd, 6);
  const carboy = group(root, 'ReceivingCarboy', [0.58, 0.14, 0]);
  kShell(carboy, [0, 0.1, 0], [0.46, 0.2, 0.46], m.wood, hd, 0.18);
  kFlask(carboy, [0, 0.2, 0], 0.18, 0.2, p.accent, m.glass, m.woodDark, hd);
  if (detail) {
    for (const y of [0.24, 0.42, 0.6]) for (const x of [-0.66, -0.3]) kBox(still, [x, y, -0.355], [0.22, 0.1, 0.035], m.stone, hd);
    for (let i = 0; i < 8; i++) kOrb(still, [-0.48 + Math.cos((i * Math.PI) / 4) * 0.315, 1.0, Math.sin((i * Math.PI) / 4) * 0.315], 0.018, m.iron, hd);
    kCyl(still, [-0.22, 1.12, 0.16], 0.07, 0.07, 0.04, m.parchment, hd, 'z', 10);
  }
  root.animations = [new T.AnimationClip('Turn pressure valve', 2.8, [spinTrack('PressureValveWheel', 'z', 2.8, 1)])];
}

export function crystalPrismPedestal(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const aura = glassMat('Prism aura', '#7cecff', 0.26);
  const ped = group(root, 'PrismPedestal');
  kCyl(ped, [0, 0.08, 0], 0.64, 0.68, 0.16, m.stoneDark, hd, 'y', 6);
  kCyl(ped, [0, 0.22, 0], 0.5, 0.54, 0.12, p.primary, hd, 'y', 6);
  kCyl(ped, [0, 0.34, 0], 0.38, 0.42, 0.12, m.stoneDark, hd, 'y', 6);
  kCyl(ped, [0, 0.7, 0], 0.24, 0.3, 0.62, p.primary, hd, 'y', 6);
  kCyl(ped, [0, 1.04, 0], 0.4, 0.28, 0.12, m.stoneDark, hd, 'y', 6);
  kRing(ped, [0, 1.1, 0], 0.36, 0.06, 0.06, m.brass, hd, 'y');
  kCyl(ped, [0, 1.32, 0], 0.052, 0.075, 0.48, m.brass, hd, 'y', 10);
  const prism = group(root, 'CrystalPrism', [0, 1.56, 0]);
  kRing(prism, [0, -0.18, 0], 0.16, 0.055, 0.08, m.brass, hd, 'y');
  kCrystal(prism, [0, 0.16, 0], 0.22, 0.88, p.accent, hd);
  kCrystal(prism, [0, 0.16, 0], 0.27, 0.94, aura, hd).castShadow = false;
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    kCrystal(prism, [Math.cos(a) * 0.16, -0.02, Math.sin(a) * 0.16], 0.065, 0.34, m.rune, hd).rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
  }
  const prongs = group(root, 'FocusingProngs', [0, 1.08, 0]);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4, cx = Math.cos(a), cz = Math.sin(a);
    kStrut(prongs, [cx * 0.32, 0, cz * 0.32], [cx * 0.48, 0.34, cz * 0.48], 0.032, m.brass, hd, 8);
    kStrut(prongs, [cx * 0.48, 0.34, cz * 0.48], [cx * 0.38, 0.72, cz * 0.38], 0.026, m.brass, hd, 8);
    kOrb(prongs, [cx * 0.37, 0.74, cz * 0.37], 0.042, m.rune, hd);
  }
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      kBox(ped, [Math.cos(a) * 0.265, 0.7, Math.sin(a) * 0.265], [0.05, 0.44, 0.04], m.rune, hd).rotation.y = -a;
      kCrystal(ped, [Math.cos(a) * 0.46, 0.34, Math.sin(a) * 0.46], 0.045, 0.18, p.accent, hd);
    }
  }
  root.animations = [new T.AnimationClip('Rotate crystal prism', 3.6, [spinTrack('CrystalPrism', 'y', 3.6, 1)])];
}

export function hourglassMonolith(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const mono = group(root, 'MonolithFrame');
  kShell(mono, [0, 0.07, 0], [1.36, 0.14, 1.14], m.stoneDark, hd, 0.14);
  kShell(mono, [0, 0.19, 0], [1.18, 0.1, 0.96], p.primary, hd, 0.14);
  for (const sx of [-0.46, 0.46]) for (const sz of [-0.34, 0.34]) {
    kBox(mono, [sx, 0.3, sz], [0.22, 0.14, 0.22], m.stone, hd);
    kBox(mono, [sx, 1.12, sz], [0.16, 1.54, 0.16], p.primary, hd);
    kBox(mono, [sx, 1.9, sz], [0.22, 0.12, 0.22], m.stone, hd);
  }
  kShell(mono, [0, 2.04, 0], [1.32, 0.16, 1.08], m.stoneDark, hd, 0.14);
  for (const sx of [-0.46, 0.46]) {
    kBox(mono, [sx, 1.12, 0], [0.18, 0.2, 0.76], m.stone, hd);
    kCyl(mono, [sx * 0.68, 1.12, 0], 0.042, 0.042, 0.34, m.brass, hd, 'x', 8);
  }
  const hg = group(root, 'HourglassVessel', [0, 1.12, 0]);
  kCyl(hg, [0, 0, 0], 0.13, 0.13, 0.1, p.accent, hd, 'y', 12);
  for (const sx of [-1, 1]) kCyl(hg, [sx * 0.16, 0, 0], 0.045, 0.045, 0.18, m.brass, hd, 'x', 8);
  for (const sy of [-0.62, 0.62]) kCyl(hg, [0, sy, 0], 0.34, 0.34, 0.08, p.accent, hd, 'y', 8);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4;
    kStrut(hg, [Math.cos(a) * 0.27, -0.62, Math.sin(a) * 0.27], [Math.cos(a) * 0.27, 0.62, Math.sin(a) * 0.27], 0.022, m.brass, hd, 6);
  }
  kCyl(hg, [0, 0.31, 0], 0.26, 0.06, 0.54, m.glass, hd, 'y', 14).castShadow = false;
  kCyl(hg, [0, -0.31, 0], 0.06, 0.26, 0.54, m.glass, hd, 'y', 14).castShadow = false;
  kCyl(hg, [0, -0.44, 0], 0.04, 0.21, 0.26, p.accent, hd, 'y', 12);
  kCyl(hg, [0, 0.2, 0], 0.16, 0.03, 0.22, p.accent, hd, 'y', 12);
  kCyl(hg, [0, -0.1, 0], 0.022, 0.022, 0.44, m.flame, hd, 'y', 8);
  const finial = group(root, 'CrownFinial', [0, 2.12, 0]);
  kCyl(finial, [0, 0.06, 0], 0.14, 0.2, 0.12, p.primary, hd, 'y', 8);
  kTorus(finial, [0, 0.24, 0], 0.14, 0.024, p.accent, hd, 'z');
  kCrystal(finial, [0, 0.24, 0], 0.055, 0.22, m.flame, hd);
  if (detail) {
    for (const sz of [-0.56, 0.56]) kBox(mono, [0, 2.04, sz], [0.68, 0.08, 0.03], p.accent, hd);
    for (const sx of [-0.58, 0.58]) kOrb(mono, [sx, 1.12, 0], 0.06, p.accent, hd);
  }
  root.animations = [new T.AnimationClip('Flip hourglass', 4.4, [rotationTrack('HourglassVessel', 'x', [0, 1.2, 2.2, 3.4, 4.4], [0, Math.PI, Math.PI, 0, 0])])];
}

export function dwarvenVaultDoor(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const frame = group(root, 'VaultBulkhead');
  kShell(frame, [0, 0.11, 0], [2.36, 0.22, 0.94], m.stoneDark, hd, 0.12);
  for (const s of [-1, 1]) {
    kBox(frame, [s * 0.94, 1.18, 0], [0.46, 1.98, 0.72], p.primary, hd);
    kShell(frame, [s * 1.12, 0.72, 0], [0.22, 1.04, 0.56], m.stoneDark, hd, 0.14);
  }
  kShell(frame, [0, 2.16, 0], [2.32, 0.36, 0.78], p.primary, hd, 0.12);
  kRing(frame, [0, 1.18, 0], 0.86, 0.13, 0.62, m.iron, hd, 'z');
  kCyl(frame, [-0.84, 1.18, 0.26], 0.075, 0.075, 0.86, m.brass, hd, 'y', 10);
  const door = group(root, 'VaultDoor', [-0.84, 1.18, 0.26]);
  for (const sy of [-0.3, 0.3]) kBox(door, [0.34, sy, 0.025], [0.68, 0.11, 0.07], m.brass, hd);
  kCyl(door, [0.84, 0, -0.08], 0.76, 0.76, 0.2, p.accent, hd, 'z', 16);
  kCyl(door, [0.84, 0, -0.08], 0.58, 0.58, 0.25, m.iron, hd, 'z', 14);
  kRing(door, [0.84, 0, -0.08], 0.74, 0.09, 0.24, m.brass, hd, 'z');
  kBox(door, [0.84, 0, -0.22], [0.48, 0.48, 0.08], m.iron, hd);
  kCyl(door, [0.84, 0, 0.07], 0.068, 0.078, 0.16, m.brass, hd, 'z', 10);
  const wheel = group(door, 'LockWheel', [0.84, 0, 0.12]);
  kGear(wheel, [0, 0, 0], 0.14, 0.06, 10, m.brass, hd, 'z');
  kRing(wheel, [0, 0, 0.04], 0.38, 0.055, 0.05, p.accent, hd, 'z');
  for (let i = 0; i < 6; i++) kStrut(wheel, [0, 0, 0.04], [Math.cos((i * Math.PI) / 3) * 0.54, Math.sin((i * Math.PI) / 3) * 0.54, 0.04], 0.026, m.brass, hd, 6);
  const sconces = group(root, 'VaultSconces', [0, 1.56, 0.38]);
  for (const s of [-1, 1]) {
    kBox(sconces, [s * 0.94, 0, 0], [0.14, 0.22, 0.06], m.brass, hd);
    kStrut(sconces, [s * 0.94, -0.04, 0.02], [s * 0.94, 0.12, 0.18], 0.024, m.iron, hd, 6);
    kBowl(sconces, [s * 0.94, 0.1, 0.18], 0.04, 0.09, 0.1, 0.1, 0.02, m.brass, hd, 8);
    kCrystal(sconces, [s * 0.94, 0.28, 0.18], 0.065, 0.2, m.flame, hd);
  }
  if (detail) {
    for (let i = 0; i < 12; i++) kOrb(door, [0.84 + Math.cos((i * Math.PI) / 6) * 0.68, Math.sin((i * Math.PI) / 6) * 0.68, 0.055], 0.024, m.brass, hd);
    for (const x of [-0.6, 0, 0.6]) kBox(frame, [x, 2.16, 0.41], [0.36, 0.14, 0.04], m.brass, hd);
  }
  root.animations = [
    new T.AnimationClip('Spin lock wheel', 2.4, [spinTrack('LockWheel', 'z', 2.4, 1)]),
    new T.AnimationClip('Swing vault door', 3.6, [rotationTrack('VaultDoor', 'y', [0, 1.1, 2.5, 3.6], [0, -1.55, -1.55, 0])]),
  ];
}

export function necromancerBoneThrone(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const throne = group(root, 'BoneThroneBase');
  kShell(throne, [0, 0.07, 0], [1.56, 0.14, 1.24], m.stoneDark, hd, 0.2);
  kShell(throne, [0, 0.21, -0.04], [1.28, 0.14, 1.02], p.primary, hd, 0.2);
  kBox(throne, [0, 0.51, -0.02], [0.88, 0.48, 0.72], p.primary, hd);
  kBox(throne, [0, 0.72, -0.02], [0.68, 0.08, 0.52], m.stoneDark, hd);
  kCrystal(throne, [0, 0.76, -0.02], 0.07, 0.14, m.vortex, hd);
  for (const s of [-1, 1]) {
    kBox(throne, [s * 0.48, 0.84, 0], [0.14, 0.36, 0.78], p.primary, hd);
    kOrb(throne, [s * 0.48, 1.04, 0.32], 0.11, p.accent, hd, [0.92, 1.04, 1.05]);
    kBox(throne, [s * 0.48, 0.94, 0.35], [0.12, 0.08, 0.1], p.accent, hd);
    for (const ex of [-0.04, 0.04]) kOrb(throne, [s * 0.48 + ex, 1.04, 0.42], 0.024, m.vortex, hd);
  }
  kBox(throne, [0, 1.46, -0.34], [0.24, 1.42, 0.18], p.primary, hd);
  for (let i = 0; i < 5; i++) {
    const ry = 0.96 + i * 0.22, span = 0.42 + Math.sin((i / 4) * Math.PI) * 0.14;
    for (const s of [-1, 1]) {
      kStrut(throne, [0, ry, -0.34], [s * span, ry + 0.08, -0.24], 0.032, p.accent, hd, 6);
      kStrut(throne, [s * span, ry + 0.08, -0.24], [s * (span * 0.85), ry + 0.22, -0.28], 0.026, m.bone, hd, 6);
    }
  }
  for (const s of [-1, 1]) {
    kStrut(throne, [s * 0.42, 0.98, -0.34], [s * 0.54, 1.88, -0.32], 0.046, p.primary, hd, 8);
    kStrut(throne, [s * 0.54, 1.88, -0.32], [s * 0.3, 2.38, -0.3], 0.034, p.accent, hd, 8);
  }
  kRing(throne, [0, 2.12, -0.34], 0.14, 0.045, 0.09, m.iron, hd, 'y');
  kCyl(throne, [0, 2.22, -0.34], 0.03, 0.045, 0.18, m.iron, hd, 'y', 8);
  const orb = group(root, 'ThroneOrbFinial', [0, 2.32, -0.34]);
  kOrb(orb, [0, 0, 0], 0.13, m.vortex, hd);
  kTorus(orb, [0, 0, 0], 0.2, 0.022, p.accent, hd, 'z');
  for (const s of [-1, 1]) kStrut(orb, [s * 0.11, 0, 0], [s * 0.2, 0, 0], 0.016, m.iron, hd, 6);
  const lid = group(root, 'SeatChestLid', [0, 0.76, -0.32]);
  kBox(lid, [0, 0.03, 0.3], [0.84, 0.06, 0.66], p.primary, hd);
  kShell(lid, [0, 0.09, 0.3], [0.74, 0.075, 0.56], m.cloth, hd, 0.2);
  const braziers = group(root, 'DaisBraziers', [0, 0.14, 0.44]);
  for (const s of [-1, 1]) {
    kCyl(braziers, [s * 0.62, 0.16, 0], 0.1, 0.14, 0.32, m.stoneDark, hd, 'y', 6);
    kBowl(braziers, [s * 0.62, 0.32, 0], 0.1, 0.16, 0.18, 0.12, 0.028, m.iron, hd, 8);
    kCrystal(braziers, [s * 0.62, 0.5, 0], 0.075, 0.22, m.vortex, hd);
  }
  if (detail) {
    for (let i = 0; i < 6; i++) kBox(throne, [0, 0.9 + i * 0.2, -0.45], [0.1, 0.1, 0.07], m.bone, hd);
    for (const x of [-0.32, 0, 0.32]) kBox(throne, [x, 0.5, 0.36], [0.14, 0.28, 0.04], m.bone, hd);
  }
  root.animations = [
    new T.AnimationClip('Spin throne orb', 3.4, [spinTrack('ThroneOrbFinial', 'y', 3.4, 1)]),
    new T.AnimationClip('Open seat chest', 2.8, [rotationTrack('SeatChestLid', 'x', [0, 0.85, 2.0, 2.8], [0, -1.18, -1.18, 0])]),
  ];
}
