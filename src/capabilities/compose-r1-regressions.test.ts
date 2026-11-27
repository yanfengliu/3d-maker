import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it, vi } from 'vitest';
import { resolveVariationRecipe } from '../data/recipe';
import { buildModel } from '../models';
import { cloneForExport, type ExportOptions } from '../studio/export';
import { composeAsset, computeCompositeBodies, validateComposite } from './compose';
import { createCompositeController, type CompositeAssetController } from './compose-runtime';
import { resolveAssetVolumes, validateScenePlacement } from './obb';
import { inspectAsset } from './runtime';
import { readCapabilities, writeCapabilities, type AssetCapabilities } from './schema';

async function roundTripGlb(source: T.Group, options?: ExportOptions, controller?: CompositeAssetController | null) {
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
    const prepared = cloneForExport(source, options, controller);
    const glbBuffer = await new GLTFExporter().parseAsync(prepared.root, {
      binary: true,
      animations: prepared.root.animations,
      onlyVisible: true,
    }) as ArrayBuffer;
    prepared.dispose();
    const jsonLen = new DataView(glbBuffer).getUint32(12, true);
    const gltfJson = JSON.parse(new TextDecoder().decode(new Uint8Array(glbBuffer, 20, jsonLen))) as {
      nodes?: { name?: string; extras?: Record<string, unknown> }[];
      animations?: { name?: string; channels?: { target?: { node?: number; path?: string } }[] }[];
    };
    const loaded = await new GLTFLoader().parseAsync(glbBuffer, '');
    return { scene: loaded.scene, animations: loaded.animations, gltfJson };
  } finally {
    if (prevReader === undefined) delete (globalThis as { FileReader?: unknown }).FileReader;
  }
}

