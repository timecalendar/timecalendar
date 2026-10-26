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

1. **Dot:** identifies a calendar, subject, or event in a list or summary. It is `ColorDot` from
   `@/design` (see [Badges and color dots](#badges-and-color-dots--badge-colordot-srcdesignbadge-srcdesigncolor-dot)).
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
  - `ChevronMaxFontScale` (2) is the `maxFontSizeMultiplier` of a text-scaled row chevron (the school row), so the cue stays smaller than the row text at accessibility sizes.
- **Text-scale seam (`src/theme/text-scale.ts`):** `AccessibilityFontScale` (1.786), `isAccessibilityTextSize(fontScale)` and `useIsAccessibilityTextSize()`, which reads `useWindowDimensions().fontScale` and follows a live change. Layouts that change shape at accessibility text sizes read it; `src/theme/text-scale.test.ts` pins the threshold.
  - `StateOpacity` (`pressed` 0.65, `disabled` 0.55). `pressed` is the iOS press feedback only; Android pressed state is the `ripple` color.
  - `Elevation.raised` is a CSS `boxShadow` string per scheme (`Elevation.raised[scheme]`, passed to the RN `boxShadow` style prop). Elevation never uses the legacy `shadow*` props.
  - `Motion` (`fast` 150 / `base` 250 / `slow` 400 ms). A consumer that animates owns reduced motion; the token carries no motion policy.
  - `Layout.fabClearance` (96) is the bottom inset a scroll body keeps so its last row clears a floating action button. `Layout` shares its name with a deprecated Reanimated export, so a file needing both aliases one at import.
- **`outline` and `scrim` color roles:** `outline` (`#7C7F87` light / `#80838D` dark) is the input/control boundary stroke and clears the WCAG 1.4.11 3:1 bar against `background`, `backgroundElement` and `backgroundSelected` in both schemes (`separator` is decorative and does not). `scrim` (`#00000066` light / `#00000099` dark) is the modal/sheet backdrop, an overlay with no foreground and no contrast obligation.
- **Type ramp (`src/theme/typography.ts`, ADR [063](./decisions/063-platform-type-ramp.md)):** `TypeRamp` is keyed by the closed `TypeVariant` union `largeTitle`, `title`, `title2`, `sectionTitle`, `headline`, `body`, `callout`, `label`, `footnote`, `caption`, `captionSmall`; each `TypeStep` is a `style` (`fontSize` / `lineHeight` / `fontWeight` / `letterSpacing`) plus an optional `dynamicTypeRamp`. It resolves by `Platform.select` at module load. iOS follows the HIG text styles at the Large content size, names the matching UIKit Dynamic Type ramp on every step, and sets no `letterSpacing` (SF tracks optically). Android follows the Material 3 type scale (headline/title-large/body at weight 400, title-medium/label at 500) with its letter spacing and no Dynamic Type ramp. `caption` (12/14/600) and `captionSmall` (11/13/400) are the dense calendar-tile steps, identical on both platforms and without a Dynamic Type ramp. Both per-platform records `satisfies Record<TypeVariant, TypeStep>`, so a step missing on either platform is a `tsc` error; `src/theme/typography.test.ts` pins every value on both platforms. A rejected size is one row in `typography.ts` and its test table.
- `src/theme/use-theme.ts` owns light/dark resolution: `useTheme()` reads the `@/hooks/use-color-scheme` seam and returns `Colors[scheme]`.
- **`onPrimarySoft` color role:** the label on the translucent `primarySoft` brand wash (`#AD1457` light / `#FF80AB` dark), the text of the brand `Badge`. `actionText` stays the brand text tone on neutral surfaces. The wash is translucent, so its pairs are composited: a `documentedContrastPairs` row can name the opaque surface it sits on (`over`), and the test composites the wash over that surface before computing the ratio. `onPrimarySoft` on `primarySoft` is checked over `background`, `backgroundElement` and `homeHero` in both schemes (5.79 / 5.10 / 4.88 light, 8.11 / 5.90 / 5.89 dark).
- **`ColorDotSize`** (`small` 8 / `medium` 12 / `large` 16), the diameters of `ColorDot`.
- **Home welcome surface:** `homeHero` is a quiet pink paper (`#FCE4EC` light / `#321824` dark) carrying normal `text`; `homeHeroDate` is its stronger eyebrow (`#AD1457` light / `#FF80AB` dark). These are fixed scheme tokens rather than call-site alpha math. Event colors on Home remain non-text accent bars/dots because imported calendar colors cannot guarantee text contrast.
- **Single color-scheme seam (C1):** `@/hooks/use-color-scheme` is the **one** scheme source — both `useTheme` _and_ the root `_layout.tsx` read it (never `useColorScheme` from `react-native` directly), so a theme override is a single-file change. The seam resolves the stored theme preference (a `"light"`/`"dark"` override wins, `"system"` falls through to the device scheme), **preserving the `ColorSchemeName` return contract** so `useTheme` / `buildNavTheme` / `theme.test.tsx` are untouched. **Lint-enforced (L1):** `no-restricted-imports` bans `useColorScheme` and `Appearance` from `react-native` everywhere except `src/hooks/use-color-scheme.ts` (block `timecalendar/color-scheme-seam`; see `lint-format.md`).
- `src/theme/index.ts` re-exports the public surface (`Colors` / `Spacing` / `Radii` / `Fonts` / `MaxContentWidth` / `MinTouchTarget` / `IconSize` / `WordmarkMaxFontScale` / `ChevronMaxFontScale` / `StateOpacity` / `ColorDotSize` / `Elevation` / `Motion` / `Layout` / `AccessibilityFontScale` / `isAccessibilityTextSize` / `useIsAccessibilityTextSize` / `ThemeColor` / `TypeRamp` / `TypeVariant` / `TypeStep` / `useTheme` / `buildNavTheme` / the responsive exports) — **call sites import `@/theme`**, import-source-only. `Fonts.mono` resolves via `Platform.select` (`ios` → `ui-monospace`, `default` → `monospace`).
- `ThemedText` and `ThemedView` (`src/design/text/`) are imported from `@/design` and read their tokens from `@/theme`. `ThemedText` owns no type scale: it renders the `TypeRamp` step named by `type` (default `body`) and passes the step's `dynamicTypeRamp`; caller `style` and props win. The aliases `default` → `body`, `small` → `callout`, `smallBold` → `label` and `subtitle` → `sectionTitle` resolve inside the component. Color comes from `tone` (`primary` → `text`, `secondary` → `textSecondary`, `action` → `actionText`, `destructive` → `destructive`, `onPrimary` → `onPrimary`; `primary` is the label color, not brand pink, and the union has no brand or tertiary member) or from `themeColor` (any `ThemeColor`); the two props are mutually exclusive at the type level, and with neither the text is `text`. The heading role per step follows [Accessibility](./accessibility.md#the-heading-role-contract--encoded-in-themedtext).

## Buttons — `Button` and `ButtonRow` (`src/design/button/`)

Every in-content button is `Button` from `@/design` (ADR [067](./decisions/067-button-family.md)). The caller
chooses an intent and a size; the primitive owns colors, geometry, states and press feedback.

| `variant`     | Fill                | Boundary    | Label         | iOS / Material reference              |
| ------------- | ------------------- | ----------- | ------------- | ------------------------------------- |
| `filled`      | `primaryStrong`     | none        | `onPrimary`   | `.borderedProminent` / Filled         |
| `tonal`       | `backgroundElement` | none        | `text`        | gray `.bordered` / Filled tonal       |
| `outlined`    | none                | 1 `outline` | `actionText`  | none on iOS / Outlined                |
| `text`        | none                | none        | `actionText`  | `.borderless` / Text                  |
| `destructive` | `backgroundElement` | none        | `destructive` | `.bordered` destructive / Tonal error |

- `variant` is required. `outlined` exists on iOS too: the onboarding pairs (QR vs link, Continue
  vs Back) need a second rank that is not a second fill, and a gray `.bordered` would be `tonal`.
- Sizes: `small` and `medium` are `MinTouchTarget` tall, `large` is `MinTouchTarget + Spacing.two`
  (52 iOS / 56 Android); every size is at least `MinTouchTarget` wide. `small` keeps the target and
  only tightens horizontal padding (inline and row actions). `large` uses the `headline` step and
  `IconSize.large`; the others use `label` and `IconSize.medium`. Radius `Radii.large` at every
  size, continuous on iOS.
- States: `disabled` and `busy` block activation and dim to `StateOpacity.disabled`; `busy` shows a
  progress indicator in the leading slot (`${testID}-progress`) and hides the icon. The indicator
  is hidden through a wrapping `View` (`accessibilityElementsHidden`,
  `importantForAccessibility="no-hide-descendants"`): the same props on `ActivityIndicator` leave
  the native iOS indicator exposed to VoiceOver as "In progress".
- Press feedback: Android ripple in `ripple`, foreground and clipped to the shape, no opacity
  change; iOS dims to `StateOpacity.pressed`. A blocked button shows neither.
- `style` is `StyleProp<ButtonLayoutStyle>` (margins, flex, alignment, width, position) and merges
  last, so a caller's `alignSelf` or `width` wins; color, height, padding, radius, border and
  opacity are not in the type. The style callback returns one flattened object, safe under an
  Expo Router `Slot`.
- Label: `numberOfLines={16}`, centered, no font-scale cap, the default tail ellipsis beyond sixteen
  lines. Icon: `icon={{ ios, android }}` rendered by `Icon` with `scaling="text"` in the label
  color, `iconPosition` `leading` (default) or `trailing`.
- Gates: `button.test.tsx` (variant tokens per scheme, sizes, states, platform feedback, style
  order, the type tests) at a 90% per-file coverage tier; the touchables ban and
  `local/no-raw-button` ([lint-format.md](./lint-format.md) → Buttons); the gallery stories
  `button--filled`, `--tonal`, `--outlined`, `--text`, `--destructive`, `--icons`,
  `--long-strings`.
- **Two buttons side by side are a `ButtonRow`** (`primary`, `secondary`, optional layout-only
  `style` merged last). Below the accessibility text-size threshold (`useIsAccessibilityTextSize()`,
  font scale 1.786 = iOS AX1; Android 1.8 and 2.0) the secondary leads at its intrinsic width, at
  most half the row, and the primary trails, filling the rest; at or above it both stack full
  width, primary first. The same button instances move between the layouts, so `testID`s and
  handlers survive a live text-size change. Gates: `button-row.test.tsx` (both platforms, font
  scales 1.0–3.571, live change, style order) at a 90% per-file coverage tier; the gallery stories
  `button-row--pair` and `button-row--long-strings`, captioned with the active layout. No lint rule
  detects a hand-built row of two `Button`s.

## Status — `StatusView` (`src/design/status/`)

Every loading, empty and error state in a feature is `StatusView` from `@/design` (ADR
[069](./decisions/069-status-view.md)). The caller picks a `kind` and a `presentation`; the
primitive owns layout, scrolling, media, roles and the announcement.

- `kind`: `loading` (title only), `empty` (caption, `action`, `secondaryAction`, and `artwork` or
  `symbol`, never both), `error` (caption and actions). The props are a discriminated union, so a
  spinner with a retry does not type-check.

| `presentation` | Container                                                                            | Alignment | Use                                         |
| -------------- | ------------------------------------------------------------------------------------ | --------- | ------------------------------------------- |
| `screen`       | vertical `ScrollView` (`headerScrollProps(false)`), `flexGrow: 1` content, `flex: 1` | centered  | a page whose only content is the status     |
| `section`      | `View`, `flexGrow: 1`, `paddingHorizontal: Spacing.four`                             | centered  | a `ListEmptyComponent`, a page that scrolls |
| `inline`       | content-sized `View`, `gap: Spacing.two`; loading is a spinner + title row           | leading   | a status inside a content section (Home)    |

- `screen` scrolls: it centers while it fits and scrolls from the top once the text outgrows the
  viewport, so nothing rises under the header at the largest sizes. It fills its parent, so it is
  a non-function `RootPage` child or sits in a `flex: 1` lane. **Never place `screen` inside a
  list or a scroll view** (a nested vertical scroll); lint cannot see the nesting.
- Media: loading is `ActivityIndicator` in `textSecondary`, `large` (`small` for `inline`),
  hidden through a wrapping `View` (`${testID}-progress`). `symbol` is `Icon` 40,
  `scaling="fixed"`, `textSecondary` (`${testID}-symbol`). The error glyph is fixed:
  `exclamationmark.circle` / `error_outline`, 40, `error` (`${testID}-glyph`). `artwork` is a
  decorative `StatusArtwork` light/dark pair (`developerActivityArtwork`, `noDataArtwork`), max
  280 wide and 200 tall, recolored to each scheme's `primary`, `${testID}-artwork`.
- **Artwork is not rendered at accessibility text sizes** (`useIsAccessibilityTextSize()`): the
  text owns the viewport. Symbols and the error glyph stay. The switch follows a live text-size
  change.
- Text: title `sectionTitle`, caption `body` in `textSecondary`; centered except `inline`.
- Actions are `StatusAction`s rendered as `Button`: `action` `filled`, `secondaryAction` `text`,
  stacked primary first with `Spacing.two`, full width except `inline`. `busy` and `disabled` are
  `Button`'s.
- `style` is `StyleProp<StatusLayoutStyle>` (`ButtonLayoutStyle` keys) and merges last.
- `ErrorNotice` (inline error surface with an optional `StatusAction` drawn as a `text` `Button`)
  and `FieldError` (alert text under a field) share the folder. A field's error belongs to the
  field primitive (→ Fields); `FieldError` alone serves a selection error with no field.
- Gates: `status-view.test.tsx` (kinds, presentations, both platforms, announcement, the type
  tests) at a 90% per-file coverage tier; `local/no-ad-hoc-status`
  and the `aria-describedby` ban ([lint-format.md](./lint-format.md) → Status); the gallery
  stories `status-view--loading-screen`, `--loading-section`, `--loading-inline`,
  `--empty-screen`, `--empty-screen-artwork`, `--empty-section`, `--empty-inline`,
  `--error-screen`, `--error-retry-busy`, `--error-section`, `--long-strings`.

## Fields — `TextField` and `DateTimeField` (`src/design/field/`)

Every text field in a feature is `TextField` from `@/design`; every date-and-time field is
`DateTimeField` (ADR [070](./decisions/070-text-field.md)). The field owns its label, box,
helper, error, disabled state and font scaling; the caller owns the value and the copy.

| State    | iOS (rounded filled field)                                           | Android (Material 3 outlined field)                                |
| -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Rest     | `backgroundElement` fill, hairline `outline` border, `Radii.medium`  | transparent, 1dp `outline`, `Radii.small`                          |
| Focused  | unchanged; the caret and selection (`primary`) carry focus           | 2dp `primary`; padding gives back the border width, text stays put |
| Error    | 1pt `error` border                                                   | `error` border (2dp when focused)                                  |
| Disabled | label, box and helper at `StateOpacity.disabled`, `editable={false}` | same                                                               |

The error stays at full opacity when the field is disabled.

- The label (`smallBold`) sits above the box on both platforms and is required by the type; a
  placeholder is only an example. The helper (`small`, `textSecondary`) and then `FieldError` sit
  below the box. iOS single-line fields show the system clear button while editing; Android none.
- Input text is `TypeRamp.body` and follows the OS text size with no cap. No field has a fixed
  `height`: single-line is at least `MinTouchTarget` tall and grows; multiline is at least four
  body lines × `fontScale` tall, top-aligned, grows with its content, and Return inserts a
  newline.
- Visual props (`placeholderTextColor`, `selectionColor`, `cursorColor`, `editable`,
  `blurOnSubmit`, `allowFontScaling`, `accessibilityHint`, …) are not in `TextFieldProps`.
  Keyboard and autofill props (`returnKeyType`, `submitBehavior`, `onSubmitEditing`,
  `keyboardType`, `inputMode`, `textContentType`, `autoComplete`, `autoCapitalize`,
  `autoCorrect`, `secureTextEntry`, `maxLength`, `placeholder`) pass through, and `ref`
  (`TextFieldRef`) reaches the native input, so a field that moves focus on Next passes
  `submitBehavior="submit"` and focuses the next field's ref. `style` is
  `StyleProp<TextFieldLayoutStyle>` (`ButtonLayoutStyle` keys) and merges last.
- `testID` sits on the native input (Maestro taps it, types into it and matches its text); the
  label, helper, error and box are `${testID}-label`, `-helper`, `-error`, `-field`.
- `DateTimeField` takes `label`, the stored instant `value`, the display `zone`, a `formatValue`
  function and `onChange`, and imports no feature and no translation key: the caller formats
  (personal events pass `formatShortDateTime` with the device clock), so the field and the list
  read the same. It shares `TextField`'s label, error and disabled chrome (`FieldChrome`, a leaf
  export of `text-field.tsx`; the box border and inset live in `field-box.ts`). iOS renders the chrome `DateTimePicker` inline with `alignment="leading"` and
  the field label as its `accessibilityLabel`, so the pills start under the label, wrap at
  accessibility text sizes and the picker's SwiftUI container is named by the label (the inner
  UIKit picker keeps its system name, [accessibility.md](./accessibility.md)) (gate:
  `date-time-field.test.tsx`); Android renders a
  row drawn like a resting `TextField` that opens the date dialog, then the time dialog, and
  commits both together; becoming disabled while a dialog is open closes it without committing.
  Picker values are device-local (ADR
  [066](./decisions/066-device-local-date-picker-seam-and-timezone-ci.md)); the field converts to
  and from the display zone, and every picker callback goes through its one `onPicked` adapter.
