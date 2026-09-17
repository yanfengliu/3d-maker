# 000 — iPhone 17 Pro viewer

Status: round 6 landed on main as d387b0e, pushed, Pages deploy green (run 35271975968). All three user-reported defects fixed and recorded in `docs/learning/defect-register.md` with gates; the audit found nine more defects, all fixed; the inspection gap is closed by `scripts/sweep-iphone.mjs` plus the two `AGENTS.md` rules (feature-by-feature fidelity audit; a geometry author renders their own work). 32 tests in 5 files, typecheck, lint zero warnings, build. Open items, none blocking: the Deep Blue rail/panel luminance ratio is 0.38 against a 0.47 reference (orange and silver are inside the ±0.05 tolerance — materials.ts records it), the plateau's flat face renders as one tone where the reference has a falloff (needs an environment change, not made), the USB-C mouth's corner radius is 0.24 mm rather than the intended 1.1 (documented with the derivation), and the tongue is established by ray rather than by eye because the page's own camera limits cannot frame it at readable scale. Round 5 landed on main (28e6629 dims + 5243534 finishes), pushed, Pages deploy green. Housekeeping carried forward: parts.ts is 519 lines vs the 500 convention — worth a dedicated split slice next time the file is touched.

## Round 6 — why

The user reported three structural defects that five rounds of preset-view inspection shipped past: the Apple logo is mirrored, the plateau edge profile is wrong, and the USB-C port pierces the phone. Their directive: fix the *inspection gap*, not just the three items — assume more details are missed. So round 6 starts with a full feature-by-feature macro audit (new tooling: `output/sweep.mjs` drives the real OrbitControls over CDP with trusted input events — arbitrary angles and zoom through the real input path, no camera state assignment), then fixes everything found, one worker slice at a time.

## Round 6 audit — feature-by-feature, with evidence

References: Apple newsroom (`.shots/ref/Apple-*`), GSMArena review photos (`.shots/ref/gsmr-*.jpg`, 1200px real hardware), netzwelt + iPhone Mania (bottom layout), GSMArena text ("sharp edge of the camera island" chips — the edge is crisp, iPhone Mania: the step is *smooth* 段差が滑らか). Model evidence: `.shots/sweep/` macros + `wall-probe` vitest measurement of the built plateau (throwaway, deleted after).

| # | Feature | Verdict | Evidence |
|---|---|---|---|
| 1 | Apple logo chirality | **DEFECT** — bite on the LEFT as seen from the back; real: bite right | `.shots/audit-logo.png` vs every ref. Root cause: `appleLogoGeometry` mirrors Y only (SVG y-down fix), so it reads correct from +Z but the panel faces -Z. The `logo.ts` header even *claims* "bite on the right when seen from behind" — a falsified comment nobody checked with eyes. |
| 2 | USB-C port | **DEFECT** — the slot pierces the full body depth; dark slot reads in the front and back silhouettes; the steel tongue is buried inside the solid cavity block (dead geometry, never visible) | `.shots/audit-usbc-back.png`; `slabGeometry` pushes the slot into `shape.holes` and extrudes through the whole slab. Real: blind recess opening only on the bottom edge. |
| 3 | Plateau edge profile | **DEFECT** — flat vertical 2.1 mm wall + 0.18 chamfer (a machined step) where the real bump is a tight forged roll that also wraps over the phone's top edge | Probe: wall vertical within 0.024 mm (measured). Refs: Apple close-up crop (`.shots/audit-ref-wall.png`), gsmr-019/009 (roll visible, wrap over top visible), iPhone Mania headline. User's "ramp vs immediately raised": the real roll rises fast with no flat wall band; mine is a flat wall band with hard edges. |
| 4 | Bottom bores | **DEFECT** — 6 speaker holes right of the port; real: **5** (netzwelt headline + gsmr-033 photo count). Mic side: CAD leak says symmetric (5), corroborated on the speaker side by the shipping photo | `.shots/audit-ref-bores.png` (5 holes counted), netzwelt, iPhone Mania |
| 5 | Back panel top edge | **DEFECT** — straight top edge with a uniform 4 mm gap; real: the panel's top corners rise at the sides and tuck close around the plateau's rolled bottom corners | gsmr-019, gsmr-009, Apple lineup (all show the wrap) |
| 6 | Lens ring crown profile | **DEFECT** — 30° sloped crown across the whole band; real: wide flat land with a polished outer chamfer | Apple close-up vs `.shots/w5b/cosmic-orange_camera-closeup.png` |
| 7 | Camera Control | **DEFECT** — reads as a raised dark pill; real: flush glossy strip | `.shots/sweep/cosmic-orange_cc-macro.png` vs gsmr-005/Apple refs |
| 8 | Dynamic Island subtlety | PASS — invisible-at-a-glance is correct for a screen-off phone | `.shots/sweep/cosmic-orange_island-macro.png`; screen-off reality (Apple shots are screen-on) |
| 9 | Logo size 14 mm | PASS — Apple's own photos put it ~13–17 mm depending on perspective; 14 is in range | measured on both Apple refs |
| 10 | Logo position (panel centre-ish, y=-14.5) | PASS — panel centre is -14.5 exactly | dims vs panel extent |
| 11 | Lens triangle / cluster positions | PASS (round 5-6 fix, verified at macro) | `.shots/w5b`, Apple lineup |
| 12 | Ring/glass/flash/LiDAR/mic materials | PASS (round 5, verified at macro vs gsmr-019) | gsmr-019 vs w5b closeups |
| 13 | Front bezel / aluminum reveal ~1.15 mm | PASS | island-macro: reveal ≈ 1.1 mm measured |
| 14 | Antenna bands (6 straps at corners) | PASS-leaning — subtle straps near corners read like the refs; exact positions are not legible in any reference | top/bottom views vs gsmr photos |
| 15 | Silver panel contrast | PASS — GSMArena: silver's glass is white-ish with *more* contrast; our silver reads that way | gsmr text vs w5b silver_back |

