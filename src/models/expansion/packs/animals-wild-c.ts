import * as T from 'three';
import {
  arc, cap, cone, cyl, eye, group, lathe, orb, quadLegs, rot, shell, sway, tone,
} from './animals-wild-kit';
import type { Finish, WildAnimalSpec } from './animals-wild-kit';

function buildAlpaca(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'AlpacaBody');
  orb(body, p, [0, 0.86, 0], [0.34, 0.34, 0.56], p.primary);
  for (const [x, y, z] of [[-0.18, 0.96, 0.2], [0.18, 0.96, 0.2], [-0.18, 0.92, -0.22], [0.18, 0.92, -0.22], [0, 1.04, -0.02]] as const) {
    orb(body, p, [x, y, z], [0.22, 0.22, 0.24], p.primary, 8);
  }
  quadLegs(body, p, 0.22, 0.34, -0.36, 0.78, 0.08, 0.055, p.primary, p.accent);
  const head = group(body, 'AlpacaHead', [0, 1.06, 0.44]);
  cyl(head, p, [0, 0.34, 0.06], 0.14, 0.18, 0.64, p.primary, [0.12, 0, 0], 10);
  orb(head, p, [0, 0.68, 0.12], [0.2, 0.18, 0.2], p.primary);
  orb(head, p, [0, 0.78, 0.14], [0.18, 0.12, 0.16], p.primary, 8);
  orb(head, p, [0, 0.62, 0.3], [0.1, 0.09, 0.12], p.accent, 8);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.13, 0.88, 0.06], 0.055, 0.22, p.accent, [0.08, 0, -s * 0.18], 8);
    eye(head, p, [s * 0.12, 0.68, 0.26], 0.034, detail);
  }
  const tail = group(body, 'AlpacaTail', [0, 0.86, -0.54]);
  orb(tail, p, [0, -0.06, -0.12], [0.12, 0.14, 0.16], p.accent, 8);
  if (detail) {
    for (let i = 0; i < 4; i++) orb(head, p, [0, 0.24 + i * 0.14, 0.16], [0.14, 0.1, 0.12], p.primary, 7);
  }
  root.animations = [
    new T.AnimationClip('Andean graze', 3.0, [
      sway('AlpacaHead', 'y', 3.0, -0.45, 0.45),
      sway('AlpacaTail', 'y', 3.0, -0.45, 0.45),
    ]),
  ];
}

function buildCorgiPup(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'CorgiBody');
  orb(body, p, [0, 0.38, 0], [0.28, 0.24, 0.56], p.primary);
  orb(body, p, [0, 0.38, 0.36], [0.26, 0.25, 0.26], p.accent);
  orb(body, p, [0, 0.28, 0], [0.22, 0.14, 0.44], p.accent);
  quadLegs(body, p, 0.2, 0.34, -0.34, 0.28, 0.082, 0.065, p.accent, p.accent);
  const head = group(body, 'CorgiHead', [0, 0.58, 0.48]);
  orb(head, p, [0, 0.06, 0.06], [0.24, 0.22, 0.22], p.primary);
  orb(head, p, [0, -0.02, 0.24], [0.14, 0.1, 0.16], p.accent, 8);
  orb(head, p, [0, 0.02, 0.38], [0.05, 0.04, 0.042], p.inset, 8);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.2, 0.32, 0.02], 0.11, 0.32, p.primary, [0.08, 0, -s * 0.32], 8);
    if (detail) cone(head, p, [s * 0.2, 0.3, 0.06], 0.065, 0.2, p.accent, [0.08, 0, -s * 0.32], 7);
    eye(head, p, [s * 0.13, 0.1, 0.22], 0.04, detail);
  }
  const tail = group(body, 'CorgiTail', [0, 0.44, -0.52]);
  orb(tail, p, [0, 0.06, -0.1], [0.11, 0.11, 0.14], p.accent, 8);
  if (detail) {
    orb(head, p, [0, 0.14, 0.24], [0.06, 0.14, 0.05], p.accent, 7);
  }
  root.animations = [
    new T.AnimationClip('Happy wag', 2.4, [
      sway('CorgiTail', 'y', 2.4, -0.65, 0.65),
      sway('CorgiHead', 'z', 2.4, -0.32, 0.32),
    ]),
  ];
}

