import * as T from 'three'
import {
  arc,
  archRing,
  cone,
  cyl,
  det,
  gable,
  group,
  kitBox,
  lathe,
  mound,
  orb,
  rock,
  rot,
  spinTrack,
  strut,
  sway,
  swingTrack,
  terraceArc,
  tone,
  torus,
  waterTone,
} from './terrain-structures-kit'
import type { Finish, TerrainStructureSpec } from './terrain-structures-kit'

function buildVillageWell(root: T.Group, p: Finish, detail: boolean) {
  const cobble = tone(p, 'Cobble pad stone', '#7b7872', 0.88)
  const oak = tone(p, 'Well oak timber', '#644832', 0.85)
  const bucketWood = tone(p, 'Bucket stave wood', '#8d6641', 0.84)
  const water = waterTone(p, 'Deep well water', '#286578', '#0a3542')
  const iron = tone(p, 'Forged well iron', '#373c42', 0.46, 0.52)
  const rope = tone(p, 'Well hoist rope', '#c8ab70', 0.86)
  const moss = tone(p, 'Well base moss', '#547844', 0.88)

  const scene = group(root, 'RoofedVillageWell')
  cyl(scene, p, [0, 0.07, 0], 1.22, 1.28, 0.14, cobble, [0, 0, 0], 12)
  lathe(
    scene,
    p,
    [0, 0.06, 0],
    [[0.005, 0], [0.66, 0], [0.64, 0.72], [0.46, 0.72], [0.44, 0.34], [0.005, 0.34]],
    p.accent,
    14,
  )
  cyl(scene, p, [0, 0.44, 0], 0.44, 0.44, 0.06, water, [0, 0, 0], 14)
  torus(scene, p, [0, 0.8, 0], 0.56, 0.1, cobble, [Math.PI / 2, 0, 0], 7, 16)

  for (const sx of [-1, 1]) {
    kitBox(scene, p, [sx * 0.58, 1.18, 0], [0.12, 1.38, 0.12], oak)
    strut(scene, p, [sx * 0.56, 1.54, 0], [sx * 0.26, 1.84, 0], 0.042, oak, 6)
    gable(scene, p, [sx * 0.64, 1.78, 0], 1.32, 0.64, 0.1, oak, Math.PI / 2)
  }
  for (const sz of [-1, 1]) {
    kitBox(scene, p, [0, 2.08, sz * 0.38], [1.62, 0.075, 0.94], p.primary, [sz * 0.76, 0, 0])
  }
  kitBox(scene, p, [0, 2.44, 0], [1.7, 0.1, 0.14], oak)

  const windlass = group(scene, 'WellWindlass', [0, 1.44, 0])
  cyl(windlass, p, [0, 0, 0], 0.085, 0.085, 1.06, oak, [0, 0, Math.PI / 2], 10)
  for (const ox of [-0.14, 0, 0.14]) torus(windlass, p, [ox, 0, 0], 0.095, 0.024, rope, [0, Math.PI / 2, 0])
  cyl(windlass, p, [0.62, 0, 0], 0.032, 0.032, 0.22, iron, [0, 0, Math.PI / 2], 8)
  kitBox(windlass, p, [0.72, 0.12, 0], [0.04, 0.28, 0.05], iron)
  cyl(windlass, p, [0.8, 0.24, 0], 0.026, 0.026, 0.16, oak, [0, 0, Math.PI / 2], 8)

  cyl(scene, p, [0, 1.24, 0.06], 0.016, 0.016, 0.36, rope, [0, 0, 0], 6)
  torus(scene, p, [0, 1.06, 0.06], 0.1, 0.014, iron, [0, 0, 0], 6, 12)
  lathe(
    scene,
    p,
    [0, 0.84, 0.06],
    [[0.005, 0], [0.1, 0], [0.13, 0.22], [0.11, 0.22], [0.09, 0.05], [0.005, 0.05]],
    bucketWood,
    10,
  )
  cyl(scene, p, [0, 0.99, 0.06], 0.11, 0.11, 0.03, water, [0, 0, 0], 10)

  const pail = group(scene, 'WaterPail', [0.84, 0.12, 0.44])
  lathe(
    pail,
    p,
    [0, 0, 0],
    [[0.005, 0], [0.13, 0], [0.16, 0.28], [0.14, 0.28], [0.12, 0.06], [0.005, 0.06]],
    bucketWood,
    10,
  )
  torus(pail, p, [0, 0.08, 0], 0.14, 0.015, iron, [Math.PI / 2, 0, 0])
  torus(pail, p, [0, 0.22, 0], 0.155, 0.015, iron, [Math.PI / 2, 0, 0])
  cyl(pail, p, [0, 0.22, 0], 0.135, 0.135, 0.03, water, [0, 0, 0], 10)
  torus(pail, p, [0, 0.28, 0], 0.13, 0.014, iron, [0, 0.4, 0], 6, 12)

  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8
      kitBox(scene, p, [Math.cos(a) * 0.64, 0.42 + (i % 2) * 0.18, Math.sin(a) * 0.64], [0.12, 0.14, 0.22], cobble, [0, -a, 0])
    }
    for (const sz of [-1, 1]) {
      for (const oy of [-0.14, 0.08]) {
        kitBox(scene, p, [0, 2.1 + oy, sz * (0.44 - oy * 0.9)], [1.56, 0.03, 0.18], p.primary, [sz * 0.76, 0, 0])
      }
    }
    orb(scene, p, [-0.66, 0.16, 0.36], [0.22, 0.07, 0.18], moss, 7)
    orb(scene, p, [0.46, 0.16, -0.58], [0.2, 0.07, 0.16], moss, 7)
  }

  root.animations = [new T.AnimationClip('Crank well windlass', 3.4, [spinTrack('WellWindlass', 'x', 3.4, 1)])]
}

