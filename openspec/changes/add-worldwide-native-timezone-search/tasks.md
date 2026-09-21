## 1. Pin and generate the worldwide catalog

- [x] 1.1 From `mobile/`, install exact `@vvo/tzdb@6.198.0`, `cldr-dates-full@48.2.0`, and `cldr-localenames-full@48.2.0` development inputs through npm so `package.json` and `package-lock.json` agree; verify `npm ls @vvo/tzdb cldr-dates-full cldr-localenames-full` reports only the intended versions.
- [x] 1.2 Add `mobile/scripts/generate-timezone-catalog.mjs` and package scripts that extract only en/fr exemplar-city and territory labels, preserve every tzdb name/group member plus UTC as an exact record, and support deterministic write/`--check` modes; verify two writes are byte-identical and `npm run generate:timezone-catalog -- --check` passes.
- [x] 1.3 Commit the generated feature artifact under `mobile/src/features/settings/data/` with package-version provenance and no full CLDR runtime imports; add a generator proof covering all former curated identifiers, UTC, aliases, Lyon, London/Londres, and missing-label fallback, then run that focused Jest suite.

## 2. Build the feature-owned catalog and search boundary

- [x] 2.1 Add typed catalog records, exact-ID lookup, locale label fallback, cached `Intl` runtime-support checks, and current-offset formatting in `settings/data/`; test canonical IDs, a supported alias, a mocked unsupported alias, UTC, Kathmandu, and a half-hour zone with the focused data suite.
- [x] 2.2 Add immutable pre-normalized FR/EN search tokens and deterministic all-token ranking across identifiers, path components, alternative names, common cities, exemplar aliases, and territory labels; test case/accent normalization plus Lyon, London/Londres, Montreal/Montréal, country, and identifier queries.
- [x] 2.3 Implement the useful empty-query projection (current/remembered selection pinned, deterministic localized browse order) without logging or external access; test empty, whitespace-only, multiple-token, and no-result queries and assert the returned records retain exact identifiers.

## 3. Widen preferences and preserve manual memory

- [x] 3.1 Add `settings.lastManualTimezone` to the storage seam as environment-independent state and replace the curated parser with a total classified read that distinguishes system, available catalog ID, runtime-unavailable catalog ID, and corrupt input without mutating raw storage; run focused storage/prefs tests including every old curated value.
- [x] 3.2 Implement automatic-on, manual-restore, first-manual device seed, unavailable-memory fallback, and explicit selection transitions so only validated catalog/runtime choices update active and remembered keys; test all transitions, failed-write non-mutation, old-build/new-build downgrade recovery, and exact alias preservation.
- [x] 3.3 Keep `resolveTimezone`, `useDisplayZone`, and notification registration as the single effective seam with safe device/Paris fallback for invalid or unavailable intent; run focused hook, calendar-formatting, personal-event, and notification registration tests to prove consumers do not read the new keys independently.

## 4. Prove native chooser integration before full wiring

- [x] 4.1 Add a thin chooser route and root Stack registration using iOS `formSheet` with a tall detent/grabber and Android full-screen modal behavior; extend the exhaustive route-structure test and verify the existing `timecalendar-dev://timezone-settings` destination remains unchanged.
- [x] 4.2 Build a fixture-backed chooser shell with localized Close, one controlled `Stack.SearchBar`, conditional iOS 26 bottom `Stack.Toolbar.SearchBarSlot`, older iOS/iPad native header adaptation, Android native back, and exactly one inset-aware `FlatList`; add/extend Router native-boundary mocks and component tests for scroll ownership, inset ownership, search clear, keyboard dismissal, close/back/swipe, and no double navigation.
- [x] 4.3 Record `docs/react-native-migration/inbox/2026-09-21-worldwide-timezone-chooser-device-pass.md` as `(HUMAN: project owner)` evidence for early iPhone sheet/search/inset validation plus final iPhone/iPad/Android visual acceptance under D05; verify the note states that it is a release-owner check, not a repository merge gate or separate ticket.

