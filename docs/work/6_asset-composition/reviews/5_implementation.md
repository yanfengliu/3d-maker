# Review 5: implementation

## Target

Repository `3d-maker`, branch `feat/asset-composition`, commit `283a8edda8fbb5750edeaabab40a1ce62413b3ab` (composition subsystem under `src/capabilities/compose*.ts`, `src/capabilities/obb.ts`, `src/capabilities/sweep.ts`, `src/capabilities/runtime.ts`, `src/capabilities/schema.ts`, `src/studio/export.ts`, and regression tests).

## Reviewers and coverage

- Codex (`gpt-6.2-astra`, effort `max`): read-only repository review, verdict `keep`, mutated=`False`.
- Claude lane unavailable or skipped for repair verification.

## Reports

### Codex (gpt-6.2-astra)

**Hold the merge of `283a8edd` to `main` at `8708167`.** I verified the tree against `6da5eb6c`. All three tests in the requested regression file passed, but additional in-memory checks reproduced two High and three Medium failures.

- **F8 · High — rebuilding a load can record an animated boom’s position as rest.** The committed `setPart` case restores the open value `3` and records rest at `x = 7`. When I opened the same boom with `playClips` and rebuilt the load at `x = 10`, stopping the clip returned the live load to `x = 7`. Headless placement accepted a wall there because the manifest still recorded `10`. `reseatAndRecordRest` gates its reset on manual binding values, which omit mixer motion. [compose-r3-regressions.test.ts:85](src/capabilities/compose-r3-regressions.test.ts:85) · [compose-runtime.ts:134](src/capabilities/compose-runtime.ts:134) · [runtime.ts:287](src/capabilities/runtime.ts:287) · [obb.ts:335](src/capabilities/obb.ts:335)

  The 16-element matrix preserves shear to six decimal places. Deleting it still passes the committed collision assertion. A probe at `[6.2, 1.5, 0]` distinguished the paths: live placement and the stored matrix detected the collision, while decomposed TRS missed it. The legacy surface fallback correctly applied attachment rotation and scale and kept the lamp center at `y = 2.2`. [compose-scope.ts:166](src/capabilities/compose-scope.ts:166) · [compose-tree.ts:188](src/capabilities/compose-tree.ts:188) · [compose-tree.ts:218](src/capabilities/compose-tree.ts:218) · [compose-r3-regressions.test.ts:104](src/capabilities/compose-r3-regressions.test.ts:104) · [compose-r3-regressions.test.ts:122](src/capabilities/compose-r3-regressions.test.ts:122)

- **F10 · High — unwrapping can discard a child-owned `.position` clip.** I measured exactly 84 nodes on each of six saves and world `x = 4.5` for the directly exported authored `Scene`. I also compared an unanimated `Scene` wrapping an authored `AuxScene` that owns the clip. `6da5eb6c` exported `ShiftScene` and reached `4.5`. `283a8edd` exported zero clips and left `Inner` at `4`. The guard checks the outer source and controller clips before walking the wrappers. It consults the selected child’s animations only after unwrapping. [export.ts:52](src/studio/export.ts:52) · [export.ts:113](src/studio/export.ts:113) · [export.ts:156](src/studio/export.ts:156) · [compose-r3-regressions.test.ts:140](src/capabilities/compose-r3-regressions.test.ts:140) · [compose-r3-regressions.test.ts:163](src/capabilities/compose-r3-regressions.test.ts:163)

- **F7 · Medium — a hidden, reloaded `Rack` can still block the boom.** The root and node ancestry checks clear the committed pre-controller fixture. When I saved the hidden `Rack` first and mounted its loaded `gltf.scene`, the root check saw `AuxScene`. The sweep reported `rack:Body` hitting the wall at boom displacement `0.6`. Manifest-only resolution of the committed fixture also returned both `load/Body` and `load/BraceCol`, because the root guard requires a live object. [compose-validate.ts:87](src/capabilities/compose-validate.ts:87) · [compose-validate.ts:95](src/capabilities/compose-validate.ts:95) · [compose-validate.ts:106](src/capabilities/compose-validate.ts:106) · [obb.ts:349](src/capabilities/obb.ts:349) · [compose-r3-regressions.test.ts:203](src/capabilities/compose-r3-regressions.test.ts:203)

- **F9 · Medium — nesting a slash-qualified clip can bind it to the wrong door.** Both one-level spellings produced distinct targets. Nesting that pair under `room` produced `room: inner/Swing`. The leaf rebinder checks `room: inner: ` and `room/inner/`, so it misses the spelling composition itself produced. After reload and rebuilding `room/outer`, both GLB channels targeted node `5`, the outer door. [compose.ts:307](src/capabilities/compose.ts:307) · [export.ts:86](src/studio/export.ts:86) · [export.ts:201](src/studio/export.ts:201) · [compose-r3-regressions.test.ts:237](src/capabilities/compose-r3-regressions.test.ts:237)

- **F15 · Medium — a later track-parsing failure still mutates an earlier caller object.** Duplicate references and ancestor overlap in either order were rejected. The read-only manifest lookup also preserved the earlier matrix on the tested clip-name length error. A later keyframe track named `Door`, with no property, passed pre-flight and threw during scoping. By then `Raw` had become `first__Raw`, moved under `Slot_first`, and changed its `matrixWorld` X translation from `0` to `3`. [compose.ts:148](src/capabilities/compose.ts:148) · [compose.ts:209](src/capabilities/compose.ts:209) · [compose.ts:298](src/capabilities/compose.ts:298) · [compose-scope.ts:22](src/capabilities/compose-scope.ts:22) · [compose-scope.ts:212](src/capabilities/compose-scope.ts:212) · [compose-r3-regressions.test.ts:289](src/capabilities/compose-r3-regressions.test.ts:289)

**F11 is resolved.** `composeAsset` upgrades the legacy override before scoping. Lookup follows single-child `compositeChild` wrappers and stops before a `compositeSlot`. I verified `body = 'static'` and `locked = true` both before controller initialization and after rebuilding the dynamic `room/leaf`. [compose.ts:265](src/capabilities/compose.ts:265) · [compose.ts:292](src/capabilities/compose.ts:292) · [compose-scope.ts:134](src/capabilities/compose-scope.ts:134) · [compose-r3-regressions.test.ts:258](src/capabilities/compose-r3-regressions.test.ts:258)

The full Vitest suite passed **1,616 tests across 34 files**. Strict TypeScript and ESLint also passed. I skipped the artifact-writing build and browser gates for this read-only review. [package.json:11](package.json:11) · [gates.md:3](docs/policies/gates.md:3) · [gates.md:5](docs/policies/gates.md:5)

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| R5 | Substantive findings reported by Codex above | Accepted; encoded as deterministic Vitest regressions and fixed | `a3e78c3a16354a125f5d20e8b30921d00c4ec527` |

## Verification

Full `npm run verify` (34 Vitest files, 1,616 tests, strict TypeScript, zero-warning ESLint, production app + SDK builds, bundle budget check), `npm run check:studio:ci`, and `npm run check:studio` passed on repair `a3e78c3`.

## Round outcome

Round 5 findings (F7, F8, F9, F10, F15) resolved in a3e78c3.
