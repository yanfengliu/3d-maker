import { BufferGeometry, Color, Float32BufferAttribute, Group, InterleavedBuffer, InterleavedBufferAttribute, Mesh, MeshStandardMaterial, Texture } from 'three';
import { expect, it } from 'vitest';
import { applyPalette, buildPalette } from './paint';

it('shares color slots across instances and isolates edits from other interleaved attributes', () => {
  const scene = new Group(), geometry = new BufferGeometry(), map = new Texture();
  const material = new MeshStandardMaterial({ map, vertexColors: true });
  const buffer = new InterleavedBuffer(new Float32Array([0.5, 1, 0.25, 0.8]), 4);
  const original = new InterleavedBufferAttribute(buffer, 4, 0);
  geometry.setAttribute('color', original);
  geometry.setAttribute('normal', new InterleavedBufferAttribute(buffer, 3, 0));
  scene.add(new Mesh(geometry, material), new Mesh(geometry, material));
  const palette = buildPalette(scene, new Map([[material, { materials: 0 }]]));
  const vertexId = [...palette.slots.keys()].find(id => id.startsWith('vertex-'));
  if (!vertexId) throw new Error('Missing authored color.');
  expect(palette.slots.size).toBe(2);
  const paint = { [vertexId]: '#806020' };
  applyPalette(palette, new Color('#ffffff'), {}, paint);
  expect(new Color().fromBufferAttribute(geometry.getAttribute('color'), 0).getHexString()).toBe('806020');
  expect(geometry.getAttribute('color').getW(0)).toBeCloseTo(0.8);
  expect(geometry.getAttribute('normal').getX(0)).toBe(0.5);
  expect(material.map).toBe(map);
  applyPalette(palette, new Color('#ffffff'), paint, {});
  expect(geometry.getAttribute('color').getX(0)).toBe(0.5);
});

it('keeps continuous vertex shading and gives material variants one editable base color', () => {
  const scene = new Group(), geometry = new BufferGeometry();
  const colors = new Float32BufferAttribute(Array.from({ length: 90*3 }, (_, i) => Math.floor(i/3) / 90), 3);
  geometry.setAttribute('color', colors);
  const body = new MeshStandardMaterial({ vertexColors: true, name: 'Body' }), flat = body.clone();
  scene.add(new Mesh(geometry, body), new Mesh(new BufferGeometry(), flat));
  const palette = buildPalette(scene, new Map([[body, { materials: 2 }], [flat, { materials: 2 }]]));
  expect([...palette.slots.values()]).toEqual([{ id: 'material-2', label:'Body', color:'#ffffff' }]);
  applyPalette(palette, new Color('#ffffff'), {}, { 'material-2': '#345678' });
  expect(body.color.getHexString()).toBe('345678');
  expect(flat.color.equals(body.color)).toBe(true);
  expect(geometry.getAttribute('color')).toBe(colors);
});
