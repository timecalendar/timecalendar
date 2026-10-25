## Why

The Android device pass of the merged design-system PRs (#479 defect fixes, #480 tokens and lint,
#481 platform type ramp) ran on a Pixel 10 API 36 emulator and found five defects. One is severe:
the developer environment picker leaves an orphaned Compose dialog window that blocks the whole
app, even across a JS reload, until the app is force-stopped. The other four are accessibility and
visual defects on screens the design-system work already touched. This change fixes the five, and
it encodes the dialog-placement constraint so the severe one cannot come back. It does nothing
else.

## What Changes

- **Environment picker orphaned dialog (severe).** `EnvironmentSettingsControl` renders its
  `NativeSettingsRadioDialog` as a sibling of its row. That puts the dialog's own Compose host
  inside the `NativeSettingsHost` LazyColumn of the page that mounts the control, the developer
  page (`/developer`). Every other radio dialog in the app renders
  after `</NativeSettingsHost>` and works. The control is split into a selector hook plus a row
  and a dialog. `developer-screen.tsx` places the row in its backend section and the dialog
  after `</NativeSettingsHost>`, next to the token `NativeTextEntryDialog`. The lint ban that keeps
  the environment switch on the developer page names the three new exports. The selection, confirmation, single-flight and production-gate
  behavior does not change.
- **Placement invariant (R-1).** `NativeSettingsHost` provides a context. The standalone
  Compose-dialog primitives (`NativeSettingsRadioDialog`, `NativeSettingsNumericEditor`,
  `NativeTextEntryDialog`) read that context and throw a descriptive error when they render inside
  a host. Unit tests prove the throw. The rule is recorded in `theming.md` and links the test.
- **Home populated section titles are headings.** The populated "Up next" and "Today" titles use
  `ThemedText type="sectionTitle"`. The local 20/25/700 style is removed, so each title gets the
  header role and the same ramp step that the empty state's `EmptyState` title already uses.
- **Android `DateTimeField` announces its value.** The Android field's accessible label combines
  the field label and the formatted value ("Starts, Mon 26 Oct 10:00"), through a new FR/EN key.
  On Android a `contentDescription` replaces the child text, so the value was never announced.
- **School picker search text in dark mode.** The uncommitted `textColor: theme.text` in
  `headerSearchBarOptions` is kept, and a test now asserts it.
- **School picker error state inset.** The full-bleed school list's `ErrorState` gets the same
  `Spacing.four` horizontal and `Spacing.five` vertical inset as `ListStatus`. The group picker
  already gets an inset from its standard lane gutter and does not change.
- **Device-pass record.** A dated inbox note records the per-check results and the out-of-scope
  findings: SymbolView clipping at 2x, the 24h field format, AppCompat `Alert` styling, the event
  details dot alignment, multi-day week rendering, the TalkBack binding limit and the type-ramp
  verdict.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-settings-hub`: standalone native dialogs never render inside a native settings host.
- `mobile-developer-page`: the developer page's environment selector dismisses cleanly without
  leaving a window behind, and only the developer feature mounts the selector.
- `mobile-home`: populated Home section titles are headings on the same ramp step as their empty
  state.
- `mobile-personal-events-ui`: the Android date/time field's accessible name includes its current
  value.
- `mobile-school-selection`: the search query is legible in both schemes, and the load-failure
  state is inset from the screen edges.

## Impact

- Code: `mobile/src/components/chrome/{native-settings,native-settings-numeric-editor,native-text-entry-dialog}.tsx`;
  `mobile/src/features/environment/ui/*` (selector hook, row, dialog, barrel);
  `mobile/src/features/developer/ui/developer-screen.tsx`; `mobile/eslint.config.js`
  (`banDeveloperTools` names the selector exports);
  `mobile/src/features/home/ui/home-screen/{upcoming-section,today-section}.tsx`;
  `mobile/src/features/personal-events/ui/date-time-field.tsx`;
  `mobile/src/features/school-selection/ui/school-picker-screen.tsx`; FR/EN catalogs (one key);
  colocated tests.
- No new dependency, token, route, lint rule, native configuration or ADR. Nothing changes in
  OpenAPI, the generated client, the server or the Flutter `app/`.
- Book: `theming.md` (dialog placement rule), `features.md` (environment selector placement,
  Android date field label), `navigation.md` and `lint-format.md` (the selector exports), `accessibility.md` (Home section headings, Android field label), and
  a dated `CHANGELOG.md` entry.
- Out of scope, and recorded in the inbox note: the expo-symbols Android glyph clipping and icon
  scaling policy, the 12/24h field format, Android `Alert` styling, the event-details dot
  alignment and multi-day week rendering.
