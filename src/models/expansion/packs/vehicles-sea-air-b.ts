import * as T from 'three';
import {
  billowSail, cyl, dome, fastener, group, lathe, light, propHub, railBogie, rbox, ring,
  rotationTrack, rotorBlades, rp, shell, slideTrack, spinTrack, strut, sway,
} from './vehicles-sea-air-kit';
import type { Finish, Point, SeaAirSpec } from './vehicles-sea-air-kit';

function buildZeppelin(root: T.Group, p: Finish, detail: boolean) {
  const zep = group(root, 'Zeppelin');
  shell(zep, [0, 0.08, 0], [1.14, 0.16, 2.34], p.dark, 0.36);
  strut(zep, [0, 0.14, 1.04], [0, 1.38, 1.66], 0.055, p.edge, 8);
  for (const s of [-1, 1]) {
    strut(zep, [s * 0.42, 0.14, 0.42], [s * 0.24, 0.72, 0.36], 0.04, p.edge, 8);
    strut(zep, [s * 0.42, 0.14, -0.44], [s * 0.24, 0.72, -0.36], 0.04, p.edge, 8);
  }
  const pts: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const z = -1.78 + t * 3.56;
    const r = Math.max(0.012, Math.sin(Math.pow(t, 0.88) * Math.PI) * 0.64);
    pts.push([r, z]);
  }
  lathe(zep, p, [0, 1.44, 0], pts, p.primary, [Math.PI / 2, 0, 0], 14);
  ring(zep, [0, 1.44, 0.16], 0.65, 0.04, 0.26, p.accent).rotation.x = Math.PI / 2;
  shell(zep, [0, 0.78, 0.24], [0.46, 0.34, 1.24], p.accent, 0.44);
  for (const s of [-1, 1]) {
    rbox(zep, p, [s * 0.25, 0.8, 0.24], [0.04, 0.14, 0.92], p.optic);
    shell(zep, [s * 0.64, 1.44, -1.24], [0.58, 0.07, 0.68], p.accent, 0.34);
    strut(zep, [s * 0.22, 0.78, -0.14], [s * 0.56, 0.76, -0.14], 0.036, p.alloy, 8);
    cyl(zep, p, [s * 0.62, 0.76, -0.14], 0.1, 0.12, 0.36, p.dark, [Math.PI / 2, 0, 0], 10);
    propHub(zep, s > 0 ? 'PropL' : 'PropR', [s * 0.62, 0.76, 0.08], p, 0.24, 2);
  }
  shell(zep, [0, 2.02, -1.24], [0.07, 0.56, 0.68], p.accent, 0.34);
  shell(zep, [0, 0.88, -1.24], [0.07, 0.48, 0.64], p.primary, 0.34);
  if (detail) {
    for (const z of [-0.72, 0.78]) {
      ring(zep, [0, 1.44, z], 0.58, 0.03, 0.08, p.edge).rotation.x = Math.PI / 2;
    }
    if (p.hd) fastener(zep, [0, 0.96, 0.72], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Dirigible cruise', 2.4, [
      spinTrack('PropL', 'z', 2.4, 5),
      spinTrack('PropR', 'z', 2.4, -5),
    ]),
  ];
}

