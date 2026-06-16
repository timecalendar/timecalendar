// Rule rationale: .claude/rules/mobile/architecture.md (Testing section)
// The jest-expo preset owns the transform + transformIgnorePatterns that RN/Expo
// modules need; hand-rolling them is the failure mode the preset exists to prevent.

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    // Jest can't transform CSS (Metro/web concern); stub every CSS import.
    "\\.css$": "<rootDir>/jest/css-stub.js",
  },
  // Initialize i18next once for the whole suite, like the app does at startup,
  // so components under test resolve real translations instead of raw keys.
  // setup-firebase mocks the native @react-native-firebase modules suite-wide;
  // setup-db mocks the expo-sqlite / drizzle SQLite seam (no off-device JS);
  // setup-storage stubs react-native-nitro-modules so MMKV's built-in Jest
  // mock loads (its factory imports Nitro at module top level).
  //
  // setup-storage MUST precede setup-i18n: i18n init now reads the Settings
  // language preference through @/storage (getInitialLocale), so the MMKV mock
  // must be loadable before `import "@/i18n"` evaluates (TIM-130 / D5).
  setupFilesAfterEnv: [
    "<rootDir>/jest/setup-firebase.ts",
    "<rootDir>/jest/setup-db.ts",
    "<rootDir>/jest/setup-storage.ts",
    "<rootDir>/jest/setup-i18n.ts",
    // setup-splash mocks expo-splash-screen (native preventAutoHide/hideAsync,
    // hit at import + on mount) and AccessibilityInfo's reduced-motion read.
    "<rootDir>/jest/setup-splash.ts",
    // setup-expo-ui mocks @expo/ui's native universal controls (no off-device
    // JS) so the Settings screen renders and its picker onValueChange can be
    // driven under Jest. After setup-storage/setup-i18n since the screen reaches
    // A1's hooks → @/storage + @/i18n (TIM-131 / D6).
    "<rootDir>/jest/setup-expo-ui.ts",
    // setup-expo-camera mocks expo-camera's native CameraView +
    // useCameraPermissions (no off-device JS) so the QR scanner renders and a
    // synthetic onBarcodeScanned can be driven through the real parser under Jest
    // (Phase-3 ship 3 — the camera can't be CI/Maestro-driven).
    "<rootDir>/jest/setup-expo-camera.ts",
    // setup-calendar-kit mocks @howljs/calendar-kit (a Reanimated/worklet grid
    // with no off-device runtime) so the calendar screen renders through the
    // chrome seam and its renderEvent→tile wiring is provable under Jest
    // (Phase-04 — the Reanimated grid can't be CI/Maestro-driven).
    "<rootDir>/jest/setup-calendar-kit.ts",
  ],
  // Tests are colocated as *.test.ts(x) next to the source they cover.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    // Codegen-owned (Orval) — not hand-written, excluded from coverage like from lint.
    "!src/api/generated/**",
    // Type-only declaration files carry no runtime code to cover (the typed-key
    // augmentation, the migrations bundle types) — they would report 0% as pure
    // noise. Excluded with reason, not silently.
    "!src/**/*.d.ts",
    // E2E-covered, not unit-covered — by design (Architecture Book "Testing"):
    //  - src/api/{mutator,config}: the customFetch seam component tests mock and
    //    the base-URL constant; the seam is proven end to end by the Maestro
    //    round-trip, never executed under Jest (tests stub at the mutator).
    //  - src/app/**: route entrypoints / layout wiring — thin `export default`
    //    re-exports over @/components (route-screen rule) and the root layout;
    //    exercised by the Maestro app launch, not unit tests.
    "!src/api/mutator.ts",
    "!src/api/config.ts",
    "!src/app/**",
  ],
  // K-3 coverage gate, enforced (ADR 003 — revisit fired 2026-06-14, wired by
  // the Settings prefs feature that owns it, per ADR 004). High bar where bugs
  // hide; presentational covered by behavior tests but exempt from the 90%:
  //  - logic globs at 90% lines+branches (features [minus ui/ screens], hooks,
  //    storage, db, theme, i18n, firebase — the domain/logic seams);
  //  - 70% global floor for the remainder (presentational feature ui/ screens +
  //    the shared src/components primitives/shell incl. the chrome wrappers —
  //    exempt from the 90% per ADR 003).
  // Re-export barrels are imported by the suites, so they self-cover at 100%
  // and need no special handling.
  coverageThreshold: {
    global: { lines: 70, branches: 70 },
    // Logic sublayers (data/store/form/prefs + the feature barrels) are 90%-gated;
    // the presentational ui/ screens that moved in from src/components fall to the
    // global 70% floor instead (ADR 003 — screens are exempt from the 90% logic
    // gate). We EXCLUDE ui from the broad glob (the `!(ui)` extglob) rather than
    // overlay a separate 70 key, because Jest coverage thresholds are ADDITIVE, not
    // most-specific-wins: an overlay key wouldn't exempt ui from this 90 group (it
    // gets checked against BOTH) and would also evict ui from the global pool. With
    // ui excluded, the screens land in `global` — the same posture they had in
    // src/components, which also keeps the global pool (they're well-tested) ≥70.
    "src/features/*/!(ui)/**": { lines: 90, branches: 90 },
    "src/hooks/**": { lines: 90, branches: 90 },
    "src/storage/**": { lines: 90, branches: 90 },
    "src/db/**": { lines: 90, branches: 90 },
    "src/i18n/**": { lines: 90, branches: 90 },
    "src/firebase/**": { lines: 90, branches: 90 },
    "src/theme/**": { lines: 90, branches: 90 },
  },
}
