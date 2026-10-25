## Context

See proposal.md for the device evidence. These code facts shape the approach:

- React Native reports the text size as `useWindowDimensions().fontScale`. On iOS it is the UIKit
  content-size multiplier (`RCTAccessibilityManager.mm`): 1.0 at Large, 1.353 at xxxLarge, then
  1.786 at `accessibilityMedium` (AX1) up to 3.571 at AX5. On Android it is the system font scale,
  up to 2.0.
- `NativeSettingsRow` on iOS renders SwiftUI: `LabeledContent` for `kind: "value"`, and an
  `HStack { label, Spacer, value [badge] [chevron] }` inside a `Button` for navigation and action
  rows. At AX5 the HStack splits the width between two `Text`s and SwiftUI hyphenates the label.
  `@expo/ui` 56.0.17 has no `ViewThatFits` or `AnyLayout`, and no environment read of
  `dynamicTypeSize`, so SwiftUI cannot pick the layout itself here.
- `expo-symbols` 56.0.6 `SymbolView` on Android (`src/SymbolView.tsx`) is a JS component: a
  `View` of `size × size` wrapping a font-scaled RN `Text` (`fontSize = lineHeight = size`) in the
  `MaterialSymbols_400Regular` font. The `Text` measures inside the fixed box, so at font scale 2.0
  the glyph is twice its box and clips. Its inner `Text` takes no props from the caller. On iOS it
  is a native SF Symbol image that does not scale with text. The font is exported as
  `expo-symbols/androidWeights/regular`; the name→codepoint table (`src/android/symbols.json`) is
  not exported.
- Thirteen `SymbolView` call sites exist (Home header + FAB, Calendar header action, changelog,
  checklist progress, school row chevron, school `StatusSymbol`, onboarding Next, connect, manual
  import ×2, `ErrorState`).
- `formatShortDateTime` hard-codes `HH:mm`. `formatClockTime` / `formatHourStartLabel` already take
  the device's `uses24hourClock` and switch to a cached `Intl.DateTimeFormat` with
  `hourCycle: "h12"`. `jest/setup-localization.ts` makes `getCalendars` / `useCalendars` return
  `uses24hourClock: true`, and suites spy on them per case.
- The iOS field is `@expo/ui`'s SwiftUI `DatePicker` (compact). With no `locale` prop it uses the
  device locale and the device hour cycle. Its `locale` prop sets `environment(\.locale,
  Locale(identifier:))`. The app has an in-app language preference (`settings.languagePreference`).
- `ColorSwatchPicker` renders `Pressable` swatches with `accessibilityRole="button"`,
  `accessibilityState={{ selected }}` and the label `"Color #E91E63"`, inside a
  `View accessibilityRole="radiogroup"`. The visible field label "Color" precedes the group.
- `EventTitle` in `event-details-content.tsx` puts a 16×16 swatch and a flexible `title` text in a
  row with `alignItems: "center"`, so the dot centers on a multi-line title. The swatch carries an
  `accessibilityLabel` on a non-accessible `View`, which no screen reader reads.
- The onboarding `WelcomePage` is a `PagerView` page of `height: "100%"` with
  `justifyContent: "center"` and no scroll container; the illustration takes
  `min(0.25 × window height, 260)`.

## Goals / Non-Goals

**Goals:**

- At AX5 (iOS) and font scale 2.0 (Android), no label hyphenates or breaks mid-word on the touched
  screens, no copy clips, and no icon clips.
- Each fix has a Jest proof in the CI `test-mobile` gate (`TZ=UTC npm test -- --coverage`, 90%
  per-file branches). The two new rules (icon scaling, `SymbolView` seam) are a type and a lint
  error, not prose.

**Non-Goals:**

- Android Material 3 confirmation dialogs (inboxed, see Decision 8).
- The full design-system `Icon` catalogue (`IconName` table, `tone`, `IconSize`-only sizing). This
  change builds the scaling core that catalogue extends; call sites keep their current pixel sizes.