function buildWindmillRuin(root: T.Group, p: Finish, detail: boolean) {
  const hill = tone(p, 'Hillock grass', '#5b7a48', 0.88)
  const mortar = tone(p, 'Dark fieldstone', '#767067', 0.88)
  const wood = tone(p, 'Weathered sail timber', '#7a5838', 0.85)
  const cloth = tone(p, 'Tattered sailcloth', '#d8ccb2', 0.82)
  const darkVoid = tone(p, 'Doorway shadow', '#2b2928', 0.92)
  const iron = tone(p, 'Mill axle iron', '#3a3e44', 0.46, 0.52)

  const scene = group(root, 'IvyDrapedWindmillRuin')
  mound(scene, p, [0, 0, 0], 1.44, 0.24, 1.38, hill, 14)
  kitBox(scene, p, [0, 0.2, 0.84], [0.74, 0.08, 0.42], mortar)

  lathe(
    scene,
    p,
    [0, 0.12, -0.06],
    [[0.005, 0], [0.84, 0], [0.76, 0.85], [0.68, 1.56], [0.64, 1.98], [0.005, 1.98]],
    p.primary,
    16,
  )

  const rimBlocks: readonly [number, number, number][] = [
    [-0.46, 0.28, 0.54], [-0.56, -0.18, 0.44], [-0.24, -0.52, 0.62], [0.22, -0.52, 0.52],
    [0.52, -0.18, 0.34], [0.46, 0.26, 0.22], [0.04, 0.54, 0.28], [-0.34, 0.44, 0.36],
  ]
  for (let i = 0; i < rimBlocks.length; i++) {
    const rb = rimBlocks[i]
    if (!rb) continue
    kitBox(scene, p, [rb[0], 2.04 + rb[2] * 0.5, rb[1] - 0.06], [0.28, rb[2], 0.26], i % 2 === 0 ? p.primary : mortar, [0, i * 0.78, 0])
  }

  for (const sx of [-1, 1]) kitBox(scene, p, [sx * 0.28, 0.58, 0.68], [0.14, 0.76, 0.28], mortar)
  archRing(scene, p, [0, 0.94, 0.68], 0.22, 0.36, 0.3, mortar)
  kitBox(scene, p, [0, 0.64, 0.6], [0.42, 0.82, 0.16], darkVoid)

  arc(scene, p, [[-0.78, 0.24, 0.14], [-0.74, 1.05, 0.28], [-0.66, 1.88, 0.18], [-0.46, 2.42, 0.22]], 0.032, p.accent, 12, 5)
  arc(scene, p, [[0.66, 0.24, -0.34], [0.7, 1.12, -0.18], [0.58, 1.98, -0.26], [0.22, 2.54, -0.52]], 0.028, p.accent, 12, 5)
  for (const [ix, iy, iz, sc] of [
    [-0.76, 0.72, 0.26, 0.16], [-0.72, 1.38, 0.26, 0.18], [-0.62, 2.02, 0.22, 0.2],
    [-0.44, 2.46, 0.26, 0.18], [0.68, 0.88, -0.22, 0.16], [0.62, 1.66, -0.24, 0.18], [0.28, 2.52, -0.46, 0.17],
  ] as const) {
    orb(scene, p, [ix, iy, iz], [sc, sc * 0.82, sc * 0.78], p.accent, 8)
  }

  cyl(scene, p, [0, 1.96, 0.58], 0.11, 0.13, 0.44, wood, [Math.PI / 2, 0, 0], 10)
  cyl(scene, p, [0, 1.96, 0.74], 0.14, 0.14, 0.08, iron, [Math.PI / 2, 0, 0], 10)

  const sails = group(scene, 'BrokenSails', [0, 1.96, 0.8])
  cyl(sails, p, [0, 0, 0], 0.12, 0.12, 0.16, wood, [Math.PI / 2, 0, 0], 8)
  const arms: readonly [number, number, boolean][] = [
    [0.35, 1.08, true],
    [0.35 + Math.PI / 2, 0.96, true],
    [0.35 + Math.PI, 0.62, false],
    [0.35 + Math.PI * 1.5, 0.36, false],
  ]
  for (const [ang, len, hasCloth] of arms) {
    const armG = group(sails, '', [0, 0, 0])
    armG.rotation.z = ang
    kitBox(armG, p, [0, len * 0.5, 0], [0.07, len, 0.06], wood)
    const bars = hasCloth ? 4 : 2
    for (let k = 1; k <= bars; k++) {
      const y = 0.22 + k * 0.2
      if (y < len - 0.06) kitBox(armG, p, [0.12, y, 0.02], [0.28, 0.035, 0.035], wood)
    }
    if (hasCloth) kitBox(armG, p, [0.15, len * 0.62, 0.045], [0.22, len * 0.52, 0.025], cloth)
  }

  const millstone = group(scene, 'Millstone', [0.92, 0.14, 0.48])
  rock(millstone, p, [-0.14, 0, -0.06], [0.16, 0.12, 0.14], mortar, 2.2)
  cyl(millstone, p, [0.04, 0.26, 0.04], 0.3, 0.3, 0.14, mortar, [0.42, -0.5, 1.18], 14)
  cyl(millstone, p, [0.04, 0.26, 0.04], 0.08, 0.08, 0.165, darkVoid, [0.42, -0.5, 1.18], 8)

  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + 0.4
      kitBox(scene, p, [Math.cos(a) * 0.76, 0.65 + (i % 3) * 0.42, Math.sin(a) * 0.76 - 0.06], [0.18, 0.14, 0.16], mortar, [0, -a, 0])
    }
    for (const [rx, rz, sd] of [[-0.96, 0.54, 1.7], [0.88, -0.52, 4.1], [-0.54, -0.96, 6.2]] as const) {
      rock(scene, p, [rx, 0.1, rz], [0.16, 0.11, 0.14], mortar, sd)
    }
  }

  root.animations = [new T.AnimationClip('Creaking mill sails', 7.2, [spinTrack('BrokenSails', 'z', 7.2, 1)])]
}

