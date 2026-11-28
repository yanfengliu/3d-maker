import * as T from 'three';
import { group } from '../../parts';
import type { Finish, Point } from '../../parts';
import {
  block,
  cone,
  cyl,
  frond,
  lathe,
  mound,
  moundY,
  orb,
  rock,
  spin,
  sway,
  taperArc,
  tone,
  waterTone,
  type BiomeBuilderDef,
} from './terrain-biomes-kit';

function buildDolmen(root: T.Group, p: Finish, detail: boolean) {
  const turf = tone(p, 'Highland turf', '#516e42', 0.88);
  const darkStone = tone(p, 'Weathered megalith shade', '#5c615d', 0.88);
  const runeInlay = tone(p, 'Carved rune pale stone', '#b8bdb2', 0.84);
  const heatherBloom = tone(p, 'Moorland heather', '#945b8f', 0.8);
  const twig = tone(p, 'Heather wood', '#5c4a38', 0.86);

  const dolmen = group(root, 'NeolithicDolmen');
  mound(dolmen, p, [0, 0, 0], 1.54, 0.28, 1.46, turf);

  const pillars: readonly [Point, Point, Point][] = [
    [[-0.66, 0.86, 0.16], [0.42, 1.44, 0.56], [0.06, 0.18, -0.07]],
    [[0.64, 0.84, 0.12], [0.44, 1.4, 0.52], [-0.04, -0.22, 0.08]],
    [[0, 0.8, -0.62], [0.76, 1.32, 0.42], [0.08, 0.05, 0.02]],
  ];
  for (const [at, sc, rot] of pillars) {
    block(dolmen, p, at, sc, p.primary, rot);
    orb(dolmen, p, [at[0], at[1] + sc[1] * 0.48, at[2]], [sc[0] * 0.55, 0.12, sc[2] * 0.5], p.accent, 7);
  }

  const cap = group(dolmen, '', [0, 1.66, -0.06]);
  cap.rotation.set(-0.14, 0.05, 0.04);
  block(cap, p, [0, 0, 0], [1.96, 0.34, 1.56], p.primary);
  orb(cap, p, [0, 0.16, -0.04], [0.92, 0.14, 0.72], darkStone, 9);
  orb(cap, p, [-0.42, 0.24, 0.18], [0.46, 0.1, 0.38], p.accent, 8);
  orb(cap, p, [0.36, 0.22, -0.22], [0.52, 0.11, 0.42], p.accent, 8);

  const rune = group(dolmen, '', [-1.02, 0.16, 0.52]);
  rune.rotation.set(0.06, 0.42, -0.05);
  block(rune, p, [0, 0.54, 0], [0.38, 1.08, 0.18], darkStone);
  cone(rune, p, [0, 1.18, 0], 0.22, 0.24, darkStone, [0, Math.PI / 4, 0], 4);
  block(rune, p, [0, 0.72, 0.11], [0.22, 0.04, 0.035], runeInlay);
  block(rune, p, [0, 0.56, 0.11], [0.16, 0.04, 0.035], runeInlay, [0, 0, 0.45]);
  block(rune, p, [0, 0.42, 0.11], [0.16, 0.04, 0.035], runeInlay, [0, 0, -0.45]);

  const heather = group(dolmen, 'HeatherBush', [0.44, 1.78, -0.2]);
  taperArc(heather, p, [[0, -0.08, 0], [0.1, 0.2, 0.04], [0.2, 0.38, 0.08]], t => 0.045 * (1 - 0.45 * t), twig, 6, 5);
  taperArc(heather, p, [[0, -0.08, 0], [-0.12, 0.18, -0.06], [-0.22, 0.34, -0.1]], t => 0.04 * (1 - 0.45 * t), twig, 6, 5);
  orb(heather, p, [0.14, 0.36, 0.06], [0.32, 0.18, 0.28], p.accent, 8);
  orb(heather, p, [-0.16, 0.32, -0.08], [0.28, 0.16, 0.24], p.accent, 8);
  orb(heather, p, [0.18, 0.48, 0.1], [0.16, 0.1, 0.14], heatherBloom, 7);
  orb(heather, p, [-0.14, 0.44, -0.06], [0.14, 0.09, 0.13], heatherBloom, 7);

  const altar = group(dolmen, 'OfferingStone', [0.04, 0.14, 0.76]);
  rock(altar, p, [0, 0, 0], [0.38, 0.2, 0.3], p.primary, 2.3);
  cyl(altar, p, [0, 0.22, 0], 0.16, 0.18, 0.06, darkStone, [0, 0, 0], 10);
  orb(altar, p, [0.02, 0.26, -0.01], [0.065, 0.048, 0.06], runeInlay, 7);

  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.4;
      const kx = Math.sin(a) * 1.16;
      const kz = Math.cos(a) * 1.08;
      rock(dolmen, p, [kx, 0.1, kz], [0.18, 0.13, 0.16], i % 2 === 0 ? p.primary : darkStone, i + 1.7);
    }
    for (let i = 0; i < 4; i++) {
      const a = i * 1.5 + 0.8;
      orb(dolmen, p, [Math.sin(a) * 0.92, 0.28, Math.cos(a) * 0.86], [0.14, 0.09, 0.12], heatherBloom, 6);
    }
  }
  root.animations = [new T.AnimationClip('Moorland breeze', 4.0, [sway('HeatherBush', 'z', 4.0, -0.14, 0.14)])];
}

