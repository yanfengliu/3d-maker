import * as T from 'three';
import { ring } from '../../parts';
import {
  det, glow, group, kboltring, kbox, kcone, kcyl, kdome, kdoor, kgable, khose, klathe,
  korb, kprism, kshell, kstrut, ktorus, kwin, matte, metal, rig, spinTrack, swingTrack,
} from './buildings-fantasy-scifi-kit';
import type { Finish, PackBuilderDef } from './buildings-fantasy-scifi-kit';

function buildAlchemistGuildhall(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'AlchemistGuildhall');
  const hd = p.hd;
  const stone = matte('#6c6a64', 0.9, 'CellarStone');
  const timber = matte('#4d3524', 0.86, 'GuildTimber');
  const slate = matte('#464e5a', 0.86, 'RoofSlate');
  const brass = metal('#c8983a', 0.4, 0.56, 'AlembicBrass');
  const elixir = glow('#54e8d2', '#20b8a8', 0.9, 'ElixirGlass');
  // Stone cellar foundation plinth at y = 0
  kshell(b, [0, 0.14, 0], [2.66, 0.28, 2.08], stone, hd, 0.12);
  // Half-timbered ground & cantilevered upper guild floors
  kshell(b, [0, 0.78, -0.02], [2.36, 1.06, 1.72], p.primary, hd, 0.08);
  kshell(b, [0, 1.54, 0], [2.52, 0.58, 1.88], p.primary, hd, 0.08);
  // Timber horizontal belt beams & corner framing posts (proud by 0.04 m)
  kbox(b, [0, 1.28, 0], [2.6, 0.1, 1.96], timber, hd);
  for (const sx of [-1.18, 0, 1.18]) {
    kbox(b, [sx, 0.78, 0.86], [0.1, 1.04, 0.08], timber, hd);
    kbox(b, [sx, 0.78, -0.9], [0.1, 1.04, 0.08], timber, hd);
  }
  for (const sx of [-1.26, 1.26]) {
    for (const sz of [-0.94, 0.94]) kbox(b, [sx, 1.54, sz], [0.12, 0.6, 0.12], timber, hd);
  }
  // Steep pitched Tudor gable roof with sloped shingle planes
  kgable(b, [0, 1.8, 0], 2.48, 0.92, 1.82, p.primary, hd);
  for (const sx of [-1, 1]) {
    const slope = kbox(b, [sx * 0.72, 2.22, 0], [1.66, 0.1, 2.1], slate, hd);
    slope.rotation.z = -sx * 0.64;
  }
  kbox(b, [0, 2.74, 0], [0.16, 0.1, 2.16], timber, hd);
  // Projecting front-left bay window
  kshell(b, [-0.62, 0.84, 0.98], [0.84, 0.78, 0.38], timber, hd, 0.22);
  kbox(b, [-0.62, 0.86, 1.18], [0.64, 0.54, 0.06], elixir, hd);
  kcone(b, [-0.62, 1.38, 0.98], 0.52, 0.34, slate, hd, 6);
  // Hinged GuildDoor (y) on front-right
  const door = kdoor(b, 'GuildDoor', [0.58, 0.28, 0.85], 0.5, 0.88, timber, stone, p, 1);
  for (const y of [0.24, 0.62]) kbox(door, [-0.25, y, 0.032], [0.44, 0.055, 0.036], brass, hd);
  // Giant rooftop glass alembic retort in brick-and-brass cradle
  kcyl(b, [0.18, 2.66, 0.04], 0.36, 0.42, 0.42, stone, hd, 10);
  kcyl(b, [0.18, 2.86, 0.04], 0.4, 0.38, 0.09, brass, hd, 12);
  korb(b, [0.18, 3.16, 0.04], 0.38, p.accent, hd, 12, 8);
  ktorus(b, [0.18, 3.16, 0.04], 0.39, 0.034, brass, hd).rotation.x = Math.PI / 2;
  // Curved alembic condenser neck & coiled brass condenser pipe to side vat
  khose(
    b,
    [[0.44, 3.38, 0.04], [0.86, 3.44, -0.08], [1.14, 2.82, -0.26], [1.22, 1.88, -0.44], [1.12, 1.14, -0.44]],
    0.044,
    brass,
    hd,
    14,
    7,
  );
  kcyl(b, [1.18, 0.72, -0.44], 0.28, 0.32, 0.88, brass, hd, 10);
  kcyl(b, [1.18, 1.18, -0.44], 0.3, 0.28, 0.09, p.accent, hd, 10);
  // Spinning AlembicStirrer (y) mounted through top brass alembic collar
  kcyl(b, [0.18, 3.54, 0.04], 0.13, 0.15, 0.14, brass, hd, 10);
  const stirrer = group(b, 'AlembicStirrer', [0.18, 3.6, 0.04]);
  kcyl(stirrer, [0, -0.22, 0], 0.026, 0.026, 0.62, brass, hd, 8);
  kbox(stirrer, [0, 0.1, 0], [0.42, 0.055, 0.055], brass, hd);
  for (const sx of [-0.18, 0.18]) kcyl(stirrer, [sx, 0.18, 0], 0.04, 0.04, 0.14, p.accent, hd, 8);
  if (detail) {
    for (const sx of [-0.62, 0.62]) kwin(b, [sx, 1.54, 0.94], 0.36, 0.34, timber, elixir, stone, hd, true, 0);
    kwin(b, [0, 1.54, -0.94], 0.44, 0.36, timber, elixir, stone, hd, true, Math.PI);
    kwin(b, [-1.18, 0.82, 0], 0.38, 0.42, timber, elixir, stone, hd, true, -Math.PI / 2);
    // Diagonal half-timber cross-braces on back
    for (const sx of [-0.64, 0.64]) kstrut(b, [sx - 0.34, 0.34, -0.9], [sx + 0.34, 1.22, -0.9], 0.036, timber, hd, 6);
    if (hd) {
      kboltring(b, 0.18, 2.91, 0.04, 0.36, 8, brass, true);
      khose(b, [[1.02, 0.84, -0.68], [0.68, 0.72, -0.94], [0.22, 0.78, -0.84]], 0.03, brass, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Stir alembic', 4.2, [spinTrack('AlembicStirrer', 'y', 4.2)]),
    new T.AnimationClip('Open guild door', 3.2, [swingTrack('GuildDoor', 'y', 3.2, 80)]),
  ];
}

function buildDragonRoostTower(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'DragonRoost');
  const hd = p.hd;
  const crag = matte('#2a2832', 0.88, 'ObsidianCrag');
  const iron = metal('#434750', 0.48, 0.52, 'WroughtIron');
  const blaze = glow('#ff7a22', '#ff4408', 1.2, 'DragonFire');
  // Jagged obsidian rock-crag base plinth at y = 0
  kcyl(b, [0, 0.14, 0], 1.24, 1.38, 0.28, crag, hd, 8);
  // Angular climbing obsidian cliff buttresses
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.22;
    const h = i % 2 === 0 ? 1.56 : 1.18;
    const fin = kprism(
      b,
      [Math.sin(a) * 0.88, 0.08, Math.cos(a) * 0.88],
      [[-0.24, 0], [0.24, 0], [0.1, h], [-0.16, h * 0.84]],
      0.34,
      crag,
      hd,
    );
    fin.rotation.y = a;
  }
  // Tapering octagonal volcanic obsidian keep shaft
  kcyl(b, [0, 1.36, 0], 0.68, 0.92, 2.28, p.primary, hd, 8);
  // Heavy entry bastion & hinged TowerGate (y)
  kshell(b, [0, 0.64, 0.84], [0.96, 1.06, 0.52], crag, hd, 0.18);
  const gate = kdoor(b, 'TowerGate', [0, 0.24, 1.09], 0.5, 0.82, iron, crag, p, 1);
  for (const y of [0.22, 0.56]) kbox(gate, [-0.25, y, 0.035], [0.44, 0.06, 0.038], p.accent, hd);
  // Dramatic flared crenellated dragon-roost aerie platform
  kcyl(b, [0, 2.52, 0], 1.32, 0.72, 0.44, crag, hd, 8);
  kcyl(b, [0, 2.78, 0], 1.36, 1.32, 0.14, p.primary, hd, 8);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const sx = Math.sin(a);
    const sz = Math.cos(a);
    // Corbelled stone ribs under aerie
    kstrut(b, [sx * 0.68, 2.1, sz * 0.68], [sx * 1.24, 2.68, sz * 1.24], 0.065, iron, hd, 6);
    // Jagged parapet fangs
    const fang = kcone(b, [sx * 1.22, 3.04, sz * 1.22], 0.16, 0.42, crag, hd, 5);
    fang.rotation.y = a;
  }
  // Perimeter iron fire-beacons on alternate corners
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const bx = Math.sin(a) * 1.08;
    const bz = Math.cos(a) * 1.08;
    kcyl(b, [bx, 2.98, bz], 0.07, 0.1, 0.28, iron, hd, 8);
    kcyl(b, [bx, 3.16, bz], 0.16, 0.08, 0.14, iron, hd, 8);
    kcone(b, [bx, 3.36, bz], 0.12, 0.28, p.accent, hd, 6);
  }
  // Central rotating FlameBeacon (y) atop aerie dais
  kcyl(b, [0, 2.96, 0], 0.38, 0.46, 0.26, iron, hd, 8);
  const beacon = group(b, 'FlameBeacon', [0, 3.1, 0]);
  kcyl(beacon, [0, 0.08, 0], 0.32, 0.26, 0.16, iron, hd, 8);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    kstrut(beacon, [Math.sin(a) * 0.26, 0.12, Math.cos(a) * 0.26], [Math.sin(a) * 0.18, 0.64, Math.cos(a) * 0.18], 0.032, iron, hd, 6);
  }
  ktorus(beacon, [0, 0.42, 0], 0.25, 0.032, iron, hd).rotation.x = Math.PI / 2;
  kcone(beacon, [0, 0.42, 0], 0.2, 0.56, p.accent, hd, 8);
  kcone(beacon, [0, 0.36, 0], 0.12, 0.36, blaze, hd, 6);
  if (detail) {
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const w = group(b, '', [Math.sin(a) * 0.78, 1.72, Math.cos(a) * 0.78]);
      w.rotation.y = a;
      kbox(w, [0, 0, 0], [0.22, 0.54, 0.1], crag, hd);
      kbox(w, [0, 0, 0.04], [0.11, 0.42, 0.06], blaze, hd);
    }
    if (hd) {
      kboltring(b, 0, 2.86, 0, 1.18, 12, iron, true);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        kcone(beacon, [Math.sin(a) * 0.28, 0.7, Math.cos(a) * 0.28], 0.04, 0.14, p.accent, true, 6);
      }
    }
  }
  root.animations = [
    new T.AnimationClip('Spin flame beacon', 4.6, [spinTrack('FlameBeacon', 'y', 4.6)]),
    new T.AnimationClip('Open tower gate', 3.2, [swingTrack('TowerGate', 'y', 3.2, 82)]),
  ];
}

