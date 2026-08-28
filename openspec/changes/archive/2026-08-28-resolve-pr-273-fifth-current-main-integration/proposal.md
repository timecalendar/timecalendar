## Why

PR #273 is open and non-draft at exact head
`09465e4c2a95ed0c41e32ebcf262c57496b6e53b`, but freshly fetched `main` advanced to
`cbec6d1badeaf75bce5a84e0b66c2e31da9f4d39`. GitHub reports the same PR as conflicting,
and main now owns ADR 043, so the current-main gate vetoes merge until a fifth same-PR
integration preserves both decisions under unique identifiers and re-establishes exact-head
evidence.

## What Changes

- Normally merge freshly fetched `origin/main` into PR #273's existing branch without rebasing,
  force-pushing, replacing the branch, opening another PR, or changing accepted behavior.
- Preserve main's ADR 043 (`043-backend-environment-reset.md`) unchanged in substance and rename
  the source-recovery ADR from 043 to the next available identifier, ADR 044. Change only its
  filename, H1 numeric identity, decisions-index entry, `calendar.md` link, stale-source
  device-check inbox link, and every other current repository reference.
- Preserve PR #273's source-health behavior, last-good content, recovery guidance, source-health
  OpenAPI/generated-client contract, ADE normalization boundary, and both accepted Calendar
  contracts.
- Preserve main's PR #287 Compose/worktree isolation and PR #289 backend-environment selector,
  including runtime, storage, API, i18n, testing, Architecture Book/OpenSpec,
  `mobile/app.config.ts`, `mobile/eas.json`, and `server/docker-compose.yml` changes. Semantically
  inspect the auto-merged `testing.md` and English/French locale catalogs rather than accepting
  their textual merge alone.
- Archive this one-off integration change with `--skip-specs`, push without force, retain
  `run-e2e`, and require fresh exact-head local/CI, Android/iOS native E2E, Simplifier, and
  Reviewer evidence before the authorized autonomous squash merge.

## Capabilities

### New Capabilities

- `same-pr-fifth-current-main-integration`: One-off requirements for preserving PR #273 while
  reconciling the ADR 043 collision, retaining the semantic union of both parents, and restarting
  exact-head gates. This operational delta is archived with `--skip-specs`; it is not a reusable
  product capability.

### Modified Capabilities

None. The canonical source-health, ADE export-window, calendar-sync, backend-environment,
storage, distribution, API-client, feedback, Firebase, Settings, E2E lifecycle, OpenAPI export,
and server Compose requirements remain unchanged.

## Impact

- Existing PR #273 and branch
  `TIM-186-prod-health-investigation-at-rentr-e-2026-write-docs-investigations-2026-08-25-rentree-prod-health-report`
  only.
- Binding documentation: `docs/mobile/architecture-book/decisions/`, its index,
  `docs/mobile/architecture-book/calendar.md`, `docs/mobile/architecture-book/testing.md`, and
  the stale-source device-check inbox note must retain both parents' accepted contracts.
- Main-owned product/config surfaces—including backend-environment runtime/storage/API/i18n,
  `mobile/app.config.ts`, `mobile/eas.json`, and `server/docker-compose.yml`—must be preserved
  without integration-authored behavior changes.
- Sensitive coupled contract surfaces `openapi/openapi.json` and
  `mobile/src/api/generated/` must retain source-health and all main-side additions without
  generated drift. `.github/workflows/` remains untouched.
- No migration, credential/certificate, Firebase config, Terraform/Kubernetes, deploy,
  production-data, dependency, background-sync, product-cleanup, or legacy Flutter change is in
  scope. Human-only device checks remain inbox work and do not block implementation.
