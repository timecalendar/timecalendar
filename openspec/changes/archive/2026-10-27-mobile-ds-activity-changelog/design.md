# Design

## Context

See proposal.md (Why) for the per-file drift. The constraints that shape the approach:

- **Activity is a virtualized `SectionList`** (`activity-screen.tsx:143-206`), and the
  `mobile-activity-ui` spec requires group children to be independent list items because one
  server log can carry thousands of changed events. A group cannot be wrapped in `ListSection`
  (`list-section.tsx:24-72`), which takes its rows as children. The rows are already grouped
  `ListRow`s with an explicit `position` from `listRowPosition(index, section.data.length)`
  (`activity-screen.tsx:197-205`, theming.md → Lists, "Grouped vs plain").
- **`ListSection`'s title is the design layer's one section title**: iOS `footnote` in
  `secondary`, Android `label` in `action`, `numberOfLines={4}`, `ListGeometry.rowPaddingHorizontal`
  side padding, `Spacing.one + Spacing.half` (iOS) or `Spacing.two` (Android) below
  (`list-section.tsx:37-48`, `:76-83`). It is inline JSX today, not reusable.
- **`StatusView` loading** (`status-view.tsx:60-67`, `:93-131`) takes a required visible `title`,
  renders one `progressbar` element with `busy`, a `large` spinner for `screen`/`section` and a
  `small` one for `inline`, both in `textSecondary`, and announces once (ADR 069). Its `screen`
  presentation fills its parent and must not sit inside a scroll view or list.
- **The changelog content is shared** by `/changelog` (pushed) and `/changelog-sheet` (iOS
  `formSheet`, Android `fullScreenModal`, `_layout.tsx:161-167`) and composes the sheet's
  Continue `Button` as a footer (`changelog-sheet-screen.tsx:50-58`). Its tests pin the readable
  lane (`changelog-screens.test.tsx:40-59`), the safe-area edges (`:67-72`) and the version heading
  role (`:63`).
- **Close is already a native header action** (`changelog-sheet-screen.tsx:38-48`): an iOS bar
  item and an Android Compose `TextButton`, labelled "Close" / "Fermer", with the hint, under
  `local/no-ad-hoc-header-action` (ADR 075). Tests pin both platforms
  (`changelog-screens.test.tsx:111-143`).
- **No Maestro flow touches Activity or the changelog** (`mobile/.maestro/` has no selector for
  either; the gate seeds the current version on a fresh install, so the sheet never opens in the
  E2E flows). Jest selectors are the contract to keep.
- **Flutter parity** (`app/lib/modules/changelog/widgets/changelog_item_new_features.dart`,
  `changelog_item_header.dart`): a "Version x" heading over rows of a leading icon, a bold title
  and a description, no cards. Parity is the content and order, not the Flutter look (R-3).
- **Slice 5.5 runs in parallel** and edits `style-literal-allowlist.js` (`school-logo.tsx`),
  `raw-button-allowlist.js` (`school-group-picker-screen.tsx`), the contract list and floor,
  `features.md` and `CHANGELOG.md`.

## Goals / Non-Goals

**Goals:**

- Every file in scope composes only `@/design`, `@/components/chrome` and tokens, passes the
  migrated-screen drift patterns, and is on no ratchet allowlist.
- One section-title primitive serves `ListSection` and virtualized lists, so Activity's headers
  match hidden events', personal events' and Settings' on each platform.
- No selector, string, behavior or presentation change outside the visuals listed below.

**Non-Goals:**

- No change to the sheet's Close action (label, side, hint, testID) or to Continue.
- No change to `RefreshControl` (tinted `theme.primary`, as on Home and Calendar; a refresh
  primitive is a 5.9/5.10 question).
- No change to Activity data, pagination, mark-read or navigation.
- No screen from slice 5.5 (school picker, group picker, provider selection, guide page) and no
  timezone chooser (5.6).
- No ADR: D1 extends the list family of ADR 073 without changing a decision in it.

## Decisions

### D1. `ListSectionHeader`: the section title as a primitive, with an optional detail line

`src/design/list/list-section.tsx` gains, and `@/design` exports:

```ts
export type ListSectionHeaderProps = {
  title: string
  detail?: string | undefined
  accessibilityLabel?: string | undefined
  testID?: string | undefined
  style?: StyleProp<ButtonLayoutStyle>
}
```

- **Title only** (what `ListSection` passes): exactly today's `ListSection` title, one
  `ThemedText` with `accessibilityRole="header"`, the same platform type and tone, line cap,
  padding and `testID`. `ListSection` renders `<ListSectionHeader title={title} testID={…-title} />`,
  so its rendered tree, its tests and its gallery are unchanged.
