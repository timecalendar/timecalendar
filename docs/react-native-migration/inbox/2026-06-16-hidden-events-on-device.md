# Hidden events — on-device durability + manual screen-reader pass

**Date:** 2026-06-16
**Roadmap:** Phase 05 Ship A (Hidden events)
**Change:** `add-mobile-hidden-events`
**ADR:** [023](../../../.claude/rules/mobile/decisions/023-hidden-events-storage.md)
**For:** Samuel (needs a real device / installed dev build — the autonomous loop and CI cannot do this)

This is the **on-device manual axis** for the hidden-events ship. The hidden set is
**IRREPLACEABLE** (no server backup, a Phase-09 importer target), so CI proves the write
paths hard — the four mutators, the total parser, the **write/read-back** contract, and a
**restart-simulation** through a stateful in-memory `@/storage` fake
(`src/features/hidden-events/data/restart.test.ts`), plus the seam filter, the synced-only
hide/un-hide wiring, and the observability path. CI **cannot** prove on-disk **MMKV** survival
across a real restart/kill/cache-clear, nor judge screen-reader focus order / announcement
quality. Those are this manual pass.

## 1. On-disk MMKV durability (restart / kill / cache-clear)

The Maestro flow (`.maestro/hidden-events.yaml`) only asserts the management screen renders
its **empty** state (the e2e server seed provides no synced `user_calendars` token + synced
`calendar_events`, so there is no real synced event to hide — the same seeded-data limitation
`calendar.yaml` records). The real round-trip is manual:

1. Add a calendar (QR or iCal) so synced events render, on a real device / dev build.
2. Open a synced event → **Hide** → choose **Hide this event** → confirm it disappears from
   day/week, agenda, AND the home today view.
3. Open another synced event → **Hide** → **Hide all events of the same name** → confirm every
   same-titled instance disappears.
4. **Fully kill the app** (swipe from recents, not just background) and relaunch. Confirm the
   hidden events are STILL hidden (read back from the durable MMKV key, not re-derived).
5. Repeat after an OS-level **clear cache** (Android) / a reinstall-preserving-data scenario if
   reproducible. The set must survive.
6. Open **Profile → Hidden events**: confirm the name-hidden title and the (still-resolving)
   uid-hidden event are listed; **Un-hide** each; confirm the event re-appears in the views.
7. From a synced event's details that is **currently hidden** (deep link
   `timecalendar-dev://event-details/<uid>` of a hidden uid), confirm the header offers
   **Un-hide** (never a one-way trap) and that un-hiding restores it.

## 2. Observability (Crashlytics arrival)

A failed hidden-set write records through `@/firebase` `recordError(error, "hidden-events/<action>")`.
CI proves the wiring (the hook test). Confirm a forced write failure (or just verify the seam) lands
in the Crashlytics dashboard for the dev Firebase project — the manual half CI can't assert
(mirrors `firebase.md` "What CI proves vs. what's manual").

## 3. Manual VoiceOver + TalkBack pass (DoD a11y axis)

On both iOS (VoiceOver) and Android (TalkBack):

- The event-details **Hide / Un-hide** header action announces its translated label
  ("Hide this event" / "Un-hide this event") and is a ≥44pt/48dp target.
- The native hide chooser (an OS `Alert`) reads its options ("Hide this event", "Hide all
  events of the same name", "Cancel") in a sensible order.
- The management screen's section headers ("Hidden by name", "Hidden events") expose as
  **headings** (rotor/heading navigation); each row's **Un-hide** control announces
  "Un-hide <title>" and is a ≥44pt target.
- The empty state and the write-error message announce as **polite live regions** when reached.

## 4. Native correctness (R-3, both platforms)

- The hide chooser is a **native-default** RN `Alert` (no Material dialog port) — confirm it
  looks/behaves like the platform's own action sheet / alert on each OS.
- The management screen + the details header action are themed from `@/theme` (the brand
  `primary` accent on the un-hide labels) — confirm the brand tint reads correctly in light
  and dark.

Tick each box on a real device before considering the hidden-events DoD's E2E / a11y /
native-correctness / observability axes complete.
