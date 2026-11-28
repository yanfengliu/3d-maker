import * as T from 'three';
import { box, group, ring, spinTrack, strut } from '../../parts';
import type { Finish } from '../../parts';
import {
  cone,
  cyl,
  det,
  hingedDoor,
  kbox,
  lathe,
  orb,
  pitchedRoof,
  plinth,
  rot,
  swingTrack,
  tone,
  windowUnit,
  type WorldBuilderSpec,
} from './buildings-world-kit';

function tudorTavern(root: T.Group, p: Finish, detail: boolean) {
  const stone = tone(p, 'Cotswold stone', '#8e887c', 0.9);
  const timber = tone(p, 'Aged oak beam', '#422d1f', 0.88);
  const brick = tone(p, 'Chimney brick', '#9c4b3b', 0.86);
  const b = group(root, 'TudorTavern');
  plinth(b, p, 2.28, 0.16, 1.88, stone, 0.08);
  // Recessed stone ground story + jettied overhanging half-timbered upper story
  kbox(b, p, [0, 0.56, -0.04], [1.94, 0.86, 1.48], stone);
  kbox(b, p, [0, 1.02, 0], [2.22, 0.09, 1.78], timber);
  kbox(b, p, [0, 1.44, 0], [2.16, 0.8, 1.7], p.primary);
  // Half-timbering grid & diagonal cross braces
  for (const x of [-1.05, -0.35, 0.35, 1.05]) {
    kbox(b, p, [x, 1.44, 0.86], [0.08, 0.82, 0.055], timber);
    kbox(b, p, [x, 1.44, -0.86], [0.08, 0.82, 0.055], timber);
  }
  for (const y of [1.06, 1.82]) kbox(b, p, [0, y, 0.86], [2.2, 0.075, 0.06], timber);
  for (const sx of [-1, 1]) {
    strut(b, [sx * 0.36, 1.08, 0.87], [sx * 1.02, 1.8, 0.87], 0.032, timber, p.hd ? 10 : 6);
    strut(b, [sx * 0.92, 0.72, 0.72], [sx * 1.06, 1.0, 0.86], 0.042, timber, p.hd ? 10 : 6);
  }
  pitchedRoof(b, p, 1.84, 0, 2.38, 0.74, 1.94, p.primary, p.accent, timber, detail);
  // Tall stepped brick tavern chimney stack
  kbox(b, p, [-0.88, 1.32, -0.44], [0.36, 2.24, 0.36], brick);
  kbox(b, p, [-0.88, 2.58, -0.44], [0.28, 0.44, 0.28], brick);
  cyl(b, p, [-0.88, 2.86, -0.44], 0.065, 0.08, 0.18, p.accent, 8);
  hingedDoor(b, p, 'OakDoor', [0.34, 0.16, 0.71], 0.44, 0.78, timber, stone);
  windowUnit(b, p, [-0.46, 0.58, 0.71], 0.44, 0.38, timber, p.optic, stone, detail);
  windowUnit(b, p, [0, 1.44, 0.86], 0.44, 0.38, timber, p.optic, timber, detail);
  // Cantilevered wrought-iron bracket & swinging tavern sign
  strut(b, [1.06, 1.66, 0.62], [1.46, 1.66, 0.62], 0.026, p.dark, 8);
  strut(b, [1.06, 1.36, 0.62], [1.34, 1.66, 0.62], 0.02, p.dark, 6);
  const sign = group(b, 'TavernSign', [1.34, 1.64, 0.62]);
  for (const dx of [-0.1, 0.1]) strut(sign, [dx, 0.02, 0], [dx, -0.1, 0], 0.015, p.alloy, 6);
  kbox(sign, p, [0, -0.28, 0], [0.34, 0.34, 0.055], p.accent);
  kbox(sign, p, [0, -0.28, 0], [0.24, 0.22, 0.075], p.stencil);
  if (detail) {
    for (const z of [-0.56, 0, 0.56]) {
      for (const s of [-1, 1]) kbox(b, p, [s * 1.1, 1.44, z], [0.055, 0.8, 0.075], timber);
    }
    if (p.hd) {
      cyl(b, p, [-0.74, 2.86, -0.44], 0.055, 0.07, 0.16, p.accent, 8);
      ring(sign, [0, -0.28, 0.04], 0.065, 0.016, 0.022, p.primary).rotation.x = Math.PI / 2;
    }
  }
  root.animations = [
    new T.AnimationClip('Tavern breeze', 3.4, [swingTrack('TavernSign', 'z', 3.4, 20, true)]),
    new T.AnimationClip('Open tavern door', 3.0, [swingTrack('OakDoor', 'y', 3.0, 78)]),
  ];
}

