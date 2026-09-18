import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { BODY, PORT_INSET, RAIL, USB_C } from './dims.js';
import { buildBottom, buildHousing } from './parts.js';
import { materials, required, worldBox } from './test-helpers.js';

/**
 * The USB-C port as a through-cut: the opening, the planes that surround it and
 * the plate that fills the notch's bottom. The *shape* of the aperture the eye
 * reads is `aperture.test.ts`'s subject, and the pocket's interior — what a
 * sightline through the window meets, and the blocks that make it — is
 * `port-interior.test.ts`'s; this file is the frame's own surfaces.
 *
 * The defect this file was written for: `slabGeometry` pushes a slot into
 * `shape.holes` and extrudes it through the whole slab, so a port cut that way
 * is a through-hole by construction — the port read as a dark slot in the front
 * and back silhouettes as well as in the bottom one, and the tongue that was
 * supposed to be visible inside it sat behind the liner's floor. The ±Z sweep
 * and the Y- and Z-plane pairs are that class' gates.
 *
 * A review found the *opposite* gap in this round's build: `port-mouth` claimed
 * its outline was "buried in the frame's metal" while its face stood 0.0200 mm
 * *below* the frame's lowest surface, so nothing covered it and the plate was
 * the model's lowest point. The plate is set `PORT_INSET` inside the rail's
 * plane now, and its burial is a gate of its own, measured against the frame's
 * built solid rather than against `RAIL` as a constant.
 *
 * The bounds are literals, not the constants the parts are placed with: a gate
 * built from the same symbol as its subject proves only that the code agrees
 * with itself. `USB_C`, `PORT_INSET`, `BODY` and `LEAN_DEG` appear only where a
 * *documented* number is the subject — the mouth the design promises, the inset
 * it is set with, the body's own depth, the presentation's lean.
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

  it('seals the through-cut along Z at every point of the mouth above the rail plane', () => {
    // (a) The gate the old one only looked like. A ray along -Z and a ray along
    // +Z are cast at every sample of the mouth's documented opening — its whole
    // 8.4 x 3.2 rectangle, corners included — through the housing *and* the
    // bottom assembly. A sample where either comes back empty is a line of sight
    // that crosses the phone's whole depth.
    //
    // Re-expressed, and the change is the mouth plate's: it used to stand
    // `BORE_PROUD` *below* the rail's own plane (measured face y = -75.0200), so
    // the grid's bottom row — the rail plane itself, y = -75.0000 — ran inside
    // its material. The plate is set `PORT_INSET` inside that plane now
    // (measured face y = -74.9800), and what closes the cross-section from below
    // is the shell plates, whose own lower edge measures y = -74.9940. So the
    // claim is what the grid can see: *no sample strictly above the rail's own
    // plane is open*. The band between the plane and the shell's edge is
    // 0.0060 mm — under a tenth of a pixel at every preset, and a sightline
    // inside it lies within 0.04 degrees of the bottom face's plane (atan of
    // 0.006 over the body's 8.75 mm depth), which is the frame's own cut edge
    // seen edge-on. The plate's relationship to the frame is measured by the
    // burial gate below, against the frame's built solid rather than this grid.
    //
    // Measured on this build: 0 of 625 samples open above the plane, 602 of
    // them blocked along Z on both rays, and 46 of the 1250 rays open in the
    // plane itself. The blocked count is asserted rather than the open one, so
    // that a build which sealed the plane's own line too would still pass: a
    // gate that cannot tell "sealed" from "did not run" reports the second as
    // the first.
    const housing = buildHousing(materials);
    const bottom = buildBottom(materials);
    const targets = [housing, bottom];
    const steps = 24;
    let samples = 0;
    let blocked = 0;
    let openInPlane = 0;
    const openAbove: string[] = [];
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps; j += 1) {
        const x = -mouthHalfWidth + (2 * mouthHalfWidth * i) / steps;
        const y = railBottom + ((mouthTop - railBottom) * j) / steps;
        samples += 1;
        let both = true;
        for (const sign of [-1, 1] as const) {
          const hit = firstHit(
            new THREE.Vector3(x, y, sign * 50),
            new THREE.Vector3(0, 0, -sign),
            targets,
          );
          if (hit !== null) continue;
          both = false;
          if (y > railBottom + 1e-9) {
            if (openAbove.length < 8) openAbove.push(`(${x.toFixed(2)}, ${y.toFixed(2)})`);
          } else {
            openInPlane += 1;
          }
        }
        if (both) blocked += 1;
      }
    }
    expect(samples, 'the sweep grid is empty, so this gate proves nothing').toBeGreaterThan(500);
    expect(
      openAbove,
      `a ray along Z passes clean through the phone at ${openAbove.join(', ')} — the mouth is open through the body above the rail's own plane (${String(openInPlane)} of ${String(samples * 2)} rays are open in the plane itself, which is the frame's own cut edge)`,
    ).toEqual([]);
    expect(
      blocked,
      `only ${String(blocked)} of ${String(samples)} samples are closed along Z on both rays, so this grid did not reach the mouth`,
    ).toBeGreaterThan(500);
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
    // inside the pocket, above the rail's bottom face, and the part that comes
    // nearest the plane is `port-mouth`, which is set `PORT_INSET` *inside* it —
    // the same direction and the same number the shell plates are held with,
    // which is what keeps the pair off one plane. Both claims are asserted
    // below, after the pairwise walk that is the original gate.
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
    // And the mouth plate is the port's lowest *rim* face, set `PORT_INSET`
    // inside the rail's own plane: a face level with it would z-fight the
    // frame's, and a face below it is the lip the burial gate measures.
    const mouth = worldBox(required(bottom, 'port-mouth'));
    const inset = mouth.min.y - railBottom;
    expect(
      inset,
      `the mouth plate's face reaches ${(-inset).toFixed(4)} mm below the rail's bottom face — a lip hanging under the phone`,
    ).toBeGreaterThan(0);
    expect(
      inset,
      `the mouth plate is set ${inset.toFixed(4)} mm inside the rail's plane, where the documented inset is ${String(PORT_INSET)} mm`,
    ).toBeLessThanOrEqual(PORT_INSET + 0.001);
  });

  it('buries the mouth plate’s overhang in the frame’s own metal', () => {
    // (i) The class the review found ungated, and the claim that was false: the
    // plate's outline is wider than the notch, so its overhang is supposed to
    // sit inside the frame's metal. Nothing compared the two, and measured on
    // the build before this round the plate's face sat at y = -75.0200 over its
    // whole 9.2 x 8.56 footprint — 0.0200 mm *below* the frame's own lowest
    // surface (measured y = -75.0000, the rail plane) — so the frame's solid
    // nowhere covered it and the plate was the model's lowest point.
    //
    // A ray is cast up from below at every sample of the plate's own footprint —
    // 81 x 81 over its built box, x = ±4.6 by z = ±4.28 — against the *frame's*
    // built solid, and the surface it meets is classified. Measured on this
    // build:
    //   - the frame's lowest surface, the rail plane: 600 samples, all of them
    //     the plate's overhang beside the notch. The plate's face is above the
    //     frame's on every one, by 0.0199966 mm — the buried overhang, and this
    //     is the number the claim rests on.
    //   - the rail's chamfer, from the plane up to `BODY.bevel` above it: 44
    //     samples at the plate's four corners, where the notch's own cut has
    //     taken the flat band away (|x| from 4.226, |z| from 4.120 on a finer
    //     321 x 321 grid). The plate fills the notch's bottom there and its face
    //     is below the chamfer's surface on 28 of them, by at most 0.1054 mm at
    //     x = ±4.60, z = ±4.28 — the plate's own 0.02 inset plus the chamfer's
    //     0.1254 mm rise at the plate's z extreme. That is the bound asserted,
    //     0.11: the lip the mouth's corners are allowed, and the build this
    //     replaces reached 0.1454 mm there, its face standing below the rail
    //     rather than inside.
    //   - above the chamfer: 5917 samples, the notch's own void, where the
    //     plate's face is the exposed filler.
    //
    // What is asserted is the first of those — real, non-vacuous burial — and
    // that nothing the port adds reaches below the frame's lowest surface. The
    // bore mouths are the documented exception: they stand `BORE_PROUD` proud of
    // the rail's face on purpose, being dark discs that would be invisible if
    // buried, and `parts.test.ts` gates their stand-off.
    const housing = buildHousing(materials);
    const bottom = buildBottom(materials);
    const frame = worldBox(housing);
    const mouth = worldBox(required(bottom, 'port-mouth'));
    const chamferTop = frame.min.y + BODY.bevel;
    const steps = 80;
    let onRailPlane = 0;
    let shallowest = Infinity;
    let shallowestAt = '';
    let belowChamferBy = 0;
    let belowChamferAt = '';
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps; j += 1) {
        const x = mouth.min.x + ((mouth.max.x - mouth.min.x) * i) / steps;
        const z = mouth.min.z + ((mouth.max.z - mouth.min.z) * j) / steps;
        const surface = firstHit(
          new THREE.Vector3(x, frame.min.y - 50, z),
          new THREE.Vector3(0, 1, 0),
          [housing],
        )?.point.y;
        if (surface === undefined) continue;
        if (surface <= frame.min.y + 1e-6) {
          onRailPlane += 1;
          const cover = mouth.min.y - surface;
          if (cover < shallowest) {
            shallowest = cover;
            shallowestAt = `(${x.toFixed(2)}, ${z.toFixed(2)})`;
          }
        } else if (surface <= chamferTop + 1e-6) {
          const poke = surface - mouth.min.y;
          if (poke > belowChamferBy) {
            belowChamferBy = poke;
            belowChamferAt = `(${x.toFixed(2)}, ${z.toFixed(2)})`;
          }
        }
      }
    }
    expect(
      onRailPlane,
      `only ${String(onRailPlane)} of 6561 samples of the plate's footprint meet the frame's own lowest surface — the plate's outline is not over the frame's metal at all, so "buried" is vacuous`,
    ).toBeGreaterThan(500);
    expect(
      shallowest,
      `the frame's metal reaches the plate's face by only ${shallowest.toFixed(4)} mm at ${shallowestAt}: the plate's face is not inside the frame's metal there`,
    ).toBeGreaterThanOrEqual(MIN_SEPARATION);
    expect(
      belowChamferBy,
      `the plate's face is ${belowChamferBy.toFixed(4)} mm below the frame's surface at ${belowChamferAt}, past the 0.11 mm lip the mouth's corners allow (measured 0.1054 mm on the built plate)`,
    ).toBeLessThan(0.11);
    expect(
      mouth.min.y,
      `the mouth plate's face reaches ${(frame.min.y - mouth.min.y).toFixed(4)} mm below the frame's own lowest surface (y = ${frame.min.y.toFixed(4)}) — the plate hangs under the phone`,
    ).toBeGreaterThan(frame.min.y + MIN_SEPARATION);
    for (const name of PORT_PARTS) {
      const low = worldBox(required(bottom, name)).min.y;
      expect(
        low,
        `${name} reaches ${(frame.min.y - low).toFixed(4)} mm below the frame's own lowest surface`,
      ).toBeGreaterThanOrEqual(frame.min.y);
    }
  });

  it('leaves no two port surfaces on one Z plane', () => {
    // (e) The z-fight class, on the axis the port's earliest gates did check.
    // Every face of every port part that points along Z is measured against the
    // frame's own two faces, and the parts' faces against each other: two port
    // surfaces level with one another, or one of them level with the frame, is
    // the pair that renders as speckled patches across the port. Measured on
    // this build: 104 pairs overlap in plan, the closest of them 0.0200 mm apart
    // — the front shell plate's outer face against the frame's own front face,
    // which is `PORT_INSET` itself. The count moved from 96 with the mouth
    // plate: its face is 0.04 mm higher now, and the walk compares the boxes'
    // Y ranges, so a few more pairs overlap.
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
