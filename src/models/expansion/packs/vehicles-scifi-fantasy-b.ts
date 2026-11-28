import * as T from 'three';
import {
  cone, cyl, dome, fastener, group, light, rbox, ring, rotationTrack, rp, sailExtrude,
  shell, spinTrack, spokeWheel, strut, sway, tone,
} from './vehicles-scifi-fantasy-kit';
import type { Finish, SciFiSpec } from './vehicles-scifi-fantasy-kit';

function buildWarChariot(root: T.Group, p: Finish, detail: boolean) {
  const ch = group(root, 'WarChariot');
  shell(ch, [0, 0.44, -0.06], [1.04, 0.14, 1.06], p.dark, 0.38);
  cyl(ch, p, [0, 0.88, 0.08], 0.54, 0.58, 0.82, p.primary, [0, 0, 0], 12);
  cyl(ch, p, [0, 0.92, -0.18], 0.48, 0.5, 0.72, p.dark, [0, 0, 0], 10);
  ring(ch, [0, 1.28, 0.08], 0.56, 0.05, 0.08, p.accent);
  rbox(ch, p, [0, 0.92, 0.64], [0.46, 0.52, 0.07], p.accent);
  strut(ch, [0, 0.46, 0.42], [0, 0.56, 1.66], 0.05, p.primary, 8);
  strut(ch, [-0.52, 0.56, 1.66], [0.52, 0.56, 1.66], 0.045, p.accent, 8);
  strut(ch, [0, 0.52, 1.48], [0, 0.04, 1.48], 0.036, p.dark, 8);
  cyl(ch, p, [0, 0.04, 1.48], 0.12, 0.14, 0.08, p.dark, [0, 0, 0], 8);
  strut(ch, [-0.74, 0.46, -0.04], [0.74, 0.46, -0.04], 0.05, p.dark, 8);
  for (const [side, name] of [[1, 'WheelL'], [-1, 'WheelR']] as const) {
    const wh = spokeWheel(ch, name, [side * 0.74, 0.46, -0.04], 0.46, 0.1, p, detail, p.primary, 8);
    cone(wh, p, [side * 0.22, 0, 0], 0.07, 0.34, p.alloy, [0, 0, -side * Math.PI / 2], 8);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      dome(ch, p, [s * 0.38, 1.06, 0.48], [0.09, 0.09, 0.05], p.alloy, 8);
      cone(ch, p, [s * 0.52, 0.66, 1.66], 0.06, 0.18, p.alloy, [0, 0, 0], 8);
    }
    if (p.hd) fastener(ch, [0, 0.92, 0.69], p, 0.03).rotation.x = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Arena charge', 2.4, [
      spinTrack('WheelL', 'x', 2.4, 3),
      spinTrack('WheelR', 'x', 2.4, 3),
    ]),
  ];
}

function buildDwarvenSteamTank(root: T.Group, p: Finish, detail: boolean) {
  const tk = group(root, 'SteamTank');
  for (const s of [-1, 1]) {
    shell(tk, [s * 0.72, 0.26, 0], [0.38, 0.52, 2.28], p.tire, 0.48);
    shell(tk, [s * 0.72, 0.42, 0], [0.48, 0.22, 2.34], p.primary, 0.28);
    for (const z of [-0.82, -0.28, 0.28, 0.82]) {
      cyl(tk, p, [s * 0.74, 0.22, z], 0.16, 0.16, 0.4, p.accent, [0, 0, Math.PI / 2], 10);
    }
  }
  shell(tk, [0, 0.74, 0], [1.26, 0.68, 2.26], p.primary, 0.28);
  cone(tk, p, [0, 0.58, 1.38], 0.56, 0.56, p.accent, [Math.PI / 2, 0, 0], 4);
  cyl(tk, p, [0, 1.48, -0.78], 0.18, 0.22, 0.96, p.dark, [0, 0, 0], 12);
  ring(tk, [0, 1.94, -0.78], 0.23, 0.045, 0.1, p.accent);
  const turret = group(tk, 'SteamTurret', [0, 1.04, 0.22]);
  cyl(turret, p, [0, 0.22, 0], 0.46, 0.54, 0.42, p.primary, [0, 0, 0], 8);
  ring(turret, [0, 0.44, 0], 0.34, 0.05, 0.09, p.accent);
  cyl(turret, p, [0, 0.24, 0.68], 0.12, 0.15, 0.84, p.accent, [Math.PI / 2, 0, 0], 12);
  ring(turret, [0, 0.24, 1.08], 0.16, 0.035, 0.09, p.dark).rotation.x = Math.PI / 2;
  if (detail) {
    for (const s of [-1, 1]) {
      for (const z of [-0.68, 0, 0.68]) rbox(tk, p, [s * 0.65, 0.82, z], [0.05, 0.34, 0.14], p.accent);
      light(tk, [s * 0.44, 0.88, 1.15], [0.16, 0.12, 0.06], p);
    }
    if (p.hd) fastener(turret, [0, 0.48, 0], p, 0.032);
  }
  root.animations = [
    new T.AnimationClip('Siege aim', 3.2, [
      sway('SteamTurret', 'y', 3.2, -0.85, 0.85),
    ]),
  ];
}

