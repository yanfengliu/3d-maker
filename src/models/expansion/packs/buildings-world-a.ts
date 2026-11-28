import * as T from 'three';
import { box, group, ring, spinTrack, strut } from '../../parts';
import type { Finish } from '../../parts';
import {
  cone,
  curvedEaveTier,
  cyl,
  det,
  hingedDoor,
  kbox,
  lathe,
  orb,
  pitchedRoof,
  plinth,
  quad,
  rot,
  swingTrack,
  tone,
  windowUnit,
  type WorldBuilderSpec,
} from './buildings-world-kit';

function kyotoPagoda(root: T.Group, p: Finish, detail: boolean) {
  const stone = tone(p, 'Kyoto granite', '#8e8d87', 0.88);
  const plaster = tone(p, 'Shikkui plaster', '#ebe4d3', 0.86);
  const bronze = tone(p, 'Temple bronze', '#8a7343', 0.44, 0.42);
  const b = group(root, 'KyotoPagoda');
  plinth(b, p, 2.24, 0.22, 2.24, stone, 0.1);
  kbox(b, p, [0, 0.14, 1.06], [0.84, 0.14, 0.34], stone);
  kbox(b, p, [0, 0.27, 0.88], [0.76, 0.12, 0.26], p.edge);
  const tiers = [
    { y: 0.2, w: 1.56, h: 0.82, ew: 2.18, eh: 0.36 },
    { y: 1.24, w: 1.24, h: 0.7, ew: 1.82, eh: 0.32 },
    { y: 2.16, w: 0.94, h: 0.62, ew: 1.48, eh: 0.32 },
  ] as const;
  for (const t of tiers) {
    kbox(b, p, [0, t.y + t.h * 0.5, 0], [t.w * 0.88, t.h, t.w * 0.88], plaster);
    quad((sx, sz) => {
      cyl(b, p, [sx * t.w * 0.44, t.y + t.h * 0.5, sz * t.w * 0.44], 0.055, 0.062, t.h + 0.04, p.primary, 8);
    });
    kbox(b, p, [0, t.y + 0.05, 0], [t.w + 0.14, 0.08, t.w + 0.14], p.primary);
    curvedEaveTier(b, p, t.y + t.h, t.ew, t.ew, t.eh, p.accent, p.primary, detail);
  }
  cyl(b, p, [0, 3.32, 0], 0.032, 0.072, 0.64, bronze, 10);
  for (let i = 0; i < 4; i++) ring(b, [0, 3.16 + i * 0.09, 0], 0.11 - i * 0.015, 0.02, 0.028, bronze);
  orb(b, p, [0, 3.66, 0], [0.065, 0.085, 0.065], bronze, 8);
  const bell = group(b, 'TempleBell', [0, 0.94, 0.88]);
  strut(bell, [0, 0.08, 0], [0, -0.1, 0], 0.022, p.primary, 8);
  cyl(bell, p, [0, -0.2, 0], 0.09, 0.13, 0.2, bronze, 10);
  ring(bell, [0, -0.29, 0], 0.135, 0.024, 0.04, p.accent);
  strut(bell, [0, -0.28, 0], [0, -0.52, 0], 0.02, p.stencil, 6);
  const lanterns = group(b, 'StoneLanterns');
  for (const s of [-1, 1]) {
    const l = group(lanterns, '', [s * 0.84, 0.18, 0.88]);
    kbox(l, p, [0, 0.06, 0], [0.26, 0.12, 0.26], stone);
    cyl(l, p, [0, 0.26, 0], 0.055, 0.068, 0.3, stone, 8);
    kbox(l, p, [0, 0.48, 0], [0.18, 0.18, 0.18], p.optic);
    cone(l, p, [0, 0.65, 0], 0.2, 0.16, stone, 6);
  }
  if (detail) {
    for (const s of [-1, 1]) {
      kbox(b, p, [s * 0.52, 0.62, 0.72], [0.22, 0.36, 0.05], p.primary);
      kbox(b, p, [s * 0.52, 0.62, 0.74], [0.14, 0.28, 0.04], plaster);
    }
    if (p.hd) {
      for (const y of [1.14, 2.06, 2.9]) {
        quad((sx, sz) => cyl(b, p, [sx * 0.56, y, sz * 0.56], 0.024, 0.024, 0.14, bronze, 8));
      }
    }
  }
  root.animations = [new T.AnimationClip('Ring pagoda bell', 3.4, [swingTrack('TempleBell', 'x', 3.4, 24, true)])];
}

