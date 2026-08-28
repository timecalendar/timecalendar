## Context

PR #273 remains open and non-draft on its required existing branch at
`09465e4c2a95ed0c41e32ebcf262c57496b6e53b` and retains `run-e2e`. Freshly fetched
`origin/main` is `cbec6d1badeaf75bce5a84e0b66c2e31da9f4d39`, which is not an ancestor of the PR
head. GitHub reports `mergeable: CONFLICTING` / `mergeStateStatus: DIRTY`.
`git merge-tree --write-tree HEAD origin/main` reports one direct conflict in
`docs/mobile/architecture-book/decisions/README.md`; `testing.md` and the English/French locale
catalogs auto-merge but changed on both sides and require semantic inspection.

The prior source-recovery work occupies ADR 043 on the PR branch. Main independently added
accepted ADR 043 (`043-backend-environment-reset.md`) together with PR #287's isolated Compose
stacks and PR #289's backend-environment selector. Main's additions span runtime, storage, API,
i18n, testing, Architecture Book/OpenSpec, `mobile/app.config.ts`, `mobile/eas.json`, and
`server/docker-compose.yml`. The next identifier, ADR 044, is free in both observed parents.

The fourth integration change is already archived for older base `acc7fe3`; all prior one-off
integration archives are immutable history. This fifth active change covers only the current
ancestry gap and identifier collision. It adds no product requirement.

## Goals / Non-Goals

**Goals:**

- Restore current-main ancestry on the same branch and PR through a normal merge.
- Preserve main-owned backend-environment ADR 043 and move source recovery to unique ADR 044 by
  changing only numeric identity and repository references.
- Preserve PR #273's source-health behavior and API contract alongside all main-side Compose,
  backend-environment, runtime/storage/API/i18n/testing/config, and OpenSpec contracts.
- Re-establish focused local, exact-head CI, Android/iOS native E2E, Simplifier, and Reviewer
  evidence before the authorized autonomous squash merge.

**Non-Goals:**

- Changing either ADR's decision text, source-health rules, recovery UX, backend-environment
  behavior, API response shapes, ADE normalization, sync scheduling, storage semantics, or any
  other accepted product behavior.
- Rewriting prior-cycle archives or creating a reusable canonical integration capability.
- Rebasing, force-pushing, replacing the branch/PR, opening a second PR, or merging during Apply.
- Editing workflows; weakening tests; changing dependencies, migrations, credentials,
  certificates, Firebase config, infrastructure, deploy behavior, production data, background
  operations, or legacy Flutter.
- Adding a QA gate or performing a deploy, native build, submission, OTA publish, promotion, or
  rollout act.

## Decisions

## Decision 1 — Normally merge freshly fetched main into the existing PR branch

The Applier will fetch `origin/main` immediately before integration, record exact branch and
base SHAs, recheck PR identity and `run-e2e`, verify ADR 044 is still available, recompute the
merge tree, and normally merge that recorded base into the checked-out PR branch. Commits will
be pushed without force to the same remote head. If fresh main introduces a new ADR collision,
non-additive behavior conflict, or sensitive surface outside this design, the Applier returns
the same issue to Founding Engineering rather than guessing.

This preserves one issue, branch, and PR plus reviewed history. Rebasing, force-pushing, and a
replacement PR are rejected because they replace or split that history.

## Decision 2 — Main keeps ADR 043; source recovery becomes ADR 044 by identity only

The integrated tree will retain `043-backend-environment-reset.md` exactly as main owns it.
`043-preserve-content-and-advise-source-recovery.md` will move to
`044-preserve-content-and-advise-source-recovery.md`; its H1 will change from 043 to 044, and
every current repository link or reference to that source-recovery ADR will follow the new
identifier. The required known sites are the decisions index, `calendar.md`, and
`docs/react-native-migration/inbox/2026-08-26-stale-source-recovery-device-checks.md`; a
repository-wide search is authoritative for additional current references.

The source-recovery ADR's status, context, decision, consequences, and revisit conditions remain
byte-equivalent apart from numeric identity/reference syntax. Main's backend-environment ADR is
also preserved unchanged in substance. Renaming main's ADR, combining the decisions, changing
their rationale, or editing old archived integration artifacts is rejected because the conflict
is identifier ownership, not architecture.

## Decision 3 — The merge result is a semantic union, including clean auto-merges

