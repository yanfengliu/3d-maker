import * as T from 'three'
import {
  arc,
  cone,
  cyl,
  det,
  gable,
  glowTone,
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

function buildCaravanTent(root: T.Group, p: Finish, detail: boolean) {
  const sand = tone(p, 'Oasis camp sand', '#d8ba80', 0.9)
  const creamSilk = tone(p, 'Woven cream silk', '#efe2c4', 0.82)
  const indigo = tone(p, 'Nomad indigo rug', '#374c6b', 0.86)
  const cedar = tone(p, 'Tent cedar pole', '#6d4d32', 0.84)
  const rope = tone(p, 'Tent guy rope', '#c8b07e', 0.86)
  const lanternGlow = glowTone(p, 'Caravan lantern glow', '#ffda78', '#ff9e2b')

  const scene = group(root, 'DesertSilkCaravanTent')
  mound(scene, p, [0, 0, 0], 1.66, 0.22, 1.48, sand, 14)
  kitBox(scene, p, [0, 0.215, 0.04], [1.76, 0.05, 1.54], indigo)
  kitBox(scene, p, [0, 0.245, 0.04], [1.44, 0.03, 1.24], p.accent)
  kitBox(scene, p, [0, 0.265, 0.04], [1.14, 0.025, 0.96], indigo)

  for (const sx of [-0.74, 0.74]) {
    cyl(scene, p, [sx, 1.1, 0], 0.036, 0.044, 1.94, cedar, [0, 0, 0], 8)
    orb(scene, p, [sx, 2.12, 0], [0.06, 0.075, 0.06], p.accent, 7)
  }
  cyl(scene, p, [0, 1.98, 0], 0.036, 0.036, 1.66, cedar, [0, 0, Math.PI / 2], 8)
  kitBox(scene, p, [0, 1.96, 0.3], [0.06, 0.06, 0.64], cedar)

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      cyl(scene, p, [sx * 1.06, 0.64, sz * 0.82], 0.028, 0.034, 1.02, cedar, [0, 0, 0], 7)
      cyl(scene, p, [sx * 1.42, 0.2, sz * 1.08], 0.024, 0.02, 0.2, cedar, [0, 0, -sx * 0.28], 6)
      strut(scene, p, [sx * 1.06, 1.12, sz * 0.82], [sx * 1.42, 0.22, sz * 1.08], 0.014, rope, 5)
    }
  }

  for (let i = 0; i < 7; i++) {
    const ox = -0.9 + i * 0.3
    const stripeMat = i % 2 === 0 ? p.primary : creamSilk
    const thick = i % 2 === 0 ? 0.065 : 0.082
    for (const sz of [-1, 1]) {
      kitBox(scene, p, [ox, 1.56, sz * 0.42], [0.29, thick, 1.2], stripeMat, [sz * 0.76, 0, 0])
    }
    kitBox(scene, p, [ox, 0.64, -0.82], [0.29, 0.94, thick], stripeMat)
  }
  for (const sx of [-1, 1]) {
    gable(scene, p, [sx * 0.98, 1.12, 0], 1.68, 0.88, 0.09, p.primary, Math.PI / 2)
    kitBox(scene, p, [sx * 1.02, 0.64, 0], [0.08, 0.94, 1.62], creamSilk)
    cyl(scene, p, [sx * 0.94, 0.66, 0.8], 0.09, 0.1, 0.94, p.primary, [0, 0, 0], 9)
    torus(scene, p, [sx * 0.94, 0.66, 0.8], 0.105, 0.02, p.accent, [Math.PI / 2, 0, 0])
  }
  for (const sz of [-0.88, 0.88]) kitBox(scene, p, [0, 1.12, sz], [2.16, 0.1, 0.08], p.accent)

  const lantern = group(scene, 'CampLantern', [0, 1.92, 0.56])
  cyl(lantern, p, [0, -0.14, 0], 0.015, 0.015, 0.28, p.accent, [0, 0, 0], 6)
  cone(lantern, p, [0, -0.32, 0], 0.12, 0.12, p.accent, [0, 0, 0], 6)
  cyl(lantern, p, [0, -0.46, 0], 0.085, 0.075, 0.18, lanternGlow, [0, 0, 0], 6)
  cone(lantern, p, [0, -0.6, 0], 0.09, 0.1, p.accent, [Math.PI, 0, 0], 6)

  const rolls = group(scene, 'CarpetRolls', [1.14, 0.16, 0.56])
  rolls.rotation.y = -0.32
  cyl(rolls, p, [0, 0.1, 0], 0.09, 0.09, 0.66, indigo, [0, 0, Math.PI / 2], 10)
  cyl(rolls, p, [0, 0.1, 0.19], 0.085, 0.085, 0.64, p.primary, [0, 0, Math.PI / 2], 10)
  cyl(rolls, p, [0, 0.24, 0.09], 0.082, 0.082, 0.62, p.accent, [0, 0, Math.PI / 2], 10)

  if (detail) {
    for (const ox of [-0.36, 0.36]) orb(scene, p, [ox, 0.32, -0.24], [0.22, 0.09, 0.16], p.primary, 8)
    cyl(scene, p, [0, 0.3, 0.12], 0.18, 0.16, 0.04, p.accent, [0, 0, 0], 10)
    lathe(scene, p, [0, 0.32, 0.12], [[0.005, 0], [0.06, 0], [0.085, 0.08], [0.045, 0.16], [0.06, 0.2], [0.005, 0.22]], p.accent, 10)
    for (let i = 0; i < 6; i++) {
      cone(scene, p, [-0.82 + i * 0.33, 1.03, 0.88], 0.036, 0.1, p.accent, [Math.PI, 0, 0], 6)
    }
  }

  root.animations = [new T.AnimationClip('Desert evening lantern', 3.6, [sway('CampLantern', 'z', 3.6, -0.26, 0.26)])]
}

