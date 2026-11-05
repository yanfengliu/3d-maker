# AGENTS.md — 3d-maker

## What this is

A 3D model showcase: procedural three.js models, each one its own Vite page, behind an `index.html` model registry. `src/index/models.ts` is the single source for that registry — a new model is a new entry there, plus a rollup input for its own page in `vite.config.ts`, plus a poster under `public/posters/`. Every push to main deploys the built site to GitHub Pages.

The two pages are the whole product: `index.html` (the model index, `src/index/`) and `iphone.html` (the iPhone 17 Pro viewer, `src/iphone/`). Each model is built procedurally in code at its real dimensions, from one shared three.js stack; nothing is imported from an asset file.

The evolution-studio / voxel direction is abandoned (owner directive, 2026-09-16). No genome breeding, no variant gallery, no GLB export pipeline, and no dependency on the sibling `voxel` engine. `src/core/` was the evolution engine and was removed with that direction.

Stack: Vite + TypeScript (strict) + Vitest. three.js is the only runtime dependency. Desktop browser first; the index is the landing page, and a viewer page is what a visitor opens from it.

<!-- FLEET-CANON:BEGIN sha=b0a069afa8a5 generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

Shared rules for every repo under `github/`, kept in `../fleet/FLEET.md`; `../fleet/` is fleet's checkout beside this repo's primary checkout. Where a rule gives its reason, use the reason to judge cases the rule does not name; each `[Rn]`'s history is in `../fleet/docs/canon-rationale.md`. This repo's `docs/policies/local-rules.md` may add rules but cannot change these permissions or limits. [R13]

The designated coordinator reads `../fleet/docs/skills/coordinator.md` before planning and after each compaction, and any agent reads that file's "Delegate" section before delegating. Before these kinds of work, read the matching section of `../fleet/docs/work-rules.md`: standing loops and unattended runs; editing skills, agent instructions or rules; handing off or stopping mid-task.

### Permissions

- Commit, merge to main and push without asking. Force-pushing and rewriting history (they destroy history), and deploying and publishing (they reach other people), need the owner's OK. [R14]
- Ask before a major architecture or product change, a new major dependency, a change to a persistent format or a security boundary, or any other consequential action outside this machine, such as posting or sending something. [R8]
- Change fleet rules (FLEET.md, fleet skills and runbooks, agent memory) or add a rule to a repo's `docs/policies/local-rules.md` only when the owner asks, because the owner sets policy. You may add a proposal with its evidence to `../fleet/canon-candidates.md`, but not edit its entries. [R8]

### Sharing the machine

- Other Claude and Codex sessions may be working in this checkout, and you cannot see them. Do anything beyond a quick read in your own worktree, because two sessions in one tree spoil each other's gates and commits. Never revert, overwrite or delete changes you did not make. When resuming, check which worktrees, branches and files already exist. [R7]
- Done means merged to main and pushed: the owner archives sessions, and work left on a branch is lost. Merge on your branch, get the gates passing there, then move main, because other worktrees build on local main. Judge the merged result itself, not a worker's summary. Then remove your worktree and branch, and report where any unmerged work is. [R14]

### Doing the work

