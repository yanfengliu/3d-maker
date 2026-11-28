# Imported roof and studio measurement

## Target

Base `650685f`. The reviewed source is Git tree b12ab75807c64b4eabe2080b8d69e87b513be6f4. The binary Git diff is retained locally at `output/reviews/sfo-roof-1128.patch.gz`.

## Reviewers and coverage

- codex (gpt-6.2-astra, max) — keep.

- claude (claude-opus-5-5, max) — keep.

## Reports

### codex

1. **Indexed instances can frame empty space.** Two triangles spanning 11 m, with one unused vertex at x = 1,000, produced a width of 1,010 m in the imported preview and inspector. The inspector also counted the disconnected triangles as one component. Use the positions referenced by the index when expanding each instance’s bounds. [src/instanced-bounds.ts:14](src/instanced-bounds.ts:14) · [scripts/inspect-glb.mjs:62](scripts/inspect-glb.mjs:62) · [viewport caller:267](src/studio/viewport.ts:267)

2. **Older exports retain prototype dimensions on reimport.** I reopened two cubes spanning 22 m with a 2 m width embedded by the old measurement convention. The preview measured 22 m, but the imported capabilities still reported 2 m. The local importer accepts the embedded manifest before reaching the corrected measurement, and export carries that value forward. Refresh previously inferred dimensions for instanced imports while preserving authored metadata. [src/capabilities/runtime.ts:87](src/capabilities/runtime.ts:87) · [import caller:390](src/imports/asset.ts:390) · [export caller:245](src/studio/export.ts:245)

3. **Overlapping instances can crash inspection.** A 642 kB GLB containing 16,000 overlapping instances raised `RangeError: Maximum call stack size exceeded` in `find()`. Each placement now contributes a box, and the recursive component lookup can follow a chain thousands of entries deep. Use iterative lookup and union by size or rank. [scripts/inspect-glb.mjs:105](scripts/inspect-glb.mjs:105) · [inspection command:20](package.json:20)

4. **The append-only check leaves published catalog records mutable.** The test pins the SFO v1 binary digest, but changing v1’s dimensions or source revision satisfies every assertion. Once v2 ships, deleting its row and file would also pass because the loop visits only surviving rows. Compare previously published version records against an immutable baseline. [src/data/site-assets.test.ts:16](src/data/site-assets.test.ts:16) · [release workflow caller:31](.github/workflows/pages.yml:31)

### claude

I found one real problem. The studio import, preview and inspection paths look correct for the new asset. This review is static: I ran no tests, because this worktree has no `node_modules` and you asked me not to run gates.

## Issue

**Medium: composing the roof with the SDK seats it 19.5 m too high and gives it the wrong size.**

The patch makes `inspectAsset` measure every instance (`src/capabilities/runtime.ts:87-90`). The SDK's composition code still measures only the raw prototype, without the instance transforms:
- `src/capabilities/compose.ts:77-88`, `measureMinAlongNormalInHost`, which decides where a part sits on a surface.
- `src/capabilities/compose-tree.ts:239-249`, `measureCompositeLocalBox`, which sets the composite's overall dimensions.
- `src/capabilities/compose-validate.ts:186-209`, which checks a part's footprint against a surface.

Call sites outside the diff:
- `compose.ts:265` gets the child's dimensions from `inspectAsset`, now correct.
- `compose.ts:124` and `:307` place the child on the surface using the prototype-only measurement.
- `compose.ts:333` → `:344-348` and `compose-runtime.ts:241-247` overwrite the composite's dimensions with prototype-only values.

This is public: `src/sdk.ts:96` exports `composeAsset`, and `public/llms.txt:17` documents `composeAsset`, `createCompositeController` and `validateComposite`. That is the same file this patch edits to point agents at the catalog.

The effect on `v1.glb` follows from its JSON chunk. The root node `international-departures-hall` is shifted y −19. The `international-roof-steel` node is a 604-instance mesh whose prototype spans ±1 × ±0.5 × ±1. Measured without the instances, that prototype is a phantom box at y −19.5 to −18.5, and the real steel is ignored. So:
- **Mounted on a surface:** the lowest point found is −19.5 instead of 0, so the building floats 19.5 m above the surface.
- **Mounted at the root:** the composite reports a height of about 41.5 m with `originY` −19.5. The child part reports 22.18 m and 0.
- **Width and depth:** the composite gives about 262.0 × 63.88 m, missing the steel overhang, against the child's 262.13 × 65.317 m.

Before this patch, the child and composite values were wrong in the same way. Now they contradict each other in one manifest.

Suggested fix: generalise `expandInstancedBounds` so it walks each placed vertex with a caller-supplied base matrix (host inverse × `matrixWorld` × instance matrix). Use it in those three loops. Add a compose test that reuses the nested, rotated instance fixture from `instanced-import.test.ts`.

## No problems found
- **Existing mesh behaviour:** every new branch only applies to instanced meshes, so other meshes are measured exactly as before. Nothing in `src/models` uses instanced meshes, so the 612 procedural models are unaffected. The rewritten inspection script gives the same results as before for ordinary meshes, including skinned ones.
- **Instance bounds in the import preview:** the viewport gets its framing from the two patched functions (`viewport.ts:267`, `:274`). Import gets dimensions from `inspectAsset` (`asset.ts:391`), and edits scale those stored dimensions (`asset.ts:300-310`). Export deep-clones, which keeps instanced meshes, and reuses the controller's manifest (`export.ts:192`, `:245`). No other bounds code in `src/studio` or `src/imports` walks vertices.
- **Offline import:** `v1.glb` embeds its three PNGs and has no `uri` fields, so it passes the resource check in `asset.ts:349-360`. Its only required extension, `EXT_mesh_gpu_instancing`, is built into the plain `GLTFLoader` that `asset.ts:381` creates. It needs no Draco, meshopt or KTX2 decoders, and there is no service worker involved.
- **Append-only versions:** the test pins v1's SHA-256 and checks that the file's length matches its GLB header, which `asset.ts:338-339` also requires. The main build copies `public/` into `dist/`, and the SDK build won't overwrite it (`vite.config.ts:8-11`). The bundle check has no size budget for public files. CI uses Node 24 (`.nvmrc`, `pages.yml:27`), which can `require()` the `.mjs` test helper.

No test yet compares the catalog's recorded dimensions with the GLB itself; the plan already lists this as open. The recorded depth and height are consistent with the GLB's own bounds data, but I did not check the width.

## Findings and disposition

F0–F2. Accepted. Imported indexed instances now use referenced vertices, the importer recognizes dimensions inferred by older studio exports, and component grouping uses an iterative algorithm. F3. Accepted. Entire version records have a historical comparison and independent release pins. F4. Accepted. The SDK surface seating, composite bounds and footprint checks also need transformed instance coordinates.

## Verification

Verified the original roof against the exported scene, checked the sparse-index fixture and 16,000 overlapping placements, and reproduced the SDK surface issue with the model’s transformed column bases.

## Round outcome

The registry and preview corrections proceeded to a dedicated repair check. The SDK surface correction has its own placement regression.
