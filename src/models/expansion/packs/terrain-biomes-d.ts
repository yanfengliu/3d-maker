import * as T from 'three';
import { group } from '../../parts';
import type { Finish, Point } from '../../parts';
import {
  block,
  cone,
  crystalPrism,
  crystalTone,
  cyl,
  lathe,
  mound,
  orb,
  rock,
  spin,
  sway,
  taperArc,
  tone,
  waterTone,
  type BiomeBuilderDef,
} from './terrain-biomes-kit';

function buildCypressSwamp(root: T.Group, p: Finish, detail: boolean) {
  const bayou = waterTone(p, 'Murky bayou water', '#366b63', '#153833');
  const peat = tone(p, 'Boggy peat hummock', '#4d4638', 0.9);
  const bark = tone(p, 'Bald cypress bark', '#6e5e50', 0.88);
  const duckweed = tone(p, 'Bayou duckweed', '#6a8c44', 0.8);
  const foliageDeep = tone(p, 'Cypress shade canopy', '#365432', 0.82);

  const swamp = group(root, 'CypressSwamp');
  cyl(swamp, p, [0, 0.05, 0], 1.52, 1.54, 0.1, bayou, [0, 0, 0], 18);
  mound(swamp, p, [0, 0.03, 0], 1.08, 0.28, 1.02, peat);

  lathe(
    swamp,
    p,
    [-0.08, 0.08, -0.06],
    [[0.01, 0], [0.56, 0], [0.46, 0.34], [0.32, 0.84], [0.24, 1.48], [0.18, 2.26], [0.01, 2.3]],
    bark,
    14,
  );
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.15;
    const sx = Math.sin(a);
    const sz = Math.cos(a);
    taperArc(
      swamp,
      p,
      [[-0.08 + sx * 0.26, 0.88, -0.06 + sz * 0.26], [-0.08 + sx * 0.56, 0.36, -0.06 + sz * 0.56], [-0.08 + sx * 0.78, 0.12, -0.06 + sz * 0.78]],
      t => 0.12 * (1 - 0.5 * t),
      bark,
      7,
      6,
    );
  }
  const boughs: readonly Point[] = [
    [0.86, 2.18, 0.24], [-0.88, 2.12, 0.18], [0.28, 2.24, -0.78], [-0.42, 2.16, -0.68], [0.12, 2.08, 0.74],
  ];
  for (const end of boughs) {
    taperArc(swamp, p, [[-0.08, 1.96, -0.06], [(end[0] - 0.08) * 0.55, 2.14, (end[2] - 0.06) * 0.55], end], t => 0.095 * (1 - 0.52 * t), bark, 8, 6);
  }
  const canopy: readonly [Point, Point, boolean][] = [
    [[-0.06, 2.66, -0.04], [0.96, 0.3, 0.88], false],
    [[0.68, 2.38, 0.22], [0.72, 0.26, 0.64], true],
    [[-0.72, 2.34, 0.16], [0.7, 0.25, 0.62], false],
    [[0.22, 2.42, -0.64], [0.66, 0.25, 0.6], true],
    [[-0.36, 2.36, -0.58], [0.62, 0.24, 0.56], false],
    [[0.1, 2.28, 0.62], [0.62, 0.24, 0.56], true],
  ];
  for (const [at, sc, dark] of canopy) {
    orb(swamp, p, at, sc, dark ? foliageDeep : p.primary, 9);
  }

  for (let i = 0; i < 9; i++) {
    const a = (i * Math.PI * 2) / 9 + 0.3;
    const rad = 0.62 + (i % 3) * 0.24;
    const kh = 0.26 + (i % 3) * 0.12;
    cone(swamp, p, [Math.sin(a) * rad, kh * 0.5 + 0.07, Math.cos(a) * rad], 0.068, kh, bark, [0, a, 0], 7);
  }

  const drapes = group(swamp, 'MossDrapes', [-0.08, 2.16, -0.06]);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12;
    const rad = 0.42 + (i % 3) * 0.26;
    const len = 0.64 + (i % 4) * 0.18;
    const mx = Math.sin(a) * rad;
    const mz = Math.cos(a) * rad;
    taperArc(
      drapes,
      p,
      [[mx, 0.16, mz], [mx * 1.04, -len * 0.45, mz * 1.04], [mx * 0.98, -len, mz * 0.98]],
      t => 0.068 * (1 - 0.58 * t),
      p.accent,
      7,
      5,
      [0.45, 1],
    );
  }

  const stump = group(swamp, 'SwampStump', [0.92, 0.05, 0.52]);
  lathe(stump, p, [0, 0, 0], [[0.01, 0], [0.28, 0], [0.22, 0.26], [0.2, 0.52], [0.12, 0.52], [0.1, 0.38], [0.01, 0.38]], bark, 10);
  cone(stump, p, [-0.26, 0.16, 0.14], 0.055, 0.28, bark, [0, 0.4, 0], 6);
  cone(stump, p, [0.22, 0.14, -0.18], 0.05, 0.24, bark, [0, 1.2, 0], 6);

  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = i * 0.78 + 0.4;
      const rad = 1.02 + (i % 2) * 0.22;
      cyl(swamp, p, [Math.sin(a) * rad, 0.106, Math.cos(a) * rad], 0.13, 0.13, 0.022, duckweed, [0, a, 0], 8);
    }
    for (let i = 0; i < 4; i++) {
      const a = 2.4 + i * 0.45;
      cone(swamp, p, [Math.sin(a) * 0.94, 0.34, Math.cos(a) * 0.9], 0.03, 0.48, duckweed, [0.1, a, 0], 6);
    }
  }
  root.animations = [new T.AnimationClip('Bayou drift', 4.6, [sway('MossDrapes', 'z', 4.6, -0.18, 0.18)])];
}

