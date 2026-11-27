import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { applyImportEdits, openStoredFile, reconcileSavedEdits } from '../imports/asset';
import { cloneForExport } from '../studio/export';
import { composeAsset, validateComposite } from './compose';
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

describe('Sand3D importer & rig regression tests (unit scale, reflections, mimic chains, clips, sweeps, edits)', () => {
  it('handles Sand3D default mm (0.001 root scale) prismatic travel, baked clips, and manifest-only collider scale', async () => {
    const world = new T.Group();
    world.name = 'mm_cabinet';
    world.scale.set(0.001, 0.001, 0.001);
    const mat = new T.MeshStandardMaterial({ color: '#d0d0d0' });

    const body = new T.Mesh(new T.BoxGeometry(600, 800, 600), mat);
    body.position.set(0, 400, 0);
    world.add(body);

    // Posed drawer at 0.420 m (rest 0.300 m + 0.120 m slide; range 0..0.200 m -> 0.300..0.500 m).
    const drawer = new T.Group();
    drawer.name = 'drawer_slide';
    drawer.position.set(0, 700, 420);
    drawer.userData.s3d_joint = { name: 'drawer_slide', type: 'prismatic', value: 0.12, axis: [0, 0, 1], lower: 0, upper: 0.2 };
    drawer.add(new T.Mesh(new T.BoxGeometry(120, 100, 200), mat));
    world.add(drawer);

    // 200 mm door hinge for manifest-only collider size verification (0.1 m half-width, NOT 100 m).
    const door = new T.Group();
    door.name = 'door_hinge';
    door.position.set(300, 400, 300);
    door.userData.s3d_joint = { name: 'door_hinge', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI / 2 };
    const doorMesh = new T.Mesh(new T.BoxGeometry(200, 400, 20), mat);
    doorMesh.position.set(-100, 0, 0);
    door.add(doorMesh);
    world.add(door);

    const bytes = await exportGlb(world, false);
    const loaded = await openStoredFile(new Blob([bytes]), 'mm-cabinet.glb');

    const drawerNode = loaded.group.getObjectByName('drawer_slide');
    expect(drawerNode).toBeDefined();
    expect(loaded.controller.getPart('drawer_slide')).toBeCloseTo(0.12, 4);

    // Closing moves world Z to 0.300 m; opening moves world Z to 0.500 m.
    loaded.controller.closePart('drawer_slide');
    loaded.group.updateMatrixWorld(true);
    const closedZ = new T.Vector3().setFromMatrixPosition(drawerNode?.matrixWorld ?? new T.Matrix4()).z;
    expect(closedZ).toBeCloseTo(0.3, 4);

    loaded.controller.openPart('drawer_slide');
    loaded.group.updateMatrixWorld(true);
    const openZ = new T.Vector3().setFromMatrixPosition(drawerNode?.matrixWorld ?? new T.Matrix4()).z;
    expect(openZ).toBeCloseTo(0.5, 4);

    // Manifest-only (headless) OBB for the 200 mm door must match live OBB half-width (0.1 m, not 100 m).
    const liveVols = resolveAssetVolumes({ id: 'cab', object: loaded.group, capabilities: loaded.capabilities });
    const headlessVols = resolveAssetVolumes({ id: 'cab', capabilities: loaded.capabilities });
    const liveDoor = liveVols.find(v => v.kind === 'collider' && v.part === 'door_hinge');
    const headlessDoor = headlessVols.find(v => v.kind === 'collider' && v.part === 'door_hinge');
    expect(liveDoor?.halfExtents[0]).toBeCloseTo(0.1, 3);
    expect(headlessDoor?.halfExtents[0]).toBeCloseTo(0.1, 3);

    // Baked AnimationClip also drives the mm-scaled drawer to 0.500 m world Z at t = 0.9 s after binary round-trip.
    const snap = cloneForExport(loaded.group, { includePartClips: true }, loaded.controller);
    const reBytes = await exportGlb(snap.root, true);
    snap.dispose();
    const gltf = await new GLTFLoader().parseAsync(reBytes, '');
    const drawerClip = gltf.animations.find(c => /drawer/i.test(c.name));
    expect(drawerClip).toBeDefined();
    const mixer = new T.AnimationMixer(gltf.scene);
    if (drawerClip) mixer.clipAction(drawerClip).play();
    mixer.update(0.9);
    gltf.scene.updateMatrixWorld(true);
    const reDrawer = gltf.scene.getObjectByName('drawer_slide');
    const animZ = new T.Vector3().setFromMatrixPosition(reDrawer?.matrixWorld ?? new T.Matrix4()).z;
    expect(animZ).toBeCloseTo(0.5, 3);
    loaded.controller.dispose();
  });

  it('preserves mirrored [1,-1,1] and [-1,-1,1] hinge direction across clip-less binary round-trips and syncs s3d_joint.value', async () => {
    const buildMirrored = (sx: number, sy: number, sz: number) => {
      const root = new T.Group();
      root.name = 'mirrored_gate';
      const pivot = new T.Group();
      pivot.name = 'hinge';
      pivot.scale.set(sx, sy, sz);
      pivot.userData.s3d_joint = { name: 'hinge', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI / 2 };
      const leaf = new T.Mesh(new T.BoxGeometry(0.6, 1.0, 0.04), new T.MeshStandardMaterial({ color: '#778899' }));
      leaf.position.set(0.3, 0.5, 0);
      pivot.add(leaf);
      root.add(pivot);
      return root;
    };

    // Case A: [1, -1, 1] exported WITHOUT clips -> matrix decompose changes scale to [-1, 1, 1]; swing must NOT reverse.
    const rootA = buildMirrored(1, -1, 1);
    const ctrlA = createAssetController(rootA);
    ctrlA.setPart('hinge', 90);
    const tipBefore = new T.Vector3(0.3, 0.5, 0).applyMatrix4(rootA.getObjectByName('hinge')?.matrixWorld ?? new T.Matrix4());
    // Also pose to 70 deg before exporting to verify s3d_joint.value syncs with extras.formFoundry.state.pose!
    ctrlA.setPart('hinge', 70);
    const snapA = cloneForExport(rootA, { includePartClips: false }, ctrlA);
    const bytesA = await exportGlb(snapA.root, false);
    snapA.dispose();
    ctrlA.dispose();

    const parsedA = await new GLTFLoader().parseAsync(bytesA, '');
    const ffCaps = inspectAsset(parsedA.scene);
    const s3dCaps = readSand3dCapabilities(parsedA.scene);
    expect(ffCaps.state?.pose?.hinge).toBeCloseTo(70, 2);
    expect(s3dCaps?.state?.pose?.hinge).toBeCloseTo(70, 2);

    const ctrlA2 = createAssetController(parsedA.scene, ffCaps);
    ctrlA2.setPart('hinge', 90);
    const tipAfter = new T.Vector3(0.3, 0.5, 0).applyMatrix4(parsedA.scene.getObjectByName('hinge')?.matrixWorld ?? new T.Matrix4());
    expect(tipAfter.z).toBeCloseTo(tipBefore.z, 3);
    expect(tipAfter.x).toBeCloseTo(tipBefore.x, 3);
    ctrlA2.dispose();

    // Case B: two negative scale components [-1, -1, 1] (det = +1) must swing along exact local +Y rotation!
    const rootB = buildMirrored(-1, -1, 1);
    const ctrlB = createAssetController(rootB);
    ctrlB.setPart('hinge', 90);
    // Desired: diag(-1,-1,1) * RotY(+90°) * (0.3, 0.5, 0) = diag(-1,-1,1) * (0, 0.5, -0.3) = (0, -0.5, -0.3).
    const tipB = new T.Vector3(0.3, 0.5, 0).applyMatrix4(rootB.getObjectByName('hinge')?.matrixWorld ?? new T.Matrix4());
    expect(tipB.z).toBeCloseTo(-0.3, 3);
    expect(tipB.y).toBeCloseTo(-0.5, 3);
    ctrlB.dispose();
  });

  it('subdivides baked clips when a slide drives a 360-deg mimic wheel and bounds malformed ranges safely', async () => {
    const rig = new T.Group();
    rig.name = 'rack_and_pinion';
    const mat = new T.MeshStandardMaterial({ color: '#607080' });
    const rack = new T.Group();
    rack.name = 'rack';
    rack.userData.s3d_joint = { name: 'rack', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.2 };
    rack.add(new T.Mesh(new T.BoxGeometry(0.4, 0.05, 0.05), mat));
    rig.add(rack);

    const wheel = new T.Group();
    wheel.name = 'wheel';
    wheel.position.set(0, 0.2, 0);
    // 0.2 m rack travel drives wheel by 2*PI rad (360 deg).
    wheel.userData.s3d_joint = {
      name: 'wheel',
      type: 'revolute',
      value: 0,
      axis: [0, 0, 1],
      lower: 0,
      upper: Math.PI * 2,
      mimic: { joint: 'rack', multiplier: (Math.PI * 2) / 0.2 },
    };
    const spoke = new T.Mesh(new T.BoxGeometry(0.2, 0.02, 0.02), mat);
    spoke.position.set(0.1, 0, 0);
    wheel.add(spoke);
    rig.add(wheel);

    const ctrl = createAssetController(rig);
    const snap = cloneForExport(rig, { includePartClips: true }, ctrl);
    const bytes = await exportGlb(snap.root, true);
    snap.dispose();
    ctrl.dispose();

    const gltf = await new GLTFLoader().parseAsync(bytes, '');
    const clip = gltf.animations[0];
    expect(clip).toBeDefined();
    const mixer = new T.AnimationMixer(gltf.scene);
    if (clip) mixer.clipAction(clip).play();
    // At half open leg (t = 0.45 s), rack is at 0.1 m and wheel MUST be at 180 deg (NOT collapsed to 0 deg!).
    mixer.update(0.45);
    gltf.scene.updateMatrixWorld(true);
    const rNode = gltf.scene.getObjectByName('rack');
    const wNode = gltf.scene.getObjectByName('wheel');
    expect(rNode?.position.x).toBeCloseTo(0.1, 3);
    const spokeTip = new T.Vector3(0.2, 0, 0).applyMatrix4(wNode?.matrixWorld ?? new T.Matrix4());
    expect(spokeTip.x).toBeCloseTo(-0.2, 2);

    // Malformed overflow / huge rotation limits must be rejected or capped without exhausting keyframe budgets.
    const bad = new T.Group();
    const badPivot = new T.Group();
    badPivot.name = 'overflow_hinge';
    badPivot.userData.s3d_joint = { name: 'overflow_hinge', type: 'revolute', value: 0, axis: [0, 1, 0], lower: -1e308, upper: 1e308 };
    badPivot.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    bad.add(badPivot);
    const hugePivot = new T.Group();
    hugePivot.name = 'huge_spin';
    hugePivot.userData.s3d_joint = { name: 'huge_spin', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: 500 }; // ~28,648 deg
    hugePivot.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    bad.add(hugePivot);
    const badCaps = readSand3dCapabilities(bad);
    expect(badCaps?.riggedParts.find(p => p.name === 'overflow_hinge')).toBeUndefined();
    const hugeClips = synthesizeRigClips(bad, badCaps ?? undefined);
    expect(hugeClips[0]?.tracks[0]?.times.length ?? 0).toBeLessThanOrEqual(130);
  });

  it('includes follower travel in derived clearance, supports fresh Sand3D SDK sweeps, and catches payloads on sibling followers', () => {
    const mat = new T.MeshStandardMaterial({ color: '#506070' });
    // 1. Helical screw cap in empty scene: derived clearance includes cap_lift's 40 mm rise -> zero false exceeds-clearance!
    const bottle = new T.Group();
    bottle.name = 'bottle';
    bottle.add(new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.2, 8), mat));
    const capTurn = new T.Group();
    capTurn.name = 'cap_turn';
    capTurn.position.set(0, 0.1, 0);
    capTurn.userData.s3d_joint = { name: 'cap_turn', type: 'revolute', value: 0, axis: [0, 1, 0], lower: 0, upper: Math.PI * 4 };
    const capLift = new T.Group();
    capLift.name = 'cap_lift';
    capLift.userData.s3d_joint = {
      name: 'cap_lift', type: 'prismatic', value: 0, axis: [0, 1, 0], lower: 0, upper: 0.04,
      mimic: { joint: 'cap_turn', multiplier: 0.04 / (Math.PI * 4) },
    };
    const capMesh = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.03, 8), mat);
    capMesh.position.set(0, 0.015, 0);
    capLift.add(capMesh);
    capTurn.add(capLift);
    bottle.add(capTurn);

    // Fresh Sand3D scene passed directly to checkRiggedSweep (NO explicit capabilities!) checks parts AND passes in empty scene!
    const emptySweep = checkRiggedSweep(bottle, { steps: 13 });
    expect(emptySweep.checkedParts).toBe(1);
    expect(emptySweep.valid).toBe(true);

    // Same fresh Sand3D scene detects an obstacle via checkRiggedSweep AND validateScenePlacement without explicit capabilities!
    const blocker = buildOrientedBox(new T.Matrix4(), [0, 0.15, 0], [0.1, 0.01, 0.1], {
      id: 'shelf:body', name: 'Shelf', ownerId: 'shelf', kind: 'collider', layer: 'solid',
    });
    const blockedSweep = checkRiggedSweep(bottle, { obstacles: [blocker], steps: 9, tolerance: 0.002 });
    expect(blockedSweep.valid).toBe(false);
    const placeRes = validateScenePlacement([
      { id: 'bottle', object: bottle },
      {
        id: 'shelf',
        position: [0, 0.15, 0],
        capabilities: {
          version: 1, name: 'Shelf', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
          colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.2, 0.02, 0.2], layer: 'solid' }],
        },
      },
    ]);
    expect(placeRes.valid).toBe(false);

    // 2. Composite payload welded onto a SIBLING mimic follower hitting a wall MUST fail validateComposite()!
    const machine = new T.Group();
    machine.name = 'dual_slider';
    const base = new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), mat);
    base.position.set(0, 0.1, 0);
    machine.add(base);
    const leader = new T.Group();
    leader.name = 'handle';
    leader.position.set(0, 0.2, 0);
    leader.userData.s3d_joint = { name: 'handle', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.5 };
    leader.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    machine.add(leader);
    const sibling = new T.Group();
    sibling.name = 'carriage';
    sibling.position.set(0, 0.2, 0.4);
    sibling.userData.s3d_joint = {
      name: 'carriage', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.5,
      mimic: { joint: 'handle', multiplier: 1 },
    };
    sibling.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    machine.add(sibling);

    const payload = new T.Group();
    payload.name = 'Payload';
    payload.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), mat));
    writeCapabilities(payload, {
      version: 1, name: 'Payload', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.1, 0.1, 0.1], layer: 'solid' }],
    });

    const wall = new T.Group();
    wall.name = 'Wall';
    wall.add(new T.Mesh(new T.BoxGeometry(0.1, 0.4, 0.2), mat));
    writeCapabilities(wall, {
      version: 1, name: 'Wall', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.1, 0.4, 0.2], layer: 'solid' }],
    });

    const comp = composeAsset({
      name: 'SiblingCarryCell',
      parts: [
        { id: 'machine', object: machine },
        { id: 'payload', object: payload, mount: { parent: 'machine', attachNode: 'carriage', at: [0, 0.1, 0], coupling: 'weld' } },
        { id: 'wall', object: wall, mount: { at: [0.5, 0.3, 0.4], coupling: 'surface' } },
      ],
    });
    const report = validateComposite(comp);
    expect(report.valid).toBe(false);
    expect(report.sweeps.machine?.valid).toBe(false);
  });

  it('clamps multi-level mimic chains consistently, enforces follower read-only rules, preserves tiny/legacy poses, and sanitizes generated names', async () => {
    const mat = new T.MeshStandardMaterial({ color: '#607080' });
    const root = new T.Group();
    root.name = 'chain_rig';

    // Put C before B in traversal order to verify topological multi-level range inference (only A declares limits)!
    const nodeC = new T.Group();
    nodeC.name = 'part_c';
    nodeC.userData.s3d_joint = { name: 'part_c', type: 'prismatic', value: 0, axis: [1, 0, 0], mimic: { joint: 'part_b', multiplier: 1 } };
    nodeC.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    root.add(nodeC);

    const nodeB = new T.Group();
    nodeB.name = 'part_b';
    nodeB.userData.s3d_joint = { name: 'part_b', type: 'prismatic', value: 0, axis: [1, 0, 0], lower: 0, upper: 0.2, mimic: { joint: 'part_a', multiplier: 1 } };
    nodeB.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    root.add(nodeB);

    const nodeA = new T.Group();
    nodeA.name = 'part_a';
    nodeA.userData.s3d_joint = { name: 'part_a', type: 'prismatic', value: 0.0004, axis: [1, 0, 0], lower: 0, upper: 1 };
    nodeA.position.set(0.0004, 0, 0);
    nodeA.add(new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat));
    root.add(nodeA);

    // Unnamed pivot with spaces in extras name ("door hinge") must sanitize cleanly and survive binary round-trip!
    const spaced = new T.Group();
    spaced.quaternion.setFromAxisAngle(new T.Vector3(0, 1, 0), T.MathUtils.degToRad(60));
    spaced.userData.s3d_joint = { name: 'door hinge', type: 'revolute', value: T.MathUtils.degToRad(60), axis: [0, 1, 0], lower: 0, upper: Math.PI / 2 };
    spaced.add(new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.02), mat));
    root.add(spaced);

    const rawBytes = await exportGlb(root, false);
    const asset = await openStoredFile(new Blob([rawBytes]), 'chain.glb');
    expect(asset.capabilities.riggedParts.find(p => p.name === 'part_c')?.range).toEqual([0, 0.2]);
    expect(asset.capabilities.riggedParts.find(p => p.name === 'door_hinge')).toBeDefined();
    // Sub-millimetre 0.0004 m slide must NOT round down to 0!
    expect(asset.controller.getPart('part_a')).toBeCloseTo(0.0004, 5);
    expect(asset.edits.pose?.part_a).toBeCloseTo(0.0004, 5);

    // Multi-level clamping: setting A = 1 stops B at 0.2 AND C at 0.2!
    asset.controller.setPart('part_a', 1);
    expect(asset.controller.getPart('part_b')).toBeCloseTo(0.2, 5);
    expect(asset.controller.getPart('part_c')).toBeCloseTo(0.2, 5);
    // Direct follower write throws (consistent with disabled UI control).
    expect(() => asset.controller.setPart('part_b', 0.1)).toThrow(/coupled to "part_a"/);

    // Setting leader = 0 while stale follower value sits in pose map zeroes BOTH leader and followers!
    applyImportEdits(asset, { ...asset.edits, pose: { part_a: 0, part_b: 0.2, part_c: 0.2 } });
    expect(asset.controller.getPart('part_a')).toBe(0);
    expect(asset.controller.getPart('part_b')).toBe(0);
    expect(asset.controller.getPart('part_c')).toBe(0);

    // Legacy saved edits (no pose key, no knownRiggedParts) preserve authored 60° pose from the GLB!
    const reopened = await openStoredFile(new Blob([rawBytes]), 'chain.glb');
    const legacy = reconcileSavedEdits(reopened, { name: 'Legacy', tint: '#ffffff', scale: 1, proportion: 1 });
    expect(legacy.edits.pose?.door_hinge).toBeCloseTo(60, 1);
    // New saved edits (knownRiggedParts includes door_hinge, pose omitted) respect user's reset to 0°!
    const explicitReset = reconcileSavedEdits(reopened, { name: 'Reset', tint: '#ffffff', scale: 1, proportion: 1 }, ['door_hinge', 'part_a', 'part_b', 'part_c']);
    expect(explicitReset.edits.pose?.door_hinge).toBeUndefined();

    // Re-export & reload preserves sanitized "door_hinge" without dropping it.
    const snap = cloneForExport(reopened.group, { includePartClips: false }, reopened.controller);
    const reBytes = await exportGlb(snap.root, false);
    snap.dispose();
    const roundTripped = await openStoredFile(new Blob([reBytes]), 'chain-rt.glb');
    expect(roundTripped.capabilities.riggedParts.find(p => p.name === 'door_hinge')).toBeDefined();

    asset.controller.dispose();
    reopened.controller.dispose();
    roundTripped.controller.dispose();
  });
});
