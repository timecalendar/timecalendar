# 01 — Scope, prerequisites & execution order

← [Section index](./README.md) · next: [02 — Persisted data inventory](./02-persisted-data-inventory.md)

---

## 1. What this playbook tests

**One question:** when the React Native binary replaces the Flutter binary *in place* (same store
listing, same app icon, user taps "Update"), does the student's own work survive, exactly once,
and remain usable?

"Their own work" means everything the student created or chose **on the device** that has **no
copy on the server**. The full list is [02 — Persisted data inventory](./02-persisted-data-inventory.md).
The short version, in descending order of how bad losing it is:

| Rank | Data | Why it matters |
| --- | --- | --- |
| 1 | The calendar subscription **token** | It *is* the student's identity. Lose it and they must find and re-add their timetable by hand. |
| 2 | **Personal events** | Student-authored. No server copy. Permanently gone if dropped. |
| 3 | **Checklist items** ("notes" on a course) | Student-authored. No server copy. |
| 4 | **Hidden events** | A student preference, no server copy. Losing it un-hides courses they deliberately hid. |
| 5 | Preferences (theme, …) | Cosmetic; a re-pick costs seconds. |

Everything else — the timetable's own courses, activity logs, the push token — is server-owned or
regenerates, and is verified only to the extent that it must come *back* correctly
(`ON-01…ON-06`).

## 2. What this playbook does not test

