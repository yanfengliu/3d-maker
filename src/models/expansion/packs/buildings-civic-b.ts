import * as T from 'three';
import {
  bArchPortal,
  bArchVault,
  bBox,
  bCone,
  bCyl,
  bGambrel,
  bLathe,
  bOctPrism,
  bOrb,
  bRing,
  bStrut,
  clockDial,
  framedWindow,
  group,
  hingedDoor,
  matte,
  pitchedRoof,
  quad,
  rot,
  slide,
  slideTrack,
  spinTrack,
  swingTrack,
} from './buildings-civic-kit';
import type { CivicBuildDef, Finish, Point } from './buildings-civic-kit';

function timberGrainSilo(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'GrainSilo');
  const concrete = matte('#8c8b83', 0.9, 0, 'Silo pad');
  const stone = matte('#a6a095', 0.88, 0, 'Silo footing');
  bBox(b, [0, 0.06, 0], [2.56, 0.12, 1.94], concrete, p.hd);
  bCyl(b, [-0.36, 0.19, 0], 0.78, 0.82, 0.18, stone, p.hd, 16);
  bCyl(b, [-0.36, 1.48, 0], 0.7, 0.71, 2.46, p.primary, p.hd, 16);
  for (const y of [0.46, 0.86, 1.26, 1.66, 2.06, 2.46]) {
    bRing(b, [-0.36, y, 0], 0.735, 0.04, 0.055, p.accent, p.hd, 16);
  }
  const staveCount = detail ? 14 : 6;
  for (let i = 0; i < staveCount; i++) {
    const a = (i * Math.PI * 2) / staveCount;
    bBox(
      b,
      [-0.36 + Math.sin(a) * 0.71, 1.48, Math.cos(a) * 0.71],
      [0.045, 2.38, 0.035],
      p.primary,
      false,
    ).rotation.y = a;
  }
  bBox(b, [-1.06, 1.44, 0], [0.28, 2.42, 0.36], p.primary, p.hd);
  bBox(b, [-1.06, 2.68, 0], [0.34, 0.1, 0.42], p.accent, p.hd);
  bCyl(b, [-0.36, 2.72, 0], 0.82, 0.76, 0.09, p.dark, p.hd, 16);
  bCone(b, [-0.36, 3.1, 0], 0.85, 0.7, p.accent, p.hd, 16);
  bBox(b, [-0.36, 2.94, 0.56], [0.28, 0.26, 0.34], p.primary, p.hd);
  bBox(b, [-0.36, 3.09, 0.56], [0.34, 0.07, 0.4], p.dark, p.hd);
  bCyl(b, [-0.36, 3.46, 0], 0.11, 0.13, 0.12, p.alloy, p.hd, 12);
  const turbine = group(b, 'VentTurbine', [-0.36, 3.58, 0]);
  bOrb(turbine, [0, 0.04, 0], 0.15, p.alloy, p.hd, 10);
  bCyl(turbine, [0, 0.19, 0], 0.09, 0.12, 0.04, p.accent, p.hd, 12);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const fin = bBox(
      turbine,
      [Math.sin(a) * 0.16, 0.04, Math.cos(a) * 0.16],
      [0.03, 0.18, 0.07],
      p.accent,
      false,
    );
    fin.rotation.y = a + 0.4;
  }
  bBox(b, [0.74, 0.62, 0.04], [0.84, 1.04, 1.12], p.primary, p.hd);
  bBox(b, [0.74, 1.24, 0.04], [1.02, 0.08, 1.28], p.accent, p.hd).rotation.z = -0.24;
  bBox(b, [0.74, 0.58, 0.62], [0.46, 0.38, 0.2], p.dark, p.hd);
  bBox(b, [0.74, 0.58, 0.7], [0.36, 0.28, 0.06], p.inset, false);
  const gate = group(b, 'ChuteGate', [0.74, 0.74, 0.74]);
  bBox(gate, [0, -0.15, 0], [0.38, 0.3, 0.045], p.accent, p.hd);
  bBox(gate, [0.22, -0.04, 0.02], [0.12, 0.04, 0.04], p.alloy, false);
  bStrut(b, [-0.24, 2.28, 0.04], [0.74, 1.18, 0.04], 0.1, p.alloy, p.hd, 10);
  bStrut(b, [0.24, 1.72, 0.04], [0.24, 1.12, 0.04], 0.04, p.dark, p.hd, 8);
  bBox(b, [0.74, 0.52, -0.54], [0.44, 0.82, 0.06], p.dark, p.hd);
  if (detail) {
    for (let y = 0.42; y <= 2.38; y += 0.28) bBox(b, [-1.22, y, 0], [0.03, 0.03, 0.24], p.alloy, false);
    for (const s of [-1, 1]) bBox(b, [0.74 + s * 0.43, 0.62, 0.62], [0.06, 1.0, 0.06], p.dark, p.hd);
  }
  if (detail && p.hd) {
    for (const t of [0.25, 0.5, 0.75]) {
      bOrb(b, [-0.24 + t * 0.98, 2.28 - t * 1.1, 0.04], 0.125, p.accent, p.hd, 10);
    }
  }
  root.animations = [
    new T.AnimationClip('Grain mill cycle', 4, [
      spinTrack('VentTurbine', 'y', 4, 1),
      swingTrack('ChuteGate', 'x', 4, 56),
    ]),
    new T.AnimationClip('Open chute gate', 3, [swingTrack('ChuteGate', 'x', 3, 58)]),
  ];
}

