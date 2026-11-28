import * as T from 'three';
import {
  archedWindow,
  bArchPortal,
  bArchVault,
  bBox,
  bCone,
  bCyl,
  bGable,
  bLathe,
  bOctPrism,
  bOrb,
  bRing,
  bStrut,
  det,
  framedWindow,
  glow,
  group,
  hingedDoor,
  matte,
  mesh,
  pitchedRoof,
  quad,
  rot,
  slide,
  slideTrack,
  spinTrack,
  swingTrack,
} from './buildings-civic-kit';
import type { CivicBuildDef, Finish, Point } from './buildings-civic-kit';

function slipwayWedge(
  parent: T.Object3D, at: Point, w: number, hBack: number, hFront: number, len: number, mat: T.Material, hd: boolean,
): T.Mesh {
  const shape = new T.Shape();
  shape.moveTo(-len / 2, 0).lineTo(len / 2, 0).lineTo(len / 2, hFront).lineTo(-len / 2, hBack).closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: w, bevelEnabled: hd, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2,
  });
  geo.translate(0, 0, -w / 2);
  geo.rotateY(-Math.PI / 2);
  return mesh(parent, geo, mat, at);
}

function ruralSawmillShed(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'SawmillShed');
  const earth = matte('#7a6b55', 0.92, 0, 'Mill ground');
  const timber = matte('#a37b52', 0.86, 0, 'Mill deck');
  const bark = matte('#5e432e', 0.9, 0, 'Sawlog bark');
  bBox(b, [0, 0.07, 0], [3.18, 0.14, 2.24], earth, p.hd);
  bBox(b, [0, 0.17, 0], [2.94, 0.1, 1.98], timber, p.hd);
  for (const x of [-1.24, 0, 1.24]) {
    for (const sz of [-1, 1]) {
      bBox(b, [x, 0.89, sz * 0.84], [0.12, 1.38, 0.12], p.primary, p.hd);
      bStrut(b, [x, 1.28, sz * 0.84], [x, 1.54, sz * 0.56], 0.036, p.primary, p.hd, 8);
    }
    bBox(b, [x, 1.56, 0], [0.1, 0.11, 1.76], p.primary, p.hd);
    bBox(b, [x, 1.9, 0], [0.09, 0.62, 0.09], p.primary, p.hd);
    for (const sz of [-1, 1]) bStrut(b, [x, 1.58, sz * 0.84], [x, 2.2, 0], 0.044, p.primary, p.hd, 8);
  }
  for (const sz of [-1, 1]) bBox(b, [0, 1.56, sz * 0.84], [2.66, 0.12, 0.12], p.primary, p.hd);
  const roofGrp = group(b, '', [0, 0, 0]);
  roofGrp.rotation.y = Math.PI / 2;
  const slopeLen = Math.hypot(1.04, 0.66) + 0.12;
  const slopeAng = Math.atan2(0.66, 1.04);
  for (const s of [-1, 1]) {
    bBox(roofGrp, [s * 0.52, 1.92, 0], [slopeLen, 0.065, 2.86], p.accent, p.hd).rotation.z = -s * slopeAng;
  }
  bBox(b, [0, 2.28, 0], [2.9, 0.08, 0.12], p.dark, p.hd);
  bBox(b, [0, 2.38, 0], [0.96, 0.16, 0.34], p.accent, p.hd);
  bBox(b, [-1.08, 0.94, -0.66], [0.36, 0.56, 0.36], p.alloy, p.hd);
  bCone(b, [-1.08, 0.48, -0.66], 0.19, 0.42, p.alloy, p.hd, 12).rotation.x = Math.PI;
  bStrut(b, [-1.08, 0.22, -0.66], [-1.08, 0.66, -0.66], 0.055, p.dark, p.hd, 8);
  bStrut(b, [-0.94, 0.98, -0.58], [0.06, 0.62, -0.24], 0.045, p.alloy, p.hd, 10);
  for (const z of [0.18, 0.54]) bBox(b, [0, 0.245, z], [2.66, 0.055, 0.05], p.alloy, p.hd);
  const carrRest: Point = [-0.36, 0.28, 0.36];
  const carr = group(b, 'LogCarriage', carrRest);
  bBox(carr, [0, 0.09, 0], [1.14, 0.12, 0.44], p.dark, p.hd);
  quad((sx, sz) => {
    bCyl(carr, [sx * 0.42, 0.02, sz * 0.18], 0.06, 0.06, 0.05, p.alloy, p.hd, 12).rotation.x = Math.PI / 2;
  });
  for (const sx of [-0.36, 0.36]) bBox(carr, [sx, 0.24, -0.14], [0.08, 0.26, 0.08], p.accent, p.hd);
  bCyl(carr, [0, 0.3, 0.02], 0.155, 0.165, 1.26, bark, p.hd, 12).rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) {
    bCyl(carr, [sx * 0.64, 0.3, 0.02], 0.135, 0.135, 0.025, p.stencil, p.hd, 12).rotation.z = Math.PI / 2;
  }
  bBox(b, [0.14, 0.49, -0.16], [0.64, 0.54, 0.42], p.dark, p.hd);
  bCyl(b, [0.14, 0.64, 0.04], 0.065, 0.065, 0.2, p.alloy, p.hd, 12).rotation.x = Math.PI / 2;
  const blade = group(b, 'SawBlade', [0.14, 0.64, 0.12]);
  bCyl(blade, [0, 0, 0], 0.31, 0.31, 0.026, p.alloy, p.hd, 18).rotation.x = Math.PI / 2;
  bRing(blade, [0, 0, 0], 0.11, 0.03, 0.04, p.accent, p.hd, 14).rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    bBox(blade, [Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0], [0.06, 0.036, 0.022], p.alloy, false).rotation.z = a + 0.35;
  }
  for (let row = 0; row < 3; row++) {
    bBox(b, [0.88, 0.25 + row * 0.065, -0.52], [0.76, 0.065, 0.34], row % 2 === 0 ? p.primary : p.stencil, p.hd);
  }
  if (detail) {
    for (let x = -1.2; x <= 1.2; x += 0.3) bBox(b, [x, 0.225, 0.36], [0.07, 0.025, 0.52], p.dark, false);
    for (let i = -3; i <= 3; i++) {
      for (const s of [-1, 1]) {
        bBox(roofGrp, [s * 0.52, 1.96, i * 0.38], [slopeLen, 0.025, 0.03], p.dark, false).rotation.z = -s * slopeAng;
      }
    }
  }
  if (detail && p.hd) {
    bRing(b, [-0.18, 0.49, -0.16], 0.14, 0.028, 0.05, p.accent, p.hd, 14).rotation.z = Math.PI / 2;
  }
  root.animations = [
    new T.AnimationClip('Mill lumber', 3.6, [
      spinTrack('SawBlade', 'z', 3.6, 2),
      slideTrack('LogCarriage', 'x', carrRest, 3.6, 0.58),
    ]),
    new T.AnimationClip('Spin saw blade', 2.6, [spinTrack('SawBlade', 'z', 2.6, 2)]),
  ];
}

