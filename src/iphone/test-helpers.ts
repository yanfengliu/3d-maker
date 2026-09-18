import * as THREE from 'three';
import { expect } from 'vitest';

import { RAIL } from './dims.js';
import type { PhoneMaterials } from './materials.js';

/**
 * The measurements the iPhone test files share: `parts.test.ts` (the edge and
 * Z-plane contracts, and the MagSafe ring), `port.test.ts` (the USB-C gates),
 * `plateau.test.ts` (the forged roll) and `logo.test.ts` (the inlay's placement
 * on the built back, which needs the built panel the same way).
 *
 * They live here rather than in one test file because those files measure the
 * same surfaces the same way, and a copy per file would let one of them drift
 * from the others while all of them stayed green.
 *
 * Nothing in the app imports this module — only `*.test.ts` files do — so it is
 * not reachable from either page's entry point and never reaches the bundle.
 * `parts.ts` in particular must not import it: these are test fixtures, not
 * model code.
 */

/** The rail outline's distance from a point: `RAIL.radius` on the flat of an
 *  edge, more around the corners. */
export function railReach(x: number, y: number): number {
  const dx = Math.max(Math.abs(x) - RAIL.centreX, 0);
  const dy = Math.max(Math.abs(y) - RAIL.centreY, 0);
  return Math.hypot(dx, dy);
}

export interface RailProfile {
  /** How far the furthest vertex reaches *past* the rail outline. */
  readonly overhang: number;
  /** How far the nearest vertex stops *short* of it. */
  readonly closest: number;
}

/** Measures every vertex of an assembly in body space, which is the space
 *  `RAIL` is written in. */
export function railProfile(object: THREE.Object3D): RailProfile {
  object.updateWorldMatrix(true, true);
  const point = new THREE.Vector3();
  let overhang = -Infinity;
  let closest = Infinity;
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const attribute: unknown = (node.geometry as THREE.BufferGeometry).getAttribute('position');
    if (!(attribute instanceof THREE.BufferAttribute)) return;
    for (let index = 0; index < attribute.count; index += 1) {
      point.fromBufferAttribute(attribute, index).applyMatrix4(node.matrixWorld);
      const reach = railReach(point.x, point.y) - RAIL.radius;
      overhang = Math.max(overhang, reach);
      closest = Math.min(closest, reach);
    }
  });
  return { overhang, closest };
}

/**
 * How far an edge part may sit off the rail in either direction: out, where it
 * floats with nothing behind it, or in, where it is buried and invisible. The
 * antenna ribbon is a surface lying on the rail rather than a solid seated in
 * it, and its documented stand-off is 0.02 mm, so a few hundredths is the most
 * either direction can be out.
 */
export const ATTACHED_SLACK = 0.05;

/**
 * How much a measured vertex may sit past a bound it meets exactly. Two things
 * contribute, and neither is the model: vertex positions are stored as 32-bit
 * floats, so a 36 mm coordinate lands up to ~4 µm from its decimal value, and
 * the extruded corner arc is a polygon whose offset facets can poke a
 * ten-thousandth of a millimetre past the ideal circle. Both are three orders
 * of magnitude below the 0.36 mm drift this gate exists to catch.
 */
export const VERTEX_SLACK = 0.01;

/**
 * Stand-ins for the real materials: the parts only ever store the instance,
 * and the real set needs a canvas and a WebGL context a node test has not got.
 * An object literal rather than a Proxy, so a part asking for a key the
 * interface does not have is a compile error here instead of a silent fallback.
 */
export function stubMaterials(): PhoneMaterials {
  const basic = new THREE.MeshBasicMaterial();
  const physical = basic as unknown as THREE.MeshPhysicalMaterial;
  return {
    aluminum: physical,
    backGlass: physical,
    tongue: physical,
    frontGlass: physical,
    screen: physical,
    island: physical,
    lensRing: physical,
    lensPupil: physical,
    lensGlass: physical,
    aperture: physical,
    flash: physical,
    darkGlass: physical,
    sapphire: physical,
    button: physical,
    seam: basic as unknown as THREE.MeshStandardMaterial,
    antenna: basic as unknown as THREE.MeshStandardMaterial,
    bore: basic as unknown as THREE.MeshStandardMaterial,
    logo: physical,
    mmwave: physical,
    magsafe: physical,
    glow: basic as unknown as THREE.SpriteMaterial,
  };
}

/** One stub set for every test file's builders to share. */
export const materials = stubMaterials();

