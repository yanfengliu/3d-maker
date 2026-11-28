# Review 0: implementation

## Target

Repository `3d-maker`, branch `feat/sand3d-glb-importer`, commit `9bad1c1b07367806a1e951146afb270f80d9f06a` (Sand3D `s3d_joint` GLB importer and generalized rig/spatial/sweep/export subsystem).

## Reviewers and coverage

- Codex (read-only repository review via `fleet/scripts/review.mjs`): verdict `keep`, mutated=`false`.
- Claude lane: unavailable (quota/capacity); single-lane Codex verification used.

## Reports

### Codex

**HOLD `9bad1c1` against `7b31cdd`.** The default Sand3D unit scale breaks prismatic motion, a mirrored hinge reverses after a binary round-trip, and composite validation can approve a motion that puts a payload inside a wall.

### High-priority findings

1. **Prismatic joints use metres as parent-local translation units.** Sand3D’s millimetre export puts a `0.001` scale on the asset root. The importer normalizes the slide direction and then subtracts or adds the metre-valued pose directly to `node.position`. In a binary fixture with that layout, a drawer at `0.420 m` closed to `0.41988 m` and opened to `0.42008 m`. Its correct endpoints were `0.300 m` and `0.500 m`. Rest recovery, live controls, and baked tracks all need the same metre-to-parent conversion. [sand3d.ts:64](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:64) · [sand3d.ts:257](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:257) · [runtime.ts:163](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:163) · [Sand3D’s upstream scale test](https://github.com/Sandflow-ai/sand3d/blob/main/tests/test_export_joints.py#L274-L276)

2. **The same scale makes manifest-only colliders 1,000 times too large.** Derivation stores node-local box sizes, while `restPose` drops the scale. A 200 mm door resolved to a half-width of `0.1 m` with the live tree and `100 m` from its manifest alone. This breaks placement checks for consumers using exported metadata. [spatial-derive.ts:297](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:297) · [obb.ts:368](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/obb.ts:368)

3. **Mirrored hinge direction can reverse on re-import.** The converted axis depends on which local scale component holds the negative sign. Exporting a `[1,-1,1]` pivot without animations writes a matrix. Reloading decomposes it as `[-1,1,1]` with a compensating rotation, but the embedded axis still uses the old decomposition. The same 90° command moved the tip to `+Z` before export and `−Z` after reopening. I also reproduced reversed motion on first import with two negative scale components, where the `det < 0` branch is skipped. [sand3d.ts:65](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:65) · [runtime.ts:116](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:116) · [export-flow.ts:41](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/studio/export-flow.ts:41)

4. **Baked clips can erase a follower’s entire rotation.** Key times come solely from the leader. With a slide driving a wheel through 360°, the live wheel reached 180° at half travel. After GLB export and reload, `AnimationMixer` put the slide at half travel and the wheel at 0° because its endpoint quaternions represent the same orientation. The new round-trip test omits the exporter’s `animations` option, so it never reads back a baked track. [runtime.ts:204](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:204) · [runtime.ts:235](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:235) · [sand3d.test.ts:28](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.test.ts:28)

5. **Derived clearance omits the follower’s travel.** The derivation moves each follower, then expands the clearance box using only the leader’s rest-box corners and world matrix. It also skips the follower’s own clearance. A screw cap with 40 mm of lift consequently reported `exceeds-clearance` at 600° and 720° in an empty scene. [spatial-derive.ts:305](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:305) · [spatial-derive.ts:347](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:347)

6. **Composite sweeps miss payloads mounted on sibling followers.** Followers move during the leader’s sweep, but the carried-load callback receives only the leader node. I welded a box to a sibling follower and placed a wall at its endpoint. `validateComposite()` returned `valid: true` with zero issues. Driving the leader to its limit then put the two box centers at the same world coordinate. [sweep.ts:113](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:113) · [sweep.ts:273](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:273) · [compose-validate.ts:326](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/compose-validate.ts:326)

7. **A fresh Sand3D GLB can pass an SDK sweep with zero parts checked.** `inspectAsset(scene)` discovers the joints, but `checkRiggedSweep(scene, { obstacles })` looks only for an embedded Form Foundry manifest. On the same freshly loaded door, the default call returned `valid: true, checkedParts: 0`; passing the inspected capabilities explicitly reported the blocking obstacle. [runtime.ts:129](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:129) · [sweep.ts:86](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:86)

8. **Malformed rotation limits can exhaust a clip export.** The importer checks finiteness before degree conversion and rounding. The converted result can overflow, and even a finite result can request an unbounded number of keyframes. Validate the converted bounds and enforce a keyframe budget before allocating tracks. [sand3d.ts:158](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:158) · [runtime.ts:208](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:208)

### Other correctness findings

- **Multi-level mimic chains disagree about limits.** With 1:1 links `A → B → C`, setting `A=1` produced `B=0.2` at its stop and `C=1`. Propagation queues B’s unclamped value. The sweep likewise reported a collision at a position B cannot reach. Separately, when only A declares limits, range inference derives B’s range but drops C because it consults B’s raw range. [rig-math.ts:123](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/rig-math.ts:123) · [runtime.ts:374](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:374) · [sweep.ts:193](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:193) · [sand3d.ts:212](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:212)
- **The UI, agent API, and saved edits enforce different follower rules.** The UI disables follower controls, but `setPartPose` accepts an independent follower edit. I set a 1:1 leader to `0.1` and its follower to `0.9`; replaying the saved edits restored the follower to `0.1`. Conversely, explicitly setting the leader to zero in an existing pose map strips that key before precedence is checked, leaving the stale follower posed. [model-parts.ts:66](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/ui/model-parts.ts:66) · [agent-api.ts:93](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/studio/agent-api.ts:93) · [asset.ts:146](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/imports/asset.ts:146) · [asset.ts:258](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/imports/asset.ts:258)
- **Opening and restoring imports can change their authored pose.** A `0.0004 m` slide reopened at zero because import edits round to whole millimetres. A separate legacy save of a GLB authored at 60° reopened at 0° because its pre-feature record had no pose map and reconciliation reset the newly discovered joint. [asset.ts:146](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/imports/asset.ts:146) · [asset.ts:246](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/imports/asset.ts:246) · [library.ts:131](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/imports/library.ts:131)
- **Re-export writes contradictory pose metadata.** After posing a hinge to 70°, the exported transform and `extras.formFoundry.state` recorded 70°, while `s3d_joint.value` still recorded zero. The two public inspection functions therefore recover different rest poses from the same binary. [runtime.ts:296](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:296) · [export.ts:207](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/studio/export.ts:207) · [sand3d.ts:161](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:161)
- **A generated joint name can disappear on round-trip.** An unnamed pivot with extras name `door hinge` worked on first import. After export, `GLTFLoader` named it `door_hinge`, and manifest intersection removed the rig binding. That intersection also leaves a surviving follower linked to a leader it removed. [sand3d.ts:82](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:82) · [asset.ts:352](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/imports/asset.ts:352)

All **26 tests in six relevant suites** passed, along with strict TypeScript and changed-file ESLint. The additional checks used the commit’s source, real binary GLB export and reload, `AnimationMixer`, and the composite validator. The production build and browser gate were not run.

## Findings and disposition

All 13 findings (8 high-priority, 5 other correctness findings) accepted and fixed in commit `2da92f2` with deterministic regression tests in `src/capabilities/sand3d-regressions.test.ts`.

## Verification

Reviewed commit `9bad1c1` passed `npm run verify` (35/35 files, 1,620 tests), `npm run check:studio:ci`, and `npm run check:studio`; all 13 findings verified resolved in `2da92f2`.

## Round outcome

Hold findings fixed in commit `2da92f2`; re-submitted for round 1.
