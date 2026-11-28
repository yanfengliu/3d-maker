import * as T from 'three';
import { group } from '../../parts';
import type { Finish, Point } from '../../parts';
import {
  block,
  bob,
  cone,
  crystalPrism,
  crystalTone,
  cyl,
  frond,
  hexColumn,
  lathe,
  mesaBase,
  mound,
  orb,
  rock,
  sway,
  taperArc,
  tone,
  waterTone,
  type BiomeBuilderDef,
} from './terrain-biomes-kit';

function buildCoralReef(root: T.Group, p: Finish, detail: boolean) {
  const limestone = tone(p, 'Seabed limestone', '#c9bfa6', 0.88);
  const brainGold = tone(p, 'Brain coral ochre', '#d4a24c', 0.8);
  const magenta = tone(p, 'Reef magenta coral', '#b84d78', 0.78);
  const shell = tone(p, 'Giant clam shell', '#e6ded0', 0.74);
  const pearl = crystalTone(p, 'Reef pearl', '#f5f2ea', '#9ad4d4');

  const reef = group(root, 'CoralReef');
  mound(reef, p, [0, 0, 0], 1.42, 0.25, 1.34, limestone);
  rock(reef, p, [-0.46, 0.08, -0.22], [0.56, 0.34, 0.48], limestone, 1.3);
  rock(reef, p, [0.36, 0.08, -0.34], [0.48, 0.28, 0.44], limestone, 2.8);

  const stagBase: Point = [-0.36, 0.24, -0.14];
  const antlers: readonly [Point, Point, Point][] = [
    [stagBase, [-0.54, 0.88, -0.28], [-0.74, 1.54, -0.44]],
    [stagBase, [-0.32, 0.96, -0.02], [-0.22, 1.78, 0.08]],
    [stagBase, [-0.14, 0.84, -0.32], [0.02, 1.48, -0.52]],
    [[-0.46, 0.72, -0.22], [-0.78, 1.06, 0.02], [-0.92, 1.46, 0.14]],
    [[-0.28, 0.94, -0.06], [-0.04, 1.3, 0.22], [0.08, 1.62, 0.34]],
  ];
  for (const pts of antlers) {
    taperArc(reef, p, pts, t => 0.12 * (1 - 0.56 * t), p.primary, 9, 7);
  }
  for (const pts of [
    [[-0.64, 0.18, 0.44], [-0.82, 0.62, 0.54], [-0.94, 1.06, 0.62]],
    [[-0.64, 0.18, 0.44], [-0.48, 0.64, 0.66], [-0.38, 1.02, 0.78]],
  ] as readonly [Point, Point, Point][]) {
    taperArc(reef, p, pts, t => 0.095 * (1 - 0.55 * t), magenta, 8, 6);
  }

  for (const [bx, bz, r] of [[0.38, 0.46, 0.32], [-0.08, 0.62, 0.24]] as const) {
    orb(reef, p, [bx, 0.26, bz], [r, r * 0.76, r * 0.94], brainGold, 9);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      taperArc(
        reef,
        p,
        [[bx, 0.26 + r * 0.72, bz], [bx + Math.sin(a) * r * 0.72, 0.26 + r * 0.52, bz + Math.cos(a) * r * 0.72], [bx + Math.sin(a) * r * 0.96, 0.22, bz + Math.cos(a) * r * 0.96]],
        0.026,
        p.primary,
        6,
        5,
      );
    }
  }

  const fan = group(reef, 'SeaFan', [0.34, 0.24, -0.22]);
  taperArc(fan, p, [[0, 0, 0], [0.04, 0.62, 0.02], [0.08, 1.48, -0.04]], t => 0.065 * (1 - 0.48 * t), p.accent, 9, 6);
  for (let i = -3; i <= 3; i++) {
    const spread = i * 0.22;
    const h = 1.42 - Math.abs(i) * 0.16;
    taperArc(
      fan,
      p,
      [[0, 0.18, 0], [spread * 0.55, h * 0.52, i * 0.02], [spread, h, i * 0.04]],
      t => 0.044 * (1 - 0.48 * t),
      p.accent,
      8,
      5,
      [0.45, 1],
    );
  }
  for (const y of [0.54, 0.88, 1.18]) {
    const w = 0.62 - (y - 0.54) * 0.24;
    taperArc(fan, p, [[-w, y, -0.04], [0, y + 0.08, 0.02], [w, y, 0.04]], 0.024, p.accent, 7, 5);
  }

  const clam = group(reef, 'ClamShell', [0.84, 0.09, 0.48]);
  orb(clam, p, [0, 0.12, 0], [0.32, 0.08, 0.26], shell, 9, [0.16, 0.4, 0]);
  orb(clam, p, [-0.03, 0.26, -0.08], [0.3, 0.075, 0.24], shell, 9, [-0.58, 0.4, 0]);
  orb(clam, p, [0.02, 0.18, 0.02], [0.072, 0.072, 0.072], pearl, 8);

  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      cyl(reef, p, [-0.82 + Math.sin(a) * 0.16, 0.38 + (i % 2) * 0.12, -0.18 + Math.cos(a) * 0.16], 0.055, 0.068, 0.36 + (i % 3) * 0.14, i % 2 === 0 ? magenta : p.primary, [0, a, 0], 7);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      taperArc(reef, p, [[-0.08, 0.2, 0.92], [-0.08 + Math.sin(a) * 0.14, 0.18, 0.92 + Math.cos(a) * 0.14]], t => 0.034 * (1 - 0.6 * t), p.primary, 5, 5);
    }
  }
  root.animations = [new T.AnimationClip('Ocean swell', 4.2, [sway('SeaFan', 'z', 4.2, -0.18, 0.18)])];
}

