import * as THREE from 'three';

import { addMesh, backPlateGeometry, contourPatchGeometry, roundedShape, slabGeometry } from './geometry.js';
import {
  ANTENNA,
  BODY,
  BORE_PROUD,
  BUTTONS,
  GLASS_BEVEL,
  GLASS_FRONT_Z,
  ISLAND,
  LOGO_CENTRE_Y,
  LOGO_HEIGHT,
  MAGSAFE,
  RAIL,
  TOP_BORE,
} from './dims.js';
import { appleLogoGeometry } from './logo.js';
import { buildBackPanel, PANEL_FACE_Z } from './plateau.js';
import { boreMouth, housingGeometry } from './port.js';
import type { PhoneMaterials } from './materials.js';

// The plateau, the back panel and the bottom edge live in their own modules,
// because each is shaped by something this file cannot describe — the panel's
// top edge by the plateau's roll, the port by the housing's through-cut — and
// because their arguments are longer than this file's line budget. Re-exported
// so `phone.ts` and the test files keep their existing import paths.
export { buildPlateau, PANEL_INNER_Z } from './plateau.js';
export { buildBottom } from './port.js';
export { buildBackPanel, PANEL_FACE_Z };

/**
 * One builder per external surface of the phone. `phone.ts` assembles them;
 * this file owns the frame, the front, the back's furniture and the controls.
 *
 * The rule every edge part here obeys: it must reach `RAIL` without crossing
 * it. Edge features are either placed on the rail's own surface (flush bore
 * mouths, antenna ribbons, button pills seated in the metal) or set back inside
 * it, because a part that crosses the silhouette stops reading as a detail and
 * starts reading as a modelling artefact — and a part that stops short of it
 * reads as a decal floating beside the phone. Both halves of that rule are
 * asserted against the built geometry in `parts.test.ts`.
 */

/** How far a button pill stands off the rail, and the plane its seam sits on:
 *  `BUTTONS[].proud` and `BUTTONS[].seamProud` in `dims.ts`, because the seam
 *  has to stay behind its own pill and Camera Control's two faces are set into
 *  the rail rather than standing off it. The seam is a thin dark bar larger
 *  than the pill, so it reads as the shadowed gap at the button's base rather
 *  than as a darker button.
 *
 *  The seam having its own stand-off is load-bearing: it used to take the
 *  pill's outer plane as its own, which made a near-black face exactly coplanar
 *  with the pill's outer face. Two coplanar faces fight for the same depth
 *  samples, and the pill lost often enough to read as a black, speckled pill in
 *  every profile shot. */
const SEAM_MARGIN = 0.3;
/** How far a pill's extrusion runs back past the rail. Without it the pill's
 *  inner cap lands exactly on the wall, which is one more coplanar pair. */
const EMBED = 0.1;
/** How far the Apple logo inlay's flat back is set into the panel, so its
 *  outline never shows a gap against the glass. */
const LOGO_EMBED = 0.05;
/** How far the MagSafe ring's outer surface stands proud of the panel; the
 *  rest of its tube is buried. At 0.12 the ring's own edge caught the key light
 *  and drew a visible circle on a straight-on back view, which is the one thing
 *  the part must never do — the real ring is a magnetic layer *under* the
 *  frosted glass. At 0.02 the ring reads only as a faint roughness variation
 *  at glancing angles, never as a drawn circle. */
const MAGSAFE_PROUD = 0.02;

/** Anodized unibody with the USB-C opening cut through the bottom edge. The cut
 *  is the port's *mouth* — a real hole in the rail's chamfer, which is the only
 *  way the recess reads as an opening rather than as a decal. The outline it is
 *  drawn into, and why it is a contour and not a `slot` hole, are `port.ts`'s
 *  `housingGeometry`; this function is only the mesh around it.
 *
 *  A cut through a slab is a through-hole by construction, so the mouth also
 *  opens on the frame's front and back faces. `port.ts`'s `port-shell` closes
 *  its cross-section at both of them, and `port-mouth` fills what is left of
 *  its bottom-face opening; without those two, this one cut puts a dark slot in
 *  all three silhouettes. */
