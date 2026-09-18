import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  ANTENNA,
  BODY,
  BORE_PROUD,
  BOTTOM_BORES,
  BUTTONS,
  CAMERA_PLANE,
  GLASS_FRONT_Z,
  LENS_RING_PROUD,
  LENSES,
  PLATEAU,
  RAIL,
  TOP_BORE,
} from './dims.js';
import {
  buildAntennas,
  buildBack,
  buildBackPanel,
  buildBottom,
  buildControls,
  buildFront,
  buildHousing,
  buildPlateau,
  buildTop,
  MMWAVE,
  PANEL_FACE_Z,
  PANEL_INNER_Z,
} from './parts.js';
import {
  ATTACHED_SLACK,
  expectOnRail,
  expectSeamBand,
  materials,
  outerFace,
  panelFootprint,
  railProfile,
  railReach,
  required,
  VERTEX_SLACK,
  worldBox,
} from './test-helpers.js';

/**
 * The edge contract, measured rather than restated.
 *
 * Round 3 shipped every edge part keyed off `RAIL`, and `RAIL` was wrong: it
 * added the frame's chamfer to the nominal outline a second time, so the wall
 * it described was 0.36 mm outside the real one and every part measured from it
 * floated off the phone — pills hanging in space, bore discs below the bottom
 * edge, antenna ribbons off the corners. Nothing caught it because nothing
 * measured the built geometry against the surface it claims to sit on.
 *
 * So these tests build the real parts and measure their real vertices. The
 * contract they assert has an anchor and a window. The anchor: the frame's own
 * bounding box must land on `RAIL`, which is what pins the rail table to
 * measured geometry instead of to itself — a gate built only from the same
 * constant as the thing it checks proves nothing, and this one is built to fail
 * the moment the two disagree. The window: every edge part's outermost point
 * must land on the rail plus its own documented stand-off, within a few
 * hundredths of a millimetre either way, because a part that stops short of the
 * rail floats and a part that goes past it disappears into the frame.
 *
 * Vertices, not bounding boxes: the rail outline is convex, so a triangulated
 * face whose vertices are inside it is inside it, while the bounding box of a
 * strap curved along a corner arc bulges outside the arc it follows.
 *
 * Two ways of measuring this wrongly, both of which produced a red gate against
 * a correct model on this file's first run, so do not reintroduce either:
 * vertex positions are 32-bit floats, so a bound met exactly reads ~4 µm out and
 * a millionth-of-a-millimetre tolerance fails on arithmetic rather than on
 * geometry (`VERTEX_SLACK`); and `Box3.setFromObject` refreshes the object's
 * own subtree but *not* the groups above it, so a lens ring measured without
 * `worldBox` reports its local coordinates and passes whatever its group's
 * transform does.
 *
 * The port's own gates — the through-cut, the Y planes and the tongue's
 * sightline — live in `port.test.ts`, and the plateau's roll and openings in
 * `plateau.test.ts`. The measurements all three files take are in
 * `test-helpers.ts`.
 */

