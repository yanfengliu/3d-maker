import * as T from 'three';
import { box, group, light, mesh, ring, rotationTrack, shell, spinTrack, strut, tube } from '../parts';
import type { Finish, Point } from '../parts';
import { fastener } from '../hd-detail';
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema';
import type { BrowseCategory } from '../../data/browse';

interface VehicleAssetDef {
  id: string;
  code: string;
  category: 'Object';
  browseCategory: BrowseCategory;
  name: string;
  primary: string;
  accent: string;
  description: string;
  physicsBody: 'dynamic';
  riggedParts: readonly RiggedPartSpec[];
  detachableParts: readonly DetachablePartSpec[];
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

function dome(parent: T.Object3D, at: Point, scale: Point, mat: T.Material, hd: boolean) {
  const part = mesh(parent, new T.SphereGeometry(1, hd ? 26 : 10, hd ? 16 : 8), mat, at);
  part.scale.set(...scale);
  return part;
}

function torus(parent: T.Object3D, at: Point, r: number, t: number, mat: T.Material, hd: boolean) {
  return mesh(parent, new T.TorusGeometry(r, t, hd ? 16 : 8, hd ? 32 : 14), mat, at);
}

function wheel(parent: T.Object3D, name: string, at: Point, r: number, w: number, p: Finish, detail: boolean, rim: T.Material = p.alloy, lugs = 0) {
  const hub = group(parent, name, at);
  const axle = group(hub, '');
  axle.rotation.z = Math.PI / 2;
  tube(axle, [0, 0, 0], r, r, w, p.tire, 14);
  tube(axle, [0, 0, 0], r * 0.62, r * 0.62, w * 1.06, rim, 12);
  tube(axle, [0, 0, 0], r * 0.25, r * 0.25, w * 1.16, p.dark, 10);
  if (detail) {
    for (let i = 0; i < lugs; i++) {
      const a = (i * Math.PI * 2) / lugs;
      const lug = group(axle, '', [Math.sin(a) * r, 0, Math.cos(a) * r]);
      lug.rotation.y = a;
      box(lug, [0, 0, 0], [r * 0.26, w * 0.96, 0.045], p.tire);
    }
    if (p.hd) fastener(axle, [0, w * 0.58, 0], p, Math.min(0.032, r * 0.1));
  }
  return hub;
}

function wheelPair(parent: T.Object3D, x: number, r: number, z: number, w: number, p: Finish, detail: boolean, rim: T.Material, lugs = 0, names: readonly [string, string] = ['', '']) {
  wheel(parent, names[0], [x, r, z], r, w, p, detail, rim, lugs);
  wheel(parent, names[1], [-x, r, z], r, w, p, detail, rim, lugs);
}

function buildDeepSubmersible(root: T.Group, p: Finish, detail: boolean) {
  const sub = group(root, 'Submersible');
  for (const s of [-1, 1]) {
    shell(sub, [s * 0.56, 0.06, 0.02], [0.16, 0.12, 1.76], p.dark, 0.48);
    strut(sub, [s * 0.44, 0.44, 0.46], [s * 0.56, 0.10, 0.52], 0.045, p.edge, 10);
    strut(sub, [s * 0.44, 0.44, -0.46], [s * 0.56, 0.10, -0.52], 0.045, p.edge, 10);
    tube(sub, [s * 0.60, 0.66, -0.14], 0.18, 0.18, 1.06, p.accent, 14).rotation.x = Math.PI / 2;
  }
  dome(sub, [0, 0.76, 0.18], [0.58, 0.54, 0.64], p.primary, p.hd);
  dome(sub, [0, 0.74, 0.66], [0.36, 0.34, 0.28], p.optic, p.hd);
  torus(sub, [0, 0.74, 0.68], 0.37, 0.045, p.alloy, p.hd);
  tube(sub, [0, 0.76, -0.58], 0.22, 0.48, 0.96, p.primary, 16).rotation.x = Math.PI / 2;
  tube(sub, [0, 1.34, 0.14], 0.24, 0.28, 0.24, p.accent, 14);
  strut(sub, [-0.42, 1.38, 0.56], [0.42, 1.38, 0.56], 0.028, p.edge, 8);
  for (const s of [-1, 1]) {
    strut(sub, [s * 0.2, 1.36, 0.22], [s * 0.28, 1.38, 0.56], 0.026, p.edge, 8);
    light(sub, [s * 0.32, 1.38, 0.62], [0.16, 0.12, 0.12], p);
  }
  ring(sub, [0, 0.76, -1.16], 0.30, 0.055, 0.28, p.dark).rotation.x = Math.PI / 2;
  const prop = group(sub, 'SternProp', [0, 0.76, -1.16]);
  tube(prop, [0, 0, 0], 0.08, 0.07, 0.26, p.alloy, 12).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const arm = group(prop, '');
    arm.rotation.z = (i * Math.PI) / 2;
    box(arm, [0, 0.15, 0], [0.065, 0.22, 0.03], p.accent).rotation.y = 0.35;
  }
  for (const [side, name] of [[1, 'GrabArmL'], [-1, 'GrabArmR']] as const) {
    const arm = group(sub, name, [side * 0.44, 0.38, 0.68]);
    dome(arm, [0, 0, 0], [0.08, 0.08, 0.08], p.dark, p.hd);
    strut(arm, [0, 0, 0], [-side * 0.08, -0.04, 0.44], 0.036, p.alloy, 10);
    shell(arm, [-side * 0.08, -0.04, 0.46], [0.11, 0.10, 0.12], p.accent, 0.35);
    strut(arm, [-side * 0.04, -0.04, 0.50], [-side * 0.12, -0.04, 0.66], 0.02, p.edge, 8);
    strut(arm, [-side * 0.12, -0.04, 0.50], [-side * 0.04, -0.04, 0.66], 0.02, p.edge, 8);
  }
  if (detail) {
    shell(sub, [0, 1.12, -0.68], [0.08, 0.42, 0.48], p.accent, 0.36);
    for (const s of [-1, 1]) {
      box(sub, [s * 0.58, 0.76, -0.64], [0.36, 0.07, 0.32], p.primary);
      if (p.hd) fastener(sub, [s * 0.60, 0.84, 0.18], p, 0.028);
    }
  }
  root.animations = [
    new T.AnimationClip('Deep dive', 3.0, [
      spinTrack('SternProp', 'z', 3.0, 5),
      rotationTrack('GrabArmL', 'y', [0, 0.75, 2.25, 3.0], [0, -0.48, 0.36, 0]),
      rotationTrack('GrabArmR', 'y', [0, 0.75, 2.25, 3.0], [0, 0.48, -0.36, 0]),
    ]),
    new T.AnimationClip('Sample grab', 2.4, [
      rotationTrack('GrabArmL', 'y', [0, 0.8, 1.6, 2.4], [0, -0.52, -0.52, 0]),
      rotationTrack('GrabArmR', 'y', [0, 0.8, 1.6, 2.4], [0, 0.52, 0.52, 0]),
    ]),
  ];
}

