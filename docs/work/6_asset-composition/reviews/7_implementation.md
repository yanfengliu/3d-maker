# Review 7: implementation

## Target

Repository `3d-maker`, branch `feat/asset-composition`, commit `4b701f1cf66c3be220ef280f11156938e1e72a68` (composition subsystem under `src/capabilities/compose*.ts`, `src/capabilities/obb.ts`, `src/capabilities/sweep.ts`, `src/capabilities/runtime.ts`, `src/capabilities/schema.ts`, `src/studio/export.ts`, and regression tests).

## Reviewers and coverage

- Codex (`gpt-6.2-astra`, effort `max`): read-only repository review, verdict `keep`, mutated=`False`.
- Claude lane unavailable or skipped for repair verification.

## Reports

### Codex (gpt-6.2-astra)

**HOLD `4b701f1` against `a3e78c3`.** Rebuilding the host still records the load at x = 10 as its rest position. I also reproduced two regressions by running the same inputs on both revisions.

| Finding | Verification |
|---|---|
| **F8 — partial** | Immediately after rebuilding the host from the posed GLB, `slotRestPose.at[0]` was **10**. Closing Boom put the live load at **7**, while headless placement still detected a wall at **10**. The committed test rebuilds the load a second time before asserting, which corrects the slot to 7. The `Boom.rotation[y]` case passed, including all three Euler components immediately after rebuilding. [compose-runtime.ts:408](src/capabilities/compose-runtime.ts:408) · [regression test:137](src/capabilities/compose-r3-regressions.test.ts:137) · [compose-tree.ts:186](src/capabilities/compose-tree.ts:186) |
| **F7 — partial** | With `RackCol` present, both live and headless placement retained the Chassis `Body`. Removing only that optional child collider made headless placement drop `Body` while live placement retained it. The renamed `Cargo Display` root correctly persisted `rootHidden: true` and stayed suppressed through standalone and nested GLB round-trips. [runtime.ts:125](src/capabilities/runtime.ts:125) · [compose-scope.ts:83](src/capabilities/compose-scope.ts:83) |
| **F10 — supplied case passes** | The credited `Scene` preserved `ShiftScene`, and `Inner` reached **4.5** at half-time. A pre-existing gap remains when `Inner` has a live controller with its own clip. That clip causes export to skip wrapper animation collection, and `Inner` stays at **4**. [export.ts:199](src/studio/export.ts:199) · [compose-tree.ts:59](src/capabilities/compose-tree.ts:59) |
| **F15 — passes** | `Door.` on an existing `Door` threw during preflight. The earlier caller object retained its original parent, name, world matrix, and user data. [compose.ts:236](src/capabilities/compose.ts:236) · [compose-scope.ts:102](src/capabilities/compose-scope.ts:102) |

**Regressions against the parent**

- **Headless visibility.** A legacy manifest hiding both root `Rack` and collider-bound child `Flap` now exposes `Body`. The parent suppressed it. Conversely, a new manifest with `rootHidden: true` still suppresses `Body` when the caller overrides `hiddenParts` to hide only `Flap`. [compose-scope.ts:81](src/capabilities/compose-scope.ts:81) · [obb.ts:316](src/capabilities/obb.ts:316)
- **Quaternion playback.** Restoring the Euler snapshot can flip the quaternion’s sign. On the next `Boom.quaternion[y]` keyframe, the rebuilt load landed at **z = +0.96**. Both the parent and the uninterrupted control landed at **z = −0.96**. [compose-scope.ts:27](src/capabilities/compose-scope.ts:27)

All **1,616 tests** passed. The parent’s original regression suite also passed against the candidate. TypeScript, ESLint, both in-memory production builds, and the bundle gate passed. I skipped the Chrome studio gate because it writes captures to the read-only workspace.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| R7 | Substantive findings reported by Codex above | Accepted; encoded as deterministic Vitest regressions and fixed | `39d89b61726dac54f69939c8947525c1df141cad` |

## Verification

Full `npm run verify` (34 Vitest files, 1,616 tests, strict TypeScript, zero-warning ESLint, production app + SDK builds, bundle budget check), `npm run check:studio:ci`, and `npm run check:studio` passed on repair `39d89b6`.

## Round outcome

Final Round 7 edge regressions (posed-host dependent rest seat, quaternion sign + Euler preservation, explicit boolean rootHidden with override, wrapper clips with live controller) resolved in 39d89b6 with deterministic regression tests.
