# mobile-fcm-messaging Specification

## Purpose
TBD - created by archiving change add-mobile-fcm-messaging. Update Purpose after archive.
## Requirements
### Requirement: FCM push received through the `@/firebase` seam
The mobile app SHALL integrate `@react-native-firebase/messaging` v24 (modular API) behind
the single `@/firebase` seam, so feature code reaches push messaging through the app's own
helpers and never imports `@react-native-firebase/messaging` directly. Importing `@/firebase`
SHALL NOT touch any native module (each helper resolves the native messaging instance lazily
inside its body), with the single documented exception of the background-message handler
registration (see "Background-message handler registered at module init").

#### Scenario: Feature code does not import the messaging SDK directly
- **WHEN** code needs to request notification permission, get the FCM token, or subscribe to messages
- **THEN** it imports a helper from `@/firebase`
- **AND** it does not import `@react-native-firebase/messaging` directly

#### Scenario: Importing the seam does not touch native
- **WHEN** the `@/firebase` module is imported under Jest (no native modules present)
- **THEN** the import succeeds without resolving any native messaging instance
- **AND** native messaging is resolved only when a helper is actually called (except the background handler)

### Requirement: Notification permission requested for both platforms
The seam SHALL expose a permission-request helper that requests notification authorization on
iOS (the `UNUserNotification` authorization prompt via `requestPermission`) and the Android 13+
runtime `POST_NOTIFICATIONS` permission, mirroring the Flutter app's `subscribe()`.

#### Scenario: Permission request drives the messaging API
- **WHEN** the permission helper is called
- **THEN** the messaging `requestPermission` is invoked through the seam

### Requirement: FCM token retrieved with the iOS APNS-token-first guard
The seam SHALL expose a token helper that, on iOS, obtains the APNS token **before** the FCM
token (`getAPNSToken` then `getToken`), mirroring the Flutter `getFcmToken`: when the APNS
token is not yet available on iOS the helper SHALL return `null` and SHALL NOT call `getToken`.
On Android the helper SHALL call `getToken` directly.

#### Scenario: iOS gets the APNS token before the FCM token
- **WHEN** the token helper runs on iOS and the APNS token is available
- **THEN** `getAPNSToken` is called before `getToken`
- **AND** the resolved FCM token is returned

#### Scenario: iOS returns null when APNS is not ready
- **WHEN** the token helper runs on iOS and `getAPNSToken` resolves to null
- **THEN** the helper returns null
- **AND** `getToken` is not called

#### Scenario: Android skips the APNS guard
- **WHEN** the token helper runs on Android
- **THEN** `getToken` is called without an APNS-token lookup

### Requirement: Foreground messages and token refresh are subscribable
The seam SHALL expose a foreground-message subscription (over messaging `onMessage`) and a
token-refresh subscription (over messaging `onTokenRefresh`); each SHALL accept a handler and
return an unsubscribe function.

#### Scenario: Foreground subscription drives onMessage
- **WHEN** a handler is registered via the foreground-message helper
- **THEN** messaging `onMessage` is subscribed with a function that forwards the message to the handler
- **AND** the helper returns an unsubscribe function

#### Scenario: Token-refresh subscription drives onTokenRefresh
- **WHEN** a handler is registered via the token-refresh helper
- **THEN** messaging `onTokenRefresh` is subscribed
- **AND** the helper returns an unsubscribe function

### Requirement: Background-message handler registered at module init
The seam SHALL register a top-level background-message handler via
`setBackgroundMessageHandler` at module initialization (not inside a React component), because
the RN messaging harness requires the background handler to be registered before the JS app
finishes booting. This is the single documented exception to the seam's no-native-on-import
posture and SHALL be the only top-level native access in the seam.

#### Scenario: Background handler registered when the seam loads
- **WHEN** the messaging seam module initializes
- **THEN** `setBackgroundMessageHandler` is called exactly once with a handler function

### Requirement: Messaging native dependency wired via config plugin and permissions
The app SHALL add `@react-native-firebase/messaging` v24 (matching the installed RNFB v24
`app`/`crashlytics`/`analytics`) as a config-plugin entry in `app.config.ts`, declare the iOS
push entitlement (`aps-environment`) and `UIBackgroundModes` `remote-notification`, and declare
the Android `POST_NOTIFICATIONS` permission. The dependency SHALL ride the existing iOS
`useFrameworks: "static"` set (no new `expo-build-properties`); `ios.forceStaticLinking` is the
documented escape if a pod breaks. This config is prebuild-verified (config-shape), not
source-verified.

#### Scenario: Plugin and native config present
- **WHEN** `app.config.ts` is evaluated
- **THEN** `@react-native-firebase/messaging` is listed in `plugins`
- **AND** the iOS `aps-environment` entitlement and `UIBackgroundModes` `remote-notification` are declared
- **AND** the Android `POST_NOTIFICATIONS` permission is declared

#### Scenario: Autolink verified by prebuild
- **WHEN** `npx expo prebuild --clean` runs
- **THEN** the messaging native module autolinks under the existing static-frameworks set

### Requirement: Messaging seam wiring proven in CI, real delivery is device-only
The unit test suite SHALL drive the messaging seam against mocked native messaging
(`jest/setup-firebase.ts`) and assert it calls `requestPermission`, `getAPNSToken`/`getToken`
(in the iOS APNS-first order), `onMessage`, `setBackgroundMessageHandler`, and `onTokenRefresh`
with the expected arguments. Confirming that a real push **arrives** (foreground/background/
killed, on a physical device, in a release build) is an explicitly manual, device-only step
recorded in an inbox handoff note — it SHALL NOT be a CI gate.

#### Scenario: Seam drives the messaging SDK
- **WHEN** the proof test calls the seam's permission, token, foreground, token-refresh, and (on load) background-handler paths
- **THEN** the mocked modular messaging functions are called with the expected arguments
- **AND** the iOS token path calls `getAPNSToken` before `getToken`

#### Scenario: Real delivery is not asserted in CI
- **WHEN** the test suite runs in CI
- **THEN** it does not assert that any real push notification was delivered or received on a device