function buildBasaltStack(root: T.Group, p: Finish, detail: boolean) {
  const apron = tone(p, 'Volcanic apron', '#353a42', 0.88, 0.06, undefined, true);
  const basaltLight = tone(p, 'Weathered basalt', '#5d636e', 0.84, 0.06, undefined, true);
  const lichen = tone(p, 'Cliff lichen', '#9c7a4e', 0.86);
  const shrubBark = tone(p, 'Gnarled shrub root', '#5c4738', 0.86);

  const stack = group(root, 'BasaltStack');
  mound(stack, p, [0, 0, 0], 1.46, 0.18, 1.4, apron);

  const cols: readonly [number, number, number, number, number][] = [
    [-0.08, -0.06, 0.28, 2.34, 0],
    [0.34, -0.14, 0.27, 2.02, 1],
    [-0.46, -0.22, 0.26, 1.88, 0],
    [-0.14, 0.36, 0.26, 1.72, 2],
    [0.24, 0.28, 0.25, 1.54, 0],
    [-0.02, -0.48, 0.26, 1.64, 1],
    [-0.52, 0.22, 0.25, 1.38, 0],
    [0.64, 0.08, 0.24, 1.24, 1],
    [0.54, -0.5, 0.24, 1.12, 2],
    [-0.76, -0.02, 0.23, 0.98, 0],
    [-0.44, -0.64, 0.24, 1.04, 1],
    [-0.32, 0.72, 0.23, 0.86, 0],
    [0.14, 0.7, 0.24, 0.74, 2],
    [0.58, 0.52, 0.22, 0.62, 0],
    [0.86, -0.28, 0.22, 0.68, 1],
    [-0.84, 0.42, 0.22, 0.56, 2],
    [-0.78, -0.46, 0.22, 0.6, 0],
    [0.14, -0.86, 0.23, 0.78, 1],
  ];
  for (let i = 0; i < cols.length; i++) {
    const [x, z, r, h, shade] = cols[i] ?? [0, 0, 0.24, 1, 0];
    const mat = shade === 0 ? p.primary : shade === 1 ? basaltLight : apron;
    hexColumn(stack, p, [x, 0.06 + (i % 3) * 0.015, z], r, h, mat, [0, 0.16, 0]);
  }

  for (const [mx, my, mz] of [[0.34, 2.08, -0.14], [-0.46, 1.94, -0.22], [-0.14, 1.78, 0.36]] as const) {
    orb(stack, p, [mx, my, mz], [0.22, 0.065, 0.2], p.accent, 7);
  }

  const shrub = group(stack, 'CliffShrub', [-0.08, 2.38, -0.06]);
  taperArc(shrub, p, [[0, -0.08, 0], [0.08, 0.18, 0.04], [0.22, 0.38, 0.08]], t => 0.055 * (1 - 0.45 * t), shrubBark, 6, 5);
  taperArc(shrub, p, [[0, -0.08, 0], [-0.14, 0.14, -0.06], [-0.26, 0.32, -0.1]], t => 0.048 * (1 - 0.45 * t), shrubBark, 6, 5);
  orb(shrub, p, [0.16, 0.38, 0.06], [0.34, 0.18, 0.28], p.accent, 8);
  orb(shrub, p, [-0.18, 0.32, -0.08], [0.28, 0.16, 0.24], p.accent, 8);
  orb(shrub, p, [0.02, 0.48, -0.02], [0.24, 0.15, 0.22], p.accent, 7);

  const talus = group(stack, 'BasaltTalus', [0.92, 0.08, 0.48]);
  hexColumn(talus, p, [0, 0.16, 0], 0.17, 0.56, p.primary, [0.52, 0.4, 1.18]);
  hexColumn(talus, p, [-0.16, 0.14, 0.22], 0.14, 0.42, basaltLight, [-0.38, 0.9, 1.28]);
  rock(talus, p, [0.16, 0.02, 0.14], [0.2, 0.14, 0.18], apron, 4.4);

  if (detail) {
    for (const [lx, ly, lz] of [[0.64, 1.32, 0.08], [-0.52, 1.46, 0.22], [0.24, 1.62, 0.28], [-0.44, 1.12, -0.64]] as const) {
      orb(stack, p, [lx, ly, lz], [0.14, 0.036, 0.12], lichen, 6);
    }
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3;
      cone(stack, p, [Math.sin(a) * 0.72, 0.84 + (i % 2) * 0.24, Math.cos(a) * 0.68], 0.04, 0.2, p.accent, [0.12, a, 0], 6);
    }
  }
  root.animations = [new T.AnimationClip('Sea cliff gale', 3.8, [sway('CliffShrub', 'z', 3.8, -0.15, 0.15)])];
}

