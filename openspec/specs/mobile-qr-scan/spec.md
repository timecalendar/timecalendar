# mobile-qr-scan Specification

## Purpose
TBD - created by archiving change add-mobile-qr-scan. Update Purpose after archive.
## Requirements
### Requirement: Camera dependency and native permission configuration

The mobile app SHALL use `expo-camera` (Expo SDK 56) as the camera and barcode-scanning
dependency, replacing the Flutter app's `mobile_scanner`. The native module SHALL autolink
under CNG, and `app.config.ts` SHALL declare an `["expo-camera", { … }]` `plugins` entry
carrying the iOS/Android camera permission strings.

#### Scenario: expo-camera is declared and links

- **WHEN** `mobile/package.json` is inspected
- **THEN** it declares `expo-camera` at the SDK-56-aligned version and the lockfile is consistent
- **AND** the camera native module autolinks (it is not added manually to the native projects)

#### Scenario: Camera permission strings are configured

- **WHEN** `mobile/app.config.ts` `plugins` is inspected
- **THEN** it contains an `expo-camera` entry with a `cameraPermission` usage description (iOS `NSCameraUsageDescription`)
- **AND** `recordAudioAndroid` is `false` (barcode scanning uses no microphone/audio)
- **AND** the entry links under the existing iOS `useFrameworks: "static"` set with no new `expo-build-properties` change

#### Scenario: Native config is prebuild-verified, not lint-verified

- **WHEN** the change is validated by `tsc`, lint, and Jest in CI
- **THEN** none of them reads the `plugins` permission strings (config-shape, R-1)
- **AND** the correctness of the native config is verified by a real `expo prebuild` / e2e build (the implementer/manual proof)

### Requirement: QR scanner screen with the camera-permission lifecycle

The app SHALL provide a QR scanner screen in the `calendar-sources` feature `ui/` sublayer,
reachable as an onboarding `Stack` sibling route, that drives the full camera-permission
lifecycle and renders a QR-only camera surface when granted.

#### Scenario: Permission undetermined

- **WHEN** camera permission has not yet been requested
- **THEN** the screen shows an explainer and a "grant camera access" control
- **AND** activating it calls `requestPermission()`

#### Scenario: Permission granted

- **WHEN** camera permission is granted
- **THEN** the screen renders `CameraView` configured to scan QR codes only (`barcodeScannerSettings.barcodeTypes` includes `"qr"`)
- **AND** the viewfinder carries an accessible label/hint describing the scan action

#### Scenario: Permission denied and cannot ask again

- **WHEN** camera permission is denied and cannot be requested again
- **THEN** the screen shows guidance to enable access in system settings and a control that opens the OS app settings

#### Scenario: Reachable from onboarding

- **WHEN** the onboarding flow is presented
- **THEN** the QR scanner is reachable as a `Stack` sibling route from an onboarding control (not a bare unreachable sibling)
- **AND** the route under `src/app/` is a thin re-export of the screen through the feature's `ui/` sub-barrel

### Requirement: Scanned value is parsed into a typed calendar source

The feature `data/` sublayer SHALL expose a pure function that turns a raw scanned QR string
into a typed `ScannedCalendarSource`, matching the Flutter wire format (the scanned value is a
calendar URL), and SHALL reject values that are not a calendar URL.

#### Scenario: Valid http(s) URL

- **WHEN** the parser receives an `http://` or `https://` URL string
- **THEN** it returns a `ScannedCalendarSource` carrying the trimmed URL

#### Scenario: webcal URL is normalized

- **WHEN** the parser receives a `webcal://…` URL
- **THEN** it returns a `ScannedCalendarSource` whose URL uses the `https://` scheme

#### Scenario: Empty or whitespace value

- **WHEN** the parser receives an empty or whitespace-only string
- **THEN** it returns `null` (no source)

#### Scenario: Non-URL value

- **WHEN** the parser receives a string that is not an http/https/webcal URL
- **THEN** it returns `null` so the screen can report that the code is not a calendar QR

#### Scenario: The parser is pure

- **WHEN** the parser is unit-tested
- **THEN** it requires no camera, no translation function, and no backend, and is covered to the 90% logic threshold

### Requirement: Scanned source handoff into app state

On a successful scan the screen SHALL parse the value once (single-scan debounce), hand the
resulting `ScannedCalendarSource` into ephemeral app state, and dismiss the scanner. Durable
persistence of the calendar token is out of scope (a later ship).

#### Scenario: Single successful scan

- **WHEN** a QR code is scanned and parses to a valid source
- **THEN** the screen handles exactly one scan result (further scans are ignored until re-armed)
- **AND** the parsed source is placed into ephemeral in-memory app state (not MMKV or SQLite)
- **AND** the scanner is dismissed and the scanned URL is confirmed to the user

#### Scenario: Non-calendar QR is recoverable

- **WHEN** a scanned code parses to `null`
- **THEN** the screen shows an accessible "not a calendar QR" message and re-arms for another scan
- **AND** this recoverable state is NOT recorded as an error

### Requirement: Scan failure observability

A crash-worthy failure of the scanning surface SHALL be recorded through the `@/firebase`
`recordError` seam and surfaced as an accessible failure state; the app SHALL NOT import
`@react-native-firebase/*` directly.

#### Scenario: Thrown failure is recorded

- **WHEN** an unexpected error is thrown during scanning or parsing
- **THEN** it is recorded via `@/firebase` `recordError` with a context breadcrumb
- **AND** an accessible failure state is shown to the user

### Requirement: Internationalization and accessibility

Every user-facing string on the scanner screen SHALL be translated (FR + EN, no hardcoded
strings), and interactive controls and async status SHALL be accessible.

#### Scenario: FR/EN parity

- **WHEN** the i18n catalogs are typechecked
- **THEN** every new key exists in both `en.json` and `fr.json` (bidirectional `tsc` parity)
- **AND** no user-facing string is hardcoded (the OS permission-dialog description in `app.config.ts` is a build-time config value, not a catalog string)

#### Scenario: Accessible controls and status

- **WHEN** the scanner screen renders any state
- **THEN** every touchable declares an accessibility role and a translated label with a ≥44pt/48dp target
- **AND** status/error text uses a polite live region with a status role

### Requirement: Wiring is proven in CI without a real camera

The scan→parse→state wiring SHALL be proven by a Jest/component test that mocks
`expo-camera`'s `CameraView` and `useCameraPermissions` suite-wide and drives a synthetic
scanned value through the real parser; the on-device camera behavior SHALL be a recorded
manual verification.

#### Scenario: Synthetic scan drives the real wiring

- **WHEN** the proof test fires a synthetic `onBarcodeScanned` result through the mocked `CameraView`
- **THEN** the real parser runs and the parsed source reaches app state
- **AND** the permission states are exercised through the mocked `useCameraPermissions`

#### Scenario: On-device camera check is recorded as manual

- **WHEN** the change is reviewed for the E2E / accessibility / native-correctness DoD axes
- **THEN** the manual on-device camera + permission verification is captured in an inbox note (the camera cannot be driven by Maestro)

