import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { group, mesh, rotationTrack, spinTrack } from '../../parts'
import type { Finish, Point } from '../../parts'
import type { DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema'

export { group, mesh, rotationTrack, spinTrack }
export type { Finish, Point }

export interface TerrainStructureSpec {
  readonly id: string
  readonly riggedParts: readonly RiggedPartSpec[]
  readonly detachableParts: readonly DetachablePartSpec[]
  readonly build: (root: T.Group, p: Finish, detail: boolean) => void
}

export function rot(
  name: string,
  label: string,
  axis: 'x' | 'y' | 'z',
  range: [number, number],
  describe: string,
): RiggedPartSpec {
  return { name, label, type: 'rotate', axis, range, describe }
}

export function det(name: string, label: string, describe: string): DetachablePartSpec {
  return { name, label, describe }
}

export function tone(
  p: Finish,
  name: string,
  color: string,
  roughness = 0.84,
  metalness = 0.04,
  emissive?: string,
): T.MeshStandardMaterial {
  const safeRough = Math.max(0.25, Math.min(0.98, roughness))
  const mat = p.hd
    ? new T.MeshPhysicalMaterial({
      name,
      color,
      roughness: Math.max(0.22, safeRough * 0.92),
      metalness,
      clearcoat: metalness > 0.25 ? 0.28 : 0,
      clearcoatRoughness: 0.36,
    })
    : new T.MeshStandardMaterial({
      name,
      color,
      roughness: safeRough,
      metalness,
      flatShading: true,
    })
  if (emissive) {
    mat.emissive.set(emissive)
    mat.emissiveIntensity = 0.45
  }
  return mat
}

export function waterTone(
  p: Finish,
  name: string,
  color: string,
  emissive = '#0e4754',
): T.MeshStandardMaterial {
  const mat = p.hd
    ? new T.MeshPhysicalMaterial({
      name,
      color,
      roughness: 0.24,
      metalness: 0.22,
      clearcoat: 0.32,
      clearcoatRoughness: 0.24,
    })
    : new T.MeshStandardMaterial({
      name,
      color,
      roughness: 0.26,
      metalness: 0.2,
      flatShading: true,
    })
  mat.emissive.set(emissive)
  mat.emissiveIntensity = 0.3
  return mat
}

export function glowTone(
  p: Finish,
  name: string,
  color: string,
  emissive: string,
): T.MeshStandardMaterial {
  const mat = tone(p, name, color, 0.32, 0.06, emissive)
  mat.emissiveIntensity = 0.65
  return mat
}

export function kitBox(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  size: Point,
  mat: T.Material,
  rotVal: Point = [0, 0, 0],
): T.Mesh {
  const thin = Math.min(size[0], size[1], size[2])
  const geo = p.hd && thin >= 0.02
    ? new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(0.015, thin * 0.22))
    : new T.BoxGeometry(size[0], size[1], size[2])
  const m = mesh(parent, geo, mat, at)
  m.rotation.set(rotVal[0], rotVal[1], rotVal[2])
  return m
}

export function cyl(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  top: number,
  bot: number,
  h: number,
  mat: T.Material,
  rotVal: Point = [0, 0, 0],
  seg = 10,
): T.Mesh {
  const m = mesh(parent, new T.CylinderGeometry(top, bot, h, p.hd ? Math.round(seg * 3) : seg), mat, at)
  m.rotation.set(rotVal[0], rotVal[1], rotVal[2])
  return m
}

export function cone(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  r: number,
  h: number,
  mat: T.Material,
  rotVal: Point = [0, 0, 0],
  seg = 9,
): T.Mesh {
  const m = mesh(parent, new T.ConeGeometry(r, h, p.hd ? Math.round(seg * 3) : seg), mat, at)
  m.rotation.set(rotVal[0], rotVal[1], rotVal[2])
  return m
}

export function orb(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  scale: Point,
  mat: T.Material,
  seg = 9,
): T.Mesh {
  const wSeg = p.hd ? Math.round(seg * 2.5) : seg
  const hSeg = p.hd ? Math.round(seg * 2) : Math.max(6, Math.floor(seg * 0.7))
  const m = mesh(parent, new T.SphereGeometry(1, wSeg, hSeg), mat, at)
  m.scale.set(scale[0], scale[1], scale[2])
  return m
}

export function torus(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  r: number,
  tubeR: number,
  mat: T.Material,
  rotVal: Point = [0, 0, 0],
  radSeg = 7,
  tubSeg = 14,
): T.Mesh {
  const geo = new T.TorusGeometry(
    r,
    tubeR,
    p.hd ? Math.round(radSeg * 2.5) : radSeg,
    p.hd ? Math.round(tubSeg * 2.5) : tubSeg,
  )
  const m = mesh(parent, geo, mat, at)
  m.rotation.set(rotVal[0], rotVal[1], rotVal[2])
  return m
}

export function lathe(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  pts: readonly (readonly [number, number])[],
  mat: T.Material,
  seg = 12,
): T.Mesh {
  const geo = new T.LatheGeometry(
    pts.map(([x, y]) => new T.Vector2(x, y)),
    p.hd ? Math.round(seg * 3) : seg,
  )
  geo.normalizeNormals()
  return mesh(parent, geo, mat, at)
}

export function arc(
  parent: T.Object3D,
  p: Finish,
  path: readonly (readonly [number, number, number])[],
  r: number,
  mat: T.Material,
  seg = 10,
  rad = 6,
): T.Mesh {
  const curve = new T.CatmullRomCurve3(path.map(pt => new T.Vector3(pt[0], pt[1], pt[2])))
  const geo = new T.TubeGeometry(
    curve,
    p.hd ? Math.round(seg * 2.5) : seg,
    r,
    p.hd ? Math.round(rad * 2.5) : rad,
    false,
  )
  return mesh(parent, geo, mat, [0, 0, 0])
}

