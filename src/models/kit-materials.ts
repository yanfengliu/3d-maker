import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { VertexColorShader } from './merge-static';
import { box, mesh, type Point } from './parts';

export interface KitColorway {
  id: string;
  label: string;
  timber: string;
  timberDark: string;
  roof: string;
  roofRidge: string;
  plaster: string;
  stone: string;
  awning: string;
  iron: string;
  brass: string;
}

/** Cohesive matte palette presets shared across harbor/town timber kit models. */
export const HARBOR_TIMBER_COLORWAYS: Record<string, KitColorway> = {
  'harbor-oak': {
    id: 'harbor-oak',
    label: 'Harbor Oak',
    timber: '#8b6a4e',
    timberDark: '#5b4331',
    roof: '#566471',
    roofRidge: '#3f4953',
    plaster: '#d8ceb9',
    stone: '#8c8a82',
    awning: '#a64533',
    iron: '#32373c',
    brass: '#a08446',
  },
  'cedar-slate': {
    id: 'cedar-slate',
    label: 'Cedar & Slate',
    timber: '#7e4c3a',
    timberDark: '#4d2f25',
    roof: '#3f4953',
    roofRidge: '#2e363e',
    plaster: '#ddd3be',
    stone: '#6c6f70',
    awning: '#2f6864',
    iron: '#2c3136',
    brass: '#8c764c',
  },
  'coastal-chalk': {
    id: 'coastal-chalk',
    label: 'Coastal Chalk',
    timber: '#9e8569',
    timberDark: '#65533f',
    roof: '#517477',
    roofRidge: '#3a575a',
    plaster: '#e3ded0',
    stone: '#a49f92',
    awning: '#bd7533',
    iron: '#3a4046',
    brass: '#967c4b',
  },
};

export interface KitMaterials {
  timber: T.MeshStandardMaterial;
  timberDark: T.MeshStandardMaterial;
  roof: T.MeshStandardMaterial;
  roofRidge: T.MeshStandardMaterial;
  plaster: T.MeshStandardMaterial;
  stone: T.MeshStandardMaterial;
  awning: T.MeshStandardMaterial;
  iron: T.MeshStandardMaterial;
  brass: T.MeshStandardMaterial;
}

/** Calm matte material following PolyFork's ~0.85 roughness discipline (no plastic clearcoat glare). */
export function matteMaterial(color: string, roughness = 0.86, name = 'Kit matte'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name,
    color,
    roughness,
    metalness: 0,
    side: T.FrontSide,
  });
}

/** Mid-roughness metal material reserved strictly for brackets, rings, and fasteners. */
export function hardwareMaterial(color: string, roughness = 0.45, metalness = 0.35, name = 'Kit hardware'): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({
    name,
    color,
    roughness,
    metalness,
    side: T.FrontSide,
  });
}

/** Build a complete matte kit material palette from a named colorway, optionally overriding awning accent. */
export function kitMaterials(colorwayId: string, customAwning?: string): KitMaterials {
  const cw = HARBOR_TIMBER_COLORWAYS[colorwayId] ?? HARBOR_TIMBER_COLORWAYS['harbor-oak'];
  if (!cw) throw new Error('Missing default kit colorway.');
  return {
    timber: matteMaterial(cw.timber, 0.86, 'Kit timber'),
    timberDark: matteMaterial(cw.timberDark, 0.88, 'Kit dark timber'),
    roof: matteMaterial(cw.roof, 0.85, 'Kit roof'),
    roofRidge: matteMaterial(cw.roofRidge, 0.86, 'Kit roof ridge'),
    plaster: matteMaterial(cw.plaster, 0.89, 'Kit plaster'),
    stone: matteMaterial(cw.stone, 0.9, 'Kit stone'),
    awning: matteMaterial(customAwning ?? cw.awning, 0.86, 'Kit awning'),
    iron: hardwareMaterial(cw.iron, 0.46, 0.3, 'Kit iron'),
    brass: hardwareMaterial(cw.brass, 0.42, 0.48, 'Kit brass'),
  };
}

