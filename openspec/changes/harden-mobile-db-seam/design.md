## Context

The `@/db` seam (`src/db/index.ts`) owns the single `expo-sqlite` handle + Drizzle instance and re-exports the primitives feature code uses — including `useLiveQuery` (re-exported verbatim from `drizzle-orm/expo-sqlite/query`). Four tables ride this seam: `calendar_events`, `personal_events`, `user_calendars`, `checklist_items`. Every reactive read in the app goes through this one `useLiveQuery`.

A real ~588-event synced calendar exposed two defects in the seam, both confirmed against installed sources by a three-expert review:

- **The O(N²) reactive-read storm.** `expo-sqlite`'s `addDatabaseChangeListener` is driven by SQLite's `sqlite3_update_hook`, which fires **per row** (`node_modules/expo-sqlite/.../SQLiteModule` update-hook path). Drizzle's `useLiveQuery` subscribes to it and re-runs its **full query** on **every** matching event (`node_modules/drizzle-orm/expo-sqlite/query.js`), and the Drizzle expo driver runs queries **synchronously** on the JS thread (`session.js` — `prepareSync`/`executeSync`/`getAllSync`). So the calendar-sync drop+replace of N rows (`sync/repository.ts`) emits ~2N per-row events → ~2N synchronous whole-table re-reads + re-maps, per mounted subscriber (Home + Calendar + Hidden-events all mount whole-table reads). ~1,176 events × 588-row reads ≈ 690k synchronous row materializations at startup → the JS thread pegs for minutes, freezing every tab.

- **The non-atomic "transaction."** `replaceAll` and `reorder` pass an **async** callback to `db.transaction`. The expo driver's session transaction is synchronous and never awaits (`session.js`): it runs `begin`, calls the callback, and immediately runs `commit`. An async callback executes only up to its first `await`, so the real sequence is `BEGIN → (first statement) → COMMIT → (remaining statements in autocommit)`. The atomicity the comments and specs promise (ADR 021/D3; ADR 024 reorder) is false at runtime.

ADR 021 pre-registered the perf risk as a revisit trigger but mis-modeled it as render jank (fixable with FlashList); the real mechanism is a write-amplified reactive-read storm in the seam. The device perf pass that "owned the call" needed a real 500+ event calendar, which only appeared now.

## Goals / Non-Goals

**Goals:**
- Collapse the reactive-read storm from O(N²) to O(N): a bulk write costs ONE re-read per mounted subscriber, not one per row — for **every** `@/db` table and for the Phase-09 importer's future first-launch bulk writes.
- Make `@/db` transactions genuinely atomic, so the drop+replace and the checklist reorder can't leave partial state.
- Keep the fix at the seam (the right altitude), with zero consumer-signature changes and a fully reversible diff.
- Correct the Architecture Book where it is now wrong or drifted.

**Non-Goals:**
- No storage relocation. `calendar_events` stays in SQLite; the drop+replace strategy (ADR 021) is unchanged. (Moving events into the persisted TanStack Query cache — "option A" — was assessed and rejected; see Decisions.)
- No SQL range-scoping of the events read, no new index, no migration. Unnecessary at current scale; recorded as a future escalation only.
- No change to the sync orchestrator's fetch/observability behavior (ADR 021/D4 stays).
- No new dependency, native config, or schema change.

## Decisions

### D1 — Fix the seam primitive; do NOT relocate `calendar_events` to React Query

The bug is a property of the seam's reactivity primitive, shared by all four tables. Two options were weighed by the panel:

