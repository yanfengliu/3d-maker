import * as T from 'three'
import { box, group, mesh, motion, ring, rotationTrack, shell, spinTrack, tube } from '../parts'
import type { Finish, Point } from '../parts'
import type { Axis, DetachablePartSpec, RiggedPartSpec } from '../../capabilities/schema'
import type { BrowseCategory } from '../../data/browse'

export interface AnimalAssetDef {
  readonly id: string
  readonly code: string
  readonly category: 'Object'
  readonly browseCategory: BrowseCategory
  readonly name: string
  readonly primary: string
  readonly accent: string
  readonly description: string
  readonly physicsBody: 'dynamic'
  readonly riggedParts: readonly RiggedPartSpec[]
  readonly detachableParts: readonly DetachablePartSpec[]
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void
}

function tone(p: Finish, name: string, color: string, roughness = 0.72, metalness = 0.06, emissive?: string) {
  const mat = p.hd
    ? new T.MeshPhysicalMaterial({ name, color, roughness: roughness * 0.85, metalness, clearcoat: metalness > 0.25 ? 0.3 : 0.08, clearcoatRoughness: 0.35 })
    : new T.MeshStandardMaterial({ name, color, roughness, metalness, flatShading: true })
  if (emissive) { mat.emissive.set(emissive); mat.emissiveIntensity = 0.42 }
  return mat
}

function orb(parent: T.Object3D, p: Finish, at: Point, scale: Point, mat: T.Material, seg = 10) {
  const m = mesh(parent, new T.SphereGeometry(1, p.hd ? seg * 2 : seg, p.hd ? seg + 4 : Math.max(6, Math.floor(seg * 0.7))), mat, at)
  m.scale.set(...scale)
  return m
}

function cap(parent: T.Object3D, p: Finish, at: Point, r: number, len: number, mat: T.Material, rot: Point = [0, 0, 0], seg = 8) {
  const m = mesh(parent, new T.CapsuleGeometry(r, len, p.hd ? 8 : 3, p.hd ? seg * 2 : seg), mat, at)
  m.rotation.set(...rot)
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

function lathe(parent: T.Object3D, p: Finish, at: Point, pts: readonly [number, number][], mat: T.Material, rot: Point = [0, 0, 0], seg = 10) {
  const geo = new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), p.hd ? seg * 3 : seg)
  geo.normalizeNormals()
  const m = mesh(parent, geo, mat, at)
  m.rotation.set(...rot)
  return m
}

function arc(parent: T.Object3D, p: Finish, path: readonly Point[], r: number, mat: T.Material, seg = 12, rad = 6) {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(...pt)))
  return mesh(parent, new T.TubeGeometry(curve, p.hd ? seg * 2 : seg, r, p.hd ? rad * 2 : rad, false), mat, [0, 0, 0])
}

function eye(parent: T.Object3D, p: Finish, at: Point, r: number, detail: boolean, dir: Point = [0.25, 0.35, 0.85]) {
  orb(parent, p, at, [r, r, r], p.inset, 8)
  if (detail) orb(parent, p, [at[0] + dir[0] * r, at[1] + dir[1] * r, at[2] + dir[2] * r], [r * 0.34, r * 0.34, r * 0.34], p.stencil, 6)
}

const sway = (node: string, axis: Axis, dur: number, lo: number, hi: number) =>
  rotationTrack(node, axis, [0, dur * 0.25, dur * 0.75, dur], [0, hi, lo, 0])

const rot = (name: string, label: string, axis: Axis, range: [number, number], describe: string): RiggedPartSpec =>
  ({ name, label, type: 'rotate', axis, range, describe })

const slide = (name: string, label: string, axis: Axis, range: [number, number], describe: string): RiggedPartSpec =>
  ({ name, label, type: 'slide', axis, range, describe })

const det = (name: string, label: string, describe: string): DetachablePartSpec => ({ name, label, describe })

