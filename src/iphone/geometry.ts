import * as THREE from 'three';

/**
 * Small geometry toolkit for the phone. Everything is built from explicit
 * millimetre dimensions — no CSG, no imported meshes — so each part's size is
 * readable at the call site and the whole model is deterministic.
 */

/** Rounded rectangle as a 2D shape, centred on the given point. */
export function roundedShape(
  width: number,
  height: number,
  radius: number,
  centreX = 0,
  centreY = 0,
): THREE.Shape {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const r = Math.max(0.01, Math.min(radius, halfWidth, halfHeight));
  const shape = new THREE.Shape();
  shape.moveTo(centreX + halfWidth, centreY + halfHeight - r);
  shape.lineTo(centreX + halfWidth, centreY - halfHeight + r);
  shape.absarc(centreX + halfWidth - r, centreY - halfHeight + r, r, 0, -Math.PI / 2, true);
  shape.lineTo(centreX - halfWidth + r, centreY - halfHeight);
  shape.absarc(centreX - halfWidth + r, centreY - halfHeight + r, r, -Math.PI / 2, -Math.PI, true);
  shape.lineTo(centreX - halfWidth, centreY + halfHeight - r);
  shape.absarc(centreX - halfWidth + r, centreY + halfHeight - r, r, Math.PI, Math.PI / 2, true);
  shape.lineTo(centreX + halfWidth - r, centreY + halfHeight);
  shape.absarc(centreX + halfWidth - r, centreY + halfHeight - r, r, Math.PI / 2, 0, true);
  shape.closePath();
  return shape;
}

/** Rounded rectangle as a hole, wound the opposite way so triangulation keeps
 *  it empty. */
export function roundedHole(
  width: number,
  height: number,
  radius: number,
  centreX = 0,
  centreY = 0,
): THREE.Path {
  const path = new THREE.Path();
  path.setFromPoints(roundedShape(width, height, radius, centreX, centreY).getPoints(10).reverse());
  path.closePath();
  return path;
}

interface SlabOptions {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  /** The slab's largest Z. The slab grows towards -Z from here, so a part on
   *  the back of the phone — the side that faces -Z — passes its *inner*
   *  plane, the one against the body. */
  readonly maxZ: number;
  readonly thickness: number;
  readonly bevel: number;
  readonly centreX?: number;
  readonly centreY?: number;
  /** A cut-out crossing the bottom edge: the USB-C port opening. `edge` is the
   *  local Y of the shape's bottom edge, so the hole is positioned relative to
   *  it rather than to the shape's centre. */
  readonly slot?: {
    readonly width: number;
    readonly depth: number;
    readonly radius: number;
    readonly edge: number;
  };
  /** Circular bores cut clean through the slab. Without these the slab is a
   *  solid block, and a lens assembly placed on it is embedded in aluminum
   *  instead of visible through an opening. */
  readonly bores?: ReadonlyArray<{ readonly x: number; readonly y: number; readonly radius: number }>;
}

/** Bounding box of a geometry's position attribute. */
function boundsOf(geometry: THREE.BufferGeometry): THREE.Box3 {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box === null) throw new Error('geometry has no bounding box');
  return box;
}

/**
 * A rounded-rect slab extruded along Z with a beveled rim, so it reads as a
 * milled part rather than a box.
 *
 * `maxZ` is guaranteed to be the slab's largest Z and `maxZ - thickness` its
 * smallest, exactly. Getting that guarantee is the whole point of this
 * function: a beveled extrusion comes out `2 * bevelSize` thinner than its
 * nominal depth, so the naive version left every flush part — frame, cover
 * glass, back panel — coplanar with its neighbour instead of stacked, and the
 * z-fighting showed up as banding across the screen.
 *
 * The bevel is applied *outside* the shape handed in: the end faces are that
 * outline and the middle of the slab stands `bevel` further out in X and Y
 * (measured: a 10 mm shape with `bevel: 1` spans ±6.0). A part that has to end
 * up on the body's wall therefore passes an outline pre-shrunk by `bevel` — see
 * `RAIL` in `dims.ts`, which is where that wall is written down.
 */
