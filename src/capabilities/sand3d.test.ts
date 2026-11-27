import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { openStoredFile } from '../imports/asset';
import { cloneForExport } from '../studio/export';
import { composeAsset, validateComposite } from './compose';
import { createCompositeController } from './compose-runtime';
import { buildOrientedBox } from './obb';
import { createAssetController, inspectAsset, synthesizeRigClips } from './runtime';
import { hasSand3dJoints, readSand3dCapabilities } from './sand3d';
import { parseCapabilities, writeCapabilities } from './schema';
import { checkRiggedSweep } from './sweep';

async function exportRawGlb(scene: T.Object3D): Promise<ArrayBuffer> {
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
    return await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true }) as ArrayBuffer;
  } finally {
    if (prevReader === undefined) delete (globalThis as { FileReader?: unknown }).FileReader;
  }
}

/** Build a synthetic Sand3D washing machine matching `src/sand3d/urdf.py`'s exact `node.extras.s3d_joint` schema. */
function makeSand3dWasher(posed = false): T.Group {
  const root = new T.Group();
  root.name = 'washing_machine';
  const matWhite = new T.MeshStandardMaterial({ color: '#f2f2f0', roughness: 0.5 });
  const matSteel = new T.MeshStandardMaterial({ color: '#8d9298', metalness: 0.8, roughness: 0.3 });

  const cab = new T.Mesh(new T.BoxGeometry(0.6, 0.85, 0.6), matWhite);
  cab.name = 'cabinet';
  cab.position.set(0, 0.425, 0);
  root.add(cab);

  // Door hinge on +X face, -Y Z-up edge -> glTF Y-up axis [0, -1, 0], range 0..143 deg.
  const doorAngle = posed ? T.MathUtils.degToRad(92) : 0;
  const doorPivot = new T.Group();
  doorPivot.name = 'door_hinge';
  doorPivot.position.set(0.3, 0.4, 0.24);
  doorPivot.quaternion.setFromAxisAngle(new T.Vector3(0, -1, 0), doorAngle);
  doorPivot.userData.s3d_joint = {
    name: 'door_hinge',
    type: 'revolute',
    value: doorAngle,
    axis: [0, -1, 0],
    lower: 0,
    upper: T.MathUtils.degToRad(143),
  };
  const doorMesh = new T.Mesh(new T.BoxGeometry(0.045, 0.48, 0.48), matSteel);
  doorMesh.name = 'door';
  doorMesh.position.set(0.0225, 0, -0.24);
  doorPivot.add(doorMesh);
  root.add(doorPivot);

  // Continuous spinning drum about +X.
  const drumPivot = new T.Group();
  drumPivot.name = 'drum_spin';
  drumPivot.position.set(0.1, 0.4, 0);
  drumPivot.userData.s3d_joint = {
    name: 'drum_spin',
    type: 'continuous',
    value: 0,
    axis: [1, 0, 0],
  };
  const drumMesh = new T.Mesh(new T.CylinderGeometry(0.21, 0.21, 0.35, 12), matSteel);
  drumMesh.rotation.z = Math.PI / 2;
  drumPivot.add(drumMesh);
  root.add(drumPivot);

  // Prismatic drawer whose pivot node is rotated +90 deg around Y (face frame looking +X): local +Z slides along parent +X!
  const drawerSlide = posed ? 0.12 : 0;
  const drawerPivot = new T.Group();
  drawerPivot.name = 'drawer_slide';
  drawerPivot.quaternion.setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 2);
  drawerPivot.position.set(0.3 + drawerSlide, 0.77, -0.15);
  drawerPivot.userData.s3d_joint = {
    name: 'drawer_slide',
    type: 'prismatic',
    value: drawerSlide,
    axis: [0, 0, 1],
    lower: 0,
    upper: 0.2,
  };
  const drawerMesh = new T.Mesh(new T.BoxGeometry(0.12, 0.1, 0.2), matWhite);
  drawerMesh.position.set(0, 0, -0.1);
  drawerPivot.add(drawerMesh);
  root.add(drawerPivot);

  return root;
}