function artDecoCinema(root: T.Group, p: Finish, detail: boolean) {
  const terrazzo = tone(p, 'Terrazzo deck', '#d6cfc4', 0.78);
  const chrome = tone(p, 'Brushed chrome', '#b9c6c9', 0.36, 0.58);
  const neon = tone(p, 'Deco neon glow', '#ffdf85', 0.28, 0.06, '#ffb238');
  const b = group(root, 'ArtDecoCinema');
  plinth(b, p, 2.48, 0.14, 1.92, terrazzo, 0.1);
  // Stepped pastel ziggurat cinema facade
  kbox(b, p, [0, 0.96, -0.12], [2.24, 1.66, 1.44], p.primary);
  kbox(b, p, [0, 1.96, -0.14], [1.54, 0.52, 1.24], p.primary);
  kbox(b, p, [0, 2.42, -0.12], [0.84, 0.56, 0.96], p.primary);
  // Vertical fluted center fin spire & horizontal pastel eyebrow bands
  kbox(b, p, [0, 2.28, 0.42], [0.22, 1.68, 0.24], p.accent);
  for (const s of [-1, 1]) {
    kbox(b, p, [s * 0.22, 2.1, 0.44], [0.1, 1.32, 0.18], chrome);
    kbox(b, p, [s * 0.86, 1.44, 0.64], [0.64, 0.075, 0.18], p.accent);
    kbox(b, p, [s * 0.86, 1.64, 0.64], [0.64, 0.065, 0.15], chrome);
  }
  // Cantilevered Art Deco marquee canopy
  kbox(b, p, [0, 1.06, 0.78], [1.66, 0.34, 0.58], p.accent);
  kbox(b, p, [0, 1.06, 1.08], [1.52, 0.22, 0.05], neon);
  kbox(b, p, [0, 1.25, 0.78], [1.72, 0.06, 0.64], chrome);
  kbox(b, p, [0, 0.88, 0.78], [1.72, 0.055, 0.64], chrome);
  // Central ticket booth & hinged lobby door
  cyl(b, p, [-0.48, 0.48, 0.72], 0.22, 0.24, 0.68, p.accent, 8);
  cyl(b, p, [-0.48, 0.64, 0.72], 0.2, 0.2, 0.28, p.optic, 8);
  hingedDoor(b, p, 'LobbyDoor', [0.24, 0.14, 0.62], 0.52, 0.78, chrome, p.accent);
  // Rotating rooftop starburst fin ornament
  cyl(b, p, [0, 2.8, -0.12], 0.14, 0.22, 0.22, chrome, 10);
  const fin = group(b, 'MarqueeFin', [0, 3.06, -0.12]);
  cyl(fin, p, [0, 0, 0], 0.05, 0.05, 0.36, chrome, 8);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    const blade = kbox(fin, p, [0, 0.04, 0], [0.56, 0.14, 0.05], i % 2 === 0 ? p.accent : neon);
    blade.rotation.y = a;
  }
  orb(fin, p, [0, 0.04, 0], [0.11, 0.11, 0.11], neon, 8);
  if (detail) {
    for (const s of [-1, 1]) {
      kbox(b, p, [s * 0.92, 0.64, 0.62], [0.34, 0.52, 0.06], chrome);
      kbox(b, p, [s * 0.92, 0.64, 0.65], [0.24, 0.42, 0.04], neon);
      for (let i = 0; i < 3; i++) box(b, [s * (0.3 + i * 0.24), 1.06, 1.11], [0.06, 0.12, 0.03], p.primary);
    }
    if (p.hd) {
      for (let i = 0; i < 6; i++) {
        orb(b, p, [-0.62 + i * 0.25, 0.85, 0.92], [0.03, 0.025, 0.03], neon, 6);
      }
    }
  }
  root.animations = [
    new T.AnimationClip('Spin deco crest', 4.0, [spinTrack('MarqueeFin', 'y', 4.0, 1)]),
    new T.AnimationClip('Open lobby door', 3.0, [swingTrack('LobbyDoor', 'y', 3.0, 78)]),
  ];
}

