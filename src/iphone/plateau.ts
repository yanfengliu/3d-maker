import * as THREE from 'three';

import {
  BACK_PANEL,
  BODY,
  FLASH,
  FLASH_CAVITY_RADIUS,
  GLASS_BEVEL,
  LENSES,
  LIDAR,
  LIDAR_CAVITY_RADIUS,
  PLATEAU,
  PLATEAU_CAVITY_RADIUS,
  PLATEAU_MIC,
  PLATEAU_MIC_CAVITY_RADIUS,
  RAIL,
} from './dims.js';
import { addMesh } from './geometry.js';
import { buildFlash, buildLenses, buildLidar, buildPlateauMic } from './lens.js';
import type { PhoneMaterials } from './materials.js';

/**
 * The camera plateau and the back panel — the two surfaces the forged roll
 * belongs to. They live together because the panel's top edge is shaped by the
 * plateau's rolled bottom: move one and the other's outline has to follow.
 *
 * The real bump has no flat vertical wall band anywhere around its perimeter.
 * It rises 2.0 mm from the frame's back face (z = -4.375) to the plateau's face
 * (z = -6.375) over a short horizontal run. The roll here is one monotone
 * Hermite profile sampled at every perimeter point, so it is the same curve all
 * the way round — tangent-continuous into the face above, entering the frame's
 * own back face at the angle its tail sets rather than lying flat on it. Its
 * runs are 1.4 mm along the bar's bottom edge, 1.2 mm down the sides and 0.9 mm
 * across the top (`ROLL_RUN`, `ROLL_RUN_SIDE`, `ROLL_RUN_TOP`; the profile is
 * sampled over those, and 1.5 exists nowhere).
 *
 * The top edge does not quite reach the silhouette. Measured on the built shell:
 * the footprint's own top edge is `RAIL.y - BASE_INSET`, y = 74.83 against
 * `RAIL.y` = 75, so its outermost vertex stops 0.17 mm short of the rail; the
 * highest vertex standing outside the frame's back face is at y = 74.767,
 * 0.23 mm short, the bump's visible crest. Above it a strip of the body's back
 * face runs the width of the bump, where the real part's roll reaches the edge.
 * That shortfall is not a wall — the profile is the same monotone Hermite
 * everywhere — it is the bar's own top edge stopping `BASE_INSET` inside the
 * rail, which is what keeps its base out of a coplanar pair with the frame.
 *
 * A `slabGeometry` slab cannot do any of that: its wall is vertical by
 * construction, its bevel is symmetric about the face, and its outline is one
 * rounded rectangle. So the plateau is a *roll band* swept along the outline of
 * the bump's own footprint — a bar across the top of the back, from `PLATEAU`'s
 * bottom edge to the phone's top edge (the intent; the visible roll stops
 * 0.23 mm short, as above), as wide as the rail. Each perimeter point moves
 * inward along that outline's analytic normal by its run and rises towards the
 * face along the roll profile. The flat face inside the inner edge is one
 * `ShapeGeometry` carrying a circular hole per optic.
 *
 * Two rules keep the bar from fighting with the frame, and both are asserted in
 * `plateau.test.ts`:
 *
 *   - the base outline is held `BASE_INSET` inside the rail, so no part of the
 *     rolled edge lies *on* a surface of the frame: a base that touches the
 *     frame's own wall exactly is a coplanar pair, and coplanar surfaces
 *     z-fight (the register's "black and speckled" pills). The base's z stays
 *     `zInner`, 0.095 mm inside the frame's back face, so the bar is fused to the
 *     body and the roll's visible face ends where it crosses that surface, at an
 *     angle.
 *   - the bar's own footprint is the bar's, not the rail's. Sweeping the same
 *     roll around the rail's whole outline makes the plateau a plate the size of
 *     the entire back — 2.0 mm proud, it buries the panel and the logo.
 */

/** Sagitta from a chord to its arc: the error the polylines are allowed. */
const CHORD_TOLERANCE = 0.004;
/** Point spacing along the outline's straight runs. */
const EDGE_SPACING = 0.12;

