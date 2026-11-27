# Devlog

- 2026-11-27 — Added append-only model variation support (`src/models/variations.ts`, optional `variation` field in `Recipe`, studio Variation selector, `window.forgeStudio.listVariations`/`selectVariation`, SDK `listVariations`/`resolveVariationRecipe`, and `extras.formFoundry` variation metadata) seeded with 5 appearance and structural variations, enforced against accidental wipes by a deterministic recipe/geometry lockfile (`src/models/variations.lock.json`), append-only `npm run variations:lock`, Vitest + Git-history monotonicity guard (`src/models/variations-guard.test.ts`), CI full-history checkout, and `docs/policies/local-rules.md`; also capped Vitest workers at 4 (`vitest.config.ts`) cutting unit test wall time from ~21s to ~6s.

- 2026-11-27 — Expanded the original procedural collection by 100 new animated HD/standard assets (106 total originals) across buildings (30), skinned humanoid characters with full 85-clip motion support (16), vehicles (16), animals (10), terrain setpieces (8), props (10), handheld items (6), and attachments (4), complete with self-describing interactive mechanisms, detachable parts, night glow, preview posters, and scaled unit and headless-Chrome checks.

- 2026-11-27 — Optimized studio loading speed by code-splitting the 85-clip character motion library, `GLTFLoader`, `GLTFExporter`, and `three` vendor bundle (cutting initial gzipped JS from 825 KB to 218 KB), firing PolyFork GLB/detail/params requests in parallel with a bounded session GLB LRU cache, parallelizing `Characters`/`Animals` category pagination, adding `polyfork.dev` preconnect, and loading above-the-fold starter cards eagerly.

- 2026-11-26 — Added client-side PolyFork asset parity and AI-discoverable capability manifests: interactive rigged hinges/slides with live preview and opt-in GLB clip baking, detachable part toggles, twilight night glow, decal previews, semantic color zones, curated colorway presets, 3D color eyedropper, `extras.formFoundry` on every exported GLB, `inspectAsset`/`createAssetController` in `studio-sdk.js`, and matching `window.forgeStudio` + AI tools controls.

- 2026-11-26 — Fixed PolyFork catalog and model loading stalling after transient rate limits or slow downloads by replacing the 60-second CORS-blind 429 lockout with short progressive backoff and automatic recovery, deduplicating concurrent catalog requests, clearing backoff on manual Retry, and adding timeout and transient retry handling to GLB downloads.

- 2026-11-26 — Kept low-pose animation previews (such as Swimming, Treading water and Slide) centered above the floor grid without altering user orbit or exported motion, and added browser regressions for clip framing, settled static rotor repainting and AI tools editing on imported models.

- 2026-11-26 — Extended AI tools to edit imported assets by prompt or JSON and added viewport redraws after changing a stationary model’s paint.

- 2026-11-26 — Added separate remix drafts for originals, catalog assets and local files. Imported models expose editable material and vertex colors in Properties and the agent API. Saved copies and GLB exports retain paint, source credits and animation.

- 2026-11-26 — Animation search shows how many clips match out of the model’s full list. Show all clears the search while the current clip continues playing.

- 2026-11-26 — Placed Properties and Animation side by side beneath the viewport. Opening a model now shows its settings and full clip list together while its default animation plays.

- 2026-11-26 — Added the 85 downloadable CC0 humanoid motions to compatible rigs in the studio, three.js SDK and GLB exporter. Added default playback, the Space shortcut, clip search and continuous playback of the full list. Moved transport into the viewport and simplified the inventory and editor headers. Corrected the Characters filter for humanoids filed as animals upstream.

- 2026-11-26 — Merged Inventory and Object Studio into one desktop page. Added category browsing, cross-collection search, thumbnail results and direct page navigation across the originals, free PolyFork catalog and saved assets.

- 2026-11-26 — Replaced the showcase with Form Foundry. Added six original HD/standard animated assets, a recipe-driven three.js SDK, browser inventory, GLB import/export, PolyFork catalog access, agent and on-device editing tools, and a reproducible local dataset download.
