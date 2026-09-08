## 1. Deterministic test server world

- [ ] 1.1 Add a `NODE_ENV=test`-only export-guide seed for the enabled test flag and stable listed
  exact, unknown-provider, safe/missing/unsafe Connect schools; verify focused seed tests prove the
  expected Postgres rows and prove non-test seeding does not create or enable them.
- [ ] 1.2 Add the immutable bilingual T4 fixture identity over all four initial providers and one
  approved-origin controlled broken page image without uploading an object or changing the mobile
  allowlist; verify catalogue validation, FR/EN parity, provider order, raw unknown slug, and
  deterministic fixture-version tests.
- [ ] 1.3 Extend the real E2E server lifecycle checks to prove the seeded flag, school responses,
  catalogue `200`/ETag/language headers, and broken asset response are reachable through the
  disposable NestJS/Postgres boundary; verify the lifecycle tears down without changing a live
  service or configuration.

## 2. Shared export-guide Maestro suite

- [ ] 2.1 Add a closed `--suite smoke|export-guide` argument to `mobile/e2e/run_e2e.sh`, preserving
  smoke as the default and reusing lexical discovery, helper exclusion, one server lifecycle,
  process-per-flow execution, ADR-038 classification, logs, and teardown; verify
  `mobile/e2e/test_run_e2e.sh` covers both suites plus missing, empty, unknown, and path-shaped input.
- [ ] 2.2 Add platform-neutral export-guide flows and nested helpers for listed exact mapping,
  unknown-provider Generic substitution, unlisted provider order/selection, safe and skipped
  Connect, blocking plus Retry restoration, controlled broken image, native Back, and final manual
  selector handoff; verify every flow starts from deterministic state and no flow reaches QR/iCal
  before completion.
- [ ] 2.3 Extend `mobile/e2e/maestro-selectors.test.ts` to recursively validate the dedicated suite's
  fixed inventory, helpers, shipped test IDs, non-vacuous negative assertions, and stable localized
  fixture text while keeping `mobile/.maestro/*.yaml` pinned to exactly the existing three daily
  journeys.

## 3. Production-capable guard proof

- [ ] 3.1 Add one shared cold-state production-guard Maestro flow for direct manual, QR, and iCal
  links; verify each returns to School without rendering the protected destination, creating a
  self-loop, or invoking calendar creation.
- [ ] 3.2 Add a bounded test/probe proving a production runtime rejects
  `seedDevelopmentCompletion`, including absent/malformed runtime identity cases, and verify no
  `__DEV__`, route parameter, or persisted value can enable it.
- [ ] 3.3 Add log assertions around the production guard proof so it cannot contact a live backend;
  verify the production-identity build uses existing config unchanged and the flow ends before any
  request-dependent guide or import action.

## 4. Exact-SHA CI and evidence artifacts

- [ ] 4.1 Extend `.github/workflows/ci-mobile-e2e.yml` with a closed manual suite input: schedules
  continue to run smoke, while an `export-guide` dispatch resolves one SHA and runs release-config
  development variants plus production-identity guard builds on both Android and iOS; retain no
  push, pull-request, branch, or label trigger.
- [ ] 4.2 Generate JSON and Markdown evidence summaries from runtime outputs for target SHA, run,
  UTC date, suite, app identity/variant, Release configuration, server and fixture version, runner,
  emulator/simulator model and OS/runtime, toolchain, and axis results; upload summaries plus Maestro
  and server diagnostics on success and failure.
- [ ] 4.3 Extend `mobile/e2e/test_ci_mobile_e2e.sh` with mutation-backed checks for exact-SHA reuse,
  both-platform selection, suite routing, development and production build contracts, no-network
  guard execution, required provenance, artifact retention, and forbidden PR/push/label triggers;
  verify changing or deleting each load-bearing field makes the test fail.
- [ ] 4.4 Add a focused evidence checker which rejects different-SHA, missing, skipped, cancelled,
  failed, malformed, or incomplete platform results and reports only stable safe axis IDs; verify
  pass/fail fixtures for both-platform completion and every refusal branch.

## 5. Physical-device procedure and current-state documentation

- [ ] 5.1 Add a `(HUMAN: ...)` migration inbox record with the named iPhone/VoiceOver,
  iPad/portrait compact and readable-width, and low-end Android/TalkBack matrix; include every
  light/dark, largest-font, target, announcement/focus, Back, offline/LKG/Retry, Connect, broken
  image, lifecycle/process-death, and guarded QR/iCal axis plus required model, OS, SHA/variant,
  fixture version, UTC date, and PASS/FAIL/NOT RUN fields.
- [ ] 5.2 Update `mobile/e2e/README.md`, `docs/mobile/architecture-book/testing.md`, and the
  Architecture Book changelog to distinguish the unchanged three-journey daily health signal from
  the manually selected exact-head export-guide proof; add an ADR only if implementation cannot
  preserve ADRs 038, 055, and 057 unchanged.
- [ ] 5.3 Audit the final diff and documentation for scope: explicitly verify no OpenAPI/generated
  API, migration, dependency, `mobile/app.config.ts`, `mobile/eas.json`, Firebase, certificate,
  deployment, Flutter, web, live catalogue/flag/object, production/preproduction, credential, or
  store/device-install change.

## 6. Verification and exact-head evidence

- [ ] 6.1 Run formatting and focused server seed/catalogue/lifecycle tests, mobile selector/harness/
  workflow/evidence tests, production-route guard tests, `npx tsc --noEmit`, `npm run lint`, and
  mobile coverage; verify the 90% logic and 70% global thresholds remain green.
- [ ] 6.2 Run `openspec validate prove-export-guide-release-readiness --strict`, run the repository
  disclosure scan over the final diff, and inspect generated artifacts to confirm no drift or
  sensitive-surface expansion beyond the reviewed workflow.
- [ ] 6.3 After the implementation commit is pushed, manually dispatch the export-guide proof for
  its exact SHA, verify executed (not syntax-only) Android and iOS evidence with the checker, and
  attach the workflow/run artifact references to the issue; any later implementation change
  invalidates the evidence and requires one new exact-head dispatch.
- [ ] 6.4 Record the physical matrix's actual results when an authorized device run is available;
  otherwise leave every unexecuted cell `NOT RUN` in the `(HUMAN: ...)` inbox record and do not
  claim simulator, Jest, or syntax evidence as a physical pass or a repository-merge gate.