function buildKoiPond(root: T.Group, p: Finish, detail: boolean) {
  const moss = tone(p, 'Pond moss bank', '#527a44', 0.88);
  const stone = tone(p, 'River rim boulder', '#82878a', 0.84);
  const darkStone = tone(p, 'Tsukubai granite', '#63686c', 0.86);
  const lilyMat = tone(p, 'Lily pad emerald', '#4a8b48', 0.76);
  const blush = tone(p, 'Lotus pale petal', '#f4a6bc', 0.72);
  const koiCream = tone(p, 'Koi pearl cream', '#f2e4c4', 0.68);
  const bamboo = tone(p, 'Ladle bamboo', '#9b864c', 0.78);

  const pond = group(root, 'KoiLotusPond');
  mound(pond, p, [0, 0, 0], 1.56, 0.22, 1.48, moss);
  cyl(pond, p, [0, 0.21, 0], 1.04, 1.08, 0.1, p.primary, [0, 0, 0], 18);

  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12;
    const rx = Math.sin(a) * 1.12;
    const rz = Math.cos(a) * 1.06;
    rock(pond, p, [rx, 0.08 + (i % 2) * 0.02, rz], [0.28 + (i % 3) * 0.05, 0.2 + (i % 2) * 0.06, 0.24], i % 2 === 0 ? stone : darkStone, i + 1.2);
  }
  for (const [sx, sz] of [[-0.64, 0.94], [-0.18, 1.14], [0.34, 1.06]] as const) {
    cyl(pond, p, [sx, 0.23, sz], 0.22, 0.24, 0.08, stone, [0, sx, 0], 9);
  }

  const pads: readonly [number, number, number, boolean][] = [
    [-0.44, -0.34, 0.24, true], [0.46, 0.34, 0.22, true], [-0.54, 0.28, 0.19, false],
    [0.34, -0.52, 0.21, true], [0.02, -0.18, 0.17, false], [-0.16, 0.56, 0.18, false],
  ];
  for (const [lx, lz, r, hasFlower] of pads) {
    cyl(pond, p, [lx, 0.266, lz], r, r * 0.96, 0.026, lilyMat, [0, lx * 4, 0], 12);
    if (hasFlower) {
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        cone(pond, p, [lx + Math.sin(a) * 0.07, 0.34, lz + Math.cos(a) * 0.07], 0.048, 0.14, k % 2 === 0 ? p.accent : blush, [0.42 * Math.cos(a), a, -0.42 * Math.sin(a)], 6);
      }
      orb(pond, p, [lx, 0.33, lz], [0.045, 0.04, 0.045], koiCream, 6);
    }
  }

  for (let i = 0; i < 6; i++) {
    const a = -2.4 + i * 0.35;
    frond(pond, p, [-0.88, 0.22, -0.7], 0.98 + (i % 2) * 0.16, 0.055, 0.68, -0.18, lilyMat, a, -0.48);
  }
  orb(pond, p, [-0.84, 1.16, -0.68], [0.1, 0.08, 0.1], blush, 7);
  orb(pond, p, [-0.98, 1.06, -0.58], [0.09, 0.075, 0.09], p.accent, 7);

  const school = group(pond, 'KoiSchool', [0, 0.23, 0]);
  const fishSpecs: readonly [number, number, number][] = [
    [0.42, 0.2, 1.0],
    [0.64, 2.3, 0.92],
    [0.54, 4.4, 0.86],
  ];
  for (let i = 0; i < fishSpecs.length; i++) {
    const [rad, ang, sc] = fishSpecs[i] ?? [0.5, 0, 1];
    const fish = group(school, '', [Math.sin(ang) * rad, 0.015, Math.cos(ang) * rad]);
    fish.rotation.y = ang + Math.PI / 2;
    taperArc(
      fish,
      p,
      [[0, 0, -0.18 * sc], [0.02 * sc, 0.01, -0.04 * sc], [-0.02 * sc, 0.01, 0.1 * sc], [0.04 * sc, 0, 0.22 * sc]],
      t => (0.056 * sc) * Math.sin(Math.min(1, t * 0.9 + 0.12) * Math.PI),
      i === 1 ? koiCream : p.accent,
      8,
      6,
      [0.82, 1],
    );
    orb(fish, p, [0.01 * sc, 0.04 * sc, -0.02 * sc], [0.032 * sc, 0.024 * sc, 0.06 * sc], i === 1 ? p.accent : koiCream, 6);
    cone(fish, p, [0.04 * sc, 0.01, 0.25 * sc], 0.045 * sc, 0.09 * sc, p.accent, [-Math.PI / 2, 0, 0], 6);
  }

  const basin = group(pond, 'StoneBasin', [1.04, 0.09, -0.56]);
  lathe(basin, p, [0, 0, 0], [[0.01, 0], [0.24, 0], [0.3, 0.22], [0.28, 0.44], [0.2, 0.44], [0.18, 0.3], [0.01, 0.3]], darkStone, 12);
  cyl(basin, p, [0, 0.37, 0], 0.19, 0.19, 0.05, p.primary, [0, 0, 0], 10);
  cyl(basin, p, [0.04, 0.48, 0], 0.016, 0.016, 0.56, bamboo, [0, 0.4, Math.PI / 2], 6);
  cyl(basin, p, [-0.14, 0.48, -0.04], 0.052, 0.048, 0.09, bamboo, [0, 0, 0], 8);

  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + 0.35;
      rock(pond, p, [Math.sin(a) * 1.24, 0.09, Math.cos(a) * 1.18], [0.1, 0.06, 0.09], stone, i + 3.1);
    }
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + 1.1;
      orb(pond, p, [Math.sin(a) * 0.72, 0.29, Math.cos(a) * 0.72], [0.055, 0.07, 0.055], blush, 6);
    }
  }
  root.animations = [new T.AnimationClip('Koi circle', 5.6, [spin('KoiSchool', 'y', 5.6, 1)])];
}

