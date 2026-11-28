import * as T from 'three';
import { mesh, type Point } from './parts';

/**
 * Watertight thick-walled concave hemisphere/kettle bowl (open on top at y = 0, bottom at y = -depth).
 * Uses strict CCW profile winding so every outer and inner concave face is FrontSide outward.
 */
export function concaveBowlLathe(
  parent: T.Object3D,
  at: Point,
  radius: number,
  depth: number,
  wall: number,
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  const steps = hd ? 12 : 5;
  const rIn = Math.max(0.02, radius - wall);
  const dIn = Math.max(0.02, depth - wall);
  const pts: T.Vector2[] = [];
  // Outer curve from bottom pole (0, -depth) up to top rim (radius, 0).
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new T.Vector2(Math.sin(a) * radius, -Math.cos(a) * depth));
  }
  // Top rim lip inward, then inner concave wall down to interior floor (0, -dIn).
  for (let i = steps; i >= 0; i--) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new T.Vector2(Math.sin(a) * rIn, -Math.cos(a) * dIn));
  }
  const geo = new T.LatheGeometry(pts, hd ? 32 : 12);
  return mesh(parent, geo, mat, at);
}

/**
 * Watertight thick-walled hollow dome lid sitting strictly at y >= 0 (rim at y = 0, crown at y = height).
 */
export function hollowDomeLathe(
  parent: T.Object3D,
  at: Point,
  radius: number,
  height: number,
  wall: number,
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  const steps = hd ? 12 : 5;
  const rIn = Math.max(0.02, radius - wall);
  const hIn = Math.max(0.02, height - wall);
  const pts: T.Vector2[] = [];
  // Inner dome ceiling from crown (0, hIn) down to inner rim (rIn, 0).
  for (let i = steps; i >= 0; i--) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new T.Vector2(Math.cos(a) * rIn, Math.sin(a) * hIn));
  }
  // Bottom rim lip outward to (radius, 0), then outer dome up to crown (0, height).
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new T.Vector2(Math.cos(a) * radius, Math.sin(a) * height));
  }
  const geo = new T.LatheGeometry(pts, hd ? 32 : 12);
  return mesh(parent, geo, mat, at);
}

/**
 * Watertight thick-walled cylindrical arc extruded along the X axis (centered on X).
 * Angles are in the YZ plane: 0 = +Z (front), +PI/2 = +Y (top), PI = -Z (back), -PI/2 = -Y (bottom).
 */
export function curvedArcExtrudeX(
  parent: T.Object3D,
  at: Point,
  rIn: number,
  rOut: number,
  lengthX: number,
  startAng: number,
  endAng: number,
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  const steps = hd ? 20 : 8;
  const shape = new T.Shape();
  for (let i = 0; i <= steps; i++) {
    const a = startAng + (i / steps) * (endAng - startAng);
    const px = Math.cos(a) * rOut;
    const py = Math.sin(a) * rOut;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  }
  for (let i = steps; i >= 0; i--) {
    const a = startAng + (i / steps) * (endAng - startAng);
    shape.lineTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
  }
  shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, { depth: lengthX, bevelEnabled: false, curveSegments: steps });
  geo.translate(0, 0, -lengthX * 0.5);
  // Rotate shape (+X -> +Z, +Y -> +Y, +Z extrude -> -X; flip to keep exact angle mapping 0=+Z, +PI/2=+Y).
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return mesh(parent, geo, mat, at);
}

/**
 * Watertight arched half-cylinder chest/mimic lid strictly at y >= 0, extruded along X.
 * `depthZ` is front-to-back chord width centered at `at`, `archH` is dome height above `y = 0`.
 */
export function archedVaultLid(
  parent: T.Object3D,
  at: Point,
  widthX: number,
  depthZ: number,
  archH: number,
  wall: number,
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  const steps = hd ? 18 : 7;
  const halfD = depthZ * 0.5;
  const inD = Math.max(0.04, halfD - wall);
  const inH = Math.max(0.03, archH - wall);
  const shape = new T.Shape();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI;
    const px = Math.cos(a) * halfD;
    const py = Math.sin(a) * archH;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  }
  for (let i = steps; i >= 0; i--) {
    const a = (i / steps) * Math.PI;
    shape.lineTo(Math.cos(a) * inD, Math.sin(a) * inH);
  }
  shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, { depth: widthX, bevelEnabled: false, curveSegments: steps });
  geo.translate(0, 0, -widthX * 0.5);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return mesh(parent, geo, mat, at);
}

/**
 * Watertight thin curved spherical-arc visor shell centered at `at`, facing +Z.
 * Strictly occupies `[rIn, rOut]` so it hugs outside a helmet sphere with zero overlap.
 */
export function sphericalVisorShell(
  parent: T.Object3D,
  at: Point,
  rIn: number,
  rOut: number,
  phiHalf: number,
  elevMin: number,
  elevMax: number,
  mat: T.Material,
  hd: boolean,
): T.Mesh {
  const segU = hd ? 20 : 8;
  const segV = hd ? 12 : 5;
  const positions: number[] = [];
  const indices: number[] = [];
  const stride = segU + 1;

  const pushLayer = (r: number) => {
    const base = positions.length / 3;
    for (let iv = 0; iv <= segV; iv++) {
      const el = elevMin + (iv / segV) * (elevMax - elevMin);
      const ce = Math.cos(el);
      const se = Math.sin(el);
      for (let iu = 0; iu <= segU; iu++) {
        const ph = -phiHalf + (iu / segU) * (phiHalf * 2);
        positions.push(r * ce * Math.sin(ph), r * se, r * ce * Math.cos(ph));
      }
    }
    return base;
  };

  const outBase = pushLayer(rOut);
  const inBase = pushLayer(rIn);
  const quad = (a: number, b: number, c: number, d: number) => {
    indices.push(a, b, c, a, c, d);
  };

  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const o00 = outBase + iv * stride + iu;
      const o10 = o00 + 1;
      const o01 = o00 + stride;
      const o11 = o01 + 1;
      quad(o00, o10, o11, o01);
      const i00 = inBase + iv * stride + iu;
      const i10 = i00 + 1;
      const i01 = i00 + stride;
      const i11 = i01 + 1;
      quad(i00, i01, i11, i10);
    }
  }
  // Stitch all 4 closed rim edges (bottom, top, left, right) so the shell is 100% watertight.
  for (let iu = 0; iu < segU; iu++) {
    quad(outBase + iu, inBase + iu, inBase + iu + 1, outBase + iu + 1);
    const topO = outBase + segV * stride + iu;
    const topI = inBase + segV * stride + iu;
    quad(topO, topO + 1, topI + 1, topI);
  }
  for (let iv = 0; iv < segV; iv++) {
    const leftO = outBase + iv * stride;
    const leftI = inBase + iv * stride;
    quad(leftO, leftO + stride, leftI + stride, leftI);
    const rightO = outBase + iv * stride + segU;
    const rightI = inBase + iv * stride + segU;
    quad(rightO, rightI, rightI + stride, rightO + stride);
  }

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return mesh(parent, geo, mat, at);
}
