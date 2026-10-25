## Why

The mobile design-system audit reported six defects that break existing Architecture Book rules or
leave a feature unusable on one platform: Android personal events cannot set a time, small brand-pink
labels fail WCAG AA in light mode, the school-picker status glyph is blank on Android, the developer
environment picker drops a button on Android, VoiceOver reads "(tabs)" as the back-button label, and
calendar header items use brand pink. Each one was checked in code before planning. All six are real.
Item 1 is worse than the audit says (see below). This change fixes them and does nothing else.

## What Changes

- **Android date and time (verified, wider than reported).** `DateTimeField` on Android opens only a
  `mode="date"` dialog. The `@expo/ui` Compose date dialog returns `DatePickerState.selectedDateMillis`,
  which is **UTC midnight** of the chosen day. The current code stores that instant directly, so picking
  a date on Android also overwrites the event's time of day. The fix is a two-step flow: a date dialog,
  then a `mode="time"` dialog through the same `@/components/chrome` `DateTimePicker`. Date and time
  commit together as one display-zone wall clock. Cancelling either step leaves the value unchanged.
  iOS does not change.
- **Small brand-label contrast (verified).** `#E91E63` on `#FFFFFF` is 4.35:1, below the 4.5:1 floor for
  body text. Seven `ThemedText type="smallBold" themeColor="primary"` call sites switch to the existing
  `actionText` token (`#C2185B` light, 5.87:1; dark is unchanged at `#FF4081`). The personal-event
  Delete label switches to `destructive`. `school-logo.tsx` keeps `primary`: it is a large monogram
  glyph, not small text.
- **School status glyph on Android (verified; mechanism corrected).** `StatusSymbol` returns `null`
  off iOS. The codebase already renders Android Material Symbols outside the chrome seam through
  `expo-symbols` `SymbolView name={{ ios, android }}` (`error-surfaces.tsx`,
  `checklist-progress-indicator.tsx`, `calendar-screen-actions.tsx`). The fix uses that path with the
  Material Symbols `search` and `school`. That path needs no new dependency. The settings
  vector-drawable registry stays seam-internal. The glyph stays decorative and hidden from assistive
  tech, and the adjacent `ListStatus` text still carries the meaning.
- **Environment picker on Android (verified for the `development` capability).** React Native's Android
  `Alert` keeps only `buttons.slice(0, 3)` and is not cancelable by default. With `development`
  (Local, Preproduction, Production + Cancel), Cancel is silently dropped, so the only way out is to
  pick an environment. On Android the selector becomes the chrome `NativeSettingsRadioDialog`. iOS
  keeps its vertical `Alert`: every button is reachable there, and the defect is Android-only. The
  production gate, the no-op for re-selecting the current environment, single-flight switching and the
  destructive confirmation do not change.
- **VoiceOver back label (verified; cause confirmed).** react-native-screens resolves a blank back title
  to the previous item's title. The `(tabs)` screen has no `title`, so `getHeaderTitle` falls back to the
  route name `"(tabs)"`. The `(tabs)` registration gets `title: t("common.back")` ("Back" / "Retour").
  Every root sibling pushed from a tab then has a localized accessible back label, and the minimal
  chevron still shows no text.
- **Calendar header tint (verified, both sites).** `HeaderIconAction` tints its `SymbolView` with
  `theme.primary`, and the view-menu pill chevron uses `borderColor: theme.primary`. Both switch to
  `theme.text`, per `navigation.md` / `theming.md`. The Android FAB fill keeps `primary`.
- Tests are added or updated for each fix. Owner device checks (Android behavior and VoiceOver) are
  filed in the migration inbox.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-personal-events-ui`: on Android, date and time are both settable through a two-step
  cancel-safe native dialog flow that commits in the display zone. The Delete action labels in
  `destructive`.
- `mobile-a11y`: small brand-colored text labels use the AA `actionText` tone, never `primary`.
- `mobile-school-selection`: the empty and no-results status glyph renders on both platforms, stays
  decorative, and conveys no meaning that the text does not.
- `mobile-backend-environments`: every allowed environment choice and a cancel path are reachable on
  both platforms.
- `mobile-root-page-primitives`: the `(tabs)` anchor exposes a localized accessible back label, never
  `(tabs)`.
- `mobile-calendar-timeline`: Calendar header items take the `text` label color.

## Impact

- Code: `mobile/src/features/personal-events/ui/{date-time-field,personal-event-actions}.tsx`; the seven
  brand-label call sites under `features/{event-checklists,export-guides,hidden-events,home,onboarding}`;
  `features/school-selection/ui/status-symbol.tsx`;
  `features/environment/ui/environment-settings-control.tsx`;
  `features/calendar/ui/calendar-screen/{calendar-screen-actions,calendar-view-menu}.tsx`;
  `src/app/_layout.tsx`; colocated tests, including a file-local DateTimePicker mock in
  `date-time-field.test.tsx`. The suite-wide `jest/setup-expo-ui.ts` mock does not change.
- No new dependency, token, primitive, route, i18n key (`common.back` exists), lint rule or native
  configuration. No change to OpenAPI, the generated client, the server or the Flutter `app/`.
- Book: `navigation.md` (the `(tabs)` accessible back label) and `features.md` (the Android
  two-step date/time field), with a dated `CHANGELOG.md` entry. `theming.md` already states the
  pink-text and header-tint rules, so these fixes only bring the code into line.
- Out of scope: the agenda tile color rail, TagBubble, the paging spike, type sizes, new components and
  new lint rules.
