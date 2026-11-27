# Review 2: implementation

## Target

- Repository: `3d-maker`
- Commit: `024bc26597d694dec8c0b46e60363b1645ca2d93` (repair diff `79c4333..024bc26`; HEAD `fe250eb` adds only `reviews/1_implementation.md`)
- Scope: Focused verification of Round 1 repairs `F25`, `F0` (partial metadata + legacy preservation), `F4` (`autoBind` + Fit stability), and strengthened unit/browser tests (`F26`, `F1`, `F2`, `F14`, `F17`, `F21`, `F22`).

## Reviewers and coverage

- **Claude Code `2.1.329` (`claude-opus-5-5[1m]`, `--effort max`)**: Ran read-only repair verification from `../fleet/tmp/review-runs/3d-maker-5-round2` with `--tools "Read,Glob,Grep,Task,Bash"`, `--permission-mode dontAsk`, `--setting-sources=`, `--strict-mcp-config`, `--no-session-persistence`. Stream audit passed: 589 JSONL events, 1 `result` event (`is_error: false`), single model key `claude-opus-5-5` (`contextWindow: 1000000`), 0 stderr bytes, 29 read-only tool calls, 0 run-dir touches, and byte-identical pre/post `git status` and `git diff HEAD`.
- **Codex `0.171.0` (`gpt-6-astra`, `xhigh`)**: Not dispatched (single-lane repair verification per `multi-cli-review.md`; Codex also remained quota-limited until Nov 27 2:11 AM).

## Reports

### Claude Code 2.1.329 (claude-opus-5-5[1m], --effort max)

## Round 2 verdict on `024bc26`

No P0, P1 or P2 issues remain, so the four Round 1 repairs are clean to land. F25, F4 and the F0 partial-metadata path are fixed, and the new tests would fail on the old code. The F0 legacy fix closes the case Round 1 reported. Its leftover gaps (F27) are P3, because only entries saved by the never-pushed `b1c419f` build can reach them.

I read HEAD `fe250eb`; `git diff 024bc26 fe250eb` only touches `reviews/1_implementation.md`. I also read three r185.1's `AnimationMixer.js`. I did not run `npm run verify` or `check:studio`, so test pass results come from the Round 1 record.

### F25 (P1): fixed
- **Pose order:** `reapplyOriginalPose` now unbinds the clip first (`syncExternalPose()` at `src/studio/main.ts:157`) and sets the pose after (`:158-160`).
  - Unbinding resets the part to rest (`node_modules/three/src/animation/AnimationMixer.js:845-856` → `:182-185`). That reset now happens before the pose is written, not after.
  - `action` stays null (`src/studio/viewport.ts:416`), so later `place()` calls skip the `mixer.update(0)` that would overwrite the pose (`viewport.ts:197`).
  - The parts panel already worked in this order (`src/studio/inspector-bridge.ts:161-163`).
- **Reset:** it passes `carryPose = false` (`main.ts:418` → `:339`). Exports of originals read `originalController.getState().pose` (`main.ts:274-278`), so the hidden pose no longer gets exported.
- **Tests:**
  - With the old order the lid was already visually shut after the swatch, so closing it would not change the pixels and `scripts/check-capabilities.mjs:322-325` would fail.
  - The Reset check (`:327-330`) reads the controller value, which is what export uses.

### F4 (P2): fixed
- `firstClipSynthesized` is now computed before `setModel(model, refit, !firstClipSynthesized)` (`main.ts:139-141`).
  - `setModel` resets `clipIndex` and skips `bindClip(0)` (`viewport.ts:187,192`), so `atRest` exits early and doesn't write frame 0 (`viewport.ts:197`).
  - Play still binds the clip when pressed (`viewport.ts:421`), and binding at that point saves the posed state (`AnimationMixer.js:156-160`).
