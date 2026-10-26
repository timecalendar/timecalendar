# Tasks

All commands run in `mobile/` unless stated. Decisions are D1–D12 in `design.md`. Await every RNTL
14 helper (`render`, `fireEvent`); no fake timers; `usePlatform` from `@/test-support/platform` for
platform branches; mock the scheme through `@/hooks/use-color-scheme`; drive the font scale by
mocking `useWindowDimensions` (see `button-row.test.tsx`). Keep every existing `testID`. Do not
touch `src/components/chrome/` (another branch owns it). No code comments except a non-obvious
why. Docs describe the current state only.

## 1. Announcement hook and field-error hint

- [x] 1.1 In `src/hooks/use-error-announcement.ts` add the optional `key` option (D6): with a key,
      announce on mount and on key change only, reading the latest message from a ref updated in an
      effect; without a key, behavior is unchanged (chrome callers untouched). Create
      `src/hooks/use-error-announcement.test.ts`: iOS queued announcement on mount; re-announce on
      message change without key; no re-announce on message change under the same key; re-announce
      on key change; undefined/empty message never announces; Android silent unless `native`;
      Android `native` uses `announceForAccessibility`. Verify:
      `npx jest src/hooks/use-error-announcement.test.ts --coverage --collectCoverageFrom=src/hooks/use-error-announcement.ts`
      ≥ 90% lines and branches.
- [x] 1.2 Create `src/design/status/field-error-hint.ts` exporting `fieldErrorHint(error, hint?)`
      (D7) and `field-error-hint.test.ts` (error only, hint only, both → `"<error>. <hint>"`,
      neither → `undefined`, empty-string error treated as none). Verify: `npx jest src/design/status/field-error-hint.test.ts`.

## 2. `StatusView` primitive

- [x] 2.1 Add `event_busy` to `MATERIAL_GLYPHS` in `src/design/icon/icon-glyphs.ts` with the
      codepoint from expo-symbols' Material table. Verify: `npx jest src/design/icon` (the codepoint
      pin passes).
- [x] 2.2 Create `src/design/status/status-view.tsx` exporting `StatusView`, `StatusViewProps`,
      `StatusAction`, `StatusArtwork`, `StatusSymbol`, `StatusLayoutStyle` per D2–D6: discriminated
      union on `kind`; `screen` = `ScrollView` with `headerScrollProps(false)` and `flexGrow`
      centered content, `section` = `flexGrow` centered `View` with section padding, `inline` =
      leading content-sized `View`; spinner `textSecondary` in a hidden wrapper `View`
      (`${testID}-progress`); error glyph `Icon` 40 `scaling="fixed"` `error`; symbol `Icon` 40
      `fixed` `textSecondary` (`${testID}-symbol`); artwork `expo-image` decorative
      (`${testID}-artwork`), not rendered when `useIsAccessibilityTextSize()`; title
      `ThemedText type="sectionTitle"` (empty/error) or body text inside the `progressbar` element
      (loading, `accessibilityState={{ busy: true }}`, `accessibilityLabel` = title); caption
      secondary; actions `Button` `filled` / `text`, stacked; root `accessibilityLiveRegion="polite"`
      on Android; `useErrorAnnouncement(spoken, { key: announcementKey ?? kind })`; `style`
      flattened and merged last. Imports across family folders by `@/design/<folder>/<file>`
      (ADR 068). Verify: `npx tsc --noEmit`.
- [x] 2.3 Create `src/design/status/status-view.test.tsx`, `describe.each` over iOS and Android:
      each kind × presentation renders its container (a `ScrollView` only for `screen`), media and
      text order; heading role on empty/error titles, none on loading; loading element has role
      `progressbar`, name = title, `busy: true`; spinner, symbol, glyph and artwork hidden from
      assistive technology (`includeHiddenElements`); artwork absent at font scale 1.786 and 2.0,
      present at 1.0, and returns on a live drop; announcement once on mount (iOS
      `announceForAccessibilityWithOptions` with `title. caption`), not again on a title change
      under the same `announcementKey`, again on key change; Android live region present and no
      explicit announcement; retry press calls the handler once, busy retry exposes
      `{ disabled: true, busy: true }` and ignores presses, secondary is a text button; `style`
      merges last; `// @ts-expect-error` for a loading `action`, artwork + symbol together, an
      error `artwork`, and `style={{ backgroundColor: "red" }}`. Verify:
      `npx jest src/design/status/status-view.test.tsx --coverage --collectCoverageFrom=src/design/status/status-view.tsx`
      ≥ 90% lines and branches.
