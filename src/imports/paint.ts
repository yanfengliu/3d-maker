import { BufferAttribute, Color, Mesh, SRGBColorSpace } from 'three';
import type { BufferGeometry, InterleavedBufferAttribute, Material, Object3D } from 'three';
import type { GLTFParser } from 'three/addons/loaders/GLTFLoader.js';
import type { ColorZoneSpec, ColorwayPresetSpec } from '../capabilities/schema';

export interface PaintSlot {
  id: string;
  label: string;
  color: string;
  zoneName?: string;
}
type Overrides = Readonly<Record<string, string>>;
type VertexColors = BufferAttribute | InterleavedBufferAttribute;
interface VertexRegion {
  id: string;
  indices: number[];
  baseLuma?: number;
}
interface VertexPalette {
  geometry: BufferGeometry;
  source: VertexColors;
  regions: VertexRegion[];
  editable?: BufferAttribute;
}
interface MaterialColor { id: string; color: Color; original: Color }
export interface ImportPalette {
  slots: Map<string, PaintSlot>;
  materials: MaterialColor[];
  vertices: VertexPalette[];
}

// A continuous gradient remains editable through its material. Discrete authored
// palettes (including PolyFork's character garments) get individual color controls.
const maxColorsPerPrimitive = 32;
const maxVertexSlots = 256;

function readablePart(mesh: Mesh, index: number): string {
  const generated = /^mesh(?:_\d+)*$/i;
  const node = mesh.name && !generated.test(mesh.name) ? mesh : mesh.parent;
  const name = node?.name.replace(/^attach[-_]/i, '').replace(/[-_]mesh$/i, '').replace(/[-_]+/g, ' ').trim();
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Mesh ' + String(index + 1);
}

function vertexRegions(source: VertexColors) {
  const regions = new Map<string, number[]>();
  const color = new Color();
  for (let i = 0; i < source.count; i++) {
    const hex = color.setRGB(source.getX(i), source.getY(i), source.getZ(i)).getHexString();
    let indices = regions.get(hex);
    if (!indices) {
      if (regions.size >= maxColorsPerPrimitive) return null;
      indices = [];
      regions.set(hex, indices);
    }
    indices.push(i);
  }
  return regions;
}

function luma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function clusterByZones(source: VertexColors, zones: readonly ColorZoneSpec[]) {
  const targets = zones.map(zone => {
    const linear = new Color(zone.color);
    const srgb = { r: 0, g: 0, b: 0 };
    linear.getRGB(srgb, SRGBColorSpace);
    return { zone, linear, srgb, baseLuma: luma(linear.r, linear.g, linear.b) };
  });
  const grouped = new Map<string, { zone: ColorZoneSpec; baseLuma: number; indices: number[] }>();
  const sample = new Color();
  const sampleSrgb = { r: 0, g: 0, b: 0 };
  for (let i = 0; i < source.count; i++) {
    const r = source.getX(i), g = source.getY(i), b = source.getZ(i);
    sample.setRGB(r, g, b);
    sample.getRGB(sampleSrgb, SRGBColorSpace);
    let best = targets[0];
    let bestDist = Infinity;
    for (const candidate of targets) {
      const dr = sampleSrgb.r - candidate.srgb.r;
      const dg = sampleSrgb.g - candidate.srgb.g;
      const db = sampleSrgb.b - candidate.srgb.b;
      const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
        if (dist < 1e-5) break;
      }
    }
    if (!best) continue;
    let bucket = grouped.get(best.zone.name);
    if (!bucket) {
      bucket = { zone: best.zone, baseLuma: best.baseLuma, indices: [] };
      grouped.set(best.zone.name, bucket);
    }
    bucket.indices.push(i);
  }
  return grouped;
}

export function buildPalette(
  scene: Object3D,
  associations: GLTFParser['associations'],
  colorZones?: readonly ColorZoneSpec[],
): ImportPalette {
  const materials: MaterialColor[] = [], vertices: VertexPalette[] = [];
  const materialSlots = new Map<string, PaintSlot>(), slots = new Map<string, PaintSlot>();
  const seenMaterials = new Set<Material>(), seenGeometry = new Set<BufferGeometry>();
  const useZones = Boolean(colorZones?.length);

  scene.traverse(node => {
    if (node.userData.studioOverlay || !(node instanceof Mesh)) return;
    const mesh = node as Mesh;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (seenMaterials.has(material) || !('color' in material) || !(material.color instanceof Color)) continue;
      seenMaterials.add(material);
      const index = associations.get(material)?.materials;
      const id = 'material-' + (index === undefined ? 'default' : String(index));
      materials.push({ id, color: material.color, original: material.color.clone() });
      if (!materialSlots.has(id)) materialSlots.set(id, {
        id, label: material.name || (index === undefined ? 'Default material' : 'Material ' + String(index + 1)),
        color: '#' + material.color.getHexString(),
      });
    }
    const geometry = mesh.geometry;
    if (seenGeometry.has(geometry)) return;
    const index = seenGeometry.size;
    seenGeometry.add(geometry);
    if (!geometry.hasAttribute('color') || slots.size >= maxVertexSlots) return;
    const source = geometry.getAttribute('color');
    if (source.itemSize < 3) return;

    if (useZones && colorZones) {
      const clustered = clusterByZones(source, colorZones);
      const regions: VertexRegion[] = [];
      for (const { zone, baseLuma, indices } of clustered.values()) {
        const id = 'zone-' + zone.name;
        if (!slots.has(id)) slots.set(id, { id, label: zone.label, color: zone.color, zoneName: zone.name });
        regions.push({ id, indices, baseLuma });
      }
      if (regions.length) vertices.push({ geometry, source, regions });
      return;
    }

    const groups = vertexRegions(source);
    if (!groups || groups.size + slots.size > maxVertexSlots) return;
    const label = readablePart(mesh, index);
    const regions = [...groups].map(([hex, indices], i) => {
      const id = 'vertex-' + String(index) + '-' + hex;
      slots.set(id, { id, color: '#' + hex, label: groups.size === 1 ? label : label + ' · ' + String(i + 1) });
      return { id, indices };
    });
    vertices.push({ geometry, source, regions });
  });
  for (const [id, slot] of materialSlots) slots.set(id, slot);
  return { slots, materials, vertices };
}

