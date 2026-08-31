# (HUMAN: Event-summary checklist-progress physical-device pass)

## What I need

Run the checklist summary surfaces on supported physical iOS and Android devices and record the
results here, then remove or move this note to `done/`.

## Why

This host has no emulator or simulator. Jest proves query ownership, reactive counts, layout
branches, accessibility-label composition, theme-token selection, minimum geometry, and renderer
identity, but it cannot judge native screen-reader speech, real font metrics, or dense-week frame
smoothness.

## How to verify

- In light and dark schemes, confirm partial and checked-complete indicators remain legible on Home
  cards/reflow rows, Calendar timed/all-day tiles, and Agenda rows.
- At the largest Dynamic Type setting, confirm Home reflows without clipping the count.
- With VoiceOver and TalkBack, confirm each summary announces one phrase such as “2 of 3 checklist
  items completed”; the decorative indicator must not create a second focus stop.
- On a representative low-end Android device, scan a dense overlapping week and the smallest event
  tiles; confirm scrolling stays smooth and the compact glyph/count remains bounded.
- Keep a summary mounted, edit add/check/uncheck/reorder/delete state in details, return through the
  stack, and confirm progress is current without reopening the summary screen.

## Blocks

Nothing — informational device-only Definition-of-Done follow-up; it does not block PR #335.
