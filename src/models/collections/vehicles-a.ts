import * as T from 'three';
import { box, group, light, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../parts';
import type { Finish, Point } from '../parts';
import { fastener } from '../hd-detail';
import { airfoil } from '../hd-geometry';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';

interface VehicleAssetDef {
  id: string; code: string; category: 'Object'; browseCategory: BrowseCategory;
  name: string; primary: string; accent: string; description: string; physicsBody: 'dynamic';
  riggedParts: readonly RiggedPartSpec[]; detachableParts: readonly DetachablePartSpec[];
  build: (root: T.Group, p: Finish, detail: boolean) => void;
}

const rp = (name: string, label: string, type: 'rotate' | 'slide', axis: Axis, range: [number, number], describe: string): RiggedPartSpec =>
  ({ name, label, type, axis, range, describe });

const asset = (
  id: string, code: string, name: string, primary: string, accent: string, description: string,
  riggedParts: readonly RiggedPartSpec[], detachableParts: readonly DetachablePartSpec[],
  build: (root: T.Group, p: Finish, detail: boolean) => void,
): VehicleAssetDef => ({ id, code, category: 'Object', browseCategory: 'vehicle', name, primary, accent, description, physicsBody: 'dynamic', riggedParts, detachableParts, build });

function slideTrack(node: string, axis: Axis, base: Point, times: number[], offsets: number[]) {
  const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  return new T.VectorKeyframeTrack(node + '.position', times, offsets.flatMap(off => {
    const pt: Point = [base[0], base[1], base[2]];
    pt[idx] += off;
    return pt;
  }));
}

const dome = (parent: T.Object3D, at: Point, scale: Point, mat: T.Material, hd: boolean) => {
  const part = mesh(parent, new T.SphereGeometry(1, hd ? 24 : 10, hd ? 16 : 8), mat, at);
  part.scale.set(...scale);
  return part;
};

const torus = (parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean) =>
  mesh(parent, new T.TorusGeometry(r, t, hd ? 16 : 8, hd ? 32 : 14), mat, at);

function wheel(parent: T.Object3D, name: string, at: Point, r: number, w: number, p: Finish, detail: boolean, rim: T.Material = p.alloy, spokes = 6) {
  const hub = group(parent, name, at);
  const axle = group(hub, '');
  axle.rotation.z = Math.PI / 2;
  tube(axle, [0, 0, 0], r, r, w, p.tire, 14);
  tube(axle, [0, 0, 0], r * 0.64, r * 0.64, w * 1.06, rim, 12);
  tube(axle, [0, 0, 0], r * 0.26, r * 0.26, w * 1.16, p.dark, 10);
  if (detail) {
    for (let i = 0; i < spokes; i++) {
      const a = (i * Math.PI * 2) / spokes;
      for (const s of [-1, 1]) box(axle, [Math.sin(a) * r * 0.42, s * w * 0.54, Math.cos(a) * r * 0.42], [r * 0.12, 0.018, r * 0.34], p.edge).rotation.y = a;
    }
    if (p.hd) fastener(axle, [0, w * 0.58, 0], p, Math.min(0.03, r * 0.12));
  }
  return hub;
}

const wheelPair = (parent: T.Object3D, x: number, r: number, z: number, w: number, p: Finish, detail: boolean, rim: T.Material, spokes: number, names: readonly [string, string] = ['', '']) => {
  wheel(parent, names[0], [x, r, z], r, w, p, detail, rim, spokes);
  wheel(parent, names[1], [-x, r, z], r, w, p, detail, rim, spokes);
};

function rotorBlades(parent: T.Object3D, count: number, len: number, width: number, mat: T.Material, tipMat: T.Material, p: Finish) {
  for (let i = 0; i < count; i++) {
    const holder = group(parent, '');
    holder.rotation.y = (i * Math.PI * 2) / count;
    if (p.hd) {
      mesh(holder, airfoil(), mat, [0, 0, 0]).scale.set(len / 0.56, 1.1, width / 0.09);
      box(holder, [len * 0.9, 0.024, -len * 0.1], [len * 0.14, 0.018, width * 0.72], tipMat);
    } else {
      box(holder, [len * 0.5, 0, 0], [len, 0.022, width], mat);
      box(holder, [len * 0.92, 0.004, 0], [len * 0.14, 0.024, width * 0.92], tipMat);
    }
  }
}

function buildVintageBiplane(root: T.Group, p: Finish, detail: boolean) {
  const af = group(root, 'Airframe');
  shell(af, [0, 0.68, 0.24], [0.56, 0.52, 1.46], p.primary, 0.42);
  shell(af, [0, 0.66, -0.56], [0.42, 0.42, 0.92], p.primary, 0.46);
  shell(af, [0, 0.66, -1.04], [0.22, 0.30, 0.42], p.primary, 0.45);
  tube(af, [0, 0.68, 1.02], 0.25, 0.29, 0.24, p.accent, 16).rotation.x = Math.PI / 2;
  tube(af, [0, 0.68, 1.12], 0.19, 0.19, 0.08, p.dark, 14).rotation.x = Math.PI / 2;
  shell(af, [0, 0.92, -0.14], [0.38, 0.12, 0.48], p.inset, 0.45);
  box(af, [0, 1.04, 0.08], [0.34, 0.14, 0.04], p.optic).rotation.x = -0.42;
  shell(af, [0, 0.98, -0.44], [0.20, 0.14, 0.24], p.accent, 0.5);
  shell(af, [0, 0.50, 0.28], [2.76, 0.08, 0.58], p.primary, 0.34);
  shell(af, [0, 1.24, 0.36], [3.08, 0.08, 0.64], p.primary, 0.34);
  for (const s of [-1, 1]) {
    shell(af, [s * 1.14, 1.255, 0.36], [0.44, 0.068, 0.65], p.accent, 0.32);
    shell(af, [s * 0.98, 0.515, 0.28], [0.36, 0.068, 0.59], p.accent, 0.32);
    strut(af, [s * 0.94, 0.52, 0.14], [s * 1.02, 1.22, 0.22], 0.026, p.edge, 10);
    strut(af, [s * 0.94, 0.52, 0.46], [s * 1.02, 1.22, 0.54], 0.026, p.edge, 10);
    strut(af, [s * 0.26, 0.88, 0.26], [s * 0.38, 1.22, 0.36], 0.024, p.alloy, 10);
    strut(af, [s * 0.24, 0.44, 0.42], [s * 0.42, 0.22, 0.50], 0.026, p.dark, 10);
  }
  wheelPair(af, 0.44, 0.22, 0.50, 0.09, p, detail, p.accent, 4);
  strut(af, [-0.42, 0.22, 0.50], [0.42, 0.22, 0.50], 0.024, p.alloy, 10);
  strut(af, [0, 0.52, -1.04], [0, 0.04, -1.16], 0.024, p.dark, 8);
  shell(af, [0, 0.74, -1.06], [1.08, 0.065, 0.36], p.primary, 0.42);
  shell(af, [0, 0.92, -1.00], [0.07, 0.34, 0.32], p.primary, 0.35);
  const rudder = group(af, 'Rudder', [0, 0.92, -1.14]);
  shell(rudder, [0, 0.02, -0.14], [0.065, 0.44, 0.26], p.accent, 0.38);
  const prop = group(af, 'Propeller', [0, 0.68, 1.18]);
  dome(prop, [0, 0, 0.06], [0.11, 0.11, 0.14], p.alloy, p.hd);
  for (const s of [-1, 1]) {
    shell(prop, [0, s * 0.26, 0.01], [0.10, 0.46, 0.036], p.dark, 0.48).rotation.y = s * 0.26;
    box(prop, [0, s * 0.46, 0.01], [0.085, 0.065, 0.050], p.accent).rotation.y = s * 0.26;
  }
  if (detail) {
    for (const s of [-1, 1]) {
      box(af, [s * 0.285, 0.68, 0.12], [0.02, 0.08, 1.32], p.accent);
      strut(af, [s * 0.94, 0.54, 0.44], [s * 0.38, 1.20, 0.44], 0.01, p.alloy, 6);
      strut(af, [s * 0.36, 0.54, 0.44], [s * 1.00, 1.20, 0.44], 0.01, p.alloy, 6);
    }
    if (p.hd) for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      fastener(af, [Math.cos(a) * 0.22, 0.68 + Math.sin(a) * 0.22, 1.14], p, 0.022).rotation.x = Math.PI / 2;
    }
  }
  root.animations = [
    new T.AnimationClip('Cruise', 2.4, [spinTrack('Propeller', 'z', 2.4, 4), rotationTrack('Rudder', 'y', [0, 0.6, 1.8, 2.4], [0, 0.46, -0.46, 0])]),
    new T.AnimationClip('Propeller spin', 1.6, [spinTrack('Propeller', 'z', 1.6, 3)]),
  ];
}

