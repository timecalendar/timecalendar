# 028 — Refetch on notifications and navigate only on taps

## Status

Accepted.

## Decision

Parse notification payloads with a pure function against the server's v2 contract: a
`calendar_changed` push carries `{ type, event }` with lowercase `type ∈ new | edit | cancel`;
a `calendar_digest` push routes to Calendar without reading its payload. Foreground messages
with either action trigger calendar sync without navigation. Background and cold-start taps
sync, then navigate to event details for new/edited events or Calendar for cancellations and
digests. Invalid payloads never navigate.

## Consequences

All app states reuse the existing sync and routing seams. Real delivery/tap behavior remains
a device check.

## Revisit if

The server payload contract or product navigation policy changes.
