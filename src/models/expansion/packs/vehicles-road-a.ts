import * as T from 'three';
import {
  axleWheels, cyl, det, dome, fastener, group, light, lightbar, rbox,
  rotationTrack, rp, shell, slideTrack, spinTrack, strut, sway, tone, torus, wheel,
} from './vehicles-road-kit';
import type { Finish, PackEntrySpec, Point } from './vehicles-road-kit';

function buildArticulatedBus(root: T.Group, p: Finish, detail: boolean) {
  const bus = group(root, 'BusChassis');
  shell(bus, [0, 0.34, 0.92], [1.14, 0.2, 2.04], p.dark, 0.22);
  shell(bus, [0, 0.34, -1.04], [1.14, 0.2, 1.54], p.dark, 0.22);
  shell(bus, [0, 0.98, 0.94], [1.24, 1.12, 2.12], p.primary, 0.24);
  shell(bus, [0, 1.56, 0.94], [1.18, 0.1, 2.02], p.stencil, 0.3);
  shell(bus, [0, 0.98, -1.06], [1.24, 1.12, 1.58], p.primary, 0.24);
  shell(bus, [0, 1.56, -1.06], [1.18, 0.1, 1.48], p.stencil, 0.3);
  for (let i = 0; i < 4; i++) {
    const z = -0.26 + i * 0.085;
    shell(bus, [0, 0.98, z], [1.14 + (i % 2) * 0.05, 1.04 + (i % 2) * 0.04, 0.07], p.tire, 0.28);
  }
  rbox(bus, p, [0, 1.16, 2.02], [1.04, 0.44, 0.05], p.optic);
  rbox(bus, p, [0, 1.46, 2.02], [0.76, 0.12, 0.05], p.dark);
  rbox(bus, p, [0, 0.68, 2.01], [1.28, 0.14, 0.12], p.accent);
  for (const s of [-1, 1]) {
    rbox(bus, p, [s * 0.64, 0.72, 0.94], [0.04, 0.14, 1.92], p.accent);
    rbox(bus, p, [s * 0.64, 0.72, -1.06], [0.04, 0.14, 1.38], p.accent);
    for (const z of [1.48, 0.42, -0.76, -1.42]) {
      rbox(bus, p, [s * 0.64, 1.18, z], [0.04, 0.38, 0.44], p.optic);
    }
    light(bus, [s * 0.44, 0.56, 2.04], [0.2, 0.11, 0.06], p);
  }
  const doorBase: Point = [0.65, 0.94, 0.96];
  const door = group(bus, 'TransitDoor', doorBase);
  rbox(door, p, [0, 0, 0], [0.05, 0.92, 0.44], p.accent);
  rbox(door, p, [0.025, 0.18, 0], [0.025, 0.42, 0.3], p.optic);
  axleWheels(bus, 0.58, 0.28, 1.48, 0.16, p, detail, p.alloy, 5, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(bus, 0.58, 0.28, 0.24, 0.16, p, detail, p.alloy, 5);
  axleWheels(bus, 0.58, 0.28, -1.32, 0.16, p, detail, p.alloy, 5);
  if (detail) {
    shell(bus, [0, 1.66, 0.94], [0.74, 0.14, 1.04], p.edge, 0.38);
    shell(bus, [0, 1.66, -1.06], [0.7, 0.14, 0.76], p.edge, 0.38);
    for (const s of [-1, 1]) {
      strut(bus, [s * 0.6, 1.24, 1.92], [s * 0.76, 1.24, 2.02], 0.018, p.dark, 8);
      rbox(bus, p, [s * 0.76, 1.24, 2.04], [0.06, 0.16, 0.04], p.dark);
    }
    if (p.hd) fastener(bus, [0, 1.74, 0.94], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('City route', 3.0, [
      spinTrack('FrontWheelL', 'x', 3.0, 2),
      spinTrack('FrontWheelR', 'x', 3.0, 2),
      slideTrack('TransitDoor', 'z', doorBase, [0, 0.9, 2.1, 3.0], [0, 0.38, 0.38, 0]),
    ]),
  ];
}

function buildLadderFireEngine(root: T.Group, p: Finish, detail: boolean) {
  const redBeacon = tone(p, 'Beacon red', '#e53e3e', 0.32, 0.15, '#c53030');
  const truck = group(root, 'FireEngine');
  shell(truck, [0, 0.38, 0], [1.18, 0.24, 3.36], p.dark, 0.24);
  shell(truck, [0, 0.94, 1.12], [1.26, 0.92, 1.06], p.primary, 0.28);
  shell(truck, [0, 0.88, -0.56], [1.24, 0.78, 2.12], p.primary, 0.24);
  rbox(truck, p, [0, 0.42, 1.72], [1.34, 0.18, 0.16], p.alloy);
  rbox(truck, p, [0, 1.08, 1.66], [1.04, 0.38, 0.05], p.optic);
  rbox(truck, p, [0, 0.68, 1.66], [0.64, 0.26, 0.05], p.alloy);
  lightbar(truck, p, [0, 1.42, 1.24], 0.92, redBeacon, redBeacon);
  for (const s of [-1, 1]) {
    rbox(truck, p, [s * 0.64, 0.86, -0.56], [0.05, 0.46, 1.78], p.alloy);
    rbox(truck, p, [s * 0.65, 1.18, 1.12], [0.04, 0.3, 0.52], p.optic);
    rbox(truck, p, [s * 0.65, 0.72, 1.12], [0.04, 0.1, 0.94], p.accent);
    light(truck, [s * 0.48, 0.66, 1.68], [0.18, 0.12, 0.06], p);
  }
  cyl(truck, p, [0, 1.34, -1.16], 0.38, 0.42, 0.18, p.edge, [0, 0, 0], 12);
  const turntable = group(truck, 'LadderTurntable', [0, 1.44, -1.16]);
  shell(turntable, [0, 0.1, 0], [0.58, 0.22, 0.62], p.dark, 0.32);
  const boom = group(turntable, 'AerialLadder', [0, 0.22, -0.1]);
  boom.rotation.x = -0.34;
  for (const s of [-1, 1]) {
    strut(boom, [s * 0.2, 0, 0], [s * 0.2, 0, 2.38], 0.036, p.accent, 8);
    strut(boom, [s * 0.2, 0.16, 0.1], [s * 0.2, 0.16, 2.28], 0.024, p.alloy, 8);
    for (let k = 0; k < 6; k++) {
      const z = 0.2 + k * 0.38;
      strut(boom, [s * 0.2, 0, z], [s * 0.2, 0.16, z], 0.018, p.alloy, 6);
    }
  }
  for (let i = 0; i < 9; i++) {
    strut(boom, [-0.2, 0, 0.16 + i * 0.26], [0.2, 0, 0.16 + i * 0.26], 0.018, p.edge, 6);
  }
  axleWheels(truck, 0.62, 0.32, 1.12, 0.2, p, detail, p.alloy, 6, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(truck, 0.62, 0.32, -0.78, 0.22, p, detail, p.alloy, 6);
  axleWheels(truck, 0.62, 0.32, -1.36, 0.22, p, detail, p.alloy, 6);
  if (detail) {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        rbox(truck, p, [s * 0.67, 0.86, -1.12 + i * 0.42], [0.025, 0.34, 0.03], p.dark);
      }
      cyl(truck, p, [s * 0.44, 1.3, 0.24], 0.08, 0.08, 0.48, p.accent, [0, 0, Math.PI / 2], 10);
    }
    if (p.hd) fastener(turntable, [0, 0.22, 0.22], p, 0.03);
  }
  root.animations = [
    new T.AnimationClip('Aerial rescue', 3.4, [
      sway('LadderTurntable', 'y', 3.4, -0.75, 0.75),
      rotationTrack('AerialLadder', 'x', [0, 1.1, 2.3, 3.4], [-0.34, -0.92, -0.92, -0.34]),
    ]),
    new T.AnimationClip('Emergency roll', 2.4, [
      spinTrack('FrontWheelL', 'x', 2.4, 2),
      spinTrack('FrontWheelR', 'x', 2.4, 2),
    ]),
  ];
}

function buildQuarryDumpTruck(root: T.Group, p: Finish, detail: boolean) {
  const dump = group(root, 'QuarryHauler');
  shell(dump, [0, 0.68, 0], [1.62, 0.42, 2.74], p.dark, 0.28);
  shell(dump, [0, 1.14, 1.16], [1.74, 0.56, 0.82], p.primary, 0.26);
  shell(dump, [0, 1.66, 1.06], [0.84, 0.54, 0.78], p.primary, 0.3);
  rbox(dump, p, [0, 1.72, 1.46], [0.68, 0.32, 0.05], p.optic);
  rbox(dump, p, [0, 1.12, 1.59], [0.92, 0.36, 0.06], p.inset);
  rbox(dump, p, [0, 0.66, 1.54], [1.82, 0.22, 0.22], p.accent);
  for (const s of [-1, 1]) {
    light(dump, [s * 0.68, 1.14, 1.58], [0.22, 0.14, 0.08], p);
    rbox(dump, p, [s * 0.44, 1.72, 1.08], [0.04, 0.28, 0.48], p.optic);
  }
  strut(dump, [0.46, 0.72, 1.56], [-0.46, 1.38, 1.56], 0.04, p.edge, 8);
  const bed = group(dump, 'DumpBed', [0, 0.94, -1.16]);
  shell(bed, [0, 0.14, 1.06], [1.96, 0.16, 2.18], p.primary, 0.2);
  shell(bed, [0, 0.58, 1.98], [1.96, 0.76, 0.16], p.primary, 0.22);
  shell(bed, [0, 1.02, 2.42], [1.94, 0.14, 0.94], p.primary, 0.24);
  for (const s of [-1, 1]) {
    shell(bed, [s * 0.94, 0.56, 1.06], [0.14, 0.74, 2.18], p.primary, 0.2);
    for (let k = 0; k < 4; k++) {
      rbox(bed, p, [s * 1.03, 0.56, 0.24 + k * 0.56], [0.06, 0.64, 0.1], p.accent);
    }
  }
  dome(bed, p, [0, 0.54, 1.04], [0.76, 0.34, 0.84], p.edge, 8);
  axleWheels(dump, 0.94, 0.58, 0.94, 0.42, p, detail, p.accent, 8, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(dump, 0.94, 0.58, -0.84, 0.46, p, detail, p.accent, 8);
  if (detail) {
    for (let i = 0; i < 4; i++) {
      rbox(dump, p, [0.36 - i * 0.24, 0.82 + i * 0.16, 1.63], [0.22, 0.035, 0.08], p.alloy);
    }
    for (const s of [-1, 1]) {
      strut(dump, [s * 0.86, 1.42, 0.76], [s * 0.86, 1.76, 0.76], 0.024, p.alloy, 8);
      strut(dump, [s * 0.86, 1.42, 1.44], [s * 0.86, 1.76, 1.44], 0.024, p.alloy, 8);
      strut(dump, [s * 0.86, 1.76, 0.76], [s * 0.86, 1.76, 1.44], 0.024, p.alloy, 8);
    }
    if (p.hd) fastener(bed, [0, 1.1, 2.66], p, 0.036);
  }
  root.animations = [
    new T.AnimationClip('Dump load', 3.2, [
      rotationTrack('DumpBed', 'x', [0, 1.0, 2.2, 3.2], [0, -0.68, -0.68, 0]),
    ]),
    new T.AnimationClip('Quarry haul', 2.8, [
      spinTrack('FrontWheelL', 'x', 2.8, 2),
      spinTrack('FrontWheelR', 'x', 2.8, 2),
    ]),
  ];
}

function buildYellowSchoolBus(root: T.Group, p: Finish, detail: boolean) {
  const redSign = tone(p, 'Stop sign', '#d93829', 0.45, 0.1);
  const bus = group(root, 'SchoolBus');
  shell(bus, [0, 0.36, -0.06], [1.14, 0.22, 3.36], p.dark, 0.24);
  shell(bus, [0, 0.72, 1.32], [0.98, 0.56, 0.86], p.primary, 0.32);
  rbox(bus, p, [0, 0.72, 1.76], [0.68, 0.34, 0.05], p.accent);
  rbox(bus, p, [0, 0.42, 1.8], [1.24, 0.16, 0.14], p.accent);
  shell(bus, [0, 1.08, -0.28], [1.24, 1.24, 2.54], p.primary, 0.28);
  shell(bus, [0, 1.72, -0.28], [1.14, 0.14, 2.42], p.primary, 0.38);
  rbox(bus, p, [0, 1.32, 1.01], [1.04, 0.38, 0.05], p.optic);
  rbox(bus, p, [0, 1.32, -1.57], [0.92, 0.34, 0.05], p.optic);
  for (const s of [-1, 1]) {
    rbox(bus, p, [s * 0.64, 0.92, -0.28], [0.04, 0.1, 2.38], p.accent);
    for (let i = 0; i < 5; i++) {
      rbox(bus, p, [s * 0.64, 1.3, 0.62 - i * 0.44], [0.04, 0.34, 0.34], p.optic);
    }
    light(bus, [s * 0.42, 0.74, 1.76], [0.16, 0.14, 0.06], p);
  }
  const stopArm = group(bus, 'StopSignArm', [-0.65, 1.02, 0.94]);
  rbox(stopArm, p, [-0.04, 0, -0.14], [0.04, 0.08, 0.28], p.alloy);
  cyl(stopArm, p, [-0.05, 0, -0.28], 0.16, 0.16, 0.045, redSign, [0, 0, Math.PI / 2], 8);
  axleWheels(bus, 0.6, 0.3, 1.18, 0.18, p, detail, p.accent, 6, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(bus, 0.6, 0.3, -0.96, 0.2, p, detail, p.accent, 6);
  if (detail) {
    for (const s of [-1, 1]) {
      dome(bus, p, [s * 0.38, 1.62, 1.02], [0.075, 0.075, 0.05], redSign, 8);
      strut(bus, [s * 0.46, 0.98, 1.48], [s * 0.64, 1.16, 1.56], 0.016, p.dark, 6);
      dome(bus, p, [s * 0.64, 1.18, 1.56], [0.06, 0.06, 0.04], p.alloy, 8);
    }
    rbox(bus, p, [0, 1.8, -0.28], [0.46, 0.06, 0.46], p.stencil);
    if (p.hd) fastener(bus, [0, 1.84, -0.28], p, 0.025);
  }
  root.animations = [
    new T.AnimationClip('School stop', 3.0, [
      rotationTrack('StopSignArm', 'y', [0, 0.8, 2.2, 3.0], [0, -1.45, -1.45, 0]),
      spinTrack('FrontWheelL', 'x', 3.0, 2),
      spinTrack('FrontWheelR', 'x', 3.0, 2),
    ]),
  ];
}

function buildVintageRoadster(root: T.Group, p: Finish, detail: boolean) {
  const car = group(root, 'Roadster');
  shell(car, [0, 0.34, 0], [0.92, 0.18, 2.52], p.dark, 0.32);
  shell(car, [0, 0.62, 0.68], [0.68, 0.42, 1.18], p.primary, 0.46);
  shell(car, [0, 0.6, -0.34], [0.98, 0.44, 1.04], p.primary, 0.4);
  shell(car, [0, 0.56, -1.04], [0.88, 0.36, 0.68], p.primary, 0.48);
  rbox(car, p, [0, 0.64, 1.29], [0.46, 0.44, 0.06], p.alloy);
  rbox(car, p, [0, 0.72, -0.28], [0.76, 0.24, 0.56], p.accent);
  rbox(car, p, [0, 0.92, 0.18], [0.74, 0.24, 0.05], p.optic).rotation.x = -0.36;
  for (const s of [-1, 1]) {
    shell(car, [s * 0.58, 0.26, -0.02], [0.22, 0.07, 1.04], p.accent, 0.32);
    shell(car, [s * 0.56, 0.52, 0.92], [0.28, 0.14, 0.72], p.primary, 0.48);
    shell(car, [s * 0.56, 0.5, -0.92], [0.28, 0.16, 0.74], p.primary, 0.48);
    cyl(car, p, [s * 0.38, 0.66, 1.22], 0.1, 0.08, 0.16, p.alloy, [Math.PI / 2, 0, 0], 10);
    dome(car, p, [s * 0.38, 0.66, 1.31], [0.085, 0.085, 0.04], p.stencil, 8);
  }
  const trunk = group(car, 'RumbleLid', [0, 0.76, -0.78]);
  shell(trunk, [0, 0.02, -0.26], [0.68, 0.09, 0.54], p.accent, 0.36);
  axleWheels(car, 0.58, 0.3, 0.92, 0.14, p, detail, p.accent, 8, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(car, 0.58, 0.3, -0.92, 0.15, p, detail, p.accent, 8);
  if (detail) {
    torus(car, p, [0.18, 0.84, 0.04], 0.12, 0.022, p.tire, [1.05, 0, 0]);
    for (const s of [-1, 1]) {
      strut(car, [s * 0.38, 0.54, 0.98], [s * 0.48, 0.32, 0.2], 0.028, p.alloy, 8);
      strut(car, [s * 0.48, 0.32, 0.2], [s * 0.48, 0.32, -1.24], 0.028, p.alloy, 8);
    }
    dome(car, p, [0, 0.9, 1.26], [0.04, 0.06, 0.04], p.alloy, 8);
    if (p.hd) fastener(car, [0, 0.84, 0.68], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Grand tour', 2.8, [
      spinTrack('FrontWheelL', 'x', 2.8, 2),
      spinTrack('FrontWheelR', 'x', 2.8, 2),
      rotationTrack('RumbleLid', 'x', [0, 0.8, 2.0, 2.8], [0, -0.85, -0.85, 0]),
    ]),
  ];
}

function buildThreeWheelTukTuk(root: T.Group, p: Finish, detail: boolean) {
  const tuk = group(root, 'TukTuk');
  shell(tuk, [0, 0.34, -0.06], [0.98, 0.2, 1.56], p.dark, 0.34);
  shell(tuk, [0, 0.62, 0.58], [0.74, 0.56, 0.58], p.primary, 0.44);
  shell(tuk, [0, 0.62, -0.44], [1.04, 0.56, 0.96], p.primary, 0.34);
  rbox(tuk, p, [0, 0.72, -0.52], [0.84, 0.34, 0.52], p.accent);
  rbox(tuk, p, [0, 1.04, 0.84], [0.64, 0.34, 0.05], p.optic).rotation.x = -0.18;
  dome(tuk, p, [0, 0.66, 0.89], [0.11, 0.11, 0.06], p.stencil, 10);
  for (const s of [-1, 1]) {
    strut(tuk, [s * 0.34, 0.88, 0.68], [s * 0.42, 1.48, 0.56], 0.028, p.alloy, 8);
    strut(tuk, [s * 0.46, 0.88, -0.84], [s * 0.46, 1.48, -0.82], 0.028, p.alloy, 8);
    rbox(tuk, p, [s * 0.54, 0.64, -0.44], [0.04, 0.12, 0.82], p.accent);
  }
  shell(tuk, [0, 1.54, -0.12], [1.08, 0.18, 1.56], p.accent, 0.44);
  const fork = group(tuk, 'FrontFork', [0, 0.52, 0.82]);
  strut(fork, [0, 0.34, -0.08], [0, -0.26, 0.08], 0.036, p.alloy, 8);
  strut(fork, [-0.28, 0.34, -0.1], [0.28, 0.34, -0.1], 0.024, p.dark, 8);
  wheel(fork, 'FrontWheel', [0, -0.32, 0.1], 0.2, 0.12, p, detail, p.accent, 5);
  axleWheels(tuk, 0.52, 0.22, -0.56, 0.14, p, detail, p.accent, 5, ['RearWheelL', 'RearWheelR']);
  if (detail) {
    rbox(tuk, p, [0, 0.4, 0.96], [0.64, 0.08, 0.08], p.alloy);
    for (const s of [-1, 1]) {
      rbox(tuk, p, [s * 0.46, 1.18, 0.68], [0.08, 0.12, 0.04], p.dark);
      dome(tuk, p, [s * 0.32, 0.44, 0.88], [0.055, 0.055, 0.04], p.accent, 8);
    }
    if (p.hd) fastener(tuk, [0, 1.64, -0.12], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Market zip', 2.8, [
      sway('FrontFork', 'y', 2.8, -0.42, 0.42),
      spinTrack('RearWheelL', 'x', 2.8, 3),
      spinTrack('RearWheelR', 'x', 2.8, 3),
    ]),
  ];
}

function buildGourmetFoodTruck(root: T.Group, p: Finish, detail: boolean) {
  const bun = tone(p, 'Burger bun', '#d99648', 0.72, 0.04);
  const patty = tone(p, 'Grill patty', '#5c3322', 0.78, 0.05);
  const lettuce = tone(p, 'Crisp lettuce', '#52a347', 0.68, 0.04);
  const truck = group(root, 'FoodTruck');
  shell(truck, [0, 0.36, 0], [1.28, 0.2, 3.12], p.dark, 0.24);
  shell(truck, [0, 1.12, 0], [1.34, 1.36, 3.06], p.primary, 0.24);
  shell(truck, [0, 1.84, 0], [1.26, 0.12, 2.94], p.accent, 0.32);
  rbox(truck, p, [0, 1.24, 1.55], [1.08, 0.44, 0.05], p.optic);
  rbox(truck, p, [0, 0.62, 1.56], [0.76, 0.24, 0.05], p.alloy);
  rbox(truck, p, [0.66, 1.18, -0.22], [0.06, 0.56, 1.48], p.inset);
  rbox(truck, p, [0.74, 0.88, -0.22], [0.22, 0.06, 1.44], p.alloy);
  for (const s of [-1, 1]) {
    rbox(truck, p, [s * 0.69, 0.68, 0], [0.04, 0.16, 2.86], p.accent);
    light(truck, [s * 0.46, 0.64, 1.56], [0.18, 0.12, 0.06], p);
  }
  const awning = group(truck, 'ServingAwning', [0.68, 1.48, -0.22]);
  shell(awning, [0.04, -0.26, 0], [0.06, 0.56, 1.52], p.accent, 0.2);
  for (let i = 0; i < 4; i++) {
    rbox(awning, p, [0.08, -0.26, -0.54 + i * 0.36], [0.025, 0.5, 0.16], p.stencil);
  }
  const sign = group(truck, 'RoofTopper', [0, 1.92, -0.18]);
  cyl(sign, p, [0, 0.06, 0], 0.08, 0.1, 0.14, p.alloy, [0, 0, 0], 10);
  cyl(sign, p, [0, 0.16, 0], 0.34, 0.34, 0.09, bun, [0, 0, 0], 12);
  cyl(sign, p, [0, 0.24, 0], 0.36, 0.36, 0.08, patty, [0, 0, 0], 12);
  cyl(sign, p, [0, 0.3, 0], 0.38, 0.36, 0.05, lettuce, [0, 0, 0], 12);
  dome(sign, p, [0, 0.32, 0], [0.34, 0.2, 0.34], bun, 10);
  axleWheels(truck, 0.64, 0.28, 0.96, 0.18, p, detail, p.alloy, 5, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(truck, 0.64, 0.28, -0.92, 0.18, p, detail, p.alloy, 5);
  if (detail) {
    cyl(truck, p, [-0.26, 2.02, -1.04], 0.14, 0.16, 0.28, p.alloy, [0, 0, 0], 10);
    rbox(truck, p, [-0.69, 1.24, -0.22], [0.04, 0.36, 1.2], p.stencil);
    if (p.hd) fastener(truck, [0, 1.91, 0.88], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Open kitchen', 3.0, [
      rotationTrack('ServingAwning', 'z', [0, 0.9, 2.1, 3.0], [0, 1.48, 1.48, 0]),
      spinTrack('FrontWheelL', 'x', 3.0, 2),
      spinTrack('FrontWheelR', 'x', 3.0, 2),
    ]),
  ];
}

export const vehiclesRoadA: readonly PackEntrySpec[] = [
  {
    id: 'articulated-city-bus',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('TransitDoor', 'Boarding door', 'slide', 'z', [0, 0.38], 'Slides the front boarding door open'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left transit wheel'),
      rp('FrontWheelR', 'Front-right wheel', 'rotate', 'x', [0, 360], 'Rolls the front-right transit wheel'),
    ],
    build: buildArticulatedBus,
  },
  {
    id: 'ladder-fire-engine',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('LadderTurntable', 'Ladder turntable', 'rotate', 'y', [-90, 90], 'Swivels the rear aerial ladder turntable'),
      rp('AerialLadder', 'Aerial ladder', 'rotate', 'x', [-55, 0], 'Raises and lowers the extending fire ladder'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left pumper wheel'),
    ],
    build: buildLadderFireEngine,
  },
  {
    id: 'quarry-dump-truck',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('DumpBed', 'Rock dump bed', 'rotate', 'x', [-45, 0], 'Tilts the massive ribbed haul bed to dump ore'),
      rp('FrontWheelL', 'Front-left tire', 'rotate', 'x', [0, 360], 'Rolls the oversized front-left quarry tire'),
      rp('FrontWheelR', 'Front-right tire', 'rotate', 'x', [0, 360], 'Rolls the oversized front-right quarry tire'),
    ],
    build: buildQuarryDumpTruck,
  },
  {
    id: 'yellow-school-bus',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('StopSignArm', 'Stop sign arm', 'rotate', 'y', [-85, 0], 'Swings the octagonal school crossing stop sign outward'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left school bus wheel'),
      rp('FrontWheelR', 'Front-right wheel', 'rotate', 'x', [0, 360], 'Rolls the front-right school bus wheel'),
    ],
    build: buildYellowSchoolBus,
  },
  {
    id: 'vintage-roadster-coupe',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('RumbleLid', 'Rumble deck lid', 'rotate', 'x', [-55, 0], 'Opens the rear rumble-seat deck lid'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Spins the front-left wire-spoked roadster wheel'),
      rp('FrontWheelR', 'Front-right wheel', 'rotate', 'x', [0, 360], 'Spins the front-right wire-spoked roadster wheel'),
    ],
    build: buildVintageRoadster,
  },
  {
    id: 'three-wheel-tuktuk',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('FrontFork', 'Front steering fork', 'rotate', 'y', [-28, 28], 'Steers the single front wheel and handlebar fork'),
      rp('RearWheelL', 'Rear-left wheel', 'rotate', 'x', [0, 360], 'Rolls the rear-left drive wheel'),
      rp('RearWheelR', 'Rear-right wheel', 'rotate', 'x', [0, 360], 'Rolls the rear-right drive wheel'),
    ],
    build: buildThreeWheelTukTuk,
  },
  {
    id: 'gourmet-food-truck',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('ServingAwning', 'Serving awning', 'rotate', 'z', [0, 88], 'Lifts the side serving hatch awning open'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left food truck wheel'),
    ],
    detachableParts: [det('RoofTopper', 'Roof burger sign', 'Removable novelty burger sign mounted atop the kitchen roof')],
    build: buildGourmetFoodTruck,
  },
];
