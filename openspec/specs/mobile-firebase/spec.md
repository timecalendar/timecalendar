# mobile-firebase Specification

## Purpose
Defines the React Native app's crash-reporting and analytics system: Crashlytics
and Analytics via `@react-native-firebase` (modular API, native auto-init), the
one-Firebase-project-per-environment mapping with variant-switched config files,
the iOS static-frameworks build requirement, the single `src/firebase/` wrapper
seam, the `__DEV__`-only verification surface, the debug-build crash-reporting
flag, and the boundary between the CI proof (wrapper drives the SDK) and the
manual on-device proof (an event and a crash actually arrive in the console).
## Requirements
### Requirement: Crashlytics and Analytics initialized on both platforms
The mobile app SHALL integrate `@react-native-firebase` Crashlytics and Analytics on iOS
and Android via Expo config plugins, so that the native Firebase default app initializes
automatically at launch from the bundled configuration. The app SHALL NOT require any
JavaScript initialization call to start Firebase.

#### Scenario: Firebase available after launch
- **WHEN** the app launches on a build whose `googleServicesFile` matches its app id
- **THEN** the native Firebase default app is initialized
- **AND** Analytics and Crashlytics can be used without any JS `initializeApp` call

#### Scenario: Native build requires static frameworks
- **WHEN** the iOS app is prebuilt and compiled
- **THEN** `expo-build-properties` is configured with `ios.useFrameworks: "static"` so the
  Firebase iOS SDK links correctly

### Requirement: One Firebase project per environment, selected by build variant
The app SHALL use a separate Firebase project per environment, selecting the configuration
by `APP_VARIANT`: the `development` variant (app id `fr.samuelprak.timecalendar.dev`) SHALL
use the `timecalendar-dev` project, and the production variant (app id
`fr.samuelprak.timecalendar`) SHALL use the `timecalendar-samuelprak` project. The
`googleServicesFile` paths SHALL switch accordingly in `app.config.ts`.

#### Scenario: Dev build uses the dev project
- **WHEN** the app is built with `APP_VARIANT=development`
- **THEN** the Android/iOS Firebase config files for `fr.samuelprak.timecalendar.dev`
  (registered in the `timecalendar-dev` project) are used
- **AND** dev crashes and events are reported to `timecalendar-dev`, not to production

#### Scenario: Production build uses the production project
- **WHEN** the app is built for production (`APP_VARIANT` unset/`production`)
- **THEN** the config files for `fr.samuelprak.timecalendar` (the `timecalendar-samuelprak`
  project, shared with the Flutter app) are used

### Requirement: Firebase accessed through a single wrapper seam
All application code SHALL access Crashlytics, Analytics, and Cloud Messaging through a single
`src/firebase/` module exposing the app's own helpers, rather than calling
`@react-native-firebase` directly at feature call sites, so the SDK is swappable behind one
seam. Each helper SHALL resolve the native instance lazily inside its body so importing
`@/firebase` never touches native code, with the single documented exception of the messaging
background-message handler, which MUST be registered at module init (RN harness constraint) and
is the only top-level native access permitted in the seam.

#### Scenario: Feature code does not import the SDK directly
- **WHEN** a screen or feature needs to log an event, record an error, request notification permission, or get the FCM token
- **THEN** it imports a helper from `@/firebase`
- **AND** it does not import `@react-native-firebase/*` directly

#### Scenario: Importing the seam does not touch native (background handler excepted)
- **WHEN** `@/firebase` is imported under Jest
- **THEN** the import succeeds without resolving native Crashlytics/Analytics/Messaging instances
- **AND** the only top-level native call is the messaging `setBackgroundMessageHandler` registration

### Requirement: Dev-only verification surface
The app SHALL provide a `__DEV__`-gated control surface that can log an Analytics event and
trigger a Crashlytics crash on demand, for verifying the end-to-end pipeline. This surface
SHALL NOT render in production builds, and its controls SHALL declare an accessibility role
and a translated accessibility label.

#### Scenario: Dev panel present only in development
- **WHEN** the app runs a development build
- **THEN** the Profile tab shows the Firebase debug controls
- **WHEN** the app runs a production build
- **THEN** the Firebase debug controls do not render

#### Scenario: Triggering verification actions
- **WHEN** the "log test event" control is activated
- **THEN** an Analytics event is logged through the `@/firebase` wrapper
- **WHEN** the "trigger test crash" control is activated
- **THEN** a native crash is forced through the `@/firebase` wrapper

