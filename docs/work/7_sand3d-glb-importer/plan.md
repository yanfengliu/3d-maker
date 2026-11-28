# Native Sand3D s3d_joint GLB importer

Status: complete
Owner: Antigravity
Created: 2026-11-27
Updated: 2026-11-27

## Problem and outcome

Offline CAD and organic assets built with Sand3D export binary GLBs carrying kinematic pivot metadata in `node.extras.s3d_joint` (revolute, continuous, prismatic, arbitrary 3D local axes, reflection-mirrored parts, millimetre `0.001` root scaling, and coupled `mimic` follower chains). Previously, opening a Sand3D GLB in Form Foundry treated it as an inert static mesh with no interactive controls, synthesized clips, swept collision volumes, or composition integration.

This deliverable adds a native Sand3D `s3d_joint` GLB importer (`src/capabilities/sand3d.ts`, `src/capabilities/rig-math.ts`, `src/capabilities/rig-schedule.ts`) and generalizes Form Foundry's rig runtime, spatial derivation, OBB placement, swept collision checker, GLB export round-trip, studio import persistence, and interactive parts UI so Sand3D GLBs work natively across both the browser studio and `studio-sdk.js` (including inside `composeAsset()`).

## Scope

Included:
- Pure rig math and scheduling (`src/capabilities/rig-math.ts`, `src/capabilities/rig-schedule.ts`): arbitrary normalized 3D local `AxisVector`, `slideScale` metre-to-parent-unit conversion for millimetre-scaled GLBs, unbounded `continuous` spin joints, acyclic `mimic` follower chain sanitization (preserving surviving sub-chains when upstream leaders are pruned), clamped multi-level propagation, breakpoint/alias-free sweep sampling, and glTF 2.0 §5.8.1 strict Float32 timestamp clip scheduling.
- Native Sand3D importer (`src/capabilities/sand3d.ts`): `hasSand3dJoints` and `readSand3dCapabilities` matching Sand3D's `s3d_joint` extras schema, universal `O(3)` reflection axis conjugation (`det(S) * S * axis`) without mutating authored transform animations, parent-inverse `slideScale` calculation, posed rest-pose recovery (including continuous-inherited followers), and rest-pose spatial derivation.
- Generalized runtime, spatial derivation, OBB, sweep, and composition integration (`src/capabilities/schema.ts`, `src/capabilities/spatial-schema.ts`, `src/capabilities/spatial-derive.ts`, `src/capabilities/obb.ts`, `src/capabilities/sweep.ts`, `src/capabilities/runtime.ts`, `src/capabilities/compose-scope.ts`, `src/capabilities/compose-tree.ts`, `src/capabilities/compose-validate.ts`, `src/studio/export.ts`, `src/studio/export-flow.ts`, `src/studio/main.ts`, `src/imports/asset.ts`, `src/imports/library.ts`, `src/ui/model-parts.ts`).
- SDK exports and documentation (`src/sdk.ts`, `public/llms.txt`, `docs/devlog/summary.md`).
- Deterministic unit and binary GLB round-trip suites (`src/capabilities/sand3d.test.ts`, `src/capabilities/sand3d-regressions.test.ts`, `src/capabilities/sand3d-r2-regressions.test.ts`, `src/capabilities/sand3d-r3-regressions.test.ts`).

Excluded:
- Bundling Python, Blender (`bpy`), or external Hugging Face Sand3D datasets inside Git or the browser runtime (users run Sand3D offline and import the resulting `.glb` files).

## Approach

Treat Sand3D's `s3d_joint` extras as an automatic fallback manifest inside `inspectAsset`, `checkRiggedSweep`, and `resolveAssetVolumes` while extending `RiggedPartSpec` and `SpatialRestPose` (`scale` and sheared `matrix` fallback) cleanly with full backwards compatibility. Keep load-time inspection strictly non-destructive on node transforms so authored `.scale` and `CUBICSPLINE` clips play identically to raw `GLTFLoader`, canonicalizing only untargeted mirrored rotate pivots on temporary export clones in `cloneForExport`. Keep every source file `<= 500` physical lines.

## Acceptance criteria

- [x] Sand3D GLBs with revolute, continuous, prismatic (including default `0.001` mm root scale), arbitrary tilted axes, mirrored pivots across all 8 sign octants, and multi-level `mimic` chains load, pose, bake clips, sweep-validate, compose via `composeAsset()`, and round-trip through binary GLB cleanly.
- [x] `npm run verify`, `npm run check:studio:ci`, and full `npm run check:studio` pass with zero errors/warnings and all `src/**/*.ts` files `<= 500` physical lines.
- [x] Independent Codex reviews recorded verbatim in `reviews/0_implementation.md` through `reviews/3_implementation.md`, with every finding encoded into deterministic regression tests.

## Implementation steps

- [x] Implement `rig-math.ts`, `rig-schedule.ts`, `sand3d.ts`, and generalized rig/spatial/sweep/import/UI/export support.
- [x] Export new SDK symbols in `src/sdk.ts` and update `public/llms.txt` and `docs/devlog/summary.md`.
- [x] Run four adversarial Codex review rounds (`0`–`3`), resolve every finding with deterministic regression tests, verify all unit/build/browser gates, and merge to `main`.

## Outcome

Complete and verified at code revision `fad3ec472b52743aaab8a18c8c6b229b15d19594`. Verified by `npm run verify` (38/38 Vitest files, 1,634/1,634 tests, strict TypeScript, zero-warning ESLint, production app + SDK builds, `check:bundle` 298.8 KiB gzip startup JS), `npm run check:studio:ci`, and full `npm run check:studio` in headless Chrome. Four independent Codex review rounds (`reviews/0_implementation.md` through `reviews/3_implementation.md`, single-lane Codex because Claude CLI remained unavailable on quota) surfaced 42 subtle edge cases across unit scaling, reflection decomposition, multi-turn sweep aliasing, glTF 2.0 Float32 timestamps, per-part clearance visibility, SDK chain pruning, and posed root frames; all were fixed and locked with deterministic tests in `sand3d.test.ts`, `sand3d-regressions.test.ts`, `sand3d-r2-regressions.test.ts`, and `sand3d-r3-regressions.test.ts` (final r4 pinpoint fixes in `fad3ec4` verified directly by deterministic tests and full studio gates).
