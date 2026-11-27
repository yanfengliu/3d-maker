# Procedural Model Craft & PolyFork Reference Lessons

This guide captures durable 3D modeling lessons learned from analyzing all 3,645 free PolyFork models in `dataset/polyfork/free-assets.json`, inspecting 9 downloaded PolyFork GLBs in detail (structure + full-resolution 6-angle renders across `Front`, `Back`, `Left`, `Right`, `Top`, `Bottom`, and `3/4`), and auditing Form Foundry's own 106 procedural originals across all six cardinal directions.

## PolyFork corpus benchmarks

Across the 3,645-model free PolyFork catalog, each asset class clusters tightly around consistent physical scale, triangle budgets, grounding, and articulation:

| Class | Count | Median tris | Median size W × H × D (m) | Grounded (`origin_y = 0`) | Rigged |
| --- | ---: | ---: | --- | ---: | ---: |
| `prop` | 2,251 | 658 | 1.10 × 0.91 × 0.72 | 91.6% (2,061) | 40.3% |
| `building` | 499 | 1,424 | 4.00 × 4.45 × 4.00 | 95.4% (476) | 56.1% |
| `animal` | 297 | 3,947 | 1.58 × 1.70 × 0.74 | 98.7% (293) | 100.0% |
| `vehicle` | 232 | 2,652 | 2.25 × 2.55 × 5.30 | 78.0% (181) | 94.4% |
| `character` | 208 | 3,973 | 1.67 × 1.74 × 0.43 | 99.5% (207) | 99.5% |
| `ultra` (handheld) | 86 | 181 | 0.17 × 0.15 × 0.09 | 100.0% (86) | 0.0% |
| `attachment` | 48 | 912 | 0.04 × 0.03 × 0.07 | 12.5% (6) | 0.0% |
| `terrain` | 22 | 25,328 | 92.0 × 16.5 × 101.0 | — | 0.0% |

## Craft lessons from PolyFork GLB inspection

Direct glTF inspection and 6-angle visual study of eight diverse PolyFork GLBs (`water-trip-hammer-mill-c301d5`, `fountain-house-cbda2f`, `bumper-car-eda915`, `painted-rowing-boat-ca5c1a`, `reindeer-base`, `shaded-bench-1078c2`, `family-traveller-9af47e`, and `survey-drone-7c71f9`) surfaced seven concrete principles to apply when building or revising Form Foundry models.

### 1. Matte material discipline and selective highlights

Almost every opaque PolyFork surface (stone, timber, stucco, cloth, rubber, fur, painted hulls) uses a calm matte roughness around `0.85` with `metalness: 0`. Mid-roughness metallic materials (`roughness: 0.4–0.5`, `metalness: 0.25+`) are reserved strictly for brass, iron, or machined hardware, and low roughness (`0.08`) with alpha blending is reserved for water or glass. Avoid shiny clearcoat or glossy specular glare across stone walls, plaster facades, or wooden roofs, because specular bands make buildings look like molded plastic toys.

### 2. Surface richness through tonal variation, not flat slabs

None of the inspected PolyFork GLBs rely on image textures (`uvPrims: 0`). Instead, they break up large expanses using subtle shade variation across individual architectural elements — staggered wooden roof shingles (`water-trip-hammer-mill`, 101 vertex colors), scalloped terracotta roof tiles and fluted stone columns (`fountain-house`, 59 vertex colors), lapstrake hull strakes (`painted-rowing-boat`, 57 vertex colors), and layered fabric tones (`family-traveller`, 27 vertex colors). When authoring procedural models, break large roofs, foundations, and walls with stepped courses, battens, trim bands, or subtle secondary tones rather than one bare uniform slab.

### 3. Closed, watertight, single-sided shells from all six directions

Eight of nine inspected PolyFork GLBs use `doubleSided: false` with solid, closed outward-facing geometry so nothing vanishes when viewed from behind or underneath. Look straight up from `Bottom` on PolyFork models and you see complete, intentional geometry: sealed stone foundations (`water-trip-hammer-mill`, `fountain-house`), recessed steel chassis pans with four forked caster wheels (`bumper-car`), curved dark antifouling hull keels (`painted-rowing-boat`), closed underbellies and cloven hooves (`reindeer-base`), flat boot soles and closed hems (`family-traveller`), and chamfered belly plates with downward optical sensors (`survey-drone`). Never leave an open hemisphere, single-sided wall, or missing bottom face.

### 4. True 360-degree joinery and physical load paths