- Stacking rows on Android: Compose `ListItem` passed at 2.0.
- Touch-target or call-site contrast lint (still deferred in `accessibility.md`).

## Decisions

### Decision 1: one accessibility-text-size seam in `@/theme`

`src/theme/text-scale.ts` exports `AccessibilityFontScale = 1.786`,
`isAccessibilityTextSize(fontScale: number): boolean` (`fontScale >= AccessibilityFontScale`) and
`useIsAccessibilityTextSize()` (reads `useWindowDimensions().fontScale`, so it follows a live size
change). The threshold is the UIKit AX1 multiplier, so on iOS it flips exactly where HIG layouts
change shape; on Android it flips between scale 1.5 and 1.8, the top of the system range.

Alternatives: a per-screen magic number (drift, and nothing to test once); reading the
content-size category natively (needs a native module for a value RN already exposes).

### Decision 2: iOS settings rows stack at accessibility sizes, decided in JS

`SwiftSettingsRow` reads `useIsAccessibilityTextSize()`. At accessibility sizes a row with a
`value` renders `HStack(alignment: center) { VStack(alignment: leading, spacing 2) { label row
(icon tile + label [+ subtitle]), value [badge] }, Spacer, [chevron] }`: the label gets the full
width, the value sits under it in `textSecondary`, and the navigation chevron stays trailing. The
`kind: "value"` row stops using `LabeledContent` at those sizes and uses the same stacked content.
Rows without a value and default sizes are unchanged. Accessibility modifiers (identifier, label,
hint, value) stay on the same outer element, so VoiceOver reads the row the same way at every size.

Alternatives: `ViewThatFits` (not exposed by `@expo/ui` 56); `lineLimit(1)` + truncation (hides
the label, which HIG rejects at accessibility sizes); a `.fixedSize` label (overflows the row).

### Decision 3: `WordmarkMaxFontScale = 1.5` for text that carries the brand word

"TimeCalendar" is one 12-character word, so wrapping cannot help: at AX5 a `title2` or `title`
step is wider than the lane and breaks inside the word. `tokens.ts` exports
`WordmarkMaxFontScale = 1.5`, passed as `maxFontSizeMultiplier` on the Home app name and the
onboarding page titles. At 1.5 the widest case (Android `title` 28 → 42dp, "TimeCalendar!" ≈ 13 ×
0.58em) fits the 343pt readable lane of the smallest supported iPhone. The Home name also renders
`numberOfLines={1}`: if a narrow window still cannot fit it, it truncates at the tail instead of
breaking. The cap is a theme token so the call sites cannot drift and `accessibility.md` lists it
with the other caps.

The Home name moves to `type="title2"` (iOS 22/28/700 `title2` ramp; Android 24/32/400). It gains
the `header` role, which matches the Settings brand header where the app name is already a heading.

