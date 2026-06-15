## 1. Dependency & native config

- [x] 1.1 Add `expo-camera` (`~56.0.x`, SDK-56-aligned) to `mobile/package.json` dependencies; run `npm install` so the lockfile is regenerated and consistent (run in `mobile/`).
- [x] 1.2 Add the `plugins` entry to `mobile/app.config.ts`: `["expo-camera", { cameraPermission: "<usage description>", recordAudioAndroid: false }]`. Use a clear English usage description (it is build-time config, OS-localized — NOT an i18n catalog string). Add a comment noting it links under the existing iOS `useFrameworks: "static"` and is prebuild-verified (config-shape, R-1), mirroring the `expo-sqlite` plugin comment.
- [x] 1.3 Confirm `npx expo config --json` parses cleanly with the new plugin (no `app.config.ts` type/parse error). (Verified: parses, the `["expo-camera", { cameraPermission, recordAudioAndroid: false }]` entry is present, and `RECORD_AUDIO` is absent from the resolved config.) (HUMAN: a full `expo prebuild --clean` verifying the generated `NSCameraUsageDescription` + Android `CAMERA` permission and absent `RECORD_AUDIO` is the on-device proof — see inbox/2026-06-15-qr-scan-dod-manual.md.)

## 2. Feature folder: `src/features/calendar-sources/data/` (the pure parser)

- [x] 2.1 Create `src/features/calendar-sources/data/types.ts` exporting the `ScannedCalendarSource` domain type (`{ url: string }` — the trimmed calendar URL, the Flutter `QrCodeResult.url` wire format; note in a comment it is the seam ships 4/5 + the Phase 09 importer consume).
- [x] 2.2 Create `src/features/calendar-sources/data/parse-source.ts` exporting the pure `parseScannedSource(raw: string): ScannedCalendarSource | null` (trim; reject empty/whitespace; accept `http`/`https` verbatim; normalize `webcal://` → `https://`; reject non-URL → `null`). No camera, no `t()`, no backend imports (golden-path `data/` pure-seam rule).
- [x] 2.3 Create `src/features/calendar-sources/data/index.ts` sub-barrel re-exporting `parseScannedSource` + `ScannedCalendarSource`.
- [x] 2.4 Write `src/features/calendar-sources/data/parse-source.test.ts` covering http, https, webcal-normalization, empty, whitespace-only, non-URL, leading/trailing-whitespace trimming — to the 90% logic threshold.

## 3. Ephemeral scanned-source state seam

- [x] 3.1 Create the ephemeral in-memory holder for the parsed source (e.g. `src/features/calendar-sources/data/scanned-source.ts` — a module-scoped value + a small `useScannedSource()` hook, or an equivalent reactive holder). It MUST NOT use MMKV or Drizzle (durable `user_calendars` token persistence is ship 5). Comment it explicitly as the ephemeral seam ship 5 replaces. Re-export from the `data/` sub-barrel.
- [x] 3.2 Test the holder: setting a source makes it readable; clearing resets it.

## 4. QR scanner screen (`ui/` sublayer)