function buildParcelDeliveryVan(root: T.Group, p: Finish, detail: boolean) {
  const van = group(root, 'VanBody');
  shell(van, [0, 0.38, 0.02], [1.26, 0.22, 3.04], p.dark, 0.28);
  shell(van, [0, 0.36, 1.56], [1.32, 0.22, 0.20], p.tire, 0.32);
  shell(van, [0, 0.32, -1.56], [1.30, 0.16, 0.22], p.edge, 0.28);
  wheelPair(van, 0.64, 0.30, 0.94, 0.18, p, detail, p.alloy, 0, ['WheelFL', 'WheelFR']);
  wheelPair(van, 0.64, 0.30, -0.88, 0.18, p, detail, p.alloy, 0, ['WheelRL', 'WheelRR']);
  shell(van, [0, 0.86, 1.12], [1.30, 0.74, 0.88], p.primary, 0.36);
  shell(van, [0, 1.44, 0.84], [1.26, 0.56, 0.72], p.primary, 0.38);
  box(van, [0, 1.38, 1.24], [1.06, 0.44, 0.05], p.optic).rotation.x = -0.34;
  shell(van, [0, 1.80, -0.44], [1.34, 0.14, 2.20], p.primary, 0.34);
  shell(van, [0, 0.52, -0.44], [1.26, 0.10, 2.12], p.inset, 0.2);
  shell(van, [0, 1.14, 0.56], [1.18, 1.18, 0.08], p.dark, 0.2);
  for (const s of [-1, 1]) {
    shell(van, [s * 0.62, 1.14, -0.44], [0.10, 1.24, 2.18], p.primary, 0.2);
    box(van, [s * 0.68, 0.96, -0.44], [0.025, 0.18, 2.02], p.accent);
    box(van, [s * 0.64, 1.38, 0.86], [0.03, 0.34, 0.48], p.optic);
    light(van, [s * 0.44, 0.70, 1.56], [0.22, 0.13, 0.06], p);
  }
  box(van, [-0.24, 0.80, -0.78], [0.46, 0.44, 0.52], p.accent);
  box(van, [0.26, 0.76, -0.84], [0.44, 0.36, 0.46], p.stencil);
  box(van, [-0.18, 1.16, -0.82], [0.38, 0.28, 0.40], p.accent);
  box(van, [0, 1.74, -1.50], [1.26, 0.09, 0.10], p.primary);
  for (const [side, name] of [[1, 'RearDoorL'], [-1, 'RearDoorR']] as const) {
    const door = group(van, name, [side * 0.60, 1.14, -1.52]);
    shell(door, [-side * 0.298, 0, 0], [0.594, 1.20, 0.07], p.primary, 0.22);
    box(door, [-side * 0.30, 0.28, -0.04], [0.38, 0.34, 0.02], p.optic);
    box(door, [-side * 0.52, -0.06, -0.045], [0.04, 0.14, 0.03], p.dark);
  }
  if (detail) {
    box(van, [0, 0.68, 1.565], [0.56, 0.20, 0.03], p.inset);
    for (const s of [-1, 1]) {
      strut(van, [s * 0.61, 1.28, 1.08], [s * 0.74, 1.28, 1.10], 0.018, p.dark, 8);
      box(van, [s * 0.74, 1.30, 1.10], [0.10, 0.18, 0.05], p.dark);
      box(van, [s * 0.68, 1.24, -0.44], [0.025, 0.06, 1.98], p.stencil);
      if (p.hd) fastener(van, [s * 0.60, 1.60, -1.54], p, 0.024).rotation.x = Math.PI / 2;
    }
  }
  root.animations = [
    new T.AnimationClip('Delivery drive', 2.8, [
      spinTrack('WheelFL', 'x', 2.8, 2), spinTrack('WheelFR', 'x', 2.8, 2),
      spinTrack('WheelRL', 'x', 2.8, 2), spinTrack('WheelRR', 'x', 2.8, 2),
    ]),
    new T.AnimationClip('Open rear doors', 3.2, [
      rotationTrack('RearDoorL', 'y', [0, 1.0, 2.2, 3.2], [0, -1.85, -1.85, 0]),
      rotationTrack('RearDoorR', 'y', [0, 1.0, 2.2, 3.2], [0, 1.85, 1.85, 0]),
    ]),
  ];
}