function moroccanRiad(root: T.Group, p: Finish, detail: boolean) {
  const tile = tone(p, 'Zellige tile', '#e8dfd0', 0.78);
  const water = tone(p, 'Riad fountain', '#35a6b3', 0.24, 0.18, '#10545e');
  const cedar = tone(p, 'Atlas cedar', '#6e452b', 0.86);
  const palm = tone(p, 'Courtyard palm', '#467a44', 0.86);
  const b = group(root, 'MoroccanRiad');
  plinth(b, p, 2.52, 0.16, 2.42, tile, 0.06);
  // Four enclosing stucco courtyard walls around open center
  kbox(b, p, [0, 0.86, -0.96], [2.36, 1.44, 0.34], p.primary);
  for (const s of [-1, 1]) {
    kbox(b, p, [s * 1.02, 0.86, 0], [0.34, 1.44, 1.62], p.primary);
    kbox(b, p, [s * 0.74, 0.86, 0.96], [0.88, 1.44, 0.34], p.primary);
  }
  kbox(b, p, [0, 1.38, 0.96], [0.76, 0.4, 0.34], p.primary);
  // Scalloped horseshoe entry portal surround
  kbox(b, p, [0, 0.92, 1.14], [0.96, 1.56, 0.1], p.accent);
  kbox(b, p, [0, 0.72, 1.16], [0.64, 1.12, 0.07], p.primary);
  hingedDoor(b, p, 'ArchGate', [0, 0.16, 1.18], 0.56, 0.98, cedar, p.accent);
  // Central courtyard octagonal tiled fountain
  cyl(b, p, [0, 0.24, 0], 0.52, 0.56, 0.16, p.accent, 8);
  cyl(b, p, [0, 0.31, 0], 0.42, 0.42, 0.06, water, 10);
  lathe(b, p, [0, 0.28, 0], [[0.01, 0], [0.16, 0], [0.1, 0.22], [0.24, 0.34], [0.06, 0.46], [0.01, 0.52]], tile, 10);
  // Rooftop cedar pergola pavilion on rear-left terrace
  for (const sx of [-0.94, -0.18]) {
    for (const sz of [-1.02, -0.44]) {
      kbox(b, p, [sx, 1.88, sz], [0.09, 0.64, 0.09], cedar);
    }
  }
  kbox(b, p, [-0.56, 2.2, -0.73], [0.94, 0.08, 0.74], cedar);
  kbox(b, p, [0.72, 1.72, -0.82], [0.72, 0.32, 0.56], p.accent);
  // Detachable potted palms flanking entrance
  const palms = group(b, 'CourtyardPalms');
  for (const s of [-1, 1]) {
    const pot = group(palms, '', [s * 0.86, 0.14, 1.2]);
    cyl(pot, p, [0, 0.14, 0], 0.16, 0.11, 0.28, p.accent, 8);
    cyl(pot, p, [0, 0.4, 0], 0.045, 0.06, 0.32, cedar, 7);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      const f = orb(pot, p, [Math.sin(a) * 0.18, 0.58, Math.cos(a) * 0.18], [0.14, 0.05, 0.22], palm, 7);
      f.rotation.set(0.32, a, 0);
    }
  }
  if (detail) {
    for (let x = -1.0; x <= 1.01; x += 0.33) {
      kbox(b, p, [x, 1.66, 0.96], [0.18, 0.18, 0.16], p.primary);
      kbox(b, p, [x, 1.66, -0.96], [0.18, 0.18, 0.16], p.primary);
    }
    for (const z of [-0.6, 0, 0.6]) {
      for (const s of [-1, 1]) kbox(b, p, [s * 1.02, 1.66, z], [0.16, 0.18, 0.18], p.primary);
    }
    if (p.hd) {
      for (let i = -3; i <= 3; i++) kbox(b, p, [-0.56 + i * 0.12, 2.25, -0.73], [0.05, 0.045, 0.78], p.accent);
    }
  }
  root.animations = [new T.AnimationClip('Open riad gate', 3.2, [swingTrack('ArchGate', 'y', 3.2, 80)])];
}

