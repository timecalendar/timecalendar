**For:** whoever runs the Android device and screen-reader passes (OpenSpec
`migrate-mobile-form-screens-to-design-system`). The iOS simulator pass runs in the delivery
pipeline. A TalkBack session and Android rendering need a person on a device or the Windows host,
never the Mac.

# Form screens on the design system: Android device pass

## Status

Not done. The Windows build host (`ssh pc`) was unreachable on 2026-10-26, so the delivery
pipeline could not build or run Android. Everything below is still open.

## What I need

A pass in French and English on an Android development build of
`feat/mobile-ds-5-2-form-screens`, in light and dark, at the default font scale and at 2.0.
Gallery stories open with `timecalendar-dev://developer/gallery/<id>`.

1. **Gallery.** `keyboard-safe-action-layout--default`, `--fills-viewport` and `--long-strings`:
   - Focus the field. The Submit button sits directly above the keyboard, with the same spacing
     above and below it as in the other two stories.
   - In `--fills-viewport` the intro and field are vertically centred and the page does not
     scroll by the app-bar height.
2. **Institution name and Programme.** Welcome → school picker → "I can't find my school" →
   institution name → Continue → Programme:
   - Intro and field are centred. Continue sits above the keyboard when the field is focused.
   - At 2.0 the field and its error ("Enter your institution's name.") stay reachable by
     scrolling, and Continue is never covered.
   - TalkBack: Programme Skip reads its accessibility label, and Continue reads as disabled while
     the field is empty.
3. **iCal URL.** Reach it through the guide → manual import → iCal URL:
   - Enter an invalid URL and press Import. The inline error appears under the field.
   - With the network off, a failed import shows the error notice and the "Report a problem" link above
     Import, 8 dp apart. Import stays above the keyboard.
4. **Feedback.** Settings → Feedback:
   - The Send region now has 12 dp of space above it, matching the other forms. Check it does not
     look detached from the message field when the keyboard is closed.
   - Send something. TalkBack announces the "Sending…" status politely, in the secondary text
     color in both schemes.

## Why

Jest proves the flattened styles and the type-level centred-form rule, not what the keyboard and
TalkBack do on a device. Android builds freeze the Mac, so the pipeline cannot run this pass.

## How to verify

Record pass or fail for each item with a screenshot in this file (and the TalkBack transcript for
items 2 and 4), then move the file to `done/`. A failure in item 1 or the spacing in item 4 is a
fix in `mobile/src/design/layout/keyboard-safe-action-layout.tsx`. A failure that shows only on
one screen is a fix in that screen.

## Blocks

Nothing. The PR merges on green CI and the iOS pass. This closes roadmap slice 5.2's Android
device check.