function turkishHammam(root: T.Group, p: Finish, detail: boolean) {
  const marble = tone(p, 'Anatolian marble', '#e8e0d0', 0.8);
  const copper = tone(p, 'Aged copper', '#a86b43', 0.44, 0.48);
  const b = group(root, 'TurkishHammam');
  plinth(b, p, 2.48, 0.16, 2.38, marble, 0.2);
  // Octagonal bathhouse drum + square side wings
  cyl(b, p, [0, 0.74, -0.06], 1.06, 1.12, 1.2, p.primary, 8);
  cyl(b, p, [0, 1.38, -0.06], 1.12, 1.1, 0.12, marble, 8);
  // Main scalloped lead dome studded with glass oculus skylights
  lathe(
    b,
    p,
    [0, 1.4, -0.06],
    [[0.01, 0], [0.94, 0], [0.92, 0.24], [0.78, 0.56], [0.5, 0.82], [0.18, 0.94], [0.01, 0.96]],
    p.accent,
    14,
  );
  cyl(b, p, [0, 2.44, -0.06], 0.03, 0.05, 0.2, copper, 8);
  orb(b, p, [0, 2.56, -0.06], [0.065, 0.065, 0.065], copper, 8);
  // Flanking side chambers with smaller domes
  for (const s of [-1, 1]) {
    kbox(b, p, [s * 0.92, 0.58, 0.28], [0.64, 0.86, 0.74], p.primary);
    lathe(
      b,
      p,
      [s * 0.92, 1.0, 0.28],
      [[0.01, 0], [0.3, 0], [0.28, 0.14], [0.18, 0.28], [0.01, 0.34]],
      p.accent,
      10,
    );
  }
  // Arched front marble portico & portal door
  kbox(b, p, [0, 0.68, 0.86], [0.96, 1.06, 0.56], p.primary);
  kbox(b, p, [0, 1.24, 0.88], [1.04, 0.1, 0.62], marble);
  hingedDoor(b, p, 'BathPortal', [0, 0.16, 1.12], 0.48, 0.84, copper, marble);
  const urns = group(b, 'CopperUrns');
  for (const s of [-1, 1]) {
    lathe(
      urns,
      p,
      [s * 0.64, 0.14, 1.08],
      [[0.01, 0], [0.11, 0], [0.16, 0.16], [0.14, 0.3], [0.08, 0.38], [0.12, 0.44], [0.01, 0.44]],
      copper,
      10,
    );
  }
  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      orb(b, p, [Math.sin(a) * 0.66, 1.96, -0.06 + Math.cos(a) * 0.66], [0.07, 0.05, 0.07], p.optic, 7);
    }
    if (p.hd) {
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + Math.PI / 8;
        orb(b, p, [Math.sin(a) * 0.36, 2.24, -0.06 + Math.cos(a) * 0.36], [0.055, 0.04, 0.055], p.optic, 7);
      }
      ring(b, [0, 1.46, -0.06], 0.96, 0.035, 0.05, copper);
    }
  }
  root.animations = [new T.AnimationClip('Open hammam portal', 3.2, [swingTrack('BathPortal', 'y', 3.2, 78)])];
}

