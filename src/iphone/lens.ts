import * as THREE from 'three';

import { addMesh, capRise, capSphere, domeGeometry, lensDisc, profileLathe, ringGeometry } from './geometry.js';
import {
  CAMERA_PLANE,
  FLASH,
  LENS_RADIUS,
  LENS_RING_PROUD,
  LENSES,
  LIDAR,
  PLATEAU_CAVITY_RADIUS,
  PLATEAU_MIC,
  PLATEAU_MIC_CAVITY_RADIUS,
} from './dims.js';
import type { PhoneMaterials } from './materials.js';

/**
 * The plateau's working surface: three camera lenses on the +X half (the left
 * half seen from the back) and the flash, LiDAR and mic pinhole stacked on the
 * -X half (the right half seen from the back).
 *
 * Every part here is authored facing +Z — the direction `ringGeometry`,
 * `domeGeometry` and `profileLathe` build in — and its group is then turned a
 * half turn about Y and placed on the plateau's outer face, so a part's local
 * +z means "proud of the plateau", the way the real assembly reads. Getting
 * that round the wrong way is what put the whole stack on the far side of the
 * plateau's face: the rings were buried 2.2 mm inside the aluminum with only
 * their base discs showing, and every lens read as a deep hole with the glass
 * at the bottom of it.
 *
 * A lens is an optical assembly, not a hole: a polished ring standing
 * `LENS_RING_PROUD` off the plateau with its lip raised around the glass, one
 * continuous dark barrel behind it, a dark iridescent element sunk inside the
 * ring, and a small near-black blue pupil floating on that element to hold the
 * catchlight.
 */

/** How far the ring's base is buried in the plateau, behind its own face. */
const RING_SINK = 0.3;
/** How far below the ring's crown the glass dome's crown sits. */
const GLASS_DROP = 0.65;
/** Crown of the glass dome above the element's own base plane. */
const GLASS_RISE = 0.45;
/** The dark element inside the barrel: nearly the whole ring's bore, so the
 *  glass fills ~0.77 of the ring the way the real element does. At 4.15 it was
 *  a small disc at the bottom of a wide barrel, which is what made each lens
 *  read as a hole rather than as glass in a mount. */
const GLASS_RADIUS = 5.15;
/** The ring's bore, a hair outside the glass so the element seats in it. */
const RING_BORE = 5.3;
/** How far the glass's skirt reaches back from its own rim. Only far enough to
 *  close the cap against a grazing view: the barrel's shoulder is at 5.6 and
 *  z ≈ −1.7, and a skirt run the whole sphere deep punches through it. */
const GLASS_SKIRT = 0.6;
/** The brighter pupil at the very centre: ~5.2 mm across. */
const PUPIL_RADIUS = 2.6;
/** How far the pupil's dome floats above the glass dome's surface. */
const PUPIL_LIFT = 0.05;
/** The barrel's mouth: a hair inside the hole cut through the plateau, so the
 *  cavity's own wall is never the thing you see down the bore. */
const BARREL_RADIUS = PLATEAU_CAVITY_RADIUS - 0.02;
/** Half a turn about Y: authored facing +Z, mounted facing the back. */
const BACK_TURN = Math.PI;

/** Places a group on the plateau's outer face, facing the back camera. */
function onPlateau(group: THREE.Group, x: number, y: number): THREE.Group {
  group.position.set(x, y, CAMERA_PLANE);
  group.rotation.y = BACK_TURN;
  return group;
}

export function buildLenses(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'lenses';
  for (const lens of LENSES) {
    const one = buildLens(materials);
    one.name = `lens-${lens.name}`;
    group.add(onPlateau(one, lens.x, lens.y));
  }
  return group;
}

