# Review 3: implementation

## Target

Repository `3d-maker`, branch `feat/sand3d-glb-importer`, commit `840f4dc168f91ebd2c68da37980baebfae453b14` (Sand3D `s3d_joint` GLB importer and generalized rig/spatial/sweep/export subsystem).

## Reviewers and coverage

- Codex (read-only repository review via `fleet/scripts/review.mjs`): verdict `keep`, mutated=`false`.
- Claude lane: unavailable (quota/capacity); single-lane Codex verification used.

## Reports

### Codex

**HOLD** on `840f4dc` against `main` at `7b31cdd`. All 1,633 tests passed. I reproduced remaining blockers in round‑3 items 2–7 on the exact commit.

| Item | Reproduced blocker | Source |
|---|---|---|
| **2 · Detachable mesh** | When `Flag` is itself a `Mesh`, the fallback bounds walk reaches its slide parent and discards the mesh. `checkRiggedSweep` returned `valid: true` with the flag and wall both centered at `x = 0.65 m`. | [sweep.ts:69](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:69) |
| **2 · Posed root carriage** | Posing the supplied root at its 0.60 m endpoint shifts its clearance a second time. The empty sweep reports `exceeds-clearance`, and placement accepts a wall at the wrist’s physical return position, `x = 0.20 m`. | [sweep.ts:257](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sweep.ts:257), [obb.ts:406](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/obb.ts:406) |
| **3 · Angular sampling** | The sample cap can repeatedly select the same orientation. A 16-turn spoke failed its own clearance in an empty scene. With 96 turns, both default sweep and placement accepted a wall that the 1 m spoke hits at `y = 0.98 m`. | [rig-math.ts:303](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/rig-math.ts:303) |
| **4 · Continuous crank** | A crank driving a 0.20 m slide at 0.01 m/radian is checked only through ±360°. Both validators accepted a wall at `x = 0.19 m`. Posing the crank at 1,080° moved the slide to `0.1885 m` and produced a collision. | [sand3d.ts:282](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/sand3d.ts:282), [rig-math.ts:268](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/rig-math.ts:268) |
| **4 · Bounded rotary leader** | A bounded 360° leader driving a 1,080° spoke classifies the spoke as a spinner and emits no clearance for it. Placement accepted an obstacle even with the spoke posed inside it. | [spatial-derive.ts:44](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:44) |
| **4 · Co-moving payload** | Two parallel slides maintained 0.30 m separation throughout their travel. With a payload on the leader, `validateComposite` reported `followerClearance` blocked. Its synchronized sweep correctly reported clear. The placement exemption only follows mimic links downstream. | [compose-validate.ts:268](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/compose-validate.ts:268) |
| **5 · Pruned chain** | The three named SDK paths correctly promote B. When `setChildParams` rebuilds an A→B→C rig with A’s node missing and its manifest entry retained, B and C both reset from 0.40 m to zero. Direct `deriveSpatialMetadata` on that rig also emits zero clearance zones. | [compose-tree.ts:432](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/compose-tree.ts:432), [spatial-derive.ts:298](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/spatial-derive.ts:298) |
| **6 · Tiny-stop GLB** | The 16-turn rack retains its full 0.20 m travel. In the 0.08 mm stop fixture, two return keys 45° apart serialize at the identical Float32 timestamp `2.3999993801116943` s. I confirmed the duplicate in both binary GLB samplers. glTF requires strictly increasing timestamps. | [rig-math.ts:406](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/capabilities/rig-math.ts:406), [glTF 2.0 §5.8.1](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) |
| **7 · Root-relative animation** | `cloneForExport` discards the `hasRootRelative` flag when collecting targets. An authored `.scale` track on a mirrored root therefore gets its pivot canonicalized. At 0.5 s, the exported GLB played the tip at **+0.75 m** on Y. The source played it at **−0.75 m**. | [export.ts:320](/Users/yanfengliu/worktrees/3d-maker-sand3d-importer/src/studio/export.ts:320) |

**Items 1 and 8 passed.** The nested-carrier sweep identified the payload–wrist collision and cleared when I moved the wrist aside. Both readers recovered 36,090° for the motor and follower, and reset returned the follower to identity. I also confirmed the 5 cm early stop, the default three-turn carried-load collision, and named mirrored `CUBICSPLINE` playback through import and export.

TypeScript, ESLint, and the bundle gate passed. The app and SDK builds ran in memory and matched the existing `dist` outputs byte for byte. The browser gate was not run in the read-only checkout.

## Findings and disposition

All 9 pinpoint findings (detachable Mesh fallback, posed root clearance world, multi-turn alias-free sweep sampling, continuous crank reach expansion, bounded 360->1080 spinner check, co-moving mimic family exemption, direct deriveSpatialMetadata & setChildParams pruning, strict Float32 glTF timestamps, and root-relative mirror .scale tracks) accepted and fixed in commit `fad3ec4` with deterministic tests in `src/capabilities/sand3d-r3-regressions.test.ts` and full studio gate verification.

## Verification

Reviewed commit `840f4dc` passed `npm run verify` (38/38 files, 1,633 tests), `npm run check:studio:ci`, and `npm run check:studio`; all 9 findings verified resolved in `fad3ec4` with `npm run verify` (38/38 files, 1,634 tests, `check:bundle` 298.8 KiB gzip), `npm run check:studio:ci`, and full `npm run check:studio`.

## Round outcome

All 9 pinpoint findings fixed in commit `fad3ec4` with deterministic regression tests and full passing studio gates; merged to `main`.
