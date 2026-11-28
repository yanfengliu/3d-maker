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
  swingTrack,
  terraceArc,
  tone,
  torus,
  waterTone,
} from './terrain-structures-kit'
import type { Finish, TerrainStructureSpec } from './terrain-structures-kit'

function buildSundialPlaza(root: T.Group, p: Finish, detail: boolean) {
  const darkStone = tone(p, 'Plaza slate base', '#5e5d59', 0.88)
  const terracotta = tone(p, 'Mosaic terracotta', '#a85c42', 0.84)
  const patina = tone(p, 'Verdigris bronze', '#4e7e6e', 0.52, 0.36)
  const moss = tone(p, 'Plaza joint moss', '#5b7a48', 0.88)

  const scene = group(root, 'AncientSundialPlaza')
  cyl(scene, p, [0, 0.06, 0], 1.62, 1.66, 0.12, darkStone, [0, 0, 0], 16)
  cyl(scene, p, [0, 0.16, 0], 1.4, 1.44, 0.12, p.primary, [0, 0, 0], 16)
  cyl(scene, p, [0, 0.25, 0], 1.18, 1.2, 0.1, darkStone, [0, 0, 0], 16)

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    kitBox(scene, p, [Math.cos(a) * 0.64, 0.312, Math.sin(a) * 0.64], [0.68, 0.032, 0.09], terracotta, [0, -a, 0])
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4
    kitBox(scene, p, [Math.cos(a) * 0.62, 0.31, Math.sin(a) * 0.62], [0.58, 0.026, 0.075], p.primary, [0, -a, 0])
  }
  torus(scene, p, [0, 0.315, 0], 1.04, 0.03, terracotta, [Math.PI / 2, 0, 0], 6, 18)

  const benches: readonly [number, number][] = [[0.18, 0.94], [1.18, 1.96], [2.2, 2.96]]
  for (const [sA, eA] of benches) {
    terraceArc(scene, p, [0, 0.56, 0], 1.0, 1.24, 0.09, sA, eA, p.primary)
    for (const a of [sA + 0.12, eA - 0.12]) {
      kitBox(scene, p, [Math.cos(a) * 1.12, 0.4, -Math.sin(a) * 1.12], [0.16, 0.34, 0.2], darkStone, [0, a, 0])
    }
  }

  kitBox(scene, p, [0, 0.35, 0], [0.48, 0.14, 0.48], darkStone)
  cyl(scene, p, [0, 0.8, 0], 0.17, 0.2, 0.82, p.primary, [0, 0, 0], 12)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8
    cyl(scene, p, [Math.cos(a) * 0.18, 0.8, Math.sin(a) * 0.18], 0.026, 0.028, 0.78, p.primary, [0, 0, 0], 6)
  }
  lathe(scene, p, [0, 1.14, 0], [[0.005, 0], [0.18, 0], [0.28, 0.12], [0.32, 0.18], [0.005, 0.18]], p.primary, 12)
  cyl(scene, p, [0, 1.36, 0], 0.42, 0.4, 0.07, p.accent, [0, 0, 0], 16)
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12
    kitBox(scene, p, [Math.cos(a) * 0.32, 1.405, Math.sin(a) * 0.32], [0.08, 0.024, 0.026], patina, [0, -a, 0])
  }

  const dial = group(scene, 'SundialRing', [0, 1.4, 0])
  cyl(dial, p, [0, 0.04, 0], 0.09, 0.12, 0.09, patina, [0, 0, 0], 10)
  torus(dial, p, [0, 0.38, 0], 0.34, 0.026, p.accent, [0, 0, 0], 7, 18)
  torus(dial, p, [0, 0.38, 0], 0.28, 0.022, patina, [0.72, 0.45, 0], 7, 16)
  strut(dial, p, [-0.26, 0.18, -0.06], [0.3, 0.64, 0.06], 0.02, p.accent, 6)
  orb(dial, p, [0, 0.74, 0], [0.055, 0.055, 0.055], p.accent, 8)
  orb(dial, p, [0.3, 0.64, 0.06], [0.036, 0.036, 0.036], p.accent, 6)

  const obelisks = group(scene, 'CornerObelisks', [0, 0, 0])
  for (const sx of [-1, 1]) {
    kitBox(obelisks, p, [sx * 1.06, 0.22, 0.94], [0.3, 0.2, 0.3], darkStone)
    cyl(obelisks, p, [sx * 1.06, 0.68, 0.94], 0.075, 0.12, 0.76, p.primary, [0, Math.PI / 4, 0], 4)
    cone(obelisks, p, [sx * 1.06, 1.14, 0.94], 0.075, 0.18, p.accent, [0, Math.PI / 4, 0], 4)
  }

  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + 0.2
      orb(scene, p, [Math.cos(a) * 1.52, 0.13, Math.sin(a) * 1.52], [0.11, 0.04, 0.09], moss, 6)
    }
    for (const [sA, eA] of benches) {
      for (const a of [sA, eA]) {
        cyl(scene, p, [Math.cos(a) * 1.12, 0.66, -Math.sin(a) * 1.12], 0.045, 0.045, 0.24, darkStone, [0, a, Math.PI / 2], 7)
      }
    }
  }

  root.animations = [new T.AnimationClip('Astrolabe rotation', 6.4, [spinTrack('SundialRing', 'y', 6.4, 1)])]
}

