import * as T from 'three';
import {
  axleWheels, cone, cyl, det, dome, fastener, group, light, lightbar, rbox,
  rotationTrack, rp, shell, spinTrack, strut, sway, tone, torus, wheel,
} from './vehicles-road-kit';
import type { Finish, PackEntrySpec } from './vehicles-road-kit';

function buildDoubleDecker(root: T.Group, p: Finish, detail: boolean) {
  const bus = group(root, 'DoubleDecker');
  shell(bus, [0, 0.34, 0], [1.18, 0.2, 3.24], p.dark, 0.24);
  shell(bus, [0, 0.94, 0.16], [1.28, 1.06, 2.94], p.primary, 0.24);
  shell(bus, [0, 1.98, 0], [1.24, 1.02, 3.22], p.primary, 0.26);
  shell(bus, [0, 2.52, 0], [1.16, 0.12, 3.12], p.primary, 0.38);
  rbox(bus, p, [0, 1.48, 0.04], [1.32, 0.12, 3.12], p.accent);
  rbox(bus, p, [0, 1.08, 1.65], [1.02, 0.44, 0.05], p.optic);
  rbox(bus, p, [0, 2.08, 1.63], [1.06, 0.46, 0.05], p.optic);
  rbox(bus, p, [0, 1.54, 1.65], [0.76, 0.18, 0.05], p.dark);
  rbox(bus, p, [0, 2.08, -1.63], [1.02, 0.44, 0.05], p.optic);
  strut(bus, [0.52, 0.44, -1.48], [0.52, 1.48, -1.48], 0.032, p.alloy, 8);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      rbox(bus, p, [s * 0.66, 1.08, 1.08 - i * 0.68], [0.04, 0.38, 0.48], p.optic);
      rbox(bus, p, [s * 0.64, 2.08, 1.08 - i * 0.72], [0.04, 0.42, 0.52], p.optic);
    }
    light(bus, [s * 0.44, 0.64, 1.66], [0.18, 0.14, 0.06], p);
  }
  const dest = group(bus, 'DestScroll', [0, 1.54, 1.69]);
  rbox(dest, p, [0, 0, 0], [0.64, 0.1, 0.03], p.accent);
  axleWheels(bus, 0.6, 0.3, 1.04, 0.18, p, detail, p.accent, 6, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(bus, 0.6, 0.3, -0.96, 0.2, p, detail, p.accent, 6, ['RearWheelL', 'RearWheelR']);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(bus, p, [s * 0.625, 1.72, 0], [0.04, 0.22, 2.24], p.stencil);
    }
    rbox(bus, p, [0, 0.44, 1.68], [1.28, 0.12, 0.12], p.edge);
    if (p.hd) fastener(bus, [0, 2.59, 0.96], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('London cruise', 2.8, [
      spinTrack('FrontWheelL', 'x', 2.8, 2),
      spinTrack('FrontWheelR', 'x', 2.8, 2),
      spinTrack('RearWheelL', 'x', 2.8, 2),
      spinTrack('RearWheelR', 'x', 2.8, 2),
    ]),
  ];
}