function buildCanyonArch(root: T.Group, p: Finish, detail: boolean) {
  const floor = tone(p, 'Canyon floor', '#b8734d', 0.9);
  const rust = tone(p, 'Deep rust strata', '#9c432b', 0.88);
  const ochre = tone(p, 'Ochre sandstone', '#d88c54', 0.86);
  const driftwood = tone(p, 'Juniper deadwood', '#8c7662', 0.86);
  const cairnRock = tone(p, 'Desert flagstone', '#cfa076', 0.86);

  const arch = group(root, 'CanyonArch');
  mesaBase(arch, p, [0, 0, 0], 1.72, 0.22, 1.26, floor);

  const strataMat = (k: number) => (k % 3 === 0 ? p.primary : k % 3 === 1 ? rust : ochre);
  for (const [bx, dir] of [[-1.02, -1], [0.98, 1]] as const) {
    for (let k = 0; k < 5; k++) {
      const r = 0.56 - k * 0.045;
      orb(arch, p, [bx + dir * (k % 2) * 0.05, 0.26 + k * 0.28, (k % 2 - 0.5) * 0.06], [r, 0.22, r * 0.86], strataMat(k), 9);
    }
  }

  taperArc(
    arch,
    p,
    [[-1.08, 1.18, 0], [-0.78, 1.88, -0.02], [0, 2.22, -0.04], [0.76, 1.82, 0.02], [1.02, 1.16, 0]],
    t => 0.34 - 0.12 * Math.sin(t * Math.PI),
    p.primary,
    14,
    8,
    [0.82, 1.05],
  );
  for (let i = 0; i < 5; i++) {
    const t = (i + 1) / 6;
    const x = -0.88 + t * 1.76;
    const y = 1.66 + Math.sin(t * Math.PI) * 0.62;
    orb(arch, p, [x, y, -0.02], [0.3, 0.14, 0.34], strataMat(i + 1), 8);
  }

  lathe(
    arch,
    p,
    [-1.24, 0.14, -0.4],
    [[0.01, 0], [0.32, 0], [0.22, 0.44], [0.16, 0.84], [0.26, 1.14], [0.38, 1.32], [0.3, 1.48], [0.01, 1.52]],
    rust,
    11,
  );
  orb(arch, p, [-1.24, 1.56, -0.4], [0.36, 0.12, 0.34], ochre, 8);

  const juniper = group(arch, 'CanyonJuniper', [0.92, 1.46, 0.08]);
  taperArc(juniper, p, [[0, -0.08, 0], [0.12, 0.22, 0.04], [0.24, 0.5, -0.06]], t => 0.085 * (1 - 0.45 * t), driftwood, 8, 6);
  taperArc(juniper, p, [[0.06, 0.16, 0.02], [-0.14, 0.38, 0.08], [-0.26, 0.56, 0.12]], t => 0.06 * (1 - 0.45 * t), driftwood, 7, 5);
  orb(juniper, p, [0.24, 0.54, -0.06], [0.36, 0.2, 0.3], p.accent, 8);
  orb(juniper, p, [-0.22, 0.58, 0.1], [0.3, 0.18, 0.26], p.accent, 8);
  orb(juniper, p, [0.04, 0.68, 0.02], [0.28, 0.18, 0.24], p.accent, 8);

  const cairn = group(arch, 'DesertCairn', [0.06, 0.16, 0.44]);
  const cairnLayers: readonly [number, number, number][] = [
    [0.06, 0.22, 0.1], [0.17, 0.18, 0.085], [0.26, 0.145, 0.075], [0.34, 0.11, 0.065], [0.41, 0.075, 0.055],
  ];
  for (let i = 0; i < cairnLayers.length; i++) {
    const [cy, r, h] = cairnLayers[i] ?? [0.1, 0.1, 0.06];
    orb(cairn, p, [(i % 2 - 0.5) * 0.02, cy, 0], [r, h, r * 0.88], i % 2 === 0 ? cairnRock : ochre, 7);
  }

  if (detail) {
    for (const [sx, sz] of [[-0.78, 0.62], [0.76, 0.58], [1.18, -0.44], [-0.52, -0.68]] as const) {
      orb(arch, p, [sx, 0.24, sz], [0.18, 0.12, 0.16], p.accent, 7);
    }
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + 0.3;
      rock(arch, p, [Math.sin(a) * 1.05, 0.14, Math.cos(a) * 0.72], [0.12, 0.07, 0.1], cairnRock, i + 2.1);
    }
  }
  root.animations = [new T.AnimationClip('Canyon draft', 4.2, [sway('CanyonJuniper', 'z', 4.2, -0.14, 0.14)])];
}

