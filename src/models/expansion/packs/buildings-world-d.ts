import * as T from 'three';
import { box, group, ring, spinTrack, strut } from '../../parts';
import type { Finish } from '../../parts';
import {
  cone,
  cyl,
  det,
  gable,
  hingedDoor,
  kbox,
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

function dutchSteppedHouse(root: T.Group, p: Finish, detail: boolean) {
  const cobble = tone(p, 'Canal cobble', '#6f6c66', 0.9);
  const slate = tone(p, 'Dutch slate', '#3b434d', 0.84);
  const iron = tone(p, 'Hoist iron', '#2e3338', 0.44, 0.5);
  const b = group(root, 'DutchSteppedHouse');
  plinth(b, p, 1.66, 0.16, 1.94, cobble, 0.06);
  // Narrow tall Amsterdam brick canal house body
  kbox(b, p, [0, 1.24, -0.06], [1.44, 2.22, 1.56], p.primary);
  // Iconic 5-step brick crow-stepped front gable facade with white sandstone capstones
  const steps = [
    [1.46, 2.48, 0.28],
    [1.16, 2.74, 0.28],
    [0.86, 3.0, 0.28],
    [0.54, 3.26, 0.28],
  ] as const;
  for (const [w, y, h] of steps) {
    kbox(b, p, [0, y, 0.66], [w, h, 0.18], p.primary);
    kbox(b, p, [0, y + h * 0.5 + 0.02, 0.67], [w + 0.08, 0.055, 0.25], p.accent);
  }
  // Steep roof tucked cleanly behind stepped facade
  pitchedRoof(b, p, 2.34, -0.1, 1.52, 0.94, 1.48, p.primary, slate, p.accent, detail);
  // Protruding attic hoist beam & swinging iron cargo pulley hook
  kbox(b, p, [0, 3.16, 0.92], [0.1, 0.1, 0.48], iron);
  const hook = group(b, 'HoistHook', [0, 3.12, 1.1]);
  strut(hook, [0, 0.02, 0], [0, -0.44, 0], 0.016, iron, 6);
  ring(hook, [0, -0.5, 0], 0.065, 0.018, 0.03, p.alloy).rotation.x = Math.PI / 2;
  // Canal stoop, hinged front door & tall multi-pane Dutch windows
  kbox(b, p, [-0.34, 0.22, 0.82], [0.56, 0.16, 0.28], p.accent);
  hingedDoor(b, p, 'CanalDoor', [-0.34, 0.28, 0.72], 0.4, 0.76, slate, p.accent);
  windowUnit(b, p, [0.3, 0.64, 0.72], 0.4, 0.54, p.accent, p.optic, p.accent, detail);
  for (const y of [1.4, 2.02]) {
    for (const x of [-0.34, 0.34]) windowUnit(b, p, [x, y, 0.72], 0.34, 0.44, p.accent, p.optic, p.accent, detail);
  }
  windowUnit(b, p, [0, 2.68, 0.74], 0.3, 0.36, p.accent, p.optic, p.accent, detail);
  if (detail) {
    for (const y of [1.08, 1.72, 2.32]) kbox(b, p, [0, y, 0.74], [1.48, 0.055, 0.05], p.accent);
    if (p.hd) {
      for (const s of [-0.56, 0.56]) orb(b, p, [s, 2.72, 0.7], [0.04, 0.055, 0.04], p.accent, 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Swing hoist hook', 3.4, [swingTrack('HoistHook', 'z', 3.4, 22, true)]),
    new T.AnimationClip('Open canal door', 3.0, [swingTrack('CanalDoor', 'y', 3.0, 78)]),
  ];
}

function greekDoricTemple(root: T.Group, p: Finish, detail: boolean) {
  const marbleShade = tone(p, 'Pentelic stone', '#d5ccb9', 0.84);
  const bronze = tone(p, 'Temple bronze', '#876838', 0.42, 0.48);
  const flame = tone(p, 'Sacred ember', '#ff9d3b', 0.28, 0.06, '#ff5c1a');
  const b = group(root, 'GreekDoricTemple');
  // Three-stepped crepidoma stylobate grounded at y = 0
  plinth(b, p, 2.58, 0.14, 2.98, marbleShade, 0.04);
  kbox(b, p, [0, 0.2, 0], [2.36, 0.14, 2.76], p.primary);
  kbox(b, p, [0, 0.32, 0], [2.14, 0.12, 2.54], marbleShade);
  // Inner cella sanctum chamber with hinged bronze portal
  kbox(b, p, [0, 0.94, -0.06], [1.22, 1.18, 1.56], p.primary);
  hingedDoor(b, p, 'SanctumDoor', [0, 0.38, 0.72], 0.48, 0.86, bronze, p.accent);
  // Peripteral fluted Doric colonnade (4 across front/back, 5 along sides)
  const colXs = [-0.92, -0.31, 0.31, 0.92] as const;
  const colZs = [-1.1, -0.55, 0, 0.55, 1.1] as const;
  for (const x of colXs) {
    for (const z of colZs) {
      if (Math.abs(x) < 0.8 && Math.abs(z) < 1.0) continue;
      cyl(b, p, [x, 0.96, z], 0.092, 0.112, 1.18, p.primary, 10);
      kbox(b, p, [x, 1.56, z], [0.24, 0.065, 0.24], marbleShade);
    }
  }
  // Entablature architrave, triglyph frieze & triangular classical pediment roof
  kbox(b, p, [0, 1.66, 0], [2.12, 0.14, 2.48], p.primary);
  kbox(b, p, [0, 1.79, 0], [2.16, 0.12, 2.52], p.accent);
  kbox(b, p, [0, 1.9, 0], [2.26, 0.09, 2.62], marbleShade);
  gable(b, p, [0, 1.94, 0], 2.22, 0.52, 2.46, p.primary);
  for (const s of [-1, 1]) {
    const slab = kbox(b, p, [s * 0.62, 2.22, 0], [1.34, 0.08, 2.68], p.accent);
    slab.rotation.z = -s * 0.44;
  }
  kbox(b, p, [0, 2.5, 0], [0.16, 0.08, 2.72], marbleShade);
  // Detachable bronze offering altar brazier on front steps
  const altar = group(b, 'AltarBrazier', [0, 0.14, 1.38]);
  kbox(altar, p, [0, 0.14, 0], [0.34, 0.28, 0.28], marbleShade);
  cyl(altar, p, [0, 0.34, 0], 0.15, 0.1, 0.12, bronze, 10);
  cone(altar, p, [0, 0.46, 0], 0.1, 0.16, flame, 8);
  if (detail) {
    for (let x = -0.9; x <= 0.91; x += 0.3) {
      box(b, [x, 1.79, 1.28], [0.08, 0.11, 0.04], marbleShade);
      box(b, [x, 1.79, -1.28], [0.08, 0.11, 0.04], marbleShade);
    }
    if (p.hd) {
      for (const s of [-1, 1]) orb(b, p, [s * 1.12, 2.02, 1.3], [0.06, 0.09, 0.06], p.accent, 8);
      orb(b, p, [0, 2.6, 1.32], [0.075, 0.12, 0.075], p.accent, 8);
    }
  }
  root.animations = [new T.AnimationClip('Open sanctum door', 3.2, [swingTrack('SanctumDoor', 'y', 3.2, 78)])];
}

function mayanPyramid(root: T.Group, p: Finish, detail: boolean) {
  const moss = tone(p, 'Jungle turf', '#4a6b42', 0.9);
  const limestone = tone(p, 'Aged limestone', '#b0a388', 0.88);
  const gold = tone(p, 'Solar gold', '#d6a540', 0.38, 0.56);
  const b = group(root, 'MayanPyramid');
  plinth(b, p, 3.04, 0.14, 3.04, moss, 0.08);
  // Four stepped limestone pyramid tiers with recessed shadow moldings
  const tiers = [
    { y: 0.34, w: 2.68, h: 0.44 },
    { y: 0.78, w: 2.18, h: 0.44 },
    { y: 1.22, w: 1.68, h: 0.44 },
    { y: 1.66, w: 1.22, h: 0.44 },
  ] as const;
  for (const t of tiers) {
    kbox(b, p, [0, t.y, 0], [t.w, t.h, t.w], p.primary);
    kbox(b, p, [0, t.y + t.h * 0.44, 0], [t.w + 0.06, 0.065, t.w + 0.06], limestone);
  }
  // Steep central front limestone staircase & twin serpent balustrades
  for (let i = 0; i < 10; i++) {
    const sy = 0.2 + i * 0.175;
    const sz = 1.36 - i * 0.088;
    kbox(b, p, [0, sy, sz], [0.64, 0.16, 0.26], limestone);
  }
  for (const s of [-1, 1]) {
    const ramp = kbox(b, p, [s * 0.38, 1.04, 0.96], [0.14, 0.22, 1.88], p.accent);
    ramp.rotation.x = 1.1;
    // Carved serpent head block at foot of balustrade
    kbox(b, p, [s * 0.38, 0.28, 1.46], [0.22, 0.24, 0.26], p.accent);
  }
  // Summit temple chamber with pierced roof-comb crest
  kbox(b, p, [0, 2.16, -0.06], [0.84, 0.56, 0.76], p.primary);
  kbox(b, p, [0, 2.48, -0.06], [0.92, 0.1, 0.84], limestone);
  kbox(b, p, [0, 2.74, -0.18], [0.74, 0.42, 0.16], p.accent);
  // Rotating golden solar altar disc on summit front terrace
  cyl(b, p, [0, 1.98, 0.42], 0.16, 0.2, 0.16, limestone, 8);
  const altar = group(b, 'SunAltar', [0, 2.18, 0.42]);
  cyl(altar, p, [0, 0, 0], 0.18, 0.18, 0.06, gold, 10, [Math.PI / 2, 0, 0]);
  ring(altar, [0, 0, 0], 0.2, 0.025, 0.07, p.accent).rotation.x = Math.PI / 2;
  // Detachable carved Maya stele monoliths flanking stair base
  const steles = group(b, 'StelePair');
  for (const s of [-1, 1]) {
    kbox(steles, p, [s * 0.92, 0.46, 1.36], [0.24, 0.68, 0.16], limestone);
    kbox(steles, p, [s * 0.92, 0.48, 1.44], [0.16, 0.52, 0.04], p.accent);
  }
  if (detail) {
    for (const s of [-0.22, 0, 0.22]) box(b, [s, 2.74, -0.09], [0.09, 0.28, 0.04], p.primary);
    for (const s of [-1, 1]) kbox(b, p, [s * 0.9, 0.62, 1.08], [0.22, 0.28, 0.22], moss);
    if (p.hd) {
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        cone(altar, p, [Math.sin(a) * 0.24, Math.cos(a) * 0.24, 0], 0.032, 0.1, gold, 6, [0, 0, -a]);
      }
    }
  }
  root.animations = [new T.AnimationClip('Rotate sun altar', 4.2, [spinTrack('SunAltar', 'y', 4.2, 1)])];
}

function scottishCroft(root: T.Group, p: Finish, detail: boolean) {
  const heather = tone(p, 'Highland turf', '#5f6b47', 0.9);
  const peat = tone(p, 'Cut peat turf', '#4a3a2b', 0.92);
  const stoneTrim = tone(p, 'Granite lintel', '#b5b0a4', 0.88);
  const wood = tone(p, 'Croft timber', '#5c412d', 0.86);
  const b = group(root, 'ScottishCroft');
  plinth(b, p, 2.66, 0.16, 2.02, heather, 0.14);
  // Thick fieldstone cottage walls
  kbox(b, p, [-0.14, 0.62, -0.04], [2.04, 0.96, 1.34], p.primary);
  // Steep Highland slate lengthwise gable roof (ridge along X) with stone skew copings & twin gable chimneys
  const endGable = gable(b, p, [-0.14, 1.08, -0.04], 1.34, 0.72, 1.98, p.primary);
  endGable.rotation.y = Math.PI / 2;
  const croftSlope = Math.hypot(0.76, 0.72) + 0.12;
  const croftAngle = Math.atan2(0.72, 0.76);
  for (const sz of [-1, 1]) {
    const slope = kbox(b, p, [-0.14, 1.46, -0.04 + sz * 0.39], [2.0, 0.085, croftSlope], p.accent);
    slope.rotation.x = sz * croftAngle;
    for (const sx of [-1, 1]) {
      const skew = kbox(b, p, [-0.14 + sx * 1.04, 1.5, -0.04 + sz * 0.39], [0.1, 0.11, croftSlope + 0.04], stoneTrim);
      skew.rotation.x = sz * croftAngle;
    }
  }
  kbox(b, p, [-0.14, 1.84, -0.04], [2.16, 0.09, 0.14], stoneTrim);
  for (const s of [-1, 1]) {
    kbox(b, p, [-0.14 + s * 0.96, 1.56, -0.04], [0.28, 0.88, 0.34], p.primary);
    kbox(b, p, [-0.14 + s * 0.96, 2.02, -0.04], [0.34, 0.08, 0.4], stoneTrim);
    cyl(b, p, [-0.14 + s * 0.96, 2.14, -0.04], 0.06, 0.075, 0.18, peat, 8);
  }
  hingedDoor(b, p, 'CroftDoor', [-0.14, 0.16, 0.64], 0.44, 0.76, wood, stoneTrim);
  for (const x of [-0.74, 0.46]) {
    windowUnit(b, p, [x, 0.62, 0.64], 0.32, 0.34, stoneTrim, p.optic, stoneTrim, detail);
  }
  // Low dry-stone side pen wall
  kbox(b, p, [1.08, 0.34, -0.04], [0.36, 0.38, 1.18], stoneTrim);
  // Detachable stacked Highland peat fuel pile inside pen
  const stack = group(b, 'PeatStack', [1.06, 0.16, 0.54]);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3 - r; c++) {
      kbox(stack, p, [-0.12 + (c + r * 0.5) * 0.14, 0.08 + r * 0.1, 0], [0.12, 0.08, 0.36], peat);
    }
  }
  if (detail) {
    for (const s of [-1, 1]) {
      kbox(b, p, [-0.14 + s * 1.03, 0.42, 0.6], [0.1, 0.24, 0.12], stoneTrim);
      kbox(b, p, [-0.14 + s * 1.03, 0.82, 0.6], [0.1, 0.24, 0.12], stoneTrim);
    }
    if (p.hd) {
      for (let i = 0; i < 6; i++) {
        orb(b, p, [-1.18 + i * 0.36, 0.2, 0.82], [0.09, 0.05, 0.08], heather, 7);
      }
    }
  }
  root.animations = [new T.AnimationClip('Open croft door', 3.0, [swingTrack('CroftDoor', 'y', 3.0, 78)])];
}

