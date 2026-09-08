# Activity release readiness

This is the candidate-bound release record for Activity. It contains sanitized aggregates only;
raw fixtures, request and response bodies, cursors, plans, and telemetry excerpts are never
committed. A row passes only with evidence for the candidate named below. Missing, stale,
mismatched, or failed evidence is `FAIL`, and any failed row makes the disposition `NO-GO`.

## Candidate contract

| Field                           | Value                                                                  |
| ------------------------------- | ---------------------------------------------------------------------- |
| Code/configuration candidate    | `0f26bc6eb09dc2a5333205e21fa72d7bc104b872` — frozen, failed            |
| Evidence revision               | Evidence-only commits after the candidate; final reviewed PR head      |
| Evidence date                   | 2026-09-08                                                             |
| Evidence environment            | Isolated local synthetic PostgreSQL/Redis and repository CI only       |
| Immutable server image identity | CI build artifact only; no deployed immutable identity — `FAIL`        |
| Native CI target                | Exact candidate selected by run 34178270101; cancelled after G7 failed |

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
| Contract and client             | `openapi/openapi.json`; `mobile/src/api/generated/calendar-logs/`                                                                                                                                               | Generated-drift checks                                           |
| Retention and reset             | `server/src/modules/calendar-log/jobs/prune-calendar-log.job.ts`; `mobile/src/db/reset.ts`; Activity repository tests                                                                                           | Compatibility proof                                              |
| CI jobs                         | `.github/workflows/ci-build-deploy.yml`; `.github/workflows/ci-mobile.yml`; `.github/workflows/ci-mobile-e2e.yml`                                                                                               | Exact-candidate automated/native evidence                        |

Historical Activity measurements are comparison data only and satisfy no candidate row in this
record.

## Sensitive-surface posture

The following surfaces remain unchanged by the review: `openapi/openapi.json`,
`mobile/src/api/generated/`, `server/src/migrations/`, `mobile/app.config.ts`, `mobile/eas.json`,
`mobile/firebase/`, `.github/workflows/`, `terraform/`, `k8s/`, and legacy `app/`. Secret material
was neither read into evidence nor modified.

## Frozen capacity gates

The budgets come unchanged from [`activity-capacity-gate.md`](./activity-capacity-gate.md). The
full-scale corpus contained 100,323 calendars and 1,004,934 logs. SQL used 40 samples per cohort;
HTTP discarded 3 warm-ups and retained 25 samples per cohort and page size.

| Gate | Method                                                                                               | Candidate value/evidence                                                                                      | Threshold                                                              | Location                                   | Verdict |
| ---- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------ | ------- |
| G1   | Full-scale synthetic SQL plus real first/following-page HTTP route, limit 50                         | Lateral SQL p95 worst 81.35 ms; HTTP first-page p95 worst 220.59 ms, following-page 27.65 ms                  | p95 < 250 ms                                                           | Full-scale comparison and real-route run   | PASS    |
| G2   | Full-scale synthetic SQL plus real first/following-page HTTP route, limit 100                        | Lateral SQL p95 worst 78.27 ms; HTTP first-page p95 worst 201.87 ms, following-page 51.53 ms                  | p95 < 500 ms                                                           | Full-scale comparison and real-route run   | PASS    |
| G3   | Redacted fixture-only plans and CI tripwire                                                          | Every bounded lateral plan avoided a full `calendar_log` sequential scan; mutation-effective suite passed     | No full `calendar_log` sequential scan                                 | `plan.test.ts`; focused server run         | PASS    |
| G3a  | Redacted fixture-only plans, global-index-walk assertion, and mutation check                         | Every bounded lateral plan avoided a full global-index walk; specification-shape mutation remained detectable | No full global-index walk                                              | Full-scale redacted plans; `plan.test.ts`  | PASS    |
| G4   | Real route with recent and one-year unread watermarks                                                | HTTP p95 worst 193.17 ms; lateral SQL p95 worst 3.20 ms                                                       | p95 < 250 ms                                                           | Full-scale comparison and real-route run   | PASS    |
| G5   | Server/mobile sink inventory and synthetic negative tests                                            | Finite static labels/contexts; zero sensitive-category matches across captured sinks                          | Zero sensitive-category matches                                        | Server/mobile telemetry privacy suites     | PASS    |
| G6   | Eight concurrent route readers for ten rounds                                                        | 80/80 complete, 0 errors; request p95 111.97 ms; loop max 45.97 ms/p99 41.81 ms; heap growth 0 bytes          | All complete, zero errors, event-loop max < 50 ms, heap growth < 64 MB | Full-scale real-route run                  | PASS    |
| G7   | Serialized v1 pages at limits 50 and 100, reconciled with projection                                 | Many-change cohort p50/p95/p99/max all 1,600,989 bytes at both limits                                         | p99 < 1,000,000 bytes                                                  | Full-scale real-route run                  | FAIL    |
| G8   | Four overlapping real trigger edges at the mobile request boundary, then one post-settlement trigger | One shared in-flight newest request and one new post-settlement request; all 15 Activity suites passed        | One shared request, then one new request                               | `coordinator.test.ts`; `triggers.test.tsx` | PASS    |
| G9   | Exact-candidate Activity Maestro journey on Android and iOS                                          | Manual workflow selected the candidate, then was cancelled once G7 invalidated it; no platform verdicts       | Both platform jobs pass the complete flow                              | Native run 34178270101                     | FAIL    |

The measured G7 failure is not hidden by the production projection: the candidate must remain
safe for a valid log carrying the synthetic many-change shape. The bounded correction is tracked
in [TIM-529](/TIM/issues/TIM-529); the frozen budget is unchanged.

## Telemetry privacy

