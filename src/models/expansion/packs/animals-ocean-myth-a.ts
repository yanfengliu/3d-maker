import * as T from 'three';
import {
  arc, cap, cone, cyl, eye, group, lathe, orb, rot, shell, sway, tone,
  wavePedestal,
} from './animals-ocean-myth-kit';
import type { Finish, OceanMythSpec } from './animals-ocean-myth-kit';

function buildBlueWhale(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'WhaleBody');
  wavePedestal(body, p, 1.44, 2.38, 0.56, -0.06);
  const whale = group(body, 'BreachArc', [0, 0.78, 0]);
  whale.rotation.x = -0.32;
  lathe(whale, p, [0, 0, 0.1], [
    [0.01, -1.16], [0.16, -0.84], [0.32, -0.4], [0.46, 0.14], [0.48, 0.62], [0.36, 1.06], [0.01, 1.24],
  ], p.primary, [Math.PI / 2, 0, 0], 14).scale.set(0.95, 1, 0.85);
  orb(whale, p, [0, -0.18, 0.42], [0.4, 0.24, 0.68], p.accent, 10);
  cone(whale, p, [0, 0.36, -0.44], 0.08, 0.22, p.primary, [-0.65, 0, 0], 7);
  for (const [side, name] of [[1, 'FlipperL'], [-1, 'FlipperR']] as const) {
    const fl = group(whale, name, [side * 0.42, -0.08, 0.32]);
    orb(fl, p, [side * 0.38, -0.06, -0.12], [0.48, 0.06, 0.18], p.primary, 9).rotation.y = side * 0.45;
    eye(whale, p, [side * 0.38, 0.04, 0.82], 0.036, detail, [side * 0.8, 0.2, 0.4]);
  }
  const fluke = group(whale, 'TailFluke', [0, 0, -1.12]);
  for (const s of [-1, 1]) {
    orb(fluke, p, [s * 0.34, 0, -0.18], [0.44, 0.05, 0.22], p.primary, 9).rotation.y = -s * 0.36;
  }
  if (detail) {
    for (let i = -3; i <= 3; i++) {
      cap(whale, p, [i * 0.09, -0.34, 0.56], 0.018, 0.72, p.primary, [Math.PI / 2, 0, 0], 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Ocean breach', 3.0, [
      sway('TailFluke', 'x', 3.0, -0.45, 0.45),
      sway('FlipperL', 'z', 3.0, -0.32, 0.48),
      sway('FlipperR', 'z', 3.0, -0.48, 0.32),
    ]),
  ];
}

function buildHammerhead(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'SharkBody');
  wavePedestal(body, p, 1.18, 1.96, 0.46, 0.06);
  lathe(body, p, [0, 0.64, 0.08], [
    [0.01, -1.04], [0.1, -0.78], [0.22, -0.36], [0.3, 0.14], [0.28, 0.58], [0.16, 0.96], [0.01, 1.08],
  ], p.primary, [Math.PI / 2, 0, 0], 12).scale.set(0.88, 1, 0.92);
  orb(body, p, [0, 0.5, 0.18], [0.24, 0.15, 0.62], p.accent, 9);
  cone(body, p, [0, 1.04, 0.12], 0.14, 0.52, p.primary, [-0.42, 0, 0], 8).scale.set(0.32, 1, 1.25);
  const head = group(body, 'HammerHead', [0, 0.64, 0.98]);
  shell(head, [0, 0.02, 0.08], [0.94, 0.12, 0.28], p.primary, 0.48);
  for (const s of [-1, 1]) {
    eye(head, p, [s * 0.46, 0.02, 0.12], 0.042, detail, [s * 0.9, 0.1, 0.2]);
    orb(body, p, [s * 0.48, 0.5, 0.24], [0.42, 0.045, 0.18], p.primary, 8).rotation.set(0.1, s * 0.45, -s * 0.22);
    if (detail) {
      for (let i = 0; i < 4; i++) cap(body, p, [s * 0.24, 0.62, 0.56 - i * 0.08], 0.014, 0.12, p.dark, [0, 0, 0], 6);
    }
  }
  const tail = group(body, 'TailFin', [0, 0.64, -0.94]);
  cone(tail, p, [0, 0.24, -0.3], 0.16, 0.62, p.primary, [-0.95, 0, 0], 8).scale.set(0.24, 1, 1.1);
  cone(tail, p, [0, -0.16, -0.22], 0.13, 0.38, p.accent, [-2.1, 0, 0], 8).scale.set(0.24, 1, 1.1);
  root.animations = [
    new T.AnimationClip('Reef patrol', 2.8, [
      sway('TailFin', 'y', 2.8, -0.58, 0.58),
      sway('HammerHead', 'y', 2.8, -0.32, 0.32),
    ]),
  ];
}