function buildFlatbedTowTruck(root: T.Group, p: Finish, detail: boolean) {
  const tow = group(root, 'TowTruck');
  shell(tow, [0, 0.38, 0], [1.18, 0.22, 3.26], p.dark, 0.24);
  shell(tow, [0, 0.94, 1.08], [1.24, 0.94, 1.04], p.primary, 0.28);
  rbox(tow, p, [0, 1.12, 1.62], [1.02, 0.38, 0.05], p.optic);
  rbox(tow, p, [0, 0.68, 1.62], [0.64, 0.26, 0.05], p.alloy);
  rbox(tow, p, [0, 0.42, 1.68], [1.3, 0.16, 0.14], p.edge);
  lightbar(tow, p, [0, 1.39, 1.08], 0.9, p.accent, p.accent);
  for (const s of [-1, 1]) {
    rbox(tow, p, [s * 0.64, 1.12, 1.08], [0.04, 0.32, 0.5], p.optic);
    light(tow, [s * 0.46, 0.68, 1.64], [0.18, 0.12, 0.06], p);
    strut(tow, [s * 0.48, 0.56, 0.44], [s * 0.42, 1.48, 0.44], 0.045, p.accent, 8);
  }
  strut(tow, [-0.42, 1.48, 0.44], [0.42, 1.48, 0.44], 0.045, p.accent, 8);
  const deck = group(tow, 'FlatbedDeck', [0, 0.62, -1.28]);
  shell(deck, [0, 0.06, 0.8], [1.36, 0.14, 2.08], p.edge, 0.2);
  for (const s of [-1, 1]) {
    rbox(deck, p, [s * 0.66, 0.14, 0.8], [0.06, 0.1, 2.02], p.accent);
  }
  cyl(deck, p, [0, 0.24, 1.62], 0.12, 0.12, 0.54, p.dark, [0, 0, Math.PI / 2], 12);
  axleWheels(tow, 0.6, 0.3, 1.04, 0.18, p, detail, p.alloy, 6, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(tow, 0.6, 0.3, -0.96, 0.22, p, detail, p.alloy, 6);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(deck, p, [s * 0.36, 0.15, 0.8], [0.18, 0.03, 1.84], p.dark);
    }
    cyl(tow, p, [0, 1.58, 0.44], 0.07, 0.08, 0.12, p.accent, [0, 0, 0], 10);
    if (p.hd) fastener(deck, [0, 0.37, 1.62], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Tilt rollback', 3.2, [
      rotationTrack('FlatbedDeck', 'x', [0, 1.0, 2.2, 3.2], [0, -0.34, -0.34, 0]),
      spinTrack('FrontWheelL', 'x', 3.2, 2),
      spinTrack('FrontWheelR', 'x', 3.2, 2),
    ]),
  ];
}

function buildBankArmoredVan(root: T.Group, p: Finish, detail: boolean) {
  const van = group(root, 'ArmoredVan');
  shell(van, [0, 0.38, 0], [1.26, 0.22, 2.98], p.dark, 0.22);
  shell(van, [0, 0.78, 1.08], [1.22, 0.62, 0.84], p.primary, 0.24);
  shell(van, [0, 1.16, -0.24], [1.34, 1.24, 2.24], p.primary, 0.2);
  shell(van, [0, 1.8, -0.24], [1.18, 0.12, 2.04], p.dark, 0.28);
  rbox(van, p, [0, 1.32, 0.9], [1.0, 0.28, 0.05], p.optic);
  rbox(van, p, [0, 0.56, 1.56], [1.34, 0.28, 0.14], p.dark);
  for (const s of [-1, 1]) {
    strut(van, [s * 0.42, 0.46, 1.58], [s * 0.42, 0.96, 1.58], 0.036, p.edge, 8);
    rbox(van, p, [s * 0.69, 0.88, -0.24], [0.04, 0.14, 2.06], p.accent);
    for (const z of [0.32, -0.46, -0.96]) {
      rbox(van, p, [s * 0.69, 1.34, z], [0.04, 0.16, 0.32], p.optic);
    }
    light(van, [s * 0.44, 0.74, 1.52], [0.18, 0.12, 0.06], p);
  }
  strut(van, [-0.46, 0.92, 1.58], [0.46, 0.92, 1.58], 0.036, p.edge, 8);
  const vault = group(van, 'VaultDoor', [0.46, 1.12, -1.38]);
  shell(vault, [-0.46, 0, 0], [0.92, 1.08, 0.1], p.edge, 0.18);
  cyl(vault, p, [-0.74, 0, -0.07], 0.08, 0.08, 0.05, p.accent, [Math.PI / 2, 0, 0], 10);
  const hatch = group(van, 'RoofHatch', [0, 1.84, 0.12]);
  shell(hatch, [0, 0.04, 0], [0.56, 0.08, 0.56], p.accent, 0.28);
  axleWheels(van, 0.64, 0.32, 0.96, 0.2, p, detail, p.edge, 6, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(van, 0.64, 0.32, -0.86, 0.22, p, detail, p.edge, 6);
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [-1.04, -0.52, 0, 0.52]) {
        rbox(van, p, [s * 0.69, 1.62, z], [0.03, 0.06, 0.12], p.alloy);
      }
    }
    if (p.hd) fastener(vault, [-0.14, 0.36, -0.06], p, 0.026).rotation.x = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Vault inspect', 3.0, [
      rotationTrack('VaultDoor', 'y', [0, 0.9, 2.1, 3.0], [0, -1.65, -1.65, 0]),
      rotationTrack('RoofHatch', 'x', [0, 0.9, 2.1, 3.0], [0, -0.75, -0.75, 0]),
    ]),
  ];
}