/**
 * How far the base outline is held inside the rail.
 *
 * This is the overlap that keeps the z-fight away, and it is sized by the
 * *frame's* own bevel rather than by anything about the bump. `slabGeometry`
 * rounds the frame's edges over `BODY.bevel` (0.36 mm), so the frame's wall is
 * inset at the base's own z: measured on the built housing at z = -4.28, the
 * depth the base ring sits at (0.095 mm inside the frame's back face), it is
 * 0.125 mm inside the rail — x = 35.825 against `RAIL.x` = 35.95 and y = 74.875
 * against 75, with a ray cast through the section and a sliced cross-section
 * agreeing. A base ring at `BASE_INSET` = 0.17 therefore sits 0.045 mm
 *  *inside* the metal on the flats, 0.041 mm inside it at the closest sampled
 * ring point — buried rather than laid on the surface or hung in the air. The
 * earlier constant, 0.116, left the ring outside that surface by 0.009 mm and
 * the roll's last strip ended in mid-air, seen edge-on as a bright or dark line
 * down the bump's whole perimeter. 0.17 clears the frame's wall by at least
 * twice the 0.02 mm bound the coplanarity gate uses, so no part of the ring can
 * fight it for depth samples — and the roll's visible face ends where it crosses
 * that surface, at an angle.
 */
export const BASE_INSET = 0.17;

/** How far the face's outline sits inside the base on the bar's bottom edge,
 *  where the surface climbs out of the frame's back face. */
export const ROLL_RUN = 1.4;
/** The same run on the sides. */
export const ROLL_RUN_SIDE = 1.2;
/** And on the top edge, tighter than either: that edge is where the silhouette
 *  is, `BASE_INSET` short of it, so the run there is the whole horizontal width
 *  the roll has left before the frame. It is also what keeps the main lens
 *  inside the face: measured, the face's outline clears the lens's centre at
 *  (22, 67) by 6.93 mm, 0.18 mm outside the 13.5 mm lens's own 6.75 mm radius,
 *  where a 1.2 run would put the outline at 6.63 mm and cut 0.12 mm into it. */
export const ROLL_RUN_TOP = 0.9;
/** The roll profile's end slope, as a share of `rise / run`. A cubic Hermite
 *  from slope 0 at the face to `ROLL_TAIL * rise / run` at the base is monotone
 *  for every tail between 0 and 3: the base is buried in the frame, so the
 *  surface reaches the metal still climbing rather than lying flat on it. */
const ROLL_TAIL = 1.2;
/** How many quads the band is deep, and where they are: bunched where the
 *  profile turns hardest, at the face and again at the base. */
export const ROLL_LEVELS = [0, 0.05, 0.12, 0.22, 0.34, 0.48, 0.62, 0.75, 0.86, 0.93, 0.97, 1];

/** The back panel's planes: it butts the frame's back face and stands
 *  `BACK_PANEL.thickness` outside it, which is what the plane table in
 *  `dims.ts` calls z = -4.375 … -4.975. */
export const PANEL_INNER_Z = -BODY.halfDepth;
export const PANEL_FACE_Z = PANEL_INNER_Z - BACK_PANEL.thickness;

/** The plate's outer face: where the lens rings and the sensor windows sit. */
export const PLATEAU_FACE_Z = PLATEAU.zOuter;

/** Smoothstep: zero slope at both ends, which is what keeps every blend below
 *  from creasing. */
function smoothstep(value: number): number {
  const t = Math.min(Math.max(value, 0), 1);
  return t * t * (3 - 2 * t);
}

/** The bar's bottom edge, inset: the lowest y of the plateau's footprint. */
export function plateauBottomY(): number {
  return PLATEAU.centreY - PLATEAU.height / 2 + BASE_INSET;
}

