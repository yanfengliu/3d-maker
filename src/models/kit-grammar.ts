import * as T from 'three';
import { kitBox, timberBrace } from './kit-materials';
import { box, mesh, strut, type Point } from './parts';

export type { KitColorway, KitMaterials } from './kit-materials';
export type { DirectionSpec, FrameHingeOptions, PlaceOnFrameOptions } from './kit-frames';
export {
  KitFrame,
  bboxFrame,
  createHingeOnFrame,
  gridFrames,
  jitterFrames,
  localFrame,
  placeOnFrame,
  ringFrames,
  varyValues,
} from './kit-frames';
export {
  HARBOR_TIMBER_COLORWAYS,
  grainShader,
  hardwareMaterial,
  heightBandShader,
  kitBox,
  kitMaterials,
  matteMaterial,
  timberBrace,
  upwardBlendShader,
} from './kit-materials';

/** Grounded two-tier stepped masonry plinth flush at y = 0 with solid lapped corners and zero underside slits. */
export function addSteppedPlinth(
  parent: T.Object3D,
  width: number,
  depth: number,
  height: number,
  stoneMat: T.Material,
  capMat: T.Material,
  courseCount = 6,
): void {
  const baseH = height * 0.5;
  const topH = height - baseH;
  const upperW = width - 0.22;
  const upperD = depth - 0.22;
  const kerbT = 0.036;
  const soleH = 0.014;
  const lowerOuterW = width + kerbT;
  const lowerOuterD = depth + kerbT;

  // Continuous solid base sole flush at y = 0 covering full outer kerb footprint (zero notches/slits in bottom.png).
  box(parent, [0, soleH * 0.5, 0], [lowerOuterW, soleH, lowerOuterD], stoneMat);
  // Core lower slab sitting on soleH with mortar-backed perimeter (strictly inset 1 cm inside kerb outer face).
  box(parent, [0, soleH + (baseH - soleH) * 0.5, 0], [lowerOuterW - 0.02, baseH - soleH, lowerOuterD - 0.02], stoneMat);
  // Inset upper platform sitting cleanly on top of baseH (zero coplanar outer walls).
  const upperOuterW = upperW + kerbT;
  const upperOuterD = upperD + kerbT;
  box(parent, [0, baseH + topH * 0.5, 0], [upperOuterW - 0.02, topH, upperOuterD - 0.02], capMat);

  // Lapped corner kerb blocks: front/back courses run full outerW through all 4 corners; side courses butt flush between them.
  const tiers: readonly { outerW: number; outerD: number; y0: number; h: number; n: number }[] = [
    { outerW: lowerOuterW, outerD: lowerOuterD, y0: soleH, h: baseH - soleH - 0.004, n: Math.max(4, Math.round(courseCount)) },
    { outerW: upperOuterW, outerD: upperOuterD, y0: baseH + 0.004, h: topH - 0.008, n: Math.max(3, Math.round(courseCount) - 1) },
  ];
  for (const tier of tiers) {
    const cy = tier.y0 + tier.h * 0.5;
    const segW = tier.outerW / tier.n;
    for (let i = 0; i < tier.n; i++) {
      const x = -tier.outerW * 0.5 + (i + 0.5) * segW;
      const w = i === 0 || i === tier.n - 1 ? segW - 0.006 : segW - 0.012;
      const xShift = i === 0 ? -0.003 : i === tier.n - 1 ? 0.003 : 0;
      for (const sz of [-1, 1]) {
        box(parent, [x + xShift, cy, sz * (tier.outerD * 0.5 - kerbT * 0.5)], [w, tier.h, kerbT], stoneMat);
      }
    }
    const sideSpan = tier.outerD - kerbT * 2 - 0.016;
    const countZ = Math.max(2, Math.round(sideSpan / segW));
    const segD = sideSpan / countZ;
    for (let i = 0; i < countZ; i++) {
      const z = -sideSpan * 0.5 + (i + 0.5) * segD;
      for (const sx of [-1, 1]) {
        box(parent, [sx * (tier.outerW * 0.5 - kerbT * 0.5), cy, z], [kerbT, tier.h, segD - 0.012], stoneMat);
      }
    }
  }
}