export function buildHousing(materials: PhoneMaterials): THREE.Mesh {
  const mesh = new THREE.Mesh(housingGeometry(), materials.aluminum);
  mesh.name = 'frame';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData['material'] = 'aluminum';
  return mesh;
}

/** Cover glass, unlit display, Dynamic Island. */
export function buildFront(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'front';
  const width = BODY.width - BODY.inset * 2;
  const height = BODY.height - BODY.inset * 2;
  const radius = BODY.radius - BODY.inset;

  // Cover glass: the outermost front surface, sitting 0.6 mm proud of the
  // frame with the OLED nested inside it. Nothing here shares a plane with the
  // frame, so the front reads as glass with a hairline aluminum reveal.
  addMesh(
    group,
    slabGeometry({
      width,
      height,
      radius,
      maxZ: BODY.halfDepth + 0.6,
      thickness: 0.6,
      bevel: GLASS_BEVEL,
    }),
    materials.frontGlass,
    'cover-glass',
    'frontGlass',
  );

  // The OLED, unlit, inside the cover glass. Both layers are plain near-black
  // and glossy: no procedural map, so nothing can dither into a staircase
  // across the panel.
  addMesh(
    group,
    slabGeometry({
      width: width - 2.4,
      height: height - 2.4,
      radius: radius - 1.2,
      maxZ: BODY.halfDepth + 0.48,
      thickness: 0.2,
      bevel: 0.05,
    }),
    materials.screen,
    'display',
    'screen',
    false,
  );

  // Dynamic Island: ~29 x 8.8, its top edge 12 mm below the top edge of the
  // glass, lying flat on the glass surface. It is placed straight onto the
  // glass's own plane — the leaning plane correction an earlier round applied
  // here belongs to parts posed in floor space, and applying it to a child of
  // the leaning body pushed the island 8 mm off the glass, where it read as a
  // black blob floating at the screen's edge.
  const glassTop = BODY.height / 2 - BODY.inset;
  const islandCentre = glassTop - ISLAND.topInset - ISLAND.height / 2;
  const islandZ = GLASS_FRONT_Z + ISLAND.proud;
  addMesh(
    group,
    backPlateGeometry(ISLAND.width, ISLAND.height, ISLAND.height / 2, 0.3, islandZ),
    materials.island,
    'dynamic-island',
    'island',
    false,
  ).position.set(0, islandCentre, 0);

  // Front camera dot in the island's right half, as seen from the front.
  const cameraX = ISLAND.cameraX;
  addMesh(group, backPlateGeometry(1.9, 1.9, 0.95, 0.12, islandZ + 0.02), materials.darkGlass, 'island-lens', 'darkGlass', false)
    .position.set(cameraX, islandCentre, 0);
  addMesh(group, backPlateGeometry(1.05, 1.05, 0.52, 0.1, islandZ + 0.04), materials.bore, 'island-pupil', 'bore', false)
    .position.set(cameraX, islandCentre, 0);

  return group;
}

/**
 * Matte Ceramic Shield back panel, Apple logo inlay, MagSafe ring. The panel
 * itself is `plateau.ts`'s — it is split out of this file because it is the
 * back's structural surface, the one `plateau.test.ts` (its top edge) and the
 * plane gate above (its Z planes) measure on its own, and because its top edge
 * is the plateau's own rolled bottom: move either outline and the other's has
 * to follow. The logo's parse is no longer the reason it is separate — `logo.ts`
 * reads its path in node, so a test reaches `buildBack` without a DOM.
 */
