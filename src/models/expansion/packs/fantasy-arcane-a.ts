import * as T from 'three';
import { archedVaultLid } from '../../hollow-shells';
import {
  arcanePalette, glassMat, glowMat, group, HPI, kArch, kBowl, kBox, kCandle, kChain, kCrystal, kCyl,
  kFlask, kGear, kOrb, kRing, kShell, kStrut, kTorus, rotationTrack, spinTrack, type Finish,
} from './fantasy-arcane-kit';

export function bubblingAlchemyCauldron(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const brewGlow = glowMat('Emerald brew', '#49e072', '#17a343', 0.9, hd);
  const hearth = group(root, 'CauldronHearth');
  kCyl(hearth, [0, 0.04, 0], 0.66, 0.7, 0.08, m.stoneDark, hd, 'y', 12);
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10;
    kBox(hearth, [Math.cos(a) * 0.58, 0.14, Math.sin(a) * 0.58], [0.26, 0.12, 0.2], i % 2 === 0 ? m.stone : m.stoneDark, hd).rotation.y = -a;
  }
  kCyl(hearth, [0, 0.1, 0], 0.44, 0.48, 0.04, m.woodDark, hd, 'y', 10);
  for (const ang of [0.35, -0.55, 1.35]) kCyl(hearth, [0, 0.15, 0], 0.055, 0.065, 0.68, m.woodDark, hd, 'x', 8).rotation.y = ang;
  for (const [ex, ez, r] of [[-0.14, 0.08, 0.11], [0.12, -0.06, 0.13], [0, 0.14, 0.1], [-0.08, -0.15, 0.095], [0.18, 0.1, 0.09]] as const) {
    kOrb(hearth, [ex, 0.17, ez], r, m.ember, hd, [1.2, 0.65, 1.1]);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.3, fx = Math.cos(a) * 0.43, fz = Math.sin(a) * 0.43;
    kOrb(hearth, [fx, 0.11, fz], 0.075, p.primary, hd, [1.1, 0.7, 1.1]);
    kStrut(hearth, [fx, 0.11, fz], [Math.cos(a) * 0.34, 0.4, Math.sin(a) * 0.34], 0.058, p.primary, hd, 8);
  }
  kBowl(hearth, [0, 0.28, 0], 0.34, 0.54, 0.45, 0.72, 0.065, p.primary, hd, 12);
  kTorus(hearth, [0, 1.0, 0], 0.43, 0.048, m.iron, hd, 'y');
  for (const s of [-1, 1]) {
    kBox(hearth, [s * 0.53, 0.74, 0], [0.09, 0.12, 0.12], m.iron, hd);
    kTorus(hearth, [s * 0.59, 0.66, 0], 0.1, 0.022, m.brass, hd, 'x');
  }
  kCyl(hearth, [0, 0.89, 0], 0.38, 0.36, 0.08, p.accent, hd, 'y', 12);
  kRing(hearth, [0, 0.935, 0], 0.3, 0.075, 0.024, brewGlow, hd, 'y');
  const froth = group(root, 'BrewFroth', [0, 0.93, 0]);
  for (const [bx, by, bz, r] of [[-0.14, 0.03, 0.12, 0.07], [0.16, 0.04, -0.08, 0.085], [-0.04, 0.05, -0.16, 0.065], [0.08, 0.03, 0.17, 0.055], [-0.2, 0.02, -0.05, 0.05]] as const) {
    kOrb(froth, [bx, by, bz], r, brewGlow, hd);
  }
  const ladle = group(root, 'StirringLadle', [0, 0.92, 0]);
  kStrut(ladle, [0.05, -0.14, 0.04], [0.34, 0.56, 0.16], 0.024, m.wood, hd, 8);
  kOrb(ladle, [0.04, -0.12, 0.04], 0.085, m.woodDark, hd, [1.1, 0.75, 1.1]);
  kTorus(ladle, [0.36, 0.58, 0.17], 0.045, 0.012, m.brass, hd, 'z');
  if (detail) {
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12;
      kOrb(hearth, [Math.cos(a) * 0.525, 0.68, Math.sin(a) * 0.525], 0.022, m.brass, hd);
    }
    kRing(hearth, [0, 0.5, 0], 0.515, 0.028, 0.05, m.iron, hd, 'y');
    kOrb(froth, [0.02, 0.07, 0.02], 0.05, p.accent, hd);
  }
  root.animations = [new T.AnimationClip('Stir potion', 3.4, [spinTrack('StirringLadle', 'y', 3.4, 1)])];
}

