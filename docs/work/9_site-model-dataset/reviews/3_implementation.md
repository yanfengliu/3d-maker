# Final SDK placement and scaled import checks

## Target

Base `650685f`. The reviewed source is Git tree a92e9645f68adb1bd7a42615183adca9ca8049f4. The binary Git diff is retained locally at `output/reviews/sfo-roof-composition-1128.patch.gz`.

## Reviewers and coverage

- codex (gpt-6.2-astra, max) — keep.

## Reports

### codex

Both repairs check out by read-only inspection of the code and the shipped GLB. No tests were run.

- **Roof composition.** The fixture loads the registered `v1.glb`. Seating, composite bounds, and footprint validation all apply each instance transform. On the rotated podium, the roof meets its support at local Y = 3 m and world Y = 15 m. Its X/Y/Z dimensions are **65.317 × 22.180 × 262.130 m**. The steel overhang makes `footprint-overflow` the only surface issue on the 262.02 × 65.10 m deck. [Composition fixture and assertions](src/studio/instanced-import.test.ts:139)
- **Twice-scaled export.** The synthetic fixture uses the two reported scale/proportion pairs, `(1.10, 1.15)` and `(1.50, 1.50)`. The repair accounts for rounding at both saves, accepting the 2 mm difference between the stored **118.121 m** and the scaled prototype’s **118.119 m**. Independently measuring the shipped vertices gives the recovered X/Y/Z dimensions **432.515 × 63.130 × 107.773 m**, with `originY = 0`. The wrapper check preserves the fixture’s authored dimensions even when they exactly match the prototype, including after export and reopen. [Scaled fixture](src/studio/instanced-import.test.ts:159) · [Repair](src/capabilities/measure-dimensions.ts:45) · [Authored round trip](src/studio/instanced-import.test.ts:115)

The unchanged inventory caller `openSavedImport` reaches the repair through `openStoredFile` before reapplying saved edits. [Caller outside the diff](src/imports/library.ts:133)

## Findings and disposition

F1 and F4 are resolved. The checked import preserves authored dimensions and the SDK seats the real SFO roof at the support surface. F3 is also covered for shallow checkouts by separate pins for each complete version record.

## Verification

The reviewer inspected the shipped GLB, actual composition consumer and scaled export/import tests. Local Vitest, strict TypeScript, zero-warning lint, both builds, SDK bundle checks and the seven camera views passed.

## Round outcome

The reported composition and legacy sizing issues passed their final recheck.
