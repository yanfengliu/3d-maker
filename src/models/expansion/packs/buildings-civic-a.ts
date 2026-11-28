import * as T from 'three';
import {
  archedWindow,
  bArchPortal,
  bArchVault,
  bBox,
  bCone,
  bCyl,
  bellSolid,
  bGable,
  bLathe,
  bOctPrism,
  bOrb,
  bRing,
  bStrut,
  clockDial,
  det,
  framedWindow,
  glow,
  group,
  hingedDoor,
  matte,
  quad,
  rot,
  slide,
  slideTrack,
  spinTrack,
  swingTrack,
} from './buildings-civic-kit';
import type { CivicBuildDef, Finish, Point } from './buildings-civic-kit';

function brickFireStation(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'FireStation');
  const stone = matte('#c9c0ad', 0.88, 0, 'Firehouse stone');
  const slate = matte('#3f4852', 0.84, 0.05, 'Firehouse slate');
  bBox(b, [0, 0.06, 0], [2.58, 0.12, 1.94], stone, p.hd);
  bBox(b, [0.24, 1.06, -0.02], [1.88, 1.92, 1.54], p.primary, p.hd);
  bBox(b, [0.24, 1.16, -0.02], [1.98, 0.09, 1.64], stone, p.hd);
  bBox(b, [0.24, 2.04, -0.02], [2.02, 0.1, 1.68], stone, p.hd);
  bBox(b, [0.24, 2.13, -0.02], [1.84, 0.1, 1.48], slate, p.hd);
  bBox(b, [0.24, 2.24, 0.7], [1.26, 0.3, 0.14], p.primary, p.hd);
  bBox(b, [0.24, 2.41, 0.7], [1.34, 0.07, 0.2], stone, p.hd);
  bRing(b, [0.24, 2.24, 0.8], 0.11, 0.03, 0.04, p.accent, p.hd, 14).rotation.x = Math.PI / 2;
  bBox(b, [0.24, 0.56, 0.74], [0.98, 0.9, 0.06], p.inset, false);
  bArchPortal(b, [0.24, 0.11, 0.77], 1.24, 0.98, 0.62, 0.1, stone, p.hd);
  bBox(b, [0.24, 1.38, 0.82], [0.14, 0.16, 0.08], p.accent, p.hd);
  const bayRest: Point = [0.24, 0.12, 0.775];
  const bayDoor = group(b, 'BayDoor', bayRest);
  bBox(bayDoor, [0, 0.42, 0], [0.94, 0.84, 0.045], p.accent, p.hd);
  for (const y of [0.2, 0.44]) bBox(bayDoor, [0, y, 0.032], [0.84, 0.045, 0.02], p.dark, false);
  for (const x of [-0.26, 0, 0.26]) bBox(bayDoor, [x, 0.68, 0.03], [0.2, 0.18, 0.025], p.optic, false);
  for (const x of [-0.32, 0.24, 0.8]) archedWindow(b, [x, 1.62, 0.76], 0.3, 0.42, stone, stone, p, detail);
  const sideWall = group(b, '', [1.19, 0, -0.02]);
  sideWall.rotation.y = Math.PI / 2;
  for (const x of [-0.36, 0.36]) {
    framedWindow(sideWall, [x, 0.68, 0], 0.28, 0.38, stone, stone, p, detail);
    framedWindow(sideWall, [x, 1.62, 0], 0.28, 0.38, stone, stone, p, detail);
  }
  const backWall = group(b, '', [0.24, 0, -0.8]);
  backWall.rotation.y = Math.PI;
  for (const x of [-0.42, 0.42]) framedWindow(backWall, [x, 1.62, 0], 0.3, 0.4, stone, stone, p, detail);
  bBox(backWall, [0, 0.52, 0.02], [0.46, 0.82, 0.06], p.dark, p.hd);
  bBox(b, [-0.82, 1.41, -0.06], [0.68, 2.62, 0.68], p.primary, p.hd);
  for (const y of [1.16, 2.04, 2.72]) bBox(b, [-0.82, y, -0.06], [0.78, 0.09, 0.78], stone, p.hd);
  quad((sx, sz) => bBox(b, [-0.82 + sx * 0.25, 3.01, -0.06 + sz * 0.25], [0.14, 0.56, 0.14], p.primary, p.hd));
  bBox(b, [-0.82, 3.2, -0.06], [0.6, 0.08, 0.1], p.dark, p.hd);
  const bell = group(b, 'AlarmBell', [-0.82, 3.17, -0.06]);
  bBox(bell, [0, 0.02, 0], [0.22, 0.06, 0.09], p.dark, false);
  bellSolid(bell, [0, 0, 0], 0.66, p.accent, p.dark, p.hd);
  bBox(b, [-0.82, 3.31, -0.06], [0.82, 0.09, 0.82], stone, p.hd);
  bCone(b, [-0.82, 3.63, -0.06], 0.56, 0.58, p.accent, p.hd, 4, true).rotation.y = Math.PI / 4;
  bCyl(b, [-0.82, 3.96, -0.06], 0.02, 0.032, 0.18, p.alloy, p.hd, 10);
  bOrb(b, [-0.82, 4.04, -0.06], 0.045, p.accent, p.hd, 8);
  if (detail) {
    for (const y of [1.46, 1.72, 2.32, 2.52]) {
      bBox(b, [-0.82, y, 0.3], [0.34, 0.07, 0.045], p.dark, false);
      bBox(b, [-1.18, y, -0.06], [0.045, 0.07, 0.34], p.dark, false);
    }
    for (const sx of [-0.46, 0.94]) {
      bBox(b, [sx, 0.92, 0.79], [0.08, 0.16, 0.09], p.dark, false);
      bOrb(b, [sx, 1.03, 0.81], 0.045, glow('#ffd88a', '#e89b38', 0.45), p.hd, 8);
    }
  }
  if (detail && p.hd) {
    for (let i = -3; i <= 3; i++) bBox(b, [0.24 + i * 0.24, 1.97, 0.81], [0.07, 0.07, 0.05], stone, p.hd);
    for (const y of [0.5, 0.84, 1.5, 1.84]) bBox(b, [-0.82, y, 0.3], [0.46, 0.04, 0.03], p.alloy, false);
  }
  root.animations = [
    new T.AnimationClip('Fire alarm dispatch', 3.4, [
      slideTrack('BayDoor', 'y', bayRest, 3.4, 0.48),
      swingTrack('AlarmBell', 'x', 3.4, 28, true),
    ]),
    new T.AnimationClip('Ring alarm bell', 2.8, [swingTrack('AlarmBell', 'x', 2.8, 28, true)]),
  ];
}

