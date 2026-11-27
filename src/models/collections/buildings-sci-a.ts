import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';
import { fastener } from '../hd-detail';
import { box, group, light, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../parts';
import type { Finish, Point } from '../parts';

interface SciBuildingAsset {
  readonly id: string;
  readonly code: string;
  readonly category: 'Object';
  readonly browseCategory: BrowseCategory;
  readonly name: string;
  readonly primary: string;
  readonly accent: string;
  readonly description: string;
  readonly physicsBody: 'static';
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts: readonly DetachablePartSpec[];
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void;
}

const deg = T.MathUtils.degToRad;
const rig = (name: string, label: string, type: 'rotate' | 'slide', axis: Axis, range: [number, number], describe: string): RiggedPartSpec =>
  ({ name, label, type, axis, range, describe });
const det = (name: string, label: string, describe: string): DetachablePartSpec => ({ name, label, describe });
const def = (
  id: string, code: string, name: string, primary: string, accent: string, description: string,
  riggedParts: readonly RiggedPartSpec[], detachableParts: readonly DetachablePartSpec[],
  build: (root: T.Group, p: Finish, detail: boolean) => void,
): SciBuildingAsset => ({
  id, code, category: 'Object', browseCategory: 'building', name, primary, accent, description, physicsBody: 'static', riggedParts, detachableParts, build,
});

function slideTrack(node: string, rest: Point, axis: Axis, times: number[], offsets: number[]) {
  const values = offsets.flatMap(d => [rest[0] + (axis === 'x' ? d : 0), rest[1] + (axis === 'y' ? d : 0), rest[2] + (axis === 'z' ? d : 0)]);
  return new T.VectorKeyframeTrack(node + '.position', times, values);
}

function hose(parent: T.Object3D, path: Point[], radius: number, color: T.Material, hd: boolean) {
  return mesh(parent, new T.TubeGeometry(new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt))), hd ? 20 : 8, radius, hd ? 10 : 6), color, [0, 0, 0]);
}

function torus(parent: T.Object3D, at: Point, r: number, t: number, color: T.Material, hd: boolean) {
  return mesh(parent, new T.TorusGeometry(r, t, hd ? 14 : 6, hd ? 36 : 14), color, at);
}

function ringBolts(parent: T.Object3D, cx: number, y: number, cz: number, r: number, n: number, p: Finish, offset = 0) {
  for (let i = 0; i < n; i++) {
    const a = i * Math.PI * 2 / n + offset;
    fastener(parent, [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r], p, 0.028);
  }
}

