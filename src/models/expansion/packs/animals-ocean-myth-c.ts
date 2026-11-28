import * as T from 'three';
import {
  arc, cap, cone, cyl, eye, group, lathe, orb, quadLegs, rot, shell, sway, tone,
} from './animals-ocean-myth-kit';
import type { Finish, OceanMythSpec } from './animals-ocean-myth-kit';

function buildGriffin(root: T.Group, p: Finish, detail: boolean) {
  const beak = tone(p, 'Griffin beak', '#e5a928', 0.52, 0.14);
  const body = group(root, 'GriffinBody');
  orb(body, p, [0, 0.86, 0], [0.36, 0.36, 0.68], p.primary, 10);
  orb(body, p, [0, 0.96, 0.42], [0.34, 0.36, 0.34], p.accent, 10);
  quadLegs(body, p, 0.26, 0.46, -0.46, 0.82, 0.82, 0.12, 0.09, p.primary, beak);
  const tail = group(body, 'GriffinTail', [0, 0.84, -0.64]);
  arc(tail, p, [[0, 0, 0], [0.1, -0.06, -0.34], [0.14, 0.14, -0.68]], 0.055, p.primary, 10, 6);
  orb(tail, p, [0.14, 0.2, -0.74], [0.1, 0.12, 0.14], p.accent, 8);
  for (const [side, name] of [[1, 'WingL'], [-1, 'WingR']] as const) {
    const wing = group(body, name, [side * 0.32, 1.12, 0.12]);
    orb(wing, p, [side * 0.38, 0.12, -0.14], [0.46, 0.14, 0.28], p.accent, 9).rotation.z = side * 0.28;
    orb(wing, p, [side * 0.78, 0.26, -0.22], [0.44, 0.1, 0.22], p.primary, 9).rotation.z = side * 0.16;
    if (detail) {
      for (let i = 0; i < 4; i++) cone(wing, p, [side * (0.56 + i * 0.18), 0.18 + i * 0.04, -0.34], 0.055, 0.3, p.accent, [-1.4, 0, -side * 0.35], 6);
    }
  }
  const head = group(body, 'GriffinHead', [0, 1.32, 0.54]);
  orb(head, p, [0, 0.12, 0.06], [0.22, 0.22, 0.24], p.accent, 10);
  cone(head, p, [0, 0.1, 0.34], 0.08, 0.28, beak, [Math.PI * 0.56, 0, 0], 8);
  cone(head, p, [0, 0.03, 0.44], 0.045, 0.14, beak, [Math.PI * 0.85, 0, 0], 7);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.18, 0.32, -0.06], 0.06, 0.22, p.accent, [-0.35, 0, -s * 0.3], 7);
    eye(head, p, [s * 0.15, 0.16, 0.2], 0.038, detail);
  }
  root.animations = [
    new T.AnimationClip('Sky guard', 2.8, [
      sway('WingL', 'z', 2.8, -0.22, 0.65),
      sway('WingR', 'z', 2.8, -0.65, 0.22),
      sway('GriffinHead', 'y', 2.8, -0.45, 0.45),
      sway('GriffinTail', 'y', 2.8, -0.45, 0.45),
    ]),
  ];
}

