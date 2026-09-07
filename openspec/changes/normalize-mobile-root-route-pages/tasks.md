## 1. Exhaustive route inventory and nested Stack chrome

- [ ] 1.1 Extend `mobile/src/components/settings-route-structure.test.ts` (or a narrowly named replacement beside it) to recursively inventory every top-level route and every `mobile/src/app/onboarding/` child, compare discovered files/groups with explicit Stack registrations, and assert the exact visible-header versus exception sets from the specs; run the focused route-structure suite and confirm an unregistered fixture/name would fail.
- [ ] 1.2 Configure `mobile/src/app/onboarding/_layout.tsx` with the existing theme-backed `buildCompactRootScreenOptions`, keep the root onboarding container headerless, explicitly register every nested child, and mark only `index` headerless; prove the provider still wraps the nested Stack and no `@react-navigation/*` import appears.
- [ ] 1.3 Keep root `_layout.tsx` classification and presentation behavior intact while strengthening assertions for compact titles, `headerLargeTitle: false`, minimal back display, root exception registration, changelog sheet presentation, and absence of route-group back labels; run the compact-options and route-structure suites.

## 2. Onboarding and import-journey adoption

- [ ] 2.1 Normalize School and Programme to display their existing localized titles in compact native chrome, remove only the duplicated content route headings, and use caption-only `PageIntro`/shared page rhythm while preserving School search, list insets, loading/error/no-results behavior, calendar-management dismiss actions, and Programme Skip/keyboard/footer behavior; extend both screen suites across iOS and Android options.
- [ ] 2.2 Give Institution name, Connect, and Manual import feature-owned localized `Stack.Screen` titles; adopt `RootPage lane="readable"` plus caption-only `PageIntro`, remove repeated oversized titles, preserve the import draft, navigation, field/control order, keyboard owner, and selectors, and run their focused component suites.
- [ ] 2.3 Give iCal URL and the retained Groups route localized compact titles and shared readable/standard page frames without changing validation, retry/reporting, add-calendar completion, group loading/error/tree/confirm behavior, route parameters, or selectors; add focused title/intro/frame/state assertions and run both suites.
- [ ] 2.4 Give every QR permission/import phase one feature-owned localized compact title; use shared readable page framing for permission/status content while keeping the camera/viewfinder full-bleed below the header, and verify permission, scanning, importing, failure recovery, manual-URL navigation, accessibility labels, and existing `qr-*` selectors in the focused QR suites.
- [ ] 2.5 Run the onboarding route/screen tests together and confirm `onboarding/index` remains the sole nested headerless branded surface, the import-draft provider lifetime and welcome pager are unchanged, and current deep-link paths still resolve in static route assertions.

## 3. Settings preference destinations

- [ ] 3.1 Replace the outer `ThemedView`/`SafeAreaView`/`AdaptiveContent` frame in Appearance & language with one readable `RootPage`, retain the localized Stack title and both native pickers/selectors, remove duplicated top padding, and extend/run the focused settings screen suite.
- [ ] 3.2 Adopt the same readable `RootPage` contract in Timezone while retaining all 11 typed picker options, immediate persistence, localized title, and picker selector behavior; extend/run the timezone screen suite.
- [ ] 3.3 Adopt the same readable `RootPage` contract in Notifications while retaining frequency, day stepper, active switch, retry state, platform targets, localized title, and all selectors; extend/run the notification settings suite for ordinary and error branches.

## 4. Root content, form, and history destinations

- [ ] 4.1 Refactor About onto a standard `RootPage` while retaining its existing `ScrollView`, nested readable prose lane, grouped actions, link-error live region, platform spacing, localized native title, and every `about-*` selector; add/run focused phone/tablet and failure assertions without changing About prose gutters beyond shared frame adoption.
- [ ] 4.2 Refactor Feedback onto a readable `RootPage` with caption-only `PageIntro`, remove the duplicate in-content Feedback title, and preserve `KeyboardAvoidingView`, the sole `ScrollView`, focus traversal, validation/pending/success/failure behavior, route parameters, privacy boundaries, and selectors; extend/run the focused feedback suite.
- [ ] 4.3 Refactor shared changelog content onto a readable `RootPage` while retaining one `ScrollView`, all releases, localized history/sheet titles, sheet Close/Continue actions, version acknowledgment, and iOS form-sheet versus Android full-screen-modal presentation; extend/run the changelog content/screen suites.

