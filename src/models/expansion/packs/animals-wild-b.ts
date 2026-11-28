import * as T from 'three';
import {
  arc, cap, cone, cyl, det, eye, group, orb, quadLegs, rot, rotationTrack, shell, sway, tone,
} from './animals-wild-kit';
import type { Finish, WildAnimalSpec } from './animals-wild-kit';

function buildRiverOtter(root: T.Group, p: Finish, detail: boolean) {
  const rock = tone(p, 'River stone', '#6d7378', 0.85, 0.05);
  const body = group(root, 'OtterBody');
  shell(body, [0, 0.1, 0], [0.84, 0.2, 1.38], rock, 0.56);
  orb(body, p, [0, 0.42, 0.02], [0.26, 0.22, 0.54], p.primary);
  orb(body, p, [0, 0.36, 0.1], [0.2, 0.16, 0.42], p.accent);
  for (const s of [-1, 1]) {
    for (const z of [0.34, -0.34]) {
      cap(body, p, [s * 0.2, 0.24, z], 0.075, 0.12, p.primary);
      orb(body, p, [s * 0.22, 0.2, z + 0.05], [0.09, 0.045, 0.12], p.dark, 8);
    }
  }
  const head = group(body, 'OtterHead', [0, 0.56, 0.52]);
  orb(head, p, [0, 0.04, 0.08], [0.2, 0.16, 0.22], p.primary);
  orb(head, p, [0, -0.02, 0.24], [0.13, 0.09, 0.12], p.accent, 8);
  orb(head, p, [0, 0.01, 0.35], [0.048, 0.036, 0.04], p.inset, 8);
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.16, 0.16, 0.02], [0.06, 0.06, 0.04], p.primary, 7);
    eye(head, p, [s * 0.11, 0.08, 0.22], 0.034, detail);
    if (detail) {
      cyl(head, p, [s * 0.18, -0.02, 0.28], 0.008, 0.008, 0.18, p.stencil, [0, 0, Math.PI / 2 + s * 0.2], 6);
    }
  }
  const tail = group(body, 'OtterTail', [0, 0.38, -0.48]);
  arc(tail, p, [[0, 0, 0], [0.08, -0.06, -0.34], [0.18, -0.1, -0.68]], 0.09, p.primary, 10, 8);
  cone(tail, p, [0.22, -0.11, -0.78], 0.08, 0.24, p.primary, [-Math.PI * 0.5, 0.25, 0], 8);
  const clam = group(body, 'RiverClam', [0, 0.26, 0.52]);
  orb(clam, p, [0, 0, 0], [0.14, 0.08, 0.12], p.stencil, 8);
  if (detail) orb(clam, p, [0, 0.05, 0], [0.1, 0.04, 0.09], p.accent, 7);
  root.animations = [
    new T.AnimationClip('Stream play', 2.8, [
      sway('OtterHead', 'y', 2.8, -0.45, 0.45),
      sway('OtterTail', 'y', 2.8, -0.42, 0.42),
    ]),
  ];
}

function buildSnowLeopard(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'LeopardBody');
  orb(body, p, [0, 0.64, 0.04], [0.28, 0.24, 0.62], p.primary);
  orb(body, p, [0, 0.66, 0.36], [0.26, 0.25, 0.28], p.primary);
  quadLegs(body, p, 0.2, 0.42, -0.44, 0.58, 0.095, 0.075, p.primary, p.stencil);
  const head = group(body, 'LeopardHead', [0, 0.8, 0.64]);
  orb(head, p, [0, 0.04, 0.06], [0.21, 0.19, 0.22], p.primary);
  orb(head, p, [0, -0.02, 0.24], [0.12, 0.09, 0.12], p.stencil, 8);
  orb(head, p, [0, 0.02, 0.34], [0.045, 0.036, 0.04], p.inset, 7);
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.16, 0.2, 0], [0.075, 0.08, 0.05], p.primary, 8);
    eye(head, p, [s * 0.11, 0.08, 0.22], 0.034, detail);
  }
  const tail = group(body, 'SnowTail', [0, 0.6, -0.54]);
  arc(tail, p, [[0, 0, 0], [0.12, -0.08, -0.36], [0.26, -0.02, -0.78], [0.18, 0.14, -1.08]], 0.095, p.primary, 12, 8);
  orb(tail, p, [0.18, 0.16, -1.1], [0.1, 0.1, 0.12], p.accent, 8);
  for (let i = 0; i < 6; i++) {
    const s = i % 2 === 0 ? 1 : -1;
    orb(body, p, [s * 0.26, 0.68 + (i % 3) * 0.04, -0.34 + i * 0.14], [0.05, 0.065, 0.07], p.accent, 7);
  }
  if (detail) {
    for (let i = 0; i < 4; i++) orb(tail, p, [0.06 + i * 0.05, -0.04 + i * 0.03, -0.22 - i * 0.22], [0.098, 0.098, 0.05], p.accent, 7);
  }
  root.animations = [
    new T.AnimationClip('Ridge prowl', 3.0, [
      sway('SnowTail', 'y', 3.0, -0.5, 0.5),
      sway('LeopardHead', 'y', 3.0, -0.42, 0.42),
    ]),
  ];
}