function buildIceCreamVan(root: T.Group, p: Finish, detail: boolean) {
  const wafer = tone(p, 'Wafer cone', '#d69c56', 0.78, 0.04);
  const mint = tone(p, 'Mint scoop', '#7ed9b4', 0.62, 0.04);
  const van = group(root, 'IceCreamVan');
  shell(van, [0, 0.34, 0], [1.22, 0.18, 2.86], p.dark, 0.26);
  shell(van, [0, 0.74, 0], [1.3, 0.66, 2.92], p.primary, 0.3);
  shell(van, [0, 1.36, -0.04], [1.24, 0.64, 2.82], p.accent, 0.3);
  shell(van, [0, 1.72, -0.04], [1.14, 0.12, 2.68], p.primary, 0.4);
  rbox(van, p, [0, 1.34, 1.39], [1.02, 0.4, 0.05], p.optic);
  rbox(van, p, [0.64, 1.28, -0.22], [0.05, 0.44, 1.28], p.inset);
  rbox(van, p, [0.72, 1.02, -0.22], [0.18, 0.05, 1.24], p.stencil);
  for (const s of [-1, 1]) {
    light(van, [s * 0.44, 0.72, 1.48], [0.18, 0.12, 0.06], p);
  }
  const flap = group(van, 'ServiceFlap', [0.66, 1.52, -0.22]);
  shell(flap, [0.03, -0.22, 0], [0.05, 0.44, 1.3], p.primary, 0.22);
  for (let i = 0; i < 4; i++) {
    rbox(flap, p, [0.065, -0.22, -0.45 + i * 0.3], [0.02, 0.38, 0.12], p.accent);
  }
  const coneTop = group(van, 'IceCreamCone', [0, 1.78, -0.16]);
  cone(coneTop, p, [0, 0.24, 0], 0.22, 0.52, wafer, [Math.PI, 0, 0], 12);
  dome(coneTop, p, [0, 0.54, 0], [0.24, 0.22, 0.24], p.primary, 10);
  dome(coneTop, p, [0.06, 0.72, 0.04], [0.18, 0.16, 0.18], mint, 10);
  dome(coneTop, p, [0, 0.86, 0], [0.1, 0.1, 0.1], p.accent, 8);
  axleWheels(van, 0.62, 0.28, 0.88, 0.16, p, detail, p.stencil, 5, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(van, 0.62, 0.28, -0.88, 0.16, p, detail, p.stencil, 5);
  if (detail) {
    cone(van, p, [0, 1.88, 0.92], 0.12, 0.24, p.alloy, [Math.PI / 2, 0, 0], 10);
    rbox(van, p, [-0.66, 1.32, -0.22], [0.04, 0.34, 1.18], p.optic);
    if (p.hd) fastener(van, [0, 1.78, 0.72], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Scoop stop', 3.0, [
      rotationTrack('ServiceFlap', 'z', [0, 0.9, 2.1, 3.0], [0, 1.42, 1.42, 0]),
      spinTrack('IceCreamCone', 'y', 3.0, 1),
    ]),
  ];
}