function municipalCourthouse(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'Courthouse');
  const granite = matte('#8e8b82', 0.9, 0, 'Courthouse granite');
  const trim = matte('#e5dfd0', 0.86, 0, 'Courthouse limestone trim');
  const slate = matte('#434c54', 0.84, 0.05, 'Courthouse roof');
  bBox(b, [0, 0.06, 0], [3.08, 0.12, 2.24], granite, p.hd);
  bBox(b, [0, 0.24, -0.06], [2.86, 0.28, 1.72], trim, p.hd);
  for (let i = 0; i < 3; i++) {
    bBox(b, [0, 0.14 + i * 0.08, 1.04 - i * 0.12], [1.74 - i * 0.1, 0.09, 0.22], granite, p.hd);
  }
  bBox(b, [0, 1.07, -0.22], [2.66, 1.42, 1.24], p.primary, p.hd);
  bBox(b, [0, 1.82, -0.22], [2.82, 0.12, 1.38], trim, p.hd);
  bBox(b, [0, 1.98, -0.22], [2.52, 0.24, 1.12], slate, p.hd);
  for (const x of [-0.74, -0.38, 0.38, 0.74]) {
    bBox(b, [x, 0.43, 0.66], [0.19, 0.1, 0.19], trim, p.hd);
    bCyl(b, [x, 1.08, 0.66], 0.068, 0.082, 1.22, p.primary, p.hd, 12);
    bCyl(b, [x, 1.7, 0.66], 0.095, 0.072, 0.07, trim, p.hd, 12);
    bBox(b, [x, 1.75, 0.66], [0.21, 0.06, 0.21], trim, p.hd);
    if (detail) {
      for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        bBox(
          b,
          [x + Math.sin(a) * 0.078, 1.08, 0.66 + Math.cos(a) * 0.078],
          [0.018, 1.14, 0.018],
          trim,
          false,
        );
      }
    }
  }
  bBox(b, [0, 1.83, 0.56], [1.66, 0.14, 0.42], trim, p.hd);
  bGable(b, [0, 1.9, 0.56], 1.62, 0.52, 0.34, p.primary, p.hd);
  const run = 0.88;
  const slope = Math.hypot(run, 0.52) + 0.06;
  const ang = Math.atan2(0.52, run);
  for (const s of [-1, 1]) {
    bBox(b, [s * run * 0.5, 2.18, 0.58], [slope, 0.075, 0.46], trim, p.hd).rotation.z = -s * ang;
    framedWindow(b, [s * 1.02, 1.12, 0.41], 0.32, 0.66, trim, granite, p, detail);
    const side = group(b, '', [s * 1.34, 0, -0.22]);
    side.rotation.y = (s * Math.PI) / 2;
    for (const z of [-0.3, 0.3]) framedWindow(side, [z, 1.12, 0], 0.3, 0.64, trim, granite, p, detail);
  }
  bCyl(b, [0, 2.1, 0.74], 0.14, 0.14, 0.04, p.accent, p.hd, 14).rotation.x = Math.PI / 2;
  const back = group(b, '', [0, 0, -0.85]);
  back.rotation.y = Math.PI;
  for (const x of [-0.88, -0.3, 0.3, 0.88]) framedWindow(back, [x, 1.12, 0], 0.3, 0.64, trim, granite, p, detail);
  hingedDoor(b, 'CourtDoor', [0, 0.38, 0.42], 0.48, 0.92, p.accent, trim, p);
  bBox(b, [0, 1.48, 0.42], [0.54, 0.2, 0.05], p.optic, p.hd);
  bBox(b, [0, 2.22, -0.22], [0.92, 0.36, 0.92], p.primary, p.hd);
  bBox(b, [0, 2.42, -0.22], [1.04, 0.08, 1.04], trim, p.hd);
  bOctPrism(b, [0, 2.71, -0.22], 0.45, 0.54, p.primary, p.hd);
  for (let i = 0; i < 4; i++) {
    const face = group(b, '', [0, 2.72, -0.22]);
    face.rotation.y = (i * Math.PI) / 2;
    clockDial(face, [0, 0, 0.43], 0.16, p.accent, p.stencil, p.dark, p, detail);
  }
  bOctPrism(b, [0, 3.0, -0.22], 0.5, 0.08, trim, p.hd);
  const domeProf: [number, number][] = [];
  const dSteps = p.hd ? 14 : 5;
  for (let i = 0; i <= dSteps; i++) {
    const t = (i / dSteps) * (Math.PI / 2);
    domeProf.push([Math.max(0.01, Math.cos(t) * 0.44), Math.sin(t) * 0.44]);
  }
  bLathe(b, [0, 3.04, -0.22], domeProf, p.accent, p.hd, 8, true).rotation.y = Math.PI / 8;
  bCyl(b, [0, 3.58, -0.22], 0.025, 0.04, 0.28, p.alloy, p.hd, 10);
  const vane = group(b, 'ScaleVane', [0, 3.68, -0.22]);
  bBox(vane, [0, 0, 0], [0.52, 0.03, 0.03], p.alloy, false);
  bOrb(vane, [0, 0.05, 0], 0.045, p.accent, p.hd, 8);
  for (const s of [-1, 1]) {
    bStrut(vane, [s * 0.23, 0, 0], [s * 0.23, -0.14, 0], 0.012, p.alloy, p.hd, 6);
    bCyl(vane, [s * 0.23, -0.15, 0], 0.08, 0.04, 0.04, p.accent, p.hd, 10);
  }
  if (detail && p.hd) {
    for (let i = -5; i <= 5; i++) bBox(b, [i * 0.24, 1.76, 0.43], [0.06, 0.06, 0.05], trim, p.hd);
    quad((sx, sz) => bOrb(b, [sx * 0.44, 2.52, -0.22 + sz * 0.44], 0.05, trim, p.hd, 8));
  }
  root.animations = [
    new T.AnimationClip('Session and vane', 4, [
      spinTrack('ScaleVane', 'y', 4, 1),
      swingTrack('CourtDoor', 'y', 4, 80),
    ]),
    new T.AnimationClip('Open court door', 3, [swingTrack('CourtDoor', 'y', 3, 82)]),
  ];
}

