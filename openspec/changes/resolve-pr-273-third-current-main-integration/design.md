## Context

PR #273 remains open and non-draft on the required existing branch at
`f5490f34d11576ff81f4da71536cdfb7dfb5eea0`, retains `run-e2e`, and GitHub currently reports
it mergeable and clean. That status is insufficient: freshly fetched `origin/main` is
`3f550e832b47049ed4db85a0d31a6b49e5971b5d`, which is not an ancestor of the PR head, and the
latest Reviewer decision vetoes the old head.

The two commits added to main since the prior integration are the portable tracer declaration
repair and the contact feedback submission repair. The latter changes the committed contact
response contract, generated Orval error type, server delivery behavior, mobile retry/privacy
behavior, FR/EN text, Architecture Book guidance, and canonical/archived OpenSpec contracts.
`git merge-tree --write-tree HEAD origin/main` currently succeeds without a textual conflict,
but clean auto-merging is not proof that all both-parent contracts remain intact.

The two earlier one-off integration changes are archived at
`openspec/changes/archive/2026-08-27-resolve-pr-273-integration-conflict/` and
`openspec/changes/archive/2026-08-27-resolve-pr-273-second-integration-conflict/`. They are
immutable evidence. This third active change covers only the new current-main ancestry gap and
introduces no product behavior.

## Goals / Non-Goals

**Goals:**

- Restore current-main ancestry on the same branch and PR through a normal merge.
- Preserve accepted source-health, Calendar, contact, feedback, tracing, native-config, API,
  localization, Architecture Book, and OpenSpec behavior in one semantic union.
- Prove coupled generated contracts are drift-free and sensitive/excluded surfaces have not
  been altered by reconciliation.
- Re-establish local, scheduled-CI, Simplifier, and Reviewer evidence on the new exact head
  before autonomous Reviewer-owned squash merge.

**Non-Goals:**

- Changing any accepted product requirement, error response, copy, telemetry policy, source
  recovery behavior, Calendar sync policy, ADR, or native/store configuration.
- Rewriting either archived prior-cycle change or creating a reusable canonical remediation
  specification.
- Rebasing, force-pushing, replacing the branch/PR, opening a second PR, or merging the PR in
  the Apply stage.
- Editing `.github/workflows/`, migrations, credentials/certificates, infrastructure, deploy
  behavior, production data, background-sync operations, or legacy Flutter.
- Adding a QA gate or performing a deploy act.

## Decision 1 — Normally merge freshly fetched main into the existing branch

The Applier will fetch `origin/main` immediately before integration, record the base and head
SHAs, recompute the merge tree, and merge the fetched base normally into the checked-out PR
branch. The resulting merge/remediation commits will be pushed without force to the same remote
head. The Applier will neither merge PR #273 nor alter its identity.

This retains the one-issue/one-branch/one-PR invariant and preserves reviewed history. Rebasing
or force-pushing would replace that history; a replacement PR would split the accepted feature
and its gates. If fresh main introduces a non-additive conflict, a new sensitive surface, or a
contract choice not decided here, the Applier returns the same issue to Founding Engineering
instead of expanding scope.

## Decision 2 — Inspect semantic union even when Git reports a clean merge

The merge result must retain all source-health behavior from PR #273 and all current-main
contact/tracing behavior. The Applier will compare both parents for every file changed on both
sides and explicitly verify:

- the committed OpenAPI retains the source-health response and contact 201/400/503 semantics;
- generated output retains source-health models and current-main contact `ErrorType<void>`;
- EN/FR catalogs retain source-recovery text and current-main not-sent/retry text with parity;
- Architecture Book pages retain ADR 042, ADR 043, both Calendar contracts, and current-main
  feedback privacy/retry guidance;
- canonical and archived OpenSpec trees retain both sides without rewriting the two prior
  integration archives or the current-main contact/tracer archives; and
- the portable tracer declaration remains exactly the accepted current-main implementation.

Selecting either parent wholesale is rejected because it can silently remove an accepted
contract. Treating `merge-tree` success as sufficient is rejected because JSON, generated code,
catalogs, and prose may auto-merge while losing semantic completeness.

## Decision 3 — Keep generator ownership and main's native config authoritative

`openapi/openapi.json` and `mobile/src/api/generated/` remain one coupled contract. The Applier
will use the documented server OpenAPI generator followed by mobile Orval generation and require
no output drift; generated code is never hand-edited. Focused assertions and existing tests will
cover both source-health and contact response/error shapes.

`mobile/app.config.ts` must match freshly fetched main byte-for-byte after integration, even
though the newly observed commits do not modify it. This preserves the sensitive ADR 042
device-family/full-screen contract. No native adjunct, workflow, migration, infrastructure, or
legacy Flutter change is authorized.

## Decision 4 — Archive the operational change and re-establish exact-head gates

After focused local checks and strict validation pass, the Applier will complete the task
evidence and archive this one-off change with `--skip-specs`. The archive must not create a
canonical `same-pr-third-current-main-integration` specification. Final all-spec strict
validation must pass after archival.

The final pushed SHA must retain `run-e2e` and receive fresh success for every required
scheduled check, including Android and iOS native E2E. Only then does the issue proceed through
fresh Simplifier and Reviewer passes. Old-head CI or review cannot authorize merge. The board's
scoped grant allows only the Reviewer to squash-merge after these gates; it authorizes no deploy
act, background operation, force-push, or unrelated work.

## Risks / Trade-offs

- **[Main advances again before Apply]** → Fetch and recompute immediately before merging; use
  the latest base if the union remains within this design, otherwise return to Founding
  Engineering with the new conflict/surface inventory.
- **[Clean auto-merge loses one contract]** → Compare both-parent markers and run focused
  source-health, contact, localization, Architecture Book, and OpenSpec assertions.
- **[Generated output hides a contract regression]** → Run both generators in order, inspect
  their diffs, assert both contract families, and require a clean generated tree.
- **[Current-main native config is accidentally changed]** → Require an empty
  `origin/main` comparison for `mobile/app.config.ts` and ADR 042.
- **[Old CI is mistaken for final evidence]** → Record the pushed SHA beside all scheduled
  check URLs and accept only check runs whose head SHA matches it.
- **[Operational archives become rewritten history]** → Add only this cycle's dated archive;
  verify the two prior-cycle and current-main archives are present and unmodified.

## Migration Plan

1. Fetch current `origin/main`, verify PR/branch identity and `run-e2e`, record SHAs, recompute
   merge shape, and merge normally without rebase or force-push.
2. Inspect and reconcile the semantic union across API/generated output, i18n, Architecture
   Book, OpenSpec, contact/feedback, tracing, and source-health behavior.
3. Prove main's native config and excluded sensitive surfaces remain unchanged; run focused
   tests, generator drift checks, and diff hygiene.
4. Strictly validate and archive this one-off change with `--skip-specs`, then strictly validate
   the final OpenSpec repository.
5. Commit and push without force to the same branch, update the existing PR body, obtain fresh
   exact-head scheduled CI, and hand the same issue to Simplifier then Reviewer.

Rollback is confined to reverting the new integration/remediation commits on this same PR.
There is no data, deployment, or production-operation rollback because the cycle changes no
runtime behavior by design and performs no deploy act.

## Open Questions

None at observed `origin/main` `3f550e832b47049ed4db85a0d31a6b49e5971b5d`.
