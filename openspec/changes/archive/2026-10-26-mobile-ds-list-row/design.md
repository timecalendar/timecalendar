# Design

## Context

See proposal.md → Why. Current state the approach builds on:

- **Compose row semantics today.** `ComposeListRow` (`src/components/chrome/native-list.tsx`)
  passes `ListItem` the modifiers `[...segment, testID(id), clickable(handler)]` and nothing else.
  `hint` and `accessibilityLabel` are read only on the SwiftUI path (`accessibilityHint`,
  `accessibilityLabel`, `accessibilityValue` modifiers).
- **What the installed `@expo/ui` (56.0.17) can express on Compose**, from
  `node_modules/@expo/ui/src/jetpack-compose/modifiers/index.ts` and
  `android/src/main/java/expo/modules/ui/ModifierRegistry.kt`:
  - `clickable(handler, { indication })` maps to `Modifier.clickable { … }`, with no `role` and no
    `onClickLabel`.
  - `semantics({ contentType })` sets only `contentType` (autofill).
  - `selectable(…, role)` and `toggleable(…, { role })` accept only `radioButton | checkbox |
    switch | tab`.
  - `testID` maps to `testTag` plus `testTagsAsResourceId`.

  No modifier sets `contentDescription`, `stateDescription`, `Role.Button` or a click label. The
  same file exposes `object ModifierRegistry { fun register(type, factory); fun unregister(type) }`,
  and its doc comment says to "pair with `register` from `OnCreate` / `OnDestroy`". The JS side
  sends any `{ $type, …params }` object, and `applyModifiers` folds unknown types to a no-op. Expo UI
  depends on Compose UI 1.10.6. Its semantics API (checked in the 1.9.x `ui-android` classes) has
  `contentDescription`, `stateDescription`, `role` and `onClick(label)`, and no hint or tooltip
  property.
- **React Native Android delivers `accessibilityHint` as `AccessibilityNodeInfo.tooltipText`**
  (`ReactAccessibilityDelegate.kt`, RN 0.85.3). TalkBack reads it after the name.
- **Jest projection.** `jest/setup-expo-ui.ts` maps Compose modifiers onto RN props.
  `selectableProps` sets `accessibilityRole: "button"` for any `clickable`. Real Compose does not.
  `registry.test.ts`'s a11y check reads these projections, so it currently passes Android rows
  that TalkBack hears without a role.
- **Hand-built rows** (`duplication-and-drift.md` §A7, §A10) and their consumers:
  - `timezone-chooser-screen.tsx`: plain FlatList, about 600 rows, hairline bottom border, opacity
    press, a "Selected" word, disabled unavailable rows.
  - `school-row.tsx` + `row-separator.tsx`: plain FlatList. The logo is leading, the chevron is
    iOS-only, the press is a ripple on Android and a `backgroundSelected` highlight on iOS, and the
    separator is iOS-only. Maestro flow 01 taps the row by its exact name, "My Gaming Academia".
  - `hidden-events-screen.tsx`: two titled groups of static card rows, each with a trailing
    "Unhide" `Button`.
  - `activity-screen.tsx`: SectionList card rows with a colored kind word, title, time and change
    lines. The pressable kinds take a label-only `accessibilityLabel`, so the change lines are
    never announced.
  - `personal-events-list.tsx`: FlatList card rows with a 24 px color swatch, opened through
    `Link asChild`.
  - `provider-selection-screen.tsx`: FlatList cards with a 56 px thumbnail and a hairline border.
  - `school-group-picker-screen.tsx`: the dormant `GroupNode` tree.
- **Seam geometry** (theming.md → Native-chrome wrapper seam).
  - Android: `surfaceContainer` segments 2 dp apart, 20/4 dp corners, 16 dp side margins, no
    dividers, no chevron. `bodyLarge` headline, `bodyMedium` supporting, flat 24 dp leading icon
    in `onSurfaceVariant`. Every Compose host is seeded with `primary`, and Expo UI derives the
    scheme with `SchemeTonalSpot(seed, isDark, 0.0)` (`colors/MaterialColors.kt`).
  - iOS: inset-grouped Form cells, 29 pt `primaryStrong` icon tile, footnote-semibold
    `chevron.forward` in `textTertiary`, a `primary` checkmark, full-row highlight.
