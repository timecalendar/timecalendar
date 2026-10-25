# Theming & native-chrome

The design-token home and the **insurance layer** against alpha-API churn. Entries below are pointers plus the caveats tooling can't carry (R-1) — every rule that can be a type or a lint gate is one, and the prose states what can't be encoded.

## Visual language — native calm with calendar color

TimeCalendar is a native-first iOS and Android app with a quiet neutral foundation, a pink
brand accent, and a pastel calendar spectrum. The target is colorful and joyful without
making every control colorful. The platform owns the chrome; TimeCalendar's identity appears
through its brand color, calendar data, and logo-derived graphic language.

### Color roles

- **Pink is the brand and action color.** It identifies TimeCalendar and tints primary actions,
  active navigation, links, selection, and the current-time indicator. It does not need to fill
  every header or large surface to make the app recognizable. Header bar buttons and back
  buttons are not pink: they take the `text` label color (see `navigation.md`).
- **Pastel colors belong to calendars and events.** The logo and real schedules establish the
  character: pale lilac, pink, blue, green, yellow, coral, and neighboring generated hues. A
  busy calendar is intentionally a soft mosaic. Event colors are user/data values, not semantic
  theme tokens and not additional brand colors.
- **Status colors keep their meaning.** Success, warning, error, and destructive states use
  dedicated semantic colors. An arbitrary event green is not a success state, and an arbitrary
  event coral is not an error state.
- **Neutral system surfaces remain dominant.** Backgrounds, lists, fields, sheets, and most
  controls use scheme-appropriate neutral tokens. As a working visual balance, a screen is
  mostly neutral, with contextual event color used sparingly and pink reserved for brand and
  action.

### How event color appears outside the calendar

Use a small vocabulary consistently:

1. **Dot:** identifies a calendar, subject, or event in a list or summary.
2. **Wash:** gives a card, selected item, or contextual header a very pale version of one event
   color. Text remains on a verified neutral foreground rather than inheriting the event color.
3. **Block:** uses the stronger pastel fill for actual event geometry in a timeline or calendar
   grid. This is where the spectrum can be most visible.
4. **Mosaic:** uses a small, structured group of rounded rectangles derived from the blocks in
   the TimeCalendar logo. It is suitable for a welcome surface or empty state when no real event
   colors are available.

Prefer color that comes from the content. A Home summary can show dots for that day's events,
and upcoming cards can use their event's pale surface. Event details should feature one
contextual event color, not a rainbow of unrelated accents.

Do **not** add a colored leading rail or rounded left border to generic cards. It reads as a
decorative template rather than TimeCalendar. Also avoid loose confetti or cake-sprinkle
shapes. When a decorative composition is useful, use the logo's aligned calendar-block
geometry instead.

### Light and dark are equal designs

Every designed surface ships in light and dark mode. Dark mode is not an automatic inversion
or a late recoloring pass:

- choose neutral surfaces, separators, pastel washes, and strong event fills for each scheme;
- preserve the soft pastel identity without making dark surfaces muddy or neon;
- verify text and interactive-component contrast in both schemes;
- never assume imported/generated event colors can carry readable text; resolve an explicit
  foreground or keep the color decorative; and
- review dense calendar screens and sparse non-calendar screens on-device in both schemes.

Palette work must therefore define light and dark variants together. A new light-only visual
token or color treatment is incomplete.

School logos follow the nullable-pair contract in ADR 041. `SchoolLogo` reads the active scheme
through the single color-scheme seam, uses `imageUrlDark` in dark mode when present, and otherwise
uses the required `imageUrl`. The fallback is intentional because some schools publish no
credible reversed mark.

### Native platform expression

iOS and Android share product meaning and color roles, not necessarily component layout.
Prefer native components and platform conventions whenever the operating system provides the
pattern:

- **iOS:** native navigation bars and large titles where appropriate, trailing navigation-bar
  actions such as `+`, native tab bars, grouped lists, context menus/action sheets, SF Symbols,
  and native pickers and switches.
- **Android:** Material 3 top app bars, a FAB for the primary create action where appropriate,
  Material navigation bars, menus/bottom sheets, Material Symbols, and native Material pickers
  and switches.

