# 017 — QR scan: `expo-camera` for the camera surface, one `calendar-sources/` feature folder, no chrome wrapper, the QR yields a URL

> Origin: the `add-mobile-qr-scan` change (Phase 03 ship 3), design D1/D3/D4/D5.
> The first camera input method. The full wiring lives in the Architecture Book
> "Runtime & native baseline" (the native dep + plugin) and "Features →
> Calendar sources"; this is the load-bearing decision record. Rigor mirrors ADR
> [010](./010-expo-ui-chrome-wrapper.md)/[012](./012-personal-event-datetime-picker.md)
> (the `@expo/ui` adoption decisions) and ADR [011](./011-personal-event-storage.md)'s
> autolink note.

## Status

Accepted.

## Context

Phase 03 step 3 adds the first **camera input method** — scanning a QR code to add a
calendar. The Flutter app does this with `mobile_scanner` (`app/lib/modules/qr_code/` +
`import_ical/`); the mobile app has no camera dependency yet. Reading the Flutter flow is
load-bearing: `QrCodeScreen` reads `barcode.rawValue` and pops `QrCodeResult(url: rawValue)` —
**the QR encodes a raw string treated as an iCal URL**, no JSON / envelope / deep link.
`onScan` → `POST /calendars { url, … }` → the **server** returns `{ token }`. So the calendar
*token* is a server artifact (ship 4 produces it, ship 5 persists it); the QR primitive is a
**URL**.

Four decisions here are load-bearing — copied by ships 4/5 and the later camera/native surfaces,
and costly to reverse — so they earn an ADR (R-4):