function buildFox(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'FoxBody')
  orb(body, p, [0, 0.62, 0.04], [0.26, 0.23, 0.52], p.primary)
  orb(body, p, [0, 0.65, 0.34], [0.24, 0.24, 0.24], p.accent)
  orb(body, p, [0, 0.56, -0.34], [0.23, 0.21, 0.24], p.primary)
  for (const s of [-1, 1]) {
    for (const [z, topY] of [[0.32, 0.45], [-0.34, 0.44]] as const) {
      cyl(body, p, [s * 0.16, topY * 0.68, z], 0.068, 0.056, topY * 0.64, p.primary)
      cyl(body, p, [s * 0.16, 0.14, z], 0.056, 0.048, 0.24, p.tire)
      orb(body, p, [s * 0.16, 0.045, z + 0.04], [0.068, 0.045, 0.092], p.tire, 8)
    }
  }
  const head = group(body, 'FoxHead', [0, 0.85, 0.46])
  orb(head, p, [0, 0.04, 0.06], [0.23, 0.19, 0.22], p.primary)
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.21, -0.02, 0.05], [0.13, 0.1, 0.11], p.accent, 8)
    cone(head, p, [s * 0.15, 0.25, -0.02], 0.095, 0.25, p.primary, [0.08, 0, -s * 0.22])
    cone(head, p, [s * 0.165, 0.34, -0.02], 0.048, 0.09, p.tire, [0.08, 0, -s * 0.22], 7)
    eye(head, p, [s * 0.125, 0.08, 0.2], 0.036, detail)
    if (detail) {
      cone(head, p, [s * 0.145, 0.23, 0.02], 0.055, 0.16, p.accent, [0.1, 0, -s * 0.22], 7)
      box(head, [s * 0.16, -0.04, 0.27], [0.12, 0.01, 0.01], p.stencil).rotation.y = s * 0.2
    }
  }
  cone(head, p, [0, -0.02, 0.3], 0.11, 0.26, p.primary, [Math.PI * 0.52, 0, 0])
  orb(head, p, [0, -0.065, 0.24], [0.09, 0.055, 0.14], p.accent, 8)
  orb(head, p, [0, -0.02, 0.43], [0.042, 0.035, 0.038], p.inset, 8)
  const tail = group(body, 'FoxTail', [0, 0.56, -0.48])
  arc(tail, p, [[0, 0, 0], [0.08, -0.04, -0.28], [0.18, 0.02, -0.58], [0.14, 0.1, -0.78]], 0.14, p.primary)
  orb(tail, p, [0.12, 0.04, -0.46], [0.18, 0.16, 0.28], p.primary)
  cone(tail, p, [0.12, 0.13, -0.84], 0.15, 0.3, p.accent, [-Math.PI * 0.42, 0.14, 0])
  if (detail) for (let i = 0; i < 4; i++) orb(body, p, [0, 0.85 - i * 0.03, 0.12 - i * 0.16], [0.08, 0.06, 0.12], p.primary, 7)
  root.animations = [
    new T.AnimationClip('Alert wag', 3.2, [sway('FoxTail', 'y', 3.2, -0.52, 0.52), sway('FoxHead', 'y', 3.2, -0.42, 0.42)]),
    new T.AnimationClip('Head scan', 3.6, [sway('FoxHead', 'y', 3.6, -0.55, 0.55)]),
  ]
}

function buildOwl(root: T.Group, p: Finish, detail: boolean) {
  const talon = tone(p, 'Talon', '#5e4b3a', 0.65)
  const body = group(root, 'OwlBody')
  lathe(body, p, [0, 0.18, 0], [[0.01, 0], [0.22, 0.08], [0.34, 0.35], [0.32, 0.72], [0.24, 0.94], [0.01, 1.0]], p.primary)
  orb(body, p, [0, 0.62, 0.14], [0.26, 0.36, 0.22], p.accent)
  cone(body, p, [0, 0.26, -0.32], 0.16, 0.42, p.primary, [-2.15, 0, 0])
  for (const s of [-1, 1]) {
    cyl(body, p, [s * 0.14, 0.14, 0.04], 0.06, 0.045, 0.22, p.accent)
    for (const a of [-0.45, 0, 0.45]) cap(body, p, [s * 0.14 + Math.sin(a) * 0.06, 0.026, 0.1 + Math.cos(a) * 0.07], 0.025, 0.09, talon, [Math.PI / 2, a, 0], 6)
    const wing = group(body, s > 0 ? 'WingL' : 'WingR', [s * 0.29, 0.94, 0])
    orb(wing, p, [s * 0.18, -0.14, -0.02], [0.22, 0.14, 0.2], p.primary)
    orb(wing, p, [s * 0.36, -0.32, -0.08], [0.22, 0.08, 0.18], p.primary).rotation.z = -s * 0.55
    cone(wing, p, [s * 0.48, -0.46, -0.14], 0.12, 0.32, p.accent, [0.2, 0, s * 2.45])
    if (detail) for (let i = 0; i < 4; i++) orb(wing, p, [s * (0.2 + i * 0.08), -0.22 - i * 0.08, -0.06 - i * 0.02], [0.09, 0.03, 0.12], i % 2 ? p.accent : p.primary, 6)
  }
  const head = group(body, 'OwlHead', [0, 1.15, 0.04])
  orb(head, p, [0, 0.14, 0], [0.27, 0.23, 0.24], p.primary)
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.1, 0.15, 0.15], [0.14, 0.15, 0.11], p.accent, 9)
    eye(head, p, [s * 0.105, 0.16, 0.25], 0.042, detail)
    if (detail) cone(head, p, [s * 0.19, 0.32, 0.02], 0.055, 0.12, p.primary, [0, 0, -s * 0.35], 6)
  }
  orb(head, p, [0, 0.05, 0.17], [0.14, 0.11, 0.1], p.accent, 8)
  cone(head, p, [0, 0.09, 0.28], 0.045, 0.12, talon, [Math.PI * 0.65, 0, 0])
  if (detail) for (let i = 0; i < 6; i++) orb(body, p, [i % 2 ? 0.09 : -0.09, 0.45 + i * 0.07, 0.35], [0.03, 0.02, 0.018], p.primary, 6)
  root.animations = [
    new T.AnimationClip('Wing beat', 2.8, [
      rotationTrack('WingL', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, 0.85, 0.05, 0.78, 0]),
      rotationTrack('WingR', 'z', [0, 0.7, 1.4, 2.1, 2.8], [0, -0.85, -0.05, -0.78, 0]),
      sway('OwlHead', 'y', 2.8, -0.35, 0.35),
    ]),
    new T.AnimationClip('Night watch', 4.0, [sway('OwlHead', 'y', 4.0, -1.05, 1.05)]),
  ]
}