/**
 * The plateau's own footprint as a closed, counter-clockwise polyline with
 * near-uniform point spacing, plus each point's inward unit direction.
 *
 * It is a rounded rectangle from the bar's bottom edge to the phone's top edge:
 * the bottom edge is a straight run with the rail's own corner radius, the sides
 * are the frame's side walls and the top is the phone's top edge with the rail's
 * corner arcs, all held `BASE_INSET` inside. Every span ends where the next
 * begins, so the inward directions are continuous around the whole loop and the
 * swept band has no seam. It is *not* the rail's outline: sweeping that would
 * make the "plateau" the size of the entire back, burying the panel and the logo
 * under a plate 2.0 mm proud of the frame's back face.
 */
export function plateauPerimeter(): { readonly points: THREE.Vector2[]; readonly directions: THREE.Vector2[] } {
  const points: THREE.Vector2[] = [];
  const directions: THREE.Vector2[] = [];
  const arcSteps = Math.max(2, Math.ceil(Math.PI / 2 / (2 * Math.acos(1 - CHORD_TOLERANCE / RAIL.radius))));

  /** One straight run, the interior on the side `inward` names. */
  const edge = (from: THREE.Vector2, to: THREE.Vector2, inward: THREE.Vector2): void => {
    const steps = Math.max(1, Math.ceil(from.distanceTo(to) / EDGE_SPACING));
    for (let index = 0; index < steps; index += 1) {
      const t = index / steps;
      points.push(new THREE.Vector2(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t));
      directions.push(inward.clone());
    }
  };

  /** One quarter arc of the footprint, `start` to `end` radians about (cx, cy),
   *  the interior inside it so the inward direction is the reversed radius. */
  const arc = (cx: number, cy: number, radius: number, start: number, end: number): void => {
    for (let index = 0; index < arcSteps; index += 1) {
      const angle = start + ((end - start) * index) / arcSteps;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      points.push(new THREE.Vector2(cx + radius * cosine, cy + radius * sine));
      directions.push(new THREE.Vector2(-cosine, -sine));
    }
  };

  const right = RAIL.x - BASE_INSET;
  const left = -right;
  const top = RAIL.y - BASE_INSET;
  const bottom = plateauBottomY();
  // The corners keep the rail's own centres and lose `BASE_INSET` off their
  // radius, so the footprint is the rail's outline held a hair inside it.
  const radius = RAIL.radius - BASE_INSET;
  const sideBottom = bottom + radius;
  const sideTop = RAIL.centreY;
  const cornerX = RAIL.centreX;

  // Counter-clockwise from the bottom edge's left end: bottom edge, bottom-right
  // corner, right wall, top-right corner, top edge, top-left corner, left wall,
  // bottom-left corner. Every straight run ends where its corner arc begins.
  edge(new THREE.Vector2(-cornerX, bottom), new THREE.Vector2(cornerX, bottom), new THREE.Vector2(0, 1));
  arc(cornerX, sideBottom, radius, -Math.PI / 2, 0);
  edge(new THREE.Vector2(right, sideBottom), new THREE.Vector2(right, sideTop), new THREE.Vector2(-1, 0));
  arc(cornerX, sideTop, radius, 0, Math.PI / 2);
  edge(new THREE.Vector2(cornerX, top), new THREE.Vector2(-cornerX, top), new THREE.Vector2(0, -1));
  arc(-cornerX, sideTop, radius, Math.PI / 2, Math.PI);
  edge(new THREE.Vector2(left, sideTop), new THREE.Vector2(left, sideBottom), new THREE.Vector2(1, 0));
  arc(-cornerX, sideBottom, radius, Math.PI, (3 * Math.PI) / 2);

  return { points, directions };
}

/** How much of the top edge's tighter run a perimeter point uses: 1 where the
 *  outline faces the phone's top, 0 on the walls and the bottom edge. Both ends
 *  are flat, which keeps the run continuous around the loop. */
function topWeight(direction: THREE.Vector2): number {
  return smoothstep(-direction.y);
}

