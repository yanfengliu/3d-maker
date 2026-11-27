# Model editing and remixing

Status: in progress
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

Pending. Record the verified revision, checks and limitations at closure.