function buildSteamLocomotive(root: T.Group, p: Finish, detail: boolean) {
  const f = group(root, 'Chassis');
  shell(f, [0, 0.46, 0.04], [0.98, 0.26, 2.74], p.dark, 0.25);
  tube(f, [0, 0.96, 0.28], 0.41, 0.41, 1.68, p.primary, 16).rotation.x = Math.PI / 2;
  tube(f, [0, 0.96, 1.18], 0.43, 0.43, 0.32, p.dark, 16).rotation.x = Math.PI / 2;
  dome(f, [0, 0.96, 1.34], [0.36, 0.36, 0.10], p.edge, p.hd);
  light(f, [0, 1.16, 1.38], [0.22, 0.20, 0.14], p);
  tube(f, [0, 1.62, 1.14], 0.19, 0.12, 0.56, p.dark, 14);
  ring(f, [0, 1.88, 1.14], 0.21, 0.045, 0.08, p.accent);
  dome(f, [0, 1.38, 0.02], [0.22, 0.24, 0.22], p.accent, p.hd);
  shell(f, [0, 1.06, -0.94], [1.14, 1.06, 0.88], p.primary, 0.22);
  shell(f, [0, 1.64, -0.94], [1.28, 0.12, 1.04], p.dark, 0.36);
  box(f, [0, 1.24, -0.49], [0.84, 0.32, 0.04], p.optic);
  for (const s of [-1, 1]) {
    box(f, [s * 0.575, 1.24, -0.92], [0.03, 0.34, 0.52], p.optic);
    shell(f, [s * 0.56, 0.44, 0.96], [0.22, 0.24, 0.48], p.edge, 0.35);
    box(f, [s * 0.56, 0.62, 0.18], [0.19, 0.06, 1.62], p.accent);
    shell(f, [s * 0.24, 0.24, 1.46], [0.54, 0.26, 0.36], p.dark, 0.42).rotation.y = s * 0.42;
    strut(f, [s * 0.12, 1.36, 0.56], [s * 0.10, 1.56, 0.56], 0.022, p.dark, 8);
  }
  wheelPair(f, 0.54, 0.40, -0.06, 0.12, p, detail, p.accent, 8, ['DriveWheelL', 'DriveWheelR']);
  wheelPair(f, 0.54, 0.40, -0.92, 0.12, p, detail, p.accent, 8, ['RearDriveL', 'RearDriveR']);
  wheelPair(f, 0.50, 0.26, 0.96, 0.10, p, detail, p.edge, 6, ['LeadWheelL', 'LeadWheelR']);
  const bell = group(f, 'BrassBell', [0, 1.54, 0.56]);
  tube(bell, [0, -0.09, 0], 0.06, 0.13, 0.16, p.accent, 14);
  dome(bell, [0, -0.17, 0], [0.04, 0.04, 0.04], p.alloy, p.hd);
  if (detail) {
    for (const z of [-0.28, 0.24, 0.76]) tube(f, [0, 0.96, z], 0.422, 0.422, 0.045, p.accent, 16).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) {
      strut(f, [s * 0.62, 0.40, -0.92], [s * 0.62, 0.40, 0.92], 0.028, p.alloy, 10);
      strut(f, [s * 0.44, 1.18, -0.44], [s * 0.44, 1.18, 1.06], 0.018, p.alloy, 8);
      if (p.hd) fastener(f, [s * 0.60, 0.44, 1.18], p, 0.028);
    }
  }
  root.animations = [
    new T.AnimationClip('Steam roll', 2.8, [
      spinTrack('DriveWheelL', 'x', 2.8, 2), spinTrack('DriveWheelR', 'x', 2.8, 2),
      spinTrack('RearDriveL', 'x', 2.8, 2), spinTrack('RearDriveR', 'x', 2.8, 2),
      spinTrack('LeadWheelL', 'x', 2.8, 3), spinTrack('LeadWheelR', 'x', 2.8, 3),
      rotationTrack('BrassBell', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.4, -0.4, 0.32, 0]),
    ]),
    new T.AnimationClip('Ring bell', 1.6, [rotationTrack('BrassBell', 'z', [0, 0.4, 0.8, 1.2, 1.6], [0, 0.42, -0.42, 0.36, 0])]),
  ];
}