function buildVespaScooter(root: T.Group, p: Finish, detail: boolean) {
  const sc = group(root, 'VespaScooter');
  shell(sc, [0, 0.26, -0.02], [0.44, 0.1, 0.94], p.primary, 0.36);
  shell(sc, [0, 0.54, -0.44], [0.46, 0.44, 0.78], p.primary, 0.52);
  shell(sc, [0, 0.8, -0.34], [0.34, 0.14, 0.68], p.accent, 0.48);
  shell(sc, [0, 0.58, 0.42], [0.48, 0.62, 0.14], p.primary, 0.42).rotation.x = -0.22;
  for (const s of [-1, 1]) {
    dome(sc, p, [s * 0.24, 0.52, -0.52], [0.14, 0.22, 0.36], p.primary, 10);
    strut(sc, [s * 0.18, 0.22, -0.14], [s * 0.28, 0.02, -0.18], 0.024, p.dark, 8);
  }
  strut(sc, [-0.28, 0.02, -0.18], [0.28, 0.02, -0.18], 0.024, p.dark, 8);
  const steer = group(sc, 'Handlebars', [0, 0.94, 0.36]);
  strut(steer, [0, -0.68, 0.22], [0, 0.04, 0], 0.036, p.alloy, 10);
  shell(steer, [0, 0.08, 0.04], [0.34, 0.16, 0.22], p.primary, 0.48);
  dome(steer, p, [0, 0.08, 0.16], [0.085, 0.085, 0.05], p.stencil, 10);
  strut(steer, [-0.36, 0.06, -0.02], [0.36, 0.06, -0.02], 0.024, p.alloy, 8);
  for (const s of [-1, 1]) cyl(steer, p, [s * 0.36, 0.06, -0.02], 0.032, 0.032, 0.14, p.tire, [0, 0, Math.PI / 2], 8);
  shell(steer, [0, -0.5, 0.24], [0.18, 0.12, 0.34], p.accent, 0.48);
  wheel(steer, 'FrontWheel', [0, -0.7, 0.24], 0.24, 0.11, p, detail, p.accent, 5);
  wheel(sc, 'RearWheel', [0, 0.24, -0.62], 0.24, 0.12, p, detail, p.accent, 5);
  strut(sc, [0, 0.24, -0.62], [0, 0.44, -0.56], 0.04, p.dark, 8);
  if (detail) {
    rbox(sc, p, [0, 0.78, -0.88], [0.34, 0.04, 0.26], p.alloy);
    strut(sc, [0, 0.58, -0.78], [0, 0.78, -0.88], 0.02, p.alloy, 6);
    for (const s of [-1, 1]) {
      strut(steer, [s * 0.26, 0.06, -0.02], [s * 0.32, 0.28, 0.02], 0.014, p.alloy, 6);
      dome(steer, p, [s * 0.32, 0.3, 0.02], [0.055, 0.055, 0.025], p.alloy, 8);
    }
    if (p.hd) fastener(sc, [0, 0.88, -0.54], p, 0.02);
  }
  root.animations = [
    new T.AnimationClip('Piazza glide', 2.8, [
      sway('Handlebars', 'y', 2.8, -0.45, 0.45),
      spinTrack('FrontWheel', 'x', 2.8, 3),
      spinTrack('RearWheel', 'x', 2.8, 3),
    ]),
  ];
}

function buildRallyBuggy(root: T.Group, p: Finish, detail: boolean) {
  const bug = group(root, 'RallyBuggy');
  shell(bug, [0, 0.42, 0], [0.96, 0.24, 1.98], p.dark, 0.34);
  shell(bug, [0, 0.6, 0.56], [0.84, 0.28, 0.94], p.primary, 0.44);
  shell(bug, [0, 0.68, -0.58], [0.92, 0.38, 0.86], p.primary, 0.4);
  rbox(bug, p, [0, 0.72, -0.06], [0.64, 0.28, 0.54], p.tire);
  for (const s of [-1, 1]) {
    strut(bug, [s * 0.42, 0.72, 0.44], [s * 0.38, 1.28, 0.14], 0.036, p.accent, 8);
    strut(bug, [s * 0.42, 0.74, -0.42], [s * 0.38, 1.28, -0.4], 0.036, p.accent, 8);
    strut(bug, [s * 0.38, 1.28, 0.14], [s * 0.38, 1.28, -0.4], 0.036, p.accent, 8);
    strut(bug, [s * 0.42, 0.42, 0.84], [s * 0.72, 0.36, 0.84], 0.04, p.edge, 8);
    strut(bug, [s * 0.42, 0.42, -0.78], [s * 0.74, 0.38, -0.78], 0.04, p.edge, 8);
    strut(bug, [s * 0.44, 0.68, 0.82], [s * 0.68, 0.38, 0.84], 0.028, p.accent, 8);
    strut(bug, [s * 0.44, 0.72, -0.76], [s * 0.7, 0.4, -0.78], 0.028, p.accent, 8);
  }
  shell(bug, [0, 1.32, -0.14], [0.82, 0.08, 0.66], p.primary, 0.34);
  const pod = group(bug, 'RallyLightPod', [0, 1.38, 0.18]);
  rbox(pod, p, [0, 0, 0], [0.76, 0.08, 0.12], p.dark);
  for (const x of [-0.26, -0.09, 0.09, 0.26]) {
    cyl(pod, p, [x, 0.08, 0.04], 0.07, 0.06, 0.09, p.dark, [Math.PI / 2, 0, 0], 10);
    dome(pod, p, [x, 0.08, 0.09], [0.06, 0.06, 0.03], p.stencil, 8);
  }
  const spare = group(bug, 'SpareWheel', [0, 0.94, -0.82]);
  cyl(spare, p, [0, 0, 0], 0.3, 0.3, 0.18, p.tire, [0.55, 0, 0], 12);
  cyl(spare, p, [0, 0.02, 0.01], 0.18, 0.18, 0.2, p.accent, [0.55, 0, 0], 10);
  axleWheels(bug, 0.76, 0.34, 0.84, 0.24, p, detail, p.accent, 6, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(bug, 0.78, 0.36, -0.78, 0.28, p, detail, p.accent, 6, ['RearWheelL', 'RearWheelR']);
  if (detail) {
    rbox(bug, p, [0, 0.48, 1.04], [0.86, 0.12, 0.12], p.edge);
    torus(bug, p, [0, 0.86, 0.22], 0.12, 0.022, p.tire, [0.85, 0, 0]);
    if (p.hd) fastener(bug, [0, 1.37, -0.14], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Dune charge', 2.4, [
      spinTrack('FrontWheelL', 'x', 2.4, 3),
      spinTrack('FrontWheelR', 'x', 2.4, 3),
      spinTrack('RearWheelL', 'x', 2.4, 3),
      spinTrack('RearWheelR', 'x', 2.4, 3),
      sway('RallyLightPod', 'x', 2.4, -0.25, 0.25),
    ]),
  ];
}

