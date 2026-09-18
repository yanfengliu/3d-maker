import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { BODY, BORE_PROUD, RAIL, USB_C } from './dims.js';
import { buildBottom, buildHousing } from './parts.js';
import { materials, required, worldBox } from './test-helpers.js';

/**
 * The USB-C port as a through-cut: the opening, the planes that surround it and
 * the tongue inside it. The *shape* of the aperture the eye reads is
 * `aperture.test.ts`'s subject.
 *
 * The defect this file was written for: `slabGeometry` pushes a slot into
 * `shape.holes` and extrudes it through the whole slab, so a port cut that way
 * is a through-hole by construction — the port read as a dark slot in the front
 * and back silhouettes as well as in the bottom one, and the tongue that was
 * supposed to be visible inside it sat behind the liner's floor. The ±Z sweep,
 * the Y- and Z-plane pairs and the tongue's sightline below are that class'
 * gates. Where this round's build moved a surface they are re-expressed — never
 * weakened — and each says so where it changed.
 *
 * The bounds are literals, not the constants the parts are placed with: a gate
 * built from the same symbol as its subject proves only that the code agrees
 * with itself. `USB_C`, `BORE_PROUD` and `BODY` appear only where a
 * *documented* number is the subject — the mouth the design promises — and
 * never as a bound on whether the built thing crosses a surface.
 */
