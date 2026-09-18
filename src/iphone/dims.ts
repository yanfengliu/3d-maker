/**
 * Millimetre dimensions of the iPhone 17 Pro, and the Z planes every part is
 * placed on. One unit = 1 mm.
 *
 * Coordinates are the body's own: X = width, Y = height, Z = depth, +Z is the
 * screen, origin at the body centre. These are the planes the built geometry
 * actually occupies, and every one of them is asserted by the plane gates in
 * `src/iphone/parts.test.ts` and `src/iphone/plateau.test.ts`:
 *
 *   frame        z = -4.375 … +4.375  (anodized unibody, 8.75 mm deep)
 *   front glass  z = +4.375 … +4.975  (0.6 mm proud of the frame's front)
 *   back panel   z = -4.375 … -4.975  (inner face on the frame, 0.6 mm proud)
 *   plateau      z = -4.28  … -6.375  (inner face inside the frame's back face)
 *   lens ring    z = -6.375 … -8.575  (2.2 mm proud of the plateau's face)
 *
 * `slabGeometry` takes the *largest* Z the slab reaches and grows from there
 * towards -Z. A part on the back therefore hands it its **inner** plane, the
 * one against the body: the plateau passes `PLATEAU.zInner`, not `zOuter`, and
 * a call site that passes `zOuter` puts the whole part 2.095 mm behind the
 * numbers above — the plateau landed at z = -8.47 … -6.375, detached from the
 * body, with the lens stack buried inside the frame.
 *
 * Axis convention the layout obeys: the screen faces +Z and the back faces -Z.
 * Viewed from the BACK, the lenses sit on the LEFT half of the plateau, which
 * is the +X half in body space, and the flash/LiDAR/mic sit on the RIGHT half,
 * which is -X. The body's physical LEFT edge is -X (Action + volume) and its
 * physical RIGHT edge is +X (power + Camera Control).
 */

export const BODY = {
  height: 150,
  width: 71.9,
  depth: 8.75,
  radius: 11.5,
  /** Half-depth; the frame's outer surface sits here on both sides. */
  halfDepth: 4.375,
  /** Width of the aluminum reveal visible around the back panel. */
  inset: 1.15,
  /** The rail's chamfer. See `RAIL` below for what it does to the outline. */
  bevel: 0.36,
} as const;

/**
 * The frame's real side wall: the surface every edge part is measured from and
 * must not cross.
 *
 * `slabGeometry` builds its chamfer *outside* the shape it is given, so
 * `buildHousing` hands it a shape pre-shrunk by `BODY.bevel`, and the wall that
 * chamfer grows out to is the nominal outline. Measured off the built housing,
 * its `Box3` is exactly x ±35.950, y ±75.000, radius 11.5 — that is, `BODY.width
 * / 2`, `BODY.height / 2`, `BODY.radius`, and that is what these numbers are.
 * Both ways of getting it wrong are live defects: measuring from the shape's own
 * outline (`width / 2 - bevel`) buries a part 0.36 mm inside the wall, and
 * adding the bevel a second time — what this table held until now — leaves it
 * floating 0.36 mm off the body with nothing touching, which is how the button
 * pills, the bore mouths and the antenna ribbons all came out detached from a
 * wall they were supposed to sit on.
 */
export const RAIL = {
  /** X of the physical left (-) and right (+) side wall. */
  x: BODY.width / 2,
  /** Y of the bottom (-) and top (+) edge wall. */
  y: BODY.height / 2,
  /** Radius of the wall's corner arcs; their centres match the outline's. */
  radius: BODY.radius,
  /** The corner arc centres, in X and Y. */
  centreX: BODY.width / 2 - BODY.radius,
  centreY: BODY.height / 2 - BODY.radius,
} as const;

/** Where the cover glass's outer surface sits. */
export const GLASS_FRONT_Z = BODY.halfDepth + 0.6;

