import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { BODY, RAIL, USB_C } from './dims.js';
import { buildBottom, buildHousing } from './parts.js';
import { materials, required, worldBox } from './test-helpers.js';

/**
 * The USB-C port, which is the one part of the phone a through-cut cannot
 * describe.
 *
 * The defect: `slabGeometry` pushes the slot into `shape.holes` and extrudes it
 * through the whole slab, so the housing's cut is a through-hole *by
 * construction*. The port therefore read as a dark slot in the front and back
 * silhouettes as well as in the bottom one — "why is the usbc port on the back
 * instead of at the bottom?" — and the tongue that was supposed to be seen
 * inside it sat entirely inside the line of the liner's floor, which every
 * upward ray met first.
 *
 * The round-6 gates passed while both of those were true, and what they missed
 * is the shape of the failure rather than its size:
 *
 *  - The "closes the through-cut" gate compared the two shell plates' extreme Z
 *    against the frame's faces. Both plates touched their face, so it was green,
 *    and it never asked what the two plates left *between* them: measured, the
 *    build had a 0.65 mm band of the mouth's 3.2 mm covered by nothing, and a
 *    ray along -Z crossed the phone's whole 8.75 mm depth through it. The sweep
 *    below asks that question directly, at 625 samples over the mouth's own
 *    documented footprint.
 *  - The coplanarity gate only ever compared Z planes. The liner's floor had its
 *    top face on y = -75.0000 and the rail's bottom face is y = -75.0000 — a
 *    coplanar pair with a gap of 0.0000 exactly, and the port's floor was the
 *    first thing every upward sightline met. The Y-plane gate below is the axis
 *    it could not see.
 *  - Nothing ever asked whether the tongue could be *seen*. The sweep below
 *    casts rays up through the mouth's opening and names the first part each one
 *    meets, so an invisible tongue is a red gate rather than a rendered one.
 *  - Nothing checked that a block was *solid*. `blockGeometry` cannot reject a
 *    reversed min/max pair, so the floor's left rail came out 0.002 mm wide and
 *    the mouth's left flank had no liner under it; the Y- and Z-plane gates
 *    skipped the pairs the collapsed box no longer overlapped. The extent and
 *    coverage gate below is that class.
 *
 * The bounds are literals, not the constants the parts are placed with: a gate
 * built from the same symbol as its subject only proves the code agrees with
 * itself. `PORT_POCKET`, `USB_C` and `BODY` appear only where a *documented*
 * number is the subject — the mouth the design promises — and never as a bound
 * on whether the built thing crosses a surface.
 */