function buildSwampBoardwalk(root: T.Group, p: Finish, detail: boolean) {
  const swampWater = waterTone(p, 'Bayou marsh water', '#2e5c50', '#0d2b24')
  const peat = tone(p, 'Swamp peat mud', '#423d34', 0.92)
  const bark = tone(p, 'Cypress piling bark', '#584637', 0.88)
  const rope = tone(p, 'Boardwalk rail rope', '#bfa470', 0.86)
  const signFace = tone(p, 'Trail sign plaque', '#dfd3b8', 0.8)
  const cattail = tone(p, 'Cattail seed head', '#523424', 0.88)

  const scene = group(root, 'CypressSwampBoardwalk')
  kitBox(scene, p, [0, 0.07, 0], [3.26, 0.14, 2.44], swampWater)
  mound(scene, p, [-1.12, 0.06, 0.72], 0.56, 0.22, 0.48, peat, 10)
  mound(scene, p, [1.14, 0.06, -0.74], 0.58, 0.22, 0.48, peat, 10)
  mound(scene, p, [0.64, 0.06, 0.64], 0.48, 0.2, 0.44, peat, 10)

  for (const [kx, kz, kh] of [[-0.98, -0.68, 0.48], [-0.78, -0.78, 0.34], [0.96, 0.72, 0.44], [0.76, 0.84, 0.3]] as const) {
    cone(scene, p, [kx, kh * 0.5 + 0.08, kz], 0.095, kh, bark, [0, 0, 0], 7)
    orb(scene, p, [kx, kh + 0.04, kz], [0.08, 0.05, 0.08], p.accent, 6)
  }

  kitBox(scene, p, [0, 0.54, 0], [0.98, 0.08, 0.94], bark)
  for (let i = 0; i < 5; i++) {
    kitBox(scene, p, [0, 0.6, -0.38 + i * 0.19], [1.02, 0.05, 0.15], p.primary)
  }

  const addFlight = (sx: number, sz: number) => {
    const flight = group(scene, '', [sx * 0.78, 0.58, sz * 0.44])
    flight.rotation.y = 0.42
    for (const oz of [-0.26, 0.26]) kitBox(flight, p, [0, -0.04, oz], [1.22, 0.08, 0.08], bark)
    for (let i = 0; i < 6; i++) {
      kitBox(flight, p, [-0.5 + i * 0.2, 0.02, 0], [0.16, 0.05, 0.76], p.primary)
    }
  }
  addFlight(-1, 1)
  addFlight(1, -1)
  kitBox(scene, p, [-1.32, 0.36, 0.72], [0.42, 0.08, 0.68], p.primary, [0, 0.42, 0.52])

  const posts: readonly [number, number, boolean][] = [
    [-1.22, 1.04, true], [-0.5, 0.74, true], [0.46, 0.44, true],
    [-0.46, -0.44, true], [0.5, -0.74, true], [1.22, -1.04, true],
    [-1.16, 0.34, false], [1.16, -0.34, false], [0.46, -0.44, false], [-0.46, 0.44, false],
  ]
  for (const [px, pz, tall] of posts) {
    const h = tall ? 1.24 : 0.64
    cyl(scene, p, [px, h * 0.5 + 0.05, pz], 0.052, 0.064, h, bark, [0, 0, 0], 7)
  }
  strut(scene, p, [-0.46, 0.22, -0.44], [0.46, 0.56, -0.44], 0.032, bark, 6)
  strut(scene, p, [-0.46, 0.22, 0.44], [0.46, 0.56, 0.44], 0.032, bark, 6)

  arc(scene, p, [[-1.22, 1.18, 1.04], [-0.86, 1.04, 0.89], [-0.5, 1.18, 0.74]], 0.024, rope, 10, 5)
  arc(scene, p, [[-0.5, 1.18, 0.74], [-0.02, 1.06, 0.59], [0.46, 1.18, 0.44]], 0.024, rope, 10, 5)
  arc(scene, p, [[-0.46, 1.18, -0.44], [0.02, 1.06, -0.59], [0.5, 1.18, -0.74]], 0.024, rope, 10, 5)
  arc(scene, p, [[0.5, 1.18, -0.74], [0.86, 1.04, -0.89], [1.22, 1.18, -1.04]], 0.024, rope, 10, 5)
  kitBox(scene, p, [0, 1.12, -0.44], [0.98, 0.07, 0.09], p.primary)

  const gate = group(scene, 'TrailGate', [-1.22, 0.62, 1.04])
  kitBox(gate, p, [0, 0.28, 0], [0.06, 0.58, 0.06], bark)
  kitBox(gate, p, [0.04, 0.48, -0.32], [0.06, 0.06, 0.66], p.primary)
  kitBox(gate, p, [0.04, 0.14, -0.32], [0.06, 0.06, 0.66], p.primary)
  for (const oz of [-0.16, -0.34, -0.52]) kitBox(gate, p, [0.06, 0.31, oz], [0.035, 0.42, 0.075], bark)
  strut(gate, p, [0.05, 0.14, -0.04], [0.05, 0.48, -0.6], 0.02, bark, 6)

  const sign = group(scene, 'TrailSign', [0.58, 0.12, 0.62])
  sign.rotation.y = -0.35
  cyl(sign, p, [0, 0.56, 0], 0.048, 0.056, 1.12, bark, [0, 0, 0], 7)
  kitBox(sign, p, [0, 1.04, 0.04], [0.58, 0.38, 0.06], p.primary, [-0.25, 0, 0])
  kitBox(sign, p, [0, 1.04, 0.08], [0.46, 0.28, 0.025], signFace, [-0.25, 0, 0])
  kitBox(sign, p, [0, 1.24, 0.02], [0.64, 0.06, 0.22], bark, [0.18, 0, 0])

  if (detail) {
    for (const [lx, lz, lr] of [[-0.24, 0.94, 0.16], [0.16, 0.98, 0.13], [-0.94, -0.18, 0.15], [0.96, 0.22, 0.14]] as const) {
      cyl(scene, p, [lx, 0.155, lz], lr, lr, 0.025, p.accent, [0, 0, 0], 10)
    }
    for (const [cx, cz] of [[-0.64, -0.84], [-0.52, -0.92], [1.18, 0.54], [1.26, 0.42]] as const) {
      cyl(scene, p, [cx, 0.46, cz], 0.015, 0.018, 0.72, p.accent, [0.08, 0, 0.05], 6)
      cyl(scene, p, [cx + 0.02, 0.74, cz + 0.02], 0.032, 0.032, 0.18, cattail, [0.08, 0, 0.05], 7)
    }
  }

  root.animations = [new T.AnimationClip('Open boardwalk gate', 3.6, [swingTrack('TrailGate', 'y', 3.6, 68)])]
}

