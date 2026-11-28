import * as T from 'three';
import { ring } from '../../parts';
import {
  deg, glass, glow, group, kboltring, kbox, kcyl, kdome, kdoor, khose, korb, kprism, kshell,
  kstrut, ktorus, matte, metal, rig, slideTrack, spinTrack, swingTrack,
} from './buildings-fantasy-scifi-kit';
import type { Finish, PackBuilderDef, Point } from './buildings-fantasy-scifi-kit';

function buildArcticResearchBiodome(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'ArcticBiodome');
  const hd = p.hd;
  const snow = matte('#d4e0e8', 0.9, 'SnowPack');
  const steel = metal('#6c7985', 0.44, 0.52, 'PolarSteel');
  const domeGlass = glass('#58a4c4', '#226480', 'GeodesicGlass');
  // Packed-snow & frozen-rock anchor pad at y = 0
  kcyl(b, [0, 0.1, 0], 1.46, 1.56, 0.2, snow, hd, 10);
  // Central insulated utility riser + 6 angled snow-anchor support struts lifting hexagonal lab deck
  kcyl(b, [0, 0.44, 0], 0.42, 0.48, 0.62, p.dark, hd, 8);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    const s = Math.sin(a);
    const c = Math.cos(a);
    kcyl(b, [s * 1.24, 0.2, c * 1.24], 0.14, 0.17, 0.14, p.dark, hd, 8);
    kstrut(b, [s * 1.24, 0.22, c * 1.24], [s * 0.96, 0.78, c * 0.96], 0.068, steel, hd, 8);
    kstrut(b, [s * 1.12, 0.46, c * 1.12], [s * 0.42, 0.52, c * 0.42], 0.036, p.accent, hd, 6);
  }
  // Elevated insulated hexagonal polar lab hull (p.primary + p.accent rescue collar)
  kcyl(b, [0, 0.76, 0], 1.28, 1.14, 0.2, p.dark, hd, 6);
  kcyl(b, [0, 1.22, 0], 1.24, 1.28, 0.76, p.primary, hd, 6);
  kcyl(b, [0, 1.62, 0], 1.28, 1.26, 0.14, p.accent, hd, 6);
  // Geodesic skylight cupola dome & alloy structural ribs
  kdome(b, [0, 1.66, 0], 0.98, 0.72, domeGlass, hd, 12);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    khose(
      b,
      [
        [Math.sin(a) * 0.98, 1.68, Math.cos(a) * 0.98],
        [Math.sin(a) * 0.72, 2.14, Math.cos(a) * 0.72],
        [Math.sin(a) * 0.22, 2.38, Math.cos(a) * 0.22],
      ],
      0.036,
      steel,
      hd,
      8,
      6,
    );
  }
  kcyl(b, [0, 2.4, 0], 0.24, 0.28, 0.1, p.accent, hd, 8);
  // Elevated front airlock vestibule, access ramp & hinged ThermalDoor (y)
  kshell(b, [0, 1.14, 1.18], [0.84, 0.88, 0.56], p.primary, hd, 0.16);
  kbox(b, [0, 1.6, 1.18], [0.9, 0.1, 0.62], p.accent, hd);
  const ramp = kbox(b, [0, 0.42, 1.54], [0.64, 0.1, 0.76], steel, hd);
  ramp.rotation.x = 0.72;
  const door = kdoor(b, 'ThermalDoor', [0, 0.74, 1.45], 0.48, 0.78, p.accent, p.dark, p, 1);
  kcyl(door, [-0.24, 0.52, 0.036], 0.11, 0.11, 0.038, domeGlass, hd, 10).rotation.x = Math.PI / 2;
  // Rear auxiliary polar generator pod
  kshell(b, [0, 1.12, -1.2], [0.76, 0.62, 0.44], p.dark, hd, 0.16);
  kcyl(b, [0.22, 1.62, -1.24], 0.06, 0.075, 0.48, steel, hd, 8);
  // Spinning roof meteorological wind Anemometer (y)
  kcyl(b, [0.62, 2.16, -0.44], 0.038, 0.055, 0.96, steel, hd, 8);
  const anemo = group(b, 'Anemometer', [0.62, 2.66, -0.44]);
  kcyl(anemo, [0, 0, 0], 0.07, 0.07, 0.12, p.accent, hd, 8);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    kstrut(anemo, [0, 0, 0], [Math.sin(a) * 0.34, 0, Math.cos(a) * 0.34], 0.018, steel, hd, 6);
    korb(anemo, [Math.sin(a) * 0.36, 0, Math.cos(a) * 0.36], 0.075, p.accent, hd, 8, 6);
  }
  if (detail) {
    for (const a of [Math.PI / 3, -Math.PI / 3, (2 * Math.PI) / 3, (-2 * Math.PI) / 3]) {
      const pw = group(b, '', [Math.sin(a) * 1.12, 1.24, Math.cos(a) * 1.12]);
      pw.rotation.y = a;
      kbox(pw, [0, 0, 0], [0.46, 0.34, 0.1], p.dark, hd);
      kbox(pw, [0, 0, 0.036], [0.34, 0.22, 0.06], domeGlass, hd);
    }
    if (hd) {
      kboltring(b, 0, 1.7, 0, 1.06, 12, steel, true);
      khose(b, [[0, 1.12, -1.42], [0.22, 0.84, -1.16], [0.36, 0.72, -0.68]], 0.032, p.tire, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Measure wind', 3.6, [spinTrack('Anemometer', 'y', 3.6, 2)]),
    new T.AnimationClip('Open thermal door', 3.2, [swingTrack('ThermalDoor', 'y', 3.2, 82)]),
  ];
}

function buildArmoredCommandBunker(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'CommandBunker');
  const hd = p.hd;
  const slab = matte('#4b4e4c', 0.9, 'ConcreteSlab');
  const armor = metal('#50565c', 0.46, 0.48, 'BunkerArmor');
  const slitGlass = glass('#1e4b59', '#0c2c38', 'ArmoredSlit');
  const sensorOptic = glow('#ff5430', '#e02810', 1.0, 'SensorOptic');
  // Wide reinforced concrete foundation slab at y = 0
  kshell(b, [0, 0.1, 0], [3.34, 0.2, 2.66], slab, hd, 0.16);
  // Low-profile sloped brutalist reinforced-concrete casemate (p.primary)
  kprism(b, [0, 0.14, 0], [[-1.48, 0], [1.48, 0], [1.14, 1.38], [-1.14, 1.38]], 2.18, p.primary, hd);
  // Overhanging brutalist blast roof cap with p.accent hazard trim
  kshell(b, [0, 1.56, 0], [2.56, 0.24, 2.38], slab, hd, 0.16);
  kbox(b, [0, 1.44, 1.14], [2.24, 0.08, 0.12], p.accent, hd);
  // Heavy angled front brow & recessed panoramic observation slit
  kbox(b, [0, 0.96, 1.05], [1.74, 0.48, 0.22], p.inset, hd);
  kbox(b, [0, 0.96, 1.12], [1.56, 0.34, 0.12], slitGlass, hd);
  for (const sx of [-0.52, 0.52]) kbox(b, [sx, 0.96, 1.18], [0.12, 0.56, 0.1], slab, hd);
  // Vertically sliding armored BlastShutter (y) inside observation slit
  const shutterRest: Point = [0, 0.96, 1.16];
  const shutter = group(b, 'BlastShutter', shutterRest);
  kbox(shutter, [0, 0, 0], [1.62, 0.38, 0.07], armor, hd);
  for (const y of [-0.11, 0.11]) kbox(shutter, [0, y, 0.032], [1.54, 0.055, 0.04], p.accent, hd);
  // Sloped armored concrete side buttresses & rear blast airlock vestibule
  for (const sx of [-1, 1]) {
    for (const z of [-0.56, 0.46]) {
      const rib = kbox(b, [sx * 1.36, 0.78, z], [0.24, 1.24, 0.28], slab, hd);
      rib.rotation.z = sx * 0.22;
    }
  }
  kshell(b, [0, 0.66, -1.16], [1.14, 1.04, 0.44], slab, hd, 0.14);
  kbox(b, [0, 0.62, -1.39], [0.64, 0.84, 0.09], armor, hd);
  kbox(b, [0, 0.86, -1.43], [0.44, 0.08, 0.05], p.accent, hd);
  // Rotating roof SensorTurret (y)
  kcyl(b, [0, 1.72, 0.08], 0.56, 0.62, 0.16, armor, hd, 12);
  const turret = group(b, 'SensorTurret', [0, 1.82, 0.08]);
  kshell(turret, [0, 0.16, -0.04], [0.76, 0.34, 0.84], armor, hd, 0.26);
  kbox(turret, [0, 0.18, 0.38], [0.48, 0.18, 0.12], p.dark, hd);
  for (const sx of [-0.12, 0.12]) {
    kcyl(turret, [sx, 0.18, 0.45], 0.06, 0.06, 0.08, sensorOptic, hd, 10).rotation.x = Math.PI / 2;
  }
  kbox(turret, [0, 0.35, -0.08], [0.46, 0.06, 0.48], p.accent, hd);
  kcyl(turret, [-0.26, 0.54, -0.26], 0.018, 0.028, 0.44, armor, hd, 6);
  if (detail) {
    for (const x of [-1.18, -0.58, 0.58, 1.18]) kcyl(b, [x, 0.34, 1.24], 0.08, 0.1, 0.34, p.accent, hd, 8);
    for (const sx of [-0.74, 0.74]) {
      kshell(b, [sx, 1.18, -1.16], [0.36, 0.28, 0.26], armor, hd, 0.14);
      kbox(b, [sx, 1.18, -1.29], [0.24, 0.16, 0.05], p.inset, hd);
    }
    if (hd) {
      kboltring(b, 0, 1.78, 0.08, 0.58, 10, p.accent, true);
      for (const sx of [-1, 1]) kbox(b, [sx * 1.18, 1.56, 0], [0.08, 0.1, 1.94], p.accent, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Sweep perimeter', 4.6, [
      spinTrack('SensorTurret', 'y', 4.6),
      slideTrack('BlastShutter', 'y', shutterRest, 4.6, 0.32),
    ]),
  ];
}

