# Studio defect register

## 2026-11-26 — Low-pose animations dropped below the viewport and floor grid

Clips whose authored root motion sits below the rest floor (such as Swimming and Treading water) fell partly outside the viewport and behind the floor grid and playback bar because the stage only framed the rest pose. The viewport now samples each clip’s bounding box on selection, shifts the floor, shadow and camera target together while preserving the user’s orbit and zoom, expands the orthographic frame only when a stretched pose exceeds the base frame, and leaves model transforms and exported tracks untouched.

`src/studio/framing.test.ts` covers low-pose offsets, scale invariance and track immutability. `scripts/check-framing.mjs` checks Swimming, Treading water and Slide through the animation picker, confirms user orbit survives clip switches, and verifies exported Hips tracks keep their authored depths.

## 2026-11-26 — Static imported models did not redraw after color edits

Once the on-demand renderer settled on a non-animated GLB, changing a material color, vertex region or tint skipped `stage.invalidate()` unless geometry also changed. Both Properties edits and `window.forgeStudio.setImportEdits` now invalidate the viewport. `scripts/check-remixes.mjs` lets a static model settle and verifies immediate pixel changes from both Properties and the agent API without moving the camera.

## 2026-11-26 — A filtered animation list looked like the entire library

Searching for Dance left one row visible. The animation header now spells out the matching and total clip counts and offers Show all while a filter is active. The studio browser check covers the unfiltered, one-match and zero-match states and verifies that clearing a search preserves the playing clip.

## 2026-11-26 — Available models were difficult to discover

The landing page showed six originals. Saved assets lived in another view and the full catalog required opening an import dialog. Visitors could not browse the available models by category. The studio now opens with a searchable, categorized inventory beside the editor.

`src/data/browse.test.ts` checks how local and remote results combine across page boundaries. `scripts/check-inventory.mjs` exercises all catalog classes, traverses every fixture result and verifies that selecting a model keeps both panels visible and preserves the current filters.

## 2026-11-26 — Character discovery and animation coverage followed incomplete upstream fields

The class field hid 146 humanoids under Animals. The GLB animation array exposed only three clips on a typical catalog humanoid. Compare both fields against the user-facing gallery and the public motion index when updating the integration.

`scripts/check-humanoid-roster.mjs` reconciles the gallery against the downloaded metadata. The browse tests check mixed classes and existing saves. The rig and motion tests cover skeleton matching, retargeting and the full repertoire. The desktop browser gate searches for a clip and checks that each clip survives export and reimport.