function carnegiePublicLibrary(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'PublicLibrary');
  const granite = matte('#8c887e', 0.9, 0, 'Library granite');
  const trim = matte('#e3dbc8', 0.86, 0, 'Library stone trim');
  const roof = matte('#4b5359', 0.84, 0.06, 'Library roof');
  bBox(b, [0, 0.06, 0], [2.94, 0.12, 2.12], granite, p.hd);
  bBox(b, [0, 0.27, -0.06], [2.6, 0.34, 1.62], trim, p.hd);
  for (let i = 0; i < 3; i++) {
    bBox(b, [0, 0.15 + i * 0.09, 0.98 - i * 0.1], [1.08 - i * 0.08, 0.09, 0.2], granite, p.hd);
  }
  bBox(b, [0, 1.04, -0.06], [2.48, 1.24, 1.52], p.primary, p.hd);
  bBox(b, [0, 1.13, 0.72], [1.02, 1.42, 0.32], p.primary, p.hd);
  bBox(b, [0, 1.88, 0.72], [1.14, 0.1, 0.42], trim, p.hd);
  bGable(b, [0, 1.93, 0.72], 1.08, 0.26, 0.32, trim, p.hd);
  bArchPortal(b, [0, 0.44, 0.9], 0.88, 0.62, 0.68, 0.1, trim, p.hd);
  hingedDoor(b, 'LibraryDoor', [0, 0.44, 0.89], 0.48, 0.84, p.accent, p.dark, p);
  bArchVault(b, [0, 1.26, 0.89], 0.52, 0.04, 0.2, 0.04, p.optic, p.hd);
  for (const s of [-1, 1]) {
    archedWindow(b, [s * 0.88, 1.08, 0.71], 0.32, 0.62, trim, granite, p, detail);
    framedWindow(b, [s * 0.64, 1.02, 0.71], 0.12, 0.44, trim, granite, p, false);
    framedWindow(b, [s * 1.12, 1.02, 0.71], 0.12, 0.44, trim, granite, p, false);
    const side = group(b, '', [s * 1.25, 0, -0.06]);
    side.rotation.y = (s * Math.PI) / 2;
    for (const z of [-0.36, 0.36]) archedWindow(side, [z, 1.08, 0], 0.34, 0.6, trim, granite, p, detail);
  }
  const back = group(b, '', [0, 0, -0.83]);
  back.rotation.y = Math.PI;
  for (const x of [-0.74, 0, 0.74]) archedWindow(back, [x, 1.08, 0], 0.36, 0.6, trim, granite, p, detail);
  bBox(b, [0, 1.7, -0.06], [2.64, 0.1, 1.68], trim, p.hd);
  bBox(b, [0, 1.78, -0.06], [2.36, 0.1, 1.4], roof, p.hd);
  for (const s of [-1, 1]) {
    bBox(b, [0, 1.84, -0.06 + s * 0.78], [2.52, 0.16, 0.08], trim, p.hd);
    bBox(b, [s * 1.24, 1.84, -0.06], [0.08, 0.16, 1.62], trim, p.hd);
  }
  bOctPrism(b, [0, 1.94, -0.06], 0.76, 0.28, p.primary, p.hd);
  bOctPrism(b, [0, 2.09, -0.06], 0.81, 0.07, trim, p.hd);
  const domeProf: [number, number][] = [];
  const steps = p.hd ? 14 : 5;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (Math.PI / 2);
    domeProf.push([Math.max(0.01, Math.cos(t) * 0.74), Math.sin(t) * 0.44]);
  }
  bLathe(b, [0, 2.12, -0.06], domeProf, p.accent, p.hd, 16);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    bStrut(
      b,
      [Math.sin(a) * 0.74, 2.12, -0.06 + Math.cos(a) * 0.74],
      [Math.sin(a) * 0.24, 2.54, -0.06 + Math.cos(a) * 0.24],
      0.022,
      p.dark,
      p.hd,
      8,
    );
  }
  bCyl(b, [0, 2.6, -0.06], 0.22, 0.24, 0.16, p.optic, p.hd, 12);
  bCone(b, [0, 2.75, -0.06], 0.26, 0.16, p.accent, p.hd, 12);
  bOrb(b, [0, 2.86, -0.06], 0.045, p.alloy, p.hd, 8);
  const drop = group(b, 'BookDrop', [1.14, 0.12, 0.82]);
  bBox(drop, [0, 0.04, 0], [0.28, 0.08, 0.28], p.dark, p.hd);
  bBox(drop, [0, 0.28, 0], [0.23, 0.42, 0.23], p.accent, p.hd);
  bBox(drop, [0, 0.52, 0.015], [0.27, 0.12, 0.27], p.accent, p.hd);
  bBox(drop, [0, 0.42, 0.125], [0.16, 0.07, 0.03], p.alloy, false);
  bBox(drop, [0, 0.42, 0.14], [0.12, 0.028, 0.015], p.inset, false);
  if (detail) {
    quad((sx, sz) => bBox(b, [sx * 1.24, 1.98, -0.06 + sz * 0.78], [0.14, 0.16, 0.14], trim, p.hd));
    for (const s of [-1, 1]) bBox(b, [s * 0.44, 1.12, 0.89], [0.09, 1.24, 0.06], trim, p.hd);
  }
  if (detail && p.hd) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      bBox(b, [Math.sin(a) * 0.72, 1.94, -0.06 + Math.cos(a) * 0.72], [0.24, 0.16, 0.05], p.optic, p.hd).rotation.y =
        a;
    }
  }
  root.animations = [new T.AnimationClip('Open library door', 3.2, [swingTrack('LibraryDoor', 'y', 3.2, 82)])];
}

