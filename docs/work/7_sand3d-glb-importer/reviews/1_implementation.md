# Review 1: implementation

## Target

Repository `3d-maker`, branch `feat/sand3d-glb-importer`, commit `2da92f26ee349d82a5b3166ba7d4ab9d98242d67` (Sand3D `s3d_joint` GLB importer and generalized rig/spatial/sweep/export subsystem).

## Reviewers and coverage

- Codex (read-only repository review via `fleet/scripts/review.mjs`): verdict `keep`, mutated=`false`.
- Claude lane: unavailable (quota/capacity); single-lane Codex verification used.

## Reports

### Codex

**HOLD `2da92f2` against `7b31cdd`.** The target loses a saved pose reset, misses collisions that main detects, and throws when reopening a posed composite with a mimic follower.

| Merge blocker | Reproduced behavior | Source |
|---|---|---|
| Legacy pose reset (#11) | A legacy local Form Foundry door authored at 60° and saved closed reopens at **0° on main and 60° on the target**. With `knownRiggedParts` and `pose` both absent, the target restores the authored pose even for a joint the old importer already understood. | [asset.ts:97](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/imports/asset.ts:97) |
| Nested joint collision (#5) | Main detects a sliding carriage carrying an independently hinged wrist into a wall. The target reports `valid: true` at the same endpoint, where the live wrist collider overlaps the wall. The parent sweep excludes every nested dynamic node and adds back only mimic followers. | [spatial-derive.ts:293](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:293) |
| Posed composite reload (#10) | I posed a coupled child, exported the composite to binary GLB, and reloaded it. `createCompositeController` throws because rest-pose capture replays every saved pose entry through `setPart`, including the newly read-only follower. | [compose-scope.ts:47](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/compose-scope.ts:47), [runtime.ts:372](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/runtime.ts:372) |
| Opposing carried loads (#6) | `validateComposite` passes two payloads welded to opposing sliders. At half travel their centers coincide and placement reports 0.09 m penetration. The sweep excludes both loads from the obstacle set and never compares them with each other. | [compose-validate.ts:319](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/compose-validate.ts:319), [sweep.ts:290](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:290) |

I also reproduced these failures in the claimed fixes.

| Area | Reproduced behavior | Source |
|---|---|---|
| Follower stops (#9) | A prismatic follower with an explicit 0–0.1 m range moved **0.628 m** after one turn of its continuous leader. Inheriting `continuous` disables the follower’s own stop. | [sand3d.ts:279](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:279) |
| Baked clips (#4, #8) | A wheel that reaches its stop in the first tenth of rack travel played at **0°** where the controller produced **180°**. Uniform leader samples skip the stop. Separately, the accepted 500-radian test case produces 224° between keys, so quaternion interpolation runs backwards. | [rig-math.ts:227](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/rig-math.ts:227), [rig-math.ts:234](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/rig-math.ts:234) |
| Follower clearance (#5, #7) | A slide driving a three-turn spoke with 1 m reach produced a clearance zone extending only 0.724 m vertically. Placement and the default sweep accepted an obstacle at 0.96 m. A 25-step sweep reported `exceeds-clearance` in the empty scene. Sampling uses only the leader’s angular travel. | [spatial-derive.ts:349](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:349) |
| Follower visibility (#6, #7) | A hidden follower still reported an obstacle collision. Hiding only the leader caused `checkedParts: 0` while its visible sibling follower moved into the obstacle. | [sweep.ts:127](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:127), [sweep.ts:153](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:153) |
| Authored mirrored animation (#3) | On a `[1,-1,1]` pivot, canonicalization changes the quaternion and scale basis while the existing quaternion track keeps its original keys. At the same playback time, the hinge tip’s Y coordinate changed from −0.5 m in `GLTFLoader` to +0.5 m after studio import. | [sand3d.ts:70](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:70) |
| Headless collider scale (#2) | A `[2,1,1]` ancestor scale and a 45° child pivot produce shear. Decomposing that transform into rotation and scale made the manifest-only collider miss an obstacle centered inside the mesh. The live collider detected it. | [spatial-derive.ts:106](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:106) |
| Continuous pose round-trip (#8, #12) | After exporting a drum at 36,090°, the Form Foundry manifest recovered 36,090° and `readSand3dCapabilities` recovered 0°. The reader applies the range-limit cap to the current continuous pose. | [sand3d.ts:225](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:225) |
| Pruned mimic chains (#13) | When node A is absent from an A → B → C chain, importing the GLB also removes C’s valid link to B. Moving the surviving B to 0.5 m leaves C at zero. | [rig-math.ts:103](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/rig-math.ts:103) |

**Verification passed** for all 1,625 Vitest tests, typecheck, lint, both builds, the bundle check, and both studio browser gates. Independent probes confirmed the default millimetre drawer travels from 0.300 to 0.500 m, its uniform-scale live and headless colliders agree, and clip-less binary round-trips preserve hinge direction in all eight reflection octants.

## Findings and disposition

All 4 merge blockers and 8 follow-up findings accepted and fixed in commit `a71d735` with deterministic regression tests in `src/capabilities/sand3d-r2-regressions.test.ts`.

## Verification

Reviewed commit `2da92f2` passed `npm run verify` (36/36 files, 1,625 tests), `npm run check:studio:ci`, and `npm run check:studio`; all 12 findings verified resolved in `a71d735`.

## Round outcome

Hold findings fixed in commit `a71d735`; re-submitted for round 2.
