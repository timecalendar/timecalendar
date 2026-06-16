# Calendar sync — on-device manual verification (Phase 04 item 3)

Change: `add-mobile-calendar-sync`. CI proves the wiring (mappers, repository query
shape + transactional drop+replace, the sync wiring at the `customFetch` seam, a
restart-simulation). The following are irreducibly on-device / hardware and cannot be
asserted in CI — verify on a real device build (dev variant) with a real
`user_calendars` token.

## What to verify / why / how

1. **Real synced data renders.** *Why:* CI mocks the network + SQLite; only a device
   proves `POST /calendars/sync` → `replaceAll` → the views render real events.
   *How:* add a real calendar (QR/iCal) so a `user_calendars` token exists, launch,
   confirm the timeline/agenda render the synced timetable.

2. **Offline read from the durable cache.** *Why:* the offline guarantee is the exit
   criterion; CI cannot exercise on-disk SQLite survival. *How:* sync once online →
   enable airplane mode → relaunch (kill the app) → the timetable still renders from
   `calendar_events`, and a pull-to-refresh shows the accessible sync-error + retry
   (last-good rows intact).

3. **Drop+replace atomicity / no half-empty table.** *Why:* a crash mid-replace must
   not lose the timetable; the transaction is asserted in CI but on-disk atomicity is
   device-only. *How:* trigger a sync and force-kill mid-sync (best-effort); on relaunch
   the table is either fully the old set or fully the new set, never empty/partial.

4. **Low-end-Android frame rate + Reassure baseline on REAL synced data.** *Why:*
   ADR 019's perf gate was measured on the fixture (dozens of events); real timetables
   are hundreds–thousands over a long horizon — the `SectionList`→FlashList trigger and
   `useLiveQuery`/`findInRange` cost are only real here. *How:* extend the scope of
   `inbox/2026-06-16-calendar-low-end-android-perf.md` to run on a dense synced
   timetable; if the agenda janks, swap FlashList v2 behind the unchanged `AgendaList`
   (the recorded trigger).

5. **Crashlytics arrival for a local replace-transaction failure.** *Why:* CI asserts
   `recordError` is called; only the dashboard proves arrival. *How:* force a
   `replaceAll` failure (dev panel / a temporary throw) and confirm the event lands in
   Crashlytics. (A network/fetch failure is deliberately NOT recorded — recoverable.)

## Notes

- Maestro: run `mobile/e2e/run_e2e.sh` locally (runtime-heavy ship). Whether the e2e
  server seeds a token+events reachable by deep link decides if the flow asserts a real
  synced event renders (see tasks 14) — otherwise it asserts render + reachability + a
  dev/fixture seed.
