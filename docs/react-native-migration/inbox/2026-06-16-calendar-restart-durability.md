# Calendar identity persistence — on-device restart / kill / cache-clear durability pass

**Date:** 2026-06-16
**Roadmap:** Phase 03 step 5 (`docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md`)
**Change:** `add-mobile-calendar-identity-persistence` (ship 5/5, the load-bearing ship)
**ADR:** [018](../../../.claude/rules/mobile/decisions/018-user-calendar-storage.md)
**For:** Samuel (needs a real device / installed dev build — the autonomous loop and CI cannot do this)

This is the **E2E / on-device durability axis** for the calendar identity-persistence ship.
Per the change's design (D9) and the DoD "no third state" rule, exactly one of {a Maestro
relaunch-durability flow, this manual note} must land — and this note is the one that lands,
because **no list UI ships this change** (a "your calendars" screen is an explicit Non-Goal),
so there is **no stable post-relaunch on-screen assertion target** a Maestro flow could check.

CI proves the repository's write-then-read-back **contract** (the stateful-mock restart-simulation
test, `data/user-calendars/restart.test.ts`) and the mapper/query/persist wiring; it **cannot**
prove the row survives a real **on-disk SQLite** restart/kill/cache-clear. That is this manual pass.

## 1. What I need

On a real device (or a release-config dev-variant build on a simulator/emulator), with the
RN dev app (`fr.samuelprak.timecalendar.dev`) installed:

- [ ] **Add a calendar** through the onboarding QR-scan path (scan a calendar QR) **and** through
  the iCal-URL path (paste a real calendar URL → Import). Each success now persists a durable
  `user_calendars` row (token + metadata) via `addCalendarFromUrl` (POST `/calendars` → GET
  `/calendars/by-token/{token}` → `upsert`), replacing the removed ephemeral holder.
- [ ] **Cold restart** the app (swipe-kill the process, relaunch). Confirm the persisted row is
  still in the `user_calendars` table.
- [ ] **Process kill** (force-stop on Android: Settings → Apps → force stop; iOS: kill from the
  app switcher) then relaunch. Confirm the row survives.
- [ ] **JS-cache clear** (Metro/dev: clear the JS bundle cache / reinstall the JS only without
  wiping app data) then relaunch. Confirm the row survives (this proves the durability is in
  on-disk SQLite, not an in-memory JS holder — the whole point of the ship).

## 2. Why

The token IS the user's calendar identity and there is **no server backup** — a lost token means
the user must re-add the calendar by hand. The migration-research doc names `user_calendars.token`
the single most critical, irreplaceable sembast field. Only a real on-disk restart proves the
SQLite row materialized and survives; no static tool, Jest, the restart-simulation mock, or the
pipeline can assert real-device file survival.

## 3. How to verify the row (no UI to read it this ship)

Since no "your calendars" screen renders the row yet, inspect the SQLite store directly after each
relaunch:

- **iOS simulator:** `xcrun simctl get_app_container booted fr.samuelprak.timecalendar.dev data`
  → find `…/Documents/SQLite/timecalendar.db` (expo-sqlite default dir) → open with `sqlite3` and
  run `SELECT id, token, name, visible FROM user_calendars;` — confirm the row + the exact token.
- **Android:** `adb shell run-as fr.samuelprak.timecalendar.dev find . -name 'timecalendar.db'`
  → pull it (`adb exec-out run-as … cat …/timecalendar.db > /tmp/tc.db`) → `sqlite3 /tmp/tc.db
  "SELECT id, token, name, visible FROM user_calendars;"`.
- Alternatively, temporarily log `findAll()` / `getByToken()` output from the data layer in a dev
  build and read it off Metro.

Confirm the **token value is byte-identical** before and after each relaunch (the importer-fidelity
property), and that `visible` round-trips as expected.

## 4. Blocks

**Nothing in this ship's CI gate.** `tsc` / lint / Jest (incl. the restart-simulation contract
test and the 90% coverage gate) are green without this pass. This is the irreducibly-human
on-device proof the DoD E2E axis points at; tick the boxes above, then tick Phase 03 roadmap step 5
(already marked done with this note as its durability evidence).
