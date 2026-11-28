import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { cyl, drawerBox, glassPane, HPI, matte, orb, panelDoor, slideTrack, torus, turnedLeg } from './home-furniture-kit';

export function vinylRecordConsole(root: T.Group, p: Finish, detail: boolean) {
  const c = group(root, 'RecordConsole');
  for (const sx of [-0.76, 0.76]) for (const sz of [-0.26, 0.26]) turnedLeg(c, sx, sz, 0.28, 0.038, p.dark, p.accent, p.hd);
  shell(c, [0, 0.62, 0], [1.76, 0.68, 0.66], p.primary, 0.14);
  for (const sx of [-0.62, 0.62]) {
    box(c, [sx, 0.62, 0.34], [0.42, 0.52, 0.03], p.accent);
    for (let i = 0; i < 5; i++) box(c, [sx, 0.42 + i * 0.1, 0.36], [0.36, 0.022, 0.018], p.dark);
  }
  box(c, [0, 0.58, 0.26], [0.68, 0.44, 0.18], p.inset);
  const lpColors = [p.accent, p.stencil, p.optic, p.primary] as const;
  for (let i = 0; i < 8; i++) box(c, [-0.26 + i * 0.074, 0.58, 0.28], [0.036, 0.36, 0.18], lpColors[i % 4] ?? p.accent);
  shell(c, [0, 0.99, 0], [1.8, 0.07, 0.7], p.dark, 0.14);
  const plat = group(root, 'VinylPlatter', [0, 1.04, 0.02]);
  tube(plat, [0, 0.015, 0], 0.24, 0.25, 0.032, p.tire, 16);
  tube(plat, [0, 0.036, 0], 0.08, 0.08, 0.014, p.accent, 12);
  box(plat, [0.14, 0.035, 0], [0.06, 0.012, 0.022], p.stencil);
  strut(c, [0.32, 1.04, -0.14], [0.14, 1.08, 0.08], 0.014, p.alloy, 8);
  const lid = group(root, 'TurntableLid', [0, 1.03, -0.32]);
  box(lid, [0, 0.08, 0.32], [0.76, 0.028, 0.58], p.dark);
  glassPane(lid, [0, 0.04, 0.32], [0.72, 0.1, 0.54]);
  if (detail) {
    for (const x of [-0.52, -0.42, 0.42, 0.52]) cyl(c, [x, 0.92, 0.345], 0.026, 0.026, 0.032, p.alloy, 'z', 10);
    if (p.hd) for (const sx of [-0.74, 0.74]) fastener(c, [sx, 0.98, 0.36], p, 0.022).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Spin vinyl', 3, [spinTrack('VinylPlatter', 'y', 3, 2)]),
    new T.AnimationClip('Lift lid', 2.8, [rotationTrack('TurntableLid', 'x', [0, 0.8, 2, 2.8], [0, -0.95, -0.95, 0])]),
  ];
}

