import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { appleLogoGeometry, appleLogoShapes, logoLayout } from './logo.js';

/** How tall an inlay the chirality gate below is built for. A literal, not
 *  `LOGO_HEIGHT`: the gate is measuring which side of the body the leaf lands
 *  on, and taking the height from the symbol the part is placed with would let
 *  a change there move the fixture along with the code it checks. */
const LOGO_GATE_HEIGHT = 14;

/**
 * The Apple logo's chirality, from the geometry rather than from the inlay's
 * placement.
 *
 * The defect: viewed from the back, the leaf sat top-LEFT and the bite on the
 * LEFT. Every reference has them top-right and right. Nothing measured it —
 * `logo.ts` claimed the correct chirality in a comment and the claim was never
 * put in front of a render — and the mirror that caused it is invisible to
 * anything that only checks the inlay's size or its Z planes.
 *
 * Why the gate can run in node at all: `SVGLoader` needs a `DOMParser`, so the
 * old logo could only be built in a browser and this class of defect could not
 * be gated here. `logo.ts` now carries a reader for the six commands the path
 * actually writes — `M`, `m`, `c`, `C`, `q` and `z` — plus `L`, which the
 * parser reaches through its own M-then-lineto rewrite and the path never
 * spells out. That makes the two contours and the transform that places them
 * available to a node test — the same transform `buildBack` places the inlay
 * by, driven in both its authorings.
 *
 * One thing the file format does that every bound below depends on: SVG y grows
 * downwards, so the *smallest* y in the path is the part's top. The Y mirror in
 * `logoLayout` turns it into the inlay's top and the file's `maxY` into the
 * part's bottom, which is why none of these checks compares the file's `maxY`
 * with anything but the part's own bottom.
 */