function buildWaterfall(root: T.Group, p: Finish, detail: boolean) {
  const darkSlate = tone(p, 'Wet cliff slate', '#4c545c', 0.82);
  const lightSlate = tone(p, 'Weathered slate', '#687078', 0.84);
  const foam = waterTone(p, 'Plunge foam', '#c8eef2', '#64a8b8');
  const pineBark = tone(p, 'Cliff pine bark', '#6e4d37', 0.86);

  const ledge = group(root, 'WaterfallLedge');
  mound(ledge, p, [0, 0, 0], 1.52, 0.2, 1.44, darkSlate);

  const cliffBlocks: readonly [Point, Point, number][] = [
    [[-0.64, 0.08, -0.48], [0.72, 0.96, 0.56], 1.4],
    [[0.66, 0.08, -0.44], [0.68, 0.82, 0.54], 2.7],
    [[0, 0.08, -0.64], [0.84, 1.28, 0.54], 3.9],
    [[-0.56, 0.84, -0.56], [0.64, 0.78, 0.48], 5.1],
    [[0.58, 0.76, -0.56], [0.58, 0.74, 0.46], 6.3],
    [[0, 1.12, -0.78], [0.76, 0.62, 0.44], 7.2],
  ];
  for (let i = 0; i < cliffBlocks.length; i++) {
    const [at, sc, seed] = cliffBlocks[i] ?? [[0, 0.1, 0], [0.4, 0.4, 0.4], 1];
    rock(ledge, p, at, sc, i % 2 === 0 ? darkSlate : lightSlate, seed);
  }
  orb(ledge, p, [-0.56, 1.98, -0.52], [0.46, 0.14, 0.38], p.accent, 8);
  orb(ledge, p, [0.58, 1.84, -0.54], [0.42, 0.12, 0.34], p.accent, 8);
  orb(ledge, p, [-0.88, 1.08, -0.18], [0.34, 0.12, 0.3], p.accent, 7);

  cyl(ledge, p, [0, 1.86, -0.42], 0.54, 0.58, 0.14, p.primary, [0, 0, 0], 14);
  cyl(ledge, p, [0, 0.2, 0.44], 0.8, 0.84, 0.1, p.primary, [0, 0, 0], 16);
  for (let i = 0; i < 8; i++) {
    const a = -1.25 + i * 0.36;
    rock(ledge, p, [Math.sin(a) * 0.92, 0.08, 0.42 + Math.cos(a) * 0.72], [0.24, 0.18, 0.22], i % 2 === 0 ? lightSlate : darkSlate, i + 1.8);
  }

  const cascade = group(ledge, 'CascadeSheet', [0, 0, 0]);
  for (const [x, w, mat] of [[-0.18, 0.19, p.primary], [0.16, 0.18, p.primary], [0, 0.16, foam]] as const) {
    taperArc(
      cascade,
      p,
      [[x, 1.92, -0.22], [x * 1.12, 1.48, 0.08], [x * 1.16, 0.82, 0.22], [x * 1.1, 0.16, 0.34]],
      t => w * (0.86 + 0.28 * t),
      mat,
      10,
      6,
      [0.26, 1],
    );
  }
  orb(cascade, p, [0, 0.26, 0.36], [0.48, 0.14, 0.32], foam, 9);
  orb(cascade, p, [-0.24, 0.3, 0.44], [0.24, 0.12, 0.2], foam, 7);
  orb(cascade, p, [0.24, 0.29, 0.42], [0.22, 0.11, 0.18], foam, 7);

  const pine = group(ledge, 'CliffPine', [0.84, 1.12, -0.34]);
  taperArc(pine, p, [[-0.1, -0.08, 0], [0.02, 0.34, 0.02], [0.06, 0.88, 0]], t => 0.085 * (1 - 0.5 * t), pineBark, 7, 6);
  cone(pine, p, [0.06, 0.62, 0], 0.46, 0.52, p.accent, [0, 0.2, 0], 8);
  cone(pine, p, [0.06, 0.94, 0], 0.36, 0.46, p.accent, [0, 0.8, 0], 8);
  cone(pine, p, [0.06, 1.24, 0], 0.24, 0.38, p.accent, [0, 1.4, 0], 7);

  if (detail) {
    for (let i = 0; i < 4; i++) {
      const s = i < 2 ? -1 : 1;
      frond(ledge, p, [s * (0.64 + (i % 2) * 0.18), 0.24, 0.18 + (i % 2) * 0.28], 0.4, 0.08, 0.18, 0.04, p.accent, s * 0.9 + i * 0.4);
    }
    for (let i = 0; i < 4; i++) {
      orb(cascade, p, [(i - 1.5) * 0.14, 0.72 + (i % 2) * 0.42, 0.22], [0.06, 0.09, 0.05], foam, 6);
    }
  }
  root.animations = [new T.AnimationClip('Waterfall surge', 2.4, [bob('CascadeSheet', 2.4, [0, 0, 0], [0, 0.08, 0.02, 0.1, 0])])];
}

