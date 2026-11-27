# Studio defect register

## 2026-11-26 — A filtered animation list looked like the entire library

Searching for Dance left one row visible. The animation header now spells out the matching and total clip counts and offers Show all while a filter is active. The studio browser check covers the unfiltered, one-match and zero-match states and verifies that clearing a search preserves the playing clip.

## 2026-11-26 — Available models were difficult to discover

The landing page showed six originals. Saved assets lived in another view and the full catalog required opening an import dialog. Visitors could not browse the available models by category. The studio now opens with a searchable, categorized inventory beside the editor.

`src/data/browse.test.ts` checks how local and remote results combine across page boundaries. `scripts/check-inventory.mjs` exercises all catalog classes, traverses every fixture result and verifies that selecting a model keeps both panels visible and preserves the current filters.

## 2026-11-26 — Character discovery and animation coverage followed incomplete upstream fields

The class field hid 146 humanoids under Animals. The GLB animation array exposed only three clips on a typical catalog humanoid. Compare both fields against the user-facing gallery and the public motion index when updating the integration.

`scripts/check-humanoid-roster.mjs` reconciles the gallery against the downloaded metadata. The browse tests check mixed classes and existing saves. The rig and motion tests cover skeleton matching, retargeting and the full repertoire. The desktop browser gate searches for a clip and checks that each clip survives export and reimport.
