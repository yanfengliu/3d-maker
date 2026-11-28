import * as T from 'three';
import {
  arc, batWingGeo, cap, cone, cyl, eye, group, mesh, orb, quadLegs, rot, rotationTrack,
  shell, sway, tone,
} from './animals-ocean-myth-kit';
import type { Finish, OceanMythSpec } from './animals-ocean-myth-kit';

function buildTRex(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'TRexBody');
  orb(body, p, [0, 1.06, 0.04], [0.42, 0.44, 0.72], p.primary, 10);
  orb(body, p, [0, 0.98, 0.14], [0.34, 0.32, 0.56], p.accent, 9);
  for (const s of [-1, 1]) {
    orb(body, p, [s * 0.34, 0.82, -0.06], [0.22, 0.34, 0.28], p.primary, 9);
    cyl(body, p, [s * 0.34, 0.36, -0.14], 0.13, 0.1, 0.56, p.primary, [0.22, 0, 0], 9);
    orb(body, p, [s * 0.34, 0.09, 0.02], [0.16, 0.09, 0.28], p.dark, 8);
    cap(body, p, [s * 0.28, 1.12, 0.62], 0.055, 0.18, p.primary, [1.1, 0, -s * 0.2], 7);
  }
  const tail = group(body, 'DinoTail', [0, 1.02, -0.58]);
  arc(tail, p, [[0, 0, 0], [0.06, 0.06, -0.46], [0.14, 0.14, -0.96], [0.08, 0.22, -1.36]], 0.18, p.primary, 12, 8);
  cone(tail, p, [0.08, 0.23, -1.5], 0.15, 0.42, p.primary, [-Math.PI / 2, 0, 0], 8);
  cap(body, p, [0, 1.46, 0.54], 0.24, 0.38, p.primary, [-0.42, 0, 0], 9);
  const head = group(body, 'TRexHead', [0, 1.72, 0.76]);
  shell(head, [0, 0.12, 0.18], [0.42, 0.34, 0.64], p.primary, 0.42);
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.18, 0.28, 0.08], [0.09, 0.08, 0.14], p.accent, 7);
    eye(head, p, [s * 0.22, 0.18, 0.16], 0.044, detail, [s * 0.8, 0.2, 0.3]);
  }
  const jaw = group(head, 'TRexJaw', [0, -0.04, 0.06]);
  shell(jaw, [0, -0.08, 0.22], [0.34, 0.16, 0.56], p.primary, 0.38);
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [0.18, 0.32, 0.44]) {
        cone(head, p, [s * 0.14, -0.07, z], 0.025, 0.09, p.stencil, [Math.PI, 0, 0], 6);
        cone(jaw, p, [s * 0.12, 0.03, z], 0.022, 0.08, p.stencil, [0, 0, 0], 6);
      }
    }
  }
  root.animations = [
    new T.AnimationClip('Apex roar', 3.0, [
      rotationTrack('TRexJaw', 'x', [0, 0.8, 1.9, 3.0], [0, 0.68, 0.62, 0]),
      sway('DinoTail', 'y', 3.0, -0.45, 0.45),
      sway('TRexHead', 'y', 3.0, -0.35, 0.35),
    ]),
  ];
}