function buildCyberRamenKiosk(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'Kiosk');
  shell(base, [0, 0.08, 0.06], [2.26, 0.16, 1.88], p.dark, 0.2);
  shell(base, [0, 0.92, -0.14], [2.04, 1.54, 1.24], p.primary, 0.14);
  // Recessed kitchen bay & serving counter
  box(base, [0, 1.18, 0.44], [1.62, 0.68, 0.12], p.inset);
  box(base, [0, 1.22, 0.4], [1.28, 0.22, 0.05], p.optic);
  shell(base, [0, 0.8, 0.56], [2.12, 0.12, 0.54], p.edge, 0.24);
  box(base, [0, 0.46, 0.48], [1.96, 0.56, 0.1], p.dark);
  box(base, [0, 0.56, 0.54], [1.74, 0.08, 0.05], p.accent);
  // Slanted cyberpunk awning & rooftop condenser
  shell(base, [0, 1.84, 0.12], [2.24, 0.34, 1.72], p.primary, 0.18);
  const canopy = shell(base, [0, 1.72, 0.84], [2.2, 0.12, 0.56], p.accent, 0.22);
  canopy.rotation.x = 0.22;
  box(base, [0, 1.62, 0.66], [1.92, 0.06, 0.06], p.optic);
  shell(base, [-0.52, 2.18, -0.2], [0.68, 0.36, 0.52], p.edge, 0.2);
  tube(base, [0.58, 2.26, -0.34], 0.12, 0.14, 0.52, p.alloy, 12);
  tube(base, [0.58, 2.54, -0.34], 0.17, 0.12, 0.1, p.dark, 12);
  const shutterPos: Point = [0, 1.18, 0.51];
  const shutter = group(base, 'RollShutter', shutterPos);
  box(shutter, [0, 0, 0], [1.58, 0.64, 0.05], p.alloy);
  for (const y of [-0.22, -0.08, 0.06, 0.2]) box(shutter, [0, y, 0.02], [1.52, 0.05, 0.048], p.edge);
  box(shutter, [0, -0.29, 0.03], [0.46, 0.05, 0.05], p.accent);
  // Hanging cantilevered neon sign
  strut(base, [1.0, 1.86, 0.36], [1.32, 1.86, 0.36], 0.032, p.alloy, 10);
  strut(base, [1.26, 1.86, 0.18], [1.26, 1.86, 0.54], 0.022, p.alloy, 8);
  const sign = group(base, 'NeonSign', [1.26, 1.84, 0.36]);
  for (const dz of [-0.14, 0.14]) strut(sign, [0, 0.02, dz], [0, -0.1, dz], 0.018, p.alloy, 8);
  shell(sign, [0, -0.44, 0], [0.12, 0.72, 0.44], p.dark, 0.22);
  box(sign, [0, -0.44, 0], [0.15, 0.56, 0.34], p.accent);
  box(sign, [0, -0.44, 0], [0.17, 0.34, 0.22], p.optic);
  // Detachable counter stools
  const stools = group(base, 'StoolSet');
  for (const x of [-0.62, 0, 0.62]) {
    tube(stools, [x, 0.34, 0.8], 0.045, 0.065, 0.38, p.alloy, 10);
    tube(stools, [x, 0.17, 0.8], 0.14, 0.15, 0.06, p.dark, 12);
    tube(stools, [x, 0.54, 0.8], 0.17, 0.16, 0.09, p.accent, 12);
    torus(stools, [x, 0.28, 0.8], 0.12, 0.018, p.tire, p.hd).rotation.x = Math.PI / 2;
  }
  if (detail) {
    for (const x of [-0.72, -0.24, 0.24, 0.72]) tube(base, [x, 1.54, 0.88], 0.075, 0.075, 0.16, p.accent, 10);
    for (const x of [-0.52, 0.16]) tube(base, [x, 0.92, 0.6], 0.08, 0.055, 0.1, p.stencil, 10);
    for (const y of [2.1, 2.22]) box(base, [-0.52, y, 0.07], [0.5, 0.048, 0.048], p.inset);
    strut(base, [-0.88, 2.0, -0.48], [-0.88, 2.52, -0.48], 0.016, p.alloy, 8);
    if (p.hd) {
      for (const x of [-0.95, 0.95]) fastener(base, [x, 1.84, 0.98], p, 0.032).rotation.x = Math.PI / 2;
      hose(base, [[-0.2, 2.12, -0.2], [0.16, 2.24, -0.26], [0.48, 2.16, -0.34]], 0.032, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Open shutter', 3.2, [slideTrack('RollShutter', shutterPos, 'y', [0, 1.1, 2.1, 3.2], [0, 0.65, 0.65, 0])]),
    new T.AnimationClip('Sign sway', 3.6, [rotationTrack('NeonSign', 'z', [0, 0.9, 2.7, 3.6], [0, deg(18), deg(-18), 0])]),
  ];
}

function buildOrbitalAirlock(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'Airlock');
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      shell(base, [sx * 0.96, 0.14, sz * 0.68], [0.46, 0.28, 0.42], p.dark, 0.28);
      strut(base, [sx * 0.96, 0.24, sz * 0.68], [sx * 0.78, 0.56, sz * 0.52], 0.075, p.edge, 10);
    }
  }
  shell(base, [0, 1.18, -0.06], [2.42, 1.78, 1.66], p.primary, 0.3);
  shell(base, [0, 1.18, 0.62], [2.26, 1.64, 0.44], p.edge, 0.28);
  box(base, [0, 1.06, 0.68], [1.08, 1.24, 0.28], p.inset);
  box(base, [0, 0.42, 0.74], [1.14, 0.09, 0.32], p.dark);
  box(base, [0, 1.14, 0.56], [0.42, 0.36, 0.06], p.optic);
  // Top docking collar & pressure tanks
  ring(base, [0, 2.14, -0.08], 0.68, 0.14, 0.22, p.edge);
  ring(base, [0, 2.28, -0.08], 0.58, 0.08, 0.1, p.accent);
  tube(base, [0, 2.1, -0.08], 0.52, 0.54, 0.14, p.dark, 14);
  for (const sx of [-1, 1]) {
    const tank = tube(base, [sx * 1.24, 1.18, -0.14], 0.22, 0.22, 1.18, p.alloy, 14);
    tank.rotation.x = Math.PI / 2;
    for (const z of [-0.42, 0.14]) {
      const band = tube(base, [sx * 1.24, 1.18, z], 0.245, 0.245, 0.12, p.accent, 14);
      band.rotation.x = Math.PI / 2;
    }
    box(base, [sx * 0.88, 1.66, 0.84], [0.34, 0.1, 0.08], p.accent);
  }
  const posL: Point = [-0.26, 1.08, 0.78];
  const posR: Point = [0.26, 1.08, 0.78];
  const doorL = group(base, 'BlastDoorL', posL);
  const doorR = group(base, 'BlastDoorR', posR);
  for (const [door, dir] of [[doorL, -1], [doorR, 1]] as const) {
    shell(door, [0, 0, 0], [0.5, 1.2, 0.14], p.primary, 0.18);
    box(door, [dir * 0.06, 0.18, 0.06], [0.22, 0.3, 0.05], p.optic);
    box(door, [0, -0.26, 0.06], [0.38, 0.12, 0.05], p.accent);
    box(door, [-dir * 0.2, 0, 0.05], [0.08, 0.96, 0.07], p.dark);
  }
  if (detail) {
    light(base, [0, 1.88, 0.84], [0.46, 0.12, 0.08], p);
    shell(base, [0.82, 1.04, 0.88], [0.18, 0.28, 0.08], p.dark, 0.2);
    box(base, [0.82, 1.08, 0.92], [0.11, 0.12, 0.048], p.optic);
    for (const sx of [-1, 1]) {
      strut(base, [sx * 0.64, 0.66, 0.9], [sx * 0.64, 1.38, 0.9], 0.022, p.alloy, 10);
      for (const y of [0.7, 1.34]) strut(base, [sx * 0.64, y, 0.82], [sx * 0.64, y, 0.9], 0.018, p.dark, 8);
    }
    if (p.hd) {
      ringBolts(base, 0, 2.26, -0.08, 0.62, 8, p);
      for (const sx of [-1, 1]) hose(base, [[sx * 1.12, 1.34, 0.34], [sx * 1.06, 1.56, 0.44], [sx * 0.88, 1.62, 0.32]], 0.032, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Cycle airlock', 3.6, [
      slideTrack('BlastDoorL', posL, 'x', [0, 1.2, 2.4, 3.6], [0, -0.45, -0.45, 0]),
      slideTrack('BlastDoorR', posR, 'x', [0, 1.2, 2.4, 3.6], [0, 0.45, 0.45, 0]),
    ]),
  ];
}

