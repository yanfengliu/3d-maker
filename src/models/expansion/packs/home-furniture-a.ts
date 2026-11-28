import * as T from 'three';
import { fastener } from '../../hd-detail';
import { box, group, ring, rotationTrack, shell, spinTrack, strut, tube } from '../../parts';
import type { Finish } from '../../parts';
import { casterWheel, cyl, drawerBox, HPI, matte, orb, panelDoor, slideTrack, torus, turnedLeg } from './home-furniture-kit';

export function wingedArmchair(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'ChairBase');
  const wood = matte('#5e3d28', 0.85, 'Walnut leg');
  for (const sx of [-0.36, 0.36]) for (const sz of [-0.34, 0.34]) turnedLeg(base, sx, sz, 0.32, 0.044, wood, p.accent, p.hd);
  shell(base, [0, 0.38, 0], [0.88, 0.16, 0.84], p.primary, 0.18);
  shell(base, [0, 0.52, 0.04], [0.76, 0.16, 0.72], p.primary, 0.28);
  for (const s of [-1, 1]) {
    box(base, [s * 0.43, 0.62, 0.02], [0.14, 0.34, 0.78], p.primary);
    cyl(base, [s * 0.46, 0.81, 0.02], 0.095, 0.095, 0.78, p.primary, 'z', 12);
    if (detail) for (const z of [-0.24, -0.06, 0.12, 0.3]) orb(base, [s * 0.52, 0.64, z], 0.018, p.accent, p.hd);
  }
  const back = group(root, 'ChairBack', [0, 0.46, -0.34]);
  shell(back, [0, 0.54, 0], [0.88, 1.02, 0.18], p.primary, 0.2);
  for (const s of [-1, 1]) {
    shell(back, [s * 0.44, 0.68, 0.18], [0.11, 0.66, 0.32], p.primary, 0.22);
    box(back, [s * 0.37, 0.42, 0.11], [0.06, 0.42, 0.12], p.accent);
  }
  if (detail) {
    for (const bx of [-0.22, 0, 0.22]) for (const by of [0.38, 0.66]) orb(back, [bx, by, 0.1], 0.026, p.accent, p.hd);
    if (p.hd) for (const s of [-1, 1]) fastener(base, [s * 0.46, 0.81, 0.41], p, 0.026).rotation.x = HPI;
  }
  const pillow = group(root, 'ThrowPillow', [0, 0.68, -0.14]);
  shell(pillow, [0, 0, 0], [0.46, 0.28, 0.15], p.accent, 0.38);
  if (detail) orb(pillow, [0, 0, 0.08], 0.028, p.stencil, p.hd);
  root.animations = [new T.AnimationClip('Recline back', 3, [rotationTrack('ChairBack', 'x', [0, 0.9, 2.1, 3], [0, -0.26, -0.26, 0])])];
}