function buildOrchardTrellis(root: T.Group, p: Finish, detail: boolean) {
  const soil = tone(p, 'Orchard loam soil', '#5e4936', 0.9)
  const stone = tone(p, 'Garden flagstone', '#9a958b', 0.88)
  const darkCedar = tone(p, 'Aged cedar beam', '#6e4328', 0.85)
  const fruit = tone(p, 'Orchard fruit', '#d44b3c', 0.62)
  const blossom = tone(p, 'Orchard blossom', '#f0e4c8', 0.78)
  const crateWood = tone(p, 'Harvest crate pine', '#bc925c', 0.84)
  const iron = tone(p, 'Wicket latch iron', '#373b40', 0.45, 0.5)

  const scene = group(root, 'WoodenOrchardTrellis')
  kitBox(scene, p, [0, 0.08, 0], [2.86, 0.16, 2.24], soil)
  for (const sz of [-1.06, 1.06]) kitBox(scene, p, [0, 0.17, sz], [2.74, 0.08, 0.09], darkCedar)
  for (const sx of [-1.36, 1.36]) kitBox(scene, p, [sx, 0.17, 0], [0.09, 0.08, 2.04], darkCedar)
  for (let i = 0; i < 5; i++) {
    kitBox(scene, p, [(i % 2 === 0 ? -0.05 : 0.05), 0.175, -0.78 + i * 0.39], [0.58, 0.045, 0.28], stone, [0, (i % 2) * 0.08, 0])
  }

  for (const z of [-0.68, 0, 0.68]) {
    for (const sx of [-1, 1]) {
      kitBox(scene, p, [sx * 0.88, 0.18, z], [0.2, 0.18, 0.2], stone)
      kitBox(scene, p, [sx * 0.88, 0.94, z], [0.11, 1.56, 0.11], p.primary)
    }
    archRing(scene, p, [0, 1.66, z], 0.8, 0.93, 0.11, p.primary)
  }
  for (let i = 0; i < 7; i++) {
    const a = 0.2 + (i / 6) * (Math.PI - 0.4)
    kitBox(scene, p, [Math.cos(a) * 0.9, 1.66 + Math.sin(a) * 0.9, 0], [0.07, 0.07, 1.72], darkCedar, [0, 0, a - Math.PI / 2])
  }
  for (const sx of [-1, 1]) {
    const wx = sx * 0.88
    for (const y of [0.58, 1.14, 1.64]) kitBox(scene, p, [wx, y, 0], [0.07, 0.07, 1.46], darkCedar)
    for (const zc of [-0.34, 0.34]) {
      strut(scene, p, [wx, 0.58, zc - 0.3], [wx, 1.64, zc + 0.3], 0.024, p.primary, 6)
      strut(scene, p, [wx, 1.64, zc - 0.3], [wx, 0.58, zc + 0.3], 0.024, p.primary, 6)
    }
  }

  for (const sx of [-1, 1]) {
    arc(
      scene,
      p,
      [[sx * 0.92, 0.14, -0.58], [sx * 0.95, 1.05, -0.22], [sx * 0.72, 2.24, 0.12], [sx * 0.14, 2.58, 0.42]],
      0.036,
      darkCedar,
      12,
      6,
    )
    for (const [vx, vy, vz, sc] of [
      [sx * 0.96, 0.96, -0.28, 0.22], [sx * 0.92, 1.62, 0.26, 0.24], [sx * 0.66, 2.34, -0.34, 0.26],
      [sx * 0.42, 2.52, 0.28, 0.25], [sx * 0.14, 2.6, -0.06, 0.24],
    ] as const) {
      orb(scene, p, [vx, vy, vz], [sc, sc * 0.78, sc * 0.92], p.accent, 8)
      orb(scene, p, [vx, vy - sc * 0.65, vz + 0.06], [0.065, 0.065, 0.065], fruit, 7)
    }
  }

  const wicket = group(scene, 'GardenWicket', [-0.8, 0.22, 0.68])
  kitBox(wicket, p, [0, 0.44, 0], [0.06, 0.88, 0.06], darkCedar)
  for (const ry of [0.18, 0.66]) kitBox(wicket, p, [0.76, ry, 0], [1.5, 0.055, 0.05], darkCedar)
  for (let i = 0; i < 6; i++) {
    const px = 0.16 + i * 0.24
    const h = 0.76 + Math.sin(((i + 0.5) / 6) * Math.PI) * 0.22
    kitBox(wicket, p, [px, h * 0.5 + 0.04, 0.03], [0.085, h, 0.035], p.primary)
  }
  strut(wicket, p, [0.04, 0.2, 0.03], [1.46, 0.66, 0.03], 0.022, darkCedar, 6)
  kitBox(wicket, p, [1.48, 0.54, 0.05], [0.1, 0.05, 0.06], iron)

  const crates = group(scene, 'FruitCrates', [1.1, 0.15, 0.58])
  kitBox(crates, p, [0, 0.16, 0], [0.38, 0.3, 0.34], crateWood)
  kitBox(crates, p, [0.02, 0.38, -0.22], [0.34, 0.24, 0.3], crateWood, [0, 0.22, 0])
  for (const [fx, fy, fz] of [[-0.08, 0.34, 0.04], [0.08, 0.34, -0.02], [0, 0.36, 0.08], [0.04, 0.52, -0.22]] as const) {
    orb(crates, p, [fx, fy, fz], [0.068, 0.065, 0.068], fruit, 7)
  }

  if (detail) {
    for (let i = 0; i < 8; i++) {
      const a = 0.35 + (i / 7) * (Math.PI - 0.7)
      orb(scene, p, [Math.cos(a) * 0.94, 1.7 + Math.sin(a) * 0.94, (i % 2 === 0 ? 0.42 : -0.42)], [0.055, 0.055, 0.055], blossom, 6)
    }
    for (const sx of [-1.14, 1.14]) {
      for (const z of [-0.52, -0.1, 0.32]) kitBox(scene, p, [sx, 0.18, z], [0.32, 0.04, 0.24], soil)
    }
  }

  root.animations = [new T.AnimationClip('Swing garden wicket', 3.6, [swingTrack('GardenWicket', 'y', 3.6, 70)])]
}