function makeBox(name: string, size: [number, number, number], extra: Partial<AssetCapabilities> = {}): T.Group {
  const root = new T.Group();
  root.name = name;
  const mesh = new T.Mesh(new T.BoxGeometry(...size), new T.MeshStandardMaterial({ color: '#b5b2a8' }));
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

describe('Round 1 review regression suite (F0-F16 deep edge cases)', () => {
  it('preserves reloaded clips on re-export, allows concurrent same-name clips by index, and avoids mixer leaks (F0)', async () => {
    const unit = makeBox('Unit', [0.4, 0.4, 0.4]);
    const aNode = new T.Group(); aNode.name = 'A';
    const bNode = new T.Group(); bNode.name = 'B';
    unit.add(aNode, bNode);
    unit.animations = [
      new T.AnimationClip('Pulse', 1, [new T.VectorKeyframeTrack('A.position', [0, 1], [0, 0, 0, 1, 0, 0])]),
      new T.AnimationClip('Pulse', 1, [new T.VectorKeyframeTrack('B.position', [0, 1], [0, 0, 0, 0, 1, 0])]),
    ];
    const comp = composeAsset({ name: 'Dual Pulse', parts: [{ id: 'u', object: unit }] });
    const gen1 = await roundTripGlb(comp);
    const ctrl1 = createCompositeController(gen1.scene, undefined, gen1.animations);

    // Concurrent same-name clips selected by indices 0 and 1 BOTH run without stopping each other.
    const [act0, act1] = ctrl1.playClips([{ childId: 'u', clip: 0 }, { childId: 'u', clip: 1 }]);
    expect(act0?.isRunning()).toBe(true);
    expect(act1?.isRunning()).toBe(true);
    ctrl1.update(0.5);
    expect(gen1.scene.getObjectByName('u__A')?.position.x).toBeCloseTo(0.5, 2);
    expect(gen1.scene.getObjectByName('u__B')?.position.y).toBeCloseTo(0.5, 2);

    // 20 play/stop cycles reuse the exact same AnimationAction instance (no mixer cache leak).
    const firstAct = ctrl1.playClips([{ childId: 'u', clip: 0 }])[0];
    for (let i = 0; i < 20; i++) {
      ctrl1.stopClips('u');
      const nextAct = ctrl1.playClips([{ childId: 'u', clip: 0 }])[0];
      expect(nextAct).toBe(firstAct);
    }

    // Re-exporting the reloaded scene preserves both clips in the second-generation GLB!
    const gen2 = await roundTripGlb(gen1.scene, undefined, ctrl1);
    ctrl1.dispose();
    expect(gen2.animations.length).toBe(2);
    expect(gen2.gltfJson.animations?.length).toBe(2);
  });

  it('handles hierarchical track paths Armature/Arm.position and live nested authored clips (F1, F2)', async () => {
    const rig = new T.Group(); rig.name = 'Rig';
    const armature = new T.Group(); armature.name = 'Armature';
    const arm = new T.Group(); arm.name = 'Arm';
    arm.add(new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), new T.MeshStandardMaterial()));
    armature.add(arm); rig.add(armature);
    rig.animations = [
      new T.AnimationClip('Lift', 1, [new T.VectorKeyframeTrack('Armature/Arm.position', [0, 1], [0, 0, 0, 0, 1, 0])]),
    ];
    const room = composeAsset({ name: 'Room', parts: [{ id: 'leaf', object: rig }] });
    const house = composeAsset({ name: 'House', parts: [{ id: 'room', object: room }] });

    // Live nested authored clip moves the deeply renamed node `room__leaf__Arm`!
    const liveCtrl = createCompositeController(house);
    liveCtrl.playClips([{ childId: 'room/leaf', clip: 'Lift' }]);
    liveCtrl.update(0.5);
    expect(house.getObjectByName('room__leaf__Arm')?.position.y).toBeCloseTo(0.5, 2);
    liveCtrl.dispose();

    const { gltfJson, scene, animations } = await roundTripGlb(house);
    const clip = gltfJson.animations?.find(a => a.name === 'room: leaf: Lift');
    expect(clip?.channels?.length).toBe(1);
    const reloaded = createCompositeController(scene, undefined, animations);
    reloaded.playClips([{ childId: 'room/leaf', clip: 'Lift' }]);
    reloaded.update(0.5);
    expect(scene.getObjectByName('room__leaf__Arm')?.position.y).toBeCloseTo(0.5, 2);
    reloaded.dispose();
  });

  it('prevents hinge baking when exporting extracted gltf.scene.children[0] and keeps 1 manifest across multi-gen GLB + legacy cleanup (F3, F10)', async () => {
    const comp = composeAsset({
      name: 'Pod Gen',
      buildRecipe: buildModel,
      parts: [{ id: 'pod', recipe: resolveVariationRecipe('cargo-pod') }],
    });
    const gen1 = await roundTripGlb(comp);
    const ctrl1 = createCompositeController(gen1.scene, undefined, gen1.animations);
    ctrl1.playClips([{ childId: 'pod', clip: 'Open case' }]);
    ctrl1.update(0.65);

    // Export the EXTRACTED child `gen1.scene.children[0]` while controller lives on `gen1.scene`!
    const extracted = gen1.scene.children[0] as T.Group;
    const gen2 = await roundTripGlb(extracted);
    ctrl1.dispose();

    const ctrl2 = createCompositeController(gen2.scene, undefined, gen2.animations);
    ctrl2.closePart('pod/CaseLid');
    const lid = gen2.scene.getObjectByName('pod__CaseLid');
    expect(lid ? new T.Quaternion().angleTo(lid.quaternion) : 99).toBeLessThan(1e-3);
    // Multi-gen: readCapabilities works on BOTH gen2.scene AND gen2.scene.children[0] after controller init!
    expect(readCapabilities(gen2.scene)?.children?.length).toBe(1);
    expect(readCapabilities(gen2.scene.children[0] as T.Object3D)?.children?.length).toBe(1);

    // Simulate legacy deb3f61 GLB with stale child formFoundry extras and confirm resave prunes down to 1 manifest node.
    const childInner = gen2.scene.getObjectByName('Slot_pod')?.children[0];
    if (childInner) childInner.userData.formFoundry = { version: 1, name: 'Stale', riggedParts: [], detachableParts: [], nightZones: [], decals: [] };
    const gen3 = await roundTripGlb(gen2.scene, undefined, ctrl2);
    ctrl2.dispose();
    const manifestNodes = (gen3.gltfJson.nodes ?? []).filter(n => n.extras && 'formFoundry' in n.extras);
    expect(manifestNodes.length).toBe(1);
    const ctrl3 = createCompositeController(gen3.scene, undefined, gen3.animations);
    expect(readCapabilities(gen3.scene.children[0] as T.Object3D)?.children?.length).toBe(1);
    ctrl3.dispose();
  });

  it('keeps setChildParams atomic on broken nested manifests/removed surfaces, preserves explicit physicsBody, updates nested clips, and scans outer retention root (F4, F9, F11, F12)', async () => {
    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const sharedGeo = new T.BoxGeometry(0.3, 0.3, 0.3);
    const sharedMat = new T.MeshStandardMaterial({ color: '#888' });
    const spyGeo = vi.spyOn(sharedGeo, 'dispose');
    const spyMat = vi.spyOn(sharedMat, 'dispose');

    const makeLeaf = (clipName: string, extraNodeName?: string) => {
      const g = new T.Group(); g.name = 'Leaf';
      const m = new T.Mesh(sharedGeo, sharedMat); m.name = extraNodeName ?? 'Part';
      g.add(m);
      g.animations = [new T.AnimationClip(clipName, 1, [new T.VectorKeyframeTrack(`${m.name}.position`, [0, 1], [0, 0, 0, 0, 1, 0])])];
      writeCapabilities(g, {
        version: 1, name: 'Leaf', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
        physics: { body: 'dynamic', massKg: 10 },
        surfaces: [{ name: 'Top', label: 'Top', at: [0, 0.3, 0], normal: [0, 1, 0], size: [1, 1], clearanceY: 2 }],
      });
      return g;
    };

    const room = composeAsset({
      name: 'Room',
      buildRecipe: () => makeLeaf('Old'),
      parts: [
        { id: 'leaf', recipe: baseRecipe },
        { id: 'topProp', object: makeBox('Prop', [0.2, 0.2, 0.2]), mount: { parent: 'leaf', surface: 'Top', coupling: 'surface' } },
      ],
    });
    const outerSib = new T.Group(); outerSib.name = 'OuterSib';
    outerSib.add(new T.Mesh(sharedGeo, sharedMat));
    const house = composeAsset({
      name: 'Static House',
      physicsBody: 'static',
      parts: [
        { id: 'room', object: room },
        { id: 'sib', object: outerSib, mount: { at: [3, 0, 0] } },
      ],
    });
    const ctrl = createCompositeController(house);
    const propSlot = house.getObjectByName('room__Slot_topProp');
    const origParent = propSlot?.parent;

    // 1. Replacement removing required surface throws atomically without detaching topProp!
    expect(() => ctrl.setChildParams('room/leaf', {}, () => makeBox('NoSurface', [0.3, 0.3, 0.3]))).toThrow('surface');
    expect(propSlot?.parent).toBe(origParent);

    // 2. Replacement with broken nested manifest missing slot throws atomically without detaching topProp!
    expect(() => ctrl.setChildParams('room/leaf', {}, () => {
      const broken = makeLeaf('Broken');
      const caps = inspectAsset(broken);
      caps.children = [{ id: 'ghost', label: 'Ghost', slotNode: 'MissingSlot', mount: { coupling: 'weld' }, capabilities: { version: 1, name: 'G', riggedParts: [], detachableParts: [], nightZones: [], decals: [] } }];
      writeCapabilities(broken, caps);
      return broken;
    })).toThrow('MissingSlot');
    expect(propSlot?.parent).toBe(origParent);

    // 3. Valid nested rebuild with BRAND NEW geometry/material (not sharedGeo/sharedMat!) preserves explicit physicsBody='static',
    // updates outer clips ('Old' -> 'New'), AND keeps outerSib's sharedGeo/Mat alive (F11, F12)!
    const makeFreshLeaf = (clipName: string) => {
      const g = new T.Group(); g.name = 'Leaf';
      const m = new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.3), new T.MeshStandardMaterial({ color: '#444' }));
      m.name = 'Part';
      g.add(m);
      g.animations = [new T.AnimationClip(clipName, 1, [new T.VectorKeyframeTrack('Part.position', [0, 1], [0, 0, 0, 0, 1, 0])])];
      writeCapabilities(g, {
        version: 1, name: 'Leaf', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
        physics: { body: 'dynamic', massKg: 10 },
        surfaces: [{ name: 'Top', label: 'Top', at: [0, 0.3, 0], normal: [0, 1, 0], size: [1, 1], clearanceY: 2 }],
      });
      return g;
    };
    const updatedCaps = ctrl.setChildParams('room/leaf', {}, () => makeFreshLeaf('New'));
    expect(updatedCaps.physics?.body).toBe('static');
    expect(computeCompositeBodies(updatedCaps)[0]?.body).toBe('static');
    expect(updatedCaps.clips?.map(c => c.name)).toContain('room: leaf: New');
    expect(updatedCaps.clips?.some(c => c.name.includes('Old'))).toBe(false);
    expect(spyGeo).not.toHaveBeenCalled();
    expect(spyMat).not.toHaveBeenCalled();
    const exported = await roundTripGlb(house, undefined, ctrl);
    expect(exported.gltfJson.animations?.map(a => a.name)).toContain('room: leaf: New');
    expect(exported.gltfJson.animations?.some(a => a.name?.includes('Old'))).toBe(false);
    ctrl.dispose();

    // 4. scopeNames:false siblings export distinct GLB node targets AND rebuild introducing b__Door disambiguates prefix (F9)!
    const makeAnimDoor = () => {
      const g = new T.Group(); g.name = 'DoorUnit';
      const door = new T.Group(); door.name = 'Door';
      door.add(new T.Mesh(new T.BoxGeometry(0.4, 0.4, 0.04), new T.MeshStandardMaterial()));
      g.add(door);
      g.animations = [new T.AnimationClip('Swing', 1, [new T.VectorKeyframeTrack('Door.position', [0, 1], [0, 0, 0, 0, 0.5, 0])])];
      writeCapabilities(g, {
        version: 1, name: 'DoorUnit',
        riggedParts: [{ name: 'Door', label: 'Door', type: 'slide', axis: 'y', range: [0, 0.5] }],
        detachableParts: [], nightZones: [], decals: [],
      });
      return g;
    };
    const unscoped = composeAsset({
      name: 'Unscoped Siblings',
      scopeNames: false,
      parts: [
        { id: 'd1', object: makeAnimDoor(), mount: { at: [-1, 0, 0] } },
        { id: 'd2', object: makeAnimDoor(), mount: { at: [1, 0, 0] } },
      ],
    });
    const unscopedGlb = await roundTripGlb(unscoped, { includePartClips: true });
    const swing1 = unscopedGlb.gltfJson.animations?.find(a => a.name === 'd1: Swing')?.channels?.[0]?.target?.node;
    const swing2 = unscopedGlb.gltfJson.animations?.find(a => a.name === 'd2: Swing')?.channels?.[0]?.target?.node;
    expect(swing1).toBeDefined();
    expect(swing2).toBeDefined();
    expect(swing1).not.toBe(swing2);

    const collideRebuild = composeAsset({
      name: 'Rebuild Prefix Collision',
      buildRecipe: () => makeAnimDoor(),
      parts: [
        { id: 'a', recipe: baseRecipe },
        { id: 'a__b', object: makeAnimDoor(), mount: { at: [2, 0, 0] } },
      ],
    });
    const crCtrl = createCompositeController(collideRebuild);
    crCtrl.setChildParams('a', {}, () => {
      const g = makeAnimDoor();
      const d = g.getObjectByName('Door');
      if (d) d.name = 'b__Door';
      if (g.animations[0]?.tracks[0]) g.animations[0].tracks[0].name = 'b__Door.position';
      return g;
    });
    const reGlb = await roundTripGlb(collideRebuild, undefined, crCtrl);
    crCtrl.dispose();
    const aNodeIdx = reGlb.gltfJson.animations?.find(a => a.name === 'a: Swing')?.channels?.[0]?.target?.node;
    const abNodeIdx = reGlb.gltfJson.animations?.find(a => a.name === 'a__b: Swing')?.channels?.[0]?.target?.node;
    expect(aNodeIdx).toBeDefined();
    expect(abNodeIdx).toBeDefined();
    expect(aNodeIdx).not.toBe(abNodeIdx);
  });

  it('handles nested surface seating, stationary welded stop vs grandchild carried bolt, mid-clip & hidden-rack validation, headless volumes, weak shear, and deep length guard (F5-F8, F14, F15)', async () => {
    // 1. Nested assembly seated on a 1m deck sits at y=1.000 (not y=2) and validates cleanly (F5).
    const deck = makeBox('Deck', [2, 1, 2], {
      surfaces: [{ name: 'Top', label: 'Top', at: [0, 1, 0], normal: [0, 1, 0], size: [2, 2], clearanceY: 2 }],
    });
    const nestedSub = composeAsset({ name: 'Sub', parts: [{ id: 'box', object: makeBox('Crate', [0.5, 0.5, 0.5]) }] });
    const onDeck = composeAsset({
      name: 'Nested On Deck',
      parts: [
        { id: 'deck', object: deck },
        { id: 'sub', object: nestedSub, mount: { parent: 'deck', surface: 'Top', coupling: 'surface' } },
      ],
    });
    expect(new T.Box3().setFromObject(nestedSub).min.y).toBeCloseTo(1.0, 3);
    expect(validateComposite(onDeck).valid).toBe(true);

    // 2. Stationary welded stop on cabinet frame IS caught in drawer sweep, while grandchild bolt on carried bracket passes (F6).
    const makeCab = () => {
      const cab = new T.Group(); cab.name = 'Cab';
      const drawer = new T.Group(); drawer.name = 'Drawer'; drawer.position.set(0, 0.4, 0.31);
      drawer.add(new T.Mesh(new T.BoxGeometry(0.6, 0.2, 0.04), new T.MeshStandardMaterial()));
      cab.add(new T.Mesh(new T.BoxGeometry(1, 0.8, 0.6), new T.MeshStandardMaterial()), drawer);
      writeCapabilities(cab, {
        version: 1, name: 'Cab',
        riggedParts: [{ name: 'Drawer', label: 'Drawer', type: 'slide', axis: 'z', range: [0, 0.5] }],
        detachableParts: [], nightZones: [], decals: [],
        colliders: [
          { name: 'Body', shape: 'box', at: [0, 0.4, 0], size: [1, 0.8, 0.6], layer: 'solid' },
          { name: 'DrawerCol', shape: 'box', at: [0, 0, 0], size: [0.6, 0.2, 0.04], node: 'Drawer', restPose: { at: [0, 0.4, 0.31] }, layer: 'solid' },
        ],
        clearanceZones: [{ name: 'DrawerClear', kind: 'slide', at: [0, 0.4, 0.56], size: [0.64, 0.24, 0.56], part: 'Drawer' }],
      });
      return cab;
    };
    const withFixedStop = composeAsset({
      name: 'Fixed Stop',
      parts: [
        { id: 'cab', object: makeCab() },
        { id: 'stop', object: makeBox('Stop', [0.2, 0.3, 0.2]), mount: { parent: 'cab', at: [0, 0.25, 0.55], coupling: 'weld' } },
      ],
    });
    expect(validateComposite(withFixedStop).sweeps.cab?.issues.some(i => i.kind === 'obstacle-blocked')).toBe(true);

    const withGrandchildBolt = composeAsset({
      name: 'Carried Grandchild Bolt',
      parts: [
        { id: 'cab', object: makeCab() },
        { id: 'bracket', object: makeBox('Bracket', [0.2, 0.08, 0.06]), mount: { parent: 'cab', attachNode: 'Drawer', at: [0, -0.04, 0.05], coupling: 'weld' } },
        { id: 'bolt', object: makeBox('Bolt', [0.04, 0.04, 0.04]), mount: { parent: 'bracket', at: [0, 0.02, 0.04], coupling: 'weld' } },
      ],
    });
    expect(validateComposite(withGrandchildBolt).valid).toBe(true);

    // 3. Mid-clip sweep stays valid AND hidden rack overlapping wall passes BEFORE controller init after GLB reload (F7).
    const podComp = composeAsset({
      name: 'Pod Mid Clip',
      buildRecipe: buildModel,
      parts: [{ id: 'pod', recipe: resolveVariationRecipe('cargo-pod') }],
    });
    const podCtrl = createCompositeController(podComp);
    podCtrl.playClips([{ childId: 'pod', clip: 'Open case' }]);
    podCtrl.update(0.6);
    expect(validateComposite(podComp).valid).toBe(true);
    podCtrl.dispose();

    const rackHost = makeBox('RackHost', [0.4, 0.4, 0.4], {
      detachableParts: [{ name: 'Rack', label: 'Rack' }],
      colliders: [
        { name: 'Body', shape: 'box', at: [0, 0.2, 0], size: [0.4, 0.4, 0.4], layer: 'solid' },
        { name: 'RackCol', shape: 'box', at: [0, 0.2, 0.5], size: [0.3, 0.3, 0.5], node: 'Rack', restPose: { at: [0, 0.2, 0.5] }, layer: 'solid' },
      ],
    });
    const rackNode = new T.Group(); rackNode.name = 'Rack';
    rackNode.add(new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.5), new T.MeshStandardMaterial()));
    rackHost.add(rackNode);
    const hiddenOverlap = composeAsset({
      name: 'Hidden Rack Wall',
      parts: [
        { id: 'host', object: rackHost },
        { id: 'wall', object: makeBox('Wall', [0.4, 0.6, 0.2]), mount: { at: [0, 0, 0.6], coupling: 'surface' } },
      ],
    });
    const hCtrl = createCompositeController(hiddenOverlap);
    hCtrl.setVisible('host/Rack', false);
    const hGlb = await roundTripGlb(hiddenOverlap, undefined, hCtrl);
    hCtrl.dispose();
    // BEFORE controller creation on reloaded GLB, hidden Rack must NOT report collision with Wall!
    expect(validateComposite(hGlb.scene).valid).toBe(true);

    // 4. Headless resolveAssetVolumes resolves compound colliders AND computeCompositeBodies preserves nested jointed bodies (F8).
    const subJointed = composeAsset({
      name: 'Arm Sub',
      parts: [
        { id: 'base', object: makeBox('Base', [0.5, 0.5, 0.5], { physics: { body: 'dynamic', massKg: 10 } }) },
        { id: 'arm', object: makeBox('Arm', [0.2, 0.6, 0.2], { physics: { body: 'dynamic', massKg: 2 } }), mount: { parent: 'base', at: [0, 0.5, 0], coupling: 'joint', joint: { type: 'hinge', axis: 'z' } } },
      ],
    });
    const outerCarrier = composeAsset({
      name: 'Carrier',
      parts: [
        { id: 'truck', object: makeBox('Truck', [1.8, 1, 3], { physics: { body: 'dynamic', massKg: 1200 } }) },
        { id: 'sub', object: subJointed, mount: { parent: 'truck', at: [0, 1, 0], coupling: 'weld' } },
      ],
    });
    const outerCaps = inspectAsset(outerCarrier);
    expect(computeCompositeBodies(outerCaps)).toEqual([
      { rootId: 'truck', memberIds: ['truck', 'sub'], body: 'dynamic', massKg: 1210 },
      { rootId: 'sub/arm', memberIds: ['sub/arm'], body: 'dynamic', massKg: 2 },
    ]);
    const headlessVols = resolveAssetVolumes({ id: 'carrier', capabilities: outerCaps });
    expect(headlessVols.length).toBe(3);

    // 5. Weak shear (~8e-5 < old 1e-4 threshold!) on a 500m beam catches edge probe strictly inside true sheared beam (F14).
    const beamFrame = makeBox('BeamFrame', [0.1, 0.1, 0.1]);
    const beam = makeBox('Beam', [500, 1, 1]);
    const probe = makeBox('Probe', [0.05, 0.05, 0.05]);
    const weakShear = composeAsset({
      name: 'Weak Shear Beam',
      parts: [
        { id: 'frame', object: beamFrame, mount: { scale: [1, 1, 1.00008], at: [0, 5, 0] } },
        { id: 'beam', object: beam, mount: { parent: 'frame', rotation: [0, Math.PI / 4, 0], at: [0, -5, 0], coupling: 'surface' } },
        // Probe placed near the +z local edge at x_local = +240m where 8e-5 shear shifts the beam edge by ~19mm.
        { id: 'probe', object: probe, mount: { at: [240 * Math.SQRT1_2 + 0.46 * Math.SQRT1_2, 0.5, -240 * Math.SQRT1_2 * 1.00008 + 0.46 * Math.SQRT1_2 * 1.00008], coupling: 'surface' } },
      ],
    });
    expect(validateScenePlacement([
      { id: 'beam', object: weakShear.getObjectByName('Slot_beam')?.children[0] as T.Object3D, capabilities: inspectAsset(weakShear).children?.[1]?.capabilities as AssetCapabilities },
      { id: 'probe', object: weakShear.getObjectByName('Slot_probe')?.children[0] as T.Object3D, capabilities: inspectAsset(weakShear).children?.[2]?.capabilities as AssetCapabilities },
    ], { tolerance: 0.01 }).valid).toBe(false);

    // 6. Deep multi-level 60-char IDs exceeding MAX_SCOPED_NAME_LEN throw cleanly at write time (F15).
    const id60 = 'x'.repeat(60);
    const l1 = composeAsset({ name: 'L1', parts: [{ id: id60, object: makeBox('Leaf', [0.2, 0.2, 0.2]) }] });
    const l2 = composeAsset({ name: 'L2', parts: [{ id: id60, object: l1 }] });
    const l3 = composeAsset({ name: 'L3', parts: [{ id: id60, object: l2 }] });
    const l4 = composeAsset({ name: 'L4', parts: [{ id: id60, object: l3 }] });
    expect(() => composeAsset({ name: 'L5', parts: [{ id: id60, object: l4 }] })).toThrow(/exceeds maximum length/);
  });
});
