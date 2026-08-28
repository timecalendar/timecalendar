## ADDED Requirements

### Requirement: Existing PR identity and current-main ancestry are preserved

The integration SHALL normally merge freshly fetched `main` into PR #273's existing branch and
SHALL NOT rebase, force-push, replace the branch, open another PR, edit workflows, or merge the
PR during Apply.

#### Scenario: Current main is integrated on the same branch
- **WHEN** the Applier begins the fifth integration cycle
- **THEN** it records the fresh base and current PR head, recomputes the merge shape, merges the
  base normally, and pushes without force to PR #273's existing head branch

#### Scenario: Fresh main exceeds the proposal
- **WHEN** current main introduces another ADR collision, an undecided behavior conflict, or a
  sensitive surface outside this design
- **THEN** the Applier SHALL return the same issue to Founding Engineering without guessing,
  rebasing, replacing the PR, or expanding behavior

### Requirement: Both ADR 043 decisions survive under unique identifiers

The integrated tree SHALL preserve main's backend-environment decision as ADR 043 and SHALL
rename the source-recovery decision to the next available identifier, observed as ADR 044,
without changing either decision's substance. The source-recovery filename, H1, decisions index,
Calendar link, stale-source device-check inbox link, and every other current repository reference
SHALL use the new identifier, while prior archived integration artifacts remain immutable.

#### Scenario: Observed ADR collision is reconciled
- **WHEN** main owns `043-backend-environment-reset.md` and the PR branch owns
  `043-preserve-content-and-advise-source-recovery.md`
- **THEN** the result retains the former as ADR 043 and the latter as ADR 044 with only numeric
  identity and current-reference changes

#### Scenario: ADR availability changes before integration
- **WHEN** a freshly fetched main has claimed the proposed source-recovery identifier
- **THEN** the Applier SHALL stop before merging and return the issue to Founding Engineering for
  a revised unique-identifier decision

### Requirement: Source recovery and main-side integration contracts coexist

The integrated tree SHALL retain PR #273's source-health behavior, last-good content, recovery
guidance, exact stored-URL/ADE fetch-local boundary, Calendar contract, Maestro coverage, and
OpenAPI/generated-client schema. It SHALL also retain main's Compose/worktree isolation and
backend-environment runtime, storage, API, i18n, testing, Architecture Book, native/store/EAS
configuration, canonical specifications, and archives without product behavior expansion.

#### Scenario: Both-changed files auto-merge
- **WHEN** Git auto-merges `testing.md` or the English/French locale catalogs
- **THEN** the Applier SHALL compare both parents and prove the result retains source-recovery
  content plus main's local-server testing rule and complete parity-matched environment strings

#### Scenario: Binding Calendar contracts are inspected
- **WHEN** the merge and ADR rename are complete
- **THEN** `calendar.md` SHALL retain source recovery under ADR 044 together with ADE rolling
  windows and bounded server-sync guidance unchanged in substance

### Requirement: Sensitive exclusions and exact-head gates are enforced

The integration SHALL preserve main's `mobile/app.config.ts`, `mobile/eas.json`, and
`server/docker-compose.yml` contracts; SHALL keep `.github/workflows/` untouched; and SHALL
retain generated OpenAPI/client parity. It SHALL author no migration, credential/certificate,
Firebase config, Terraform/Kubernetes, deploy, production-data, background-operation, unrelated
cleanup, or legacy Flutter change. The final exact head SHALL retain `run-e2e` and pass required
local checks, scheduled CI including Android/iOS native E2E, fresh Simplifier, and fresh Reviewer
gates before Reviewer-owned squash merge.

#### Scenario: Generated and config-owned surfaces remain controlled
- **WHEN** the integrated tree is verified
- **THEN** owned OpenAPI and Orval generation produces no unexpected drift, focused config and
  Compose checks pass, and parent comparisons show all accepted main-side values preserved

#### Scenario: Old green evidence cannot authorize merge
- **WHEN** the integration or an evidence commit changes PR #273's head SHA
- **THEN** previous-head CI and review evidence is rejected and every required gate is recorded
  against the new exact head

#### Scenario: Autonomous grant remains scoped
- **WHEN** the final exact-head gates pass
- **THEN** Reviewer may squash-merge PR #273 under the board grant without a separate QA gate
- **AND** no deploy act, force-push, secret change, workflow edit, background sync, or unrelated
  work is authorized