function buildGlacierSpire(root: T.Group, p: Finish, detail: boolean) {
  const cobalt = crystalTone(p, 'Deep crevasse ice', '#3c7da8', '#173e5c');
  const frost = crystalTone(p, 'Frost crystal cyan', '#b4e6f5', '#4c8ca6');
  const moraine = tone(p, 'Frozen moraine', '#4d5966', 0.88);

  const glacier = group(root, 'GlacierSpire');
  mound(glacier, p, [0, 0, 0], 1.48, 0.28, 1.4, p.accent);
  rock(glacier, p, [-0.88, 0.06, 0.34], [0.34, 0.22, 0.28], moraine, 1.8);
  rock(glacier, p, [0.68, 0.06, -0.68], [0.36, 0.24, 0.32], moraine, 3.4);

  const seracs: readonly [Point, number, number, Point, number][] = [
    [[-0.24, 0.14, -0.14], 0.44, 2.08, [0.08, 0.3, 0.14], 0],
    [[0.28, 0.14, -0.06], 0.38, 1.92, [-0.06, -0.2, -0.18], 1],
    [[-0.56, 0.12, 0.24], 0.3, 1.46, [0.18, 0.5, 0.26], 2],
    [[0.52, 0.12, 0.28], 0.28, 1.32, [0.22, -0.4, -0.24], 0],
    [[0.02, 0.14, -0.58], 0.34, 1.66, [-0.24, 0.1, 0.06], 1],
    [[-0.44, 0.14, -0.48], 0.24, 1.18, [-0.18, 0.6, 0.24], 0],
    [[0.06, 0.16, 0.44], 0.24, 0.98, [0.28, 0.2, -0.08], 2],
  ];
  for (const [at, r, h, rot, kind] of seracs) {
    crystalPrism(glacier, p, at, r, h, kind === 0 ? p.primary : kind === 1 ? cobalt : frost, rot);
  }

  const crest = group(glacier, 'GlacierCrest', [0.04, 1.78, -0.08]);
  crystalPrism(crest, p, [0, -0.28, 0], 0.32, 1.42, p.primary, [0.06, 0.25, -0.08]);
  crystalPrism(crest, p, [-0.18, -0.16, 0.08], 0.18, 0.96, frost, [0.16, 0.7, 0.24]);
  crystalPrism(crest, p, [0.2, -0.18, -0.06], 0.17, 0.88, cobalt, [-0.14, -0.4, -0.26]);
  orb(crest, p, [-0.04, 0.22, 0.06], [0.34, 0.12, 0.28], p.accent, 8);

  const iceBlocks = group(glacier, 'IceBlocks', [0.88, 0.08, 0.48]);
  block(iceBlocks, p, [0, 0.14, 0], [0.36, 0.24, 0.3], p.primary, [0.12, 0.4, -0.18]);
  block(iceBlocks, p, [-0.22, 0.1, 0.22], [0.24, 0.18, 0.22], cobalt, [-0.16, 0.9, 0.12]);
  crystalPrism(iceBlocks, p, [0.18, 0.06, -0.14], 0.12, 0.44, frost, [0.35, 0.2, -0.45]);

  if (detail) {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + 0.4;
      cone(glacier, p, [Math.sin(a) * 0.52, 0.96 + (i % 2) * 0.28, Math.cos(a) * 0.48], 0.055, 0.34, frost, [Math.PI, a, 0.14], 6);
    }
    for (let i = 0; i < 4; i++) {
      const a = i * 1.55 + 0.3;
      orb(glacier, p, [Math.sin(a) * 0.86, 0.2, Math.cos(a) * 0.82], [0.28, 0.07, 0.14], p.accent, 6, [0, a, 0]);
    }
  }
  root.animations = [new T.AnimationClip('Glacial creak', 4.4, [sway('GlacierCrest', 'z', 4.4, -0.09, 0.09)])];
}