export function brassArcaneAstrolabe(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const base = group(root, 'AstrolabePedestal');
  kCyl(base, [0, 0.06, 0], 0.52, 0.56, 0.12, p.primary, hd, 'y', 8);
  kCyl(base, [0, 0.17, 0], 0.4, 0.44, 0.1, m.stone, hd, 'y', 8);
  kCyl(base, [0, 0.49, 0], 0.24, 0.28, 0.54, p.primary, hd, 'y', 8);
  kCyl(base, [0, 0.8, 0], 0.36, 0.28, 0.08, p.accent, hd, 'y', 8);
  kCyl(base, [0, 0.88, 0], 0.14, 0.18, 0.08, m.brass, hd, 'y', 10);
  kTorus(base, [0, 1.48, 0], 0.6, 0.036, m.brass, hd, 'z');
  for (const s of [-1, 1]) kCyl(base, [s * 0.6, 1.48, 0], 0.055, 0.055, 0.09, p.accent, hd, 'x', 10);
  const crown = group(root, 'CrownFinial', [0, 2.08, 0]);
  kCyl(crown, [0, 0.06, 0], 0.04, 0.08, 0.12, p.accent, hd, 'y', 8);
  kOrb(crown, [0, 0.15, 0], 0.065, m.brass, hd);
  kCrystal(crown, [0, 0.26, 0], 0.045, 0.16, m.rune, hd);
  const outer = group(root, 'OuterZodiacRing', [0, 1.48, 0]);
  kRing(outer, [0, 0, 0], 0.5, 0.065, 0.1, p.accent, hd, 'z');
  for (const sy of [-1, 1]) kCyl(outer, [0, sy * 0.54, 0], 0.022, 0.022, 0.14, m.brass, hd, 'y', 8);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    kBox(outer, [Math.cos(a) * 0.52, Math.sin(a) * 0.52, 0], [0.04, 0.04, 0.065], m.brass, hd).rotation.z = a;
  }
  const inner = group(outer, 'InnerEclipticRing', [0, 0, 0]);
  kRing(inner, [0, 0, 0], 0.37, 0.052, 0.08, m.brass, hd, 'y');
  for (const sx of [-1, 1]) kCyl(inner, [sx * 0.42, 0, 0], 0.02, 0.02, 0.16, p.accent, hd, 'x', 8);
  kStrut(inner, [0, -0.36, 0], [0, 0.36, 0], 0.018, p.accent, hd, 8);
  kOrb(inner, [0, 0, 0], 0.16, p.primary, hd);
  kTorus(inner, [0, 0, 0], 0.17, 0.016, p.accent, hd, 'y');
  kTorus(inner, [0, 0, 0], 0.17, 0.016, m.rune, hd, 'z');
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      kCyl(base, [Math.cos(a) * 0.26, 0.49, Math.sin(a) * 0.26], 0.032, 0.036, 0.48, m.stone, hd, 'y', 6);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      kOrb(outer, [Math.cos(a) * 0.465, Math.sin(a) * 0.465, 0.058], 0.018, m.rune, hd);
    }
  }
  root.animations = [new T.AnimationClip('Counter-rotate astrolabe', 4.0, [spinTrack('OuterZodiacRing', 'y', 4.0, 1), spinTrack('InnerEclipticRing', 'x', 4.0, -1)])];
}

export function enchantedSpellLectern(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const base = group(root, 'LecternStand');
  kShell(base, [0, 0.06, 0], [0.94, 0.12, 0.82], m.stoneDark, hd, 0.22);
  kShell(base, [0, 0.17, 0], [0.74, 0.1, 0.66], m.stone, hd, 0.22);
  kCyl(base, [0, 0.64, -0.04], 0.16, 0.2, 0.86, m.stone, hd, 'y', 8);
  kCyl(base, [0, 1.07, -0.02], 0.26, 0.18, 0.12, m.stoneDark, hd, 'y', 8);
  for (const s of [-1, 1]) {
    kBox(base, [s * 0.24, 0.66, -0.04], [0.22, 0.56, 0.14], m.stone, hd).rotation.z = s * -0.26;
    kBox(base, [s * 0.36, 0.82, -0.05], [0.2, 0.44, 0.11], m.stoneDark, hd).rotation.z = s * -0.45;
    kStrut(base, [s * 0.2, 0.22, -0.04], [s * 0.4, 0.98, -0.04], 0.042, m.stone, hd, 6);
  }
  const deck = group(base, '', [0, 1.16, 0.03]);
  deck.rotation.x = 0.36;
  kShell(deck, [0, 0, 0], [0.96, 0.07, 0.68], p.primary, hd, 0.14);
  kBox(deck, [0, 0.055, 0.33], [1.0, 0.055, 0.06], p.accent, hd);
  kCyl(deck, [0, 0.06, 0], 0.04, 0.04, 0.52, p.accent, hd, 'z', 8);
  for (const s of [-1, 1]) {
    kBox(deck, [s * 0.21, 0.055, 0], [0.38, 0.028, 0.52], p.primary, hd).rotation.z = s * 0.08;
    kBox(deck, [s * 0.2, 0.085, 0], [0.34, 0.042, 0.46], m.parchment, hd).rotation.z = s * 0.08;
  }
  kBox(deck, [0.06, 0.08, 0.28], [0.05, 0.014, 0.16], m.cloth, hd);
  const page = group(deck, 'TurningPage', [0, 0.11, 0]);
  kBox(page, [0.18, 0.008, 0], [0.33, 0.014, 0.44], m.parchment, hd);
  kBox(page, [0.18, 0.018, 0], [0.24, 0.008, 0.34], p.accent, hd);
  kBox(page, [0.18, 0.024, -0.06], [0.16, 0.006, 0.06], m.rune, hd);
  const sconces = group(root, 'CandleSconces', [0, 1.06, 0]);
  for (const s of [-1, 1]) {
    kStrut(sconces, [s * 0.18, -0.02, -0.02], [s * 0.6, 0.12, 0.02], 0.022, m.iron, hd, 6);
    kCyl(sconces, [s * 0.6, 0.14, 0.02], 0.075, 0.045, 0.05, m.brass, hd, 'y', 10);
    kCandle(sconces, [s * 0.6, 0.16, 0.02], 0.032, 0.22, m.parchment, m.flame, hd);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [-0.24, 0.24]) kBox(deck, [s * 0.38, 0.072, z], [0.06, 0.036, 0.06], p.accent, hd);
      for (let i = 0; i < 3; i++) kBox(base, [s * (0.28 + i * 0.06), 0.56 + i * 0.14, 0.03], [0.08, 0.18, 0.04], m.stoneDark, hd);
    }
    kRing(base, [0, 0.42, -0.04], 0.21, 0.035, 0.06, p.accent, hd, 'y');
  }
  root.animations = [new T.AnimationClip('Turn grimoire page', 2.8, [rotationTrack('TurningPage', 'z', [0, 0.9, 1.9, 2.8], [0, 2.65, 2.65, 0])])];
}

