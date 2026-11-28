import * as T from 'three'
import { createAssetController, inspectAsset } from '../capabilities/runtime'

export interface AnimationDetachment {
  kind: 'floating-clip' | 'lost-anchor-clip' | 'floating-rig' | 'lost-anchor-rig'
  source: string
  node: string
  at: number
  gap: number
  meshes: string[]
}

interface MeshEntry {
  obj: T.Mesh
  name: string
  box: T.Box3
}

const TOUCH_EPS = 0.04
const ANCHOR_GAP_LIMIT = 0.06
const GROUND_FLOAT_EPS = 0.04

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

function collectRigidMeshes(root: T.Object3D): MeshEntry[] {
  root.updateMatrixWorld(true)
  const out: MeshEntry[] = []
  const box = new T.Box3()
  let idx = 0
  root.traverse(obj => {
    if (!(obj instanceof T.Mesh) || obj instanceof T.SkinnedMesh || !isVisibleInTree(obj)) return
    const typed = obj as T.Mesh
    box.setFromObject(typed)
    if (box.isEmpty()) return
    const parentName = typed.parent?.name ? `${typed.parent.name}/` : ''
    const label = `${parentName}${typed.name || `Mesh#${String(idx)}`}`
    idx++
    out.push({ obj: typed, name: label, box: box.clone() })
  })
  return out
}

function boxesTouch(a: T.Box3, b: T.Box3, eps: number): boolean {
  return a.min.x - eps <= b.max.x && a.max.x + eps >= b.min.x
    && a.min.y - eps <= b.max.y && a.max.y + eps >= b.min.y
    && a.min.z - eps <= b.max.z && a.max.z + eps >= b.min.z
}

function boxGap(a: T.Box3, b: T.Box3): number {
  const dx = Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x)
  const dy = Math.max(0, a.min.y - b.max.y, b.min.y - a.max.y)
  const dz = Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z)
  return Math.hypot(dx, dy, dz)
}

const tmpInv = new T.Matrix4()
const tmpToDst = new T.Matrix4()
const tmpBox = new T.Box3()
const tmpCol = new T.Vector3()

function projectedLocalTouch(src: MeshEntry, dst: MeshEntry, eps: number): boolean {
  const gSrc = src.obj.geometry
  const gDst = dst.obj.geometry
  if (!gSrc.boundingBox) gSrc.computeBoundingBox()
  if (!gDst.boundingBox) gDst.computeBoundingBox()
  const sBox = gSrc.boundingBox
  const dBox = gDst.boundingBox
  if (!sBox || !dBox) return true
  tmpInv.copy(dst.obj.matrixWorld).invert()
  tmpToDst.multiplyMatrices(tmpInv, src.obj.matrixWorld)
  tmpBox.copy(sBox).applyMatrix4(tmpToDst)
  const sx = tmpCol.setFromMatrixColumn(dst.obj.matrixWorld, 0).length() || 1
  const sy = tmpCol.setFromMatrixColumn(dst.obj.matrixWorld, 1).length() || 1
  const sz = tmpCol.setFromMatrixColumn(dst.obj.matrixWorld, 2).length() || 1
  return tmpBox.min.x - eps / sx <= dBox.max.x && tmpBox.max.x + eps / sx >= dBox.min.x
    && tmpBox.min.y - eps / sy <= dBox.max.y && tmpBox.max.y + eps / sy >= dBox.min.y
    && tmpBox.min.z - eps / sz <= dBox.max.z && tmpBox.max.z + eps / sz >= dBox.min.z
}

function localBoxesTouch(a: MeshEntry, b: MeshEntry, eps: number): boolean {
  if (!boxesTouch(a.box, b.box, eps)) return false
  return projectedLocalTouch(a, b, eps) && projectedLocalTouch(b, a, eps)
}

function isDescendant(obj: T.Object3D, ancestor: T.Object3D): boolean {
  let cur: T.Object3D | null = obj
  while (cur) {
    if (cur === ancestor) return true
    cur = cur.parent
  }
  return false
}

