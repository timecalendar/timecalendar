## Context

Phase 03 roadmap step 3: scan a QR code to add a calendar. The two prior ships landed the
onboarding welcome surface (`add-mobile-onboarding-flow`, ADR 015) and the full school picker
(`add-mobile-school-picker`, ADR 016). This ship adds the **first camera input method**, the
first of the "add a calendar source" cluster (QR · iCal · durable token persistence — roadmap
steps 3/4/5).

**What the Flutter app actually does (read before designing — `app/lib/modules/qr_code/` +
`import_ical/`):**

- `QrCodeScreen` uses `mobile_scanner` (`MobileScannerController`, `formats: [BarcodeFormat.qrCode]`),
  reads `barcode.rawValue`, stops the scanner, and pops a `QrCodeResult(url: rawValue)`. **The QR
  encodes a raw string that is treated as an iCal URL** — there is no JSON, no deep link, no app-
  specific envelope; `QrCodeResult` is just `{ url: String? }`.
- `ScanQrCode` (in `import_ical/`) requests camera permission first; on denial it shows a "go to
  Settings" dialog; on grant it pushes the scanner and calls `onScan(result.url)`.
- `onScan` → `loadIcalUrl(url)` → `POST /calendars` with `CreateCalendarDto { url, schoolId,
  schoolName, name }` → the **server** returns `CreateCalendarRepDto { token }` → `findCalendarByToken(token)`
  → stored as a `UserCalendar`.

**Therefore the calendar *token* is a server artifact, not something the QR carries.** The QR yields
a **URL string**; the token is produced by `POST /calendars` (ship 4) and persisted as `user_calendars`
(ship 5). This ship's job is precisely: **camera → raw scanned string → a typed, validated calendar
source → into app state.** The ship description's "by token" is the cluster goal; the QR primitive is
the URL.

Constraints inherited from the Architecture Book: golden-path feature-module pattern (ADR 014),
CNG/`app.config.ts` for native config (`runtime.md`), the seam-import + feature-boundary lint
(`lint-format.md` B-1…B-4), i18n FR/EN parity + no-literal-strings, a11y on touchables + accessible
async status, `@/firebase` `recordError` for failures, mock-at-the-seam testing (e2e can't drive a
camera — `testing.md`), the K-3 90/70 coverage split.

## Goals / Non-Goals

**Goals:**
- Add `expo-camera` correctly: dep + `plugins` permission-string entry + autolink, lockfile.
- A QR scanner screen with the full permission lifecycle (undetermined → request → granted/denied),
  QR-only `CameraView`, single-scan debounce, accessible states.
- A pure, 90%-gated parser turning the scanned string into a typed `ScannedCalendarSource` matching
  the Flutter wire format (the seam ships 4/5 + the Phase 09 importer consume).
- An ephemeral handoff of the parsed source into app state (no durable persistence here).
- A scan/parse-failure path through `@/firebase` `recordError`.
- The first `src/features/calendar-sources/` folder, named so ships 4/5 grow it.
- A Jest proof of the scan→parse→state wiring; ADR 017 + Architecture Book updates.

**Non-Goals:**
- **No `POST /calendars` call, no token retrieval, no calendar load** — that is ship 4 (iCal import
  wires the create flow QR shares).
- **No durable `user_calendars` token store / schema** — ship 5 (the Phase 09 migration target).
- **No iCal-URL-paste / file-import surface** — ship 4.
- No chrome wrapper (D5), no torch/flip-camera/gallery-scan affordances (R-2 — not in the Flutter
  flow, no need yet).

## Decisions

### D1 — Camera library: `expo-camera` (ADR 017)

Adopt **`expo-camera`** (SDK 56, `~56.0.x`) for the camera surface and its built-in barcode scanning.
Replaces Flutter's `mobile_scanner`. Alternatives weighed:

1. **`expo-camera`** *(chosen)* — in the Expo SDK lane (versioned with SDK 56, upgrades with `expo`),
   ships barcode scanning built in (`CameraView` `barcodeScannerSettings` / `onBarcodeScanned`), a
   first-class `useCameraPermissions` hook, and a **config plugin** for the permission strings. The
   native module **autolinks** under CNG; the plugin entry exists only to inject the permission
   strings (and to gate the barcode scanner into the build). Links under the existing iOS
   `useFrameworks: "static"` — no new `expo-build-properties`.