function buildFairyMushroomHouse(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'MushroomHouse');
  const hd = p.hd;
  const moss = matte('#537d44', 0.88, 'WoodlandMoss');
  const wood = matte('#7a4e2d', 0.86, 'AcornWood');
  const acornCap = matte('#5a3922', 0.86, 'AcornCap');
  const warmWin = glow('#ffe07a', '#f5b030', 0.9, 'CozyGlow');
  // Mossy woodland mound plinth at y = 0
  kdome(b, [0, 0, 0], 1.34, 0.26, moss, hd, 14);
  // Stout bulbous cream mushroom-stalk dwelling (p.accent)
  const stalkPts: readonly (readonly [number, number])[] = [
    [0, 0.08], [0.84, 0.08], [0.88, 0.48], [0.76, 1.04], [0.64, 1.54], [0.72, 1.8], [0, 1.8],
  ];
  klathe(b, [0, 0, 0], stalkPts, p.accent, hd, 14);
  // Underside cream gill collar & oversized spotted crimson toadstool dome roof (p.primary)
  kcyl(b, [0, 1.72, 0], 1.14, 0.68, 0.24, p.accent, hd, 14);
  kdome(b, [0, 1.78, 0], 1.24, 1.02, p.primary, hd, 16);
  // Raised ivory toadstool spots embedded cleanly into cap dome
  const spotAngles: readonly (readonly [number, number, number])[] = [
    [0.2, 0.56, 0.16], [1.25, 0.48, 0.15], [2.35, 0.54, 0.17], [3.5, 0.5, 0.15],
    [4.65, 0.58, 0.16], [5.65, 0.46, 0.14], [0.75, 0.86, 0.13], [2.95, 0.84, 0.14], [4.95, 0.86, 0.13],
  ];
  for (const [az, el, sr] of spotAngles) {
    const r = Math.cos(el) * 1.18;
    const y = 1.78 + Math.sin(el) * 0.98;
    korb(b, [Math.sin(az) * r, y, Math.cos(az) * r], sr, p.accent, hd, 8, 6);
  }
  // Cute sculpted acorn chimney poking through cap
  const chim = group(b, 'AcornChimney', [0.58, 2.38, -0.34]);
  chim.rotation.z = -0.26;
  kcyl(chim, [0, 0.14, 0], 0.17, 0.15, 0.48, wood, hd, 10);
  kdome(chim, [0, 0.36, 0], 0.23, 0.16, acornCap, hd, 10);
  kcyl(chim, [0, 0.54, 0], 0.04, 0.05, 0.12, acornCap, hd, 8);
  // Arched round wooden doorway & hinged RoundDoor (y)
  kcyl(b, [0, 0.62, 0.78], 0.36, 0.36, 0.22, wood, hd, 12).rotation.x = Math.PI / 2;
  kcyl(b, [0, 0.62, 0.83], 0.28, 0.28, 0.18, p.inset, hd, 12).rotation.x = Math.PI / 2;
  const rdoor = group(b, 'RoundDoor', [0.27, 0.62, 0.91]);
  kcyl(rdoor, [-0.27, 0, 0], 0.27, 0.27, 0.06, wood, hd, 12).rotation.x = Math.PI / 2;
  kcyl(rdoor, [-0.42, 0, 0.04], 0.032, 0.032, 0.04, p.alloy, hd, 8).rotation.x = Math.PI / 2;
  kbox(rdoor, [-0.27, 0.08, 0.03], [0.36, 0.045, 0.036], acornCap, hd);
  // Detachable SideToadstools growing out of the mossy plinth
  const cluster = group(b, 'SideToadstools');
  const minis: readonly (readonly [number, number, number, number])[] = [
    [-0.98, 0.52, 0.42, 0.24],
    [-0.78, 0.86, 0.28, 0.16],
    [0.98, 0.46, 0.34, 0.2],
  ];
  for (const [mx, mz, h, capR] of minis) {
    kcyl(cluster, [mx, 0.1 + h * 0.5, mz], capR * 0.36, capR * 0.48, h, p.accent, hd, 8);
    kdome(cluster, [mx, 0.08 + h, mz], capR, capR * 0.78, p.primary, hd, 10);
  }
  if (detail) {
    for (const a of [Math.PI / 2, -Math.PI / 2, Math.PI]) {
      const pw = group(b, '', [Math.sin(a) * 0.79, 0.94, Math.cos(a) * 0.79]);
      pw.rotation.y = a;
      ktorus(pw, [0, 0, 0.04], 0.19, 0.042, wood, hd);
      kcyl(pw, [0, 0, 0.03], 0.16, 0.16, 0.05, warmWin, hd, 10).rotation.x = Math.PI / 2;
    }
    for (const z of [1.02, 1.18]) kcyl(b, [0, 0.12, z], 0.18, 0.2, 0.08, p.edge, hd, 8);
    if (hd) {
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        kstrut(b, [Math.sin(a) * 0.66, 1.66, Math.cos(a) * 0.66], [Math.sin(a) * 1.14, 1.8, Math.cos(a) * 1.14], 0.022, p.stencil, true, 6);
      }
      korb(cluster, [-0.98, 0.66, 0.54], 0.055, p.accent, true, 6, 5);
    }
  }
  root.animations = [
    new T.AnimationClip('Open round door', 3.2, [swingTrack('RoundDoor', 'y', 3.2, 82)]),
  ];
}

