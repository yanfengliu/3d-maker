import * as T from 'three';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';
import { fastener } from '../hd-detail';
import { airfoil } from '../hd-geometry';
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

function orb(parent: T.Object3D, at: Point, r: number, color: T.Material, hd: boolean) {
  return mesh(parent, new T.SphereGeometry(r, hd ? 24 : 10, hd ? 14 : 8), color, at);
}

function buildFuelSiloStation(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'FuelSilo');
  shell(base, [0, 0.09, 0], [2.66, 0.18, 1.88], p.dark, 0.18);
  // Primary vertical pressurized fuel silo
  tube(base, [-0.52, 1.24, -0.08], 0.68, 0.72, 2.08, p.primary, 16);
  orb(base, [-0.52, 2.26, -0.08], 0.68, p.primary, p.hd).scale.set(1, 0.42, 1);
  for (const y of [0.68, 1.78]) ring(base, [-0.52, y, -0.08], 0.74, 0.07, 0.12, p.accent);
  // Horizontal secondary buffer tank on cradles
  for (const x of [0.46, 0.96]) shell(base, [x, 0.44, -0.14], [0.2, 0.56, 0.78], p.edge, 0.2);
  tube(base, [0.72, 0.92, -0.14], 0.36, 0.36, 0.96, p.primary, 14).rotation.z = Math.PI / 2;
  for (const x of [0.24, 1.2]) orb(base, [x, 0.92, -0.14], 0.36, p.accent, p.hd).scale.set(0.45, 1, 1);
  // Front manifold & spinning valve handwheel
  shell(base, [0.68, 0.56, 0.48], [0.76, 0.74, 0.36], p.edge, 0.2);
  strut(base, [-0.04, 1.28, 0.24], [0.66, 1.28, 0.24], 0.068, p.alloy, 10);
  strut(base, [0.66, 1.28, 0.24], [0.66, 0.88, 0.48], 0.068, p.alloy, 10);
  const valve = group(base, 'ValveWheel', [0.68, 0.68, 0.74]);
  tube(valve, [0, 0, -0.06], 0.055, 0.065, 0.14, p.alloy, 10).rotation.x = Math.PI / 2;
  torus(valve, [0, 0, 0], 0.22, 0.032, p.accent, p.hd);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    strut(valve, [0, 0, 0], [Math.cos(a) * 0.21, Math.sin(a) * 0.21, 0], 0.02, p.dark, 8);
  }
  // Top hatch collar & hinged inspection hatch
  tube(base, [-0.52, 2.54, 0.08], 0.28, 0.3, 0.22, p.edge, 14);
  const hatch = group(base, 'TankHatch', [-0.52, 2.65, -0.18]);
  tube(hatch, [0, 0.04, 0.26], 0.3, 0.32, 0.09, p.accent, 14);
  box(hatch, [0, 0.1, 0.26], [0.1, 0.06, 0.42], p.dark);
  if (detail) {
    tube(base, [-0.52, 1.26, 0.64], 0.055, 0.055, 1.24, p.optic, 10);
    for (let y = 0.42; y < 2.3; y += 0.28) box(base, [-1.24, y, 0.06], [0.05, 0.048, 0.3], p.alloy);
    for (const sz of [-0.14, 0.22]) strut(base, [-1.24, 0.2, sz], [-1.24, 2.48, sz], 0.022, p.alloy, 8);
    box(base, [0.46, 0.8, 0.68], [0.18, 0.16, 0.05], p.optic);
    if (p.hd) {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        fastener(hatch, [Math.sin(a) * 0.24, 0.09, 0.26 + Math.cos(a) * 0.24], p, 0.022);
      }
      hose(base, [[0.14, 0.44, 0.48], [0.36, 0.28, 0.62], [0.68, 0.38, 0.58]], 0.032, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Turn valve', 3.4, [spinTrack('ValveWheel', 'z', 3.4)]),
    new T.AnimationClip('Inspect tank', 3.2, [rotationTrack('TankHatch', 'x', [0, 1.1, 2.1, 3.2], [0, deg(-80), deg(-80), 0])]),
  ];
}