export function fourPosterBunkBed(root: T.Group, p: Finish, detail: boolean) {
  const frame = group(root, 'BunkFrame');
  const linen = matte('#e8e1d2', 0.88, 'Linen mattress');
  for (const sx of [-0.94, 0.94]) for (const sz of [-0.52, 0.52]) {
    tube(frame, [sx, 1.06, sz], 0.052, 0.058, 2.12, p.primary, 10);
    orb(frame, [sx, 2.18, sz], 0.072, p.accent, p.hd);
  }
  for (const by of [0.38, 1.38]) {
    shell(frame, [0, by, 0], [1.94, 0.14, 1.08], p.primary, 0.12);
    shell(frame, [0, by + 0.14, 0], [1.78, 0.18, 0.94], linen, 0.24);
    shell(frame, [-0.66, by + 0.26, 0], [0.36, 0.12, 0.66], p.accent, 0.36);
    shell(frame, [0.36, by + 0.24, 0], [0.98, 0.08, 0.92], p.accent, 0.22);
  }
  for (const sx of [-0.94, 0.94]) for (const y of [0.76, 1.76]) box(frame, [sx, y, 0], [0.06, 0.26, 0.96], p.primary);
  box(frame, [-0.14, 1.72, 0.52], [1.46, 0.12, 0.055], p.primary);
  for (const s of [-0.92, 0.92]) box(frame, [s, 2.04, 0], [0.055, 0.08, 1.08], p.primary);
  for (const sz of [-0.52, 0.52]) box(frame, [0, 2.04, sz], [1.92, 0.08, 0.055], p.primary);
  for (const x of [0.56, 0.84]) strut(frame, [x, 0.02, 0.59], [x, 1.66, 0.55], 0.026, p.dark, 10);
  for (let i = 0; i < 5; i++) strut(frame, [0.56, 0.26 + i * 0.31, 0.58], [0.84, 0.26 + i * 0.31, 0.58], 0.02, p.accent, 10);
  for (const sx of [-0.77, 0.77]) box(frame, [sx, 0.25, 0], [0.06, 0.16, 0.96], p.primary);
  const trundle = drawerBox(root, 'TrundleDrawer', [0, 0.16, 0.04], 1.54, 0.24, 0.92, p, detail);
  for (const sx of [-0.66, 0.66]) for (const sz of [-0.34, 0.34]) tube(trundle, [sx, -0.12, sz], 0.036, 0.036, 0.08, p.dark, 8);
  const canopy = group(root, 'CanopyValance', [0, 2.06, 0]);
  shell(canopy, [0, 0.05, 0], [1.96, 0.07, 1.12], p.accent, 0.2);
  for (const sz of [-0.55, 0.55]) box(canopy, [0, -0.08, sz], [1.88, 0.18, 0.03], p.accent);
  if (detail) {
    for (let i = 0; i < 6; i++) box(frame, [-0.72 + i * 0.24, 1.58, 0.52], [0.036, 0.26, 0.036], p.accent);
    if (p.hd) for (const sx of [-0.94, 0.94]) fastener(frame, [sx, 1.38, 0.55], p, 0.024).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Slide trundle', 3, [slideTrack('TrundleDrawer', [0, 0.16, 0.04], 2, [0, 0.9, 2.1, 3], [0, 0.38, 0.38, 0])])];
}

export function oakWardrobe(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'WardrobeCase');
  for (const sx of [-0.56, 0.56]) for (const sz of [-0.28, 0.28]) shell(body, [sx, 0.07, sz], [0.16, 0.14, 0.16], p.dark, 0.24);
  shell(body, [0, 0.32, 0], [1.34, 0.38, 0.7], p.primary, 0.12);
  box(body, [0, 1.26, -0.26], [1.3, 1.52, 0.16], p.primary);
  for (const sx of [-0.59, 0.59]) box(body, [sx, 1.26, 0.02], [0.12, 1.52, 0.66], p.primary);
  box(body, [0, 1.76, 0.02], [1.14, 0.055, 0.56], p.dark);
  cyl(body, [0, 1.66, 0.02], 0.022, 0.022, 1.12, p.alloy, 'x', 10);
  for (const x of [-0.32, 0, 0.32]) {
    strut(body, [x, 1.67, 0.02], [x, 1.56, 0.02], 0.012, p.alloy, 8);
    shell(body, [x, 1.32, 0.02], [0.18, 0.56, 0.26], p.accent, 0.26);
  }
  shell(body, [0, 2.06, 0], [1.44, 0.14, 0.78], p.dark, 0.2);
  shell(body, [0, 2.16, 0], [1.18, 0.1, 0.62], p.primary, 0.24);
  panelDoor(root, 'DoorLeft', [-0.53, 1.26, 0.34], 0.52, 1.46, 1, p, false, detail);
  panelDoor(root, 'DoorRight', [0.53, 1.26, 0.34], 0.52, 1.46, -1, p, false, detail);
  drawerBox(root, 'BottomDrawer', [0, 0.32, 0.12], 1.12, 0.26, 0.52, p, detail);
  if (detail) {
    for (const sx of [-0.62, 0.62]) box(body, [sx, 1.26, 0.36], [0.05, 1.42, 0.032], p.accent);
    if (p.hd) for (const sx of [-0.54, 0.54]) fastener(body, [sx, 2.06, 0.4], p, 0.026).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Open doors', 3.2, [
      rotationTrack('DoorLeft', 'y', [0, 0.9, 2.2, 3.2], [0, -1.35, -1.35, 0]),
      rotationTrack('DoorRight', 'y', [0, 0.9, 2.2, 3.2], [0, 1.35, 1.35, 0]),
    ]),
    new T.AnimationClip('Open drawer', 2.8, [slideTrack('BottomDrawer', [0, 0.32, 0.12], 2, [0, 0.8, 2, 2.8], [0, 0.34, 0.34, 0])]),
  ];
}