function buildTurtle(root: T.Group, p: Finish, detail: boolean) {
  const skin = tone(p, 'Turtle skin', '#4c7c66', 0.68)
  const body = group(root, 'TurtleBody')
  lathe(body, p, [0, 0.16, -0.04], [[0.01, 0], [0.46, 0.02], [0.56, 0.14], [0.48, 0.36], [0.28, 0.54], [0.01, 0.6]], p.primary)
  lathe(body, p, [0, 0, -0.04], [[0.01, 0], [0.44, 0], [0.5, 0.16], [0.01, 0.16]], p.accent)
  for (const [z, sc] of [[-0.26, 0.18], [0, 0.22], [0.24, 0.18]] as const) cyl(body, p, [0, 0.65, z - 0.04], sc * 0.82, sc, 0.12, p.accent, [0, 0, 0], 6)
  for (const s of [-1, 1]) {
    const flipper = group(body, s > 0 ? 'FlipperL' : 'FlipperR', [s * 0.44, 0.22, 0.22])
    orb(flipper, p, [s * 0.26, -0.03, -0.06], [0.34, 0.055, 0.16], skin).rotation.y = s * 0.42
    cone(flipper, p, [s * 0.55, -0.05, -0.22], 0.12, 0.32, p.primary, [-0.15, s * 0.5, -s * Math.PI * 0.52])
    orb(body, p, [s * 0.34, 0.1, -0.52], [0.18, 0.04, 0.14], skin, 8).rotation.y = -s * 0.45
    if (detail) {
      for (let i = 0; i < 3; i++) orb(flipper, p, [s * (0.18 + i * 0.14), 0.02, 0.03 - i * 0.08], [0.055, 0.022, 0.045], p.accent, 6)
      cyl(body, p, [s * 0.3, 0.5, -0.04], 0.13, 0.16, 0.09, p.accent, [0, 0, -s * 0.45], 6)
    }
  }
  cone(body, p, [0, 0.14, -0.68], 0.06, 0.2, skin, [-Math.PI * 0.52, 0, 0])
  const head = group(body, 'TurtleHead', [0, 0.32, 0.52])
  cap(head, p, [0, 0.04, 0.1], 0.11, 0.18, skin, [Math.PI * 0.42, 0, 0])
  orb(head, p, [0, 0.12, 0.24], [0.16, 0.14, 0.2], skin)
  orb(head, p, [0, 0.08, 0.34], [0.11, 0.085, 0.1], p.accent, 8)
  for (const s of [-1, 1]) eye(head, p, [s * 0.13, 0.17, 0.3], 0.035, detail)
  root.animations = [
    new T.AnimationClip('Ocean glide', 3.2, [
      sway('FlipperL', 'z', 3.2, -0.38, 0.55), sway('FlipperR', 'z', 3.2, -0.55, 0.38), sway('TurtleHead', 'y', 3.2, -0.35, 0.35),
    ]),
  ]
}

function buildRedPanda(root: T.Group, p: Finish, detail: boolean) {
  const belly = tone(p, 'Panda dark fur', '#2b2220', 0.85)
  const body = group(root, 'PandaBody')
  orb(body, p, [0, 0.52, 0], [0.3, 0.25, 0.48], p.primary)
  orb(body, p, [0, 0.38, 0], [0.24, 0.16, 0.4], belly)
  for (const s of [-1, 1]) {
    for (const z of [0.28, -0.28]) {
      cap(body, p, [s * 0.19, 0.2, z], 0.092, 0.18, belly)
      orb(body, p, [s * 0.19, 0.055, z + 0.05], [0.095, 0.055, 0.115], p.tire, 8)
    }
  }
  const head = group(body, 'PandaHead', [0, 0.68, 0.44])
  orb(head, p, [0, 0.06, 0.06], [0.26, 0.22, 0.23], p.primary)
  orb(head, p, [0, -0.02, 0.22], [0.13, 0.095, 0.12], p.accent)
  orb(head, p, [0, 0.01, 0.33], [0.042, 0.034, 0.035], p.inset, 8)
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.18, -0.02, 0.12], [0.12, 0.09, 0.1], p.accent, 8)
    orb(head, p, [s * 0.19, 0.24, -0.02], [0.1, 0.11, 0.05], p.accent, 8)
    orb(head, p, [s * 0.19, 0.24, -0.04], [0.075, 0.085, 0.045], p.primary, 8)
    eye(head, p, [s * 0.11, 0.08, 0.24], 0.036, detail)
    if (detail) {
      orb(head, p, [s * 0.09, 0.16, 0.24], [0.042, 0.028, 0.025], p.accent, 6)
      orb(head, p, [s * 0.11, 0.02, 0.25], [0.032, 0.045, 0.024], belly, 6)
    }
  }
  const tail = group(body, 'RingTail', [0, 0.48, -0.45])
  for (let i = 0; i < 7; i++) {
    const t = i / 6, rad = 0.155 - t * 0.035
    orb(tail, p, [Math.sin(t * 1.4) * 0.08, -0.04 + Math.sin(t * Math.PI) * 0.06, -0.08 - i * 0.14], [rad, rad * 0.92, 0.11], i % 2 === 0 ? p.primary : p.accent, 9)
  }
  orb(tail, p, [0.08, -0.03, -1.04], [0.1, 0.09, 0.11], belly, 8)
  if (detail) for (const s of [-1, 1]) orb(body, p, [s * 0.19, 0.025, 0.37], [0.055, 0.025, 0.035], p.accent, 6)
  root.animations = [new T.AnimationClip('Tail sway', 3.0, [sway('RingTail', 'y', 3.0, -0.48, 0.48), sway('PandaHead', 'x', 3.0, -0.3, 0.3)])]
}

