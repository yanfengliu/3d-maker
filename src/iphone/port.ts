import * as THREE from 'three';

import {
  BODY,
  BORE_PROUD,
  BOTTOM_BORES,
  PORT_POCKET,
  RAIL,
  USB_C,
} from './dims.js';
import {
  addMesh,
  blockGeometry,
  boreGeometry,
  roundedHole,
  roundedShape,
  slabGeometry,
} from './geometry.js';
import type { PhoneMaterials } from './materials.js';

/**
 * The phone's bottom edge: the USB-C port and the bores beside it.
 *
 * This is split out of `parts.ts` because the port is the one place in the
 * model where the frame's own construction works against it, and the argument
 * for how it is filled is longer than any other part's.
 *
 * The frame's cut is here too, rather than in `parts.ts`, because it has to be
 * drawn into the frame's *outline* and `slabGeometry` takes only a rectangle
 * plus optional holes. `parts.ts`'s `buildHousing` calls `housingGeometry`
 * below. The reason is measured, not stylistic: a hole that crosses the
 * outline — which is what an edge notch is — is undefined for the triangulator
 * `ExtrudeGeometry` uses, and on the build this round replaced it dropped the
 * cut silently. The frame came out with no opening at all (0 of 464 ray samples
 * across the mouth's cross-section reached through it), the 0.24 mm-cornered
 * "mouth" the docs described was never built, and everything the eye read as
 * the port was the bottom assembly's liner: a dark rectangle 8.4 x 8.6 mm with
 * an angular aperture, a bright steel slab floating in the middle of it and a
 * hard dark frame around it.
 */

/** The frame's slab geometry, with the port's mouth notched into its bottom
 *  edge.
 *
 *  The notch's numbers are `USB_C`'s, pre-compensated by `BODY.bevel`: an
 *  `ExtrudeGeometry` bevel grows the slab's *middle* layer outside the outline
 *  it is drawn from, and that middle layer is the rail plane, so a notch drawn
 *  at the documented 8.4 x 3.2 with 1.1 corners comes out 7.68 mm wide where
 *  the eye reads it. Measured on the built frame, the widest layer is the rail
 *  plane and the notch there is 8.4 mm across, 3.2 mm up from the rail, with
 *  1.1 mm corners, which is what `USB_C` documents.
 *
 *  Everything after the shape mirrors `slabGeometry` line for line — same
 *  extrusion options, same snap of the extruded depth to `BODY.depth`, same
 *  placement of the slab's largest Z on `BODY.halfDepth` — because the frame's
 *  silhouette is gated to `RAIL` and a second construction of it that drifted
 *  would be a defect of its own. */
export function housingGeometry(): THREE.ExtrudeGeometry {
  const bevel = BODY.bevel;
  const halfWidth = BODY.width / 2 - bevel;
  const halfHeight = BODY.height / 2 - bevel;
  const radius = BODY.radius - bevel;
  const notchHalf = USB_C.width / 2 + bevel;
  const notchTop = -RAIL.y + USB_C.height + bevel;
  const notchRadius = USB_C.radius + bevel;

  // One closed contour, counter-clockwise: right along the bottom edge, up and
  // over the notch, up the right edge, left along the top, down the left. The
  // notch's own corners are concave, so they turn clockwise and take
  // `clockwise = true`; every body corner turns counter-clockwise.
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + radius, -halfHeight);
  shape.lineTo(-notchHalf, -halfHeight);
  shape.lineTo(-notchHalf, notchTop - notchRadius);
  shape.absarc(-notchHalf + notchRadius, notchTop - notchRadius, notchRadius, Math.PI, Math.PI / 2, true);
  shape.lineTo(notchHalf - notchRadius, notchTop);
  shape.absarc(notchHalf - notchRadius, notchTop - notchRadius, notchRadius, Math.PI / 2, 0, true);
  shape.lineTo(notchHalf, -halfHeight);
  shape.lineTo(halfWidth - radius, -halfHeight);
  shape.absarc(halfWidth - radius, -halfHeight + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(halfWidth, halfHeight - radius);
  shape.absarc(halfWidth - radius, halfHeight - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(-halfWidth + radius, halfHeight);
  shape.absarc(-halfWidth + radius, halfHeight - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(-halfWidth, -halfHeight + radius);
  shape.absarc(-halfWidth + radius, -halfHeight + radius, radius, Math.PI, Math.PI * 1.5, false);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, BODY.depth - 2 * bevel) + 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box === null) throw new Error('the frame has no bounding box');
  const scale = (box.max.z - box.min.z) / BODY.depth;
  geometry.translate(0, 0, -box.min.z);
  geometry.scale(1, 1, 1 / scale);
  geometry.translate(0, 0, BODY.halfDepth - BODY.depth);
  geometry.computeVertexNormals();
  return geometry;
}