function buildOctopus(root: T.Group, p: Finish, detail: boolean) {
  const rock = tone(p, 'Seafloor rock', '#595f63', 0.86, 0.05);
  const body = group(root, 'OctopusBody');
  shell(body, [0, 0.1, 0], [1.38, 0.2, 1.38], rock, 0.56);
  const mantle = group(body, 'OctoMantle', [0, 0.52, 0]);
  orb(mantle, p, [0, 0.36, -0.14], [0.42, 0.52, 0.46], p.primary, 12).rotation.x = -0.25;
  orb(mantle, p, [0, 0.04, 0.08], [0.34, 0.24, 0.34], p.primary, 10);
  for (const s of [-1, 1]) {
    orb(mantle, p, [s * 0.22, 0.12, 0.3], [0.1, 0.1, 0.09], p.accent, 8);
    eye(mantle, p, [s * 0.23, 0.12, 0.36], 0.046, detail);
  }
  for (let i = 0; i < 6; i++) {
    const a = ((i + 1.5) * Math.PI * 2) / 8 + Math.PI / 4;
    const ca = Math.cos(a), sa = Math.sin(a);
    arc(body, p, [
      [ca * 0.26, 0.4, sa * 0.26],
      [ca * 0.62, 0.28, sa * 0.62],
      [ca * 0.88, 0.12, sa * 0.88],
      [ca * 0.96, 0.26, sa * 0.96],
    ], 0.085, p.primary, 10, 7);
    if (detail) {
      for (const t of [0.5, 0.72]) orb(body, p, [ca * t, 0.16, sa * t], [0.055, 0.045, 0.055], p.accent, 6);
    }
  }
  for (const [side, name] of [[1, 'TentacleL'], [-1, 'TentacleR']] as const) {
    const tent = group(body, name, [side * 0.22, 0.4, 0.26]);
    arc(tent, p, [[0, 0, 0], [side * 0.26, 0.1, 0.34], [side * 0.38, 0.38, 0.56], [side * 0.24, 0.62, 0.66]], 0.082, p.primary, 12, 7);
    if (detail) {
      for (const [x, y, z] of [[0.18, 0.04, 0.26], [0.3, 0.24, 0.46]] as const) orb(tent, p, [side * x, y, z], [0.05, 0.05, 0.05], p.accent, 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Tentacle wave', 3.0, [
      sway('TentacleL', 'x', 3.0, -0.45, 0.45),
      sway('TentacleR', 'x', 3.0, 0.45, -0.45),
      sway('OctoMantle', 'x', 3.0, -0.18, 0.18),
    ]),
  ];
}

function buildMantaRay(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'MantaBody');
  wavePedestal(body, p, 1.38, 1.88, 0.52, 0.04);
  orb(body, p, [0, 0.68, 0.06], [0.56, 0.16, 0.68], p.primary, 12);
  orb(body, p, [0, 0.6, 0.08], [0.48, 0.1, 0.58], p.accent, 10);
  arc(body, p, [[0, 0.66, -0.58], [0, 0.62, -1.04], [0, 0.68, -1.56]], 0.032, p.primary, 10, 6);
  for (const [side, name] of [[1, 'WingL'], [-1, 'WingR']] as const) {
    arc(body, p, [[side * 0.22, 0.66, 0.62], [side * 0.24, 0.64, 0.94]], 0.055, p.primary, 8, 6);
    eye(body, p, [side * 0.34, 0.72, 0.54], 0.035, detail, [side * 0.8, 0.3, 0.3]);
    const wing = group(body, name, [side * 0.46, 0.68, 0.04]);
    cone(wing, p, [side * 0.52, 0, -0.06], 0.42, 1.12, p.primary, [0, 0, -side * Math.PI * 0.5], 8).scale.set(0.2, 1, 1.05);
    if (detail) orb(wing, p, [side * 0.34, 0.08, -0.02], [0.22, 0.03, 0.16], p.accent, 7);
  }
  root.animations = [
    new T.AnimationClip('Pelagic glide', 3.0, [
      sway('WingL', 'z', 3.0, -0.45, 0.52),
      sway('WingR', 'z', 3.0, -0.52, 0.45),
    ]),
  ];
}

