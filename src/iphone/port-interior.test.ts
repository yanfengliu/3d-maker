import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { BODY, LEAN_DEG, USB_C } from './dims.js';
import { buildBottom, buildHousing } from './parts.js';
import { materials, required, worldBox } from './test-helpers.js';

/**
 * The pocket read through the aperture: the blocks that make it and the tongue
 * inside it. `port.test.ts` owns the through-cut and the planes around it, and
 * `aperture.test.ts` the shape of the opening the eye reads; these two gates are
 * the ones that need a ray to answer — what a sightline through the window meets
 * first, and whether every one of them meets a port surface at all.
 *
 * They were the second half of `port.test.ts` until the burial gate for
 * `port-mouth` pushed that file past the repository's 500-line limit. The split
 * is by subject, not by convenience: everything here is measured through the
 * window, and everything there is measured on the frame's own surfaces.
 *
 * The bounds are literals where the claim is about a surface crossing another
 * one; `USB_C`, `BODY` and `LEAN_DEG` appear where a *documented* number is the
 * subject — the mouth the design promises, the body's own depth, the
 * presentation's lean.
 */
describe('the USB-C pocket', () => {
  /** The smallest separation two surfaces may have and still be called
   *  non-coplanar: the number `port.test.ts`'s plane gates use, and the one the
   *  tongue's root has to clear the pocket's floor by. */
  const MIN_SEPARATION = 0.005;
  /** The mouth as `dims.ts` documents it: 8.4 mm across, 3.2 mm up from the
   *  rail's bottom face. */
  const mouthHalfWidth = USB_C.width / 2;
  /** The aperture's own opening, sampled 0.02 mm inside its edge: the window the
   *  bottom view looks through, and the population the tongue's sightlines use.
   *  Samples on the outline itself risk starting on a rounded corner's own
   *  polygon, which measures the tessellation instead of the opening. */
  const APERTURE_INSET = 0.02;
  const apertureHalfWidth = USB_C.width / 2 - APERTURE_INSET;
  const apertureHalfDepth = USB_C.height / 2 - APERTURE_INSET;
  /** Where the `bottom` preset's camera sits, in the body's own space.
   *
   *  `views.ts` writes it as a world direction from the target to the camera,
   *  (0.06, -0.3, 0.95), and `phone.ts` leans the model back `LEAN_DEG` about X:
   *  carried into body space that is (0.0601, -0.4301, 0.9008), 25.48 degrees
   *  above the bottom face's plane, and the sightline from it travels
   *  (0, +0.430, -0.901) — up, and towards the body's back. `views.ts` does not
   *  export its frames, so the tuple is repeated here; the sweep below brackets
   *  it, so a preset that moved would not leave this gate measuring one angle. */
  const bottomSightline = new THREE.Vector3(0.06, -0.3, 0.95)
    .normalize()
    .applyAxisAngle(new THREE.Vector3(1, 0, 0), (LEAN_DEG * Math.PI) / 180)
    .negate();

  /** The first surface a ray meets, or null when it meets none. */
  function firstHit(
    from: THREE.Vector3,
    direction: THREE.Vector3,
    targets: readonly THREE.Object3D[],
  ): THREE.Intersection | null {
    const caster = new THREE.Raycaster(from, direction);
    const hits = caster.intersectObjects([...targets], true);
    return hits[0] ?? null;
  }

  it('gives the tongue a sightline through the mouth', () => {
    // (c) The gate that would have caught an invisible tongue. Rays are cast
    // through the aperture's own opening — the 8.4 x 3.2 window the bottom view
    // looks through, sampled 21 x 21 with the edge 0.02 mm clear — and the
    // *first* part each one meets is named. Before the round that added this
    // gate the liner's floor was the first hit for every ray: its top face was
    // on the rail's bottom face and it covered the mouth, so the tongue was 0
    // hits out of 441 and the port read as a dark hole.
    //
    // Measured now, straight down the bottom face's normal: 90 of 441 rays meet
    // the tongue first, the rest the mouth plate (36), the pocket's floor (217)
    // or the dark plate behind the aperture (98). Re-expressed, not weakened:
    // the mouth plate, the dark plate and the frame's notch are surfaces the
    // mouth now has or opens through, and every one of them is the port's own.
    //
    // The count is what is asserted, not a bounding box: a tongue that is merely
    // inside the mouth's x and z range can still be behind the liner, and only
    // the ray says which of the two a sightline meets first.
    const housing = buildHousing(materials);
    const bottom = buildBottom(materials);
    const targets = [bottom, housing];
    const mouth = worldBox(required(bottom, 'port-mouth'));
    const steps = 20;
    let samples = 0;
    const byUpward = new Map<string, number>();
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps; j += 1) {
        const x = -apertureHalfWidth + (2 * apertureHalfWidth * i) / steps;
        const z = -apertureHalfDepth + (2 * apertureHalfDepth * j) / steps;
        samples += 1;
        const up = firstHit(new THREE.Vector3(x, -200, z), new THREE.Vector3(0, 1, 0), targets);
        const name = up?.object.name ?? 'nothing';
        byUpward.set(name, (byUpward.get(name) ?? 0) + 1);
      }
    }
    const straightUp = byUpward.get('port-tongue') ?? 0;
    const spread = [...byUpward.entries()].map(([name, count]) => `${name}=${String(count)}`).join(' ');
    expect(samples).toBeGreaterThan(400);
    expect(
      straightUp,
      `only ${String(straightUp)} of ${String(samples)} upward rays through the aperture reach the tongue before anything else (first hits: ${spread})`,
    ).toBeGreaterThanOrEqual(samples * 0.1);
    // And it has to read from the direction the port is actually looked at from,
    // travelling the way that camera looks. The gate this replaces cast
    // (0, sin, cos) — an up-and-*forward* ray, the mirror of the documented
    // camera, which sits in front of the body (+Z) and looks up and *back*. At
    // 10 degrees it found the tongue on 15 of 441 rays and at 30 on 45, all of
    // them along a direction no preset uses, and asserted only `> 0`.
    //
    // Measured now, over the same 441 samples: the documented direction reaches
    // the tongue first on 90 (20.4 percent), and every angle from 5 to 35
    // degrees on 89 to 90 (20.2 to 20.4 percent) — the count barely moves with
    // the angle, because what bounds it is the tongue's own footprint inside the
    // window. A perspective eye at the preset's own body-space pose — the target
    // plus 170 mm along (0.0601, -0.4301, 0.9008) — reaches it on the same 90,
    // so the parallel-ray model is not what the count rests on. The floor
    // asserted is a tenth of the samples: a tongue behind the floor plate, or
    // one moved out of the opening, scores 0 as it did before.
    const elevation = (Math.asin(bottomSightline.y) * 180) / Math.PI;
    const directions: THREE.Vector3[] = [bottomSightline.clone()];
    for (const degrees of [5, 10, 15, 20, 25, 30, 35]) {
      const radians = (degrees * Math.PI) / 180;
      directions.push(new THREE.Vector3(0, Math.sin(radians), -Math.cos(radians)));
    }
    for (const direction of directions) {
      let seen = 0;
      let aimed = 0;
      for (let i = 0; i <= steps; i += 1) {
        for (let j = 0; j <= steps; j += 1) {
          const x = -apertureHalfWidth + (2 * apertureHalfWidth * i) / steps;
          const z = -apertureHalfDepth + (2 * apertureHalfDepth * j) / steps;
          aimed += 1;
          const at = new THREE.Vector3(x, mouth.min.y, z);
          const hit = firstHit(at.addScaledVector(direction, -60), direction, targets);
          if (hit?.object.name === 'port-tongue') seen += 1;
        }
      }
      expect(aimed).toBeGreaterThan(400);
      expect(
        seen,
        `only ${String(seen)} of ${String(aimed)} rays entering the aperture (${((100 * seen) / aimed).toFixed(1)} percent) travelling (${direction.x.toFixed(3)}, ${direction.y.toFixed(3)}, ${direction.z.toFixed(3)}) — the preset's own ${elevation.toFixed(2)} degrees is one of them — reach the tongue before anything else`,
      ).toBeGreaterThanOrEqual(aimed * 0.1);
    }
    // The tongue's base sits below the floor plate's top face, so the two parts'
    // surfaces meet inside solid material rather than in a slit a ray could slip
    // between: the root is buried, and the tongue rises above the floor's top by
    // more than the class' separation.
    const tongue = worldBox(required(bottom, 'port-tongue'));
    const floor = worldBox(required(bottom, 'port-cavity'));
    expect(
      tongue.min.y,
      'the tongue’s root does not reach into the liner, so a slit runs between them',
    ).toBeLessThan(floor.max.y);
    expect(
      tongue.max.y,
      'the tongue does not rise above the liner’s floor, so nothing of it is in the opening',
    ).toBeGreaterThan(floor.max.y + MIN_SEPARATION);
  });

  it('builds the port from blocks that are solid and span the mouth', () => {
    // (d) The class the collapsed rail belonged to, and the one no gate in
    // `port.test.ts` could see. `blockGeometry` lays a block out from its
    // min/max corners and cannot reject a reversed pair: `BoxGeometry` is
    // symmetric in its width, and `roundBoxVertices` then shrinks the box to its
    // rounding radius, so a block handed `min.x > max.x` is built without
    // complaint as a sliver.
    //
    // Measured before that fix: `port-cavity`'s left rail came out at
    // x ∈ [-3.601, -3.599] where the right one spans [3.000, 4.200], the mouth's
    // left flank had no liner floor under it at all, and 49 of 625 upward
    // samples over the mouth's footprint met the ceiling instead. The Y- and
    // Z-plane gates stayed green through all of it, because each skips a pair
    // whose boxes do not overlap in plan.
    //
    // Re-expressed: the floor is one solid plate inside the pocket rather than
    // four blocks under the rail, so the per-block walk is now one block plus
    // the parts around it, and the coverage claim is made by ray rather than by
    // plan: every sightline from below meets a port surface, and none reaches
    // the ceiling. Measured: 441 rays, 260 of them meeting the mouth plate and
    // 45 the tongue, none leaving the port's own surfaces.
    const bottom = buildBottom(materials);
    /** One block's own extents against the smallest each axis is documented at. */
    const expectSolid = (label: string, box: THREE.Box3, minimum: readonly [number, number, number]): void => {
      const x = box.max.x - box.min.x;
      const y = box.max.y - box.min.y;
      const z = box.max.z - box.min.z;
      for (const [axis, extent, floor] of [
        ['x', x, minimum[0]],
        ['y', y, minimum[1]],
        ['z', z, minimum[2]],
      ] as const) {
        expect(
          extent,
          `${label} measures ${extent.toFixed(4)} mm in ${axis} where it is documented at ${floor.toFixed(2)} mm or more — a block collapsed towards zero is a surface that is not there`,
        ).toBeGreaterThanOrEqual(floor);
      }
    };
    // The shell plates: the notch's whole cross-section at the frame's faces, by
    // the 0.15 mm plate thickness.
    for (const name of ['port-shell-front', 'port-shell-back'] as const) {
      expectSolid(name, worldBox(required(bottom, name)), [9, 3, 0.1]);
    }
    // The mouth plate: the notch's whole bottom-face opening in plan, 0.09 mm
    // thick. Its window is measured by the aperture gate in `aperture.test.ts`.
    expectSolid('port-mouth', worldBox(required(bottom, 'port-mouth')), [9, 0.05, 8.5]);
    expectSolid('port-mouth-plate', worldBox(required(bottom, 'port-mouth-plate')), [8, 0.05, 3]);
    // The ceiling: the mouth's own footprint in plan, 0.2 mm thick.
    expectSolid('port-cavity-ceiling', worldBox(required(bottom, 'port-cavity-ceiling')), [8, 0.1, 8]);
    // The floor: one plate, the mouth's footprint in plan and 0.04 mm thick.
    const floorBlocks: THREE.Box3[] = [];
    required(bottom, 'port-cavity').traverse((node) => {
      if (node instanceof THREE.Mesh) floorBlocks.push(worldBox(node));
    });
    expect(floorBlocks.length, `the port's floor is ${String(floorBlocks.length)} blocks, not one`).toBe(1);
    for (const [index, box] of floorBlocks.entries()) {
      expectSolid(`port-cavity[${String(index)}]`, box, [8, 0.03, 8]);
    }
    // The tongue is a block on the same path: 6.6 mm across, 0.26 mm tall and
    // 1.1 mm deep.
    expectSolid('port-tongue', worldBox(required(bottom, 'port-tongue')), [1, 0.1, 0.5]);

    // The floor and the mouth plate together cover the mouth's whole footprint in
    // plan, and what a sightline from below meets is one of them, the dark plate,
    // the tongue or a shell plate — never the ceiling, and never nothing. The
    // footprint is the mouth's own 8.4 mm across by the body's depth, inset
    // 0.05 mm so a sample cannot graze a part's own rounded edge.
    const targets = [bottom];
    const allowed = [
      'port-mouth',
      'port-mouth-plate',
      'port-cavity',
      'port-tongue',
      'port-shell-front',
      'port-shell-back',
    ];
    const inset = 0.05;
    const footprintHalfDepth = BODY.halfDepth - inset;
    let rays = 0;
    let mouthFirst = 0;
    let tongueFirst = 0;
    const reachingPast: string[] = [];
    for (let i = 0; i <= 20; i += 1) {
      for (let j = 0; j <= 20; j += 1) {
        const x = -(mouthHalfWidth - inset) + (2 * (mouthHalfWidth - inset) * i) / 20;
        const z = -footprintHalfDepth + (2 * footprintHalfDepth * j) / 20;
        rays += 1;
        const hit = firstHit(new THREE.Vector3(x, -200, z), new THREE.Vector3(0, 1, 0), targets);
        const name = hit?.object.name ?? 'nothing';
        if (name === 'port-mouth') mouthFirst += 1;
        if (name === 'port-tongue') tongueFirst += 1;
        if (!allowed.includes(name) && reachingPast.length < 8) {
          reachingPast.push(`(${x.toFixed(2)}, ${z.toFixed(2)})=${name}`);
        }
      }
    }
    expect(rays).toBeGreaterThan(400);
    expect(
      reachingPast,
      `a sightline from below the mouth reaches past every port surface at ${reachingPast.join(', ')}`,
    ).toEqual([]);
    // The counts are asserted, not just the empty list: a grid that stopped
    // running would report the same empty failure list as a covered mouth.
    expect(mouthFirst, 'no sightline from below meets the mouth plate at all').toBeGreaterThan(100);
    expect(tongueFirst, 'no sightline from below meets the tongue').toBeGreaterThan(10);
  });
});
