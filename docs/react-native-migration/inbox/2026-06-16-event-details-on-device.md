# Event details — on-device populated render (manual DoD pass)

**Change:** `add-mobile-event-details` (Phase-04 item 3). **Date:** 2026-06-16.
**Status:** HUMAN — skip-and-continue (CI cannot render real synced data).

## What I need verified

The read-only event details screen on a **real device with a real synced calendar** (iOS + Android).
CI proves the wiring deterministically (Jest), but it cannot render a real synced event — the dev
harness / CI seed has **no `user_calendars` token + synced `calendar_events` reachable by deep link**
(the same SEEDED-DATA limitation `mobile/.maestro/calendar.yaml` already records). So the populated
render is irreducibly an on-device check.

## Why

DoD **native-correctness** (R-3 — the platform is the design reference) and **performance** /
**accessibility (manual VoiceOver + TalkBack)** axes for a designed brand surface. A rendered surface
on real data cannot be asserted by a static tool.

## How to verify

On a device signed in with a real synced calendar (or after a real `POST /calendars/sync`):

1. Open the calendar (day/week grid and the agenda). **Tap an event in each view.**
2. The read-only details screen opens and shows:
   - Title block: the **color swatch** (the event color), the **title** (heading), the **full
     date/time** range (locale-correct, 24-hour).
   - **Tag bubbles** (name on the tag's own color) when the event has tags.
   - **Content lines** that are present: location, the **calendar name** (only when 2+ calendars),
     teachers (newline-joined), description.
   - The **"Updated …"** footer (the `exportedAt` full date/time).
3. The **back** affordance returns to the calendar.
4. **VoiceOver + TalkBack:** the title is announced as a heading, the color swatch has a spoken label
   (not a silent node), each content line's text is conveyed (icons decorative), tags expose their names.
5. A **stale deep link** (`timecalendar-dev://event-details/<a-uid-not-in-the-table>`) shows the
   **not-found** message, not a crash or blank screen.
6. Tapping a **personal event** opens its existing **edit form** (not this read-only screen).

May be folded into the existing `inbox/2026-06-16-calendar-sync-on-device.md` note instead of a separate
pass — record which was done.
