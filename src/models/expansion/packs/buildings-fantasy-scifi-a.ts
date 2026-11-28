import * as T from 'three';
import {
  deg, det, glass, glow, group, kboltring, kbox, kcone, kcyl, kdome, kdoor, kgear, khose, kprism,
  kshell, kstrut, ktorus, kwin, matte, metal, rig, slideTrack, spinTrack, swingTrack,
} from './buildings-fantasy-scifi-kit';
import type { Finish, PackBuilderDef, Point } from './buildings-fantasy-scifi-kit';

function buildDwarvenForgeGatehouse(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'ForgeGatehouse');
  const hd = p.hd;
  const basalt = matte('#3c3a39', 0.88, 'Basalt');
  const bronze = metal('#b87932', 0.42, 0.56, 'Bronze');
  const ember = glow('#f57422', '#ff5410', 1.1, 'Ember');
  // Continuous stepped basalt foundation plinth at y = 0
  kshell(b, [0, 0.1, 0], [3.3, 0.2, 2.24], basalt, hd, 0.14);
  kshell(b, [0, 0.24, -0.04], [2.98, 0.14, 1.9], p.dark, hd, 0.12);
  // Broad angular trapezoid mountain bastion body
  kprism(b, [0, 0.16, -0.14], [[-1.42, 0], [1.42, 0], [1.08, 2.26], [-1.08, 2.26]], 1.48, p.primary, hd);
  // Twin angular inward-leaning runic pylons flanking the portal
  for (const sx of [-1, 1]) {
    kprism(
      b,
      [sx * 0.94, 0.18, 0.2],
      [[-0.44, 0], [0.44, 0], [0.3, 2.52], [-0.3, 2.52]],
      0.92,
      basalt,
      hd,
    );
    kbox(b, [sx * 0.94, 2.74, 0.2], [0.72, 0.16, 1.04], p.edge, hd);
    // Glowing smelter vents on front and outer flanks
    kbox(b, [sx * 0.94, 1.66, 0.69], [0.32, 0.62, 0.08], p.inset, hd);
    kbox(b, [sx * 0.94, 1.66, 0.72], [0.2, 0.48, 0.06], ember, hd);
    kbox(b, [sx * 1.32, 1.12, -0.14], [0.1, 0.54, 0.48], p.inset, hd);
    kbox(b, [sx * 1.35, 1.12, -0.14], [0.06, 0.4, 0.34], ember, hd);
    // Rear twin smelter chimney stacks
    kprism(b, [sx * 0.64, 1.88, -0.68], [[-0.24, 0], [0.24, 0], [0.18, 1.24], [-0.18, 1.24]], 0.44, basalt, hd);
    kbox(b, [sx * 0.64, 3.12, -0.68], [0.46, 0.12, 0.52], p.accent, hd);
    kbox(b, [sx * 0.64, 3.2, -0.68], [0.24, 0.08, 0.26], ember, hd);
  }
  // Stepped dwarven lintel pediment & sculpted bronze hammer crest
  kprism(b, [0, 2.04, 0.28], [[-1.16, 0], [1.16, 0], [0.84, 0.58], [-0.84, 0.58]], 0.92, p.edge, hd);
  kbox(b, [0, 2.28, 0.77], [0.14, 0.56, 0.08], bronze, hd);
  kbox(b, [0, 2.48, 0.79], [0.48, 0.24, 0.12], p.accent, hd);
  kbox(b, [0, 2.48, 0.84], [0.26, 0.12, 0.08], bronze, hd);
  // Deep recessed portal tunnel & rear kiln vault
  kbox(b, [0, 1.06, 0.12], [1.04, 1.54, 0.98], p.inset, hd);
  kbox(b, [0, 1.02, -0.92], [1.12, 1.36, 0.18], basalt, hd);
  kbox(b, [0, 1.02, -0.98], [0.74, 0.96, 0.1], ember, hd);
  // Sliding RunicGate (y)
  const gateRest: Point = [0, 0.98, 0.54];
  const gate = group(b, 'RunicGate', gateRest);
  kbox(gate, [0, 0, 0], [0.98, 1.46, 0.12], p.primary, hd);
  for (const y of [-0.46, 0, 0.46]) kbox(gate, [0, y, 0.04], [0.92, 0.1, 0.08], bronze, hd);
  for (const sx of [-0.26, 0.26]) kbox(gate, [sx, 0, 0.055], [0.12, 1.18, 0.07], p.accent, hd);
  kbox(gate, [0, 0.14, 0.075], [0.36, 0.36, 0.06], ember, hd);
  // Detachable ForgeBraziers flanking the forecourt
  const braziers = group(b, 'ForgeBraziers');
  for (const sx of [-1, 1]) {
    const bx = sx * 1.18;
    const bz = 0.86;
    kprism(braziers, [bx, 0.06, bz], [[-0.22, 0], [0.22, 0], [0.16, 0.56], [-0.16, 0.56]], 0.38, basalt, hd);
    kcyl(braziers, [bx, 0.72, bz], 0.27, 0.18, 0.24, bronze, hd, 8);
    kcone(braziers, [bx, 0.98, bz], 0.18, 0.34, ember, hd, 8);
    kcone(braziers, [bx, 0.94, bz], 0.1, 0.22, p.accent, hd, 6);
  }
  if (detail) {
    for (const sx of [-1, 1]) {
      for (const y of [0.64, 1.02, 2.2]) kbox(b, [sx * 0.94, y, 0.68], [0.46, 0.08, 0.07], p.accent, hd);
      for (const y of [1.46, 1.66, 1.86]) kbox(b, [sx * 0.94, y, 0.75], [0.34, 0.042, 0.04], p.dark, hd);
      if (hd) {
        khose(b, [[sx * 0.64, 2.5, -0.52], [sx * 0.88, 2.28, -0.32], [sx * 0.94, 1.98, -0.14]], 0.042, bronze, true);
        kboltring(b, sx * 0.94, 2.83, 0.2, 0.24, 6, bronze, true);
      }
    }
    for (const x of [-0.36, 0, 0.36]) kbox(b, [x, 1.02, -1.03], [0.06, 0.92, 0.05], p.dark, hd);
  }
  root.animations = [
    new T.AnimationClip('Raise runic gate', 3.6, [slideTrack('RunicGate', 'y', gateRest, 3.6, 0.95)]),
  ];
}