/** A named descendant of an assembly, or a thrown error naming the miss. */
export function required(parent: THREE.Object3D, name: string): THREE.Object3D {
  const found = parent.getObjectByName(name);
  if (found === undefined) throw new Error(`the built model has no part named "${name}"`);
  return found;
}

/** How deep a point is inside a closed mesh, looking along `direction`: the
 *  distance from the mesh's own surface to the point, or 0 when the point is
 *  outside it. The ray is cast from outside, through the point, and its
 *  crossings are counted — a ray that *starts* inside a solid only meets the
 *  back of the wall on its way out, and three's raycaster reports front faces
 *  only, so an inside-out ray comes back empty and reads as "outside". */
export function insideDepth(
  mesh: THREE.Object3D,
  point: THREE.Vector3,
  direction: THREE.Vector3,
  reach = 100,
): number {
  const from = point.clone().addScaledVector(direction, reach);
  const caster = new THREE.Raycaster(from, direction.clone().negate());
  const crossings = caster
    .intersectObject(mesh, false)
    .filter((hit) => hit.distance < reach - 1e-6);
  if (crossings.length % 2 === 0) return 0;
  const last = crossings[crossings.length - 1];
  return last === undefined ? 0 : reach - last.distance;
}

/** Every point of a mesh's position attribute, in the mesh's own space. The
 *  geometry is narrowed off `unknown` rather than reached through three's
 *  `any`-typed `getAttribute`, which is what the strict lint rules require. */
