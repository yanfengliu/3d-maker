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
  buildBackPanel,
  buildBottom,
  buildControls,
  buildFront,
  buildHousing,
  buildPlateau,
  buildTop,
  PANEL_FACE_Z,
  PANEL_INNER_Z,
} from './parts.js';
import {
  ATTACHED_SLACK,
  expectOnRail,
  materials,
  outerFace,
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
      expect(
        outerFace(worldBox(seam), button.edge),
        `${button.label}: the seam is not behind the pill`,
      ).toBeCloseTo(RAIL.x + button.seamProud, 3);
      expect(
        button.seamProud,
        `${button.label}: the seam's plane is level with the pill's own — a coplanar pair`,
      ).not.toBeCloseTo(button.proud, 5);
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
    // same order of magnitude plus the measured vertex slack. The floor's edges
    // sit `drop + thickness` below the rail and the tongue's root inside the
    // floor, so both land under this bound by construction; a lip an order of
    // magnitude larger — the mutation this catches — does not.
    const LINER_OVERHANG_BOUND = 0.03;
    const bottom = buildBottom(materials);
    for (const name of ['port-cavity', 'port-tongue', 'port-shell', 'port-cavity-ceiling']) {
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