export function toothedMimicChest(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const body = group(root, 'MimicBody');
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.36, 0.36]) kShell(body, [sx, 0.05, sz], [0.2, 0.1, 0.2], m.iron, hd, 0.3);
  kShell(body, [0, 0.34, 0], [1.32, 0.52, 0.86], p.primary, hd, 0.14);
  for (const x of [-0.56, -0.2, 0.2, 0.56]) kBox(body, [x, 0.34, 0], [0.08, 0.48, 0.9], m.iron, hd);
  kShell(body, [0, 0.42, 0.45], [0.22, 0.22, 0.06], m.brass, hd, 0.25);
  kBox(body, [0, 0.59, 0], [1.18, 0.07, 0.72], m.cloth, hd);
  for (let i = 0; i < 7; i++) kCyl(body, [-0.45 + i * 0.15, 0.68, 0.36], 0.008, 0.042, 0.14, m.bone, hd, 'y', 6);
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.14, 0.14]) kCyl(body, [sx, 0.67, sz], 0.008, 0.036, 0.12, m.bone, hd, 'y', 6);
  const tongue = group(root, 'MimicTongue', [0, 0.66, 0.14]);
  for (const [tz, ty, r] of [[0.08, 0.02, 0.11], [0.24, 0.05, 0.095], [0.39, 0.02, 0.08], [0.51, -0.05, 0.065]] as const) {
    kOrb(tongue, [0, ty, tz], r, p.accent, hd, [1.25, 0.65, 1.3]);
  }
  const jaw = group(root, 'MimicJaw', [0, 0.61, -0.43]);
  // Hollow arched half-cylinder chest lid strictly above y = 0 (zero cylinder bottom plunging into MimicBody).
  archedVaultLid(jaw, [0, 0.01, 0.43], 1.32, 0.86, 0.3, 0.085, p.primary, hd);
  for (const x of [-0.56, -0.2, 0.2, 0.56]) {
    archedVaultLid(jaw, [x, 0.005, 0.43], 0.08, 0.9, 0.32, 0.04, m.iron, hd);
  }
  for (const sx of [-0.64, 0.64]) archedVaultLid(jaw, [sx, 0.01, 0.43], 0.05, 0.84, 0.29, 0.28, p.primary, hd);
  for (let i = 0; i < 6; i++) kCyl(jaw, [-0.375 + i * 0.15, -0.05, 0.8], 0.04, 0.008, 0.14, m.bone, hd, 'y', 6);
  for (const [ex, r] of [[-0.28, 0.075], [0, 0.095], [0.28, 0.075]] as const) {
    kOrb(jaw, [ex, 0.2, 0.72], r, m.bone, hd);
    kOrb(jaw, [ex, 0.2, 0.72 + r * 0.72], r * 0.56, m.ember, hd);
    kOrb(jaw, [ex, 0.2, 0.72 + r * 1.1], r * 0.28, p.inset, hd);
  }
  const chains = group(root, 'SideChains', [0, 0.36, 0]);
  for (const s of [-1, 1]) {
    kBox(chains, [s * 0.68, 0.04, 0], [0.06, 0.14, 0.16], m.iron, hd);
    kTorus(chains, [s * 0.72, -0.04, 0], 0.095, 0.022, m.brass, hd, 'x');
  }
  if (detail) {
    for (const x of [-0.56, -0.2, 0.2, 0.56]) {
      for (const y of [0.22, 0.48]) kOrb(body, [x, y, 0.46], 0.022, m.brass, hd);
      kBox(body, [x, 0.58, -0.45], [0.09, 0.14, 0.04], m.brass, hd);
    }
    for (const sx of [-0.58, 0.58]) kCyl(jaw, [sx, -0.04, 0.52], 0.036, 0.008, 0.12, m.bone, hd, 'y', 6);
  }
  root.animations = [new T.AnimationClip('Snap mimic jaw', 2.6, [
    rotationTrack('MimicJaw', 'x', [0, 0.65, 1.3, 1.9, 2.6], [0, -0.95, -0.25, -1.05, 0]),
    rotationTrack('MimicTongue', 'x', [0, 0.65, 1.3, 1.9, 2.6], [0, -0.32, 0.06, -0.38, 0]),
  ])];
}

