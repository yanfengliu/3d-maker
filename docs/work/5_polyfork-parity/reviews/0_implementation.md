# Review 0: implementation

## Target

- Repository: `3d-maker`
- Commit: `b1c419f4fd5f4ce2822b4654fc2101aff5e2ae02` (diff `18d5fe3..b1c419f`)
- Scope: Client-side PolyFork feature parity, `extras.formFoundry` capability schema and Three.js controller, semantic color zones and colorways, viewport night/decal/eyedropper tools, GLB export and offline re-import, SDK exports, `window.forgeStudio`, AI tools, and tests.

## Reviewers and coverage

- **Claude Code `2.1.329` (`claude-opus-5-5[1m]`, `--effort max`)**: Ran read-only adversarial diff + codebase review from `../fleet/tmp/review-runs/3d-maker-5-round0` with `--tools "Read,Glob,Grep,Task,Bash"`, `--permission-mode dontAsk`, `--setting-sources=`, `--strict-mcp-config`, `--no-session-persistence`. Stream audit passed: 1029 JSONL events, 1 `result` event (`is_error: false`), single model key `claude-opus-5-5` (`contextWindow: 1000000`, `canonicalModel: "claude-opus-5-5"`), 0 stderr bytes, 62 read-only tool calls, 0 run-dir touches, and byte-identical pre/post `git status` and `git diff HEAD`.
- **Codex `0.171.0` (`gpt-6-astra`, `xhigh`)**: Abstention (unavailable through usage limit on pre-review probe: `ERROR: You’ve hit your usage limit... try again at Nov 27th, 2026 2:11 AM`).

## Reports

### Claude Code 2.1.329 (claude-opus-5-5[1m], --effort max)

I reviewed `b1c419f` against the milestone plan, `AGENTS.md` and `lessons.md` by reading code only: I changed no files and ran neither `npm run verify` nor `check:studio`. I found 2 P0, 5 P1, 8 P2 and 10 P3 issues. Two of the plan's acceptance criteria are not met: "changes persist across remix/save/reopen" and "exported GLBs survive re-import offline with all capabilities intact".

Citations outside the diff come from three r185's sources (`GLTFExporter.js`, `GLTFLoader.js`, `Euler.js`, `Quaternion.js`), `src/models/{parts,equipment,drone}.ts`, `src/data/{inventory,polyfork}.ts`, `src/ui/inspector.ts`, `src/imports/asset.test.ts`, `scripts/check-remixes.mjs` and `dataset/polyfork/free-assets.json`.

## P0: lost user edits

**P0-1 Saved PolyFork remixes lose their edits whenever PolyFork's metadata can't be fetched, and the next save makes the loss permanent.**
- **Evidence:**
  - `fetchPolyforkDetail` returns `null` on any failure: 429, non-JSON, the 10 s timeout, or offline (`polyfork-detail.ts:218,239`).
  - Capabilities are rebuilt from that result on every open (`asset.ts:341-348`), and nothing about them is saved.
  - `reconcileSavedEdits` then silently drops `pose`, `hiddenParts`, `night` and `decalText` (`asset.ts:44-65`).
  - Paint slot IDs depend on the network: `zone-*` slots exist only when the params file loads (`paint.ts:138-148`).
  - The toast covers paint only and calls the lost overrides "outdated" (`main.ts:207-209`).
  - The detail fetch neither respects nor updates the catalog's shared 429 backoff (`polyfork.ts:109-124`).
- **Repro:**
  1. Save a Village Shopfront remix with the door open, the planter hidden, night on, a BAKERY decal and the harbour-green colorway.
  2. Reload and make `/api/assets/*` return 429, time out, or go offline while the GLB is cached.
  3. Open it from Saved: every edit is gone.
  4. Change anything and save: the IndexedDB record is overwritten without those fields.
- **Fix:**
  - Store the resolved capabilities (or the raw detail and params JSON) in the saved entry and fall back to them when the fetch fails.
  - While metadata is missing, carry unvalidated saved fields through instead of dropping them.
  - Word the toast so it says metadata is unavailable rather than "outdated".

