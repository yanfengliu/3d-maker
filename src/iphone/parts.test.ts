import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  ANTENNA,
  BODY,
  BORE_PROUD,
  BOTTOM_BORES,
  BUTTONS,
  CAMERA_PLANE,
  FLASH,
  FLASH_CAVITY_RADIUS,
  GLASS_FRONT_Z,
  LENS_RING_PROUD,
  LENSES,
  LIDAR,
  LIDAR_CAVITY_RADIUS,
  PLATEAU,
  PLATEAU_CAVITY_RADIUS,
  PLATEAU_MIC,
  PLATEAU_MIC_CAVITY_RADIUS,
  RAIL,
  TOP_BORE,
} from './dims.js';
import type { PhoneMaterials } from './materials.js';
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
  SEAM_PROUD,
} from './parts.js';

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
 */

/** The rail outline's distance from a point: `RAIL.radius` on the flat of an
 *  edge, more around the corners. */
function railReach(x: number, y: number): number {
  const dx = Math.max(Math.abs(x) - RAIL.centreX, 0);
  const dy = Math.max(Math.abs(y) - RAIL.centreY, 0);
  return Math.hypot(dx, dy);
}

interface RailProfile {
  /** How far the furthest vertex reaches *past* the rail outline. */
  readonly overhang: number;
  /** How far the nearest vertex stops *short* of it. */
  readonly closest: number;
}

/** Measures every vertex of an assembly in body space, which is the space
 *  `RAIL` is written in. */
function railProfile(object: THREE.Object3D): RailProfile {
  object.updateWorldMatrix(true, true);
  const point = new THREE.Vector3();
  let overhang = -Infinity;
  let closest = Infinity;
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const attribute: unknown = (node.geometry as THREE.BufferGeometry).getAttribute('position');
    if (!(attribute instanceof THREE.BufferAttribute)) return;
    for (let index = 0; index < attribute.count; index += 1) {
      point.fromBufferAttribute(attribute, index).applyMatrix4(node.matrixWorld);
      const reach = railReach(point.x, point.y) - RAIL.radius;
      overhang = Math.max(overhang, reach);
      closest = Math.min(closest, reach);
    }
  });
  return { overhang, closest };
}

/**
 * How far an edge part may sit off the rail in either direction: out, where it
 * floats with nothing behind it, or in, where it is buried and invisible. The
 * antenna ribbon is a surface lying on the rail rather than a solid seated in
 * it, and its documented stand-off is 0.02 mm, so a few hundredths is the most
 * either direction can be out.
 */
const ATTACHED_SLACK = 0.05;

/**
 * How much a measured vertex may sit past a bound it meets exactly. Two things
 * contribute, and neither is the model: vertex positions are stored as 32-bit
 * floats, so a 36 mm coordinate lands up to ~4 µm from its decimal value, and
 * the extruded corner arc is a polygon whose offset facets can poke a
 * ten-thousandth of a millimetre past the ideal circle. Both are three orders
 * of magnitude below the 0.36 mm drift this gate exists to catch.
 */
const VERTEX_SLACK = 0.01;

/**
 * Stand-ins for the real materials: the parts only ever store the instance,
 * and the real set needs a canvas and a WebGL context a node test has not got.
 * An object literal rather than a Proxy, so a part asking for a key the
 * interface does not have is a compile error here instead of a silent fallback.
 */
function stubMaterials(): PhoneMaterials {
  const basic = new THREE.MeshBasicMaterial();
  const physical = basic as unknown as THREE.MeshPhysicalMaterial;
  return {
    aluminum: physical,
    backGlass: physical,
    tongue: physical,
    frontGlass: physical,
    screen: physical,
    island: physical,
    lensRing: physical,
    lensPupil: physical,
    lensGlass: physical,
    aperture: physical,
    flash: physical,
    darkGlass: physical,
    sapphire: physical,
    button: physical,
    seam: basic as unknown as THREE.MeshStandardMaterial,
    antenna: basic as unknown as THREE.MeshStandardMaterial,
    bore: basic as unknown as THREE.MeshStandardMaterial,
    logo: physical,
    magsafe: physical,
    glow: basic as unknown as THREE.SpriteMaterial,
  };
}

const materials = stubMaterials();

function required(parent: THREE.Object3D, name: string): THREE.Object3D {
  const found = parent.getObjectByName(name);
  if (found === undefined) throw new Error(`the built model has no part named "${name}"`);
  return found;
}

/**
 * A world-space box over a refreshed ancestor chain. `Box3.setFromObject`
 * updates the object's own subtree but not the groups above it, and a part's
 * placement lives on its group — so measuring a lens ring without this reads
 * its local coordinates and passes whatever the group's transform does.
 */
function worldBox(object: THREE.Object3D): THREE.Box3 {
  object.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(object);
}

/** How far a part's outward face stands from the body's centre line, on the
 *  edge `edge` names: +1 is the right (+X) edge, -1 the left. */
function outerFace(box: THREE.Box3, edge: number): number {
  return edge > 0 ? box.max.x : -box.min.x;
}

/** Asserts one edge part's two-sided contract: its outermost point lands on the
 *  rail plus the stand-off that part documents, within `ATTACHED_SLACK` either
 *  way. Too far out is a part floating off the phone (which is what the rail
 *  table being 0.36 mm wide produced); too far in is a part buried in the
 *  frame, which is just as wrong and just as invisible. */