function urbanSubwayEntrance(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'SubwayEntrance');
  const pave = matte('#8c8d88', 0.9, 0, 'Sidewalk granite');
  const stone = matte('#c4beb0', 0.88, 0, 'Subway parapet stone');
  const tile = matte('#e8e2d3', 0.8, 0, 'Subway ceramic tile');
  const lampGlow = glow('#fff1c2', '#f2ba4e', 0.55, 'Subway globe');
  bBox(b, [0, 0.07, 0], [2.58, 0.14, 2.74], pave, p.hd);
  bBox(b, [0, 0.24, 0.92], [1.62, 0.22, 0.44], stone, p.hd);
  for (const s of [-1, 1]) {
    bBox(b, [s * 0.84, 0.46, -0.04], [0.24, 0.68, 2.16], stone, p.hd);
    bBox(b, [s * 0.84, 0.82, -0.04], [0.3, 0.07, 2.22], stone, p.hd);
    bBox(b, [s * 0.71, 0.46, -0.04], [0.04, 0.54, 1.92], tile, false);
    for (const z of [-0.94, 0, 0.88]) bCyl(b, [s * 0.84, 1.44, z], 0.048, 0.056, 1.24, p.primary, p.hd, 12);
    bBox(b, [s * 0.84, 1.18, -0.04], [0.06, 0.06, 1.88], p.primary, p.hd);
    bBox(b, [s * 0.84, 0.92, -0.04], [0.05, 0.05, 1.88], p.primary, p.hd);
  }
  bBox(b, [0, 0.46, -1.04], [1.92, 0.68, 0.24], stone, p.hd);
  bBox(b, [0, 0.82, -1.04], [1.98, 0.07, 0.3], stone, p.hd);
  bBox(b, [0, 0.44, -0.84], [1.4, 0.58, 0.18], p.inset, false);
  bBox(b, [0, 1.18, -1.04], [1.74, 0.06, 0.06], p.primary, p.hd);
  for (let i = 0; i < 6; i++) {
    bBox(b, [0, 0.32 - i * 0.036, 0.64 - i * 0.24], [1.4, 0.08, 0.26], tile, p.hd);
  }
  bArchVault(b, [0, 2.02, -0.04], 2.04, 0.08, 0.44, 2.18, p.optic, p.hd);
  for (const z of [-1.04, -0.36, 0.32, 0.96]) {
    bArchPortal(b, [0, 2.0, z], 2.16, 1.94, 0.08, 0.08, p.primary, p.hd);
  }
  bBox(b, [0, 2.04, 0.98], [1.76, 0.28, 0.09], p.primary, p.hd);
  bBox(b, [0, 2.04, 1.03], [1.34, 0.18, 0.05], p.accent, p.hd);
  bBox(b, [0, 2.04, 1.06], [1.14, 0.065, 0.025], p.stencil, false);
  const gate = group(b, 'ServiceGate', [0.7, 0.35, 0.9]);
  bBox(gate, [-0.68, 0.72, 0], [1.36, 0.06, 0.05], p.primary, p.hd);
  bBox(gate, [-0.68, 0.08, 0], [1.36, 0.06, 0.05], p.primary, p.hd);
  for (let i = 0; i < 6; i++) {
    bBox(gate, [-0.04 - i * 0.256, 0.4, 0], [0.045, 0.7, 0.045], p.primary, p.hd);
  }
  bBox(gate, [-0.68, 0.4, 0.025], [1.24, 0.065, 0.025], p.accent, false);
  const lamps = group(b, 'GlobeLamps', [0, 0.84, 1.0]);
  for (const s of [-1, 1]) {
    const post = group(lamps, '', [s * 0.84, 0, 0]);
    bCyl(post, [0, 0.06, 0], 0.075, 0.1, 0.12, p.primary, p.hd, 12);
    bCyl(post, [0, 0.38, 0], 0.036, 0.05, 0.54, p.primary, p.hd, 12);
    bCyl(post, [0, 0.67, 0], 0.08, 0.04, 0.08, p.accent, p.hd, 12);
    bOrb(post, [0, 0.82, 0], 0.13, lampGlow, p.hd, 12);
    bRing(post, [0, 0.82, 0], 0.145, 0.02, 0.03, p.accent, p.hd, 14);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      bBox(b, [s * 0.84, 1.05, -0.04], [0.032, 0.032, 1.86], p.primary, false);
      for (const z of [-0.68, -0.34, 0.34, 0.62]) bBox(b, [s * 0.84, 1.05, z], [0.03, 0.24, 0.03], p.primary, false);
      for (const z of [-0.51, 0.48]) bOrb(b, [s * 0.84, 1.05, z], 0.05, p.accent, p.hd, 8);
    }
    for (const x of [-0.52, 0, 0.52]) bBox(b, [x, 1.05, -1.04], [0.03, 0.24, 0.03], p.primary, false);
  }
  if (detail && p.hd) {
    for (const s of [-1, 1]) {
      bStrut(b, [s * 0.84, 1.72, 0.88], [s * 0.56, 2.02, 0.88], 0.024, p.primary, p.hd, 8);
      bStrut(b, [s * 0.84, 1.72, -0.94], [s * 0.56, 2.02, -0.94], 0.024, p.primary, p.hd, 8);
    }
  }
  root.animations = [new T.AnimationClip('Open service gate', 3.2, [swingTrack('ServiceGate', 'y', 3.2, 82)])];
}

