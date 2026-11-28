# Model datasets

## Site assets

The [site asset catalog](../public/datasets/site-assets/catalog.json) lists reusable, versioned GLBs extracted from procedural scenes. Paths in the catalog are relative to its directory. Each version has a byte count, a SHA-256 digest, dimensions in metres and source attribution. The studio serves the catalog at `./datasets/site-assets/catalog.json`. Open a downloaded GLB with **Import** in Form Foundry. The airport workspace also has this catalog and the verified v1 binary under the primary checkout’s local `dataset/site-assets/` directory.

To add a version, append the new metadata, give its GLB a new path, and append its metadata digest in `src/data/site-assets.test.ts`. The full-history check compares every earlier version, and the pinned records also work in shallow checkouts.

The first asset is the [SFO International Terminal departures roof, v1](../public/datasets/site-assets/sfo-international-roof/v1.glb). Its local origin is the supporting podium. The airport renderer places the model using the mapped headhouse footprint. The source scene determines the public-facing roof design, and the GLB preserves that revision for reuse.

## Polyfork dataset

The local dataset is in `dataset/polyfork/`. The 26 November 2026 snapshot contains the publisher’s 3,639-entry public index, a newer complete roster of 3,645 free API records, and two original GLBs. The remaining binaries are available on demand through the studio’s Polyfork search. [Public index](https://github.com/lucas-martinic/polyfork-catalog) · [API](https://polyfork.dev/api)

| Local file | Contents |
| --- | --- |
| `catalog.json`, `INDEX-LICENSE.md` | Published index, kit list and index licence at revision `b804068935f6d323d3bf2dd13b4a94d604ffe724` |
| `free-assets.json` | Complete free-model API listing at download time, including dimensions, categories, rig flags and source URLs where supplied |
| `survey-drone-7c71f9.glb` | Survey Drone, seven meshes |
| `family-traveller-9af47e.glb` | Family Traveller, eight skins and three embedded clips (Idle, Walk and Run) |
| `CREDITS.txt`, `manifest.json` | Per-model credits, modification status, source URLs, snapshot time, byte lengths and SHA-256 hashes |

### Download and verify

From the repository root, run `node scripts/dataset.mjs`. On the first run it downloads the pinned public index and pages the live metadata API, checks the publisher’s count against unique IDs, reads the two GLBs, then publishes the completed snapshot to `dataset/polyfork/`. Subsequent runs verify the saved files offline. Open either GLB with the studio’s file importer.

Run `node scripts/dataset.mjs --verify` for an explicit offline integrity check. To capture updated API records in a separate directory, run `node scripts/dataset.mjs --out dataset/polyfork-new`. The publisher can update a file at its CDN URL. Each snapshot records the exact bytes received.

The initial snapshot has these SHA-256 digests.

| File | SHA-256 |
| --- | --- |
| `catalog.json` | `4d8305e9bc1ada902cdbfcb51a7395f66cc27ef173bfa2db2c6bb932ea280275` |
| `free-assets.json` | `bdc93f9dbf5594939fc4d9b6a58fb9cd4536b1f822806aaaf17996301c051f26` |
| `survey-drone-7c71f9.glb` | `7c3a072ce0a4f917226213ee78c62d4c73e617794d9aff7e612f237585d30edd` |
| `family-traveller-9af47e.glb` | `06321437a64fbf7800306647ece56595173b00d834a5e16064fb7728a5af72e9` |

### Use from another local session

On the shared Mac the catalog snapshot is at `/Users/yanfengliu/github/3d-maker/dataset/polyfork/` and the motion sources are at `/Users/yanfengliu/github/3d-maker/dataset/character-motions/`. Codex, Claude Code and other tools running as the same macOS user can read these paths when their filesystem permissions allow it. Another worktree can refer to the same absolute paths. A fresh clone on another machine can run the two download commands in this guide.

### Storage and rights

Git tracks the downloader and instructions. The downloaded data occupies about 7.3 MiB for this snapshot and stays in an ignored directory outside the production build. The public index has an explicit reuse licence. The supplemental live API records stay local. [Index licence](https://github.com/lucas-martinic/polyfork-catalog/blob/b804068935f6d323d3bf2dd13b4a94d604ffe724/LICENSE.md)

The two free low-poly meshes may be redistributed under CC BY 4.0 when their model credit, source, licence and modification status travel with them. Polyfork applies separate terms to its procedural source, HD files and renders. Its canonical single-download archive of the entire mesh catalogue requires a Lifetime or Founders account. The publisher requests on-demand CDN fetches for public integrations. [Polyfork licensing](https://polyfork.dev/licensing) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Character motion library

The separate character library contains the 85 CC0 motions available for download on 26 November 2026. Quaternius authored the Universal Animation Library and PolyFork retargeted the tracks to its humanoid skeleton. The publisher identifies the index and the individual files as CC0. [Publisher's release index](https://polyfork.dev/cdn/anim-index.json) · [Quaternius](https://quaternius.com/) · [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

The studio ships each motion's playback data as a small compressed binary so character animation works offline and a player's game can load the SDK without calling PolyFork. Only these release assets are versioned. The public source index and raw JSON stay in ignored `dataset/character-motions/`. Running `node scripts/sync-character-motions.mjs` refreshes the motion assets. Use `--offline` to reproduce them from the local source snapshot.
