# Design — Settings preferences store (MMKV-backed theme + language prefs, reactive hook, K-3 gate)

## Context

This opens Phase 2 (pattern establishment) with **Settings, Feature A** (ADR 004) — but only its
**data/logic layer**: the persisted preference store and the hooks features read. The screen and
native controls are A2 (TIM-131). Two foundation loose ends are closed here because Settings is
their named owner:

- **The theme single-scheme seam (C1).** `@/hooks/use-color-scheme` is a bare
  `export { useColorScheme } from "react-native"`; the theming change documented it as the one
  place "Settings' future light/dark/system override is a single-file change" (Architecture Book,
  Theming → C1). This change is that override.
- **The i18n device-only locale.** i18n init is `lng: detectLocale()` with no persisted override;
  the i18n change recorded the in-app switcher/persisted override as "a Settings concern, needs
  the MMKV seam (step 9)." Both seams now exist; this change wires them.
- **The K-3 coverage threshold.** ADR 003 set coverage to reported-but-unenforced and named
  Settings (the first logic-bearing feature) as the owner that wires the gate.

It is also the **repo's first feature folder** — `src/features/settings/` — so it sets the
feature-module shape (the boundary lint, `eslint-plugin-boundaries`, lands on top in TIM-135/D1).

Constraints shaping the design:
- **Seam discipline (lint-enforced).** `react-native-mmkv` is banned outside `src/storage/**` and
  `src/db/**` (`storageBackendImportPatterns`). So any reactive MMKV hook the feature needs **must
  live in the storage seam** — feature code imports `@/storage`, never the backend.
- **The C1 return contract must be preserved.** `useColorScheme()` returns
  `ColorSchemeName = "light" | "dark" | "unspecified"`, and `useTheme` maps `unspecified → light`.
  The override resolver must keep returning that union so `useTheme` and its proof test are
  untouched.
- **No import cycle.** `@/i18n` reading a settings module that reads `@/storage` is a clean DAG.
  The settings prefs module must **not** import `@/i18n` at module top level in a way that closes
  a cycle (i18n → settings → i18n). The startup-locale read is a pure store read (settings →
  storage only); only the *runtime setter* touches `i18n.changeLanguage`, and it does so by
  importing the i18n instance — acceptable because the setter is called from UI/effects, not at
  i18n module-init time.
- **R-1 / R-2 / R-3 / R-4.** Encode the seam (the reactive hook lives in `src/storage/`, not as a
  convention); add only what a consumer needs (two prefs, one reactive helper — no generic
  settings registry, no JSON-object MMKV helper); the load-bearing feature-folder + prefs-consumed-
  by-infra decision earns an ADR.

## Goals / Non-Goals

**Goals:**
- A typed, persisted preference store for theme + language behind `@/storage`, with defensive
  validation (bad/missing value → `"system"` default).
- Reactive hooks (`useThemePreference`, `useLanguagePreference`) so a preference change re-renders
  the app, built on a minimal reactive `@/storage` extension (`useStoredString`).
- The preferences wired into the theme C1 seam (override resolution) and i18n (startup locale +
  runtime `changeLanguage`).
- The repo's first feature folder, setting the module shape.
- The K-3 `coverageThreshold` wired and **green** (ADR 003), including the supporting tests that
  let the logic glob pass.

**Non-Goals:**
- **No Settings screen, no route, no native controls** — A2 (TIM-131). No `src/app/` change.
- **No in-app preview / no persisted preview-only state** beyond the two real prefs.
- **No generic settings registry / schema** — exactly two typed prefs; the next pref is a small
  additive edit, not a framework (R-2).
- **No MMKV encryption / multi-instance / JSON-object helper** — the prefs are non-sensitive enum
  strings; encryption stays the storage change's recorded debt.