function georgianTownhouse(root: T.Group, p: Finish, detail: boolean) {
  const stone = tone(p, 'Portland stone', '#dcd5c6', 0.86);
  const iron = tone(p, 'Wrought iron', '#282c30', 0.48, 0.42);
  const b = group(root, 'GeorgianTownhouse');
  plinth(b, p, 1.88, 0.16, 1.98, stone, 0.06);
  // Rusticated stone basement floor + 2 brick upper stories
  kbox(b, p, [0, 0.48, -0.08], [1.68, 0.68, 1.5], stone);
  kbox(b, p, [0, 1.66, -0.08], [1.66, 1.72, 1.46], p.primary);
  kbox(b, p, [0, 1.06, -0.06], [1.76, 0.08, 1.56], stone);
  kbox(b, p, [0, 2.54, -0.06], [1.78, 0.1, 1.6], stone);
  // Steep slate mansard roof with central dormer & twin chimney pots
  kbox(b, p, [0, 2.86, -0.08], [1.56, 0.56, 1.32], p.accent);
  kbox(b, p, [0, 3.16, -0.08], [1.34, 0.08, 1.12], p.accent);
  kbox(b, p, [0, 2.84, 0.52], [0.56, 0.44, 0.28], stone);
  windowUnit(b, p, [0, 2.84, 0.65], 0.34, 0.28, p.stencil, p.optic, stone, detail);
  kbox(b, p, [-0.62, 3.28, -0.26], [0.28, 0.32, 0.28], p.primary);
  for (const dx of [-0.06, 0.06]) cyl(b, p, [-0.62 + dx, 3.5, -0.26], 0.04, 0.05, 0.16, p.accent, 8);
  // Entry stoop steps, fanlight pediment & hinged panel door
  kbox(b, p, [-0.42, 0.22, 0.78], [0.66, 0.18, 0.38], stone);
  kbox(b, p, [-0.42, 1.2, 0.72], [0.68, 0.08, 0.22], stone);
  hingedDoor(b, p, 'PanelDoor', [-0.42, 0.3, 0.7], 0.44, 0.78, p.accent, stone);
  // Symmetrical Georgian sash windows
  windowUnit(b, p, [0.38, 0.52, 0.66], 0.4, 0.42, p.stencil, p.optic, stone, detail);
  for (const y of [1.36, 2.08]) {
    for (const x of [-0.42, 0.38]) windowUnit(b, p, [x, y, 0.65], 0.38, 0.48, p.stencil, p.optic, stone, detail);
  }
  // Detachable wrought-iron Georgian street lamp post on right stoop
  const lamp = group(b, 'IronLamp', [0.76, 0.14, 0.84]);
  cyl(lamp, p, [0, 0.56, 0], 0.036, 0.055, 1.12, iron, 8);
  kbox(lamp, p, [0, 1.22, 0], [0.16, 0.22, 0.16], p.optic);
  cone(lamp, p, [0, 1.38, 0], 0.14, 0.12, iron, 6);
  if (detail) {
    for (let x = 0.04; x <= 0.66; x += 0.15) cyl(b, p, [x, 0.42, 0.92], 0.014, 0.014, 0.54, iron, 6);
    kbox(b, p, [0.35, 0.68, 0.92], [0.68, 0.035, 0.035], iron);
    if (p.hd) {
      cyl(b, p, [-0.42, 1.06, 0.69], 0.18, 0.18, 0.04, p.optic, 12, [Math.PI / 2, 0, 0]);
    }
  }
  root.animations = [new T.AnimationClip('Open town door', 3.0, [swingTrack('PanelDoor', 'y', 3.0, 80)])];
}

