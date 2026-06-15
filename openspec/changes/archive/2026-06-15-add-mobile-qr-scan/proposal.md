## Why

Phase 03 ("Onboarding & calendar sources", roadmap step 3) needs the first **camera
input method** for adding a calendar: scanning a QR code. The Flutter app does this with
`mobile_scanner`; the mobile app has no camera dependency yet. This ship gets a scanned
value from camera into app state — the first of the three "add a calendar source" surfaces
(QR, iCal URL/file, durable token persistence) that share one feature cluster.

## What Changes

- Add **`expo-camera`** (SDK 56) as the camera/barcode-scanning dependency, replacing
  Flutter's `mobile_scanner`. New `plugins` entry in `app.config.ts` carrying the iOS/
  Android **camera permission strings**; the native module autolinks via CNG. Lockfile
  updated. (ADR **017**.)
- Create the repo's first **`src/features/calendar-sources/`** feature folder — the shared
  home for QR (this ship), iCal (ship 4), and durable token persistence (ship 5). This ship
  builds its `data/` (a pure, tested parser of the scanned string into a typed
  `ScannedCalendarSource`) and `ui/` (the scanner screen).
- A **QR scanner screen** at `src/features/calendar-sources/ui/qr-scan-screen.tsx`, reachable
  as an onboarding `Stack` sibling route (`src/app/onboarding/qr-scan.tsx`, a thin re-export)
  from a CTA on the welcome screen. Handles the camera-permission lifecycle (undetermined →
  request → granted/denied), renders `CameraView` (QR-only), debounces to a single scan, and
  parses the scanned value.
- A pure **token/URL parser** (`data/parse-source.ts`) that turns the raw QR string into a
  typed `ScannedCalendarSource` (the trimmed iCal URL + validity), matching the Flutter wire
  format (`QrCodeResult.url = barcode.rawValue`) — the seam ship 4 (`POST /calendars`) consumes
  and the Phase 09 importer must align with. 90%-gated.
- An **ephemeral in-memory handoff**: the parsed source is handed to a callback / route-param,
  not persisted (durable `user_calendars` token storage is ship 5). A scan/parse **failure**
  path records through the `@/firebase` `recordError` seam (this feature can fail, like
  personal-events writes).
- FR + EN i18n keys for every user-facing string (permission states, scan feedback, errors).
- A Jest/component proof of the scan→parse→state wiring (mock `expo-camera`'s `CameraView`
  + `useCameraPermissions` suite-wide; feed a synthetic scanned value). E2E **cannot** drive a
  real camera — the on-device camera check is an inbox/DoD manual note.
- Architecture Book updates: ADR 017 + index row, `runtime.md` (new native dep + plugin +
  permission strings), `features.md` (the calendar-sources feature), changelog entry.

## Capabilities

### New Capabilities
- `mobile-qr-scan`: scanning a QR code with `expo-camera`, the camera-permission lifecycle,
  parsing the scanned value into a typed calendar source, the ephemeral handoff into app
  state, and the scan-failure observability path.

### Modified Capabilities
<!-- None — this is a new, self-contained input surface. The onboarding route tree gains a
     sibling route, but the existing onboarding/school-selection spec requirements are
     unchanged. -->

## Impact

- **Dependencies:** `+ expo-camera` (`~56.0.x`) in `mobile/package.json`; lockfile regenerated.
- **Native config:** `mobile/app.config.ts` `plugins` gains an `["expo-camera", { … }]` entry
  with `cameraPermission` (iOS `NSCameraUsageDescription`) + `recordAudioAndroid: false`
  (no audio — barcode only); links under the existing iOS `useFrameworks: "static"`. Verified
  by a real `expo prebuild` / e2e (config-shape, not lint — R-1).
- **New code:** `src/features/calendar-sources/{data,ui}/` + barrels; `src/app/onboarding/qr-scan.tsx`
  (thin route) + a `<Stack.Screen>` registration; a welcome-screen CTA; a `jest/setup-expo-camera.ts`.
- **i18n:** new flat keys in `en.json` + `fr.json` (tsc-typed parity, both directions).
- **Tests:** new colocated Jest tests (parser at 90%, screen at the 70% floor); a Maestro note
  (camera can't be driven — manual).
- **Docs:** ADR 017, `decisions/README.md` index, `runtime.md`, `features.md`,
  `architecture-changelog.md`. One inbox note (on-device camera/permission DoD pass).
