import * as T from 'three'
import { box, group, mesh, motion, ring, rotationTrack, shell, spinTrack, strut } from '../parts'
import type { Finish, Point } from '../parts'
import type { DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema'
import type { BrowseCategory } from '../../data/browse'

export interface TerrainAssetDef {
  readonly id: string
  readonly code: string
  readonly category: 'Object'
  readonly browseCategory: BrowseCategory
  readonly name: string
  readonly primary: string
  readonly accent: string
  readonly description: string
  readonly physicsBody: 'static'
  readonly riggedParts: readonly RiggedPartSpec[]
  readonly detachableParts: readonly DetachablePartSpec[]
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void
}

function tone(p: Finish, name: string, color: string, roughness = 0.78, metalness = 0.05, emissive?: string) {
  const mat = p.hd
    ? new T.MeshPhysicalMaterial({ name, color, roughness: roughness * 0.88, metalness, clearcoat: metalness > 0.25 ? 0.35 : 0.04, clearcoatRoughness: 0.4 })
    : new T.MeshStandardMaterial({ name, color, roughness, metalness, flatShading: true })
  if (emissive) {
    mat.emissive.set(emissive)
    mat.emissiveIntensity = 0.5
  }
  return mat
}

function orb(parent: T.Object3D, p: Finish, at: Point, scale: Point, mat: T.Material, seg = 10) {
  const m = mesh(parent, new T.SphereGeometry(1, p.hd ? seg * 2 : seg, p.hd ? seg + 4 : Math.max(6, Math.floor(seg * 0.7))), mat, at)
  m.scale.set(...scale)
  return m
}

function cone(parent: T.Object3D, p: Finish, at: Point, r: number, h: number, mat: T.Material, rot: Point = [0, 0, 0], seg = 9) {
  const m = mesh(parent, new T.ConeGeometry(r, h, p.hd ? seg * 3 : seg), mat, at)
  m.rotation.set(...rot)
  return m
}

function cyl(parent: T.Object3D, p: Finish, at: Point, top: number, bot: number, h: number, mat: T.Material, rot: Point = [0, 0, 0], seg = 10) {
  const m = mesh(parent, new T.CylinderGeometry(top, bot, h, p.hd ? seg * 3 : seg), mat, at)
  m.rotation.set(...rot)
  return m
}

function lathe(parent: T.Object3D, p: Finish, at: Point, pts: readonly [number, number][], mat: T.Material, seg = 12) {
  const geo = new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), p.hd ? seg * 3 : seg)
  geo.normalizeNormals()
  return mesh(parent, geo, mat, at)
}

function arc(parent: T.Object3D, p: Finish, path: readonly (readonly [number, number, number])[], r: number, mat: T.Material, seg = 12, rad = 6) {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)))
  return mesh(parent, new T.TubeGeometry(curve, p.hd ? seg * 2 : seg, r, p.hd ? rad * 2 : rad, false), mat, [0, 0, 0])
}

function mound(parent: T.Object3D, p: Finish, at: Point, rx: number, ry: number, rz: number, mat: T.Material) {
  const m = lathe(parent, p, at, [[0.01, 0], [1, 0], [0.97, 0.28], [0.84, 0.66], [0.54, 0.93], [0.01, 1]], mat, 12)
  m.scale.set(rx, ry, rz)
  return m
}

function rock(parent: T.Object3D, p: Finish, at: readonly [number, number, number], scale: readonly [number, number, number], mat: T.Material, seed = 1) {
  const geo = new T.IcosahedronGeometry(1, p.hd ? 2 : 0)
  const pos = geo.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const warp = 1 + 0.16 * Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 - seed) + 0.08 * Math.sin(y * 4.3 + seed * 2)
    pos.setXYZ(i, x * warp, Math.max(-0.52, y * warp), z * warp)
  }
  geo.computeVertexNormals()
  const m = mesh(parent, geo, mat, [at[0], at[1] + 0.52 * scale[1], at[2]])
  m.scale.set(...scale)
  return m
}

function sway(node: string, axis: 'x' | 'y' | 'z', duration: number, lo: number, hi: number) {
  return rotationTrack(node, axis, [0, duration * 0.25, duration * 0.75, duration], [0, hi, lo, 0])
}

