import * as T from 'three';
import {
  archedWindow,
  bArchPortal,
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
  det,
  framedWindow,
  group,
  hingedDoor,
  matte,
  mesh,
  pitchedRoof,
  quad,
  rot,
  slide,
  slideTrack,
  swingTrack,
} from './buildings-civic-kit';
import type { CivicBuildDef, Finish, Point } from './buildings-civic-kit';

function chamferPrism(
  parent: T.Object3D,
  y0: number,
  h: number,
  wHalf: number,
  dHalf: number,
  cut: number,
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  const shape = new T.Shape();
  shape
    .moveTo(-wHalf, -dHalf)
    .lineTo(wHalf, -dHalf)
    .lineTo(wHalf, dHalf - cut)
    .lineTo(wHalf - cut, dHalf)
    .lineTo(-wHalf, dHalf)
    .closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: hd,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  return mesh(parent, geo, mat, [0, y0, 0]);
}

function sawtoothBay(
  parent: T.Object3D,
  at: Point,
  w: number,
  h: number,
  d: number,
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  const shape = new T.Shape();
  shape.moveTo(-w / 2, 0).lineTo(w / 2, 0).lineTo(w / 2, h).closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: hd,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -d / 2);
  return mesh(parent, geo, mat, at);
}

function mountainRangerCabin(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'RangerCabin');
  const stone = matte('#8c887d', 0.9, 0, 'Fieldstone');
  const timber = matte('#96734e', 0.86, 0, 'Porch timber');
  const darkWood = matte('#4d3828', 0.88, 0, 'Cabin trim');
  bBox(b, [0, 0.07, 0], [2.9, 0.14, 2.28], stone, p.hd);
  bBox(b, [-0.14, 0.16, 0.2], [2.14, 0.12, 1.72], timber, p.hd);
  bBox(b, [-0.22, 0.13, 1.07], [0.76, 0.1, 0.2], timber, p.hd);
  bBox(b, [-0.18, 0.76, -0.26], [1.72, 1.12, 1.2], p.primary, p.hd);
  for (let i = 0; i < 6; i++) {
    const y = 0.3 + i * 0.18;
    for (const sz of [-0.84, 0.32]) {
      bCyl(b, [-0.18, y, sz], 0.068, 0.068, 2.08, p.primary, p.hd, 10).rotation.z = Math.PI / 2;
    }
    for (const sx of [-1.02, 0.66]) {
      bCyl(b, [sx, y, -0.26], 0.068, 0.068, 1.54, p.primary, p.hd, 10).rotation.x = Math.PI / 2;
    }
  }
  bBox(b, [-1.18, 0.62, -0.34], [0.42, 1.04, 0.56], stone, p.hd);
  bBox(b, [-1.18, 1.54, -0.34], [0.34, 0.86, 0.44], stone, p.hd);
  bBox(b, [-1.18, 2.2, -0.34], [0.28, 0.54, 0.36], stone, p.hd);
  bBox(b, [-1.18, 2.48, -0.34], [0.36, 0.08, 0.44], p.dark, p.hd);
  bCyl(b, [-1.18, 2.58, -0.34], 0.07, 0.085, 0.14, p.accent, p.hd, 10);
  for (const x of [-0.96, -0.18, 0.62]) bCyl(b, [x, 0.78, 0.88], 0.055, 0.062, 1.14, darkWood, p.hd, 10);
  bBox(b, [-0.17, 1.34, 0.88], [1.74, 0.09, 0.1], darkWood, p.hd);
  for (const [x0, w] of [
    [-0.72, 0.52],
    [0.36, 0.52],
  ] as const) {
    bBox(b, [x0, 0.56, 0.88], [w, 0.055, 0.06], darkWood, p.hd);
    bBox(b, [x0, 0.34, 0.88], [w, 0.05, 0.055], darkWood, p.hd);
  }
  pitchedRoof(b, [-0.18, 1.32, 0], 2.34, 0.92, 2.12, p.primary, p.accent, darkWood, p, detail);
  hingedDoor(b, 'CabinDoor', [-0.44, 0.22, 0.4], 0.46, 0.86, p.accent, darkWood, p);
  framedWindow(b, [0.24, 0.82, 0.4], 0.34, 0.4, p.stencil, darkWood, p, detail, p.accent);
  const back = group(b, '', [-0.18, 0, -0.92]);
  back.rotation.y = Math.PI;
  framedWindow(back, [0, 0.82, 0], 0.4, 0.4, p.stencil, darkWood, p, detail);
  for (const dx of [-0.2, 0.2]) bBox(b, [1.0 + dx, 0.56, 0.78], [0.06, 0.86, 0.06], darkWood, p.hd);
  bBox(b, [1.0, 0.72, 0.78], [0.46, 0.4, 0.055], darkWood, p.hd);
  bBox(b, [1.0, 0.72, 0.815], [0.36, 0.28, 0.025], p.stencil, false);
  bBox(b, [1.0, 0.8, 0.835], [0.28, 0.05, 0.015], p.accent, false);
  for (const s of [-1, 1]) {
    bBox(b, [1.0, 1.0, 0.78 + s * 0.1], [0.58, 0.05, 0.24], p.accent, p.hd).rotation.x = s * 0.42;
  }
  const wood = group(b, 'Woodpile', [1.0, 0.14, -0.26]);
  for (const z of [-0.36, 0.36]) bBox(wood, [0.22, 0.38, z], [0.055, 0.74, 0.055], darkWood, p.hd);
  bBox(wood, [0.06, 0.76, 0], [0.48, 0.055, 0.84], p.accent, p.hd).rotation.z = -0.32;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5 - (row % 2); col++) {
      const z = -0.26 + col * 0.13 + (row % 2) * 0.065;
      bCyl(
        wood,
        [0.06, 0.052 + row * 0.098, z],
        0.05,
        0.05,
        0.36,
        row % 2 === 0 ? p.primary : timber,
        p.hd,
        10,
      ).rotation.z = Math.PI / 2;
    }
  }
  if (detail) {
    for (const x of [-0.96, -0.18, 0.62]) bStrut(b, [x, 1.12, 0.88], [x, 1.32, 0.66], 0.026, darkWood, p.hd, 8);
    for (const x of [-0.84, -0.6, 0.24, 0.48]) bBox(b, [x, 0.45, 0.88], [0.03, 0.2, 0.03], darkWood, false);
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) bBox(b, [-0.18 + s * 0.12, 2.32, 1.07], [0.34, 0.055, 0.05], p.accent, p.hd).rotation.z = s * 0.72;
  }
  root.animations = [new T.AnimationClip('Open cabin door', 3.2, [swingTrack('CabinDoor', 'y', 3.2, 82)])];
}

