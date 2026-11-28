# Review 0: implementation

## Target

Repository `3d-maker`, branch `swarm-architect-f6596a0d`, commit `c9e4470c124221cad43a4222a2e96f7259c4cdce` (plus pre-merge independent audits of all 5 domain author branches: `swarm-props-home-ce552947@1a51c2e`, `swarm-worlds-built-1bc5372f@563ff51`, `swarm-vehicles-life-1f00d012@9b5c141`, `swarm-props-culture-9d8fc11c@ecc99e2`, `swarm-chars-gear-06a2d83d@b7212cf`). Scope: lazy expansion architecture (`src/models/expansion/*`, `src/models/collections/meta.ts`, `src/models/studio-build.ts`, studio/data/capabilities wiring), all 25 expansion packs (500 new procedural 3D models), 612-entry `src/models/variations.lock.json`, 606 `public/previews/*.webp` posters, `public/agent-schema.json`, and updated docs/tests.

## Reviewers and coverage

- `verifier-craft` (independent read-only craft, silhouette diversity, collision, and convention verifier across all 5 domain branches): full coverage of 500/500 objects across 25 packs (board `#76`, `#79`, `#82`, `#85`, `#86`).
- `verifier-e2e` (independent read-only architecture, bundle, runtime, and visual E2E verifier on clean detached checkouts of Phase 1 `07adb87` and Phase 2 `c9e4470`): full coverage of static isolation audits, `npm run verify`, `npm run check:studio:ci`, full `npm run check:studio`, custom 10-pack headless-Chrome dynamic lazy-load/GLB round-trip E2E, and multi-angle `npm run inspect:model` PNG inspection across 9 representative new models spanning all 8 browse categories (board `#59`, `#97`).
- No missing coverage or abstentions.

## Reports

### verifier-craft

ALL 5/5 domain branches (500/500 unique procedural objects across 25x20 packs) verified & cleared for Phase 2 integration (board `#86`).

`chars-gear` details: 100 unique objects (`characters-civilian` CC-01..20, `characters-adventure` CA-01..20 incl. `CA-08` `clockwork-automaton` with `human=false`, `handheld-tools` HT-01..20, `handheld-fantasy-scifi` HX-01..20, `attachments-wearables` AX-01..20), 26 files strictly under `src/models/expansion/` (max 394L, 2-space indent, zero env/URL reads, clean git status), 5 zero-Three `meta/*.ts` matching packs, bounds 0.653m–2.912m, 100/100 unique geometry signatures (manually inspected all 10 `-a`/`-b` builders), 19-bone `Suit` `SkinnedMesh` + `LeftArm` vertex deformation + bone-mounted accessories on all 40 characters, independent `audit-author.mjs` + Vitest 444/444 (`chars-gear.test.ts` + `src/repo-conventions.test.ts`) + `tsc --noEmit` + `eslint src/models/expansion --max-warnings 0` all green.

Cross-branch 500/500 audit ledger summary (zero intra-branch, cross-branch, or locked-106 ID/code collisions — 500 unique IDs, 500 unique codes, 25x20 packs, 500/500 unique geometry signatures, every `.ts` file <= 500L, zero Three.js imports in `meta/*.ts`, all 5 branches green on Vitest/tsc/eslint & clean git status):
1. `props-home` (`#76`): `swarm-props-home-ce552947` @ `1a51c2efd168ba4fbd7d8bcebc76e8e441a462ac` (bounds 0.599m–2.680m, max 336L, Vitest 404/404)
2. `worlds-built` (`#79`): `swarm-worlds-built-1bc5372f` @ `563ff51f8ce1d92fe5b06db126e27ff5ec03a86d` (bounds 1.377m–4.547m, max 457L, Vitest 204/204)
3. `vehicles-life` (`#82`): `swarm-vehicles-life-1f00d012` @ `9b5c141710b78736b0c4da11abf42efe7685f572` (bounds 0.608m–4.008m, max 389L, Vitest 404/404)
4. `props-culture` (`#85`): `swarm-props-culture-9d8fc11c` @ `ecc99e2a82facd5218a0d65ae3a44d482be72c18` (bounds 0.720m–3.500m, max 452L, Vitest 404/404)
5. `chars-gear` (`#86`): `swarm-chars-gear-06a2d83d` @ `b7212cf23739423020acc3dd82226c89d8ac88c5` (bounds 0.653m–2.912m, max 394L, Vitest 444/444)

### verifier-e2e

