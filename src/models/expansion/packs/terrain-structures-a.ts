import * as T from 'three'
import {
  arc,
  archRing,
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
  tone,
  torus,
  waterTone,
} from './terrain-structures-kit'
import type { Finish, TerrainStructureSpec } from './terrain-structures-kit'

function buildCoveredBridge(root: T.Group, p: Finish, detail: boolean) {
  const gravel = tone(p, 'Creek gravel', '#6d675c', 0.9)
  const stone = tone(p, 'River abutment stone', '#838078', 0.88)
  const capStone = tone(p, 'Abutment cap stone', '#9a968d', 0.85)
  const water = waterTone(p, 'Creek water', '#378fa0', '#0e4754')
  const darkWood = tone(p, 'Bridge dark timber', '#4e3929', 0.85)
  const moss = tone(p, 'Bridge bank moss', '#567844', 0.88)
  const cream = tone(p, 'Toll stripe cream', '#ebe2cd', 0.78)
  const iron = tone(p, 'Bridge iron', '#3a3e44', 0.46, 0.52)

  const scene = group(root, 'WoodenCoveredBridge')
  kitBox(scene, p, [0, 0.07, 0], [2.24, 0.14, 3.34], gravel)
  kitBox(scene, p, [0, 0.14, 0], [2.14, 0.08, 1.36], water)

  for (const sz of [-1, 1]) {
    kitBox(scene, p, [0, 0.34, sz * 1.12], [1.62, 0.56, 0.76], stone)
    kitBox(scene, p, [0, 0.65, sz * 1.12], [1.72, 0.08, 0.84], capStone)
    kitBox(scene, p, [0, 0.4, sz * 1.48], [1.14, 0.09, 0.42], darkWood, [sz * 0.58, 0, 0])
  }

  for (const sx of [-0.46, 0.46]) kitBox(scene, p, [sx, 0.67, 0], [0.1, 0.1, 2.86], darkWood)
  for (let i = 0; i < 11; i++) {
    const z = -1.2 + i * 0.24
    kitBox(scene, p, [0, 0.74, z], [1.22, 0.055, 0.19], i % 2 === 0 ? p.accent : darkWood)
  }

  for (const sx of [-1, 1]) {
    const wx = sx * 0.64
    kitBox(scene, p, [wx, 0.94, 0], [0.1, 0.42, 2.1], p.primary)
    kitBox(scene, p, [wx, 1.66, 0], [0.12, 0.1, 2.18], p.primary)
    for (const z of [-0.96, -0.32, 0.32, 0.96]) {
      kitBox(scene, p, [wx, 1.24, z], [0.11, 1.06, 0.1], darkWood)
    }
    for (const z of [-0.64, 0, 0.64]) {
      strut(scene, p, [wx, 1.12, z - 0.24], [wx, 1.62, z + 0.24], 0.036, darkWood, 6)
      strut(scene, p, [wx, 1.62, z - 0.24], [wx, 1.12, z + 0.24], 0.036, darkWood, 6)
      kitBox(scene, p, [wx + sx * 0.03, 1.38, z], [0.05, 0.24, 0.24], p.accent, [Math.PI / 4, 0, 0])
    }
  }

  for (const sz of [-1, 1]) {
    gable(scene, p, [0, 1.7, sz * 1.02], 1.48, 0.64, 0.09, p.primary)
    kitBox(scene, p, [0, 1.66, sz * 1.02], [1.44, 0.11, 0.12], darkWood)
  }
  for (const sx of [-1, 1]) {
    kitBox(scene, p, [sx * 0.42, 2.02, 0], [1.02, 0.075, 2.42], p.accent, [0, 0, -sx * 0.72])
  }
  kitBox(scene, p, [0, 2.38, 0], [0.15, 0.1, 2.5], p.primary)

  kitBox(scene, p, [-0.66, 0.94, 1.38], [0.11, 0.62, 0.11], darkWood)
  cyl(scene, p, [-0.66, 1.12, 1.42], 0.045, 0.045, 0.1, iron, [Math.PI / 2, 0, 0], 8)
  const toll = group(scene, 'TollBar', [-0.66, 1.12, 1.42])
  kitBox(toll, p, [0.54, 0, 0], [1.34, 0.065, 0.065], p.primary)
  kitBox(toll, p, [-0.2, 0, 0], [0.22, 0.12, 0.11], iron)
  for (const ox of [0.2, 0.56, 0.92]) kitBox(toll, p, [ox, 0, 0], [0.14, 0.085, 0.085], cream)

  const marker = group(scene, 'MileMarker', [0.84, 0.06, 1.36])
  kitBox(marker, p, [0, 0.28, 0], [0.22, 0.56, 0.16], stone)
  kitBox(marker, p, [0, 0.58, 0], [0.26, 0.08, 0.2], p.primary)
  rock(marker, p, [-0.14, 0, 0.08], [0.12, 0.09, 0.1], capStone, 2.1)

  if (detail) {
    for (const sx of [-1, 1]) {
      for (const z of [-0.9, -0.3, 0.3, 0.9]) {
        kitBox(scene, p, [sx * 0.46, 2.06, z], [0.98, 0.03, 0.06], darkWood, [0, 0, -sx * 0.72])
      }
      orb(scene, p, [sx * 0.78, 0.69, -1.16], [0.16, 0.06, 0.14], moss, 7)
      orb(scene, p, [sx * 0.76, 0.69, 1.16], [0.14, 0.06, 0.14], moss, 7)
    }
    for (const [rx, rz, sd] of [[-0.64, -0.22, 1.2], [0.58, 0.28, 3.4], [-0.24, 0.42, 5.1], [0.32, -0.38, 6.2]] as const) {
      rock(scene, p, [rx, 0.08, rz], [0.14, 0.1, 0.12], stone, sd)
    }
  }

  root.animations = [new T.AnimationClip('Lift toll barrier', 3.6, [swingTrack('TollBar', 'z', 3.6, 68)])]
}

