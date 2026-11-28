import * as T from 'three';
import {
  arc, cone, cyl, dome, fastener, group, light, mesh, rbox, ring, rotationTrack, rp, shell,
  spinTrack, spokeWheel, strut, sway, tone,
} from './vehicles-scifi-fantasy-kit';
import type { Finish, SciFiSpec } from './vehicles-scifi-fantasy-kit';

function buildStarfighter(root: T.Group, p: Finish, detail: boolean) {
  const glow = tone(p, 'Plasma exhaust', '#48cae4', 0.3, 0.2, '#00b4d8');
  const sf = group(root, 'Starfighter');
  cyl(sf, p, [0, 0.05, 0.92], 0.12, 0.14, 0.1, p.dark, [0, 0, 0], 10);
  strut(sf, [0, 0.08, 0.92], [0, 0.56, 0.72], 0.04, p.alloy, 8);
  for (const s of [-1, 1]) {
    cyl(sf, p, [s * 0.74, 0.05, -0.58], 0.13, 0.15, 0.1, p.dark, [0, 0, 0], 10);
    strut(sf, [s * 0.74, 0.08, -0.58], [s * 0.54, 0.56, -0.48], 0.042, p.alloy, 8);
  }
  shell(sf, [0, 0.64, -0.06], [0.76, 0.42, 2.28], p.primary, 0.44);
  cone(sf, p, [0, 0.62, 1.48], 0.34, 0.98, p.primary, [Math.PI / 2, 0, 0], 10);
  const sh = new T.Shape();
  sh.moveTo(-1.46, -0.78);
  sh.lineTo(1.46, -0.78);
  sh.lineTo(0.42, 0.72);
  sh.lineTo(-0.42, 0.72);
  sh.closePath();
  const wingGeo = new T.ExtrudeGeometry(sh, { depth: 0.09, bevelEnabled: p.hd, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
  wingGeo.rotateX(Math.PI / 2);
  mesh(sf, wingGeo, p.primary, [0, 0.66, -0.18]);
  for (const s of [-1, 1]) {
    rbox(sf, p, [s * 0.88, 0.66, -0.52], [0.46, 0.04, 0.62], p.accent);
    cyl(sf, p, [s * 1.44, 0.62, -0.08], 0.05, 0.06, 1.38, p.edge, [Math.PI / 2, 0, 0], 10);
    cyl(sf, p, [s * 0.36, 0.64, -1.24], 0.14, 0.18, 0.38, p.dark, [Math.PI / 2, 0, 0], 12);
    dome(sf, p, [s * 0.36, 0.64, -1.42], [0.12, 0.12, 0.08], glow, 8);
    shell(sf, [s * 1.18, 0.84, -0.82], [0.07, 0.42, 0.48], p.accent, 0.34);
  }
  cyl(sf, p, [0, 0.64, -1.24], 0.16, 0.2, 0.38, p.dark, [Math.PI / 2, 0, 0], 12);
  dome(sf, p, [0, 0.64, -1.42], [0.14, 0.14, 0.08], glow, 8);
  const canopy = group(sf, 'CockpitCanopy', [0, 0.82, 0.56]);
  dome(canopy, p, [0, 0.04, -0.34], [0.28, 0.22, 0.56], p.optic, 12);
  rbox(canopy, p, [0, 0.02, -0.34], [0.46, 0.07, 0.94], p.accent);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(sf, p, [s * 0.39, 0.7, 0.32], [0.06, 0.12, 0.58], p.dark);
    }
    if (p.hd) fastener(sf, [0, 0.86, -0.88], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Launch check', 3.0, [
      rotationTrack('CockpitCanopy', 'x', [0, 0.9, 2.1, 3.0], [0, -0.78, -0.78, 0]),
    ]),
  ];
}