1. **Which camera library**, and how it links under CNG.
2. **How the feature folder is named/scoped** (this ship seeds it; ships 4/5 grow it).
3. **Whether `CameraView` needs a `src/components/chrome/` wrapper** (the alpha-API seam).
4. **What the QR yields** (the parser's contract — the seam ships 4/5 + the Phase 09 importer consume).

## Decision

**(D1) Camera library: `expo-camera` (SDK 56, `~56.0.x`).** It is in the Expo SDK lane
(versioned with SDK 56, upgrades with `expo`), ships barcode scanning built in
(`CameraView` `barcodeScannerSettings` / `onBarcodeScanned`), a first-class
`useCameraPermissions` hook, and a config plugin for the permission strings. Its **native
module autolinks** under CNG (like `expo-sqlite`'s module, `react-native-mmkv`, `expo-crypto`);
the plugin entry exists only to inject the permission strings + gate the barcode scanner into
the build. It links under the existing iOS `useFrameworks: "static"` set — no new
`expo-build-properties`.

*Rejected:* (a) `react-native-vision-camera` + a barcode frame processor — more capable but
**outside the Expo lane** (its own native config + a worklets/frame-processor toolchain),
heavier than a QR scan needs (R-2), a second native-camera stack to maintain; (b) a
`mobile_scanner`-equivalent / MLKit wrapper — no Expo-blessed equivalent, a non-autolinking
native dep needing manual config, exactly what the Expo lane exists to avoid (`runtime.md`).

**(D2) Native wiring: a `plugins` entry for the permission strings only; the module autolinks.**
`app.config.ts` `plugins` gains `["expo-camera", { cameraPermission: "<usage description>",
recordAudioAndroid: false }]`. `cameraPermission` → iOS `NSCameraUsageDescription` (a missing
camera usage string is an App Store rejection / iOS runtime crash). `recordAudioAndroid: false`
keeps `RECORD_AUDIO` off the Android manifest (QR scanning never records audio — verified by
inspecting `expo-camera`'s plugin: `recordAudioAndroid` **defaults to `true`** and adds the
permission, so disabling it is required); no `microphonePermission` for the same reason. The
usage description is **build-time config, OS-localized** from the Info.plist/manifest — NOT an
i18n catalog string (recorded so a reviewer doesn't flag it as hardcoded copy). **Verified only
by a real `expo prebuild` / e2e build** (config-shape, R-1 — `tsc`/lint/Jest don't read the
plugin strings); the escape if a pod breaks under static linking is `ios.forceStaticLinking`.

**(D3) One `src/features/calendar-sources/` folder for the QR · iCal · persistence cluster.**
The QR scan (ship 3), iCal URL/file import (ship 4), and durable token persistence (ship 5) are
**one cohesive concern** — "get a calendar source onto the device." QR and iCal are two input
surfaces producing the **same primitive** (a URL → a `ScannedCalendarSource`); ship 5 is the
durable token store. They share the `data/` parser, the `POST /calendars` create flow (ship 4),
and the `store/` (ship 5), mirroring how `school-selection` grew `data/ + store/ + ui/`. This
ship builds `calendar-sources/data/` (the parser + the ephemeral holder) + `calendar-sources/ui/`
(the QR screen); ships 4/5 add **sublayers, not folders**. *Rejected:* a per-input-method folder
(`qr-scan/`) — over-fragments a single concern from a sample of one input method, would need a
fourth folder for the shared token store, and would force cross-feature imports B-1/B-2 would have
to special-case (the speculative divergence R-2 forbids).

**(D4) What the QR yields: a pure `ScannedCalendarSource` parser in `data/`.**
`data/parse-source.ts` exports a pure `parseScannedSource(raw): ScannedCalendarSource | null`:
trim; reject empty/whitespace → `null`; accept `http`/`https` **verbatim** (Flutter's
verbatim-passthrough — the parser must NOT assume an iCal-specific shape; ship 4's `POST
/calendars` is the real validator); reject non-URL → `null` (so the screen reports "not a
calendar QR" rather than feeding garbage downstream). It is the seam ship 4 consumes
(`{ url }`) and the Phase 09 importer aligns with (the source URL is the wire-format anchor).
Pure (no camera, no `t()`, no backend) per the golden-path `data/`-is-a-pure-seam rule (ADR
014); 90%-gated.

**The one deliberate divergence — `webcal://` → `https://` normalization.** Flutter passes
`rawValue` verbatim; the parser rewrites **only** the `webcal:` scheme prefix (the read-only
iCal subscription scheme, http(s) by convention; the server accepts the http(s) form). The
rewrite is a single, clearly-commented, **reversible** branch: if the server later needs the raw
`webcal://`, delete that one branch. http/https are passed through with their scheme untouched.
Tested explicitly (valid http/https/webcal, empty, whitespace, non-URL, trimming).

**(D5) No chrome wrapper for `CameraView`.** The `src/components/chrome/` seam exists to
localize **alpha-API churn** (`@expo/ui`, `expo-glass-effect`, `unstable-native-tabs`).
`expo-camera` is a **stable, GA Expo module**, not an alpha surface, and the chrome lint ban is
scoped to the named alpha specifiers (`expo-camera` is not one). Wrapping it would be cargo-
culting the seam. The screen imports `CameraView` / `useCameraPermissions` from `expo-camera`
directly in the feature's `ui/` sublayer (a normal dep import, not a banned seam). If a future
surface needs camera config that churns, that is its own decision then (R-2).

## Consequences

- A new native dep, `expo-camera`, enters `mobile/package.json` (`~56.0.x`) and the lockfile.
  It **autolinks**; the `plugins` entry carries only the permission strings. The dep + plugin
  bump the EAS fingerprint (forcing a fresh native build, per ADR [006](./006-eas-distribution.md)) —
  correct: a new native module must not arrive over OTA.
- The first `src/features/calendar-sources/` folder is set, named for the **concern** so ships
  4/5 grow it in place (`data/create.ts`, `store/`) rather than adding folders.
- The parser is the wire-format anchor ships 4/5 + the Phase 09 importer consume; the `webcal`
  rewrite is the single reversible bet behind the seam.
- Observability is **✅ wired** (D8): a thrown scan/parse failure records through `@/firebase`
  `recordError(error, "calendar-sources/qr-scan")`; a recoverable non-calendar-QR (`null`) is
  NOT recorded (re-arm + an accessible message) — noise avoidance, mirroring school-selection's
  `isError` (N/A) vs. personal-events' write throw (✅).
- The camera can't be CI/Maestro-driven: the scan→parse→state wiring is proven by a Jest test
  that mocks `expo-camera` (`jest/setup-expo-camera.ts` suite-wide + a controllable local mock
  in the screen test firing a synthetic `onBarcodeScanned`); the real camera + permission
  dialogs + the `expo prebuild` native-config proof are an inbox/DoD on-device pass
  (`docs/react-native-migration/inbox/2026-06-15-qr-scan-dod-manual.md`). Mirrors the `@expo/ui`
  "Maestro can't drive the native picker" posture.
- The parsed source is handed to an **ephemeral** in-memory holder (`data/scanned-source.ts`) —
  NOT MMKV/Drizzle; it is the seam ship 5 swaps for the durable `user_calendars` token store
  (design D7).

## Revisit if

- `expo-camera` proves insufficient (advanced formats, frame-processing, performance) and
  `react-native-vision-camera` becomes warranted — re-weigh the Expo-lane cost then (with its
  own ADR + native config).
- A camera surface genuinely needs config that churns enough to warrant a chrome wrapper (re-open
  D5 for that surface).
- The server requires the raw `webcal://` rather than the normalized `https://` (delete the one
  parser branch — D4), or the production QR turns out to encode a non-URL envelope (re-open the
  parser's "is a URL" contract — the design's open question, resolved here by following Flutter).
- A second input surface (ship 4) shows the single-folder shape doesn't fit — generalize rather
  than fragment (the migration-approach §4 posture; D3).
