import * as T from 'three';
import {
  axleWheels, cone, cyl, det, dome, fastener, group, light, lightbar, rbox, ring,
  rotationTrack, rp, shell, spinTrack, strut, sway, tone, torus,
} from './vehicles-road-kit';
import type { Finish, PackEntrySpec, Point } from './vehicles-road-kit';

function buildEmergencyAmbulance(root: T.Group, p: Finish, detail: boolean) {
  const blueBeacon = tone(p, 'Blue strobe', '#2b7de9', 0.3, 0.18, '#1e5aa8');
  const amb = group(root, 'Ambulance');
  shell(amb, [0, 0.36, 0.04], [1.24, 0.2, 3.08], p.dark, 0.26);
  shell(amb, [0, 0.78, 1.18], [1.22, 0.62, 0.86], p.primary, 0.34);
  shell(amb, [0, 1.24, 0.88], [1.18, 0.44, 0.68], p.primary, 0.36);
  shell(amb, [0, 1.12, -0.44], [1.34, 1.28, 2.02], p.primary, 0.22);
  shell(amb, [0, 1.8, -0.44], [1.24, 0.12, 1.9], p.primary, 0.34);
  rbox(amb, p, [0, 1.22, 1.24], [0.98, 0.36, 0.05], p.optic).rotation.x = -0.32;
  lightbar(amb, p, [0, 1.82, 0.44], 0.94, p.accent, blueBeacon);
  for (const s of [-1, 1]) {
    rbox(amb, p, [s * 0.69, 0.9, -0.44], [0.04, 0.16, 1.9], p.accent);
    rbox(amb, p, [s * 0.7, 1.32, -0.44], [0.03, 0.36, 0.12], p.accent);
    rbox(amb, p, [s * 0.7, 1.32, -0.44], [0.03, 0.12, 0.36], p.accent);
    rbox(amb, p, [s * 0.61, 1.22, 0.9], [0.04, 0.3, 0.44], p.optic);
    light(amb, [s * 0.44, 0.66, 1.62], [0.2, 0.12, 0.06], p);
  }
  for (const [side, name] of [[1, 'RearDoorL'], [-1, 'RearDoorR']] as const) {
    const door = group(amb, name, [side * 0.58, 1.1, -1.48]);
    shell(door, [-side * 0.28, 0, 0], [0.56, 1.14, 0.07], p.primary, 0.2);
    rbox(door, p, [-side * 0.28, 0.26, -0.045], [0.34, 0.32, 0.025], p.optic);
    rbox(door, p, [-side * 0.28, -0.18, -0.045], [0.46, 0.14, 0.025], p.accent);
  }
  axleWheels(amb, 0.64, 0.3, 1.02, 0.18, p, detail, p.alloy, 5, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(amb, 0.64, 0.3, -0.88, 0.18, p, detail, p.alloy, 5);
  if (detail) {
    rbox(amb, p, [0, 0.66, 1.62], [0.56, 0.22, 0.05], p.inset);
    for (const s of [-1, 1]) {
      dome(amb, p, [s * 0.46, 1.78, -1.36], [0.07, 0.07, 0.05], p.accent, 8);
      strut(amb, [s * 0.6, 1.16, 1.06], [s * 0.74, 1.16, 1.08], 0.018, p.dark, 8);
      rbox(amb, p, [s * 0.74, 1.18, 1.08], [0.06, 0.16, 0.04], p.dark);
    }
    if (p.hd) fastener(amb, [0, 1.88, -0.44], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Medical response', 3.0, [
      rotationTrack('RearDoorL', 'y', [0, 0.9, 2.1, 3.0], [0, -1.7, -1.7, 0]),
      rotationTrack('RearDoorR', 'y', [0, 0.9, 2.1, 3.0], [0, 1.7, 1.7, 0]),
      spinTrack('FrontWheelL', 'x', 3.0, 2),
      spinTrack('FrontWheelR', 'x', 3.0, 2),
    ]),
  ];
}

