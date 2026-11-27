# Review 0: implementation

## Target

3d-maker `3d527e8..f3c9c434779987aa6fd0bef1eedb3d6fdd2a866b`, covering motion data, skeleton conversion, editor and SDK integration, and humanoid discovery.

## Reviewers and coverage

An independent workspace reviewer examined the committed implementation and reproduced failures using local assets and mocks.

## Reports

### Independent reviewer

Three reproducible P2 findings at `f3c9c43`.

- **Imported clips can hide distinct library motions.** Deduplication uses display names. Family Traveller’s native Idle, Walk, and Run keep hip X/Z at zero, while the packaged versions animate those axes. Only the native versions reach preview and export. A custom clip named Dance likewise hides the library Dance. `src/animation/library.ts:31`
- **Multi-primitive imports can use the wrong hip height.** I loaded two variants of Family Traveller with identical inverse binds and a crouched initial pose. Splitting the body into two material primitives changed the computed reference height from 0.950 m to 0.550 m. Added clips then start 0.40 m lower and scale root movement to 58%. `src/animation/rig.ts:126`
- **A supplemental catalog failure hides available characters.** With one successful canonical character match and an HTTP 503 from the animal-class query, the Characters filter reported zero assets. `src/data/browse.ts:182`

All 85 packaged motions matched their cached source tracks, times, and hip translations. All 146 legacy humanoid IDs matched the local catalog snapshot. I used local reads and in-memory reproductions.

## Findings and disposition

| ID | Disposition | Repair |
|---|---|---|
| F0 | Accepted | Compare clip channels and retain distinct versions under stable suffixes. |
| F1 | Accepted | Resolve hip height from the bind transforms across material and armature layouts. |
| F2 | Accepted | Keep successful catalog responses during partial outages. |

## Verification

The integration owner opened a previously misclassified humanoid, previewed Sitting, reopened a saved copy and inspected each exported clip's channels. The review separately examined data matching, posed imports and partial outages.

## Round outcome

Three defects require repair and independent recheck.