function buildQuarryCrane(root: T.Group, p: Finish, detail: boolean) {
  const floorSlate = tone(p, 'Quarry slate floor', '#424850', 0.9)
  const darkSlate = tone(p, 'Chiseled dark slate', '#383e46', 0.88)
  const iron = tone(p, 'Crane forged iron', '#2d3138', 0.44, 0.56)
  const cable = tone(p, 'Steel hoist cable', '#899199', 0.42, 0.62)
  const darkWood = tone(p, 'Heavy crane beam', '#7d5228', 0.84)

  const scene = group(root, 'SlateQuarryCrane')
  kitBox(scene, p, [0, 0.08, 0], [3.26, 0.16, 2.52], floorSlate)
  kitBox(scene, p, [-0.14, 0.34, -0.66], [2.78, 0.48, 1.06], p.primary)
  kitBox(scene, p, [-0.8, 0.68, -0.74], [1.34, 0.44, 0.78], darkSlate)
  rock(scene, p, [-1.26, 0.08, -0.18], [0.34, 0.32, 0.3], p.primary, 1.6)
  rock(scene, p, [1.24, 0.08, -0.74], [0.36, 0.34, 0.34], darkSlate, 3.8)

  const mx = -0.36
  const mz = -0.34
  cyl(scene, p, [mx, 0.6, mz], 0.32, 0.36, 0.12, iron, [0, 0, 0], 12)
  kitBox(scene, p, [mx, 1.62, mz], [0.18, 2.08, 0.18], p.accent)
  cyl(scene, p, [mx, 2.7, mz], 0.14, 0.14, 0.14, iron, [0, 0, 0], 10)

  for (const [ax, ay, az] of [[-1.3, 0.92, -0.92], [0.74, 0.58, -1.04]] as const) {
    kitBox(scene, p, [ax, ay, az], [0.28, 0.1, 0.28], iron)
    strut(scene, p, [mx, 2.58, mz], [ax, ay, az], 0.062, darkWood, 8)
  }

  const boom = group(scene, 'DerrickBoom', [mx, 0.72, mz])
  cyl(boom, p, [0, 0.12, 0], 0.22, 0.24, 0.22, iron, [0, 0, 0], 10)
  cyl(boom, p, [0, 1.72, 0], 0.17, 0.17, 0.16, iron, [0, 0, 0], 10)
  strut(boom, p, [0, 0.16, 0], [1.34, 1.56, 0.84], 0.072, p.accent, 8)
  strut(boom, p, [0, 1.74, 0], [1.34, 1.56, 0.84], 0.024, cable, 6)
  strut(boom, p, [0, 0.26, 0], [-0.56, 0.52, -0.35], 0.06, darkWood, 8)
  kitBox(boom, p, [-0.66, 0.54, -0.41], [0.42, 0.36, 0.36], p.accent, [0, -0.55, 0])
  kitBox(boom, p, [-0.66, 0.74, -0.41], [0.34, 0.12, 0.28], darkSlate, [0, -0.55, 0])

  cyl(boom, p, [1.34, 1.56, 0.84], 0.13, 0.13, 0.08, iron, [0, 0.55, Math.PI / 2], 10)
  cyl(boom, p, [1.34, 0.96, 0.84], 0.022, 0.022, 1.24, cable, [0, 0, 0], 6)
  kitBox(boom, p, [1.34, 0.38, 0.84], [0.6, 0.08, 0.14], iron)
  for (const ox of [-0.28, 0.28]) kitBox(boom, p, [1.34 + ox, 0.22, 0.84], [0.06, 0.34, 0.1], iron)
  kitBox(boom, p, [1.34, 0.2, 0.84], [0.52, 0.32, 0.4], p.primary)

  const blocks = group(scene, 'SlateBlocks', [-1.06, 0.14, 0.66])
  for (const oz of [-0.18, 0.18]) kitBox(blocks, p, [0, 0.05, oz], [0.74, 0.08, 0.09], darkWood)
  kitBox(blocks, p, [0, 0.19, 0], [0.7, 0.2, 0.52], p.primary)
  kitBox(blocks, p, [-0.04, 0.38, 0.02], [0.58, 0.18, 0.44], darkSlate, [0, 0.12, 0])

  if (detail) {
    cyl(boom, p, [0.22, 0.34, 0.14], 0.1, 0.1, 0.24, iron, [0, 0.55, Math.PI / 2], 8)
    for (const [rx, rz, sd] of [[0.42, 0.78, 1.2], [-0.36, 0.88, 3.1], [1.14, 0.42, 4.9]] as const) {
      rock(scene, p, [rx, 0.1, rz], [0.16, 0.1, 0.14], darkSlate, sd)
    }
    for (const ox of [-1.42, -0.82, -0.22]) {
      kitBox(scene, p, [ox, 1.1, -0.52], [0.05, 0.4, 0.05], darkWood)
    }
    kitBox(scene, p, [-0.82, 1.28, -0.52], [1.28, 0.05, 0.06], darkWood)
  }

  root.animations = [new T.AnimationClip('Swing quarry jib', 4.6, [swingTrack('DerrickBoom', 'y', 4.6, 48, true)])]
}