function buildCrab(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'CrabChassis')
  shell(body, [0, 0.48, 0], [1.05, 0.34, 0.86], p.primary, 0.45)
  shell(body, [0, 0.66, -0.02], [0.84, 0.16, 0.68], p.primary, 0.5)
  shell(body, [0, 0.3, 0], [0.82, 0.16, 0.66], p.dark, 0.42)
  for (const s of [-1, 1]) {
    cyl(body, p, [s * 0.22, 0.72, 0.34], 0.036, 0.044, 0.2, p.accent)
    orb(body, p, [s * 0.22, 0.84, 0.36], [0.068, 0.068, 0.068], p.optic, 9)
    for (const [i, z] of [-0.26, -0.02, 0.22].entries()) {
      const knee: Point = [s * (0.68 + (i === 1 ? 0.06 : 0)), 0.38, z]
      const foot: Point = [s * (0.86 + (i === 1 ? 0.05 : 0)), 0.03, z * 1.15]
      arc(body, p, [[s * 0.45, 0.36, z], knee, foot], 0.045, p.edge, 8, 6)
      orb(body, p, knee, [0.065, 0.065, 0.065], p.accent, 7)
      orb(body, p, foot, [0.05, 0.03, 0.05], p.dark, 6)
    }
    const claw = group(body, s > 0 ? 'ClawL' : 'ClawR', [s * 0.42, 0.44, 0.36])
    arc(claw, p, [[0, 0, 0], [s * 0.2, 0.02, 0.22], [s * 0.16, 0.05, 0.42]], 0.068, p.edge, 8, 6)
    orb(claw, p, [s * 0.14, 0.08, 0.52], [0.16, 0.14, 0.22], p.primary)
    cone(claw, p, [s * 0.2, 0.09, 0.76], 0.085, 0.26, p.primary, [Math.PI * 0.48, -s * 0.28, 0])
    cone(claw, p, [s * 0.05, 0.06, 0.72], 0.062, 0.22, p.accent, [Math.PI * 0.5, s * 0.32, 0])
    if (detail) {
      tube(body, [s * 0.3, 0.75, -0.02], 0.075, 0.075, 0.04, p.accent, 12)
      ring(body, [s * 0.48, 0.48, -0.04], 0.12, 0.03, 0.05, p.accent).rotation.z = Math.PI / 2
    }
  }
  const backKey = group(body, 'BackKey', [0, 0.74, -0.14])
  tube(backKey, [0, 0.12, 0], 0.045, 0.055, 0.24, p.accent, 10)
  for (const s of [-1, 1]) ring(backKey, [s * 0.14, 0.28, 0], 0.12, 0.035, 0.045, p.accent).rotation.x = Math.PI / 2
  if (detail) for (const x of [-0.26, 0, 0.26]) box(body, [x, 0.75, 0.18], [0.06, 0.035, 0.16], p.accent)
  root.animations = [
    new T.AnimationClip('Pincer snap', 2.6, [sway('ClawL', 'y', 2.6, -0.46, 0.36), sway('ClawR', 'y', 2.6, -0.36, 0.46)]),
    new T.AnimationClip('Wind-up tick', 3.0, [spinTrack('BackKey', 'y', 3.0, 1), sway('ClawL', 'y', 3.0, -0.25, 0.2)]),
  ]
}