## 5. Deliver automatic/manual settings and the catalog chooser

- [x] 5.1 Replace the old universal timezone picker with T01 native settings rows: “Use device time zone”, a noninteractive readable effective-zone row in automatic mode, and an exact saved/unavailable manual row that opens the chooser; update the existing screen tests for mode toggles, first seed, remembered restore, and deep-link rendering.
- [x] 5.2 Wire the chooser `FlatList` to localized catalog/search results with current, selected, unavailable, empty-query, and no-results states plus screen-reader selected/disabled semantics; test FR/EN labels, dark/theme propagation, large result virtualization, and query/filter updates without per-result native hosts.
- [x] 5.3 On result activation, revalidate catalog membership/runtime support, persist both keys, and issue exactly one `router.back()`; prove successful selection, rejected unavailable selection, Close, Android back, iOS swipe/unmount, keyboard dismissal, and search clear leave the required values/navigation intact.
- [x] 5.4 Refresh the chooser's `now` snapshot on route focus and foreground resume and render signed current offsets; use fake time/AppState tests to prove refresh plus UTC, Paris winter/summer, Kathmandu, and half-hour labels.
- [x] 5.5 Replace the ten hardcoded zone-label keys with localized mode, search, state, row, country/city fallback, availability, and accessibility strings in both catalogs; run the i18n key/parity proof and focused settings screen suites.

## 6. Prove unchanged time and server semantics

- [x] 6.1 Extend event/calendar/personal-event regression fixtures with a worldwide canonical ID and alias to prove event offsets use the event instant, timed cross-midnight projection remains zone-aware, and all-day dates remain floating; run the focused formatting, day-key, calendar, and personal-event suites.
- [x] 6.2 Extend notification tests to prove a worldwide exact identifier flows through the existing resolver/registration DTO while the fixed scheduling policy is untouched; run the focused notification localization/registration/runtime suites.
- [x] 6.3 Add a server validator compatibility table for representative selectable canonical, alias, UTC, Kathmandu, and half-hour identifiers without asserting universal mobile-OS support; run the focused `is-iana-timezone` server test.

## 7. Reconcile specifications and architecture documentation

- [x] 7.1 Revise ADR 035 in place to replace the curated closed-union/picker decision with exact-ID catalog validation, separate manual memory, non-destructive runtime fallback, and the approved D01/D02 native chooser while retaining one resolver, all-day, and push semantics; verify ADR status/history references remain coherent.
- [x] 7.2 Update the Architecture Book's navigation, storage, features, testing/current contract where affected and add a `CHANGELOG.md` entry; verify the pages describe current state, one scroll/navigation owner, CI proof, and environment-independent manual memory without implementation chronology.
- [x] 7.3 Document tzdb/CLDR package licenses, exact generated inputs, bounded runtime artifact, update/check commands, runtime-version caveat, and old-build downgrade behavior in the mobile documentation; verify every command/path against the implementation.
- [x] 7.4 Reconcile the curated-only `mobile-timezone-preference` OpenSpec requirement with this worldwide contract so future archiving cannot restore the old closed-union rule; run `openspec validate add-worldwide-native-timezone-search --strict` and validate the reconciled prior change if edited.

## 8. Local green and CI proof

- [x] 8.1 Run the focused generator, catalog/search, prefs/hooks, route, settings/chooser, calendar/event, notification, i18n, and server-validator tests after their final edits; record exact successful commands and ensure the committed Jest tests are discovered by the existing mobile/server CI jobs without changing workflow files.
- [ ] 8.2 From `mobile/`, run `npm run generate:timezone-catalog -- --check`, `npx tsc --noEmit`, `npm run lint`, `npm run react-doctor:changed`, and `npm test -- --coverage`; fix only failures caused by this change and record the exact tested commit.
- [ ] 8.3 Review the generated catalog and mobile bundle inputs for bounded CLDR imports, run the repository disclosure scan/preflight, and confirm the diff does not touch OpenAPI/generated clients, native/store/EAS configuration, migrations, deploy/CI, or legacy Flutter surfaces.
