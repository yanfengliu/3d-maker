# Model studio — examination, editing, and the agent harness

Date: 2026-07-15
Status: accepted by the owner (conversation), extends `spec.md` rather than replacing it

## What changed

The owner asked for a working model studio that supports animation examination and editing, and that acts as a harness for the agent.

That is not a new project. It is this one, with the *examine* half made explicit. `spec.md` already approved the *evolve* half — breeding genome families in a gallery. A studio is the same machinery focused on one genome instead of a population, which is what the owner meant by merging the model studio and the evolution studio: whatever can be animated must first be a model, so a model is an animation sampled at one time, and a genome is what produces both.

## How the goal maps onto the approved non-goals

Two of `spec.md`'s permanent non-goals look like they collide with this. They do not, and the distinction is worth stating because it is what keeps this project narrow.

**Editing.** The goal's *edit* is genome editing: change a typed param, get a new deterministic model. That is already Component 4, the inspector. It is not vertex sculpting, which stays Blender's job forever.

**Animation.** The goal's *animate* is examination of genome-driven parametric motion, which `spec.md` explicitly allows as a later nice-to-have ("simple genome-driven parametric motion, e.g. spinning parts"). It is not keyframe or timeline authoring, which remains a Blender round-trip. Examining a frame is not authoring it.

If a task here starts to need vertex editing or a keyframe timeline, the answer is still Blender.

## The deviation: voxel, not raw three.js

`spec.md` names three.js as `core`'s only dependency. This studio renders through `voxel` instead, and that is a deliberate deviation.

The owner's direction is that every game in this workspace moves to a 3D voxel art style with `voxel` as the shared graphics engine. A studio that renders models differently from the games that ship them is not inspecting the games' models; it is inspecting its own approximation of them. The whole value of examining a frame is that the frame is the one the game will draw.

`voxel` also already owns, and proves, the properties an inspector needs, so this is reuse rather than a new dependency:

- time is injected through the frame context, never read from a clock, so any time is addressable rather than reachable only by replay;
- the same snapshot and frame time produce the same matrices, so frame 400 needs no frames 0 to 399;
- `InstanceTransformAnimationV1` is exactly the parametric motion this spec allows;
- capture is fenced to the presented revision, so a captured frame cannot describe one the canvas never showed.

`three` remains present as `voxel`'s peer. The dependency direction in `spec.md` is unchanged: `app → core → voxel`, never the reverse.

## The harness is the primary interface

`spec.md` treats the app as the product and testing as a gate. For this studio the agent-facing API is a first-class surface, not a debug hook, because the owner's stated purpose is that the studio be a harness the agent drives.

The rule that follows: **the UI may not do anything the harness cannot.** If a human can edit a genome, sample a frame, or read a verdict, the agent must be able to do the same headlessly and get the same answer. A UI capability with no harness equivalent is a defect, because it is a claim about the model that the agent cannot check.

Both surfaces therefore read one core. The UI never renders through its own path.

The renderer-neutral `@voxel/model-studio-ui` package in `../voxel/tools/studio/shared-ui` is the required workbench rather than prior art to copy. It owns the exact top, shelf, stage, player, and inspector regions; the Examine, Build, Edit, Motion, and Notes tabs; keyboard and ARIA behavior; scoped visual tokens; lifecycle disposal; and the shared shell baseline. This app supplies its gallery/genome stage and pane contents through that package without copying Townscaper's template or outer CSS. `townscaper/src/model-studio/` remains the proof that a game-specific renderer and harness can mount the shared shell: `window.harborformModelStudio` exposes catalog, camera, variation, recipe, and selected-part state, while `advanceTime(ms)` controls deterministic animation. Its editing is indirect — it emits an evolution brief for an agent to apply — whereas here the genome is the edit.

Every catalog model must also expose a zero-to-finished construction recipe and a derived list of standard parts. A recipe may call other recipes as sub-recipes; shared shapes or processes belong in those reusable recipes instead of being described again per model. The genome remains the source of variation, while the recipe records the deterministic construction steps and provenance needed to rebuild, inspect, and improve the result from an empty model.

## What the studio must prove about itself

Reproducibility is the load-bearing claim, and it is checkable rather than assertable. `spec.md`'s determinism guard — the same genome twice yields identical geometry — and the frame sweep's guards are the same idea at two time indices:

- a genome rebuilt is byte-identical;
- a frame re-sampled out of order, after the sweep has passed it, is byte-identical;
- a sweep whose frames never change is reproducible and useless, so it must fail;
- the two zero crossings of a harmonic period must render identically, because `sin(0) = sin(pi) = 0` is arithmetic rather than an observation, and a sampler that integrates time instead of sampling it fails there while passing every single-frame check.

These are ported from `voxel`'s `scripts/inspect-frames.mjs`, where each is proven to fail under a mutation the others miss.

## Order of work

1. Scaffold: `package.json`, strict TypeScript, Vite, Vitest, `voxel` linked from `../voxel`, and `@voxel/model-studio-ui` linked from `../voxel/tools/studio/shared-ui` with its shared stylesheet and browser contract.
2. `core`: a voxel genome — palette, occupancy, and harmonic motion params — plus `build(genome)` producing a `voxel` snapshot.
3. `core`: editing as pure functions over genome data.
4. `core`: the frame sweep and its guards.
5. Harness: load, edit, sample, assert — headless, no DOM.
6. UI over that same core, mounted into the shared five-region/five-tab Model Studio shell rather than a local workbench copy.
