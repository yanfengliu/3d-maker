import * as T from 'three';
import {
  arc, billowSail, cone, cyl, dome, fastener, group, light, propHub, railBogie, rbox, ring,
  rotationTrack, rotorBlades, rp, shell, spinTrack, strut, sway, wavePlinth,
} from './vehicles-sea-air-kit';
import type { Finish, SeaAirSpec } from './vehicles-sea-air-kit';

function buildPolarIcebreaker(root: T.Group, p: Finish, detail: boolean) {
  const ib = group(root, 'Icebreaker');
  wavePlinth(ib, p, 1.56, 3.44, 0.12);
  shell(ib, [0, 0.34, 0], [1.34, 0.44, 3.12], p.primary, 0.56);
  shell(ib, [0, 0.62, 0.24], [1.28, 0.24, 2.74], p.primary, 0.52);
  shell(ib, [0, 1.04, 0.38], [1.06, 0.68, 1.12], p.accent, 0.34);
  shell(ib, [0, 1.54, 0.44], [1.18, 0.38, 0.84], p.accent, 0.36);
  rbox(ib, p, [0, 1.56, 0.88], [0.96, 0.22, 0.04], p.optic);
  cyl(ib, p, [0, 1.38, -0.26], 0.18, 0.22, 0.72, p.dark, [0, 0, 0], 12);
  shell(ib, [0, 0.78, -0.96], [1.06, 0.08, 0.94], p.edge, 0.34);
  ring(ib, [0, 0.84, -0.96], 0.36, 0.045, 0.04, p.stencil);
  const radar = group(ib, 'MarineRadar', [0, 2.02, 0.46]);
  cyl(ib, p, [0, 1.84, 0.46], 0.05, 0.06, 0.34, p.alloy, [0, 0, 0], 10);
  rbox(radar, p, [0, 0.04, 0], [0.64, 0.06, 0.1], p.primary);
  const crane = group(ib, 'DeckCrane', [0.42, 0.82, -0.46]);
  cyl(crane, p, [0, 0.16, 0], 0.08, 0.1, 0.32, p.primary, [0, 0, 0], 10);
  strut(crane, [0, 0.28, 0], [0, 0.62, -0.58], 0.045, p.primary, 8);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(ib, p, [s * 0.66, 0.46, 0], [0.04, 0.1, 2.68], p.stencil);
      rbox(ib, p, [s * 0.6, 1.56, 0.44], [0.04, 0.2, 0.56], p.optic);
    }
    if (p.hd) fastener(ib, [0, 1.74, 0.44], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Arctic transit', 3.2, [
      spinTrack('MarineRadar', 'y', 3.2, 2),
      sway('DeckCrane', 'y', 3.2, -0.75, 0.75),
    ]),
  ];
}