describe('the edge contract against the built geometry', () => {
  it('puts the frame’s own silhouette exactly on RAIL', () => {
    // Everything else in this file keys off `RAIL`, so the first thing to
    // establish is that `RAIL` describes the frame that was actually built.
    // Round 3's table did not: it read 0.36 mm wide of the wall, and every part
    // measured from it floated that far off the phone.
    const frame = worldBox(buildHousing(materials));
    expect(frame.max.x).toBeCloseTo(RAIL.x, 3);
    expect(frame.min.x).toBeCloseTo(-RAIL.x, 3);
    expect(frame.max.y).toBeCloseTo(RAIL.y, 3);
    expect(frame.min.y).toBeCloseTo(-RAIL.y, 3);
  });

  it('seats every control pill in its documented plane, proud or recessed', () => {
    const controls = buildControls(materials);
    for (const button of BUTTONS) {
      const pill = required(controls, button.label);
      const seam = required(controls, `${button.label}-seam`);
      // Signed stand-off, so a face set *into* the rail is measured the same
      // way as one standing off it: positive is the part floating, negative is
      // the part buried. Camera Control's two faces are negative on purpose —
      // a strip level with the rail is a recess, not a pill.
      for (const [part, proud, label] of [
        [pill, button.proud, button.label],
        [seam, button.seamProud, `${button.label}-seam`],
      ] as const) {
        const { overhang } = railProfile(part);
        expect(
          overhang,
          `${label} stands ${overhang.toFixed(4)} mm off the rail; its documented stand-off is ${String(proud)} mm`,
        ).toBeLessThanOrEqual(proud + VERTEX_SLACK);
        expect(
          overhang,
          `${label} stops ${(-overhang).toFixed(4)} mm short of the rail, buried in the body`,
        ).toBeGreaterThanOrEqual(proud - ATTACHED_SLACK);
      }
      // `proud` means the pill's outer face is the rail plus that, exactly.
      expect(outerFace(worldBox(pill), button.edge)).toBeCloseTo(RAIL.x + button.proud, 3);
      // The seam sits behind the pill and is larger than it, so what shows is
      // the dark sliver around the pill's base. Two faces on one plane is what
      // made the pills render black and speckled.
      expect(outerFace(worldBox(seam), button.edge), `${button.label}: the seam is not behind the pill`).toBeCloseTo(RAIL.x + button.seamProud, 3);
      expect(button.seamProud, `${button.label}: the seam's plane is level with the pill's own — a coplanar pair`).not.toBeCloseTo(button.proud, 5);
      // How wide that sliver actually is, around the pill's whole silhouette:
      // `expectSeamBand` carries the two bounds and the frames they came from.
      expectSeamBand(button.label, pill, seam);
    }
  });

  it('lays every antenna strap on the rail contour', () => {
    const antennas = buildAntennas(materials);
    expect(antennas.children.length).toBe(ANTENNA.straps.length);
    for (const strap of antennas.children) {
      expectOnRail(strap, strap.name, ANTENNA.proud);
    }
  });

  it('keeps every bore mouth flush on the edge it is cut into', () => {
    const bottom = buildBottom(materials);
    for (const child of bottom.children) {
      if (child.name !== 'speaker' && child.name !== 'mic-bottom') continue;
      expectOnRail(child, child.name, BORE_PROUD);
    }
    expectOnRail(required(buildTop(materials), 'mic-top'), 'mic-top', BORE_PROUD);
    // The bores read as holes only while they are on the edge face: the
    // previous round's floated 0.26 mm below it, and a mouth that has left the
    // edge is a black pin hanging under the phone.
    const offsets = [...BOTTOM_BORES.speakers, ...BOTTOM_BORES.mics].map((x) => railReach(x, 0));
    expect(Math.max(...offsets)).toBeLessThan(RAIL.radius);
    expect(railReach(TOP_BORE.x, 0)).toBeLessThan(RAIL.radius);
  });

  it('keeps the port cavity and its tongue inside the body', () => {
    // Re-expressed: the bound here is a literal, not the implementation's own
    // `PORT_POCKET.liner.thickness`. A bound built from the constant the part is
    // placed with cannot fail — the old one was `floorThickness + VERTEX_SLACK`,
    // so any thickness at all passed, and a 0.5 mm lip under the phone would
    // have gone green.
    //
    // 0.03 mm is derived from the model's other flush surfaces instead: a bore
    // mouth stands `BORE_PROUD` (0.02) off the rail and is the only edge part
    // allowed to cross the outline at all, so the port's own liner may add the
    // same order of magnitude plus the measured vertex slack; the floor and the
    // tongue land under it by construction, and `port-mouth` — the crossing face
    // this walk was missing — is measured 0.019997 mm inside the rail's bottom
    // plane now. A lip an order of magnitude larger is what this catches.
    const LINER_OVERHANG_BOUND = 0.03;
    const bottom = buildBottom(materials);
    for (const name of ['port-cavity', 'port-tongue', 'port-shell', 'port-cavity-ceiling', 'port-mouth']) {
      const profile = railProfile(required(bottom, name));
      expect(
        profile.overhang,
        `${name} reaches ${profile.overhang.toFixed(4)} mm past the rail — a lip under the phone`,
      ).toBeLessThanOrEqual(LINER_OVERHANG_BOUND);
    }
  });

  it('keeps the body, its glass and its camera bar inside the silhouette', () => {
    for (const [label, part] of [
      ['housing', buildHousing(materials)],
      ['front glass', buildFront(materials)],
      ['camera plateau', buildPlateau(materials)],
      ['back panel', buildBackPanel(materials)],
    ] as const) {
      const profile = railProfile(part);
      expect(profile.overhang, `${label} crosses the rail outline`).toBeLessThanOrEqual(VERTEX_SLACK);
    }
  });
});