function buildTidalPool(root: T.Group, p: Finish, detail: boolean) {
  const wetSlate = tone(p, 'Coastal wet slate', '#3d454d', 0.82);
  const seaBasalt = tone(p, 'Weathered sea basalt', '#59626b', 0.84);
  const kelpMat = tone(p, 'Coastal kelp', '#5c803b', 0.76);
  const barnacle = tone(p, 'Chalk barnacle', '#c8c4b4', 0.86);
  const urchin = tone(p, 'Sea urchin', '#6d4678', 0.8);

  const pool = group(root, 'RockyTidalPool');
  mound(pool, p, [0, 0, 0], 1.52, 0.22, 1.44, wetSlate);
  cyl(pool, p, [0.08, 0.21, 0.14], 0.88, 0.92, 0.1, p.primary, [0, 0, 0], 16);

  const shelfRocks: readonly [Point, Point, number][] = [
    [[-0.74, 0.08, -0.44], [0.64, 0.78, 0.56], 1.5],
    [[0.02, 0.08, -0.78], [0.76, 0.68, 0.48], 2.9],
    [[0.78, 0.08, -0.42], [0.56, 0.56, 0.48], 4.2],
    [[-0.96, 0.08, 0.26], [0.46, 0.46, 0.48], 5.3],
    [[-0.54, 0.08, 0.86], [0.44, 0.28, 0.36], 6.4],
    [[0.26, 0.08, 0.96], [0.46, 0.24, 0.34], 7.1],
  ];
  for (let i = 0; i < shelfRocks.length; i++) {
    const [at, sc, seed] = shelfRocks[i] ?? [[0, 0.1, 0], [0.3, 0.3, 0.3], 1];
    rock(pool, p, at, sc, i % 2 === 0 ? wetSlate : seaBasalt, seed);
  }
  cyl(pool, p, [-0.56, 0.62, -0.42], 0.34, 0.36, 0.08, p.primary, [0, 0, 0], 12);

  const addStar = (parent: T.Object3D, at: Point, sc: number, rot: Point) => {
    const g = group(parent, '', at);
    g.rotation.set(...rot);
    orb(g, p, [0, 0.02 * sc, 0], [0.06 * sc, 0.03 * sc, 0.06 * sc], p.accent, 6);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      taperArc(g, p, [[0, 0.02 * sc, 0], [Math.sin(a) * 0.16 * sc, 0.015 * sc, Math.cos(a) * 0.16 * sc]], t => 0.036 * sc * (1 - 0.62 * t), p.accent, 5, 5);
    }
  };
  addStar(pool, [-0.52, 0.34, 0.78], 1.15, [0.34, 0.2, 0.1]);
  addStar(pool, [0.68, 0.56, -0.34], 0.95, [0.22, -0.6, -0.35]);

  for (const [bx, by, bz] of [[-0.56, 0.44, 0.14], [-0.24, 0.56, -0.52], [0.56, 0.42, -0.14]] as const) {
    for (let k = 0; k < 4; k++) {
      const a = k * 1.55;
      cone(pool, p, [bx + Math.sin(a) * 0.08, by + (k % 2) * 0.03, bz + Math.cos(a) * 0.08], 0.042, 0.075, barnacle, [0.15, a, 0], 6);
    }
  }

  const kelp = group(pool, 'KelpFronds', [-0.08, 0.19, 0.02]);
  const strands: readonly [number, number, number, number][] = [
    [0, 0, 1.32, 0],
    [-0.18, 0.12, 1.16, 1.1],
    [0.2, -0.08, 1.24, 2.2],
    [-0.14, -0.18, 1.02, 3.4],
    [0.14, 0.18, 0.96, 4.5],
    [0.02, -0.24, 1.1, 5.4],
  ];
  for (const [kx, kz, h, phase] of strands) {
    const sx = Math.sin(phase) * 0.16;
    const sz = Math.cos(phase) * 0.14;
    taperArc(
      kelp,
      p,
      [[kx, 0, kz], [kx + sx, h * 0.36, kz + sz], [kx - sx * 0.8, h * 0.72, kz - sz * 0.5], [kx + sx * 0.9, h, kz + sz * 0.8]],
      t => 0.078 * (1 - 0.54 * t),
      kelpMat,
      9,
      5,
      [0.28, 1],
    );
    orb(kelp, p, [kx + sx * 0.5, h * 0.44, kz + sz * 0.5], [0.048, 0.06, 0.048], kelpMat, 6);
  }

  const boulders = group(pool, 'TideBoulders', [0.94, 0.08, 0.48]);
  rock(boulders, p, [0, 0, 0], [0.36, 0.28, 0.34], seaBasalt, 2.6);
  rock(boulders, p, [-0.26, 0.02, 0.22], [0.22, 0.16, 0.2], wetSlate, 4.8);
  addStar(boulders, [0.04, 0.3, 0.02], 0.85, [0.1, 0.5, -0.14]);

  if (detail) {
    for (const [ux, uy, uz] of [[0.36, 0.27, 0.42], [-0.36, 0.27, 0.34], [0.18, 0.28, -0.26]] as const) {
      orb(pool, p, [ux, uy, uz], [0.075, 0.06, 0.075], urchin, 7);
    }
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      cone(pool, p, [-0.72 + Math.sin(a) * 0.26, 0.68, -0.14 + Math.cos(a) * 0.22], 0.036, 0.065, barnacle, [0.2, a, 0], 6);
    }
  }
  root.animations = [new T.AnimationClip('Tidal sway', 4.0, [sway('KelpFronds', 'z', 4.0, -0.18, 0.18)])];
}