export function rolltopDesk(root: T.Group, p: Finish, detail: boolean) {
  const desk = group(root, 'DeskBody');
  for (const sx of [-0.62, 0.62]) {
    shell(desk, [sx, 0.06, 0], [0.46, 0.12, 0.78], p.dark, 0.16);
    shell(desk, [sx, 0.44, 0], [0.44, 0.66, 0.74], p.primary, 0.12);
    for (const y of [0.24, 0.44, 0.64]) {
      box(desk, [sx, y, 0.385], [0.36, 0.14, 0.03], p.dark);
      orb(desk, [sx, y, 0.415], 0.024, p.accent, p.hd);
    }
  }
  box(desk, [0, 0.44, -0.32], [0.84, 0.66, 0.08], p.primary);
  shell(desk, [0, 0.81, 0.02], [1.76, 0.09, 0.86], p.primary, 0.14);
  box(desk, [0, 0.865, 0.06], [0.84, 0.02, 0.5], p.accent);
  box(desk, [0, 1.14, -0.32], [1.66, 0.58, 0.14], p.primary);
  for (const sx of [-0.79, 0.79]) shell(desk, [sx, 1.14, -0.02], [0.1, 0.58, 0.68], p.primary, 0.22);
  shell(desk, [0, 1.44, -0.14], [1.74, 0.08, 0.46], p.dark, 0.16);
  for (let i = 0; i < 4; i++) box(desk, [-0.5 + i * 0.33, 1.06, -0.18], [0.032, 0.38, 0.2], p.dark);
  box(desk, [0, 1.16, -0.18], [1.46, 0.032, 0.2], p.dark);
  for (const sx of [-0.39, 0.39]) box(desk, [sx, 0.7, 0.02], [0.05, 0.14, 0.72], p.dark);
  drawerBox(root, 'CenterDrawer', [0, 0.7, 0.08], 0.74, 0.13, 0.6, p, detail);
  const hood = group(root, 'RolltopHood', [0, 0.94, -0.04]);
  for (let i = 0; i < 7; i++) {
    const a = -0.12 + i * 0.22;
    const slat = box(hood, [0, Math.sin(a) * 0.44, Math.cos(a) * 0.4], [1.5, 0.088, 0.036], i % 2 === 0 ? p.primary : p.accent);
    slat.rotation.x = -a;
  }
  box(hood, [0, -0.04, 0.42], [0.34, 0.044, 0.045], p.accent);
  if (detail) {
    for (const x of [-0.34, 0.34]) box(desk, [x, 0.94, -0.16], [0.22, 0.08, 0.16], p.stencil);
    if (p.hd) for (const sx of [-0.62, 0.62]) fastener(desk, [sx, 1.44, 0.1], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Roll hood', 3, [rotationTrack('RolltopHood', 'x', [0, 0.9, 2.1, 3], [0, -0.95, -0.95, 0])]),
    new T.AnimationClip('Open drawer', 2.6, [slideTrack('CenterDrawer', [0, 0.7, 0.08], 2, [0, 0.8, 1.9, 2.6], [0, 0.28, 0.28, 0])]),
  ];
}

export function slattedBookcase(root: T.Group, p: Finish, detail: boolean) {
  const shelf = group(root, 'BookcaseFrame');
  shell(shelf, [0, 0.08, 0], [1.66, 0.16, 0.62], p.dark, 0.16);
  box(shelf, [0, 1.18, -0.26], [1.58, 2.14, 0.07], p.primary);
  for (const sx of [-0.76, 0.76]) {
    for (const sz of [-0.24, 0.24]) box(shelf, [sx, 1.18, sz], [0.09, 2.14, 0.09], p.primary);
    for (let i = 0; i < 6; i++) box(shelf, [sx, 0.34 + i * 0.34, 0], [0.048, 0.055, 0.46], p.dark);
  }
  for (const y of [0.2, 0.68, 1.16, 1.64, 2.12]) box(shelf, [0, y, 0.01], [1.54, 0.06, 0.52], p.primary);
  shell(shelf, [0, 2.26, 0], [1.74, 0.12, 0.68], p.dark, 0.2);
  cyl(shelf, [0, 2.02, 0.34], 0.022, 0.022, 1.66, p.accent, 'x', 10);
  for (const sx of [-0.76, 0.76]) box(shelf, [sx, 2.02, 0.29], [0.06, 0.06, 0.12], p.accent);
  const ladder = group(root, 'LibraryLadder', [-0.36, 0, 0.42]);
  for (const sx of [-0.18, 0.18]) strut(ladder, [sx, 0.01, 0.16], [sx, 2.04, -0.08], 0.026, p.accent, 10);
  for (let i = 0; i < 6; i++) {
    const t = (i + 0.6) / 6.5;
    strut(ladder, [-0.18, t * 2.02, 0.16 - t * 0.24], [0.18, t * 2.02, 0.16 - t * 0.24], 0.02, p.dark, 10);
  }
  const books = group(root, 'BookStack', [0, 0.23, 0.04]);
  const bMats = [p.accent, p.optic, p.stencil, p.dark] as const;
  for (const [ry, count] of [[0, 6], [0.48, 5], [0.96, 6], [1.44, 4]] as const) {
    for (let i = 0; i < count; i++) {
      const h = 0.28 + ((i * 7) % 4) * 0.032;
      box(books, [-0.52 + i * 0.18, ry + h * 0.5, 0], [0.11, h, 0.28], bMats[(i + Math.round(ry * 2)) % 4] ?? p.accent);
    }
  }
  if (detail) {
    orb(shelf, [0.46, 1.82, 0.04], 0.12, p.optic, p.hd);
    tube(shelf, [0.46, 1.69, 0.04], 0.06, 0.09, 0.06, p.accent, 10);
    if (p.hd) for (const sx of [-0.76, 0.76]) fastener(shelf, [sx, 2.02, 0.36], p, 0.026).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Roll ladder', 3.4, [slideTrack('LibraryLadder', [-0.36, 0, 0.42], 0, [0, 1.1, 2.3, 3.4], [0, 0.74, 0.74, 0])])];
}

export function mirroredVanity(root: T.Group, p: Finish, detail: boolean) {
  const v = group(root, 'VanityTable');
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.28, 0.28]) {
    strut(v, [sx * 1.12, 0.01, sz * 1.2], [sx, 0.72, sz], 0.036, p.primary, 10);
    tube(v, [sx * 1.12, 0.04, sz * 1.2], 0.038, 0.032, 0.08, p.accent, 10);
  }
  shell(v, [0, 0.74, 0], [1.34, 0.2, 0.68], p.primary, 0.16);
  shell(v, [0, 0.86, 0], [1.4, 0.06, 0.74], p.dark, 0.18);
  for (const sx of [-0.42, 0.42]) {
    tube(v, [sx, 1.16, -0.2], 0.034, 0.044, 0.58, p.primary, 10);
    orb(v, [sx, 1.48, -0.2], 0.046, p.accent, p.hd);
  }
  const mir = group(root, 'VanityMirror', [0, 1.28, -0.2]);
  cyl(mir, [0, 0, 0], 0.022, 0.022, 0.86, p.accent, 'x', 10);
  cyl(mir, [0, 0.04, 0], 0.34, 0.34, 0.055, p.accent, 'z', 18).scale.set(1, 1.22, 1);
  cyl(mir, [0, 0.04, 0.018], 0.29, 0.29, 0.036, p.optic, 'z', 18).scale.set(1, 1.22, 1);
  drawerBox(root, 'JewelryDrawer', [0, 0.74, 0.1], 0.74, 0.14, 0.48, p, detail);
  tube(v, [-0.5, 0.96, 0.06], 0.048, 0.056, 0.16, p.optic, 10);
  orb(v, [-0.5, 1.08, 0.06], 0.036, p.accent, p.hd);
  shell(v, [0.48, 0.93, 0.06], [0.22, 0.1, 0.16], p.accent, 0.24);
  if (detail) {
    for (const sx of [-0.56, 0.56]) {
      box(v, [sx, 0.74, 0.35], [0.22, 0.13, 0.026], p.dark);
      orb(v, [sx, 0.74, 0.375], 0.022, p.accent, p.hd);
    }
    if (p.hd) for (const sx of [-0.42, 0.42]) fastener(v, [sx, 1.28, -0.17], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Tilt mirror', 2.8, [rotationTrack('VanityMirror', 'x', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.34, 0, -0.34, 0])]),
    new T.AnimationClip('Open drawer', 2.6, [slideTrack('JewelryDrawer', [0, 0.74, 0.1], 2, [0, 0.8, 1.9, 2.6], [0, 0.3, 0.3, 0])]),
  ];
}

export function diningTableSet(root: T.Group, p: Finish, detail: boolean) {
  const t = group(root, 'DiningTable');
  for (const sx of [-0.62, 0.62]) {
    box(t, [sx, 0.06, 0], [0.16, 0.12, 0.86], p.dark);
    box(t, [sx, 0.42, 0], [0.12, 0.66, 0.14], p.primary);
    for (const sz of [-0.34, 0.34]) strut(t, [sx, 0.1, sz], [sx, 0.74, sz * 0.4], 0.05, p.primary, 10);
    box(t, [sx, 0.72, 0], [0.14, 0.09, 0.76], p.primary);
  }
  box(t, [0, 0.26, 0], [1.32, 0.09, 0.1], p.dark);
  shell(t, [0, 0.8, 0], [1.68, 0.1, 0.98], p.primary, 0.14);
  const leaf = group(root, 'LeafExtension', [0.84, 0.8, 0]);
  shell(leaf, [0.16, 0, 0], [0.36, 0.092, 0.94], p.accent, 0.14);
  for (const sz of [-0.28, 0.28]) box(leaf, [-0.14, -0.055, sz], [0.46, 0.04, 0.05], p.dark);
  for (const [name, zDir] of [['DiningChairL', 1], ['DiningChairR', -1]] as const) {
    const ch = group(root, name, [0, 0, zDir * 0.56]);
    for (const sx of [-0.2, 0.2]) for (const sz of [-0.18, 0.18]) tube(ch, [sx, 0.23, sz], 0.026, 0.022, 0.46, p.dark, 10);
    shell(ch, [0, 0.47, 0], [0.48, 0.07, 0.46], p.accent, 0.2);
    for (const sx of [-0.2, 0.2]) strut(ch, [sx, 0.48, zDir * 0.19], [sx, 0.96, zDir * 0.24], 0.024, p.primary, 10);
    shell(ch, [0, 0.95, zDir * 0.24], [0.48, 0.12, 0.06], p.primary, 0.2);
    for (const sx of [-0.1, 0, 0.1]) strut(ch, [sx, 0.49, zDir * 0.18], [sx, 0.91, zDir * 0.23], 0.014, p.primary, 8);
  }
  if (detail) {
    tube(t, [0, 0.91, 0], 0.14, 0.09, 0.12, p.stencil, 12);
    for (const x of [-0.46, 0.46]) box(t, [x, 0.862, 0], [0.38, 0.018, 0.54], p.accent);
    if (p.hd) for (const sx of [-0.62, 0.62]) fastener(t, [sx, 0.26, 0.06], p, 0.026).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Extend leaf', 3, [slideTrack('LeafExtension', [0.84, 0.8, 0], 0, [0, 0.9, 2.1, 3], [0, 0.28, 0.28, 0])]),
    new T.AnimationClip('Turn chairs', 2.8, [
      rotationTrack('DiningChairL', 'y', [0, 0.8, 2, 2.8], [0, 0.42, 0.42, 0]),
      rotationTrack('DiningChairR', 'y', [0, 0.8, 2, 2.8], [0, -0.42, -0.42, 0]),
    ]),
  ];
}

export function rockingCradle(root: T.Group, p: Finish, detail: boolean) {
  const cradle = group(root, 'CradleBody', [0, 0.05, 0]);
  const quilt = matte('#efe8d6', 0.88, 'Quilt cotton');
  for (const sx of [-0.46, 0.46]) {
    box(cradle, [sx, 0, 0], [0.065, 0.09, 0.66], p.dark);
    for (const sz of [-1, 1]) strut(cradle, [sx, 0, sz * 0.3], [sx, 0.16, sz * 0.5], 0.036, p.dark, 10);
    for (const sz of [-0.26, 0.26]) strut(cradle, [sx, 0.04, sz], [sx, 0.42, sz], 0.034, p.primary, 10);
  }
  shell(cradle, [0, 0.42, 0], [1.22, 0.1, 0.72], p.primary, 0.16);
  shell(cradle, [0, 0.5, 0], [1.1, 0.12, 0.6], quilt, 0.28);
  shell(cradle, [-0.36, 0.57, 0], [0.28, 0.1, 0.42], p.accent, 0.38);
  for (const sx of [-0.58, 0.58]) shell(cradle, [sx, 0.66, 0], [0.08, 0.46, 0.68], p.primary, 0.22);
  for (const sz of [-0.33, 0.33]) {
    box(cradle, [0, 0.86, sz], [1.16, 0.06, 0.055], p.primary);
    for (let i = 0; i < 7; i++) tube(cradle, [-0.42 + i * 0.14, 0.65, sz], 0.016, 0.016, 0.4, p.primary, 10);
  }
  strut(cradle, [0, 0.86, -0.34], [0, 1.38, -0.34], 0.022, p.accent, 10);
  strut(cradle, [0, 1.38, -0.34], [0, 1.38, 0], 0.022, p.accent, 10);
  const mobile = group(cradle, 'CribMobile', [0, 1.36, 0]);
  ring(mobile, [0, -0.06, 0], 0.18, 0.022, 0.032, p.accent);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    strut(mobile, [0, 0, 0], [Math.sin(a) * 0.17, -0.06, Math.cos(a) * 0.17], 0.01, p.alloy, 8);
    strut(mobile, [Math.sin(a) * 0.17, -0.06, Math.cos(a) * 0.17], [Math.sin(a) * 0.17, -0.24, Math.cos(a) * 0.17], 0.008, p.stencil, 8);
    orb(mobile, [Math.sin(a) * 0.17, -0.26, Math.cos(a) * 0.17], 0.044, i % 2 === 0 ? p.accent : p.optic, p.hd);
  }
  if (detail) {
    for (const sx of [-0.58, 0.58]) orb(cradle, [sx, 0.92, 0], 0.045, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.46, 0.46]) fastener(cradle, [sx, 0.42, 0.37], p, 0.024).rotation.x = HPI;
  }
  root.animations = [
    new T.AnimationClip('Rock cradle', 3.2, [rotationTrack('CradleBody', 'x', [0, 0.8, 1.6, 2.4, 3.2], [0, 0.22, 0, -0.22, 0])]),
    new T.AnimationClip('Spin mobile', 3.6, [spinTrack('CribMobile', 'y', 3.6, 1)]),
  ];
}

