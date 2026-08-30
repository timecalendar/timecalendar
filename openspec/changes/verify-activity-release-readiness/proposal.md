## Why

Activity now spans a new bounded server route, a device-local React Native cache, several refresh
triggers, and a real-server mobile flow. It cannot be approved for production until the shipped
release candidate is measured against the frozen capacity gates, its telemetry and compatibility
claims are evidenced, and the server-first rollout and rollback path is executable.

## What Changes

- Add a committed Activity release-readiness record that identifies one release-candidate commit
  and server image, records every frozen gate with measured values and pass/fail, and gives one
  explicit go/no-go verdict.
- Re-run the representative page, unread-count, query-plan, concurrency, heap, and event-loop checks
  against the shipped route and record G3a (no full `calendar_log` index scan) as well as the
  original sequential-scan gate.
- Record a privacy-negative audit covering metric labels, span attributes, Crashlytics attributes,
  analytics events, and application logs, with the methods and automated proofs used.
- Confirm every compatibility row: React Native v1 behavior, unchanged valid legacy arrays,
  untouched Flutter generated client and behavior, previous-mobile-release interoperability,
  notification-log coexistence, retention, and backend-environment reset.
- Document executable server-first deployment ordering and additive rollback. This change performs
  no production deploy, store submission, live credential use, or production load test.
- Reconcile the Activity roadmap, Architecture Book feature map and changelog, applicable ADRs, and
  final ticket links in the authoritative technical specification with the shipped contract.
- Add a non-blocking `(HUMAN: ...)` migration-inbox checklist for physical iOS, iPad portrait, and
  Android passes; automated and simulator/device-lab evidence remains the implementation gate.
- Require a failed gate to produce a safely dispatched fix child of the Activity epic and keep this
  release-review issue blocked until that fix lands.

## Capabilities

### New Capabilities

- `activity-release-readiness`: Defines the evidence, privacy, compatibility, rollout-order,
  rollback, documentation-reconciliation, and no-go contract required to approve Activity for
  production.

### Modified Capabilities

- `activity-capacity-gate`: Extends the frozen gate's release-review contract to require measurements
  against the shipped endpoint, including the G3a full-index-scan regression and explicit comparison
  with the frozen baseline.

## Impact

- **Release evidence and docs:** a new committed Activity readiness record; updates to
  `docs/react-native-migration/01-roadmap/07-auxiliary-features.md`,
  `docs/react-native-migration/05-tech-specs/activity-revival.md`, and the mobile Architecture Book
  feature map/changelog. An ADR changes only if the implemented contract is found to differ from an
  accepted load-bearing decision.
- **Server/mobile verification:** the existing Activity capacity harness, server automated suites,
  mobile generated-client/type/lint/Jest gates, real-server integration, and applicable native E2E
  flows. The release record contains sanitized aggregates and measurements only.
- **Sensitive surfaces:** `docs/mobile/architecture-book/` is intentionally updated and remains
  binding. `openapi/openapi.json`, `mobile/src/api/generated/`, `server/src/migrations/`, `app/`,
  `mobile/app.config.ts`, `mobile/eas.json`, `mobile/firebase/`, `terraform/`, `k8s/`, and
  `.github/workflows/` are verification-only and are not expected to change.
- **External systems:** preproduction only for capacity and compatibility evidence. Production and
  store rollout remain a separate Founding-Engineer-owned ticket after a go verdict.