function buildAutumnMaple(root: T.Group, p: Finish, detail: boolean) {
  const hill = tone(p, 'Leaf-strewn hillside', '#5a693f', 0.88);
  const bark = tone(p, 'Japanese maple bark', '#523c32', 0.86);
  const scarlet = tone(p, 'Deep scarlet maple', '#9e2524', 0.8);
  const benchStone = tone(p, 'Garden granite bench', '#8b8882', 0.84);
  const moss = tone(p, 'Root moss', '#547d42', 0.86);

  const grove = group(root, 'AutumnMapleGrove');
  mound(grove, p, [0, 0, 0], 1.54, 0.26, 1.44, hill);

  taperArc(grove, p, [[-0.08, 0.14, -0.14], [-0.02, 0.84, -0.06], [0.06, 1.54, 0.02], [0.02, 2.02, 0]], t => 0.18 * (1 - 0.52 * t), bark, 11, 7);
  taperArc(grove, p, [[-0.52, 0.14, 0.16], [-0.66, 0.82, 0.22], [-0.84, 1.48, 0.24], [-0.9, 1.82, 0.18]], t => 0.13 * (1 - 0.5 * t), bark, 10, 6);
  taperArc(grove, p, [[0.46, 0.14, -0.3], [0.58, 0.74, -0.36], [0.74, 1.38, -0.4], [0.78, 1.72, -0.36]], t => 0.125 * (1 - 0.5 * t), bark, 10, 6);

  for (const [start, end] of [
    [[0.02, 1.36, 0], [0.52, 1.78, 0.36]],
    [[0, 1.44, -0.04], [-0.46, 1.82, -0.44]],
    [[-0.72, 1.18, 0.24], [-0.44, 1.54, 0.62]],
  ] as readonly [Point, Point][]) {
    taperArc(grove, p, [start, [(start[0] + end[0]) * 0.5, (start[1] + end[1]) * 0.55, (start[2] + end[2]) * 0.5], end], t => 0.08 * (1 - 0.5 * t), bark, 7, 5);
  }

  const canopy = group(grove, 'MapleCanopy', [0, 1.54, 0]);
  const clouds: readonly [Point, Point, number][] = [
    [[0.02, 0.94, 0], [0.84, 0.34, 0.78], 0],
    [[-0.78, 0.54, 0.22], [0.72, 0.3, 0.66], 1],
    [[0.74, 0.44, -0.34], [0.68, 0.28, 0.62], 2],
    [[0.46, 0.56, 0.44], [0.64, 0.28, 0.58], 1],
    [[-0.44, 0.58, -0.46], [0.64, 0.28, 0.58], 0],
    [[-0.32, 1.14, 0.16], [0.58, 0.26, 0.54], 1],
    [[0.36, 1.08, -0.14], [0.54, 0.25, 0.5], 0],
    [[-0.42, 0.24, 0.62], [0.5, 0.24, 0.46], 2],
  ];
  for (const [at, sc, kind] of clouds) {
    orb(canopy, p, at, sc, kind === 0 ? p.primary : kind === 1 ? p.accent : scarlet, 9);
  }

  const bench = group(grove, 'ParkBenchRock', [0.84, 0.08, 0.62]);
  block(bench, p, [-0.26, 0.14, 0], [0.16, 0.26, 0.28], benchStone, [0, 0.32, 0]);
  block(bench, p, [0.24, 0.14, -0.08], [0.16, 0.26, 0.28], benchStone, [0, 0.32, 0]);
  block(bench, p, [-0.01, 0.32, -0.04], [0.88, 0.14, 0.38], benchStone, [0, 0.32, 0]);
  orb(bench, p, [-0.3, 0.4, 0.04], [0.16, 0.045, 0.12], moss, 6);

  if (detail) {
    for (let i = 0; i < 12; i++) {
      const a = i * 0.54 + 0.2;
      const rad = 0.42 + (i % 3) * 0.28;
      const lx = Math.sin(a) * rad;
      const lz = Math.cos(a) * rad;
      orb(grove, p, [lx, moundY(lx, lz, 1.54, 0.26, 1.44) + 0.015, lz], [0.095, 0.02, 0.075], i % 2 === 0 ? p.primary : p.accent, 6);
    }
  }
  root.animations = [new T.AnimationClip('Autumn breeze', 4.2, [sway('MapleCanopy', 'z', 4.2, -0.14, 0.14)])];
}