function botanicalBandstand(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'Bandstand');
  const plaza = matte('#8c887d', 0.9, 0, 'Park plaza');
  const trim = matte('#e5dfd0', 0.86, 0, 'Carved trim');
  const timber = matte('#8c633f', 0.86, 0, 'Stage deck');
  const iron = matte('#2f3b38', 0.48, 0.34, 'Cast iron');
  bOctPrism(b, [0, 0.06, 0], 1.74, 0.12, plaza, p.hd);
  bOctPrism(b, [0, 0.37, 0], 1.18, 0.54, p.primary, p.hd);
  bOctPrism(b, [0, 0.16, 0], 1.24, 0.08, trim, p.hd);
  bOctPrism(b, [0, 0.64, 0], 1.24, 0.08, trim, p.hd);
  bOctPrism(b, [0, 0.685, 0], 1.1, 0.05, timber, p.hd);
  for (let i = 0; i < 3; i++) {
    bBox(b, [0, 0.18 + i * 0.16, 1.44 - i * 0.14], [0.84 - i * 0.06, 0.14, 0.24], trim, p.hd);
  }
  const verts: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    const vx = Math.sin(a) * 1.06;
    const vz = Math.cos(a) * 1.06;
    verts.push([vx, vz]);
    bCyl(b, [vx, 1.34, vz], 0.042, 0.052, 1.32, iron, p.hd, 12);
    bBox(b, [vx, 0.72, vz], [0.13, 0.09, 0.13], trim, p.hd);
    bBox(b, [vx, 1.96, vz], [0.14, 0.08, 0.14], iron, p.hd);
  }
  for (let i = 0; i < 8; i++) {
    if (i === 7) continue;
    const v0 = verts[i];
    const v1 = verts[(i + 1) % 8];
    if (!v0 || !v1) continue;
    bStrut(b, [v0[0], 1.08, v0[1]], [v1[0], 1.08, v1[1]], 0.025, iron, p.hd, 8);
    bStrut(b, [v0[0], 0.76, v0[1]], [v1[0], 0.76, v1[1]], 0.022, iron, p.hd, 8);
    bStrut(b, [v0[0], 0.76, v0[1]], [v1[0], 1.08, v1[1]], 0.016, iron, p.hd, 6);
    bStrut(b, [v1[0], 0.76, v1[1]], [v0[0], 1.08, v0[1]], 0.016, iron, p.hd, 6);
  }
  bOctPrism(b, [0, 2.04, 0], 1.18, 0.12, p.primary, p.hd);
  bOctPrism(b, [0, 2.1, 0], 1.22, 0.05, p.accent, p.hd);
  const bellProf: [number, number][] = [];
  const steps = p.hd ? 18 : 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = 1.34 * Math.pow(1 - t, 1.45) + 0.16 * Math.sin(t * Math.PI) * (1 - t) + 0.04;
    const y = t * 1.08;
    bellProf.push([r, y]);
  }
  bLathe(b, [0, 2.12, 0], bellProf, p.accent, p.hd, 8, true).rotation.y = Math.PI / 8;
  bOrb(b, [0, 3.24, 0], 0.085, p.alloy, p.hd, 10);
  bCyl(b, [0, 3.44, 0], 0.018, 0.032, 0.34, p.alloy, p.hd, 10);
  bOrb(b, [0, 3.62, 0], 0.045, p.accent, p.hd, 8);
  const stand = group(b, 'MusicStand', [0, 0.7, 0]);
  bCyl(stand, [0, 0.04, 0], 0.13, 0.16, 0.08, iron, p.hd, 12);
  bCyl(stand, [0, 0.38, 0], 0.024, 0.028, 0.64, p.alloy, p.hd, 10);
  const desk = group(stand, '', [0, 0.72, 0.02]);
  desk.rotation.x = -0.45;
  bBox(desk, [0, 0, 0], [0.38, 0.26, 0.03], p.accent, false);
  bBox(desk, [0, 0.02, 0.024], [0.3, 0.2, 0.018], p.stencil, false);
  const benches = group(b, 'ParkBenches', [0, 0.12, 0]);
  for (const s of [-1, 1]) {
    const bench = group(benches, '', [s * 0.98, 0, 1.02]);
    bench.rotation.y = -s * 0.56;
    for (const lx of [-0.26, 0.26]) {
      bBox(bench, [lx, 0.14, 0], [0.05, 0.28, 0.28], iron, p.hd);
      bBox(bench, [lx, 0.34, -0.12], [0.045, 0.3, 0.045], iron, p.hd).rotation.x = -0.18;
    }
    for (const sz of [-0.07, 0.05]) bBox(bench, [0, 0.28, sz], [0.64, 0.04, 0.09], timber, p.hd);
    for (const sy of [0.36, 0.46]) bBox(bench, [0, sy, -0.13], [0.64, 0.07, 0.04], timber, p.hd);
  }
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const v0 = verts[i];
      const v1 = verts[(i + 1) % 8];
      if (!v0 || !v1) continue;
      const mx = (v0[0] + v1[0]) * 0.5;
      const mz = (v0[1] + v1[1]) * 0.5;
      bStrut(b, [v0[0], 1.72, v0[1]], [mx, 1.98, mz], 0.02, iron, p.hd, 6);
      bStrut(b, [v1[0], 1.72, v1[1]], [mx, 1.98, mz], 0.02, iron, p.hd, 6);
    }
  }
  if (detail && p.hd) {
    for (const [vx, vz] of verts) bOrb(b, [vx * 1.14, 2.15, vz * 1.14], 0.038, p.alloy, p.hd, 8);
  }
  root.animations = [new T.AnimationClip('Rotate music stand', 4.2, [spinTrack('MusicStand', 'y', 4.2, 1)])];
}

