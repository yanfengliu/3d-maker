import * as THREE from 'three';

import {
  BODY,
  BORE_PROUD,
  BOTTOM_BORES,
  PORT_CUT_RADIUS,
  PORT_INSET,
  PORT_POCKET,
  RAIL,
  USB_C,
} from './dims.js';
import { addMesh, blockGeometry, boreGeometry, slabGeometry } from './geometry.js';
import type { PhoneMaterials } from './materials.js';

/**
 * The phone's bottom edge: the USB-C port and the bores beside it.
 *
 * This is split out of `parts.ts` because the port is the one place in the
 * model where the frame's own construction works against it, and the argument
 * for how it is filled is longer than any other part's. `slabGeometry` cuts the
 * port's slot through the whole slab, so the housing's cut is a through-hole by
 * construction — the defect that put a dark USB-C slot on the phone's *back*,
 * where the real port is a blind recess.
 *
 * The frame's cut is kept anyway: it is the only thing that puts a real mouth
 * through the rail's chamfer, and it is what `buildHousing` in `parts.ts` cuts
 * with `PORT_CUT_INSET`. Everything behind that mouth is built here.
 */

/** A dark disc lying on an end edge, its face flush with the rail: the mouth of
 *  a bore. `direction` is the outward sign along Y, so the disc is pushed out
 *  by `BORE_PROUD` and no further — a fraction of a pixel, and nothing that can
 *  cross the silhouette the way a tube through the edge did. */
export function boreMouth(radius: number, x: number, direction: 1 | -1): THREE.BufferGeometry {
  const thickness = 0.12;
  const geometry = boreGeometry(radius, thickness, 16);
  geometry.translate(x, direction * (RAIL.y + BORE_PROUD - thickness / 2), 0);
  return geometry;
}

/** USB-C opening with a real pocket, five speaker bores to its right and five
 *  microphone bores to its left. No SIM tray: US eSIM.
 *
 *  The port opens *downward only*, and the parts below are what make that true
 *  rather than merely intended. Three of them cover the mouth's whole 8.4 x
 *  3.2 mm opening, from the rail to the mouth's top line — that is the property
 *  the earlier arrangement missed, and it is not a cosmetic one: it left a
 *  0.65 mm band of the opening covered by nothing, and a ray along -Z crossed
 *  the phone's whole 8.75 mm depth through it.
 *
 *  - `port-shell` is the frame's own aluminum: a `shellThickness` plate against
 *    each of the frame's faces, named together as one part because the shell is
 *    what closes the cut and both of its faces have to be measured. It spans the
 *    mouth's whole opening, so from the front and from the back the port's
 *    x-range reads as metal with a recess behind it instead of a slot through
 *    the phone.
 *  - `port-cavity` and `port-cavity-ceiling` (the `bore` material) are the
 *    pocket's dark liner — its floor and its ceiling. Both reach from the
 *    opening out to the frame's own faces, so the two ends of the through-cut
 *    are closed by liner as well as by the shell. The floor's top face sits
 *    below the rail's bottom face, and it is the floor's *aperture* — not the
 *    plate — that a sightline from below passes through.
 *  - `port-tongue` (polished steel) fills that aperture. It is the one bright
 *    surface in the port, which is what separates "recess with a connector in
 *    it" from "dark hole". Its footprint is wider than the aperture all round,
 *    so the two overlap and no ray can slip between them.
 *
 *  Three arrangements have been tried here, and the failures are worth keeping.
 *  A tongue inside a closed dark block was never visible from anywhere: the
 *  block's own faces were always in front of it. A floor plate across the whole
 *  mouth with its top face level with the rail's bottom face was the first thing
 *  every upward ray met, so the tongue was invisible again — and that floor was
 *  also a coplanar pair with the rail, which the z-plane gate could not see. A
 *  single block as large as the mouth reads as a dark lump stuck to the bottom
 *  of the phone, because the housing's cut is a *funnel*: narrowest at the
 *  frame's two faces, so a block wide enough to fill the mouth stands proud of
 *  the rail's chamfer at the mouth's front and back edges. All three failures
 *  are written down in `PORT_POCKET`, which is where the pocket's shape is
 *  measured. */