function buildMangrove(root: T.Group, p: Finish, detail: boolean) {
  const estuary = waterTone(p, 'Brackish estuary water', '#398f94', '#164d54');
  const sandbar = tone(p, 'Tidal mudbar', '#877558', 0.9);
  const canopyBright = tone(p, 'Sunlit mangrove leaf', '#5a9952', 0.76);
  const oyster = tone(p, 'Estuary oyster shell', '#9a958b', 0.86);
  const seedMat = tone(p, 'Mangrove propagule', '#6f9c46', 0.76);

  const island = group(root, 'MangroveIsland');
  cyl(island, p, [0, 0.05, 0], 1.5, 1.52, 0.1, estuary, [0, 0, 0], 18);
  mound(island, p, [0, 0.03, 0], 1.06, 0.25, 1.0, sandbar);

  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12 + (i % 2) * 0.14;
    const sx = Math.sin(a);
    const sz = Math.cos(a);
    const topY = 0.84 + (i % 3) * 0.18;
    const reach = 0.72 + (i % 3) * 0.22;
    taperArc(
      island,
      p,
      [[sx * 0.14, topY, sz * 0.14], [sx * reach * 0.62, topY * 0.68, sz * reach * 0.62], [sx * reach, 0.34, sz * reach], [sx * reach * 1.06, 0.06, sz * reach * 1.06]],
      t => 0.072 * (1 - 0.35 * t),
      p.accent,
      9,
      6,
    );
  }

  taperArc(island, p, [[-0.08, 0.72, -0.06], [0.02, 1.32, 0], [0.06, 1.84, 0.04]], t => 0.22 * (1 - 0.42 * t), p.accent, 9, 7);
  for (const end of [[0.62, 2.02, 0.26], [-0.58, 1.98, 0.24], [0.34, 2.04, -0.56], [-0.42, 1.96, -0.48]] as readonly Point[]) {
    taperArc(island, p, [[0.02, 1.52, 0], [end[0] * 0.55, 1.84, end[2] * 0.55], end], t => 0.1 * (1 - 0.48 * t), p.accent, 7, 6);
  }

  const crown = group(island, 'MangroveCrown', [0, 1.72, 0]);
  const dome: readonly [Point, Point, boolean][] = [
    [[0, 0.62, 0], [0.92, 0.42, 0.88], false],
    [[0.68, 0.38, 0.28], [0.7, 0.36, 0.64], true],
    [[-0.68, 0.36, 0.24], [0.68, 0.34, 0.64], false],
    [[0.32, 0.4, -0.62], [0.66, 0.34, 0.62], false],
    [[-0.42, 0.34, -0.56], [0.64, 0.34, 0.6], true],
    [[0.04, 0.34, 0.66], [0.62, 0.32, 0.58], true],
    [[0.36, 0.82, -0.14], [0.58, 0.3, 0.54], true],
  ];
  for (const [at, sc, bright] of dome) {
    orb(crown, p, at, sc, bright ? canopyBright : p.primary, 9);
  }

  const reef = group(island, 'OysterReef', [0.92, 0.05, 0.56]);
  rock(reef, p, [0, 0, 0], [0.38, 0.22, 0.32], oyster, 2.2);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    orb(reef, p, [Math.sin(a) * 0.2, 0.16 + (i % 2) * 0.05, Math.cos(a) * 0.18], [0.12, 0.045, 0.08], oyster, 6, [0.35, a, 0.25]);
  }

  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + 0.3;
      cone(island, p, [Math.sin(a) * 0.86, 0.22, Math.cos(a) * 0.82], 0.025, 0.28, p.accent, [0, a, 0], 6);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      cone(crown, p, [Math.sin(a) * 0.68, 0.06, Math.cos(a) * 0.64], 0.03, 0.24, seedMat, [Math.PI, a, 0], 6);
    }
  }
  root.animations = [new T.AnimationClip('Estuary breeze', 4.2, [sway('MangroveCrown', 'z', 4.2, -0.13, 0.13)])];
}

