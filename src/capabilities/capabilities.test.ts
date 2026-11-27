import * as T from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalog } from '../data/recipe';
import { clearPolyforkBackoff } from '../data/polyfork';
import { buildPolyforkCapabilities, clearPolyforkDetailCache, fetchPolyforkDetail } from '../data/polyfork-detail';
import { applyImportEdits, listPaintSlots, openLocalGlb, openPolyforkGlb, reconcileSavedEdits } from '../imports/asset';
import { clearPolyforkGlbCache } from '../imports/glb-cache';
import { colorwayPaintPatch, pickPaintSlot } from '../imports/paint';
import { buildModel } from '../models';
import { cloneForExport } from '../studio/export';
import { createAssetController, inspectAsset, synthesizeRigClips } from './runtime';
import { parseCapabilities, readCapabilities, writeCapabilities, type AssetCapabilities } from './schema';

function linearByte(srgbByte: number): number {
  const c = srgbByte / 255;
  const lin = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return Math.round(lin * 255);
}

function shopfrontGlb(): ArrayBuffer {
  // Build a valid GLB with a tone-varied body (>32 shades), a hinged door, a detachable planter, and a glowing pane.
  const bodyVerts: number[] = [];
  const bodyColors: number[] = [];
  for (let i = 0; i < 40; i++) {
    const x = -1 + (i % 8) * 0.25, y = Math.floor(i / 8) * 0.4;
    bodyVerts.push(x, y, 0, x + 0.2, y, 0, x + 0.1, y + 0.3, 0);
    // 40 distinct limewash shades (>32 threshold!) plus pane vertices at the end.
    const shade = 215 + (i % 40);
    for (let k = 0; k < 3; k++) bodyColors.push(linearByte(shade), linearByte(shade - 2), linearByte(shade - 6), 255);
  }
  // Add one pane triangle matching sRGB #34322d (52, 50, 45) encoded in linear glTF COLOR_0.
  bodyVerts.push(0.2, 0.4, 0.05, 0.8, 0.4, 0.05, 0.5, 1.0, 0.05);
  for (let k = 0; k < 3; k++) bodyColors.push(linearByte(52), linearByte(50), linearByte(45), 255);

  const doorVerts = new Float32Array([0, 0, 0, 0.6, 0, 0, 0.6, 1.8, 0]);
  const doorColors = new Uint8Array([linearByte(70), linearByte(120), linearByte(168), 255, linearByte(70), linearByte(120), linearByte(168), 255, linearByte(70), linearByte(120), linearByte(168), 255]); // #4678a8
  const planterVerts = new Float32Array([-0.2, 0, 0, 0.2, 0, 0, 0, 0.6, 0]);
  const planterColors = new Uint8Array([linearByte(192), linearByte(70), linearByte(62), 255, linearByte(192), linearByte(70), linearByte(62), 255, linearByte(192), linearByte(70), linearByte(62), 255]); // #c0463e

  const arrays = [
    new Float32Array(bodyVerts), new Uint8Array(bodyColors),
    doorVerts, doorColors,
    planterVerts, planterColors,
  ];
  let byteLength = 0;
  const bufferViews = arrays.map(arr => {
    const view = { buffer: 0, byteOffset: byteLength, byteLength: arr.byteLength };
    byteLength += arr.byteLength;
    return view;
  });
  const doc = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [
      {
        name: 'village-shopfront',
        extras: { decals: [{ name: 'fascia', at: [0.5, 1.9, 0.1], normal: [0, 0, 1], up: [0, 1, 0], size: [1.3, 0.22], describe: 'Shop fascia sign' }] },
        children: [1, 2, 4],
      },
      { name: 'shop-body', mesh: 0 },
      { name: 'door', translation: [-0.8, 0, 0.1], children: [3] },
      { name: 'door-leaf', mesh: 1 },
      { name: 'planter', translation: [-1.2, 0, 0.2], children: [5] },
      { name: 'planter-mesh', mesh: 2 },
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0, COLOR_0: 1 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 2, COLOR_0: 3 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 4, COLOR_0: 5 }, material: 0 }] },
    ],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: bodyVerts.length / 3, type: 'VEC3', min: [-1, 0, 0], max: [1, 2, 0.1] },
      { bufferView: 1, componentType: 5121, normalized: true, count: bodyVerts.length / 3, type: 'VEC4' },
      { bufferView: 2, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [0.6, 1.8, 0] },
      { bufferView: 3, componentType: 5121, normalized: true, count: 3, type: 'VEC4' },
      { bufferView: 4, componentType: 5126, count: 3, type: 'VEC3', min: [-0.2, 0, 0], max: [0.2, 0.6, 0] },
      { bufferView: 5, componentType: 5121, normalized: true, count: 3, type: 'VEC4' },
    ],
    buffers: [{ byteLength }], bufferViews,
  };
  const json = new TextEncoder().encode(JSON.stringify(doc));
  const padded = Math.ceil(json.length / 4) * 4;
  const glb = new ArrayBuffer(28 + padded + byteLength);
  const dv = new DataView(glb);
  [0x46546c67, 2, glb.byteLength, padded, 0x4e4f534a].forEach((v, i) => { dv.setUint32(i * 4, v, true); });
  new Uint8Array(glb, 20, padded).fill(32).set(json);
  dv.setUint32(20 + padded, byteLength, true);
  dv.setUint32(24 + padded, 0x004e4942, true);
  let off = 28 + padded;
  for (const arr of arrays) {
    new Uint8Array(glb, off, arr.byteLength).set(new Uint8Array(arr.buffer));
    off += arr.byteLength;
  }
  return glb;
}

