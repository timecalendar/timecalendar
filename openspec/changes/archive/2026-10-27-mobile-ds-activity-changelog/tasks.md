# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D5 are in `design.md`.
Before you change a symbol, run LSP `findReferences` on `ListSection`, `ChangelogContent` and
`ActivityScreen`. Add a code comment only for a non-obvious why. Docs describe the current state
only. Do not touch `src/features/school-selection/**`, `src/features/export-guides/**` or any
5.5 screen (slice 5.5 runs in parallel). Never build Android on the Mac. Tests, specs and docs use
no real developer or account names.

**Files in scope**

| Role | Path |
| --- | --- |
| New primitive part | `src/design/list/list-section.tsx` (+ `.test.tsx`, `.gallery.tsx`, `.gallery.test.tsx`), `src/design/index.ts` |
| Activity | `src/features/activity/ui/activity-screen.tsx` (+ `.test.tsx`) |
| Changelog | `src/features/changelog/ui/changelog-content.tsx`, `changelog-screens.test.tsx` |
| Contract only (no edit expected) | `src/app/{activity,changelog,changelog-sheet}.tsx`, `src/features/activity/ui/{activity-items,describe-change}.ts`, `src/features/changelog/ui/{changelog-sheet-screen,changelog-history-screen,changelog-gate}.tsx` |
| Ratchets | `tools/eslint-rules/{ad-hoc-status-allowlist,ad-hoc-status-allowlist.test,style-literal-allowlist,style-literal-allowlist.test}.js`, `src/design/screen-migration.contract.test.ts` |
| Strings | `src/i18n/locales/{en,fr}.json` (gallery story name only) |

**Selectors that must stay stable:** `activity-layout-owner`, `activity-section-list`,
`activity-refresh-control`, `activity-loading`, `activity-empty` (+ `-artwork`),
`activity-empty-error`, `activity-empty-retry`, `activity-cached-error`, `activity-refresh-retry`,
`activity-older-loading`, `activity-older-error`, `activity-older-retry`,
`activity-<kind>-<uid>`, `changelog-safe-area`, `changelog-scroll-owner`,
`changelog-responsive-content`, `changelog-release-<version>`, `changelog-close`,
`changelog-continue`. No Maestro flow selects Activity or changelog elements
(`rtk proxy rg -n -i "activity|changelog" .maestro` is empty today).

## 0. Baseline

- [x] 0.1 Prove the ratchet status. Run
      `rtk proxy rg -n "activity/ui|changelog/ui" tools/eslint-rules eslint.config.js`.
      Verify: the only hits are `ad-hoc-status-allowlist.js:6` and
      `style-literal-allowlist.js:37-40`. If another allowlist lists an in-scope file, remove it in
      3.x and lower that ceiling by the rows removed.
- [x] 0.2 Run the audit greps from `docs/mobile/design-system-audit/duplication-and-drift.md` →
      Method on the ten contract files (under zsh use a bash array), plus
      `themeColor|type="(default|small|smallBold|subtitle)"|ActivityIndicator|Radii\.|useTheme|Platform\.`.
      Verify: hits are only in `activity-screen.tsx` (`ActivityIndicator`, `themeColor`,
      `subtitle`/`small`, `theme.background`) and `changelog-content.tsx` (`Radii`, `Platform`,
      `minHeight`, `padding: 10`, `fontWeight`, `style={{`, `themeColor`, `subtitle`). Record counts
      for the PR.

## 1. `ListSectionHeader` (D1)

