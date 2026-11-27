# Review 1: integration

## Target

The repairs at `9830ffda85c6826b8aec7b0b4a6b586d9641dd72` and the new playback behavior at `c2ffd2e`.

## Reviewers and coverage

The independent workspace reviewer reran the original reproductions and checked clip retention through a character edit.

## Reports

### Independent reviewer

F0–F2 are resolved. Local reproductions preserved distinct native and library motions, recovered the correct 0.950 m bind height from the posed multi-primitive GLB, and retained character results when either catalog source failed.

**P2 — Editing a character can truncate Play all.** At `c2ffd2e`, changing a property during native Idle or Walk rebuilds the character with only those two clips. Play all stays enabled and cycles between them until the Animation tab reopens. I reproduced this with the committed `swap` function. `src/studio/main.ts:133`

## Findings and disposition

F0–F2 closed. F3 accepted. Rebuild the whole repertoire when continuous playback is active.

## Verification

The integration owner verified 88 clips on Taverna waiter, including distinct native and library motions, by saving, reopening and exporting the character.

## Round outcome

The playlist repair requires a targeted recheck.