- The repo's gates must pass before any commit that touches code. Docs-only changes need content checks and any gate the repo names for docs, not runtime tests or CI waits. [R14]
- Check the thing that should have changed (the file, the page, the number), not just the exit code or a tool's report: both can pass over a defect. Retest a blocker you inherit before repeating it. Never weaken a test or hide a failure to get green. [R9]
- Look at visual and interactive work rendered at full resolution, through the real controls, from fixed and random views, because passing tests say nothing about pixels. Run it headless unless a visible window is needed. [R16]
- Slowness on the critical path, such as a gate rendering on the CPU of a machine with a GPU, is a defect to fix. [R22]
- After pushing code, follow CI to the end; read a failed job's steps before blaming the code, since a billing limit fails jobs before any step runs. [R15]
- If a fix fails twice for one reason, rethink it. After five real repair attempts at one problem, whatever the approach and counting earlier sessions, stop and report, unless the owner set another limit; for a problem that keeps winning, run the search in `../fleet/docs/skills/hard-problem.md`. Stop when the task's criteria are met; do not invent follow-up work. [R11]
- For substantial or high-risk changes, use independent review when available. High-risk includes persistence and migrations, security and auth, concurrency, money, supply chain, and code changes in another repo. Review the exact revision against the task's criteria, and say so when review was unavailable. Fix the findings that matter and have those fixes checked; note minor ones instead of starting another round. `../fleet/docs/skills/multi-cli-review.md` provides the review mechanics. [R10]
- A defect the owner reports gets a test for its whole class and an entry in `docs/learning/defect-register.md`, because a fix without a check tends to come back. [R17]
- Sessions run long: take new requests in the same session, and never hand off to a new session to shed context. Split work expected to need more than about 200k tokens of context into milestones, each merged to main. [R6]

### Records, sized to the work

- Read `docs/learning/lessons.md` at session start; it lists this repo's known traps, and its header says how to add one. [R18]
- Work that spans sessions, has several agents writing, or gets an independent review keeps its plan and review records in `docs/work/` (`../fleet/docs/work-docs.md`) and adds a dated line to `docs/devlog/summary.md` (`../fleet/docs/devlog-template.md`) when it lands. Other work needs neither. [R24]
- Raw output (logs, captures, screenshots) stays in ignored folders. Never commit a binary over 512 KiB or any file over 1 MiB; LFS needs the owner's OK. [R23]

### Style and environment

- Plain words; one line per paragraph, no hard wrapping. A report says what changed, how it was checked (including any check skipped or failed) and what is not done. [R25]
- Node 24 is the baseline. Products pin the model IDs they call in their own repo, and nowhere else. Reviewer model pins live only in `../fleet/docs/skills/multi-cli-review.md`. Runtime model calls are allowed and paid for; make per-item calls one-shot, not agent sessions. [R28, R29]
<!-- FLEET-CANON:END -->

## Gates

Each line below is a gate and what it checks; [docs/policies/gates.md](docs/policies/gates.md) holds the rest of each, with its bounds and how it measures.

Node 24 (`.nvmrc`; CI reads it via `node-version-file`). All of these are authoritative, and all green before any commit that touches code:

- `npm test` — vitest. 57 tests in 11 files.
- `src/repo-conventions.test.ts` — the repo's own rules as a gate, because two of them were prose only and were broken repeatedly.
- `npm run check:finishes` — the look gate, and the only check here that measures pixels. **Local gate**: it needs a running dev server (`SHOT_BASE`, default `http://localhost:5199`) and Chrome (`SHOT_CHROME`), so it is not part of `npm run verify`, and CI runs no pixel check at all beyond `npm run build`.
- `npm run typecheck` — `tsc --noEmit`, strict.
- `npm run lint` — eslint with `--max-warnings 0`, so zero warnings, not merely zero errors.
- `npm run build` — `tsc --noEmit` then `vite build`; emits both pages into `dist/`.
- `npm run verify` — the four above in one command. Use it before reporting anything green.

Run the smallest relevant check while iterating. Dependency audit gate, re-run on every dependency change: `npm audit --audit-level=high` and `npm audit --omit=dev --audit-level=high` — both must report `found 0 vulnerabilities`.

## Session start

Read `docs/design/spec.md` before substantial work — it is the showcase spec: the two pages and their query contracts, the registry-driven index, the capture and deploy pipeline, and how to add a model end to end.

## Invariants & boundaries