function buildElvenCanopyPavilion(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'CanopyPavilion');
  const hd = p.hd;
  const moss = matte('#4d7343', 0.88, 'Moss');
  const gold = metal('#d4b158', 0.38, 0.54, 'StarGold');
  const star = glow('#8ef0ff', '#42d4f5', 1.0, 'Starlight');
  // Layered organic circular stone-and-moss plinth at y = 0
  kcyl(b, [0, 0.08, 0], 1.38, 1.46, 0.16, moss, hd, 14);
  kcyl(b, [0, 0.2, 0], 1.18, 1.24, 0.14, p.primary, hd, 14);
  // Central marble astrolabe pedestal & physical top crown tie-rod
  kcyl(b, [0, 0.56, 0], 0.26, 0.38, 0.62, p.primary, hd, 12);
  kcyl(b, [0, 0.92, 0], 0.34, 0.28, 0.12, gold, hd, 12);
  kcyl(b, [0, 1.54, 0], 0.048, 0.056, 1.32, gold, hd, 10);
  // 6 sweeping curved silverwood tree-trunk arches cradling the leaf dome
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    const s = Math.sin(a);
    const c = Math.cos(a);
    khose(
      b,
      [
        [s * 1.12, 0.16, c * 1.12],
        [s * 1.26, 0.92, c * 1.26],
        [s * 1.06, 1.78, c * 1.06],
        [s * 0.52, 2.38, c * 0.52],
        [s * 0.18, 2.74, c * 0.18],
      ],
      0.085,
      p.primary,
      hd,
      12,
      7,
    );
    // Flared tree root buttress anchored cleanly into the terrace
    kstrut(b, [s * 1.3, 0.16, c * 1.3], [s * 1.15, 0.58, c * 1.15], 0.068, p.primary, hd, 8);
    // Sculpted overhanging canopy leaf petals
    const leaf = kcyl(b, [s * 0.92, 2.16, c * 0.92], 0.04, 0.36, 0.62, p.accent, hd, 8);
    leaf.rotation.set(0, a, 0);
    leaf.rotateX(0.95);
  }
  // Curved balustrade rails around rear and sides (leaving front +Z open)
  for (let i = 1; i <= 5; i++) {
    const a0 = (i * Math.PI) / 3 - Math.PI / 6;
    const a1 = ((i + 1) * Math.PI) / 3 - Math.PI / 6;
    const mid = (a0 + a1) * 0.5;
    if (Math.cos(mid) > 0.6) continue;
    kstrut(
      b,
      [Math.sin(a0) * 1.14, 0.66, Math.cos(a0) * 1.14],
      [Math.sin(a1) * 1.14, 0.66, Math.cos(a1) * 1.14],
      0.036,
      gold,
      hd,
      8,
    );
  }
  // Leaf-domed canopy roof & celestial spire finial
  kdome(b, [0, 2.08, 0], 1.16, 0.88, p.accent, hd, 14);
  kcyl(b, [0, 2.06, 0], 1.12, 1.04, 0.14, p.primary, hd, 14);
  kcone(b, [0, 3.14, 0], 0.24, 0.52, gold, hd, 10);
  // Rotating StarOrrery (y) physically mounted on the central shaft
  const orrery = group(b, 'StarOrrery', [0, 1.46, 0]);
  kcyl(orrery, [0, 0, 0], 0.09, 0.09, 0.22, gold, hd, 10);
  const r1 = ktorus(orrery, [0, 0, 0], 0.42, 0.032, gold, hd);
  r1.rotation.set(0.55, 0.3, 0);
  const r2 = ktorus(orrery, [0, 0, 0], 0.33, 0.026, p.accent, hd);
  r2.rotation.set(-0.62, 1.1, 0.35);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    kstrut(orrery, [0, 0, 0], [Math.sin(a) * 0.38, 0, Math.cos(a) * 0.38], 0.02, gold, hd, 6);
  }
  kcone(orrery, [0, 0.14, 0], 0.12, 0.24, star, hd, 6);
  kcone(orrery, [0, -0.14, 0], 0.12, 0.24, star, hd, 6).rotation.x = Math.PI;
  // Detachable CrystalLamps on plinth perimeter
  const lamps = group(b, 'CrystalLamps');
  for (const a of [0.55, -0.55, 2.55, -2.55]) {
    const lx = Math.sin(a) * 1.24;
    const lz = Math.cos(a) * 1.24;
    kcyl(lamps, [lx, 0.5, lz], 0.04, 0.06, 0.72, p.primary, hd, 8);
    kcyl(lamps, [lx, 0.88, lz], 0.1, 0.07, 0.08, gold, hd, 8);
    kcone(lamps, [lx, 1.04, lz], 0.08, 0.24, star, hd, 6);
  }
  if (detail) {
    ktorus(b, [0, 2.1, 0], 1.14, 0.04, gold, hd).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      kstrut(b, [Math.sin(a) * 0.62, 2.86, Math.cos(a) * 0.62], [0, 3.24, 0], 0.025, gold, hd, 6);
    }
    if (hd) {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + Math.PI / 6;
        khose(
          b,
          [
            [Math.sin(a - 0.15) * 1.14, 0.4, Math.cos(a - 0.15) * 1.14],
            [Math.sin(a + 0.12) * 1.22, 1.18, Math.cos(a + 0.12) * 1.22],
            [Math.sin(a - 0.1) * 1.02, 1.9, Math.cos(a - 0.1) * 1.02],
          ],
          0.022,
          moss,
          true,
        );
      }
      kboltring(b, 0, 0.28, 0, 1.06, 12, gold, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Orbit orrery', 5.2, [spinTrack('StarOrrery', 'y', 5.2)]),
  ];
}

