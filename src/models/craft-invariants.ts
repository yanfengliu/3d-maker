import * as T from 'three'
import { findRotatingRigSolidOverlaps, type RiggedSolidOverlap } from './craft-overlap'

export type { RiggedSolidOverlap }

export interface FloatingComponent {
  meshNames: string[]
  minY: number
  maxY: number
  meshCount: number
}

export interface ExposedZFightPair {
  meshA: string
  meshB: string
  area: number
  samplePoint: [number, number, number]
  normal: [number, number, number]
}

export interface MaterialIssue {
  meshName: string
  reason: string
}

export interface CraftAudit {
  meshCount: number
  nonFiniteVertices: number
  doubleSidedMeshes: string[]
  materialIssues: MaterialIssue[]
  minY: number
  maxY: number
  bottomToTopRatio: number
  backToFrontRatio: number
  leftRightBalance: number
  floatingComponents: FloatingComponent[]
  exposedZFightPairs: ExposedZFightPair[]
  rotatingRigOverlaps: RiggedSolidOverlap[]
}

interface WorldTri {
  meshIndex: number
  appearanceKey: string
  ax: number; ay: number; az: number
  bx: number; by: number; bz: number
  cx: number; cy: number; cz: number
  nx: number; ny: number; nz: number
  d: number
  area: number
  minX: number; minY: number; minZ: number
  maxX: number; maxY: number; maxZ: number
}

interface MeshRecord {
  index: number
  name: string
  box: T.Box3
  tris: WorldTri[]
}

type Pt2 = readonly [number, number]

type TypedMesh = T.Mesh<T.BufferGeometry, T.Material | T.Material[]>

function isVisibleInTree(obj: T.Object3D): boolean {
  let cur: T.Object3D | null = obj
  while (cur) {
    if (!cur.visible) return false
    cur = cur.parent
  }
  return true
}

function materialKey(mat: T.Material | undefined): string {
  if (mat instanceof T.MeshStandardMaterial) {
    return `${mat.color.getHexString()}|${mat.emissive.getHexString()}|${mat.transparent ? 't' : 'o'}`
  }
  return mat ? mat.type : 'none'
}

function appearanceForVertex(mesh: T.Mesh, indexOffset: number): string {
  if (!Array.isArray(mesh.material)) return materialKey(mesh.material)
  const groups = mesh.geometry.groups
  for (const g of groups) {
    if (indexOffset >= g.start && indexOffset < g.start + g.count) {
      return materialKey(mesh.material[g.materialIndex ?? 0])
    }
  }
  return materialKey(mesh.material[0])
}

function checkMaterials(mesh: T.Mesh, label: string, doubleSided: string[], issues: MaterialIssue[]) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  let sawDoubleSide = false
  for (const mat of mats) {
    if (mat.side === T.DoubleSide) sawDoubleSide = true
    if (!(mat instanceof T.MeshStandardMaterial)) continue
    if (!Number.isFinite(mat.roughness) || mat.roughness < 0 || mat.roughness > 1) {
      issues.push({ meshName: label, reason: `invalid roughness ${String(mat.roughness)}` })
    }
    if (!Number.isFinite(mat.metalness) || mat.metalness < 0 || mat.metalness > 1) {
      issues.push({ meshName: label, reason: `invalid metalness ${String(mat.metalness)}` })
    }
    const isTransmission = mat instanceof T.MeshPhysicalMaterial && mat.transmission > 0
    const isOpaqueMatte = !mat.transparent && mat.opacity >= 0.99 && !isTransmission
      && mat.metalness < 0.2 && mat.emissive.getHex() === 0
    if (isOpaqueMatte && mat.roughness < 0.15) {
      issues.push({ meshName: label, reason: `mirror-gloss matte surface (roughness ${mat.roughness.toFixed(2)})` })
    }
  }
  if (sawDoubleSide) doubleSided.push(label)
}

