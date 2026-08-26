## 1. Server source-health model and classifier

- [x] 1.1 Add typed server source-health status/reason/action/guide models and a Swagger DTO nested on `CalendarWithContent`; keep `CalendarForPublic` and existing event fields unchanged.
- [x] 1.2 Implement a pure clock-injected classifier that parses `lastDate` defensively, applies the 14-day grace and last-successful-change rule, and returns `unknown` for invalid/weak evidence without logging source material.
- [x] 1.3 Add the reviewed AMU retired-host/year registry rule plus a current-host near-miss rule; keep matching internal and do not add a URL renamer.
- [x] 1.4 Unit-test classifier clock boundaries, invalid/missing dates, absent/older/newer change evidence, age-alone behavior, AMU retired/current host near misses, and sanitized outputs.

## 2. Server evidence query and batch response

- [x] 2.1 Add one grouped calendar-log repository query that returns the latest `createdAt` by a bounded set of calendar IDs using the existing index, projecting no change JSON.
- [x] 2.2 Unit-test the aggregate query shape, empty-ID no-query case, and timestamp mapping without hydrating log entities.
- [x] 2.3 Update `CalendarService.findCalendarsForPublic`/helper mapping to load change evidence once and attach classified `sourceHealth` to every returned calendar after due sync attempts finish.
- [x] 2.4 Extend service/controller tests to prove a multi-calendar batch uses one evidence query, an empty/erroring stale source retains last-good events, and no classification path rewrites/deletes a source or content.
- [x] 2.5 Add a serialization/privacy assertion that the new health object contains only enum metadata and no URL, query value, token, raw error, or display text.

## 3. Committed API contract and generated mobile client

- [x] 3.1 Regenerate `openapi/openapi.json` from the built NestJS app with the documented local test services, inspect the calendar-only diff, and confirm the additive `sourceHealth` schema has typed enums and no sensitive fields.
- [x] 3.2 Regenerate committed `mobile/src/api/generated/` output with Orval; do not hand-edit generated files and inspect the calendar-controller/schema-only diff.
- [x] 3.3 Add/adjust the server contract test and mobile real-generated-hook mutator-seam test so CI fails if `sourceHealth` is omitted, malformed, or disconnected from the feature mapper.

## 4. Mobile rebuildable source-health store

- [x] 4.1 Add a `calendar-sources/store/` domain model plus exhaustive DTO validator/mapper for supported health codes; future unknown or malformed values degrade to `unknown`.
- [x] 4.2 Add one namespaced JSON MMKV snapshot through `@/storage`, keyed by calendar ID and containing no URL/token, with total imperative/reactive reads and full replacement/pruning.
- [x] 4.3 Integrate health replacement into `useSyncCalendars` after successful SQLite event replacement; preserve both old snapshots on request/event-write failure and record a health-write failure as a privacy-safe local persistence error.
- [x] 4.4 Remove a calendar's keyed advisory state from the source-health snapshot when the existing confirm-gated calendar delete succeeds.
- [x] 4.5 Unit-test DTO validation, privacy-safe serialization, malformed/future values, pruning, delete cleanup, restart/offline survival, success ordering, and every request/event-write/health-write failure branch under the 90% logic gate.

## 5. Recovery UI, localization, and accessibility

- [x] 5.1 Add typed French/English translations for the compact Calendar attention banner, generic expired-window guidance, AMU 2026–27 transition guidance, and labelled management/re-add controls.
- [x] 5.2 Extend the Calendar status surface to show a non-modal stale-source banner only when a held source is stale, keep cached events rendered, and route its action to `/user-calendars`.
- [x] 5.3 Extend calendar management rows with a localized stale indicator, reason-specific explanation, and accessible “Add updated calendar” action through the existing school/add flow using only non-sensitive identity/recovery parameters.
- [x] 5.4 Preserve the old calendar after recovery starts or succeeds; reuse the existing explicit confirm-gated delete as the only removal path.
- [x] 5.5 Add component tests for stale versus healthy/unknown rendering, cached-content coexistence, banner and row navigation, AMU/generic localized copy, large-text branches where applicable, accessible roles/labels/live regions, and absence of URL/token text or params.