function elevatedWaterTower(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'WaterTower');
  const concrete = matte('#8c8c85', 0.9, 0, 'Tower pad');
  const stone = matte('#a8a397', 0.88, 0, 'Tower footings');
  bBox(b, [0, 0.06, 0], [2.04, 0.12, 2.04], concrete, p.hd);
  quad((sx, sz) => {
    bBox(b, [sx * 0.7, 0.22, sz * 0.7], [0.34, 0.24, 0.34], stone, p.hd);
    bStrut(b, [sx * 0.7, 0.3, sz * 0.7], [sx * 0.48, 1.9, sz * 0.48], 0.055, p.dark, p.hd, 10);
  });
  for (const [y0, y1, r0, r1] of [
    [0.36, 1.12, 0.68, 0.58],
    [1.12, 1.86, 0.58, 0.49],
  ] as const) {
    quad((s, d) => {
      bStrut(b, [-d * r0, y0, s * r0], [d * r1, y1, s * r1], 0.024, p.edge, p.hd, 8);
      bStrut(b, [s * r0, y0, -d * r0], [s * r1, y1, d * r1], 0.024, p.edge, p.hd, 8);
    });
    for (const s of [-1, 1]) {
      bBox(b, [0, y1, s * r1], [r1 * 2.04, 0.055, 0.055], p.dark, p.hd);
      bBox(b, [s * r1, y1, 0], [0.055, 0.055, r1 * 2.04], p.dark, p.hd);
    }
  }
  bCyl(b, [0, 1.04, 0], 0.16, 0.18, 1.88, p.primary, p.hd, 12);
  for (const y of [0.64, 1.12, 1.6]) bRing(b, [0, y, 0], 0.19, 0.028, 0.045, p.dark, p.hd, 12);
  bOctPrism(b, [0, 1.93, 0], 0.96, 0.1, p.dark, p.hd);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    bStrut(
      b,
      [Math.sin(a) * 0.88, 1.96, Math.cos(a) * 0.88],
      [Math.sin(a) * 0.88, 2.3, Math.cos(a) * 0.88],
      0.02,
      p.alloy,
      p.hd,
      8,
    );
  }
  bRing(b, [0, 2.28, 0], 0.89, 0.026, 0.035, p.alloy, p.hd, 16);
  bCyl(b, [0, 2.52, 0], 0.68, 0.68, 1.08, p.primary, p.hd, 16);
  for (const y of [2.08, 2.24, 2.42, 2.66, 2.92]) {
    bRing(b, [0, y, 0], 0.71, 0.038, 0.042, p.accent, p.hd, 16);
  }
  bBox(b, [0, 2.52, 0.725], [0.18, 0.96, 0.04], p.stencil, false);
  for (const s of [-1, 1]) bStrut(b, [s * 0.08, 2.04, 0.755], [s * 0.08, 3.02, 0.755], 0.012, p.alloy, p.hd, 6);
  const gaugeRest: Point = [0, 2.2, 0.765];
  const gauge = group(b, 'LevelGauge', gaugeRest);
  bBox(gauge, [0, 0, 0], [0.24, 0.14, 0.045], p.accent, p.hd);
  bBox(gauge, [0, 0, 0.026], [0.14, 0.04, 0.02], p.stencil, false);
  bCone(b, [0, 3.34, 0], 0.85, 0.56, p.accent, p.hd, 16);
  bCyl(b, [0, 3.64, 0], 0.04, 0.06, 0.1, p.dark, p.hd, 10);
  const vane = group(b, 'WindVane', [0, 3.74, 0]);
  bCyl(vane, [0, -0.02, 0], 0.02, 0.024, 0.16, p.alloy, p.hd, 8);
  bBox(vane, [0, 0.04, 0], [0.54, 0.032, 0.032], p.alloy, false);
  bCone(vane, [0.3, 0.04, 0], 0.06, 0.14, p.accent, p.hd, 10).rotation.z = -Math.PI / 2;
  bBox(vane, [-0.22, 0.06, 0], [0.18, 0.14, 0.022], p.accent, false);
  for (const dx of [-0.1, 0.1]) bStrut(b, [0.56 + dx, 0.1, 0.68], [0.4 + dx, 2.28, 0.68], 0.018, p.alloy, p.hd, 8);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      bBox(b, [0.56 - t * 0.16, 0.32 + t * 1.76, 0.68], [0.22, 0.024, 0.024], p.alloy, false);
    }
    bRing(b, [0, 2.13, 0], 0.89, 0.02, 0.025, p.edge, p.hd, 16);
  }
  if (detail && p.hd) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      bStrut(
        b,
        [Math.sin(a) * 0.52, 1.72, Math.cos(a) * 0.52],
        [Math.sin(a) * 0.86, 1.9, Math.cos(a) * 0.86],
        0.025,
        p.dark,
        p.hd,
        8,
      );
    }
  }
  root.animations = [
    new T.AnimationClip('Tank monitor', 4, [
      spinTrack('WindVane', 'y', 4, 1),
      slideTrack('LevelGauge', 'y', gaugeRest, 4, 0.48),
    ]),
    new T.AnimationClip('Slide level gauge', 3.2, [slideTrack('LevelGauge', 'y', gaugeRest, 3.2, 0.48)]),
  ];
}