/**
 * Camera plateau: a full-width bar across the top of the back. `zOuter` is the
 * face that carries the optics (-6.375) and `zInner` the face against the frame
 * (-4.28); the 0.095 mm it reaches past the frame's own back face at -4.375 is
 * what makes the bar read fused to the body instead of resting behind it. Both
 * are more negative than the body's surfaces because the back faces -Z.
 *
 * `height` and `centreY` are the bar's own extent, and they put its top edge on
 * `RAIL.y`: the bar runs the full width of the phone and its top edge is the
 * phone's top edge. Measured on the built shell, the raised surface stops just
 * short of that rather than stepping down to a band of the frame's top face:
 * the footprint's base outline reaches y = 74.830, 0.170 mm under `RAIL.y`, and
 * the bump's visible crest — its highest vertex standing outside the frame's own
 * back face — is y = 74.767, 0.233 mm under it. What is exposed above the crest
 * is that strip of the frame's *back* face across the width of the bump; the
 * frame's top face is not what shows behind it. `BASE_INSET` (0.17) is the
 * shortfall, and the edge between `zInner` and `zOuter` is a forged roll rather
 * than a chamfer — `plateau.ts` has the profile and why `slabGeometry` cannot
 * build one: a slab's wall is vertical and its bevel symmetric about the face.
 */
export const PLATEAU = {
  centreY: 56.5,
  height: 37,
  zOuter: -6.375,
  zInner: -4.28,
} as const;

export const GLASS_BEVEL = 0.06;

/** Every lens is the same size, 13.5 mm across the polished ring. */
export const LENS_RADIUS = 6.75;
/** How far the polished ring stands off the plateau face. */
export const LENS_RING_PROUD = 2.2;

/**
 * The three-lens triangle: the Main / Ultra Wide column on the plateau's +X
 * (back-view left) half, the Telephoto right-middle, nearer the plateau's
 * centre. Read from the back that is the *left* column: Main top-left and Ultra
 * Wide bottom-left share `x`, and the Telephoto sits to their right, near
 * enough the middle that its ring reaches across the plateau's centre line.
 * Both `x` values are Apple's straight-on back photo: the column at ≈ 0.20 of
 * the body width from the image's left edge (body x ≈ 22) and the Telephoto at
 * ≈ 0.46 (body x ≈ 2.6). `dims.ts`'s opening note is the axis convention this
 * depends on — mirror the pair to the middle and the triangle comes out
 * left-handed, which is what the previous round shipped.
 */
export const LENSES = [
  { name: 'main', x: 22, y: 67 },
  { name: 'ultrawide', x: 22, y: 46 },
  { name: 'telephoto', x: 2.6, y: 56.5 },
] as const;

/**
 * The plateau's -X (back-view right) half: LED flash upper, LiDAR lower, mic
 * pinhole between them, all on one vertical axis.
 */
export const FLASH = { x: -25.4, y: 65.5, radius: 2.5 } as const;
export const LIDAR = { x: -25.4, y: 48, radius: 4 } as const;
export const PLATEAU_MIC = { x: -25.4, y: 56, radius: 0.6 } as const;

/** The plateau's outer face: where the lens rings and windows sit. */
export const CAMERA_PLANE = PLATEAU.zOuter;

/**
 * Radii of the openings cut through the plateau. Each is the radius of the
 * barrel that sits in it, so the ring's bore lines up with the cavity wall and
 * the optics are visible through a real hole rather than buried in metal.
 */
export const PLATEAU_CAVITY_RADIUS = 6.3;
export const FLASH_CAVITY_RADIUS = 2.35;
export const LIDAR_CAVITY_RADIUS = 3.85;
export const PLATEAU_MIC_CAVITY_RADIUS = 0.75;

/** USB-C opening on the bottom edge. `width` and `height` are the mouth as the
 *  bottom view reads it: 8.4 mm across the body's width and 3.2 mm through the
 *  body's depth, with `radius` corners — the rounded-rectangle aperture in the
 *  rail's bottom face.
 *
 *  Both places that build it carry these numbers. `port.ts`'s `housingGeometry`
 *  draws the notch into the frame's own outline, 8.4 mm wide and 3.2 mm up from
 *  the rail with 1.1 mm corners *at the rail plane*; `PORT_POCKET.mouth` is the
 *  plate whose rounded window is the 8.4 x 3.2 aperture. Both
 *  pre-compensate for `BODY.bevel`: `slabGeometry` grows the slab's middle layer
 *  0.36 mm outside the outline it is handed, and that middle layer is the rail
 *  plane's band, so a notch drawn with the documented numbers alone comes out
 *  7.68 mm wide where the eye reads it. `height` is not the depth of the recess
 *  behind the mouth; the pocket's own planes are in `PORT_POCKET` — and
 *  `PORT_POCKET.mouth`'s face is `PORT_INSET` inside this plane, not on it. */