/**
 * One camera. `PLATEAU_CAVITY_RADIUS` is the radius of the hole cut through the
 * plateau, and every fixed radius below is sized to it: the barrel's mouth is a
 * hair inside that wall (so the plateau's own bright bore wall is never what
 * you see), and the ring is wider than the hole so it seats on the aluminum
 * around it.
 *
 * Read from the back the assembly has to look like glass in a barrel, so every
 * surface behind the front element is dark. An earlier round put pale grey
 * aperture lands at the crown, which mirrored the studio back at full strength:
 * the lenses came out as flat slate coins with a hole in them.
 */
function buildLens(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'lens';

  // The ring: an open tube, so the bore is real metal all the way down. Its
  // lip rises around the glass and its crown slopes down to the plateau, which
  // is the land of bright metal that makes the lens read as a lens. The bore is
  // 5.3, not the 5.6 it was: it closed onto the element, and that is what lets
  // the glass fill the ring instead of leaving a wide bright shelf around it.
  addMesh(
    group,
    ringGeometry(LENS_RADIUS, RING_BORE, LENS_RING_PROUD + RING_SINK, 0.55, 96),
    materials.lensRing,
    'lens-ring',
    'lensRing',
  ).position.z = LENS_RING_PROUD - (LENS_RING_PROUD + RING_SINK) / 2;

  // A hairline dark seam where the ring's skirt meets the plateau. Without it
  // the ring's base continues the plateau's own surface and the whole lens
  // reads as one flat shape with a hole punched in it.
  addMesh(
    group,
    ringGeometry(LENS_RADIUS + 0.12, LENS_RADIUS - 0.35, 0.2, 0.05, 96),
    materials.seam,
    'lens-seam',
    'seam',
    false,
  );

  // One barrel: mouth, wall, shoulder and floor in a single lathe profile, so
  // no two surfaces in the cavity can share a radius. It used to be a tube, a
  // floor disc and two step rings, which put four surfaces on the same radius
  // and lit every seam between them — the concentric ridges the closeup showed
  // inside each lens. The floor stops 0.1 mm in front of the frame's back face
  // so the bright aluminum behind the plateau is never visible down the bore.
  const glassCrown = LENS_RING_PROUD - GLASS_DROP;
  const glassBase = glassCrown - GLASS_RISE;
  addMesh(
    group,
    profileLathe(
      [
        [BARREL_RADIUS, 0],
        [BARREL_RADIUS, -1.45],
        [5.6, -1.62],
        [5.6, -1.75],
        [4.2, -1.86],
        [0, -1.92],
      ],
      128,
    ),
    materials.aperture,
    'lens-barrel',
    'aperture',
    false,
  );

  // The front element: a very dark, very glossy dome sunk inside the ring, its
  // convex side towards the camera. Its skirt only has to close the cap —
  // running it the whole sphere deep hangs a bright column down the barrel,
  // which oblique views showed in place of the glass.
  addMesh(
    group,
    domeGeometry(GLASS_RADIUS, GLASS_RISE, glassBase, 56, GLASS_SKIRT),
    materials.lensGlass,
    'lens-glass',
    'lensGlass',
    false,
  );

  // The pupil is a cap of the *same sphere* as the glass, lifted a hair, so it
  // floats as a parallel shell over the glass rather than intersecting it: a
  // small, bright, near-black blue element that holds the catchlight. Its base
  // plane is the sphere's own chord at the pupil's radius — not the glass's
  // base plane — or the narrower cap sits *inside* the dome it is meant to
  // float on, where the opaque glass simply hides it.
  const glassSphere = capSphere(GLASS_RADIUS, GLASS_RISE);
  const pupilRise = capRise(PUPIL_RADIUS, glassSphere);
  addMesh(
    group,
    domeGeometry(
      PUPIL_RADIUS,
      pupilRise,
      glassBase + GLASS_RISE - pupilRise + PUPIL_LIFT,
      40,
      0.4,
    ),
    materials.lensPupil,
    'lens-pupil',
    'lensPupil',
    false,
  );

  // A faint hotspot sprite tied to the lens centre, so a back view has an
  // eye-catch even when the key light is off-axis. The square is 6.5 mm on a
  // side, and a sprite's falloff dies at half of that — 3.25 mm, inside the
  // element's own 5.15 mm radius. The 7.5 it used to be spread the same wash
  // to 3.75 mm, which lifted more of the glass around the pupil than the
  // catchlight needs.
  const glow = new THREE.Sprite(materials.glow);
  glow.name = 'lens-glow';
  glow.scale.set(6.5, 6.5, 1);
  glow.position.set(0, 0, glassCrown + 0.6);
  group.add(glow);

  return group;
}