## Round 6 review rounds

Three review attempts failed to produce a report before any finding came back: one on the deepseek route and both lanes on the `moonshotai`/kimi-k3 route, and a minimal one-line probe on kimi-k3 also failed — so the independent (different-provider) reviewer was **unavailable** for this round, and the substitute lanes below are deepseek-flash, the same model family that implemented the slices. That is weaker independence than round 5 had, and it is reported as such rather than implied.

Two adversarial fresh-context lanes (read-only, instructed to construct the defect classes rather than summarize) then delivered:

- **Lane 1 (geometry/gates) — CHANGES REQUIRED, and right.** It found the port rework had *not* sealed the cut: a −Z ray at (0, −72.0) crossed the entire 8.75 mm body; `port-shell`'s plates covered only 0.9 mm of the cut's 6.4 mm opening, leaving a 0.65 mm through-slot (126 open sightlines over the mouth's footprint); the tongue was hit by 0/7056 upward rays because the liner floor's top face was level with the rail and covered the mouth; that floor/rail coincidence was a Y-coplanar pair no gate compared; `slabGeometry`'s `slot.depth` was being used as the hole's Y *radius*, so the built mouth was a 10.48 mm circle rather than the documented 8.4 × 3.2; the containment gate's bound was the implementation's own constant (any thickness passed); and gate (a) passed vacuously because it measured two separate plates' extreme z values. It also confirmed the plateau's winding independently, could not construct a self-intersecting or non-manifold shell, and listed comment/code drift. Fixed in slice G (see below).
- **Lane 2 (logo/materials/docs) — CHANGES REQUIRED on comments and tooling.** It traced the new SVG path reader command by command and reproduced every hand-derivable coordinate (PASS, with two named bounds: `H/V/S/T/A` throw, and a draw command after `z` throws an unnamed TypeError), verified the winding/mirror reasoning against measured cap normals, reproduced the logo gate's red proof exactly, and found: the `logo.ts` comment named the wrong face as visible (the +Z cap at z = 0 is the *inner* end; the viewer sees the −Z cap at z = −0.16) — a comment that would have caused the same bug again; three logo-gate checks that measure the wrong end of the contour and so assert nothing; a materials comment citing a "0.55–0.75 band the register suggested" that exists nowhere; a confounded metalness/environment comparison; an "inside the references' band" claim with no tolerance (blue is 19 % under); and `scripts/sweep-iphone.mjs` untracked while two docs point at it, with a header naming the wrong path and no way to report a no-op input. Fixed in slice H1, except the parts.test.ts items, which slice H2 owns.

**Coordinator's own verification, because independence was thin:** I re-ran two of the round's most load-bearing red proofs myself by mutation — `mirrorX: false` fails the logo chirality gate with the exact quoted output (`centroid is at x = 2.154 (670 vertices)`), and `BASE_INSET = 0` fails the coplanarity gate (`the base ring comes within 0.0000 mm of the frame's surface`) — then restored the tree and proved it byte-identical by hashing the whole diff plus all four new files before and after (SHA-256 match, `TREE RESTORED`). The remaining slices' red proofs rest on their authors' reports.

## Round 6 fix plan (workers, one at a time)

- Slice A (big, geometric): plateau forged roll + wrap-over-top, panel top wrap, ring crown flatten — with gates (wall profile, panel outline, crown slope). **First handoff REJECTED on visual acceptance** (22 tests green, renders broken): the lofted shell's base sat *exactly* coplanar with the frame's back face (z-fighting gashes around the whole plateau), the top wrap's parabola profile overshot into a near-vertical crest (black tears + dotted z-fight stripes at the phone's top edge), and the custom panel outline folded dark across the panel. Sent back with crops (.shots/audit-art-*.png) and a new process requirement: the geometry worker renders its own work with `output/sweep.mjs` and inspects the PNGs before handing off — a gate cannot see z-fighting or self-intersection, which is precisely how this shipped past 22 green tests.
  **Iteration 2 ACCEPTED on visual acceptance** (24 tests green: 18 parts + 6 models). The worker's own root-cause list was the valuable part: the first build's "plateau" swept the roll around the *rail's whole outline*, making the bump a full-back plate (black contour, dark curve across the panel, wedges); the face cap faced +Z (invisible from the back); the panel outline self-intersected; and the roll's base ring hung in air because the frame's own 0.36 mm bevel insets its wall 0.116 mm at that depth. Fixes: the bump's own footprint, an explicitly flipped+verified cap, a rebuilt simple panel outline (rise 2.7 mm, top corners 5 mm), `BASE_INSET = 0.17` sized by the frame's *bevel* and verified by parity ray-casting the built housing (thinnest 0.045 mm), and one monotone Hermite profile everywhere (the crest profile is gone). New/strengthened gates with red proofs: coplanarity against the built frame, "the plateau is the bar, not the whole back" (the gate class the first build's green tests were blind to), and profile monotonicity/no-overshoot.
  **Queued for the polish slice (materials/scene, outside slice A's files):** a pure-black band where the roll mirrors the dark studio backdrop (visible in `.shots/sweep/cosmic-orange_acc-roll-graze.png`; the real part shows a soft mid-tone transition — `.shots/audit-bands-ref.png`), and the lens glass reading slightly darker than GSMArena's hardware photos. Antenna straps now sit at 22°/28° on the side walls (was 47°/53° at the corners) — judged plausible against gsmr-040's edge bands, which read as small subtle marks on the side walls, but not yet confirmed against a raking-light reference.
- Slice B: logo chirality + gate (leaf-centroid x < 0 in world = leaf top-right from the back). **ACCEPTED** — the worker replaced the DOM-only SVGLoader with a self-contained path reader (which is why this class had been ungated), added the X mirror, deleted the now-wrong `flipWinding`, and gated the leaf centroid with a red proof (`centroid is at x = 2.154 … which a back view shows on the LEFT`). Verified by eye at macro: bite right, leaf top-right.
- Slice C: USB-C blind recess (aluminum shell plugs both faces flush, bottom pocket with dark liner + visible tongue) + silhouette gate; remove the buried-tongue dead geometry.
- Slice D: bore counts (5+5 symmetric) + Camera Control flushness + count gate. **ACCEPTED** — 5+5 with the evidence limits recorded (the worker could not resolve the count in the reference photo and said so); Camera Control is now recessed (proud −0.02, seamProud −0.03) with the pill test re-expressed for signed stand-off planes plus a non-coplanarity assertion. Gates: 26 tests.
- Slice E (finishes/scene, behaviour-changing): `anisotropy` 0.55 → **0** on the frame's aluminum, which cost the frame most of its brightness, so `metalness` 0.9 → **0.15** with `envMapIntensity` **2.6** to give it back. Why `anisotropy` had to go: at 0.55 it drew a hard black band along the plateau's rolled shoulder — the stripe's darkest row measured rgb(0,0,0) beside a 175-luma highlight, 175:1 — and every non-zero value tried (0.55, 0.4, 0.25, 0.12, 0.1) reproduced it, while it survived roughness 0.6, the studio shell repainted, the normal map removed and the shadow map off. Why the pair moved together: with the lobe gone, a 0.9-metal frame mirrors only the shell *between* the studio's softboxes (Cosmic Orange frame rgb(70,18,7) against its own panel's rgb(201,122,90)), and anodized aluminum scatters rather than mirroring. The evidence is a rail-band-over-panel relative-luminance ratio against three reference photos: orange 0.07x → 0.69x (gsmr-040 0.73x), silver 0.15x → 0.91x (lineup 0.87x), blue 0.03x → 0.38x (gsmr-019 0.47x). Orange and silver land within 0.05 of their reference; blue is 0.09 — 19 % — under its own, so this is not a three-for-three match. Two comparison arms (0.45 metalness at envMapIntensity 3.0 → 0.43x; 0.30 at 1.7 → 0.56x) moved both variables at once and therefore identify no lever; what they do show is a more metallic, brighter frame reading duller than a less metallic, dimmer one. Cost recorded, not chased: the plateau is one tone edge to edge where the reference has a soft gradient, and the antenna straps' step over the rail narrows from +64 to +11 luma. No gate covers any of this — it is scene and material judgement against reference photos, and the numbers are reproduced only in `materials.ts`'s comment. Housekeeping for the coordinator: `src/iphone/plateau.ts` is now 520 lines, over the 500 convention (it was 496 before this slice's comment corrections, which added 24 lines of prose).
- Then: full sweep re-verification, independent read-only review, gates, poster refresh, devlog, merge, push. Also land the process fix: defect-register entries (3 user-reported) and an AGENTS.md line requiring macro-range feature audits for fidelity claims. Slice 1 (camera-cluster X retune) landed on main as 28e6629, gates green. Slice 2 (finish overhaul: materials.ts + lens.ts + MagSafe/logo subtlety in parts.ts) handed off with all gates green and ACCEPTED after orchestrator inspection of the w5b matrix (24 shots at native resolution vs Apple's refs): 10 of 11 fixes confirmed — tinted rings, 0.77 glass fill, hairline flash collar, dark LiDAR/mic surrounds, panel/logo/sapphire/antenna tones, lens glass alive (the "black void" cause was lensGlass envMapIntensity 0.28). The slice-2 worker escalated adding src/iphone/palette.ts (500-LOC rule forced the extraction; public surface re-exported unchanged) — accepted. Two residual nudges went to a slice-3 worker (subagent 872db1d3): MagSafe ring still traceable straight-on, silver lens rings reading near-black in the dark studio. Also noted for later housekeeping (not this round): parts.ts is 519 lines, over the 500 convention on HEAD already. Note: the first monolithic 12-defect brief (subagent 90413bb2) stalled ~25 min with zero writes and was interrupted; the work was re-sliced into small per-file assignments, which landed slice 1 in minutes. Round 4 landed and accepted (orchestrator-verified via the 24-shot matrix at native resolution + CDP dropdown probe; npm run verify green); committed to main. Workers: DeepSeek V4.1 Flash (`deepseek-official`/`deepseek-flash`) via durable `subagent` with explicit provider/model (policy enabled in `~/.dsh/settings.yaml` as `subagent-model-selection`). Orchestrator: kimi-k3.

## Round 5 brief (coordinator diagnosis from the w5 matrix vs Apple's official photos)

Goal: picture-perfect against the real device. Reference set: `.shots/ref/` (Apple newsroom: cosmic-orange hero, color lineup, camera close-up, forged-plateau poster). Round-5 matrix: `.shots/w5/` (24 shots). Defects sent to the worker, ranked by visual impact:

1. Lens rings render neutral chrome on every finish — real rings are polished metal tinted with the finish (obviously orange on Cosmic Orange).
2. Lens glass too small (0.61 of ring Ø vs real ~0.77) and reads as a black void — grow glass to Ø~10.3, keep convex deep blue-black gloss + pupil.
3. Flash reads as a white button with a thick chrome collar — real: matte pale bluish-white window, hairline finish-tinted surround.
4. LiDAR chrome bezel — real: dark glossy glass, thin dark surround.
5. Mic pinhole chrome bezel — real: plain dark pinhole.
6. Lens triangle geometry from the lineup photo: main/UW column body x 23.5→22, telephoto 7.35→2.6, flash column −26.5→−25.4.
7. Back panel too pale vs frame (salmon on orange) — panel = finish hue, only modestly lighter, frosted.
8. Apple logo too dark — real: tonal satin apple ~10–15% darker than the panel.
9. MagSafe ring reads as a drawn circle — real: invisible in Apple's photos; reduce to a whisper.
10. Camera Control reads as a black hole — real: glossy dark frame-hued strip.
11. Front face is a void — real: glossy near-black glass with a visible sheen; lift from #000, clearcoat + envMapIntensity.
12. Antenna bands too pale/cream — real: finish hue, slightly desaturated.

Constraints carried into the worker brief: mesh names/material keys and the cavity-window/bezel semantics parts.test.ts asserts are fixed; dims x values are safe to change (tests read the constants). Coordinator acceptance: re-shoot 24, inspect at native resolution vs refs, then independent read-only review, `npm run verify`, devlog, merge to main.

## Round 5 review (independent, kimi-k3, read-only)

Verdict: CHANGES REQUIRED — comments only. Code verified correct: the reviewer re-derived every palette value against three.js (panel/sapphire/logo hexes and luminance ratios exact), confirmed applyColorway repaints every finish-dependent material (incl. lensRing roughness), confirmed the parts.test.ts contract holds, and ran the gates green itself. Findings: 8 falsified comments (lens.ts flash doc numbers; materials.ts sapphire/logo/island/antenna/logo/backGlass docs contradicting palette.ts's measured values; palette.ts Colorway.glass claiming a UI consumer that does not exist — ui.ts has its own SWATCH record), 1 geometry nit (flash collar base floats 0.14 mm over the plateau), 3 misleading nits. Sent back to the slice-3 worker (872db1d3) as a bounded comment-correction + collar-reseat pass. Coordinator will re-verify gates and shoot a grazing-angle flash check before committing.

## Round 4 brief (from the round-3 worker handoff + orchestrator review)

1. **Plateau/lens Z-offset (the big one)**: the plateau slab lands ~2.095 mm further back than its documented planes (`slabGeometry` interprets `zOuter/zInner` as the max-Z face), so the lens assembly sits in a deep bore and the plateau reads detached from the body by ~2 mm in profile. Fix = mirror the lens stack in Z and re-fit every preset so the lens rings stand proud of the plateau's face like the real part.
2. **Missing gate**: add a model assert as a unit test — every edge part's `Box3` lies inside `RAIL` (see `dims.ts`) — and record the class in `docs/learning/defect-register.md` (symptom: pins/blocks protruding past the silhouette; root cause: bevel-outside-shape measuring; gate: the Box3-inside-RAIL test).
3. **Full-matrix regression pass**: after the Z fix, re-shoot and inspect all 24 (8 views × 3 colors) at native resolution. Checklist: lens glass = dark domes with catchlights; buttons frame-colored with base seam only; bottom bores flush; Dynamic Island subtle and flat; antenna bands flush; USB-C inset with tongue; nothing crosses the silhouette.
4. Then `npm run verify`, commit to main (user authorized commit/merge/push), devlog line, `present` `iphone.html` + `src/iphone/` to the user.

Orchestrator loop (do not implement): start `npm run dev -- --port 5199 --strictPort` as a background job → after each worker round run `pwsh scripts/shoot-iphone.ps1` (24 PNGs to `.shots/`) → inspect every image with `read_image` at native resolution → send numbered defect lists to the DeepSeek worker. Repeat until supremely good.


Round 3 worker handoff (2026-09-16) — the eight defects from the round-2 matrix:

- **Root cause of seven of them**: `slabGeometry` bevels *outside* the shape it is given, so the frame's flat side wall sits one `bevel` (0.36 mm) outside `BODY.width / 2`. `dims.ts` now exports `RAIL` (wall x/y, corner radius, corner centres) and every edge part measures from it. Everything else follows: flush bore mouths for the 6 speaker + 4 bottom mic + 1 top mic holes (`BORE_PROUD = 0.02`, no tube crosses the edge), USB-C cavity 1 mm inside its cut-out with a steel tongue, antenna straps rebuilt as ribbons sampled along the rail's corner arcs (1.5 mm of arc, 0.02 mm proud, tinted from the colourway), button pills measured from `RAIL.x + proud` with a thin dark seam.
- **Dynamic Island**: dropped a `leanOffset` that belonged to floor-space parts, so it now lies flat on the cover glass (0.05 proud, 12 mm below the glass's top edge, 29 × 8.8, camera dot in its right half).
- **Lens triangle** mirrored to the real layout: Main and Ultra Wide on the back-view left (`x = 23.5`), Telephoto right-middle (`x = 7.35`).
- **Lens glass**: barrel wall and floor moved from in front of the stack (a flat floor disc was capping every lens mouth) to behind it; glass and pupil now share one sphere via `capParameter`, short rim walls; dark blue-black glass, dark gunmetal interior, ~4.6 mm brighter pupil. Closeup now reads as glass in a barrel with depth.
- **Buttons**: `materials.button` is `aluminum.clone()` (same finish, seam only), and the studio environment's two ±X softboxes were back-facing and culled — they are fixed, which is what actually made the pills mirror a dull shell.
- **Gates**: `npm run typecheck`, `npm run lint`, `npm test` (20), `npm run build` all green, exit 0. Shots re-captured: 8 views × 3 colourways (24 PNGs in `.shots/`), each inspected at native resolution plus crops. Not committed; no test added — the defect-register/gate entry this class needs is a model assert (each part's `Box3` inside `RAIL`), which belongs in a test file this round was told not to touch.

Implementation notes (worker handoff, 2026-09-16):

- Files: `iphone.html`, `vite.config.ts`, `src/iphone/{main,dims,scene,materials,geometry,parts,phone,views,ui,types}.ts`, plus `scripts/matrix.ts` and `scripts/capture-shots.mjs`. `src/core/` and the existing tests are untouched.
- `scripts/shoot-iphone.ps1` cannot capture WebGL: `chrome --screenshot` with `--virtual-time-budget` returns a blank frame here (verified — every frame was white). `scripts/capture-shots.mjs` drives the same headless Chrome over the DevTools protocol, waits for `window.__shotReady`, then screenshots; it is the working capture path.
- Presets are `distance` + `frameHeight` with the field of view derived, so framing cannot drift with viewport aspect. Targets are in scene space, where the phone stands from y = 0 to y = 150.
- Deviations from the letter of the spec: (1) the bottom view cannot look up at the bottom face, because the camera would have to be inside the floor — it is a low, close, oblique view along the front face instead; (2) `npm run lint` also names `scripts/`, which holds PowerShell, and ESLint 10 exits 2 when a named pattern matches no file, so `scripts/matrix.ts` exists as a typed helper and the capture harness `.mjs` files are ignored by the type-aware config.

## Goal

A realistic, interactive 3D model of the iPhone 17 Pro, served as its own page in this repo, with a dropdown to switch the official colors (Cosmic Orange, Deep Blue, Silver). Verified visually by the orchestrator via headless-Chrome screenshots across a matrix of camera views × colors, iterated until it looks supremely good. Merged to main when accepted.

## Non-goals

- No changes to `src/core/` (evolution engine) or existing tests.
- No runtime network assets: everything procedural/embedded (no HDRIs, fonts, or textures fetched at runtime).
- No SIM-tray (US eSIM variant), no screen-on wallpaper (screen off = realistic dark glass).

## Placement and stack

- `iphone.html` at repo root; code in `src/iphone/` (`main.ts`, `phone.ts`, `materials.ts`, `scene.ts`, `ui.ts`, `views.ts`); `vite.config.ts` gains a rollup input for `iphone.html` so `npm run build` works.
- three@0.185 (already a dependency), Vite 8, TS strict. Units: 1 unit = 1 mm.
- Renderer: antialias, `preserveDrawingBuffer: true` (screenshot contract), ACESFilmic tone mapping, sRGB output.
- Environment: three `RoomEnvironment` via PMREM (offline, deterministic) + key directional light with PCFSoft shadows onto a `ShadowMaterial` floor; dark studio gradient background.

## Model spec (iPhone 17 Pro, 6.3")

> Historical: the spec below is the round-4 text, kept for the record. Some of it is no longer what shipped — the unibody's `metalness` ~0.9 and "subtle anisotropy" are round-6's 0.15 and 0, at `envMapIntensity` 2.6, for the reasons recorded in the round-6 fix plan above; the plateau's "~1.5–2 mm" is 2.095; and later rounds changed ring tints, panel tones and the logo's finish. Read the section as the original brief, not as status.

Dimensions 150.0 H × 71.9 W × 8.75 D mm; body corner radius ~11.5.

- **Unibody**: anodized 7000-series aluminum (MeshPhysicalMaterial, metalness ~0.9, roughness ~0.4, subtle anisotropy for brushed look). Built from extruded rounded-rect profile with edge fillet; front glass and back panel inset into it.
- **Camera plateau**: full-width bar across the top of the back (~37 mm tall, top corners matching body radius), raised ~1.5–2 mm above the back, same anodized aluminum.
- **Lenses** (triangle on the left half of the plateau): Main (top-left), Ultra Wide (bottom-left), Telephoto (right-middle). Raised polished metal rings (Ø ~13.5, ~2.2 proud), domed black lens glass with concentric inner aperture detail and subtle iridescent coating.
- **Plateau right side**: LED flash (Ø ~5, matte pale), LiDAR (Ø ~8, dark glass), tiny microphone pinhole.
- **Back glass panel** (Ceramic Shield / MagSafe area): large matte rounded-rect panel below the plateau, tinted variant color (slightly lighter than aluminum); polished Apple logo centered in it (extruded shape from a verified SVG path — worker sources path data at dev time); subtle MagSafe ring.
- **Front**: near-black glossy glass (clearcoat 1, roughness ~0.05), thin bezel, Dynamic Island pill (~29 × 8.8) centered near the top with a faint front-camera dot.
- **Controls**: left edge — Action button pill + two volume pills; right edge — power pill + flush Camera Control (glossy sapphire); bottom edge — USB-C opening (dark interior + tongue), speaker holes (right of port) and mic holes (left); antenna bands on edges.

### Colors (initial hexes, tuned against screenshots)

- Cosmic Orange: aluminum `#c75b39`, glass panel slightly lighter.
- Deep Blue: aluminum `#3a4356`, panel a touch lighter.
- Silver: aluminum `#d7d8da`, panel `#ececee`.

## UI

Top-left glassy overlay: title "iPhone 17 Pro", styled native `<select>` with the three colors + swatch dots. Switching color updates materials live (no rebuild) and mirrors into the URL query (`history.replaceState`). OrbitControls with damping; slow auto-rotate until first pointer interaction.

## Screenshot / debug contract (acceptance tooling depends on this)

- Query params: `?color=cosmic-orange|deep-blue|silver`, `?view=hero|front|back|left|right|top|bottom|camera-closeup`, `?shot=1`.
- `?shot=1`: disables auto-rotate and UI animation, applies the exact preset camera, and sets `window.__shotReady = true` after ≥5 rendered frames.
- `window.__iphone = { setColor(name), setView(name), ready: Promise }`.
- Harness: `scripts/shoot-iphone.ps1` (orchestrator-owned) shoots the full matrix to `.shots/` (git-ignored) via headless Chrome.

## Acceptance criteria

1. `npm run verify` green (existing tests untouched; lint zero warnings — add a flat eslint config if the scaffold lacks one).
2. Full screenshot matrix (8 views × 3 colors) inspected by the orchestrator at native resolution: correct proportions and feature placement, plausible PBR materials/reflections, no z-fighting, gaps, or missing details; dropdown readable and functional.
3. Iterated until supremely good, then committed to main (devlog line added).