function santoriniWindmill(root: T.Group, p: Finish, detail: boolean) {
  const thatch = tone(p, 'Cycladic thatch', '#c29e65', 0.9);
  const stone = tone(p, 'Island stone', '#c9c4b8', 0.88);
  const wood = tone(p, 'Weathered spar', '#7a5638', 0.86);
  const sail = tone(p, 'Woven sailcloth', '#f5f0e2', 0.84);
  const b = group(root, 'SantoriniWindmill');
  plinth(b, p, 2.08, 0.2, 2.04, stone, 0.22);
  // Whitewashed cylindrical drum slightly tapered upward
  cyl(b, p, [0, 1.12, -0.06], 0.68, 0.8, 1.92, p.primary, 14);
  cyl(b, p, [0, 2.12, -0.06], 0.73, 0.71, 0.14, p.accent, 14);
  // Conical thatched cap
  cone(b, p, [0, 2.66, -0.06], 0.84, 0.98, thatch, 14);
  cyl(b, p, [0, 3.16, -0.06], 0.04, 0.07, 0.14, wood, 8);
  // Cobalt-trimmed exterior stair landing & entry porch
  kbox(b, p, [0, 0.34, 0.74], [0.84, 0.32, 0.5], p.primary);
  kbox(b, p, [0, 0.2, 0.96], [0.76, 0.14, 0.26], p.accent);
  kbox(b, p, [0, 0.51, 0.74], [0.88, 0.06, 0.54], p.accent);
  hingedDoor(b, p, 'RoundDoor', [0, 0.54, 0.68], 0.42, 0.78, p.accent, p.primary);
  // Protruding rotor axle & 8-spar Cycladic triangular sail wheel
  cyl(b, p, [0, 2.24, 0.66], 0.08, 0.1, 0.48, wood, 10, [Math.PI / 2, 0, 0]);
  const wheel = group(b, 'SailWheel', [0, 2.24, 0.9]);
  cyl(wheel, p, [0, 0, 0.03], 0.11, 0.12, 0.14, wood, 10, [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const arm = group(wheel, '', [0, 0, 0]);
    arm.rotation.z = a;
    kbox(arm, p, [0, 0.56, 0], [0.045, 1.12, 0.045], wood);
    const cloth = kbox(arm, p, [0.13, 0.68, -0.018], [0.22, 0.76, 0.028], sail);
    cloth.rotation.y = 0.22;
    if (detail) {
      strut(arm, [0, 0.98, 0], [0.72, 0.72, 0], 0.015, p.stencil, 6);
    }
  }
  windowUnit(b, p, [-0.62, 1.38, 0.34], 0.22, 0.28, p.accent, p.optic, p.primary, detail);
  if (detail) {
    ring(b, [0, 2.22, -0.06], 0.78, 0.04, 0.05, wood);
    for (const s of [-1, 1]) {
      kbox(b, p, [s * 0.42, 0.72, 0.82], [0.06, 0.36, 0.38], p.primary);
    }
    if (p.hd) {
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        strut(b, [Math.sin(a) * 0.8, 2.2, -0.06 + Math.cos(a) * 0.8], [0, 3.12, -0.06], 0.02, wood, 8);
      }
    }
  }
  root.animations = [
    new T.AnimationClip('Spin island sails', 4.4, [spinTrack('SailWheel', 'z', 4.4, 1)]),
    new T.AnimationClip('Open windmill door', 3.0, [swingTrack('RoundDoor', 'y', 3.0, 78)]),
  ];
}