The direct decisions-index conflict will be resolved by retaining both unique entries. The
Applier will compare both parents for every both-changed file, explicitly including
`docs/mobile/architecture-book/testing.md` and `mobile/src/i18n/locales/en.json` / `fr.json`.
Testing must retain the source-recovery Maestro contract plus main's isolated local-server
dependency entry. Both catalogs must retain source-recovery strings and main's complete,
key-parity backend-environment strings with their accepted translations.

The integrated tree must preserve PR #273's source-health, exact stored-URL/ADE fetch-local
boundary, last-good content, recovery guidance, Maestro coverage, canonical source-health/ADE/
sync specs, and OpenAPI/generated-client schema. It must also preserve main's PR #287 Compose
isolation and PR #289 backend-environment runtime, storage, API, Firebase/feedback, Settings,
distribution, testing, Architecture Book, roadmap/inbox, and canonical/archived OpenSpec work.
Selecting either parent wholesale is rejected even where Git reports a clean merge.

## Decision 4 — Sensitive surfaces are preserved by parent comparisons and focused proofs

`mobile/app.config.ts`, `mobile/eas.json`, and `server/docker-compose.yml` must retain main's
accepted native/store/EAS and isolated-Compose changes. The integration must author no
`.github/workflows/` change and must retain `run-e2e`. `openapi/openapi.json` and
`mobile/src/api/generated/` remain a coupled generated contract: regenerate through the owned
server OpenAPI and mobile Orval commands and require zero unexpected drift; never hand-edit
generated output.

The Applier will run focused source-health/ADE/calendar-sync checks plus the smallest relevant
main-side Compose/backend-environment/i18n/config checks identified by the parent inventory.
Parent and authored-diff comparisons must prove that migrations, credentials/certificates,
Firebase config, Terraform/Kubernetes, deploy behavior, production data, unrelated cleanup,
background operations, workflows, and `app/` are untouched. A broad behavior rewrite merely to
make integration tests pass is rejected.

## Decision 5 — Archive the operational delta and restart exact-head gates

After completing the checklist with evidence, the Applier will strictly validate this change,
archive it with `openspec archive resolve-pr-273-fifth-current-main-integration --skip-specs -y`,
and run `openspec validate --all --strict`. No canonical
`openspec/specs/same-pr-fifth-current-main-integration/` capability may remain.

Every head-changing commit invalidates old-head CI and review evidence. The final pushed SHA must
retain `run-e2e` and pass all required scheduled checks, including fresh Android and iOS native
E2E, before fresh Simplifier and Reviewer passes. The board grant authorizes Reviewer-owned
squash merge only after those gates; it does not authorize a deploy act or separate QA gate.

## Risks / Trade-offs

- **[Main advances or claims ADR 044 before Apply]** → Fetch, recheck identifier availability,
  and recompute immediately before merging; return to Founding Engineering if this design no
  longer covers the new base.
- **[An auto-merge drops source-recovery or backend-environment semantics]** → Compare both
  parents, inspect all both-changed files, and assert explicit markers and focused tests for both
  contracts.
- **[The ADR rename changes architectural substance or leaves stale references]** → Limit the
  ADR diff to filename/H1 identity, search all current repository references, and compare both
  ADR bodies after resolution.
- **[Generated output or native/store/Compose config drifts]** → Use owned generators, focused
  config/Compose proofs, and parent-specific diff assertions; never resolve by hand-editing
  generated or config-owned output.
- **[Old evidence is mistaken for final proof]** → Record the final pushed SHA with check URLs
  and accept only CI, Simplifier, and Reviewer evidence against that exact SHA.

## Migration Plan

1. Fetch and record current `origin/main`; re-verify same PR/branch identity, `run-e2e`, merge
   shape, both-parent inventory, and next available ADR number.
2. Merge normally and reconcile the ADR index by preserving main's ADR 043 and renaming source
   recovery to ADR 044 across its filename, H1, and every current repository reference.
3. Inspect every both-changed file and prove the semantic union of source recovery with main's
   Compose/backend-environment/runtime/storage/API/i18n/testing/config/OpenSpec work.
4. Run focused tests, generated-contract drift checks, sensitive-surface comparisons, diff
   hygiene, strict change validation, and archival with `--skip-specs`.
5. Commit and push without force, update the existing PR body, obtain fresh exact-head scheduled
   CI and native E2E, then hand the same issue through Simplifier and Reviewer.

Rollback is a normal revert of this cycle's integration/remediation commits on the same PR.
There is no data or deploy rollback because this cycle adds no runtime contract and performs no
production operation.

## Open Questions

None at observed `origin/main` `cbec6d1badeaf75bce5a84e0b66c2e31da9f4d39`.