function buildPineGrove(root: T.Group, p: Finish, detail: boolean) {
  const earth = tone(p, 'Alpine earth', '#4f6348', 0.88)
  const granite = tone(p, 'Granite stone', '#868c90', 0.84)
  const moss = tone(p, 'Alpine moss', '#5f874f', 0.86)
  const grove = group(root, 'PineGrove')
  mound(grove, p, [0, 0, 0], 1.28, 0.24, 1.18, earth)
  cyl(grove, p, [-0.14, 0.68, -0.06], 0.14, 0.2, 1.12, p.accent)
  const crown = group(grove, 'MainCrown', [-0.14, 0.96, -0.06])
  for (const [y, r, h] of [[0.42, 0.84, 0.96], [0.96, 0.68, 0.92], [1.46, 0.5, 0.82], [1.9, 0.32, 0.66]] as const) {
    cone(crown, p, [0, y, 0], r, h, p.primary, [0, y, 0], 8)
  }
  for (const [x, z, sc] of [[-0.78, 0.34, 0.62], [0.58, -0.52, 0.72]] as const) {
    cyl(grove, p, [x, 0.38 * sc + 0.1, z], 0.1 * sc, 0.14 * sc, 0.72 * sc, p.accent)
    for (let k = 0; k < 3; k++) {
      cone(grove, p, [x, (0.72 + k * 0.44) * sc + 0.1, z], (0.64 - k * 0.16) * sc, 0.76 * sc, p.primary, [0, k, 0], 7)
    }
  }
  const boulder = group(grove, 'CampBoulder', [0.76, 0, 0.48])
  rock(boulder, p, [0, 0, 0], [0.46, 0.38, 0.42], granite, 2.4)
  rock(boulder, p, [-0.34, 0, 0.18], [0.22, 0.18, 0.2], granite, 4.1)
  orb(boulder, p, [0.05, 0.42, -0.04], [0.28, 0.08, 0.24], moss, 8)
  if (detail) {
    cyl(grove, p, [-0.08, 0.26, 0.74], 0.16, 0.19, 0.24, p.accent)
    cyl(grove, p, [-0.08, 0.38, 0.74], 0.14, 0.14, 0.02, p.stencil)
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05
      orb(crown, p, [Math.sin(a) * 0.52, 0.22 + (i % 2) * 0.44, Math.cos(a) * 0.52], [0.045, 0.068, 0.045], p.accent, 6)
    }
  }
  root.animations = [new T.AnimationClip('Alpine breeze', 4.0, [sway('MainCrown', 'z', 4.0, -0.15, 0.15)])]
}

function buildSakura(root: T.Group, p: Finish, detail: boolean) {
  const moss = tone(p, 'Garden moss', '#5d8452', 0.86)
  const stone = tone(p, 'Lantern stone', '#a29e96', 0.84)
  const glow = tone(p, 'Lantern warm glow', '#ffd782', 0.35, 0.05, '#ffaa3b')
  const blush = tone(p, 'Pale petal', '#fbd5e2', 0.75)
  const scene = group(root, 'SakuraGrove')
  mound(scene, p, [0, 0, 0], 1.32, 0.24, 1.24, moss)
  arc(scene, p, [[-0.18, 0.1, 0], [-0.08, 0.74, -0.06], [0.06, 1.38, 0.02], [-0.04, 1.82, 0]], 0.17, p.accent, 12, 7)
  for (const [end, r] of [[[0.72, 2.08, 0.22], 0.09], [[-0.74, 2.14, -0.14], 0.095], [[0.14, 2.18, -0.58], 0.085]] as const) {
    arc(scene, p, [[0, 1.32, 0], [end[0] * 0.55, 1.72, end[2] * 0.55], end], r, p.accent, 8, 6)
  }
  const canopy = group(scene, 'BlossomCanopy', [0, 1.66, 0])
  const puffs: [Point, Point, boolean][] = [
    [[0, 0.72, 0], [0.76, 0.52, 0.72], false], [[-0.68, 0.52, -0.08], [0.64, 0.45, 0.58], false],
    [[0.72, 0.46, 0.24], [0.62, 0.44, 0.58], false], [[0.12, 0.56, -0.62], [0.58, 0.42, 0.54], true],
    [[-0.24, 0.42, 0.62], [0.56, 0.38, 0.52], true], [[0.38, 0.92, -0.16], [0.5, 0.38, 0.48], true],
    [[-0.42, 0.88, 0.18], [0.46, 0.34, 0.44], false],
  ]
  for (const [at, sc, pale] of puffs) orb(canopy, p, at, sc, pale ? blush : p.primary, 9)
  const lantern = group(scene, 'StoneLantern', [0.88, 0, 0.54])
  cyl(lantern, p, [0, 0.08, 0], 0.2, 0.24, 0.16, stone, [0, 0, 0], 6)
  cyl(lantern, p, [0, 0.36, 0], 0.085, 0.1, 0.44, stone, [0, 0, 0], 6)
  cyl(lantern, p, [0, 0.62, 0], 0.22, 0.14, 0.1, stone, [0, 0, 0], 6)
  cyl(lantern, p, [0, 0.78, 0], 0.12, 0.12, 0.22, glow, [0, 0, 0], 6)
  cone(lantern, p, [0, 0.98, 0], 0.32, 0.22, stone, [0, 0, 0], 6)
  orb(lantern, p, [0, 1.12, 0], [0.06, 0.07, 0.06], stone, 7)
  if (detail) {
    for (let i = 0; i < 10; i++) {
      const a = i * 0.63
      orb(scene, p, [Math.sin(a) * (0.45 + (i % 3) * 0.26), 0.19, Math.cos(a) * (0.4 + (i % 2) * 0.3)], [0.075, 0.015, 0.06], i % 2 ? p.primary : blush, 6)
    }
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2
      cyl(lantern, p, [Math.sin(a) * 0.13, 0.78, Math.cos(a) * 0.13], 0.022, 0.022, 0.24, stone, [0, 0, 0], 6)
    }
  }
  root.animations = [new T.AnimationClip('Petal breeze', 4.2, [sway('BlossomCanopy', 'z', 4.2, -0.15, 0.15)])]
}

