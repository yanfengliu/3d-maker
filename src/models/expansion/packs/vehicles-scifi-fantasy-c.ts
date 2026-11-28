import * as T from 'three';
import {
  cone, cyl, det, dome, fastener, group, lathe, light, mesh, rbox, ring, rotationTrack, rp,
  shell, spinTrack, spokeWheel, strut, sway, tone,
} from './vehicles-scifi-fantasy-kit';
import type { Finish, SciFiSpec } from './vehicles-scifi-fantasy-kit';

function buildSaucerPatrol(root: T.Group, p: Finish, detail: boolean) {
  const glow = tone(p, 'Saucer node', '#64dfdf', 0.28, 0.2, '#48bfe3');
  const uf = group(root, 'SaucerCraft');
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const ca = Math.cos(a), sa = Math.sin(a);
    cyl(uf, p, [ca * 0.92, 0.05, sa * 0.92], 0.16, 0.2, 0.1, p.dark, [0, 0, 0], 10);
    strut(uf, [ca * 0.92, 0.08, sa * 0.92], [ca * 0.56, 0.68, sa * 0.56], 0.05, p.alloy, 8);
  }
  lathe(uf, p, [0, 0.54, 0], [
    [0.01, 0], [0.56, 0.04], [1.26, 0.24], [1.32, 0.32], [1.14, 0.42], [0.64, 0.56], [0.01, 0.58],
  ], p.primary, [0, 0, 0], 16);
  dome(uf, p, [0, 1.08, 0], [0.56, 0.42, 0.56], p.optic, 14);
  ring(uf, [0, 1.08, 0], 0.58, 0.05, 0.08, p.accent);
  const sRing = group(uf, 'SensorRing', [0, 0.86, 0]);
  ring(sRing, [0, 0, 0], 1.36, 0.06, 0.1, p.accent);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    dome(sRing, p, [Math.cos(a) * 1.36, 0, Math.sin(a) * 1.36], [0.08, 0.08, 0.08], glow, 8);
  }
  if (detail) {
    cyl(uf, p, [0, 0.52, 0], 0.28, 0.18, 0.12, glow, [0, 0, 0], 12);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      rbox(uf, p, [Math.cos(a) * 0.88, 1.0, Math.sin(a) * 0.88], [0.16, 0.05, 0.16], p.edge).rotation.y = -a;
    }
    if (p.hd) fastener(uf, [0, 1.5, 0], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Orbit scan', 3.0, [
      spinTrack('SensorRing', 'y', 3.0, 2),
    ]),
  ];
}

function buildTerraformingCrawler(root: T.Group, p: Finish, detail: boolean) {
  const cr = group(root, 'TerraformCrawler');
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      shell(cr, [sx * 0.86, 0.22, sz * 0.94], [0.42, 0.44, 0.88], p.tire, 0.5);
      strut(cr, [sx * 0.62, 0.44, sz * 0.78], [sx * 0.84, 0.34, sz * 0.94], 0.06, p.dark, 8);
    }
  }
  shell(cr, [0, 0.66, 0], [1.46, 0.48, 2.24], p.primary, 0.38);
  shell(cr, [0, 1.06, 0.68], [1.08, 0.48, 0.88], p.primary, 0.36);
  rbox(cr, p, [0, 1.12, 1.14], [0.84, 0.26, 0.05], p.optic);
  const drill = group(cr, 'CoreDrill', [0, 1.18, -0.58]);
  cyl(drill, p, [0, 0.34, 0], 0.22, 0.28, 0.76, p.dark, [0, 0, 0], 10);
  cone(drill, p, [0, -0.24, 0], 0.22, 0.46, p.alloy, [Math.PI, 0, 0], 10);
  ring(drill, [0, 0.44, 0], 0.3, 0.05, 0.1, p.accent);
  const dish = group(cr, 'SolarDish', [0, 1.42, 0.52]);
  strut(dish, [0, -0.14, 0], [0, 0.18, 0], 0.045, p.alloy, 8);
  shell(dish, [0, 0.24, 0], [1.14, 0.07, 0.74], p.accent, 0.36).rotation.x = 0.34;
  if (detail) {
    for (const s of [-1, 1]) {
      cyl(cr, p, [s * 0.56, 1.08, -0.06], 0.16, 0.16, 0.66, p.accent, [0, 0, 0], 10);
      light(cr, [s * 0.42, 0.8, 1.14], [0.18, 0.11, 0.06], p);
    }
    if (p.hd) fastener(cr, [0, 1.32, 0.86], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Soil survey', 3.0, [
      spinTrack('CoreDrill', 'y', 3.0, 4),
      sway('SolarDish', 'y', 3.0, -0.7, 0.7),
    ]),
  ];
}

