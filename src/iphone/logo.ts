import * as THREE from 'three';

/**
 * The Apple logo, from the path published with Font Awesome Free 5.15.4
 * (brands/apple, CC BY 4.0). Its viewBox is 384 x 512.
 *
 * The path is parsed here rather than through `SVGLoader`. The loader needs a
 * `DOMParser`, so the logo could only be built in a browser and its chirality —
 * which is what went wrong — could not be measured by the node test suite at
 * all. The path uses six commands — `M`, `m` (the leaf's relative moveto), `c`,
 * `C`, `q` and `z`, which is `M`, `c`, `C`, `q`, `z` for the body and `m`, `z`
 * for the leaf — plus `L`, which the parser reaches without the path writing it
 * because a coordinate pair after `M` is a lineto (see `parseSvgPath`). A reader
 * for the seven is smaller than the DOM shim it replaces and runs in either
 * environment.
 *
 * The path has two subpaths: the body and the leaf. Feeding them through
 * `toShapes(isCCW)` with a consistent winding gives two separate filled
 * contours. Building both as plain shapes and then triangulating them together
 * — which is what the previous version did — can pair them as an outline and a
 * hole, which is what turned the logo into a faint squiggle. Two contours, both
 * filled, is the contract here.
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
 * How the authored 2D outline is carried into the body's coordinate system.
 *
 * Two mirrors, and each one is doing something different:
 *
 * - Y, because SVG Y grows downwards and the geometry's Y grows up. Without it
 *   the logo is upside down. This one is a property of the *file format*.
 * - X, because the panel it is embedded in faces -Z. A viewer standing at -Z
 *   looks back along +Z, so the world's +X runs to the viewer's left. Every
 *   plane viewed from the side it faces therefore appears X-mirrored against
 *   the same outline viewed from +Z, and the logo has to be pre-mirrored to
 *   cancel that. This one is a property of the *panel*: author the same shape
 *   on a +Z-facing surface and the X mirror has to go.
 *
 * Both mirrors together multiply the outline's orientation by +1, so the
 * extrusion's winding comes through these unchanged. That is a contract, not a
 * detail: the axis this transform mirrors — local Z — is *not* touched, so
 * whatever faces +Z or -Z before the transform faces the same way after it, and
 * the extrude's own cap normals survive. `mirrorX: false` saves the mirror but
 * reverses the extrusion's handedness and no longer preserves the winding (this
 * is the single-mirror authoring that shipped the mirrored logo): its two Z
 * layers carry the opposite normals, so the outward -Z cap is backface-culled
 * and the inlay disappears against the panel. It exists so a gate can drive
 * both chiralities through one function, and is not a supported authoring. This
 * was measured on both authorings' geometry, not reasoned from this paragraph:
 * with `mirrorX: true` the layer at local z = 0 has mean normal.z = +1.000 and
 * the layer at z = -0.16 (0.16 mm is the shipped depth) has -1.000; with
 * `mirrorX: false` the two swap.
 */
export interface LogoLayoutInput {
  /** Extent of the authored outline, in its own coordinates. */
  readonly width: number;
  readonly height: number;
  /** Centre of the authored outline, in its own coordinates. */
  readonly centreX: number;
  readonly centreY: number;
  /** Largest Z the extrusion reaches; the transform puts it at z = 0. */
  readonly maxZ: number;
  /** Finished height of the inlay in millimetres. */
  readonly targetHeight: number;
  /** Pre-mirror the outline on X, for a panel that faces -Z. */
  readonly mirrorX: boolean;
}

export interface LogoLayout {
  readonly scaleX: number;
  readonly scaleY: number;
  readonly translateX: number;
  readonly translateY: number;
  readonly translateZ: number;
}

/**
 * The one transform the logo is placed by: scale to its finished height, mirror
 * each axis once (see `LogoLayoutInput`), centre on the outline's own centre,
 * and slide the extrusion's *largest* Z onto z = 0, so the part occupies
 * z = 0 … -depth and grows towards -Z — out of the back of the phone. A
 * back-facing part hands the transform its largest Z; see `slabGeometry`'s note
 * for why that is the name of the parameter.
 *
 * Pure, and exported, because this is where the chirality lives: a node test
 * can drive both authorings through it and measure which side the leaf lands
 * on, while the SVG parse itself is not needed to know the sign.
 */
export function logoLayout(input: LogoLayoutInput): LogoLayout {
  const scale = input.targetHeight / Math.max(input.height, 0.001);
  // A mirrored axis moves the centre to the far side, so the centring
  // translation is `-(centre * scale)` before the mirror and `+(centre * scale)`
  // after it. `translate(-centre * scale)` is the same thing written once;
  // getting this wrong shifts the inlay half a body-width off centre.
  const signX = input.mirrorX ? -1 : 1;
  return {
    scaleX: signX * scale,
    scaleY: -scale,
    translateX: -signX * input.centreX * scale,
    translateY: input.centreY * scale,
    translateZ: -input.maxZ,
  };
}

/**
 * The logo's two filled contours, in the SVG's own coordinates.
 *
 * `ShapePath.toShapes` is the loader's own contour resolution: it assigns
 * hole-ness geometrically (a contour nested inside another) instead of by
 * winding, so the body and the leaf both come back as filled shapes. Handing
 * the two raw subpaths to the triangulator instead pairs one as an outline of
 * the other, which draws the logo as a hollow squiggle.
 */
