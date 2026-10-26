**For:** whoever runs the Android device and screen-reader passes (OpenSpec
`ds-5-3-personal-hidden-events`). The delivery pipeline runs the iOS simulator pass. Android
rendering and TalkBack need a person on a device or on the Windows host. They never run on the Mac.

# Hidden events, personal events list and form on the design system: Android device pass

## Status

Not done. The pipeline tried to run this pass on the Windows host on 2026-10-26 and could not:
`ssh pc` timed out, so the host was unreachable. The pass needs a person on an Android device, or
a retry once the Windows host is reachable.

## What I need

Run this pass on an Android development build of `feat/mobile-ds-5-3-personal-hidden-events`, in
French and English, in light and dark, at the default font scale and at 2.0. Gallery stories open
with `timecalendar-dev://developer/gallery/<id>`.

1. **Gallery.** Open `color-swatch-field--default`, `--error`, `--disabled` and `--long-strings`:
   - Swatches are 48 dp circles that wrap onto a second line. A press shows a ripple clipped to
     the circle, and the selected swatch shows a ring.
   - TalkBack reads each swatch as "<color name>, radio button, checked/not checked". It never
     reads a hex code. In `--disabled`, swatches read as disabled and do not change.
2. **Personal events list.** Settings → Personal events:
   - The empty list shows "No personal events" and the caption. An "Add event" floating action
     sits bottom right, with no "+" in the app bar.
   - With events, the last row scrolls fully clear of the floating action.
   - TalkBack reads the floating action as "Add event".
3. **Personal event form.** Add event → fill the title → choose a color → Save. Then open the
   event → Edit this event → Delete → confirm:
   - The color label matches the Title, Starts and Ends labels.
   - Save and Delete are full width and 8 dp apart, with 12 dp above Save and 16 dp below Delete.
     With the keyboard open, the region sits directly above the keyboard.
4. **Hidden events.** Hide a synced event from event details, then open Settings → Hidden events →
   Un-hide it. With nothing hidden, the empty illustration is centred vertically.

## Why

Jest proves the roles, names, sizes, flattened styles and press handling. It cannot prove what the
ripple, the Compose floating action and TalkBack do on a device. Android builds freeze the Mac, so
the pipeline cannot run this pass.

## How to verify

Record pass or fail for each item in this file, with a screenshot, and for items 1 and 2 the
TalkBack transcript. Then move the file to `done/`. Fix a swatch failure in
`mobile/src/design/field/color-swatch-field.tsx`. Fix a list failure in
`mobile/src/features/personal-events/ui/personal-events-list.tsx`.

## Blocks

Nothing. The PR merges on green CI and the iOS pass. This pass closes the Android device check for
roadmap slice 5.3.