export function buildBack(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'back';
  group.add(buildBackPanel(materials));

  // The inlay sits on the panel's outer face, its flat back embedded a hair so
  // no gap opens under it. No lean correction is needed here: the logo is a
  // child of the leaning body exactly as the panel is, so the plane it is
  // placed on leans with it — and the correction an earlier round applied
  // evaluated to zero at the logo's own height, while the 1.1 mm it cleared
  // had been measured against a panel that had itself drifted 0.6 mm off the
  // frame.
  addMesh(
    group,
    appleLogoGeometry({ height: LOGO_HEIGHT, depth: 0.16, bevel: 0.035 }),
    materials.logo,
    'apple-logo',
    'logo',
    false,
  ).position.set(0, LOGO_CENTRE_Y, PANEL_FACE_Z + LOGO_EMBED);

  // MagSafe: a ~1.5 mm tonal ring, flush with the panel, barely lighter. All
  // but the outermost sliver of its tube is buried in the panel, which is what
  // keeps it a whisper instead of a wire.
  addMesh(
    group,
    new THREE.TorusGeometry(MAGSAFE.radius, MAGSAFE.tube, 10, 128),
    materials.magsafe,
    'magsafe',
    'magsafe',
    false,
  ).position.set(0, MAGSAFE.centreY, PANEL_FACE_Z + MAGSAFE.tube - MAGSAFE_PROUD);

  return group;
}

/**
 * Side controls. Every pill is proud anodized metal — the frame's own finish —
 * with a thin dark seam at its base: the physical left edge (-X) carries
 * Action and the two volume keys, the physical right edge (+X) the power pill
 * and the nearly flush Camera Control.
 */
export function buildControls(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'controls';
  const depth = BODY.depth - 1.5;

  for (const button of BUTTONS) {
    const sapphire = button.label === 'camera-control';
    const pillDepth = depth - (sapphire ? 0.4 : 0);
    const pillRadius = sapphire ? 2.2 : 2.8;
    // Every pill is measured from the rail and seated in it: the outer face
    // lands on the rail plus the button's documented `proud`, and the
    // extrusion runs `EMBED` back into the metal. The seam gets its own,
    // smaller stand-off plane — sharing the pill's is what made two faces
    // coplanar and the pills render black and speckled.
    const outerX = button.edge * (RAIL.x + button.proud);
    const seamX = button.edge * (RAIL.x + button.seamProud);

    // The seam is larger than the pill and stands far less proud, so only the
    // sliver around the pill's base shows.
    addMesh(
      group,
      pillGeometry(
        button.height + 2 * SEAM_MARGIN,
        pillDepth + 2 * SEAM_MARGIN,
        pillRadius,
        button.edge,
        seamX,
        button.seamProud + EMBED,
        button.centreY,
      ),
      materials.seam,
      `${button.label}-seam`,
      'seam',
      false,
    );
    addMesh(
      group,
      pillGeometry(button.height, pillDepth, pillRadius, button.edge, outerX, button.proud + EMBED, button.centreY),
      sapphire ? materials.sapphire : materials.button,
      button.label,
      sapphire ? 'sapphire' : 'button',
    );
  }
  return group;
}

/**
 * A pill whose rounded cross-section runs along Y and whose outer face lands
 * exactly on `outerX`, extruded inwards from there by `thickness` — which is
 * the documented `proud` plus `EMBED`, so its inner cap sits inside the metal.
 *
 * The quarter turn has to follow the edge's sign. Extruding towards +X and
 * then translating by the *negative* edge puts the pill's caps the wrong way
 * round on that edge, so its outward face is back-facing and renders as the
 * dark hollow behind it — a second reason the right-hand buttons read black.
 */
