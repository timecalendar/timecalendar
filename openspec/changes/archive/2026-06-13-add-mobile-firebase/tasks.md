## 1. Dependencies + native config

- [x] 1.1 `npx expo install @react-native-firebase/app @react-native-firebase/crashlytics @react-native-firebase/analytics` (Expo-aligned versions); update the lockfile.
- [x] 1.2 `app.config.ts`: add the three plugins; merge `ios.useFrameworks: "static"` into the existing `expo-build-properties` block; add variant-switched `googleServicesFile` (android + ios) keyed on the existing `IS_DEV`.
- [x] 1.3 Create `mobile/firebase.json` with `react-native.crashlytics_debug_enabled: true`.
- [x] 1.4 Create `mobile/firebase/README.md` documenting the per-environment project mapping and the four committed config files; the config files themselves are added out-of-band (manual Firebase-console prerequisite).

## 2. Wrapper seam (`src/firebase/`)

- [x] 2.1 Create `src/firebase/index.ts`: thin modular-API helpers `logEvent`, `logMessage`, `recordError`, `crashTest`; resolve native instances lazily inside each helper; no module-load side-effect.
- [x] 2.2 Confirm no `_layout.tsx` side-effect import is needed (native auto-init + auto-installed JS handler) — documented in design D4.

## 3. Verification surface

- [x] 3.1 Create `src/components/firebase-debug-panel.tsx`: `__DEV__`-only, two labelled `Pressable`s (log event / trigger crash) with `accessibilityRole="button"` + translated `accessibilityLabel`.
- [x] 3.2 Render `{__DEV__ && <FirebaseDebugPanel />}` in `(tabs)/profile.tsx`.
- [x] 3.3 Add `debug.firebase.heading` / `.logEvent` / `.crash` to `en.json` + `fr.json` (FR/EN parity).

## 4. Test the wiring

- [x] 4.1 `jest/setup-firebase.ts`: mock `@react-native-firebase/analytics` + `/crashlytics` modular fns; register in `jest.config.js` `setupFilesAfterEnv`.
- [x] 4.2 `src/firebase/firebase.test.ts`: assert the wrapper drives the SDK with expected args (logEvent name+params; logMessage; recordError with/without breadcrumb; crashTest).

## 5. Gates

- [x] 5.1 `npx tsc --noEmit` clean (typed catalog keys + FR/EN parity hold).
- [x] 5.2 `npm run lint` clean with `--max-warnings 0` (a11y rules now exercised on the panel).
- [x] 5.3 `npm test` green (17/17; firebase proof + existing suites).

## 6. Docs

- [x] 6.1 Add a Firebase section to `.claude/rules/mobile/architecture.md`; update the a11y section's "touchable rules unexercised" note.
- [x] 6.2 Mark step 8 done in `docs/react-native-migration/01-roadmap/01-foundation.md`.

## 7. Manual (out-of-band — Firebase console + device; not gated by CI)

- [x] 7.1 Registered Android + iOS `fr.samuelprak.timecalendar.dev` apps in the `timecalendar-dev` project; dev config pair placed in `mobile/firebase/` (+ Flutter prod pair copied).
- [x] 7.2 Verified end-to-end on the iOS simulator (iPhone 17 Pro, iOS 26.5): `expo prebuild --clean` + `expo run:ios` **built clean with `useFrameworks: "static"`**; app launches, `Analytics collection enabled`. Drove the dev panel via Maestro — Analytics logged the custom event (`Logging event … params: app, debug_test_event … ga_debug=1` → `Successful upload. Code: 204`), and a forced crash was packaged + uploaded (`Completed report submission with id: 1051fdfa1eec4c62871ee52f32e4d9bd`). Delivery proven from device logs; the `timecalendar-dev` console view (DebugView / Crashlytics dashboard) is the owner's final glance. Android emulator path not run (iOS covers the risky static-frameworks build).
