---
name: author-3d-model
description: End-to-end procedure for authoring original procedural Three.js models and append-only variations in Form Foundry — from part brief and 2D concept reference through kit-grammar code, semantic structural knobs, static mesh merging with tonal vertex-color jitter, deterministic craft/spatial/IK gates, and fresh-session adversarial visual judging. Use whenever creating one or a batch of original 3D models or kit variations.
---

# Authoring Original 3D Models in Form Foundry

Follow this five-stage procedure for every new original model or append-only variation. Keep raw concept art, briefs, and renders inside gitignored `output/` directories, never overwrite existing locked variations, and keep every `src/**/*.ts` file at or below 500 physical lines.

## Stage 1: Kit Grammar, Part Brief, and 2D Reference Art

Before writing Three.js geometry, lock the visual and physical spec on paper and in a 2D turnaround image so proportions, back-side craft, and joinery are concrete before coding.

1. Define or reuse a cohesive kit grammar in `src/models/kit-grammar.ts`: shared real-world meter scale (compare against `docs/design/model-craft.md` corpus medians), matte PBR discipline (`roughness: 0.84–0.90`, `metalness: 0` for stone/wood/plaster/cloth; metallic `roughness: 0.42–0.48` strictly for hardware), and 2–3 named colorways.
2. Write a compact part-list brief at `output/briefs/<slug>/brief.md` naming target W × H × D in meters (`minY = 0` except buoyant watercraft), silhouette load paths, back/side/bottom detail, rigged/detachable node names and motion axes, 2–5 semantic structural knobs, and draw-call budget.
3. Generate a 2D front-3/4 + rear-3/4 turnaround reference image using the `image-generator` subagent on the studio `#e7e8e1` warm-gray backdrop. Because `image-generator` writes `.jpg` into the conversation artifact directory, copy it to `output/briefs/<slug>/reference.jpg` and inspect it directly with `read_file` before writing geometry.

## Stage 2: Parametric Model-as-Code Authoring

Build the model in a dedicated module (for example `src/models/kits/<kit-model>.ts`) and register it append-only in `src/models/variations.ts` (for variations) or a pack under `src/models/collections/` (for new catalog templates).

1. **Declare semantic structural knobs (`ModelParamSpec[]`)** in `paramSpecs` (variation) or `params` (template) using `src/capabilities/param-schema.ts` (`range`, `toggle`, `choice` — e.g. `bays`, `roofPitch`, `awning`, `colorway`, `tone`). Read defaults via `resolveModelParams` so studio Properties UI, `Recipe.params`, and `capabilities.params` stay automatically synced.
2. **Honor live studio colors + HD progression**: bind custom `recipe.primary` / `recipe.accent` when edited away from defaults, tag tint-zone materials with `mat.userData.tintZone = 'primary' | 'accent'` so `mergeStaticParts` preserves exact `material.color`, and ensure `quality: 'hd'` adds genuine silhouette craft (chamfered hero pieces, finer courses, smooth extruded valances/mouldings) while exceeding `2×` standard triangles (`src/models/models.test.ts`) without exploding past ~12k triangles.
3. **Model for 360-degree craft and zero defects**:
   - Close every shell (`side: T.FrontSide`, sealed bottoms, closed gables).
   - Never overlap coplanar faces of distinct materials — inset recessed panels/floors by at least `0.01 m` or sit parts cleanly atop rails/ledges.
   - Use single extruded chevrons for gable bargeboards (never cross two un-mitered rotated boxes at the apex) and seat tilted props with solid wedge cleats flush on their supporting surface.
   - Group each rigged hinge/slide (`riggedParts`) and detachable accessory (`detachableParts`) under its own named `THREE.Group` at its real pivot origin with closed geometry behind detachable parts.
4. **Compress static draw calls + add vertex-color tonal richness**: call `mergeStaticParts(root, { preserveNames, tone, seed })` from `src/models/merge-static.ts` to collapse dozens or hundreds of static planks, shingles, and kerb stones into 1–5 vertex-colored meshes (and optionally merge inside detachable/rigged subtrees too) with deterministic per-element lightness/saturation variation driven by `tone` and zero image textures.

## Stage 3: Deterministic Truth Harness and Spatial/IK Verification

Run the automated checks before opening any render for human or visual review:

```bash
npm run variations:lock
npm run verify
npm run build
npm run inspect:model -- <template-id> [--variation <variation-id>]
```

