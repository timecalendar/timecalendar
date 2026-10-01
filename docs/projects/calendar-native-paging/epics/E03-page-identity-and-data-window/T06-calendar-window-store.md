---
kind: ticket
id: T06
epic: E03
status: done
traces-to: [P03, P02, D05]
depends-on: [T05]
size: L
confidence: medium
---

# T06 — Chunked window store with explicit page status

## Outcome

A screen-scoped `CalendarWindowStore` reads 28-day chunks with ±1 prefetch, one database listener, sequence-guarded writes and keep-previous behaviour, and exposes `loading | ready | error` per page.

## Scope

- The store and its React binding.
- Fix the unbounded rejected-row diagnostics set (`data/events.ts:81-91`).
- Index migration only if measurement shows full scans are costly.

## Non-goals

- Agenda read path.

## Definition of done

- Tests for out-of-order completion, invalidation, eviction bounds and the leak fix.

## Acceptance and verification

- `npm test -- --coverage`; storage rules from `docs/mobile/architecture-book/storage.md`.

## Likely work sites and reading

- `mobile/src/features/calendar/data/events.ts`
- `mobile/src/features/calendar/data/sync/`
- `mobile/src/features/calendar/data/timeline-presentation-hook.ts`
- `docs/mobile/architecture-book/storage.md`
- `docs/mobile/architecture-book/data.md`
- research/R04-data-window-and-presentation.md §3

## Size and confidence drivers

Replaces live-query hooks; synchronous driver cost unmeasured.

## QA and sensitive surfaces

Sync replacement while paging must stay atomic.