- **With `detail`**: a `View` that is one accessible element with `accessibilityRole="header"` and
  `accessibilityLabel = accessibilityLabel ?? joinRowName([title, detail])`, holding the title
  `ThemedText` (same type and tone, no role of its own) and the detail `ThemedText` in
  `footnote`/`secondary` on both platforms, `numberOfLines={4}`. The container carries the side
  padding and the bottom padding; `testID` goes on the container. A two-line header reads as one
  heading stop, as Activity's does today (`activity-screen.tsx:224-229`).
- `style` is layout-only (`ButtonLayoutStyle`) and merges last, as on `ListSection`.

Activity renders it from `renderSectionHeader` with `title={calendarName}`, `detail={time}` and
the existing `activity.group.accessibilityLabel` ("{{calendar}}, changed {{time}}"). The
`theme.background` fill goes: `stickySectionHeadersEnabled` is `false`, so the header never sits
over rows. Group spacing: the first header sits under the content's `Spacing.four` top padding;
every later header gets `marginTop: Spacing.four`, the same gap `ListSection` leaves between
sections (`list-section.tsx:75`). The calendar name therefore changes from a 20 pt semibold title
(the `subtitle` alias) to the platform section-title style, which is the point of the row ("on
the new ramp").

**Alternatives.**

- *A feature-local header on the ramp* (`ThemedText type="headline"` + `footnote` in the screen).
  The smallest diff, but it keeps a third section-title style (A9 in duplication-and-drift.md) and
  every later virtualized grouped list (agenda day headers in 5.10, timezone groups) would restate
  it again.
- *Render each group as one `ListSection` item.* Breaks the virtualization requirement for logs
  with thousands of changes.
- *Title-only header for Activity, time folded into the first row.* Loses the time from the
  heading, which the spec requires the header to show.
- *A separate `list-section-header.tsx` file.* The header is `ListSection`'s own anatomy; keeping
  it in the same file keeps one fixture file and one test file for the section family
  (`fixture-coverage.contract.test.ts`).

### D2. Activity loading states are `StatusView`

- First load: `<StatusView kind="loading" presentation="screen" testID="activity-loading"
  title={t("activity.loading")} />` inside the same `laneStyle` + `stateLane` wrapper the
  empty-failure branch already uses (`activity-screen.tsx:126-141`). The old `centered` style goes.
  "Loading recent changes" becomes visible text under the spinner, as on every other screen's
  loading state, and the spinner changes from `primary` to `textSecondary`.
- Older-page footer: `<StatusView kind="loading" presentation="inline"
  testID="activity-older-loading" title={t("activity.older.loading")} style={styles.footer} />`.
  `inline` is the small spinner beside a leading-aligned label: a pagination footer on iOS
  (`UITableView` footer) and Android (M3 list loading item) is a small indicator, not the large
  one `section` draws.
- `ActivityIndicator` leaves the import, so `local/no-ad-hoc-status` passes with the file off the
  allowlist.

*Alternative:* `section` for the footer: a centered large spinner and label under the last row,
heavier than the platform footer. *Alternative:* a spinner with no visible label: `StatusView`
requires a visible title by type, and the label is what a screen reader announces.

### D3. Changelog content is a `ListSection` per release with static `ListRow`s

```tsx
<ListSection
  key={release.version}
  title={t("changelog.versionHeading", { version: release.label })}
  testID={`changelog-release-${release.version}`}
>
  {release.items.map((item, index) => (
    <ListRow
      key={item.titleKey}
      leading={{ icon: item.icon }}
      label={t(item.titleKey)}
      subtitle={t(item.subtitleKey)}
      testID={`changelog-release-${release.version}-item-${index}`}
    />
  ))}
</ListSection>
```

- `ChangelogItem.icon` (`{ ios: SFSymbol; android: MaterialGlyph }`, `data/catalog.ts:15-18`) is
  already the `ListRow` leading-icon shape; the catalog does not change.
- The row is static (no `onPress`/`href`), so its text column is one element named by the label
  and subtitle, and the leading icon is hidden from assistive technology (accessibility.md → Lists).
  The version title is a `header`, so `getByText("Version 4.0")` keeps its `header` role.
- The look follows the platform list: iOS draws an inset-grouped card with the 29 pt
  `primaryStrong` icon tile and inset separators (the Settings idiom); Android draws M3 segments
  with a flat 24 dp glyph. Body label and secondary subtitle replace the bold 700 title and
  `textSecondary` override.
- The `ScrollView` keeps `testID="changelog-scroll-owner"` and the readable lane container
  `changelog-responsive-content`. It takes `headerScrollProps(true)` instead of the literal
  `contentInsetAdjustmentBehavior`, and drops the inline `backgroundColor` (RootPage paints
  `theme.background`, `root-page.tsx:44-52`). The lane's `gap` goes: `ListSection` spaces sections
  by `Spacing.four`, which also separates the last section from the sheet's Continue footer.
  `scrollContent` keeps `Spacing.four` top and `Spacing.six` bottom.
- `Radii`, `Platform`, `Icon`, `useTheme` and every literal leave the file; it leaves the
  style-literal allowlist.

**Alternatives.**

- *Keep the feature layout and only tokenize it* (Apple's "What's New" template: tinted glyph,
  headline, body, no card; also the Flutter shape). It keeps a feature-local row anatomy, an icon
  size and a text pairing that no primitive owns, which is exactly what Phase 5 removes, and it
  would need its own large-text and focus-order proof.
- *The `NativeList` seam* (SwiftUI `Form` / Compose list, as About uses). The seam owns its own
  scroll and insets, so the sheet's filled Continue `Button` and the measured readable lane would
  have to move into the seam as a row action, changing the CTA, and the history/sheet sharing and
  lane tests would be rewritten. The seam is for settings-style screens; the changelog is content
  with a CTA.

### D4. The sheet's Close stays the labelled header action it is

Close stays `{ label: "Close", accessibilityHint, testID: "changelog-close" }` on the right side
through `useHeaderActions` on both platforms. The slice adds the sheet screen to the migrated
contract and keeps the two existing platform tests; no code changes.

*Alternative:* an `xmark` / Material `close` icon action, on the left on Android (M3 full-screen
dialog). Rejected for this slice: `native-icons.ts` has no `close` asset, the timezone chooser's
Close (5.6) uses the same labelled form, and the glyph-vs-label choice for modal dismissal belongs
to every sheet at once, not one. Recorded for 5.6 to take across sheets.

### D5. Ratchets and the contract shrink and grow in this change

- `ad-hoc-status-allowlist.js` drops `activity-screen.tsx`; `AD_HOC_STATUS_ALLOWLIST_CEILING`
  2 → 1.
- `style-literal-allowlist.js` drops `changelog-content.tsx`; the exact ceilings become
  `typographyLiteral: 6`, `spacingLiteral: 5` (others unchanged).
- No Activity or changelog file is on the raw-primitive, raw-button, header-action,
  ad-hoc-separator, raw-text-input or raw-event-color allowlists (checked:
  `tools/eslint-rules/*-allowlist.js`); nothing to change there.
- `screen-migration.contract.test.ts` gains a `5.4` group, in slice order after `5.3`:
  `src/app/activity.tsx`, `src/app/changelog.tsx`, `src/app/changelog-sheet.tsx`,
  `src/features/activity/ui/activity-screen.tsx`, `src/features/activity/ui/activity-items.ts`,
  `src/features/activity/ui/describe-change.ts`,
  `src/features/changelog/ui/changelog-content.tsx`,
  `src/features/changelog/ui/changelog-sheet-screen.tsx`,
  `src/features/changelog/ui/changelog-history-screen.tsx`,
  `src/features/changelog/ui/changelog-gate.tsx`. `MIGRATED_FILE_FLOOR` 23 → 33.
- **Parallel 5.5.** Whichever slice merges second rebases and recomputes: each ceiling equals the
  surviving entry count per category, and the floor equals the listed-file count with both
  groups present. The suites fail loudly on a wrong number, so a bad merge cannot pass CI.

## Risks / Trade-offs

- [Activity headers get visually quieter: the calendar name drops from a 20 pt title to a footnote
  (iOS) or a brand label (Android)] → It is the same header every grouped list in the app uses;
  the device pass checks the timeline still scans by calendar in both schemes.
- [The changelog loses its "marketing" feel for a Settings-like list] → Content and order keep
  Flutter parity; the device pass checks the sheet at the formSheet detent and at the largest
  accessibility size, where the old fixed-height cards were the weaker layout.
- [The visible "Loading recent changes" label is new on Activity] → It is the shared loading
  contract and the same string screen readers already heard.
- [A two-line `header` element's name is a composed string] → The caller passes the translated
  label; the screen-reader pass checks VoiceOver and TalkBack read one heading.
- [Merge conflicts with 5.5 on ceilings and the floor] → D5's recompute rule; the allowlist and
  contract suites catch any wrong number.

## Migration Plan

One PR on `feat/mobile-ds-activity-changelog`. No data, route or selector migration. Rollback is
a revert.