function buildCedarBonsai(root: T.Group, p: Finish, detail: boolean) {
  const mossBase = tone(p, 'Velvet cushion moss', '#5a8c44', 0.88);
  const crag = tone(p, 'Windswept crag slate', '#596066', 0.86);
  const cragDark = tone(p, 'Crag shadow rock', '#42484e', 0.88);
  const jin = tone(p, 'Bleached jin driftwood', '#bfb29e', 0.82);
  const cedarDark = tone(p, 'Cedar shade foliage', '#2d5932', 0.82);

  const bonsai = group(root, 'CedarBonsai');
  mound(bonsai, p, [0, 0, 0], 1.32, 0.24, 1.2, mossBase);

  rock(bonsai, p, [-0.26, 0.08, -0.06], [0.64, 0.84, 0.56], crag, 1.6);
  rock(bonsai, p, [-0.14, 0.56, -0.12], [0.48, 0.64, 0.44], cragDark, 3.2);
  rock(bonsai, p, [-0.56, 0.1, 0.24], [0.36, 0.44, 0.34], crag, 4.7);
  rock(bonsai, p, [0.22, 0.1, -0.34], [0.34, 0.38, 0.3], cragDark, 5.8);

  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.25;
    const sx = Math.sin(a);
    const sz = Math.cos(a);
    taperArc(
      bonsai,
      p,
      [[-0.18 + sx * 0.14, 1.18, -0.08 + sz * 0.14], [-0.22 + sx * 0.46, 0.68, -0.06 + sz * 0.42], [-0.24 + sx * 0.68, 0.16, -0.04 + sz * 0.62]],
      t => 0.072 * (1 - 0.35 * t),
      p.accent,
      9,
      6,
    );
  }
  taperArc(
    bonsai,
    p,
    [[-0.18, 1.12, -0.08], [0.12, 1.48, -0.02], [0.22, 1.66, 0.04], [-0.04, 1.98, 0.06]],
    t => 0.14 * (1 - 0.48 * t),
    p.accent,
    11,
    7,
  );
  taperArc(bonsai, p, [[-0.08, 1.38, -0.04], [-0.42, 1.56, 0.12], [-0.62, 1.64, 0.18]], t => 0.055 * (1 - 0.65 * t), jin, 7, 5);

  const pads = group(bonsai, 'BonsaiPads', [0.16, 1.56, 0]);
  const padSpecs: readonly [Point, Point, boolean][] = [
    [[-0.22, 0.64, 0.04], [0.58, 0.18, 0.48], false],
    [[0.46, 0.34, 0.16], [0.56, 0.17, 0.44], false],
    [[-0.64, 0.22, -0.14], [0.52, 0.16, 0.42], true],
    [[0.18, 0.14, -0.44], [0.48, 0.15, 0.38], true],
    [[0.68, 0.04, -0.08], [0.46, 0.15, 0.38], false],
    [[-0.36, 0.44, 0.38], [0.44, 0.14, 0.36], true],
  ];
  for (const [at, sc, dark] of padSpecs) {
    taperArc(pads, p, [[0, 0.02, 0], [at[0] * 0.55, at[1] * 0.6, at[2] * 0.55], [at[0], at[1] - 0.04, at[2]]], t => 0.058 * (1 - 0.48 * t), p.accent, 6, 5);
    orb(pads, p, at, sc, dark ? cedarDark : p.primary, 9);
  }

  const accentRock = group(bonsai, 'AccentMossRock', [0.84, 0.06, 0.44]);
  rock(accentRock, p, [0, 0, 0], [0.3, 0.24, 0.26], crag, 2.9);
  orb(accentRock, p, [0.02, 0.25, -0.02], [0.22, 0.075, 0.18], mossBase, 7);

  if (detail) {
    for (const [mx, my, mz] of [[-0.56, 0.62, 0.22], [0.2, 0.56, -0.34], [-0.42, 0.94, -0.18]] as const) {
      orb(bonsai, p, [mx, my, mz], [0.2, 0.065, 0.18], mossBase, 6);
    }
    for (let i = 0; i < 4; i++) {
      const a = i * 1.55 + 0.5;
      rock(bonsai, p, [Math.sin(a) * 0.88, 0.1, Math.cos(a) * 0.8], [0.1, 0.06, 0.09], cragDark, i + 4.1);
    }
  }
  root.animations = [new T.AnimationClip('Mountain breeze', 4.4, [sway('BonsaiPads', 'z', 4.4, -0.11, 0.11)])];
}

