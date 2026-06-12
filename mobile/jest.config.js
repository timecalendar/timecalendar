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
