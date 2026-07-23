# AGENTS.md — 3d-maker

## What this is

A dev-time evolution studio for breeding game assets — not a game and not a general 3D editor. Procedural generators define object families (building, tree, rock, …); a gallery of live variants lets the user select survivors and breed the next generation; winners export as GLB for the sibling three.js games (`city`, `townscaper`, `town_3d`).

Deliberately out of scope, permanently (Blender's job): mesh sculpting, direct vertex editing, UV editing, texture painting, keyframe timeline authoring, rigged-creature generation. Color/texture are parametric. If a task seems to need one of these, the answer is a Blender round-trip, not new scope here.

Stack: Vite + TypeScript (strict) + Vitest, rendering through the sibling `voxel` engine (which keeps Three.js as its own peer); desktop browser only; single primary canvas; the first screen is the working gallery, not a landing page. The model studio extends this scope with examination and genome editing, and its agent harness is a first-class surface rather than a debug hook: the UI may not do anything the harness cannot. See [model studio](docs/design/model-studio.md). Phases: 1 MVP (building + tree families, gallery, inspector, GLB export, library) → 2 props/palettes/import → 3 vehicles/kitbash → 4 AI seeding + creatures via Blender round-trip. Status: approved design only — the app is not yet scaffolded (no `package.json` or `src/` yet).

## Fleet constitution

- Work headlessly by default; go non-headless only when nothing else can complete or verify the task, and say why.
- These rules are strong defaults, not law: when one would make the work worse, deviate and say why.
- Scale the approach to the task: trivial changes directly; substantial work as explore → plan → implement → verify, with subagents when work is genuinely parallel.
- Delivery boundary: each minimal coherent verified unit is reviewed, staged (scoped files only), and committed promptly — never commit failing or partial work as a checkpoint. Commit to `main`; push at the end of every task.
- Concurrent sessions share one worktree and one index: commit by explicit pathspec (`git commit -- <files>`), never `git commit -a`, `git add -A`, or `git add .` — a sweeping commit captures whatever another session has staged. (Evidence: voxel c024b33, 2026-07-17.)
- The repo's gates must pass before every commit that touches code; doc-only changes need a self-reviewed diff.
- Review: self-review trivial changes; adversarially review non-trivial ones — independent agents that try to refute the change against the live code. High-risk work (persistence/migrations, security/auth, concurrency, money, supply chain, edits that reach sibling repos) escalates to the multi-cli-review skill. Reviewers must read the live code; verify reviewer claims against the codebase before acting on them; substantive findings outweigh approval votes.
- Dependency changes: re-resolve the lockfile, run the repo's audit gate (a new HIGH/CRITICAL is a blocker), and note the audit result in the commit message.
- Docs are part of the change: update every affected surface in the same commit; write prose one line per paragraph (no hard wrapping); never reference or mandate files that don't exist.
- Bias to continue: work through the whole accepted plan without mid-plan check-ins; context management is the harness's job, never a reason to stop. Stop only for a genuine blocker, a direction-changing decision, or an explicit stop. (Established 2026-05-01; reinforced 2026-07-05.)
- Error messages are a product surface: whenever code rejects, fails, or throws, say what happened, which specific input caused it, and what would satisfy it — never a bare `Validation failed`, `invalid input`, or a silent boolean false. A diagnostic that forces a human or an agent to read the source to learn why is itself a defect; fix the message in the same change as the bug. Applies equally to validators, CLI output, and assertion text. (Established 2026-07-18, after city's `placeService` answered five rejected placements with only "Validation failed".)
- Steering compounds: when the user gives a direction that generalizes past the immediate task, land it in the canon in that same session — here if it is fleet-wide, else the repo's AGENTS.md or lessons file — so the next run inherits it instead of relearning it, and say what was captured and where. (Established 2026-07-18.)
- Reviewer model pins live only in `../loop-ops/docs/skills/multi-cli-review.md`, and loop-work model directives in `../loop-ops/DIRECTIVES.md` — never hardcode model IDs anywhere else.
- Lessons files (`docs/learning/lessons.md` where present) require evidence anchors — source, fix commit, test id, behavior delta; unanchored lessons are folklore.
- Recursive loop: before running or driving a pass, read `../loop-ops/docs/skills/recursive-playtest.md`; before building loop machinery, read `../loop-ops/docs/skills/building-recursive-loop.md`.

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
- Files under 500 LOC — extract helpers or split; 2-space indentation; `import type` for type-only imports; remove dead code and duplicated logic.

## Conventions

- `docs/design/spec.md` is the approved design; update it and any other affected doc in the same task when genome format, export format, architecture, public debug API, or test expectations change.
- `.claude/skills/multi-cli-review/SKILL.md` is this repo's stub; mechanics and pins live in the fleet runbook.