function buildCyberTrike(root: T.Group, p: Finish, detail: boolean) {
  const neon = tone(p, 'Neon strip', '#ff2a6d', 0.28, 0.16, '#d90429');
  const tk = group(root, 'CyberTrike');
  shell(tk, [0, 0.46, -0.08], [0.76, 0.36, 1.78], p.primary, 0.48);
  shell(tk, [0, 0.76, 0.26], [0.64, 0.34, 0.88], p.optic, 0.48);
  shell(tk, [0, 0.78, -0.78], [0.56, 0.38, 0.68], p.primary, 0.46);
  shell(tk, [0, 0.96, -1.04], [0.08, 0.42, 0.46], p.accent, 0.36);
  for (const [side, name] of [[1, 'FrontForkL'], [-1, 'FrontForkR']] as const) {
    strut(tk, [side * 0.36, 0.54, 0.56], [side * 0.72, 0.34, 0.84], 0.06, p.edge, 8);
    const fk = group(tk, name, [side * 0.76, 0.34, 0.84]);
    cyl(fk, p, [0, 0, 0], 0.34, 0.34, 0.22, p.tire, [0, 0, Math.PI / 2], 12);
    ring(fk, [side * 0.02, 0, 0], 0.24, 0.04, 0.24, p.accent).rotation.z = Math.PI / 2;
    rbox(fk, p, [0, 0.36, -0.06], [0.26, 0.08, 0.44], p.primary);
  }
  strut(tk, [0, 0.46, -0.72], [0, 0.38, -1.06], 0.07, p.dark, 8);
  const rw = group(tk, 'RearWheel', [0, 0.38, -1.06]);
  cyl(rw, p, [0, 0, 0], 0.38, 0.38, 0.34, p.tire, [0, 0, Math.PI / 2], 12);
  cyl(rw, p, [0, 0, 0], 0.22, 0.22, 0.38, p.accent, [0, 0, Math.PI / 2], 10);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(tk, p, [s * 0.4, 0.5, -0.06], [0.04, 0.06, 1.38], neon);
      light(tk, [s * 0.24, 0.54, 0.84], [0.16, 0.08, 0.06], p);
    }
    if (p.hd) fastener(tk, [0, 0.98, -0.78], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Neon drift', 2.4, [
      sway('FrontForkL', 'y', 2.4, -0.35, 0.35),
      sway('FrontForkR', 'y', 2.4, -0.35, 0.35),
      spinTrack('RearWheel', 'x', 2.4, 4),
    ]),
  ];
}

function buildClockworkStagecoach(root: T.Group, p: Finish, detail: boolean) {
  const sc = group(root, 'Stagecoach');
  shell(sc, [0, 0.46, 0], [1.06, 0.14, 2.38], p.dark, 0.26);
  shell(sc, [0, 1.14, -0.08], [1.26, 1.12, 1.56], p.primary, 0.34);
  shell(sc, [0, 1.74, -0.08], [1.18, 0.12, 1.48], p.dark, 0.34);
  shell(sc, [0, 1.06, 0.94], [0.84, 0.36, 0.46], p.primary, 0.32);
  rbox(sc, p, [0, 1.24, 0.92], [0.7, 0.12, 0.34], p.accent);
  const door = group(sc, 'CoachDoor', [0.65, 1.1, 0.28]);
  shell(door, [0.03, 0, -0.34], [0.07, 0.86, 0.68], p.accent, 0.24);
  rbox(door, p, [0.07, 0.2, -0.34], [0.03, 0.34, 0.42], p.optic);
  for (const [side, gearName] of [[1, 'GearTrainL'], [-1, 'GearTrainR']] as const) {
    strut(sc, [-0.74, 0.38, 0.82], [0.74, 0.38, 0.82], 0.04, p.dark, 8);
    strut(sc, [-0.76, 0.48, -0.82], [0.76, 0.48, -0.82], 0.045, p.dark, 8);
    spokeWheel(sc, '', [side * 0.76, 0.38, 0.82], 0.38, 0.09, p, detail, p.accent, 8);
    spokeWheel(sc, '', [side * 0.78, 0.48, -0.82], 0.48, 0.1, p, detail, p.accent, 8);
    const gear = group(sc, gearName, [side * 0.68, 0.84, -0.46]);
    cyl(gear, p, [0, 0, 0], 0.22, 0.22, 0.06, p.accent, [0, 0, Math.PI / 2], 12);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      rbox(gear, p, [0, Math.sin(a) * 0.24, Math.cos(a) * 0.24], [0.05, 0.06, 0.06], p.accent).rotation.x = -a;
    }
  }
  const trunk = group(sc, 'RoofTrunk', [0, 1.94, -0.14]);
  shell(trunk, [0, 0, 0], [0.76, 0.32, 0.56], p.accent, 0.28);
  rbox(trunk, p, [0, 0, 0], [0.8, 0.08, 0.6], p.dark);
  if (detail) {
    rbox(sc, p, [-0.66, 1.28, -0.08], [0.04, 0.36, 0.56], p.optic);
    cyl(sc, p, [0, 1.06, -0.96], 0.06, 0.06, 0.22, p.accent, [Math.PI / 2, 0, 0], 10);
    if (p.hd) fastener(sc, [0, 1.82, 0.48], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Gear drive', 2.8, [
      spinTrack('GearTrainL', 'x', 2.8, 2),
      spinTrack('GearTrainR', 'x', 2.8, 2),
      rotationTrack('CoachDoor', 'y', [0, 0.9, 1.9, 2.8], [0, -1.25, -1.25, 0]),
    ]),
  ];
}

