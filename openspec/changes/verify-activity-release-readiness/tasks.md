## 1. Establish the candidate and evidence contract

- [x] 1.1 Create `docs/react-native-migration/05-tech-specs/activity-release-readiness.md`
      with a fail-closed template for the code/configuration candidate SHA, evidence revision, evidence
      date/environment, immutable server identity when already available, G1–G9 plus G3a rows,
      compatibility rows, privacy rows, automated/native checks, rollout/rollback, and top-level
      `GO`/`NO-GO`. Verify every required row has method, measured value or evidence, threshold,
      location and verdict fields before collecting results.
- [x] 1.2 Inventory the current candidate's Activity route, shared SQL import, capacity scripts,
      server telemetry, mobile coordinator/trigger seams, Activity UI/Maestro flow, OpenAPI/client,
      schema/retention/reset behavior, and existing CI jobs. Record only repository-relative sources in
      the readiness record; verify that no historical result is marked as candidate evidence.
- [x] 1.3 Record the sensitive-surface posture before implementation: contract
      (`openapi/openapi.json`, `mobile/src/api/generated/`), schema (`server/src/migrations/`),
      native/store (`mobile/app.config.ts`, `mobile/eas.json`, `mobile/firebase/`), CI/deploy
      (`.github/workflows/`, `terraform/`, `k8s/`), secret material, and legacy `app/` are
      verification-only or untouched. Stop and obtain a revised design before expanding into any of
      them.

## 2. Prove the shipped HTTP route at deterministic scale

- [x] 2.1 Add a focused route-level measurement module under
      `server/src/scripts/activity-capacity/` that boots the real calendar-log Nest module against the
      explicitly supplied local PostgreSQL fixture database and exercises
      `POST /v1/calendar-logs/search` through the normal HTTP adapter. Measure first/following pages at
      limits 50 and 100, unread count, serialized response bytes and representative concurrent reads;
      print aggregate JSON only and never request/response bodies. Verify non-local database hosts are
      refused before connecting.
- [x] 2.2 Add the corresponding `server/package.json` command and update the capacity README with
      prerequisites, exact commands, output schema, warm-up/sample policy, candidate-binding rules and
      the distinction between the full measurement and CI tripwire. Verify the README names the actual
      relocated `activity-search.queries.ts` source and contains no stale private-query claim.
- [x] 2.3 Add a bounded PostgreSQL-backed CI test for the route measurement seam. Prove the real
      controller/service/repository/mapper path, 50/100 limits, first/following pages, unread result,
      concurrency completion/error counts, aggregate-only output, local-host refusal, and that both
      repository and harness import the production-owned `calendarLogPageLateralSql` rather than a
      copied query. Verify with the focused server Jest command.
- [x] 2.4 Extend planner assertions to fail both a full `calendar_log` sequential scan (G3) and a
      full global-index walk (G3a) for bounded one-, ten-, one-hundred- and empty-calendar cohorts.
      Keep `EXPLAIN` fixture-only and pass every emitted plan through `redactPlan`; mutation-check the
      G3a assertion against the specification query shape.

## 3. Make telemetry privacy a mechanical gate

- [x] 3.1 Add or extend focused server tests that inventory Activity metric instruments and prove
      every explicit label is a finite literal, no Activity code adds sensitive span attributes or log
      payloads, validation/cursor/database failures emit sanitized responses, and captured metric,
      trace and log sinks contain zero matches for synthetic sensitive-marker categories. Verify the
      test reports category counts only.
- [x] 3.2 Add or extend focused mobile tests covering Activity mapping/storage/network failures and
      trigger outcomes. Prove every Crashlytics context/attribute and analytics event is static and all
      captured mobile sinks contain zero synthetic-marker matches; do not snapshot or print marker
      values.
- [x] 3.3 Inspect automatic HTTP instrumentation plus every explicit Activity metric, span, log,
      Crashlytics and analytics call site and enter the source/test matrix into the readiness record.
      If an already-available immutable candidate telemetry window can be queried without a deploy,
      credential read or live-data export, record only bounded negative-query counts; otherwise mark
      the environment row missing and therefore `NO-GO`.

## 4. Re-run the frozen capacity and single-flight gates

- [x] 4.1 Start the isolated local Postgres/Redis services, migrate, seed the deterministic
      full-scale Activity corpus and refresh planner statistics. Record the explicit local database
      target, corpus counts, candidate SHA and command versions without committing environment values
      or raw fixture rows.
- [x] 4.2 Run the full capacity comparison and shipped-route measurements with the documented sample
      counts. Populate G1 (50-row p95), G2 (100-row p95), G3, G3a, G4 (unread p95), G6
      (concurrent completion/error count, p95, event-loop delay and heap change) and G7 (measured v1
      p50/p95/p99/worst bytes reconciled with the projection). Verify every plan is redacted and every
      committed result is aggregate-only.
- [x] 4.3 Run the focused Activity coordinator and trigger integration suites with controlled
      overlap across push, successful sync, screen open and foreground. Populate G8 only when exactly
      one newest-page request crosses the request boundary, all observing callers share its outcome,
      and a later post-settlement forced trigger issues one new request.