function buildHydroponicDome(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'BioDome');
  tube(base, [0, 0.16, 0], 1.32, 1.38, 0.32, p.dark, 16);
  tube(base, [0, 0.48, 0], 1.24, 1.28, 0.36, p.primary, 16);
  ring(base, [0, 0.68, 0], 1.28, 0.12, 0.14, p.edge);
  // Interior terraced hydroponic beds & foliage
  tube(base, [0, 0.68, 0], 0.94, 0.98, 0.16, p.inset, 14);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + 0.3;
    shell(base, [Math.sin(a) * 0.54, 0.86, Math.cos(a) * 0.54], [0.42, 0.22, 0.3], p.primary, 0.35);
    tube(base, [Math.sin(a) * 0.54, 1.04, Math.cos(a) * 0.54], 0.12, 0.16, 0.16, p.accent, 10);
  }
  tube(base, [0, 1.02, 0], 0.26, 0.32, 0.54, p.alloy, 12);
  // Open ribbed geodesic conservatory arches & crown cap
  ring(base, [0, 1.98, 0], 0.48, 0.08, 0.12, p.primary);
  tube(base, [0, 2.1, 0], 0.34, 0.46, 0.16, p.optic, 14);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + Math.PI / 8;
    const p0: Point = [Math.sin(a) * 1.22, 0.68, Math.cos(a) * 1.22];
    const p1: Point = [Math.sin(a) * 1.0, 1.44, Math.cos(a) * 1.0];
    const p2: Point = [Math.sin(a) * 0.44, 1.98, Math.cos(a) * 0.44];
    strut(base, p0, p1, 0.044, p.alloy, 10);
    strut(base, p1, p2, 0.038, p.alloy, 10);
    if (i > 1 && i < 6) {
      const panel = shell(base, [Math.sin(a) * 0.92, 1.38, Math.cos(a) * 0.92], [0.48, 0.52, 0.07], p.optic, 0.2);
      panel.rotation.y = a;
      panel.rotation.x = -0.52;
    }
  }
  // Entry vestibule & hinged skylight hatch
  shell(base, [0, 0.44, 1.12], [0.96, 0.88, 0.68], p.dark, 0.2);
  box(base, [0, 0.46, 1.46], [0.58, 0.72, 0.06], p.inset);
  const hatch = group(base, 'DomeHatch', [0, 1.42, 0.82]);
  const hatchPanel = shell(hatch, [0, -0.24, 0.28], [0.84, 0.09, 0.64], p.optic, 0.24);
  hatchPanel.rotation.x = 0.66;
  const hatchTrim = box(hatch, [0, -0.2, 0.3], [0.88, 0.07, 0.14], p.accent);
  hatchTrim.rotation.x = 0.66;
  // Rotating interior grow-lamp ring
  const lampRing = group(base, 'GrowLampRing', [0, 1.56, 0]);
  torus(lampRing, [0, 0, 0], 0.76, 0.042, p.accent, p.hd).rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    strut(lampRing, [0, 0.12, 0], [Math.sin(a) * 0.74, 0, Math.cos(a) * 0.74], 0.024, p.alloy, 10);
    tube(lampRing, [Math.sin(a) * 0.74, -0.06, Math.cos(a) * 0.74], 0.09, 0.11, 0.1, p.stencil, 10);
  }
  if (detail) {
    tube(base, [-1.22, 0.64, -0.62], 0.22, 0.24, 0.94, p.alloy, 12);
    tube(base, [-1.22, 1.14, -0.62], 0.18, 0.22, 0.12, p.accent, 12);
    ring(base, [0, 1.38, 0], 1.0, 0.05, 0.06, p.edge);
    if (p.hd) {
      ringBolts(base, 0, 0.74, 0, 1.24, 8, p, Math.PI / 8);
      hose(base, [[-1.08, 0.95, -0.52], [-0.88, 1.02, -0.34], [-0.66, 0.88, -0.2]], 0.03, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Grow cycle', 5.0, [spinTrack('GrowLampRing', 'y', 5.0)]),
    new T.AnimationClip('Vent dome', 3.2, [rotationTrack('DomeHatch', 'x', [0, 1.1, 2.1, 3.2], [0, deg(-65), deg(-65), 0])]),
  ];
}

function buildWizardSpire(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'Spire');
  tube(base, [0, 0.18, 0], 0.96, 1.06, 0.36, p.dark, 8);
  tube(base, [0, 1.18, 0], 0.66, 0.84, 1.72, p.primary, 10);
  // Buttresses & stone steps
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const rib = shell(base, [Math.sin(a) * 0.78, 0.92, Math.cos(a) * 0.78], [0.22, 1.48, 0.3], p.edge, 0.26);
    rib.rotation.y = a;
  }
  shell(base, [0, 0.12, 0.92], [0.84, 0.2, 0.36], p.edge, 0.2);
  box(base, [0, 0.68, 0.74], [0.56, 0.94, 0.14], p.inset);
  // Hinged tower door (hinge on right jamb +x so +85 deg swings outward +z)
  const door = group(base, 'TowerDoor', [0.26, 0.68, 0.81]);
  shell(door, [-0.26, 0, 0], [0.52, 0.9, 0.09], p.dark, 0.2);
  for (const y of [-0.24, 0.2]) box(door, [-0.22, y, 0.04], [0.42, 0.07, 0.05], p.accent);
  box(door, [-0.42, -0.02, 0.05], [0.07, 0.12, 0.06], p.alloy);
  // Corbelled observatory gallery & spire roof framing open crystal lantern
  tube(base, [0, 2.12, 0], 0.88, 0.66, 0.28, p.edge, 10);
  ring(base, [0, 2.34, 0], 0.86, 0.12, 0.22, p.primary);
  tube(base, [0, 2.52, 0], 0.28, 0.82, 0.34, p.primary, 12);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    strut(base, [Math.sin(a) * 0.56, 2.46, Math.cos(a) * 0.56], [Math.sin(a) * 0.48, 3.24, Math.cos(a) * 0.48], 0.05, p.accent, 10);
    strut(base, [Math.sin(a) * 0.48, 3.24, Math.cos(a) * 0.48], [0, 3.74, 0], 0.042, p.accent, 10);
  }
  tube(base, [0, 3.62, 0], 0.02, 0.22, 0.36, p.primary, 10);
  // Rotating arcane crystal inside open crown lantern
  const crystal = group(base, 'ArcaneCrystal', [0, 3.04, 0]);
  tube(crystal, [0, 0.22, 0], 0.01, 0.22, 0.44, p.optic, 6);
  tube(crystal, [0, -0.22, 0], 0.22, 0.01, 0.44, p.optic, 6);
  const ringA = torus(crystal, [0, 0, 0], 0.34, 0.028, p.accent, p.hd);
  ringA.rotation.set(0.6, 0.3, 0);
  const ringB = torus(crystal, [0, 0, 0], 0.28, 0.022, p.stencil, p.hd);
  ringB.rotation.set(-0.5, 0.9, 0.4);
  if (detail) {
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const win = group(base, '', [Math.sin(a) * 0.72, 1.56, Math.cos(a) * 0.72]);
      win.rotation.y = a;
      shell(win, [0, 0, 0], [0.24, 0.44, 0.09], p.edge, 0.25);
      box(win, [0, 0, 0.03], [0.14, 0.34, 0.05], p.optic);
    }
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      box(base, [Math.sin(a) * 0.84, 2.48, Math.cos(a) * 0.84], [0.16, 0.14, 0.14], p.edge);
    }
    if (p.hd) {
      ringBolts(base, 0, 2.24, 0, 0.86, 8, p);
      hose(base, [[0.52, 2.42, 0], [0.58, 2.86, 0.22], [0.32, 3.24, 0.32]], 0.024, p.accent, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Channel crystal', 4.5, [spinTrack('ArcaneCrystal', 'y', 4.5)]),
    new T.AnimationClip('Open tower door', 3.2, [rotationTrack('TowerDoor', 'y', [0, 1.1, 2.1, 3.2], [0, deg(85), deg(85), 0])]),
  ];
}

