## Context

PR #273 (`feat(calendar): detect stale sources and guide recovery`) is open and non-draft on
the issue's existing branch at `8f32f6e62fb4ab3b2be1424976366f5d81c11be7`. Fresh preflight
fetched `origin/main` at `87e3ad941d17b4b242c63ae6bba1316af2bc4948`; GitHub reports the
PR as conflicting, and `git merge-tree --write-tree HEAD origin/main` reports one direct
conflict in `docs/mobile/architecture-book/decisions/README.md`.

The conflict is semantically larger than that one textual hunk. Main now owns ADR 042,
`042-iphone-ipad-portrait-contract.md`, and makes `mobile/app.config.ts` the binding source for
the iPhone/iPad portrait-only full-screen contract. PR #273 already owns
`042-preserve-content-and-advise-source-recovery.md`. Both branches also changed
`docs/mobile/architecture-book/calendar.md`: the PR adds last-good source-health and advisory
recovery guidance, while main adds the server sync work-budget, cancellation, concurrency,
retry, due-selection, and hydration policy.

The prior one-off change, archived as
`openspec/changes/archive/2026-08-27-resolve-pr-273-integration-conflict/`, records the first
integration cycle and remains immutable historical evidence. This new change covers only the
second conflict cycle. It changes no accepted product behavior.

## Goals / Non-Goals

**Goals:**

- Restore the existing branch and PR #273 to mergeability through a normal merge of freshly
  fetched main.
- Keep both accepted ADRs under unique identifiers and repair every live reference.
- Preserve both binding Calendar additions and main's native/store configuration exactly.
- Preserve the complete OpenAPI/generated-client contract union without drift.
- Produce fresh exact-head local, scheduled-CI, Simplifier, and Reviewer evidence before the
  already-authorized autonomous squash merge.

**Non-Goals:**

- Changing source recovery, server sync policy, device support, native config, API behavior,
  mobile behavior, E2E behavior, or any accepted ADR substance.
- Editing the archived first-cycle change or creating a canonical reusable remediation spec.
- Rebasing, force-pushing, replacing the branch/PR, or opening another PR.
- Touching `.github/workflows/`, migrations, credentials/certificates, infrastructure, deploy
  behavior, production data, background-sync operations, or legacy Flutter.
- Adding a separate QA gate or performing a deploy act.

## Decision: Merge freshly fetched main into the existing branch

The Applier will fetch `origin/main` immediately before integration, record its SHA, recompute
the merge tree, and merge it normally into the checked-out PR branch. The merge commit will be
pushed without force to the same remote head. This preserves PR identity and reviewed history
while making the second integration base explicit.

A replacement branch/PR violates the one-issue/one-branch/one-PR invariant. Rebasing or
force-pushing replaces reviewed history and is explicitly outside the authorization. If main
has advanced beyond the observed SHA and the conflict is no longer limited to additive
integration plus ADR/reference bookkeeping, the Applier returns the issue to Founding
Engineering rather than expanding scope.

## Decision: Main retains ADR 042; source recovery becomes ADR 043

Main's `042-iphone-ipad-portrait-contract.md` is canonical at the observed base. The Applier
will move the source-recovery ADR to `043-preserve-content-and-advise-source-recovery.md` and
change only its numeric H1 from 042 to 043. The decisions index will start from main's table and
contain one ordered row for each ADR. Every live source-recovery reference—including
`calendar.md` and
`docs/react-native-migration/inbox/2026-08-26-stale-source-recovery-device-checks.md`—will
point to 043.

Renumbering main's ADR is rejected because main already owns 042. Combining the two ADRs is
rejected because they record unrelated load-bearing decisions. Editing either decision's body
is rejected because this cycle is identifier reconciliation only. Repository-wide basename,
H1, link, title, and numeric checks will prove uniqueness and unchanged substance; references
inside the archived first-cycle operational record remain historical and are not rewritten.

## Decision: Preserve the semantic union of `calendar.md`

