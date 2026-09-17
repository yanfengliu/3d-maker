import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

/**
 * The Apple logo, from the path published with Font Awesome Free 5.15.4
 * (brands/apple, CC BY 4.0). Its viewBox is 384 x 512.
 *
 * `parse()` hands back one `ShapePath` per `<path>`, and this is a single path
 * with two subpaths: the body and the leaf, both wound in the same direction.
 * Feeding the subpaths through `toShapes(isCCW)` with a consistent winding
 * gives two separate filled contours. Building both as plain shapes and then
 * triangulating them together — which is what the previous version did — can
 * pair them as an outline and a hole, which is what turned the logo into a
 * faint squiggle. Two contours, both filled, is the contract here.
 */
const APPLE_LOGO_PATH =
  'M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z';

export interface LogoGeometryOptions {
  /** Finished height of the inlay in millimetres. */
  readonly height: number;
  /** Extrusion depth before the bevel. */
  readonly depth?: number;
  readonly bevel?: number;
}

/**
 * A filled, centred Apple logo as an extruded inlay. The geometry is laid out
 * so its flat back sits on z = 0 and it grows towards -Z (out of the back of
 * the phone), and so the leaf ends up in the upper right with the bite on the
 * right when the logo is seen from behind.
 */
export function appleLogoGeometry(options: LogoGeometryOptions): THREE.ExtrudeGeometry {
  const svg = new SVGLoader().parse(
    `<svg xmlns="http://www.w3.org/2000/svg"><path d="${APPLE_LOGO_PATH}"/></svg>`,
  );
  const shapePath = svg.paths[0];
  if (shapePath === undefined) throw new Error('Apple logo SVG path did not parse');

  // `ShapePath.toShapes` is the loader's own contour resolution: it assigns
  // hole-ness geometrically (a contour nested inside another) instead of by
  // winding, so the body and the leaf both come back as filled shapes. Handing
  // the two raw subpaths to the triangulator instead pairs one as an outline
  // of the other, which draws the logo as a hollow squiggle.
  const shapes = (
    shapePath as unknown as { toShapes: (isCCW: boolean) => THREE.Shape[] }
  ).toShapes(false);
  if (shapes.length < 2) {
    throw new Error(`Apple logo parsed ${String(shapes.length)} contour(s); expected body + leaf`);
  }

  const bevel = Math.min(options.bevel ?? 0.02, (options.depth ?? 0.1) / 3);
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: (options.depth ?? 0.1) - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 10,
  });

  const box = new THREE.Box3().setFromBufferAttribute(
    geometry.attributes['position'] as THREE.BufferAttribute,
  );
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const scale = options.height / Math.max(size.y, 0.001);
  // SVG Y grows downwards, so the shape is mirrored on Y: the leaf lands in
  // the upper right and the bite on the right, as it is on the real panel.
  // Mirroring flips the winding, so the front faces have to be flipped back or
  // the whole inlay is backface-culled and renders as nothing at all.
  geometry.scale(scale, -scale, 1);
  geometry.translate(-centre.x * scale, centre.y * scale, -box.max.z);
  flipWinding(geometry);
  geometry.computeVertexNormals();
  return geometry;
}

/** Reverses triangle winding in place. */
function flipWinding(geometry: THREE.BufferGeometry): void {
  const index = geometry.index;
  if (index === null) {
    const position = geometry.getAttribute('position');
    for (let vertex = 0; vertex < position.count; vertex += 3) {
      for (const [get, set] of [
        ['getX', 'setX'],
        ['getY', 'setY'],
        ['getZ', 'setZ'],
      ] as const) {
        const first = position[get](vertex);
        position[set](vertex, position[get](vertex + 2));
        position[set](vertex + 2, first);
      }
    }
    position.needsUpdate = true;
    return;
  }
  const array = index.array;
  for (let triangle = 0; triangle < array.length; triangle += 3) {
    const first = array[triangle] as number;
    array[triangle] = array[triangle + 2] as number;
    array[triangle + 2] = first;
  }
  index.needsUpdate = true;
}
