# Event details — deferred sibling features (checklist + hide-event) — BOTH NOW LANDED

**Change:** `add-mobile-event-details` (Phase-04 item 3). **Date:** 2026-06-16.
**Status:** ✅ **BOTH DEFERRALS DISCHARGED** (Phase 05 Ships A + B). Originally roadmap tracking
for the view-half-only ship (design D1); both interactive surfaces have since shipped. Kept as the
record of how the read-only view half grew into the full event-details surface.

The Flutter `event_details` module carried two interactive surfaces deliberately **left out** of the
read-only details ship because each is a **state-writing feature** with its own persistence — not part
of "view the event's fields". Both have now landed as their own ships.

## 1. Checklist — ✅ LANDED (Phase 05 Ship B / `add-mobile-event-checklists` / ADR 024)

Flutter: `event_details/widgets/event_details_checklist*.dart` + `providers/checklist_item_provider` +
a `checklist_item` repository/store. An **interactive add/toggle/edit/reorder/delete** list of checklist
items per event, **persisted** — the **4th Drizzle table `checklist_items`** mirroring the Flutter
`toMap()` verbatim (importer fidelity, ADRs 011/018/021 posture; **hard-delete-not-soft** finding +
soft-ref `eventUid`). It is surfaced on the **unified** event-details screen for **both** event kinds.
See [calendar.md](../../../.claude/rules/mobile/calendar.md) "Event details (unified…)",
[storage.md](../../../.claude/rules/mobile/storage.md) "Checklist items store", and the on-device note
`2026-06-16-event-checklists-on-device.md`.

## 2. Hide event / hidden-events — ✅ LANDED (Phase 05 Ship A / `add-mobile-hidden-events` / ADR 023)

Flutter: the details header's "Masquer" / Hide, backed by hidden-event state that **filters the
calendar**. A state-writing feature (its own MMKV store + a filter on the events-source seam) with the
hide action on the event-details header + a management screen. See
[calendar.md](../../../.claude/rules/mobile/calendar.md) "Hidden events" and the on-device note
`2026-06-16-hidden-events-on-device.md`.

## 3. Cancelled-event visual treatment — not yet rendered on any surface

The `canceled` flag is decoded into the domain (`CalendarEvent.canceled` and the rich
`EventDetails.canceled`, both derived defensively from `fields.canceled`) and is part of the verbatim
sync model — but **no surface renders it yet**: the grid/agenda tiles, the home today view, and the
read-only details screen show no cancelled treatment (no strikethrough / badge / label). Flutter
visually marks cancelled classes. This is a **future-feature gap, not drift** — the data-model field is
deliberately complete (the sync model mirrors the Flutter wire format), and the actual cancelled
treatment is an R-3 platform visual decision (badge vs. strikethrough vs. dimming) better made as a
small dedicated UI ship across the surfaces, not bolted onto the read-only details view. Recorded here
so the unrendered-but-tested field is tracked, not silent. **Trigger:** the first ship that designs the
cancelled treatment (likely alongside the hide-event filter above, since both touch how cancelled/hidden
events appear in the timeline).

## Why deferred (not skipped)

Including either would blow this ship's read-only scope and pull in a write surface (a new table, a new
store, a filter). The view half (title / tags / content lines / footer + the tap target) is a clean,
self-contained read; the two write features are clean, self-contained follow-ups.