function buildHotAirBalloon(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Balloon');
  const rows = p.hd ? 26 : 12;
  const pts = Array.from({ length: rows + 1 }, (_, i) => {
    const t = i / rows;
    return new T.Vector2(t < 0.1 ? 0.30 + t * 2.2 : Math.max(0.02, Math.sin(Math.pow(t, 0.66) * Math.PI) * 1.02), 1.32 + t * 2.40);
  });
  const envGeo = new T.LatheGeometry(pts, p.hd ? 48 : 16);
  envGeo.computeVertexNormals();
  mesh(b, envGeo, p.primary, [0, 0, 0]);
  ring(b, [0, 2.66, 0], 1.03, 0.055, 0.34, p.accent);
  tube(b, [0, 3.74, 0], 0.16, 0.22, 0.08, p.accent, 14);
  ring(b, [0, 1.34, 0], 0.34, 0.05, 0.14, p.dark);
  shell(b, [0, 1.14, 0], [0.46, 0.08, 0.46], p.edge, 0.35);
  for (const s of [-1, 1]) tube(b, [s * 0.11, 1.24, 0], 0.075, 0.06, 0.12, p.alloy, 12);
  const gondola = group(b, 'Gondola', [0, 1.12, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(gondola, [sx * 0.20, 0, sz * 0.20], [sx * 0.34, -0.50, sz * 0.34], 0.018, p.edge, 8);
  shell(gondola, [0, -0.82, 0], [0.76, 0.58, 0.76], p.accent, 0.32);
  shell(gondola, [0, -0.52, 0], [0.80, 0.10, 0.80], p.dark, 0.38);
  shell(gondola, [0, -1.085, 0], [0.74, 0.08, 0.74], p.dark, 0.34);
  const sandbags = group(gondola, 'Sandbags', [0, -0.74, 0]);
  for (const [x, z] of [[0.42, 0.18], [0.42, -0.18], [-0.42, 0.18], [-0.42, -0.18]] as const) {
    dome(sandbags, [x, 0, z], [0.075, 0.11, 0.075], p.stencil, p.hd);
    tube(sandbags, [x, 0.11, z], 0.03, 0.05, 0.05, p.dark, 8);
  }
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const curvePts = Array.from({ length: 9 }, (_, k) => {
        const t = k / 8;
        const r = (t < 0.1 ? 0.30 + t * 2.2 : Math.max(0.06, Math.sin(Math.pow(t, 0.66) * Math.PI) * 1.03)) + 0.014;
        return new T.Vector3(Math.cos(a) * r, 1.36 + t * 2.34, Math.sin(a) * r);
      });
      mesh(b, new T.TubeGeometry(new T.CatmullRomCurve3(curvePts), p.hd ? 22 : 10, 0.022, p.hd ? 8 : 5), i % 2 === 0 ? p.accent : p.stencil, [0, 0, 0]);
    }
    if (p.hd) for (const sx of [-1, 1]) fastener(gondola, [sx * 0.36, -0.52, 0.36], p, 0.024);
  }
  root.animations = [new T.AnimationClip('Gentle drift', 3.6, [rotationTrack('Gondola', 'z', [0, 0.9, 2.7, 3.6], [0, 0.22, -0.22, 0])])];
}