Phase 2 E2E verified (`c9e4470c124221cad43a4222a2e96f7259c4cdce` on `swarm-architect-f6596a0d`, 606 catalog models, startup bundle 132.9 KiB entry / 290.7 KiB total gzip; board `#97`).

Independent verification summary (clean detached checkout of `c9e4470`; architect worktree clean, temporary verify worktree removed):
1. Catalog & lockfile: 606 unique originals (606 unique IDs/codes/names in `dist/catalog.json`, `sdk.catalog`, `public/agent-schema.json`, and `window.forgeStudio.listTemplates()`). `src/models/variations.lock.json` is 490,731 B (< 1 MiB) with 612 locked variations (+500 added, 0 deletions, 0 mutations to original 112 hashes vs `main`). `docs/design/spec.md` & `docs/devlog/summary.md` updated.
2. Repo conventions & isolation: 0/298 files under `src/` and `scripts/` exceed 500 lines (max 500: `src/studio/viewport.ts`); 0 Three.js/pack imports across all 27 `meta` files; 0 non-test static imports of `models/index`, `expansion/all`, `expansion/packs`, or `collections/index` from studio/data/ui/capabilities/imports/animation; zero weakened tests in `c9e4470` diff.
3. Build, bundle & SDK: `npm run verify` passed 100% — Vitest 45/45 files (8,033/8,033 tests), strict `tsc --noEmit`, zero-warning `eslint src --max-warnings 0`, app + SDK builds, and `check:bundle` (entry `index-XXJzCmg3.js` 132.9 KiB <= 175 KiB, total initial JS 290.7 KiB <= 360 KiB, all 26 lazy builder chunks split cleanly, `ensureAllExpansionPacks` absent from `index-*.js`, synchronous `dist/studio-sdk.js` verified).
4. Previews: 606/606 `public/previews/*.webp` present with 0 missing/extra (4.6–25.4 KiB each, all >= 1 KB and < 512 KiB); spot-checked 4 `.webp` posters visually — crisp and centered.
5. Runtime & dynamic browser E2E: `npm run check:studio:ci` and full `npm run check:studio` (incl. all 606 SDK models in Chrome, browsing, framing, capabilities, remixes, inventory, GLB round-trips) both passed. Custom headless-Chrome E2E across 10 lazy packs (`collections-base` + 9 expansion packs spanning all 8 browse categories) verified zero builder chunks at boot, on-demand chunk fetch per pack, live rigged part posing + detachable toggling + color/detail edits, GLB export + `GLTFLoader` round-trip (incl. 87-clip humanoid `viking-shieldmaiden`), saved-card async thumbnail render after reload, Originals search/click, zero `pageerror`s, and zero 404s.
6. Visual craft (`npm run inspect:model` across Perspective/Front/Back/Top on 9 new models covering all 8 categories & 5 domains: `concert-grand-piano`, `vinyl-record-console`, `kyoto-tiered-pagoda`, `ladder-fire-engine`, `african-savanna-elephant`, `weeping-riverside-willow`, `viking-shieldmaiden`, `dwarven-warhammer`, `articulated-mechanical-wings`): inspected PNGs directly — strong silhouette diversity, grounded bases, zero floating parts, zero Z-fighting (minor non-blocking note: `concert-grand-piano` fixed lid prop rod pokes through closed lid at `t=0` rest pose).

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F0 | `concert-grand-piano` fixed lid prop rod pokes through the closed piano lid at `t=0` rest pose (reported by `verifier-e2e` during 9-model multi-angle visual inspection). | Accepted as minor non-blocking visual polish note; passes all craft/geometry/animation invariants and does not block release. | Optional future append-only variation or audited `--repair` on `concert-grand-piano@default` if desired. |

## Verification

- `npm run verify` on `c9e4470`: passed (45/45 Vitest files, 8,033/8,033 tests, strict `tsc --noEmit`, `eslint src --max-warnings 0`, production + SDK builds, `check:bundle` 132.9 KiB entry / 290.7 KiB initial gzip JS).
- `npm run check:studio:ci` and full `npm run check:studio` on `c9e4470`: both passed in headless Chrome (including all 606 SDK models).
- Custom 10-pack headless-Chrome dynamic lazy-load and GLB round-trip E2E on `c9e4470`: passed with zero `pageerror`s and zero 404s.
- Multi-angle `npm run inspect:model` visual inspection across 9 representative new models covering all 8 browse categories and all 5 domains: passed with 1 minor non-blocking visual note (`F0`).

## Round outcome

Approved for merge to `main` at commit `c9e4470c124221cad43a4222a2e96f7259c4cdce`. Zero blocking findings; 1 minor non-blocking visual note (`F0`) recorded.