function buildOasis(root: T.Group, p: Finish, detail: boolean) {
  const trunkMat = tone(p, 'Palm bark', '#8a6240', 0.85)
  const water = tone(p, 'Spring water', '#39b8c7', 0.18, 0.15, '#135763')
  const clay = tone(p, 'Terracotta clay', '#c8623d', 0.74)
  const sandStone = tone(p, 'Desert rock', '#b99364', 0.85)
  const oasis = group(root, 'OasisSpring')
  mound(oasis, p, [0, 0, 0], 1.36, 0.24, 1.28, p.accent)
  cyl(oasis, p, [0.16, 0.21, 0.16], 0.68, 0.72, 0.08, water, [0, 0, 0], 16)
  for (const [at, sc] of [[[-0.56, 0.08, 0.62], [0.28, 0.2, 0.24]], [[0.82, 0.08, -0.34], [0.3, 0.22, 0.26]]] as const) {
    rock(oasis, p, at, sc, sandStone, at[0] * 3)
  }
  const trunkPts: Point[] = [[-0.52, 0.16, -0.44], [-0.46, 0.92, -0.36], [-0.26, 1.72, -0.2], [-0.08, 2.38, -0.06]]
  arc(oasis, p, trunkPts, 0.13, trunkMat, 14, 8)
  arc(oasis, p, [[-0.78, 0.16, -0.18], [-0.94, 0.78, -0.12], [-1.02, 1.38, 0.02]], 0.095, trunkMat, 10, 7)
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5
    arc(oasis, p, [[-1.02, 1.38, 0.02], [-1.02 + Math.sin(a) * 0.36, 1.54, 0.02 + Math.cos(a) * 0.36], [-1.02 + Math.sin(a) * 0.62, 1.24, 0.02 + Math.cos(a) * 0.62]], 0.045, p.primary, 8, 5)
  }
  const crown = group(oasis, 'PalmCrown', [-0.08, 2.38, -0.06])
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7
    const s = Math.sin(a), c = Math.cos(a)
    arc(crown, p, [[0, 0, 0], [s * 0.45, 0.32, c * 0.45], [s * 0.94, 0.16, c * 0.94], [s * 1.18, -0.18, c * 1.18]], 0.052, p.primary, 10, 5)
    orb(crown, p, [s * 0.62, 0.24, c * 0.62], [0.18, 0.032, 0.36], p.primary, 7).rotation.set(0.18, a, 0)
  }
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3
    orb(crown, p, [Math.sin(a) * 0.13, -0.08, Math.cos(a) * 0.13], [0.095, 0.105, 0.095], trunkMat, 7)
  }
  const jug = group(oasis, 'WaterJug', [0.78, 0, 0.66])
  lathe(jug, p, [0, 0.02, 0], [[0.01, 0], [0.13, 0], [0.22, 0.18], [0.2, 0.36], [0.1, 0.48], [0.13, 0.56], [0.09, 0.56], [0.08, 0.46]], clay, 12)
  for (const s of [-1, 1]) {
    arc(jug, p, [[s * 0.11, 0.48, 0], [s * 0.24, 0.44, 0], [s * 0.2, 0.28, 0]], 0.024, clay, 8, 5)
  }
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = 0.5 + i * 0.55
      cone(oasis, p, [0.16 + Math.sin(a) * 0.68, 0.34, 0.16 + Math.cos(a) * 0.68], 0.035, 0.34, p.primary, [0.12, a, 0], 6)
    }
    ring(jug, [0, 0.44, 0], 0.125, 0.02, 0.04, p.accent)
  }
  root.animations = [new T.AnimationClip('Oasis wind', 3.8, [sway('PalmCrown', 'z', 3.8, -0.22, 0.22)])]
}