export function brassBarCart(root: T.Group, p: Finish, detail: boolean) {
  const cart = group(root, 'BarCart');
  for (const sx of [-0.48, 0.48]) {
    for (const sz of [-0.28, 0.28]) strut(cart, [sx, 0.18, sz], [sx, 0.92, sz], 0.024, p.accent, 10);
    strut(cart, [sx, 0.92, -0.28], [sx, 1.04, -0.44], 0.024, p.accent, 10);
    ring(cart, [sx, 0.12, -0.28], 0.12, 0.026, 0.05, p.tire).rotation.z = HPI;
    strut(cart, [sx, 0.18, -0.28], [sx, 0.12, -0.28], 0.02, p.accent, 8);
  }
  strut(cart, [-0.48, 1.04, -0.44], [0.48, 1.04, -0.44], 0.026, p.dark, 10);
  casterWheel(cart, 'WheelFL', [-0.55, 0.2, 0.28], 0.2, 0.055, p, detail);
  casterWheel(cart, 'WheelFR', [0.55, 0.2, 0.28], 0.2, 0.055, p, detail);
  for (const y of [0.3, 0.86]) {
    shell(cart, [0, y, 0], [1.06, 0.06, 0.66], p.primary, 0.24);
    for (const sz of [-0.31, 0.31]) strut(cart, [-0.48, y + 0.08, sz], [0.48, y + 0.08, sz], 0.015, p.accent, 8);
    for (const sx of [-0.48, 0.48]) strut(cart, [sx, y + 0.08, -0.31], [sx, y + 0.08, 0.31], 0.015, p.accent, 8);
  }
  for (const x of [-0.26, 0, 0.26]) {
    tube(cart, [x, 0.47, -0.06], 0.048, 0.056, 0.28, p.optic, 10);
    tube(cart, [x, 0.65, -0.06], 0.02, 0.032, 0.09, p.dark, 10);
  }
  const tray = group(root, 'DecanterTray', [0, 0.9, 0.02]);
  shell(tray, [0, 0.02, 0], [0.68, 0.04, 0.44], p.dark, 0.24);
  tube(tray, [-0.14, 0.14, 0], 0.068, 0.082, 0.2, p.optic, 12);
  orb(tray, [-0.14, 0.28, 0], 0.04, p.accent, p.hd);
  for (const [gx, gz] of [[0.14, -0.08], [0.14, 0.1], [0.24, 0.02]] as const) {
    tube(tray, [gx, 0.1, gz], 0.045, 0.024, 0.12, p.stencil, 10);
  }
  if (detail) {
    for (const sx of [-0.48, 0.48]) for (const sz of [-0.28, 0.28]) orb(cart, [sx, 0.94, sz], 0.032, p.accent, p.hd);
    if (p.hd) for (const sx of [-0.48, 0.48]) fastener(cart, [sx, 0.86, 0.34], p, 0.022).rotation.x = HPI;
  }
  root.animations = [new T.AnimationClip('Roll cart', 3, [spinTrack('WheelFL', 'x', 3, 2), spinTrack('WheelFR', 'x', 3, 2)])];
}