/** A rounded-rectangle plate lying flat in the body's X-Z plane, its bottom
 *  face on `bottomY` and its outline `width` across the body and `depth`
 *  through it.
 *
 *  `roundedShape` draws in X-Y and extrudes towards +Z, so the plate is turned
 *  a quarter turn about X: the shape's height becomes the body's depth and the
 *  extrusion runs downwards. A `window` is the rounded hole through the plate —
 *  the aperture, for the mouth. No bevel: the window's own edge is the outline
 *  the port's aperture gate measures, and a bevel would round it by an amount
 *  that depends on the plate's thickness. */
function flatPlateGeometry(
  width: number,
  depth: number,
  radius: number,
  thickness: number,
  bottomY: number,
  window?: { readonly width: number; readonly depth: number; readonly radius: number },
): THREE.ExtrudeGeometry {
  const shape = roundedShape(width, depth, radius);
  if (window !== undefined) {
    shape.holes.push(roundedHole(window.width, window.depth, window.radius));
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 48,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, bottomY + thickness, 0);
  geometry.computeVertexNormals();
  return geometry;
}

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
 *  The port opens *downward only*, and four things make that true.
 *
 *  - `port-shell` is the frame's through-cut closed at both ends: one
 *    `shell.thickness` plate against each of the frame's faces, its outline
 *    wide and tall enough to cover the notch's whole cross-section there.
 *    Measured, the notch's opening at the frame's faces is 9.12 mm across
 *    against 8.4 at the rail plane, because the chamfer's bevel grows material
 *    into the notch over its last 0.36 mm of depth.
 *  - `port-mouth` is the aperture. It is a plate lying in the rail's
 *    bottom-face plane, standing `BORE_PROUD` off it, filling the notch's whole
 *    bottom-face opening — which is 8.4 mm wide and the body's 8.75 mm deep —
 *    except for its own window: `USB_C.width x USB_C.height` with
 *    `USB_C.radius` corners. That window is the rounded-rectangle opening the
 *    bottom view reads, and it is measured on the built plate by
 *    `port.test.ts`.
 *  - `port-mouth-plate` and `port-cavity` are the dark faces behind it: the
 *    plate 0.03 mm inside the aperture, the pocket's floor 0.07 mm behind the
 *    plate. Both are `bore`, so the window frames the recess's own walls rather
 *    than a lit aluminum surface — the bright trapezoid the previous build
 *    showed was the frame's own bottom face seen through the liner's opening.
 *  - `port-tongue` is the connector: a 6.6 x 1.1 x 0.26 mm dark-steel strip on
 *    the pocket's floor, its root buried in the floor plate and its underside
 *    the only face a sightline from below meets. The previous build's tongue
 *    hung 0.02 mm below the rail's own plane and ran the pocket's whole depth,
 *    so its 6.6 x 7.1 mm underside was what the bottom view saw.
 *
 *  Three earlier arrangements are worth keeping as failures. A tongue inside a
 *  closed dark block was never visible from anywhere: the block's faces were
 *  always in front of it. A floor plate across the whole mouth with its top
 *  face level with the rail's bottom face was the first thing every upward ray
 *  met, so the tongue was invisible again — and that floor was also a coplanar
 *  pair with the rail, which the z-plane gate could not see. A single block as
 *  large as the mouth reads as a dark lump stuck to the bottom of the phone,
 *  because the housing's cut is narrowest at the frame's two faces: a block
 *  wide enough to fill the mouth stands proud of the rail's chamfer at the
 *  mouth's front and back edges. */
