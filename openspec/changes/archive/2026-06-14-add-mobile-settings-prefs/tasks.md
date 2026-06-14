## 1. First feature folder + preference types (`src/features/settings/prefs/`)

- [x] 1.1 Create the feature folder `mobile/src/features/settings/prefs/`. This is the repo's
  **first** `src/features/` folder — keep it thin (one feature's data layer, not a framework;
  the golden-path exemplar is earned in Phase 1.5, not declared here — design D1).
- [x] 1.2 `prefs/types.ts`: define `ThemePreference = "system" | "light" | "dark"` and
  `LanguagePreference = "system" | "fr" | "en"`; export the flat namespaced storage keys
  (`settings.themePreference`, `settings.languagePreference` — e.g. a `SETTINGS_KEYS` const);
  and **validators** `parseThemePreference(raw: string | undefined): ThemePreference` /
  `parseLanguagePreference(...)` that return `"system"` for any value outside the union
  (unset / corrupt / legacy) — a total read (design D2). No `any`.

## 2. Reactive storage seam extension (`src/storage/index.ts`)

- [x] 2.1 Add `useStoredString(key: string): string | undefined` to `mobile/src/storage/index.ts`,
  implemented over MMKV v4's `useMMKVString(key, storage)` bound to the seam's **existing
  module-scoped instance** (read-only — writes stay on the existing imperative `setString`, one
  write path; design D3). It MUST live in the seam (not the feature) because `react-native-mmkv`
  is lint-banned outside `src/storage/**` / `src/db/**`. Add only the string reactive helper — no
  boolean/number variants until a consumer needs them (R-2). Keep `react-native-mmkv` the only
  backend import (the `timecalendar/storage-seams` eslint block already exempts this dir).

## 3. Preference store + reactive hooks (`src/features/settings/prefs/`)

- [x] 3.1 `prefs/store.ts`: imperative get/set over `@/storage` —
  `getThemePreference()` (= `parseThemePreference(getString(key))`), `setThemePreference(p)`
  (= `setString(key, p)`), and the language equivalents. A pure store-only module (imports
  `@/storage` + `./types`; **no** `@/i18n` import here — keeps the startup read cycle-free,
  design D5). Also export `getInitialLocale()` (stored language pref if `"fr"`/`"en"`, else
  `detectLocale()`) for the i18n startup read — it imports `@/i18n/detect-locale` (a leaf), not
  the i18n instance.
- [x] 3.2 `prefs/hooks.ts`: `useThemePreference()` returns `{ preference, setPreference }` —
  `preference = parseThemePreference(useStoredString(SETTINGS_KEYS.theme))`, `setPreference`
  calls `setThemePreference`. `useLanguagePreference()` same shape, but its `setPreference`
  ALSO calls `i18n.changeLanguage(resolved)` (resolved = pref if `"fr"`/`"en"` else
  `detectLocale()`) — importing the `@/i18n` default instance **inside the setter only** (not at
  module top level; the setter runs from UI/effects, post-init — design D5, DAG preserved).

## 4. Wire the theme override (C1 seam — `src/hooks/use-color-scheme.ts`)

- [x] 4.1 Change `mobile/src/hooks/use-color-scheme.ts` from the bare re-export to a resolver
  hook: read the device scheme (`useColorScheme` from `react-native`) **and** the stored theme
  preference (`useThemePreference()` — or `useStoredString` + `parseThemePreference` to avoid a
  feature→feature import shape; pick one and keep it consistent). Return the override when the
  pref is `"light"`/`"dark"`, else the device value. **Preserve the return type
  `ColorSchemeName` (`"light" | "dark" | "unspecified"`)** so `useTheme`'s `unspecified → light`
  mapping, `buildNavTheme`, and `theme.test.tsx` are unchanged (design D4). Confirm
  `theme.test.tsx` (which mocks `@/hooks/use-color-scheme`) still passes — the mock now stands in
  for the resolver, so the existing cases are unaffected.

## 5. Wire i18n (startup locale)

- [x] 5.1 In `mobile/src/i18n/index.ts`, change `lng: detectLocale()` to
  `lng: getInitialLocale()` (from the prefs store, task 3.1) — stored pref if `"fr"`/`"en"`, else
  device detection. Keep init **synchronous** (MMKV is synchronous) and the EN `fallbackLng`.
  Verify no import cycle: `@/i18n` (init) → prefs store → `@/storage` + `@/i18n/detect-locale`
  (no edge back to the `@/i18n` instance). Confirm the Jest i18n setup (`jest/setup-i18n.ts`
  + `setup-storage.ts`) ordering lets the startup store read resolve under test (MMKV mock
  returns `undefined` → `detectLocale()`); adjust setup ordering if needed.

## 6. Tests — new settings logic (the feature's proof)

