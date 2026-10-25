**For:** whoever runs the next Android and TalkBack pass. Android builds run on the Windows host
(`ssh pc`) or in GitHub Actions, never on the Mac. TalkBack needs a physical device.

# Design-system Android device pass (PRs #479, #480, #481)

The pass ran on a Pixel 10 AVD (API 36, en-US) with a dev-variant APK built in GitHub Actions. The
OnePlus 6 and the Windows PC were unavailable. OpenSpec change `fix-mobile-ds-android-pass` fixes
the in-scope defects.

## Per-check results

| Check                                                                                                                                          | Result                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Personal-event date and time end to end (date dialog then time dialog, cancel at either step leaves the value, commit both, validation clears) | PASS                                                                                                    |
| Environment picker (development capability)                                                                                                    | FAIL: orphaned dialog, fixed and re-checked PASS                                                        |
| School picker `StatusSymbol` search glyph, 1x, dark                                                                                            | PASS                                                                                                    |
| Calendar header icons not pink, light                                                                                                          | PASS                                                                                                    |
| Home, Settings, onboarding and Event details, light and dark, visual                                                                           | PASS                                                                                                    |
| 2x font scale layouts                                                                                                                          | PASS, except the `SymbolView` clipping below                                                            |
| Settings Compose rows expose merged labels and section titles (uiautomator)                                                                    | PASS                                                                                                    |
| Home populated section titles are headings                                                                                                     | FAIL: fixed in `fix-mobile-ds-android-pass`                                                             |
| Android `DateTimeField` announces its value                                                                                                    | FAIL (uiautomator: content-desc "Starts", value only as a child), fixed in `fix-mobile-ds-android-pass` |
| School picker search text, dark                                                                                                                | FAIL: fixed in `fix-mobile-ds-android-pass`                                                             |
| School picker error state inset                                                                                                                | FAIL: fixed in `fix-mobile-ds-android-pass`                                                             |

**Type ramp verdict (ADR 063):** the Material 3 weight-400 headings read as headings by size next
to the weight-500 labels in light, dark and at 2x. No weight change is needed, and ADR 063 stays
as written. This answers `2026-10-25-mobile-type-ramp-android-device-pass.md`.

## What I need (open items)

1. **TalkBack swipe-through on a physical Android device.** TalkBack was enabled on the API 36
   emulator but never bound, so accessibility was checked through the uiautomator tree only. On
   device: Home section titles are announced as headings, and the personal-event Starts/Ends
   fields announce "Starts, <date time>, button". Also sweep Settings and onboarding.
2. **Icon scaling policy.** Addressed by `fix-mobile-a11y-device-findings` (ADR 065: the `Icon`
   primitive with a required `scaling`, lint L9); needs the 2.0 device re-check. On Android, expo-symbols 56.0.6 `SymbolView` renders a
   font-scaled Text glyph inside a fixed-size box, so glyphs clip at font scale 2.0. The onboarding
   Next arrow is visibly clipped. This affects about 12 call sites. Lint L8 bans
   `allowFontScaling={false}`, so the fix is either an upstream fix, a box that scales with the
   font scale, or a documented exemption.
3. **12/24h field format.** Addressed by `fix-mobile-a11y-device-findings`: the field, its
   accessible name and the list follow the device clock setting. The Android personal-event field shows a 24h `HH:mm` value
   (`formatShortDateTime`, `mobile/src/features/calendar/data/format.ts:225`). The time dialog and
   the calendar gutter follow the device's 12h setting. Decide whether the field follows the device
   clock setting.
4. **Android `Alert` styling.** Deferred to its own change:
   `2026-10-25-mobile-android-m3-alerts.md`. React Native's `Alert` on Android uses AppCompat styling (teal
   accent, ALL CAPS buttons), not Material 3 or the brand. Decide whether confirmations move to a
   chrome Material dialog.
5. **Event details color dot alignment.** Addressed by `fix-mobile-a11y-device-findings` (the
   dot sits in a first-line strut). At 2x, the color dot centers on a three-line title
   instead of aligning with the first line.
6. **Multi-day personal events** are not drawn in the week view. This is known
   (`docs/mobile/architecture-book/calendar.md:147`) and is listed here only for completeness.
7. **Color swatch labels read hex codes.** Addressed by `fix-mobile-a11y-device-findings`
   (translated FR/EN names, radio/checked on Android). The personal-event color swatches announce
   "Color #E91E63", which a screen-reader user can't use. They need color names (FR/EN).

The environment picker lives on Settings › Developer (`/developer`, Backend section). It was
re-checked on the same emulator with the fix running through Metro: Cancel and Back close the
dialog, selecting an option shows the confirmation with nothing behind it, and the app keeps one
window with no dialog window, including after "Clear and switch" reloads the app. The Android date
fields expose "Starts, 25 Oct 22:40" in the accessibility tree.

## Why

Each open item needs a physical device, a human screen-reader pass or a product decision that
this change cannot make.

## How to verify

Item 1 passes on a physical device, with the results recorded in this file. Items 2 to 5 and 7
each get a decision or a fix, either as an OpenSpec change or as an ADR.

## Blocks

Nothing blocks merge. The severe environment-picker fix is confirmed on the emulator; item 1 is
the physical-device screen-reader confirmation.
