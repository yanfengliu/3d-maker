import * as T from 'three';
import {
  arc, cap, cone, cyl, det, eye, group, lathe, orb, quadLegs, rot, rotationTrack,
  sway, tone,
} from './animals-wild-kit';
import type { Finish, WildAnimalSpec } from './animals-wild-kit';

function buildGrizzlyBear(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'BearBody');
  orb(body, p, [0, 0.76, -0.04], [0.46, 0.42, 0.78], p.primary);
  orb(body, p, [0, 0.96, 0.36], [0.42, 0.34, 0.4], p.primary);
  orb(body, p, [0, 0.74, -0.78], [0.14, 0.14, 0.14], p.primary, 7);
  quadLegs(body, p, 0.3, 0.46, -0.52, 0.68, 0.16, 0.12, p.primary, p.dark);
  const head = group(body, 'BearHead', [0, 0.94, 0.72]);
  orb(head, p, [0, 0.04, 0.12], [0.3, 0.28, 0.3], p.primary);
  orb(head, p, [0, -0.02, 0.36], [0.16, 0.12, 0.22], p.accent);
  orb(head, p, [0, 0.04, 0.56], [0.07, 0.055, 0.055], p.inset, 8);
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.22, 0.26, 0.04], [0.1, 0.1, 0.06], p.primary, 8);
    orb(head, p, [s * 0.22, 0.26, 0.07], [0.06, 0.06, 0.04], p.accent, 7);
    eye(head, p, [s * 0.15, 0.1, 0.34], 0.036, detail);
  }
  const jaw = group(head, 'BearJaw', [0, -0.1, 0.2]);
  orb(jaw, p, [0, -0.04, 0.16], [0.13, 0.07, 0.18], p.accent, 8);
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [0.46, -0.52]) {
        for (const dx of [-0.06, 0, 0.06]) cone(body, p, [s * 0.3 + dx, 0.05, z + 0.22], 0.024, 0.1, p.stencil, [Math.PI / 2, 0, 0], 6);
      }
      cone(jaw, p, [s * 0.07, 0.02, 0.26], 0.02, 0.06, p.stencil, [0, 0, 0], 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Grizzly growl', 3.0, [
      sway('BearHead', 'y', 3.0, -0.4, 0.4),
      rotationTrack('BearJaw', 'x', [0, 0.8, 1.8, 3.0], [0, 0.52, 0.45, 0]),
    ]),
  ];
}

function buildElephant(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'ElephantBody');
  orb(body, p, [0, 1.24, -0.06], [0.64, 0.58, 0.94], p.primary);
  orb(body, p, [0, 1.38, 0.44], [0.56, 0.5, 0.48], p.primary);
  quadLegs(body, p, 0.4, 0.56, -0.62, 1.14, 0.22, 0.18, p.primary, p.dark);
  arc(body, p, [[0, 1.14, -0.96], [0, 0.86, -1.12], [0, 0.58, -1.16]], 0.048, p.primary, 8, 6);
  orb(body, p, [0, 0.54, -1.16], [0.07, 0.1, 0.07], p.dark, 7);
  const head = group(body, 'ElephantHead', [0, 1.48, 0.88]);
  orb(head, p, [0, 0.08, 0.14], [0.46, 0.44, 0.42], p.primary);
  for (const [side, name] of [[1, 'EarL'], [-1, 'EarR']] as const) {
    const ear = group(head, name, [side * 0.36, 0.14, -0.02]);
    orb(ear, p, [side * 0.34, -0.06, -0.08], [0.38, 0.46, 0.08], p.primary, 10).rotation.y = -side * 0.34;
    if (detail) orb(ear, p, [side * 0.32, -0.08, -0.04], [0.26, 0.34, 0.05], p.accent, 8).rotation.y = -side * 0.34;
    arc(head, p, [[side * 0.22, -0.14, 0.4], [side * 0.3, -0.26, 0.78], [side * 0.26, -0.08, 1.12]], 0.065, p.accent, 10, 8);
    cone(head, p, [side * 0.25, 0, 1.18], 0.058, 0.2, p.accent, [1.1, 0, 0], 8);
    eye(head, p, [side * 0.28, 0.16, 0.44], 0.045, detail);
  }
  const trunk = group(head, 'Trunk', [0, -0.04, 0.48]);
  arc(trunk, p, [[0, 0, 0], [0, -0.34, 0.22], [0, -0.78, 0.26], [0, -0.96, 0.42]], 0.13, p.primary, 12, 8);
  orb(trunk, p, [0, -0.96, 0.44], [0.1, 0.09, 0.12], p.primary, 8);
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [0.56, -0.62]) {
        for (const dx of [-0.08, 0, 0.08]) orb(body, p, [s * 0.4 + dx, 0.06, z + 0.22], [0.045, 0.05, 0.04], p.accent, 6);
      }
    }
  }
  root.animations = [
    new T.AnimationClip('Savanna trumpet', 3.2, [
      sway('Trunk', 'x', 3.2, -0.78, 0.38),
      sway('EarL', 'y', 3.2, -0.45, 0.25),
      sway('EarR', 'y', 3.2, -0.25, 0.45),
    ]),
  ];
}