function buildNarwhal(root: T.Group, p: Finish, detail: boolean) {
  const ice = tone(p, 'Arctic wave', '#8ecae6', 0.42, 0.16);
  const body = group(root, 'NarwhalBody');
  shell(body, [0, 0.08, 0], [1.14, 0.16, 1.88], ice, 0.56);
  cyl(body, p, [0, 0.34, -0.06], 0.24, 0.34, 0.52, ice, [0, 0, 0], 10);
  lathe(body, p, [0, 0.66, -0.04], [
    [0.01, -0.96], [0.14, -0.7], [0.28, -0.28], [0.38, 0.18], [0.36, 0.58], [0.24, 0.88], [0.01, 0.96],
  ], p.primary, [Math.PI / 2, 0, 0], 12);
  orb(body, p, [0, 0.54, 0.14], [0.3, 0.2, 0.56], p.accent, 10);
  const tusk = group(body, 'SpiralTusk', [0, 0.68, 0.9]);
  cone(tusk, p, [0, 0, 0.66], 0.068, 1.38, p.accent, [Math.PI / 2, 0, 0], 10);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      cyl(tusk, p, [0, 0, 0.14 + i * 0.18], 0.064 - i * 0.008, 0.064 - i * 0.008, 0.04, p.stencil, [Math.PI / 2, 0, 0], 8);
    }
  }
  for (const [side, name] of [[1, 'FlipperL'], [-1, 'FlipperR']] as const) {
    const fl = group(body, name, [side * 0.32, 0.58, 0.28]);
    orb(fl, p, [side * 0.22, -0.05, -0.08], [0.28, 0.05, 0.14], p.primary, 8).rotation.y = side * 0.4;
    eye(body, p, [side * 0.28, 0.72, 0.68], 0.034, detail, [side * 0.8, 0.2, 0.4]);
  }
  const fluke = group(body, 'TailFluke', [0, 0.66, -0.98]);
  for (const s of [-1, 1]) orb(fluke, p, [s * 0.28, 0, -0.14], [0.36, 0.045, 0.18], p.primary, 8).rotation.y = -s * 0.35;
  root.animations = [
    new T.AnimationClip('Arctic swim', 2.8, [
      sway('TailFluke', 'x', 2.8, -0.45, 0.45),
      sway('FlipperL', 'z', 2.8, -0.35, 0.35),
      sway('FlipperR', 'z', 2.8, 0.35, -0.35),
    ]),
  ];
}

function buildKingCrab(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'KingCrabBody');
  orb(body, p, [0, 0.64, -0.04], [0.54, 0.28, 0.48], p.primary, 12);
  orb(body, p, [0, 0.48, -0.04], [0.46, 0.18, 0.4], p.accent, 10);
  for (const s of [-1, 1]) {
    cyl(body, p, [s * 0.16, 0.84, 0.34], 0.028, 0.034, 0.18, p.primary, [0.3, 0, 0], 8);
    eye(body, p, [s * 0.16, 0.94, 0.38], 0.048, detail);
    for (const [i, z] of [-0.28, 0, 0.24].entries()) {
      const hip: [number, number, number] = [s * 0.44, 0.58, z];
      const knee: [number, number, number] = [s * (0.94 + (i === 1 ? 0.12 : 0)), 0.82, z * 1.15];
      const foot: [number, number, number] = [s * (1.18 + (i === 1 ? 0.12 : 0)), 0.04, z * 1.3];
      arc(body, p, [hip, knee, foot], 0.052, p.primary, 10, 7);
      orb(body, p, knee, [0.072, 0.072, 0.072], p.accent, 7);
    }
    const claw = group(body, s > 0 ? 'ClawL' : 'ClawR', [s * 0.4, 0.56, 0.34]);
    const scale = s > 0 ? 1.15 : 0.95;
    arc(claw, p, [[0, 0, 0], [s * 0.26, 0.04, 0.26], [s * 0.22, 0.08, 0.52]], 0.07 * scale, p.primary, 8, 7);
    orb(claw, p, [s * 0.2, 0.1, 0.62], [0.16 * scale, 0.13 * scale, 0.22 * scale], p.primary, 9);
    cone(claw, p, [s * 0.26, 0.12, 0.86], 0.08 * scale, 0.28 * scale, p.primary, [Math.PI * 0.48, -s * 0.28, 0], 8);
    cone(claw, p, [s * 0.1, 0.08, 0.82], 0.06 * scale, 0.24 * scale, p.accent, [Math.PI * 0.5, s * 0.3, 0], 8);
  }
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      cone(body, p, [Math.cos(a) * 0.34, 0.9, Math.sin(a) * 0.3], 0.045, 0.14, p.accent, [0, 0, 0], 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Abyssal snap', 2.6, [
      sway('ClawL', 'y', 2.6, -0.45, 0.35),
      sway('ClawR', 'y', 2.6, -0.35, 0.45),
    ]),
  ];
}