export const USB_C = { width: 8.4, height: 3.2, radius: 1.1, centreX: 0 } as const;

/** How far a port part is set inside the frame's own face, so the pair can
 *  never be coplanar: an aluminum face exactly level with the frame's z-fights
 *  it and reads as speckled patches across the port (the same class that turned
 *  the button pills black). 0.02 mm is a fiftieth of the frame's own chamfer —
 *  invisible as a step, and two orders of magnitude above the depth buffer's
 *  resolution at this range. The shell plates take it along Z, against the
 *  frame's front and back faces; `PORT_POCKET.mouth` takes it along Y, against
 *  the rail's bottom face. */
export const PORT_INSET = 0.02;

/** How far a bore mouth's face stands off the rail: enough that the disc never
 *  z-fights the wall, far too little to read as a lip at any view. A bore mouth
 *  needs its 0.02 *outward*: the disc lies wholly over the frame's own face, so
 *  a face level with that one would fight it and a face set inside would not be
 *  there at all. `PORT_POCKET.mouth` takes the same 0.02 the other way, for the
 *  opposite reason: see the note there. */
export const BORE_PROUD = 0.02;

/**
 * The USB-C pocket: the recess behind the mouth, and the parts that give the
 * bottom view its read.
 *
 * Three measured facts shape it.
 *
 * The frame's cut is a through-cut along Z. An outline extruded by
 * `slabGeometry` is extruded through the whole 8.75 mm depth, so the notch
 * `port.ts`'s `housingGeometry` draws into the frame's outline removes material
 * from the rail's bottom face across that whole depth: what it leaves there is
 * 8.4 mm wide and 8.75 mm deep, not the 3.2 mm the aperture is documented with.
 * `shell` therefore closes both ends — one plate against each of the frame's
 * faces, spanning the notch's cross-section.
 *
 * `mouth` is what the eye reads as the aperture: a plate filling the notch's
 * bottom opening, with an 8.4 x 3.2 mm rounded window whose corners are
 * `USB_C.radius`, matching the documented rounded rectangle to within 0.02 mm on
 * the built plate. Its face is set `PORT_INSET` (0.02) *inside* the rail's
 * bottom-face plane — measured y = -74.9800 against the frame's own -75.0000 —
 * because its outline is wider than the notch and so lies over the frame's
 * metal: level with the frame's face it would z-fight it, and proud of it (where
 * this build started, at -75.0200) it hangs below the frame's surface instead of
 * being buried in it. `port.ts` carries the measured burial and `port.test.ts`
 * gates it. Without a filler the notch's own floor would be the aperture, and
 * that reads as an 8.4 x 8.75 mm dark rectangle with an angular outline.
 *
 * Everything behind that window is `bore`: `plate` is the dark face 0.03 mm
 * inside it, `liner` is the pocket's floor 0.07 mm behind that, and
 * `liner.ceilingBase` puts the ceiling above the mouth's top line. The window
 * therefore frames the recess's own walls rather than a lit aluminum surface of
 * the frame, which is what the previous build showed as a bright trapezoid
 * floating in the mouth.
 *
 * Every dimension is an offset from the rail's bottom face (y = `-RAIL.y`)
 * except the two half-extents, which are measured from the body's centre line:
 * this is the only part of the phone that crosses from one face to the other.
 */