function redBarnHayloft(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'RedBarn');
  const stone = matte('#8c867a', 0.9, 0, 'Barn foundation');
  const slate = matte('#3e464f', 0.84, 0.05, 'Barn roof slate');
  bBox(b, [0, 0.07, 0], [2.56, 0.14, 2.24], stone, p.hd);
  bBox(b, [0, 0.75, 0], [2.28, 1.26, 1.94], p.primary, p.hd);
  quad((sx, sz) => bBox(b, [sx * 1.14, 0.75, sz * 0.97], [0.09, 1.26, 0.09], p.accent, p.hd));
  bGambrel(b, [0, 1.36, 0], 2.24, 0.62, 1.06, 1.36, 1.9, p.primary, p.hd);
  const lowRun = 0.54;
  const lowRise = 0.64;
  const lowLen = Math.hypot(lowRun, lowRise) + 0.1;
  const lowAng = Math.atan2(lowRise, lowRun);
  const hiRun = 0.72;
  const hiRise = 0.46;
  const hiLen = Math.hypot(hiRun, hiRise) + 0.08;
  const hiAng = Math.atan2(hiRise, hiRun);
  for (const s of [-1, 1]) {
    bBox(b, [s * 0.96, 1.7, 0], [lowLen, 0.075, 2.16], slate, p.hd).rotation.z = -s * lowAng;
    bBox(b, [s * 0.36, 2.24, 0], [hiLen, 0.075, 2.16], slate, p.hd).rotation.z = -s * hiAng;
    const side = group(b, '', [s * 1.15, 0, 0]);
    side.rotation.y = (s * Math.PI) / 2;
    for (const z of [-0.58, 0, 0.58]) framedWindow(side, [z, 0.8, 0], 0.28, 0.34, p.accent, stone, p, detail);
  }
  bBox(b, [0, 2.49, 0], [0.12, 0.08, 2.22], p.accent, p.hd);
  bBox(b, [0, 0.66, 0.96], [1.14, 1.08, 0.06], p.accent, p.hd);
  bBox(b, [0, 0.66, 0.975], [1.02, 1.0, 0.04], p.inset, false);
  bBox(b, [0.25, 0.66, 1.005], [0.48, 0.98, 0.05], p.primary, p.hd);
  for (const s of [-1, 1]) {
    bStrut(b, [0.25 - s * 0.19, 0.22, 1.038], [0.25 + s * 0.19, 1.1, 1.038], 0.022, p.accent, p.hd, 6);
  }
  const doorL = group(b, 'BarnDoorL', [-0.49, 0.16, 1.005]);
  bBox(doorL, [0.24, 0.5, 0], [0.48, 0.98, 0.05], p.primary, p.hd);
  for (const s of [-1, 1]) {
    bStrut(doorL, [0.24 - s * 0.19, 0.06, 0.033], [0.24 + s * 0.19, 0.94, 0.033], 0.022, p.accent, p.hd, 6);
  }
  bBox(doorL, [0.42, 0.5, 0.04], [0.04, 0.14, 0.025], p.dark, false);
  bBox(b, [0, 1.72, 0.96], [0.66, 0.58, 0.06], p.accent, p.hd);
  bBox(b, [0, 1.72, 0.975], [0.5, 0.42, 0.04], p.inset, false);
  const loft = group(b, 'HayloftDoor', [0, 1.48, 1.015]);
  bBox(loft, [0, 0.23, 0], [0.54, 0.46, 0.048], p.primary, p.hd);
  for (const s of [-1, 1]) {
    bStrut(loft, [-s * 0.21, 0.05, 0.032], [s * 0.21, 0.41, 0.032], 0.02, p.accent, p.hd, 6);
  }
  for (const s of [-1, 1]) {
    bBox(b, [s * 0.24, 2.34, 1.16], [0.54, 0.065, 0.44], slate, p.hd).rotation.z = -s * 0.62;
  }
  bBox(b, [0, 2.26, 1.16], [0.09, 0.09, 0.48], p.dark, p.hd);
  bRing(b, [0, 2.14, 1.32], 0.075, 0.02, 0.035, p.alloy, p.hd, 12).rotation.y = Math.PI / 2;
  bBox(b, [0, 0.62, -0.99], [0.62, 0.94, 0.06], p.accent, p.hd);
  bBox(b, [0, 2.52, 0], [0.56, 0.28, 0.56], p.primary, p.hd);
  bBox(b, [0, 2.8, 0], [0.48, 0.34, 0.48], p.accent, p.hd);
  bBox(b, [0, 3.0, 0], [0.58, 0.07, 0.58], p.accent, p.hd);
  bCone(b, [0, 3.19, 0], 0.44, 0.34, slate, p.hd, 4, true).rotation.y = Math.PI / 4;
  bCyl(b, [0, 3.42, 0], 0.018, 0.024, 0.16, p.alloy, p.hd, 8);
  if (detail) {
    for (const y of [2.72, 2.8, 2.88]) {
      for (const s of [-1, 1]) {
        bBox(b, [0, y, s * 0.255], [0.3, 0.035, 0.025], p.dark, false);
        bBox(b, [s * 0.255, y, 0], [0.025, 0.035, 0.3], p.dark, false);
      }
    }
    for (const x of [-0.82, 0.82]) framedWindow(b, [x, 0.8, 0.98], 0.26, 0.32, p.accent, stone, p, true);
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) {
      bBox(b, [s * 0.96, 1.7, 1.09], [lowLen, 0.055, 0.04], p.accent, p.hd).rotation.z = -s * lowAng;
      bBox(b, [s * 0.36, 2.24, 1.09], [hiLen, 0.055, 0.04], p.accent, p.hd).rotation.z = -s * hiAng;
    }
  }
  root.animations = [
    new T.AnimationClip('Barn chores', 3.6, [
      swingTrack('BarnDoorL', 'y', 3.6, -80),
      swingTrack('HayloftDoor', 'x', 3.6, 65),
    ]),
    new T.AnimationClip('Open hayloft', 3, [swingTrack('HayloftDoor', 'x', 3, 68)]),
  ];
}

