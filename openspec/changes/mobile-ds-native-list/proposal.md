# Proposal

## Why

The design-system audit (`docs/mobile/design-system-audit/assessment.md` §4 and "Ambiguities to
settle"; `design-system-proposal.md` §2) found two defects in the native list seam. First, its
public surface is named `NativeSettings*` although nothing in it is settings-specific: eleven
screens across Settings, Notifications, Calendar sources, About, the developer page and the gallery
use it for any short grouped list. Second, a second row API, `SettingsRow` / `SettingsSection`
(`mobile/src/features/settings/ui/`), lives inside the Settings feature, and only *other* features
(About, Environment) consume it. Ownership is inverted, and every new screen has two ways to draw
the same row.

Roadmap slice 3.5 (`migration-roadmap.md`, phase 3) renames the seam to `NativeList*`, moves About
and Environment onto it, and deletes the adapters. Slice 3.6 (`ListRow` / `ListSection` /
`Separator`) is matched to this seam's geometry in the gallery side by side, so the seam needs its
final name before 3.6 starts.

## What Changes

- **Rename the seam's public surface to `NativeList*`** (full map in `design.md` D1). Host
  `NativeSettingsHost` becomes `NativeList`, and `NativeSettingsSection` / `Row` / `SwitchRow` /
  `ChoiceRow` / `RadioDialog` / `Alert` / `FloatingAction` / `Header` / `NumericEditor` and the
  `NativeSettingsIcon` type become `NativeList…`. The private context and its guard hook become
  `NativeListContext` / `useAssertOutsideNativeList`, and the private `Swift…` / `Compose…`
  helpers become `SwiftList…` / `ComposeList…`. The contract stays as it is: props, rendering,
  geometry, accessibility, and every consumer-supplied testID are unchanged.
- **Rename the files** `src/components/chrome/native-settings*.{ts,tsx}` (runtime, tests,
  fixtures, fixture tests) to `native-list*` with `git mv`. `native-settings-host-context.ts`
  becomes `native-list-context.ts`.
- **Rename every call site in one change, with no transitional aliases** (D2). This covers
  Settings, Notifications, Calendar sources, About, the developer page, environment, the gallery,
  `NativeTextEntryDialog`, the chrome barrel and every test. **BREAKING** for in-repo imports of
  `NativeSettings*`. No shims are kept.
- **Delete the adapters.** `src/features/settings/ui/settings-row.tsx` and `settings-section.tsx`
  are removed, along with the `SettingsRow`, `SettingsRowProps` and `SettingsSection` exports from
  `@/features/settings/ui`. About builds its rows as `NativeListRowProps` and renders
  `NativeListSection` / `NativeListRow`. `EnvironmentSettingsRow` renders `NativeListRow`
  directly. That component name stays, because it is the environment feature's product row (D3).
- **Gallery follows the name** (D4). Meta ids become `native-list` and
  `native-list-numeric-editor`, so story ids are `native-list--*` and
  `native-list-numeric-editor--*`. The fixture testIDs `gallery-native-settings-*` become
  `gallery-native-list-*`, and the `gallery.nativeSettings.*` FR/EN keys become
  `gallery.nativeList.*`. Registry bindings and `stories.test.ts` are renamed too. The three
  `known-a11y-violations.ts` entries are renamed in place, so the list stays at three entries. No
  Maestro flow references a gallery id or a seam-internal string.
- **Guard (Principle 1).** A new repo-local ESLint rule, `local/no-retired-list-names`
  (`tools/eslint-rules/`, with a RuleTester suite), applies to every `src/**/*.{ts,tsx}` file,
  tests included, with no allowlist. It reports four things: any identifier containing
  `NativeSettings`, any identifier starting with `SwiftSettings` or `ComposeSettings`, the exact
  identifiers `SettingsRow`, `SettingsRowProps`, `SettingsSection` and `SettingsSectionProps`, and
  any string or template literal containing `native-settings` or `nativeSettings`. The literal
  check covers import paths, `jest.mock` paths, testIDs, story ids and i18n keys. The rule also
  reports a file whose basename starts with `native-settings` or is `settings-row` /
  `settings-section` (D5).
- **Docs.** New ADR 072 (native list seam: names, no adapters, the retired-name rule). ADR 060
  is amended to the current files and drops the adapter sentence. `theming.md` (native-chrome
  seam, CI proof), `accessibility.md`, `navigation.md`, `features.md` (gallery registry table,
  user-calendar and About notes), and `lint-format.md` (new rule entry and block list) are
  updated. A dated `CHANGELOG.md` entry (2026-10-26) is added. Outside the Book, the in-repo
  references are updated: the `mobile-design-system-gallery` and `mobile-developer-page` specs (via
  deltas), `mobile/assets/icons/material/README.md`, `docs/mobile/react-doctor.md`, and the open
  inbox notes that name story ids or seam identifiers.

## Capabilities

### New Capabilities

- `mobile-design-system-native-list`: the native list seam's public names, the single list API
  shared across features (no feature-owned row adapters), and the lint gate that keeps the retired
  names, paths and strings out of `mobile/src/`.

### Modified Capabilities

- `mobile-design-system-gallery`: three requirements change. The stable-id example and deep-link
  scenarios, the platform-scoped index scenario, and the stress-state fixture requirement now name
  the `native-list` fixture and its story ids.
- `mobile-developer-page`: the production-gate deep-link scenario names
  `/developer/gallery/native-list--switches`.

## Impact

- **Code (`mobile/src/`):** 12 chrome files renamed, plus about 30 files with rename-only edits
  (chrome barrel and runtime files, `native-text-entry-dialog*`, Settings, Notifications, Calendar
  sources, About, environment, developer UI and its tests, the gallery registry, stories test and
  known violations). The FR/EN locale files are touched. The 2 adapter files are deleted.
- **Tooling:** the new `tools/eslint-rules/no-retired-list-names.js` and its test, its entry in
  `tools/eslint-rules/index.js`, a new `timecalendar/retired-list-names` block in
  `eslint.config.js`, and the `design-import-policy.test.js` file path. The
  `notification-native-controls.contract.test.ts` read path is updated.
- **Runtime behavior:** unchanged. No native dependency, no new package, no prop or geometry change.
  Maestro selectors are unchanged, because they all come from consumer-supplied testIDs
  (`user-calendar-row-*`, `user-calendar-visibility-*`, …).
- **Out of scope:** `ListRow` / `ListSection` / `Separator` (slice 3.6); generalizing
  `NativeListFloatingAction` into `FloatingAction` (slice 3.8); merging `native-list-icons.ts`
  with the `Icon` glyph table; any change to the row contract's types.