function buildAutogyro(root: T.Group, p: Finish, detail: boolean) {
  const gy = group(root, 'Autogyro');
  shell(gy, [0, 0.54, 0.28], [0.68, 0.42, 1.28], p.primary, 0.48);
  dome(gy, p, [0, 0.78, 0.56], [0.3, 0.26, 0.42], p.optic, 10);
  shell(gy, [0, 0.74, -0.02], [0.46, 0.34, 0.36], p.tire, 0.36);
  strut(gy, [0, 0.66, -0.18], [0, 1.68, -0.06], 0.05, p.alloy, 10);
  for (const s of [-1, 1]) {
    strut(gy, [s * 0.28, 0.44, 0.16], [s * 0.56, 0.16, 0.06], 0.036, p.dark, 8);
    cyl(gy, p, [s * 0.58, 0.16, 0.06], 0.16, 0.16, 0.1, p.tire, [0, 0, Math.PI / 2], 10);
    cyl(gy, p, [s * 0.58, 0.16, 0.06], 0.09, 0.09, 0.12, p.accent, [0, 0, Math.PI / 2], 8);
    strut(gy, [s * 0.26, 0.56, -0.24], [s * 0.34, 0.68, -1.28], 0.032, p.accent, 8);
    shell(gy, [s * 0.34, 0.86, -1.24], [0.06, 0.48, 0.34], p.primary, 0.34);
  }
  strut(gy, [0, 0.42, 0.78], [0, 0.14, 0.92], 0.034, p.dark, 8);
  cyl(gy, p, [0, 0.14, 0.92], 0.14, 0.14, 0.09, p.tire, [0, 0, Math.PI / 2], 10);
  shell(gy, [0, 0.72, -1.24], [0.76, 0.06, 0.28], p.accent, 0.32);
  cyl(gy, p, [0, 0.72, -0.44], 0.16, 0.18, 0.28, p.dark, [Math.PI / 2, 0, 0], 10);
  const rotor = group(gy, 'MainRotor', [0, 1.66, -0.06]);
  cyl(rotor, p, [0, 0.03, 0], 0.12, 0.14, 0.08, p.dark, [0, 0, 0], 12);
  rotorBlades(rotor, p, 2, 1.24, 0.1, p.dark, p.accent);
  propHub(gy, 'PusherProp', [0, 0.72, -0.62], p, 0.36, 3);
  if (detail) {
    light(gy, [0, 0.52, 0.94], [0.16, 0.1, 0.08], p);
    for (const s of [-1, 1]) strut(gy, [s * 0.24, 0.64, -0.06], [0, 1.24, -0.12], 0.022, p.edge, 8);
    if (p.hd) fastener(rotor, [0, 0.08, 0], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Gyro flight', 2.4, [
      spinTrack('MainRotor', 'y', 2.4, 4),
      spinTrack('PusherProp', 'z', 2.4, 6),
    ]),
  ];
}

function buildBulletTrain(root: T.Group, p: Finish, detail: boolean) {
  const tr = group(root, 'BulletTrain');
  shell(tr, [0, 0.36, -0.06], [1.14, 0.22, 3.36], p.dark, 0.28);
  railBogie(tr, p, detail, 0.86);
  railBogie(tr, p, detail, -1.04);
  shell(tr, [0, 0.96, -0.34], [1.24, 1.02, 2.74], p.primary, 0.42);
  dome(tr, p, [0, 0.84, 1.02], [0.6, 0.48, 0.92], p.primary, 12);
  dome(tr, p, [0, 0.58, 1.54], [0.46, 0.24, 0.46], p.accent, 10);
  dome(tr, p, [0, 1.12, 1.18], [0.44, 0.22, 0.46], p.optic, 10);
  for (const s of [-1, 1]) {
    rbox(tr, p, [s * 0.64, 0.74, -0.14], [0.04, 0.14, 2.74], p.accent);
    for (const z of [-1.24, -0.68, 0.42]) {
      rbox(tr, p, [s * 0.64, 1.08, z], [0.04, 0.28, 0.42], p.optic);
    }
    light(tr, [s * 0.32, 0.66, 1.84], [0.16, 0.09, 0.08], p);
  }
  const doorBase: Point = [0.65, 0.92, -0.12];
  const door = group(tr, 'CoachDoor', doorBase);
  rbox(door, p, [0, 0, 0], [0.05, 0.88, 0.44], p.accent);
  rbox(door, p, [0.025, 0.18, 0], [0.025, 0.36, 0.28], p.optic);
  const panto = group(tr, 'Pantograph', [0, 1.5, -0.78]);
  for (const s of [-1, 1]) {
    strut(panto, [s * 0.16, 0, 0], [s * 0.14, 0.26, 0.28], 0.02, p.alloy, 8);
    strut(panto, [s * 0.14, 0.26, 0.28], [s * 0.16, 0.48, 0.02], 0.02, p.alloy, 8);
  }
  strut(panto, [-0.4, 0.48, 0.02], [0.4, 0.48, 0.02], 0.024, p.accent, 8);
  if (detail) {
    shell(tr, [0, 1.5, 0.06], [0.76, 0.12, 1.08], p.edge, 0.42);
    if (p.hd) fastener(tr, [0, 1.57, 0.06], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Station express', 3.2, [
      slideTrack('CoachDoor', 'z', doorBase, [0, 0.9, 2.3, 3.2], [0, 0.36, 0.36, 0]),
      rotationTrack('Pantograph', 'x', [0, 1.0, 2.2, 3.2], [0, 0.36, 0.36, 0]),
    ]),
  ];
}