describe('the USB-C port', () => {
  /** How far a port surface may sit off the frame's own face and still count as
   *  reaching it. The shell is deliberately inside the face, so this is loose
   *  enough to accept that and tight enough that a shell which stopped even a
   *  twentieth of a millimetre short — let alone the whole 8.75 mm depth the
   *  old through-cut left — goes red. */
  const FACE_REACH = 0.05;
  /** The smallest separation two port surfaces may have and still be called
   *  non-coplanar. Two faces on one plane fight for the same depth samples, and
   *  the register's black and speckled button pills came of exactly that. */
  const MIN_SEPARATION = 0.005;
  /** Faces of everything the port puts in the frame's way: the points that
   *  decide whether they share a plane with each other or with the frame.
   *  `port-mouth` and `port-mouth-plate` joined this list with the round that
   *  built them: a part left out of it is a part neither coplanarity gate
   *  measures. */
  const PORT_PARTS = [
    'port-shell-front',
    'port-shell-back',
    'port-mouth',
    'port-mouth-plate',
    'port-cavity',
    'port-cavity-ceiling',
    'port-tongue',
  ] as const;
  /** The mouth as `dims.ts` documents it: 8.4 mm across and 3.2 mm up from the
   *  rail's bottom face. The gates below sample *this* footprint rather than the
   *  implementation's, which is how the 0.65 mm band the round-6 build left open
   *  stayed invisible: that build passed the mouth's height into a field
   *  `slabGeometry` used as a radius, so the cut was a 6.4 mm circle and the
   *  footprint it actually cut was nothing like this one. */
  const mouthHalfWidth = USB_C.width / 2;
  const mouthTop = -RAIL.y + USB_C.height;
  const railBottom = -RAIL.y;

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

  /** One face of one part: the plane it lies on and the box it occupies. */
  interface Face {
    readonly label: string;
    readonly at: number;
    readonly box: THREE.Box3;
  }

  /**
   * The pairs of faces that overlap in plan, and the ones closer than
   * `MIN_SEPARATION` on the axis `at` measures.
   *
   * The two coplanarity gates below are one rule on two axes, and this is the
   * rule: two surfaces only fight for depth samples where they can both be
   * drawn, so a pair whose boxes do not overlap in the other two axes is
   * skipped. Sharing the walk keeps the two gates the same rule; each still
   * asserts its own pair count, so neither can pass by comparing nothing.
   */
  function coplanarity(
    faces: readonly Face[],
    plan: (box: THREE.Box3) => readonly [number, number, number, number],
  ): { readonly compared: number; readonly tooClose: readonly string[] } {
    const tooClose: string[] = [];
    let compared = 0;
    const slack = 1e-4;
    for (let a = 0; a < faces.length; a += 1) {
      for (let b = a + 1; b < faces.length; b += 1) {
        const left = faces[a];
        const right = faces[b];
        if (left === undefined || right === undefined) continue;
        const [lx0, lx1, ly0, ly1] = plan(left.box);
        const [rx0, rx1, ry0, ry1] = plan(right.box);
        if (lx0 >= rx1 - slack || rx0 >= lx1 - slack) continue;
        if (ly0 >= ry1 - slack || ry0 >= ly1 - slack) continue;
        compared += 1;
        const gap = Math.abs(left.at - right.at);
        if (gap < MIN_SEPARATION) {
          tooClose.push(`${left.label} and ${right.label} are ${gap.toFixed(4)} mm apart`);
        }
      }
    }
    return { compared, tooClose };
  }

  /** Every face of a part along one axis, as `Face`s. */
  function facesOf(bottom: THREE.Object3D, axis: 'y' | 'z'): Face[] {
    const faces: Face[] = [];
    for (const name of PORT_PARTS) {
      const box = worldBox(required(bottom, name));
      faces.push({ label: `${name}-low`, at: axis === 'y' ? box.min.y : box.min.z, box });
      faces.push({ label: `${name}-high`, at: axis === 'y' ? box.max.y : box.max.z, box });
    }
    return faces;
  }

  it('seals the through-cut along Z at every point of the mouth', () => {
    // (a) The gate the old one only looked like. A ray along -Z and a ray along
    // +Z are cast at every sample of the mouth's documented opening — its whole
    // 8.4 x 3.2 rectangle, corners included — through the housing *and* the
    // bottom assembly. A sample where either comes back empty is a line of sight
    // that crosses the phone's whole depth: the through-cut is open there.
    //
    // Re-expressed, not weakened: with the frame's notch real (`aperture.test.ts`
    // measures it) the sample where y = -75.000 enters the pocket through the
    // notch instead of meeting the frame's own floor, and the parts that close it
    // there are `port-mouth` and the shell plates. The claim is unchanged — no
    // line of sight crosses the body.
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
        const y = railBottom + ((mouthTop - railBottom) * j) / steps;
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
    //
    // Measured on this build the plates are wider than the mouth — 9.6 mm, where
    // the notch's opening at the frame's faces measures 9.12 mm across (its
    // walls sit at x = ±4.56 there against ±4.2 at the rail plane) and 3.2 mm
    // tall (from -74.64 to -71.44) — because the chamfer's bevel grows material
    // into the notch over its last 0.36 mm of depth. Their outer faces stop
    // `PORT_INSET` — 0.02 mm — inside the frame's, which is what keeps the plate
    // off the frame's own face plane where the two overlap in plan.
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
      const front = plate.name === 'port-shell-front';
      const face = front ? frame.max.z : frame.min.z;
      const reached = plate.box === null ? null : front ? plate.box.max.z : plate.box.min.z;
      const gap = reached === null ? Infinity : Math.abs(face - reached);
      expect(
        gap,
        `the port does not reach the frame's ${front ? 'front' : 'back'} face at all — the cut is still open through the phone`,
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
    // (b) The axis the coplanarity gate could not see, and the one the original
    // defect lived on: the liner's floor had its top face on y = -75.0000 and
    // the rail's bottom face is y = -75.0000 — a gap of 0.0000 exactly.
    //
    // Re-expressed: the floor no longer lives under the rail at all. It is
    // inside the pocket, above the rail's bottom face, and the part that meets
    // the rail plane is `port-mouth`, which stands `BORE_PROUD` off it — the
    // same stand-off every bore mouth on this edge uses. Both claims are
    // asserted below, after the pairwise walk that is the original gate.
    //
    // Measured on this build: 85 pairs overlap in plan and the smallest gap
    // between any two of them is 0.0060 mm — the rail's bottom face against the
    // front shell plate's lower edge, which sits at `shell.base` = 0.01 mm less
    // the 0.004 mm bevel `slabGeometry` grows its outline by, and still clears
    // the 0.005 mm this gate calls coplanar. The count is asserted too, so a
    // build whose port parts stopped overlapping in plan cannot pass by
    // comparing nothing.
    const bottom = buildBottom(materials);
    const railBottomFace: Face = {
      label: 'rail-bottom',
      at: railBottom,
      // The rail's bottom face is the whole body's: the frame's own box, which
      // is measured rather than written from `BODY`.
      box: worldBox(buildHousing(materials)),
    };
    const { compared, tooClose } = coplanarity(
      [railBottomFace, ...facesOf(bottom, 'y')],
      (box) => [box.min.x, box.max.x, box.min.z, box.max.z],
    );
    expect(
      tooClose,
      `the port has a coplanar pair of Y planes: ${tooClose.join(', ')}`,
    ).toEqual([]);
    expect(compared, 'no pair of Y planes overlaps in plan, so this gate proves nothing').toBeGreaterThan(8);
    // The liner's floor is the surface that carried the defect: it is inside the
    // pocket now, so its lowest face sits *above* the rail's bottom face rather
    // than on it.
    const floor = worldBox(required(bottom, 'port-cavity'));
    expect(
      floor.min.y,
      `the liner's floor reaches ${(floor.min.y - railBottom).toFixed(4)} mm below the rail's bottom face — the surface the bottom view read as a hard dark frame`,
    ).toBeGreaterThan(railBottom + MIN_SEPARATION);
    // And the mouth plate is the port's lowest surface, standing off the rail by
    // `BORE_PROUD`: no further, or it reads as a lip under the phone.
    const mouth = worldBox(required(bottom, 'port-mouth'));
    const standOff = railBottom - mouth.min.y;
    expect(
      standOff,
      `the mouth plate stands ${standOff.toFixed(4)} mm off the rail, where a bore mouth's stand-off is ${String(BORE_PROUD)} mm`,
    ).toBeGreaterThan(0);
    expect(standOff).toBeLessThanOrEqual(BORE_PROUD + 0.001);
  });

  it('gives the tongue a sightline through the mouth', () => {
    // (c) The gate that would have caught an invisible tongue. Rays are cast
    // upward from below the phone at every sample of the mouth's documented
    // opening, and the *first* part each one meets is named. Before the round
    // that added this gate the liner's floor was the first hit for every ray:
    // its top face was on the rail's bottom face and it covered the mouth, so
    // the tongue was 0 hits out of 441 and the port read as a dark hole.
    //
    // Measured now: 30 of 441 rays meet the tongue first; the rest meet the
    // mouth plate (266), the pocket's floor (61), the dark plate behind the
    // aperture (42) or the frame's own notch (42). Re-expressed, not weakened:
    // the mouth plate, the dark plate and the frame's notch are surfaces the
    // mouth now has or opens through, and every one of them is the port's own —
    // the claim is still that sightlines from below reach the tongue.
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
    // Measured: 15 of 441 rays reach the tongue first at 10 degrees below the
    // bottom face and 45 at 30.
    for (const degrees of [10, 30]) {
      const radians = (degrees * Math.PI) / 180;
      const direction = new THREE.Vector3(0, Math.sin(radians), Math.cos(radians));
      let seen = 0;
      for (let i = 0; i <= steps; i += 1) {
        for (let j = 0; j <= steps; j += 1) {
          const x = -mouthHalfWidth + (2 * mouthHalfWidth * i) / steps;
          const y = railBottom + (USB_C.height * j) / steps;
          const from = new THREE.Vector3(x, y, BODY.halfDepth).addScaledVector(direction, -40);
          if (firstHit(from, direction, targets)?.object.name === 'port-tongue') seen += 1;
        }
      }
      expect(
        seen,
        `no ray at ${String(degrees)} degrees below the phone's bottom face reaches the tongue`,
      ).toBeGreaterThan(0);
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
    // (d) The class the collapsed rail belonged to, and the one no gate in this
    // file could see. `blockGeometry` lays a block out from its min/max corners
    // and cannot reject a reversed pair: `BoxGeometry` is symmetric in its
    // width, and `roundBoxVertices` then shrinks the box to its rounding radius,
    // so a block handed `min.x > max.x` is built without complaint as a sliver.
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

  it('leaves no two port surfaces on one Z plane', () => {
    // (e) The z-fight class, on the axis the port's earliest gates did check.
    // Every face of every port part that points along Z is measured against the
    // frame's own two faces, and the parts' faces against each other: two port
    // surfaces level with one another, or one of them level with the frame, is
    // the pair that renders as speckled patches across the port. Measured on
    // this build: 96 pairs overlap in plan, the closest of them 0.0200 mm apart
    // — the front shell plate's outer face against the frame's own front face,
    // which is `PORT_INSET` itself.
    //
    // As above, a pair whose surfaces do not overlap in the X-Y plane is
    // skipped: the liner's floor and ceiling are both 9 mm wide and end on the
    // same two Z planes, but one is below the mouth and one above it, so no
    // sample of the mouth belongs to both.
    const bottom = buildBottom(materials);
    const frame = worldBox(buildHousing(materials));
    const faces: Face[] = facesOf(bottom, 'z');
    faces.push({ label: 'frame-front', at: frame.max.z, box: frame });
    faces.push({ label: 'frame-back', at: frame.min.z, box: frame });
    const { compared, tooClose } = coplanarity(
      faces,
      (box) => [box.min.x, box.max.x, box.min.y, box.max.y],
    );
    expect(
      tooClose,
      `the port has a coplanar pair of Z planes: ${tooClose.join(', ')}`,
    ).toEqual([]);
    expect(compared, 'no pair of Z planes overlaps in plan, so this gate proves nothing').toBeGreaterThan(4);
  });
});