export function buildBottom(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'bottom';
  const rail = -RAIL.y;
  const pocket = PORT_POCKET;
  const liner = pocket.liner;
  /** The mouth's own outline — the rectangle `buildHousing` cuts, `USB_C.width`
   *  across and `USB_C.height` up from the rail — which every part here is
   *  measured from. */
  const mouthHalfWidth = USB_C.width / 2;
  const mouthTop = rail + USB_C.height;
  /** The liner's corner rounding: the cut's own, a hair inside it. The floor and
   *  ceiling carry the mouth's outline in plan, so their corners have to sit
   *  inside the frame's cut rather than at its edge, where a bevel would make
   *  them stand proud of the rail's bottom face. */
  const linerRadius = Math.max(0.01, PORT_CUT_RADIUS - PORT_INSET);
  /** How far the liner reaches along Z: the frame's own face, less `inset`. */
  const linerHalfDepth = BODY.halfDepth - liner.inset;

  // The shell: one plate against each of the frame's faces, closing the two
  // ends of the through-cut. Its outline is the mouth's and it spans the mouth's
  // opening from `plateBase` above the rail to the mouth's own top, so it covers
  // the cut at that depth and buries itself in the frame's metal around it. Its
  // outer face stops `PORT_INSET` inside the frame's own face, which is what
  // keeps the pair off one plane — a plate built from the *far* end takes a
  // negative `maxZ`, so that sign is what grows it towards the face it is meant
  // to hide. The 0.012 mm it leaves below itself is the rail's own bottom face's
  // distance from it, and the tongue and the liner cover that band.
  const shellFace = BODY.halfDepth - PORT_INSET;
  const shellBase = rail + pocket.plateBase;
  const plate = (parent: THREE.Object3D, name: string, outerZ: number): void => {
    addMesh(
      parent,
      slabGeometry({
        width: USB_C.width,
        height: mouthTop - shellBase,
        radius: USB_C.radius,
        maxZ: outerZ + (outerZ < 0 ? pocket.shellThickness : 0),
        thickness: pocket.shellThickness,
        bevel: 0.004,
        centreY: (mouthTop + shellBase) / 2,
      }),
      materials.aluminum,
      name,
      'aluminum',
      false,
    );
  };
  // One part, two plates: the shell is what closes the cut, so both of its
  // faces have to be measured against the frame's.
  const shell = new THREE.Group();
  shell.name = 'port-shell';
  group.add(shell);
  plate(shell, 'port-shell-front', shellFace);
  plate(shell, 'port-shell-back', -shellFace);

  // The pocket's dark liner: two horizontal plates, each the mouth's own
  // rounded rectangle in plan, each reaching the frame's own faces. Blocks
  // rather than slabs, and that is not a style choice: `slabGeometry` builds
  // its rounded rectangle in X and Y and extrudes it along Z, so a "flat plate"
  // written that way is a plate standing on edge at the body's mid-height,
  // nowhere near the port. The pocket's floor and ceiling are horizontal, so
  // they are blocks laid out by their corners.
  //
  // The floor is a plate with the tongue's footprint cut out of it, and the
  // aperture is what makes the tongue visible at all: the plate's top face sits
  // `drop` below the rail, so a sightline from below that passes inside the
  // aperture meets the tongue, and one that passes outside it meets dark liner
  // instead of the phone's interior. The plate is not built as one solid with a
  // hole because `blockGeometry` has no hole to give it; four blocks laid
  // around the aperture are the same surface and cannot leave a corner gap,
  // since they overlap at every corner.
  const linerTop = rail - liner.drop;
  const floorBottom = linerTop - liner.thickness;
  /** The floor is four blocks rather than one plate with a hole, because
   *  `blockGeometry` has no hole to give it: two side rails and the two end
   *  bars between them, sharing every corner so the aperture's outline is the
   *  plate's own. They are one part, named for what they are — the pocket's
   *  floor — because that is what the gates measure. */
  const plateGroup = new THREE.Group();
  plateGroup.name = 'port-cavity';
  /** Half the aperture, inside the tongue's own half-width by `overlap`, so the
   *  plate's inner edges and corners are buried in the tongue rather than
   *  touching them. */
  const overlap = 0.3;
  const apertureHalfWidth = pocket.tongue.halfWidth - overlap;
  const apertureZ = pocket.tongue.maxZ - overlap;
  const apertureNear = pocket.tongue.minZ + overlap;
  const floor = (min: readonly [number, number, number], max: readonly [number, number, number]): THREE.Mesh =>
    addMesh(plateGroup, blockGeometry(min, max, linerRadius), materials.bore, 'port-cavity-floor', 'bore', false);
  // Two side rails of the floor, each running the plate's whole depth, and the
  // two end bars between them. Every corner is shared by two blocks, so the
  // aperture's outline is the plate's own and cannot leave a corner gap.
  //
  // Each rail's two X ends are ordered per side rather than scaled by `side`:
  // the loop used to pass `side * mouthHalfWidth` as the *minimum* X for
  // `side = -1`, so `blockGeometry` was handed a 1.2 mm negative width.
  // `BoxGeometry` is symmetric in its width and `roundBoxVertices` then shrinks
  // the box to its rounding radius, so the block was built without complaint and
  // collapsed to x ∈ [-3.601, -3.599] — a 0.002 mm sliver of the 1.2 mm rail the
  // mouth's left flank needs. A sightline from below at x ∈ [-4.2, -3.0] met the
  // ceiling instead of a floor, and the Y- and Z-plane gates skipped every pair
  // the collapsed box no longer overlapped, so nothing went red.
  // `port.test.ts` now asserts each block's own extents and the floor's
  // coverage of the mouth, so a negative extent anywhere in this file is a
  // failing test rather than a silently missing surface.
  for (const side of [-1, 1] as const) {
    const inner = side * apertureHalfWidth;
    const outer = side * mouthHalfWidth;
    floor(
      [Math.min(inner, outer), floorBottom, -linerHalfDepth],
      [Math.max(inner, outer), linerTop, linerHalfDepth],
    );
  }
  for (const [zMin, zMax] of [
    [-linerHalfDepth, apertureNear],
    [apertureZ, linerHalfDepth],
  ] as const) {
    floor(
      [-apertureHalfWidth, floorBottom, zMin],
      [apertureHalfWidth, linerTop, zMax],
    );
  }
  group.add(plateGroup);

  // The ceiling is the floor's twin at the mouth's other edge: the same
  // thickness, the same z reach, the same x extent, set above the mouth's own
  // top. The two plates are then the tunnel's own cross-section, and the bottom
  // view reads one rounded rectangle. Before this the ceiling sat 1.5 mm above
  // the rail with a shorter z extent than the floor, so the two plates ended at
  // different depths, their openings did not line up, and the mouth rendered as
  // a black hexagon.
  const ceilingBottom = rail + liner.ceilingBase;
  addMesh(
    group,
    blockGeometry(
      [-mouthHalfWidth, ceilingBottom, -linerHalfDepth],
      [mouthHalfWidth, ceilingBottom + liner.ceilingThickness, linerHalfDepth],
      linerRadius,
    ),
    materials.bore,
    'port-cavity-ceiling',
    'bore',
    false,
  );

  // The connector tongue: the one lighter surface inside the port. Polished
  // steel rather than dark like the pocket around it, because the whole port is
  // read from a low angle where only a *bright* surface inside it separates
  // "dark cavity with a metal tongue" from "dark hole". Its root is buried in
  // the liner below `rail` and only its upper part stands in the opening, so
  // the two parts' surfaces meet inside solid material instead of leaving a
  // slit a ray could pass through.
  addMesh(
    group,
    blockGeometry(
      [-pocket.tongue.halfWidth, rail + pocket.tongue.baseY, pocket.tongue.minZ],
      [pocket.tongue.halfWidth, rail + pocket.tongue.topY, pocket.tongue.maxZ],
      pocket.tongue.radius,
    ),
    materials.tongue,
    'port-tongue',
    'tongue',
    false,
  );

  for (const x of BOTTOM_BORES.speakers) {
    addMesh(group, boreMouth(BOTTOM_BORES.radius, x, -1), materials.bore, 'speaker', 'bore', false);
  }
  for (const x of BOTTOM_BORES.mics) {
    addMesh(group, boreMouth(BOTTOM_BORES.radius, x, -1), materials.bore, 'mic-bottom', 'bore', false);
  }
  return group;
}