function victorianConservatory(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'Conservatory');
  const stone = matte('#a8a296', 0.88, 0, 'Conservatory stone');
  bBox(b, [0, 0.06, 0], [3.26, 0.12, 2.08], stone, p.hd);
  bOctPrism(b, [0, 0.31, 0], 0.98, 0.42, p.accent, p.hd);
  bOctPrism(b, [0, 0.54, 0], 1.03, 0.07, stone, p.hd);
  bOctPrism(b, [0, 1.08, 0], 0.9, 1.04, p.optic, p.hd);
  bOctPrism(b, [0, 1.12, 0], 0.96, 0.07, p.primary, p.hd);
  bOctPrism(b, [0, 1.62, 0], 1.02, 0.09, p.primary, p.hd);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    const vx = Math.sin(a) * 0.94;
    const vz = Math.cos(a) * 0.94;
    bCyl(b, [vx, 1.08, vz], 0.042, 0.046, 1.08, p.primary, p.hd, 10);
    bStrut(b, [vx, 1.64, vz], [Math.sin(a) * 0.66, 2.1, Math.cos(a) * 0.66], 0.026, p.primary, p.hd, 8);
    bStrut(
      b,
      [Math.sin(a) * 0.66, 2.1, Math.cos(a) * 0.66],
      [Math.sin(a) * 0.28, 2.4, Math.cos(a) * 0.28],
      0.024,
      p.primary,
      p.hd,
      8,
    );
  }
  const domeProf: [number, number][] = [];
  const dSteps = p.hd ? 15 : 5;
  for (let i = 0; i <= dSteps; i++) {
    const t = i / dSteps;
    const r = 0.92 * Math.cos(t * Math.PI * 0.42);
    const y = Math.sin(t * Math.PI * 0.5) * 0.78;
    domeProf.push([Math.max(0.24, r), y]);
  }
  bLathe(b, [0, 1.64, 0], domeProf, p.optic, p.hd, 8, true).rotation.y = Math.PI / 8;
  bOctPrism(b, [0, 2.55, 0], 0.28, 0.34, p.optic, p.hd);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    bCyl(b, [Math.sin(a) * 0.29, 2.55, Math.cos(a) * 0.29], 0.02, 0.02, 0.36, p.primary, p.hd, 8);
  }
  const vent = group(b, 'CrownVent', [0, 2.72, -0.24]);
  bCone(vent, [0, 0.12, 0.24], 0.36, 0.24, p.primary, p.hd, 8, true).rotation.y = Math.PI / 8;
  bCyl(vent, [0, 0.3, 0.24], 0.018, 0.028, 0.16, p.accent, p.hd, 8);
  bOrb(vent, [0, 0.38, 0.24], 0.04, p.accent, p.hd, 8);
  for (const s of [-1, 1]) {
    const wing = group(b, '', [s * 1.12, 0, 0]);
    bBox(wing, [0, 0.31, 0], [0.88, 0.42, 1.06], p.accent, p.hd);
    bBox(wing, [0, 0.54, 0], [0.94, 0.06, 1.12], stone, p.hd);
    bBox(wing, [0, 0.9, 0], [0.8, 0.68, 0.98], p.optic, p.hd);
    bBox(wing, [0, 1.26, 0], [0.88, 0.08, 1.06], p.primary, p.hd);
    quad((cx, cz) => bBox(wing, [cx * 0.4, 0.9, cz * 0.5], [0.06, 0.72, 0.06], p.primary, p.hd));
    const roofGrp = group(wing, '', [0, 0, 0]);
    roofGrp.rotation.y = Math.PI / 2;
    pitchedRoof(roofGrp, [0, 1.28, 0], 1.08, 0.44, 0.94, p.optic, p.optic, p.primary, p, detail);
    if (detail) {
      for (const rx of [-0.32, 0, 0.32]) {
        bCyl(wing, [rx, 1.84, 0], 0.015, 0.025, 0.14, p.accent, p.hd, 8);
      }
      for (const sz of [-1, 1]) bBox(wing, [0, 0.9, sz * 0.51], [0.035, 0.66, 0.035], p.primary, false);
    }
  }
  bBox(b, [0, 0.64, 0.86], [0.76, 1.04, 0.3], p.primary, p.hd);
  bArchVault(b, [0, 1.14, 0.86], 0.84, 0.06, 0.28, 0.36, p.accent, p.hd);
  const door = hingedDoor(b, 'EntryDoor', [0, 0.12, 1.02], 0.46, 0.94, p.primary, p.accent, p);
  bBox(door, [-0.23, 0.6, 0.028], [0.3, 0.48, 0.022], p.optic, false);
  bBox(door, [-0.23, 0.2, 0.028], [0.32, 0.22, 0.022], p.accent, false);
  if (detail && p.hd) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      bOrb(b, [Math.sin(a) * 0.96, 1.72, Math.cos(a) * 0.96], 0.036, p.accent, p.hd, 8);
    }
  }
  root.animations = [
    new T.AnimationClip('Ventilate conservatory', 3.4, [
      swingTrack('CrownVent', 'x', 3.4, 40),
      swingTrack('EntryDoor', 'y', 3.4, 78),
    ]),
    new T.AnimationClip('Open entry door', 3, [swingTrack('EntryDoor', 'y', 3, 82)]),
  ];
}