export const PORT_POCKET = {
  /** The two plates that close the frame's through-cut. */
  shell: {
    /** Each plate's thickness, and how far its outer face is held inside the
     *  frame's own face so the pair can never be coplanar: `PORT_INSET`, the
     *  same 0.02 mm every port face is set inside the frame's with. The notch is
     *  a through-cut, so this plate is what the back and front views see where
     *  the mouth's cross-section opens on the frame's faces; measured on the
     *  built frame, the difference between the plate's face and the frame's own
     *  face beside it is 1.1 luma on the back view and 2.1 on the front, and
     *  changing this inset between 0.008 and 0.02 moves it by less than 0.2. */
    thickness: 0.15,
    inset: PORT_INSET,
    /** The plates' own outline. The notch's opening at the frame's faces is
     *  wider than at the rail plane — measured 9.12 mm across and 3.2 mm tall
     *  there against 8.4 x 3.2 at the middle, because the chamfer's bevel grows
     *  the material into the notch over its last 0.36 mm — so the plates have to
     *  be wider than the mouth to cover it. Their corners are near square and
     *  buried in the frame's metal, which is what covers the notch's own rounded
     *  corners at that depth. */
    width: 9.6,
    height: 3.8,
    radius: 0.01,
    /** The plates' lower edge above the rail's bottom face: clear of that face
     *  by more than the 0.005 mm the Y-plane gate calls coplanar, and 0.06 mm
     *  clear of the mouth plate's top so the two are one plate's edge inside
     *  another, never a shared plane. */
    base: 0.01,
  },
  /** The mouth plate: the metal rim and window the bottom view reads. */
  mouth: {
    /** Its own outline in plan, from the body's centre line: 0.4 mm wider than
     *  the notch at the rail plane on each side, which covers the opening where
     *  the rail's chamfer widens the notch towards the frame's faces. Buried in
     *  the frame's metal, so only the window shows; its corners are near square
     *  because nothing but the window is visible. */
    halfWidth: 4.6,
    halfDepth: 4.28,
    radius: 0.4,
    thickness: 0.09,
    /** How far its bottom face is set *inside* the rail's: `PORT_INSET`, the
     *  opposite sign to `BORE_PROUD` on purpose — see the note above. */
    inset: PORT_INSET,
  },
  /** The dark plate filling that window, and the window in it that the tongue
   *  is seen through. */
  plate: {
    /** Larger than `mouth`'s window all round by 0.2 mm, so its own outline is
     *  buried in the mouth plate's material and cannot leave a coincident pair
     *  of walls or a gap at the aperture's rim. */
    width: 8.8,
    height: 3.6,
    radius: 1.25,
    /** The window the pocket's floor and the tongue are read through: 0.3 mm
     *  inside the aperture on every side, so the aperture's own outline stays
     *  the mouth plate's window and this one reads only as depth. */
    window: { width: 7.8, depth: 2.6, radius: 0.9 },
    thickness: 0.1,
    /** Its bottom face above the rail's. It sits inside `mouth`'s thickness, so
     *  the metal rim of the window is what the eye meets first and this face is
     *  the dark one behind it. */
    base: 0.03,
  },
  /** The pocket's floor and ceiling. Both are `bore`, and both are inside the
   *  pocket: their lowest faces sit above the rail's bottom face, which is what
   *  stops them reading as a dark frame hanging under the phone — the failure
   *  this round fixes. */
  liner: {
    /** The floor plate's own extent in plan, wider than the notch at its
     *  narrowest (8.4 x 8.6 mm at the rail plane) so no edge of it can show
     *  inside the mouth. */
    halfWidth: 4.5,
    halfDepth: 4.3,
    /** Its thickness and its bottom face above the rail's: 0.07 mm behind the
     *  dark plate's face and 0.02 mm clear of it, so the two never share a
     *  plane. */
    thickness: 0.04,
    base: 0.1,
    /** The ceiling plate's underside above the rail, and its thickness.
     *
     *  `ceilingBase` clears the mouth's own 3.2 mm by 0.012 mm. That gap is
     *  load-bearing rather than cosmetic: the plate spans the mouth's whole
     *  opening and the ceiling is the wall above it, so the two are the same
     *  outline at almost the same Y, and landing the ceiling exactly on the
     *  mouth's top line is the coplanar pair the Y-plane gate catches. */
    ceilingBase: 3.212,
    ceilingThickness: 0.2,
  },
  /** The connector tongue: a thin dark-steel strip on the pocket's floor, its
   *  root buried in the floor plate and its underside the only face the bottom
   *  view reaches.
   *
   *  Measured: the previous build's tongue stood 0.6 mm above the rail and ran
   *  from z = -3 to z = 4.1, so its whole underside — 6.6 x 7.1 mm at
   *  y = -75.02, below the rail's own plane — was what the bottom view saw, lit
   *  by the environment under the phone and read as a grey-blue trapezoid
   *  floating in the middle of the mouth. This one is 0.26 mm tall, sits 0.08 mm
   *  above the rail, and runs 1.1 mm along Z in the mouth's *deep* half: the
   *  bottom view looks up and back, so the half nearer the body's back (-Z) is
   *  the half that reads below the aperture's mid-line — measured on
   *  `.shots/sweep/cosmic-orange_port.png`, a strip at +Z renders in the upper
   *  half of the opening and the same strip at -Z in the lower. Its top is
   *  0.34 mm above the rail, well below the mouth's 1.6 mm mid-height, so it
   *  reads as a strip near the mouth's floor rather than as the brightest thing
   *  in frame. Its material is `materials.ts`'s `tongue`: `0x343841` at metalness
   *  0.9, roughness 0.42 and anisotropy 0.3, which renders the strip at 43 luma
   *  against the pocket's 11 and the rail's 95. */
  tongue: {
    baseY: 0.08,
    topY: 0.34,
    halfWidth: 3.3,
    minZ: -1.45,
    maxZ: -0.35,
    radius: 0.06,
  },
} as const;

