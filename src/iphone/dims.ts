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

/** USB-C opening on the bottom edge: the port's *mouth*, as the bottom view
 *  reads it — the width and height of the hole in the rail, with rounded
 *  corners. It is not the depth of the recess behind it; that is
 *  `PORT_POCKET.depth` below.
 *
 *  `radius` is the mouth's *intended* corner radius: the rounded rectangle the
 *  design promises, and the outline the port's shell plates are drawn with
 *  inside the frame. The frame's cut does not build it — `buildHousing` cuts
 *  the slot with `PORT_CUT_RADIUS` (0.24), because a 3.2 mm-tall hole carrying
 *  1.1 mm corners cannot keep its arcs above the rail (derivation in
 *  `PORT_CUT_INSET` below). So the lip reads a rectangle with 0.24 corners
 *  while the 1.1 corners sit behind it on the shell plates, and the two numbers
 *  stay named side by side rather than one being quietly rewritten. */
export const USB_C = { width: 8.4, height: 3.2, radius: 1.1, centreX: 0 } as const;

/**
 * How far above the rail's own bottom face the housing's slot cut is posed, and
 * how tight its corners have to be.
 *
 * The cut is a hole in the shape `slabGeometry` extrudes, and that shape is
 * pre-shrunk by the frame's chamfer, so the shape's own bottom line is
 * `BODY.bevel` above the rail and only grows out to the rail over the bevel's
 * band. Three things follow, and all three were measured rather than reasoned:
 *
 *  - A hole posed *on* the rail cuts a shallow V: it reaches the rail in the
 *    middle of the slab and stops `BODY.bevel` short of it at the frame's two
 *    faces, so the mouth's ends are closed by a wedge of the rail's face. That
 *    is the shape round 6 shipped, which measured 6.7 mm wide and 1 mm deep.
 *  - A hole posed *below* the rail cuts the mouth flat-bottomed, but its own
 *    outline then crosses the shape's bottom edge, and the curved corner arcs
 *    the triangulator keeps as its end caps put vertices up to `PORT_CUT_INSET`
 *    below the rail — measured: a 0.5 mm notch's worth, and the frame's
 *    silhouette gate reads those vertices as the frame standing 0.5 mm past the
 *    rail it is supposed to be sitting on.
 *  - So the hole is posed just *above* the rail and its corners are held to
 *    `cutRadius`, which is what the geometry leaves: with the mouth's height `h`
 *    and this inset `i`, a corner of radius `r` reaches
 *    `-r + sqrt(r² - (h/2 - i)²)` below the hole's own centre, and that has to
 *    stay above the rail. A corner radius of `USB_C.radius` (1.1 mm) cannot:
 *    it needs `h/2 - i` above the centre, so a 3.2 mm mouth would have to be
 *    4.2 mm deep to hold it.
 *
 * What the cut builds is therefore a flat-bottomed notch `USB_C.width` across
 * and `USB_C.height` up from the rail (the hole crosses the shape's own bottom
 * edge, and the chamfer pulls the notch's floor out to the rail), with corners
 * held to `PORT_CUT_RADIUS` rather than to the `USB_C.radius` the mouth is
 * documented with. The 1.1 corners are the shell plates', not this cut's.
 */
export const PORT_CUT_INSET = 0.005;
/** The corner radius the housing's slot is actually cut with: a `USB_C.height`
 *  hole cannot carry the mouth's documented `USB_C.radius` corners and keep
 *  its arcs above the rail (see above). */
export const PORT_CUT_RADIUS = 0.24;

/** How far a port part is set inside the frame's own face, so the pair can
 *  never be coplanar: an aluminum face exactly level with the frame's z-fights
 *  it and reads as speckled patches across the port (the same class that turned
 *  the button pills black). 0.02 mm is a fiftieth of the frame's own chamfer —
 *  invisible as a step, and two orders of magnitude above the depth buffer's
 *  resolution at this range. */
export const PORT_INSET = 0.02;