function buildSkyGalleon(root: T.Group, p: Finish, detail: boolean) {
  const glow = tone(p, 'Aether crystal', '#48bfe3', 0.26, 0.2, '#0096c7');
  const sg = group(root, 'SkyGalleon');
  shell(sg, [0, 0.07, 0], [0.94, 0.14, 2.28], p.dark, 0.38);
  for (const z of [-0.74, 0.74]) rbox(sg, p, [0, 0.28, z], [0.98, 0.34, 0.18], p.accent);
  shell(sg, [0, 0.62, 0], [1.18, 0.56, 2.74], p.primary, 0.58);
  shell(sg, [0, 1.02, -0.88], [1.06, 0.42, 0.96], p.primary, 0.38);
  cyl(sg, p, [0, 1.84, 0.06], 0.045, 0.065, 2.04, p.dark, [0, 0, 0], 10);
  strut(sg, [-0.86, 2.38, 0.06], [0.86, 2.38, 0.06], 0.032, p.dark, 8);
  sailExtrude(sg, p, [0, 1.14, 0.12], 1.54, 1.22, 0.26, p.stencil);
  sailExtrude(sg, p, [0, 1.24, 0.86], 0.98, 0.88, 0.2, p.accent);
  cyl(sg, p, [0, 1.62, 0.82], 0.036, 0.048, 1.48, p.dark, [0, 0, 0], 10);
  dome(sg, p, [0, 0.56, 1.44], [0.22, 0.22, 0.34], glow, 10);
  for (const [side, name] of [[1, 'EtherPaddleL'], [-1, 'EtherPaddleR']] as const) {
    shell(sg, [side * 0.98, 0.68, -0.34], [0.84, 0.07, 0.56], p.accent, 0.44);
    const pad = group(sg, name, [side * 0.68, 0.66, 0.34]);
    cyl(pad, p, [0, 0, 0], 0.06, 0.06, 0.32, p.alloy, [0, 0, Math.PI / 2], 10);
    ring(pad, [side * 0.14, 0, 0], 0.28, 0.04, 0.14, p.primary).rotation.z = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      rbox(pad, p, [side * 0.14, Math.sin(a) * 0.15, Math.cos(a) * 0.15], [0.05, 0.04, 0.28], p.alloy).rotation.x = -a;
      rbox(pad, p, [side * 0.14, Math.sin(a) * 0.28, Math.cos(a) * 0.28], [0.18, 0.1, 0.04], p.accent).rotation.x = -a;
    }
  }
  const rud = group(sg, 'SkyRudder', [0, 0.66, -1.34]);
  shell(rud, [0, 0, -0.2], [0.08, 0.56, 0.42], p.accent, 0.34);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(sg, p, [s * 0.62, 0.78, 0], [0.04, 0.1, 2.24], p.accent);
    }
    if (p.hd) fastener(sg, [0, 1.24, -1.16], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Cloud voyage', 2.8, [
      spinTrack('EtherPaddleL', 'x', 2.8, 3),
      spinTrack('EtherPaddleR', 'x', 2.8, 3),
      sway('SkyRudder', 'y', 2.8, -0.48, 0.48),
    ]),
  ];
}

