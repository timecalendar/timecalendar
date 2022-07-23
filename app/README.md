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

Copy the file `.env.sample` to a new file named `.env`.

Get the local IP address of your computer running the API server. Add it in `MAIN_API_URL` (e.g. `http://192.168.0.10:3005`).

### Run the app

In a terminal, run the following command to build code parts when the code changes:

```bash
flutter pub run build_runner watch
```

Run the app from your IDE.

### Add certificates

On MacOS, drag and drop the file `ci/certificates/cert.pem` in the simulator.

## Build on Android

Copy the file `android/app/key.properties.sample` into `android/app/key.properties`.