describe('Sand3D native s3d_joint GLB importer and generalized rig runtime', () => {
  it('converts revolute, continuous, and rotated prismatic s3d_joint GLBs with posed rest-pose recovery and full Form Foundry round-trip', async () => {
    const rawGlb = await exportRawGlb(makeSand3dWasher(true));
    const loaded = await openStoredFile(new Blob([rawGlb]), 'sand3d-washer.glb');

    expect(hasSand3dJoints(loaded.group)).toBe(true);
    expect(loaded.capabilities.source?.kit).toBe('sand3d');
    expect(loaded.capabilities.riggedParts.map(p => p.name)).toEqual(['door_hinge', 'drum_spin', 'drawer_slide']);

    const doorSpec = loaded.capabilities.riggedParts.find(p => p.name === 'door_hinge');
    const drumSpec = loaded.capabilities.riggedParts.find(p => p.name === 'drum_spin');
    const drawerSpec = loaded.capabilities.riggedParts.find(p => p.name === 'drawer_slide');
    expect(doorSpec?.axis).toEqual([0, -1, 0]);
    expect(doorSpec?.range[1]).toBeCloseTo(143, 1);
    expect(drumSpec?.continuous).toBe(true);
    expect(drumSpec?.axis).toBe('x');
    // Rotated pivot (RotY +90 deg) with local +Z slide converts into parent +X slide!
    expect(drawerSpec?.axis).toBe('x');
    expect(drawerSpec?.range).toEqual([0, 0.2]);

    // Posed GLB recovers exact initial pose (92 deg door, 0.12 m drawer) AND closes cleanly back to rest x = 0.30!
    expect(loaded.controller.getPart('door_hinge')).toBeCloseTo(92, 1);
    expect(loaded.controller.getPart('drawer_slide')).toBeCloseTo(0.12, 3);
    loaded.controller.closePart('door_hinge');
    loaded.controller.closePart('drawer_slide');
    const drawerNode = loaded.group.getObjectByName('drawer_slide');
    expect(drawerNode?.position.x).toBeCloseTo(0.3, 4);
    loaded.controller.setPart('drawer_slide', 0.2);
    expect(drawerNode?.position.x).toBeCloseTo(0.5, 4);

    // Continuous drum accepts arbitrary multi-turn angles without clamping!
    expect(loaded.controller.setPart('drum_spin', 900)).toBe(900);

    // Derived rest-pose spatial metadata includes flat TopSurface (y ~ 0.85 m) and door/drawer clearance zones!
    expect(loaded.capabilities.surfaces?.some(s => Math.abs(s.at[1] - 0.85) < 0.05)).toBe(true);
    expect(loaded.capabilities.clearanceZones?.some(z => z.part === 'door_hinge')).toBe(true);
    expect(loaded.capabilities.clearanceZones?.some(z => z.part === 'drawer_slide')).toBe(true);

    // Re-exporting from Form Foundry embeds extras.formFoundry and round-trips offline with all Sand3D axes intact!
    const prepared = cloneForExport(loaded.group, { includePartClips: true }, loaded.controller);
    const reExported = await exportRawGlb(prepared.root);
    prepared.dispose();
    const reopened = await openStoredFile(new Blob([reExported]), 'washer-ff.glb');
    expect(reopened.capabilities.riggedParts.find(p => p.name === 'door_hinge')?.axis).toEqual([0, -1, 0]);
    expect(reopened.capabilities.riggedParts.find(p => p.name === 'drum_spin')?.continuous).toBe(true);
    expect(reopened.controller.getPart('drawer_slide')).toBeCloseTo(0.2, 3);
    loaded.controller.dispose();
    reopened.controller.dispose();
  });

  it('supports arbitrary 45-degree tilted axes and reflection-conjugated mirrored Sand3D joints', () => {
    const group = new T.Group();
    group.name = 'tilted_and_mirrored';
    const mat = new T.MeshStandardMaterial({ color: '#607080' });

    // 45-deg tilted kingpin axis in XY plane (like Sand3D skateboard truck).
    const truck = new T.Group();
    truck.name = 'front_truck_steer';
    truck.userData.s3d_joint = {
      name: 'front_truck_steer',
      type: 'revolute',
      value: 0,
      axis: [Math.SQRT1_2, Math.SQRT1_2, 0],
      lower: -0.5,
      upper: 0.5,
    };
    const axle = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.36), mat);
    axle.position.set(0, 0, 0.18);
    truck.add(axle);
    group.add(truck);

    // Mirrored gate twin (scale [-1, 1, 1], raw axis [0, 1, 0] -> conjugated to [0, -1, 0]).
    const twin = new T.Group();
    twin.name = 'twin_hinge';
    twin.scale.set(-1, 1, 1);
    twin.userData.s3d_joint = {
      name: 'twin_hinge',
      type: 'revolute',
      value: 0,
      axis: [0, 1, 0],
      lower: 0,
      upper: Math.PI / 2,
    };
    const leaf = new T.Mesh(new T.BoxGeometry(0.6, 1.0, 0.04), mat);
    leaf.position.set(0.3, 0.5, 0);
    twin.add(leaf);
    group.add(twin);

    const caps = readSand3dCapabilities(group);
    expect(caps).not.toBeNull();
    const truckSpec = caps?.riggedParts.find(p => p.name === 'front_truck_steer');
    const twinSpec = caps?.riggedParts.find(p => p.name === 'twin_hinge');
    expect(Array.isArray(truckSpec?.axis)).toBe(true);
    expect((truckSpec?.axis as number[])[0]).toBeCloseTo(Math.SQRT1_2, 4);
    expect((truckSpec?.axis as number[])[1]).toBeCloseTo(Math.SQRT1_2, 4);
    expect(twinSpec?.axis).toEqual([0, -1, 0]);

    const ctrl = createAssetController(group, caps ?? undefined);
    ctrl.setPart('twin_hinge', 90);
    // In right-handed Y-up, an unmirrored leaf along +X rotated +90 deg about +Y swings to z = -0.3;
    // its X-mirrored twin (scale.x = -1) conjugated to axis [0, -1, 0] ALSO swings symmetrically to z = -0.3!
    const tip = new T.Vector3(0.3, 0.5, 0).applyMatrix4(twin.matrixWorld);
    expect(tip.z).toBeCloseTo(-0.3, 3);
    ctrl.dispose();
  });

  it('drives coupled mimic joints (screw cap turn+lift & sibling door) across controller, synthesized clips, and sweep validation', () => {
    const bottle = new T.Group();
    bottle.name = 'screw_bottle';
    const mat = new T.MeshStandardMaterial({ color: '#456a7c' });
    const body = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.2, 12), mat);
    body.position.set(0, 0.1, 0);
    bottle.add(body);

    // Screw cap: cap_turn (0..720 deg = 4*PI rad) drives cap_lift via mimic (0.04 m per 4*PI rad -> 0.01 m per 180 deg).
    const capTurn = new T.Group();
    capTurn.name = 'cap_turn';
    capTurn.position.set(0, 0.2, 0);
    capTurn.userData.s3d_joint = {
      name: 'cap_turn',
      type: 'revolute',
      value: 0,
      axis: [0, 1, 0],
      lower: 0,
      upper: Math.PI * 4,
    };
    const capLift = new T.Group();
    capLift.name = 'cap_lift';
    capLift.userData.s3d_joint = {
      name: 'cap_lift',
      type: 'prismatic',
      value: 0,
      axis: [0, 1, 0],
      lower: 0,
      upper: 0.04,
      mimic: { joint: 'cap_turn', multiplier: 0.04 / (Math.PI * 4) },
    };
    const capMesh = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.03, 12), mat);
    capMesh.position.set(0, 0.015, 0);
    capLift.add(capMesh);
    capTurn.add(capLift);
    bottle.add(capTurn);

    const caps = inspectAsset(bottle);
    expect(caps.riggedParts.map(p => p.name)).toEqual(['cap_turn', 'cap_lift']);
    const liftSpec = caps.riggedParts.find(p => p.name === 'cap_lift');
    expect(liftSpec?.mimic?.part).toBe('cap_turn');
    expect(liftSpec?.mimic?.multiplier).toBeCloseTo(0.04 / 720, 8);

    const ctrl = createAssetController(bottle, caps);
    ctrl.setPart('cap_turn', 360);
    expect(ctrl.getPart('cap_lift')).toBeCloseTo(0.02, 4);
    expect(capLift.position.y).toBeCloseTo(0.02, 4);
    ctrl.resetParts();
    expect(ctrl.getPart('cap_lift')).toBeCloseTo(0, 5);

    // Synthesized clips bundle both cap_turn.quaternion and cap_lift.position into ONE synchronized clip!
    const clips = synthesizeRigClips(bottle, caps);
    expect(clips.length).toBe(1);
    expect(clips[0]?.tracks.map(t => t.name).sort()).toEqual(['cap_lift.position', 'cap_turn.quaternion']);

    // Sweep check catches an overhead shelf blocking the helical lift at y = 0.25 m!
    const shelfBox = buildOrientedBox(new T.Matrix4(), [0, 0.25, 0], [0.2, 0.01, 0.2], {
      id: 'shelf:body', name: 'Shelf', ownerId: 'shelf', kind: 'collider', layer: 'solid',
    });
    const blocked = checkRiggedSweep(bottle, { capabilities: caps, obstacles: [shelfBox], steps: 9, tolerance: 0.002 });
    expect(blocked.valid).toBe(false);
    expect(blocked.issues.some(i => i.kind === 'obstacle-blocked')).toBe(true);
    ctrl.dispose();

    // Schema parser strips cyclic mimic references safely.
    const cyclic = parseCapabilities({
      version: 1,
      name: 'CycleTest',
      riggedParts: [
        { name: 'a', label: 'A', type: 'rotate', axis: 'y', range: [0, 90], mimic: { part: 'b', multiplier: 1 } },
        { name: 'b', label: 'B', type: 'rotate', axis: 'y', range: [0, 90], mimic: { part: 'a', multiplier: 1 } },
      ],
    });
    expect(cyclic?.riggedParts[0]?.mimic).toBeUndefined();
    expect(cyclic?.riggedParts[1]?.mimic).toBeUndefined();
  });

  it('composes a Sand3D GLB appliance inside composeAsset with working scoped controls and wall-sweep detection', async () => {
    const rawGlb = await exportRawGlb(makeSand3dWasher(false));
    const parsed = await new GLTFLoader().parseAsync(rawGlb, '');
    const wall = new T.Group();
    wall.name = 'Wall';
    const wallMesh = new T.Mesh(new T.BoxGeometry(0.1, 1.2, 1.2), new T.MeshStandardMaterial({ color: '#cccccc' }));
    wallMesh.position.set(0, 0.6, 0);
    wall.add(wallMesh);
    writeCapabilities(wall, {
      version: 1, name: 'Wall', riggedParts: [], detachableParts: [], nightZones: [], decals: [],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0.6, 0], size: [0.1, 1.2, 1.2], layer: 'solid' }],
    });
    const room = composeAsset({
      name: 'LaundryBay',
      parts: [
        { id: 'washer', object: parsed.scene },
        // Place a blocking wall right in front of the +X washer door (door swings to x ~ 0.78 m).
        { id: 'wall', object: wall, mount: { at: [0.55, 0, 0], coupling: 'surface' } },
      ],
    });
    const ctrl = createCompositeController(room);
    ctrl.openPart('washer/door_hinge');
    expect(ctrl.getPart('washer/door_hinge')).toBeCloseTo(143, 1);
    ctrl.closePart('washer/door_hinge');
    // validateComposite detects that swinging the Sand3D washer door hits the wall at x = 0.55 m!
    const report = validateComposite(room);
    expect(report.sweeps.washer?.valid).toBe(false);
    ctrl.dispose();
  });
});
