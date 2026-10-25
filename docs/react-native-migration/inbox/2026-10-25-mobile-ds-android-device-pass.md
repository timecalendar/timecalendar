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
| Environment picker (development capability)                                                                                                    | FAIL: orphaned dialog, fixed in `fix-mobile-ds-android-pass`                                            |
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

1. **Re-check the environment picker on Android** after `fix-mobile-ds-android-pass` merges, on a
   development-capability build. Cancel closes the dialog and Settings responds. Back closes it.
   Selecting another environment shows the confirmation with no dialog behind it. After "Clear and
   switch" the app reloads with no leftover window (`adb shell dumpsys window | grep -i dialog`
   shows none).
2. **TalkBack swipe-through on a physical Android device.** TalkBack was enabled on the API 36
   emulator but never bound, so accessibility was checked through the uiautomator tree only. On
   device: Home section titles are announced as headings, and the personal-event Starts/Ends
   fields announce "Starts, <date time>, button". Also sweep Settings and onboarding.
3. **Icon scaling policy (decision needed).** On Android, expo-symbols 56.0.6 `SymbolView` renders a
   font-scaled Text glyph inside a fixed-size box, so glyphs clip at font scale 2.0. The onboarding
   Next arrow is visibly clipped. This affects about 12 call sites. Lint L8 bans
   `allowFontScaling={false}`, so the fix is either an upstream fix, a box that scales with the
   font scale, or a documented exemption. Owner: design-system phase 3.2 (`Icon` primitive).
4. **12/24h field format.** The Android personal-event field shows a 24h `HH:mm` value
   (`formatShortDateTime`, `mobile/src/features/calendar/data/format.ts:225`). The time dialog and
   the calendar gutter follow the device's 12h setting. Decide whether the field follows the device
   clock setting.
5. **Android `Alert` styling.** React Native's `Alert` on Android uses AppCompat styling (teal
   accent, ALL CAPS buttons), not Material 3 or the brand. Decide whether confirmations move to a
   chrome Material dialog.
6. **Event details color dot alignment.** At 2x, the color dot centers on a three-line title
   instead of aligning with the first line. Owner: phase 5.8 (Event details).
7. **Multi-day personal events** are not drawn in the week view. This is known
   (`docs/mobile/architecture-book/calendar.md:147`) and is listed here only for completeness.

## Why

Each open item needs a physical device, a human screen-reader pass or a product decision that
this change cannot make.

## How to verify

Items 1 and 2 pass on device, with the results recorded in this file or in the PR. Items 3 to 5
each get a decision, either as an OpenSpec change or as an ADR.

## Blocks

Nothing blocks merge. Item 1 is the device confirmation of the severe fix.