2. **`react-native-vision-camera` + a barcode frame processor** *(rejected)* — more capable
   (frame processors, formats) but **outside the Expo lane** (its own native config, a worklets/
   frame-processor toolchain), heavier than a QR scan needs (R-2), and a second native-camera stack
   to maintain.
3. **A `mobile_scanner`-equivalent / `@react-native-...` MLKit wrapper** *(rejected)* — no Expo-
   blessed equivalent; would be a non-autolinking native dep needing manual config, exactly what the
   Expo lane exists to avoid (`runtime.md`).

`expo-camera` is the R-3 native-correct, lowest-footgun choice that stays in the upgrade lane. ADR 017
records it with the config-plugin + permission-string mechanism, the iOS static-frameworks interaction,
and the verification posture (prebuild/e2e is config-shape, not lint — R-1; Jest mocks the native
module). Rigor mirrors ADR 010/012 (the `@expo/ui` adoption decisions) and ADR 011's autolink note.

### D2 — Native wiring: a `plugins` entry for permission strings; the module autolinks

`expo-camera`'s **native module autolinks** under CNG (like `expo-sqlite`'s module, `react-native-mmkv`,
`expo-crypto`). But unlike `expo-crypto`/MMKV, it **requires a `plugins` entry** to inject the
permission strings — a camera permission with no usage description is an **App Store rejection / a
runtime crash on iOS**. So `app.config.ts` `plugins` gains:

```ts
[
  "expo-camera",
  {
    cameraPermission:
      "TimeCalendar needs camera access to scan a QR code that adds your calendar.",
    recordAudioAndroid: false, // barcode scanning only — no microphone/audio
  },
]
```

