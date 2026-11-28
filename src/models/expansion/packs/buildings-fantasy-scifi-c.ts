import * as T from 'three';
import {
  deg, glass, glow, group, kboltring, kbox, kcyl, kdome, kgear, khose, klathe, korb,
  kprism, kshell, kstrut, ktorus, kwin, matte, metal, rig, slideTrack, spinTrack, swingTrack,
} from './buildings-fantasy-scifi-kit';
import type { Finish, PackBuilderDef, Point } from './buildings-fantasy-scifi-kit';

function buildMarsPressureHabDome(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'MarsHabDome');
  const hd = p.hd;
  const regolith = matte('#9c4a2e', 0.92, 'MartianRegolith');
  const alloy = metal('#a4b0b6', 0.42, 0.54, 'TitaniumAlloy');
  const hullDark = matte('#3b4046', 0.84, 'ThermalBulkhead');
  const visor = glass('#2e6c80', '#103c4a', 'HabViewport');
  const beacon = glow('#ff9838', '#ff6210', 1.0, 'AirlockBeacon');
  // Continuous Martian regolith & foundation pad at y = 0
  kcyl(b, [0, 0.1, 0], 1.54, 1.64, 0.2, regolith, hd, 10);
  kcyl(b, [0, 0.24, -0.06], 1.24, 1.32, 0.18, hullDark, hd, 14);
  // Ribbed white composite hemisphere dome (p.primary)
  kdome(b, [0, 0.28, -0.06], 1.18, 1.16, p.primary, hd, 16);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    khose(
      b,
      [
        [Math.sin(a) * 1.2, 0.3, -0.06 + Math.cos(a) * 1.2],
        [Math.sin(a) * 0.98, 0.96, -0.06 + Math.cos(a) * 0.98],
        [Math.sin(a) * 0.42, 1.38, -0.06 + Math.cos(a) * 0.42],
      ],
      0.042,
      p.accent,
      hd,
      8,
      6,
    );
  }
  // Polar skylight cupola hub
  kcyl(b, [0, 1.44, -0.06], 0.36, 0.42, 0.16, hullDark, hd, 12);
  kdome(b, [0, 1.5, -0.06], 0.32, 0.16, visor, hd, 12);
  // Tubular corrugated horizontal airlock tunnel extending +Z
  kcyl(b, [0, 0.72, 1.02], 0.46, 0.46, 0.86, p.primary, hd, 12).rotation.x = Math.PI / 2;
  for (const z of [0.84, 1.12, 1.38]) {
    ktorus(b, [0, 0.72, z], 0.47, 0.042, p.accent, hd).rotation.z = Math.PI / 4;
  }
  kshell(b, [0, 0.24, 1.06], [0.88, 0.24, 0.84], hullDark, hd, 0.16);
  // Airlock bulkhead frame & sliding AirlockHatch (x)
  kshell(b, [0, 0.72, 1.44], [0.96, 0.9, 0.14], hullDark, hd, 0.2);
  kbox(b, [0, 0.72, 1.48], [0.58, 0.66, 0.09], p.inset, hd);
  for (const y of [0.34, 1.1]) kbox(b, [0.16, y, 1.54], [0.98, 0.06, 0.07], alloy, hd);
  const hatchRest: Point = [0, 0.72, 1.54];
  const hatch = group(b, 'AirlockHatch', hatchRest);
  kshell(hatch, [0, 0, 0], [0.62, 0.68, 0.09], p.primary, hd, 0.24);
  kbox(hatch, [0, 0.12, 0.04], [0.28, 0.2, 0.05], visor, hd);
  kbox(hatch, [0, -0.18, 0.04], [0.42, 0.09, 0.05], p.accent, hd);
  // External twin vertical cryogenic O2 tanks on right flank
  for (const dz of [-0.32, 0.24]) {
    kcyl(b, [1.24, 0.68, dz], 0.2, 0.2, 0.86, alloy, hd, 12);
    kdome(b, [1.24, 1.1, dz], 0.2, 0.14, alloy, hd, 10);
    kcyl(b, [1.24, 0.72, dz], 0.215, 0.215, 0.14, p.accent, hd, 12);
    kstrut(b, [1.06, 0.68, dz], [0.82, 0.68, dz], 0.042, hullDark, hd, 6);
  }
  // Rear thermal radiator fin wing
  kbox(b, [0, 0.74, -1.26], [0.96, 0.64, 0.16], hullDark, hd);
  for (const x of [-0.32, 0, 0.32]) kbox(b, [x, 0.74, -1.34], [0.14, 0.52, 0.08], p.accent, hd);
  // Shoulder mast & rotating parabolic CommsDish (y)
  kcyl(b, [-0.88, 1.36, -0.34], 0.09, 0.14, 0.96, alloy, hd, 10);
  const dish = group(b, 'CommsDish', [-0.88, 1.88, -0.34]);
  kcyl(dish, [0, 0, 0], 0.12, 0.12, 0.2, hullDark, hd, 10);
  const bowl = group(dish, '', [0, 0.16, 0.06]);
  bowl.rotation.x = 0.68;
  klathe(
    bowl,
    [0, 0, 0],
    [[0, -0.06], [0.18, -0.04], [0.46, 0.12], [0.44, 0.18], [0.16, 0.04], [0, 0.02]],
    p.primary,
    hd,
    14,
  );
  kcyl(bowl, [0, 0.2, 0], 0.024, 0.036, 0.34, p.accent, hd, 8);
  korb(bowl, [0, 0.36, 0], 0.055, alloy, hd, 8, 6);
  if (detail) {
    for (const a of [-Math.PI / 2, -2.35, 2.35]) {
      const pw = group(b, '', [Math.sin(a) * 1.12, 0.66, -0.06 + Math.cos(a) * 1.12]);
      pw.rotation.y = a;
      ktorus(pw, [0, 0, 0.04], 0.18, 0.04, hullDark, hd);
      kcyl(pw, [0, 0, 0.03], 0.15, 0.15, 0.06, visor, hd, 10).rotation.x = Math.PI / 2;
    }
    kcyl(b, [0, 1.24, 1.44], 0.06, 0.07, 0.12, beacon, hd, 8);
    if (hd) {
      kboltring(b, 0, 0.34, -0.06, 1.22, 12, alloy, true);
      khose(b, [[1.24, 1.16, 0.24], [1.06, 1.22, 0.08], [0.84, 1.06, -0.06]], 0.03, p.accent, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Scan telemetry', 5.0, [spinTrack('CommsDish', 'y', 5.0)]),
    new T.AnimationClip('Cycle hatch', 3.4, [slideTrack('AirlockHatch', 'x', hatchRest, 3.4, 0.44)]),
  ];
}

function buildCyberpunkRamenMegatower(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'RamenMegatower');
  const hd = p.hd;
  const asphalt = matte('#2a2d34', 0.88, 'WetAsphalt');
  const steel = metal('#5a6370', 0.44, 0.5, 'TowerSteel');
  const cyanNeon = glow('#36e8ff', '#10c4f0', 1.1, 'CyanNeon');
  const warmNeon = glow('#ffbe3b', '#ff8c12', 1.0, 'RamenLantern');
  const winGlass = glass('#264c66', '#10344c', 'CyberGlass');
  // Narrow dark street foundation pad at y = 0
  kshell(b, [0, 0.09, 0], [2.24, 0.18, 2.08], asphalt, hd, 0.12);
  // 4 stacked offset cantilevered concrete-and-steel megablock tiers
  kshell(b, [0, 0.62, -0.06], [1.66, 0.94, 1.54], p.primary, hd, 0.08);
  kshell(b, [0.06, 1.48, -0.04], [1.56, 0.86, 1.46], p.primary, hd, 0.08);
  kshell(b, [-0.08, 2.34, 0.02], [1.64, 0.9, 1.5], p.primary, hd, 0.08);
  kshell(b, [0.04, 3.06, -0.04], [1.34, 0.62, 1.24], p.dark, hd, 0.1);
  // Street-level ramen bar recess, counter & sloped awning
  kbox(b, [0, 0.56, 0.69], [1.24, 0.58, 0.12], p.inset, hd);
  kbox(b, [0, 0.34, 0.78], [1.38, 0.12, 0.3], steel, hd);
  const awning = kbox(b, [0, 0.94, 0.88], [1.46, 0.09, 0.42], p.accent, hd);
  awning.rotation.x = 0.28;
  // Tall glowing vertical cyberpunk neon billboards cantilevered on right flank
  for (const y of [1.42, 2.34]) kstrut(b, [0.76, y, 0.36], [1.06, y, 0.36], 0.036, steel, hd, 6);
  kbox(b, [1.06, 1.88, 0.36], [0.14, 1.38, 0.52], p.dark, hd);
  kbox(b, [1.06, 1.88, 0.36], [0.18, 1.22, 0.38], p.accent, hd);
  kbox(b, [1.06, 1.88, 0.36], [0.22, 0.94, 0.18], cyanNeon, hd);
  // Cantilevered AC units on flanks & rear spine
  for (const y of [1.32, 2.18]) {
    kshell(b, [0.92, y, -0.34], [0.36, 0.32, 0.42], steel, hd, 0.14);
    kcyl(b, [1.11, y, -0.34], 0.11, 0.11, 0.06, p.inset, hd, 10).rotation.z = Math.PI / 2;
  }
  kbox(b, [0, 1.82, -0.82], [0.46, 2.74, 0.24], steel, hd);
  // Exterior left-flank steel rails & sliding LiftPod (y)
  for (const z of [-0.22, 0.22]) kstrut(b, [-0.98, 0.16, z], [-0.98, 3.16, z], 0.036, steel, hd, 8);
  for (const y of [0.96, 1.96, 2.94]) {
    kstrut(b, [-0.56, y, 0], [-0.98, y, 0], 0.04, steel, hd, 6);
    kstrut(b, [-0.98, y, -0.24], [-0.98, y, 0.24], 0.036, steel, hd, 6);
  }
  const liftRest: Point = [-0.98, 0.72, 0];
  const lift = group(b, 'LiftPod', liftRest);
  kshell(lift, [0, 0, 0], [0.38, 0.62, 0.56], steel, hd, 0.18);
  kbox(lift, [-0.04, 0.04, 0], [0.36, 0.34, 0.44], winGlass, hd);
  kbox(lift, [0, -0.26, 0], [0.42, 0.07, 0.6], p.accent, hd);
  // Rooftop beacon mast & rotating HoloSign (y)
  kcyl(b, [0.04, 3.48, -0.04], 0.09, 0.14, 0.38, steel, hd, 10);
  const holo = group(b, 'HoloSign', [0.04, 3.74, -0.04]);
  kbox(holo, [0, 0, 0], [0.88, 0.34, 0.14], p.dark, hd);
  kbox(holo, [0, 0, 0], [0.76, 0.24, 0.19], p.accent, hd);
  kbox(holo, [0, 0, 0], [0.52, 0.12, 0.23], cyanNeon, hd);
  kcyl(holo, [0, 0.24, 0], 0.03, 0.04, 0.2, steel, hd, 8);
  if (detail) {
    for (const x of [-0.46, 0, 0.46]) kcyl(b, [x, 0.78, 0.88], 0.068, 0.068, 0.16, warmNeon, hd, 8);
    kwin(b, [0.06, 1.5, 0.7], 0.96, 0.34, p.dark, winGlass, steel, hd, true, 0);
    kwin(b, [-0.08, 2.34, 0.78], 1.04, 0.34, p.dark, cyanNeon, steel, hd, true, 0);
    kwin(b, [0.06, 1.5, -0.78], 0.82, 0.32, p.dark, winGlass, steel, hd, true, Math.PI);
    if (hd) {
      khose(b, [[0.3, 0.84, -0.84], [0.54, 1.62, -0.88], [0.42, 2.58, -0.84]], 0.03, p.accent, true);
      kboltring(b, 0.04, 3.38, -0.04, 0.56, 8, steel, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Tower bustle', 4.6, [
      spinTrack('HoloSign', 'y', 4.6),
      slideTrack('LiftPod', 'y', liftRest, 4.6, 1.35),
    ]),
  ];
}

