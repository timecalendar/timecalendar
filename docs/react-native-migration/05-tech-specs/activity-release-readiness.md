# Activity release readiness

This is the candidate-bound release record for Activity. It contains sanitized aggregates only;
raw fixtures, request and response bodies, cursors, plans, and telemetry excerpts are never
committed. A row passes only with evidence for the candidate named below. Missing, stale,
mismatched, or failed evidence is `FAIL`, and any failed row makes the disposition `NO-GO`.

## Candidate contract

| Field                           | Value                                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code/configuration candidate    | `4a87f925b40b941d3006fd9ca254d46cae21b6b4` — frozen                                                                                                                  |
| Evidence revision               | Evidence-only commits after the candidate; final reviewed PR head                                                                                                    |
| Evidence date                   | 2026-09-08                                                                                                                                                           |
| Evidence environment            | Isolated local synthetic services, repository CI, and bounded preproduction proof                                                                                    |
| Immutable server image identity | Manifest `sha256:83469700e016346c8b7f31292d96a6597cd14bdb5d9e678e4d041159ee9ad60f`; config `sha256:cc9844f11c5e1b785fdda04bae889464f2b99b020ed9004317d9a072edf01ac0` |
| Native CI target                | Exact candidate selected by run 34194654241; Android retry queued                                                                                                    |

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

| Gate | Method                                                                                               | Candidate value/evidence                                                                                                  | Threshold                                                              | Location                                   | Verdict |
| ---- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------ | ------- |
| G1   | Full-scale synthetic SQL plus real first/following-page HTTP route, limit 50                         | Lateral SQL p95 worst 74.27 ms; HTTP first-page p95 worst 167.43 ms, following-page 165.04 ms                             | p95 < 250 ms                                                           | Full-scale comparison and real-route run   | PASS    |
| G2   | Full-scale synthetic SQL plus real first/following-page HTTP route, limit 100                        | Lateral SQL p95 worst 73.28 ms; HTTP first-page p95 worst 171.69 ms, following-page 166.10 ms                             | p95 < 500 ms                                                           | Full-scale comparison and real-route run   | PASS    |
| G3   | Redacted fixture-only plans and CI tripwire                                                          | Every bounded lateral plan avoided a full `calendar_log` sequential scan; mutation-effective suite passed                 | No full `calendar_log` sequential scan                                 | `plan.test.ts`; focused server run         | PASS    |
| G3a  | Redacted fixture-only plans, global-index-walk assertion, and mutation check                         | Every bounded lateral plan avoided a full global-index walk; specification-shape mutation remained detectable             | No full global-index walk                                              | Full-scale redacted plans; `plan.test.ts`  | PASS    |
| G4   | Real route with recent and one-year unread watermarks                                                | HTTP p95 worst 188.66 ms; lateral SQL p95 worst 3.35 ms                                                                   | p95 < 250 ms                                                           | Full-scale comparison and real-route run   | PASS    |
| G5   | Server/mobile sink inventory and synthetic negative tests                                            | Finite static labels/contexts; zero sensitive-category matches across captured sinks                                      | Zero sensitive-category matches                                        | Server/mobile telemetry privacy suites     | PASS    |
| G6   | Eight concurrent route readers for ten rounds                                                        | 80/80 complete, 0 errors; request p95 84.56 ms; loop max/p99 37.58 ms; heap growth 2,206,080 bytes                        | All complete, zero errors, event-loop max < 50 ms, heap growth < 64 MB | Full-scale real-route run                  | PASS    |
| G7   | Serialized v1 pages at limits 50 and 100, reconciled with projection                                 | Many-change cohort p50 784,306 bytes; p95/p99/max 818,726 bytes at both limits                                            | p99 < 1,000,000 bytes                                                  | Full-scale real-route run                  | PASS    |
| G8   | Four overlapping real trigger edges at the mobile request boundary, then one post-settlement trigger | One shared in-flight newest request and one new post-settlement request; all 15 Activity suites / 215 tests pass          | One shared request, then one new request                               | `coordinator.test.ts`; `triggers.test.tsx` | PASS    |
| G9   | Exact-candidate Activity Maestro journey on Android and iOS                                          | iOS passed; Android attempt 1 failed in the preceding fresh-user import flow before Activity ran, and attempt 2 is queued | Both platform jobs pass the complete flow                              | Native run 34194654241                     | FAIL    |

The bounded virtual-page correction from [TIM-529](/TIM/issues/TIM-529) keeps the valid synthetic
many-change shape below the unchanged frozen budget at both client limits. Fragment ordering,
cursor continuation, and mobile cache replacement remain covered by the focused server/mobile
suites.

## Telemetry privacy