### Requirement: Firebase wiring is verified by an automated test
The unit test suite SHALL include a test that drives the `@/firebase` wrapper and asserts it
calls the modular Crashlytics/Analytics SDK with the expected arguments, so the wiring is
proven in CI. (Confirming that an event or crash actually arrives in the Firebase console is
an explicitly manual, on-device step, not a CI gate.)

#### Scenario: Wrapper drives the SDK
- **WHEN** the proof test calls the wrapper's `logEvent`, `recordError`, and `crashTest`
- **THEN** the mocked modular Analytics/Crashlytics functions are called with the expected
  arguments

### Requirement: Crash reporting enabled in debug builds for verification
The project SHALL enable Crashlytics in debug builds (via `firebase.json`
`crashlytics_debug_enabled`) so a local development build can report a forced crash without
a release build.

#### Scenario: Debug build reports a crash
- **WHEN** a forced crash is triggered on a local debug development build
- **THEN** Crashlytics captures and (on next launch) uploads the crash report

### Requirement: Crashlytics identifies the running OTA bundle
At startup the app SHALL install Crashlytics custom keys `otaUpdateId`, `otaChannel`, `otaRuntimeVersion`, `otaCreatedAt`, and `otaIsEmbedded` once per JavaScript runtime. The values SHALL be derived from `useUpdates().currentlyRunning`, represented as strings, and use deterministic fallbacks: `"embedded"` for a missing update id, empty strings for a missing channel, runtime version, or creation time, ISO-8601 for a present creation time, and `String(isEmbeddedLaunch)` for the embedded flag.

#### Scenario: Downloaded update identity is attached
- **WHEN** the running update exposes an id, channel, runtime version, creation time, and `isEmbeddedLaunch: false`
- **THEN** all five corresponding Crashlytics keys carry those exact string values
- **AND** the creation time is serialized with `toISOString()`

#### Scenario: Embedded or development identity is deterministic
- **WHEN** Expo Updates omits update id, channel, runtime version, and creation time
- **THEN** `otaUpdateId` is `"embedded"`
- **AND** `otaChannel`, `otaRuntimeVersion`, and `otaCreatedAt` are empty strings
- **AND** `otaIsEmbedded` is the string form of Expo's `isEmbeddedLaunch` value

#### Scenario: Startup installation runs once per JavaScript runtime
- **WHEN** the OTA runtime component renders or remounts more than once in one JavaScript runtime
- **THEN** the five Crashlytics keys are installed only once

### Requirement: OTA Crashlytics attributes stay behind the Firebase seam
Application runtime and layout code SHALL set OTA Crashlytics keys through an owned `@/firebase` helper that delegates to the modular RNFirebase v24 `setAttributes(getCrashlytics(), attributes)` API. No feature, layout, or OTA runtime module SHALL import RNFirebase directly, and the existing top-level FCM background-message registration SHALL remain intact and Jest-safe.

#### Scenario: Firebase helper forwards all attributes
- **WHEN** the owned helper receives the five OTA string attributes
- **THEN** it resolves Crashlytics lazily and calls the modular `setAttributes` function with the native instance and complete attribute map

#### Scenario: Existing FCM registration is preserved
- **WHEN** `@/firebase` is imported under Jest after the attribute helper is added
- **THEN** `setBackgroundMessageHandler` is still registered exactly once
- **AND** the new Crashlytics helper does not run at module import

#### Scenario: Attribute installation rejection is bounded
- **WHEN** installing OTA attributes rejects
- **THEN** the error is recorded through `recordUnknownError` with the constant context `ota/attributes`
- **AND** the installation is not retried in that JavaScript runtime

### Requirement: Firebase records privacy-safe backend environment context

The app SHALL set the effective backend environment enum as a Crashlytics attribute through `@/firebase` after environment readiness resolves. After a successful confirmed switch, it SHALL emit one Analytics event with only `from_environment` and `to_environment` enum parameters. Cancellation and failed/partial resets SHALL NOT emit the successful-switch event. URLs, tokens, secrets, calendar/school identifiers, e-mail, and message content SHALL NOT be included.

#### Scenario: Runtime diagnostics identify preprod safely

- **WHEN** the app becomes ready with preprod effective
- **THEN** Crashlytics context identifies `preprod`
- **AND** it contains no endpoint or backend-bound user data

#### Scenario: Successful switch is recorded once

- **WHEN** a confirmed switch completes all reset participants and commits its target
- **THEN** one Analytics event records the from/to enum values
- **AND** cancellation or failure produces no successful-switch event