- [x] 2.4 In `jest.config.js` add `"src/design/status/status-view.tsx"` and
      `"src/design/status/field-error-hint.ts"` at `{ lines: 90, branches: 90 }` next to the button
      keys; update `jest.config.test.ts` if it pins the keys. Verify: `npx jest jest.config.test.ts`.

## 3. Error surfaces and the barrel

- [x] 3.1 In `src/design/status/error-surfaces.tsx`: delete `ErrorState` and `ErrorTextAction`;
      `ErrorNotice`'s `action` is a `StatusAction` rendered as `Button variant="text"` (`role` →
      `accessibilityRole`); delete `FieldError`'s `nativeID` prop; move the shared
      `StatusAction` type import from `status-view.tsx`. Update `error-surfaces.test.tsx` (remove
      `ErrorState`/`ErrorTextAction` cases, keep notice and field-error cases, notice action is a
      `Button`). Verify: `npx jest src/design/status`.
- [x] 3.2 Delete `src/design/status/empty-state.tsx`, `empty-state.test.tsx`,
      `empty-state.gallery.tsx`; rename `EmptyStateArtwork` to `StatusArtwork` in
      `empty-state-artwork.ts` (rename the file to `status-artwork.ts` with its test). In
      `src/design/index.ts` export `StatusView` and its types, `fieldErrorHint`, the artwork
      records, `ErrorNotice`, `FieldError`; drop `EmptyState`, `ErrorState`, `ErrorTextAction`,
      `ErrorAction`. Update `src/design/layout/keyboard-safe-action-layout.test.tsx` if it imports a
      removed name. Verify: `npx tsc --noEmit` lists only the call sites §5–§6 migrate.

## 4. Gallery fixtures and strings

- [x] 4.1 In `src/i18n/locales/en.json` and `fr.json` add `gallery.statusView.*` (meta title, one
      name per story, loading/empty/error titles and captions, action labels, the artwork-shown /
      artwork-hidden captions, section title) and remove `gallery.emptyState.*` and the
      `gallery.errorSurfaces.*` keys only the deleted state stories used. Verify: `npx jest src/i18n`
      (FR/EN parity).
- [x] 4.2 Create `src/design/status/status-view.gallery.tsx` per D10 (meta `status-view`, stories
      `LoadingScreen`, `LoadingSection`, `LoadingInline`, `EmptyScreen`, `EmptyScreenArtwork`,
      `EmptySection`, `EmptyInline`, `ErrorScreen`, `ErrorRetryBusy`, `ErrorSection`,
      `LongStrings`; `LongStrings` uses `gallery.stress.*` and captions the artwork branch from
      `useIsAccessibilityTextSize()`); testIDs `gallery-status-view-*`; press counter as in
      `error-surfaces.gallery.tsx`. Create `status-view.gallery.test.tsx` (retry and secondary
      increment the counter; the busy story ignores presses and exposes busy; long-strings caption
      flips at font scale 2.0). Verify: `npx jest src/design/status/status-view.gallery.test.tsx`.
