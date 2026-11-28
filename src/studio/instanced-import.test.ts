import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readCapabilities, writeCapabilities } from '../capabilities/schema';
import { composeAsset, validateComposite } from '../capabilities/compose';
import { applyImportEdits, openStoredFile } from '../imports/asset';
import { cloneForExport } from './export';
import { fastBounds } from './framing';
import { measureModelBounds } from './stage-env';

interface TraceNode {
  name: string;
  children?: TraceNode[];
  bbox: number[][] | null;
  vertices?: number;
  triangles?: number;
}

const { inspectGlb } = createRequire(import.meta.url)('../../scripts/inspect-glb.mjs') as {
  inspectGlb: (encoded: string) => Promise<{ metrics: object; trace: { root: TraceNode } }>;
};

afterEach(() => { vi.unstubAllGlobals(); });

beforeEach(() => {
  vi.stubGlobal('FileReader', class {
    result: ArrayBuffer | null = null;
    onloadend: (() => void) | null = null;
    readAsArrayBuffer(blob: Blob) {
      void blob.arrayBuffer().then(bytes => { this.result = bytes; this.onloadend?.(); });
    }
  });
});

async function binary(root: T.Object3D): Promise<ArrayBuffer> {
  return await new GLTFExporter().parseAsync(root, { binary: true }) as ArrayBuffer;
}

it('frames, measures and exports an external GLB with nested, rotated GPU instances', async () => {
  const source = new T.Group();
  source.position.set(100, -12, 20);
  source.rotation.y = Math.PI / 2;
  const columns = new T.InstancedMesh(new T.BoxGeometry(2, 4, 2), new T.MeshStandardMaterial(), 2);
  columns.name = 'Structural columns';
  columns.setMatrixAt(0, new T.Matrix4().makeTranslation(10, 14, -5));
  const secondColumn = new T.Object3D();
  secondColumn.position.set(-6, 19, 4);
  secondColumn.rotation.z = Math.PI / 2;
  secondColumn.scale.set(1, 2, 1);
  secondColumn.updateMatrix();
  columns.setMatrixAt(1, secondColumn.matrix);
  source.add(columns);
  let bytes = await binary(source);

  for (let pass = 0; pass < 2; pass++) {
    const imported = await openStoredFile(new Blob([bytes]), 'columns.glb');
    expect(imported.capabilities.dimensions).toEqual({ sizeM: { x: 11, y: 8, z: 21 }, originY: 0 });
    const expected = new T.Box3(new T.Vector3(94, 0, 9), new T.Vector3(105, 8, 30));
    for (const box of [measureModelBounds(imported.group), fastBounds(imported.group)]) {
      expect(box.min.distanceTo(expected.min)).toBeLessThan(1e-5);
      expect(box.max.distanceTo(expected.max)).toBeLessThan(1e-5);
    }
    const { metrics, trace } = await inspectGlb(Buffer.from(bytes).toString('base64'));
    expect(metrics).toMatchObject({ triangles: 24, vertices: 48, meshes: 1, size: [11, 8, 21], minY: 0, connectedComponents: 2 });
    let leaf = trace.root;
    while (leaf.children?.[0]) leaf = leaf.children[0];
    expect(leaf).toMatchObject({ bbox: [[94, 0, 9], [105, 8, 30]], vertices: 48, triangles: 24 });
    if (pass === 0) {
      const snapshot = cloneForExport(imported.group, {}, imported.controller);
      try {
        bytes = await binary(snapshot.root);
      } finally {
        snapshot.dispose();
      }
    }
    imported.controller.dispose();
  }
});

it('excludes unreferenced positions from instanced geometry bounds and component overlap', async () => {
  const geom = new T.BufferGeometry();
  geom.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 1000, 0, 0], 3));
  geom.setIndex([0, 1, 2]);
  const mesh = new T.InstancedMesh(geom, new T.MeshStandardMaterial(), 2);
  mesh.setMatrixAt(1, new T.Matrix4().makeTranslation(10, 0, 0));
  const bytes = await binary(mesh);
  const imported = await openStoredFile(new Blob([bytes]), 'triangles.glb');
  expect(imported.capabilities.dimensions?.sizeM).toEqual({ x: 11, y: 1, z: 0 });
  for (const box of [measureModelBounds(imported.group), fastBounds(imported.group)]) {
    expect(box.max.toArray()).toEqual([11, 1, 0]);
  }
  const { metrics } = await inspectGlb(Buffer.from(bytes).toString('base64'));
  expect(metrics).toMatchObject({ triangles: 2, vertices: 6, size: [11, 1, 0], connectedComponents: 2 });
  imported.controller.dispose();
});