function findFloatingComponentsOBB(recs: readonly MeshEntry[], skipObjs?: ReadonlySet<T.Object3D>): string[][] {
  const filtered = skipObjs && skipObjs.size > 0 ? recs.filter(r => !skipObjs.has(r.obj)) : recs
  const n = filtered.length
  if (n <= 1) return []
  const parent = new Int32Array(n)
  for (let i = 0; i < n; i++) parent[i] = i
  const find = (i: number): number => {
    let cur = i
    while (parent[cur] !== cur) {
      const next = parent[cur]
      if (next === undefined) break
      cur = next
    }
    let walk = i
    while (walk !== cur) {
      const next = parent[walk]
      parent[walk] = cur
      if (next === undefined) break
      walk = next
    }
    return cur
  }
  const overall = new T.Box3()
  for (const r of filtered) overall.union(r.box)
  for (let i = 0; i < n; i++) {
    const a = filtered[i]
    if (!a) continue
    for (let j = i + 1; j < n; j++) {
      const b = filtered[j]
      if (!b) continue
      if (localBoxesTouch(a, b, TOUCH_EPS)) {
        const ra = find(i)
        const rb = find(j)
        if (ra !== rb) parent[ra] = rb
      }
    }
  }
  const comps = new Map<number, MeshEntry[]>()
  for (let i = 0; i < n; i++) {
    const rec = filtered[i]
    if (!rec) continue
    const rootId = find(i)
    const list = comps.get(rootId)
    if (list) list.push(rec)
    else comps.set(rootId, [rec])
  }
  if (comps.size <= 1) return []
  let bestRoot = -1
  let bestCount = -1
  for (const [rootId, list] of comps) {
    if (list.length > bestCount) {
      bestCount = list.length
      bestRoot = rootId
    }
  }
  const floating: string[][] = []
  for (const [rootId, list] of comps) {
    if (rootId === bestRoot) continue
    let minY = Infinity
    for (const rec of list) if (rec.box.min.y < minY) minY = rec.box.min.y
    if (minY > overall.min.y + GROUND_FLOAT_EPS) {
      floating.push(list.map(r => r.name))
    }
  }
  return floating
}