function buildDrillMole(root: T.Group, p: Finish, detail: boolean) {
  const dm = group(root, 'DrillMole');
  for (const s of [-1, 1]) {
    shell(dm, [s * 0.68, 0.24, -0.26], [0.36, 0.48, 2.04], p.tire, 0.52);
    shell(dm, [s * 0.68, 0.28, -0.26], [0.28, 0.26, 1.72], p.dark, 0.46);
  }
  cyl(dm, p, [0, 0.78, -0.28], 0.58, 0.62, 2.04, p.primary, [Math.PI / 2, 0, 0], 14);
  shell(dm, [0, 1.24, -0.28], [0.76, 0.36, 0.92], p.accent, 0.38);
  rbox(dm, p, [0, 1.26, 0.2], [0.6, 0.2, 0.05], p.optic);
  const drill = group(dm, 'DrillAuger', [0, 0.78, 0.78]);
  cone(drill, p, [0, 0, 0.58], 0.56, 1.18, p.alloy, [Math.PI / 2, 0, 0], 12);
  for (let i = 0; i < 4; i++) {
    const z = 0.14 + i * 0.24;
    const rad = 0.52 - i * 0.11;
    ring(drill, [0, 0, z], rad, 0.055, 0.09, p.accent).rotation.x = Math.PI / 2 + 0.18;
  }
  if (detail) {
    for (const s of [-1, 1]) {
      cyl(dm, p, [s * 0.34, 1.38, -1.04], 0.075, 0.085, 0.52, p.dark, [0, 0, 0], 10);
      light(dm, [s * 0.46, 1.18, 0.38], [0.16, 0.12, 0.08], p);
    }
    if (p.hd) fastener(dm, [0, 1.43, -0.28], p, 0.028);
  }
  root.animations = [
    new T.AnimationClip('Tunnel bore', 2.2, [
      spinTrack('DrillAuger', 'z', 2.2, 4),
    ]),
  ];
}

function buildOrbitalDropPod(root: T.Group, p: Finish, detail: boolean) {
  const glow = tone(p, 'Beacon glow', '#ff7b00', 0.28, 0.18, '#e85d04');
  const pod = group(root, 'DropPod');
  cyl(pod, p, [0, 0.18, 0], 0.68, 0.76, 0.24, p.dark, [0, 0, 0], 6);
  cyl(pod, p, [0, 1.12, 0], 0.46, 0.68, 1.68, p.primary, [0, 0, 0], 6);
  cyl(pod, p, [0, 2.06, 0], 0.24, 0.46, 0.28, p.dark, [0, 0, 0], 6);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const fin = group(pod, '', [0, 0, 0]);
    fin.rotation.y = a;
    strut(fin, [0, 0.96, 0.56], [0, 0.1, 1.06], 0.08, p.edge, 8);
    shell(fin, [0, 0.06, 1.06], [0.34, 0.12, 0.36], p.dark, 0.36);
    const petalName = i === 0 ? 'BlastPetalA' : i === 1 ? 'BlastPetalB' : 'BlastPetalC';
    const petal = group(fin, petalName, [0, 0.28, 0.68]);
    shell(petal, [0, 0.62, 0.04], [0.58, 1.24, 0.1], p.accent, 0.24);
    rbox(petal, p, [0, 0.88, 0.1], [0.32, 0.18, 0.04], p.optic);
  }
  const beacon = group(pod, 'DropBeacon', [0, 2.16, 0]);
  cyl(beacon, p, [0, 0.08, 0], 0.1, 0.12, 0.16, p.alloy, [0, 0, 0], 10);
  dome(beacon, p, [0, 0.2, 0], [0.1, 0.12, 0.1], glow, 10);
  rbox(beacon, p, [0, 0.2, 0.09], [0.06, 0.1, 0.04], p.stencil);
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      cyl(pod, p, [Math.cos(a) * 0.5, 1.94, Math.sin(a) * 0.5], 0.055, 0.075, 0.18, p.edge, [0, 0, 0], 8);
    }
    if (p.hd) fastener(beacon, [0, 0.31, 0], p, 0.022);
  }
  root.animations = [
    new T.AnimationClip('Deploy petals', 3.2, [
      rotationTrack('BlastPetalA', 'x', [0, 1.0, 2.2, 3.2], [0, 1.35, 1.35, 0]),
      rotationTrack('BlastPetalB', 'x', [0, 1.0, 2.2, 3.2], [0, 1.35, 1.35, 0]),
      rotationTrack('BlastPetalC', 'x', [0, 1.0, 2.2, 3.2], [0, 1.35, 1.35, 0]),
      spinTrack('DropBeacon', 'y', 3.2, 3),
    ]),
  ];
}