- `clips[0]` lines up with `model.animations[0]`, because `addCharacterAnimations` appends (`src/animation/library.ts:49`).
- **Tests:** the Fit pixel-equality check (`check-capabilities.mjs:281-284`) fails if the clip is bound. The identity-quaternion check on the exported `door` node (`:302-305`) would catch a return to `b1c419f`'s 80° bake.

### F0: P1 fixed; P2 fixed for the reported case
- **Partial metadata:**
  - A params 429, non-JSON response or throw sets `paramsFailed` (`src/data/polyfork-detail.ts:227-244`), and the record is then not cached (`:247-253`).
  - `openPolyforkGlb` fills missing `colorZones`/`presets`/`nightZones` from the saved snapshot (`src/imports/asset.ts:468-480`).
  - The snapshot stores unpainted base zones (`src/imports/library.ts:53-54`), which `buildPalette` needs to sort the fresh CDN GLB's colors into zones.
  - Tests: `capabilities.test.ts:349-367` checks the merge, and `detailCalls === 2` proves the record wasn't cached. `check-capabilities.mjs:245-256` reloads with detail 200 / params 429 and still restores `zone-paint`. Both would fail on `79c4333`.
- **Legacy entries without a snapshot, total outage:** `asset.ts:461` flags the outage, `:44-117` collects the unmatched fields, and `library.ts:60-69` merges them back on save.

### F26, F1, F2, F14, F17, F21, F22: fixed
| ID | Evidence |
|---|---|
| F26 | `afterEach` clears the backoff (`capabilities.test.ts:130-134`). That resets `retryAfter` (`src/data/polyfork.ts:41-48`), which `polyfork-detail.ts:214` checks. `:393` asserts the fetch really happened. |
| F1 | The legacy key now comes from a separate zone-less `openLocalGlb` (`capabilities.test.ts:229-232`), not from `legacyMap`. |
| F2 | The open `YawedLid` is asserted to equal Ry·Rx (`:268-272`). The old Euler code gives Rx·Ry and fails. |
| F14 | The planter is centred (`check-capabilities.mjs:37,62`). It is picked while visible (`:232`) and skipped once hidden (`:237-238`); the old `traverse` would still hit it. |
| F17 | Total cap of 32 at `schema.ts:390-397` (`maxDecals`, `:103`). |
| F21 | Cleanup (`schema.ts:403-411`) now covers the same depth `readCapabilities` searches (`:372-384`). An SDK controller on a group of several assets still clears their manifests (noted only). |
| F22 | The carry-over strips "the" and quotes the same way `findNamed` does (`import-prompt.ts:265-267` vs `:65`). |

## P3 findings (not blocking)

**F27 (new): edits kept during an outage survive only one save, and partial metadata isn't covered.**
- **(a) One save only:** saving during a total outage stores an empty snapshot, because `library.ts:49-57` doesn't check `metadataUnavailable`. On the next outage, that empty snapshot counts as metadata, so `metadataUnavailable` is false (`asset.ts:461`) and `intersectWithNodes` finds nothing (`:483`). The edits are dropped without being kept, and the next save deletes them for good.
- **(b) Partial metadata, no snapshot:** if detail returns 200 but params fail, the detail object still exists (`polyfork-detail.ts:245-254`), so `metadataUnavailable` is false. `zone-*` paint is dropped and the toast calls it "outdated" (`main.ts:225`).
- **(c) Reset doesn't clear them:** Reset (`main.ts:419-427`) and `setImportEdits` leave `preservedUnavailableEdits` in place, so `library.ts:61-68` puts the old edits back on the next save.
- No test covers `saveImport`'s merge.
- **Why P3:** only entries saved by `b1c419f` can reach these paths, and that build never left this machine.
  - `origin/main` is `18d5fe3`, `git branch -r --contains b1c419f` is empty, and Pages deploys only on push to main (`.github/workflows/pages.yml:3-5`).
  - Entries saved by the deployed `18d5fe3` build hold only name/tint/scale/proportion/paint (`18d5fe3:src/imports/asset.ts:7-13`). Their `vertex-*`/`material-*` paint keys still match when color zones are unavailable.