Alternatives: `adjustsFontSizeToFit` (shrinks below the user's size and is unreliable on Android);
no cap with character wrapping (the reported defect); hiding the name at accessibility sizes (the
logo alone does not name the app).

### Decision 4: onboarding pages scroll, and the illustration yields at accessibility sizes

`WelcomePage` wraps its `AdaptiveContent` in a vertical `ScrollView` with
`contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}`, so content centers when it
fits and scrolls when it does not; `PagerView` keeps horizontal paging. `WelcomeScreen` halves
`illustrationHeight` when `useIsAccessibilityTextSize()` is true, so the title and body stay near
the top of the page. Page titles cap at `WordmarkMaxFontScale` (Decision 3). The footer and Skip
controls keep their current layout; they use `minHeight` and grow with text.

Alternatives: one ScrollView around the whole pager (fights the pager's gesture and loses per-page
scroll position); hiding the illustration (it carries the page's visual identity at default sizes,
and halving is enough to unclip).

### Decision 5 (ADR 064): icons declare their scaling; Android draws its own glyph box

`src/components/icon.tsx` exports `Icon`:

```ts
type IconProps = {
  ios?: SFSymbol
  android?: MaterialGlyph
  size: number
  color: string
  testID?: string
} & ({ scaling: "fixed" } | { scaling: "text"; maxFontSizeMultiplier?: number })
```

- `scaling` is required, so every call site makes the decision at the type level. `"text"` is for
  a glyph beside or inside a text control (Next arrow, open-in-new, QR/link buttons, school-row
  chevron, checklist progress, changelog item): the rendered size is
  `size × min(fontScale, maxFontSizeMultiplier ?? ∞)`, and the box is that size, so the container
  grows with it. `"fixed"` is for standalone chrome (header actions, FAB, `StatusSymbol`,
  `ErrorState` glyph): the size stays `size`.
- iOS renders `SymbolView` with the resolved size (SF Symbols are images and do not font-scale).
- Android renders a `View` of the resolved size holding an RN `Text` in
  `MaterialSymbols_400Regular` (loaded with `expo-font` `useFonts` from
  `expo-symbols/androidWeights/regular`). `"text"` passes `fontSize = lineHeight = size` with the
  OS scaling it (capped by `maxFontSizeMultiplier` when set). `"fixed"` passes
  `maxFontSizeMultiplier={1}`, the cap lint L8 permits. The glyph string comes from a closed
  `MaterialGlyph` table (`{ arrow_forward: 0xe5c8, … }`) holding only the glyphs the app uses; a
  test pins each codepoint against `expo-symbols`' `symbols.json`. Before the font loads, the box
  renders empty at the resolved size, so layout does not jump.
- `Icon` is always decorative (`accessible={false}`, `accessibilityElementsHidden`,
  `importantForAccessibility="no-hide-descendants"`); the control that contains it owns the label.
  A platform with no symbol renders nothing.
- Lint L9 (`no-restricted-imports`, `importNames: ["SymbolView"]` on `expo-symbols`) applies
  everywhere except `src/components/icon.tsx` and its test. Types (`SFSymbol`, `AndroidSymbol`) stay
  importable.

Alternatives: patch `expo-symbols` (a patch over an alpha-churn package, and its fixed box is the
design flaw); `@expo/ui` Compose `Icon` in a Host per glyph (a native host per icon inside RN
pressables, with unproven touch pass-through, plus the `@expo/ui` babel plugin); the
`unstable_getMaterialSymbolSourceAsync` image path (async, unstable, and an image does not scale
with text by itself); a documented exemption from L8 (still clips).

### Decision 6: the clock preference is a required formatter argument

`formatShortDateTime(date, locale, zone, uses24HourClock: boolean | null)`: `false` renders
`d MMM` + the cached `hour12Formatter(locale, zone, true)` output; `true` or `null` keep `HH:mm`
(the same `!== false` convention as `formatClockTime`). The argument is required, so `tsc` finds
every caller. The Android field and `personal-events-list.tsx` pass
`useCalendars()[0]?.uses24hourClock ?? null`. The field's accessible name already composes from the
same display string, so the announcement follows.

iOS `DateTimeField` passes `locale` = `toPickerLocale(locale, regionCode, uses24HourClock)`,
for example `"fr_FR@hours=h23"` or `"en_GB@hours=h12"`: the language is the app locale, the region
is the device's `getLocales()[0]?.regionCode` (falling back to `FR` / `US`), and the keyword is
`h23` when the device is 24-hour or unknown and `h12` otherwise. Foundation honors the `hours` keyword from iOS 16, below the 16.4 floor. The picker then
reads in the app language and keeps the device hour cycle. The helper is pure and tested.

Alternatives: default the argument to `null` (a new caller would silently ignore the device); pass
no iOS locale (follows the device clock but ignores the in-app language); a bare app locale
(`fr_FR` pins 24-hour and overrides the device toggle).

### Decision 7: swatches carry names, and selection uses each platform's native semantics

`color-swatch-presets.ts` exports `SWATCH_PRESETS` (unchanged) and
`SWATCH_NAME_KEYS satisfies Record<SwatchPreset, ParseKeys>` (i18next's key type, typed by `src/i18n/i18next.d.ts`) (pink, purple, indigo, light blue,
teal, green, orange, brown: `personalEvents.color.name.<id>`; FR rose, violet, indigo, bleu clair,
sarcelle, vert, orange, marron). A preset without a name is a `tsc` error. The label is the name
alone, because the visible "Color" field label precedes the group. Android: `accessibilityRole=
"radio"` + `accessibilityState={{ checked }}` (TalkBack: "Pink, radio button, checked, 1 of 8"
inside the `radiogroup`). iOS: `accessibilityRole="button"` + `selected` (VoiceOver: "Selected,
Pink, button"), the UIKit idiom, which has no radio trait. `personalEvents.color.swatchLabel` is
removed.

Alternatives: a single `radio` role on both (iOS has no radio trait, so VoiceOver announces no
state reliably); computing names from hue (unstable, untranslatable).

### Decision 8: Android Material 3 confirmations are a separate change

RN `Alert` on Android builds an AppCompat `AlertDialog` inside `AlertFragment`, themed by
`alertDialogTheme` under the CNG `Theme.AppCompat.DayNight.NoActionBar`. A config plugin that
points `alertDialogTheme` at a Material 3 overlay needs every M3 color role as static XML for both
schemes (generated from the pink seed), relies on AppCompat button inflation honoring M3 widget
styles, and keeps RN's own `alert_title_layout`. None of it is observable in Jest, and the result
would still not be the 28dp M3 dialog. The native-correct path matches ADR 056/060: a chrome
confirm primitive that renders an `@expo/ui` Compose `AlertDialog` in its own seeded host on Android
and keeps `Alert` (UIAlertController) on iOS, with a lint ban on `Alert` in features. That is a new
primitive plus six call-site migrations and their tests, which is a change of its own. The design
and the rejected alternative are recorded in
`docs/react-native-migration/inbox/2026-10-25-mobile-android-m3-alerts.md`.

### Decision 9: the event-details dot sits in a first-line strut

The title row uses `alignItems: "flex-start"`. The swatch sits in a `View` with
`justifyContent: "center"` that also contains a hidden `ThemedText type="title"` holding a
zero-width space (`width: 0`, `accessibilityElementsHidden`,
`importantForAccessibility="no-hide-descendants"`). The strut's height is one `title` line at the
current scale, including the iOS `title1` Dynamic Type curve and Android's linear scaling, so the dot
centers on the first line. The dot is decorative: the label is removed and the strut hides it from
assistive technology. `eventDetails.colorLabel` is removed from both catalogs.

Alternatives: a computed `marginTop` from `lineHeight × fontScale` (wrong on iOS, where
`dynamicTypeRamp` scales titles less than linearly); `alignItems: "baseline"` (aligns the dot's
bottom edge to the baseline, not its center to the line).

## Risks / Trade-offs

- [The 1.786 threshold is iOS-derived; Android flips only above 1.5] → Android settings rows do
  not use it, and onboarding halving at 1.8–2.0 is the intended behavior. Revisit with the ADR.
- [Android `Icon` duplicates `SymbolView`'s font rendering] → one file, pinned by the codepoint
  test; ADR 064 revisits when `expo-symbols` sizes its Android box with the font scale.
- [`@hours=` keyword ignored by `UIDatePicker` on some iOS version] → the conductor's iOS pass
  checks 12-hour and 24-hour devices in FR and EN; the fallback is to drop the iOS `locale` prop,
  a one-line change in `DateTimeField`.
- [Capping brand text at 1.5 limits growth for low-vision users] → the cap applies only to the two
  wordmark strings, which are 33–42pt at the cap; body copy beside them is uncapped.
- [JS-side stacking re-renders rows on a text-size change] → the size changes rarely, and the hook
  reads one dimension value.

## Migration Plan

No data or native change; the PR ships as one commit set. Rollback is a revert. ADR 064 is added
to `decisions/README.md` with the change.