function buildMoose(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'MooseBody');
  orb(body, p, [0, 1.18, 0], [0.4, 0.42, 0.78], p.primary);
  orb(body, p, [0, 1.38, 0.44], [0.36, 0.36, 0.38], p.primary);
  quadLegs(body, p, 0.28, 0.5, -0.52, 1.14, 0.11, 0.075, p.primary, p.dark);
  const head = group(body, 'MooseHead', [0, 1.54, 0.78]);
  orb(head, p, [0, 0.06, 0.08], [0.2, 0.2, 0.24], p.primary);
  orb(head, p, [0, -0.04, 0.34], [0.16, 0.16, 0.24], p.primary, 9);
  cone(head, p, [0, -0.24, 0.08], 0.07, 0.26, p.primary, [Math.PI, 0, 0], 8);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.22, 0.18, -0.02], 0.07, 0.22, p.primary, [0.1, 0, -s * 0.9], 8);
    eye(head, p, [s * 0.16, 0.1, 0.2], 0.034, detail);
  }
  const antlers = group(head, 'PalmateAntlers', [0, 0.2, 0.04]);
  for (const s of [-1, 1]) {
    arc(antlers, p, [[s * 0.08, 0, 0], [s * 0.32, 0.12, -0.02], [s * 0.62, 0.32, 0.04]], 0.042, p.accent, 8, 6);
    orb(antlers, p, [s * 0.56, 0.28, 0.06], [0.28, 0.08, 0.24], p.accent, 8).rotation.z = s * 0.42;
    if (detail) {
      for (const z of [-0.08, 0.06, 0.2]) cone(antlers, p, [s * 0.74, 0.4, z], 0.032, 0.18, p.accent, [0.2, 0, -s * 0.5], 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Forest bellow', 3.2, [
      sway('MooseHead', 'x', 3.2, -0.32, 0.38),
    ]),
  ];
}

function buildRhino(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'RhinoBody');
  orb(body, p, [0, 0.78, -0.04], [0.54, 0.46, 0.88], p.primary);
  orb(body, p, [0, 0.84, 0.38], [0.56, 0.48, 0.34], p.primary);
  orb(body, p, [0, 0.8, -0.44], [0.55, 0.45, 0.32], p.primary);
  quadLegs(body, p, 0.36, 0.48, -0.54, 0.68, 0.18, 0.15, p.primary, p.dark);
  arc(body, p, [[0, 0.74, -0.9], [0, 0.52, -1.0]], 0.042, p.primary, 8, 6);
  const head = group(body, 'RhinoHead', [0, 0.88, 0.84]);
  orb(head, p, [0, 0.02, 0.14], [0.32, 0.28, 0.38], p.primary);
  cone(head, p, [0, 0.32, 0.46], 0.085, 0.46, p.accent, [0.28, 0, 0], 10);
  cone(head, p, [0, 0.24, 0.26], 0.065, 0.24, p.accent, [0.16, 0, 0], 8);
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.22, 0.28, -0.04], 0.06, 0.18, p.primary, [0, 0, -s * 0.45], 8);
    eye(head, p, [s * 0.24, 0.08, 0.28], 0.036, detail);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [-0.24, 0.18]) cyl(body, p, [s * 0.52, 0.8, z], 0.045, 0.045, 0.56, p.edge, [0, 0, s * 0.1], 8);
    }
  }
  root.animations = [
    new T.AnimationClip('Horn charge', 2.8, [
      sway('RhinoHead', 'x', 2.8, -0.24, 0.46),
    ]),
  ];
}

