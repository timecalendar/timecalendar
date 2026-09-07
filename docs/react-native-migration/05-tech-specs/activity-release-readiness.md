# Activity release readiness

This is the candidate-bound release record for Activity. It contains sanitized aggregates only;
raw fixtures, request and response bodies, cursors, plans, and telemetry excerpts are never
committed. A row passes only with evidence for the candidate named below. Missing, stale,
mismatched, or failed evidence is `FAIL`, and any failed row makes the disposition `NO-GO`.

## Candidate contract

| Field                           | Value                                                               |
| ------------------------------- | ------------------------------------------------------------------- |
| Code/configuration candidate    | Not frozen — `FAIL`                                                 |
| Evidence revision               | This document's eventual commit; pending                            |
| Evidence date                   | Pending                                                             |
| Evidence environment            | Isolated local synthetic PostgreSQL/Redis and repository CI only    |
| Immutable server image identity | Unavailable without separately authorized rollout evidence — `FAIL` |
| Native CI target                | Exact full candidate SHA after it is frozen; pending                |

The runtime candidate is the final code/configuration commit before evidence-only documentation
commits. Any later runtime, contract, schema, native, or workflow edit invalidates all
head-dependent evidence and requires a new candidate.

## Evidence-source inventory

| Surface                         | Repository-relative source                                                                                                                                                                                      | Candidate use                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Shipped v1 route                | `server/src/modules/calendar-log/controllers/calendar-log-v1.controller.ts`                                                                                                                                     | Real HTTP measurement                                            |
| Service, mapper, repository     | `server/src/modules/calendar-log/services/calendar-log.service.ts`; `server/src/modules/calendar-log/mappers/calendar-log.mapper.ts`; `server/src/modules/calendar-log/repositories/calendar-log.repository.ts` | Real module path                                                 |
| Shared lateral SQL              | `server/src/modules/calendar-log/repositories/activity-search.queries.ts`                                                                                                                                       | Repository and harness identity proof                            |
| Capacity tooling                | `server/src/scripts/activity-capacity/`                                                                                                                                                                         | Synthetic SQL, route, plan, byte, and runtime evidence           |
| Server telemetry                | `server/src/modules/calendar-log/services/calendar-log-metrics.service.ts`; `server/src/config/observability/`                                                                                                  | Sink inventory and negative proof                                |
| Mobile coordinator and triggers | `mobile/src/features/activity/data/coordinator.ts`; `mobile/src/features/activity/data/lifecycle.ts`; calendar-sync and notification trigger tests                                                              | G8 and failure isolation                                         |
| Mobile cache and UI             | `mobile/src/features/activity/data/`; `mobile/src/features/activity/ui/`; `mobile/src/app/activity.tsx`                                                                                                         | Mapping, storage, paging, unread, navigation, and restart proofs |
| Native Activity flow            | `mobile/.maestro/activity.yaml`; `mobile/e2e/`                                                                                                                                                                  | G9 exact-candidate workflow evidence                             |
| Contract and client             | `openapi/openapi.json`; `mobile/src/api/generated/calendar-logs/`                                                                                                                                               | Regenerate and require zero drift                                |
| Retention and reset             | `server/src/modules/calendar-log/jobs/prune-calendar-log.job.ts`; `mobile/src/db/reset.ts`; Activity repository tests                                                                                           | Compatibility proof                                              |
| CI jobs                         | `.github/workflows/ci-build-deploy.yml`; `.github/workflows/ci-mobile.yml`; `.github/workflows/ci-mobile-e2e.yml`                                                                                               | Exact-candidate automated/native evidence                        |

Historical Activity measurements are comparison data only and satisfy no candidate row in this
record.

## Sensitive-surface posture

The following surfaces are verification-only and must remain unchanged: `openapi/openapi.json`,
`mobile/src/api/generated/`, `server/src/migrations/`, `mobile/app.config.ts`, `mobile/eas.json`,
`mobile/firebase/`, `.github/workflows/`, `terraform/`, `k8s/`, and legacy `app/`. Secret material
is neither read into evidence nor modified. Unexpected drift in any listed surface stops this
review for a revised design.

## Frozen capacity gates

The budgets come unchanged from [`activity-capacity-gate.md`](./activity-capacity-gate.md).

| Gate | Method                                                                                               | Candidate value/evidence | Threshold                                                              | Location              | Verdict |
| ---- | ---------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------- | --------------------- | ------- |
| G1   | Full-scale synthetic SQL plus real first-page HTTP route, limit 50                                   | Missing                  | p95 < 250 ms                                                           | Pending aggregate     | FAIL    |
| G2   | Full-scale synthetic SQL plus real first-page HTTP route, limit 100                                  | Missing                  | p95 < 500 ms                                                           | Pending aggregate     | FAIL    |
| G3   | Redacted fixture-only plans and CI tripwire                                                          | Missing                  | No full `calendar_log` sequential scan                                 | Pending test/run      | FAIL    |
| G3a  | Redacted fixture-only plans, global-index-walk assertion, and mutation check                         | Missing                  | No full global-index walk                                              | Pending test/run      | FAIL    |
| G4   | Real route with recent and one-year unread watermarks                                                | Missing                  | p95 < 250 ms                                                           | Pending aggregate     | FAIL    |
| G5   | Server/mobile sink inventory and synthetic negative tests                                            | Missing                  | Zero sensitive-category matches                                        | Pending tests         | FAIL    |
| G6   | Representative concurrent route reads                                                                | Missing                  | All complete, zero errors, event-loop max < 50 ms, heap growth < 64 MB | Pending aggregate     | FAIL    |
| G7   | Serialized v1 pages at limits 50 and 100, reconciled with projection                                 | Missing                  | p99 < 1,000,000 bytes                                                  | Pending aggregate     | FAIL    |
| G8   | Four overlapping real trigger edges at the mobile request boundary, then one post-settlement trigger | Missing                  | One shared request, then one new request                               | Pending focused tests | FAIL    |
| G9   | Exact-candidate Activity Maestro journey on Android and iOS                                          | Missing                  | Both platform jobs pass the complete flow                              | Pending native run    | FAIL    |

