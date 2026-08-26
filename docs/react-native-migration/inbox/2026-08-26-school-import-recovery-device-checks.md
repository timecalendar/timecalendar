# School import recovery device checks

(HUMAN: iOS/Android device verification)

## What I need

Verify the iCal recovery panel on representative iOS and Android devices:

- VoiceOver and TalkBack announce the recovery title once, then the instruction and actions
  in a useful order.
- Large text keeps the URL field, recovery copy, correction/Retry, and Report reachable.
- Change the URL returns focus to the editable URL field.
- Dark and light themes retain readable contrast and 44pt iOS / 48dp Android targets.
- Retry appears for Saint-Étienne, Bordeaux INP, Toulouse 3, and generic provider outages,
  but not for unsupported/invalid links.
- FR and EN copy is complete for Rennes, Tours, Réunion, Montpellier, UBE, Lyon 2,
  Saint-Étienne, Bordeaux INP, and Toulouse 3.
- Report opens Feedback without the attempted URL, school identity, credentials, calendar
  token, or timetable resource identifier.

## Why

Jest and labeled CI prove deterministic behavior and both native builds, but this no-KVM
host cannot exercise real assistive technology, Dynamic Type, focus, or visual rendering.

## How to verify

Run the development variant in both languages and force one unsupported and one outage
response on each platform. Record device/OS, language, theme, text size, and result in the
PR QA evidence.

## Blocks

Nothing — this is a non-blocking manual Definition-of-Done follow-up.
