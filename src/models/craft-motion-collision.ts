import * as T from 'three'
import { createAssetController, inspectAsset } from '../capabilities/runtime'

export interface MidMotionSolidCollision {
  kind: 'clip-collision' | 'rig-collision'
  source: string
  part: string
  at: number
  meshA: string
  meshB: string
  overlapDelta: number
  deltaContainment: number
}

interface RigidSolid {
  obj: T.Mesh
  label: string
  geo: T.BufferGeometry
  vol: number
  restBox: T.Box3
  restInv: T.Matrix4
  box: T.Box3
  inv: T.Matrix4
}

const SAMPLE_GRID = 4
const SAMPLES = SAMPLE_GRID * SAMPLE_GRID * SAMPLE_GRID
const MIN_MESH_VOL = 0.0025
const MIN_OVERLAP_DELTA = 0.002
const MIN_DELTA_CONTAINMENT = 0.32
const RAY_DIR = new T.Vector3(0.713, 0.517, 0.473)

const tmpA = new T.Vector3()
const tmpB = new T.Vector3()
const tmpC = new T.Vector3()
const tmpE1 = new T.Vector3()
const tmpE2 = new T.Vector3()
const tmpH = new T.Vector3()
const tmpS = new T.Vector3()
const tmpQ = new T.Vector3()
const tmpLp = new T.Vector3()
const tmpPt = new T.Vector3()
const tmpCross = new T.Vector3()

function isVisibleInTree(obj: T.Object3D): boolean {
  let cur: T.Object3D | null = obj
  while (cur) {
    if (!cur.visible) return false
    cur = cur.parent
  }
  return true
}

function hasSkinnedMesh(root: T.Object3D): boolean {
  let found = false
  root.traverse(obj => {
    if (obj instanceof T.SkinnedMesh) found = true
  })
  return found
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
  let volume6 = 0
  for (let t = 0; t < tris; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
    tmpA.fromBufferAttribute(pos, i0).applyMatrix4(matrixWorld)
    tmpB.fromBufferAttribute(pos, i1).applyMatrix4(matrixWorld)
    tmpC.fromBufferAttribute(pos, i2).applyMatrix4(matrixWorld)
    tmpCross.crossVectors(tmpB, tmpC)
    volume6 += tmpA.dot(tmpCross)
  }
  return Math.abs(volume6) / 6
}

function pointInsideLocalMesh(
  worldPt: T.Vector3,
  invMatrix: T.Matrix4,
  geo: T.BufferGeometry,
): boolean {
  tmpLp.copy(worldPt).applyMatrix4(invMatrix)
  const pos = geo.getAttribute('position') as T.BufferAttribute | undefined
  if (!pos || pos.count < 3) return false
  const idx = geo.index
  const tris = Math.floor((idx ? idx.count : pos.count) / 3)
  let hits = 0
  for (let t = 0; t < tris; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
    tmpA.fromBufferAttribute(pos, i0)
    tmpB.fromBufferAttribute(pos, i1)
    tmpC.fromBufferAttribute(pos, i2)
    tmpE1.subVectors(tmpB, tmpA)
    tmpE2.subVectors(tmpC, tmpA)
    tmpH.crossVectors(RAY_DIR, tmpE2)
    const det = tmpE1.dot(tmpH)
    if (Math.abs(det) < 1e-8) continue
    const f = 1 / det
    tmpS.subVectors(tmpLp, tmpA)
    const u = f * tmpS.dot(tmpH)
    if (u < 0 || u > 1) continue
    tmpQ.crossVectors(tmpS, tmpE1)
    const v = f * RAY_DIR.dot(tmpQ)
    if (v < 0 || u + v > 1) continue
    if (f * tmpE2.dot(tmpQ) > 1e-5) hits++
  }
  return hits % 2 === 1
}

