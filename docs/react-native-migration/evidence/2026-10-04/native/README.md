# Native legacy source bridge and local rehearsal

Status: compiled bridges on both platforms read genuine Flutter fixtures after same-identity in-place replacement. Actual iOS SEED-B and OnePlus SEED-A imports settle successfully with exact SQLite/MMKV readbacks and unchanged source bytes/preferences.

The shipping bridge is `mobile/modules/legacy-migration-source`. Its exported
`getLegacyMigrationSource()` matches section 7 of the normative data migration spec.
It exposes the fixed database URI, byte length, modification time, and six independently
typed preference results. It has no write, deletion, directory-listing, arbitrary-key,
arbitrary-path, or raw-database operation. Other native application identities fail
with `INELIGIBLE_APPLICATION_ID` before storage access. Discovery failures carry only
`SOURCE_OPEN_FAILED`; preference failures have no exception messages or values.

Android discovers `app_flutter/simple_database.db` under the existing application data
root. Its read-only XML parser handles `FlutterSharedPreferences.xml` and gives an
existing `.bak` the same priority Android uses, without Android's recovery rename/delete.
Each allowlisted key is read independently, with a 1 MiB input bound and 256 KiB string
bound. Integers must have native `long` representation and fit JavaScript's safe range.
iOS uses Documents and the six prefixed standard UserDefaults objects, distinguishes
CFBoolean from numeric NSNumber, and contains per-key Objective-C exceptions.
Both reject source-file symlinks while permitting operating-system ancestor aliases.

File bytes are streamed by the engine through Expo FileSystem 56.0.11; native discovery
never reads the Sembast contents. `@noble/hashes` 1.8.0 supplies bounded incremental
SHA-256 to that engine. SHA-256 fingerprints stay local.

## Sources checked before implementation

- https://docs.expo.dev/versions/v56.0.0/
- https://docs.expo.dev/versions/v56.0.0/sdk/filesystem/
- https://docs.expo.dev/modules/get-started/
- https://docs.expo.dev/modules/module-api/
- `docs/react-native-migration/05-tech-specs/data-migration.md`
- Migration QA playbooks and `docs/projects/flutter-rn-data-migration` decisions/design.
- Flutter SimpleDatabase, preference provider, native identities, and actual model serializers.
- `mobile/AGENTS.md` and Architecture Book CNG/runtime contract.

## Build and test checkpoints

- Android production-identity full Debug app assembled on remote WSL; all five native
  JUnit tests pass (0 failed, 0 skipped). Final manifest inspection confirms the backup allowlist and absence of external-storage permissions.
- Swift host tests pass: 17 exact preference classification assertions plus missing-file,
  trusted ancestor alias, read-only retention, and source-file symlink rejection.
- Production CNG prebuild and CocoaPods resolution pass. Full iOS Debug simulator
  app build passes with the Swift/Objective-C bridge linked.
- Flutter fixture entrypoint passes `flutter analyze tool/migration_seed.dart`.
- Expo app configuration suite: 15 tests pass. Module JS/TS lint passes.
- Cross-platform npm clean install required two missing optional @emnapi lock entries;
  no existing package version was changed for that repair.
- Genuine Flutter SEED-A is installed on the dedicated simulator; see
  `../ios/seed-a-before.json` and `../ios/seed-a-flutter.png`.

The user requires **all Android compilation on `ssh pc`**, never on this MacBook Air.
Local Android builds were terminated by the coordinator at 17:01 UTC. No Android
compilation has been started locally since that instruction. iOS compilation is local
and serialized with two jobs, arm64 only. Both RN and Flutter SEED-A/SEED-B builds passed.

## Fixture and identity boundary

`app/tool/migration_seed.dart` is an alternate debug-only entrypoint. It uses the actual
Flutter models, Sembast database initializer, path_provider, and synchronous
shared_preferences writer. `MIGRATION_SEED=SEED-A` writes 1 calendar, 5 personal events,
5 checklist items, and 1 member in each hidden array. `SEED-B` writes 3, 60, 134, 21, and
6 respectively. Both write all six preserved and six deliberately dropped preferences.
Null optionals, local timestamps without a zone suffix, UTC event timestamps, Unicode,
false booleans, and a retained checklist deletion timestamp are represented.
The seed refuses existing nonfixture preferences/database and never initializes Firebase
or contacts a backend. The screen displays only synthetic fixture counts.

OnePlus serial `86fa07cc` initially had a nondebuggable Play production installation:
4.0.0 / 138, first installed 2023-09-06. It was preserved during inspection. The user then
explicitly authorized deleting that package's data for test fixtures, relayed by the
coordinator in `msg_e1f1ce5074b2` and confirmed after coordinator handle recovery.
The one authorized cleanup precedes fixture installation; no uninstall or clear occurs
between Flutter source and RN target within a rehearsal.