function buildSpiderWalker(root: T.Group, p: Finish, detail: boolean) {
  const opticGlow = tone(p, 'Sensor eye', '#ff595e', 0.3, 0.2, '#e63946');
  const sp = group(root, 'SpiderWalker');
  cyl(sp, p, [0, 0.84, 0], 0.64, 0.72, 0.38, p.primary, [0, 0, 0], 6);
  cyl(sp, p, [0, 0.62, 0], 0.54, 0.44, 0.2, p.dark, [0, 0, 0], 6);
  dome(sp, p, [0, 0.86, 0.66], [0.18, 0.16, 0.14], opticGlow, 10);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    const ca = Math.cos(a), sa = Math.sin(a);
    const hip: [number, number, number] = [ca * 0.62, 0.78, sa * 0.62];
    const knee: [number, number, number] = [ca * 1.12, 0.96, sa * 1.12];
    const foot: [number, number, number] = [ca * 1.24, 0.06, sa * 1.24];
    strut(sp, hip, knee, 0.065, p.edge, 8);
    dome(sp, p, knee, [0.11, 0.11, 0.11], p.accent, 8);
    strut(sp, knee, foot, 0.055, p.dark, 8);
    cyl(sp, p, [foot[0], 0.04, foot[2]], 0.12, 0.15, 0.08, p.edge, [0, 0, 0], 8);
  }
  const turret = group(sp, 'PlasmaTurret', [0, 1.0, 0]);
  shell(turret, [0, 0.16, -0.04], [0.68, 0.32, 0.78], p.primary, 0.44);
  shell(turret, [0, 0.34, -0.08], [0.42, 0.12, 0.46], p.accent, 0.46);
  for (const s of [-1, 1]) {
    cyl(turret, p, [s * 0.16, 0.18, 0.58], 0.055, 0.065, 0.66, p.edge, [Math.PI / 2, 0, 0], 10);
    ring(turret, [s * 0.16, 0.18, 0.86], 0.075, 0.02, 0.08, p.accent).rotation.x = Math.PI / 2;
  }
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      rbox(sp, p, [Math.cos(a) * 0.64, 0.88, Math.sin(a) * 0.64], [0.14, 0.16, 0.14], p.accent);
    }
    if (p.hd) fastener(turret, [0, 0.41, -0.08], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Turret patrol', 3.0, [
      spinTrack('PlasmaTurret', 'y', 3.0, 1),
    ]),
  ];
}

function buildCargoMech(root: T.Group, p: Finish, detail: boolean) {
  const m = group(root, 'CargoMech');
  for (const s of [-1, 1]) {
    shell(m, [s * 0.46, 0.09, 0.08], [0.38, 0.18, 0.68], p.dark, 0.32);
    strut(m, [s * 0.46, 0.16, -0.06], [s * 0.46, 0.68, -0.26], 0.085, p.edge, 10);
    dome(m, p, [s * 0.46, 0.68, -0.26], [0.13, 0.13, 0.13], p.accent, 8);
    strut(m, [s * 0.46, 0.68, -0.26], [s * 0.42, 1.18, 0.04], 0.095, p.primary, 10);
  }
  shell(m, [0, 1.18, 0], [0.96, 0.26, 0.68], p.dark, 0.34);
  const torso = group(m, 'MechTorso', [0, 1.32, 0]);
  shell(torso, [0, 0.44, 0], [1.04, 0.78, 0.88], p.primary, 0.34);
  shell(torso, [0, 0.48, 0.36], [0.76, 0.56, 0.34], p.optic, 0.4);
  shell(torso, [0, 0.46, -0.52], [0.78, 0.62, 0.34], p.accent, 0.32);
  for (const [side, name] of [[1, 'ClawArmL'], [-1, 'ClawArmR']] as const) {
    const arm = group(torso, name, [side * 0.64, 0.58, 0.04]);
    dome(arm, p, [0, 0, 0], [0.16, 0.16, 0.16], p.accent, 10);
    strut(arm, [0, 0, 0], [side * 0.14, -0.36, 0.24], 0.08, p.edge, 8);
    strut(arm, [side * 0.14, -0.36, 0.24], [side * 0.08, -0.44, 0.74], 0.075, p.primary, 8);
    for (const f of [-1, 1]) strut(arm, [side * 0.08 + f * 0.06, -0.44, 0.74], [side * 0.08 + f * 0.12, -0.44, 0.98], 0.032, p.accent, 6);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      strut(torso, [s * 0.42, 0.22, 0.56], [s * 0.42, 0.86, 0.46], 0.026, p.dark, 8);
      light(torso, [s * 0.34, 0.84, 0.38], [0.14, 0.1, 0.08], p);
    }
    strut(torso, [-0.42, 0.86, 0.46], [0.42, 0.86, 0.46], 0.026, p.dark, 8);
    if (p.hd) fastener(torso, [0, 0.86, 0], p, 0.03);
  }
  root.animations = [
    new T.AnimationClip('Cargo lift', 3.0, [
      sway('ClawArmL', 'x', 3.0, -0.58, 0.32),
      sway('ClawArmR', 'x', 3.0, -0.58, 0.32),
      sway('MechTorso', 'y', 3.0, -0.38, 0.38),
    ]),
  ];
}