function buildSignpostCairn(root: T.Group, p: Finish, detail: boolean) {
  const scree = tone(p, 'Alpine scree turf', '#617354', 0.88)
  const darkGranite = tone(p, 'Dark glacial granite', '#6c727a', 0.88)
  const postWood = tone(p, 'Weathered larch post', '#7e6143', 0.86)
  const ivory = tone(p, 'Trail blade ivory', '#ece5d4', 0.78)
  const packGreen = tone(p, 'Alpine pack canvas', '#4b684e', 0.86)
  const leather = tone(p, 'Pack leather strap', '#63412a', 0.82)
  const iron = tone(p, 'Spinner iron spindle', '#3a3f46', 0.46, 0.52)

  const scene = group(root, 'AlpineTrailSignpostCairn')
  mound(scene, p, [0, 0, 0], 1.4, 0.24, 1.26, scree, 14)

  const cairnLayers: readonly [number, number, number, number][] = [
    [0.14, 0.42, 0.16, 0.38],
    [0.29, 0.35, 0.15, 0.32],
    [0.43, 0.29, 0.14, 0.26],
    [0.56, 0.24, 0.13, 0.22],
    [0.68, 0.19, 0.12, 0.18],
    [0.79, 0.15, 0.11, 0.14],
    [0.89, 0.11, 0.1, 0.1],
  ]
  for (let i = 0; i < cairnLayers.length; i++) {
    const cl = cairnLayers[i]
    if (!cl) continue
    const mat = i === cairnLayers.length - 1 ? p.accent : i % 2 === 0 ? p.primary : darkGranite
    rock(scene, p, [-0.46 + (i % 2 === 0 ? 0.02 : -0.02), cl[0], -0.06], [cl[1], cl[2], cl[3]], mat, i * 1.6 + 1)
  }

  const px = 0.46
  const pz = -0.08
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.4
    rock(scene, p, [px + Math.cos(a) * 0.18, 0.14, pz + Math.sin(a) * 0.18], [0.16, 0.13, 0.15], darkGranite, i * 2.4)
  }
  kitBox(scene, p, [px, 1.22, pz], [0.14, 2.16, 0.14], postWood)

  const blades: readonly [number, number, boolean][] = [
    [1.46, 0.35, true],
    [1.68, -2.35, false],
    [1.88, -0.7, true],
    [2.08, 2.25, false],
  ]
  for (const [by, yaw, isAccent] of blades) {
    const blade = group(scene, '', [px, by, pz])
    blade.rotation.y = yaw
    const mat = isAccent ? p.accent : ivory
    kitBox(blade, p, [0.32, 0, 0], [0.58, 0.14, 0.04], mat)
    gable(blade, p, [0.61, -0.07, 0], 0.14, 0.14, 0.04, isAccent ? ivory : p.accent, 0).rotation.z = -Math.PI / 2
    if (detail) kitBox(blade, p, [0.3, 0, 0.028], [0.36, 0.028, 0.016], postWood)
  }

  cyl(scene, p, [px, 2.34, pz], 0.025, 0.032, 0.18, iron, [0, 0, 0], 8)
  const spinner = group(scene, 'WindSpinner', [px, 2.42, pz])
  cyl(spinner, p, [0, 0, 0], 0.05, 0.05, 0.08, iron, [0, 0, 0], 8)
  orb(spinner, p, [0, 0.07, 0], [0.05, 0.05, 0.05], p.accent, 7)
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    const vane = group(spinner, '', [0, 0, 0])
    vane.rotation.y = a
    cyl(vane, p, [0.16, 0, 0], 0.014, 0.014, 0.3, iron, [0, 0, Math.PI / 2], 6)
    cone(vane, p, [0.32, 0, 0.04], 0.08, 0.1, i % 2 === 0 ? p.accent : ivory, [Math.PI / 2, 0, 0], 8)
  }

  const pack = group(scene, 'TrailPack', [-0.08, 0.18, 0.44])
  pack.rotation.y = 0.34
  const packBody = group(pack, '', [0, 0, 0])
  packBody.rotation.x = -0.14
  kitBox(packBody, p, [0, 0.24, 0], [0.36, 0.46, 0.24], packGreen)
  kitBox(packBody, p, [0, 0.46, 0], [0.4, 0.11, 0.28], leather)
  cyl(packBody, p, [0, 0.56, -0.02], 0.08, 0.08, 0.42, p.accent, [0, 0, Math.PI / 2], 8)
  strut(pack, p, [-0.26, 0.02, 0.1], [-0.12, 0.96, -0.14], 0.018, postWood, 6)

  if (detail) {
    kitBox(scene, p, [px, 1.04, pz], [0.165, 0.12, 0.165], p.accent)
    kitBox(scene, p, [px, 1.16, pz], [0.165, 0.07, 0.165], ivory)
    for (const [gx, gz, sd] of [[0.88, 0.52, 1.4], [-0.94, 0.44, 3.3], [0.18, -0.78, 5.1]] as const) {
      rock(scene, p, [gx, 0.12, gz], [0.15, 0.09, 0.13], p.primary, sd)
    }
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + 0.25
      cone(scene, p, [Math.cos(a) * 1.06, 0.24, Math.sin(a) * 0.96], 0.045, 0.2, scree, [0.16, a, 0], 6)
    }
  }

  root.animations = [new T.AnimationClip('Alpine wind spinner', 2.4, [spinTrack('WindSpinner', 'y', 2.4, 1)])]
}

