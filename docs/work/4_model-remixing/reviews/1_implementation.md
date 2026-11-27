# Review 1: implementation

## Target

Repository `3d-maker`, exact commit `064772e` compared against deployed baseline `4e27aa7` (full model remixing, individual paint slots, static paint redraw, AI tools for imports, low-pose clip preview framing, and browser regressions).

## Reviewers and coverage

- **Claude Opus 5.5 (`claude-opus-5-5[1m]`, `--effort max`, Claude Code 2.1.329):** Full read-only static review of `064772e` against `4e27aa7` across all changed files and three.js r185 internals (53 tool calls, `permissionMode: dontAsk`, `mcp_servers: []`, `modelUsage: ["claude-opus-5-5"]` with 1M context window, zero stderr, zero workspace modifications).
- **Codex (`gpt-6-astra`, `xhigh`):** Abstained due to account usage limit (`You’ve hit your usage limit`, exit 1 before completing review). Per the review runbook, `gpt-6-sol` was not substituted for an account quota exhaustion.

## Reports

### Codex (gpt-6-astra)

Abstained: Codex CLI 0.171.0 exited with code 1 after reporting account usage quota exhaustion (`ERROR: You’ve hit your usage limit`).

### Claude Opus 5.5

**Verdict:** One P1 framing regression, four P2s and a few nits. Prior finding F0 is fixed. I found no data-loss path in remix or save.

This was a static review of `064772e` against `4e27aa7`. I read the four required docs, every changed source file, and the relevant three.js r185 internals. I did not run `npm run verify` or `check:studio`, because my command to make a scratch copy was denied. No repository files were modified, and I used no subagents because the scope was tightly coupled.

## Findings

**[P1] Clip framing drops the floor below rigid models that have rotating parts; the Field Rover floats when opened**
- **Where the mismatch comes from:**
  - During clip sampling, non-skinned meshes contribute their local bounding box transformed to world space, which overestimates them (`src/studio/framing.ts:34-38`).
  - The rest pose is measured precisely, vertex by vertex (`src/studio/viewport.ts:205`).
  - `applyFraming` then passes the sampled union to `stageProps` (`viewport.ts:246-249`). That puts the shadow, grid and ground at the union's lowest point (`viewport.ts:224-227`), even when the shift is zero.
- **Why the rover hits it:** Traverse is the rover's first clip and spins each wheel group about X (`src/models/equipment.ts:22-25,43,57`).
  - At the t=0.5 s sample (120°), a tire's rotated box reaches 0.38 − (0.323·0.5 + 0.324·0.866) ≈ −0.062.
  - The precise rest lowest point is ≈0.036 (≈0.057 without lugs).
  - So the floor sits about 0.10 units, roughly 5% of the model's height, below the wheels.
  - The gap also exceeds the 0.035 tolerance, so `clipFocusShift` pans the camera about 0.05 (`framing.ts:81-85`).
- **Why nothing catches it:** the first clip autoplays on open (`src/studio/main.ts:145`), so this shows every time the rover opens. `?shot=1` posters never frame a clip, so they hide it. The framing check only exercises the skinned Field Pilot (`scripts/check-framing.mjs:122`).
- **Wider impact:** any imported model with spinning rigid parts behaves the same way.
- **Fix:** measure the rest pose and the clip with the same method, then add a check that the rover's wheels touch the floor during Traverse.
- **Confidence:** this comes from the code and the arithmetic, not a browser run. Compare a screenshot of the rover playing Traverse with `?asset=field-rover&shot=1`.

**[P2] Saved paint makes a saved model impossible to reopen if paint slot IDs change**
- Vertex slot IDs encode the geometry's position in traversal order plus the exact color hex (`src/imports/paint.ts:69,78`). Material slot IDs encode the glTF material index (`paint.ts:59-60`).
- On reopen, a PolyFork model is fetched again from its unversioned CDN URL (`src/imports/asset.ts:31`, `src/imports/library.ts:95-96`). The saved edits are then applied (`library.ts:101`), and any unknown slot key throws (`paint.ts:116-118`).
- If the publisher re-exports the model, or a later loader or palette change renumbers slots, the saved remix can only be deleted. Before this diff, saved import edits did not depend on the model's internals.
- **Fix:** drop and report unknown slot keys when reopening instead of failing the open.

**[P2] Restoring a region by prompt only works with local commands**
- The local parser supports `restore <label>` (`src/data/import-prompt.ts:48-53`).
- When on-device AI is available, local commands are never tried (`src/data/assistant.ts:80-83`).
- The on-device model only sees slot IDs and labels, not original colors (`import-prompt.ts:68-69`). The merge of its answer can only add or overwrite keys (`import-prompt.ts:77-78`).
- So "restore jacket" either fails or saves a guessed color as a permanent override.
- With up to 256 vertex slots, the full slot list in the prompt and response schema may also exceed the on-device input limit, and there is no local fallback.

**[P2] Curly quotes break quoted slot names**
- Only straight quotes protect a label from clause splitting and get stripped from it (`src/data/commands.ts:69`, `import-prompt.ts:25`).
- `Paint “Hat and ribbon” teal` splits at "and" and fails. The app's own error text uses curly quotes (`import-prompt.ts:57`).