export const terrainBiomesBuildersB: readonly BiomeBuilderDef[] = [
  {
    id: 'branching-coral-reef',
    riggedParts: [{ name: 'SeaFan', label: 'Gorgonian sea fan', type: 'rotate', axis: 'z', range: [-15, 15], describe: 'Waves the lacy turquoise sea fan in the ocean current' }],
    detachableParts: [{ name: 'ClamShell', label: 'Giant reef clam', describe: 'Removable fluted giant clam shell and pearl on the reef shelf' }],
    build: buildCoralReef,
  },
  {
    id: 'hexagonal-basalt-stack',
    riggedParts: [{ name: 'CliffShrub', label: 'Coastal cliff shrub', type: 'rotate', axis: 'z', range: [-12, 12], describe: 'Sways the windswept shrub perched on the tallest basalt column' }],
    detachableParts: [{ name: 'BasaltTalus', label: 'Broken basalt talus', describe: 'Removable pile of fractured hexagonal basalt chunks at the base' }],
    build: buildBasaltStack,
  },
  {
    id: 'red-rock-canyon-arch',
    riggedParts: [{ name: 'CanyonJuniper', label: 'Canyon desert juniper', type: 'rotate', axis: 'z', range: [-12, 12], describe: 'Sways the gnarled desert juniper rooted on the arch shoulder' }],
    detachableParts: [{ name: 'DesertCairn', label: 'Desert trail cairn', describe: 'Removable stacked flagstone trail cairn beneath the canyon arch' }],
    build: buildCanyonArch,
  },
  {
    id: 'waterfall-cliff-ledge',
    riggedParts: [{ name: 'CascadeSheet', label: 'Waterfall cascade', type: 'slide', axis: 'y', range: [0, 0.12], describe: 'Surges the plunging waterfall ribbons into the foam basin' }],
    detachableParts: [{ name: 'CliffPine', label: 'Cliffside pine', describe: 'Removable windswept pine perched on the upper slate cliff shelf' }],
    build: buildWaterfall,
  },
  {
    id: 'fractured-glacier-spire',
    riggedParts: [{ name: 'GlacierCrest', label: 'Glacial ice crest', type: 'rotate', axis: 'z', range: [-8, 8], describe: 'Shifts the crowning fractured glacial ice crest in polar wind' }],
    detachableParts: [{ name: 'IceBlocks', label: 'Calved ice blocks', describe: 'Removable cluster of fractured calved ice chunks on the snowfield' }],
    build: buildGlacierSpire,
  },
];
