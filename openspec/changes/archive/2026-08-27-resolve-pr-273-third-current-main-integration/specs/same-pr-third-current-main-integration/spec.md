## ADDED Requirements

### Requirement: Third integration preserves the existing pull request

The remediation MUST integrate freshly fetched `main` into PR #273's existing named head
branch through a normal merge and MUST NOT rebase, force-push, create a replacement branch,
open a replacement pull request, or merge the pull request during Apply.

#### Scenario: Current main is integrated

- **WHEN** the third integration commit is pushed
- **THEN** PR #273 retains the same head branch and current `main` is its ancestor

### Requirement: Accepted source-health and current-main behavior survive together

The integrated tree MUST preserve all accepted source-health and Calendar behavior from PR
#273 and all current-main contact response/error, retry, privacy, localization, observability,
and portable-tracer behavior without substantive changes or unrelated cleanup.

#### Scenario: Both-parent behavior is inspected

- **WHEN** overlapping and auto-merged files are compared with both parents
- **THEN** source recovery, ADR 042, ADR 043, both Calendar contracts, contact 201/400/503
  semantics, feedback retry/privacy guidance, FR/EN copy, and tracing behavior remain intact

### Requirement: Coupled contracts and sensitive configuration remain authoritative

The integrated tree MUST preserve the full committed OpenAPI and generated mobile-client union,
MUST use generator-owned output without manual edits or drift, and MUST retain freshly fetched
main's `mobile/app.config.ts` unchanged.

#### Scenario: Generated and native contracts are verified

- **WHEN** both documented generators and focused contract assertions run after integration
- **THEN** source-health and contact response/error shapes remain present with no generated drift
- **AND** `mobile/app.config.ts` has no diff from freshly fetched main

### Requirement: Operational history remains immutable

The third integration MUST create and archive only its own one-off OpenSpec change, MUST retain
both prior-cycle archives and current-main canonical/archived contracts unchanged, and MUST NOT
create a canonical reusable remediation specification.

#### Scenario: The one-off change is archived

- **WHEN** final strict OpenSpec validation runs after archival with `--skip-specs`
- **THEN** the third dated archive exists, prior archives are unmodified, and no canonical
  `same-pr-third-current-main-integration` spec exists

### Requirement: Exact-head gates are re-established before autonomous merge

The final pushed head MUST pass diff hygiene, strict OpenSpec validation, focused semantic and
contract checks, retain `run-e2e`, and receive fresh successful scheduled checks before fresh
Simplifier and Reviewer passes. Only the Reviewer MAY squash-merge the same PR after every gate
is clean; no QA gate or deploy act applies.

#### Scenario: Final head becomes review-eligible

- **WHEN** the Applier records the final pushed SHA
- **THEN** all required scheduled checks, including Android and iOS native E2E, are successful
  for that exact SHA and no old-head evidence is substituted

#### Scenario: Reviewer reaches a clean final verdict

- **WHEN** current-main ancestry, scope, exact-head CI, Simplifier, and Reviewer gates are clean
- **THEN** the Reviewer may autonomously squash-merge PR #273 without performing deployment or
  any unrelated external action
