## 1. Server classification and Rennes host recovery

- [ ] 1.1 Add a pure, table-driven calendar import-source classifier using parsed host/path/query-key names only; cover Rennes, Tours, Réunion, Montpellier, UBE, Lyon 2, Saint-Étienne, Bordeaux INP, Toulouse 3, deceptive suffixes, malformed URLs, and unknown sources with secret-free unit fixtures.
- [ ] 1.2 Extend the Rennes strategy to match direct iCal endpoints on `planning.univ-rennes.fr` while the classifier rejects its `direct` web-UI shape; prove both positive and negative cases in focused strategy/service tests.
- [ ] 1.3 Add the closed calendar-import recovery enums/DTO and typed exceptions: HTTP 422 for `unsupported_link`, HTTP 502 for `upstream_unavailable`, with only `code`, `school`, and `help`; document both error responses on `POST /calendars` and verify exact serialized bodies in controller/service tests.
- [ ] 1.4 Wire pre-fetch unsupported-link classification and post-failure upstream classification into calendar creation while preserving generic behavior for unknown sources; use mocked upstream responses to prove all named school cases without live network calls.

## 2. Server diagnostic privacy

- [ ] 2.1 Replace full source-URL/raw-exception persistence for new `calendar_failure` rows with hostname plus allowlisted error class/code/school/help fields, without a schema migration; update repository/service tests to assert query strings, credentials, resource ids, messages, stacks, and upstream bodies are absent.
- [ ] 2.2 Keep calendar import metrics bounded to stable school/hostname/action/status/category labels and add a test or explicit assertion that no path, query value, request body, or resource id enters telemetry.

## 3. Committed API contract (sensitive surface)

- [ ] 3.1 Regenerate `openapi/openapi.json` from the built NestJS application after the DTO/controller changes and run the server OpenAPI drift check; inspect the diff to confirm only the intended calendar-create 422/502 schemas and enums are added.
- [ ] 3.2 Regenerate `mobile/src/api/generated/` with Orval from the committed spec and run the generated-client drift check; never hand-edit generated output and verify the create mutation exposes the documented error DTO.

## 4. Mobile recovery data seam and safe diagnostics

- [ ] 4.1 Add an exhaustive pure mapper in `calendar-sources/data/` from `ApiError` plus the generated recovery DTO to a feature-domain recovery value (school, translation key, edit-vs-retry policy), with malformed/unknown bodies falling back safely; cover every enum combination to the 90% logic threshold.
- [ ] 4.2 Extend the create/add-calendar seam to expose the typed recovery without leaking generated types into `ui/`, while retaining success token resolution/durable upsert and generic network/resolve/persistence error behavior; prove against the real generated mutation with `customFetch` mocked.
- [ ] 4.3 Make shared mobile API debug logs method/path/status-only, removing request and response bodies; update `mutator.test.ts` to prove source URLs in request bodies and tokens/resource ids in responses are never logged.
- [ ] 4.4 Add a sanitized unexpected-import diagnostic helper or equivalent seam that records only context, error class, and HTTP status; test that recognized recovery errors are not sent to Crashlytics and that unknown errors never forward the submitted URL or `ApiError.body`.

## 5. Mobile FR/EN recovery UI

- [ ] 5.1 Add matching typed FR/EN catalog entries for school-specific export/renew-link guidance (Rennes, Tours, Réunion, Montpellier, UBE, Lyon 2), temporary-outage guidance (Saint-Étienne, Bordeaux INP, Toulouse 3), and accessible edit/retry action labels; include no guessed protected URLs or credential instructions.
- [ ] 5.2 Update `ical-url-screen.tsx` to render the data seam's accessible recovery alert: unsupported links keep the field editable and offer edit/try-again, upstream outages offer retry, and unknown failures retain the generic retry state; preserve loading, success, touch-target, and focus behavior.
- [ ] 5.3 Extend component tests for localized FR/EN school guidance, accessibility live-region/roles, unsupported edit behavior, outage retry, generic retry, and the expected-vs-unexpected Crashlytics policy.

## 6. CI and required QA proof

- [ ] 6.1 Extend the Maestro iCal-import flow with a synthetic, secret-free recognized web-UI URL that the local server rejects before outbound fetch; assert the school recovery copy and appropriate action through the real app→generated client→NestJS stack.
- [ ] 6.2 Apply the PR's `run-e2e` label and record green `ci-mobile-e2e.yml` Android and iOS jobs as the CI proof test; do not claim local device proof on this no-KVM host.
- [ ] 6.3 Create `docs/react-native-migration/inbox/2026-08-25-school-import-recovery-dod-manual.md` tagged `(HUMAN: …)` with concrete physical-device VoiceOver, TalkBack, large-text, native-behavior, and real-school unsupported/outage recovery checks; this records device-only work without blocking implementation.

## 7. Architecture Book

- [ ] 7.1 Update `docs/mobile/architecture-book/data.md` with the typed calendar-import error contract, data-seam ownership, body-free API logging rule, and both OpenAPI drift gates; link the enforcing tests/code.
- [ ] 7.2 Update `docs/mobile/architecture-book/features.md` (and `testing.md` only if the reusable proof pattern changes) with calendar-sources recovery ownership, expected-error observability policy, and deterministic pre-fetch E2E posture; confirm no ADR is needed under `decisions/README.md`.

## 8. Local-green verification and handoff evidence

- [ ] 8.1 Run focused server classifier, strategy, calendar-sync, repository, controller, telemetry, and OpenAPI tests plus server type/lint checks required by the touched files; record exact commands/results in the PR.
- [ ] 8.2 In `mobile/`, run generated drift, `npx tsc --noEmit`, `npm run lint`, focused mutator/data/UI tests, and `npm test -- --coverage`; confirm 90% logic/70% global gates and FR/EN parity.
- [ ] 8.3 Run `openspec validate add-school-specific-import-recovery --strict`, inspect `git diff` for source URLs/credentials/resource ids and unintended sensitive-surface changes, and update the PR body with final scope, sensitive contract files, verification, CI proof, and required QA status.