function buildExoLoader(root: T.Group, p: Finish, detail: boolean) {
  const ex = group(root, 'ExoLoader');
  for (const s of [-1, 1]) {
    shell(ex, [s * 0.42, 0.08, 0.08], [0.34, 0.16, 0.64], p.dark, 0.3);
    strut(ex, [s * 0.42, 0.14, 0], [s * 0.42, 0.64, 0.12], 0.075, p.primary, 10);
    strut(ex, [s * 0.42, 0.64, 0.12], [s * 0.36, 1.12, -0.06], 0.08, p.edge, 10);
  }
  shell(ex, [0, 1.16, -0.06], [0.88, 0.24, 0.56], p.dark, 0.32);
  shell(ex, [0, 1.62, -0.26], [0.86, 0.82, 0.42], p.primary, 0.3);
  rbox(ex, p, [0, 1.48, 0.06], [0.46, 0.38, 0.34], p.tire);
  for (const s of [-1, 1]) {
    strut(ex, [s * 0.38, 1.24, 0.24], [s * 0.36, 2.18, 0.18], 0.036, p.accent, 8);
    strut(ex, [s * 0.38, 1.98, -0.34], [s * 0.36, 2.18, 0.18], 0.036, p.accent, 8);
    const arm = group(ex, s > 0 ? 'LoaderArmL' : 'LoaderArmR', [s * 0.54, 1.82, -0.04]);
    dome(arm, p, [0, 0, 0], [0.14, 0.14, 0.14], p.accent, 8);
    strut(arm, [0, 0, 0], [s * 0.1, -0.34, 0.38], 0.065, p.primary, 8);
    strut(arm, [s * 0.1, -0.34, 0.38], [s * 0.06, -0.42, 0.88], 0.06, p.alloy, 8);
    rbox(arm, p, [s * 0.06, -0.34, 0.94], [0.1, 0.06, 0.32], p.accent);
    rbox(arm, p, [s * 0.06, -0.5, 0.94], [0.1, 0.06, 0.32], p.accent);
  }
  strut(ex, [-0.36, 2.18, 0.18], [0.36, 2.18, 0.18], 0.036, p.accent, 8);
  const strobe = group(ex, 'TopStrobe', [0, 2.22, 0.06]);
  cyl(strobe, p, [0, 0.05, 0], 0.08, 0.09, 0.1, p.dark, [0, 0, 0], 10);
  dome(strobe, p, [0, 0.14, 0], [0.075, 0.09, 0.075], p.accent, 8);
  if (detail) {
    for (const s of [-1, 1]) {
      rbox(ex, p, [s * 0.46, 1.62, -0.26], [0.04, 0.56, 0.12], p.accent);
      light(ex, [s * 0.28, 2.14, 0.22], [0.12, 0.09, 0.06], p);
    }
    if (p.hd) fastener(ex, [0, 2.06, -0.26], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Pallet hoist', 2.8, [
      sway('LoaderArmL', 'x', 2.8, -0.62, 0.28),
      sway('LoaderArmR', 'x', 2.8, -0.62, 0.28),
      spinTrack('TopStrobe', 'y', 2.8, 3),
    ]),
  ];
}

function buildRocketSled(root: T.Group, p: Finish, detail: boolean) {
  const glow = tone(p, 'Rocket flame', '#ff6b35', 0.3, 0.15, '#e85d04');
  const sl = group(root, 'RocketSled');
  for (const s of [-1, 1]) {
    shell(sl, [s * 0.62, 0.06, 0], [0.16, 0.12, 2.86], p.alloy, 0.56);
    strut(sl, [s * 0.62, 0.1, 1.38], [s * 0.62, 0.24, 1.64], 0.045, p.alloy, 8);
    strut(sl, [s * 0.62, 0.1, 0.68], [s * 0.36, 0.52, 0.56], 0.045, p.dark, 8);
    strut(sl, [s * 0.62, 0.1, -0.78], [s * 0.42, 0.52, -0.68], 0.045, p.dark, 8);
  }
  shell(sl, [0, 0.58, -0.06], [0.92, 0.44, 2.34], p.primary, 0.5);
  cone(sl, p, [0, 0.58, 1.48], 0.38, 0.88, p.primary, [Math.PI / 2, 0, 0], 12);
  dome(sl, p, [0, 0.84, 0.34], [0.34, 0.24, 0.66], p.optic, 12);
  shell(sl, [0, 0.98, -0.96], [0.09, 0.52, 0.58], p.accent, 0.36);
  for (const x of [-0.3, 0, 0.3]) {
    cyl(sl, p, [x, 0.58, -1.36], 0.13, 0.18, 0.38, p.dark, [Math.PI / 2, 0, 0], 12);
    dome(sl, p, [x, 0.58, -1.54], [0.12, 0.12, 0.08], glow, 8);
  }
  for (const [side, name] of [[1, 'AirBrakeL'], [-1, 'AirBrakeR']] as const) {
    const flap = group(sl, name, [side * 0.46, 0.68, -0.56]);
    shell(flap, [side * 0.24, 0, 0], [0.46, 0.07, 0.52], p.accent, 0.3);
  }
  if (detail) {
    for (const s of [-1, 1]) rbox(sl, p, [s * 0.48, 0.58, 0.18], [0.04, 0.1, 1.64], p.stencil);
    if (p.hd) fastener(sl, [0, 0.82, -0.58], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Ice sprint', 2.8, [
      rotationTrack('AirBrakeL', 'z', [0, 0.9, 1.9, 2.8], [0, 0.72, 0.72, 0]),
      rotationTrack('AirBrakeR', 'z', [0, 0.9, 1.9, 2.8], [0, -0.72, -0.72, 0]),
    ]),
  ];
}