function buildKoi(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'KoiBody', [0, 0.04, 0])
  const profile: [number, number][] = [[0.01, -0.68], [0.07, -0.52], [0.16, -0.25], [0.24, 0.12], [0.23, 0.42], [0.15, 0.68], [0.01, 0.82]]
  lathe(body, p, [0, 0.44, 0.04], profile, p.accent, [Math.PI / 2, 0, 0]).scale.set(0.82, 1, 1.15)
  orb(body, p, [0, 0.56, 0.3], [0.18, 0.15, 0.26], p.primary)
  orb(body, p, [0.03, 0.52, -0.18], [0.16, 0.14, 0.22], p.primary)
  orb(body, p, [0, 0.54, 0.62], [0.12, 0.1, 0.12], p.primary, 8)
  cone(body, p, [0, 0.76, 0.04], 0.11, 0.34, p.primary, [-0.55, 0, 0]).scale.set(0.28, 1, 1.45)
  for (const s of [-1, 1]) {
    cone(body, p, [s * 0.1, 0.13, 0.02], 0.12, 0.26, p.accent, [-0.25, 0, s * 0.28]).scale.set(0.32, 1, 1.1)
    const pec = group(body, s > 0 ? 'PectoralL' : 'PectoralR', [s * 0.18, 0.32, 0.34])
    orb(pec, p, [s * 0.18, -0.06, -0.06], [0.22, 0.028, 0.16], p.accent).rotation.set(0.18, s * 0.35, -s * 0.25)
    orb(pec, p, [s * 0.24, -0.08, -0.1], [0.14, 0.022, 0.1], p.primary, 7).rotation.y = s * 0.35
    eye(body, p, [s * 0.145, 0.48, 0.64], 0.038, detail, [s * 0.7, 0.3, 0.5])
    if (detail) {
      arc(body, p, [[s * 0.08, 0.38, 0.78], [s * 0.18, 0.3, 0.84], [s * 0.24, 0.24, 0.74]], 0.014, p.primary, 8, 5)
      orb(body, p, [s * 0.16, 0.44, 0.46], [0.04, 0.12, 0.05], p.inset, 6)
    }
  }
  const tail = group(body, 'TailFin', [0, 0.42, -0.62])
  cone(tail, p, [0, 0.16, -0.26], 0.16, 0.44, p.accent, [-1.05, 0, 0]).scale.set(0.24, 1, 1.15)
  cone(tail, p, [0, -0.18, -0.26], 0.16, 0.44, p.accent, [-2.08, 0, 0]).scale.set(0.24, 1, 1.15)
  orb(tail, p, [0, 0, -0.16], [0.05, 0.18, 0.22], p.primary, 8)
  root.animations = [
    new T.AnimationClip('Graceful swim', 2.8, [
      sway('TailFin', 'y', 2.8, -0.5, 0.5), sway('PectoralL', 'z', 2.8, -0.38, 0.38), sway('PectoralR', 'z', 2.8, 0.38, -0.38),
    ]),
  ]
}

function buildStag(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'StagBody')
  orb(body, p, [0, 1.02, 0], [0.3, 0.3, 0.64], p.primary)
  orb(body, p, [0, 1.04, 0.38], [0.27, 0.28, 0.26], p.accent)
  cap(body, p, [0, 1.32, 0.42], 0.15, 0.36, p.primary, [-0.28, 0, 0])
  cone(body, p, [0, 0.96, -0.66], 0.08, 0.22, p.accent, [-2.4, 0, 0])
  for (const s of [-1, 1]) {
    for (const z of [0.38, -0.4]) {
      cyl(body, p, [s * 0.18, 0.62, z], 0.082, 0.058, 0.52, p.primary)
      cyl(body, p, [s * 0.18, 0.22, z], 0.054, 0.044, 0.36, p.primary)
      cyl(body, p, [s * 0.18, 0.045, z + 0.01], 0.048, 0.056, 0.09, p.tire)
    }
  }
  const head = group(body, 'StagHead', [0, 1.54, 0.46])
  orb(head, p, [0, 0.06, 0.1], [0.16, 0.15, 0.2], p.primary)
  cyl(head, p, [0, -0.01, 0.3], 0.068, 0.095, 0.24, p.primary, [Math.PI * 0.54, 0, 0])
  orb(head, p, [0, -0.02, 0.43], [0.052, 0.044, 0.045], p.inset, 8)
  for (const s of [-1, 1]) {
    cone(head, p, [s * 0.19, 0.16, 0.02], 0.065, 0.2, p.primary, [0.1, 0, -s * 0.85])
    eye(head, p, [s * 0.13, 0.09, 0.2], 0.032, detail)
  }
  const antlers = group(head, 'Antlers', [0, 0.16, 0.04])
  for (const s of [-1, 1]) {
    arc(antlers, p, [[s * 0.07, 0, 0], [s * 0.22, 0.22, -0.06], [s * 0.42, 0.46, 0.02], [s * 0.54, 0.66, 0.06]], 0.032, p.accent, 10, 6)
    arc(antlers, p, [[s * 0.2, 0.18, -0.04], [s * 0.28, 0.36, 0.16]], 0.024, p.accent, 8, 5)
    arc(antlers, p, [[s * 0.36, 0.38, -0.01], [s * 0.34, 0.62, -0.1]], 0.022, p.accent, 8, 5)
    if (detail) arc(antlers, p, [[s * 0.46, 0.52, 0.04], [s * 0.58, 0.56, -0.1]], 0.018, p.accent, 6, 5)
  }
  if (detail) for (let i = 0; i < 4; i++) orb(body, p, [0, 1.24 - i * 0.08, 0.54 + i * 0.02], [0.12 - i * 0.01, 0.07, 0.09], p.accent, 7)
  root.animations = [new T.AnimationClip('Royal nod', 3.4, [sway('StagHead', 'x', 3.4, -0.32, 0.36)])]
}