export function eachVertex(
  object: THREE.Object3D,
  visit: (x: number, y: number, z: number) => void,
): void {
  if (!(object instanceof THREE.Mesh)) throw new Error('the part is not a mesh');
  const geometry: unknown = object.geometry;
  if (!(geometry instanceof THREE.BufferGeometry)) throw new Error('the mesh has no geometry');
  const attribute: unknown = geometry.getAttribute('position');
  if (!(attribute instanceof THREE.BufferAttribute)) throw new Error('the mesh has no position attribute');
  for (let index = 0; index < attribute.count; index += 1) {
    visit(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
  }
}

/** A mesh's position, plus a reader for one vertex of it, narrowed the same way
 *  `eachVertex` narrows its own. */
export function vertexReader(object: THREE.Object3D): {
  readonly count: number;
  readonly at: (index: number, out: THREE.Vector3) => THREE.Vector3;
} {
  if (!(object instanceof THREE.Mesh)) throw new Error('the part is not a mesh');
  const geometry: unknown = object.geometry;
  if (!(geometry instanceof THREE.BufferGeometry)) throw new Error('the mesh has no geometry');
  const attribute: unknown = geometry.getAttribute('position');
  if (!(attribute instanceof THREE.BufferAttribute)) throw new Error('the mesh has no position attribute');
  const count: number = attribute.count;
  return {
    count,
    at: (index, out) => out.fromBufferAttribute(attribute, index),
  };
}

/**
 * A world-space box over a refreshed ancestor chain. `Box3.setFromObject`
 * updates the object's own subtree but not the groups above it, and a part's
 * placement lives on its group — so measuring a lens ring without this reads
 * its local coordinates and passes whatever the group's transform does.
 */
export function worldBox(object: THREE.Object3D): THREE.Box3 {
  object.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(object);
}

export interface FootprintReport {
  /** How many of the part's own vertices were measured. */
  readonly count: number;
  /** The part's vertices, in the space the panel shares, that do NOT lie over
   *  the panel's footprint. Empty is the claim. */
  readonly outside: readonly THREE.Vector3[];
  /** How much further the part's own XY box could grow along each of the four
   *  body axes and still lie over the panel's face. */
  readonly margins: {
    readonly left: number;
    readonly right: number;
    readonly bottom: number;
    readonly top: number;
  };
}

/** How far every probe starts from the point it measures. The crossing the
 *  containment probe counts is the panel's inner face, half a thickness beyond
 *  the mid-plane the point is projected to, so it falls 499.7 of the 500 mm
 *  whose crossings `insideDepth` counts: inside the window by 0.3 mm. */
const PROBE_REACH = 500;
/** How far a margin probe will look before giving up: from the box edge of any
 *  part this file measures, 60 mm reaches past every edge of the panel. */
const MARGIN_LIMIT = 60;

/** True when `point`, projected onto the panel's own mid-plane, lies over the
 *  panel's footprint. `insideDepth` answers it because it counts only the
 *  crossings between the ray's start and the point: a point inside the panel
 *  meets its inner face on the way in and nothing on the way out, so an odd
 *  count is "inside", while a point beyond the footprint meets no wall at all.
 *  The mid-plane is used so the answer is about the footprint rather than about
 *  where in the panel's 0.6 mm thickness the point sits. */
function overPanel(panel: THREE.Object3D, point: THREE.Vector3, midZ: number): boolean {
  const probe = new THREE.Vector3(point.x, point.y, midZ);
  return insideDepth(panel, probe, new THREE.Vector3(0, 0, 1), PROBE_REACH) > 0;
}

/**
 * How far `from` can move along `(dx, dy)` and stay over the panel's face,
 * found by bisection: 20 halvings of `MARGIN_LIMIT` is finer than any vertex
 * the model has, and it measures the panel's real outline rather than a
 * bounding box. Rays are cast at the panel's caps rather than across its walls
 * on purpose — the panel's top edge is a sampled curve, and a wall ray fired
 * exactly along x = 0 lands on the seam between two of its quads and reads as a
 * miss, which is how this measurement was first written and wrongly reported a
 * zero margin.
 */
function marginAlong(panel: THREE.Object3D, from: THREE.Vector3, dx: number, dy: number, midZ: number): number {
  const over = (distance: number): boolean =>
    overPanel(panel, new THREE.Vector3(from.x + dx * distance, from.y + dy * distance, 0), midZ);
  if (!over(0)) return 0;
  if (over(MARGIN_LIMIT)) return MARGIN_LIMIT;
  let low = 0;
  let high = MARGIN_LIMIT;
  for (let step = 0; step < 20; step += 1) {
    const middle = (low + high) / 2;
    if (over(middle)) low = middle;
    else high = middle;
  }
  return low;
}

/**
 * Measures a part against the opaque panel it has to hide behind: which of its
 * vertices lie over the panel's footprint, and how far its own XY box stops
 * short of the panel's outline. The two parts must share a space — both are
 * measured where they sit in the tree they were built into.
 *
 * This is the geometry a "the part draws no pixel" claim rests on: a point
 * behind the panel's outer face and over the panel's footprint has panel
 * material between it and a straight-on viewer.
 */
export function panelFootprint(panel: THREE.Object3D, part: THREE.Object3D): FootprintReport {
  const slab = worldBox(panel);
  const midZ = (slab.min.z + slab.max.z) / 2;
  const point = new THREE.Vector3();
  const outside: THREE.Vector3[] = [];
  let count = 0;

  part.updateWorldMatrix(true, true);
  part.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const geometry: unknown = node.geometry;
    if (!(geometry instanceof THREE.BufferGeometry)) return;
    const attribute: unknown = geometry.getAttribute('position');
    if (!(attribute instanceof THREE.BufferAttribute)) return;
    for (let index = 0; index < attribute.count; index += 1) {
      point.fromBufferAttribute(attribute, index).applyMatrix4(node.matrixWorld);
      count += 1;
      if (!overPanel(panel, point, midZ)) outside.push(point.clone());
    }
  });

  const box = worldBox(part);
  const centre = box.getCenter(new THREE.Vector3());
  const toEdge = (x: number, y: number, dx: number, dy: number): number =>
    marginAlong(panel, new THREE.Vector3(x, y, 0), dx, dy, midZ);
  return {
    count,
    outside,
    margins: {
      left: toEdge(box.min.x, centre.y, -1, 0),
      right: toEdge(box.max.x, centre.y, 1, 0),
      bottom: toEdge(centre.x, box.min.y, 0, -1),
      top: toEdge(centre.x, box.max.y, 0, 1),
    },
  };
}

/** How far a part's outward face stands from the body's centre line, on the
 *  edge `edge` names: +1 is the right (+X) edge, -1 the left. */
export function outerFace(box: THREE.Box3, edge: number): number {
  return edge > 0 ? box.max.x : -box.min.x;
}

/** Asserts one edge part's two-sided contract: its outermost point lands on the
 *  rail plus the stand-off that part documents, within `ATTACHED_SLACK` either
 *  way. Too far out is a part floating off the phone (which is what the rail
 *  table being 0.36 mm wide produced); too far in is a part buried in the
 *  frame, which is just as wrong and just as invisible. */
export function expectOnRail(part: THREE.Object3D, label: string, proud: number): void {
  const { overhang, closest } = railProfile(part);
  expect(
    overhang,
    `${label} stands ${overhang.toFixed(4)} mm past the rail; its documented stand-off is ${String(proud)} mm`,
  ).toBeLessThanOrEqual(proud + VERTEX_SLACK);
  expect(
    overhang,
    `${label} stops ${(-overhang).toFixed(4)} mm short of the rail, buried in the body (nearest vertex ${closest.toFixed(4)} mm short)`,
  ).toBeGreaterThanOrEqual(-ATTACHED_SLACK);
}