function buildOrbitalShuttlePad(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'ShuttlePad');
  const hd = p.hd;
  const concrete = matte('#4d535c', 0.88, 'BlastConcrete');
  const steel = metal('#7a8692', 0.42, 0.52, 'GantrySteel');
  const strobe = glow('#56e6ff', '#18c2f0', 1.1, 'PadBeacon');
  // Broad chamfered octagonal blast-deflector landing apron at y = 0
  kcyl(b, [0, 0.14, 0], 1.66, 1.82, 0.28, concrete, hd, 8);
  kcyl(b, [0, 0.31, 0], 1.36, 1.44, 0.1, p.primary, hd, 8);
  // Central recessed landing target crosshairs & hazard ring
  ktorus(b, [0, 0.37, 0.06], 0.78, 0.045, p.accent, hd).rotation.x = Math.PI / 2;
  kbox(b, [0, 0.375, 0.06], [0.92, 0.048, 0.14], p.accent, hd);
  kbox(b, [0, 0.375, 0.06], [0.14, 0.048, 0.92], p.accent, hd);
  // 4 perimeter strobe beacon bollards
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const px = Math.sin(a) * 1.44;
    const pz = Math.cos(a) * 1.44;
    kcyl(b, [px, 0.42, pz], 0.08, 0.11, 0.34, p.dark, hd, 8);
    kcyl(b, [px, 0.62, pz], 0.07, 0.07, 0.1, strobe, hd, 8);
  }
  // Trussed steel umbilical service gantry tower anchored on rear-left apron
  const gx = -1.04;
  const gz = -0.82;
  kshell(b, [gx, 0.52, gz], [0.76, 0.56, 0.76], p.dark, hd, 0.14);
  for (const dx of [-0.26, 0.26]) {
    for (const dz of [-0.26, 0.26]) {
      kstrut(b, [gx + dx, 0.46, gz + dz], [gx + dx * 0.85, 2.74, gz + dz * 0.85], 0.048, steel, hd, 8);
    }
  }
  for (const y of [1.24, 1.96, 2.68]) kshell(b, [gx, y, gz], [0.68, 0.1, 0.68], p.primary, hd, 0.12);
  kcyl(b, [gx, 2.94, gz], 0.05, 0.08, 0.46, p.accent, hd, 8);
  // Swinging crew boarding UmbilicalArm (y) pivoted on gantry collar
  kcyl(b, [gx + 0.32, 1.72, gz + 0.14], 0.14, 0.14, 0.34, p.accent, hd, 10);
  const arm = group(b, 'UmbilicalArm', [gx + 0.32, 1.72, gz + 0.14]);
  kbox(arm, [0.66, 0, 0], [1.34, 0.24, 0.26], p.primary, hd);
  kbox(arm, [0.66, 0.14, 0], [1.28, 0.06, 0.3], p.accent, hd);
  kshell(arm, [1.34, 0, 0], [0.24, 0.4, 0.38], p.dark, hd, 0.18);
  // Tilting rear BlastShield (x) mounted on heavy hinge knuckles
  for (const sx of [-0.52, 0.52]) kbox(b, [sx, 0.38, -1.24], [0.2, 0.24, 0.22], p.dark, hd);
  const shield = group(b, 'BlastShield', [0, 0.42, -1.24]);
  const panel = kbox(shield, [0, 0.44, -0.06], [1.46, 0.88, 0.14], p.primary, hd);
  panel.rotation.x = deg(18);
  for (const x of [-0.52, 0, 0.52]) {
    const rib = kbox(shield, [x, 0.44, -0.14], [0.12, 0.82, 0.1], p.accent, hd);
    rib.rotation.x = deg(18);
  }
  if (detail) {
    for (const y of [0.88, 1.6, 2.32]) {
      kstrut(b, [gx - 0.24, y - 0.28, gz + 0.24], [gx + 0.24, y + 0.28, gz + 0.24], 0.024, p.accent, hd, 6);
      kstrut(b, [gx - 0.24, y - 0.28, gz - 0.24], [gx + 0.24, y + 0.28, gz - 0.24], 0.024, p.accent, hd, 6);
    }
    for (const sx of [-1, 1]) kbox(b, [sx * 1.04, 0.36, 0.88], [0.28, 0.08, 0.44], p.dark, hd);
    if (hd) {
      kboltring(b, 0, 0.38, 0.06, 0.84, 12, steel, true);
      khose(arm, [[0.14, -0.1, 0.14], [0.64, -0.22, 0.14], [1.18, -0.1, 0.14]], 0.03, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Service shuttle', 4.4, [
      swingTrack('UmbilicalArm', 'y', 4.4, 36, true),
      swingTrack('BlastShield', 'x', 4.4, -42),
    ]),
  ];
}