function swissChalet(root: T.Group, p: Finish, detail: boolean) {
  const stone = tone(p, 'Alpine stone', '#8f8b84', 0.9);
  const darkWood = tone(p, 'Charred larch', '#523827', 0.86);
  const flower = tone(p, 'Alpine geranium', '#d64545', 0.8);
  const leaf = tone(p, 'Boxwood leaf', '#4a7a42', 0.86);
  const b = group(root, 'SwissChalet');
  plinth(b, p, 2.38, 0.16, 2.08, stone, 0.08);
  // Ground masonry story + cantilevered timber upper story
  kbox(b, p, [0, 0.56, -0.06], [2.04, 0.84, 1.56], stone);
  kbox(b, p, [0, 1.38, -0.02], [2.22, 0.84, 1.72], p.primary);
  // Wrap-around carved balcony floor & timber railings
  kbox(b, p, [0, 0.98, 0.12], [2.46, 0.09, 2.04], darkWood);
  for (const s of [-1, 1]) {
    kbox(b, p, [s * 1.18, 1.24, 0.12], [0.06, 0.42, 1.98], p.primary);
    kbox(b, p, [s * 1.18, 1.46, 0.12], [0.09, 0.06, 2.04], darkWood);
    strut(b, [s * 0.94, 0.68, 0.72], [s * 1.14, 0.96, 1.04], 0.04, darkWood, p.hd ? 10 : 6);
  }
  kbox(b, p, [0, 1.24, 1.1], [2.36, 0.42, 0.06], p.primary);
  kbox(b, p, [0, 1.46, 1.1], [2.44, 0.06, 0.09], darkWood);
  // Broad low-pitched alpine gable roof with snow-weight rocks
  pitchedRoof(b, p, 1.8, -0.02, 2.74, 0.62, 2.18, p.primary, p.accent, darkWood, detail);
  kbox(b, p, [0.58, 2.26, -0.34], [0.28, 0.54, 0.28], stone);
  hingedDoor(b, p, 'ChaletDoor', [0, 0.16, 0.74], 0.46, 0.78, darkWood, p.primary);
  for (const x of [-0.56, 0.56]) {
    windowUnit(b, p, [x, 0.58, 0.73], 0.3, 0.34, p.stencil, p.optic, stone, detail, p.accent);
    windowUnit(b, p, [x, 1.42, 0.85], 0.32, 0.36, p.stencil, p.optic, darkWood, detail, p.accent);
  }
  const boxes = group(b, 'FlowerBoxes');
  for (const x of [-0.62, 0.62]) {
    kbox(boxes, p, [x, 1.38, 1.18], [0.64, 0.14, 0.16], darkWood);
    for (let k = -2; k <= 2; k++) {
      orb(boxes, p, [x + k * 0.11, 1.48, 1.18], [0.065, 0.055, 0.065], leaf, 7);
      if (detail) orb(boxes, p, [x + k * 0.11, 1.53, 1.2], [0.04, 0.038, 0.04], flower, 6);
    }
  }
  if (detail) {
    for (const sx of [-0.88, -0.44, 0.44, 0.88]) {
      orb(b, p, [sx, 2.18 - Math.abs(sx) * 0.36, 0.45], [0.08, 0.055, 0.08], stone, 7);
      orb(b, p, [sx, 2.18 - Math.abs(sx) * 0.36, -0.45], [0.08, 0.055, 0.08], stone, 7);
    }
    if (p.hd) {
      for (let x = -0.96; x <= 0.97; x += 0.24) {
        kbox(b, p, [x, 1.24, 1.13], [0.045, 0.34, 0.045], darkWood);
      }
    }
  }
  root.animations = [new T.AnimationClip('Open chalet door', 3.2, [swingTrack('ChaletDoor', 'y', 3.2, 78)])];
}