function buildPhoenix(root: T.Group, p: Finish, detail: boolean) {
  const spire = tone(p, 'Ember rock', '#473c38', 0.86, 0.06);
  const flame = tone(p, 'Solar flare', '#ffbe0b', 0.32, 0.12, '#fb5607');
  const body = group(root, 'PhoenixBody');
  cyl(body, p, [0, 0.24, 0], 0.34, 0.5, 0.48, spire, [0, 0, 0], 8);
  lathe(body, p, [0, 0.46, 0], [
    [0.01, 0], [0.2, 0.1], [0.3, 0.36], [0.28, 0.7], [0.18, 0.94], [0.01, 1.02],
  ], p.primary);
  for (const s of [-1, 1]) cyl(body, p, [s * 0.12, 0.48, 0.04], 0.048, 0.036, 0.2, p.accent);
  for (const [side, name] of [[1, 'WingL'], [-1, 'WingR']] as const) {
    const wing = group(body, name, [side * 0.26, 1.14, 0]);
    orb(wing, p, [side * 0.4, 0.14, -0.06], [0.48, 0.14, 0.24], p.primary, 9).rotation.z = side * 0.36;
    orb(wing, p, [side * 0.84, 0.38, -0.12], [0.46, 0.1, 0.2], flame, 9).rotation.z = side * 0.26;
    if (detail) {
      for (let i = 0; i < 4; i++) cone(wing, p, [side * (0.46 + i * 0.22), 0.14 + i * 0.12, -0.22], 0.06, 0.36, p.accent, [-1.3, 0, -side * 0.5], 6);
    }
  }
  const plumes = group(body, 'TailPlumes', [0, 0.58, -0.24]);
  for (const x of [-0.16, 0, 0.16]) {
    arc(plumes, p, [[x * 0.4, 0, 0], [x, -0.12, -0.44], [x * 1.4, 0.16, -0.88]], 0.055, x === 0 ? flame : p.accent, 10, 6);
  }
  const head = group(body, 'PhoenixHead', [0, 1.46, 0.06]);
  orb(head, p, [0, 0.12, 0.02], [0.18, 0.18, 0.2], p.primary, 9);
  cone(head, p, [0, 0.1, 0.24], 0.055, 0.2, p.accent, [Math.PI * 0.55, 0, 0], 8);
  for (let i = 0; i < 3; i++) cone(head, p, [0, 0.28 + i * 0.04, -0.1 - i * 0.08], 0.045, 0.28, flame, [-0.85, 0, 0], 6);
  for (const s of [-1, 1]) eye(head, p, [s * 0.12, 0.16, 0.15], 0.034, detail);
  root.animations = [
    new T.AnimationClip('Solar rebirth', 2.8, [
      sway('WingL', 'z', 2.8, -0.2, 0.68),
      sway('WingR', 'z', 2.8, -0.68, 0.2),
      sway('TailPlumes', 'x', 2.8, -0.35, 0.35),
      sway('PhoenixHead', 'x', 2.8, -0.25, 0.25),
    ]),
  ];
}

function buildUnicorn(root: T.Group, p: Finish, detail: boolean) {
  const glow = tone(p, 'Moon horn', '#c4b5fd', 0.32, 0.2, '#8b5cf6');
  const body = group(root, 'UnicornBody');
  orb(body, p, [0, 1.04, 0], [0.34, 0.34, 0.72], p.primary, 10);
  quadLegs(body, p, 0.22, 0.48, -0.48, 0.98, 0.98, 0.1, 0.068, p.primary, p.accent);
  const tail = group(body, 'UnicornTail', [0, 1.06, -0.68]);
  arc(tail, p, [[0, 0, 0], [0.06, -0.28, -0.28], [0.1, -0.62, -0.36]], 0.1, p.accent, 10, 7);
  cap(body, p, [0, 1.38, 0.52], 0.17, 0.44, p.primary, [-0.32, 0, 0], 9);
  for (let i = 0; i < 4; i++) orb(body, p, [0, 1.54 - i * 0.12, 0.36 + i * 0.04], [0.08, 0.11, 0.12], p.accent, 7);
  const head = group(body, 'UnicornHead', [0, 1.66, 0.64]);
  orb(head, p, [0, 0.06, 0.08], [0.17, 0.17, 0.22], p.primary, 9);
  cyl(head, p, [0, -0.02, 0.34], 0.075, 0.11, 0.28, p.primary, [Math.PI * 0.56, 0, 0], 9);
  cone(head, p, [0, 0.34, 0.28], 0.055, 0.54, glow, [0.58, 0, 0], 10);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.12, 0.24, -0.02], 0.05, 0.18, p.primary, [0.1, 0, -s * 0.24], 7);
    eye(head, p, [s * 0.14, 0.1, 0.22], 0.034, detail);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [0.48, -0.48]) orb(body, p, [s * 0.22, 0.14, z - 0.03], [0.085, 0.08, 0.09], p.accent, 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Moon bow', 3.0, [
      sway('UnicornHead', 'x', 3.0, -0.32, 0.38),
      sway('UnicornTail', 'y', 3.0, -0.45, 0.45),
    ]),
  ];
}