function buildStarportControlSpire(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'ControlSpire');
  const hd = p.hd;
  const pad = matte('#454c56', 0.88, 'TarmacPad');
  const alloy = metal('#9aa8b4', 0.4, 0.54, 'SpireAlloy');
  const cmdGlass = glass('#2c7ea6', '#145478', 'CommandGlass');
  const strobe = glow('#ff7a32', '#ff4810', 1.1, 'NavStrobe');
  // Circular-octagonal starport foundation plinth at y = 0
  kcyl(b, [0, 0.1, 0], 1.18, 1.28, 0.2, pad, hd, 12);
  kshell(b, [0, 0.42, 0.54], [0.92, 0.56, 0.62], p.dark, hd, 0.18);
  kbox(b, [0, 0.44, 0.86], [0.56, 0.36, 0.08], cmdGlass, hd);
  // Waist-pinched flaring composite spire core (p.primary)
  kcyl(b, [0, 0.82, 0], 0.42, 0.68, 1.32, p.primary, hd, 14);
  kcyl(b, [0, 1.88, 0], 0.56, 0.42, 0.96, p.primary, hd, 14);
  // 4 sweeping aerodynamic vertical stabilizer fins embracing the spire
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const fin = kprism(
      b,
      [Math.sin(a) * 0.42, 0.16, Math.cos(a) * 0.42],
      [[0, 0], [0.68, 0.06], [0.46, 0.92], [0.58, 2.04], [0, 2.2]],
      0.16,
      p.primary,
      hd,
    );
    fin.rotation.y = a - Math.PI / 2;
  }
  // Cantilevered 360-degree inverted-frustum angled tinted command deck
  kcyl(b, [0, 2.42, 0], 1.12, 0.58, 0.3, p.dark, hd, 14);
  kcyl(b, [0, 2.8, 0], 1.24, 1.06, 0.52, p.accent, hd, 14);
  kcyl(b, [0, 3.12, 0], 1.16, 1.24, 0.16, p.primary, hd, 14);
  kcyl(b, [0, 3.28, 0], 0.72, 0.94, 0.22, p.dark, hd, 12);
  // Structural command-deck window mullions around all 360 degrees
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    kstrut(b, [Math.sin(a) * 1.04, 2.54, Math.cos(a) * 1.04], [Math.sin(a) * 1.22, 3.08, Math.cos(a) * 1.22], 0.036, alloy, hd, 6);
  }
  // Rotating BeaconRing (y) encircling the upper telemetry deck via hollow outer collar (zero solid-in-solid overlap).
  const beacon = group(b, 'BeaconRing', [0, 3.28, 0]);
  ring(beacon, [0, 0, 0], 0.86, 0.06, 0.09, alloy);
  ktorus(beacon, [0, 0, 0], 0.96, 0.036, p.accent, hd).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    kstrut(beacon, [Math.sin(a) * 0.82, 0, Math.cos(a) * 0.82], [Math.sin(a) * 0.96, 0, Math.cos(a) * 0.96], 0.026, alloy, hd, 6);
    korb(beacon, [Math.sin(a) * 0.96, 0.06, Math.cos(a) * 0.96], 0.065, strobe, hd, 8, 6);
  }
  // Spinning primary ATC RadarBar (y) atop central spire mast
  kcyl(b, [0, 3.52, 0], 0.12, 0.18, 0.42, alloy, hd, 10);
  const radar = group(b, 'RadarBar', [0, 3.74, 0]);
  kshell(radar, [0, 0, 0], [1.46, 0.18, 0.24], p.primary, hd, 0.22);
  kbox(radar, [0, 0, 0.11], [1.28, 0.1, 0.08], p.accent, hd);
  for (const sx of [-0.74, 0.74]) korb(radar, [sx, 0, 0], 0.065, strobe, hd, 8, 6);
  if (detail) {
    // Rear elevator spine & horizontal trim bands
    kbox(b, [0, 1.32, -0.58], [0.34, 2.18, 0.22], alloy, hd);
    for (const y of [0.88, 1.62, 2.32]) ktorus(b, [0, y, 0], 0.52, 0.03, p.accent, hd).rotation.x = Math.PI / 2;
    if (hd) {
      kboltring(b, 0, 3.21, 0, 1.06, 12, alloy, true);
      for (const sx of [-0.46, 0.46]) kcyl(b, [sx, 3.56, -0.26], 0.018, 0.024, 0.44, alloy, true, 6);
    }
  }
  root.animations = [
    new T.AnimationClip('Sweep airspace', 4.4, [
      spinTrack('RadarBar', 'y', 4.4, 2),
      spinTrack('BeaconRing', 'y', 4.4, -1),
    ]),
  ];
}