function buildHippo(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'HippoBody');
  orb(body, p, [0, 0.68, -0.06], [0.58, 0.46, 0.94], p.primary);
  quadLegs(body, p, 0.38, 0.52, -0.56, 0.54, 0.19, 0.16, p.primary, p.dark);
  cone(body, p, [0, 0.66, -1.0], 0.06, 0.22, p.primary, [-2.2, 0, 0], 7);
  const head = group(body, 'HippoHead', [0, 0.78, 0.86]);
  orb(head, p, [0, 0.08, 0.08], [0.36, 0.3, 0.34], p.primary);
  orb(head, p, [0, 0.06, 0.38], [0.34, 0.22, 0.28], p.primary);
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.2, 0.32, -0.02], [0.065, 0.08, 0.05], p.primary, 7);
    orb(head, p, [s * 0.18, 0.18, 0.56], [0.07, 0.06, 0.06], p.accent, 7);
    eye(head, p, [s * 0.22, 0.22, 0.26], 0.04, detail);
  }
  const jaw = group(head, 'HippoJaw', [0, -0.08, 0.14]);
  orb(jaw, p, [0, -0.06, 0.24], [0.3, 0.14, 0.3], p.primary, 9);
  orb(jaw, p, [0, 0.02, 0.24], [0.24, 0.06, 0.22], p.accent, 8);
  for (const s of [-1, 1]) {
    cone(jaw, p, [s * 0.18, 0.12, 0.42], 0.042, 0.18, p.stencil, [0.18, 0, 0], 7);
  }
  if (detail) {
    for (const s of [-1, 1]) cone(head, p, [s * 0.16, -0.08, 0.5], 0.032, 0.12, p.stencil, [Math.PI, 0, 0], 6);
  }
  root.animations = [
    new T.AnimationClip('River yawn', 3.2, [
      rotationTrack('HippoJaw', 'x', [0, 1.0, 2.2, 3.2], [0, 0.85, 0.85, 0]),
      sway('HippoHead', 'y', 3.2, -0.3, 0.3),
    ]),
  ];
}

function buildGorilla(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'GorillaBody');
  orb(body, p, [0, 0.78, -0.04], [0.46, 0.46, 0.56], p.primary);
  orb(body, p, [0, 0.94, -0.14], [0.42, 0.32, 0.44], p.accent);
  for (const s of [-1, 1]) {
    cyl(body, p, [s * 0.3, 0.32, -0.34], 0.16, 0.13, 0.52, p.primary);
    orb(body, p, [s * 0.3, 0.08, -0.26], [0.15, 0.08, 0.22], p.dark, 8);
    const arm = group(body, s > 0 ? 'ArmL' : 'ArmR', [s * 0.46, 1.06, 0.28]);
    cap(arm, p, [s * 0.08, -0.32, 0.14], 0.16, 0.44, p.primary, [0.24, 0, s * 0.12]);
    cap(arm, p, [s * 0.12, -0.68, 0.24], 0.14, 0.34, p.primary, [0.06, 0, 0]);
    orb(arm, p, [s * 0.12, -0.94, 0.26], [0.15, 0.09, 0.18], p.dark, 8);
  }
  const head = group(body, 'GorillaHead', [0, 1.24, 0.34]);
  orb(head, p, [0, 0.08, 0.06], [0.26, 0.28, 0.26], p.primary);
  orb(head, p, [0, 0.18, 0.22], [0.22, 0.08, 0.12], p.dark, 8);
  orb(head, p, [0, -0.04, 0.24], [0.18, 0.14, 0.14], p.dark, 8);
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.24, 0.08, 0.04], [0.06, 0.08, 0.05], p.dark, 7);
    eye(head, p, [s * 0.11, 0.12, 0.28], 0.036, detail);
  }
  if (detail) {
    orb(body, p, [0, 0.88, 0.34], [0.32, 0.24, 0.18], p.dark, 8);
    orb(head, p, [0, 0.32, 0.02], [0.16, 0.14, 0.18], p.primary, 7);
  }
  root.animations = [
    new T.AnimationClip('Chest display', 2.8, [
      sway('ArmL', 'x', 2.8, -0.82, 0.15),
      sway('ArmR', 'x', 2.8, -0.82, 0.15),
      sway('GorillaHead', 'y', 2.8, -0.4, 0.4),
    ]),
  ];
}