**P0-2 Upgrade regression: existing `vertex-*` repaints on PolyFork models are thrown away.**
- **Evidence:**
  - When color zones exist, every vertex-colored mesh is grouped into zones and the code returns before building vertex regions (`paint.ts:114,138-150`).
  - Saved `vertex-<g>-<hex>` keys then match no slot and are dropped (`asset.ts:36-42`).
  - 3,621 of the 3,645 free records in the local snapshot are flagged `remixable`. I'm assuming most of those have color parameters; I didn't check each one.
  - The remix browser check only uses local imports, so it can't catch this (`check-remixes.mjs:267-277`).
- **Fix:**
  - Map legacy `vertex-*` keys onto the zone that holds their vertices, or keep vertex regions as their own slots and add zones as group slots alongside them.
  - Add a reopen test with legacy keys.

## P1: high-severity bugs

**P1-1 Hinge math adds to Euler angle components, which goes wrong for nodes loaded from a GLB.**
- **Evidence:** the controller backs out and applies poses through `rotation[axis]` (`runtime.ts:271-276,297-305`). GLTFLoader derives Euler angles from quaternions, and for the default XYZ order `y = asin(m13)` stays within ±90° (`Euler.js:198-205`). This causes three failures:
  - **Round trip past 90°:** a drone rotor or the tower's `DishMount` (`models/capabilities.ts:18,36`) exported at 120° re-imports as (π, 60°, π). The backed-out rest becomes Ry(240°) and the slider runs backwards.
  - **Rest yaw beyond ±90°:** a node turned around at rest (for example 180°) swings the opposite way from its baked clip, which multiplies quaternions instead (`runtime.ts:249-253`).
  - **Yawed x-hinges:** an x-axis hinge on a yawed node rotates about its parent's X axis instead of its own.
- **Fix:**
  - Use quaternions throughout: pose = `restQ · axisAngle(axis, v)`, and rest = `q · axisAngle(axis, −pose)`. Optionally write rest transforms into the manifest.
  - Add tests for y at 120° and 200° and for a node with a 180° rest yaw.

**P1-2 Hidden detachable parts are deleted from the exported GLB, but the manifest still lists them.**
- **Evidence:**
  - Export copies node visibility (`export.ts:32`) and uses `onlyVisible: true` (`main.ts:271`), and the exporter skips invisible children (`GLTFExporter.js:2530`).
  - On re-import the missing part is filtered out (`asset.ts:259-260`), so it can never be shown again.
  - In the SDK, `inspectAsset` still lists `planter`, but `setVisible('planter', true)` throws (`runtime.ts:286-289,398-400`).
  - `check-capabilities.mjs` exports with the planter hidden but never checks detachable parts after re-import. This contradicts `llms.txt:10`.
- **Fix:**
  - Export detachable subtrees and let `state.hiddenParts` hide them on load, or use `KHR_node_visibility`.
  - Assert detachable parts after re-import in the browser check.

**P1-3 Clips that animate rigged parts fight the pose, and export can bake a position that contradicts `state.pose`.**
- **Evidence:**
  - The viewport's `atRest` stops the clip, which restores the node transforms saved when the clip started, then replays it (`viewport.ts:218-231`). Export runs inside it (`viewport.ts:474-484`, `main.ts:252`).
  - All four rigged originals autoplay clips that move the same nodes (`equipment.ts:94-95`, `drone.ts:140-145`).
  - The export dialog bakes part clips by default when a model has none (`dialogs.ts:241`), so every such re-import hits this.
- **Repro:**
  1. Export the shopfront with the door open, keeping the default clip option.
  2. Import it; "Open door" autoplays.
  3. Click Close, then export again. The GLB stores the door at 80° while `state` says it is closed.
  4. Re-import: "closed" is now 80° and Open goes to 160°.
  
  Separately, Frame or Height changes snap posed parts back to the clip.
- **Fix:**
  - In `cloneForExport`, reapply each part's rest plus value from the controller after cloning.
  - Restart the mixer's saved state after controller writes, or pause clips that move rigged nodes while posing.
  - Set `clips[].synthesized` and don't autoplay synthesized clips.

**P1-4 On originals, the parts panel drives a discarded model after any property edit.**
- **Evidence:**
  - The recipe branch of `edit()` replaces the controller and model without re-rendering the panel (`main.ts:154-159`).
  - The panel's callbacks keep the controller they captured at render time (`inspector-bridge.ts:146-170`).
  - Original poses are never saved, because `saveAsset` stores only the recipe (`inventory.ts:36-40`).