- Gates: `text-field.test.tsx`, `date-time-field.test.tsx` and `field-error-hint.test.ts` at 90%
  per-file coverage tiers, the date field under the three-zone matrix
  ([testing.md](./testing.md) → Time zones); `local/no-raw-text-input`
  ([lint-format.md](./lint-format.md) → Fields); the gallery stories `text-field--default`,
  `--helper`, `--error`, `--disabled`, `--multiline`, `--keyboard`, `--long-strings`,
  `date-time-field--default`, `--error`, `--disabled`, `--long-strings`, and
  `error-surfaces--field-error`.

## Lists — `ListRow`, `ListSection`, `Separator` (`src/design/list/`)

A list the native seam cannot host (virtualized, hundreds of rows, a caller element in the row)
renders `ListRow` from `@/design` (ADR [073](./decisions/073-list-row-family.md)). It takes the
seam's row vocabulary (`label`, `subtitle`, `value`, `hint`, `destructive`) and its numbers and
colors, so an RN list and a `NativeList` on the same page read as one surface.

- **Anatomy:** optional `leading` (a seam-style icon `{ icon: { ios, android } }`, or
  `{ element, width }` for a caller element such as a logo, swatch or thumbnail), then a text
  column (`overline` in a status tone, `label`, `subtitle`, `details` lines), then `value`, the
  selection check, and a trailing slot. An action row (`onPress` or `href`, which calls
  `router.push`) takes `hint`, `selected`, `disabled` and `trailing="chevron"`; a static row takes
  none of those and accepts one accessory element (a small text `Button`) as `trailing`. The props
  union makes a nested control in a pressable row, a color, height or font override, and a row
  without `testID` type errors. `style` is `StyleProp<ListRowLayoutStyle>` (`ButtonLayoutStyle`
  keys) and merges last.
