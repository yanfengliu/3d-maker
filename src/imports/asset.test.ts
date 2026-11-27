import { AnimationMixer, Bone, BufferGeometry, Color, LoopOnce, MeshStandardMaterial, SkinnedMesh } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyImportEdits, listPaintSlots, openLocalGlb, openPolyforkGlb, polyforkGlbUrl, reconcileSavedEdits, validateEdits } from './asset';

// A skinned triangle with a one-second bone rotation. The binary fixture exercises the loader itself.
function modelFile(extra: Record<string, unknown> = {}, withColors = false): File {
  const arrays = [
    new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), new Uint8Array(12),
    new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]), new Float32Array([0, 1]),
    new Float32Array([0, 0, 0, 1, 0, 0, 1, 0]),
  ];
  if (withColors) arrays.push(new Uint8Array([0,255,0,32, 0,0,255,64, 0,255,0,96]));
  let length = 0;
  const bufferViews = arrays.map(array => {
    const view = { buffer: 0, byteOffset: length, byteLength: array.byteLength };
    length += array.byteLength;
    return view;
  });
  const document = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ children: [1, 2] }, { name: 'Pivot' }, { name: 'Shell', mesh: 0, skin: 0 }],
    skins: [{ joints: [1] }], meshes: [{ primitives: [{ attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2, ...(withColors ? { COLOR_0: 5 } : {}) }, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.8, 0.3, 0.4, 1] } }],
    animations: [{ name: 'Tilt', samplers: [{ input: 3, output: 4 }], channels: [{ sampler: 0, target: { node: 1, path: 'rotation' } }] }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] },
      { bufferView: 1, componentType: 5121, count: 3, type: 'VEC4' },
      { bufferView: 2, componentType: 5126, count: 3, type: 'VEC4' },
      { bufferView: 3, componentType: 5126, count: 2, type: 'SCALAR', min: [0], max: [1] },
      { bufferView: 4, componentType: 5126, count: 2, type: 'VEC4' },
      ...(withColors ? [{ bufferView: 5, componentType: 5121, normalized: true, count: 3, type: 'VEC4' }] : []),
    ],
    buffers: [{ byteLength: length }], bufferViews, ...extra,
  };
  const encoded = new TextEncoder().encode(JSON.stringify(document));
  const paddedLength = Math.ceil(encoded.length / 4) * 4;
  const glb = new ArrayBuffer(28 + paddedLength + length);
  const words = new DataView(glb);
  [0x46546c67, 2, glb.byteLength, paddedLength, 0x4e4f534a].forEach((value, i) => { words.setUint32(4 * i, value, true); });
  new Uint8Array(glb, 20, paddedLength).fill(32).set(encoded);
  words.setUint32(20 + paddedLength, length, true);
  words.setUint32(24 + paddedLength, 0x004e4942, true);
  let offset = 28 + paddedLength;
  for (const array of arrays) {
    new Uint8Array(glb, offset, array.byteLength).set(new Uint8Array(array.buffer));
    offset += array.byteLength;
  }
  return new File([glb], 'Test Pilot.GLB');
}

afterEach(() => { vi.restoreAllMocks(); });

