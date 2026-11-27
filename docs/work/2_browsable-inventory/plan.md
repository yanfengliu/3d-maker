# Browse all assets in the studio

Status: active
Owner: Codex
Created: 2026-11-26
Updated: 2026-11-26

## Problem and outcome

The previous inventory exposed only saved items. The six original models appeared under the editor and the full catalog lived in an import dialog. Make every source browsable as one inventory alongside the live editor.

## Scope

The desktop page combines original models, the free live PolyFork catalog, saved variants, and local imports. Keep editing, animation, saving, export, and screenshot contracts available.

## Approach

Use the upstream class filter for remote categories and the same type names for local entries. Present a persistent collection and category list, search, a paginated thumbnail grid, and an adjacent editor. Fetch meshes on selection.

## Acceptance criteria

- On opening the studio, a visitor can see the inventory, categories, and model editor.
- Filters and search span the selected source. Navigation reaches every eligible catalog page.
- Opening a result preserves the browsing context. Saved and imported assets can be reopened and managed.
- Desktop controls work in a production build and on GitHub Pages.

## Implementation steps

- The data owner implements combined paging, filtering, and regression tests.
- The integration owner builds the one-page interface and connects selection, saving, and deletion.
- The browser-gate owner verifies the workflow through production controls.

## Outcome

In progress.