export function appleLogoShapes(): THREE.Shape[] {
  const path = parseSvgPath(APPLE_LOGO_PATH);
  const shapes = (
    path as unknown as { toShapes: (isCCW: boolean) => THREE.Shape[] }
  ).toShapes(false);
  if (shapes.length < 2) {
    throw new Error(`Apple logo parsed ${String(shapes.length)} contour(s); expected body + leaf`);
  }
  return shapes;
}

/**
 * A filled, centred Apple logo as an extruded inlay. The geometry is laid out
 * with its local z = 0 cap at the part's flattened back and its body reaching
 * to z = -depth: `buildBack` puts local z = 0 at `PANEL_FACE_Z + LOGO_EMBED`,
 * 0.05 mm inside the panel's outer face, so the visible face is the one at
 * z = -depth. The leaf ends up above the body's own top and on the -X side —
 * the upper right of a back view, where `views.ts` puts the world's -X, with
 * the bite cut into the right of the body's crown. `LogoLayoutInput` records
 * why the -Z-facing panel needs the extra X mirror to get there.
 */
export function appleLogoGeometry(options: LogoGeometryOptions): THREE.ExtrudeGeometry {
  const shapes = appleLogoShapes();

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
  const layout = logoLayout({
    width: size.x,
    height: size.y,
    centreX: centre.x,
    centreY: centre.y,
    maxZ: box.max.z,
    targetHeight: options.height,
    mirrorX: true,
  });
  geometry.scale(layout.scaleX, layout.scaleY, 1);
  geometry.translate(layout.translateX, layout.translateY, layout.translateZ);
  // The transform mirrors X and Y and leaves Z alone, and two mirrors preserve
  // the extrusion's orientation, so the winding `ExtrudeGeometry` gave it
  // survives: the cap that was built at the largest Z is still the +Z cap after
  // `translateZ`, and it is the one at z = 0. It is the INNERMOST end, not the
  // visible one — `buildBack` places the part at `PANEL_FACE_Z + LOGO_EMBED`, so
  // z = 0 sits 0.05 mm inside the panel's outer face and the cap the viewer sees
  // is the other one, at z = -0.16. Measured on this geometry's own normals: the
  // z = 0 layer means +1.000 in normal.z and the z = -0.16 layer -1.000, so it is
  // the -Z cap that faces the viewer. Flipping the winding here turns the inlay
  // inside out and backface-culls that visible face.
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A `ShapePath` from an SVG `d` attribute. Only what this file's path uses:
 * `M` to start a contour and `m` for the leaf's, `c` and `C` for the body's
 * cubics, one `q` for its quadratic, `z` to close, and `L` — which the logo's
 * own path never writes, but the parser reaches because a second coordinate
 * pair after the opening `M` is a lineto, and the parser rewrites the command
 * to `L` for it. `l` is handled too, as the relative form of that rewrite. A
 * command letter may be followed by any number of coordinate groups, and a
 * lowercase letter reads them as offsets from the current point; those two
 * rules are the whole of the grammar here.
 */
function parseSvgPath(data: string): THREE.ShapePath {
  const tokens = data.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g);
  if (tokens === null) throw new Error('the Apple logo path is empty');

  const path = new THREE.ShapePath();
  let cursor = 0;
  let command = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const read = (): number => {
    const token = tokens[cursor];
    cursor += 1;
    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error(`the Apple logo path has a bad number at "${String(token)}"`);
    return value;
  };

  while (cursor < tokens.length) {
    const token = tokens[cursor] as string;
    if (/[A-Za-z]/.test(token)) {
      command = token;
      cursor += 1;
      if (command === 'z' || command === 'Z') {
        path.currentPath?.closePath();
        path.currentPath = null;
        x = startX;
        y = startY;
        continue;
      }
    }
    const relative = command === command.toLowerCase();
    if (command === 'm' || command === 'M') {
      x = relative ? x + read() : read();
      y = relative ? y + read() : read();
      startX = x;
      startY = y;
      path.moveTo(x, y);
      // A second coordinate pair after an `M` is a line, not a new contour.
      command = relative ? 'l' : 'L';
    } else if (command === 'c' || command === 'C') {
      const x1 = relative ? x + read() : read();
      const y1 = relative ? y + read() : read();
      const x2 = relative ? x + read() : read();
      const y2 = relative ? y + read() : read();
      x = relative ? x + read() : read();
      y = relative ? y + read() : read();
      path.bezierCurveTo(x1, y1, x2, y2, x, y);
    } else if (command === 'q' || command === 'Q') {
      const x1 = relative ? x + read() : read();
      const y1 = relative ? y + read() : read();
      x = relative ? x + read() : read();
      y = relative ? y + read() : read();
      path.quadraticCurveTo(x1, y1, x, y);
    } else if (command === 'l' || command === 'L') {
      x = relative ? x + read() : read();
      y = relative ? y + read() : read();
      path.lineTo(x, y);
    } else {
      throw new Error(`the Apple logo path uses an unsupported command "${command}"`);
    }
  }
  return path;
}