function buildCropDuster(root: T.Group, p: Finish, detail: boolean) {
  const pl = group(root, 'CropDuster');
  shell(pl, [0, 0.68, 0.28], [0.58, 0.54, 1.56], p.primary, 0.44);
  cyl(pl, p, [0, 0.68, 1.14], 0.26, 0.3, 0.28, p.dark, [Math.PI / 2, 0, 0], 14);
  cyl(pl, p, [0, 0.68, -0.82], 0.14, 0.28, 1.06, p.primary, [Math.PI / 2, 0, 0], 12);
  shell(pl, [0, 1.04, -0.06], [0.46, 0.34, 0.68], p.optic, 0.44);
  shell(pl, [0, 1.22, -0.06], [0.42, 0.08, 0.56], p.accent, 0.4);
  shell(pl, [0, 0.48, 0.34], [3.34, 0.09, 0.64], p.primary, 0.34);
  for (const s of [-1, 1]) {
    rbox(pl, p, [s * 1.24, 0.53, 0.34], [0.46, 0.04, 0.56], p.accent);
    strut(pl, [s * 0.24, 0.44, 0.52], [s * 0.48, 0.18, 0.58], 0.032, p.dark, 8);
    cyl(pl, p, [s * 0.5, 0.18, 0.58], 0.18, 0.18, 0.1, p.tire, [0, 0, Math.PI / 2], 10);
    cyl(pl, p, [s * 0.5, 0.18, 0.58], 0.1, 0.1, 0.12, p.accent, [0, 0, Math.PI / 2], 8);
    strut(pl, [s * 0.38, 0.42, 0.08], [s * 1.52, 0.42, 0.08], 0.02, p.alloy, 8);
    for (const x of [0.64, 1.04, 1.44]) strut(pl, [s * x, 0.44, 0.16], [s * x, 0.42, 0.08], 0.016, p.edge, 6);
  }
  strut(pl, [0, 0.52, -1.16], [0, 0.1, -1.26], 0.024, p.dark, 8);
  cyl(pl, p, [0, 0.09, -1.26], 0.09, 0.09, 0.06, p.tire, [0, 0, Math.PI / 2], 8);
  shell(pl, [0, 0.74, -1.24], [1.08, 0.06, 0.34], p.accent, 0.38);
  shell(pl, [0, 0.94, -1.18], [0.08, 0.42, 0.36], p.primary, 0.36);
  const rudder = group(pl, 'TailRudder', [0, 0.94, -1.36]);
  shell(rudder, [0, 0, -0.14], [0.07, 0.44, 0.26], p.accent, 0.36);
  propHub(pl, 'NoseProp', [0, 0.68, 1.32], p, 0.44, 3);
  if (detail) {
    for (const s of [-1, 1]) {
      for (const x of [0.64, 1.04, 1.44]) cone(pl, p, [s * x, 0.36, 0.08], 0.035, 0.09, p.stencil, [Math.PI, 0, 0], 6);
      rbox(pl, p, [s * 0.31, 0.68, 0.24], [0.03, 0.08, 1.24], p.accent);
    }
    if (p.hd) fastener(pl, [0, 0.96, 0.72], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Field pass', 2.4, [
      spinTrack('NoseProp', 'z', 2.4, 5),
      sway('TailRudder', 'y', 2.4, -0.42, 0.42),
    ]),
  ];
}

function buildChinookHeli(root: T.Group, p: Finish, detail: boolean) {
  const ch = group(root, 'Chinook');
  shell(ch, [0, 0.64, 0], [0.96, 0.76, 2.54], p.primary, 0.38);
  dome(ch, p, [0, 0.58, 1.26], [0.46, 0.36, 0.48], p.primary, 10);
  dome(ch, p, [0, 0.7, 1.32], [0.42, 0.24, 0.38], p.optic, 10);
  shell(ch, [0, 1.12, 0.92], [0.48, 0.34, 0.64], p.primary, 0.42);
  shell(ch, [0, 1.24, -1.04], [0.54, 0.58, 0.76], p.primary, 0.4);
  for (const s of [-1, 1]) {
    shell(ch, [s * 0.56, 0.46, -0.06], [0.22, 0.32, 1.94], p.accent, 0.44);
    for (const z of [0.68, -0.78]) {
      strut(ch, [s * 0.52, 0.34, z], [s * 0.56, 0.14, z], 0.036, p.dark, 8);
      cyl(ch, p, [s * 0.56, 0.14, z], 0.14, 0.14, 0.1, p.tire, [0, 0, Math.PI / 2], 10);
    }
    for (const z of [-0.46, 0.04, 0.52]) {
      cyl(ch, p, [s * 0.5, 0.74, z], 0.09, 0.09, 0.05, p.optic, [0, 0, Math.PI / 2], 10);
    }
  }
  const fRotor = group(ch, 'FrontRotor', [0, 1.38, 0.92]);
  cyl(ch, p, [0, 1.28, 0.92], 0.08, 0.1, 0.14, p.edge, [0, 0, 0], 10);
  cyl(fRotor, p, [0, 0.02, 0], 0.12, 0.13, 0.08, p.dark, [0, 0, 0], 12);
  rotorBlades(fRotor, p, 3, 1.08, 0.1, p.dark, p.accent);
  const rRotor = group(ch, 'RearRotor', [0, 1.62, -1.04]);
  cyl(ch, p, [0, 1.52, -1.04], 0.08, 0.1, 0.14, p.edge, [0, 0, 0], 10);
  cyl(rRotor, p, [0, 0.02, 0], 0.12, 0.13, 0.08, p.dark, [0, 0, 0], 12);
  rotorBlades(rRotor, p, 3, 1.08, 0.1, p.dark, p.accent);
  const ramp = group(ch, 'RearRamp', [0, 0.32, -1.28]);
  shell(ramp, [0, 0.24, -0.04], [0.68, 0.52, 0.08], p.edge, 0.24);
  if (detail) {
    for (const s of [-1, 1]) {
      cyl(ch, p, [s * 0.44, 0.98, -1.08], 0.12, 0.14, 0.58, p.dark, [Math.PI / 2, 0, 0], 10);
    }
    if (p.hd) fastener(ch, [0, 1.04, 0], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Heavy airlift', 2.6, [
      spinTrack('FrontRotor', 'y', 2.6, 4),
      spinTrack('RearRotor', 'y', 2.6, -4),
      rotationTrack('RearRamp', 'x', [0, 0.8, 1.8, 2.6], [0, -1.05, -1.05, 0]),
    ]),
  ];
}

