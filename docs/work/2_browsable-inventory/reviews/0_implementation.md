# Review 0: implementation

## Target

Unified inventory in 3d-maker from `04fb550` to `9d46a3fe0c03d3c667de3e21c02af7a020f4faf2`.

## Reviewers and coverage

An independent reviewer in the current workspace inspected browsing, selection and saved entries, exercised the expired-cache failure with a mocked fetch, and checked the downloaded public catalog. Automatic approval review rejected sending the source diff to the external Codex CLI reviewer. The other CLI availability probe returned a model identifier different from the fleet pin. Neither CLI contributed a report.

## Reports

### Independent workspace reviewer

Two P2 findings at `9d46a3f`.

- Deleting a saved PolyFork item while it opens leaves its download active. When the download finishes, the editor installs the deleted inventory ID and “Save changes” fails. Cancel the matching pending open on deletion. `src/studio/shelf.ts:176`
- A catalog outage after the cache expires loses the requested page. I reproduced page 10 falling back to page 1 and staying there after a successful Retry. Preserve the requested page separately from the fallback page. `src/studio/shelf.ts:115`, `src/data/browse.ts:186`

All 3,645 entries in the local PolyFork snapshot passed the catalog validation rules and mapped to the nine supported categories.

## Findings and disposition

| ID | Disposition | Repair |
|---|---|---|
| F0 | Accepted. The editor can select a deleted record after its download completes. | Cancel opening an entry when deletion is confirmed or its removal appears in a saved inventory refresh. |
| F1 | Accepted. The local fallback page overwrites the page to retry. | Retain the requested page through an outage and clear it when the visitor changes filters or navigates. |

## Verification

The integration owner ran the 51-test verification suite and the production browser gate on the reviewed target. A live catalog check reached page 305 and opened Fox from filtered results.

## Round outcome

Both findings require a repair and a focused recheck.