function buildFunicularCar(root: T.Group, p: Finish, detail: boolean) {
  const fun = group(root, 'FunicularCar');
  shell(fun, [0, 0.22, 0], [1.14, 0.18, 2.86], p.dark, 0.26);
  railBogie(fun, p, detail, 0.88, 0.48, 0.18);
  railBogie(fun, p, detail, -0.88, 0.48, 0.18);
  for (let i = 0; i < 3; i++) {
    const z = -0.86 + i * 0.86;
    const baseY = 0.36 + i * 0.24;
    shell(fun, [0, baseY + 0.56, z], [1.26, 1.12, 0.9], p.primary, 0.24);
    shell(fun, [0, baseY + 1.16, z], [1.18, 0.1, 0.84], p.accent, 0.32);
    for (const s of [-1, 1]) {
      rbox(fun, p, [s * 0.65, baseY + 0.72, z], [0.04, 0.44, 0.62], p.optic);
      rbox(fun, p, [s * 0.65, baseY + 0.34, z], [0.04, 0.12, 0.76], p.accent);
    }
  }
  rbox(fun, p, [0, 1.56, 1.33], [0.96, 0.46, 0.05], p.optic);
  rbox(fun, p, [0, 1.08, -1.33], [0.96, 0.46, 0.05], p.optic);
  const doorBase: Point = [0.66, 1.06, 0];
  const door = group(fun, 'CabinDoor', doorBase);
  rbox(door, p, [0, 0, 0], [0.05, 0.92, 0.46], p.accent);
  rbox(door, p, [0.025, 0.2, 0], [0.025, 0.38, 0.32], p.optic);
  const clamp = group(fun, 'CableClamp', [0, 2.08, 0.86]);
  strut(clamp, [0, -0.16, 0], [0, 0.24, 0], 0.04, p.alloy, 8);
  cyl(clamp, p, [0, 0.26, 0], 0.12, 0.12, 0.08, p.dark, [0, 0, Math.PI / 2], 12);
  if (detail) {
    for (const s of [-1, 1]) light(fun, [s * 0.4, 1.16, 1.34], [0.16, 0.12, 0.06], p);
    if (p.hd) fastener(clamp, [0, 0.26, 0], p, 0.024).rotation.z = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Alpine climb', 3.0, [
      slideTrack('CabinDoor', 'z', doorBase, [0, 0.9, 2.1, 3.0], [0, 0.38, 0.38, 0]),
      spinTrack('CableClamp', 'x', 3.0, 2),
    ]),
  ];
}

function buildCargoBarge(root: T.Group, p: Finish, detail: boolean) {
  const barge = group(root, 'CargoBarge');
  shell(barge, [0, 0.24, 0], [1.46, 0.48, 3.44], p.primary, 0.32);
  shell(barge, [0, 0.52, 0.34], [1.34, 0.14, 2.48], p.dark, 0.26);
  shell(barge, [0, 0.96, -1.24], [1.14, 0.78, 0.84], p.stencil, 0.3);
  shell(barge, [0, 1.4, -1.24], [1.22, 0.1, 0.94], p.accent, 0.36);
  rbox(barge, p, [0, 1.12, -0.8], [0.92, 0.28, 0.04], p.optic);
  for (const s of [-1, 1]) {
    rbox(barge, p, [s * 0.6, 0.64, 0.34], [0.1, 0.26, 2.28], p.edge);
    rbox(barge, p, [s * 0.75, 0.34, 0], [0.04, 0.1, 3.16], p.accent);
  }
  rbox(barge, p, [0, 0.68, 0.66], [0.98, 0.34, 0.74], p.accent);
  rbox(barge, p, [0, 0.68, -0.18], [0.98, 0.34, 0.68], p.edge);
  const hatchBase: Point = [0, 0.84, 0.28];
  const hatch = group(barge, 'CargoHatch', hatchBase);
  shell(hatch, [0, 0, 0], [1.24, 0.12, 1.46], p.accent, 0.26);
  for (let i = 0; i < 4; i++) rbox(hatch, p, [0, 0.075, -0.52 + i * 0.34], [1.14, 0.03, 0.12], p.edge);
  const radar = group(barge, 'BargeRadar', [0, 1.66, -1.24]);
  cyl(barge, p, [0, 1.54, -1.24], 0.04, 0.05, 0.24, p.alloy, [0, 0, 0], 8);
  rbox(radar, p, [0, 0.04, 0], [0.52, 0.06, 0.09], p.primary);
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [-1.42, 1.42]) cyl(barge, p, [s * 0.56, 0.56, z], 0.055, 0.06, 0.18, p.alloy, [0, 0, 0], 8);
    }
    if (p.hd) fastener(hatch, [0, 0.1, 0], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Open hold', 3.2, [
      slideTrack('CargoHatch', 'z', hatchBase, [0, 1.0, 2.2, 3.2], [0, 0.54, 0.54, 0]),
      spinTrack('BargeRadar', 'y', 3.2, 2),
    ]),
  ];
}