## 6. End-to-end and human QA proof

- [x] 6.1 Add a sanitized deterministic E2E calendar/source-health seed that returns last-good events plus stale recovery metadata without making an external university request.
- [x] 6.2 Add a shared Maestro recovery flow that imports the stale seed, asserts a last-good event remains visible, opens calendar management from the banner, and reaches the existing add-calendar flow from the stale row.
- [x] 6.3 Add `docs/react-native-migration/inbox/<date>-stale-source-recovery-device-checks.md` tagged `(HUMAN: …)` with iOS/Android visual, VoiceOver/TalkBack, large-text, touch-target, and real AMU-copy checks; state that this host has no simulator.
- [x] 6.4 Apply the PR `run-e2e` label after implementation, require both Android and iOS Maestro jobs, and record their check URLs/results in the issue handoff before QA.

## 7. Architecture Book and decision record

- [x] 7.1 Add the next available Architecture Book ADR for the load-bearing non-destructive source-health/recovery contract, including alternatives, data-safety boundary, and a revisit condition for any audited server-side migration mechanism.
- [x] 7.2 Update `docs/mobile/architecture-book/decisions/README.md` and `calendar.md` so current sync semantics cover advisory health, rebuildable storage, last-good preservation, and user-controlled recovery.
- [x] 7.3 Review all sensitive-surface diffs and record explicitly that `openapi/openapi.json` and generated mobile code changed, while server migrations, native/store config, infrastructure/workflows, and legacy Flutter did not.

## 8. Local-green and CI verification

- [x] 8.1 Run targeted server classifier/repository/service/controller tests and the OpenAPI generation/drift check.
- [x] 8.2 Run targeted mobile store/sync/UI tests, then `npx tsc --noEmit`, lint, formatting, and `npm test -- --coverage`; confirm the new logic clears 90% and the project remains above 70%.
- [x] 8.3 Run `openspec validate detect-stale-calendar-sources --strict` and review the final diff for accidental URL/token fixtures, unrelated generated churn, migrations, infrastructure, native config, or Flutter changes.
- [ ] 8.4 Use PR CI as the independent proof: require green server/mobile contract and generated-drift jobs plus the labelled Android/iOS Maestro recovery jobs; do not perform a deploy, bulk rewrite, or backfill from this change.

## 9. Seeded-import native E2E remediation

- [ ] 9.1 Refactor the dev-import orchestration so reactive sync/router callback identity changes cannot cancel an in-flight mounted run; retain the one-run guard, suppress navigation/state updates after a genuine unmount, and assert exactly one `/calendar` replacement after success.
- [ ] 9.2 Add a focused integration regression that renders `DevImportScreen` with a mounted `useSourceHealthSnapshot` subscriber, drives the real `useSyncCalendars` generated-hook path with the existing `customFetch`, DB, and storage seams, and proves the SQLite event write plus MMKV notification cannot suppress navigation.
- [ ] 9.3 Update `mobile/.maestro/calendar.yaml` and every affected committed calendar-family flow to tap `calendar-view` then the visible `Agenda` native menu action on Android and iOS; remove all `calendar-view-agenda` references while retaining the seeded event, details, stale-recovery, and hidden-event assertions.
- [ ] 9.4 Confirm this leaf fix requires no Architecture Book/ADR change and touches no contract/generated API, server migration, native/store configuration, infrastructure/workflow, CI harness, or legacy Flutter surface; if any such surface becomes necessary, stop and return to Founding Engineering.
- [ ] 9.5 Run the focused dev-import integration regression plus existing dev-import screen, sync, and source-health store tests; then run TypeScript/lint/format checks scoped to changed mobile files and `openspec validate detect-stale-calendar-sources --strict`.
- [ ] 9.6 Push the integrated head with the existing `run-e2e` label and require green Android and iOS native jobs before Reviewer sign-off, recording exact check URLs/results in the handoff; there is no separate QA gate.