function buildRopeFootbridge(root: T.Group, p: Finish, detail: boolean) {
  const canyon = tone(p, 'Canyon bedrock', '#7a6e62', 0.9)
  const cliff = tone(p, 'Canyon cliff rock', '#8e7f6f', 0.88)
  const stream = waterTone(p, 'Gorge stream', '#3a8499', '#0f4654')
  const darkWood = tone(p, 'A-frame timber', '#5f422b', 0.86)
  const brass = tone(p, 'Lantern brass', '#96763f', 0.45, 0.48)
  const lanternGlow = glowTone(p, 'Trail lantern glow', '#ffdf88', '#ff9d2b')

  const scene = group(root, 'SwayingRopeFootbridge')
  kitBox(scene, p, [0, 0.07, 0], [3.42, 0.14, 1.76], canyon)
  kitBox(scene, p, [0, 0.14, 0], [1.28, 0.06, 1.64], stream)

  for (const sx of [-1, 1]) {
    kitBox(scene, p, [sx * 1.26, 0.42, 0], [0.76, 0.72, 1.54], canyon)
    rock(scene, p, [sx * 1.06, 0.04, 0.34], [0.34, 0.44, 0.34], cliff, sx * 2.1)
    rock(scene, p, [sx * 1.12, 0.04, -0.36], [0.32, 0.48, 0.34], cliff, sx * 4.3)
    rock(scene, p, [sx * 1.48, 0.06, 0], [0.28, 0.56, 0.48], cliff, sx * 6.4)
    kitBox(scene, p, [sx * 0.98, 0.81, 0], [0.28, 0.08, 0.94], darkWood)
    for (const sz of [-1, 1]) {
      strut(scene, p, [sx * 1.04, 0.74, sz * 0.48], [sx * 1.04, 2.02, sz * 0.34], 0.055, p.primary, 8)
      strut(scene, p, [sx * 1.04, 1.94, sz * 0.36], [sx * 1.54, 0.74, sz * 0.36], 0.025, p.accent, 6)
    }
    kitBox(scene, p, [sx * 1.04, 1.96, 0], [0.11, 0.1, 0.92], darkWood)
    strut(scene, p, [sx * 1.04, 1.54, -0.4], [sx * 1.04, 1.92, -0.22], 0.032, darkWood, 6)
    strut(scene, p, [sx * 1.04, 1.54, 0.4], [sx * 1.04, 1.92, 0.22], 0.032, darkWood, 6)
  }

  for (const sz of [-1, 1]) {
    arc(
      scene,
      p,
      [[-1.04, 1.94, sz * 0.36], [-0.48, 1.56, sz * 0.4], [0, 1.44, sz * 0.42], [0.48, 1.56, sz * 0.4], [1.04, 1.94, sz * 0.36]],
      0.028,
      p.accent,
      14,
      6,
    )
  }

  const span = group(scene, 'BridgeSpan', [0, 1.94, 0])
  for (const sz of [-1, 1]) {
    arc(
      span,
      p,
      [[-1.02, -1.12, sz * 0.34], [-0.5, -1.22, sz * 0.34], [0, -1.26, sz * 0.34], [0.5, -1.22, sz * 0.34], [1.02, -1.12, sz * 0.34]],
      0.026,
      p.accent,
      14,
      6,
    )
  }
  const plankCount = 9
  for (let i = 0; i < plankCount; i++) {
    const t = i / (plankCount - 1)
    const u = t * 2 - 1
    const px = u * 0.96
    const sag = -1.24 + 0.14 * u * u
    const tilt = u * 0.22
    const zShift = (i % 2 === 0 ? 1 : -1) * 0.025
    kitBox(span, p, [px, sag, zShift], [0.16, 0.055, 0.84], i % 2 === 0 ? p.primary : darkWood, [0, 0, tilt])
    if (i % 2 === 1) {
      const topY = -0.5 + 0.48 * u * u
      for (const sz of [-1, 1]) {
        strut(span, p, [px, sag + 0.02, sz * 0.35], [px, topY, sz * 0.4], 0.018, p.accent, 6)
      }
    }
  }

  const lanterns = group(scene, 'TrailLanterns', [0, 0, 0])
  for (const sx of [-1, 1]) {
    cyl(lanterns, p, [sx * 1.32, 1.06, 0.56], 0.04, 0.05, 0.72, darkWood, [0, 0, 0], 8)
    kitBox(lanterns, p, [sx * 1.24, 1.38, 0.56], [0.22, 0.045, 0.045], darkWood)
    cyl(lanterns, p, [sx * 1.16, 1.24, 0.56], 0.065, 0.06, 0.16, lanternGlow, [0, 0, 0], 6)
    cone(lanterns, p, [sx * 1.16, 1.36, 0.56], 0.1, 0.08, brass, [0, 0, 0], 6)
    cyl(lanterns, p, [sx * 1.16, 1.14, 0.56], 0.075, 0.05, 0.04, brass, [0, 0, 0], 6)
  }

  if (detail) {
    for (const sz of [-1, 1]) {
      for (const px of [-0.64, -0.22, 0.22, 0.64]) {
        strut(span, p, [px - 0.14, -1.2, sz * 0.36], [px + 0.14, -0.44, sz * 0.4], 0.012, p.accent, 5)
      }
    }
    for (const [rx, rz, sd] of [[-0.4, 0.52, 1.5], [0.35, -0.48, 3.8], [0.1, 0.32, 5.2]] as const) {
      rock(scene, p, [rx, 0.08, rz], [0.16, 0.11, 0.14], cliff, sd)
    }
  }

  root.animations = [new T.AnimationClip('Canyon sway', 3.8, [sway('BridgeSpan', 'z', 3.8, -0.14, 0.14)])]
}

