import * as T from 'three';
import { box, group, ring, strut } from '../../parts';
import type { Finish, Point } from '../../parts';
import {
  cone,
  curvedEaveTier,
  cyl,
  det,
  gable,
  hingedDoor,
  kbox,
  lathe,
  orb,
  plinth,
  quad,
  rot,
  slide,
  slideTrack,
  swingTrack,
  tone,
  windowUnit,
  type WorldBuilderSpec,
} from './buildings-world-kit';

function vikingLonghouse(root: T.Group, p: Finish, detail: boolean) {
  const earth = tone(p, 'Nordic turf earth', '#5c5442', 0.9);
  const oak = tone(p, 'Weathered oak', '#5c3f29', 0.88);
  const iron = tone(p, 'Forged iron', '#3a3f44', 0.48, 0.44);
  const b = group(root, 'VikingLonghouse');
  plinth(b, p, 3.04, 0.16, 1.92, earth, 0.14);
  // Bowed boat-hull timber longhouse body (wider in center, tapering at ends)
  kbox(b, p, [0, 0.56, 0], [1.38, 0.86, 1.38], p.primary);
  for (const s of [-1, 1]) {
    kbox(b, p, [s * 0.88, 0.54, 0], [0.72, 0.82, 1.18], p.primary);
    kbox(b, p, [s * 1.24, 0.52, 0], [0.42, 0.78, 0.96], p.primary);
  }
  // Thick sloped mossy turf sod roof hugging bowed hall
  for (const sz of [-1, 1]) {
    const mid = kbox(b, p, [0, 1.24, sz * 0.42], [2.88, 0.14, 0.96], p.accent);
    mid.rotation.x = sz * 0.56;
  }
  kbox(b, p, [0, 1.54, 0], [2.94, 0.14, 0.22], oak);
  for (const sx of [-1, 1]) {
    const g = gable(b, p, [sx * 1.38, 0.9, 0], 1.16, 0.62, 0.14, p.primary);
    g.rotation.y = Math.PI / 2;
    // Crossed carved Norse dragon-prow ridge finials
    for (const sz of [-1, 1]) {
      strut(b, [sx * 1.4, 1.48, 0], [sx * 1.56, 1.92, sz * 0.26], 0.035, oak, p.hd ? 10 : 6);
    }
  }
  // Timber-pillared front porch & heavy hinged oak door
  kbox(b, p, [0, 0.54, 0.8], [0.84, 0.82, 0.34], oak);
  hingedDoor(b, p, 'HallDoor', [0, 0.16, 0.95], 0.48, 0.72, oak, p.primary);
  // Detachable painted wooden Viking round shields hung along eaves wall
  const shields = group(b, 'ShieldRow');
  for (const x of [-0.94, -0.58, 0.58, 0.94]) {
    cyl(shields, p, [x, 0.68, 0.72], 0.15, 0.15, 0.04, p.accent, 10, [Math.PI / 2, 0, 0]);
    cyl(shields, p, [x, 0.68, 0.75], 0.045, 0.05, 0.04, iron, 8, [Math.PI / 2, 0, 0]);
  }
  if (detail) {
    for (const x of [-1.05, -0.52, 0.52, 1.05]) {
      for (const sz of [-1, 1]) strut(b, [x, 0.16, sz * 0.86], [x, 0.92, sz * 0.68], 0.036, oak, 8);
    }
    kbox(b, p, [0, 1.66, 0], [0.36, 0.16, 0.26], oak);
    if (p.hd) {
      for (const x of [-0.7, 0, 0.7]) orb(b, p, [x, 1.38, 0.38], [0.16, 0.06, 0.12], p.accent, 7);
    }
  }
  root.animations = [new T.AnimationClip('Open hall door', 3.0, [swingTrack('HallDoor', 'y', 3.0, 78)])];
}

