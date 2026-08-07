# Roadmap

```
01 nest-shared multi-queue ──▶ 02 server queue refactor ──▶ 03 notifications pipeline
                                                                    │
                                                                    ▼ (wire contract frozen)
                                                            04 mobile alignment
05 mobile display-timezone preference (independent, later)
```

| # | Epic | Repo | Status |
| --- | --- | --- | --- |
| 01 | [Named queues in nest-shared](01-nest-shared-multi-queue.md) | `nest-shared` | to do |
| 02 | [Server queue refactor](02-server-queue-refactor.md) | `server` | to do |
| 03 | [Notifications pipeline](03-notifications-pipeline.md) | `server` | to do |
| 04 | [Mobile alignment](04-mobile-alignment.md) | `mobile` | to do |
| 05 | [Mobile display-timezone preference](05-mobile-timezone-pref.md) | `mobile` | to do |

## Sequencing notes

- **01 before 02**: the server refactor imports the multi-queue API.
- **02 before 03**: the pipeline's crons and `send_push` jobs assume reliable retries
  (attempts/backoff, errors not swallowed) and the `notifications` queue — both are 02
  deliverables. 03 on the current queue layer would ship a delivery guarantee that is
  fiction.
- **03 before 04**: 04 implements the v2 wire contract (payload casing, digest action,
  locale/timezone fields) that 03 defines. Mobile is undeployed, so there is no
  compatibility window to manage — 04 simply targets the final contract.
- **05 anytime**: pure mobile feature; 03/04 already accept any IANA timezone, so no
  server work is blocked on it.

## Standalone follow-ups (tickets, not epics)

- Sync worker concurrency tuning: 100k calendars on a 30-min refresh cycle needs measured
  throughput (the old `UPDATE_CONCURRENCY = 10` was an order of magnitude short). Epic 02
  makes concurrency a config knob; tuning it is an ops ticket with real numbers.
- Calendar URL dedup (many students share one school iCal URL): would cut sync load ~10×.
  Out of scope here; if it ever ships, revisit the outbox fan-out math (epic 03 records
  the escape hatch).
