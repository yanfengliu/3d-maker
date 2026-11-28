# Versioned site models and instanced GLB import

Status: complete
Owner: Codex integration owner
Created: 2026-11-28
Updated: 2026-11-28

## Problem and outcome

The SFO simulation needs a reusable International Terminal roof. A catalog search found generic bays and facade modules and no matching headhouse. Register the roof at its physical scale with provenance so another project can reuse it.

## Scope

Register an original roof GLB exported from the airport scene in a first-party catalog. Correct imported model framing and inspection for instanced architecture.

## Approach

The catalog records each immutable version’s path, digest, dimensions, source and credit. The airport exporter checks geometry and every steel placement against the imported GLB. Measure the transformed vertices of each instance for the studio camera and geometry audit.

## Acceptance criteria

- [x] Version 1 has a verified SHA-256 and can be loaded as GLB 2.0.
- [x] The airport exporter preserves six meshes and all 604 steel placements on reimport.
- [x] The studio displays the asset at the recorded size and all seven inspection views frame the building.
- [x] The full studio verification and browser checks pass.

## Implementation steps

- [x] Search the existing datasets, model the missing landmark from public architectural references and export the exact scene geometry.
- [x] Record the version, dimensions, credits, catalog discovery and binary integrity check.
- [x] Verify instanced imports through real studio controls and record independent review.

## Outcome

The registered v1 is 273,100 bytes and contains 21,470 triangles. Its six meshes include 604 steel member placements. Seven full-resolution studio views passed silhouette and framing checks. The asset round-tripped at 262.1302 × 22.1800 × 65.3167 m and seated at the support surface in an SDK composition. All 9,884 tests, strict TypeScript, ESLint, both production builds, the bundle check, the CI browser smoke test and the full studio browser check passed. The [last review](reviews/3_implementation.md) confirmed the SDK and legacy import repairs. The local dataset is usable independently of a public Pages release.