function chromeCornerDiner(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'CornerDiner');
  const concrete = matte('#8c8d8a', 0.9, 0, 'Diner curb');
  const stainless = matte('#cfd5d9', 0.34, 0.62, 'Diner chrome');
  bBox(b, [0, 0.06, 0], [3.12, 0.12, 1.88], concrete, p.hd);
  bBox(b, [0, 0.31, 0], [1.74, 0.42, 1.08], p.primary, p.hd);
  bBox(b, [0, 0.91, 0], [1.66, 0.5, 1.0], p.inset, false);
  bBox(b, [0, 0.91, 0], [1.74, 0.46, 1.06], p.optic, p.hd);
  bBox(b, [0, 1.27, 0], [1.8, 0.24, 1.14], p.primary, p.hd);
  bBox(b, [0, 1.27, 0], [1.84, 0.075, 1.18], p.accent, p.hd);
  bBox(b, [0, 0.6, 0], [1.8, 0.16, 1.12], p.dark, p.hd);
  for (const s of [-1, 1]) {
    bCyl(b, [s * 0.87, 0.31, 0], 0.54, 0.54, 0.42, p.primary, p.hd, 14);
    bCyl(b, [s * 0.87, 0.6, 0], 0.56, 0.56, 0.16, p.dark, p.hd, 14);
    bCyl(b, [s * 0.87, 0.91, 0], 0.535, 0.535, 0.46, p.optic, p.hd, 14);
    bCyl(b, [s * 0.87, 1.27, 0], 0.57, 0.57, 0.24, p.primary, p.hd, 14);
    bRing(b, [s * 0.87, 1.27, 0], 0.59, 0.035, 0.075, p.accent, p.hd, 16);
    bLathe(
      b,
      [s * 0.87, 1.39, 0],
      [
        [0.54, 0],
        [0.48, 0.12],
        [0.32, 0.21],
        [0.01, 0.25],
      ],
      stainless,
      p.hd,
      14,
    );
  }
  const vault = bArchVault(b, [0, 1.38, 0], 1.08, 0.04, 0.22, 1.74, stainless, p.hd);
  vault.rotation.y = Math.PI / 2;
  bBox(b, [0, 1.66, 0], [1.62, 0.14, 0.46], p.accent, p.hd);
  bBox(b, [0, 1.66, 0], [1.5, 0.075, 0.5], p.optic, p.hd);
  for (let i = -5; i <= 5; i++) {
    for (const sz of [-1, 1]) {
      bBox(b, [i * 0.16, 0.635, sz * 0.575], [0.12, 0.065, 0.025], i % 2 === 0 ? p.stencil : p.accent, false);
      bBox(b, [i * 0.16, 0.565, sz * 0.575], [0.12, 0.065, 0.025], i % 2 === 0 ? p.accent : p.stencil, false);
    }
  }
  bBox(b, [0, 0.64, 0.63], [0.68, 1.04, 0.22], stainless, p.hd);
  bBox(b, [0, 1.2, 0.72], [0.82, 0.11, 0.36], p.accent, p.hd);
  const door = hingedDoor(b, 'DinerDoor', [0, 0.12, 0.75], 0.46, 0.96, stainless, p.dark, p);
  bBox(door, [-0.23, 0.64, 0.03], [0.3, 0.42, 0.02], p.optic, false);
  bBox(door, [-0.23, 0.24, 0.03], [0.32, 0.22, 0.02], p.accent, false);
  bBox(b, [0.58, 0.82, -0.66], [0.42, 1.12, 0.24], p.alloy, p.hd);
  bCyl(b, [0.58, 1.48, -0.66], 0.09, 0.1, 0.26, p.dark, p.hd, 10);
  bCyl(b, [0, 1.78, 0], 0.15, 0.18, 0.16, p.dark, p.hd, 12);
  const sign = group(b, 'RoofSign', [0, 1.86, 0]);
  bCyl(sign, [0, 0.12, 0], 0.045, 0.055, 0.28, p.alloy, p.hd, 10);
  bBox(sign, [0, 0.26, 0], [0.88, 0.3, 0.08], p.accent, p.hd);
  bBox(sign, [0, 0.26, 0], [0.76, 0.2, 0.11], p.stencil, p.hd);
  bCyl(sign, [0, 0.44, 0], 0.22, 0.16, 0.045, p.stencil, p.hd, 14);
  bCyl(sign, [0, 0.56, 0], 0.15, 0.12, 0.22, p.stencil, p.hd, 14);
  bCyl(sign, [0, 0.675, 0], 0.125, 0.125, 0.025, p.dark, p.hd, 12);
  bBox(sign, [0.18, 0.56, 0], [0.09, 0.14, 0.04], p.stencil, p.hd);
  bCyl(sign, [-0.04, 0.78, 0], 0.022, 0.018, 0.18, p.accent, p.hd, 8).rotation.z = 0.22;
  bCyl(sign, [0.05, 0.8, 0], 0.022, 0.018, 0.2, p.accent, p.hd, 8).rotation.z = -0.18;
  if (detail) {
    for (const x of [-0.66, -0.34, 0.34, 0.66]) {
      for (const sz of [-1, 1]) bBox(b, [x, 0.91, sz * 0.545], [0.035, 0.48, 0.035], stainless, false);
    }
    for (const s of [-1, 1]) {
      for (const a of [-0.9, -0.3, 0.3, 0.9]) {
        bBox(
          b,
          [s * (0.87 + Math.cos(a) * 0.545), 0.91, Math.sin(a) * 0.545],
          [0.035, 0.48, 0.035],
          stainless,
          false,
        ).rotation.y = -s * a;
      }
    }
  }
  if (detail && p.hd) {
    for (const y of [0.22, 0.38]) {
      bBox(b, [0, y, 0], [1.8, 0.024, 1.12], p.alloy, false);
      for (const s of [-1, 1]) bRing(b, [s * 0.87, y, 0], 0.555, 0.02, 0.024, p.alloy, p.hd, 16);
    }
  }
  root.animations = [
    new T.AnimationClip('Diner neon spin', 4, [
      spinTrack('RoofSign', 'y', 4, 1),
      swingTrack('DinerDoor', 'y', 4, 78),
    ]),
    new T.AnimationClip('Open diner door', 3, [swingTrack('DinerDoor', 'y', 3, 82)]),
  ];
}