See [Non-goals](./README.md#non-goals) in the index. In particular: no visual parity, no minimum-OS
matrix, no performance certification, and **no severity or go/no-go verdicts**. A failed scenario
is recorded as a fact with evidence; deciding what it means for a release is someone else's job.

## 3. Builds

### 3.1 The source build (Flutter)

| Item | Value | Evidence |
| --- | --- | --- |
| Version | The **latest publicly released** build. At the time of writing: `3.1.0+134` | `app/pubspec.yaml:15` |
| iOS bundle identifier | `fr.samuelprak.timecalendar` | `app/ios/Runner.xcodeproj/project.pbxproj:522` |
| Android `applicationId` | `fr.samuelprak.timecalendar` | `app/android/app/build.gradle:47` |
| Where you get it | The **store**, not a local build. iOS: App Store. Android: Google Play. | — |

> **Install it from the store.** A locally built or sideloaded Flutter app is signed differently
> and Google Play will refuse to update over it (see [05](./05-android-in-place-update.md#the-signature-rule)),
> and on iOS a locally installed development build is a different install than the App Store one.
> The whole point of this playbook is the *real* update path.

If the currently released version differs from `3.1.0+134`, record the real one in the report
header ([08](./08-qa-execution-report-template.md)) — the playbook's expectations do not depend
on the exact build number, only on it being the latest public one.

### 3.2 The target build (React Native)

| Item | Value | Evidence |
| --- | --- | --- |
| Version | `4.0.0` or later | `mobile/app.config.ts:60` |
| iOS bundle identifier | `fr.samuelprak.timecalendar` (production variant) | `mobile/app.config.ts:33-35, 78` |
| Android `package` | `fr.samuelprak.timecalendar` (production variant) | `mobile/app.config.ts:33-35, 104` |
| Delivery | TestFlight (iOS) / Play internal or closed testing (Android) | [04](./04-ios-in-place-update.md), [05](./05-android-in-place-update.md) |

> **The `.dev` variant cannot be used for this playbook.** With `APP_VARIANT=development` the app
> id becomes `fr.samuelprak.timecalendar.dev` (`mobile/app.config.ts:33-35`) — a *different*
> sandbox. It installs **alongside** the Flutter app instead of replacing it, so nothing is
> migrated and the run proves nothing. Use a production-identity build.

## 4. Build preconditions

Check all four **before** you seed any data. Each is cheap; skipping one wastes a whole pass.

### B-1 — Same store identity

The RN build's bundle identifier / package name must be **exactly** `fr.samuelprak.timecalendar`,
with no `.dev` suffix. Confirm with whoever produced the build, and again on-device after the
update (the app must replace the Flutter icon, not sit next to it).

*Fails if:* after installing the RN build you have **two** TimeCalendar icons on the home screen.
Stop — the run is void.

### B-2 — Same signing identity (Android) / same Apple team (iOS)

Android: the RN build must be signed by the same Play App Signing key as the released Flutter
app, or Play will not offer it as an update. iOS: same Apple team, distributed through the same
App Store Connect app record. Confirm with the release owner —
[`../../mobile/releases/README.md`](../../mobile/releases/README.md) owns the custody detail.

### B-3 — Does the build contain the importer?

**This is the precondition that decides how you record the whole run.**

The Phase-09 one-shot importer is what reads Flutter's sembast database and `flutter.`-prefixed
preferences and writes them into the RN stores. Its intended behavior is specified in
[`../01-roadmap/09-data-migration.md`](../01-roadmap/09-data-migration.md).

**At the time this playbook was written, `mobile/` contains no such code.** The evidence:

- There is no `migration` feature module — `mobile/src/features/` holds `about`, `calendar`,
  `calendar-sources`, `changelog`, `environment`, `event-checklists`, `feedback`,
  `hidden-events`, `home`, `notifications`, `onboarding`, `personal-events`, `school-selection`,
  `settings`, `splash`, and nothing else.
- Nothing in `mobile/src/` reads the sembast file or native preferences. The only occurrences of
  "sembast" / "flutter." are **comments** in `mobile/src/db/schema.ts`,
  `mobile/src/features/calendar-sources/data/user-calendars/repository.ts:42`, and one test —
  every one of them describing the schema's *readiness to receive* imported rows, not an import.
- The app has no filesystem or native-preferences dependency to read them with: `mobile/package.json`
  lists `expo-sqlite` and `react-native-mmkv`, and neither `expo-file-system` nor any
  native-preferences bridge.
- The app's startup path (`mobile/src/app/_layout.tsx:42`) runs `runMigrations()` — the Drizzle
  *schema* migration runner (`mobile/src/db/migrate.ts`), which creates empty tables. It is not a
  data importer.

**How QA determines this for the build in hand:**

1. **Ask.** Request from engineering, in writing, in the build's release note: *"does this build
   contain the Phase 09 Flutter data importer — yes or no?"* Record the answer verbatim in the
   report header.
2. **Observe.** Run `OFF-01` and `OFF-02` only. If a seeded calendar and personal events appear
   with no network, the importer ran. If the app opens to an empty state with no calendars, it
   did not.

**How to record it:**

| B-3 answer | How to run | How to record |
| --- | --- | --- |
| Importer **present** | The full playbook. | Normal `PASS` / `FAIL` per scenario. |
| Importer **absent** | Run `OFF-01`, `OFF-13`, `OFF-14`, `OFF-15`, `REC-01` only (they are still meaningful — the app must launch cleanly and default sanely over an existing Flutter container). | Mark every other scenario **`N/A — importer not in build`**. **Do not mark them `FAIL`.** A missing feature is not a defect found by test. |
| Unknown | Do not start. | Escalate as [Q-01](./09-open-engineering-questions.md#q-01--is-the-phase-09-importer-in-the-build-under-test). |

### B-4 — Android storage locations confirmed

Two facts about Android are still unconfirmed on real hardware
([`../inbox/2026-06-15-android-storage-verification.md`](../inbox/2026-06-15-android-storage-verification.md)):
which `shared_preferences` backend the Flutter app uses, and where its sembast file lives.

This does **not** block an Android run — it changes what a failure *means*. If Android-only
device-owned data fails to migrate while iOS passes, note [Q-02](./09-open-engineering-questions.md#q-02--which-shared_preferences-backend-does-android-use)
and [Q-03](./09-open-engineering-questions.md#q-03--where-does-sembast-live-on-android-and-does-it-survive-the-swap)
on the failure row. [05](./05-android-in-place-update.md#6-collecting-storage-evidence) gives the
`adb` commands that collect the evidence engineering needs.

## 5. Devices

Both platforms are required. Minimum-OS and device-breadth matrices are out of scope — one
current, healthy device per platform is the target.

| Slot | Platform | Requirements |
| --- | --- | --- |
| **iOS-1** | iPhone, current iOS | Signed into the Apple ID enrolled in the TestFlight internal group. App Store access to install the released Flutter build. |
| **AND-1** | Android phone, current Android | Signed into the Google account on the Play testing track. Play Store access to install the released Flutter build. **Developer options + USB debugging on** if you want the `adb` evidence in [05](./05-android-in-place-update.md#6-collecting-storage-evidence). |
| **AND-2** *(optional)* | A second, slower Android device | Only used by `OFF-19` (the large pack's practical usability). Skip if unavailable and note it. |

Per device, before you start:

- [ ] The app is **not** installed (uninstall any previous TimeCalendar so you start from a clean
      container — this is the one and only permitted wipe, and it happens *before* the Flutter
      install, never between Flutter and RN).
- [ ] Device date/time is **automatic** and correct, and the timezone is recorded in the report.
      Several personal-event expectations are timezone-sensitive (`OFF-07`).
- [ ] Device language recorded (the Flutter app is French-only; the RN app follows the device
      locale with an English fallback — `mobile/src/features/settings/prefs/store.ts`).
- [ ] Battery > 50 %, ≥ 2 GB free storage.
- [ ] A reliable way to cut the network **completely** — airplane mode is the reference method
      (Wi-Fi off alone leaves cellular up and silently invalidates the offline scenarios).

## 6. The canonical execution order

**Run these in order. The order is the test.** Its whole purpose is that step 4 (network off)
happens *before* step 5 (the update), so a backend refetch cannot quietly repopulate data that
the migration actually dropped. Running the update online first destroys the evidence for
`OFF-02`, `OFF-08`, `OFF-09`, and `ON-02` and the pass must be redone.

| Step | Action | Document | Gate before moving on |
| --- | --- | --- | --- |
| 1 | Install the latest publicly released **Flutter** build from the store | [04 §1](./04-ios-in-place-update.md#1-install-the-flutter-source-build) / [05 §1](./05-android-in-place-update.md#1-install-the-flutter-source-build) | App launches to onboarding |
| 2 | Enter each account/onboarding state that changes persisted data | [03 §2](./03-flutter-seed-packs.md#2-onboarding--account-states) | All states from §2 reached |
| 3 | Create the seed pack with the **exact** documented values, and record the baseline | [03 §3–§5](./03-flutter-seed-packs.md) | Baseline sheet `BASE-01…BASE-14` complete, screenshots taken |
| 4 | **Disable the network** (airplane mode) | [04 §2](./04-ios-in-place-update.md#2-cut-the-network) / [05 §2](./05-android-in-place-update.md#2-cut-the-network) | Airplane mode confirmed on-screen |
| 5 | Install the **React Native** build as an in-place store update. **Do not uninstall. Do not clear app data.** | [04 §3](./04-ios-in-place-update.md#3-install-the-react-native-build-in-place) / [05 §3](./05-android-in-place-update.md#3-install-the-react-native-build-in-place) | Exactly one TimeCalendar icon remains |
| 6 | Launch React Native **while still offline** | [06](./06-offline-and-online-verification-scenarios.md) | `OFF-01` passes |
| 7 | Verify every device-owned value survived **exactly once** and is usable | `OFF-02…OFF-19` | All offline scenarios recorded |
| 8 | Force-quit, relaunch, repeat the essential durability checks — still offline | [07](./07-failure-restart-and-recovery-scenarios.md) `REC-01…REC-03` | Durability scenarios recorded |
| 9 | **Restore the network** | — | Connectivity confirmed |
| 10 | Verify server-owned data refetches, and that sync neither removes migrated local content nor duplicates anything | `ON-01…ON-06`, `REC-05…REC-07` | All online scenarios recorded |
| 11 | Complete the report with pass/fail and evidence | [08](./08-qa-execution-report-template.md) | Report signed off |

### Step 5, spelled out because it is the step people get wrong

The update **must** go through the platform's normal update mechanism on top of the existing
install:

- ❌ Do **not** uninstall the Flutter app first.
- ❌ Do **not** "Clear data" / "Clear storage" (Android) or offload/delete the app (iOS).
- ❌ Do **not** install the RN build with a different app id, a different signing key, or via a
  sideloaded `.apk`/`.ipa` when a store/TestFlight path exists.
- ❌ Do **not** restore from a backup at any point during the run.
- ✅ Do let the store replace the binary under the existing sandbox.

If any of the above happens by accident, the pass is void. Uninstall everything and restart at
step 1.

## 7. Running both platforms

iOS and Android are **independent passes** with their own report. Data does not travel between
them, and the two platforms read Flutter's data from genuinely different places
(`NSUserDefaults` + the app Documents dir on iOS; the Android app data dir, backend still
unconfirmed — [Q-02](./09-open-engineering-questions.md#q-02--which-shared_preferences-backend-does-android-use)).
A pass on one says nothing about the other.

Run the compact pack `SEED-A` on both. Run the large pack `SEED-B` on at least one platform per
release, and prefer Android (the lower-powered target for `OFF-19`).

## 8. Time budget

Rough, for planning only:

| Phase | `SEED-A` | `SEED-B` |
| --- | --- | --- |
| Steps 1–3 (Flutter install + seeding + baseline) | 45–60 min | 2.5–4 h |
| Steps 4–8 (update + offline verification + restarts) | 60–75 min | 90–120 min |
| Steps 9–11 (online verification + report) | 30–45 min | 45–60 min |
| **Total, one platform** | **~2.5 h** | **~5–7 h** |

`SEED-B` seeding is the expensive part and it is manual data entry; budget it honestly or it gets
silently truncated, which is precisely the failure mode `OFF-19` exists to catch.

---

← [Section index](./README.md) · next: [02 — Persisted data inventory](./02-persisted-data-inventory.md)