export function hearthFireplace(root: T.Group, p: Finish, detail: boolean) {
  const fp = group(root, 'FireplaceBody');
  const wood = matte('#5e3b24', 0.86, 'Firewood');
  shell(fp, [0, 0.08, 0.06], [1.74, 0.16, 0.96], p.dark, 0.16);
  box(fp, [0, 0.72, -0.22], [1.52, 1.14, 0.3], p.primary);
  for (const sx of [-0.56, 0.56]) {
    shell(fp, [sx, 0.72, 0.06], [0.42, 1.14, 0.62], p.primary, 0.14);
    box(fp, [sx, 0.72, 0.385], [0.22, 0.96, 0.04], p.dark);
  }
  box(fp, [0, 1.16, 0.08], [0.76, 0.26, 0.58], p.primary);
  shell(fp, [0, 1.34, 0.1], [1.78, 0.14, 0.74], p.dark, 0.18);
  shell(fp, [0, 1.78, -0.14], [1.14, 0.78, 0.48], p.primary, 0.14);
  for (const z of [-0.04, 0.1]) cyl(fp, [0, 0.26, z], 0.065, 0.072, 0.54, wood, 'x', 10);
  for (const [fx, fy, r] of [[-0.14, 0.36, 0.12], [0, 0.42, 0.15], [0.15, 0.35, 0.11]] as const) orb(fp, [fx, fy, 0.04], r, p.accent, p.hd, [0.9, 1.3, 0.9]);
  for (const [name, px, dir] of [['ScreenDoorL', -0.35, 1], ['ScreenDoorR', 0.35, -1]] as const) {
    const dr = group(root, name, [px, 0.6, 0.38]);
    for (const y of [-0.36, 0.36]) box(dr, [dir * 0.17, y, 0], [0.34, 0.045, 0.036], p.dark);
    for (const dx of [dir * 0.02, dir * 0.32]) box(dr, [dx, 0, 0], [0.042, 0.76, 0.036], p.dark);
    glassPane(dr, [dir * 0.17, 0, 0], [0.26, 0.66, 0.016]);
    orb(dr, [dir * 0.29, 0, 0.035], 0.024, p.accent, p.hd);
  }
  const clock = group(root, 'MantelClock', [0, 1.42, 0.14]);
  shell(clock, [0, 0.14, 0], [0.42, 0.26, 0.16], p.dark, 0.28);
  cyl(clock, [0, 0.14, 0.085], 0.09, 0.09, 0.025, p.stencil, 'z', 14);
  ring(clock, [0, 0.14, 0.095], 0.095, 0.018, 0.026, p.accent).rotation.x = HPI;
  if (detail) {
    for (const sx of [-0.56, 0.56]) {
      tube(fp, [sx, 1.54, 0.16], 0.036, 0.056, 0.26, p.accent, 10);
      tube(fp, [sx, 1.72, 0.16], 0.028, 0.028, 0.12, p.stencil, 10);
    }
    if (p.hd) for (const sx of [-0.56, 0.56]) fastener(fp, [sx, 1.34, 0.48], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Open fire screen', 3, [
    rotationTrack('ScreenDoorL', 'y', [0, 0.9, 2.1, 3], [0, -1.3, -1.3, 0]),
    rotationTrack('ScreenDoorR', 'y', [0, 0.9, 2.1, 3], [0, 1.3, 1.3, 0]),
  ])];
}

