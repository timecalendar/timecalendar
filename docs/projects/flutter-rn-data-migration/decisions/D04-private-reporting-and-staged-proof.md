---
kind: decision
id: D04
status: approved
traces-to: [P03, P04]
supersedes: []
---

# D04 — Private reporting and staged proof

## Context and evidence

An invisible best-effort migration needs a denominator and durable diagnostics, including when the
first launch is offline. General analytics and crash text are unsafe for tokens or user-authored
content. Simulator evidence cannot prove production sandbox survival.

## Options considered

- No telemetry, general-purpose telemetry, or a bounded first-party report contract.
- CI-only proof or signed physical update proof on both platforms.
- Immediate broad release or staged whole-app widening.

## Proposed choice

Send every terminal outcome through an idempotent local outbox to an access-controlled first-party
table. Allow bounded enums, counts, duration, versions, platform, report id, and calendar ids; ban
tokens, personal/checklist text, raw files, and arbitrary content-bearing errors. Start whole-app
rollout around 1%, then 5%, and widen from QA/monitoring evidence. Require internal and final
public-store in-place upgrades on both platforms, Android path/backup proof, and low-end timings.

## Tradeoffs and consequences

The endpoint and table add operational and privacy-sensitive surfaces, but make partial loss and
failure measurable. Offline delivery is independent of migration completion. Exact payload schema,
retention, and later rollout percentages remain bounded engineering/release details; broadening the
allowed data requires renewed approval.

## Approval

Approved by the TimeCalendar board owner in the human-only TIM-436 decision round answered
2026-09-07. The board owner retained responsibility for the required physical QA.