describe('the documented Z planes', () => {
  it('builds the camera plateau between the planes dims.ts documents', () => {
    // The bug this gate exists for: a back-facing slab takes its *largest* Z
    // and grows towards -Z, so passing `zOuter` put the whole bar — and every
    // lens in it — 2.095 mm behind where dims.ts said it was. The plateau is no
    // longer a slab, so this measures both halves of the roll instead: the
    // shell, which spans the bar's whole thickness, and the flat face cap,
    // which is the plane the optics sit on.
    const plateau = buildPlateau(materials);
    const shell = worldBox(required(plateau, 'plateau-shell'));
    expect(shell.min.z).toBeCloseTo(PLATEAU.zOuter, 3);
    expect(shell.max.z).toBeCloseTo(PLATEAU.zInner, 3);
    const cap = worldBox(required(plateau, 'plateau-plate'));
    expect(cap.min.z).toBeCloseTo(PLATEAU.zOuter, 3);
    expect(cap.max.z).toBeCloseTo(PLATEAU.zOuter, 3);
    expect(CAMERA_PLANE).toBe(PLATEAU.zOuter);
  });

  it('stands every lens ring its documented height off the plateau’s face', () => {
    const plateau = buildPlateau(materials);
    for (const lens of LENSES) {
      const ring = required(required(plateau, `lens-${lens.name}`), 'lens-ring');
      const box = worldBox(ring);
      expect(
        box.min.z,
        `${lens.name}: the ring is level with the plateau instead of proud of it`,
      ).toBeCloseTo(CAMERA_PLANE - LENS_RING_PROUD, 3);
    }
  });

  it('builds the back panel out from the frame’s own back face', () => {
    const box = worldBox(buildBackPanel(materials));
    expect(box.max.z).toBeCloseTo(PANEL_INNER_Z, 3);
    expect(box.min.z).toBeCloseTo(PANEL_FACE_Z, 3);
    expect(PANEL_INNER_Z).toBe(-BODY.halfDepth);
  });

  it('builds the cover glass proud of the frame’s front face', () => {
    const box = worldBox(required(buildFront(materials), 'cover-glass'));
    expect(box.min.z).toBeCloseTo(BODY.halfDepth, 3);
    expect(box.max.z).toBeCloseTo(GLASS_FRONT_Z, 3);
  });
});

/**
 * The bottom edge's bore layout.
 *
 * The defect is a count nobody could see in a render: six speaker bores right
 * of the port and four mic bores left, a pair of counts the reference photo
 * does not support — the real phone's netzwelt hands-on headline counts five on
 * the speaker side ("die fünf Löcher unten rechts"), and the pre-release CAD
 * leak has the mic side mirrored from it. Both lists are now five, on the same
 * 3 mm pitch from the same first bore, and mirrored about the port.
 */
describe('the bottom edge’s bores', () => {
  it('counts five speaker bores and five microphones, mirrored about the port', () => {
    expect(BOTTOM_BORES.speakers).toHaveLength(5);
    expect(BOTTOM_BORES.mics).toHaveLength(5);
    // Mirrored, entry for entry: the same pitch and the same first offset.
    BOTTOM_BORES.speakers.forEach((x, index) => {
      expect(
        BOTTOM_BORES.mics[index],
        `bore ${String(index)} is at ${String(x)} on the speaker side but ${String(BOTTOM_BORES.mics[index])} on the mic side`,
      ).toBeCloseTo(-x, 6);
    });
    // And the parts the numbers describe: one mouth per entry, on each side.
    const bottom = buildBottom(materials);
    expect(bottom.children.filter((child) => child.name === 'speaker')).toHaveLength(5);
    expect(bottom.children.filter((child) => child.name === 'mic-bottom')).toHaveLength(5);
  });
});

