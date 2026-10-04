# Local fixture rehearsal commands

These commands apply only to synthetic fixtures. They are not store deployment commands.
All Android compilation runs inside WSL on `ssh pc`, never on the MacBook Air.

The source fixture entrypoint refuses nonfixture state and requires a debug build plus
an explicit seed pack. It uses the real Flutter models, Sembast, and shared_preferences.

## Flutter binaries

On the Mac, from `app/`, with no concurrent heavy native build:

```sh
flutter analyze tool/migration_seed.dart
flutter build ios --simulator --debug --config-only --target tool/migration_seed.dart --dart-define=MIGRATION_SEED=SEED-A
xcodebuild -workspace ios/Runner.xcworkspace -scheme Runner -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,id=BED9EB3C-ABA1-497B-A39B-6C791392C11E' -jobs 2 ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO BUILD_DIR="$PWD/build/ios" build
```

On remote WSL, from the isolated snapshot's `app/`:

```sh
export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export MIGRATION_SNAPSHOT_ROOT="$HOME/timecalendar-migration-20261004"
export PATH="$MIGRATION_SNAPSHOT_ROOT/tools/flutter/bin:/usr/bin:/bin"
flutter pub get
flutter build apk --debug --target tool/migration_seed.dart --dart-define=MIGRATION_SEED=SEED-A
```

Use `SEED-B` for the large source. A new fixture sandbox is required between packs;
never clear/uninstall between the source and target of the same pass.

## React Native binaries

From `mobile/`, set the production identity and production backend capability:

```sh
APP_VARIANT=production BACKEND_ENVIRONMENT_CAPABILITY=production OTA_CHANNEL=production npx expo prebuild --clean --no-install
```

Run this only in the environment for the relevant platform; on remote WSL add
`--platform android`, and on the Mac add `--platform ios` when regenerating one platform.
Generated projects remain CNG-owned.

For iOS, from `mobile/ios/`, run CocoaPods then a bounded simulator build:

```sh
APP_VARIANT=production BACKEND_ENVIRONMENT_CAPABILITY=production OTA_CHANNEL=production pod install
APP_VARIANT=production BACKEND_ENVIRONMENT_CAPABILITY=production OTA_CHANNEL=production xcodebuild -workspace TimeCalendar.xcworkspace -scheme TimeCalendar -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,id=BED9EB3C-ABA1-497B-A39B-6C791392C11E' -derivedDataPath /tmp/timecalendar-migration-rn-ios -jobs 2 ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO build
```

For Android, only in remote WSL, from the snapshot's `mobile/android/`:

```sh
APP_VARIANT=production BACKEND_ENVIRONMENT_CAPABILITY=production OTA_CHANNEL=production ./gradlew :legacy-migration-source:testDebugUnitTest :app:assembleDebug --no-daemon --max-workers=4 -Pkotlin.compiler.execution.strategy=in-process -PreactNativeArchitectures=arm64-v8a --init-script ../../rehearsal-version.gradle --console=plain
```

`rehearsal-version.gradle` is copied from this evidence directory into the snapshot root.
It sets this local target APK to build135, allowing source134 → target135 without a
version downgrade. Shipping EAS versions remain remotely managed.

Sign the synthetic Flutter APK using the generated RN debug keystore, then verify both
certificates before installing either artifact. This is a standard disposable debug
key, not a production upload or Play signing credential. Example inside the snapshot:

```sh
"$ANDROID_HOME/build-tools/36.0.0/apksigner" sign --ks mobile/android/app/debug.keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out artifacts/flutter-seed-a.apk app/build/app/outputs/flutter-apk/app-debug.apk
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --print-certs artifacts/flutter-seed-a.apk
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --print-certs mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## Read-only source evidence

From the repository root, after the seed screen confirms success:

```sh
python3 docs/react-native-migration/evidence/2026-10-04/native/capture-source.py ios BED9EB3C-ABA1-497B-A39B-6C791392C11E /tmp/ios-before.json
python3 docs/react-native-migration/evidence/2026-10-04/native/capture-source.py android 86fa07cc /tmp/android-before.json
```

After binary replacement, repeat with `--before` pointing to that platform's baseline.
The tool checks source bytes and typed allowlisted preferences without printing values.
It rejects sandboxes without this task's synthetic fixture marker.

The coordinator independently verified iOS SEED-A at 17:13 UTC: actual 3565-byte source
hash, 1/5/5/1 store counts, six exact native preference types, and fixture marker all
matched the recorded baseline (`msg_80285ae3c305`).

## Same-identity replacement

Run only after the fixture marker and source baseline have passed inspection. These
commands preserve the installed sandbox; neither uninstalls nor clears application data.

```sh
adb -s 86fa07cc shell am force-stop fr.samuelprak.timecalendar
adb -s 86fa07cc install -r /tmp/timecalendar-rn-migration-debug.apk
xcrun simctl terminate 4CADEE84-03D3-49ED-921E-29C728C7423F fr.samuelprak.timecalendar
xcrun simctl install 4CADEE84-03D3-49ED-921E-29C728C7423F /tmp/timecalendar-migration-rn-ios/Build/Products/Debug-iphonesimulator/TimeCalendar.app
```

## Local development transport

The production manifest requires the production OTA key, which remains outside this
machine. SDK56 dev-launcher also supports direct JavaScript bundles. Use that debug-only
path; no production private key, OTA request, or signing override is needed. The isolated
harness must normalize its initial router location to `/`, because the direct bundle path
would otherwise become an unmatched app route and never mount the root bootstrap.

From `mobile/`:

```sh
NODE_OPTIONS=--dns-result-order=ipv4first REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 APP_VARIANT=production OTA_CHANNEL=production BACKEND_ENVIRONMENT_CAPABILITY=production EXPO_OVERRIDE_METRO_CONFIG=./scripts/migration-rehearsal/metro.config.cjs npx expo start --dev-client --localhost --max-workers 1 --port 8086
adb -s 86fa07cc reverse tcp:8086 tcp:8086
adb -s 86fa07cc reverse tcp:8090 tcp:8090
```

Encode the complete bundle URL as the `url` query of
`timecalendar://expo-development-client/?url=...` (use `urllib.parse.quote(..., safe="")`).
The bundle URL is
`http://127.0.0.1:8086/scripts/migration-rehearsal/entry.bundle?platform=ios&dev=true&minify=false&transform.routerRoot=src%2Fapp&transform.engine=hermes&unstable_transformProfile=hermes-stable`;
use `platform=android` for OnePlus. Send it using `xcrun simctl openurl` or
`adb shell am start -a android.intent.action.VIEW -d` with the production package.

Native iOS controls are available through `idb ui describe-all --udid UUID --json`
and `idb ui tap --udid UUID x y`. The simulator CUA app identifier needs the full path
`/Applications/Xcode-26.6.0.app/Contents/Developer/Applications/Simulator.app` in this session.
Hermes targets appear at `http://127.0.0.1:8086/json/list`; inspector WebSocket requests
require a localhost Origin header. The fixture harness and real receiver commands are
specified in `mobile/scripts/migration-rehearsal/README.md`.

Android radio isolation uses `adb shell cmd connectivity airplane-mode enable`,
`adb shell svc wifi disable`, and `adb shell svc data disable`. Verify actual external
reachability fails, not just settings values (OnePlus retained mobile_data preference1).
After the run, restore airplane mode disabled, Wi-Fi enabled, and mobile data enabled.
The iOS offline pass uses injected fetch failure and must not be described as radio-off.

## Focused native checks

From the repository root, the Swift classification/discovery helper test executable:

```sh
swiftc mobile/modules/legacy-migration-source/ios/LegacyPreferences.swift mobile/modules/legacy-migration-source/ios/LegacyDatabaseSource.swift mobile/modules/legacy-migration-source/tests/main.swift -o /tmp/timecalendar-legacy-preference-tests
/tmp/timecalendar-legacy-preference-tests
```

Android JUnit and full app compilation use the remote Gradle command above. No Android
compiler is required on the Mac. All edited native test files were executed successfully.
For JS configuration, from mobile: `npx jest --runInBand app.config.test.ts` and
`npx eslint modules/legacy-migration-source/index.ts modules/legacy-migration-source/app.plugin.js app.config.ts`.

## Bounded inspector result capture

From the repo root, with the appropriate synthetic app running:

```sh
node docs/react-native-migration/evidence/2026-10-04/native/inspect-runtime.cjs OnePlus 'JSON.stringify({status:__migrationRehearsal.status(),snapshot:__migrationRehearsal.snapshot("SEED-A","after-sync")})' /tmp/android-readback.json
```

Use target `2026-10-04 B` and pack `SEED-B` for the large simulator. For baseline,
omit `"after-sync"`. The helper filters out replayed app console events and only writes
the requested CDP result. It accepts only this production application ID on loopback8086.
Use the harness's fixed controls documented in its README; do not evaluate source records.
The runtime uses a polyfilled Promise: an async operation can return a placeholder despite
`awaitPromise`. Invoke report delivery, then verify a subsequent synchronous snapshot and
server receipt; a returned Promise object is not evidence of completion.
