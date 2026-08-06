# 011 — Persist personal events in SQLite

## Status

Accepted.

## Decision

Store personal-event timestamps as ISO-8601 UTC text, colors as `#RRGGBB` text, and IDs
generated with `expo-crypto`. Repository mappers alone translate between rows and domain
values; forms and UI use `Date` and validated color values.

## Consequences

The schema is portable and migration-friendly. Invalid persisted rows are handled at the
mapper boundary, and schema changes require migrations.

## Revisit if

Cross-device sync imposes a different identifier or timestamp contract.