| Sink                                   | Method                                                                        | Candidate evidence                                                        | Threshold                                           | Location                         | Verdict |
| -------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------- | ------- |
| Server metrics                         | Instrument/label inventory plus captured synthetic paths                      | Literal bounded labels; zero sensitive-category matches                   | Finite literal labels; zero marker-category matches | Server privacy fixture and test  | PASS    |
| Server traces                          | Automatic HTTP instrumentation inspection plus captured synthetic request     | No Activity-added sensitive span attributes; zero marker-category matches | Zero marker-category matches                        | Server privacy fixture and test  | PASS    |
| Server logs and sanitized errors       | Captured validation, cursor, and database failures                            | Sanitized error surfaces; zero marker-category matches                    | Zero marker-category matches                        | Server privacy fixture and tests | PASS    |
| Mobile Crashlytics                     | Static-context inventory plus mapping, storage, network, and trigger failures | Static contexts; zero sensitive-category matches                          | Static contexts; zero marker-category matches       | Mobile Activity privacy test     | PASS    |
| Mobile analytics                       | Activity call-site inventory and captured boundary                            | No Activity analytics payload contains marker-derived data                | No Activity event carries marker-derived values     | Mobile Activity privacy test     | PASS    |
| Immutable environment telemetry window | Bounded negative queries against the exact deployed image                     | No deployed immutable candidate was available without a rollout action    | Zero marker-category matches                        | Not available                    | FAIL    |

Committed results contain category counts only, never marker values.

## Compatibility

| Contract row                                     | Method                                                | Candidate evidence                                                          | Threshold                                             | Location                             | Verdict |
| ------------------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------ | ------- |
| React Native v1 behavior                         | Controller/repository/client and real-route exercises | Pagination, ordering, unread and token-free DTO tests plus real route pass  | Pagination, ordering, unread, and token-free DTO pass | Focused server/mobile suites         | PASS    |
| Valid unversioned arrays                         | Legacy controller test                                | Existing array request and unchanged array response pass                    | HTTP 200 with unchanged array response                | `calendar-log.controller.test.ts`    | PASS    |
| Malformed bare-string request                    | v1/unversioned focused tests                          | Intentional validation behavior retained                                    | HTTP 400 behavior retained                            | Controller and DTO suites            | PASS    |
| Flutter generated client/source behavior         | Candidate diff and legacy baseline                    | No `app/` diff; legacy suite remains green                                  | No review drift; behavior green                       | Candidate diff; legacy Flutter tests | PASS    |
| Notification-pipeline independence               | Static dependency inspection and server/mobile tests  | Activity reads shared logs and refresh remains independent of subscriptions | Shared log rows remain independently consumed         | Feature map and focused suites       | PASS    |
| One-year retention                               | Prune job and cache tests                             | Server prune and mobile cache-retention proofs pass                         | One-year policy passes                                | Prune/repository suites              | PASS    |
| Backend-environment cache reset                  | Reset implementation and tests                        | Activity log/state tables participate in backend reset                      | Activity log/state tables clear                       | Mobile reset/repository tests        | PASS    |
| Previous mobile release against candidate server | Candidate-bound compatibility exercise                | No immutable preproduction candidate was deployed                           | Valid legacy request remains compatible               | Environment evidence unavailable     | FAIL    |

## Automated and native checks

| Check                          | Candidate evidence                                                                                 | Threshold               | Location                        | Verdict |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------- | ------- |
| Focused server Activity checks | 13 suites / 150 tests pass                                                                         | All pass                | Local exact-tree run            | PASS    |
| Full server baseline           | Exact-candidate server image build, full tests, E2E, runtime lifecycle and OpenAPI drift jobs pass | All pass                | CI run 34177430035              | PASS    |
| Generated contract/client      | Exact-candidate server OpenAPI and mobile generated-client drift steps pass                        | No drift                | CI runs 34177430035/34177430090 | PASS    |
| Focused mobile Activity checks | 15 suites / 213 tests pass                                                                         | All pass                | Local exact-tree run            | PASS    |
| Full mobile baseline           | E2E harness, React Doctor, generated client, TypeScript, lint and coverage steps pass              | All pass                | CI run 34177430090              | PASS    |
| Baseline repository CI         | Eight required checks pass at exact candidate `0f26bc6e…`                                          | All required jobs pass  | PR candidate checks             | PASS    |
| Native Android                 | Candidate selected; workflow cancelled after G7 failed                                             | Activity journey passes | Native run 34178270101          | FAIL    |
| Native iOS                     | Candidate selected; workflow cancelled after G7 failed                                             | Activity journey passes | Native run 34178270101          | FAIL    |

## Rollout and rollback

This review executes neither rollout nor rollback. After a future `GO`, a separately authorized
operator must deploy the recorded immutable server image first, verify health plus valid v1 and
unchanged unversioned Activity requests, and only then release a store build or runtime-compatible
OTA that calls v1.

Rollback restores a compatible prior mobile release or OTA where runtime compatibility permits,
then restores the prior server image and repeats health, v1, and unversioned checks. The additive
v1 route and Activity cache tables remain; no destructive schema rollback is required.

## Disposition

**NO-GO** — candidate `0f26bc6eb09dc2a5333205e21fa72d7bc104b872` exceeds frozen G7: a valid
synthetic many-change page serializes to 1,600,989 bytes against the 1,000,000-byte p99 ceiling.
It also lacks the separately authorized immutable-environment compatibility/telemetry evidence,
and its native run was cancelled after the capacity failure made further candidate spend
non-actionable. [TIM-529](/TIM/issues/TIM-529) owns the bounded payload correction. After that fix
lands, this review must freeze a new candidate and rerun every affected local, CI, native,
compatibility, and environment row before Activity can be reconsidered for production.