function buildTriceratops(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'TrikeBody');
  orb(body, p, [0, 0.78, -0.06], [0.48, 0.44, 0.86], p.primary, 10);
  quadLegs(body, p, 0.34, 0.46, -0.5, 0.7, 0.74, 0.16, 0.13, p.primary, p.dark);
  const tail = group(body, 'TrikeTail', [0, 0.74, -0.84]);
  arc(tail, p, [[0, 0, 0], [0.06, -0.08, -0.38], [0.1, -0.14, -0.78]], 0.13, p.primary, 10, 7);
  cone(tail, p, [0.1, -0.15, -0.88], 0.12, 0.32, p.primary, [-Math.PI / 2, 0, 0], 8);
  const head = group(body, 'TrikeHead', [0, 0.86, 0.78]);
  orb(head, p, [0, 0.02, 0.14], [0.28, 0.24, 0.36], p.primary, 10);
  cone(head, p, [0, -0.04, 0.5], 0.14, 0.26, p.accent, [Math.PI * 0.56, 0, 0], 8);
  cyl(head, p, [0, 0.24, -0.04], 0.52, 0.48, 0.12, p.primary, [1.15, 0, 0], 10);
  cone(head, p, [0, 0.2, 0.48], 0.06, 0.22, p.accent, [0.35, 0, 0], 8);
  for (const s of [-1, 1]) {
    arc(head, p, [[s * 0.2, 0.24, 0.14], [s * 0.28, 0.34, 0.48], [s * 0.24, 0.42, 0.82]], 0.055, p.accent, 10, 7);
    cone(head, p, [s * 0.24, 0.44, 0.9], 0.048, 0.2, p.accent, [1.3, 0, 0], 8);
    eye(head, p, [s * 0.24, 0.08, 0.28], 0.036, detail);
  }
  if (detail) {
    for (let i = -3; i <= 3; i++) {
      const a = i * 0.36;
      cone(head, p, [Math.sin(a) * 0.5, 0.24 + Math.cos(a) * 0.46, -0.14 - Math.cos(a) * 0.2], 0.05, 0.14, p.accent, [-0.4, 0, -a], 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Frill charge', 3.0, [
      sway('TrikeHead', 'x', 3.0, -0.25, 0.35),
      sway('TrikeTail', 'y', 3.0, -0.42, 0.42),
    ]),
  ];
}

function buildStegosaurus(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'StegoBody');
  orb(body, p, [0, 0.88, -0.06], [0.44, 0.52, 0.84], p.primary, 10);
  quadLegs(body, p, 0.32, 0.48, -0.46, 0.64, 0.84, 0.15, 0.12, p.primary, p.dark);
  const head = group(body, 'StegoHead', [0, 0.72, 0.78]);
  cap(head, p, [0, 0.02, 0.18], 0.13, 0.28, p.primary, [Math.PI * 0.48, 0, 0], 8);
  orb(head, p, [0, 0.02, 0.42], [0.14, 0.12, 0.2], p.primary, 8);
  for (const s of [-1, 1]) eye(head, p, [s * 0.12, 0.06, 0.48], 0.03, detail);
  for (let i = 0; i < 6; i++) {
    const s = i % 2 === 0 ? 1 : -1;
    const z = 0.52 - i * 0.24;
    const h = 0.34 + Math.sin((i / 5) * Math.PI) * 0.28;
    const plate = cone(body, p, [s * 0.12, 1.32 + h * 0.34, z], 0.2, h, p.accent, [0, 0, -s * 0.14], 4);
    plate.scale.set(0.28, 1, 1);
  }
  const tail = group(body, 'SpikeTail', [0, 0.82, -0.82]);
  arc(tail, p, [[0, 0, 0], [0.06, -0.04, -0.42], [0.12, -0.06, -0.86]], 0.13, p.primary, 10, 7);
  for (const s of [-1, 1]) {
    for (const z of [-0.66, -0.84]) {
      cone(tail, p, [s * 0.22, 0.08, z], 0.045, 0.38, p.stencil, [0, 0, -s * 0.85], 7);
    }
  }
  if (detail) {
    for (let i = 0; i < 3; i++) {
      orb(body, p, [0.42, 0.84, -0.34 + i * 0.34], [0.05, 0.08, 0.1], p.accent, 6);
      orb(body, p, [-0.42, 0.84, -0.34 + i * 0.34], [0.05, 0.08, 0.1], p.accent, 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Thagomizer swing', 2.8, [
      sway('SpikeTail', 'y', 2.8, -0.62, 0.62),
      sway('StegoHead', 'x', 2.8, -0.25, 0.25),
    ]),
  ];
}

