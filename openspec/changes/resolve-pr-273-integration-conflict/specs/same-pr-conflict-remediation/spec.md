## ADDED Requirements

### Requirement: Conflict remediation preserves the existing pull request
The remediation MUST integrate current `main` on the existing PR #273 branch and MUST NOT
create a replacement branch or pull request.

#### Scenario: Current main is integrated
- **WHEN** the conflict-remediation commit is pushed
- **THEN** PR #273 still targets the same named head branch and GitHub reports no merge conflict

### Requirement: Accepted ADRs have unique stable identifiers
The integrated Architecture Book MUST retain the school-logo theme-variants decision as ADR
041 and the source-recovery decision as ADR 042, with one index entry per decision and no stale
source-recovery reference to ADR 041.

#### Scenario: ADR collision is reconciled
- **WHEN** the integrated decisions directory and repository references are searched
- **THEN** ADR 041 identifies only school-logo theme variants and ADR 042 identifies and links
  every source-recovery decision reference

### Requirement: Both additive generated contracts survive integration
The integrated committed OpenAPI document and Orval output MUST contain main's nullable dark
school-logo fields and PR #273's source-health response contract, and regeneration MUST produce
no drift.

#### Scenario: Contract union is regenerated
- **WHEN** the server OpenAPI and mobile Orval generation checks run on the integrated tree
- **THEN** the generated tree remains clean and exposes both `imageUrlDark` and
  `CalendarWithContent.sourceHealth` with its source-health types

### Requirement: Exact-head gates are re-established
The conflict-resolution head MUST pass local diff hygiene and strict OpenSpec validation, retain
the `run-e2e` label, and receive successful results for all six scheduled checks before fresh
Simplifier and Reviewer handoffs.

#### Scenario: New head is ready for fresh review
- **WHEN** the Applier records the pushed conflict-resolution SHA
- **THEN** every scheduled check, including Android and iOS native E2E, is successful for that
  exact SHA and no previous-head result is used as substitute evidence
