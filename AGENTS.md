# AGENTS.md

## Agentic working style

Treat the rest of this file as defaults, not rigid law. The right approach is the one that fits the task in front of you — when a rule here would make the work worse, deviate and say why. Hard "always use X / never use Y" mandates go stale and silently mislead faster than principles do; optimize for the outcome (correct, verified, readable, fast to create with) over any prescribed mechanism.

Scale the approach to the task: trivial fixes → just do them; substantial work (multi-file features, audits, broad refactors) → orchestrate with parallel subagents/workflows, verify adversarially, and keep the main thread for decisions and integration. This does not lower the verification bar — tests still pass, diffs still get reviewed, docs still stay current.

## Session start

Read `docs/design/spec.md` and, once they exist, `PROGRESS.md` and `docs/architecture/architecture.md` before starting work.

## Continuing through plans

- No stopping points within a multi-task plan. Work through all N tasks continuously; do not ask whether to keep going. Harness reminders are administrative noise, not stop signals.
- **Never manage context yourself — auto-compaction handles it. In a loop, just keep pushing progress.** Do NOT stop, checkpoint, hand off "for fresh context", or ask "should I keep going / do you want to check first" because the conversation is getting long. The harness auto-summarizes when needed and work continues seamlessly, so context length is never a reason to pause, wrap up, or offer the user a checkpoint. When one increment ships (gates green + commit + push + docs), immediately start the next one in the same turn. Only ever stop for (a) a genuine blocker, (b) a real user decision that changes direction, or (c) the user explicitly saying stop. Reporting shipped milestones is fine; turning that report into a "want me to continue?" gate is not. This rule was reinforced 2026-07-05 after the user objected — again — to a mid-marathon "want me to keep rolling or check first?" offer.
- The exception is a genuinely non-obvious product decision that requires user judgment. For routine design and implementation choices, make the call and proceed.
- This rule was established 2026-05-01 after the user objected sharply to mid-stream stoppage during the investing-tool implementation. The same rule lives in every sibling repo's AGENTS.md.
- Keep `PROGRESS.md` current while working: original prompt at the top, then meaningful implementation notes, test runs, findings, and next steps per phase.

## Project intent

3d-maker is a **dev-time evolution studio** for breeding game assets, not a game and not a general 3D editor. Procedural generators define object families (building, tree, rock, …); a gallery of live variants lets the user select survivors and breed the next generation; winners export as GLB for the sibling three.js games (`city`, `townscaper`, `town_3d`).