export function curioVitrine(root: T.Group, p: Finish, detail: boolean) {
  const vit = group(root, 'VitrineCase');
  for (const sx of [-0.42, 0.42]) for (const sz of [-0.26, 0.26]) turnedLeg(vit, sx, sz, 0.2, 0.046, p.dark, p.accent, p.hd);
  shell(vit, [0, 0.34, 0], [1.02, 0.28, 0.68], p.primary, 0.16);
  box(vit, [0, 1.24, -0.28], [0.96, 1.54, 0.08], p.primary);
  for (const sx of [-0.45, 0.45]) {
    for (const sz of [-0.26, 0.26]) box(vit, [sx, 1.24, sz], [0.08, 1.54, 0.08], p.primary);
    glassPane(vit, [sx, 1.24, 0], [0.02, 1.44, 0.44]);
  }
  for (const y of [0.84, 1.24, 1.64]) box(vit, [0, y, 0], [0.86, 0.036, 0.5], p.alloy);
  shell(vit, [0, 2.06, 0], [1.1, 0.12, 0.74], p.dark, 0.2);
  cyl(vit, [0, 2.16, 0], 0.42, 0.42, 0.64, p.primary, 'z', 14).scale.set(1, 0.48, 1);
  orb(vit, [0, 2.38, 0], 0.062, p.accent, p.hd);
  panelDoor(root, 'VitrineDoor', [-0.41, 1.24, 0.3], 0.82, 1.48, 1, p, true, detail);
  const curio = group(root, 'CurioDisplay', [0, 0.48, 0]);
  tube(curio, [-0.2, 0.14, 0], 0.06, 0.09, 0.26, p.accent, 12);
  orb(curio, [0.18, 0.52, 0], 0.13, p.optic, p.hd);
  tube(curio, [0.18, 0.38, 0], 0.05, 0.08, 0.06, p.dark, 10);
  tube(curio, [-0.12, 0.9, 0], 0.11, 0.07, 0.22, p.stencil, 12);
  tube(curio, [0.22, 1.3, 0], 0.08, 0.09, 0.22, p.accent, 12);
  if (detail) {
    for (const sx of [-0.32, 0.32]) orb(vit, [sx, 2.22, 0], 0.042, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.44, 0.44]) fastener(vit, [sx, 2.06, 0.38], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Open vitrine', 3, [rotationTrack('VitrineDoor', 'y', [0, 0.9, 2.1, 3], [0, -1.3, -1.3, 0])])];
}

export function convertibleDaybed(root: T.Group, p: Finish, detail: boolean) {
  const bed = group(root, 'DaybedFrame');
  const ash = matte('#b68c60', 0.85, 'Ash wood');
  for (const sx of [-0.92, 0.92]) for (const sz of [-0.42, 0.42]) tube(bed, [sx, 0.22, sz], 0.044, 0.036, 0.44, ash, 10);
  shell(bed, [0, 0.38, 0], [1.96, 0.14, 0.94], ash, 0.14);
  for (const sx of [-0.94, 0.94]) {
    box(bed, [sx, 0.66, 0], [0.08, 0.44, 0.88], ash);
    box(bed, [sx, 0.89, 0], [0.11, 0.06, 0.94], p.dark);
  }
  shell(bed, [0, 0.54, 0.08], [1.78, 0.2, 0.72], p.primary, 0.28);
  for (const sx of [-0.74, 0.74]) cyl(bed, [sx, 0.71, 0.08], 0.1, 0.1, 0.64, p.accent, 'z', 12);
  const back = group(root, 'FutonBack', [0, 0.46, -0.34]);
  shell(back, [0, 0.32, 0], [1.78, 0.56, 0.18], p.primary, 0.26);
  box(back, [0, 0.32, -0.1], [1.72, 0.48, 0.05], ash);
  drawerBox(root, 'UnderDrawer', [0, 0.21, 0.06], 1.48, 0.24, 0.76, p, detail);
  if (detail) {
    for (let i = 0; i < 4; i++) orb(back, [-0.54 + i * 0.36, 0.34, 0.1], 0.026, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.94, 0.94]) fastener(bed, [sx, 0.38, 0.48], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Recline futon', 3.2, [rotationTrack('FutonBack', 'x', [0, 0.9, 2.2, 3.2], [0, -1.18, -1.18, 0])]),
    new T.AnimationClip('Open drawer', 2.8, [slideTrack('UnderDrawer', [0, 0.21, 0.06], 2, [0, 0.8, 2, 2.8], [0, 0.36, 0.36, 0])]),
  ];
}

export function trestleWorkbench(root: T.Group, p: Finish, detail: boolean) {
  const wb = group(root, 'WorkbenchBody');
  for (const sx of [-0.72, 0.72]) {
    box(wb, [sx, 0.06, 0], [0.16, 0.12, 0.84], p.dark);
    for (const sz of [-0.32, 0.32]) tube(wb, [sx, 0.46, sz], 0.055, 0.062, 0.72, p.primary, 10);
    box(wb, [sx, 0.82, 0], [0.16, 0.1, 0.82], p.primary);
  }
  box(wb, [0, 0.26, 0], [1.5, 0.07, 0.56], p.dark);
  shell(wb, [0, 0.94, 0], [1.86, 0.16, 0.9], p.primary, 0.12);
  box(wb, [0, 0.99, -0.34], [1.74, 0.08, 0.16], p.inset);
  const vise = group(root, 'FrontVise', [-0.52, 0.88, 0.48]);
  shell(vise, [0, 0, 0.04], [0.42, 0.18, 0.08], p.accent, 0.18);
  for (const sx of [-0.14, 0.14]) cyl(vise, [sx, 0, -0.14], 0.018, 0.018, 0.34, p.alloy, 'z', 10);
  cyl(vise, [0, 0, 0.1], 0.036, 0.036, 0.09, p.dark, 'z', 10);
  cyl(vise, [0, 0, 0.14], 0.016, 0.016, 0.36, p.alloy, 'x', 10);
  const rack = group(root, 'ToolRack', [0, 1.02, -0.4]);
  box(rack, [0, 0.22, 0], [1.24, 0.44, 0.06], p.dark);
  for (let i = 0; i < 5; i++) {
    tube(rack, [-0.44 + i * 0.22, 0.26, 0.05], 0.018, 0.022, 0.26, p.accent, 8);
    box(rack, [-0.44 + i * 0.22, 0.1, 0.05], [0.026, 0.12, 0.016], p.alloy);
  }
  if (detail) {
    for (let i = 0; i < 6; i++) box(wb, [-0.65 + i * 0.26, 1.028, 0.18], [0.04, 0.016, 0.04], p.dark);
    if (p.hd) for (const sx of [-0.72, 0.72]) fastener(wb, [sx, 0.82, 0.42], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Clamp vise', 2.8, [slideTrack('FrontVise', [-0.52, 0.88, 0.48], 2, [0, 0.8, 2, 2.8], [0, 0.22, 0.22, 0])])];
}

export function credenzaSideboard(root: T.Group, p: Finish, detail: boolean) {
  const c = group(root, 'CredenzaBody');
  for (const sx of [-0.82, 0.82]) for (const sz of [-0.26, 0.26]) {
    strut(c, [sx * 1.06, 0.01, sz * 1.12], [sx, 0.32, sz], 0.036, p.dark, 10);
    tube(c, [sx * 1.06, 0.04, sz * 1.12], 0.036, 0.03, 0.08, p.accent, 10);
  }
  box(c, [0, 0.34, 0], [1.86, 0.07, 0.62], p.primary);
  box(c, [0, 0.64, -0.26], [1.82, 0.56, 0.08], p.primary);
  for (const sx of [-0.88, 0.88]) box(c, [sx, 0.64, 0], [0.09, 0.56, 0.62], p.primary);
  box(c, [0, 0.64, -0.02], [1.7, 0.045, 0.5], p.dark);
  shell(c, [0, 0.94, 0], [1.92, 0.08, 0.68], p.primary, 0.16);
  for (const [name, x0, z0] of [['SlattedDoorL', -0.48, 0.25], ['SlattedDoorR', 0.48, 0.29]] as const) {
    const dr = group(root, name, [x0, 0.64, z0]);
    box(dr, [0, 0, 0], [0.76, 0.5, 0.036], p.primary);
    for (let i = 0; i < 7; i++) box(dr, [-0.3 + i * 0.1, 0, 0.022], [0.042, 0.44, 0.018], p.accent);
  }
  tube(c, [0.56, 1.14, 0], 0.07, 0.11, 0.32, p.stencil, 12);
  if (detail) {
    box(c, [-0.5, 1.05, 0], [0.34, 0.14, 0.22], p.optic);
    if (p.hd) for (const sx of [-0.86, 0.86]) fastener(c, [sx, 0.94, 0.35], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Slide doors', 3.2, [
    slideTrack('SlattedDoorL', [-0.48, 0.64, 0.25], 0, [0, 0.9, 2.2, 3.2], [0, 0.44, 0.44, 0]),
    slideTrack('SlattedDoorR', [0.48, 0.64, 0.29], 0, [0, 0.9, 2.2, 3.2], [0, -0.44, -0.44, 0]),
  ])];
}

export function treadleSewingCabinet(root: T.Group, p: Finish, detail: boolean) {
  const sew = group(root, 'SewingTable');
  for (const sx of [-0.52, 0.52]) {
    box(sew, [sx, 0.05, 0], [0.09, 0.1, 0.64], p.dark);
    for (const sz of [-0.24, 0.24]) strut(sew, [sx, 0.08, sz], [sx, 0.78, sz * 0.78], 0.034, p.dark, 10);
    ring(sew, [sx, 0.44, 0], 0.18, 0.028, 0.045, p.dark).rotation.z = HPI;
  }
  cyl(sew, [0, 0.24, 0], 0.022, 0.022, 1.04, p.edge, 'x', 10);
  const treadle = group(root, 'FootTreadle', [0, 0.22, 0]);
  shell(treadle, [0, 0, 0], [0.46, 0.045, 0.36], p.dark, 0.22);
  for (const x of [-0.14, 0, 0.14]) box(treadle, [x, 0.028, 0], [0.04, 0.022, 0.28], p.accent);
  shell(sew, [0, 0.82, 0], [1.18, 0.09, 0.66], p.primary, 0.14);
  const leaf = group(root, 'DropLeaf', [-0.59, 0.82, 0]);
  shell(leaf, [-0.22, 0, 0], [0.44, 0.075, 0.64], p.primary, 0.14);
  shell(sew, [0.04, 0.9, 0], [0.58, 0.08, 0.32], p.dark, 0.2);
  tube(sew, [0.24, 1.08, 0], 0.068, 0.078, 0.32, p.dark, 12);
  cyl(sew, [0.04, 1.22, 0], 0.056, 0.066, 0.46, p.dark, 'x', 12);
  tube(sew, [-0.18, 1.12, 0], 0.042, 0.038, 0.2, p.alloy, 10);
  strut(sew, [-0.18, 1.02, 0], [-0.18, 0.93, 0], 0.012, p.alloy, 8);
  const wheel = group(root, 'HandWheel', [0.35, 1.2, 0]);
  ring(wheel, [0, 0, 0], 0.11, 0.024, 0.045, p.accent).rotation.z = HPI;
  cyl(wheel, [0, 0, 0], 0.032, 0.032, 0.08, p.alloy, 'x', 10);
  strut(wheel, [0, -0.1, 0], [0, 0.1, 0], 0.014, p.accent, 8);
  if (detail) {
    tube(sew, [0.14, 1.32, 0], 0.028, 0.028, 0.09, p.accent, 10);
    if (p.hd) for (const sx of [-0.52, 0.52]) fastener(sew, [sx, 0.82, 0.34], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Sew cycle', 2.4, [
      rotationTrack('FootTreadle', 'x', [0, 0.6, 1.2, 1.8, 2.4], [0, 0.28, 0, -0.28, 0]),
      spinTrack('HandWheel', 'x', 2.4, 2),
    ]),
    new T.AnimationClip('Fold leaf', 2.8, [rotationTrack('DropLeaf', 'z', [0, 0.8, 2, 2.8], [0, 1.48, 1.48, 0])]),
  ];
}

export function cornerChinaHutch(root: T.Group, p: Finish, detail: boolean) {
  const h = group(root, 'CornerHutch');
  shell(h, [0, 0.09, 0], [1.14, 0.18, 0.88], p.dark, 0.36);
  shell(h, [0, 0.54, -0.06], [1.06, 0.74, 0.76], p.primary, 0.34);
  shell(h, [0, 0.94, 0], [1.16, 0.08, 0.88], p.dark, 0.36);
  box(h, [0, 1.54, -0.32], [0.84, 1.14, 0.14], p.primary);
  for (const s of [-1, 1]) {
    const wall = box(h, [s * 0.42, 1.54, -0.02], [0.12, 1.14, 0.64], p.primary);
    wall.rotation.y = s * 0.28;
  }
  for (const y of [1.26, 1.58, 1.9]) shell(h, [0, y, -0.04], [0.92, 0.045, 0.66], p.primary, 0.34);
  shell(h, [0, 2.16, 0], [1.18, 0.14, 0.9], p.dark, 0.38);
  panelDoor(root, 'LowerDoor', [-0.36, 0.54, 0.34], 0.72, 0.66, 1, p, false, detail);
  panelDoor(root, 'UpperDoor', [-0.36, 1.54, 0.32], 0.72, 1.06, 1, p, true, detail);
  const plates = group(root, 'ChinaPlates', [0, 1.28, -0.1]);
  for (const ry of [0.08, 0.4]) for (const x of [-0.22, 0, 0.22]) {
    cyl(plates, [x, ry, 0], 0.1, 0.1, 0.024, p.stencil, 'z', 14);
    cyl(plates, [x, ry, 0.016], 0.06, 0.06, 0.014, p.accent, 'z', 12);
  }
  if (detail) {
    for (const sx of [-0.38, 0.38]) orb(h, [sx, 2.26, 0.18], 0.04, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.38, 0.38]) fastener(h, [sx, 2.16, 0.44], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Open hutch', 3.2, [
    rotationTrack('UpperDoor', 'y', [0, 0.9, 2.2, 3.2], [0, -1.25, -1.25, 0]),
    rotationTrack('LowerDoor', 'y', [0, 1.1, 2.3, 3.2], [0, -1.15, -1.15, 0]),
  ])];
}