function buildCabooseCar(root: T.Group, p: Finish, detail: boolean) {
  const cab = group(root, 'Caboose');
  shell(cab, [0, 0.36, 0], [1.22, 0.18, 3.12], p.dark, 0.24);
  railBogie(cab, p, detail, 0.92);
  railBogie(cab, p, detail, -0.92);
  shell(cab, [0, 0.98, 0], [1.26, 1.08, 2.34], p.primary, 0.22);
  shell(cab, [0, 1.56, 0], [1.34, 0.12, 3.06], p.dark, 0.3);
  shell(cab, [0, 1.86, 0], [0.96, 0.52, 0.94], p.primary, 0.26);
  shell(cab, [0, 2.16, 0], [1.06, 0.1, 1.04], p.dark, 0.34);
  for (const ez of [-1, 1]) {
    rbox(cab, p, [0, 1.88, ez * 0.49], [0.68, 0.22, 0.04], p.optic);
    for (const s of [-1, 1]) {
      strut(cab, [s * 0.52, 0.44, ez * 1.48], [s * 0.52, 1.02, ez * 1.48], 0.024, p.accent, 8);
      strut(cab, [s * 0.52, 1.02, ez * 1.48], [s * 0.52, 1.5, ez * 1.48], 0.022, p.accent, 8);
    }
    strut(cab, [-0.52, 0.98, ez * 1.48], [0.52, 0.98, ez * 1.48], 0.024, p.accent, 8);
  }
  for (const s of [-1, 1]) {
    for (const z of [-0.62, 0.62]) rbox(cab, p, [s * 0.65, 1.04, z], [0.04, 0.36, 0.42], p.optic);
    rbox(cab, p, [s * 0.65, 0.68, 0], [0.04, 0.1, 2.2], p.accent);
  }
  const brake = group(cab, 'BrakeWheel', [0.32, 1.12, 1.48]);
  strut(cab, [0.32, 0.44, 1.48], [0.32, 1.12, 1.48], 0.022, p.alloy, 8);
  ring(brake, [0, 0, 0], 0.16, 0.025, 0.04, p.accent);
  rbox(brake, p, [0, 0, 0], [0.28, 0.03, 0.03], p.alloy);
  if (detail) {
    cyl(cab, p, [-0.28, 1.82, 0.78], 0.06, 0.07, 0.54, p.dark, [0, 0, 0], 10);
    for (const s of [-1, 1]) rbox(cab, p, [s * 0.5, 1.88, 0], [0.04, 0.22, 0.54], p.optic);
    if (p.hd) fastener(cab, [0, 2.22, 0], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Brake turn', 2.8, [
      spinTrack('BrakeWheel', 'y', 2.8, 3),
    ]),
  ];
}

