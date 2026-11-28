import * as T from 'three'
import { readCapabilities } from '../capabilities/schema'

export interface RiggedSolidOverlap {
  meshA: string
  meshB: string
  rigPart: string
  overlapVolume: number
  containment: number
  jaccard: number
}

type TypedMesh = T.Mesh<T.BufferGeometry, T.Material | T.Material[]>

interface SolidMeshRecord {
  label: string
  geo: T.BufferGeometry
  box: T.Box3
  vol: number
  invMatrix: T.Matrix4
  rigOwner: string | null
}

const SAMPLE_GRID = 4
const MIN_CHECK_VOLUME = 0.035
const RAY_DIR = new T.Vector3(0.713, 0.517, 0.473)

function isVisibleInTree(obj: T.Object3D): boolean {
  let cur: T.Object3D | null = obj
  while (cur) {
    if (!cur.visible) return false
    cur = cur.parent
  }
  return true
}

function isOpaqueMaterial(material: unknown): boolean {
  const mats: unknown[] = Array.isArray(material) ? material : [material]
  return mats.length > 0 && mats.every(
    mat => mat instanceof T.Material && !mat.transparent && mat.opacity >= 0.99,
  )
}

function signedMeshVolume(geo: T.BufferGeometry, matrixWorld: T.Matrix4): number {
  const pos = geo.getAttribute('position') as T.BufferAttribute | undefined
  if (!pos || pos.count < 3) return 0
  const idx = geo.index
  const tris = Math.floor((idx ? idx.count : pos.count) / 3)
  const a = new T.Vector3()
  const b = new T.Vector3()
  const c = new T.Vector3()
  const cross = new T.Vector3()
  let volume6 = 0
  for (let t = 0; t < tris; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
    a.fromBufferAttribute(pos, i0).applyMatrix4(matrixWorld)
    b.fromBufferAttribute(pos, i1).applyMatrix4(matrixWorld)
    c.fromBufferAttribute(pos, i2).applyMatrix4(matrixWorld)
    cross.crossVectors(b, c)
    volume6 += a.dot(cross)
  }
  return Math.abs(volume6) / 6
}

function pointInsideLocalMesh(
  worldPt: T.Vector3,
  invMatrix: T.Matrix4,
  geo: T.BufferGeometry,
): boolean {
  const lp = worldPt.clone().applyMatrix4(invMatrix)
  const pos = geo.getAttribute('position') as T.BufferAttribute | undefined
  if (!pos || pos.count < 3) return false
  const idx = geo.index
  const tris = Math.floor((idx ? idx.count : pos.count) / 3)
  let hits = 0
  const a = new T.Vector3()
  const b = new T.Vector3()
  const c = new T.Vector3()
  const e1 = new T.Vector3()
  const e2 = new T.Vector3()
  const h = new T.Vector3()
  const s = new T.Vector3()
  const q = new T.Vector3()
  for (let t = 0; t < tris; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
    a.fromBufferAttribute(pos, i0)
    b.fromBufferAttribute(pos, i1)
    c.fromBufferAttribute(pos, i2)
    e1.subVectors(b, a)
    e2.subVectors(c, a)
    h.crossVectors(RAY_DIR, e2)
    const det = e1.dot(h)
    if (Math.abs(det) < 1e-8) continue
    const f = 1 / det
    s.subVectors(lp, a)
    const u = f * s.dot(h)
    if (u < 0 || u > 1) continue
    q.crossVectors(s, e1)
    const v = f * RAY_DIR.dot(q)
    if (v < 0 || u + v > 1) continue
    if (f * e2.dot(q) > 1e-5) hits++
  }
  return hits % 2 === 1
}

function resolveRotatingParts(
  root: T.Object3D,
  override?: ReadonlySet<string>,
): ReadonlySet<string> {
  if (override) return override
  const caps = readCapabilities(root)
  const names = new Set<string>()
  for (const part of caps?.riggedParts ?? []) {
    if (part.type === 'rotate') names.add(part.name)
  }
  return names
}

/**
 * Detects rotating rigged parts whose solid volume deeply interpenetrates a stationary
 * body (or another rotating body) at rest — catching duplicate co-located solids such as
 * two full spheres or full cylinders occupying the same 3D space.
 */