function pillGeometry(
  height: number,
  depth: number,
  radius: number,
  edge: number,
  outerX: number,
  thickness: number,
  centreY: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const halfWidth = depth / 2;
  const halfHeight = height / 2;
  const r = Math.max(0.01, Math.min(radius, halfWidth, halfHeight));
  shape.moveTo(halfWidth, centreY + halfHeight - r);
  shape.lineTo(halfWidth, centreY - halfHeight + r);
  shape.absarc(halfWidth - r, centreY - halfHeight + r, r, 0, -Math.PI / 2, true);
  shape.lineTo(-halfWidth + r, centreY - halfHeight);
  shape.absarc(-halfWidth + r, centreY - halfHeight + r, r, -Math.PI / 2, -Math.PI, true);
  shape.lineTo(-halfWidth, centreY + halfHeight - r);
  shape.absarc(-halfWidth + r, centreY + halfHeight - r, r, Math.PI, Math.PI / 2, true);
  shape.lineTo(halfWidth - r, centreY + halfHeight);
  shape.absarc(halfWidth - r, centreY + halfHeight - r, r, Math.PI / 2, 0, true);
  shape.closePath();

  const bevel = Math.min(0.12, depth / 2 - 0.01, height / 2 - 0.01, thickness / 2 - 0.005);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 12,
  });
  // The shape is authored in (depth, height) and extruded along +Z, so turn it
  // a quarter turn about Y: the cross-section then lies in the ZY plane and the
  // extrusion runs along X. The bevel adds one `bevel` outside the cap plane,
  // so the translation is pulled in by that much to land the pill's outermost
  // point — not its flat cap — on `outerX`.
  geometry.rotateY(edge < 0 ? Math.PI / 2 : -Math.PI / 2);
  geometry.translate(outerX + edge * -bevel, 0, 0);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * The 5G mmWave antenna window on the top edge: the matte rounded-rectangle
 * inlay US units carry and the eSIM-only units this model is documented as do
 * not, which is why the top edge had no part for it.
 *
 * Every number is measured off `.shots/ref/mmwave-1.jpg` — a Cosmic Orange 17
 * Pro shot end-on from above, so the top edge fills the frame [Phone Arena via
 * Disway, 2025]. Measured on its pixels: the top-edge face runs x 260…923 and
 * the window's two tonal steps sit at x 457 and x 723, so the window is 267 px
 * of the body's 663 — **0.40 of `BODY.width`** (267 / 663 = 0.402), which
 * `parts.test.ts` re-derives rather than trusting this comment. The window is
 * centred: its centre lands at x 590 against the face's own 591.5, with margins
 * of 197 px left and 200 px right.
 *
 * `height` is its extent along Z, across the edge's depth. The face spans y
 * 333…404 in that image — 71 px, 7.70 mm at the 9.22 px/mm the 663 px / 71.9 mm
 * scale gives — and the window's step to the chamfer highlight above it is at y
 * 356 with its lower step at y 398: 42 px, **0.57 of the face's depth**. 5.0 mm
 * is 0.57 of `BODY.depth`, and leaves 1.875 mm of the frame's face showing at
 * each end, which is the margin the reference shows. `radius` is half the
 * height, so the ends are true semicircles.
 */
export const MMWAVE = {
  /** Window width as a fraction of `BODY.width`, measured off the reference. */
  widthFraction: 0.4,
  width: 0.4 * BODY.width,
  /** Extent along Z, the edge face's own depth axis. */
  height: 5,
  radius: 2.5,
  /** The corner arcs are centred on the face's Z mid-plane, the way the
   *  reference window's are on the edge. */
  centreZ: 0,
  /** The inlay's outer face, off the rail: `BORE_PROUD`'s pattern, because a
   *  face exactly coplanar with the frame's is the pair that renders speckled,
   *  and 0.02 mm is far too little to read as a lip at any view. */
  proud: BORE_PROUD,
  /** How far the inlay's body runs back into the metal behind that face. Only
   *  the proud 0.02 mm is outside the frame; the rest is buried, so no
   *  sightline can pass under the inlay's edge. */
  thickness: 0.5,
} as const;