function buildGiraffe(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'GiraffeBody');
  orb(body, p, [0, 1.46, 0], [0.34, 0.34, 0.66], p.primary);
  orb(body, p, [0, 1.56, 0.36], [0.32, 0.36, 0.34], p.primary);
  quadLegs(body, p, 0.24, 0.42, -0.44, 1.42, 0.1, 0.072, p.primary, p.dark);
  arc(body, p, [[0, 1.38, -0.64], [0, 1.04, -0.76], [0, 0.76, -0.78]], 0.035, p.primary, 8, 6);
  orb(body, p, [0, 0.72, -0.78], [0.055, 0.1, 0.055], p.accent, 7);
  const neck = group(body, 'GiraffeNeck', [0, 1.66, 0.46]);
  cyl(neck, p, [0, 0.74, 0.14], 0.12, 0.22, 1.54, p.primary, [0.18, 0, 0], 10);
  const head = group(neck, 'GiraffeHead', [0, 1.48, 0.28]);
  orb(head, p, [0, 0.04, 0.1], [0.16, 0.14, 0.22], p.primary);
  cyl(head, p, [0, -0.02, 0.32], 0.075, 0.1, 0.24, p.primary, [Math.PI * 0.54, 0, 0], 8);
  for (const s of [-1, 1]) {
    cyl(head, p, [s * 0.07, 0.24, 0.04], 0.028, 0.032, 0.2, p.accent, [0, 0, -s * 0.15], 8);
    orb(head, p, [s * 0.085, 0.34, 0.04], [0.042, 0.042, 0.042], p.dark, 7);
    cone(head, p, [s * 0.18, 0.14, -0.02], 0.055, 0.18, p.primary, [0.1, 0, -s * 1.05], 8);
    eye(head, p, [s * 0.14, 0.08, 0.2], 0.032, detail);
  }
  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    orb(body, p, [side * 0.31, 1.48 + (i % 3) * 0.06, -0.34 + i * 0.16], [0.06, 0.09, 0.09], p.accent, 7);
    orb(neck, p, [side * 0.14, 0.28 + i * 0.2, 0.04 + i * 0.04], [0.055, 0.075, 0.075], p.accent, 7);
  }
  if (detail) {
    for (let i = 0; i < 7; i++) orb(neck, p, [0, 0.22 + i * 0.19, -0.06 + i * 0.03], [0.04, 0.07, 0.06], p.accent, 6);
  }
  root.animations = [
    new T.AnimationClip('Canopy graze', 3.4, [
      sway('GiraffeNeck', 'x', 3.4, -0.22, 0.42),
      sway('GiraffeHead', 'y', 3.4, -0.45, 0.45),
    ]),
  ];
}

