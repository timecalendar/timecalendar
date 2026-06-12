# TimeCalendar

TimeCalendar mobile app

## Development setup

### Flutter

To start working on the TimeCalendar app, you must first install [Flutter](https://docs.flutter.dev/get-started/install). Select your operating system, and follow the instructions to install the Flutter SDK, and the Android or/and iOS setup.

This project needs a Flutter SDK providing Dart `>=3.9.0` (e.g. Flutter 3.44+).

#### iOS build prerequisites (gotchas)

The iOS build has two requirements that aren't obvious and will fail the build if missing:

1. **Disable Swift Package Manager.** Recent Flutter enables SPM by default, which breaks the Firebase Crashlytics build phase (`upload-symbols: No such file or directory`). This project builds via CocoaPods:
   ```bash
   flutter config --no-enable-swift-package-manager
   ```
2. **Install the FlutterFire CLI.** A Runner build phase calls `flutterfire` on every build (even for the shared dev Firebase account). Install it and make sure `~/.pub-cache/bin` is on your `PATH`:
   ```bash
   dart pub global activate flutterfire_cli
   export PATH="$PATH:$HOME/.pub-cache/bin"   # add to your shell profile
   ```

If a build fails after changing iOS config, run `flutter clean` and delete `ios/Pods`, `ios/Podfile.lock`, and `~/Library/Developer/Xcode/DerivedData/Runner-*` before retrying.

### Firebase

You first need a Firebase account and project setup. You can either use the private development Firebase account or create your own. If you are using the private development account, skip this step.

If you don't have one yet, refer to the API server [README](../README.md) to create your own Firebase application and database.

Install the [Firebase CLI](https://firebase.google.com/docs/cli). Select your operating system, and follow the instructions to install the Firebase CLI.

Once the Firebase CLI is installed, login to Firebase by running this command:

```bash
firebase login
```

Next, install the FlutterFire CLI by running the following command:

```bash
dart pub global activate flutterfire_cli
```

You can now configure your application:

```bash
flutterfire configure
```

FlutterFire CLI created a file `lib/firebase_options.dart` with your custom Firebase configuration.

Next, on the [Firebase Console](https://console.firebase.google.com/), go into your Project settings > General, go in Your apps, and select your Android application in the left bar. Click on the download button `google-services.json` to download the file. Copy it in `android/app/google-services.json`.

### Local dev environment

The app talks to the local HTTPS dev env at `https://api.timecalendar.host:1443`
(nginx + a self-signed dev cert). Three things must be in place: the
`*.timecalendar.host` names mapped in `/etc/hosts`, `web/.env.local` created, and
the dev cert trusted by the iOS Simulator. Each one missing shows up as the same
opaque "Network Error" in the import webview, so set them all up at once from the
repo root:

```bash
npm run setup
```

This is idempotent and also verifies the API is reachable. Run it again any time
the app can't reach the backend — it tells you exactly which piece is broken.

> **Backend required first.** `npm run setup` checks the API but does not start
> it. Bring up the Docker stack, API server, and web server per the
> [root README](../README.md) (API on `:3005`, web on `:3006`).

After setup, the app uses this env by default — no `--dart-define` needed.

### Run the app

In a terminal, build code parts on change:

```bash
dart run build_runner watch
```

Then run the app from your IDE, or:

```bash
flutter run
```

## Build on Android

Copy the file `app/android/key.properties.sample` into `app/android/key.properties`.

## Release to Stores

### Android (Play Store)
```bash
cd android
fastlane release_play_store build_number:137
```

### iOS (App Store)
```bash
cd ios
fastlane release_app_store build_number:137
```

Use the latest build number for each release.