- [x] 6.1 `prefs/store.test.ts` (or `prefs.test.ts`): round-trip each preference through the
  store; assert an unset key and an invalid stored string both read as `"system"`;
  `getInitialLocale()` returns the stored pref when `"fr"`/`"en"` and falls back to device
  detection otherwise. Use the existing MMKV Jest mock (round-trips via `@/storage`; the
  `setup-storage` Nitro stub is already wired). Target ≥90% lines+branches on `prefs/`.
- [x] 6.2 `prefs/hooks.test.ts`: render `useThemePreference` / `useLanguagePreference` with RNTL
  `renderHook`; assert the hook reflects the current value, `setPreference` persists + re-renders
  (the reactive read updates), and the language setter calls `i18n.changeLanguage` with the
  resolved locale (mock/spy `@/i18n`).

## 7. Tests — close the coverage gaps the logic glob exposes (design D7)

- [x] 7.1 `src/hooks/use-app-ready.test.ts` (NEW — `use-app-ready.ts` is 0% today): assert the
  gate is ready on mount (prerequisites synchronous → `useAppReady()` true), and exercise the
  **watchdog** branch with `jest.useFakeTimers()` (the `ready=false` path → timeout → ready).
  Bring `use-app-ready.ts` to ≥90% lines+branches.
- [x] 7.2 Add a `theme.test.tsx` case for the `unspecified → light` branch (`use-theme.ts` line
  11 — 50%→100% branch): mock `@/hooks/use-color-scheme` to return `"unspecified"`, assert
  `useTheme` resolves the **light** tokens.
- [x] 7.3 Add a `migrate.test.ts` case for the error branch (`migrate.ts` line 23 — 50%→100%
  branch): make the mocked `migrate()` reject, assert the error is recorded through `@/firebase`
  (`recordError`).

## 8. Wire the K-3 coverage threshold (`mobile/jest.config.js`, ADR 003 — R-1)

- [x] 8.1 Add a `coverageThreshold` to `mobile/jest.config.js`: a `global` floor at **70%**
  (lines + branches) and a **90%** (lines + branches) entry for the logic paths
  (`src/features/**`, `src/hooks/**`, `src/storage/**`, `src/db/**`, `src/theme/**`,
  `src/i18n/**`, `src/firebase/**`). Presentational paths (`src/components/**`, `src/app/**`) fall
  under the 70% global only (exempt from 90%, per ADR 003). Confirm the exact `coverageThreshold`
  key form the installed Jest accepts (glob keys like `"src/hooks/**"` vs. per-directory keys) and
  use whichever validates. Replace the "No coverageThreshold yet" comment block with a short
  rationale + ADR-003 pointer. Keep `collectCoverageFrom` (incl. the `!src/api/generated/**`
  exclusion).
- [x] 8.2 If any configured logic path still cannot reach 90% after tasks 6–7, **prefer adding a
  test**; only if a path is genuinely untestable in Jest, exclude it from the 90% glob **with a
  one-line recorded reason in `jest.config.js`** (never a silent skip — the DoD's no-third-state
  rule).

## 9. Verify the coverage gate passes (HIGHEST-RISK — do not skip)

- [x] 9.1 Run `npm test -- --coverage` in `mobile/` and **read the per-path coverage table**.
  Confirm every configured threshold passes (logic 90% lines+branches, global 70%) — the gate
  must land **green**, not red. If a logic path is short, return to tasks 6–8. This is the load-
  bearing verification: a threshold that fails CI on landing is the whole risk of this change.

## 10. CI comment (`.github/workflows/ci-mobile.yml`)