function buildRicePaddy(root: T.Group, p: Finish, detail: boolean) {
  const soil = tone(p, 'Terrace wet earth', '#6c543c', 0.9)
  const water = waterTone(p, 'Flooded paddy water', '#4598a6', '#104e59')
  const bamboo = tone(p, 'Irrigation bamboo', '#868044', 0.8)
  const straw = tone(p, 'Golden rice straw', '#d4b462', 0.86)
  const stone = tone(p, 'Bund retaining stone', '#7d786e', 0.88)
  const bore = tone(p, 'Spout bore dark', '#2d2922', 0.9)

  const scene = group(root, 'TerracedRicePaddy')
  kitBox(scene, p, [0, 0.09, 0], [3.26, 0.18, 2.48], soil)
  kitBox(scene, p, [0, 0.72, -0.96], [2.36, 1.18, 0.42], soil)

  const cz = -0.84
  const startA = -Math.PI + 0.18
  const endA = -0.18
  const tiers: readonly [number, number, number, number, number][] = [
    [1.06, 1.54, 0.34, 0.44, 14],
    [0.62, 1.12, 0.68, 0.78, 10],
    [0.02, 0.68, 1.02, 1.12, 6],
  ]
  for (let t = 0; t < tiers.length; t++) {
    const tier = tiers[t]
    if (!tier) continue
    const [rIn, rOut, hFloor, hBund, shoots] = tier
    const aPad = t * 0.06
    terraceArc(scene, p, [0, 0.14, cz], rIn, rOut, hFloor, startA + aPad + 0.025, endA - aPad - 0.025, soil)
    terraceArc(scene, p, [0, 0.14, cz], rOut - 0.1, rOut + 0.04, hBund, startA + aPad, endA - aPad, p.accent)
    terraceArc(scene, p, [0, 0.14 + hFloor - 0.04, cz], rIn + 0.04, rOut - 0.13, 0.08, startA + aPad + 0.06, endA - aPad - 0.06, water)
    const midR = (rIn + rOut - 0.1) * 0.5
    for (let k = 0; k < shoots; k++) {
      const a = startA + 0.24 + (k / Math.max(1, shoots - 1)) * (endA - startA - 0.48)
      const sx = Math.cos(a) * midR
      const sz = cz - Math.sin(a) * midR
      cone(scene, p, [sx, 0.24 + hFloor, sz], 0.075, 0.24, p.primary, [0.1, a, 0.08], 6)
    }
  }

  for (const sx of [-0.18, 0.18]) cyl(scene, p, [sx, 1.18, -0.18], 0.036, 0.042, 0.64, bamboo, [0, 0, 0], 8)
  cyl(scene, p, [0, 1.36, -0.18], 0.022, 0.022, 0.44, bamboo, [0, 0, Math.PI / 2], 6)
  cyl(scene, p, [0, 1.58, -0.46], 0.042, 0.046, 0.66, bamboo, [Math.PI * 0.42, 0, 0], 8)

  const spout = group(scene, 'WaterSpout', [0, 1.36, -0.18])
  cyl(spout, p, [0, 0, 0.04], 0.058, 0.064, 0.72, p.accent, [Math.PI * 0.44, 0, 0], 10)
  torus(spout, p, [0, 0, 0], 0.074, 0.018, bamboo, [Math.PI / 2, 0, 0])
  cyl(spout, p, [0, 0.07, 0.39], 0.042, 0.042, 0.025, bore, [Math.PI * 0.44, 0, 0], 8)

  const sheaves = group(scene, 'HarvestSheaves', [1.14, 0.14, 0.76])
  for (const ox of [-0.26, 0.26]) cyl(sheaves, p, [ox, 0.28, -0.08], 0.028, 0.032, 0.56, bamboo, [0, 0, 0], 6)
  cyl(sheaves, p, [0, 0.48, -0.08], 0.025, 0.025, 0.62, bamboo, [0, 0, Math.PI / 2], 6)
  for (const ox of [-0.16, 0, 0.16]) {
    cyl(sheaves, p, [ox, 0.24, 0.04], 0.075, 0.1, 0.46, straw, [-0.14, 0, 0], 8)
    torus(sheaves, p, [ox, 0.26, 0.04], 0.084, 0.018, bamboo, [Math.PI / 2, 0, 0])
    cone(sheaves, p, [ox, 0.5, 0.01], 0.11, 0.18, straw, [-0.14, 0, 0], 8)
  }

  if (detail) {
    cyl(scene, p, [0, 1.14, 0.14], 0.018, 0.024, 0.48, water, [0, 0, 0], 6)
    for (let i = 0; i < 6; i++) {
      const a = startA + 0.3 + i * 0.42
      rock(scene, p, [Math.cos(a) * 1.56, 0.12, cz - Math.sin(a) * 1.56], [0.12, 0.11, 0.1], stone, i * 1.9)
    }
    for (let k = 0; k < 6; k++) {
      const a = startA + 0.35 + k * 0.38
      orb(scene, p, [Math.cos(a) * 1.24, 0.62, cz - Math.sin(a) * 1.24], [0.06, 0.12, 0.06], p.primary, 6)
    }
  }

  root.animations = [
    new T.AnimationClip('Bamboo water tip', 3.6, [
      swingTrack('WaterSpout', 'x', 3.6, 26, true),
    ]),
  ]
}