/** Crisp low-poly box in standard mode; subtle 1-segment beveled box in HD mode for hero silhouette pieces. */
export function kitBox(
  parent: T.Object3D,
  at: Point,
  size: [number, number, number],
  mat: T.Material,
  hd = false,
): T.Mesh {
  const thin = Math.min(size[0], size[1], size[2]);
  if (hd && thin >= 0.04) {
    return mesh(parent, new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(0.012, thin * 0.14)), mat, at);
  }
  return box(parent, at, size, mat);
}

/** Square timber diagonal brace between two 3D points (authentic carpentry joinery). */
export function timberBrace(
  parent: T.Object3D,
  a: Point,
  b: Point,
  thickness: number,
  mat: T.Material,
): T.Mesh {
  const start = new T.Vector3(...a);
  const end = new T.Vector3(...b);
  const dir = end.clone().sub(start);
  const len = dir.length();
  const part = new T.Mesh(new T.BoxGeometry(thickness, len, thickness), mat);
  part.position.copy(start.add(end).multiplyScalar(0.5));
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (Math.abs(edge1 - edge0) < 1e-6) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Blend `topColor` (moss, snow, or dust) onto upward-facing surfaces (`normal[1] > threshold`) in vertex colors. */
export function upwardBlendShader(
  topColor: string | number | T.Color,
  threshold = 0.55,
  softness = 0.25,
  strength = 0.85,
): VertexColorShader {
  const top = topColor instanceof T.Color ? topColor.clone() : new T.Color(topColor);
  const out = new T.Color();
  const s = Math.max(0, Math.min(1, strength));
  return (_x, _y, _z, normal, base) => {
    const t = smoothstep(threshold, threshold + Math.max(0.01, softness), normal[1]) * s;
    return out.copy(base).lerp(top, t);
  };
}

/** Smoothly tint vertices between `lowColor` at `minY` and `highColor` at `maxY` (damp stone plinths, foliage crowns). */
export function heightBandShader(
  lowColor: string | number | T.Color,
  highColor: string | number | T.Color,
  minY: number,
  maxY: number,
  mixAmount = 0.65,
): VertexColorShader {
  const low = lowColor instanceof T.Color ? lowColor.clone() : new T.Color(lowColor);
  const high = highColor instanceof T.Color ? highColor.clone() : new T.Color(highColor);
  const band = new T.Color();
  const out = new T.Color();
  const m = Math.max(0, Math.min(1, mixAmount));
  return (_x, y, _z, _normal, base) => {
    const t = smoothstep(minY, maxY, y);
    band.copy(low).lerp(high, t);
    return out.copy(base).lerp(band, m);
  };
}

/** Periodic ring/grain bands along `axis` (bamboo culm nodes, timber striations, coursed masonry) with zero textures. */
export function grainShader(
  ringColor: string | number | T.Color,
  period = 0.16,
  bandWidth = 0.18,
  axis: 'x' | 'y' | 'z' = 'y',
  strength = 0.55,
): VertexColorShader {
  const ring = ringColor instanceof T.Color ? ringColor.clone() : new T.Color(ringColor);
  const out = new T.Color();
  const safePeriod = Math.max(1e-3, period);
  const halfBand = Math.max(0.02, Math.min(0.49, bandWidth * 0.5));
  const s = Math.max(0, Math.min(1, strength));
  return (x, y, z, _normal, base) => {
    const coord = axis === 'x' ? x : axis === 'z' ? z : y;
    const phase = ((coord / safePeriod) % 1 + 1) % 1;
    const dist = Math.min(phase, 1 - phase);
    const t = (1 - smoothstep(halfBand * 0.4, halfBand, dist)) * s;
    return out.copy(base).lerp(ring, t);
  };
}
