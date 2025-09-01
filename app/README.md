# TimeCalendar

TimeCalendar mobile app

## Development setup

### Flutter

To start working on the TimeCalendar app, you must first install [Flutter](https://docs.flutter.dev/get-started/install). Select your operating system, and follow the instructions to install the Flutter SDK, and the Android or/and iOS setup.

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

### Environment variables

This project uses Flutter's `--dart-define` for environment configuration.

**For local development with simulator/emulator:**
```bash
flutter run --dart-define=MAIN_API_URL=http://localhost:3005 \
            --dart-define=MAIN_WEB_URL=http://localhost:3000
```

**For local development on real device:**
Get the local IP address of your computer running the API server, then run:
```bash
flutter run --dart-define=MAIN_API_URL=http://YOUR_LOCAL_IP:3005 \
            --dart-define=MAIN_WEB_URL=http://YOUR_LOCAL_IP:3000
```
Replace `YOUR_LOCAL_IP` with your computer's network IP (e.g. `192.168.0.10`).


### Run the app

In a terminal, run the following command to build code parts when the code changes:

```bash
dart run build_runner watch
```

Run the app from your IDE.

### Add certificates

For the app to communicate with the local development server, you need to add the development certificate to your system's trusted certificates.

#### macOS

1. **For iOS Simulator**: Drag and drop the file `ci/certificates/cert.pem` into the simulator.
2. **For system-wide trust**: Double-click the `ci/certificates/cert.pem` file to add it to Keychain Access, then mark it as trusted for SSL.

#### Windows

1. Double-click the `ci/certificates/cert.pem` file.
2. Click "Install Certificate".
3. Choose "Local Machine" and click "Next".
4. Select "Place all certificates in the following store" and browse to "Trusted Root Certification Authorities".
5. Click "Next" and then "Finish".

#### Linux

Add the certificate to your system's certificate store:

```bash
sudo cp ci/certificates/cert.pem /usr/local/share/ca-certificates/timecalendar-dev.crt
sudo update-ca-certificates
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