function clipPoly(subject: readonly Pt2[], clip: readonly Pt2[]): Pt2[] {
  let out: Pt2[] = [...subject]
  for (let i = 0; i < clip.length; i++) {
    const a = clip[i]
    const b = clip[(i + 1) % clip.length]
    if (!a || !b || out.length === 0) return []
    const ex = b[0] - a[0]
    const ey = b[1] - a[1]
    const next: Pt2[] = []
    for (let j = 0; j < out.length; j++) {
      const p = out[j]
      const q = out[(j + 1) % out.length]
      if (!p || !q) continue
      const cp = ex * (p[1] - a[1]) - ey * (p[0] - a[0])
      const cq = ex * (q[1] - a[1]) - ey * (q[0] - a[0])
      if (cp >= -1e-9) next.push(p)
      if ((cp >= 0 && cq < 0) || (cp < 0 && cq >= 0)) {
        const denom = cp - cq
        if (Math.abs(denom) > 1e-12) {
          const t = cp / denom
          next.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])])
        }
      }
    }
    out = next
  }
  return out
}

function polyAreaAndCentroid(poly: readonly Pt2[]): { area: number; u: number; v: number } {
  if (poly.length < 3) return { area: 0, u: 0, v: 0 }
  let sum2 = 0
  let cu = 0
  let cv = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    if (!a || !b) continue
    const cross = a[0] * b[1] - b[0] * a[1]
    sum2 += cross
    cu += (a[0] + b[0]) * cross
    cv += (a[1] + b[1]) * cross
  }
  if (Math.abs(sum2) < 1e-12) return { area: 0, u: 0, v: 0 }
  return { area: Math.abs(sum2) * 0.5, u: cu / (3 * sum2), v: cv / (3 * sum2) }
}

function ensureCcw(tri: readonly [Pt2, Pt2, Pt2]): [Pt2, Pt2, Pt2] {
  const [a, b, c] = tri
  const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  return cross >= 0 ? [a, b, c] : [a, c, b]
}

function planeBasis(nx: number, ny: number, nz: number) {
  const hx = Math.abs(ny) < 0.9 ? 0 : 1
  const hy = Math.abs(ny) < 0.9 ? 1 : 0
  const hz = 0
  let ux = hy * nz - hz * ny
  let uy = hz * nx - hx * nz
  let uz = hx * ny - hy * nx
  const uLen = Math.hypot(ux, uy, uz) || 1
  ux /= uLen; uy /= uLen; uz /= uLen
  const vx = ny * uz - nz * uy
  const vy = nz * ux - nx * uz
  const vz = nx * uy - ny * ux
  return { ux, uy, uz, vx, vy, vz }
}

function rayHitsTri(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  tri: WorldTri,
): boolean {
  const e1x = tri.bx - tri.ax, e1y = tri.by - tri.ay, e1z = tri.bz - tri.az
  const e2x = tri.cx - tri.ax, e2y = tri.cy - tri.ay, e2z = tri.cz - tri.az
  const px = dy * e2z - dz * e2y
  const py = dz * e2x - dx * e2z
  const pz = dx * e2y - dy * e2x
  const det = e1x * px + e1y * py + e1z * pz
  if (Math.abs(det) < 1e-9) return false
  const invDet = 1 / det
  const tx = ox - tri.ax, ty = oy - tri.ay, tz = oz - tri.az
  const u = (tx * px + ty * py + tz * pz) * invDet
  if (u < 0 || u > 1) return false
  const qx = ty * e1z - tz * e1y
  const qy = tz * e1x - tx * e1z
  const qz = tx * e1y - ty * e1x
  const v = (dx * qx + dy * qy + dz * qz) * invDet
  if (v < 0 || u + v > 1) return false
  const t = (e2x * qx + e2y * qy + e2z * qz) * invDet
  return t > 1e-5
}

function isBuriedInOtherSolid(
  px: number, py: number, pz: number,
  nx: number, ny: number, nz: number,
  meshA: number, meshB: number,
  records: readonly MeshRecord[],
): boolean {
  const ox = px + nx * 0.004
  const oy = py + ny * 0.004
  const oz = pz + nz * 0.004
  // Slight deterministic tilt avoids shooting straight through shared edges
  const rx = nx + 0.013, ry = ny + 0.017, rz = nz + 0.019
  const rLen = Math.hypot(rx, ry, rz) || 1
  const dx = rx / rLen, dy = ry / rLen, dz = rz / rLen
  for (const rec of records) {
    if (rec.index === meshA || rec.index === meshB) continue
    const b = rec.box
    if (ox < b.min.x || ox > b.max.x || oy < b.min.y || oy > b.max.y || oz < b.min.z || oz > b.max.z) continue
    let hits = 0
    for (const tri of rec.tris) {
      if (rayHitsTri(ox, oy, oz, dx, dy, dz, tri)) hits++
    }
    if (hits % 2 === 1) return true
  }
  return false
}

