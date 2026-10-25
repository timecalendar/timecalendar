# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Release status — read first

The React Native app in `mobile/` is **not in production**. It is a new application being built
to replace the live Flutter app (v3) at the v4 cutover. No user runs a React Native build.

Consequences for every decision:

- There are no installed React Native binaries to keep compatible. A native dependency or an EAS
  fingerprint change costs nothing until the first public release; never argue against a change
  because it "needs a new store build" or "breaks OTA compatibility".
- Store, TestFlight and Play internal uploads are previews for the team, not releases.
- Production users, crash rates and live data belong to the Flutter app. Parity with Flutter is
  the bar; Flutter's behavior is the reference, not a legacy to preserve.
