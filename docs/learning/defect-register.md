# Defect register

The standing list of what the gates could not see, and the gate that now covers each entry. A defect a user reports is fixed *and* gated: an entry stays here after it becomes a gate, because the register is where the next defect comes from. A gate counts only once it has been made to go red by reintroducing the defect — that evidence is recorded with the entry.

Format per entry: **symptom** (what a person saw) · **investigation** (what was measured) · **root cause** · **gate** (the check that covers the class, and its red proof) · **bounds** (what the gate does not cover).

## 2026-09-16 — edge parts measured from a rail that was 0.36 mm too wide

**Symptom.** In the iPhone 17 Pro viewer every edge detail floated off the phone: the button pills hovered beside the frame with a dark gap behind them, the speaker and mic mouths sat 0.26 mm below the bottom edge as black pins, and the antenna ribbons hung 0.38 mm off the corners. In the profile shots the pills also rendered near-black and speckled with a diagonal hatch.

**Investigation.** `src/iphone/parts.test.ts` did not exist, so this started as a throwaway measurement of the built geometry (parts built with stub materials, real `Box3`s and real vertices):

- `slabGeometry({ width: 10, bevel: 1 })` spans ±6.00, i.e. `ExtrudeGeometry` applies the chamfer *outside* the shape handed in; the end faces are that outline and the slab's middle stands `bevel` proud.
- `buildHousing` hands it a shape pre-shrunk by `BODY.bevel`, so the frame's own `Box3` is exactly x ±35.950, y ±75.000, radius 11.5 — `BODY.width / 2`, `BODY.height / 2`, `BODY.radius`.
- `RAIL` read 36.31 / 75.36 / 11.86: the chamfer counted a second time.
- Measured against the real wall, the action pill spanned x[-36.83, -36.31] (0.36 mm clear of the body), its seam plate x[-36.83, -36.77] (0.82 mm clear), a speaker mouth y[-75.38, -75.26] (0.26 mm below the edge), and an antenna ribbon sat on a corner arc of 11.88 instead of 11.5.
- The pill's outer face and its seam's outer face were the *same plane*, both at ±36.83. Two coplanar faces fight for the same depth samples, and the near-black seam won often enough to read as a black, speckled pill — the diagonal hatch was that fight.

**Root cause.** Round 3 corrected the bevel direction and then applied it one time too many: `BODY.width / 2 + BODY.bevel` is the *shape's* outline, not the wall the shape's chamfer grows out to. Nothing caught it because nothing measured the built geometry against the surface it claims to sit on — every part and its expectation came from the same wrong constant.

**Gate.** `src/iphone/parts.test.ts`, `describe('the edge contract against the built geometry')`:

- the frame's own `Box3` must equal `RAIL` on all four sides — this is the *anchor*, and it is the check that has to exist first: parts are built *from* `RAIL`, so a wrong `RAIL` moves the measurement and the expectation together and every per-part bound still passes. Measured against the frame's real silhouette, it cannot.
- every edge part's outermost point must land on the rail plus its own documented stand-off, within `ATTACHED_SLACK` in either direction. Too far out is the floating pill; too far in is a pill buried in the frame, which is just as wrong and just as invisible.

Red proof, each run against the gate with that one mutation and then reverted:

- `RAIL` restored to `…/ 2 + BODY.bevel`: `puts the frame's own silhouette exactly on RAIL` →
  `expected 35.95000076293945 to be close to 36.31, received difference is 0.35999923706054915, but expected 0.0005`
- a pill placed on the 0.36-wide rail while `RAIL` is correct (the round-3 float, reproduced): `seats every control pill…` →
  `action-button stands 0.8800 mm past the rail; its documented stand-off is 0.52 mm: expected 0.8800018310546847 to be less than or equal to 0.53`
- antenna straps sunk 0.5 mm into the frame (the buried direction): `lays every antenna strap on the rail contour` →
  `antenna-band stops 0.4800 mm short of the rail, buried in the body (nearest vertex -0.4800 mm short): expected -0.47999649396991906 to be greater than or equal to -0.05`

**Caught on the gate's first run** (a real defect the eye had not reached): the plateau microphone window was 0.67 mm across inside a 0.75 mm hole, so the frame's bright aluminum back face was visible down that bore. Same class — a part sized against a number instead of against the opening it has to cover. Covered by `it('lines each cavity with a window at least as wide as the hole, recessed behind its bezel')`, which failed with `mic-hole is narrower than the 0.75 mm hole it lines: expected 0.6700000166893005 to be greater than or equal to 0.7`.

**Bounds.** The gate covers the XY silhouette of the parts listed in `parts.test.ts` — housing, front glass, plateau (with the lens stack), back panel, controls, antennas, bottom/top ports. It does not see `buildBack`'s logo or MagSafe ring, because the logo parses an SVG and needs a DOM a node test has not got; it does not see `scene.ts`, `views.ts` or anything the renderer does.

## 2026-09-16 — back-facing slabs built from their outer plane

**Symptom.** In profile views the camera plateau read as a bar detached from the back of the phone with a dark gap between them, and in the top view as a shadowed step behind the body's top rail. Every lens sat at the bottom of a deep black bore instead of standing proud of the plateau in a polished ring.

**Investigation.** Measured `buildPlateau`'s plate: z[-8.470, -6.375], where `dims.ts` documents z[-6.375, -4.28]; the lens stack occupied z[-6.375, -3.175], i.e. entirely inside the frame. `slabGeometry` takes the slab's *largest* Z and grows towards -Z, and the plateau call site passed `PLATEAU.zOuter` (-6.375), the outer face. The back panel had the same error one step smaller: z[-5.575, -4.975] against a documented [-4.375, -4.975], leaving it floating 0.6 mm off the frame with a dark gap around its edge.

**Root cause.** `slabGeometry`'s parameter was named `outerZ` and read as "the outer surface" by every back-facing call site, while the function means "the maximum-Z face". On the front those coincide; on the back they are the two ends of the slab.

**Gate.** `describe('the documented Z planes')` in `src/iphone/parts.test.ts` asserts the plateau's plate against `PLATEAU.zOuter` / `zInner`, the panel against `PANEL_INNER_Z` / `PANEL_FACE_Z`, the cover glass against the frame's front face and `GLASS_FRONT_Z`, and each lens ring against `CAMERA_PLANE - LENS_RING_PROUD`. The parameter is now named `maxZ`, `dims.ts` carries the plane table with the rule for back-facing parts, and `slabGeometry`'s own contract comment says which plane a back-facing part hands it.

Red proof: with `maxZ: PLATEAU.zOuter` restored, `builds the camera plateau between the planes dims.ts documents` →
`expected -8.470000267028809 to be close to -6.375, received difference is 2.0950002670288086, but expected 0.0005`.

**Bounds.** Z planes only, and only for the parts the node test can build. A part buried *inside* another (invisible but present) passes, as do defects that are purely material or lighting.