function tuscanVilla(root: T.Group, p: Finish, detail: boolean) {
  const stone = tone(p, 'Siena travertine', '#cfc4b0', 0.88);
  const shutter = tone(p, 'Olive shutter', '#4b6647', 0.84);
  const cypress = tone(p, 'Tuscan cypress', '#2e5435', 0.86);
  const terra = tone(p, 'Terracotta pot', '#b85c3a', 0.84);
  const b = group(root, 'TuscanVilla');
  plinth(b, p, 2.74, 0.16, 2.18, stone, 0.08);
  // Main 2-story ochre stucco wing + ground 3-arch stone loggia colonnade
  kbox(b, p, [-0.24, 0.96, -0.14], [1.96, 1.64, 1.48], p.primary);
  kbox(b, p, [-0.24, 0.96, 0.78], [1.86, 0.1, 0.44], stone);
  for (const x of [-1.06, -0.52, 0.02, 0.56]) {
    cyl(b, p, [x, 0.56, 0.86], 0.075, 0.085, 0.78, stone, 10);
  }
  const loggiaRoof = kbox(b, p, [-0.24, 1.08, 0.8], [1.94, 0.08, 0.52], p.accent);
  loggiaRoof.rotation.x = 0.22;
  // Shallow terracotta hipped roof over main house
  const hip = cyl(b, p, [-0.24, 2.02, -0.14], 0.24, 1.48, 0.54, p.accent, 4, [0, Math.PI / 4, 0]);
  hip.scale.set(1.06, 1, 0.82);
  // Offset square belvedere dovecote tower on right
  kbox(b, p, [0.88, 1.38, -0.26], [0.84, 2.48, 0.84], p.primary);
  kbox(b, p, [0.88, 2.64, -0.26], [0.92, 0.08, 0.92], stone);
  cyl(b, p, [0.88, 2.86, -0.26], 0.08, 0.68, 0.38, p.accent, 4, [0, Math.PI / 4, 0]);
  for (const x of [-0.66, 0.18]) {
    windowUnit(b, p, [x, 1.42, 0.6], 0.32, 0.4, stone, p.optic, stone, detail, shutter);
  }
  // Hinged shuttered balcony door on tower upper story
  kbox(b, p, [0.88, 2.18, 0.15], [0.42, 0.54, 0.06], p.inset);
  const vShutter = group(b, 'VillaShutter', [1.08, 1.92, 0.2]);
  kbox(vShutter, p, [-0.2, 0.26, 0], [0.4, 0.52, 0.048], shutter);
  // Detachable terracotta cypress planters flanking front terrace
  const planters = group(b, 'CypressPlanters');
  for (const x of [-1.14, 1.06]) {
    const pt = group(planters, '', [x, 0.14, 0.88]);
    cyl(pt, p, [0, 0.15, 0], 0.18, 0.12, 0.3, terra, 10);
    cone(pt, p, [0, 0.72, 0], 0.18, 0.92, cypress, 9);
    cone(pt, p, [0, 1.14, 0], 0.12, 0.42, cypress, 9);
  }
  if (detail) {
    windowUnit(b, p, [0.88, 1.24, 0.16], 0.28, 0.38, stone, p.optic, stone, detail, shutter);
    for (const x of [-0.78, -0.24, 0.3]) {
      kbox(b, p, [x, 0.88, 0.86], [0.36, 0.08, 0.08], stone);
    }
    if (p.hd) {
      cyl(b, p, [0.88, 3.08, -0.26], 0.04, 0.06, 0.12, terra, 8);
      for (const x of [-0.78, -0.24, 0.3]) orb(b, p, [x, 0.94, 0.86], [0.05, 0.05, 0.05], stone, 6);
    }
  }
  root.animations = [new T.AnimationClip('Open villa shutter', 3.2, [swingTrack('VillaShutter', 'y', 3.2, 82)])];
}