export function buildBottom(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'bottom';
  const pocket = PORT_POCKET;
  const rail = -RAIL.y;

  // The shell: one plate against each of the frame's faces, closing the two
  // ends of the through-cut. Its outline is wider than the mouth and buried in
  // the frame's metal, and its outer face stops `shell.inset` inside the
  // frame's own face — which is what keeps the pair off one plane. A plate
  // built from the *far* end takes a negative `maxZ`, so that sign is what
  // grows it towards the face it is meant to hide.
  const shell = new THREE.Group();
  shell.name = 'port-shell';
  group.add(shell);
  const shellOuter = BODY.halfDepth - pocket.shell.inset;
  const shellBase = rail + pocket.shell.base;
  for (const [name, outer] of [
    ['port-shell-front', shellOuter],
    ['port-shell-back', -shellOuter],
  ] as const) {
    addMesh(
      shell,
      slabGeometry({
        width: pocket.shell.width,
        height: pocket.shell.height,
        radius: pocket.shell.radius,
        maxZ: outer + (outer < 0 ? pocket.shell.thickness : 0),
        thickness: pocket.shell.thickness,
        bevel: 0.004,
        centreY: shellBase + pocket.shell.height / 2,
      }),
      materials.aluminum,
      name,
      'aluminum',
      false,
    );
  }

  // The mouth's metal and the dark plate inside it. The mouth plate's window is
  // the aperture; the dark plate is 0.2 mm larger all round, so its outline is
  // buried in the mouth plate's material rather than coincident with the
  // window's wall, and its own window (0.3 mm inside the aperture) is what the
  // pocket is read through.
  addMesh(
    group,
    flatPlateGeometry(
      pocket.mouth.halfWidth * 2,
      pocket.mouth.halfDepth * 2,
      pocket.mouth.radius,
      pocket.mouth.thickness,
      rail - pocket.mouth.standOff,
      { width: USB_C.width, depth: USB_C.height, radius: USB_C.radius },
    ),
    materials.aluminum,
    'port-mouth',
    'aluminum',
    false,
  );
  addMesh(
    group,
    flatPlateGeometry(
      pocket.plate.width,
      pocket.plate.height,
      pocket.plate.radius,
      pocket.plate.thickness,
      rail + pocket.plate.base,
      pocket.plate.window,
    ),
    materials.bore,
    'port-mouth-plate',
    'bore',
    false,
  );

  // The pocket's floor: one solid dark plate, inside the pocket rather than
  // under the rail — the previous build's floor hung 0.01 mm *below* the rail's
  // own bottom face, so from below it was the surface the eye read, a hard dark
  // rectangle 8.4 x 8.6 mm around the mouth. It is built as a block rather than
  // a slab because `slabGeometry` builds its rounded rectangle in X and Y and
  // extrudes along Z, so a "flat plate" written that way stands on edge at the
  // body's mid-height, nowhere near the port.
  const linerBase = rail + pocket.liner.base;
  addMesh(
    group,
    blockGeometry(
      [-pocket.liner.halfWidth, linerBase, -pocket.liner.halfDepth],
      [pocket.liner.halfWidth, linerBase + pocket.liner.thickness, pocket.liner.halfDepth],
      0.1,
    ),
    materials.bore,
    'port-cavity',
    'bore',
    false,
  );

  // The ceiling is the pocket's other wall: the same outline, set
  // `liner.ceilingBase` above the rail — 0.012 mm clear of the mouth's own top
  // line, so the two are never coplanar, and high enough that it is the surface
  // a sightline along Z meets at the top of the mouth's cross-section.
  const ceilingBase = rail + pocket.liner.ceilingBase;
  addMesh(
    group,
    blockGeometry(
      [-pocket.liner.halfWidth, ceilingBase, -pocket.liner.halfDepth],
      [pocket.liner.halfWidth, ceilingBase + pocket.liner.ceilingThickness, pocket.liner.halfDepth],
      0.1,
    ),
    materials.bore,
    'port-cavity-ceiling',
    'bore',
    false,
  );

  // The connector tongue: a thin strip on the floor, its root buried in the
  // floor plate so the two parts' surfaces meet inside solid material instead
  // of leaving a slit a ray could pass through, and only its underside left
  // where the bottom view can reach it.
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