function buildPenguin(root: T.Group, p: Finish, detail: boolean) {
  const feetMat = tone(p, 'Penguin foot', '#433b39', 0.78)
  const body = group(root, 'PenguinBody')
  lathe(body, p, [0, 0.08, 0], [[0.01, 0], [0.24, 0.04], [0.36, 0.28], [0.34, 0.68], [0.24, 1.02], [0.17, 1.18], [0.01, 1.2]], p.primary)
  orb(body, p, [0, 0.58, 0.16], [0.28, 0.46, 0.24], p.stencil)
  orb(body, p, [0, 1.04, 0.18], [0.22, 0.13, 0.16], p.accent)
  cone(body, p, [0, 0.16, -0.34], 0.11, 0.22, p.primary, [-2.2, 0, 0])
  for (const s of [-1, 1]) {
    orb(body, p, [s * 0.16, 0.045, 0.1], [0.11, 0.045, 0.18], feetMat, 8)
    const fl = group(body, s > 0 ? 'FlipperL' : 'FlipperR', [s * 0.33, 0.98, 0.02])
    orb(fl, p, [s * 0.1, -0.26, 0], [0.05, 0.32, 0.12], p.primary).rotation.z = s * 0.24
    if (detail) orb(fl, p, [s * 0.06, -0.26, 0.02], [0.025, 0.25, 0.08], p.stencil, 7).rotation.z = s * 0.24
  }
  const head = group(body, 'PenguinHead', [0, 1.24, 0.02])
  orb(head, p, [0, 0.14, 0], [0.21, 0.2, 0.21], p.primary)
  cone(head, p, [0, 0.11, 0.28], 0.055, 0.24, p.inset, [Math.PI * 0.55, 0, 0])
  cone(head, p, [0, 0.08, 0.26], 0.04, 0.2, p.accent, [Math.PI * 0.56, 0, 0])
  for (const s of [-1, 1]) {
    orb(head, p, [s * 0.17, 0.1, 0.04], [0.065, 0.1, 0.09], p.accent, 8)
    eye(head, p, [s * 0.12, 0.18, 0.16], 0.03, detail)
  }
  if (detail) for (const s of [-1, 1]) for (const x of [-0.05, 0, 0.05]) cone(body, p, [s * 0.16 + x, 0.03, 0.27], 0.02, 0.06, p.tire, [Math.PI / 2, 0, 0], 6)
  root.animations = [
    new T.AnimationClip('Happy flap', 2.6, [
      rotationTrack('FlipperL', 'z', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.72, 0.1, 0.68, 0]),
      rotationTrack('FlipperR', 'z', [0, 0.65, 1.3, 1.95, 2.6], [0, -0.72, -0.1, -0.68, 0]),
      sway('PenguinHead', 'y', 2.6, -0.52, 0.52),
    ]),
  ]
}

function buildJellyfish(root: T.Group, p: Finish, detail: boolean) {
  const glow = tone(p, 'Bio glow', '#76f2e5', 0.25, 0.1, '#2cc9ba')
  const core = group(root, 'JellyRoot')
  const bell = group(core, 'JellyBell', [0, 0, 0])
  lathe(bell, p, [0, 0, 0], [[0.56, 1.18], [0.58, 1.32], [0.5, 1.54], [0.34, 1.72], [0.14, 1.82], [0.01, 1.84]], p.primary, [0, 0, 0], 14)
  ring(bell, [0, 1.18, 0], 0.56, 0.06, 0.08, p.accent)
  orb(bell, p, [0, 1.4, 0], [0.28, 0.24, 0.28], p.accent, 10)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    orb(bell, p, [Math.sin(a) * 0.54, 1.14, Math.cos(a) * 0.54], [0.11, 0.075, 0.11], i % 2 ? p.primary : p.accent, 7)
    if (detail) orb(bell, p, [Math.sin(a) * 0.38, 1.62, Math.cos(a) * 0.38], [0.055, 0.032, 0.055], glow, 6)
  }
  const tendrils = group(core, 'TendrilRing', [0, 0, 0])
  cyl(tendrils, p, [0, 1.12, 0], 0.16, 0.12, 0.36, p.accent)
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.35, s = Math.sin(a), c = Math.cos(a)
    arc(tendrils, p, [[s * 0.14, 1.18, c * 0.14], [s * 0.22, 0.78, c * 0.22], [s * 0.12, 0.38, c * 0.12], [s * 0.2, 0.04, c * 0.2]], 0.052, p.primary, 12, 6)
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, s = Math.sin(a), c = Math.cos(a), s2 = Math.sin(a + 0.35), c2 = Math.cos(a + 0.35)
    arc(tendrils, p, [[s * 0.44, 1.16, c * 0.44], [s2 * 0.48, 0.72, c2 * 0.48], [s * 0.38, 0.32, c * 0.38], [s2 * 0.42, 0.025, c2 * 0.42]], 0.025, i % 2 ? p.accent : glow, 12, 5)
    if (detail) orb(tendrils, p, [s2 * 0.42, 0.035, c2 * 0.42], [0.036, 0.036, 0.036], p.primary, 6)
  }
  root.animations = [new T.AnimationClip('Pulse drift', 3.4, [motion('JellyBell', 3.4, [0, 0.28, 0.04, 0.24, 0]), spinTrack('TendrilRing', 'y', 3.4, 1)])]
}

