import * as T from 'three';
import { group } from '../../parts';
import type { Finish, Point } from '../../parts';
import {
  cone, cyl, frond, lathe, mesaBase, mound, moundY, orb, rock, sway, taperArc, tone, waterTone,
  type BiomeBuilderDef,
} from './terrain-biomes-kit';

function buildWillow(root: T.Group, p: Finish, detail: boolean) {
  const bank = tone(p, 'Mossy riverbank', '#4a6c43', 0.88);
  const sage = tone(p, 'Pale willow cascade', '#8bb868', 0.78);
  const river = waterTone(p, 'River channel', '#3c93a8', '#154e5e');
  const granite = tone(p, 'River stone', '#7c8387', 0.84);
  const moss = tone(p, 'Bank moss', '#5e884a', 0.86);

  const willow = group(root, 'WeepingWillow');
  mound(willow, p, [0, 0, 0], 1.46, 0.25, 1.34, bank);
  cyl(willow, p, [0.46, 0.13, 0.56], 0.62, 0.66, 0.08, river, [0, 0, 0], 14);

  taperArc(willow, p, [[-0.32, 0.14, -0.14], [-0.18, 0.78, -0.06], [0.02, 1.42, 0.02], [0.12, 1.94, 0.06]], t => 0.27 * (1 - 0.36 * t), p.accent, 12, 8);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.58 + 0.35;
    taperArc(willow, p, [[-0.3, 0.42, -0.12], [-0.3 + Math.sin(a) * 0.4, 0.22, -0.12 + Math.cos(a) * 0.4], [-0.3 + Math.sin(a) * 0.76, 0.09, -0.12 + Math.cos(a) * 0.76]], t => 0.11 * (1 - 0.55 * t), p.accent, 7, 6);
  }
  const boughs: readonly Point[] = [
    [0.68, 2.26, 0.26], [-0.52, 2.22, 0.28], [0.44, 2.28, -0.52], [-0.46, 2.18, -0.44],
  ];
  for (const end of boughs) {
    taperArc(willow, p, [[0.08, 1.72, 0.04], [(0.08 + end[0]) * 0.52, 2.08, (0.04 + end[2]) * 0.52], end], t => 0.11 * (1 - 0.48 * t), p.accent, 8, 6);
  }

  const curtain = group(willow, 'WillowCurtain', [0.12, 1.92, 0.06]);
  const domePuffs: readonly [Point, Point, boolean][] = [
    [[0, 0.48, 0], [0.84, 0.44, 0.78], false],
    [[0.58, 0.32, 0.22], [0.64, 0.38, 0.58], false],
    [[-0.58, 0.3, 0.18], [0.62, 0.36, 0.58], true],
    [[0.26, 0.34, -0.56], [0.58, 0.36, 0.56], true],
    [[-0.3, 0.3, -0.52], [0.56, 0.34, 0.54], false],
  ];
  for (const [at, sc, pale] of domePuffs) orb(curtain, p, at, sc, pale ? sage : p.primary, 9);
  for (let i = 0; i < 14; i++) {
    const a = (i * Math.PI * 2) / 14;
    const rad = 0.68 + (i % 3) * 0.16;
    const drop = 0.92 + (i % 4) * 0.15;
    const sx = Math.sin(a);
    const sz = Math.cos(a);
    taperArc(
      curtain, p,
      [[sx * rad * 0.76, 0.26, sz * rad * 0.76], [sx * rad * 1.06, -drop * 0.26, sz * rad * 1.06], [sx * rad * 1.12, -drop * 0.7, sz * rad * 1.12], [sx * rad * 1.05, -drop, sz * rad * 1.05]],
      t => 0.088 * (1 - 0.52 * t), i % 3 === 0 ? sage : p.primary, 8, 5, [0.42, 1],
    );
  }

  const rocks = group(willow, 'RiverRocks', [0.84, 0.06, 0.48]);
  rock(rocks, p, [0, 0, 0], [0.36, 0.26, 0.32], granite, 1.9);
  rock(rocks, p, [-0.26, 0.02, 0.18], [0.22, 0.16, 0.2], granite, 3.6);
  rock(rocks, p, [0.22, 0.02, -0.18], [0.2, 0.14, 0.18], granite, 5.2);
  orb(rocks, p, [0.02, 0.27, -0.02], [0.22, 0.07, 0.18], moss, 7);

  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = 0.3 + i * 0.65;
      cone(willow, p, [0.46 + Math.sin(a) * 0.54, 0.28, 0.56 + Math.cos(a) * 0.5], 0.032, 0.36, moss, [0.1, a, 0], 6);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.25;
      const sx = Math.sin(a), sz = Math.cos(a);
      taperArc(curtain, p, [[sx * 0.44, 0.18, sz * 0.44], [sx * 0.56, -0.45, sz * 0.56], [sx * 0.52, -0.95, sz * 0.52]], t => 0.055 * (1 - 0.45 * t), sage, 6, 5);
    }
  }
  root.animations = [new T.AnimationClip('Willow breeze', 4.4, [sway('WillowCurtain', 'z', 4.4, -0.14, 0.14)])];
}