function buildFarmTractor(root: T.Group, p: Finish, detail: boolean) {
  const tr = group(root, 'Tractor');
  shell(tr, [0, 0.58, 0.08], [0.64, 0.36, 1.72], p.dark, 0.3);
  shell(tr, [0, 1.00, 0.42], [0.68, 0.52, 1.14], p.primary, 0.42);
  shell(tr, [0, 1.02, 0.98], [0.62, 0.44, 0.12], p.dark, 0.34);
  tube(tr, [0.36, 1.44, 0.56], 0.048, 0.055, 0.62, p.edge, 12);
  shell(tr, [0, 1.18, -0.56], [0.82, 0.24, 0.72], p.primary, 0.34);
  shell(tr, [0, 1.34, -0.58], [0.46, 0.28, 0.40], p.tire, 0.36);
  strut(tr, [-0.46, 0.88, 0.12], [0.46, 0.88, 0.12], 0.055, p.dark, 10);
  for (const s of [-1, 1]) {
    box(tr, [s * 0.48, 1.12, -0.56], [0.22, 0.08, 0.56], p.primary);
    shell(tr, [s * 0.62, 1.08, -0.56], [0.36, 0.12, 0.88], p.primary, 0.42);
    strut(tr, [s * 0.42, 1.16, -0.84], [s * 0.40, 1.94, -0.80], 0.036, p.dark, 10);
    strut(tr, [s * 0.40, 1.16, -0.18], [s * 0.38, 1.94, -0.24], 0.032, p.dark, 10);
    light(tr, [s * 0.28, 1.04, 1.04], [0.14, 0.12, 0.07], p);
    strut(tr, [s * 0.46, 0.88, 0.12], [s * 0.48, 1.02, 0.94], 0.05, p.dark, 10);
    strut(tr, [s * 0.48, 1.02, 0.94], [s * 0.50, 0.48, 1.32], 0.048, p.dark, 10);
  }
  shell(tr, [0, 1.96, -0.52], [0.96, 0.09, 0.86], p.accent, 0.36);
  tube(tr, [0, 0.56, -0.56], 0.075, 0.075, 1.32, p.dark, 10).rotation.z = Math.PI / 2;
  tube(tr, [0, 0.34, 0.78], 0.055, 0.055, 1.08, p.dark, 10).rotation.z = Math.PI / 2;
  wheelPair(tr, 0.66, 0.56, -0.56, 0.30, p, detail, p.accent, 12, ['RearWheelL', 'RearWheelR']);
  wheelPair(tr, 0.54, 0.34, 0.78, 0.18, p, detail, p.accent, 8, ['FrontWheelL', 'FrontWheelR']);
  const bucket = group(tr, 'FrontBucket', [0, 0.48, 1.32]);
  shell(bucket, [0, -0.06, 0.06], [1.28, 0.48, 0.10], p.accent, 0.22);
  shell(bucket, [0, -0.28, 0.28], [1.28, 0.08, 0.52], p.edge, 0.2);
  shell(bucket, [0, 0.14, 0.20], [1.28, 0.08, 0.36], p.accent, 0.22);
  for (const s of [-1, 1]) shell(bucket, [s * 0.61, -0.06, 0.26], [0.08, 0.46, 0.48], p.accent, 0.24);
  if (detail) {
    strut(tr, [0, 1.12, -0.18], [0, 1.36, -0.32], 0.03, p.dark, 8);
    torus(tr, [0, 1.38, -0.34], 0.14, 0.024, p.tire, p.hd).rotation.x = 1.0;
    for (const s of [-1, 1]) {
      box(tr, [s * 0.35, 1.04, 0.42], [0.02, 0.09, 0.96], p.accent);
      if (p.hd) fastener(tr, [s * 0.48, 1.02, 0.94], p, 0.032);
    }
  }
  root.animations = [
    new T.AnimationClip('Field work', 3.2, [
      spinTrack('RearWheelL', 'x', 3.2, 2), spinTrack('RearWheelR', 'x', 3.2, 2),
      spinTrack('FrontWheelL', 'x', 3.2, 3), spinTrack('FrontWheelR', 'x', 3.2, 3),
      rotationTrack('FrontBucket', 'x', [0, 0.8, 2.2, 3.2], [0, -0.4, 0.72, 0]),
    ]),
    new T.AnimationClip('Dump bucket', 2.4, [rotationTrack('FrontBucket', 'x', [0, 0.7, 1.6, 2.4], [0, 0.76, 0.76, 0])]),
  ];
}

