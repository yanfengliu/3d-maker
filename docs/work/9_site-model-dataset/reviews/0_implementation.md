# SFO dataset registration

## Target

Base `650685f`. The reviewed source is the initial six-file registry snapshot. The binary Git diff is retained locally at `output/reviews/sfo-roof-registry-1128.patch.gz`.

## Reviewers and coverage

- codex (gpt-6.2-astra, max) — abstain.

- claude (claude, max) — abstain.

## Reports

### codex

Codex -o report is missing or empty; timed out after 270s

### claude

expected 1 result event, got 0; result text is empty or non-string; expected 1 model in modelUsage, got 0 (none); timed out after 270s

## Findings and disposition

Neither reviewer returned a report during the initial 270-second run.

## Verification

The read-only tree audit passed. The registry records six meshes, 604 member placements and a checked SHA-256 for the GLB.

## Round outcome

Both lanes subsequently reviewed the registry together with the corrected model-inspection paths.