function buildAridMoistureVaporator(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'MoistureVaporator');
  const hd = p.hd;
  const sandPad = matte('#a89375', 0.9, 'AridSlab');
  const alloy = metal('#93a0a6', 0.42, 0.5, 'CondenserSteel');
  const screen = glow('#4ce0e8', '#1aa8b8', 0.9, 'PumpDisplay');
  // Desert farmstead utility pad at y = 0
  kshell(b, [0, 0.1, 0], [2.58, 0.2, 2.12], sandPad, hd, 0.18);
  // Central stepped atmospheric condenser base & tall finned mast
  kcyl(b, [0, 0.46, 0], 0.44, 0.56, 0.58, p.primary, hd, 12);
  kcyl(b, [0, 1.84, 0], 0.16, 0.24, 2.48, p.primary, hd, 12);
  // Stacked horizontal cooling condenser fins
  for (const y of [1.12, 1.38, 1.64, 1.9, 2.94]) {
    kcyl(b, [0, y, 0], 0.36, 0.38, 0.075, alloy, hd, 12);
  }
  kdome(b, [0, 3.06, 0], 0.22, 0.36, p.accent, hd, 12);
  kcyl(b, [0, 3.48, 0], 0.026, 0.04, 0.34, alloy, hd, 8);
  // Spinning wind-catch CondenserVanes (y) encircling upper mast
  const vanes = group(b, 'CondenserVanes', [0, 2.42, 0]);
  kcyl(vanes, [0, 0, 0], 0.24, 0.24, 0.74, p.dark, hd, 10);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const s = Math.sin(a);
    const c = Math.cos(a);
    kstrut(vanes, [0, 0.28, 0], [s * 0.62, 0.28, c * 0.62], 0.028, alloy, hd, 6);
    kstrut(vanes, [0, -0.28, 0], [s * 0.62, -0.28, c * 0.62], 0.028, alloy, hd, 6);
    const blade = kshell(vanes, [s * 0.62, 0, c * 0.62], [0.22, 0.76, 0.08], p.accent, hd, 0.26);
    blade.rotation.y = a + 0.42;
  }
  // Twin insulated flanking water cistern tanks linked to central mast
  for (const sx of [-1, 1]) {
    kcyl(b, [sx * 0.86, 0.78, -0.18], 0.34, 0.36, 1.18, p.primary, hd, 12);
    kdome(b, [sx * 0.86, 1.36, -0.18], 0.34, 0.24, alloy, hd, 12);
    for (const y of [0.56, 1.06]) kcyl(b, [sx * 0.86, y, -0.18], 0.365, 0.365, 0.1, p.accent, hd, 12);
    kstrut(b, [sx * 0.56, 0.92, -0.16], [sx * 0.2, 0.92, -0.06], 0.055, alloy, hd, 8);
    kstrut(b, [sx * 0.56, 0.48, -0.16], [sx * 0.36, 0.48, -0.06], 0.055, p.dark, hd, 8);
  }
  // Rear pipe manifold linking both cisterns
  khose(b, [[-0.86, 1.08, -0.44], [-0.4, 1.16, -0.78], [0.4, 1.16, -0.78], [0.86, 1.08, -0.44]], 0.05, alloy, hd, 12, 7);
  // Forward armored pump housing & hinged PumpHatch (x)
  kshell(b, [0, 0.52, 0.66], [0.86, 0.68, 0.54], p.dark, hd, 0.14);
  kbox(b, [0, 0.54, 0.92], [0.58, 0.44, 0.08], p.inset, hd);
  kbox(b, [0, 0.58, 0.95], [0.36, 0.2, 0.05], screen, hd);
  const hatch = group(b, 'PumpHatch', [0, 0.78, 0.96]);
  kshell(hatch, [0, -0.24, 0.03], [0.64, 0.48, 0.07], p.accent, hd, 0.18);
  kbox(hatch, [0, -0.42, 0.075], [0.24, 0.05, 0.04], alloy, hd);
  if (detail) {
    for (const sx of [-1, 1]) {
      kcyl(b, [sx * 0.86, 0.82, 0.18], 0.09, 0.09, 0.07, p.dark, hd, 10).rotation.x = Math.PI / 2;
      kcyl(b, [sx * 0.86, 0.82, 0.21], 0.065, 0.065, 0.05, screen, hd, 10).rotation.x = Math.PI / 2;
    }
    if (hd) {
      kboltring(b, 0, 0.76, 0, 0.42, 8, alloy, true);
      for (const sx of [-1, 1]) khose(b, [[sx * 0.74, 0.56, 0.12], [sx * 0.58, 0.52, 0.46], [sx * 0.36, 0.54, 0.66]], 0.032, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Harvest moisture', 4.6, [
      spinTrack('CondenserVanes', 'y', 4.6),
      swingTrack('PumpHatch', 'x', 4.6, -68),
    ]),
  ];
}