function buildArcticSnowcat(root: T.Group, p: Finish, detail: boolean) {
  const cat = group(root, 'Snowcat');
  for (const s of [-1, 1]) {
    shell(cat, [s * 0.64, 0.24, -0.04], [0.42, 0.48, 2.28], p.tire, 0.56);
    shell(cat, [s * 0.64, 0.26, -0.04], [0.34, 0.30, 1.94], p.dark, 0.48);
    for (const z of [-0.88, -0.44, 0, 0.44, 0.88]) tube(cat, [s * 0.66, 0.24, z], 0.16, 0.16, 0.41, p.edge, 12).rotation.z = Math.PI / 2;
  }
  shell(cat, [0, 0.62, -0.02], [1.34, 0.30, 2.38], p.dark, 0.32);
  shell(cat, [0, 1.14, 0.56], [1.36, 0.84, 1.18], p.primary, 0.34);
  shell(cat, [0, 1.18, -0.58], [1.34, 0.90, 1.18], p.primary, 0.28);
  shell(cat, [0, 1.62, -0.04], [1.32, 0.12, 2.24], p.accent, 0.38);
  box(cat, [0, 1.24, 1.135], [1.08, 0.40, 0.07], p.optic);
  for (const s of [-1, 1]) {
    box(cat, [s * 0.685, 1.24, 0.60], [0.03, 0.36, 0.66], p.optic);
    box(cat, [s * 0.675, 1.24, -0.58], [0.03, 0.34, 0.72], p.optic);
    light(cat, [s * 0.44, 0.86, 1.18], [0.22, 0.12, 0.06], p);
    strut(cat, [s * 0.42, 0.46, 1.06], [s * 0.42, 0.36, 1.48], 0.045, p.alloy, 10);
  }
  const beacon = group(cat, 'RoofBeacon', [0, 1.67, 0.68]);
  tube(beacon, [0, 0.04, 0], 0.11, 0.13, 0.08, p.dark, 12);
  dome(beacon, [0, 0.14, 0], [0.095, 0.11, 0.095], p.accent, p.hd);
  box(beacon, [0, 0.14, 0.08], [0.06, 0.12, 0.05], p.stencil);
  const rack = group(cat, 'RoofRack', [0, 1.67, -0.56]);
  box(rack, [0, 0.02, 0], [1.04, 0.04, 0.92], p.dark);
  for (const s of [-1, 1]) {
    strut(rack, [s * 0.52, 0.10, -0.46], [s * 0.52, 0.10, 0.46], 0.024, p.dark, 8);
    for (const z of [-0.42, 0.42]) strut(rack, [s * 0.52, 0, z], [s * 0.52, 0.10, z], 0.022, p.dark, 8);
  }
  for (const z of [-0.46, 0.46]) strut(rack, [-0.52, 0.10, z], [0.52, 0.10, z], 0.024, p.dark, 8);
  shell(rack, [-0.20, 0.14, -0.06], [0.46, 0.22, 0.62], p.edge, 0.28);
  shell(rack, [0.26, 0.15, 0.02], [0.34, 0.24, 0.48], p.accent, 0.28);
  const plow = group(cat, 'SnowPlow', [0, 0.36, 1.38]);
  shell(plow, [0, 0.04, 0.14], [1.78, 0.54, 0.14], p.accent, 0.24);
  shell(plow, [0, -0.22, 0.22], [1.80, 0.08, 0.14], p.edge, 0.2);
  shell(plow, [0, 0.30, 0.18], [1.76, 0.08, 0.14], p.primary, 0.24);
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [-0.94, -0.56, -0.18, 0.20, 0.58, 0.96]) box(cat, [s * 0.64, 0.49, z], [0.40, 0.03, 0.07], p.edge);
      box(cat, [s * 0.685, 0.90, 0.02], [0.025, 0.09, 2.08], p.stencil);
    }
    if (p.hd) for (const x of [-0.60, 0, 0.60]) fastener(plow, [x, 0.06, 0.22], p, 0.028).rotation.x = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Polar patrol', 3.0, [spinTrack('RoofBeacon', 'y', 3.0, 3), rotationTrack('SnowPlow', 'x', [0, 0.75, 2.25, 3.0], [0, -0.32, 0.38, 0])]),
    new T.AnimationClip('Plow tilt', 2.4, [rotationTrack('SnowPlow', 'x', [0, 0.8, 1.6, 2.4], [0, 0.42, -0.32, 0])]),
  ];
}

