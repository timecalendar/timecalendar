# Phase 04 — Calendar core

> **Goal:** the heart of the app — the timeline. Day/week/agenda views, calendar sync, offline cache, event details (read), home screen. This is the largest, highest-risk phase.
>
> **Depends on:** Phase 03 (needs real calendars to render). **Modules:** `calendar`, `event_details` (view), `home`, `activity` (sync logs, partial).

## Rough steps

1. ~~**Calendar spike (first task, time-boxed 3 days — [K-5](../00-exploration/migration-approach.md#8-resolved-knobs-phase-0-kickoff-decisions)).** Read-only render of a real dense university week on `@howljs/calendar-kit` v2, our styling, overlaps, 120fps target. **Decision gate: adopt / fork / build custom.** Likely custom.~~ ✅ **Done (2026-06-16).** Spike run on the real stack; **gate decided: ADOPT `@howljs/calendar-kit` v2** for the day/week timeline behind a seam + **salvage** the overlap/time-grid primitives (build agenda + home on them) — **ADR [019](../../../.claude/rules/mobile/decisions/019-calendar-rendering-adopt-calendar-kit.md)** (the "likely custom" prior was *disproven by evidence* — the library booted with no Reanimated-4 crash and rendered a dense week + correct overlaps on SDK 56 / RN 0.85.3 / Reanimated 4.3.1 / New Arch). Low-end-Android frame-rate verification inboxed (`inbox/2026-06-16-calendar-low-end-android-perf.md`).
2. **Timeline rendering** (per spike outcome): day / week / agenda. Custom path = FlashList v2 (vertical time + horizontal day/week paging) + gesture-handler (swipe between days) + Reanimated 4 worklets.
3. **Sync** — TanStack Query → `syncCalendars(tokens)` → local cache (the drop+replace flow, RN-side). Offline reads from persister/SQLite.
4. **Event details (view)** — read-only event screen.
5. ~~**Home** — landing/today view.~~ ✅ **Done (2026-06-16).** The Home tab is the today / next-up view (`add-mobile-home`, **ADR [022](../../../.claude/rules/mobile/decisions/022-home-ia-today-view.md)**): a header + a horizontal upcoming scroller + a today mini-timeline — the salvaged overlap engine's **first rendering consumer** (ADR 019's salvage payoff). Composition of the landed `useCalendarEvents` / `useSyncCalendars` / origin-keyed-routing seams + three pure 90%-gated selectors (`displayedDay`/`eventsForDay`/`dynamicHourRange`). The standalone personal-events list relocated to a Profile-reached `/personal-events` route (create/edit/delete preserved). Populated dense render + frame rate fold into the calendar on-device visual pass.
6. ~~**Date/time** — `date-fns` + `date-fns-tz`, display only (recurrence is server-side; no rrule/Temporal).~~ ✅ **Done (2026-06-16).** The `date-fns` display-only formatter seam (`calendar/data/format.ts`, locale-aware over a `LOCALES` map; `date-fns` + `date-fns-tz` pure-JS) covers calendar/agenda/details/home — `formatFullDay` (the home today header, item 5) was the last addition. **Item closed.** Relative-time ("in 30 min") + ICU MessageFormat remain the i18n rules' earned-when-needed debt.

## Exit criteria

- Day/week/agenda render real timetables, with overlaps, at target frame rate on a **low-end Android** device.
- Works offline (renders from local cache with no network).
- Calendar surfaces pass full DoD; Reassure perf baselines captured.

## Risks & decisions

- **#1 risk in the whole migration.** A dense day with many overlapping events at 120fps is genuinely hard.
- The spike outcome can **reshape the roadmap** — if custom, budget accordingly; salvage primitives (time-grid math, overlap layout, now-indicator) into our own reusable components regardless of adopt/fork/custom.
- Calendar is a **designed brand surface**, not native-default chrome.
</content>