function buildNeonPachinkoParlor(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'PachinkoParlor');
  const hd = p.hd;
  const tile = matte('#353542', 0.86, 'ArcadeTile');
  const chrome = metal('#c8d2dc', 0.36, 0.62, 'ArcadeChrome');
  const goldNeon = glow('#ffd242', '#ffaa14', 1.1, 'GoldMarquee');
  const cyanNeon = glow('#40ecff', '#10c4f5', 1.0, 'CyanMarquee');
  const lobbyGlass = glass('#326a88', '#164666', 'LobbyGlass');
  // Tiled arcade sidewalk plinth at y = 0
  kshell(b, [0, 0.09, 0], [2.88, 0.18, 2.18], tile, hd, 0.12);
  // Two-story midnight-indigo arcade hall body (p.primary)
  kshell(b, [0, 1.24, -0.06], [2.44, 2.16, 1.66], p.primary, hd, 0.08);
  // Sweeping curved illuminated crown sign cresting the roofline
  const crownPts: readonly (readonly [number, number])[] = [
    [-1.34, 0], [1.34, 0], [1.14, 0.52], [0.62, 0.88], [0, 1.02], [-0.62, 0.88], [-1.14, 0.52],
  ];
  kprism(b, [0, 2.24, 0.66], crownPts, 0.28, p.dark, hd);
  const innerPts: readonly (readonly [number, number])[] = [
    [-1.16, 0.08], [1.16, 0.08], [0.96, 0.48], [0.52, 0.76], [0, 0.88], [-0.52, 0.76], [-0.96, 0.48],
  ];
  kprism(b, [0, 2.24, 0.74], innerPts, 0.22, p.accent, hd);
  kbox(b, [0, 2.66, 0.86], [1.22, 0.22, 0.08], goldNeon, hd);
  // Flanking illuminated vertical marquee light columns
  for (const sx of [-1, 1]) {
    kshell(b, [sx * 1.12, 1.24, 0.74], [0.34, 2.14, 0.34], p.dark, hd, 0.14);
    kbox(b, [sx * 1.12, 1.24, 0.91], [0.16, 1.88, 0.08], cyanNeon, hd);
    // Side blade neon signs
    kbox(b, [sx * 1.32, 1.56, 0.16], [0.22, 1.08, 0.42], p.accent, hd);
    kbox(b, [sx * 1.32, 1.56, 0.16], [0.26, 0.86, 0.24], goldNeon, hd);
  }
  // Stepped canopy & sliding glazed EntryDoors (x)
  kshell(b, [0, 1.12, 0.92], [1.84, 0.18, 0.54], p.accent, hd, 0.14);
  kbox(b, [0, 0.62, 0.74], [1.34, 0.88, 0.16], p.inset, hd);
  const doorsRest: Point = [0, 0.62, 0.81];
  const doors = group(b, 'EntryDoors', doorsRest);
  kbox(doors, [0, 0, 0], [0.78, 0.84, 0.07], chrome, hd);
  kbox(doors, [0, 0.02, 0.03], [0.64, 0.72, 0.05], lobbyGlass, hd);
  // Giant spinning facade JackpotWheel (z)
  kcyl(b, [0, 1.82, 0.82], 0.18, 0.2, 0.24, chrome, hd, 12).rotation.x = Math.PI / 2;
  const wheel = group(b, 'JackpotWheel', [0, 1.82, 0.96]);
  kgear(wheel, [0, 0, 0], 0.56, 0.1, 12, p.accent, goldNeon, hd);
  ktorus(wheel, [0, 0, 0.03], 0.44, 0.045, cyanNeon, hd);
  // Rear service alley exhaust chiller & door
  kshell(b, [0, 0.66, -0.92], [0.72, 0.96, 0.16], chrome, hd, 0.1);
  kshell(b, [0, 2.52, -0.26], [1.24, 0.46, 0.76], chrome, hd, 0.14);
  if (detail) {
    for (const sx of [-1, 1]) {
      for (const y of [0.56, 0.96, 1.36, 1.76, 2.12]) {
        korb(b, [sx * 1.12, y, 0.97], 0.048, goldNeon, hd, 8, 6);
      }
    }
    for (const x of [-0.66, -0.22, 0.22, 0.66]) korb(b, [x, 1.12, 1.2], 0.045, goldNeon, hd, 8, 6);
    kwin(b, [0.76, 1.56, -0.9], 0.42, 0.48, chrome, lobbyGlass, tile, hd, true, Math.PI);
    kwin(b, [-0.76, 1.56, -0.9], 0.42, 0.48, chrome, lobbyGlass, tile, hd, true, Math.PI);
    if (hd) {
      kboltring(wheel, 0, 0, 0.06, 0.34, 8, goldNeon, true);
      for (const sx of [-0.36, 0.36]) kcyl(b, [sx, 2.54, -0.66], 0.16, 0.16, 0.08, p.dark, true, 12).rotation.x = Math.PI / 2;
    }
  }
  root.animations = [
    new T.AnimationClip('Spin jackpot', 4.0, [spinTrack('JackpotWheel', 'z', 4.0, -1)]),
    new T.AnimationClip('Open parlor doors', 3.4, [slideTrack('EntryDoors', 'x', doorsRest, 3.4, 0.38)]),
  ];
}

