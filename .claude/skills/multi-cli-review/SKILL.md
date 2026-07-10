---
name: multi-cli-review
description: Use when running the multi-CLI (Codex + Claude) adversarial code review on high-risk changes or full-codebase audits — routes to the fleet-canonical runbook (pins, commands, output extraction, failure modes) plus 3d-maker-specific notes.
---

# Multi-CLI review — 3d-maker stub

**Read the fleet-canonical runbook now:** `../loop-ops/docs/skills/multi-cli-review.md` — current review model pins (the fleet's single bump site), exact CLI commands, `-o` output extraction, Windows gotchas, and failure modes. Do not act from memory of an older per-repo copy of this skill.

3d-maker-specific notes:

- Reviewer pin sites in scripts: NONE (verified 2026-07-10 — pre-scaffold repo with no scripts; re-grep for hard-coded reviewer models once scripts exist).
- Review syntheses and unreachable-CLI/failure notes go to `PROGRESS.md`, this repo's progress log (pre-scaffold repo — no devlog or threads tree; see AGENTS.md → Core rules and Code review).
