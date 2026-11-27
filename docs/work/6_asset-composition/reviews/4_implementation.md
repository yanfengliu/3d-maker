# Review 4: implementation

## Target

Repository `3d-maker`, branch `feat/asset-composition`, commit `6da5eb6c4e3fbb8ee1a716f241891f367f19511b` (composition subsystem under `src/capabilities/compose*.ts`, `src/capabilities/obb.ts`, `src/capabilities/sweep.ts`, `src/capabilities/runtime.ts`, `src/capabilities/schema.ts`, `src/studio/export.ts`, and regression tests).

## Reviewers and coverage

- Codex (`gpt-6.2-astra`, effort `max`): read-only repository review, verdict `keep`, mutated=`False`.
- Claude lane unavailable or skipped for repair verification.

## Reports

### Codex (gpt-6.2-astra)

**Hold `6da5eb6c` from `main`.** F8 and F10 still have High failures. F7, F9, F11, and F15 have remaining Medium cases. F4 and F14 are verified.

I reviewed `480fc1ae..6da5eb6c` on `feat/asset-composition`, with `8708167` as the merge base. Both requested suites passed all 10 tests. The full Vitest run passed all 1,613 tests, and TypeScript and ESLint passed. The additional checks below ran in memory. No files were edited. Production builds and the studio browser gate were outside this review. [compose-r1-regressions.test.ts:65](src/capabilities/compose-r1-regressions.test.ts:65) · [compose-r2-regressions.test.ts:65](src/capabilities/compose-r2-regressions.test.ts:65) · [package.json:17](package.json:17)

### High findings

- **F8. Rebuilding the load can bake the boom’s open pose into the manifest.** The tested direction works. Rebuilding the crane records `attachRestPose` at x=5 with scale `[2,1,1]` and the dependent slot at x=7 before restoring the boom. Rebuilding the **load** while the same boom is open records `slotRestPose` at x=10. Closing the boom returns the live load to x=7, while JSON placement still puts it at x=10. The regression rebuilds only the crane. [compose-runtime.ts:335](src/capabilities/compose-runtime.ts:335) · [compose-runtime.ts:383](src/capabilities/compose-runtime.ts:383) · [compose-runtime.ts:365](src/capabilities/compose-runtime.ts:365) · [compose-tree.ts:186](src/capabilities/compose-tree.ts:186) · [compose-r2-regressions.test.ts:168](src/capabilities/compose-r2-regressions.test.ts:168)
- **F8 also fails for combined attachment and surface placement.** The R2 fixture declares `Pad` and omits `surface` from the load mount. With `surface: 'Pad'`, boom scale `[2,1,1]`, and a 45° load rotation, storing the sheared slot matrix as rotation and scale moved the headless collider enough to miss a probe that overlapped live. I also checked a manifest produced by `480fc1ae`. With both socket and surface at y=2, the fallback applied the socket translation twice, moving the lamp collider center from y=2.2 to y=4.2. [compose-r2-regressions.test.ts:148](src/capabilities/compose-r2-regressions.test.ts:148) · [compose-r2-regressions.test.ts:159](src/capabilities/compose-r2-regressions.test.ts:159) · [compose-scope.ts:148](src/capabilities/compose-scope.ts:148) · [compose-tree.ts:197](src/capabilities/compose-tree.ts:197) · [compose-tree.ts:215](src/capabilities/compose-tree.ts:215)
- **F10. An authored root-relative animation can move the wrong node.** The named `AnimatedPivot` and importer `sourceAsset` cases pass. For an authored group named `Scene`, `.position` produces an empty target that the wrapper check discards. In a binary round trip, the channel moved the child `Inner`. With that child initially offset by 4 m, its world x at 0.5 seconds was 0.5 instead of 4.5. The channel count was still one. [export.ts:29](src/studio/export.ts:29) · [export.ts:45](src/studio/export.ts:45) · [compose-r2-regressions.test.ts:93](src/capabilities/compose-r2-regressions.test.ts:93) · [compose-r2-regressions.test.ts:101](src/capabilities/compose-r2-regressions.test.ts:101) · [asset.ts:359](src/imports/asset.ts:359)
- **F10 also leaves a synthetic wrapper on every save.** The installed exporter names its synthetic scene `AuxScene`, and the loader retains that name. The unwrap predicate accepts only `''` and `'Scene'`. Across six saves of the R2 fixture, both clips kept a channel, while the serialized node count grew from 167 to 172, one wrapper per save. The four-save assertion passes even with unwrapping disabled. [GLTFExporter.js:2725](node_modules/three/examples/jsm/exporters/GLTFExporter.js:2725) · [GLTFLoader.js:4437](node_modules/three/examples/jsm/loaders/GLTFLoader.js:4437) · [export.ts:46](src/studio/export.ts:46) · [compose-r2-regressions.test.ts:83](src/capabilities/compose-r2-regressions.test.ts:83)

### Medium findings