export function tieredPotionRack(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const rack = group(root, 'PotionRackFrame');
  kShell(rack, [0, 0.07, 0], [1.46, 0.14, 0.76], m.woodDark, hd, 0.14);
  kShell(rack, [0, 0.19, 0], [1.34, 0.1, 0.68], p.primary, hd, 0.14);
  kBox(rack, [0, 1.12, -0.25], [1.18, 1.8, 0.07], m.woodDark, hd);
  for (const s of [-1, 1]) {
    kBox(rack, [s * 0.62, 1.12, 0], [0.1, 1.8, 0.64], p.primary, hd);
    kBox(rack, [s * 0.65, 0.56, 0.265], [0.12, 0.68, 0.16], m.woodDark, hd);
  }
  for (const [y, d, z] of [[0.66, 0.62, 0.02], [1.18, 0.5, -0.04], [1.66, 0.42, -0.08]] as const) {
    kBox(rack, [0, y, z], [1.22, 0.055, d], p.primary, hd);
  }
  kShell(rack, [0, 2.06, -0.06], [1.46, 0.12, 0.64], m.woodDark, hd, 0.16);
  for (const x of [-0.56, 0, 0.56]) kCyl(rack, [x, 2.24, -0.06], 0.015, 0.065, 0.26, m.brass, hd, 'y', 6);
  for (const sx of [-0.28, 0.28]) kArch(rack, [sx, 1.32, 0.14], 0.28, 0.07, 0.12, m.woodDark, hd, 5);
  kBox(rack, [0, 1.18, 0.02], [0.065, 1.0, 0.44], m.woodDark, hd);
  const elixirs = [p.accent, m.flame, m.vortex, m.rune] as const;
  for (const [fx, fy, fz, r, h, c] of [
    [-0.42, 0.69, 0.1, 0.085, 0.16, 0], [-0.2, 0.69, 0.06, 0.075, 0.14, 1], [0.22, 0.69, 0.08, 0.09, 0.18, 2], [0.44, 0.69, 0.06, 0.07, 0.15, 3],
    [-0.38, 1.21, 0, 0.075, 0.15, 2], [-0.16, 1.21, -0.02, 0.07, 0.13, 0], [0.18, 1.21, 0, 0.08, 0.15, 3], [0.4, 1.21, -0.02, 0.07, 0.13, 1],
  ] as const) {
    kFlask(rack, [fx, fy, fz], r, h, elixirs[c], m.glass, m.wood, hd);
  }
  const top = group(root, 'TopAlembics', [0, 1.69, -0.08]);
  kFlask(top, [-0.36, 0, 0], 0.08, 0.14, p.accent, m.glass, m.wood, hd);
  kFlask(top, [0.36, 0, 0], 0.08, 0.14, m.vortex, m.glass, m.wood, hd);
  kOrb(top, [0, 0.11, 0], 0.11, m.copper, hd);
  kStrut(top, [0, 0.2, 0], [0.18, 0.26, 0], 0.022, m.copper, hd, 6);
  const herb = group(root, 'HerbDryRack', [0.67, 1.56, 0]);
  kStrut(herb, [0, 0, 0], [0.46, 0, 0], 0.028, m.woodDark, hd, 6);
  kStrut(herb, [0, -0.28, 0], [0.32, 0, 0], 0.022, m.woodDark, hd, 6);
  for (const [hx, len] of [[0.14, 0.28], [0.28, 0.34], [0.41, 0.25]] as const) {
    kStrut(herb, [hx, 0, 0], [hx, -0.1, 0], 0.012, m.parchment, hd, 6);
    kCyl(herb, [hx, -0.1 - len * 0.45, 0], 0.024, 0.055, len, p.accent, hd, 'y', 6);
  }
  if (detail) {
    for (const x of [-0.3, 0.3]) for (const [y, z] of [[0.66, 0.33], [1.18, 0.21], [1.66, 0.13]] as const) {
      kBox(rack, [x, y, z], [0.18, 0.04, 0.024], m.brass, hd);
    }
    kBowl(rack, [-0.46, 0.24, 0.16], 0.08, 0.11, 0.11, 0.12, 0.025, m.stone, hd, 8);
    kStrut(rack, [-0.46, 0.3, 0.16], [-0.38, 0.44, 0.2], 0.02, m.stoneDark, hd, 6);
  }
  root.animations = [new T.AnimationClip('Swing herb rack', 2.8, [rotationTrack('HerbDryRack', 'y', [0, 0.85, 1.9, 2.8], [0, 1.18, 1.18, 0])])];
}