function buildBaobab(root: T.Group, p: Finish, detail: boolean) {
  const redEarth = tone(p, 'Savanna laterite', '#a85d3b', 0.9);
  const dryGrass = tone(p, 'Savanna grass', '#c9a653', 0.85);
  const oliveDark = tone(p, 'Savanna olive shade', '#5e7334', 0.82);
  const clay = tone(p, 'Termite clay', '#b86e42', 0.88);
  const pod = tone(p, 'Baobab fruit', '#c89c4c', 0.78);

  const scene = group(root, 'SavannaBaobab');
  mound(scene, p, [0, 0, 0], 1.54, 0.24, 1.46, redEarth);

  const bottle: readonly [number, number][] = [
    [0.01, 0], [0.68, 0], [0.64, 0.28], [0.58, 0.72], [0.54, 1.24], [0.46, 1.64], [0.42, 1.88], [0.01, 1.92],
  ];
  lathe(scene, p, [0, 0.08, 0], bottle, p.accent, 14);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.2;
    const sx = Math.sin(a), sz = Math.cos(a);
    taperArc(scene, p, [[sx * 0.42, 1.15, sz * 0.42], [sx * 0.62, 0.46, sz * 0.62], [sx * 0.88, 0.1, sz * 0.88]], t => 0.14 * (1 - 0.45 * t), p.accent, 7, 6);
    taperArc(scene, p, [[sx * 0.26, 1.74, sz * 0.26], [sx * 0.64, 2.16, sz * 0.64], [sx * 0.98, 2.48 + (i % 2) * 0.18, sz * 0.98]], t => 0.16 * (1 - 0.56 * t), p.accent, 8, 6);
  }

  const crown = group(scene, 'BaobabCrown', [0, 1.96, 0]);
  cyl(crown, p, [0, 0.22, 0], 0.24, 0.3, 0.52, p.accent, [0, 0, 0], 8);
  const pads: readonly [Point, Point, boolean][] = [
    [[0, 0.92, 0], [0.88, 0.26, 0.84], false],
    [[0.78, 0.68, 0.34], [0.76, 0.24, 0.68], false],
    [[-0.82, 0.72, 0.22], [0.74, 0.23, 0.68], true],
    [[0.22, 0.64, -0.78], [0.72, 0.22, 0.64], false],
    [[-0.44, 0.62, -0.68], [0.68, 0.22, 0.62], true],
    [[0.08, 0.58, 0.76], [0.7, 0.21, 0.62], true],
    [[0.56, 1.04, -0.28], [0.58, 0.2, 0.52], false],
    [[-0.48, 1.02, 0.32], [0.56, 0.2, 0.5], false],
  ];
  for (const [at, sc, dark] of pads) {
    orb(crown, p, at, sc, dark ? oliveDark : p.primary, 9);
  }

  const termite = group(scene, 'TermiteMound', [0.96, 0.06, 0.54]);
  lathe(termite, p, [0, 0, 0], [[0.01, 0], [0.34, 0], [0.28, 0.36], [0.18, 0.78], [0.1, 1.12], [0.01, 1.18]], clay, 10);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.4;
    cone(termite, p, [Math.sin(a) * 0.2, 0.34, Math.cos(a) * 0.2], 0.14, 0.66, clay, [0, a, 0], 7);
  }

  if (detail) {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + 0.3;
      orb(crown, p, [Math.sin(a) * 0.74, 0.46, Math.cos(a) * 0.74], [0.06, 0.1, 0.06], pod, 6);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const gx = Math.sin(a) * 0.96;
      const gz = Math.cos(a) * 0.92;
      cone(scene, p, [gx, moundY(gx, gz, 1.54, 0.24, 1.46) + 0.12, gz], 0.042, 0.3, dryGrass, [0.14, a, 0], 6);
    }
  }
  root.animations = [new T.AnimationClip('Savanna breeze', 4.6, [sway('BaobabCrown', 'z', 4.6, -0.12, 0.12)])];
}