function buildConcreteMixer(root: T.Group, p: Finish, detail: boolean) {
  const truck = group(root, 'MixerTruck');
  shell(truck, [0, 0.38, 0], [1.18, 0.24, 3.22], p.dark, 0.24);
  shell(truck, [0, 0.98, 1.12], [1.24, 1.02, 0.96], p.primary, 0.28);
  rbox(truck, p, [0, 1.16, 1.62], [1.02, 0.4, 0.05], p.optic);
  rbox(truck, p, [0, 0.68, 1.62], [0.66, 0.28, 0.05], p.inset);
  rbox(truck, p, [0, 0.4, 1.66], [1.3, 0.16, 0.14], p.edge);
  for (const s of [-1, 1]) {
    light(truck, [s * 0.46, 0.64, 1.64], [0.18, 0.12, 0.06], p);
    rbox(truck, p, [s * 0.64, 1.18, 1.12], [0.04, 0.32, 0.46], p.optic);
    strut(truck, [s * 0.46, 0.5, 0.36], [s * 0.38, 1.18, 0.36], 0.045, p.dark, 8);
    strut(truck, [s * 0.46, 0.5, -1.16], [s * 0.34, 1.46, -1.16], 0.045, p.dark, 8);
  }
  cyl(truck, p, [0, 1.38, 0.44], 0.22, 0.22, 0.96, p.alloy, [0, 0, Math.PI / 2], 12);
  const drumPivot = group(truck, 'MixerDrumPivot', [0, 1.22, -0.34]);
  drumPivot.rotation.x = -0.34;
  const drum = group(drumPivot, 'MixerDrum', [0, 0, 0]);
  cyl(drum, p, [0, 0, 0.46], 0.54, 0.34, 0.62, p.accent, [Math.PI / 2, 0, 0], 14);
  cyl(drum, p, [0, 0, -0.1], 0.56, 0.54, 0.54, p.primary, [Math.PI / 2, 0, 0], 14);
  cyl(drum, p, [0, 0, -0.68], 0.3, 0.56, 0.68, p.accent, [Math.PI / 2, 0, 0], 14);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    rbox(drum, p, [Math.cos(a) * 0.56, Math.sin(a) * 0.56, -0.1], [0.06, 0.08, 0.52], p.stencil).rotation.z = a;
  }
  const chute = group(truck, 'DischargeChute', [0, 1.18, -1.36]);
  shell(chute, [0, -0.16, -0.32], [0.32, 0.14, 0.68], p.edge, 0.28).rotation.x = 0.42;
  axleWheels(truck, 0.62, 0.32, 1.1, 0.2, p, detail, p.alloy, 6, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(truck, 0.62, 0.32, -0.58, 0.22, p, detail, p.alloy, 6);
  axleWheels(truck, 0.62, 0.32, -1.24, 0.22, p, detail, p.alloy, 6);
  if (detail) {
    cyl(truck, p, [-0.56, 1.38, 0.56], 0.045, 0.045, 0.88, p.alloy, [0, 0, 0], 8);
    ring(drum, [0, 0, 0.14], 0.58, 0.035, 0.07, p.edge).rotation.x = Math.PI / 2;
    if (p.hd) fastener(truck, [0, 1.52, 1.12], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Mix concrete', 2.8, [
      spinTrack('MixerDrum', 'z', 2.8, 2),
      sway('DischargeChute', 'y', 2.8, -0.55, 0.55),
    ]),
  ];
}