/** The roll's horizontal run at a perimeter point. */
function runFor(direction: THREE.Vector2): number {
  const top = topWeight(direction);
  const bottom = smoothstep(direction.y);
  return ROLL_RUN_SIDE + (ROLL_RUN - ROLL_RUN_SIDE) * bottom + (ROLL_RUN_TOP - ROLL_RUN_SIDE) * top;
}

/** How far the roll has risen at `u`, where `u = 0` is the face's outline and
 *  `u = 1` the base: a cubic Hermite from slope 0 at the face to
 *  `ROLL_TAIL * rise / run` at the base, tangent continuous into the face and
 *  monotone in between. The same profile runs all the way round. An earlier pass
 *  gave the top edge a separate, straighter profile so that the surface arrived
 *  at the phone's edge still climbing; that only matters if the roll ends in the
 *  open there, and it does not — the base is buried in the frame, so the
 *  surface's visible edge is wherever it crosses the frame's own surface, and a
 *  shallower approach to the base crosses it earlier and leaves a wider band of
 *  the frame's back face at the top. */
function rollZ(u: number): number {
  const t = Math.min(Math.max(u, 0), 1);
  const rise = PLATEAU.zInner - PLATEAU.zOuter;
  const roll = (3 - ROLL_TAIL) * t * t + (ROLL_TAIL - 2) * t * t * t;
  return PLATEAU.zOuter + rise * roll;
}

/** The face's outline: each perimeter point moved inward by its run. This is the
 *  edge the roll band ends on and the boundary of the flat face. */
export function faceOutline(): THREE.Vector2[] {
  const { points, directions } = plateauPerimeter();
  const contour: THREE.Vector2[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const direction = directions[index];
    if (point === undefined || direction === undefined) continue;
    const run = runFor(direction);
    contour.push(new THREE.Vector2(point.x + direction.x * run, point.y + direction.y * run));
  }
  return contour;
}

/**
 * The roll band: a quad strip from the base outline in to the face's outline,
 * `ROLL_LEVELS` deep so the profile is sampled where it turns, wound to face
 * outwards — half of it climbs the phone's own top corner, and a back-facing
 * surface lit from behind renders black.
 */
