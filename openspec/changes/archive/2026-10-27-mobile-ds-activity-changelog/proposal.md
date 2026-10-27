# Activity, the changelog history and the changelog sheet on the design system (roadmap slice 5.4)

## Why

Roadmap slice 5.4 (`docs/mobile/design-system-audit/migration-roadmap.md:77`, "Section headers on
new ramp; status states; header Close via `HeaderAction`") moves the Activity timeline, the
changelog history and the changelog sheet fully onto `@/design`. Slices 3.1, 3.3, 3.6 and 3.8
already gave these screens `Button` (Continue), `StatusView` (Activity empty and empty-failure),
`ListRow` (Activity items) and `useHeaderActions` (the sheet's Close). What is left is the part no
primitive covered yet:

- **Activity loading is hand-built.** The first-load state is a raw `ActivityIndicator` tinted
  `theme.primary` in two hand-centred `View`s (`activity-screen.tsx:116-124`, `:350-357`), and the
  older-page footer is a second raw `ActivityIndicator` (`:317-326`). The file is the first entry
  on the ad-hoc-status allowlist (`tools/eslint-rules/ad-hoc-status-allowlist.js:6`, "5.4 loading
  and older-page footer"). Every other screen's loading state is `StatusView`, which owns the
  spinner color (`textSecondary`), the `progressbar` role, the busy state and the announcement
  (`src/design/status/status-view.tsx:93-131`).
- **Activity group headers are off the ramp.** `ActivityGroupHeader` composes a `View` with the
  `header` role, `ThemedText type="subtitle"` (a legacy alias, `activity-screen.tsx:232`) and
  `type="small" themeColor="textSecondary"` (`:233`), painted with `theme.background` (`:230`) and
  spaced by its own `StyleSheet` (`:358-362`). The rows under it are grouped `ListRow`s, whose
  section titles everywhere else come from `ListSection` (`src/design/list/list-section.tsx:37-48`:
  iOS `footnote`/`secondary`, Android `label`/`action`). A `SectionList` cannot use `ListSection`,
  because `ListSection` wraps its rows, so the timeline restates a header the design layer already
  owns, at a different size (duplication-and-drift.md §A9).
- **Changelog items are hand-built cards.** `ChangelogContent` draws each item as a card with
  `Radii.large`, a `minHeight` of `Platform.OS === "ios" ? 72 : 76` (`changelog-content.tsx:94`),
  a 44 × 44 `primarySoft` icon tile with a literal `padding: 10` (`:101-109`), a `fontWeight: "700"`
  title override (`:111`), `themeColor="textSecondary"` (`:68`) and `type="subtitle"` version
  headings (`:36`). It also repaints the page background inline (`:24`, `style={{ … }}`), which
  `RootPage` already paints. The file sits on the style-literal allowlist for `spacingLiteral` and
  `typographyLiteral` (`tools/eslint-rules/style-literal-allowlist.js:37-40`). The content is a
  version heading over a list of icon + title + description rows: the shape `ListSection` and a
  static `ListRow` with a leading icon already draw.
- **None of the five files is on the migrated-screen contract**
  (`src/design/screen-migration.contract.test.ts:9-46`), so nothing stops them drifting back.

The sheet's Close is already a `HeaderAction` through `useHeaderActions`
(`changelog-sheet-screen.tsx:38-48`, ADR 075), and `local/no-ad-hoc-header-action` already keeps it
there. This slice keeps it and pins it through the contract; it does not redesign it.

## What Changes

- **`ListSectionHeader` in `@/design`.** The list section's title becomes its own exported
  component in `src/design/list/list-section.tsx`, which `ListSection` renders unchanged. It also
  takes an optional second line (`detail`, `footnote`/`secondary`), in which case the title and
  the detail form one `header` element whose accessible name is the caller's
  `accessibilityLabel`, or the title and detail joined. A virtualized list renders it from
  `renderSectionHeader`, so its section titles match `ListSection`'s on each platform. A
  `list-section--header-detail` gallery story covers it.
- **Activity on the design system.** The first load is a `screen` `StatusView` loading state
  (`activity-loading`) and the older-page footer an `inline` `StatusView` loading state
  (`activity-older-loading`). Group headers are `ListSectionHeader`s with the calendar name as the
  title and the change time as the detail, keeping the "calendar, changed time" accessible name.
  The screen imports no `ActivityIndicator`, uses no `themeColor` or legacy type alias, and leaves
  the ad-hoc-status allowlist.
- **Changelog on the design system.** `ChangelogContent` renders each release as a `ListSection`
  titled "Version 4.0" (`changelog-release-<version>`) and each item as a static `ListRow` with the
  release item's icon as its leading icon, its title as the label and its description as the
  subtitle. The card, the icon tile, the platform-branched minimum height, the weight override, the
  inline background and the legacy text props are deleted. The file leaves the style-literal
  allowlist. The sheet keeps Close (`changelog-close`, `useHeaderActions`) and Continue (`Button`)
  exactly as they are.
- **Ratchets shrink in the same change.** `ad-hoc-status-allowlist.js` loses its Activity entry and
  `AD_HOC_STATUS_ALLOWLIST_CEILING` drops from 2 to 1. `style-literal-allowlist.js` loses its
  changelog entry and `STYLE_LITERAL_ALLOWLIST_CEILING` drops `typographyLiteral` 7 → 6 and
  `spacingLiteral` 6 → 5.
- **Migrated-screen contract.** A `5.4` group lists the three route files, the five Activity and
  changelog UI components and the two Activity UI helpers. `MIGRATED_FILE_FLOOR` rises from 23 to
  33.
- **Book.** `theming.md` (Lists, Status), `accessibility.md` (list section headers),
  `lint-format.md` (Status allowlist and ceiling, style-literal ceilings, Migrated screens) and
  `features.md` (Activity and changelog presentation) describe the current state, with a dated
  `CHANGELOG.md` entry for 2026-10-27.

No user-facing string, route, presentation, behavior or Maestro selector changes. No new
dependency.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-activity-ui`: the group header is the shared list section header on the platform ramp,
  and the loading and older-page loading states are the shared status view.
- `mobile-changelog`: the shared history/sheet content is a list section per release with static
  list rows, and the sheet's Close stays a native header action.
- `mobile-design-system-list-row`: the list section header is a standalone primitive with an
  optional detail line, usable from a virtualized list, and has a gallery fixture.

The migrated-screen contract (`mobile-design-system-layer`) and the ad-hoc-status and
style-literal ratchets (`mobile-lint-format`) gain entries and lower ceilings under their existing
requirements, which name no file; their requirement text does not change.

## Impact

- **Code:** `mobile/src/design/list/list-section.tsx` (+ test, gallery, gallery test),
  `mobile/src/design/index.ts`, `mobile/src/features/activity/ui/activity-screen.tsx` (+ test),
  `mobile/src/features/changelog/ui/changelog-content.tsx`,
  `mobile/src/features/changelog/ui/changelog-screens.test.tsx`,
  `mobile/src/design/screen-migration.contract.test.ts`,
  `mobile/tools/eslint-rules/{ad-hoc-status-allowlist,ad-hoc-status-allowlist.test,style-literal-allowlist,style-literal-allowlist.test}.js`,
  `mobile/src/i18n/locales/{en,fr}.json` (gallery story strings only).
- **Unchanged:** `changelog-sheet-screen.tsx`, `changelog-history-screen.tsx`,
  `changelog-gate.tsx`, the three route files and `activity-items.ts` / `describe-change.ts`
  already pass the drift patterns; they are added to the contract with no edit.
- **Out of scope:** school picker, group picker, provider selection and the guide page (slice 5.5,
  running in parallel); the timezone chooser's Close (5.6); `RefreshControl` tinting (shared with
  Home and Calendar, 5.9/5.10).
- **Docs:** `docs/mobile/architecture-book/{theming,accessibility,lint-format,features,CHANGELOG}.md`;
  `docs/react-native-migration/inbox/2026-10-27-mobile-ds-activity-changelog-screen-reader-pass.md`.
