import * as T from 'three';
import {
  arc, billowSail, cyl, det, dome, fastener, group, light, propHub, rbox, ring,
  rp, shell, spinTrack, strut, sway, tone, wavePlinth,
} from './vehicles-sea-air-kit';
import type { Finish, SeaAirSpec } from './vehicles-sea-air-kit';

function buildPaddleSteamer(root: T.Group, p: Finish, detail: boolean) {
  const ship = group(root, 'PaddleSteamer');
  wavePlinth(ship, p, 1.56, 3.36, 0.12);
  shell(ship, [0, 0.24, 0.1], [1.34, 0.28, 2.86], p.dark, 0.56);
  shell(ship, [0, 0.44, 0.16], [1.38, 0.18, 2.74], p.primary, 0.5);
  shell(ship, [0, 0.78, 0.18], [1.14, 0.52, 2.18], p.primary, 0.34);
  shell(ship, [0, 1.08, 0.18], [1.26, 0.1, 2.34], p.accent, 0.36);
  shell(ship, [0, 1.38, 0.22], [0.96, 0.48, 1.72], p.primary, 0.34);
  shell(ship, [0, 1.66, 0.22], [1.06, 0.09, 1.84], p.accent, 0.36);
  shell(ship, [0, 1.94, 0.38], [0.64, 0.48, 0.74], p.primary, 0.36);
  shell(ship, [0, 2.22, 0.38], [0.74, 0.1, 0.84], p.accent, 0.42);
  rbox(ship, p, [0, 2.0, 0.77], [0.48, 0.22, 0.04], p.optic);
  for (const s of [-1, 1]) {
    cyl(ship, p, [s * 0.34, 2.26, 0.92], 0.09, 0.11, 1.24, p.dark, [0, 0, 0], 12);
    ring(ship, [s * 0.34, 2.86, 0.92], 0.13, 0.032, 0.1, p.accent);
    strut(ship, [s * 0.52, 0.48, -1.12], [s * 0.52, 0.56, -1.52], 0.045, p.dark, 8);
    for (let i = 0; i < 4; i++) {
      rbox(ship, p, [s * 0.59, 0.82, -0.52 + i * 0.48], [0.04, 0.26, 0.28], p.optic);
    }
  }
  const wheel = group(ship, 'PaddleWheel', [0, 0.56, -1.48]);
  cyl(wheel, p, [0, 0, 0], 0.07, 0.07, 1.08, p.alloy, [0, 0, Math.PI / 2], 10);
  for (const s of [-1, 1]) ring(wheel, [s * 0.44, 0, 0], 0.44, 0.04, 0.06, p.accent).rotation.z = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    rbox(wheel, p, [0, Math.sin(a) * 0.42, Math.cos(a) * 0.42], [0.92, 0.12, 0.04], p.accent).rotation.x = -a;
  }
  if (detail) {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        strut(ship, [s * 0.62, 0.52, -0.68 + i * 0.44], [s * 0.62, 1.04, -0.68 + i * 0.44], 0.018, p.stencil, 6);
      }
    }
    if (p.hd) fastener(ship, [0, 2.28, 0.38], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('River cruise', 2.8, [
      spinTrack('PaddleWheel', 'x', 2.8, -2),
    ]),
  ];
}

