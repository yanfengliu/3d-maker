# Review 3: implementation

## Target

Repository `3d-maker`, branch `feat/asset-composition`, commit `480fc1ae6feb3787ae5b81ac63b5f36973c6810f` (composition subsystem under `src/capabilities/compose*.ts`, `src/capabilities/obb.ts`, `src/capabilities/sweep.ts`, `src/capabilities/runtime.ts`, `src/capabilities/schema.ts`, `src/studio/export.ts`, and regression tests).

## Reviewers and coverage

- Codex (`gpt-6.2-astra`, effort `max`): read-only repository review, verdict `keep`, mutated=`False`.
- Claude lane unavailable or skipped for repair verification.

## Reports

### Codex (gpt-6.2-astra)

**Do not merge `480fc1ae` into `main`.** I verified the requested revision against `8dc84b7`, with merge base `8708167`. All 1,613 Vitest tests passed, including all 10 in the two regression suites. TypeScript and ESLint also passed. Read-only probes reproduced two High findings and five Medium findings. I made no file edits and skipped the production build and browser gate. [package.json:17](package.json:17)

### High findings

- **F8 — Headless placement misses real collisions.** With a boom at x=5, x-scale 2, and a load mounted one metre along it, the live load was at x=7. JSON placement put it at x=6 and cleared a wall that the live load intersected. This happened both at composition and after rebuild. The snapshot discards scale, and the headless path skips the attachment transform entirely when a surface is present. Rebuilding an open sliding boom also captured its posed x=8 as rest, leaving JSON at x=8 after the boom closed to x=5. The committed test exercises translation alone. [compose.ts:191](src/capabilities/compose.ts:191) · [compose-tree.ts:179](src/capabilities/compose-tree.ts:179) · [compose-runtime.ts:385](src/capabilities/compose-runtime.ts:385) · [compose-r2-regressions.test.ts:121](src/capabilities/compose-r2-regressions.test.ts:121)
- **F10 — Re-export can remove an authored animation target.** Four consecutive saves from loaded cargo-pod scenes retained one manifest, both animation channels, and overlap detection. A 14-wrapper chain also read and updated the original manifest host. But `unwrapSceneWrapper` also discarded an authored identity group targeted by `AnimatedPivot.position`. Re-exporting that loaded composite produced a named clip with **zero channels**. The same path discarded the studio importer’s `sourceAsset` metadata. The regression checks that a clip exists, so it cannot detect an empty clip. [export.ts:24](src/studio/export.ts:24) · [schema.ts:444](src/capabilities/schema.ts:444) · [schema.ts:485](src/capabilities/schema.ts:485) · [asset.ts:359](src/imports/asset.ts:359) · [compose-r2-regressions.test.ts:82](src/capabilities/compose-r2-regressions.test.ts:82)

### Medium findings

- **F4 — Rebuild loses default-label decal visibility and writes live state during preparation.** Missing posed or hidden nodes were skipped, the dependent ended up on the replacement, and compatible pose, visibility, night mode, and custom decal text survived. A visible decal using its default label disappeared because `getState()` omits empty `decalText` and restoration requires that field. Separately, restoring a compatible pose fired `onChange` during Stage 1. When subsequent nested-slot validation threw, the dependent remained attached, but the live root’s manifest object had already been replaced. [compose-runtime.ts:343](src/capabilities/compose-runtime.ts:343) · [runtime.ts:297](src/capabilities/runtime.ts:297) · [compose-tree.ts:401](src/capabilities/compose-tree.ts:401) · [runtime.ts:312](src/capabilities/runtime.ts:312) · [compose-runtime.ts:199](src/capabilities/compose-runtime.ts:199) · [compose-r2-regressions.test.ts:114](src/capabilities/compose-r2-regressions.test.ts:114)
- **F7 — Hidden ancestors still produce pre-initialization collisions.** The committed `Rack → Brace` example passes. When `Rack` is itself the detachable asset root, the ancestor walk stops before checking it and reports a `BraceCol` collision. When `Brace` is rigged beneath a hidden non-root `Rack`, placement passes but the sweep reports it blocked. Both false collisions disappear after controller initialization. [obb.ts:310](src/capabilities/obb.ts:310) · [sweep.ts:113](src/capabilities/sweep.ts:113) · [compose-validate.ts:302](src/capabilities/compose-validate.ts:302) · [compose-r2-regressions.test.ts:259](src/capabilities/compose-r2-regressions.test.ts:259)
- **F9 — Unscoped tracks can converge after reload and rebuild.** Fresh mounted children exported distinct `Door` and root `.position` targets. The retained-dependent prefix test also caught removal of `keepSubtrees`. After reload, however, unchanged clips retain loader-generated name bindings. Rebuilding the host with `Door` before `Frame` changed traversal order. The next GLB sent **both door channels to outer node 4**. Their original targets were nodes 9 and 10. The unscoped regression ends at the first export. [compose.ts:97](src/capabilities/compose.ts:97) · [compose-tree.ts:437](src/capabilities/compose-tree.ts:437) · [compose-runtime.ts:211](src/capabilities/compose-runtime.ts:211) · [compose-r2-regressions.test.ts:285](src/capabilities/compose-r2-regressions.test.ts:285) · [compose-r2-regressions.test.ts:313](src/capabilities/compose-r2-regressions.test.ts:313)
- **F15 — Length validation protects only the current part.** When the second part’s clip name exceeded 256 characters, the first caller object had already been renamed, stripped of its manifest, and moved from its original parent to `Slot_a`. The regression rejects a single input. Nested rebuilds also bypass the full qualified clip limit: I exported a 275-character clip name whose manifest name read back as 256 characters. [compose.ts:354](src/capabilities/compose.ts:354) · [compose.ts:236](src/capabilities/compose.ts:236) · [compose.ts:430](src/capabilities/compose.ts:430) · [compose-runtime.ts:214](src/capabilities/compose-runtime.ts:214) · [schema.ts:324](src/capabilities/schema.ts:324) · [compose-r2-regressions.test.ts:322](src/capabilities/compose-r2-regressions.test.ts:322)
- **F11 — Previously saved explicit physics overrides are lost.** A new-format GLB retained `physics.locked`, and its dynamic primary child stayed pinned static through reload, rebuild, and `computeCompositeBodies`. A GLB written by `8dc84b7` with the same explicit override flipped to dynamic on its first rebuild under `480fc1ae`. The old writer used `userData.physicsBodyOverride` at `8dc84b7:src/capabilities/compose.ts:290`. The new reader consults only `physics.locked`. The Round 2 reload test still passed when I disabled lock handling in memory because its primary deck already defaults to static. [compose-runtime.ts:102](src/capabilities/compose-runtime.ts:102) · [schema.ts:397](src/capabilities/schema.ts:397) · [compose-tree.ts:293](src/capabilities/compose-tree.ts:293) · [compose-r2-regressions.test.ts:167](src/capabilities/compose-r2-regressions.test.ts:167)

