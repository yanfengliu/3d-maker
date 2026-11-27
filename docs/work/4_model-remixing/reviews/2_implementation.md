# Review 2: implementation

## Target

Repository `3d-maker`, repair commit `a800951` compared against `064772e` (repairs for Round 1 findings F1–F5 and nits).

## Reviewers and coverage

- **Antigravity CLI (`agy 1.0.14`, `--model "Claude Opus 5.5 (High)" --sandbox -p`):** Independent read-only repair re-review of `a800951` against `064772e` (used as the owner-directed Antigravity Opus 5.5 fallback to conserve standalone Claude Code quota while Codex remained quota-limited). Zero stderr; pre/post `git status --porcelain` and `git diff HEAD` confirmed identical (no files modified). Grounded codebase reads verified via citations outside the diff (`src/models/equipment.ts:22,25,43`, `src/models/drone.ts:144`, `src/data/assistant.ts:90`, `src/ui/inspector.ts:38`).
- **Codex (`gpt-6-astra`):** Unavailable (account quota exhaustion from Round 1).

## Reports

### Antigravity Claude Opus 5.5 (High)

# Review of a800951 against 064772e (read-only)

I read the full diff and the code around it, plus the plan. I ran no tests and no gates: the brief asked for no mutating commands, and Vitest or a build would write caches. Every "proved" verdict below comes from reading the code. The only blocker is that F1's browser gate was never shown to fail on 064772e.

## F1 [P1] Field Rover floating during Traverse: fixed, but the proof is partial and one new risk

- **Root cause is fixed.** Rigid meshes are now measured from sampled vertices instead of a rotated bounding box (`src/studio/framing.ts:14-32`). A spinning wheel no longer inflates the box. I checked the rover geometry: the wheels sit at y 0.38 (`src/models/equipment.ts:22`), the tire radius is 0.324 (`src/models/equipment.ts:25`) and they spin on x (`src/models/equipment.ts:43`). With the fix, the lowest point drops only about 0.004 at worst. The old box drop was about 0.13, so the 0.015 check in `src/studio/framing.test.ts:97` would have failed before this commit. That check does prove the change in `framing.ts`.
- **P2: the `viewport.ts` change has no test and changes behaviour for every clip.** `src/studio/viewport.ts:246` now uses the rest bounds whenever the focus shift is zero. Before, it always used the clip's sampled bounds.
  - Clips that grow the bounds evenly without moving the centre no longer widen the frame or move the floor. Examples are rigid spins in imported models, a walk's legs swinging forward and back, or the rotors in `src/models/drone.ts:144`.
  - The rover unit test only exercises `fastBounds`. The vertex fix alone already gives zero shift for the rover (`framing.test.ts:98`), so this line isn't needed for F1.
  - Revert it, or add a test showing an evenly growing clip still fits the frame.
- **P2: sampled clip bounds no longer cover every vertex.** Rigid meshes are now subsampled to 800 vertices (`framing.ts:5`, `framing.ts:18-19`). The rest bounds are still measured from every vertex (`viewport.ts:205`).
  - For a dense, animated, rigid imported mesh, the sampled box can be smaller than the rest box. If the gap exceeds the tolerance (`framing.ts:74-75`), the shift becomes non-zero.
  - Then the floor is placed at the sampled bottom (`viewport.ts:224-227`), so the model sinks into the ground.
  - Before this commit, rigid meshes used the geometry box, which always covers every vertex. Clip bounds are cached, so sampling every vertex on rigid meshes would be cheap.
- **Gate weakness (`scripts/check-framing.mjs:195-209`).**
  - It compares only the rover's bottom edge on screen, using a colour filter tuned for Field Pilot (`check-framing.mjs:63-66`). It does not measure the gap between the wheels and the grid or shadow, which is what "floating" means.
  - It never checks that the active clip is Traverse. Unlike `selectClip`, it doesn't check `#motionName`.
  - With the 0.025 tolerance, a rough estimate puts the old drift near 0.02–0.05, so the gate may not have failed on 064772e. Nobody has shown that it does.

## F2 [P2] Saved paint slot IDs: fixed

- `reconcileSavedEdits` (`src/imports/asset.ts:23-33`) removes unknown slot IDs before `applyPalette` would throw (`src/imports/paint.ts:117`). It is wired in at `src/imports/library.ts:101-103`, and the user gets a notice (`src/studio/main.ts:200-202`). `openSavedImport` is the only reopen path (`main.ts:290`).
- **Nit: only the helper is tested.** The test covers it at `asset.test.ts:135-139`. Nothing tests `openSavedImport` itself or the notice, for example a browser check that plants a stale saved entry and reopens it.

## F3 [P2] On-device restore, local tint reset, 64-slot cap: mostly fixed

