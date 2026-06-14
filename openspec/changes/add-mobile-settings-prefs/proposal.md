# Settings preferences store: MMKV-backed theme + language prefs, reactive storage hook, K-3 coverage gate

## Why

Phase 2 opens with **Settings** (ADR [004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md)),
the first feature past the foundation — chosen first because it is the simplest logic-bearing
feature and stresses exactly one new axis: **local KV-backed application preferences**. This
change builds Settings' **data/logic layer only** — the persisted preference store, the reactive
hooks features read, and the wiring of those prefs into the theme and i18n seams the foundation
left as "single-file change" extension points. **The Settings screen/UI (native controls, a
route) is a separate issue (A2/TIM-131) and is explicitly out of scope here** — this change ships
no screen, no route, no native control.

It also lands two firsts the foundation deliberately deferred to "the first logic-bearing
feature":

- **The repo's first feature folder** (`mobile/src/features/settings/`). This sets the
  feature-module pattern the rest of Phase 2/2.5 copies and that the golden-path exemplar will
  later harden; `eslint-plugin-boundaries` (TIM-135/D1) lands the import-boundary enforcement on
  top of this shape afterward.
- **The K-3 coverage threshold** (ADR [003](../../../.claude/rules/mobile/decisions/003-coverage-threshold.md)),
  which was reported-but-unenforced from day one precisely so the gate would have a baseline to
  land on. ADR 003 names Settings as its owner; its revisit fires with this change.

The two preferences (theme override, language override) are the natural first persisted keys:
both close a foundation loose end — the theme single-scheme seam (C1) and the i18n device-only
locale were each documented as "Settings' future override is a single-file change," and this is
that change.

## What Changes

- **First feature folder — `mobile/src/features/settings/`** — establishing the feature-module
  shape: a `prefs/` data/logic layer (the store, the typed preference enums, the reactive hooks).
  No screen, no route (A2 owns those).
- **MMKV-backed prefs store** for two preferences behind the `@/storage` seam:
  - `ThemePreference = "system" | "light" | "dark"` (default `"system"`), persisted under the
    flat key `settings.themePreference`.
  - `LanguagePreference = "system" | "fr" | "en"` (default `"system"`), persisted under
    `settings.languagePreference`.
  - Raw stored strings are **defensively validated** into the enums (unknown / missing / corrupt
    → the `"system"` default), so a bad write can never crash a read.
- **Minimal reactive extension to the `@/storage` seam** — `useStoredString(key)`, a reactive
  read bound to the seam's module-scoped MMKV instance (MMKV v4's `useMMKVString(key, instance)`
  over `useSyncExternalStore`). Earned now (R-2) because app-wide preference changes must
  re-render; the settings hooks build on it. `react-native-mmkv` stays banned outside the seam
  (lint), so the reactive hook **must** live in `src/storage/` — feature code never imports the
  backend.
- **Theme wiring (C1 seam)** — `@/hooks/use-color-scheme` resolves the theme override: a stored
  `"light"`/`"dark"` wins; `"system"` falls through to the device `useColorScheme()`. The seam's
  return contract (`ColorSchemeName = "light" | "dark" | "unspecified"`) is **preserved**, so
  `useTheme`'s existing `unspecified → light` mapping is untouched and `theme.test.tsx` still
  passes. This is the single-file override the foundation promised.
- **i18n wiring** — (a) **startup**: `src/i18n/index.ts` resolves the initial `lng` from the
  stored language override if `"fr"`/`"en"`, else `detectLocale()`; (b) **runtime**: a
  `useLanguagePreference()` hook exposes the current preference + a setter that persists the pref
  **and** calls `i18n.changeLanguage(resolved)`. The dependency direction
  (`@/i18n` → settings → `@/storage`) is a clean DAG (no cycle).