function findFloatingComponents(records: readonly MeshRecord[], overall: T.Box3): FloatingComponent[] {
  const n = records.length
  if (n <= 1) return []
  const size = overall.getSize(new T.Vector3())
  const eps = Math.max(0.02, size.length() * 0.5 * 0.008)
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = (x: number): number => {
    let cur = x
    while (parent[cur] !== cur) {
      const p = parent[cur]
      if (p === undefined) break
      cur = p
    }
    let walk = x
    while (walk !== cur) {
      const next = parent[walk]
      parent[walk] = cur
      if (next === undefined) break
      walk = next
    }
    return cur
  }
  for (let i = 0; i < n; i++) {
    const a = records[i]?.box
    if (!a) continue
    for (let j = i + 1; j < n; j++) {
      const b = records[j]?.box
      if (!b) continue
      if (
        a.min.x - eps <= b.max.x && a.max.x + eps >= b.min.x
        && a.min.y - eps <= b.max.y && a.max.y + eps >= b.min.y
        && a.min.z - eps <= b.max.z && a.max.z + eps >= b.min.z
      ) {
        const ra = find(i)
        const rb = find(j)
        if (ra !== rb) parent[ra] = rb
      }
    }
  }
  const comps = new Map<number, MeshRecord[]>()
  for (let i = 0; i < n; i++) {
    const rec = records[i]
    if (!rec) continue
    const rootId = find(i)
    const list = comps.get(rootId)
    if (list) list.push(rec)
    else comps.set(rootId, [rec])
  }
  if (comps.size <= 1) return []
  let largestRoot = -1
  let largestCount = -1
  for (const [rootId, list] of comps) {
    if (list.length > largestCount) {
      largestCount = list.length
      largestRoot = rootId
    }
  }
  const floating: FloatingComponent[] = []
  for (const [rootId, list] of comps) {
    if (rootId === largestRoot) continue
    let minY = Infinity
    let maxY = -Infinity
    for (const rec of list) {
      if (rec.box.min.y < minY) minY = rec.box.min.y
      if (rec.box.max.y > maxY) maxY = rec.box.max.y
    }
    if (minY > overall.min.y + 0.04) {
      floating.push({
        meshNames: list.map(r => r.name),
        minY,
        maxY,
        meshCount: list.length,
      })
    }
  }
  return floating
}