function buildLunarLander(root: T.Group, p: Finish, detail: boolean) {
  const ln = group(root, 'Lander');
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const ca = Math.cos(a), sa = Math.sin(a);
    tube(ln, [ca * 1.10, 0.04, sa * 1.10], 0.19, 0.23, 0.08, p.accent, 14);
    strut(ln, [ca * 0.64, 0.96, sa * 0.64], [ca * 1.10, 0.08, sa * 1.10], 0.04, p.alloy, 10);
    strut(ln, [ca * 0.62, 0.58, sa * 0.62], [ca * 0.92, 0.42, sa * 0.92], 0.028, p.edge, 8);
  }
  shell(ln, [0, 0.84, 0], [1.44, 0.58, 1.44], p.accent, 0.56);
  tube(ln, [0, 0.38, 0], 0.16, 0.32, 0.36, p.dark, 16);
  shell(ln, [0, 1.56, -0.02], [1.18, 0.82, 1.16], p.primary, 0.48);
  shell(ln, [0, 1.98, -0.04], [0.84, 0.14, 0.86], p.dark, 0.48);
  for (const s of [-1, 1]) {
    box(ln, [s * 0.26, 1.66, 0.57], [0.26, 0.24, 0.05], p.optic).rotation.y = s * 0.18;
    shell(ln, [s * 0.62, 1.56, -0.14], [0.22, 0.50, 0.64], p.edge, 0.45);
  }
  const ramp = group(ln, 'LandingRamp', [0, 0.60, 0.72]);
  shell(ramp, [0, 0.28, 0.03], [0.54, 0.58, 0.07], p.alloy, 0.22);
  for (const y of [0.10, 0.24, 0.38, 0.50]) box(ramp, [0, y, 0.075], [0.40, 0.032, 0.03], p.dark);
  tube(ln, [0.24, 2.12, -0.16], 0.045, 0.055, 0.22, p.edge, 10);
  const dish = group(ln, 'CommDish', [0.24, 2.26, -0.16]);
  strut(dish, [0, -0.05, 0], [0, 0.14, 0.06], 0.032, p.edge, 10);
  dome(dish, [0, 0.14, 0.06], [0.05, 0.05, 0.05], p.dark, p.hd);
  const cup = group(dish, '', [0, 0.14, 0.06]);
  cup.rotation.x = 0.95;
  const dishGeo = new T.LatheGeometry([0, 1, 2, 3, 4, 5].map(i => new T.Vector2(0.02 + i * 0.07, 0.015 * i * i)), p.hd ? 40 : 14);
  dishGeo.computeVertexNormals();
  mesh(cup, dishGeo, p.stencil, [0, 0, 0]);
  tube(cup, [0, 0.26, 0], 0.04, 0.03, 0.10, p.accent, 10);
  strut(cup, [0, 0, 0], [0, 0.24, 0], 0.018, p.alloy, 8);
  if (detail) {
    for (const s of [-1, 1]) {
      for (const f of [-1, 1]) {
        strut(ln, [s * 0.50, 1.72, f * 0.44], [s * 0.66, 1.72, f * 0.44], 0.026, p.alloy, 8);
        const rcs = group(ln, '', [s * 0.66, 1.72, f * 0.44]);
        shell(rcs, [0, 0, 0], [0.12, 0.14, 0.12], p.dark, 0.32);
        tube(rcs, [0, 0.10, 0], 0.03, 0.018, 0.08, p.alloy, 8);
      }
      if (p.hd) fastener(ln, [s * 0.44, 1.14, 0.66], p, 0.026);
    }
  }
  root.animations = [
    new T.AnimationClip('Lunar ops', 3.4, [spinTrack('CommDish', 'y', 3.4, 2), rotationTrack('LandingRamp', 'x', [0, 1.0, 2.4, 3.4], [0, 1.12, 1.12, 0])]),
    new T.AnimationClip('Dish scan', 2.4, [spinTrack('CommDish', 'y', 2.4, 2)]),
  ];
}

function buildRacingHoverbike(root: T.Group, p: Finish, detail: boolean) {
  const bike = group(root, 'Hoverbike');
  for (const s of [-1, 1]) {
    shell(bike, [s * 0.34, 0.04, -0.02], [0.11, 0.08, 1.44], p.dark, 0.55);
    strut(bike, [s * 0.24, 0.34, 0.34], [s * 0.34, 0.07, 0.42], 0.03, p.edge, 8);
    strut(bike, [s * 0.24, 0.34, -0.38], [s * 0.34, 0.07, -0.44], 0.03, p.edge, 8);
  }
  ring(bike, [0, 0.48, 0.18], 0.26, 0.055, 0.72, p.dark).rotation.x = Math.PI / 2;
  const turbine = group(bike, 'TurbineCore', [0, 0.48, 0.22]);
  tube(turbine, [0, 0, 0], 0.085, 0.085, 0.32, p.accent, 14).rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const bl = group(turbine, '');
    bl.rotation.z = (i * Math.PI) / 3;
    box(bl, [0, 0.14, 0], [0.055, 0.18, 0.04], p.alloy).rotation.y = 0.42;
  }
  shell(bike, [0, 0.60, -0.44], [0.54, 0.34, 1.32], p.primary, 0.52);
  shell(bike, [0, 0.78, -0.32], [0.38, 0.12, 0.68], p.tire, 0.46);
  shell(bike, [0, 0.74, -0.98], [0.40, 0.18, 0.48], p.accent, 0.52);
  for (const s of [-1, 1]) {
    shell(bike, [s * 0.28, 0.52, 0.74], [0.22, 0.24, 1.18], p.primary, 0.54);
    shell(bike, [s * 0.42, 0.52, -0.14], [0.26, 0.26, 1.06], p.primary, 0.54);
    shell(bike, [s * 0.48, 0.52, -0.22], [0.16, 0.08, 0.88], p.accent, 0.5);
    tube(bike, [s * 0.18, 0.54, -1.16], 0.09, 0.11, 0.24, p.edge, 12).rotation.x = Math.PI / 2;
    light(bike, [s * 0.28, 0.56, 1.32], [0.14, 0.08, 0.06], p);
  }
  const bars = group(bike, 'Handlebars', [0, 0.78, 0.44]);
  tube(bars, [0, -0.07, 0], 0.05, 0.06, 0.18, p.dark, 10);
  shell(bars, [0, 0.08, 0.10], [0.34, 0.18, 0.26], p.accent, 0.48);
  box(bars, [0, 0.16, 0.18], [0.28, 0.14, 0.04], p.optic).rotation.x = -0.58;
  strut(bars, [-0.42, 0.04, -0.06], [0.42, 0.04, -0.06], 0.026, p.alloy, 10);
  for (const s of [-1, 1]) tube(bars, [s * 0.40, 0.04, -0.06], 0.036, 0.036, 0.18, p.tire, 10).rotation.z = Math.PI / 2;
  if (detail) {
    for (const s of [-1, 1]) {
      shell(bike, [s * 0.21, 0.78, -1.04], [0.06, 0.24, 0.36], p.primary, 0.42);
      box(bike, [s * 0.38, 0.54, 0.74], [0.025, 0.06, 0.92], p.stencil);
      if (p.hd) fastener(bike, [s * 0.44, 0.64, -0.14], p, 0.024);
    }
  }
  root.animations = [
    new T.AnimationClip('Race rev', 2.4, [spinTrack('TurbineCore', 'z', 2.4, 5), rotationTrack('Handlebars', 'y', [0, 0.6, 1.8, 2.4], [0, 0.4, -0.4, 0])]),
    new T.AnimationClip('Turbine idle', 1.6, [spinTrack('TurbineCore', 'z', 1.6, 4)]),
  ];
}