function colonialManor(root: T.Group, p: Finish, detail: boolean) {
  const lawn = tone(p, 'Manor stone terrace', '#9a968b', 0.88);
  const trim = tone(p, 'Painted cream trim', '#f5f0e1', 0.82);
  const brass = tone(p, 'Weathervane brass', '#b89444', 0.38, 0.56);
  const b = group(root, 'ColonialManor');
  plinth(b, p, 2.86, 0.16, 2.28, lawn, 0.08);
  // Symmetrical 2-story clapboard manor house
  kbox(b, p, [0, 1.04, -0.14], [2.24, 1.76, 1.46], p.primary);
  // Full-width wrap-around columned front veranda & roof
  kbox(b, p, [0, 0.22, 0.78], [2.56, 0.16, 0.66], trim);
  kbox(b, p, [0, 1.04, 0.78], [2.62, 0.09, 0.7], trim);
  const porchSlope = kbox(b, p, [0, 1.16, 0.78], [2.6, 0.07, 0.72], p.accent);
  porchSlope.rotation.x = 0.22;
  for (const x of [-1.14, -0.58, 0.58, 1.14]) {
    cyl(b, p, [x, 0.64, 0.98], 0.052, 0.06, 0.78, trim, 10);
  }
  for (const s of [-1, 1]) {
    kbox(b, p, [s * 0.86, 0.48, 0.98], [0.54, 0.3, 0.055], trim);
  }
  // Hipped colonial roof + twin front dormers
  const hip = cyl(b, p, [0, 2.2, -0.14], 0.42, 1.76, 0.64, p.accent, 4, [0, Math.PI / 4, 0]);
  hip.scale.set(1.06, 1, 0.76);
  for (const x of [-0.58, 0.58]) {
    kbox(b, p, [x, 2.12, 0.46], [0.4, 0.34, 0.32], trim);
    windowUnit(b, p, [x, 2.12, 0.61], 0.22, 0.22, trim, p.optic, trim, detail);
  }
  // Central octagonal rooftop cupola & rotating brass weathervane
  cyl(b, p, [0, 2.66, -0.14], 0.3, 0.32, 0.34, trim, 8);
  cone(b, p, [0, 2.96, -0.14], 0.34, 0.28, p.accent, 8);
  const vane = group(b, 'CupolaVane', [0, 3.04, -0.14]);
  cyl(vane, p, [0, 0.18, 0], 0.022, 0.026, 0.38, brass, 8);
  kbox(vane, p, [0, 0.34, 0], [0.46, 0.045, 0.045], brass);
  cone(vane, p, [0.24, 0.34, 0], 0.05, 0.12, brass, 6, [0, 0, -Math.PI / 2]);
  kbox(vane, p, [-0.22, 0.34, 0], [0.1, 0.12, 0.035], p.accent);
  // Hinged front manor door & shuttered windows
  hingedDoor(b, p, 'ManorDoor', [0, 0.3, 0.59], 0.48, 0.74, p.accent, trim);
  for (const x of [-0.74, 0.74]) {
    windowUnit(b, p, [x, 0.66, 0.59], 0.32, 0.38, trim, p.optic, trim, detail, p.accent);
    windowUnit(b, p, [x, 1.48, 0.59], 0.32, 0.38, trim, p.optic, trim, detail, p.accent);
  }
  windowUnit(b, p, [0, 1.48, 0.59], 0.32, 0.38, trim, p.optic, trim, detail, p.accent);
  if (detail) {
    quad((sx, sz) => kbox(b, p, [sx * 1.12, 1.04, -0.14 + sz * 0.73], [0.08, 1.76, 0.08], trim));
    kbox(b, p, [0, 0.14, 1.06], [0.92, 0.12, 0.22], trim);
    if (p.hd) {
      for (const s of [-1, 1]) cyl(b, p, [s * 0.96, 2.38, -0.44], 0.1, 0.12, 0.44, p.accent, 8);
    }
  }
  root.animations = [
    new T.AnimationClip('Turn weathervane', 4.0, [spinTrack('CupolaVane', 'y', 4.0, 1)]),
    new T.AnimationClip('Open manor door', 3.0, [swingTrack('ManorDoor', 'y', 3.0, 78)]),
  ];
}