describe('the USB-C port', () => {
  /** How far a port surface may sit off the frame's own face and still count as
   *  reaching it. The shell is deliberately `PORT_INSET` (0.02 mm) inside the
   *  face, so this is loose enough to accept that and tight enough that a shell
   *  that stopped even a twentieth of a millimetre short — let alone the whole
   *  8.75 mm depth the old through-cut left — goes red. */
  const FACE_REACH = 0.05;
  /** The smallest separation two port surfaces may have and still be called
   *  non-coplanar. Two faces on one plane fight for the same depth samples, and
   *  the register's black and speckled button pills came of exactly that. */
  const MIN_SEPARATION = 0.005;
  /** Faces of everything the port puts in the frame's way: the points that
   *  decide whether they share a plane with each other or with the frame. */
  const PORT_PARTS = [
    'port-shell-front',
    'port-shell-back',
    'port-cavity',
    'port-cavity-ceiling',
    'port-tongue',
  ] as const;
  /** The mouth as `dims.ts` documents it: 8.4 mm across and 3.2 mm up from the
   *  rail's bottom face. The gates below sample *this* footprint rather than the
   *  implementation's, which is how the 0.65 mm band the old build left open
   *  stayed invisible: `parts.ts` passed the mouth's height into a field
   *  `slabGeometry` used as a radius, so the cut was a 6.4 mm circle and the
   *  footprint it actually cut was nothing like this one. */
  const mouthHalfWidth = USB_C.width / 2;
  const mouthTop = -RAIL.y + USB_C.height;

  /** The first port part a ray meets, or null when it meets none. */
  function firstHit(
    from: THREE.Vector3,
    direction: THREE.Vector3,
    targets: readonly THREE.Object3D[],
  ): THREE.Intersection | null {
    const caster = new THREE.Raycaster(from, direction);
    const hits = caster.intersectObjects([...targets], true);
    return hits[0] ?? null;
  }

  it('seals the through-cut along Z at every point of the mouth', () => {
    // (a) The gate the old one only looked like. A ray along -Z and a ray along
    // +Z are cast at every sample of the mouth's documented opening — its whole
    // 8.4 x 3.2 rectangle, corners included — through the housing *and* the
    // bottom assembly. A sample where either comes back empty is a line of sight
    // that crosses the phone's whole depth: the through-cut is open there.
    //
    // The count is reported, because a gate that cannot tell "sealed" from "did
    // not run" reports the second as the first: an empty sweep grid passes
    // vacuously, and 625 samples is the number that says the grid ran. Measured
    // on this build: 0 open samples of 625.
    const housing = buildHousing(materials);
    const bottom = buildBottom(materials);
    const targets = [housing, bottom];
    const steps = 24;
    let samples = 0;
    const open: string[] = [];
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps; j += 1) {
        const x = -mouthHalfWidth + (2 * mouthHalfWidth * i) / steps;
        const y = -RAIL.y + ((mouthTop + RAIL.y) * j) / steps;
        samples += 1;
        for (const sign of [-1, 1] as const) {
          const hit = firstHit(
            new THREE.Vector3(x, y, sign * 50),
            new THREE.Vector3(0, 0, -sign),
            targets,
          );
          if (hit === null && open.length < 8) open.push(`(${x.toFixed(2)}, ${y.toFixed(2)})`);
        }
      }
    }
    expect(samples, 'the sweep grid is empty, so this gate proves nothing').toBeGreaterThan(500);
    expect(
      open,
      `a ray along Z passes clean through the phone at ${open.join(', ')} — the mouth is open through the body`,
    ).toEqual([]);
  });

  it('closes the through-cut at both of the frame’s faces', () => {
    // The old gate, kept: it is the one that pins each plate to the face it
    // hides. It is no longer the whole of (a) — see the sweep above — but a
    // plate that stopped short of its face is a different defect from a gap
    // between the plates, and this is what catches it.
    const frame = worldBox(buildHousing(materials));
    const bottom = buildBottom(materials);
    const shell = worldBox(required(bottom, 'port-shell'));
    // Measured by name, and absence handled rather than thrown: a plate that
    // was never built leaves the shell's own depth short, and the assertion
    // below says so where a lookup error would only say the name is missing —
    // an error is not a red gate.
    const plates = ['port-shell-front', 'port-shell-back'].map((name) => {
      const found = bottom.getObjectByName(name);
      return { name, box: found === undefined ? null : worldBox(found) };
    });
    for (const plate of plates) {
      const face = plate.name === 'port-shell-front' ? frame.max.z : frame.min.z;
      const gap = plate.box === null ? Infinity : Math.abs(face - (plate.name === 'port-shell-front' ? plate.box.max.z : plate.box.min.z));
      expect(
        gap,
        `the port does not reach the frame's ${plate.name === 'port-shell-front' ? 'front' : 'back'} face at all — the cut is still open through the phone`,
      ).toBeLessThanOrEqual(FACE_REACH);
    }
    // The two plates together span the frame's whole depth, which is what makes
    // the through-cut filled rather than merely capped at one end.
    expect(
      shell.max.z - shell.min.z,
      'the shell does not span the frame’s depth',
    ).toBeGreaterThan(2 * (BODY.halfDepth - FACE_REACH));
    // And each plate spans the port's whole width: a plate narrower than the
    // mouth leaves a slot either side of it.
    for (const plate of plates) {
      const width = plate.box === null ? 0 : plate.box.max.x - plate.box.min.x;
      expect(
        width,
        `the ${plate.name} shell plate does not span the slot's x-range`,
      ).toBeGreaterThanOrEqual(USB_C.width - 0.2);
    }
  });

  it('keeps every port Y plane off the rail’s and off each other', () => {
    // (b) The axis the coplanarity gate could not see, and the one the defect
    // lived on: the liner's floor had its top face on y = -75.0000 and the
    // rail's bottom face is y = -75.0000 — a gap of 0.0000 exactly.
    //
    // Every Y-facing plane of every port part is compared with the rail's own
    // bottom face and with each other. Two planes only fight for depth samples
    // where they can both be drawn, so a pair whose surfaces do not overlap in
    // the X-Z plane is skipped: the shell's two plates are the same outline at
    // the same two Y values, mirrored about the body's middle, and calling that
    // pair coplanar would be a false positive — they are 8.7 mm apart in Z and
    // no sample belongs to both.
    //
    // Measured on this build: 43 pairs overlap in plan and the smallest gap
    // between any two of them is 0.0080 mm, between a shell plate's top edge and
    // the liner ceiling's underside. The count is asserted too, so a build whose
    // port parts stopped overlapping in plan cannot pass by comparing nothing.
    const bottom = buildBottom(materials);
    interface Face {
      readonly label: string;
      readonly y: number;
      readonly box: THREE.Box3;
    }
    const railBottom: Face = {
      label: 'rail-bottom',
      y: -RAIL.y,
      // The rail's bottom face is the whole body's: the frame's own box, which
      // is measured rather than written from `BODY`.
      box: worldBox(buildHousing(materials)),
    };
    const faces: Face[] = [railBottom];
    for (const name of PORT_PARTS) {
      const box = worldBox(required(bottom, name));
      faces.push({ label: `${name}-low`, y: box.min.y, box });
      faces.push({ label: `${name}-high`, y: box.max.y, box });
    }
    const overlapsInPlan = (left: THREE.Box3, right: THREE.Box3, slack = 1e-4): boolean =>
      left.min.x < right.max.x - slack &&
      right.min.x < left.max.x - slack &&
      left.min.z < right.max.z - slack &&
      right.min.z < left.max.z - slack;
    let compared = 0;
    for (let a = 0; a < faces.length; a += 1) {
      for (let b = a + 1; b < faces.length; b += 1) {
        const left = faces[a];
        const right = faces[b];
        if (left === undefined || right === undefined) continue;
        if (!overlapsInPlan(left.box, right.box)) continue;
        compared += 1;
        const gap = Math.abs(left.y - right.y);
        expect(
          gap,
          `${left.label} and ${right.label} are ${gap.toFixed(4)} mm apart on Y — a coplanar pair`,
        ).toBeGreaterThanOrEqual(MIN_SEPARATION);
      }
    }
    expect(compared, 'no pair of Y planes overlaps in plan, so this gate proves nothing').toBeGreaterThan(8);
    // The liner's floor is the pair that was missed, named so the message says
    // which surface the number belongs to: its top face has to sit *below* the
    // rail's bottom face, not level with it.
    const floor = worldBox(required(bottom, 'port-cavity'));
    expect(
      floor.max.y,
      `the liner's floor top is ${(floor.max.y + RAIL.y).toFixed(4)} mm from the rail's bottom face — a coplanar pair`,
    ).toBeLessThanOrEqual(-RAIL.y - MIN_SEPARATION);
  });

  it('gives the tongue a sightline through the mouth', () => {
    // (c) The gate that would have caught an invisible tongue. Rays are cast
    // upward from below the phone at every sample of the mouth's documented
    // opening, and the *first* part each one meets is named. Before this round
    // the liner's floor was the first hit for every one of them: its top face
    // was on the rail's bottom face and it covered the mouth, so the tongue was
    // 0 hits out of 441 and the port read as a dark hole. Measured now: 111 of
    // 441 rays meet the tongue first, the rest the frame's metal (232) or the
    // dark liner (98).
    //
    // The count is what is asserted, not a bounding box: a tongue that is merely
    // inside the mouth's x and z range can still be behind the liner, and only
    // the ray says which of the two a sightline meets first.
    const housing = buildHousing(materials);
    const bottom = buildBottom(materials);
    const targets = [bottom, housing];
    let tongueFirst = 0;
    let samples = 0;
    const firsts = new Map<string, number>();
    const steps = 20;
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps; j += 1) {
        const x = -mouthHalfWidth + (2 * mouthHalfWidth * i) / steps;
        const z = -BODY.halfDepth + (2 * BODY.halfDepth * j) / steps;
        samples += 1;
        const hit = firstHit(new THREE.Vector3(x, -200, z), new THREE.Vector3(0, 1, 0), targets);
        const name = hit?.object.name ?? 'nothing';
        firsts.set(name, (firsts.get(name) ?? 0) + 1);
        if (name === 'port-tongue') tongueFirst += 1;
      }
    }
    const spread = [...firsts.entries()].map(([name, count]) => `${name}=${String(count)}`).join(' ');
    expect(samples).toBeGreaterThan(400);
    expect(
      tongueFirst,
      `only ${String(tongueFirst)} of ${String(samples)} upward rays through the mouth reach the tongue before anything else (first hits: ${spread})`,
    ).toBeGreaterThan(0);
    // And it has to read from the angles a port is actually looked at from, not
    // only from straight below the phone's bottom face: `bottom` in `views.ts`
    // arrives about 17 degrees below it, and the sweep harness goes lower.
    // Measured: 55 of 441 rays reach the tongue first at 10 degrees below the
    // bottom face and 156 at 30.
    for (const degrees of [10, 30]) {
      const radians = (degrees * Math.PI) / 180;
      const direction = new THREE.Vector3(0, Math.sin(radians), Math.cos(radians));
      let seen = 0;
      for (let i = 0; i <= steps; i += 1) {
        for (let j = 0; j <= steps; j += 1) {
          const x = -mouthHalfWidth + (2 * mouthHalfWidth * i) / steps;
          const y = -RAIL.y + (USB_C.height * j) / steps;
          const from = new THREE.Vector3(x, y, BODY.halfDepth).addScaledVector(direction, -40);
          if (firstHit(from, direction, targets)?.object.name === 'port-tongue') seen += 1;
        }
      }
      expect(
        seen,
        `no ray at ${String(degrees)} degrees below the phone's bottom face reaches the tongue`,
      ).toBeGreaterThan(0);
    }
    // The tongue's base sits below the floor's top face, so the two parts'
    // surfaces meet inside solid material rather than in a slit a ray could slip
    // between: the aperture the floor leaves is the tongue's own footprint, less
    // `overlap` all round, which is a claim about the built geometry rather than
    // about the plan.
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

  it('builds the liner and the shell from blocks that are solid and span the mouth', () => {
    // (d) The class the collapsed rail belonged to, and the one no gate in this
    // file could see. `blockGeometry` lays a block out from its min/max corners
    // and cannot reject a reversed pair: `BoxGeometry` is symmetric in its
    // width, and `roundBoxVertices` then shrinks the box to its rounding radius,
    // so a block handed `min.x > max.x` is built without complaint as a sliver.
    //
    // Measured before the fix: `port-cavity`'s left rail came out at x
    // ∈ [-3.601, -3.599] where the right one spans [3.000, 4.200], the mouth's
    // left flank x ∈ [-4.2, -3.0] had no liner floor under it at all, and 49 of
    // 625 upward samples over the mouth's footprint met the ceiling 3.2 mm above
    // instead. The Y- and Z-plane gates stayed green through all of it, because
    // each skips a pair whose boxes do not overlap in plan.
    //
    // So the extents are asserted rather than assumed: every block must be
    // positive in all three axes and at least the minimum it is documented with,
    // as literals with the built value in the comment — a bound built from its
    // own subject proves only that the code agrees with itself.
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
    // The shell plates: the mouth's 8.4 mm across, its 3.2 mm height less the
    // 0.012 mm they are held above the rail, and the 0.15 mm plate thickness.
    for (const name of ['port-shell-front', 'port-shell-back'] as const) {
      expectSolid(name, worldBox(required(bottom, name)), [8, 3, 0.1]);
    }
    // The ceiling: the mouth's own footprint in plan, 0.2 mm thick.
    expectSolid('port-cavity-ceiling', worldBox(required(bottom, 'port-cavity-ceiling')), [8, 0.1, 8]);
    // The tongue is a block on the same path, so it is measured too: 6.6 mm
    // across, 0.62 mm tall and 7.1 mm deep.
    expectSolid('port-tongue', worldBox(required(bottom, 'port-tongue')), [1, 0.1, 1]);
    // The floor's four blocks: the two side rails are 1.2 mm wide (the mouth's
    // 4.2 mm half-width less the aperture's 3.0), the two end bars 6.0 mm and
    // 1.6 / 0.5 mm, and all four are 0.02 mm thick and 8.6 mm deep.
    const floorBlocks: THREE.Box3[] = [];
    required(bottom, 'port-cavity').traverse((node) => {
      if (node instanceof THREE.Mesh) floorBlocks.push(worldBox(node));
    });
    expect(floorBlocks.length, `the port's floor is ${String(floorBlocks.length)} blocks, not four`).toBe(4);
    for (const [index, box] of floorBlocks.entries()) {
      expectSolid(`port-cavity-floor[${String(index)}]`, box, [1, 0.01, 0.45]);
    }

    // And the four blocks together have to cover the mouth's whole footprint in
    // plan, leaving only the aperture the tongue fills. The footprint is the
    // mouth's own 8.4 mm across by the liner's documented z reach (the frame's
    // 8.75 mm less its 0.075 mm inset) — the plate the mouth is looked through.
    const footprintHalfWidth = USB_C.width / 2;
    const footprintHalfDepth = 4.3;
    const tongue = worldBox(required(bottom, 'port-tongue'));
    const covers = (x: number, z: number): boolean =>
      floorBlocks.some(
        (box) => x >= box.min.x - 1e-3 && x <= box.max.x + 1e-3 && z >= box.min.z - 1e-3 && z <= box.max.z + 1e-3,
      );
    const steps = 24;
    let planSamples = 0;
    const uncovered: string[] = [];
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps; j += 1) {
        const x = -footprintHalfWidth + (2 * footprintHalfWidth * i) / steps;
        const z = -footprintHalfDepth + (2 * footprintHalfDepth * j) / steps;
        planSamples += 1;
        if (covers(x, z)) continue;
        // The one footprint the floor may leave open is the aperture, and it has
        // to lie inside the tongue's own footprint so the tongue seals it.
        const inAperture = x > tongue.min.x && x < tongue.max.x && z > tongue.min.z && z < tongue.max.z;
        if (!inAperture && uncovered.length < 8) uncovered.push(`(${x.toFixed(2)}, ${z.toFixed(2)})`);
      }
    }
    expect(planSamples).toBeGreaterThan(400);
    expect(
      uncovered,
      `the liner's floor leaves the mouth's footprint uncovered at ${uncovered.join(', ')} — a sightline there reaches past it`,
    ).toEqual([]);

    // The same claim by ray, on the grid 0.05 mm inside that footprint so a
    // sample cannot graze a block's own rounded corner: the first thing a
    // sightline from below meets is the liner's floor or the tongue, and never
    // the ceiling — a ray that reaches the ceiling has crossed the whole pocket
    // with no floor under it. This is the measurement that named the collapse:
    // the frame's metal and the shell plates are hits too, because the plate
    // behind the cut closes the footprint's rounded corners.
    const targets = [bottom];
    const allowed = ['port-cavity-floor', 'port-tongue', 'port-shell-front', 'port-shell-back'];
    const inset = 0.05;
    let rays = 0;
    let floorFirst = 0;
    let tongueFirst = 0;
    const reachingPast: string[] = [];
    for (let i = 0; i <= 20; i += 1) {
      for (let j = 0; j <= 20; j += 1) {
        const x = -(footprintHalfWidth - inset) + (2 * (footprintHalfWidth - inset) * i) / 20;
        const z = -(footprintHalfDepth - inset) + (2 * (footprintHalfDepth - inset) * j) / 20;
        rays += 1;
        const hit = firstHit(new THREE.Vector3(x, -200, z), new THREE.Vector3(0, 1, 0), targets);
        const name = hit?.object.name ?? 'nothing';
        if (name === 'port-cavity-floor') floorFirst += 1;
        if (name === 'port-tongue') tongueFirst += 1;
        if (!allowed.includes(name) && reachingPast.length < 8) {
          reachingPast.push(`(${x.toFixed(2)}, ${z.toFixed(2)})=${name}`);
        }
      }
    }
    expect(rays).toBeGreaterThan(400);
    expect(
      reachingPast,
      `a sightline from below crosses the liner's floor without meeting it at ${reachingPast.join(', ')}`,
    ).toEqual([]);
    // The count is asserted, not just the empty list: a grid that stopped
    // running would report the same empty failure list as a covered mouth.
    expect(floorFirst, 'no sightline from below meets the liner’s floor at all').toBeGreaterThan(100);
    expect(tongueFirst, 'no sightline from below meets the tongue').toBeGreaterThan(100);
  });

  it('leaves no two port surfaces on one Z plane', () => {
    // (e) The z-fight class, on the axis the port's earliest gates did check.
    // Every face of every port part that points along Z is measured against the
    // frame's own two faces, and the parts' faces against each other: two port
    // surfaces level with one another, or one of them level with the frame, is
    // the pair that renders as speckled patches across the port. Measured on
    // this build: 38 pairs overlap in plan, the closest of them 0.0200 mm apart
    // — `PORT_INSET` itself.
    //
    // As above, a pair whose surfaces do not overlap in the X-Y plane is
    // skipped: the liner's floor and ceiling are both 8.4 mm wide and end on the
    // same two Z planes, but one is below the mouth and one above it, so no
    // sample of the mouth belongs to both.
    const bottom = buildBottom(materials);
    const frame = worldBox(buildHousing(materials));
    interface Face {
      readonly label: string;
      readonly z: number;
      readonly box: THREE.Box3;
    }
    const faces: Face[] = [];
    for (const name of PORT_PARTS) {
      const box = worldBox(required(bottom, name));
      faces.push({ label: `${name}-front`, z: box.max.z, box }, { label: `${name}-back`, z: box.min.z, box });
    }
    faces.push({ label: 'frame-front', z: frame.max.z, box: frame });
    faces.push({ label: 'frame-back', z: frame.min.z, box: frame });
    const overlapsInPlan = (left: THREE.Box3, right: THREE.Box3, slack = 1e-4): boolean =>
      left.min.x < right.max.x - slack &&
      right.min.x < left.max.x - slack &&
      left.min.y < right.max.y - slack &&
      right.min.y < left.max.y - slack;
    let compared = 0;
    for (let a = 0; a < faces.length; a += 1) {
      for (let b = a + 1; b < faces.length; b += 1) {
        const left = faces[a];
        const right = faces[b];
        if (left === undefined || right === undefined) continue;
        if (!overlapsInPlan(left.box, right.box)) continue;
        compared += 1;
        const gap = Math.abs(left.z - right.z);
        expect(
          gap,
          `${left.label} and ${right.label} are ${gap.toFixed(4)} mm apart — a coplanar pair`,
        ).toBeGreaterThanOrEqual(MIN_SEPARATION);
      }
    }
    expect(compared, 'no pair of Z planes overlaps in plan, so this gate proves nothing').toBeGreaterThan(4);
  });
});