function overlapVolume(
  boxA: T.Box3,
  invA: T.Matrix4,
  geoA: T.BufferGeometry,
  boxB: T.Box3,
  invB: T.Matrix4,
  geoB: T.BufferGeometry,
  minVol: number,
  minBoxGate: number,
): number {
  const ix0 = Math.max(boxA.min.x, boxB.min.x)
  const ix1 = Math.min(boxA.max.x, boxB.max.x)
  const iy0 = Math.max(boxA.min.y, boxB.min.y)
  const iy1 = Math.min(boxA.max.y, boxB.max.y)
  const iz0 = Math.max(boxA.min.z, boxB.min.z)
  const iz1 = Math.min(boxA.max.z, boxB.max.z)
  if (ix1 <= ix0 || iy1 <= iy0 || iz1 <= iz0) return 0
  const ivBox = (ix1 - ix0) * (iy1 - iy0) * (iz1 - iz0)
  if (ivBox < minBoxGate) return 0
  let insideBoth = 0
  for (let gx = 0; gx < SAMPLE_GRID; gx++) {
    const sx = ix0 + ((ix1 - ix0) * (gx + 0.5)) / SAMPLE_GRID
    for (let gy = 0; gy < SAMPLE_GRID; gy++) {
      const sy = iy0 + ((iy1 - iy0) * (gy + 0.5)) / SAMPLE_GRID
      for (let gz = 0; gz < SAMPLE_GRID; gz++) {
        const sz = iz0 + ((iz1 - iz0) * (gz + 0.5)) / SAMPLE_GRID
        tmpPt.set(sx, sy, sz)
        if (
          pointInsideLocalMesh(tmpPt, invA, geoA)
          && pointInsideLocalMesh(tmpPt, invB, geoB)
        ) {
          insideBoth++
        }
      }
    }
  }
  return Math.min(minVol, (insideBoth / SAMPLES) * ivBox)
}

function collectSolids(root: T.Object3D): RigidSolid[] {
  root.updateMatrixWorld(true)
  const solids: RigidSolid[] = []
  let idx = 0
  root.traverse(obj => {
    if (!(obj instanceof T.Mesh) || obj instanceof T.SkinnedMesh || !isVisibleInTree(obj)) return
    const mesh = obj as T.Mesh
    if (!isOpaqueMaterial(mesh.material)) return
    const geo = mesh.geometry
    const vol = signedMeshVolume(geo, mesh.matrixWorld)
    if (vol < MIN_MESH_VOL) return
    const restBox = new T.Box3().setFromObject(mesh)
    if (restBox.isEmpty()) return
    const restInv = mesh.matrixWorld.clone().invert()
    const parentName = mesh.parent?.name ? `${mesh.parent.name}/` : ''
    const label = `${parentName}${mesh.name || `Mesh#${String(idx)}`}`
    idx++
    solids.push({
      obj: mesh,
      label,
      geo,
      vol,
      restBox,
      restInv,
      box: restBox.clone(),
      inv: restInv.clone(),
    })
  })
  return solids
}

function updateSolids(root: T.Object3D, solids: readonly RigidSolid[]): void {
  root.updateMatrixWorld(true)
  for (const s of solids) {
    s.box.setFromObject(s.obj)
    s.inv.copy(s.obj.matrixWorld).invert()
  }
}

function snapshotTransforms(root: T.Object3D): Map<T.Object3D, { p: T.Vector3; q: T.Quaternion; s: T.Vector3 }> {
  const snap = new Map<T.Object3D, { p: T.Vector3; q: T.Quaternion; s: T.Vector3 }>()
  root.traverse(obj => {
    snap.set(obj, { p: obj.position.clone(), q: obj.quaternion.clone(), s: obj.scale.clone() })
  })
  return snap
}

function restoreTransforms(
  root: T.Object3D,
  snap: ReadonlyMap<T.Object3D, { p: T.Vector3; q: T.Quaternion; s: T.Vector3 }>,
): void {
  for (const [obj, tr] of snap) {
    obj.position.copy(tr.p)
    obj.quaternion.copy(tr.q)
    obj.scale.copy(tr.s)
  }
  root.updateMatrixWorld(true)
}

function resolveOwner(obj: T.Object3D, targets: ReadonlySet<string>): string | null {
  let cur: T.Object3D | null = obj
  while (cur) {
    if (cur.name && targets.has(cur.name)) return cur.name
    cur = cur.parent
  }
  return null
}

