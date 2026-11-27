import { BufferAttribute, Color, Mesh } from 'three';
import type { BufferGeometry, InterleavedBufferAttribute, Material, Object3D } from 'three';
import type { GLTFParser } from 'three/addons/loaders/GLTFLoader.js';

export interface PaintSlot { id: string; label: string; color: string }
type Overrides = Readonly<Record<string, string>>;
type VertexColors = BufferAttribute | InterleavedBufferAttribute;
interface VertexPalette {
  geometry: BufferGeometry;
  source: VertexColors;
  regions: { id: string; indices: number[] }[];
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

export function buildPalette(scene: Object3D, associations: GLTFParser['associations']): ImportPalette {
  const materials: MaterialColor[] = [], vertices: VertexPalette[] = [];
  const materialSlots = new Map<string, PaintSlot>(), slots = new Map<string, PaintSlot>();
  const seenMaterials = new Set<Material>(), seenGeometry = new Set<BufferGeometry>();
  scene.traverse(node => {
    if (!(node instanceof Mesh)) return;
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
    if (!/^(?:material-(?:default|\d+)|vertex-\d+-[\da-f]{6})$/.test(id) ||
        typeof hex !== 'string' || !/^#[\da-f]{6}$/i.test(hex)) throw new Error('Invalid paint slot or color.');
    result[id] = hex.toLowerCase();
  }
  return Object.keys(result).length ? result : undefined;
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
    for (const { id, indices } of group.regions) {
      const hex = next[id];
      if (hex === previous[id]) continue;
      const target = editableColors(group);
      if (hex) color.set(hex);
      for (const i of indices) {
        if (hex) target.setXYZ(i, color.r, color.g, color.b);
        else target.setXYZ(i, group.source.getX(i), group.source.getY(i), group.source.getZ(i));
      }
      target.needsUpdate = true;
    }
  }
}