function buildQuartzOutcrop(root: T.Group, p: Finish, detail: boolean) {
  const granite = tone(p, 'Dark granite bed', '#3d414a', 0.88, 0.06, undefined, true);
  const gneiss = tone(p, 'Mineral gneiss shelf', '#575c68', 0.84, 0.08, undefined, true);
  const frostQuartz = crystalTone(p, 'Frosted milky quartz', '#d4c4f5', '#62508f');
  const pyrite = tone(p, 'Mineral pyrite cube', '#c9a64c', 0.34, 0.55, undefined, true);

  const outcrop = group(root, 'QuartzOutcrop');
  mound(outcrop, p, [0, 0, 0], 1.4, 0.26, 1.34, granite);
  rock(outcrop, p, [-0.42, 0.08, -0.26], [0.64, 0.44, 0.56], granite, 1.4);
  rock(outcrop, p, [0.46, 0.08, -0.22], [0.58, 0.4, 0.52], gneiss, 2.7);
  rock(outcrop, p, [0, 0.12, 0.22], [0.62, 0.36, 0.54], granite, 3.8);
  cyl(outcrop, p, [0, 0.38, 0], 0.48, 0.58, 0.4, gneiss, [0, 0.3, 0], 6);

  const prisms: readonly [Point, number, number, Point, boolean][] = [
    [[-0.48, 0.36, -0.14], 0.22, 1.42, [0.18, 0.4, 0.32], false],
    [[0.46, 0.34, -0.16], 0.2, 1.34, [0.14, -0.3, -0.34], true],
    [[-0.12, 0.34, -0.46], 0.22, 1.48, [-0.34, 0.2, 0.12], false],
    [[0.16, 0.32, 0.44], 0.19, 1.18, [0.36, -0.2, -0.14], false],
    [[-0.44, 0.24, 0.36], 0.16, 0.96, [0.34, 0.5, 0.36], true],
    [[0.48, 0.24, 0.32], 0.15, 0.88, [0.32, -0.5, -0.34], false],
    [[-0.68, 0.18, -0.36], 0.14, 0.82, [-0.28, 0.3, 0.42], true],
    [[0.62, 0.18, -0.44], 0.14, 0.78, [-0.32, -0.4, -0.38], false],
  ];
  for (const [at, r, h, rot, pale] of prisms) {
    crystalPrism(outcrop, p, at, r, h, pale ? frostQuartz : p.primary, rot);
  }

  const crest = group(outcrop, 'CrystalCrest', [0, 0.56, 0]);
  cyl(crest, p, [0, 0.06, 0], 0.3, 0.36, 0.22, gneiss, [0, 0, 0], 6);
  crystalPrism(crest, p, [0, 0.08, 0], 0.26, 1.92, p.accent, [0.02, 0.2, -0.02]);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    crystalPrism(
      crest,
      p,
      [Math.sin(a) * 0.18, 0.1, Math.cos(a) * 0.18],
      0.11,
      0.92 + (i % 2) * 0.26,
      i % 2 === 0 ? p.primary : p.accent,
      [0.34 * Math.cos(a), a, -0.34 * Math.sin(a)],
    );
  }

  const side = group(outcrop, 'SideMatrix', [0.92, 0.06, 0.48]);
  rock(side, p, [0, 0, 0], [0.36, 0.24, 0.32], granite, 5.2);
  crystalPrism(side, p, [0, 0.16, 0], 0.12, 0.68, p.primary, [0.12, 0.3, -0.2]);
  crystalPrism(side, p, [0.14, 0.14, 0.08], 0.085, 0.46, p.accent, [0.24, 0, -0.34]);
  crystalPrism(side, p, [-0.12, 0.14, -0.06], 0.08, 0.42, frostQuartz, [-0.2, 0.4, 0.28]);

  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.5;
      block(outcrop, p, [Math.sin(a) * 0.72, 0.32 + (i % 2) * 0.12, Math.cos(a) * 0.66], [0.09, 0.09, 0.09], pyrite, [0.2, a, 0.3]);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.25;
      crystalPrism(crest, p, [Math.sin(a) * 0.26, 0.12, Math.cos(a) * 0.26], 0.055, 0.42, frostQuartz, [0.55 * Math.cos(a), a, -0.55 * Math.sin(a)]);
    }
  }
  root.animations = [new T.AnimationClip('Prismatic turn', 5.2, [spin('CrystalCrest', 'y', 5.2, 1)])];
}