export const terrainBiomesBuildersC: readonly BiomeBuilderDef[] = [
  {
    id: 'mossy-neolithic-dolmen',
    riggedParts: [{ name: 'HeatherBush', label: 'Moorland heather bush', type: 'rotate', axis: 'z', range: [-12, 12], describe: 'Sways the blooming heather bush rooted atop the capstone' }],
    detachableParts: [{ name: 'OfferingStone', label: 'Carved offering stone', describe: 'Removable ritual altar stone before the dolmen chamber' }],
    build: buildDolmen,
  },
  {
    id: 'koi-lotus-pond',
    riggedParts: [{ name: 'KoiSchool', label: 'Circling koi school', type: 'rotate', axis: 'y', range: [0, 360], describe: 'Circles the trio of koi fish lazily beneath the lily pads' }],
    detachableParts: [{ name: 'StoneBasin', label: 'Garden stone basin', describe: 'Removable carved stone water basin and bamboo ladle at the rim' }],
    build: buildKoiPond,
  },
  {
    id: 'rocky-tidal-pool',
    riggedParts: [{ name: 'KelpFronds', label: 'Waving kelp fronds', type: 'rotate', axis: 'z', range: [-16, 16], describe: 'Waves the buoyant coastal kelp fronds in the tidal surge' }],
    detachableParts: [{ name: 'TideBoulders', label: 'Barnacle tide boulders', describe: 'Removable coastal slate boulders with perched sea star' }],
    build: buildTidalPool,
  },
  {
    id: 'autumn-maple-grove',
    riggedParts: [{ name: 'MapleCanopy', label: 'Autumn maple canopy', type: 'rotate', axis: 'z', range: [-12, 12], describe: 'Sways the layered crimson and amber Japanese maple canopy' }],
    detachableParts: [{ name: 'ParkBenchRock', label: 'Granite bench boulder', describe: 'Removable flat-topped granite garden bench boulder on the slope' }],
    build: buildAutumnMaple,
  },
  {
    id: 'mangrove-root-island',
    riggedParts: [{ name: 'MangroveCrown', label: 'Mangrove tropical crown', type: 'rotate', axis: 'z', range: [-11, 11], describe: 'Sways the broad glossy tropical canopy over the prop roots' }],
    detachableParts: [{ name: 'OysterReef', label: 'Estuary oyster reef', describe: 'Removable craggy cluster of estuary oyster shells in the shallows' }],
    build: buildMangrove,
  },
];
