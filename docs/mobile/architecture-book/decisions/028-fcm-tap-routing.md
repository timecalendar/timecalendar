# 028 — Refetch on notifications and navigate only on taps

## Status

Accepted.

## Decision

Parse notification payloads with a pure function. Foreground messages trigger calendar
sync without navigation. Background and cold-start taps sync, then navigate to event details
for new/edited events or Calendar for cancellations. Invalid payloads never navigate.

## Consequences

All app states reuse the existing sync and routing seams. Real delivery/tap behavior remains
a device check.

## Revisit if

The server payload contract or product navigation policy changes.