function buildMossyStoneKeep(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'StoneKeep');
  const hd = p.hd;
  const slate = matte('#454c54', 0.86, 'Slate');
  const oak = matte('#5e422b', 0.86, 'Oak');
  const stoneDk = matte('#5c5e56', 0.88, 'DarkStone');
  // Continuous battered Norman plinth at y = 0
  kprism(b, [0, 0, 0], [[-1.24, 0], [1.24, 0], [1.04, 0.44], [-1.04, 0.44]], 2.28, stoneDk, hd);
  // Main square Norman stone donjon body
  kshell(b, [0, 1.38, 0], [1.96, 1.98, 1.96], p.primary, hd, 0.08);
  // Front stone forebuilding entry porch & rear spiral stair annex
  kshell(b, [0, 0.68, 1.06], [0.96, 0.98, 0.48], stoneDk, hd, 0.12);
  kbox(b, [0, 1.22, 1.08], [1.06, 0.12, 0.56], p.edge, hd);
  kcyl(b, [0.46, 1.32, -1.0], 0.42, 0.46, 2.24, stoneDk, hd, 10);
  kcone(b, [0.46, 2.7, -1.0], 0.48, 0.56, slate, hd, 10);
  // Hinged KeepDoor (y)
  const door = kdoor(b, 'KeepDoor', [0, 0.26, 1.29], 0.52, 0.84, oak, p.edge, p, 1);
  for (const y of [0.22, 0.6]) kbox(door, [-0.26, y, 0.032], [0.46, 0.055, 0.036], p.dark, hd);
  // 4 corbelled overhanging corner bartizan watch-turrets
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const tx = sx * 0.96;
      const tz = sz * 0.96;
      kcyl(b, [tx, 1.72, tz], 0.3, 0.16, 0.36, stoneDk, hd, 10);
      kcyl(b, [tx, 2.22, tz], 0.32, 0.3, 0.7, p.primary, hd, 10);
      kcyl(b, [tx, 2.58, tz], 0.36, 0.32, 0.1, p.edge, hd, 10);
      kcone(b, [tx, 2.94, tz], 0.38, 0.66, slate, hd, 10);
    }
    // Side & front buttress ribs
    kbox(b, [sx * 0.99, 1.18, 0], [0.16, 1.54, 0.34], stoneDk, hd);
  }
  // Crenellated rooftop parapet merlons & mossy accent patches
  kshell(b, [0, 2.42, 0], [2.1, 0.14, 2.1], p.edge, hd, 0.08);
  for (const i of [-0.52, 0, 0.52]) {
    kbox(b, [i, 2.6, 0.96], [0.28, 0.26, 0.18], p.primary, hd);
    kbox(b, [i, 2.6, -0.96], [0.28, 0.26, 0.18], p.primary, hd);
    kbox(b, [0.96, 2.6, i], [0.18, 0.26, 0.28], p.primary, hd);
    kbox(b, [-0.96, 2.6, i], [0.18, 0.26, 0.28], p.primary, hd);
  }
  // Prominent moss drapes (using p.accent) on plinth & walls
  kbox(b, [-0.66, 0.5, 1.0], [0.58, 0.34, 0.12], p.accent, hd);
  kbox(b, [0.76, 1.62, 1.0], [0.42, 0.52, 0.1], p.accent, hd);
  kbox(b, [-1.04, 1.92, -0.44], [0.12, 0.44, 0.46], p.accent, hd);
  // Rooftop timber banner mast & swaying BannerFlag (y)
  kcyl(b, [-0.26, 3.04, -0.18], 0.042, 0.056, 1.24, oak, hd, 8);
  kcyl(b, [-0.26, 3.68, -0.18], 0.075, 0.06, 0.09, p.alloy, hd, 8);
  const flag = group(b, 'BannerFlag', [-0.26, 3.4, -0.18]);
  kbox(flag, [0.28, 0, 0], [0.56, 0.32, 0.048], p.accent, hd);
  kbox(flag, [0.24, 0, 0], [0.22, 0.14, 0.064], p.stencil, hd);
  kprism(flag, [0.56, -0.16, 0], [[0, 0], [0.22, 0.08], [0, 0.16], [0.22, 0.24], [0, 0.32]], 0.046, p.accent, hd);
  if (detail) {
    for (const sx of [-0.46, 0.46]) kbox(b, [sx, 1.76, 1.0], [0.12, 0.42, 0.09], p.inset, hd);
    kwin(b, [-0.42, 1.56, -0.99], 0.32, 0.46, stoneDk, p.inset, p.edge, hd, true, Math.PI);
    for (const sx of [-1, 1]) kbox(b, [sx * 0.54, 0.46, 1.14], [0.34, 0.22, 0.28], p.accent, hd);
    if (hd) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) kcone(b, [sx * 0.96, 3.34, sz * 0.96], 0.032, 0.16, p.alloy, true, 8);
      }
      kboltring(b, 0.46, 2.44, -1.0, 0.4, 8, p.edge, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Open keep door', 3.2, [swingTrack('KeepDoor', 'y', 3.2, 82)]),
    new T.AnimationClip('Banner breeze', 3.8, [swingTrack('BannerFlag', 'y', 3.8, 26, true)]),
  ];
}