describe('imported GLB assets', () => {
  it('retains a skin, clip and material while edits change the outer transform and tint', async () => {
    const file = modelFile({ asset: { version: '2.0', copyright: 'Fixture author' } });
    const asset = await openLocalGlb(file);
    expect(asset.originalFile).toBe(file);
    expect(asset.edits.name).toBe('Test Pilot');
    expect(asset.group.userData.sourceAsset).toMatchObject({ copyright: 'Fixture author' });
    const mesh = asset.group.getObjectByName('Shell');
    const bone = asset.group.getObjectByName('Pivot');
    if (!(mesh instanceof SkinnedMesh) || !(bone instanceof Bone)) throw new Error('Fixture rig missing.');
    expect(mesh.skeleton.bones).toContain(bone);
    const material: unknown = mesh.material;
    if (!(material instanceof MeshStandardMaterial)) throw new Error('Fixture material missing.');
    const base = material.color.clone();
    const next = { ...asset.edits, tint: '#ff0000', scale: 1.4, proportion: 0.8 };
    applyImportEdits(asset, next);
    applyImportEdits(asset, next);
    expect(material.color.toArray()).toEqual([base.r, 0, 0]);
    expect(asset.group.scale.y).toBeCloseTo(1.12);
    expect(mesh.scale.toArray()).toEqual([1, 1, 1]);
    const clip = asset.group.animations[0];
    if (!clip) throw new Error('Fixture clip missing.');
    expect(clip.name).toBe('Tilt');
    const mixer = new AnimationMixer(asset.group);
    mixer.clipAction(clip).setLoop(LoopOnce, 1).play();
    mixer.update(0.5);
    expect(bone.quaternion.z).toBeCloseTo(Math.SQRT1_2);
    applyImportEdits(asset, { ...next, tint: '#ffffff' });
    expect(material.color.equals(base)).toBe(true);
    expect(() => { applyImportEdits(asset, { ...next, scale: NaN }); }).toThrow(/scale/i);
    expect(material.color.equals(base)).toBe(true);
  });

  it('opens the official free binary by reference, with no persistent source blob', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(await modelFile().arrayBuffer()));
    const asset = await openPolyforkGlb('test-pilot', 'Pilot');
    expect(fetcher).toHaveBeenCalledWith('https://polyfork.dev/cdn/test-pilot.glb', expect.objectContaining({ credentials: 'omit' }));
    expect(asset.source).toEqual({ kind: 'polyfork', assetId: 'test-pilot', title: 'Pilot' });
    expect(asset.group.userData.attribution).toMatchObject({ creator: 'Polyfork', license: 'CC BY 4.0', url: 'https://polyfork.dev/asset/test-pilot' });
    expect(asset.originalFile).toBeNull();
    expect(() => polyforkGlbUrl('../other')).toThrow();
  });

  it('repaints and restores individual vertex zones and materials on an animated GLB', async () => {
    const file = modelFile({}, true);
    const asset = await openLocalGlb(file);
    const mesh = asset.group.getObjectByName('Shell');
    if (!(mesh instanceof SkinnedMesh) || !(mesh.geometry instanceof BufferGeometry) ||
        !(mesh.material instanceof MeshStandardMaterial)) throw new Error('Missing shell.');
    const slots = listPaintSlots(asset);
    const green = slots.find(slot => slot.color === '#00ff00'), mat = slots.find(slot => slot.label === 'Material 1');
    if (!green || !mat) throw new Error('Expected a garment zone and a base material.');
    expect(slots.map(slot => slot.color)).toEqual(['#00ff00', '#0000ff', '#' + mesh.material.color.getHexString()]);
    const baseColor = mesh.material.color.clone();
    const geometry = mesh.geometry as BufferGeometry;
    const base = asset.edits, source = geometry.getAttribute('color'), weights = geometry.getAttribute('skinWeight');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(await file.arrayBuffer()));
    const reopened = await openPolyforkGlb('test-pilot', 'Pilot');
    const paint = { [green.id]: '#EEDDAA', [mat.id]: '#eebbaa' };
    const edits = { ...base, tint: '#808080', paint };
    for (const target of [asset, reopened]) {
      applyImportEdits(target, edits);
      expect(listPaintSlots(target).find(slot => slot.id === green.id)).toMatchObject({color:'#eeddaa',originalColor:'#00ff00'});
      expect(target.edits.paint?.[green.id]).toBe('#eeddaa');
    }
    expect(reopened.group.userData.attribution).toMatchObject({ changes: expect.stringContaining('Repainted 2') as unknown });
    const rgb = (i: number) => new Color().fromBufferAttribute(geometry.getAttribute('color'), i);
    expect(rgb(0).getHexString()).toBe('eeddaa');
    expect(rgb(2).getHexString()).toBe('eeddaa');
    expect(rgb(1).getHexString()).toBe('0000ff');
    expect(geometry.getAttribute('color').getW(0)).toBeCloseTo(32 / 255);
    expect(source.getX(0)).toBe(0);
    expect(geometry.getAttribute('skinWeight')).toBe(weights);
    expect(mesh.skeleton.bones[0]?.name).toBe('Pivot');
    expect(mesh.material.color.toArray()).toEqual(new Color('#eebbaa').multiply(new Color('#808080')).toArray());
    expect(() => { applyImportEdits(asset, { ...edits, paint: {'material-923': '#ddeeff'} }); }).toThrow(/no paint slot/);
    expect(rgb(0).getHexString()).toBe('eeddaa');
    applyImportEdits(asset, { ...base, paint: {} });
    expect(rgb(0).getHexString()).toBe('00ff00');
    expect(mesh.material.color.equals(baseColor)).toBe(true);
    expect(asset.edits).toEqual(base);
    expect(() => validateEdits({ ...base, paint: { [green.id]: 'green' } })).toThrow(/paint/);
    const reconciled = reconcileSavedEdits(asset, { ...edits, paint: { [green.id]: '#123456', 'vertex-99-abcdef': '#ff0000' } });
    expect(reconciled.dropped).toEqual(['vertex-99-abcdef']);
    expect(reconciled.edits.paint).toEqual({ [green.id]: '#123456' });
    applyImportEdits(asset, reconciled.edits);
    expect(asset.edits.paint).toEqual({ [green.id]: '#123456' });
  });

  it('retries transient 429 and 503 responses when opening a PolyFork GLB', async () => {
    vi.useFakeTimers();
    const bytes = await modelFile().arrayBuffer();
    const fetcher = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(bytes));
    const pending = openPolyforkGlb('retry-shop', 'Village Shopfront', undefined, 'building');
    await vi.advanceTimersByTimeAsync(3500);
    const asset = await pending;
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(asset.source).toEqual({ kind: 'polyfork', assetId: 'retry-shop', title: 'Village Shopfront', category: 'building' });
    vi.useRealTimers();
  });

  it('rejects non-binary files, assets with external resources, and empty scenes', async () => {
    await expect(openLocalGlb(new File(['{}'], 'scene.glb'))).rejects.toThrow(/binary glTF/);
    await expect(openLocalGlb(modelFile({ images: [{ uri: 'texture.png' }] }))).rejects.toThrow(/embed/i);
    await expect(openLocalGlb(modelFile({ scenes: [{}] }))).rejects.toThrow(/no mesh/i);
  });
});