function thaiStiltHouse(root: T.Group, p: Finish, detail: boolean) {
  const water = tone(p, 'Klong water', '#37989e', 0.24, 0.18, '#10494f');
  const teak = tone(p, 'Dark teak', '#5c3822', 0.86);
  const bamboo = tone(p, 'Golden bamboo', '#c9a966', 0.84);
  const b = group(root, 'ThaiStiltHouse');
  plinth(b, p, 2.48, 0.14, 2.22, water, 0.12);
  // Tall cross-braced teak stilts supporting elevated veranda deck
  const xs = [-0.94, 0, 0.94] as const;
  const zs = [-0.74, 0.12, 0.78] as const;
  for (const x of xs) {
    for (const z of zs) cyl(b, p, [x, 0.52, z], 0.055, 0.065, 0.92, teak, 8);
  }
  for (const sx of [-0.94, 0.94]) {
    strut(b, [sx, 0.18, -0.72], [sx, 0.88, 0.1], 0.026, bamboo, p.hd ? 10 : 6);
    strut(b, [sx, 0.88, -0.72], [sx, 0.18, 0.1], 0.026, bamboo, p.hd ? 10 : 6);
  }
  // Elevated teak platform & cabin
  kbox(b, p, [0, 0.98, 0.02], [2.16, 0.1, 1.82], teak);
  kbox(b, p, [0, 1.48, -0.26], [1.72, 0.92, 1.06], p.primary);
  // Steep curved gable roof with iconic crossed kalae roof horn finials
  pitchedRoof(b, p, 1.94, -0.22, 2.12, 0.82, 1.48, p.primary, p.accent, teak, detail);
  for (const z of [-0.92, 0.48]) {
    for (const s of [-1, 1]) {
      strut(b, [0, 2.7, z], [s * 0.24, 3.04, z], 0.028, teak, p.hd ? 10 : 6);
    }
  }
  // Shaded veranda lean-to awning & access stair ramp
  const porchRoof = kbox(b, p, [0, 1.82, 0.62], [1.96, 0.06, 0.72], p.accent);
  porchRoof.rotation.x = 0.28;
  for (const s of [-0.88, 0.88]) cyl(b, p, [s, 1.4, 0.82], 0.04, 0.045, 0.78, bamboo, 8);
  for (const dx of [-0.18, 0.18]) strut(b, [0.46 + dx, 0.14, 1.04], [0.46 + dx, 0.98, 0.78], 0.024, teak, 6);
  // Hinged outward-propping veranda window shutter
  kbox(b, p, [-0.28, 1.5, 0.28], [0.56, 0.46, 0.06], p.inset);
  const shutter = group(b, 'VerandaShutter', [-0.28, 1.72, 0.31]);
  kbox(shutter, p, [0, -0.22, 0.02], [0.54, 0.44, 0.045], bamboo);
  // Detachable moored river skiff resting on water plinth
  const skiff = group(b, 'RiverSkiff', [-0.62, 0.14, 0.88]);
  const hull = kbox(skiff, p, [0, 0.08, 0], [0.96, 0.16, 0.32], teak);
  hull.rotation.y = 0.14;
  for (const s of [-1, 1]) {
    cone(skiff, p, [s * 0.56, 0.11, -s * 0.08], 0.14, 0.26, teak, 6, [0, 0.14, -s * Math.PI / 2]);
  }
  if (detail) {
    for (let x = -0.82; x <= 0.12; x += 0.19) cyl(b, p, [x, 1.18, 0.84], 0.018, 0.018, 0.34, bamboo, 6);
    kbox(b, p, [-0.36, 1.34, 0.84], [1.06, 0.04, 0.04], bamboo);
    if (p.hd) {
      for (let i = 0; i < 5; i++) {
        kbox(b, p, [0.46, 0.26 + i * 0.16, 0.99 - i * 0.05], [0.36, 0.032, 0.09], bamboo);
      }
    }
  }
  root.animations = [new T.AnimationClip('Prop shutter', 3.4, [swingTrack('VerandaShutter', 'x', 3.4, -52)])];
}

export const buildingsWorldB: readonly WorldBuilderSpec[] = [
  {
    id: 'english-tudor-tavern',
    riggedParts: [
      rot('TavernSign', 'Tavern sign', 'z', [-22, 22], 'Swings the hanging painted coaching-inn sign'),
      rot('OakDoor', 'Oak tavern door', 'y', [0, 80], 'Swings the heavy oak tavern entrance door open'),
    ],
    build: tudorTavern,
  },
  {
    id: 'miami-art-deco-cinema',
    riggedParts: [
      rot('MarqueeFin', 'Starburst fin', 'y', [0, 360], 'Spins the rooftop Art Deco starburst ornament'),
      rot('LobbyDoor', 'Lobby door', 'y', [0, 80], 'Swings the brushed-chrome cinema lobby door open'),
    ],
    build: artDecoCinema,
  },
  {
    id: 'turkish-domed-hammam',
    riggedParts: [rot('BathPortal', 'Bathhouse portal', 'y', [0, 80], 'Swings the copper-clad arched hammam portal open')],
    detachableParts: [det('CopperUrns', 'Copper urns', 'Twin hammered copper water urns flanking the portico')],
    build: turkishHammam,
  },
  {
    id: 'london-georgian-townhouse',
    riggedParts: [rot('PanelDoor', 'Panel door', 'y', [0, 82], 'Swings the Georgian front panel door open')],
    detachableParts: [det('IronLamp', 'Street lamp', 'Removable wrought-iron Georgian gas street lamp')],
    build: georgianTownhouse,
  },
  {
    id: 'thai-bamboo-stilt-house',
    riggedParts: [rot('VerandaShutter', 'Veranda shutter', 'x', [0, -55], 'Props the woven bamboo window shutter outward for breeze')],
    detachableParts: [det('RiverSkiff', 'River skiff', 'Removable wooden canal longtail skiff moored beneath the stilts')],
    build: thaiStiltHouse,
  },
];
