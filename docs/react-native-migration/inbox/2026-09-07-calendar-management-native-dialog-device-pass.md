# Calendar management native dialog device pass

**For:** whoever runs the device passes (HUMAN: physical iOS and Android rendering, keyboards, and
assistive technologies are unavailable in the implementation environment)

## What I need

On current supported iPhone/iPad and Android phone/tablet builds, open User calendars and verify:

- Rename shows the `pencil` SF Symbol on iOS and the outlined file-rename Material Symbol on Android.
- The rename dialog keeps its field and Cancel/Save actions reachable with the keyboard open, before
  and after rotation and at compact width.
- Default and large Dynamic Type, light/dark appearance, VoiceOver/TalkBack focus isolation, and
  inline error/success announcements remain usable.
- Outside taps do not dismiss; Android hardware Back cancels; a failed save retains the full draft.
- At initial offset the caption has the standard top rhythm, and after scrolling rows clip directly
  below the native header without an empty band.

## Why

Jest proves platform primitive selection, controlled-buffer and dismissal callbacks, stable
identifiers, and layout ownership, but it cannot render either native toolkit or a real input method
and accessibility tree on this host.

## How to verify

Exercise the checklist above on both platforms, including a 101-character validation error and a
failed-save retry, and record the OS/device versions plus any rendering or focus difference.

## Blocks

Nothing — informational, non-blocking device evidence for PR #388.
