import * as T from 'three';
import type { ModelParamSpec, ModelParamValues } from '../../capabilities/param-schema';
import {
  addShingledPitchedRoof,
  addSlopedAwning,
  addSteppedPlinth,
  addTimberFrame,
  HARBOR_TIMBER_COLORWAYS,
  kitBox,
  kitMaterials,
  matteMaterial,
} from '../kit-grammar';
import { mergeStaticParts } from '../merge-static';
import { box, group, mesh, rotationTrack, strut, tube, type Finish } from '../parts';

const DEFAULT_PRIMARY = '#8b6a4e';
const DEFAULT_ACCENT = '#a64533';

export const HARBOR_PAVILION_PARAM_SPECS: readonly ModelParamSpec[] = [
  {
    name: 'bays',
    label: 'Structural bays',
    type: 'range',
    default: 3,
    min: 2,
    max: 4,
    step: 1,
    describe: 'Number of timber bays controlling overall pavilion width, posts, roof tiles, and display crates',
  },
  {
    name: 'roofPitch',
    label: 'Roof pitch',
    type: 'range',
    default: 34,
    min: 24,
    max: 40,
    step: 2,
    unit: '°',
    describe: 'Pitched gable roof angle in degrees',
  },
  {
    name: 'awning',
    label: 'Front awning',
    type: 'toggle',
    default: true,
    describe: 'Toggle the cantilevered ribbed storefront awning and wrought-iron brackets',
  },
  {
    name: 'colorway',
    label: 'Kit colorway',
    type: 'choice',
    default: 'harbor-oak',
    options: [
      { value: 'harbor-oak', label: 'Harbor Oak' },
      { value: 'cedar-slate', label: 'Cedar & Slate' },
      { value: 'coastal-chalk', label: 'Coastal Chalk' },
    ],
    describe: 'Cohesive matte architectural palette from the Harbor Timber kit',
  },
  {
    name: 'tone',
    label: 'Surface tonal jitter',
    type: 'range',
    default: 0.4,
    min: 0,
    max: 1,
    step: 0.05,
    describe: 'Per-element vertex-color shade variation across roof shingles, plinth stones, and boards',
  },
];

function addRearWainscotBay(
  parent: T.Object3D,
  x0: number,
  x1: number,
  z: number,
  baseY: number,
  height: number,
  boardMat: T.Material,
  frameMat: T.Material,
): void {
  const span = x1 - x0;
  const cx = (x0 + x1) * 0.5;
  const stileW = 0.055;
  const innerSpan = Math.max(0.2, span - stileW * 2);
  const boards = Math.max(4, Math.round(innerSpan / 0.14));
  const boardW = innerSpan / boards;
  // Recessed vertical timber tongue-and-groove boards framed between end stiles.
  for (let i = 0; i < boards; i++) {
    const bx = x0 + stileW + (i + 0.5) * boardW;
    box(parent, [bx, baseY + height * 0.5, z], [boardW - 0.008, height - 0.11, 0.048], boardMat);
  }
  // End stiles beside each post so every bay reads as crisp joinery from Front and Back.
  box(parent, [x0 + stileW * 0.5, baseY + height * 0.5, z], [stileW, height - 0.02, 0.072], frameMat);
  box(parent, [x1 - stileW * 0.5, baseY + height * 0.5, z], [stileW, height - 0.02, 0.072], frameMat);
  // Continuous sill rail & overhanging cap rail (uniform dark timber tone, zero stark bay-to-bay split).
  box(parent, [cx, baseY + 0.05, z], [span + 0.01, 0.1, 0.088], frameMat);
  box(parent, [cx, baseY + height - 0.04, z], [span + 0.016, 0.08, 0.112], frameMat);
}

