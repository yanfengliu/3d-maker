import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  BODY,
  FLASH,
  FLASH_CAVITY_RADIUS,
  LENS_RADIUS,
  LENSES,
  LIDAR,
  LIDAR_CAVITY_RADIUS,
  PLATEAU,
  PLATEAU_CAVITY_RADIUS,
  PLATEAU_MIC,
  PLATEAU_MIC_CAVITY_RADIUS,
  RAIL,
} from './dims.js';
import { buildBackPanel, buildHousing, buildPlateau, buildTop } from './parts.js';
import { plateauPerimeter } from './plateau.js';
import { rollProfile, slicePoints, tallestWallSegment } from './roll.js';
import { eachVertex, insideDepth, materials, required, VERTEX_SLACK, vertexReader, worldBox } from './test-helpers.js';

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
    // The plateau's face is a `ShapeGeometry` cap rather than an extruded
    // shape, so the bores are read off its own outline: the cap's boundary is
    // the roll's inner edge, and every optic's circle is a hole inside it, at
    // the documented position and radius. Re-expressed from the old assertion
    // on `ExtrudeGeometry.parameters.shapes` when the slab became a roll; the
    // contract it pins — every optic cut where dims.ts puts it, at its cavity
    // radius — is unchanged.
    const cap = required(buildPlateau(materials), 'plateau-plate');
    if (!(cap instanceof THREE.Mesh)) throw new Error('the plateau face cap is not a mesh');
    const shape = (cap.geometry as THREE.ShapeGeometry).parameters.shapes;
    const outline = Array.isArray(shape) ? shape[0] : shape;
    if (outline === undefined) throw new Error('the plateau face cap has no outline');
    expect(outline.holes).toHaveLength(LENSES.length + 3);

    for (const opening of [
      ...LENSES.map((lens) => ({ x: lens.x, y: lens.y, radius: PLATEAU_CAVITY_RADIUS })),
      { x: FLASH.x, y: FLASH.y, radius: FLASH_CAVITY_RADIUS },
      { x: LIDAR.x, y: LIDAR.y, radius: LIDAR_CAVITY_RADIUS },
      { x: PLATEAU_MIC.x, y: PLATEAU_MIC.y, radius: PLATEAU_MIC_CAVITY_RADIUS },
    ]) {
      const cut = outline.holes.find((hole) => {
        // The centre of the cut, not the average of its sampled points: a
        // closed arc's point list carries its start point three times over, and
        // a centroid pulled 1.26 mm off centre by that repeat misses the optic
        // it is meant to find.
        const points = hole.getPoints(8).map((point) => new THREE.Vector3(point.x, point.y, 0));
        const centre = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
        return Math.hypot(centre.x - opening.x, centre.y - opening.y) < 0.02;
      });
      expect(cut, `no bore is cut at (${String(opening.x)}, ${String(opening.y)})`).toBeDefined();
      if (cut === undefined) continue;
      const points = cut.getPoints(64).map((point) => Math.hypot(point.x - opening.x, point.y - opening.y));
      const radius = points.reduce((total, value) => total + value, 0) / points.length;
      expect(
        radius,
        `the bore at (${String(opening.x)}, ${String(opening.y)}) is cut at the wrong radius`,
      ).toBeCloseTo(opening.radius, 2);
    }
  });
});

/**
 * The forged roll: the four gates that separate the plateau's real edge from
 * the machined step it replaced. Each measures the built geometry — the
 * shoulder against the band's own profile, the top against the surface the
 * plateau actually reaches — rather than restating the constants it is built
 * from, because a gate made of the same symbols as its subject only proves the
 * code agrees with itself.
 */