function taosPueblo(root: T.Group, p: Finish, detail: boolean) {
  const sand = tone(p, 'Desert earth', '#c7a47c', 0.9);
  const cedar = tone(p, 'Cedar viga', '#6e4c32', 0.88);
  const adobeDark = tone(p, 'Shaded adobe', '#b58660', 0.88);
  const b = group(root, 'TaosPueblo');
  plinth(b, p, 2.66, 0.14, 2.22, sand, 0.14);
  // Three stepped rounded-corner adobe setbacks
  kbox(b, p, [0, 0.56, 0.04], [2.26, 0.88, 1.72], p.primary);
  kbox(b, p, [-0.14, 1.32, -0.14], [1.62, 0.72, 1.24], p.primary);
  kbox(b, p, [0.18, 1.94, -0.32], [0.96, 0.58, 0.82], p.primary);
  // Parapet roof rims
  kbox(b, p, [0, 1.02, 0.04], [2.3, 0.08, 1.76], adobeDark);
  kbox(b, p, [-0.14, 1.7, -0.14], [1.66, 0.08, 1.28], adobeDark);
  kbox(b, p, [0.18, 2.25, -0.32], [1.0, 0.08, 0.86], adobeDark);
  // Protruding cedar viga roof beam logs
  for (const x of [-0.88, -0.44, 0, 0.44, 0.88]) {
    cyl(b, p, [x, 0.94, 0.94], 0.042, 0.042, 0.24, cedar, 8, [Math.PI / 2, 0, 0]);
  }
  for (const x of [-0.68, -0.22, 0.24]) {
    cyl(b, p, [x, 1.62, 0.52], 0.038, 0.038, 0.22, cedar, 8, [Math.PI / 2, 0, 0]);
  }
  // Leaning double-pole wooden ladders climbing terraces
  const addLadder = (lx: number, y0: number, z0: number, y1: number, z1: number) => {
    for (const dx of [-0.12, 0.12]) {
      strut(b, [lx + dx, y0, z0], [lx + dx, y1, z1], 0.022, cedar, p.hd ? 10 : 6);
    }
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      strut(
        b,
        [lx - 0.12, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t],
        [lx + 0.12, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t],
        0.016,
        cedar,
        6,
      );
    }
  };
  addLadder(-0.74, 0.14, 1.06, 1.32, 0.88);
  addLadder(0.42, 1.04, 0.64, 2.02, 0.44);
  hingedDoor(b, p, 'PuebloDoor', [0.06, 0.14, 0.9], 0.44, 0.74, p.accent, cedar);
  windowUnit(b, p, [-0.54, 1.34, 0.48], 0.26, 0.26, p.accent, p.optic, cedar, detail);
  windowUnit(b, p, [0.18, 1.94, 0.09], 0.24, 0.24, p.accent, p.optic, cedar, detail);
  // Detachable beehive horno clay oven on front-right pad
  const oven = group(b, 'HornoOven', [0.96, 0.12, 0.78]);
  lathe(oven, p, [0, 0, 0], [[0.01, 0], [0.28, 0], [0.3, 0.14], [0.25, 0.36], [0.14, 0.5], [0.01, 0.54]], adobeDark, 10);
  kbox(oven, p, [0, 0.16, 0.26], [0.16, 0.2, 0.08], p.inset);
  if (detail) {
    for (const [x, y, z] of [[0.62, 0.72, 0.92], [-0.46, 0.72, 0.92], [0.02, 1.38, 0.5]] as const) {
      box(b, [x, y, z], [0.06, 0.28, 0.04], p.accent);
    }
    if (p.hd) {
      cyl(b, p, [-0.36, 2.38, -0.34], 0.08, 0.1, 0.28, adobeDark, 10);
      cyl(oven, p, [0, 0.54, 0], 0.055, 0.065, 0.06, p.inset, 8);
    }
  }
  root.animations = [new T.AnimationClip('Open pueblo door', 3.0, [swingTrack('PuebloDoor', 'y', 3.0, 78)])];
}

export const buildingsWorldA: readonly WorldBuilderSpec[] = [
  {
    id: 'kyoto-tiered-pagoda',
    riggedParts: [rot('TempleBell', 'Temple bell', 'x', [-24, 24], 'Swings the hanging bronze pagoda bell')],
    detachableParts: [det('StoneLanterns', 'Stone lanterns', 'Twin carved stone lanterns flanking the steps')],
    build: kyotoPagoda,
  },
  {
    id: 'moroccan-riad-courtyard',
    riggedParts: [rot('ArchGate', 'Archway gate', 'y', [0, 82], 'Swings the carved cedar horseshoe entry gate open')],
    detachableParts: [det('CourtyardPalms', 'Entry palms', 'Twin potted palm trees flanking the riad portal')],
    build: moroccanRiad,
  },
  {
    id: 'santorini-whitewashed-windmill',
    riggedParts: [
      rot('SailWheel', 'Sail wheel', 'z', [0, 360], 'Rotates the eight-spar Cycladic canvas sail wheel'),
      rot('RoundDoor', 'Windmill door', 'y', [0, 80], 'Swings the cobalt-painted windmill door open'),
    ],
    build: santoriniWindmill,
  },
  {
    id: 'swiss-alpine-chalet',
    riggedParts: [rot('ChaletDoor', 'Chalet door', 'y', [0, 80], 'Swings the carved timber chalet entrance door open')],
    detachableParts: [det('FlowerBoxes', 'Geranium boxes', 'Removable alpine flower boxes along the balcony rail')],
    build: swissChalet,
  },
  {
    id: 'taos-terraced-pueblo',
    riggedParts: [rot('PuebloDoor', 'Pueblo door', 'y', [0, 80], 'Opens the turquoise-painted ground-floor adobe door')],
    detachableParts: [det('HornoOven', 'Horno clay oven', 'Removable beehive adobe bread oven on the courtyard terrace')],
    build: taosPueblo,
  },
];
