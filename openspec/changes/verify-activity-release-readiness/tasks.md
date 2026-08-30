## 1. Bind and scaffold the release candidate

- [x] 1.1 Resolve the exact candidate commit and immutable server image exercised in preproduction;
      create `docs/react-native-migration/05-tech-specs/activity-release-readiness.md` with that identity,
      timestamps, the frozen G1–G9/G3a table, evidence-method columns, and an initial `PENDING` verdict.
      Verify the commit/image references are immutable and the record contains no credential, token,
      opaque identifier, raw payload, or raw telemetry.
- [x] 1.2 Prove the candidate server is the image actually running in preproduction before gathering
      evidence, using desired/running image references and a health check. Record only sanitized image
      provenance and status; do not deploy, promote, use production credentials, or touch production.

## 2. Re-run the frozen capacity gates

- [x] 2.1 Start the isolated non-production server dependencies, migrate, seed the deterministic
      100,000-calendar/1,000,000-log (or larger recorded) corpus, and run
      `activity:capacity:compare` for all 1/10/100 recent/year/empty/many-change cohorts at page sizes
      50 and 100. Record exact scale/commands and sanitized p50/p95/p99, unread, plan, byte, and maximum
      results against the frozen baseline.
- [x] 2.2 Exercise the candidate `POST /v1/calendar-logs/search` HTTP route over the same cohort shapes
      and both page sizes; if the existing harness cannot do so, add the smallest reusable route-level
      measurement seam without changing the API. Verify default-50 p95 is below 250 ms, maximum-100 p95
      is below 500 ms, and response-byte evidence uses the serialized v1 shape.
- [x] 2.3 Capture synthetic `EXPLAIN (ANALYZE, BUFFERS)` evidence for first/following pages and recent/
      one-year unread counts. Verify no `Seq Scan on calendar_log`, and verify G3a from access path,
      rows-removed, and buffers: `c100-empty` must not exhaust the global `createdAt` index. Run the
      committed plan tripwire and record it separately from the full gate.
- [x] 2.4 Run representative concurrent candidate-route reads and record request count/error rate,
      wall time, heap growth, and max/p99 event-loop delay against Run B. Verify one HTTP request per
      overlapping trigger by running the coordinator/trigger single-flight proofs and recording exact
      call counts.
- [x] 2.5 Complete every readiness-table gate with a measured value and `PASS`/`FAIL`, including G7's
      p99 projection and worst-case many-change page. Do not silently reuse the 0.41 projection ratio if
      the observed byte distribution moved; retain the frozen values as the comparison baseline.

## 3. Prove telemetry privacy

- [x] 3.1 Inventory all Activity server/mobile telemetry sinks and their label/attribute keys:
      automatic HTTP metrics/spans, calendar-log metrics, application logs, Crashlytics, and analytics.
      Record the finite allowlists and search for token/calendar/user/event/log/cursor-derived values;
      add a focused negative test for any sink or failure path not already captured.
- [x] 3.2 Run the server metrics/controller/sanitizer and mobile coordinator/repository/lifecycle
      privacy tests with synthetic sensitive markers, capturing metric attributes, span attributes,
      logger arguments, Crashlytics calls, and analytics calls. Assert no marker or derived value reaches
      a sink and record exact tests/counts without copying the markers into committed evidence.
- [x] 3.3 Send only synthetic fixture requests through preproduction, inspect metrics, traces,
      application logs, Crashlytics test output, and analytics debug output in a bounded candidate/time
      window, and document the queries plus the negative result. Stop and escalate to the Founding
      Engineer if preproduction access is unavailable; never substitute production access.

## 4. Confirm compatibility row by row

- [x] 4.1 Copy the authoritative compatibility table into the readiness record and attach one proof
      to each row: React Native v1 behavior, Flutter/valid unversioned arrays, malformed bare-string 400,
      notification-pipeline coexistence, one-year retention, and backend-environment reset.
- [x] 4.2 Send the exact valid unversioned request shape from the committed previous-release Flutter
      generated client to the candidate server and verify the legacy response shape. Also exercise the
      v1 route and verify its response omits `calendarToken`; record only shape/status evidence.
