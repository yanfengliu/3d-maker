import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { resolveVariationRecipe } from '../data/recipe';
import { buildModel } from '../models';
import { cloneForExport, type ExportOptions } from '../studio/export';
import { composeAsset, computeCompositeBodies, validateComposite } from './compose';
import { createCompositeController, type CompositeAssetController } from './compose-runtime';
import { validateScenePlacement } from './obb';
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

describe('Round 2 review regression suite (multi-gen GLB, transactional pose restore, headless attachNode, nested rebuilds, track bindings)', () => {
  it('survives 4 consecutive whole-scene gltf.scene GLB saves without losing manifest, clips, or overlap detection (F10)', async () => {
    const comp = composeAsset({
      name: 'MultiGen Pair',
      buildRecipe: buildModel,
      parts: [
        { id: 'pod-a', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [0, 0, 0] } },
        { id: 'pod-b', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [0.1, 0, 0] } },
      ],
    });
    let currentScene = comp;
    let currentAnims = comp.animations;
    for (let gen = 1; gen <= 4; gen++) {
      const ctrl = gen > 1 ? createCompositeController(currentScene, undefined, currentAnims) : undefined;
      const saved = await roundTripGlb(currentScene, undefined, ctrl);
      ctrl?.dispose();
      expect(readCapabilities(saved.scene)?.children?.length, `gen ${String(gen)}`).toBe(2);
      expect(saved.animations.length, `gen ${String(gen)} anims`).toBeGreaterThan(0);
      expect(validateComposite(saved.scene).placement.valid, `gen ${String(gen)} overlap`).toBe(false);
      currentScene = saved.scene;
      currentAnims = saved.animations;
    }
  });

  it('keeps setChildParams atomic when replacement declares a posed part whose node is missing (F4)', () => {
    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const makeDoorHost = (includeDoorNode: boolean) => {
      const g = makeBox('DoorHost', [1, 1, 1], {
        riggedParts: [{ name: 'Door', label: 'Door', type: 'rotate', axis: 'y', range: [0, 90] }],
        surfaces: [{ name: 'Top', label: 'Top', at: [0, 1, 0], normal: [0, 1, 0], size: [1, 1], clearanceY: 2 }],
      });
      if (includeDoorNode) {
        const door = new T.Group(); door.name = 'Door';
        g.add(door);
      }
      return g;
    };
    const comp = composeAsset({
      name: 'Host With Dep',
      buildRecipe: () => makeDoorHost(true),
      parts: [
        { id: 'host', recipe: baseRecipe },
        { id: 'dep', object: makeBox('Dep', [0.3, 0.3, 0.3]), mount: { parent: 'host', surface: 'Top', coupling: 'surface' } },
      ],
    });
    const ctrl = createCompositeController(comp);
    ctrl.openPart('host/Door');
    const depSlot = comp.getObjectByName('Slot_dep');
    // Replacement declares Door in manifest but lacks Door node: succeeds safely without throwing or detaching dep!
    ctrl.setChildParams('host', {}, () => makeDoorHost(false));
    expect(depSlot?.parent).toBeTruthy();
    ctrl.dispose();
  });

  it('resolves attachNode rest pose in headless JSON placement checks (F8)', () => {
    const crane = makeBox('Crane', [1, 1, 1]);
    const boom = new T.Group(); boom.name = 'Boom'; boom.position.set(5, 0, 0);
    crane.add(boom);
    const rig = composeAsset({
      name: 'Crane Load',
      parts: [
        { id: 'crane', object: crane },
        { id: 'load', object: makeBox('Load', [0.8, 0.8, 0.8]), mount: { parent: 'crane', attachNode: 'Boom', coupling: 'weld' } },
      ],
    });
    const rigCaps = inspectAsset(rig);
    const wallCaps = inspectAsset(makeBox('Wall', [0.5, 2, 2]));
    const headless = validateScenePlacement([
      { id: 'rig', capabilities: rigCaps },
      { id: 'wall', capabilities: wallCaps, position: [5.1, 0, 0] },
    ]);
    expect(headless.valid).toBe(false);
  });

  it('propagates nested childComposite rebuilds, cleans outer mixer actions, re-seats nested slot, resets timeScale, and preserves static lock after GLB reload (F0, F5, F11)', async () => {
    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const makeInnerLeaf = (clipName: string, bottomY = 0, body: 'static' | 'dynamic' = 'static') => {
      const g = new T.Group(); g.name = 'Leaf';
      const door = new T.Mesh(new T.BoxGeometry(0.4, 0.4, 0.4), new T.MeshStandardMaterial());
      door.name = 'Door';
      door.position.set(0, bottomY + 0.2, 0);
      g.add(door);
      g.animations = [new T.AnimationClip(clipName, 1, [new T.VectorKeyframeTrack('Door.position', [0, 1], [0, bottomY + 0.2, 0, 0, bottomY + 1.2, 0])])];
      writeCapabilities(g, {
        version: 1, name: 'Leaf', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
        physics: { body, massKg: 10 },
      });
      return g;
    };

    const deck = makeBox('Deck', [2, 1, 2], {
      surfaces: [{ name: 'Top', label: 'Top', at: [0, 1, 0], normal: [0, 1, 0], size: [2, 2], clearanceY: 2 }],
    });
    const room = composeAsset({
      name: 'Room',
      buildRecipe: () => makeInnerLeaf('Old', 0, 'static'),
      parts: [{ id: 'leaf', recipe: baseRecipe }],
    });
    const house = composeAsset({
      name: 'Locked Static House',
      physicsBody: 'static',
      parts: [
        { id: 'deck', object: deck },
        { id: 'room', object: room, mount: { parent: 'deck', surface: 'Top', coupling: 'surface' } },
      ],
    });
    const ctrl = createCompositeController(house);
    // Test timeScale: 0 followed by default replay (must NOT remain frozen at timeScale 0!).
    ctrl.playClips([{ childId: 'room', clip: 'leaf: Old', timeScale: 0 }]);
    ctrl.update(0.5);
    const doorBefore = house.getObjectByName('room__leaf__Door')?.position.y ?? 0;
    expect(doorBefore).toBeCloseTo(0.2, 3);
    ctrl.playClips([{ childId: 'room', clip: 'leaf: Old' }]);
    ctrl.update(0.5);
    expect(house.getObjectByName('room__leaf__Door')?.position.y ?? 0).toBeGreaterThan(0.5);

    // Rebuild through public `ctrl.childComposite('room')` with lower local bottom (-0.2) -> must reseat room flush at y=1.000
    // AND refresh outer manifest/clips AND animate the NEW door (not the detached old door)!
    ctrl.childComposite('room')?.setChildParams('leaf', {}, () => makeInnerLeaf('New', -0.2, 'dynamic'));
    expect(ctrl.capabilities.clips?.map(c => c.name)).toContain('room: leaf: New');
    expect(ctrl.capabilities.clips?.some(c => c.name.includes('Old'))).toBe(false);
    expect(new T.Box3().setFromObject(room).min.y).toBeCloseTo(1.0, 3);
    expect(validateComposite(house).valid).toBe(true);
    ctrl.playClips([{ childId: 'room', clip: 'leaf: New' }]);
    ctrl.update(0.5);
    expect(house.getObjectByName('room__leaf__Door')?.position.y ?? 0).toBeGreaterThan(0.3);

    // Reload binary GLB and verify locked `physicsBody: 'static'` survives reload even when child rebuilds dynamic!
    const glb = await roundTripGlb(house, undefined, ctrl);
    ctrl.dispose();
    const reloaded = createCompositeController(glb.scene, undefined, glb.animations);
    const afterReloadRebuild = reloaded.setChildParams('room/leaf', {}, () => makeInnerLeaf('PostReload', 0, 'dynamic'));
    expect(afterReloadRebuild.physics?.body).toBe('static');
    expect(computeCompositeBodies(afterReloadRebuild)[0]?.body).toBe('static');
    reloaded.dispose();
  });

  it('rewrites dotted/colon track names, checks hidden ancestors before init, isolates unscoped mounted doors & dependent rebuild prefixes, and leaves caller input intact on length rejection (F1, F7, F9, F15)', async () => {
    // 1. Arm.L.position and Armature:Arm.position both animate and export cleanly (F1).
    const rig = new T.Group(); rig.name = 'Rig';
    const armL = new T.Group(); armL.name = 'Arm.L';
    const armature = new T.Group(); armature.name = 'Armature';
    const armR = new T.Group(); armR.name = 'Arm';
    armature.add(armR);
    rig.add(armL, armature);
    rig.animations = [
      new T.AnimationClip('DualBind', 1, [
        new T.VectorKeyframeTrack('Arm.L.position', [0, 1], [0, 0, 0, 1, 0, 0]),
        new T.VectorKeyframeTrack('Armature:Arm.position', [0, 1], [0, 0, 0, 0, 1, 0]),
      ]),
    ];
    const comp = composeAsset({ name: 'Special Tracks', parts: [{ id: 'r', object: rig }] });
    // Verify live playback on original dotted/colon tracks BEFORE export as well as after GLB round-trip!
    const liveRCtrl = createCompositeController(comp);
    liveRCtrl.playClips([{ childId: 'r', clip: 'DualBind' }]);
    liveRCtrl.update(0.5);
    expect(comp.getObjectByName('r__Arm.L')?.position.x).toBeCloseTo(0.5, 2);
    expect(comp.getObjectByName('r__Arm')?.position.y).toBeCloseTo(0.5, 2);
    liveRCtrl.stopClips();
    liveRCtrl.dispose();

    const glb = await roundTripGlb(comp);
    expect(glb.gltfJson.animations?.[0]?.channels?.length).toBe(2);
    const rCtrl = createCompositeController(glb.scene, undefined, glb.animations);
    rCtrl.playClips([{ childId: 'r', clip: 'DualBind' }]);
    rCtrl.update(0.5);
    // GLTFLoader sanitizes dots out of node names (`r__Arm.L` -> `r__ArmL`) while keeping `localName: 'Arm.L'`.
    expect((glb.scene.getObjectByName('r__Arm.L') ?? glb.scene.getObjectByName('r__ArmL'))?.position.x).toBeCloseTo(0.5, 2);
    expect(glb.scene.getObjectByName('r__Arm')?.position.y).toBeCloseTo(0.5, 2);
    rCtrl.dispose();

    // 2. Hidden ancestor collider (`Brace` inside hidden `Rack`) passes BEFORE controller init after GLB reload (F7).
    const rackHost = makeBox('RackHost', [0.4, 0.4, 0.4], {
      detachableParts: [{ name: 'Rack', label: 'Rack' }],
      colliders: [
        { name: 'Body', shape: 'box', at: [0, 0.2, 0], size: [0.4, 0.4, 0.4], layer: 'solid' },
        { name: 'BraceCol', shape: 'box', at: [0, 0.2, 0.5], size: [0.3, 0.3, 0.5], node: 'Brace', restPose: { at: [0, 0.2, 0.5] }, layer: 'solid' },
      ],
    });
    const rack = new T.Group(); rack.name = 'Rack';
    const brace = new T.Group(); brace.name = 'Brace';
    brace.add(new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.5), new T.MeshStandardMaterial()));
    rack.add(brace); rackHost.add(rack);
    const hiddenAnc = composeAsset({
      name: 'Hidden Ancestor',
      parts: [
        { id: 'host', object: rackHost },
        { id: 'wall', object: makeBox('Wall', [0.4, 0.6, 0.2]), mount: { at: [0, 0, 0.6], coupling: 'surface' } },
      ],
    });
    const hCtrl = createCompositeController(hiddenAnc);
    hCtrl.setVisible('host/Rack', false);
    const hGlb = await roundTripGlb(hiddenAnc, undefined, hCtrl);
    hCtrl.dispose();
    expect(validateComposite(hGlb.scene).valid).toBe(true);

    // 3. Unscoped (`scopeNames: false`) mounted child door & duplicate `.position` tracks export distinct target indices,
    // and dependent rebuild (`a__b` mounted under `a`) scans reattached dependent names too (F9).
    const makeDoorUnit = () => {
      const g = new T.Group(); g.name = 'Unit';
      const frame = new T.Group(); frame.name = 'Frame';
      const door = new T.Group(); door.name = 'Door';
      door.add(new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), new T.MeshStandardMaterial()));
      g.add(frame, door);
      g.animations = [
        new T.AnimationClip('Swing', 1, [
          new T.VectorKeyframeTrack('Door.position', [0, 1], [0, 0, 0, 0, 0.5, 0]),
          new T.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 0.5, 0, 0]),
        ]),
      ];
      return g;
    };
    const unscopedMounted = composeAsset({
      name: 'Unscoped Mounted',
      scopeNames: false,
      parts: [
        { id: 'outer', object: makeDoorUnit() },
        { id: 'inner', object: makeDoorUnit(), mount: { parent: 'outer', attachNode: 'Frame', at: [1, 0, 0] } },
      ],
    });
    const uGlb = await roundTripGlb(unscopedMounted);
    const outerCh = uGlb.gltfJson.animations?.find(a => a.name === 'outer: Swing')?.channels ?? [];
    const innerCh = uGlb.gltfJson.animations?.find(a => a.name === 'inner: Swing')?.channels ?? [];
    expect(outerCh[0]?.target?.node).not.toBe(innerCh[0]?.target?.node);
    expect(outerCh[1]?.target?.node).not.toBe(innerCh[1]?.target?.node);

    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const depCollide = composeAsset({
      name: 'Dep Prefix Collision',
      buildRecipe: () => makeDoorUnit(),
      parts: [
        { id: 'a', recipe: baseRecipe },
        { id: 'a__b', object: makeDoorUnit(), mount: { parent: 'a', at: [2, 0, 0] } },
      ],
    });
    const dCtrl = createCompositeController(depCollide);
    dCtrl.setChildParams('a', {}, () => {
      const g = makeDoorUnit();
      const d = g.getObjectByName('Door'); if (d) d.name = 'b__Door';
      if (g.animations[0]?.tracks[0]) g.animations[0].tracks[0].name = 'b__Door.position';
      return g;
    });
    const dGlb = await roundTripGlb(depCollide, undefined, dCtrl);
    dCtrl.dispose();
    const aDoorTarget = dGlb.gltfJson.animations?.find(a => a.name === 'a: Swing')?.channels?.[0]?.target?.node;
    const abDoorTarget = dGlb.gltfJson.animations?.find(a => a.name === 'a__b: Swing')?.channels?.[0]?.target?.node;
    expect(aDoorTarget).toBeDefined();
    expect(abDoorTarget).toBeDefined();
    expect(aDoorTarget).not.toBe(abDoorTarget);

    // 4. Length rejection does NOT mutate caller's input assembly, and >256-char qualified clip names throw cleanly (F15).
    const id60 = 'z'.repeat(60);
    const l1 = composeAsset({ name: 'L1', parts: [{ id: id60, object: makeBox('Leaf', [0.2, 0.2, 0.2]) }] });
    const l2 = composeAsset({ name: 'L2', parts: [{ id: id60, object: l1 }] });
    const l3 = composeAsset({ name: 'L3', parts: [{ id: id60, object: l2 }] });
    const l4 = composeAsset({ name: 'L4', parts: [{ id: id60, object: l3 }] });
    const l4NameBefore = l4.name;
    expect(() => composeAsset({ name: 'L5', parts: [{ id: id60, object: l4 }] })).toThrow(/exceeds maximum length/);
    // l4 was NOT damaged and can still create a composite controller!
    expect(l4.name).toBe(l4NameBefore);
    expect(readCapabilities(l4)?.children?.length).toBe(1);
    const l4Ctrl = createCompositeController(l4);
    l4Ctrl.dispose();

    const longClipHost = makeBox('ClipHost', [0.2, 0.2, 0.2]);
    longClipHost.animations = [new T.AnimationClip('c'.repeat(250), 1, [])];
    expect(() => composeAsset({ name: 'Long Clip', parts: [{ id: 'longprefix', object: longClipHost }] })).toThrow(/exceeds maximum length/);
  });
});
