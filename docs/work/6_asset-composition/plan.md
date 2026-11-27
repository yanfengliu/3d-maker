# Hierarchical asset composition

Status: complete
Owner: Antigravity
Created: 2026-11-27
Updated: 2026-11-27

## Problem and outcome

Combining two or more Form Foundry assets (such as a house containing 20 interactable appliances, or a crane carrying a mounted payload) previously required ad-hoc Three.js parenting that lost child structural knobs, collided internal node names and animation track bindings on GLB export, and dropped spatial/physics coupling laws.

This deliverable adds first-class hierarchical asset composition (`composeAsset`, `createCompositeController`, `validateComposite`, and `computeCompositeBodies`) exported from `studio-sdk.js` with full binary GLB round-trip persistence (`extras.formFoundry.children`) and documentation in `docs/design/composition.md` and `.agents/skills/author-3d-model/SKILL.md`.

## Scope

Included:
- Recursive child manifest schema (`src/capabilities/compose-schema.ts`, `src/capabilities/schema.ts`) supporting `weld`, `surface`, and `joint` physics coupling laws, preserved child recipes, `slotRestPose` (with 16-element matrix fallback for sheared mounts), `attachRestPose`, and explicit `state.rootHidden` / `physics.locked` flags.
- Zero-mutation pre-flight composition builder (`src/capabilities/compose.ts`, `src/capabilities/compose-scope.ts`, `src/capabilities/compose-tree.ts`) with `${id}__` node/track namespace isolation and optional `scopeNames: false` UUID rebinding.
- Scoped multi-asset runtime controller (`src/capabilities/compose-runtime.ts`) supporting concurrent per-child `AnimationMixer` playback, independent part poses/visibility/night/decals, and atomic live structural knob rebuilds (`setChildParams`) with automatic dependent re-seating.
- Composite spatial & swept-volume validation (`src/capabilities/compose-validate.ts`, `src/capabilities/obb.ts`, `src/capabilities/sweep.ts`) and multi-generation GLB export/re-import round-trip (`src/studio/export.ts`).
- Comprehensive Vitest suites (`compose.test.ts`, `compose-edge-cases.test.ts`, `compose-validation-edge.test.ts`, `compose-r1-regressions.test.ts`, `compose-r2-regressions.test.ts`, `compose-r3-regressions.test.ts`), studio capability check updates, and design/skill docs.

Excluded:
- Visual drag-and-drop scene editor UI in the studio viewport (composition is exposed via `studio-sdk.js` and GLB round-trip).

## Approach

Keep every child's local capability manifest intact inside `extras.formFoundry.children[]` while isolating scene-graph names via deterministic prefixes (or exact UUID rebinding when unscoped), storing exact relative rest transforms so live animations, sheared attachment mounts, posed GLB reloads, and headless OBB validation agree bit-for-bit. Keep every source file `<= 500` physical lines.

## Acceptance criteria

- [x] `composeAsset`, `createCompositeController`, `validateComposite`, and `computeCompositeBodies` preserve child knobs (`setChildParams`), rigged poses, detachable visibility, concurrent animations, and physics coupling laws across multi-level nesting and multi-generation GLB round-trips.
- [x] `npm run verify`, `npm run check:studio:ci`, and `npm run check:studio` pass with zero errors/warnings and all `src/**/*.ts` files `<= 500` lines.
- [x] Independent Codex reviews recorded in `reviews/0_implementation.md` through `reviews/7_implementation.md` and every finding resolved with deterministic regression tests.

## Implementation steps

- [x] Implement composition schema, builder, scoping, tree helpers, validation, runtime controller, and GLB export round-trip.
- [x] Export composition APIs in `src/sdk.ts`, update `public/llms.txt`, `docs/design/composition.md`, `docs/design/spec.md`, and `.agents/skills/author-3d-model/SKILL.md`.
- [x] Run independent adversarial review rounds (`0`–`7`), fix all findings with deterministic regression tests, verify all gates, and merge to `main`.

## Outcome

Complete and merged to `main` at verified code revision `39d89b61726dac54f69939c8947525c1df141cad`. Verified by `npm run verify` (34/34 Vitest files, 1,616/1,616 tests, strict TypeScript, zero-warning ESLint, production app + SDK builds, `check:bundle` 293.0 KiB gzip startup JS), `npm run check:studio:ci`, and full `npm run check:studio` in headless Chrome. Independent review history across 8 Codex rounds (`gpt-6.2-astra`, effort `max`) is preserved verbatim in `reviews/0_implementation.md` through `reviews/7_implementation.md` (Claude lane unavailable on quota during rounds; final r8 micro-fixes in `39d89b6` verified by deterministic regression tests covering every reported case).