- [x] 4.3 Diff `app/` and its generated client against the candidate base, regenerate OpenAPI and the
      React Native client, and verify `app/`, `openapi/openapi.json`, and
      `mobile/src/api/generated/` have no review-induced drift. Treat any unexpected drift as failure,
      not as scope for regeneration or Flutter maintenance.

## 5. Run the full automated release suite

- [x] 5.1 Run all server automated gates on the candidate: unit/integration coverage, server E2E,
      TypeScript/build, lint/format, capacity plan tripwire, and committed OpenAPI drift. Record exact
      commands, pass counts, and any intentionally separate database lifecycle.
- [x] 5.2 Run all React Native automated gates: Orval drift, Expo type generation if required by CI,
      TypeScript, lint/format, Jest with coverage, real-server Activity integration, and Maestro syntax/
      wrapper proofs. Record exact commands and pass counts.
- [ ] 5.3 Ensure the draft PR carries the `run-e2e` label, obtain Android-emulator and iOS-simulator
      Activity results for the exact candidate head, and record the workflow/check URLs and verdicts.
      Do not call local no-KVM/no-simulator checks a native pass.
- [x] 5.4 Add `docs/react-native-migration/inbox/<date>-activity-release-device-passes.md`, tagged
      `(HUMAN: physical iOS, iPad portrait, and Android release-candidate passes)`, covering cached
      scrolling/large groups, refresh triggers, offline cache, navigation/removal, telemetry DebugView,
      and previous-store-release compatibility. Make the note explicitly non-blocking for this PR.

## 6. Write rollout and rollback readiness

- [x] 6.1 In the readiness record, write the later rollout ticket's ordered procedure: deploy the
      exact approved server image, verify health plus valid legacy and v1 smokes, then and only then
      release a store/OTA build that calls `/v1`. State that this issue performs no deploy or submission.
- [x] 6.2 Write executable mobile release/OTA rollback where runtime compatibility permits and prior
      server-image rollback, including post-rollback legacy/v1 health checks. State that the v1 route and
      Activity SQLite tables are additive, need no destructive rollback, and the unversioned endpoint
      remains available throughout.

## 7. Reconcile binding and current-state documentation

- [x] 7.1 Update the Activity entry in
      `docs/react-native-migration/01-roadmap/07-auxiliary-features.md` to match the shipped contract and
      evidence state, and replace the tech spec's proposed Ticket 1–8 references with final clickable
      ticket links without rewriting the authoritative behavioral contract.
- [x] 7.2 Reconcile `docs/mobile/architecture-book/features.md` and any affected topical page with
      actual Activity ownership, capacity, E2E, and release contracts; append the Architecture Book
      changelog. Add or supersede an ADR only if a load-bearing accepted contract actually changed, and
      otherwise record that the existing ADRs remain authoritative.
- [x] 7.3 Verify the committed CI proofs cover G3/G3a, telemetry privacy, legacy compatibility, and
      one-request single-flight on every trigger. Add the smallest targeted regression test for any gap
      and demonstrate that its assertion fails under the corresponding regression before restoring it.

## 8. Decide and hand off safely

- [ ] 8.1 Run `openspec validate verify-activity-release-readiness`, inspect the final diff/history for
      secrets and customer data, and confirm `openapi/openapi.json`, `mobile/src/api/generated/`,
      `server/src/migrations/`, `app/`, `mobile/app.config.ts`, `mobile/eas.json`, `mobile/firebase/`,
      `terraform/`, `k8s/`, and `.github/workflows/` are unchanged unless an already-approved task above
      explicitly required a test-only change.
- [ ] 8.2 Set the readiness record to `GO` only when every required automated, capacity, privacy, and
      compatibility row passes. If any row fails, set `NO-GO`, use the safe-ticket-dispatch skill to
      create a uniquely titled fix child of the Activity epic, block this issue on that child, notify the
      Founding Engineer with the failed evidence, and do not continue toward release.
- [ ] 8.3 Update the draft PR body with the final scope, sensitive surfaces, stage marker, evidence
      summary, and explicit no-deploy boundary; re-read the body after writing and verify the update
      landed before handing the same branch and PR to the next pipeline stage.
