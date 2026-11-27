import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it, vi } from 'vitest';
import { resolveVariationRecipe, type Recipe } from '../data/recipe';
import { buildModel } from '../models';
import { createAsset } from '../sdk';
import { cloneForExport, type ExportOptions } from '../studio/export';
import { composeAsset, validateComposite } from './compose';
import { createCompositeController, type CompositeAssetController } from './compose-runtime';
import { parseCapabilities, readCapabilities, writeCapabilities, type AssetCapabilities } from './schema';

async function roundTripGlb(
  source: T.Group,
  options?: ExportOptions,
  controller?: CompositeAssetController | null,
) {
  const prevReader = (globalThis as { FileReader?: unknown }).FileReader;
  if (prevReader === undefined) {
    class NodeFileReader {
      result: ArrayBuffer | null = null;
      onloadend: (() => void) | null = null;
      readAsArrayBuffer(blob: Blob) {
        void blob.arrayBuffer().then(buf => {
          this.result = buf;
          this.onloadend?.();
        });
      }
    }
    (globalThis as { FileReader?: unknown }).FileReader = NodeFileReader;
  }
  try {
    const prepared = cloneForExport(source, options, controller);
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        prepared.root,
        result => {
          if (result instanceof ArrayBuffer) resolve(result);
          else reject(new Error('Expected binary GLB ArrayBuffer'));
        },
        reject,
        { binary: true, animations: prepared.root.animations, onlyVisible: true },
      );
    });
    prepared.dispose();
    const jsonLen = new DataView(glbBuffer).getUint32(12, true);
    const gltfJson = JSON.parse(new TextDecoder().decode(new Uint8Array(glbBuffer, 20, jsonLen))) as {
      nodes?: { name?: string; extras?: Record<string, unknown> }[];
      animations?: { name?: string; channels?: { target?: { node?: number; path?: string } }[] }[];
    };
    const loader = new GLTFLoader();
    const loaded = await new Promise<{ scene: T.Group; animations: T.AnimationClip[] }>((resolve, reject) => {
      loader.parse(glbBuffer, '', gltf => { resolve({ scene: gltf.scene, animations: gltf.animations }); }, reject);
    });
    return { ...loaded, gltfJson };
  } finally {
    if (prevReader === undefined) delete (globalThis as { FileReader?: unknown }).FileReader;
  }
}

function makeDoorBox(name: string, options: { withRack?: boolean; withDecal?: boolean; withNight?: boolean; massKg?: number } = {}): T.Group {
  const root = new T.Group();
  root.name = name;
  const bodyGeo = new T.BoxGeometry(0.6, 0.6, 0.6);
  if (options.withNight) {
    const count = bodyGeo.getAttribute('position').count;
    const c = new T.Color('#34322d');
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    bodyGeo.setAttribute('color', new T.BufferAttribute(cols, 3));
  }
  const body = new T.Mesh(bodyGeo, new T.MeshStandardMaterial({ color: '#c8c4b8', vertexColors: Boolean(options.withNight) }));
  body.position.set(0, 0.3, 0);
  root.add(body);

  const door = new T.Group();
  door.name = 'Door';
  door.position.set(0.3, 0, 0.31);
  const leaf = new T.Mesh(new T.BoxGeometry(0.56, 0.54, 0.03), new T.MeshStandardMaterial({ color: '#999' }));
  leaf.position.set(-0.28, 0.3, 0);
  door.add(leaf);
  root.add(door);

  const detachableParts: AssetCapabilities['detachableParts'] = [];
  if (options.withRack) {
    const rack = new T.Group();
    rack.name = 'Rack';
    const rMesh = new T.Mesh(new T.BoxGeometry(0.4, 0.04, 0.4), new T.MeshStandardMaterial({ color: '#777' }));
    rMesh.position.set(0, 0.25, 0);
    rack.add(rMesh);
    root.add(rack);
    detachableParts.push({ name: 'Rack', label: 'Rack' });
  }

  writeCapabilities(root, {
    version: 1,
    name,
    riggedParts: [{ name: 'Door', label: 'Door', type: 'rotate', axis: 'y', range: [0, 90] }],
    detachableParts,
    nightZones: options.withNight
      ? [{ name: 'pane', label: 'Pane', color: '#ffc46b', intensity: 0.9, albedo: '#34322d' }]
      : [],
    decals: options.withDecal
      ? [{ name: 'label', at: [0, 0.45, 0.31], normal: [0, 0, 1], up: [0, 1, 0], size: [0.3, 0.1] }]
      : [],
    physics: { body: 'dynamic', massKg: options.massKg ?? 12 },
    colliders: [
      { name: 'Body', shape: 'box', at: [0, 0.3, 0], size: [0.6, 0.6, 0.6], layer: 'solid' },
      ...(options.withRack ? [{ name: 'RackCol', shape: 'box' as const, at: [0, 0.25, 0] as [number, number, number], size: [0.4, 0.04, 0.4] as [number, number, number], node: 'Rack', restPose: { at: [0, 0.25, 0] as [number, number, number] }, layer: 'solid' as const }] : []),
    ],
  });
  return root;
}

