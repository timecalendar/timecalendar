## 1. Establish the independently mergeable HTTP harness

- [x] 1.1 Add the candidate-bound Activity route measurement at `server/src/scripts/activity-capacity/http.ts`, reusing the production-owned lateral query export and existing deterministic fixtures; keep its explicit local database/loopback guards, full-SHA requirement, default 25 samples plus 3 warm-ups, aggregate result schema, and body/token/id/cursor-free output.
- [x] 1.2 Define the harness dynamic root around `TypeOrmModule` and `CalendarLogModule`, then configure the application with `configureMainApp(app.select(root), app)` using the exact registered `ActivityCapacityHttpRootModule` dynamic descriptor before binding to loopback; do not change `configureMainApp`, production bootstrap, route, DTO, service, repository, mapper, metrics, query, or thresholds.
- [x] 1.3 Add `activity:capacity:http` to `server/package.json` at the committed harness path and inspect the package/source pair together to prove the command resolves without adding a dependency or changing another script.

## 2. Add mutation-effective real-factory regression coverage

- [x] 2.1 Add a focused PostgreSQL-backed HTTP harness test that calls `createActivityCapacityHttpApp` with the existing worker-isolated test database, obtains its `DataSource`, seeds a bounded deterministic cohort, and sends a valid DTO body through the real `POST /v1/calendar-logs/search` route.
- [x] 2.2 Assert the factory-created request completes with the stable successful route shape, and retain bounded aggregate checks for page sizes, sample counts, concurrency completion, candidate identity, shared-query ownership, and absence of tokens, ids, cursors, item bodies, and calendar names from serialized output.
- [x] 2.3 Close the factory-created Nest application on success and failure, and mutation-check the regression by temporarily substituting `configureMainApp(app, app)`; confirm the focused test fails on the first validated route request, then restore the selected-module implementation and confirm it passes. Do not accept a `createTestApp`/compiled-testing-module-only proof.
- [x] 2.4 Run `cd server && npm test -- --runInBand src/scripts/activity-capacity/http.test.ts` with the documented isolated Postgres/Redis test prerequisites and record the discovered test file plus passing assertion count.

## 3. Keep operator guidance and architecture boundaries current

- [x] 3.1 Update `server/src/scripts/activity-capacity/README.md` only as needed to document the independently available HTTP command, explicit isolated-local URL, full candidate SHA, 25-sample/3-warm-up policy, SQL-versus-HTTP ownership, and aggregate-only output; do not copy release verdicts or unrelated readiness evidence.
- [x] 3.2 Review `docs/mobile/architecture-book/architecture.md`, `testing.md`, and the Activity ADRs against the implementation. Confirm the repair follows the already-recorded testing/container patterns and therefore leaves the Architecture Book, changelog, and ADR set unchanged; if implementation reveals a reusable rule change, stop and return the design mismatch to the Founding Engineer instead of silently expanding scope.

## 4. Verify the repaired full-scale command locally

- [ ] 4.1 Provision isolated synthetic PostgreSQL with the existing repository wrapper, apply the existing schema, seed the documented full-scale Activity corpus, and keep all URLs/ports explicit and checkout-local; never use production/live data or read `server/config/serviceAccountKey.json` or certificate material into evidence.
- [ ] 4.2 After committing the implementation, run `npm run activity:capacity:http -- --url <isolated-local-db> --candidate <full-sha> --samples 25 --warmups 3` against that commit. Confirm every configured cohort/page measurement completes, the output carries the exact SHA and aggregate policy, and concurrency reports zero route errors.
- [ ] 4.3 Inspect stdout and stderr for the allowed aggregate vocabulary and prove they contain no request/response bodies, calendar tokens, calendar/user/event/log identifiers, cursors, credential/config content, or row-level values. Keep run output in run-owned scratch storage rather than committing it as release evidence.

## 5. Local-green, scope, and CI proof

- [x] 5.1 Run `cd server && npm run build`, focused ESLint over the changed server TypeScript files, and the focused real-factory Jest command; repair failures without weakening validation, privacy assertions, capacity thresholds, or sample policy.
- [ ] 5.2 Run `openspec validate repair-activity-http-harness-container` and `git diff --check`, then inspect the branch diff to confirm `openapi/openapi.json`, `mobile/src/api/generated/`, `server/src/migrations/`, `.github/workflows/`, native/store config, deployment infrastructure, `app/`, credentials, certificates, release-readiness records, and unrelated candidate evidence are unchanged.
- [ ] 5.3 Push the implementation and confirm the repository's existing server build/test and disclosure checks are green on the exact PR head. Treat the focused PostgreSQL regression and completed full-scale command as the CI/local proof for this repair; do not add or modify a workflow.
- [ ] 5.4 Hand the merged repair back to the release-readiness owner with an explicit note that prior candidate-bound evidence is invalid and a new full SHA plus all affected head-bound evidence must be frozen and rerun.