- [x] 4.3 In `error-surfaces.gallery.tsx` drop `State`, `StateBusy` and the `ErrorState` in
      `LongStrings` (long-strings becomes a titled `ErrorNotice` with the stress copy and an action);
      the field-error story drops `aria-describedby`/`nativeID` and passes
      `accessibilityHint={fieldErrorHint(message)}` to its `TextInput`. Update
      `error-surfaces.gallery.test.tsx` (assert the input's hint carries the error). Verify:
      `npx jest src/design/status`.
- [x] 4.4 In `src/design/gallery/registry.ts` replace the `empty-state` module with `status-view`
      (same position). Update `src/features/developer/ui/gallery-index-screen.test.tsx` story ids
      (`empty-state--*`, `error-surfaces--state*` removed; `status-view--*` added). Verify:
      `npx jest src/design src/features/developer` (registry matrix: every story light/dark ×
      iOS/Android, role and label on every control, `known-a11y-violations.ts` unchanged; L10
      fixture-coverage contract passes).

## 5. Migrate the slice 3.3 call sites (D8)

- [x] 5.1 School selection: `school-picker-screen.tsx` → `StatusView` `section` for loading,
      error (`onboarding-school-error`, retry `onboarding-school-retry`), no-results
      (`announcementKey="noResults"`, `magnifyingglass`/`search`, missing-school secondary) and
      empty (`announcementKey="empty"`, `graduationcap`/`school`, missing-school secondary);
      `MissingSchoolAction` → `Button variant="text" size="small"` keeping `testID`, label and hint.
      Delete `list-status.tsx`, `status-symbol.tsx`, `status-symbol.test.tsx`.
      `school-group-picker-screen.tsx` → `StatusView` `section` loading, empty and error
      (`onboarding-group-error`, retry `onboarding-group-retry`). Update both screens' tests (status
      glyph on both platforms hidden from assistive technology, announcement once per kind, retry
      refetches). Remove `src/features/school-selection/ui/school-picker-screen.tsx` from
      `tools/eslint-rules/raw-button-allowlist.js` and set `RAW_BUTTON_ALLOWLIST_CEILING` to 15.
      Verify: `npx jest src/features/school-selection tools/eslint-rules`.
- [x] 5.2 Export guides: `guide-status.tsx` → `RootPage lane="readable"` + `StatusView` `screen`
      loading (`exportGuide.loading`) and error (retry `export-guide-retry` busy, Back
      `export-guide-back` secondary); drop the `ScrollView` and row styles. Verify:
      `npx jest src/features/export-guides`.
- [x] 5.3 Calendar sources: `import-progress-view.tsx` → `RootPage` + `StatusView` `screen`
      loading (default testID `calendar-import-progress` on the `RootPage`);
      `calendar-import-result-screen.tsx` failure and `qr-import-views.tsx` failure → `StatusView`
      `screen` error with their testIDs (`calendar-import-result-retry`,
      `calendar-import-result-continue`, `qr-scan-failure`, `qr-scan-retry`,
      `qr-scan-change-method`), `ScrollView` wrappers dropped; `user-calendars-screen.tsx` empty →
      non-function `RootPage` child `StatusView` `screen` (`user-calendars-empty`), still gated on
      `loaded`; `ical-url-screen.tsx` notice action `role` → `accessibilityRole`. Verify:
      `npx jest src/features/calendar-sources`.
- [x] 5.4 Event details: `event-details-status.tsx` → `StatusView` `screen` loading
      (`eventDetails.loading`) and not-found `empty` with `calendar.badge.exclamationmark` /
      `event_busy`; keep the `event-details-status-responsive-*` testIDs. Verify:
      `npx jest src/features/calendar/ui/event-details`.
- [x] 5.5 Timezone chooser: `ListEmptyComponent` → `StatusView` `section` `empty` with
      `magnifyingglass`/`search`, `announcementKey="noResults"`, `testID="timezone-no-results"`.
      Update its test (title is a heading; no re-announcement while typing). Verify:
      `npx jest src/features/settings`.

## 6. Mechanical renames outside 3.3 and field-error hints

- [x] 6.1 Rename to `StatusView` (D8, testIDs kept): Home `today-section.tsx` and
      `upcoming-section.tsx` (`inline`), `activity-screen.tsx` empty (`section`) and empty-error
      (`screen`, wrapper dropped), `personal-events-list.tsx` (`section`), `hidden-events-screen.tsx`
      (`section`, artwork kept), `environment-runtime-gate.tsx` error (`section` inside its recovery
      `ScrollView`). Spinners in Activity and the environment gate stay. Verify:
      `npx jest src/features/home src/features/activity src/features/personal-events src/features/hidden-events src/features/environment`.