/**
 * Top edge: one microphone pinhole and the US 5G mmWave antenna window.
 *
 * The bore is a dot on the edge face — 1.2 mm across, not a tube, which stuck
 * 3.7 mm out of the edge and read as a black pill from above. The window is the
 * matte inlay `MMWAVE` measures: a rounded rectangle on the same face as the
 * bore, so the `top` preset frames both.
 *
 * Its material is the `mmwave` key `materials.ts` grew for it: the reference's
 * window is a matte insert *below* the frame, and no key that existed reached
 * that step. The survey that settled it, measured on the built `top` frame
 * against the frame's face on the same row: `antenna` 1.20 of it (207 against
 * 172 luma), `magsafe` 1.16, `backGlass` 1.09, `logo` 1.05 (180 against 172)
 * and `darkGlass` 0.28, against the reference's own 0.83. `mmwave` is a
 * dielectric at roughness 0.82 with no clearcoat, so its face carries no
 * highlight at all; it renders 0.833 / 0.831 / 0.836 of the frame's luma on the
 * three finishes, where `logo` rendered 1.04 / 1.14 / 0.93 — the orange one is
 * the defect this replaces. The reference's window measures
 * 109 to 112 luma across its face while the frame beside it runs 104 to 165, so
 * the flat one is as much of the requirement as the number is. The comment this
 * replaces ended "a dark window would need its own key, and `materials.ts` is
 * not this change's to edit" — that key now exists, and the line below names it.
 */
export function buildTop(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'top';
  addMesh(group, boreMouth(TOP_BORE.radius, TOP_BORE.x, 1), materials.bore, 'mic-top', 'bore', false);
  addMesh(group, mmwaveWindowGeometry(), materials.mmwave, 'mmwave-window', 'mmwave', false);
  return group;
}

/**
 * The mmWave window's inlay: `MMWAVE`'s rounded rectangle, lying on the top
 * edge face and proud of it by `MMWAVE.proud`.
 *
 * It is authored in the XY plane and turned a quarter turn about X, because
 * `slabGeometry` extrudes along Z and this part's plane is Y — the same turn
 * `pillGeometry` does for the side edges, and for the same reason: a part
 * placed on the axis it was authored along stands on edge out of the phone.
 *
 * Two placements are measured rather than assumed. The outer face is snapped to
 * the rail plus `MMWAVE.proud` from the geometry's own bounding box, so the
 * part's own extent cannot change the plane it sits on; and the extrusion runs
 * *inwards* from there, so all but that 0.02 mm is buried in the metal and no
 * sightline can slip under the inlay's edge. The whole part sits at
 * `MMWAVE.centreZ`, the middle of the frame's depth: the margins that leaves at
 * each end are what keep it inside the face instead of reaching the chamfer.
 */
function mmwaveWindowGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.ExtrudeGeometry(roundedShape(MMWAVE.width, MMWAVE.height, MMWAVE.radius), {
    depth: MMWAVE.thickness,
    bevelEnabled: false,
    curveSegments: 12,
  });
  // The shape is authored in (width, height) and extruded along +Z, so turn it
  // about X: the cross-section then lies in the XZ plane and the extrusion runs
  // along -Y — into the body, from a face that lands on the rail.
  geometry.rotateX(Math.PI / 2);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box === null) throw new Error('the mmWave window has no bounding box');
  // -Y is out of the phone, so the part's largest Y is the face that shows.
  geometry.translate(0, RAIL.y + MMWAVE.proud - box.max.y, MMWAVE.centreZ - (box.min.z + box.max.z) / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Antenna bands: thin polymer straps crossing the rail near the corners. Each
 * one is sampled along the rail's own corner arc, so it follows the contour to
 * within the fraction of a millimetre it stands proud and can never stand past
 * the silhouette.
 */
export function buildAntennas(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'antennas';
  const radius = RAIL.radius + ANTENNA.proud;
  const halfAngle = ANTENNA.halfLength / radius;
  const steps = 10;

  for (const strap of ANTENNA.straps) {
    const middle = (strap.angleDeg * Math.PI) / 180;
    const contour: THREE.Vector2[] = [];
    for (let index = 0; index <= steps; index += 1) {
      const angle = middle - halfAngle + (2 * halfAngle * index) / steps;
      contour.push(
        new THREE.Vector2(
          strap.sx * (RAIL.centreX + radius * Math.cos(angle)),
          strap.sy * (RAIL.centreY + radius * Math.sin(angle)),
        ),
      );
    }
    addMesh(
      group,
      contourPatchGeometry(contour, -ANTENNA.zHalfExtent, ANTENNA.zHalfExtent),
      materials.antenna,
      'antenna-band',
      'antenna',
      false,
    );
  }
  return group;
}