function buildMonorailPlatform(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'MonorailStation');
  shell(base, [0, 0.16, 0], [3.26, 0.32, 1.88], p.dark, 0.14);
  box(base, [0, 0.33, 0.84], [3.16, 0.05, 0.14], p.accent);
  // Sculpted Y-pylons & cantilevered transit canopy
  for (const sx of [-1, 1]) {
    shell(base, [sx * 1.08, 1.16, -0.44], [0.28, 1.72, 0.34], p.edge, 0.24);
    strut(base, [sx * 1.08, 1.56, -0.44], [sx * 1.08, 2.18, 0.46], 0.072, p.alloy, 10);
    strut(base, [sx * 1.08, 1.56, -0.44], [sx * 1.08, 2.18, -0.66], 0.066, p.alloy, 10);
  }
  const roof = shell(base, [0, 2.26, 0.02], [3.32, 0.18, 1.66], p.primary, 0.18);
  roof.rotation.x = -0.06;
  box(base, [0, 2.34, 0.78], [3.2, 0.09, 0.12], p.accent);
  // Platform-edge safety barrier with twin sliding screen doors
  for (const sx of [-1, 1]) {
    shell(base, [sx * 1.08, 0.92, 0.68], [0.98, 1.14, 0.09], p.primary, 0.16);
    box(base, [sx * 1.08, 1.04, 0.7], [0.76, 0.64, 0.06], p.optic);
  }
  box(base, [0, 1.56, 0.68], [3.16, 0.14, 0.14], p.edge);
  const posL: Point = [-0.26, 0.92, 0.74];
  const posR: Point = [0.26, 0.92, 0.74];
  const doorL = group(base, 'ScreenDoorL', posL);
  const doorR = group(base, 'ScreenDoorR', posR);
  for (const door of [doorL, doorR]) {
    shell(door, [0, 0, 0], [0.5, 1.12, 0.07], p.alloy, 0.14);
    box(door, [0, 0.08, 0.01], [0.38, 0.72, 0.05], p.optic);
    box(door, [0, -0.26, 0.03], [0.42, 0.09, 0.05], p.accent);
  }
  // Detachable commuter bench unit
  const bench = group(base, 'BenchUnit', [0, 0.32, -0.24]);
  for (const sx of [-0.52, 0.52]) shell(bench, [sx, 0.2, 0], [0.12, 0.4, 0.44], p.edge, 0.2);
  shell(bench, [0, 0.42, 0.04], [1.34, 0.09, 0.46], p.primary, 0.22);
  shell(bench, [0, 0.68, -0.18], [1.34, 0.34, 0.09], p.primary, 0.22);
  for (const sx of [-0.62, 0, 0.62]) box(bench, [sx, 0.56, 0.04], [0.06, 0.16, 0.38], p.accent);
  if (detail) {
    shell(base, [0, 1.94, 0.2], [1.14, 0.24, 0.16], p.dark, 0.2);
    box(base, [0, 1.94, 0.29], [0.96, 0.14, 0.048], p.optic);
    shell(base, [-1.36, 0.94, -0.12], [0.34, 1.24, 0.22], p.dark, 0.2);
    box(base, [-1.36, 1.1, 0], [0.24, 0.44, 0.05], p.stencil);
    for (const x of [-0.7, 0, 0.7]) box(base, [x, 2.14, 0], [0.44, 0.05, 0.14], p.stencil);
    if (p.hd) {
      for (const sx of [-1, 1]) fastener(base, [sx * 1.08, 0.42, -0.22], p, 0.03);
      hose(base, [[-1.08, 2.14, -0.44], [0, 2.08, -0.32], [1.08, 2.14, -0.44]], 0.026, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Board train', 3.6, [
      slideTrack('ScreenDoorL', posL, 'x', [0, 1.2, 2.4, 3.6], [0, -0.4, -0.4, 0]),
      slideTrack('ScreenDoorR', posR, 'x', [0, 1.2, 2.4, 3.6], [0, 0.4, 0.4, 0]),
    ]),
  ];
}