function buildPterosaur(root: T.Group, p: Finish, detail: boolean) {
  const crag = tone(p, 'Cliff crag', '#6b655e', 0.86, 0.05);
  const body = group(root, 'PteroBody');
  cyl(body, p, [0, 0.24, 0], 0.36, 0.56, 0.48, crag, [0, 0, 0], 8);
  orb(body, p, [0, 0.86, 0], [0.24, 0.32, 0.34], p.primary, 10);
  for (const s of [-1, 1]) {
    cyl(body, p, [s * 0.16, 0.54, -0.06], 0.055, 0.042, 0.32, p.primary);
    orb(body, p, [s * 0.16, 0.46, 0.02], [0.08, 0.04, 0.12], p.dark, 7);
  }
  const wGeo = batWingGeo(p, 1.24, 0.46);
  for (const [side, name] of [[1, 'WingL'], [-1, 'WingR']] as const) {
    const wing = group(body, name, [side * 0.22, 1.0, 0.04]);
    arc(wing, p, [[0, 0, 0], [side * 0.64, 0.42, -0.04], [side * 1.22, 0.22, -0.14]], 0.045, p.primary, 10, 6);
    const mem = mesh(wing, wGeo, p.accent, [0, 0, 0]);
    mem.rotation.y = side > 0 ? 0.12 : Math.PI - 0.12;
  }
  const head = group(body, 'PteroHead', [0, 1.24, 0.14]);
  cyl(head, p, [0, -0.08, -0.04], 0.09, 0.11, 0.26, p.primary, [0.22, 0, 0], 8);
  orb(head, p, [0, 0.1, 0.04], [0.14, 0.14, 0.2], p.primary, 9);
  cone(head, p, [0, 0.24, -0.34], 0.1, 0.68, p.accent, [-1.15, 0, 0], 8).scale.set(0.32, 1, 1);
  cone(head, p, [0, 0.06, 0.54], 0.085, 0.86, p.accent, [Math.PI * 0.54, 0, 0], 8);
  for (const s of [-1, 1]) eye(head, p, [s * 0.12, 0.14, 0.14], 0.035, detail);
  if (detail) {
    for (const s of [-1, 1]) orb(body, p, [s * 0.28, 0.46, 0.18], [0.12, 0.08, 0.14], crag, 7);
  }
  root.animations = [
    new T.AnimationClip('Cliff launch', 2.8, [
      sway('WingL', 'z', 2.8, -0.32, 0.62),
      sway('WingR', 'z', 2.8, -0.62, 0.32),
      sway('PteroHead', 'y', 2.8, -0.45, 0.45),
    ]),
  ];
}

function buildBrachiosaurus(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'BrachioBody');
  orb(body, p, [0, 1.38, 0.04], [0.48, 0.5, 0.82], p.primary, 10);
  quadLegs(body, p, 0.32, 0.52, -0.5, 1.38, 1.02, 0.16, 0.13, p.primary, p.dark);
  const tail = group(body, 'BrachioTail', [0, 1.18, -0.74]);
  arc(tail, p, [[0, 0, 0], [0.08, -0.14, -0.48], [0.16, -0.22, -0.98]], 0.15, p.primary, 10, 7);
  cone(tail, p, [0.18, -0.24, -1.1], 0.14, 0.38, p.primary, [-Math.PI / 2, 0, 0], 8);
  const neck = group(body, 'BrachioNeck', [0, 1.66, 0.58]);
  arc(neck, p, [[0, 0, 0], [0, 0.72, 0.22], [0, 1.48, 0.38], [0, 1.88, 0.52]], 0.16, p.primary, 12, 8);
  orb(neck, p, [0, 1.94, 0.62], [0.18, 0.18, 0.24], p.primary, 9);
  orb(neck, p, [0, 2.08, 0.64], [0.12, 0.12, 0.14], p.accent, 8);
  orb(neck, p, [0, 1.88, 0.84], [0.12, 0.09, 0.16], p.primary, 8);
  for (const s of [-1, 1]) eye(neck, p, [s * 0.15, 1.98, 0.72], 0.032, detail);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      orb(neck, p, [0, 0.32 + i * 0.28, 0.24 + i * 0.06], [0.13, 0.08, 0.09], p.accent, 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Treetop browse', 3.4, [
      sway('BrachioNeck', 'x', 3.4, -0.22, 0.36),
      sway('BrachioTail', 'y', 3.4, -0.38, 0.38),
    ]),
  ];
}

