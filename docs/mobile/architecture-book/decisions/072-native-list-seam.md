# 072 — The native list seam is `NativeList*`, with no feature-owned row adapters

## Status

Accepted.

## Context

The chrome seam that composes SwiftUI `Form`/`Section` and Material `LazyColumn`/`ListItem`
([060](./060-platform-native-settings-composition.md)) draws every short grouped list in the app:
Settings, Notifications, Calendar sources, About, the developer page and the gallery. Nothing in
it is settings-specific, yet its surface carried a settings name. A second row API also lived in
the Settings feature, and only other features (About, Environment) imported it, so ownership was
inverted and every new screen had two ways to draw the same row (design-system audit,
`docs/mobile/design-system-audit/assessment.md` §4).

## Decision

- **Names.** The seam is `src/components/chrome/native-list*.{ts,tsx}`, exported from
  `@/components/chrome`. The host is the list itself, `NativeList`. The rest share the prefix:
  `NativeListSection`, `NativeListRow`, `NativeListSwitchRow`, `NativeListChoiceRow`,
  `NativeListRadioDialog`, `NativeListAlert`, `NativeListFloatingAction`, `NativeListHeader`,
  `NativeListNumericEditor` and the `NativeListIcon` type. The private placement context is
  `NativeListContext` with its guard `useAssertOutsideNativeList`. Gallery ids are `native-list`
  and `native-list-numeric-editor`.
- **No aliases.** Every call site moved in one change, so the old names have no transition window
  and the barrel carries no alias. Two names for every control would need their own ratchet and a
  later deletion.
- **One list API.** Features render the seam directly. No feature owns a row or section wrapper
  that another feature imports. About types its rows as `NativeListRowProps`; the environment
  feature's `EnvironmentSettingsRow` is a product row that renders `NativeListRow`.
- **Gate.** `local/no-retired-list-names` (`mobile/tools/eslint-rules/`) runs over
  `src/**/*.{ts,tsx}`, tests included, with no allowlist. It reports identifiers containing
  `NativeSettings`, identifiers starting with `SwiftSettings` or `ComposeSettings`, the exact
  identifiers `SettingsRow`, `SettingsRowProps`, `SettingsSection` and `SettingsSectionProps`,
  string and template literals containing `native-settings` or `nativeSettings`, and a file whose
  basename starts with `native-settings` or is `settings-row` / `settings-section`
  ([lint-format.md](../lint-format.md) → Native list names).

Rejected:

- Aliases with a deprecation lint, or without one: two APIs for no consumer that needs the time.
- Moving the adapters to `components/`: a second row API with a discriminated union that no
  other screen uses. The shared row vocabulary is slice 3.6's `ListRow`.
- `NativeListHost` for the host: "host" is an Expo UI implementation word.
- A grep contract test: no editor feedback, and lint is where naming rules live.

## Consequences

- The row contract stays flat: About's rows lose the adapter's compile-time "hint present" check,
  and `about-screen.test.tsx` asserts the hints instead.
- Slice 3.6 builds `ListRow` / `ListSection` / `Separator` against `NativeListRow`'s geometry in
  the gallery.
- The rule cannot see JSON locale files (an unused `gallery.nativeSettings` key), Maestro YAML,
  Markdown or computed strings (`"native-" + "settings"`). Review covers those.
- Related: 073 (Android row semantics, shared geometry).

## Revisit if

- A second composed native list technology appears (a native list that is not Expo UI).
- Slice 3.6's `ListRow` makes the seam's row redundant.
