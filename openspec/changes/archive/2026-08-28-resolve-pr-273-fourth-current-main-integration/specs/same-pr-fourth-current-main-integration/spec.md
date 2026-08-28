## ADDED Requirements

### Requirement: Existing PR identity and current-main ancestry are preserved

The integration SHALL normally merge freshly fetched `main` into PR #273's existing branch and
SHALL NOT rebase, force-push, replace the branch, open another PR, or merge the PR during Apply.

#### Scenario: Current main is integrated on the same branch
- **WHEN** the Applier begins the fourth integration cycle
- **THEN** it records the fresh base and current PR head, merges the base normally, and pushes
  without force to PR #273's existing head branch

### Requirement: ADE transport normalization and exact source-health evidence coexist

The integrated server SHALL derive a bounded ADE URL only for each upstream fetch, SHALL retain
the exact persisted calendar URL as source identity, and SHALL classify source health from that
persisted URL rather than the transformed transport URL. Classification SHALL remain URL-free
and read-only.

#### Scenario: A stale original window is normalized without losing evidence
- **WHEN** a stored ADE URL contains an expired or retired `firstDate`/`lastDate` window and is
  fetched after integration
- **THEN** the upstream request uses the current bounded window while the stored URL remains
  byte-equivalent and source health evaluates its original host/window evidence

#### Scenario: Fetch repair does not enter the API payload
- **WHEN** batch sync returns health for a source whose upstream URL was normalized
- **THEN** the response contains only the fixed source-health fields and no stored or transformed
  URL, token, query value, or raw error evidence

### Requirement: Both accepted Calendar and specification contracts survive integration

The integrated tree SHALL retain source recovery, ADE rolling-window normalization, and bounded
server sync guidance; ADR 042 and ADR 043 SHALL remain unique and unchanged in substance; and
the canonical and archived OpenSpec material from both parents SHALL remain present without
rewriting prior PR #273 integration archives.

#### Scenario: Semantic union is inspected after a clean merge
- **WHEN** Git reports no textual conflict for the new main merge
- **THEN** the Applier still compares both parents and proves both Calendar contracts, all three
  canonical capability specs, both ADRs, and both parents' archives are preserved

### Requirement: Sensitive exclusions and exact-head gates are enforced

The integration SHALL leave `mobile/app.config.ts` identical to freshly fetched main and SHALL
author no `.github/workflows/`, migration, credential/certificate, infrastructure, deploy,
production-data, background-operation, or legacy Flutter change. The final exact head SHALL
retain `run-e2e` and pass required local checks, scheduled CI including Android/iOS native E2E,
fresh Simplifier, and fresh Reviewer gates before Reviewer-owned squash merge.

#### Scenario: Old green evidence cannot authorize merge
- **WHEN** the integration or an evidence commit changes PR #273's head SHA
- **THEN** previous-head CI and review evidence is rejected and every required gate is recorded
  against the new exact head

#### Scenario: Autonomous grant remains scoped
- **WHEN** the final exact-head gates pass
- **THEN** Reviewer may squash-merge PR #273 under the board grant without a separate QA gate
- **AND** no deploy act, force-push, secret change, background sync, or unrelated work is
  authorized