export interface TimberFrameOptions {
  xs: readonly number[];
  zs: readonly number[];
  baseY: number;
  eaveY: number;
  postSize?: number;
  timberMat: T.Material;
  darkMat: T.Material;
  stoneMat: T.Material;
  braces?: boolean;
  hd?: boolean;
}

/** Structural post-and-beam timber bay frame with beveled stone padstones, tie plates, and 45-degree knee braces. */
export function addTimberFrame(parent: T.Object3D, opts: TimberFrameOptions): void {
  const postSize = opts.postSize ?? 0.12;
  const hd = opts.hd ?? false;
  const h = opts.eaveY - opts.baseY;
  const minX = Math.min(...opts.xs);
  const maxX = Math.max(...opts.xs);
  const minZ = Math.min(...opts.zs);
  const maxZ = Math.max(...opts.zs);
  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;

  for (const x of opts.xs) {
    for (const z of opts.zs) {
      // Raised beveled stone padstone meeting the plinth cleanly.
      kitBox(parent, [x, opts.baseY + 0.075, z], [postSize + 0.075, 0.15, postSize + 0.075], opts.stoneMat, hd);
      // Full-height timber post embedded into padstone and top wall plate.
      kitBox(parent, [x, opts.baseY + h * 0.5 + 0.01, z], [postSize, h + 0.05, postSize], opts.timberMat, hd);
    }
  }

  // Longitudinal wall plates along front & back eaves.
  for (const z of opts.zs) {
    kitBox(parent, [(minX + maxX) * 0.5, opts.eaveY, z], [spanX + postSize + 0.14, postSize * 1.05, postSize * 1.08], opts.darkMat, hd);
  }
  // Cross tie beams tucked cleanly between front & back wall plates (below roof slope at all pitches).
  for (const x of opts.xs) {
    box(parent, [x, opts.eaveY - 0.008, (minZ + maxZ) * 0.5], [postSize * 0.9, postSize * 0.86, spanZ - postSize + 0.02], opts.darkMat);
  }

  if (opts.braces !== false) {
    const braceDrop = Math.min(0.44, h * 0.28);
    const braceReach = Math.min(0.36, spanZ * 0.25);
    const braceThick = postSize * 0.62;
    for (const x of opts.xs) {
      for (const z of opts.zs) {
        const zDir = z < 0 ? 1 : -1;
        timberBrace(parent, [x, opts.eaveY - braceDrop, z], [x, opts.eaveY - 0.02, z + zDir * braceReach], braceThick, opts.timberMat);
        if (x > minX + 0.05) {
          timberBrace(parent, [x, opts.eaveY - braceDrop, z], [x - braceReach, opts.eaveY - 0.02, z], braceThick, opts.timberMat);
        }
        if (x < maxX - 0.05) {
          timberBrace(parent, [x, opts.eaveY - braceDrop, z], [x + braceReach, opts.eaveY - 0.02, z], braceThick, opts.timberMat);
        }
      }
    }
  }
}

export interface ShingledRoofOptions {
  centerX?: number;
  baseY: number;
  centerZ?: number;
  width: number;
  /** Structural post-to-post gable wall span along Z (plaster triangle stops strictly here, never overhanging). */
  depth: number;
  /** Front & rear roof eave overhang beyond the structural wall plates along Z. Default 0.24 m. */
  eaveOverhangZ?: number;
  pitchDeg: number;
  courses?: number;
  rafters?: number;
  roofMat: T.Material;
  ridgeMat: T.Material;
  gableMat: T.Material;
  trimMat: T.Material;
  hd?: boolean;
}

/**
 * Watertight pitched timber roof with plaster gable triangle constrained strictly to the structural
 * tie-beam span (zero overhanging plaster wings), tight plumb-cut mitered bargeboard chevrons,
 * enclosed brick-bond slate shingle courses, exposed rafter tails, and pitched V-saddle slate ridge tiles.
 */