function buildDragon(root: T.Group, p: Finish, detail: boolean) {
  const ember = tone(p, 'Dragon ember', '#f26a2e', 0.4, 0.05, '#d94816')
  const body = group(root, 'DragonBody')
  orb(body, p, [0, 0.56, 0], [0.34, 0.36, 0.42], p.primary)
  orb(body, p, [0, 0.52, 0.14], [0.25, 0.3, 0.28], p.accent)
  arc(body, p, [[0, 0.42, -0.34], [0.16, 0.26, -0.68], [0.42, 0.16, -0.78], [0.58, 0.22, -0.58]], 0.1, p.primary)
  cone(body, p, [0.64, 0.25, -0.48], 0.11, 0.24, p.accent, [1.1, 0.5, -0.6])
  for (const s of [-1, 1]) {
    orb(body, p, [s * 0.26, 0.26, -0.06], [0.16, 0.2, 0.2], p.primary, 9)
    orb(body, p, [s * 0.28, 0.065, 0.08], [0.11, 0.065, 0.16], p.primary, 8)
    cap(body, p, [s * 0.24, 0.34, 0.34], 0.07, 0.2, p.primary, [0.55, 0, s * 0.2])
    orb(body, p, [s * 0.24, 0.055, 0.42], [0.08, 0.055, 0.11], p.primary, 7)
    const wing = group(body, s > 0 ? 'DragonWingL' : 'DragonWingR', [s * 0.28, 0.78, -0.08])
    arc(wing, p, [[0, 0, 0], [s * 0.38, 0.34, -0.12], [s * 0.72, 0.18, -0.22]], 0.042, p.primary, 10, 6)
    orb(wing, p, [s * 0.38, 0.08, -0.14], [0.36, 0.22, 0.032], p.accent).rotation.set(0.15, -s * 0.28, s * 0.15)
    cone(wing, p, [s * 0.68, 0.02, -0.22], 0.14, 0.32, p.accent, [0, 0, -s * 1.4]).scale.set(1, 1, 0.22)
    if (detail) {
      arc(wing, p, [[s * 0.34, 0.32, -0.11], [s * 0.42, -0.08, -0.14]], 0.022, p.primary, 6, 5)
      for (const x of [-0.04, 0.04]) cone(body, p, [s * 0.28 + x, 0.04, 0.22], 0.022, 0.07, p.stencil, [Math.PI / 2, 0, 0], 6)
    }
  }
  cap(body, p, [0, 0.92, 0.16], 0.15, 0.28, p.primary, [-0.25, 0, 0])
  const head = group(body, 'DragonHead', [0, 1.14, 0.28])
  orb(head, p, [0, 0.06, 0.04], [0.22, 0.18, 0.24], p.primary)
  shell(head, [0, 0.04, 0.24], [0.26, 0.13, 0.28], p.primary, 0.42)
  for (const s of [-1, 1]) {
    arc(head, p, [[s * 0.12, 0.18, -0.02], [s * 0.22, 0.34, -0.16], [s * 0.26, 0.42, -0.3]], 0.036, p.accent, 8, 6)
    eye(head, p, [s * 0.16, 0.11, 0.18], 0.04, detail)
  }
  const jaw = group(head, 'DragonJaw', [0, -0.04, 0.12])
  shell(jaw, [0, -0.035, 0.12], [0.22, 0.075, 0.26], p.primary, 0.4)
  orb(jaw, p, [0, 0.005, 0.11], [0.08, 0.025, 0.11], ember, 7)
  if (detail) {
    for (const s of [-1, 1]) cone(jaw, p, [s * 0.07, 0.025, 0.2], 0.018, 0.055, p.stencil, [0, 0, 0], 6)
    for (let i = 0; i < 4; i++) cone(body, p, [0, 0.9 - i * 0.14, -0.06 - i * 0.1], 0.045, 0.11, p.accent, [-0.7, 0, 0], 6)
  }
  root.animations = [
    new T.AnimationClip('Wing flutter', 2.6, [
      rotationTrack('DragonWingL', 'z', [0, 0.65, 1.3, 1.95, 2.6], [0, 0.85, 0.12, 0.78, 0]),
      rotationTrack('DragonWingR', 'z', [0, 0.65, 1.3, 1.95, 2.6], [0, -0.85, -0.12, -0.78, 0]),
      rotationTrack('DragonJaw', 'x', [0, 0.65, 1.5, 2.6], [0, 0.52, 0.45, 0]),
    ]),
    new T.AnimationClip('Mini roar', 2.4, [rotationTrack('DragonJaw', 'x', [0, 0.6, 1.5, 2.4], [0, 0.58, 0.52, 0])]),
  ]
}

function animal(
  id: string, code: string, name: string, primary: string, accent: string, description: string,
  riggedParts: readonly RiggedPartSpec[], detachableParts: readonly DetachablePartSpec[], build: AnimalAssetDef['build'],
): AnimalAssetDef {
  return { id, code, category: 'Object', browseCategory: 'animal', name, primary, accent, description, physicsBody: 'dynamic', riggedParts, detachableParts, build }
}

