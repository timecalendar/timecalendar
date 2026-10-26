**For:** whoever runs the device passes (an Android build has to run on the Windows host, and the
check needs eyes and TalkBack on a real screen).

# Onboarding welcome, connect and manual import (OpenSpec `ds-5-1-onboarding-screens`): Android device pass

## What I need

On an Android dev build of `main` (the change is merged), run the steps below and record pass or
fail per line.

1. Build and launch the development variant on the Windows host (`ssh pc`), then open
   `timecalendar-dev:///onboarding` with
   `adb shell am start -a android.intent.action.VIEW -d "timecalendar-dev:///onboarding"`.
2. Default font size, light theme, welcome screen:
   - The Skip bar is 64 dp tall (`MinTouchTarget` 48 + `Spacing.three` 16) and Skip sits
     vertically centred in it, right-aligned.
   - The page indicator dots are centred in a 48 dp tall touch row.
   - Swipe through the three pages: the entrance fade is 250 ms (`Motion.base`) and the
     indicator transition 150 ms (`Motion.fast`); neither stutters.
   - Next on pages 1 and 2, "Let's go!" on page 3 open school selection.
3. Repeat step 2 in dark theme.
4. Largest font size (Settings > Display > Font size at maximum, display size default), **cold
   launch** the app after changing it:
   - Title, body, Skip, Next and "Let's go!" all wrap and none is clipped or ellipsized.
   - The Skip bar grows with its label.
   - On page 3 the Skip bar drops back to 64 dp and the pager moves up a few dp. That move is
     accepted (design D2); anything larger is a fail.
5. Connect and manual import (pick a listed school, then a programme, to reach Connect; Continue
   leads to the export guide; the manual import screen is reached from it): both render as on iOS,
   with outlined Back and filled Continue in one `ButtonRow`, and the intranet link button showing
   an `open_in_new` trailing icon when the school has an intranet URL.
6. TalkBack on, welcome screen:
   - Swipe order: Skip, page title, page body, page indicator, Next.
   - Skip, Next and "Let's go!" are announced as buttons with their visible labels.
   - The page indicator announces the current page ("page 1 of 3" or the localized equivalent).
   - On Connect, the intranet button is announced as a link with the
     `onboarding.connect.intranetLabel` text, and Back / Continue as buttons.

## Why

Android builds do not run on the Mac, and `ssh pc` was unreachable on 2026-10-26 (connection timed
out), so this pass ran on the iOS 26 simulator only.

## How to verify

Every line above passes, or a failing line has a follow-up change that fixes it.

## Blocks

Nothing; informational.

## iOS findings, for context

The iOS 26 simulator (iPhone 17 Pro) pass covered the welcome screen in light and dark at the
default size and at AX5, cold-launched each time. All text wrapped; nothing clipped. Connect and
manual import were not reachable on the simulator because the local schools API was down; their
code changes are comment-only.

Changing the text size while the app is running leaves every React Native text with its old frame
on iOS, so text clips until relaunch. That is app-wide, not specific to these screens; see
`2026-10-26-ios-runtime-dynamic-type-stale-text-layout.md`.