function buildVikingLongship(root: T.Group, p: Finish, detail: boolean) {
  const ship = group(root, 'Longship');
  wavePlinth(ship, p, 1.42, 3.36, 0.12);
  shell(ship, [0, 0.3, 0], [1.08, 0.38, 2.74], p.primary, 0.64);
  arc(ship, p, [[0, 0.36, 1.24], [0, 0.86, 1.56], [0, 1.38, 1.38]], 0.075, p.primary, 12, 8);
  shell(ship, [0, 1.42, 1.46], [0.22, 0.22, 0.36], p.accent, 0.44);
  arc(ship, p, [[0, 0.36, -1.24], [0, 0.82, -1.52], [0, 1.18, -1.36]], 0.065, p.primary, 12, 8);
  cyl(ship, p, [0, 1.38, 0.04], 0.042, 0.056, 2.04, p.dark, [0, 0, 0], 10);
  strut(ship, [-0.84, 2.18, 0.04], [0.84, 2.18, 0.04], 0.032, p.dark, 8);
  billowSail(ship, p, [0, 0.94, 0.1], 1.54, 1.22, 0.26, p.stencil);
  for (const x of [-0.46, 0, 0.46]) {
    billowSail(ship, p, [x, 0.96, 0.14], 0.24, 1.18, 0.26, p.accent);
  }
  for (const [side, name] of [[1, 'OarBankL'], [-1, 'OarBankR']] as const) {
    const bank = group(ship, name, [side * 0.52, 0.44, 0]);
    for (const z of [-0.64, -0.22, 0.2, 0.62]) {
      strut(bank, [0, 0, z], [side * 0.64, -0.22, z - 0.14], 0.022, p.accent, 6);
      cyl(ship, p, [side * 0.56, 0.52, z], 0.15, 0.15, 0.05, z > 0 ? p.accent : p.stencil, [0, 0, Math.PI / 2], 10);
    }
  }
  if (detail) {
    for (const s of [-1, 1]) {
      cone(ship, p, [s * 0.1, 1.56, 1.38], 0.04, 0.18, p.stencil, [-0.4, 0, -s * 0.3], 6);
      strut(ship, [s * 0.5, 0.48, 0.04], [0, 2.34, 0.04], 0.014, p.edge, 6);
    }
    if (p.hd) fastener(ship, [0, 0.52, 0.04], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Viking row', 2.8, [
      sway('OarBankL', 'y', 2.8, -0.35, 0.35),
      sway('OarBankR', 'y', 2.8, 0.35, -0.35),
    ]),
  ];
}