function buildCamel(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'CamelBody');
  orb(body, p, [0, 1.12, 0], [0.38, 0.38, 0.72], p.primary);
  orb(body, p, [0, 1.56, -0.02], [0.28, 0.36, 0.36], p.primary);
  quadLegs(body, p, 0.26, 0.46, -0.48, 1.06, 0.1, 0.075, p.primary, p.dark);
  arc(body, p, [[0, 1.08, -0.7], [0, 0.76, -0.84]], 0.038, p.primary, 8, 6);
  const saddle = group(body, 'SaddleCloth', [0, 1.48, -0.02]);
  orb(saddle, p, [0, 0.08, 0], [0.33, 0.32, 0.4], p.accent, 9);
  for (const s of [-1, 1]) shell(saddle, [s * 0.38, -0.18, 0], [0.08, 0.42, 0.62], p.accent, 0.24);
  const neck = group(body, 'CamelNeck', [0, 1.16, 0.64]);
  arc(neck, p, [[0, 0, 0], [0, -0.08, 0.28], [0, 0.28, 0.56], [0, 0.68, 0.62]], 0.13, p.primary, 12, 8);
  orb(neck, p, [0, 0.74, 0.68], [0.16, 0.16, 0.22], p.primary);
  cyl(neck, p, [0, 0.68, 0.92], 0.085, 0.11, 0.24, p.primary, [Math.PI * 0.54, 0, 0], 8);
  for (const s of [-1, 1]) {
    orb(neck, p, [s * 0.16, 0.86, 0.58], [0.055, 0.08, 0.04], p.primary, 7);
    eye(neck, p, [s * 0.13, 0.78, 0.8], 0.032, detail);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [-0.2, 0, 0.2]) orb(saddle, p, [s * 0.4, -0.4, z], [0.04, 0.06, 0.04], p.stencil, 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Dune stride', 3.2, [
      sway('CamelNeck', 'x', 3.2, -0.25, 0.32),
      sway('CamelNeck', 'y', 3.2, -0.35, 0.35),
    ]),
  ];
}

export const animalsWildB: readonly WildAnimalSpec[] = [
  {
    id: 'playful-river-otter',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('OtterHead', 'Otter head', 'y', [-40, 40], 'Turns the whiskered river otter head'),
      rot('OtterTail', 'Rudder tail', 'y', [-35, 35], 'Swishes the thick tapered river otter tail'),
    ],
    detachableParts: [det('RiverClam', 'River shell', 'Removable river clam cradled beside the otter paws')],
    build: buildRiverOtter,
  },
  {
    id: 'himalayan-snow-leopard',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('SnowTail', 'Snow tail', 'y', [-45, 45], 'Swings the long thick mountain leopard tail'),
      rot('LeopardHead', 'Leopard head', 'y', [-35, 35], 'Turns the spotted snow leopard head'),
    ],
    build: buildSnowLeopard,
  },
  {
    id: 'antlered-woodland-moose',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('MooseHead', 'Moose head', 'x', [-25, 30], 'Nods the heavy woodland bull moose head'),
    ],
    detachableParts: [det('PalmateAntlers', 'Palmate antlers', 'Removable broad palmate moose antler rack')],
    build: buildMoose,
  },
  {
    id: 'armored-white-rhinoceros',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('RhinoHead', 'Horned head', 'x', [-20, 35], 'Lowers and tosses the twin-horned rhino head'),
    ],
    build: buildRhino,
  },
  {
    id: 'river-hippopotamus',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('HippoJaw', 'Yawning jaw', 'x', [0, 58], 'Opens the enormous tusked hippopotamus jaw'),
      rot('HippoHead', 'Hippo head', 'y', [-25, 25], 'Turns the broad hippopotamus head'),
    ],
    build: buildHippo,
  },
  {
    id: 'silverback-gorilla',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('ArmL', 'Left arm', 'x', [-65, 15], 'Raises and swings the powerful left gorilla arm'),
      rot('ArmR', 'Right arm', 'x', [-65, 15], 'Raises and swings the powerful right gorilla arm'),
      rot('GorillaHead', 'Gorilla head', 'y', [-35, 35], 'Turns the heavy-browed silverback head'),
    ],
    build: buildGorilla,
  },
  {
    id: 'dromedary-desert-camel',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('CamelNeck', 'Curved neck', 'x', [-22, 28], 'Sways and nods the curved desert camel neck'),
    ],
    detachableParts: [det('SaddleCloth', 'Woven saddle', 'Removable desert woven saddle blanket over the hump')],
    build: buildCamel,
  },
];