function buildGeode(root: T.Group, p: Finish, detail: boolean) {
  const crust = tone(p, 'Geode crust', '#3d404a', 0.86)
  const glow = tone(p, 'Crystal sheen', '#70efe0', 0.22, 0.2, '#2bc4b5')
  const spire = group(root, 'GeodeSpire')
  mound(spire, p, [0, 0, 0], 1.08, 0.34, 1.02, crust)
  rock(spire, p, [-0.55, 0, -0.32], [0.42, 0.46, 0.38], crust, 1.7)
  rock(spire, p, [0.46, 0, -0.46], [0.38, 0.42, 0.34], crust, 3.2)
  const prism = (parent: T.Object3D, at: Point, r: number, h: number, rot: Point, mat: T.Material) => {
    const g = group(parent, '', at)
    g.rotation.set(...rot)
    cyl(g, p, [0, h * 0.42, 0], r * 0.85, r, h * 0.84, mat, [0, 0, 0], 6)
    cone(g, p, [0, h * 0.96, 0], r * 0.85, h * 0.28, mat, [0, 0, 0], 6)
  }
  prism(spire, [0, 0.18, 0], 0.34, 1.85, [0.06, 0.2, -0.05], p.primary)
  prism(spire, [-0.36, 0.16, 0.22], 0.22, 1.32, [0.22, 0.4, 0.28], p.primary)
  prism(spire, [0.34, 0.16, 0.18], 0.2, 1.18, [0.16, -0.3, -0.32], p.accent)
  prism(spire, [0.06, 0.16, -0.38], 0.24, 1.44, [-0.26, 0.1, 0.08], p.primary)
  prism(spire, [-0.28, 0.18, -0.28], 0.16, 0.95, [-0.22, 0.5, 0.32], p.accent)
  const floater = group(spire, 'FloatingShard', [0, 2.55, 0])
  cone(floater, p, [0, 0.34, 0], 0.22, 0.56, p.accent, [0, 0, 0], 6)
  cone(floater, p, [0, -0.2, 0], 0.22, 0.52, p.primary, [Math.PI, 0, 0], 6)
  ring(floater, [0, 0.08, 0], 0.36, 0.035, 0.05, p.accent).rotation.x = 0.35
  const cluster = group(spire, 'SmallCluster', [0.84, 0, 0.46])
  rock(cluster, p, [0, 0, 0], [0.34, 0.22, 0.32], crust, 5.1)
  prism(cluster, [0, 0.14, 0], 0.13, 0.72, [0.12, 0.2, -0.18], p.primary)
  prism(cluster, [0.14, 0.12, 0.08], 0.09, 0.5, [0.24, 0, -0.34], p.accent)
  prism(cluster, [-0.12, 0.12, -0.06], 0.085, 0.46, [-0.15, 0, 0.24], glow)
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      orb(floater, p, [Math.sin(a) * 0.42, 0.08 + Math.sin(a * 2) * 0.06, Math.cos(a) * 0.42], [0.045, 0.045, 0.045], glow, 6)
    }
    ring(spire, [0, 0.44, 0], 0.48, 0.04, 0.06, p.accent)
  }
  root.animations = [new T.AnimationClip('Resonance spin', 4.0, [spinTrack('FloatingShard', 'y', 4.0, 1)])]
}

