# 021 — Cache synced calendar events in SQLite

## Status

Accepted.

## Context

Calendar screens need offline reads and a stable local snapshot. Synced events are
rebuildable from durable user-calendar tokens.

## Decision

Store server events in `calendar_events`, preserving server fields and encoding structured
values as defensively decoded JSON text. Replace the snapshot in one synchronous SQLite
transaction. Merge it with personal events at the event-source seam.

## Consequences

Failed fetches retain the last good snapshot. Transaction failures are recorded as unexpected.
The table is cache, not an import target. Live-query reads are coalesced whole-table reads.

## Revisit if

Measured volume requires range-scoped SQL, incremental sync, or conflict resolution.