describe('composite GLB clips, track scoping, nesting, export rest poses, and state fidelity', () => {
  it('plays GLB clips directly from GLTFLoader animations without mutating gltf.scene and deduplicates clip restarts (F0)', async () => {
    const comp = composeAsset({
      name: 'Pod Dock',
      buildRecipe: buildModel,
      parts: [{ id: 'pod', recipe: resolveVariationRecipe('cargo-pod') }],
    });
    const { scene, animations } = await roundTripGlb(comp, { includePartClips: true });
    expect(scene.animations.length).toBe(0);
    expect(animations.length).toBeGreaterThan(0);

    const ctrl = createCompositeController(scene, undefined, animations);
    const lid = scene.getObjectByName('pod__CaseLid');
    expect(lid).toBeDefined();

    // Play by clip name, advance, then restart cleanly (single active action, not blended duplicates) and play by index.
    const [a1] = ctrl.playClips([{ childId: 'pod', clip: 'Open case' }]);
    ctrl.update(0.6);
    const midAngle = lid ? new T.Quaternion().angleTo(lid.quaternion) : 0;
    expect(midAngle).toBeGreaterThan(0.2);

    const [a2] = ctrl.playClips([{ childId: 'pod', clip: 0 }]);
    expect(a2).toBeDefined();
    expect(a1?.isRunning()).toBe(false);
    ctrl.update(0.01);
    const restartedAngle = lid ? new T.Quaternion().angleTo(lid.quaternion) : 99;
    expect(restartedAngle).toBeLessThan(midAngle * 0.5);
    ctrl.dispose();
  });

  it('preserves UUID tracks, scopes child-root tracks, and isolates Object3D.clone() shared clips through binary GLB export (F1)', async () => {
    const proto = new T.Group();
    proto.name = 'Unit';
    const unnamed = new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), new T.MeshStandardMaterial());
    const arm = new T.Group();
    arm.name = 'Arm';
    proto.add(unnamed, arm);
    proto.animations = [
      new T.AnimationClip('Spin', 1, [
        new T.VectorKeyframeTrack('Arm.position', [0, 1], [0, 0, 0, 0, 1, 0]),
        new T.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 1, 0, 0]),
      ]),
    ];

    const sibA = proto.clone(true);
    const sibB = proto.clone(true);
    const uuidMesh = sibA.children[0];
    if (!uuidMesh) throw new Error('Expected unnamed child mesh');
    sibA.animations = [
      ...sibA.animations,
      new T.AnimationClip('UuidMove', 1, [
        new T.VectorKeyframeTrack(`${uuidMesh.uuid}.position`, [0, 1], [0, 0, 0, 0, 0.5, 0]),
      ]),
    ];

    const comp = composeAsset({
      name: 'Twin Units',
      parts: [
        { id: 'a', object: sibA, mount: { at: [-1, 0, 0] } },
        { id: 'b', object: sibB, mount: { at: [1, 0, 0] } },
      ],
    });

    // Ensure sibling B's track was NOT double-prefixed (`b__a__Arm.position`).
    const clipB = comp.animations.find(c => c.name === 'b: Spin');
    expect(clipB?.tracks.map(t => t.name)).toContain('b__Arm.position');
    expect(clipB?.tracks.map(t => t.name)).toContain('b__Unit.position');

    const { gltfJson, scene, animations } = await roundTripGlb(comp);
    const uuidClip = gltfJson.animations?.find(a => a.name === 'a: UuidMove');
    expect(uuidClip?.channels?.length).toBe(1);
    const spinAClip = gltfJson.animations?.find(a => a.name === 'a: Spin');
    const rootTargetNode = spinAClip?.channels?.find(ch => gltfJson.nodes?.[ch.target?.node ?? -1]?.name === 'a__Unit');
    expect(rootTargetNode).toBeDefined();

    const ctrl = createCompositeController(scene, undefined, animations);
    ctrl.playClips([{ childId: 'a', clip: 'Spin' }, { childId: 'b', clip: 'Spin' }]);
    ctrl.update(0.5);
    expect(scene.getObjectByName('a__Arm')?.position.y).toBeCloseTo(0.5, 2);
    expect(scene.getObjectByName('b__Arm')?.position.y).toBeCloseTo(0.5, 2);
    ctrl.dispose();
  });

  it('supports nested composites passed as object with scoped leaf paths, sweeps, and binary GLB round-trip (F2, F16)', async () => {
    const room = composeAsset({
      name: 'Storage Room',
      parts: [
        { id: 'pod', object: makeDoorBox('Locker', { withRack: true }), mount: { at: [0, 0, 0], coupling: 'surface' } },
      ],
    });
    const house = composeAsset({
      name: 'House Shell',
      parts: [
        { id: 'room', object: room },
        { id: 'shed', object: makeDoorBox('ShedBox'), mount: { at: [2.2, 0, 0], coupling: 'surface' } },
      ],
    });

    const validation = validateComposite(house);
    expect(validation.valid, JSON.stringify(validation)).toBe(true);
    expect(validation.sweeps['room/pod']?.checkedParts).toBe(1);
    expect(validation.sweeps.shed?.checkedParts).toBe(1);

    const ctrl = createCompositeController(house);
    expect(ctrl.openPart('room/pod/Door')).toBe(90);
    ctrl.setVisible('room/pod/Rack', false);

    // Export with includePartClips: true to verify nested child clips are synthesized too (F16).
    const { scene, animations, gltfJson } = await roundTripGlb(house, { includePartClips: true }, ctrl);
    ctrl.dispose();
    expect(gltfJson.animations?.some(a => a.name === 'room/pod: Open door')).toBe(true);
    expect(gltfJson.animations?.some(a => a.name === 'shed: Open door')).toBe(true);

    const reloaded = createCompositeController(scene, undefined, animations);
    expect(reloaded.getPart('room/pod/Door')).toBe(90);
    expect(reloaded.isVisible('room/pod/Rack')).toBe(false);
    reloaded.setVisible('room/pod/Rack', true);
    expect(reloaded.isVisible('room/pod/Rack')).toBe(true);
    expect(reloaded.closePart('room/pod/Door')).toBe(0);
    reloaded.dispose();
  });

  it('prevents mid-animation baking on export, syncs ctrl.child() mutations, and preserves a single manifest host (F3, F10)', async () => {
    const comp = composeAsset({
      name: 'Active Cargo Bay',
      buildRecipe: buildModel,
      parts: [
        { id: 'pod-a', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [-2.4, 0, 0] } },
        { id: 'pod-b', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [2.4, 0, 0] } },
      ],
    });
    const ctrl = createCompositeController(comp);
    // Advance pod-a 0.65s into its clip AND directly open pod-b through public ctrl.child('pod-b').
    ctrl.playClips([{ childId: 'pod-a', clip: 'Open case' }]);
    ctrl.update(0.65);
    ctrl.child('pod-b').openPart('CaseLid');

    // Export WITHOUT manually calling syncManifest() and WITHOUT passing ctrl!
    const { scene, animations, gltfJson } = await roundTripGlb(comp);
    ctrl.dispose();

    // Verify exactly ONE formFoundry manifest exists in the entire GLB JSON (no stale child duplicates).
    const manifestNodes = (gltfJson.nodes ?? []).filter(n => n.extras && 'formFoundry' in n.extras);
    expect(manifestNodes.length).toBe(1);

    const reloaded = createCompositeController(scene, undefined, animations);
    // pod-a was NOT baked at -1.161 rad; closing returns lid quaternion to exact rest (identity).
    reloaded.closePart('pod-a/CaseLid');
    const lidA = scene.getObjectByName('pod-a__CaseLid');
    expect(lidA ? new T.Quaternion().angleTo(lidA.quaternion) : 99).toBeLessThan(1e-3);

    // pod-b's direct child() edit survived export and closes cleanly back to rest.
    expect(reloaded.getPart('pod-b/CaseLid')).toBe(-72);
    reloaded.closePart('pod-b/CaseLid');
    const lidB = scene.getObjectByName('pod-b__CaseLid');
    expect(lidB ? new T.Quaternion().angleTo(lidB.quaternion) : 99).toBeLessThan(1e-3);

    // Extracting gltf.scene.children[0] still discovers the exact composite manifest (not child pod).
    const extracted = scene.children[0];
    if (!extracted) throw new Error('Expected exported root under gltf.scene');
    expect(readCapabilities(extracted)?.children?.map(c => c.id)).toEqual(['pod-a', 'pod-b']);
    expect(validateComposite(extracted).placement.checkedPairs).toBeGreaterThan(0);
    reloaded.dispose();
  });

  it('restores combined hiddenParts+night+decalText, isolates night overlays across child slots, and isolates scopeNames:false (F9, F13)', async () => {
    const parentLamp = makeDoorBox('ParentLamp', { withRack: true, withDecal: true, withNight: true });
    const childLamp = makeDoorBox('ChildLamp', { withRack: true, withDecal: true, withNight: true });

    const nested = composeAsset({
      name: 'Nested Lamps',
      scopeNames: false,
      parts: [
        { id: 'parent', object: parentLamp },
        { id: 'child', object: childLamp, mount: { parent: 'parent', at: [1.5, 0, 0], coupling: 'surface' } },
      ],
    });
    const ctrl = createCompositeController(nested);
    // Opening parent/Door with scopeNames:false must NOT rotate child/Door.
    ctrl.openPart('parent/Door');
    expect(ctrl.getPart('parent/Door')).toBe(90);
    expect(ctrl.getPart('child/Door')).toBe(0);
    // Turning night ON for parent must NOT create/show night overlays on child meshes.
    ctrl.setNight(true, 'parent');
    expect(ctrl.child('parent').isNight()).toBe(true);
    expect(ctrl.child('child').isNight()).toBe(false);
    let childVisibleOverlays = 0;
    childLamp.traverse(n => { if (n.userData.studioOverlay && n.visible) childVisibleOverlays++; });
    expect(childVisibleOverlays).toBe(0);

    // Set combined state (hiddenParts + night + decalText) on child, hide child's Rack, and GLB round-trip!
    ctrl.setVisible('child/Rack', false);
    ctrl.setNight(true, 'child');
    ctrl.child('child').setDecalsVisible(false, { label: 'UNIT-2' });

    const { scene } = await roundTripGlb(nested, undefined, ctrl);
    ctrl.dispose();
    const reloaded = createCompositeController(scene);
    expect(reloaded.isVisible('child/Rack')).toBe(false);
    expect(reloaded.child('child').isNight()).toBe(true);
    expect(reloaded.child('child').getState().decalText).toEqual({ label: 'UNIT-2' });
    reloaded.setVisible('child/Rack', true);
    expect(reloaded.isVisible('child/Rack')).toBe(true);
    reloaded.dispose();

    // Prefix collision guard: a/b__Door vs a__b/Door get distinct global node names.
    const box1 = makeDoorBox('B1');
    const bDoor = box1.getObjectByName('Door');
    if (bDoor) bDoor.name = 'b__Door';
    const box2 = makeDoorBox('B2');
    const collisionComp = composeAsset({
      name: 'Prefix Collision Guard',
      parts: [
        { id: 'a', object: box1 },
        { id: 'a__b', object: box2, mount: { at: [2, 0, 0] } },
      ],
    });
    const names = new Set<string>();
    let duplicateDoor = false;
    collisionComp.traverse(n => {
      if (n.name.endsWith('Door')) {
        if (names.has(n.name)) duplicateDoor = true;
        names.add(n.name);
      }
    });
    expect(duplicateDoor).toBe(false);
    expect(names.size).toBe(2);
  });

  it('keeps setChildParams transactional on failures, disposes only unshared resources, and updates root metadata (F4, F11, F12, F17)', () => {
    // 1. Throwing builder and missing attachNode leave grandchildren untouched in scene.
    const baseRecipe = resolveVariationRecipe('cargo-pod');
    const makeCraneHost = (withBoom: boolean, massKg = 50, height = 1.0): T.Group => {
      const g = new T.Group();
      g.name = 'CraneHost';
      const mesh = new T.Mesh(new T.BoxGeometry(1, height, 1), new T.MeshStandardMaterial());
      mesh.position.set(0, height * 0.5, 0);
      g.add(mesh);
      if (withBoom) {
        const boom = new T.Group();
        boom.name = 'Boom';
        boom.position.set(0, height, 0);
        g.add(boom);
      }
      writeCapabilities(g, {
        version: 1, name: 'CraneHost', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
        physics: { body: 'static', massKg },
        surfaces: [{ name: 'Top', label: 'Top', at: [0, height, 0], normal: [0, 1, 0], size: [1, 1], clearanceY: 2 }],
      });
      return g;
    };

    const payload = makeDoorBox('Payload');
    const craneComp = composeAsset({
      name: 'Crane Rig',
      buildRecipe: () => makeCraneHost(true, 50, 1.0),
      parts: [
        { id: 'crane', recipe: baseRecipe },
        { id: 'payload', object: payload, mount: { parent: 'crane', attachNode: 'Boom', surface: 'Top', coupling: 'surface' } },
      ],
    });
    const craneCtrl = createCompositeController(craneComp);
    const payloadSlot = craneComp.getObjectByName('Slot_payload');
    const origParent = payloadSlot?.parent;
    expect(origParent?.name).toBe('crane__Boom');

    expect(() => craneCtrl.setChildParams('crane', {}, () => { throw new Error('boom'); })).toThrow('boom');
    expect(payloadSlot?.parent).toBe(origParent);
    expect(() => craneCtrl.setChildParams('crane', {}, () => makeCraneHost(false, 60, 1.0))).toThrow('attachNode');
    expect(payloadSlot?.parent).toBe(origParent);

    // Identical rebuild preserves dependent child y = 1.000 AND updates mass/clips.
    const nextCaps = craneCtrl.setChildParams('crane', {}, () => makeCraneHost(true, 75, 1.0));
    expect(nextCaps.physics?.massKg).toBe(75);
    expect(new T.Box3().setFromObject(payload).min.y).toBeCloseTo(1.0, 2);
    craneCtrl.dispose();

    // 2. Ownership-aware disposal: shared geometry/material untouched; exclusive texture/material/geo disposed once.
    const sharedGeo = new T.BoxGeometry(0.4, 0.4, 0.4);
    const sharedMat = new T.MeshStandardMaterial({ color: '#888' });
    const exclusiveGeo = new T.BoxGeometry(0.4, 0.4, 0.4);
    const exclusiveTex = new T.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1);
    const exclusiveMat = new T.MeshStandardMaterial({ map: exclusiveTex });
    const spySharedGeo = vi.spyOn(sharedGeo, 'dispose');
    const spySharedMat = vi.spyOn(sharedMat, 'dispose');
    const spyExGeo = vi.spyOn(exclusiveGeo, 'dispose');
    const spyExMat = vi.spyOn(exclusiveMat, 'dispose');
    const spyExTex = vi.spyOn(exclusiveTex, 'dispose');

    const buildPart = (useExclusive: boolean) => {
      const g = new T.Group();
      const m1 = new T.Mesh(sharedGeo, sharedMat);
      const m2 = new T.Mesh(useExclusive ? exclusiveGeo : new T.BoxGeometry(0.3, 0.3, 0.3), useExclusive ? exclusiveMat : new T.MeshStandardMaterial());
      g.add(m1, m2);
      return g;
    };
    const dispComp = composeAsset({
      name: 'Shared Resources',
      buildRecipe: (r: Recipe) => buildPart(r.name === 'first'),
      parts: [
        { id: 'a', recipe: { ...baseRecipe, name: 'first' } },
        { id: 'b', recipe: { ...baseRecipe, name: 'second' }, mount: { at: [2, 0, 0] } },
      ],
    });
    const dispCtrl = createCompositeController(dispComp);
    dispCtrl.setChildParams('a', {}, () => buildPart(false));
    expect(spySharedGeo).not.toHaveBeenCalled();
    expect(spySharedMat).not.toHaveBeenCalled();
    expect(spyExGeo).toHaveBeenCalledTimes(1);
    expect(spyExMat).toHaveBeenCalledTimes(1);
    expect(spyExTex).toHaveBeenCalledTimes(1);
    dispCtrl.dispose();

    // 3. Worked example from docs/design/composition.md passes validateComposite & updates root dimensions via public createAsset (F11, F17).
    const yard = composeAsset({
      name: 'Harbor Market Yard',
      buildRecipe: createAsset,
      parts: [
        { id: 'pavilion', recipe: resolveVariationRecipe('market-pavilion', 'harbor-timber-kit') },
        { id: 'pod-left', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [-3.2, 0, 0.4], coupling: 'surface' } },
        { id: 'pod-right', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [3.2, 0, 0.4], coupling: 'surface' } },
        { id: 'mill', recipe: resolveVariationRecipe('stone-watermill'), mount: { at: [0, 0, -3.4], coupling: 'surface' } },
      ],
    });
    expect(validateComposite(yard).valid).toBe(true);
    const yardCtrl = createCompositeController(yard);
    const beforeW = yardCtrl.capabilities.dimensions?.sizeM.x ?? 0;
    const afterCaps = yardCtrl.setChildParams('pavilion', { bays: 4 }, createAsset);
    expect(afterCaps.dimensions?.sizeM.x ?? 0).toBeGreaterThanOrEqual(beforeW);
    expect(parseCapabilities(JSON.parse(JSON.stringify(afterCaps)))?.children?.length).toBe(4);
    yardCtrl.dispose();
  });
});