function buildSaguaro(root: T.Group, p: Finish, detail: boolean) {
  const mesa = tone(p, 'Red mesa earth', '#b86342', 0.9);
  const darkCactus = tone(p, 'Saguaro rib shade', '#3c6e42', 0.8);
  const pearGreen = tone(p, 'Prickly pear', '#659956', 0.82);
  const pearFruit = tone(p, 'Cactus fruit', '#d65a44', 0.74);
  const sandstone = tone(p, 'Desert sandstone', '#9e5238', 0.88);

  const scene = group(root, 'SaguaroCluster');
  mesaBase(scene, p, [0, 0, 0], 1.42, 0.26, 1.34, mesa);

  const main = group(scene, 'MainSaguaro', [-0.08, 0.2, -0.06]);
  cyl(main, p, [0, 1.24, 0], 0.21, 0.24, 2.44, p.primary, [0, 0, 0], 10);
  orb(main, p, [0, 2.46, 0], [0.21, 0.19, 0.21], p.primary, 9);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    cyl(main, p, [Math.sin(a) * 0.18, 1.22, Math.cos(a) * 0.18], 0.058, 0.068, 2.38, i % 2 === 0 ? p.primary : darkCactus, [0, a, 0], 7);
  }
  const arms: readonly [number, number, number, number][] = [
    [0.25, 0.96, 0.64, 1.02],
    [2.35, 1.24, 0.56, 0.86],
    [4.45, 1.44, 0.52, 0.72],
  ];
  for (const [a, y0, reach, rise] of arms) {
    const sx = Math.sin(a);
    const sz = Math.cos(a);
    const tip: Point = [sx * reach, y0 + rise, sz * reach];
    taperArc(
      main,
      p,
      [[sx * 0.14, y0, sz * 0.14], [sx * reach * 0.85, y0 + 0.04, sz * reach * 0.85], [sx * reach, y0 + rise * 0.45, sz * reach], tip],
      t => 0.13 * (1 - 0.12 * t),
      p.primary,
      10,
      7,
    );
    orb(main, p, tip, [0.12, 0.11, 0.12], p.primary, 7);
    orb(main, p, [tip[0], tip[1] + 0.11, tip[2]], [0.085, 0.055, 0.085], p.accent, 7);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    orb(main, p, [Math.sin(a) * 0.1, 2.64, Math.cos(a) * 0.1], [0.068, 0.055, 0.068], p.accent, 6);
  }

  cyl(scene, p, [0.64, 0.86, -0.38], 0.14, 0.16, 1.38, p.primary, [0, 0, 0], 9);
  orb(scene, p, [0.64, 1.56, -0.38], [0.14, 0.13, 0.14], p.primary, 8);
  taperArc(scene, p, [[0.64, 0.78, -0.38], [0.98, 0.8, -0.22], [1.02, 1.24, -0.2]], 0.095, p.primary, 8, 6);
  orb(scene, p, [0.64, 1.68, -0.38], [0.075, 0.05, 0.075], p.accent, 6);

  const pearPos: readonly [Point, Point, Point][] = [
    [[-0.72, 0.36, 0.44], [0.22, 0.28, 0.065], [0.08, 0.4, 0.12]],
    [[-0.56, 0.62, 0.38], [0.18, 0.24, 0.055], [-0.1, 0.8, -0.22]],
    [[-0.86, 0.62, 0.54], [0.17, 0.22, 0.055], [0.12, 0.1, 0.28]],
    [[-0.44, 0.36, 0.6], [0.16, 0.21, 0.055], [0.06, -0.5, -0.14]],
  ];
  for (const [at, sc, rot] of pearPos) {
    orb(scene, p, at, sc, pearGreen, 8, rot);
  }
  orb(scene, p, [-0.54, 0.85, 0.36], [0.048, 0.062, 0.048], pearFruit, 6);
  orb(scene, p, [-0.88, 0.83, 0.55], [0.045, 0.058, 0.045], pearFruit, 6);

  orb(scene, p, [0.24, 0.38, 0.66], [0.24, 0.24, 0.24], darkCactus, 9);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    orb(scene, p, [0.24 + Math.sin(a) * 0.11, 0.6, 0.66 + Math.cos(a) * 0.11], [0.048, 0.036, 0.048], p.accent, 6);
  }

  const desertRock = group(scene, 'DesertRock', [0.84, 0.06, 0.46]);
  rock(desertRock, p, [0, 0, 0], [0.38, 0.28, 0.32], sandstone, 2.7);
  rock(desertRock, p, [-0.24, 0.03, 0.18], [0.2, 0.14, 0.18], sandstone, 4.9);

  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      frond(scene, p, [-0.58, 0.24, -0.48], 0.34, 0.055, 0.14, 0.02, pearGreen, a, -0.18);
    }
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25 + 0.4;
      const px = Math.sin(a) * 0.82;
      const pz = Math.cos(a) * 0.78;
      rock(scene, p, [px, 0.16, pz], [0.08, 0.05, 0.07], sandstone, i + 1.5);
    }
  }
  root.animations = [new T.AnimationClip('Desert gust', 4.0, [sway('MainSaguaro', 'z', 4.0, -0.1, 0.1)])];
}