function buildHarborTugboat(root: T.Group, p: Finish, detail: boolean) {
  const hull = group(root, 'Hull');
  shell(hull, [0, 0.16, -0.02], [1.14, 0.32, 2.34], p.dark, 0.56);
  shell(hull, [0, 0.42, 0.02], [1.34, 0.30, 2.66], p.primary, 0.56);
  shell(hull, [0, 0.58, 0.82], [1.06, 0.24, 0.96], p.primary, 0.64);
  shell(hull, [0, 0.57, -0.18], [1.18, 0.08, 2.12], p.accent, 0.52);
  torus(hull, [0, 0.54, 1.32], 0.24, 0.09, p.tire, p.hd).rotation.x = Math.PI / 2;
  shell(hull, [0, 0.90, 0.32], [0.92, 0.64, 0.96], p.accent, 0.34);
  shell(hull, [0, 1.24, 0.32], [1.02, 0.10, 1.06], p.primary, 0.38);
  box(hull, [0, 1.02, 0.805], [0.70, 0.22, 0.04], p.optic);
  for (const s of [-1, 1]) {
    shell(hull, [s * 0.68, 0.44, 0.04], [0.10, 0.14, 2.10], p.tire, 0.45);
    box(hull, [s * 0.465, 1.02, 0.42], [0.04, 0.22, 0.52], p.optic);
  }
  tube(hull, [0, 1.18, -0.44], 0.20, 0.24, 0.92, p.dark, 14);
  tube(hull, [0, 1.34, -0.44], 0.22, 0.23, 0.22, p.accent, 14);
  shell(hull, [0, 0.72, -0.96], [0.56, 0.24, 0.34], p.edge, 0.35);
  tube(hull, [0, 1.44, 0.34], 0.045, 0.055, 0.34, p.alloy, 10);
  const radar = group(hull, 'RadarBar', [0, 1.62, 0.34]);
  shell(radar, [0, 0.03, 0], [0.58, 0.07, 0.11], p.stencil, 0.38);
  box(radar, [0, 0.03, 0.06], [0.46, 0.04, 0.02], p.accent);
  const rudder = group(hull, 'SternRudder', [0, 0.24, -1.24]);
  tube(rudder, [0, 0.08, 0], 0.035, 0.035, 0.26, p.alloy, 10);
  shell(rudder, [0, -0.02, -0.14], [0.07, 0.32, 0.28], p.accent, 0.32);
  const lifeRing = group(hull, 'LifeRing', [0.50, 0.84, 0.06]);
  torus(lifeRing, [0, 0, 0], 0.14, 0.045, p.accent, p.hd).rotation.y = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    box(lifeRing, [0, Math.sin(a) * 0.14, Math.cos(a) * 0.14], [0.10, 0.05, 0.05], p.stencil);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [-0.52, 0.04, 0.60]) torus(hull, [s * 0.72, 0.44, z], 0.11, 0.04, p.tire, p.hd).rotation.y = Math.PI / 2;
      tube(hull, [s * 0.34, 0.70, 0.96], 0.045, 0.05, 0.16, p.alloy, 10);
      if (p.hd) fastener(hull, [s * 0.34, 0.79, 0.96], p, 0.024);
    }
    light(hull, [0, 1.32, 0.78], [0.18, 0.10, 0.08], p);
  }
  root.animations = [
    new T.AnimationClip('Harbor patrol', 3.2, [spinTrack('RadarBar', 'y', 3.2, 2), rotationTrack('SternRudder', 'y', [0, 0.8, 2.4, 3.2], [0, 0.56, -0.56, 0])]),
    new T.AnimationClip('Radar sweep', 2.0, [spinTrack('RadarBar', 'y', 2.0, 2)]),
  ];
}