function vintageServiceStation(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'ServiceStation');
  const concrete = matte('#8e8f8a', 0.9, 0, 'Forecourt apron');
  const curb = matte('#b4b2a8', 0.88, 0, 'Pump island');
  const globe = glow('#fff3cf', '#f0be59', 0.45, 'Pump globe');
  bBox(b, [0, 0.06, 0], [3.26, 0.12, 2.54], concrete, p.hd);
  bBox(b, [-0.82, 0.72, -0.52], [1.14, 1.24, 1.14], p.primary, p.hd);
  bCyl(b, [-1.36, 0.72, 0.02], 0.24, 0.24, 1.24, p.primary, p.hd, 12);
  bBox(b, [0.56, 0.87, -0.58], [1.62, 1.54, 1.26], p.primary, p.hd);
  bBox(b, [0.56, 1.54, -0.58], [1.7, 0.12, 1.34], p.accent, p.hd);
  bBox(b, [0.56, 1.66, -0.58], [1.66, 0.08, 1.3], p.stencil, p.hd);
  bBox(b, [-0.82, 0.74, 0.06], [0.76, 0.62, 0.055], p.dark, p.hd);
  bBox(b, [-0.82, 0.74, 0.08], [0.68, 0.54, 0.04], p.optic, p.hd);
  bBox(b, [0.56, 0.62, 0.06], [1.06, 1.0, 0.06], p.inset, false);
  bBox(b, [0.56, 1.15, 0.07], [1.18, 0.09, 0.09], p.dark, p.hd);
  for (const s of [-1, 1]) bBox(b, [0.56 + s * 0.55, 0.62, 0.07], [0.09, 1.02, 0.09], p.dark, p.hd);
  const bayRest: Point = [0.56, 0.12, 0.095];
  const bay = group(b, 'ServiceBayDoor', bayRest);
  bBox(bay, [0, 0.49, 0], [0.98, 0.96, 0.048], p.stencil, p.hd);
  bBox(bay, [0, 0.18, 0.022], [0.96, 0.26, 0.02], p.accent, false);
  for (const x of [-0.3, -0.1, 0.1, 0.3]) bBox(bay, [x, 0.74, 0.025], [0.15, 0.18, 0.02], p.optic, false);
  bBox(b, [-0.5, 1.38, 0.48], [1.88, 0.18, 1.14], p.primary, p.hd);
  bBox(b, [-0.5, 1.38, 0.48], [1.94, 0.08, 1.2], p.accent, p.hd);
  bBox(b, [-0.5, 1.76, -0.02], [0.22, 0.68, 0.78], p.accent, p.hd);
  bBox(b, [-0.5, 1.8, -0.02], [0.26, 0.12, 0.64], p.stencil, p.hd);
  for (const x of [-1.16, 0.16]) {
    bBox(b, [x, 0.2, 0.72], [0.24, 0.16, 0.24], curb, p.hd);
    bCyl(b, [x, 0.78, 0.72], 0.065, 0.085, 1.14, p.primary, p.hd, 12);
    bRing(b, [x, 1.24, 0.72], 0.095, 0.028, 0.06, p.accent, p.hd, 12);
  }
  bBox(b, [-0.5, 0.16, 0.72], [1.56, 0.1, 0.44], curb, p.hd);
  const pumps = group(b, 'FuelPumps', [-0.5, 0.21, 0.72]);
  for (const px of [-0.34, 0.34]) {
    const pump = group(pumps, '', [px, 0, 0]);
    bBox(pump, [0, 0.04, 0], [0.26, 0.08, 0.22], p.dark, p.hd);
    bBox(pump, [0, 0.32, 0], [0.23, 0.52, 0.18], p.accent, p.hd);
    for (const sz of [-1, 1]) {
      bBox(pump, [0, 0.4, sz * 0.095], [0.17, 0.18, 0.025], p.stencil, false);
      bBox(pump, [0, 0.4, sz * 0.11], [0.13, 0.12, 0.015], p.optic, false);
    }
    bCyl(pump, [0, 0.62, 0], 0.04, 0.05, 0.08, p.alloy, p.hd, 10);
    bOrb(pump, [0, 0.73, 0], 0.095, globe, p.hd, 10);
    bStrut(pump, [0.12, 0.44, 0], [0.18, 0.24, 0.02], 0.016, p.tire, p.hd, 6);
    bStrut(pump, [0.18, 0.24, 0.02], [0.12, 0.16, 0], 0.016, p.tire, p.hd, 6);
  }
  const back = group(b, '', [0.56, 0, -1.22]);
  back.rotation.y = Math.PI;
  for (const x of [-0.42, 0.42]) framedWindow(back, [x, 0.92, 0], 0.34, 0.44, p.dark, curb, p, detail);
  bCyl(b, [1.44, 0.42, -0.62], 0.14, 0.14, 0.54, p.accent, p.hd, 12).rotation.x = Math.PI / 2;
  for (const z of [-0.78, -0.46]) bBox(b, [1.44, 0.22, z], [0.22, 0.22, 0.06], p.dark, p.hd);
  if (detail) {
    for (const x of [-1.02, -0.62]) bBox(b, [x, 0.74, 0.105], [0.022, 0.54, 0.02], p.dark, false);
    for (const y of [0.38, 0.56]) bBox(bay, [0, y, 0.03], [0.94, 0.025, 0.018], p.dark, false);
    bBox(b, [-1.42, 0.62, -0.58], [0.06, 0.96, 0.46], p.dark, p.hd);
  }
  if (detail && p.hd) {
    for (const x of [-1.14, -0.5, 0.14]) bOrb(b, [x, 1.27, 0.72], 0.045, globe, p.hd, 8);
    bRing(b, [-0.5, 1.98, 0.38], 0.14, 0.03, 0.04, p.stencil, p.hd, 14).rotation.x = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Open service bay', 3.4, [slideTrack('ServiceBayDoor', 'y', bayRest, 3.4, 0.56)]),
  ];
}

