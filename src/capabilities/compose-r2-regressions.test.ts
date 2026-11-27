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
      expect(saved.gltfJson.animations?.every(a => (a.channels?.length ?? 0) > 0), `gen ${String(gen)} channels`).toBe(true);
      expect(validateComposite(saved.scene).placement.valid, `gen ${String(gen)} overlap`).toBe(false);
      currentScene = saved.scene;
      currentAnims = saved.animations;
    }

    // Authored identity wrapper (`AnimatedPivot`) and importer `sourceAsset` metadata are NEVER unwrapped on export (F10)!
    const pivot = new T.Group(); pivot.name = 'AnimatedPivot';
    const childComp = composeAsset({ name: 'InnerComp', parts: [{ id: 'b', object: makeBox('B', [0.4, 0.4, 0.4]) }] });
    pivot.add(childComp);
    pivot.animations = [new T.AnimationClip('SlidePivot', 1, [new T.VectorKeyframeTrack('AnimatedPivot.position', [0, 1], [0, 0, 0, 1, 0, 0])])];
    const pivotGlb = await roundTripGlb(pivot);
    expect(pivotGlb.gltfJson.animations?.[0]?.channels?.length).toBe(1);

    const metaWrapper = new T.Group();
    metaWrapper.userData.sourceAsset = { id: 'poly-123' };
    metaWrapper.add(composeAsset({ name: 'MetaInner', parts: [{ id: 'b', object: makeBox('B', [0.4, 0.4, 0.4]) }] }));
    const metaSnap = cloneForExport(metaWrapper);
    expect((metaSnap.root.userData.sourceAsset as { id?: string } | undefined)?.id).toBe('poly-123');
    metaSnap.dispose();
  });

  it('keeps setChildParams atomic when replacement declares missing posed node, preserves default-label decals, and avoids live manifest writes during Stage 1 failure (F4)', () => {
    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const makeDoorHost = (includeDoorNode: boolean, withBrokenNested = false) => {
      const g = makeBox('DoorHost', [1, 1, 1], {
        riggedParts: [{ name: 'Door', label: 'Door', type: 'rotate', axis: 'y', range: [0, 90] }],
        decals: [{ name: 'badge', at: [0, 0.5, 0.51], normal: [0, 0, 1], up: [0, 1, 0], size: [0.3, 0.1] }],
        surfaces: [{ name: 'Top', label: 'Top', at: [0, 1, 0], normal: [0, 1, 0], size: [1, 1], clearanceY: 2 }],
        ...(withBrokenNested ? { children: [{ id: 'bad', label: 'Bad', slotNode: 'MissingSlot', mount: { coupling: 'weld' as const }, capabilities: { version: 1 as const, name: 'Bad', riggedParts: [], detachableParts: [], nightZones: [], decals: [] } }] } : {}),
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
    // Enable default-label decals (empty decalText!) and verify Stage 1 failure does NOT mutate comp.userData.formFoundry.
    ctrl.child('host').setDecalsVisible(true);
    const manifestBeforeFailure: unknown = comp.userData.formFoundry;
    expect(() => ctrl.setChildParams('host', {}, () => makeDoorHost(true, true))).toThrow('MissingSlot');
    expect(comp.userData.formFoundry).toBe(manifestBeforeFailure);

    const depSlot = comp.getObjectByName('Slot_dep');
    ctrl.setChildParams('host', {}, () => makeDoorHost(false));
    expect(depSlot?.parent).toBeTruthy();
    expect(ctrl.child('host').areDecalsVisible()).toBe(true);
    ctrl.dispose();
  });

  it('resolves scaled attachNode, attachNode+surface, and posed-boom rebuild rest pose in headless JSON placement checks (F8)', () => {
    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const makeScaledCrane = () => {
      const crane = makeBox('Crane', [1, 1, 1], {
        riggedParts: [{ name: 'Boom', label: 'Boom', type: 'slide', axis: 'x', range: [0, 4] }],
        surfaces: [{ name: 'Pad', label: 'Pad', at: [5, 1, 0], normal: [0, 1, 0], size: [4, 2], clearanceY: 2 }],
      });
      const boom = new T.Group(); boom.name = 'Boom'; boom.position.set(5, 0, 0); boom.scale.set(2, 1, 1);
      crane.add(boom);
      return crane;
    };
    const rig = composeAsset({
      name: 'Scaled Crane Load',
      buildRecipe: makeScaledCrane,
      parts: [
        { id: 'crane', recipe: baseRecipe },
        { id: 'load', object: makeBox('Load', [0.4, 0.4, 0.4]), mount: { parent: 'crane', attachNode: 'Boom', at: [1, 0, 0], coupling: 'weld' } },
      ],
    });
    const wallCaps = inspectAsset(makeBox('Wall', [0.3, 2, 2]));
    // Boom at x=5, scale.x=2, load local at x=1 -> world x=7 (hits wall at x=7, clears x=6!).
    expect(validateScenePlacement([{ id: 'rig', capabilities: inspectAsset(rig) }, { id: 'wall', capabilities: wallCaps, position: [7, 0, 0] }]).valid).toBe(false);
    // Open Boom by +3 (to x=8), rebuild crane, close Boom back to rest (x=5) -> headless JSON MUST still be at x=7 (NOT baked at x=8/10)!
    const ctrl = createCompositeController(rig);
    ctrl.setPart('crane/Boom', 3);
    ctrl.setChildParams('crane', {}, makeScaledCrane);
    ctrl.closePart('crane/Boom');
    const rebuiltCaps = ctrl.syncManifest();
    expect(validateScenePlacement([{ id: 'rig', capabilities: rebuiltCaps }, { id: 'wall', capabilities: wallCaps, position: [7, 0, 0] }]).valid).toBe(false);
    expect(validateScenePlacement([{ id: 'rig', capabilities: rebuiltCaps }, { id: 'wall', capabilities: wallCaps, position: [10, 0, 0] }]).valid).toBe(true);
    ctrl.dispose();
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
      physics: { body: 'dynamic', massKg: 40 },
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

    // Reload binary GLB (primary deck is DYNAMIC!) and verify locked `physicsBody: 'static'` survives reload + legacy override!
    const glb = await roundTripGlb(house, undefined, ctrl);
    ctrl.dispose();
    const reloaded = createCompositeController(glb.scene, undefined, glb.animations);
    const afterReloadRebuild = reloaded.setChildParams('room/leaf', {}, () => makeInnerLeaf('PostReload', 0, 'dynamic'));
    expect(afterReloadRebuild.physics?.body).toBe('static');
    expect(computeCompositeBodies(afterReloadRebuild)[0]?.body).toBe('static');
    // Nested rebuild >256-char full outer qualified clip name throws cleanly without detaching!
    expect(() => reloaded.setChildParams('room/leaf', {}, () => makeInnerLeaf('q'.repeat(250), 0, 'dynamic'))).toThrow(/exceeds maximum length/);
    reloaded.dispose();

    // Legacy 8dc84b7 GLB using `userData.physicsBodyOverride` without `physics.locked` still preserves static lock on rebuild (F11).
    const legacy = composeAsset({
      name: 'Legacy Locked',
      buildRecipe: () => makeInnerLeaf('L', 0, 'dynamic'),
      parts: [{ id: 'leaf', recipe: baseRecipe }],
    });
    const legCaps = readCapabilities(legacy);
    if (legCaps?.physics) {
      legCaps.physics = { body: 'static', massKg: 10 };
      writeCapabilities(legacy, legCaps);
    }
    legacy.userData.physicsBodyOverride = 'static';
    const legCtrl = createCompositeController(legacy);
    const legAfter = legCtrl.setChildParams('leaf', {}, () => makeInnerLeaf('L2', 0, 'dynamic'));
    expect(legAfter.physics?.body).toBe('static');
    legCtrl.dispose();
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

    // 2. Hidden root detachable AND rigged Brace under hidden non-root Rack both pass placement & sweep BEFORE init (F7).
    const rackHost = makeBox('RackHost', [0.4, 0.4, 0.4], {
      riggedParts: [{ name: 'Brace', label: 'Brace', type: 'rotate', axis: 'y', range: [0, 90] }],
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

    // Hidden asset root itself as detachable part: BraceCol inside hidden root Rack passes before init too!
    const rootDetach = makeBox('Rack', [0.2, 0.2, 0.2], {
      detachableParts: [{ name: 'Rack', label: 'Rack' }],
      colliders: [{ name: 'BraceCol', shape: 'box', at: [0, 0.2, 0.5], size: [0.3, 0.3, 0.5], node: 'Brace', restPose: { at: [0, 0.2, 0.5] }, layer: 'solid' }],
    });
    const b2 = new T.Group(); b2.name = 'Brace'; b2.add(new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.5), new T.MeshStandardMaterial()));
    rootDetach.add(b2);
    const hiddenRootComp = composeAsset({
      name: 'Hidden Root Detach',
      parts: [
        { id: 'r', object: rootDetach },
        { id: 'w', object: makeBox('Wall', [0.4, 0.6, 0.2]), mount: { at: [0, 0, 0.6], coupling: 'surface' } },
      ],
    });
    const hrCtrl = createCompositeController(hiddenRootComp);
    hrCtrl.setVisible('r/Rack', false);
    const hrGlb = await roundTripGlb(hiddenRootComp, undefined, hrCtrl);
    hrCtrl.dispose();
    expect(validateComposite(hrGlb.scene).valid).toBe(true);

    // 3. Unscoped (`scopeNames: false`) mounted child door & duplicate `.position` tracks export distinct target indices,
    // and dependent rebuild (`a__b` mounted under `a`) scans reattached dependent names too (F9).
    const makeDoorUnit = (doorFirst = false) => {
      const g = new T.Group(); g.name = 'Unit';
      const frame = new T.Group(); frame.name = 'Frame';
      const door = new T.Group(); door.name = 'Door';
      door.add(new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), new T.MeshStandardMaterial()));
      if (doorFirst) g.add(door, frame);
      else g.add(frame, door);
      g.animations = [
        new T.AnimationClip('Swing', 1, [
          new T.VectorKeyframeTrack('Door.position', [0, 1], [0, 0, 0, 0, 0.5, 0]),
          new T.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 0.5, 0, 0]),
        ]),
      ];
      return g;
    };
    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const unscopedMounted = composeAsset({
      name: 'Unscoped Mounted',
      scopeNames: false,
      buildRecipe: () => makeDoorUnit(false),
      parts: [
        { id: 'outer', recipe: baseRecipe },
        { id: 'inner', object: makeDoorUnit(false), mount: { parent: 'outer', attachNode: 'Frame', at: [1, 0, 0] } },
      ],
    });
    const uGlb = await roundTripGlb(unscopedMounted);
    const outerCh = uGlb.gltfJson.animations?.find(a => a.name === 'outer: Swing')?.channels ?? [];
    const innerCh = uGlb.gltfJson.animations?.find(a => a.name === 'inner: Swing')?.channels ?? [];
    expect(outerCh[0]?.target?.node).not.toBe(innerCh[0]?.target?.node);
    expect(outerCh[1]?.target?.node).not.toBe(innerCh[1]?.target?.node);
    // After GLB reload + rebuild changing DFS order (Door before Frame), re-export STILL keeps distinct targets (F9)!
    const uReloadCtrl = createCompositeController(uGlb.scene, undefined, uGlb.animations);
    uReloadCtrl.setChildParams('outer', {}, () => makeDoorUnit(true));
    const uGlb2 = await roundTripGlb(uGlb.scene, undefined, uReloadCtrl);
    uReloadCtrl.dispose();
    const outerCh2 = uGlb2.gltfJson.animations?.find(a => a.name === 'outer: Swing')?.channels ?? [];
    const innerCh2 = uGlb2.gltfJson.animations?.find(a => a.name === 'inner: Swing')?.channels ?? [];
    expect(outerCh2[0]?.target?.node).not.toBe(innerCh2[0]?.target?.node);

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

    const firstPartParent = new T.Group();
    const firstPart = makeBox('FirstPart', [0.3, 0.3, 0.3]);
    firstPartParent.add(firstPart);
    const longClipHost = makeBox('ClipHost', [0.2, 0.2, 0.2]);
    longClipHost.animations = [new T.AnimationClip('c'.repeat(250), 1, [])];
    expect(() => composeAsset({
      name: 'Multi Part Fail',
      parts: [
        { id: 'first', object: firstPart },
        { id: 'longprefix', object: longClipHost },
      ],
    })).toThrow(/exceeds maximum length/);
    // First caller object was NOT renamed, stripped, or moved out of its original parent when second part failed (F15)!
    expect(firstPart.name).toBe('FirstPart');
    expect(firstPart.parent).toBe(firstPartParent);
    expect(readCapabilities(firstPart)?.name).toBe('FirstPart');
  });
});
