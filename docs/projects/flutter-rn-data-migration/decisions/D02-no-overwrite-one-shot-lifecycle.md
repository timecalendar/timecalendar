---
kind: decision
id: D02
status: approved
traces-to: [P02]
supersedes: []
---

# D02 — No-overwrite one-shot lifecycle

## Context and evidence

SQLite and MMKV cannot share one transaction, startup can be killed at any boundary, and some
targets may already contain newer React Native state. A completion bit alone cannot distinguish a
retryable interruption from a handled terminal failure.

## Options considered

- Let legacy or React Native state win, or block on divergence.
- Retry every failure, expose recovery/skip UI, or use explicit retryable and terminal states.
- Apply a user-facing timeout or hold the splash until bounded technical work settles.

## Proposed choice

React Native wins divergence and cross-calendar token collisions; identical values are already
applied. Use `NOT_STARTED → IN_PROGRESS → SETTLED_SUCCESS|SETTLED_PARTIAL|SETTLED_FAILED`. Only a
terminal result prevents another attempt. Keep migration invisible, retain the splash during the
attempt, apply no product latency target, and continue normally after a handled terminal outcome.

## Tradeoffs and consequences

The policy never silently destroys newer state and remains idempotent across stores. A handled
failure may leave valid legacy data behind permanently, which is accepted in exchange for quiet
startup and must be visible through private reporting. Technical resource bounds remain mandatory.

## Approval

Approved by the TimeCalendar board owner in the human-only TIM-436 decision round answered
2026-09-07.
