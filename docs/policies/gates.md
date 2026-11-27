# Studio gates

Use Node 24 and the committed lockfile. Run `npm run verify` for unit tests, typecheck, lint, and both Vite outputs. The second output is a single ES module whose three.js imports resolve to the consuming game’s own dependency.

After a build, `npm run check:studio` serves the real production output at a GitHub Pages-style subpath and launches a local headless Chrome. Set `SHOT_CHROME` if Chrome is outside the detected locations. The check exercises mouse orbit, a fixed camera, visible pixels, six poster images, customization, local persistence across reload, character playback, binary export and reimport, and the external SDK. Inspect the desktop and orbit screenshots in ignored `output/studio/`.

Run `npm run capture:posters` against the dev server at `http://127.0.0.1:5199` after changing model appearance. Set `SHOT_BASE` for another port. The six compressed library previews are product assets.

After a dependency change, run `npm run audit:full` and `npm run audit:runtime`. Verify the local dataset independently with `node scripts/dataset.mjs --verify`.