function buildFishingPier(root: T.Group, p: Finish, detail: boolean) {
  const water = waterTone(p, 'Harbor water', '#2b778a', '#0c4352')
  const stone = tone(p, 'Seawall stone', '#7f7a70', 0.88)
  const piling = tone(p, 'Barnacled piling', '#4b3f34', 0.88)
  const barnacle = tone(p, 'Sea barnacles', '#b8b2a2', 0.9)
  const rope = tone(p, 'Hemp mooring rope', '#c8aa70', 0.86)
  const netMat = tone(p, 'Fishing net', '#6e7b70', 0.88)
  const crateWood = tone(p, 'Bait crate timber', '#a37b4d', 0.84)
  const iron = tone(p, 'Winch iron', '#3a3f46', 0.45, 0.52)

  const scene = group(root, 'TimberFishingPier')
  kitBox(scene, p, [0, 0.07, 0], [2.16, 0.14, 3.24], water)
  kitBox(scene, p, [0, 0.34, -1.28], [2.02, 0.56, 0.56], stone)
  rock(scene, p, [-0.82, 0.06, -1.06], [0.28, 0.24, 0.26], stone, 1.4)
  rock(scene, p, [0.84, 0.06, -1.04], [0.26, 0.22, 0.24], stone, 3.7)
  kitBox(scene, p, [0, 0.65, -1.08], [1.24, 0.08, 0.32], piling, [0.34, 0, 0])

  for (const z of [-0.82, -0.14, 0.54, 1.22]) {
    const tall = z === 1.22 || z === -0.82
    const h = tall ? 1.18 : 0.86
    for (const sx of [-1, 1]) {
      cyl(scene, p, [sx * 0.64, h * 0.5 + 0.05, z], 0.075, 0.09, h, piling, [0, 0, 0], 8)
      cyl(scene, p, [sx * 0.64, 0.22, z], 0.098, 0.105, 0.14, barnacle, [0, 0, 0], 8)
      if (tall) cyl(scene, p, [sx * 0.64, h + 0.06, z], 0.088, 0.088, 0.06, p.accent, [0, 0, 0], 8)
    }
    strut(scene, p, [-0.62, 0.24, z], [0.62, 0.68, z], 0.038, piling, 6)
    strut(scene, p, [0.62, 0.24, z], [-0.62, 0.68, z], 0.038, piling, 6)
  }

  for (const sx of [-0.52, 0.52]) kitBox(scene, p, [sx, 0.7, 0.16], [0.1, 0.1, 2.48], piling)
  for (let i = 0; i < 13; i++) {
    const z = -1.02 + i * 0.195
    kitBox(scene, p, [0, 0.77, z], [1.54, 0.05, 0.155], p.primary)
  }
  for (const sx of [-1, 1]) {
    kitBox(scene, p, [sx * 0.74, 0.82, 0.16], [0.08, 0.07, 2.44], p.accent)
  }
  torus(scene, p, [0.64, 0.94, 1.22], 0.1, 0.025, rope, [Math.PI / 2, 0, 0])
  torus(scene, p, [-0.64, 0.94, -0.82], 0.1, 0.025, rope, [Math.PI / 2, 0, 0])

  for (const sx of [-1, 1]) {
    kitBox(scene, p, [sx * 0.36, 1.18, 1.14], [0.09, 0.8, 0.09], piling)
    strut(scene, p, [sx * 0.36, 0.8, 0.78], [sx * 0.36, 1.54, 1.14], 0.04, piling, 6)
  }
  kitBox(scene, p, [0, 1.58, 1.26], [0.88, 0.09, 0.42], p.accent)

  const winch = group(scene, 'NetWinch', [0, 1.26, 1.14])
  cyl(winch, p, [0, 0, 0], 0.045, 0.045, 0.9, iron, [0, 0, Math.PI / 2], 8)
  cyl(winch, p, [0, 0, 0], 0.13, 0.13, 0.52, p.accent, [0, 0, Math.PI / 2], 10)
  for (const ox of [-0.26, 0.26]) cyl(winch, p, [ox, 0, 0], 0.18, 0.18, 0.04, p.primary, [0, 0, Math.PI / 2], 10)
  for (const ox of [-0.12, 0, 0.12]) torus(winch, p, [ox, 0, 0], 0.14, 0.028, rope, [0, Math.PI / 2, 0])
  kitBox(winch, p, [0.46, 0.11, 0], [0.04, 0.26, 0.05], iron)
  cyl(winch, p, [0.54, 0.22, 0], 0.028, 0.028, 0.16, p.primary, [0, 0, Math.PI / 2], 8)

  const crates = group(scene, 'BaitCrates', [-0.34, 0.78, 0.18])
  kitBox(crates, p, [0, 0.16, 0], [0.44, 0.32, 0.38], crateWood)
  kitBox(crates, p, [0.08, 0.44, -0.04], [0.32, 0.24, 0.3], p.primary, [0, 0.25, 0])
  cyl(crates, p, [-0.14, 0.44, 0.08], 0.11, 0.09, 0.24, p.accent, [0, 0, 0], 8)

  if (detail) {
    strut(scene, p, [0, 1.56, 1.44], [0, 0.22, 1.48], 0.022, rope, 6)
    orb(scene, p, [0, 0.32, 1.48], [0.22, 0.2, 0.18], netMat, 8)
    for (const z of [-0.46, 0.22, 0.88]) {
      for (const sx of [-1, 1]) kitBox(scene, p, [sx * 0.74, 0.87, z], [0.04, 0.04, 0.14], iron)
    }
    torus(crates, p, [0.08, 0.58, -0.04], 0.11, 0.024, rope, [Math.PI / 2, 0, 0])
  }

  root.animations = [new T.AnimationClip('Haul fishing net', 3.6, [spinTrack('NetWinch', 'x', 3.6, 1)])]
}