function buildFortressDrawbridge(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'FortressBridge');
  // Moat channel piers & stone bastion abutment
  shell(base, [0, 0.12, -0.28], [2.82, 0.24, 1.56], p.dark, 0.16);
  for (const sx of [-1, 1]) {
    shell(base, [sx * 1.06, 0.16, 0.86], [0.68, 0.32, 0.82], p.primary, 0.18);
    shell(base, [sx * 1.02, 1.22, -0.14], [0.76, 1.98, 1.28], p.primary, 0.18);
    shell(base, [sx * 1.02, 2.18, -0.14], [0.86, 0.22, 1.4], p.edge, 0.18);
  }
  box(base, [0, 0.04, 0.86], [1.44, 0.08, 0.78], p.optic);
  shell(base, [0, 1.9, -0.22], [1.44, 0.76, 1.12], p.primary, 0.14);
  box(base, [0, 0.9, -0.22], [1.26, 1.32, 0.96], p.inset);
  // Hinged drawbridge pivoted at threshold (rotates +75 deg around X to lower forward)
  const bridge = group(base, 'Drawbridge', [0, 0.26, 0.46]);
  shell(bridge, [0, 0.62, 0], [1.14, 1.22, 0.13], p.dark, 0.14);
  for (const x of [-0.42, -0.14, 0.14, 0.42]) box(bridge, [x, 0.62, 0.05], [0.22, 1.12, 0.06], p.edge);
  for (const y of [0.24, 0.62, 1.0]) box(bridge, [0, y, 0.07], [1.1, 0.09, 0.06], p.accent);
  // Detachable medieval swallowtail banners
  const flags = group(base, 'BannerFlags');
  for (const sx of [-1, 1]) {
    strut(flags, [sx * 1.02, 2.26, 0.44], [sx * 1.02, 2.94, 0.44], 0.028, p.alloy, 10);
    tube(flags, [sx * 1.02, 2.98, 0.44], 0.05, 0.03, 0.1, p.accent, 10);
    shell(flags, [sx * 1.02, 2.54, 0.56], [0.34, 0.56, 0.06], p.accent, 0.2);
    box(flags, [sx * 1.02, 2.6, 0.59], [0.16, 0.22, 0.048], p.stencil);
  }
  if (detail) {
    for (const x of [-0.52, -0.18, 0.18, 0.52]) box(base, [x, 2.38, 0.3], [0.2, 0.22, 0.14], p.primary);
    for (const sx of [-1, 1]) {
      strut(base, [sx * 0.58, 1.98, 0.36], [sx * 0.54, 1.38, 0.52], 0.022, p.alloy, 8);
      for (const z of [-0.66, 0.38]) box(base, [sx * 1.02, 2.38, z], [0.24, 0.2, 0.16], p.primary);
    }
    if (p.hd) {
      for (const x of [-0.42, 0, 0.42]) fastener(bridge, [x, 0.62, 0.11], p, 0.028).rotation.x = Math.PI / 2;
      for (const sx of [-1, 1]) hose(base, [[sx * 0.56, 2.02, 0.34], [sx * 0.62, 1.68, 0.46], [sx * 0.52, 1.34, 0.54]], 0.026, p.alloy, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Lower drawbridge', 4.0, [rotationTrack('Drawbridge', 'x', [0, 1.4, 2.6, 4.0], [0, deg(75), deg(75), 0])]),
  ];
}

function buildNeonArcadeBooth(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'ArcadeBooth');
  shell(base, [0, 0.08, 0.04], [2.22, 0.16, 1.72], p.dark, 0.22);
  // Left, right, back booth walls & open front entryway
  for (const sx of [-1, 1]) {
    shell(base, [sx * 0.84, 1.06, -0.06], [0.46, 1.82, 1.38], p.primary, 0.16);
    box(base, [sx * 1.07, 1.12, -0.06], [0.06, 0.96, 0.72], p.optic);
    tube(base, [sx * 1.02, 1.06, 0.62], 0.045, 0.045, 1.72, p.accent, 12);
  }
  shell(base, [0, 1.06, -0.62], [1.46, 1.82, 0.26], p.primary, 0.14);
  // Interior illuminated arcade cabinet
  shell(base, [0, 0.88, -0.24], [0.76, 1.38, 0.46], p.dark, 0.18);
  const crt = box(base, [0, 1.16, 0.01], [0.58, 0.42, 0.06], p.optic);
  crt.rotation.x = -0.24;
  box(base, [0, 0.82, 0.06], [0.64, 0.12, 0.24], p.accent);
  // Stepped synthwave marquee header
  shell(base, [0, 2.14, 0.04], [2.32, 0.42, 1.62], p.primary, 0.2);
  shell(base, [0, 2.46, 0.14], [1.84, 0.28, 0.66], p.dark, 0.22);
  box(base, [0, 2.16, 0.84], [1.96, 0.22, 0.07], p.accent);
  box(base, [0, 2.46, 0.48], [1.52, 0.16, 0.06], p.optic);
  // Hinged cyberpunk saloon doors (sway outward +z symmetrically)
  const doorL = group(base, 'SaloonDoorL', [-0.56, 0.78, 0.62]);
  const doorR = group(base, 'SaloonDoorR', [0.56, 0.78, 0.62]);
  for (const [door, dir] of [[doorL, 1], [doorR, -1]] as const) {
    shell(door, [dir * 0.26, 0, 0], [0.5, 0.88, 0.08], p.primary, 0.18);
    box(door, [dir * 0.26, 0.22, 0.04], [0.36, 0.1, 0.05], p.accent);
    box(door, [dir * 0.26, -0.14, 0.04], [0.36, 0.22, 0.05], p.optic);
  }
  if (detail) {
    for (const x of [-0.74, -0.37, 0, 0.37, 0.74]) tube(base, [x, 2.0, 0.85], 0.036, 0.036, 0.06, p.stencil, 10).rotation.x = Math.PI / 2;
    for (const x of [-0.16, 0.16]) tube(base, [x, 0.94, 0.1], 0.026, 0.026, 0.1, p.stencil, 8);
    shell(base, [0.58, 2.46, -0.36], [0.46, 0.28, 0.4], p.edge, 0.2);
    if (p.hd) {
      for (const sx of [-1, 1]) fastener(base, [sx * 0.96, 2.16, 0.86], p, 0.028).rotation.x = Math.PI / 2;
      hose(base, [[-0.56, 2.46, -0.18], [0, 2.66, -0.26], [0.48, 2.52, -0.36]], 0.028, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Swing doors', 3.2, [
      rotationTrack('SaloonDoorL', 'y', [0, 1.0, 2.2, 3.2], [0, deg(-80), deg(-80), 0]),
      rotationTrack('SaloonDoorR', 'y', [0, 1.0, 2.2, 3.2], [0, deg(80), deg(80), 0]),
    ]),
  ];
}