function expectOnRail(part: THREE.Object3D, label: string, proud: number): void {
  const { overhang, closest } = railProfile(part);
  expect(
    overhang,
    `${label} stands ${overhang.toFixed(4)} mm past the rail; its documented stand-off is ${String(proud)} mm`,
  ).toBeLessThanOrEqual(proud + VERTEX_SLACK);
  expect(
    overhang,
    `${label} stops ${(-overhang).toFixed(4)} mm short of the rail, buried in the body (nearest vertex ${closest.toFixed(4)} mm short)`,
  ).toBeGreaterThanOrEqual(-ATTACHED_SLACK);
}

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

  it('seats every control pill in the rail and stands it its documented proud', () => {
    const controls = buildControls(materials);
    for (const button of BUTTONS) {
      const pill = required(controls, button.label);
      const seam = required(controls, `${button.label}-seam`);
      expectOnRail(pill, button.label, button.proud);
      expectOnRail(seam, `${button.label}-seam`, SEAM_PROUD);
      // `proud` means the pill's outer face is the rail plus that, exactly.
      expect(outerFace(worldBox(pill), button.edge)).toBeCloseTo(RAIL.x + button.proud, 3);
      // The seam sits behind the pill and is larger than it, so what shows is
      // the dark sliver around the pill's base. Two faces on one plane is what
      // made the pills render black and speckled.
      expect(
        outerFace(worldBox(seam), button.edge),
        `${button.label}: the seam is not behind the pill`,
      ).toBeCloseTo(RAIL.x + SEAM_PROUD, 3);
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
    const bottom = buildBottom(materials);
    for (const name of ['port-cavity', 'port-tongue']) {
      const profile = railProfile(required(bottom, name));
      expect(profile.overhang, `${name} crosses the silhouette`).toBeLessThanOrEqual(VERTEX_SLACK);
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
    // The bug this gate exists for: `slabGeometry` takes the slab's largest Z
    // and grows towards -Z, so a back-facing part must hand it its *inner*
    // plane. Passing `zOuter` put the whole bar — and every lens in it —
    // 2.095 mm behind where dims.ts said it was.
    const plateau = required(buildPlateau(materials), 'plateau-plate');
    const box = worldBox(plateau);
    expect(box.min.z).toBeCloseTo(PLATEAU.zOuter, 3);
    expect(box.max.z).toBeCloseTo(PLATEAU.zInner, 3);
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

describe('the plateau’s openings', () => {
  it('lines each cavity with a window at least as wide as the hole, recessed behind its bezel', () => {
    // A bore through the plateau with nothing wide enough behind it shows the
    // frame's bright aluminum back face down the cavity — the defect class the
    // lens barrels exist to prevent, and the one this test caught on its first
    // run: a 0.67 mm mic window inside a 0.75 mm hole. Each row is the hole's
    // radius, how far inside that hole the part lining it may sit (the barrel
    // is a hair inside on purpose, so the plateau's own bore wall is never the
    // surface you see), and the bezel that has to stand proud of it. A window
    // level with or in front of its bezel is a disc lying on the plateau, which
    // is how the flash came out blown flat instead of sitting in its cavity.
    const plateau = buildPlateau(materials);
    const windows: ReadonlyArray<readonly [string, number, number, string]> = [
      ['lens-barrel', PLATEAU_CAVITY_RADIUS, 0.05, 'lens-ring'],
      ['flash-led', FLASH_CAVITY_RADIUS, 0.02, 'flash-collar'],
      ['lidar-glass', LIDAR_CAVITY_RADIUS, 0.02, 'lidar-bezel'],
      ['mic-hole', PLATEAU_MIC_CAVITY_RADIUS, 0.02, 'mic-bezel'],
    ];
    for (const [name, cavity, slack, bezel] of windows) {
      const box = worldBox(required(plateau, name));
      const radius = Math.max(box.max.x - box.min.x, box.max.y - box.min.y) / 2;
      expect(
        radius,
        `${name} is narrower than the ${cavity.toFixed(2)} mm hole it lines`,
      ).toBeGreaterThanOrEqual(cavity - slack - VERTEX_SLACK);
      expect(
        box.min.z,
        `${name} is not recessed behind its ${bezel}: it stands proud of the plateau`,
      ).toBeGreaterThan(worldBox(required(plateau, bezel)).min.z);
    }
  });

  it('cuts a real opening in the plateau for every optic', () => {
    const plate = required(buildPlateau(materials), 'plateau-plate');
    if (!(plate instanceof THREE.Mesh)) throw new Error('the plateau plate is not a mesh');
    const shapes = (plate.geometry as THREE.ExtrudeGeometry).parameters.shapes;
    const shape = Array.isArray(shapes) ? shapes[0] : shapes;
    if (shape === undefined) throw new Error('the plateau plate has no shape');
    expect(shape.holes).toHaveLength(LENSES.length + 3);
    for (const opening of [
      ...LENSES.map((lens) => ({ x: lens.x, y: lens.y })),
      { x: FLASH.x, y: FLASH.y },
      { x: LIDAR.x, y: LIDAR.y },
      { x: PLATEAU_MIC.x, y: PLATEAU_MIC.y },
    ]) {
      const cut = shape.holes.some((hole) => {
        // The centre of the cut, not the average of its sampled points: a
        // closed arc's point list carries its start point three times over, and
        // a centroid pulled 1.26 mm off centre by that repeat misses the optic
        // it is meant to find.
        const points = hole.getPoints(8).map((point) => new THREE.Vector3(point.x, point.y, 0));
        const centre = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
        return Math.hypot(centre.x - opening.x, centre.y - opening.y) < 0.02;
      });
      expect(cut, `no bore is cut at (${String(opening.x)}, ${String(opening.y)})`).toBe(true);
    }
  });
});
