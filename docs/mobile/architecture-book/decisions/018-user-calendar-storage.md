# 018 — Store user-calendar identities in SQLite

## Status

Accepted.

## Context

Imported calendar tokens are irreplaceable user data, relational, and migration targets.
MMKV is a poor fit for rows that need durable schema evolution.

## Decision

Persist `user_calendars` with Drizzle/SQLite. Keep the server row ID distinct from the
source token, store dates as ISO-8601 UTC text, and preserve the source representation in
repository mappers.

## Consequences

Import and visibility flows share one durable source of truth. Changes require migrations.
Calendar-event cache can be rebuilt from these tokens.

## Revisit if

The server identity model changes or calendar identities no longer need relational queries.
