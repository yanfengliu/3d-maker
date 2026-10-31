# AGENTS.md — 3d-maker

## What this is

A 3D model showcase: procedural three.js models, each one its own Vite page, behind an `index.html` model registry. `src/index/models.ts` is the single source for that registry — a new model is a new entry there, plus a rollup input for its own page in `vite.config.ts`, plus a poster under `public/posters/`. Every push to main deploys the built site to GitHub Pages.

The two pages are the whole product: `index.html` (the model index, `src/index/`) and `iphone.html` (the iPhone 17 Pro viewer, `src/iphone/`). Each model is built procedurally in code at its real dimensions, from one shared three.js stack; nothing is imported from an asset file.

The evolution-studio / voxel direction is abandoned (owner directive, 2026-09-16). No genome breeding, no variant gallery, no GLB export pipeline, and no dependency on the sibling `voxel` engine. `src/core/` was the evolution engine and was removed with that direction.

Stack: Vite + TypeScript (strict) + Vitest. three.js is the only runtime dependency. Desktop browser first; the index is the landing page, and a viewer page is what a visitor opens from it.

<!-- FLEET-CANON:BEGIN sha=e54f2a9ae007 generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

Reasons and evidence per `[Rn]`: `../fleet/docs/canon-rationale.md`. `../fleet/` is fleet's checkout beside the repo's primary checkout, also from a worktree. The designated coordinator reads `../fleet/docs/skills/coordinator.md` before planning and after each compaction, and any agent reads that file's "Delegate" section before delegating. Before these kinds of work, read the matching section of `../fleet/docs/work-rules.md`: visual and interactive work; games, simulations and research; measuring, debugging and slow steps; writing error messages; toolchains, dependencies and model calls; standing loops and unattended runs; pushing executable changes; a user-reported defect; editing skills, agent instructions or rules; run output and files over 256 KiB; handing off or stopping mid-task.

### Fleet Orchestration Policy

Deliver the requested outcome with verified correctness, coherent architecture and minimal necessary complexity. Optimize useful progress, not agent count, code volume or maximum reasoning. Adapt rigor to risk. This policy grants no new permissions or capabilities. [R1]

**Roles.** Only an explicitly designated agent coordinates; each scope has one accountable integration owner. [R2]

Workers own bounded outcomes and local implementation decisions. [R3]

Inspect instructions, code, docs, tree state and active tasks; set outcome, non-goals, acceptance criteria, dependencies and verification; settle ambiguity with evidence and reversible defaults. [R4]

**Session size** (owner directives, 2026-09-23 and 2026-10-22). Sessions run long: take new requests as separate assignments in the same session, and never hand off to a successor session to shed context; auto-compaction carries the session. Split tasks expected to exceed about 200k context tokens into milestones within that budget, each committed and merged to main once green. Milestones are task boundaries; a compaction never justifies wrapping up or handing off. [R6]

**Coordinate safely.** Beyond a trivial read, each session or agent defaults to its own worktree; serialize overlapping writes only when none is available, and say why. Finish each bounded increment in its session: merge to main, push, then `git worktree remove`, remove completed task-owned branches and unneeded temporary files, and explicitly transfer the ownership and location of still-needed resources. Report any merged worktree left and its location as a defect. Never overwrite or discard another participant's work. On resumption, first inspect surviving worktrees, artifacts and task status, assuming nothing survived until checked; recover what exists and preserve unfinished work. [R7]

