# Review 1: implementation

## Target

- Repository: `3d-maker`
- Commit: `79c433313090e8c47f4c439418a2e9099c36a69f` (repair diff `b1c419f..79c4333`)
- Scope: Repair verification of Round 0 findings `F0`–`F24` and their unit/browser tests.

## Reviewers and coverage

- **Claude Code `2.1.329` (`claude-opus-5-5[1m]`, `--effort max`)**: Ran read-only repair verification from `../fleet/tmp/review-runs/3d-maker-5-round1` with `--tools "Read,Glob,Grep,Task,Bash"`, `--permission-mode dontAsk`, `--setting-sources=`, `--strict-mcp-config`, `--no-session-persistence`. Stream audit passed: 1055 JSONL events, 1 `result` event (`is_error: false`), single model key `claude-opus-5-5` (`contextWindow: 1000000`), 0 stderr bytes, 54 read-only tool calls, 0 run-dir touches, and byte-identical pre/post `git status` and `git diff HEAD`.
- **Codex `0.171.0` (`gpt-6-astra`, `xhigh`)**: Not dispatched (single-lane repair verification per `multi-cli-review.md`; Codex also remained quota-limited until Nov 27 2:11 AM).

## Reports

### Claude Code 2.1.329 (claude-opus-5-5[1m], --effort max)

I read the repair at `79c4333` without changing anything (HEAD `283cd37` only adds the review doc). I also read the three.js r185.1 sources it depends on. I didn't run `npm run verify`, `check:studio` or the unit tests: shell access was denied partway through, so everything below comes from reading code.