function brickSchoolhouse(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'Schoolhouse');
  const stone = matte('#9c9689', 0.9, 0, 'School stone');
  const slate = matte('#3d4650', 0.84, 0.06, 'School slate');
  const brass = matte('#c49a3d', 0.38, 0.56, 'School bell brass');
  bBox(b, [0, 0.07, 0], [2.28, 0.14, 2.6], stone, p.hd);
  bBox(b, [0, 0.77, -0.14], [1.88, 1.3, 1.88], p.primary, p.hd);
  bBox(b, [0, 0.24, -0.14], [1.96, 0.1, 1.96], stone, p.hd);
  pitchedRoof(b, [0, 1.42, -0.14], 2.18, 1.04, 2.08, p.primary, slate, p.accent, p, detail);
  for (const s of [-1, 1]) {
    const side = group(b, '', [s * 0.95, 0, -0.14]);
    side.rotation.y = (s * Math.PI) / 2;
    for (const z of [-0.58, 0, 0.58]) framedWindow(side, [z, 0.82, 0], 0.3, 0.54, p.accent, stone, p, detail);
  }
  const back = group(b, '', [0, 0, -1.09]);
  back.rotation.y = Math.PI;
  for (const x of [-0.42, 0.42]) framedWindow(back, [x, 0.82, 0], 0.3, 0.52, p.accent, stone, p, detail);
  bBox(b, [0, 0.68, 0.92], [1.08, 1.12, 0.46], p.primary, p.hd);
  bBox(b, [0, 0.14, 1.2], [0.82, 0.1, 0.18], stone, p.hd);
  pitchedRoof(b, [0, 1.24, 0.94], 1.28, 0.48, 0.62, p.primary, slate, p.accent, p, detail);
  const door = hingedDoor(b, 'SchoolDoor', [0, 0.16, 1.16], 0.46, 0.88, p.accent, p.dark, p);
  bBox(door, [-0.23, 0.62, 0.028], [0.28, 0.28, 0.02], p.optic, false);
  bBox(b, [0, 2.34, 0.42], [0.66, 0.56, 0.66], p.accent, p.hd);
  bBox(b, [0, 2.64, 0.42], [0.76, 0.08, 0.76], p.accent, p.hd);
  bBox(b, [0, 2.74, 0.42], [0.58, 0.14, 0.58], p.accent, p.hd);
  quad((sx, sz) => bCyl(b, [sx * 0.24, 2.94, 0.42 + sz * 0.24], 0.04, 0.045, 0.56, p.accent, p.hd, 10));
  bBox(b, [0, 3.12, 0.42], [0.54, 0.07, 0.08], p.dark, p.hd);
  const bell = group(b, 'SchoolBell', [0, 3.09, 0.42]);
  bBox(bell, [0, 0.02, 0], [0.22, 0.06, 0.09], p.dark, false);
  bellSolid(bell, [0, 0, 0], 0.66, brass, p.dark, p.hd);
  bBox(b, [0, 3.22, 0.42], [0.76, 0.08, 0.76], p.accent, p.hd);
  bCone(b, [0, 3.58, 0.42], 0.48, 0.68, slate, p.hd, 4, true).rotation.y = Math.PI / 4;
  bCyl(b, [0, 3.96, 0.42], 0.018, 0.026, 0.18, brass, p.hd, 8);
  bOrb(b, [0, 4.04, 0.42], 0.042, brass, p.hd, 8);
  bBox(b, [0, 2.48, -0.78], [0.3, 0.62, 0.3], p.primary, p.hd);
  bBox(b, [0, 2.8, -0.78], [0.38, 0.07, 0.38], stone, p.hd);
  if (detail) {
    for (const s of [-1, 1]) {
      const vSide = group(b, '', [s * 0.55, 0, 0.92]);
      vSide.rotation.y = (s * Math.PI) / 2;
      framedWindow(vSide, [0, 0.72, 0], 0.2, 0.34, p.accent, stone, p, false);
    }
    bRing(b, [0, 1.48, 1.24], 0.11, 0.025, 0.04, p.accent, p.hd, 12).rotation.x = Math.PI / 2;
    bCyl(b, [0, 1.48, 1.225], 0.085, 0.085, 0.03, p.optic, p.hd, 12).rotation.x = Math.PI / 2;
  }
  if (detail && p.hd) {
    quad((sx, sz) => bStrut(b, [sx * 0.24, 3.04, 0.42 + sz * 0.24], [sx * 0.36, 3.2, 0.42 + sz * 0.36], 0.02, p.accent, p.hd, 8));
  }
  root.animations = [
    new T.AnimationClip('School bell and door', 3.4, [
      swingTrack('SchoolBell', 'x', 3.4, 30, true),
      swingTrack('SchoolDoor', 'y', 3.4, 78),
    ]),
    new T.AnimationClip('Ring school bell', 2.8, [swingTrack('SchoolBell', 'x', 2.8, 30, true)]),
  ];
}