function buildVineyardArbor(root: T.Group, p: Finish, detail: boolean) {
  const earth = tone(p, 'Vineyard earth', '#7d6447', 0.9)
  const terraceStone = tone(p, 'Terrace limestone', '#a89f8e', 0.88)
  const pillarStone = tone(p, 'Pergola limestone', '#beb5a3', 0.86)
  const cedar = tone(p, 'Arbor cedar beam', '#7d5434', 0.84)
  const oak = tone(p, 'Wine cask oak', '#8c613c', 0.84)
  const brass = tone(p, 'Harvest bronze bell', '#c79a40', 0.4, 0.56)
  const iron = tone(p, 'Cask hoop iron', '#3a3e44', 0.46, 0.54)
  const wire = tone(p, 'Trellis steel wire', '#636870', 0.45, 0.55)

  const scene = group(root, 'HillsideVineyardArbor')
  kitBox(scene, p, [0, 0.08, 0], [3.26, 0.16, 2.48], earth)
  kitBox(scene, p, [0, 0.28, -0.58], [3.04, 0.4, 1.12], terraceStone)
  kitBox(scene, p, [0, 0.48, -0.58], [2.88, 0.05, 0.96], earth)

  for (let i = 0; i < 3; i++) {
    kitBox(scene, p, [0, 0.18 + i * 0.11, 0.22 - i * 0.14], [0.68, 0.1, 0.18], pillarStone)
  }

  for (const sx of [-0.78, 0.78]) {
    for (const sz of [-0.96, -0.14]) {
      kitBox(scene, p, [sx, 0.56, sz], [0.3, 0.16, 0.3], terraceStone)
      kitBox(scene, p, [sx, 1.24, sz], [0.22, 1.28, 0.22], pillarStone)
      kitBox(scene, p, [sx, 1.92, sz], [0.32, 0.1, 0.32], terraceStone)
    }
    kitBox(scene, p, [sx, 2.02, -0.55], [0.14, 0.12, 1.28], cedar)
  }
  for (let i = 0; i < 5; i++) {
    kitBox(scene, p, [0, 2.12, -1.04 + i * 0.245], [2.04, 0.09, 0.09], cedar)
  }
  kitBox(scene, p, [0, 1.98, -0.14], [1.66, 0.1, 0.1], cedar)

  for (const [vx, vy, vz, sc] of [
    [-0.64, 2.26, -0.82, 0.34], [0, 2.3, -0.56, 0.42], [0.66, 2.26, -0.32, 0.36],
    [-0.32, 2.24, -0.24, 0.3], [0.46, 2.24, -0.84, 0.32], [-0.88, 1.62, -0.22, 0.22],
  ] as const) {
    orb(scene, p, [vx, vy, vz], [sc, sc * 0.58, sc * 0.82], p.primary, 8)
    orb(scene, p, [vx, vy - 0.24, vz], [0.075, 0.11, 0.075], p.accent, 7)
  }

  const trellisRows: readonly [number, number, number][] = [
    [-0.92, 0.44, 0.72], [-0.92, 0.9, 0.72], [0.76, 0.22, 0.62],
  ]
  for (const [rx, rz, len] of trellisRows) {
    for (const ox of [-len * 0.5, len * 0.5]) {
      cyl(scene, p, [rx + ox, 0.5, rz], 0.036, 0.044, 0.76, cedar, [0, 0, 0], 7)
    }
    for (const wy of [0.44, 0.76]) strut(scene, p, [rx - len * 0.5, wy, rz], [rx + len * 0.5, wy, rz], 0.014, wire, 5)
    for (let k = -1; k <= 1; k++) {
      orb(scene, p, [rx + k * (len * 0.28), 0.66, rz], [0.22, 0.22, 0.16], p.primary, 8)
      orb(scene, p, [rx + k * (len * 0.28), 0.5, rz + 0.12], [0.065, 0.095, 0.065], p.accent, 6)
    }
  }

  const bell = group(scene, 'VineyardBell', [0, 1.98, -0.14])
  kitBox(bell, p, [0, -0.05, 0], [0.16, 0.08, 0.08], iron)
  lathe(
    bell,
    p,
    [0, -0.36, 0],
    [[0.005, 0.06], [0.15, 0.02], [0.16, 0.06], [0.11, 0.18], [0.08, 0.28], [0.005, 0.3]],
    brass,
    12,
  )
  orb(bell, p, [0, -0.36, 0], [0.042, 0.042, 0.042], iron, 7)
  cyl(bell, p, [0, -0.5, 0], 0.012, 0.012, 0.26, oak, [0, 0, 0], 6)

  const casks = group(scene, 'WineCasks', [1.04, 0.14, 0.74])
  lathe(casks, p, [-0.18, 0, -0.04], [[0.005, 0], [0.15, 0], [0.2, 0.22], [0.15, 0.44], [0.005, 0.44]], oak, 10)
  for (const hy of [0.11, 0.33]) torus(casks, p, [-0.18, hy, -0.04], 0.188, 0.015, iron, [Math.PI / 2, 0, 0])
  kitBox(casks, p, [0.22, 0.08, 0.06], [0.34, 0.12, 0.26], cedar)
  const lying = group(casks, '', [0.22, 0.24, 0.06])
  lying.rotation.z = Math.PI / 2
  lathe(lying, p, [0, -0.2, 0], [[0.005, 0], [0.14, 0], [0.18, 0.2], [0.14, 0.4], [0.005, 0.4]], oak, 10)
  for (const hy of [-0.1, 0.1]) torus(lying, p, [0, hy, 0], 0.172, 0.014, p.accent, [Math.PI / 2, 0, 0])

  if (detail) {
    lathe(casks, p, [-0.18, 0.44, -0.04], [[0.005, 0], [0.06, 0], [0.09, 0.1], [0.04, 0.18], [0.06, 0.22], [0.005, 0.22]], p.accent, 8)
    for (const [rx, rz, sd] of [[-1.32, 0.68, 1.4], [0.34, 0.88, 3.2], [-0.46, 0.94, 5.1]] as const) {
      rock(scene, p, [rx, 0.1, rz], [0.14, 0.09, 0.12], terraceStone, sd)
    }
    for (const ox of [-0.44, 0.44]) orb(scene, p, [ox, 2.02, -0.58], [0.075, 0.11, 0.075], p.accent, 6)
  }

  root.animations = [new T.AnimationClip('Ring harvest bell', 3.4, [swingTrack('VineyardBell', 'x', 3.4, 24, true)])]
}