PolyFork models hold up from `Back`, `Left`, `Right`, `Top`, and `Bottom` because every visual part is physically connected along a plausible structural path. Posts rest on stone plinths and tie into roof beams with diagonal knee braces (`water-trip-hammer-mill`); classical triglyph friezes and stepped plinths wrap all the way around the back wall (`fountain-house`); collector poles enter flanged mounting sockets (`bumper-car`); backpack straps wrap continuously over shoulders from back to front (`family-traveller`); and cantilevered canopies sit on visible rafters and rear posts (`shaded-bench`). Never model front-only facades with naked backs or floating details that rely on one lucky 3/4 camera angle.

### 5. Grounding discipline (`minY = 0`) and intentional waterlines

Over 95% of PolyFork buildings, characters, animals, and handheld props sit flat at `y = 0` with every foot, plinth, wheel, or skid grounded on the same horizontal plane. Only buoyant watercraft (`painted-rowing-boat`, `origin_y = -0.27`) sit below `y = 0` so scenes can place them directly on a water plane. Verify `minY` in `metrics.json` and visually confirm ground contact in `Front`, `Back`, `Left`, and `Right` views.

### 6. Silhouette and functional detail over raw polygon count

PolyFork models read clearly in 800 to 4,100 triangles because polygons go into silhouette and functional storytelling — overhanging eaves, recessed colonnades and basins, exposed axle-and-cam linkages, stowed oars on thwarts, corrugated canopies, and gimbal cameras — rather than burning tens of thousands of triangles on heavily subdivided rounded boxes. Prefer crisp structural profiles, meaningful recesses, and distinct layered proportions.

### 7. Compact draw calls and meaningful hierarchy

PolyFork merges static sub-parts into 1–5 meshes and reserves separate scene nodes for rigged hinges, spinning parts, skins, or detachable accessories. Keep animated or detachable subtrees cleanly grouped under stable pivot origins so rotations and slides never shear away from their brackets.

## Recurring defect classes caught and gated

Running a full-catalog deterministic geometry audit and 6-angle visual inspection across all 106 procedural originals (111 registered variations) uncovered and repaired 56 real visual defects across four preventable classes (all 56 repairs are audited in `src/models/variations.lock.json`):

1. **Coplanar Z-fighting** — Two overlapping boxes, shells, or cylinders sharing an exact face coordinate flicker into diagonal stripes (for example, water slabs flush with stone foundations on `stone-watermill`, basalt pillars flush with mound bottoms on `volcanic-basalt-vent`, basket bases flush with dark floor plates on `hot-air-balloon`, chest armor/tunics grazing under-suit planes on humanoid characters, and conical leg sleeves overlapping on `forest-fox`). Always offset proud surfaces by at least `0.01–0.015 m` (or recess cleanly behind an actual frame cutout).
2. **Floating or disconnected parts** — Secondary parts positioned by guesswork often show daylight gaps from orthogonal `Front`, `Back`, `Left`, or `Right` views (signboards missing brackets on `market-pavilion` and `cyber-ramen-kiosk`, floodlight bar without mounting struts on `deep-submersible`, rear tail fins separated from fairing on `racing-hoverbike`, firewood stack floating 3 cm above the deck on `nordic-timber-cabin`, pendulum rod short of tower ceiling on `town-clock-tower`, or snow drifts left floating when `FirewoodStack` is detached on `nordic-timber-cabin@snowbound`). Every attached part must embed `0.01–0.02 m` into its parent or connect through explicit struts, brackets, pedestals, or hinges, and accessories resting on a detachable group must be parented to that group.
3. **Open single-sided shells disappearing from `Bottom` or `Back`** — Open lathe domes such as `coral-jellyfish`'s original bell vanished completely when inspected from straight underneath. Always close lathe profiles with an inner wall or cap so `bottomToTopRatio` stays solid and underside views read cleanly.
4. **Interpenetration and rounded-corner shoulder gaps** — Wheels placed inboard of a chassis clip through the body (`warehouse-forklift`), forward-tilted flat windshields detach from rounded cabs (`arctic-snowcat`), and heavily rounded wall shells leave bright wedge gaps beneath crisp triangular gables. Verify wheel clearances, window seating, and roof-to-wall joints from `Left`, `Right`, `Back`, and `Top`.

## Enforceable deterministic craft gate vs. visual inspection

Prefer enforceable deterministic checks over prose wherever geometry can encode the rule. `src/models/craft-invariants.ts` and `src/models/craft-invariants.test.ts` run automatically inside `npm run verify` across every registered variation (111 models in ~0.8 s) plus synthetic broken-geometry self-tests, blocking regressions in six areas:

- **Zero unintended floating parts**: World-space AABB connectivity graph flags any disconnected component suspended above `minY + 0.04 m` (only intentional levitating fantasy elements are explicitly allowlisted: `crystal-geode-spire@default` and `mushroom-fairy-ring@default`).
- **Zero exposed coplanar Z-fighting**: Exact normal-bucketed 2D polygon intersection (`Sutherland-Hodgman`) with translation-invariant plane separation and Möller–Trumbore Jordan-parity occlusion filtering rejects any exposed distinct-appearance coplanar overlap over `0.005 m²` with zero exemptions across all 111 variants.
- **Watertight 6-direction coverage and zero `DoubleSide` shells**: Projected outward triangle area ratios across all six cardinal axes (`bottomToTopRatio >= 0.55`, `backToFrontRatio >= 0.55`, `leftRightBalance >= 0.45`), zero non-finite vertices, and zero `THREE.DoubleSide` meshes.
- **Grounding bounds**: Every catalog model's lowest vertex sits cleanly on the ground plane (`-0.025 <= minY <= 0.08`).
- **Detachable-part integrity**: Hiding each declared `detachableParts` group re-runs connectivity and watertight checks so detaching an accessory never leaves orphan floating trim or open holes.
- **Material hygiene**: Finite roughness/metalness within `[0, 1]` and no mirror-gloss (`roughness < 0.15`) opaque non-metallic, non-emissive matte surfaces.

Visual 6-angle inspection (`npm run inspect:model`) remains required for aesthetic qualities math cannot adjudicate: silhouette appeal, proportions, tonal harmony, deliberate clipping vs. clearance aesthetics, and articulated pose naturalness.

## Six-angle visual inspection workflow

Every new or edited procedural model must be built and inspected with:

```bash
npm run build
npm run inspect:model -- <template-id> [--variation <variation-id>]
```

This writes full-resolution `front.png`, `back.png`, `left.png`, `right.png`, `top.png`, `bottom.png`, `perspective.png`, `metrics.json`, and hierarchical `trace.json` (world bboxes, per-mesh triangle/open-edge counts, materials, and joints) into ignored `output/inspect/<slug>/`. Inspect every PNG directly and check this list before locking variations:

- **All six faces complete**: No missing back walls, hollow bottoms, inverted normals, or disappearing single-sided domes (`Back`, `Bottom`, `Top`).
- **Zero floating parts**: `metrics.json` reports `floatingComponents: []` (unless intentionally levitating effects like spores or arcane crystals) and every sign, mirror, handle, lamp, seat, dish, door, and bracket visibly connects to its parent from orthogonal views.
- **Zero Z-fighting or clipping**: No striped/flickering coplanar faces and no wheels, doors, or frames slicing awkwardly through neighboring shells.
- **Clean grounding**: `minY` sits at `0` (within `±0.02 m`) with all feet, wheels, skids, or plinths resting evenly on the floor plane (except explicit floating watercraft).
- **Articulated clearance**: Rigged hinges/slides sit on visible pivots/tracks and stay attached through their declared motion range.
- **360-degree finish quality**: Back and side elevations carry cohesive trim, proportions, and silhouette rather than looking unfinished compared to the front 3/4 hero angle.

## End-to-end authoring procedure

For generating new original procedural models or batch kit variations, follow the five-stage workflow packaged in `.agents/skills/author-3d-model/SKILL.md`:

1. **Kit grammar, brief, and 2D turnaround art**: Reuse shared matte palettes, frame-anchored placement (`bboxFrame`, `placeOnFrame`, `createHingeOnFrame`, `gridFrames`, `ringFrames` in `src/models/kit-frames.ts`), and joinery helpers in `src/models/kit-grammar.ts` / `src/models/kit-materials.ts`, write a part brief, and generate a front+rear 2D reference image before coding geometry.
2. **Parametric model-as-code + static mesh merge**: Declare semantic structural knobs (`ModelParamSpec[]` via `src/capabilities/param-schema.ts`), compress static sub-meshes with `mergeStaticParts()` (`src/models/merge-static.ts`) for compact draw calls, deterministic `tone` vertex-color shading, and optional procedural vertex-color shaders (`colorFn` — `upwardBlendShader`, `heightBandShader`, `grainShader`) while preserving live `primary`/`accent` tint zones and rigged/detachable pivots.
3. **Truth harness & automatic metadata**: Lock append-only variations (`npm run variations:lock`), verify craft invariants, spatial colliders/clearances/surfaces, measured `ik` (`src/capabilities/ik-derive.ts`), and render all seven views plus `trace.json` (`npm run inspect:model`).
4. **Fresh-session adversarial visual judge**: Run an isolated read-only subagent reviewing ONLY the brief, 2D reference image, `metrics.json`, and all 7 PNGs; fix every concrete visual defect and re-verify until approved.