function ferryTerminalHall(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'FerryTerminal');
  const pier = matte('#6c5643', 0.88, 0, 'Wharf timber');
  const stone = matte('#8e8f8a', 0.9, 0, 'Quay edge');
  bBox(b, [0, 0.07, 0], [3.26, 0.14, 2.32], pier, p.hd);
  bBox(b, [0, 0.1, 1.15], [3.28, 0.12, 0.1], stone, p.hd);
  bArchVault(b, [-0.26, 0.12, -0.14], 1.88, 0.86, 0.74, 1.62, p.primary, p.hd);
  for (const z of [-0.94, -0.54, -0.14, 0.26, 0.66]) {
    bArchPortal(b, [-0.26, 0.12, z], 2.04, 1.82, 0.86, 0.09, p.accent, p.hd);
  }
  bBox(b, [-0.26, 1.8, -0.14], [0.46, 0.16, 1.5], p.accent, p.hd);
  bBox(b, [-0.26, 1.78, -0.14], [0.5, 0.08, 1.38], p.optic, p.hd);
  bArchVault(b, [-0.26, 0.92, 0.69], 1.34, 0.14, 0.54, 0.055, p.optic, p.hd);
  bBox(b, [-0.26, 0.5, 0.7], [1.14, 0.74, 0.06], p.dark, p.hd);
  for (const x of [-0.62, -0.26, 0.1]) bBox(b, [x, 0.5, 0.73], [0.28, 0.6, 0.03], p.optic, false);
  bBox(b, [-0.26, 1.62, 0.72], [0.58, 0.48, 0.14], p.primary, p.hd);
  clockDial(b, [-0.26, 1.64, 0.82], 0.22, p.accent, p.stencil, p.dark, p, detail);
  bArchVault(b, [-0.26, 0.92, -0.97], 1.3, 0.14, 0.5, 0.055, p.optic, p.hd);
  for (const s of [-1, 1]) {
    const side = group(b, '', [-0.26 + s * 0.94, 0, -0.14]);
    side.rotation.y = (s * Math.PI) / 2;
    for (const z of [-0.6, -0.2, 0.2, 0.6]) framedWindow(side, [z, 0.56, 0], 0.22, 0.42, p.dark, stone, p, detail);
  }
  bBox(b, [1.08, 0.2, 0.36], [0.76, 0.14, 1.24], pier, p.hd);
  bBox(b, [1.08, 0.15, 1.04], [0.76, 0.08, 0.24], pier, p.hd).rotation.x = 0.22;
  for (const s of [-1, 1]) {
    for (const z of [-0.14, 0.36, 0.84]) bBox(b, [1.08 + s * 0.35, 0.46, z], [0.055, 0.42, 0.055], p.dark, p.hd);
    bBox(b, [1.08 + s * 0.35, 0.66, 0.35], [0.05, 0.05, 1.04], p.alloy, p.hd);
  }
  bBox(b, [1.44, 0.44, 0.86], [0.14, 0.58, 0.14], p.dark, p.hd);
  const gate = group(b, 'BoardingGate', [1.44, 0.64, 0.86]);
  bBox(gate, [-0.36, 0, 0], [0.74, 0.075, 0.045], p.accent, p.hd);
  for (const x of [-0.18, -0.44, -0.64]) bBox(gate, [x, 0, 0.025], [0.08, 0.07, 0.015], p.stencil, false);
  bBox(b, [1.2, 0.28, -0.66], [0.4, 0.32, 0.4], p.dark, p.hd);
  bCyl(b, [1.2, 1.48, -0.66], 0.045, 0.075, 2.16, p.stencil, p.hd, 12);
  bBox(b, [1.2, 2.16, -0.66], [0.74, 0.045, 0.045], p.alloy, false);
  bCyl(b, [1.2, 2.48, -0.66], 0.2, 0.16, 0.07, p.accent, p.hd, 12);
  const radar = group(b, 'RadarMast', [1.2, 2.6, -0.66]);
  bCyl(radar, [0, 0, 0], 0.07, 0.08, 0.16, p.dark, p.hd, 10);
  bBox(radar, [0, 0.1, 0], [0.64, 0.09, 0.08], p.accent, p.hd);
  for (const s of [-1, 1]) bBox(radar, [s * 0.33, 0.1, 0], [0.05, 0.095, 0.09], p.stencil, p.hd);
  if (detail) {
    for (const x of [-1.24, -0.44, 0.34]) bCyl(b, [x, 0.22, 1.06], 0.055, 0.065, 0.16, p.dark, p.hd, 10);
    for (let i = -2; i <= 2; i++) {
      bStrut(b, [-0.26, 1.06, 0.725], [-0.26 + Math.sin(i * 0.45) * 0.58, 1.06 + Math.cos(i * 0.45) * 0.48, 0.725], 0.014, p.dark, p.hd, 6);
    }
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) bOrb(b, [1.2 + s * 0.34, 2.22, -0.66], 0.04, s > 0 ? p.accent : p.optic, p.hd, 8);
    for (const z of [-0.53, 0.25]) bRing(b, [-0.26, 1.64, z], 0.12, 0.024, 0.04, p.alloy, p.hd, 12);
  }
  root.animations = [
    new T.AnimationClip('Ferry arrival', 4, [
      spinTrack('RadarMast', 'y', 4, 1),
      swingTrack('BoardingGate', 'z', 4, 65),
    ]),
    new T.AnimationClip('Lift boarding gate', 3, [swingTrack('BoardingGate', 'z', 3, 68)]),
  ];
}