function buildCastleGatehouse(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'Gatehouse');
  shell(base, [0, 0.08, 0], [3.16, 0.16, 1.98], p.dark, 0.16);
  // Twin flanking bastion towers
  for (const sx of [-1, 1]) {
    shell(base, [sx * 1.06, 1.24, 0], [0.96, 2.24, 1.56], p.primary, 0.18);
    shell(base, [sx * 1.06, 2.38, 0], [1.08, 0.22, 1.68], p.edge, 0.18);
    tube(base, [sx * 1.06, 2.74, 0], 0.06, 0.58, 0.56, p.accent, 8);
    box(base, [sx * 1.06, 1.48, 0.78], [0.1, 0.44, 0.08], p.inset);
  }
  // Central barbican bridge & archway recess
  shell(base, [0, 1.88, -0.04], [1.28, 0.88, 1.38], p.primary, 0.14);
  shell(base, [0, 2.34, -0.04], [1.34, 0.16, 1.48], p.edge, 0.14);
  box(base, [0, 0.78, -0.18], [1.14, 1.26, 0.88], p.inset);
  shell(base, [0, 1.9, 0.68], [0.42, 0.52, 0.09], p.accent, 0.35);
  box(base, [0, 1.9, 0.72], [0.14, 0.34, 0.05], p.stencil);
  // Sliding iron portcullis grate
  const gatePos: Point = [0, 0.76, 0.56];
  const portcullis = group(base, 'Portcullis', gatePos);
  for (const x of [-0.42, -0.21, 0, 0.21, 0.42]) {
    box(portcullis, [x, 0, 0], [0.06, 1.2, 0.06], p.dark);
    tube(portcullis, [x, -0.64, 0], 0.032, 0.004, 0.12, p.alloy, 8);
  }
  for (const y of [-0.46, -0.1, 0.26, 0.56]) box(portcullis, [0, y, 0], [1.02, 0.065, 0.075], p.edge);
  // Detachable twin gate braziers
  const braziers = group(base, 'BrazierPair');
  for (const sx of [-1, 1]) {
    tube(braziers, [sx * 0.78, 0.28, 0.94], 0.14, 0.18, 0.4, p.dark, 10);
    tube(braziers, [sx * 0.78, 0.58, 0.94], 0.22, 0.13, 0.22, p.edge, 12);
    tube(braziers, [sx * 0.78, 0.82, 0.94], 0.02, 0.16, 0.32, p.accent, 10);
    tube(braziers, [sx * 0.78, 0.78, 0.94], 0.01, 0.09, 0.2, p.stencil, 8);
  }
  if (detail) {
    for (const x of [-0.48, -0.16, 0.16, 0.48]) box(base, [x, 2.52, 0.64], [0.18, 0.2, 0.14], p.primary);
    for (const sx of [-1, 1]) {
      for (const z of [-0.62, 0, 0.62]) box(base, [sx * 1.48, 2.58, z], [0.16, 0.18, 0.22], p.primary);
      for (const y of [0.52, 1.12, 1.72]) box(base, [sx * 0.6, y, 0.76], [0.14, 0.22, 0.1], p.edge);
    }
    if (p.hd) {
      for (const x of [-0.42, 0, 0.42]) fastener(portcullis, [x, 0.26, 0.04], p, 0.026).rotation.x = Math.PI / 2;
      for (const sx of [-1, 1]) hose(base, [[sx * 0.34, 1.48, 0.56], [sx * 0.34, 1.98, 0.42], [sx * 0.34, 2.36, 0.18]], 0.024, p.alloy, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Raise portcullis', 3.6, [slideTrack('Portcullis', gatePos, 'y', [0, 1.2, 2.4, 3.6], [0, 0.75, 0.75, 0])]),
  ];
}

function buildSolarPowerHub(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'SolarHub');
  shell(base, [0, 0.12, 0], [1.96, 0.24, 1.66], p.dark, 0.34);
  shell(base, [0, 0.52, 0], [1.58, 0.6, 1.32], p.edge, 0.32);
  for (const sx of [-1, 1]) {
    tube(base, [sx * 0.74, 0.52, 0.36], 0.18, 0.2, 0.56, p.alloy, 12);
    tube(base, [sx * 0.74, 0.74, 0.36], 0.2, 0.2, 0.1, p.accent, 12);
  }
  box(base, [0, 0.54, 0.68], [0.56, 0.34, 0.06], p.dark);
  box(base, [0, 0.56, 0.71], [0.42, 0.2, 0.048], p.optic);
  ring(base, [0, 0.88, 0], 0.42, 0.1, 0.14, p.dark);
  // Rotating sun-tracking mast + hinged left/right solar wings
  const mast = group(base, 'ArrayMast', [0, 0.94, 0]);
  tube(mast, [0, 0.56, 0], 0.14, 0.2, 1.12, p.alloy, 14);
  shell(mast, [0, 1.12, 0], [0.56, 0.24, 0.34], p.dark, 0.28);
  tube(mast, [0, 1.12, 0], 0.08, 0.08, 0.86, p.edge, 12).rotation.z = Math.PI / 2;
  const wingL = group(mast, 'SolarWingL', [-0.96, 1.12, 0]);
  const wingR = group(mast, 'SolarWingR', [0.96, 1.12, 0]);
  for (const [wing, dir] of [[wingL, -1], [wingR, 1]] as const) {
    shell(wing, [0, 0, 0], [1.34, 0.08, 0.98], p.accent, 0.12);
    box(wing, [0, 0.03, 0], [1.22, 0.05, 0.86], p.primary);
    for (const z of [-0.26, 0.26]) box(wing, [0, 0.045, z], [1.14, 0.048, 0.3], p.optic);
    strut(wing, [-dir * 0.54, -0.06, 0], [dir * 0.46, -0.06, 0], 0.036, p.alloy, 10);
  }
  if (detail) {
    for (const wing of [wingL, wingR]) {
      for (const x of [-0.42, 0, 0.42]) box(wing, [x, 0.052, 0], [0.05, 0.048, 0.86], p.alloy);
    }
    for (const x of [-0.36, -0.18, 0, 0.18, 0.36]) box(base, [x, 0.54, -0.68], [0.06, 0.38, 0.08], p.dark);
    if (p.hd) {
      ringBolts(base, 0, 0.96, 0, 0.36, 6, p);
      for (const sx of [-1, 1]) hose(base, [[sx * 0.64, 0.68, 0.36], [sx * 0.46, 0.9, 0.16], [sx * 0.22, 0.92, 0]], 0.028, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Track sun', 4.8, [
      spinTrack('ArrayMast', 'y', 4.8),
      rotationTrack('SolarWingL', 'x', [0, 1.2, 3.6, 4.8], [0, deg(38), deg(-38), 0]),
      rotationTrack('SolarWingR', 'x', [0, 1.2, 3.6, 4.8], [0, deg(38), deg(-38), 0]),
    ]),
    new T.AnimationClip('Tilt arrays', 3.4, [
      rotationTrack('SolarWingL', 'x', [0, 0.85, 2.55, 3.4], [0, deg(40), deg(-40), 0]),
      rotationTrack('SolarWingR', 'x', [0, 0.85, 2.55, 3.4], [0, deg(40), deg(-40), 0]),
    ]),
  ];
}

