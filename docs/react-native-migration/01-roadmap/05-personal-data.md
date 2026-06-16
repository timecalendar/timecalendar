# Phase 05 — Personal data & event interactions

> **✅ COMPLETE (2026-06-16)** — all steps shipped; exit criteria met (CI-green half),
> on-device DoD axes inboxed. Two ships landed serially: **Ship A — Hidden events**
> (PR #181, `6484316`) and **Ship B — Event checklists** (PR #183, `150f179`).

> **Goal:** the user-owned, device-local data layer on top of the calendar — personal events shown *on* the timeline, hidden events, and event checklists.
>
> **Depends on:** Phase 04 (timeline to overlay onto) + Phase 02 (personal-events CRUD already built). **Modules:** `personal_event` (complete), `hidden_event`, `event_details` (checklists).

## Rough steps

1. ✅ **Personal events on the calendar** — overlay the Phase 02 CRUD data onto the day/week/agenda timeline. **Landed in Phase 04** (the `useCalendarEvents` seam merges `usePersonalEvents()` into day/week/agenda + home with origin-keyed tap routing) — a verify-only checkpoint this phase, confirmed, not re-shipped.
2. ✅ **Hidden events** — hide/un-hide synced events by **uid AND by name** (Flutter parity); persisted as a verbatim `{ uidHiddenEvents, namedHiddenEvents }` MMKV blob (**ADR 023**, importer-ready); filtered out at the single `useCalendarEvents` seam (day/week/agenda + home, no consumer change); hide action on the event-details screen + a reachable hidden-events management screen. *(Ship A — PR #181.)*
3. ✅ **Event checklists** — interactive per-event checklist items (add/toggle/edit/reorder/delete + auto-focus-new) in a **unified** event-details screen serving both personal and synced events; 4th Drizzle table `checklist_items` mirroring the Flutter `toMap()` verbatim, hard-delete parity (**ADR 024**; supersedes-in-part **ADR 022** routing). *(Ship B — PR #183.)*
4. ✅ **All three schemas confirmed Phase 09 migration targets** — `personal_events` (**ADR 011**), `hidden_events` (**ADR 023**), `checklist_items` (**ADR 024**) each mirror the Flutter wire format verbatim and are proven importer-ready (write/read-back + restart-simulation tests; verbatim-wire-format property recorded in each ADR).

## Exit criteria

- ✅ Personal events render correctly alongside synced events (the merged events-source seam; Phase-04, re-confirmed).
- ✅ Hide/un-hide works and persists; checklists persist per event (CI: write/read-back + restart-simulation against stateful `@/storage`/`@/db` fakes; real on-disk survival across kill/cache-clear is the inboxed on-device pass per ship).
- ✅ All pass full DoD (CI-green half: tsc/lint/jest + coverage on both ships); schemas confirmed migration-ready. **On-device axes** (real-device durability, reorder atomicity, both-platform visual + VoiceOver/TalkBack) are inboxed (`2026-06-16-hidden-events-on-device.md`, `2026-06-16-event-checklists-on-device.md`) — human/device-only, never loop blockers.

## Risks & decisions

- This is the **irreplaceable data** (no server backup) — write paths must be correct and tested. Loss here is permanent.
</content>