export const vehiclesScifiB: readonly SciFiSpec[] = [
  {
    id: 'bronze-war-chariot',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('WheelL', 'Left scythed wheel', 'rotate', 'x', [0, 360], 'Spins the left bronze war chariot wheel'),
      rp('WheelR', 'Right scythed wheel', 'rotate', 'x', [0, 360], 'Spins the right bronze war chariot wheel'),
    ],
    build: buildWarChariot,
  },
  {
    id: 'dwarven-steam-tank',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('SteamTurret', 'Brass cannon turret', 'rotate', 'y', [-70, 70], 'Swivels the heavy runic steam-cannon turret'),
    ],
    build: buildDwarvenSteamTank,
  },
  {
    id: 'floating-sky-galleon',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('EtherPaddleL', 'Port ether paddle', 'rotate', 'x', [0, 360], 'Spins the port skyship ether-turbine wheel'),
      rp('EtherPaddleR', 'Starboard ether paddle', 'rotate', 'x', [0, 360], 'Spins the starboard skyship ether-turbine wheel'),
      rp('SkyRudder', 'Sky rudder', 'rotate', 'y', [-35, 35], 'Steers the fantasy sky galleon tail fin'),
    ],
    build: buildSkyGalleon,
  },
  {
    id: 'subterranean-drill-mole',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('DrillAuger', 'Spiral drill auger', 'rotate', 'z', [0, 360], 'Spins the massive conical nose tunneling drill'),
    ],
    build: buildDrillMole,
  },
  {
    id: 'orbital-drop-pod',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('BlastPetalA', 'Blast door A', 'rotate', 'x', [0, 82], 'Folds the front reentry blast door outward'),
      rp('BlastPetalB', 'Blast door B', 'rotate', 'x', [0, 82], 'Folds the left-aft reentry blast door outward'),
      rp('BlastPetalC', 'Blast door C', 'rotate', 'x', [0, 82], 'Folds the right-aft reentry blast door outward'),
      rp('DropBeacon', 'Roof beacon', 'rotate', 'y', [0, 360], 'Rotates the recovery strobe atop the drop pod'),
    ],
    build: buildOrbitalDropPod,
  },
  {
    id: 'industrial-exo-loader',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('LoaderArmL', 'Left loader arm', 'rotate', 'x', [-45, 25], 'Articulates the left power-loader fork claw'),
      rp('LoaderArmR', 'Right loader arm', 'rotate', 'x', [-45, 25], 'Articulates the right power-loader fork claw'),
      rp('TopStrobe', 'Warning strobe', 'rotate', 'y', [0, 360], 'Spins the overhead exo-loader safety strobe'),
    ],
    build: buildExoLoader,
  },
  {
    id: 'arctic-rocket-sled',
    physicsBody: 'dynamic',
    riggedParts: [
      rp('AirBrakeL', 'Left airbrake', 'rotate', 'z', [0, 50], 'Deploys the port aerodynamic rocket-sled brake flap'),
      rp('AirBrakeR', 'Right airbrake', 'rotate', 'z', [-50, 0], 'Deploys the starboard aerodynamic rocket-sled brake flap'),
    ],
    build: buildRocketSled,
  },
];