function harborCustomsHouse(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'CustomsHouse');
  const quay = matte('#7f7e77', 0.9, 0, 'Quay stone');
  const trim = matte('#e5dfd0', 0.86, 0, 'Customs trim');
  const lamp = glow('#fff1b8', '#f2bd48', 0.55, 'Harbor Fresnel');
  bBox(b, [0, 0.07, 0], [3.1, 0.14, 2.2], quay, p.hd);
  bBox(b, [0, 0.16, 0.92], [1.06, 0.12, 0.24], quay, p.hd);
  bBox(b, [0, 0.64, -0.04], [2.68, 1.04, 1.62], p.primary, p.hd);
  bBox(b, [0, 1.18, -0.04], [2.82, 0.1, 1.76], trim, p.hd);
  bBox(b, [0, 1.64, -0.04], [2.62, 0.84, 1.56], p.primary, p.hd);
  bBox(b, [0, 2.09, -0.04], [2.82, 0.11, 1.76], trim, p.hd);
  bBox(b, [0, 2.22, -0.04], [2.42, 0.2, 1.38], p.accent, p.hd);
  for (const s of [-1, 1]) {
    bBox(b, [0, 2.24, -0.04 + s * 0.82], [2.68, 0.2, 0.08], trim, p.hd);
    bBox(b, [s * 1.34, 2.24, -0.04], [0.08, 0.2, 1.72], trim, p.hd);
  }
  bArchPortal(b, [0, 0.16, 0.81], 0.72, 0.52, 0.62, 0.09, trim, p.hd);
  hingedDoor(b, 'CustomsDoor', [0, 0.18, 0.8], 0.46, 0.84, p.accent, p.dark, p);
  for (const x of [-0.96, -0.48, 0.48, 0.96]) {
    bArchPortal(b, [x, 0.24, 0.81], 0.4, 0.28, 0.48, 0.07, trim, p.hd);
    bBox(b, [x, 0.54, 0.79], [0.28, 0.5, 0.04], p.optic, false);
  }
  for (const x of [-0.96, -0.48, 0, 0.48, 0.96]) {
    framedWindow(b, [x, 1.64, 0.76], 0.26, 0.42, trim, quay, p, detail);
    if (detail) bGable(b, [x, 1.9, 0.78], 0.36, 0.12, 0.08, trim, p.hd);
  }
  for (const s of [-1, 1]) {
    const side = group(b, '', [s * 1.35, 0, -0.04]);
    side.rotation.y = (s * Math.PI) / 2;
    for (const z of [-0.46, 0, 0.46]) {
      archedWindow(side, [z, 0.64, 0], 0.28, 0.5, trim, quay, p, detail);
      framedWindow(side, [z, 1.64, 0], 0.26, 0.42, trim, quay, p, detail);
    }
  }
  const back = group(b, '', [0, 0, -0.86]);
  back.rotation.y = Math.PI;
  for (const x of [-0.88, -0.3, 0.3, 0.88]) {
    archedWindow(back, [x, 0.64, 0], 0.28, 0.5, trim, quay, p, detail);
    framedWindow(back, [x, 1.64, 0], 0.26, 0.42, trim, quay, p, detail);
  }
  bBox(b, [0, 2.48, -0.04], [0.92, 0.36, 0.92], p.primary, p.hd);
  bBox(b, [0, 2.68, -0.04], [1.04, 0.08, 1.04], trim, p.hd);
  bOctPrism(b, [0, 2.75, -0.04], 0.56, 0.08, trim, p.hd);
  bRing(b, [0, 2.94, -0.04], 0.54, 0.024, 0.035, p.alloy, p.hd, 16);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    bCyl(b, [Math.sin(a) * 0.4, 3.02, -0.04 + Math.cos(a) * 0.4], 0.028, 0.032, 0.54, p.dark, p.hd, 10);
  }
  const beacon = group(b, 'HarborBeacon', [0, 2.98, -0.04]);
  bCyl(beacon, [0, -0.04, 0], 0.12, 0.15, 0.28, p.alloy, p.hd, 12);
  for (const s of [-1, 1]) {
    bCyl(beacon, [0, 0.02, s * 0.16], 0.11, 0.12, 0.08, p.accent, p.hd, 12).rotation.x = Math.PI / 2;
    bCyl(beacon, [0, 0.02, s * 0.21], 0.085, 0.085, 0.04, lamp, p.hd, 12).rotation.x = Math.PI / 2;
  }
  bOctPrism(b, [0, 3.3, -0.04], 0.52, 0.08, trim, p.hd);
  const domeProf: [number, number][] = [];
  const dSteps = p.hd ? 14 : 5;
  for (let i = 0; i <= dSteps; i++) {
    const t = (i / dSteps) * (Math.PI / 2);
    domeProf.push([Math.max(0.01, Math.cos(t) * 0.46), Math.sin(t) * 0.4]);
  }
  bLathe(b, [0, 3.34, -0.04], domeProf, p.accent, p.hd, 8, true).rotation.y = Math.PI / 8;
  bCyl(b, [0, 3.84, -0.04], 0.018, 0.028, 0.26, p.alloy, p.hd, 8);
  bOrb(b, [0, 3.98, -0.04], 0.045, p.accent, p.hd, 8);
  if (detail && p.hd) {
    quad((sx, sz) => bOrb(b, [sx * 1.34, 2.4, -0.04 + sz * 0.82], 0.06, trim, p.hd, 8));
  }
  root.animations = [
    new T.AnimationClip('Harbor watch', 4, [
      spinTrack('HarborBeacon', 'y', 4, 1),
      swingTrack('CustomsDoor', 'y', 4, 78),
    ]),
    new T.AnimationClip('Open customs door', 3, [swingTrack('CustomsDoor', 'y', 3, 82)]),
  ];
}