- **F7. A hidden carried collider still blocks its carrier’s sweep before controller initialization.** The two requested fixtures genuinely exercise their repairs. Removing the sweep ancestor check fails the `Brace` assertion, and excluding `stopAt` fails the root `Rack` assertion. A separate carried-load path checks only the collider’s own name and live visibility. After reload, a carried `Brace` inside a hidden `Rack` reported a wall collision during the boom sweep. Initializing the controller cleared it. A hidden root’s ordinary `Body` collider also remains in placement when it has no explicit `node`. [compose-tree.ts:174](src/capabilities/compose-tree.ts:174) · [sweep.ts:115](src/capabilities/sweep.ts:115) · [compose-r2-regressions.test.ts:317](src/capabilities/compose-r2-regressions.test.ts:317) · [compose-r2-regressions.test.ts:337](src/capabilities/compose-r2-regressions.test.ts:337) · [compose-validate.ts:94](src/capabilities/compose-validate.ts:94) · [compose-validate.ts:325](src/capabilities/compose-validate.ts:325) · [obb.ts:370](src/capabilities/obb.ts:370)
- **F9. Slash-qualified clips bypass export rebinding.** For the supplied `Door`-before-`Frame` rebuild, I verified that both door channels and both root channels targeted their respective children. The runtime also accepts `inner/Swing`, but the rebinder matches only `inner: `. Repeating the same reload and rebuild with the supported slash spelling exported both door channels to node 4, the outer door. [compose-tree.ts:471](src/capabilities/compose-tree.ts:471) · [export.ts:76](src/studio/export.ts:76) · [export.ts:90](src/studio/export.ts:90) · [compose-r2-regressions.test.ts:373](src/capabilities/compose-r2-regressions.test.ts:373)
- **F11. Nesting a loaded legacy GLB loses its static lock.** The dynamic-deck reload test genuinely proves the modern lock. A GLB produced with the actual `8dc84b7` exporter also upgraded to `locked: true` when opened directly. Composing that same loaded scene as a child first marked its manifest host `compositeChild`. The legacy lookup stopped before reaching `physicsBodyOverride`, and rebuilding the nested leaf changed the body from static to dynamic. [compose-r2-regressions.test.ts:193](src/capabilities/compose-r2-regressions.test.ts:193) · [compose-r2-regressions.test.ts:234](src/capabilities/compose-r2-regressions.test.ts:234) · [compose-runtime.ts:104](src/capabilities/compose-runtime.ts:104) · [compose-scope.ts:189](src/capabilities/compose-scope.ts:189) · [compose-scope.ts:134](src/capabilities/compose-scope.ts:134)
- **F15. A rejected multi-part composition can still alter caller objects.** The distinct manifest-backed fixture passes, and I verified that nested `setChildParams` accepts a fully qualified 256-character clip name and rejects 257. Supplying the same previously parented object for `first` and `other`, with a 246-character node name, passed both preliminary checks. The second scoping pass then threw after the first had renamed the object, stripped its manifest, and moved it to `Slot_first`. Even with distinct objects, inspecting an earlier object without a manifest updated its local and world matrices before a later length rejection. [compose-r2-regressions.test.ts:422](src/capabilities/compose-r2-regressions.test.ts:422) · [compose-r2-regressions.test.ts:238](src/capabilities/compose-r2-regressions.test.ts:238) · [compose-scope.ts:83](src/capabilities/compose-scope.ts:83) · [compose.ts:219](src/capabilities/compose.ts:219) · [compose-scope.ts:171](src/capabilities/compose-scope.ts:171) · [compose.ts:277](src/capabilities/compose.ts:277) · [runtime.ts:75](src/capabilities/runtime.ts:75)

### Verified repairs

- **F4.** Default-label decals remained visible after rebuild, and `MissingSlot` preserved the exact live manifest object. I also injected a child-change callback during staged controller construction. The identity assertion passed with the guard and failed when I disabled it. [compose-tree.ts:432](src/capabilities/compose-tree.ts:432) · [compose-runtime.ts:116](src/capabilities/compose-runtime.ts:116) · [compose-runtime.ts:323](src/capabilities/compose-runtime.ts:323) · [compose-r2-regressions.test.ts:134](src/capabilities/compose-r2-regressions.test.ts:134) · [compose-r2-regressions.test.ts:139](src/capabilities/compose-r2-regressions.test.ts:139)
- **F14.** The 1 cm probe mounted at local `(240, 0.5, -0.495)` distinguishes the thresholds under approximately `8e-5` shear and 5 mm tolerance. The current `1e-9` threshold detected overlap. Restoring `1e-4` in memory made placement report `valid: true` and failed the exact regression assertion. [obb.ts:146](src/capabilities/obb.ts:146) · [compose-r1-regressions.test.ts:419](src/capabilities/compose-r1-regressions.test.ts:419) · [compose-r1-regressions.test.ts:429](src/capabilities/compose-r1-regressions.test.ts:429) · [compose-r1-regressions.test.ts:438](src/capabilities/compose-r1-regressions.test.ts:438)

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| R4 | Substantive findings reported by Codex above | Accepted; encoded as deterministic Vitest regressions and fixed | `283a8edda8fbb5750edeaabab40a1ce62413b3ab` |

## Verification

Full `npm run verify` (34 Vitest files, 1,616 tests, strict TypeScript, zero-warning ESLint, production app + SDK builds, bundle budget check), `npm run check:studio:ci`, and `npm run check:studio` passed on repair `283a8ed`.

## Round outcome

Round 4 edge cases resolved in 283a8ed.