function buildGeothermalTurbine(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'GeoTurbine');
  shell(base, [0, 0.14, 0], [2.62, 0.28, 2.04], p.dark, 0.26);
  // Borehole drum & open turbine rotor shroud
  tube(base, [-0.36, 0.88, 0], 0.82, 0.9, 1.24, p.primary, 16);
  ring(base, [-0.36, 1.54, 0], 0.88, 0.12, 0.16, p.edge);
  ring(base, [-0.36, 2.28, 0], 0.84, 0.1, 0.14, p.accent);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 4 * 2 + Math.PI / 4;
    strut(base, [-0.36 + Math.sin(a) * 0.8, 1.56, Math.cos(a) * 0.8], [-0.36 + Math.sin(a) * 0.78, 2.28, Math.cos(a) * 0.78], 0.056, p.dark, 10);
  }
  // Spinning steam turbine rotor (uses HD twisted airfoils in HD mode)
  const rotor = group(base, 'SteamRotor', [-0.36, 1.88, 0]);
  tube(rotor, [0, 0, 0], 0.22, 0.26, 0.54, p.alloy, 14);
  orb(rotor, [0, 0.3, 0], 0.2, p.accent, p.hd);
  for (let i = 0; i < 6; i++) {
    const arm = group(rotor, '', [0, 0, 0]);
    arm.rotation.y = i * Math.PI / 3;
    if (p.hd) {
      const blade = mesh(arm, airfoil(), p.alloy, [0, -0.02, 0]);
      blade.scale.set(1.22, 1.5, 1.4);
    } else {
      const blade = box(arm, [0.42, 0, 0], [0.54, 0.05, 0.16], p.alloy);
      blade.rotation.x = 0.38;
    }
    box(arm, [0.68, 0.02, 0], [0.08, 0.06, 0.16], p.accent);
  }
  // Side steam condenser stack & hinged exhaust louver
  shell(base, [0.84, 1.06, -0.04], [0.84, 1.62, 1.18], p.primary, 0.2);
  box(base, [0.84, 1.48, 0.54], [0.62, 0.52, 0.1], p.inset);
  strut(base, [0.22, 1.06, 0], [0.56, 1.06, 0], 0.16, p.edge, 12);
  const louver = group(base, 'VentLouver', [0.84, 1.72, 0.56]);
  shell(louver, [0, -0.24, 0.04], [0.68, 0.54, 0.09], p.accent, 0.18);
  for (const y of [-0.38, -0.24, -0.1]) box(louver, [0, y, 0.09], [0.56, 0.06, 0.06], p.dark);
  if (detail) {
    box(base, [-0.36, 0.96, 0.88], [0.34, 0.44, 0.08], p.dark);
    box(base, [-0.36, 1.02, 0.92], [0.22, 0.24, 0.048], p.optic);
    for (const y of [0.56, 0.84, 1.12]) box(base, [1.28, y, -0.04], [0.07, 0.12, 0.88], p.edge);
    tube(base, [0.84, 2.02, -0.22], 0.16, 0.2, 0.36, p.alloy, 12);
    if (p.hd) {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        fastener(base, [-0.36 + Math.sin(a) * 0.84, 1.62, Math.cos(a) * 0.84], p, 0.028);
      }
      hose(base, [[0.32, 0.62, 0.42], [0.64, 0.48, 0.62], [0.84, 0.72, 0.56]], 0.042, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Spin turbine', 3.0, [spinTrack('SteamRotor', 'y', 3.0, 2)]),
    new T.AnimationClip('Vent steam', 3.2, [rotationTrack('VentLouver', 'x', [0, 1.1, 2.1, 3.2], [0, deg(45), deg(45), 0])]),
  ];
}

