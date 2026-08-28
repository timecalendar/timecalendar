## Context

PR #273 remains open and non-draft on its required existing branch at
`7095734e1b7e086f1cdb6bde688c49b056c34a4b`, retains `run-e2e`, and all exact-head checks are
green. Freshly fetched `origin/main` is now `acc7fe3e6505ea3cac2731efb6dcc87fb789c609`, the
squash merge of PR #275 (`fix(server): normalize ADE export date windows`), so it is not an
ancestor of the reviewed head. `git merge-tree --write-tree HEAD origin/main` succeeds at the
observed base, but a textually clean result is not sufficient proof at this seam.

PR #275 transforms recognized ADE `firstDate`/`lastDate` or `nbWeeks` parameters only in the
fetch layer and explicitly preserves the stored source. PR #273 classifies source health from
the persisted `Calendar.url`, including AMU's retired host/year evidence and expired-window
boundaries, and returns only fixed URL-free metadata. The intended composition is therefore:
the exact stored URL remains evidence for health classification, while a derived normalized
URL is used only for each upstream request. Classifying the derived transport URL could hide a
stale source; persisting it could destroy the evidence and violate both accepted contracts.

The prior three one-off integration changes under `openspec/changes/archive/2026-08-27-*pr-273*`
are immutable history. This fourth active change covers only the new ancestry gap and adds no
product requirement.

## Goals / Non-Goals

**Goals:**

- Restore current-main ancestry on the same branch and PR through a normal merge.
- Preserve the exact persisted-source/fetch-derived-URL boundary and both accepted behaviors.
- Preserve both Calendar contracts, ADRs 042/043, generated source-health contracts, and both
  parents' canonical/archived OpenSpec material without semantic loss.
- Re-establish focused local, exact-head CI, Simplifier, and Reviewer evidence before the
  authorized autonomous squash merge.

**Non-Goals:**

- Changing ADE window calculation, source-health rules, API response shapes, stored calendar
  identity, recovery UX, sync scheduling, or any other accepted product behavior.
- Rewriting any prior-cycle archive or creating a reusable canonical integration capability.
- Rebasing, force-pushing, replacing the branch/PR, opening a second PR, or merging during Apply.
- Editing `mobile/app.config.ts`, `.github/workflows/`, migrations, credentials/certificates,
  infrastructure, deploy behavior, production data, background operations, or legacy Flutter.
- Adding a QA gate or performing a deploy act.

## Decision 1 — Normally merge freshly fetched main into the existing PR branch

The Applier will fetch `origin/main` immediately before integration, record exact branch and
base SHAs, recompute the merge tree, and merge that base normally into the checked-out PR
branch. The commits will be pushed without force to the same remote head. If fresh main expands
beyond additive integration or creates an undecided contract choice, the Applier returns the
same issue to Founding Engineering rather than guessing.

This preserves the one-issue/one-branch/one-PR invariant and reviewed history. Rebasing,
force-pushing, and replacement PRs are rejected because they replace or split that history.

## Decision 2 — Persisted URL remains health evidence; normalized URL remains fetch-local

The integrated call graph must keep two values with distinct ownership:

- `CalendarSyncService` passes the persisted `Calendar.url` into `FetchService` and later saves
  the same source identity.
- `FetchService` derives `transformedUrl` through generic and school strategy renamers and gives
  only that derived value to the upstream fetcher.
- `CalendarService` gives the persisted `calendar.url`, never fetch debug/transport output, to
  `classifyCalendarSourceHealth` when building the batch response.

The Applier will inspect those call sites after the merge and run the existing focused tests
that prove creation/resync normalization without stored-source mutation, AMU/expiry classifier
boundaries, and response classification. If those tests do not jointly prove that a retired or
expired original URL remains the classifier input after a normalized fetch, the Applier will
add the smallest server regression at the existing service seam. No production behavior should
be changed merely to manufacture a test.

Persisting the transformed URL is rejected because it destroys exact evidence and violates the
ADE spec. Classifying the transformed URL is rejected because today's rolling window could mask
the original stale window. Disabling normalization for classified sources is rejected because
it needlessly breaks the accepted fetch repair.

## Decision 3 — Preserve both documentation/spec contracts and generator ownership

The merge result must retain both additions to `calendar.md`: PR #273's last-good advisory
source recovery and main's fetch-time rolling ADE-window policy, alongside the server sync
budget contract. ADR 042 and source-recovery ADR 043 remain unique and unchanged. The canonical
`calendar-source-health`, `server-ade-export-window`, and `server-calendar-sync-policy` specs
and both parents' archives must survive without rewriting prior operational archives.

`openapi/openapi.json` and `mobile/src/api/generated/` remain a generated coupled contract.
Although PR #275 declares no API change, the Applier will run/assert the established generation
drift proof and retain the complete source-health schema. Selecting one parent wholesale or
hand-editing generated output is rejected.

## Decision 4 — Excluded sensitive surfaces stay byte-identical and gates restart

`mobile/app.config.ts` must match freshly fetched main byte-for-byte, preserving ADR 042.
`.github/workflows/` must receive no integration-authored edit. Migrations, native adjuncts,
credentials/certificates, infrastructure, deploy configuration, production data, background
operations, and `app/` remain excluded.

After local semantic checks, the Applier will complete and archive this operational change with
`--skip-specs`, then run strict all-spec validation. The pushed exact head must retain `run-e2e`
and pass every required scheduled check, including Android and iOS native E2E, before fresh
Simplifier and Reviewer passes. Old-head green evidence cannot authorize merge. The board grant
allows Reviewer-owned squash merge only after those gates; it grants no deploy act.

## Risks / Trade-offs

- **[Main advances again before Apply]** → Fetch and recompute immediately before merging; use
  the newer base only while the semantic scope remains covered, otherwise return to Founding
  Engineering with the new inventory.
- **[Clean auto-merge obscures a URL-evidence regression]** → Inspect the three call sites and
  run the creation/resync, classifier, and response suites; add one focused service regression
  only if the composition is not already proven.
- **[One Calendar or canonical spec contract is dropped]** → Compare both parents and assert
  the source-recovery, ADE-window, and sync-policy markers after the merge.
- **[Generated output drifts despite no intended API change]** → Run server OpenAPI then mobile
  Orval generation and require a clean result with source-health shapes present.
- **[Old evidence is mistaken for final proof]** → Record the final pushed SHA with check URLs
  and accept only runs whose head SHA matches it.

## Migration Plan

1. Fetch and record current `origin/main`; verify same PR/branch identity and `run-e2e`; recompute
   merge shape; merge normally without rebase or force-push.
2. Inspect the stored-source → fetch-derived URL → source-health call graph and preserve both
   parents' implementation, tests, Calendar guidance, canonical specs, and archives.
3. Prove generated-contract parity and excluded sensitive-surface invariants; run the smallest
   focused suites and diff hygiene.
4. Strictly validate/archive this one-off change with `--skip-specs`, validate all OpenSpec
   artifacts, commit, and push without force to the existing PR.
5. Update the existing PR body, obtain fresh exact-head scheduled CI, and hand the same issue
   through Simplifier and Reviewer for the authorized merge gate.

Rollback is a normal revert of this cycle's integration/remediation commits on the same PR.
There is no data or deploy rollback because this cycle changes no runtime contract and performs
no production operation.

## Open Questions

None at observed `origin/main` `acc7fe3e6505ea3cac2731efb6dcc87fb789c609`.
