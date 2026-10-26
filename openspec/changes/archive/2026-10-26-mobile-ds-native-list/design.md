# Design

## Context

See proposal.md (Why) for motivation. What the change has to work with:

- **The seam** is `mobile/src/components/chrome/native-settings*.{ts,tsx}`. That covers the runtime
  (`native-settings.tsx` with host, section, row, switch row, choice row, radio dialog, alert and
  floating action), `native-settings-header.tsx`, `native-settings-numeric-editor.tsx`, the private
  `native-settings-host-context.ts` (context and placement guard), `native-settings-icons.ts` (the
  SF/Material pair type and the Material drawable map), their tests, two gallery fixtures and two
  fixture tests. The chrome barrel `src/components/chrome/index.ts` re-exports it. ADR 060 records
  it as the bounded composed-control exception, and `theming.md` → Native-chrome wrapper seam holds
  its rules.
- **The seam derives no testIDs of its own.** Every identifier comes from the consumer (`testID`,
  `switchTestID`, `messageTestID`, …). The Maestro flows select only consumer ids
  (`user-calendar-row-*`, `user-calendar-visibility-*`, `ical-url-*`, `personal-event-*`, …). None
  of them contains `native-settings`.
- **The adapters** (`src/features/settings/ui/settings-row.tsx`, `settings-section.tsx`) are pure
  prop maps over the seam. `variant: "router" | "action" | "value"` maps to `kind: "navigation" |
  "action" | "value"`, and `secondary` maps to `value`. `first` is accepted and dropped.
  `accessibilityRole` is accepted and never forwarded. `SettingsSection` spreads into
  `NativeSettingsSection`. Their only consumers are `features/about/ui/about-screen.tsx` (through
  the `@/features/settings/ui` barrel) and `features/environment/ui/environment-settings-row.tsx`
  (through a deep import). They have no tests of their own.
- **Gallery ids** (`native-settings--*`, `native-settings-numeric-editor--*`) appear in the main
  specs (`mobile-design-system-gallery`, `mobile-developer-page`), in `features.md` and
  `accessibility.md`, in the open inbox notes, in `known-a11y-violations.ts` (3 entries), and in
  the developer UI tests. Maestro and CI scripts never use them.
- **Precedent:** slices 3.1 (`PrimaryAction` → `Button`, ADR 067 D8) and 3.3 (`EmptyState` /
  `ErrorState` → `StatusView`, ADR 069 D1) both migrated every call site outright rather than
  keeping the aliases the roadmap suggested.

## Goals / Non-Goals

**Goals:**

- One name for the seam that says what it is: a native grouped list, not a settings page.
- One list API across features. No feature owns a row wrapper that another feature imports.
- The retired names cannot come back, and lint is what enforces that.
- No visible or behavioral change: same props, same geometry, same accessibility, same Maestro
  selectors.

**Non-Goals:**

- Changing the row contract's types. The flat `NativeListRowProps` stays as it is. The adapter's
  discriminated union is not ported in. Slice 3.6 designs the shared row vocabulary.
- `ListRow` / `ListSection` / `Separator` (3.6), `FloatingAction` (3.8), and merging
  `native-list-icons.ts` into the `Icon` glyph table.
- Renaming the project folder `docs/projects/native-settings/`, the ADR 060 file name, past
  `CHANGELOG.md` entries, or the design-system audit (exploration documents).
- Renaming `EnvironmentSettingsRow` or the Settings feature's own screens.

## Decisions

### D1. The name map

Proposal §2 lists `NativeList`, `NativeListSection`, `NativeListRow`, `NativeListSwitchRow`,
`NativeListChoiceRow`, `NativeListRadioDialog` and `NativeListAlert`. The host is the list itself
(SwiftUI `Form`, Compose `LazyColumn`), so it is `NativeList`, not `NativeListHost`. The rest of
the seam follows the same prefix:

| Old | New |
| --- | --- |
| `chrome/native-settings.tsx` (+ `.test.tsx`, `.gallery.tsx`, `.gallery.test.tsx`) | `chrome/native-list.tsx` (+ same suffixes) |
| `chrome/native-settings-header.tsx` (+ `.test.tsx`) | `chrome/native-list-header.tsx` (+ `.test.tsx`) |
| `chrome/native-settings-numeric-editor.tsx` (+ `.test.tsx`, `.gallery.tsx`, `.gallery.test.tsx`) | `chrome/native-list-numeric-editor.tsx` (+ same suffixes) |
| `chrome/native-settings-host-context.ts` | `chrome/native-list-context.ts` |
| `chrome/native-settings-icons.ts` | `chrome/native-list-icons.ts` |
| `NativeSettingsHost` / `NativeSettingsHostProps` | `NativeList` / `NativeListProps` |
| `NativeSettingsSection` / `…Props` | `NativeListSection` / `…Props` |
| `NativeSettingsRow` / `NativeSettingsRowProps` | `NativeListRow` / `NativeListRowProps` |
| `NativeSettingsSwitchRow` / `…Props` | `NativeListSwitchRow` / `…Props` |
| `NativeSettingsChoiceRow` / `…Props` | `NativeListChoiceRow` / `…Props` |
| `NativeSettingsRadioDialog` / `…Props` / `…Option` | `NativeListRadioDialog` / `…Props` / `…Option` |
| `NativeSettingsAlert` / `…Props` | `NativeListAlert` / `…Props` |
| `NativeSettingsFloatingAction` / `…Props` | `NativeListFloatingAction` / `…Props` |
| `NativeSettingsHeader` / `…Props` | `NativeListHeader` / `…Props` |
| `NativeSettingsNumericEditor` / `…Props` / `…Ids` | `NativeListNumericEditor` / `…Props` / `…Ids` |
| `NativeSettingsIcon`, `NativeSettingsMaterialSymbol` | `NativeListIcon`, `NativeListMaterialSymbol` |
| `NativeSettingsHostContext`, `useAssertOutsideNativeSettingsHost` | `NativeListContext`, `useAssertOutsideNativeList` |
| private `SwiftSettings*`, `ComposeSettings*` (`ComposeSettingsHost`, `SwiftSettingsRow`, …) | `SwiftList*`, `ComposeList*` |
| placement error `"<X> must render outside NativeSettingsHost; place it after </NativeSettingsHost>."` | `"<X> must render outside NativeList; place it after </NativeList>."` |
| `SettingsRow`, `SettingsRowProps`, `SettingsSection` (`features/settings/ui`) | deleted. Consumers use `NativeListRow`, `NativeListRowProps`, `NativeListSection` |
| gallery meta `native-settings`, `native-settings-numeric-editor` | `native-list`, `native-list-numeric-editor` |
| story ids `native-settings--{rows,destructive,switches,choices,header-and-alert,floating-action,radio-dialog,long-strings}` | `native-list--{…same…}` |
| story ids `native-settings-numeric-editor--{default,validation-error,long-strings}` | `native-list-numeric-editor--{…same…}` |
| fixture testIDs `gallery-native-settings-*` | `gallery-native-list-*` |
| i18n keys `gallery.nativeSettings.*` | `gallery.nativeList.*` |
| registry bindings `nativeSettings`, `nativeSettingsNumericEditor` | `nativeList`, `nativeListNumericEditor` |

Unchanged: `gallery.numericEditor.*` keys and `gallery-numeric-editor-*` testIDs (already neutral),
`EnvironmentSettingsRow`, and every consumer-supplied testID.

Rejected: `NativeListHost` for the host. The proposal names it `NativeList`, and "host" is an
Expo UI implementation word that the consumer should not have to think about.

### D2. No transitional aliases (ADR-worthy, see ADR 072)

The proposal (§2 table) and the assessment both say to keep `NativeSettings*` aliases "during
migration". An alias exists so that call sites can move over several slices. Here the whole
migration is one mechanical rename of about 30 files, done in one change, with tsc catching any
miss. The alias window would therefore be zero-length. Keeping aliases anyway would leave two
names for every control. It would also need a ratchet of its own to retire them, and a later slice
to delete them, which is the same reasoning ADR 067 D8 and ADR 069 D1 applied.

