## ADDED Requirements

### Requirement: Reactive relational reads coalesce change bursts on the `@/db` seam

The `@/db` seam SHALL provide the reactive relational read that feature code uses to observe a table (the `useLiveQuery` re-exported from `@/db`), and that read SHALL coalesce a burst of database change events into a single re-query. Multiple change notifications for the observed table that arrive within a coalescing window SHALL trigger exactly ONE re-read, and a re-read SHALL be guaranteed to run after the final event of a burst so the observed result reflects the fully committed state. A bulk write of N rows to an observed table SHALL therefore cost O(1) re-reads per mounted subscriber, not O(N).

The reactive read SHALL preserve the contract its consumers depend on: its `data` SHALL be the empty default and its `updatedAt` SHALL be `undefined` until the first query resolves. An in-flight re-read SHALL NOT apply its result after the subscriber has unmounted or its query dependencies have changed (no state update against a stale subscription).

Feature code SHALL obtain this reactive read from `@/db` and SHALL NOT import a database reactive-read primitive (e.g. `drizzle-orm/expo-sqlite/query`) directly.

#### Scenario: A bulk write triggers a single re-read, not one per row
- **WHEN** a repository writes N rows to an observed table as one logical mutation (e.g. the calendar sync drop+replace)
- **THEN** each mounted reactive read of that table re-queries exactly once for that burst
- **AND** the re-read reflects the final committed set of rows

#### Scenario: The empty/undefined contract holds before first resolve
- **WHEN** a reactive read is mounted and its first query has not yet resolved
- **THEN** its `data` is the empty default
- **AND** its `updatedAt` is `undefined`

#### Scenario: No state update after unmount or dependency change
- **WHEN** a subscriber unmounts, or its query dependencies change, before an in-flight re-read resolves
- **THEN** the stale re-read's result is not applied as a state update

### Requirement: Writes through the `@/db` seam are atomic

A write performed inside a `@/db` transaction SHALL commit or roll back as a single unit: either every statement in the transaction is durably applied, or none is. A multi-statement write (for example the calendar-events drop+replace, or the checklist reorder) SHALL execute entirely within the transaction so that no statement runs in autocommit outside it, and an interruption (crash, force-kill) mid-write SHALL never leave partially-applied state.

#### Scenario: The calendar drop+replace is all-or-nothing
- **WHEN** a calendar sync replaces the events table (delete-all followed by chunked inserts) and the process is interrupted mid-write
- **THEN** on relaunch the table holds either the complete previous set of rows or the complete new set
- **AND** never a partial or empty table

#### Scenario: The checklist reorder is all-or-nothing
- **WHEN** a checklist reorder renumbers items and is interrupted mid-write
- **THEN** the stored ordering is either the complete previous order or the complete new order
- **AND** never a duplicated or gapped ordering