function buildBridge(root: T.Group, p: Finish, detail: boolean) {
  const stoneDark = tone(p, 'Cobble stone', '#6d6963', 0.88)
  const moss = tone(p, 'Bridge moss', '#5b7f4b', 0.86)
  const glow = tone(p, 'Bridge lantern glow', '#ffd786', 0.28, 0.08, '#ff9f2e')
  const bridge = group(root, 'StoneBridge')
  for (const s of [-1, 1]) {
    shell(bridge, [s * 1.44, 0.34, 0], [0.76, 0.68, 1.48], p.primary, 0.16)
    shell(bridge, [s * 1.68, 0.12, 0], [0.36, 0.24, 1.38], stoneDark, 0.14)
    for (const z of [-0.62, 0.62]) {
      shell(bridge, [s * 1.18, 0.96, z], [0.24, 0.66, 0.24], p.primary, 0.2)
      shell(bridge, [s * 1.18, 1.32, z], [0.3, 0.1, 0.3], p.accent, 0.24)
    }
    const post = group(bridge, '', [s * 1.18, 1.34, 0.62])
    cyl(post, p, [0, 0.34, 0], 0.045, 0.055, 0.68, p.dark)
    strut(post, [0, 0.64, 0], [-s * 0.24, 0.64, 0], 0.032, p.dark, 10)
    const lName = s > 0 ? 'BridgeLanternL' : 'BridgeLanternR'
    const lantern = group(bridge, lName, [s * 0.94, 1.98, 0.62])
    cyl(lantern, p, [0, -0.08, 0], 0.015, 0.015, 0.16, p.edge)
    cone(lantern, p, [0, -0.18, 0], 0.14, 0.1, p.accent, [0, 0, 0], 6)
    cyl(lantern, p, [0, -0.32, 0], 0.095, 0.085, 0.2, glow, [0, 0, 0], 6)
    cyl(lantern, p, [0, -0.44, 0], 0.11, 0.07, 0.06, p.accent, [0, 0, 0], 6)
  }
  const segs = 11
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1)
    const a = (t - 0.5) * 1.9
    const x = Math.sin(a) * 1.42, y = Math.cos(a) * 0.92 + 0.06
    const block = group(bridge, '', [x, y, 0])
    block.rotation.z = -a
    const key = i === 5
    shell(block, [0, 0, 0], [0.29, key ? 0.28 : 0.22, 1.4], key ? p.accent : p.primary, 0.18)
    for (const z of [-0.62, 0.62]) shell(block, [0, 0.26, z], [0.27, 0.3, 0.16], p.primary, 0.18)
    if (detail) box(block, [0, 0.13, 0], [0.22, 0.05, 1.05], stoneDark)
  }
  if (detail) {
    for (const s of [-1, 1]) {
      orb(bridge, p, [s * 1.48, 0.66, -0.58], [0.22, 0.08, 0.16], moss, 7)
      orb(bridge, p, [s * 1.38, 0.14, 0.72], [0.2, 0.1, 0.14], moss, 7)
    }
  }
  root.animations = [
    new T.AnimationClip('Lantern sway', 3.4, [
      sway('BridgeLanternL', 'z', 3.4, -0.3, 0.3),
      sway('BridgeLanternR', 'z', 3.4, 0.28, -0.28),
    ]),
  ]
}

