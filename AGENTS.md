# AGENTS.md — 3d-maker

## What this is

A dev-time evolution studio for breeding game assets — not a game and not a general 3D editor. Procedural generators define object families (building, tree, rock, …); a gallery of live variants lets the user select survivors and breed the next generation; winners export as GLB for the sibling three.js games (`city`, `townscaper`, `town_3d`).

Deliberately out of scope, permanently (Blender's job): mesh sculpting, direct vertex editing, UV editing, texture painting, keyframe timeline authoring, rigged-creature generation. Color/texture are parametric. If a task seems to need one of these, the answer is a Blender round-trip, not new scope here.

Stack: Vite + TypeScript (strict) + Vitest, rendering through the sibling `voxel` engine (which keeps Three.js as its own peer); desktop browser only; single primary canvas; the first screen is the working gallery, not a landing page. The model studio extends this scope with examination and genome editing, and its agent harness is a first-class surface rather than a debug hook: the UI may not do anything the harness cannot. See [model studio](docs/design/model-studio.md). Phases: 1 MVP (building + tree families, gallery, inspector, GLB export, library) → 2 props/palettes/import → 3 vehicles/kitbash → 4 AI seeding + creatures via Blender round-trip. Status: approved design only — the app is not yet scaffolded (no `package.json` or `src/` yet).

<!-- FLEET-CANON:BEGIN sha=eaeb98145f81 generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

- Verify visual work visually: capture the rendered result — screenshot, frame, recording — and look at it, because a passing test says nothing about what the pixels do. Work with no visual surface runs headlessly.
- Commit each verified unit of change to `main` without being asked, and push. Gates pass before any commit that touches code; a dependency change re-runs the audit gate.
- A repo chooses its own language and toolchain — Node, Python, and Rust all run here. Each pins its version where its own tooling reads it (`.nvmrc`, `requires-python`, `rust-toolchain.toml`) and names it in Gates, so a version mismatch is not read as a code failure. Node repos baseline at 24; an older major keeps a CI job proving it.
- Runtime model calls are authorized and already paid for — this fleet has one user, with Claude Code and Codex subscriptions — so a program here may call a model at runtime, vision included.
- The top reasoning tier is rationed: spend it only on the hardest problem, or on directing the workhorse tier that does the work — and only at maximum effort or orchestration.
- Two failed attempts at one problem escalate to the hard-problem skill: a search across deliberately different approaches, run to a result rather than to a report. Spending real budget there is authorized — a third pass at the approach that already failed is the expensive mistake. Return the working result, or the strongest proved part with its exact remaining gap.
- High-risk work — persistence/migrations, security/auth, concurrency, money, supply chain, edits that reach sibling repos — escalates to the multi-cli-review skill. That is a review you run yourself, not permission you ask the user for; nothing in this canon requires asking.
- Error messages are a product surface: audit them as a class, including paths the task did not touch. Each names what happened, which input caused it, and what would satisfy it — never a bare `Validation failed`.
- When blocked, hand over the raw artifact — screenshot, rendered page, log line, data row — as soon as the blocker is named rather than after the analysis: your description of it is filtered through the misunderstanding that caused the block, so it cannot contain what you failed to notice.
- Task-run evidence lives only under ignored paths and is deleted once nothing active needs it; it enters Git only when review promotes it into a repository input — a fixture, golden, snapshot, or contract. Tracked docs keep conclusions and provenance only. Blob ceilings for anything promoted: over 256 KiB needs a stated reason, over 512 KiB binary or 1 MiB of anything never enters ordinary Git, and an asset store or LFS needs the user's approval.
- Write prose one line per paragraph (no hard wrapping).
- Keep a devlog: one short dated line per behaviour-changing session in `docs/devlog/summary.md`, newest first, and a section in `docs/devlog/detailed/` for anything a later session could trip over — what was believed and proved false, what a reviewer caught that the author missed, what number moved and from what. It is history, not status. Both shapes are in `../fleet/docs/devlog-template.md`.
- Read `docs/learning/lessons.md` at session start: the one-line index of what this repo has already paid to learn, with each entry's war story and anchor in `lessons-evidence.md`. A lesson lands the session it is learned, anchored to a measurement, commit, or test id; unanchored, it is folklore. When a lesson becomes a gate — a test, a lint rule, a fixed command — delete both halves. Shape: `../fleet/docs/lessons-template.md`.
- Steering compounds: a direction that outlives the immediate task lands that same session — `../fleet/FLEET.md` if fleet-wide, else this repo's `docs/policies/local-rules.md` — and you say where it went.
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
