import * as THREE from 'three';

import { addMesh, backPlateGeometry, blockGeometry, boreGeometry, contourPatchGeometry, slabGeometry } from './geometry.js';
import {
  ANTENNA,
  BACK_PANEL,
  BODY,
  BORE_PROUD,
  BOTTOM_BORES,
  BUTTONS,
  FLASH,
  FLASH_CAVITY_RADIUS,
  GLASS_BEVEL,
  GLASS_FRONT_Z,
  ISLAND,
  LENSES,
  LIDAR,
  LIDAR_CAVITY_RADIUS,
  LOGO_CENTRE_Y,
  LOGO_HEIGHT,
  MAGSAFE,
  PLATEAU,
  PLATEAU_CAVITY_RADIUS,
  PLATEAU_MIC,
  PLATEAU_MIC_CAVITY_RADIUS,
  RAIL,
  TOP_BORE,
  USB_C,
} from './dims.js';
import { buildFlash, buildLidar, buildLenses, buildPlateauMic } from './lens.js';
import { appleLogoGeometry } from './logo.js';
import type { PhoneMaterials } from './materials.js';

/**
 * One builder per external surface of the phone. `phone.ts` assembles them;
 * this file owns the millimetre layout of the panel, the controls, the ports
 * and the camera plateau.
 *
 * The rule every edge part here obeys: it must reach `RAIL` without crossing
 * it. Edge features are either placed on the rail's own surface (flush bore
 * mouths, antenna ribbons, button pills seated in the metal) or set back inside
 * it (port cavities), because a part that crosses the silhouette stops reading
 * as a detail and starts reading as a modelling artefact — and a part that
 * stops short of it reads as a decal floating beside the phone. Both halves of
 * that rule are asserted against the built geometry in `parts.test.ts`.
 */

/** How far the button pills stand off the rail, and how deep the seam behind
 *  them is. The seam is a thin dark bar sitting `SEAM_PROUD` off the rail and
 *  larger than the pill, so it reads as the shadowed gap at the button's base
 *  rather than as a darker button.
 *
 *  It has its own stand-off, and that is load-bearing: the seam used to take
 *  the pill's outer plane as its own, which made a near-black face exactly
 *  coplanar with the pill's outer face. Two coplanar faces fight for the same
 *  depth samples, and the pill lost often enough to read as a black, speckled
 *  pill in every profile shot. */
export const SEAM_PROUD = 0.06;
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

/** The back panel's planes: it butts the frame's back face and stands
 *  `BACK_PANEL.thickness` outside it, which is what the plane table in
 *  `dims.ts` calls z = -4.375 … -4.975. */
export const PANEL_INNER_Z = -BODY.halfDepth;
export const PANEL_FACE_Z = PANEL_INNER_Z - BACK_PANEL.thickness;

/** Anodized unibody with the USB-C opening cut as a real hole through the
 *  bottom edge, which is what makes the port read as an opening.
 *
 *  The shape handed to `slabGeometry` is the outline the chamfer is grown
 *  *from*, so it is pre-shrunk by `BODY.bevel` on every side and the slab's
 *  middle — its widest layer — lands exactly on `RAIL`. A hole only opens an
 *  edge if part of it crosses that edge, so the cut-out is centred on the
 *  shape's own bottom line. */