function buildRescueHelicopter(root: T.Group, p: Finish, detail: boolean) {
  const af = group(root, 'Airframe');
  shell(af, [0, 0.74, 0.06], [1.02, 0.74, 1.62], p.primary, 0.46);
  dome(af, [0, 0.68, 0.86], [0.49, 0.35, 0.58], p.primary, p.hd);
  dome(af, [0, 0.80, 0.92], [0.45, 0.25, 0.48], p.optic, p.hd);
  shell(af, [0, 0.72, -0.22], [0.98, 0.54, 0.62], p.inset, 0.22);
  shell(af, [0, 1.18, -0.02], [0.64, 0.24, 1.08], p.accent, 0.44);
  for (const s of [-1, 1]) {
    tube(af, [s * 0.20, 1.18, -0.58], 0.08, 0.09, 0.22, p.dark, 12).rotation.x = Math.PI / 2;
    shell(af, [s * 0.56, 0.05, 0.08], [0.10, 0.10, 1.88], p.dark, 0.55);
    strut(af, [s * 0.56, 0.06, 0.98], [s * 0.56, 0.18, 1.16], 0.042, p.dark, 10);
    for (const z of [-0.42, 0.52]) strut(af, [s * 0.40, 0.44, z], [s * 0.56, 0.08, z], 0.04, p.alloy, 10);
  }
  tube(af, [0, 0.86, -1.16], 0.12, 0.22, 1.24, p.primary, 12).rotation.x = Math.PI / 2;
  shell(af, [0, 0.88, -1.32], [0.76, 0.06, 0.26], p.accent, 0.42);
  shell(af, [0, 1.12, -1.68], [0.10, 0.62, 0.34], p.primary, 0.38);
  const doorBase: Point = [0.54, 0.72, -0.22];
  const door = group(af, 'CabinDoor', doorBase);
  shell(door, [0, 0, 0], [0.06, 0.54, 0.56], p.accent, 0.28);
  box(door, [0.032, 0.09, 0], [0.018, 0.22, 0.36], p.optic);
  box(door, [0.036, -0.08, 0.18], [0.022, 0.04, 0.10], p.alloy);
  tube(af, [0, 1.38, 0.06], 0.08, 0.11, 0.24, p.edge, 12);
  const mainRotor = group(af, 'MainRotor', [0, 1.50, 0.06]);
  tube(mainRotor, [0, 0.02, 0], 0.14, 0.16, 0.09, p.dark, 14);
  rotorBlades(mainRotor, 4, 1.44, 0.11, p.dark, p.accent, p);
  const tailRotor = group(af, 'TailRotor', [0.14, 1.20, -1.68]);
  tube(tailRotor, [0, 0, 0], 0.06, 0.06, 0.08, p.alloy, 10).rotation.z = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const arm = group(tailRotor, '');
    arm.rotation.x = (i * Math.PI) / 2;
    box(arm, [0.02, 0.14, 0], [0.02, 0.26, 0.055], p.accent);
  }
  if (detail) {
    for (const y of [0.45, 0.99]) box(af, [0.52, y, 0.02], [0.04, 0.035, 1.06], p.edge);
    light(af, [0, 0.44, 1.26], [0.18, 0.11, 0.10], p);
    for (const s of [-1, 1]) box(af, [s * 0.51, 0.72, 0.46], [0.025, 0.22, 0.34], p.optic);
    if (p.hd) {
      fastener(mainRotor, [0, 0.07, 0], p, 0.04);
      for (const s of [-1, 1]) fastener(af, [s * 0.56, 0.11, 0.52], p, 0.026);
    }
  }
  root.animations = [
    new T.AnimationClip('Hover flight', 2.4, [spinTrack('MainRotor', 'y', 2.4, 4), spinTrack('TailRotor', 'x', 2.4, 8)]),
    new T.AnimationClip('Rescue hatch', 3.0, [spinTrack('MainRotor', 'y', 3.0, 3), slideTrack('CabinDoor', 'z', doorBase, [0, 0.9, 2.1, 3.0], [0, 0.45, 0.45, 0])]),
  ];
}