function buildNorthSeaTrawler(root: T.Group, p: Finish, detail: boolean) {
  const boat = group(root, 'Trawler');
  wavePlinth(boat, p, 1.48, 3.04, 0.12);
  shell(boat, [0, 0.28, 0], [1.26, 0.36, 2.66], p.dark, 0.58);
  shell(boat, [0, 0.56, 0.08], [1.34, 0.34, 2.74], p.primary, 0.56);
  shell(boat, [0, 0.82, 0.94], [1.1, 0.28, 0.92], p.primary, 0.64);
  shell(boat, [0, 0.76, -0.34], [1.18, 0.08, 1.76], p.edge, 0.46);
  shell(boat, [0, 1.14, 0.34], [0.94, 0.72, 0.98], p.stencil, 0.32);
  shell(boat, [0, 1.54, 0.34], [1.04, 0.1, 1.08], p.accent, 0.36);
  rbox(boat, p, [0, 1.28, 0.85], [0.76, 0.24, 0.04], p.optic);
  cyl(boat, p, [0, 1.56, -0.22], 0.14, 0.18, 0.74, p.dark, [0, 0, 0], 12);
  cyl(boat, p, [0, 1.72, -0.22], 0.16, 0.16, 0.18, p.accent, [0, 0, 0], 12);
  const gantry = group(boat, 'NetGantry', [0, 0.8, -1.04]);
  for (const s of [-1, 1]) strut(gantry, [s * 0.48, 0, 0], [s * 0.36, 1.14, -0.24], 0.045, p.accent, 8);
  strut(gantry, [-0.38, 1.14, -0.24], [0.38, 1.14, -0.24], 0.045, p.accent, 8);
  cyl(gantry, p, [0, 1.0, -0.24], 0.09, 0.09, 0.16, p.alloy, [0, 0, Math.PI / 2], 10);
  const radar = group(boat, 'RadarMast', [0, 1.9, 0.36]);
  cyl(boat, p, [0, 1.74, 0.36], 0.04, 0.05, 0.36, p.alloy, [0, 0, 0], 8);
  rbox(radar, p, [0, 0.04, 0], [0.54, 0.06, 0.1], p.stencil);
  const crates = group(boat, 'FishCrates', [0, 0.92, -0.52]);
  rbox(crates, p, [-0.22, 0, 0], [0.34, 0.24, 0.38], p.accent);
  rbox(crates, p, [0.2, 0, 0.06], [0.34, 0.24, 0.34], p.primary);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(boat, p, [s * 0.68, 0.62, -0.06], [0.05, 0.1, 2.18], p.accent);
      rbox(boat, p, [s * 0.49, 1.28, 0.38], [0.04, 0.22, 0.56], p.optic);
    }
    light(boat, [0, 1.62, 0.82], [0.18, 0.1, 0.08], p);
    if (p.hd) fastener(boat, [0, 1.6, 0.34], p, 0.025);
  }
  root.animations = [
    new T.AnimationClip('Haul nets', 3.2, [
      sway('NetGantry', 'x', 3.2, -0.42, 0.35),
      spinTrack('RadarMast', 'y', 3.2, 2),
    ]),
  ];
}

function buildBathyscaphe(root: T.Group, p: Finish, detail: boolean) {
  const sub = group(root, 'Bathyscaphe');
  const rock = tone(p, 'Seabed cradle', '#4c5459', 0.84, 0.06);
  shell(sub, [0, 0.08, 0], [1.28, 0.16, 1.88], rock, 0.5);
  for (const s of [-1, 1]) {
    strut(sub, [s * 0.44, 0.14, 0.44], [s * 0.36, 0.48, 0.32], 0.055, p.dark, 8);
    strut(sub, [s * 0.44, 0.14, -0.44], [s * 0.36, 0.48, -0.32], 0.055, p.dark, 8);
  }
  dome(sub, p, [0, 0.54, 0.16], [0.46, 0.44, 0.48], p.accent, 12);
  dome(sub, p, [0, 0.54, 0.58], [0.22, 0.22, 0.16], p.optic, 10);
  ring(sub, [0, 0.54, 0.56], 0.24, 0.04, 0.08, p.alloy).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    strut(sub, [s * 0.34, 0.72, 0.36], [s * 0.44, 1.12, 0.36], 0.06, p.dark, 8);
    strut(sub, [s * 0.34, 0.72, -0.26], [s * 0.44, 1.12, -0.26], 0.06, p.dark, 8);
  }
  shell(sub, [0, 1.18, 0], [1.14, 0.54, 2.54], p.primary, 0.56);
  dome(sub, p, [0, 1.18, 1.24], [0.54, 0.26, 0.36], p.primary, 10);
  dome(sub, p, [0, 1.18, -1.24], [0.5, 0.24, 0.36], p.primary, 10);
  cyl(sub, p, [0, 1.56, 0.14], 0.24, 0.28, 0.32, p.accent, [0, 0, 0], 12);
  shell(sub, [0, 1.18, -1.46], [0.1, 0.52, 0.38], p.accent, 0.36);
  for (const [side, name] of [[1, 'ThrusterL'], [-1, 'ThrusterR']] as const) {
    strut(sub, [side * 0.52, 1.16, -0.78], [side * 0.76, 1.16, -0.78], 0.045, p.edge, 8);
    const thr = group(sub, name, [side * 0.82, 1.16, -0.78]);
    ring(thr, [0, 0, 0], 0.18, 0.04, 0.22, p.dark).rotation.x = Math.PI / 2;
    propHub(thr, '', [0, 0, -0.02], p, 0.14, 3);
  }
  const claw = group(sub, 'SampleClaw', [0, 0.32, 0.52]);
  strut(claw, [0, 0, 0], [0, -0.06, 0.46], 0.04, p.alloy, 8);
  rbox(claw, p, [0, -0.06, 0.5], [0.16, 0.08, 0.1], p.accent);
  for (const s of [-1, 1]) strut(claw, [s * 0.05, -0.06, 0.54], [s * 0.1, -0.06, 0.7], 0.022, p.edge, 6);
  if (detail) {
    for (const s of [-1, 1]) {
      light(sub, [s * 0.34, 0.92, 1.24], [0.16, 0.1, 0.08], p);
      rbox(sub, p, [s * 0.59, 1.18, 0], [0.04, 0.08, 2.08], p.accent);
    }
    if (p.hd) fastener(sub, [0, 1.73, 0.14], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Abyssal scan', 3.0, [
      sway('SampleClaw', 'y', 3.0, -0.5, 0.5),
      spinTrack('ThrusterL', 'z', 3.0, 4),
      spinTrack('ThrusterR', 'z', 3.0, -4),
    ]),
  ];
}