/**
 * The US 5G mmWave antenna window on the top edge.
 *
 * The defect: the model is the US variant — its non-goals say "no SIM tray (US
 * eSIM)" — and US units carry a mmWave antenna window on the top edge, which is
 * the surface the `top` preset frames. The part was simply absent: the top edge
 * carried `TOP_BORE` and nothing else. No test could see that, because nothing
 * measured which features belong on which surface; this gate pins the class of
 * the part — where it is, how big, and what it must clear — rather than the
 * instance.
 *
 * The fractions and the margins are *re-derived from the reference photo* here,
 * not read back off `MMWAVE`. A bound built from the same constant as the thing
 * it checks cannot fail, so the pixels are restated as literals with their
 * provenance, and `MMWAVE` has to agree with them: the window is 267 px of the
 * body's 663 in `.shots/ref/mmwave-1.jpg` (0.40 of `BODY.width`), and 42 px of
 * the 71 px top-edge face (0.59 of `BODY.depth`). Editing the constant to move
 * or resize the window takes this gate red rather than redefining the check.
 *
 * Bounds, named so the gate fails past them rather than at them: `CENTRE_TOL`
 * is 0.5 mm of the reference's 663 px / 71.9 mm scale — under 0.7 % of the body
 * width, which is the placement the photo shows; `FRACTION_TOL` is 8 % of the
 * fraction, twice the difference between the reference's own 0.402 and the
 * 0.40 documented, so a re-measure of the same photo stays green while a change
 * to the window's size does not; `FIT` is the 0.01 mm of vertex slack the other
 * edge gates use; `MARGIN_MIN` is 1 mm, an eighth of the frame's depth, because
 * the inlay has to sit *inside* the face rather than spanning it, and the
 * reference shows roughly 1.7 mm; and `BORE_CLEARANCE` is the top mic bore's
 * own radius (0.6) plus 1.8 mm — four times that radius — so the window clears
 * the bore by a real gap rather than merely not overlapping it.
 *
 * The rail bound is the inlay's own `MMWAVE.proud`, not zero, and that is a
 * measurement rather than a concession: the inlay's end arcs reach their
 * extreme Z on the body's centre line, and the frame's wall there *is* the
 * rail, so a face standing 0.02 mm off the wall stands 0.02 mm past the rail by
 * construction. Measured on the built part, the apex vertex at
 * (11.88, 75.02, 2.5) reads 0.019997. Writing the bound as zero would be the
 * gate asserting something the part cannot satisfy while claiming to test it.
 */