function mongolianYurt(root: T.Group, p: Finish, detail: boolean) {
  const steppe = tone(p, 'Steppe turf', '#87805d', 0.9);
  const feltShade = tone(p, 'Woven trim', '#c7baa2', 0.88);
  const pine = tone(p, 'Painted pine', '#8f3f2a', 0.84);
  const b = group(root, 'MongolianYurt');
  cyl(b, p, [0, 0.08, 0], 1.24, 1.3, 0.16, steppe, 16);
  // Circular felt wall drum wrapped with tension bands
  cyl(b, p, [0, 0.64, 0], 1.06, 1.08, 1.0, p.primary, 16);
  for (const y of [0.38, 0.9]) ring(b, [0, y, 0], 1.1, 0.032, 0.075, p.accent);
  ring(b, [0, 1.12, 0], 1.12, 0.04, 0.08, feltShade);
  // Low conical felt roof rising to carved toono crown ring
  cyl(b, p, [0, 1.44, 0], 0.32, 1.12, 0.62, p.primary, 16);
  ring(b, [0, 1.76, 0], 0.34, 0.06, 0.12, p.accent);
  cyl(b, p, [0, 1.74, 0], 0.27, 0.27, 0.06, p.inset, 12);
  // Tilting rooftop smoke-hole flap (orokh)
  const flap = group(b, 'SmokeFlap', [0, 1.81, -0.32]);
  kbox(flap, p, [0, 0.04, 0.32], [0.68, 0.055, 0.68], feltShade);
  kbox(flap, p, [0, 0.072, 0.32], [0.52, 0.045, 0.52], p.accent);
  // Framed wooden painted steppe door on front (+Z)
  kbox(b, p, [0, 0.58, 1.04], [0.66, 0.88, 0.14], pine);
  hingedDoor(b, p, 'PaintedDoor', [0, 0.16, 1.1], 0.48, 0.78, p.accent, pine);
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      strut(b, [Math.sin(a) * 1.1, 1.12, Math.cos(a) * 1.1], [Math.sin(a) * 0.32, 1.76, Math.cos(a) * 0.32], 0.018, p.accent, 6);
    }
    cyl(b, p, [0.36, 1.66, -0.32], 0.05, 0.055, 0.62, p.alloy, 10);
    if (p.hd) {
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        kbox(b, p, [Math.sin(a) * 1.09, 0.64, Math.cos(a) * 1.09], [0.045, 0.14, 0.045], p.accent).rotation.y = a;
      }
    }
  }
  root.animations = [
    new T.AnimationClip('Vent smoke flap', 3.4, [swingTrack('SmokeFlap', 'x', 3.4, -44)]),
    new T.AnimationClip('Open yurt door', 3.0, [swingTrack('PaintedDoor', 'y', 3.0, 78)]),
  ];
}