function buildPegasus(root: T.Group, p: Finish, detail: boolean) {
  const cloud = tone(p, 'Cloud plinth', '#dce7f0', 0.78, 0.05);
  const body = group(root, 'PegasusBody');
  shell(body, [0, 0.09, 0], [1.24, 0.18, 1.72], cloud, 0.56);
  orb(body, p, [0, 1.12, 0], [0.34, 0.34, 0.7], p.primary, 10);
  for (const s of [-1, 1]) {
    for (const z of [0.46, -0.46]) {
      cyl(body, p, [s * 0.22, 0.58, z], 0.1, 0.07, 0.9, p.primary);
      orb(body, p, [s * 0.22, 0.16, z + 0.03], [0.085, 0.06, 0.1], p.accent, 8);
    }
  }
  const tail = group(body, 'PegasusTail', [0, 1.14, -0.66]);
  arc(tail, p, [[0, 0, 0], [0.06, -0.26, -0.3], [0.1, -0.56, -0.42]], 0.1, p.accent, 10, 7);
  for (const [side, name] of [[1, 'WingL'], [-1, 'WingR']] as const) {
    const wing = group(body, name, [side * 0.3, 1.32, 0.16]);
    orb(wing, p, [side * 0.42, 0.2, -0.14], [0.5, 0.14, 0.28], p.primary, 9).rotation.z = side * 0.36;
    orb(wing, p, [side * 0.88, 0.42, -0.24], [0.48, 0.1, 0.22], p.accent, 9).rotation.z = side * 0.24;
    if (detail) {
      for (let i = 0; i < 4; i++) cone(wing, p, [side * (0.58 + i * 0.2), 0.24 + i * 0.1, -0.34], 0.055, 0.32, p.stencil, [-1.4, 0, -side * 0.4], 6);
    }
  }
  cap(body, p, [0, 1.46, 0.5], 0.17, 0.42, p.primary, [-0.3, 0, 0], 9);
  const head = group(body, 'PegasusHead', [0, 1.72, 0.62]);
  orb(head, p, [0, 0.06, 0.08], [0.17, 0.17, 0.22], p.primary, 9);
  cyl(head, p, [0, -0.02, 0.34], 0.075, 0.11, 0.28, p.primary, [Math.PI * 0.56, 0, 0], 9);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.12, 0.24, -0.02], 0.05, 0.18, p.primary, [0.1, 0, -s * 0.24], 7);
    eye(head, p, [s * 0.14, 0.1, 0.22], 0.034, detail);
  }
  root.animations = [
    new T.AnimationClip('Sky soar', 2.8, [
      sway('WingL', 'z', 2.8, -0.22, 0.68),
      sway('WingR', 'z', 2.8, -0.68, 0.22),
      sway('PegasusHead', 'y', 2.8, -0.4, 0.4),
      sway('PegasusTail', 'y', 2.8, -0.4, 0.4),
    ]),
  ];
}

