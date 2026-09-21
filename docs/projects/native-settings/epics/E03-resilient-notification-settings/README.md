---
kind: epic
id: E03
status: planned
traces-to: [P03, P04, D01, D03, D04, D05]
depends-on: [E01]
---

# E03 — Native notification choices with resilient saves

## Outcome

Users choose notification frequency and days ahead through native controls. Choices persist
locally and remain pending until the latest subscription snapshot is acknowledged.

## Demonstration

Change frequency and enter a custom horizon, leave during a failed request, then return to
the same choices and shared retry status. Restart with pending intent and recover. A newer
edit survives an earlier acknowledgment. Daily delivery remains scheduled at 19:00 Paris.

## Definition of done

T05 and T07 pass persistence, race, restart, reset, and UI acceptance checks. One runtime owns
subscription requests and status across routes. Acknowledgment does not claim device
permission or guaranteed delivery. Owner-led visual acceptance has no separate ticket.

## In scope

Durable latest-state synchronization, shared status/recovery, native frequency selection,
horizon presets/custom entry, truthful translated copy, and relevant specification updates.

## Out of scope

Permission handling, server revisions, delivery guarantees, reminders, or local-time schedules.

## Risks and boundaries

An ambiguous timeout can leave an older server request running; client serialization cannot
prove strict remote ordering. Environment/token changes must invalidate obsolete completions.
T05 includes runtime/reset integration. T07 consumes its shared status and E01's native controls.

## Tickets

- [T05: Reliable notification saves](T05-reliable-notification-saves.md)
- [T07: Native frequency and days-ahead controls](T07-native-notification-controls.md)
