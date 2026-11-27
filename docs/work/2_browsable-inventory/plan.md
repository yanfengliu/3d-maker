# Browse all assets in the studio

Status: complete
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

The one-page workspace shipped in `b6a6c10`. All 51 unit tests, strict typecheck, lint, the app and SDK builds and the production Chrome gate passed. Desktop checks covered 1440 × 1000 and 1024 × 768. The live GitHub Pages site showed six originals and 3,645 free catalog entries. A fresh session reached page 305, then opened Fox through Animals and search while the results stayed visible. Both independent review findings were repaired and rechecked. [Implementation review](reviews/0_implementation.md) · [Integration review](reviews/1_integration.md) · [Pages deployment](https://github.com/yanfengliu/3d-maker/actions/runs/45938619750)
