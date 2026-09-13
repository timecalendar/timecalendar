## Context

PR #410 merged the T02 calendar week-paging implementation, but its post-merge evidence correction
was committed after the merge and therefore is not reachable from `main`. The current inbox note
still names the superseded implementation revision in four build/revision locations, records the
old focused and coverage totals, and ends with a pre-merge statement. At the same time, every
physical-device and assistive-technology field remains legitimately pending.

This delivery creates no new runtime evidence. It reconciles one published documentation record
with the already-performed automated checks and the current repository state.

## Goals / Non-Goals

**Goals:**

- Make all immutable build, revision, and automated-check attributions refer to the corrected
  implementation head and verified totals.
- Record that PR #410 merged while preserving the separate, still-open owner-acceptance gate.
- Keep the next renderer slice visibly paused for that acceptance.
- Make the correction small enough to audit mechanically against the known retarget diff and the
  explicit current-state footer supplied in the handoff.

**Non-Goals:**

- Run or claim a native build, Android result, refresh-rate observation, VoiceOver result, TalkBack
  result, or owner acceptance.
- Change application behavior, tests, contracts, roadmap scope, the owner checklist, or the merged
  PR body.
- Change Architecture Book rules, ADRs, CI workflows, native/store configuration, deployment
  infrastructure, API/generated clients, migrations, or legacy Flutter code.

## Decisions

## Decision 1 — Reproduce the known retarget as text edits, not commit transplantation

The Applier will update the evidence note on this branch so its four revision references name
`a14333a9feb0fe47f62fb7270178542f2b21359f`, its focused result says 72 tests, and its full-coverage
result says 1,659 tests. The known post-merge correction commit is comparison evidence, not a commit
to cherry-pick, because it belongs to a different issue/branch/PR delivery and does not contain the
required current-state footer.

This preserves one-issue/one-branch/one-PR ownership and produces a transparent, bounded diff.

**Alternative considered:** cherry-pick the post-merge correction commit. Rejected because commit
transplantation obscures this delivery's ownership and still leaves the stale footer unresolved.

## Decision 2 — State merge and acceptance as independent facts

The final Results and gate footer will state that PR #410 was human-merged as
`ffc2bd88cedaeaa9d2d2e9a0739d9305f22d1a6d`. In the same paragraph it will state that the owner
checklist and explicit acceptance remain pending, and that the next renderer slice remains paused
for that acceptance.

The footer will not carry the prior issue's merge restriction into this corrective PR. This PR
follows the ordinary autonomous Reviewer merge policy; the historical wording describes only the
already-completed merge of PR #410.

**Alternative considered:** treat the merged PR as acceptance. Rejected because repository merge
proves delivery, not physical-device or assistive-technology behavior.

## Decision 3 — Preserve pending evidence verbatim

All unchecked checklist boxes and pending environment/result fields remain unchanged. The edit does
not convert automated test results into native evidence and does not rewrite the test procedure.
Verification compares the final diff with an explicit path allowlist and searches the added text for
unsupported result language.

**Alternative considered:** refresh or summarize the whole device-pass note. Rejected because a
broader rewrite would make it harder to distinguish corrected attribution from evidence that was
never collected.

## Decision 4 — Use documentation and exact-head CI gates only

Local verification consists of a focused content assertion over the evidence note, Prettier on the
touched Markdown, strict OpenSpec validation, `git diff --check`, a scope/path review, and the
repository disclosure scan over the exact branch and public PR text. After implementation is
pushed, the normal PR CI must be green for the exact PR head before review may merge it.

No mobile suite is rerun merely to edit documentation; the note records the already-performed
results against the immutable implementation head. The focused content assertion is the CI-proof
test for this correction because it checks the exact facts the change can regress.

**Alternative considered:** rerun the full mobile suite. Rejected because that would produce new
results on the corrective documentation head rather than prove the historical attribution being
fixed.

## Risks / Trade-offs

- **[A revision occurrence is missed]** → Assert the corrected revision occurs in all four expected
  attribution positions and the superseded revision is absent.
- **[Merge wording implies owner acceptance]** → Require the footer to name merge, pending checklist,
  pending explicit acceptance, and the paused next slice as separate clauses.
- **[A broader edit manufactures evidence]** → Restrict the implementation diff to the one inbox
  note and preserve unchecked/pending lines verbatim.
- **[The proposal itself outlives the correction]** → Archive the OpenSpec change before merge through
  the standard pipeline; the inbox note remains the operational owner handoff.

## Migration Plan

Apply the six known retarget substitutions and replace only the stale footer. Validate, push, and
obtain exact-head CI. Rollback is a normal revert of the documentation correction; there is no data,
runtime, or deployment migration.

## Open Questions

None. The handoff supplies the exact implementation revision, merge commit, test totals, pending
acceptance state, and scope boundary.