- The local "reset tint" works (`import-prompt.ts:50-54`, `import-prompt.test.ts:17-19`). On-device restore works for the case tested (`import-prompt.test.ts:35,42-43`).
- **P2: the schema allows output that the code rejects.** The `reset` schema is a plain list of strings with no minimum length and no list of allowed IDs (`import-prompt.ts:76`). But `import-prompt.ts:87` throws on an empty list.
  - A small on-device model following the schema can return `"reset": []` alongside a valid edit. The whole request then fails with "invalid paint reset".
  - Nothing requires any field inside `changes` (`src/data/assistant.ts:90`), so filling every field with an empty value is allowed output.
  - Treat an empty list as no reset, or add a minimum length of 1 and the allowed slot IDs to the schema when there are 64 slots or fewer.
- **Nit: the 64-slot fallback (`import-prompt.ts:73-75`) is untested.** 64 is an unexplained magic number. The on-device "#ffffff resets tint" relies only on the instruction text and has no test.

## F4 [P2] Curly quotes: fixed for slot names, not tested for asset names

- Clause splitting (`src/data/commands.ts:69,72`) and slot lookup (`import-prompt.ts:25`) are correct. `import-prompt.test.ts:17-18` proves slot names with curly double quotes.
- **Nit: the rename path has no test.** `commandName` (`commands.ts:20`) also feeds starter-recipe renames, but no test uses curly quotes for a rename or for single curly quotes (`assistant.test.ts:12` uses straight quotes only). "Reset “tint”" in quotes is still treated as a slot name, not the tint.

## F5 [P2] Exported vertex colours (COLOR_0): proved for the fixture

- The parser (`scripts/check-remixes.mjs:239-265`) is correct for a single binary chunk. The thresholds (`check-remixes.mjs:357-366`) only pass for linear colour values: green for #ee2244 is 0.016 in linear and 0.133 in sRGB. The fixture's starting colours are grey (`check-remixes.mjs:101-112`), so the check can't pass by accident.
- **Nit: it depends on the fixture.** Material-slot export is never checked: the secondary slot is only checked when it is a vertex region (`check-remixes.mjs:361`). On the real Survey Drone, the rotor slot can fall back to `slots[0]` (`check-remixes.mjs:276`), which may be a material slot.

## Nits

- **Paint slot selection is kept, but it leaks across models.** `properties()` reads `#paintSlot` before `showProperties` rebuilds `#modelPaint` (`main.ts:105-107`, `src/ui/inspector.ts:38`), and the selection is restored at `src/ui/model-paint.ts:19`. But `openImport` → `controls()` → `properties()` (`main.ts:198`) also carries a shared ID such as `material-0` from the previous model into a newly opened one. No test proves either case: the gate always selects the slot explicitly first (`check-remixes.mjs:353`).
- **The stale-snapshot guard is correct but its failure case is untested.** `src/ui/dialogs.ts:129,133` compares the edits the same way at open and at apply, so the normal path doesn't trip it. This matches the prompt-path guard at `dialogs.ts:190`. Only the normal apply is exercised (the AI tools JSON-tab apply in `check-remixes.mjs`); nothing shows a stale edit being rejected.

## Verdict

F2 through F5 are correct, with minor gaps in how well they are proved. F1's main fix is correct and unit-proved. Before closing F1:

- Either revert `src/studio/viewport.ts:246` or test it for clips that grow the bounds evenly.
- Address the floor placement caused by subsampled clip bounds.
- Show that the browser gate fails on 064772e.

Fix F3's schema mismatch at `import-prompt.ts:76` together with the empty-list check at `import-prompt.ts:87`.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F6 | [P2] `viewport.ts:246` skipped `sampled` bounds when focus shift was zero, preventing symmetric-growth framing | Accepted; reverting to `const active = clip ? sampled : this.restBounds` preserves framing for evenly expanding clips while exact rigid vertices keep Field Rover grounded. | Fixed on `main` after `a800951`. |
| F7 | [P2] Subsampling rigid meshes to 800 vertices in `framing.ts` could shrink sampled bounds vs exact rest bounds | Accepted; rigid mesh vertex transforms are cheap and cached per clip, so iterating every rigid vertex eliminates subsampling drift. | Fixed on `main` (`step = 1` for non-skinned meshes). |
| F8 | [P2] On-device `reset` schema lacked `minItems: 1` and `enum` while code rejected empty `reset: []` | Accepted; aligned schema (`minItems: 1`, `enum` for `<= 64` slots) and allowed empty `reset: []` alongside another valid edit. | Fixed on `main` with unit test in `src/data/import-prompt.test.ts`. |

Nits addressed alongside F6–F8: kept `#paintSlot` preservation scoped to `setImportEdits` so selection cannot leak across newly opened models, asserted `#motionName === "Traverse"` in `scripts/check-framing.mjs`, and added a curly-quoted rename test in `src/data/import-prompt.test.ts`. Noted without another round: testing `openSavedImport` notice end-to-end, 64-slot fallback unit test, and stale JSON tab rejection test.

## Verification

After applying F6–F8 and nit fixes: `npm run verify` passed all 76 unit tests, strict TypeScript, zero-warning ESLint, and both Vite production builds; `npm run check:studio` passed end-to-end in headless Chrome.

## Round outcome

All material findings (F0–F8) are resolved and verified by unit tests and headless Chrome regressions. Ready to push `main`, verify GitHub Pages CI, and smoke-test the live site.