function scanPose(
  solids: readonly RigidSolid[],
  owners: readonly (string | null)[],
  restOvCache: Map<string, number>,
  kind: MidMotionSolidCollision['kind'],
  source: string,
  partFallback: string,
  at: number,
  currentWorst: MidMotionSolidCollision | null,
): MidMotionSolidCollision | null {
  let worst = currentWorst
  const n = solids.length
  for (let i = 0; i < n; i++) {
    const a = solids[i]
    const oa = owners[i]
    if (!a) continue
    for (let j = i + 1; j < n; j++) {
      const b = solids[j]
      const ob = owners[j]
      if (!b || oa === ob) continue
      const minVol = Math.min(a.vol, b.vol)
      const gate = Math.max(MIN_OVERLAP_DELTA, minVol * MIN_DELTA_CONTAINMENT)
      const ov = overlapVolume(a.box, a.inv, a.geo, b.box, b.inv, b.geo, minVol, gate)
      if (ov < gate) continue

      const key = `${String(i)}:${String(j)}`
      let restOv = restOvCache.get(key)
      if (restOv === undefined) {
        restOv = overlapVolume(a.restBox, a.restInv, a.geo, b.restBox, b.restInv, b.geo, minVol, 1e-6)
        restOvCache.set(key, restOv)
      }
      const delta = ov - restOv
      const frac = delta / Math.max(1e-6, minVol)
      if (delta < MIN_OVERLAP_DELTA || frac < MIN_DELTA_CONTAINMENT) continue
      if (!worst || frac > worst.deltaContainment || (frac === worst.deltaContainment && delta > worst.overlapDelta)) {
        worst = {
          kind,
          source,
          part: oa ?? ob ?? partFallback,
          at: Math.round(at * 100) / 100,
          meshA: a.label,
          meshB: b.label,
          overlapDelta: Math.round(delta * 10000) / 10000,
          deltaContainment: Math.round(frac * 1000) / 1000,
        }
      }
    }
  }
  return worst
}

/**
 * Steps every rotating AnimationClip track and every rotating riggedPart slider through
 * its range of motion and flags rigid solids that plunge deeply into another solid body.
 */
export function findMidMotionSolidCollisions(root: T.Object3D): MidMotionSolidCollision[] {
  if (hasSkinnedMesh(root)) return []
  const snap = snapshotTransforms(root)
  const solids = collectSolids(root)
  if (solids.length <= 1) return []
  const restOvCache = new Map<string, number>()
  const issues: MidMotionSolidCollision[] = []

  try {
    for (const clip of root.animations) {
      if (!clip.tracks.length || clip.duration <= 0) continue
      const rotatingTargets = new Set<string>()
      const sampleTimes = new Set<number>()
      for (let k = 1; k <= 9; k++) sampleTimes.add((k / 10) * clip.duration)
      for (const tr of clip.tracks) {
        if (!tr.name.includes('rotation') && !tr.name.includes('quaternion')) continue
        const nodeName = tr.name.split('.')[0]
        if (nodeName) rotatingTargets.add(nodeName)
        for (const tm of tr.times) {
          if (tm > 1e-4 && tm < clip.duration - 1e-4) sampleTimes.add(tm)
        }
      }
      if (rotatingTargets.size === 0) continue
      const owners = solids.map(s => resolveOwner(s.obj, rotatingTargets))
      if (!owners.some(Boolean)) continue

      let worst: MidMotionSolidCollision | null = null
      const mixer = new T.AnimationMixer(root)
      mixer.clipAction(clip).play()
      for (const t of [...sampleTimes].sort((a, b) => a - b)) {
        mixer.setTime(t)
        updateSolids(root, solids)
        worst = scanPose(solids, owners, restOvCache, 'clip-collision', clip.name, clip.name, t, worst)
      }
      mixer.stopAllAction()
      mixer.uncacheRoot(root)
      restoreTransforms(root, snap)
      if (worst) issues.push(worst)
    }

    const caps = inspectAsset(root)
    const rotatingParts = caps.riggedParts.filter(p => p.type === 'rotate' && !p.mimic)
    if (rotatingParts.length > 0) {
      const ctrl = createAssetController(root)
      try {
        for (const part of rotatingParts) {
          const targetSet = new Set([part.name])
          const owners = solids.map(s => resolveOwner(s.obj, targetSet))
          if (!owners.some(Boolean)) continue

          let worst: MidMotionSolidCollision | null = null
          const [lo, hi] = part.range
          for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
            const val = lo + (hi - lo) * frac
            if (Math.abs(val) < 1e-4) continue
            ctrl.setPart(part.name, val)
            updateSolids(root, solids)
            worst = scanPose(solids, owners, restOvCache, 'rig-collision', part.name, part.name, val, worst)
          }
          ctrl.closePart(part.name)
          restoreTransforms(root, snap)
          if (worst) issues.push(worst)
        }
      } finally {
        ctrl.dispose()
      }
    }
  } finally {
    restoreTransforms(root, snap)
  }

  return issues
}