- **The screenshot contract is what the capture tooling depends on.** Every viewer page honors `?shot=1`: no auto-rotate and no entrance animation, the exact preset camera on the first presented frame, and `window.__shotReady = true` only after at least 5 rendered frames. Where the page has them, `?view=` and `?color=` select the presets. `?noui=1` hides the viewer chrome so a poster captures the model alone. A new viewer page either honors this contract or `scripts/capture-shots.mjs` cannot capture it.
- The renderer is created with `preserveDrawingBuffer: true`. Without it headless Chrome captures a blank canvas, so the whole poster pipeline silently produces empty images.
- **Visual work is verified visually, never assumed from a passing test.** Capture through `scripts/shoot-iphone.ps1` or `scripts/capture-shots.mjs` and look at the PNG yourself at native resolution. `SHOT_PAGE` picks the page (`iphone.html` by default, `index.html` for the index), `SHOT_LIST` the `view:color[:extra]` shots, `SHOT_W`/`SHOT_H` the viewport. A green unit test says nothing about what the pixels do.
- **Claiming fidelity to a real object requires a feature-by-feature audit, not an overall read.** The eight presets are a starting frame, not the sweep: `scripts/sweep-iphone.mjs` continues from any preset and orbits/zooms by dispatching trusted mouse input through the page's real OrbitControls — arbitrary angles and macro range through the real input path, never by assigning a camera pose. Audit each feature against reference photos at 1:1 crops: chirality (a mirrored part reads fine until you compare it), profiles and edge breaks, counts (bores, bands), silhouettes, materials. Six rounds of "it reads like an iPhone" shipped a mirrored Apple logo, a machined plateau edge where the real bump is a forged roll, and a USB-C port that pierced the whole body; every one of those was visible in a 1:1 crop and invisible in the overall read.
- **A geometry change's author renders and inspects their own work before handing it off.** Gates cannot see z-fighting between exactly coplanar faces, a self-intersecting outline, a cap facing the wrong way, or a part swept around the wrong footprint — a round-6 plateau build passed 22 green tests while rendering black gashes. Unit tests bound the numbers; only a frame shows the surface.
- **A reviewer lane is unavailable only when a probe says so.** Before a handoff or a final report claims no independent review is available, run `node scripts/review-lanes.mjs` and quote its output. Availability is smoke-tested, never remembered: the script probes the `codex` and `claude` lanes with a prompt that requires reading a file in this repo, and prints a status, a duration, and the first decisive error line per lane. `ok` means the lane is reachable — a CLI that started, took a piped prompt, and read the tree — and says nothing about review quality or which model answered, so the output is quoted as evidence rather than summarized into a memory. Both lanes were once declared unavailable from an unverified recollection while the CLIs were installed and each error took one command to see.
- **A measurement must come from the code on disk.** Two ways this fails silently, both hit in one round: (a) a worker patched the running app through a repo-root `.env` read via `import.meta.env`, so every later capture on that dev server rendered the patched map rather than the committed one — never add an env read to `src/` and never use `.env` as a control channel (`.env` and `.env.*` are gitignored); (b) the Vite dev server served **stale revisions** of an edited module, so four consecutive edits produced four byte-identical measurements and a whole ladder of results was invalid with no error. `scripts/sweep-iphone.mjs` now fingerprints the served bytes of every module the page loaded, twice per sweep, and exits 2 on a mismatch; every passing frame prints `served <digest>` plus a per-module `revision` line, so a later session can tie a frame to the revision it came from. The guard's own bound is in its header: it hashes the *transform*, so a stale server-side transform cache serves both reads identically and passes — it guards the page, not the server.
- **No runtime network assets.** Every model is procedural and every texture, environment, and glyph is embedded or generated in code — no HDRIs, fonts, images, or meshes fetched at runtime. That is what keeps the pages self-contained under the GitHub Pages base path.
- Files under 500 LOC — extract helpers or split. 2-space indentation.

## Conventions

- The docs that change with a model addition land in the same task: the registry entry in `src/index/models.ts`, the poster under `public/posters/`, the model list in `docs/design/spec.md`, and a dated line in `docs/devlog/summary.md`.
