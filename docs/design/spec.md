# 3d-maker — showcase spec

Date: 2026-09-16
Status: owner directive — the repo is a 3D model showcase

## Purpose

Show procedural three.js models, live in the browser. Each model is built in code at its real dimensions and rendered in its own viewer page; an index page lists them on cards. The models are the product and the pages are the whole deliverable.

The earlier evolution-studio / voxel direction is abandoned (owner directive, 2026-09-16): no genome breeding, no variant gallery, no GLB export pipeline, and no dependency on the sibling `voxel` engine. `src/core/` was that engine and was removed with the direction. This spec replaces the studio-era design; `docs/design/model-studio.md` was deleted with it.

## The two pages

### `index.html` — the model index (`src/index/`)

The landing page. One card per registry entry, each card linking to that model's page and showing its poster.

Query contract:

- `?shot=1` — suppresses the card entrance so a capture lands on the first presented frame. `window.__shotReady` is set once every poster has loaded or failed (or after a 3 s poster timeout), because the posters are the only slow part of the page.

### `iphone.html` — the iPhone 17 Pro viewer (`src/iphone/`)

The model's own page: a procedural 1:1 mm model, a finish dropdown, and orbit controls. Units are millimetres.

Query contract:

- `?shot=1` — disables auto-rotate and every entrance animation, applies the exact preset camera on the first presented frame, and sets `window.__shotReady = true` only after at least 5 rendered frames.
- `?view=` — `hero` (default) | `front` | `back` | `left` | `right` | `top` | `bottom` | `camera-closeup`.
- `?color=` — `cosmic-orange` (default) | `deep-blue` | `silver`.
- `?noui=1` — hides the overlay panel (`#ui`), so a poster captures the model with no viewer chrome. Additive: it only takes effect together with `?shot=1`, and it changes no other parameter's behavior, so in normal browsing the panel is always shown.

Unknown values fall back to the defaults instead of throwing, so a typo in a shoot script produces a default frame rather than a blank page. The viewer also exposes `window.__iphone = { setColor, setView, ready, debug }`, `window.render_game_to_text()` and `window.advanceTime(ms)` for scripted checks.

Every viewer page keeps this contract, because the capture harness depends on it. The renderer is created with `preserveDrawingBuffer: true`; without it a headless capture is blank.

## The registry-driven index

`src/index/models.ts` is the single source for the index. Each `ModelEntry` carries the id, title, subtitle, description, href, poster path, and accent colour; both paths are written `./`-relative so one registry resolves under the dev server (`/`) and under the Pages project site (`/3d-maker/`) alike. `src/index/models.test.ts` checks the entries' fields, unique ids, `./`-relative hrefs, and that each poster file really exists under `public/`.

### Models

| id | page | poster |
|---|---|---|
| `iphone-17-pro` | `iphone.html` | `public/posters/iphone-17-pro.png` |

## Capture and deploy pipeline

- `scripts/capture-shots.mjs` drives headless Chrome over the DevTools protocol, waits for the page's own `window.__shotReady` flag, then screenshots. (`chrome --screenshot` is not usable: with `--virtual-time-budget` it captures before the WebGL scene has presented.) Env: `SHOT_BASE` (default `http://localhost:5199`), `SHOT_PAGE` (`iphone.html` by default, `index.html` for the index), `SHOT_LIST` as `view:color[:extra]` — an `extra` field is appended to the query as `&extra`, which is how `noui=1` is passed — plus `SHOT_W`, `SHOT_H`, `SHOT_OUT`.
- `scripts/shoot-iphone.ps1` wraps it into the full 8 views × 3 finishes matrix for the iPhone viewer.
- `scripts/sweep-iphone.mjs` continues from any preset and orbits/zooms by dispatching trusted mouse input through the page's real OrbitControls, so any angle or macro range is reachable through the same input path a visitor drives — never by assigning a camera pose. Env: `SHOT_BASE`, `SHOT_OUT`, `SHOT_W`/`SHOT_H`, and `SWEEP_LIST` as `name:view:color[:drag=dx,dy][:wheel=notches]`, semicolon-separated; a `drag=` value takes any number of strokes separated by `.` (`drag=-260,0.0,-90` applies both in sequence, for poses no single arc reaches), and a `wheel=` value is a comma-separated list of notches. It exits non-zero when a sweep that asked for a drag or a wheel left the page's camera where it was, so a sweep that did not actually run is not readable as a pose. It is the tool for the feature-by-feature fidelity audit `AGENTS.md` requires: chirality, edge profiles, counts, silhouettes and materials each read at 1:1 crops against reference photos.
- Posters live under `public/posters/` and are the card images on the index. A poster is a capture of the model's own page, not a separate render path — that is what keeps the card honest.
- `.github/workflows/pages.yml` deploys on every push to main: checkout → Node from `.nvmrc` (24) → `npm ci` → `npm run build` (the full local gate: `tsc --noEmit` then `vite build`) → upload `dist/` → deploy to GitHub Pages. The site is served under `/3d-maker/`, which is why `vite.config.ts` sets `base` per command.

## Adding a model, end to end

1. **Build the model** in its own `src/<model>/` directory, with its own page `<model>.html` at the repo root, and keep the screenshot contract: `?shot=1`, `?view=`/`?color=` where applicable, `?noui=1`, and `window.__shotReady` after at least 5 frames.
2. **Add a rollup input** for the page in `vite.config.ts` (one entry per page, keyed by name).
3. **Register it** in `src/index/models.ts`: a new `ModelEntry` with a unique id, `./`-relative href, `./`-relative poster, and accent colour. `src/index/models.test.ts` will require the poster file to exist.
4. **Shoot its poster** through `scripts/capture-shots.mjs` with `SHOT_PAGE` pointing at the new page, `SHOT_W=1400 SHOT_H=1000` for the card aspect, and write it to `public/posters/<id>.png`.
5. **Look at the poster** at native resolution — a passing test says nothing about the pixels.
6. **Update this spec's model list** and add a dated line to `docs/devlog/summary.md`.
7. **Run `npm run verify`** (29 tests, typecheck, lint at zero warnings, build) and confirm `dist/` carries the new page and poster.