function buildCheetah(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'CheetahBody');
  orb(body, p, [0, 0.78, 0.04], [0.28, 0.24, 0.66], p.primary);
  orb(body, p, [0, 0.82, 0.36], [0.26, 0.27, 0.26], p.primary);
  quadLegs(body, p, 0.22, 0.46, -0.48, 0.74, 0.085, 0.06, p.primary, p.accent);
  const head = group(body, 'CheetahHead', [0, 1.0, 0.66]);
  orb(head, p, [0, 0.06, 0.06], [0.17, 0.16, 0.19], p.primary);
  orb(head, p, [0, 0, 0.22], [0.1, 0.08, 0.11], p.primary, 8);
  orb(head, p, [0, 0.03, 0.32], [0.04, 0.035, 0.038], p.inset, 7);
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.13, 0.19, 0], [0.06, 0.065, 0.04], p.primary, 7);
    eye(head, p, [s * 0.095, 0.09, 0.2], 0.032, detail);
    if (detail) cap(head, p, [s * 0.075, 0.01, 0.24], 0.016, 0.09, p.accent, [0.2, 0, s * 0.2], 6);
  }
  const tail = group(body, 'CheetahTail', [0, 0.78, -0.58]);
  arc(tail, p, [[0, 0, 0], [0.12, -0.1, -0.38], [0.24, -0.02, -0.82], [0.18, 0.18, -1.12]], 0.055, p.primary, 12, 7);
  orb(tail, p, [0.18, 0.2, -1.14], [0.06, 0.06, 0.1], p.accent, 7);
  for (let i = 0; i < 8; i++) {
    const s = i % 2 === 0 ? 1 : -1;
    orb(body, p, [s * 0.27, 0.78 + (i % 3) * 0.04, -0.38 + i * 0.12], [0.036, 0.044, 0.044], p.accent, 6);
  }
  root.animations = [
    new T.AnimationClip('Savanna sprint', 2.6, [
      sway('CheetahTail', 'y', 2.6, -0.52, 0.52),
      sway('CheetahHead', 'y', 2.6, -0.38, 0.38),
    ]),
  ];
}

function buildHornedOwl(root: T.Group, p: Finish, detail: boolean) {
  const perch = tone(p, 'Oak log', '#5c4332', 0.86, 0.04);
  const amber = tone(p, 'Owl iris', '#f2a922', 0.35, 0.1, '#d97706');
  const body = group(root, 'HornedOwlBody');
  cyl(body, p, [0, 0.14, 0], 0.16, 0.16, 0.96, perch, [0, 0, Math.PI / 2], 10);
  lathe(body, p, [0, 0.24, 0], [
    [0.01, 0], [0.24, 0.1], [0.36, 0.32], [0.34, 0.68], [0.24, 0.96], [0.01, 1.04],
  ], p.primary);
  orb(body, p, [0, 0.68, 0.18], [0.26, 0.36, 0.2], p.accent);
  cone(body, p, [0, 0.36, -0.34], 0.16, 0.44, p.primary, [-2.1, 0, 0], 8);
  for (const [side, name] of [[1, 'WingL'], [-1, 'WingR']] as const) {
    cyl(body, p, [side * 0.14, 0.28, 0.06], 0.055, 0.045, 0.16, p.accent);
    const wing = group(body, name, [side * 0.32, 0.98, -0.02]);
    orb(wing, p, [side * 0.14, -0.22, -0.04], [0.12, 0.34, 0.22], p.primary, 9).rotation.z = side * 0.26;
    if (detail) orb(wing, p, [side * 0.18, -0.36, -0.08], [0.08, 0.26, 0.14], p.accent, 8).rotation.z = side * 0.22;
  }
  const head = group(body, 'OwlHead', [0, 1.24, 0.04]);
  orb(head, p, [0, 0.14, 0], [0.28, 0.24, 0.25], p.primary);
  cone(head, p, [0, 0.08, 0.28], 0.05, 0.14, p.dark, [Math.PI * 0.65, 0, 0], 8);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.22, 0.38, 0.02], 0.07, 0.26, p.primary, [0.08, 0, -s * 0.42], 8);
    orb(head, p, [s * 0.12, 0.16, 0.21], [0.09, 0.09, 0.05], amber, 8);
    eye(head, p, [s * 0.12, 0.16, 0.25], 0.042, detail);
  }
  root.animations = [
    new T.AnimationClip('Forest hoot', 3.4, [
      sway('OwlHead', 'y', 3.4, -1.1, 1.1),
      sway('WingL', 'z', 3.4, 0, 0.72),
      sway('WingR', 'z', 3.4, -0.72, 0),
    ]),
  ];
}