function buildCemeteryGate(root: T.Group, p: Finish, detail: boolean) {
  const cobble = tone(p, 'Graveyard cobble', '#74726c', 0.88)
  const flagstone = tone(p, 'Walkway flagstone', '#8b8880', 0.86)
  const plinthStone = tone(p, 'Mossy plinth stone', '#696860', 0.9)
  const moss = tone(p, 'Cemetery moss', '#4f7042', 0.88)
  const bronze = tone(p, 'Weathered bronze finial', '#7a6844', 0.48, 0.45)

  const scene = group(root, 'WroughtIronCemeteryGate')
  kitBox(scene, p, [0, 0.07, 0], [3.38, 0.14, 1.54], cobble)
  kitBox(scene, p, [0, 0.155, 0], [1.46, 0.05, 1.44], flagstone)

  for (const sx of [-1, 1]) {
    const px = sx * 0.88
    kitBox(scene, p, [px, 0.22, 0], [0.54, 0.24, 0.54], plinthStone)
    kitBox(scene, p, [px, 1.02, 0], [0.42, 1.46, 0.42], p.primary)
    kitBox(scene, p, [px, 1.78, 0], [0.56, 0.12, 0.56], plinthStone)
    lathe(
      scene,
      p,
      [px, 1.84, 0],
      [[0.005, 0], [0.16, 0], [0.12, 0.1], [0.19, 0.28], [0.17, 0.42], [0.09, 0.52], [0.12, 0.58], [0.005, 0.62]],
      p.primary,
      12,
    )
    orb(scene, p, [px, 2.48, 0], [0.055, 0.065, 0.055], bronze, 7)

    kitBox(scene, p, [sx * 1.36, 0.44, 0], [0.56, 0.68, 0.3], p.primary)
    kitBox(scene, p, [sx * 1.36, 0.8, 0], [0.62, 0.08, 0.36], plinthStone)
    kitBox(scene, p, [sx * 1.36, 1.36, 0], [0.52, 0.04, 0.045], p.accent)
    for (const dx of [-0.18, 0, 0.18]) {
      cyl(scene, p, [sx * 1.36 + dx, 1.14, 0], 0.018, 0.018, 0.66, p.accent, [0, 0, 0], 6)
      cone(scene, p, [sx * 1.36 + dx, 1.5, 0], 0.034, 0.1, p.accent, [0, 0, 0], 6)
    }
  }

  archRing(scene, p, [0, 1.72, 0], 0.64, 0.71, 0.08, p.accent)
  archRing(scene, p, [0, 1.72, 0], 0.8, 0.87, 0.08, p.accent)
  for (let i = 0; i < 7; i++) {
    const a = 0.24 + (i / 6) * (Math.PI - 0.48)
    torus(scene, p, [Math.cos(a) * 0.755, 1.72 + Math.sin(a) * 0.755, 0], 0.062, 0.016, p.accent, [0, 0, 0], 6, 10)
  }
  cone(scene, p, [0, 2.68, 0], 0.055, 0.24, p.accent, [0, 0, 0], 6)

  const buildGateLeaf = (name: string, sx: number) => {
    const dir = -sx
    const leaf = group(scene, name, [sx * 0.66, 0.2, 0])
    cyl(leaf, p, [0, 0.76, 0], 0.026, 0.026, 1.44, p.accent, [0, 0, 0], 8)
    for (const ry of [0.22, 0.76, 1.34]) {
      kitBox(leaf, p, [dir * 0.31, ry, 0], [0.62, 0.045, 0.045], p.accent)
    }
    for (let i = 1; i <= 5; i++) {
      const ox = dir * (i * 0.115)
      const h = 1.24 + i * 0.045
      cyl(leaf, p, [ox, 0.14 + h * 0.5, 0], 0.018, 0.018, h, p.accent, [0, 0, 0], 6)
      cone(leaf, p, [ox, 0.18 + h, 0], 0.036, 0.12, p.accent, [0, 0, 0], 6)
    }
    torus(leaf, p, [dir * 0.32, 1.05, 0], 0.12, 0.018, p.accent, [0, 0, 0], 6, 12)
    torus(leaf, p, [dir * 0.32, 0.49, 0], 0.12, 0.018, p.accent, [0, 0, 0], 6, 12)
    return leaf
  }
  buildGateLeaf('IronGateL', -1)
  buildGateLeaf('IronGateR', 1)

  if (detail) {
    for (const sx of [-1, 1]) {
      orb(scene, p, [sx * 0.94, 1.85, 0.2], [0.16, 0.055, 0.14], moss, 7)
      orb(scene, p, [sx * 1.42, 0.85, -0.12], [0.18, 0.055, 0.12], moss, 7)
      for (const hy of [0.42, 1.44]) kitBox(scene, p, [sx * 0.67, hy, 0], [0.09, 0.06, 0.08], p.accent)
    }
  }

  root.animations = [
    new T.AnimationClip('Creak iron gates', 4.0, [
      swingTrack('IronGateL', 'y', 4.0, 56),
      swingTrack('IronGateR', 'y', 4.0, -56),
    ]),
  ]
}