function findExposedZFighting(records: readonly MeshRecord[], allTris: readonly WorldTri[]): ExposedZFightPair[] {
  const buckets = new Map<string, WorldTri[]>()
  for (const tri of allTris) {
    const kx = Math.round(tri.nx / 0.04)
    const ky = Math.round(tri.ny / 0.04)
    const kz = Math.round(tri.nz / 0.04)
    const key = `${String(kx)},${String(ky)},${String(kz)}`
    const list = buckets.get(key)
    if (list) list.push(tri)
    else buckets.set(key, [tri])
  }
  interface PairAccum {
    meshA: number
    meshB: number
    exposedArea: number
    bestArea: number
    samplePoint: [number, number, number]
    normal: [number, number, number]
  }
  const pairs = new Map<string, PairAccum>()
  for (const bucket of buckets.values()) {
    if (bucket.length < 2) continue
    bucket.sort((a, b) => a.d - b.d)
    for (let i = 0; i < bucket.length; i++) {
      const t1 = bucket[i]
      if (!t1) continue
      const basis = planeBasis(t1.nx, t1.ny, t1.nz)
      const tri1 = ensureCcw([
        [t1.ax * basis.ux + t1.ay * basis.uy + t1.az * basis.uz, t1.ax * basis.vx + t1.ay * basis.vy + t1.az * basis.vz],
        [t1.bx * basis.ux + t1.by * basis.uy + t1.bz * basis.uz, t1.bx * basis.vx + t1.by * basis.vy + t1.bz * basis.vz],
        [t1.cx * basis.ux + t1.cy * basis.uy + t1.cz * basis.uz, t1.cx * basis.vx + t1.cy * basis.vy + t1.cz * basis.vz],
      ])
      for (let j = i + 1; j < bucket.length; j++) {
        const t2 = bucket[j]
        if (!t2) continue
        if (t2.d - t1.d > 0.006) break
        if (t1.meshIndex === t2.meshIndex || t1.appearanceKey === t2.appearanceKey) continue
        if (t1.nx * t2.nx + t1.ny * t2.ny + t1.nz * t2.nz < 0.996) continue
        if (
          t1.maxX + 0.002 < t2.minX || t2.maxX + 0.002 < t1.minX
          || t1.maxY + 0.002 < t2.minY || t2.maxY + 0.002 < t1.minY
          || t1.maxZ + 0.002 < t2.minZ || t2.maxZ + 0.002 < t1.minZ
        ) continue
        const tri2 = ensureCcw([
          [t2.ax * basis.ux + t2.ay * basis.uy + t2.az * basis.uz, t2.ax * basis.vx + t2.ay * basis.vy + t2.az * basis.vz],
          [t2.bx * basis.ux + t2.by * basis.uy + t2.bz * basis.uz, t2.bx * basis.vx + t2.by * basis.vy + t2.bz * basis.vz],
          [t2.cx * basis.ux + t2.cy * basis.uy + t2.cz * basis.uz, t2.cx * basis.vx + t2.cy * basis.vy + t2.cz * basis.vz],
        ])
        const overlap = polyAreaAndCentroid(clipPoly(tri1, tri2))
        if (overlap.area < 1e-4) continue
        const wx = basis.ux * overlap.u + basis.vx * overlap.v + t1.nx * t1.d
        const wy = basis.uy * overlap.u + basis.vy * overlap.v + t1.ny * t1.d
        const wz = basis.uz * overlap.u + basis.vz * overlap.v + t1.nz * t1.d
        const planeSep = Math.abs((wx - t2.ax) * t2.nx + (wy - t2.ay) * t2.ny + (wz - t2.az) * t2.nz)
        if (planeSep > 0.004) continue
        if (isBuriedInOtherSolid(wx, wy, wz, t1.nx, t1.ny, t1.nz, t1.meshIndex, t2.meshIndex, records)) continue
        const lo = Math.min(t1.meshIndex, t2.meshIndex)
        const hi = Math.max(t1.meshIndex, t2.meshIndex)
        const pairKey = `${String(lo)}:${String(hi)}`
        const existing = pairs.get(pairKey)
        if (!existing) {
          pairs.set(pairKey, {
            meshA: lo,
            meshB: hi,
            exposedArea: overlap.area,
            bestArea: overlap.area,
            samplePoint: [wx, wy, wz],
            normal: [t1.nx, t1.ny, t1.nz],
          })
        } else {
          existing.exposedArea += overlap.area
          if (overlap.area > existing.bestArea) {
            existing.bestArea = overlap.area
            existing.samplePoint = [wx, wy, wz]
            existing.normal = [t1.nx, t1.ny, t1.nz]
          }
        }
      }
    }
  }
  const result: ExposedZFightPair[] = []
  for (const pair of pairs.values()) {
    if (pair.exposedArea <= 0.005) continue
    result.push({
      meshA: records[pair.meshA]?.name ?? `mesh#${String(pair.meshA)}`,
      meshB: records[pair.meshB]?.name ?? `mesh#${String(pair.meshB)}`,
      area: pair.exposedArea,
      samplePoint: pair.samplePoint,
      normal: pair.normal,
    })
  }
  result.sort((a, b) => b.area - a.area)
  return result
}