function venetianPalazzo(root: T.Group, p: Finish, detail: boolean) {
  const canal = tone(p, 'Lagoon canal', '#2f8a91', 0.24, 0.18, '#0f444a');
  const marble = tone(p, 'Istrian marble', '#ece5d6', 0.8);
  const b = group(root, 'VenetianPalazzo');
  plinth(b, p, 2.48, 0.16, 2.08, canal, 0.08);
  // Stepped marble quay platform above lagoon water
  kbox(b, p, [0, 0.22, -0.06], [2.24, 0.2, 1.66], marble);
  kbox(b, p, [0, 0.18, 0.8], [1.14, 0.12, 0.24], marble);
  // Three-story waterfront facade with recessed piano-nobile loggia
  kbox(b, p, [0, 1.56, -0.14], [2.08, 2.54, 1.38], p.primary);
  for (const y of [1.12, 2.04, 2.86]) kbox(b, p, [0, y, -0.12], [2.18, 0.08, 1.46], marble);
  // Ground water-gate archway & hinged bronze canal gate
  kbox(b, p, [0, 0.68, 0.56], [0.74, 0.88, 0.08], marble);
  hingedDoor(b, p, 'CanalGate', [0, 0.28, 0.58], 0.52, 0.74, p.accent, marble);
  // Carved balustraded balcony on piano nobile with 4 arched colonnade pillars
  kbox(b, p, [0, 1.18, 0.68], [1.26, 0.09, 0.34], marble);
  kbox(b, p, [0, 1.48, 0.82], [1.22, 0.06, 0.06], marble);
  for (const x of [-0.52, -0.18, 0.18, 0.52]) {
    cyl(b, p, [x, 1.62, 0.6], 0.045, 0.05, 0.78, marble, 8);
    kbox(b, p, [x, 1.34, 0.82], [0.055, 0.24, 0.055], p.accent);
  }
  kbox(b, p, [0, 1.6, 0.56], [1.06, 0.74, 0.05], p.optic);
  for (const x of [-0.74, 0.74]) {
    windowUnit(b, p, [x, 1.6, 0.55], 0.3, 0.44, marble, p.optic, marble, detail);
    windowUnit(b, p, [x, 2.44, 0.55], 0.3, 0.42, marble, p.optic, marble, detail);
  }
  windowUnit(b, p, [0, 2.44, 0.55], 0.42, 0.42, marble, p.optic, marble, detail);
  // Rooftop cornice cresting & terracotta hip cap
  const cap = cyl(b, p, [0, 3.04, -0.14], 0.44, 1.44, 0.36, p.accent, 4, [0, Math.PI / 4, 0]);
  cap.scale.set(1.06, 1, 0.72);
  // Detachable striped Venetian paline mooring poles standing in canal plinth
  const poles = group(b, 'MooringPoles');
  for (const s of [-1, 1]) {
    const px = s * 0.84;
    cyl(poles, p, [px, 0.56, 0.9], 0.055, 0.062, 0.88, marble, 10);
    for (const y of [0.34, 0.58, 0.82]) ring(poles, [px, y, 0.9], 0.068, 0.015, 0.08, p.accent);
    orb(poles, p, [px, 1.02, 0.9], [0.068, 0.068, 0.068], p.accent, 8);
  }
  if (detail) {
    for (let x = -0.96; x <= 0.97; x += 0.24) kbox(b, p, [x, 2.98, 0.56], [0.1, 0.18, 0.08], marble);
    if (p.hd) {
      for (const s of [-1, 1]) {
        kbox(b, p, [s * 0.74, 0.72, 0.56], [0.3, 0.36, 0.05], p.optic);
      }
    }
  }
  root.animations = [new T.AnimationClip('Open canal gate', 3.0, [swingTrack('CanalGate', 'y', 3.0, 78)])];
}

