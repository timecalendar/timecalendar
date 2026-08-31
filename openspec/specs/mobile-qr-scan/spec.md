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

On a successful scan the screen SHALL parse the value once under synchronous single-scan exclusion,
then persist a durable calendar through the shared add-calendar seam, passing the institution and
programme fields derived from the ephemeral import draft — exactly one of `schoolId` / `schoolName`
plus the normalized `name`. When the route is opened with no draft, it SHALL create with `name: ""`
and `schoolName: ""` rather than redirecting, blocking, or crashing. A valid parsed attempt SHALL
remain excluded from camera callbacks while its request is in flight and while its failure UI is
displayed. On success the screen SHALL clear the draft and leave the import journey exactly once;
on failure it SHALL leave the draft and captured normalized URL available for deliberate recovery.
The screen SHALL NOT gain a failure-reporting payload: the iCal-URL screen's existing Report path
remains the single support surface.

#### Scenario: Single successful scan creates with the draft's metadata

- **WHEN** a QR code is scanned and parses to a valid source while a draft exists
- **THEN** the screen handles exactly one scan result and ignores further camera callbacks during the operation
- **AND** the create request carries the captured normalized URL, normalized `name`, and exactly one of `schoolId` / `schoolName`
- **AND** the draft is cleared and the import journey is left exactly once

#### Scenario: A scan on a route opened with no draft still works

- **WHEN** the QR route is opened directly with no draft and a valid code is scanned
- **THEN** the create request carries `name: ""` and `schoolName: ""`
- **AND** no redirect occurs and no missing-draft error is shown

#### Scenario: A failed valid import stays debounced and preserves context

- **WHEN** creation, token resolution, or the durable upsert rejects after a valid scan
- **THEN** the accessible failure state is shown and camera callbacks remain ignored
- **AND** the captured normalized URL and institution/programme draft remain unchanged
- **AND** neither the draft nor the import journey is cleared or left

#### Scenario: Retry reuses the captured attempt without another scan

- **WHEN** the student activates Retry after a rejected valid import
- **THEN** the shared add-calendar seam runs once with the captured normalized URL and preserved create fields
- **AND** aiming the camera again is not required
- **AND** rapid camera callbacks, repeated Retry taps, or their combination do not start a concurrent duplicate request

#### Scenario: Retry can fail again or complete through the shared success seam

- **WHEN** a retried attempt rejects
- **THEN** the same deliberate recovery actions remain available with the captured attempt and draft intact
- **WHEN** a retried attempt succeeds
- **THEN** the draft is cleared and the import journey is left exactly once

#### Scenario: Scan another QR deliberately re-arms the camera

- **WHEN** the student activates Scan another QR after a rejected valid import
- **THEN** the failure and captured attempt are cleared and the scanner accepts one new camera result
- **AND** a new valid result runs through the existing shared add-calendar seam

#### Scenario: Manual iCal remains available after failure

- **WHEN** the student chooses the manual iCal action from the QR failure state
- **THEN** the app pushes the existing `/onboarding/ical-url` route without clearing the import draft
- **AND** no QR URL, token, or private attempt state is placed in navigation parameters

#### Scenario: Non-calendar QR is recoverable

- **WHEN** a scanned code parses to `null`
- **THEN** the screen shows an accessible "not a calendar QR" message and re-arms for another scan
- **AND** this recoverable state is NOT recorded as an error

#### Scenario: Back navigation and unmount ignore late settlement

- **WHEN** the screen unmounts before an active add-calendar promise settles
- **THEN** a late success or rejection does not navigate, clear the draft, record an error, or update screen state

#### Scenario: No new camera or permission configuration

- **WHEN** the change is inspected for native configuration
- **THEN** the existing camera-permission lifecycle is reused unchanged
- **AND** no new native permission entry or `app.config.ts` change is added

### Requirement: Scan failure observability

Every rejected valid-QR create/resolve/persist attempt SHALL be recorded exactly once through the
`@/firebase` `recordUnknownError` seam with the constant `calendar-sources/qr-scan` context and
surfaced as an accessible failure state. Calendar URLs, tokens, draft fields, or other private
attempt data SHALL NOT be included in logs, error metadata, navigation parameters, screenshots, or
test output. Invalid/non-calendar QR values SHALL remain unrecorded recoverable noise, and the app
SHALL NOT import `@react-native-firebase/*` directly.

#### Scenario: Initial valid attempt rejection is recorded once

- **WHEN** the shared add-calendar operation rejects after a valid scan
- **THEN** that rejection is recorded exactly once with the constant QR-scan context
- **AND** the accessible failure state and recovery actions are shown

#### Scenario: A rejected retry is a distinct real attempt

- **WHEN** the student deliberately retries and that add-calendar invocation rejects
- **THEN** the retry rejection is recorded exactly once
- **AND** duplicate taps that never enter the add-calendar seam create no additional record

#### Scenario: Private import identity is not exposed

- **WHEN** an initial attempt or retry is recorded or its failure UI is rendered
- **THEN** no calendar URL, token, or draft value is attached to the error or displayed to the student

#### Scenario: Invalid values are not recorded

- **WHEN** parsing rejects a non-calendar QR before the add-calendar operation
- **THEN** the scanner re-arms with recoverable guidance and records no operational error

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

The scan, failure, recovery, and success wiring SHALL be proven by a Jest/component test that mocks
`expo-camera`'s `CameraView` and `useCameraPermissions`, drives synthetic scanned values through the
real parser, and controls the shared add-calendar seam with deferred promises. The suite SHALL use
the repository's RNTL 14 asynchronous conventions. The on-device camera, navigation lifecycle, and
assistive-technology behavior SHALL be a recorded non-blocking physical-device verification.

#### Scenario: Synthetic scan drives the real wiring

- **WHEN** the proof test fires a synthetic `onBarcodeScanned` result through the mocked `CameraView`
- **THEN** the real parser runs and the normalized URL reaches the shared add-calendar seam
- **AND** the permission states are exercised through the mocked `useCameraPermissions`

#### Scenario: Failure recovery and concurrency are deterministic

- **WHEN** deferred add-calendar promises hold an attempt in flight or reject it
- **THEN** tests prove ignored callbacks while pending/failed, captured-URL Retry success and failure, Scan another re-arm, manual-route draft preservation, and rapid/double-tap exclusion
- **AND** tests assert one success exit/clear and one Firebase record per rejected invocation that actually ran

#### Scenario: Unmount safety is deterministic

- **WHEN** a component test unmounts the QR screen before a deferred attempt settles
- **THEN** late resolution and rejection produce no navigation, draft clearing, error record, or state-update warning

#### Scenario: On-device recovery check is recorded as manual

- **WHEN** the change is reviewed for camera lifecycle, E2E, accessibility, native correctness, and both-platform behavior
- **THEN** an inbox note tagged `(HUMAN: ...)` records retry success/failure, Scan another, Back/unmount, VoiceOver/TalkBack focus and announcement, Dynamic Type, touch targets, and iOS/Android physical-camera checks
- **AND** the change is not blocked on Maestro or a device run because the current harness cannot inject a scan and serves no parseable import endpoint