- **K-3 coverage threshold wired (ADR 003, R-1)** — `mobile/jest.config.js` gains a
  `coverageThreshold`: **90% lines + branches** on the logic paths (the new
  `src/features/settings/**`, plus the existing logic seams `src/hooks/**`, `src/storage/**`,
  `src/db/**`, `src/theme/**`, `src/i18n/**`, `src/firebase/**`), **70% global** floor;
  presentational paths (`src/components/**`, `src/app/**`) are exempt. To make the logic glob
  green, this change also **adds the missing `use-app-ready.ts` test** (currently 0%) and closes
  the two branch gaps the logic glob would otherwise expose (`use-theme.ts` line 11's
  `unspecified → light` branch; `migrate.ts` line 23's error branch). `ci-mobile.yml`'s
  "no coverageThreshold yet" comment is updated; ADR 003's status flips to enforced (revisit
  fired).
- **Architecture Book** gains a **"Settings preferences"** section (and a short feature-folder
  note) and a **changelog** entry; **ADR 009** records the feature-folder + "Settings owns app
  preferences, consumed by infra seams" decision; ADR 003 is edited in place. Roadmap
  `02-pattern-establishment.md` notes Feature A's data layer landed.

## Capabilities

### New Capabilities

- `mobile-settings-prefs`: the Settings feature's persisted-preferences layer — the
  `src/features/settings/prefs/` store (typed theme + language preference enums, defensive
  validation, MMKV-backed read/write through `@/storage`), the reactive hooks features read
  (`useThemePreference`, `useLanguagePreference`), the reactive `@/storage` seam extension
  (`useStoredString`), the wiring of the preferences into the theme single-scheme seam (C1) and
  the i18n runtime (startup locale + runtime `changeLanguage`), and the K-3 `coverageThreshold`
  now enforced. CI proves the store/hooks/wiring; the UI to set the preferences is A2.

### Modified Capabilities

<!-- none. No existing capability's requirements change. mobile-architecture-book gains a
"Settings preferences" section — normal book evolution per R-1. The reactive `useStoredString`
helper extends the `mobile-storage` seam, but it is consumed by and owned by this new
capability's preference layer (the seam dir merely hosts it to satisfy the import-ban); it does
not change mobile-storage's existing requirements. The K-3 coverage threshold is the wiring of
ADR 003, owned here per ADR 004 — it gates the mobile-test-harness surface but is the
deliberately-deferred gate this feature was assigned, not a change to that capability's contract. -->

## Impact

- `mobile/`: new `src/features/settings/` (the first feature folder) with `prefs/` (store + typed
  enums + `useThemePreference` / `useLanguagePreference` hooks + tests); `src/storage/index.ts`
  gains `useStoredString` (reactive); `src/hooks/use-color-scheme.ts` resolves the theme override;
  `src/i18n/index.ts` resolves the startup locale from the stored pref; tests added for
  `use-app-ready.ts` and the two branch gaps (`use-theme.ts`, `migrate.ts`);
  `jest.config.js` gains `coverageThreshold`.
- `.claude/rules/mobile/architecture.md`: "Settings preferences" section added (+ feature-folder
  note); `.claude/rules/mobile/architecture-changelog.md`: entry appended;
  `.claude/rules/mobile/decisions/009-settings-feature-prefs.md`: new ADR + README index row;
  `.claude/rules/mobile/decisions/003-coverage-threshold.md`: status flipped to enforced.
- `.github/workflows/ci-mobile.yml`: the "no coverageThreshold yet" comment updated (the
  `npm test -- --coverage` step is unchanged — the gate now lives in `jest.config.js`).
- `docs/react-native-migration/01-roadmap/02-pattern-establishment.md`: Feature A data-layer
  note.
- **No new dependency** — `react-native-mmkv` v4 (with its reactive hooks) is already installed
  by the storage change.
- **No native config change, no `app.config.ts` change, no `prebuild` needed** — this is pure JS
  logic + test config. No OpenAPI change. No server/web/`app/` code touched.
- **No human-only prerequisite** — no console, credentials, or store action; no inbox handoff.
- **No new user-facing string this change** — the store has no UI; the language values map to
  existing locale codes, not displayed labels (those land with the A2 screen). i18n DoD is
  trivially satisfied (no string added); A2 adds FR+EN labels for the controls.