export function addShingledPitchedRoof(parent: T.Object3D, opts: ShingledRoofOptions): { ridgeY: number } {
  const cx = opts.centerX ?? 0;
  const cz = opts.centerZ ?? 0;
  const hd = opts.hd ?? false;
  const halfWallZ = opts.depth * 0.5;
  const pitchRad = T.MathUtils.degToRad(Math.max(16, Math.min(48, opts.pitchDeg)));
  const tanP = Math.tan(pitchRad);
  const cosP = Math.cos(pitchRad);
  const sinP = Math.sin(pitchRad);
  // Roof slope meets the top of the wall plates right at z = ±halfWallZ, then extends out to ±eaveZ!
  const rise = halfWallZ * tanP;
  const eaveOverhangZ = opts.eaveOverhangZ ?? 0.24;
  const eaveZ = halfWallZ + eaveOverhangZ;
  const eaveDrop = eaveOverhangZ * tanP;
  const deckW = opts.width + 0.2;
  const bargeThick = 0.068;
  const innerW = deckW - bargeThick * 2;

  // Solid closed triangular plaster gable strictly spanning post-to-post (seated on top of cross tie-beams, zero overhang!).
  const gableW = innerW - 0.02;
  const tri = new T.Shape();
  tri.moveTo(-halfWallZ, 0).lineTo(halfWallZ, 0).lineTo(0, rise).closePath();
  const gableGeo = new T.ExtrudeGeometry(tri, { depth: gableW, bevelEnabled: false });
  gableGeo.rotateY(Math.PI / 2);
  gableGeo.translate(-gableW * 0.5, 0, 0);
  mesh(parent, gableGeo, opts.gableMat, [cx, opts.baseY, cz]);

  // Continuous dark slate underlayment sheathing slabs extending flush under Course 1 outer edge (zero eave notches in Top view!).
  const deckHalfZ = eaveZ - 0.012;
  const deckSlopeLen = deckHalfZ / cosP;
  for (const s of [-1, 1]) {
    const midZ = cz + s * deckHalfZ * 0.5;
    const midY = opts.baseY + rise - deckHalfZ * 0.5 * tanP;
    const deck = box(parent, [cx, midY, midZ], [innerW - 0.008, 0.04, deckSlopeLen], opts.ridgeMat);
    deck.rotation.x = s * pitchRad;
  }

  // Brick-bond overlapping slate shingle courses strictly inside the bargeboards and backed completely by the underlayment deck.
  const courses = Math.max(4, Math.round(opts.courses ?? 6));
  const usableW = innerW - 0.016;
  const cols = Math.max(5, Math.round(usableW / 0.36));
  const tileW = usableW / cols;
  const topInset = 0.025;
  // Reserve 0.09*courseStep overhang allowance so Course 1 tips stop strictly atop the sheathing slab (zero see-through notches!).
  const shingleMaxDist = (deckHalfZ - 0.012) / cosP;
  const courseSpan = (shingleMaxDist - topInset) / (1 + 0.09 / courses);
  const courseStep = courseSpan / courses;
  for (const s of [-1, 1]) {
    const ny = cosP;
    const nz = s * sinP;
    for (let r = 0; r < courses; r++) {
      const distFromRidge = topInset + (r + 0.5) * courseStep;
      const zPos = cz + s * distFromRidge * cosP;
      const yPos = opts.baseY + rise - distFromRidge * sinP;
      const lift = 0.032 + (courses - r) * 0.004;
      const stagger = r % 2 === 1;
      const rowCols = stagger ? cols + 1 : cols;
      for (let c = 0; c < rowCols; c++) {
        const left = stagger
          ? Math.max(-usableW * 0.5, -usableW * 0.5 + (c - 0.5) * tileW)
          : -usableW * 0.5 + c * tileW;
        const right = stagger
          ? Math.min(usableW * 0.5, -usableW * 0.5 + (c + 0.5) * tileW)
          : -usableW * 0.5 + (c + 1) * tileW;
        const w = right - left - 0.008;
        if (w < 0.06) continue;
        const xPos = cx + (left + right) * 0.5;
        const tile = box(
          parent,
          [xPos, yPos + ny * lift, zPos + nz * lift],
          [w, 0.022, courseStep * 1.18],
          opts.roofMat,
        );
        tile.rotation.x = s * (pitchRad - 0.026);
      }
    }
  }

  // Tight, plumb-cut mitered chevron bargeboards hugging the rafters, sheathing lip, and shingle edges cleanly.
  const topPadY = 0.068 / cosP;
  const botPadY = 0.05 / cosP;
  const chevron = new T.Shape();
  chevron.moveTo(0, rise + topPadY);
  chevron.lineTo(eaveZ, -eaveDrop + topPadY);
  chevron.lineTo(eaveZ, -eaveDrop - botPadY);
  chevron.lineTo(0, rise - botPadY);
  chevron.lineTo(-eaveZ, -eaveDrop - botPadY);
  chevron.lineTo(-eaveZ, -eaveDrop + topPadY);
  chevron.closePath();
  const bargeGeo = new T.ExtrudeGeometry(chevron, {
    depth: bargeThick,
    bevelEnabled: hd,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 1,
  });
  bargeGeo.rotateY(-Math.PI / 2);
  bargeGeo.translate(bargeThick * 0.5, 0, 0);
  for (const sx of [-1, 1]) {
    mesh(parent, bargeGeo.clone(), opts.trimMat, [cx + sx * (deckW * 0.5 - bargeThick * 0.5), opts.baseY, cz]);
  }
  bargeGeo.dispose();

  // Exposed dark timber rafter tails cleanly underneath the front & back eaves (inset from bargeboards).
  const rafters = Math.max(3, Math.round(opts.rafters ?? 5));
  const rafterHalfZ = eaveZ - 0.035;
  const rafterLen = rafterHalfZ / cosP;
  for (let i = 0; i < rafters; i++) {
    const t = rafters === 1 ? 0.5 : i / (rafters - 1);
    const rx = cx - (innerW * 0.44) + t * (innerW * 0.88);
    for (const s of [-1, 1]) {
      const midZ = cz + s * rafterHalfZ * 0.5;
      const midY = opts.baseY + rise - rafterHalfZ * 0.5 * tanP - 0.044;
      const rafter = box(parent, [rx, midY, midZ], [0.05, 0.062, rafterLen], opts.trimMat);
      rafter.rotation.x = s * pitchRad;
    }
  }

  // Low-profile pitched V-saddle slate ridge cap segments lapping tightly over both top shingle courses
  // and terminating strictly flush with the outer faces of the left & right bargeboards (zero gap, zero overhang!).
  const ridgeSegs = Math.max(4, Math.round(deckW / 0.48));
  const ridgeTotalW = deckW;
  const ridgeW = ridgeTotalW / ridgeSegs;
  const legZ = 0.135;
  const legDrop = legZ * tanP;
  const capThickY = 0.034 / cosP;
  const capApexY = rise + topPadY + 0.016;
  const saddle = new T.Shape();
  saddle.moveTo(0, capApexY + capThickY * 0.55);
  saddle.lineTo(legZ, capApexY - legDrop + capThickY * 0.45);
  saddle.lineTo(legZ, capApexY - legDrop - capThickY * 0.65);
  saddle.lineTo(0, capApexY - capThickY * 0.55);
  saddle.lineTo(-legZ, capApexY - legDrop - capThickY * 0.65);
  saddle.lineTo(-legZ, capApexY - legDrop + capThickY * 0.45);
  saddle.closePath();

  const segLen = ridgeW - 0.008;
  const saddleGeo = new T.ExtrudeGeometry(saddle, {
    depth: segLen,
    bevelEnabled: hd,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 1,
  });
  saddleGeo.rotateY(-Math.PI / 2);
  saddleGeo.translate(segLen * 0.5, 0, 0);
  for (let i = 0; i < ridgeSegs; i++) {
    const rx = cx - ridgeTotalW * 0.5 + (i + 0.5) * ridgeW;
    mesh(parent, saddleGeo.clone(), opts.ridgeMat, [rx, opts.baseY, cz]);
  }
  saddleGeo.dispose();

  return { ridgeY: opts.baseY + capApexY + capThickY * 0.55 };
}

