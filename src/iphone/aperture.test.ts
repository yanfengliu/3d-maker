import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { RAIL, USB_C } from './dims.js';
import { buildBottom, buildHousing } from './parts.js';
import { materials, required, worldBox } from './test-helpers.js';

/**
 * The USB-C aperture the bottom view actually reads: the frame's cut, the mouth
 * plate's window, and where the tongue sits behind it. `port.test.ts` owns the
 * through-cut's other gates — the ±Z sweep, the plane pairs, the solidity and
 * coverage.
 *
 * The defect this file was written for was invisible to every one of those.
 * Measured on the build before this round: a `slot` hole whose outline *crosses*
 * the shape's outline is an edge notch, and the triangulator behind
 * `ExtrudeGeometry` has no defined answer for it — 0 of 464 rays through the
 * mouth's documented cross-section met no frame material, so the frame was
 * solid at the port and the 0.24 mm-cornered mouth the previous round's comments
 * described did not exist in the geometry at all. The whole read came from the
 * bottom assembly: a dark liner rectangle 8.4 x 8.6 mm hanging 0.01 mm *below*
 * the rail, an angular aperture inside it and a 6.6 x 7.1 mm steel tongue whose
 * bright underside filled that. Three gates here pin what replaced it: the
 * frame's cut is open where the mouth is and closed where it is not, the
 * aperture's outline is the documented rounded rectangle, and the tongue is
 * below the mouth's mid-height and inside the pocket.
 */
