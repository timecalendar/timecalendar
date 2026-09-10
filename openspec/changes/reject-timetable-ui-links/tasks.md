## 1. Pure calendar-source classification

- [ ] 1.1 Add a pure classifier beside `server/src/modules/fetch/` that parses absolute URLs,
  accepts only HTTP/HTTPS/`webcal`, returns bounded internal reasons, and encodes the exact
  host/path table from the design without substring, suffix, response-content, or generic-path
  heuristics.
- [ ] 1.2 Add focused classifier tests for empty/relative/malformed inputs, every unsupported
  protocol class, accepted HTTP/HTTPS/`webcal`, query and fragment handling, every Lyon 1/UBE/
  Montpellier/Rennes/Toulouse 3 rule, hostname lookalikes, same paths on unrelated hosts, and
  unlisted paths on listed hosts.

## 2. Fetch-boundary enforcement and preserved exports

- [ ] 2.1 Invoke the classifier at the beginning of `FetchService.fetchEvents` and map every
  rejection to `BadRequestException("Unsupported calendar URL")` before strategy resolution,
  URL renaming, retry accounting, or fetcher invocation; do not change
  `getMinSyncIntervalMinutes`.
- [ ] 2.2 Extend `fetch.service.test.ts` so each named bad shape plus malformed/non-HTTP input
  rejects with the selected and generic fetcher mocks untouched, while the public error contains
  neither the submitted URL nor an internal classifier reason.
- [ ] 2.3 Add positive same-origin cases proving Lyon 1/UBE/Rennes ADE
  `anonymous_cal.jsp`/`direct_cal.jsp?calType=ical` exports still reach bounded date-window
  normalization and the fetcher, and a non-UI Toulouse 3 Celcat export still reaches the fetcher
  and parser path.
- [ ] 2.4 Retain regression assertions for `webcal` conversion, school-specific renamers and
  generic-renamer opt-outs, Lyon 1's 60-minute policy, retries, parser behavior, and cancelled-event
  filtering; repair only failures caused by the new validation boundary.

## 3. Calendar creation and failure-policy proof

- [ ] 3.1 Extend `calendar-sync.service.test.ts` through the real `FetchService` seam to prove a
  listed UI source makes no fetcher call, creates no `Calendar`/`CalendarContent`, and writes one
  `calendar_failure` containing the full original source and the serialized stable error.
- [ ] 3.2 Add or retain focused coverage that an existing due calendar rejected by validation
  preserves its last-known content and creates no new-calendar failure row, following the existing
  failed-sync scheduling policy.
- [ ] 3.3 Retain the accepted-source empty/eventless test and `No events found` assertion, plus the
  ADE create/resync test that recomputes the date window while storing the original source URL.

## 4. Toulouse 3 backend provider data

- [ ] 4.1 Add a TypeORM data migration that updates only `school.code = 'univtoulouse3'` from
  `generic` or legacy `univtoulouse3` to `celcat`; make `down` restore `generic` only while the
  current value is still `celcat`, with no schema/catalogue/live-flag change.
- [ ] 4.2 Add a real Postgres migration test with Toulouse 3 generic, legacy, already-Celcat,
  unexpected-provider, and unrelated-school rows; prove guarded `up`/`down`, preservation of every
  other field/row, repeat safety, and exception-safe restoration of the worker test data.
- [ ] 4.3 Run the focused school mapper/export-guide projection tests and confirm Toulouse 3 now
  resolves to the existing `celcat` provider without changing the catalogue manifests, public DTO
  shape, or legacy compatibility behavior.

## 5. Architecture Book

- [ ] 5.1 Update `docs/mobile/architecture-book/calendar.md` with the reusable server pre-fetch
  validation boundary, stable error, exact-host rule posture, accepted-export preservation,
  failure-recording/empty-feed behavior, and links to the enforcing classifier and tests.
- [ ] 5.2 Add the matching concise entry to `docs/mobile/architecture-book/CHANGELOG.md`; record no
  ADR and create no human/device inbox note because this is a local backend correction with
  deterministic service proof.

## 6. Local-green and CI proof

- [ ] 6.1 Add a named server CI-proof test (or clearly named focused integration block) that drives
  the complete configured bad-shape matrix through `FetchService` with the outbound mock untouched
  and drives representative valid ADE/Celcat exports through it, so classifier-only coverage cannot
  stay green if enforcement moves after the fetcher.
- [ ] 6.2 Run the focused classifier, fetch-service, ADE-renamer, calendar-sync, migration, school
  mapper, and export-guide suites with the repository's worker-isolated Postgres/Redis test
  prerequisites; record the exact command and passing counts in the PR/handoff.
- [ ] 6.3 Run server local green (`npm run build`, `npm run lint`, and `npm test -- --runInBand`) and
  resolve every in-scope failure without weakening assertions.
- [ ] 6.4 Run `server`'s `npm run generate:openapi` from built Nest output and confirm
  `openapi/openapi.json` is byte-identical; do not run mobile codegen or change any file under
  `mobile/**`.
- [ ] 6.5 Run `openspec validate reject-timetable-ui-links`, `git diff --check`, and the repository
  disclosure scan; confirm the final diff contains only the scoped server implementation/tests,
  the targeted migration, Architecture Book entries, and this OpenSpec change, with no mobile,
  generated-client, API-contract, dependency, workflow/infra, deploy/native/store, web, or legacy
  Flutter changes.

## 7. CI proof on the pushed head

- [ ] 7.1 After pushing the implementation, confirm the `CI build & deploy` server test and OpenAPI
  drift steps are green on the exact PR head and that no mobile job was triggered by an accidental
  `mobile/**` or generated-client diff; repair implementation failures rather than broadening the
  classifier or weakening the test matrix.