- **Geometry** comes from `ListGeometry` in `@/theme`, which `native-list.tsx` also reads:

  | Token                                     | iOS                       | Android            |
  | ----------------------------------------- | ------------------------- | ------------------ |
  | `rowPaddingHorizontal` / `leadingGap`     | 16 / 16                   | 16 / 16            |
  | `rowMinHeight`                            | 44                        | 56                 |
  | `rowPaddingVertical`                      | `Spacing.twoHalf`         | `Spacing.two`      |
  | leading icon                              | 29pt `primaryStrong` tile | 24dp flat glyph    |
  | grouped corners                           | 26 (iOS 26+), 10 below    | 20 outer / 4 inner |
  | `segmentGap` / `listInset`                | —                         | 2 / 16             |
  | `trailingGap` (value to check or chevron) | `Spacing.two`             | `Spacing.three`    |

- **Colors:** `useListPalette()` (`@/components/chrome`) returns the grouped `surface`, `text` and
  `textSecondary`. iOS reads `backgroundElement`, `text` and `textSecondary`. Android reads
  `surfaceContainer`, `onSurface` and `onSurfaceVariant` from Expo UI's `getMaterialColors` with
  `seedColor = primary`, the same derivation every Compose host uses, cached per scheme and seed.
  Plain rows draw no surface. Overlines use `positive`, `informational` and `destructive`.