function buildArmoredRailcar(root: T.Group, p: Finish, detail: boolean) {
  const rc = group(root, 'Railcar');
  shell(rc, [0, 0.40, 0], [1.24, 0.22, 3.44], p.dark, 0.22);
  for (const bz of [-1.06, 1.06]) {
    shell(rc, [0, 0.28, bz], [1.14, 0.22, 0.88], p.edge, 0.28);
    for (const dz of [-0.28, 0.28]) wheelPair(rc, 0.54, 0.24, bz + dz, 0.10, p, detail, p.edge);
  }
  for (const ez of [-1, 1]) {
    shell(rc, [0, 0.52, ez * 1.76], [1.16, 0.30, 0.24], p.dark, 0.42);
    for (const s of [-1, 1]) tube(rc, [s * 0.40, 0.44, ez * 1.88], 0.08, 0.07, 0.12, p.alloy, 12).rotation.x = Math.PI / 2;
  }
  shell(rc, [0, 0.94, 0], [1.34, 0.92, 3.32], p.primary, 0.34);
  shell(rc, [0, 1.44, 0], [1.14, 0.18, 3.04], p.primary, 0.4);
  box(rc, [0.62, 0.90, -0.18], [0.12, 0.72, 0.58], p.inset);
  const hatchBase: Point = [0.68, 0.90, -0.18];
  const hatch = group(rc, 'SideHatch', hatchBase);
  shell(hatch, [0, 0, 0], [0.08, 0.74, 0.56], p.accent, 0.22);
  box(hatch, [0.045, 0.14, 0], [0.02, 0.14, 0.34], p.optic);
  box(hatch, [0.048, -0.06, -0.18], [0.025, 0.16, 0.05], p.dark);
  ring(rc, [0, 1.56, 0.24], 0.44, 0.06, 0.10, p.dark);
  const turret = group(rc, 'RoofTurret', [0, 1.62, 0.24]);
  shell(turret, [0, 0.14, -0.04], [0.76, 0.32, 0.82], p.primary, 0.48);
  shell(turret, [0, 0.32, -0.10], [0.40, 0.08, 0.42], p.accent, 0.5);
  for (const s of [-1, 1]) tube(turret, [s * 0.12, 0.16, 0.58], 0.045, 0.055, 0.66, p.edge, 12).rotation.x = Math.PI / 2;
  box(turret, [0, 0.20, 0.38], [0.28, 0.09, 0.04], p.optic);
  if (detail) {
    for (const y of [0.50, 1.30]) box(rc, [0.67, y, 0.04], [0.05, 0.045, 1.12], p.dark);
    for (const s of [-1, 1]) {
      for (const z of [-1.06, 0.86]) box(rc, [s * 0.675, 1.06, z], [0.03, 0.12, 0.44], p.optic);
      box(rc, [s * 0.675, 0.68, 0], [0.025, 0.09, 3.06], p.accent);
      if (p.hd) fastener(turret, [s * 0.26, 0.32, 0.16], p, 0.026);
    }
    for (const z of [-1.22, -1.04, -0.86]) box(rc, [0, 1.54, z], [0.68, 0.04, 0.08], p.inset);
  }
  root.animations = [
    new T.AnimationClip('Track patrol', 3.4, [spinTrack('RoofTurret', 'y', 3.4, 1), slideTrack('SideHatch', 'z', hatchBase, [0, 1.0, 2.4, 3.4], [0, 0.4, 0.4, 0])]),
    new T.AnimationClip('Turret sweep', 2.4, [spinTrack('RoofTurret', 'y', 2.4, 1)]),
  ];
}