The merged `calendar.md` must retain PR #273's complete source-health snapshot, advisory
last-good display, and recovery guidance and main's complete server sync-policy paragraphs.
The additions describe separate layers of the same sync path and both remain binding. The
Applier will compare the merged sections against each parent, not rely on Git's clean
auto-merge result alone.

Choosing either parent wholesale is rejected because it would silently delete accepted
current-state guidance. Rewording or consolidating the paragraphs is rejected because this
integration cycle authorizes no rule change.

## Decision: Keep main's native config and the full generated-contract union

The merge result must use main's `mobile/app.config.ts` byte-for-byte. The Applier will not
resolve or clean up that file and will prove `git diff origin/main -- mobile/app.config.ts` is
empty after integration. This ensures main's ADR 042 device-family/full-screen source contract
arrives unchanged.

The committed OpenAPI document and Orval output must retain the source-health contract already
on PR #273 and every main-side addition, including the dark-logo fields. Generated files remain
generator-owned: run the documented server OpenAPI and mobile Orval generation/drift checks,
then require a clean tree for those outputs. Selecting one parent wholesale or hand-editing
generated output is rejected because either can silently discard an accepted contract.

## Decision: Re-establish every gate on the new exact head

After local diff hygiene, strict change validation, semantic/reference assertions, focused
contract checks, and generated drift checks pass, the one-off change will be archived with
`--skip-specs` and validated in its final repository state. The Applier will commit and push
without force, confirm PR #273 still has the same head branch and `run-e2e` label, and require
every scheduled check—including Android and iOS native E2E—to succeed for that exact SHA.

Only then may the same issue move through fresh Simplifier and Reviewer passes. Old-head CI and
review evidence is inapplicable. No separate QA pass is needed because integration adds no
behavior. The board's scoped authorization allows the Reviewer to squash-merge only after the
fresh exact-head gates and a clean final verdict; it authorizes no deploy act.

## Risks / Trade-offs

- **[Main advances or consumes ADR 043 before Apply]** → Fetch and recompute immediately before
  merging; if the assumptions materially change, return to Founding Engineering for a revised
  integration decision.
- **[A clean `calendar.md` auto-merge drops or garbles one contract]** → Compare both parent
  sections semantically and assert the complete source-recovery and server sync-policy markers.
- **[Native config is accidentally reconciled from the PR side]** → Require an empty diff from
  freshly fetched main for `mobile/app.config.ts` and retain main's ADR 042 unchanged.
- **[A generated merge silently loses a contract addition]** → Regenerate both contract
  surfaces, require no drift, and assert source-health, dark-logo, and current main shapes.
- **[A stale ADR 042 source-recovery link survives]** → Search live repository content by old
  filename, title, number, basename, and H1; exempt only immutable archived operational history.
- **[Old CI is mistaken for current evidence]** → Record the final pushed SHA beside every
  successful check URL before downstream handoff.

## Migration Plan

1. Fetch and record current `origin/main`; verify the same branch/PR and expected conflict
   shape, then merge normally without rebase or force-push.
2. Preserve main ADR 042, move source recovery to ADR 043, reconcile the decisions index, and
   repair all live source-recovery references while proving both ADR bodies unchanged.
3. Inspect `calendar.md` against both parents and prove both binding additions survive.
4. Prove `mobile/app.config.ts` equals main; regenerate/check OpenAPI and Orval output and prove
   the complete contract union remains present.
5. Run focused verification, update the Architecture Book only through the required identifier
   and semantic-union reconciliation, archive this one-off change with `--skip-specs`, and run
   strict final validation.
6. Commit and push to the same branch without force; require fresh exact-head scheduled checks,
   then hand the same issue to Simplifier and Reviewer. Reviewer may squash-merge autonomously
   only after all gates are clean.

Rollback is branch-only: revert the integration/remediation commits on the same PR if the
resolution is wrong. There is no data, runtime, or deployment rollback because this change
performs no deploy act and changes no behavior.

## Open Questions

None at `origin/main` `87e3ad941d17b4b242c63ae6bba1316af2bc4948`. A materially different
fresh base returns to Founding Engineering rather than being guessed through during Apply.
