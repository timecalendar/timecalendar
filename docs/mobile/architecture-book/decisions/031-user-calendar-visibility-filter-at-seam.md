# 031 — Calendar visibility is a render-filter at the single events-source seam; delete needs no `calendar_events` purge

> Origin: the `add-mobile-user-calendars` change (Phase 07 — the "Mes calendriers"
> management screen), design Decision 1. Records the load-bearing contract for what
> the durable `user_calendars.visible` flag (ADR [018](./018-user-calendar-storage.md))
> *means* system-wide, and why deleting a calendar requires no cross-feature
> `calendar_events` cleanup. Builds on ADR [023](./023-hidden-events-storage.md)
> (the events-source seam was designed to absorb exactly this kind of filter) and
> ADR [021](./021-calendar-event-storage-and-sync.md) (the drop+replace sync that
> reclaims orphaned rows).

## Status

Accepted.

## Context

Phase 03 shipped the durable `user_calendars` token store (ADR 018) with a
`visible` column (default `true`) and a tested `setVisible(id, visible)` — but no
UI and no runtime effect: nothing read `visible`. The user-calendars management
screen ("Mes calendriers") now exposes a per-calendar visibility checkbox and a
delete, so `visible` must finally *do something*, and delete must not leave a
calendar's synced events rendering.

Two questions had to be answered together: **(1) what does `visible` mean** — a
sync gate, a notification gate, or a pure render flag? and **(2) on delete, who
cleans up the `calendar_events` rows** that belong to the removed calendar? The
Flutter parity (`user_calendar_provider.dart`) is render-only: `toggleVisibility`
and `deleteCalendar` mutate the store and refresh, with no re-sync and no event
purge.

## Decision

**`visible` means exactly one thing: whether a calendar's events render in the
timeline.** It is enforced in exactly one place — `useCalendarEvents(range)` in
`calendar/data/events.ts`, the single seam both Home and Calendar (day/week/
agenda) read. That `useMemo` already filters hidden events; the visibility filter
is one more clause of the identical shape, reading `useUserCalendars()` (the same
legitimate `data → data` cross-feature edge the hidden-events filter uses):

```
const visibleIds = new Set(calendars.filter((c) => c.visible).map((c) => c.id))
// keep iff personal (always) OR its calendar is currently visible
event.userCalendarId === undefined || visibleIds.has(event.userCalendarId)
```

applied on the merged synced+personal list, before the range filter, behind the
unchanged seam signature + `CalendarEvent` shape — so every consumer honors
visibility with no change.

**Delete needs no `calendar_events` purge.** A deleted calendar drops out of
`useUserCalendars()`, so its id leaves the visible set and its events vanish
immediately by the same render-filter. Delete stays a single-seam write
(`repository.remove(id)`); the orphaned `calendar_events` rows are invisible and
are reclaimed by the next drop+replace sync (ADR 021, which fetches only the
still-held tokens).

**Rejected:** a synchronous `calendar_events` purge on delete (makes delete a
two-seam cross-feature write, duplicates the source of truth, and a partial write
could leave orphans *visible*); a sync gate that doesn't fetch a hidden calendar
(slow toggles, incomplete token set, contradicts Flutter's render-only `visible`);
a separate `visibleCalendarIds` store (a second, drift-prone source of truth when
`visible` already lives on the row).

## Consequences

- **`user_calendars` is the single source of truth for "what shows."** A missing
  row = nothing shows, regardless of stale `calendar_events`. Visibility is *not*
  a sync gate (sync still fetches all held tokens) and *not* a notification gate
  (the subscription `calendarIds` still reflects the held rows) — a client-side
  render flag only, matching Flutter.
- **Orphaned `calendar_events` rows persist between a delete and the next sync.**
  They are invisible and reclaimed by the next drop+replace sync; the screen may
  optionally kick a background `sync()` after delete to shorten the window
  (a nicety, not a correctness requirement). Only transient disk use is affected.
- **Delete is non-undoable** (`remove()` has no inverse) — the screen confirm-gates
  it via a native `Alert` and shows no undo affordance (an undo would lie).
- **The filter branch lands on the 90% CI gate** (`events.test.ts`): hidden calendar
  excluded, visible kept, personal always kept, toggle-back re-includes, an event
  whose calendar left the set (a deleted calendar) drops out.

## Revisit if

The product wants `visible` to also gate sync or notifications (then it stops being
a pure render flag — re-weigh here); a second consumer needs "the visible calendar
set" outside the events seam (extract a selector, don't duplicate the filter);
orphaned `calendar_events` disk use becomes material before the next sync (make the
post-delete `sync()` mandatory or add a targeted purge); or a future rename/re-
tokenize surface needs to mutate a calendar's identity (own ship + its own write
posture).