function buildHydrofoilFerry(root: T.Group, p: Finish, detail: boolean) {
  const hf = group(root, 'Hydrofoil');
  wavePlinth(hf, p, 1.62, 3.24, 0.12);
  for (const z of [0.84, -0.78]) {
    rbox(hf, p, [0, 0.14, z], [1.54, 0.07, 0.24], p.edge);
    for (const s of [-1, 1]) {
      strut(hf, [s * 0.72, 0.14, z], [s * 0.46, 0.64, z], 0.055, p.alloy, 8);
    }
  }
  shell(hf, [0, 0.72, 0], [1.22, 0.32, 3.16], p.accent, 0.56);
  shell(hf, [0, 0.98, 0.08], [1.14, 0.36, 2.86], p.primary, 0.5);
  shell(hf, [0, 1.24, 0.14], [0.96, 0.26, 2.12], p.primary, 0.46);
  rbox(hf, p, [0, 1.22, 1.24], [0.82, 0.22, 0.06], p.optic).rotation.x = -0.35;
  for (const s of [-1, 1]) {
    rbox(hf, p, [s * 0.59, 1.0, 0.08], [0.04, 0.18, 2.28], p.optic);
    const jet = group(hf, s > 0 ? 'WaterJetL' : 'WaterJetR', [s * 0.34, 0.7, -1.62]);
    cyl(jet, p, [0, 0, 0], 0.12, 0.16, 0.28, p.dark, [Math.PI / 2, 0, 0], 10);
    propHub(jet, '', [0, 0, -0.14], p, 0.11, 3);
  }
  const radar = group(hf, 'FoilRadar', [0, 1.54, 0.36]);
  cyl(hf, p, [0, 1.44, 0.36], 0.04, 0.05, 0.22, p.alloy, [0, 0, 0], 8);
  rbox(radar, p, [0, 0.04, 0], [0.56, 0.06, 0.1], p.accent);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(hf, p, [s * 0.62, 0.78, 0], [0.04, 0.08, 2.74], p.stencil);
    }
    if (p.hd) fastener(hf, [0, 1.38, -0.44], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Foil skim', 2.6, [
      spinTrack('WaterJetL', 'z', 2.6, 5),
      spinTrack('WaterJetR', 'z', 2.6, -5),
      spinTrack('FoilRadar', 'y', 2.6, 2),
    ]),
  ];
}