function buildTideMarkerPier(root: T.Group, p: Finish, detail: boolean) {
  const water = waterTone(p, 'Coastal harbor water', '#2d758c', '#0b3f4f')
  const basalt = tone(p, 'Wet breakwater basalt', '#565c62', 0.88)
  const granite = tone(p, 'Jetty granite boulder', '#7d8288', 0.88)
  const timber = tone(p, 'Salt-bleached jetty wood', '#7a5f45', 0.86)
  const iron = tone(p, 'Marine anchor iron', '#333840', 0.46, 0.56)
  const rope = tone(p, 'Harbor hawser rope', '#c7ab72', 0.86)
  const lensGlow = glowTone(p, 'Tide beacon lens', '#ffe27c', '#ffaa28')

  const scene = group(root, 'CoastalTideMarkerPier')
  kitBox(scene, p, [0, 0.07, 0], [2.86, 0.14, 2.66], water)
  kitBox(scene, p, [0, 0.26, -0.24], [1.38, 0.4, 1.84], basalt)

  const jettyRocks: readonly [number, number, number, number][] = [
    [-0.64, -0.84, 0.36, 1.1], [0.62, -0.78, 0.34, 2.3], [-0.72, -0.14, 0.32, 3.5],
    [0.68, -0.12, 0.34, 4.7], [-0.6, 0.46, 0.3, 5.9], [0.64, 0.42, 0.28, 7.1],
  ]
  for (const [rx, rz, sc, sd] of jettyRocks) {
    rock(scene, p, [rx, 0.06, rz], [sc, sc * 0.82, sc * 0.92], sd % 2 > 1 ? granite : basalt, sd)
  }

  for (const z of [-0.88, -0.26, 0.36, 0.88]) {
    for (const sx of [-0.42, 0.42]) {
      cyl(scene, p, [sx, 0.36, z], 0.06, 0.072, 0.62, timber, [0, 0, 0], 8)
    }
  }
  kitBox(scene, p, [0, 0.64, -0.04], [1.02, 0.09, 2.08], timber)
  kitBox(scene, p, [0, 0.42, -1.16], [0.84, 0.08, 0.34], timber, [0.46, 0, 0])

  for (const z of [-0.84, -0.28, 0.28]) cyl(scene, p, [-0.46, 0.94, z], 0.04, 0.045, 0.64, timber, [0, 0, 0], 7)
  kitBox(scene, p, [-0.46, 1.22, -0.28], [0.06, 0.06, 1.24], timber)

  torus(scene, p, [-0.54, 0.98, 0.28], 0.17, 0.048, p.primary, [0, Math.PI / 2, 0], 8, 16)
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    kitBox(scene, p, [-0.54, 0.98 + Math.sin(a) * 0.17, 0.28 + Math.cos(a) * 0.17], [0.11, 0.055, 0.055], p.accent, [a, 0, 0])
  }

  kitBox(scene, p, [0.58, 0.88, 0.66], [0.16, 1.56, 0.06], p.accent)
  kitBox(scene, p, [0.34, 0.64, 0.66], [0.44, 0.07, 0.07], iron)
  for (let i = 0; i < 6; i++) {
    kitBox(scene, p, [0.58, 0.32 + i * 0.23, 0.66], [0.18, 0.065, 0.09], p.primary)
  }

  cyl(scene, p, [0, 0.94, 0.84], 0.22, 0.28, 0.56, p.primary, [0, 0, 0], 8)
  cyl(scene, p, [0, 1.38, 0.84], 0.19, 0.22, 0.36, p.accent, [0, 0, 0], 8)
  cyl(scene, p, [0, 1.68, 0.84], 0.17, 0.19, 0.28, p.primary, [0, 0, 0], 8)
  torus(scene, p, [0, 1.84, 0.84], 0.24, 0.032, iron, [Math.PI / 2, 0, 0])

  const beacon = group(scene, 'TideBeacon', [0, 1.88, 0.84])
  cyl(beacon, p, [0, 0.04, 0], 0.16, 0.18, 0.08, iron, [0, 0, 0], 10)
  cyl(beacon, p, [0, 0.2, 0], 0.12, 0.12, 0.26, lensGlow, [0, 0, 0], 10)
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    cyl(beacon, p, [Math.cos(a) * 0.14, 0.2, Math.sin(a) * 0.14], 0.015, 0.015, 0.28, iron, [0, 0, 0], 6)
  }
  cone(beacon, p, [0, 0.42, 0], 0.21, 0.2, p.primary, [0, 0, 0], 10)
  kitBox(beacon, p, [0, 0.2, -0.15], [0.22, 0.22, 0.04], p.accent)

  const anchor = group(scene, 'AnchorPost', [-0.88, 0.14, -0.58])
  cyl(anchor, p, [0, 0.22, 0], 0.11, 0.13, 0.44, iron, [0, 0, 0], 8)
  cyl(anchor, p, [0, 0.44, 0], 0.15, 0.12, 0.08, iron, [0, 0, 0], 8)
  const ancBody = group(anchor, '', [0.16, 0.28, 0.18])
  ancBody.rotation.set(0.35, 0.4, -0.35)
  cyl(ancBody, p, [0, 0, 0], 0.032, 0.038, 0.56, iron, [0, 0, 0], 7)
  kitBox(ancBody, p, [0, 0.18, 0], [0.36, 0.045, 0.045], timber)
  arc(ancBody, p, [[-0.24, -0.14, 0], [0, -0.32, 0], [0.24, -0.14, 0]], 0.032, iron, 10, 6)
  for (const sx of [-1, 1]) cone(ancBody, p, [sx * 0.25, -0.1, 0], 0.065, 0.14, iron, [0, 0, -sx * 0.4], 5)

  if (detail) {
    torus(scene, p, [0.24, 0.72, -0.44], 0.14, 0.032, rope, [Math.PI / 2, 0, 0])
    torus(scene, p, [0.24, 0.77, -0.44], 0.1, 0.028, rope, [Math.PI / 2, 0, 0])
    for (let i = 0; i < 6; i++) {
      kitBox(scene, p, [0, 0.695, -0.82 + i * 0.3], [0.96, 0.02, 0.05], basalt)
    }
    for (const [fx, fz, sd] of [[0.94, 0.76, 1.5], [-0.94, 0.64, 3.8], [0.92, -0.42, 6.1]] as const) {
      rock(scene, p, [fx, 0.08, fz], [0.16, 0.09, 0.14], granite, sd)
    }
  }

  root.animations = [new T.AnimationClip('Harbor beacon sweep', 3.2, [spinTrack('TideBeacon', 'y', 3.2, 1)])]
}