it('repairs the prototype dimensions emitted by a former local import and preserves authored dimensions', async () => {
  const source = new T.Group();
  const columns = new T.InstancedMesh(new T.BoxGeometry(2, 2, 2), new T.MeshStandardMaterial(), 2);
  columns.setMatrixAt(1, new T.Matrix4().makeTranslation(20, 0, 0));
  source.add(columns);
  const legacy = { sizeM: { x: 2, y: 2, z: 2 }, originY: -1 };
  const imported = await openStoredFile(new Blob([await binary(source)]), 'columns.glb');
  const manifest = { ...imported.capabilities, dimensions: legacy };
  const snapshot = cloneForExport(imported.group, {}, imported.controller);
  writeCapabilities(snapshot.root, manifest);
  const repaired = await openStoredFile(new Blob([await binary(snapshot.root)]), 'saved.glb');
  expect(repaired.capabilities.dimensions).toEqual({ sizeM: { x: 22, y: 2, z: 2 }, originY: -1 });
  snapshot.dispose();
  imported.controller.dispose();
  repaired.controller.dispose();

  // An authored local declaration can intentionally match the prototype exactly.
  writeCapabilities(source, manifest);
  const authored = await openStoredFile(new Blob([await binary(source)]), 'hand-authored.glb');
  expect(authored.capabilities.dimensions).toEqual(legacy);
  const saved = cloneForExport(authored.group, {}, authored.controller);
  const reopened = await openStoredFile(new Blob([await binary(saved.root)]), 'hand-authored-roundtrip.glb');
  expect(reopened.capabilities.dimensions).toEqual(legacy);
  saved.dispose();
  authored.controller.dispose();
  reopened.controller.dispose();
});

it('inspects 16,000 overlapping placements as one connected component', async () => {
  const count = 16_000;
  const mesh = new T.InstancedMesh(new T.PlaneGeometry(), new T.MeshStandardMaterial(), count);
  const transform = new T.Matrix4();
  for (let i = 0; i < count; i++) mesh.setMatrixAt(i, transform.makeTranslation(i / 20_000, 0, 0));
  const { metrics } = await inspectGlb(Buffer.from(await binary(mesh)).toString('base64'));
  expect(metrics).toMatchObject({ triangles: 32_000, vertices: 64_000, connectedComponents: 1 });
});

it('seats the registered roof on a transformed SDK surface and checks its actual steel overhang', async () => {
  vi.stubGlobal('self', globalThis);
  vi.stubGlobal('createImageBitmap', () => Promise.resolve({ width: 1, height: 1, close() {} }));
  const file = await readFile(new URL('../../public/datasets/site-assets/sfo-international-roof/v1.glb', import.meta.url));
  const roof = await openStoredFile(new Blob([new Uint8Array(file)]), 'roof.glb');
  const host = new T.Group();
  writeCapabilities(host, {
    version: 1, name: 'Podium', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
    surfaces: [{ name: 'Deck', label: 'Deck', at: [0, 3, 0], normal: [0, 1, 0], size: [262.02, 65.10] }],
  });
  const assembly = composeAsset({
    name: 'International hall',
    parts: [
      { id: 'podium', object: host, mount: { at: [40, 12, -3], rotation: [0, Math.PI / 2, 0] } },
      { id: 'roof', object: roof.group, mount: { parent: 'podium', surface: 'Deck', coupling: 'surface' } },
    ],
  });
  expect(assembly.getObjectByName('Slot_roof')?.position.y).toBeCloseTo(3, 4);
  expect(readCapabilities(assembly)?.dimensions).toMatchObject({ sizeM: { x: 65.317, y: 22.18, z: 262.13 }, originY: 15 });
  expect(validateComposite(assembly).surfaceIssues.map(i => i.kind)).toEqual(['footprint-overflow']);
  roof.controller.dispose();
});

it('recovers the placed height after two legacy nonuniform scaled saves with millimetre rounding', async () => {
  const raw = new T.Group();
  const skin = new T.Mesh(new T.BoxGeometry(1, 22, 1), new T.MeshStandardMaterial());
  skin.position.y = 11;
  const steel = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial(), 1);
  steel.position.y = -19;
  steel.setMatrixAt(0, new T.Matrix4().makeTranslation(0, 40.68, 0));
  raw.add(skin, steel);
  let bytes = await binary(raw);
  let old = { sizeM: { x: 1, y: 41.5, z: 1 }, originY: -19.5 };
  for (const [scale, proportion] of [[1.1, 1.15], [1.5, 1.5]] as const) {
    const imported = await openStoredFile(new Blob([bytes]), 'legacy-roof.glb');
    // Recreate what the former importer knew, then use the real edits and save paths.
    imported.baseDimensions = old;
    applyImportEdits(imported, { ...imported.edits, scale, proportion });
    const saved = imported.capabilities.dimensions;
    if (!saved) throw new Error('Missing scaled dimensions');
    old = saved;
    const snapshot = cloneForExport(imported.group, {}, imported.controller);
    bytes = await binary(snapshot.root);
    snapshot.dispose();
    imported.controller.dispose();
  }
  expect(old.sizeM.y).toBe(118.121);
  const repaired = await openStoredFile(new Blob([bytes]), 'legacy-roof.glb');
  expect(repaired.capabilities.dimensions?.sizeM.y).toBe(63.13);
  expect(repaired.capabilities.dimensions?.originY).toBe(0);
  repaired.controller.dispose();
});