function coastalRescueStation(root: T.Group, p: Finish, detail: boolean): void {
  const b = group(root, 'RescueStation');
  const seawall = matte('#7b7d79', 0.9, 0, 'Coastal granite');
  const timber = matte('#8c6b47', 0.88, 0, 'Slipway planks');
  const slate = matte('#3f4954', 0.84, 0.06, 'Shingle roof');
  const lens = glow('#fff6cf', '#f7cf62', 0.6, 'Searchlight lens');
  bBox(b, [0, 0.07, 0], [2.56, 0.14, 3.08], seawall, p.hd);
  bBox(b, [0, 0.24, -0.46], [2.36, 0.24, 1.88], seawall, p.hd);
  slipwayWedge(b, [0, 0.12, 0.96], 1.54, 0.24, 0.04, 1.02, timber, p.hd);
  for (const s of [-1, 1]) {
    bBox(b, [s * 0.96, 0.24, 0.96], [0.36, 0.24, 1.02], seawall, p.hd);
    bStrut(b, [s * 0.36, 0.38, 0.48], [s * 0.36, 0.18, 1.44], 0.028, p.alloy, p.hd, 8);
  }
  bBox(b, [0, 0.98, -0.46], [2.16, 1.28, 1.66], p.primary, p.hd);
  pitchedRoof(b, [0, 1.62, -0.46], 2.48, 0.98, 1.92, p.primary, slate, p.stencil, p, detail);
  bBox(b, [-1.1, 1.44, -0.78], [0.34, 1.84, 0.42], seawall, p.hd);
  bBox(b, [-1.1, 2.38, -0.78], [0.42, 0.08, 0.5], p.dark, p.hd);
  bBox(b, [0, 0.88, 0.39], [1.36, 1.06, 0.06], p.stencil, p.hd);
  bBox(b, [0, 0.88, 0.405], [1.22, 0.98, 0.04], p.inset, false);
  bBox(b, [0.3, 0.88, 0.435], [0.58, 0.96, 0.05], p.accent, p.hd);
  bStrut(b, [0.06, 0.44, 0.468], [0.54, 1.3, 0.468], 0.022, p.stencil, p.hd, 6);
  const doorL = group(b, 'BoatDoorL', [-0.59, 0.38, 0.435]);
  bBox(doorL, [0.29, 0.5, 0], [0.58, 0.96, 0.05], p.accent, p.hd);
  bStrut(doorL, [0.06, 0.06, 0.033], [0.54, 0.92, 0.033], 0.022, p.stencil, p.hd, 6);
  bRing(doorL, [0.29, 0.68, 0.032], 0.09, 0.022, 0.028, p.alloy, p.hd, 12).rotation.x = Math.PI / 2;
  bCyl(doorL, [0.29, 0.68, 0.03], 0.07, 0.07, 0.022, p.optic, p.hd, 12).rotation.x = Math.PI / 2;
  bStrut(b, [0.86, 0.94, 0.35], [0.86, 0.94, 0.42], 0.02, p.alloy, p.hd, 8);
  bRing(b, [0.86, 0.94, 0.4], 0.14, 0.04, 0.05, p.accent, p.hd, 14).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    const side = group(b, '', [s * 1.09, 0, -0.46]);
    side.rotation.y = (s * Math.PI) / 2;
    for (const z of [-0.36, 0.36]) framedWindow(side, [z, 1.02, 0], 0.3, 0.4, p.stencil, seawall, p, detail);
  }
  const back = group(b, '', [0, 0, -1.31]);
  back.rotation.y = Math.PI;
  bBox(back, [0, 0.78, 0.02], [0.46, 0.86, 0.06], p.accent, p.hd);
  framedWindow(back, [0.58, 1.02, 0], 0.3, 0.4, p.stencil, seawall, p, detail);
  bBox(b, [0, 2.52, -0.18], [0.92, 0.48, 0.92], p.primary, p.hd);
  bBox(b, [0, 2.77, -0.18], [1.24, 0.08, 1.24], p.stencil, p.hd);
  for (const s of [-1, 1]) {
    bBox(b, [0, 3.04, -0.18 + s * 0.58], [1.2, 0.045, 0.045], p.stencil, false);
    bBox(b, [s * 0.58, 3.04, -0.18], [0.045, 0.045, 1.2], p.stencil, false);
  }
  quad((sx, sz) => bBox(b, [sx * 0.58, 2.91, -0.18 + sz * 0.58], [0.048, 0.26, 0.048], p.stencil, p.hd));
  bBox(b, [0, 3.04, -0.18], [0.76, 0.48, 0.76], p.optic, p.hd);
  quad((sx, sz) => bBox(b, [sx * 0.39, 3.04, -0.18 + sz * 0.39], [0.065, 0.52, 0.065], p.stencil, p.hd));
  bBox(b, [0, 3.32, -0.18], [0.96, 0.08, 0.96], p.stencil, p.hd);
  bCone(b, [0, 3.55, -0.18], 0.66, 0.42, p.accent, p.hd, 4, true).rotation.y = Math.PI / 4;
  bCyl(b, [0, 3.76, -0.18], 0.07, 0.09, 0.12, p.dark, p.hd, 10);
  const light = group(b, 'SearchLight', [0, 3.84, -0.18]);
  bBox(light, [0, 0.04, 0], [0.16, 0.12, 0.08], p.alloy, p.hd);
  bCyl(light, [0, 0.12, 0.02], 0.11, 0.1, 0.24, p.dark, p.hd, 14).rotation.x = Math.PI / 2;
  bRing(light, [0, 0.12, 0.135], 0.12, 0.02, 0.04, p.accent, p.hd, 14).rotation.x = Math.PI / 2;
  bCyl(light, [0, 0.12, 0.15], 0.092, 0.092, 0.03, lens, p.hd, 14).rotation.x = Math.PI / 2;
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      bBox(b, [0, 0.35 - t * 0.18, 0.54 + t * 0.84], [1.46, 0.025, 0.06], timber, false);
    }
    for (const s of [-1, 1]) bCyl(b, [s * 0.96, 0.42, 1.32], 0.055, 0.065, 0.16, p.dark, p.hd, 10);
  }
  if (detail && p.hd) {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      bBox(b, [0.86 + Math.sin(a) * 0.12, 0.94 + Math.cos(a) * 0.12, 0.41], [0.05, 0.05, 0.055], p.stencil, false);
    }
  }
  root.animations = [
    new T.AnimationClip('Rescue launch', 4, [
      swingTrack('SearchLight', 'y', 4, 88, true),
      swingTrack('BoatDoorL', 'y', 4, -82),
    ]),
    new T.AnimationClip('Sweep searchlight', 3.4, [swingTrack('SearchLight', 'y', 3.4, 90, true)]),
  ];
}

