# Review 1: integration

## Target

3d-maker at `47d0ad7c6d85f4955e00af67b721176c308a71be`, after the first export and persistence repair.

## Reviewers and coverage

The independent reviewer checked the fixes. A separate pinned Codex CLI lane reviewed the same revision read-only, inspected the installed loader and reproduced save interleavings with deferred writes.

## Reports

### Independent reviewer

At `47d0ad7`, the export snapshot preserves anonymous animation targets and isolates wireframe materials. The production browser gate checks both against exported GLB contents. The IndexedDB update also rejects saves after deletion in another tab.

**One material save race remains.** If an agent changes an import between two overlapping saves, the second save returns the first promise. Both calls report success, but only the earlier edits persist. An asynchronous asset switch can also associate a completed save with the wrong displayed asset. Queue changed saves against the asset they captured and use its first saved ID for subsequent writes. `src/studio/main.ts:150`

The gate checks identical concurrent saves and stale deletion. It does not check edits between saves or a passive inventory view refreshing in a second tab. I inspected the exact commit and gate source without rerunning the suite. `scripts/check-studio.mjs:164`

### Codex CLI

Two remaining **P2 findings** in `47d0ad7c6d85f4955e00af67b721176c308a71be`:

- **Overlapping saves can silently discard newer edits.** `src/studio/main.ts:150` returns the pending promise even if `setImportEdits()` changed the asset between saves. The first save already captured its edits; both calls report success while only the older version persists. Queue changed snapshots against the first save’s resulting ID.

- **An intervening import attempt still permits duplicate first saves.** `src/studio/main.ts:132` increments `openSequence` before loading succeeds. A second save then bypasses the guard at line 150 despite the displayed asset remaining unchanged. Both saves receive undefined IDs and create separate entries. Track the displayed selection independently from pending import attempts.

Both reproduced in memory using the exact commit’s functions with deferred persistence mocks. `scripts/check-studio.mjs:164` covers identical consecutive saves, missing these interleavings.

No remaining material findings in UUID preservation, wireframe material isolation, or transactional stale-update rejection. Outside changed files, inspected `src/imports/asset.ts:35`, which confirms edits are copied into a separate snapshot.

No files changed; browser and full gates skipped as requested.

## Findings and disposition

| ID | Disposition | Repair |
|---|---|---|
| F2 | Follow-up accepted. Sharing a promise dropped intervening edits and indexing by load attempt could assign IDs to the wrong asset. | Capture every save, queue its write, and keep the ID on the installed selection. |

## Verification

The repair at `6a7bd3e` passed 44 unit tests and the production browser gate. The gate changes an import between two overlapping saves and asserts the later name and tint persisted in the same row.

## Round outcome

The integration owner requested an exact-revision follow-up in round 2.