const shopDetailJson = {
  id: 'village-shopfront-d3088e',
  title: 'Village Shopfront',
  description: 'A limewashed shopfront cell.',
  kit: 'mediterranean-island-village-4ac936',
  size_m: { x: 4, y: 3, z: 4.39 },
  origin_y: 0,
  origin: 'ground level (minY = 0)',
  physics: { body: 'static', mass_kg: 75000, material: 'stone' },
  rigged_parts: {
    door: { axis: 'y', range: [0, 80], describe: 'shop door, hinged on its left edge, swings into the shop' },
    missingNode: { axis: 'x', range: [0, 45] },
  },
  detachable_parts: ['planter', 'nonexistent'],
  night: {
    pane: { color: '#ffc46b', intensity: 0.8, albedo: '#34322d', findable: true, describe: 'Warm amber window panes' },
  },
  params_url: 'https://polyfork.dev/cdn/village-shopfront-d3088e-params.json',
};

const shopParamsJson = {
  params: {
    limewash: { type: 'color', default: '#eceae3', label: 'Limewash' },
    paint: { type: 'color', default: '#4678a8', label: 'Joinery paint' },
    pane: { type: 'color', default: '#34322d', label: 'Lit glass' },
    pot: { type: 'color', default: '#c0463e', label: 'Pot' },
    planter: { type: 'toggle', default: true, describe: 'Terracotta pot with cactus' },
  },
  presets: {
    'aegean-blue': { paint: '#4678a8' },
    'harbour-green': { paint: '#47582c' },
  },
};

afterEach(() => {
  clearPolyforkDetailCache();
  clearPolyforkBackoff();
  clearPolyforkGlbCache();
  vi.restoreAllMocks();
});