function buildCargoGantryCrane(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'GantryCrane');
  // Twin bogie rails & A-frame portal legs
  for (const sx of [-1, 1]) {
    shell(base, [sx * 1.44, 0.14, 0], [0.34, 0.24, 1.88], p.dark, 0.22);
    for (const sz of [-0.66, 0.66]) {
      const wheel = tube(base, [sx * 1.44, 0.11, sz], 0.11, 0.11, 0.36, p.tire, 12);
      wheel.rotation.z = Math.PI / 2;
      strut(base, [sx * 1.44, 0.24, sz], [sx * 1.38, 2.58, sz * 0.36], 0.075, p.primary, 10);
    }
    box(base, [sx * 1.4, 1.38, 0], [0.12, 0.14, 0.88], p.accent);
    shell(base, [sx * 1.42, 2.66, 0], [0.42, 0.36, 0.82], p.dark, 0.2);
  }
  // Overhead twin box-girder bridge & operator cab
  for (const sz of [-0.26, 0.26]) shell(base, [0, 2.68, sz], [3.34, 0.32, 0.2], p.primary, 0.16);
  box(base, [0, 2.86, 0], [3.26, 0.06, 0.74], p.edge);
  shell(base, [1.14, 2.1, 0.56], [0.64, 0.62, 0.62], p.accent, 0.22);
  box(base, [1.14, 2.14, 0.86], [0.48, 0.34, 0.06], p.optic);
  box(base, [0.82, 2.14, 0.56], [0.06, 0.34, 0.44], p.optic);
  // Sliding trolley + nested hoist hook
  const trolleyPos: Point = [0, 2.48, 0];
  const trolley = group(base, 'CraneTrolley', trolleyPos);
  shell(trolley, [0, 0.06, 0], [0.66, 0.26, 0.78], p.accent, 0.2);
  tube(trolley, [0, 0.12, 0], 0.14, 0.14, 0.52, p.dark, 12).rotation.x = Math.PI / 2;
  const hookPos: Point = [0, -1.06, 0];
  const hook = group(trolley, 'HoistHook', hookPos);
  for (const sx of [-0.1, 0.1]) strut(hook, [sx, 0.24, 0], [sx, 1.02, 0], 0.018, p.alloy, 8);
  shell(hook, [0, 0.12, 0], [0.36, 0.28, 0.22], p.primary, 0.24);
  box(hook, [0, 0.12, 0.1], [0.28, 0.09, 0.05], p.dark);
  tube(hook, [0, -0.09, 0], 0.042, 0.042, 0.16, p.alloy, 10);
  torus(hook, [0.04, -0.24, 0], 0.12, 0.036, p.edge, p.hd);
  if (detail) {
    for (const x of [-1.0, -0.5, 0, 0.5, 1.0]) strut(base, [x, 2.56, -0.26], [x + 0.25, 2.8, 0.26], 0.022, p.alloy, 8);
    for (let y = 0.52; y < 2.4; y += 0.28) box(base, [-1.42, y, 0.48], [0.22, 0.048, 0.048], p.alloy);
    for (const sx of [-1, 1]) light(base, [sx * 1.56, 2.88, 0.28], [0.14, 0.1, 0.08], p);
    if (p.hd) {
      for (const sx of [-1, 1]) fastener(base, [sx * 1.42, 2.68, 0.42], p, 0.032).rotation.x = Math.PI / 2;
      hose(base, [[-1.2, 2.5, -0.18], [-0.6, 2.34, -0.18], [0, 2.48, -0.18], [0.6, 2.34, -0.18], [1.2, 2.5, -0.18]], 0.024, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Transfer cargo', 4.4, [
      slideTrack('CraneTrolley', trolleyPos, 'x', [0, 1.1, 3.3, 4.4], [0, -0.85, 0.85, 0]),
      slideTrack('HoistHook', hookPos, 'y', [0, 1.4, 2.8, 4.4], [0, -0.58, -0.2, 0]),
    ]),
  ];
}