function buildSequoia(root: T.Group, p: Finish, detail: boolean) {
  const duff = tone(p, 'Redwood duff', '#4d4034', 0.9);
  const deepNeedles = tone(p, 'Redwood shade needles', '#21472c', 0.84);
  const fernMat = tone(p, 'Woodland fern', '#5e9649', 0.8);
  const moss = tone(p, 'Log moss', '#4c7840', 0.86);
  const fungus = tone(p, 'Bracket fungus', '#c9b48a', 0.82);

  const scene = group(root, 'CoastalSequoia');
  mound(scene, p, [0, 0, 0], 1.5, 0.26, 1.44, duff);

  cyl(scene, p, [0, 0.88, 0], 0.24, 0.44, 1.56, p.accent, [0, 0, 0], 12);
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7;
    const sx = Math.sin(a);
    const sz = Math.cos(a);
    cyl(scene, p, [sx * 0.28, 0.88, sz * 0.28], 0.07, 0.14, 1.5, p.accent, [0, a, 0], 6);
    taperArc(
      scene,
      p,
      [[sx * 0.34, 0.72, sz * 0.34], [sx * 0.62, 0.34, sz * 0.62], [sx * 0.94, 0.1, sz * 0.94]],
      t => 0.14 * (1 - 0.58 * t),
      p.accent,
      7,
      6,
    );
  }

  const crown = group(scene, 'RedwoodCrown', [0, 1.54, 0]);
  cyl(crown, p, [0, 1.0, 0], 0.06, 0.22, 1.92, p.accent, [0, 0, 0], 8);
  const tiers: readonly [number, number, number, number][] = [
    [0.24, 0.96, 0.56, 6],
    [0.72, 0.84, 0.52, 6],
    [1.18, 0.7, 0.46, 5],
    [1.58, 0.52, 0.42, 5],
    [1.92, 0.34, 0.38, 4],
  ];
  for (const [ty, reach, h, branches] of tiers) {
    cone(crown, p, [0, ty + 0.12, 0], reach * 0.76, h, p.primary, [0, ty, 0], 9);
    for (let i = 0; i < branches; i++) {
      const a = (i * Math.PI * 2) / branches + ty * 1.4;
      const sx = Math.sin(a);
      const sz = Math.cos(a);
      taperArc(
        crown,
        p,
        [[0, ty, 0], [sx * reach * 0.55, ty - 0.05, sz * reach * 0.55], [sx * reach, ty - 0.14, sz * reach]],
        t => 0.065 * (1 - 0.5 * t),
        p.accent,
        6,
        5,
      );
      orb(
        crown,
        p,
        [sx * reach * 0.82, ty - 0.04, sz * reach * 0.82],
        [reach * 0.46, h * 0.34, reach * 0.4],
        i % 2 === 0 ? p.primary : deepNeedles,
        7,
      );
    }
  }
  cone(crown, p, [0, 2.08, 0], 0.24, 0.42, p.primary, [0, 0, 0], 7);

  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.22;
    const fx = Math.sin(a) * 0.86;
    const fz = Math.cos(a) * 0.84;
    frond(scene, p, [fx, moundY(fx, fz, 1.5, 0.26, 1.44) - 0.02, fz], 0.46, 0.095, 0.2, 0.04, fernMat, a);
  }

  const log = group(scene, 'FallenLog', [0.84, 0.12, 0.56]);
  cyl(log, p, [0, 0.12, 0], 0.15, 0.17, 0.96, p.accent, [0.14, 0.5, Math.PI / 2 - 0.06], 9);
  orb(log, p, [-0.04, 0.24, 0.02], [0.34, 0.075, 0.16], moss, 7);
  orb(log, p, [0.18, 0.16, 0.14], [0.08, 0.026, 0.07], fungus, 6);

  if (detail) {
    for (let i = 0; i < 4; i++) {
      const a = i * 1.5 + 0.6;
      orb(scene, p, [Math.sin(a) * 0.42, 0.58 + i * 0.16, Math.cos(a) * 0.42], [0.11, 0.032, 0.09], fungus, 6);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.4;
      frond(scene, p, [Math.sin(a) * 0.62, 0.2, Math.cos(a) * 0.62], 0.36, 0.08, 0.18, 0.02, fernMat, a + 0.25);
    }
  }
  root.animations = [new T.AnimationClip('Coastal wind', 4.8, [sway('RedwoodCrown', 'z', 4.8, -0.11, 0.11)])];
}