function koreanHanok(root: T.Group, p: Finish, detail: boolean) {
  const granite = tone(p, 'Granite stylobate', '#a6a49d', 0.88);
  const pine = tone(p, 'Hanok pine', '#7d5232', 0.86);
  const paper = tone(p, 'Hanji screen', '#f4eedd', 0.82);
  const crock = tone(p, 'Onggi glaze', '#543526', 0.55, 0.12);
  const b = group(root, 'KoreanHanok');
  plinth(b, p, 2.66, 0.24, 2.16, granite, 0.08);
  kbox(b, p, [0, 0.14, 1.06], [0.76, 0.14, 0.28], granite);
  // Raised wooden maru veranda deck & timber colonnade posts
  kbox(b, p, [0, 0.34, 0], [2.24, 0.14, 1.66], pine);
  kbox(b, p, [0, 0.94, -0.18], [1.86, 1.08, 1.12], p.primary);
  quad((sx, sz) => cyl(b, p, [sx * 1.02, 0.94, sz * 0.74], 0.055, 0.06, 1.16, pine, 8));
  for (const x of [-0.34, 0.34]) cyl(b, p, [x, 0.94, 0.74], 0.05, 0.055, 1.16, pine, 8);
  // Recessed hanji lattice doorway + sliding lattice door leaf
  kbox(b, p, [0, 0.92, 0.38], [0.96, 0.82, 0.05], p.inset);
  const doorRest: Point = [-0.22, 0.92, 0.42];
  const sDoor = group(b, 'LatticeDoor', doorRest);
  kbox(sDoor, p, [0, 0, 0], [0.5, 0.8, 0.05], pine);
  kbox(sDoor, p, [0, 0, 0.015], [0.4, 0.7, 0.04], paper);
  for (const x of [-0.1, 0.1]) box(sDoor, [x, 0, 0.04], [0.022, 0.7, 0.02], pine);
  for (const y of [-0.18, 0, 0.18]) box(sDoor, [0, y, 0.04], [0.4, 0.022, 0.02], pine);
  // Sweeping curved giwa tile roof with upturned wing corners
  curvedEaveTier(b, p, 1.5, 2.74, 2.24, 0.62, p.accent, pine, detail);
  kbox(b, p, [0, 2.16, 0], [1.46, 0.12, 0.16], p.accent);
  // Detachable glazed onggi earthenware courtyard jars
  const jars = group(b, 'CourtyardJars', [0.98, 0.22, 0.84]);
  for (const [dx, dz, sc] of [[0, 0, 1], [-0.24, 0.06, 0.76], [0.16, -0.18, 0.84]] as const) {
    lathe(
      jars,
      p,
      [dx, 0, dz],
      [[0.01, 0], [0.09 * sc, 0], [0.14 * sc, 0.16 * sc], [0.12 * sc, 0.3 * sc], [0.09 * sc, 0.35 * sc], [0.01, 0.36 * sc]],
      crock,
      10,
    );
  }
  if (detail) {
    for (const s of [-1, 1]) {
      kbox(b, p, [s * 0.72, 0.94, 0.39], [0.32, 0.44, 0.05], pine);
      kbox(b, p, [s * 0.72, 0.94, 0.41], [0.24, 0.36, 0.04], paper);
    }
    if (p.hd) {
      for (let x = -1.04; x <= 1.05; x += 0.26) {
        cyl(b, p, [x, 1.48, 0.88], 0.022, 0.022, 0.36, pine, 8, [Math.PI / 2, 0, 0]);
      }
    }
  }
  root.animations = [new T.AnimationClip('Slide hanji door', 3.2, [slideTrack('LatticeDoor', 'x', doorRest, 3.2, 0.46)])];
}

export const buildingsWorldC: readonly WorldBuilderSpec[] = [
  {
    id: 'viking-turf-longhouse',
    riggedParts: [rot('HallDoor', 'Mead hall door', 'y', [0, 80], 'Swings the carved oak Norse hall door open')],
    detachableParts: [det('ShieldRow', 'Shield row', 'Painted wooden round shields hung along the front timber wall')],
    build: vikingLonghouse,
  },
  {
    id: 'tuscan-stone-villa',
    riggedParts: [rot('VillaShutter', 'Belvedere shutter', 'y', [0, 85], 'Swings the olive-painted tower balcony shutter open')],
    detachableParts: [det('CypressPlanters', 'Cypress planters', 'Twin terracotta pots planted with slender Tuscan cypresses')],
    build: tuscanVilla,
  },
  {
    id: 'mongolian-felt-yurt',
    riggedParts: [
      rot('SmokeFlap', 'Smoke flap', 'x', [-46, 0], 'Tilts the rooftop felt smoke-hole cover open'),
      rot('PaintedDoor', 'Painted yurt door', 'y', [0, 80], 'Swings the carved steppe ger entrance door open'),
    ],
    build: mongolianYurt,
  },
  {
    id: 'venetian-canal-palazzo',
    riggedParts: [rot('CanalGate', 'Water gate', 'y', [0, 80], 'Swings the waterfront canal entry gate open')],
    detachableParts: [det('MooringPoles', 'Mooring poles', 'Pair of striped Venetian gondola mooring poles')],
    build: venetianPalazzo,
  },
  {
    id: 'korean-hanok-pavilion',
    riggedParts: [slide('LatticeDoor', 'Lattice door', 'x', [0, 0.48], 'Slides the hanji paper-lattice maru screen door open')],
    detachableParts: [det('CourtyardJars', 'Onggi jars', 'Cluster of glazed earthenware fermentation crocks by the veranda')],
    build: koreanHanok,
  },
];
