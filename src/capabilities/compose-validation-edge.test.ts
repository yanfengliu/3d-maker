import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { resolveVariationRecipe } from '../data/recipe';
import { buildModel } from '../models';
import { cloneForExport } from '../studio/export';
import { composeAsset, computeCompositeBodies, validateComposite } from './compose';
import { createCompositeController } from './compose-runtime';
import { resolveAssetVolumes, validateScenePlacement } from './obb';
import { inspectAsset } from './runtime';
import { MAX_COMPOSITE_CHILDREN, parseCapabilities, writeCapabilities, type AssetCapabilities } from './schema';

function makeSolidBox(
  name: string,
  size: [number, number, number],
  extra: Partial<AssetCapabilities> = {},
): T.Group {
  const root = new T.Group();
  root.name = name;
  const mesh = new T.Mesh(
    new T.BoxGeometry(size[0], size[1], size[2]),
    new T.MeshStandardMaterial({ color: '#b5b2a8' }),
  );
  mesh.position.set(0, size[1] * 0.5, 0);
  root.add(mesh);
  writeCapabilities(root, {
    version: 1,
    name,
    riggedParts: [],
    detachableParts: [],
    nightZones: [],
    decals: [],
    colliders: [{ name: 'Body', shape: 'box', at: [0, size[1] * 0.5, 0], size, layer: 'solid' }],
    ...extra,
  });
  return root;
}