## Telemetry privacy

| Sink                                   | Method                                                                        | Candidate evidence                                             | Threshold                                           | Location      | Verdict |
| -------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------- | ------------- | ------- |
| Server metrics                         | Instrument/label inventory plus captured synthetic paths                      | Missing                                                        | Finite literal labels; zero marker-category matches | Pending tests | FAIL    |
| Server traces                          | Automatic HTTP instrumentation inspection plus captured synthetic request     | Missing                                                        | Zero marker-category matches                        | Pending tests | FAIL    |
| Server logs and sanitized errors       | Captured validation, cursor, and database failures                            | Missing                                                        | Zero marker-category matches                        | Pending tests | FAIL    |
| Mobile Crashlytics                     | Static-context inventory plus mapping, storage, network, and trigger failures | Missing                                                        | Static contexts; zero marker-category matches       | Pending tests | FAIL    |
| Mobile analytics                       | Activity call-site inventory and captured boundary                            | Missing                                                        | No Activity event carries marker-derived values     | Pending tests | FAIL    |
| Immutable environment telemetry window | Bounded negative queries against the exact image                              | Unavailable without a separately authorized environment action | Zero marker-category matches                        | Not available | FAIL    |

Committed results contain category counts only, never the marker values.

## Compatibility

| Contract row                                     | Method                                                | Candidate evidence | Threshold                                             | Location | Verdict |
| ------------------------------------------------ | ----------------------------------------------------- | ------------------ | ----------------------------------------------------- | -------- | ------- |
| React Native v1 behavior                         | Controller/repository/client and real-route exercises | Missing            | Pagination, ordering, unread, and token-free DTO pass | Pending  | FAIL    |
| Valid unversioned arrays                         | Legacy controller test and candidate route exercise   | Missing            | HTTP 200 with unchanged array response                | Pending  | FAIL    |
| Malformed bare-string request                    | v1/unversioned focused tests                          | Missing            | Intentional HTTP 400 behavior retained                | Pending  | FAIL    |
| Flutter generated client/source behavior         | Zero-diff proof plus Flutter test evidence            | Missing            | No review drift; behavior green                       | Pending  | FAIL    |
| Notification-pipeline independence               | Static dependency inspection and server tests         | Missing            | Shared log rows remain independently consumed         | Pending  | FAIL    |
| One-year retention                               | Prune job and cache tests                             | Missing            | One-year policy passes                                | Pending  | FAIL    |
| Backend-environment cache reset                  | Reset implementation and tests                        | Missing            | Activity log/state tables clear                       | Pending  | FAIL    |
| Previous mobile release against candidate server | Candidate-bound compatibility exercise                | Unavailable        | Valid legacy request remains compatible               | Pending  | FAIL    |

## Automated and native checks

| Check                          | Method                                                                          | Candidate evidence | Threshold               | Location    | Verdict |
| ------------------------------ | ------------------------------------------------------------------------------- | ------------------ | ----------------------- | ----------- | ------- |
| Focused server Activity checks | Jest                                                                            | Missing            | All pass                | Pending     | FAIL    |
| Full server baseline           | Build/typecheck, lint, Jest, dependency-free E2E smoke                          | Missing            | All pass                | Pending     | FAIL    |
| Generated contract/client      | Supported generators then zero diff                                             | Missing            | No drift                | Pending     | FAIL    |
| Focused mobile Activity checks | Jest                                                                            | Missing            | All pass                | Pending     | FAIL    |
| Full mobile baseline           | E2E harness checks, TypeScript, lint, React Doctor changed scope, Jest coverage | Missing            | All pass                | Pending     | FAIL    |
| Baseline repository CI         | Exact candidate checks                                                          | Missing            | All required jobs pass  | Pending run | FAIL    |
| Native Android                 | Existing manual workflow at exact candidate                                     | Missing            | Activity journey passes | Pending run | FAIL    |
| Native iOS                     | Existing manual workflow at exact candidate                                     | Missing            | Activity journey passes | Pending run | FAIL    |

## Rollout and rollback

This review executes neither rollout nor rollback. After a future `GO`, a separately authorized
operator must deploy the recorded immutable server image first, verify health plus valid v1 and
unchanged unversioned Activity requests, and only then release a store build or runtime-compatible
OTA that calls v1.

Rollback restores a compatible prior mobile release or OTA where runtime compatibility permits,
then restores the prior server image and repeats health, v1, and unversioned checks. The additive
v1 route and Activity cache tables remain; no destructive schema rollback is required.

## Disposition

**NO-GO** — the candidate is not yet frozen and all candidate-bound evidence remains missing.