export function findRotatingRigSolidOverlaps(
  root: T.Object3D,
  rotatingPartNames?: ReadonlySet<string>,
): RiggedSolidOverlap[] {
  const rotating = resolveRotatingParts(root, rotatingPartNames)
  if (rotating.size === 0) return []

  const solids: SolidMeshRecord[] = []
  let index = 0
  root.traverse(obj => {
    if (!(obj instanceof T.Mesh) || obj instanceof T.SkinnedMesh || !isVisibleInTree(obj)) return
    const mesh = obj as TypedMesh
    if (!isOpaqueMaterial(mesh.material)) return
    const geo = mesh.geometry
    const vol = signedMeshVolume(geo, mesh.matrixWorld)
    if (vol < MIN_CHECK_VOLUME) return
    let rigOwner: string | null = null
    let cur: T.Object3D | null = obj
    while (cur) {
      if (cur.name && rotating.has(cur.name)) {
        rigOwner = cur.name
        break
      }
      cur = cur.parent
    }
    const box = new T.Box3().setFromObject(obj)
    if (box.isEmpty()) return
    const parentName = obj.parent?.name ? `${obj.parent.name}/` : ''
    const label = `${parentName}${obj.name || `Mesh#${String(index)}`}`
    index++
    solids.push({
      label,
      geo,
      box,
      vol,
      invMatrix: obj.matrixWorld.clone().invert(),
      rigOwner,
    })
  })

  const overlaps: RiggedSolidOverlap[] = []
  const samplePt = new T.Vector3()
  const samples = SAMPLE_GRID * SAMPLE_GRID * SAMPLE_GRID

  for (let i = 0; i < solids.length; i++) {
    const a = solids[i]
    if (!a) continue
    for (let j = i + 1; j < solids.length; j++) {
      const b = solids[j]
      if (!b || a.rigOwner === b.rigOwner) continue
      const rigPart = a.rigOwner ?? b.rigOwner
      if (!rigPart) continue

      const ix0 = Math.max(a.box.min.x, b.box.min.x)
      const ix1 = Math.min(a.box.max.x, b.box.max.x)
      const iy0 = Math.max(a.box.min.y, b.box.min.y)
      const iy1 = Math.min(a.box.max.y, b.box.max.y)
      const iz0 = Math.max(a.box.min.z, b.box.min.z)
      const iz1 = Math.min(a.box.max.z, b.box.max.z)
      if (ix1 <= ix0 || iy1 <= iy0 || iz1 <= iz0) continue

      const ivBox = (ix1 - ix0) * (iy1 - iy0) * (iz1 - iz0)
      const minVol = Math.min(a.vol, b.vol)
      if (ivBox < minVol * 0.45) continue

      let insideBoth = 0
      const geoA = a.geo
      const geoB = b.geo
      for (let gx = 0; gx < SAMPLE_GRID; gx++) {
        const sx = ix0 + ((ix1 - ix0) * (gx + 0.5)) / SAMPLE_GRID
        for (let gy = 0; gy < SAMPLE_GRID; gy++) {
          const sy = iy0 + ((iy1 - iy0) * (gy + 0.5)) / SAMPLE_GRID
          for (let gz = 0; gz < SAMPLE_GRID; gz++) {
            const sz = iz0 + ((iz1 - iz0) * (gz + 0.5)) / SAMPLE_GRID
            samplePt.set(sx, sy, sz)
            if (
              pointInsideLocalMesh(samplePt, a.invMatrix, geoA)
              && pointInsideLocalMesh(samplePt, b.invMatrix, geoB)
            ) {
              insideBoth++
            }
          }
        }
      }
      if (insideBoth === 0) continue

      const ovVol = (insideBoth / samples) * ivBox
      const containment = Math.min(1, ovVol / minVol)
      const jaccard = ovVol / Math.max(1e-6, a.vol + b.vol - ovVol)
      const isSevere = jaccard >= 0.35 || (containment >= 0.55 && jaccard >= 0.11 && minVol >= 0.04)
      if (isSevere) {
        overlaps.push({
          meshA: a.label,
          meshB: b.label,
          rigPart,
          overlapVolume: Math.round(ovVol * 10000) / 10000,
          containment: Math.round(containment * 1000) / 1000,
          jaccard: Math.round(jaccard * 1000) / 1000,
        })
      }
    }
  }
  overlaps.sort((x, y) => y.jaccard - x.jaccard || y.containment - x.containment)
  return overlaps
}