export const buildingsSciA: readonly SciBuildingAsset[] = [
  def('cyber-ramen-kiosk', 'BS-01', 'Cyber Ramen Kiosk', '#c9433b', '#f0b429',
    'Neon-lit street-food kiosk with a rolling counter shutter, swaying sign, and detachable stools.',
    [
      rig('RollShutter', 'Roll shutter', 'slide', 'y', [0, 0.65], 'Rolls the counter security shutter upward'),
      rig('NeonSign', 'Neon sign', 'rotate', 'z', [-18, 18], 'Swings the cantilevered illuminated street sign'),
    ],
    [det('StoolSet', 'Stool set', 'Counter seating stools placed in front of the kiosk')],
    buildCyberRamenKiosk),
  def('orbital-airlock', 'BS-02', 'Orbital Airlock', '#d4dce0', '#e06d2b',
    'Pressurized orbital station bulkhead module with twin opposing sliding blast doors.',
    [
      rig('BlastDoorL', 'Left blast door', 'slide', 'x', [0, -0.45], 'Slides the left armored door leaf open'),
      rig('BlastDoorR', 'Right blast door', 'slide', 'x', [0, 0.45], 'Slides the right armored door leaf open'),
    ], [], buildOrbitalAirlock),
  def('hydroponic-dome', 'BS-03', 'Hydroponic Dome', '#5a9e74', '#e6b84c',
    'Geodesic bio-conservatory with a hinged roof vent hatch and rotating interior grow-lamp halo.',
    [
      rig('DomeHatch', 'Dome hatch', 'rotate', 'x', [0, -65], 'Swings the front geodesic skylight hatch upward'),
      rig('GrowLampRing', 'Grow lamp ring', 'rotate', 'y', [0, 360], 'Rotates the suspended agricultural lamp ring'),
    ], [], buildHydroponicDome),
  def('wizard-spire', 'BS-04', 'Wizard Spire', '#4f4678', '#d9a441',
    'Arcane stone observatory spire crowned with a levitating rotating crystal and hinged portal door.',
    [
      rig('ArcaneCrystal', 'Arcane crystal', 'rotate', 'y', [0, 360], 'Spins the suspended astrolabe crystal core'),
      rig('TowerDoor', 'Tower door', 'rotate', 'y', [0, 85], 'Swings the arched spire entrance door outward'),
    ], [], buildWizardSpire),
  def('castle-gatehouse', 'BS-05', 'Castle Gatehouse', '#7c786e', '#9e3832',
    'Twin-tower fortified stone gatehouse with a rising iron portcullis and detachable fire braziers.',
    [rig('Portcullis', 'Portcullis', 'slide', 'y', [0, 0.75], 'Hoists the spiked iron grate up into the barbican')],
    [det('BrazierPair', 'Brazier pair', 'Twin flanking wrought-iron fire braziers outside the gate')],
    buildCastleGatehouse),
  def('solar-power-hub', 'BS-06', 'Solar Power Hub', '#355c7d', '#e8a838',
    'Off-grid photovoltaic substation with a rotating tracking mast and twin tilting solar array wings.',
    [
      rig('SolarWingL', 'Left solar wing', 'rotate', 'x', [-40, 40], 'Tilts the left photovoltaic array wing'),
      rig('SolarWingR', 'Right solar wing', 'rotate', 'x', [-40, 40], 'Tilts the right photovoltaic array wing'),
      rig('ArrayMast', 'Array mast', 'rotate', 'y', [0, 360], 'Rotates the central sun-tracking mast'),
    ], [], buildSolarPowerHub),
  def('cargo-gantry-crane', 'BS-07', 'Cargo Gantry Crane', '#d98c24', '#2c6e8a',
    'Industrial rail-mounted A-frame gantry crane with a traversing trolley and lowering hoist hook.',
    [
      rig('CraneTrolley', 'Crane trolley', 'slide', 'x', [-0.85, 0.85], 'Traverses the hoist trolley across the overhead bridge'),
      rig('HoistHook', 'Hoist hook', 'slide', 'y', [0, -0.6], 'Lowers and raises the cargo hook block'),
    ], [], buildCargoGantryCrane),
];