- **Repro:** on Cargo Pod, open the lid, then click a color swatch. The lid snaps shut, the panel still shows −72°, and the slider and Open/Close no longer move the model. `forgeStudio.listParts()` disagrees with the panel.
- **Fix:**
  - Look up `host.getController()` inside each action, carry the previous pose onto the rebuilt model, and refresh the panel.
  - Either save original poses or document that they aren't kept.

**P1-5 The parts panel's click handler from a model without clips leaks into later models.**
- **Evidence:** for models without clips, `onclick` is attached to the shared `#animationBody` panel (`model-parts.ts:160-164,127-147`). Neither `showAnimation` (`inspector.ts:112-123`) nor the early return in `showRiggedParts` (`model-parts.ts:157`) clears it.
- **Repro:** open Village Shopfront, then Cargo Pod, and click Open in the parts drawer.
  - The old handler also runs and throws "This model has no rigged part named CaseLid".
  - When two models share a part name, Test cancels itself and the rows show the old model's values.
  - The old handler also keeps the previous model in memory.
- **Fix:** attach handlers only to a fresh child element, or reset `panel.onclick`.

## P2: medium

- **The Test preview overrides other edits.**
  - It stops only on model swap and Reset (`main.ts:127,394`), and it rewrites `edits.pose` every frame (`model-parts.ts:92-117`, `inspector-bridge.ts:149-155`, `main.ts:61-68`).
  - While it runs, AI tools, agent API calls, JSON edits and saves get overwritten, and the AI tools dialog rejects every edit as "changed" (`dialogs.ts:225`).
  - Fix: stop it in `setImportEdits`, the agent API's pose calls, when a dialog opens, and on save.
- **Night glow lights up most dark colors.**
  - Matching uses a fixed 0.03 tolerance in linear color space (`runtime.ts:105-107,131-135`). For the pane color `#34322d` that covers roughly sRGB 14–72 per channel, so ironwork and trim glow too.
  - Albedo sync overwrites PolyFork's albedo with the params default (`asset.ts:158-162`).
  - Repainted zones keep their tone variation (`paint.ts:252-255`), so their glow no longer matches after re-import.
  - Fix: compare in sRGB with a tight tolerance, or reuse the color-zone membership.
- **Color zones grab unrelated colors and go stale on export.**
  - Every vertex joins its nearest zone with no distance limit (`paint.ts:78-102`), so a zone repaint or colorway also recolors unrelated parts.
  - Exported `colorZones` keep their default colors (`export.ts:54-67`).
  - The repo's own fixture shows it: after harbour-green (`#47582c`) and a re-import, the door's nearest zone is the pane. The `zone-paint` slot disappears and the colorway chips stop working.
  - Fix: add a distance threshold or an "Other" group, and export current zone colors or per-vertex zone IDs.
- **Baked clips for ranges of 180° or more don't move.**
  - Each clip interpolates a single rest-to-end quaternion (`runtime.ts:253-256`), and three takes the shortest arc (`Quaternion.js:72-85`), so the 360° rotor, wheel and dish clips are no-ops.
  - The repo's own `spinTrack` already samples at least 8 keys per turn (`parts.ts:139-143`); do the same here.
- **The SDK and manifest don't match the documented contract.**
  - `parseCapabilities` never reads `clips` (it appears only in the type at `schema.ts:94`; parser at `:240-311`).
  - GLTFLoader puts clips on `gltf.animations`, not on the scene (`GLTFLoader.js:2672`), so `inspectAsset(gltf.scene)` never reports clips.
  - `synthesized` is never set.
  - `dimensions` ignores scale and height edits (`asset.ts:187-192`, `polyfork-detail.ts:270`).
  - `llms.txt:7` says the manifest is on `gltf.scene.userData`, but node extras land on the root child (`GLTFLoader.js:4368`).
- **Opening a model can stall for up to about 18 s.**
  - The detail fetch is awaited after the GLB arrives (`asset.ts:341`), with 10 s and 8 s timeouts run one after the other (`polyfork-detail.ts:215,223`).
  - It also hides the GLB 429-retry unit test: the detail request consumes the mocked 429, so the GLB loop only sees 503 then 200 (`asset.test.ts:142-155`).
  - Fix: cap the wait and apply capabilities when they arrive, and route test mocks by URL.
