# 000 — iPhone 17 Pro viewer

Status: round 5 landed on main (28e6629 dims + 5243534 finishes), pushed, Pages deploy green (run 35191386475). Independent review by kimi-k3: code verified numerically, comment-truthfulness findings fixed and re-verified before commit. Round 5 was planned, implemented, reviewed and merged by subagents under goal-mode orchestration; the coordinator's hands were diagnosis, captures, acceptance and integration only. Housekeeping carried forward (not round-5 scope): parts.ts is 519 lines vs the 500 convention — worth a dedicated split slice next time the file is touched. Slice 1 (camera-cluster X retune) landed on main as 28e6629, gates green. Slice 2 (finish overhaul: materials.ts + lens.ts + MagSafe/logo subtlety in parts.ts) handed off with all gates green and ACCEPTED after orchestrator inspection of the w5b matrix (24 shots at native resolution vs Apple's refs): 10 of 11 fixes confirmed — tinted rings, 0.77 glass fill, hairline flash collar, dark LiDAR/mic surrounds, panel/logo/sapphire/antenna tones, lens glass alive (the "black void" cause was lensGlass envMapIntensity 0.28). The slice-2 worker escalated adding src/iphone/palette.ts (500-LOC rule forced the extraction; public surface re-exported unchanged) — accepted. Two residual nudges went to a slice-3 worker (subagent 872db1d3): MagSafe ring still traceable straight-on, silver lens rings reading near-black in the dark studio. Also noted for later housekeeping (not this round): parts.ts is 519 lines, over the 500 convention on HEAD already. Note: the first monolithic 12-defect brief (subagent 90413bb2) stalled ~25 min with zero writes and was interrupted; the work was re-sliced into small per-file assignments, which landed slice 1 in minutes. Round 4 landed and accepted (orchestrator-verified via the 24-shot matrix at native resolution + CDP dropdown probe; npm run verify green); committed to main. Workers: DeepSeek V4.1 Flash (`deepseek-official`/`deepseek-flash`) via durable `subagent` with explicit provider/model (policy enabled in `~/.dsh/settings.yaml` as `subagent-model-selection`). Orchestrator: kimi-k3.

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