export const buildingsCivicD: readonly CivicBuildDef[] = [
  {
    id: 'rural-sawmill-shed',
    riggedParts: [
      rot('SawBlade', 'Circular saw blade', 'z', [0, 360], 'Spins the toothed circular mill saw blade'),
      slide('LogCarriage', 'Log carriage', 'x', [0, 0.58], 'Slides the wheeled timber log carriage along the track'),
    ],
    detachableParts: [],
    build: ruralSawmillShed,
  },
  {
    id: 'urban-subway-entrance',
    riggedParts: [rot('ServiceGate', 'Service gate', 'y', [0, 82], 'Swings the cast-iron subway night gate open')],
    detachableParts: [det('GlobeLamps', 'Globe lamps', 'Twin Art Nouveau entrance lamp posts with glowing globes')],
    build: urbanSubwayEntrance,
  },
  {
    id: 'botanical-bandstand',
    riggedParts: [rot('MusicStand', 'Music stand', 'y', [0, 360], 'Rotates the central brass conductor music stand')],
    detachableParts: [det('ParkBenches', 'Park benches', 'Pair of wood-and-iron park benches on the plaza apron')],
    build: botanicalBandstand,
  },
  {
    id: 'harbor-customs-house',
    riggedParts: [
      rot('HarborBeacon', 'Harbor beacon', 'y', [0, 360], 'Rotates the dual-lens harbor signal beacon in the cupola'),
      rot('CustomsDoor', 'Customs door', 'y', [0, 82], 'Swings the central arcaded customs house door open'),
    ],
    detachableParts: [],
    build: harborCustomsHouse,
  },
  {
    id: 'coastal-rescue-station',
    riggedParts: [
      rot('BoatDoorL', 'Left boat door', 'y', [0, -84], 'Swings the left lifeboat bay door outward'),
      rot('SearchLight', 'Searchlight', 'y', [-95, 95], 'Sweeps the rooftop lookout rescue searchlight'),
    ],
    detachableParts: [],
    build: coastalRescueStation,
  },
];
