# Firebase (Crashlytics + Analytics) wired for mobile, verified end-to-end

## Why

`mobile/` has **zero** instrumentation: no crash reporting, no analytics, no global
error handling (only a typed `ApiError` in `src/api/mutator.ts` and query-driven
`isError` UI states). Foundation roadmap step 8 (and migration-approach §1's vertical
slice: the walking skeleton wires every cross-cutting system *before* the first real
feature) makes Crashlytics + Analytics live and CI-green now, so the day a feature ships
it is already observable rather than a retrofit. This change also discharges a debt the
Architecture Book recorded at scaffold time: *"the `.dev` identifier needs its own
Firebase registration — owned by the Firebase foundation step."*

## What Changes

- **`@react-native-firebase/{app,crashlytics,analytics}`** added to `mobile/` (v24,
  modular API), registered as Expo config plugins in `app.config.ts`. The Firebase iOS
  SDK's `useFrameworks: "static"` requirement is merged into the existing
  `expo-build-properties` block.
- **One Firebase project per environment** (Google best practice — Analytics/Crashlytics/
  quotas/billing are project-scoped). `app.config.ts` switches `googleServicesFile` by
  `APP_VARIANT`: dev variant (`fr.samuelprak.timecalendar.dev`) → the **`timecalendar-dev`**
  project; production (`fr.samuelprak.timecalendar`) → the Flutter app's existing
  **`timecalendar-samuelprak`** project. The four config files live committed in
  `mobile/firebase/` (they carry only non-secret client API keys, like the Flutter app's).
- **Thin `src/firebase/` wrapper** over the modular SDK (`logEvent` / `logMessage` /
  `recordError` / `crashTest`) — the single swappable seam the app touches. Unlike i18n,
  **no startup side-effect**: the native default app auto-initializes from the config
  files and Crashlytics installs the global JS exception handler natively, so this is a
  call-site module, not a `_layout.tsx` import.
- **`mobile/firebase.json`** with `crashlytics_debug_enabled: true` so a local debug build
  reports crashes for convenient verification (release/e2e builds report regardless).
- **Dev-only verification surface**: a `__DEV__`-gated `FirebaseDebugPanel` on the Profile
  tab with two labelled `Pressable`s (log a test event / force a test crash). This is also
  the **first live exercise of the four `react-native-a11y` touchable rules** (until now
  guarding an empty surface).
- **One proof test** (`src/firebase/firebase.test.ts`) mirroring the i18n/a11y proofs:
  asserts the wrapper drives the modular SDK with the expected args (CI can't assert an
  event/crash *arrives* in the console — that half is manual, on-device).
- **Architecture Book** gains a Firebase section; the a11y section's "touchable rules
  unexercised" note is updated; roadmap step 8 marked done.

## Capabilities

### New Capabilities

- `mobile-firebase`: the mobile app's crash-reporting + analytics system — the
  per-environment Firebase project mapping and variant-switched config files, the
  static-frameworks build requirement, the wrapper seam and modular-API choice, native
  auto-init (no JS init) + the auto-installed JS exception handler, the dev-only
  verification surface, and what CI proves vs. what is manually verified on-device.

### Modified Capabilities

<!-- none. mobile-a11y already owns the touchable rules; this change is their first live
consumer but changes none of that capability's requirements. mobile-architecture-book
gains a Firebase section — normal book evolution, not a requirement change. -->

## Impact

- `mobile/`: new deps (`@react-native-firebase/{app,crashlytics,analytics}`); new
  `src/firebase/` (wrapper + proof test), `src/components/firebase-debug-panel.tsx`,
  `mobile/firebase.json`, `mobile/firebase/` (README + the four committed config files);
  `app.config.ts` (3 plugins + `useFrameworks: "static"` + variant-switched
  `googleServicesFile`); `(tabs)/profile.tsx` renders the dev panel; `jest.config.js` +
  `jest/setup-firebase.ts` mock the native modules; `en.json`/`fr.json` gain the debug
  labels.
- **Manual prerequisite (cannot be automated):** register the `.dev` Android + iOS apps
  in the `timecalendar-dev` project and drop the four config files into `mobile/firebase/`
  (see its README). Native builds / e2e fail until then; `tsc`/lint/Jest do not read the
  files, so CI `test-mobile` is unaffected.
- `.claude/rules/mobile/architecture.md`: Firebase section added; a11y note updated.
- `docs/react-native-migration/01-roadmap/01-foundation.md`: step 8 marked done.
- No server/web/`app/` code touched. Native projects are CNG/gitignored and regenerate on
  the next `prebuild`.