function buildCityTramcar(root: T.Group, p: Finish, detail: boolean) {
  const car = group(root, 'CarBody');
  shell(car, [0, 0.38, 0], [1.14, 0.22, 3.12], p.dark, 0.24);
  for (const bz of [-0.94, 0.94]) {
    shell(car, [0, 0.24, bz], [1.04, 0.18, 0.78], p.edge, 0.3);
    for (const dz of [-0.26, 0.26]) wheelPair(car, 0.50, 0.20, bz + dz, 0.08, p, detail, p.alloy, 4);
  }
  shell(car, [0, 0.72, 0], [1.22, 0.52, 3.32], p.primary, 0.28);
  shell(car, [0, 1.24, 0], [1.20, 0.56, 3.24], p.accent, 0.28);
  shell(car, [0, 1.60, 0], [1.24, 0.18, 3.28], p.primary, 0.38);
  shell(car, [0, 1.72, 0], [0.84, 0.12, 2.46], p.edge, 0.42);
  box(car, [0.58, 0.94, 0], [0.12, 0.90, 0.70], p.inset);
  for (const ez of [-1, 1]) {
    box(car, [0, 1.24, ez * 1.625], [0.86, 0.38, 0.04], p.optic);
    box(car, [0, 1.54, ez * 1.61], [0.56, 0.11, 0.04], p.dark);
    light(car, [0, 0.74, ez * 1.66], [0.20, 0.16, 0.06], p);
  }
  for (const z of [-1.06, -0.60, 0.60, 1.06]) for (const s of [-1, 1]) box(car, [s * 0.605, 1.24, z], [0.03, 0.36, 0.36], p.optic);
  box(car, [-0.605, 1.24, 0], [0.03, 0.36, 0.62], p.optic);
  const doorFBase: Point = [0.635, 0.94, 0.175];
  const doorRBase: Point = [0.635, 0.94, -0.175];
  for (const [name, base] of [['TramDoorF', doorFBase], ['TramDoorR', doorRBase]] as const) {
    const leaf = group(car, name, base);
    shell(leaf, [0, 0, 0], [0.055, 0.94, 0.34], p.primary, 0.24);
    box(leaf, [0.03, 0.20, 0], [0.015, 0.38, 0.22], p.optic);
  }
  shell(car, [0, 1.80, 0], [0.54, 0.06, 0.56], p.dark, 0.35);
  const panto = group(car, 'Pantograph', [0, 1.83, -0.14]);
  for (const s of [-1, 1]) {
    strut(panto, [s * 0.18, 0, 0], [s * 0.16, 0.28, 0.32], 0.02, p.alloy, 8);
    strut(panto, [s * 0.16, 0.28, 0.32], [s * 0.18, 0.54, 0.04], 0.02, p.alloy, 8);
  }
  strut(panto, [-0.42, 0.55, 0.04], [0.42, 0.55, 0.04], 0.024, p.accent, 10);
  if (detail) {
    box(car, [0.62, 1.43, 0], [0.04, 0.035, 1.44], p.edge);
    for (const s of [-1, 1]) {
      box(car, [s * 0.615, 0.96, 0], [0.02, 0.055, 3.16], p.stencil);
      for (const z of [-1.42, 1.42]) box(car, [s * 0.54, 0.30, z], [0.16, 0.12, 0.24], p.dark);
    }
    if (p.hd) for (const z of [-0.22, 0.22]) fastener(car, [0.22, 1.84, z], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Boarding stop', 3.2, [
      slideTrack('TramDoorF', 'z', doorFBase, [0, 0.9, 2.3, 3.2], [0, 0.35, 0.35, 0]),
      slideTrack('TramDoorR', 'z', doorRBase, [0, 0.9, 2.3, 3.2], [0, -0.35, -0.35, 0]),
      rotationTrack('Pantograph', 'x', [0, 1.0, 2.2, 3.2], [0, 0.38, 0.38, 0]),
    ]),
    new T.AnimationClip('Pantograph raise', 2.4, [rotationTrack('Pantograph', 'x', [0, 0.8, 1.6, 2.4], [0, 0.42, 0.42, 0])]),
  ];
}

