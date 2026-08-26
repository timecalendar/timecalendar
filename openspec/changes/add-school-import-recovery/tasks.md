## 1. Build the server recovery domain

- [ ] 1.1 Add closed TypeScript types for calendar-import classification, allowlisted
  school/generic help keys, structured fetch outcome, and retryability; add exhaustive
  compile-time/pure tests so no raw URL, exception, or query value can enter the recovery
  model.
- [ ] 1.2 Implement a table-driven, value-blind classifier over normalized school code,
  hostname, pathname shape, query-key presence, and structured outcome. Add sanitized
  fixtures for Rennes, Tours, Réunion, Montpellier, UBE, Lyon 2, Saint-Étienne, Bordeaux
  INP, and Toulouse 3, asserting each required classification/help key and a generic
  unknown fallback.
- [ ] 1.3 Add supported-export precedence tests for every cataloged host where a valid
  export shape is known; prove broad portal rules do not reject those exports and that the
  classifier never reads or returns query values.
- [ ] 1.4 Extend the Rennes strategy matcher to `planning.univ-rennes.fr` and add focused
  strategy/fetch-service tests proving a valid new-host export selects Rennes behavior
  while `/direct/` is rejected by recovery classification before upstream fetch.
- [ ] 1.5 Refactor the iCal fetch boundary just enough to expose bounded status-family,
  authentication/HTML, empty-body/calendar, parser, TLS/DNS/timeout, and 5xx outcomes to
  classification without parsing or propagating raw exception messages. Preserve TLS
  verification, successful parsing, existing renamers, and out-of-scope retry policy;
  verify each branch with focused fetcher/service tests.

## 2. Return typed recovery metadata

- [ ] 2.1 Add the Swagger-documented `CalendarImportErrorDto` with only constant code,
  closed classification, allowlisted help key, and retryable fields; have calendar
  creation translate safe classified failures into the existing appropriate non-2xx
  statuses without changing successful `{ token }` behavior.
- [ ] 2.2 Extend controller/sync integration tests for unsupported preflight, provider
  outage, invalid content, empty-calendar generic fallback, and unknown errors. Assert the
  exact response keys and prove synthetic URL credentials/resource identifiers, hostname,
  school database ID, raw message, and stack are absent.
- [ ] 2.3 Regenerate `openapi/openapi.json` with `cd server && npm run
  generate:openapi`, regenerate `mobile/src/api/generated/` with `cd mobile && npm run
  generate`, and add/adjust contract tests so both committed artifacts expose the typed
  create-calendar failure DTO with no manual generated-file edits.

## 3. Make server diagnostics privacy-safe

- [ ] 3.1 Change `CalendarFailure` and its repository API to accept only bounded school
  code, classification, help key, retryability, and allowlisted error-kind fields. Remove
  URL/`Error`/raw serialized exception parameters and update focused repository/sync tests.
- [ ] 3.2 Add a `server/src/migrations/` migration that irreversibly scrubs legacy raw URL
  and error content, establishes/prevents writes outside the safe diagnostic shape, and
  never reconstructs sensitive data in `down`. Flag this sensitive schema edit in the
  implementation handoff and PR body.
- [ ] 3.3 Add a PostgreSQL-backed `up → down → supported-forward` migration proof seeded
  only with synthetic credential/resource sentinels; assert schema behavior and that no
  sentinel survives or becomes writable after any step.
- [ ] 3.4 Remove source-domain/URL-derived metric labels and emit only allowlisted bounded
  classification/help/status/action values. Add metrics tests that inspect emitted
  attributes and reject synthetic URL/credential/resource sentinels.
- [ ] 3.5 Redact calendar-create request/response bodies from the mobile development API
  diagnostics (prefer method, safe route, and status only) and add a mutator regression
  test proving URL, credentials, resource IDs, and typed error body are never printed.

## 4. Map recovery through the mobile data seam

