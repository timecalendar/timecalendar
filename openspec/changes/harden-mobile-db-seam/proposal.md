## Why

A real synced calendar (~588 events) froze the whole app for minutes at every startup — not the calendar renderer, but two latent defects in the `@/db` seam that every table shares:

1. **Reactive-read storm (O(N²)).** The seam re-exports Drizzle's `useLiveQuery`, which re-runs its FULL query on **every** `expo-sqlite` change event. `expo-sqlite` fires that event **per row** (SQLite's `sqlite3_update_hook`), and the Drizzle expo driver executes queries **synchronously** on the JS thread. So a bulk write — the calendar-sync drop+replace of N rows — emits ~2N per-row events, each triggering a synchronous whole-table re-read + re-map, across every mounted subscriber. 588 events ≈ ~690k synchronous row reads → the JS thread pegs for minutes at startup, freezing every tab.

2. **Non-atomic "transactions."** `replaceAll` (calendar sync) and `reorder` (checklists) pass an **async** callback to `db.transaction`, but the expo driver's transaction is **synchronous** and never awaits — it runs `BEGIN → (first write) → COMMIT`, and the remaining writes execute afterward in autocommit. The atomicity both call sites' comments and specs promise is false at runtime: a crash mid-write leaves a half-empty `calendar_events` table (a lost timetable) or corrupted checklist ordering (irreplaceable user data).

Both bugs live in the seam's reactivity primitive and its transaction contract, so the correct fix is at the seam — where every current table (and the Phase-09 importer's first-launch bulk write) inherits it. This preserves the storage decision (ADR 021): `calendar_events` stays in SQLite; the drop+replace strategy is unchanged.

## What Changes

- **Coalescing reactive read.** Replace the seam's raw `useLiveQuery` re-export with a seam-owned reactive-read hook that collapses a burst of per-row change events into a SINGLE trailing-edge re-query, with a guaranteed final run after the last event. Turns O(N²) into O(N) for every `@/db` table. The hook preserves the existing contract consumers depend on (`data` starts empty, `updatedAt` stays `undefined` until first resolve) and adds an in-flight-read cancellation guard the stock hook lacks.
- **Atomic seam transactions.** Establish that writes through `@/db` are truly atomic by using Drizzle's **synchronous** transaction form (non-async callback + `.run()`). Convert `replaceAll` (`calendar/data/sync/repository.ts`) and `reorder` (`event-checklists/data/repository.ts`) to this form so each commits or rolls back as one unit.
- **Book corrections (ADR 021 amended in place).** Record the real freeze mechanism (per-row update-hook events × synchronous whole-table re-query — the revisit trigger was pre-registered but mis-modeled as render jank); correct the erroneous "`calendar_events` is a Phase-09 importer target" claim (the authoritative migration roadmap says re-sync from the token, do NOT migrate cached events); remove `storage.md`'s reference to the no-longer-existing `findInRange`.
- **NOT changed:** no storage relocation (calendar_events stays SQLite), no schema/migration, no drop+replace redesign, no route or consumer-signature change. SQL range-scoping of the events read is deliberately **not** done — unnecessary at current scale, recorded as a future escalation.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `mobile-storage`: the `@/db` relational seam gains two contracts — (1) a reactive relational read that coalesces per-row change bursts into a single re-read (so a bulk write costs one re-read, not one per row), and (2) an atomicity guarantee that a write transaction through the seam commits or rolls back as one unit.

## Impact

- **Code:** `src/db/index.ts` (swap the `useLiveQuery` re-export for a seam-owned coalescing hook; new `src/db/` module for it); `src/features/calendar/data/sync/repository.ts` (`replaceAll` → synchronous transaction); `src/features/event-checklists/data/repository.ts` (`reorder` → synchronous transaction). Consumers are unchanged — the reactive-read hook keeps its signature and return contract, so `useSyncedEvents`, `usePersonalEvents`, `useUserCalendars`, `useEventDetails`, `useChecklist`, and the calendar/home/hidden-events screens are untouched.
- **Tests:** a new `@/db` seam test proving a burst of change events yields a single re-query (deterministic, fake timers) and that the empty/`updatedAt`-undefined contract holds; transaction-form assertions for `replaceAll`/`reorder`. Existing consumer tests remain green (mock at the seam).
- **Docs:** ADR 021 amended in place (mechanism + importer-target correction + D3 wording); `storage.md` corrected (reactive-read contract, transaction-atomicity contract, drop the phantom `findInRange`); `architecture-changelog.md` entry.
- **Dependencies / native / schema:** none.
- **Risk:** the app now owns a custom reactive-read wrapper over a third-party primitive (Drizzle-version fragility; a missed coalesced re-run would show stale UI — needs a deterministic burst-then-final-read test). Transaction atomicity is device-proof-only (CI mocks `@/db`), so the on-device mid-sync-kill check must actually be executed this time.