function buildTrackedBulldozer(root: T.Group, p: Finish, detail: boolean) {
  const dozer = group(root, 'Bulldozer');
  for (const s of [-1, 1]) {
    shell(dozer, [s * 0.72, 0.28, -0.06], [0.42, 0.56, 2.08], p.tire, 0.52);
    shell(dozer, [s * 0.72, 0.36, -0.06], [0.34, 0.34, 1.72], p.dark, 0.44);
    cyl(dozer, p, [s * 0.74, 0.62, -0.06], 0.22, 0.22, 0.44, p.accent, [0, 0, Math.PI / 2], 12);
    for (const z of [-0.74, 0.62]) {
      cyl(dozer, p, [s * 0.74, 0.24, z], 0.2, 0.2, 0.44, p.edge, [0, 0, Math.PI / 2], 10);
    }
    strut(dozer, [s * 0.62, 0.46, 0.18], [s * 0.68, 0.36, 1.44], 0.06, p.dark, 8);
  }
  shell(dozer, [0, 0.82, 0.26], [1.06, 0.68, 1.54], p.primary, 0.28);
  rbox(dozer, p, [0, 0.84, 1.05], [0.76, 0.48, 0.06], p.inset);
  shell(dozer, [0, 1.44, -0.44], [1.04, 0.78, 0.94], p.primary, 0.26);
  shell(dozer, [0, 1.88, -0.44], [1.12, 0.1, 1.04], p.accent, 0.34);
  rbox(dozer, p, [0, 1.5, 0.05], [0.84, 0.44, 0.05], p.optic);
  for (const s of [-1, 1]) {
    rbox(dozer, p, [s * 0.54, 1.5, -0.44], [0.04, 0.42, 0.66], p.optic);
    cyl(dozer, p, [s * 0.34, 1.46, 0.68], 0.055, 0.06, 0.64, p.dark, [0, 0, 0], 10);
  }
  const blade = group(dozer, 'DozerBlade', [0, 0.42, 1.26]);
  shell(blade, [0, 0.1, 0.14], [2.04, 0.74, 0.18], p.primary, 0.2);
  rbox(blade, p, [0, -0.26, 0.2], [2.08, 0.09, 0.14], p.edge);
  for (const s of [-1, 1]) rbox(blade, p, [s * 0.96, 0.1, 0.24], [0.1, 0.72, 0.2], p.accent);
  const ripper = group(dozer, 'RearRipper', [0, 0.62, -1.04]);
  rbox(ripper, p, [0, 0, -0.18], [0.92, 0.22, 0.26], p.dark);
  for (const x of [-0.26, 0.26]) {
    strut(ripper, [x, -0.04, -0.24], [x, -0.46, -0.34], 0.055, p.accent, 8);
    cone(ripper, p, [x, -0.5, -0.28], 0.06, 0.16, p.alloy, [1.2, 0, 0], 6);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        rbox(dozer, p, [s * 0.72, 0.58, -0.84 + i * 0.32], [0.44, 0.04, 0.08], p.edge);
      }
      light(dozer, [s * 0.4, 1.78, 0.06], [0.14, 0.1, 0.07], p);
    }
    if (p.hd) fastener(blade, [0, 0.12, 0.25], p, 0.032);
  }
  root.animations = [
    new T.AnimationClip('Earthwork', 3.0, [
      rotationTrack('DozerBlade', 'x', [0, 0.8, 2.2, 3.0], [0, -0.32, 0.28, 0]),
      rotationTrack('RearRipper', 'x', [0, 0.8, 2.2, 3.0], [0, 0.45, -0.2, 0]),
    ]),
  ];
}

function buildStreetSweeper(root: T.Group, p: Finish, detail: boolean) {
  const bristle = tone(p, 'Brush bristles', '#d4a238', 0.82, 0.04);
  const sw = group(root, 'StreetSweeper');
  shell(sw, [0, 0.34, 0], [1.14, 0.2, 2.48], p.dark, 0.28);
  shell(sw, [0, 0.96, 0.76], [1.16, 1.04, 0.88], p.primary, 0.34);
  rbox(sw, p, [0, 1.12, 1.22], [0.96, 0.5, 0.05], p.optic);
  shell(sw, [0, 0.96, -0.46], [1.2, 1.02, 1.44], p.primary, 0.28);
  shell(sw, [0, 1.5, -0.46], [1.06, 0.12, 1.28], p.accent, 0.36);
  for (const s of [-1, 1]) {
    rbox(sw, p, [s * 0.62, 0.96, -0.46], [0.04, 0.16, 1.32], p.accent);
    rbox(sw, p, [s * 0.6, 1.14, 0.78], [0.04, 0.44, 0.56], p.optic);
    light(sw, [s * 0.4, 0.58, 1.22], [0.16, 0.11, 0.06], p);
    strut(sw, [s * 0.36, 0.36, 0.84], [s * 0.56, 0.26, 1.32], 0.04, p.edge, 8);
    const brush = group(sw, s > 0 ? 'BrushL' : 'BrushR', [s * 0.56, 0.16, 1.34]);
    cyl(brush, p, [0, 0.06, 0], 0.22, 0.22, 0.08, p.dark, [0, 0, 0], 12);
    cyl(brush, p, [0, -0.05, 0], 0.24, 0.32, 0.16, bristle, [0, 0, 0], 12);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      rbox(brush, p, [Math.cos(a) * 0.14, 0.11, Math.sin(a) * 0.14], [0.12, 0.03, 0.04], p.accent).rotation.y = -a;
    }
  }
  const beacon = group(sw, 'RoofBeacon', [0, 1.46, 0.78]);
  cyl(beacon, p, [0, 0.04, 0], 0.09, 0.11, 0.08, p.dark, [0, 0, 0], 10);
  dome(beacon, p, [0, 0.13, 0], [0.085, 0.1, 0.085], p.accent, 10);
  axleWheels(sw, 0.58, 0.26, 0.68, 0.16, p, detail, p.alloy, 5);
  axleWheels(sw, 0.58, 0.26, -0.76, 0.18, p, detail, p.alloy, 5);
  if (detail) {
    cyl(sw, p, [0, 0.86, -1.24], 0.24, 0.24, 0.18, p.edge, [Math.PI / 2, 0, 0], 10);
    for (const s of [-1, 1]) {
      rbox(sw, p, [s * 0.62, 1.32, -0.46], [0.03, 0.14, 0.94], p.stencil);
    }
    if (p.hd) fastener(beacon, [0, 0.23, 0], p, 0.02);
  }
  root.animations = [
    new T.AnimationClip('Curb sweep', 2.4, [
      spinTrack('BrushL', 'y', 2.4, 4),
      spinTrack('BrushR', 'y', 2.4, -4),
      spinTrack('RoofBeacon', 'y', 2.4, 3),
    ]),
  ];
}

