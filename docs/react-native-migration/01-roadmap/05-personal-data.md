# Phase 05 — Personal data & event interactions

> **Goal:** the user-owned, device-local data layer on top of the calendar — personal events shown *on* the timeline, hidden events, and event checklists.
>
> **Depends on:** Phase 04 (timeline to overlay onto) + Phase 02 (personal-events CRUD already built). **Modules:** `personal_event` (complete), `hidden_event`, `event_details` (checklists).

## Rough steps

1. **Personal events on the calendar** — overlay the Phase 02 CRUD data onto the day/week/agenda timeline (the seam left open in Phase 02).
2. **Hidden events** — hide/un-hide synced events; persist the hidden set (MMKV or Drizzle). Filter them out of the timeline.
3. **Event checklists** — per-event checklist items (Drizzle table), in the event details screen.
4. **Confirm all three schemas are Phase 09 migration targets** — `personal_events`, `checklist_items`, `hidden_events` are the irreplaceable set; their RN schemas must be able to receive the recovered records.

## Exit criteria

- Personal events render correctly alongside synced events.
- Hide/un-hide works and persists; checklists persist per event.
- All pass full DoD on both platforms; schemas confirmed migration-ready.

## Risks & decisions

- This is the **irreplaceable data** (no server backup) — write paths must be correct and tested. Loss here is permanent.
</content>