A fresh dedicated iOS 26.5 simulator was created:
`BED9EB3C-ABA1-497B-A39B-6C791392C11E` (TimeCalendar Migration 2026-10-04 A).
It contains no prior TimeCalendar installation. Argent is excluded.

Both binaries use `fr.samuelprak.timecalendar`. Local APK debug signing and simulator
replacement establish local sandbox compatibility only. They do not establish Play,
TestFlight, App Store, physical-iPhone data protection, backup/restore, or release-mode
performance gates. No production service deployment or store submission is authorized.

## Android backup disposition

The module-owned CNG plugin generates both pre-Android-12 backup rules and Android-12+
cloud/device-transfer rules. The allowlist includes `files/SQLite/` (including journal
and SQLite sidecars), `files/mmkv/`, `app_flutter/simple_database.db`, and
`shared_prefs/FlutterSharedPreferences.xml` plus its recovery backup. Native Firebase
installation/token files and other transient native state are outside the allowlist.
This follows Android's include-list semantics; physical backup/restore is still unproven.
No iOS protection/backup attributes are changed.

References: https://developer.android.com/identity/data/autobackup and
https://firebase.google.com/docs/cloud-messaging/troubleshooting.

Expo FileSystem contributes legacy external-storage permissions by default. Both
READ_EXTERNAL_STORAGE and WRITE_EXTERNAL_STORAGE are explicitly blocked in app config;
the bridge and engine use only the existing private sandbox.

The first remote RN attempt stalled on a Kotlin daemon loopback connection. Its
owned processes were stopped and the successful retry used `--no-daemon` and
`-Pkotlin.compiler.execution.strategy=in-process`. No shipping source workaround is used.

The pinned Flutter 3.44.2 migrator adds `android.builtInKotlin=false` and `android.newDsl=false` to its working tree during fixture compilation. These generated compatibility flags are not committed to the legacy app; the documented pinned Flutter build reproduces them.

## Executed migration proof

- OnePlus SEED-A: 1 calendar, 5 personal events, 5 checklist items, 1 hidden UID and
  1 hidden name. All baseline field/preference checks pass, migration is eligible,
  journal `SETTLED_SUCCESS` with attempt1, and original source/preferences match the baseline.
- iOS simulator SEED-B: 3 calendars, 60 personal events, 134 checklist items, 21 hidden
  UIDs and 6 hidden names. All baseline checks pass. The database is chmod0444 during
  native reading; source bytes and six typed preferences remain unchanged.
- The coordinator independently compared 1576 iOS source-to-SQL fields with zero
  mismatches, and independently inspected Android native readback/source retention.
- Both terminal reports reach the real local Nest controller/validator/repository through
  the shipping outbox. iOS report `7000d54a-612c-4726-bbb8-4e8fd82c1ecf` is delivered at
  17:52:11 UTC, Android `6c8eec01-f56f-4449-9a9a-838607f79a4e` at 17:57:21 UTC.
  Retry backoff remains authoritative. Receiver evidence excludes the calibration report.
- iOS actual Home pull-to-refresh with synthetic revisions1 and2 preserves imported rows
  and linked checklists; the shipping selector excludes hidden UIDs/names. Source retention
  is checked after sync. No calendar HTTP request reaches production.

The debug-only raw-bundle launcher retains shipping OTA signing but omits normal manifest
asset metadata. Android reports two empty-URL ExpoAsset download failures and some decorative
images are missing. This limits visual/release conclusions; migration/readback/UI operations
still execute. Expo Router needs explicit harness location `/` and routerRoot `src/app` on
both default and direct bundle requests. Hermes inspection works with exact loopback Origin,
Runtime.enable and Debugger.enable. These launcher fixes are isolated in the rehearsal scripts.

Android radio-off proof is distinct from iOS injected fetch failure. Native SDK and OTA/store
behavior are outside the harness proof. The synthetic iOS A sandbox is seeded and retained;
its target replacement has not been run. The core worker owns remaining iOS B edit/delete
verification after the 17:55 UTC coordinator-authorized handoff.

Android's second actual UI refresh also passes all18 checks with revision2 present.
The imported checklist0 was then unchecked through the Event screen. A controlled cold
restart retains that edit, all other datasets, the original successful journal attempt1,
and exactly one delivered report. The post-edit fixture-equality mismatch is intentional
and documented in `../android/seed-a-post-edit-restart.json`. Final source retention still
passes. The fixture app is stopped; original airplane0/Wi-Fi1/mobile1 settings are restored.

Native implementation is committed as `33ec327a`. Simulator artifact aggregate hashes use
the explicit algorithm recorded in `../ios/native-artifacts.json`, including Flutter A,
Flutter B and RN apps. These are local simulator/debug artifacts, not signed store releases.