function buildZenGarden(root: T.Group, p: Finish, detail: boolean) {
  const cedar = tone(p, 'Aged cedar timber', '#6b4c36', 0.84);
  const stone = tone(p, 'Zen standing stone', '#646a6c', 0.86);
  const moss = tone(p, 'Zen velvet moss', '#4f7d42', 0.88);
  const bark = tone(p, 'Bonsai maple bark', '#4a372d', 0.86);
  const bamboo = tone(p, 'Zen rake bamboo', '#b5985a', 0.78);
  const bronze = tone(p, 'Corner brass cap', '#a6894c', 0.42, 0.38);

  const garden = group(root, 'ZenGarden');
  block(garden, p, [0, 0.08, 0], [2.76, 0.16, 2.26], cedar);
  block(garden, p, [0, 0.21, -1.07], [2.8, 0.16, 0.14], cedar);
  block(garden, p, [0, 0.21, 1.07], [2.8, 0.16, 0.14], cedar);
  block(garden, p, [-1.33, 0.21, 0], [0.14, 0.16, 2.02], cedar);
  block(garden, p, [1.33, 0.21, 0], [0.14, 0.16, 2.02], cedar);

  block(garden, p, [0, 0.185, 0], [2.48, 0.09, 1.98], p.primary);
  for (let i = -3; i <= 3; i++) {
    cyl(garden, p, [0, 0.23, i * 0.25], 0.028, 0.028, 2.38, p.primary, [0, 0, Math.PI / 2], 7);
  }
  for (const [cx, cz, r] of [[-0.56, -0.26, 0.46], [-0.56, -0.26, 0.62], [0.64, 0.32, 0.36]] as const) {
    const pts: Point[] = [];
    for (let k = 0; k <= 10; k++) {
      const a = (k * Math.PI * 2) / 10;
      pts.push([cx + Math.sin(a) * r, 0.235, cz + Math.cos(a) * r]);
    }
    taperArc(garden, p, pts, 0.026, p.primary, 12, 5);
  }

  orb(garden, p, [-0.44, 0.24, -0.32], [0.56, 0.07, 0.44], moss, 9);
  orb(garden, p, [0.64, 0.24, 0.32], [0.34, 0.06, 0.28], moss, 8);
  rock(garden, p, [-0.54, 0.22, -0.26], [0.3, 0.72, 0.26], stone, 1.9);
  rock(garden, p, [-0.14, 0.22, -0.44], [0.24, 0.46, 0.22], stone, 3.4);
  rock(garden, p, [0.64, 0.22, 0.32], [0.28, 0.28, 0.22], stone, 5.1);

  const maple = group(garden, 'ZenMaple', [-0.86, 0.24, -0.42]);
  taperArc(maple, p, [[0, 0, 0], [0.14, 0.46, 0.08], [0.28, 0.94, 0.16], [0.18, 1.24, 0.12]], t => 0.088 * (1 - 0.52 * t), bark, 9, 6);
  taperArc(maple, p, [[0.14, 0.58, 0.08], [-0.18, 0.86, -0.14], [-0.32, 1.04, -0.2]], t => 0.055 * (1 - 0.5 * t), bark, 6, 5);
  orb(maple, p, [0.18, 1.26, 0.12], [0.46, 0.2, 0.4], p.accent, 8);
  orb(maple, p, [-0.28, 1.06, -0.18], [0.38, 0.17, 0.34], p.accent, 8);
  orb(maple, p, [0.44, 0.98, 0.24], [0.34, 0.16, 0.3], p.accent, 7);

  const rake = group(garden, 'GardenRake', [0.98, 0.23, 0.68]);
  rake.rotation.y = -0.35;
  cyl(rake, p, [0.18, 0.24, 0.18], 0.022, 0.022, 0.98, bamboo, [0.68, 0, -0.58], 7);
  block(rake, p, [-0.08, 0.06, -0.06], [0.06, 0.06, 0.46], bamboo);
  for (let i = -2; i <= 2; i++) {
    cyl(rake, p, [-0.08, 0.01, -0.06 + i * 0.095], 0.012, 0.015, 0.1, bamboo, [0, 0, 0], 6);
  }

  if (detail) {
    for (const sx of [-1.33, 1.33]) {
      for (const sz of [-1.07, 1.07]) {
        block(garden, p, [sx, 0.31, sz], [0.18, 0.04, 0.18], bronze);
      }
    }
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25;
      rock(garden, p, [-0.42 + Math.sin(a) * 0.34, 0.25, -0.32 + Math.cos(a) * 0.26], [0.065, 0.045, 0.06], stone, i + 2.2);
    }
  }
  root.animations = [new T.AnimationClip('Zen breeze', 4.4, [sway('ZenMaple', 'z', 4.4, -0.14, 0.14)])];
}