export const vehiclesRoadC: readonly PackEntrySpec[] = [
  {
    id: 'london-double-decker',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left double-decker wheel'),
      rp('RearWheelL', 'Rear-left wheel', 'rotate', 'x', [0, 360], 'Rolls the rear-left double-decker wheel'),
      rp('DestScroll', 'Destination sign', 'rotate', 'x', [-20, 20], 'Tilts the front destination board'),
    ],
    build: buildDoubleDecker,
  },
  {
    id: 'flatbed-tow-truck',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('FlatbedDeck', 'Flatbed ramp', 'rotate', 'x', [-24, 0], 'Tilts the hydraulic rollback tow deck downward'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left tow truck wheel'),
      rp('FrontWheelR', 'Front-right wheel', 'rotate', 'x', [0, 360], 'Rolls the front-right tow truck wheel'),
    ],
    build: buildFlatbedTowTruck,
  },
  {
    id: 'bank-armored-van',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('VaultDoor', 'Rear vault door', 'rotate', 'y', [-100, 0], 'Swings the heavy rear armored vault door open'),
      rp('RoofHatch', 'Roof hatch', 'rotate', 'x', [-60, 0], 'Flips open the armored top observation hatch'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left armored wheel'),
    ],
    build: buildBankArmoredVan,
  },
  {
    id: 'pastel-icecream-van',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('ServiceFlap', 'Serving window flap', 'rotate', 'z', [0, 85], 'Raises the pastel side serving window canopy'),
      rp('IceCreamCone', 'Roof cone sign', 'rotate', 'y', [0, 360], 'Spins the rooftop swirled ice-cream cone topper'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left ice-cream van wheel'),
    ],
    build: buildIceCreamVan,
  },
  {
    id: 'vintage-vespa-scooter',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('Handlebars', 'Handlebars and fork', 'rotate', 'y', [-32, 32], 'Steers the vintage scooter front fork and headlamp'),
      rp('FrontWheel', 'Front wheel', 'rotate', 'x', [0, 360], 'Spins the front scooter tire'),
      rp('RearWheel', 'Rear wheel', 'rotate', 'x', [0, 360], 'Spins the rear drive tire'),
    ],
    build: buildVespaScooter,
  },
  {
    id: 'rally-offroad-buggy',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('FrontWheelL', 'Front-left knobby', 'rotate', 'x', [0, 360], 'Rolls the front-left off-road rally tire'),
      rp('RearWheelL', 'Rear-left knobby', 'rotate', 'x', [0, 360], 'Rolls the rear-left off-road rally tire'),
      rp('RallyLightPod', 'Roof light pod', 'rotate', 'x', [-20, 20], 'Tilts the four-lamp roof rally light bar'),
    ],
    detachableParts: [det('SpareWheel', 'Rear spare wheel', 'Removable full-size spare rally tire on the rear deck')],
    build: buildRallyBuggy,
  },
];