function buildRomanAqueduct(root: T.Group, p: Finish, detail: boolean) {
  const turf = tone(p, 'Hillside turf', '#5c7c49', 0.88)
  const darkStone = tone(p, 'Weathered travertine', '#9c8c73', 0.88)
  const clay = tone(p, 'Conduit terracotta', '#b06647', 0.82)
  const water = waterTone(p, 'Aqueduct stream', '#3a98ad', '#0f4c59')

  const scene = group(root, 'RuinedRomanAqueduct')
  kitBox(scene, p, [0, 0.08, 0], [3.54, 0.16, 1.84], turf)
  mound(scene, p, [-0.18, 0.06, -0.1], 1.58, 0.24, 0.76, turf, 14)

  const pierXs = [-1.32, -0.44, 0.44, 1.32]
  for (let i = 0; i < pierXs.length; i++) {
    const x = pierXs[i] ?? 0
    const broken = i === 3
    kitBox(scene, p, [x, 0.24, 0], [0.42, 0.26, 0.62], darkStone)
    kitBox(scene, p, [x, broken ? 0.86 : 0.94, 0], [0.32, broken ? 1.06 : 1.22, 0.48], p.primary)
    if (!broken) {
      kitBox(scene, p, [x, 1.56, 0], [0.4, 0.1, 0.56], darkStone)
    } else {
      kitBox(scene, p, [x - 0.05, 1.44, -0.04], [0.22, 0.18, 0.34], p.primary)
      kitBox(scene, p, [x + 0.06, 1.4, 0.06], [0.16, 0.14, 0.24], darkStone)
    }
  }

  for (const ax of [-0.88, 0]) {
    archRing(scene, p, [ax, 1.56, 0], 0.28, 0.44, 0.46, p.primary)
    kitBox(scene, p, [ax, 1.98, 0], [0.14, 0.22, 0.52], darkStone)
  }
  archRing(scene, p, [0.88, 1.56, 0], 0.28, 0.44, 0.46, p.primary, Math.PI * 0.35, Math.PI)

  for (const sx of [-1.32, -0.44, 0.44]) {
    kitBox(scene, p, [sx, 1.82, 0], [0.34, 0.44, 0.44], p.primary)
  }
  kitBox(scene, p, [-0.42, 2.08, 0], [2.24, 0.14, 0.56], darkStone)
  for (const sz of [-0.21, 0.21]) {
    kitBox(scene, p, [-0.42, 2.28, sz], [2.16, 0.28, 0.11], p.primary)
    kitBox(scene, p, [-0.42, 2.24, sz * 0.72], [2.04, 0.2, 0.04], clay)
  }
  kitBox(scene, p, [-0.44, 2.18, 0], [1.96, 0.07, 0.24], water)
  kitBox(scene, p, [0.74, 2.12, -0.04], [0.24, 0.2, 0.38], p.primary)
  kitBox(scene, p, [0.82, 1.98, 0.06], [0.18, 0.16, 0.28], darkStone)

  const ivy = group(scene, 'ArchIvy', [0, 1.86, 0.22])
  arc(ivy, p, [[0, 0.08, 0], [-0.08, -0.24, 0.04], [-0.14, -0.56, 0.02]], 0.022, p.accent, 8, 5)
  arc(ivy, p, [[0.04, 0.06, 0], [0.1, -0.28, 0.05], [0.06, -0.62, 0.03]], 0.02, p.accent, 8, 5)
  for (const [lx, ly, lz, sc] of [
    [-0.08, -0.18, 0.05, 0.1], [0.09, -0.26, 0.06, 0.11], [-0.13, -0.44, 0.04, 0.095],
    [0.07, -0.5, 0.04, 0.09], [-0.14, -0.58, 0.03, 0.075], [0.05, -0.64, 0.03, 0.075],
  ] as const) {
    orb(ivy, p, [lx, ly, lz], [sc, sc * 0.85, sc * 0.7], p.accent, 7)
  }

  const fallen = group(scene, 'FallenColumns', [0.88, 0.14, 0.56])
  cyl(fallen, p, [-0.18, 0.14, 0], 0.13, 0.14, 0.56, p.primary, [0, 0.28, Math.PI / 2], 10)
  cyl(fallen, p, [0.28, 0.12, -0.08], 0.12, 0.13, 0.42, p.primary, [0.18, -0.4, Math.PI / 2], 10)
  kitBox(fallen, p, [0.1, 0.11, 0.14], [0.26, 0.18, 0.24], darkStone, [0, 0.35, 0])

  if (detail) {
    for (let i = 0; i < 8; i++) {
      kitBox(scene, p, [-1.42 + i * 0.28, 2.02, 0.29], [0.1, 0.07, 0.05], p.primary)
    }
    arc(scene, p, [[-1.32, 0.24, 0.26], [-1.22, 0.92, 0.27], [-1.36, 1.56, 0.26]], 0.022, p.accent, 10, 5)
    for (const y of [0.56, 0.98, 1.38]) orb(scene, p, [-1.28, y, 0.29], [0.11, 0.09, 0.07], p.accent, 7)
    for (const [rx, rz, sd] of [[1.38, 0.42, 1.8], [1.14, -0.34, 4.2], [-1.52, 0.46, 5.5]] as const) {
      rock(scene, p, [rx, 0.1, rz], [0.14, 0.1, 0.12], darkStone, sd)
    }
  }

  root.animations = [new T.AnimationClip('Mediterranean breeze', 4.0, [sway('ArchIvy', 'z', 4.0, -0.22, 0.22)])]
}

