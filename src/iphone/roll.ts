import * as THREE from 'three';

/**
 * Measurements `plateau.test.ts` takes off the built geometry: a planar
 * cross-section through a mesh, and the roll band's own profile.
 *
 * They live here rather than in the test file because each is a real
 * intersection calculation rather than an assertion. The cross-section exists
 * to measure a *surface* rather than a bounding box: a box around the roll band
 * reports the roll's rise and nothing about its shape, and a vertical wall and
 * a forged roll have the same box. That is the whole point of the shoulder
 * gate, so it may not measure a box.
 */

/**
 * Every point where a plane with normal `axis`, at `at`, crosses any mesh below
 * `object` — in the object's own space. Triangles are intersected edge by edge,
 * so the result carries a point wherever the surface crosses the plane, not
 * just where the mesh happens to have a vertex.
 */
export function slicePoints(
  object: THREE.Object3D,
  axis: 'x' | 'y' | 'z',
  at: number,
  quantum = 0.01,
): THREE.Vector3[] {
  object.updateWorldMatrix(true, true);
  const unique = new Map<string, THREE.Vector3>();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();

  const crossing = (from: THREE.Vector3, to: THREE.Vector3, out: THREE.Vector3): boolean => {
    const df = from[axis] - at;
    const dt = to[axis] - at;
    if (df === 0 && dt === 0) return false;
    if ((df > 0 && dt > 0) || (df < 0 && dt < 0)) return false;
    out.lerpVectors(from, to, Math.abs(df) / (Math.abs(df) + Math.abs(dt)));
    return true;
  };

  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    // `Mesh`'s own type arguments default to `any`, so the geometry and its
    // attributes are narrowed off `unknown` rather than reached through an
    // `any` at every use below.
    const geometry: unknown = node.geometry;
    if (!(geometry instanceof THREE.BufferGeometry)) return;
    const attribute: unknown = geometry.getAttribute('position');
    if (!(attribute instanceof THREE.BufferAttribute)) return;
    const rawIndex: unknown = geometry.getIndex();
    const index = rawIndex instanceof THREE.BufferAttribute ? rawIndex : null;
    const triangles = index === null ? attribute.count / 3 : index.count / 3;
    const read = (slot: number, out: THREE.Vector3): THREE.Vector3 => {
      const vertex = index === null ? slot : index.getX(slot);
      return out.fromBufferAttribute(attribute, vertex).applyMatrix4(node.matrixWorld);
    };
    const point = new THREE.Vector3();
    for (let triangle = 0; triangle < triangles; triangle += 1) {
      read(triangle * 3, a);
      read(triangle * 3 + 1, b);
      read(triangle * 3 + 2, c);
      for (const [from, to] of [
        [a, b],
        [b, c],
        [c, a],
      ] as const) {
        if (!crossing(from, to, point)) continue;
        point[axis] = at;
        const key = `${(point.x / quantum).toFixed(0)},${(point.y / quantum).toFixed(0)},${(point.z / quantum).toFixed(0)}`;
        if (!unique.has(key)) unique.set(key, point.clone());
      }
    }
  });
  return [...unique.values()];
}

/**
 * The roll band's own profile: the average of the band's points at one
 * perimeter sample and the samples either side of it, one per level of the
 * sweep. This is the surface the shoulder gate measures — the surface a slab
 * cannot bend.
 *
 * `points` is how many vertices one level of the sweep holds; `at` reads vertex
 * `index` into `out`. Reading through a callback rather than an attribute is
 * deliberate: three types `getAttribute` as `any`, and the strict lint config
 * refuses it, so the narrowing lives at the call site next to the geometry it
 * belongs to.
 */
export function rollProfile(
  at: (index: number, out: THREE.Vector3) => THREE.Vector3,
  count: number,
  levels: number,
  index: number,
  neighbours = 2,
): THREE.Vector3[] {
  const profile: THREE.Vector3[] = [];
  for (let level = 0; level < levels; level += 1) {
    const point = new THREE.Vector3();
    for (let offset = -neighbours; offset <= neighbours; offset += 1) {
      const sample = (index + offset + count) % count;
      point.add(at(level * count + sample, new THREE.Vector3()));
    }
    // Cloned: a profile is a list of twelve *different* points, and pushing one
    // vector twelve times hands back a list where every entry is the last.
    profile.push(point.divideScalar(2 * neighbours + 1).clone());
  }
  return profile;
}

/**
 * The tallest vertical wall in a swept profile: how far apart in Z two of its
 * levels sit while staying within `slide` of each other in the plane. A curved
 * roll keeps this near zero; a slab's wall walks the whole bar's thickness.
 *
 * Every pair is compared, not each level with its neighbour. A wall's own
 * consecutive levels sit in the same place and at the same height — the pair
 * that carries the wall is the two that straddle the chamfer, and those can be
 * many levels apart.
 */
export function tallestWallSegment(profile: readonly { x: number; y: number; z: number }[], slide: number): number {
  let tallest = 0;
  for (let a = 0; a < profile.length; a += 1) {
    for (let b = a + 1; b < profile.length; b += 1) {
      const one = profile[a];
      const other = profile[b];
      if (one === undefined || other === undefined) continue;
      if (Math.hypot(other.x - one.x, other.y - one.y) > slide) continue;
      tallest = Math.max(tallest, Math.abs(other.z - one.z));
    }
  }
  return tallest;
}
