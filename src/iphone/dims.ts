/**
 * Millimetre dimensions of the iPhone 17 Pro, and the Z planes every part is
 * placed on. One unit = 1 mm.
 *
 * Coordinates are the body's own: X = width, Y = height, Z = depth, +Z is the
 * screen, origin at the body centre. These are the planes the built geometry
 * actually occupies, and every one of them is asserted by
 * `src/iphone/parts.test.ts`:
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
 * `bevel` is the bar's chamfer, and its outline is pre-shrunk by it so the
 * chamfer grows out to the body's wall rather than standing past the silhouette.
 */
export const PLATEAU = {
  centreY: 56.5,
  height: 37,
  zOuter: -6.375,
  zInner: -4.28,
  bevel: 0.18,
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

/** USB-C opening on the bottom edge. */
export const USB_C = { width: 8.4, height: 3.2, radius: 1.1, centreX: 0 } as const;

/**
 * Speaker bores right of the port, mic bores left of it, on the bottom edge.
 * Each is a flush dark mouth on the edge face — a disc whose face lies on the
 * rail, not a tube pushed through it. The tubes the previous round used stuck
 * 7 mm below the body and rendered as a row of black pins.
 */
export const BOTTOM_BORES = {
  radius: 0.72,
  speakers: [7.5, 10.5, 13.5, 16.5, 19.5, 22.5],
  mics: [-7.5, -10.5, -13.5, -16.5],
} as const;

/** Bore in the top edge face, offset to the physical left (-X). */
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
 * floats off the frame with nothing behind it.
 */
export const BUTTONS = [
  { label: 'action-button', edge: -1, height: 8, centreY: 47, proud: 0.52 },
  { label: 'volume-up', edge: -1, height: 11, centreY: 30, proud: 0.52 },
  { label: 'volume-down', edge: -1, height: 11, centreY: 15, proud: 0.52 },
  { label: 'power-button', edge: 1, height: 19, centreY: 33, proud: 0.5 },
  { label: 'camera-control', edge: 1, height: 17, centreY: -6, proud: 0.08 },
] as const;

/**
 * Antenna bands: short polymer straps crossing the chamfered rail near the
 * corners. Each is a patch sampled along the rail's contour, `halfLength` of
 * arc either side of the strap's middle, so it follows the corner instead of
 * cutting across it. `straps` names the corner (signs on X and Y) and how far
 * round that corner's arc the strap sits, measured from the body's side axis.
 */
export const ANTENNA = {
  /** Half the strap's length along the rail: ~1.8 mm of band. */
  halfLength: 0.9,
  /** Half the strap's extent across the body's depth; it stops short of both
   *  faces, where the rail's chamfer falls away. */
  zHalfExtent: 3.2,
  /** How far the strap's surface stands off the rail. */
  proud: 0.02,
  straps: [
    { sx: 1, sy: 1, angleDeg: 47 },
    { sx: -1, sy: 1, angleDeg: 47 },
    { sx: 1, sy: -1, angleDeg: 47 },
    { sx: -1, sy: -1, angleDeg: 47 },
    { sx: 1, sy: 1, angleDeg: 53 },
    { sx: -1, sy: 1, angleDeg: 53 },
  ],
} as const;

/** Glass-panel geometry: one large rounded rect under the plateau. */
export const BACK_PANEL = {
  /** Gap between the plateau's underside and the panel's top edge. */
  gap: 4,
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