Workers act autonomously in scope; escalate cross-task interfaces, persistent formats, security boundaries, major dependencies and scope changes to the coordinator for resolution within the approved mandate. Unapproved major architecture or product changes and consequential external actions need human authorization. Fleet rules (FLEET.md, the fleet's skills and runbooks, canon candidates, and agent memory) change only when the owner asks (owner directive, 2026-10-28). Agents propose changes instead of making them. The one exception: they may add a proposal to `../fleet/canon-candidates.md`, with the lesson, its evidence and the rule it would change (owner directive, 2026-10-29). They never change, promote or delete an entry: the owner decides each one, and the session the owner asks makes the change. Never reset consumed allowances. [R8]

**Implement and verify.** Inspect, implement a coherent increment, check, diagnose, fix, recheck. Preserve architecture; no unrelated rewrites, speculative abstractions or unnecessary dependencies. Implement when requested. Use task-appropriate evidence and baselines; prototype uncertain ideas before generalizing. Never weaken tests or conceal failures to claim success. Docs-only work uses content and version checks; skip runtime tests and CI waits. [R9]

During authorized work and within scope and budget, proactively improve products and the task's orchestration, learn from recorded outcomes and propose improvements to fleet rules. Read `../fleet/docs/skills/self-improvement/SKILL.md` when proposing a fleet-rule change or turning a mistake into a gate (owner directive, 2026-10-29). [R33]

Obtain independent, preferably read-only review for substantial or high-risk changes when available. Review the exact revision against acceptance criteria. Report unavailable review; fix justified findings, rerun affected checks, and obtain focused re-review when fixes invalidate earlier review. [R10]

**Integrate, report, and stop.** Reassess after two failures for one reason. Unless another budget is set or the user authorizes more, cap automatic repair at five substantive attempts, then report; explicit overrides hold for their stated scope without asking again. Keep updates brief and decision-relevant. Stop when acceptance criteria and material findings are resolved; invent no follow-up work. [R11]

**Final acceptance gate.** The integration owner integrates in dependency order and on the final integrated revision's actual changes and evidence, not worker summaries, checks every acceptance criterion, runs relevant automated checks and exercises affected end-to-end behavior and cross-task interactions. Substantial or high-risk work gets independent read-only review of the integrated changes, integration fixes included. Confirm the merge to main; report that revision, review status and every failed, skipped or unavailable check and unmet criterion. Nothing is fully verified with an open material finding or required check. [R12]

### Fleet conventions

- Repository rules add local constraints consistent with this policy; they cannot override its permissions, adaptive workflow or stopping limits. [R13]
- Gates pass before any commit touching code, a merge included: merge on a detached HEAD or its own branch and move main to it once its gate passes. The user's standing grant covers committing, merging to main and pushing in their repos; force-pushing, rewriting history, deploying and publishing still need authorization. Work is done only once merged to main, regardless of green branch or worktree gates; report unmerged work's location. [R14]
- For substantial or high-risk changes, use independent review when available. High-risk includes persistence and migrations, security and auth, concurrency, money, supply chain, and executable changes in sibling repos; `../fleet/docs/skills/multi-cli-review.md` provides the review mechanics. [R10]
- Reviewer model pins live only in `../fleet/docs/skills/multi-cli-review.md`; every model a product calls is pinned in its calling repo. No model IDs are hardcoded elsewhere. [R29]
- Read `docs/learning/lessons.md` at session start. Record the session's lessons there; each names its retiring gate and is deleted in the commit landing it. A gate counts only after going red with the defect reintroduced, following `../fleet/docs/lessons-template.md`. [R18]
- Gates prove nothing beyond their bounds: name the bound in the header and pin every reproducing input. Distinguish passed from did-not-run; a check built from its checked symbol proves only self-agreement. [R19]
- Verify outcomes beyond exit status, red or green, and return values: read the artifact that should have changed. Retest inherited blockers before repeating them. [R20]
- Keep plans and every authored review round in permanent `docs/work/<id>_<theme>/` folders (`../fleet/docs/work-docs.md`). Record history, not status: a dated devlog line per behaviour-changing session in `docs/devlog/summary.md` (`../fleet/docs/devlog-template.md`). [R24]
- Use common words with the same meaning in chat, docs, commits, PRs, comments and errors. One idea per sentence unless a rule needs more. Cut length, not facts: keep exact terms, numbers and evidence. Quotes and pastes are exempt; do not copy this canon's style. One line per paragraph, no hard wrapping. [R25]
- When blocked, immediately hand over the redacted artifact with the named blocker, before analysis; continue safe independent work. [R27]
- The owner's directions that outlive a task land that session in `../fleet/FLEET.md` if fleet-wide, otherwise the repo's `docs/policies/local-rules.md`; report where. [R31]
- When a hard problem blocks progress, run the search in `../fleet/docs/skills/hard-problem.md`. [R32]
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