/** Angled solid triangular support cradle so tilted produce crates rest flush on the tabletop with zero daylight gap. */
function addCrateWedgeCradle(
  parent: T.Object3D,
  x: number,
  topY: number,
  frontZ: number,
  depth: number,
  tiltRad: number,
  width: number,
  mat: T.Material,
): void {
  const rearH = depth * Math.sin(tiltRad);
  const runD = depth * Math.cos(tiltRad);
  const wedge = new T.Shape();
  wedge.moveTo(0, 0).lineTo(runD, 0).lineTo(0, rearH).closePath();
  const geo = new T.ExtrudeGeometry(wedge, { depth: width, bevelEnabled: false });
  // Map 2D shape (+X = forward toward +Z, +Y = up) into 3D world axes.
  geo.rotateY(-Math.PI / 2);
  geo.translate(width * 0.5, 0, -runD);
  mesh(parent, geo, mat, [x, topY, frontZ]);
}

function buildProduceStall(
  parent: T.Object3D,
  width: number,
  deckY: number,
  crates: number,
  mats: ReturnType<typeof kitMaterials>,
  tone: number,
  detail: boolean,
  hd: boolean,
): void {
  const stall = group(parent, 'ProduceStall', [0, deckY, -0.06]);
  const counterW = Math.min(width * 0.56, 0.96 + crates * 0.22);
  const counterD = 0.62;
  const counterH = 0.68;

  // Kick-plinth flush on the plinth deck (y = 0..0.085); framed cabinet rests directly on top.
  box(stall, [0, 0.0425, 0], [counterW + 0.036, 0.085, counterD + 0.036], mats.timberDark);
  const bodyY0 = 0.085;
  const bodyH = counterH - bodyY0;
  // Recessed core cabinet box inset 1 cm vertically inside top/bottom framing rails (zero coplanar faces!).
  box(stall, [0, bodyY0 + bodyH * 0.5, 0], [counterW - 0.01, bodyH - 0.02, counterD - 0.01], mats.timber);
  // Top & bottom cabinet framing rails wrapping all 4 sides cleanly.
  box(stall, [0, bodyY0 + 0.032, 0], [counterW + 0.018, 0.064, counterD + 0.018], mats.timberDark);
  box(stall, [0, counterH - 0.032, 0], [counterW + 0.018, 0.064, counterD + 0.018], mats.timberDark);
  // Four corner posts + proud front/back & left/right intermediate mullions so ALL FOUR sides reveal recessed oak panels!
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(stall, [sx * (counterW * 0.5 - 0.018), bodyY0 + bodyH * 0.5, sz * (counterD * 0.5 - 0.018)], [0.058, bodyH - 0.01, 0.058], mats.timberDark);
    }
    // Center mullion framing two recessed oak panels on each side end (left.png / right.png).
    box(stall, [sx * (counterW * 0.5), bodyY0 + bodyH * 0.5, 0], [0.026, bodyH - 0.08, 0.052], mats.timberDark);
  }
  const panels = Math.max(2, crates);
  for (let i = 1; i < panels; i++) {
    const px = -counterW * 0.5 + (i / panels) * counterW;
    for (const sz of [-1, 1]) {
      box(stall, [px, bodyY0 + bodyH * 0.5, sz * (counterD * 0.5)], [0.054, bodyH - 0.08, 0.026], mats.timberDark);
    }
  }

  // Overhanging timber tabletop slab with individual plank seams.
  const plankCount = 4;
  const plankD = (counterD + 0.12) / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const pz = -(counterD + 0.12) * 0.5 + (i + 0.5) * plankD;
    kitBox(stall, [0, counterH + 0.032, pz], [counterW + 0.12, 0.064, plankD - 0.006], mats.timber, hd);
  }
  const tableTopY = counterH + 0.064;

  // Tilted wooden produce crates seated FLUSH on tableTopY via full-width triangular wedge cradles!
  const producePalette = [
    matteMaterial('#a83e33', 0.85, 'Apples'),
    matteMaterial('#c29139', 0.85, 'Pears'),
    matteMaterial('#557746', 0.86, 'Greens'),
    matteMaterial('#bd6935', 0.85, 'Citrus'),
  ];
  const crateW = Math.min(0.4, (counterW - 0.1) / crates - 0.045);
  const crateD = 0.42;
  const tilt = 0.24;
  const spacing = (counterW - 0.1) / crates;
  const frontContactZ = 0.22;

  for (let i = 0; i < crates; i++) {
    const cx = -(counterW - 0.1) * 0.5 + (i + 0.5) * spacing;
    // Full-width triangular wedge sitting flush on tableTopY right beneath the tilted crate.
    addCrateWedgeCradle(stall, cx, tableTopY - 0.004, frontContactZ, crateD * 0.88, tilt, crateW * 0.9, mats.timberDark);

    // Pivot crate right at its front-bottom contact edge on tableTopY so ZERO daylight gap exists!
    const crate = group(stall, '', [cx, tableTopY - 0.003, frontContactZ]);
    crate.rotation.x = tilt;
    const zMid = -crateD * 0.5;
    // Recessed crate floor tucked strictly inside and 1 cm above the rim underside (zero coplanar faces).
    box(crate, [0, 0.026, zMid], [crateW - 0.064, 0.032, crateD - 0.064], mats.timberDark);
    for (const sx of [-1, 1]) {
      box(crate, [sx * (crateW * 0.5 - 0.015), 0.054, zMid], [0.03, 0.108, crateD], mats.timber);
    }
    for (const sz of [-1, 1]) {
      box(crate, [0, 0.054, zMid + sz * (crateD * 0.5 - 0.015)], [crateW - 0.062, 0.108, 0.03], mats.timber);
    }

    // Organic staggered produce clusters inside the crate (varied sizes & heights, lean HD triangles).
    const itemMat = producePalette[i % producePalette.length] ?? producePalette[0];
    if (itemMat) {
      const cols = detail ? 3 : 2;
      const rows = detail ? 3 : 2;
      const baseGeo = new T.IcosahedronGeometry(0.046, hd ? 1 : 0);
      for (let gx = 0; gx < cols; gx++) {
        for (let gz = 0; gz < rows; gz++) {
          const jitterX = (((gx * 7 + gz * 13 + i * 5) % 5) - 2) * 0.007;
          const jitterZ = (((gx * 11 + gz * 3 + i * 7) % 5) - 2) * 0.007;
          const px = (gx - (cols - 1) * 0.5) * (crateW * 0.25) + jitterX;
          const pz = zMid + (gz - (rows - 1) * 0.5) * (crateD * 0.25) + jitterZ;
          const centerBoost = gx === 1 && gz === 1 ? 0.02 : 0;
          const py = 0.066 + ((gx + gz + i) % 2) * 0.014 + centerBoost;
          const fruit = mesh(crate, baseGeo.clone(), itemMat, [px, py, pz]);
          const s = 0.88 + (((gx * 5 + gz * 9 + i) % 4) * 0.08);
          fruit.scale.set(s, s * 0.92, s);
        }
      }
      baseGeo.dispose();
    }
  }

  mergeStaticParts(stall, { tone: tone * 0.75, seed: 5301, namePrefix: 'Stall' });
}

