# Event details — deferred sibling features (checklist + hide-event)

**Change:** `add-mobile-event-details` (Phase-04 item 3). **Date:** 2026-06-16.
**Status:** roadmap tracking — NOT a blocker. This ship is the **view half only** (design D1).

The Flutter `event_details` module carries two interactive surfaces deliberately **left out** of this
read-only details ship because each is a **state-writing feature** with its own persistence — not part
of "view the event's fields". Recorded here so the roadmap tracks them as their own future ships.

## 1. Checklist — its own ship

Flutter: `event_details/widgets/event_details_checklist*.dart` + `providers/checklist_item_provider` +
a `checklist_item` repository/store. An **interactive add/toggle** list of checklist items per event,
**persisted** — i.e. a fourth Drizzle table with its own importer-fidelity question (mirroring
`personal_events` / `user_calendars` / `calendar_events`, ADRs 011/018/021). It is an edit feature with
a write path, not a read. Defer as its own feature/ship.

## 2. Hide event / hidden-events — its own ship

Flutter: the details header overflow menu's "Masquer" / Hide, backed by hidden-event state that
**filters the calendar**. A state-writing feature (its own store/table + a filter applied to the
events-source seam). The read-only details screen this ship lands has **no header overflow menu** at
all. Defer the hidden-events feature as its own ship.

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
