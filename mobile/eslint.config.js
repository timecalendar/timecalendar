// https://docs.expo.dev/guides/using-eslint/
// Rule rationale: .claude/rules/mobile/architecture.md (lint/format section)
const { fixupPluginRules } = require("@eslint/compat")
const { defineConfig, globalIgnores } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const i18next = require("eslint-plugin-i18next")
const prettierRecommended = require("eslint-plugin-prettier/recommended")
const reactNativeA11y = require("eslint-plugin-react-native-a11y")
const simpleImportSort = require("eslint-plugin-simple-import-sort")

// Canonical import/export order (autofixable). Groups here are disjoint, so the
// longest-match-wins tie-break never bites, and no bare "^" catch-all is used —
// every import here is a side-effect, a package,
// "@/…", or "./…" ("../" is banned), so nothing orphans. Side-effects sit at the
// top and keep their relative order (reordering side-effects could change
// behavior — e.g. the `import "@/i18n"` init seam in src/app/_layout.tsx).
const importSortGroups = [
  // 1. Side-effect imports (import "@/i18n").
  ["^\\u0000"],
  // 2. Node builtins + third-party packages. `@/theme` is NOT matched here (the
  //    `/` after `@` fails `\w`), so it falls to group 3; `@scope/pkg` matches.
  ["^node:", "^@?\\w"],
  // 3. The `@/` alias — our internal modules.
  ["^@/"],
  // 4. Relative imports (only `./…`; `../` is lint-banned).
  ["^\\."],
]

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

// Alpha native-chrome APIs are reachable only through their wrappers
// (src/components/chrome/). Applied below to every file EXCEPT the chrome dir
// (the wrappers ARE the single import site), so feature/route code imports
// @/components/chrome, never the churning alpha API directly (D4). Caveat: this
// catches the static import specifier, not a dynamic require()/import() evasion
// — it guards accident, review covers adversaries (same posture as raw-fetch).
const chromeAlphaImportPatterns = [
  {
    regex: "^expo-router/unstable-native-tabs($|/)",
    message:
      "Use the @/components/chrome seam — expo-router/unstable-native-tabs is imported only inside src/components/chrome/.",
  },
  {
    regex: "^expo-glass-effect($|/)",
    message:
      "Use the @/components/chrome seam — expo-glass-effect is imported only inside src/components/chrome/.",
  },
  {
    regex: "^@expo/ui($|/)",
    message:
      "Use the @/components/chrome seam — @expo/ui is imported only inside src/components/chrome/.",
  },
]

// `banStorageBackends: false` / `banChromeAlpha: false` are for the seam dirs
// (src/storage/, src/db/, src/components/chrome/), which legitimately import the
// backends/alpha APIs the bans keep out of feature code.
const restrictedImports = (
  extraPatterns = [],
  { banStorageBackends = true, banChromeAlpha = true } = {},
) => [
  "error",
  {
    patterns: [
      ...restrictedImportPatterns,
      ...(banStorageBackends ? storageBackendImportPatterns : []),
      ...(banChromeAlpha ? chromeAlphaImportPatterns : []),
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
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": ["error", { groups: importSortGroups }],
      "simple-import-sort/exports": "error",
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
    // The chrome wrappers ARE the seam — each is the single import site for one
    // alpha native-chrome API (expo-router/unstable-native-tabs, expo-glass-effect,
    // @expo/ui) the ban keeps out of feature/route code, so re-set
    // no-restricted-imports without the chrome-alpha ban (mirrors storage-seams).
    name: "timecalendar/chrome-seams",
    files: ["src/components/chrome/**"],
    rules: {
      "no-restricted-imports": restrictedImports([], {
        banChromeAlpha: false,
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
