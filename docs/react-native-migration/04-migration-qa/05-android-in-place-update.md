# 05 — Android in-place update execution

← [04 — iOS in-place update](./04-ios-in-place-update.md) · [Section index](./README.md) · next: [06 — Offline & online verification](./06-offline-and-online-verification-scenarios.md)

> Steps `MIG-AND-01` … `MIG-AND-10`. Installing the Flutter source build, cutting the network,
> replacing the binary in place via Google Play, and collecting the storage evidence that iOS
> cannot give you.

---

## Why the data directory survives

A Play update keeps the same `/data/data/<applicationId>/` directory as long as the
`applicationId` is unchanged. Both apps use `fr.samuelprak.timecalendar`
([01 §3](./01-scope-prerequisites-and-execution-order.md#3-builds)), so the Flutter sembast file
and preferences remain on disk across the swap.

**Unlike iOS, this has not yet been confirmed on real Android hardware.** Two facts are open:

- Which `shared_preferences` backend the Flutter app writes to — the legacy XML
  (`shared_prefs/FlutterSharedPreferences.xml`) or the newer DataStore-backed one
  ([Q-02](./09-open-engineering-questions.md#q-02--which-shared_preferences-backend-does-android-use)).
- Where `getApplicationDocumentsDirectory()` puts `simple_database.db`, and that it survives the
  binary swap ([Q-03](./09-open-engineering-questions.md#q-03--where-does-sembast-live-on-android-and-does-it-survive-the-swap)).

Both come from [`../inbox/2026-06-15-android-storage-verification.md`](../inbox/2026-06-15-android-storage-verification.md).
**This playbook is the natural place to close them** — §6 below tells you exactly which commands
to run. Doing so is worth the five minutes even on a passing run.

## The signature rule

Google Play will only install an update over an existing app if it is signed by the **same** key.
The released Flutter app is signed via Play App Signing; an RN build signed with a different
upload key **will not install over it** — Play refuses with a signature-mismatch error, and
sideloading gives `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.

If you hit that error, it is precondition
[B-2](./01-scope-prerequisites-and-execution-order.md#b-2--same-signing-identity-android--same-apple-team-ios)
failing, not a migration defect. Stop and escalate to the release owner
([`../../mobile/releases/README.md`](../../mobile/releases/README.md)).

---

## 1. Install the Flutter source build

### `MIG-AND-01` — Start from a clean data directory

1. If TimeCalendar is installed: Settings → Apps → TimeCalendar → **Uninstall**. (Not just "Clear
   storage" — a full uninstall.) This is the only permitted wipe, and it happens *before* the
   Flutter install.
2. Confirm with `adb shell pm list packages | grep timecalendar` — no output expected.
3. Confirm ≥ 2 GB free and battery > 50 %.

### `MIG-AND-02` — Install from Google Play

1. Play Store → TimeCalendar → **Install**. It must be the published production listing.
2. Launch. Confirm **Profil → À propos** shows the released Flutter version (expected `3.1.0`;
   record the actual).
3. Record the installer: `adb shell pm list packages -i | grep timecalendar` — expect
   `installer=com.android.vending`. Anything else means it did not come from Play, and the update
   path you are about to test is not the real one.

### `MIG-AND-03` — Seed and baseline

Execute [03 — Flutter seed packs](./03-flutter-seed-packs.md) in full for the pack you are
running, and complete the baseline record sheet. **Do not proceed with an incomplete baseline.**

### `MIG-AND-04` — Capture the pre-update storage evidence (recommended)

Before cutting the network, capture what Flutter actually wrote. This is the reference the
importer will be judged against, and it closes
[Q-02](./09-open-engineering-questions.md#q-02--which-shared_preferences-backend-does-android-use)
and [Q-03](./09-open-engineering-questions.md#q-03--where-does-sembast-live-on-android-and-does-it-survive-the-swap).
See §6 for the commands.

> Requires a device on which `run-as` works for this package (i.e. a debuggable build) **or** root.
> A Play-installed production build is **not** debuggable, so `run-as` will fail with
> `run-as: package not debuggable`. That is expected. Record §6 as "not collectable on a
> production install" and move on — the run is still valid; it just carries less evidence.
> If you have a rooted test device or an emulator image with a debuggable Flutter build, collect
> it there in a separate, dedicated pass.

---

## 2. Cut the network

### `MIG-AND-05` — Airplane mode

1. Quick settings → **Airplane mode ON**.
2. Confirm **Wi-Fi is also off** (many Android builds keep Wi-Fi on in airplane mode if it was on).
3. Verify: open Chrome and try to load any page. It must fail.
4. Optional hard confirmation: `adb shell dumpsys connectivity | head -20` should show no active
   network. (`adb` over USB keeps working — it is not a network route the app can use.)

**Screenshot the quick-settings panel showing airplane mode on and Wi-Fi off.**

---

## 3. Install the React Native build in place

Play requires network to download, so the sequence mirrors iOS: **download while briefly online,
then go offline again before first launch.** What matters is that the RN app has never had
network access, not that the download was offline.

### `MIG-AND-06` — Download the RN build

1. Airplane mode **OFF** briefly.
2. Play Store → TimeCalendar → **Update**. (For a closed/internal test track, join the track from
   its opt-in link first, then the update appears in the same place.)
3. **Do not press "Open"** when it finishes.
4. Wait for the install to complete.

> ⚠️ Do not let the Flutter app run during this window. If it launches, it may sync and change the
> baseline — re-verify the baseline before continuing.

**Sideload fallback.** If no Play track is available, `adb install -r <apk>` performs an in-place
update *only if* the APK is signed with the same key (see [the signature rule](#the-signature-rule)).
Never use `adb install -r -d` with a downgrade, and never pass `adb uninstall` first. Record in
the report that the sideload path was used instead of Play, because it is not the path real
students take.

### `MIG-AND-07` — Confirm it is an update, not a second app

1. Check the launcher: **exactly one** TimeCalendar icon.
2. Confirm with `adb`:

   ```sh
   adb shell pm list packages | grep timecalendar
   ```

   Expect exactly one line, `package:fr.samuelprak.timecalendar`. If you also see
   `fr.samuelprak.timecalendar.dev`, the RN build is the development variant and installed
   side-by-side — **the run is void**
   ([B-1](./01-scope-prerequisites-and-execution-order.md#b-1--same-store-identity)).
3. Confirm the version rolled forward:

   ```sh
   adb shell dumpsys package fr.samuelprak.timecalendar | grep -E "versionName|versionCode|firstInstallTime|lastUpdateTime"
   ```

   `versionName` must now be `4.x`. **`firstInstallTime` must be unchanged from before the update**
   — a changed `firstInstallTime` means the app was reinstalled rather than updated, and the run
   is void.

**Screenshot / save the `dumpsys` output.** The unchanged `firstInstallTime` is the single
strongest piece of evidence that this really was an in-place update.

### `MIG-AND-08` — Go offline again, before first launch

1. Airplane mode **ON**, Wi-Fi **OFF**.
2. Verify in Chrome.
3. **Screenshot.**

---

## 4. First launch

### `MIG-AND-09` — Launch React Native, offline

1. Start capturing logs **before** you tap the icon:

   ```sh
   adb logcat -c
   adb logcat > migration-first-launch.log
   ```

2. Tap the TimeCalendar icon. Start a screen recording if you can
   (`adb shell screenrecord /sdcard/first-launch.mp4`).
3. Do not tap anything until the app has settled.
4. Stop the logcat capture once the app is idle, and attach `migration-first-launch.log` to the
   report regardless of the outcome. A clean run's log is as useful as a failing one — it is the
   baseline for the next release.

Proceed to [06 — Offline verification](./06-offline-and-online-verification-scenarios.md),
starting at `OFF-01`.

### `MIG-AND-10` — Restoring the network, later

When the offline scenarios and `REC-01`…`REC-03` are complete:

1. Airplane mode **OFF**, Wi-Fi **ON**.
2. Confirm connectivity in Chrome.
3. Note the wall-clock time — `ON-01` informally measures how long the first sync takes.

---

## 5. Android-specific traps

| Trap | Why it matters | What to do |
| --- | --- | --- |
| **Auto Backup / Backup & Restore** | Android may restore app data from a cloud backup on install, which would populate the RN app from a backup rather than from the migration. | Before `MIG-AND-01`, turn off Settings → Google → Backup for the test account, or at least confirm no restore prompt appears during `MIG-AND-06`. If a restore happened, the run is void. |
| **Battery optimisation / aggressive OEM killers** | Some OEM builds kill an app seconds after launch, which can abort an in-progress import and look like data loss. | Settings → Apps → TimeCalendar → Battery → **Unrestricted**. Do this *before* first launch. Note that you did. |
| **"Clear storage" muscle memory** | Wipes exactly what is under test. | Never touch it during a run. If you do, the run is void. |
| **Play instant rollback** | If a track has both a newer and older build, Play can serve the wrong one. | Confirm `versionName` in `MIG-AND-07` before launching. |
| **Multiple user profiles / work profile** | The Flutter app and the RN update can end up in different profiles. | Do the whole run as the device owner, in one profile. |

---

## 6. Collecting storage evidence

These commands answer the open Android questions and produce the evidence a failure row needs.
Run the "before" set at `MIG-AND-04` and the "after" set once the offline scenarios are done.

> **All of them require `run-as` to work**, i.e. a debuggable build, or a rooted device / emulator.
> On a Play-installed production build they will fail with `run-as: package not debuggable`. That
> is expected and is not a test failure — record "not collectable on a production install".

### Before the update (Flutter installed)

```sh
# Which shared_preferences backend? (Q-02)
adb shell run-as fr.samuelprak.timecalendar ls -la shared_prefs/
adb shell run-as fr.samuelprak.timecalendar ls -la files/datastore/ 2>/dev/null

# Dump the legacy XML if it exists — expect flutter.-prefixed keys
adb shell run-as fr.samuelprak.timecalendar cat shared_prefs/FlutterSharedPreferences.xml

# Where is the sembast file? (Q-03)
adb shell run-as fr.samuelprak.timecalendar find . -name 'simple_database.db'

# Its size and first lines — expect JSONL, first line {"version":3,"sembast":1}
adb shell run-as fr.samuelprak.timecalendar ls -la app_flutter/simple_database.db
adb shell run-as fr.samuelprak.timecalendar head -3 app_flutter/simple_database.db
```

Adjust the path in the last two commands to whatever `find` reported.

### After the update (React Native installed)

```sh
# The Flutter sembast file must still exist — the one-release safety net (D-28 / REC-04)
adb shell run-as fr.samuelprak.timecalendar find . -name 'simple_database.db'

# The RN SQLite database must now exist
adb shell run-as fr.samuelprak.timecalendar find . -name 'timecalendar.db'

# The MMKV store (hidden events, preferences, changelog seen-version)
adb shell run-as fr.samuelprak.timecalendar ls -la files/mmkv/ 2>/dev/null

# Row counts, if sqlite3 is available on the device
adb shell run-as fr.samuelprak.timecalendar sqlite3 <path>/timecalendar.db \
  "select 'personal_events', count(*) from personal_events
   union all select 'user_calendars', count(*) from user_calendars
   union all select 'checklist_items', count(*) from checklist_items
   union all select 'calendar_events', count(*) from calendar_events;"
```

The row counts are the fastest way to distinguish *"the import dropped records"* from *"the UI is
not showing records that are there"* — two very different bugs that look identical on screen.
If `sqlite3` is not on the device, pull the file instead:

```sh
adb shell run-as fr.samuelprak.timecalendar cat <path>/timecalendar.db > timecalendar.db
```

and inspect it on your workstation.

### Table and column reference

For reading the pulled database, the table and column names are in `mobile/src/db/schema.ts`:
`personal_events`, `user_calendars`, `calendar_events`, `checklist_items`. Column names are
snake_case (`starts_at`, `event_uid`, `is_checked`, `school_name`, …).

---

## 7. What to do when something goes wrong mid-run

| Situation | Action |
| --- | --- |
| Play refuses the update with a signature error | [B-2](./01-scope-prerequisites-and-execution-order.md#b-2--same-signing-identity-android--same-apple-team-ios) failed. Escalate to the release owner; do not sideload around it. |
| Two packages listed in `MIG-AND-07` | [B-1](./01-scope-prerequisites-and-execution-order.md#b-1--same-store-identity) failed — a `.dev` build. Run void. |
| `firstInstallTime` changed | It was a reinstall, not an update. Run void. |
| A backup restore prompt appeared | Run void. Disable backup and restart at `MIG-AND-01`. |
| The RN app crashes on first launch | That is a result. Record `OFF-01` `FAIL` with the logcat, then continue to `REC-02` — retry behaviour after a crash is exactly what it checks. |
| The app was launched online before `OFF-01` | The offline scenarios are compromised. **The pass is void.** Restart at `MIG-AND-01`. |

---

← [04 — iOS in-place update](./04-ios-in-place-update.md) · [Section index](./README.md) · next: [06 — Offline & online verification](./06-offline-and-online-verification-scenarios.md)