function buildCoastalSailboat(root: T.Group, p: Finish, detail: boolean) {
  const boat = group(root, 'Boat');
  shell(boat, [0, 0.04, -0.06], [0.54, 0.08, 0.96], p.dark, 0.44);
  shell(boat, [0, 0.22, -0.06], [0.16, 0.32, 0.72], p.edge, 0.42);
  shell(boat, [0, 0.54, -0.04], [1.04, 0.38, 2.16], p.primary, 0.66);
  shell(boat, [0, 0.62, 0.94], [0.64, 0.34, 0.88], p.primary, 0.78);
  shell(boat, [0, 0.76, -0.02], [0.96, 0.09, 2.28], p.accent, 0.66);
  shell(boat, [0, 0.78, -0.70], [0.64, 0.14, 0.64], p.inset, 0.38);
  shell(boat, [0, 0.92, 0.22], [0.64, 0.24, 0.84], p.stencil, 0.48);
  tube(boat, [0, 2.16, 0.16], 0.036, 0.056, 2.52, p.alloy, 12);
  strut(boat, [-0.36, 2.34, 0.16], [0.36, 2.34, 0.16], 0.018, p.alloy, 8);
  strut(boat, [0, 0.82, 1.32], [0, 3.36, 0.16], 0.009, p.edge, 6);
  for (const s of [-1, 1]) strut(boat, [s * 0.44, 0.80, 0.06], [0, 3.24, 0.16], 0.012, p.edge, 6);
  const sail = (parent: T.Object3D, pts: [number, number][], ctrl: [number, number], mat: T.Material, at: Point) => {
    const sh = new T.Shape();
    sh.moveTo(pts[0]?.[0] ?? 0, pts[0]?.[1] ?? 0);
    sh.lineTo(pts[1]?.[0] ?? 0, pts[1]?.[1] ?? 0);
    sh.quadraticCurveTo(ctrl[0], ctrl[1], pts[2]?.[0] ?? 0, pts[2]?.[1] ?? 0);
    sh.closePath();
    const geo = new T.ExtrudeGeometry(sh, { depth: 0.032, curveSegments: p.hd ? 18 : 6, bevelEnabled: p.hd, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
    geo.rotateY(-Math.PI / 2);
    mesh(parent, geo, mat, at);
  };
  sail(boat, [[0, 0.98], [1.12, 0.96], [0.04, 3.26]], [0.56, 2.18], p.stencil, [0.016, 0, 0.22]);
  const boom = group(boat, 'MainBoom', [0, 1.14, 0.12]);
  strut(boom, [0, 0, 0], [0, 0, -1.24], 0.032, p.alloy, 10);
  sail(boom, [[0, 0.04], [-1.18, 0.04], [-0.02, 2.22]], [-0.76, 1.24], p.accent, [0.013, 0, 0]);
  const tiller = group(boat, 'TillerRudder', [0, 0.62, -1.16]);
  shell(tiller, [0, -0.26, -0.10], [0.06, 0.56, 0.24], p.primary, 0.34);
  strut(tiller, [0, 0.14, -0.04], [0, 0.24, 0.54], 0.026, p.accent, 10);
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [0.04, 0.34]) tube(boat, [s * 0.325, 0.92, z], 0.055, 0.055, 0.024, p.optic, 12).rotation.z = Math.PI / 2;
      box(boat, [s * 0.44, 0.80, -0.46], [0.04, 0.08, 0.62], p.stencil);
      if (p.hd) fastener(boat, [s * 0.36, 0.82, -0.48], p, 0.024);
    }
  }
  root.animations = [
    new T.AnimationClip('Tack breeze', 3.6, [
      rotationTrack('MainBoom', 'y', [0, 0.9, 2.7, 3.6], [0, 0.85, -0.85, 0]),
      rotationTrack('TillerRudder', 'y', [0, 0.9, 2.7, 3.6], [0, -0.48, 0.48, 0]),
    ]),
  ];
}

function buildWarehouseForklift(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Chassis');
  shell(b, [0, 0.46, -0.18], [1.02, 0.42, 1.48], p.primary, 0.36);
  shell(b, [0, 0.66, -0.78], [1.06, 0.64, 0.54], p.primary, 0.48);
  shell(b, [0, 0.46, -1.04], [0.96, 0.22, 0.16], p.dark, 0.32);
  shell(b, [0, 0.70, 0.08], [0.84, 0.14, 0.86], p.dark, 0.28);
  box(b, [0, 0.79, -0.26], [0.32, 0.14, 0.28], p.dark);
  shell(b, [0, 0.94, -0.26], [0.42, 0.34, 0.36], p.tire, 0.36);
  strut(b, [0, 0.72, 0.34], [0, 1.15, 0.14], 0.036, p.dark, 10);
  torus(b, [0, 1.15, 0.14], 0.14, 0.024, p.tire, p.hd).rotation.x = 1.1;
  for (const s of [-1, 1]) {
    strut(b, [s * 0.44, 0.74, 0.46], [s * 0.42, 1.82, 0.34], 0.034, p.dark, 10);
    strut(b, [s * 0.44, 0.94, -0.64], [s * 0.42, 1.82, -0.60], 0.034, p.dark, 10);
    strut(b, [s * 0.34, 0.48, 0.50], [s * 0.34, 0.48, 0.72], 0.044, p.edge, 8);
    shell(b, [s * 0.34, 1.08, 0.72], [0.11, 1.88, 0.14], p.dark, 0.22);
  }
  shell(b, [0, 1.84, -0.14], [0.94, 0.08, 1.06], p.dark, 0.3);
  tube(b, [0, 1.94, -0.52], 0.065, 0.075, 0.12, p.accent, 12);
  tube(b, [0, 1.04, 0.68], 0.055, 0.06, 1.76, p.alloy, 12);
  box(b, [0, 1.96, 0.72], [0.78, 0.09, 0.16], p.edge);
  const forkBase: Point = [0, 0.14, 0.81];
  const carriage = group(b, 'ForkCarriage', forkBase);
  shell(carriage, [0, 0.24, 0], [0.84, 0.50, 0.09], p.edge, 0.25);
  box(carriage, [0, 0.48, 0], [0.82, 0.06, 0.08], p.accent);
  for (const s of [-1, 1]) {
    box(carriage, [s * 0.24, 0.16, 0.06], [0.11, 0.38, 0.055], p.alloy);
    shell(carriage, [s * 0.24, -0.02, 0.44], [0.11, 0.055, 0.78], p.alloy, 0.22);
  }
  wheelPair(b, 0.54, 0.28, 0.42, 0.16, p, detail, p.accent, 6, ['FrontWheelL', 'FrontWheelR']);
  wheelPair(b, 0.52, 0.22, -0.70, 0.14, p, detail, p.edge, 5, ['RearWheelL', 'RearWheelR']);
  strut(b, [-0.52, 0.22, -0.70], [0.52, 0.22, -0.70], 0.04, p.dark, 8);
  if (detail) {
    for (const x of [-0.28, -0.14, 0, 0.14, 0.28]) box(b, [x, 1.84, -0.14], [0.04, 0.095, 0.92], p.edge);
    for (const s of [-1, 1]) {
      light(b, [s * 0.36, 1.72, 0.40], [0.14, 0.09, 0.08], p);
      box(b, [s * 0.52, 0.56, -0.44], [0.03, 0.10, 0.62], p.accent);
      if (p.hd) fastener(carriage, [s * 0.24, 0.26, 0.09], p, 0.024).rotation.x = Math.PI / 2;
    }
  }
  root.animations = [
    new T.AnimationClip('Lift and roll', 3.2, [
      slideTrack('ForkCarriage', 'y', forkBase, [0, 1.0, 2.2, 3.2], [0, 0.85, 0.85, 0]),
      spinTrack('FrontWheelL', 'x', 3.2, 2), spinTrack('FrontWheelR', 'x', 3.2, 2),
      spinTrack('RearWheelL', 'x', 3.2, 2), spinTrack('RearWheelR', 'x', 3.2, 2),
    ]),
    new T.AnimationClip('Lift forks', 2.4, [slideTrack('ForkCarriage', 'y', forkBase, [0, 0.8, 1.6, 2.4], [0, 0.85, 0.85, 0])]),
  ];
}

