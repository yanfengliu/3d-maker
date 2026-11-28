# Review 2: implementation

## Target

Repository `3d-maker`, branch `feat/sand3d-glb-importer`, commit `a71d73580093922fadc12095c61168262ec214d1` (Sand3D `s3d_joint` GLB importer and generalized rig/spatial/sweep/export subsystem).

## Reviewers and coverage

- Codex (read-only repository review via `fleet/scripts/review.mjs`): verdict `keep`, mutated=`false`.
- Claude lane: unavailable (quota/capacity); single-lane Codex verification used.

## Reports

### Codex

**HOLD** on `a71d735` against `main` at `7b31cdd`. `npm run verify` passed all 1,630 tests, including all 14 Sand3D tests, and `npm run check:studio` passed. I reproduced the following failures through the SDK and binary GLB import paths.

### Collision and clearance

- **Nested carriers (#2, #4).** A leader carrying both a payload and an opposing mimic follower can drive the payload straight into a wrist beneath that follower. The sweep assigns the wrist to the first matching ancestor, then skips the collision as a same-carrier pair. `validateComposite()` returned `valid: true` with both 12 cm boxes centered at `[0.6, 0.3, 0]`. [sweep.ts:230](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:230) · [sweep.ts:398](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:398)
- **Missing descendants (#2).** When the carriage itself is the supplied root and its geometry is on an independent wrist, `main` derives clearance for both joints. The candidate drops the carriage clearance, and placement accepts a wall at the wrist’s endpoint. A visible detachable mesh also disappears from the sweep when only its carriage declares a collider. [spatial-derive.ts:365](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:365) · [sweep.ts:128](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:128)
- **Missed motion between samples (#7).** A 1 m rack drove a spoke through 180° in its first 5 cm. Both sweep and placement returned valid despite **6 cm of measured overlap** at 2.5 cm of travel. Both sample uniformly across the leader’s full stroke. Separately, `validateComposite()` forces seven samples by default. It accepted a three-turn carried load that reported 10.5 cm of penetration at 37 samples. [spatial-derive.ts:380](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:380) · [sweep.ts:263](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:263) · [compose-validate.ts:309](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/compose-validate.ts:309)
- **Follower placement clearance (#7, #8).** Hiding only the leader suppresses its visible sibling follower’s clearance in `validateScenePlacement()`. Hiding only the follower leaves its clearance active. `checkRiggedSweep()` gave the correct result in both cases. A visible continuous crank driving a bounded rotating arm also produced no clearance zone because derivation skips the crank as a spinner and the arm as a follower. [obb.ts:403](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/obb.ts:403) · [spatial-derive.ts:273](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:273) · [spatial-derive.ts:334](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:334)

### Animation and pose

- **Pruned chains in the SDK (#3, #12).** With A absent from an embedded A→B→C rig, studio import restored B and C at 0.4 m. Loading the same GLB through `createCompositeController()` reset both to zero. The SDK also synthesized zero clips and checked zero parts, although `setPart('B', 0.9)` moved C into the obstacle. Only the studio import path prunes against live nodes. [asset.ts:366](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/imports/asset.ts:366) · [compose-scope.ts:54](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/compose-scope.ts:54) · [runtime.ts:197](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:197) · [sweep.ts:143](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:143)
- **Baked travel and key spacing (#6).** A 0.20 m rack driving a 16-turn follower reached only 0.10 m in its baked clip because the key budget shrinks the leader’s target. Separately, the breakpoint filter discarded a valid stop at 0.08 mm of a 100 m stroke, producing consecutive quaternion keys **180° apart**. The standalone 500-rad fixture did satisfy the 45° bound. [rig-math.ts:327](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/rig-math.ts:327) · [rig-math.ts:243](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/rig-math.ts:243)
- **Mirrored authored animations (#9).** At 0.5 s, a mirrored pivot with an animated scale placed its tip at Y = −0.75 m in raw `GLTFLoader` playback and +0.75 m after studio import. Quaternion `CUBICSPLINE` playback also changed because normalization converted zero tangents to `[0,0,0,1]`. Even a linear quaternion clip flipped when `resolveAssetVolumes()` canonicalized `gltf.scene` before playback with the loader’s separately returned animations. [sand3d.ts:74](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:74) · [sand3d.ts:79](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:79) · [sand3d.ts:85](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:85)
- **Inherited continuous pose (#11).** At 36,090°, `inspectAsset()` preserved both motor and follower. `readSand3dCapabilities()` dropped the follower’s value because it applied the finite revolute cap before resolving inherited `continuous`. On raw GLB import, resetting the motor left the follower physically rotated 90°. [sand3d.ts:248](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:248) · [sand3d.ts:303](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:303)

The legacy Form Foundry reset and raw Sand3D pose preservation (#1), explicit finite follower stops (#5), and live versus manifest-only sheared collider result (#10) passed. I also confirmed the ordinary posed-composite reload and the direct opposing sibling-load collision in the submitted fixtures.

## Findings and disposition

All 8 findings (nested carriers, root carriage/detachables, breakpoint sweeps, per-part clearances, SDK chain pruning, clip travel/breakpoints, read-only mirror import, inherited continuous pose) accepted and fixed in commit `840f4dc` with deterministic regression tests in `src/capabilities/sand3d-r3-regressions.test.ts`.

## Verification

Reviewed commit `a71d735` passed `npm run verify` (37/37 files, 1,630 tests), `npm run check:studio:ci`, and `npm run check:studio`; all 8 findings verified resolved in `840f4dc`.

## Round outcome

Hold findings fixed in commit `840f4dc`; re-submitted for round 3.