export const buildingsFantasyScifiC: readonly PackBuilderDef[] = [
  {
    id: 'mars-pressure-hab-dome',
    riggedParts: [
      rig('CommsDish', 'Comms dish', 'rotate', 'y', [0, 360], 'Rotates the high-gain Martian telemetry dish'),
      rig('AirlockHatch', 'Airlock hatch', 'slide', 'x', [0, 0.44], 'Slides the composite airlock pressure hatch sideways'),
    ],
    detachableParts: [],
    build: buildMarsPressureHabDome,
  },
  {
    id: 'cyberpunk-ramen-megatower',
    riggedParts: [
      rig('HoloSign', 'Holo sign', 'rotate', 'y', [0, 360], 'Rotates the rooftop neon holographic sign totem'),
      rig('LiftPod', 'Lift pod', 'slide', 'y', [0, 1.35], 'Raises and lowers the exterior glazed elevator capsule'),
    ],
    detachableParts: [],
    build: buildCyberpunkRamenMegatower,
  },
  {
    id: 'orbital-shuttle-pad',
    riggedParts: [
      rig('UmbilicalArm', 'Umbilical arm', 'rotate', 'y', [-36, 36], 'Swings the trussed crew boarding umbilical boom over the pad'),
      rig('BlastShield', 'Blast shield', 'rotate', 'x', [0, -42], 'Tilts the rear hydraulic jet-blast deflector shield upward'),
    ],
    detachableParts: [],
    build: buildOrbitalShuttlePad,
  },
  {
    id: 'arid-moisture-vaporator',
    riggedParts: [
      rig('CondenserVanes', 'Condenser vanes', 'rotate', 'y', [0, 360], 'Spins the vertical-axis atmospheric wind-catch vanes'),
      rig('PumpHatch', 'Pump hatch', 'rotate', 'x', [0, -68], 'Lifts the armored front pump inspection hatch open'),
    ],
    detachableParts: [],
    build: buildAridMoistureVaporator,
  },
  {
    id: 'neon-pachinko-parlor',
    riggedParts: [
      rig('JackpotWheel', 'Jackpot wheel', 'rotate', 'z', [0, 360], 'Spins the illuminated facade jackpot prize wheel'),
      rig('EntryDoors', 'Entry doors', 'slide', 'x', [0, 0.38], 'Slides the glazed automatic arcade entrance doors open'),
    ],
    detachableParts: [],
    build: buildNeonPachinkoParlor,
  },
];
