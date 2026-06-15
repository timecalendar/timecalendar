# Android storage verification — Flutter persistence backends on a real Android device

**Date:** 2026-06-15
**Roadmap:** Phase 03 step 6 (`docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md`)
**Research source:** [`data-persistence-migration.md §6`](../00-exploration/data-persistence-migration.md#6-device-verification-done)
**For:** Samuel (needs physical Android hardware — the autonomous loop cannot do this)

This is **not a ship** — it's a one-shot on-device confirmation of two open items from the
persistence research. iOS is already settled (§6, verified on the iOS simulator). The two open
items below are **Android-only** and **need a real Android device** (or a fully-provisioned
emulator with the current Flutter app installed and real user data), so they cannot be done by
the pipeline. They gate the **Phase 09 one-shot importer** (it must read the recovered
`user_calendars.token` + `personal_events` from the correct Android locations), not any Phase 03
ship — the Phase 03 token schema is designed Flutter-wire-verbatim regardless.

## 1. What I need

Install the **current Flutter app** (`app/`, store identity `fr.samuelprak.timecalendar`) on a
real Android device, create real user data (subscribe to a calendar → produces a
`user_calendars` token; hand-create a personal event), then confirm:

- [ ] **Android `shared_preferences` backend.** Confirm whether `shared_preferences` 2.5.5 on
  Android uses the **legacy `SharedPreferences`** backend (XML at
  `/data/data/fr.samuelprak.timecalendar/shared_prefs/FlutterSharedPreferences.xml`) or the
  newer **`SharedPreferencesAsync` / `DataStore`** backend (a different on-disk location). This
  changes where the Phase 09 importer reads the `flutter.`-prefixed prefs. iOS is settled
  (`Library/Preferences/<bundle>.plist`).
- [ ] **Android sembast path.** Confirm `getApplicationDocumentsDirectory()` resolves to the
  expected Android app-documents dir and that `simple_database.db` (the sembast JSONL) lives
  there and survives the Flutter→RN binary swap (same package id → same data dir; verify it is
  not wiped on update).

## 2. Why

Both require inspecting an installed-app's private data dir on Android — only doable with a real
device / `adb` against a debuggable build (or root). The iOS simulator pass (§6) cannot reach the
Android backend or path. No static tool, Jest, or the pipeline can assert on-device file layout.

## 3. How to verify

- Backend: `adb shell run-as fr.samuelprak.timecalendar ls -la shared_prefs/` → look for
  `FlutterSharedPreferences.xml` (legacy) vs. a `datastore/` dir (Async/DataStore). Dump the file
  and confirm the `flutter.`-prefixed keys.
- sembast: `adb shell run-as fr.samuelprak.timecalendar find . -name 'simple_database.db'` →
  confirm it's under the app-documents dir and is JSONL; run the §3.2 replay parser over a pull of
  it to confirm the `user_calendars` token + `personal_events` record recover (mirrors the iOS
  check).

Tick both boxes in `data-persistence-migration.md §6`, then tick Phase 03 roadmap step 6.

## 4. Blocks

**Nothing in Phase 03 ships.** Informational + a Phase 09 importer prerequisite — the Phase 03
exit criterion "Android storage paths confirmed" closes when both boxes above are ticked. The
five Phase 03 feature ships do not wait on this.