function buildAlpineSnowplow(root: T.Group, p: Finish, detail: boolean) {
  const truck = group(root, 'SnowplowTruck');
  shell(truck, [0, 0.42, -0.04], [1.22, 0.24, 3.04], p.dark, 0.26);
  shell(truck, [0, 1.02, 0.96], [1.26, 0.96, 1.04], p.primary, 0.28);
  rbox(truck, p, [0, 1.18, 1.5], [1.04, 0.38, 0.05], p.optic);
  rbox(truck, p, [0, 0.72, 1.5], [0.68, 0.28, 0.05], p.inset);
  lightbar(truck, p, [0, 1.48, 0.98], 0.92, p.accent, p.accent);
  shell(truck, [0, 0.96, -0.62], [1.24, 0.78, 1.72], p.edge, 0.26);
  shell(truck, [0, 1.4, -0.62], [1.14, 0.24, 1.56], p.stencil, 0.34);
  for (const s of [-1, 1]) {
    rbox(truck, p, [s * 0.65, 1.18, 0.96], [0.04, 0.32, 0.56], p.optic);
    light(truck, [s * 0.48, 0.72, 1.52], [0.18, 0.12, 0.06], p);
    strut(truck, [s * 0.44, 0.48, 1.24], [s * 0.44, 0.44, 1.82], 0.05, p.alloy, 8);
  }
  const plow = group(truck, 'VPlowBlade', [0, 0.44, 1.64]);
  for (const s of [-1, 1]) {
    const wing = group(plow, '', [0, 0, 0]);
    wing.rotation.y = -s * 0.36;
    shell(wing, [s * 0.5, 0.08, 0.08], [1.04, 0.62, 0.14], p.accent, 0.2);
    rbox(wing, p, [s * 0.5, -0.24, 0.12], [1.04, 0.08, 0.12], p.dark);
  }
  const spreader = group(truck, 'SaltSpreader', [0, 0.46, -1.58]);
  cyl(spreader, p, [0, 0.16, 0], 0.12, 0.08, 0.28, p.dark, [0, 0, 0], 10);
  cyl(spreader, p, [0, 0, 0], 0.26, 0.26, 0.06, p.accent, [0, 0, 0], 12);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    rbox(spreader, p, [Math.cos(a) * 0.14, 0.04, Math.sin(a) * 0.14], [0.22, 0.03, 0.04], p.alloy).rotation.y = -a;
  }
  axleWheels(truck, 0.64, 0.34, 0.92, 0.22, p, detail, p.accent, 6);
  axleWheels(truck, 0.64, 0.34, -0.86, 0.24, p, detail, p.accent, 6);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(truck, p, [s * 0.64, 0.92, -0.62], [0.04, 0.14, 1.52], p.accent);
      cyl(truck, p, [s * 0.52, 1.38, 0.44], 0.042, 0.048, 0.72, p.alloy, [0, 0, 0], 8);
    }
    if (p.hd) fastener(plow, [0, 0.4, 0.18], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Clear pass', 3.0, [
      sway('VPlowBlade', 'y', 3.0, -0.32, 0.32),
      spinTrack('SaltSpreader', 'y', 3.0, 5),
    ]),
  ];
}