/**
 * Showcase procedural model authored via the full 5-stage pipeline:
 * kit grammar (`harbor-timber`) + semantic structural knobs (`bays`, `roofPitch`, `awning`, `colorway`, `tone`)
 * + `mergeStaticParts` draw-call compression & vertex-color tonal jitter + rigged/detachable subtrees.
 */
export function buildHarborTimberPavilion(
  root: T.Group,
  p: Finish,
  detail: boolean,
  rawParams?: ModelParamValues,
): void {
  const hd = p.hd;
  const bays = Math.max(2, Math.min(4, Math.round(Number(rawParams?.bays ?? 3))));
  const roofPitch = Math.max(24, Math.min(40, Number(rawParams?.roofPitch ?? 34)));
  const showAwning = rawParams?.awning !== false;
  const colorway = typeof rawParams?.colorway === 'string' ? rawParams.colorway : 'harbor-oak';
  const tone = Math.max(0, Math.min(1, Number(rawParams?.tone ?? 0.4)));

  const cw = HARBOR_TIMBER_COLORWAYS[colorway] ?? HARBOR_TIMBER_COLORWAYS['harbor-oak'];
  const recipePrimary = '#' + p.primary.color.getHexString();
  const recipeAccent = '#' + p.accent.color.getHexString();
  const useCustomPrimary = recipePrimary !== DEFAULT_PRIMARY;
  const useCustomAccent = recipeAccent !== DEFAULT_ACCENT;

  const mats = kitMaterials(colorway, useCustomAccent ? recipeAccent : cw?.awning);
  if (useCustomPrimary) mats.timber.color.set(recipePrimary);
  // Keep primary timber and accent awning tint-zone materials exact while preserving tonal vertex-color shading.
  mats.timber.userData.tintZone = 'primary';
  mats.awning.userData.tintZone = 'accent';

  // Proportions matched to brief (~3.4 m W x 2.78 m H x 2.35 m D for 3 bays) and reference.jpg silhouette.
  const bayWidth = 0.86;
  const spanX = bays * bayWidth;
  const spanZ = 1.48;
  const plinthW = spanX + 0.56;
  const plinthD = spanZ + 0.56;
  const plinthH = 0.22;
  const eaveY = plinthH + 1.78;
  const postSize = 0.13;

  const xs: number[] = [];
  for (let i = 0; i <= bays; i++) {
    xs.push(-spanX * 0.5 + i * bayWidth);
  }
  const zs = [-spanZ * 0.5, spanZ * 0.5] as const;

  const structure = group(root, 'HarborPavilion');

  // 1. Grounded two-tier stepped granite plinth flush at y = 0 with solid lapped corners.
  addSteppedPlinth(structure, plinthW, plinthD, plinthH, mats.stone, mats.stone, bays * 2 + 2);

  // 2. Post-and-beam timber bay frame on stone padstones with 45-degree timber knee braces.
  addTimberFrame(structure, {
    xs,
    zs,
    baseY: plinthH,
    eaveY,
    postSize,
    timberMat: mats.timber,
    darkMat: mats.timberDark,
    stoneMat: mats.stone,
    braces: true,
    hd,
  });

  // 3. Rear half-height framed timber wainscot wall between rear posts (clean open side arcades as in reference.jpg).
  const wainscotH = 0.68;
  for (let i = 0; i < bays; i++) {
    const x0 = (xs[i] ?? 0) + postSize * 0.5;
    const x1 = (xs[i + 1] ?? 0) - postSize * 0.5;
    addRearWainscotBay(structure, x0, x1, zs[0], plinthH, wainscotH, mats.timber, mats.timberDark);
  }

  // 4. Shingled pitched gable roof: seated cleanly on top of the wall plates (eaveY + 0.072) so no timber
  //    framing ever pokes through the sheathing across the entire 24°–40° roofPitch range!
  addShingledPitchedRoof(structure, {
    baseY: eaveY + 0.072,
    width: spanX + 0.34,
    depth: spanZ + postSize,
    eaveOverhangZ: 0.24,
    pitchDeg: roofPitch,
    courses: hd ? (detail ? 8 : 5) : (detail ? 5 : 4),
    rafters: bays * 3 + 2,
    roofMat: mats.roof,
    ridgeMat: mats.roofRidge,
    gableMat: mats.plaster,
    trimMat: mats.timberDark,
    hd,
  });

  // 5. Optional cantilevered ribbed terracotta awning extending cleanly past outer posts to cover all 4 iron brackets!
  if (showAwning) {
    const awningStripe = matteMaterial(mats.awning.color.clone().offsetHSL(0, -0.04, -0.055).getStyle(), 0.87, 'Awning stripe');
    addSlopedAwning(structure, {
      at: [0, eaveY - 0.06, zs[1] + postSize * 0.5 + 0.005],
      width: spanX + postSize + 0.16,
      depth: 0.46,
      drop: 0.22,
      awningMat: mats.awning,
      stripeMat: awningStripe,
      frameMat: mats.iron,
      ribs: detail ? bays * 4 + 2 : bays * 2 + 2,
      bracketXs: xs,
      hd,
    });
  } else {
    box(structure, [0, eaveY - 0.075, zs[1] + postSize * 0.55], [spanX * 0.45, 0.045, 0.018], mats.awning);
  }

  // 6. Solid cast-brass sign wall plate & under-braced outrigger mounted cleanly BELOW the awning valance
  //    on the -X face of the front-left post, keeping the bracket, chains, and signboard 100% clear in Front & 3/4!
  const leftPostX = xs[0] ?? -spanX * 0.5;
  const frontZ = zs[1];
  const bracketY = eaveY - 0.48;
  // Bolted brass corner plate on the outer -X face of the front-left post well below the awning valance.
  box(structure, [leftPostX - postSize * 0.5 - 0.014, bracketY - 0.06, frontZ], [0.028, 0.2, 0.088], mats.brass);
  // Horizontal brass outrigger bar projecting outward along -X with UNDER-ARM diagonal strut into the post!
  box(structure, [leftPostX - postSize * 0.5 - 0.3, bracketY, frontZ], [0.58, 0.034, 0.034], mats.brass);
  strut(
    structure,
    [leftPostX - postSize * 0.5 - 0.02, bracketY - 0.14, frontZ],
    [leftPostX - postSize * 0.5 - 0.22, bracketY - 0.01, frontZ],
    0.014,
    mats.brass,
    hd ? 10 : 6,
  );
  tube(structure, [leftPostX - postSize * 0.5 - 0.6, bracketY, frontZ], 0.022, 0.022, 0.03, mats.brass, hd ? 12 : 6).rotation.z = Math.PI / 2;

  // 7. Rigged HangingSign preserved out of static merge: pivots cleanly on Z [-22, 22] completely clear of post & awning!
  const sign = group(root, 'HangingSign', [leftPostX - postSize * 0.5 - 0.38, bracketY - 0.01, frontZ]);
  for (const dx of [-0.1, 0.1]) {
    strut(sign, [dx, 0.015, 0], [dx, -0.14, 0], 0.012, mats.brass, hd ? 10 : 6);
    box(sign, [dx, -0.07, 0], [0.028, 0.055, 0.024], mats.brass);
  }
  // Clean framed timber plank signboard (both faces crafted identically).
  kitBox(sign, [0, -0.32, 0], [0.34, 0.34, 0.042], mats.timberDark, hd);
  for (let b = 0; b < 3; b++) {
    const by = -0.22 - b * 0.095;
    box(sign, [0, by, 0], [0.27, 0.086, 0.056], mats.timber);
  }
  mergeStaticParts(sign, { tone: tone * 0.55, seed: 6401, namePrefix: 'Sign' });

  // 8. Detachable ProduceStall resting on the paved upper plinth.
  buildProduceStall(root, spanX, plinthH, bays, mats, tone, detail, hd);

  // 9. Merge all static pavilion architecture into compact vertex-colored draw calls.
  mergeStaticParts(root, {
    preserveNames: new Set(['HangingSign', 'ProduceStall']),
    tone,
    seed: 4201,
    namePrefix: 'Pavilion',
  });

  // 10. Continuous ambient sway clip for the hanging market sign.
  const peak = (18 * Math.PI) / 180;
  root.animations = [
    new T.AnimationClip('Breeze sway', 3.4, [
      rotationTrack('HangingSign', 'z', [0, 0.85, 2.55, 3.4], [0, peak, -peak, 0]),
    ]),
  ];
}
