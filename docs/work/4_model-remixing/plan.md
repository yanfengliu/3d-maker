# Model editing and remixing

Status: active
Owner: Codex
Created: 2026-11-27
Updated: 2026-11-27

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

Handoff on 26 November 2026. The animation list at `4e27aa7` is deployed. Remix, individual color editing and three-source save/reopen/export passed 70 tests, lint, strict types, both builds and the Chrome gate at the local implementation milestone `03df719`. The next checkpoint also wires AI tools and render invalidation for static imports. Verify import prompts through the actual dialog and repaint a stationary static model after the renderer settles, with a pixel regression. The Swimming screenshot at `output/studio/available-animations.png` shows the pilot partly outside the viewport; check clip framing for swimming and other low poses. Finish review, run both gates, push main and verify Pages and the live model workflow. [Partial implementation review](reviews/0_implementation.md)