function buildCampfireClearing(root: T.Group, p: Finish, detail: boolean) {
  const moss = tone(p, 'Clearing moss', '#557844', 0.88)
  const dirt = tone(p, 'Hearth soil', '#6c5842', 0.9)
  const cobble = tone(p, 'Fire-ring cobble', '#84817a', 0.88)
  const char = tone(p, 'Charred firewood', '#382f2a', 0.9)
  const iron = tone(p, 'Cast iron kettle', '#2f3339', 0.46, 0.48)
  const tripodWood = tone(p, 'Tripod pole wood', '#6b4c32', 0.85)
  const innerFlame = glowTone(p, 'Inner hearth flame', '#ffd762', '#ff9e24')
  const ember = glowTone(p, 'Glowing embers', '#ff6422', '#ff3b0a')

  const scene = group(root, 'StoneCampfireClearing')
  mound(scene, p, [0, 0, 0], 1.52, 0.22, 1.42, moss, 14)
  cyl(scene, p, [0, 0.21, 0], 0.92, 0.98, 0.06, dirt, [0, 0, 0], 14)

  for (let i = 0; i < 11; i++) {
    const a = (i * Math.PI * 2) / 11
    rock(scene, p, [Math.cos(a) * 0.44, 0.15, Math.sin(a) * 0.44], [0.14, 0.11, 0.13], cobble, i * 1.7 + 0.5)
  }

  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5
    cyl(scene, p, [Math.cos(a) * 0.15, 0.28, Math.sin(a) * 0.15], 0.048, 0.055, 0.42, i % 2 === 0 ? p.primary : char, [0.46, a, 0.3], 7)
  }
  orb(scene, p, [0, 0.28, 0], [0.24, 0.1, 0.24], ember, 8)
  cone(scene, p, [0, 0.52, 0], 0.16, 0.46, p.accent, [0.06, 0.3, -0.05], 8)
  cone(scene, p, [0.08, 0.46, 0.05], 0.11, 0.34, p.accent, [-0.14, 0.8, 0.16], 7)
  cone(scene, p, [-0.07, 0.45, -0.06], 0.1, 0.32, p.accent, [0.14, 1.4, -0.14], 7)
  cone(scene, p, [0, 0.46, 0.02], 0.095, 0.3, innerFlame, [0, 0, 0], 7)

  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.35
    strut(scene, p, [Math.cos(a) * 0.64, 0.14, Math.sin(a) * 0.64], [0, 1.5, 0], 0.036, tripodWood, 7)
  }
  torus(scene, p, [0, 1.46, 0], 0.065, 0.02, iron, [Math.PI / 2, 0, 0])

  const kettle = group(scene, 'CampKettle', [0, 1.44, 0])
  cyl(kettle, p, [0, -0.22, 0], 0.015, 0.015, 0.44, iron, [0, 0, 0], 6)
  torus(kettle, p, [0, -0.44, 0], 0.13, 0.016, iron, [0, 0, 0], 6, 12)
  lathe(
    kettle,
    p,
    [0, -0.74, 0],
    [[0.005, 0], [0.14, 0.02], [0.2, 0.12], [0.19, 0.24], [0.15, 0.29], [0.18, 0.31], [0.005, 0.32]],
    iron,
    12,
  )
  orb(kettle, p, [0, -0.4, 0], [0.035, 0.03, 0.035], p.accent, 6)

  for (const [bx, bz, ry] of [[0, 0.96, 0], [-0.92, -0.34, 1.15]] as const) {
    const bench = group(scene, '', [bx, 0.18, bz])
    bench.rotation.y = ry
    for (const ox of [-0.34, 0.34]) cyl(bench, p, [ox, 0.1, 0], 0.09, 0.1, 0.22, tripodWood, [0, 0, 0], 7)
    kitBox(bench, p, [0, 0.24, 0], [0.98, 0.12, 0.26], p.primary)
  }

  const stack = group(scene, 'FirewoodStack', [0.88, 0.14, -0.42])
  stack.rotation.y = -0.55
  for (const ox of [-0.26, 0.26]) kitBox(stack, p, [ox, 0.24, 0], [0.05, 0.46, 0.05], tripodWood)
  kitBox(stack, p, [0, 0.05, 0], [0.58, 0.06, 0.26], tripodWood)
  for (let row = 0; row < 3; row++) {
    const count = 3 - (row % 2)
    for (let c = 0; c < count; c++) {
      const lx = (c - (count - 1) * 0.5) * 0.14
      cyl(stack, p, [lx, 0.13 + row * 0.11, 0], 0.052, 0.055, 0.34, p.primary, [Math.PI / 2, 0, 0], 7)
    }
  }
  cyl(stack, p, [0.42, 0.14, 0.18], 0.13, 0.15, 0.28, tripodWood, [0, 0, 0], 8)
  kitBox(stack, p, [0.42, 0.32, 0.18], [0.04, 0.12, 0.14], iron, [0, 0.3, 0.25])
  cyl(stack, p, [0.52, 0.4, 0.16], 0.018, 0.02, 0.32, p.primary, [0, 0, -1.1], 6)

  if (detail) {
    for (const [rx, rz, sd] of [[-1.02, 0.52, 1.3], [0.88, 0.62, 2.7], [-0.46, -0.96, 4.4]] as const) {
      rock(scene, p, [rx, 0.1, rz], [0.18, 0.13, 0.15], cobble, sd)
    }
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + 0.2
      cone(scene, p, [Math.cos(a) * 1.18, 0.24, Math.sin(a) * 1.1], 0.05, 0.22, moss, [0.18, a, 0], 6)
    }
  }

  root.animations = [new T.AnimationClip('Simmer kettle sway', 3.4, [sway('CampKettle', 'z', 3.4, -0.22, 0.22)])]
}