| Sink                                   | Method                                                                        | Candidate evidence                                                                                                                 | Threshold                                           | Location                         | Verdict |
| -------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------- | ------- |
| Server metrics                         | Instrument/label inventory plus captured synthetic paths                      | Four literal bounded instruments; zero sensitive-category matches                                                                  | Finite literal labels; zero marker-category matches | Server privacy fixture and test  | PASS    |
| Server traces                          | Automatic HTTP instrumentation inspection plus captured synthetic request     | No Activity-added sensitive span attributes; zero marker-category matches                                                          | Zero marker-category matches                        | Server privacy fixture and test  | PASS    |
| Server logs and sanitized errors       | Captured validation, cursor, and database failures                            | Sanitized error surfaces; zero marker-category matches                                                                             | Zero marker-category matches                        | Server privacy fixture and tests | PASS    |
| Mobile Crashlytics                     | Static-context inventory plus mapping, storage, network, and trigger failures | Static contexts; zero sensitive-category matches                                                                                   | Static contexts; zero marker-category matches       | Mobile Activity privacy test     | PASS    |
| Mobile analytics                       | Activity call-site inventory and captured boundary                            | No Activity analytics payload contains marker-derived data                                                                         | No Activity event carries marker-derived values     | Mobile Activity privacy test     | PASS    |
| Immutable environment telemetry window | Bounded negative queries against the exact isolated candidate image           | 19 metric series, 105 log records, and 328 traces; metrics/logs/traces each returned zero matches in all five sensitive categories | Zero sensitive-category matches                     | [TIM-532](/TIM/issues/TIM-532)   | PASS    |

Committed results contain category counts only, never marker values.

## Compatibility

| Contract row                                     | Method                                                | Candidate evidence                                                                                                                        | Threshold                                             | Location                             | Verdict |
| ------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------ | ------- |
| React Native v1 behavior                         | Controller/repository/client and real-route exercises | Pagination, ordering, unread and token-free DTO tests plus real route pass                                                                | Pagination, ordering, unread, and token-free DTO pass | Focused server/mobile suites         | PASS    |
| Valid unversioned arrays                         | Legacy controller test                                | Existing array request and unchanged array response pass                                                                                  | HTTP 200 with unchanged array response                | `calendar-log.controller.test.ts`    | PASS    |
| Malformed bare-string request                    | v1/unversioned focused tests                          | Intentional validation behavior retained                                                                                                  | HTTP 400 behavior retained                            | Controller and DTO suites            | PASS    |
| Flutter generated client/source behavior         | Candidate diff and legacy baseline                    | No `app/` diff; legacy suite remains green                                                                                                | No review drift; behavior green                       | Candidate diff; legacy Flutter tests | PASS    |
| Notification-pipeline independence               | Static dependency inspection and server/mobile tests  | Activity reads shared logs and refresh remains independent of subscriptions                                                               | Shared log rows remain independently consumed         | Feature map and focused suites       | PASS    |
| One-year retention                               | Prune job and cache tests                             | Server prune and mobile cache-retention proofs pass                                                                                       | One-year policy passes                                | Prune/repository suites              | PASS    |
| Backend-environment cache reset                  | Reset implementation and tests                        | Activity log/state tables participate in backend reset                                                                                    | Activity log/state tables clear                       | Mobile reset/repository tests        | PASS    |
| Previous mobile release against candidate server | Candidate-bound compatibility exercise                | Flutter 3.1.0+134 sent its unchanged generated unversioned request successfully; the valid v1 request also returned its expected envelope | Valid legacy request remains compatible               | [TIM-532](/TIM/issues/TIM-532)       | PASS    |

## Automated and native checks

| Check                          | Candidate evidence                                                                                 | Threshold               | Location                        | Verdict |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------- | ------- |
| Focused server Activity checks | 15 suites / 169 tests pass                                                                         | All pass                | Local exact-tree run            | PASS    |
| Full server baseline           | Exact-candidate server image build, full tests, E2E, runtime lifecycle and OpenAPI drift jobs pass | All pass                | CI run 34194654606              | PASS    |
| Generated contract/client      | Supported local generation has zero drift; exact-candidate server/mobile drift steps pass          | No drift                | CI runs 34194654606/34195819084 | PASS    |
| Focused mobile Activity checks | 15 suites / 215 tests pass                                                                         | All pass                | Local exact-tree run            | PASS    |
| Full mobile baseline           | TypeScript, lint and 170 suites / 1,547 tests pass at 99.01% lines and 93.21% branches             | All pass                | Local run; CI run 34195819084   | PASS    |
| Baseline repository CI         | Seven server jobs plus the mobile job pass at exact candidate `4a87f925…`                          | All required jobs pass  | Candidate CI runs               | PASS    |
| Native Android                 | Attempt 1 stopped in fresh-user import before Activity; exact-candidate retry queued               | Activity journey passes | Native run 34194654241          | FAIL    |
| Native iOS                     | Exact-candidate platform job completed successfully                                                | Activity journey passes | Native run 34194654241          | PASS    |

## Rollout and rollback

This review executes neither rollout nor rollback. After a future `GO`, a separately authorized
operator must deploy the recorded immutable server image first, verify health plus valid v1 and
unchanged unversioned Activity requests, and only then release a store build or runtime-compatible
OTA that calls v1.

Rollback restores a compatible prior mobile release or OTA where runtime compatibility permits,
then restores the prior server image and repeats health, v1, and unversioned checks. The additive
v1 route and Activity cache tables remain; no destructive schema rollback is required.

## Disposition

**NO-GO** — candidate `4a87f925b40b941d3006fd9ca254d46cae21b6b4` passes the corrected local
capacity, runtime-health, privacy, compatibility-source, generated-contract, server, and mobile
automated gates, plus the immutable-environment telemetry and previous-mobile-release rows from
[TIM-532](/TIM/issues/TIM-532). Exact-candidate iOS passes. Android attempt 1 failed in the
preceding fresh-user import flow before Activity ran, so G9 remains failed while an exact-candidate
retry is queued. Activity remains unapproved for production until Android passes the complete flow
for this exact candidate.