export function turnedCoatTree(root: T.Group, p: Finish, detail: boolean) {
  const tree = group(root, 'CoatTree');
  tube(tree, [0, 0.14, 0], 0.1, 0.14, 0.28, p.primary, 12);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI + Math.PI / 4;
    const dx = Math.sin(a), dz = Math.cos(a);
    strut(tree, [dx * 0.08, 0.26, dz * 0.08], [dx * 0.34, 0.04, dz * 0.34], 0.042, p.primary, 10);
    orb(tree, [dx * 0.36, 0.042, dz * 0.36], 0.045, p.dark, p.hd);
  }
  tube(tree, [0, 1.06, 0], 0.048, 0.068, 1.64, p.primary, 12);
  ring(tree, [0, 0.68, 0], 0.24, 0.028, 0.045, p.accent);
  for (let i = 0; i < 4; i++) {
    const a = i * HPI;
    strut(tree, [0, 0.68, 0], [Math.sin(a) * 0.22, 0.68, Math.cos(a) * 0.22], 0.016, p.accent, 8);
  }
  tube(tree, [0, 0.08, 0], 0.24, 0.22, 0.06, p.dark, 14);
  const crown = group(root, 'HookCrown', [0, 1.84, 0]);
  tube(crown, [0, 0, 0], 0.068, 0.068, 0.18, p.accent, 12);
  orb(crown, [0, 0.16, 0], 0.072, p.primary, p.hd);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const dx = Math.sin(a), dz = Math.cos(a);
    strut(crown, [dx * 0.05, 0.02, dz * 0.05], [dx * 0.24, 0.14, dz * 0.24], 0.018, p.primary, 8);
    orb(crown, [dx * 0.25, 0.15, dz * 0.25], 0.028, p.accent, p.hd);
  }
  const umb = group(root, 'UmbrellaSet', [0.14, 0.1, 0.04]);
  strut(umb, [0, 0, 0], [0.04, 0.86, 0.02], 0.016, p.dark, 8);
  tube(umb, [0.02, 0.42, 0.01], 0.05, 0.024, 0.64, p.accent, 10);
  torus(umb, [0.04, 0.88, 0.02], 0.05, 0.016, p.primary, p.hd);
  if (detail) {
    for (const y of [0.42, 1.12, 1.56]) ring(tree, [0, y, 0], 0.072, 0.018, 0.04, p.accent);
    if (p.hd) orb(crown, [0, 0.26, 0], 0.036, p.accent, p.hd);
  }
  root.animations = [new T.AnimationClip('Spin hooks', 3.4, [spinTrack('HookCrown', 'y', 3.4, 1)])];
}
