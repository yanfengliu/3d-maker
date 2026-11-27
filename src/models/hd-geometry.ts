import * as T from 'three'

// A rounded chamfer at every corner, with six cross-sections around each edge
// break. Separate end caps keep the large painted panels optically flat.
export function formedShell(width: number, height: number, depth: number, cut: number) {
  const halfWidth = width / 2, halfHeight = height / 2, halfDepth = depth / 2
  const edge = Math.min(height * 0.3, width * 0.09, depth * 0.09)
  const perimeter = (inset: number) => {
    const w = halfWidth - inset, d = halfDepth - inset
    const chamfer = Math.min(w, d) * cut
    const corners = [
      new T.Vector2(-w + chamfer, d), new T.Vector2(w - chamfer, d),
      new T.Vector2(w, d - chamfer), new T.Vector2(w, -d + chamfer),
      new T.Vector2(w - chamfer, -d), new T.Vector2(-w + chamfer, -d),
      new T.Vector2(-w, -d + chamfer), new T.Vector2(-w, d - chamfer),
    ]
    return corners.flatMap((corner, i) => {
      const before = corners[(i + 7) % 8]
      const after = corners[(i + 1) % 8]
      if (!before || !after) throw new Error('Invalid shell profile')
      const fillet = Math.min(w * 0.22, d * 0.22, corner.distanceTo(before) * 0.35, corner.distanceTo(after) * 0.35)
      const a = before.clone().sub(corner).normalize().multiplyScalar(fillet).add(corner)
      const b = after.clone().sub(corner).normalize().multiplyScalar(fillet).add(corner)
      return new T.QuadraticBezierCurve(a, corner, b).getPoints(3)
    })
  }
  const section: [number, number][] = []
  for (let i = 4; i >= 0; i--) {
    const a = Math.PI * i / 8
    section.push([-halfHeight + edge - edge * Math.sin(a), edge * (1 - Math.cos(a))])
  }
  for (let i = 0; i <= 4; i++) {
    const a = Math.PI * i / 8
    section.push([halfHeight - edge + edge * Math.sin(a), edge * (1 - Math.cos(a))])
  }
  const vertices: number[] = [], indices: number[] = []
  const count = 32
  for (const [y, inset] of section) for (const point of perimeter(inset)) vertices.push(point.x, y, point.y)
  for (let row = 0; row < section.length - 1; row++) {
    for (let i = 0; i < count; i++) {
      const a = row * count + i, b = row * count + (i + 1) % count
      indices.push(a, b, a + count, a + count, b, b + count)
    }
  }
  for (const sign of [-1, 1]) {
    const center = vertices.length / 3
    vertices.push(0, sign * halfHeight, 0)
    for (const point of perimeter(edge)) vertices.push(point.x, sign * halfHeight, point.y)
    for (let i = 0; i < count; i++) {
      const a = center + 1 + i, b = center + 1 + (i + 1) % count
      indices.push(center, sign > 0 ? a : b, sign > 0 ? b : a)
    }
  }
  const geometry = new T.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}

// Cross sections taper and twist along the span. The broad face catches light
// as the motor turns. The root remains buried in the rotating hub.
export function airfoil() {
  const positions: number[] = [], indices: number[] = []
  const rings = 14, slices = 12
  for (let i = 0; i <= rings; i++) {
    const t = i / rings
    const chord = (0.057 + 0.036 * Math.sin(t * Math.PI)) * (1 - 0.7 * t ** 8)
    const sweep = 0.076 * t ** 1.7
    const pitch = 0.47 - 0.32 * t
    for (let j = 0; j < slices; j++) {
      const a = 2 * Math.PI * j / slices
      const z = chord * Math.cos(a), y = 0.012 * Math.sin(a) * (1 - 0.53 * t)
      positions.push(0.06 + t * 0.501, 0.022 + y * Math.cos(pitch) - z * Math.sin(pitch), -sweep + z * Math.cos(pitch) + y * Math.sin(pitch))
      if (i < rings) {
        const n = i * slices + j, next = i * slices + (j + 1) % slices
        indices.push(n, n + slices, next, next, n + slices, next + slices)
      }
    }
  }
  for (let j = 1; j < slices - 1; j++) indices.push(rings * slices, rings * slices + j + 1, rings * slices + j)
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