function collectFloatingObjsAtRest(recs: readonly MeshEntry[]): Set<T.Object3D> {
  const names = new Set(findFloatingComponentsOBB(recs).flat())
  const objs = new Set<T.Object3D>()
  for (const r of recs) if (names.has(r.name)) objs.add(r.obj)
  return objs
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

function buildRestAnchors(
  root: T.Object3D,
  restRecs: readonly MeshEntry[],
  nodeNames: Iterable<string>,
): Map<string, { node: T.Object3D; anchors: Set<T.Object3D> }> {
  const map = new Map<string, { node: T.Object3D; anchors: Set<T.Object3D> }>()
  for (const nodeName of nodeNames) {
    const node = root.getObjectByName(nodeName)
    if (!node || node instanceof T.Bone) continue
    const sub = restRecs.filter(r => isDescendant(r.obj, node))
    const ext = restRecs.filter(r => !isDescendant(r.obj, node))
    if (!sub.length || !ext.length) continue
    const anchors = new Set<T.Object3D>()
    for (const s of sub) {
      for (const e of ext) {
        if (localBoxesTouch(s, e, TOUCH_EPS)) anchors.add(e.obj)
      }
    }
    if (anchors.size > 0) map.set(nodeName, { node, anchors })
  }
  return map
}

function minAnchorGap(
  curRecs: readonly MeshEntry[],
  node: T.Object3D,
  anchors: ReadonlySet<T.Object3D>,
): number {
  const sub = curRecs.filter(r => isDescendant(r.obj, node))
  const ext = curRecs.filter(r => anchors.has(r.obj))
  if (!sub.length || !ext.length) return 0
  let best = Infinity
  for (const s of sub) {
    for (const e of ext) {
      const g = boxGap(s.box, e.box)
      if (g < best) best = g
      if (best === 0) return 0
    }
  }
  return best
}

/**
 * Steps every authored AnimationClip and interactive riggedPart through its full range of motion
 * and flags any rigid component that detaches into mid-air or breaks away from its rest anchors.
 */
export function findAnimationDetachments(root: T.Object3D): AnimationDetachment[] {
  if (hasSkinnedMesh(root)) return []
  const snap = snapshotTransforms(root)
  const restRecs = collectRigidMeshes(root)
  if (restRecs.length <= 1) return []
  // Ignore meshes that were already floating at rest (caught separately by rest craft invariants).
  const restFloatObjs = collectFloatingObjsAtRest(restRecs)
  const issues: AnimationDetachment[] = []

  try {
    for (const clip of root.animations) {
      if (!clip.tracks.length || clip.duration <= 0) continue
      const trackNodes = new Set<string>()
      const sampleTimes = new Set<number>()
      for (let k = 1; k <= 9; k++) sampleTimes.add((k / 10) * clip.duration)
      for (const tr of clip.tracks) {
        const name = tr.name.split('.')[0]
        if (name) trackNodes.add(name)
        for (const tm of tr.times) {
          if (tm > 1e-4 && tm < clip.duration - 1e-4) sampleTimes.add(tm)
        }
      }
      const anchors = buildRestAnchors(root, restRecs, trackNodes)
      const mixer = new T.AnimationMixer(root)
      mixer.clipAction(clip).play()
      let clipFloatFound = false
      const anchorReported = new Set<string>()
      for (const t of [...sampleTimes].sort((a, b) => a - b)) {
        mixer.setTime(t)
        const curRecs = collectRigidMeshes(root)
        if (!clipFloatFound) {
          const fl = findFloatingComponentsOBB(curRecs, restFloatObjs)
          if (fl.length > 0) {
            clipFloatFound = true
            issues.push({
              kind: 'floating-clip',
              source: clip.name,
              node: fl[0]?.[0] ?? clip.name,
              at: Math.round(t * 100) / 100,
              gap: TOUCH_EPS,
              meshes: (fl[0] ?? []).slice(0, 4),
            })
          }
        }
        for (const [nodeName, info] of anchors) {
          if (anchorReported.has(nodeName)) continue
          const gap = minAnchorGap(curRecs, info.node, info.anchors)
          if (gap > ANCHOR_GAP_LIMIT) {
            anchorReported.add(nodeName)
            issues.push({
              kind: 'lost-anchor-clip',
              source: clip.name,
              node: nodeName,
              at: Math.round(t * 100) / 100,
              gap: Math.round(gap * 1000) / 1000,
              meshes: [nodeName],
            })
          }
        }
      }
      mixer.stopAllAction()
      mixer.uncacheRoot(root)
      restoreTransforms(root, snap)
    }

    const caps = inspectAsset(root)
    if (caps.riggedParts.length > 0) {
      const rigAnchors = buildRestAnchors(root, restRecs, caps.riggedParts.map(p => p.name))
      const ctrl = createAssetController(root)
      try {
        for (const part of caps.riggedParts) {
          if (part.mimic) continue
          const [lo, hi] = part.range
          let rigFloatFound = false
          let rigAnchorFound = false
          for (const frac of [0.25, 0.5, 0.75, 1.0]) {
            const val = lo + (hi - lo) * frac
            ctrl.setPart(part.name, val)
            const curRecs = collectRigidMeshes(root)
            if (!rigFloatFound) {
              const fl = findFloatingComponentsOBB(curRecs, restFloatObjs)
              if (fl.length > 0) {
                rigFloatFound = true
                issues.push({
                  kind: 'floating-rig',
                  source: part.name,
                  node: part.name,
                  at: Math.round(val * 100) / 100,
                  gap: TOUCH_EPS,
                  meshes: (fl[0] ?? []).slice(0, 4),
                })
              }
            }
            const info = rigAnchors.get(part.name)
            if (info && !rigAnchorFound) {
              const gap = minAnchorGap(curRecs, info.node, info.anchors)
              if (gap > ANCHOR_GAP_LIMIT) {
                rigAnchorFound = true
                issues.push({
                  kind: 'lost-anchor-rig',
                  source: part.name,
                  node: part.name,
                  at: Math.round(val * 100) / 100,
                  gap: Math.round(gap * 1000) / 1000,
                  meshes: [part.name],
                })
              }
            }
          }
          ctrl.closePart(part.name)
          restoreTransforms(root, snap)
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
