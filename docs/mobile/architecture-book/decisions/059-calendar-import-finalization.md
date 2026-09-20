# 059 — Finalize calendar import above onboarding with serialized sync

## Status

Accepted.

## Context

Calendar creation durably stored identity but left event hydration to a later sync. Nested
`dismissAll()` could remove only the onboarding navigator, and overlapping startup/import syncs
could let an older token snapshot replace newer events. Retrying the whole create chain is unsafe
because server creation has no idempotency key.

## Decision

QR and iCal retain create, token-resolution, and durable-upsert checkpoints in memory for one
mounted attempt. Durable completion uses root-targeted `dismissTo` to replace onboarding with a
parameter-free result above the existing tabs anchor. That result alone requests a coordinated
`freshAfterCurrent` sync and shows success only after `calendar_events` commits. Ordinary syncs
join the active module-level pass; at most one fresh follow-up rereads tokens and runs after it.
Leaving the result uses `dismissTo("/calendar")` to reuse the tabs entry.

## Consequences

Retry never recreates a calendar once its token is known, stale sync responses cannot win after
import, and native Back from the result cannot re-enter onboarding. Unfinished checkpoints do not
survive abandonment or process death. A lost create response can still leave an unknown server
calendar; solving that requires a future server idempotency contract.

## Revisit if

The server adds idempotent calendar creation, import checkpoints must survive process death, or
Expo Router changes absolute `dismissTo` targeting semantics.