function stoneParishChapel(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'ParishChapel');
  const baseStone = matte('#7b776e', 0.9, 0, 'Chapel base');
  const trim = matte('#d4cdbe', 0.88, 0, 'Chapel quoins');
  const oak = matte('#5e3d28', 0.86, 0, 'Chapel oak');
  const brass = matte('#ba9442', 0.4, 0.54, 'Steeple bell');
  bBox(b, [0, 0.07, 0], [2.42, 0.14, 2.94], baseStone, p.hd);
  bBox(b, [0.1, 0.82, -0.06], [1.66, 1.36, 2.12], p.primary, p.hd);
  pitchedRoof(b, [0.1, 1.48, -0.06], 1.94, 0.96, 2.24, p.primary, p.accent, trim, p, detail);
  for (const s of [-1, 1]) {
    for (const z of [-0.82, -0.06, 0.7]) {
      bBox(b, [0.1 + s * 0.9, 0.56, z], [0.24, 0.86, 0.22], trim, p.hd);
      bBox(b, [0.1 + s * 0.87, 1.18, z], [0.18, 0.46, 0.18], trim, p.hd);
    }
    const side = group(b, '', [0.1 + s * 0.84, 0, -0.06]);
    side.rotation.y = (s * Math.PI) / 2;
    for (const z of [-0.44, 0.32]) archedWindow(side, [z, 0.86, 0], 0.24, 0.62, trim, baseStone, p, detail);
  }
  bOctPrism(b, [0.1, 0.68, -1.16], 0.56, 1.12, p.primary, p.hd);
  bCone(b, [0.1, 1.46, -1.16], 0.62, 0.44, p.accent, p.hd, 8, true).rotation.y = Math.PI / 8;
  bBox(b, [0.1, 0.68, 1.06], [0.88, 1.08, 0.22], trim, p.hd);
  bGable(b, [0.1, 1.22, 1.06], 0.94, 0.34, 0.24, trim, p.hd);
  bArchPortal(b, [0.1, 0.14, 1.16], 0.72, 0.52, 0.64, 0.08, p.primary, p.hd);
  const door = hingedDoor(b, 'ChapelDoor', [0.1, 0.14, 1.205], 0.46, 0.88, oak, trim, p);
  for (const y of [0.24, 0.62]) bBox(door, [-0.23, y, 0.028], [0.36, 0.04, 0.02], p.dark, false);
  bRing(b, [0.1, 1.78, 1.045], 0.27, 0.055, 0.06, trim, p.hd, 16).rotation.x = Math.PI / 2;
  bCyl(b, [0.1, 1.78, 1.02], 0.23, 0.23, 0.05, p.optic, p.hd, 16).rotation.x = Math.PI / 2;
  bBox(b, [-0.74, 1.38, 0.56], [0.72, 2.52, 0.72], p.primary, p.hd);
  for (const y of [1.36, 2.08, 2.66]) bBox(b, [-0.74, y, 0.56], [0.82, 0.08, 0.82], trim, p.hd);
  quad((sx, sz) => bBox(b, [-0.74 + sx * 0.27, 2.94, 0.56 + sz * 0.27], [0.14, 0.52, 0.14], p.primary, p.hd));
  bBox(b, [-0.74, 3.14, 0.56], [0.58, 0.07, 0.09], p.dark, p.hd);
  const bell = group(b, 'SteepleBell', [-0.74, 3.11, 0.56]);
  bBox(bell, [0, 0.02, 0], [0.22, 0.06, 0.09], p.dark, false);
  bellSolid(bell, [0, 0, 0], 0.64, brass, p.dark, p.hd);
  bBox(b, [-0.74, 3.23, 0.56], [0.84, 0.09, 0.84], trim, p.hd);
  quad((sx, sz) => bCone(b, [-0.74 + sx * 0.34, 3.4, 0.56 + sz * 0.34], 0.08, 0.28, trim, p.hd, 4, true));
  bCone(b, [-0.74, 3.78, 0.56], 0.36, 1.04, p.accent, p.hd, 8, true).rotation.y = Math.PI / 8;
  bCyl(b, [-0.74, 4.35, 0.56], 0.016, 0.022, 0.18, p.alloy, p.hd, 8);
  bBox(b, [-0.74, 4.38, 0.56], [0.12, 0.024, 0.024], p.alloy, false);
  if (detail) {
    for (let i = 0; i < 4; i++) {
      bBox(b, [0.1, 1.78, 1.06], [0.024, 0.42, 0.02], trim, false).rotation.z = (i * Math.PI) / 4;
    }
    bRing(b, [0.1, 1.78, 1.06], 0.11, 0.022, 0.025, trim, p.hd, 12).rotation.x = Math.PI / 2;
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) archedWindow(b, [-0.74, 1.72, 0.56 + s * 0.37], 0.2, 0.38, trim, baseStone, p, false);
  }
  root.animations = [
    new T.AnimationClip('Sunday vespers', 3.6, [
      swingTrack('SteepleBell', 'x', 3.6, 28, true),
      swingTrack('ChapelDoor', 'y', 3.6, 78),
    ]),
    new T.AnimationClip('Ring steeple bell', 2.8, [swingTrack('SteepleBell', 'x', 2.8, 28, true)]),
  ];
}