`cameraPermission` → iOS `NSCameraUsageDescription`; `recordAudioAndroid: false` keeps `RECORD_AUDIO`
off the Android manifest (we never record). `barcodeScannerEnabled` defaults on; left default. No
`microphonePermission` (not used). It links under the existing iOS `useFrameworks: "static"` set; the
escape if a pod breaks is the documented `ios.forceStaticLinking`. **Verified only by a real
`expo prebuild` / e2e build** (config-shape, R-1 — `tsc`/lint/Jest don't read the plugin), recorded
in `runtime.md` prose. The permission-description strings live in `app.config.ts` (a config value,
build-time) — they are *not* i18n catalog strings; the system permission dialog is OS-localized from
the Info.plist/manifest, not from `t()`. (Recorded so a reviewer doesn't flag them as hardcoded copy.)

### D3 — Feature folder: ONE `src/features/calendar-sources/` for the QR · iCal · persistence cluster

The QR scan (ship 3), iCal URL/file import (ship 4), and durable token persistence (ship 5) are **one
cohesive concern**: "get a calendar source onto the device." QR and iCal are two **input surfaces** that
produce the **same primitive** (an iCal URL string → a `ScannedCalendarSource`); ship 5 is the durable
store of the resulting tokens. They share the `data/` parser, the `POST /calendars` create flow (ship 4),
and the `store/` (ship 5). This mirrors how `school-selection` grew `data/ + store/ + ui/`.

**Decision: a single feature folder `src/features/calendar-sources/`**, not three separate folders
(`qr-scan/`, `import-ical/`, `user-calendars/`). Rationale:

- The three ships layer onto one feature the way school-selection's read/store/UI did — separate folders
  would fragment the shared `data/` parser + create flow + token store across feature barrels and force
  cross-feature imports (which B-1/B-2 would then have to special-case).
- Naming it for the *concern* (calendar sources), not the *input method* (qr-scan), is what lets ships
  4/5 grow it in place — adding `data/create.ts` (ship 4) and `store/` (ship 5) under the same barrel,
  not new features.
- This ship builds `calendar-sources/data/` (the parser) + `calendar-sources/ui/` (the QR screen); the
  feature barrel re-exports them. Ships 4/5 add sublayers, not folders.

*Rejected:* a per-input-method folder (`qr-scan/`) — over-fragments a single concern from a sample of
one input method, and would need a fourth folder for the shared token store ship 5 owns; exactly the
speculative-divergence R-2 forbids. Recorded in ADR 017 (the folder-naming half of the decision).

### D4 — What the QR yields: a pure `ScannedCalendarSource` parser in `data/`

`data/types.ts` defines `ScannedCalendarSource` — the typed result of a scan: `{ url: string }`
(the trimmed iCal URL — the Flutter wire format, `QrCodeResult.url = rawValue`). `data/parse-source.ts`
exports a **pure** `parseScannedSource(raw: string): ScannedCalendarSource | null`:

- Trim the raw value; **reject** empty / whitespace-only (→ `null`).
- **Validate it is an http(s) URL** (a real iCal URL is an `http`/`https`/`webcal` URL). A QR that
  isn't a URL (a contact card, a random string) → `null` so the screen shows "this isn't a calendar
  QR" rather than feeding garbage downstream. (`webcal://` is normalized to `https://` — the Flutter
  server accepts the http form; recorded in the parser.)
- On success return `{ url }`.

This is the **seam ship 4 consumes** (`POST /calendars { url }`) and the **Phase 09 importer must
align with** (the importer recovers `user_calendars.token` rows, but the *source URL* is the wire-
format anchor). 90%-gated, fully unit-tested (valid http/https/webcal, empty, whitespace, non-URL,
trimming). Keeping it pure (no camera, no `t()`, no backend) is the golden-path `data/`-is-a-pure-seam
rule (ADR 014). **No `data/`-level generated-hook or `@/db` import in this ship** (the create flow is
ship 4) — so B-1 isn't yet exercised by this feature, but the folder is positioned for it.

### D5 — No chrome wrapper for `CameraView`

The `src/components/chrome/` seam exists to localize **alpha-API churn** (`@expo/ui`,
`expo-glass-effect`, `unstable-native-tabs`). `expo-camera` is a **stable, GA Expo module** — not an
alpha/unstable surface — so wrapping `CameraView` in a chrome seam would be cargo-culting the seam (and
the chrome lint ban is scoped to the named alpha specifiers, which `expo-camera` is not). The screen
imports `CameraView` / `useCameraPermissions` from `expo-camera` directly in the feature's `ui/`
sublayer. Recorded in ADR 017 (assessed and rejected). If a future surface needs camera config that
churns, that is its own decision then (R-2).

### D6 — Permission UX: the `useCameraPermissions` lifecycle, native-correct

The screen drives the three permission states (R-3 — the platform's own model, not Flutter's
permission_handler dialog):

- **Undetermined** (`permission == null` or `!granted && canAskAgain`): show an explainer + a "Grant
  camera access" button → `requestPermission()`.
- **Granted:** render `CameraView` (QR-only) full-bleed with a viewfinder frame overlay.
- **Denied, can't ask again** (`!granted && !canAskAgain`): show "camera access is off — open Settings"
  + a button → `Linking.openSettings()` (the RN-core equivalent of Flutter's `openAppSettings`).

All states are accessible: the camera viewfinder carries an `accessibilityLabel` + `accessibilityHint`
describing "point at a QR code"; status/error text uses `accessibilityLiveRegion="polite"` + a status
role; every button declares a role + translated label + ≥44pt/48dp target (mirrors the school-picker
retry + welcome CTA). Camera-viewfinder a11y is itself an on-device concern (a screen-reader user can't
aim a camera) — the explainer states it and the manual pass owns the rest (inbox/DoD note).

### D7 — Ephemeral handoff into app state (durable store deferred to ship 5)

On a successful parse the screen **debounces** (sets a `scanned` ref so `onBarcodeScanned` fires once),
then hands the `ScannedCalendarSource` into app state ephemerally and dismisses the scanner. For this
ship the handoff is **a navigation result back to onboarding** (`router.back()` after stashing the
parsed source in a tiny module-scoped, in-memory `useScannedSource` hook — NOT MMKV, NOT Drizzle) plus
an on-screen confirmation of the scanned URL. This demonstrates camera → state end-to-end without
building ship 5's durable store. The in-memory holder is explicitly labeled ephemeral and is the seam
ship 5 swaps for the durable `user_calendars` token store. *Rejected:* persisting to MMKV/Drizzle here
(that is ship 5's schema decision + the Phase 09 migration target — building it now would pre-empt the
deliberate ship boundary and risk a throwaway schema).

### D8 — Failure path → `@/firebase` `recordError`; observability ✅

A scan that parses to `null` (a non-calendar QR) is a **user-recoverable** state (show "not a calendar
QR, try again", re-arm the scanner) — not a crash, so it is *not* `recordError`'d (that would be noise).
But a **thrown** failure (the camera surface erroring, an unexpected parse exception) IS recorded through
`@/firebase` `recordError(error, "calendar-sources/qr-scan")` and surfaced as an accessible failure
state. This is the second feature where a surface can fail (after personal-events writes); observability
is **✅ wired**, not N/A. (The distinction — recoverable empty-result vs. crash-worthy throw — mirrors
school-selection's `isError` (N/A) vs. personal-events' write throw (✅).)

## Risks / Trade-offs

- **Camera can't be CI-tested** → the scan→parse→state wiring is proven at the Jest/component level
  (mock `expo-camera`'s `CameraView` + `useCameraPermissions` suite-wide in `jest/setup-expo-camera.ts`;
  the `CameraView` mock exposes a pressable that fires `onBarcodeScanned({ data, type })` so a test
  drives a synthetic scan through the real parser into state). The real camera + permission dialogs are
  an **inbox/DoD manual on-device pass** (iOS + Android, granted/denied/settings paths). Mirrors the
  `@expo/ui` "Maestro can't drive the native picker" posture.
- **Maestro flow** → a Maestro flow cannot grant camera permission or scan a code deterministically
  cross-platform. No new Maestro happy-path flow for the *scan itself*; the e2e axis is covered by the
  manual note. (The onboarding-reachability of the QR route can be asserted, but the scan can't.)
- **Permission-string config is prebuild-verified only** → if the `plugins` entry is malformed, neither
  `tsc`/lint/Jest catches it; the first `expo prebuild` (implementer/e2e) is the proof. Recorded as
  config-shape R-1 in `runtime.md`.
- **`webcal://` normalization** → normalizing `webcal://` → `https://` in the parser is a small bet on
  server behavior; the Flutter app passes `rawValue` verbatim. Mitigation: the parser keeps the original
  for http/https verbatim and only rewrites the `webcal:` scheme, tested explicitly; if the server needs
  the raw `webcal://`, the rewrite is a one-line parser change behind the seam.
- **Ephemeral handoff is throwaway** → the in-memory holder is replaced by ship 5's durable store; this
  is intended (the ship boundary), labeled in code, and a plain revert if ship 5 reshapes it.

## Migration Plan

Additive, no schema/data/native-project hand-edits. Deploy = land the change; the native dep is picked
up on the next `expo prebuild` (CNG). Rollback = plain revert (remove the dep + plugin entry + feature
folder + route + i18n keys + ADR/docs); nothing persisted, no schema. The `plugins` entry and the dep
are the only native-affecting changes — they bump the fingerprint (forcing a fresh native build, per the
EAS fingerprint policy), which is correct: a new native module must not arrive over OTA.

## Open Questions

- **Does the production QR actually encode a bare iCal URL or a `https://timecalendar.host/...` page URL
  bearing a token query param?** The Flutter code treats `rawValue` as the URL it POSTs verbatim, so the
  parser must NOT assume an iCal-specific shape — it validates "is an http(s)/webcal URL" only and passes
  it through. Resolved by following Flutter's verbatim-passthrough; ship 4's `POST /calendars` is the real
  validator. Recorded so ship 4 doesn't tighten the parser prematurely.
- **`primaryStrong` white-on-brand CTA** for the scan CTA — same deferred decision as the onboarding
  welcome CTA (ADR 015 / inboxed designer polish). This ship reuses the accent-border CTA pattern; no new
  decision.