function buildGroundedRuneSanctum(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'RuneSanctum');
  const hd = p.hd;
  const darkStone = matte('#454a57', 0.88, 'RunicSlate');
  const gold = metal('#cba44d', 0.4, 0.56, 'SanctumGold');
  const crystal = glow('#5ce4ff', '#1ea8e8', 1.0, 'RuneCrystal');
  // 3-tier stepped carved stone plinth at y = 0
  kcyl(b, [0, 0.09, 0], 1.38, 1.46, 0.18, darkStone, hd, 8);
  kcyl(b, [0, 0.24, 0], 1.16, 1.24, 0.16, p.primary, hd, 8);
  kcyl(b, [0, 0.38, 0], 0.94, 1.02, 0.14, darkStone, hd, 8);
  // 4 cardinal ceremonial stair ramps
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const st = kbox(b, [Math.sin(a) * 1.16, 0.2, Math.cos(a) * 1.16], [0.46, 0.28, 0.42], p.primary, hd);
    st.rotation.y = a;
  }
  // Central physical grounded stone-and-gold conduit column connecting plinth -> sanctum chamber
  kcyl(b, [0, 1.12, 0], 0.28, 0.38, 1.44, darkStone, hd, 8);
  kcyl(b, [0, 1.22, 0], 0.32, 0.32, 0.22, gold, hd, 8);
  // Faceted crystalline sanctum chamber (bipyramid crystal + stone structural ribs)
  kcone(b, [0, 2.28, 0], 0.64, 0.88, p.accent, hd, 8);
  kcone(b, [0, 1.46, 0], 0.64, 0.82, p.accent, hd, 8).rotation.x = Math.PI;
  kcyl(b, [0, 1.86, 0], 0.66, 0.66, 0.22, darkStone, hd, 8);
  // 4 monumental angled energy-conduit obelisk struts PHYSICALLY CONNECTING plinth to sanctum!
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const s = Math.sin(a);
    const c = Math.cos(a);
    // Corner obelisk pedestal anchored into plinth
    kcyl(b, [s * 1.08, 0.56, c * 1.08], 0.18, 0.24, 0.82, p.primary, hd, 6);
    // Main heavy angled stone strut physically penetrating pedestal AND sanctum crystal chamber
    kstrut(b, [s * 1.08, 0.72, c * 1.08], [s * 0.42, 1.98, c * 0.42], 0.13, p.primary, hd, 6);
    // Secondary lower brace strut to central column
    kstrut(b, [s * 1.04, 0.66, c * 1.04], [s * 0.24, 1.16, c * 0.24], 0.065, gold, hd, 6);
    // Glowing rune energy conduit strip embedded along the obelisk strut
    kstrut(b, [s * 1.18, 0.86, c * 1.18], [s * 0.54, 2.02, c * 0.54], 0.04, crystal, hd, 8);
    // Upper stone crown rib reaching from obelisk elbow to upper collar
    kstrut(b, [s * 0.56, 1.92, c * 0.56], [s * 0.22, 2.66, c * 0.22], 0.07, darkStone, hd, 6);
  }
  // Rotating RuneRing (y) mounted via hollow collar encircling the central core (zero solid-in-solid overlap).
  const runeRing = group(b, 'RuneRing', [0, 1.86, 0]);
  ring(runeRing, [0, 0, 0], 0.68, 0.09, 0.08, gold);
  ktorus(runeRing, [0, 0, 0], 0.96, 0.056, p.accent, hd).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    kstrut(runeRing, [Math.sin(a) * 0.62, 0, Math.cos(a) * 0.62], [Math.sin(a) * 0.96, 0, Math.cos(a) * 0.96], 0.036, gold, hd, 6);
    kbox(runeRing, [Math.sin(a) * 0.96, 0, Math.cos(a) * 0.96], [0.14, 0.22, 0.14], crystal, hd);
  }
  // Top twin-fork stone crown gimbal & tilting SanctumFocus (x) (ZERO floating!)
  kcyl(b, [0, 2.74, 0], 0.28, 0.34, 0.24, darkStone, hd, 8);
  for (const sx of [-0.26, 0.26]) kbox(b, [sx, 3.04, 0], [0.1, 0.52, 0.14], gold, hd);
  const focus = group(b, 'SanctumFocus', [0, 3.16, 0]);
  kcyl(focus, [0, 0, 0], 0.04, 0.04, 0.58, gold, hd, 8).rotation.z = Math.PI / 2;
  ktorus(focus, [0, 0, 0], 0.22, 0.032, gold, hd);
  kcone(focus, [0, 0.16, 0], 0.14, 0.3, crystal, hd, 6);
  kcone(focus, [0, -0.16, 0], 0.14, 0.3, crystal, hd, 6).rotation.x = Math.PI;
  if (detail) {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      kcyl(b, [Math.sin(a) * 1.12, 1.0, Math.cos(a) * 1.12], 0.12, 0.08, 0.12, crystal, hd, 6);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      kbox(runeRing, [Math.sin(a) * 0.96, 0.08, Math.cos(a) * 0.96], [0.06, 0.06, 0.06], gold, hd);
    }
    if (hd) {
      kboltring(b, 0, 0.46, 0, 0.88, 12, gold, true);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        khose(
          b,
          [
            [Math.sin(a) * 0.92, 0.44, Math.cos(a) * 0.92],
            [Math.sin(a) * 0.64, 0.78, Math.cos(a) * 0.64],
            [Math.sin(a) * 0.3, 1.08, Math.cos(a) * 0.3],
          ],
          0.028,
          gold,
          true,
        );
      }
    }
  }
  root.animations = [
    new T.AnimationClip('Channel sanctum', 4.8, [
      spinTrack('RuneRing', 'y', 4.8),
      swingTrack('SanctumFocus', 'x', 4.8, 28, true),
    ]),
  ];
}

