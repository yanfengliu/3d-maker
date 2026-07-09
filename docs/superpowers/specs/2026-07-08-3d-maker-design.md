# 3d-maker — Design

Date: 2026-07-08
Status: approved by user (conversation), pending spec review

## Context and decision

The author builds web games in this workspace: `townscaper`, `town_3d`, and `city` use three.js + Vite + TypeScript; `farm`/`aoe2` (Phaser) and `civ-sim-web` (Pixi) are 2D. The original wish list — create, assemble, disassemble, manipulate, color, texture, combine, copy, animate, evolve 3D objects, with import/export for the games — describes a full DCC suite.

Build-vs-buy conclusion: do **not** rebuild a general-purpose 3D editor. Blender already covers modeling, texturing, rigging, animation, and battle-tested glTF export, for free. The one need no shelf tool serves is **evolve**: interactively breeding procedural object families. That is what this project builds, and nothing else.

**Decision: a narrow web-native "evolution studio"** — TypeScript + three.js + Vite, matching the games' stack. Blender remains the escape hatch for sculpting/UV/painting/rigging. AI mesh generators (Meshy/Tripo-class) are a later complement, not a dependency.

## Goals

1. Breed families of stylized game assets through interactive selection: a gallery of procedural variants, click survivors, breed the next generation.
2. Deterministic generation: a genome (small JSON: family, seed, typed params, version) fully determines a mesh. Genomes are the source of truth; meshes are disposable derived artifacts.
3. Export winners as GLB that the games load with their existing `GLTFLoader`; embed the genome in glTF `extras` so any export can be re-imported and evolved further.
4. Keep the generator core importable by the games themselves, enabling runtime generation with no asset files.

## Non-goals (permanently out of scope — Blender's job)

- Mesh sculpting, direct vertex editing
- UV editing and texture painting (color/texture is parametric: per-genome color and material params in v1, shared palette genome in phase 2, simple procedural textures later)
- Keyframe/timeline animation authoring (the *animate* verb is served by a Blender round-trip: GLB out → rig/animate in Blender → GLB back; simple genome-driven parametric motion, e.g. spinning parts, may come as a later nice-to-have)
- Procedural generation of rigged creatures (research-grade; served by AI draft + Blender instead)
- Any backend or multi-user features — fully client-side

## Architecture

Two layers, one dependency direction (`app → core`, never the reverse):

- **`src/core/`** — pure TypeScript library. Only dependency is three.js; no DOM, no UI, no storage. Contains genome types, generators, evolution operators, palettes, seeded RNG.
- **`src/app/`** — the Vite web app: gallery, inspector, import/export, library persistence.

Core invariant: **same genome → identical mesh, always.** All randomness flows from the genome's seed. This is what makes evolution history, tiny-JSON persistence, and runtime re-generation in games all work.

## Components

1. **Genome & generator framework (core).** Each object family is a `Generator`: a **param schema** plus `build(genome) → THREE.Object3D`. The schema declares each param's type, range/options, and mutation width, and is the single source of truth driving UI controls, mutation bounds, and validation — invalid genomes are impossible by construction.
2. **Evolution engine (core).** Mutation (per-param jitter within schema bounds, honoring per-param **locks**), crossover (blend/pick between parents), and a population/generation model with lineage. Selection is manual (user clicks); no fitness function.
3. **Evolution gallery (app).** Grid of ~12–24 live 3D tiles rendered by **one** WebGL renderer with scissored viewports (avoids browser context limits). Select survivors → next generation; a temperature control scales mutation strength; a history strip (phase 2) rewinds generations.
4. **Inspector (app).** Controls auto-generated from the param schema for the focused variant: sliders, color pickers, param locks, "make parent."
5. **Import/export (app).** Export: `GLTFExporter` → `.glb` with genome embedded in `extras`. Import (phase 2): `GLTFLoader` for viewing existing/AI-generated GLBs and re-importing genome-bearing exports; kitbash use of imported parts arrives with vehicles (phase 3).
6. **Library (app).** Favorites persisted to IndexedDB as genomes plus thumbnails; collections export/import as JSON.

## Data flow

1. **Breed:** survivor genomes → evolution engine → new genomes → `build()` → gallery tiles.
2. **Tweak:** inspector edit → updated genome → rebuild that tile.
3. **Keep:** genome + auto-thumbnail → IndexedDB.
4. **Ship (files):** mesh → `GLTFExporter` → `.glb` → game's `GLTFLoader`.
5. **Ship (runtime, later):** game imports `core` and calls `build(genome)` directly.

## Error handling

- Invalid params prevented by construction (mutation/crossover/UI all clamp to the schema). A generator that still throws renders an **error tile** with a reroll button; one broken variant never kills a generation.
- **Determinism guard** (debug): building the same genome twice must yield identical vertex counts/bounds — catches stray `Math.random()` in generators.
- Import: parse failures surface as a toast with the error; GLBs without genome extras are view-only by design.
- Persistence: genomes carry `version`; unknown versions surface as "needs migration," never silent misrendering.
- WebGL context loss: rebuild renderer; genomes (source of truth) are unaffected.

## Testing

Vitest (matching the other repos). The risk lives in core, which is pure and deterministic, so tests are cheap and meaningful:

- Same genome → identical geometry hash (determinism).
- Mutation respects bounds and locks; crossover yields schema-valid genomes.
- Genome JSON serialization round-trips.
- Fuzz: each family builds without throwing across a few hundred random seeds.
- App gets a light smoke test only. Manual acceptance: export a GLB and see it render in `city` (or another three.js game).

## Phasing (each phase independently useful)

1. **MVP:** core framework + **building** and **tree** generators + gallery (select/breed/temperature) + inspector + GLB export + library. Success criterion: *launch → evolve a building you like → exported GLB renders in one of the games, in under ~5 minutes.*
2. **Families & polish:** rocks/props, shared palette genome, history/lineage strip, GLB import + re-import-from-extras.
3. **Vehicles:** part-based assembly — hull/wheels/attachments as sub-genomes with attachment points. The *assemble / disassemble / combine* verbs land here, including kitbashing imported parts.
4. **AI & creatures:** external mesh-generation APIs to seed populations or draft creatures; rigging/animation via the Blender round-trip.

The first implementation plan covers **phase 1 only**.

## Requirement coverage (original verb list → where it's served)

| Verb | Served by |
|---|---|
| create | generators (core), phase 1 |
| assemble / disassemble / combine | vehicle part-graphs + kitbash, phase 3 |
| manipulate / color / texture | inspector params + palette genome, phases 1–2 |
| copy | duplicate genome (mutation 0), phase 1 |
| animate | Blender round-trip; optional parametric motion later |
| evolve | gallery + evolution engine, phase 1 |
| import / export | GLB export phase 1; import phase 2 |

## Decisions log

- Tool role: **dev-time asset tool** for the author — not player-facing, not a standalone product.
- "Evolve" means procedural variants + user-selected genetic evolution + (later) AI generation.
- All four object types wanted; creatures deliberately last and partially delegated to AI + Blender.
- Stack: TypeScript + three.js + Vite; interchange format GLB.
- Chosen approach: web evolution studio (over Blender add-ons, or adopting shelf tools only).
