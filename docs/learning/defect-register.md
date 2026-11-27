# Studio defect register

## 2026-11-26 — Available models were difficult to discover

The landing page showed six originals. Saved assets lived in another view and the full catalog required opening an import dialog. Visitors could not browse the available models by category. The studio now opens with a searchable, categorized inventory beside the editor.

`src/data/browse.test.ts` checks how local and remote results combine across page boundaries. `scripts/check-inventory.mjs` exercises all catalog classes, traverses every fixture result and verifies that selecting a model keeps both panels visible and preserves the current filters.