Deliberately out of scope, permanently (Blender's job): mesh sculpting, direct vertex editing, UV editing, texture painting, keyframe timeline authoring, rigged-creature generation. Color/texture are parametric. If a task seems to need one of these, the answer is a Blender round-trip, not new scope here.

The approved design lives at `docs/design/spec.md` — read it before substantial work. Phases: 1 MVP (building + tree families, gallery, inspector, GLB export, library) → 2 props/palettes/import → 3 vehicles/kitbash → 4 AI seeding + creatures via Blender round-trip.

## Stack and layout

Vite + TypeScript (strict) + Three.js + Vitest. Desktop browser only; single primary canvas; the first screen is the working gallery, not a landing page.

```text
src/
  main.ts                 # Browser entry point
  core/                   # Pure library: genomes, evolution, generators — no DOM, no UI, no storage; only dep is three.js
    genome.ts             # Genome types, serialization, version field
    rng.ts                # Seeded RNG (all randomness flows from genome seeds)
    evolution.ts          # Mutation, crossover, population/lineage model
    families/             # One generator per file (building.ts, tree.ts, ...)
  app/                    # Vite app shell, render loop, wiring
    gallery/              # Breeding grid: ONE renderer, scissored viewports
    inspector/            # Controls auto-generated from param schemas
    io/                   # GLTFExporter/GLTFLoader, genome-in-extras round-trip
    library/              # IndexedDB favorites, JSON collection export/import
    ui/                   # Toolbar, toasts, panels (DOM)
tests/                    # Vitest suites (core invariants, fuzz builds)
docs/                     # Specs, architecture, progress artifacts
```

Boundary rules: `core/` must not import from `app/`, touch the DOM, or persist anything. `app/` obtains meshes only by calling generators — never builds family geometry itself. Genomes are the single source of truth everywhere; meshes are disposable derived artifacts.

## Commands

Once the app is scaffolded, keep these authoritative:

```bash
npm run dev        # Vite dev server
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run lint       # eslint, zero warnings
npm run build      # typecheck + vite build
```

Run the smallest relevant check while iterating. All four gates (`test`, `typecheck`, `lint`, `build`) must pass before declaring a task done or committing.

## Core rules

- **Determinism invariant (the load-bearing rule of this repo): same genome → identical mesh, always.** All randomness flows from the genome's seed through `core/rng.ts`. Never `Math.random()`, `Date.now()`, or iteration-order-dependent logic in `core/`. Keep a debug guard that builds a genome twice and compares vertex counts/bounds — it catches stray nondeterminism early.
- **The param schema is the single source of truth** per family: it drives inspector controls, mutation bounds, and validation. Invalid genomes must be impossible by construction (mutation/crossover/UI all clamp to the schema), not caught downstream.
- Test-driven development for core behavior: write the failing contract test first (determinism hash, mutation bounds and locks, crossover validity, genome JSON round-trip, fuzz-build each family over a few hundred seeds), then implement. Test the contract, not the implementation.
- For each desired change, make the change easy, then make the easy change.
- Before implementing a non-trivial change, write a plan. (Trivial changes: just make them, per the working-style preamble.)
- Before broad implementation work, write or update the relevant docs under `docs/`.
- No magic numbers — family tuning lives in the param schema (ranges/defaults/mutation widths) or `core/` constants files, never inline in build functions.
- Files under 500 LOC — extract helpers or split. 2-space indentation. `import type` for type-only imports. Remove dead code and duplicated logic.
- Do not ship a visual feature without verifying it in a browser screenshot.
- Expose `window.render_game_to_text()` (family, generation number, per-tile genome summaries, selection, library count) and `window.advanceTime(ms)` for automated playtesting; the names stay canonical across sibling repos so shared playtest tooling works, even though this is a tool rather than a game. Init Three.js with `preserveDrawingBuffer: true` so screenshots capture WebGL.
- Adversarially review non-trivial changes before declaring them done — default to the in-process Workflow: fan out independent reviewer agents over the diff (correctness, determinism, three.js-resource, UX lenses) plus verifiers that try to *refute* each finding against the live code, fix real findings, re-review until reviewers only nitpick. For **high-risk** changes — genome-format versioning/migrations, library persistence, the GLB export contract, or anything with data-loss or supply-chain blast radius — *also* run the multi-CLI review (Codex + Claude, per the Code review section) and record the synthesized findings and disposition in `PROGRESS.md`. Don't rationalize your way out of the adversarial pass on non-trivial work; if you skip a review that should have run, run it post-hoc before moving on.
- Verify reviewer claims against the codebase before acting on them: grep or read the actual file before merging a fix — a reviewer might be working from training knowledge, a stale snapshot, or a hallucinated symbol. What gets verified is more important than who said it.
- Record non-obvious failure modes in `docs/learning/lessons.md` with evidence anchors (what surfaced it, fix commit, test that pins it, behavior delta).

## Genome and GLB pipeline rules

- Every export embeds the genome JSON in glTF `extras`; re-importing a genome-bearing GLB resumes evolution. Imported GLBs without genomes are view-only by design, not an error.
- Genomes carry a `version` field. Schema changes require an explicit migration or a "needs migration" surface — never silent misrendering.
- Acceptance check for exporter changes: the exported GLB actually loads and renders in a sibling game (`city`, `townscaper`, or `town_3d`) via their existing `GLTFLoader` path.
- The gallery uses **one** WebGL renderer with scissored viewports — never one context per tile (browsers cap contexts).
- Dispose Three.js resources deliberately: when a tile rebuilds or a generation is discarded, dispose geometries/materials/textures. Regenerating whole populations makes leaks compound fast; treat "renderer memory stable across 20 generations" as a testable expectation.
- A generator that throws renders as an error tile with a reroll button — one broken variant must never kill a generation.

## Tool testing loop

For meaningful behavior changes:

1. Implement a small behavior with its headless test.
2. Start the dev server and drive the studio in a real browser (preview tools / Playwright).
3. Inspect `render_game_to_text()` output and screenshots; verify controls, visuals, and text state agree.
4. Fix and repeat.

Interactions to verify before calling a milestone complete: breed a generation, select survivors and breed again, temperature control changes mutation strength, inspector sliders/locks/color pickers rebuild the focused tile, save to library and reload from it, export GLB (and load it in a sibling game), import behaves for both genome-bearing and foreign GLBs, error tile + reroll on a throwing generator.

## Code review

The default adversarial pass for non-trivial work is the in-process Workflow (see Core rules). Run the multi-CLI review (Codex + Claude, each reviewing independently) on high-risk changes and full-codebase audits. All multi-CLI mechanics — current review model pins, exact commands, sandbox flags, the background-run/poller pattern, the Codex output-extraction recipe, and CLI failure modes — live in the fleet-canonical runbook `../loop-ops/docs/skills/multi-cli-review.md` (review pins bump there, once for the whole fleet); read it before every multi-CLI session. `.claude/skills/multi-cli-review/SKILL.md` is this repo's thin stub for repo-specific notes.

Policy for every reviewer, in-process subagent or CLI:

- **Reviewers MUST read the codebase to ground their claims.** Every review prompt must include the directive: *"Verify each claim in the plan/diff against the live codebase — grep for the symbols, function signatures, column names, and file paths it references; do not approve based on prompt text alone."* Convergence is measured by *substantive finding count*, not *vote count* — a HIGH defect from one reviewer outweighs APPROVED from two.
- Aspects to review:
  1. Design — easily scales, generalizes, debugs, can be understood and reasoned about, stays lean.
  2. Test coverage.
  3. Correctness — in this repo especially the determinism invariant, genome-schema validity, and Three.js resource disposal.
  4. Clean code, typing, efficiency, memory leaks. No duplicated logic, inconsistent implementations, violation of boundaries. File size: keep every file under 500 LOC (hard ceiling 1000) — split god-objects by lifecycle/role. Prefer composition over inheritance. Clean up dead code. Do not change app mechanics or behavior unless explicitly asked.
- **Enrich the baseline prompt** (quoted in the fleet-canonical runbook) **with task-specific context** — the change's intent, prior-iteration findings to verify, files to focus on, and an anti-regression checklist. The bare baseline returns generic feedback; useful reviews need the specifics.
- **Keep model IDs current.** Use the latest-family alias when a command is meant to track the newest model (for example, `opus[1m]`); bump pinned strings whenever a more capable fixed variant ships (e.g. `claude-opus-5-0[1m]`, `gpt-5.6`). Verify with a one-line smoke test (`echo "ok" | <cli> ...`) before committing the bump — silent fallback to an older model is the failure mode to guard against. Review-command pins live in the fleet-canonical runbook `../loop-ops/docs/skills/multi-cli-review.md` and bump there, once for the whole fleet.

## Dependency-change protocol

Whenever `package.json` dependency surface changes: re-resolve the lockfile with `npm install`; run `npm audit --audit-level=high --omit=dev` and `npm audit --audit-level=high`; a new HIGH/CRITICAL CVE is a blocker unless documented with reason and expiry; mention the audit result in the commit message.

## Git

- Commit directly to `main` — solo-developer repo; each coherent, self-contained unit lands as its own commit with all four gates green.
- Commit early and often; stage only the coherent unit of work.
- Commit durable docs that guide future work. Never revert user changes unless explicitly requested.
- Push to remote at the end of every task — if local commits are ahead, push; don't leave the remote behind.

## Documentation

Read before changing the relevant system:

- `docs/design/spec.md` — approved design: goals, non-goals, architecture, phasing.
- `PROGRESS.md` — current status and next steps.
- `docs/architecture/architecture.md` (once it exists) — code boundaries and data flow.

Update docs in the same task when genome format, export format, architecture, public debug API, or test expectations change. Don't wrap lines in docs; new lines start new paragraphs.
