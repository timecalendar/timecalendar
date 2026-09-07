---
kind: decision
id: D03
status: approved
traces-to: [P04]
supersedes: []
---

# D03 — Source retention and downgrade boundary

## Context and evidence

Flutter cannot read data created only in React Native. Deleting the old source removes a valuable
recovery artifact, while a reverse bridge substantially expands scope and failure modes.

## Options considered

- Retain source for a bounded release window, retain it indefinitely, or build a reverse bridge.
- Automatically clean up after success or never delete source from importer code.

## Proposed choice

Retain Flutter source data indefinitely and never delete it automatically. Do not build a reverse
bridge. Explicitly accept that downgrade after React Native-only writes can lose those writes.

## Tradeoffs and consequences

Indefinite retention improves recovery and forensic options at the cost of persistent local disk
usage. It does not promise bidirectional compatibility, so rollback decisions must distinguish a
binary rollback from data preservation.

## Approval

Approved by the TimeCalendar board owner in the human-only TIM-436 decision round answered
2026-09-07.