function buildCrookedWitchCottage(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'WitchCottage');
  const hd = p.hd;
  const cobble = matte('#67645e', 0.9, 'Cobble');
  const plaster = matte('#dfd3bc', 0.88, 'Plaster');
  const timber = matte('#4d3626', 0.86, 'Timber');
  const brew = glow('#5ce052', '#28b824', 1.0, 'PotionBrew');
  const brick = matte('#7b453b', 0.88, 'ChimneyBrick');
  // Cobblestone base pad at y = 0
  kshell(b, [0, 0.09, 0], [2.72, 0.18, 2.32], cobble, hd, 0.22);
  // Leaning lower timber-and-plaster body (canted +4 deg)
  const house = group(b, 'LeaningHouse', [0.12, 0.14, -0.06]);
  house.rotation.z = deg(-4);
  kshell(house, [0, 0.56, 0], [1.62, 1.12, 1.54], plaster, hd, 0.1);
  // Overhanging canted upper storybook attic box
  const upper = group(house, '', [0.06, 1.32, 0]);
  upper.rotation.z = deg(7);
  kshell(upper, [0, 0, 0], [1.86, 0.56, 1.72], plaster, hd, 0.12);
  for (const sx of [-0.92, 0.92]) {
    kbox(upper, [sx, 0, 0], [0.1, 0.6, 1.76], timber, hd);
  }
  // Tall TWISTED witch-hat shingled steeple roof (5 skewed tapering segments!)
  const hat = group(upper, 'WitchHatRoof', [0, 0.24, 0]);
  const segs: readonly (readonly [number, number, number, number, number, number])[] = [
    [0, 0.2, 0.92, 1.24, 0.44, 0.05],
    [0.08, 0.62, 0.64, 0.94, 0.46, -0.14],
    [-0.02, 1.04, 0.4, 0.66, 0.46, 0.22],
    [0.14, 1.42, 0.18, 0.42, 0.42, -0.34],
    [0.34, 1.72, 0.02, 0.2, 0.36, -0.62],
  ];
  for (const [x, y, rt, rb, h, rz] of segs) {
    const seg = kcyl(hat, [x, y, 0], rt, rb, h, p.primary, hd, 8);
    seg.rotation.z = rz;
  }
  // Hat brim accent ribbon band
  kcyl(hat, [0, 0.06, 0], 1.28, 1.34, 0.1, p.accent, hd, 10);
  // Crooked chimney clinging to right/rear flank
  const ch1 = kbox(house, [0.92, 0.88, -0.38], [0.36, 1.28, 0.38], brick, hd);
  ch1.rotation.z = deg(-12);
  const ch2 = kbox(house, [1.08, 1.74, -0.38], [0.32, 0.72, 0.34], brick, hd);
  ch2.rotation.z = deg(16);
  kbox(house, [0.98, 2.1, -0.38], [0.42, 0.1, 0.44], cobble, hd);
  // Timber porch canopy & hinged CottageDoor (y)
  const door = kdoor(house, 'CottageDoor', [0.06, 0.02, 0.77], 0.48, 0.84, timber, p.accent, p, 1);
  kcyl(door, [-0.24, 0.62, 0.036], 0.09, 0.09, 0.036, p.accent, hd, 10).rotation.x = Math.PI / 2;
  const porchRoof = kbox(house, [0.06, 1.02, 0.96], [0.84, 0.09, 0.5], p.primary, hd);
  porchRoof.rotation.x = 0.28;
  for (const sx of [-0.32, 0.44]) kstrut(house, [sx, 0.04, 1.08], [sx, 0.96, 1.08], 0.04, timber, hd, 8);
  // Detachable CauldronHearth seated solidly on front-left cobble pad
  const hearth = group(b, 'CauldronHearth');
  kcyl(hearth, [-0.88, 0.2, 0.66], 0.36, 0.4, 0.16, cobble, hd, 10);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.4;
    kstrut(hearth, [-0.88 + Math.sin(a) * 0.34, 0.22, 0.66 + Math.cos(a) * 0.34], [-0.88, 1.02, 0.66], 0.026, p.dark, hd, 6);
  }
  const belly = kdome(hearth, [-0.88, 0.56, 0.66], 0.26, 0.26, p.dark, hd, 10);
  belly.rotation.x = Math.PI;
  kcyl(hearth, [-0.88, 0.56, 0.66], 0.24, 0.26, 0.16, p.dark, hd, 10);
  ktorus(hearth, [-0.88, 0.65, 0.66], 0.24, 0.034, p.dark, hd).rotation.x = Math.PI / 2;
  kcyl(hearth, [-0.88, 0.63, 0.66], 0.21, 0.21, 0.05, brew, hd, 10);
  kcyl(hearth, [-0.88, 0.3, 0.66], 0.06, 0.14, 0.12, p.accent, hd, 8);
  if (detail) {
    kwin(house, [-0.46, 0.62, 0.78], 0.28, 0.34, timber, p.accent, cobble, hd, true, 0);
    kwin(house, [-0.82, 0.62, -0.04], 0.3, 0.36, timber, p.accent, cobble, hd, true, -Math.PI / 2);
    kwin(house, [0, 0.68, -0.78], 0.34, 0.38, timber, p.accent, cobble, hd, true, Math.PI);
    kcyl(hearth, [-0.82, 0.7, 0.7], 0.048, 0.048, 0.048, brew, hd, 8);
    if (hd) {
      kboltring(hat, 0, 0.12, 0, 1.24, 10, p.accent, true);
      for (const sx of [-0.76, 0.76]) kstrut(house, [sx, 0.04, 0.77], [sx, 1.08, 0.77], 0.042, timber, true, 8);
    }
  }
  root.animations = [
    new T.AnimationClip('Open cottage door', 3.2, [swingTrack('CottageDoor', 'y', 3.2, 80)]),
  ];
}