function buildPoptopCamper(root: T.Group, p: Finish, detail: boolean) {
  const van = group(root, 'CamperVan');
  shell(van, [0, 0.34, 0], [1.18, 0.18, 2.74], p.dark, 0.28);
  shell(van, [0, 0.72, 0], [1.26, 0.62, 2.82], p.primary, 0.36);
  shell(van, [0, 1.24, -0.04], [1.2, 0.48, 2.7], p.accent, 0.36);
  rbox(van, p, [0, 1.24, 1.33], [0.98, 0.36, 0.05], p.optic);
  rbox(van, p, [0, 1.24, -1.41], [0.92, 0.32, 0.05], p.optic);
  cyl(van, p, [0, 0.72, 1.44], 0.24, 0.24, 0.14, p.tire, [Math.PI / 2, 0, 0], 12);
  cyl(van, p, [0, 0.72, 1.48], 0.18, 0.18, 0.1, p.accent, [Math.PI / 2, 0, 0], 12);
  for (const s of [-1, 1]) {
    light(van, [s * 0.44, 0.74, 1.43], [0.16, 0.14, 0.06], p);
    for (const z of [0.76, -0.02, -0.8]) {
      rbox(van, p, [s * 0.62, 1.24, z], [0.04, 0.32, 0.56], p.optic);
    }
  }
  const roofBase: Point = [0, 1.48, -0.08];
  const poptop = group(van, 'PopTopRoof', roofBase);
  shell(poptop, [0, 0.08, 0], [1.14, 0.12, 2.18], p.stencil, 0.38);
  shell(poptop, [0, -0.04, 0], [1.02, 0.14, 1.98], p.accent, 0.3);
  const surf = group(van, 'Surfboard', [0.36, 1.62, -0.08]);
  shell(surf, [0, 0, 0], [0.34, 0.06, 1.64], p.primary, 0.7);
  rbox(surf, p, [0, 0.036, 0], [0.06, 0.02, 1.36], p.stencil);
  axleWheels(van, 0.6, 0.26, 0.86, 0.16, p, detail, p.stencil, 5, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(van, 0.6, 0.26, -0.88, 0.16, p, detail, p.stencil, 5);
  if (detail) {
    rbox(van, p, [0, 0.42, 1.46], [1.26, 0.12, 0.1], p.alloy);
    rbox(van, p, [0, 0.42, -1.46], [1.26, 0.12, 0.1], p.alloy);
    rbox(van, p, [0.64, 1.44, -0.06], [0.08, 0.08, 1.96], p.edge);
    if (p.hd) fastener(van, [0, 0.72, 1.54], p, 0.025).rotation.x = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Camp setup', 3.2, [
      rotationTrack('PopTopRoof', 'x', [0, 1.0, 2.2, 3.2], [0, -0.34, -0.34, 0]),
      spinTrack('FrontWheelL', 'x', 3.2, 2),
      spinTrack('FrontWheelR', 'x', 3.2, 2),
    ]),
  ];
}

function buildOpenWheelKart(root: T.Group, p: Finish, detail: boolean) {
  const kart = group(root, 'RacingKart');
  shell(kart, [0, 0.2, 0], [0.68, 0.12, 1.72], p.dark, 0.36);
  shell(kart, [0, 0.32, 0.74], [0.56, 0.22, 0.56], p.primary, 0.5);
  shell(kart, [0, 0.24, 1.06], [1.14, 0.09, 0.26], p.accent, 0.36);
  shell(kart, [0, 0.46, -0.14], [0.46, 0.36, 0.48], p.tire, 0.4);
  for (const s of [-1, 1]) {
    shell(kart, [s * 0.48, 0.28, -0.04], [0.28, 0.24, 0.86], p.primary, 0.42);
    rbox(kart, p, [s * 0.64, 0.3, -0.04], [0.04, 0.08, 0.68], p.accent);
    strut(kart, [s * 0.22, 0.46, -0.36], [s * 0.16, 0.78, -0.38], 0.028, p.dark, 8);
    strut(kart, [s * 0.26, 0.22, -0.78], [s * 0.36, 0.72, -0.84], 0.026, p.dark, 8);
  }
  strut(kart, [-0.16, 0.78, -0.38], [0.16, 0.78, -0.38], 0.028, p.dark, 8);
  shell(kart, [0, 0.74, -0.86], [1.08, 0.08, 0.3], p.accent, 0.32);
  for (const s of [-1, 1]) rbox(kart, p, [s * 0.56, 0.72, -0.86], [0.04, 0.22, 0.34], p.primary);
  cyl(kart, p, [0.24, 0.38, -0.58], 0.12, 0.14, 0.26, p.alloy, [0, 0, 0], 10);
  const steer = group(kart, 'SteeringWheel', [0, 0.56, 0.34]);
  strut(steer, [0, -0.22, 0.22], [0, 0, 0], 0.024, p.alloy, 8);
  torus(steer, p, [0, 0, 0], 0.14, 0.026, p.tire, [0.55, 0, 0]);
  rbox(steer, p, [0, 0, 0], [0.24, 0.035, 0.03], p.accent).rotation.x = 0.55;
  axleWheels(kart, 0.58, 0.2, 0.66, 0.18, p, detail, p.accent, 5, ['FrontWheelL', 'FrontWheelR']);
  axleWheels(kart, 0.62, 0.22, -0.64, 0.24, p, detail, p.accent, 6, ['RearWheelL', 'RearWheelR']);
  if (detail) {
    cyl(kart, p, [0.36, 0.36, -0.78], 0.045, 0.055, 0.34, p.edge, [Math.PI / 2, 0, 0], 10);
    rbox(kart, p, [0, 0.44, 0.74], [0.24, 0.03, 0.28], p.stencil);
    if (p.hd) fastener(kart, [0, 0.79, -0.86], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Apex lap', 2.4, [
      sway('SteeringWheel', 'z', 2.4, -0.55, 0.55),
      spinTrack('FrontWheelL', 'x', 2.4, 4),
      spinTrack('FrontWheelR', 'x', 2.4, 4),
      spinTrack('RearWheelL', 'x', 2.4, 4),
      spinTrack('RearWheelR', 'x', 2.4, 4),
    ]),
  ];
}

