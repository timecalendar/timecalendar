# `@/db` seam hardening — on-device manual verification

Change: `harden-mobile-db-seam`. CI proves the seam contracts against mocks — the
coalescing reactive read (deterministic burst → single re-read, empty-until-first-resolve,
cancellation guard) and the synchronous-transaction form of `replaceAll` / `reorder`
(non-async callback, every statement inside one transaction). The three items below are
irreducibly on-device: real per-row `sqlite3_update_hook` timing, on-disk transaction
atomicity, and JS-thread responsiveness under a real bulk write cannot be asserted in CI
(it mocks `@/db`). Verify on a real dev-variant build with a **real 500+ event calendar**
(a `user_calendars` token whose sync returns hundreds of events). This closes the ADR 021
perf-trigger call.

## What to verify / why / how

1. **No startup freeze on a real 500+ event calendar** (the bug this change fixes).
   *Why:* the raw `useLiveQuery` re-queried the whole table on every per-row change event
   during the sync drop+replace (~2N synchronous re-reads), pegging the JS thread for
   minutes; only real data + a real device proves the coalescing fix. *How:* import a
   real calendar with 500+ events so it syncs at launch → **fully relaunch** (kill, not
   reload) → open Calendar and Profile → confirm the JS thread stays responsive (tabs
   switch, scroll is smooth, no multi-second freeze) and the timetable renders.

2. **`calendar_events` drop+replace is all-or-nothing** (atomicity — device-proof-only).
   *Why:* the transaction is now genuinely synchronous, but on-disk atomicity across a
   process kill is only observable on hardware. *How:* trigger a sync and **force-kill
   mid-sync** (best-effort — background + swipe away while the sync spinner shows) → on
   relaunch the table holds either the complete previous set or the complete new set,
   never a partial or empty timetable.

3. **Checklist `reorder` is all-or-nothing** (atomicity — device-proof-only).
   *Why:* `checklist_items` is irreplaceable (no server backup); a half-applied reorder
   would corrupt ordering. *How:* open an event checklist with several items, start a
   drag-reorder and **force-kill mid-reorder** (best-effort) → on relaunch the ordering is
   the complete old order or the complete new order, never duplicated or gapped.

## Result

Verified on device (2026-07-05) with a real 500+ event calendar — **all three pass**:

- [x] 1 — no startup freeze; JS thread responsive, timetable renders on relaunch.
- [x] 2 — mid-sync kill leaves the complete old or complete new set, never partial/empty.
- [x] 3 — mid-reorder kill leaves the complete old or complete new order, never duplicate/gapped.

All three passing closes the ADR 021 perf-trigger call and the change's on-device axis.