function buildAmphitheaterArc(root: T.Group, p: Finish, detail: boolean) {
  const turf = tone(p, 'Amphitheater hillside turf', '#5f7c4b', 0.88)
  const warmStone = tone(p, 'Classical ashlar stone', '#9e9688', 0.88)
  const slateMosaic = tone(p, 'Orchestra slate mosaic', '#4f5a64', 0.84)
  const terracotta = tone(p, 'Orchestra terracotta', '#a85c42', 0.84)
  const emberGlow = glowTone(p, 'Stage brazier glow', '#ffb238', '#ff6414')

  const scene = group(root, 'StoneAmphitheaterArc')
  kitBox(scene, p, [0, 0.08, 0], [3.46, 0.16, 2.66], turf)

  const cz = 0.42
  const startA = 0.1
  const endA = Math.PI - 0.1

  terraceArc(scene, p, [0, 0.12, cz], 1.52, 1.72, 1.18, startA - 0.04, endA + 0.04, turf)

  cyl(scene, p, [0, 0.2, cz], 0.86, 0.9, 0.12, p.primary, [0, 0, 0], 18)
  cyl(scene, p, [0, 0.27, cz], 0.72, 0.74, 0.04, slateMosaic, [0, 0, 0], 18)
  cyl(scene, p, [0, 0.295, cz], 0.42, 0.44, 0.03, terracotta, [0, 0, 0], 16)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    kitBox(scene, p, [Math.cos(a) * 0.56, 0.295, cz + Math.sin(a) * 0.56], [0.24, 0.024, 0.06], p.accent, [0, -a, 0])
  }

  const tiers: readonly [number, number, number][] = [
    [0.84, 1.08, 0.36], [1.04, 1.28, 0.62], [1.24, 1.48, 0.88], [1.44, 1.64, 1.14],
  ]
  for (const [rIn, rOut, h] of tiers) terraceArc(scene, p, [0, 0.14, cz], rIn, rOut, h, startA, endA, p.primary)
  terraceArc(scene, p, [0, 0.14, cz], 1.54, 1.66, 1.32, startA, endA, warmStone)
  for (const a of [Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75]) {
    for (let s = 0; s < 4; s++) {
      const r = 0.96 + s * 0.19
      kitBox(scene, p, [Math.cos(a) * r, 0.28 + s * 0.25, cz - Math.sin(a) * r], [0.22, 0.22, 0.22], warmStone, [0, a, 0])
    }
  }
  for (const sx of [-1, 1]) kitBox(scene, p, [sx * 1.24, 0.62, cz - 0.12], [0.84, 0.96, 0.16], warmStone)
  const pedestal = group(scene, 'StagePedestal', [0, 0.3, cz])
  cyl(pedestal, p, [0, 0.06, 0], 0.24, 0.28, 0.12, warmStone, [0, 0, 0], 10)
  lathe(pedestal, p, [0, 0.1, 0], [[0.005, 0], [0.2, 0], [0.12, 0.18], [0.1, 0.48], [0.24, 0.68], [0.26, 0.8], [0.18, 0.8], [0.16, 0.68], [0.005, 0.68]], p.accent, 14)
  orb(pedestal, p, [0, 0.84, 0], [0.15, 0.09, 0.15], emberGlow, 9)
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3
    kitBox(pedestal, p, [Math.cos(a) * 0.16, 0.38, Math.sin(a) * 0.16], [0.14, 0.46, 0.045], p.accent, [0, -a, 0])
  }
  kitBox(pedestal, p, [0, 0.94, 0.22], [0.32, 0.18, 0.045], p.accent, [-0.42, 0, 0])
  const frags = group(scene, 'ColumnFragments', [1.14, 0.14, 0.92])
  kitBox(frags, p, [-0.12, 0.08, 0], [0.34, 0.16, 0.34], warmStone)
  cyl(frags, p, [-0.12, 0.38, 0], 0.13, 0.14, 0.48, p.primary, [0, 0, 0], 10)
  cyl(frags, p, [0.26, 0.14, -0.06], 0.12, 0.13, 0.44, p.primary, [0.16, 0.4, Math.PI / 2], 10)
  kitBox(frags, p, [0.12, 0.12, 0.18], [0.24, 0.16, 0.2], warmStone, [0, 0.3, 0])
  if (detail) {
    for (const sx of [-1, 1]) cyl(scene, p, [sx * 0.96, 1.12, cz - 0.12], 0.075, 0.075, 0.24, p.primary, [Math.PI / 2, 0, 0], 8)
    for (const [bx, bz, sc] of [[-1.44, -0.78, 0.22], [1.46, -0.76, 0.24], [0, -1.18, 0.26]] as const) {
      orb(scene, p, [bx, 1.34, bz], [sc, sc * 0.72, sc * 0.85], turf, 8)
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      orb(scene, p, [Math.cos(a) * 0.78, 0.28, cz + Math.sin(a) * 0.78], [0.038, 0.025, 0.038], p.accent, 6)
    }
  }

  root.animations = [new T.AnimationClip('Rotate stage pedestal', 5.6, [spinTrack('StagePedestal', 'y', 5.6, 1)])]
}