- [x] 1.1 In `src/design/list/list-section.tsx`, extract the title JSX into exported
      `ListSectionHeader` with the props in design.md D1; `ListSection` renders it with
      `testID={testID ? `${testID}-title` : undefined}`. With `detail`, render one accessible
      `View` (`accessibilityRole="header"`, label `accessibilityLabel ?? joinRowName([title, detail])`,
      `testID`, the side and bottom padding of today's title, `style` last) holding the title
      `ThemedText` without a role and a `footnote`/`secondary` detail with `numberOfLines={4}`.
      Export `ListSectionHeader` and `ListSectionHeaderProps` from `src/design/index.ts`. Use
      tokens only (`ListGeometry`, `Spacing`).
      Verify: `npx jest src/design/list` passes unchanged before new tests are added (the
      existing `list-section.test.tsx` proves the title-only path is identical).
- [x] 1.2 Extend `list-section.test.tsx` on iOS and Android: title-only header equals the
      `ListSection` title (type step, tone color, `header` role, `-title` testID); with `detail`
      exactly one `header` element, named by the caller label, and by `title, detail` without it;
      the detail is `footnote` in `textSecondary`; no inner text carries `header`; `style` merges
      last. Verify: `npx jest src/design/list --coverage --collectCoverageFrom=src/design/list/list-section.tsx`
      shows ≥ 90% lines and branches (the `jest.config.js:141` tier).
- [x] 1.3 Add a `HeaderDetail` story to `list-section.gallery.tsx` (title + detail, and a second
      header with the shared longest stress strings stating whether the accessibility text size is
      active), add it to `meta.stories`, add `gallery.listSection.story.headerDetail` and any fixture
      strings to `en.json` and `fr.json`, and cover the story in `list-section.gallery.test.tsx`.
      Verify: `npx jest src/design/gallery src/design/list src/i18n` passes (registry a11y matrix,
      fixture coverage, FR/EN parity) and `known-a11y-violations.ts` does not grow.

## 2. Screens

- [x] 2.1 Activity (D1, D2). In `activity-screen.tsx`: the `!loaded` branch renders
      `StatusView kind="loading" presentation="screen" testID="activity-loading" title={t("activity.loading")}`
      inside `[laneStyle, styles.stateLane]`; `OlderFooter`'s loading branch renders
      `StatusView kind="loading" presentation="inline" testID="activity-older-loading" title={t("activity.older.loading")} style={styles.footer}`;
      `ActivityGroupHeader` becomes `ListSectionHeader` with `title={calendarName}`,
      `detail={time}`, the existing `activity.group.accessibilityLabel`, and `styles.sectionGap`
      (`marginTop: Spacing.four`) on every section but the first. Remove `ActivityIndicator`,
      `View` (if unused), the `centered` and `groupHeader` styles, and the `theme` read in the header
      and footer (`useTheme` stays only for `RefreshControl`).
      Verify: `rtk proxy rg -n "ActivityIndicator|themeColor|type=\"(small|subtitle)\"|theme\.background" src/features/activity/ui/activity-screen.tsx`
      is empty.
- [x] 2.2 Update `activity-screen.test.tsx`: `activity-loading` is a `progressbar` with
      `busy: true` named "Loading recent changes" with visible text, in EN and FR;
      `activity-older-loading` appears while `loadOlderPage` is pending and is gone after; each
      group header is one `header` named "Computer Science, changed <time>" whose title text has the
      `ListSection` title style per platform (`usePlatform("ios")` / `"android"`); the second group's
      header has `marginTop: Spacing.four` and the first has none. Keep every existing assertion.
      Verify: `npx jest src/features/activity` passes.
- [x] 2.3 Changelog (D3). Rewrite `changelog-content.tsx` to the shape in design.md D3:
      `ListSection` per release, static `ListRow` per item with `leading={{ icon: item.icon }}`,
      `testID` `changelog-release-<version>-item-<index>`; `ScrollView` with `headerScrollProps(true)`,
      `testID="changelog-scroll-owner"` and `contentContainerStyle={styles.scrollContent}` (tokens
      only); the lane `View` keeps `changelog-responsive-content` and `layout.laneStyle` and has no
      gap. Remove `Platform`, `Radii`, `Icon`, `useTheme`, the inline style and the item, icon,
      copy and itemTitle styles. Do not edit `changelog-sheet-screen.tsx` (D4).
      Verify: `rtk proxy rg -n "Platform|Radii|themeColor|fontWeight|style=\{\{|minHeight|subtitle\"" src/features/changelog/ui/changelog-content.tsx`
      is empty.
- [x] 2.4 Update `changelog-screens.test.tsx`: keep the lane, safe-area, header-role, French copy,
      Continue and Close tests; add that `changelog-release-4` renders three static rows
      (`changelog-release-4-item-0..2`) with no `button` role, each named "title, description" in
      catalog order, with the leading icon hidden from accessibility; add that the version title has
      the `ListSection` title style on iOS and Android.
      Verify: `npx jest src/features/changelog` passes.

## 3. Ratchets and contract (D5)

- [x] 3.1 Delete the Activity row from `ad-hoc-status-allowlist.js`; set
      `AD_HOC_STATUS_ALLOWLIST_CEILING = 1`. Verify: `npx jest tools/eslint-rules/ad-hoc-status-allowlist`
      passes, and inject-and-revert: re-adding `ActivityIndicator` to the `react-native` import of
      `activity-screen.tsx` makes `npm run lint` fail with `local/no-ad-hoc-status` (record, revert).
- [x] 3.2 Delete the changelog row from `style-literal-allowlist.js`; set
      `typographyLiteral: 6`, `spacingLiteral: 5` in `STYLE_LITERAL_ALLOWLIST_CEILING`. Verify:
      `npx jest tools/eslint-rules/style-literal-allowlist` passes, and inject-and-revert:
      `padding: 10` in `changelog-content.tsx` fails `npm run lint` with `local/no-style-literals`
      (record, revert).
- [x] 3.3 Append the `5.4` group (the ten files in design.md D5) to `MIGRATED_SCREENS` after `5.3`
      and set `MIGRATED_FILE_FLOOR = 33`. Verify: `npx jest src/design/screen-migration.contract`
      passes, and inject-and-revert: `themeColor="textSecondary"` on a `ThemedText` in
      `changelog-content.tsx` fails it naming `changelog-content.tsx:<line> theme-color-prop`.
- [x] 3.4 Parallel 5.5. Before opening the PR, `git fetch origin && git rebase origin/main`. If 5.5
      landed first, resolve the allowlists by keeping both slices' deletions, set every ceiling to
      the surviving entry count per category, and set `MIGRATED_FILE_FLOOR` to the listed-file count
      with both groups (slice order 5.4 before 5.5). Verify: `npx jest tools/eslint-rules src/design`
      passes after the rebase.
- [x] 3.5 Re-run 0.2's greps on the ten contract files. Verify: the only hits are
      `StyleSheet.create`, style arrays with `laneStyle`, `Spacing.` tokens and `RefreshControl`'s
      `theme.primary` in `activity-screen.tsx`, and `StyleSheet.create` + `Spacing.` in
      `changelog-content.tsx`. Record the before/after counts for the PR.

## 4. Local verification

- [x] 4.1 `npx tsc --noEmit` passes.
- [x] 4.2 `npm run lint` passes with zero warnings.
- [x] 4.3 `npm test -- --coverage` passes, including the 90% per-file branch tiers
      (`list-section.tsx` among them), the allowlist suites, the migrated-screen, design
      import-graph and fixture contracts, `e2e/maestro-selectors` and FR/EN parity. Record suite and
      test counts for the PR.
- [x] 4.4 Selectors. Verify: `git diff --stat -- .maestro e2e` is empty and every selector in the
      list above still appears in `src` (`rtk proxy rg -n "<id>" src`).
- [x] 4.5 From the repo root, `openspec validate mobile-ds-activity-changelog` passes.

## 5. Architecture Book (`docs/mobile/architecture-book/`)

- [x] 5.1 `theming.md` → Lists (`:296-350`): `ListSection`'s title is `ListSectionHeader`,
      exported for virtualized lists' section headers, with the optional `detail` line
      (`footnote`/`secondary`) and the one-heading rule; name its gallery story and test. → Status:
      Activity's first load is a `screen` loading state and its pagination footer an `inline` one.
      Verify: `rtk proxy rg -n "ListSectionHeader" docs/mobile/architecture-book/theming.md` matches.
- [x] 5.2 `accessibility.md:91`: a `ListSection` title or `ListSectionHeader` is a `header`; with a
      detail it is one heading element named by the caller label or "title, detail". Gate:
      `src/design/list/list-section.test.tsx`. Verify: the line names the test.
- [x] 5.3 `lint-format.md`: Status bullet (`:334-349`) lists only "developer import 5.7" and the
      ceiling (1); `testing.md:108` if it states the number. Style-literal paragraph (`:510-520`):
      update any stated ceiling numbers. Migrated screens (`:532-546`): no rule text changes; the
      floor is not stated. Verify: `rtk proxy rg -n "Activity 5\.4|CEILING. \(2\)" docs/mobile/architecture-book`
      finds nothing.
- [x] 5.4 `features.md`: `:125-128` Activity loading is `StatusView`; `:163-165` drop Activity from
      "keep their own spinners"; `:172-174` Activity group headers are `ListSectionHeader`
      (calendar name, change time as detail); `:236` Changelog sheet Close is unchanged (verify the
      text still holds); `:345-347` changelog content is a `ListSection` per release with static
      `ListRow`s with a leading icon. Verify: `rtk proxy rg -n "keep their own spinners" docs/mobile/architecture-book/features.md`
      no longer names Activity.
- [x] 5.5 `CHANGELOG.md`: add `## 2026-10-27 — Activity and the changelog on the design system`
      above the current first entry, with bullets for `ListSectionHeader` (theming.md → Lists,
      accessibility.md), Activity loading on `StatusView` (theming.md → Status, features.md), the
      changelog as list sections and static rows (features.md), the allowlist deletions and ceilings
      (lint-format.md), and the ten files on the migrated-screen contract with
      `MIGRATED_FILE_FLOOR` 33 (lint-format.md → Migrated screens). Verify: the entry is first and
      every link resolves.
- [x] 5.6 Commit. Verify: `npm run lint`, `npm test -- --coverage` and the openspec validate still
      pass.

## 6. CI proof

- [ ] 6.1 The runtime change is primitive and screen composition. CI proves it through
      `list-section.test.tsx` (90% tier), `list-section.gallery.test.tsx` and the registry a11y
      matrix, `activity-screen.test.tsx`, `changelog-screens.test.tsx`, the allowlist suites
      (lowered ceilings), `screen-migration.contract.test.ts` (floor 33) and `lint-mobile` at zero
      warnings. Verify: after push, the PR's mobile jobs in `.github/workflows/ci-mobile.yml` are
      green, and the `test-mobile` log lists those five test files.

## 7. Device verification

- [x] 7.1 iOS simulator pass (conductor-owned; Xcode 26.6 build on the Mac), light and dark, at the
      default text size and at AX5:
      - **Gallery:** `timecalendar-dev://developer/gallery/list-section--header-detail`.
      - **Activity:** cold open (loading: spinner + "Loading recent changes"), the empty state, the
        empty-failure state (offline, pull to refresh), the populated timeline with two or more
        groups (headers match the hidden-events section titles; groups are spaced like sections),
        the older-page footer while loading, and the cached-failure notice.
      - **Changelog:** About → What's new (history), and the sheet at the formSheet detent: rows
        wrap at AX5 with no clipped last word, Close and Continue both acknowledge and dismiss.
      Verify: screenshots for the PR, and list by name anything not checked.
- [ ] 7.2 Android device pass (conductor-owned, on the Windows host via `ssh pc`, never on the Mac),
      light and dark, at font scale 1.0 and 2.0: the same states as 7.1. Check the Activity header
      title is the M3 `label` in the action color with the time below, and the changelog rows are
      M3 segments with flat icons. Verify: screenshots for the PR. If the host is unreachable,
      record that in the PR and leave this unchecked; it does not block the merge.
      Host unreachable on 2026-10-27 (`ssh pc` timed out); see
      inbox/2026-10-27-mobile-ds-activity-changelog-android-device-pass.md.
- [ ] 7.3 VoiceOver and TalkBack pass (HUMAN: see inbox/2026-10-27-mobile-ds-activity-changelog-screen-reader-pass.md).
      Skip and continue. This does not block the PR.