export const buildingsWorldD: readonly WorldBuilderSpec[] = [
  {
    id: 'dutch-stepped-gable-house',
    riggedParts: [
      rot('HoistHook', 'Attic hoist hook', 'z', [-24, 24], 'Swings the attic cargo pulley hook beneath the stepped gable'),
      rot('CanalDoor', 'Canal house door', 'y', [0, 80], 'Swings the Dutch canal front door open'),
    ],
    build: dutchSteppedHouse,
  },
  {
    id: 'greek-doric-temple',
    riggedParts: [rot('SanctumDoor', 'Sanctum door', 'y', [0, 80], 'Swings the bronze cella temple door open')],
    detachableParts: [det('AltarBrazier', 'Altar brazier', 'Removable stone offering altar with bronze flame brazier')],
    build: greekDoricTemple,
  },
  {
    id: 'mayan-stepped-pyramid',
    riggedParts: [rot('SunAltar', 'Solar altar', 'y', [0, 360], 'Rotates the golden Mesoamerican solar altar disc')],
    detachableParts: [det('StelePair', 'Carved steles', 'Twin carved limestone stele monoliths flanking the stairs')],
    build: mayanPyramid,
  },
  {
    id: 'scottish-stone-croft',
    riggedParts: [rot('CroftDoor', 'Croft door', 'y', [0, 80], 'Swings the timber Highland cottage door open')],
    detachableParts: [det('PeatStack', 'Peat fuel stack', 'Removable stack of cut Highland peat turf blocks')],
    build: scottishCroft,
  },
  {
    id: 'colonial-wrap-porch-manor',
    riggedParts: [
      rot('CupolaVane', 'Cupola weathervane', 'y', [0, 360], 'Rotates the brass weathervane atop the octagonal cupola'),
      rot('ManorDoor', 'Manor door', 'y', [0, 80], 'Swings the columned front veranda door open'),
    ],
    build: colonialManor,
  },
];