describe('the top edge’s mmWave antenna window', () => {
  const CENTRE_TOL = 0.5;
  const FRACTION_TOL = 0.08;
  const FIT = 0.01;
  const MARGIN_MIN = 1;
  const BORE_CLEARANCE = 2.4;
  /** How much the re-derived fraction may differ from the built one: 1 % of the
   *  window's own width, which is four times the pixel the reference's edge is
   *  read to. */
  const WIDTH_PROPORTION = 0.01;

  /** The reference photo's own measurements, in pixels. */
  const REF_PHONE_PX = 663;
  const REF_WINDOW_PX = 267;
  const REF_FACE_PX = 71;
  const REF_WINDOW_DEPTH_PX = 42;

  /**
   * The part, built inside each test rather than once for the file. A missing
   * window has to fail *these* tests by name; built at the describe's own scope
   * it throws during collection and the whole file reports "no tests", which
   * reads as a broken suite instead of as the defect.
   */
  function builtWindow(): { readonly top: THREE.Group; readonly window: THREE.Object3D; readonly box: THREE.Box3 } {
    const top = buildTop(materials);
    const window = required(top, 'mmwave-window');
    return { top, window, box: worldBox(window) };
  }

  it('puts the window on the top edge, centred on X within a stated tolerance', () => {
    const { top, window, box } = builtWindow();
    // On the edge: the same surface `mic-top` is on, not a child of the back or
    // the front. The bore and the window are the two features `top` frames.
    expect(required(top, 'mic-top'), 'the top edge lost its mic bore').toBeDefined();
    const centreX = box.getCenter(new THREE.Vector3()).x;
    // The reference's own placement, as the offset it measured: the top-edge
    // face's own centre line runs at x 591.5 in the photo and the window's ends
    // make its centre 590, so the window sits 1.5 px — 0.16 mm at the 663 px /
    // 71.9 mm scale — off the body's centre line. `CENTRE_TOL` is three times
    // that, and it is the bound rather than the exact pixel offset: the model's
    // window is centred, and 0.16 mm is inside both the photo's own resolution
    // and the tolerance.
    const referenceCentre = ((590 - 591.5) * BODY.width) / REF_PHONE_PX;
    expect(centreX, 'the window is not centred on the body').toBeCloseTo(0, 1);
    expect(
      Math.abs(centreX - referenceCentre),
      `the window's centre is ${centreX.toFixed(4)} mm off the body's centre line; the reference's is ${referenceCentre.toFixed(4)}`,
    ).toBeLessThanOrEqual(CENTRE_TOL);
    // Its own outer face is the rail plus its documented stand-off, so it seats
    // in the frame rather than floating over it or sinking into it. Exactly
    // coplanar is the pair that renders speckled.
    expect(box.max.y, 'the window is not seated on the rail').toBeCloseTo(RAIL.y + MMWAVE.proud, 3);
    expect(MMWAVE.proud).toBeGreaterThan(0);
    // And the part is what `dims.ts` documents it as, so the seated face and
    // the drawn outline cannot disagree about which part this is.
    expect(window.name).toBe('mmwave-window');
    expect(window.userData['material']).toBe('mmwave');
  });

  it('spans the fraction of the body width the reference photo shows', () => {
    const { box } = builtWindow();
    const reference = REF_WINDOW_PX / REF_PHONE_PX;
    const width = box.max.x - box.min.x;
    expect(
      width / BODY.width,
      `the window is ${(width / BODY.width).toFixed(4)} of the body width; the reference's ${String(REF_WINDOW_PX)} px of ${String(REF_PHONE_PX)} is ${reference.toFixed(4)}`,
    ).toBeCloseTo(reference, 2);
    // The documented fraction is the reference's own, within a tolerance that
    // is a share of the window's width rather than an absolute one.
    expect(Math.abs(MMWAVE.widthFraction - width / BODY.width)).toBeLessThanOrEqual(
      WIDTH_PROPORTION * (width / BODY.width),
    );
    expect(Math.abs(MMWAVE.widthFraction - reference)).toBeLessThanOrEqual(FRACTION_TOL * reference);
    // Edges symmetric about the centre line, which is what "centred" means for
    // a part whose ends are rounded.
    expect(box.min.x).toBeCloseTo(-box.max.x, 3);
    // Rounded ends: the corner radius is the shape's half-height, so the two
    // ends are true semicircles. Anything smaller reads as a rounded rectangle
    // with straight flats at the ends, which the reference does not show.
    expect(MMWAVE.radius).toBeCloseTo(MMWAVE.height / 2, 6);
  });

  it('lies within the frame’s depth, with a margin at both ends', () => {
    const { box } = builtWindow();
    // The frame's own face spans -halfDepth..+halfDepth in Z. The inlay must be
    // strictly inside that: a window reaching the chamfer would wrap the corner.
    const halfDepth = BODY.halfDepth;
    expect(
      halfDepth - box.max.z,
      `the window reaches ${(halfDepth - box.max.z).toFixed(4)} mm from the frame's front end`,
    ).toBeGreaterThanOrEqual(MARGIN_MIN);
    expect(
      box.min.z + halfDepth,
      `the window reaches ${(box.min.z + halfDepth).toFixed(4)} mm from the frame's back end`,
    ).toBeGreaterThanOrEqual(MARGIN_MIN);
    // And it carries the face's documented share of the depth, re-derived from
    // the same photo: 42 px of the 71 px edge face.
    const reference = REF_WINDOW_DEPTH_PX / REF_FACE_PX;
    expect(
      (box.max.z - box.min.z) / BODY.depth,
      `the window is ${((box.max.z - box.min.z) / BODY.depth).toFixed(4)} of the body depth; the reference's ${String(REF_WINDOW_DEPTH_PX)} px of ${String(REF_FACE_PX)} is ${reference.toFixed(4)}`,
    ).toBeCloseTo(reference, 1);
  });

  it('does not cross the rail and clears the top mic bore', () => {
    const { window, box } = builtWindow();
    // `MMWAVE.proud` is the bound for the reason in this block's header: the
    // inlay is a face standing off the wall, and the wall is the rail.
    const profile = railProfile(window);
    expect(
      profile.overhang,
      `the window stands ${profile.overhang.toFixed(4)} mm past the rail; its documented stand-off is ${String(MMWAVE.proud)}`,
    ).toBeLessThanOrEqual(MMWAVE.proud + FIT);
    // Where it stops short of the rail, it must still be on the body: the
    // inlay's own body runs back into the metal, so its innermost vertex is
    // inside the wall rather than floating in front of the recess.
    expect(
      profile.closest,
      `the window floats ${profile.closest.toFixed(4)} mm clear of the body`,
    ).toBeLessThan(0);
    // Clearance to the bore is measured between the two parts' real edges: the
    // nearest X of the window to the bore's centre, less the bore's radius.
    const clearance = Math.min(Math.abs(box.min.x - TOP_BORE.x), Math.abs(box.max.x - TOP_BORE.x)) - TOP_BORE.radius;
    expect(
      clearance,
      `the window clears the top mic bore by ${clearance.toFixed(4)} mm`,
    ).toBeGreaterThanOrEqual(BORE_CLEARANCE);
  });
});