function buildCrystalSkimmer(root: T.Group, p: Finish, detail: boolean) {
  const crys = tone(p, 'Power crystal', '#4cc9f0', 0.26, 0.24, '#4361ee');
  const sk = group(root, 'DuneSkimmer');
  for (const s of [-1, 1]) {
    shell(sk, [s * 0.68, 0.06, 0], [0.16, 0.12, 2.74], p.edge, 0.58);
    strut(sk, [s * 0.68, 0.1, 1.32], [s * 0.68, 0.26, 1.56], 0.045, p.edge, 8);
    strut(sk, [s * 0.68, 0.1, 0.56], [s * 0.38, 0.48, 0.48], 0.042, p.dark, 8);
    strut(sk, [s * 0.68, 0.1, -0.66], [s * 0.38, 0.48, -0.58], 0.042, p.dark, 8);
  }
  shell(sk, [0, 0.54, 0], [1.04, 0.34, 2.48], p.primary, 0.62);
  shell(sk, [0, 0.78, -0.54], [0.76, 0.28, 0.88], p.dark, 0.42);
  cone(sk, p, [0, 0.96, 0.58], 0.18, 0.52, crys, [0, 0, 0], 6);
  ring(sk, [0, 0.72, 0.58], 0.22, 0.04, 0.08, p.accent);
  const sail = group(sk, 'LateenSail', [0, 0.68, 0.06]);
  cyl(sail, p, [0, 1.18, 0], 0.04, 0.055, 2.36, p.dark, [0, 0, 0], 10);
  const sh = new T.Shape();
  sh.moveTo(0, 0.24);
  sh.lineTo(-1.12, 0.36);
  sh.quadraticCurveTo(-0.56, 1.48, 0.22, 2.28);
  sh.closePath();
  const sGeo = new T.ExtrudeGeometry(sh, { depth: 0.04, curveSegments: p.hd ? 16 : 6, bevelEnabled: p.hd, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
  sGeo.rotateY(-Math.PI / 2);
  mesh(sail, sGeo, p.accent, [0.02, 0, 0]);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(sk, p, [s * 0.54, 0.58, 0], [0.04, 0.08, 1.96], p.accent);
    }
    if (p.hd) fastener(sk, [0, 0.72, 1.04], p, 0.024);
  }
  root.animations = [
    new T.AnimationClip('Dune tack', 3.0, [
      sway('LateenSail', 'y', 3.0, -0.68, 0.68),
    ]),
  ];
}