The app is not in production, so no external consumer or installed binary depends on the old
names.

Alternatives:
- Aliases plus a deprecation lint. Rejected: two APIs and a second ratchet, for no consumer that
  needs the time.
- Aliases with no lint. Rejected: this is exactly the drift the audit flagged.

### D3. About and Environment render the seam directly. `EnvironmentSettingsRow` keeps its name

- **About** types its section data as `readonly NativeListRowProps[]`, writes `kind` (`"action"`
  or `"navigation"`) and `value` instead of `variant` and `secondary`, drops `first`, and renders
  `NativeListSection` (same `title` and `about-section-<key>` testID) wrapping `NativeListRow`.
  It no longer imports `@/features/settings/ui`.
- **EnvironmentSettingsRow** renders `<NativeListRow kind="action" … value={value} hint=… onPress=…
  testID="settings-environment" />`. It drops `first`, and it drops `accessibilityRole="button"`,
  which the adapter never forwarded. An `action` row already exposes the native button role, so
  the rendered tree is unchanged.
- **The adapters' extra typing is not ported.** The union required `hint` on navigation and action
  rows and `href` on navigation rows. The ten other seam screens already use the flat seam type, and
  slice 3.6 designs the shared row props. A one-off union for two screens would be a third row API.
  Accepted cost: About's rows lose a compile-time "hint present" check. `about-screen.test.tsx`
  asserts the hints.
- `EnvironmentSettingsRow` is a product component: the environment feature's row, banned outside
  the developer page by `developerToolsImportPath`. It is not a generic row API, and renaming it
  would also churn the lint and spec that name it. The retired-name rule matches `SettingsRow`
  exactly, so `EnvironmentSettingsRow` passes.

### D4. Gallery ids, fixture testIDs and keys follow the component name

A meta id is the component's name (`button`, `status-view`, `text-field`). Keeping
`native-settings` after the rename would leave the gallery naming a component that no longer
exists, and it would also stop the guard from banning the string. The gallery spec promises that
an id does not change when its *copy* changes. A component rename is not a copy change. Every
dependent of the ids is in this repo and is updated in this change: the two main specs (MODIFIED
deltas), `features.md`, `accessibility.md`, the open inbox notes, `known-a11y-violations.ts` and
the developer UI tests. Maestro and CI scripts reference none of them (verified with grep over
`mobile/.maestro`, `mobile/scripts`, `.github`).

`known-a11y-violations.ts` keeps exactly its three entries: same platform, problem, reason and
inbox link, with only the `story` and `element` strings renamed. `registry.test.ts`'s
stale/unlisted check proves the renamed entries still reproduce.

### D5. The guard: `local/no-retired-list-names` (ADR-worthy, see ADR 072)

`tools/eslint-rules/no-retired-list-names.js` lives in a block of its own,
`timecalendar/retired-list-names`, with `files: ["src/**/*.{ts,tsx}"]`, no `ignores`, and no
allowlist. Tests are included, because a test that names the old seam is a stale test. It reports:

1. any `Identifier`, `JSXIdentifier` or TS type name whose name matches
   `/NativeSettings|^(Swift|Compose)Settings/`, or is exactly `SettingsRow`, `SettingsRowProps`,
   `SettingsSection` or `SettingsSectionProps`;
2. any string `Literal` or `TemplateElement` (cooked value) containing `native-settings` or
   `nativeSettings`. This covers import and export sources, `jest.mock` / `require` paths,
   testIDs, story ids, i18n keys passed to `t()`, and file paths read by contract tests;
3. on `Program`, a file whose basename starts with `native-settings` or is `settings-row` /
   `settings-section` (any extension), so a recreated file fails even if nothing imports it yet.

The message names the replacement (`NativeList*` from `@/components/chrome`, ADR 072).