function buildDesertBazaarCaravanserai(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'Caravanserai');
  const hd = p.hd;
  const sand = matte('#d8bc8e', 0.9, 'DesertSand');
  const plaster = matte('#ede2cd', 0.88, 'WhiteDome');
  const cedar = matte('#634129', 0.86, 'CedarWood');
  const brass = metal('#c89a3c', 0.42, 0.52, 'OasisBrass');
  const spiceGold = matte('#e0a626', 0.88, 'Saffron');
  // Continuous desert sandstone courtyard plinth at y = 0
  kshell(b, [0, 0.09, 0], [3.3, 0.18, 2.48], sand, hd, 0.14);
  // Main fortified sandstone trading post body
  kshell(b, [0, 0.84, -0.1], [2.72, 1.38, 1.66], p.primary, hd, 0.1);
  // Central arched portal iwan rising higher above facade
  kshell(b, [0, 1.12, 0.62], [1.12, 1.76, 0.54], p.primary, hd, 0.1);
  kbox(b, [0, 2.02, 0.62], [1.22, 0.12, 0.62], p.accent, hd);
  // Hinged CaravanGate (y)
  const gate = kdoor(b, 'CaravanGate', [0, 0.2, 0.89], 0.66, 1.02, cedar, p.accent, p, 1);
  for (const y of [0.24, 0.52, 0.8]) kbox(gate, [-0.33, y, 0.032], [0.58, 0.06, 0.038], brass, hd);
  // Twin front corner cylindrical watch-turrets with domed cupolas
  for (const sx of [-1, 1]) {
    kcyl(b, [sx * 1.24, 1.08, 0.56], 0.36, 0.42, 1.88, p.primary, hd, 12);
    kcyl(b, [sx * 1.24, 2.04, 0.56], 0.4, 0.38, 0.1, p.accent, hd, 12);
    kdome(b, [sx * 1.24, 2.08, 0.56], 0.37, 0.48, plaster, hd, 12);
    kcone(b, [sx * 1.24, 2.66, 0.56], 0.045, 0.22, brass, hd, 8);
    // Striped side market canopies flanking the walls
    const awning = group(b, '', [sx * 1.44, 1.22, -0.16]);
    awning.rotation.z = -sx * 0.34;
    for (let i = 0; i < 4; i++) {
      kbox(awning, [sx * 0.14, 0, -0.45 + i * 0.3], [0.46, 0.06, 0.28], i % 2 === 0 ? p.accent : plaster, hd);
    }
    kstrut(b, [sx * 1.54, 0.14, -0.58], [sx * 1.54, 1.14, -0.58], 0.032, cedar, hd, 6);
    kstrut(b, [sx * 1.54, 0.14, 0.26], [sx * 1.54, 1.14, 0.26], 0.032, cedar, hd, 6);
  }
  // Rear desert windcatcher tower (badgir) & stepped battlements
  kshell(b, [0, 1.96, -0.64], [0.88, 1.02, 0.62], p.primary, hd, 0.1);
  for (const x of [-0.26, 0, 0.26]) kbox(b, [x, 2.02, -0.96], [0.14, 0.64, 0.08], p.inset, hd);
  for (const x of [-0.88, -0.44, 0.44, 0.88]) kbox(b, [x, 1.62, -0.9], [0.24, 0.2, 0.14], p.primary, hd);
  // Detachable SpiceStalls seated on front courtyard plinth
  const stalls = group(b, 'SpiceStalls');
  for (const sx of [-1, 1]) {
    const x = sx * 0.88;
    const z = 0.98;
    kbox(stalls, [x, 0.34, z], [0.66, 0.34, 0.38], cedar, hd);
    const roof = kbox(stalls, [x, 0.96, z], [0.74, 0.06, 0.48], p.accent, hd);
    roof.rotation.x = 0.24;
    for (const dx of [-0.28, 0.28]) kstrut(stalls, [x + dx, 0.14, z + 0.14], [x + dx, 0.94, z + 0.14], 0.026, cedar, hd, 6);
    for (const dx of [-0.18, 0, 0.18]) {
      kcyl(stalls, [x + dx, 0.55, z], 0.08, 0.06, 0.08, cedar, hd, 8);
      kcone(stalls, [x + dx, 0.63, z], 0.072, 0.1, dx === 0 ? p.accent : spiceGold, hd, 8);
    }
  }
  if (detail) {
    for (const sx of [-0.86, 0.86]) kwin(b, [sx, 1.12, -0.94], 0.34, 0.42, cedar, p.inset, sand, hd, true, Math.PI);
    for (const sx of [-1, 1]) {
      for (const z of [-0.46, 0.16]) kbox(b, [sx * 1.4, 1.38, z], [0.16, 0.06, 0.06], cedar, hd);
    }
    if (hd) {
      for (const sx of [-1, 1]) kboltring(b, sx * 1.24, 2.1, 0.56, 0.38, 8, brass, true);
      for (const sx of [-0.42, 0.42]) kcyl(b, [sx, 1.62, 0.94], 0.06, 0.07, 0.16, brass, true, 8);
    }
  }
  root.animations = [
    new T.AnimationClip('Open caravan gate', 3.4, [swingTrack('CaravanGate', 'y', 3.4, 82)]),
  ];
}