function buildPlasmaGunship(root: T.Group, p: Finish, detail: boolean) {
  const glow = tone(p, 'Plasma core', '#ff9f1c', 0.28, 0.2, '#f77f00');
  const gs = group(root, 'PlasmaGunship');
  for (const s of [-1, 1]) {
    shell(gs, [s * 0.58, 0.06, 0], [0.14, 0.12, 2.18], p.dark, 0.5);
    for (const z of [-0.56, 0.56]) strut(gs, [s * 0.58, 0.1, z], [s * 0.44, 0.48, z], 0.045, p.edge, 8);
  }
  shell(gs, [0, 0.72, 0.06], [1.06, 0.68, 2.38], p.primary, 0.38);
  shell(gs, [0, 0.88, 1.18], [0.84, 0.42, 0.68], p.optic, 0.44);
  shell(gs, [0, 0.94, -0.06], [2.46, 0.14, 0.64], p.primary, 0.36);
  shell(gs, [0, 1.14, -1.24], [0.1, 0.58, 0.46], p.accent, 0.36);
  shell(gs, [0, 0.98, -1.26], [1.04, 0.08, 0.34], p.primary, 0.36);
  for (const [side, name] of [[1, 'PlasmaPodL'], [-1, 'PlasmaPodR']] as const) {
    const pod = group(gs, name, [side * 1.28, 0.94, -0.06]);
    cyl(pod, p, [0, 0, 0], 0.22, 0.24, 0.84, p.dark, [Math.PI / 2, 0, 0], 12);
    ring(pod, [0, 0, 0.36], 0.24, 0.04, 0.14, p.accent).rotation.x = Math.PI / 2;
    dome(pod, p, [0, 0, -0.42], [0.18, 0.18, 0.1], glow, 8);
  }
  const chin = group(gs, 'ChinCannon', [0, 0.46, 1.24]);
  dome(chin, p, [0, 0, 0], [0.16, 0.14, 0.16], p.dark, 10);
  cyl(chin, p, [0, -0.04, 0.32], 0.045, 0.055, 0.56, p.alloy, [Math.PI / 2, 0, 0], 10);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(gs, p, [s * 0.56, 0.72, -0.18], [0.04, 0.14, 1.38], p.accent);
      light(gs, [s * 0.34, 0.64, 1.48], [0.16, 0.1, 0.06], p);
    }
    if (p.hd) fastener(gs, [0, 1.08, 0.06], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('VTOL hover', 3.0, [
      sway('PlasmaPodL', 'x', 3.0, -0.78, 0.42),
      sway('PlasmaPodR', 'x', 3.0, -0.78, 0.42),
      sway('ChinCannon', 'y', 3.0, -0.65, 0.65),
    ]),
  ];
}

export const vehiclesScifiC: readonly SciFiSpec[] = [
  {
    id: 'saucer-patrol-craft',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('SensorRing', 'Outer sensor ring', 'rotate', 'y', [0, 360], 'Spins the perimeter glowing saucer sensor ring'),
    ],
    build: buildSaucerPatrol,
  },
  {
    id: 'terraforming-crawler',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('CoreDrill', 'Core drill tower', 'rotate', 'y', [0, 360], 'Spins the planetary soil-sampling drill tower'),
      rp('SolarDish', 'Solar collector', 'rotate', 'y', [-80, 80], 'Pans the dorsal solar atmospheric collector'),
    ],
    build: buildTerraformingCrawler,
  },
  {
    id: 'cybernetic-trike',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('FrontForkL', 'Left steering fork', 'rotate', 'y', [-25, 25], 'Steers the left wide hub-mount front wheel'),
      rp('FrontForkR', 'Right steering fork', 'rotate', 'y', [-25, 25], 'Steers the right wide hub-mount front wheel'),
      rp('RearWheel', 'Rear drive wheel', 'rotate', 'x', [0, 360], 'Spins the oversized rear cyber-trike tire'),
    ],
    build: buildCyberTrike,
  },
  {
    id: 'clockwork-stagecoach',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('GearTrainL', 'Left brass gear', 'rotate', 'x', [0, 360], 'Spins the exposed left brass clockwork drive gear'),
      rp('GearTrainR', 'Right brass gear', 'rotate', 'x', [0, 360], 'Spins the exposed right brass clockwork drive gear'),
      rp('CoachDoor', 'Stagecoach door', 'rotate', 'y', [-90, 0], 'Swings the Victorian stagecoach passenger door open'),
    ],
    detachableParts: [det('RoofTrunk', 'Roof luggage trunk', 'Removable leather-strapped brass luggage trunk atop the coach')],
    build: buildClockworkStagecoach,
  },
  {
    id: 'crystal-dune-skimmer',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('LateenSail', 'Lateen dune sail', 'rotate', 'y', [-50, 50], 'Pivots the desert wind-skimmer lateen sail'),
    ],
    build: buildCrystalSkimmer,
  },
  {
    id: 'plasma-gunship',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('PlasmaPodL', 'Port plasma pod', 'rotate', 'x', [-55, 35], 'Tilts the port VTOL plasma engine nacelle'),
      rp('PlasmaPodR', 'Starboard plasma pod', 'rotate', 'x', [-55, 35], 'Tilts the starboard VTOL plasma engine nacelle'),
      rp('ChinCannon', 'Chin autocannon', 'rotate', 'y', [-60, 60], 'Swivels the nose-mounted gunship cannon turret'),
    ],
    build: buildPlasmaGunship,
  },
];