- **Fix:** skip the snapshot when `asset.metadataUnavailable` is set, and clear the kept edits on Reset.

**F28 (new):** `window.forgeStudio.applyRecipe` is the raw `host.applyRecipe` (`src/studio/agent-api.ts:61`, passed in at `main.ts:453`). It now quietly accepts a second `carryPose` argument, so `recipes.forEach(forgeStudio.applyRecipe)` drops the pose for index 0. Fix: wrap it as `input => applyRecipe(input)`.

**F22 leftovers:**
- The carry-over still lacks `findNamed`'s slug fallback (`import-prompt.ts:68-70`), so "and window box" won't match a part named `window-box`.
- The test replaced the bare "and lantern" case instead of adding a new one (`import-prompt.test.ts:84`), and quoted names are still untested.

**F24 (record error):**
- Both review tables say the owner's approval is recorded in `plan.md`, but `plan.md` was last changed in `b1c419f` and contains no approval.
- `plan.md:32` lists only the new `ImportEdits` fields, not the new saved `ImportEntry.capabilities` field.
- Before pushing (which deploys), confirm the approval with the owner per AGENTS.md:19 (R8) and correct the record.

## Blockers
No P0, P1 or P2 blockers remain in `79c4333..024bc26`, and the repairs are clean to land. F27, F28 and the F22 leftovers can be noted without another round. F24 is an owner confirmation to get before pushing, not a code fix.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F25 | P1 original pose carry-over order + Reset pose clearing | Verified fixed in `024bc26` | Closed |
| F4 | P2 re-imported posed GLB Fit snap-back + glTF door quaternion proof | Verified fixed in `024bc26` | Closed |
| F0 | P1 partial metadata fallback + P2 legacy outage preservation | Verified fixed in `024bc26` for reported paths | Closed (minor P3 follow-up noted under F27) |
| F26, F1, F2, F14, F17, F21, F22 | P3 test gaps and minor bounds/parsing | Verified fixed in `024bc26` | Closed (minor slug/test nit noted under F22) |
| F27 | New P3: `preservedUnavailableEdits` survives one outage save only, partial outage without snapshot skips preservation, Reset leaves `preservedUnavailableEdits` set (reachable only for never-pushed `b1c419f` entries) | Noted without another round per R10 (unreachable for live `18d5fe3` entries) | Optional small follow-up if touched later |
| F28 | New P3: `window.forgeStudio.applyRecipe` passes raw 2-arg `applyRecipe(input, carryPose)` | Noted without another round per R10 | Optional 1-line wrapper if touched later |
| F24 | Record correction: `0_implementation.md` and `1_implementation.md` prematurely stated owner approval was recorded in `plan.md`, and `plan.md` omitted `ImportEntry.capabilities` | Accepted — corrected `plan.md` to list all additive persistent-format fields and pausing before `git push origin main` (which deploys Pages) for explicit owner confirmation per R8 | Corrected in `docs/work/5_polyfork-parity/plan.md`; awaiting owner OK to push and deploy |

## Verification

- Code revision `024bc26597d694dec8c0b46e60363b1645ca2d93` passed `npm run verify` (14/14 test files, 85/85 tests, strict `tsc --noEmit`, zero-warning ESLint, Vite app + SDK builds) and `npm run check:studio` on Node `v25.2.1` (CI validates Node 24 on push).
- No source files were modified after `024bc26`.

## Round outcome

Zero P0, P1, or P2 blockers remain in `024bc26`; all material Round 0 and Round 1 findings are verified fixed. Ready to push to `origin/main` and verify live GitHub Pages once the owner confirms the additive IndexedDB persistent-format fields (`ImportEdits.{pose,hiddenParts,night,decalText}` and `ImportEntry.capabilities`) and live deploy per R8.