describe('composite spatial validation, physics bodies, sweep symmetry, sheared OBBs, and bounds parity', () => {
  it('seats rotated crates, attachNode+surface, and wall normals flush and rejects host penetration (F5)', () => {
    const table = makeSolidBox('Table', [3, 1, 2], {
      surfaces: [{ name: 'Top', label: 'Top', at: [0, 1, 0], normal: [0, 1, 0], size: [3, 2], clearanceY: 2.5 }],
    });
    const longCrate = makeSolidBox('Crate', [2, 0.5, 0.5]);
    const rolled = composeAsset({
      name: 'Rolled Crate On Table',
      parts: [
        { id: 'table', object: table },
        {
          id: 'crate',
          object: longCrate,
          mount: { parent: 'table', surface: 'Top', rotation: [0, 0, Math.PI / 2], coupling: 'surface' },
        },
      ],
    });
    const crateBox = new T.Box3().setFromObject(longCrate);
    expect(crateBox.min.y).toBeCloseTo(1.0, 3);
    expect(validateComposite(rolled).valid).toBe(true);

    // Manually bury the surface-mounted crate 0.5m into the table; validator MUST flag penetration AND solid collision.
    const slot = rolled.getObjectByName('Slot_crate');
    if (slot) slot.position.y -= 0.5;
    const buried = validateComposite(rolled);
    expect(buried.valid).toBe(false);
    expect(buried.surfaceIssues.some(i => i.kind === 'surface-penetration')).toBe(true);
    expect(buried.placement.overlaps.some(o => o.kind === 'collision')).toBe(true);

    // attachNode at y=2 combined with surface at y=2 must seat at y=2 (not y=4).
    const hostWithSocket = makeSolidBox('WallHost', [2, 2, 1], {
      surfaces: [
        { name: 'Top', label: 'Top', at: [0, 2, 0], normal: [0, 1, 0], size: [2, 1], clearanceY: 2 },
        { name: 'Front', label: 'Front', at: [0, 1, 0.5], normal: [0, 0, 1], size: [1.6, 1.6], clearanceY: 0.5 },
      ],
    });
    const socket = new T.Group();
    socket.name = 'Socket';
    socket.position.set(0, 2, 0);
    hostWithSocket.add(socket);

    const lamp = makeSolidBox('Lamp', [0.3, 0.4, 0.3]);
    const plaque = makeSolidBox('Plaque', [0.4, 0.3, 0.1]);
    const mounted = composeAsset({
      name: 'Socket And Wall',
      parts: [
        { id: 'host', object: hostWithSocket },
        { id: 'lamp', object: lamp, mount: { parent: 'host', attachNode: 'Socket', surface: 'Top', coupling: 'surface' } },
        { id: 'plaque', object: plaque, mount: { parent: 'host', surface: 'Front', coupling: 'surface' } },
      ],
    });
    expect(new T.Box3().setFromObject(lamp).min.y).toBeCloseTo(2.0, 3);
    expect(new T.Box3().setFromObject(plaque).min.z).toBeCloseTo(0.5, 3);
    expect(validateComposite(mounted).valid).toBe(true);
  });

  it('checks edge coupling symmetrically on sweeps, allows co-moving brackets, and catches carried payloads hitting walls (F6)', () => {
    const makeDrawerCabinet = () => {
      const cab = new T.Group();
      cab.name = 'Cabinet';
      const body = new T.Mesh(new T.BoxGeometry(1, 0.8, 0.6), new T.MeshStandardMaterial());
      body.position.set(0, 0.4, 0);
      cab.add(body);
      const drawer = new T.Group();
      drawer.name = 'Drawer';
      drawer.position.set(0, 0.4, 0.31);
      const dMesh = new T.Mesh(new T.BoxGeometry(0.6, 0.25, 0.04), new T.MeshStandardMaterial());
      drawer.add(dMesh);
      cab.add(drawer);
      writeCapabilities(cab, {
        version: 1,
        name: 'Cabinet',
        riggedParts: [{ name: 'Drawer', label: 'Drawer', type: 'slide', axis: 'z', range: [0, 0.5] }],
        detachableParts: [],
        nightZones: [],
        decals: [],
        colliders: [
          { name: 'Body', shape: 'box', at: [0, 0.4, 0], size: [1, 0.8, 0.6], layer: 'solid' },
          { name: 'DrawerCol', shape: 'box', at: [0, 0, 0], size: [0.6, 0.25, 0.04], node: 'Drawer', restPose: { at: [0, 0.4, 0.31] }, layer: 'solid' },
        ],
        clearanceZones: [
          { name: 'DrawerClear', kind: 'slide', at: [0, 0.4, 0.56], size: [0.64, 0.28, 0.56], part: 'Drawer' },
        ],
        surfaces: [
          { name: 'Ledge', label: 'Ledge', at: [0, 0.2, 0.55], normal: [0, 1, 0], size: [0.8, 0.4], clearanceY: 0.8 },
        ],
      });
      return cab;
    };

    // 1. Host drawer sweeping into a surface-mounted blocker on host (even when host itself has coupling: 'weld').
    const blocked = composeAsset({
      name: 'Blocked Drawer',
      parts: [
        { id: 'cab', object: makeDrawerCabinet(), mount: { coupling: 'weld' } },
        { id: 'mug', object: makeSolidBox('Mug', [0.2, 0.35, 0.2]), mount: { parent: 'cab', surface: 'Ledge', coupling: 'surface' } },
      ],
    });
    const blockedReport = validateComposite(blocked);
    expect(blockedReport.valid).toBe(false);
    expect(blockedReport.sweeps.cab?.issues.some(i => i.kind === 'obstacle-blocked')).toBe(true);

    // 2. Bracket welded to sliding Drawer moves WITH Drawer (passes cleanly when unobstructed).
    const carriedOk = composeAsset({
      name: 'Carried Bracket Free',
      parts: [
        { id: 'cab', object: makeDrawerCabinet() },
        { id: 'handle', object: makeSolidBox('Handle', [0.2, 0.08, 0.08]), mount: { parent: 'cab', attachNode: 'Drawer', at: [0, -0.04, 0.06], coupling: 'weld' } },
      ],
    });
    expect(validateComposite(carriedOk).valid, JSON.stringify(validateComposite(carriedOk))).toBe(true);

    // 3. Offset welded payload on sliding Drawer hits a fixed wall halfway through the slide -> MUST be caught!
    const carriedHitsWall = composeAsset({
      name: 'Carried Payload Hits Wall',
      parts: [
        { id: 'cab', object: makeDrawerCabinet() },
        { id: 'arm', object: makeSolidBox('OffsetArm', [0.2, 0.2, 0.2]), mount: { parent: 'cab', attachNode: 'Drawer', at: [0.55, -0.1, 0.05], coupling: 'weld' } },
        { id: 'wall', object: makeSolidBox('Wall', [0.2, 1.0, 0.2]), mount: { at: [0.55, 0, 0.65], coupling: 'surface' } },
      ],
    });
    const wallReport = validateComposite(carriedHitsWall);
    expect(wallReport.valid).toBe(false);
    expect(wallReport.sweeps.cab?.issues.some(i => i.kind === 'obstacle-blocked')).toBe(true);
  });

  it('produces identical validation across open/closed poses and pre/post controller init after GLB reload (F7)', async () => {
    const prevReader = (globalThis as { FileReader?: unknown }).FileReader;
    if (prevReader === undefined) {
      class NodeFileReader {
        result: ArrayBuffer | null = null;
        onloadend: (() => void) | null = null;
        readAsArrayBuffer(blob: Blob) {
          void blob.arrayBuffer().then(buf => { this.result = buf; this.onloadend?.(); });
        }
      }
      (globalThis as { FileReader?: unknown }).FileReader = NodeFileReader;
    }
    try {
      const comp = composeAsset({
        name: 'Posed Pod And Pavilion',
        buildRecipe: buildModel,
        parts: [
          { id: 'pavilion', recipe: resolveVariationRecipe('market-pavilion', 'harbor-timber-kit') },
          { id: 'pod', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [3.2, 0, 0], coupling: 'surface' } },
        ],
      });
      expect(validateComposite(comp).valid).toBe(true);

      const ctrl = createCompositeController(comp);
      ctrl.openPart('pod/CaseLid');
      ctrl.setVisible('pavilion/ProduceStall', false);
      // Still valid while lid is already open!
      expect(validateComposite(comp).valid).toBe(true);

      const prepared = cloneForExport(comp, undefined, ctrl);
      const glb = await new GLTFExporter().parseAsync(prepared.root, { binary: true, animations: prepared.root.animations });
      prepared.dispose();
      ctrl.dispose();
      const loaded = await new GLTFLoader().parseAsync(glb as ArrayBuffer, '');

      // Valid IMMEDIATELY after GLB load (before controller init) AND after controller init!
      expect(validateComposite(loaded.scene).valid).toBe(true);
      const reloadedCtrl = createCompositeController(loaded.scene, undefined, loaded.animations);
      expect(validateComposite(loaded.scene).valid).toBe(true);
      reloadedCtrl.dispose();
    } finally {
      if (prevReader === undefined) delete (globalThis as { FileReader?: unknown }).FileReader;
    }
  });

  it('partitions welded mass by connected rigid body and exposes compound colliders in resolveAssetVolumes (F8)', () => {
    const makeRig = (middleCoupling: 'weld' | 'joint' | 'surface') => composeAsset({
      name: 'Truck Rig',
      parts: [
        { id: 'truck', object: makeSolidBox('Truck', [1.8, 1, 3], { physics: { body: 'dynamic', massKg: 1200 } }) },
        {
          id: 'trailer',
          object: makeSolidBox('Trailer', [1.4, 0.9, 2], { physics: { body: 'dynamic', massKg: 450 } }),
          mount: {
            parent: 'truck',
            at: [0, 0, -2.8],
            coupling: middleCoupling,
            ...(middleCoupling === 'joint' ? { joint: { type: 'hinge', axis: 'y', range: [-45, 45] } } : {}),
          },
        },
        {
          id: 'lamp',
          object: makeSolidBox('Lamp', [0.2, 0.2, 0.2], { physics: { body: 'dynamic', massKg: 5 } }),
          mount: { parent: 'trailer', at: [0, 0.9, 0], coupling: 'weld' },
        },
      ],
    });

    const jointed = makeRig('joint');
    const jointedCaps = inspectAsset(jointed);
    expect(jointedCaps.physics?.massKg).toBe(1200);
    const bodies = computeCompositeBodies(jointedCaps);
    expect(bodies).toEqual([
      { rootId: 'truck', memberIds: ['truck'], body: 'dynamic', massKg: 1200 },
      { rootId: 'trailer', memberIds: ['trailer', 'lamp'], body: 'dynamic', massKg: 455 },
    ]);

    const weldedAll = makeRig('weld');
    expect(inspectAsset(weldedAll).physics?.massKg).toBe(1655);

    const surfaced = makeRig('surface');
    expect(inspectAsset(surfaced).physics?.massKg).toBe(1200);

    // Compound colliders of the assembled rig are exposed by resolveAssetVolumes & catch an external wall collision!
    const vols = resolveAssetVolumes({ id: 'rig', object: jointed });
    expect(vols.length).toBe(3);
    const wall = makeSolidBox('Wall', [0.5, 2, 2]);
    wall.position.set(0.8, 0, 0);
    const sceneCheck = validateScenePlacement([
      { id: 'rig', object: jointed },
      { id: 'wall', object: wall },
    ]);
    expect(sceneCheck.valid).toBe(false);
    expect(sceneCheck.overlaps.some(o => o.itemA === 'rig' && o.itemB === 'wall')).toBe(true);
  });

  it('catches sheared OBB collisions under nonuniform parent scale and enforces writer/reader parity (F14, F15)', () => {
    // 1. Nonuniform parent scale [2, 1, 1] + child yaw 45 deg + obstacle at [0.424, 0, 0.424] inside sheared cube.
    const parent = makeSolidBox('StretchedFrame', [0.1, 0.1, 0.1]);
    const cube = makeSolidBox('RotatedCube', [1, 1, 1]);
    const probe = makeSolidBox('Probe', [0.1, 0.1, 0.1]);
    const sheared = composeAsset({
      name: 'Sheared Test',
      parts: [
        { id: 'frame', object: parent, mount: { scale: [2, 1, 1], at: [0, 2, 0] } },
        { id: 'cube', object: cube, mount: { parent: 'frame', rotation: [0, Math.PI / 4, 0], at: [0, -2, 0], coupling: 'surface' } },
        { id: 'probe', object: probe, mount: { at: [0.424, 0.45, 0.424], coupling: 'surface' } },
      ],
    });
    const shearReport = validateComposite(sheared);
    expect(shearReport.placement.valid).toBe(false);
    expect(shearReport.placement.overlaps.some(o =>
      (o.itemA === 'cube' && o.itemB === 'probe') || (o.itemA === 'probe' && o.itemB === 'cube'),
    )).toBe(true);

    // 2. Rejects > MAX_COMPOSITE_CHILDREN instead of silent truncation; accepts 64 children and 60-char IDs cleanly.
    const tooMany = Array.from({ length: MAX_COMPOSITE_CHILDREN + 1 }, (_, i) => ({
      id: `p${String(i)}`,
      object: makeSolidBox(`B${String(i)}`, [0.1, 0.1, 0.1]),
      mount: { at: [i * 0.5, 0, 0] as [number, number, number] },
    }));
    expect(() => composeAsset({ name: 'Too Many', parts: tooMany })).toThrow(/at most 64/);

    const maxParts = tooMany.slice(0, MAX_COMPOSITE_CHILDREN);
    const atLimit = composeAsset({ name: 'Exact 64', parts: maxParts });
    expect(parseCapabilities(JSON.parse(JSON.stringify(inspectAsset(atLimit))))?.children?.length).toBe(64);

    // 60-char child ID + long rigged part name round-trips and sweeps with checkedParts === 1!
    const longId = 'c'.repeat(60);
    const hatchHost = new T.Group();
    const hatch = new T.Group();
    hatch.name = 'AccessibleServiceHatch';
    hatch.add(new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.04), new T.MeshStandardMaterial()));
    hatchHost.add(hatch);
    writeCapabilities(hatchHost, {
      version: 1,
      name: 'HatchHost',
      riggedParts: [{ name: 'AccessibleServiceHatch', label: 'Hatch', type: 'rotate', axis: 'y', range: [0, 90] }],
      detachableParts: [],
      nightZones: [],
      decals: [],
    });
    const longComp = composeAsset({ name: 'Long Names', parts: [{ id: longId, object: hatchHost }] });
    const parsedLong = parseCapabilities(JSON.parse(JSON.stringify(inspectAsset(longComp))));
    expect(parsedLong?.children?.[0]?.id).toBe(longId);
    expect(validateComposite(longComp).sweeps[longId]?.checkedParts).toBe(1);
  });
});