function buildBamboo(root: T.Group, p: Finish, detail: boolean) {
  const earth = tone(p, 'Mossy hillside', '#4a6840', 0.88);
  const leafDark = tone(p, 'Bamboo jade leaf', '#447032', 0.78);
  const slate = tone(p, 'Garden slate', '#747c80', 0.84);
  const moss = tone(p, 'Stone moss', '#5f8a48', 0.86);

  const scene = group(root, 'BambooThicket');
  mound(scene, p, [0, 0, 0], 1.4, 0.24, 1.32, earth);
  rock(scene, p, [-0.72, 0.08, 0.54], [0.28, 0.14, 0.24], slate, 1.4);
  rock(scene, p, [-0.18, 0.1, 0.78], [0.24, 0.12, 0.2], slate, 2.9);

  const cluster = group(scene, 'BambooCluster', [0, 0.18, 0]);
  const culms: readonly [number, number, number, number, number, number][] = [
    [0, 0, 3.04, 0.064, 0.03, -0.02],
    [-0.36, -0.22, 2.74, 0.058, -0.05, 0.06],
    [0.34, -0.26, 2.86, 0.06, 0.04, -0.06],
    [-0.48, 0.26, 2.38, 0.052, 0.07, 0.05],
    [0.44, 0.24, 2.52, 0.054, -0.06, -0.05],
    [-0.14, -0.52, 2.62, 0.055, -0.06, 0.02],
    [0.16, 0.46, 2.18, 0.05, 0.08, -0.03],
    [-0.72, -0.08, 1.96, 0.048, -0.03, 0.09],
    [0.68, -0.04, 2.08, 0.048, 0.03, -0.08],
  ];
  for (let idx = 0; idx < culms.length; idx++) {
    const [x, z, h, r, rx, rz] = culms[idx] ?? [0, 0, 2, 0.05, 0, 0];
    const stalk = group(cluster, '', [x, 0, z]);
    stalk.rotation.set(rx, idx * 0.7, rz);
    cyl(stalk, p, [0, h * 0.5, 0], r * 0.84, r, h, p.primary, [0, 0, 0], 8);
    const nodes = 5;
    for (let k = 1; k < nodes; k++) {
      const ny = (h * k) / nodes;
      cyl(stalk, p, [0, ny, 0], r * 1.24, r * 1.24, 0.032, p.accent, [0, 0, 0], 8);
      if (k >= 2) {
        const yaw = idx * 1.1 + k * 2.1;
        frond(stalk, p, [0, ny, 0], 0.46, 0.085, 0.16, 0.08, k % 2 === 0 ? p.primary : leafDark, yaw, -0.1);
        frond(stalk, p, [0, ny + 0.03, 0], 0.4, 0.075, 0.14, 0.06, leafDark, yaw + 2.3, -0.08);
      }
    }
    frond(stalk, p, [0, h - 0.04, 0], 0.42, 0.08, 0.18, 0.05, p.primary, idx * 1.4, -0.15);
  }

  for (const [x, z, h] of [[-0.86, 0.36, 1.44], [0.76, -0.44, 1.56], [-0.52, -0.66, 1.62]] as const) {
    cyl(scene, p, [x, h * 0.5 + 0.12, z], 0.04, 0.048, h, p.primary, [0, 0, 0], 7);
    cyl(scene, p, [x, h * 0.48 + 0.12, z], 0.058, 0.058, 0.03, p.accent, [0, 0, 0], 7);
    frond(scene, p, [x, h + 0.08, z], 0.38, 0.075, 0.14, 0.06, leafDark, x * 3);
  }

  const gardenRock = group(scene, 'GardenRock', [0.84, 0.06, 0.48]);
  rock(gardenRock, p, [0, 0, 0], [0.36, 0.28, 0.32], slate, 3.3);
  rock(gardenRock, p, [-0.22, 0.02, 0.2], [0.18, 0.14, 0.17], slate, 5.4);
  orb(gardenRock, p, [0.02, 0.29, -0.02], [0.22, 0.07, 0.2], moss, 7);

  if (detail) {
    for (let i = 0; i < 4; i++) {
      const a = i * 1.55 + 0.5;
      const sx = Math.sin(a) * 0.64;
      const sz = Math.cos(a) * 0.62;
      cone(scene, p, [sx, 0.32, sz], 0.065, 0.34, p.accent, [0, a, 0], 7);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.3;
      frond(cluster, p, [Math.sin(a) * 0.35, 2.2 + (i % 2) * 0.35, Math.cos(a) * 0.35], 0.44, 0.08, 0.15, 0.07, leafDark, a);
    }
  }
  root.animations = [new T.AnimationClip('Bamboo rustle', 3.6, [sway('BambooCluster', 'z', 3.6, -0.1, 0.1)])];
}

