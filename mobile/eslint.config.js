// https://docs.expo.dev/guides/using-eslint/
// Rule rationale: docs/mobile/architecture-book/architecture.md (lint/format section)
const { fixupPluginRules } = require("@eslint/compat")
const { defineConfig, globalIgnores } = require("eslint/config")
const boundaries = require("eslint-plugin-boundaries")
const expoConfig = require("eslint-config-expo/flat")
const i18next = require("eslint-plugin-i18next")
const prettierRecommended = require("eslint-plugin-prettier/recommended")
const reactNativeA11y = require("eslint-plugin-react-native-a11y")
const simpleImportSort = require("eslint-plugin-simple-import-sort")

const localRules = require("./tools/eslint-rules")
const {
  adHocStatusAllowlist,
} = require("./tools/eslint-rules/ad-hoc-status-allowlist")
const {
  rawButtonAllowlist,
} = require("./tools/eslint-rules/raw-button-allowlist")

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

// The other half of the Activity seam (TIM-397 / ADR 048): SQLite is the
// authoritative source for rendered Activity history and unread metadata, so the
// tables have exactly one writer. B-1 lets any feature's data/ import @/db, so
// only a NAMED-import ban confines these two tables to the Activity data layer.
// `importNames` is why this is a `paths` entry and not a `patterns` regex —
// every feature legitimately imports @/db, just not these bindings.
const dbActivityTablesImportPath = {
  name: "@/db",
  importNames: ["activityLogs", "activityState"],
  message:
    "Use the @/features/activity/data seam — the Activity tables are read and written only inside src/features/activity/data/ (TIM-397 / ADR 048).",
}

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