function buildMoatPortcullis(root: T.Group, p: Finish, detail: boolean) {
  const bank = tone(p, 'Moat earth bank', '#5a6b48', 0.9)
  const darkStone = tone(p, 'Castle quoin stone', '#706e67', 0.88)
  const water = waterTone(p, 'Castle moat water', '#2d6e7e', '#0c3b47')
  const iron = tone(p, 'Portcullis iron', '#30343a', 0.45, 0.56)
  const darkVoid = tone(p, 'Gatehouse shadow', '#252629', 0.92)
  const flame = glowTone(p, 'Moat torch flame', '#ffb338', '#ff6414')

  const scene = group(root, 'CastleMoatPortcullis')
  kitBox(scene, p, [0, 0.07, 0], [3.14, 0.14, 2.84], bank)
  kitBox(scene, p, [0, 0.14, 0.18], [3.02, 0.08, 1.32], water)

  kitBox(scene, p, [0, 0.28, 1.08], [1.9, 0.44, 0.56], p.primary)
  kitBox(scene, p, [0, 0.24, 1.36], [1.46, 0.3, 0.18], darkStone)
  for (const sx of [-1, 1]) kitBox(scene, p, [sx * 0.78, 0.62, 1.08], [0.24, 0.28, 0.5], darkStone)

  kitBox(scene, p, [0, 0.28, -0.82], [2.74, 0.44, 0.98], darkStone)
  for (const sx of [-1, 1]) {
    kitBox(scene, p, [sx * 0.88, 1.34, -0.82], [0.78, 1.72, 0.86], p.primary)
  }
  archRing(scene, p, [0, 1.54, -0.82], 0.54, 0.8, 0.78, p.primary)
  kitBox(scene, p, [0, 1.98, -0.82], [1.22, 0.46, 0.74], p.primary)
  kitBox(scene, p, [0, 1.14, -1.08], [1.08, 1.34, 0.18], darkVoid)
  kitBox(scene, p, [0, 2.24, -0.82], [2.62, 0.14, 0.98], darkStone)
  for (const sz of [-0.46, -1.18]) {
    for (const mx of [-1.04, -0.52, 0, 0.52, 1.04]) {
      kitBox(scene, p, [mx, 2.46, sz], [0.32, 0.34, 0.22], p.primary)
    }
  }

  for (const ix of [-0.42, -0.21, 0, 0.21, 0.42]) {
    cyl(scene, p, [ix, 1.56, -0.76], 0.024, 0.024, 0.86, iron, [0, 0, 0], 6)
    cone(scene, p, [ix, 1.09, -0.76], 0.036, 0.12, iron, [Math.PI, 0, 0], 6)
  }
  for (const iy of [1.26, 1.54, 1.82]) kitBox(scene, p, [0, iy, -0.76], [1.02, 0.045, 0.045], iron)

  const bridge = group(scene, 'DrawbridgeDeck', [0, 0.48, -0.36])
  kitBox(bridge, p, [0, 0, 0.64], [1.08, 0.1, 1.32], p.accent)
  for (const sx of [-0.48, 0.48]) {
    kitBox(bridge, p, [sx, 0.02, 0.64], [0.09, 0.12, 1.28], iron)
    strut(bridge, p, [sx, 0.06, 1.06], [sx, 1.24, 0.04], 0.022, iron, 6)
  }

  const torches = group(scene, 'MoatTorches', [0, 0, 0])
  for (const sx of [-1, 1]) {
    kitBox(torches, p, [sx * 0.86, 1.26, -0.36], [0.09, 0.16, 0.14], iron)
    cyl(torches, p, [sx * 0.86, 1.38, -0.26], 0.045, 0.026, 0.32, iron, [0.22, 0, 0], 7)
    cone(torches, p, [sx * 0.86, 1.62, -0.22], 0.075, 0.2, flame, [0, 0, 0], 7)
  }

  if (detail) {
    for (const sx of [-1, 1]) {
      kitBox(scene, p, [sx * 0.88, 1.72, -0.38], [0.08, 0.36, 0.05], darkVoid)
      kitBox(scene, p, [sx * 0.5, 1.74, -0.38], [0.1, 0.1, 0.08], iron)
    }
    for (let i = 0; i < 4; i++) {
      kitBox(bridge, p, [0, 0.06, 0.18 + i * 0.3], [0.96, 0.025, 0.045], iron)
    }
    for (const sx of [-1.22, 1.22]) rock(scene, p, [sx, 0.08, 0.92], [0.22, 0.14, 0.18], darkStone, sx * 2.5)
  }

  root.animations = [new T.AnimationClip('Raise drawbridge', 4.2, [swingTrack('DrawbridgeDeck', 'x', 4.2, -56)])]
}