function buildDesertRadarBunker(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'RadarBunker');
  shell(base, [0, 0.14, 0], [2.76, 0.28, 2.24], p.dark, 0.28);
  shell(base, [0, 0.68, -0.06], [2.52, 0.86, 1.94], p.primary, 0.34);
  shell(base, [0, 1.18, -0.14], [1.96, 0.26, 1.54], p.edge, 0.32);
  // Recessed armored observation visor slit
  box(base, [-0.48, 0.8, 0.92], [0.88, 0.24, 0.12], p.dark);
  box(base, [-0.48, 0.8, 0.96], [0.74, 0.12, 0.06], p.optic);
  // Front-right armored blast hatch vestibule
  shell(base, [0.58, 0.52, 0.84], [0.92, 0.72, 0.64], p.primary, 0.22);
  box(base, [0.58, 0.72, 0.9], [0.66, 0.28, 0.44], p.inset);
  const hatch = group(base, 'BlastHatch', [0.58, 0.92, 0.58]);
  shell(hatch, [0, -0.04, 0.32], [0.78, 0.12, 0.62], p.accent, 0.2);
  box(hatch, [0, 0.02, 0.34], [0.52, 0.06, 0.14], p.dark);
  // Rotating roof phased-array radar unit
  ring(base, [0, 1.36, -0.16], 0.52, 0.1, 0.14, p.dark);
  const radar = group(base, 'RadarArray', [0, 1.44, -0.16]);
  tube(radar, [0, 0.28, 0], 0.16, 0.22, 0.56, p.edge, 12);
  shell(radar, [0, 0.56, -0.14], [0.46, 0.28, 0.42], p.dark, 0.24);
  const arrayFace = shell(radar, [0, 0.76, 0.14], [1.62, 0.52, 0.16], p.accent, 0.24);
  arrayFace.rotation.x = -0.18;
  const grid = box(radar, [0, 0.76, 0.22], [1.38, 0.32, 0.06], p.alloy);
  grid.rotation.x = -0.18;
  strut(radar, [0, 0.76, 0.24], [0, 0.82, 0.52], 0.032, p.edge, 10);
  tube(radar, [0, 0.82, 0.54], 0.07, 0.05, 0.12, p.optic, 10).rotation.x = Math.PI / 2;
  if (detail) {
    for (const sx of [-1, 1]) {
      shell(base, [sx * 1.24, 0.54, -0.28], [0.28, 0.5, 0.84], p.accent, 0.22);
      strut(base, [sx * 0.86, 1.26, -0.76], [sx * 0.86, 1.98, -0.76], 0.018, p.alloy, 8);
    }
    for (const x of [-0.52, 0, 0.52]) box(radar, [x, 0.76, 0.25], [0.06, 0.34, 0.05], p.dark).rotation.x = -0.18;
    if (p.hd) {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        fastener(base, [Math.sin(a) * 0.46, 1.44, -0.16 + Math.cos(a) * 0.46], p, 0.026);
      }
      hose(base, [[-0.52, 1.26, -0.32], [-0.32, 1.54, -0.28], [-0.14, 1.62, -0.18]], 0.026, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Radar sweep', 4.8, [spinTrack('RadarArray', 'y', 4.8)]),
    new T.AnimationClip('Open blast hatch', 3.2, [rotationTrack('BlastHatch', 'x', [0, 1.1, 2.1, 3.2], [0, deg(-85), deg(-85), 0])]),
  ];
}