- [x] 4.1 Create `src/features/calendar-sources/ui/qr-scan-screen.tsx` (presentational, 70% floor). Use `useCameraPermissions()` to drive the three states (undetermined → request; granted → `CameraView` with `barcodeScannerSettings={{ barcodeTypes: ["qr"] }}` + `onBarcodeScanned`; denied-can't-ask-again → `Linking.openSettings()`). Import `CameraView` / `useCameraPermissions` directly from `expo-camera` (no chrome wrapper — D5; expo-camera is stable, not an alpha API).
- [x] 4.2 Single-scan debounce: a `scanned` ref / state so `onBarcodeScanned` is handled exactly once until re-armed.
- [x] 4.3 On scan: call `parseScannedSource`; on success place the source in the ephemeral holder, confirm the URL, dismiss the scanner; on `null` show an accessible recoverable "not a calendar QR" message and re-arm (do NOT `recordError` the recoverable case — D8).
- [x] 4.4 Wrap a crash-worthy thrown failure path with `recordError(error, "calendar-sources/qr-scan")` via `@/firebase` (never import `@react-native-firebase/*` directly) and show an accessible failure state.
- [x] 4.5 Accessibility: viewfinder `accessibilityLabel`/`accessibilityHint`; every button has a role + translated label + ≥44pt/48dp target (hitSlop + minHeight, mirror the welcome CTA / school retry); status/error text uses `accessibilityLiveRegion="polite"` + a status role. All copy via `t()` — no hardcoded strings.
- [x] 4.6 Create `src/features/calendar-sources/ui/index.ts` sub-barrel exporting the screen; create `src/features/calendar-sources/index.ts` feature barrel re-exporting `data` + `ui` (note the no-self-barrel-cycle rule in a comment).

## 5. Route + onboarding reachability

- [x] 5.1 Create `src/app/onboarding/qr-scan.tsx` as a thin re-export: `export { default as default } from "@/features/calendar-sources/ui"` (route-structure rule — the route re-exports the screen through the `ui/` sub-barrel; no colocated test).
- [x] 5.2 Register the route so it is reachable under the onboarding `Stack` (it is a sibling under `src/app/onboarding/_layout.tsx`'s `Stack`, so it is reachable by `router.push("/onboarding/qr-scan")` — confirm no extra `<Stack.Screen>` is needed beyond the existing default-screen registration, or add one if header/options are needed).
- [x] 5.3 Add a CTA on the welcome screen (`src/features/onboarding/ui/welcome-screen.tsx`) or the school step that navigates to `/onboarding/qr-scan` (the "scan a QR code" alternative path), with a role + translated label + ≥44pt/48dp target, reusing the accent-border CTA pattern. Add FR/EN keys.

## 6. i18n

- [x] 6.1 Add flat keys to `src/i18n/locales/en.json` for every new user-facing string (permission explainer/grant, settings guidance, scanning prompt, scanned-confirmation, not-a-calendar-QR, failure, the CTA + its a11y label).
- [x] 6.2 Add the identical key set to `src/i18n/locales/fr.json` (translated) — bidirectional `tsc` parity must pass.

## 7. Jest proof (mock at the expo-camera seam)

- [x] 7.1 Create `jest/setup-expo-camera.ts` mocking `expo-camera` suite-wide: `CameraView` renders a pressable that, when pressed, fires `props.onBarcodeScanned({ data, type })` with a synthetic value so a test drives a real scan; `useCameraPermissions` returns a controllable `[status, requestPermission]`. Register it in `jest.config.js` `setupFilesAfterEnv` (after the existing setups). Follow the `setup-expo-ui.ts` factory conventions (plain JS factory, lazy `require` of react/react-native).
- [x] 7.2 Write `src/features/calendar-sources/ui/qr-scan-screen.test.tsx`: render through the real theme + i18n trees; assert localized text (not keys); exercise the permission states (granted renders camera; undetermined shows grant); fire a synthetic `onBarcodeScanned` with a valid URL and assert the parsed source reaches the ephemeral holder + the scanner dismisses; fire a non-URL value and assert the recoverable message + no `recordError`; assert a thrown path records via a mocked `@/firebase`.
- [x] 7.3 Confirm the coverage split holds: `data/` (parser + holder) clears 90%; the `ui/` screen falls under the 70% global floor (the `src/features/*/!(ui)/**` glob excludes `ui/`).

## 8. Architecture Book + ADR + docs

- [x] 8.1 Write `/.claude/rules/mobile/decisions/017-qr-scan-camera.md` (ADR 017) recording: (a) camera-lib choice `expo-camera` over vision-camera / a mobile_scanner-equivalent, with the config-plugin + permission-string mechanism, the iOS static-frameworks interaction, the autolink note, and the prebuild/e2e (config-shape, not lint) + Jest-mock verification posture; (b) the single-feature-folder `calendar-sources/` naming decision (one folder for QR · iCal · persistence, rejecting per-input-method folders); (c) the no-chrome-wrapper assessment; (d) what the QR yields (a URL, not the server token). Mirror ADR 010/012/011 rigor. Add the revisit-if clause.
- [x] 8.2 Add the ADR 017 row to `/.claude/rules/mobile/decisions/README.md` index.
- [x] 8.3 Update `/.claude/rules/mobile/runtime.md`: record `expo-camera` as a new native dep with a `plugins` permission-string entry (autolinks; permission strings are config-shape, prebuild-verified, R-1), alongside the existing native-deps notes.
- [x] 8.4 Update `/.claude/rules/mobile/features.md`: add the `calendar-sources` feature (QR scan ship; `data/` parser + ephemeral holder + `ui/` scanner; observability ✅; the cluster note that ships 4/5 grow `data/create` + `store/`).
- [x] 8.5 Append a live entry to `/.claude/rules/mobile/architecture-changelog.md` (date 2026-06-15, slug `add-mobile-qr-scan`): what moved (expo-camera + plugin, the calendar-sources feature folder, the parser seam, ephemeral handoff, observability), why (Phase-03 ship 3 — first camera input method), pointers (ADR 017, runtime.md, features.md).

## 9. Human handoff (inbox)

- [ ] 9.1 (HUMAN: see inbox/2026-06-15-qr-scan-dod-manual.md) On-device camera + permission + scan + a11y + native-correctness + observability verification on iOS and Android, plus the `expo prebuild --clean` native-config proof. Skip-and-continue — the inbox note is filed; CI/Maestro cannot drive a camera.

## 10. Local verification (run in `mobile/`)

- [x] 10.1 `npx tsc --noEmit` — clean (FR/EN parity included).
- [x] 10.2 `npm run lint` — clean (`--max-warnings 0`; no hardcoded strings, no direct `expo-camera`-outside-`ui` boundary issues, no direct `@react-native-firebase` import, import order).
- [x] 10.3 `npm test` — green, including the new parser + screen tests and the coverage thresholds (90% logic / 70% global).
- [x] 10.4 `openspec validate add-mobile-qr-scan --strict` — passes.