function buildPirateSloop(root: T.Group, p: Finish, detail: boolean) {
  const ship = group(root, 'PirateSloop');
  shell(ship, [0, 0.06, 0], [0.76, 0.12, 2.18], p.dark, 0.36);
  for (const z of [-0.72, 0.72]) rbox(ship, p, [0, 0.2, z], [0.92, 0.24, 0.16], p.dark);
  shell(ship, [0, 0.48, 0.04], [1.14, 0.5, 2.68], p.primary, 0.56);
  shell(ship, [0, 0.84, -0.84], [1.08, 0.38, 1.02], p.primary, 0.38);
  shell(ship, [0, 0.8, 1.06], [0.92, 0.28, 0.72], p.primary, 0.56);
  strut(ship, [0, 0.86, 1.24], [0, 1.18, 2.08], 0.042, p.primary, 8);
  for (const [z, h] of [[0.76, 1.72], [-0.04, 2.24], [-0.94, 1.62]] as const) {
    cyl(ship, p, [0, 0.72 + h * 0.5, z], 0.036, 0.056, h, p.dark, [0, 0, 0], 10);
  }
  const mainYard = group(ship, 'MainYard', [0, 2.02, -0.04]);
  strut(mainYard, [-0.82, 0, 0], [0.82, 0, 0], 0.032, p.dark, 8);
  billowSail(mainYard, p, [0, -0.78, 0.04], 1.44, 0.84, 0.24, p.stencil);
  billowSail(mainYard, p, [0, 0.12, 0.04], 1.08, 0.58, 0.18, p.accent);
  billowSail(ship, p, [0, 1.24, 0.8], 1.08, 0.78, 0.18, p.stencil);
  billowSail(ship, p, [0, 1.28, -0.9], 0.92, 0.68, 0.16, p.accent);
  const rudder = group(ship, 'SternRudder', [0, 0.44, -1.34]);
  shell(rudder, [0, -0.06, -0.14], [0.09, 0.52, 0.3], p.accent, 0.3);
  if (detail) {
    cyl(ship, p, [0, 2.38, -0.04], 0.16, 0.14, 0.18, p.accent, [0, 0, 0], 10);
    for (const s of [-1, 1]) {
      for (const z of [-0.32, 0.08, 0.48]) {
        cyl(ship, p, [s * 0.59, 0.58, z], 0.045, 0.055, 0.16, p.dark, [0, 0, Math.PI / 2], 8);
      }
      rbox(ship, p, [s * 0.59, 0.74, 0.04], [0.04, 0.09, 2.18], p.accent);
    }
    if (p.hd) fastener(ship, [0, 1.04, -1.26], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('High seas', 3.4, [
      sway('MainYard', 'y', 3.4, -0.45, 0.45),
      sway('SternRudder', 'y', 3.4, -0.5, 0.5),
    ]),
  ];
}

function buildVenetianGondola(root: T.Group, p: Finish, detail: boolean) {
  const boat = group(root, 'Gondola');
  wavePlinth(boat, p, 0.92, 3.24, 0.1);
  shell(boat, [0, 0.22, 0], [0.76, 0.24, 2.66], p.primary, 0.66);
  shell(boat, [0, 0.4, 1.28], [0.32, 0.42, 0.64], p.primary, 0.62);
  shell(boat, [0, 0.38, -1.24], [0.34, 0.38, 0.6], p.primary, 0.62);
  arc(boat, p, [[0, 0.48, 1.54], [0, 0.78, 1.66], [0, 1.02, 1.54]], 0.042, p.alloy, 10, 6);
  for (let i = 0; i < 4; i++) {
    rbox(boat, p, [0, 0.62 + i * 0.1, 1.66], [0.03, 0.04, 0.18], p.alloy);
  }
  shell(boat, [0, 0.42, -0.06], [0.64, 0.24, 0.96], p.accent, 0.38);
  dome(boat, p, [0, 0.68, -0.06], [0.34, 0.3, 0.52], p.accent, 10);
  const oar = group(boat, 'SternOar', [0.36, 0.46, -0.96]);
  strut(oar, [0, 0.24, 0.14], [0.34, -0.34, -0.82], 0.024, p.accent, 8);
  shell(oar, [0.38, -0.38, -0.94], [0.14, 0.04, 0.38], p.accent, 0.36);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(boat, p, [s * 0.38, 0.36, 0], [0.04, 0.06, 2.12], p.accent);
      dome(boat, p, [s * 0.26, 0.42, 0.52], [0.07, 0.08, 0.07], p.stencil, 8);
    }
    if (p.hd) fastener(boat, [0, 0.99, -0.06], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Lagoon stroke', 3.0, [
      sway('SternOar', 'y', 3.0, -0.48, 0.48),
      sway('SternOar', 'x', 3.0, -0.22, 0.22),
    ]),
  ];
}