- Rules in force:
  - ADR 067: closed variants, layout-only `style` merged last.
  - ADR 068: family folders, the barrel, leaf imports inside `src/design/`, layering
    `@/theme` ← chrome ← design.
  - L10: every `src/design/**/*.tsx` has a fixture and a test.
  - L11: the registry renders light/dark × iOS/Android.
  - `known-a11y-violations.ts` only shrinks.
  - Memory and theming rules: cap `numberOfLines` (N > 0) and never use `ellipsizeMode="clip"`.
    `Link asChild` children take a flattened style.
- The school-group route is dormant by spec (`mobile-school-selection` → "retained dormant and is
  reached by nothing"; "does not implement, enable, or extend school groups").

## Goals / Non-Goals

**Goals:**

- TalkBack hears an Android `NativeListRow` the way VoiceOver hears the iOS one: name, value,
  hint, and the button role on activatable rows.
- One RN row, section and separator for lists the native seam cannot host. The same numbers and
  colors as the seam, by construction rather than by eye.
- Types that make the common row mistakes unrepresentable: a nested control in a pressable row,
  a color or height override, a row without a `testID`.
- Each migrated list keeps its selectors, routes, hints and (where a spec pins it) its accessible
  name.

**Non-Goals:**

- Swipe actions, reordering, multi-select, an `expanded` disclosure state, section index rails,
  sticky headers inside `ListSection`.
- `Badge` and `ColorDot` (3.7). The personal-event swatch stays a caller element.
- Event tiles, Home, the calendar renderer and its chooser.
- Changing the iOS SwiftUI seam or the seam's public props.

## Decisions

### D1. Compose semantics through a custom Expo UI modifier in a local module

A new local Expo module `mobile/modules/compose-semantics/` (Android only;
`expo-module.config.json` lists `expo.modules.composesemantics.ComposeSemanticsModule` under
`android.modules` and `"platforms": ["android"]`) registers one modifier type,
`timecalendarSemantics`, in `OnCreate` with `ModifierRegistry.register`, and unregisters it in
`OnDestroy`. The factory reads `contentDescription: String?` and `role: String?` (`"button"` only)
from the config map and returns
`Modifier.clearAndSetSemantics { contentDescription = …; if (button) role = Role.Button }`. The
module's `android/build.gradle` applies the Kotlin Compose compiler plugin, enables `compose`, and
depends on the `expo-ui` Gradle project plus `androidx.compose.ui:ui-android` at Expo UI's
version (1.10.6). Autolinking picks the module up from `modules/` like
`calendar-focus-observer`; no config plugin is needed.

JS side: `src/components/chrome/compose-semantics.ts` exports
`composeSemantics({ contentDescription, role? }): ModifierConfig` and returns the plain
`{ $type: "timecalendarSemantics", contentDescription, role }` object. It is the only place that
names the type string. `ComposeListRow` appends it **last** in its modifier array. On one layout
node Compose folds semantics from the innermost modifier outward, and a clearing modifier drops
what lies inside it. As the last entry it clears `ListItem`'s own content (headline, supporting,
trailing texts) while the `testID` tag and `clickable`'s action and ripple, which sit outside it,
survive. A Jest test pins the order.

Rejected:

- `patch-package` on `@expo/ui` to widen `semantics`/`clickable`: a patch on an alpha package
  that every bump must re-apply, and the registry already offers an extension point.
- A React Native wrapper with `accessibilityLabel` around each row: Compose rows live inside one
  `LazyColumn` host, so there is no RN view per row.
- Waiting for upstream: no release in reach adds a role or description to `clickable`.
- `Modifier.semantics` without clearing: whether TalkBack then speaks the merged child text
  besides the description varies, so the announcement would depend on the TalkBack version.

### D2. What the Android row announces

- `contentDescription` = the row's name (`accessibilityLabel`, else `label`, else
  `label, subtitle`, the iOS default), then `value`, then `badge`, then `hint`, joined with `", "`
  by `joinRowName` (`src/design/list/row-name.ts`) and skipping absent parts.
- Navigation and action rows add `role = Role.Button`. A value row gets the description and no role.
- The `badge` is in the description. On iOS the row's `accessibilityLabel` replaces the button's
  children, so the label is the name followed by the badge.

TalkBack therefore reads "Calendar name, School, Shown, Opens this calendar's settings, Button".
VoiceOver reads the same parts in the order name (and badge), value, button, hint.

