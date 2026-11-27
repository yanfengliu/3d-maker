import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { listVariations } from '../data/recipe';
import { buildModel } from '../models';
import {
  buildOrientedBox,
  obbOverlap,
  resolveAssetVolumes,
  validateScenePlacement,
  type OrientedBox,
} from './obb';
import { checkRiggedSweep } from './sweep';
import { createAssetController, inspectAsset } from './runtime';
import { parseCapabilities, type AssetCapabilities } from './schema';

function makeBox(
  id: string,
  center: [number, number, number],
  size: [number, number, number],
  rotation?: [number, number, number],
): OrientedBox {
  const world = new T.Matrix4();
  return buildOrientedBox(world, center, [size[0] * 0.5, size[1] * 0.5, size[2] * 0.5], {
    id,
    name: id,
    ownerId: id,
    kind: 'collider',
    layer: 'solid',
    ...(rotation ? { rotation } : {}),
  });
}

describe('spatial schema parsing and validation', () => {
  it('round-trips colliders, clearanceZones, and surfaces while dropping malformed entries', () => {
    const parsed = parseCapabilities({
      version: 1,
      name: 'RoomWithDoor',
      colliders: [
        { name: 'BackWall', shape: 'box', at: [0, 1.5, -2], size: [4, 3, 0.2], layer: 'solid' },
        { name: 'Column', shape: 'cylinder', at: [1, 1.5, 0], radius: 0.25, height: 3, layer: 'solid' },
        { name: 'AgentBody', shape: 'capsule', at: [0, 0.9, 0], radius: 0.3, height: 1.8, layer: 'solid' },
        {
          name: 'FrontDoor',
          shape: 'box',
          at: [0.45, 1.0, 0],
          size: [0.9, 2.0, 0.08],
          node: 'FrontDoor',
          restPose: { at: [0, 1.0, 2], rotation: [0, 0, 0] },
          layer: 'doorway',
        },
        // Malformed entries that must be rejected cleanly
        { name: 'ZeroBox', shape: 'box', at: [0, 0, 0], size: [1, 0, 1] },
        { name: 'MissingRadius', shape: 'cylinder', at: [0, 0, 0], height: 2 },
        { name: 'BadShape', shape: 'sphere', at: [0, 0, 0], radius: 1 },
        { name: 'BackWall', shape: 'box', at: [0, 0, 0], size: [1, 1, 1] }, // duplicate name
      ],
      clearanceZones: [
        { name: 'DoorSwing', kind: 'swing', at: [0, 1.0, 2.5], size: [1.0, 2.0, 1.0], part: 'FrontDoor' },
        { name: 'InteriorRoom', kind: 'cavity', at: [0, 1.5, 0], size: [3.6, 2.8, 3.6] },
        { name: 'BadKind', kind: 'unknown', at: [0, 0, 0], size: [1, 1, 1] },
      ],
      surfaces: [
        { name: 'DeskTop', label: 'Desk top', at: [0, 0.75, 0], normal: [0, 2, 0], size: [1.4, 0.7], clearanceY: 1.2 },
        { name: 'ZeroNormal', label: 'Bad', at: [0, 0, 0], normal: [0, 0, 0], size: [1, 1] },
      ],
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.colliders?.map(c => c.name)).toEqual(['BackWall', 'Column', 'AgentBody', 'FrontDoor']);
    expect(parsed?.colliders?.[3]?.layer).toBe('doorway');
    expect(parsed?.colliders?.[3]?.restPose?.at).toEqual([0, 1.0, 2]);
    expect(parsed?.clearanceZones?.map(z => z.name)).toEqual(['DoorSwing', 'InteriorRoom']);
    expect(parsed?.surfaces?.length).toBe(1);
    expect(parsed?.surfaces?.[0]?.normal).toEqual([0, 1, 0]);
    expect(parsed?.surfaces?.[0]?.clearanceY).toBe(1.2);
  });
});

describe('15-axis SAT OBB overlap and scene placement validator', () => {
  it('handles separated, touching, penetrating, and rotated 45-degree OBB pairs accurately', () => {
    const a = makeBox('a', [0, 0.5, 0], [1, 1, 1]);
    const far = makeBox('far', [2, 0.5, 0], [1, 1, 1]);
    expect(obbOverlap(a, far).overlaps).toBe(false);

    // Flush contact at x = 0.5: zero penetration -> rejected with -0.005 contact tolerance.
    const flush = makeBox('flush', [1.0, 0.5, 0], [1, 1, 1]);
    expect(obbOverlap(a, flush, -0.005).overlaps).toBe(false);

    // Genuine 0.1m penetration.
    const hit = makeBox('hit', [0.9, 0.5, 0], [1, 1, 1]);
    const res = obbOverlap(a, hit, -0.005);
    expect(res.overlaps).toBe(true);
    expect(res.penetration).toBeCloseTo(0.095, 3);

    // Rotated 45-degree diamond whose AABB overlaps A's AABB, yet true rotated faces are separated!
    // Half-diagonal of 1x1 box is sqrt(0.5) ≈ 0.7071; A corner is at (0.5, 0.5). Placing B at (1.05, 0.5, 1.05)
    // puts its AABB min at (0.343, 0.343) (overlapping A's AABB [0.5, 0.5]), while SAT finds a separating axis.
    const rotSeparated = makeBox('rotSep', [1.05, 0.5, 1.05], [1, 1, 1], [0, Math.PI / 4, 0]);
    expect(obbOverlap(a, rotSeparated).overlaps).toBe(false);

    // Pull closer so the rotated corner genuinely penetrates A's corner.
    const rotHit = makeBox('rotHit', [0.82, 0.5, 0.82], [1, 1, 1], [0, Math.PI / 4, 0]);
    expect(obbOverlap(a, rotHit).overlaps).toBe(true);
  });

  it('tracks live hinged door colliders out of doorways, allows interior cavity placement, and catches blocked swings', () => {
    const mill = buildModel({
      version: 1,
      template: 'stone-watermill',
      name: 'Mill',
      primary: '#b0a695',
      accent: '#7a5136',
      scale: 1,
      proportion: 1,
      detail: true,
      quality: 'standard',
    });
    const millCaps = inspectAsset(mill);
    expect(millCaps.colliders?.some(c => c.node === 'MillDoor' && c.layer === 'doorway')).toBe(true);
    expect(millCaps.clearanceZones?.some(z => z.part === 'MillDoor' && z.kind === 'swing')).toBe(true);

    const doorCol = resolveAssetVolumes({ id: 'mill', object: mill }, { includeClearanceZones: false })
      .find(v => v.part === 'MillDoor');
    expect(doorCol).toBeDefined();
    if (!doorCol) return;

    // A narrow probe sitting right where the closed MillDoor leaf occupies space.
    const doorwayProbe: AssetCapabilities = {
      version: 1,
      name: 'Probe',
      riggedParts: [],
      detachableParts: [],
      nightZones: [],
      decals: [],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.15, 0.4, 0.12], layer: 'solid' }],
    };

    // Closed door: solid collision!
    const closedResult = validateScenePlacement([
      { id: 'mill', object: mill },
      { id: 'probe', capabilities: doorwayProbe, position: doorCol.center },
    ]);
    expect(closedResult.valid).toBe(false);
    expect(closedResult.overlaps.some(o => o.kind === 'collision' && o.volumeA === 'MillDoor')).toBe(true);

    // Open MillDoor via controller: door collider moves out of the closed-leaf spot!
    const ctrl = createAssetController(mill);
    ctrl.openPart('MillDoor');
    const openColliderCheck = validateScenePlacement([
      { id: 'mill', object: mill, capabilities: { ...millCaps, clearanceZones: [] } },
      { id: 'probe', capabilities: doorwayProbe, position: doorCol.center },
    ]);
    expect(openColliderCheck.overlaps.some(o => o.volumeA === 'MillDoor')).toBe(false);
    ctrl.closePart('MillDoor');

    // Placing a crate directly in front of the door (inside MillDoorClearance swing arc) is flagged as clearance-blocked
    // AND detected with exact blocking angle by checkRiggedSweep!
    const swingZone = resolveAssetVolumes({ id: 'mill', object: mill }, { includeColliders: false })
      .find(v => v.part === 'MillDoor');
    expect(swingZone).toBeDefined();
    if (!swingZone) return;
    const blockingCratePos: [number, number, number] = [
      swingZone.center[0],
      swingZone.center[1],
      swingZone.aabbMax[2] - 0.12,
    ];
    const crateCaps: AssetCapabilities = {
      version: 1,
      name: 'Crate',
      riggedParts: [],
      detachableParts: [],
      nightZones: [],
      decals: [],
      colliders: [{ name: 'Body', shape: 'box', at: [0, 0, 0], size: [0.3, 0.4, 0.3], layer: 'solid' }],
    };
    const swingBlocked = validateScenePlacement([
      { id: 'mill', object: mill },
      { id: 'crate', capabilities: crateCaps, position: blockingCratePos },
    ]);
    expect(swingBlocked.valid).toBe(false);
    expect(swingBlocked.overlaps.some(o => o.kind === 'clearance-blocked' && o.volumeA === 'MillDoorClearance')).toBe(true);

    const crateObs = resolveAssetVolumes({ id: 'crate', capabilities: crateCaps, position: blockingCratePos });
    const sweepHit = checkRiggedSweep(mill, { obstacles: crateObs, steps: 9 });
    expect(sweepHit.valid).toBe(false);
    expect(sweepHit.issues.some(i => i.part === 'MillDoor' && i.kind === 'obstacle-blocked')).toBe(true);
    ctrl.dispose();

    // Hollow room with 4 authored wall colliders + interior cavity allows placing furniture inside!
    const hollowRoom: AssetCapabilities = {
      version: 1,
      name: 'HollowRoom',
      riggedParts: [],
      detachableParts: [],
      nightZones: [],
      decals: [],
      colliders: [
        { name: 'NorthWall', shape: 'box', at: [0, 1.5, -2], size: [4, 3, 0.2] },
        { name: 'SouthWall', shape: 'box', at: [0, 1.5, 2], size: [4, 3, 0.2] },
        { name: 'WestWall', shape: 'box', at: [-2, 1.5, 0], size: [0.2, 3, 4] },
        { name: 'EastWall', shape: 'box', at: [2, 1.5, 0], size: [0.2, 3, 4] },
      ],
      clearanceZones: [{ name: 'Interior', kind: 'cavity', at: [0, 1.5, 0], size: [3.6, 2.8, 3.6] }],
    };
    const roomOk = validateScenePlacement([
      { id: 'room', capabilities: hollowRoom, position: [0, 0, 0] },
      { id: 'table', capabilities: crateCaps, position: [0, 0.5, 0] },
    ]);
    expect(roomOk.valid).toBe(true);

    const wallClip = validateScenePlacement([
      { id: 'room', capabilities: hollowRoom, position: [0, 0, 0] },
      { id: 'table', capabilities: crateCaps, position: [0, 0.5, -1.9] },
    ]);
    expect(wallClip.valid).toBe(false);
    expect(wallClip.overlaps[0]?.volumeA).toBe('NorthWall');
  });

  it('removes detachable part colliders when hidden in both live Three.js and headless JSON modes', () => {
    const cabin = buildModel({
      version: 1,
      template: 'nordic-timber-cabin',
      name: 'Cabin',
      primary: '#8f5d38',
      accent: '#4a6b5d',
      scale: 1,
      proportion: 1,
      detail: true,
      quality: 'standard',
    });
    const caps = inspectAsset(cabin);
    expect(caps.colliders?.some(c => c.node === 'FirewoodStack' && Boolean(c.restPose))).toBe(true);

    // Live mode: hiding FirewoodStack drops its collider
    const ctrl = createAssetController(cabin);
    expect(resolveAssetVolumes({ id: 'cabin', object: cabin }).some(v => v.part === 'FirewoodStack')).toBe(true);
    ctrl.setVisible('FirewoodStack', false);
    expect(resolveAssetVolumes({ id: 'cabin', object: cabin }).some(v => v.part === 'FirewoodStack')).toBe(false);
    ctrl.dispose();

    // Headless JSON mode (zero Three.js meshes!): matches live visibility semantics
    expect(resolveAssetVolumes({ id: 'cabin', capabilities: caps }).some(v => v.part === 'FirewoodStack')).toBe(true);
    expect(resolveAssetVolumes({ id: 'cabin', capabilities: caps, hiddenParts: ['FirewoodStack'] }).some(v => v.part === 'FirewoodStack')).toBe(false);
  });

  it('tracks non-uniform scale, parent rotation, and sliding door sweep zones cleanly', () => {
    const kiosk = buildModel({
      version: 1,
      template: 'cyber-ramen-kiosk',
      name: 'ScaledKiosk',
      primary: '#2d3b4d',
      accent: '#e04f3e',
      scale: 1.3,
      proportion: 1.2,
      detail: true,
      quality: 'standard',
    });
    kiosk.position.set(4, 0, -2);
    kiosk.rotation.set(0, Math.PI / 2, 0);
    const caps = inspectAsset(kiosk);
    expect(caps.clearanceZones?.some(z => z.part === 'RollShutter' && z.kind === 'slide')).toBe(true);
    const sweep = checkRiggedSweep(kiosk, { steps: 9, tolerance: 0.02 });
    expect(sweep.valid).toBe(true);
    expect(sweep.issues).toEqual([]);
  });
});