describe('self-describing asset capabilities and runtime controller', () => {
  it('attaches discoverable rigged part metadata to procedural originals and drives CaseLid', () => {
    const cargo = catalog.find(row => row.id === 'cargo-pod');
    if (!cargo) throw new Error('Missing cargo-pod template.');
    const group = buildModel(cargo.recipe);
    const caps = inspectAsset(group);
    expect(caps.riggedParts.map(p => p.name)).toEqual(['CaseLid']);
    expect(caps.dimensions?.sizeM.x).toBeGreaterThan(1);
    const ctrl = createAssetController(group);
    const lid = group.getObjectByName('CaseLid');
    expect(lid).toBeDefined();
    expect(ctrl.openPart('CaseLid')).toBe(-72);
    expect(lid?.rotation.x).toBeCloseTo(T.MathUtils.degToRad(-72), 4);
    expect(ctrl.closePart('CaseLid')).toBe(0);
    expect(lid?.rotation.x).toBeCloseTo(0, 4);
    ctrl.dispose();
  });

  it('fetches PolyFork detail metadata, clusters tone-varied zones, drives door/planter/night/colorways, and round-trips without double rotation', async () => {
    const bytes = shopfrontGlb();
    vi.spyOn(globalThis, 'fetch').mockImplementation(raw => {
      const url = typeof raw === 'string' ? raw : raw instanceof URL ? raw.href : raw.url;
      if (url.endsWith('/api/assets/village-shopfront-d3088e')) return Promise.resolve(Response.json(shopDetailJson));
      if (url.endsWith('-params.json')) return Promise.resolve(Response.json(shopParamsJson));
      if (url.endsWith('/cdn/village-shopfront-d3088e.glb')) return Promise.resolve(new Response(bytes));
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    const asset = await openPolyforkGlb('village-shopfront-d3088e', 'Village Shopfront', undefined, 'building');
    expect(asset.capabilities.riggedParts.map(p => p.name)).toEqual(['door']);
    expect(asset.capabilities.detachableParts.map(p => p.name)).toEqual(['planter']);
    expect(asset.capabilities.nightZones.map(z => z.name)).toEqual(['pane']);
    expect(asset.capabilities.decals.map(d => d.name)).toEqual(['fascia']);
    expect(asset.capabilities.presets?.map(p => p.name)).toEqual(['aegean-blue', 'harbour-green']);

    // Tone-varied shop-body (>32 unique hexes) is exposed as semantic named color zones.
    const slots = listPaintSlots(asset);
    expect(slots.some(s => s.id === 'zone-limewash' && s.label === 'Limewash')).toBe(true);
    expect(slots.some(s => s.id === 'zone-paint' && s.label === 'Joinery paint')).toBe(true);

    // Apply colorway preset, open door, hide planter, turn on night glow, and set fascia decal text.
    const preset = asset.capabilities.presets?.[1];
    if (!preset) throw new Error('Missing harbour-green preset');
    const paint = colorwayPaintPatch(asset.palette, preset, asset.edits.paint);
    expect(paint['zone-paint']).toBe('#47582c');
    applyImportEdits(asset, {
      ...asset.edits,
      paint,
      pose: { door: 80 },
      hiddenParts: ['planter'],
      night: true,
      decalText: { fascia: 'BAKERY' },
    });

    const door = asset.group.getObjectByName('door');
    const planter = asset.group.getObjectByName('planter');
    expect(door?.rotation.y).toBeCloseTo(T.MathUtils.degToRad(80), 4);
    expect(planter?.visible).toBe(false);
    expect(asset.controller.isNight()).toBe(true);

    // Export clone strips studio overlays, keeps hidden detachable subtrees, embeds extras.formFoundry, and synthesizes clips.
    const exported = cloneForExport(asset.group, { includePartClips: true }, asset.controller);
    let overlayCount = 0;
    exported.root.traverse(node => { if (node.userData.studioOverlay) overlayCount++; });
    expect(overlayCount).toBe(0);
    expect(exported.root.getObjectByName('planter')?.visible).toBe(true);
    expect(exported.root.animations.map(c => c.name)).toEqual(['Open door']);
    const manifest = readCapabilities(exported.root);
    expect(manifest?.state).toMatchObject({ pose: { door: 80 }, hiddenParts: ['planter'], night: true, decalText: { fascia: 'BAKERY' } });
    expect(manifest?.clips?.[0]).toMatchObject({ name: 'Open door', synthesized: true });
    expect(manifest?.colorZones?.find(z => z.name === 'paint')?.color).toBe('#47582c');

    // Re-creating a controller on the exported-while-open clone must NOT double-rotate the door, restores hidden planter, and closes cleanly.
    const reimportedCtrl = createAssetController(exported.root);
    const exportedDoor = exported.root.getObjectByName('door');
    expect(reimportedCtrl.getPart('door')).toBe(80);
    expect(reimportedCtrl.isVisible('planter')).toBe(false);
    reimportedCtrl.setVisible('planter', true);
    expect(exported.root.getObjectByName('planter')?.visible).toBe(true);
    expect(exportedDoor?.rotation.y).toBeCloseTo(T.MathUtils.degToRad(80), 4);
    reimportedCtrl.closePart('door');
    expect(exportedDoor?.rotation.y).toBeCloseTo(0, 4);

    // Synthesized clips on a posed model still start at rest quaternion (identity) and reach +80 deg.
    const clips = synthesizeRigClips(asset.group, asset.capabilities);
    const startQ = Array.from(clips[0]?.tracks[0]?.values.slice(0, 4) ?? []);
    expect(new T.Quaternion(startQ[0], startQ[1], startQ[2], startQ[3]).angleTo(new T.Quaternion())).toBeLessThan(1e-6);

    // Dimensions update with scale/proportion edits.
    applyImportEdits(asset, { ...asset.edits, scale: 1.5, proportion: 0.8 });
    expect(asset.capabilities.dimensions?.sizeM).toEqual({ x: 6, y: 3.6, z: 6.585 });

    // Legacy pre-upgrade `vertex-*` paint keys (derived independently without colorZones) migrate onto semantic `zone-*` slots.
    const legacyOnly = await openLocalGlb(new File([bytes], 'legacy.glb'));
    const legacyDoorId = listPaintSlots(legacyOnly).find(s => s.id.startsWith('vertex-1-'))?.id;
    legacyOnly.controller.dispose();
    expect(legacyDoorId).toMatch(/^vertex-1-[\da-f]{6}$/);
    const legacyReconciled = reconcileSavedEdits(asset, {
      name: 'Legacy Shop', tint: '#ffffff', scale: 1, proportion: 1,
      paint: { [legacyDoorId ?? '']: '#aa2233' },
    });
    expect(legacyReconciled.dropped).toEqual([]);
    expect(legacyReconciled.edits.paint).toEqual({ 'zone-paint': '#aa2233' });

    // 3D face picking resolves the door triangle to zone-paint.
    const doorMesh = asset.group.getObjectByName('door-leaf');
    expect(doorMesh instanceof T.Mesh && pickPaintSlot(asset.palette, doorMesh as T.Mesh, 0, 0)).toBe('zone-paint');

    reimportedCtrl.dispose();
    exported.dispose();
    asset.controller.dispose();
  });

  it('handles quaternion hinges past 90 deg, 180 deg rest yaw, yawed X-hinges, and multi-step 360 deg clips', () => {
    const root = new T.Group();
    const dish = new T.Group(); dish.name = 'DishMount'; root.add(dish);
    const flipped = new T.Group(); flipped.name = 'RearGate'; flipped.quaternion.setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI); root.add(flipped);
    const yawedLid = new T.Group(); yawedLid.name = 'YawedLid'; yawedLid.quaternion.setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 2); root.add(yawedLid);
    const caps: AssetCapabilities = {
      version: 1, name: 'Hinge Rig',
      riggedParts: [
        { name: 'DishMount', label: 'Dish', type: 'rotate', axis: 'y', range: [0, 360] },
        { name: 'RearGate', label: 'Rear gate', type: 'rotate', axis: 'y', range: [0, 200] },
        { name: 'YawedLid', label: 'Yawed lid', type: 'rotate', axis: 'x', range: [0, 90] },
      ],
      detachableParts: [], nightZones: [], decals: [],
    };
    writeCapabilities(root, caps);
    const ctrl = createAssetController(root);
    ctrl.setPart('DishMount', 120);
    ctrl.setPart('RearGate', 200);
    ctrl.setPart('YawedLid', 90);
    // Open YawedLid must equal Ry(90°) * Rx(90°) (local X axis), NOT Euler XYZ(90°, 90°, 0).
    const expectedYawedOpen = new T.Quaternion()
      .setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 2)
      .multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), Math.PI / 2));
    expect(yawedLid.quaternion.angleTo(expectedYawedOpen)).toBeLessThan(1e-4);

    // Export posed at 120/200/90 deg, re-wrap with a new controller (simulating GLB round-trip), and verify exact close to rest!
    const snap = cloneForExport(root, { includePartClips: true }, ctrl);
    const ctrl2 = createAssetController(snap.root);
    expect(ctrl2.getPart('DishMount')).toBe(120);
    expect(ctrl2.getPart('RearGate')).toBe(200);
    ctrl2.closePart('DishMount');
    ctrl2.closePart('RearGate');
    ctrl2.closePart('YawedLid');
    expect(snap.root.getObjectByName('DishMount')?.quaternion.angleTo(new T.Quaternion())).toBeLessThan(1e-4);
    expect(snap.root.getObjectByName('RearGate')?.quaternion.angleTo(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI))).toBeLessThan(1e-4);
    expect(snap.root.getObjectByName('YawedLid')?.quaternion.angleTo(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 2))).toBeLessThan(1e-4);

    // Verify 360 deg synthesized clip samples intermediate rotations (not a 0-deg shortest-arc no-op).
    const dishClip = snap.root.animations.find(c => c.name === 'Move dish');
    expect(dishClip).toBeDefined();
    expect(dishClip?.tracks[0]?.times.length).toBeGreaterThanOrEqual(9);
    const mid = dishClip?.tracks[0]?.values.slice(8, 12) ?? [];
    expect(new T.Quaternion(mid[0], mid[1], mid[2], mid[3]).angleTo(new T.Quaternion())).toBeGreaterThan(1.4);

    // Verify togglePart on 0..360 toggles to 180 instead of identical-looking 360.
    expect(ctrl2.togglePart('DishMount')).toBe(180);

    // Verify inspectAsset(root, animations) parses clips and synthesized flags from manifest & external animations.
    const parsed = parseCapabilities(snap.root.userData.formFoundry);
    expect(parsed?.clips?.every(c => c.synthesized === true)).toBe(true);
    const withoutOwnClips = snap.root.clone();
    withoutOwnClips.animations = [];
    expect(inspectAsset(withoutOwnClips, snap.root.animations).clips?.length).toBe(3);

    ctrl2.dispose();
    snap.dispose();
    ctrl.dispose();
  });

  it('uses tight sRGB night matching (excluding dark ironwork), preserves offline fallback capabilities, and isolates distant colors', async () => {
    const bytes = shopfrontGlb();
    const fallbackCaps: AssetCapabilities = {
      version: 1, name: 'Village Shopfront',
      riggedParts: [{ name: 'door', label: 'Door', type: 'rotate', axis: 'y', range: [0, 80] }],
      detachableParts: [{ name: 'planter', label: 'Planter' }],
      nightZones: [{ name: 'pane', label: 'Pane', color: '#ffc46b', intensity: 0.8, albedo: '#34322d' }],
      decals: [{ name: 'fascia', at: [0.5, 1.9, 0.1], normal: [0, 0, 1], up: [0, 1, 0], size: [1.3, 0.22] }],
      colorZones: [{ name: 'paint', label: 'Joinery paint', color: '#4678a8' }],
    };
    // Simulate PolyFork metadata outage (429 on /api/assets) while GLB loads and cached capabilities fallback is supplied.
    vi.spyOn(globalThis, 'fetch').mockImplementation(raw => {
      const url = typeof raw === 'string' ? raw : raw instanceof URL ? raw.href : raw.url;
      if (url.endsWith('.glb')) return Promise.resolve(new Response(bytes));
      return Promise.resolve(new Response(null, { status: 429 }));
    });
    const offlineAsset = await openPolyforkGlb('village-shopfront-d3088e', 'Village Shopfront', undefined, 'building', fallbackCaps);
    expect(offlineAsset.metadataUnavailable).toBeUndefined();
    expect(offlineAsset.capabilities.riggedParts.map(p => p.name)).toEqual(['door']);
    expect(offlineAsset.capabilities.detachableParts.map(p => p.name)).toEqual(['planter']);
    // Distant terracotta planter (#c0463e) must NOT be hijacked into blue zone-paint (#4678a8); it gets its own vertex slot.
    const slots = listPaintSlots(offlineAsset);
    expect(slots.some(s => s.id === 'zone-paint')).toBe(true);
    expect(slots.some(s => s.id.startsWith('vertex-2-'))).toBe(true);

    // Tight sRGB night matching: dark ironwork (#1a1a1a) must NOT glow when pane albedo is #34322d.
    const iron = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial());
    iron.geometry.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
    const lin = new T.Color('#1a1a1a');
    iron.geometry.setAttribute('color', new T.Float32BufferAttribute([lin.r, lin.g, lin.b, lin.r, lin.g, lin.b, lin.r, lin.g, lin.b], 3));
    const host = new T.Group();
    host.add(iron);
    const ironCtrl = createAssetController(host, {
      version: 1, name: 'Iron', riggedParts: [], detachableParts: [], decals: [],
      nightZones: [{ name: 'pane', label: 'Pane', color: '#ffc46b', intensity: 0.8, albedo: '#34322d' }],
    });
    ironCtrl.setNight(true);
    expect(iron.children.length).toBe(0);
    ironCtrl.dispose();
    offlineAsset.controller.dispose();

    // Partial metadata failure (detail 200, params 429): must NOT cache partial detail and MUST merge fallback colorZones.
    clearPolyforkDetailCache();
    clearPolyforkBackoff();
    let detailCalls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(raw => {
      const url = typeof raw === 'string' ? raw : raw instanceof URL ? raw.href : raw.url;
      if (url.endsWith('.glb')) return Promise.resolve(new Response(bytes));
      if (url.endsWith('/api/assets/village-shopfront-d3088e')) {
        detailCalls++;
        return Promise.resolve(Response.json(shopDetailJson));
      }
      return Promise.resolve(new Response(null, { status: 429 }));
    });
    const partialAsset = await openPolyforkGlb('village-shopfront-d3088e', 'Village Shopfront', undefined, 'building', fallbackCaps);
    expect(partialAsset.capabilities.colorZones?.some(z => z.name === 'paint')).toBe(true);
    expect(listPaintSlots(partialAsset).some(s => s.id === 'zone-paint')).toBe(true);
    clearPolyforkBackoff();
    await fetchPolyforkDetail('village-shopfront-d3088e');
    expect(detailCalls).toBe(2);
    partialAsset.controller.dispose();

    // Legacy entry without snapshot during total metadata outage preserves unavailable edits so save does not wipe them.
    clearPolyforkDetailCache();
    clearPolyforkBackoff();
    vi.spyOn(globalThis, 'fetch').mockImplementation(raw => {
      const url = typeof raw === 'string' ? raw : raw instanceof URL ? raw.href : raw.url;
      if (url.endsWith('.glb')) return Promise.resolve(new Response(bytes));
      return Promise.resolve(new Response(null, { status: 503 }));
    });
    const noSnapshot = await openPolyforkGlb('village-shopfront-d3088e', 'Village Shopfront', undefined, 'building');
    expect(noSnapshot.metadataUnavailable).toBe(true);
    reconcileSavedEdits(noSnapshot, {
      name: 'Old Remix', tint: '#ffffff', scale: 1, proportion: 1,
      paint: { 'zone-paint': '#47582c' }, pose: { door: 80 }, hiddenParts: ['planter'], night: true,
    });
    expect(noSnapshot.preservedUnavailableEdits).toEqual({
      paint: { 'zone-paint': '#47582c' }, pose: { door: 80 }, hiddenParts: ['planter'], night: true,
    });
    noSnapshot.controller.dispose();
  });

  it('falls back cleanly when PolyFork detail metadata is unavailable or non-JSON and caches repeated GLB opens', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('not json', { status: 200, headers: { 'content-type': 'text/html' } }));
    const detail = await fetchPolyforkDetail('missing-asset');
    expect(fetcher).toHaveBeenCalledWith('https://polyfork.dev/api/assets/missing-asset', expect.objectContaining({ credentials: 'omit' }));
    expect(detail).toBeNull();
    const empty = new T.Group();
    const caps: AssetCapabilities = buildPolyforkCapabilities(empty, 'missing-asset', 'Fallback', detail);
    expect(caps.riggedParts).toEqual([]);
    expect(caps.detachableParts).toEqual([]);

    // Repeated openPolyforkGlb reuses the session-local GLB cache without re-downloading the binary.
    vi.restoreAllMocks();
    const bytes = shopfrontGlb();
    let glbFetches = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(raw => {
      const url = typeof raw === 'string' ? raw : raw instanceof URL ? raw.href : raw.url;
      if (url.endsWith('.glb')) { glbFetches++; return Promise.resolve(new Response(bytes)); }
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const first = await openPolyforkGlb('cached-shop', 'Cached Shop', undefined, 'building', undefined, false);
    const second = await openPolyforkGlb('cached-shop', 'Cached Shop', undefined, 'building', undefined, false);
    expect(glbFetches).toBe(1);
    first.controller.dispose();
    second.controller.dispose();
  });
});