Why a local rule rather than the alternatives:
- `no-restricted-imports` sees only import specifiers. It misses testIDs, i18n keys, story ids,
  mock paths and declarations.
- Appending `restrictedSyntax` selectors (L8's slot) would also lint `eslint.config.js` and
  `tools/**`. The selector strings would then match their own literal ban, and the regex-in-selector
  would have no RuleTester proof. A local rule scoped to `src/` keeps the old names writable in its
  own test fixtures under `tools/` and follows the local-rule precedent (`no-raw-text-input`).
- A text-grep contract test gives no editor feedback, and lint is already the R-1 home for naming
  rules.

What it cannot see (recorded in lint-format.md): JSON locale files (a re-added unused
`gallery.nativeSettings` key is not linted; using one through `t()` is), Maestro YAML, Markdown,
and computed strings (`"native-" + "settings"`). Review covers those.

### D6. Docs: ADR 072, ADR 060 amended, the Book in present tense

- **ADR 072 `072-native-list-seam.md`.** Context: the misnomer and the inverted ownership.
  Decision: D1 names, D2 no aliases, D3 one list API (no feature-owned row wrappers), D5 rule.
  Rejected: aliases, keeping the adapters in `components/`, `NativeListHost`, a grep contract test.
  Consequences: 3.6 builds `ListRow` against `NativeListRow`'s geometry. Revisit: a second
  composed list technology appears (a non-Expo-UI native list), or 3.6's `ListRow` makes the seam's
  row redundant. Number 071 is reserved by PR #494, so this ADR takes 072. Add the index row.
- **ADR 060** stays at its file name (ADRs are cited by number and path). Its Decision names
  `src/components/chrome/native-list.tsx` and the `NativeList*` contracts, it drops the adapter
  sentence, and it links ADR 072. The index row title stays as it is.
- **Book:** `theming.md` (the native-chrome seam bullet and its sub-bullets, the barrel bullet, CI
  proof paths), `accessibility.md` (alert, header, test paths, known-violation story ids),
  `navigation.md` (`NativeList` inset ownership), `features.md` (gallery registry rows,
  user-calendar and About notes; the About row says it renders the seam directly), `lint-format.md`
  (block list, new rule entry with caveats, inject-and-revert proof). The dated `CHANGELOG.md`
  entry `## 2026-10-26 — NativeList seam` goes at the top. Past entries are not rewritten.
- **Outside the Book:** `mobile/assets/icons/material/README.md`, `docs/mobile/react-doctor.md`
  (current-state ledger path), and the open inbox notes
  (`2026-10-25-mobile-design-system-gallery-device-pass.md`,
  `2026-10-25-mobile-gallery-fixtures-findings.md`, `2026-10-25-mobile-android-m3-alerts.md`,
  `2026-10-26-mobile-a11y-residuals.md`): identifiers and story ids only, so the person who runs
  them opens ids that exist.

## Risks / Trade-offs

- [A missed string, such as a story id in a test or a testID in a fixture assertion] → the new rule
  fails lint on any leftover `native-settings` / `nativeSettings` literal, and tsc fails on any
  leftover identifier.
- [A known-a11y-violation entry renamed inconsistently with its fixture testID] →
  `registry.test.ts` fails both as unlisted (the new id) and as stale (the old entry), naming each.
- [`git mv` plus heavy edits loses rename detection in review] → rename in one commit with only
  identifier edits, then make the adapter removal and the rule separate commits.
- [Merge conflicts with in-flight branches that touch `native-settings*` (for example PR #494, if it touches them)] →
  whichever lands second resolves by applying the D1 map. The lint rule then flags any residue.
- [Dropping `accessibilityRole` from `EnvironmentSettingsRow` is mistaken for a change] → it was
  never forwarded. `environment-selector.test.tsx` keeps asserting the row's `button` role, label
  and value on iOS.

## Migration Plan

This is an in-repo rename with no runtime migration. Rollback is a revert of the PR. No
persisted data, deep link used in product, or native configuration depends on the names.