function buildDesertHoverSkiff(root: T.Group, p: Finish, detail: boolean) {
  const skiff = group(root, 'Skiff');
  shell(skiff, [0, 0.14, 0], [1.68, 0.28, 2.66], p.tire, 0.52);
  shell(skiff, [0, 0.36, 0.04], [1.56, 0.24, 2.54], p.primary, 0.52);
  shell(skiff, [0, 0.52, 0.72], [1.26, 0.24, 1.18], p.primary, 0.56);
  shell(skiff, [0, 0.74, 0.44], [0.92, 0.34, 0.88], p.dark, 0.46);
  box(skiff, [0, 0.86, 0.86], [0.78, 0.26, 0.06], p.optic).rotation.x = -0.45;
  for (const s of [-1, 1]) {
    strut(skiff, [s * 0.44, 0.66, 0.04], [s * 0.40, 1.12, 0.10], 0.032, p.accent, 10);
    light(skiff, [s * 0.46, 0.54, 1.32], [0.22, 0.10, 0.08], p);
    shell(skiff, [s * 0.74, 0.48, -0.34], [0.22, 0.24, 1.24], p.accent, 0.42);
  }
  strut(skiff, [-0.40, 1.12, 0.10], [0.40, 1.12, 0.10], 0.032, p.accent, 10);
  shell(skiff, [0, 0.49, -0.58], [1.14, 0.10, 1.06], p.edge, 0.32);
  const crate = group(skiff, 'CargoCrate', [0, 0.74, -0.56]);
  shell(crate, [0, 0, 0], [0.76, 0.42, 0.68], p.accent, 0.26);
  shell(crate, [0, 0.21, 0], [0.80, 0.08, 0.72], p.dark, 0.32);
  for (const x of [-0.24, 0.24]) box(crate, [x, 0.02, 0], [0.06, 0.48, 0.74], p.edge);
  for (const [side, name] of [[1, 'ThrusterL'], [-1, 'ThrusterR']] as const) {
    strut(skiff, [side * 0.66, 0.56, -0.82], [side * 0.88, 0.68, -0.82], 0.055, p.alloy, 10);
    const pod = group(skiff, name, [side * 0.96, 0.68, -0.82]);
    ring(pod, [0, 0, 0], 0.28, 0.055, 0.38, p.dark).rotation.x = Math.PI / 2;
    ring(pod, [0, 0, 0.04], 0.30, 0.04, 0.24, p.primary).rotation.x = Math.PI / 2;
    tube(pod, [0, 0, 0], 0.09, 0.09, 0.34, p.accent, 12).rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      box(pod, [Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0], [0.18, 0.04, 0.05], p.alloy).rotation.z = a;
    }
  }
  if (detail) {
    for (const z of [-0.96, -0.48, 0, 0.48, 0.96]) for (const s of [-1, 1]) box(skiff, [s * 0.84, 0.16, z], [0.03, 0.24, 0.08], p.dark);
    if (p.hd) {
      for (const s of [-1, 1]) fastener(skiff, [s * 0.74, 0.61, 0.12], p, 0.028);
      fastener(crate, [0, 0.26, 0], p, 0.026);
    }
  }
  root.animations = [
    new T.AnimationClip('Vector thrust', 3.0, [
      rotationTrack('ThrusterL', 'x', [0, 0.75, 2.25, 3.0], [0, 0.56, -0.56, 0]),
      rotationTrack('ThrusterR', 'x', [0, 0.75, 2.25, 3.0], [0, 0.56, -0.56, 0]),
    ]),
  ];
}

