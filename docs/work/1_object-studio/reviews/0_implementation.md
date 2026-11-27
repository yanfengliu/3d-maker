# Review 0: implementation

## Target

3d-maker at `dca443091e21d0c04ade8a35c8fe6a96c5d8f194`, focused on GLB export fidelity and inventory persistence.

## Reviewers and coverage

An independent read-only Codex reviewer inspected this revision, the installed three.js loader and exporter, recipe validation, public documentation and dataset exclusion. The reviewer reproduced the two exporter problems in memory.

## Reports

### Independent Codex reviewer

Reviewed `dca443091e21d0c04ade8a35c8fe6a96c5d8f194`. Four findings need fixes.

- **P1 — Imported animations can lose channels on export.** Cloning assigns fresh node UUIDs, while the exporter receives the original tracks. A read-only reproduction with the installed three.js exporter turned one valid channel into an empty clip. `src/studio/main.ts:97`
- **P1 — Wireframe preview changes exported geometry.** An imported clone shares materials with the displayed mesh. Restoring the preview’s wireframe flag before export changed a solid mesh to glTF primitive mode `1` (`LINES`) in the same reproduction. `src/studio/viewport.ts:221`
- **P2 — Concurrent saves duplicate a new import.** Two overlapping `forgeStudio.save()` calls each allocate an ID before either save completes. `src/studio/main.ts:88`
- **P2 — Saving a stale import restores a deleted inventory entry.** After deletion in another tab, “Save changes” recreates the import because the IndexedDB transaction unconditionally writes the old ID. `src/imports/library.ts:49`

I also inspected the loader, exporter, recipe validator, agent documentation, and dataset ignore rule. I made no file changes and skipped browser and full-suite gates as requested.

## Findings and disposition

| ID | Disposition | Repair |
|---|---|---|
| F0 | Accepted, anonymous channels could disappear | Preserve node identities in the isolated export graph. |
| F1 | Accepted, wireframe affected exported topology | Copy materials with preview overrides disabled. |
| F2 | Accepted, parallel first saves duplicated a row | Coordinate saves for the displayed selection. |
| F3 | Accepted, a deleted entry could be recreated | Check and update the existing cursor inside the write transaction. |

## Verification

At `47d0ad7` the desktop browser gate exported an unnamed animated node with wireframe enabled, counted all channels and verified triangle primitives. It also exercised duplicate initial saves and stale deletion in two tabs.

## Round outcome

F0, F1 and F3 closed on the repair. Follow-up review found further save interleavings, recorded in round 1.