function buildWalrus(root: T.Group, p: Finish, detail: boolean) {
  const ice = tone(p, 'Arctic floe', '#c7e5f2', 0.48, 0.12);
  const body = group(root, 'WalrusBody');
  shell(body, [0, 0.08, 0], [1.34, 0.16, 1.88], ice, 0.56);
  orb(body, p, [0, 0.44, -0.04], [0.48, 0.36, 0.76], p.primary);
  orb(body, p, [0, 0.36, -0.74], [0.36, 0.22, 0.34], p.primary, 9);
  for (const [side, name] of [[1, 'FlipperL'], [-1, 'FlipperR']] as const) {
    const fl = group(body, name, [side * 0.42, 0.28, 0.28]);
    orb(fl, p, [side * 0.24, -0.06, 0.06], [0.28, 0.08, 0.22], p.primary, 8).rotation.y = -side * 0.35;
    orb(body, p, [side * 0.18, 0.22, -0.96], [0.16, 0.07, 0.22], p.primary, 8).rotation.y = side * 0.4;
  }
  const head = group(body, 'WalrusHead', [0, 0.68, 0.62]);
  orb(head, p, [0, 0.08, 0.08], [0.28, 0.26, 0.28], p.primary);
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.12, -0.02, 0.3], [0.14, 0.11, 0.14], p.primary, 8);
    cone(head, p, [s * 0.12, -0.28, 0.34], 0.045, 0.44, p.accent, [Math.PI + 0.12, 0, 0], 8);
    eye(head, p, [s * 0.17, 0.14, 0.26], 0.032, detail);
    if (detail) {
      for (const dy of [-0.04, 0.02]) cyl(head, p, [s * 0.24, dy, 0.34], 0.009, 0.009, 0.16, p.stencil, [0, 0, Math.PI / 2 + s * 0.2], 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Floe bark', 3.0, [
      sway('WalrusHead', 'x', 3.0, -0.32, 0.32),
      sway('FlipperL', 'z', 3.0, -0.25, 0.48),
      sway('FlipperR', 'z', 3.0, -0.48, 0.25),
    ]),
  ];
}