function buildWesternDragon(root: T.Group, p: Finish, detail: boolean) {
  const ember = tone(p, 'Dragon flame', '#ff7b00', 0.34, 0.1, '#e85d04');
  const body = group(root, 'DragonBody');
  orb(body, p, [0, 0.78, 0.04], [0.42, 0.4, 0.74], p.primary, 10);
  orb(body, p, [0, 0.68, 0.14], [0.34, 0.28, 0.56], p.accent, 9);
  quadLegs(body, p, 0.32, 0.44, -0.44, 0.68, 0.7, 0.14, 0.1, p.primary, p.dark);
  arc(body, p, [[0, 0.72, -0.66], [0.22, 0.46, -1.06], [0.46, 0.24, -1.24], [0.56, 0.32, -0.96]], 0.12, p.primary, 12, 7);
  cone(body, p, [0.6, 0.36, -0.84], 0.13, 0.3, p.accent, [1.3, 0, -0.45], 7);
  const wGeo = batWingGeo(p, 1.32, 0.54);
  for (const [side, name] of [[1, 'WingL'], [-1, 'WingR']] as const) {
    const wing = group(body, name, [side * 0.34, 1.06, 0.04]);
    arc(wing, p, [[0, 0, 0], [side * 0.56, 0.48, -0.08], [side * 1.28, 0.28, -0.2]], 0.05, p.primary, 10, 6);
    const mem = mesh(wing, wGeo, p.accent, [0, 0, 0]);
    mem.rotation.y = side > 0 ? 0.22 : Math.PI - 0.22;
  }
  cap(body, p, [0, 1.24, 0.56], 0.18, 0.42, p.primary, [-0.36, 0, 0], 9);
  const head = group(body, 'DragonHead', [0, 1.56, 0.74]);
  orb(head, p, [0, 0.06, 0.06], [0.24, 0.2, 0.26], p.primary, 10);
  shell(head, [0, 0.06, 0.32], [0.28, 0.16, 0.34], p.primary, 0.42);
  for (const s of [-1, 1]) {
    arc(head, p, [[s * 0.14, 0.2, -0.04], [s * 0.26, 0.42, -0.24], [s * 0.3, 0.54, -0.44]], 0.042, p.accent, 8, 6);
    eye(head, p, [s * 0.18, 0.12, 0.22], 0.042, detail);
  }
  const jaw = group(head, 'DragonJaw', [0, -0.04, 0.14]);
  shell(jaw, [0, -0.05, 0.18], [0.24, 0.1, 0.32], p.primary, 0.38);
  orb(jaw, p, [0, 0.01, 0.18], [0.1, 0.035, 0.14], ember, 7);
  if (detail) {
    for (let i = 0; i < 6; i++) cone(body, p, [0, 1.22 - i * 0.1, 0.34 - i * 0.22], 0.055, 0.16, p.accent, [-0.4, 0, 0], 6);
  }
  root.animations = [
    new T.AnimationClip('Dragon roar', 2.8, [
      sway('WingL', 'z', 2.8, -0.2, 0.72),
      sway('WingR', 'z', 2.8, -0.72, 0.2),
      rotationTrack('DragonJaw', 'x', [0, 0.7, 1.8, 2.8], [0, 0.62, 0.56, 0]),
    ]),
  ];
}

function buildEasternLung(root: T.Group, p: Finish, detail: boolean) {
  const cloud = tone(p, 'Cloud rock', '#dce6ee', 0.78, 0.04);
  const body = group(root, 'LungBody');
  shell(body, [0, 0.12, 0], [1.34, 0.24, 2.38], cloud, 0.56);
  for (const [x, y, z] of [[-0.44, 0.26, 0.64], [0.46, 0.28, -0.42], [0, 0.32, 0.1]] as const) {
    orb(body, p, [x, y, z], [0.34, 0.22, 0.34], cloud, 9);
  }
  arc(body, p, [
    [0, 0.42, -1.04], [-0.36, 0.58, -0.62], [0.36, 0.94, -0.14],
    [-0.28, 0.68, 0.36], [0.16, 1.18, 0.78], [0, 1.54, 1.04],
  ], 0.18, p.primary, 18, 9);
  for (const [x, y, z] of [[0.34, 0.52, -0.52], [-0.34, 0.52, -0.52], [0.28, 0.64, 0.44], [-0.28, 0.64, 0.44]] as const) {
    cyl(body, p, [x, y * 0.55, z], 0.08, 0.065, y, p.primary, [0, 0, 0], 8);
    orb(body, p, [x, 0.16, z + 0.06], [0.1, 0.06, 0.12], p.accent, 7);
  }
  const head = group(body, 'LungHead', [0, 1.56, 1.06]);
  orb(head, p, [0, 0.06, 0.08], [0.22, 0.18, 0.24], p.primary, 9);
  shell(head, [0, 0.04, 0.32], [0.24, 0.15, 0.34], p.primary, 0.44);
  for (const s of [-1, 1]) {
    arc(head, p, [[s * 0.1, 0.2, -0.02], [s * 0.22, 0.42, -0.16], [s * 0.3, 0.58, -0.28]], 0.032, p.accent, 8, 6);
    arc(head, p, [[s * 0.14, 0.02, 0.42], [s * 0.34, -0.08, 0.52], [s * 0.44, -0.24, 0.38]], 0.018, p.accent, 8, 5);
    eye(head, p, [s * 0.16, 0.12, 0.22], 0.04, detail);
  }
  const tail = group(body, 'LungTail', [0, 0.44, -1.04]);
  cone(tail, p, [0, 0.16, -0.28], 0.18, 0.44, p.accent, [-1.1, 0, 0], 8);
  if (detail) {
    for (let i = 0; i < 6; i++) orb(head, p, [0, 0.12 - i * 0.04, -0.08 - i * 0.04], [0.24, 0.09, 0.08], p.accent, 6);
  }
  root.animations = [
    new T.AnimationClip('Cloud weave', 3.0, [
      sway('LungHead', 'y', 3.0, -0.52, 0.52),
      sway('LungTail', 'y', 3.0, -0.55, 0.55),
    ]),
  ];
}