function cornerPharmacyShop(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'PharmacyShop');
  const stone = matte('#9a968b', 0.9, 0, 'Sidewalk stone');
  const trim = matte('#e3dbc8', 0.86, 0, 'Apothecary limestone');
  const slate = matte('#3c444c', 0.84, 0.06, 'Mansard slate');
  bBox(b, [0, 0.06, 0], [2.56, 0.12, 2.28], stone, p.hd);
  chamferPrism(b, 0.11, 1.06, 1.02, 0.86, 0.56, p.primary, p.hd);
  chamferPrism(b, 1.15, 0.1, 1.08, 0.92, 0.58, trim, p.hd);
  chamferPrism(b, 1.24, 0.88, 1.0, 0.84, 0.54, p.primary, p.hd);
  chamferPrism(b, 2.1, 0.11, 1.1, 0.94, 0.6, p.accent, p.hd);
  chamferPrism(b, 2.2, 0.34, 0.92, 0.76, 0.48, slate, p.hd);
  bBox(b, [-0.68, 2.66, -0.48], [0.28, 0.44, 0.28], p.primary, p.hd);
  bBox(b, [-0.68, 2.9, -0.48], [0.34, 0.06, 0.34], trim, p.hd);
  const chamfer = group(b, '', [0.74, 0.12, 0.58]);
  chamfer.rotation.y = Math.PI / 4;
  const door = hingedDoor(chamfer, 'ShopDoor', [0, 0, 0.02], 0.46, 0.92, p.accent, p.dark, p);
  bBox(door, [-0.23, 0.62, 0.028], [0.28, 0.38, 0.02], p.optic, false);
  bBox(chamfer, [0, 1.04, 0.04], [0.58, 0.12, 0.08], p.accent, p.hd);
  bStrut(chamfer, [0, 1.38, -0.02], [0, 1.38, 0.42], 0.022, p.dark, p.hd, 8);
  bStrut(chamfer, [0, 1.16, -0.02], [0, 1.38, 0.26], 0.018, p.dark, p.hd, 8);
  const sign = group(chamfer, 'ApothecarySign', [0, 1.36, 0.34]);
  for (const dx of [-0.09, 0.09]) bStrut(sign, [dx, 0.02, 0], [dx, -0.14, 0], 0.012, p.alloy, p.hd, 6);
  bRing(sign, [0, -0.28, 0], 0.18, 0.028, 0.045, p.accent, p.hd, 14).rotation.x = Math.PI / 2;
  bLathe(
    sign,
    [0, -0.37, 0],
    [
      [0.08, 0],
      [0.065, 0.04],
      [0.12, 0.12],
      [0.13, 0.16],
      [0.002, 0.16],
    ],
    p.accent,
    p.hd,
    12,
  );
  bCyl(sign, [0.05, -0.19, 0], 0.024, 0.02, 0.18, p.stencil, p.hd, 8).rotation.z = -0.42;
  bBox(b, [-0.26, 0.6, 0.91], [1.14, 0.76, 0.14], p.accent, p.hd);
  bBox(b, [-0.26, 0.62, 0.955], [1.0, 0.6, 0.08], p.optic, p.hd);
  bBox(b, [-0.26, 0.2, 0.96], [1.22, 0.06, 0.18], trim, p.hd);
  const awning = group(b, '', [-0.26, 1.08, 0.89]);
  awning.rotation.x = 0.42;
  for (let i = 0; i < 6; i++) {
    bBox(awning, [-0.5 + i * 0.2, 0, 0.22], [0.2, 0.055, 0.48], i % 2 === 0 ? p.accent : p.stencil, p.hd);
  }
  bBox(b, [1.07, 0.6, -0.22], [0.14, 0.76, 0.92], p.accent, p.hd);
  bBox(b, [1.115, 0.62, -0.22], [0.08, 0.6, 0.78], p.optic, p.hd);
  for (const x of [-0.62, -0.02]) archedWindow(b, [x, 1.66, 0.85], 0.32, 0.48, trim, trim, p, detail);
  archedWindow(chamfer, [0, 1.54, 0.02], 0.3, 0.46, trim, trim, p, detail);
  const sideR = group(b, '', [1.01, 0, -0.22]);
  sideR.rotation.y = Math.PI / 2;
  for (const z of [-0.28, 0.28]) archedWindow(sideR, [z, 1.66, 0], 0.3, 0.46, trim, trim, p, detail);
  const back = group(b, '', [0, 0, -0.87]);
  back.rotation.y = Math.PI;
  for (const x of [-0.54, 0.54]) framedWindow(back, [x, 1.66, 0], 0.3, 0.44, trim, stone, p, detail);
  bBox(back, [0, 0.54, 0.02], [0.44, 0.82, 0.06], p.dark, p.hd);
  if (detail) {
    for (const x of [-0.54, -0.26, 0.02]) bBox(b, [x, 0.62, 1.005], [0.024, 0.58, 0.02], p.stencil, false);
    for (let i = -3; i <= 1; i++) bBox(b, [i * 0.28, 2.04, 0.9], [0.06, 0.09, 0.06], p.accent, p.hd);
  }
  if (detail && p.hd) {
    for (const x of [-0.46, -0.06]) bOrb(b, [x, 0.52, 0.99], 0.065, x < -0.2 ? p.accent : p.optic, p.hd, 10);
  }
  root.animations = [
    new T.AnimationClip('Apothecary breeze', 3.4, [
      swingTrack('ApothecarySign', 'z', 3.4, 22, true),
      swingTrack('ShopDoor', 'y', 3.4, 78),
    ]),
    new T.AnimationClip('Open shop door', 3, [swingTrack('ShopDoor', 'y', 3, 82)]),
  ];
}

