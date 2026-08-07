## 1. Confirm platform contracts and baseline

- [x] 1.1 Read the exact Expo SDK 56 Native Tabs, Router Stack, and Expo UI documentation before application edits, per `mobile/AGENTS.md`; record any API constraint that changes this design.
- [ ] 1.2 Capture baseline iOS and Android screenshots plus VoiceOver/TalkBack order for the current Profile tab, and inventory every `/profile` caller, i18n key, test, Maestro anchor, and Architecture Book reference.
- [x] 1.3 Confirm the nested Settings Stack preserves Native Tabs selection on both platforms while allowing its redundant screen header to remain hidden.

## 2. Calendar-summary derivation

- [x] 2.1 Create `src/features/settings/data/summary.ts` with presentation-neutral summary facts derived from held calendars plus loaded state; persist no new state and do not read school-selection storage.
- [x] 2.2 Implement stable school deduplication: prefer non-empty `schoolId`, normalize fallback names, alias matching name-only rows to ID-backed schools, exclude metadata-free calendars from school count, and count every held calendar regardless of visibility or input order.
- [x] 2.3 Export the selector through the Settings data and feature barrels without exposing feature internals.
- [x] 2.4 Add selector tests for unresolved loading, empty data, one ID-backed school across several calendars, name-only fallback, ID/name aliasing, multiple schools, metadata-free and mixed sources, hidden calendars, and order independence; run the focused test immediately after editing it.

## 3. Settings grouped-list primitives and screen

- [x] 3.1 Create private `SettingsSection` and `SettingsRow` primitives using React Native core and theme tokens, with iOS inset-grouped and Android Material-style branches, system icons, inset separators, disclosure affordances, platform pressed feedback, and no new dependency.
- [x] 3.2 Make every row a full-width accessible link with translated label/hint, hidden decorative children, 44pt/48dp minimum target, wrapping dynamic type, and stable testID on an RN-core element.
- [x] 3.3 Implement the tappable calendar summary with unresolved, empty, one-school, multi-school, and unknown-school presentations, localized plural counts, and navigation to `/user-calendars`.
- [x] 3.4 Implement `SettingsScreen` with only the live initial destinations: Events (Personal events, Hidden events) and Preferences (Appearance & language, Notifications); omit duplicate Calendars, Add calendar, Activity, About, Feedback, and all disabled placeholders.
- [x] 3.5 Add `features/settings/ui` and top-level barrels, keep destination definitions UI-local and static, and ensure the feature follows lint import boundaries.
- [x] 3.6 Add screen tests through real theme/i18n providers covering localized group order, calendar-summary states, complete route wiring, absence of unshipped rows, link semantics, large copy, and iOS/Android visual-interaction branches; run the focused tests immediately after editing them.

## 4. Route and native-tab migration

- [x] 4.1 Add `src/app/(tabs)/settings/_layout.tsx` with a nested Stack and compact localized Settings title while preserving safe-area and selected-tab behavior.
- [x] 4.2 Add the thin `src/app/(tabs)/settings/index.tsx` re-export through `@/features/settings/ui`; put no screen logic or tests under `src/app/`.
- [x] 4.3 Change the static Native Tabs trigger from `profile` to `settings`, translate EN “Settings” / FR “Réglages”, and use the platform gear icon while preserving Home · Calendar · Settings order.
- [x] 4.4 Replace the old Profile tab screen with a temporary root `/profile` compatibility redirect to `/settings`, update root Stack registration if needed, and ensure no internal caller targets `/profile`.
- [x] 4.5 Update app-tabs and route-structure tests for trigger order, labels, icons, canonical route, and compatibility redirect; run the focused tests immediately after editing them.

## 5. Destination integration and localization

- [x] 5.1 Move the existing preference screen to `/appearance-settings`, label it Appearance & language / Apparence et langue, and update its deep link without changing its preference hooks.
- [x] 5.2 Route calendar management exclusively through the summary and retain Add/Import as the native header action inside `/user-calendars`; remove the redundant onboarding/add link from the old hub.
- [x] 5.3 Add complete bidirectional EN/FR keys for the Settings tab, section labels, rows, summary states/count plurals, and accessibility labels/hints; remove obsolete Profile-only and hero keys once no caller remains.
- [x] 5.4 Update affected Settings and user-calendars tests to assert the Settings entry contracts; run those tests after editing them.

## 6. Architecture and product documentation

- [x] 6.1 Write ADR 034 superseding ADR 025 only for the third-tab identity: Home · Calendar · Settings, rejected Profile identity, canonical route, compatibility window, and revisit conditions; index it in `decisions/README.md`.
- [x] 6.2 Update `navigation.md` with the nested Settings Stack, canonical/compatibility routes, and thin feature export; update `features.md` to add Settings ownership and replace all Profile navigation language.
- [ ] 6.3 Update any settings, calendar-source, or migration documentation that claims Profile is an entry point, describing the resulting Settings system rather than narrating the change history.
- [x] 6.4 Append the dated Architecture Book changelog entry required by migration-approach §7.

## 7. Automated verification

- [x] 7.1 Run `cd mobile && npx tsc --noEmit` and resolve every strict-type or typed-i18n parity error.
- [x] 7.2 Run `cd mobile && npm run lint` and resolve ESLint, custom boundary/a11y/i18n rules, and Prettier findings.
- [x] 7.3 Run `cd mobile && npm test -- --coverage`; keep Settings data above the 90% logic threshold, presentation above the global 70% floor, and the full suite green.
- [x] 7.4 Update or add a Maestro Settings flow that opens the tab, asserts the calendar summary and live groups, navigates to calendar management and Appearance & language, returns successfully, and never relies on a dead destination.

## 8. Native device proof and close-out

- [ ] 8.1 Verify iOS: native tab icon/label and selection, safe-area/content insets, pressed treatment, dark mode, VoiceOver traversal, accessibility text sizes, and zero/one/multiple-school fixtures.
- [ ] 8.2 Verify Android: Material tab icon/label and selection, header/scroll behavior, foreground ripple, dark mode, TalkBack traversal, large font/display scaling, and zero/one/multiple-school fixtures on a low-end emulator/device.
- [ ] 8.3 Confirm `/profile` redirects to the selected Settings tab and every canonical internal route/deep link still works after cold launch on both platforms.
- [x] 8.4 Complete the Definition of Done matrix for architecture, types, lint, tests, e2e, i18n, accessibility, native correctness, performance, observability/analytics N/A reasons, and documentation; record any manual-only evidence.
- [ ] 8.5 Re-run `openspec validate rework-mobile-settings-tab --strict` and mark the change ready for apply only when all proposal decisions and specification scenarios remain represented by tasks.