/**
 * The MagSafe ring, which no gate saw at all.
 *
 * The register's round-6 edge entry names it: "It does not see `buildBack`'s
 * logo or MagSafe ring … MagSafe still has none." Round 7 measured the cost —
 * `magsafe.color` pure red, five views diffed, **0 pixels differed** — so this
 * gate asks the geometry that occlusion follows from, not the shading.
 *
 * Measured here: the ring's outermost vertex is at z = -4.95829 against the
 * panel's outer face at -4.97499, **0.0167 mm behind it**, and all 1419 of its
 * vertices project inside the panel's footprint, the closest 5.10 mm short of a
 * side wall (bottom 14.71, top 30.32). The depth margin is the tessellation's
 * as much as the placement's: 10 radial segments never sample the tube's
 * equator, so the widest circle the built mesh reaches is `tube * sin 72°` =
 * 0.7133 mm rather than the ideal 0.75: that 0.0367 mm is what turns the
 * placement's 0.02 mm of proudness into 0.0167 mm of burial. A finer tube, or a
 * panel face moved out, un-buries the ring and takes this gate red.
 *
 * Bounds. Burial, not shading: the tonal step is `materials.test.ts`'s and the
 * render's, and a grazing sightline clearing the panel's own edge travels 5.1 mm
 * inward before dropping 0.0167 mm to the ring — the pixel diff covers that.
 */
describe('the MagSafe ring', () => {
  /** How far the ring's outermost vertex must sit behind the panel's own outer
   *  face: a literal, measured 0.0167 mm here, so a ring that met the face or
   *  stood proud of it — the 0.12 mm state that drew a visible circle — fails. */
  const BURIAL_MIN = 0.01;
  /** How far the ring must stay clear of the parts around it: 4 mm, against a measured 5.10 mm to the panel's outline and 7.91 to the frame's front face. */
  const MARGIN_MIN = 4;

  function builtRing(): { readonly panel: THREE.Object3D; readonly ring: THREE.Object3D } {
    const back = buildBack(materials);
    return { panel: required(back, 'back-panel'), ring: required(back, 'magsafe') };
  }

  it('buries the ring behind the panel’s own outer face', () => {
    const { panel, ring } = builtRing();
    const face = worldBox(panel);
    const box = worldBox(ring);
    expect(
      box.min.z - face.min.z,
      `the ring’s outermost vertex is at z = ${box.min.z.toFixed(5)}, the panel’s outer face at ${face.min.z.toFixed(5)}: it stands ${(face.min.z - box.min.z).toFixed(4)} mm proud of the panel`,
    ).toBeGreaterThanOrEqual(BURIAL_MIN);
    // Its other end stays in the body: the tube runs back into the frame, not out the front.
    const frontGap = BODY.halfDepth - box.max.z;
    expect(frontGap, `the ring reaches z = ${box.max.z.toFixed(4)}, ${frontGap.toFixed(4)} mm short of the frame’s front face`).toBeGreaterThanOrEqual(MARGIN_MIN);
  });

  it('keeps every point of the ring over the panel’s face, with a margin', () => {
    const { panel, ring } = builtRing();
    const report = panelFootprint(panel, ring);
    const outside = report.outside.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`);
    expect(report.count, 'the ring had no vertices to measure').toBeGreaterThan(1000);
    expect(
      outside.slice(0, 4).join(' / '),
      `the ring reaches past the panel’s footprint at ${outside.slice(0, 4).join(' / ')}`,
    ).toBe('');
    const [side, gap] = Object.entries(report.margins).reduce((worst, wall) => (wall[1] < worst[1] ? wall : worst));
    expect(gap, `the ring stops ${gap.toFixed(4)} mm short of the panel’s ${side} wall`).toBeGreaterThanOrEqual(MARGIN_MIN);
  });
});