export function strut(
  parent: T.Object3D,
  p: Finish,
  a: Point,
  b: Point,
  r: number,
  mat: T.Material,
  seg = 8,
): T.Mesh {
  const start = new T.Vector3(a[0], a[1], a[2])
  const end = new T.Vector3(b[0], b[1], b[2])
  const dir = end.clone().sub(start)
  const len = Math.max(0.005, dir.length())
  const m = cyl(parent, p, [0, 0, 0], r, r, len, mat, [0, 0, 0], seg)
  m.position.copy(start.add(end).multiplyScalar(0.5))
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize())
  return m
}

export function mound(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  rx: number,
  ry: number,
  rz: number,
  mat: T.Material,
  seg = 12,
): T.Mesh {
  const m = lathe(
    parent,
    p,
    at,
    [[0.005, 0], [1, 0], [0.97, 0.36], [0.88, 0.78], [0.68, 0.98], [0.005, 1]],
    mat,
    seg,
  )
  m.scale.set(rx, ry, rz)
  return m
}

export function rock(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  scale: Point,
  mat: T.Material,
  seed = 1,
): T.Mesh {
  const geo = new T.IcosahedronGeometry(1, p.hd ? 2 : 0)
  const pos = geo.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const warp = 1 + 0.16 * Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 - seed) + 0.08 * Math.sin(y * 4.3 + seed * 2)
    pos.setXYZ(i, x * warp, Math.max(-0.52, y * warp), z * warp)
  }
  geo.computeVertexNormals()
  const m = mesh(parent, geo, mat, [at[0], at[1] + 0.52 * scale[1], at[2]])
  m.scale.set(scale[0], scale[1], scale[2])
  return m
}

export function gable(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  w: number,
  h: number,
  d: number,
  mat: T.Material,
  rotY = 0,
): T.Mesh {
  const shape = new T.Shape()
  shape.moveTo(-w * 0.5, 0).lineTo(w * 0.5, 0).lineTo(0, h).closePath()
  const bev = p.hd ? Math.min(0.012, d * 0.16) : 0
  const bodyD = Math.max(0.015, d - bev * 2)
  const geo = new T.ExtrudeGeometry(shape, {
    depth: bodyD,
    bevelEnabled: p.hd,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 2,
  })
  geo.translate(0, 0, -bodyD * 0.5)
  const m = mesh(parent, geo, mat, at)
  m.rotation.y = rotY
  return m
}

export function archRing(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  innerR: number,
  outerR: number,
  depth: number,
  mat: T.Material,
  startA = 0,
  endA = Math.PI,
  rotY = 0,
): T.Mesh {
  const shape = new T.Shape()
  shape.absarc(0, 0, outerR, startA, endA, false)
  shape.absarc(0, 0, innerR, endA, startA, true)
  shape.closePath()
  const bev = p.hd ? Math.min(0.012, depth * 0.14) : 0
  const bodyD = Math.max(0.015, depth - bev * 2)
  const geo = new T.ExtrudeGeometry(shape, {
    depth: bodyD,
    curveSegments: p.hd ? 28 : 10,
    bevelEnabled: p.hd,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 2,
  })
  geo.translate(0, 0, -bodyD * 0.5)
  const m = mesh(parent, geo, mat, at)
  m.rotation.y = rotY
  return m
}

export function terraceArc(
  parent: T.Object3D,
  p: Finish,
  at: Point,
  innerR: number,
  outerR: number,
  height: number,
  startA: number,
  endA: number,
  mat: T.Material,
): T.Mesh {
  const shape = new T.Shape()
  shape.absarc(0, 0, outerR, startA, endA, false)
  if (innerR > 0.01) shape.absarc(0, 0, innerR, endA, startA, true)
  else shape.lineTo(0, 0)
  shape.closePath()
  const bev = p.hd ? Math.min(0.01, height * 0.14) : 0
  const bodyH = Math.max(0.015, height - bev * 2)
  const geo = new T.ExtrudeGeometry(shape, {
    depth: bodyH,
    curveSegments: p.hd ? 28 : 10,
    bevelEnabled: p.hd,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 2,
  })
  geo.translate(0, 0, bev)
  geo.rotateX(-Math.PI / 2)
  return mesh(parent, geo, mat, at)
}

export function sway(
  node: string,
  axis: 'x' | 'y' | 'z',
  duration: number,
  loRad: number,
  hiRad: number,
): T.QuaternionKeyframeTrack {
  return rotationTrack(node, axis, [0, duration * 0.25, duration * 0.75, duration], [0, hiRad, loRad, 0])
}

export function swingTrack(
  node: string,
  axis: 'x' | 'y' | 'z',
  duration: number,
  peakDeg: number,
  symmetric = false,
): T.QuaternionKeyframeTrack {
  const peak = (peakDeg * Math.PI) / 180
  return symmetric
    ? rotationTrack(node, axis, [0, duration * 0.25, duration * 0.75, duration], [0, peak, -peak, 0])
    : rotationTrack(node, axis, [0, duration * 0.36, duration * 0.64, duration], [0, peak, peak, 0])
}

export function slideTrack(
  node: string,
  axis: 'x' | 'y' | 'z',
  rest: Point,
  duration: number,
  delta: number,
): T.VectorKeyframeTrack {
  const moved: Point = [rest[0], rest[1], rest[2]]
  moved[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] += delta
  return new T.VectorKeyframeTrack(
    node + '.position',
    [0, duration * 0.36, duration * 0.64, duration],
    [...rest, ...moved, ...moved, ...rest],
  )
}
