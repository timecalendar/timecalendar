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
  setupFilesAfterEnv: [
    "<rootDir>/jest/setup-i18n.ts",
    "<rootDir>/jest/setup-firebase.ts",
    "<rootDir>/jest/setup-db.ts",
    "<rootDir>/jest/setup-storage.ts",
  ],
  // Tests are colocated as *.test.ts(x) next to the source they cover.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    // Codegen-owned (Orval) — not hand-written, excluded from coverage like from lint.
    "!src/api/generated/**",
  ],
  // No coverageThreshold yet — K-3 gate deferred to the first logic-bearing
  // feature (Settings). Coverage is reported in CI (--coverage) so that gate
  // has a baseline to land on.
}