function buildMegacorpDataMonolith(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'DataMonolith');
  const hd = p.hd;
  const plaza = matte('#353944', 0.88, 'GranitePlaza');
  const smoked = glass('#1e303e', '#0a202c', 'SmokedServerGlass');
  const fiber = glow('#36f2cf', '#10c4a8', 1.1, 'FiberOptic');
  const alloy = metal('#6c7684', 0.4, 0.54, 'MonolithAlloy');
  // Stepped obsidian plaza plinth at y = 0
  kshell(b, [0, 0.1, 0], [2.56, 0.2, 2.34], plaza, hd, 0.14);
  // 4-tier stepped obsidian-and-glass monolithic server ziggurat (p.primary)
  kshell(b, [0, 0.64, 0], [2.04, 0.96, 1.84], p.primary, hd, 0.1);
  kshell(b, [0, 1.56, 0], [1.74, 0.96, 1.58], p.primary, hd, 0.1);
  kshell(b, [0, 2.42, 0], [1.44, 0.86, 1.32], p.primary, hd, 0.1);
  kshell(b, [0, 3.08, 0], [1.06, 0.58, 0.98], p.dark, hd, 0.12);
  // Recessed smoked-glass curtain walls wrapping front & back
  kbox(b, [0, 0.68, 0.93], [1.24, 0.72, 0.08], smoked, hd);
  kbox(b, [0, 2.42, 0.67], [0.96, 0.64, 0.08], smoked, hd);
  kbox(b, [0, 1.56, -0.8], [1.14, 0.76, 0.08], smoked, hd);
  // Projecting vertical fiber-optic cooling fins running up all 4 faces (p.accent)
  for (const sx of [-0.66, 0.66]) {
    kbox(b, [sx, 1.48, 0.86], [0.16, 2.54, 0.24], p.dark, hd);
    kbox(b, [sx, 1.48, 0.99], [0.08, 2.42, 0.08], p.accent, hd);
    kbox(b, [sx, 1.48, -0.86], [0.16, 2.54, 0.24], p.dark, hd);
    kbox(b, [sx, 1.48, -0.99], [0.08, 2.42, 0.08], p.accent, hd);
  }
  for (const sz of [-0.48, 0.48]) {
    kbox(b, [0.96, 1.32, sz], [0.22, 2.18, 0.16], p.dark, hd);
    kbox(b, [1.08, 1.32, sz], [0.08, 2.06, 0.08], fiber, hd);
    kbox(b, [-0.96, 1.32, sz], [0.22, 2.18, 0.16], p.dark, hd);
    kbox(b, [-1.08, 1.32, sz], [0.08, 2.06, 0.08], fiber, hd);
  }
  // Mid-tier thermal core & vertically sliding armored CoolingVents (y)
  kbox(b, [0, 1.56, 0.79], [1.02, 0.72, 0.12], p.inset, hd);
  kbox(b, [0, 1.56, 0.84], [0.84, 0.56, 0.07], fiber, hd);
  const ventsRest: Point = [0, 1.56, 0.89];
  const vents = group(b, 'CoolingVents', ventsRest);
  kbox(vents, [0, 0, 0], [0.96, 0.64, 0.06], alloy, hd);
  for (const y of [-0.2, 0, 0.2]) kbox(vents, [0, y, 0.032], [0.86, 0.09, 0.04], p.dark, hd);
  // Rooftop quantum laser UplinkTurret (y)
  kcyl(b, [0, 3.44, 0], 0.34, 0.42, 0.22, alloy, hd, 8);
  const turret = group(b, 'UplinkTurret', [0, 3.58, 0]);
  kshell(turret, [0, 0.12, 0], [0.56, 0.28, 0.62], p.primary, hd, 0.22);
  const barrel = kcyl(turret, [0, 0.24, 0.32], 0.09, 0.13, 0.44, alloy, hd, 10);
  barrel.rotation.x = deg(66);
  const emitter = kcyl(turret, [0, 0.32, 0.5], 0.07, 0.07, 0.08, p.accent, hd, 10);
  emitter.rotation.x = deg(66);
  ktorus(turret, [0, 0.26, 0.36], 0.15, 0.028, fiber, hd).rotation.x = deg(-24);
  if (detail) {
    for (const y of [0.52, 0.84, 2.28, 2.58]) {
      kbox(b, [0, y, 0.99], [1.14, 0.045, 0.045], fiber, hd);
    }
    for (const x of [-0.94, 0.94]) kcyl(b, [x, 0.32, 1.04], 0.06, 0.08, 0.28, p.accent, hd, 8);
    if (hd) {
      kboltring(b, 0, 3.38, 0, 0.46, 8, alloy, true);
      for (const sx of [-0.46, 0.46]) khose(b, [[sx, 3.16, -0.34], [sx * 1.15, 2.74, -0.62], [sx * 1.24, 2.18, -0.78]], 0.03, p.accent, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Laser uplink', 4.6, [
      spinTrack('UplinkTurret', 'y', 4.6),
      slideTrack('CoolingVents', 'y', ventsRest, 4.6, 0.34),
    ]),
  ];
}