- **No `eslint-plugin-boundaries`** — the feature-boundary lint is TIM-135/D1, layered on the
  folder shape this change establishes (the book already defers it to "when feature folders
  exist" — they now exist).
- **No analytics / observability for a pref write** — synchronous in-process MMKV writes (see D6).

## Decisions

### D1 — First feature folder: `src/features/settings/`, prefs as the data/logic layer
The repo has no `src/features/` yet; this change creates it. The shape:
`src/features/settings/prefs/` holds the preference layer — `types.ts` (the two enum unions +
`SETTINGS_KEYS` constants + the parse/validate functions), `store.ts` (imperative get/set over
`@/storage`), and `hooks.ts` (`useThemePreference` / `useLanguagePreference`, reactive). Tests
colocate as `*.test.ts`. This is deliberately a **thin** first folder — one feature's data layer,
not a blessed framework — because the golden-path exemplar is earned in Phase 1.5 from three
features, not declared from one (migration-approach §4). The folder name (`settings`) and the
`prefs/` sub-layer are the convention the next feature copies and the boundary lint (TIM-135)
formalizes.
*Alternatives:* put the store under `src/storage/settings.ts` (rejected — that's the *backend*
seam, not a feature; preferences are Settings' domain, and conflating them blocks the
feature-boundary lint later); a top-level `src/prefs/` (rejected — preferences belong to the
Settings feature per ADR 004, and a cross-feature prefs service is speculative — R-2).

### D2 — Two typed preferences, defensively validated to `"system"`
`ThemePreference = "system" | "light" | "dark"` and `LanguagePreference = "system" | "fr" | "en"`,
both default `"system"`, persisted as their literal string under flat namespaced keys
`settings.themePreference` / `settings.languagePreference` (the i18n flat-key convention applied
to storage keys for greppability). A **read parses the raw `getString` result through a validator**
(`parseThemePreference` / `parseLanguagePreference`): a value not in the union — including
`undefined` (unset) or a corrupt/legacy string — returns `"system"`. This makes a read total: a
bad write, a downgrade, or a hand-edited store can never produce an invalid preference or crash.
`"system"` (not `"light"`/`"en"`) is the default so the app keeps following the device until the
user explicitly overrides — matching the foundation's device-follows posture for both theme and
locale.
*Alternative:* store a boolean "isDark" + "isFrench" (rejected — can't express "follow system" as
a first-class state, which is the whole point of an override); store the *resolved* value
(rejected — then the stored value can't track device changes when set to system).

### D3 — Reactive read lives in the `@/storage` seam: `useStoredString(key)`
Changing theme or language must re-render the whole app (the root layout's scheme read, every
`t()` consumer), so the hooks need a **reactive** store read. MMKV v4 ships reactive hooks
(`useMMKVString(key, instance)`, built on `useSyncExternalStore` over
`addOnValueChangedListener`) — but `react-native-mmkv` is lint-banned outside `src/storage/**`.
So the reactive read is **added to the seam**: `src/storage/index.ts` exports
`useStoredString(key: string): string | undefined`, implemented as
`useMMKVString(key, storage)[0]` bound to the seam's existing module-scoped instance (read-only —
writes still go through the existing imperative `setString`, keeping one write path). This earns
the seam extension now (R-2 — a real consumer exists) and keeps the backend swappable: the
feature imports `@/storage`, never `react-native-mmkv`. The settings `hooks.ts` composes
`useStoredString(SETTINGS_KEYS.theme)` → `parseThemePreference(...)` to expose
`{ preference, setPreference }`.
*Alternatives:* expose the raw MMKV `instance` from the seam and let the feature call
`useMMKVString` (rejected — that re-imports the banned backend at the call site, defeating the
seam and the lint); a hand-rolled `useSyncExternalStore` listener in the feature (rejected — MMKV
v4's hook *is* that, correctly, and duplicating it outside the seam still needs the banned
`addOnValueChangedListener`); poll/Context (rejected — MMKV's listener is the native-correct
reactive source). Only `useStoredString` is added (not boolean/number reactive variants) — no
consumer needs them yet (R-2).

### D4 — Theme override resolved in the C1 seam (`@/hooks/use-color-scheme`)
`@/hooks/use-color-scheme` becomes the resolver: it reads the device scheme
(`useColorScheme` from `react-native`) **and** the stored theme preference (via the settings hook
→ `useStoredString`), returning the override when the preference is `"light"`/`"dark"`, else the
device value. **The return type stays `ColorSchemeName`** (`"light" | "dark" | "unspecified"`) so
`useTheme`'s `unspecified → light` mapping and `buildNavTheme`'s call in `_layout.tsx` are
unchanged — this is the C1 promise (one file changes, everything downstream inherits it). Concretely
the seam imports the settings hook; the import direction `@/hooks/use-color-scheme` →
`@/features/settings` is the deliberate infra-consumes-feature edge recorded in D8/ADR 009.
*Alternative:* resolve the override inside `useTheme` (rejected — C1 explicitly designates
`use-color-scheme` as the single seam so *both* `useTheme` and the root layout inherit the
override from one place; resolving in `useTheme` would leave the layout's direct scheme read
un-overridden); a Context provider for theme (rejected — the C1 seam already is the single source;
a provider is the speculative heavier alternative the theming change rejected).

### D5 — i18n wiring: startup locale from the store, runtime via `changeLanguage`
Two halves:
- **Startup** — `src/i18n/index.ts` resolves the initial `lng` as: stored language preference if
  `"fr"`/`"en"`, else `detectLocale()`. The read is a **pure store read** (a small
  `getInitialLocale()` that imports the settings store, which imports `@/storage` only) — no
  `i18n` import, so no cycle. The store read at init is synchronous (MMKV is synchronous), matching
  i18n's synchronous-init contract.
- **Runtime** — `useLanguagePreference()` returns `{ preference, setPreference }`; `setPreference`
  persists the pref through `setString` **and** calls `i18n.changeLanguage(resolved)` where
  `resolved` is the pref if `"fr"`/`"en"` else `detectLocale()`. Importing the `i18n` default
  instance inside the *setter* (not at the settings module's top level, and not from the startup
  read path) keeps the dependency graph a DAG: `@/i18n` (init) → settings store → `@/storage`;
  settings setter → `@/i18n` instance. The setter is only ever invoked from UI/effects (A2's
  screen), well after init, so the instance is fully initialized.
*Alternative:* a `LanguageDetector` plugin on i18next reading MMKV (rejected — heavier, and
i18next's async detector contract fights the synchronous-init posture the i18n change chose; a
plain `getInitialLocale()` is the proportionate tool); re-init i18n on change (rejected —
`changeLanguage` is the supported runtime switch and re-renders `t()` consumers).

### D6 — Observability is ➖ N/A for the prefs layer (recorded)
MMKV reads/writes are **synchronous, in-process, and infallible by API** (no throw, no async
failure path — a missing key returns `undefined`, which the validators turn into the default).
There is no error path to record, so wiring `@/firebase` here would be cargo-cult (unlike the
migration runner, where `migrate()` genuinely can throw). Recorded as N/A-with-reason in the DoD,
not a silent skip. If a future pref needs validation that *can* fail meaningfully (e.g. a parsed
JSON blob), that consumer earns the error path.

### D7 — K-3 coverage threshold: per-path 90% logic / 70% global, with the supporting tests
ADR 003 wants 90% lines+branches on logic, 70% global floor, presentational exempt. Implemented in
`jest.config.js` as a `coverageThreshold` map:
- A **`global`** entry at 70% (lines + branches).
- A **logic glob** at 90% (lines + branches) covering the paths where bugs hide:
  `src/features/**`, `src/hooks/**`, `src/storage/**`, `src/db/**`, `src/theme/**`, `src/i18n/**`,
  `src/firebase/**`. (Jest `coverageThreshold` keys are glob/path prefixes; the implementer
  confirms the exact key form Jest accepts — a `"src/hooks/**"` glob or per-directory keys — and
  uses whichever the installed Jest validates, recorded in tasks.)
- Presentational paths (`src/components/**`, `src/app/**`) fall only under the 70% global floor
  (exempt from 90%), per ADR 003.

**The gate cannot go green without three supporting test additions** (measured baseline: the
logic glob today has `use-app-ready.ts` at 0%, plus two 50%-branch files):
1. `src/hooks/use-app-ready.test.ts` — genuine logic (the readiness gate + the watchdog timeout +
   the `ready`/not-ready branches). Drive `prerequisitesReady` true (mount → ready) and exercise
   the watchdog path with fake timers. Brings `use-app-ready.ts` from 0% to ≥90% lines+branches.
2. The `use-theme.ts` `unspecified → light` branch (line 11) — add a `theme.test.tsx` case with
   `useColorScheme` mocked to `"unspecified"`, asserting it resolves the **light** tokens. Closes
   the 50%→100% branch gap.
3. The `migrate.ts` error branch (line 23) — add a `migrate.test.ts` case where `migrate()`
   rejects, asserting the error is recorded through `@/firebase`. Closes the 50%→100% branch gap.

The **new settings logic** (store, validators, hooks) ships with its own tests at ≥90% as the
feature's proof. This makes the gate honest — it lands on a green baseline rather than failing CI
on the day it's introduced. **The highest-risk task is verifying `npm test -- --coverage` passes
the threshold locally** before the change is handed off.
*Alternative:* scope the logic glob to exclude the unmet files (rejected — `use-app-ready.ts` is
real logic that *should* be tested; excluding it to dodge the gate is exactly the cargo-cult ADR
003's revisit clause warns against. We test it instead). Set only a global 70% (rejected — ADR
003's whole point is the high bar on logic; a flat global lets a thoroughly-tested UI mask
untested logic).

### D8 — The infra-consumes-feature import direction is the deliberate, recorded choice
`@/hooks/use-color-scheme` (infra seam) and `@/i18n` (infra) consuming `@/features/settings` is
**backwards** from the usual feature→infra direction. It is accepted now and recorded (ADR 009)
because: (a) preferences are semantically the **Settings feature's domain** (ADR 004 — Settings
owns local prefs), not an infra concern, so the store rightly lives in the feature; (b) there is
**no feature-boundary lint yet** (TIM-135/D1 adds `eslint-plugin-boundaries`), so nothing is
violated today; (c) the alternative — a separate infra-level prefs service the feature wraps —
would be the speculative cross-feature abstraction R-2 forbids from a sample size of one. The edge
is a clean DAG (no cycle, D4/D5). **Revisit when `eslint-plugin-boundaries` lands**: either the
boundary config explicitly allows infra→`features/settings/prefs` (a documented seam), or the
prefs store is promoted to an infra-level module — that decision is TIM-135's, informed by whether
a second feature also needs cross-cutting prefs. Recorded so TIM-135 inherits the open question
rather than discovering the edge.