describe('the USB-C aperture', () => {
  const mouthHalfWidth = USB_C.width / 2;
  const mouthTop = -RAIL.y + USB_C.height;
  const railBottom = -RAIL.y;

  it('cuts the mouth through the frame’s own outline', () => {
    // (f) The class the frame's cut was silently in. `port.ts`'s
    // `housingGeometry` draws the notch into the frame's own outline now, so the
    // cut always exists; this measures that it exists *and* that it is the
    // mouth's size, from both sides. A ray along -Z and a ray along +Z at every
    // sample *clear* of the mouth's documented cross-section must meet no frame
    // material, and a ray at a sample just *outside* it must meet some. One side
    // alone would accept a cut of any size, which is what the class needs: the
    // numbers are the mouth's.
    //
    // The cross-section measured is the notch's own shape rather than the
    // aperture's: 8.4 mm across and 3.2 mm up from the rail with a 1.1 mm corner
    // at its two *top* corners, and no corners at the bottom, where the notch
    // opens onto the rail's edge. The full rounded rectangle — bottom corners
    // included — is the mouth plate's window, and the gate below measures that.
    // Measured on this build: 823 of 823 clear samples open, 148 of 148 outside
    // samples blocked. `CLEARANCE` is 0.15 mm, so a mouth 0.3 mm narrower or
    // wider than the documented one fails one side or the other.
    const housing = buildHousing(materials);
    const caster = new THREE.Raycaster();
    const CLEARANCE = 0.15;
    const straightX = mouthHalfWidth - USB_C.radius;
    const cornerY = mouthTop - USB_C.radius;
    /** How far inside the notch's cross-section a point lies; negative means
     *  outside it. */
    const clearance = (x: number, y: number): number => {
      if (y <= cornerY || Math.abs(x) <= straightX) {
        return Math.min(mouthHalfWidth - Math.abs(x), mouthTop - y);
      }
      return USB_C.radius - Math.hypot(Math.abs(x) - straightX, y - cornerY);
    };
    const blockedBy = (x: number, y: number): boolean =>
      ([-1, 1] as const).some((sign) => {
        caster.set(new THREE.Vector3(x, y, sign * 50), new THREE.Vector3(0, 0, -sign));
        return caster.intersectObject(housing, false).length > 0;
      });
    let openSamples = 0;
    let outsideSamples = 0;
    const blocked: string[] = [];
    const openOutside: string[] = [];
    const steps = 32;
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps; j += 1) {
        const x = -mouthHalfWidth - 0.6 + (2 * (mouthHalfWidth + 0.6) * i) / steps;
        const y = railBottom + 0.1 + ((mouthTop - railBottom - 0.1) * j) / steps;
        const reach = clearance(x, y);
        if (reach >= CLEARANCE) {
          openSamples += 1;
          if (blockedBy(x, y) && blocked.length < 8) blocked.push(`(${x.toFixed(2)}, ${y.toFixed(2)})`);
        } else if (reach <= -CLEARANCE) {
          outsideSamples += 1;
          if (!blockedBy(x, y) && openOutside.length < 8) openOutside.push(`(${x.toFixed(2)}, ${y.toFixed(2)})`);
        }
      }
    }
    expect(openSamples, 'no sample is clear of the mouth, so this gate proves nothing').toBeGreaterThan(50);
    expect(outsideSamples, 'no sample lies outside the mouth, so this gate measures one side only').toBeGreaterThan(50);
    expect(
      blocked,
      `the frame has material inside the mouth's own cross-section at ${blocked.join(', ')} — the cut is not there, and the port is a decal on a closed bottom face`,
    ).toEqual([]);
    expect(
      openOutside,
      `the frame has no material outside the mouth's cross-section at ${openOutside.join(', ')} — the cut is wider or taller than the documented mouth`,
    ).toEqual([]);
  });

  it('builds the visible aperture as the documented rounded rectangle', () => {
    // (g) The read itself, which none of the gates in `port.test.ts` can see:
    // they measure that the port is closed, that its planes are separated and
    // that the tongue is reachable — not the *shape* of the opening. Measured on
    // the build before this round, the aperture was the liner's rectangular hole
    // with the notch's angular outline behind it; the mouth plate's window
    // carries it now, and this measures that window's outline against the
    // documented rounded rectangle, three ways: its extent, its distance from
    // the ideal curve, and its corners.
    //
    // Tolerance: 0.02 mm. The window's outline is a polygon — `roundedHole`
    // subdivides each corner arc into 10 chords, whose sagitta at r = 1.1 is
    // 0.0034 mm — so this accepts the polygon and rejects anything that is not
    // that curve: an unrounded 8.4 x 3.2 window misses the arc by 0.4556 mm at
    // each corner, which is the red proof this gate was run against.
    const TOLERANCE = 0.02;
    /** How far the outline's nearest vertex comes to a square corner of the
     *  aperture's own bounding box. A rounded window cannot reach it: the
     *  distance from a square corner to a 1.1 mm arc is 0.4556 mm. */
    const CORNER_CLEARANCE = 0.3;
    const bottom = buildBottom(materials);
    const mouth = required(bottom, 'port-mouth');
    const box = worldBox(mouth);
    /** The window's outline: the plate's vertices on either face plane whose
     *  (x, z) lie inside the aperture's own footprint. The plate's outer
     *  outline is 0.4 mm further out and is excluded by that filter. */
    const outline: THREE.Vector2[] = [];
    const mesh = mouth as THREE.Mesh;
    const attribute = mesh.geometry.getAttribute('position');
    for (let index = 0; index < attribute.count; index += 1) {
      const y = attribute.getY(index);
      if (Math.abs(y - box.min.y) > 1e-6 && Math.abs(y - box.max.y) > 1e-6) continue;
      const x = attribute.getX(index);
      const z = attribute.getZ(index);
      if (Math.abs(x) > mouthHalfWidth + 0.05 || Math.abs(z) > USB_C.height / 2 + 0.05) continue;
      outline.push(new THREE.Vector2(x, z));
    }
    expect(
      outline.length,
      `the mouth plate's window has ${String(outline.length)} outline vertices — a window that is not there measures nothing`,
    ).toBeGreaterThan(40);
    const halfWidth = Math.max(...outline.map((point) => Math.abs(point.x)));
    const halfDepth = Math.max(...outline.map((point) => Math.abs(point.y)));
    expect(
      Math.abs(halfWidth - mouthHalfWidth),
      `the aperture is ${(halfWidth * 2).toFixed(4)} mm across where ${String(USB_C.width)} is documented`,
    ).toBeLessThanOrEqual(TOLERANCE);
    expect(
      Math.abs(halfDepth - USB_C.height / 2),
      `the aperture is ${(halfDepth * 2).toFixed(4)} mm deep where ${String(USB_C.height)} is documented`,
    ).toBeLessThanOrEqual(TOLERANCE);
    // Every vertex on the ideal rounded rectangle...
    const straight = mouthHalfWidth - USB_C.radius;
    const square = USB_C.height / 2 - USB_C.radius;
    const offCurve = outline
      .map((point) => {
        const dx = Math.max(Math.abs(point.x) - straight, 0);
        const dy = Math.max(Math.abs(point.y) - square, 0);
        return { point, miss: Math.abs(Math.hypot(dx, dy) - USB_C.radius) };
      })
      .filter((measured) => measured.miss > TOLERANCE);
    expect(
      offCurve.map(
        (measured) =>
          `(${measured.point.x.toFixed(3)}, ${measured.point.y.toFixed(3)}) by ${measured.miss.toFixed(4)}`,
      ),
      `the aperture's outline leaves the documented rounded rectangle at ${String(offCurve.length)} of ${String(outline.length)} vertices`,
    ).toEqual([]);
    // ...and the corners are actually round: no vertex comes near a square
    // corner of the aperture's own 8.4 x 3.2 bounding box.
    const nearestCorner = Math.min(
      ...outline.map((point) =>
        Math.hypot(Math.abs(point.x) - mouthHalfWidth, Math.abs(point.y) - USB_C.height / 2),
      ),
    );
    expect(
      nearestCorner,
      `the aperture's outline comes within ${nearestCorner.toFixed(4)} mm of a square corner — a rectangle with cut corners would reach 0`,
    ).toBeGreaterThan(CORNER_CLEARANCE);
    // And the dark plate behind it is larger than the aperture on every side, so
    // its own outline is buried in the mouth plate's material and the aperture's
    // silhouette stays the window's.
    const plate = worldBox(required(bottom, 'port-mouth-plate'));
    expect(plate.min.x).toBeLessThan(-mouthHalfWidth);
    expect(plate.max.x).toBeGreaterThan(mouthHalfWidth);
    expect(plate.min.z).toBeLessThan(-USB_C.height / 2);
    expect(plate.max.z).toBeGreaterThan(USB_C.height / 2);
  });

  it('keeps the tongue below the mouth’s mid-height and inside the pocket', () => {
    // (h) Where the tongue is, which is what the defect this round fixed was
    // about. The old tongue's underside sat at y = -75.02 — 0.02 mm *below* the
    // rail's own bottom face, so it hung in open air under the phone — and ran
    // from z = -3 to z = 4.1, the pocket's whole depth. From the bottom view
    // that put a 6.6 x 7.1 mm bright steel plate across the whole aperture,
    // centred: the grey-blue trapezoid the defect report describes.
    //
    // Two claims, both measured here. *Below the aperture's mid-line*: the
    // tongue's top face is under `railBottom + USB_C.height / 2`, the middle of
    // the mouth's own 3.2 mm height — measured 0.34 mm above the rail against a
    // 1.60 mm mid-height. *Inside the pocket*: every corner of its box is within
    // the mouth's cross-section and above the rail's bottom face, so nothing of
    // it can be the lowest thing under the phone, and it is inside the
    // aperture's own footprint in Z, so the bottom view looks *through the
    // opening* at it rather than at a slab that fills the mouth.
    const bottom = buildBottom(materials);
    const tongue = worldBox(required(bottom, 'port-tongue'));
    expect(
      tongue.max.y,
      `the tongue's top is ${(tongue.max.y - railBottom).toFixed(4)} mm above the rail, past the mouth's ${(USB_C.height / 2).toFixed(2)} mm mid-height`,
    ).toBeLessThan(railBottom + USB_C.height / 2);
    expect(
      tongue.min.y,
      `the tongue reaches ${(railBottom - tongue.min.y).toFixed(4)} mm below the rail's bottom face — it hangs in the open under the phone`,
    ).toBeGreaterThan(railBottom);
    expect(tongue.max.y - tongue.min.y, 'the tongue is not thinner than the mouth is deep').toBeLessThan(
      USB_C.height,
    );
    expect(Math.abs(tongue.max.x), 'the tongue is wider than the mouth').toBeLessThanOrEqual(mouthHalfWidth);
    expect(Math.abs(tongue.max.z), 'the tongue reaches outside the aperture').toBeLessThanOrEqual(USB_C.height / 2);
    expect(
      tongue.max.z - tongue.min.z,
      `the tongue is ${(tongue.max.z - tongue.min.z).toFixed(3)} mm long, so it is a slab across the aperture rather than a strip in it`,
    ).toBeLessThan(USB_C.height / 2);
  });
});