function buildBambooShrine(root: T.Group, p: Finish, detail: boolean) {
  const stone = tone(p, 'Basin stone', '#83888c', 0.84)
  const water = tone(p, 'Shrine water', '#3eb0bd', 0.18, 0.15, '#12535c')
  const moss = tone(p, 'Zen moss', '#568044', 0.88)
  const shrine = group(root, 'BambooShrine')
  mound(shrine, p, [0, 0, 0], 1.18, 0.18, 0.98, stone)
  lathe(shrine, p, [0, 0.14, 0.16], [[0.01, 0], [0.46, 0], [0.52, 0.16], [0.5, 0.42], [0.42, 0.42], [0.4, 0.24], [0.01, 0.24]], stone, 14)
  cyl(shrine, p, [0, 0.48, 0.16], 0.41, 0.41, 0.05, water, [0, 0, 0], 14)
  for (const [x, z, h] of [[-0.64, -0.52, 2.2], [-0.38, -0.62, 2.45], [-0.1, -0.58, 2.05], [0.22, -0.6, 2.35], [0.54, -0.54, 2.1]] as const) {
    cyl(shrine, p, [x, h * 0.5 + 0.1, z], 0.062, 0.072, h, p.primary, [0, 0, 0], 10)
    if (detail) {
      for (let k = 1; k <= 3; k++) ring(shrine, [x, k * (h * 0.26) + 0.1, z], 0.078, 0.015, 0.032, p.accent)
    }
  }
  shell(shrine, [-0.05, 1.92, -0.44], [1.48, 0.12, 0.52], p.accent, 0.24)
  for (const s of [-1, 1]) cyl(shrine, p, [s * 0.28, 0.56, 0.12], 0.048, 0.054, 0.88, p.accent)
  cyl(shrine, p, [0, 0.96, 0.12], 0.025, 0.025, 0.64, p.dark, [0, 0, Math.PI / 2])
  cyl(shrine, p, [0, 1.38, -0.14], 0.048, 0.054, 0.66, p.primary, [Math.PI * 0.42, 0, 0])
  const rocker = group(shrine, 'BambooRocker', [0, 0.96, 0.12])
  cyl(rocker, p, [0, 0, 0.02], 0.068, 0.072, 0.84, p.primary, [Math.PI * 0.44, 0, 0])
  ring(rocker, [0, 0, 0], 0.084, 0.018, 0.06, p.accent).rotation.x = Math.PI / 2
  cyl(rocker, p, [0, 0.06, 0.42], 0.05, 0.05, 0.04, p.inset, [Math.PI * 0.44, 0, 0])
  const mossStone = group(shrine, 'MossStone', [0.84, 0, 0.46])
  rock(mossStone, p, [0, 0, 0], [0.36, 0.28, 0.34], stone, 2.8)
  orb(mossStone, p, [0.02, 0.31, -0.02], [0.24, 0.09, 0.22], moss, 8)
  if (detail) {
    orb(mossStone, p, [-0.02, 0.41, 0], [0.11, 0.055, 0.1], stone, 7)
    cyl(shrine, p, [0, 0.82, 0.38], 0.018, 0.024, 0.64, water)
  }
  root.animations = [
    new T.AnimationClip('Water tip', 3.6, [rotationTrack('BambooRocker', 'x', [0, 1.2, 2.0, 2.8, 3.6], [0, 0.34, -0.52, -0.22, 0])]),
  ]
}

function buildVolcano(root: T.Group, p: Finish, detail: boolean) {
  const obsidian = tone(p, 'Volcanic obsidian', '#1d1c26', 0.22, 0.38)
  const magmaGlow = tone(p, 'Molten core', '#ff8c2b', 0.25, 0.05, '#ff4d12')
  const vent = group(root, 'BasaltVent')
  mound(vent, p, [0, 0, 0], 1.24, 0.22, 1.18, p.dark)
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10
    const rad = i % 2 === 0 ? 0.68 : 0.88
    const h = i % 2 === 0 ? 1.24 + (i % 3) * 0.16 : 0.78 + (i % 3) * 0.14
    cyl(vent, p, [Math.sin(a) * rad, h * 0.5, Math.cos(a) * rad], 0.24, 0.27, h, p.primary, [0, a, 0], 6)
    if (detail && i % 2 === 0) {
      box(vent, [Math.sin(a + 0.3) * 0.68, 0.56, Math.cos(a + 0.3) * 0.68], [0.06, 0.42, 0.08], p.accent).rotation.y = a
    }
  }
  const magma = group(vent, 'MagmaCore', [0, 0, 0])
  cyl(magma, p, [0, 0.62, 0], 0.56, 0.6, 0.84, p.accent, [0, 0, 0], 14)
  orb(magma, p, [0, 1.04, 0], [0.54, 0.24, 0.54], p.accent, 12)
  orb(magma, p, [0.16, 1.24, 0.1], [0.2, 0.16, 0.2], magmaGlow, 9)
  orb(magma, p, [-0.18, 1.2, -0.12], [0.15, 0.13, 0.15], magmaGlow, 8)
  if (detail) orb(magma, p, [0, 1.44, 0.04], [0.12, 0.14, 0.12], magmaGlow, 8)
  const spire = group(vent, 'ObsidianSpire', [0.96, 0, 0.52])
  cone(spire, p, [0, 0.94, 0], 0.28, 1.76, obsidian, [0.08, 0.4, -0.14], 6)
  cone(spire, p, [0.22, 0.56, 0.14], 0.16, 1.0, obsidian, [0.2, 0.1, -0.28], 6)
  cyl(spire, p, [0, 0.08, 0], 0.26, 0.3, 0.16, p.accent, [0, 0, 0], 6)
  root.animations = [new T.AnimationClip('Magma surge', 3.2, [motion('MagmaCore', 3.2, [0, 0.26, 0.05, 0.22, 0])])]
}

