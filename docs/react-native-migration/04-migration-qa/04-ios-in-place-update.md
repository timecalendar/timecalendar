# 04 — iOS in-place update execution

← [03 — Flutter seed packs](./03-flutter-seed-packs.md) · [Section index](./README.md) · next: [05 — Android in-place update](./05-android-in-place-update.md)

> Steps `MIG-IOS-01` … `MIG-IOS-09`. This document covers **installing the Flutter source build,
> cutting the network, and replacing the binary in place** on iOS. The verification that follows
> lives in [06](./06-offline-and-online-verification-scenarios.md).

---

## Why the container survives

An App Store / TestFlight update keeps the **same application container** as long as the bundle
identifier is unchanged. Both apps use `fr.samuelprak.timecalendar`
([01 §3](./01-scope-prerequisites-and-execution-order.md#3-builds)), so after the update:

- `<container>/Documents/simple_database.db` — the Flutter sembast file — is still on disk.
- `<container>/Library/Preferences/fr.samuelprak.timecalendar.plist` — the `flutter.`-prefixed
  preferences — are still there.

Both were confirmed on a real device
([`../00-exploration/data-persistence-migration.md` §6](../00-exploration/data-persistence-migration.md#6-device-verification-done)).
The data being physically present is *not* the thing under test — reading it is. That is why the
network must be off before the swap.

---

## 1. Install the Flutter source build

### `MIG-IOS-01` — Start from a clean container

1. If TimeCalendar is installed, **delete it** (long-press → Remove App → Delete App). This is the
   only permitted wipe in the whole run, and it happens *before* the Flutter install.
2. Settings → General → iPhone Storage → confirm TimeCalendar is gone.
3. Confirm ≥ 2 GB free and battery > 50 %.

### `MIG-IOS-02` — Install from the App Store

1. Open the **App Store**, search TimeCalendar, install the released build.
2. **Do not** install a TestFlight build at this step. If TestFlight already holds a TimeCalendar
   build, that is fine — just don't install it yet.
3. Launch. Confirm **Profil → À propos** shows the released Flutter version (expected
   `3.1.0`; record the actual).

> If your Apple ID is in the TestFlight internal group, TestFlight may show the RN build as
> available. Ignore it until `MIG-IOS-05`.

### `MIG-IOS-03` — Seed and baseline

Execute [03 — Flutter seed packs](./03-flutter-seed-packs.md) in full for the pack you are
running, and complete the baseline record sheet. **Do not proceed with an incomplete baseline.**

---

## 2. Cut the network

### `MIG-IOS-04` — Airplane mode

1. Control Centre → **Airplane mode ON**.
2. Settings → **Wi-Fi OFF** as well (airplane mode alone can leave Wi-Fi enabled if it was on
   before, and iOS remembers that).
3. Verify: open Safari and try to load any page. It must fail.

**Screenshot the Settings screen showing airplane mode on and Wi-Fi off.** This screenshot is the
evidence that the offline scenarios were genuinely offline; without it, `OFF-02` and friends are
unfalsifiable.

> ❗ You cannot install from TestFlight while offline. The next step is the exception — see
> `MIG-IOS-05`.

---

## 3. Install the React Native build in place

TestFlight requires a network connection to download. That is unavoidable, so the sequence is:
**download while briefly online, install, then go offline again before first launch.** The
property being protected is that *the RN app has never had network access* — not that the download
happened offline.

### `MIG-IOS-05` — Download the RN build

1. Airplane mode **OFF** briefly.
2. Open **TestFlight** → TimeCalendar → **Update**.
3. **Do not launch the app from TestFlight** when the install finishes. TestFlight's button turns
   into "Open" — do not press it.
4. Wait for the install to finish (the home-screen icon stops showing the progress ring).

> ⚠️ Do **not** let the Flutter app run during this window either. If iOS or you launch it, it may
> sync and change the baseline. If the Flutter app is launched at any point after the baseline was
> recorded, re-verify the baseline before continuing.

**Alternative — App Store path.** If the RN build has been released to the App Store rather than
TestFlight, use App Store → Updates → Update instead. Everything else is identical. Record which
path you used.

### `MIG-IOS-06` — Confirm it is an update, not a second app

Look at the home screen. There must be **exactly one** TimeCalendar icon.

- Two icons ⇒ the RN build is the `.dev` variant (`fr.samuelprak.timecalendar.dev`) and installed
  side-by-side. **The run is void** — precondition
  [B-1](./01-scope-prerequisites-and-execution-order.md#b-1--same-store-identity) failed. Get a
  production-identity build and restart at `MIG-IOS-01`.

**Screenshot the home screen.**

### `MIG-IOS-07` — Go offline again, before first launch

1. Airplane mode **ON**, Wi-Fi **OFF**.
2. Verify with Safari as in `MIG-IOS-04`.
3. **Screenshot.**

The app has now been replaced in place and has never been launched with network access. This is
the state every `OFF-*` scenario assumes.

---

## 4. First launch

### `MIG-IOS-08` — Launch React Native, offline

1. Tap the TimeCalendar icon.
2. **Start a screen recording** if your device supports it — the first launch is the only chance
   to capture a one-shot behaviour like the changelog sheet (`OFF-11`) or a migration progress
   indicator.
3. Do not tap anything until the app has settled.

Proceed to [06 — Offline verification](./06-offline-and-online-verification-scenarios.md),
starting at `OFF-01`.

### `MIG-IOS-09` — Restoring the network, later

When the offline scenarios and `REC-01`…`REC-03` are complete:

1. Airplane mode **OFF**, Wi-Fi **ON**.
2. Confirm connectivity in Safari.
3. Note the wall-clock time — `ON-01` measures how long the first sync takes to populate the
   calendar, informally.

Proceed to the `ON-*` scenarios.

---

## 5. Collecting iOS evidence

iOS gives QA much less filesystem access than Android. Use what is available and escalate the rest.

### Always available

- **Screenshots and screen recordings.** The primary evidence for every scenario.
- **Settings → General → iPhone Storage → TimeCalendar → Documents & Data size.** A rough but
  useful signal: after a successful import the app's data size should be *larger* than a fresh
  install's, because both the new SQLite database and the retained legacy sembast file are present
  ([D-28](./02-persisted-data-inventory.md#d-28)). Record the number before and after the update.
- **Version confirmation.** **Réglages → À propos** in the RN app must show `4.x`.

### Available with a Mac

If a Mac with Xcode is available and the build is a development-signed one:

- **Xcode → Window → Devices and Simulators → select the device → Installed Apps → TimeCalendar →
  ⚙ → Download Container…** produces a `.xcappdata` bundle. Right-click → Show Package Contents →
  `AppData/Documents/` should contain both `simple_database.db` (the retained Flutter file) and
  `timecalendar.db` (the RN SQLite database).
- This is the definitive evidence for `REC-04` and for any "did the importer even see the file?"
  question.

> **Container download does not work for App Store / TestFlight distribution-signed builds.** If
> it is unavailable, record `REC-04` as **"not verifiable on this build"** and note
> [Q-11](./09-open-engineering-questions.md#q-11--is-the-one-release-sembast-safety-net-implemented).
> Do not mark it `FAIL` — you could not observe it.

### Crash evidence

- Settings → Privacy & Security → Analytics & Improvements → **Analytics Data** → look for
  `TimeCalendar-*.ips` entries with a timestamp matching first launch. Share any that appear.
- Crashlytics will also receive them once the device is back online, but the local file is
  immediate and is the artefact to attach to a failure row.

---

## 6. What to do when something goes wrong mid-run

| Situation | Action |
| --- | --- |
| Two app icons after the update | Run void ([B-1](./01-scope-prerequisites-and-execution-order.md#b-1--same-store-identity)). Restart at `MIG-IOS-01` with a production-identity build. |
| You launched the Flutter app after recording the baseline | Re-verify the baseline sheet, then continue. Note it in the report. |
| The app was launched online before `OFF-01` | The offline scenarios are compromised — a sync may have repopulated data. **The pass is void.** Restart at `MIG-IOS-01`. |
| The RN app crashes on first launch | This *is* a result. Record it as `OFF-01` `FAIL` with the `.ips` file, then continue to `REC-02` (relaunch after a crash) — the retry behaviour is exactly what `REC-02` exists to check. |
| iOS restored the app from an iCloud backup | Run void. Disable iCloud app backup for TimeCalendar and restart. |

---

← [03 — Flutter seed packs](./03-flutter-seed-packs.md) · [Section index](./README.md) · next: [05 — Android in-place update](./05-android-in-place-update.md)