export const vehiclesB: readonly VehicleAssetDef[] = [
  asset('deep-submersible', 'VH-09', 'Deep Submersible', '#e3b232', '#3c5e7d',
    'Deep-sea research submersible with a shrouded stern propeller and dual articulated grab arms.',
    [rp('SternProp', 'Stern propeller', 'rotate', 'z', [0, 360], 'Spins the shrouded stern screw'), rp('GrabArmL', 'Left grab arm', 'rotate', 'y', [-35, 35], 'Swings the port manipulator arm'), rp('GrabArmR', 'Right grab arm', 'rotate', 'y', [-35, 35], 'Swings the starboard manipulator arm')],
    [], buildDeepSubmersible),
  asset('parcel-delivery-van', 'VH-10', 'Parcel Delivery Van', '#dce4eb', '#dd6c34',
    'High-roof parcel delivery van with double rear cargo doors, interior packages, and rolling wheels.',
    [rp('RearDoorL', 'Left rear door', 'rotate', 'y', [0, -110], 'Swings the left rear door outward'), rp('RearDoorR', 'Right rear door', 'rotate', 'y', [0, 110], 'Swings the right rear door outward'), rp('WheelFL', 'Front-left wheel', 'rotate', 'x', [0, 360], 'Rolls the front-left wheel'), rp('WheelFR', 'Front-right wheel', 'rotate', 'x', [0, 360], 'Rolls the front-right wheel')],
    [], buildParcelDeliveryVan),
  asset('hot-air-balloon', 'VH-11', 'Hot Air Balloon', '#d4513d', '#ecc454',
    'Striped teardrop hot air balloon with a swaying wicker gondola and detachable ballast sandbags.',
    [rp('Gondola', 'Wicker gondola', 'rotate', 'z', [-14, 14], 'Sways the suspended wicker basket beneath the burner')],
    [{ name: 'Sandbags', label: 'Ballast sandbags', describe: 'Removable ballast sandbags hung along the gondola rim' }], buildHotAirBalloon),
  asset('farm-tractor', 'VH-12', 'Farm Tractor', '#497d3b', '#e5b73b',
    'Utility farm tractor with heavy rear drive tires and a tilting front-end loader bucket.',
    [rp('RearWheelL', 'Rear-left wheel', 'rotate', 'x', [0, 360], 'Rolls the oversized rear-left tractor tire'), rp('RearWheelR', 'Rear-right wheel', 'rotate', 'x', [0, 360], 'Rolls the oversized rear-right tractor tire'), rp('FrontBucket', 'Loader bucket', 'rotate', 'x', [-25, 45], 'Curls and dumps the front loader scoop bucket')],
    [], buildFarmTractor),
  asset('arctic-snowcat', 'VH-13', 'Arctic Snowcat', '#da542e', '#e6e0cc',
    'Tracked polar expedition snowcat with a tilting snowplow, rotating beacon, and detachable roof rack.',
    [rp('SnowPlow', 'Front snowplow', 'rotate', 'x', [-20, 25], 'Pitches the front hydraulic snowplow blade'), rp('RoofBeacon', 'Roof beacon', 'rotate', 'y', [0, 360], 'Rotates the amber expedition roof warning beacon')],
    [{ name: 'RoofRack', label: 'Roof cargo rack', describe: 'Removable expedition roof rack with fuel and supply boxes' }], buildArcticSnowcat),
  asset('lunar-lander', 'VH-14', 'Lunar Lander', '#e6e3d8', '#d8a53c',
    'Four-legged orbital lunar lander with a hinged boarding ramp and rotating parabolic comm dish.',
    [rp('LandingRamp', 'Landing ramp', 'rotate', 'x', [0, 65], 'Deploys the front boarding ramp downward'), rp('CommDish', 'Comm dish', 'rotate', 'y', [0, 360], 'Rotates the high-gain parabolic dish')],
    [], buildLunarLander),
  asset('racing-hoverbike', 'VH-15', 'Racing Hoverbike', '#2d7fb8', '#d8e346',
    'Aerodynamic racing hoverbike with steering handlebars and a spinning central axial turbine.',
    [rp('Handlebars', 'Handlebars', 'rotate', 'y', [-25, 25], 'Steers the forward handlebars and cowl'), rp('TurbineCore', 'Turbine core', 'rotate', 'z', [0, 360], 'Spins the exposed central jet intake turbine')],
    [], buildRacingHoverbike),
  asset('armored-railcar', 'VH-16', 'Armored Railcar', '#56645a', '#d89a36',
    'Heavy armored railway car with a 360-degree roof turret and sliding blast side hatch.',
    [rp('RoofTurret', 'Roof turret', 'rotate', 'y', [0, 360], 'Rotates the armored twin-barrel roof turret'), rp('SideHatch', 'Side blast hatch', 'slide', 'z', [0, 0.4], 'Slides the armored side entry hatch open')],
    [], buildArmoredRailcar),
];