/** LED flash: a matte pale window under a hairline tinted surround.
 *
 *  The surround used to be a 0.75 mm collar of polished chrome standing 0.56 mm
 *  off the plateau, which is not a part the real phone has: Apple's close-up
 *  shows a matte pale window seated almost flush, ringed by a line no wider than
 *  the lens rings' lip and tinted with the finish like the rest of the plateau
 *  furniture. It keeps the ring material at 0.45 mm wide — three fifths of that
 *  collar — and 0.42 mm tall, seated on the plateau face rather than hovering
 *  0.14 mm over it as the first pass at this size did.
 *
 *  The window is 2.43 mm where its cavity is 2.35, so the disc seats inside the
 *  surround's 2.45 mm bore rather than over it, and its face sits 0.24 mm below
 *  the surround's crown: the flash is read *in* the plateau, the way the LiDAR
 *  is, not as a disc laid on top of it. The dark torus that used to sit on the
 *  window is gone: it drew a dark circle on a window that has to read matte
 *  pale, which is the opposite of the part. */
export function buildFlash(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'flash';

  // Half the collar's 0.42 mm height: the base lands on the plateau's face
  // instead of hovering over it.
  addMesh(
    group,
    ringGeometry(2.9, 2.45, 0.42, 0.2, 64),
    materials.lensRing,
    'flash-collar',
    'lensRing',
    false,
  ).position.z = 0.21;
  addMesh(
    group,
    lensDisc(FLASH.radius - 0.07, 0.2, 0.08),
    materials.flash,
    'flash-led',
    'flash',
    false,
  );
  return onPlateau(group, FLASH.x, FLASH.y);
}

/** LiDAR: a dark glossy scanner window under a thin dark surround.
 *
 *  The surround is not chrome — it is the shadow line between the dark window
 *  and the plateau, so it carries the barrel's own material (`aperture`) rather
 *  than the lens rings'. A polished bezel around the dark glass drew a bright
 *  circle exactly where the photo shows a dark edge. */
export function buildLidar(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'lidar';

  addMesh(
    group,
    ringGeometry(4.15, 3.85, 0.3, 0.14, 64),
    materials.aperture,
    'lidar-bezel',
    'aperture',
    false,
  ).position.z = 0.15;
  addMesh(
    group,
    lensDisc(LIDAR.radius, 0.2, 0.14),
    materials.darkGlass,
    'lidar-glass',
    'darkGlass',
    false,
  );
  return onPlateau(group, LIDAR.x, LIDAR.y);
}

/** Mic pinhole between the flash and the LiDAR: a plain dark hole, not a
 *  chromed aperture. Field photos show a bare pinhole; the polished bezel it
 *  used to carry is invisible at this size and merely added a bright speck. */
export function buildPlateauMic(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'plateau-mic';

  addMesh(
    group,
    ringGeometry(1.05, 0.78, 0.25, 0.12, 40),
    materials.aperture,
    'mic-bezel',
    'aperture',
    false,
  ).position.z = 0.12;
  addMesh(
    group,
    lensDisc(PLATEAU_MIC_CAVITY_RADIUS + 0.07, 0.3, 0.08),
    materials.bore,
    'mic-hole',
    'bore',
    false,
  );
  return onPlateau(group, PLATEAU_MIC.x, PLATEAU_MIC.y);
}
