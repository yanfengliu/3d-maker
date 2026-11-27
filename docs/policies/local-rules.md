# Form Foundry local rules

Repository-specific rules that complement the fleet constitution in `AGENTS.md`.

## Append-only model variations

Every procedural model in the catalog supports multiple stored variations so older versions remain usable for different situations (seasons, lighting, attachments, structural alternatives).

- **Never overwrite or delete an existing model or variation to create a new version.** Register a new variation ID in `src/models/variations.ts` (using `recipe` overrides, `modify(root, p, detail)` for additive geometry, or `replaceBase: true` for a full alternate build) while keeping `default` and all prior variations intact.
- **Lock new variations with `npm run variations:lock`.** This appends each new `(template, variation)` entry and its deterministic recipe/standard/HD geometry fingerprints to `src/models/variations.lock.json`.
- **Never delete entries from `src/models/variations.lock.json`, and never edit locked hashes by hand.** `src/models/variations-guard.test.ts` (run inside `npm run verify` locally and in CI) checks live models against the lockfile AND checks the lockfile against reachable Git history (`HEAD`, `HEAD~1`, `main`, `origin/main`) to block accidental or silent variation wipes.
- **Bug fixes on an existing variation require an explicit audited repair.** Only when fixing a genuine geometry or rendering defect on an existing variation (such as disconnected parts or occluded geometry — never to replace a working look with a new design), run `npm run variations:lock -- --repair <template@variation> --reason "<bug fix explanation>"` so the exact hash transition and bug-fix reason stay recorded permanently in `repairs[]`.
