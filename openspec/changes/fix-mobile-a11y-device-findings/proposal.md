## Why

The design-system device passes (iOS 26 simulator at AX5, Pixel 10 API 36 at font scale 2.0)
found accessibility defects that the merged PRs #479–#483 left open: labels that hyphenate or break
mid-word at the largest text sizes, onboarding copy clipped by a fixed pager page, Android icons
clipped inside fixed boxes, a date field that ignores the device's 12-hour setting, color swatches
that announce hex codes, and a misaligned color dot. Accessibility is an owner-declared workstream,
and each defect fails the Definition of Done's Accessibility axis on a screen that already ships in
previews. This change fixes them and encodes the rules that keep them fixed.

## What Changes

- **Accessibility text size seam.** `src/theme/text-scale.ts` exports `AccessibilityFontScale`
  (1.786, the UIKit `accessibilityMedium` multiplier that React Native reports as `fontScale`),
  `isAccessibilityTextSize(fontScale)` and `useIsAccessibilityTextSize()`, re-exported from
  `@/theme`. Layouts that change shape at accessibility sizes read this one seam.
- **Settings value rows stack at accessibility sizes (iOS).** `NativeSettingsRow` (value,
  navigation and action kinds with a `value`) renders the label above the value at accessibility
  text sizes, with the disclosure chevron kept trailing, so neither label nor value is squeezed into
  a hyphenated column. Default sizes keep the side-by-side layout. Android Compose `ListItem` rows
  passed at 2.0 and do not change.
- **Onboarding welcome page scrolls instead of clipping.** Each pager page wraps its content in a
  vertical `ScrollView` that centers when the content fits and scrolls when it does not. At
  accessibility text sizes the decorative illustration takes half its height. The page title caps
  at `WordmarkMaxFontScale` so "TimeCalendar!" never breaks off a character.
- **Home app name on the ramp.** The Home brand lockup renders `ThemedText type="title2"`, one
  line, capped at `WordmarkMaxFontScale` (1.5, a new `@/theme` token for text that carries the
  unbreakable brand word). The local 21/28/700 style is removed.
- **`Icon` primitive (R-1).** `src/components/icon.tsx` is the only renderer of a symbol glyph.
  Every icon declares `scaling: "text"` (beside or inside a text control: the glyph and its box grow
  with the font scale, optionally capped to match the neighbor text) or `scaling: "fixed"`
  (standalone chrome: the glyph keeps its size and never clips). iOS renders `SymbolView`; Android
  draws the Material Symbols glyph in its own box sized by the scaling rule, which replaces
  `expo-symbols`' fixed box that clips at 2.0. All 13 `SymbolView` call sites move to `Icon`. A new
  lint rule (L9) bans importing `SymbolView` from `expo-symbols` outside the `Icon` module.
- **Date/time display follows the device clock.** `formatShortDateTime` takes the device's
  `uses24hourClock` as a required argument and renders 12-hour time in the app locale when it is
  `false`. The Android personal-event field (display and its accessible "label, value" name) and the
  personal-events list pass `useCalendars()[0].uses24hourClock`. The iOS SwiftUI picker receives
  the app locale with the device hour cycle (`fr_FR@hours=h12`), so it reads in the app language
  and still follows the device setting.
- **Color swatches announce color names.** Each preset has a translated name (FR/EN) through an
  exhaustive `Record<SwatchPreset, …>`. Swatches announce the name and their selected state: role
  `radio` with `checked` on Android inside the existing `radiogroup`, role `button` with
  `selected` on iOS. The hex label key is removed.
- **Event details color dot aligns to the first title line.** The dot sits in a strut sized by a
  hidden `title`-step line, so it centers on the first line at every scale on both platforms. The
  dot is decorative and hidden from assistive technology; the unlabelled `eventDetails.colorLabel`
  key is removed.
- **Out of scope, inboxed: Android Material 3 confirmation dialogs.** React Native's `Alert` on
  Android is an AppCompat dialog built inside `AlertFragment`. Six call sites use it with three
  shapes (destructive confirm, three-action chooser, single-button notice). Reaching Material 3
  needs a new chrome dialog primitive and the migration of all six sites, which is a change of its
  own. `docs/react-native-migration/inbox/2026-10-25-mobile-android-m3-alerts.md` records the
  recommended design and the rejected theme-plugin alternative.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-a11y`: icons follow an explicit text-scaling contract and never clip; layouts read one
  accessibility-text-size seam; unbreakable brand text caps its scale.
- `mobile-lint-format`: L9 bans `SymbolView` outside the `Icon` primitive.
- `mobile-settings-hub`: iOS settings rows stack label above value at accessibility text sizes.
- `mobile-onboarding-flow`: welcome pages scroll rather than clip, and the title never breaks
  mid-word.
- `mobile-home`: the Home app name uses a ramp step, stays on one line and caps its scale.
- `mobile-personal-events-ui`: date/time display follows the device 12/24-hour setting; color
  swatches announce translated names and selection.
- `mobile-event-details`: the color dot aligns to the first title line and is decorative.

## Impact

- Code: `mobile/src/theme/{text-scale.ts,tokens.ts,index.ts}`; new `mobile/src/components/icon.tsx`
  (+ test); `mobile/src/components/chrome/native-settings.tsx`; onboarding
  `welcome-pages.tsx` / `welcome-screen.tsx` / `welcome-pager.tsx`; Home `home-screen-header.tsx`;
  `features/calendar/data/format.ts`; personal-events `date-time-field.tsx`,
  `personal-events-list.tsx`, `color-swatch-picker.tsx`, `color-swatch-presets.ts`;
  `features/calendar/ui/event-details-content.tsx`; the 13 `SymbolView` call sites;
  `mobile/eslint.config.js` (L9); FR/EN catalogs (eight color names added, two keys removed);
  colocated tests.
- No new dependency, route, native configuration or server/OpenAPI change. Nothing changes in the
  Flutter `app/`.
- Book: `accessibility.md` (icon scaling contract, accessibility-size seam, wordmark cap, settings
  stacking, swatch names, 12/24h), `theming.md` (`Icon`, `WordmarkMaxFontScale`, text-scale seam),
  `lint-format.md` (L9), `features.md` (personal events, Home, onboarding, event details), and a
  dated `CHANGELOG.md` entry. ADR 065 records the icon scaling and Android glyph rendering decision.