- **Rejected — Option A (move `calendar_events` into the persisted TanStack Query cache).** Coherent taxonomy (server-authoritative read cache), and it kills the storm *for this one table* by construction. But: it fixes the instance, not the class (the other three tables + the importer's first-launch bulk write keep the identical footgun); it regresses offline durability (the persister discards the whole blob after `maxAge` = 24h and on any `buster` bump — a student offline >24h loses the timetable, where SQLite keeps last-good rows forever) and thereby arms ADR 013's own pre-registered MMKV-jank trigger; and it is an order-of-magnitude larger, less reversible diff (delete a table, ship a `DROP TABLE` migration to field devices, supersede ADR 021, bend ADR 013's policy) that still leaves the checklist `reorder` atomicity bug unfixed.
- **Chosen — fix the seam** (the shared `useLiveQuery` re-export + the transaction form). One small, reversible change fixes every table and the importer, makes the atomicity claims the ADRs already promise actually true, and preserves the earned constraints (offline-forever, the observability split, the checklist uid space). The "server state doesn't belong in SQLite" argument is real but is a storage-taxonomy judgment call that does not outweigh fixing the class over the instance — especially since the importer-fidelity argument that originally justified SQLite for this table is **void** (see D5).

### D2 — Coalesce the native per-row change events with a trailing-edge re-read (not a per-commit signal, not a repository notification bus)

`expo-sqlite` exposes **only** a per-row `onDatabaseChange` event — there is no commit hook and no runtime way to suppress the listener (verified in both native modules). So "coalesce per commit" is impossible as literally stated; coalescing must happen in JS. Two JS approaches were considered:

- **Rejected — per-table version bus.** Repositories bump a JS "table changed" counter once per logical mutation; the reactive read re-queries on counter change. Deterministically one read per write, but it adds a "every writer must remember to bump" contract that lint cannot fully enforce — a forgotten bump is a silent-stale-UI failure. (Kept in mind as optional future defense-in-depth.)
- **Chosen — trailing-edge coalescing over the existing native events.** The seam's reactive read schedules its re-read on a short trailing timer that each incoming change event resets, so a burst collapses to a single re-read, and the **final** event of a burst always schedules a read that runs (the guaranteed-final-run the spec requires). This rides the events that already exist, needs no writer cooperation (no new contract to forget), and — crucially — is made reliable by D3: once the transaction is genuinely synchronous, all ~2N events for a bulk write are emitted during the transaction's synchronous JS execution and delivered as one tight post-commit burst, which a one-frame trailing window collapses deterministically. The initial read stays immediate (only change-triggered re-reads are coalesced) so first paint is not delayed.

The seam hook keeps the **exact call signature and return shape** of Drizzle's `useLiveQuery` (a drop-in), so no consumer changes. Internally it reads the observed table from `query.config.table` (the single Drizzle-internal touchpoint; all call sites are `db.select().from(table)` selects, never relational `.query`) and resolves its name via `getTableConfig` (public API) to match change events by table name.

### D3 — Make transactions atomic via Drizzle's synchronous transaction form

Convert `replaceAll` and `reorder` from `db.transaction(async (tx) => …)` (with `await tx.…`) to Drizzle's **synchronous** transaction form: a non-async callback using the prepared sync executors (`tx.delete(t).run()`, `tx.insert(t).values(chunk).run()`, `tx.update(t).set(…).where(…).run()`). Because the callback never suspends, every statement runs between `BEGIN` and `COMMIT`, so the unit is truly all-or-nothing. This is the form the `"sync"` driver kind is built for; a hand-rolled `BEGIN`/`COMMIT` via `db.run` was rejected as reinventing what the driver already provides. A secondary benefit: with the callback synchronous, native change events are all queued during execution and delivered only after `COMMIT`, so no reactive read can ever observe a half-replaced table mid-burst — which reinforces D2.

### D4 — Preserve the reactive-read contract exactly, and fix the stock hook's gaps

The hand-owned hook MUST reproduce the contract three consumers gate on: `data` starts as the empty default and `updatedAt` stays `undefined` until the first query resolves (`user-calendars/hooks.ts` readiness gate, `event-details.ts`, `user-calendars-screen.tsx` empty-state gate). It also fixes two stock-hook gaps: an in-flight re-read must be ignored if the subscriber unmounted or its deps changed (the stock hook removes only the listener, so a late `setData` can land after unmount), and stale `data` must not be retained across a deps change. These are encoded as spec scenarios and unit tests.

### D5 — Correct the Book in place (ADR 021 + storage.md)

- ADR 021: record the real freeze mechanism under its already-fired revisit trigger (per-row update-hook events × synchronous whole-table re-query), and **correct the erroneous claim that `calendar_events` is a Phase-09 importer target** — the authoritative migration roadmap says to recover only the irreplaceable set (`user_calendars.token`, `personal_events`, `checklist_items`, `hidden_events`) and **re-sync** cached events from the token, i.e. do NOT migrate `calendar_events`. This void's the importer-fidelity argument on both sides of D1 and is a correction the Book needs regardless of the chosen option.
- `storage.md`: document the coalescing reactive-read contract and the transaction-atomicity contract; remove the reference to `findInRange`, which no longer exists in the codebase.
- Append an `architecture-changelog.md` entry for the two new seam contracts.

## Risks / Trade-offs

- **We now own a custom reactive-read wrapper over a third-party primitive.** → A missed coalesced re-read would show stale UI. Mitigate with a deterministic "burst of change events → exactly one re-read, and a final re-read after the last event" unit test (fake timers), plus a note to re-verify the `query.config.table`/`getTableConfig` touchpoints on any Drizzle upgrade.
- **Trailing-edge coalescing is timing-based.** → A pathologically spread-out event delivery could cause a few extra re-reads. Bounded: it is never worse than O(number-of-bursts) and never O(N); the D3 atomicity fix clusters a bulk write's events into one post-commit burst; the final-run guarantee prevents a missed update.
- **Atomicity is provable only on device** (CI mocks `@/db`). → Execute the on-device mid-sync-kill check (migration inbox item 3) this time, for both `replaceAll` and `reorder`; add it to the change's on-device checklist.
- **Slight reactive-update latency** (one coalescing window, ~a frame, on change-triggered updates). → Imperceptible; initial reads are unaffected (immediate).

## Migration Plan

Pure code + docs; no data migration, no schema/native change.
- Ship the seam hook + the two synchronous-transaction rewrites + tests + Book corrections together.
- **Rollback:** revert `src/db/` (the hook) and the two repository functions — no persisted-state implications, since neither the schema nor the stored rows change.
- **On-device validation before archive:** relaunch with a real 500+ event calendar and confirm no startup freeze; force-kill mid-sync and mid-reorder and confirm no partial state.

## Open Questions

- The coalescing window value (one animation frame vs a `setTimeout(0)`/microtask) — pin during implementation via the deterministic unit test; the burst is delivered post-commit so any small value collapses it.
- Whether to add the per-table version bus (D2's rejected alternative) later as defense-in-depth for writers — deferred; not needed for correctness given the native-event coalescing + final-run guarantee.
