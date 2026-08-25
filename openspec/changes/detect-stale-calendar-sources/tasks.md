## 1. Server source-health model and classifier

- [ ] 1.1 Add typed server source-health status/reason/action/guide models and a Swagger DTO nested on `CalendarWithContent`; keep `CalendarForPublic` and existing event fields unchanged.
- [ ] 1.2 Implement a pure clock-injected classifier that parses `lastDate` defensively, applies the 14-day grace and last-successful-change rule, and returns `unknown` for invalid/weak evidence without logging source material.
- [ ] 1.3 Add the reviewed AMU retired-host/year registry rule plus a current-host near-miss rule; keep matching internal and do not add a URL renamer.
- [ ] 1.4 Unit-test classifier clock boundaries, invalid/missing dates, absent/older/newer change evidence, age-alone behavior, AMU retired/current host near misses, and sanitized outputs.

## 2. Server evidence query and batch response

- [ ] 2.1 Add one grouped calendar-log repository query that returns the latest `createdAt` by a bounded set of calendar IDs using the existing index, projecting no change JSON.
- [ ] 2.2 Unit-test the aggregate query shape, empty-ID no-query case, and timestamp mapping without hydrating log entities.
- [ ] 2.3 Update `CalendarService.findCalendarsForPublic`/helper mapping to load change evidence once and attach classified `sourceHealth` to every returned calendar after due sync attempts finish.
- [ ] 2.4 Extend service/controller tests to prove a multi-calendar batch uses one evidence query, an empty/erroring stale source retains last-good events, and no classification path rewrites/deletes a source or content.
- [ ] 2.5 Add a serialization/privacy assertion that the new health object contains only enum metadata and no URL, query value, token, raw error, or display text.

## 3. Committed API contract and generated mobile client

- [ ] 3.1 Regenerate `openapi/openapi.json` from the built NestJS app with the documented local test services, inspect the calendar-only diff, and confirm the additive `sourceHealth` schema has typed enums and no sensitive fields.
- [ ] 3.2 Regenerate committed `mobile/src/api/generated/` output with Orval; do not hand-edit generated files and inspect the calendar-controller/schema-only diff.
- [ ] 3.3 Add/adjust the server contract test and mobile real-generated-hook mutator-seam test so CI fails if `sourceHealth` is omitted, malformed, or disconnected from the feature mapper.

## 4. Mobile rebuildable source-health store

- [ ] 4.1 Add a `calendar-sources/store/` domain model plus exhaustive DTO validator/mapper for supported health codes; future unknown or malformed values degrade to `unknown`.
- [ ] 4.2 Add one namespaced JSON MMKV snapshot through `@/storage`, keyed by calendar ID and containing no URL/token, with total imperative/reactive reads and full replacement/pruning.
- [ ] 4.3 Integrate health replacement into `useSyncCalendars` after successful SQLite event replacement; preserve both old snapshots on request/event-write failure and record a health-write failure as a privacy-safe local persistence error.
- [ ] 4.4 Remove a calendar's keyed advisory state from the source-health snapshot when the existing confirm-gated calendar delete succeeds.
- [ ] 4.5 Unit-test DTO validation, privacy-safe serialization, malformed/future values, pruning, delete cleanup, restart/offline survival, success ordering, and every request/event-write/health-write failure branch under the 90% logic gate.

## 5. Recovery UI, localization, and accessibility

- [ ] 5.1 Add typed French/English translations for the compact Calendar attention banner, generic expired-window guidance, AMU 2026–27 transition guidance, and labelled management/re-add controls.
- [ ] 5.2 Extend the Calendar status surface to show a non-modal stale-source banner only when a held source is stale, keep cached events rendered, and route its action to `/user-calendars`.
- [ ] 5.3 Extend calendar management rows with a localized stale indicator, reason-specific explanation, and accessible “Add updated calendar” action through the existing school/add flow using only non-sensitive identity/recovery parameters.
- [ ] 5.4 Preserve the old calendar after recovery starts or succeeds; reuse the existing explicit confirm-gated delete as the only removal path.
- [ ] 5.5 Add component tests for stale versus healthy/unknown rendering, cached-content coexistence, banner and row navigation, AMU/generic localized copy, large-text branches where applicable, accessible roles/labels/live regions, and absence of URL/token text or params.

## 6. End-to-end and human QA proof

- [ ] 6.1 Add a sanitized deterministic E2E calendar/source-health seed that returns last-good events plus stale recovery metadata without making an external university request.
- [ ] 6.2 Add a shared Maestro recovery flow that imports the stale seed, asserts a last-good event remains visible, opens calendar management from the banner, and reaches the existing add-calendar flow from the stale row.
- [ ] 6.3 Add `docs/react-native-migration/inbox/<date>-stale-source-recovery-device-checks.md` tagged `(HUMAN: …)` with iOS/Android visual, VoiceOver/TalkBack, large-text, touch-target, and real AMU-copy checks; state that this host has no simulator.
- [ ] 6.4 Apply the PR `run-e2e` label after implementation, require both Android and iOS Maestro jobs, and record their check URLs/results in the issue handoff before QA.

## 7. Architecture Book and decision record

- [ ] 7.1 Add the next available Architecture Book ADR for the load-bearing non-destructive source-health/recovery contract, including alternatives, data-safety boundary, and a revisit condition for any audited server-side migration mechanism.
- [ ] 7.2 Update `docs/mobile/architecture-book/decisions/README.md` and `calendar.md` so current sync semantics cover advisory health, rebuildable storage, last-good preservation, and user-controlled recovery.
- [ ] 7.3 Review all sensitive-surface diffs and record explicitly that `openapi/openapi.json` and generated mobile code changed, while server migrations, native/store config, infrastructure/workflows, and legacy Flutter did not.

## 8. Local-green and CI verification

- [ ] 8.1 Run targeted server classifier/repository/service/controller tests and the OpenAPI generation/drift check.
- [ ] 8.2 Run targeted mobile store/sync/UI tests, then `npx tsc --noEmit`, lint, formatting, and `npm test -- --coverage`; confirm the new logic clears 90% and the project remains above 70%.
- [ ] 8.3 Run `openspec validate detect-stale-calendar-sources --strict` and review the final diff for accidental URL/token fixtures, unrelated generated churn, migrations, infrastructure, native config, or Flutter changes.
- [ ] 8.4 Use PR CI as the independent proof: require green server/mobile contract and generated-drift jobs plus the labelled Android/iOS Maestro recovery jobs; do not perform a deploy, bulk rewrite, or backfill from this change.
