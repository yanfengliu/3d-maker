import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { resolveVariationRecipe } from '../data/recipe';
import { buildModel } from '../models';
import { cloneForExport } from '../studio/export';
import { composeAsset, validateComposite } from './compose';
import { createCompositeController } from './compose-runtime';
import { inspectAsset } from './runtime';
import { parseCapabilities, writeCapabilities, type AssetCapabilities } from './schema';

function makeHostCounter(width = 2.0, height = 0.85, depth = 0.8, clearanceY = 0.9): T.Group {
  const root = new T.Group();
  root.name = 'KitchenCounter';
  const body = new T.Mesh(
    new T.BoxGeometry(width, height, depth),
    new T.MeshStandardMaterial({ color: '#8d7a64', roughness: 0.85 }),
  );
  body.position.set(0, height * 0.5, 0);
  root.add(body);
  const caps: AssetCapabilities = {
    version: 1,
    name: 'Kitchen Counter',
    riggedParts: [],
    detachableParts: [],
    nightZones: [],
    decals: [],
    physics: { body: 'static', massKg: 65 },
    colliders: [
      { name: 'CounterBody', shape: 'box', at: [0, height * 0.5, 0], size: [width, height, depth], layer: 'solid' },
    ],
    surfaces: [
      {
        name: 'CounterTop',
        label: 'Counter top',
        at: [0, height, 0],
        normal: [0, 1, 0],
        size: [width, depth],
        clearanceY,
      },
    ],
  };
  writeCapabilities(root, caps);
  return root;
}

function makeApplianceBox(name: string, size: [number, number, number], massKg = 8, hasDoor = false): T.Group {
  const root = new T.Group();
  root.name = name;
  const mat = new T.MeshStandardMaterial({ color: '#d8d4c8', roughness: 0.8 });
  const body = new T.Mesh(new T.BoxGeometry(size[0], size[1], size[2]), mat);
  body.position.set(0, size[1] * 0.5, 0);
  root.add(body);
  const riggedParts: AssetCapabilities['riggedParts'] = [];
  const colliders: NonNullable<AssetCapabilities['colliders']> = [
    { name: 'Chassis', shape: 'box', at: [0, size[1] * 0.5, 0], size, layer: 'solid' },
  ];
  const clearanceZones: NonNullable<AssetCapabilities['clearanceZones']> = [];
  if (hasDoor) {
    const door = new T.Group();
    door.name = 'Door';
    door.position.set(size[0] * 0.5, 0, size[2] * 0.5 + 0.02);
    const leaf = new T.Mesh(new T.BoxGeometry(size[0] * 0.9, size[1] * 0.85, 0.03), mat);
    leaf.position.set(-size[0] * 0.45, size[1] * 0.5, 0);
    door.add(leaf);
    root.add(door);
    riggedParts.push({ name: 'Door', label: 'Door', type: 'rotate', axis: 'y', range: [0, 90] });
    colliders.push({
      name: 'Door',
      shape: 'box',
      at: [-size[0] * 0.45, size[1] * 0.5, 0],
      size: [size[0] * 0.9, size[1] * 0.85, 0.03],
      node: 'Door',
      restPose: { at: [0, size[1] * 0.5, size[2] * 0.5 + 0.02] },
      layer: 'doorway',
    });
    clearanceZones.push({
      name: 'DoorClearance',
      kind: 'swing',
      at: [0, size[1] * 0.5, size[2] * 0.5 + size[0] * 0.5],
      size: [size[0] + 0.1, size[1], size[0] + 0.1],
      part: 'Door',
    });
  }
  writeCapabilities(root, {
    version: 1,
    name,
    riggedParts,
    detachableParts: [],
    nightZones: [],
    decals: [],
    physics: { body: 'dynamic', massKg },
    colliders,
    ...(clearanceZones.length ? { clearanceZones } : {}),
  });
  return root;
}