export function glowingRuneObelisk(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const base = group(root, 'ObeliskMonolith');
  kCyl(base, [0, 0.07, 0], 0.72, 0.76, 0.14, m.stoneDark, hd, 'y', 8);
  kCyl(base, [0, 0.2, 0], 0.56, 0.6, 0.12, p.primary, hd, 'y', 8);
  kCyl(base, [0, 0.31, 0], 0.42, 0.45, 0.1, m.stoneDark, hd, 'y', 8);
  kCyl(base, [0, 1.38, 0], 0.22, 0.34, 2.04, p.primary, hd, 'y', 4).rotation.y = Math.PI / 4;
  kCyl(base, [0, 2.55, 0], 0.012, 0.22, 0.32, m.stoneDark, hd, 'y', 4).rotation.y = Math.PI / 4;
  for (let i = 0; i < 4; i++) {
    const a = i * HPI, fx = Math.sin(a), fz = Math.cos(a);
    kBox(base, [fx * 0.225, 1.12, fz * 0.225], [0.07, 0.78, 0.05], p.accent, hd).rotation.y = a;
    kBox(base, [fx * 0.195, 1.72, fz * 0.195], [0.11, 0.26, 0.05], m.rune, hd).rotation.y = a;
  }
  kRing(base, [0, 2.06, 0], 0.29, 0.09, 0.12, m.brass, hd, 'y');
  const crown = group(root, 'EnergyCrown', [0, 2.06, 0]);
  kRing(crown, [0, 0, 0], 0.56, 0.065, 0.09, m.brass, hd, 'y');
  kTorus(crown, [0, 0.04, 0], 0.56, 0.022, m.rune, hd, 'y');
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    kStrut(crown, [Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25], [Math.cos(a) * 0.54, 0, Math.sin(a) * 0.54], 0.024, m.brass, hd, 6);
    kCrystal(crown, [Math.cos(a) * 0.56, 0.12, Math.sin(a) * 0.56], 0.055, 0.22, p.accent, hd);
  }
  const bollards = group(root, 'WardBollards', [0, 0.14, 0]);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4, bx = Math.cos(a) * 0.6, bz = Math.sin(a) * 0.6;
    kCyl(bollards, [bx, 0.18, bz], 0.065, 0.09, 0.36, m.stoneDark, hd, 'y', 6);
    kCrystal(bollards, [bx, 0.42, bz], 0.05, 0.16, m.rune, hd);
  }
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      kOrb(base, [Math.cos(a) * 0.295, 2.06, Math.sin(a) * 0.295], 0.02, p.accent, hd);
      kBox(base, [Math.cos(a) * 0.51, 0.265, Math.sin(a) * 0.51], [0.1, 0.03, 0.05], m.rune, hd).rotation.y = -a;
    }
  }
  root.animations = [new T.AnimationClip('Spin energy crown', 3.6, [spinTrack('EnergyCrown', 'y', 3.6, 1)])];
}

