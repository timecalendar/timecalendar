## Why

PR #273 is fully implemented but current `main` independently claimed ADR 042 and now conflicts
with the PR's source-recovery ADR and decisions index. The same PR must absorb freshly fetched
`main` without losing either binding decision, either side of the Calendar contract, or any
accepted product behavior, then earn fresh exact-head CI and review evidence.

## What Changes

- Integrate freshly fetched `origin/main` into PR #273's existing branch with a normal merge;
  do not rebase, force-push, create a replacement branch, or open another PR.
- Preserve main's `042-iphone-ipad-portrait-contract.md` and renumber the source-recovery ADR
  from 042 to the next unique number, 043 at the observed integration base.
- Repair the source-recovery ADR heading, decisions index, `calendar.md`, the stale-source
  device-check inbox note, and every other live repository reference without changing either
  ADR's substance.
- Preserve both binding `calendar.md` additions: PR #273's last-good source-health/recovery
  guidance and main's server sync-policy guidance.
- Preserve main's `mobile/app.config.ts` exactly through integration. Preserve the existing
  OpenAPI and generated-client union without drift; generated artifacts remain generated.
- Re-run diff hygiene, strict OpenSpec validation, focused semantic/reference and contract
  checks, and fresh scheduled CI on the pushed exact head. Retain `run-e2e`; require Android
  and iOS native E2E plus every other scheduled check before fresh Simplifier and Reviewer
  gates and the already-authorized autonomous squash merge.

## Capabilities

### New Capabilities

- `same-pr-second-conflict-remediation`: One-off repository-state requirements for preserving
  the existing PR identity, reconciling the ADR 042 collision as ADR 043, retaining both
  Calendar contracts and sensitive integrated surfaces, and re-establishing exact-head gates.
  This operational delta will be archived with `--skip-specs` because it is not a reusable
  product capability.

### Modified Capabilities

None. Canonical source-health, sync-policy, device-support, and API requirements remain
unchanged.

## Impact

- Binding documentation: `docs/mobile/architecture-book/decisions/`,
  `docs/mobile/architecture-book/calendar.md`, and the existing stale-source device-check
  inbox note.
- Sensitive native/store configuration: main's `mobile/app.config.ts` is integrated unchanged;
  this cycle does not author a config change.
- Sensitive contract surfaces already carried by the PR and main: `openapi/openapi.json` and
  `mobile/src/api/generated/` retain the complete additive union with no manual generated edit.
- Existing PR #273, its named head branch, title, `run-e2e` label, accepted implementation, and
  autonomous Reviewer-owned squash-merge route remain in place.
- No new product behavior. No workflow, migration, credential/certificate, infrastructure,
  deployment, production-data, background-sync, or legacy Flutter change is in scope.