- [ ] 4.1 Replace the temporary `"Dev import"` calendar-create context with a typed add
  input that carries the actual selected school identity through the public
  school-selection → calendar-sources data seam while preserving URL trim, token resolve,
  and durable upsert behavior. Update data tests for selected and absent school context.
- [ ] 4.2 Add a total pure type guard/mapper from `ApiError<unknown>` to the feature-domain
  recovery model. Cover every closed class plus malformed, legacy, timeout/network,
  resolve, and persistence failures; UI must not import a generated DTO.
- [ ] 4.3 Replace recording of the original import error with a newly constructed
  sanitized error and static context. Add sentinel tests proving Crashlytics receives only
  bounded classification/help keys and never request URL/body, response body, token,
  school ID, raw exception message, or persistence detail.

## 5. Render localized school recovery and safe feedback

- [ ] 5.1 Add flat typed EN/FR title, instruction, and action keys for the nine required
  school help cohorts plus generic fallback. Unsupported copy must direct students to a
  public iCal export without requesting credentials; outage copy must describe a temporary
  provider problem.
- [ ] 5.2 Replace the generic iCal error block with an accessible recovery panel: resolved
  localized copy, Retry only for retryable recovery, and a non-retry correction action
  that returns focus to the editable URL field. Preserve live-region/alert semantics,
  loading lockout, platform touch targets, and existing success persistence.
- [ ] 5.3 Add component tests under both real EN and FR locales for representative Tours
  unsupported guidance, Rennes unsupported guidance, Saint-Étienne/Bordeaux INP/Toulouse
  3 outage guidance, generic fallback, conditional Retry, correction focus, report
  availability, and accessibility semantics.
- [ ] 5.4 Narrow iCal → Feedback route and DTO context to allowlisted classification/help
  keys only; remove `calendarUrl`, selected `schoolId`/name, and their copy/tests from this
  recovery handoff while keeping Settings-origin feedback behavior intact. Add route/data
  sentinel tests proving no source URL, credential, resource ID, or school database ID is
  forwarded.

## 6. CI, QA, and documentation proof

- [ ] 6.1 Extend the mail-safe Maestro iCal flow and deterministic E2E server fixture to
  render at least one unsupported-link state and one upstream-outage state without
  contacting a university or sending feedback; keep each flow lifecycle-isolated per ADR
  038.
- [ ] 6.2 Add
  `docs/react-native-migration/inbox/2026-08-26-school-import-recovery-device-checks.md`
  tagged `(HUMAN: iOS/Android device verification)` for VoiceOver/TalkBack, large text,
  focus return, dark/light contrast, Retry, and every named school copy state. Keep it
  non-blocking on this no-KVM host.
- [ ] 6.3 Update `docs/mobile/architecture-book/data.md`, `features.md`, and `CHANGELOG.md`
  with the typed create-error boundary and bounded-diagnostic/report-context rule. Confirm
  the extension stays within existing generated-client/layered seams; if implementation
  introduces a costly-to-reverse error framework or ownership change, stop and add an ADR
  before proceeding.
- [ ] 6.4 Run focused server classifier/fetch/calendar-sync/controller/metrics/repository/
  migration tests and focused mobile mutator/data/UI/feedback/i18n tests, recording exact
  commands and passing counts in the handoff.
- [ ] 6.5 Run local-green gates: server TypeScript/lint/tests for touched modules, mobile
  `npx tsc --noEmit`, lint, formatting, and Jest with coverage; run
  `openspec validate add-school-import-recovery` and resolve every validation error.
- [ ] 6.6 Re-run both OpenAPI and Orval generators and prove `git diff --exit-code --
  openapi/openapi.json mobile/src/api/generated` after committed output. Inspect the full
  diff/history for synthetic/real URLs, credentials, tokens, resource IDs, secrets, raw
  exception text, or scope expansion.
- [ ] 6.7 Add the PR's `run-e2e` label for the required CI-only iOS/Android recovery-state
  proof, wait for the fast server/mobile checks and both native E2E jobs, and attach their
  passing check URLs/counts to the QA handoff. Do not substitute this host's unavailable
  emulator for CI evidence.