export const terrainStructuresD: readonly TerrainStructureSpec[] = [
  {
    id: 'desert-silk-caravan-tent',
    riggedParts: [rot('CampLantern', 'Hanging brass lantern', 'z', [-22, 22], 'Sways the pierced desert brass camp lantern beneath the tent ridge')],
    detachableParts: [det('CarpetRolls', 'Rolled nomad carpets', 'Removable stack of woven desert carpet rolls beside the tent entrance')],
    build: buildCaravanTent,
  },
  {
    id: 'cypress-swamp-boardwalk',
    riggedParts: [rot('TrailGate', 'Boardwalk entry gate', 'y', [0, 86], 'Swings open the weathered cypress wetland boardwalk safety gate')],
    detachableParts: [det('TrailSign', 'Wetland trail sign', 'Removable hooded timber interpretive signpost by the boardwalk lookout')],
    build: buildSwampBoardwalk,
  },
  {
    id: 'hillside-vineyard-arbor',
    riggedParts: [rot('VineyardBell', 'Harvest bronze bell', 'x', [-26, 26], 'Swings the hanging bronze harvest bell beneath the vineyard pergola')],
    detachableParts: [det('WineCasks', 'Oak wine casks', 'Removable iron-hooped oak wine casks resting on the lower terrace')],
    build: buildVineyardArbor,
  },
  {
    id: 'coastal-tide-marker-pier',
    riggedParts: [rot('TideBeacon', 'Harbor tide beacon', 'y', [0, 360], 'Spins the hooded coastal harbor beacon light atop the jetty tower')],
    detachableParts: [det('AnchorPost', 'Breakwater anchor post', 'Removable iron mooring bollard and fluked ship anchor on the rocks')],
    build: buildTideMarkerPier,
  },
  {
    id: 'stone-amphitheater-arc',
    riggedParts: [rot('StagePedestal', 'Bronze stage pedestal', 'y', [0, 360], 'Rotates the ornate bronze orchestra brazier and lectern pedestal')],
    detachableParts: [det('ColumnFragments', 'Marble column fragments', 'Removable broken fluted marble column stubs on the forecourt')],
    build: buildAmphitheaterArc,
  },
]
