# Review 6: implementation

## Target

Repository `3d-maker`, branch `feat/asset-composition`, commit `a3e78c3a16354a125f5d20e8b30921d00c4ec527` (composition subsystem under `src/capabilities/compose*.ts`, `src/capabilities/obb.ts`, `src/capabilities/sweep.ts`, `src/capabilities/runtime.ts`, `src/capabilities/schema.ts`, `src/studio/export.ts`, and regression tests).

## Reviewers and coverage

- Codex (`gpt-6.2-astra`, effort `max`): read-only repository review, verdict `keep`, mutated=`False`.
- Claude lane unavailable or skipped for repair verification.

## Reports

### Codex (gpt-6.2-astra)

**HOLD `a3e78c3` against `283a8ed`.** All five named examples pass. I reproduced new regressions in F7 and F8, and found cases that F10 and F15 still miss.

- **F7 — hiding a child can erase a visible chassis collider.** The hidden, reloaded `Rack` correctly suppressed both `load/Body` and `load/BraceCol` before controller initialization and in manifest-only resolution. With a visible `Chassis`, an editable display name of `Rack`, and a hidden child named `Rack`, the commit also suppressed `load/Body` and accepted an overlapping wall. The parent detected the collision. In the reverse case, giving the hidden root a different display name made both colliders reappear in manifest-only resolution. [compose-scope.ts:57](src/capabilities/compose-scope.ts:57) · [obb.ts:318](src/capabilities/obb.ts:318) · [imports/asset.ts:286](src/imports/asset.ts:286)
- **F8 — a rebuilt host can cache its posed transform as rest.** The requested `playClips` case kept the live load at x = 10 and recorded `slotRestPose.at[0] = 7`. Both live and headless checks hit the probe at `[6.2, 1.5, 0]`. When I first rebuilt the host from a GLB saved with `Boom` posed by 3, the next load rebuild recorded 10. Closing the boom put the load at 7, and the parent revision recorded 7. I also reproduced a playback regression with `Boom.rotation[y]`. Restoring the live quaternion during rebuild changed the Euler components, putting the next animation sample 120° off its expected orientation. [compose-runtime.ts:390](src/capabilities/compose-runtime.ts:390) · [compose-runtime.ts:142](src/capabilities/compose-runtime.ts:142) · [compose-scope.ts:19](src/capabilities/compose-scope.ts:19) · [compose-tree.ts:187](src/capabilities/compose-tree.ts:187)
- **F10 — outer scene metadata still causes clip loss.** The supplied nested `AuxScene` fixture retained five nodes across six saves and moved `Inner` to x = 4.5 halfway through `ShiftScene`. Adding only `userData.credit` to the outer `Scene` made the exporter keep that wrapper and emit zero animations. The clip selection then overlooks the authored `AuxScene`. [export.ts:51](src/studio/export.ts:51) · [export.ts:171](src/studio/export.ts:171)
- **F15 — preflight still accepts `Door.` on an existing `Door` node.** Bare `Door` failed with zero matrix updates or reparenting. The trailing-dot form bypassed parsing, renamed `Raw` to `first__Raw`, moved it under `Slot_first`, and changed its world x from 0 to 3. Export then rejected the binding. [compose-scope.ts:85](src/capabilities/compose-scope.ts:85) · [compose-scope.ts:162](src/capabilities/compose-scope.ts:162)
- **F9 — distinct door targets verified.** After reload and rebuild of `room/outer`, I checked GLB node ownership directly. `room: outer: Swing` targeted the outer door at node 6, and `room: inner/Swing` targeted the inner door at node 12. The checked-in fixture reuses stale clips and emits an empty outer channel list on its intermediate save. A fresh round-trip confirmed correct ownership on both saves. [export.ts:96](src/studio/export.ts:96) · [compose-r3-regressions.test.ts:316](src/capabilities/compose-r3-regressions.test.ts:316)

All 1,616 Vitest tests, strict TypeScript, and repository ESLint passed. I compared the runtime probes against both revisions. Production builds and browser gates were outside this read-only review.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| R6 | Substantive findings reported by Codex above | Accepted; encoded as deterministic Vitest regressions and fixed | `4b701f1cf66c3be220ef280f11156938e1e72a68` |

## Verification

Full `npm run verify` (34 Vitest files, 1,616 tests, strict TypeScript, zero-warning ESLint, production app + SDK builds, bundle budget check), `npm run check:studio:ci`, and `npm run check:studio` passed on repair `4b701f1`.

## Round outcome

Round 6 regressions (F7, F8, F10, F15) resolved in 4b701f1.