function buildFairyRing(root: T.Group, p: Finish, detail: boolean) {
  const moss = tone(p, 'Forest moss', '#4c7a45', 0.88)
  const sporeGlow = tone(p, 'Bioluminescent spore', '#fff0a8', 0.24, 0.05, '#ffd452')
  const ringRoot = group(root, 'FairyRing')
  mound(ringRoot, p, [0, 0, 0], 1.24, 0.24, 1.22, moss)
  lathe(ringRoot, p, [0, 0.16, 0], [[0.01, 0], [0.3, 0], [0.24, 0.34], [0.18, 0.78], [0.24, 1.28], [0.01, 1.32]], p.accent, 14)
  ring(ringRoot, [0, 0.94, 0], 0.27, 0.06, 0.06, p.accent)
  const giantCap = group(ringRoot, 'GiantCap', [0, 0, 0])
  lathe(giantCap, p, [0, 1.18, 0], [[0.76, 0.02], [0.78, 0.14], [0.64, 0.4], [0.38, 0.58], [0.01, 0.64]], p.primary, 16)
  cyl(giantCap, p, [0, 1.19, 0], 0.72, 0.22, 0.08, p.accent, [0, 0, 0], 16)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const rad = i % 2 === 0 ? 0.52 : 0.34
    const y = i % 2 === 0 ? 1.48 : 1.66
    orb(giantCap, p, [Math.sin(a) * rad, y, Math.cos(a) * rad], [0.1, 0.055, 0.1], p.accent, 8)
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.25
    const h = 0.42 + (i % 3) * 0.14
    const x = Math.sin(a) * 0.88, z = Math.cos(a) * 0.86
    cyl(ringRoot, p, [x, h * 0.5 + 0.1, z], 0.065, 0.09, h, p.accent)
    lathe(ringRoot, p, [x, h + 0.06, z], [[0.24, 0], [0.22, 0.1], [0.12, 0.2], [0.01, 0.22]], p.primary, 10)
    if (detail) orb(ringRoot, p, [x, h + 0.26, z], [0.055, 0.025, 0.055], p.accent, 6)
  }
  const spores = group(ringRoot, 'GlowSpores', [0, 0, 0])
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10
    const rad = 0.58 + (i % 3) * 0.22
    const y = 0.88 + i * 0.13
    orb(spores, p, [Math.sin(a) * rad, y, Math.cos(a) * rad], [0.052, 0.052, 0.052], sporeGlow, 7)
  }
  if (detail) {
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + 0.5
      cone(ringRoot, p, [Math.sin(a) * 0.56, 0.3, Math.cos(a) * 0.56], 0.045, 0.22, moss, [0.18, a, 0], 6)
    }
  }
  root.animations = [new T.AnimationClip('Spore pulse', 3.2, [motion('GiantCap', 3.2, [0, 0.17, 0.03, 0.14, 0])])]
}

