// https://docs.expo.dev/guides/using-eslint/
// Rule rationale: .claude/rules/mobile/architecture.md (lint/format section)
const { fixupPluginRules } = require("@eslint/compat")
const { defineConfig, globalIgnores } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const i18next = require("eslint-plugin-i18next")
const prettierRecommended = require("eslint-plugin-prettier/recommended")
const reactNativeA11y = require("eslint-plugin-react-native-a11y")

// Codegen-owned (Orval): exempt from hand-written-code rules, formatting still applies.
const generatedCode = "src/api/generated/**"

// The ../* ban below is what makes @/-prefixed boundary patterns sound:
// with parent-relative imports banned, the alias is the only way to cross
// directories, so path patterns can't be evaded by relative spelling.
const restrictedImportPatterns = [
  {
    regex: "^@react-navigation/",
    message:
      "Navigate with Expo Router (expo-router) — direct @react-navigation imports are banned.",
  },
  {
    regex: "^\\.\\./",
    message: "Cross-directory imports must use the @/ alias.",
  },
]

const restrictedImportPaths = [
  {
    name: "axios",
    message:
      "No axios in mobile — use the generated client (src/api/generated).",
  },
]

// Storage backends are reachable only through their seams (src/storage/, src/db/).
// Applied below to every file EXCEPT the seam dirs (they are the wrappers), so
// feature code imports @/storage / @/db, never the backend directly (D6).
const storageBackendImportPatterns = [
  {
    regex: "^react-native-mmkv($|/)",
    message:
      "Use the @/storage seam — react-native-mmkv is imported only inside src/storage/.",
  },
  {
    regex: "^expo-sqlite($|/)",
    message: "Use the @/db seam — expo-sqlite is imported only inside src/db/.",
  },
  {
    regex: "^drizzle-orm($|/)",
    message: "Use the @/db seam — drizzle-orm is imported only inside src/db/.",
  },
]

// `banStorageBackends: false` is for the seam dirs (src/storage/, src/db/),
// which legitimately import the backends the ban keeps out of feature code.
const restrictedImports = (
  extraPatterns = [],
  { banStorageBackends = true } = {},
) => [
  "error",
  {
    patterns: [
      ...restrictedImportPatterns,
      ...(banStorageBackends ? storageBackendImportPatterns : []),
      ...extraPatterns,
    ],
    paths: restrictedImportPaths,
  },
]

const restrictedGlobals = [
  {
    name: "fetch",
    message:
      "All HTTP goes through the generated client; only src/api/mutator.ts may call fetch.",
  },
]

module.exports = defineConfig([
  globalIgnores([".expo", "android", "ios", "dist", "expo-env.d.ts"]),
  expoConfig,
  {
    name: "timecalendar/architecture",
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [generatedCode],
    plugins: {
      i18next,
      "react-native-a11y": fixupPluginRules(reactNativeA11y),
    },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-only",
          "jsx-attributes": {
            include: [
              "accessibilityLabel",
              "accessibilityHint",
              "placeholder",
              "title",
              "alt",
            ],
          },
        },
      ],
      "react-native-a11y/has-accessibility-props": "error",
      "react-native-a11y/has-valid-accessibility-descriptors": "error",
      "react-native-a11y/has-valid-accessibility-role": "error",
      "react-native-a11y/no-nested-touchables": "error",
      "no-restricted-imports": restrictedImports(),
      "no-restricted-globals": ["error", ...restrictedGlobals],
    },
  },
  {
    // Route files are entrypoints, not modules: only src/app/ may import @/app/*.
    name: "timecalendar/routes-not-importable",
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    ignores: ["src/app/**", generatedCode],
    rules: {
      "no-restricted-imports": restrictedImports([
        {
          regex: "^@/app(/|$)",
          message:
            "Route files under src/app/ are entrypoints — move shared code to a module and import that instead.",
        },
      ]),
    },
  },
  {
    name: "timecalendar/mutator-owns-fetch",
    files: ["src/api/mutator.ts"],
    rules: {
      // "off" exempts mutator.ts from EVERY restricted global, not just fetch.
      // A severity-only re-config (["error", ...listMinusFetch]) can't express
      // this: with no globals given, flat config inherits the previous options.
      // If restrictedGlobals ever grows past fetch, re-list the others here.
      "no-restricted-globals": "off",
    },
  },
  {
    name: "timecalendar/generated-code",
    files: [generatedCode],
    rules: {
      "@typescript-eslint/no-redeclare": "off",
    },
  },
  {
    // The storage seam dirs ARE the wrappers — they may import the backends
    // (react-native-mmkv / expo-sqlite / drizzle-orm) the ban keeps out of
    // feature code, so re-set no-restricted-imports without the storage ban.
    name: "timecalendar/storage-seams",
    files: ["src/storage/**", "src/db/**"],
    rules: {
      "no-restricted-imports": restrictedImports([], {
        banStorageBackends: false,
      }),
    },
  },
  {
    // Colocated tests assert against literal UI strings on purpose — they're
    // test fixtures, not user-facing copy, and are never translated.
    name: "timecalendar/tests",
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "i18next/no-literal-string": "off",
    },
  },
  prettierRecommended,
])