Do not introduce an iOS FAB merely to share the Android layout, and do not move an Android
primary create action into an iOS-shaped header solely for visual parity. Platform-specific
composition is expected when the idioms differ. Custom visual design is concentrated in brand
surfaces and calendar content; native controls are tinted and composed rather than re-skinned.

## Token layer — typed TS constants under `src/theme/`

- `src/theme/tokens.ts` holds the design tokens as plain `as const` TypeScript: `Colors` (light/dark records, including the brand **`primary`**), `Spacing`, the `Radii` scale (radius is a token, not a magic number), `Fonts`, `MaxContentWidth`, and the interaction/elevation/motion/layout tokens below; `ThemeColor` is derived from `Colors`. **No styling runtime** (NativeWind / Tamagui / unistyles rejected, R-2 — `StyleSheet` + typed token constants is the pattern, and `tsc` is the only type gate). A missing/mistyped token key is a `tsc` error, not a silent fallback.
- **Brand `primary` token (the pink hue, ADR [008](./decisions/008-brand-color.md)):** `light.primary = #E91E63` (the Flutter `Colors.pink` identity tone — used as an **accent/tint**, e.g. the nav active tint, _not_ a fill carrying white body text), `dark.primary = #FF4081` (reads on the dark background). **The load-bearing usage rule:** white text on a brand fill MUST ride the darker **`#C2185B`** (white-on-`#C2185B` = 5.87:1, AA body) — the bright `#E91E63` is white-on-fill 4.35:1, below the body floor; `#E91E63` is the accent/large/UI tone (meets the 3:1 bar). Brand-colored small text (`ThemedText type="smallBold"` / `type="label"` text actions such as Skip, Back, See all, Un-hide) uses **`actionText`** (`#C2185B` light, 5.87:1), never `primary`; through `tone` it is `tone="action"`, and `TextTone` has no brand member. [`src/theme/brand-small-text.test.ts`](../../../mobile/src/theme/brand-small-text.test.ts) scans every non-test source under `mobile/src/` and fails on any element pairing `type="smallBold"` or `type="label"` with `themeColor="primary"`, in any prop order; the colocated `src/features/**` UI tests assert `Colors.light.actionText` on the existing labels. The **`primaryStrong` (#C2185B) + `onPrimary` (#ffffff) token pair LANDED** (2026-06-16, the onboarding welcome filled CTA — the first white-text-on-brand consumer, R-2: earned not speculative): a filled brand button is `primaryStrong` carrying `onPrimary` (5.87:1, AA body, scheme-independent — the fill owns its white label), clearing the 3:1 UI-component bar against `background` in both schemes. `tokens.ts`'s contrast block documents the pair.
- **Semantic Activity status tokens:** `positive` (`#146C43` light / `#7EE2A8` dark) identifies added items and `informational` (`#0B57D0` light / `#A8C7FA` dark) identifies changed items; cancelled items reuse `destructive`. Each item also carries a translated kind label, so color is never the only signal. `tokens.ts` documents every new foreground against `background` and `backgroundElement` in both schemes; all clear the 4.5:1 body-text floor.
- **Interaction, elevation, motion and layout tokens**:
  - `Spacing` carries `twoHalf` (12) and `fiveHalf` (48) between the existing steps.
  - `MinTouchTarget` is 44 on iOS and 48 elsewhere, resolved by `Platform.select` at module load like `Fonts`.
  - `IconSize` (`small` 14 / `medium` 17 / `large` 22 / `xlarge` 28).
  - `WordmarkMaxFontScale` (1.5) is the `maxFontSizeMultiplier` of text that carries the one-word brand name (Home app name, onboarding page titles). See [Accessibility](./accessibility.md).
- **Text-scale seam (`src/theme/text-scale.ts`):** `AccessibilityFontScale` (1.786), `isAccessibilityTextSize(fontScale)` and `useIsAccessibilityTextSize()`, which reads `useWindowDimensions().fontScale` and follows a live change. Layouts that change shape at accessibility text sizes read it; `src/theme/text-scale.test.ts` pins the threshold.
  - `StateOpacity` (`pressed` 0.65, `disabled` 0.55). `pressed` is the iOS press feedback only; Android pressed state is the `ripple` color.
  - `Elevation.raised` is a CSS `boxShadow` string per scheme (`Elevation.raised[scheme]`, passed to the RN `boxShadow` style prop). Elevation never uses the legacy `shadow*` props.
  - `Motion` (`fast` 150 / `base` 250 / `slow` 400 ms). A consumer that animates owns reduced motion; the token carries no motion policy.
  - `Layout.fabClearance` (96) is the bottom inset a scroll body keeps so its last row clears a floating action button. `Layout` shares its name with a deprecated Reanimated export, so a file needing both aliases one at import.
- **`outline` and `scrim` color roles:** `outline` (`#7C7F87` light / `#80838D` dark) is the input/control boundary stroke and clears the WCAG 1.4.11 3:1 bar against `background`, `backgroundElement` and `backgroundSelected` in both schemes (`separator` is decorative and does not). `scrim` (`#00000066` light / `#00000099` dark) is the modal/sheet backdrop, an overlay with no foreground and no contrast obligation.
- **Type ramp (`src/theme/typography.ts`, ADR [063](./decisions/063-platform-type-ramp.md)):** `TypeRamp` is keyed by the closed `TypeVariant` union `largeTitle`, `title`, `title2`, `sectionTitle`, `headline`, `body`, `callout`, `label`, `footnote`, `caption`, `captionSmall`; each `TypeStep` is a `style` (`fontSize` / `lineHeight` / `fontWeight` / `letterSpacing`) plus an optional `dynamicTypeRamp`. It resolves by `Platform.select` at module load. iOS follows the HIG text styles at the Large content size, names the matching UIKit Dynamic Type ramp on every step, and sets no `letterSpacing` (SF tracks optically). Android follows the Material 3 type scale (headline/title-large/body at weight 400, title-medium/label at 500) with its letter spacing and no Dynamic Type ramp. `caption` (12/14/600) and `captionSmall` (11/13/400) are the dense calendar-tile steps, identical on both platforms and without a Dynamic Type ramp. Both per-platform records `satisfies Record<TypeVariant, TypeStep>`, so a step missing on either platform is a `tsc` error; `src/theme/typography.test.ts` pins every value on both platforms. A rejected size is one row in `typography.ts` and its test table.
- `src/theme/use-theme.ts` owns light/dark resolution: `useTheme()` reads the `@/hooks/use-color-scheme` seam and returns `Colors[scheme]`.
- **Home welcome surface:** `homeHero` is a quiet pink paper (`#FCE4EC` light / `#321824` dark) carrying normal `text`; `homeHeroDate` is its stronger eyebrow (`#AD1457` light / `#FF80AB` dark). These are fixed scheme tokens rather than call-site alpha math. Event colors on Home remain non-text accent bars/dots because imported calendar colors cannot guarantee text contrast.
- **Single color-scheme seam (C1):** `@/hooks/use-color-scheme` is the **one** scheme source — both `useTheme` _and_ the root `_layout.tsx` read it (never `useColorScheme` from `react-native` directly), so a theme override is a single-file change. The seam resolves the stored theme preference (a `"light"`/`"dark"` override wins, `"system"` falls through to the device scheme), **preserving the `ColorSchemeName` return contract** so `useTheme` / `buildNavTheme` / `theme.test.tsx` are untouched. **Lint-enforced (L1):** `no-restricted-imports` bans `useColorScheme` and `Appearance` from `react-native` everywhere except `src/hooks/use-color-scheme.ts` (block `timecalendar/color-scheme-seam`; see `lint-format.md`).
- `src/theme/index.ts` re-exports the public surface (`Colors` / `Spacing` / `Radii` / `Fonts` / `MaxContentWidth` / `MinTouchTarget` / `IconSize` / `WordmarkMaxFontScale` / `StateOpacity` / `Elevation` / `Motion` / `Layout` / `AccessibilityFontScale` / `isAccessibilityTextSize` / `useIsAccessibilityTextSize` / `ThemeColor` / `TypeRamp` / `TypeVariant` / `TypeStep` / `useTheme` / `buildNavTheme` / the responsive exports) — **call sites import `@/theme`**, import-source-only. `Fonts.mono` resolves via `Platform.select` (`ios` → `ui-monospace`, `default` → `monospace`).
- `Themed*` consumers import from `@/theme`. `ThemedText` owns no type scale: it renders the `TypeRamp` step named by `type` (default `body`) and passes the step's `dynamicTypeRamp`; caller `style` and props win. The aliases `default` → `body`, `small` → `callout`, `smallBold` → `label` and `subtitle` → `sectionTitle` resolve inside the component. Color comes from `tone` (`primary` → `text`, `secondary` → `textSecondary`, `action` → `actionText`, `destructive` → `destructive`, `onPrimary` → `onPrimary`; `primary` is the label color, not brand pink, and the union has no brand or tertiary member) or from `themeColor` (any `ThemeColor`); the two props are mutually exclusive at the type level, and with neither the text is `text`. The heading role per step follows [Accessibility](./accessibility.md#the-heading-role-contract--encoded-in-themedtext).

## Responsive content lanes — measured owners, semantic caps

- `src/theme/responsive.ts` owns the typed portrait responsive policy and re-exports it through
  `@/theme`: `ResponsiveBreakpoints` (`tablet: 600`, `optionalColumns: 834`),
  `ResponsiveContentWidths` (`readable: 640`, `standard: MaxContentWidth`), the lane/size/metrics
  types, and pure `resolveResponsiveLayout(ownerWidth, lane)`. `MaxContentWidth` remains the
  standard-cap compatibility alias while screens migrate.
- The resolver accepts the finite positive width of the container that owns usable layout. A
  missing, non-finite, or non-positive measurement stays compact and column-ineligible; it never
  falls back to device identity or global window width. Compact capped lanes use `Spacing.four`,
  tablet capped lanes use `Spacing.six`, and usable width is
  `min(max(ownerWidth - 2 * gutter, 0), laneCap)`.
- Semantic lanes state intent: `readable` caps usable prose/form content at 640, `standard` caps
  usable lists/cards at 800, and `fullBleed` preserves the complete measured owner width without a
  responsive gutter or cap. Caps apply after both gutters, and capped content is centered.
- `useAdaptiveLayout(lane)` and `AdaptiveContent` live at
  `@/components/adaptive-content`. The hook is the escape hatch for list, scroll, and custom
  geometry owners; the component is the owner-plus-inner-view convenience form. Both use the same
  resolver, render a visible compact-width fallback before measurement, and adopt only positive
  widths reported by the attached owner.
- `isColumnEligible` becomes true at 834, but the shared layer never creates columns or reorders
  content. A feature owner must still prove independent scan groups, stable source/focus order,
  and a one-column fallback under large-text or width stress.
- Responsive content owns only measurement, centering, semantic maximum width, and horizontal
  gutter. Place it inside the route's existing safe-area/presentation owner. Stack headers,
  native tabs, safe-area and automatic list insets, keyboard avoidance, menus, alerts, pickers,
  modal presentation, and full-window overlay anchoring remain with their current owners.
- Settings destinations and management/history collections use one measured `standard` lane at
  their existing scroll or virtualized-list owner. Settings group labels keep the localized
  catalog's normal casing; semantic small-bold typography, secondary color, inset, grouped surface,
  and platform radius provide the hierarchy without a text transform. Preference controls, forms,
  prose, and shared changelog content use a measured `readable` lane; About keeps its grouped
  actions standard and centers its prose under a gutterless readable cap inside that standard
  lane, so the outer lane supplies the only responsive gutter. Presented content measures inside its actual
  sheet or screen, and responsive adaptation never wraps a virtualized list in another scroller.

## Tokenized React Navigation theme — `buildNavTheme` (C2)

- `src/theme/nav-theme.ts` exports a **pure** `buildNavTheme(scheme: "light" | "dark")` (re-exported from `@/theme`) that spreads the stock RN nav `DefaultTheme` (light) / `DarkTheme` (dark) and overrides `colors` from `@/theme` tokens, so nav chrome (header, card, hairline border, active tint) can't drift from the palette. The **nav↔token contract**: `background`→`Colors[scheme].background`, `card`→`backgroundElement`, `text`→`text`, `border`→`backgroundSelected`, `primary`→`primary` (brand). Spread-then-override supplies the full `colors` set + `fonts` the nav `Theme` type requires, so `tsc` enforces completeness.
- **Lint caveat (R-1):** `@react-navigation/*` imports are lint-banned (Expo Router is the only nav API), so `buildNavTheme` and `_layout.tsx` import `DefaultTheme` / `DarkTheme` / `ThemeProvider` from **`expo-router`** (which re-exports the RN nav constants). `expo-router` doesn't export the `Theme` type by name, so the helper derives it (`type NavTheme = typeof DefaultTheme`).
- Pure (no hooks) so the proof test calls it without rendering the route tree (the routes-not-importable boundary). `_layout.tsx` feeds `ThemeProvider` `buildNavTheme(scheme)` keyed on the C1-resolved scheme — one read, no second source.

## Native-chrome wrapper seam — `src/components/chrome/`

Root Stack chrome also enters through this seam: `buildCompactRootScreenOptions` supplies the
compact defaults, the platform bar surface (iOS 26+ system scroll-edge effect, iOS 16.4–25 always-on blur, Android flat page-background bar
with `text` title), and minimal back display described by ADR
[054](./decisions/054-shared-root-page-semantics.md). It is stable Expo Router composition rather
than an alpha API, but co-location keeps root chrome policy discoverable.

Every ordinary non-tab root and onboarding push uses that compact chrome plus one `RootPage`.
The native title is the route heading; `PageIntro` contains supporting caption text only and adds
no placeholder when no caption exists. `RootPage` replaces feature-local themed surfaces, safe
areas, top padding, and primary lane measurement while leaving `FlatList`, `SectionList`,
`ScrollView`, keyboard avoidance, refresh, pagination, overlays, and native actions with the
feature that already owns them.

`EmptyState` accepts optional local light/dark artwork pairs selected through the single
color-scheme seam. Eligible full-screen illustrations are recolored to each scheme's exact
`primary` accent; the localized text carries meaning and the image remains decorative. Filled
body/footer `PrimaryAction` controls always use `primaryStrong` with `onPrimary`. Platform-native
header actions and FABs retain their native placement and sizing.

Home's true-empty Up next and Today title/caption pairs use section `EmptyState`, retaining
left alignment while sharing subtitle hierarchy, secondary captions, semantic spacing, and polite
announcement. Feedback, onboarding Programme, and the personal-event editor compose one readable
`KeyboardSafeActionLayout`: the fields remain in its sole scroll body and the `PrimaryAction`
region is a measured sibling above the keyboard. Programme Skip remains native per platform.

The alpha native-chrome surfaces all **churn** (`expo-router/unstable-native-tabs` is "API subject to change"; `@expo/ui` ships unstable entry points; `expo-glass-effect` is iOS-26-only). The wrapper seam localizes that churn to one directory. Each module is the **single import site** for its alpha API:

- **`chrome/native-tabs.tsx`** — the only import site for `expo-router/unstable-native-tabs`. Wraps `NativeTabs` so tab-bar colors come from `@/theme`; the `.Trigger` compound parts are re-attached (`Object.assign`) so callers use `NativeTabs.Trigger` / `.Trigger.Label` / `.Trigger.Icon` unchanged.
- **`chrome/glass-surface.tsx`** — the only import site for `expo-glass-effect`. Centralizes the **Liquid-Glass degradation decision** in one place: `isLiquidGlassAvailable()` → `GlassView` (iOS 26+); else (iOS 16.4–25, Android, Jest) a plain `View` rendering the same children, dropping the glass-only props. `isLiquidGlassAvailable()` is itself alpha, so it lives here too.
- **`chrome/expo-ui.tsx`** — the only import site for `@expo/ui` (SDK-56 native controls — SwiftUI / Jetpack Compose). Re-exports the **universal** entry's `Host` + `Picker` (the universal `Picker` carries `Picker.Item` as a static compound member), `DateTimePicker` from `@expo/ui/community/datetime-picker`, and the anchored `MenuView` plus its ref type from `@expo/ui/community/menu`. The wrapper is **thin**: it does **not** theme native controls. Operational facts: `@expo/ui` **autolinks** (ships `expo-module.config.json`, no `app.plugin.js`) → **no `app.config.ts` plugin entry**; its babel-plugin is **`Icon`-only** (not added until an `Icon` consumer); its native module has no off-device JS, so Jest needs suite-wide mocks for each imported subpath. See ADR [010](./decisions/010-expo-ui-chrome-wrapper.md) and ADR [012](./decisions/012-personal-event-datetime-picker.md).
- **`chrome/native-text-entry-dialog*`** — the narrow composed-control exception in ADR
  [056](./decisions/056-compose-native-dialog-behind-chrome.md). One stable contract privately
  adapts SwiftUI and Material 3 text fields, progress, native buttons, observable buffers, keyboard
  insets, selectors, and explicit dismissal. `inputKind: "code"` disables auto-capitalization and
  autocorrect on both platforms for case-sensitive strings (tokens). Features keep validation, data, copy, and lifecycle;
  ordinary controls remain thin re-exports. Native controls follow system appearance and typography.
- **`chrome/native-settings.tsx`** — the bounded settings-composition exception in ADR
  [060](./decisions/060-platform-native-settings-composition.md). SwiftUI Form/Section and Material
  LazyColumn/ListItem remain private; the stable host, section, row, switch, selection, alert,
  header, and radio-dialog contracts receive the app-resolved light/dark scheme and one brand accent:
  - **iOS:** the Form carries `tint(primary)`, so Toggles, checkmarks, and control accents are brand
    pink. Inside a SwiftUI Button, hierarchical `.primary`/`.secondary`/`.tertiary` resolve against
    the tint, so row labels use the concrete `text` token, values `textSecondary`, and the
    footnote-semibold `chevron.forward` disclosure `textTertiary`; the selection checkmark is
    subheadline-semibold in `primary`; the default Form button style
    keeps the full-row highlight. An optional row `icon` renders a white SF Symbol on a 29pt continuous
    rounded-square tile in `primaryStrong` (the white-on-brand fill pair). Section footers use the
    native Section footer. At accessibility text sizes (`useIsAccessibilityTextSize`) a row with a
    `value` stacks the label above the value in one leading VStack, with the navigation chevron
    kept trailing; the value row keeps `LabeledContent` with the stacked column as its label.
  - **Android:** every Compose Host (list and dialog) receives `seedColor = primary`. Each section is
    a `titleSmall`/`primary` heading inset 16dp, then one grouped list: rows are `surfaceContainer`
    segments 2dp apart with 20dp outer and 4dp inner corners chosen by child position, 16dp side
    margins, no dividers, and no chevron. Headlines are `bodyLarge`/`onSurface`, supporting values
    `bodyMedium`/`onSurfaceVariant`, footers `bodySmall`/`onSurfaceVariant`. Row icons are flat
    Material Symbols tinted `onSurfaceVariant` in the leading slot. The radio dialog is a
    `selectableGroup` Column of full-width 56dp radio rows. A switch row is a toggleable
    `ListItem` (role switch) carrying `testID`; its trailing Material `Switch` carries
    `switchTestID` and is still its own unlabeled TalkBack stop, a known violation
    ([accessibility.md](./accessibility.md) → Proof in CI). Choice and radio-dialog `RadioButton`s
    take no `onClick` and add no semantics of their own.
  - **Row subtitle and destructive rows:** a row `subtitle` is a second line under the label (iOS
    `subheadline`/`textSecondary` in a leading VStack; Android the supporting slot, which moves any
    `value` to trailing `labelLarge`/`onSurfaceVariant` text). The default accessibility label reads
    `label, subtitle`. A `destructive` action row labels in `error` (iOS) or Material `error`
    (Android).
  - **Floating action:** `NativeSettingsFloatingAction` is a Material `FloatingActionButton` in its
    own seeded Compose host, bottom-right, whose icon carries the label as content description. It
    renders nothing on iOS, where the page adds through a navigation-bar item. A page that shows it
    passes `reservesFloatingAction` to `NativeSettingsHost` so the last row clears the button.
  - **Placement:** the standalone native dialogs and editors (`NativeSettingsRadioDialog`,
    `NativeSettingsNumericEditor`, `NativeTextEntryDialog`) each mount their own native host, so
    they render as siblings after `</NativeSettingsHost>`, never inside it. Nested inside the
    Compose list host, the dialog window is orphaned: Cancel and input are dead and the window
    outlives a JS reload. `NativeSettingsHost` provides a private context
    (`chrome/native-settings-host-context.ts`), and each of the three throws on its first render
    inside it, whatever file the misplaced call sits in. A screen whose row lives in a section and
    whose dialog follows the host shares one controller hook between them (`useEnvironmentSelector`
    on the developer page). Enforced by `native-settings.test.tsx`, `native-settings-numeric-editor.test.tsx`
    and `native-text-entry-dialog.test.tsx`.
  - **Help copy** lives in section footers, never as text rows inside a group: one setting per
    section when each needs its own explanation.
  - **`NativeSettingsAlert`** is the page-level failure pattern and renders first on the page. iOS:
    its own Section with an `exclamationmark.triangle.fill` glyph in `error`, a `headline`/`text`
    title, a `subheadline`/`textSecondary` message, and an optional tinted Button action row.
    Android: one 20dp-rounded `errorContainer` ListItem (`titleMedium` title, `bodyMedium` message in
    `onErrorContainer`) with an optional trailing TextButton. Both announce `title. message` through
    the platform announcer on mount. Settled or in-progress states render nothing.
  - **`NativeSettingsHeader`** (`chrome/native-settings-header.tsx`) is the centered brand header
    for a page's top: the 88pt app icon (continuous rounded square on iOS, circle on Android), the
    app name as a `ThemedText` heading, a tagline, optional secondary detail, and an optional
    caption pill in `actionText` on `primarySoft`. SwiftUI and Compose text cannot carry a heading
    role, so the content is React Native hosted through `RNHostView` (`matchContents`) at a width
    derived from the window, inside a clear, zero-inset Form row on iOS and a centered Row on
    Android. It follows the app theme tokens and the OS font scale.
  - **Icons:** `NativeSettingsIcon` pairs an SF Symbol with a key of
    `chrome/native-settings-icons.ts`, which maps each Material Symbol name to a committed vector
    drawable under `mobile/assets/icons/material/`. Adding an Android icon means adding its XML there.
  - **Rule:** feature screens never set tint, color, or typography on settings rows, sections, or
    footers; the chrome seam owns them. Features pass copy, icons, values, and intent only.
  - **Numeric editor:** `chrome/native-settings-numeric-editor.tsx` carries the same brand accent
    (iOS Form `tint`, Compose `seedColor`).
- **`src/components/icon.tsx`** — `Icon`, the only renderer of a symbol glyph (lint L9 bans
  `SymbolView` elsewhere, ADR [065](./decisions/065-icon-text-scaling.md)). iOS renders
  `SymbolView`; Android draws the Material Symbols glyph from the closed `MATERIAL_GLYPHS` table
  in a box sized by the required `scaling` (see [Accessibility → Icon
  scaling](./accessibility.md#icon-scaling--encoded-in-icon)). Callers pass the color token; the
  icon carries no tone of its own.
- **`chrome/index.ts`** — the barrel. Exports `NativeTabs`, `GlassSurface`, `Host`, `Picker`, `DateTimePicker`, `MenuView`, and `MenuComponentRef`.

## Lint boundary — the R-1 enforcement

- The seam is **structural, not a convention**: `mobile/eslint.config.js` bans `expo-router/unstable-native-tabs`, `expo-glass-effect`, and `@expo/ui` (+ subpaths, regex `^@expo/ui($|/)`) via `no-restricted-imports` everywhere **except** `src/components/chrome/**`, which re-sets the rule without the ban (`banChromeAlpha: false`, mirroring `mutator-owns-fetch` and the storage seams). The message names the `@/components/chrome` seam.
- **Caveat the lint can't carry:** it catches the static import specifier, not a dynamic `require()` / `import()` evasion — it guards accident, review covers adversaries. The exemption is path-scoped: renaming `chrome/` or adding a new alpha surface without a wrapper requires updating the rule.

## Contrast — documented AA token pairs, computed in CI

- `src/theme/tokens.ts` documents the foreground/background **pairs** for both schemes (`text` / `textSecondary` on `background` / `backgroundElement` / `backgroundSelected`, plus the brand, status, error, destructive, home-hero, `logoSurface` and `outline` pairs), each with its two-decimal WCAG ratio. The DoD's manual contrast review checks rendered screens against these named pairs.
- **The gate:** `src/theme/theme.test.tsx` holds a `contrastRatio` helper (WCAG 2.x relative luminance, calibrated against 21:1, 5.87:1 and 4.35:1; it throws on a translucent hex so an alpha token cannot pass by accident) and a typed `documentedPairs` table keyed on `ThemeColor`. Every opaque documented pair is a row asserting its floor: 4.5:1 for body text, 3:1 for large text and UI components. A renamed token is a `tsc` error; a value change that breaks a floor fails `test-mobile`.
- **Manual link (R-1 caveat):** the test cannot read the `tokens.ts` comment. A pair added to the comment needs a row in `documentedPairs`, and review checks both land together.
- **Brand pairs:** white-on-`#E91E63` is **4.35:1** (large/UI only, below the 4.5:1 body floor), so **white text on brand rides `#C2185B`** (5.87:1, AA body); the identity pink `#E91E63` is the **accent/tint** (4.35:1 on white meets the 3:1 large/UI-component bar); the dark-scheme brand is `#FF4081` (6.30:1 on `#000`, AA body).
- **Status pairs:** `positive` and `informational` on `background` and `backgroundElement` for light and dark, each an AA body-text pair. Status colors remain semantic and never substitute for event/calendar colors.
- **Call-site placement is not checked:** a static tool can't know which token lands on which background at a given site. That stays the DoD's manual review.

## What CI proves vs. what's manual

- `src/theme/theme.test.tsx` (gated by `test-mobile`: tsc + lint + Jest, R-1) asserts: (a) `useTheme` resolves a token to its expected **light** and **dark** values (mocking `@/hooks/use-color-scheme`), plus the brand **`primary`**, status, `outline` and `scrim` roles per scheme; (b) `GlassSurface` renders its children in Jest, where `isLiquidGlassAvailable()` is `false`, exercising the **fallback** path (a real `View`, not a throw); (c) **`buildNavTheme`** maps `colors.background` / `colors.primary` to the scheme-appropriate `@/theme` tokens for both schemes — the nav↔token contract; (d) every documented opaque contrast pair clears its floor (`documentedPairs`); (e) the `Spacing`, `IconSize`, `StateOpacity`, `Elevation`, `Motion` and `Layout` values, and `MinTouchTarget` per platform (the module re-evaluated under the iOS and Android `Platform` implementations).
- `src/components/chrome/native-settings.test.tsx` asserts that the same resolved scheme reaches the
  SwiftUI and Material hosts, that each platform composition contains one native scroll owner, that
  the brand reaches the iOS Form tint and every Compose `seedColor`, and that icons, footers, segment
  positions, Material text roles, and the radio-dialog structure are wired. Rendered geometry stays
  device evidence, checked through the native settings stories of `/developer/gallery`.
- The placement invariant ("native settings dialog placement" in `native-settings.test.tsx`, and
  the placement cases in `native-settings-numeric-editor.test.tsx` and
  `native-text-entry-dialog.test.tsx`) asserts that each standalone dialog rejects rendering inside
  `NativeSettingsHost` on both platforms, a closed radio dialog included, and renders as a sibling
  after it. `features/developer/ui/developer-screen.test.tsx` renders the real environment row and
  dialog through the real host on Android.
- CI **cannot** prove and is therefore **manual** (DoD / splash visual pass): that Liquid Glass renders on iOS 26+, that the fallback looks right on iOS 16.4–25 / Android, that the contrast pairs read correctly on-device, and that each call site draws a documented pair.

## Deferred (live debt — not built)

- **No call-site contrast checker** — the documented pairs are computed in CI, but which pair a call site draws is manual review. **Trigger:** the first screen with a non-token-pair color combination, or a designer-driven palette change.
- **No in-app theme override / switcher** beyond the C1-resolved stored preference (a deeper switcher is a Settings concern).
- **No animation / reduced-motion handling in chrome** (the splash owns the reduced-motion obligation; any future chrome animation inherits it per the a11y rules).