- [x] 6.2 Pass `accessibilityHint={fieldErrorHint(error, existingHint)}` on every `TextInput` that
      renders a `FieldError`: `feedback-screen.tsx` (email, message),
      `personal-event-fields.tsx` (title), `ical-url-screen.tsx`, `institution-name-screen.tsx`,
      `programme-screen.tsx`. Add one assertion per screen test that the field's hint carries the
      shown error and loses it once fixed. Verify:
      `npx jest src/features/feedback src/features/personal-events src/features/calendar-sources src/features/onboarding`.
- [x] 6.3 `grep -rn "EmptyState\|ErrorState\|ErrorTextAction\|ListStatus\|StatusSymbol\|GuideLoading\|aria-describedby" src`
      returns nothing (except `StatusView`'s own symbol type); confirm every migrated testID still
      appears in `src/` and run `npx jest e2e/maestro-selectors.test.ts`. Verify: both clean.

## 7. Lint (Principle 1)

- [x] 7.1 Create `tools/eslint-rules/no-ad-hoc-status.js` (D9), register it in
      `tools/eslint-rules/index.js`, and `no-ad-hoc-status.test.js` (RuleTester, TSX parser).
      Invalid: `import { ActivityIndicator } from "react-native"`; aliased import;
      `ListEmptyComponent={<View/>}`; `ListEmptyComponent={cond ? <StatusView/> : <ThemedText/>}`;
      `ListEmptyComponent={EmptyThing}`. Valid: `ListEmptyComponent={<StatusView/>}`; a conditional
      of two `StatusView`s; `cond ? <StatusView/> : null`; `ActivityIndicator` from another module.
      Verify: `npx jest tools/eslint-rules/no-ad-hoc-status.test.js`.
- [x] 7.2 Add block `timecalendar/ad-hoc-status` to `eslint.config.js` (D9 files/ignores) and
      create `tools/eslint-rules/ad-hoc-status-allowlist.js`: run lint with an empty list after
      §5–§6, list every reported file sorted, each with its removing slice (expected: Activity 5.4,
      environment gate 3.5, dev import 5.7; any other hit means a §5–§6 migration is incomplete).
      Create `ad-hoc-status-allowlist.test.js` mirroring `raw-button-allowlist.test.js` with
      `AD_HOC_STATUS_ALLOWLIST_CEILING` = the generated length. Inject-and-revert: add a migrated
      file to the list (test fails naming it stale); add an `ActivityIndicator` import to
      `src/features/settings/ui/timezone-chooser-screen.tsx` (`npm run lint` fails); revert both.
      Verify: `npx jest tools/eslint-rules` and `npm run lint`.
- [x] 7.3 Add `JSXAttribute[name.name='aria-describedby']` with the D9 message to the shared
      `restrictedSyntax` list in `eslint.config.js`. Inject-and-revert in a feature file and a test
      file: `npm run lint` fails in both; revert. Verify: `npm run lint`.

## 8. ADR, Architecture Book, inbox

- [x] 8.1 Write `docs/mobile/architecture-book/decisions/069-status-view.md` from `TEMPLATE.md`
      per D12 (re-check open PRs and `decisions/` for a reserved 069 first); add its row to
      `decisions/README.md`.
- [x] 8.2 `theming.md`: new section "Status — `StatusView` (`src/design/status/`)" after Buttons:
      kinds, presentations table (screen scrolls, section/inline do not; `screen` never inside a
      list or scroll view), media rule and spinner color, artwork off at accessibility sizes,
      actions, layout-only style, gates (tests, coverage tier, `local/no-ad-hoc-status`, gallery
      stories), link to ADR 069. Rewrite any `EmptyState`/`ErrorState` mention as the current
      `StatusView` state.
- [x] 8.3 `accessibility.md` → Accessible async status: status semantics (heading titles, loading
      `progressbar` + busy, announcement once per appearance and key, Android live region, iOS
      announcer), field errors through `fieldErrorHint` and why `aria-describedby` is banned; Proof
      in CI names `status-view.test.tsx`, `use-error-announcement.test.ts` and
      `field-error-hint.test.ts`.
- [x] 8.4 `lint-format.md` rule inventory: `local/no-ad-hoc-status` with its allowlist, ceiling
      test and what it cannot see (plain-text empties outside list slots); the `aria-describedby`
      syntax ban; raw-button ceiling 15. `testing.md`: the two coverage tiers and the allowlist
      contract test. `features.md` → Design system gallery: `status-view` row with its story ids,
      `empty-state` row removed, `error-surfaces` stories updated; feature entries for School
      selection, Export guides, Calendar sources, Event details and Settings timezone name
      `StatusView` where they describe status UI. `architecture.md` only if its structure bullets
      name `EmptyState` or `ErrorState`.
- [x] 8.5 `CHANGELOG.md`: `## 2026-10-26 — StatusView` at the top (primitive, removal of
      `EmptyState`/`ErrorState`/`ErrorTextAction`, screen scroll and AX artwork, announcement key,
      field-error hint and `aria-describedby` ban, `local/no-ad-hoc-status` ratchet, gallery, ADR
      069). Verify: `npx prettier --check` on the changed docs; relative links resolve.
- [x] 8.6 In `docs/react-native-migration/inbox/2026-10-25-mobile-gallery-fixtures-findings.md`
      remove the `EmptyState` scroll and `FieldError` description findings (fixed here, re-check
      story `status-view--long-strings` and `error-surfaces--field-error`); leave the other items.
      Keep `docs/react-native-migration/inbox/2026-10-26-mobile-ds-status-view-screen-reader-pass.md`
      (written by the planner) accurate to the final story ids and screens. Verify: both files list
      only open items.

## 9. Local verification

- [x] 9.1 `npx tsc --noEmit` passes.
- [x] 9.2 `npm run lint` passes with zero warnings.
- [x] 9.3 `npm test -- --coverage` passes, including the `status-view.tsx` and
      `field-error-hint.ts` 90% tiers, `src/hooks/**` 90%, the registry matrix, the L10 fixture
      contract, the import-graph contract and both allowlist tests.
- [x] 9.4 `npm run test:timezones` passes (or the CI `test-mobile-timezones` job is green).
- [x] 9.5 `git diff --stat origin/main`: no `package.json`, `app.config.ts`, `eas.json`, native,
      route or `src/components/chrome/` change.

## 10. Device pass and CI

Gallery story ids for the conductor (`timecalendar-dev://developer/gallery/<id>`):
`status-view--loading-screen`, `status-view--loading-section`, `status-view--loading-inline`,
`status-view--empty-screen`, `status-view--empty-screen-artwork`, `status-view--empty-section`,
`status-view--empty-inline`, `status-view--error-screen`, `status-view--error-retry-busy`,
`status-view--error-section`, `status-view--long-strings`, `error-surfaces--notice`,
`error-surfaces--notice-compact`, `error-surfaces--field-error`, `error-surfaces--long-strings`.
Check `status-view--long-strings` at `accessibility-extra-extra-extra-large` (iOS) and font scale
2.0 (Android): starts below the header, scrolls to the last action, no artwork.

- [x] 10.1 iOS simulator pass (conductor): the stories above in light and dark at the default size
      and AX5 (reopen after a size change); migrated screens: school picker (loading, no results,
      error), group picker, export guide loading/error, import progress and failure, QR failure,
      user calendars empty, event details loading/not found, timezone no results. Record findings
      in the PR; fix defects in this branch.
- [ ] 10.2 Android pass (conductor, Windows host via `ssh pc`, never on the Mac): same stories and
      screens, light/dark, font scale 1.0 and 2.0. Record findings in the PR. Not run: `ssh pc`
      was unreachable and no Android device was attached; carried in the screen-reader inbox note.
- [ ] 10.3 CI green on the PR (`test-mobile` with coverage, `test-mobile-timezones`, lint).
- [ ] 10.4 Real VoiceOver and TalkBack pass on status announcements, loading busy, and field-error
      hints (HUMAN: see inbox/2026-10-26-mobile-ds-status-view-screen-reader-pass.md)