function buildLunarMiningRefinery(root: T.Group, p: Finish, detail: boolean) {
  const b = group(root, 'LunarRefinery');
  const hd = p.hd;
  const lunarPad = matte('#74777d', 0.92, 'LunarBasalt');
  const steel = metal('#586572', 0.44, 0.52, 'RefinerySteel');
  const siloMat = metal('#cfd5dc', 0.4, 0.48, 'HeliumSilo');
  const lamp = glow('#ffca45', '#ff9818', 1.0, 'WorkFlood');
  // Cratered lunar basalt foundation pad at y = 0
  kshell(b, [0, 0.1, 0], [3.28, 0.2, 2.48], lunarPad, hd, 0.18);
  // Central heavy steel processing gantry frame (p.primary + p.accent)
  for (const sx of [-0.66, 0.42]) {
    for (const sz of [-0.64, 0.58]) {
      kstrut(b, [sx, 0.16, sz], [sx, 2.02, sz], 0.075, p.accent, hd, 8);
    }
  }
  kshell(b, [-0.12, 2.02, -0.03], [1.42, 0.24, 1.48], p.primary, hd, 0.12);
  kshell(b, [-0.12, 0.42, -0.03], [1.34, 0.48, 1.38], p.dark, hd, 0.14);
  // Twin spherical pressurized helium-3/O2 storage silos on right flank
  for (const sz of [-0.52, 0.48]) {
    korb(b, [1.06, 1.08, sz], 0.46, siloMat, hd, 12, 8);
    ktorus(b, [1.06, 1.08, sz], 0.47, 0.044, p.primary, hd).rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + 0.3;
      kstrut(b, [1.06 + Math.sin(a) * 0.34, 0.16, sz + Math.cos(a) * 0.34], [1.06 + Math.sin(a) * 0.26, 0.88, sz + Math.cos(a) * 0.26], 0.046, steel, hd, 6);
    }
    kstrut(b, [0.64, 1.18, sz], [0.24, 1.36, sz * 0.7], 0.055, p.accent, hd, 8);
  }
  // Inclined regolith conveyor belt & funnel intake hopper on left flank
  const conv = group(b, 'Conveyor', [-1.14, 1.54, -0.06]);
  conv.rotation.z = 0.56;
  kbox(conv, [0, 0, 0], [0.92, 0.14, 0.52], steel, hd);
  kbox(conv, [0, 0.09, 0], [0.84, 0.06, 0.38], p.tire, hd);
  for (const sz of [-0.26, 0.26]) kbox(conv, [0, 0.12, sz], [0.88, 0.1, 0.05], p.primary, hd);
  kstrut(b, [-1.52, 0.16, -0.06], [-1.52, 1.18, -0.06], 0.06, steel, hd, 8);
  kcyl(b, [-1.56, 1.24, -0.06], 0.38, 0.18, 0.38, p.primary, hd, 8);
  kcyl(b, [-0.32, 2.3, -0.06], 0.48, 0.24, 0.38, p.accent, hd, 8);
  // Exposed horizontal spinning rotary CrusherDrum (z) inside gantry frame
  const drum = group(b, 'CrusherDrum', [-0.12, 1.24, -0.03]);
  kcyl(drum, [0, 0, 0], 0.42, 0.42, 1.08, p.primary, hd, 12).rotation.x = Math.PI / 2;
  for (const z of [-0.46, 0, 0.46]) ktorus(drum, [0, 0, z], 0.43, 0.045, p.accent, hd);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const bar = kbox(drum, [Math.cos(a) * 0.43, Math.sin(a) * 0.43, 0], [0.09, 0.09, 0.96], steel, hd);
    bar.rotation.z = a;
  }
  // Trunnion axle hubs anchoring drum to gantry front & rear
  for (const sz of [-0.62, 0.56]) kcyl(b, [-0.12, 1.24, sz], 0.16, 0.18, 0.24, p.dark, hd, 10).rotation.x = Math.PI / 2;
  // Tilting front OreChute (x) mounted beneath processing deck
  const chute = group(b, 'OreChute', [-0.12, 0.72, 0.62]);
  const trough = kbox(chute, [0, -0.08, 0.28], [0.64, 0.14, 0.66], p.accent, hd);
  trough.rotation.x = 0.24;
  for (const sx of [-0.3, 0.3]) {
    const wall = kbox(chute, [sx, 0.02, 0.28], [0.08, 0.2, 0.66], p.primary, hd);
    wall.rotation.x = 0.24;
  }
  // Rooftop floodlight mast & rear thermal condenser bank
  kcyl(b, [0.36, 2.48, 0.42], 0.036, 0.05, 0.78, steel, hd, 8);
  kbox(b, [0.36, 2.84, 0.48], [0.34, 0.14, 0.12], lamp, hd);
  kshell(b, [-0.12, 1.24, -0.84], [0.84, 0.92, 0.28], steel, hd, 0.12);
  if (detail) {
    for (const x of [-0.42, -0.12, 0.18]) kbox(b, [x, 1.24, -0.99], [0.12, 0.76, 0.06], p.primary, hd);
    khose(b, [[1.06, 1.52, -0.52], [0.76, 1.94, -0.52], [0.34, 2.02, -0.44]], 0.044, p.primary, hd);
    if (hd) {
      kboltring(b, -0.12, 2.15, -0.03, 0.52, 8, steel, true);
      khose(b, [[1.06, 1.52, 0.48], [0.78, 1.92, 0.44], [0.34, 2.02, 0.36]], 0.044, steel, true);
    }
  }
  root.animations = [
    new T.AnimationClip('Refine regolith', 4.4, [
      spinTrack('CrusherDrum', 'z', 4.4, -1),
      swingTrack('OreChute', 'x', 4.4, 28, true),
    ]),
  ];
}

