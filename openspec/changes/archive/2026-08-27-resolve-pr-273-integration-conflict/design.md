## Context

PR #273 (`feat(calendar): detect stale sources and guide recovery`) is open and non-draft on
the issue's existing branch. Its implementation and all six scheduled checks were green at
head `41f314e`, and Reviewer approved that head, but GitHub now reports the PR as conflicting
with `main`.

The merge base is `e60f5ff`. Both sides added an ADR numbered 041 and a row in
`docs/mobile/architecture-book/decisions/README.md`: main owns school-logo theme variants,
while the PR owns last-good source recovery. The decisions-index edit conflicts textually and
the filenames/headings collide semantically. The two branches also add unrelated fields to
the committed OpenAPI contract and Orval schema output: main adds nullable dark school-logo
URLs, while the PR adds calendar source-health types. Git's merge is additive for those files,
but generated-contract drift checks must prove the result.

This is integration remediation, not another product change. The accepted ADR content,
canonical OpenSpec requirements, implementation, `run-e2e` label, and Tier H merge route must
remain intact.

## Goals / Non-Goals

**Goals:**

- Make the existing PR branch cleanly mergeable with current `main` without force-replacing
  its history or opening another PR.
- Keep both accepted architectural decisions under unique numbers and repair all links.
- Keep both additive API/generated-client changes without contract drift.
- Produce fresh exact-head local, scheduled CI, Simplifier, and Reviewer evidence.

**Non-Goals:**

- Changing source-health, school-logo, mobile, server, or E2E behavior.
- Revising either ADR's decision, alternatives, consequences, or revisit condition.
- Adding or changing a capability spec.
- Touching migrations, native/store configuration, credentials, infrastructure, workflows,
  deploy state, production data, or legacy Flutter.
- Merging the Tier H PR; the CEO owns the later human squash-merge request.

## Decision: Merge current main into the existing branch

The Applier will merge the fetched current `origin/main` into the checked-out PR branch and
resolve the conflict there. A normal merge preserves the existing branch and PR, avoids a
history-rewriting force-push, and makes the integrated base explicit. The Applier must confirm
the target `origin/main` SHA immediately before the merge and record it in the handoff.

Creating a replacement branch/PR is rejected by the one-issue/one-branch/one-PR invariant.
Rebasing and force-pushing is rejected because it needlessly replaces every reviewed head in
a long-running Tier H PR.

## Decision: Main retains ADR 041; source recovery becomes ADR 042

Main's `041-school-logo-theme-variants.md` is already canonical at this integration base. The
PR's `041-preserve-content-and-advise-source-recovery.md` will be moved to
`042-preserve-content-and-advise-source-recovery.md`, and its H1 will become `# 042 — …`.
The decisions index will use main's integrated table and append both 041 and 042 in numeric
order. All repository references to the source-recovery decision, including `calendar.md`
and `docs/react-native-migration/inbox/2026-08-26-stale-source-recovery-device-checks.md`,
will point to 042. A repository-wide search must find no stale 041 source-recovery link or
duplicate active ADR number.

Changing school-logo ADR 041 is rejected because it is already on main. Combining the two
decisions is rejected because they govern unrelated, independently costly-to-reverse
contracts. The renumber is bookkeeping only; neither accepted decision changes.

## Decision: Preserve contract changes through regeneration and semantic assertions

The merge result must retain main's `imageUrlDark` fields in `SchoolForList` and
`SchoolForSeo` and PR #273's `CalendarSourceHealthDto` plus required
`CalendarWithContent.sourceHealth`. Generated files must not be manually reconciled beyond
what a clean merge produces: run the server OpenAPI generator and mobile Orval generator,
then require no generated diff. Add focused JSON/type searches or existing contract tests to
make the two-sided survival explicit.

Choosing one side of `openapi/openapi.json` or `mobile/src/api/generated/` is rejected because
it would silently remove an already accepted contract. Hand-editing generated files is
rejected by the committed-spec seam.

## Decision: Re-establish every exact-head gate

The conflict-resolution head is new evidence. The Applier must run diff hygiene and strict
OpenSpec validation locally, plus the relevant generation/drift proofs. After push, the
existing `run-e2e` label must remain and all six scheduled checks must be successful at that
exact head, including Android and iOS native E2E. Only then does the same issue proceed through
fresh Simplifier and Reviewer passes. The previous green checks and approval do not transfer
to the new head.

No separate QA gate is added because the remediation has no new behavior. No autonomous merge
is authorized; after a clean Reviewer verdict the issue returns to the CEO for the Tier H
human squash-merge request.

## Risks / Trade-offs

- **[Main advances again before integration]** → Fetch immediately before merging, recompute
  the next ADR number, and stop for Founding Engineering only if 042 is no longer free or the
  conflict expands beyond additive integration/bookkeeping.
- **[A generated auto-merge silently drops one schema addition]** → Regenerate both artifacts,
  require a clean post-generation diff, and assert both dark-logo and source-health shapes.
- **[A stale ADR reference survives]** → Search by old filename, old heading, `ADR 041`, and the
  source-recovery title after the move; inspect the decisions index for unique numeric entries.
- **[The integration wakes unrelated failures]** → Keep remediation changes limited to the
  merge, ADR/reference reconciliation, and OpenSpec bookkeeping; route any behavioral failure
  to Founding Engineering rather than weakening tests.
- **[A prior green check is mistaken for current proof]** → Record the conflict-resolution SHA
  beside all six successful check URLs before handoff.

## Migration Plan

1. Fetch and record current `origin/main`, merge it into the existing branch, and inspect every
   conflict and auto-merged sensitive file before editing.
2. Preserve main's ADR 041, move the source-recovery ADR to 042, reconcile the index, and repair
   all source-recovery references without changing either decision's substance.
3. Regenerate/check the committed OpenAPI and Orval output and prove both additive contracts
   remain present.
4. Run diff hygiene, repository-wide ADR/reference checks, strict OpenSpec validation, and the
   smallest relevant local contract checks. Commit and push to the same PR branch.
5. Confirm `run-e2e` remains applied and record six successful scheduled checks at the exact
   pushed head. Hand the same issue to Simplifier, then Reviewer, for fresh exact-head passes.
6. After approval, return control to the CEO for a new Tier H human squash-merge request.

Rollback is branch-only: revert the integration/remediation commit on the same PR if its merge
or generated-contract proof is wrong. No data, deployment, or runtime rollback exists because
this change performs no deploy act and changes no behavior.

## Open Questions

None at the observed base. If current main consumes ADR 042 or introduces a non-additive
contract conflict before Apply starts, Founding Engineering must revise the numbering or
integration design.
