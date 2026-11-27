# Hierarchical Asset Composition & Runtime Interaction

This document defines how individual parts move inside an asset versus via animation clips, and how two or more independent assets combine into a larger composite asset (truck + crane, desk + lamps, mech + turret, or house + 20 appliances) without losing structural knobs, interactive parts, concurrent animations, or physics laws.

## 1. Interactive parts vs. animation clips

- **Direct part interaction (`AssetController`)**: Movable parts (`riggedParts`), removable accessories (`detachableParts`), and emissive lighting (`nightZones`) are declared in `extras.formFoundry` and driven via `createAssetController(group)` (`src/capabilities/runtime.ts`). Each rigged part is a named `THREE.Group` at its real hinge or slide pivot; `setPart`, `openPart`, `closePart`, `setVisible`, and `setNight` operate independently on each part without disturbing siblings. Smooth motion can be lerped per frame in application code.
- **Animation clips (`AnimationClip` + `THREE.AnimationMixer`)**: Clips are keyframe timelines targeting named nodes (e.g. `WaterWheel.quaternion`). Form Foundry's studio preview plays one clip at a time for UI simplicity, whereas runtime Three.js apps can play **any number of clips concurrently** as long as their tracks write to different nodes. Combine both freely — loop `WaterWheel` on a mixer while opening `MillDoor` via `AssetController` — and only avoid driving the exact same node with both a clip and `setPart()` on the same frame.

## 2. Boundary rule: inside one asset vs. separate composed assets

- **Inside one asset**: Group tightly coupled sub-parts that share one rigid housing and hinge hierarchy (for example an oven with `OvenDoor`, `WarmingDrawer`, `OvenRack`, and `InteriorLight`, or a house shell with `FrontDoor` and `KitchenWindow`). Keep static housing geometry merged via `mergeStaticParts()`, preserving only rigged/detachable pivots.
- **Composed child assets**: Keep pieces as separate modular assets whenever they can be placed, moved, swapped, duplicated, recolored, or upgraded independently (for example 20 appliances inside a house shell, a crane bolted onto a truck bed, or twin lamps on a desk). Never flatten or call `mergeStaticParts()` across distinct child asset boundaries.

## 3. Composing assets with `composeAsset()` and `createCompositeController()`

Use `composeAsset()`, `createCompositeController()`, and `validateComposite()` from `src/capabilities/compose.ts`, `src/capabilities/compose-runtime.ts`, and `dist/studio-sdk.js`:

1. **Slot isolation and namespace scoping**: `composeAsset()` wraps every child inside its own `Slot_<id>` group and prefixes child internal node names and animation track bindings with `${id}__` (`nodePrefix`). Two identical children (`lamp-a`, `lamp-b`) or two appliances with a `Door` node never collide inside Three.js lookups or flat glTF animation tables, while application code addresses parts cleanly by scoped path (`ctrl.openPart('fridge/FridgeDoor')`, `ctrl.setVisible('oven/OvenRack', false)`).
2. **Preserved structural knobs (`params`) and live rebuilds**: Pass starter `recipe` objects on parts so `CompositeChildSpec.recipe` stays stored inside `extras.formFoundry.children`. Calling `ctrl.setChildParams(childId, patch, createAsset)` (or `buildModel` inside this repo) rebuilds only that child atomically from its recipe (verifying dependent `attachNode`s before mutating the scene), preserves sibling poses and visibility, re-attaches and re-seats any grandchildren mounted onto that child's `surfaces` or `attachNode`s, disposes only unshared resources, and refreshes aggregate root dimensions, physics, and clips.
3. **Concurrent per-child animations**: `createCompositeController(composite, undefined, gltf.animations)` owns an independent `THREE.AnimationMixer` per child (and recursively for nested composites). Call `ctrl.playClips([{ childId: 'mill', clip: 'Turn waterwheel' }, { childId: 'tower', clip: 0 }])` and advance with `ctrl.update(dt)` while calling `ctrl.openPart('pod/CaseLid')` on the same frame. Parent transforms propagate automatically through the scene graph (e.g. a crate mounted to a crane's `attachNode` moves with the crane boom).
4. **Explicit physics coupling laws (`mount.coupling`)**:
   - `'weld'`: Rigidly bolted to a host body (crane on truck, turret on mech). Child colliders act as compound shapes on the parent rigid body (`resolveAssetVolumes` exposes them automatically), `computeCompositeBodies()` sums welded children onto the connected rigid body they are welded to (never leaking onto a separate jointed/surface body), and intentional mount-seam contact between child and host is exempted from collision failures.
   - `'surface'`: Seated onto a declared `SurfaceSpec` (`mount.surface`). `composeAsset()` measures the rotated and scaled child in the host surface frame (`u, n, v`) to seat it flush (including with `attachNode` offsets or wall normals), `validateComposite()` verifies footprint bounds (`surface.size`), bottom penetration, and vertical headroom (`surface.clearanceY`), and each child keeps its own `physics.body` (`static` for bolted cabinets/appliances, `dynamic` for loose props).
   - `'joint'`: Articulated physical link between two bodies (`mount.joint = { type: 'hinge' | 'slider' | 'ball', axis?, range? }`), preserving separate rigid bodies (inspectable via `computeCompositeBodies()`) with self-collision disabled only between the joined pair.
5. **Deterministic composite validation and GLB round-trip**:
   - Run `validateComposite(composite)` to verify every `surface`-mounted child fits within `size`, does not penetrate below the plane, and clears `clearanceY`, run `validateScenePlacement()` across all siblings and walls (flagging any sibling overlap, surface penetration, or blocked door/drawer clearance arc), and run `checkRiggedSweep()` on every child's rigged parts (plus any loads carried on moving `attachNode`s) against the rest of the assembly — independent of current part pose or controller initialization.
   - Because `extras.formFoundry.children` stores every child's `slotNode`, `nodePrefix`, `mount`, `recipe`, and `capabilities` — and `cloneForExport()` preserves hidden detachable subtrees, applies authoritative rest/pose transforms, and optionally bakes per-child part clips (`includePartClips: true`) — exporting a composite to binary `.glb` and reloading it with `GLTFLoader` restores full interactivity and concurrent clips via `createCompositeController(gltf.scene, undefined, gltf.animations)`.

## 4. Worked example

```ts
import {
  composeAsset,
  createAsset,
  createCompositeController,
  resolveVariationRecipe,
  validateComposite,
} from './studio-sdk.js';

const yard = composeAsset({
  name: 'Harbor Market Yard',
  parts: [
    { id: 'pavilion', recipe: resolveVariationRecipe('market-pavilion', 'harbor-timber-kit') },
    { id: 'pod-left', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [-3.6, 0, 0.4], coupling: 'surface' } },
    { id: 'pod-right', recipe: resolveVariationRecipe('cargo-pod'), mount: { at: [3.6, 0, 0.4], coupling: 'surface' } },
    { id: 'mill', recipe: resolveVariationRecipe('stone-watermill'), mount: { at: [0, 0, -3.4], coupling: 'surface' } },
  ],
});

const report = validateComposite(yard); // report.valid === true
const ctrl = createCompositeController(yard);
ctrl.playClips([{ childId: 'mill', clip: 'Turn waterwheel' }]); // continuous loop on mill
ctrl.openPart('pod-left/CaseLid');                              // opens ONLY pod-left's lid; pod-right stays shut
ctrl.openPart('mill/MillDoor');                                 // opens mill door while waterwheel keeps turning
ctrl.setChildParams('pavilion', { bays: 4 }, createAsset);      // live knob rebuild via public SDK builder
ctrl.update(0.25);                                              // advances concurrent child animations
```