describe('the plateau’s forged roll', () => {
  /**
   * What counts as a flat wall, not a roll: two levels of the profile that sit
   * within `WALL_SLIDE` of each other in the plane while their height differs by
   * more than `MAX_WALL_STEP`. A slab's wall is exactly that — its surface rises
   * the bar's whole thickness without moving at all — while this bar's own roll
   * never stacks a large rise on one place in the plane. Measured over the four
   * probes in the first gate: the thickest rise between any two levels within
   * `WALL_SLIDE` (0.077 mm) of each other is 0.190 mm on the top edge and
   * 0.105 mm on the walls and the bottom edge, all under a third of the bound;
   * and every pair that carries more than `MAX_WALL_STEP` of rise — the
   * smallest is 0.604 mm, between levels 7 and 10 — stands at least 0.198 mm
   * apart in the plane.
   *
   * Every pair is compared, not each level with its neighbour. A wall's own
   * consecutive levels sit in the same place *and* at the same height — the
   * pair that carries the wall is the two that straddle it.
   */
  const MAX_WALL_STEP = 0.5;
  const WALL_SLIDE = 0.077;

  it('rolls the shoulder continuously, with no vertical wall band', () => {
    // (a) The roll band's own profile, sampled at the top edge, both sides and
    // the bottom edge of the bar.
    //
    // A slab geometry cannot pass this, however its chamfer is sized. Its wall
    // is vertical, so its profile carries several levels stacked on one place
    // in the plane while their height walks the bar's thickness — the pairs to
    // compare are therefore *all* of them, not each level with the one before
    // it: a wall's own levels are the pairs that differ in height, and a pair
    // that differs in neither is not the tell.
    //
    // `ROLL_LEVELS` is deliberately *not* uniform: `[0, 0.05, 0.12, … 0.97, 1]`
    // bunches the levels where the profile turns hardest, at the face and again
    // at the base, so the smallest consecutive gaps are 0.042 mm on the bottom
    // edge's 1.4 mm run, 0.036 mm on the walls' 1.2 and 0.027 mm on the top
    // edge's 0.9 — all far *below* `WALL_SLIDE` (0.077). The bound therefore
    // cannot rest on the levels being far apart, and a uniform 11-step sampling
    // (`run / 11`, 0.082 mm on the top edge) would not rescue it either. What
    // makes it safe is that a wall needs both halves at once: a small gap in the
    // plane *and* a large rise. The bunched pairs differ by at most 0.190 mm —
    // the top edge's levels 8→9, at 0.063 mm apart — while only the pairs that
    // straddle the steep middle of the profile carry a large rise, and those
    // stand at least 0.198 mm apart in the plane. So the tallest wall the bound
    // finds is that 0.190 mm, and a genuine wall — a slab's 2.095 mm of rise on
    // one place in the plane — is ten times past it.
    const plateau = buildPlateau(materials);
    const shell = required(plateau, 'plateau-shell');
    if (!(shell instanceof THREE.Mesh)) throw new Error('the plateau shell is not a mesh');
    const { points, directions } = plateauPerimeter();
    const count = points.length;

    // The four sites are found by the direction the outline faces there, not by
    // a fraction of the loop: the footprint's spans are not equal, and a probe
    // index that lands on a corner would measure the corner instead.
    const at = (x: number, y: number): number => {
      let best = 0;
      let bestDot = -Infinity;
      for (let index = 0; index < count; index += 1) {
        const direction = directions[index];
        if (direction === undefined) continue;
        const dot = direction.x * x + direction.y * y;
        if (dot > bestDot) {
          bestDot = dot;
          best = index;
        }
      }
      return best;
    };
    const probes: ReadonlyArray<readonly [string, number]> = [
      ['bottom edge', at(0, 1)],
      ['right wall', at(-1, 0)],
      ['top edge', at(0, -1)],
      ['left wall', at(1, 0)],
    ];
    for (const [label, index] of probes) {
      const { count: vertices, at } = vertexReader(shell);
      const profile = rollProfile(at, count, vertices / count, index);
      expect(profile.length, `${label}: the band has no profile`).toBeGreaterThan(6);
      const first = profile[0];
      const last = profile[profile.length - 1];
      if (first === undefined || last === undefined) throw new Error(`${label}: empty profile`);
      // The band really does rise at this point: a construction that ran the
      // surface out to the base without climbing would satisfy the wall bound
      // trivially. The rise is the bar's full `zInner - zOuter` of 2.095 mm at
      // every one of the four probes — the walls, the bottom edge and the top
      // edge alike, because one monotone Hermite profile is sampled all the way
      // round and none of it is held short of the base. Measured: 2.0950 at all
      // four. 2.0 is under all of them.
      expect(last.z - first.z, `${label}: the band does not rise at all`).toBeGreaterThan(2);
      const wall = tallestWallSegment(profile, WALL_SLIDE);
      expect(
        wall,
        `${label}: the profile carries a ${wall.toFixed(3)} mm vertical wall — that is a step, not a roll`,
      ).toBeLessThanOrEqual(MAX_WALL_STEP);

      // And the profile only ever climbs, and never past the base's own depth.
      // A profile that overshoots — a parabola arriving at the base with twice
      // the slope, which is what an earlier pass used to make the top wrap —
      // turns back over the crest and leaves the surface standing proud of the
      // plane its own base sits on.
      for (let level = 1; level < profile.length; level += 1) {
        const previous = profile[level - 1];
        const current = profile[level];
        if (previous === undefined || current === undefined) continue;
        expect(
          current.z,
          `${label}: the profile falls back from ${previous.z.toFixed(3)} to ${current.z.toFixed(3)} — it overshoots its own crest`,
        ).toBeGreaterThanOrEqual(previous.z - 1e-6);
        expect(
          current.z,
          `${label}: the profile overshoots to ${current.z.toFixed(3)}, past the base's own depth`,
        ).toBeLessThanOrEqual(PLATEAU.zInner + 1e-6);
      }
    }
  });

  it('wraps the raised surface over the phone’s top edge', () => {
    // (b) Measured on the plateau's own shell, because the lens rings are
    // legitimately proud of everything and would dominate any band that
    // included them.
    //
    // One millimetre of the bar's top — everything from the face's own corner
    // up to the phone's edge — is the whole turn. Across it the surface has to
    // span the bar's own thickness, so no band of the frame's back face is
    // reachable behind the bump; and its *visible* part — the material standing
    // outside the frame's back face — has to reach the phone's top edge, or the
    // roll stops short and leaves a band of the frame's back face running the
    // width of the bump at the top. Measured: the base outline's own top edge is
    // y = 74.830, 0.170 mm short of `RAIL.y`, and the highest vertex standing
    // outside the frame's back face is 74.767, 0.233 mm short. What is exposed
    // above the crest is that strip of the frame's back face, not a band of its
    // top face.
    const plateau = buildPlateau(materials);
    const shell = required(plateau, 'plateau-shell');
    if (!(shell instanceof THREE.Mesh)) throw new Error('the plateau shell is not a mesh');
    const band = 1;
    let visibleTop = -Infinity;
    for (const x of [-18, -9, 0, 9, 18]) {
      const zs: number[] = [];
      eachVertex(shell, (px, py, pz) => {
        if (Math.abs(px - x) > band / 2) return;
        if (py < RAIL.y - band || py > RAIL.y + VERTEX_SLACK) return;
        zs.push(pz);
      });
      expect(zs.length, `x = ${String(x)}: the plateau does not reach the phone's top edge`).toBeGreaterThan(0);
      expect(
        Math.min(...zs),
        `x = ${String(x)}: the surface at the top edge backs off to ${Math.min(...zs).toFixed(3)} — a band of the frame's back face is reachable behind it`,
      ).toBeLessThanOrEqual(-5);
      // The bump's proud material, not its buried base: only the part standing
      // outside the frame's back face (z < -4.375) is ever seen, and the base
      // ring sits at z = -4.28 behind that face. Re-expressed in round 6: this
      // filter used to read `pz > BODY.halfDepth`, a sign that excludes nothing
      // at all on a back-facing part, so the "visible" crest it measured was the
      // buried base ring at 74.830 (0.170 mm short) rather than the visible one
      // at 74.767 (0.233 mm). Both are inside the 0.25 mm bound, so the gate was
      // green either way — it was just measuring the wrong surface.
      eachVertex(shell, (px, py, pz) => {
        if (Math.abs(px - x) > band / 2) return;
        if (pz > -BODY.halfDepth) return;
        visibleTop = Math.max(visibleTop, py);
      });
    }
    expect(
      RAIL.y - visibleTop,
      `the bump's visible surface stops ${(RAIL.y - visibleTop).toFixed(3)} mm short of the phone's top edge, leaving that band of the frame's back face showing`,
    ).toBeLessThanOrEqual(0.25);
    // The top-edge mic bore stays on the edge it is cut into: the frame's own
    // top face is exposed where the bore sits.
    const rim = slicePoints(buildTop(materials), 'y', RAIL.y, 0.01);
    expect(rim.length, 'the top bore is not on the phone’s top edge').toBeGreaterThan(0);
  });

  it('seats the plateau inside the frame’s real surface, not on it', () => {
    // (e) The coplanarity class, which is what the black gashes and the striped
    // bands around the whole bump came of. A base that lies *on* a frame
    // surface is a coplanar pair, and coplanar surfaces fight for the same
    // depth samples — the register's black and speckled pills came of exactly
    // that.
    //
    // Measured against the frame that was actually built, by ray casting: a
    // bound derived from `RAIL` alone would miss the frame's own 0.36 mm bevel,
    // which pulls its outline in near the back face and is precisely what left
    // the base hanging in the air the first time round. At the base ring's own
    // depth (z = -4.28) the frame's wall is measured at x = 35.825 and
    // y = 74.875, 0.125 mm inside `RAIL`, so the base ring at `BASE_INSET`
    // (0.17) stands 0.045 mm inside the metal on the flats and 0.041 mm inside
    // it at the closest sampled ring point — the gate's own bound is 0.02.
    const frame = buildHousing(materials);
    frame.updateWorldMatrix(true, true);
    const shell = required(buildPlateau(materials), 'plateau-shell');
    if (!(shell instanceof THREE.Mesh)) throw new Error('the plateau shell is not a mesh');

    const points: Array<readonly [number, number, number]> = [];
    eachVertex(shell, (x, y, z) => points.push([x, y, z]));
    const deepest = Math.max(...points.map(([, , z]) => z));

    // 1. The base's z is inside the frame's back face, not on it.
    expect(
      BODY.halfDepth - Math.abs(deepest),
      `the base sits ${(BODY.halfDepth - Math.abs(deepest)).toFixed(4)} mm from the frame's back face plane — a base level with it is a coplanar pair`,
    ).toBeGreaterThanOrEqual(0.02);

    // 2. Every point of the base's ring is inside the frame's volume, with a
    //    margin along the way out. `insideDepth` casts from outside, through
    //    the point: a ray that *starts* inside a closed solid only meets the
    //    back of the wall on its way out, and three's raycaster reports front
    //    faces.
    const { points: perimeter } = plateauPerimeter();
    let thinnest = Infinity;
    let sampled = 0;
    for (let index = 0; index < perimeter.length; index += 17) {
      const point = perimeter[index];
      if (point === undefined) continue;
      const at = new THREE.Vector3(point.x, point.y, deepest);
      const radial = new THREE.Vector3(point.x, point.y, 0).normalize();
      const depths = [
        insideDepth(frame, at, radial),
        insideDepth(frame, at, new THREE.Vector3(0, 0, 1)),
      ];
      sampled += 1;
      thinnest = Math.min(thinnest, ...depths);
    }
    expect(sampled, 'no base ring points were sampled').toBeGreaterThan(50);
    expect(
      thinnest,
      `the base ring comes within ${thinnest.toFixed(4)} mm of the frame's surface — a ring on the surface is a coplanar pair, and one outside it hangs in the air`,
    ).toBeGreaterThanOrEqual(0.02);

    // 3. And the plateau's top stops short of the frame's top face, so nothing
    //    of the wrap can lie in that plane either.
    const highest = Math.max(...points.map(([, y]) => y));
    expect(
      RAIL.y - highest,
      `the plateau reaches ${highest.toFixed(4)}, ${(RAIL.y - highest).toFixed(4)} mm below the frame's top face — a crest in that plane grazes it`,
    ).toBeGreaterThanOrEqual(0.02);
  });

  it('keeps the plateau the width of the bar, not the whole back', () => {
    // The plateau is a bar across the top of the back. Sweeping its roll around
    // the rail's whole outline instead makes it a plate the size of the entire
    // back — 2.0 mm proud of the frame's back face, it buries the panel and the
    // Apple logo, and its face cap, wound for the wrong side, leaves the whole
    // back showing whatever lies behind it. Measured as the bar's own extent,
    // with the panel well below it.
    const shell = required(buildPlateau(materials), 'plateau-shell');
    if (!(shell instanceof THREE.Mesh)) throw new Error('the plateau shell is not a mesh');
    let lowest = Infinity;
    let highest = -Infinity;
    eachVertex(shell, (_x, y) => {
      lowest = Math.min(lowest, y);
      highest = Math.max(highest, y);
    });
    const barBottom = PLATEAU.centreY - PLATEAU.height / 2;
    expect(lowest, `the plateau reaches down to y = ${lowest.toFixed(2)}, past the bar's own bottom edge`).toBeGreaterThanOrEqual(
      barBottom,
    );
    expect(
      lowest,
      `the plateau's lowest point is ${lowest.toFixed(2)} — it does not reach the bar's bottom edge`,
    ).toBeLessThan(barBottom + 0.5);
    // The panel's top edge is below the plateau's bottom edge, with a gap.
    const panelTop = Math.max(...slicePoints(buildBackPanel(materials), 'x', 0, 0.02).map((point) => point.y));
    expect(
      lowest - panelTop,
      `the panel's top edge (${panelTop.toFixed(2)}) overlaps the plateau's bottom edge (${lowest.toFixed(2)})`,
    ).toBeGreaterThan(0.5);
    expect(highest).toBeLessThanOrEqual(RAIL.y);
  });

  it('wraps the back panel’s top corners up around the plateau', () => {
    // (c) The panel's top edge is not a straight line: it clears the plateau's
    // rolled bottom at the centre and rises at the sides, so its corners tuck
    // close around the roll. A rounded rectangle's top edge is flat, which is
    // the defect this measures.
    const panel = buildBackPanel(materials);
    const topAt = (x: number): number => {
      const column = slicePoints(panel, 'x', x, 0.02);
      return Math.max(...column.map((point) => point.y));
    };
    const centre = topAt(0);
    for (const x of [28, -28]) {
      expect(
        topAt(x) - centre,
        `the panel's top edge at x = ${String(x)} is only ${(topAt(x) - centre).toFixed(3)} mm above its centre — the corners do not rise`,
      ).toBeGreaterThanOrEqual(2);
    }
    // And the corners stay clear of the roll they wrap around: the closest the
    // panel's top edge comes to the plateau's own bottom edge is still a gap.
    const plateauBottom = PLATEAU.centreY - PLATEAU.height / 2;
    for (const x of [0, 14, 28, 31]) {
      const gap = plateauBottom - topAt(x);
      expect(gap, `the panel's top edge at x = ${String(x)} crosses the plateau`).toBeGreaterThan(0.8);
    }
  });

  it('gives every lens ring a flat crown with a chamfer at its rim', () => {
    // (d) The ring's crown is a flat land over at least `MIN_CROWN_LAND` of the
    // band and then a short chamfer down to the rim. One slope from bore to rim
    // — what the profile held before — has no land at all.
    //
    // The bound is a literal, not `geometry.ts`'s own `RING_FLAT_SHARE`: a gate
    // built from the same symbol as the thing it checks only proves the code
    // agrees with itself, and would follow the profile down to no land at all.
    const MIN_CROWN_LAND = 0.6;
    for (const lens of LENSES) {
      const ring = required(required(buildPlateau(materials), `lens-${lens.name}`), 'lens-ring');
      if (!(ring instanceof THREE.Mesh)) throw new Error('the lens ring is not a mesh');
      ring.updateWorldMatrix(true, true);
      const points: Array<readonly [number, number, number]> = [];
      eachVertex(ring, (x, y, z) => points.push([x, y, z]));
      const crown = Math.max(...points.map(([, , z]) => z));
      const radii = points
        .filter(([, , z]) => Math.abs(z - crown) <= 1e-4)
        .map(([x, y]) => Math.hypot(x, y));
      const inner = Math.min(...radii);
      const outer = Math.max(...radii);
      const band = LENS_RADIUS - 5.3;
      expect(
        outer - inner,
        `${lens.name}: the crown's flat land is ${(outer - inner).toFixed(3)} mm of a ${band.toFixed(2)} mm band`,
      ).toBeGreaterThanOrEqual(MIN_CROWN_LAND * band - 0.01);
      expect(outer, `${lens.name}: the crown does not reach the rim`).toBeLessThan(LENS_RADIUS);
      expect(inner, `${lens.name}: the crown starts below the bore`).toBeCloseTo(5.3, 2);
    }
  });
});
