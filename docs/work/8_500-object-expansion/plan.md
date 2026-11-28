# 500-object procedural catalog expansion

Status: complete
Owner: Antigravity
Created: 2026-11-27
Updated: 2026-11-27

## Problem and outcome

Form Foundry previously shipped 106 original procedural 3D models (6 core starters plus 100 collection assets statically bundled into the browser studio entry chunk at 144.0 KiB gzip, against a 175 KiB startup entry budget). Expanding the original catalog by 500 diverse animated procedural models across 25 domain packs without exceeding the 175 KiB entry and 360 KiB total startup gzip JS budgets required separating lightweight startup catalog metadata from lazy-loaded builder chunks in the browser studio while keeping `src/models/index.ts`, `dist/studio-sdk.js`, Vitest, and `scripts/lock-variations.mjs` 100% synchronous.

This deliverable adds 500 genuinely diverse animated procedural 3D assets (25 domain packs of 20 models each, bringing the catalog to 606 originals and 612 locked variations) backed by an on-demand lazy pack loader in the browser studio, updated preview posters and agent schema, and full deterministic and headless-Chrome visual verification.

## Scope

Included:
- Lazy expansion plumbing and studio integration (`src/models/expansion/{types,registry,meta,all,lazy}.ts`, `src/models/collections/meta.ts`, `src/models/studio-build.ts`, `src/data/{recipe,browse}.ts`, `src/models/{capabilities,index}.ts`, `src/studio/{main,export-flow,shelf,thumbnails,agent-api}.ts`, `src/ui/dialogs.ts`, `src/models/expansion/plumbing.test.ts`).
- 500 new procedural 3D models across 25 domain packs authored by a 5-domain swarm (`src/models/expansion/meta/*.ts`, `src/models/expansion/packs/*.ts`, `src/models/expansion/tests/*.test.ts`): `props-home` (100 props: `home-furniture`, `kitchen-appliances`, `workshop-machinery`, `science-medical`, `culinary-market`), `props-culture` (100 props: `music-stage`, `sports-play`, `street-civic`, `fantasy-arcane`, `scifi-stations`), `worlds-built` (60 buildings + 40 terrain: `buildings-world`, `buildings-civic`, `buildings-fantasy-scifi`, `terrain-biomes`, `terrain-structures`), `vehicles-life` (60 vehicles + 40 animals: `vehicles-road`, `vehicles-sea-air`, `vehicles-scifi-fantasy`, `animals-wild`, `animals-ocean-myth`), and `chars-gear` (40 skinned 19-bone humanoid characters + 40 handheld items + 20 wearable attachments: `characters-civilian`, `characters-adventure`, `handheld-tools`, `handheld-fantasy-scifi`, `attachments-wearables`).
- Append-only lockfile update (`src/models/variations.lock.json`, 612 total variations), incremental poster capture (`scripts/posters.mjs --only-missing`, 500 new `public/previews/*.webp` files = 606 total), agent schema sync (`public/agent-schema.json`), test-harness memory cleanup (`src/models/models.test.ts`, `src/models/craft-invariants.test.ts`, `src/models/variations-guard.test.ts`, `vitest.config.ts`), and canonical documentation (`docs/design/spec.md`, `docs/devlog/summary.md`).

Excluded:
- Modifying any of the 112 previously locked model variations or weakening any craft, bundle, or append-only variation guard.

## Approach

Separate pure metadata (`src/models/expansion/meta/*.ts` and `src/models/collections/meta.ts`, zero Three.js imports) from procedural builders (`src/models/expansion/packs/*.ts` and `src/models/collections/index.ts`). The browser studio (`src/studio/*`) imports `src/models/studio-build.ts` and dynamically imports each pack on demand with in-flight promise deduplication and `openSequence` race protection, while keeping the 6 core starters synchronous and leaving `src/models/index.ts` and `dist/studio-sdk.js` 100% synchronous via `src/models/expansion/all.ts`. Keep every file under `src/` and `scripts/` at or below 500 physical lines.

## Acceptance criteria

- [x] Catalog exposes 606 unique original templates (106 existing + 500 new) with zero duplicate IDs, codes, or display names across `catalog`, `public/agent-schema.json`, `dist/catalog.json`, `dist/studio-sdk.js`, and `window.forgeStudio.listTemplates()`.
- [x] `src/models/variations.lock.json` stays under 1 MiB with 612 locked variations (500 added, zero edits to the original 112 locked hashes).
- [x] `npm run verify` passes 100% (Vitest, strict TypeScript, zero-warning ESLint, production app + SDK builds, and `check:bundle` within <= 175 KiB entry / <= 360 KiB initial gzip JS budgets with all 26 lazy builder chunks split cleanly).
- [x] All 606 `public/previews/*.webp` thumbnails exist (>= 1 KB and < 512 KiB each).
- [x] `npm run check:studio:ci`, full `npm run check:studio`, dynamic lazy-load headless-Chrome E2E checks across packs, and multi-angle `npm run inspect:model` visual inspections pass with zero page errors or 404s.

## Implementation steps

- [x] Phase 1 (`architect`, verified by `verifier-e2e`): implement lazy expansion plumbing, studio async loading, `--only-missing` poster support, and `plumbing.test.ts` (`07adb87`).
- [x] Parallel domain authoring (`props-home`, `props-culture`, `worlds-built`, `vehicles-life`, `chars-gear`, each independently verified by `verifier-craft`): author and test all 25 packs (500 models) in isolated worktrees.
- [x] Phase 2 (`architect`, verified by `verifier-e2e`): merge all 5 cleared branches, wire `meta.ts`/`all.ts`/`lazy.ts`, lazy-split base collection builders via `collections/meta.ts`, sync `public/agent-schema.json`, run `npm run variations:lock`, capture 500 missing WebP posters, fix test-harness Three.js heap retention, update `docs/design/spec.md` and `docs/devlog/summary.md`, and pass all gates (`c9e4470`).

## Outcome

Complete and verified at code revision `c9e4470c124221cad43a4222a2e96f7259c4cdce`. All 5 domain branches passed independent craft and diversity verification (`verifier-craft`, board `#86`), and the integrated commit `c9e4470` passed independent architecture, bundle, runtime, and visual E2E verification (`verifier-e2e`, board `#97`, recorded in `reviews/0_implementation.md`): `npm run verify` (45/45 Vitest files, 8,033/8,033 tests, strict TypeScript, zero-warning ESLint, app + SDK builds, `check:bundle` at 132.9 KiB entry / 290.7 KiB total initial gzip JS — smaller than pre-expansion 144.0 / 299.8 KiB), 606/606 WebP posters (4.6–25.4 KiB), 612 locked variations (490,731 bytes, zero changes to prior 112 hashes), `npm run check:studio:ci`, full `npm run check:studio`, dynamic 10-pack headless-Chrome E2E tests, and 9-model multi-angle visual inspections. One minor non-blocking visual note (`F0`, `concert-grand-piano` fixed lid prop rod at closed `t=0` rest pose) is recorded in `reviews/0_implementation.md`.