export function planetaryCrystalOrrery(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const base = group(root, 'OrreryBase');
  kCyl(base, [0, 0.07, 0], 0.68, 0.72, 0.14, p.primary, hd, 'y', 12);
  kCyl(base, [0, 0.24, 0], 0.54, 0.58, 0.2, m.stoneDark, hd, 'y', 12);
  kCyl(base, [0, 0.37, 0], 0.58, 0.56, 0.06, p.accent, hd, 'y', 12);
  kGear(base, [0.22, 0.42, 0.18], 0.16, 0.04, 10, m.brass, hd, 'y');
  kGear(base, [-0.2, 0.42, -0.16], 0.14, 0.04, 8, p.accent, hd, 'y');
  kCyl(base, [0, 0.88, 0], 0.062, 0.092, 0.96, p.accent, hd, 'y', 10);
  kBowl(base, [0, 1.32, 0], 0.07, 0.14, 0.16, 0.12, 0.03, m.brass, hd, 10);
  kOrb(base, [0, 1.48, 0], 0.16, m.flame, hd);
  kTorus(base, [0, 1.48, 0], 0.2, 0.018, p.accent, hd, 'y');
  const inner = group(root, 'InnerOrbitArm', [0, 1.1, 0]);
  kCyl(inner, [0, 0, 0], 0.1, 0.1, 0.07, m.brass, hd, 'y', 10);
  kStrut(inner, [0.06, 0, 0], [0.36, 0, 0], 0.02, m.brass, hd, 6);
  kStrut(inner, [0.36, 0, 0], [0.36, 0.26, 0], 0.018, m.brass, hd, 6);
  kCrystal(inner, [0.36, 0.34, 0], 0.075, 0.18, m.ember, hd);
  const mid = group(root, 'MidOrbitArm', [0, 0.88, 0]);
  kCyl(mid, [0, 0, 0], 0.11, 0.11, 0.07, p.accent, hd, 'y', 10);
  kStrut(mid, [0, 0, 0.06], [0, 0, 0.56], 0.022, p.accent, hd, 6);
  kStrut(mid, [0, 0, 0.56], [0, 0.44, 0.56], 0.02, p.accent, hd, 6);
  kOrb(mid, [0, 0.5, 0.56], 0.095, m.rune, hd);
  kStrut(mid, [-0.16, 0.5, 0.56], [0.16, 0.5, 0.56], 0.014, m.brass, hd, 6);
  kTorus(mid, [0, 0.5, 0.56], 0.16, 0.018, m.brass, hd, 'y');
  const outer = group(root, 'OuterOrbitArm', [0, 0.66, 0]);
  kCyl(outer, [0, 0, 0], 0.12, 0.12, 0.08, m.brass, hd, 'y', 10);
  kStrut(outer, [-0.06, 0, 0], [-0.76, 0, 0], 0.024, m.brass, hd, 6);
  kStrut(outer, [-0.76, 0, 0], [-0.76, 0.66, 0], 0.022, m.brass, hd, 6);
  kOrb(outer, [-0.76, 0.74, 0], 0.125, p.primary, hd);
  kCrystal(outer, [-0.76, 0.74, 0], 0.135, 0.24, m.vortex, hd);
  kStrut(outer, [-0.76, 0.74, 0], [-0.76, 0.74, -0.22], 0.012, m.brass, hd, 6);
  kOrb(outer, [-0.76, 0.74, -0.22], 0.045, m.bone, hd);
  const rail = group(root, 'CompassRail', [0, 0.14, 0]);
  kRing(rail, [0, 0.44, 0], 0.68, 0.05, 0.055, m.brass, hd, 'y');
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4;
    kStrut(rail, [Math.cos(a) * 0.64, 0, Math.sin(a) * 0.64], [Math.cos(a) * 0.65, 0.44, Math.sin(a) * 0.65], 0.024, m.brass, hd, 6);
  }
  if (detail) {
    kStrut(outer, [0.06, 0, 0], [0.28, 0, 0], 0.016, m.brass, hd, 6);
    kOrb(outer, [0.3, 0, 0], 0.05, p.accent, hd);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      kBox(base, [Math.cos(a) * 0.56, 0.405, Math.sin(a) * 0.56], [0.05, 0.025, 0.02], m.stoneDark, hd).rotation.y = -a;
    }
  }
  root.animations = [new T.AnimationClip('Orbit planets', 4.8, [
    spinTrack('InnerOrbitArm', 'y', 4.8, 3), spinTrack('MidOrbitArm', 'y', 4.8, 2), spinTrack('OuterOrbitArm', 'y', 4.8, 1),
  ])];
}