export function plateauShellGeometry(): THREE.BufferGeometry {
  const { points, directions } = plateauPerimeter();
  const count = points.length;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const level of ROLL_LEVELS) {
    for (let index = 0; index < count; index += 1) {
      const point = points[index];
      const direction = directions[index];
      if (point === undefined || direction === undefined) continue;
      const run = runFor(direction);
      positions.push(
        point.x + direction.x * run * (1 - level),
        point.y + direction.y * run * (1 - level),
        rollZ(level),
      );
    }
  }
  for (let level = 0; level < ROLL_LEVELS.length - 1; level += 1) {
    for (let index = 0; index < count; index += 1) {
      const next = (index + 1) % count;
      const a = level * count + index;
      const b = level * count + next;
      const c = (level + 1) * count + next;
      const d = (level + 1) * count + index;
      indices.push(a, c, b, a, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // The winding above is the one the sweep produces; this proves it faces
  // outward rather than trusting the derivation, because an inside-out band
  // renders black instead of merely looking wrong.
  if (!facesTowards(geometry, new THREE.Vector3(0, 0, -1))) flipIndices(geometry);
  return geometry;
}

/** True when a geometry's face normals agree with `expected` on average. */
function facesTowards(geometry: THREE.BufferGeometry, expected: THREE.Vector3): boolean {
  const positions = geometry.getAttribute('position');
  const index = geometry.getIndex();
  if (index === null) return true;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let score = 0;
  for (let triangle = 0; triangle < Math.min(index.count / 3, 500); triangle += 1) {
    a.fromBufferAttribute(positions, index.getX(triangle * 3));
    b.fromBufferAttribute(positions, index.getX(triangle * 3 + 1));
    c.fromBufferAttribute(positions, index.getX(triangle * 3 + 2));
    score += b.sub(a).cross(c.sub(a)).dot(expected);
  }
  return score >= 0;
}

/** Reverses every triangle and rebuilds the normals, so a surface that came out
 *  inside-out is fixed instead of rendered as a black silhouette. */
function flipIndices(geometry: THREE.BufferGeometry): void {
  const index = geometry.getIndex();
  if (index === null) return;
  for (let triangle = 0; triangle < index.count; triangle += 3) {
    const second = index.getX(triangle + 1);
    index.setX(triangle + 1, index.getX(triangle + 2));
    index.setX(triangle + 2, second);
  }
  index.needsUpdate = true;
  geometry.deleteAttribute('normal');
  geometry.computeVertexNormals();
}

/** Signed area of a closed polyline; positive is counter-clockwise. */
function signedArea(points: readonly THREE.Vector2[]): number {
  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    if (a === undefined || b === undefined) continue;
    total += a.x * b.y - b.x * a.y;
  }
  return total / 2;
}

/** Every optic the plateau's face has to open for, at its documented position
 *  and radius. */
const PLATEAU_OPENINGS = [
  ...LENSES.map((lens) => ({ x: lens.x, y: lens.y, radius: PLATEAU_CAVITY_RADIUS })),
  { x: FLASH.x, y: FLASH.y, radius: FLASH_CAVITY_RADIUS },
  { x: LIDAR.x, y: LIDAR.y, radius: LIDAR_CAVITY_RADIUS },
  { x: PLATEAU_MIC.x, y: PLATEAU_MIC.y, radius: PLATEAU_MIC_CAVITY_RADIUS },
] as const;

/**
 * The plateau's flat face: the outline the roll band ends on, one circular bore
 * per optic. `ShapeGeometry` triangulates the holes, so the optics look through
 * real openings instead of being buried in aluminum. Its triangles face +Z, and
 * the face is looked at from the back, so the cap is flipped to face -Z:
 * unflipped it is invisible from every back view and shows whatever lies behind
 * the bar instead — which is what the whole back looked like while it was wrong.
 */
export function plateauFaceGeometry(): THREE.ShapeGeometry {
  let contour = faceOutline();
  if (signedArea(contour) < 0) contour = contour.reverse();
  const shape = new THREE.Shape(contour.map((point) => new THREE.Vector2(point.x, point.y)));
  for (const opening of PLATEAU_OPENINGS) {
    const hole = new THREE.Path();
    hole.absarc(opening.x, opening.y, opening.radius, 0, Math.PI * 2, true);
    hole.closePath();
    shape.holes.push(hole);
  }
  const geometry = new THREE.ShapeGeometry(shape);
  if (facesTowards(geometry, new THREE.Vector3(0, 0, -1))) flipIndices(geometry);
  geometry.translate(0, 0, PLATEAU_FACE_Z);
  return geometry;
}

/** Full-width camera plateau carrying the lenses and the sensor cluster.
 *
 *  The plate is two meshes: the rolled shell, which is the bar's own thickness
 *  from its base outline in to the face's outline, and the flat face cap inside
 *  it. Both carry the aluminum material, and the mesh named `plateau-plate` is
 *  the cap, which is what the plane and bore gates in `plateau.test.ts` measure. */
export function buildPlateau(materials: PhoneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'plateau';

  addMesh(group, plateauShellGeometry(), materials.aluminum, 'plateau-shell', 'aluminum');
  addMesh(group, plateauFaceGeometry(), materials.aluminum, 'plateau-plate', 'aluminum');

  group.add(buildLenses(materials));
  group.add(buildFlash(materials));
  group.add(buildLidar(materials));
  group.add(buildPlateauMic(materials));

  return group;
}

/** The panel's top edge in body Y at a given X: `centre` at the middle, rising
 *  to `corner` where the outline's top corner arcs take over. */
function panelTop(x: number, flatHalf: number, centre: number, corner: number): number {
  return centre + (corner - centre) * smoothstep(Math.abs(x) / flatHalf);
}

/** A quarter arc of the panel's outline, sampled rather than handed to
 *  `absarc`, so its winding and every joint are visible at the call site. */
function panelArc(
  shape: THREE.Shape,
  cx: number,
  cy: number,
  radius: number,
  from: number,
  to: number,
): void {
  const steps = 16;
  for (let index = 0; index <= steps; index += 1) {
    const angle = from + ((to - from) * index) / steps;
    shape.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  }
}

/**
 * The panel's outline: a rounded rectangle whose top edge rises from the centre
 * gap to the corner gap so the panel's top corners tuck close around the
 * plateau's rolled bottom corners, and whose top corners are tighter than its
 * bottom ones so that rise is still in place near the panel's own sides. Every
 * arc begins exactly where the run before it ended and is tangent to it, which
 * keeps the outline a simple closed curve: a top corner arc placed anywhere but
 * on the top edge's own end folds the outline over itself, and the triangulator
 * then fills the fold with a dark wedge. `halfWidth`, `corner` and `topCorner`
 * are pre-shrunk by `GLASS_BEVEL`, which the extrusion grows back outside.
 */
function panelShape(
  halfWidth: number,
  bottom: number,
  centreTop: number,
  cornerTop: number,
  corner: number,
  topCorner: number,
): THREE.Shape {
  const shape = new THREE.Shape();
  const samples = 64;
  const flatHalf = halfWidth - topCorner;
  const bottomCy = bottom + corner;
  const topCy = cornerTop - topCorner;

  shape.moveTo(-halfWidth, bottomCy);
  shape.lineTo(-halfWidth, topCy);
  panelArc(shape, -flatHalf, topCy, topCorner, Math.PI, Math.PI / 2);
  for (let index = 0; index <= samples; index += 1) {
    const x = -flatHalf + (2 * flatHalf * index) / samples;
    shape.lineTo(x, panelTop(x, flatHalf, centreTop, cornerTop));
  }
  panelArc(shape, flatHalf, topCy, topCorner, Math.PI / 2, 0);
  shape.lineTo(halfWidth, bottomCy);
  panelArc(shape, halfWidth - corner, bottomCy, corner, 0, -Math.PI / 2);
  shape.lineTo(-halfWidth + corner, bottom);
  panelArc(shape, -halfWidth + corner, bottomCy, corner, -Math.PI / 2, -Math.PI);
  shape.closePath();
  return shape;
}

/** The matte Ceramic Shield panel, with its top corners wrapped around the
 *  plateau's rolled bottom corners. Its planes are unchanged: the inner face on
 *  the frame's back face, the outer face `BACK_PANEL.thickness` outside it. */
export function buildBackPanel(materials: PhoneMaterials): THREE.Mesh {
  const bottom = -BODY.height / 2 + BACK_PANEL.bottomReveal;
  const centreTop = plateauBottomY() - BACK_PANEL.gap;
  const cornerTop = centreTop + BACK_PANEL.topRise;
  const halfWidth = BODY.width / 2 - BACK_PANEL.sideInset - GLASS_BEVEL;
  const corner = BACK_PANEL.radius - GLASS_BEVEL;
  const topCorner = BACK_PANEL.topRadius - GLASS_BEVEL;

  const geometry = new THREE.ExtrudeGeometry(
    panelShape(halfWidth, bottom, centreTop, cornerTop, corner, topCorner),
    {
      depth: BACK_PANEL.thickness,
      bevelEnabled: true,
      bevelThickness: GLASS_BEVEL,
      bevelSize: GLASS_BEVEL,
      bevelOffset: 0,
      bevelSegments: 3,
      curveSegments: 16,
    },
  );
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box === null) throw new Error('the back panel has no bounds');
  const scale = (box.max.z - box.min.z) / BACK_PANEL.thickness;
  geometry.translate(0, 0, -box.min.z);
  geometry.scale(1, 1, 1 / scale);
  // `slabGeometry` carried the shape's centre; this outline is authored in body
  // coordinates, so only the panel's own plane is applied here.
  geometry.translate(0, 0, PANEL_FACE_Z);
  geometry.computeVertexNormals();
  return addMesh(new THREE.Group(), geometry, materials.backGlass, 'back-panel', 'backGlass');
}