// Imports reachable only through a chrome wrapper (src/components/chrome/) — the
// single-import-site mechanism. Applied below to every file EXCEPT the chrome
// dir (the wrappers ARE the single import site), so feature/route code imports
// @/components/chrome, never the wrapped library directly. These are alpha
// native-chrome APIs banned for churn. Caveat: this catches the static import
// specifier, not a dynamic require()/import() evasion — it guards accident,
// review covers adversaries (same posture as raw-fetch).
const chromeSeamImportPatterns = [
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

// The Activity refresh seam is the SINGLE issuer of calendar-log requests
// (TIM-397 / ADR 048): every trigger — calendar sync, push, screen open,
// foreground — goes through @/features/activity/data so four triggers can never
// become four requests. That duplication is the capacity risk that got Activity
// switched off in the first place.
//
// B-1 does NOT already cover this. B-1 is SUBLAYER-scoped ("only a feature's
// data/ sublayer may import @/api/generated/**"), so it permits ANY feature's
// data/ to reach the calendar-log client. The restriction wanted here is to ONE
// feature's data/, which the `boundaries` plugin cannot express against a file
// inside a single element — hence the seam-ban idiom used here.
const activityClientImportPattern = {
  regex: "^@/api/generated/calendar-logs($|/)",
  message:
    "Use the @/features/activity/data seam — the generated calendar-log client is imported only inside src/features/activity/data/ (TIM-397 / ADR 048).",
}

const exportGuideClientImportPattern = {
  regex: "^@/api/generated/export-guides($|/)",
  message:
    "Use the @/features/export-guides/data seam — the generated export-guide client is imported only inside src/features/export-guides/data/.",
}

// The single color-scheme seam (C1): @/hooks/use-color-scheme resolves the
// Settings theme override, so reading the device scheme anywhere else renders the
// wrong theme whenever the user has picked one.
const deviceColorSchemeImportPath = {
  name: "react-native",
  importNames: ["useColorScheme", "Appearance"],
  message:
    "Read the color scheme through @/hooks/use-color-scheme — it resolves the Settings theme override (C1). react-native's useColorScheme/Appearance are imported only inside src/hooks/use-color-scheme.ts.",
}

const deviceColorSchemeDeepImportPattern = {
  regex:
    "^react-native/Libraries/Utilities/(Appearance|useColorScheme)($|[./])",
  message: deviceColorSchemeImportPath.message,
}

// The environment selector's single home is the developer page (navigation.md →
// Developer page): Settings keeps one gated row to it, never the selector itself.
const developerToolsImportPath = {
  name: "@/features/environment",
  importNames: [
    "useEnvironmentSelector",
    "EnvironmentSettingsRow",
    "EnvironmentSelectorDialog",
  ],
  message:
    "The environment selector lives on the developer page — mount it from src/features/developer/ui only (navigation.md → Developer page).",
}

const developerToolsDeepImportPattern = {
  regex: "^@/features/environment/ui($|/)",
  importNames: [
    "useEnvironmentSelector",
    "EnvironmentSettingsRow",
    "EnvironmentSelectorDialog",
  ],
  message: developerToolsImportPath.message,
}

const designDeepImportPattern = {
  regex: "^@/design/(?!gallery(/|$))",
  message:
    "Import the design system through the @/design barrel (design-system-proposal §3, lint-format.md → Design layer).",
}

const galleryEntryImportPattern = {
  regex: "^@/design/gallery(/|$)",
  message:
    "The component gallery is developer-only: import @/design/gallery only from src/features/developer, fixtures and src/design/gallery (ADR 068).",
}

// Design primitives and chrome import design leaves by path: the barrel would
// close a require cycle (design/index → root-page → chrome → design/index).
const designBarrelImportPattern = {
  regex: "^@/design$",
  message:
    "Import the design module by its leaf path (@/design/<folder>/<file>), not the @/design barrel — the barrel would close a require cycle (ADR 068, lint-format.md → Design layer).",
}

// L9: every symbol icon declares its text scaling through the Icon primitive
// (accessibility.md → Icon scaling, ADR 065). Type imports stay allowed.
const symbolViewImportPath = {
  name: "expo-symbols",
  importNames: ["SymbolView"],
  message:
    "Render icons through Icon from @/design (accessibility.md → Icon scaling).",
}

// Buttons are the shared Button (ADR 067, lint-format.md → Buttons). No file
// uses these, so the ban carries no flag and no seam exemption.
const rawTouchablesImportPath = {
  name: "react-native",
  importNames: [
    "Button",
    "TouchableOpacity",
    "TouchableHighlight",
    "TouchableWithoutFeedback",
    "TouchableNativeFeedback",
  ],
  message: "Use Button from @/design (ADR 067, lint-format.md → Buttons).",
}

// L11: zone offsets come from the instant (lint-format.md → L11).
const zoneOffsetTrapImportPath = {
  name: "date-fns-tz",
  importNames: ["getTimezoneOffset"],
  message:
    "getTimezoneOffset reads device-local Date fields; use zoneOffsetMinutes from @/features/calendar/data (lint-format.md → L11).",
}

// Route files are entrypoints, not modules. Named (rather than inlined in the
// block that applies it) because several blocks re-include it: any block that
// re-sets `no-restricted-imports` for files under src/ has to carry it forward,
// since flat-config options REPLACE rather than merge.
const routeEntrypointImportPattern = {
  regex: "^@/app(/|$)",
  message:
    "Route files under src/app/ are entrypoints — move shared code to a module and import that instead.",
}

// The DIRECTION of the Activity ↔ calendar-sources edge (TIM-399 / ADR 049 D7).
// `activity/data/request.ts` imports @/features/calendar-sources/data, so an
// import the other way closes a module require cycle. Its failure mode under
// Metro is a binding that is `undefined` at module-init time — invisible to tsc,
// invisible to the boundaries plugin (which governs sublayer shape, not cycles
// between two named features), and dependent on import order, so it is exactly
// the kind of edge that has to fail at lint time or not at all.
//
// The prune that would otherwise want this import is inverted instead:
// `useActivityOwnershipPrune` lives in the Activity feature and OBSERVES the
// held-calendar set.
const activityFeatureImportPattern = {
  regex: "^@/features/activity($|/)",
  message:
    "calendar-sources is a leaf: it must not import @/features/activity — the Activity data layer imports calendar-sources, so the reverse edge closes a module cycle whose failure mode is an `undefined` binding at Metro module init, invisible to tsc (TIM-399 / ADR 049). Observe the removal from the Activity side (useActivityOwnershipPrune).",
}

// False options belong only to the exact seam dirs/files that legitimately import
// the backends or wrapped APIs kept out of the rest of the app.
const restrictedImports = (
  extraPatterns = [],
  {
    banStorageBackends = true,
    banChromeSeam = true,
    banActivitySeam = true,
    banExportGuideSeam = true,
    banDeviceColorScheme = true,
    banDeveloperTools = true,
    banDesignDeepImports = true,
    banGalleryEntry = true,
    banDesignBarrel = false,
    banSymbolView = true,
    banZoneOffsetTrap = true,
  } = {},
) => [
  "error",
  {
    patterns: [
      ...restrictedImportPatterns,
      ...(banStorageBackends ? storageBackendImportPatterns : []),
      ...(banChromeSeam ? chromeSeamImportPatterns : []),
      ...(banActivitySeam ? [activityClientImportPattern] : []),
      ...(banExportGuideSeam ? [exportGuideClientImportPattern] : []),
      ...(banDeviceColorScheme ? [deviceColorSchemeDeepImportPattern] : []),
      ...(banDeveloperTools ? [developerToolsDeepImportPattern] : []),
      ...(banDesignDeepImports ? [designDeepImportPattern] : []),
      ...(banGalleryEntry ? [galleryEntryImportPattern] : []),
      ...(banDesignBarrel ? [designBarrelImportPattern] : []),
      ...extraPatterns,
    ],
    paths: [
      ...restrictedImportPaths,
      ...(banActivitySeam ? [dbActivityTablesImportPath] : []),
      ...(banDeviceColorScheme ? [deviceColorSchemeImportPath] : []),
      ...(banDeveloperTools ? [developerToolsImportPath] : []),
      ...(banSymbolView ? [symbolViewImportPath] : []),
      ...(banZoneOffsetTrap ? [zoneOffsetTrapImportPath] : []),
      rawTouchablesImportPath,
    ],
  },
]

const restrictedGlobals = [
  {
    name: "fetch",
    message:
      "All HTTP goes through the generated client; only src/api/mutator.ts may call fetch.",
  },
]

// Font scaling is never disabled (accessibility.md → Font scaling). The property
// selector covers spread props (`{...{ allowFontScaling: false }}`, shared
// `textProps`). Flat config REPLACES a rule's options, so any later block that
// sets `no-restricted-syntax` must spread this list or it silently drops the ban.
const restrictedSyntax = [
  "JSXAttribute[name.name='allowFontScaling'][value.expression.value=false]",
  "Property[key.name='allowFontScaling'][value.value=false]",
].map((selector) => ({
  selector,
  message:
    "Text must follow the OS font size — do not disable allowFontScaling. Cap dense UI with maxFontSizeMultiplier instead (accessibility.md → Font scaling).",
}))
restrictedSyntax.push({
  selector: "JSXAttribute[name.name='aria-describedby']",
  message:
    "React Native forwards no described-by relation; fold the error into accessibilityHint with fieldErrorHint (ADR 069)",
})

// Worklet safety (TIM-554). A worklet may only call functions that are
// themselves workletized; a plain JS call throws on the UI thread at runtime and
// neither tsc (a string directive is invisible) nor Jest (Reanimated's mocks run
// on the JS thread) can see it. The rule blesses call targets by name, and
// time-grid.test.ts's "UI-thread (worklet) contract" suite proves every blessed
// name below really carries the directive — lint answers "is this name
// blessed?", the suite answers "is the blessed name actually a worklet?".
const workletSafeImports = {
  "@/features/calendar/data": [
    "clampRawOffset",
    "clampVerticalOffset",
    "clockHourAtFocalPoint",
    "eventHeight",
    "focalPreservingRawOffset",
    "fullDayContentHeight",
    "fullDayMajorMinutes",
    "fullDayMinorMinutes",
    "gridContentHeight",
    "hourLabels",
    "isValidPixelsPerHour",
    "maxVerticalOffset",
    "minutePositionTop",
    "minuteToPixel",
    "rawOffsetBounds",
    "resolvePixelsPerHour",
    "roundToDevicePixel",
    "stepPixelsPerHour",
    "usableViewportCenterY",
  ],
  "./owned-calendar-geometry": ["dayRowHeight"],
  "react-native-reanimated": true,
  "react-native-worklets": true,
}

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
      "no-restricted-syntax": ["error", ...restrictedSyntax],
    },
  },
  {
    // Route files are entrypoints, not modules: only src/app/ may import @/app/*.
    name: "timecalendar/routes-not-importable",
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    ignores: ["src/app/**", generatedCode],
    rules: {
      "no-restricted-imports": restrictedImports([
        routeEntrypointImportPattern,
      ]),
    },
  },
  {
    // Re-includes the route-entrypoint pattern because `routes-not-importable`
    // also matches these files and flat config would otherwise drop the @/app ban.
    name: "timecalendar/developer-tools-home",
    files: ["src/features/developer/**"],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        { banDeveloperTools: false, banGalleryEntry: false },
      ),
    },
  },
  {
    name: "timecalendar/environment-home",
    files: ["src/features/environment/**"],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        { banDeveloperTools: false },
      ),
    },
  },
  {
    // Design primitives import each other by leaf path, never the barrel (ADR 068).
    // Fixtures, tests and the gallery get their own blocks below.
    name: "timecalendar/design-home",
    files: ["src/design/**"],
    ignores: [
      "src/design/gallery/**",
      "**/*.gallery.tsx",
      "**/*.test.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        { banDesignDeepImports: false, banDesignBarrel: true },
      ),
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
    // wrapped native-chrome API (expo-router/unstable-native-tabs, expo-glass-effect,
    // @expo/ui) the ban keeps out of feature/route code, so
    // re-set no-restricted-imports without the chrome-seam ban (mirrors storage-seams).
    // Chrome sits below the design layer: it may import a design leaf, never the
    // @/design barrel (ADR 068). Fixtures get their own block below.
    name: "timecalendar/chrome-seams",
    files: ["src/components/chrome/**"],
    ignores: ["**/*.gallery.tsx", "**/*.gallery.test.tsx"],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        {
          banChromeSeam: false,
          banDesignDeepImports: false,
          banDesignBarrel: true,
        },
      ),
    },
  },
  {
    // The Activity data sublayer IS the seam — the single issuer of calendar-log
    // requests (TIM-397 / ADR 048), so it is the one place that may import the
    // generated client the ban keeps out of every other module.
    name: "timecalendar/activity-seam",
    files: ["src/features/activity/data/**"],
    rules: {
      "no-restricted-imports": restrictedImports([], {
        banActivitySeam: false,
      }),
    },
  },
  {
    name: "timecalendar/export-guide-seam",
    files: ["src/features/export-guides/data/**"],
    rules: {
      "no-restricted-imports": restrictedImports([], {
        banExportGuideSeam: false,
      }),
    },
  },
  {
    // The seam file is the one import site for the device scheme. It re-includes
    // the route-entrypoint pattern because `routes-not-importable` also matches
    // it, and flat config would otherwise drop the @/app ban here.
    name: "timecalendar/color-scheme-seam",
    files: ["src/hooks/use-color-scheme.ts"],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        { banDeviceColorScheme: false },
      ),
    },
  },
  {
    // Fixtures (ADR 064) import gallery types from @/design/gallery. Flat config
    // replaces a rule's options wholesale, so each fixture block restates every
    // flag, and so must any later block that sets this rule on a fixture
    // (calendar-sources-is-a-leaf would, were a fixture to live under
    // src/features/calendar-sources/).
    name: "timecalendar/fixtures",
    files: ["src/**/*.gallery.tsx", "src/**/*.gallery.test.tsx"],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        { banGalleryEntry: false },
      ),
    },
  },
  {
    name: "timecalendar/design-tests",
    files: ["src/design/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        { banDesignDeepImports: false },
      ),
    },
  },
  {
    name: "timecalendar/design-fixtures",
    files: [
      "src/design/**/*.gallery.tsx",
      "src/design/**/*.gallery.test.tsx",
      "src/design/gallery/**",
    ],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        { banDesignDeepImports: false, banGalleryEntry: false },
      ),
    },
  },
  {
    name: "timecalendar/chrome-fixtures",
    files: [
      "src/components/chrome/**/*.gallery.tsx",
      "src/components/chrome/**/*.gallery.test.tsx",
    ],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        {
          banChromeSeam: false,
          banDesignDeepImports: false,
          banGalleryEntry: false,
        },
      ),
    },
  },
  {
    // The Icon primitive is the one SymbolView renderer (L9). Last block for
    // these files, so it restates the design-primitive flags.
    name: "timecalendar/icon-seam",
    files: ["src/design/icon/icon.tsx", "src/design/icon/icon.test.tsx"],
    rules: {
      "no-restricted-imports": restrictedImports(
        [routeEntrypointImportPattern],
        {
          banSymbolView: false,
          banDesignDeepImports: false,
          banDesignBarrel: true,
        },
      ),
    },
  },
  {
    // The other end of that edge (TIM-399 / ADR 049 D7): calendar-sources is a
    // LEAF of the Activity graph and must never import back into it.
    //
    // Unlike every seam block above, this one ADDS a ban for one directory
    // rather than dropping one — so it must re-call `restrictedImports([...])`
    // with the extra patterns, never list its own pattern alone. Flat config
    // REPLACES a rule's options rather than merging them, and
    // `routes-not-importable` (files: ["src/**/*.{js,jsx,ts,tsx}"], which
    // matches these files and does not ignore them) is otherwise the last block
    // to set this rule here. A block listing only the Activity pattern would
    // silently switch off every base seam ban — storage backends, chrome,
    // the generated calendar-log client and @/db's Activity tables —
    // for the whole calendar-sources feature, with `npm run lint` still green.
    // The route-entrypoint pattern is re-included for the same reason.
    //
    // Placed after the seam blocks above so it is the last word for these files;
    // none of them matches src/features/calendar-sources/**.
    name: "timecalendar/calendar-sources-is-a-leaf",
    files: ["src/features/calendar-sources/**"],
    rules: {
      "no-restricted-imports": restrictedImports([
        routeEntrypointImportPattern,
        activityFeatureImportPattern,
      ]),
    },
  },
  {
    // The feature-module import boundaries (ADR 014 / golden-path.md "Seam
    // conventions" + "Barrel discipline"), encoded with eslint-plugin-boundaries.
    // Layers ON TOP of the no-restricted-imports seam bans above — those ban a
    // backend/alpha package by specifier string; this governs the FEATURE-INTERNAL
    // structure (which element may import which) that a string ban can't express.
    //
    // The config file IS the rule's documentation (R-1): the four boundaries are
    //   B-1 — only a feature's data/ sublayer may import @/api/generated/** or @/db;
    //         every OTHER sublayer (ui/ included) must go through a barrel.
    //   B-2 — a feature sublayer must not import its own feature-level barrel (cycle);
    //         it imports a sibling's sub-barrel directly.
    //   B-3 — routes (src/app/**) and src/components/** (the app shell and the
    //         chrome seam) consume a feature through its barrel, never
    //         @/api/generated/** or @/db directly.
    //   B-4 — the ADR-009 infra→feature edge (@/hooks/use-color-scheme and @/i18n
    //         importing @/features/settings/prefs[/store]) is ALLOWED — the absence
    //         of a disallow naming infra-* as `from` is the deliberate resolution.
    //
    // Posture is `default: "allow"` + three targeted disallows (mirrors the
    // enumerate-the-forbidden, leave-the-rest-alone philosophy of the seam bans):
    // a disallow can only forbid the four bad edges, never accidentally forbid a
    // legitimate one. no-unknown / no-unknown-files stay OFF — they would demand
    // every file belong to a named element, a whole-tree taxonomy these four
    // boundaries don't need (design D4).
    //
    // CRITICAL (design D5): boundaries must RESOLVE an import specifier to a file
    // path to classify its target element. The `@/` alias is NOT resolved by the
    // node resolver eslint-config-expo ships, so without the typescript resolver
    // below `import { db } from "@/db"` resolves to nothing and the rule SILENTLY
    // PASSES (a false negative — the dangerous failure mode). The explicit
    // eslint-import-resolver-typescript devDependency + the inject-and-revert
    // verification (the change's tasks §3) guard this.
    name: "timecalendar/feature-boundaries",
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    // Generated code is not a feature; tests import freely.
    ignores: [generatedCode, "**/*.test.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      // Resolve the `@/` alias so target elements can be classified (D5).
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      },
      // The element taxonomy (D2): each pattern matches a folder right-to-left;
      // a file is the FIRST element it matches, so feature-sublayer (deeper)
      // MUST be listed before feature-barrel (shallower).
      "boundaries/elements": [
        {
          type: "feature-sublayer",
          pattern: "src/features/*/*",
          mode: "folder",
          capture: ["feature", "layer"],
        },
        {
          type: "feature-barrel",
          pattern: "src/features/*",
          mode: "folder",
          capture: ["feature"],
        },
        { type: "generated-api", pattern: "src/api/generated", mode: "folder" },
        { type: "db-seam", pattern: "src/db", mode: "folder" },
        { type: "route", pattern: "src/app", mode: "folder" },
        { type: "component", pattern: "src/components", mode: "folder" },
        { type: "design", pattern: "src/design", mode: "folder" },
        {
          type: "infra-color-scheme",
          pattern: "src/hooks/use-color-scheme.*",
          mode: "file",
        },
        { type: "infra-i18n", pattern: "src/i18n", mode: "folder" },
      ],
    },
    rules: {
      // The v6 unified rule — NOT the deprecated element-types/entry-point, which
      // emit a deprecation warning that would fail `expo lint --max-warnings 0`.
      // Object selectors ({ type, captured, internalPath }) + {{ }} templates.
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          rules: [
            {
              // B-1: any sublayer EXCEPT data/ may not reach the seams. The
              // `!(data)` micromatch negation leaves data/ out of `from`, so the
              // data/ sublayer (and only it) may import the generated API / @/db.
              from: {
                type: "feature-sublayer",
                captured: { layer: "!(data)" },
              },
              disallow: { to: { type: ["generated-api", "db-seam"] } },
              message:
                "B-1: only a feature's data/ sublayer may import @/api/generated or @/db — wrap the seam in data/ and re-export (golden-path.md → Seam conventions).",
            },
            {
              // B-3: routes, the app shell and the chrome seam never touch the
              // data seams directly — they consume the feature through its barrel.
              from: { type: ["component", "route"] },
              disallow: { to: { type: ["generated-api", "db-seam"] } },
              message:
                "B-3: screens/routes must consume a feature through its barrel, not @/api/generated or @/db directly (golden-path.md → Seam conventions).",
            },
            {
              // B-3 exception (last-write-wins overrides the disallow above): the
              // root route layout legitimately invokes the STARTUP MIGRATION RUNNER
              // — `void runMigrations()` from @/db/migrate is the documented
              // fire-and-forget startup wiring (Architecture Book → Storage →
              // "Startup migration runner"), mirroring the `import "@/i18n"` seam.
              // This is app infrastructure, not feature-data access: it touches the
              // migration runner (db/migrate.*), never the @/db data-access surface
              // (db/index — operators / tables / useLiveQuery), which stays B-3-banned.
              from: { type: "route" },
              allow: { to: { type: "db-seam", internalPath: "migrate.*" } },
            },
            {
              // B-7: the design layer (primitives and gallery) never knows a
              // product feature or a route.
              from: { type: "design" },
              disallow: {
                to: {
                  type: [
                    "feature-sublayer",
                    "feature-barrel",
                    "route",
                    "generated-api",
                    "db-seam",
                  ],
                },
              },
              message:
                "B-7: src/design/ may not import features, routes, @/api/generated or @/db — it consumes shared seams such as @/theme, @/components/chrome, @/i18n and @/hooks (lint-format.md → Design layer).",
            },
            {
              // B-2 (no cycle): a sublayer may not import ITS OWN feature barrel.
              // The {{ from.feature }} template (v6 Handlebars syntax) binds the
              // SAME feature captured on the `from` side; internalPath "index.*"
              // targets the barrel file — so importing a SIBLING's sub-barrel
              // (a different element) is untouched, only the self-barrel cycle bites.
              from: { type: "feature-sublayer" },
              disallow: {
                to: {
                  type: "feature-barrel",
                  captured: { feature: "{{ from.feature }}" },
                  internalPath: "index.*",
                },
              },
              message:
                "B-2: a feature sublayer must not import its own feature barrel (cycle) — import the sibling sub-barrel directly (golden-path.md → Barrel discipline).",
            },
          ],
        },
      ],
    },
  },
  {
    name: "timecalendar/worklet-safety",
    files: ["src/**/*.{ts,tsx}"],
    plugins: { local: localRules },
    rules: {
      "local/no-js-call-in-worklet": [
        "error",
        { safeImports: workletSafeImports },
      ],
    },
  },
  {
    // Text buttons are the shared Button (ADR 067). The allowlist holds the
    // files not yet migrated; raw-button-allowlist.test.js keeps it shrinking.
    name: "timecalendar/raw-button",
    files: ["src/**/*.tsx"],
    ignores: [
      "src/design/button/button.tsx",
      "src/components/chrome/**",
      "src/features/calendar/renderer/**",
      "**/*.test.tsx",
      ...rawButtonAllowlist,
    ],
    plugins: { local: localRules },
    rules: {
      "local/no-raw-button": "error",
    },
  },
  {
    // Loading and list-empty states are the shared StatusView (ADR 069). The
    // allowlist holds the files not yet migrated; ad-hoc-status-allowlist.test.js
    // keeps it shrinking.
    name: "timecalendar/ad-hoc-status",
    files: ["src/**/*.tsx"],
    ignores: [
      "src/design/**",
      "src/components/chrome/**",
      "src/features/calendar/renderer/**",
      "**/*.test.tsx",
      ...adHocStatusAllowlist,
    ],
    plugins: { local: localRules },
    rules: {
      "local/no-ad-hoc-status": "error",
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