function buildHovercraft(root: T.Group, p: Finish, detail: boolean) {
  const hc = group(root, 'Hovercraft');
  shell(hc, [0, 0.18, 0], [1.86, 0.36, 2.86], p.tire, 0.54);
  shell(hc, [0, 0.44, 0], [1.74, 0.22, 2.68], p.primary, 0.5);
  shell(hc, [0, 0.82, 0.38], [1.24, 0.58, 1.44], p.primary, 0.42);
  shell(hc, [0, 1.14, 0.38], [1.12, 0.1, 1.32], p.accent, 0.44);
  rbox(hc, p, [0, 0.9, 1.12], [0.96, 0.28, 0.05], p.optic).rotation.x = -0.25;
  for (const [side, fanName, rudName] of [[1, 'FanL', 'AirRudderL'], [-1, 'FanR', 'AirRudderR']] as const) {
    ring(hc, [side * 0.54, 0.94, -0.96], 0.38, 0.06, 0.34, p.accent).rotation.x = Math.PI / 2;
    strut(hc, [side * 0.54, 0.52, -0.96], [side * 0.54, 0.64, -0.96], 0.07, p.dark, 8);
    propHub(hc, fanName, [side * 0.54, 0.94, -0.96], p, 0.3, 4);
    const rud = group(hc, rudName, [side * 0.54, 0.94, -1.12]);
    shell(rud, [0, 0, -0.12], [0.06, 0.58, 0.28], p.primary, 0.32);
    rbox(hc, p, [side * 0.64, 0.86, 0.38], [0.04, 0.24, 1.04], p.optic);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) rbox(hc, p, [s * 0.94, 0.18, -1.0 + i * 0.4], [0.04, 0.28, 0.12], p.dark);
      light(hc, [s * 0.46, 0.62, 1.36], [0.18, 0.11, 0.08], p);
    }
    if (p.hd) fastener(hc, [0, 1.2, 0.38], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Cushion sprint', 2.6, [
      spinTrack('FanL', 'z', 2.6, 5),
      spinTrack('FanR', 'z', 2.6, -5),
      sway('AirRudderL', 'y', 2.6, -0.45, 0.45),
      sway('AirRudderR', 'y', 2.6, -0.45, 0.45),
    ]),
  ];
}