function buildLavenderTerrace(root: T.Group, p: Finish, detail: boolean) {
  const soil = tone(p, 'Provençal earth', '#9e7b56', 0.9);
  const limestone = tone(p, 'Dry-stone limestone', '#c9bc9e', 0.88);
  const deepViolet = tone(p, 'Deep lavender spike', '#62409e', 0.78);
  const oliveBark = tone(p, 'Gnarled olive trunk', '#7d6e5c', 0.86);
  const silverLeaf = tone(p, 'Silvery olive leaf', '#8ea378', 0.8);
  const wicker = tone(p, 'Harvest wicker', '#c49a56', 0.84);

  const terrace = group(root, 'LavenderTerrace');
  mound(terrace, p, [0, 0, 0], 1.54, 0.24, 1.46, soil);
  mound(terrace, p, [0, 0.14, -0.24], 1.38, 0.42, 1.06, soil);
  mound(terrace, p, [-0.14, 0.38, -0.56], 1.08, 0.46, 0.74, soil);

  for (let i = 0; i < 8; i++) {
    const a = -1.05 + i * 0.3;
    rock(terrace, p, [Math.sin(a) * 1.28, 0.12 + (i % 2) * 0.02, -0.12 + Math.cos(a) * 0.96], [0.24, 0.22, 0.2], limestone, i + 1.1);
  }
  for (let i = 0; i < 6; i++) {
    const a = -0.95 + i * 0.38;
    rock(terrace, p, [-0.12 + Math.sin(a) * 1.02, 0.38 + (i % 2) * 0.02, -0.52 + Math.cos(a) * 0.68], [0.22, 0.24, 0.18], limestone, i + 4.3);
  }
  for (let i = 0; i < 3; i++) {
    block(terrace, p, [0.96 - i * 0.12, 0.24 + i * 0.2, 0.26 - i * 0.32], [0.38, 0.12, 0.28], limestone, [0, 0.22, 0]);
  }

  const rows: readonly [number, number, number, number][] = [
    [-0.78, 0.2, 0.78, 5],
    [-0.84, 0.46, 0.22, 5],
    [-0.64, 0.74, -0.18, 4],
  ];
  for (let r = 0; r < rows.length; r++) {
    const [x0, y0, z0, count] = rows[r] ?? [0, 0.2, 0, 4];
    for (let k = 0; k < count; k++) {
      const bx = x0 + k * 0.34;
      const bz = z0 + (k % 2) * 0.04;
      orb(terrace, p, [bx, y0 + 0.08, bz], [0.16, 0.12, 0.15], p.accent, 7);
      for (let s = 0; s < 4; s++) {
        const a = (s * Math.PI) / 2 + k * 0.6;
        cone(
          terrace,
          p,
          [bx + Math.sin(a) * 0.08, y0 + 0.24, bz + Math.cos(a) * 0.07],
          0.036,
          0.26,
          (k + s) % 3 === 0 ? deepViolet : p.primary,
          [0.08 * Math.cos(a), a, -0.08 * Math.sin(a)],
          6,
        );
      }
    }
  }

  taperArc(
    terrace,
    p,
    [[-0.46, 0.72, -0.6], [-0.34, 1.18, -0.54], [-0.44, 1.66, -0.56]],
    t => 0.17 * (1 - 0.38 * t),
    oliveBark,
    10,
    7,
  );
  for (const end of [[-0.04, 1.88, -0.34], [-0.88, 1.84, -0.44], [-0.38, 1.9, -0.92]] as readonly Point[]) {
    taperArc(terrace, p, [[-0.42, 1.44, -0.56], [(end[0] - 0.42) * 0.5, 1.72, (end[2] - 0.56) * 0.5], end], t => 0.085 * (1 - 0.45 * t), oliveBark, 7, 5);
  }
  const crown = group(terrace, 'OliveCrown', [-0.44, 1.66, -0.56]);
  const puffs: readonly [Point, Point, boolean][] = [
    [[0, 0.54, 0], [0.76, 0.36, 0.7], false],
    [[0.46, 0.28, 0.26], [0.58, 0.3, 0.52], true],
    [[-0.48, 0.26, 0.14], [0.56, 0.28, 0.5], false],
    [[0.08, 0.3, -0.46], [0.54, 0.28, 0.48], true],
    [[-0.28, 0.68, -0.14], [0.46, 0.24, 0.42], true],
  ];
  for (const [at, sc, pale] of puffs) {
    orb(crown, p, at, sc, pale ? silverLeaf : p.accent, 9);
  }

  const basket = group(terrace, 'HarvestBasket', [0.84, 0.18, 0.72]);
  lathe(basket, p, [0, 0, 0], [[0.01, 0], [0.18, 0], [0.24, 0.24], [0.26, 0.32], [0.21, 0.32], [0.19, 0.14], [0.01, 0.14]], wicker, 12);
  taperArc(basket, p, [[-0.22, 0.3, 0], [0, 0.56, 0], [0.22, 0.3, 0]], 0.024, wicker, 8, 5);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    cone(basket, p, [Math.sin(a) * 0.1, 0.36, Math.cos(a) * 0.1], 0.045, 0.24, i % 2 === 0 ? p.primary : deepViolet, [0.32 * Math.cos(a), a, -0.32 * Math.sin(a)], 6);
  }

  if (detail) {
    for (let i = 0; i < 6; i++) {
      const x = -0.82 + i * 0.32;
      cone(terrace, p, [x, 0.48, 0.78], 0.03, 0.22, deepViolet, [0.08, i, 0], 6);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      orb(crown, p, [Math.sin(a) * 0.46, 0.16, Math.cos(a) * 0.42], [0.04, 0.055, 0.04], silverLeaf, 6);
    }
  }
  root.animations = [new T.AnimationClip('Mistral breeze', 4.2, [sway('OliveCrown', 'z', 4.2, -0.12, 0.12)])];
}