function buildOrbitalShuttle(root: T.Group, p: Finish, detail: boolean) {
  const sh = group(root, 'OrbitalShuttle');
  cyl(sh, p, [0, 0.08, 1.06], 0.08, 0.08, 0.12, p.tire, [0, 0, Math.PI / 2], 10);
  strut(sh, [0, 0.08, 1.06], [0, 0.44, 1.0], 0.036, p.alloy, 8);
  for (const s of [-1, 1]) {
    cyl(sh, p, [s * 0.58, 0.1, -0.56], 0.1, 0.1, 0.14, p.tire, [0, 0, Math.PI / 2], 10);
    strut(sh, [s * 0.58, 0.1, -0.56], [s * 0.48, 0.46, -0.52], 0.04, p.alloy, 8);
  }
  shell(sh, [0, 0.46, 0], [0.84, 0.14, 2.66], p.dark, 0.46);
  shell(sh, [0, 0.72, -0.08], [0.92, 0.48, 2.48], p.primary, 0.44);
  dome(sh, p, [0, 0.68, 1.18], [0.42, 0.3, 0.68], p.primary, 12);
  dome(sh, p, [0, 0.84, 1.16], [0.34, 0.18, 0.34], p.optic, 10);
  const wShape = new T.Shape();
  wShape.moveTo(-1.38, -1.08);
  wShape.lineTo(1.38, -1.08);
  wShape.lineTo(0.46, 0.46);
  wShape.lineTo(-0.46, 0.46);
  wShape.closePath();
  const wGeo = new T.ExtrudeGeometry(wShape, { depth: 0.1, bevelEnabled: p.hd, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
  wGeo.rotateX(Math.PI / 2);
  mesh(sh, wGeo, p.primary, [0, 0.54, -0.14]);
  shell(sh, [0, 1.24, -1.04], [0.1, 0.74, 0.68], p.primary, 0.36);
  rbox(sh, p, [0, 1.24, -1.02], [0.13, 0.56, 0.24], p.accent);
  cyl(sh, p, [0, 0.78, -0.12], 0.18, 0.18, 0.64, p.accent, [Math.PI / 2, 0, 0], 10);
  for (const [side, name] of [[1, 'BayDoorL'], [-1, 'BayDoorR']] as const) {
    const door = group(sh, name, [side * 0.42, 0.96, -0.12]);
    shell(door, [-side * 0.2, 0.04, 0], [0.4, 0.08, 1.12], p.accent, 0.26);
  }
  for (const [x, y] of [[0, 0.82], [-0.22, 0.64], [0.22, 0.64]] as const) {
    cyl(sh, p, [x, y, -1.42], 0.11, 0.18, 0.3, p.dark, [Math.PI / 2, 0, 0], 12);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(sh, p, [s * 0.92, 0.57, -0.84], [0.76, 0.04, 0.14], p.dark);
    }
    if (p.hd) fastener(sh, [0, 0.96, 0.68], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Payload bay', 3.2, [
      rotationTrack('BayDoorL', 'z', [0, 1.0, 2.2, 3.2], [0, -1.65, -1.65, 0]),
      rotationTrack('BayDoorR', 'z', [0, 1.0, 2.2, 3.2], [0, 1.65, 1.65, 0]),
    ]),
  ];
}

