import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { openStoredFile } from '../imports/asset';
import { cloneForExport } from '../studio/export';
import { composeAsset, validateComposite } from './compose';
import { createCompositeController } from './compose-runtime';
import { buildOrientedBox, resolveAssetVolumes, validateScenePlacement } from './obb';
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

describe('Sand3D round-3 adversarial regressions (nested carriers, root carriage, narrow stops, per-part clearances, SDK pruning, authored mirror clips)', () => {
  it('catches payload-vs-nested-follower-wrist collisions and derives clearance when carriage is root or carries a detachable mesh', () => {
    const mat = new T.MeshStandardMaterial({ color: '#607080' });

    // 1. Nested carrier: leader carries payload AND opposing mimic follower carrying independent wrist -> MUST detect collision!
    const rig = new T.Group();
    rig.name = 'nested_rig';
    const leader = new T.Group();
    leader.name = 'leader';
    leader.position.set(0, 0.3, 0);
    leader.userData.s3d_joint = { name: 'leader', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.6 };
    leader.add(new T.Mesh(new T.BoxGeometry(0.08, 0.08, 0.08), mat));
    const follower = new T.Group();
    follower.name = 'follower';
    follower.position.set(0.6, 0, 0);
    follower.userData.s3d_joint = {
      name: 'follower', type: 'prismatic', value: 0, axis: [-1, 0, 0], lower: 0, upper: 0.6,
      mimic: { joint: 'leader', multiplier: 1 },
    };
    const wrist = new T.Group();
    wrist.name = 'wrist';
    wrist.userData.s3d_joint = { name: 'wrist', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: 0.5 };
    wrist.add(new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.12), mat));
    follower.add(wrist);
    leader.add(follower);
    rig.add(leader);

    const payload = new T.Group();
    payload.name = 'Payload';
    payload.add(new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.12), mat));
    writeCapabilities(payload, {
      version: 1, name: 'Payload', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.12, 0.12, 0.12], layer: 'solid' }],
    });
    const comp = composeAsset({
      name: 'NestedCarrier',
      parts: [
        { id: 'rig', object: rig },
        { id: 'payload', object: payload, mount: { parent: 'rig', attachNode: 'leader', at: [0, 0, 0], coupling: 'weld' } },
      ],
    });
    expect(validateComposite(comp).valid).toBe(false);

    // 2. Carriage itself is supplied root with geometry only on child wrist -> clearance derived & wall caught!
    const rootCarriage = new T.Group();
    rootCarriage.name = 'carriage';
    rootCarriage.userData.s3d_joint = { name: 'carriage', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.6 };
    const childWrist = new T.Group();
    childWrist.name = 'wrist';
    childWrist.position.set(0.2, 0, 0);
    childWrist.userData.s3d_joint = { name: 'wrist', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: 1 };
    childWrist.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    rootCarriage.add(childWrist);
    const caps = readSand3dCapabilities(rootCarriage);
    expect(caps?.clearanceZones?.some(z => z.part === 'carriage')).toBe(true);
    const wallPlace = validateScenePlacement([
      { id: 'c', object: rootCarriage, ...(caps ? { capabilities: caps } : {}) },
      {
        id: 'w', position: [0.8, 0, 0],
        capabilities: {
          version: 1, name: 'Wall', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
          colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.1, 0.3, 0.3], layer: 'solid' }],
        },
      },
    ]);
    expect(wallPlace.valid).toBe(false);

    // 3. Visible detachable mesh under a carriage that declares only its own collider MUST be swept!
    const detAsset = new T.Group();
    detAsset.name = 'DetAsset';
    const slide = new T.Group();
    slide.name = 'Slide';
    slide.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    const flag = new T.Group();
    flag.name = 'Flag';
    flag.position.set(0.25, 0, 0);
    flag.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    slide.add(flag);
    detAsset.add(slide);
    writeCapabilities(detAsset, {
      version: 1, name: 'DetAsset', nightZones: [], decals: [],
      riggedParts: [{ name: 'Slide', label: 'Slide', type: 'slide', axis: 'x', range: [0, 0.4] }],
      detachableParts: [{ name: 'Flag', label: 'Flag' }],
      colliders: [{ name: 'Slide', shape: 'box', at: [0, 0, 0], size: [0.1, 0.1, 0.1], node: 'Slide', layer: 'solid' }],
    });
    const flagObs = buildOrientedBox(new T.Matrix4(), [0.65, 0, 0], [0.05, 0.1, 0.1], {
      id: 'o:1', name: 'Wall', ownerId: 'o', kind: 'collider', layer: 'solid',
    });
    expect(checkRiggedSweep(detAsset, { obstacles: [flagObs] }).valid).toBe(false);
    flag.visible = false;
    expect(checkRiggedSweep(detAsset, { obstacles: [flagObs] }).valid).toBe(true);
  });

  it('catches narrow early-stop sweeps, default-steps 3-turn carried loads, independent follower clearances, and crank->bounded-arm clearance', () => {
    const mat = new T.MeshStandardMaterial({ color: '#607080' });

    // 1. 1 m rack driving 180° spoke in first 5 cm -> sweep AND placement catch obstacle at peak (2.5 cm)!
    const fastRig = new T.Group();
    const rack = new T.Group();
    rack.name = 'rack';
    rack.userData.s3d_joint = { name: 'rack', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 1.0 };
    rack.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    const spoke = new T.Group();
    spoke.name = 'spoke';
    spoke.userData.s3d_joint = {
      name: 'spoke', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: Math.PI,
      mimic: { joint: 'rack', multiplier: Math.PI / 0.05 },
    };
    const arm = new T.Mesh(new T.BoxGeometry(0.4, 0.04, 0.04), mat);
    arm.position.set(0.2, 0, 0);
    spoke.add(arm);
    fastRig.add(rack, spoke);

    const topObs = buildOrientedBox(new T.Matrix4(), [0, 0.36, 0], [0.05, 0.04, 0.05], {
      id: 't:1', name: 'TopBar', ownerId: 't', kind: 'collider', layer: 'solid',
    });
    expect(checkRiggedSweep(fastRig, { obstacles: [topObs] }).valid).toBe(false);
    expect(validateScenePlacement([
      { id: 'fast', object: fastRig },
      {
        id: 'bar', position: [0, 0.36, 0],
        capabilities: {
          version: 1, name: 'Bar', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
          colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.1, 0.08, 0.1], layer: 'solid' }],
        },
      },
    ]).valid).toBe(false);

    // 2. validateComposite() default options catch 3-turn carried load without manually passing sweepSteps!
    const spinRig = new T.Group();
    const sLead = new T.Group();
    sLead.name = 's_lead';
    sLead.userData.s3d_joint = { name: 's_lead', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.2 };
    sLead.add(new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.04), mat));
    const sArm = new T.Group();
    sArm.name = 's_arm';
    sArm.userData.s3d_joint = {
      name: 's_arm', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: Math.PI * 6,
      mimic: { joint: 's_lead', multiplier: (Math.PI * 6) / 0.2 },
    };
    sArm.add(new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.04), mat));
    spinRig.add(sLead, sArm);

    const tipLoad = new T.Group();
    tipLoad.name = 'TipLoad';
    tipLoad.add(new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.12), mat));
    writeCapabilities(tipLoad, {
      version: 1, name: 'TipLoad', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.12, 0.12, 0.12], layer: 'solid' }],
    });
    const post = new T.Group();
    post.name = 'Post';
    post.add(new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.12), mat));
    writeCapabilities(post, {
      version: 1, name: 'Post', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.12, 0.12, 0.12], layer: 'solid' }],
    });
    const spinComp = composeAsset({
      name: 'SpinCell',
      parts: [
        { id: 'spin', object: spinRig },
        { id: 'load', object: tipLoad, mount: { parent: 'spin', attachNode: 's_arm', at: [0.8, 0, 0], coupling: 'weld' } },
        { id: 'post', object: post, mount: { at: [0, 0.8, 0], coupling: 'surface' } },
      ],
    });
    expect(validateComposite(spinComp).valid).toBe(false);

    // 3. Independent visibility in validateScenePlacement for leader vs sibling follower clearances + crank -> bounded arm!
    const visScene = new T.Group();
    const lNode = new T.Group(); lNode.name = 'lead';
    lNode.userData.s3d_joint = { name: 'lead', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.4 };
    lNode.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    const fNode = new T.Group(); fNode.name = 'fol'; fNode.position.set(0, 0.6, 0);
    fNode.userData.s3d_joint = { name: 'fol', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.4, mimic: { joint: 'lead', multiplier: 1 } };
    fNode.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    visScene.add(lNode, fNode);
    const visCaps = readSand3dCapabilities(visScene);
    const folObstacle = {
      id: 'fo', position: [0.35, 0.6, 0] as [number, number, number],
      capabilities: {
        version: 1 as const, name: 'FO', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
        colliders: [{ name: 'Body', shape: 'box' as const, at: [0, 0, 0] as [number, number, number], size: [0.1, 0.1, 0.1] as [number, number, number], layer: 'solid' as const }],
      },
    };
    lNode.visible = false;
    expect(validateScenePlacement([{ id: 'v', object: visScene, ...(visCaps ? { capabilities: visCaps } : {}) }, folObstacle]).valid).toBe(false);
    lNode.visible = true; fNode.visible = false;
    expect(validateScenePlacement([{ id: 'v', object: visScene, ...(visCaps ? { capabilities: visCaps } : {}) }, folObstacle]).valid).toBe(true);

    // Continuous crank driving a bounded rotating arm derives clearance for the arm!
    const crankArm = new T.Group();
    const crank = new T.Group(); crank.name = 'crank';
    crank.userData.s3d_joint = { name: 'crank', type: 'continuous', value: 0, axis: [0, 0, 1] };
    crank.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    const bArm = new T.Group(); bArm.name = 'b_arm'; bArm.position.set(0, 0.3, 0);
    bArm.userData.s3d_joint = { name: 'b_arm', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: Math.PI / 2, mimic: { joint: 'crank', multiplier: 0.5 } };
    const bMesh = new T.Mesh(new T.BoxGeometry(0.3, 0.04, 0.04), mat);
    bMesh.position.set(0.15, 0, 0);
    bArm.add(bMesh);
    crankArm.add(crank, bArm);
    expect(readSand3dCapabilities(crankArm)?.clearanceZones?.some(z => z.part === 'b_arm')).toBe(true);
  });

  it('prunes missing mimic leaders across SDK/composite, preserves full 16-turn clip travel & tiny stops, keeps mirrored authored clips intact, and recovers inherited continuous 36090 deg', async () => {
    const mat = new T.MeshStandardMaterial({ color: '#607080' });

    // 1. Missing A in A->B->C inside SDK/composite: restores B=0.4/C=0.4, synthesizes clip, and checks sweep!
    const pruned = new T.Group();
    pruned.name = 'Pruned';
    const bNode = new T.Group(); bNode.name = 'B'; bNode.position.set(0.4, 0, 0);
    bNode.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    const cNode = new T.Group(); cNode.name = 'C'; cNode.position.set(0.4, 0.3, 0);
    cNode.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    pruned.add(bNode, cNode);
    writeCapabilities(pruned, {
      version: 1, name: 'Pruned', detachableParts: [], nightZones: [], decals: [],
      riggedParts: [
        { name: 'A', label: 'A', type: 'slide', axis: 'x', range: [0, 1] },
        { name: 'B', label: 'B', type: 'slide', axis: 'x', range: [0, 1], mimic: { part: 'A', multiplier: 1 } },
        { name: 'C', label: 'C', type: 'slide', axis: 'x', range: [0, 1], mimic: { part: 'B', multiplier: 1 } },
      ],
      state: { pose: { A: 0.4, B: 0.4, C: 0.4 } },
    });
    const standalone = pruned.clone(true);
    const prunedComp = composeAsset({ name: 'PrunedHost', parts: [{ id: 'p', object: pruned }] });
    const prunedBytes = await exportGlb(prunedComp, false);
    const parsedPruned = await new GLTFLoader().parseAsync(prunedBytes, '');
    const compCtrl = createCompositeController(parsedPruned.scene);
    expect(compCtrl.getPart('p/B')).toBeCloseTo(0.4, 3);
    expect(compCtrl.getPart('p/C')).toBeCloseTo(0.4, 3);
    compCtrl.dispose();
    expect(synthesizeRigClips(standalone).length).toBe(1);
    const cObs = buildOrientedBox(new T.Matrix4(), [0.9, 0.3, 0], [0.05, 0.05, 0.05], {
      id: 'co:1', name: 'Block', ownerId: 'co', kind: 'collider', layer: 'solid',
    });
    const prunedSweep = checkRiggedSweep(standalone, { obstacles: [cObs] });
    expect(prunedSweep.checkedParts).toBe(1);
    expect(prunedSweep.valid).toBe(false);

    // 2. 0.20 m rack driving 16-turn follower reaches FULL 0.20 m in baked clip; 0.08 mm stop on 100 m stroke keeps keys <= 45°!
    const rack16 = new T.Group();
    const r16 = new T.Group(); r16.name = 'r16';
    r16.userData.s3d_joint = { name: 'r16', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.2 };
    r16.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    const w16 = new T.Group(); w16.name = 'w16';
    w16.userData.s3d_joint = { name: 'w16', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: Math.PI * 32, mimic: { joint: 'r16', multiplier: (Math.PI * 32) / 0.2 } };
    w16.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    rack16.add(r16, w16);
    const clip16 = synthesizeRigClips(rack16)[0];
    const rTrack = clip16?.tracks.find(t => t.name === 'r16.position');
    const maxX = Math.max(...Array.from(rTrack?.values ?? []).filter((_, i) => i % 3 === 0));
    expect(maxX).toBeCloseTo(0.2, 4);

    const tinyStop = new T.Group();
    const longSlide = new T.Group(); longSlide.name = 'ls';
    longSlide.userData.s3d_joint = { name: 'ls', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 100 };
    longSlide.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    const fastDial = new T.Group(); fastDial.name = 'fd';
    fastDial.userData.s3d_joint = { name: 'fd', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI, mimic: { joint: 'ls', multiplier: Math.PI / 0.00008 } };
    fastDial.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    tinyStop.add(longSlide, fastDial);
    const dialTrack = synthesizeRigClips(tinyStop)[0]?.tracks.find(t => t.name === 'fd.quaternion');
    const dq = dialTrack?.values ?? [];
    for (let i = 0; i + 7 < dq.length; i += 4) {
      const qa = new T.Quaternion(dq[i], dq[i + 1], dq[i + 2], dq[i + 3]);
      const qb = new T.Quaternion(dq[i + 4], dq[i + 5], dq[i + 6], dq[i + 7]);
      expect(T.MathUtils.radToDeg(qa.angleTo(qb))).toBeLessThanOrEqual(45.5);
    }

    // 3. Mirrored [1, -1, 1] pivot with animated .scale + resolveAssetVolumes() before playing gltf.animations matches raw playback!
    const scaleAnim = new T.Group();
    const sPiv = new T.Group();
    sPiv.name = 'spiv';
    sPiv.scale.set(1, -1, 1);
    sPiv.userData.s3d_joint = { name: 'spiv', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI / 2 };
    const sLeaf = new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.04), mat);
    sLeaf.position.set(0, 0.5, 0);
    sPiv.add(sLeaf);
    scaleAnim.add(sPiv);
    scaleAnim.animations = [
      new T.AnimationClip('Stretch', 1, [
        new T.VectorKeyframeTrack('spiv.scale', [0, 1], [1, -1, 1, 1, -2, 1]),
      ]),
    ];
    const scaleBytes = await exportGlb(scaleAnim, true);
    const rawLoaded = await new GLTFLoader().parseAsync(scaleBytes, '');
    // Calling resolveAssetVolumes before playing rawLoaded.animations MUST NOT mutate spiv.scale or flip Y!
    resolveAssetVolumes({ id: 'sa', object: rawLoaded.scene });
    const rawMix = new T.AnimationMixer(rawLoaded.scene);
    if (rawLoaded.animations[0]) rawMix.clipAction(rawLoaded.animations[0]).play();
    rawMix.update(0.5);
    rawLoaded.scene.updateMatrixWorld(true);
    const tipAfterResolve = new T.Vector3(0, 0.5, 0).applyMatrix4(rawLoaded.scene.getObjectByName('spiv')?.matrixWorld ?? new T.Matrix4());
    expect(tipAfterResolve.y).toBeCloseTo(-0.75, 3);

    const impScale = await openStoredFile(new Blob([scaleBytes]), 'scale-mirror.glb');
    const impMix = new T.AnimationMixer(impScale.group);
    if (impScale.group.animations[0]) impMix.clipAction(impScale.group.animations[0]).play();
    impMix.update(0.5);
    impScale.group.updateMatrixWorld(true);
    const tipImp = new T.Vector3(0, 0.5, 0).applyMatrix4(impScale.group.getObjectByName('spiv')?.matrixWorld ?? new T.Matrix4());
    expect(tipImp.y).toBeCloseTo(-0.75, 3);
    impScale.controller.dispose();

    // 4. Inherited continuous follower at 36,090 deg recovers 36,090 deg in BOTH inspectAsset and readSand3dCapabilities!
    const motorRig = new T.Group();
    const motor = new T.Group(); motor.name = 'motor';
    motor.userData.s3d_joint = { name: 'motor', type: 'continuous', value: 0, axis: [0, 1, 0] };
    motor.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    const gear = new T.Group(); gear.name = 'gear';
    gear.userData.s3d_joint = { name: 'gear', type: 'revolute', value: 0, axis: [0, 1, 0], mimic: { joint: 'motor', multiplier: 1 } };
    gear.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    motorRig.add(motor, gear);
    const mCtrl = createAssetController(motorRig);
    mCtrl.setPart('motor', 36090);
    const mSnap = cloneForExport(motorRig, { includePartClips: false }, mCtrl);
    const mBytes = await exportGlb(mSnap.root, false);
    mSnap.dispose();
    mCtrl.dispose();
    const mParsed = await new GLTFLoader().parseAsync(mBytes, '');
    const s3dMotor = readSand3dCapabilities(mParsed.scene);
    expect(inspectAsset(mParsed.scene).state?.pose?.gear).toBeCloseTo(36090, 1);
    expect(s3dMotor?.state?.pose?.gear).toBeCloseTo(36090, 1);
    // Resetting via fresh readSand3dCapabilities returns gear physically to 0° (identity quaternion), NOT 90°!
    const mCtrl2 = createAssetController(mParsed.scene, s3dMotor ?? undefined);
    mCtrl2.resetParts();
    const gNode = mParsed.scene.getObjectByName('gear');
    expect(gNode?.quaternion.angleTo(new T.Quaternion())).toBeCloseTo(0, 4);
    mCtrl2.dispose();
  });

  it('covers r4 pinpoint invariants: detachable Mesh, posed root carriage, 16/96-turn alias-free sampling, continuous crank reach, bounded 360->1080, co-moving payload, direct deriveSpatialMetadata on pruned chains, strict Float32 GLB timestamps, and root-relative .scale mirror tracks', async () => {
    const mat = new T.MeshStandardMaterial({ color: '#607080' });

    // 1. Detachable Mesh (directly a T.Mesh, not a Group) under collider-bearing Slide is caught by sweep!
    const dm = new T.Group();
    const s1 = new T.Group(); s1.name = 'Slide'; s1.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    const flagMesh = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat);
    flagMesh.name = 'Flag'; flagMesh.position.set(0.25, 0, 0);
    s1.add(flagMesh); dm.add(s1);
    writeCapabilities(dm, {
      version: 1, name: 'DM', nightZones: [], decals: [],
      riggedParts: [{ name: 'Slide', label: 'Slide', type: 'slide', axis: 'x', range: [0, 0.4] }],
      detachableParts: [{ name: 'Flag', label: 'Flag' }],
      colliders: [{ name: 'Slide', shape: 'box', at: [0, 0, 0], size: [0.1, 0.1, 0.1], node: 'Slide', layer: 'solid' }],
    });
    const wall65 = buildOrientedBox(new T.Matrix4(), [0.65, 0, 0], [0.05, 0.1, 0.1], { id: 'w:1', name: 'W', ownerId: 'w', kind: 'collider', layer: 'solid' });
    expect(checkRiggedSweep(dm, { obstacles: [wall65] }).valid).toBe(false);

    // 2. Posed root carriage (root itself is posed at 0.60 m): empty sweep passes, placement catches return wall at x = 0.20 m!
    const posedRoot = new T.Group(); posedRoot.name = 'carriage'; posedRoot.position.set(0.6, 0, 0);
    posedRoot.userData.s3d_joint = { name: 'carriage', type: 'prismatic', value: 0.6, axis: [1, 0, 0], lower: 0, upper: 0.6 };
    const rw = new T.Group(); rw.name = 'wrist'; rw.position.set(0.2, 0, 0);
    rw.userData.s3d_joint = { name: 'wrist', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: 1 };
    rw.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    posedRoot.add(rw);
    expect(checkRiggedSweep(posedRoot).valid).toBe(true);
    expect(validateScenePlacement([
      { id: 'pr', object: posedRoot },
      { id: 'w20', position: [0.2, 0, 0], capabilities: { version: 1, name: 'W', riggedParts: [], detachableParts: [], nightZones: [], decals: [], colliders: [{ name: 'B', shape: 'box', at: [0, 0, 0], size: [0.06, 0.2, 0.2], layer: 'solid' }] } },
    ]).valid).toBe(false);

    // 3. 16-turn spoke passes empty sweep; 96-turn 1 m spoke catches wall at y = 0.98 m in BOTH sweep & placement!
    const makeMultiTurn = (turns: number) => {
      const g = new T.Group();
      const sl = new T.Group(); sl.name = 'sl'; sl.userData.s3d_joint = { name: 'sl', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.2 };
      sl.add(new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.04), mat));
      const sp = new T.Group(); sp.name = 'sp';
      sp.userData.s3d_joint = { name: 'sp', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: Math.PI * 2 * turns, mimic: { joint: 'sl', multiplier: (Math.PI * 2 * turns) / 0.2 } };
      const bar = new T.Mesh(new T.BoxGeometry(1.0, 0.04, 0.04), mat); bar.position.set(0.5, 0, 0);
      sp.add(bar); g.add(sl, sp); return g;
    };
    expect(checkRiggedSweep(makeMultiTurn(16)).valid).toBe(true);
    const spoke96 = makeMultiTurn(96);
    const wall98 = buildOrientedBox(new T.Matrix4(), [0, 0.98, 0], [0.05, 0.03, 0.05], { id: 'w:98', name: 'W98', ownerId: 'w', kind: 'collider', layer: 'solid' });
    expect(checkRiggedSweep(spoke96, { obstacles: [wall98] }).valid).toBe(false);
    expect(validateScenePlacement([
      { id: 's96', object: spoke96 },
      { id: 'w98', position: [0, 0.98, 0], capabilities: { version: 1, name: 'W', riggedParts: [], detachableParts: [], nightZones: [], decals: [], colliders: [{ name: 'B', shape: 'box', at: [0, 0, 0], size: [0.1, 0.06, 0.1], layer: 'solid' }] } },
    ]).valid).toBe(false);

    // 4. Continuous crank -> 0.20 m slide at 0.01 m/rad catches wall at x = 0.19 m; bounded 360° -> 1080° emits clearance!
    const crankSlide = new T.Group();
    const ck = new T.Group(); ck.name = 'ck'; ck.userData.s3d_joint = { name: 'ck', type: 'continuous', value: 0, axis: [0, 0, 1] };
    ck.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    const cs = new T.Group(); cs.name = 'cs'; cs.userData.s3d_joint = { name: 'cs', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.2, mimic: { joint: 'ck', multiplier: 0.01 } };
    cs.add(new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.04), mat));
    crankSlide.add(ck, cs);
    const wall19 = buildOrientedBox(new T.Matrix4(), [0.19, 0, 0], [0.02, 0.1, 0.1], { id: 'w:19', name: 'W19', ownerId: 'w', kind: 'collider', layer: 'solid' });
    expect(checkRiggedSweep(crankSlide, { obstacles: [wall19] }).valid).toBe(false);
    const rot360 = new T.Group();
    const r360 = new T.Group(); r360.name = 'r360'; r360.userData.s3d_joint = { name: 'r360', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: Math.PI * 2 };
    r360.add(new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.04), mat));
    const s1080 = new T.Group(); s1080.name = 's1080'; s1080.userData.s3d_joint = { name: 's1080', type: 'revolute', value: 0, axis: [0, 0, 1], lower: 0, upper: Math.PI * 6, mimic: { joint: 'r360', multiplier: 3 } };
    const sm = new T.Mesh(new T.BoxGeometry(0.6, 0.04, 0.04), mat); sm.position.set(0.3, 0, 0); s1080.add(sm);
    rot360.add(r360, s1080);
    expect(readSand3dCapabilities(rot360)?.clearanceZones?.some(z => z.part === 's1080')).toBe(true);

    // 5. Parallel co-moving slides (0.30 m separation) with payload on leader pass validateComposite!
    const par = new T.Group();
    const pLead = new T.Group(); pLead.name = 'p_lead'; pLead.position.set(0.3, 0, 0);
    pLead.userData.s3d_joint = { name: 'p_lead', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.6 };
    pLead.add(new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.06), mat));
    const pFol = new T.Group(); pFol.name = 'p_fol';
    pFol.userData.s3d_joint = { name: 'p_fol', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.6, mimic: { joint: 'p_lead', multiplier: 1 } };
    pFol.add(new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.06), mat));
    par.add(pLead, pFol);
    const loadBox = new T.Group(); loadBox.name = 'Load'; loadBox.add(new T.Mesh(new T.BoxGeometry(0.08, 0.08, 0.08), mat));
    writeCapabilities(loadBox, { version: 1, name: 'Load', riggedParts: [], detachableParts: [], nightZones: [], decals: [], colliders: [{ name: 'B', shape: 'box', at: [0, 0, 0], size: [0.08, 0.08, 0.08], layer: 'solid' }] });
    const parComp = composeAsset({ name: 'ParCell', parts: [{ id: 'par', object: par }, { id: 'load', object: loadBox, mount: { parent: 'par', attachNode: 'p_lead', at: [0, 0, 0], coupling: 'weld' } }] });
    expect(validateComposite(parComp).valid).toBe(true);

    // 6. Tiny 0.08 mm / 100 m stop clip has strictly increasing Float32 timestamps (glTF 2.0 §5.8.1)!
    const tsRig = new T.Group();
    const ls = new T.Group(); ls.name = 'ls'; ls.userData.s3d_joint = { name: 'ls', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 100 };
    ls.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    const fd = new T.Group(); fd.name = 'fd'; fd.userData.s3d_joint = { name: 'fd', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI, mimic: { joint: 'ls', multiplier: Math.PI / 0.00008 } };
    fd.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    tsRig.add(ls, fd);
    const tsTimes = synthesizeRigClips(tsRig)[0]?.tracks[0]?.times ?? [];
    for (let i = 1; i < tsTimes.length; i++) {
      expect(Math.fround(tsTimes[i] ?? 0)).toBeGreaterThan(Math.fround(tsTimes[i - 1] ?? 0));
    }

    // 7. Root-relative ".scale" track on mirrored [1,-1,1] root preserves tip Y = -0.75 m after cloneForExport + GLB reload!
    const mRoot = new T.Group(); mRoot.name = 'm_root'; mRoot.scale.set(1, -1, 1);
    mRoot.userData.s3d_joint = { name: 'm_root', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI / 2 };
    const mLeaf = new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.04), mat); mLeaf.position.set(0, 0.5, 0); mRoot.add(mLeaf);
    mRoot.animations = [new T.AnimationClip('RootScale', 1, [new T.VectorKeyframeTrack('.scale', [0, 1], [1, -1, 1, 1, -2, 1])])];
    const mSnap = cloneForExport(mRoot, { includePartClips: false }, null);
    const mBytes = await exportGlb(mSnap.root, true);
    mSnap.dispose();
    const mReload = await new GLTFLoader().parseAsync(mBytes, '');
    const mMix = new T.AnimationMixer(mReload.scene);
    if (mReload.animations[0]) mMix.clipAction(mReload.animations[0]).play();
    mMix.update(0.5); mReload.scene.updateMatrixWorld(true);
    const mTarget = mReload.scene.getObjectByName('m_root') ?? mReload.scene;
    expect(new T.Vector3(0, 0.5, 0).applyMatrix4(mTarget.matrixWorld).y).toBeCloseTo(-0.75, 3);
  });
});