export const buildingsFantasyScifiB: readonly PackBuilderDef[] = [
  {
    id: 'alchemist-guildhall',
    riggedParts: [
      rig('AlembicStirrer', 'Alembic stirrer', 'rotate', 'y', [0, 360], 'Spins the rooftop alembic condenser stirrer spindle'),
      rig('GuildDoor', 'Guild door', 'rotate', 'y', [0, 80], 'Swings the oak alchemist guildhall door open'),
    ],
    detachableParts: [],
    build: buildAlchemistGuildhall,
  },
  {
    id: 'dragon-roost-tower',
    riggedParts: [
      rig('FlameBeacon', 'Flame beacon', 'rotate', 'y', [0, 360], 'Rotates the blazing iron summit dragon-roost beacon'),
      rig('TowerGate', 'Tower gate', 'rotate', 'y', [0, 82], 'Swings the spiked obsidian bastion entrance gate open'),
    ],
    detachableParts: [],
    build: buildDragonRoostTower,
  },
  {
    id: 'fairy-mushroom-house',
    riggedParts: [rig('RoundDoor', 'Round door', 'rotate', 'y', [0, 82], 'Swings the arched circular wooden mushroom cottage door')],
    detachableParts: [det('SideToadstools', 'Side toadstools', 'Cluster of three smaller fairy toadstools flanking the mound')],
    build: buildFairyMushroomHouse,
  },
  {
    id: 'grounded-rune-sanctum',
    riggedParts: [
      rig('RuneRing', 'Rune ring', 'rotate', 'y', [0, 360], 'Rotates the spoked arcane rune ring around the sanctum core'),
      rig('SanctumFocus', 'Sanctum focus', 'rotate', 'x', [-28, 28], 'Tilts the gimbal-mounted top crystal focus prism'),
    ],
    detachableParts: [],
    build: buildGroundedRuneSanctum,
  },
  {
    id: 'desert-bazaar-caravanserai',
    riggedParts: [rig('CaravanGate', 'Caravan gate', 'rotate', 'y', [0, 82], 'Swings the studded cedar caravanserai portal gate open')],
    detachableParts: [det('SpiceStalls', 'Spice stalls', 'Twin shaded desert spice merchant stalls outside the gate')],
    build: buildDesertBazaarCaravanserai,
  },
];