function buildMaglevPod(root: T.Group, p: Finish, detail: boolean) {
  const magGlow = tone(p, 'Maglev strip', '#38bdf8', 0.28, 0.2, '#0284c7');
  const pod = group(root, 'MaglevPod');
  shell(pod, [0, 0.1, 0], [1.14, 0.2, 3.36], p.dark, 0.28);
  rbox(pod, p, [0, 0.26, 0], [0.68, 0.14, 2.74], p.edge);
  shell(pod, [0, 0.72, 0], [1.24, 0.82, 2.68], p.primary, 0.56);
  for (const ez of [-1, 1]) {
    dome(pod, p, [0, 0.66, ez * 1.32], [0.58, 0.36, 0.54], p.primary, 12);
    dome(pod, p, [0, 0.84, ez * 1.24], [0.46, 0.22, 0.34], p.optic, 10);
  }
  for (const s of [-1, 1]) {
    rbox(pod, p, [s * 0.58, 0.16, 0], [0.06, 0.08, 3.16], magGlow);
    rbox(pod, p, [s * 0.64, 0.54, 0], [0.04, 0.12, 2.48], p.accent);
  }
  for (const [side, name] of [[1, 'GullDoorL'], [-1, 'GullDoorR']] as const) {
    const door = group(pod, name, [side * 0.44, 1.12, 0]);
    shell(door, [side * 0.18, -0.24, 0], [0.1, 0.56, 1.12], p.accent, 0.32);
    rbox(door, p, [side * 0.24, -0.18, 0], [0.03, 0.32, 0.94], p.optic);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [-1.24, -0.62, 0, 0.62, 1.24]) rbox(pod, p, [s * 0.6, 0.08, z], [0.08, 0.14, 0.12], p.alloy);
    }
    if (p.hd) fastener(pod, [0, 1.16, 0], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Gullwing dock', 3.0, [
      rotationTrack('GullDoorL', 'z', [0, 0.9, 2.1, 3.0], [0, 1.25, 1.25, 0]),
      rotationTrack('GullDoorR', 'z', [0, 0.9, 2.1, 3.0], [0, -1.25, -1.25, 0]),
    ]),
  ];
}

