---
kind: decision
id: D05
status: approved
traces-to: [P03, P02]
supersedes: []
---

# D05 — Data is read in screen-level chunks; each page's presentation is cached and has an explicit status

## Context and evidence

- **Reads per commit.** Each commit re-keys 6 live SQLite queries and runs about 8 full scans of
  unindexed tables. The Expo SQLite driver runs them synchronously on the JS thread (R04 §1). The
  agenda-range snapshot stays mounted in week and day views (`ui/calendar-screen.tsx:95`).
- **Empty-looking pages.** The keep-and-reproject pattern
  (`data/timeline-presentation-hook.ts:49-62`) shows a page that has just entered as empty until its
  read lands. Product §13 forbids presenting it as an empty week.
- **Duplicated work.** The presentation is built twice per render (`:64-83`). Accessibility order,
  the conflict plan and labels are recomputed in render for every page
  (`renderer/owned-calendar-canvas.tsx:508-538`).
- **Leak.** The rejected-row diagnostics set is never pruned (`data/events.ts:81-91`).

## Options considered

- **Keep per-range live queries, widening the range.** Still re-queries on every commit.
- **A screen-level window store with 28-day chunks aligned to `firstWeekday`** (proposed).
- **TanStack Query over SQLite reads.** It adds a second cache model beside Drizzle live queries,
  with no benefit for local data.

## Proposed choice

**`CalendarWindowStore`, one per Calendar screen:**
- reads 28-day chunks aligned to `firstWeekday`;
- prefetches ±1 chunk;
- guards writes per chunk with a sequence number, so a late result cannot overwrite a newer one;
- keeps previous data while it re-reads;
- uses one database change listener with batched re-reads, keeping sync replacements atomic;
- bounds memory at 6 chunks and a 16-page presentation LRU.

**Page status.** Each page has an explicit status: `loading`, `ready` or `error`. A `loading`
page renders the grid without tiles and is never announced or labelled as empty.

**`PagePresentation`.** Built once per page key and frozen. It holds tiles, overlap columns,
formatted labels, accessibility labels, header parts and accessibility order. Only the
zoom-dependent conflict plan stays in the page component. Formatters are cached.

**Indexes.** Add an index on the event range columns the chunk query uses, if the measurements
show the scan is costly.

**Agenda.** The agenda keeps its own 7-day read path (out of scope, owner 2026-10-01). Its query
mounts only while the agenda is visible, instead of alongside week and day views
(`ui/calendar-screen.tsx:95`).

## Tradeoffs and consequences

- Supersedes the per-range live-query rule in the Architecture Book's `calendar.md` and
  `storage.md`, which needs a changelog entry.
- A single read path makes correctness under out-of-order results testable as pure logic in
  `calendar/data`, under the 90% coverage gate.

## Approval

Owner (Samuel Prak) approved explicitly in the Claude Code planning session, 2026-10-01 (round-1 answers).