export const terrainBiomesBuildersD: readonly BiomeBuilderDef[] = [
  {
    id: 'cypress-swamp-hummock',
    riggedParts: [{ name: 'MossDrapes', label: 'Spanish moss drapes', type: 'rotate', axis: 'z', range: [-15, 15], describe: 'Sways the hanging silvery Spanish moss drapes under the cypress boughs' }],
    detachableParts: [{ name: 'SwampStump', label: 'Weathered swamp stump', describe: 'Removable hollow bayou stump and cypress knees in the shallows' }],
    build: buildCypressSwamp,
  },
  {
    id: 'cedar-bonsai-rock',
    riggedParts: [{ name: 'BonsaiPads', label: 'Cloud-pruned bonsai pads', type: 'rotate', axis: 'z', range: [-10, 10], describe: 'Sways the sculpted horizontal cedar foliage pads atop the crag' }],
    detachableParts: [{ name: 'AccentMossRock', label: 'Companion moss rock', describe: 'Removable accent viewing stone and moss cushion beside the crag' }],
    build: buildCedarBonsai,
  },
  {
    id: 'quartz-crystal-outcrop',
    riggedParts: [{ name: 'CrystalCrest', label: 'Prismatic druzy crest', type: 'rotate', axis: 'y', range: [0, 360], describe: 'Rotates the central seated prismatic druzy quartz crest on its matrix' }],
    detachableParts: [{ name: 'SideMatrix', label: 'Side quartz matrix', describe: 'Removable granite mineral chunk bristling with side crystal points' }],
    build: buildQuartzOutcrop,
  },
  {
    id: 'sand-raked-zen-garden',
    riggedParts: [{ name: 'ZenMaple', label: 'Miniature zen maple', type: 'rotate', axis: 'z', range: [-12, 12], describe: 'Sways the miniature scarlet bonsai maple rising above the raked sand' }],
    detachableParts: [{ name: 'GardenRake', label: 'Wooden sand rake', describe: 'Removable bamboo zen sand rake resting along the timber frame' }],
    build: buildZenGarden,
  },
  {
    id: 'lavender-hillside-terrace',
    riggedParts: [{ name: 'OliveCrown', label: 'Gnarled olive crown', type: 'rotate', axis: 'z', range: [-10, 10], describe: 'Sways the silvery-green olive tree crown above the lavender rows' }],
    detachableParts: [{ name: 'HarvestBasket', label: 'Lavender harvest basket', describe: 'Removable woven wicker basket brimming with cut violet lavender' }],
    build: buildLavenderTerrace,
  },
];