### Other Round 2 checks

| Item | Verification |
|---|---|
| **F0 / F5** | Both `outer.setChildParams('room/leaf', …)` and direct `childComposite('room').setChildParams('leaf', …)` cleared the old outer mixer action and cache entry, replaced the clip, refreshed dimensions and mass, and reseated the room bottom at y=1. Replaying a frozen, once-only action restored `timeScale` to 1 and `clampWhenFinished` to false. [compose-runtime.ts:115](src/capabilities/compose-runtime.ts:115) · [compose-runtime.ts:293](src/capabilities/compose-runtime.ts:293) · [compose-runtime.ts:419](src/capabilities/compose-runtime.ts:419) · [compose-r1-regressions.test.ts:238](src/capabilities/compose-r1-regressions.test.ts:238) · [compose-r2-regressions.test.ts:183](src/capabilities/compose-r2-regressions.test.ts:183) |
| **F1** | `Arm.L.position` and `Armature:Arm.position` moved their intended nodes both live and after binary reload. The test checks both coordinates and both exported channels. [compose-r2-regressions.test.ts:221](src/capabilities/compose-r2-regressions.test.ts:221) · [compose-r2-regressions.test.ts:227](src/capabilities/compose-r2-regressions.test.ts:227) · [compose-r2-regressions.test.ts:232](src/capabilities/compose-r2-regressions.test.ts:232) |
| **F12** | The replacement uses fresh geometry and material. Restricting retention to the inner room in memory caused the strengthened test to catch disposal of the outer sibling’s shared geometry. [compose-r1-regressions.test.ts:196](src/capabilities/compose-r1-regressions.test.ts:196) · [compose-r1-regressions.test.ts:227](src/capabilities/compose-r1-regressions.test.ts:227) · [compose-r1-regressions.test.ts:243](src/capabilities/compose-r1-regressions.test.ts:243) |
| **F14 — Low test gap** | The fixture now uses approximately `8e-5` shear. Restoring the old `1e-4` threshold in memory still passed the entire Round 1 suite. A 1 cm probe at local x=240, z=−0.495 with 5 mm tolerance distinguished the implementations: the current code caught the collision and the old threshold missed it. [obb.ts:146](src/capabilities/obb.ts:146) · [compose-r1-regressions.test.ts:423](src/capabilities/compose-r1-regressions.test.ts:423) · [compose-r1-regressions.test.ts:432](src/capabilities/compose-r1-regressions.test.ts:432) |

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| R3 | Substantive findings reported by Codex above | Accepted; encoded as deterministic Vitest regressions and fixed | `6da5eb6c4e3fbb8ee1a716f241891f367f19511b` |

## Verification

Full `npm run verify` (34 Vitest files, 1,616 tests, strict TypeScript, zero-warning ESLint, production app + SDK builds, bundle budget check), `npm run check:studio:ci`, and `npm run check:studio` passed on repair `6da5eb6`.

## Round outcome

Round 3 edge cases resolved in 6da5eb6 with compose-r3-regressions.test.ts.