## 5. Personal events and event details

- [ ] 5.1 Refactor the standalone Personal events list onto `RootPage lane="standard"`; replace the ad hoc empty sentence with a text-only screen `EmptyState`, keep the Add action and `FlatList` as the sole list owner, and preserve reactive rows, date formatting, create/edit links, accessibility labels/hints, and all `personal-event-*` selectors in its focused tests.
- [ ] 5.2 Integrate the personal-event form screen's outer surface/safe-area ownership with readable `RootPage` without adding a second measured lane or scroller; preserve `KeyboardSafeActionLayout`, native pickers, field/action order, CRUD/error/confirmation behavior, create/edit titles, and selectors, and run the focused form/editor suites on both platform branches.
- [ ] 5.3 Move resolved, loading, and not-found Event details branches under the same readable `RootPage` frame; retain the existing event-specific content heading, header actions, write-error notice, one `ScrollView`, route `uid`, action routing, and status live regions, and extend/run event-details tests for all states and platform actions.

## 6. Collection and state owners

- [ ] 6.1 Refactor User calendars onto `RootPage lane="standard"` using render-function lane metrics where necessary; use the shared text-only screen `EmptyState` only after the loaded gate, preserve the `FlatList`, intro caption, iOS header add item, Android FAB/insets, rename/delete/visibility actions, error notice, and every selector, and run its focused suite across loading, empty, error, populated, iOS, and Android cases.
- [ ] 6.2 Audit the already-adopted Activity and Hidden events screens against the final inventory: confirm their compact localized headers, `RootPage` standard lanes, illustrated `EmptyState`s, list/scroll owners, refresh/pagination/error behavior, and selectors remain unchanged; add only missing regression assertions and run both focused suites.
- [ ] 6.3 Add a focused cross-screen state-rhythm proof (or equivalent assertions in owning suites) that loading, empty, error, and populated branches share the same page owner below native chrome and do not add top-safe-area padding or an unexplained blank band.

## 7. Localization, accessibility, and Architecture Book

- [ ] 7.1 Add or reuse typed EN/FR keys for every newly visible onboarding/import header title and caption, remove only keys proven unused, and run the i18n parity/type tests; verify no user-facing or accessibility literal is introduced.
- [ ] 7.2 Update `docs/mobile/architecture-book/navigation.md`, `theming.md`, `accessibility.md`, `testing.md`, applicable `features.md` entries, and `CHANGELOG.md` to describe the fully adopted ADR 054 contract, exhaustive nested inventory, title/caption hierarchy, and content-owner preservation; do not add a new ADR unless implementation uncovers a genuinely new costly-to-reverse decision.
- [ ] 7.3 Add a dated `docs/react-native-migration/inbox/` note tagged `(HUMAN: …)` for iOS/Android compact headers and chevron backs, onboarding Search/Skip/dismiss behavior, sheet/camera presentation, light/dark rhythm, Dynamic Type/keyboard reachability, VoiceOver/TalkBack focus order, and touch targets; mark it non-blocking and do not claim device execution on this host.

## 8. Local-green and CI proof

- [ ] 8.1 Run focused Jest suites for route structure, compact chrome, RootPage/PageIntro/EmptyState, onboarding/import, settings destinations, About, Feedback, changelog, personal events, event details, User calendars, Activity, and Hidden events; record commands and passing counts in the handoff.
- [ ] 8.2 From `mobile/`, run `npx tsc --noEmit`, `npm run lint`, and `npm run react-doctor:changed`; fix every finding without weakening types, lint rules, test assertions, or the changed-code gate.
- [ ] 8.3 From `mobile/`, run `npm test -- --coverage`; the exhaustive static route inventory and focused consumer assertions are the CI proof tests for this change, and configured 90% logic/70% global thresholds SHALL remain unchanged.
- [ ] 8.4 Inspect the affected Maestro flows and run the static selector guard/harness proof used by CI; confirm deep links, route parameters, native header action selectors, Feedback, onboarding, Activity, Hidden events, User calendars, Personal events, and Event details selectors still match without claiming local device execution.
- [ ] 8.5 Review the final diff and confirm the Architecture Book is the only sensitive surface, route files remain thin, all listed exceptions are explicit, and there is no API/generated client, server/schema, calendar row/rename, primary-button redesign, Home spacing, About prose-gutter redesign, native/store/EAS config, dependency, deploy/CI, secret, new destination, or legacy Flutter change.