function buildPeacock(root: T.Group, p: Finish, detail: boolean) {
  const gold = tone(p, 'Plume eye', '#e5b822', 0.45, 0.22);
  const body = group(root, 'PeacockBody');
  orb(body, p, [0, 0.56, 0.08], [0.24, 0.22, 0.42], p.primary);
  for (const s of [-1, 1]) {
    cyl(body, p, [s * 0.12, 0.24, 0.08], 0.036, 0.028, 0.42, p.dark);
    orb(body, p, [s * 0.12, 0.04, 0.14], [0.08, 0.035, 0.14], p.dark, 7);
    orb(body, p, [s * 0.22, 0.58, 0.06], [0.08, 0.18, 0.32], p.accent, 8);
  }
  const head = group(body, 'PeacockHead', [0, 0.72, 0.36]);
  arc(head, p, [[0, 0, 0], [0, 0.24, 0.12], [0, 0.46, 0.06]], 0.065, p.primary, 10, 7);
  orb(head, p, [0, 0.5, 0.08], [0.11, 0.1, 0.13], p.primary, 9);
  cone(head, p, [0, 0.48, 0.22], 0.04, 0.14, p.dark, [Math.PI * 0.54, 0, 0], 7);
  for (const s of [-1, 1]) eye(head, p, [s * 0.08, 0.52, 0.14], 0.026, detail);
  for (const dx of [-0.05, 0, 0.05]) {
    cyl(head, p, [dx, 0.62, 0.04], 0.01, 0.01, 0.14, p.primary, [0, 0, -dx * 3], 6);
    orb(head, p, [dx * 1.4, 0.7, 0.04], [0.028, 0.028, 0.028], gold, 6);
  }
  const fan = group(body, 'TailFan', [0, 0.62, -0.22]);
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.26;
    const len = 0.86 - Math.abs(i) * 0.05;
    const px = Math.sin(a) * len;
    const py = Math.cos(a) * len;
    cyl(fan, p, [px * 0.5, py * 0.5, -0.06], 0.04, 0.025, len, p.accent, [0, 0, -a], 8);
    orb(fan, p, [px, py, -0.06], [0.12, 0.16, 0.04], p.accent, 8).rotation.z = -a;
    if (detail) {
      orb(fan, p, [px, py, -0.02], [0.068, 0.09, 0.03], gold, 7).rotation.z = -a;
      orb(fan, p, [px, py, 0.01], [0.038, 0.05, 0.025], p.primary, 6).rotation.z = -a;
    }
  }
  root.animations = [
    new T.AnimationClip('Plume display', 3.0, [
      sway('TailFan', 'x', 3.0, -0.38, 0.28),
      sway('PeacockHead', 'y', 3.0, -0.5, 0.5),
    ]),
  ];
}

export const animalsWildC: readonly WildAnimalSpec[] = [
  {
    id: 'fluffy-highland-alpaca',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('AlpacaHead', 'Alpaca neck', 'y', [-40, 40], 'Turns the woolly highland alpaca neck and head'),
      rot('AlpacaTail', 'Fluffy tail', 'y', [-35, 35], 'Swishes the fluffy alpaca tail'),
    ],
    build: buildAlpaca,
  },
  {
    id: 'pembroke-corgi-pup',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('CorgiHead', 'Corgi head', 'z', [-25, 25], 'Tilts the big-eared corgi head playfully'),
      rot('CorgiTail', 'Corgi tail', 'y', [-45, 45], 'Wags the fluffy stubby corgi tail'),
    ],
    build: buildCorgiPup,
  },
  {
    id: 'spotted-cheetah',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('CheetahTail', 'Balancing tail', 'y', [-40, 40], 'Swings the long sprinter cheetah tail'),
      rot('CheetahHead', 'Cheetah head', 'y', [-35, 35], 'Turns the tear-striped cheetah head'),
    ],
    build: buildCheetah,
  },
  {
    id: 'horned-great-owl',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('OwlHead', 'Horned owl head', 'y', [-75, 75], 'Swivels the ear-tufted owl head wide'),
      rot('WingL', 'Left wing', 'z', [0, 50], 'Flaps the left woodland owl wing'),
      rot('WingR', 'Right wing', 'z', [-50, 0], 'Flaps the right woodland owl wing'),
    ],
    build: buildHornedOwl,
  },
  {
    id: 'arctic-walrus',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('WalrusHead', 'Tusked head', 'x', [-25, 25], 'Nods the twin-tusked walrus head'),
      rot('FlipperL', 'Left flipper', 'z', [-20, 35], 'Flaps the left arctic walrus flipper'),
      rot('FlipperR', 'Right flipper', 'z', [-35, 20], 'Flaps the right arctic walrus flipper'),
    ],
    build: buildWalrus,
  },
  {
    id: 'fanning-peacock',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('TailFan', 'Plume tail fan', 'x', [-28, 24], 'Tilts and shimmers the iridescent peacock tail fan'),
      rot('PeacockHead', 'Crested head', 'y', [-45, 45], 'Turns the crowned peacock head'),
    ],
    build: buildPeacock,
  },
];
