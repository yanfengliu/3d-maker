# AGENTS.md — 3d-maker

## What this is

A dev-time evolution studio for breeding game assets — not a game and not a general 3D editor. Procedural generators define object families (building, tree, rock, …); a gallery of live variants lets the user select survivors and breed the next generation; winners export as GLB for the sibling three.js games (`city`, `townscaper`, `town_3d`).

Deliberately out of scope, permanently (Blender's job): mesh sculpting, direct vertex editing, UV editing, texture painting, keyframe timeline authoring, rigged-creature generation. Color/texture are parametric. If a task seems to need one of these, the answer is a Blender round-trip, not new scope here.

Stack: Vite + TypeScript (strict) + Vitest, rendering through the sibling `voxel` engine (which keeps Three.js as its own peer); desktop browser only; single primary canvas; the first screen is the working gallery, not a landing page. The model studio extends this scope with examination and genome editing, and its agent harness is a first-class surface rather than a debug hook: the UI may not do anything the harness cannot. See [model studio](docs/design/model-studio.md). Phases: 1 MVP (building + tree families, gallery, inspector, GLB export, library) → 2 props/palettes/import → 3 vehicles/kitbash → 4 AI seeding + creatures via Blender round-trip. Status: approved design only — the app is not yet scaffolded (no `package.json` or `src/` yet).

<!-- FLEET-CANON:BEGIN sha=6a54748e4508 generated from fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

- Work headlessly by default. If only a browser or GUI can finish or verify the task, say why.
- Concurrent sessions share one worktree and one index: commit by explicit pathspec (`git commit -- <files>`), never `git commit -a`, `git add -A`, or `git add .`. (voxel c024b33.)
- Commit each verified unit of change to `main` without being asked, and push. Gates pass before any commit that touches code; a dependency change re-runs the audit gate.
- Toolchain baseline is Node 24. A repo that must keep an older major says so in its Gates section and keeps a CI job proving it.
- Runtime model calls are authorized and already paid for — this fleet has one user, with Claude Code and Codex subscriptions — so a program here may call a model at runtime, vision included.
- The top reasoning tier is rationed: spend it only on the hardest problem, or on directing the workhorse tier that does the work — and only at maximum effort or orchestration.
- High-risk work — persistence/migrations, security/auth, concurrency, money, supply chain, edits that reach sibling repos — escalates to the multi-cli-review skill.
- Error messages are a product surface: audit them as a class, including paths the task did not touch.
- Task-run evidence lives only under ignored paths and is deleted once nothing active needs it; it enters Git only when review promotes it into a repository input — a fixture, golden, snapshot, or contract. Tracked docs keep conclusions and provenance only.
- Git blob ceilings: a new or changed blob over 256 KiB needs an explicit repository-input reason; over 512 KiB binary, or 1 MiB anything, never enters ordinary Git. An external asset store or LFS requires explicit user approval.
- Steering compounds: a direction that outlives the immediate task lands that same session — `../fleet/FLEET.md` if fleet-wide, else this repo's `docs/policies/local-rules.md` — and you say where it went.
- Write prose one line per paragraph (no hard wrapping).
- Reviewer model pins live only in `../fleet/docs/skills/multi-cli-review.md`; a model a product itself calls is pinned in the repo that calls it. Never hardcode a model ID anywhere else.
<!-- FLEET-CANON:END -->

## Gates

None exist yet (no `package.json`). Once the app is scaffolded these are authoritative, all green before any code commit: `npm test` (vitest) · `npm run typecheck` (tsc --noEmit) · `npm run lint` (eslint, zero warnings) · `npm run build`; run the smallest relevant check while iterating. Dependency audit gate: `npm audit --audit-level=high` (full tree and `--omit=dev`).

## Session start

Read `docs/design/spec.md` before substantial work — it is the approved design: goals, non-goals, architecture, phasing.

## Invariants & boundaries

- **Determinism (the load-bearing rule of this repo): same genome → identical mesh, always.** All randomness flows from the genome's seed through `core/rng.ts`; never `Math.random()`, `Date.now()`, or iteration-order-dependent logic in `core/`. Keep a debug guard that builds a genome twice and compares vertex counts/bounds — it catches stray nondeterminism early.
- Layer boundary: `src/core/` is a pure library (genome types/serialization, seeded RNG, mutation/crossover/lineage, one generator file per family) with no DOM, no UI, no storage, and three.js as its only dependency; `src/app/` (gallery, inspector, io, library, ui) obtains meshes only by calling generators — never builds family geometry itself. Genomes are the single source of truth everywhere; meshes are disposable derived artifacts.
- The param schema is the single source of truth per family: it drives inspector controls, mutation bounds, and validation; invalid genomes are impossible by construction (mutation/crossover/UI all clamp to the schema), not caught downstream. No magic numbers — family tuning lives in the schema (ranges/defaults/mutation widths) or `core/` constants, never inline in build functions.
- GLB pipeline: every export embeds the genome JSON in glTF `extras`; re-importing a genome-bearing GLB resumes evolution; imported GLBs without genomes are view-only by design, not an error. Genomes carry a `version` field — schema changes require an explicit migration or a "needs migration" surface, never silent misrendering. Exporter acceptance check: the exported GLB loads and renders in a sibling game via its existing `GLTFLoader` path.
- The gallery uses ONE WebGL renderer with scissored viewports — never one context per tile (browsers cap contexts). Dispose Three.js geometries/materials/textures when a tile rebuilds or a generation is discarded; treat "renderer memory stable across 20 generations" as a testable expectation. A generator that throws renders as an error tile with a reroll button — one broken variant must never kill a generation.
- TDD for core behavior: write the failing contract test first — determinism hash, mutation bounds and locks, crossover validity, genome JSON round-trip, fuzz-build each family over a few hundred seeds — then implement.
- Expose `window.render_game_to_text()` (family, generation number, per-tile genome summaries, selection, library count) and `window.advanceTime(ms)`; the names stay canonical across sibling repos so shared playtest tooling works. Init Three.js with `preserveDrawingBuffer: true` so screenshots capture WebGL.
- Do not ship a visual feature without verifying it in a browser screenshot. Before calling a milestone complete, drive the studio in a real browser and verify: breed a generation; select survivors and breed again; temperature control changes mutation strength; inspector sliders/locks/color pickers rebuild the focused tile; save to library and reload from it; export GLB (and load it in a sibling game); import behaves for both genome-bearing and foreign GLBs; error tile + reroll on a throwing generator.
- Locally high-risk (escalates to multi-cli-review): genome-format versioning/migrations, library persistence, and the GLB export contract.
- Files under 500 LOC — extract helpers or split. 2-space indentation.

## Conventions

- `docs/design/spec.md` is the approved design; update it and any other affected doc in the same task when genome format, export format, architecture, public debug API, or test expectations change.