Verify every deterministic contract passes cleanly:
- **Craft invariants (`craft-invariants.test.ts`)**: zero non-finite vertices, zero `DoubleSide`, zero glossy matte finishes, `-0.025 <= minY <= 0.08`, `bottomToTopRatio >= 0.55`, `backToFrontRatio >= 0.55`, `leftRightBalance >= 0.45`, zero unintended floating parts, zero exposed coplanar Z-fighting, and intact craft when every detachable part is hidden.
- **Spatial & IK metadata (`spatial.test.ts`, `capabilities.ts`)**: `attachOriginalCapabilities` automatically derives `colliders`, `clearanceZones`, `surfaces`, and measured `ik` (bipedal `legs` stride/segments or articulated `arm` reach). Confirm `checkRiggedSweep` reports zero issues across every knob extreme and add a targeted Vitest case testing knob extremes (min/default/max) in `src/models/`.
- **6-angle capture**: `inspect:model` writes `front.png`, `back.png`, `left.png`, `right.png`, `top.png`, `bottom.png`, `perspective.png`, and `metrics.json` to `output/inspect/<slug>/`.

## Stage 4: Fresh-Session Adversarial Visual Judge

Never trust your own eyes alone right after coding geometry. Launch an isolated read-only `research` subagent (`invoke_subagent`) with zero authoring history that reads ONLY:
- `output/briefs/<slug>/brief.md`
- `output/briefs/<slug>/reference.jpg`
- `output/inspect/<slug>/metrics.json`
- All seven PNGs in `output/inspect/<slug>/`

Prompt template for the judge:

```text
You are a strict, adversarial 3D asset visual judge in a fresh session. Read only the brief, reference image, metrics.json, and all 7 studio PNGs (perspective, front, back, left, right, top, bottom). Reject unless the model holds up from all 6 angles against the brief and reference art. Check: (1) silhouette and proportions vs reference, (2) 360-degree joinery, load paths, mitered joints, and flush contact (no floating parts, clipping, or awkward stubs), (3) matte surface harmony and seam-free curves/shingles/rails, (4) back/side/top/bottom completeness, (5) draw calls and triangle efficiency (note inspect:model renders HD and ground shadows can trip viewport edge flags — distinguish shadows from real clipping). Return VERDICT: APPROVE or REJECT, numbered MUST-FIX DEFECTS citing exact PNG files and concrete fixes, and optional MINOR POLISH. Do not edit files.
```

Fix every real `MUST-FIX` defect, re-run Stage 3 (`git checkout -- src/models/variations.lock.json` before `npm run variations:lock` while the variation is still unreleased on your branch), and invoke a fresh judge session until `APPROVE` (cap at 5 repair rounds per fleet rule `[R11]`; if stuck after 2 similar failures, rethink the geometry construction).

## Stage 5: Scaling to Batches and Shipping

When generating a kit of many original models:
1. Lock the shared kit grammar (`src/models/kit-grammar.ts` or `src/models/kits/<kit>-grammar.ts`) first and prove one hero model through Stages 1–4 before scaling out.
2. Fan out independent models in parallel across isolated subagents or `run_workflow` (each owning its own brief, `image-generator` turnaround, dedicated model file, and fresh-session visual judge), while serializing shared registry edits (`src/models/variations.ts`, `src/models/collections/index.ts`, `public/agent-schema.json`, `src/models/variations.lock.json`) on the coordinator branch.
3. Before merging to `main`:
   - Confirm every `src/**/*.ts` file is `<= 500` physical lines.
   - Run `npm run verify`, `npm run check:studio:ci`, and full `npm run check:studio` (including testing any new `params` controls live in the studio UI).
   - Remove temporary worktree symlinks and confirm no `output/` files or binaries `> 512 KiB` are staged.
   - Append a dated line to `docs/devlog/summary.md`, fast-forward merge to `main`, remove the worktree/branch, push `origin/main`, and follow GitHub Actions CI to green.

## Composing Multi-Piece Assets (Assemblies & Scenes)

When combining two or more pieces into a complex assembly (e.g. a house with 20 appliances, a truck with a mounted crane, or a desk with lamps), follow `docs/design/composition.md` and use the deterministic SDK primitives instead of flattening meshes together:

- **Keep modular boundaries**: Keep tightly coupled hinges on one rigid body inside a single asset; keep independently swappable, movable, or repeatable pieces as separate assets composed via `composeAsset()` (`src/capabilities/compose.ts`).
- **Scope names, knobs, and animations**: `composeAsset()` wraps each child in `Slot_<id>` with `${id}__` node/track prefixes and persists `recipe` + `capabilities` under `extras.formFoundry.children`. Drive children concurrently and independently with `createCompositeController(group, undefined, gltf.animations)` (`ctrl.openPart('fridge/FridgeDoor')`, `ctrl.playClips([...])`, `ctrl.setChildParams('pavilion', { bays: 4 }, createAsset)`).
- **Respect physics coupling and validate**: Declare `mount.coupling` (`'weld'` sums welded mass onto the connected rigid body inspected via `computeCompositeBodies()`; `'surface'` auto-seats onto a host `SurfaceSpec` in its real surface frame; `'joint'` declares an articulated rigid-body link) and run `validateComposite(group)` to check surface footprints, penetration, `clearanceY` headroom, sibling OBB overlaps, and every child's rigged-part sweeps (including carried loads).