export const animalsOceanMythB: readonly OceanMythSpec[] = [
  {
    id: 'tyrannosaurus-rex',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('TRexJaw', 'Roaring jaw', 'x', [0, 48], 'Opens the massive toothy Tyrannosaurus jaw'),
      rot('TRexHead', 'Tyrannosaur head', 'y', [-32, 32], 'Turns the massive crested T-Rex skull'),
      rot('DinoTail', 'Counterbalance tail', 'y', [-38, 38], 'Swings the heavy muscular dinosaur tail'),
    ],
    build: buildTRex,
  },
  {
    id: 'horned-triceratops',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('TrikeHead', 'Horned frill head', 'x', [-22, 28], 'Lowers and tosses the triple-horned triceratops frill'),
      rot('TrikeTail', 'Triceratops tail', 'y', [-35, 35], 'Swishes the stout triceratops tail'),
    ],
    build: buildTriceratops,
  },
  {
    id: 'plated-stegosaurus',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('SpikeTail', 'Spiked tail', 'y', [-45, 45], 'Swings the four-spiked thagomizer tail'),
      rot('StegoHead', 'Stegosaur head', 'x', [-22, 22], 'Nods the low browsing stegosaurus head'),
    ],
    build: buildStegosaurus,
  },
  {
    id: 'crested-pterosaur',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('WingL', 'Left wing', 'z', [-22, 46], 'Flaps the sweeping left pterosaur wing'),
      rot('WingR', 'Right wing', 'z', [-46, 22], 'Flaps the sweeping right pterosaur wing'),
      rot('PteroHead', 'Crested head', 'y', [-40, 40], 'Turns the long-beaked crested pterosaur skull'),
    ],
    build: buildPterosaur,
  },
  {
    id: 'longneck-brachiosaurus',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('BrachioNeck', 'Soaring neck', 'x', [-20, 30], 'Bows and raises the towering sauropod neck'),
      rot('BrachioTail', 'Sauropod tail', 'y', [-35, 35], 'Swings the long counterbalancing brachiosaur tail'),
    ],
    build: buildBrachiosaurus,
  },
  {
    id: 'winged-western-dragon',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('WingL', 'Left dragon wing', 'z', [-15, 52], 'Flaps the ribbed left western dragon wing'),
      rot('WingR', 'Right dragon wing', 'z', [-52, 15], 'Flaps the ribbed right western dragon wing'),
      rot('DragonJaw', 'Flame jaw', 'x', [0, 45], 'Opens the ember-lit roaring dragon jaw'),
    ],
    build: buildWesternDragon,
  },
  {
    id: 'serpentine-eastern-lung',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('LungHead', 'Imperial head', 'y', [-45, 45], 'Sways the antlered whiskered eastern dragon head'),
      rot('LungTail', 'Plumed tail', 'y', [-45, 45], 'Swishes the imperial dragon tail tuft'),
    ],
    build: buildEasternLung,
  },
];