export function buildHousing(materials: PhoneMaterials): THREE.Mesh {
  const mesh = new THREE.Mesh(
    slabGeometry({
      width: BODY.width - 2 * BODY.bevel,
      height: BODY.height - 2 * BODY.bevel,
      radius: BODY.radius - BODY.bevel,
      maxZ: BODY.halfDepth,
      thickness: BODY.depth,
      bevel: BODY.bevel,
      slot: {
        width: USB_C.width,
        depth: USB_C.height,
        radius: USB_C.radius,
        edge: -BODY.height / 2 + BODY.bevel,
      },
    }),
    materials.aluminum,
  );
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
 * The matte Ceramic Shield panel on its own. It is split out of `buildBack`
 * because it is the back's structural surface — the plane the logo and the
 * MagSafe ring are measured from, and one of the documented Z planes — while
 * the logo needs an SVG parse and therefore a DOM. `parts.test.ts` measures
 * this mesh; it cannot reach anything that calls `buildBack`.
 */
export function buildBackPanel(materials: PhoneMaterials): THREE.Mesh {
  // One large rounded-rect panel: it starts a small gap below the plateau and
  // runs to 12 mm above the body's bottom edge, inset 4.5 mm on each side.
  const top = PLATEAU.centreY - PLATEAU.height / 2 - BACK_PANEL.gap;
  const bottom = -BODY.height / 2 + BACK_PANEL.bottomReveal;
  const centreY = (top + bottom) / 2;
  const width = BODY.width - BACK_PANEL.sideInset * 2;
  // The panel is the outermost back surface: its inner face lies on the
  // frame's back face and its outer face `PANEL_FACE_Z` outside it. The panel
  // faces -Z, so the plane `slabGeometry` wants is the *inner* one; handing it
  // the outer plane grew the panel away from the frame instead, which is what
  // left it floating 0.6 mm off the body with a dark gap around its edge.
  return addMesh(
    new THREE.Group(),
    slabGeometry({
      width,
      height: top - bottom,
      radius: BACK_PANEL.radius,
      maxZ: PANEL_INNER_Z,
      thickness: BACK_PANEL.thickness,
      bevel: GLASS_BEVEL,
      centreY,
    }),
    materials.backGlass,
    'back-panel',
    'backGlass',
  );
}

/** Matte Ceramic Shield back panel, Apple logo inlay, MagSafe ring. */
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

/** Full-width camera plateau carrying the lenses and the sensor cluster.
 *
 *  The bar is a back-facing slab, so `slabGeometry` gets its *inner* plane:
 *  `maxZ: PLATEAU.zInner` puts its outer face on `PLATEAU.zOuter` at -6.375,
 *  1.4 mm outside the back panel, with a 0.095 mm overlap into the frame so it
 *  reads fused to the body. Handing it `zOuter` — which is what an earlier
 *  round did — put the whole bar 2.095 mm behind that, detached in profile and
 *  with the lens stack buried inside the frame. See the plane table in
 *  `dims.ts`. */
export function buildPlateau(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'plateau';

  // The outline the chamfer grows from is the rail's outline inset by the
  // chamfer on every side, so the slab's widest layer lands exactly on `RAIL`
  // and the bar reads continuous with the body instead of clipped onto it.
  const outlineCentreY = RAIL.y - PLATEAU.bevel - PLATEAU.height / 2;

  addMesh(
    group,
    slabGeometry({
      width: 2 * (RAIL.x - PLATEAU.bevel),
      height: PLATEAU.height,
      radius: RAIL.radius - PLATEAU.bevel,
      maxZ: PLATEAU.zInner,
      thickness: PLATEAU.zInner - PLATEAU.zOuter,
      bevel: PLATEAU.bevel,
      centreY: outlineCentreY,
      // Real openings for the optics: a lens sits *in* the plateau, not on a
      // solid block of aluminum.
      bores: [
        ...LENSES.map((lens) => ({ x: lens.x, y: lens.y, radius: PLATEAU_CAVITY_RADIUS })),
        { x: FLASH.x, y: FLASH.y, radius: FLASH_CAVITY_RADIUS },
        { x: LIDAR.x, y: LIDAR.y, radius: LIDAR_CAVITY_RADIUS },
        { x: PLATEAU_MIC.x, y: PLATEAU_MIC.y, radius: PLATEAU_MIC_CAVITY_RADIUS },
      ],
    }),
    materials.aluminum,
    'plateau-plate',
    'aluminum',
  );

  group.add(buildLenses(materials));
  group.add(buildFlash(materials));
  group.add(buildLidar(materials));
  group.add(buildPlateauMic(materials));

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
    const seamX = button.edge * (RAIL.x + SEAM_PROUD);

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
        SEAM_PROUD + EMBED,
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
 * A dark disc lying on an end edge, its face flush with the rail: the mouth of
 * a bore. `direction` is the outward sign along Y, so the disc is pushed out
 * by `BORE_PROUD` and no further — a fraction of a pixel, and nothing that can
 * cross the silhouette the way a tube through the edge did.
 */
function boreMouth(radius: number, x: number, direction: 1 | -1): THREE.BufferGeometry {
  const thickness = 0.12;
  const geometry = boreGeometry(radius, thickness, 16);
  geometry.translate(x, direction * (RAIL.y + BORE_PROUD - thickness / 2), 0);
  return geometry;
}

/** USB-C opening with a real cavity and tongue, six speaker bores to its right
 *  and four microphone bores to its left. No SIM tray: US eSIM.
 *
 *  The frame's slot cut leaves the port open at the bottom edge; the cavity
 *  below sits a millimetre inside that opening, so the rim the cut leaves is
 *  the outermost thing at the port — flush with the rail — and the port reads
 *  as a recess rather than as a tab stuck to the bottom. */
export function buildBottom(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'bottom';
  const edge = -RAIL.y;
  const halfWidth = USB_C.width / 2;

  // A dark shell set inside the frame's cut-out, wider than the opening so no
  // seam shows at its sides.
  addMesh(
    group,
    blockGeometry([-halfWidth - 0.8, edge + 1.0, -4.2], [halfWidth + 0.8, edge + 4.0, 4.2], 0.4),
    materials.bore,
    'port-cavity',
    'bore',
    false,
  );
  // The connector tongue: the one lighter surface inside the port. It is
  // polished steel rather than dark like the cavity around it, because the
  // whole port is read from a low angle where only a *bright* surface inside it
  // separates "dark cavity with a metal tongue" from "dark hole".
  addMesh(
    group,
    blockGeometry([-3.3, edge + 1.05, -1.9], [3.3, edge + 1.95, 1.9], 0.2),
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

/** Top edge: clean except one microphone pinhole, offset to the physical
 *  left. It is a dot on the edge face — 1.2 mm across — not a bore tube, which
 *  stuck 3.7 mm out of the edge and read as a black pill from above. */
export function buildTop(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'top';
  addMesh(group, boreMouth(TOP_BORE.radius, TOP_BORE.x, 1), materials.bore, 'mic-top', 'bore', false);
  return group;
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