function buildSeahorse(root: T.Group, p: Finish, detail: boolean) {
  const coral = tone(p, 'Reef coral', '#d95d78', 0.78, 0.05);
  const body = group(root, 'SeahorseBody');
  shell(body, [0, 0.08, 0], [0.78, 0.16, 0.78], coral, 0.56);
  arc(body, p, [[0, 0.12, -0.06], [0.06, 0.44, -0.04], [-0.04, 0.78, -0.06]], 0.09, coral, 10, 8);
  arc(body, p, [[0.06, 0.36, -0.04], [0.24, 0.58, 0.08]], 0.065, coral, 8, 6);
  arc(body, p, [
    [0.06, 0.24, 0.14], [0.16, 0.34, -0.02], [0, 0.48, -0.14], [0, 0.82, 0.08], [0, 1.18, 0.04], [0, 1.44, 0.14],
  ], 0.14, p.primary, 14, 9);
  orb(body, p, [0, 0.98, 0.18], [0.2, 0.28, 0.22], p.accent, 10);
  const fin = group(body, 'DorsalFin', [0, 0.96, -0.1]);
  cone(fin, p, [0, 0, -0.16], 0.16, 0.34, p.accent, [-Math.PI / 2, 0, 0], 8).scale.set(0.22, 1, 1);
  const head = group(body, 'SeahorseHead', [0, 1.44, 0.14]);
  orb(head, p, [0, 0.08, 0.06], [0.17, 0.18, 0.2], p.primary, 10);
  cyl(head, p, [0, 0.02, 0.34], 0.045, 0.075, 0.38, p.primary, [Math.PI * 0.54, 0, 0], 10);
  cone(head, p, [0, 0.28, -0.02], 0.09, 0.22, p.accent, [-0.25, 0, 0], 7);
  for (const s of [-1, 1]) eye(head, p, [s * 0.15, 0.12, 0.14], 0.04, detail, [s * 0.8, 0.2, 0.4]);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      orb(body, p, [0, 0.64 + i * 0.13, 0.14 + Math.sin(i * 0.7) * 0.04], [0.18, 0.035, 0.18], p.accent, 8);
    }
  }
  root.animations = [
    new T.AnimationClip('Coral drift', 2.6, [
      sway('DorsalFin', 'y', 2.6, -0.68, 0.68),
      sway('SeahorseHead', 'x', 2.6, -0.25, 0.32),
    ]),
  ];
}

export const animalsOceanMythA: readonly OceanMythSpec[] = [
  {
    id: 'breaching-blue-whale',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('TailFluke', 'Tail fluke', 'x', [-32, 32], 'Sweeps the massive blue whale tail fluke up and down'),
      rot('FlipperL', 'Port flipper', 'z', [-25, 35], 'Sweeps the port pectoral whale flipper'),
      rot('FlipperR', 'Starboard flipper', 'z', [-35, 25], 'Sweeps the starboard pectoral whale flipper'),
    ],
    build: buildBlueWhale,
  },
  {
    id: 'hammerhead-shark',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('TailFin', 'Caudal tail fin', 'y', [-40, 40], 'Sweeps the sickle shark tail fin side to side'),
      rot('HammerHead', 'Hammerhead foil', 'y', [-25, 25], 'Sweeps the wide T-shaped hammerhead cephalofoil'),
    ],
    build: buildHammerhead,
  },
  {
    id: 'giant-reef-octopus',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('TentacleL', 'Left raised arm', 'x', [-35, 35], 'Waves the front-left suction-cupped tentacle'),
      rot('TentacleR', 'Right raised arm', 'x', [-35, 35], 'Waves the front-right suction-cupped tentacle'),
      rot('OctoMantle', 'Mantle head', 'x', [-12, 12], 'Pulses and nods the bulbous octopus mantle'),
    ],
    build: buildOctopus,
  },
  {
    id: 'gliding-manta-ray',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('WingL', 'Left wingtip', 'z', [-32, 38], 'Flaps the sweeping left diamond manta wing'),
      rot('WingR', 'Right wingtip', 'z', [-38, 32], 'Flaps the sweeping right diamond manta wing'),
    ],
    build: buildMantaRay,
  },
  {
    id: 'spotted-narwhal',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('TailFluke', 'Tail fluke', 'x', [-32, 32], 'Sweeps the arctic narwhal tail fluke'),
      rot('FlipperL', 'Left flipper', 'z', [-25, 25], 'Flutters the left pectoral flipper'),
      rot('FlipperR', 'Right flipper', 'z', [-25, 25], 'Flutters the right pectoral flipper'),
    ],
    build: buildNarwhal,
  },
  {
    id: 'giant-king-crab',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('ClawL', 'Crusher claw', 'y', [-32, 26], 'Snaps the oversized left king-crab pincer'),
      rot('ClawR', 'Cutter claw', 'y', [-26, 32], 'Snaps the right king-crab pincer'),
    ],
    build: buildKingCrab,
  },
  {
    id: 'curled-seahorse',
    physicsBody: 'dynamic',
    riggedParts: [
      rot('DorsalFin', 'Dorsal fin', 'y', [-45, 45], 'Flutters the translucent seahorse dorsal fin'),
      rot('SeahorseHead', 'Tubular head', 'x', [-22, 25], 'Nods the crowned seahorse head'),
    ],
    build: buildSeahorse,
  },
];