function waterfrontFishCannery(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'FishCannery');
  const water = matte('#2a5869', 0.36, 0.18, 'Harbor water');
  const piling = matte('#45372b', 0.9, 0, 'Wharf piling');
  const deck = matte('#8c7051', 0.88, 0, 'Wharf planks');
  const brick = matte('#964638', 0.88, 0, 'Boiler brick');
  const slate = matte('#3f4850', 0.84, 0.08, 'Cannery roof');
  bBox(b, [0, 0.05, 0], [3.38, 0.1, 2.48], water, p.hd);
  for (const x of [-1.42, -0.48, 0.48, 1.42]) {
    for (const z of [-0.96, 0, 0.96]) bCyl(b, [x, 0.24, z], 0.072, 0.08, 0.4, piling, p.hd, 10);
  }
  for (const z of [-0.96, 0.96]) {
    bStrut(b, [-1.42, 0.12, z], [-0.48, 0.42, z], 0.032, piling, p.hd, 8);
    bStrut(b, [0.48, 0.12, z], [1.42, 0.42, z], 0.032, piling, p.hd, 8);
  }
  bBox(b, [0, 0.46, 0], [3.18, 0.1, 2.28], deck, p.hd);
  bBox(b, [-0.24, 1.06, -0.26], [2.34, 1.12, 1.48], p.primary, p.hd);
  for (let i = 0; i < 3; i++) {
    const bx = -1.02 + i * 0.78;
    sawtoothBay(b, [bx, 1.61, -0.26], 0.76, 0.56, 1.44, p.primary, p.hd);
    const slopeLen = Math.hypot(0.78, 0.56) + 0.08;
    const slopeAng = Math.atan2(0.56, 0.78);
    bBox(b, [bx, 1.91, -0.26], [slopeLen, 0.065, 1.56], slate, p.hd).rotation.z = slopeAng;
    bBox(b, [bx + 0.39, 1.88, -0.26], [0.05, 0.46, 1.38], p.optic, p.hd);
    bBox(b, [bx + 0.41, 2.16, -0.26], [0.09, 0.07, 1.58], p.accent, p.hd);
  }
  bBox(b, [1.22, 0.84, -0.68], [0.66, 0.68, 0.66], brick, p.hd);
  bCyl(b, [1.22, 2.12, -0.68], 0.16, 0.25, 1.96, brick, p.hd, 8, true).rotation.y = Math.PI / 8;
  for (const y of [1.56, 2.18, 2.78]) bRing(b, [1.22, y, -0.68], 0.23, 0.032, 0.05, p.dark, p.hd, 14);
  bCyl(b, [1.22, 3.12, -0.68], 0.22, 0.17, 0.12, p.dark, p.hd, 12);
  bBox(b, [-0.46, 0.94, 0.49], [0.7, 0.84, 0.06], p.inset, false);
  bBox(b, [-0.18, 1.42, 0.55], [1.46, 0.065, 0.08], p.dark, p.hd);
  const dockRest: Point = [-0.46, 0.51, 0.548];
  const dockDoor = group(b, 'DockDoor', dockRest);
  bBox(dockDoor, [0, 0.44, 0], [0.78, 0.88, 0.048], p.accent, p.hd);
  for (const s of [-1, 1]) {
    bStrut(dockDoor, [-s * 0.3, 0.08, 0.032], [s * 0.3, 0.8, 0.032], 0.022, p.dark, p.hd, 6);
  }
  framedWindow(b, [0.56, 1.06, 0.49], 0.42, 0.44, p.dark, deck, p, detail);
  const back = group(b, '', [-0.24, 0, -1.01]);
  back.rotation.y = Math.PI;
  for (const x of [-0.66, 0, 0.66]) framedWindow(back, [x, 1.06, 0], 0.36, 0.42, p.dark, deck, p, detail);
  bBox(b, [1.14, 0.64, 0.72], [0.32, 0.28, 0.32], p.dark, p.hd);
  const hoist = group(b, 'DockHoist', [1.14, 0.78, 0.72]);
  bCyl(hoist, [0, 0.58, 0], 0.055, 0.065, 1.18, p.accent, p.hd, 12);
  bStrut(hoist, [0, 0.36, 0], [-0.66, 0.92, 0.32], 0.04, p.accent, p.hd, 10);
  bStrut(hoist, [0, 1.1, 0], [-0.66, 0.92, 0.32], 0.022, p.alloy, p.hd, 8);
  bStrut(hoist, [-0.66, 0.92, 0.32], [-0.66, 0.36, 0.32], 0.016, p.alloy, p.hd, 8);
  bRing(hoist, [-0.66, 0.32, 0.32], 0.06, 0.018, 0.025, p.dark, p.hd, 12);
  if (detail) {
    for (const x of [-1.26, -0.18, 0.56]) bCyl(b, [x, 0.58, 1.02], 0.05, 0.06, 0.16, p.dark, p.hd, 10);
    bBox(b, [-1.18, 0.65, 0.74], [0.3, 0.28, 0.3], deck, p.hd);
    bBox(b, [-1.14, 0.88, 0.72], [0.22, 0.2, 0.22], p.accent, p.hd);
  }
  if (detail && p.hd) {
    for (const x of [-0.22, 0.22]) bRing(dockDoor, [x, 0.92, 0.02], 0.045, 0.016, 0.03, p.alloy, p.hd, 12).rotation.x = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Wharf unloading', 3.8, [
      swingTrack('DockHoist', 'y', 3.8, 62, true),
      slideTrack('DockDoor', 'x', dockRest, 3.8, 0.54),
    ]),
    new T.AnimationClip('Slide dock door', 3, [slideTrack('DockDoor', 'x', dockRest, 3, 0.54)]),
  ];
}

