---
kind: decision
id: D03
status: approved
traces-to: [P03, P04]
supersedes: []
---

# D03 — One durable owner for subscription preference synchronization

## Context and evidence

Notification hooks own separate generated mutation instances. Screens, startup, and token
callbacks can issue overlapping full-state PUTs; local preferences persist independently.
An unmounted picker can lose its request/error surface. Environment reset currently has a
no-op notification-runtime participant because there is no separate shared runtime to clear.

## Options considered

- Per-screen mutations and Retry: smallest, but failure state disappears across routes.
- In-memory shared mutation alone: fixes route ownership, loses unsent intent on process death.
- Durable latest-state synchronization with serialized requests: recommended.
- General job queue or new server revision protocol: stronger/broader infrastructure than
  this settings project currently needs; revisit only if evidence requires that guarantee.

## Decision

Keep local preferences and the existing full-state PUT contract. A notification-feature
runtime owns durable dirty/generation bookkeeping, latest-snapshot coalescing, one active
client request, shared status, bounded retries, and startup/foreground/manual recovery.
Only an acknowledgment of the current generation can clear pending intent. Null tokens wait
for registration; unloaded calendars wait for loading. Loaded empty calendars still sync.
Token, locale, effective zone, and calendar inputs use this owner, not extra screen mutations.
Backend environment reset invalidates the runtime, timers, requests, and bound metadata.

## Tradeoffs and consequences

This adds small feature-owned synchronization state, not a reusable queue framework. Users
can leave a picker immediately, but remote preferences take effect only after server sync.
Retry sends current intent; it does not replay obsolete intermediate selections. An aborted
or timed-out request can still complete server-side, so the contract is eventual repair on
latest-state replay, not strict ordering after ambiguous network failures. Tokens/payloads
must not enter logs or a new persistent request queue. Tests need controlled request races,
restart, unavailable tokens, delayed calendars, and environment reset.

## Approval

Project owner, Codex conversation, 2026-09-21: “Approve these choices and continue to
roadmap/tickets.” The quoted response directly answers the scoped product and D02–D04
review question, including the package combination, durable synchronization mechanism and
ambiguous-timeout tradeoff, full permission deferral, and bounded language refresh.