export const terrainStructuresC: readonly TerrainStructureSpec[] = [
  {
    id: 'ancient-sundial-plaza',
    riggedParts: [rot('SundialRing', 'Astrolabe gnomon ring', 'y', [0, 360], 'Spins the bronze astrolabe meridian ring above the sundial plate')],
    detachableParts: [det('CornerObelisks', 'Corner stone obelisks', 'Removable pair of carved stone obelisks flanking the plaza entrance')],
    build: buildSundialPlaza,
  },
  {
    id: 'wooden-orchard-trellis',
    riggedParts: [rot('GardenWicket', 'Garden wicket gate', 'y', [0, 85], 'Swings open the cedar picket wicket gate beneath the arched trellis')],
    detachableParts: [det('FruitCrates', 'Orchard fruit crates', 'Removable wooden harvest crates brimming with orchard fruit')],
    build: buildOrchardTrellis,
  },
  {
    id: 'slate-quarry-crane',
    riggedParts: [rot('DerrickBoom', 'Pivoting derrick boom', 'y', [-58, 58], 'Slews the timber quarry crane jib, counterweight box, and hoisted slate')],
    detachableParts: [det('SlateBlocks', 'Quarried slate stack', 'Removable stack of dressed slate slabs resting on timber sleepers')],
    build: buildQuarryCrane,
  },
  {
    id: 'alpine-trail-signpost-cairn',
    riggedParts: [rot('WindSpinner', 'Trailhead wind spinner', 'y', [0, 360], 'Spins the four-vane alpine anemometer atop the directional signpost')],
    detachableParts: [det('TrailPack', 'Hiker trail pack', 'Removable canvas backpack, bedroll, and trekking pole leaning on the cairn')],
    build: buildSignpostCairn,
  },
  {
    id: 'castle-moat-portcullis',
    riggedParts: [rot('DrawbridgeDeck', 'Castle drawbridge deck', 'x', [-72, 0], 'Raises and lowers the iron-strapped oak drawbridge over the moat')],
    detachableParts: [det('MoatTorches', 'Bastion wall torches', 'Removable wrought-iron sconce torches mounted beside the castle arch')],
    build: buildMoatPortcullis,
  },
]