/**
 * Speaker bores right of the port, mic bores left of it, on the bottom edge.
 * Each is a flush dark mouth on the edge face — a disc whose face lies on the
 * rail, not a tube pushed through it. The tubes the previous round used stuck
 * 7 mm below the body and rendered as a row of black pins.
 *
 * Five a side, on a 3 mm pitch from ±7.5: netzwelt's iPhone 17 Pro hands-on
 * headline counts "die fünf Löcher unten rechts" (five holes bottom right), and
 * the symmetric mic side is the pre-release CAD leak's arrangement. The
 * headline is the firm half — it counts the bores in a hands-on photo — while
 * the mic side is the leak's, so treat the left five as one step less certain
 * than the right five. `gsmr-033.jpg` cannot settle the count either way: its
 * bottom edge is filmed at a grazing angle against a bright floor, and the bores
 * there read as four dark smudges — a row of six or of five is not
 * distinguishable at that size, which is why the count rests on the headline.
 */
export const BOTTOM_BORES = {
  radius: 0.72,
  speakers: [7.5, 10.5, 13.5, 16.5, 19.5],
  mics: [-7.5, -10.5, -13.5, -16.5, -19.5],
} as const;

/**
 * Bore in the top edge face, offset to the physical left (-X). It stays on the
 * face because the plateau's rolled top stops at the rail: the wrap covers the
 * back of the top edge, and the frame's face is still exposed in front of it,
 * so the bore reads on the top edge exactly as it did before the wrap.
 */
export const TOP_BORE = { x: -17.5, radius: 0.6 } as const;

/**
 * Dynamic Island: a pill lying *on* the cover glass, its top edge 12 mm below
 * the glass's own top edge. It is inset into the surface plane rather than
 * standing off it — a proud island reads as a black blob floating in front of
 * the screen in every profile view.
 */
export const ISLAND = {
  width: 29,
  height: 8.8,
  /** Distance from the glass's top edge to the island's top edge. */
  topInset: 12,
  /** How far the island's face stands off the glass surface. */
  proud: 0.05,
  /** Front camera window, in the island's right half as seen from the front. */
  cameraX: 7.25,
} as const;

/**
 * Buttons, in body space. `edge` is the X of the frame face the pill leaves:
 * -1 for the physical left edge (-X), +1 for the right (+X). `proud` is
 * measured from `RAIL.x`, so a pill's outer face lands on the rail plus that
 * and its body runs back to the rail — a pill that stops short of `RAIL.x`
 * floats off the frame with nothing behind it. Negative `proud` is a face set
 * into the rail, which is what Camera Control needs: see `camera-control` below.
 *
 * `seamProud` is the plane the dark seam around that pill sits on. It is a
 * per-button number rather than a shared constant because the seam has to
 * follow its own pill: a seam more proud than the pill it frames stands in
 * front of it and covers it, which is what a shared 0.06 did to a pill pulled
 * back to the rail.
 */
export const BUTTONS = [
  { label: 'action-button', edge: -1, height: 8, centreY: 47, proud: 0.52, seamProud: 0.06 },
  { label: 'volume-up', edge: -1, height: 11, centreY: 30, proud: 0.52, seamProud: 0.06 },
  { label: 'volume-down', edge: -1, height: 11, centreY: 15, proud: 0.52, seamProud: 0.06 },
  { label: 'power-button', edge: 1, height: 19, centreY: 33, proud: 0.5, seamProud: 0.06 },
  // Camera Control is not a button: it is a sapphire strip reading level with
  // the rail, with the touch sensor under it. A pill *on* the rail — what a
  // proud of 0.08 with a 0.06 seam produced — shows a rounded side wall that
  // catches the key light, and a closed dark outline around it, so the strip
  // reads as a raised dark pill in every grazing view. Both faces are set into
  // the rail instead: the sapphire at -0.02 and its seam at -0.03, a 0.01 mm
  // step between them, so what shows is a shallow well with a glossy floor and
  // no lit edge standing off the metal.
  { label: 'camera-control', edge: 1, height: 17, centreY: -6, proud: -0.02, seamProud: -0.03 },
] as const;