- **AI tools on originals list parts they can't operate.**
  - The dialog shows an original's rigged parts (`dialogs.ts:145,156`), but prompts and JSON for originals go through the recipe editor (`dialogs.ts:172,218`).
  - So "open case lid" fails.
- **The eyedropper picks hidden parts.** `traverse` skips the hidden node but still collects its child meshes (`viewport.ts:155-158`). Use `traverseVisible`.

## P3: minor

- Decal orientation breaks when `up` is parallel to `normal` or a vector is zero (`runtime.ts:211-216`), and `parseDecalSlots` doesn't reject these (`schema.ts:125-130`).
- Every edit forces decal previews on when decal text exists and rebuilds their canvas textures (`asset.ts:181-185`), even while dragging sliders.
- Parsers don't remove duplicate names or cap counts and lengths in untrusted data (`schema.ts:144-181`), which leads to duplicate panel rows and large night-glow scans on hostile GLBs.
- For ranges that exclude 0, the constructor clamps the initial value but `resetParts` writes a raw 0 (`runtime.ts:272,388-392`).
- The new case-insensitive flag in `validatePaint` accepts upper-case vertex and material IDs that can never match a slot (`paint.ts:169`).
- Open/Close on 0–360° rotors toggles between identical-looking poses (`runtime.ts:381-387`).
- Re-exporting a re-imported GLB keeps stale nested manifests (`schema.ts:315-327`).
- "hide planter and lantern" splits into an invalid second clause (`commands.ts:66-69`).
- `llms.txt:11` calls the albedo "sRGB in COLOR_0", but COLOR_0 is linear.
- Process: AGENTS.md R8 asks for owner sign-off on persistent-format changes (IndexedDB `ImportEdits` and GLB extras), and the plan doesn't record it.

## Missing tests

Nothing currently covers:
- the eyedropper or `pickPaintSlot`
- the decal toggle
- the Test button
- detachable parts after re-import
- y-axis rotation past 90° and nodes with a non-zero rest rotation
- reopening a saved model when metadata fails
- legacy `vertex-*` paint after upgrade
- the parts panel after an original is edited
- switching between models with and without clips
- clips with ranges of 180° or more

Add these to `capabilities.test.ts` and `check-capabilities.mjs` alongside the fixes.

## Checked and fine

- The new UI escapes all untrusted strings (`dom.ts:8-13`), and toasts use `textContent` (`dom.ts:15-26`).
- Colors are validated as hex before they're used in styles.
- The params URL is limited to PolyFork's `/cdn/` path, and asset IDs are regex-checked (`polyfork-detail.ts:210,221`).
- I found no prototype-pollution path.
- Overlays are stripped from exports, and controllers are disposed on every model switch.

I couldn't check the live PolyFork detail response format. The local snapshot only has the listing record (`free-assets.json:888-923`), which has no `rigged_parts` or `night` fields.

### Codex 0.171.0 (gpt-6-astra, xhigh)