- [x] 4.4 Compare the new results with the frozen gate table without changing its thresholds or
      relabelling missing evidence. Any failure sets the record to `NO-GO` and names the smallest
      bounded remediation whose corrected candidate must be remeasured.

## 5. Prove automated gates and compatibility

- [x] 5.1 Run the complete server checks required by the current repository gate: focused Activity
      capacity/controller/repository/service/privacy tests, full server Jest, dependency-free server
      E2E smoke, build/typecheck and lint. Record commands, suite/test counts and pass/fail against the
      candidate; do not treat the bounded planner tripwire as the full capacity run.
- [x] 5.2 Regenerate the server OpenAPI contract and the mobile Orval client through their supported
      commands, then prove `openapi/openapi.json` and `mobile/src/api/generated/` have zero drift.
      Any intentional contract difference is out of scope and requires a revised proposal rather than
      acceptance here.
- [x] 5.3 Run the complete mobile baseline required by the current repository gate: E2E harness
      regression/selector proofs, generated-client drift, TypeScript, lint, React Doctor changed-scope
      gate and Jest with coverage. Record exact commands and suite/test totals; retain Activity's
      focused unread, cache, navigation, pagination, ownership, restart and single-flight proofs.
- [x] 5.4 Complete the compatibility matrix row by row: React Native v1; valid unversioned arrays;
      malformed bare-string 400; unchanged Flutter generated client/source behavior; notification
      pipeline independence; one-year prune; backend-environment reset; and the previous mobile
      release against the candidate server. Each row must cite a focused test, zero-diff/static proof
      or already-available candidate exercise; inferred or unavailable rows fail closed.

## 6. Obtain exact-candidate native and environment evidence

- [x] 6.1 After all code/configuration changes are complete, commit and push one immutable
      code/configuration candidate. Record its full SHA and prohibit further runtime, contract, native
      config or workflow edits without invalidating all head-dependent evidence and starting a new
      candidate.
- [x] 6.2 Confirm the repository baseline CI jobs complete successfully for that candidate, then
      dispatch the existing manual native workflow with the full candidate SHA. Verify the workflow
      resolves that exact SHA and record Android and iOS job results plus retained artifact links; do
      not edit the workflow or add a pull-request trigger to obtain the run.
- [x] 6.3 Populate G9 only if the candidate Activity Maestro journey passes on both platforms with
      its unread, current-details, cancelled-item, pull-refresh, page-boundary tie-order and older-page
      assertions intact. A missing, mismatched, cancelled or failed platform result is `NO-GO`.
- [x] 6.4 If immutable preproduction image identity, route health or telemetry-window evidence is
      required but unavailable without a deployment or credentialed action, record the exact missing
      evidence and keep `NO-GO`. Do not deploy, promote, submit, backfill or access production from
      this change.

## 7. Reconcile release operations and living documentation

- [x] 7.1 Finish the readiness record's executable rollout order: deploy and verify the immutable
      server image and both v1/unversioned routes before any store/OTA build that calls v1. Document
      rollback to a compatible mobile release/OTA plus the prior server image while retaining the
      additive route/tables and requiring no destructive rollback. State explicitly that this change
      performs neither rollout nor rollback.
- [x] 7.2 Reconcile `docs/react-native-migration/01-roadmap/07-auxiliary-features.md`,
      `docs/react-native-migration/05-tech-specs/activity-revival.md`,
      `docs/mobile/architecture-book/features.md`, and the Architecture Book changelog with the final
      readiness disposition, active OpenSpec truth, compatibility and remaining work. Verify no
      implementation chronology is added; if a binding rule changed, add the required ADR and book
      changelog entry before continuing.
- [x] 7.3 Add one non-blocking `(HUMAN: ...)` note under
      `docs/react-native-migration/inbox/` for physical iPhone, iPad portrait, supported Android,
      VoiceOver/TalkBack, large-text and low-end scroll passes. Make clear that unfinished device work
      remains release evidence and is not a repository-merge gate.
- [x] 7.4 Finalize `GO` only when every candidate-bound row passes. Otherwise finalize `NO-GO`,
      track each bounded product correction or separately authorized evidence action outside this
      review, and require a fresh candidate plus rerun of every affected row before reconsideration.

## 8. Final verification and delivery proof

- [x] 8.1 Run `openspec validate verify-activity-release-readiness --strict`, `git diff --check`,
      documentation formatting checks, and all new focused CI-proof tests. Confirm task and spec
      scenarios match the final record.
- [x] 8.2 Inspect the complete branch diff, commit headers/messages and publication text with the
      repository disclosure preflight. Verify no credentials, certificate material, customer/live
      data, raw identifiers, request/response bodies, cursors, telemetry excerpts or external host
      paths are introduced.
- [x] 8.3 Verify the intended documentation/harness changes are the only modified paths and call out
      every sensitive surface in the pull-request body and handoff. Contract/schema/native/store/
      CI/deploy/legacy surfaces must remain unchanged unless a separately reviewed proposal explicitly
      supersedes this one.