/**
 * Antenna bands: short polymer straps crossing the chamfered rail near the
 * corners. Each is a patch sampled along the rail's contour, `halfLength` of
 * arc either side of the strap's middle, so it follows the corner instead of
 * cutting across it. `straps` names the corner (signs on X and Y) and how far
 * round that corner's arc the strap sits, measured from the body's side axis.
 *
 * The top straps sit at 22° and 28° rather than the 47° and 53° they held
 * before the plateau was rebuilt: at those angles they crossed into the rolled
 * bump, which stands 2.0 mm proud of the frame's back face and swallowed all
 * but the strap's front edges. `zHalfExtent` is 2.8 for the same reason — the
 * strap stops well in front of `PLATEAU.zInner`, so a band cannot reach the
 * roll no matter which way its corner's arc runs.
 */
export const ANTENNA = {
  /** Half the strap's length along the rail: ~1.8 mm of band. */
  halfLength: 0.9,
  /** Half the strap's extent across the body's depth; it stops short of both
   *  faces, where the rail's chamfer falls away, and short of the plateau's
   *  rolled edge behind it. */
  zHalfExtent: 2.8,
  /** How far the strap's surface stands off the rail. */
  proud: 0.02,
  straps: [
    { sx: 1, sy: 1, angleDeg: 22 },
    { sx: -1, sy: 1, angleDeg: 22 },
    { sx: 1, sy: -1, angleDeg: 22 },
    { sx: -1, sy: -1, angleDeg: 22 },
    { sx: 1, sy: 1, angleDeg: 28 },
    { sx: -1, sy: 1, angleDeg: 28 },
  ],
} as const;

/** Glass-panel geometry: one rounded rect under the plateau, whose top edge is
 *  shaped around the plateau's rolled bottom rather than being a straight line.
 *  `gap` is the clearance at the panel's centre; `topRise` is how much higher
 *  the top edge sits at the panel's own corners, which is what tucks them in
 *  around the plateau's rolled bottom corners. */
export const BACK_PANEL = {
  /** Gap between the plateau's rolled underside and the panel's top edge at
   *  the centre of the panel. */
  gap: 3.5,
  /** How much higher the panel's top corners sit than its top edge's centre.
   *  Measured on the built panel this leaves 1.6 mm of clearance at x = ±28 and
   *  never less than 0.9 mm anywhere along the top edge. */
  topRise: 2.7,
  /** Radius of the panel's top corners. Tighter than `radius` below, and that
   *  is load-bearing: the top edge's rise has to still be in place within ~3 mm
   *  of the panel's own sides to clear the plateau's rolled corners there, and a
   *  10 mm corner would have carried the edge back down by then. The bottom
   *  corners keep the documented 10. */
  topRadius: 5,
  /** Distance from the panel's bottom edge to the body's bottom edge. */
  bottomReveal: 12,
  /** Inset from each side of the frame. */
  sideInset: 4.5,
  radius: 10,
  /** How far the panel stands outside the frame's back face. */
  thickness: 0.6,
} as const;

/** MagSafe ring: barely-there tonal circle in the panel's centre. */
export const MAGSAFE = { radius: 25.6, tube: 0.75, centreY: -22 } as const;

/** Apple logo height in millimetres, and where its centre sits on the back. */
export const LOGO_HEIGHT = 14;
export const LOGO_CENTRE_Y = -14.5;

/**
 * The presentation lean, in degrees, and its tangent. The model leans back
 * about the X axis, so a part's world Z depends on its height up the body:
 * every "flush with a plane" placement has to account for it, and getting it
 * wrong buries the part under the surface it was meant to sit on.
 */
export const LEAN_DEG = 8;
export const TAN_LEAN = Math.tan((LEAN_DEG * Math.PI) / 180);

/**
 * A part's Z needs shifting by `(centreY - y) * tan(lean)` to stay on the same
 * leaning plane as a surface whose reference height is `centreY`. The body
 * leans back about X, so a point *above* the reference ends up further forward
 * in world Z: place a part 53 mm above a panel's centre and, without this
 * correction, it sits about 7 mm underneath that panel'ssurface.
 */
export function leanOffset(y: number, centreY = 0): number {
  return (centreY - y) * TAN_LEAN;
}