export const terrainBiomesBuildersA: readonly BiomeBuilderDef[] = [
  {
    id: 'weeping-riverside-willow',
    riggedParts: [{ name: 'WillowCurtain', label: 'Willow leaf curtain', type: 'rotate', axis: 'z', range: [-12, 12], describe: 'Sways the cascading willow canopy and hanging curtain strands' }],
    detachableParts: [{ name: 'RiverRocks', label: 'Riverside rocks', describe: 'Removable smooth mossy river boulders along the bank' }],
    build: buildWillow,
  },
  {
    id: 'savanna-baobab-tree',
    riggedParts: [{ name: 'BaobabCrown', label: 'Baobab foliage crown', type: 'rotate', axis: 'z', range: [-10, 10], describe: 'Sways the tiered parasol foliage crown of the baobab' }],
    detachableParts: [{ name: 'TermiteMound', label: 'Termite mound', describe: 'Removable cathedral red-clay termite mound beside the roots' }],
    build: buildBaobab,
  },
  {
    id: 'saguaro-cactus-cluster',
    riggedParts: [{ name: 'MainSaguaro', label: 'Main saguaro cactus', type: 'rotate', axis: 'z', range: [-8, 8], describe: 'Sways the ribbed multi-arm saguaro cactus in desert winds' }],
    detachableParts: [{ name: 'DesertRock', label: 'Desert sandstone rock', describe: 'Removable stratified red sandstone rock on the mesa edge' }],
    build: buildSaguaro,
  },
  {
    id: 'giant-coastal-sequoia',
    riggedParts: [{ name: 'RedwoodCrown', label: 'Redwood needle crown', type: 'rotate', axis: 'z', range: [-9, 9], describe: 'Sways the high layered redwood needle bough tiers' }],
    detachableParts: [{ name: 'FallenLog', label: 'Mossy fallen log', describe: 'Removable mossy fallen redwood trunk beside the buttress roots' }],
    build: buildSequoia,
  },
  {
    id: 'swaying-bamboo-thicket',
    riggedParts: [{ name: 'BambooCluster', label: 'Bamboo culm thicket', type: 'rotate', axis: 'z', range: [-7, 7], describe: 'Sways the tall segmented bamboo culms and leaf clusters' }],
    detachableParts: [{ name: 'GardenRock', label: 'Mossy garden boulder', describe: 'Removable mossy garden rock nestled beside the bamboo patch' }],
    build: buildBamboo,
  },
];