- **Grouped vs plain:** a row inside `ListSection`, or with an explicit `position`
  (`listRowPosition(index, count)` in virtualized lists), is grouped: `surface` fill, corners by
  position, an iOS bottom `Separator` inset to the text start on every row but the last, an
  Android 2dp gap and no dividers. A row with neither is plain, and the list passes
  `ItemSeparatorComponent={ListRowSeparator}` (`leadingWidth` for a leading element), which renders
  the inset `Separator` on iOS and nothing on Android. `ListSection` adds no side margin (the page
  lane owns it); its title is iOS `footnote`/`textSecondary` or Android `label`/`action`, its
  footer `footnote`/`textSecondary`, and sections stack `Spacing.four` apart.
- **`Separator`** (`inset`: `"none"`, `"leading"` or `{ leadingWidth }`) is a `separator`-colored
  hairline on iOS and 1dp on Android, hidden from assistive technology. The text-start formula
  `rowPaddingHorizontal + leadingWidth + leadingGap` lives only in `separatorInset`
  (`separator-inset.ts`). `listRowPosition` (`list-row-position.ts`) is the one first/middle/last/single rule, shared by
  `ListSection` and the native list seam.
- **States:** iOS fills the shaped row with `backgroundSelected` on press; Android draws a
  foreground `ripple` clipped by the row shape. `disabled` dims to `StateOpacity.disabled` and
  shows no feedback. `selected` draws an SF `checkmark` or Material `check` in `primary`.
- **Scaling:** line caps are label 8, each supporting line 8, value 4, overline 2. At accessibility
  text sizes the value and check stack under the label, and a single-word label shrinks to one
  line (`minimumFontScale` 0.5) instead of breaking mid-word.
- Gates: `list-row.test.tsx`, `list-section.test.tsx` and `separator.test.tsx` at 90% per-file
  tiers; `local/no-ad-hoc-separator` ([lint-format.md](./lint-format.md) → Lists); the gallery
  stories `list-row--plain`, `--grouped`, `--states`, `--leading`, `--static`, `--overline`,
  `--long-strings`, `list-section--titled`, `--single`, `--seam-comparison`, `--long-strings`
  and `separator--insets`.
- **What lint cannot carry:** no rule detects a hand-built row (a `Pressable` with a label and a
  chevron has no reliable static signature). Review checks that a new list uses `ListRow` or the
  native seam.

## Badges and color dots — Badge, ColorDot (src/design/badge/, src/design/color-dot/)

A short status or count label is `Badge` and an event or calendar color marker is `ColorDot`, both
from `@/design` (ADR [074](./decisions/074-badge-and-color-dot.md)).

- **Badge tones.** `tone` is closed and fixes the appearance; there is no color, font or height
  prop, and `style` takes layout keys only (`BadgeLayoutStyle`) and merges last.

  | tone            | fill                | stroke                   | label           |
  | --------------- | ------------------- | ------------------------ | --------------- |
  | `brand`         | `primarySoft`       | none                     | `onPrimarySoft` |
  | `neutral`       | `backgroundElement` | none                     | `textSecondary` |
  | `positive`      | none                | 1 unit `positive`        | `positive`      |
  | `informational` | none                | 1 unit `informational`   | `informational` |
  | `destructive`   | none                | 1 unit `destructive`     | `destructive`   |

  Every label is a documented contrast pair at the body floor in both schemes; the brand wash is
  composited over `background`, `backgroundElement` and `homeHero`.
- **Badge sizes.** `small` is `ThemedText type="caption"` with `Spacing.two` × `Spacing.half`
  padding; `medium` (the default) is `type="label"` with `Spacing.twoHalf` × `Spacing.one`. Gap
  `Spacing.one`, `Radii.pill`, `alignSelf: "flex-start"`, `maxWidth: "100%"`.
- **Badge icon.** The optional `icon` (`{ ios?, android? }`) is an `Icon` with `scaling="text"`,
  sized to the label's `TypeRamp` font size and drawn in the label color. It is decorative.
- **Badge scaling.** No fixed height and no `adjustsFontSizeToFit`. The label has
  `numberOfLines={2}`, tabular figures and centered text, so at accessibility sizes the badge grows
  and wraps into a stadium with both lines centered instead of clipping.