function buildFloatingSkyDock(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'SkyDock');
  // Grounded repulsor mooring cradle supporting cantilevered sky-dock deck
  ring(base, [0, 0.1, 0], 0.92, 0.18, 0.2, p.dark);
  tube(base, [0, 0.38, 0], 0.46, 0.62, 0.58, p.edge, 14);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      strut(base, [sx * 0.72, 0.16, sz * 0.66], [sx * 1.12, 0.68, sz * 0.8], 0.064, p.alloy, 10);
      tube(base, [sx * 1.18, 0.62, sz * 0.84], 0.22, 0.18, 0.24, p.dark, 12);
      ring(base, [sx * 1.18, 0.5, sz * 0.84], 0.2, 0.05, 0.08, p.optic);
    }
  }
  // Main octagonal skyport landing deck
  shell(base, [0, 0.82, -0.04], [2.88, 0.24, 1.98], p.primary, 0.26);
  shell(base, [0, 0.96, -0.04], [2.42, 0.08, 1.62], p.dark, 0.26);
  box(base, [0.36, 1.0, 0.02], [0.96, 0.05, 0.14], p.accent);
  for (const sx of [-0.08, 0.8]) box(base, [sx, 1.0, 0.02], [0.14, 0.05, 0.78], p.accent);
  // Flight-control bridge tower on port-aft deck
  shell(base, [-0.84, 1.48, -0.34], [0.88, 0.98, 0.96], p.primary, 0.22);
  shell(base, [-0.84, 1.72, -0.18], [0.76, 0.32, 0.74], p.optic, 0.2);
  shell(base, [-0.84, 2.02, -0.34], [0.94, 0.14, 1.0], p.edge, 0.22);
  // Rotating guidance beacon pylon atop control tower
  const beacon = group(base, 'BeaconPylon', [-0.84, 2.08, -0.34]);
  tube(beacon, [0, 0.28, 0], 0.09, 0.14, 0.56, p.alloy, 12);
  torus(beacon, [0, 0.44, 0], 0.26, 0.036, p.accent, p.hd);
  orb(beacon, [0, 0.44, 0], 0.12, p.optic, p.hd);
  for (const sx of [-0.34, 0.34]) box(beacon, [sx, 0.44, 0], [0.14, 0.08, 0.08], p.stencil);
  // Hinged front boarding gangway ramp (+35 deg tilts +z tip downward)
  const ramp = group(base, 'DockRamp', [0, 0.84, 0.92]);
  shell(ramp, [0, 0, 0.38], [1.14, 0.1, 0.74], p.edge, 0.14);
  box(ramp, [0, 0.04, 0.68], [1.04, 0.05, 0.12], p.accent);
  for (const sx of [-0.52, 0.52]) {
    strut(ramp, [sx, 0.06, 0.06], [sx, 0.34, 0.06], 0.024, p.alloy, 8);
    strut(ramp, [sx, 0.06, 0.68], [sx, 0.34, 0.68], 0.024, p.alloy, 8);
    strut(ramp, [sx, 0.34, 0.06], [sx, 0.34, 0.68], 0.024, p.accent, 8);
  }
  if (detail) {
    for (const sx of [-1.22, 1.22]) tube(base, [sx, 1.06, 0.64], 0.065, 0.08, 0.22, p.accent, 10);
    for (const x of [-0.14, 0.36, 0.86]) light(base, [x, 0.82, 0.94], [0.16, 0.09, 0.07], p);
    strut(base, [-1.18, 2.08, -0.68], [-1.18, 2.58, -0.68], 0.018, p.alloy, 8);
    if (p.hd) {
      for (const sx of [-0.52, 0.52]) fastener(base, [sx, 0.98, 0.86], p, 0.028);
      for (const sx of [-0.46, 0.46]) hose(base, [[sx, 0.72, 0.74], [sx, 0.62, 0.98], [sx, 0.76, 1.16]], 0.026, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Beacon sweep', 4.0, [spinTrack('BeaconPylon', 'y', 4.0)]),
    new T.AnimationClip('Deploy ramp', 3.4, [rotationTrack('DockRamp', 'x', [0, 1.1, 2.3, 3.4], [0, deg(35), deg(35), 0])]),
  ];
}

export const buildingsSciB: readonly SciBuildingAsset[] = [
  def(
    'fuel-silo-station', 'BS-08', 'Fuel Silo Station', '#c9c2b2', '#c84b31',
    'Pressurized industrial propellant silo depot with a spinning manifold valve wheel and top hatch.',
    [
      rig('ValveWheel', 'Valve wheel', 'rotate', 'z', [0, 360], 'Spins the front manifold shutoff handwheel'),
      rig('TankHatch', 'Tank hatch', 'rotate', 'x', [0, -80], 'Swings the top silo inspection hatch open'),
    ],
    [],
    buildFuelSiloStation,
  ),
  def(
    'monorail-platform', 'BS-09', 'Monorail Platform', '#486b82', '#f2a93b',
    'Elevated futuristic transit platform with sliding safety screen doors and a detachable commuter bench.',
    [
      rig('ScreenDoorL', 'Left screen door', 'slide', 'x', [0, -0.4], 'Slides the left platform safety door open'),
      rig('ScreenDoorR', 'Right screen door', 'slide', 'x', [0, 0.4], 'Slides the right platform safety door open'),
    ],
    [det('BenchUnit', 'Bench unit', 'Modular waiting bench seated along the station deck')],
    buildMonorailPlatform,
  ),
  def(
    'fortress-drawbridge', 'BS-10', 'Fortress Drawbridge', '#6d6963', '#b84a2e',
    'Moat-fronted stone fortress entry with a lowering timber drawbridge and detachable heraldic banners.',
    [rig('Drawbridge', 'Drawbridge', 'rotate', 'x', [0, 75], 'Lowers the timber drawbridge forward across the moat')],
    [det('BannerFlags', 'Banner flags', 'Twin swallowtail heraldic banners mounted on the parapets')],
    buildFortressDrawbridge,
  ),
  def(
    'neon-arcade-booth', 'BS-11', 'Neon Arcade Booth', '#3f3466', '#f04c8a',
    'Synthwave cyberpunk street arcade kiosk with illuminated marquee and twin swinging batwing doors.',
    [
      rig('SaloonDoorL', 'Left saloon door', 'rotate', 'y', [0, -80], 'Swings the left arcade entrance door outward'),
      rig('SaloonDoorR', 'Right saloon door', 'rotate', 'y', [0, 80], 'Swings the right arcade entrance door outward'),
    ],
    [],
    buildNeonArcadeBooth,
  ),
  def(
    'geothermal-turbine', 'BS-12', 'Geothermal Turbine', '#5c7a74', '#d96b27',
    'Industrial steam power generator with an exposed vertical turbine rotor and tilting exhaust louver.',
    [
      rig('SteamRotor', 'Steam rotor', 'rotate', 'y', [0, 360], 'Spins the six-blade vertical steam turbine rotor'),
      rig('VentLouver', 'Vent louver', 'rotate', 'x', [0, 45], 'Tilts the condenser exhaust louver open'),
    ],
    [],
    buildGeothermalTurbine,
  ),
  def(
    'desert-radar-bunker', 'BS-13', 'Desert Radar Bunker', '#c2a67d', '#4a6b5d',
    'Armored desert listening bunker with a rotating roof phased-array radar and hinged blast hatch.',
    [
      rig('RadarArray', 'Radar array', 'rotate', 'y', [0, 360], 'Rotates the rooftop tactical radar array'),
      rig('BlastHatch', 'Blast hatch', 'rotate', 'x', [0, -85], 'Swings the armored entrance blast hatch upward'),
    ],
    [],
    buildDesertRadarBunker,
  ),
  def(
    'floating-sky-dock', 'BS-14', 'Floating Sky Dock', '#527894', '#e89b32',
    'Repulsor-lifted airship docking pad with a deploying boarding ramp and rotating guidance beacon.',
    [
      rig('DockRamp', 'Dock ramp', 'rotate', 'x', [0, 35], 'Tilts the front airship boarding ramp downward'),
      rig('BeaconPylon', 'Beacon pylon', 'rotate', 'y', [0, 360], 'Rotates the flight-control guidance beacon'),
    ],
    [],
    buildFloatingSkyDock,
  ),
];
