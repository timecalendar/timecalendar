# 031 — Filter calendar visibility at the event-source seam

## Status

Completed implementation record; this contract now lives in [calendar.md](../calendar.md).

Invisible user calendars are removed at the shared event-source seam. Their cached events
remain intact, so toggling visibility is immediate and deleting a calendar does not require
a separate cache purge for correctness.