export const terrainStructuresA: readonly TerrainStructureSpec[] = [
  {
    id: 'wooden-covered-bridge',
    riggedParts: [rot('TollBar', 'Toll barrier arm', 'z', [0, 72], 'Raises and lowers the striped timber bridge toll gate')],
    detachableParts: [det('MileMarker', 'Stone mile marker', 'Removable carved stone milestone beside the bridge approach')],
    build: buildCoveredBridge,
  },
  {
    id: 'swaying-rope-footbridge',
    riggedParts: [rot('BridgeSpan', 'Suspended bridge span', 'z', [-14, 14], 'Sways the suspended rope-and-plank footbridge span')],
    detachableParts: [det('TrailLanterns', 'Canyon trail lanterns', 'Removable timber lantern posts anchored on both cliff rims')],
    build: buildRopeFootbridge,
  },
  {
    id: 'timber-fishing-pier',
    riggedParts: [rot('NetWinch', 'Fishing net winch', 'x', [0, 360], 'Spins the horizontal timber fishing net winch drum and crank')],
    detachableParts: [det('BaitCrates', 'Bait crates', 'Removable stacked wooden bait crates and tackle bucket on the deck')],
    build: buildFishingPier,
  },
  {
    id: 'ruined-roman-aqueduct',
    riggedParts: [rot('ArchIvy', 'Hanging arch ivy', 'z', [-16, 16], 'Sways the trailing ivy curtain beneath the central stone arch')],
    detachableParts: [det('FallenColumns', 'Fallen column drums', 'Removable tumbled limestone column drums on the hillside slope')],
    build: buildRomanAqueduct,
  },
  {
    id: 'stone-campfire-clearing',
    riggedParts: [rot('CampKettle', 'Tripod camp kettle', 'z', [-18, 18], 'Swings the hanging cast-iron cooking kettle above the hearth')],
    detachableParts: [det('FirewoodStack', 'Firewood stack & stump', 'Removable stacked split firewood rack and chopping block')],
    build: buildCampfireClearing,
  },
]