export function architectDraftingTable(root: T.Group, p: Finish, detail: boolean) {
  const dt = group(root, 'DraftingFrame');
  for (const sx of [-0.58, 0.58]) {
    box(dt, [sx, 0.05, 0], [0.1, 0.1, 0.88], p.dark);
    strut(dt, [sx, 0.08, -0.36], [sx, 0.92, -0.04], 0.044, p.primary, 10);
    strut(dt, [sx, 0.08, 0.36], [sx, 0.92, 0.04], 0.044, p.primary, 10);
    ring(dt, [sx, 0.82, 0], 0.16, 0.026, 0.045, p.accent).rotation.z = HPI;
  }
  cyl(dt, [0, 0.24, 0.12], 0.028, 0.028, 1.24, p.alloy, 'x', 10);
  cyl(dt, [0, 0.92, 0], 0.032, 0.032, 1.24, p.dark, 'x', 10);
  const board = group(root, 'DraftingBoard', [0, 0.96, 0]);
  shell(board, [0, 0.04, 0], [1.46, 0.075, 0.98], p.primary, 0.1);
  box(board, [0, 0.088, 0.46], [1.44, 0.036, 0.05], p.accent);
  box(board, [-0.08, 0.088, -0.02], [1.08, 0.016, 0.72], p.stencil);
  box(board, [-0.36, 0.104, 0.04], [0.06, 0.02, 0.76], p.dark);
  box(board, [-0.36, 0.104, 0.4], [0.34, 0.022, 0.05], p.dark);
  strut(board, [0.58, 0.08, -0.36], [0.48, 0.42, -0.32], 0.016, p.alloy, 8);
  strut(board, [0.48, 0.42, -0.32], [0.32, 0.5, -0.18], 0.016, p.alloy, 8);
  tube(board, [0.28, 0.46, -0.16], 0.035, 0.11, 0.12, p.accent, 12);
  const tray = group(root, 'PencilTray', [0.74, 0.91, 0.1]);
  box(tray, [-0.1, 0.03, 0], [0.24, 0.036, 0.14], p.alloy);
  shell(tray, [0.08, 0, 0], [0.22, 0.06, 0.56], p.dark, 0.16);
  for (const z of [-0.14, 0, 0.14]) cyl(tray, [0.08, 0.042, z], 0.012, 0.012, 0.18, p.accent, 'x', 8);
  if (detail) {
    for (const sx of [-0.58, 0.58]) cyl(dt, [sx * 1.1, 0.82, 0], 0.044, 0.044, 0.05, p.accent, 'x', 12);
    if (p.hd) for (const sx of [-0.58, 0.58]) fastener(dt, [sx, 0.1, 0.42], p, 0.026);
  }
  root.animations = [
    new T.AnimationClip('Tilt board', 3, [rotationTrack('DraftingBoard', 'x', [0, 0.9, 2.1, 3], [0, 0.58, 0.58, 0])]),
    new T.AnimationClip('Slide tray', 2.6, [slideTrack('PencilTray', [0.74, 0.91, 0.1], 0, [0, 0.8, 1.9, 2.6], [0, 0.2, 0.2, 0])]),
  ];
}

