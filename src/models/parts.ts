import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { formedShell } from './hd-geometry'
import type { Recipe } from '../data/recipe'

export type Point = [number, number, number]
type Dimension = [number, number, number]
export type Finish = ReturnType<typeof finishes>

const hdMaterials = new WeakSet<T.Material>()

export function finishes(recipe: Recipe) {
  const hd = recipe.quality === 'hd'
  function paint(name: string, color: string, metalness = 0.18, roughness = 0.52) {
    const coated = name.includes('paint') || name === 'Optical glass'
    const material = hd
      ? new T.MeshPhysicalMaterial({
        name, color, metalness, roughness: roughness * (coated ? 0.76 : 0.93),
        clearcoat: coated ? 0.38 : 0, clearcoatRoughness: 0.26,
      })
      : new T.MeshStandardMaterial({ name, color, metalness, roughness, flatShading: true })
    if (hd) hdMaterials.add(material)
    return material
  }
  const optic = paint('Optical glass', '#3e878e', 0.42, 0.19)
  optic.emissive.set('#0f434a')
  return {
    hd, primary: paint('Primary paint', recipe.primary),
    accent: paint('Trim paint', recipe.accent),
    dark: paint('Graphite chassis', '#2d3336', 0.32),
    tire: paint('Rubber', '#25282a', 0.03, 0.87),
    inset: paint('Insets', '#161c20', 0.08),
    alloy: paint('Satin alloy', '#9aaba9', 0.54),
    edge: paint('Machined edge', '#59676a', 0.46),
    stencil: paint('Ivory marking', '#f3efdb', 0.05),
    optic,
  }
}

export function group(parent: T.Object3D, name: string, at: Point = [0, 0, 0]) {
  const part = new T.Group()
  part.name = name
  part.position.set(...at)
  parent.add(part)
  return part
}

export function mesh(parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material, at: Point) {
  const part = new T.Mesh(geometry, material)
  part.position.set(...at)
  part.castShadow = true
  part.receiveShadow = true
  parent.add(part)
  return part
}

export function box(parent: T.Object3D, at: Point, size: Dimension, color: T.Material) {
  const thin = Math.min(...size)
  const geometry = hdMaterials.has(color) && thin >= 0.045
    ? new RoundedBoxGeometry(...size, 1, Math.min(0.016, thin * 0.16))
    : new T.BoxGeometry(...size)
  return mesh(parent, geometry, color, at)
}

// A bevelled, clipped-corner shell with a flat top for panelwork.
export function shell(parent: T.Object3D, at: Point, size: Dimension, color: T.Material, cut = 0.16) {
  if (hdMaterials.has(color)) return mesh(parent, formedShell(...size, cut), color, at)
  const [width, height, length] = size
  const x = width * 0.5, z = length * 0.5
  const c = Math.min(x, z) * cut
  const b = Math.min(height * 0.19, x * 0.24, z * 0.24)
  const vertices: number[] = []
  const indices: number[] = []
  for (const [y, inset] of [[-height / 2, b], [-height / 2 + b, 0], [height / 2 - b, 0], [height / 2, b]] as const) {
    const w = x - inset, d = z - inset
    const k = Math.min(c, w * 0.6, d * 0.6)
    for (const [px, pz] of [[-w + k, d], [w - k, d], [w, d - k], [w, -d + k], [w - k, -d], [-w + k, -d], [-w, -d + k], [-w, d - k]] as const) {
      vertices.push(px, y, pz)
    }
  }
  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8
    for (let level = 0; level < 3; level++) {
      const a = level * 8 + i, b0 = level * 8 + next
      indices.push(a, b0, a + 8, a + 8, b0, b0 + 8)
    }
  }
  for (let i = 1; i < 7; i++) indices.push(0, i + 1, i, 24, 24 + i, 25 + i)
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  const faceted = geometry.toNonIndexed()
  geometry.dispose()
  faceted.computeVertexNormals()
  return mesh(parent, faceted, color, at)
}

export function tube(parent: T.Object3D, at: Point, top: number, bottom: number, height: number, color: T.Material, sides = 12) {
  return mesh(parent, new T.CylinderGeometry(top, bottom, height, hdMaterials.has(color) && sides > 8 ? sides * 3 : sides), color, at)
}

export function strut(parent: T.Object3D, a: Point, b: Point, radius: number, color: T.Material, sides = 8) {
  const start = new T.Vector3(...a), end = new T.Vector3(...b)
  const direction = end.clone().sub(start)
  const part = tube(parent, [0, 0, 0], radius, radius, direction.length(), color, sides)
  part.position.copy(start.add(end).multiplyScalar(0.5))
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize())
  return part
}

export function light(parent: T.Object3D, at: Point, size: Dimension, paint: Finish) {
  box(parent, at, size, paint.inset)
  const [x, y, z] = at
  box(parent, [x, y, z + size[2] * 0.52], [size[0] * 0.77, size[1] * 0.53, 0.012], paint.stencil)
}

export function ring(parent: T.Object3D, at: Point, radius: number, thickness: number, height: number, color: T.Material) {
  const profile = [
    new T.Vector2(radius - thickness, -height / 2),
    new T.Vector2(radius - thickness, height / 2),
    new T.Vector2(radius - 0.015, height / 2),
    new T.Vector2(radius, height / 2 - 0.012),
    new T.Vector2(radius, -height / 2 + 0.012),
    new T.Vector2(radius - 0.015, -height / 2),
    new T.Vector2(radius - thickness, -height / 2),
  ].reverse()
  const geometry = new T.LatheGeometry(profile, hdMaterials.has(color) ? 80 : 24)
  geometry.normalizeNormals()
  return mesh(parent, geometry, color, at)
}

export function rotationTrack(node: string, axis: 'x' | 'y' | 'z', times: number[], radians: number[]) {
  const vector = new T.Vector3()
  vector[axis] = 1
  const values = radians.flatMap(value => new T.Quaternion().setFromAxisAngle(vector, value).toArray())
  return new T.QuaternionKeyframeTrack(node + '.quaternion', times, values)
}

export function spinTrack(node: string, axis: 'x' | 'y' | 'z', duration: number, turns = 1) {
  const steps = Math.max(8, 8 * Math.abs(turns))
  const phases = Array.from({ length: steps + 1 }, (_, i) => i / steps)
  return rotationTrack(node, axis, phases.map(t => t * duration), phases.map(t => t * Math.PI * 2 * turns))
}

export function motion(node: string, duration: number, heights: number[]) {
  const times = heights.map((_, i) => duration * i / (heights.length - 1))
  return new T.VectorKeyframeTrack(node + '.position', times, heights.flatMap(height => [0, height, 0]))
}