function buildOrnithopter(root: T.Group, p: Finish, detail: boolean) {
  const orn = group(root, 'Ornithopter');
  cyl(orn, p, [0, 0.72, 0.18], 0.32, 0.38, 1.48, p.primary, [Math.PI / 2, 0, 0], 14);
  dome(orn, p, [0, 0.72, 0.92], [0.32, 0.32, 0.38], p.accent, 10);
  dome(orn, p, [0, 0.92, 0.56], [0.28, 0.22, 0.36], p.optic, 10);
  cyl(orn, p, [0, 0.72, -0.84], 0.12, 0.28, 0.88, p.primary, [Math.PI / 2, 0, 0], 12);
  shell(orn, [0, 0.78, -1.28], [0.88, 0.07, 0.52], p.accent, 0.52);
  for (const s of [-1, 1]) {
    strut(orn, [s * 0.28, 0.52, 0.42], [s * 0.52, 0.24, 0.46], 0.032, p.dark, 8);
    spokeWheel(orn, '', [s * 0.56, 0.24, 0.46], 0.24, 0.07, p, detail, p.accent, 6);
  }
  strut(orn, [0, 0.56, -0.88], [0, 0.14, -1.02], 0.028, p.dark, 8);
  spokeWheel(orn, '', [0, 0.14, -1.02], 0.14, 0.06, p, detail, p.accent, 4);
  const wShape = new T.Shape();
  wShape.moveTo(0, 0);
  wShape.quadraticCurveTo(0.65, 0.28, 1.42, 0.04);
  wShape.quadraticCurveTo(1.06, -0.34, 0.62, -0.44);
  wShape.quadraticCurveTo(0.32, -0.32, 0, -0.42);
  wShape.closePath();
  const wGeo = new T.ExtrudeGeometry(wShape, { depth: 0.04, curveSegments: p.hd ? 16 : 6, bevelEnabled: p.hd, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
  wGeo.rotateX(Math.PI / 2);
  for (const [side, name] of [[1, 'WingL'], [-1, 'WingR']] as const) {
    const wing = group(orn, name, [side * 0.34, 0.88, 0.24]);
    strut(wing, [0, 0, 0], [side * 1.38, 0.04, -0.06], 0.034, p.accent, 8);
    const blade = mesh(wing, wGeo, p.stencil, [0, 0.02, 0.18]);
    if (side < 0) blade.rotation.y = Math.PI;
    if (detail) {
      strut(wing, [side * 0.48, 0.02, 0], [side * 0.48, 0.02, -0.36], 0.018, p.dark, 6);
      strut(wing, [side * 0.94, 0.03, -0.02], [side * 0.86, 0.02, -0.32], 0.018, p.dark, 6);
    }
  }
  const fly = group(orn, 'Flywheel', [0.38, 0.72, -0.06]);
  ring(fly, [0, 0, 0], 0.2, 0.035, 0.06, p.accent).rotation.z = Math.PI / 2;
  rbox(fly, p, [0, 0, 0], [0.04, 0.36, 0.04], p.alloy);
  if (detail && p.hd) fastener(orn, [0, 1.08, 0.12], p, 0.026);
  root.animations = [
    new T.AnimationClip('Clockwork flap', 2.6, [
      sway('WingL', 'z', 2.6, -0.42, 0.56),
      sway('WingR', 'z', 2.6, -0.56, 0.42),
      spinTrack('Flywheel', 'x', 2.6, 4),
    ]),
  ];
}

function buildRoyalCarriage(root: T.Group, p: Finish, detail: boolean) {
  const cg = group(root, 'RoyalCarriage');
  shell(cg, [0, 0.46, 0], [1.06, 0.14, 2.38], p.dark, 0.28);
  dome(cg, p, [0, 1.18, -0.08], [0.74, 0.64, 0.84], p.primary, 12);
  shell(cg, [0, 1.72, -0.08], [0.82, 0.14, 0.92], p.accent, 0.48);
  cyl(cg, p, [0, 1.92, -0.08], 0.18, 0.12, 0.24, p.accent, [0, 0, 0], 10);
  dome(cg, p, [0, 2.06, -0.08], [0.09, 0.09, 0.09], p.accent, 8);
  shell(cg, [0, 1.06, 0.98], [0.76, 0.32, 0.48], p.primary, 0.36);
  rbox(cg, p, [0, 1.24, 0.96], [0.64, 0.12, 0.34], p.accent);
  const door = group(cg, 'CoachDoor', [0.72, 1.14, 0.24]);
  shell(door, [0.03, 0, -0.32], [0.07, 0.72, 0.64], p.accent, 0.26);
  rbox(door, p, [0.07, 0.14, -0.32], [0.03, 0.34, 0.38], p.optic);
  for (const s of [-1, 1]) {
    strut(cg, [-0.74, 0.38, 0.84], [0.74, 0.38, 0.84], 0.04, p.dark, 8);
    strut(cg, [-0.78, 0.5, -0.84], [0.78, 0.5, -0.84], 0.045, p.dark, 8);
    spokeWheel(cg, s > 0 ? 'FrontWheelL' : 'FrontWheelR', [s * 0.76, 0.38, 0.84], 0.38, 0.09, p, detail, p.accent, 8);
    spokeWheel(cg, s > 0 ? 'RearWheelL' : 'RearWheelR', [s * 0.8, 0.5, -0.84], 0.5, 0.1, p, detail, p.accent, 10);
    rbox(cg, p, [s * 0.68, 1.38, 0.56], [0.14, 0.22, 0.14], p.accent);
  }
  rbox(cg, p, [-0.74, 1.24, -0.08], [0.04, 0.34, 0.42], p.optic);
  if (detail) {
    for (const s of [-1, 1]) {
      arc(cg, p, [[s * 0.52, 0.52, -0.78], [s * 0.58, 0.82, -0.58], [s * 0.52, 0.76, -0.08]], 0.032, p.accent, 8, 6);
    }
    if (p.hd) fastener(cg, [0, 1.8, -0.08], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Royal parade', 3.0, [
      spinTrack('FrontWheelL', 'x', 3.0, 2),
      spinTrack('FrontWheelR', 'x', 3.0, 2),
      spinTrack('RearWheelL', 'x', 3.0, 2),
      spinTrack('RearWheelR', 'x', 3.0, 2),
      rotationTrack('CoachDoor', 'y', [0, 0.9, 2.1, 3.0], [0, -1.35, -1.35, 0]),
    ]),
  ];
}

export const vehiclesScifiA: readonly SciFiSpec[] = [
  {
    id: 'delta-wing-starfighter',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('CockpitCanopy', 'Cockpit canopy', 'rotate', 'x', [-55, 0], 'Hinges the forward starfighter glass canopy open'),
    ],
    build: buildStarfighter,
  },
  {
    id: 'hexapod-spider-walker',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('PlasmaTurret', 'Dorsal turret', 'rotate', 'y', [0, 360], 'Rotates the armored twin-barrel spider walker turret'),
    ],
    build: buildSpiderWalker,
  },
  {
    id: 'bipedal-cargo-mech',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('MechTorso', 'Cockpit torso', 'rotate', 'y', [-45, 45], 'Swivels the bipedal mech torso left and right'),
      rp('ClawArmL', 'Left cargo arm', 'rotate', 'x', [-45, 25], 'Raises and lowers the left hydraulic claw arm'),
      rp('ClawArmR', 'Right cargo arm', 'rotate', 'x', [-45, 25], 'Raises and lowers the right hydraulic claw arm'),
    ],
    build: buildCargoMech,
  },
  {
    id: 'orbital-crew-shuttle',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('BayDoorL', 'Port payload door', 'rotate', 'z', [-105, 0], 'Opens the port orbital payload bay door'),
      rp('BayDoorR', 'Starboard payload door', 'rotate', 'z', [0, 105], 'Opens the starboard orbital payload bay door'),
    ],
    build: buildOrbitalShuttle,
  },
  {
    id: 'sleek-maglev-pod',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('GullDoorL', 'Port gullwing door', 'rotate', 'z', [0, 75], 'Lifts the port magnetic transit gull-wing door'),
      rp('GullDoorR', 'Starboard gullwing door', 'rotate', 'z', [-75, 0], 'Lifts the starboard magnetic transit gull-wing door'),
    ],
    build: buildMaglevPod,
  },
  {
    id: 'steampunk-ornithopter',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('WingL', 'Port flapping wing', 'rotate', 'z', [-30, 40], 'Flaps the port mechanical ornithopter wing'),
      rp('WingR', 'Starboard flapping wing', 'rotate', 'z', [-40, 30], 'Flaps the starboard mechanical ornithopter wing'),
      rp('Flywheel', 'Brass flywheel', 'rotate', 'x', [0, 360], 'Spins the side brass clockwork drive flywheel'),
    ],
    build: buildOrnithopter,
  },
  {
    id: 'gilded-royal-carriage',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('CoachDoor', 'Royal coach door', 'rotate', 'y', [-95, 0], 'Swings the gilded carriage entry door outward'),
      rp('RearWheelL', 'Rear-left wheel', 'rotate', 'x', [0, 360], 'Rolls the tall rear-left spoked carriage wheel'),
      rp('RearWheelR', 'Rear-right wheel', 'rotate', 'x', [0, 360], 'Rolls the tall rear-right spoked carriage wheel'),
    ],
    build: buildRoyalCarriage,
  },
];