export function auditModelCraft(root: T.Object3D, rotatingPartNames?: ReadonlySet<string>): CraftAudit {
  root.updateMatrixWorld(true)
  const records: MeshRecord[] = []
  const allTris: WorldTri[] = []
  const doubleSidedMeshes: string[] = []
  const materialIssues: MaterialIssue[] = []
  const overall = new T.Box3()
  let nonFiniteVertices = 0
  let posX = 0, negX = 0, posY = 0, negY = 0, posZ = 0, negZ = 0
  const v0 = new T.Vector3()
  const v1 = new T.Vector3()
  const v2 = new T.Vector3()

  root.traverse(obj => {
    if (!(obj instanceof T.Mesh) || !isVisibleInTree(obj)) return
    const typed = obj as TypedMesh
    const pos = typed.geometry.getAttribute('position') as T.BufferAttribute | undefined
    if (!pos || pos.count < 3) return
    const index = records.length
    const parentName = typed.parent?.name ? `${typed.parent.name}/` : ''
    const label = `${parentName}${typed.name || `Mesh#${String(index)}`}`
    checkMaterials(typed, label, doubleSidedMeshes, materialIssues)
    const meshBox = new T.Box3()
    const worldVerts = new Float64Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      v0.fromBufferAttribute(pos, i).applyMatrix4(typed.matrixWorld)
      if (!Number.isFinite(v0.x) || !Number.isFinite(v0.y) || !Number.isFinite(v0.z)) {
        nonFiniteVertices++
        continue
      }
      worldVerts[i * 3] = v0.x
      worldVerts[i * 3 + 1] = v0.y
      worldVerts[i * 3 + 2] = v0.z
      meshBox.expandByPoint(v0)
    }
    if (meshBox.isEmpty()) return
    overall.union(meshBox)
    const flipWinding = typed.matrixWorld.determinant() < 0
    const idx = typed.geometry.index
    const triCount = Math.floor((idx ? idx.count : pos.count) / 3)
    const multiMat = Array.isArray(typed.material) && typed.geometry.groups.length > 0
    const singleKey = multiMat ? '' : appearanceForVertex(typed, 0)
    const meshTris: WorldTri[] = []
    for (let t = 0; t < triCount; t++) {
      const appearanceKey = multiMat ? appearanceForVertex(typed, t * 3) : singleKey
      const i0 = idx ? idx.getX(t * 3) : t * 3
      const i1 = idx ? idx.getX(t * 3 + (flipWinding ? 2 : 1)) : t * 3 + (flipWinding ? 2 : 1)
      const i2 = idx ? idx.getX(t * 3 + (flipWinding ? 1 : 2)) : t * 3 + (flipWinding ? 1 : 2)
      const ax = worldVerts[i0 * 3] ?? 0, ay = worldVerts[i0 * 3 + 1] ?? 0, az = worldVerts[i0 * 3 + 2] ?? 0
      const bx = worldVerts[i1 * 3] ?? 0, by = worldVerts[i1 * 3 + 1] ?? 0, bz = worldVerts[i1 * 3 + 2] ?? 0
      const cx = worldVerts[i2 * 3] ?? 0, cy = worldVerts[i2 * 3 + 1] ?? 0, cz = worldVerts[i2 * 3 + 2] ?? 0
      v0.set(bx - ax, by - ay, bz - az)
      v1.set(cx - ax, cy - ay, cz - az)
      v2.crossVectors(v0, v1)
      const mag = v2.length()
      if (mag < 1e-7) continue
      const area = mag * 0.5
      const nx = v2.x / mag, ny = v2.y / mag, nz = v2.z / mag
      if (nx > 0) posX += nx * area; else negX += -nx * area
      if (ny > 0) posY += ny * area; else negY += -ny * area
      if (nz > 0) posZ += nz * area; else negZ += -nz * area
      const tri: WorldTri = {
        meshIndex: index,
        appearanceKey,
        ax, ay, az, bx, by, bz, cx, cy, cz,
        nx, ny, nz,
        d: nx * ax + ny * ay + nz * az,
        area,
        minX: Math.min(ax, bx, cx), minY: Math.min(ay, by, cy), minZ: Math.min(az, bz, cz),
        maxX: Math.max(ax, bx, cx), maxY: Math.max(ay, by, cy), maxZ: Math.max(az, bz, cz),
      }
      meshTris.push(tri)
      allTris.push(tri)
    }
    records.push({ index, name: label, box: meshBox, tris: meshTris })
  })

  const maxX = Math.max(posX, negX)
  return {
    meshCount: records.length,
    nonFiniteVertices,
    doubleSidedMeshes,
    materialIssues,
    minY: overall.isEmpty() ? NaN : overall.min.y,
    maxY: overall.isEmpty() ? NaN : overall.max.y,
    bottomToTopRatio: posY > 0 ? negY / posY : 0,
    backToFrontRatio: posZ > 0 ? negZ / posZ : 0,
    leftRightBalance: maxX > 0 ? Math.min(posX, negX) / maxX : 0,
    floatingComponents: findFloatingComponents(records, overall),
    exposedZFightPairs: findExposedZFighting(records, allTris),
    rotatingRigOverlaps: findRotatingRigSolidOverlaps(root, rotatingPartNames),
  }
}