Rejected:

- Hint as `onClick(label = hint)`: TalkBack says "Double-tap to <label>", but the app's hints are
  sentence-form ("Opens …" / "Ouvre …") and shared with iOS. The result would be ungrammatical in
  both languages, or the copy would need to fork per platform.
- Value as `stateDescription`: it would be read after the hint, which separates the value from
  its name.

### D3. The Jest mock tells the truth about Compose

In `jest/setup-expo-ui.ts`, `selectableProps` derives `accessibilityRole` from `selectable`
(radio), `toggleable` (switch) or the `timecalendarSemantics` modifier's `role`. It no longer
derives it from `clickable`. It also projects that modifier's `contentDescription` to
`accessibilityLabel`. A bare `clickable` then projects as an unlabeled Pressable without a role,
which matches what TalkBack meets. The registry a11y check would report it. Only `ComposeListRow`
uses `clickable`, and D1 fixes it, so `known-a11y-violations.ts` stays at three entries.

### D4. `ListRow` contract (type-encoded)

```ts
export type ListRowPosition = "first" | "middle" | "last" | "single"
export type ListRowLeading =
  | { icon: { ios: SFSymbol; android: MaterialGlyph } }
  | { element: ReactElement; width: number }
export type ListRowOverline = {
  text: string
  tone: "positive" | "informational" | "destructive"
}

type ListRowBase = {
  label: string
  subtitle?: string
  details?: readonly string[]
  overline?: ListRowOverline
  value?: string
  leading?: ListRowLeading
  destructive?: boolean
  accessibilityLabel?: string
  testID: string
  position?: ListRowPosition
  style?: StyleProp<ListRowLayoutStyle> // ButtonLayoutStyle keys, merged last
}
type ListRowAction = {
  hint?: string
  selected?: boolean
  disabled?: boolean
  trailing?: "chevron"
} & ({ onPress: () => void; href?: never } | { href: Href; onPress?: never })
type ListRowStatic = {
  onPress?: never
  href?: never
  hint?: never
  selected?: never
  disabled?: never
  trailing?: ReactElement // one accessory control, e.g. a small text Button
}
export type ListRowProps = ListRowBase & (ListRowAction | ListRowStatic)
```

- `href` rows call `router.push(href)`, the seam's `activateRow`. No `Link asChild`, so the
  Slot style-array crash cannot occur.
- `selected` draws a trailing check on both platforms: SF `checkmark`, subheadline-semibold, in
  `primary` on iOS, as in the seam's choice row; Material `check` in `primary` on Android. `check`
  is added to `MATERIAL_GLYPHS`, with its codepoint pinned in `icon.test.tsx`. The check renders
  after the `value`.
- `trailing="chevron"` renders `Icon ios="chevron.forward"` (footnote-semibold size,
  `textTertiary`, `scaling="text"`, `maxFontSizeMultiplier={ChevronMaxFontScale}`) on iOS only.
  Android shows no chevron, matching the seam and M3.
- `leading.icon` matches the seam: on iOS a white glyph on a 29 pt `primaryStrong`
  continuous-rounded tile; on Android a flat 24 dp glyph in the list palette's secondary color.
  `leading.element` is the caller's element in a box of the given width, vertically centered.
- No color, height, padding or font prop. `style` takes layout keys only.
- `label` and `subtitle` follow the seam's prop names, so one row vocabulary spans both list APIs.
  The proposal sketch said `title`. Rejected: `title` (a second name for the same slot);
  `leading: ReactNode` with no width (separators and the stacked layout need the leading width);
  `trailing: "check"` (selection is state, so it is a boolean that also drives
  `accessibilityState`).

### D5. One geometry source: `ListGeometry` in `@/theme`

`src/theme/tokens.ts` gains:

```ts
export const ListGeometry = {
  rowPaddingHorizontal: 16,
  leadingGap: 16,
  ios: {
    rowMinHeight: 44,
    rowPaddingVertical: Spacing.twoHalf,
    leadingIconTile: 29,
    groupedRadius: { glass: 26, legacy: 10 },
  },
  android: {
    rowMinHeight: 56,
    rowPaddingVertical: Spacing.two,
    leadingIcon: 24,
    outerRadius: 20,
    innerRadius: 4,
    segmentGap: 2,
    listInset: 16,
  },
} as const
```

