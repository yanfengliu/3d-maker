# Character animation coverage and studio comparison

Status: complete
Owner: Codex
Created: 2026-11-26
Updated: 2026-11-26

## Problem and outcome

The studio presents only the clips embedded in a model. The publisher's creator and public motion library expose many more animations. The inventory also omits humanoids from the Characters filter.

## Scope

Compare actual public user-facing controls, recover downloadable character motions for compatible rigs, make the animation collection practical to browse, preserve motion through game export and saved imports, and correct the character inventory.

## Approach

Use the publisher's exportable CC0 motion index, retain native clips, and bind added tracks only to supported skeletons. Use the public humanoid gallery to supplement API class labels. Keep the source datasets in ignored storage.

## Acceptance criteria

- Compatible characters have the downloadable repertoire in preview and GLB export. Existing embedded and custom clips remain usable.
- Desktop tests exercise playback, export and reimport; unrelated models keep their native motions.
- The first clip and newly chosen clips play by default, Play all advances through the complete repertoire, and Space toggles playback without interfering with field input.
- The desktop layout keeps model playback visible while browsing and editing.
- The report distinguishes the website's preview repertoire, downloadable motions, public creator features and paid gates.
- Character inventory reconciles the website roster with the public asset catalogue.

## Implementation steps

- Rig owner validates targets, bind poses and hip translation.
- Inventory owner reconciles the public gallery and API classes.
- Comparison owner checks the live public interfaces and records evidence.
- Integration owner packages motion data, connects the studio and SDK, inspects rendered motion, and verifies the deployment.

## Outcome

The public studio at `3324f55` passed 66 tests, strict typecheck, lint, both builds and the production Chrome gate. The live catalog returned 354 PolyFork character entries. The deployed viewer played Sitting on Taverna waiter, saved and reopened it, and exported all 88 clips with at least 23 channels each. The 85 public motion payloads match the downloaded source tracks. Desktop controls were exercised at 1440 × 960 and 1024 × 768. [Website comparison](../../design/polyfork-comparison.md) · [Review 0](reviews/0_implementation.md) · [Review 1](reviews/1_integration.md) · [Review 2](reviews/2_integration.md) · [Pages deployment](https://github.com/yanfengliu/3d-maker/actions/runs/45941492190)