**[P2] The browser gate does not prove vertex-color export or a realistic PolyFork remix**
- Every PolyFork model in the gate is a single triangle with no material and no vertex colors (`scripts/check-inventory.mjs:29-47,83-86`). The remote remix leg therefore only paints the default material (`scripts/check-remixes.mjs:364-369`).
- Vertex-region painting is only tested in the static-model test function (`check-remixes.mjs:239`), which never exports.
- Nothing checks that a painted vertex region ends up in the exported GLB's vertex colors, which is part of the plan's export acceptance criterion. Unit coverage stops at the export clone (`src/studio/export.test.ts:15-29`).
- The real Survey Drone pass is skipped silently when `dataset/` is missing (`check-remixes.mjs:379`).

**Nits**
- After an API or AI tools edit, Properties re-renders and the Model colors dropdown jumps back to the first slot (`src/studio/main.ts:316`, `src/ui/model-paint.ts:12-17`).
- The Properties reset button renames a remix back to the source's title or filename (`main.ts:353-361`).
- "tint white" sets `#f4f4ed`, not `#ffffff` (`commands.ts:4`, `import-prompt.ts:59`). "reset tint" fails as an unknown slot.
- The AI tools JSON tab only checks that the same model is still open. An API edit made while the dialog is open is silently overwritten (`src/ui/dialogs.ts:132-136`).
- The plan's Created and Updated dates (27 Nov) come after the 26 Nov handoff it records (`docs/work/4_model-remixing/plan.md:5-6,32`).

## F0 recheck (static models not redrawing after paint)
Fixed on every path:
- **Properties:** color, tint and name edits now call `stage.invalidate()` (`main.ts:164-165`).
- **AI tools and the agent API:** the dialogs go through `setImportEdits` (`main.ts:322`), which invalidates (`main.ts:313-314`).
- **Test:** `check-remixes.mjs:252-276` lets the renderer go idle, then requires pixel changes from both Properties and the API on a model with no clips. The canvas keeps its last frame, so a missing redraw would fail the test.
- **Screenshot:** `output/studio/survey-drone-ui-repainted.png` shows the repainted front-right rotor region.

## Checked, no finding
- **Remix isolation:** `remix()` only takes a new save target after the new name validates, and cancels pending opens so a late load can't overwrite the saved source (`main.ts:221-237`). Saves snapshot the model synchronously per selection (`main.ts:200-219`). A local remix stores its own copy of the file (`library.ts:54`).
- **Shared and interleaved vertex colors:** each geometry copies its color data on first edit and restores from the untouched original (`paint.ts:102-113,126-137`). Material copies made by the loader keep the original's mapping (`node_modules/three/examples/jsm/loaders/GLTFLoader.js:3517`), so they share one slot.
- **Export snapshot:** materials and colored geometries are cloned synchronously when export starts (`src/studio/export.ts:21-32`).
- **Rest-pose sampling:** the animation stop/restart in `viewport.ts:183-196` restores time and pause state correctly, per three.js (`node_modules/three/src/animation/AnimationAction.js:189-212`, `AnimationMixer.js:156-160`). Camera and target move by the same amount, so orbit is preserved (`viewport.ts:250-261`). `?shot=1` is never framed to a clip (`viewport.ts:356-365`).
- **Security:** labels taken from GLB names are HTML-escaped (`model-paint.ts:13-14`, `dialogs.ts:122-123`, `src/ui/dom.ts:8-13`). The paint validator's regex rejects keys like `__proto__` (`paint.ts:93`).

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F0 | Prior P1 static/paused import color redraw (from Round 0) | Resolved and confirmed fixed on Properties, AI tools, and agent API paths. | Verified at `064772e` and rechecked in `scripts/check-remixes.mjs`. |
| F1 | [P1] Clip framing drops floor below rigid rotating parts (Field Rover Traverse) | Accepted; `fastBounds` transformed local AABBs for non-skinned meshes while rest measurement used exact vertices. | Fixed in `a800951` and refined for full rigid vertex sampling + symmetric expansion in the final repair commit; unit and Chrome checks added. |
| F2 | [P2] Unknown saved paint slot IDs brick reopen | Accepted; PolyFork re-exports or palette changes could drop a saved slot ID. | Fixed in `a800951` via `reconcileSavedEdits` in `src/imports/asset.ts` and `src/imports/library.ts` with user notice and unit test. |
| F3 | [P2] On-device AI cannot restore a paint region; 256-slot schema bloat | Accepted; local commands supported `restore` while on-device AI schema could only set hex values. | Fixed in `a800951` (with schema `minItems: 1` and `enum` alignment in the final repair commit) plus `reset tint` support and unit tests. |
| F4 | [P2] Curly quotes break quoted slot names | Accepted; error copy used curly quotes while parser only handled straight quotes. | Fixed in `a800951` in `src/data/commands.ts` and `src/data/import-prompt.ts` with unit tests. |
| F5 | [P2] Browser gate did not verify exported `COLOR_0` vertex colors | Accepted; deterministic fixture did not export and inspect `COLOR_0`. | Fixed in `a800951` in `scripts/check-remixes.mjs`, verifying linear RGB `COLOR_0` values in exported GLBs. |

Nits (preserving `#paintSlot` selection across API/AI edits without leaking across models, JSON tab stale-snapshot guard, plan dates) were also addressed.

## Verification

At `064772e` before repairs: `npm run verify` passed 75 unit tests, strict types, zero-warning lint, and both Vite builds; `npm run check:studio` passed including real Survey Drone and Family Traveller checks. Repairs at `a800951` passed 76 unit tests and `npm run check:studio`, then went to Round 2 repair review.

## Round outcome

One P1 (F1) and four P2s (F2–F5) were accepted and repaired in `a800951`; prior blocker F0 was confirmed fixed. Proceeded to Round 2 repair re-review.