describe('the Apple logo’s chirality', () => {
  /**
   * The inlay extruded from the shapes `logo.ts` parses, with `logoLayout`'s
   * transform applied, and a flag that chooses the *authoring*: `true` is the
   * transform the module ships, `false` the one that shipped the mirrored logo
   * (a single Y mirror). Both chiralities go through this one function so that
   * the two measurements below differ by the mirror and by nothing else.
   *
   * The extrusion literals are `buildBack`'s call and `appleLogoGeometry`'s own
   * defaults; a mismatch would show up as the box comparison in the test.
   */
  function transformed(shapes: readonly THREE.Shape[], mirrorX: boolean): THREE.ExtrudeGeometry {
    const depth = 0.16;
    const bevel = 0.035;
    const geometry = new THREE.ExtrudeGeometry(shapes as THREE.Shape[], {
      depth: depth - 2 * bevel,
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
      targetHeight: LOGO_GATE_HEIGHT,
      mirrorX,
    });
    geometry.scale(layout.scaleX, layout.scaleY, 1);
    geometry.translate(layout.translateX, layout.translateY, layout.translateZ);
    geometry.computeVertexNormals();
    return geometry;
  }

  /** The mean X of the vertices in the topmost `share` of a geometry's Y range,
   *  and how many of them there were. */
  function topBandCentroidX(geometry: THREE.BufferGeometry, share: number): { x: number; n: number } {
    const attribute: unknown = geometry.getAttribute('position');
    if (!(attribute instanceof THREE.BufferAttribute)) throw new Error('the geometry has no position attribute');
    const ys: number[] = [];
    for (let index = 0; index < attribute.count; index += 1) ys.push(attribute.getY(index));
    const top = Math.max(...ys);
    const cut = top - share * (top - Math.min(...ys));
    let sum = 0;
    let n = 0;
    for (let index = 0; index < attribute.count; index += 1) {
      if (attribute.getY(index) >= cut) {
        sum += attribute.getX(index);
        n += 1;
      }
    }
    return { x: n === 0 ? Number.NaN : sum / n, n };
  }

  function geometryBox(geometry: THREE.BufferGeometry): THREE.Box3 {
    return new THREE.Box3().setFromBufferAttribute(
      geometry.attributes['position'] as THREE.BufferAttribute,
    );
  }

  /** The contour with the `rank`-th fewest points: the leaf is the smaller of
   *  the two, whatever order `toShapes` returns them in. */
  function byPointCount(shapes: readonly THREE.Shape[], rank: number): THREE.Shape {
    const sorted = [...shapes].sort((a, b) => a.getPoints(4).length - b.getPoints(4).length);
    const found = sorted[rank];
    if (found === undefined) throw new Error(`the logo has no contour at rank ${String(rank)}`);
    return found;
  }

  /** The inlay's own extrusion, before any transform: the coordinates the
   *  shipped `ExtrudeGeometry` parameters produce, which is where the contours'
   *  relative heights can be compared without the transform normalising them. */
  function raw(shapes: readonly THREE.Shape[]): THREE.ExtrudeGeometry {
    return new THREE.ExtrudeGeometry(shapes as THREE.Shape[], {
      depth: 0.16 - 2 * 0.035,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelOffset: 0,
      bevelSegments: 2,
      curveSegments: 10,
    });
  }

  /** The Y range of a geometry's own vertices. */
  function vertexExtents(geometry: THREE.BufferGeometry): { minY: number; maxY: number } {
    const attribute: unknown = geometry.getAttribute('position');
    if (!(attribute instanceof THREE.BufferAttribute)) throw new Error('the geometry has no position attribute');
    let minY = Infinity;
    let maxY = -Infinity;
    for (let index = 0; index < attribute.count; index += 1) {
      const y = attribute.getY(index);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    return { minY, maxY };
  }

  it('puts the leaf cluster on the -X half, so a back view reads it upper right', () => {
    // The part under test is the one `buildBack` places, placed by the module's
    // own transform: `appleLogoGeometry`. Its box has to be the box this
    // fixture's own extrusion lands on, or the measurement below would be
    // reading a fixture that had drifted off the shipped part.
    const shapes = appleLogoShapes();
    const shipped = transformed(shapes, true);
    const part = appleLogoGeometry({ height: LOGO_GATE_HEIGHT, depth: 0.16, bevel: 0.035 });
    const partBox = geometryBox(part);
    const shippedBox = geometryBox(shipped);
    expect(partBox.min.x, 'the shipped inlay is not the fixture’s geometry').toBeCloseTo(shippedBox.min.x, 6);
    expect(partBox.max.x, 'the shipped inlay is not the fixture’s geometry').toBeCloseTo(shippedBox.max.x, 6);
    expect(partBox.min.y, 'the shipped inlay is not the fixture’s geometry').toBeCloseTo(shippedBox.min.y, 6);

    // `views.ts`: in `back`, world +X appears on the LEFT of frame, so the
    // right of frame — where every reference puts the leaf, and the bite with
    // it — is world -X. A cluster whose centroid is positive therefore sits on
    // the wrong half of the phone's back.
    const placed = topBandCentroidX(part, 0.1);
    expect(placed.n, 'the inlay has no vertices in its top tenth').toBeGreaterThan(0);
    expect(
      placed.x,
      `the leaf cluster's centroid is at x = ${placed.x.toFixed(3)} (${String(placed.n)} vertices): it is on the +X half, which a back view shows on the LEFT`,
    ).toBeLessThan(0);

    // What is in that band, measured rather than assumed. Worth spelling out,
    // because the authored coordinates run the opposite way to the finished
    // inlay: SVG y grows downwards, so the file's *smallest* y is the part's
    // top and its `maxY` the part's bottom. In the file the body occupies
    // y = 139.2…479.9 and the leaf y = 32.0…139.0; the Y mirror turns that into
    // a finished inlay whose body spans y = -7.000…+3.650 and whose leaf spans
    // y = +3.656…+7.000, so the topmost tenth of the 14 mm inlay — y = 5.600 to
    // 7.000 — is the leaf's tip and nothing else.
    const leaf = byPointCount(shapes, 0);
    const body = byPointCount(shapes, 1);
    expect(leaf.getPoints(4).length, 'the leaf contour is not the smaller one').toBeLessThan(
      body.getPoints(4).length,
    );
    const leafExtents = vertexExtents(raw([leaf]));
    const bodyExtents = vertexExtents(raw([body]));
    const inlayExtents = vertexExtents(raw(shapes));
    const inlaySpan = inlayExtents.maxY - inlayExtents.minY;
    const inlayCentre = (inlayExtents.maxY + inlayExtents.minY) / 2;

    /** A file y in the finished inlay's own coordinates: the mirror reverses
     *  the axis, so the file's smallest y becomes the inlay's top. */
    const toFinished = (fileY: number): number => (-(fileY - inlayCentre) * LOGO_GATE_HEIGHT) / inlaySpan;
    /** The floor of the top tenth the centroid above measures. */
    const bandFloor = LOGO_GATE_HEIGHT / 2 - 0.1 * LOGO_GATE_HEIGHT;

    // (1) The two contours do not overlap in Y at all: in the file the leaf's
    //     whole range lies above the body's, so after the mirror the leaf's
    //     whole range lies above the body's, and the band can only hold leaf
    //     vertices. The assertion this replaces compared the leaf's file
    //     *bottom* with the body's file bottom — 138.979 < 479.935 — which the
    //     body's own bottom satisfies whatever the two contours do to each
    //     other, so it could not go red for the reason its message gave.
    expect(
      leafExtents.maxY,
      `the leaf's file bottom is y = ${leafExtents.maxY.toFixed(1)} and the body's file top is y = ${bodyExtents.minY.toFixed(1)}: the two contours overlap, so the top band is not the leaf's alone`,
    ).toBeLessThanOrEqual(bodyExtents.minY);

    // (2)+(3) The body's crown — the end of its contour the mirror turns into
    //     its highest point, which is the file's `minY` — and the isolation the
    //     old gate asserted nowhere: the crown has to sit *below* the band's
    //     floor. Measured, it lands at y = +3.650 finished against a floor at
    //     +5.600, so 1.950 mm of the inlay separates the body from the band.
    //     The old check read `bodyExtents.maxY`, which mirrors to the inlay's
    //     own bottom — exactly `-LOGO_GATE_HEIGHT / 2`, always less than zero,
    //     and never inside the band it claimed to measure.
    const bodyCrown = toFinished(bodyExtents.minY);
    expect(
      bodyCrown,
      `the body's crown lands at y = ${bodyCrown.toFixed(3)} in the finished inlay, above the band's floor at ${bandFloor.toFixed(3)} — the top tenth the centroid measures holds body vertices`,
    ).toBeLessThan(bandFloor);
    expect(
      bodyCrown,
      `the body's crown reads y = ${bodyCrown.toFixed(3)}: that is the inlay's own bottom, so this measured the wrong end of the contour`,
    ).toBeGreaterThan(0);
    expect(
      bodyCrown,
      `the body's crown reads y = ${bodyCrown.toFixed(3)}, not the +3.650 the finished inlay puts it at`,
    ).toBeCloseTo(3.65, 2);

    // And the band really is the leaf: the leaf's tip is the inlay's top, and
    // its finished bottom is below the band's floor, so every vertex the
    // centroid above averages is a leaf vertex.
    expect(
      toFinished(leafExtents.minY),
      `the leaf's tip is at y = ${toFinished(leafExtents.minY).toFixed(3)}, not the top of the finished inlay`,
    ).toBeCloseTo(LOGO_GATE_HEIGHT / 2, 3);
    expect(
      toFinished(leafExtents.maxY),
      `the leaf's finished bottom is y = ${toFinished(leafExtents.maxY).toFixed(3)}, below the band's floor at ${bandFloor.toFixed(3)}: the band is not all leaf`,
    ).toBeLessThanOrEqual(bandFloor);
    // The band has enough vertices in it for a centroid to mean something: a
    // handful of degenerate points would let the assertion above pass on
    // arithmetic rather than on the shape.
    expect(placed.n, `only ${String(placed.n)} vertices are in the top tenth`).toBeGreaterThan(50);

    // The authoring that shipped, driven through the same transform with the X
    // mirror off. Its leaf cluster has the same size and the opposite sign, so
    // neither the band nor the geometry can satisfy both halves, and a
    // transform that stopped mirroring X goes red on this line.
    const flipped = topBandCentroidX(transformed(shapes, false), 0.1);
    expect(flipped.n, 'the two authorings do not agree on the band').toBe(placed.n);
    expect(
      flipped.x,
      `the shipped single-mirror authoring also puts the leaf cluster at x = ${flipped.x.toFixed(3)}: the transform no longer mirrors X`,
    ).toBeGreaterThan(0);
    expect(placed.x + flipped.x, 'the two authorings are not mirror images').toBeCloseTo(0, 6);

    // The rest of the transform's contract: the inlay is centred on its own
    // outline, is the finished height, and grows away from z = 0 rather than
    // back through the panel it is embedded in.
    const centre = partBox.getCenter(new THREE.Vector3());
    expect(centre.x, 'the inlay is not centred on its own X').toBeCloseTo(0, 6);
    expect(centre.y, 'the inlay is not centred on its own Y').toBeCloseTo(0, 6);
    expect(partBox.min.y, 'the inlay is not the finished height').toBeCloseTo(-LOGO_GATE_HEIGHT / 2, 3);
    expect(partBox.max.z, 'the inlay does not grow away from z = 0').toBeLessThanOrEqual(1e-6);
  });
});