function buildShipwreckHull(root: T.Group, p: Finish, detail: boolean) {
  const sand = tone(p, 'Coastal beach sand', '#d4b882', 0.9)
  const wetSand = tone(p, 'Wet tide sand', '#a88f60', 0.86)
  const surf = waterTone(p, 'Coastal surf', '#3b8da1', '#0e4957')
  const darkHull = tone(p, 'Tarred hull oak', '#493322', 0.88)
  const iron = tone(p, 'Rusted ship iron', '#523d33', 0.56, 0.46)
  const kelp = tone(p, 'Stranded seaweed', '#466840', 0.88)
  const creamCloth = tone(p, 'Bleached canvas', '#e6dac0', 0.82)

  const scene = group(root, 'BeachedShipwreckHull')
  mound(scene, p, [0, 0, 0], 1.8, 0.24, 1.32, sand, 14)
  kitBox(scene, p, [0.06, 0.1, 0.86], [2.32, 0.08, 0.6], surf)

  const hull = group(scene, 'GalleonHull', [-0.1, 0.18, -0.06])
  hull.rotation.set(0.06, 0.12, -0.18)

  kitBox(hull, p, [0, 0.16, 0], [2.14, 0.2, 0.74], darkHull)
  kitBox(hull, p, [-0.98, 0.54, 0], [0.16, 0.82, 0.84], p.primary)
  kitBox(hull, p, [-0.74, 0.56, 0], [0.58, 0.08, 0.78], darkHull)
  for (let row = 0; row < 4; row++) {
    const len = 2.08 - row * 0.08
    kitBox(hull, p, [-0.04 + row * 0.04, 0.28 + row * 0.16, -0.38 - row * 0.025], [len, 0.14, 0.09], row % 2 === 0 ? p.primary : darkHull)
  }
  kitBox(hull, p, [-0.52, 0.34, 0.38], [1.02, 0.26, 0.09], p.primary)

  arc(hull, p, [[0.94, 0.14, 0], [1.26, 0.42, 0], [1.46, 0.96, 0]], 0.075, darkHull, 10, 6)
  for (let i = 0; i < 6; i++) {
    const rx = -0.58 + i * 0.32
    const h = 0.72 + (i % 2) * 0.14
    arc(
      hull,
      p,
      [[rx, 0.16, 0.18], [rx, 0.32, 0.48], [rx, h, 0.54], [rx, h + 0.22, 0.38]],
      0.044,
      p.primary,
      10,
      6,
    )
    orb(hull, p, [rx, h + 0.22, 0.38], [0.045, 0.045, 0.045], p.primary, 6)
  }

  cyl(hull, p, [0.06, 0.98, -0.02], 0.072, 0.092, 1.66, darkHull, [0, 0, -0.06], 10)
  cone(hull, p, [0.11, 1.84, -0.02], 0.072, 0.22, p.primary, [0.1, 0.4, -0.18], 6)
  strut(hull, p, [0.08, 1.56, -0.02], [-0.94, 0.88, -0.34], 0.02, p.accent, 6)
  strut(hull, p, [0.08, 1.56, -0.02], [1.34, 0.84, 0], 0.02, p.accent, 6)

  const yard = group(hull, 'BrokenYard', [0.08, 1.48, 0.08])
  cyl(yard, p, [0.08, 0, 0], 0.042, 0.05, 1.42, darkHull, [0, 0, 1.38], 8)
  kitBox(yard, p, [-0.18, -0.32, 0.04], [0.54, 0.62, 0.03], p.accent, [0.12, 0.06, -0.18])
  kitBox(yard, p, [0.34, -0.24, 0.07], [0.42, 0.46, 0.028], creamCloth, [-0.08, -0.08, -0.22])
  kitBox(yard, p, [-0.48, -0.22, 0.06], [0.24, 0.36, 0.028], p.accent, [0.08, 0.1, -0.12])

  const barrels = group(scene, 'WashedBarrels', [0.96, 0.14, 0.56])
  lathe(barrels, p, [0, 0, 0], [[0.005, 0], [0.14, 0], [0.19, 0.2], [0.14, 0.4], [0.005, 0.4]], p.primary, 10)
  for (const hy of [0.1, 0.3]) torus(barrels, p, [0, hy, 0], 0.178, 0.014, iron, [Math.PI / 2, 0, 0])
  const tipped = group(barrels, '', [0.34, 0.16, -0.12])
  tipped.rotation.set(0.22, 0.4, Math.PI / 2)
  lathe(tipped, p, [0, -0.18, 0], [[0.005, 0], [0.13, 0], [0.17, 0.18], [0.13, 0.36], [0.005, 0.36]], darkHull, 10)

  if (detail) {
    for (const [kx, kz] of [[-0.56, 0.46], [0.34, 0.48], [-1.04, 0.22]] as const) {
      orb(scene, p, [kx, 0.22, kz], [0.18, 0.06, 0.14], kelp, 7)
    }
    for (const ox of [-0.72, 0.18, 0.82]) {
      kitBox(scene, p, [ox, 0.17, 0.58], [0.44, 0.04, 0.12], wetSand, [0, 0.12, 0])
    }
    kitBox(hull, p, [-0.98, 0.98, -0.26], [0.14, 0.18, 0.34], darkHull)
  }

  root.animations = [new T.AnimationClip('Sea breeze sail', 3.6, [sway('BrokenYard', 'z', 3.6, -0.2, 0.2)])]
}