- `native-list.tsx` replaces `OUTER_RADIUS`, `INNER_RADIUS`, `SEGMENT_GAP` and `LIST_INSET` with
  `ListGeometry.android.*`. Its existing corner and padding assertions keep passing unchanged.
- Primitives pick the platform branch with `Platform.OS` at render. A module-evaluation
  `Platform.select` would freeze one branch under `usePlatform`.
- iOS grouped corners use `glass` on iOS 26 and later (`Platform.Version`) and `legacy` below.
  (Unverified against SwiftUI's rendered Form; the `list-section--seam-comparison` story is the
  device check, and a mismatch is a one-number token edit.)
- `theme.test.tsx` pins the values. `segmentPosition` (first/middle/last/single) becomes a pure
  `listRowPosition(index, count)` in the leaf `@/design/list/list-row-position`, exported from
  `@/design`. The seam imports that leaf directly (chrome may import design leaves), so there is one
  copy.

### D6. Colors: theme tokens on iOS, the seeded Material palette on Android

`src/components/chrome/list-palette.ts` exports
`useListPalette(): { surface: string; text: string; textSecondary: string }`.

- iOS returns `backgroundElement`, `text` and `textSecondary`. These are documented AA pairs, and
  the inset-grouped cell reads as a card on the app's `background`.
- Android returns `surfaceContainer`, `onSurface` and `onSurfaceVariant` from Expo UI's
  `getMaterialColors({ scheme, seedColor: theme.primary })`, with the scheme resolved through
  `@/hooks/use-color-scheme`. The result is cached per `scheme:seed` in a module `Map`: it is a
  synchronous native call, and a 600-row list must not repeat it. Compose hosts derive their
  palette from the same seed through the same `SchemeTonalSpot` call, so the RN segments and the
  seam's segments are the same color in both schemes.
- Plain (ungrouped) rows draw no surface and use `text` / `textSecondary` on the page background
  on both platforms.
- Overline tones use the `positive` / `informational` / `destructive` tokens.

Rejected: the proposal's sampled `listSurface` token pair. It would be unverified constants that
drift whenever the seed or Expo UI's scheme variant changes.

### D7. Grouped vs plain, and who draws separators

- **Grouped**:
  - Where: a `ListRow` inside `ListSection` (position from context, null children filtered like the
    seam), or a `ListRow` with an explicit `position` (virtualized lists, from
    `listRowPosition(index, count)`).
  - iOS: `surface` fill, corners by position, and a bottom `Separator` inset to the row's text
    start on every row except `last`/`single`.
  - Android: `surface` fill, `outerRadius`/`innerRadius` by position, `segmentGap` below every row
    except `last`/`single`, no separators.
- **Plain**: a `ListRow` without section or position. No fill, no corners. Separators come from
  `ItemSeparatorComponent={ListRowSeparator}`. `ListRowSeparator` (`leadingWidth?`) renders
  `Separator` inset to the text start on iOS and `null` on Android. It is the iOS plain-list and
  M3 list convention, and it keeps the platform branch out of call sites (proposal §5).