export interface AwningOptions {
  at: Point;
  width: number;
  depth: number;
  drop: number;
  awningMat: T.Material;
  frameMat: T.Material;
  stripeMat?: T.Material;
  ribs?: number;
  bracketXs?: readonly number[];
  hd?: boolean;
}

/**
 * Cantilevered ribbed storefront awning with gap-free canopy ribs, a single clean extruded scalloped
 * front valance (zero circular disc overlap seams), and dark wrought-iron support brackets.
 */
export function addSlopedAwning(parent: T.Object3D, opts: AwningOptions): void {
  const [x, y, z] = opts.at;
  const hd = opts.hd ?? false;
  const angle = Math.atan2(opts.drop, opts.depth);
  const slopeLen = Math.hypot(opts.depth, opts.drop);
  const ribs = Math.max(6, Math.round(opts.ribs ?? Math.max(8, Math.round(opts.width / 0.24))));
  const panelW = opts.width / ribs;

  // Compact dark iron wall ledger tucked flush inside the awning width (no stray corner nubs).
  box(parent, [x, y + 0.01, z - 0.015], [opts.width - 0.04, 0.05, 0.045], opts.frameMat);

  // Continuous canopy backing deck strictly tucked 2.5 cm inside strip ends so zero end-cap faces ever align.
  const backDeck = box(
    parent,
    [x, y - opts.drop * 0.5 - 0.012, z + opts.depth * 0.5],
    [opts.width - 0.02, 0.02, slopeLen - 0.05],
    opts.awningMat,
  );
  backDeck.rotation.x = angle;

  // Alternating ribbed terracotta canopy strips inset cleanly from outer valance edges (zero coplanar faces!).
  const stripSpan = opts.width - 0.016;
  const stripW = stripSpan / ribs;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  for (let i = 0; i < ribs; i++) {
    const px = x - stripSpan * 0.5 + (i + 0.5) * stripW;
    const mat = opts.stripeMat && i % 2 === 1 ? opts.stripeMat : opts.awningMat;
    const ribLift = i % 2 === 1 ? 0.007 : 0;
    const panel = box(
      parent,
      [px, y - opts.drop * 0.5 + ribLift * cosA, z + opts.depth * 0.5 + ribLift * sinA],
      [stripW - 0.005, 0.026, slopeLen - 0.01],
      mat,
    );
    panel.rotation.x = angle;
  }

  // Single continuous extruded scalloped valance along the leading edge (zero coplanar disc seams!).
  const valH = 0.095;
  const scallopR = panelW * 0.5;
  const arcSegs = hd ? 10 : 4;
  const shape = new T.Shape();
  const leftEdge = -opts.width * 0.5;
  shape.moveTo(leftEdge, 0);
  shape.lineTo(leftEdge + opts.width, 0);
  shape.lineTo(leftEdge + opts.width, -valH);
  for (let i = ribs - 1; i >= 0; i--) {
    const cx = leftEdge + (i + 0.5) * panelW;
    for (let s = 0; s <= arcSegs; s++) {
      const a = (s / arcSegs) * Math.PI;
      const sx = cx + Math.cos(a) * scallopR;
      const sy = -valH - Math.sin(a) * (scallopR * 0.52);
      shape.lineTo(sx, sy);
    }
  }
  shape.closePath();
  const valGeo = new T.ExtrudeGeometry(shape, {
    depth: 0.032,
    bevelEnabled: hd,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 1,
  });
  valGeo.translate(0, 0, -0.016);
  mesh(parent, valGeo, opts.awningMat, [x, y - opts.drop + 0.008, z + opts.depth - 0.006]);

  // Diagonal wrought-iron support arms terminating cleanly on the awning UNDERSIDE behind the scalloped valance.
  const bracketXs = opts.bracketXs ?? [-opts.width * 0.42, 0, opts.width * 0.42];
  const attachFrac = 0.72;
  for (const bx of bracketXs) {
    strut(
      parent,
      [x + bx, y - opts.drop - 0.2, z - 0.05],
      [x + bx, y - opts.drop * attachFrac - 0.018, z + opts.depth * attachFrac],
      0.016,
      opts.frameMat,
      hd ? 10 : 6,
    );
  }
}