export function ironDragonBrazier(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const stand = group(root, 'BrazierStand');
  kRing(stand, [0, 0.56, 0], 0.26, 0.06, 0.08, m.iron, hd, 'y');
  kRing(stand, [0, 0.28, 0], 0.42, 0.045, 0.05, m.iron, hd, 'y');
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6, cx = Math.cos(a), cz = Math.sin(a);
    kShell(stand, [cx * 0.52, 0.045, cz * 0.52], [0.22, 0.09, 0.22], p.primary, hd, 0.28);
    kStrut(stand, [cx * 0.52, 0.06, cz * 0.52], [cx * 0.22, 0.58, cz * 0.22], 0.048, p.primary, hd, 8);
    kStrut(stand, [cx * 0.22, 0.56, cz * 0.22], [cx * 0.46, 0.96, cz * 0.46], 0.042, m.iron, hd, 8);
  }
  kBowl(stand, [0, 0.64, 0], 0.22, 0.44, 0.56, 0.46, 0.065, p.primary, hd, 12);
  kTorus(stand, [0, 1.1, 0], 0.54, 0.044, m.iron, hd, 'y');
  kOrb(stand, [0, 0.95, 0], 0.36, m.woodDark, hd, [1, 0.42, 1]);
  for (const [ex, ez, r] of [[-0.16, 0.1, 0.11], [0.14, -0.1, 0.12], [0.02, 0.18, 0.1], [-0.1, -0.16, 0.1]] as const) {
    kOrb(stand, [ex, 1.03, ez], r, m.ember, hd, [1.2, 0.65, 1.1]);
  }
  const horns = group(root, 'DragonHorns', [0, 1.1, 0]);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const h = group(horns, '', [Math.cos(a) * 0.54, 0, Math.sin(a) * 0.54]);
    h.rotation.y = -a;
    kStrut(h, [0, -0.04, 0], [0.16, 0.22, 0], 0.042, p.primary, hd, 6);
    kStrut(h, [0.16, 0.22, 0], [0.05, 0.48, 0], 0.028, m.iron, hd, 6);
    kBox(h, [0.12, 0.24, 0], [0.09, 0.2, 0.036], p.accent, hd).rotation.z = 0.24;
  }
  const flames = group(root, 'FlameCrown', [0, 1.0, 0]);
  kCrystal(flames, [0, 0.3, 0], 0.16, 0.62, m.flame, hd);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const tongue = kCrystal(flames, [Math.cos(a) * 0.14, 0.22, Math.sin(a) * 0.14], 0.095, 0.44, i % 2 === 0 ? p.accent : m.ember, hd);
    tongue.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22);
  }
  if (detail) {
    for (let i = 0; i < 3; i++) {
      const a0 = (i * Math.PI * 2) / 3 + Math.PI / 6, a1 = ((i + 1) * Math.PI * 2) / 3 + Math.PI / 6;
      kChain(stand, [Math.cos(a0) * 0.36, 0.42, Math.sin(a0) * 0.36], [Math.cos(a1) * 0.36, 0.42, Math.sin(a1) * 0.36], 0.035, 0.011, m.brass, hd);
    }
    for (let i = 0; i < 9; i++) kOrb(stand, [Math.cos((i * Math.PI * 2) / 9) * 0.49, 0.9, Math.sin((i * Math.PI * 2) / 9) * 0.49], 0.024, m.brass, hd);
  }
  root.animations = [new T.AnimationClip('Swirl dragonfire', 2.4, [
    spinTrack('FlameCrown', 'y', 2.4, 1),
    new T.VectorKeyframeTrack('FlameCrown.scale', [0, 0.6, 1.2, 1.8, 2.4], [1, 1, 1, 1.08, 1.18, 1.08, 0.95, 0.9, 0.95, 1.06, 1.15, 1.06, 1, 1, 1]),
  ])];
}

export function runicAnvilForge(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const forge = group(root, 'AnvilDais');
  kShell(forge, [0, 0.06, 0], [1.62, 0.12, 1.06], m.stoneDark, hd, 0.14);
  kShell(forge, [0.16, 0.16, 0], [1.04, 0.08, 0.84], m.stone, hd, 0.16);
  kCyl(forge, [0.16, 0.4, 0], 0.3, 0.34, 0.42, m.stoneDark, hd, 'y', 8);
  for (const y of [0.3, 0.5]) kRing(forge, [0.16, y, 0], 0.33, 0.032, 0.05, m.iron, hd, 'y');
  kShell(forge, [0.16, 0.64, 0], [0.56, 0.12, 0.36], p.primary, hd, 0.18);
  kBox(forge, [0.16, 0.78, 0], [0.4, 0.18, 0.24], p.primary, hd);
  kShell(forge, [0.16, 0.95, 0], [0.64, 0.18, 0.3], p.primary, hd, 0.12);
  kCyl(forge, [0.62, 0.97, 0], 0.025, 0.115, 0.34, p.primary, hd, 'x', 10);
  kBox(forge, [-0.22, 0.96, 0], [0.16, 0.12, 0.22], m.iron, hd);
  for (const sz of [-1, 1]) {
    kBox(forge, [0.16, 0.78, sz * 0.14], [0.24, 0.08, 0.036], p.accent, hd);
    kBox(forge, [0.16, 0.95, sz * 0.17], [0.38, 0.045, 0.032], m.ember, hd);
  }
  kCyl(forge, [0.16, 0.56, -0.34], 0.065, 0.085, 0.84, m.brass, hd, 'y', 8);
  kCyl(forge, [0.16, 0.98, -0.34], 0.08, 0.08, 0.18, m.iron, hd, 'x', 10);
  const arm = group(root, 'SmithHammerArm', [0.16, 0.98, -0.34]);
  kStrut(arm, [0, 0, 0], [0, 0.14, 0.42], 0.032, m.wood, hd, 8);
  kShell(arm, [0, 0.16, 0.44], [0.16, 0.22, 0.16], p.primary, hd, 0.22);
  kBox(arm, [0, 0.16, 0.44], [0.19, 0.07, 0.19], p.accent, hd);
  const trough = group(root, 'QuenchTrough', [-0.54, 0.12, 0]);
  kShell(trough, [0, 0.24, 0], [0.46, 0.48, 0.72], m.stone, hd, 0.12);
  kBox(trough, [0, 0.49, 0], [0.34, 0.04, 0.58], m.glass, hd).castShadow = false;
  for (const y of [0.16, 0.38]) kBox(trough, [0, y, 0], [0.5, 0.045, 0.76], m.iron, hd);
  for (const tx of [0.14, 0.22]) kStrut(trough, [tx, 0.5, -0.18], [0.3, 0.62, 0.24], 0.016, m.iron, hd, 6);
  kBox(trough, [0.32, 0.64, 0.27], [0.1, 0.05, 0.14], m.ember, hd);
  if (detail) {
    for (const x of [-0.2, 0.16, 0.52]) kBox(forge, [x, 0.16, 0.44], [0.18, 0.06, 0.032], m.brass, hd);
    kBox(forge, [0.32, 1.06, 0], [0.2, 0.045, 0.08], m.ember, hd);
    for (const s of [-1, 1]) kOrb(forge, [0.16 + s * 0.11, 0.98, -0.34], 0.036, m.brass, hd);
  }
  root.animations = [new T.AnimationClip('Strike anvil', 2.0, [rotationTrack('SmithHammerArm', 'x', [0, 0.45, 0.75, 1.3, 2.0], [0, -0.58, 0.12, -0.45, 0])])];
}

