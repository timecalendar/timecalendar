# Phase 04 — Calendar core

> **Goal:** the heart of the app — the timeline. Day/week/agenda views, calendar sync, offline cache, event details (read), home screen. This is the largest, highest-risk phase.
>
> **Depends on:** Phase 03 (needs real calendars to render). **Modules:** `calendar`, `event_details` (view), `home`, `activity` (sync logs, partial).

## Rough steps

1. **Calendar spike (first task, time-boxed 3 days — [K-5](../00-exploration/migration-approach.md#8-resolved-knobs-phase-0-kickoff-decisions)).** Read-only render of a real dense university week on `@howljs/calendar-kit` v2, our styling, overlaps, 120fps target. **Decision gate: adopt / fork / build custom.** Likely custom.
2. **Timeline rendering** (per spike outcome): day / week / agenda. Custom path = FlashList v2 (vertical time + horizontal day/week paging) + gesture-handler (swipe between days) + Reanimated 4 worklets.
3. **Sync** — TanStack Query → `syncCalendars(tokens)` → local cache (the drop+replace flow, RN-side). Offline reads from persister/SQLite.
4. **Event details (view)** — read-only event screen.
5. **Home** — landing/today view.
6. **Date/time** — `date-fns` + `date-fns-tz`, display only (recurrence is server-side; no rrule/Temporal).

## Exit criteria

- Day/week/agenda render real timetables, with overlaps, at target frame rate on a **low-end Android** device.
- Works offline (renders from local cache with no network).
- Calendar surfaces pass full DoD; Reassure perf baselines captured.

## Risks & decisions

- **#1 risk in the whole migration.** A dense day with many overlapping events at 120fps is genuinely hard.
- The spike outcome can **reshape the roadmap** — if custom, budget accordingly; salvage primitives (time-grid math, overlap layout, now-indicator) into our own reusable components regardless of adopt/fork/custom.
- Calendar is a **designed brand surface**, not native-default chrome.
</content>
