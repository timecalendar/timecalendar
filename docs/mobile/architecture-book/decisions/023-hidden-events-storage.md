# 023 — Store hidden-event identities in MMKV

## Status

Accepted.

## Context

Hiding a synced event is small local preference state, not a mutation of the server event.

## Decision

Store one validated `{ uidHiddenEvents, namedHiddenEvents }` value through `@/storage`.
Apply it at the shared event-source seam rather than deleting cached rows.

## Consequences

All calendar surfaces agree on visibility and a later sync cannot accidentally unhide an event.

## Revisit if

Hidden state becomes server-synced or needs relational queries.