## Risks / Trade-offs

- **Coverage gate fails CI on landing (highest risk).** The threshold is meaningless if it isn't
  green. Mitigated by D7's three supporting tests + the explicit "verify the gate passes locally"
  task; the implementer runs `npm test -- --coverage` and reads the per-path table before handoff.
  If a logic path still falls short, the recorded fallback is to test it (not to exclude it) — and
  if a path is genuinely untestable in Jest, exclude it from the glob **with a recorded reason**
  in `jest.config.js`, not silently.
- **Reactive hook in the seam vs. the seam's "minimal API" posture.** Adding `useStoredString`
  grows the seam. Mitigated: it's a single read-only reactive helper backed by MMKV's own hook,
  earned by a real consumer (R-2), and keeps the backend un-leaked — the lint boundary is the
  reason it lives there at all.
- **Import-direction backwardness (infra→feature).** Mitigated by D8/ADR 009 (recorded, DAG-clean,
  revisit pinned to the boundary-lint change). The risk is that TIM-135 finds the edge
  inconvenient; recording it now means it's a known decision to revisit, not a surprise.
- **i18n init reads MMKV synchronously at startup.** MMKV is synchronous, so this is safe; but it
  adds a store read to the i18n init path. Mitigated: the read is a single `getString` (fast,
  no native round-trip beyond JSI), and falls back to `detectLocale()` on any non-`fr`/`en` value.
  The Jest i18n setup already runs init; tasks confirm `setup-storage` ordering so the store read
  resolves under test (MMKV's in-memory mock returns `undefined` → `detectLocale()`).
- **`changeLanguage` re-render scope.** Switching language re-renders every `t()` consumer; this
  is the intended behavior. No risk beyond a brief re-render, exercised by the hook test.

## Migration Plan

Additive; rollback = revert (no schema, no native, no data — MMKV keys simply go unread). Order:
create `src/features/settings/prefs/` (`types.ts` → `store.ts` → `hooks.ts` + tests) → add
`useStoredString` to `src/storage/index.ts` (+ test) → wire `@/hooks/use-color-scheme` (theme
override, preserve `ColorSchemeName`) → wire `src/i18n/index.ts` startup locale + the runtime
setter → add the three supporting tests (`use-app-ready`, `use-theme` branch, `migrate` branch) →
wire `coverageThreshold` in `jest.config.js` → **verify `npm test -- --coverage` passes the gate**
→ update `ci-mobile.yml` comment, ADR 003 (in place), ADR 009 (new), Architecture Book + changelog,
roadmap. Gate on `npx tsc --noEmit`, `npm run lint` (zero warnings), `npm test` (+ coverage gate).
No `prebuild`, no native change, no OpenAPI regen.

## Open Questions

None blocking. Deferred (recorded, not built): the Settings **screen / native controls / route**
(A2/TIM-131); a `LanguageDetector` i18next plugin (D5 — proportionate `getInitialLocale()` chosen);
reactive boolean/number seam variants (D3 — added when a consumer needs them); the feature-boundary
lint and the infra→feature edge resolution (TIM-135/D1, D8); MMKV encryption for sensitive prefs
(storage change debt — these prefs are non-sensitive); a generic settings registry (R-2 — two
typed prefs suffice).