function buildGiantPanda(root: T.Group, p: Finish, detail: boolean) {
  const bambooMat = tone(p, 'Fresh bamboo', '#4c9542', 0.68, 0.05);
  const body = group(root, 'PandaBody');
  orb(body, p, [0, 0.46, 0], [0.46, 0.46, 0.44], p.primary);
  orb(body, p, [0, 0.72, 0.02], [0.44, 0.24, 0.4], p.accent);
  orb(body, p, [0, 0.28, -0.44], [0.11, 0.11, 0.11], p.primary, 7);
  for (const s of [-1, 1]) {
    cap(body, p, [s * 0.32, 0.22, 0.28], 0.16, 0.26, p.accent, [Math.PI * 0.48, s * 0.32, 0]);
    orb(body, p, [s * 0.4, 0.18, 0.48], [0.16, 0.15, 0.1], p.accent, 8);
  }
  cap(body, p, [0.44, 0.56, 0.2], 0.14, 0.32, p.accent, [0.6, 0, -0.42]);
  const armR = group(body, 'PandaArmR', [-0.42, 0.74, 0.1]);
  cap(armR, p, [-0.08, -0.14, 0.24], 0.14, 0.34, p.accent, [0.92, 0, 0.36]);
  const bamboo = group(armR, 'BambooStalk', [-0.14, -0.18, 0.46]);
  cyl(bamboo, p, [0, 0.24, 0], 0.042, 0.048, 0.92, bambooMat, [0.22, 0, 0.18], 8);
  for (const y of [0.02, 0.32, 0.6]) orb(bamboo, p, [0, y, 0], [0.055, 0.022, 0.055], p.stencil, 6);
  const head = group(body, 'PandaHead', [0, 1.02, 0.08]);
  orb(head, p, [0, 0.08, 0], [0.34, 0.3, 0.3], p.primary);
  orb(head, p, [0, -0.02, 0.26], [0.15, 0.11, 0.13], p.primary, 8);
  orb(head, p, [0, 0.02, 0.38], [0.055, 0.042, 0.045], p.accent, 8);
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.24, 0.32, -0.02], [0.11, 0.11, 0.07], p.accent, 8);
    orb(head, p, [s * 0.14, 0.1, 0.26], [0.095, 0.11, 0.06], p.accent, 8);
    eye(head, p, [s * 0.14, 0.11, 0.31], 0.036, detail);
  }
  if (detail) {
    for (const s of [-1, 1]) orb(body, p, [s * 0.4, 0.16, 0.56], [0.08, 0.08, 0.03], p.edge, 7);
    cone(bamboo, p, [0.08, 0.64, 0.04], 0.06, 0.22, bambooMat, [0, 0, -0.9], 6);
  }
  root.animations = [
    new T.AnimationClip('Bamboo munch', 3.0, [
      sway('PandaHead', 'y', 3.0, -0.4, 0.4),
      sway('PandaArmR', 'x', 3.0, -0.42, 0.24),
    ]),
  ];
}

function buildGoldenEagle(root: T.Group, p: Finish, detail: boolean) {
  const stump = tone(p, 'Crag stump', '#5c534a', 0.86, 0.05);
  const beak = tone(p, 'Raptor beak', '#e5a928', 0.56, 0.1);
  const body = group(root, 'EagleBody');
  cyl(body, p, [0, 0.16, 0], 0.36, 0.46, 0.32, stump, [0, 0, 0], 9);
  lathe(body, p, [0, 0.36, 0], [
    [0.01, 0], [0.22, 0.08], [0.34, 0.32], [0.32, 0.68], [0.22, 0.94], [0.01, 1.02],
  ], p.primary);
  cone(body, p, [0, 0.44, -0.4], 0.2, 0.54, p.primary, [-2.15, 0, 0], 9);
  for (const s of [-1, 1]) {
    cyl(body, p, [s * 0.14, 0.36, 0.06], 0.065, 0.045, 0.22, p.primary);
    for (const a of [-0.4, 0, 0.4]) cap(body, p, [s * 0.14 + Math.sin(a) * 0.06, 0.33, 0.12 + Math.cos(a) * 0.06], 0.025, 0.09, beak, [Math.PI / 2, a, 0], 6);
    const wing = group(body, s > 0 ? 'WingL' : 'WingR', [s * 0.3, 1.08, -0.02]);
    orb(wing, p, [s * 0.32, 0.04, -0.06], [0.42, 0.14, 0.26], p.primary, 9).rotation.z = s * 0.24;
    orb(wing, p, [s * 0.68, 0.14, -0.14], [0.38, 0.09, 0.2], p.primary, 9).rotation.z = s * 0.14;
    if (detail) {
      for (let i = 0; i < 4; i++) {
        cone(wing, p, [s * (0.48 + i * 0.18), 0.04 + i * 0.04, -0.26], 0.055, 0.28, i % 2 ? p.accent : p.primary, [-1.4, 0, -s * 0.4], 6);
      }
    }
  }
  const head = group(body, 'EagleHead', [0, 1.32, 0.06]);
  orb(head, p, [0, 0.12, 0.02], [0.22, 0.22, 0.24], p.accent);
  cone(head, p, [0, 0.09, 0.28], 0.07, 0.24, beak, [Math.PI * 0.56, 0, 0], 8);
  cone(head, p, [0, 0.03, 0.38], 0.042, 0.12, beak, [Math.PI * 0.85, 0, 0], 7);
  for (const s of [-1, 1]) eye(head, p, [s * 0.14, 0.16, 0.18], 0.036, detail);
  root.animations = [
    new T.AnimationClip('Wing spread', 2.8, [
      sway('WingL', 'z', 2.8, -0.25, 0.68),
      sway('WingR', 'z', 2.8, -0.68, 0.25),
      sway('EagleHead', 'y', 2.8, -0.55, 0.55),
    ]),
  ];
}