**Verdict:** not clean. Two P1 issues remain: a new defect in the F5 repair (F25) and a remaining F0 data-loss path. There are also two P2s and several P3 test gaps. The other repairs check out (F5's stale-controller half works too).

## Remaining and new issues

### F25 (new, P1): a carried pose on originals is undone straight away, so F5 still reproduces
- **Cause:** `reapplyOriginalPose` sets the pose first and then calls `stage.syncExternalPose()` (`src/studio/main.ts:154-160`). It runs after every rebuild: `edit()` (`main.ts:171`), `applyRecipe()` (`:343`) and Reset (`:414-416`).
- **Why that undoes it:**
  - `syncExternalPose` calls `mixer.uncacheAction` (`src/studio/viewport.ts:413`).
  - In three r185 that runs `_deactivateAction` → `restoreOriginalState()` (`node_modules/three/src/animation/AnimationMixer.js:845-856`, `:171-195`), which writes the saved transform back onto the node (`PropertyMixer.js:279-284`).
  - The saved transform is the rest pose, because `swap(built, false)` re-binds the clip on the fresh model (`main.ts:139-148`), and binding saves state at that moment (`AnimationMixer.js:156-160`).
- **Repro (Cargo Pod, the original F5 case):** open the lid, then click a swatch.
  - The "Open case" clip drives `CaseLid` (`src/models/equipment.ts:94-96`), so the lid snaps shut.
  - The panel, `listParts()` and the export (`main.ts:271-276`) still say −72°. The user sees a closed lid and downloads an open one.
  - The same happens to the drone rotors and camera under "Hover" (`src/models/drone.ts:140-146`), and to the rover wheels and tower dish.
- **Regression:** Reset on an original now keeps a hidden pose that gets exported. Before the repair, `applyRecipe` cleared it.
- **Test gap:** `scripts/check-capabilities.mjs:301-306` only checks the controller value, so it passes over this.
- **Fix:**
  - Call `syncExternalPose()` before applying the pose.
  - Don't carry the pose on Reset.
  - Assert the `CaseLid` node rotation after the swatch click.

### F0 (remaining, P1): a partial metadata fetch skips the cached snapshot and drops colorway paint
- **Cause:**
  - If the colorway/params request fails (429, the 3 s timeout, or non-JSON), `fetchPolyforkDetail` ignores the failure (`src/data/polyfork-detail.ts:227-237`).
  - It then caches the incomplete record for 15 minutes (`:238-244`). Color zones, presets and fallback night zones come only from that request (`:199-202`, `:275-276`).
  - Because the record isn't null, `openPolyforkGlb` uses it and ignores the saved snapshot (`src/imports/asset.ts:444-448`).
- **Result:**
  - With no zones, saved `zone-*` paint is dropped (`asset.ts:52-57`), and the toast calls it "outdated" (`main.ts:223`).
  - The next save stores a snapshot without the zones (`src/imports/library.ts:49-57`), so the loss becomes permanent.
- **Test gap:** the browser check fails the detail and params requests together (`check-capabilities.mjs:154-159`), so this path is never exercised.
- **Fix:** don't cache incomplete records, and fill missing zones, presets and night zones from the snapshot.

### F0 (remaining, P2): saved entries without a snapshot still lose edits
- Entries saved by the `b1c419f` build have no snapshot (`library.ts:117`).
- If metadata is unavailable, or arrives more than 2.5 s after the GLB (`asset.ts:433-438`), saved pose, hidden parts, night, decal and zone-paint edits are dropped (`asset.ts:43-94`). Nothing blocks a save that would make that permanent.
- Round 0's "carry unvalidated saved fields through" was not done.

### F4 (remaining, P2): a re-imported posed GLB snaps to its clip on Fit, Scale or Height
- A synthesized clip skips autoplay (`main.ts:140-141`) but stays bound and paused at the start (`viewport.ts:191`).
- `place()` calls `atRest()`, which ends with `mixer.update(0)` (`viewport.ts:195-212`, `:306-310`). That writes the clip's first frame, the rest pose (`src/capabilities/runtime.ts:155-173`), over the posed door.
- Triggers: `main.ts:175`, `:362`, `:435`.
- The viewport shows the door closed while state and panel say 80°. The export is still correct (`src/studio/export.ts:55-57`).
- **Test gap (P3):** the "must bake 0°" check only asserts `state.pose === undefined` (`check-capabilities.mjs:286-292`). The pre-repair code passed that too while baking 80°. It should read the `door` node's rotation.

### F26 (new, P3): one unit test is masked by leftover rate-limit state
- The 429 test sets the shared module-level backoff, 2 s on the first hit (`capabilities.test.ts:310-315`; `src/data/polyfork.ts:24,46-54,91`).
- `afterEach` doesn't reset it (`capabilities.test.ts:129-132`).
- So the next test's fetch returns null at the rate-limit check (`polyfork-detail.ts:214`) without ever reaching the non-JSON mock. `:341-344` passes without testing what it claims.
- **Fix:** call `clearPolyforkBackoff()` in `afterEach` and assert `fetch` was called.

### P3: fixes look right, but the tests don't prove them
- **F1:** the test takes its legacy key from the very map it is testing (`capabilities.test.ts:227-234`), so it can't catch a wrong key format.
- **F2:** the yawed X-hinge is only checked when closed (`:263,272,275`), and the old Euler code also returns to that state. The open orientation needs asserting.
- **F14:** the check clicks the viewport centre (`check-capabilities.mjs:229-233`), but the hidden planter sits at the bottom left (`:62`). The old picking code would pass too.

### Other P3
- The toast counts pose, part, night and decal drops (`asset.ts:67,75,82,89`) as "color override(s)" (`main.ts:223`).
- **F22:** "hide planter and the lantern" and quoted names still fail, because the carry-over compares raw text (`import-prompt.ts:265-266`). The name lookup already strips "the" and quotes (`:50-52,64-67`).
- **F17:** decals are capped per node but not in total (`schema.ts:387-398`).
- **F19:** zone IDs are limited to 64 characters from `[a-zA-Z0-9_-]` (`paint.ts:223`). PolyFork keys are unrestricted (`polyfork-detail.ts:64-76`), and the schema allows 80 characters (`schema.ts:106`). This predates the repair.
- **F12:** metadata that arrives after the 2.5 s cap is never applied, and a fresh open shows no notice (`asset.ts:433-438`, `main.ts:220`).
- **F21:** `writeCapabilities` deletes every nested manifest under the controller root (`schema.ts:401-405`). That would wipe the manifests of other assets if an SDK user wraps several in one group.
- **F24:** `plan.md` has no recorded owner approval (`plan.md:32` lists only the `ImportEdits` fields). It also doesn't mention the new persisted `ImportEntry.capabilities` field (`library.ts:12-13`), which AGENTS.md:19 says needs approval.

## Repairs verified clean
| ID | Evidence |
|---|---|
| F1 | `paint.ts:126-138,184-190` builds keys the same way as `:204-212`; `asset.ts:51-58` migrates them |
| F2 | quaternion maths at `runtime.ts:186-198,212-223`; test `capabilities.test.ts:245-276` catches the 120°, 200° and 180°-rest-yaw cases |
| F3 | `export.ts:59-66` keeps hidden parts in the export (`GLTFExporter.js:2530`); tests at `capabilities.test.ts:199,210-212` and `check-capabilities.mjs:276-278` |
| F5 (half) | each panel action looks up the current controller (`inspector-bridge.ts:146-178`); the pose carry-over is broken by F25 |
| F6 | `model-parts.ts:166-174`; a leak would raise a page error (`check-capabilities.mjs:294-306,326`) |
| F7 | `main.ts:228,355`, `agent-api.ts:48`, `dialogs.ts:85`; test `check-capabilities.mjs:209-223` |
| F8 | `overlays.ts:15-27,57-62`, `asset.ts:204-214`; test `capabilities.test.ts:324-336` fails under the old tolerance |
| F9 | `paint.ts:39,103-119,191-199`, `asset.ts:195-203`; tests `capabilities.test.ts:204,319-322`, `check-capabilities.mjs:279-281` |
| F10 | `runtime.ts:165-174`; test `capabilities.test.ts:277-282` |
| F11 | `schema.ts:280-292,343-344`, `runtime.ts:91-130`, `asset.ts:243-254`; `llms.txt:7`'s `nodes[0]` is right, since the exporter writes the parent node first (`GLTFExporter.js:2519`) |
| F12 | `polyfork-detail.ts:217,229`, `asset.ts:380,433-436`; test `asset.test.ts:146-157` |
| F13 | `dialogs.ts:158`; `check-capabilities.mjs:307-308` |
| F14 | `viewport.ts:141` (code only; see the test gap above) |
| F15, F16 | `schema.ts:115-123,159`, `overlays.ts:137-149`; `asset.ts:191-192,233-239,365-367` |
| F17–F21, F23 | `schema.ts:100-113`; `runtime.ts:305-325`; `paint.ts:223`; `runtime.ts:310-318` (test `:285`); `schema.ts:401-406`; `llms.txt:11` |
| F22 | `import-prompt.ts:258-272`; test `import-prompt.test.ts:84-85` |

**Blockers:** F25 and the F0 partial-metadata path should be fixed before the unit is marked complete, with tests that check actual node transforms rather than controller values. The two P2s can follow, and the P3s can be noted without another round.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F25 | New P1: `reapplyOriginalPose` called `stage.syncExternalPose()` after posing, causing `uncacheAction` to restore rest state on originals; Reset also carried the pose | Accepted — real Three.js r185 `PropertyMixer.restoreOriginalState()` regression | Fixed in `024bc26`: call `stage.syncExternalPose()` before applying pose, clear pose on Reset (`applyRecipe(row.recipe, false)`), and assert actual WebGL canvas change on Cargo Pod after swatch edit + Reset in `scripts/check-capabilities.mjs` (Round 2 check) |
| F0 | Remaining P1 (partial metadata) & P2 (legacy entry without snapshot): failed `-params.json` cached an incomplete detail and skipped `fallbackCapabilities`; entries without snapshot lost edits on save | Accepted — real data-loss paths on partial or legacy outage | Fixed in `024bc26`: `fetchPolyforkDetail` does not cache when `paramsFailed`, `openPolyforkGlb` merges missing `colorZones`/`presets`/`nightZones` from `fallbackCapabilities`, and `reconcileSavedEdits`/`saveImport` preserve `preservedUnavailableEdits` under `metadataUnavailable`; tested in `capabilities.test.ts` and `check-capabilities.mjs` (Round 2 check) |
| F4 | Remaining P2: re-imported posed GLB kept synthesized clip 0 bound at t=0, snapping open door to rest on Fit/Scale/Height; export test checked `state.pose` not node rotation | Accepted — real viewport snap-back and weak assertion | Fixed in `024bc26`: `Viewport.setModel(model, refit, autoBind)` skips `bindClip(0)` when clip 0 is synthesized; `check-capabilities.mjs` checks Fit keeps rendered pixels and asserts exported `door` node quaternion is identity (Round 2 check) |
| F26 | New P3: `capabilities.test.ts` left shared 429 backoff active, masking the non-JSON test | Accepted — real test isolation bug | Fixed in `024bc26`: `clearPolyforkBackoff()` in `afterEach` and `expect(fetcher).toHaveBeenCalledTimes(1)` |
| F1/F2/F14 test gaps | P3: legacy key taken from map under test, yawed X-hinge only checked closed, hidden planter not at clicked viewport center | Accepted — strengthened all three proofs | Fixed in `024bc26`: independent `openLocalGlb` key derivation, open `YawedLid` quaternion assertion `Ry(90°)*Rx(90°)`, and centered planter picked before/after hiding in `check-capabilities.mjs` |
| F17/F21/F22/toast | P3: total embedded decal cap, depth-bounded `writeCapabilities` cleanup, `unquote` in multi-part carry-over, generic non-paint toast wording | Accepted | Fixed in `024bc26`: `maxDecals` cap in `readEmbeddedDecals`, depth<=2 cleanup in `writeCapabilities`, `unquote()` in `import-prompt.ts`, and `saved edit(s)` toast wording |
| F12/F19/F24 | P3: post-2.5s late metadata arrival, 64-char paint key regex vs 80-char schema, and recording IndexedDB/extras persistence approval in `plan.md` | Noted — F12/F19 minor; F24 documented in `plan.md` and flagged to owner in final summary (additive optional fields, backward-compatible with v1 IndexedDB) | Recorded in `plan.md` |

## Verification

- Verified against `024bc26597d694dec8c0b46e60363b1645ca2d93` (Node `v25.2.1` locally; CI validates Node 24):
  - `npm run verify`: 14/14 Vitest test files (85/85 tests), strict `tsc --noEmit`, zero-warning ESLint, Vite app + SDK builds all passed.
  - `npm run check:studio`: full desktop Chrome suite passed including pixel assertions for Cargo Pod F25, Fit stability for F4, centered visible/hidden planter eyedropper for F14, partial-metadata 429 reload for F0, and glTF `door` quaternion assertion on second export.

## Round outcome

Round 1 verified 19 Round 0 repairs clean and identified two P1 defects (`F25` and `F0` partial-metadata), two P2s (`F0` legacy preservation and `F4` Fit snap), and several P3 test/edge gaps. All P1/P2 findings and P3 test gaps were repaired in `024bc26`; proceeding to a focused Round 2 verification of `79c4333..024bc26`.