export function slabGeometry(options: SlabOptions): THREE.ExtrudeGeometry {
  const shape = roundedShape(
    options.width,
    options.height,
    options.radius,
    options.centreX ?? 0,
    options.centreY ?? 0,
  );
  if (options.slot !== undefined) {
    // Only the top part of the hole crosses the shape; the rest runs out
    // through the bottom edge and is discarded by the triangulator, which is
    // what turns a rounded rectangle into an edge notch.
    shape.holes.push(
      roundedHole(
        options.slot.width,
        options.slot.depth,
        options.slot.radius,
        options.centreX ?? 0,
        options.slot.edge + options.slot.depth / 2,
      ),
    );
  }
  for (const bore of options.bores ?? []) {
    const hole = new THREE.Path();
    hole.absarc(bore.x, bore.y, bore.radius, 0, Math.PI * 2, true);
    hole.closePath();
    shape.holes.push(hole);
  }
  const bevel = Math.max(0.001, Math.min(options.bevel, options.thickness / 2 - 0.001));
  // Pre-compensate for the bevel's shrink, then snap to the requested extent.
  const depth = Math.max(0.001, options.thickness - 2 * bevel);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth + 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 3,
    curveSegments: 16,
  });
  const box = boundsOf(geometry);
  const scale = (box.max.z - box.min.z) / options.thickness;
  geometry.translate(0, 0, -box.min.z);
  geometry.scale(1, 1, 1 / scale);
  geometry.translate(0, 0, options.maxZ - options.thickness);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A thin ribbon stretched across a run of an edge contour: the antenna band.
 *
 * The previous round laid a rounded box across each corner, and because a box
 * has no idea the body is a rounded rectangle, its outer corners stood up to a
 * millimetre past the silhouette as pale slabs. Sampling the contour instead
 * costs a handful of triangles and cannot leave the outline.
 */
export function contourPatchGeometry(
  contour: ReadonlyArray<THREE.Vector2>,
  zNear: number,
  zFar: number,
): THREE.BufferGeometry {
  const count = contour.length;
  const positions = new Float32Array(count * 2 * 3);
  for (let index = 0; index < count; index += 1) {
    const point = contour[index];
    if (point === undefined) continue;
    positions.set([point.x, point.y, zNear], index * 6);
    positions.set([point.x, point.y, zFar], index * 6 + 3);
  }
  const indices: number[] = [];
  for (let index = 0; index < count - 1; index += 1) {
    const a = index * 2;
    indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Rounded rectangular prism laid out by explicit min/max corners. */export function blockGeometry(
  min: readonly [number, number, number],
  max: readonly [number, number, number],
  radius: number,
  segments = 2,
): THREE.BufferGeometry {
  const width = max[0] - min[0];
  const height = max[1] - min[1];
  const depth = max[2] - min[2];
  const geometry = new THREE.BoxGeometry(width, height, depth, segments, segments, segments);
  roundBoxVertices(
    geometry,
    width / 2,
    height / 2,
    depth / 2,
    Math.max(0.001, Math.min(radius, width / 2, height / 2, depth / 2)),
  );
  geometry.translate(min[0] + width / 2, min[1] + height / 2, min[2] + depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** Rounds a segmented box by pushing each vertex out to the corner sphere.
 *  Cheaper than CSG and exact enough for pills and cavities. */
function roundBoxVertices(
  geometry: THREE.BoxGeometry,
  halfX: number,
  halfY: number,
  halfZ: number,
  radius: number,
): void {
  const position = geometry.getAttribute('position');
  const innerX = Math.max(halfX - radius, 0);
  const innerY = Math.max(halfY - radius, 0);
  const innerZ = Math.max(halfZ - radius, 0);
  const offset = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    offset.set(
      Math.sign(x) * Math.max(Math.abs(x) - innerX, 0),
      Math.sign(y) * Math.max(Math.abs(y) - innerY, 0),
      Math.sign(z) * Math.max(Math.abs(z) - innerZ, 0),
    );
    const length = offset.length();
    if (length === 0) continue;
    offset.multiplyScalar(radius / length);
    position.setXYZ(
      index,
      Math.sign(x) * innerX + offset.x,
      Math.sign(y) * innerY + offset.y,
      Math.sign(z) * innerZ + offset.z,
    );
  }
  position.needsUpdate = true;
}

/** Cylinder whose axis points along Z: lens and window parts on the back. */
export function lensDisc(radius: number, thickness: number, z: number): THREE.CylinderGeometry {
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, 48, 1);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, z);
  return geometry;
}

/** Flat rounded-rect disc facing +Z: the Dynamic Island and port shapes. */
export function backPlateGeometry(
  width: number,
  height: number,
  radius: number,
  thickness: number,
  z: number,
): THREE.ExtrudeGeometry {
  return slabGeometry({
    width,
    height,
    radius,
    maxZ: z,
    thickness,
    bevel: Math.min(0.05, thickness / 3),
  });
}

/**
 * A shallow, nearly flat dome facing +Z: the lens element itself. Its rim sits
 * on `baseZ` and its crown stands `rise` proud of it, and `skirt` is how far
 * the wall behind the rim reaches back. It only has to close the cap against a
 * grazing view; running it the whole sphere radius deep hangs a bright column
 * down the barrel, which is what a steep view into the lens showed.
 *
 * The sphere is solved from `radius` and `rise` rather than passed in, because
 * those two are the whole part: a cap of radius r and height h lies on a sphere
 * of `(r² + h²) / 2h`. An earlier version took the sphere and a `rise` that did
 * not solve to it, which put the cap's rim 0.653 mm *below* its own base plane
 * and then folded the skirt back up through the cap — a self-intersecting
 * crease around every lens rim. That crease is the notch that showed at 6
 * o'clock on each ring and the ridge inside each bore.
 */
export function domeGeometry(
  radius: number,
  rise: number,
  baseZ: number,
  segments = 56,
  skirt = radius,
): THREE.LatheGeometry {
  const sphere = capSphere(radius, rise);
  const alphaMax = Math.asin(Math.min(1, radius / sphere));
  /** The cap's surface: the pole at the crown, the rim exactly on `baseZ`. */
  const at = (alpha: number): THREE.Vector2 =>
    new THREE.Vector2(sphere * Math.sin(alpha), sphere * (Math.cos(alpha) - Math.cos(alphaMax)));
  const profile: THREE.Vector2[] = [];
  const steps = 22;
  for (let index = 0; index <= steps; index += 1) {
    profile.push(at((alphaMax * index) / steps));
  }
  profile.push(new THREE.Vector2(radius, -skirt));
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, baseZ);
  return geometry;
}