function buildFlamingo(root: T.Group, p: Finish, detail: boolean) {
  const pond = tone(p, 'Lagoon water', '#3b9aa8', 0.44, 0.18);
  const body = group(root, 'FlamingoBody');
  cyl(body, p, [0, 0.05, 0], 0.44, 0.48, 0.1, pond, [0, 0, 0], 14);
  cyl(body, p, [0.06, 0.52, 0], 0.035, 0.03, 0.94, p.accent, [0, 0, 0], 8);
  orb(body, p, [0.06, 0.09, 0.06], [0.08, 0.03, 0.14], p.accent, 7);
  arc(body, p, [[-0.08, 0.94, 0], [-0.14, 0.54, 0.16], [-0.04, 0.48, -0.02]], 0.03, p.accent, 8, 6);
  orb(body, p, [0, 1.04, 0], [0.26, 0.24, 0.42], p.primary);
  cone(body, p, [0, 1.0, -0.44], 0.16, 0.34, p.primary, [-1.9, 0, 0], 8);
  for (const [side, name] of [[1, 'WingL'], [-1, 'WingR']] as const) {
    const w = group(body, name, [side * 0.24, 1.08, -0.02]);
    orb(w, p, [side * 0.08, -0.02, -0.04], [0.08, 0.22, 0.36], p.accent, 8).rotation.z = side * 0.16;
  }
  const neck = group(body, 'FlamingoNeck', [0, 1.18, 0.28]);
  arc(neck, p, [[0, 0, 0], [0, 0.22, 0.18], [0, 0.58, 0.04], [0, 0.88, 0.18]], 0.062, p.primary, 12, 8);
  orb(neck, p, [0, 0.92, 0.22], [0.11, 0.1, 0.13], p.primary, 9);
  cone(neck, p, [0, 0.88, 0.36], 0.055, 0.16, p.accent, [Math.PI * 0.62, 0, 0], 8);
  cone(neck, p, [0, 0.78, 0.42], 0.042, 0.16, p.dark, [Math.PI * 0.9, 0, 0], 8);
  for (const s of [-1, 1]) eye(neck, p, [s * 0.085, 0.94, 0.27], 0.025, detail);
  if (detail) {
    for (let i = 0; i < 4; i++) orb(body, p, [0, 1.24 - i * 0.03, -0.18 - i * 0.08], [0.14, 0.05, 0.08], p.accent, 6);
  }
  root.animations = [
    new T.AnimationClip('Lagoon poise', 3.2, [
      sway('FlamingoNeck', 'x', 3.2, -0.28, 0.35),
      sway('WingL', 'z', 3.2, 0, 0.68),
      sway('WingR', 'z', 3.2, -0.68, 0),
    ]),
  ];
}