describe('full-catalog deterministic spatial metadata and sweep invariants', () => {
  const variations = listVariations();

  it('derives valid colliders, clearanceZones, surfaces, JSON round-trip, and passes rigged sweep across all 111 variants', () => {
    let totalColliders = 0;
    let totalClearanceZones = 0;
    let totalSurfaces = 0;

    for (const entry of variations) {
      const model = buildModel({ ...entry.recipe, quality: 'standard' });
      const caps = inspectAsset(model);
      expect(caps.colliders?.length, `${entry.key} missing colliders`).toBeGreaterThan(0);
      totalColliders += caps.colliders?.length ?? 0;
      totalClearanceZones += caps.clearanceZones?.length ?? 0;
      totalSurfaces += caps.surfaces?.length ?? 0;

      // JSON round-trip preserves colliders, clearanceZones, and surfaces identically.
      const roundTripped = parseCapabilities(JSON.parse(JSON.stringify(caps)));
      expect(roundTripped?.colliders).toEqual(caps.colliders);
      expect(roundTripped?.clearanceZones).toEqual(caps.clearanceZones);
      expect(roundTripped?.surfaces).toEqual(caps.surfaces);

      // Every declared rigged part stays inside its declared clearance zone throughout its full travel range!
      const sweep = checkRiggedSweep(model, { steps: 9, tolerance: 0.015 });
      expect(sweep.issues, `${entry.key} sweep issues: ${JSON.stringify(sweep.issues)}`).toEqual([]);
    }

    expect(totalColliders).toBeGreaterThan(200);
    expect(totalClearanceZones).toBeGreaterThan(80);
    expect(totalSurfaces).toBeGreaterThan(20);
  }, 30_000);
});