function buildCatamaran(root: T.Group, p: Finish, detail: boolean) {
  const cat = group(root, 'Catamaran');
  for (const s of [-1, 1]) {
    shell(cat, [s * 0.86, 0.2, 0], [0.34, 0.4, 3.04], p.primary, 0.66);
    dome(cat, p, [s * 0.86, 0.22, 1.5], [0.16, 0.18, 0.34], p.accent, 8);
    const rud = group(cat, s > 0 ? 'RudderL' : 'RudderR', [s * 0.86, 0.24, -1.52]);
    shell(rud, [0, -0.06, -0.14], [0.06, 0.34, 0.24], p.accent, 0.3);
  }
  for (const z of [0.68, -0.58]) strut(cat, [-0.86, 0.38, z], [0.86, 0.38, z], 0.055, p.alloy, 10);
  shell(cat, [0, 0.42, 0.05], [1.48, 0.08, 1.36], p.dark, 0.28);
  const sail = group(cat, 'WingSail', [0, 0.44, 0.18]);
  cyl(sail, p, [0, 1.48, 0], 0.04, 0.06, 2.96, p.alloy, [0, 0, 0], 10);
  billowSail(sail, p, [0, 0.18, 0.06], 0.92, 2.64, 0.22, p.accent);
  billowSail(sail, p, [0, 0.32, -0.02], 0.72, 2.18, -0.16, p.stencil);
  if (detail) {
    for (const s of [-1, 1]) {
      strut(cat, [s * 0.86, 0.4, 0.18], [0, 2.86, 0.18], 0.014, p.edge, 6);
      rbox(cat, p, [s * 1.04, 0.26, 0], [0.03, 0.08, 2.32], p.stencil);
    }
    if (p.hd) fastener(cat, [0, 0.47, 0.68], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Regatta tack', 3.4, [
      sway('WingSail', 'y', 3.4, -0.68, 0.68),
      sway('RudderL', 'y', 3.4, -0.45, 0.45),
      sway('RudderR', 'y', 3.4, -0.45, 0.45),
    ]),
  ];
}

export const vehiclesSeaAirB: readonly SeaAirSpec[] = [
  {
    id: 'rigid-zeppelin-airship',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('PropL', 'Port propeller', 'rotate', 'z', [0, 360], 'Spins the port dirigible engine propeller'),
      rp('PropR', 'Starboard propeller', 'rotate', 'z', [0, 360], 'Spins the starboard dirigible engine propeller'),
    ],
    build: buildZeppelin,
  },
  {
    id: 'autogyro-rotorcraft',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('MainRotor', 'Overhead rotor', 'rotate', 'y', [0, 360], 'Spins the unpowered overhead autogyro rotor'),
      rp('PusherProp', 'Pusher propeller', 'rotate', 'z', [0, 360], 'Spins the rear three-blade thrust propeller'),
    ],
    build: buildAutogyro,
  },
  {
    id: 'commuter-bullet-train',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('CoachDoor', 'Passenger door', 'slide', 'z', [0, 0.36], 'Slides the aerodynamic coach door open'),
      rp('Pantograph', 'Roof pantograph', 'rotate', 'x', [0, 24], 'Raises and folds the high-speed overhead pantograph'),
    ],
    build: buildBulletTrain,
  },
  {
    id: 'alpine-funicular-car',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('CabinDoor', 'Stepped door', 'slide', 'z', [0, 0.38], 'Slides the middle cabin boarding door open'),
      rp('CableClamp', 'Cable pulley', 'rotate', 'x', [0, 360], 'Rotates the rooftop incline haulage cable pulley'),
    ],
    build: buildFunicularCar,
  },
  {
    id: 'cargo-river-barge',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('CargoHatch', 'Cargo hatch cover', 'slide', 'z', [0, 0.54], 'Slides the corrugated cargo hold cover forward'),
      rp('BargeRadar', 'River radar', 'rotate', 'y', [0, 360], 'Rotates the wheelhouse navigation radar'),
    ],
    build: buildCargoBarge,
  },
  {
    id: 'amphibious-hovercraft',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('FanL', 'Port thrust fan', 'rotate', 'z', [0, 360], 'Spins the port shrouded ducted lift/thrust fan'),
      rp('FanR', 'Starboard thrust fan', 'rotate', 'z', [0, 360], 'Spins the starboard shrouded ducted lift/thrust fan'),
      rp('AirRudderL', 'Port air rudder', 'rotate', 'y', [-32, 32], 'Deflects the port stern steering vane'),
    ],
    build: buildHovercraft,
  },
  {
    id: 'racing-catamaran',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('WingSail', 'Wing sail', 'rotate', 'y', [-48, 48], 'Trims the towering rigid racing wing sail'),
      rp('RudderL', 'Port rudder', 'rotate', 'y', [-32, 32], 'Steers the port hull transom rudder'),
      rp('RudderR', 'Starboard rudder', 'rotate', 'y', [-32, 32], 'Steers the starboard hull transom rudder'),
    ],
    build: buildCatamaran,
  },
];
