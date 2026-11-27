# Model editing and remixing

Status: complete
Owner: Antigravity
Created: 2026-11-26
Updated: 2026-11-26

## Problem and outcome

Visitors need to edit an individual model color and make a new variation of an original, an imported file or a saved model.

## Scope

Add a Remix action for the current model, editable material and vertex palette colors for imports, and matching agent controls. Keep the model’s existing skeleton, animation library and source credits through save and GLB export.

## Approach

Start a separate draft with the current settings and playback in place. Use the existing inventory save and reload paths. Discover paint regions from actual material or palette data in the source GLB and persist only overridden colors.

## Acceptance criteria

- A user can edit, save, reopen and export a remix while keeping the previously saved source intact.
- Individual color edits work on named materials and low-poly vertex colors and can be reset independently.
- The desktop browser gate exercises each source type, retained animations and imported source credits. Export captures the colors active when export starts.

## Implementation steps

- The import owner handles paint discovery, validation and application. The integration owner handles the inspector, remix action, agent interface and export snapshots. An independent browser gate checks all three source types before review and deployment.

## Outcome

Completed on 26 November 2026. Remixing, individual material and vertex-color editing, static paint redraw invalidation, AI tools prompt and JSON editing for imports, and low-pose clip preview framing (Swimming, Treading water, Slide, and grounded rigid rotations on Field Rover) all passed 76 unit tests, strict types, zero-warning lint, both Vite builds, and the desktop Chrome studio gate (`scripts/check-studio.mjs`, `scripts/check-framing.mjs`, `scripts/check-remixes.mjs`) plus real-model checks on `Survey Drone` and `Family Traveller`. Independent review covered Round 0 (partial), Round 1 (Claude Opus 5.5 full diff review; Codex quota-limited), and Round 2 (Antigravity `agy` Claude Opus 5.5 High repair re-review); all P1/P2 findings (`F0`–`F8`) were resolved and verified before deployment. [Round 0](reviews/0_implementation.md) · [Round 1](reviews/1_implementation.md) · [Round 2](reviews/2_implementation.md)