export function validatePaint(value: unknown): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Supply a paint color map.');
  const result: Record<string, string> = {};
  for (const [id, hex] of Object.entries(value)) {
    if (!/^(?:material-(?:default|\d+)|vertex-\d+-[\da-f]{6}|zone-[a-z0-9][a-z0-9_-]{0,63})$/i.test(id) ||
        typeof hex !== 'string' || !/^#[\da-f]{6}$/i.test(hex)) throw new Error('Invalid paint slot or color.');
    result[id] = hex.toLowerCase();
  }
  return Object.keys(result).length ? result : undefined;
}

/** Map a curated colorway preset onto the active model's paint slots. */
export function colorwayPaintPatch(
  palette: ImportPalette,
  preset: ColorwayPresetSpec,
  current: Overrides = {},
): Record<string, string> {
  const next = new Map(Object.entries(current));
  for (const [zoneName, hex] of Object.entries(preset.colors)) {
    const slotId = 'zone-' + zoneName;
    const slot = palette.slots.get(slotId);
    if (!slot) continue;
    if (hex.toLowerCase() === slot.color.toLowerCase()) next.delete(slotId);
    else next.set(slotId, hex.toLowerCase());
  }
  return Object.fromEntries(next);
}

/** Resolve the paint slot ID corresponding to a clicked triangle on a 3D mesh. */
export function pickPaintSlot(
  palette: ImportPalette,
  mesh: Mesh,
  faceIndex: number,
  materialIndex: number,
): string | null {
  const geometry = mesh.geometry;
  const group = palette.vertices.find(entry => entry.geometry === geometry);
  if (group && faceIndex >= 0) {
    const index = geometry.getIndex();
    const vertexIndex = index ? index.getX(faceIndex * 3) : faceIndex * 3;
    for (const region of group.regions) {
      if (region.indices.includes(vertexIndex)) return region.id;
    }
  }
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const target = mats[materialIndex] ?? mats[0];
  if (target && 'color' in target && target.color instanceof Color) {
    const match = palette.materials.find(entry => entry.color === target.color);
    if (match) return match.id;
  }
  return null;
}

// Copy just COLOR_0 on the first edit. Interleaved buffers and shared accessors
// can also back normals or weights. RGB edits must never write into that storage.
function editableColors(group: VertexPalette): BufferAttribute {
  if (group.editable) return group.editable;
  const { source } = group;
  const copy = new BufferAttribute(new Float32Array(source.count * source.itemSize), source.itemSize);
  for (let i = 0; i < source.count; i++) {
    copy.setXYZ(i, source.getX(i), source.getY(i), source.getZ(i));
    if (source.itemSize === 4) copy.setW(i, source.getW(i));
  }
  group.geometry.setAttribute('color', copy);
  group.editable = copy;
  return copy;
}

export function applyPalette(palette: ImportPalette, tint: Color, previous: Overrides = {}, next: Overrides = {}) {
  for (const id of Object.keys(next)) {
    if (!palette.slots.has(id)) throw new Error('This model has no paint slot named ' + id + '.');
  }
  for (const { id, color, original } of palette.materials) {
    const hex = next[id];
    if (hex) color.set(hex);
    else color.copy(original);
    color.multiply(tint);
  }
  const color = new Color();
  for (const group of palette.vertices) {
    for (const { id, indices, baseLuma } of group.regions) {
      const hex = next[id];
      if (hex === previous[id]) continue;
      const target = editableColors(group);
      if (hex) color.set(hex);
      for (const i of indices) {
        if (hex) {
          if (baseLuma !== undefined) {
            const origLuma = luma(group.source.getX(i), group.source.getY(i), group.source.getZ(i));
            const ratio = Math.min(1.28, Math.max(0.72, origLuma / Math.max(baseLuma, 0.02)));
            target.setXYZ(i, clamp01(color.r * ratio), clamp01(color.g * ratio), clamp01(color.b * ratio));
          } else {
            target.setXYZ(i, color.r, color.g, color.b);
          }
        } else {
          target.setXYZ(i, group.source.getX(i), group.source.getY(i), group.source.getZ(i));
        }
      }
      target.needsUpdate = true;
    }
  }
}