function buildKangaroo(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'KangarooBody');
  orb(body, p, [0, 0.72, 0], [0.34, 0.46, 0.36], p.primary);
  orb(body, p, [0, 0.68, 0.18], [0.24, 0.32, 0.22], p.accent);
  orb(body, p, [0, 1.12, 0.12], [0.24, 0.26, 0.24], p.primary);
  for (const s of [-1, 1]) {
    orb(body, p, [s * 0.26, 0.46, -0.04], [0.18, 0.28, 0.24], p.primary, 9);
    cyl(body, p, [s * 0.24, 0.2, 0.08], 0.075, 0.06, 0.32, p.primary, [0.32, 0, 0], 8);
    orb(body, p, [s * 0.24, 0.06, 0.28], [0.09, 0.06, 0.28], p.dark, 8);
    cap(body, p, [s * 0.24, 1.0, 0.28], 0.062, 0.24, p.primary, [0.9, 0, -s * 0.24]);
  }
  arc(body, p, [[0, 0.46, -0.24], [0, 0.26, -0.64], [0, 0.13, -1.04], [0, 0.15, -1.36]], 0.11, p.primary, 12, 8);
  const head = group(body, 'RooHead', [0, 1.38, 0.2]);
  orb(head, p, [0, 0.06, 0.06], [0.17, 0.16, 0.2], p.primary);
  cyl(head, p, [0, 0.01, 0.26], 0.07, 0.1, 0.22, p.primary, [Math.PI * 0.54, 0, 0], 8);
  orb(head, p, [0, 0.02, 0.38], [0.045, 0.038, 0.04], p.inset, 7);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.12, 0.28, -0.02], 0.065, 0.28, p.primary, [0.1, 0, -s * 0.24], 8);
    if (detail) cone(head, p, [s * 0.12, 0.26, 0.02], 0.038, 0.18, p.accent, [0.1, 0, -s * 0.24], 7);
    eye(head, p, [s * 0.12, 0.1, 0.18], 0.034, detail);
  }
  const arms = group(body, 'ForePaws', [0, 1.02, 0.34]);
  for (const s of [-1, 1]) orb(arms, p, [s * 0.18, -0.06, 0.08], [0.06, 0.055, 0.09], p.dark, 7);
  root.animations = [
    new T.AnimationClip('Outback alert', 3.0, [
      sway('RooHead', 'y', 3.0, -0.52, 0.52),
      sway('ForePaws', 'x', 3.0, -0.35, 0.35),
    ]),
  ];
}

export const animalsWildA: readonly WildAnimalSpec[] = [
  {
    id: 'grizzly-brown-bear',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('BearHead', 'Bear head', 'y', [-35, 35], 'Turns the massive grizzly bear head side to side'),
      rot('BearJaw', 'Growling jaw', 'x', [0, 38], 'Opens the hinged lower grizzly jaw'),
    ],
    build: buildGrizzlyBear,
  },
  {
    id: 'african-savanna-elephant',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('Trunk', 'Elephant trunk', 'x', [-50, 28], 'Lifts and swings the long prehensile trunk'),
      rot('EarL', 'Left fan ear', 'y', [-35, 20], 'Flaps the wide left savanna elephant ear'),
      rot('EarR', 'Right fan ear', 'y', [-20, 35], 'Flaps the wide right savanna elephant ear'),
    ],
    build: buildElephant,
  },
  {
    id: 'reticulated-giraffe',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('GiraffeNeck', 'Long neck', 'x', [-20, 32], 'Bows and raises the towering patterned giraffe neck'),
      rot('GiraffeHead', 'Giraffe head', 'y', [-40, 40], 'Turns the ossicone-crowned giraffe head'),
    ],
    build: buildGiraffe,
  },
  {
    id: 'giant-bamboo-panda',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('PandaHead', 'Panda head', 'y', [-35, 35], 'Turns the round black-and-white panda head'),
      rot('PandaArmR', 'Munching paw', 'x', [-35, 25], 'Raises the panda paw toward its mouth'),
    ],
    detachableParts: [det('BambooStalk', 'Bamboo stalk', 'Removable fresh green bamboo shoot held in the panda paw')],
    build: buildGiantPanda,
  },
  {
    id: 'bald-golden-eagle',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('WingL', 'Left wing', 'z', [-20, 48], 'Spreads and flaps the left feathered eagle wing'),
      rot('WingR', 'Right wing', 'z', [-48, 20], 'Spreads and flaps the right feathered eagle wing'),
      rot('EagleHead', 'Eagle head', 'y', [-50, 50], 'Turns the white-feathered raptor head'),
    ],
    build: buildGoldenEagle,
  },
  {
    id: 'pink-wading-flamingo',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('FlamingoNeck', 'Curved neck', 'x', [-25, 30], 'Dips and raises the graceful S-curved flamingo neck'),
      rot('WingL', 'Left wing', 'z', [0, 45], 'Flutters the left pink wing'),
      rot('WingR', 'Right wing', 'z', [-45, 0], 'Flutters the right pink wing'),
    ],
    build: buildFlamingo,
  },
  {
    id: 'red-bounding-kangaroo',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('RooHead', 'Kangaroo head', 'y', [-40, 40], 'Swivels the tall-eared kangaroo head'),
      rot('ForePaws', 'Forepaws', 'x', [-28, 28], 'Tucks and reaches the kangaroo forepaws'),
    ],
    build: buildKangaroo,
  },
];
