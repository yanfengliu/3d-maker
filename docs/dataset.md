# Polyfork dataset

The local dataset is in `dataset/polyfork/`. The 26 November 2026 snapshot contains the publisher’s 3,639-entry public index, a newer complete roster of 3,645 free API records, and two original GLBs. The remaining binaries are available on demand through the studio’s Polyfork search. [Public index](https://github.com/lucas-martinic/polyfork-catalog) · [API](https://polyfork.dev/api)

| Local file | Contents |
| --- | --- |
| `catalog.json`, `INDEX-LICENSE.md` | Published index, kit list and index licence at revision `b804068935f6d323d3bf2dd13b4a94d604ffe724` |
| `free-assets.json` | Complete free-model API listing at download time, including dimensions, categories, rig flags and source URLs where supplied |
| `survey-drone-7c71f9.glb` | Survey Drone, seven meshes |
| `family-traveller-9af47e.glb` | Family Traveller, eight skins and three embedded clips (Idle, Walk and Run) |
| `CREDITS.txt`, `manifest.json` | Per-model credits, modification status, source URLs, snapshot time, byte lengths and SHA-256 hashes |

## Download and verify

From the repository root, run `node scripts/dataset.mjs`. On the first run it downloads the pinned public index and pages the live metadata API, checks the publisher’s count against unique IDs, reads the two GLBs, then publishes the completed snapshot to `dataset/polyfork/`. Subsequent runs verify the saved files offline. Open either GLB with the studio’s file importer.

Run `node scripts/dataset.mjs --verify` for an explicit offline integrity check. To capture updated API records in a separate directory, run `node scripts/dataset.mjs --out dataset/polyfork-new`. The publisher can update a file at its CDN URL. Each snapshot records the exact bytes received.

The initial snapshot has these SHA-256 digests.

| File | SHA-256 |
| --- | --- |
| `catalog.json` | `4d8305e9bc1ada902cdbfcb51a7395f66cc27ef173bfa2db2c6bb932ea280275` |
| `free-assets.json` | `bdc93f9dbf5594939fc4d9b6a58fb9cd4536b1f822806aaaf17996301c051f26` |
| `survey-drone-7c71f9.glb` | `7c3a072ce0a4f917226213ee78c62d4c73e617794d9aff7e612f237585d30edd` |
| `family-traveller-9af47e.glb` | `06321437a64fbf7800306647ece56595173b00d834a5e16064fb7728a5af72e9` |

## Storage and rights

Git tracks the downloader and instructions. The downloaded data occupies about 7.3 MiB for this snapshot and stays in an ignored directory outside the production build. The public index has an explicit reuse licence. The supplemental live API records stay local. [Index licence](https://github.com/lucas-martinic/polyfork-catalog/blob/b804068935f6d323d3bf2dd13b4a94d604ffe724/LICENSE.md)

The two free low-poly meshes may be redistributed under CC BY 4.0 when their model credit, source, licence and modification status travel with them. Polyfork applies separate terms to its procedural source, HD files and renders. Its canonical single-download archive of the entire mesh catalogue requires a Lifetime or Founders account. The publisher requests on-demand CDN fetches for public integrations. [Polyfork licensing](https://polyfork.dev/licensing) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