function buildSeaplane(root: T.Group, p: Finish, detail: boolean) {
  const pl = group(root, 'Seaplane');
  for (const s of [-1, 1]) {
    shell(pl, [s * 0.56, 0.14, 0.14], [0.3, 0.28, 2.28], p.accent, 0.56);
    dome(pl, p, [s * 0.56, 0.14, 1.28], [0.14, 0.13, 0.24], p.primary, 8);
    strut(pl, [s * 0.56, 0.26, 0.56], [s * 0.24, 0.72, 0.44], 0.032, p.edge, 8);
    strut(pl, [s * 0.56, 0.26, -0.32], [s * 0.24, 0.72, -0.26], 0.032, p.edge, 8);
  }
  strut(pl, [-0.56, 0.24, 0.48], [0.56, 0.24, 0.48], 0.026, p.alloy, 8);
  strut(pl, [-0.56, 0.24, -0.28], [0.56, 0.24, -0.28], 0.026, p.alloy, 8);
  shell(pl, [0, 0.88, 0.24], [0.64, 0.62, 1.56], p.primary, 0.42);
  cyl(pl, p, [0, 0.88, 1.12], 0.26, 0.3, 0.28, p.dark, [Math.PI / 2, 0, 0], 14);
  cyl(pl, p, [0, 0.88, -0.82], 0.14, 0.28, 1.06, p.primary, [Math.PI / 2, 0, 0], 12);
  rbox(pl, p, [0, 1.06, 0.86], [0.52, 0.24, 0.06], p.optic).rotation.x = -0.45;
  shell(pl, [0, 1.24, 0.22], [3.34, 0.1, 0.64], p.primary, 0.34);
  for (const s of [-1, 1]) {
    rbox(pl, p, [s * 1.28, 1.29, 0.22], [0.46, 0.04, 0.58], p.accent);
    strut(pl, [s * 0.3, 0.7, 0.22], [s * 1.04, 1.2, 0.22], 0.026, p.alloy, 8);
    rbox(pl, p, [s * 0.34, 0.96, 0.12], [0.04, 0.2, 0.68], p.optic);
  }
  shell(pl, [0, 1.14, -1.24], [0.09, 0.54, 0.42], p.primary, 0.38);
  const elev = group(pl, 'TailElevator', [0, 0.96, -1.28]);
  shell(elev, [0, 0, 0], [1.14, 0.07, 0.34], p.accent, 0.38);
  propHub(pl, 'NoseProp', [0, 0.88, 1.3], p, 0.44, 3);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(pl, p, [s * 0.34, 0.78, -0.02], [0.03, 0.08, 1.48], p.accent);
    }
    if (p.hd) fastener(pl, [0, 1.3, 0.22], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Lake takeoff', 2.4, [
      spinTrack('NoseProp', 'z', 2.4, 5),
      sway('TailElevator', 'x', 2.4, -0.38, 0.38),
    ]),
  ];
}

export const vehiclesSeaAirA: readonly SeaAirSpec[] = [
  {
    id: 'mississippi-paddle-steamer',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('PaddleWheel', 'Stern paddlewheel', 'rotate', 'x', [0, 360], 'Spins the stern wooden riverboat paddlewheel'),
    ],
    build: buildPaddleSteamer,
  },
  {
    id: 'north-sea-trawler',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('NetGantry', 'Trawl gantry', 'rotate', 'x', [-30, 30], 'Swings the rear steel fishing net gantry frame'),
      rp('RadarMast', 'Marine radar', 'rotate', 'y', [0, 360], 'Rotates the wheelhouse roof marine radar bar'),
    ],
    detachableParts: [det('FishCrates', 'Deck fish crates', 'Removable stacked catch crates on the aft work deck')],
    build: buildNorthSeaTrawler,
  },
  {
    id: 'research-bathyscaphe',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('SampleClaw', 'Sampling claw', 'rotate', 'y', [-40, 40], 'Sweeps the lower abyssal specimen manipulator claw'),
      rp('ThrusterL', 'Port thruster', 'rotate', 'z', [0, 360], 'Spins the port shrouded submarine propeller'),
      rp('ThrusterR', 'Starboard thruster', 'rotate', 'z', [0, 360], 'Spins the starboard shrouded submarine propeller'),
    ],
    build: buildBathyscaphe,
  },
  {
    id: 'coastal-hydrofoil-ferry',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('WaterJetL', 'Left waterjet', 'rotate', 'z', [0, 360], 'Spins the port stern propulsion impeller'),
      rp('WaterJetR', 'Right waterjet', 'rotate', 'z', [0, 360], 'Spins the starboard stern propulsion impeller'),
      rp('FoilRadar', 'Roof radar', 'rotate', 'y', [0, 360], 'Rotates the hydrofoil bridge radar scanner'),
    ],
    build: buildHydrofoilFerry,
  },
  {
    id: 'pirate-galleon-sloop',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('MainYard', 'Main sail yardarm', 'rotate', 'y', [-35, 35], 'Swings the main square sail yardarm into the wind'),
      rp('SternRudder', 'Stern rudder', 'rotate', 'y', [-35, 35], 'Steers the wooden transom rudder'),
    ],
    build: buildPirateSloop,
  },
  {
    id: 'venetian-rowing-gondola',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('SternOar', 'Gondolier oar', 'rotate', 'y', [-35, 35], 'Sweeps the long wooden rowing oar at the stern'),
    ],
    build: buildVenetianGondola,
  },
  {
    id: 'twin-pontoon-seaplane',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('NoseProp', 'Nose propeller', 'rotate', 'z', [0, 360], 'Spins the three-blade radial bush-plane propeller'),
      rp('TailElevator', 'Tail elevator', 'rotate', 'x', [-25, 25], 'Pitches the horizontal tail elevator control surface'),
    ],
    build: buildSeaplane,
  },
];
