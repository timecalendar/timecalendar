## Context

The Activity capacity tooling on current main measures the production-owned SQL directly. The candidate release review added a companion HTTP harness that imports the real `CalendarLogModule`, binds a loopback listener, calls `POST /v1/calendar-logs/search`, and reports route-level latency, response-size, and concurrency aggregates for an exact commit SHA.

That candidate harness constructs an `ActivityCapacityHttpRootModule` dynamic module but calls `configureMainApp(app, app)`. `configureMainApp` passes its first argument to class-validator's `useContainer`. The production bootstrap passes `app.select(AppModule)`, while test helpers pass their compiled `TestingModule`; both are valid module contexts. The application proxy is not equivalent: a validator lookup can enter Nest's exception zone and terminate the process before the route produces an HTTP response. The first DTO-validated request deterministically exposes the mismatch.

The HTTP harness currently exists only on the separate, unmerged release-readiness branch. This repair must be independently mergeable from current main, so it selectively carries the route harness, its command, its focused test, and only the README material required to operate it. Candidate-specific telemetry proofs, release verdicts, and unrelated evidence remain outside this change.

## Goals / Non-Goals

**Goals:**

- Boot the Activity HTTP capacity harness with the same module-container semantics as production.
- Prove the exact exported app factory survives class-validator resolution by sending a DTO-validated request through the real v1 Activity route.
- Retain candidate binding, loopback/local-database refusal, production-query reuse, deterministic synthetic fixtures, and aggregate-only output.
- Make the full-scale command reproducible against isolated synthetic PostgreSQL without changing capacity thresholds.

**Non-Goals:**

- Change production route, DTO, validation, repository, mapper, metric, or cursor behavior.
- Change the OpenAPI contract, generated client, schema/migrations, workflows, mobile/native/store configuration, deployment infrastructure, or legacy Flutter app.
- Carry the release-readiness record, broad telemetry evidence, or other additions owned by the release-review change.
- Connect to production or use real calendar, user, event, log, token, cursor, request-body, or credential data as evidence.

## Decisions

## Decision 1 — Select the harness root module before configuring global validation

After `NestFactory.create` constructs the harness application, call `configureMainApp(app.select(ActivityCapacityHttpRootModule), app)`. The selected module context becomes class-validator's service container; the application remains the target for pipes, middleware, filters, CORS, and HTTP lifecycle configuration.

This mirrors `configureMainApp(app.select(AppModule), app)` in production while keeping the harness's intentionally small dynamic root. It also preserves `fallbackOnErrors: true`, so validators that are not Nest providers retain class-validator's normal fallback behavior.

Alternative: keep passing the application proxy and catch process termination or validation errors. Rejected because the proxy is the wrong dependency-injection boundary, and Nest's exception zone can exit before ordinary route error handling runs.

Alternative: change `configureMainApp` to derive or tolerate an application proxy. Rejected because existing callers already express the module/application split correctly; broadening production bootstrap code to accommodate one harness would enlarge the repair and weaken a useful type-level contract.

## Decision 2 — The regression must cross the exported factory and real route

Replace the candidate's fake/test-module-only bootstrap proof with a focused PostgreSQL-backed test that calls `createActivityCapacityHttpApp` using the worker-isolated test database, obtains the loopback URL from the returned application, seeds a bounded deterministic Activity cohort through the application's `DataSource`, and performs at least one valid request through `POST /v1/calendar-logs/search`.

The assertion must establish that the request completes normally and returns the stable route shape. It may then run a one-sample aggregate measurement to retain the output/privacy checks. Teardown closes the app in an exception-safe path so a failing assertion does not leak the listener or database connection.

The test must be mutation-effective: substituting `configureMainApp(app, app)` for the selected module call must make the test fail. A test that only calls `measureActivityRoute` against `createTestApp`, compiles a `TestingModule`, or bypasses global DTO validation does not satisfy this requirement.

Alternative: spy on `configureMainApp` or assert the first argument's type. Rejected because that proves call shape without demonstrating the Nest/class-validator failure mode at the HTTP boundary.

## Decision 3 — Carry only the coherent route-harness slice from the candidate

Bring over the candidate's HTTP measurement implementation, its `activity:capacity:http` package command, and the README sections that define explicit local database URL, full candidate SHA, sample/warm-up policy, and aggregate-only output. Adapt the focused HTTP test to Decision 2. Do not copy the candidate's readiness document, telemetry fixture/tests, unrelated plan-test strengthening, or evidence records.

The HTTP harness continues to import `calendarLogPageLateralSql` as an identity proof and contains no private query text. The SQL harness remains the planner diagnostic; the HTTP harness remains the controller-through-serializer release proof.

Alternative: cherry-pick or copy the candidate branch wholesale. Rejected because it would mix this repair with evidence and feature work owned by another issue, defeating independent review and merge.

## Decision 4 — Full-scale evidence is an implementation verification, not a committed result

The Applier runs `npm run activity:capacity:http -- --url <isolated-local-db> --candidate <full-sha> --samples 25 --warmups 3` after the implementation is committed so the candidate argument binds to the tested head. The database contains only the deterministic synthetic corpus. The output is inspected for successful completion, the exact candidate SHA, aggregate distributions/cohort keys, and zero concurrency errors; it is not committed as this change's release verdict.

The command retains fail-closed checks for local database and HTTP hosts. stdout must contain neither request/response bodies nor tokens, calendar/user/event/log identifiers, cursors, or credential/config content; stderr remains limited to non-identifying progress or errors.

The release-readiness owner freezes a new candidate after the repair merges and reruns all head-bound evidence. This change cannot relabel or validate the failed candidate's output.

## Risks / Trade-offs

- **[The real-factory test targets the wrong database]** → Derive the worker-isolated test URL from the existing server test database contract and seed through the factory-created application's `DataSource`; never guess a default or rewrite shared environment files.
- **[A test passes without exercising validation]** → Send a request body handled by the real v1 DTO/global validation pipe and require mutation effectiveness against the known application-proxy call.
- **[The selected candidate slice drifts into release-review scope]** → Restrict changed implementation paths to the HTTP harness, its focused test, package command, and README; explicitly inspect the branch diff before commit.
- **[Output leaks row-level fixture data]** → Preserve aggregate-only result types and negative-output assertions for tokens, ids, cursors, item bodies, and calendar names.
- **[A listener or connection survives a red test]** → Close every factory-created app in `afterAll` or `finally`, and retain the shared test harness's connection cleanup.
- **[Full-scale evidence is mistaken for reusable release evidence]** → Record only completion and aggregate-shape verification on this repair; require a new candidate and rerun in the release-readiness work.

## Migration Plan

Land the proposal, then implement the minimal route-harness slice and verification on this branch. There is no runtime deployment or data migration: the new command is operator-invoked and local-only. Rollback is a repository revert removing the harness command/files; production application behavior and stored data are unaffected.

## Open Questions

None. The existing production/test `configureMainApp` callers and the reproduced candidate failure define the intended module-container contract.
