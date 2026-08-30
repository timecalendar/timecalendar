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

### Amendment (TIM-399, ADR [049](./049-activity-trigger-edges-and-failure-isolation.md))

Notification receipt now fans out to **two independent cross-feature seams**, not one: the
calendar sync above, and a forced Activity refresh beside it. The Activity call is deliberately
**not chained onto the sync's promise** — the push guarantee has to survive a sync that fails —
and it is gated on the message **action**, not on the parse result, so a `calendar_changed` with
an undecodable `payload` still refreshes Activity while (as below) correctly declining to
navigate. **The routing decision itself is unchanged**: `routeTap`'s sync stays unconditional and
no navigation branch moved.

## Consequences

All app states reuse the existing sync and routing seams. Real delivery/tap behavior remains
a device check.

## Revisit if

The server payload contract or product navigation policy changes.