export const vehiclesRoadB: readonly PackEntrySpec[] = [
  {
    id: 'emergency-ambulance',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('RearDoorL', 'Left rear door', 'rotate', 'y', [-105, 0], 'Swings the left rear stretcher door open'),
      rp('RearDoorR', 'Right rear door', 'rotate', 'y', [0, 105], 'Swings the right rear stretcher door open'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left ambulance wheel'),
    ],
    build: buildEmergencyAmbulance,
  },
  {
    id: 'concrete-mixer-truck',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('MixerDrum', 'Mixing drum', 'rotate', 'z', [0, 360], 'Rotates the ribbed tilted concrete mixing drum'),
      rp('DischargeChute', 'Discharge chute', 'rotate', 'y', [-45, 45], 'Swings the rear concrete pouring chute'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left mixer truck wheel'),
    ],
    build: buildConcreteMixer,
  },
  {
    id: 'tracked-bulldozer',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('DozerBlade', 'Front dozer blade', 'rotate', 'x', [-22, 22], 'Tilts and lifts the steel earthmoving blade'),
      rp('RearRipper', 'Rear ripper claw', 'rotate', 'x', [-15, 35], 'Lowers and raises the rear steel ripper shank'),
    ],
    build: buildTrackedBulldozer,
  },
  {
    id: 'urban-street-sweeper',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('BrushL', 'Left gutter brush', 'rotate', 'y', [0, 360], 'Spins the left rotary street-sweeping broom'),
      rp('BrushR', 'Right gutter brush', 'rotate', 'y', [0, 360], 'Spins the right rotary street-sweeping broom'),
      rp('RoofBeacon', 'Warning beacon', 'rotate', 'y', [0, 360], 'Rotates the overhead amber warning beacon'),
    ],
    build: buildStreetSweeper,
  },
  {
    id: 'alpine-snowplow',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('VPlowBlade', 'V-plow blade', 'rotate', 'y', [-25, 25], 'Angles the front alpine V-plow blade left and right'),
      rp('SaltSpreader', 'Salt spreader disc', 'rotate', 'y', [0, 360], 'Spins the rear rotary road-salt spreader disc'),
    ],
    build: buildAlpineSnowplow,
  },
  {
    id: 'poptop-camper-van',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('PopTopRoof', 'Pop-top roof', 'rotate', 'x', [-24, 0], 'Lifts the hinged canvas pop-top camper roof'),
      rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left camper wheel'),
    ],
    detachableParts: [det('Surfboard', 'Roof surfboard', 'Removable longboard strapped to the camper roof')],
    build: buildPoptopCamper,
  },
  {
    id: 'open-wheel-kart',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('SteeringWheel', 'Steering wheel', 'rotate', 'z', [-35, 35], 'Turns the motorsport steering wheel'),
      rp('FrontWheelL', 'Front-left slick', 'rotate', 'x', [0, 360], 'Spins the front-left racing slick'),
      rp('RearWheelL', 'Rear-left slick', 'rotate', 'x', [0, 360], 'Spins the rear-left drive slick'),
    ],
    build: buildOpenWheelKart,
  },
];
