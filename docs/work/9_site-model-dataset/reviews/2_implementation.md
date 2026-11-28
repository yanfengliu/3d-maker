# Instanced import and registry repairs

## Target

Base `650685f`. The reviewed source is Git tree 34694c4ba29a00756c555c195156860e160820d9. The binary Git diff is retained locally at `output/reviews/sfo-roof-repairs-1128.patch.gz`.

## Reviewers and coverage

- codex (gpt-6.2-astra, max) — keep.

## Reports

### codex

**Scaled legacy SFO exports can still reopen at the wrong height.** Using the shipped GLB, I checked two successive legacy exports with `(scale, proportion)` set to `(1.10, 1.15)` and then `(1.50, 1.50)`. The saved prototype height is 118.121 m. The repair calculates 118.119 m, misses its 1.1 mm tolerance, and retains 118.121 m for a roof whose placed height is **63.130 m**. The regression covers unit scale and authored dimensions. The out-of-diff inventory caller `openSavedImport` uses this same import path. [Repair](src/capabilities/measure-dimensions.ts:35) · [Edit rounding](src/imports/asset.ts:303) · [Regression](src/studio/instanced-import.test.ts:97) · [Inventory caller](src/imports/library.ts:133)

**Release protection depends on Git history.** The guard compares complete prior release records and checks every binary’s digest. In a depth-one checkout, a committed change replacing v2, its digest, and its metadata together can pass. Only v1’s digest is independently pinned. [Release checks](src/data/site-assets.test.ts:25)

The orphan-vertex fix covers dimensions, framing, and inspection. Component grouping is iterative, with a regression for 16,000 overlapping placements. [Orphan regression](src/studio/instanced-import.test.ts:80) · [Overlap regression](src/studio/instanced-import.test.ts:125)

A mock-renderer check confirmed that masking restores each overlay’s prior visibility and the clear alpha, then redraws the viewport, even when sampling throws. A lower-left silhouette pixel still flags both `left` and `bottom`. [Viewport masking](src/studio/view-coverage.ts:12) · [Clipping regression](src/studio/view-coverage.test.ts:14)

## Findings and disposition

F0 and F2 were confirmed corrected. F1 remained reproducible after sequential scaled exports. F3 retained a shallow-checkout gap when historical records were missing. Both remaining cases were accepted.

## Verification

The clipping checks exercise a model pixel at an outer edge, restoration of the original overlays, and a genuine wheel-zoomed image cropped on both sides. Metadata pins now include every version record and its declared GLB digest.

## Round outcome

Scaled legacy exports and SDK composition are checked in a subsequent round. The full-history gate and pinned metadata cover published records.