export function stonePortalArchway(root: T.Group, p: Finish, detail: boolean): void {
  const hd = p.hd, m = arcanePalette(p);
  const veil = glassMat('Portal veil', '#8d66ff', 0.34);
  const arch = group(root, 'PortalFrame');
  kShell(arch, [0, 0.08, 0], [2.32, 0.16, 0.96], m.stoneDark, hd, 0.14);
  kShell(arch, [0, 0.22, 0], [2.04, 0.12, 0.8], p.primary, hd, 0.14);
  for (const s of [-1, 1]) {
    kShell(arch, [s * 0.82, 0.38, 0], [0.5, 0.2, 0.64], m.stoneDark, hd, 0.14);
    kBox(arch, [s * 0.82, 1.04, 0], [0.42, 1.18, 0.56], p.primary, hd);
    kShell(arch, [s * 0.82, 1.66, 0], [0.52, 0.16, 0.64], m.stoneDark, hd, 0.14);
    for (const sz of [-1, 1]) {
      kBox(arch, [s * 0.82, 1.04, sz * 0.305], [0.12, 0.92, 0.045], p.accent, hd);
      kBox(arch, [s * 0.82, 1.04, sz * 0.335], [0.055, 0.72, 0.03], m.vortex, hd);
    }
  }
  kArch(arch, [0, 1.66, 0], 0.82, 0.34, 0.56, p.primary, hd, 9, m.stoneDark);
  kCrystal(arch, [0, 2.52, 0.34], 0.085, 0.24, p.accent, hd);
  kBox(arch, [0, 1.34, -0.26], [1.62, 0.16, 0.14], m.stoneDark, hd);
  kCyl(arch, [0, 1.34, -0.1], 0.14, 0.16, 0.26, m.brass, hd, 'z', 10);
  const vortex = group(root, 'PortalVortex', [0, 1.34, 0.02]);
  kCyl(vortex, [0, 0, 0], 0.68, 0.68, 0.04, veil, hd, 'z', 16).castShadow = false;
  kRing(vortex, [0, 0, 0], 0.66, 0.07, 0.075, p.accent, hd, 'z');
  kOrb(vortex, [0, 0, 0], 0.14, m.vortex, hd, [1, 1, 0.7]);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    kBox(vortex, [Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0], [0.46, 0.075, 0.075], i % 2 === 0 ? m.vortex : m.rune, hd).rotation.z = a + 0.32;
  }
  const braziers = group(root, 'PortalBrazierPair', [0, 0.16, 0.26]);
  for (const s of [-1, 1]) {
    kCyl(braziers, [s * 1.02, 0.18, 0], 0.12, 0.15, 0.36, m.stoneDark, hd, 'y', 8);
    kBowl(braziers, [s * 1.02, 0.35, 0], 0.11, 0.18, 0.2, 0.14, 0.03, m.iron, hd, 8);
    kCrystal(braziers, [s * 1.02, 0.56, 0], 0.085, 0.24, m.vortex, hd);
  }
  if (detail) {
    for (const s of [-1, 1]) for (const y of [0.64, 1.04, 1.44]) kBox(arch, [s * 1.05, y, 0], [0.06, 0.22, 0.36], m.stone, hd);
    kBox(arch, [0, 0.22, 0.42], [1.2, 0.05, 0.035], m.rune, hd);
  }
  root.animations = [new T.AnimationClip('Swirl portal vortex', 3.6, [spinTrack('PortalVortex', 'z', 3.6, 1)])];
}