export function tuftedLeatherSofa(root: T.Group, p: Finish, detail: boolean) {
  const sofa = group(root, 'SofaBody');
  for (const sx of [-0.94, 0.94]) for (const sz of [-0.36, 0.36]) orb(sofa, [sx, 0.075, sz], 0.078, p.dark, p.hd, [1, 0.95, 1]);
  shell(sofa, [0, 0.26, 0], [2.1, 0.24, 0.92], p.primary, 0.16);
  for (const x of [-0.62, 0, 0.62]) shell(sofa, [x, 0.46, 0.08], [0.6, 0.18, 0.72], p.primary, 0.28);
  shell(sofa, [0, 0.72, -0.34], [2.04, 0.66, 0.24], p.primary, 0.22);
  cyl(sofa, [0, 1.02, -0.34], 0.12, 0.12, 1.96, p.primary, 'x', 14);
  for (const s of [-1, 1]) {
    shell(sofa, [s * 0.98, 0.6, 0], [0.22, 0.52, 0.88], p.primary, 0.22);
    cyl(sofa, [s * 1.02, 0.84, 0], 0.14, 0.14, 0.88, p.primary, 'z', 14);
  }
  const foot = group(root, 'Footrest', [0, 0.34, 0.48]);
  shell(foot, [0, -0.1, 0.04], [0.58, 0.22, 0.08], p.accent, 0.2);
  for (const sx of [-0.22, 0.22]) strut(foot, [sx, -0.04, -0.04], [sx, -0.04, 0.04], 0.02, p.alloy, 8);
  const cushions = group(root, 'AccentCushions', [0, 0.62, -0.1]);
  for (const s of [-1, 1]) {
    const c = shell(cushions, [s * 0.72, 0.04, 0.04], [0.34, 0.34, 0.14], p.accent, 0.36);
    c.rotation.y = -s * 0.35;
  }
  if (detail) {
    for (let i = 0; i < 6; i++) for (const y of [0.66, 0.86]) orb(sofa, [-0.75 + i * 0.3, y, -0.21], 0.024, p.accent, p.hd);
    for (const s of [-1, 1]) torus(sofa, [s * 1.02, 0.84, 0.45], 0.09, 0.018, p.accent, p.hd);
    if (p.hd) for (const x of [-0.62, 0, 0.62]) fastener(sofa, [x, 0.22, 0.47], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Extend footrest', 3, [rotationTrack('Footrest', 'x', [0, 0.9, 2.1, 3], [0, -1.3, -1.3, 0])])];
}
