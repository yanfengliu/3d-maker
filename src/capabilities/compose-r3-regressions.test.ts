import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { resolveVariationRecipe } from '../data/recipe';
import { buildModel } from '../models';
import { cloneForExport, type ExportOptions } from '../studio/export';
import { composeAsset, validateComposite } from './compose';
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
    version: 1, name, riggedParts: [], detachableParts: [], nightZones: [], decals: [],
    colliders: [{ name: 'Body', shape: 'box', at: [0, size[1] * 0.5, 0], size, layer: 'solid' }],
    ...extra,
  });
  return root;
}

describe('Round 3-5 composition regression suite', () => {
  it('preserves rest pose across pose/playClips/rebuilds/Euler playback, sheared matrix, and socket fallback (F8)', async () => {
    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const makeCrane = () => {
      const crane = makeBox('Crane', [1, 1, 1], {
        riggedParts: [{ name: 'Boom', label: 'Boom', type: 'slide', axis: 'x', range: [0, 4] }],
        surfaces: [{ name: 'Pad', label: 'Pad', at: [5, 1, 0], normal: [0, 1, 0], size: [4, 2], clearanceY: 2 }],
      });
      const boom = new T.Group(); boom.name = 'Boom'; boom.position.set(5, 0, 0); boom.scale.set(2, 1, 1);
      crane.add(boom);
      return crane;
    };
    const makeLoad = () => makeBox('Load', [0.4, 0.4, 0.4]);

    // 1. Rebuild the LOAD while Boom is open at x=8 -> slotRestPose MUST stay at rest x=7 (not x=10)!
    const rig = composeAsset({
      name: 'Crane With Recipe Load',
      buildRecipe: r => (r.name === 'crane' ? makeCrane() : makeLoad()),
      parts: [
        { id: 'crane', recipe: { ...baseRecipe, name: 'crane' } },
        { id: 'load', recipe: { ...baseRecipe, name: 'load' }, mount: { parent: 'crane', attachNode: 'Boom', at: [1, 0, 0], coupling: 'weld' } },
      ],
    });
    const wallCaps = inspectAsset(makeBox('Wall', [0.3, 2, 2]));
    const ctrl = createCompositeController(rig);
    ctrl.setPart('crane/Boom', 3);
    ctrl.setChildParams('load', {}, makeLoad);
    ctrl.closePart('crane/Boom');
    const capsAfter = ctrl.syncManifest();
    expect(validateScenePlacement([{ id: 'rig', capabilities: capsAfter }, { id: 'wall', capabilities: wallCaps, position: [7, 0, 0] }]).valid).toBe(false);
    expect(validateScenePlacement([{ id: 'rig', capabilities: capsAfter }, { id: 'wall', capabilities: wallCaps, position: [10, 0, 0] }]).valid).toBe(true);
    ctrl.dispose();

    // 1b. Rebuilding the LOAD while Boom is moved by `playClips` (not manual setPart) STILL records rest x=7, not animated x=10!
    const makeAnimCrane = () => {
      const crane = makeCrane();
      crane.animations = [new T.AnimationClip('OpenBoom', 1, [new T.VectorKeyframeTrack('Boom.position', [0, 1], [5, 0, 0, 8, 0, 0])])];
      return crane;
    };
    const animRig = composeAsset({
      name: 'Animated Crane With Load',
      buildRecipe: r => (r.name === 'crane' ? makeAnimCrane() : makeLoad()),
      parts: [
        { id: 'crane', recipe: { ...baseRecipe, name: 'crane' } },
        { id: 'load', recipe: { ...baseRecipe, name: 'load' }, mount: { parent: 'crane', attachNode: 'Boom', at: [1, 0, 0], coupling: 'weld' } },
      ],
    });
    const animCtrl = createCompositeController(animRig);
    animCtrl.playClips([{ childId: 'crane', clip: 'OpenBoom', loop: false }]);
    animCtrl.update(1);
    animCtrl.setChildParams('load', {}, makeLoad);
    animCtrl.stopClips();
    const animCapsAfter = animCtrl.syncManifest();
    expect(validateScenePlacement([{ id: 'rig', capabilities: animCapsAfter }, { id: 'wall', capabilities: wallCaps, position: [7, 0, 0] }]).valid).toBe(false);
    expect(validateScenePlacement([{ id: 'rig', capabilities: animCapsAfter }, { id: 'wall', capabilities: wallCaps, position: [10, 0, 0] }]).valid).toBe(true);
    // 1c. Rebuilding host from a GLB saved with Boom posed by 3 + rebuilding load while Boom.rotation[y] plays!
    const posedCrane = makeCrane();
    const posedCaps = readCapabilities(posedCrane);
    if (posedCaps) { posedCaps.state = { pose: { Boom: 3 } }; writeCapabilities(posedCrane, posedCaps); }
    const boomNode = posedCrane.getObjectByName('Boom');
    if (boomNode) boomNode.position.x += 3;
    const posedCraneGlb = await roundTripGlb(posedCrane);
    const rotCrane = () => {
      const c = makeCrane();
      c.animations = [new T.AnimationClip('SpinBoom', 1, [new T.NumberKeyframeTrack('Boom.rotation[y]', [0, 1], [0, Math.PI * 1.5])])];
      return c;
    };
    const rebuiltRig = composeAsset({
      name: 'Posed Rebuild Rig',
      buildRecipe: r => (r.name === 'crane' ? rotCrane() : makeLoad()),
      parts: [
        { id: 'crane', recipe: { ...baseRecipe, name: 'crane' } },
        { id: 'load', recipe: { ...baseRecipe, name: 'load' }, mount: { parent: 'crane', attachNode: 'Boom', at: [1, 0, 0], coupling: 'weld' } },
      ],
    });
    const rCtrl = createCompositeController(rebuiltRig);
    rCtrl.setChildParams('crane', {}, () => posedCraneGlb.scene.clone(true));
    rCtrl.setChildParams('load', {}, makeLoad);
    rCtrl.closePart('crane/Boom');
    const rCaps = rCtrl.syncManifest();
    expect(validateScenePlacement([{ id: 'rig', capabilities: rCaps }, { id: 'wall', capabilities: wallCaps, position: [7, 0, 0] }]).valid).toBe(false);
    expect(validateScenePlacement([{ id: 'rig', capabilities: rCaps }, { id: 'wall', capabilities: wallCaps, position: [10, 0, 0] }]).valid).toBe(true);
    rCtrl.dispose();
    const eulerRig = composeAsset({
      name: 'Euler Playback Rig',
      buildRecipe: r => (r.name === 'crane' ? rotCrane() : makeLoad()),
      parts: [
        { id: 'crane', recipe: { ...baseRecipe, name: 'crane' } },
        { id: 'load', recipe: { ...baseRecipe, name: 'load' }, mount: { parent: 'crane', attachNode: 'Boom', at: [1, 0, 0], coupling: 'weld' } },
      ],
    });
    const eCtrl = createCompositeController(eulerRig);
    eCtrl.playClips([{ childId: 'crane', clip: 'SpinBoom', loop: false }]);
    eCtrl.update(0.8);
    eCtrl.setChildParams('load', {}, makeLoad);
    eCtrl.update(0.1);
    expect(eulerRig.getObjectByName('crane__Boom')?.rotation.y).toBeCloseTo(Math.PI * 1.5 * 0.9, 2);
    eCtrl.dispose();

    // 2. Combined attachNode (scale [2,1,1]) + surface + 45 deg rotation preserves exact sheared matrix in headless mode!
    const shearedRig = composeAsset({
      name: 'Sheared Surface Load',
      parts: [
        { id: 'crane', object: makeCrane() },
        { id: 'load', object: makeBox('Block', [1, 1, 1]), mount: { parent: 'crane', attachNode: 'Boom', surface: 'Pad', rotation: [0, Math.PI / 4, 0], coupling: 'surface' } },
      ],
    });
    const probe = makeBox('Probe', [0.05, 0.05, 0.05]);
    probe.position.set(6.2, 1.5, 0);
    expect(validateScenePlacement([{ id: 'rig', object: shearedRig }, { id: 'p', object: probe }]).valid).toBe(false);
    expect(validateScenePlacement([{ id: 'rig', capabilities: inspectAsset(shearedRig) }, { id: 'p', capabilities: inspectAsset(probe), position: [6.2, 1.5, 0] }]).valid).toBe(false);

    // 3. 480fc1ae manifest without slotRestPose (attachRestPose y=2 + surface y=2) does NOT double-apply y=2 -> y=4.2!
    const hostWithSocket = makeBox('Host', [2, 2, 1], {
      surfaces: [{ name: 'Top', label: 'Top', at: [0, 2, 0], normal: [0, 1, 0], size: [2, 1], clearanceY: 2 }],
    });
    const socket = new T.Group(); socket.name = 'Socket'; socket.position.set(0, 2, 0);
    hostWithSocket.add(socket);
    const sockComp = composeAsset({
      name: 'Socket Surface',
      parts: [
        { id: 'host', object: hostWithSocket },
        { id: 'lamp', object: makeBox('Lamp', [0.4, 0.4, 0.4]), mount: { parent: 'host', attachNode: 'Socket', surface: 'Top', coupling: 'surface' } },
      ],
    });
    const legacyCaps = inspectAsset(sockComp);
    if (legacyCaps.children?.[1]?.mount) delete legacyCaps.children[1].mount.slotRestPose;
    const lampVol = resolveAssetVolumes({ id: 's', capabilities: legacyCaps }).find(v => v.name === 'lamp/Body');
    expect(lampVol?.center[1]).toBeCloseTo(2.2, 2);
  });

  it('keeps AuxScene node count constant across 6 consecutive saves and preserves authored root-relative Scene animations (F10)', async () => {
    const comp = composeAsset({
      name: 'Constant Nodes',
      buildRecipe: buildModel,
      parts: [{ id: 'pod', recipe: resolveVariationRecipe('cargo-pod') }],
    });
    let currentScene = comp;
    let currentAnims = comp.animations;
    let firstNodeCount = 0;
    for (let gen = 1; gen <= 6; gen++) {
      const ctrl = gen > 1 ? createCompositeController(currentScene, undefined, currentAnims) : undefined;
      const saved = await roundTripGlb(currentScene, undefined, ctrl);
      ctrl?.dispose();
      const count = saved.gltfJson.nodes?.length ?? 0;
      if (gen === 1) firstNodeCount = count;
      else expect(count, `gen ${String(gen)} node count`).toBe(firstNodeCount);
      currentScene = saved.scene;
      currentAnims = saved.animations;
    }

    // Authored group named `Scene` with root-relative `.position` track must NOT unwrap onto its offset child `Inner`!
    const authoredScene = new T.Group(); authoredScene.name = 'Scene';
    const inner = composeAsset({ name: 'Inner', parts: [{ id: 'b', object: makeBox('B', [0.3, 0.3, 0.3]) }] });
    inner.position.set(4, 0, 0);
    authoredScene.add(inner);
    authoredScene.animations = [
      new T.AnimationClip('ShiftScene', 1, [new T.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 1, 0, 0])]),
    ];
    const savedAuthored = await roundTripGlb(authoredScene);
    const mixer = new T.AnimationMixer(savedAuthored.scene);
    const clip = savedAuthored.animations[0];
    if (!clip) throw new Error('Expected clip');
    mixer.clipAction(clip).play();
    mixer.update(0.5);
    savedAuthored.scene.updateMatrixWorld(true);
    const innerNode = savedAuthored.scene.getObjectByName('Inner');
    const worldPos = new T.Vector3();
    innerNode?.getWorldPosition(worldPos);
    expect(worldPos.x).toBeCloseTo(4.5, 2);

    // Unanimated Scene & credited Scene wrapping AuxScene owning ShiftScene (.position) MUST keep ShiftScene!
    for (const withCredit of [false, true]) {
      const outer = new T.Group(); outer.name = 'Scene';
      if (withCredit) outer.userData.credit = 'test';
      const aux = new T.Group(); aux.name = 'AuxScene';
      const inner2 = composeAsset({ name: 'Inner', parts: [{ id: 'b', object: makeBox('B', [0.3, 0.3, 0.3]) }] });
      inner2.position.set(4, 0, 0);
      aux.add(inner2);
      aux.animations = [new T.AnimationClip('ShiftScene', 1, [new T.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 1, 0, 0])])];
      outer.add(aux);
      const saved = await roundTripGlb(outer);
      expect(saved.animations.length).toBe(1);
      const m = new T.AnimationMixer(saved.scene);
      const c = saved.animations[0];
      if (!c) throw new Error('Expected ShiftScene clip');
      m.clipAction(c).play(); m.update(0.5); saved.scene.updateMatrixWorld(true);
      const wp = new T.Vector3(); saved.scene.getObjectByName('Inner')?.getWorldPosition(wp);
      expect(wp.x).toBeCloseTo(4.5, 2);
    }
  });

  it('suppresses hidden carried colliders & hidden root Body before init, rebinds slash clips, keeps nested legacy static lock, and rejects duplicate object reuse cleanly (F7, F9, F11, F15)', async () => {
    // 1. Carried Brace inside hidden Rack on sliding Boom AND hidden root Body collider both pass BEFORE controller init (F7)!
    const cab = makeBox('Cab', [1, 0.8, 0.6], {
      riggedParts: [{ name: 'Boom', label: 'Boom', type: 'slide', axis: 'z', range: [0, 0.6] }],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0.4, 0], size: [1, 0.8, 0.6], layer: 'solid' }],
    });
    const boom = new T.Group(); boom.name = 'Boom'; boom.position.set(0, 0.4, 0.31);
    boom.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), new T.MeshStandardMaterial()));
    cab.add(boom);

    const payload = makeBox('Rack', [0.2, 0.2, 0.2], {
      detachableParts: [{ name: 'Rack', label: 'Rack' }],
      colliders: [
        { name: 'Body', shape: 'box', at: [0, 0.1, 0], size: [0.2, 0.2, 0.2], layer: 'solid' },
        { name: 'BraceCol', shape: 'box', at: [0, 0.1, 0.4], size: [0.3, 0.3, 0.5], node: 'Brace', restPose: { at: [0, 0.1, 0.4] }, layer: 'solid' },
      ],
    });
    const brace = new T.Group(); brace.name = 'Brace';
    brace.add(new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.5), new T.MeshStandardMaterial()));
    payload.add(brace);

    const carriedComp = composeAsset({
      name: 'Hidden Carried Sweep',
      parts: [
        { id: 'cab', object: cab },
        { id: 'load', object: payload, mount: { parent: 'cab', attachNode: 'Boom', at: [0, 0, 0.1], coupling: 'weld' } },
        { id: 'wall', object: makeBox('Wall', [0.4, 1, 0.2]), mount: { at: [0, 0, 1.15], coupling: 'surface' } },
      ],
    });
    // While Rack is visible, carried Brace hits Wall at z=1.15 (while Boom itself clears at z<=0.96).
    expect(validateComposite(carriedComp).valid).toBe(false);
    const cCtrl = createCompositeController(carriedComp);
    cCtrl.setVisible('load/Rack', false);
    expect(validateComposite(carriedComp).valid).toBe(true);
    const cGlb = await roundTripGlb(carriedComp, undefined, cCtrl);
    cCtrl.dispose();
    // BEFORE controller creation on reloaded GLB, hidden root Body AND hidden carried Brace must NOT block sweep or placement!
    expect(validateComposite(cGlb.scene).valid).toBe(true);
    // Manifest-only (headless) volume resolution of the hidden Rack must ALSO suppress load/Body and load/BraceCol!
    const headlessVols = resolveAssetVolumes({ id: 'h', capabilities: inspectAsset(cGlb.scene) });
    expect(headlessVols.some(v => v.name.startsWith('load/'))).toBe(false);
    // Standalone hidden Rack saved to GLB (wrapped in AuxScene) and mounted fresh in a composite must ALSO stay suppressed!
    const standaloneRack = makeBox('Rack', [0.2, 0.2, 0.2], {
      detachableParts: [{ name: 'Rack', label: 'Rack' }],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0.1, 0], size: [0.2, 0.2, 0.2], layer: 'solid' }],
      state: { hiddenParts: ['Rack'] },
    });
    const rackGlb = await roundTripGlb(standaloneRack);
    const cab2 = makeBox('Cab', [1, 0.8, 0.6], {
      riggedParts: [{ name: 'Boom', label: 'Boom', type: 'slide', axis: 'z', range: [0, 0.6] }],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0.4, 0], size: [1, 0.8, 0.6], layer: 'solid' }],
    });
    const boom2 = new T.Group(); boom2.name = 'Boom'; boom2.position.set(0, 0.4, 0.31);
    cab2.add(boom2);
    const wrappedHiddenComp = composeAsset({
      name: 'Wrapped Hidden Rack',
      parts: [
        { id: 'cab', object: cab2 },
        { id: 'rack', object: rackGlb.scene, mount: { parent: 'cab', attachNode: 'Boom', at: [0, 0, 0.1], coupling: 'weld' } },
        { id: 'wall', object: makeBox('Wall', [0.4, 1, 0.2]), mount: { at: [0, 0, 1.1], coupling: 'surface' } },
      ],
    });
    expect(validateComposite(wrappedHiddenComp).valid).toBe(true);
    // Visible Chassis with display name "Rack" + hidden child "Rack" must NOT suppress Chassis collider; renamed hidden root MUST stay suppressed headless!
    const chassis = makeBox('Chassis', [0.8, 0.8, 0.8], {
      name: 'Rack',
      detachableParts: [{ name: 'Rack', label: 'Rack' }],
      colliders: [
        { name: 'Body', shape: 'box', at: [0, 0.4, 0], size: [0.8, 0.8, 0.8], layer: 'solid' },
        { name: 'RackCol', shape: 'box', at: [0, 0.9, 0], size: [0.2, 0.2, 0.2], node: 'Rack', restPose: { at: [0, 0.9, 0] }, layer: 'solid' },
      ],
      state: { hiddenParts: ['Rack'] },
    });
    const childRack = new T.Group(); childRack.name = 'Rack';
    chassis.add(childRack);
    const wallAtChassis = makeBox('Wall', [0.4, 0.8, 0.4]);
    expect(validateScenePlacement([{ id: 'c', object: chassis }, { id: 'w', object: wallAtChassis }]).valid).toBe(false);
    expect(validateScenePlacement([{ id: 'c', capabilities: inspectAsset(chassis) }, { id: 'w', capabilities: inspectAsset(wallAtChassis) }]).valid).toBe(false);
    const renamedHidden = makeBox('Rack', [0.2, 0.2, 0.2], {
      name: 'Cargo Display',
      detachableParts: [{ name: 'Rack', label: 'Rack' }],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0.1, 0], size: [0.2, 0.2, 0.2], layer: 'solid' }],
      state: { hiddenParts: ['Rack'] },
    });
    const rhComp = composeAsset({ name: 'Renamed Hidden', parts: [{ id: 'load', object: renamedHidden }] });
    expect(resolveAssetVolumes({ id: 'rh', capabilities: inspectAsset(rhComp) }).some(v => v.name.startsWith('load/'))).toBe(false);

    // 2. Slash-qualified unscoped clips (`inner/Swing`) rebind to distinct targets after reload + DFS-order rebuild (F9)!
    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const makeDoorUnit = (doorFirst = false) => {
      const g = new T.Group(); g.name = 'Unit';
      const frame = new T.Group(); frame.name = 'Frame';
      const door = new T.Group(); door.name = 'Door';
      door.add(new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), new T.MeshStandardMaterial()));
      if (doorFirst) g.add(door, frame); else g.add(frame, door);
      g.animations = [new T.AnimationClip('Swing', 1, [new T.VectorKeyframeTrack('Door.position', [0, 1], [0, 0, 0, 0, 0.5, 0])])];
      return g;
    };
    const slashComp = composeAsset({
      name: 'Slash Unscoped',
      scopeNames: false,
      buildRecipe: () => makeDoorUnit(false),
      parts: [
        { id: 'outer', recipe: baseRecipe },
        { id: 'inner', object: makeDoorUnit(false), mount: { parent: 'outer', attachNode: 'Frame', at: [1, 0, 0] } },
      ],
    });
    // Rewrite inner clip name to supported slash spelling `inner/Swing` and round-trip + rebuild!
    const innerClip = slashComp.animations.find(c => c.name === 'inner: Swing');
    if (innerClip) innerClip.name = 'inner/Swing';
    const sGlb1 = await roundTripGlb(slashComp);
    const sCtrl = createCompositeController(sGlb1.scene, undefined, sGlb1.animations);
    sCtrl.setChildParams('outer', {}, () => makeDoorUnit(true));
    const sGlb2 = await roundTripGlb(sGlb1.scene, undefined, sCtrl);
    sCtrl.dispose();
    const outerTarget = sGlb2.gltfJson.animations?.find(a => a.name === 'outer: Swing')?.channels?.[0]?.target?.node;
    const innerTarget = sGlb2.gltfJson.animations?.find(a => a.name === 'inner/Swing')?.channels?.[0]?.target?.node;
    expect(outerTarget).toBeDefined();
    expect(innerTarget).toBeDefined();
    expect(outerTarget).not.toBe(innerTarget);

    // 2b. Nesting a fresh slash-qualified pair under `room` (`room: inner/Swing`) STILL rebinds to distinct doors after reload + rebuild (F9)!
    const slashComp2 = composeAsset({
      name: 'Slash Unscoped 2',
      scopeNames: false,
      buildRecipe: () => makeDoorUnit(false),
      parts: [
        { id: 'outer', recipe: baseRecipe },
        { id: 'inner', object: makeDoorUnit(false), mount: { parent: 'outer', attachNode: 'Frame', at: [1, 0, 0] } },
      ],
    });
    const innerClip2 = slashComp2.animations.find(c => c.name === 'inner: Swing');
    if (innerClip2) innerClip2.name = 'inner/Swing';
    const nestedSlash = composeAsset({
      name: 'Nested Slash Room',
      scopeNames: false,
      parts: [{ id: 'room', object: slashComp2 }],
    });
    const nsGlb1 = await roundTripGlb(nestedSlash);
    const nsCtrl = createCompositeController(nsGlb1.scene, undefined, nsGlb1.animations);
    nsCtrl.setChildParams('room/outer', {}, () => makeDoorUnit(true));
    const nsGlb2 = await roundTripGlb(nsGlb1.scene, undefined, nsCtrl);
    nsCtrl.dispose();
    const nsOuter = nsGlb2.gltfJson.animations?.find(a => a.name === 'room: outer: Swing')?.channels?.[0]?.target?.node;
    const nsInner = nsGlb2.gltfJson.animations?.find(a => a.name === 'room: inner/Swing')?.channels?.[0]?.target?.node;
    expect(nsOuter).toBeDefined();
    expect(nsInner).toBeDefined();
    expect(nsOuter).not.toBe(nsInner);

    // 3. Nesting a loaded legacy 8dc84b7 GLB preserves its static physics lock (F11)!
    const makeDynLeaf = () => makeBox('Leaf', [0.3, 0.3, 0.3], { physics: { body: 'dynamic', massKg: 10 } });
    const legacyRoom = composeAsset({
      name: 'Legacy Static Room',
      buildRecipe: makeDynLeaf,
      parts: [{ id: 'leaf', recipe: baseRecipe }],
    });
    const lrCaps = readCapabilities(legacyRoom);
    if (lrCaps?.physics) {
      lrCaps.physics = { body: 'static', massKg: 10 };
      writeCapabilities(legacyRoom, lrCaps);
    }
    legacyRoom.userData.physicsBodyOverride = 'static';
    const lrGlb = await roundTripGlb(legacyRoom);
    const outerWithLegacy = composeAsset({
      name: 'Outer Wrapping Legacy',
      parts: [{ id: 'room', object: lrGlb.scene }],
    });
    const nestCtrl = createCompositeController(outerWithLegacy);
    nestCtrl.setChildParams('room/leaf', {}, makeDynLeaf);
    expect(nestCtrl.childComposite('room')?.capabilities.physics?.body).toBe('static');
    nestCtrl.dispose();

    // 4. Rejecting duplicate object reuse AND unmanifested earlier object leaves caller objects & matrices untouched (F15)!
    const reusedParent = new T.Group();
    const reused = makeBox('Reused', [0.3, 0.3, 0.3]);
    reusedParent.add(reused);
    expect(() => composeAsset({
      name: 'Dup Object',
      parts: [
        { id: 'first', object: reused },
        { id: 'other', object: reused },
      ],
    })).toThrow(/reuses or overlaps/);
    expect(reused.name).toBe('Reused');
    expect(reused.parent).toBe(reusedParent);

    const rawUnmanifested = new T.Group();
    rawUnmanifested.name = 'Raw';
    rawUnmanifested.position.set(3, 0, 0);
    const matrixBefore = rawUnmanifested.matrixWorld.elements.slice();
    const badClipObj = makeBox('BadClip', [0.2, 0.2, 0.2]);
    badClipObj.animations = [new T.AnimationClip('k'.repeat(250), 1, [])];
    expect(() => composeAsset({
      name: 'Unmanifested Matrix Untouched',
      parts: [
        { id: 'raw', object: rawUnmanifested },
        { id: 'longprefix', object: badClipObj },
      ],
    })).toThrow(/exceeds maximum length/);
    expect(rawUnmanifested.matrixWorld.elements).toEqual(matrixBefore);

    // 4b. A later malformed track binding (`Door` with no `.property`) fails in pre-flight without mutating an earlier object (F15)!
    const intact = new T.Group();
    intact.name = 'Raw';
    intact.position.set(3, 0, 0);
    const intactMatrix = intact.matrixWorld.elements.slice();
    const badTrackObj = makeBox('BadTrack', [0.2, 0.2, 0.2]);
    badTrackObj.animations = [new T.AnimationClip('Bad', 1, [new T.VectorKeyframeTrack('Door', [0, 1], [0, 0, 0, 1, 0, 0])])];
    expect(() => composeAsset({
      name: 'Bad Track PreFlight',
      parts: [
        { id: 'first', object: intact },
        { id: 'second', object: badTrackObj },
      ],
    })).toThrow();
    expect(intact.name).toBe('Raw');
    expect(intact.parent).toBeNull();
    expect(intact.matrixWorld.elements).toEqual(intactMatrix);

    // 4c. Trailing-dot track (`Door.` on existing `Door` node) ALSO fails in pre-flight with zero mutation (F15)!
    const intact2 = new T.Group(); intact2.name = 'Raw'; intact2.position.set(3, 0, 0);
    const intactMatrix2 = intact2.matrixWorld.elements.slice();
    const dotTrackObj = makeBox('DotTrack', [0.2, 0.2, 0.2]);
    const doorNode = new T.Group(); doorNode.name = 'Door';
    dotTrackObj.add(doorNode);
    dotTrackObj.animations = [new T.AnimationClip('BadDot', 1, [new T.VectorKeyframeTrack('Door.', [0, 1], [0, 0, 0, 1, 0, 0])])];
    expect(() => composeAsset({
      name: 'Dot Track PreFlight',
      parts: [
        { id: 'first', object: intact2 },
        { id: 'second', object: dotTrackObj },
      ],
    })).toThrow();
    expect(intact2.name).toBe('Raw');
    expect(intact2.parent).toBeNull();
    expect(intact2.matrixWorld.elements).toEqual(intactMatrix2);
  });
});