describe('hierarchical asset composition, scoping, live knobs, concurrent clips, and physics laws', () => {
  it('isolates identical siblings and runs concurrent child animations alongside independent manual part poses', () => {
    const yard = composeAsset({
      name: 'Mill And Cargo Yard',
      buildRecipe: buildModel,
      parts: [
        { id: 'mill', recipe: resolveVariationRecipe('stone-watermill'), mount: { at: [0, 0, 0], coupling: 'surface' } },
        { id: 'pod-a', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [-2.6, 0, 0.2], coupling: 'surface' } },
        { id: 'pod-b', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [2.6, 0, 0.2], coupling: 'surface' } },
        { id: 'tower', recipe: resolveVariationRecipe('signal-tower'), mount: { at: [0, 0, -3.2], coupling: 'surface' } },
      ],
    });

    const validation = validateComposite(yard);
    expect(validation.valid, JSON.stringify(validation)).toBe(true);

    const ctrl = createCompositeController(yard);
    expect(ctrl.listChildren()).toEqual(['mill', 'pod-a', 'pod-b', 'tower']);

    // Open pod-a's CaseLid without touching identical sibling pod-b's CaseLid!
    expect(ctrl.openPart('pod-a/CaseLid')).toBe(-72);
    expect(ctrl.getPart('pod-a/CaseLid')).toBe(-72);
    expect(ctrl.getPart('pod-b/CaseLid')).toBe(0);

    const podALid = yard.getObjectByName('pod-a__CaseLid');
    const podBLid = yard.getObjectByName('pod-b__CaseLid');
    expect(podALid).toBeDefined();
    expect(podBLid).toBeDefined();
    expect(Math.abs(podALid?.rotation.x ?? 0)).toBeGreaterThan(1.0);
    expect(Math.abs(podBLid?.rotation.x ?? 0)).toBeLessThan(0.01);

    // Run continuous animations on mill AND tower concurrently while opening mill/MillDoor manually!
    const wheelNode = yard.getObjectByName('mill__WaterWheel');
    const dishNode = yard.getObjectByName('tower__DishMount');
    const millDoorNode = yard.getObjectByName('mill__MillDoor');
    expect(wheelNode && dishNode && millDoorNode).toBeTruthy();

    const wheelBefore = wheelNode?.quaternion.clone();
    const dishBefore = dishNode?.quaternion.clone();
    ctrl.playClips([
      { childId: 'mill', clip: 'Turn waterwheel' },
      { childId: 'tower', clip: 0 },
    ]);
    ctrl.openPart('mill/MillDoor');
    ctrl.update(0.75);

    expect(wheelBefore && wheelNode ? wheelBefore.angleTo(wheelNode.quaternion) : 0).toBeGreaterThan(0.3);
    expect(dishBefore && dishNode ? dishBefore.angleTo(dishNode.quaternion) : 0).toBeGreaterThan(0.1);
    expect(Math.abs(millDoorNode?.rotation.y ?? 0)).toBeGreaterThan(1.0);
    // pod-a remained open the entire time while animations ran on mill & tower!
    expect(ctrl.getPart('pod-a/CaseLid')).toBe(-72);
    ctrl.dispose();
  });

  it('preserves child structural knobs and rebuilds one child cleanly without losing sibling poses', () => {
    const market = composeAsset({
      name: 'Parametric Market Corner',
      buildRecipe: buildModel,
      parts: [
        { id: 'pavilion', recipe: resolveVariationRecipe('market-pavilion', 'harbor-timber-kit') },
        { id: 'pod', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [3.4, 0, 0], coupling: 'surface' } },
      ],
    });

    const ctrl = createCompositeController(market);
    ctrl.openPart('pod/CaseLid');
    ctrl.setPart('pavilion/HangingSign', 15);
    const widthBefore = ctrl.getChildSpec('pavilion')?.capabilities.dimensions?.sizeM.x ?? 0;

    // Live knob update: expand pavilion from 3 bays -> 4 bays and switch colorway!
    const updatedCaps = ctrl.setChildParams('pavilion', { bays: 4, awning: false, colorway: 'cedar-slate' }, buildModel);
    const pavSpec = updatedCaps.children?.find(c => c.id === 'pavilion');
    const widthAfter = pavSpec?.capabilities.dimensions?.sizeM.x ?? 0;

    expect(widthAfter).toBeGreaterThan(widthBefore + 0.6);
    expect((pavSpec?.recipe?.params as Record<string, unknown> | undefined)?.bays).toBe(4);
    expect((pavSpec?.recipe?.params as Record<string, unknown> | undefined)?.awning).toBe(false);
    // Sibling pod pose AND pavilion's own compatible HangingSign pose both survived the rebuild!
    expect(ctrl.getPart('pod/CaseLid')).toBe(-72);
    expect(ctrl.getPart('pavilion/HangingSign')).toBe(15);
    ctrl.dispose();
  });

  it('enforces physics coupling (weld mass summing, joint spec, surface auto-seating) and catches collisions, overflow, and blocked swings', () => {
    // 1. Weld coupling sums massKg onto dynamic parent body; surface coupling auto-seats flush on CounterTop!
    const vehicleChassis = makeApplianceBox('TruckChassis', [1.8, 1.0, 3.2], 1200);
    const roofTurret = makeApplianceBox('RoofTurret', [0.5, 0.4, 0.5], 85);
    const trailer = makeApplianceBox('Trailer', [1.4, 0.9, 2.0], 450);
    const rig = composeAsset({
      name: 'Utility Truck Rig',
      parts: [
        { id: 'truck', object: vehicleChassis },
        { id: 'turret', object: roofTurret, mount: { parent: 'truck', at: [0, 1.0, 0], coupling: 'weld' } },
        {
          id: 'trailer',
          object: trailer,
          mount: {
            parent: 'truck',
            at: [0, 0, -2.9],
            coupling: 'joint',
            joint: { type: 'hinge', axis: 'y', range: [-45, 45] },
          },
        },
      ],
    });
    const rigCaps = inspectAsset(rig);
    expect(rigCaps.physics?.body).toBe('dynamic');
    // Welded turret mass adds to truck (1200 + 85 = 1285), while articulated joint trailer stays independent!
    expect(rigCaps.physics?.massKg).toBe(1285);
    expect(rigCaps.children?.[2]?.mount.joint).toEqual({ type: 'hinge', axis: 'y', range: [-45, 45] });
    expect(validateComposite(rig).valid).toBe(true);

    // 2. Surface seating + headroom + sibling overlap + door swing blockage detection!
    const counter = makeHostCounter(2.0, 0.85, 0.8, 0.65);
    const microwave = makeApplianceBox('Microwave', [0.5, 0.32, 0.36], 14, true);
    const toaster = makeApplianceBox('Toaster', [0.28, 0.24, 0.22], 3, false);
    const kitchenOk = composeAsset({
      name: 'Kitchen Counter Setup',
      parts: [
        { id: 'counter', object: counter },
        { id: 'microwave', object: microwave, mount: { parent: 'counter', surface: 'CounterTop', at: [-0.45, 0, 0], coupling: 'surface' } },
        { id: 'toaster', object: toaster, mount: { parent: 'counter', surface: 'CounterTop', at: [0.55, 0, 0], coupling: 'surface' } },
      ],
    });
    // Verify auto-seating placed microwave & toaster flush at y = 0.85!
    expect(kitchenOk.getObjectByName('Slot_microwave')?.position.y).toBeCloseTo(0.85, 3);
    expect(kitchenOk.getObjectByName('Slot_toaster')?.position.y).toBeCloseTo(0.85, 3);
    expect(validateComposite(kitchenOk).valid).toBe(true);

    // Now crowd a tall coffee urn directly in front of the microwave door and exceeding clearanceY!
    const counterBad = makeHostCounter(2.0, 0.85, 0.8, 0.5);
    const mwBad = makeApplianceBox('Microwave', [0.5, 0.32, 0.36], 14, true);
    const tallBlocker = makeApplianceBox('TallUrn', [0.28, 0.72, 0.24], 5, false);
    const kitchenBad = composeAsset({
      name: 'Crowded Counter',
      parts: [
        { id: 'counter', object: counterBad },
        { id: 'microwave', object: mwBad, mount: { parent: 'counter', surface: 'CounterTop', at: [-0.3, 0, -0.16], coupling: 'surface' } },
        { id: 'urn', object: tallBlocker, mount: { parent: 'counter', surface: 'CounterTop', at: [-0.3, 0, 0.22], coupling: 'surface' } },
      ],
    });
    const badReport = validateComposite(kitchenBad);
    expect(badReport.valid).toBe(false);
    expect(badReport.surfaceIssues.some(i => i.childId === 'urn' && i.kind === 'clearance-exceeded')).toBe(true);
    expect(badReport.sweeps.microwave?.issues.some(i => i.kind === 'obstacle-blocked')).toBe(true);
  });

  it('round-trips a composed multi-child asset through binary GLB export and GLTFLoader with all manifests, poses, detachables, and clips intact', async () => {
    // Minimal FileReader polyfill for Three.js GLTFExporter binary mode under Node Vitest.
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
      const composite = composeAsset({
        name: 'Exportable Harbor Station',
        buildRecipe: buildModel,
        parts: [
          { id: 'pavilion', recipe: resolveVariationRecipe('market-pavilion', 'harbor-timber-kit') },
          { id: 'pod', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [3.2, 0, 0], coupling: 'surface' } },
        ],
      });
      const ctrl = createCompositeController(composite);
      ctrl.openPart('pod/CaseLid');
      ctrl.setVisible('pavilion/ProduceStall', false);
      ctrl.syncManifest();

      const prepared = cloneForExport(composite);
      const exporter = new GLTFExporter();
      const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(
          prepared.root,
          result => {
            if (result instanceof ArrayBuffer) resolve(result);
            else reject(new Error('Expected binary GLB ArrayBuffer'));
          },
          reject,
          { binary: true, animations: prepared.root.animations },
        );
      });
      prepared.dispose();
      ctrl.dispose();

      const loader = new GLTFLoader();
      const loaded = await new Promise<{ scene: T.Group; animations: T.AnimationClip[] }>((resolve, reject) => {
        loader.parse(glbBuffer, '', gltf => { resolve({ scene: gltf.scene, animations: gltf.animations }); }, reject);
      });
      loaded.scene.animations = loaded.animations;

      const reloadedCaps = inspectAsset(loaded.scene, loaded.animations);
      expect(reloadedCaps.children?.map(c => c.id)).toEqual(['pavilion', 'pod']);
      expect(parseCapabilities(JSON.parse(JSON.stringify(reloadedCaps)))?.children?.length).toBe(2);

      const reloadedCtrl = createCompositeController(loaded.scene, reloadedCaps);
      // Posed lid and hidden detachable stall both survived binary GLB round-trip!
      expect(reloadedCtrl.getPart('pod/CaseLid')).toBe(-72);
      expect(reloadedCtrl.isVisible('pavilion/ProduceStall')).toBe(false);
      // Re-showing the hidden stall and closing the lid still works on the reloaded GLB!
      reloadedCtrl.setVisible('pavilion/ProduceStall', true);
      expect(reloadedCtrl.isVisible('pavilion/ProduceStall')).toBe(true);
      expect(reloadedCtrl.closePart('pod/CaseLid')).toBe(0);
      // Scoped child animation clip still plays cleanly on the reloaded GLB!
      const signNode = loaded.scene.getObjectByName('pavilion__HangingSign');
      expect(signNode).toBeDefined();
      const beforeSign = signNode?.quaternion.clone();
      reloadedCtrl.playClips([{ childId: 'pavilion', clip: 'Breeze sway' }]);
      reloadedCtrl.update(0.7);
      expect(beforeSign && signNode ? beforeSign.angleTo(signNode.quaternion) : 0).toBeGreaterThan(0.1);
      reloadedCtrl.dispose();
    } finally {
      if (prevReader === undefined) delete (globalThis as { FileReader?: unknown }).FileReader;
    }
  });
});