/**
 * The USB-C pocket: the recess behind the mouth, and the one part of the port
 * the frame's own through-cut cannot describe.
 *
 * `slabGeometry` cuts the slot through the whole slab, so the housing's cut is
 * necessarily a through-hole: without something filling its cross-section, the
 * port reads as a dark slot in the *front* and *back* silhouettes as well as in
 * the bottom one. The frame's cut is kept anyway, because it is the only thing
 * that puts a real mouth through the rail's chamfer.
 *
 * The cut is a funnel, not a tube: its walls are the chamfer's, so its opening
 * is narrowest at the frame's two faces and widens towards the slab's middle.
 * Every part here spans the mouth's whole 8.4 x 3.2 mm opening, from the rail to
 * the mouth's own top line, because that is what it takes to close the cut: the
 * round before this one left a 0.65 mm band of the opening covered by nothing at
 * all, and a ray along -Z crossed the phone's whole 8.75 mm depth through it.
 *
 *   - `port-shell` is the cut's filling — one `shellThickness` plate against
 *     each face of the frame, spanning the mouth's whole opening in Y, so every
 *     sightline along Z through that opening meets aluminum. A single block
 *     deep enough to fill both ends would have to be as wide as the funnel at
 *     its middle, which is wider than the funnel's own faces: it stands proud of
 *     the rail's chamfer and the port reads as a dark lump stuck to the bottom
 *     of the phone, which is one of the two failures this part is written
 *     against.
 *   - the liner is the pocket's floor and ceiling — two horizontal plates, both
 *     reaching from the mouth's opening out to the frame's own two faces (less
 *     `PORT_INSET`) so the through-cut's ends are closed by liner as well as by
 *     the shell, and the pocket is left open on one side only: -Y. They are
 *     built as blocks rather than slabs, because `slabGeometry` extrudes along Z
 *     and a "flat plate" written that way stands on edge at the body's middle.
 *   - the tongue sits in the floor's opening, and it is the floor's own
 *     aperture: the floor's top is a hair below the tongue's base and the
 *     tongue's footprint is wider than the aperture all round, so the two
 *     surfaces seal against each other and the only thing a sightline from
 *     below meets inside the aperture is the tongue. An earlier version put the
 *     liner's floor across the whole mouth with its top face level with the
 *     rail's bottom face: the floor was the first thing every upward ray met,
 *     and the tongue was not visible from anywhere — the second failure.
 *
 * Every dimension is written from the rail and the frame's half-depth rather
 * than as an absolute Z: this is the only part of the phone that crosses from
 * one face to the other.
 */
export const PORT_POCKET = {
  /** How far the pocket's ceiling sits above the rail. */
  depth: 2.5,
  /** The shell plates' thickness, and how far their lower edge is held above the
   *  rail's bottom face.
   *
   *  The plates have to stop clear of that face: an edge landing on it, or
   *  within 0.005 mm of it, is the coplanar pair the port's Y-plane gate
   *  measures — and this pair used to be the one the gate could not see, because
   *  it only compared Z. `plateBase` is well clear of the floor's own
   *  `liner.drop`, so the lower band of the opening is the tongue's alone. */
  shellThickness: 0.15,
  plateBase: 0.012,
  /** The pocket's floor and ceiling: the tunnel's own two walls.
   *
   *  Both plates carry the mouth's rounded rectangle in plan — the same outline
   *  the cut has — and both reach to the frame's own faces, less
   *  `PORT_INSET`. The floor's top sits `drop` below the rail's bottom face,
   *  and that offset is load-bearing rather than cosmetic: a floor whose top
   *  face lands exactly in the rail's own plane is a coplanar pair with it, and
   *  the two fight for the depth samples the mouth is read through. The z-plane
   *  gate saw the port's other coplanar pairs and could not see this one,
   *  because it only ever compared Z. */
  liner: {
    /** The plates' thickness: thin enough that what they add below (or above)
     *  the rail is a fraction of a pixel, thick enough to be a solid against a
     *  ray rather than a surface. */
    thickness: 0.02,
    /** The floor's top face, below the rail's bottom face. */
    drop: 0.01,
    /** How far the plates' outer faces are held inside the frame's own, so no
     *  plate's end can be coplanar with a frame face. */
    inset: PORT_INSET + 0.055,
    /** The ceiling plate's underside above the rail, and its thickness.
     *
     *  `ceilingBase` clears the mouth's own 3.2 mm and clears the shell plate's
     *  top edge by more than `MIN_SEPARATION` too: the plate spans the mouth's
     *  whole opening and the ceiling is the wall above it, so the two are the
     *  same outline at almost the same Y, and 0.004 mm of daylight between them
     *  — what landing the ceiling exactly on the mouth's top line left — is the
     *  coplanar pair the Y-plane gate catches. */
    ceilingBase: 3.212,
    ceilingThickness: 0.2,
  },
  /** The connector tongue inside the pocket, measured from the rail and the
   *  body's centre line. It is the one bright surface in the port and has to be
   *  seen from below: it is narrower than the mouth so the dark liner shows on
   *  both sides of it, and its footprint is wider than the floor's aperture so
   *  the two overlap and no sightline can slip between them.
   *
   *  `topY` is the whole reason the tongue reads at all. A ray into the mouth
   *  comes over the rail's own lip, so the highest surface it can reach at the
   *  tongue's tip is set by the mouth's opening and the tip's Z: at
   *  `maxZ` = `mouthZ` - 0.275 the tip may stand 0.1 mm above the rail, and the
   *  0.6 mm it stands here is visible from about 3 degrees below the phone's
   *  bottom face — a shallow view, which is the view a port is looked at from.
   *
   *  `baseY` sits below the floor's top face on purpose: the tongue's root is
   *  buried in the liner and only its upper part stands in the opening, so the
   *  two parts' surfaces meet inside solid material instead of leaving the
   *  0.005 mm slit a face-to-face pair would. It stops inside the liner's own
   *  thickness, so the root is buried without the tongue's underside becoming
   *  the lowest point of the port. */
  tongue: {
    baseY: -0.02,
    topY: 0.6,
    halfWidth: 3.3,
    minZ: -3,
    maxZ: 4.1,
    radius: 0.08,
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

/** How far a bore mouth's face stands off the rail: enough that the disc never
 *  z-fights the wall, far too little to read as a lip at any view. */
export const BORE_PROUD = 0.02;

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