export const vehiclesA: readonly VehicleAssetDef[] = [
  asset('vintage-biplane', 'VH-01', 'Vintage Biplane', '#c84237', '#efe1ba', 'Twin-wing open-cockpit vintage biplane with spinning nose propeller and hinged tail rudder.', [rp('Propeller', 'Propeller', 'rotate', 'z', [0, 360], 'Spins the front two-blade wooden propeller'), rp('Rudder', 'Tail rudder', 'rotate', 'y', [-30, 30], 'Swings the vertical tail rudder left and right')], [], buildVintageBiplane),
  asset('steam-locomotive', 'VH-02', 'Steam Locomotive', '#2f5947', '#d8a648', 'Classic iron steam locomotive with coupled driving wheels and a swinging brass boiler bell.', [rp('DriveWheelL', 'Left drive wheel', 'rotate', 'x', [0, 360], 'Rolls the left main drive wheel'), rp('DriveWheelR', 'Right drive wheel', 'rotate', 'x', [0, 360], 'Rolls the right main drive wheel'), rp('BrassBell', 'Brass bell', 'rotate', 'z', [-25, 25], 'Swings the boiler-mounted brass bell')], [], buildSteamLocomotive),
  asset('harbor-tugboat', 'VH-03', 'Harbor Tugboat', '#b94132', '#ebb844', 'Stout harbor tugboat with a rotating radar scanner, stern rudder, and detachable life ring.', [rp('RadarBar', 'Radar scanner', 'rotate', 'y', [0, 360], 'Spins the roof-mounted marine radar bar'), rp('SternRudder', 'Stern rudder', 'rotate', 'y', [-35, 35], 'Steers the aft stern rudder')], [{ name: 'LifeRing', label: 'Life ring', describe: 'Removable rescue life preserver on the wheelhouse side' }], buildHarborTugboat),
  asset('rescue-helicopter', 'VH-04', 'Rescue Helicopter', '#e25a2b', '#f1ede0', 'Twin-turbine rescue helicopter with articulated rotors and a sliding side rescue hatch.', [rp('MainRotor', 'Main rotor', 'rotate', 'y', [0, 360], 'Spins the overhead main rotor'), rp('TailRotor', 'Tail rotor', 'rotate', 'x', [0, 360], 'Spins the tail anti-torque rotor'), rp('CabinDoor', 'Cabin door', 'slide', 'z', [0, 0.45], 'Slides the side rescue door open along its rail')], [], buildRescueHelicopter),
  asset('city-tramcar', 'VH-05', 'City Tramcar', '#e4b33c', '#f3ebd4', 'Double-ended urban streetcar with parting sliding doors and a tilting roof pantograph.', [rp('TramDoorF', 'Front sliding door', 'slide', 'z', [0, 0.35], 'Slides the front parting boarding door open'), rp('TramDoorR', 'Rear sliding door', 'slide', 'z', [0, -0.35], 'Slides the rear parting boarding door open'), rp('Pantograph', 'Roof pantograph', 'rotate', 'x', [0, 25], 'Tilts the overhead collector pantograph')], [], buildCityTramcar),
  asset('coastal-sailboat', 'VH-06', 'Coastal Sailboat', '#2d5679', '#e7c98f', 'Sloop-rigged coastal sailboat with a swinging mainsail boom and articulated tiller rudder.', [rp('MainBoom', 'Mainsail boom', 'rotate', 'y', [-60, 60], 'Swings the mainsail boom across the cockpit'), rp('TillerRudder', 'Tiller and rudder', 'rotate', 'y', [-35, 35], 'Turns the stern rudder and tiller arm')], [], buildCoastalSailboat),
  asset('warehouse-forklift', 'VH-07', 'Warehouse Forklift', '#e5a428', '#d95b2b', 'Counterbalanced warehouse forklift with an elevating fork carriage and rolling drive wheels.', [rp('ForkCarriage', 'Fork carriage', 'slide', 'y', [0, 0.85], 'Raises and lowers the fork carriage along the mast'), rp('FrontWheelL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left drive wheel'), rp('FrontWheelR', 'Front-right wheel', 'rotate', 'x', [0, 360], 'Rolls the front-right drive wheel')], [], buildWarehouseForklift),
  asset('desert-hover-skiff', 'VH-08', 'Desert Hover Skiff', '#c88c52', '#48939a', 'Expedition desert hover skiff with tilting ducted thrusters and a removable aft cargo crate.', [rp('ThrusterL', 'Left thruster', 'rotate', 'x', [-35, 35], 'Pitches the port vectored fan thruster'), rp('ThrusterR', 'Right thruster', 'rotate', 'x', [-35, 35], 'Pitches the starboard vectored fan thruster')], [{ name: 'CargoCrate', label: 'Cargo crate', describe: 'Removable strapped supply crate in the rear cargo bay' }], buildDesertHoverSkiff),
];
