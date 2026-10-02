## Why

Activity now has its bounded server route, incremental mobile cache, shared refresh seam, native
screen, and real-server flow, but production approval still requires one candidate-bound record
that re-runs every frozen capacity, privacy, compatibility, runtime-health, and client gate. Without
that record, passing component tests cannot establish that the shipped route and exact mobile head
are release-ready together.

## What Changes

- Add one committed Activity release-readiness record that identifies the evaluated candidate and
  records every frozen gate with its method, measured value or evidence, and `PASS`/`FAIL` result.
- Extend the deterministic local capacity tooling just enough to measure the real
  `POST /v1/calendar-logs/search` route while continuing to use the production-owned lateral query
  source and synthetic fixtures.
- Verify telemetry privacy mechanically across server metrics, traces and logs plus mobile
  Crashlytics and analytics, with negative tests and sanitized evidence only.
- Re-run the required server, mobile, generated-contract, single-flight, compatibility, and
  exact-head native CI checks. The record remains `NO-GO` if any frozen gate or required evidence
  is missing.
- Document server-first rollout and non-destructive rollback, reconcile the Activity roadmap,
  technical specification, Architecture Book feature map and changelog, and add a non-blocking
  physical-device checklist under the migration inbox.
- Keep production access, deployment, store or OTA submission, live data, credentials, and
  infrastructure mutation outside this change.

## Capabilities

### New Capabilities

- `activity-release-readiness`: Defines candidate identity, evidence completeness, privacy,
  compatibility, exact-head CI, rollout/rollback, and fail-closed go/no-go requirements for
  releasing Activity.

### Modified Capabilities

- `activity-capacity-gate`: Requires release evaluation of the shipped HTTP route, the shared
  lateral query shape, G3a, page-size reconciliation, runtime health, single-flight behavior, and
  native-flow evidence without weakening the frozen budgets.

## Impact

- **Server verification:** `server/src/scripts/activity-capacity/` and focused tests may gain a
  deterministic HTTP measurement seam; the shipped controller, DTO, repository SQL and telemetry
  remain the subjects of verification rather than new product behavior.
- **Mobile verification:** focused Activity data/UI/trigger tests and the existing Maestro flow are
  rerun; the feature implementation is changed only if a gate exposes a bounded defect, in which
  case this review stays `NO-GO` and the fix is handled separately.
- **Documentation:** a new readiness record plus reconciliation of
  `docs/react-native-migration/01-roadmap/07-auxiliary-features.md`,
  `docs/react-native-migration/05-tech-specs/activity-revival.md`,
  `docs/mobile/architecture-book/features.md`, the book changelog, and a migration inbox note.
- **Contract and schema:** `openapi/openapi.json`, `mobile/src/api/generated/`, and
  `server/src/migrations/` are verification-only sensitive surfaces. Regeneration must prove zero
  drift; no API or schema change is planned.
- **Native, CI, deployment, and legacy surfaces:** `mobile/app.config.ts`, `mobile/eas.json`,
  `mobile/firebase/`, `.github/workflows/`, `terraform/`, `k8s/`, and `app/` are verification-only
  or out of scope and are not expected to change. Secret material is never read into evidence.
- **Dependencies:** no new runtime dependency is expected.
