**For:** whoever runs screen-reader and device passes on Android (OpenSpec
`mobile-ds-header-action`). The iOS simulator pass runs in the delivery pipeline. A real TalkBack
session and Android rendering need a person on a device or the Windows host, never the Mac.

# Header and floating actions: Android device pass

## What I need

A pass in French and English on an Android development build of `feat/mobile-ds-header-action`.
Run it in light and dark, at the default font scale and at 2.0. Story ids open with
`timecalendar-dev://developer/gallery/<id>`.

1. **Icon actions.** On `header-action--icons` and the Calendar tab:
   - Today is a 48 dp Material icon button in the top app bar with a round ripple, drawn in the
     primary text color (not pink).
   - TalkBack reads "Go to today, button" as one stop, and a double tap goes to today.
2. **Text actions.** Check `header-action--text`, Programme Skip, the changelog sheet Close and
   event details Edit / Hide / Un-hide:
   - The label is a Material text button in the primary text color.
   - TalkBack reads the accessibility label, not the visible word: "Skip naming your programme,
     button", not "Skip". With a hint, the hint follows the label ("Close, Closes what's new…").
   - A double tap performs the action. This is the risky part: the semantics modifier sits on the
     label `Text`, and the button must keep its click action.
3. **Long labels at 2.0.** On `header-action--long-strings` and Programme in French ("Passer"):
   - The text action stays on one line and ellipsizes if it must.
   - The title is not pushed off-screen and the bar height does not change.
4. **Disabled.** On `header-action--disabled`, the item is dimmed, inert, and announced as
   disabled.
5. **FAB look and clearance.** Home, Calendar (agenda view) and Settings → My calendars:
   - All three FABs are the same Material 3 FAB: the tonal container, the rounded-square shape and
     M3 elevation, with no hard shadow. Compare them side by side.
   - Scroll each list to the end. The last row or event clears the FAB (`floating-action--over-list`,
     `floating-action--over-scroll`).
   - TalkBack reads "Add personal event" / "Add an event" / "Add a calendar" as one button.
6. **VoiceOver spot check (iOS device or simulator).**
   - The calendar Today and Add bar items read their labels.
   - At AX5, a long press shows the Large Content Viewer.
   - The changelog Close hint is spoken.

## Why

Jest models the Compose semantics through the Expo UI mock, so it proves the configuration, not
what TalkBack does. The Android text-button naming (item 2) depends on Material 3 merging a child's
semantics into the button. Only a device confirms that. Android builds freeze the Mac, so the
pipeline cannot run this pass.

## How to verify

- For each item, record pass or fail with a screenshot (and the TalkBack transcript for items 1, 2
  and 5) in this file, then move it to done.
- If item 2 fails (TalkBack reads "Skip", or a double tap does nothing), file the finding here.
  The fix belongs in `src/components/chrome/header-action.tsx`, by moving the semantics modifier.
