# PolyFork feature parity and AI-discoverable model capabilities

Status: active
Owner: Antigravity
Created: 2026-11-26
Updated: 2026-11-26

## Problem and outcome

PolyFork models such as `village-shopfront-d3088e` ship with authored interactive parts (like a hinged `door` that swings 0–80 degrees), detachable parts (`planter`, `display`, `lantern`), night emissive zones (`pane`), declared decal areas (`fascia`), colorway presets, and physical dimensions. Form Foundry previously fetched only the bare `.glb`, losing all interactive capabilities in the studio UI, browser API, SDK, and exported GLBs so both users and AI agents assembling scenes had no way to discover or operate them.

This milestone brings all 100% local PolyFork asset features into Form Foundry and embeds a self-describing `extras.formFoundry` capability manifest (plus opt-in rigged-part AnimationClips and a portable SDK controller) so every capability is immediately usable in the studio and automatically discoverable by AI and Three.js game code.

## Scope

Included:
- Fetch and validate free public PolyFork detail metadata (`/api/assets/{id}` and `-params.json`) on demand alongside `/cdn/{id}.glb`, with graceful offline/404 fallback.
- Canonical `AssetCapabilities` schema (`version: 1`) for both PolyFork imports, re-imported GLBs, and all 6 studio originals, embedded on exported GLB root `extras.formFoundry`.
- Interactive rigged part controls (rotate hinges and slide parts, live sliders, Open/Close toggles, and live preview playback) and opt-in rigged-part `AnimationClip` baking on GLB export.
- Detachable part visibility toggles (persisted in saved remixes and honored on export).
- Night lighting preview mode (albedo-matched multi-color emissive overlays + dimmed studio twilight lighting) preserving night-zone bindings across repaints.
- Decal area inspection and preview overlay with optional text preview.
- Named color zones (including tone-varied low-poly meshes exceeding 32 raw hexes), one-click colorway presets, and a 3D viewport click-to-pick paint tool.
- Full AI discoverability: `extras.formFoundry` in exported GLBs, `inspectAsset()` / `createAssetController()` in `studio-sdk.js`, `window.forgeStudio` inspection and control methods, AI tools prompt/JSON support, and updated `public/llms.txt` and `docs/design/spec.md`.

Excluded (deferred to a follow-up milestone):
- PolyFork server-baked parametric geometry knobs and Looks (`/cdn/{id}-remix.glb?p=...&look=...`, subject to anonymous IP bake quotas).
- Multi-object scene editing, terrain sculpting, character garment swaps, and paid HD editions.

## Approach

Keep every runtime feature 100% client-side with zero new npm dependencies and zero mirroring of PolyFork `.mjs` modules. Share one Three.js runtime controller (`src/capabilities/runtime.ts`) between the studio and `studio-sdk.js` so behavior in preview matches game playback identically. Extend `ImportEdits` in IndexedDB backward-compatibly with optional `pose`, `hiddenParts`, `night`, and `decalText` fields.

## Acceptance criteria

- Opening `Village Shopfront` displays and operates its rigged `door` (`0°`–`80°`), detachable parts (`planter`, `display`, `lantern`), night glow (`pane`), decal area (`fascia`), colorway presets (`aegean-blue`, `harbour-green`, `oxblood-red`, `ochre`), named color zones (including limewash walls), and viewport color picking.
- Changes persist across remix/save/reopen without mutating the source entry.
- Exported GLBs carry `extras.formFoundry` on the root node, survive re-import offline with all capabilities intact, and include rigged-part `AnimationClip`s when opted in.
- `studio-sdk.js` exports `inspectAsset` and `createAssetController`, and `window.forgeStudio` plus AI tools support inspecting and driving parts, visibility, night mode, and colorways.
- `npm run verify`, `npm run check:studio`, real-model Chrome inspection on `Village Shopfront`, independent review, and live GitHub Pages smoke verification all pass.

## Implementation steps

- Build `src/capabilities/schema.ts`, `src/capabilities/runtime.ts`, `src/data/polyfork-detail.ts`, and `src/models/capabilities.ts`.
- Extend `src/imports/paint.ts`, `src/imports/asset.ts`, `src/imports/library.ts`, and `src/studio/export.ts` for named color zones, colorways, poses, visibility, night, decals, and GLB `extras.formFoundry` + opt-in rig clips.
- Integrate viewport night lighting, click-to-pick color eyedropper, and UI controls (`src/ui/model-parts.ts`, `src/ui/model-paint.ts`, `src/ui/inspector.ts`, `src/ui/dialogs.ts`, `src/studio/main.ts`).
- Wire `window.forgeStudio`, `src/data/import-prompt.ts`, `src/sdk.ts`, `public/llms.txt`, `README.md`, and `docs/design/spec.md`.
- Add unit tests and desktop Chrome regressions, run independent review, fix findings, verify, push, and smoke-test live.

## Outcome

Pending.