function buildJetfoilRescue(root: T.Group, p: Finish, detail: boolean) {
  const rb = group(root, 'RescueBoat');
  wavePlinth(rb, p, 1.56, 3.16, 0.12);
  shell(rb, [0, 0.32, 0], [1.28, 0.38, 2.74], p.primary, 0.58);
  shell(rb, [0, 0.54, 0.04], [1.38, 0.16, 2.82], p.tire, 0.58);
  shell(rb, [0, 0.94, -0.06], [1.04, 0.64, 1.32], p.primary, 0.38);
  shell(rb, [0, 1.3, -0.06], [0.96, 0.1, 1.22], p.accent, 0.42);
  rbox(rb, p, [0, 1.04, 0.62], [0.84, 0.26, 0.05], p.optic).rotation.x = -0.3;
  for (const s of [-1, 1]) {
    rbox(rb, p, [s * 0.54, 1.02, -0.06], [0.04, 0.24, 0.88], p.optic);
    cyl(rb, p, [s * 0.28, 0.34, -1.42], 0.11, 0.13, 0.24, p.dark, [Math.PI / 2, 0, 0], 10);
  }
  const cannon = group(rb, 'WaterCannon', [0, 0.58, 1.02]);
  cyl(cannon, p, [0, 0.1, 0], 0.07, 0.09, 0.2, p.alloy, [0, 0, 0], 10);
  cyl(cannon, p, [0, 0.22, 0.16], 0.045, 0.065, 0.42, p.accent, [1.25, 0, 0], 10);
  const radar = group(rb, 'RadarScanner', [0, 1.62, -0.14]);
  cyl(rb, p, [0, 1.48, -0.14], 0.045, 0.055, 0.36, p.alloy, [0, 0, 0], 8);
  rbox(radar, p, [0, 0.04, 0], [0.6, 0.06, 0.1], p.stencil);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(rb, p, [s * 0.66, 0.38, 0.12], [0.04, 0.09, 2.24], p.accent);
      light(rb, [s * 0.34, 1.38, 0.48], [0.14, 0.1, 0.08], p);
    }
    if (p.hd) fastener(rb, [0, 1.36, -0.06], p, 0.025);
  }
  root.animations = [
    new T.AnimationClip('Rescue spray', 3.0, [
      sway('WaterCannon', 'y', 3.0, -0.85, 0.85),
      spinTrack('RadarScanner', 'y', 3.0, 2),
    ]),
  ];
}

export const vehiclesSeaAirC: readonly SeaAirSpec[] = [
  {
    id: 'polar-icebreaker',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('MarineRadar', 'Marine radar', 'rotate', 'y', [0, 360], 'Spins the high polar bridge radar scanner'),
      rp('DeckCrane', 'Aft deck crane', 'rotate', 'y', [-90, 90], 'Swivels the aft helideck supply crane'),
    ],
    build: buildPolarIcebreaker,
  },
  {
    id: 'crop-duster-monoplane',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('NoseProp', 'Nose propeller', 'rotate', 'z', [0, 360], 'Spins the agricultural monoplane radial propeller'),
      rp('TailRudder', 'Tail rudder', 'rotate', 'y', [-30, 30], 'Swings the vertical tail rudder left and right'),
    ],
    build: buildCropDuster,
  },
  {
    id: 'tandem-chinook-heli',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('FrontRotor', 'Forward rotor', 'rotate', 'y', [0, 360], 'Spins the forward three-blade transport rotor'),
      rp('RearRotor', 'Aft rotor', 'rotate', 'y', [0, 360], 'Spins the aft counter-rotating transport rotor'),
      rp('RearRamp', 'Rear cargo ramp', 'rotate', 'x', [-65, 0], 'Lowers the rear troop and vehicle boarding ramp'),
    ],
    build: buildChinookHeli,
  },
  {
    id: 'vintage-caboose-car',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('BrakeWheel', 'Handbrake wheel', 'rotate', 'y', [0, 360], 'Turns the end-platform railway handbrake wheel'),
    ],
    build: buildCabooseCar,
  },
  {
    id: 'viking-dragon-longship',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('OarBankL', 'Port oar bank', 'rotate', 'y', [-25, 25], 'Sweeps the port bank of Norse rowing oars'),
      rp('OarBankR', 'Starboard oar bank', 'rotate', 'y', [-25, 25], 'Sweeps the starboard bank of Norse rowing oars'),
    ],
    build: buildVikingLongship,
  },
  {
    id: 'jetfoil-rescue-boat',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('WaterCannon', 'Bow water cannon', 'rotate', 'y', [-70, 70], 'Aims the bow fire-fighting water monitor'),
      rp('RadarScanner', 'Marine radar', 'rotate', 'y', [0, 360], 'Rotates the offshore rescue roof radar bar'),
    ],
    build: buildJetfoilRescue,
  },
];