/** The sphere a cap of `radius` rises `rise` on: `h = r² / 2R` solved for R. */
export function capSphere(radius: number, rise: number): number {
  return (radius * radius + rise * rise) / (2 * Math.max(rise, 0.001));
}

/** How far a sphere of `sphere` stands above its own rim at the chord
 *  `radius` — the rise a parallel cap offset by a fixed amount has to use. */
export function capRise(radius: number, sphere: number): number {
  return sphere - Math.sqrt(Math.max(0, sphere * sphere - radius * radius));
}

/**
 * A surface of revolution about the Z axis from an explicit `[radius, z]`
 * profile. This is how a cavity is built: one continuous profile from the mouth
 * down the wall, across the shoulder and into the floor, so no two of its
 * surfaces can ever share a radius. Stacking a tube, a floor disc and two step
 * rings instead put four surfaces on the same radius and lit the seams between
 * them, which is what the closeup showed as concentric ridges inside every
 * lens.
 *
 * The winding is whatever the profile order gives; the interiors that use this
 * are drawn double sided.
 */
export function profileLathe(
  profile: ReadonlyArray<readonly [number, number]>,
  segments = 96,
): THREE.LatheGeometry {
  const geometry = new THREE.LatheGeometry(
    profile.map(([radius, z]) => new THREE.Vector2(radius, z)),
    segments,
  );
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/**
 * A polished ring about the Z axis: a lathe profile that runs from the bore
 * radius out to `outerRadius` and down `neck`, closed by an inner wall so it
 * never reads as a paper-thin washer.
 *
 * The crown slopes down towards the rim rather than sitting flat, because the
 * flat version faced exactly along the lens axis and reflected nothing but the
 * dark backdrop — a polished ring that reads as a black hole. The slope lands
 * on an outer wall `neck` tall, which defaults to a third of the height. The
 * outward normals are verified rather than assumed: the lathe's winding
 * depends on how the profile is traversed, and a ring with inward normals
 * renders black.
 */
export function ringGeometry(
  outerRadius: number,
  boreRadius: number,
  height: number,
  neck = height * 0.35,
  segments = 72,
): THREE.LatheGeometry {
  const crown = height / 2;
  const rim = -height / 2 + Math.min(Math.max(neck, 0.05), height * 0.9);
  const profile = [
    new THREE.Vector2(boreRadius, crown),
    new THREE.Vector2(outerRadius, rim),
    new THREE.Vector2(outerRadius, -height / 2),
    new THREE.Vector2(boreRadius, -height / 2),
    new THREE.Vector2(boreRadius, crown),
  ];
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.rotateX(Math.PI / 2);
  const normals = geometry.getAttribute('normal');
  if (!facesOutward(geometry, normals)) flipWinding(geometry);
  return geometry;
}

/** True when the ring's vertex normals point away from its own axis. */
function facesOutward(
  geometry: THREE.BufferGeometry,
  normals: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
): boolean {
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const radius = Math.hypot(x, y);
    // Only the outer wall is unambiguous about which way "out" is.
    if (radius < 1) continue;
    const radial = (normals.getX(index) * x + normals.getY(index) * y) / radius;
    if (radial > 0.2) return true;
    if (radial < -0.2) return false;
  }
  return true;
}

/** Reverses triangle winding and rebuilds normals, so a lathe that came out
 *  inside-out is fixed instead of rendered as a black silhouette. */
function flipWinding(geometry: THREE.BufferGeometry): void {
  geometry.index?.array.reverse();
  geometry.deleteAttribute('normal');
  geometry.computeVertexNormals();
}

/** Cylinder whose axis points down -Y: bores in the top and bottom edges. */
export function boreGeometry(radius: number, depth: number, radialSegments = 12): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(radius, radius, depth, radialSegments, 1);
}

/** Adds a mesh and tags it with the material key so a later swap can restore
 *  the right material without relying on traversal order. */
export function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  label: string,
  materialKey: string,
  castShadow = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = label;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = castShadow;
  mesh.userData['material'] = materialKey;
  parent.add(mesh);
  return mesh;
}