function buildStoneGolem(root: T.Group, p: Finish, detail: boolean) {
  const rune = tone(p, 'Rune core', '#38e54d', 0.3, 0.16, '#2b9348');
  const body = group(root, 'GolemBody');
  for (const s of [-1, 1]) {
    shell(body, [s * 0.38, 0.14, 0.04], [0.42, 0.28, 0.54], p.primary, 0.36);
    shell(body, [s * 0.38, 0.56, 0], [0.36, 0.6, 0.4], p.primary, 0.34);
  }
  shell(body, [0, 0.92, 0], [0.96, 0.34, 0.62], p.primary, 0.38);
  shell(body, [0, 1.54, 0], [1.32, 0.96, 0.84], p.primary, 0.36);
  orb(body, p, [0, 1.56, 0.44], [0.22, 0.22, 0.12], rune, 8);
  for (const [side, name] of [[1, 'FistArmL'], [-1, 'FistArmR']] as const) {
    orb(body, p, [side * 0.56, 2.02, 0], [0.34, 0.2, 0.34], p.accent, 8);
    const arm = group(body, name, [side * 0.72, 1.78, 0]);
    orb(arm, p, [0, 0, 0], [0.22, 0.22, 0.22], p.primary, 8);
    shell(arm, [side * 0.14, -0.34, 0.06], [0.34, 0.64, 0.38], p.primary, 0.38);
    shell(arm, [side * 0.18, -0.94, 0.14], [0.42, 0.62, 0.46], p.primary, 0.34);
    orb(arm, p, [side * 0.18, -0.62, 0.1], [0.22, 0.16, 0.22], p.accent, 7);
  }
  const head = group(body, 'GolemHead', [0, 2.08, 0.06]);
  shell(head, [0, 0.22, 0], [0.54, 0.48, 0.48], p.primary, 0.34);
  orb(head, p, [0, 0.46, -0.02], [0.28, 0.14, 0.26], p.accent, 8);
  for (const s of [-1, 1]) orb(head, p, [s * 0.14, 0.26, 0.26], [0.06, 0.04, 0.04], rune, 7);
  if (detail) {
    for (const [x, y, z] of [[-0.4, 1.32, 0.42], [0.38, 1.72, -0.4], [0, 1.88, -0.4]] as const) {
      orb(body, p, [x, y, z], [0.18, 0.12, 0.1], p.accent, 7);
    }
  }
  root.animations = [
    new T.AnimationClip('Boulder smash', 3.0, [
      sway('FistArmL', 'x', 3.0, -0.82, 0.35),
      sway('FistArmR', 'x', 3.0, 0.35, -0.82),
      sway('GolemHead', 'y', 3.0, -0.45, 0.45),
    ]),
  ];
}

function buildKitsune(root: T.Group, p: Finish, detail: boolean) {
  const orbGlow = tone(p, 'Shrine orb', '#fb8500', 0.3, 0.18, '#e85d04');
  const body = group(root, 'KitsuneBody');
  orb(body, p, [0, 0.62, 0.04], [0.26, 0.24, 0.54], p.primary, 10);
  orb(body, p, [0, 0.66, 0.38], [0.25, 0.25, 0.26], p.primary, 10);
  quadLegs(body, p, 0.18, 0.34, -0.34, 0.52, 0.52, 0.075, 0.052, p.primary, p.accent);
  cyl(body, p, [0, 0.78, 0.44], 0.18, 0.2, 0.1, p.accent, [0.35, 0, 0], 10);
  orb(body, p, [0, 0.74, 0.62], [0.075, 0.075, 0.075], orbGlow, 8);
  const head = group(body, 'KitsuneHead', [0, 0.9, 0.48]);
  orb(head, p, [0, 0.04, 0.06], [0.22, 0.18, 0.22], p.primary, 10);
  cone(head, p, [0, -0.02, 0.3], 0.11, 0.28, p.primary, [Math.PI * 0.52, 0, 0], 8);
  orb(head, p, [0, -0.02, 0.44], [0.042, 0.035, 0.038], p.inset, 7);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.15, 0.28, -0.02], 0.09, 0.3, p.primary, [0.08, 0, -s * 0.24], 8);
    if (detail) cone(head, p, [s * 0.15, 0.27, 0.02], 0.05, 0.2, p.accent, [0.08, 0, -s * 0.24], 7);
    eye(head, p, [s * 0.12, 0.08, 0.2], 0.036, detail);
  }
  const tails = group(body, 'NineTails', [0, 0.64, -0.46]);
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.28;
    const spreadX = Math.sin(a) * 0.88;
    const liftY = Math.cos(a) * 0.76 + 0.14;
    arc(tails, p, [
      [0, 0, 0],
      [spreadX * 0.52, liftY * 0.48, -0.34],
      [spreadX, liftY, -0.58],
    ], 0.085, p.primary, 10, 6);
    cone(tails, p, [spreadX * 1.14, liftY * 1.12, -0.64], 0.1, 0.26, p.accent, [-0.55, 0, -a], 7);
  }
  root.animations = [
    new T.AnimationClip('Spirit fan', 3.0, [
      sway('NineTails', 'y', 3.0, -0.42, 0.42),
      sway('KitsuneHead', 'y', 3.0, -0.5, 0.5),
    ]),
  ];
}