- `ListSection` adds no horizontal margin: the page lane (`RootPage` `laneStyle`) owns the side
  inset, as everywhere else in RN pages.
  - Title: iOS `footnote` in `textSecondary`, inset by `rowPaddingHorizontal`; Android `label` in
    `action` tone (the seam's `titleSmall`/`primary`, on the AA `actionText` token). Both carry
    `accessibilityRole="header"`.
  - Footer: `footnote` in `textSecondary`.
  - Sections stack with `Spacing.four` between them.
- `Separator` (`inset?: "none" | "leading" | { leadingWidth: number }`, default `"none"`): a
  `separator`-colored line, `StyleSheet.hairlineWidth` on iOS and 1 dp on Android (M3 divider),
  hidden from assistive technology.
  - `"leading"` starts at `rowPaddingHorizontal`.
  - `{ leadingWidth }` starts at `rowPaddingHorizontal + leadingWidth + leadingGap`, the text start
    of a row with that leading element. The formula lives once.

  Rejected: a raw `number` inset (call-site geometry, the drift A10 records).

### D8. States and press feedback

- iOS: on press, the whole row fills `backgroundSelected`, the UITableView/SwiftUI row highlight
  the seam keeps, inside the row's corner shape.
- Android: `android_ripple={{ color: ripple, foreground: true }}`. Foreground is the New
  Architecture workaround already used by `SchoolRow`. The ripple is clipped by `overflow:
  "hidden"` on the shaped row.
- `disabled` dims the row to `StateOpacity.disabled`, blocks activation, shows no feedback and
  exposes `{ disabled: true }`.
- A static row has no feedback. `destructive` labels in `destructive`.

### D9. Size and text scaling

- Minimum height comes from `ListGeometry` (44 / 56). Rows grow with content; nothing has a fixed
  height.
- Line caps (N > 0, default tail ellipsis):
  - `label` 8 lines, each `subtitle`/`details` line 8, `value` 4, `overline` 2.
  - Label `body` (seam `bodyLarge`), supporting lines `callout` in the secondary color, overline
    `label`, value `body` in the secondary color.
- At accessibility text sizes (`useIsAccessibilityTextSize()`), the `value` and the check move
  under the label column, and the leading element stays top-aligned. The seam does the same on
  iOS; here both platforms do it.
- When the `label` has no whitespace at those sizes, it renders on one line with
  `adjustsFontSizeToFit` and `minimumFontScale={0.5}`, the seam's `minimumScaleFactor` rule, so
  `gallery.stress.word` never breaks mid-word.
- No `allowFontScaling={false}` (L8).

### D10. Semantics (React Native rows)

- **Action row**: one `Pressable` element.
  - `accessibilityRole="button"`.
  - `accessibilityLabel` = `accessibilityLabel ?? [overline?.text, label, subtitle,
    ...details].join(", ")`. Absent parts are skipped, and the seam's default is the subset.
  - `accessibilityValue={{ text: value }}` when present, plus `accessibilityHint`.
  - `accessibilityState={{ selected, disabled }}`, derived and never passed.
  - Leading elements and icons are hidden from assistive technology
    (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`).
- **Static row**: the text column is one `accessible` element with the same composed label and
  value and no role. The accessory is its own control after it, which gives reading order text
  then action.
- **Section**: the title is a header.

### D11. Call-site mapping (testIDs kept) and deferrals

| File | Shape | Mapping |
| --- | --- | --- |
| `settings/ui/timezone-chooser-screen.tsx` | plain | `label` = city, `subtitle` = territory ?? id, `details` = [id] when a territory exists, `value` = offset ?? unavailable, `selected` = active, `disabled` = unavailable, `accessibilityLabel` = `${city}, ${territory ?? id}`, `onPress` = select; `ItemSeparatorComponent={ListRowSeparator}`; `testID` `timezone-result-${id}`; `settings.timezone.selected` key removed (EN/FR) |
| `school-selection/ui/school-row.tsx` | plain | `label` = name (accessible name stays the bare name for flow 01), `leading` `{ element: <SchoolLogo/>, width: LogoSize }`, `trailing="chevron"`, `hint`, `onPress` unchanged; `testID` `onboarding-school-row-${id}`; leaves the raw-button allowlist |
| `school-selection/ui/school-picker-screen.tsx`, `row-separator.tsx` | — | `ItemSeparatorComponent` becomes `ListRowSeparator` with `leadingWidth={LogoSize}`, on both platforms (it renders nothing on Android); `row-separator.tsx` deleted |
| `hidden-events/ui/hidden-events-screen.tsx` | grouped | each group is a `ListSection` (`hidden-events-name-section`, `hidden-events-uid-section`) titled by the existing keys; `HiddenRow` becomes a static `ListRow` (`hidden-events-name-${name}` / `hidden-events-uid-${uid}`) with the "Unhide" `Button` (`variant="text"`, `size="small"`, same label and accessible label) as `trailing` |
| `activity/ui/activity-screen.tsx` | grouped, virtualized | `overline` = kind word with tone positive/informational/destructive, `label` = title, `subtitle` = time, `details` = change lines, `position` from the section index, `accessibilityLabel` = kind label, time and spoken change lines joined; `href` `/event-details/${uid}` for new/changed, static for cancelled; testIDs `activity-${kind}-${uid}` kept; `ActivityGroupHeader` unchanged |
| `personal-events/ui/personal-events-list.tsx` | grouped, virtualized | `label` = title, `subtitle` = range, `details` = [location] when set, `leading` `{ element: swatch View, width: 24 }`, `trailing="chevron"`, `href` `/personal-event-form?uid=…`, `accessibilityLabel` = title and hint unchanged (spec pins them); `Link asChild` removed; `personal-event-row-${uid}` kept |
| `export-guides/ui/provider-selection-screen.tsx` | grouped, virtualized | `label` = provider label, `subtitle` = "image unavailable" copy when the thumbnail failed, `leading` `{ element: thumbnail Image, width: 56 }` when present, `trailing="chevron"`, `hint` and `accessibilityLabel` unchanged; `export-guide-provider-${slug}` kept |

Grouped virtualized lists drop the content-container `gap`: the row draws its own segment
spacing.

**Deferred**, each with its reason, and none on the separator allowlist except Home:

- `school-selection/ui/school-group-picker-screen.tsx` `GroupNode`: the route is dormant by spec
  and reached by nothing, and its expand/collapse tree needs an `expanded` state that no other row
  has. Building it into `ListRow` would be speculative API for a route that later cleanup
  removes. It stays as is; its "Confirm" stays on the raw-button allowlist (5.5).
- `home/ui/today-timeline.tsx` hairline: Home is slices 3.9/5.9, and the owner decision keeps
  tiles untouched here. It is the one entry on the new separator allowlist.
- `calendar/renderer/**` grid hairlines (rendering, not list separators, A10) and
  `owned-calendar-chooser.tsx` (custom Modal, slice 5.10).

### D12. Lint: `local/no-ad-hoc-separator`, ratcheted

- `tools/eslint-rules/no-ad-hoc-separator.js` reports a `Property` whose key is
  `borderBottomWidth`, `borderTopWidth` or `height` and whose value is the member expression
  `StyleSheet.hairlineWidth`. Message: "List separators are Separator / ListRowSeparator from
  @/design (ADR 073, lint-format.md → Lists)."
- Block `timecalendar/ad-hoc-separator`: `files: ["src/**/*.{ts,tsx}"]`; ignores `src/design/**`,
  `src/theme/**` (the token swatch table), `src/features/calendar/renderer/**`, tests and
  `adHocSeparatorAllowlist`.
- Allowlist: `src/features/home/ui/today-timeline.tsx` (5.9). `ad-hoc-separator-allowlist.test.js`
  mirrors `raw-text-input-allowlist.test.js`: ceiling 1, entry exists, entry still violates, no
  duplicates.
- `borderWidth` (rings: school logo, header icon, checklist box) is deliberately not matched.
- Caveat: a value through a variable (`const line = StyleSheet.hairlineWidth`) is not followed;
  review covers it.
- `raw-button-allowlist.js` drops `school-row.tsx`, and `RAW_BUTTON_ALLOWLIST_CEILING` becomes 13.
- **No row rule.** No static pattern separates an ad-hoc list row from a legitimate tile or card
  `Pressable` (rows wrap text in layout views, which `no-raw-button` already skips). The rule
  stays prose in accessibility.md and lint-format.md, backed by the gallery and review.

Rejected: a row-shape heuristic (minHeight plus Pressable plus FlatList `renderItem`). It is
noisy, and it would flag Home and calendar tiles the owner placed in 3.9.

### D13. Gallery

| Module | Meta | Stories (`<meta>--<kebab>`) |
| --- | --- | --- |
| `list/list-row.gallery.tsx` | `list-row` | `Plain` (navigation rows with chevron, a leading element, a disabled row, `ListRowSeparator`), `Grouped` (positions via `listRowPosition`), `States` (selected with value, disabled, destructive), `Leading` (icon and element), `Static` (accessory text `Button`), `Overline` (three tones with details), `LongStrings` (`gallery.stress.title`/`body`/`word`/`action` across every slot, with a caption naming whether the accessibility text-size layout is active) |
| `list/list-section.gallery.tsx` | `list-section` | `Titled` (title, footer, three rows), `Single`, `SeamComparison` (the same three rows through `ListSection` and, below it in `flex: 1`, through `NativeList`/`NativeListSection`/`NativeListRow`), `LongStrings` |
| `list/separator.gallery.tsx` | `separator` | `Insets` (`none`, `leading`, `{ leadingWidth: 40 }` between rows) |

Each interactive story shows a press count (`gallery.pressCount`). New FR/EN keys sit under
`gallery.listRow.*`, `gallery.listSection.*` and `gallery.separator.*`. Registry order puts
`list-row`, `list-section` and `separator` after `date-time-field`. Colocated
`*.gallery.test.tsx` cover the press count and the static accessory.

### D14. Tests and coverage

- `list-row.test.tsx`, `list-section.test.tsx` and `separator.test.tsx` run `describe.each`
  over iOS and Android (`usePlatform`), drive font scale by mocking `useWindowDimensions`, and await
  every RNTL helper. They cover:
  - geometry per position from `ListGeometry`, and surface/text colors from the mocked
    palette (Android `#surfaceContainer`) and theme (iOS);
  - press feedback per platform, disabled blocking, `href` push;
  - the composed name, value, hint and state;
  - static grouping with its accessory;
  - chevron iOS-only, check both, line caps, the accessibility-size stack and the single-word
    shrink;
  - `ListRowSeparator` null on Android;
  - `listRowPosition` and the type tests (`@ts-expect-error` on an accessory in an action row,
    `onPress` with `href`, a color in `style`).
- `chrome/compose-semantics.test.ts` and `chrome/list-palette.test.ts` cover the config shape and
  the cache (one `getMaterialColors` call per scheme and seed, iOS never calls it).
- `native-list.test.tsx`, new Android block:
  - an action row with `accessibilityLabel`, `value` and `hint` projects `accessibilityRole
    "button"` and `accessibilityLabel` "name, value, hint";
  - a navigation row without `accessibilityLabel` uses "label, subtitle";
  - a value row has a description and no role;
  - the raw modifier array has `timecalendarSemantics` as its last entry, after `testID` and
    `clickable`.
- 90% lines/branches tiers in `jest.config.js` for `src/design/list/*.tsx` (not fixtures) and
  `src/components/chrome/{compose-semantics,list-palette}.ts`.

### D15. ADR 073

`decisions/073-list-row-family.md` records:

- D1–D2: the Compose semantics extension, its description order, and the rejected patch,
  click-label and non-clearing options;
- D4–D7: the row contract, `ListGeometry` as the one geometry source, the seeded palette, and the
  grouped/plain split;
- D12: the separator ratchet and why rows have no lint.

The number was free on `origin/main` (072 is the latest) with no open PR reserving one. Re-check
`decisions/README.md` and open PRs before writing; take the next free number if 073 is gone.

## Risks / Trade-offs

- [The local module's `OnCreate` runs after the first list renders, so the modifier is unknown and
  silently dropped] → `applyModifiers` folds an unregistered type to a no-op (no crash). The
  Android Maestro assertion in flow 03 fails if the hint never reaches the node. If device evidence
  shows late registration, register from the module's `init` or call
  `requireNativeModule("ComposeSemantics")` at the top of `compose-semantics.ts` on Android to force
  creation first.
- [Clearing semantics also drops `clickable`'s action or the test tag on some Compose version] →
  ordering is pinned by test. The Maestro step taps and asserts the same row by id, and flow 03
  already taps it, so a lost tag or action fails the native lane. The fallback is for the factory
  to also set `onClick` (dispatching the existing event) inside the cleared block.
- [The Android module does not compile (Gradle project name, Compose compiler plugin version)] →
  `npx expo prebuild --platform android` plus `./gradlew :app:assembleDebug` on the Windows host
  (`ssh pc`, never the Mac), or a dispatched `ci-mobile-e2e.yml` run on the branch, before merge.
- [Seeded palette colors on Android and status-tone overlines on `surfaceContainer` are runtime
  values, so the static contrast gate cannot see them] → M3 tone math guarantees `onSurface` /
  `onSurfaceVariant` on `surfaceContainer`. The status overlines go to the device pass in the inbox
  note.
- [iOS grouped radius and padding differ from SwiftUI's Form] → the seam-comparison story makes the
  difference visible. The fix is a token edit.
- [Visual change on six screens: heights, highlight, grouped cards, Android dividers gone from the
  timezone list] → intended convergence on the seam; gallery and device pass. Copy, routes and
  selectors stay.
- [Activity's longer accessible name] → it now carries what the row shows. Previously the change
  lines were unreachable.

## Migration Plan

One PR in three commits:

1. Part A: module, chrome modifier, mock honesty, Android tests and the Maestro step.
2. The primitives with `ListGeometry`, the palette hook, gallery and lint.
3. Call sites and docs.

Rollback is a revert. Nothing persists and the app is not in production.
