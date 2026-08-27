## ADDED Requirements

### Requirement: Second conflict remediation preserves the existing pull request

The remediation MUST integrate freshly fetched `main` on PR #273's existing named head branch
through a normal merge and MUST NOT rebase, force-push, create a replacement branch, or open a
replacement pull request.

#### Scenario: Fresh main is integrated

- **WHEN** the second conflict-resolution commit is pushed
- **THEN** PR #273 retains the same head branch and GitHub reports no merge conflict

### Requirement: Accepted ADRs retain unique stable identifiers

The integrated Architecture Book MUST retain the iPhone/iPad portrait contract as ADR 042 and
the source-recovery decision as ADR 043, with one ordered index entry per active decision, no
stale live source-recovery reference to ADR 042, and no substantive change to either decision.

#### Scenario: ADR 042 collision is reconciled

- **WHEN** the integrated decisions directory and live repository references are checked
- **THEN** ADR 042 identifies only the iPhone/iPad portrait contract and ADR 043 identifies and
  links every live source-recovery decision reference

### Requirement: Both Calendar contracts survive integration

The integrated `calendar.md` MUST retain the complete source-health and advisory recovery
guidance from PR #273 and the complete server sync work-budget, cancellation, concurrency,
retry, due-selection, and hydration guidance from main without changing either contract's
substance.

#### Scenario: Auto-merged Calendar guidance is inspected

- **WHEN** the merged Sync and offline behavior section is compared with both parents
- **THEN** both binding additions remain present and semantically unchanged

### Requirement: Sensitive integrated surfaces remain authoritative

The integrated tree MUST retain freshly fetched main's `mobile/app.config.ts` unchanged and
MUST retain the full committed OpenAPI and generated mobile-client contract union without
generator drift or manual generated edits.

#### Scenario: Native config and generated contracts are verified

- **WHEN** the integrated tree is compared with main and both documented generators run
- **THEN** `mobile/app.config.ts` has no diff from main and generated outputs remain clean with
  source-health, dark-logo, and all current-main contract additions present

### Requirement: Exact-head gates are re-established

The final integration head MUST pass diff hygiene, strict OpenSpec validation, focused
semantic/reference and contract checks, retain the `run-e2e` label, and receive successful
results for every scheduled check before fresh Simplifier and Reviewer handoffs.

#### Scenario: New head is eligible for final review

- **WHEN** the Applier records the final pushed SHA
- **THEN** every scheduled check, including Android and iOS native E2E, is successful for that
  exact SHA and no old-head result is used as substitute evidence

### Requirement: Autonomous merge remains gated and non-deploying

The Reviewer MUST squash-merge PR #273 only after scope, exact-head CI, Simplifier, and final
review gates are clean, and the integration MUST NOT perform a deploy act or add a separate QA
gate.

#### Scenario: Reviewer reaches a clean exact-head verdict

- **WHEN** all final-head gates pass and the latest PR preflight contains no veto
- **THEN** the Reviewer may use the existing autonomous authorization to squash-merge the same
  PR without performing deployment or unrelated external actions