function buildSteampunkClockworkHall(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'ClockworkHall');
  const hd = p.hd;
  const brick = matte('#7a4d3e', 0.86, 'Brick');
  const brass = metal('#c99438', 0.38, 0.58, 'Brass');
  const copper = metal('#4c8577', 0.44, 0.38, 'Copper');
  const steamWin = glass('#488c99', '#1e5058', 'ClockworkGlass');
  // Rusticated stone plinth at y = 0
  kshell(b, [0, 0.1, 0], [3.08, 0.2, 2.22], p.dark, hd, 0.16);
  // Victorian brick nave & brass structural ribs wrapping all 4 walls
  kshell(b, [0, 0.96, 0], [2.66, 1.56, 1.84], brick, hd, 0.1);
  kshell(b, [0, 1.78, 0], [2.82, 0.14, 1.98], brass, hd, 0.12);
  for (const sx of [-1.22, -0.62, 0.62, 1.22]) {
    kbox(b, [sx, 0.96, 0.93], [0.12, 1.54, 0.1], brass, hd);
    kbox(b, [sx, 0.96, -0.93], [0.12, 1.54, 0.1], brass, hd);
  }
  // Ribbed patinated copper Victorian dome roof (p.primary) & cupola lantern
  kdome(b, [0, 1.82, 0], 1.18, 0.96, p.primary, hd, 14);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    khose(
      b,
      [
        [Math.sin(a) * 1.18, 1.84, Math.cos(a) * 1.18],
        [Math.sin(a) * 0.98, 2.36, Math.cos(a) * 0.98],
        [Math.sin(a) * 0.44, 2.74, Math.cos(a) * 0.44],
      ],
      0.036,
      p.accent,
      hd,
      8,
      6,
    );
  }
  kcyl(b, [0, 2.86, 0], 0.3, 0.34, 0.36, brass, hd, 10);
  kdome(b, [0, 3.02, 0], 0.32, 0.28, p.primary, hd, 10);
  kcyl(b, [0, 3.4, 0], 0.025, 0.04, 0.26, brass, hd, 8);
  // Twin towering brass-banded vertical steam stacks at rear corners
  for (const sx of [-1, 1]) {
    kcyl(b, [sx * 1.08, 1.52, -0.78], 0.16, 0.22, 2.66, p.dark, hd, 12);
    for (const y of [1.94, 2.42, 2.78]) kcyl(b, [sx * 1.08, y, -0.78], 0.21, 0.21, 0.09, p.accent, hd, 12);
    kcyl(b, [sx * 1.08, 2.9, -0.78], 0.23, 0.16, 0.16, brass, hd, 12);
  }
  // Giant exposed facade clockwork cogwheel MainGear (z)
  kcyl(b, [0, 1.72, 0.98], 0.18, 0.2, 0.28, p.dark, hd, 12).rotation.x = Math.PI / 2;
  const gear = group(b, 'MainGear', [0, 1.72, 1.14]);
  kgear(gear, [0, 0, 0], 0.62, 0.1, 14, p.accent, p.alloy, hd);
  // Hinged BrassDoor (y) under clockwork balcony
  const door = kdoor(b, 'BrassDoor', [0, 0.2, 0.92], 0.56, 0.88, p.accent, p.dark, p, 1);
  kcyl(door, [-0.28, 0.56, 0.036], 0.14, 0.14, 0.036, steamWin, hd, 10).rotation.x = Math.PI / 2;
  // Side & rear arched industrial windows
  for (const sx of [-1, 1]) {
    kwin(b, [sx * 0.92, 0.94, 0.92], 0.34, 0.62, brass, steamWin, p.dark, hd, detail, 0);
    kwin(b, [sx * 1.33, 0.94, 0], 0.44, 0.64, brass, steamWin, p.dark, hd, detail, sx * Math.PI / 2);
  }
  kwin(b, [0, 0.96, -0.92], 0.56, 0.68, brass, steamWin, p.dark, hd, detail, Math.PI);
  if (detail) {
    kgear(b, [0.76, 1.48, 1.03], 0.28, 0.07, 10, copper, brass, hd);
    kgear(b, [-0.76, 1.48, 1.03], 0.26, 0.07, 10, brass, p.dark, hd);
    for (const sx of [-1, 1]) {
      khose(b, [[sx * 1.04, 1.56, -0.66], [sx * 0.84, 1.78, -0.44], [sx * 0.58, 1.88, -0.26]], 0.044, brass, hd);
    }
    if (hd) {
      kboltring(b, 0, 1.86, 0, 1.24, 12, brass, true);
      kboltring(gear, 0, 0, 0.06, 0.42, 6, p.dark, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Run clockwork', 4.8, [spinTrack('MainGear', 'z', 4.8, -1)]),
    new T.AnimationClip('Open brass door', 3.2, [swingTrack('BrassDoor', 'y', 3.2, 82)]),
  ];
}

export const buildingsFantasyScifiA: readonly PackBuilderDef[] = [
  {
    id: 'dwarven-forge-gatehouse',
    riggedParts: [rig('RunicGate', 'Runic gate', 'slide', 'y', [0, 0.95], 'Raises the carved basalt rune slab gate')],
    detachableParts: [det('ForgeBraziers', 'Forge braziers', 'Twin flanking stone and bronze fire braziers')],
    build: buildDwarvenForgeGatehouse,
  },
  {
    id: 'elven-canopy-pavilion',
    riggedParts: [rig('StarOrrery', 'Star orrery', 'rotate', 'y', [0, 360], 'Rotates the central starlight astrolabe orrery')],
    detachableParts: [det('CrystalLamps', 'Crystal lamps', 'Four curved silverwood crystal lantern posts')],
    build: buildElvenCanopyPavilion,
  },
  {
    id: 'mossy-stone-keep',
    riggedParts: [
      rig('KeepDoor', 'Keep door', 'rotate', 'y', [0, 82], 'Swings the iron-strapped Norman oak keep door open'),
      rig('BannerFlag', 'Banner flag', 'rotate', 'y', [-26, 26], 'Sways the rooftop heraldic fortress banner'),
    ],
    detachableParts: [],
    build: buildMossyStoneKeep,
  },
  {
    id: 'crooked-witch-cottage',
    riggedParts: [rig('CottageDoor', 'Cottage door', 'rotate', 'y', [0, 80], 'Swings the storybook cottage entrance door outward')],
    detachableParts: [det('CauldronHearth', 'Cauldron hearth', 'Stone firepit tripod and bubbling witch cauldron')],
    build: buildCrookedWitchCottage,
  },
  {
    id: 'steampunk-clockwork-hall',
    riggedParts: [
      rig('MainGear', 'Main gear', 'rotate', 'z', [0, 360], 'Spins the giant exposed facade brass cogwheel'),
      rig('BrassDoor', 'Brass door', 'rotate', 'y', [0, 82], 'Swings the riveted Victorian brass entrance door open'),
    ],
    detachableParts: [],
    build: buildSteampunkClockworkHall,
  },
];