export const terrainPack: readonly TerrainAssetDef[] = [
  {
    id: 'alpine-pine-grove', code: 'TR-01', category: 'Object', browseCategory: 'terrain', name: 'Alpine Pine Grove',
    primary: '#2f6d4a', accent: '#b48a5a', description: 'A cluster of tiered alpine spruces on a mossy knoll with a removable camp boulder.',
    physicsBody: 'static',
    riggedParts: [{ name: 'MainCrown', label: 'Main pine crown', type: 'rotate', axis: 'z', range: [-10, 10], describe: 'Sways the tallest pine crown in the mountain breeze' }],
    detachableParts: [{ name: 'CampBoulder', label: 'Camp boulder', describe: 'Removable mossy granite boulder beside the pine grove' }],
    build: buildPineGrove,
  },
  {
    id: 'sakura-blossom-tree', code: 'TR-02', category: 'Object', browseCategory: 'terrain', name: 'Sakura Blossom Tree',
    primary: '#f2a2bc', accent: '#6b473b', description: 'A gnarled cherry blossom tree over a garden mound paired with a carved stone lantern.',
    physicsBody: 'static',
    riggedParts: [{ name: 'BlossomCanopy', label: 'Blossom canopy', type: 'rotate', axis: 'z', range: [-10, 10], describe: 'Sways the cherry blossom canopy in a spring breeze' }],
    detachableParts: [{ name: 'StoneLantern', label: 'Stone lantern', describe: 'Removable carved stone garden lantern beside the roots' }],
    build: buildSakura,
  },
  {
    id: 'oasis-palm-spring', code: 'TR-03', category: 'Object', browseCategory: 'terrain', name: 'Oasis Palm Spring',
    primary: '#4b8f44', accent: '#dfb56b', description: 'A turquoise desert spring shaded by curved date palms and a clay amphora.',
    physicsBody: 'static',
    riggedParts: [{ name: 'PalmCrown', label: 'Palm crown', type: 'rotate', axis: 'z', range: [-14, 14], describe: 'Sways the arching palm fronds above the oasis' }],
    detachableParts: [{ name: 'WaterJug', label: 'Clay water jug', describe: 'Removable terracotta amphora resting by the spring edge' }],
    build: buildOasis,
  },
  {
    id: 'crystal-geode-spire', code: 'TR-04', category: 'Object', browseCategory: 'terrain', name: 'Crystal Geode Spire',
    primary: '#7c5ce6', accent: '#46e2d0', description: 'A fractured mineral geode spire crowned by a levitating crystal shard.',
    physicsBody: 'static',
    riggedParts: [{ name: 'FloatingShard', label: 'Floating shard', type: 'rotate', axis: 'y', range: [0, 360], describe: 'Spins the levitating crystal shard above the spire' }],
    detachableParts: [{ name: 'SmallCluster', label: 'Side crystal cluster', describe: 'Removable secondary quartz cluster on the outer rock shelf' }],
    build: buildGeode,
  },
  {
    id: 'stone-arch-bridge', code: 'TR-05', category: 'Object', browseCategory: 'terrain', name: 'Stone Arch Bridge',
    primary: '#a89f91', accent: '#c8733c', description: 'A dressed masonry footbridge with keystone arch and twin hanging lanterns.',
    physicsBody: 'static',
    riggedParts: [
      { name: 'BridgeLanternL', label: 'Left bridge lantern', type: 'rotate', axis: 'z', range: [-20, 20], describe: 'Swings the left hanging bridge lantern' },
      { name: 'BridgeLanternR', label: 'Right bridge lantern', type: 'rotate', axis: 'z', range: [-20, 20], describe: 'Swings the right hanging bridge lantern' },
    ],
    detachableParts: [], build: buildBridge,
  },
  {
    id: 'bamboo-water-shrine', code: 'TR-06', category: 'Object', browseCategory: 'terrain', name: 'Bamboo Water Shrine',
    primary: '#6ea149', accent: '#b8834b', description: 'A serene stone water basin with a rocking bamboo fountain and zen moss boulder.',
    physicsBody: 'static',
    riggedParts: [{ name: 'BambooRocker', label: 'Bamboo rocker', type: 'rotate', axis: 'x', range: [-32, 20], describe: 'Rocks the bamboo fountain tube forward and back' }],
    detachableParts: [{ name: 'MossStone', label: 'Mossy river stone', describe: 'Removable moss-covered zen stone beside the water basin' }],
    build: buildBambooShrine,
  },
  {
    id: 'volcanic-basalt-vent', code: 'TR-07', category: 'Object', browseCategory: 'terrain', name: 'Volcanic Basalt Vent',
    primary: '#3d414a', accent: '#ff641f', description: 'A ring of hexagonal basalt columns enclosing a surging molten magma core.',
    physicsBody: 'static',
    riggedParts: [{ name: 'MagmaCore', label: 'Magma core', type: 'slide', axis: 'y', range: [0, 0.28], describe: 'Raises and lowers the molten magma core inside the vent' }],
    detachableParts: [{ name: 'ObsidianSpire', label: 'Obsidian spire', describe: 'Removable jagged volcanic glass column on the outer rim' }],
    build: buildVolcano,
  },
  {
    id: 'mushroom-fairy-ring', code: 'TR-08', category: 'Object', browseCategory: 'terrain', name: 'Mushroom Fairy Ring',
    primary: '#d94b5c', accent: '#f5e7b8', description: 'A woodland toadstool circle around a pulsing giant mushroom and glowing spores.',
    physicsBody: 'static',
    riggedParts: [{ name: 'GiantCap', label: 'Giant mushroom cap', type: 'slide', axis: 'y', range: [0, 0.18], describe: 'Bobs the giant central mushroom cap gently upward' }],
    detachableParts: [{ name: 'GlowSpores', label: 'Glowing spore cloud', describe: 'Removable halo of bioluminescent floating forest spores' }],
    build: buildFairyRing,
  },
]