- [x] 10.1 Update the comment above the `Test` step (currently "Coverage is reported, not gated:
  no coverageThreshold yet (K-3 deferred…)") to state the threshold is now enforced in
  `jest.config.js` per ADR 003. The `run: npm test -- --coverage` line is unchanged (the gate
  lives in the Jest config; CI just runs the same entrypoint).

## 11. Definition-of-Done walk (every axis ✅ or ➖ N/A + reason — no third state)

This is the first Phase-2 feature's data layer; A1 is logic only (the screen is A2), so several
axes are ➖ N/A-with-reason. Record each in the DoD checklist (`definition-of-done.md` axes).

- [x] 11.1 **Architecture** — follows the Architecture Book (storage seam, C1 theme seam, i18n,
  feature-folder shape); novel decisions recorded: **ADR 009** (feature folder + prefs-consumed-
  by-infra) authored (task 12), **ADR 003** updated in place (task 12).
- [x] 11.2 **Types** — `npx tsc --noEmit` clean in `mobile/`; the preference unions are typed; no
  unjustified `any`.
- [x] 11.3 **Lint** — `npm run lint` clean in `mobile/` (`--max-warnings 0`): no
  `react-native-mmkv` import outside the seam, import-order, no parent-relative imports, i18next
  no-literal-string (no new user-facing string added here — see 11.6).
- [x] 11.4 **Unit/component tests** — the settings store/hooks tests + the gap-closing tests
  green (tasks 6–7); **coverage now gated** (tasks 8–9) — ✅ (this is the axis this change owns).
- [x] 11.5 **E2E** — ➖ **N/A + reason**: this change adds **no user flow** (no screen). The
  existing Maestro round-trip (`mobile/.maestro/schools.yaml`) must still pass — the app launches,
  i18n init now reads the store (defaults to device locale under no stored pref), nothing in the
  flow changes. A Settings E2E flow lands with the A2 screen.
- [x] 11.6 **i18n** — ➖ **N/A + reason**: the prefs store has **no user-facing string** (language
  values are locale codes, not displayed labels; the displayed control labels land with the A2
  screen). The startup-locale + `changeLanguage` wiring is exercised by tests (task 6). Zero
  hardcoded strings holds (lint).
- [x] 11.7 **Accessibility** — ➖ **N/A + reason**: no UI / no interactive control in this change
  (A2 owns the controls, touch targets, screen-reader passes). The a11y axis bites at A2.
- [x] 11.8 **Native correctness** — ➖ **N/A + reason**: no native config change, no rendered
  native control, no `prebuild`. (The reactive read uses MMKV's own JSI hook — native-correct by
  construction.)
- [x] 11.9 **Performance** — ➖ **N/A + reason**: synchronous in-process MMKV reads; no list, no
  animation, no interaction-heavy screen. Re-render on language change is the intended behavior,
  not a perf concern. (A2's screen owns the perf axis.)
- [x] 11.10 **Observability** — ➖ **N/A + reason**: MMKV reads/writes are synchronous, in-process,
  and have no throw/async-failure path (a missing key → `undefined` → the `"system"` default), so
  there is no error to record; wiring `@/firebase` here would be cargo-cult (design D6). Existing
  startup observability (the `runMigrations` `recordError` path) is unchanged.
- [x] 11.11 **Product analytics** — ➖ **N/A + reason**: no user action surface in this change (the
  store is read/written by code, not by a user gesture yet). A "preference changed" event, if
  warranted, is the A2 screen's call.
- [x] 11.12 **Documentation** — Architecture Book "Settings preferences" section + feature-folder
  note + changelog entry (task 12); ADR 009 + ADR 003 update (task 12).

## 12. Docs + ADRs (R-1 pointers, the living artifacts)

- [x] 12.1 Author **ADR 009** (`.claude/rules/mobile/decisions/009-settings-feature-prefs.md`
  from `TEMPLATE.md`): the first feature folder + "Settings owns app preferences, consumed by the
  infra seams" decision, the infra→feature import-direction trade-off (design D8), with the
  **revisit pinned to `eslint-plugin-boundaries` landing (TIM-135/D1)**. Add the index row to
  `.claude/rules/mobile/decisions/README.md`.
- [x] 12.2 Update **ADR 003** (`003-coverage-threshold.md`) **in place**: flip Status from
  "Accepted, not yet enforced" to enforced; record the fired revisit dated 2026-06-14 (the gate
  is now wired by this change in `jest.config.js`); update the README index row's Status. Do not
  delete the prior text — record the change.
- [x] 12.3 Add a **"Settings preferences"** section to `.claude/rules/mobile/architecture.md`
  (after "Splash"): the feature-folder convention (`src/features/settings/`, the first one — and
  the boundary-lint deferral to TIM-135), the two typed prefs + defensive validation, the reactive
  `@/storage` seam extension (`useStoredString`, why it lives in the seam — the lint boundary), the
  C1 theme-override wiring (return-type preserved), the i18n startup + runtime wiring (the DAG),
  the K-3 coverage gate now enforced (pointer to ADR 003 + `jest.config.js`), and what CI proves
  vs. what A2 owns. R-1 pointer style (link the gates, don't re-derive them).
- [x] 12.4 Update the existing book notes that say "Settings inherits this" / "owned by the first
  logic-bearing feature": the **Theming "single color-scheme seam (C1)"** note now points at this
  section as the now-wired override; the **Testing "K-3 deferral"** + the storage section's
  "K-3 coverage threshold still owned by Settings" notes now point at the enforced gate. (The
  brand-contrast "Settings inherits" note stays — its white-text-on-brand consumer is the A2
  screen, still pending.)
- [x] 12.5 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (Live section):
  the Settings-preferences layer, the reactive seam extension, the C1/i18n wiring, the K-3 gate
  now enforced, ADR 009 + ADR 003 update.
- [x] 12.6 Note Feature A's **data layer** landed in
  `docs/react-native-migration/01-roadmap/02-pattern-establishment.md` (one line; the screen is
  A2, still pending — Feature A is not fully done until A2 lands).

## 13. Local verification (gates)

- [x] 13.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 13.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`).
- [x] 13.3 `npm test -- --coverage` green in `mobile/` (all suites + the new `coverageThreshold`
  passes — this is task 9, restated as the final gate).

## 14. Validate

- [x] 14.1 `openspec validate add-mobile-settings-prefs --strict` passes.
