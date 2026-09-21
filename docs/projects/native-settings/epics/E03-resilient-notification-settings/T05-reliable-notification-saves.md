---
kind: ticket
id: T05
epic: E03
status: planned
traces-to: [P03, P04, D03, D04, D05]
depends-on: []
size: L
confidence: medium
---

# T05 — Reliable notification saves across navigation and restart

## Outcome

Pending notification choices survive navigation, failures, and restart. The existing screen
shows shared status and retry, and earlier acknowledgments cannot clear newer intent.

## Scope

Implement and mount one notification-feature sync runtime at the app lifecycle boundary.
Use durable dirty/generation bookkeeping through existing storage, injectable transport and
current-snapshot inputs, and shared pending/waiting/error/acknowledged state. Preferences
remain canonical; persist no tokens or payload queue. Mark dirty before preference mutation;
startup replay covers crash interleavings. Serialize client requests and coalesce to latest.

Route preference edits, registration, token rotation, locale, effective zone, and calendar
changes through this owner. Replace duplicate token listeners and independent mutations.
Build the existing DTO only when ready: missing tokens and unloaded calendars wait; loaded
empty calendars are valid. Integrate status/retry into the existing notification screen.
Recover through bounded active retries, startup, foreground, and manual retry. Integrate
backend reset in the same ticket so the runtime is safe from its first use.

## Non-goals

Permission prompts/status/refusal handling, native screen redesign, a generic job queue,
connectivity framework, server scheduling, or API revisions. Preserve existing permission
request timing and behavior.

## Definition of done
- One mounted runtime owns all subscription PUT triggers and current snapshots. Screen hooks
  own no independent request lifecycle; token/input changes invalidate older acknowledgments.
- Only acknowledgment for the current generation and runtime identity clears durable intent.
  Missing prerequisites wait; failures retain intent and bounded retries stop without spinning.
- Pending/error status survives route dismissal and is restored from durable intent after
  restart. Local preferences update immediately; the existing screen exposes shared Retry.
- Environment reset cancels timers/requests, clears backend-bound bookkeeping, and invalidates
  old completions. New work cannot be acknowledged by an old-environment request.
- Persist no tokens/calendar payloads. Status distinguishes remote acknowledgment from local
  intent, permission, and actual delivery. Document ownership/recovery in the relevant specs.

## Acceptance and verification

Use controlled promises for A→B edits, earlier success/failure, retry of latest state, and
reset during a request. Recreate storage/runtime to test dirty restart and a crash between
marking dirty and changing preferences. Exercise exhausted retry timers and disposal.

Integration tests cover route unmount/remount, missing/rotating tokens, unloaded versus loaded
empty calendars, foreground recovery, and manual retry. Prove a single request source and
that old-environment completions cannot clear new intent or schedule retries. Run edited
tests and the [mobile gates](../../roadmap.md#verification-convention).

## Likely work sites and reading

New runtime/state files under `mobile/src/features/notifications/data/`; existing prefs,
hooks, registration, subscription transport, types, and exports in that directory;
`mobile/src/app/_layout.tsx`, `mobile/src/features/notifications/ui/`,
`mobile/src/features/environment/data/participants.ts`, environment switch/orchestration,
and `mobile/src/storage/index.ts`. Read API transport cancellation and
[D03](../../decisions/D03-notification-sync.md). Document the shared runtime contract.

## Size and confidence drivers

L: one feature-owned synchronization path including its lifecycle and reset integration.
The existing screen demonstrates the complete result. Medium confidence: crash sequencing,
loaded state, token rotation, and environment races need controlled tests. There is no new
queue framework, background service, or backend protocol.

## QA and sensitive surfaces

Keep diagnostics free of tokens, calendar identifiers, and payloads. Retry does not guarantee
delivery or strict server ordering after ambiguous timeouts. The existing permission
limitations remain deferred. Verify local-versus-remote save status is understandable.