export const buildingsFantasyScifiD: readonly PackBuilderDef[] = [
  {
    id: 'arctic-research-biodome',
    riggedParts: [
      rig('Anemometer', 'Anemometer', 'rotate', 'y', [0, 360], 'Spins the 3-cup polar meteorological wind anemometer'),
      rig('ThermalDoor', 'Thermal door', 'rotate', 'y', [0, 82], 'Swings the insulated high-visibility arctic bulkhead door open'),
    ],
    detachableParts: [],
    build: buildArcticResearchBiodome,
  },
  {
    id: 'armored-command-bunker',
    riggedParts: [
      rig('SensorTurret', 'Sensor turret', 'rotate', 'y', [0, 360], 'Rotates the armored roof optics and rangefinder turret'),
      rig('BlastShutter', 'Blast shutter', 'slide', 'y', [0, 0.32], 'Raises the ribbed armored observation blast shutter'),
    ],
    detachableParts: [],
    build: buildArmoredCommandBunker,
  },
  {
    id: 'starport-control-spire',
    riggedParts: [
      rig('RadarBar', 'Radar bar', 'rotate', 'y', [0, 360], 'Spins the primary phased-array air-traffic control radar bar'),
      rig('BeaconRing', 'Beacon ring', 'rotate', 'y', [0, 360], 'Rotates the upper starport navigation strobe beacon ring'),
    ],
    detachableParts: [],
    build: buildStarportControlSpire,
  },
  {
    id: 'megacorp-data-monolith',
    riggedParts: [
      rig('UplinkTurret', 'Uplink turret', 'rotate', 'y', [0, 360], 'Rotates the rooftop quantum laser-uplink gimbal turret'),
      rig('CoolingVents', 'Cooling vents', 'slide', 'y', [0, 0.34], 'Slides the armored thermal exhaust louvers vertically'),
    ],
    detachableParts: [],
    build: buildMegacorpDataMonolith,
  },
  {
    id: 'lunar-mining-refinery',
    riggedParts: [
      rig('CrusherDrum', 'Crusher drum', 'rotate', 'z', [0, 360], 'Spins the heavy ribbed lunar regolith rotary crusher drum'),
      rig('OreChute', 'Ore chute', 'rotate', 'x', [-28, 28], 'Tilts the front armored regolith discharge ore chute'),
    ],
    detachableParts: [],
    build: buildLunarMiningRefinery,
  },
];