export const terrainStructuresB: readonly TerrainStructureSpec[] = [
  {
    id: 'roofed-village-well',
    riggedParts: [rot('WellWindlass', 'Well windlass crank', 'x', [0, 360], 'Rotates the wooden well windlass drum and forged iron crank')],
    detachableParts: [det('WaterPail', 'Wooden water pail', 'Removable banded wooden water pail resting on the cobble pad')],
    build: buildVillageWell,
  },
  {
    id: 'ivy-draped-windmill-ruin',
    riggedParts: [rot('BrokenSails', 'Broken mill sails', 'z', [0, 360], 'Rotates the weathered remnant windmill sail frame')],
    detachableParts: [det('Millstone', 'Carved millstone', 'Removable stone millstone wheel propped beside the ruined tower')],
    build: buildWindmillRuin,
  },
  {
    id: 'terraced-rice-paddy',
    riggedParts: [rot('WaterSpout', 'Bamboo water spout', 'x', [-28, 28], 'Tips the bamboo irrigation rocker spout between terraces')],
    detachableParts: [det('HarvestSheaves', 'Rice harvest sheaves', 'Removable bundled golden rice sheaves on a bamboo drying frame')],
    build: buildRicePaddy,
  },
  {
    id: 'wrought-iron-cemetery-gate',
    riggedParts: [
      rot('IronGateL', 'Left cemetery gate', 'y', [0, 82], 'Swings open the left wrought-iron spear-top cemetery gate'),
      rot('IronGateR', 'Right cemetery gate', 'y', [-82, 0], 'Swings open the right wrought-iron spear-top cemetery gate'),
    ],
    detachableParts: [],
    build: buildCemeteryGate,
  },
  {
    id: 'beached-shipwreck-hull',
    riggedParts: [rot('BrokenYard', 'Tattered sail yard', 'z', [-18, 18], 'Sways the broken timber yardarm and tattered canvas sail')],
    detachableParts: [det('WashedBarrels', 'Washed-up barrels', 'Removable iron-hooped oak ship barrels half-buried in the sand')],
    build: buildShipwreckHull,
  },
]
