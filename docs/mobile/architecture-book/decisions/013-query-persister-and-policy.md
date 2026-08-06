# 013 — Persist TanStack Query through MMKV

## Status

Accepted.

## Decision

Use a synchronous TanStack Query persister over `@/storage`. Query defaults keep `gcTime`
at least as long as persisted `maxAge`, use bounded retries, and let each query select an
appropriate `staleTime`. Feature code uses query wrappers in its `data/` layer.

## Consequences

Server reads can restore offline without exposing MMKV to features. Cached DTOs remain
rebuildable data and are not a source of durable user identity.

## Revisit if

Cache size, encryption, multi-user isolation, or background invalidation demands another store.