export const buildingsCivicB: readonly CivicBuildDef[] = [
  {
    id: 'timber-grain-silo',
    riggedParts: [
      rot('VentTurbine', 'Vent turbine', 'y', [0, 360], 'Rotates the rooftop grain silo ventilator turbine'),
      rot('ChuteGate', 'Chute gate', 'x', [0, 58], 'Swings the hopper discharge chute gate open'),
    ],
    detachableParts: [],
    build: timberGrainSilo,
  },
  {
    id: 'elevated-water-tower',
    riggedParts: [
      rot('WindVane', 'Wind vane', 'y', [0, 360], 'Spins the conical roof weathervane'),
      slide('LevelGauge', 'Level gauge', 'y', [0, 0.48], 'Slides the exterior tank depth indicator target'),
    ],
    detachableParts: [],
    build: elevatedWaterTower,
  },
  {
    id: 'red-barn-hayloft',
    riggedParts: [
      rot('BarnDoorL', 'Left barn door', 'y', [0, -82], 'Swings the cross-braced left wagon door outward'),
      rot('HayloftDoor', 'Hayloft door', 'x', [0, 68], 'Tilts the upper hayloft access door outward'),
    ],
    detachableParts: [],
    build: redBarnHayloft,
  },
  {
    id: 'victorian-conservatory',
    riggedParts: [
      rot('EntryDoor', 'Entry door', 'y', [0, 82], 'Swings the arched botanical entry door open'),
      rot('CrownVent', 'Crown vent', 'x', [0, 42], 'Tilts the octagonal lantern dome cap open'),
    ],
    detachableParts: [],
    build: victorianConservatory,
  },
  {
    id: 'ferry-terminal-hall',
    riggedParts: [
      rot('BoardingGate', 'Boarding gate', 'z', [0, 68], 'Lifts the striped passenger ramp barrier arm'),
      rot('RadarMast', 'Radar mast', 'y', [0, 360], 'Rotates the maritime scanner bar atop the signal mast'),
    ],
    detachableParts: [],
    build: ferryTerminalHall,
  },
];