- **Badge accessibility.** `accessibilityLabel: string | null` is required: a string makes the
  badge one `text` element with that name, `null` hides it for an owner that already announces it
  ([Accessibility → Badges and dots](./accessibility.md#badges-and-dots--encoded-in-badge-and-colordot)).
- **ColorDot.** `color` is the stored `#RRGGBB` (ADR [011](./decisions/011-personal-event-storage.md)), drawn verbatim in a
  circle of `ColorDotSize[size]` (`small` 8, `medium` 12 default, `large` 16). Its size is fixed,
  not text-scaled, so `ListRow` leading widths stay stable. The optional `ring` names the surface
  the dot sits on (`background`, `backgroundElement`, `homeHero`) and draws a 2-unit border in that
  token inside the box, so overlapping dots read as cut out in both schemes. There is no ring color
  value and no label: a dot is always hidden from VoiceOver and TalkBack.
- **Color names belong to the control.** Where a color is the subject, the control that shows it
  names it (the personal-events swatch picker through `SWATCH_NAME_KEYS`). `src/design/` cannot
  import feature data, and server colors have no names.
- **Chrome import.** `NativeListHeader` imports `Badge` by path (`@/design/badge/badge`), a design
  leaf like `text/` and `list/`; `badge.tsx` imports only `@/theme`, `@/design/text/themed-text`
  and `@/design/icon/icon`, so no cycle forms.
- **Gates:** `badge.test.tsx` and `color-dot.test.tsx` at 90% per-file tiers; the composited
  brand-wash pairs in `theme.test.tsx`; `local/no-raw-event-color`
  ([lint-format.md](./lint-format.md) → Event colors); the gallery stories `badge--tones`,
  `--sizes`, `--with-icon`, `--accessibility`, `--long-strings`, `color-dot--sizes`, `--presets`,
  `--rings` and `--stack`.
- **Sites:** the About header caption (brand, small), the inline checklist progress pill
  (positive or informational with the checked or pending glyph, hidden), the personal-events list
  dot (large) and the Home welcome summary dots (medium, `homeHero` ring, at most five then `+N`).
- **Deferred:** the event-details title dot and `TagBubble` (slice 5.8, allowlisted), the calendar
  view-menu pill (a menu trigger, 5.10), the agenda indicator column (3.9 `EventSurface`), the
  swatch picker's 48 pt swatches (an input control, 5.3), the onboarding page indicator (a pager,
  5.1), the checklist `compact` grid-tile variant (renderer-fitted geometry, 3.9/5.11), and
  `SwiftBadge` / Compose `Badge` in the native list seam (native idiom, stays).
- **What lint cannot carry:** an event color reached through a variable or a call, or passed as a
  `color=` prop, is not matched. Review checks that new event-color UI uses `ColorDot`.

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
- `useAdaptiveLayout(lane)` and `AdaptiveContent` (`src/design/layout/adaptive-content.tsx`) are
  imported from `@/design`. The hook is the escape hatch for list, scroll, and custom
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

Status artwork is a local light/dark pair selected through the single color-scheme seam, recolored
to each scheme's exact `primary` accent; the localized text carries meaning and the image remains
decorative. Filled body/footer actions are `Button variant="filled"`. Header actions and FABs come
from `useHeaderActions` and `FloatingAction` ([Header and floating actions](#header-and-floating-actions--useheaderactions-floatingaction-srccomponentschrome)).

Home's true-empty Up next and Today title/caption pairs use `inline` `StatusView`, keeping leading
alignment, subtitle hierarchy, secondary captions and the shared announcement. Feedback, onboarding Programme, and the personal-event editor compose one readable
`KeyboardSafeActionLayout`: the fields remain in its sole scroll body and the filled `Button`
region is a measured sibling above the keyboard. Programme Skip is a header text action on both
platforms.

The alpha native-chrome surfaces all **churn** (`expo-router/unstable-native-tabs` is "API subject to change"; `@expo/ui` ships unstable entry points; `expo-glass-effect` is iOS-26-only). The wrapper seam localizes that churn to one directory. Each module is the **single import site** for its alpha API:

- **`chrome/native-tabs.tsx`** — the only import site for `expo-router/unstable-native-tabs`. Wraps `NativeTabs` so tab-bar colors come from `@/theme`; the `.Trigger` compound parts are re-attached (`Object.assign`) so callers use `NativeTabs.Trigger` / `.Trigger.Label` / `.Trigger.Icon` unchanged.
- **`chrome/glass-surface.tsx`** — the only import site for `expo-glass-effect`. Centralizes the **Liquid-Glass degradation decision** in one place: `isLiquidGlassAvailable()` → `GlassView` (iOS 26+); else (iOS 16.4–25, Android, Jest) a plain `View` rendering the same children, dropping the glass-only props. `isLiquidGlassAvailable()` is itself alpha, so it lives here too.
- **`chrome/expo-ui.tsx`** — the only import site for `@expo/ui` (SDK-56 native controls — SwiftUI / Jetpack Compose). Re-exports the **universal** entry's `Host` + `Picker` (the universal `Picker` carries `Picker.Item` as a static compound member), `DateTimePicker` from `@expo/ui/community/datetime-picker`, and the anchored `MenuView` plus its ref type from `@expo/ui/community/menu`. The wrapper is **thin**: it does **not** theme native controls. Operational facts: `@expo/ui` **autolinks** (ships `expo-module.config.json`, no `app.plugin.js`) → **no `app.config.ts` plugin entry**; its babel-plugin is **`Icon`-only** (not added until an `Icon` consumer); its native module has no off-device JS, so Jest needs suite-wide mocks for each imported subpath. See ADR [010](./decisions/010-expo-ui-chrome-wrapper.md) and ADR [012](./decisions/012-personal-event-datetime-picker.md).
- **`chrome/date-time-picker-ios.tsx`** — private to `date-time-picker.tsx`, not on the barrel.
  When an iOS caller passes `alignment` or `accessibilityLabel`, the chrome `DateTimePicker`
  composes `Host matchContents={{ vertical: true }}` and the SwiftUI `DatePicker` from
  `@expo/ui/swift-ui` here instead of rendering the community component, whose host takes the
  row's width and centres the pills. It maps every iOS prop the community component reads (display
  style, mode, range, tint, disabled, locale/color-scheme/time-zone environment, `testID` on the
  `DatePicker`, `onValueChange` over `onChange`), then adds
  `frame({ maxWidth: Infinity, alignment: "leading" })` for `alignment="leading"` and
  `title` + `labelsHidden()` for the name. The `Host` carries no identifier (L12). Gate:
  `date-time-picker.test.tsx`; on an `@expo/ui` bump, re-read
  `community/datetime-picker/DateTimePicker.tsx` against this mapping.
- **`chrome/native-text-entry-dialog*`** — the narrow composed-control exception in ADR
  [056](./decisions/056-compose-native-dialog-behind-chrome.md). One stable contract privately
  adapts SwiftUI and Material 3 text fields, progress, native buttons, observable buffers, keyboard
  insets, selectors, and explicit dismissal. `inputKind: "code"` disables auto-capitalization and
  autocorrect on both platforms for case-sensitive strings (tokens). Features keep validation, data, copy, and lifecycle;
  ordinary controls remain thin re-exports. Native controls follow system appearance and typography.
- **`chrome/native-list.tsx`** — the bounded native-list composition exception in ADRs
  [060](./decisions/060-platform-native-settings-composition.md) and
  [072](./decisions/072-native-list-seam.md). SwiftUI Form/Section and Material
  LazyColumn/ListItem remain private; the stable `NativeList` (host), `NativeListSection`,
  `NativeListRow`, `NativeListSwitchRow`, `NativeListChoiceRow`, `NativeListAlert`,
  `NativeListHeader`, and `NativeListRadioDialog` contracts receive the app-resolved light/dark scheme and one brand accent:
  - **iOS:** the Form carries `tint(primary)`, so Toggles, checkmarks, and control accents are brand
    pink. Inside a SwiftUI Button, hierarchical `.primary`/`.secondary`/`.tertiary` resolve against
    the tint, so row labels use the concrete `text` token, values `textSecondary`, and the
    footnote-semibold `chevron.forward` disclosure `textTertiary`; the selection checkmark is
    subheadline-semibold in `primary`; the default Form button style
    keeps the full-row highlight. An optional row `icon` renders a white SF Symbol on a 29pt continuous
    rounded-square tile in `primaryStrong` (the white-on-brand fill pair). Section footers use the
    native Section footer. At accessibility text sizes (`useIsAccessibilityTextSize`) a row with a
    `value` stacks the value under the label, beside the icon tile, with the navigation chevron
    kept trailing; the stacked value row is plain text whose label carries the row's
    accessibility, with the visible value hidden. At those sizes a single-word label is one line
    with `minimumScaleFactor` 0.5, so it shrinks instead of breaking mid-word.
  - **Android:** every Compose Host (list, dialog, header action and FAB) is a
    `SeededComposeHost` (`chrome/compose-host.tsx`, not on the barrel), which passes the
    app-resolved `colorScheme` and `seedColor = primary`. Each section is
    a `titleSmall`/`primary` heading inset 16dp, then one grouped list: rows are `surfaceContainer`
    segments 2dp apart with 20dp outer and 4dp inner corners chosen by child position, 16dp side
    margins, no dividers, and no chevron. Headlines are `bodyLarge`/`onSurface`, supporting values
    `bodyMedium`/`onSurfaceVariant`, footers `bodySmall`/`onSurfaceVariant`. Row icons are flat
    Material Symbols tinted `onSurfaceVariant` in the leading slot. The radio dialog is a
    `selectableGroup` Column of full-width 56dp radio rows. A switch row is a toggleable
    `ListItem` (role switch) carrying `testID`; its trailing Material `Switch` carries
    `switchTestID` and is still its own unlabeled TalkBack stop, a known violation
    ([accessibility.md](./accessibility.md) → Proof in CI). Choice and radio-dialog `RadioButton`s
    take no `onClick` and add no semantics of their own. Every navigation, value and action row's
    Compose node carries one content description (name, then value, then hint) and, on navigation
    and action rows, `Role.Button`, through the `timecalendarSemantics` modifier from the local
    module `modules/compose-semantics`. `ComposeListRow` places it last, so it clears the
    `ListItem` text inside it and keeps the `testID` tag and the click action outside it. Segment
    corners, gap and margins come from `ListGeometry.android`.
  - **Row subtitle and destructive rows:** a row `subtitle` is a second line under the label (iOS
    `subheadline`/`textSecondary` in a leading VStack; Android the supporting slot, which moves any
    `value` to trailing `labelLarge`/`onSurfaceVariant` text). The default accessibility label reads
    `label, subtitle`. A `destructive` action row labels in `error` (iOS) or Material `error`
    (Android).
  - **Floating action:** a page that shows a `FloatingAction` passes `reservesFloatingAction` to
    `NativeList`, which pads its Android bottom by `Layout.fabClearance` so the last row clears the
    button ([Header and floating actions](#header-and-floating-actions--useheaderactions-floatingaction-srccomponentschrome)).
  - **Placement:** the standalone native dialogs and editors (`NativeListRadioDialog`,
    `NativeListNumericEditor`, `NativeTextEntryDialog`) each mount their own native host, so
    they render as siblings after `</NativeList>`, never inside it. Nested inside the
    Compose list host, the dialog window is orphaned: Cancel and input are dead and the window
    outlives a JS reload. `NativeList` provides a private context
    (`chrome/native-list-context.ts`), and each of the three throws on its first render
    inside it, whatever file the misplaced call sits in. A screen whose row lives in a section and
    whose dialog follows the host shares one controller hook between them (`useEnvironmentSelector`
    on the developer page). Enforced by `native-list.test.tsx`, `native-list-numeric-editor.test.tsx`
    and `native-text-entry-dialog.test.tsx`.
  - **Help copy** lives in section footers, never as text rows inside a group: one setting per
    section when each needs its own explanation.
  - **`NativeListAlert`** is the page-level failure pattern and renders first on the page. iOS:
    its own Section with an `exclamationmark.triangle.fill` glyph in `error`, a `headline`/`text`
    title, a `subheadline`/`textSecondary` message, and an optional tinted Button action row.
    Android: one 20dp-rounded `errorContainer` ListItem (`titleMedium` title, `bodyMedium` message in
    `onErrorContainer`) with an optional trailing TextButton. Both announce `title. message` through
    the platform announcer on mount. Settled or in-progress states render nothing.
  - **Identifiers:** on iOS no chrome SwiftUI container (Form, Section, Group, stacks,
    BottomSheet) carries an accessibility identifier, because SwiftUI applies a container's
    identifier to each child and replaces theirs. Identifiers sit on leaves: rows, switches,
    buttons, fields, and text. `NativeListSection` and `NativeListAlert` take a `testID` but
    apply none on iOS, so Maestro selects rows and never sections; Android sections and alerts
    carry their `testID` (Compose `testTag` does not cascade). The text-entry dialog puts
    `ids.dialog` on its title text on iOS and on the dialog surface on Android, so one selector
    finds it on both, while cancel, submit and the field keep their own ids. Enforced by lint L12
    ([lint-format.md](./lint-format.md)) and the throwing SwiftUI container mocks; pinned by
    `native-list.test.tsx` and `native-text-entry-dialog.test.tsx`.
  - **`NativeListHeader`** (`chrome/native-list-header.tsx`) is the centered brand header
    for a page's top: the 88pt app icon (continuous rounded square on iOS, circle on Android), the
    app name as a `ThemedText` heading, a tagline, optional secondary detail, and an optional
    caption, a brand `Badge` (`size="small"`, named by its text, `captionTestID` on its root). SwiftUI and Compose text cannot carry a heading
    role, so the content is React Native hosted through `RNHostView` (`matchContents`) at a width
    derived from the window, inside a clear, zero-inset Form row on iOS and a centered Row on
    Android. It follows the app theme tokens and the OS font scale.
  - **Icons:** `NativeIcon` pairs an SF Symbol with a key of `chrome/native-icons.ts`, which
    maps each Material Symbol name to a committed vector drawable under
    `mobile/assets/icons/material/`. List rows, header actions and the FAB share it. Adding an
    Android icon means adding its XML there.
  - **Rule:** feature screens never set tint, color, or typography on list rows, sections, or
    footers; the chrome seam owns them. Features pass copy, icons, values, and intent only, and
    render the seam directly: no feature owns a row or section wrapper that another feature
    imports (ADR [072](./decisions/072-native-list-seam.md)). `local/no-retired-list-names` keeps
    the retired seam and adapter names out of `src/` ([lint-format.md](./lint-format.md) → Native list names).
  - **Numeric editor:** `chrome/native-list-numeric-editor.tsx` carries the same brand accent
    (iOS Form `tint`, Compose `seedColor`).
- **`chrome/compose-semantics.ts`** — `composeSemantics({ contentDescription, role? })`, the
  only place that names the `timecalendarSemantics` modifier type registered by
  `modules/compose-semantics` (Android). Not on the barrel; `native-list.tsx` is its consumer.
- **`chrome/list-palette.ts`** — `useListPalette()`, the grouped-list surface and text colors
  (Android from Expo UI's `getMaterialColors`, seeded with `primary`), for `ListRow`.
- **`src/design/icon/icon.tsx`** (from `@/design`) — `Icon`, the only renderer of a symbol glyph (lint L9 bans
  `SymbolView` elsewhere, ADR [065](./decisions/065-icon-text-scaling.md)). iOS renders
  `SymbolView`; Android draws the Material Symbols glyph from the closed `MATERIAL_GLYPHS` table (`icon-glyphs.ts`)
  in a box sized by the required `scaling` (see [Accessibility → Icon
  scaling](./accessibility.md#icon-scaling--encoded-in-icon)). Callers pass the color token; the
  icon carries no tone of its own.
- **`chrome/index.ts`** — the barrel. Exports `NativeTabs`, `GlassSurface`, `Host`, `Picker`, `DateTimePicker`, `MenuView`, `MenuComponentRef`, and the native list seam: `NativeList`, `NativeListSection`, `NativeListRow` (+ `NativeListRowProps`), `NativeListSwitchRow`, `NativeListChoiceRow`, `NativeListRadioDialog`, `NativeListAlert`, `NativeListHeader`, `NativeListNumericEditor` (+ its props and ids types), the header and floating actions: `useHeaderActions` (+ `HeaderAction`, `HeaderActionOptions`) and `FloatingAction` (+ `FloatingActionProps`), the `NativeIcon` type, and `useListPalette` (+ `ListPalette`). It carries no aliases.

## Header and floating actions — useHeaderActions, FloatingAction (src/components/chrome/)

One way to declare a navigation-bar action, one Android floating action. Each renders as the
platform's own control. See ADR [075](./decisions/075-header-and-floating-actions.md).

- **`useHeaderActions({ left?, right? })`** (`chrome/header-action.tsx`) returns the header slots
  a screen spreads into its one `Stack.Screen options={{ title, ...headerActions }}`. A
  `HeaderAction` is an `icon` (`NativeIcon`) or a visible `label`, never both, with a required
  `accessibilityLabel`, a `testID`, an optional `accessibilityHint`, `disabled`, and `platform`
  (`"ios"` / `"android"`) for a one-platform action. Only a declared side returns a key:
  `setOptions` merges into the previous options, so a declared side with no action for this
  platform returns its key set to `undefined`, which clears a button set by an earlier render
  (Today on the calendar). An undeclared side returns no key, so a slot the screen sets by hand
  (the calendar view menu in `headerLeft`) survives the spread whatever its order.
- **iOS:** each action is a native `UIBarButtonItem` header item (`unstable_headerLeftItems` /
  `unstable_headerRightItems`): an SF Symbol (named by `accessibilityLabel`, which also feeds the
  Large Content Viewer) or the visible label, the hint, `identifier: testID`, `disabled`.
  Targets, highlight, the Liquid Glass background and Dynamic Type caps are UIKit's.
- **Android:** `headerLeft` / `headerRight` render a centered Compose `Row` in a
  `SeededComposeHost`: an icon action is an M3 `IconButton` holding the Material Symbol at 24 dp
  with the name as content description; a text action is an M3 `TextButton` whose label is one
  `labelLarge` line with ellipsis. The full name (label, then hint) sits on the label in
  semantics (accessibility.md → Header and floating actions).
- **Tint:** the chrome tints every action `text` (`tintColor` on iOS, `contentColor` on Android).
  `HeaderAction` has no color field.
- **Create action:** a trailing iOS header item and an Android `FloatingAction`, never both,
  with one label (calendar, user calendars). Home's iOS add stays an in-content glass button,
  since `(tabs)` has no header (5.9).
- **`FloatingAction({ icon, label, testID, onPress })`** (`chrome/floating-action.tsx`) is the
  Compose M3 `FloatingActionButton` in a `SeededComposeHost`, absolute at the 16 dp margin
  (`Spacing.three`) bottom right. Its icon carries `label` as content description. Its
  `primaryContainer` / `onPrimaryContainer` colors, shape and elevation come from the seeded
  scheme; it has no color, size or variant prop. It renders nothing on iOS.
- **Clearance:** `Layout.fabClearance` (96: 56 dp FAB, 16 dp margin, 24 dp gap) is the only
  bottom clearance under a FAB: `NativeList reservesFloatingAction`, Home's Android scroll and the
  Android agenda list.
- **Gallery:** `header-action--icons`, `--text`, `--both-sides`, `--disabled`, `--platform-only`,
  `--long-strings`; `floating-action--default`, `--over-list`, `--over-scroll`, `--long-label`
  (iOS shows an "Android only" caption).
- **Gates:** `header-action.test.tsx` and `floating-action.test.tsx` at the 90% per-file tier,
  the gallery a11y matrix (the registry test renders the Android header slots), and
  `local/no-ad-hoc-header-action` ([lint-format.md](./lint-format.md) → Header actions).
- **Deferred:** the calendar view menu is a hand-built `headerLeft` until a header menu item
  exists (5.10, the one allowlist entry).

## Lint boundary — the R-1 enforcement

- The seam is **structural, not a convention**: `mobile/eslint.config.js` bans `expo-router/unstable-native-tabs`, `expo-glass-effect`, and `@expo/ui` (+ subpaths, regex `^@expo/ui($|/)`) via `no-restricted-imports` everywhere **except** `src/components/chrome/**`, which re-sets the rule without the ban (`banChromeAlpha: false`, mirroring `mutator-owns-fetch` and the storage seams). The message names the `@/components/chrome` seam.
- **Caveat the lint can't carry:** it catches the static import specifier, not a dynamic `require()` / `import()` evasion — it guards accident, review covers adversaries. The exemption is path-scoped: renaming `chrome/` or adding a new alpha surface without a wrapper requires updating the rule.
- **Chrome, design, feature boundary ([ADR 068](./decisions/068-design-layer-barrel-and-gallery-entry.md)):** tokens (`@/theme`) ← chrome (`@/components/chrome`) ← design (`@/design`) ← features. Chrome sits below the design layer: a chrome runtime file may import a design leaf by path (`@/design/text/themed-text`), never the `@/design` barrel, because `RootPage` reads `useHeaderOverlapInset` from the chrome barrel and the barrel would close a require cycle. Features and routes import primitives from `@/design` only. Gates: the `no-restricted-imports` design patterns ([lint-format.md](./lint-format.md) → Design layer), `tools/eslint-rules/design-import-policy.test.js`, and `src/design/import-graph.contract.test.ts` (no cycle through `src/design/`).

## Contrast — documented AA token pairs, computed in CI

- `src/theme/tokens.ts` documents the foreground/background **pairs** for both schemes (`text` / `textSecondary` on `background` / `backgroundElement` / `backgroundSelected`, plus the brand, status, error, destructive, home-hero, `logoSurface` and `outline` pairs), each with its two-decimal WCAG ratio. The DoD's manual contrast review checks rendered screens against these named pairs.
- **The gate:** `src/theme/contrast.ts` holds the `contrastRatio` helper (WCAG 2.x relative luminance; it throws on a translucent hex so an alpha token cannot pass by accident), `composite(fill, over)` (straight-alpha blend of a translucent fill over an opaque surface), `pairRatio(pair)` (composites when the pair names `over`) and the typed `documentedContrastPairs` table keyed on scheme and `ThemeColor`. `src/theme/theme.test.tsx` calibrates the helper against 21:1, 5.87:1 and 4.35:1 and asserts every pair against its floor: 4.5:1 for body text, 3:1 for large text and UI components. A renamed token is a `tsc` error; a value change that breaks a floor fails `test-mobile`. The gallery story `design-tokens--contrast-pairs` draws the same table with each computed ratio, so the page cannot list a pair the gate does not check. The module is not re-exported from `@/theme`.
- **Manual link (R-1 caveat):** the test cannot read the `tokens.ts` comment. A pair added to the comment needs a row in `documentedContrastPairs`, and review checks both land together.
- **Brand pairs:** white-on-`#E91E63` is **4.35:1** (large/UI only, below the 4.5:1 body floor), so **white text on brand rides `#C2185B`** (5.87:1, AA body); the identity pink `#E91E63` is the **accent/tint** (4.35:1 on white meets the 3:1 large/UI-component bar); the dark-scheme brand is `#FF4081` (6.30:1 on `#000`, AA body).
- **Button pairs:** every `Button` variant draws a documented pair: `onPrimary` on `primaryStrong`, `text` on `backgroundElement`, `actionText` on `background` and on `backgroundElement` (a `text` button inside an element-filled row), `destructive` on `backgroundElement`, all at the body floor, and the `outline` boundary at the UI floor.
- **Brand-wash pairs:** `onPrimarySoft` on `primarySoft` over `background`, `backgroundElement` and `homeHero`, composited (`over`), at the body floor in both schemes. `contrastRatio` still throws on a translucent background with no `over`.
- **Status pairs:** `positive` and `informational` on `background` and `backgroundElement` for light and dark, each an AA body-text pair. Status colors remain semantic and never substitute for event/calendar colors.
- **Call-site placement is not checked:** a static tool can't know which token lands on which background at a given site. That stays the DoD's manual review.

## What CI proves vs. what's manual

- `src/theme/theme.test.tsx` (gated by `test-mobile`: tsc + lint + Jest, R-1) asserts: (a) `useTheme` resolves a token to its expected **light** and **dark** values (mocking `@/hooks/use-color-scheme`), plus the brand **`primary`**, status, `outline` and `scrim` roles per scheme; (b) `GlassSurface` renders its children in Jest, where `isLiquidGlassAvailable()` is `false`, exercising the **fallback** path (a real `View`, not a throw); (c) **`buildNavTheme`** maps `colors.background` / `colors.primary` to the scheme-appropriate `@/theme` tokens for both schemes — the nav↔token contract; (d) every documented contrast pair clears its floor (`documentedContrastPairs`, translucent backgrounds composited over their `over` surface), and `composite` blends as specified; (e) the `Spacing`, `IconSize`, `StateOpacity`, `Elevation`, `Motion` and `Layout` values, and `MinTouchTarget` per platform (the module re-evaluated under the iOS and Android `Platform` implementations).
- `src/components/chrome/native-list.test.tsx` asserts that the same resolved scheme reaches the
  SwiftUI and Material hosts, that each platform composition contains one native scroll owner, that
  the brand reaches the iOS Form tint and every Compose `seedColor`, and that icons, footers, segment
  positions, Material text roles, and the radio-dialog structure are wired. Rendered geometry stays
  device evidence, checked through the `native-list` stories of `/developer/gallery`.
- Its "android row semantics" block asserts that every Android row carries the
  `timecalendarSemantics` modifier last, with the composed description (name, value, badge, hint) and the
  button role on navigation and action rows only. Maestro flow 03 asserts the description on a
  real Android row. Whether TalkBack speaks it in that order is device evidence (the inbox note
  `2026-10-26-mobile-ds-list-row-device-pass.md`).
- The placement invariant ("native list dialog placement" in `native-list.test.tsx`, and
  the placement cases in `native-list-numeric-editor.test.tsx` and
  `native-text-entry-dialog.test.tsx`) asserts that each standalone dialog rejects rendering inside
  `NativeList` on both platforms, a closed radio dialog included, and renders as a sibling
  after it. `features/developer/ui/developer-screen.test.tsx` renders the real environment row and
  dialog through the real host on Android.
- CI **cannot** prove and is therefore **manual** (DoD / splash visual pass): that Liquid Glass renders on iOS 26+, that the fallback looks right on iOS 16.4–25 / Android, that the contrast pairs read correctly on-device, and that each call site draws a documented pair.

## Deferred (live debt — not built)

- **No call-site contrast checker** — the documented pairs are computed in CI, but which pair a call site draws is manual review. **Trigger:** the first screen with a non-token-pair color combination, or a designer-driven palette change.
- **No in-app theme override / switcher** beyond the C1-resolved stored preference (a deeper switcher is a Settings concern).
- **No animation / reduced-motion handling in chrome** (the splash owns the reduced-motion obligation; any future chrome animation inherits it per the a11y rules).