export const buildingsCivicC: readonly CivicBuildDef[] = [
  {
    id: 'mountain-ranger-cabin',
    riggedParts: [rot('CabinDoor', 'Cabin door', 'y', [0, 82], 'Swings the plank cabin entrance door open')],
    detachableParts: [det('Woodpile', 'Woodpile', 'Stacked cordwood rack tucked beneath the side eave')],
    build: mountainRangerCabin,
  },
  {
    id: 'brick-schoolhouse',
    riggedParts: [
      rot('SchoolBell', 'School bell', 'x', [-30, 30], 'Swings the brass belfry school bell'),
      rot('SchoolDoor', 'School door', 'y', [0, 82], 'Swings the vestibule schoolhouse entrance door open'),
    ],
    detachableParts: [],
    build: brickSchoolhouse,
  },
  {
    id: 'stone-parish-chapel',
    riggedParts: [
      rot('ChapelDoor', 'Chapel door', 'y', [0, 80], 'Swings the oak gothic portal chapel door open'),
      rot('SteepleBell', 'Steeple bell', 'x', [-28, 28], 'Swings the bronze bell inside the stone steeple'),
    ],
    detachableParts: [],
    build: stoneParishChapel,
  },
  {
    id: 'corner-pharmacy-shop',
    riggedParts: [
      rot('ApothecarySign', 'Apothecary sign', 'z', [-22, 22], 'Sways the hanging mortar-and-pestle street sign'),
      rot('ShopDoor', 'Shop door', 'y', [0, 82], 'Swings the chamfered-corner apothecary door open'),
    ],
    detachableParts: [],
    build: cornerPharmacyShop,
  },
  {
    id: 'waterfront-fish-cannery',
    riggedParts: [
      rot('DockHoist', 'Dock hoist', 'y', [-65, 65], 'Swings the wharf-edge loading jib hoist'),
      slide('DockDoor', 'Dock door', 'x', [0, 0.54], 'Slides the braced freight door along its overhead rail'),
    ],
    detachableParts: [],
    build: waterfrontFishCannery,
  },
];