export const buildingsCivicA: readonly CivicBuildDef[] = [
  {
    id: 'brick-fire-station',
    riggedParts: [
      slide('BayDoor', 'Engine bay door', 'y', [0, 0.48], 'Slides the arched engine bay door upward'),
      rot('AlarmBell', 'Alarm bell', 'x', [-28, 28], 'Swings the brass hose-tower alarm bell'),
    ],
    detachableParts: [],
    build: brickFireStation,
  },
  {
    id: 'municipal-courthouse',
    riggedParts: [
      rot('CourtDoor', 'Court door', 'y', [0, 82], 'Swings the portico courthouse entrance door open'),
      rot('ScaleVane', 'Scale vane', 'y', [0, 360], 'Rotates the scales-of-justice cupola weathervane'),
    ],
    detachableParts: [],
    build: municipalCourthouse,
  },
  {
    id: 'carnegie-public-library',
    riggedParts: [rot('LibraryDoor', 'Library door', 'y', [0, 82], 'Swings the arched library entrance door open')],
    detachableParts: [det('BookDrop', 'Book drop', 'Curbside cast-iron library book return box beside the steps')],
    build: carnegiePublicLibrary,
  },
  {
    id: 'chrome-corner-diner',
    riggedParts: [
      rot('RoofSign', 'Roof neon sign', 'y', [0, 360], 'Spins the rooftop coffee-cup neon sign'),
      rot('DinerDoor', 'Diner door', 'y', [0, 82], 'Swings the chrome railcar entry door open'),
    ],
    detachableParts: [],
    build: chromeCornerDiner,
  },
  {
    id: 'vintage-service-station',
    riggedParts: [
      slide('ServiceBayDoor', 'Service bay door', 'y', [0, 0.56], 'Lifts the sectional service garage door upward'),
    ],
    detachableParts: [det('FuelPumps', 'Fuel pumps', 'Twin vintage globe-top fuel pumps on the forecourt island')],
    build: vintageServiceStation,
  },
];
