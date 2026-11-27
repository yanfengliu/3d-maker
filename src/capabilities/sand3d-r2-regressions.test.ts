import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { applyImportEdits, openStoredFile, reconcileSavedEdits } from '../imports/asset';
import { cloneForExport } from '../studio/export';
import { composeAsset, validateComposite } from './compose';
import { createCompositeController } from './compose-runtime';
import { buildOrientedBox, validateScenePlacement } from './obb';
import { createAssetController, inspectAsset, synthesizeRigClips } from './runtime';
import { readSand3dCapabilities } from './sand3d';
import { writeCapabilities } from './schema';
import { checkRiggedSweep } from './sweep';

async function exportGlb(scene: T.Object3D, includeAnimations = true): Promise<ArrayBuffer> {
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
    return await new GLTFExporter().parseAsync(scene, {
      binary: true,
      onlyVisible: true,
      ...(includeAnimations && scene.animations.length ? { animations: scene.animations } : {}),
    }) as ArrayBuffer;
  } finally {
    if (prevReader === undefined) delete (globalThis as { FileReader?: unknown }).FileReader;
  }
}

describe('Sand3D round-2 adversarial regressions (legacy pose, nested joints, opposing loads, shear, visibility, clips)', () => {
  it('keeps legacy Form Foundry saved pose resets at 0 deg while preserving legacy posed Sand3D GLBs', async () => {
    const mat = new T.MeshStandardMaterial({ color: '#708090' });
    const ffDoor = new T.Group();
    ffDoor.name = 'FFDoor';
    const pivot = new T.Group();
    pivot.name = 'Door';
    pivot.add(new T.Mesh(new T.BoxGeometry(0.4, 0.8, 0.04), mat));
    ffDoor.add(pivot);
    writeCapabilities(ffDoor, {
      version: 1, name: 'FFDoor', detachableParts: [], nightZones: [], decals: [],
      riggedParts: [{ name: 'Door', label: 'Door', type: 'rotate', axis: 'y', range: [0, 90] }],
    });
    const ctrl = createAssetController(ffDoor);
    ctrl.setPart('Door', 60);
    const snap = cloneForExport(ffDoor, { includePartClips: false }, ctrl);
    const ffBytes = await exportGlb(snap.root, false);
    snap.dispose();
    ctrl.dispose();

    const reopened = await openStoredFile(new Blob([ffBytes]), 'ff-door.glb');
    expect(reopened.controller.getPart('Door')).toBeCloseTo(60, 1);
    // Legacy save of an already-supported Form Foundry GLB saved closed (no pose, no knownRiggedParts) MUST reopen at 0°!
    const reconciled = reconcileSavedEdits(reopened, { name: 'Closed', tint: '#ffffff', scale: 1, proportion: 1 });
    applyImportEdits(reopened, reconciled.edits);
    expect(reopened.controller.getPart('Door')).toBe(0);
    reopened.controller.dispose();
  });

  it('catches nested independent wrist collisions during parent slide sweep and reloads posed mimic composites cleanly', async () => {
    const mat = new T.MeshStandardMaterial({ color: '#607080' });
    const arm = new T.Group();
    arm.name = 'arm_rig';
    arm.add(new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), mat));
    const carriage = new T.Group();
    carriage.name = 'carriage';
    carriage.userData.s3d_joint = { name: 'carriage', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.6 };
    carriage.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    const wrist = new T.Group();
    wrist.name = 'wrist';
    wrist.position.set(0.2, 0, 0);
    wrist.userData.s3d_joint = { name: 'wrist', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI / 2 };
    wrist.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    carriage.add(wrist);
    arm.add(carriage);

    // Wall sits at x = 0.8 (carriage reaches 0.6, carried wrist reaches 0.8 -> MUST detect collision!).
    const wallObs = buildOrientedBox(new T.Matrix4(), [0.8, 0, 0], [0.05, 0.2, 0.2], {
      id: 'wall:body', name: 'Wall', ownerId: 'wall', kind: 'collider', layer: 'solid',
    });
    const sweep = checkRiggedSweep(arm, { obstacles: [wallObs] });
    expect(sweep.valid).toBe(false);
    expect(sweep.issues.some(i => i.kind === 'obstacle-blocked')).toBe(true);

    // Posed composite with a mimic follower exports to binary GLB and reopens via createCompositeController without throwing!
    const bottle = new T.Group();
    bottle.name = 'bottle';
    bottle.add(new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.2, 8), mat));
    const capTurn = new T.Group();
    capTurn.name = 'cap_turn';
    capTurn.position.set(0, 0.1, 0);
    capTurn.userData.s3d_joint = { name: 'cap_turn', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI * 2 };
    const capLift = new T.Group();
    capLift.name = 'cap_lift';
    capLift.userData.s3d_joint = {
      name: 'cap_lift', type: 'prismatic', value: 0, axis: [0, 1, 0], lower: 0, upper: 0.04,
      mimic: { joint: 'cap_turn', multiplier: 0.04 / (Math.PI * 2) },
    };
    capLift.add(new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.03, 8), mat));
    capTurn.add(capLift);
    bottle.add(capTurn);

    const comp = composeAsset({ name: 'TableSet', parts: [{ id: 'bottle', object: bottle }] });
    const cCtrl = createCompositeController(comp);
    cCtrl.setPart('bottle/cap_turn', 180);
    const snap = cloneForExport(comp, { includePartClips: false }, cCtrl);
    const bytes = await exportGlb(snap.root, false);
    snap.dispose();
    cCtrl.dispose();

    const parsed = await new GLTFLoader().parseAsync(bytes, '');
    const reopenedCtrl = createCompositeController(parsed.scene);
    expect(reopenedCtrl.getPart('bottle/cap_turn')).toBeCloseTo(180, 1);
    expect(reopenedCtrl.getPart('bottle/cap_lift')).toBeCloseTo(0.02, 4);
    reopenedCtrl.dispose();
  });

  it('detects opposing carried loads colliding in validateComposite and respects follower/leader visibility in sweeps', () => {
    const mat = new T.MeshStandardMaterial({ color: '#607080' });
    const rig = new T.Group();
    rig.name = 'opposing';
    rig.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));

    const left = new T.Group();
    left.name = 'left_slide';
    left.position.set(-0.3, 0.2, 0);
    left.userData.s3d_joint = { name: 'left_slide', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.6 };
    left.add(new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.06), mat));
    rig.add(left);

    const right = new T.Group();
    right.name = 'right_slide';
    right.position.set(0.3, 0.2, 0);
    right.userData.s3d_joint = {
      name: 'right_slide', type: 'prismatic', value: 0, axis: [-1, 0, 0], lower: 0, upper: 0.6,
      mimic: { joint: 'left_slide', multiplier: 1 },
    };
    right.add(new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.06), mat));
    rig.add(right);

    const makeBox = (name: string) => {
      const g = new T.Group();
      g.name = name;
      g.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
      writeCapabilities(g, {
        version: 1, name, riggedParts: [], detachableParts: [], nightZones: [], decals: [],
        colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.1, 0.1, 0.1], layer: 'solid' }],
      });
      return g;
    };

    const comp = composeAsset({
      name: 'OpposingCell',
      parts: [
        { id: 'rig', object: rig },
        { id: 'p1', object: makeBox('P1'), mount: { parent: 'rig', attachNode: 'left_slide', at: [0, 0.1, 0], coupling: 'weld' } },
        { id: 'p2', object: makeBox('P2'), mount: { parent: 'rig', attachNode: 'right_slide', at: [0, 0.1, 0], coupling: 'weld' } },
      ],
    });
    const res = validateComposite(comp);
    expect(res.valid).toBe(false);
    expect(res.sweeps.rig?.valid).toBe(false);

    // Visibility rules: hidden follower reports no collision; hidden leader + visible sibling follower still sweeps!
    const visRig = new T.Group();
    visRig.name = 'vis_rig';
    const lead = new T.Group();
    lead.name = 'lead';
    lead.userData.s3d_joint = { name: 'lead', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.5 };
    lead.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    visRig.add(lead);
    const fol = new T.Group();
    fol.name = 'fol';
    fol.position.set(0, 0.5, 0);
    fol.userData.s3d_joint = {
      name: 'fol', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.5,
      mimic: { joint: 'lead', multiplier: 1 },
    };
    fol.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    visRig.add(fol);

    const obsAtFol = buildOrientedBox(new T.Matrix4(), [0.4, 0.5, 0], [0.05, 0.05, 0.05], {
      id: 'obs:1', name: 'Obs', ownerId: 'obs', kind: 'collider', layer: 'solid',
    });
    fol.visible = false;
    expect(checkRiggedSweep(visRig, { obstacles: [obsAtFol] }).valid).toBe(true);
    fol.visible = true;
    lead.visible = false;
    const hiddenLeadSweep = checkRiggedSweep(visRig, { obstacles: [obsAtFol] });
    expect(hiddenLeadSweep.checkedParts).toBe(1);
    expect(hiddenLeadSweep.valid).toBe(false);
  });

  it('honors bounded follower stops under continuous leaders, early-stop clip breakpoints, 3-turn spoke clearance, and continuous 36090 deg round-trips', async () => {
    const mat = new T.MeshStandardMaterial({ color: '#607080' });
    // 1. Continuous crank driving a bounded 0..0.1 m prismatic follower + continuous 36,090 deg round-trip.
    const crankRig = new T.Group();
    crankRig.name = 'crank_rig';
    const crank = new T.Group();
    crank.name = 'crank';
    crank.userData.s3d_joint = { name: 'crank', type: 'continuous', value: 0, axis: [0, 0, 1] };
    crank.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    crankRig.add(crank);
    const piston = new T.Group();
    piston.name = 'piston';
    piston.userData.s3d_joint = {
      name: 'piston', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.1,
      mimic: { joint: 'crank', multiplier: 0.1 },
    };
    piston.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    crankRig.add(piston);

    const ctrl = createAssetController(crankRig);
    ctrl.setPart('crank', 360); // 2*PI rad * 0.1 = 0.628 m unclamped -> MUST stop at 0.1 m!
    expect(ctrl.getPart('piston')).toBeCloseTo(0.1, 5);
    ctrl.setPart('crank', 36090);
    const snap = cloneForExport(crankRig, { includePartClips: false }, ctrl);
    const bytes = await exportGlb(snap.root, false);
    snap.dispose();
    ctrl.dispose();
    const parsed = await new GLTFLoader().parseAsync(bytes, '');
    expect(inspectAsset(parsed.scene).state?.pose?.crank).toBeCloseTo(36090, 1);
    expect(readSand3dCapabilities(parsed.scene)?.state?.pose?.crank).toBeCloseTo(36090, 1);

    // 2. Early-stop wheel (reaches 180 deg in first 0.1 m of 1.0 m rack) + huge 500 rad spin step <= 90 deg.
    const stopRig = new T.Group();
    const rack = new T.Group();
    rack.name = 'rack';
    rack.userData.s3d_joint = { name: 'rack', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 1.0 };
    rack.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    stopRig.add(rack);
    const wheel = new T.Group();
    wheel.name = 'wheel';
    wheel.userData.s3d_joint = {
      name: 'wheel', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: Math.PI,
      mimic: { joint: 'rack', multiplier: Math.PI / 0.1 },
    };
    wheel.add(new T.Mesh(new T.BoxGeometry(0.2, 0.02, 0.02), mat));
    stopRig.add(wheel);

    const stopCtrl = createAssetController(stopRig);
    const stopSnap = cloneForExport(stopRig, { includePartClips: true }, stopCtrl);
    const stopBytes = await exportGlb(stopSnap.root, true);
    stopSnap.dispose();
    stopCtrl.dispose();
    const stopGltf = await new GLTFLoader().parseAsync(stopBytes, '');
    const mixer = new T.AnimationMixer(stopGltf.scene);
    if (stopGltf.animations[0]) mixer.clipAction(stopGltf.animations[0]).play();
    mixer.update(0.45);
    stopGltf.scene.updateMatrixWorld(true);
    const wNode = stopGltf.scene.getObjectByName('wheel');
    const tip = new T.Vector3(0.2, 0, 0).applyMatrix4(wNode?.matrixWorld ?? new T.Matrix4());
    expect(tip.x).toBeCloseTo(-0.2, 2);

    // Huge 500 rad spin: every consecutive quaternion step must be <= 90 deg (never backwards slerp!).
    const huge = new T.Group();
    const hp = new T.Group();
    hp.name = 'huge';
    hp.userData.s3d_joint = { name: 'huge', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: 500 };
    hp.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    huge.add(hp);
    const hClip = synthesizeRigClips(huge)[0];
    const qVals = hClip?.tracks[0]?.values ?? [];
    for (let i = 0; i + 7 < qVals.length; i += 4) {
      const qa = new T.Quaternion(qVals[i], qVals[i + 1], qVals[i + 2], qVals[i + 3]);
      const qb = new T.Quaternion(qVals[i + 4], qVals[i + 5], qVals[i + 6], qVals[i + 7]);
      expect(T.MathUtils.radToDeg(qa.angleTo(qb))).toBeLessThanOrEqual(90.5);
    }

    // 3. Slide driving a 3-turn (1080 deg) 1 m spoke: clearance reaches >= 0.99 m, empty 25-step sweep passes, obstacle at 0.96 m caught!
    const spokeRig = new T.Group();
    const slider = new T.Group();
    slider.name = 'slider';
    slider.userData.s3d_joint = { name: 'slider', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.2 };
    slider.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    spokeRig.add(slider);
    const spoke = new T.Group();
    spoke.name = 'spoke';
    spoke.userData.s3d_joint = {
      name: 'spoke', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: Math.PI * 6,
      mimic: { joint: 'slider', multiplier: (Math.PI * 6) / 0.2 },
    };
    const armMesh = new T.Mesh(new T.BoxGeometry(1.0, 0.04, 0.04), mat);
    armMesh.position.set(0.5, 0, 0);
    spoke.add(armMesh);
    spokeRig.add(spoke);

    expect(checkRiggedSweep(spokeRig, { steps: 25 }).valid).toBe(true);
    const highObs = buildOrientedBox(new T.Matrix4(), [0, 0.96, 0], [0.05, 0.03, 0.05], {
      id: 'hi:1', name: 'Bar', ownerId: 'hi', kind: 'collider', layer: 'solid',
    });
    expect(checkRiggedSweep(spokeRig, { obstacles: [highObs] }).valid).toBe(false);
    expect(validateScenePlacement([
      { id: 'spoke', object: spokeRig },
      {
        id: 'bar', position: [0, 0.96, 0],
        capabilities: {
          version: 1, name: 'Bar', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
          colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.1, 0.06, 0.1], layer: 'solid' }],
        },
      },
    ]).valid).toBe(false);
  });

  it('preserves authored animations on mirrored [1,-1,1] pivots, sheared headless OBBs, and surviving mimic sub-chains', async () => {
    const mat = new T.MeshStandardMaterial({ color: '#607080' });
    // 1. Authored .quaternion animation on a [1, -1, 1] mirrored pivot preserves tip Y = -0.5 m after studio import!
    const animScene = new T.Group();
    const piv = new T.Group();
    piv.name = 'mirror_anim';
    piv.scale.set(1, -1, 1);
    piv.userData.s3d_joint = { name: 'mirror_anim', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI / 2 };
    const leaf = new T.Mesh(new T.BoxGeometry(0.4, 0.1, 0.04), mat);
    leaf.position.set(0.2, 0.5, 0);
    piv.add(leaf);
    animScene.add(piv);
    const q0 = new T.Quaternion();
    const q1 = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 2);
    animScene.animations = [
      new T.AnimationClip('Swing', 1, [
        new T.QuaternionKeyframeTrack('mirror_anim.quaternion', [0, 1], [q0.x, q0.y, q0.z, q0.w, q1.x, q1.y, q1.z, q1.w]),
      ]),
    ];
    const animBytes = await exportGlb(animScene, true);
    // Raw GLTFLoader baseline at t = 0.5 s:
    const rawGltf = await new GLTFLoader().parseAsync(animBytes, '');
    const rawMixer = new T.AnimationMixer(rawGltf.scene);
    if (rawGltf.animations[0]) rawMixer.clipAction(rawGltf.animations[0]).play();
    rawMixer.update(0.5);
    rawGltf.scene.updateMatrixWorld(true);
    const rawTip = new T.Vector3(0.2, 0.5, 0).applyMatrix4(rawGltf.scene.getObjectByName('mirror_anim')?.matrixWorld ?? new T.Matrix4());

    // Studio import at same t = 0.5 s MUST match rawTip identically (Y = -0.5 m, NOT +0.5 m!).
    const imported = await openStoredFile(new Blob([animBytes]), 'mirror-anim.glb');
    const impMixer = new T.AnimationMixer(imported.group);
    if (imported.group.animations[0]) impMixer.clipAction(imported.group.animations[0]).play();
    impMixer.update(0.5);
    imported.group.updateMatrixWorld(true);
    const impTip = new T.Vector3(0.2, 0.5, 0).applyMatrix4(imported.group.getObjectByName('mirror_anim')?.matrixWorld ?? new T.Matrix4());
    expect(impTip.y).toBeCloseTo(rawTip.y, 3);
    expect(impTip.x).toBeCloseTo(rawTip.x, 3);
    expect(impTip.z).toBeCloseTo(rawTip.z, 3);
    imported.controller.dispose();

    // 2. Sheared [2, 1, 1] ancestor scale + 45 deg child pivot: manifest-only OBB detects obstacle inside sheared mesh!
    const sheared = new T.Group();
    const parentScale = new T.Group();
    parentScale.scale.set(2, 1, 1);
    const tilted = new T.Group();
    tilted.name = 'tilted_part';
    tilted.rotation.z = Math.PI / 4;
    tilted.userData.s3d_joint = { name: 'tilted_part', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: 1 };
    const bar = new T.Mesh(new T.BoxGeometry(1.0, 0.1, 0.1), mat);
    bar.position.set(0.5, 0, 0);
    tilted.add(bar);
    parentScale.add(tilted);
    sheared.add(parentScale);
    const shearCaps = readSand3dCapabilities(sheared);
    expect(shearCaps).not.toBeNull();
    if (!shearCaps) throw new Error('Expected shear capabilities');
    // Point at local (0.9, 0, 0) maps to world (2 * 0.9 * cos 45°, 0.9 * sin 45°, 0) = (1.273, 0.636, 0).
    const probeObstacle = {
      id: 'probe', position: [1.273, 0.636, 0] as [number, number, number],
      capabilities: {
        version: 1 as const, name: 'Probe', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
        colliders: [{ name: 'Body', shape: 'box' as const, at: [0, 0, 0] as [number, number, number], size: [0.02, 0.02, 0.02] as [number, number, number], layer: 'solid' as const }],
      },
    };
    const liveHit = validateScenePlacement([{ id: 's', object: sheared, capabilities: shearCaps }, probeObstacle]);
    const headlessHit = validateScenePlacement([{ id: 's', capabilities: shearCaps }, probeObstacle]);
    expect(liveHit.valid).toBe(false);
    expect(headlessHit.valid).toBe(false);

    // 3. Pruning missing A from A -> B -> C preserves B -> C!
    const pruned = new T.Group();
    pruned.name = 'Pruned';
    const bNode = new T.Group(); bNode.name = 'B'; bNode.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    const cNode = new T.Group(); cNode.name = 'C'; cNode.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    pruned.add(bNode, cNode);
    writeCapabilities(pruned, {
      version: 1, name: 'Pruned', detachableParts: [], nightZones: [], decals: [],
      riggedParts: [
        { name: 'A', label: 'A', type: 'slide', axis: 'x', range: [0, 1] },
        { name: 'B', label: 'B', type: 'slide', axis: 'x', range: [0, 1], mimic: { part: 'A', multiplier: 1 } },
        { name: 'C', label: 'C', type: 'slide', axis: 'x', range: [0, 1], mimic: { part: 'B', multiplier: 1 } },
      ],
    });
    const prunedBytes = await exportGlb(pruned, false);
    const loadedPruned = await openStoredFile(new Blob([prunedBytes]), 'pruned.glb');
    loadedPruned.controller.setPart('B', 0.5);
    expect(loadedPruned.controller.getPart('C')).toBeCloseTo(0.5, 4);
    loadedPruned.controller.dispose();
  });
});
