# Stale source recovery — device checks

**Date:** 2026-08-26
**Change:** `detect-stale-calendar-sources`
**ADR:** [041](../../mobile/architecture-book/decisions/041-preserve-content-and-advise-source-recovery.md)
**For:** Samuel `(HUMAN: physical iOS and Android stale-source recovery pass)`

## Why this is inboxed

This host has no simulator or emulator. Jest proves state, copy, routing, privacy,
and accessibility props; the shared Maestro flow is delegated to labelled CI. A
physical-device pass is still required for visual and assistive-technology quality.

## Checks

Using one generic expired source and one real AMU 2025–26 source:

1. On supported iOS and Android versions, confirm the compact warning does not hide
   the last-good timetable and does not claim those events are current.
2. Confirm generic copy describes an ended export period and AMU copy describes the
   `ade-web-consult` → `agenda-web-consult` 2026–27 transition without showing a URL,
   query, or token.
3. With VoiceOver and TalkBack, verify one coherent warning announcement, descriptive
   Review/Add updated calendar controls, logical focus order, and no duplicated live
   region speech.
4. At the largest supported text size, verify banner/row copy wraps without clipping
   and controls remain reachable.
5. Measure/tap the recovery controls: at least 44pt on iOS and 48dp on Android.
6. Start recovery, cancel or fail the new import, and confirm the old calendar/events
   remain. Add a replacement successfully and confirm the old calendar remains until
   its existing delete confirmation is explicitly accepted.
7. Repeat the interaction-heavy row check on a representative low-end Android device.

Record device/OS, locale, text scale, assistive technology, source case, and result.
Any URL/token exposure or automatic old-calendar removal is a release blocker.