export const animalsPack: readonly AnimalAssetDef[] = [
  animal('forest-fox', 'AN-01', 'Forest Fox', '#d96b27', '#f5efe2', 'An alert woodland fox with a bushy snow-tipped tail and swiveling head.',
    [rot('FoxTail', 'Fox tail', 'y', [-35, 35], 'Wags the bushy fox tail side to side'), rot('FoxHead', 'Fox head', 'y', [-35, 35], 'Turns the fox head to scan the forest')], [], buildFox),
  animal('barn-owl', 'AN-02', 'Barn Owl', '#c9a06c', '#f6f1e6', 'A perched barn owl with a heart-shaped facial disc and articulated wings.',
    [rot('WingL', 'Left wing', 'z', [0, 55], 'Raises and flaps the left wing'), rot('WingR', 'Right wing', 'z', [0, -55], 'Raises and flaps the right wing'), rot('OwlHead', 'Owl head', 'y', [-70, 70], 'Swivels the owl head wide in either direction')], [], buildOwl),
  animal('sea-turtle', 'AN-03', 'Sea Turtle', '#3f7d63', '#d8b46c', 'A domed reef sea turtle with patterned carapace scutes and sweeping flippers.',
    [rot('FlipperL', 'Left flipper', 'z', [-25, 35], 'Sweeps the left front flipper'), rot('FlipperR', 'Right flipper', 'z', [-35, 25], 'Sweeps the right front flipper'), rot('TurtleHead', 'Turtle head', 'y', [-25, 25], 'Turns the sea turtle head left and right')], [], buildTurtle),
  animal('red-panda', 'AN-04', 'Red Panda', '#c24d27', '#f5ead6', 'A fluffy mountain red panda with a bold ringed tail and masked face.',
    [rot('RingTail', 'Ringed tail', 'y', [-30, 30], 'Sways the plush ringed tail side to side'), rot('PandaHead', 'Panda head', 'x', [-20, 20], 'Nods the red panda head up and down')], [], buildRedPanda),
  animal('clockwork-crab', 'AN-05', 'Clockwork Crab', '#c85a32', '#e0b857', 'A brass-geared automaton crab with snapping pincers and a wind-up back key.',
    [rot('ClawL', 'Left claw', 'y', [-30, 25], 'Swings and snaps the left pincer'), rot('ClawR', 'Right claw', 'y', [-25, 30], 'Swings and snaps the right pincer')],
    [det('BackKey', 'Back wind-up key', 'Removable brass wind-up key mounted on the carapace')], buildCrab),
  animal('koi-fish', 'AN-06', 'Koi Fish', '#e85d2a', '#f7f3ea', 'A calico pond koi with sweeping ribbon fins and fluttering pectorals.',
    [rot('TailFin', 'Tail fin', 'y', [-32, 32], 'Sweeps the forked tail fin side to side'), rot('PectoralL', 'Left pectoral fin', 'z', [-25, 25], 'Flutters the left pectoral fin'), rot('PectoralR', 'Right pectoral fin', 'z', [-25, 25], 'Flutters the right pectoral fin')], [], buildKoi),
  animal('mountain-stag', 'AN-07', 'Mountain Stag', '#8c6142', '#dfd3bc', 'A highland stag with a proud nodding head and a removable antler crown.',
    [rot('StagHead', 'Stag head', 'x', [-22, 22], 'Nods the stag head in a stately bow')],
    [det('Antlers', 'Antler rack', 'Removable branching crown of stag antlers')], buildStag),
  animal('emperor-penguin', 'AN-08', 'Emperor Penguin', '#263447', '#f0a738', 'An upright Antarctic emperor penguin with golden ear patches and flapping flippers.',
    [rot('FlipperL', 'Left flipper', 'z', [0, 45], 'Flaps the left penguin flipper upward'), rot('FlipperR', 'Right flipper', 'z', [0, -45], 'Flaps the right penguin flipper upward'), rot('PenguinHead', 'Penguin head', 'y', [-35, 35], 'Turns the penguin head left and right')], [], buildPenguin),
  animal('coral-jellyfish', 'AN-09', 'Coral Jellyfish', '#eb6c85', '#5ce0d2', 'A glowing reef jellyfish with a pulsing dome bell and swirling tentacle crown.',
    [slide('JellyBell', 'Jellyfish bell', 'y', [0, 0.3], 'Pulses the jellyfish dome upward and downward'), rot('TendrilRing', 'Tendril ring', 'y', [0, 360], 'Spins the trailing ring of oral arms and tendrils')], [], buildJellyfish),
  animal('pocket-dragon', 'AN-10', 'Pocket Dragon', '#3c8c64', '#e6b13c', 'A tabletop companion dragon with golden wings, swept horns, and a hinged roaring jaw.',
    [rot('DragonWingL', 'Left dragon wing', 'z', [0, 55], 'Flaps the left dragon wing upward'), rot('DragonWingR', 'Right dragon wing', 'z', [0, -55], 'Flaps the right dragon wing upward'), rot('DragonJaw', 'Dragon jaw', 'x', [0, 35], 'Opens the hinged lower jaw in a mini roar')], [], buildDragon),
]