Abstained: unavailable through account usage limit at review time (`try again at Nov 27th, 2026 2:11 AM`).

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F0 | P0-1 Saved PolyFork remixes lose edits when PolyFork metadata fetch fails, and next save makes loss permanent | Accepted — real data-loss bug on offline/429 reopen | Fixed in `79c4333`: cached capability snapshot stored on `ImportEntry` in `src/imports/library.ts`, passed as fallback in `openPolyforkGlb`, shared 429 backoff in `src/data/polyfork-detail.ts`, updated toast wording in `src/studio/main.ts`; tested in `capabilities.test.ts` and `check-capabilities.mjs` (Round 1 check) |
| F1 | P0-2 Upgrade regression drops legacy `vertex-*` repaints on PolyFork models once color zones exist | Accepted — real upgrade regression for pre-existing saved PolyFork remixes | Fixed in `79c4333`: `buildPalette` records `legacyMap` mapping `vertex-<idx>-<hex>` to `zone-<name>` and `reconcileSavedEdits` migrates legacy keys; tested in `capabilities.test.ts` (Round 1 check) |
| F2 | P1-1 Euler hinge math fails past ±90° Y, on 180° rest yaw, and on yawed X-hinges | Accepted — real Three.js Euler gimbal/asin clamping defect | Fixed in `79c4333`: `src/capabilities/runtime.ts` switched to quaternion math (`restQ * axisAngle`, backed out via `q * axisAngle(-pose)`); tested at 120°, 200°, 180° rest yaw, and yawed X-hinge in `capabilities.test.ts` (Round 1 check) |
| F3 | P1-2 Hidden detachable parts are deleted from exported GLB by `onlyVisible: true` while manifest still lists them | Accepted — breaks re-import and SDK `setVisible(name, true)` | Fixed in `79c4333`: `cloneForExport` keeps declared detachable subtrees visible in the export clone while `state.hiddenParts` hides them on load; tested in `capabilities.test.ts` and `check-capabilities.mjs` (Round 1 check) |
| F4 | P1-3 Clips animating rigged parts fight poses and can bake stale transforms on export | Accepted — real `PropertyMixer` snap-back race | Fixed in `79c4333`: added `Viewport.syncExternalPose()`, `controller.applyPoseToClone(root)` in `cloneForExport`, `synthesized: true` clip tagging, and skipped autoplay on synthesized clip 0; tested in `check-capabilities.mjs` (Round 1 check) |
| F5 | P1-4 On originals, parts panel drives discarded controller after property edit | Accepted — real stale-closure bug in `inspector-bridge.ts` | Fixed in `79c4333`: dynamic `host.getController()` lookups, preserved original pose across `edit()`/`applyRecipe()` rebuilds, documented recipe-only save semantics in `docs/design/spec.md`; tested on Cargo Pod in `check-capabilities.mjs` (Round 1 check) |
| F6 | P1-5 Parts panel `onclick` on `#animationBody` leaks into later models | Accepted — real listener leak across model switches | Fixed in `79c4333`: `showRiggedParts` mounts controls inside a fresh child `.rig-parts-wrap` element; tested switching 0-clip Shopfront -> Cargo Pod in `check-capabilities.mjs` (Round 1 check) |
| F7 | P2-1 Test preview loop overwrites AI tools, agent API, JSON edits, and saves | Accepted — real interference from uncanceled RAF loop | Fixed in `79c4333`: `stopPartPreviewAnimation()` called in `save()`, `setImportEdits()`, `agent-api.ts` `posePart`, and `dialogs.ts` `open()`, resetting `Test` button state; tested in `check-capabilities.mjs` (Round 1 check) |
| F8 | P2-2 Night glow linear 0.03 tolerance lights up dark ironwork/trim and overwrites PolyFork albedo | Accepted — real false-positive glow in dark linear space | Fixed in `79c4333`: switched `src/capabilities/overlays.ts` to sRGB matching (`0.045` tolerance), kept upstream albedo unless explicitly overridden, and refreshed overlays on repaint; verified via unit test and visual inspection on `Village Shopfront` (Round 1 check) |
| F9 | P2-3 Color zones hijack unrelated colors with no distance limit and export stale default colors | Accepted — real re-import breakage after colorway repaint | Fixed in `79c4333`: added weighted sRGB distance cap (`maxZoneDistSq = 0.28`) with unmatched discrete `vertex-*` fallback and synced exported `colorZones` to current painted colors; tested in `capabilities.test.ts` and `check-capabilities.mjs` (Round 1 check) |
| F10 | P2-4 Baked clips for ranges >= 180° do not move due to shortest-arc SLERP | Accepted — real no-op on 360° rotors/dishes | Fixed in `79c4333`: `synthesizeRigClips` samples multi-step keyframes (<= 45° steps; 8-step full turn for >= 359°); tested in `capabilities.test.ts` (Round 1 check) |
| F11 | P2-5 SDK and manifest contract gaps (`clips` parser, `inspectAsset(gltf.scene, animations)`, scaled `dimensions`, `llms.txt` path) | Accepted — real contract mismatch | Fixed in `79c4333`: `parseCapabilities` parses `clips`, `inspectAsset(root, animations?)` accepts external clips, `applyImportEdits` scales `dimensions`, `public/llms.txt` corrected; tested in `capabilities.test.ts` (Round 1 check) |
| F12 | P2-6 Opening a PolyFork model can stall up to ~18 s on sequential metadata timeouts, and GLB 429 test is shadowed | Accepted — real latency and test masking issue | Fixed in `79c4333`: shortened detail/params timeouts (4 s / 3 s), capped post-GLB wait to 2.5 s, routed `asset.test.ts` fetch mock by URL (Round 1 check) |
| F13 | P2-7 AI tools on originals list rigged parts that recipe prompts cannot operate | Accepted — misleading UI reference | Fixed in `79c4333`: `dialogs.ts` passes capability reference only for imported models; tested on Cargo Pod in `check-capabilities.mjs` (Round 1 check) |
| F14 | P2-8 Eyedropper picks hidden detachable parts via `traverse` | Accepted — real picking bug | Fixed in `79c4333`: switched `viewport.ts` picking to `traverseVisible`; tested in `check-capabilities.mjs` (Round 1 check) |
| F15 | P3-1 Degenerate/collinear decal vectors not rejected | Accepted | Fixed in `79c4333`: `validDecalBasis` check in `schema.ts` and tangent fallback in `overlays.ts` |
| F16 | P3-2 Non-decal edits force decal previews on and rebuild canvases | Accepted | Fixed in `79c4333`: `applyImportEdits` updates decal overlays only when `decalText` changes |
| F17 | P3-3 Parsers do not deduplicate names or bound untrusted counts/lengths | Accepted | Fixed in `79c4333`: added dedup sets and array/string bounds in `schema.ts` |
| F18 | P3-4 `resetParts` writes raw `0` for ranges excluding `0` | Accepted | Fixed in `79c4333`: `resetParts` and `closePart` clamp `0` to part range |
| F19 | P3-5 `validatePaint` case-insensitive flag accepts uppercase `vertex-`/`material-` IDs | Accepted | Fixed in `79c4333`: restricted `material-`/`vertex-` prefix and hex to lowercase in `paint.ts` |
| F20 | P3-6 `togglePart` on 0–360° toggles between visually identical 0° and 360° | Accepted | Fixed in `79c4333`: toggles `0 ↔ 180°` when `Math.abs(far) >= 359` |
| F21 | P3-7 Re-exporting re-imported GLB retains stale nested `formFoundry` copies | Accepted | Fixed in `79c4333`: `writeCapabilities` deletes descendant `userData.formFoundry` before writing root |
| F22 | P3-8 `hide planter and lantern` fails after `and` clause split | Accepted | Fixed in `79c4333`: `editImportWithPrompt` carries forward active `hide`/`show` verb for bare detachable-part clauses; tested in `import-prompt.test.ts` |
| F23 | P3-9 `llms.txt` calls `COLOR_0` sRGB instead of linear | Accepted | Fixed in `79c4333`: clarified linear `COLOR_0` vs sRGB `albedo` hex in `public/llms.txt` |
| F24 | P3-10 Process note: record persistent format approval in plan | Accepted — additive optional fields on IndexedDB v1 entries and owner-approved `extras.formFoundry` | Recorded explicitly in `docs/work/5_polyfork-parity/plan.md` (owner approved GLB `extras.formFoundry` via prompt choice and requested saved parity persistence; optional fields remain backward-compatible with v1 IndexedDB entries) |

## Verification

- Post-repair verification against `79c4333` (Node `v25.2.1` locally; CI validates Node 24):
  - `npm run verify`: 14/14 Vitest test files (85/85 tests), strict `tsc --noEmit`, zero-warning ESLint, Vite app + SDK builds all passed.
  - `npm run check:studio`: desktop Chrome full suite passed including all new regressions in `scripts/check-capabilities.mjs`.
  - Real-model visual check on `Village Shopfront` (`output/studio/shopfront-night-srgb.png`): confirmed warm amber glow on panes + lantern only (dark iron lantern bracket and roof cap unlit), Harbour green joinery repaint isolated from walls/pot/display, and hinged door open 80°.

## Round outcome

All 2 P0, 5 P1, 8 P2, and 10 P3 findings were accepted and fixed in `79c4333`, verified with unit tests, desktop Chrome regressions, and real-model visual inspection. Round 1 repair verification review is required against `b1c419f..79c4333` before marking the work unit complete.
