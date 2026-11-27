# Object studio and asset inventory

Status: complete
Owner: Codex integration owner
Created: 2026-11-26
Updated: 2026-11-26

## Problem and outcome

Replace the iPhone showcase with a three.js object studio where people and agents can customize reusable objects and characters, preview animation, and save variants in an inventory.

## Scope

The replacement includes six original procedural assets, a recipe format and agent interface, a live editor, local inventory, GLB import and export, and on-demand access to Polyfork’s free catalogue. The dataset snapshot stays in a Git-ignored directory. The owner requested this work on the existing branch and a sync of the repository’s fleet rules.

## Approach

Use validated recipe data and named three.js nodes for the original models. Use a stable skeleton and animation clips for the two original characters. Preserve an imported GLB’s hierarchy, skin and clips, and apply its studio edits to an outer group. Store local-file sources in IndexedDB and save a canonical source reference for a Polyfork import. The full public roster and two sample meshes have separate origin and checksum records in the [dataset guide](../../dataset.md).

## Acceptance criteria

- An inventory entry opens an editable model. Saving a changed variant, reloading, opening and deleting it work through the studio.
- Changing either character’s appearance preserves its skeleton and playable animation. Exported GLBs reopen in three.js with their animation tracks.
- Agents can discover the recipe schema, construct a valid model and apply edits using the documented interface.
- The complete free catalogue snapshot passes its count and checksum checks. Source data stays outside Git and the production build.
- The production build, tests, typecheck, lint, browser checks and published fleet-rule comparison pass on the delivery revision.

## Implementation steps

- Model owner builds and tests the six original models and their animation tracks.
- Data owner implements recipes, local saved variants, agent documentation and catalogue search.
- Import owner implements GLB editing and persistence and prepares the local dataset.
- Integration owner replaces the old product, connects the editor, inventory and exports, syncs fleet rules, and verifies the assembled result.

## Outcome

The dataset contains 3,645 free catalogue entries and two GLBs. A headless browser loaded Polyfork’s Family Traveller, saved and reopened both a source-linked variant and a local-file variant, then deleted both. Its customized GLB export reimported with 31 bones, eight skinned meshes and Idle, Walk and Run clips. The studio at `6a7bd3e` passed 44 unit tests, typecheck, strict lint, both production builds, both dependency audits and the desktop Chrome gate. [Review 0](reviews/0_implementation.md), [review 1](reviews/1_integration.md) and [review 2](reviews/2_integration.md) record the findings and their verification. GitHub Pages published the studio in [run 45937267038](https://github.com/yanfengliu/3d-maker/actions/runs/45937267038). A live desktop Chrome check loaded all six previews, played the Field Pilot clip and exported a 1,605,688-byte HD GLB. The generated fleet block matches the desktop-only default adopted in fleet `484d9e2`.
