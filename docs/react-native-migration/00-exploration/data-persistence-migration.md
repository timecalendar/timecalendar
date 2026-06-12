# TimeCalendar → React Native: on-device data persistence & migration

> **The blocker this answers:** when we ship the RN binary over the Flutter one, what happens to user data already stored on the device, and can we read it from the RN side?
>
> **Short answer: yes, the data survives the update and is retrievable — but not automatically.** RN's default storage tools won't read Flutter's stores; we read them deliberately, once, on first RN launch.
>
> Companion docs: [`migration-approach.md`](./migration-approach.md) (how we run the migration), [`reference-stack-grounded.md`](./reference-stack-grounded.md) (what we build with).
>
> Status: exploration / findings. **Verified on a real iOS simulator** (iPhone 17 Pro, iOS 26.1, bundle `fr.samuelprak.timecalendar`) — both stores were read off the device and the RN-side parser was run against the actual files. See [§6](#6-device-verification-done).

---

## 0. The one fact that makes this possible

An app-store update **keeps the same sandbox/container** — same iOS bundle identifier, same Android `applicationId`. Shipping the RN binary on top of the Flutter one does **not** wipe anything. Every file and preference Flutter wrote is *physically still on disk* after the update.

The only problem is **format**: RN's default storage (`AsyncStorage`) writes to different locations than Flutter's, so a naive read finds nothing. The data is there; we just have to read it the way Flutter wrote it.

---

## 1. What the Flutter app actually stores

Three on-device stores, verified against the code:

| Store | Package | What's in it | Evidence |
| --- | --- | --- | --- |
| **Key/value settings** | `shared_preferences` + `pref` | `theme`, `dark_mode`, `show_weekends`, `colors_by_group`, `calendar_view_type`, `startup_screen`, `current_version`, `date_limit`, `last_activity_update`, `new_activity`, `notification_calendar` | `main.dart:51`, `settings_provider.dart:73-172` |
| **Document DB** | `sembast` (file `simple_database.db`) | `user_calendars`, `personal_events`, `checklist_items`, `hidden_events`, `calendar_events`, `calendar_logs` | `simple_database.dart:18-19` + repo `STORE_NAME` constants |
| **Firebase** | `firebase_auth`, FCM | Auth state / push token | `pubspec.yaml` (Firebase Auth is present but **unused** — see [reference doc §0](./reference-stack-grounded.md)) |

---

## 2. Criticality: what's irreplaceable vs. re-syncable

Not all of this matters equally. The migration only needs to *preserve* what can't be recovered from the server.

| Data | Where | Replaceable? | Loss if dropped |
| --- | --- | --- | --- |
| **`user_calendars.token`** | sembast | **No** — it's the subscription identity | **Critical.** User loses their calendar; must re-add the school calendar by hand. `user_calendar.dart:6` |
| **`personal_events`** | sembast | **No** — user-created, local-only, no server module | **Real data loss.** |
| **`checklist_items`** | sembast | **No** — user-created, local-only | **Real data loss.** |
| **`hidden_events`** | sembast | **No** — user preference, local-only | Minor loss (events un-hide). |
| `calendar_events` | sembast | Yes — cache, re-fetched via token | None (re-sync). |
| `calendar_logs` | sembast | Yes — derived | None. |
| Settings (`theme`, view type, …) | shared_prefs | Cosmetic — re-derivable / defaultable | UX hiccup only. |
| Firebase Auth / FCM token | Firebase | Regenerates on its own | None — nothing to migrate. |

**The genuinely irreplaceable set is small:** `user_calendars.token` + `personal_events` + `checklist_items` + `hidden_events`. Everything else re-hydrates from the server once we have the token.

---

## 3. How to read each store from RN

### 3.1 `shared_preferences` (settings)

| Platform | Where Flutter writes | Gotcha |
| --- | --- | --- |
| **iOS** | `NSUserDefaults`, **every key prefixed `flutter.`** (e.g. `flutter.dark_mode`) — **confirmed on device** in `Library/Preferences/fr.samuelprak.timecalendar.plist`: `flutter.theme`, `flutter.dark_mode`, `flutter.calendar_view_type`, `flutter.show_weekends`, `flutter.current_version`, etc. | RN `AsyncStorage` uses a *file* store on iOS, not `NSUserDefaults` — a plain AsyncStorage read finds nothing. |
| **Android** | XML file `FlutterSharedPreferences.xml`, also `flutter.`-prefixed | RN `AsyncStorage` uses SQLite (`RKStorage`) — different file. |

**How to read it:** go to the *native* prefs directly — e.g. `react-native-default-preference` (lets you point at the `NSUserDefaults` suite / the Android prefs file name), strip the `flutter.` prefix, write into the RN store. Fully doable.

> ⚠️ Version caveat: newer `shared_preferences` can use `SharedPreferencesAsync` (Android `DataStore`) as its backend, which changes the Android write location. Confirm which backend `2.5.5` uses on Android before relying on `FlutterSharedPreferences.xml` ([§6](#6-verify-before-you-trust-this)).

### 3.2 `sembast` (the real data)

Located at `<AppDocuments>/simple_database.db` (`simple_database.dart:18-19`).

- **Format:** plain-text **JSONL**, append-only log. First line is metadata (version / sembast), then one JSON record per line; deletes are tombstones. Unencrypted. **Confirmed on device** — `file` reports it as `JSON data`, e.g.:
  ```
  {"version":3,"sembast":1}
  {"key":"700ff…","store":"user_calendars","value":{…,"token":"AdWBldUNaMhQfLjGrsAlN",…}}
  {"key":"-Ouw…","store":"calendar_events","value":{…}}
  {"key":"-Ouw…","deleted":true,"store":"calendar_events"}        ← tombstone
  {"key":"5ea1…","store":"personal_events","value":{"title":"Test on device",…}}
  ```
- **No RN library exists** for sembast — but we don't need one. Read the file (`react-native-fs` / `expo-file-system`) and **replay the log** in JS: apply records in order, last-write-wins per `(store, key)`, drop tombstones. The parser below was run against the real device file and correctly recovered the calendar token and personal event (and collapsed an add→delete→re-add of the same `calendar_events` key to a single live record):
  ```js
  function loadSembast(raw) {
    const lines = raw.split("\n").filter((l) => l.trim());
    // lines[0] is metadata ({"version":3,"sembast":1}); the rest is the log.
    const stores = {}; // store -> Map(key -> value)
    for (const line of lines.slice(1)) {
      const rec = JSON.parse(line);
      const m = (stores[rec.store] ??= new Map());
      if (rec.deleted) m.delete(rec.key); // tombstone
      else m.set(rec.key, rec.value); // last-write-wins
    }
    return stores;
  }
  ```

### 3.3 Firebase

Nothing to do. `firebase_auth` is unused, and the FCM token regenerates on first RN launch.

---

## 4. Recommended strategy: one-time migration on first RN launch

Don't port the *storage engine*. Run a one-shot native migration the first time the RN app boots, then never again:

1. **Recover the irreplaceable set only:** read sembast JSONL → extract `user_calendars.token`, `personal_events`, `checklist_items`, `hidden_events` → write into the new RN data layer.
2. **Re-sync the rest from the server** using the recovered token(s) — do **not** migrate `calendar_events` / `calendar_logs`; let them rehydrate.
3. **Optionally** copy `flutter.`-prefixed settings for UX continuity (theme, view type). Low stakes.
4. **Set a `migration_done` flag** so it runs exactly once.

This shrinks the scary part from "port two databases" to "recover ~4 small things, then let the server rehydrate everything else." Much lower risk, and it aligns with the app's already-local-first, server-rehydratable design ([reference doc §0](./reference-stack-grounded.md)).

---

## 5. Risk

The genuine data-loss exposure is `personal_events` / `checklist_items` / `hidden_events` — **no server backup exists**, so a bug in the migration code means permanent loss for that user. Treat the migration as a first-class, tested feature:

- Test against a **real pre-update install** (capture a device's `simple_database.db` + prefs, run the migration, diff the result).
- Ship the migration behind the `migration_done` flag so a crash mid-migration can be retried, not skipped.
- Consider a one-release **safety net**: keep the old sembast file on disk (don't delete) until the next release, so a botched migration is recoverable.

---

## 6. Device verification (done)

Verified against a live iOS simulator (iPhone 17 Pro, iOS 26.1) with the current Flutter app installed and real user data (a calendar subscription + a hand-created personal event):

- [x] **sembast format confirmed.** `simple_database.db` lives at `<container>/Documents/simple_database.db`, is `JSON data` (JSONL), and the [§3.2](#32-sembast-the-real-data) replay parser recovered the `user_calendars` token and the `personal_events` record. Tombstone + last-write-wins logic verified (an add→delete→re-add of one `calendar_events` key collapsed to a single live record).
- [x] **shared_preferences format confirmed (iOS).** `flutter.`-prefixed keys present in `Library/Preferences/fr.samuelprak.timecalendar.plist` exactly as predicted.

Still open (not testable from the iOS simulator alone):

- [ ] **Android backend.** Confirm whether `shared_preferences` 2.5.5 uses the legacy `SharedPreferences` (XML `FlutterSharedPreferences.xml`) or `SharedPreferencesAsync` (`DataStore`) backend on Android — it changes the read location. iOS is settled.
- [ ] **Android sembast path.** Confirm `getApplicationDocumentsDirectory()` → the equivalent Android dir and that the file survives the binary swap there (it should; verify on a test device).
