# Activity release readiness

This record evaluates the frozen gates in
[`activity-capacity-gate.md`](./activity-capacity-gate.md) against one immutable preproduction
candidate. It contains sanitized aggregates only. Raw plans and telemetry remain transient in the
run-owned scratch directory.

## Candidate

| Field                           | Value                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Candidate commit                | `695e3104affca770f74a61d9cb334cf488eac331`                                                              |
| Server image                    | `ghcr.io/timecalendar/timecalendar:main-695e3104affca770f74a61d9cb334cf488eac331`                       |
| Immutable server digest         | `sha256:c96f208efc4c0e8e7a72f3c31be46bd8da1cd90e3c5f75664fe0df2ce032d41e`                               |
| Publication evidence            | GitHub Actions run [33300442338](https://github.com/timecalendar/timecalendar/actions/runs/33300442338) |
| Platform desired-state revision | `57f64766c60ab47f6b46bf220db4ebdc533c1cdc`                                                              |
| Provenance check                | 2026-08-30T08:27:44Z, read-only preproduction inspection                                                |

The platform desired state names the candidate tag. Argo reported `Synced` and `Healthy`; the
server deployment and pod reported one desired/ready replica, zero restarts, the exact candidate
tag, and the immutable digest above. The public preproduction liveness endpoint returned HTTP 200.
No deployment, promotion, production access, credential read, or store action was performed.

## Frozen capacity gates

Measurements are populated only from this candidate run. A failed row makes the record `NO-GO`.

| Gate | Frozen budget                                                       | Method and UTC window                                                                                                                                                                                                           | Candidate value                                                                                                                                                                                                                                                                                                           | Verdict |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| G1   | Default 50-log page p95 < 250 ms                                    | 2026-08-30T08:30Z full-scale SQL, then 25 samples/cohort through local candidate HTTP                                                                                                                                           | SQL worst 75.45 ms; HTTP worst 173.66 ms (`many-changes`)                                                                                                                                                                                                                                                                 | PASS    |
| G2   | Maximum 100-log page p95 < 500 ms                                   | Same run, page size 100                                                                                                                                                                                                         | SQL worst 69.96 ms; HTTP worst 189.32 ms (`many-changes`)                                                                                                                                                                                                                                                                 | PASS    |
| G3   | No sequential scan of full `calendar_log` for a bounded request     | Redacted synthetic `EXPLAIN (ANALYZE, BUFFERS)` plus plan tripwire                                                                                                                                                              | 0 lateral plans contain `Seq Scan on calendar_log`; tripwire green                                                                                                                                                                                                                                                        | PASS    |
| G3a  | No full global-index walk for a bounded request                     | Lateral-plan access-path, rows-removed, and buffer inspection                                                                                                                                                                   | 0 lateral plans use `IDX_calendar_log_createdAt`; 27 bounded composite-index uses                                                                                                                                                                                                                                         | PASS    |
| G4   | Recent and one-year unread p95 < 250 ms                             | 25 samples for every cohort/watermark/page size                                                                                                                                                                                 | Worst 3.20 ms                                                                                                                                                                                                                                                                                                             | PASS    |
| G5   | No Activity identity or payload in telemetry/evidence               | Static allowlists, 60 server + 145 mobile focused assertions, bounded runtime negatives                                                                                                                                         | All tests green; 5/5 log and 5/5 retained-trace marker categories had 0 matches                                                                                                                                                                                                                                           | PASS    |
| G6   | Event loop and heap remain bounded under representative concurrency | 8 readers × 10 rounds; local shared SQL + HTTP; preproduction metrics                                                                                                                                                           | SQL: max 9.97 ms, p99 6.80 ms, +27.51 MB heap; HTTP: 80/80, p95 88.88 ms, 0 errors; preproduction p99 10.70 ms, heap 92.20 MB                                                                                                                                                                                             | PASS    |
| G7   | Serialized v1 page < 1 MB at p99                                    | Measured fixture v1/stored ratio and frozen production distribution                                                                                                                                                             | Threat-page ratio 0.4066 (unchanged from 0.41): frozen p99 projection remains ~402 KB @50/~957 KB @100. Explicit atomic worst case: 1,600,989 bytes                                                                                                                                                                       | PASS    |
| G8   | One request per overlapping trigger after single-flight collapse    | Coordinator, request, lifecycle, and trigger call-count assertions                                                                                                                                                              | 145 focused Activity tests green; all six trigger edges share the one newest-page slot                                                                                                                                                                                                                                    | PASS    |
| G9   | Smooth cached scrolling on supported devices                        | Exact-head native CI [run 33302541977](https://github.com/timecalendar/timecalendar/actions/runs/33302541977); [Android job 99233594232](https://github.com/timecalendar/timecalendar/actions/runs/33302541977/job/99233594232) | Android Activity `import-baseline` failed after the deep link: `Calendar` was not visible within 60 s; later flows did not run. [Debug artifact 9729849553](https://github.com/timecalendar/timecalendar/actions/runs/33302541977/artifacts/9729849553). iOS was still running when the controlling failure was recorded. | FAIL    |

## Telemetry privacy

The finite Activity-specific server metric allowlist is `page ∈ {first, following}` and
`outcome ∈ {ok, invalid_cursor}`; row counts and durations are numeric measurements without labels.
Automatic HTTP telemetry contributes only framework route/method/status/runtime attributes. The v1
controller/service has no payload logger. The shared logger sanitizer and Activity controller tests
cover failure output. Mobile Activity has no analytics `logEvent` call site. Its Crashlytics calls
carry only the static contexts `activity/refresh`, `activity/older-page`, `activity/decode`, and
`activity/prune`; repository pruning adds an aggregate count, never row identity or content.

Automated sink capture ran 60 focused server assertions (metrics, controller, redactor, sanitizer,
and plan safety) and 145 focused mobile assertions (coordinator, repository, lifecycle, triggers,
request seam, and Maestro selectors). All passed, including synthetic token/calendar/log/cursor and
event-content negatives.

The bounded preproduction window was 2026-08-30T08:35:35Z–08:36:22Z. It used only synthetic
fixtures. Route metrics showed successful first-page traffic, event-loop p99 10.70 ms, and heap
92.20 MB. Five application-log marker categories returned zero hits. Tempo retained 19 candidate
traces after the bounded sampling retry; all five identity/content categories returned zero hits.
Only counts and UTC bounds were retained here; raw telemetry stayed in run-owned scratch storage.
Successful Activity emits no analytics event, and the mocked Firebase boundary proved zero
Activity analytics calls plus static-only Crashlytics attributes.

## Compatibility

| Contract row                                                                   | Candidate proof                                                                                   | Verdict |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------- |
| React Native v1 pagination and token-free response                             | Candidate v1 smoke HTTP 200; token-field scan returned 0; repository/controller/real-server tests | PASS    |
| Valid Flutter/unversioned array request and legacy array response              | Exact committed-client body sent to candidate: HTTP 200, JSON array                               | PASS    |
| Bare-string `tokens` request remains the intentional HTTP 400 tightening       | Candidate smoke returned HTTP 400                                                                 | PASS    |
| Notification pipeline continues reading the shared log rows independently      | Server notification-pipeline and calendar-log suites green; no schema/query change in this review | PASS    |
| One-year Activity retention remains intact                                     | Server prune job and mobile repository retention tests green                                      | PASS    |
| Backend-environment reset clears Activity cache and read state                 | Mobile environment/reset suites green                                                             | PASS    |
| Flutter source/generated client and committed API clients have no review drift | `app/` diff clean; OpenAPI + Orval regenerated and diff clean                                     | PASS    |

## Automated checks

- Server: lint and build passed; 98 suites / 676 tests passed; E2E 1 suite / 1 test passed;
  full-scale capacity and CI-plan tripwire passed; OpenAPI regeneration was drift-free.
- React Native: TypeScript and lint passed; 145 suites / 1,176 tests passed with coverage gates;
  Orval regeneration was drift-free; the real-server Activity and Maestro wrapper/selector proofs
  are green.
- Native CI: exact-head Android failed the Activity `import-baseline` flow because `Calendar` did
  not become visible within 60 seconds after opening the baseline-import deep link. The failure was
  classified as terminal and later flows did not run. iOS was still running when this controlling
  failure was recorded. Physical-device follow-up is listed in
  [`2026-08-30-activity-release-device-passes.md`](../inbox/2026-08-30-activity-release-device-passes.md)
  and does not block repository merge.

## Rollout order and rollback

This review performs no deploy or submission. After a `GO`, the separately authorized rollout
ticket must deploy the exact server digest above first, verify health and valid legacy/v1 smokes,
and only then release a store or runtime-compatible OTA build that calls `/v1`.

If an observation gate fails, restore the prior compatible mobile release/OTA where runtime
compatibility permits and/or roll the server image back through the normal platform process. Then
repeat health, valid unversioned, and v1 smokes. The v1 route and SQLite Activity tables are
additive and require no destructive rollback; the unversioned endpoint remains available
throughout.

## Verdict

**NO-GO** — G9 failed in the exact-head Android native job. Activity must not proceed to rollout.
TIM-401 must remain blocked pending a dedicated repair ticket; after its fix reaches this branch,
the native gate and any evidence invalidated by the new candidate must be rerun. No rollout ticket
is authorized by this record.