export const animalsOceanMythC: readonly OceanMythSpec[] = [
  {
    id: 'lion-eagle-griffin',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('WingL', 'Left eagle wing', 'z', [-18, 48], 'Flaps the left feathered griffin wing'),
      rot('WingR', 'Right eagle wing', 'z', [-48, 18], 'Flaps the right feathered griffin wing'),
      rot('GriffinHead', 'Eagle head', 'y', [-40, 40], 'Turns the hooked-beak griffin head'),
      rot('GriffinTail', 'Lion tail', 'y', [-38, 38], 'Swishes the tufted lion tail'),
    ],
    build: buildGriffin,
  },
  {
    id: 'blazing-fire-phoenix',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('WingL', 'Left flame wing', 'z', [-16, 48], 'Spreads the radiant left flame wing'),
      rot('WingR', 'Right flame wing', 'z', [-48, 16], 'Spreads the radiant right flame wing'),
      rot('TailPlumes', 'Flame tail plumes', 'x', [-28, 28], 'Sweeps the flowing fiery tail ribbons'),
      rot('PhoenixHead', 'Crested head', 'x', [-22, 22], 'Nods the flame-crested phoenix head'),
    ],
    build: buildPhoenix,
  },
  {
    id: 'horned-moon-unicorn',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('UnicornHead', 'Horned head', 'x', [-25, 32], 'Bows the spiraled moon-horn unicorn head'),
      rot('UnicornTail', 'Flowing tail', 'y', [-38, 38], 'Swishes the flowing moonlit tail'),
    ],
    build: buildUnicorn,
  },
  {
    id: 'winged-pegasus',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('WingL', 'Left wing', 'z', [-18, 48], 'Flaps the left feathered pegasus wing'),
      rot('WingR', 'Right wing', 'z', [-48, 18], 'Flaps the right feathered pegasus wing'),
      rot('PegasusHead', 'Stallion head', 'y', [-35, 35], 'Turns the proud winged stallion head'),
      rot('PegasusTail', 'Flowing tail', 'y', [-35, 35], 'Swishes the celestial stallion tail'),
    ],
    build: buildPegasus,
  },
  {
    id: 'mossy-stone-golem',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('FistArmL', 'Left boulder arm', 'x', [-55, 25], 'Swings the heavy left stone golem fist'),
      rot('FistArmR', 'Right boulder arm', 'x', [-55, 25], 'Swings the heavy right stone golem fist'),
      rot('GolemHead', 'Monolith head', 'y', [-38, 38], 'Turns the mossy carved golem head'),
    ],
    build: buildStoneGolem,
  },
  {
    id: 'nine-tailed-kitsune',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('NineTails', 'Nine-tail crown', 'y', [-35, 35], 'Sways the mystic nine-tailed spirit fan'),
      rot('KitsuneHead', 'Kitsune head', 'y', [-42, 42], 'Turns the folklore spirit fox head'),
    ],
    build: buildKitsune,
  },
];
