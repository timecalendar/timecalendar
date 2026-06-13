# Phase 01 — Foundation (the walking skeleton)

> **Goal:** the codebase comes alive. Every cross-cutting system is wired and **green in CI**, and one trivial screen (**splash**) is taken through the *entire* Definition of Done on both platforms — so the polish we do is the foundation, not a feature.
>
> **Depends on:** nothing (kickoff). **Modules touched:** `splash`, plus all infra.
>
> This is Phase 0 in [`migration-approach.md`](../00-exploration/migration-approach.md) §4.

## Rough steps

1. **Scaffold `mobile`** as a **standalone npm project** (sibling of `server/` and `app/` — not a workspace member; see migration-approach §3 and the scaffold change's design D7). Latest **stable** Expo SDK ([K-1](../00-exploration/migration-approach.md#8-resolved-knobs-phase-0-kickoff-decisions)), New Arch + Hermes, TS strict, `expo-dev-client`. ✅ *Done (scaffold-mobile-expo, SDK 56).*
2. **Min OS targets** set to iOS 15.1 / Android API 24 ([K-2](../00-exploration/migration-approach.md#8-resolved-knobs-phase-0-kickoff-decisions)). ✅ *Done — effective floors iOS 16.4 / API 24 (SDK 56's own iOS minimum prevails; K-2 revisit flagged in §8).*
3. **API client:** Orval reading the server's OpenAPI spec → RN-owned TanStack Query hooks. (Web stays separate.)
4. **Lint/format + first custom ESLint rules:** no hardcoded strings, a11y props on touchables, no direct `@react-navigation/*` imports, import-boundary rules. Pre-commit + CI. ✅ *Done (add-mobile-lint-format) — all rules landed via core rules + existing plugins (no hand-rolled rule needed); also gained no-raw-fetch/no-axios (the data-layer R-1 debt) and Prettier aligned to web/server. The strings + a11y rules from steps 6–7 are already live; the i18n wiring and removal of the tagged template-file suppressions landed in step 6 (add-mobile-i18n).*
5. **Test harness:** Jest + RNTL green; **Maestro e2e green on iOS *and* Android** (even if it only asserts the splash renders).
   - *CI E2E strategy (landed):* the native E2E jobs are slow by nature (cold native build + device boot, ~20–30 min each — toolchain cost, not app size), so they run **on-demand**: PRs only with the `run-e2e` label, always on `main`/`production` when `mobile/**` or `openapi/**` changed. Split out of the monolith `build.yaml` into `ci-mobile-e2e.yml` (see `.github/workflows/`).
   - **Deferred — CI E2E caching speedups (not yet done):** ① AVD snapshot caching for the Android emulator (skip cold boot), ② iOS DerivedData cache keyed on the lockfile (point `xcodebuild -derivedDataPath` outside the `prebuild --clean` tree so it survives), ③ confirm the Gradle *build* cache (not just deps) is active. Realistic gain ~Android 28→18 min, iOS 18→10 min on warm caches. Orthogonal to the on-demand split above; pick up when E2E run time becomes a friction point.
6. **i18n** wired (FR + EN), no-hardcoded-strings rule live. ✅ *Done (add-mobile-i18n) — i18next + react-i18next + expo-localization, device locale with EN fallback, flat greppable + `tsc`-typed keys (FR/EN parity enforced at compile time), one proof test; all six `TODO(i18n-step-6)` suppressions removed; tabs reshaped (Accueil/Profil, Calendar deferred). See the Architecture Book i18n section.*
7. **a11y** lint rules live.
8. **Firebase** via `@react-native-firebase/*`: Crashlytics + Analytics verified end-to-end (an event and a forced test crash both arrive). Reuse the Flutter `google-services.json` / `GoogleService-Info.plist`.
9. **Storage seams:** MMKV + expo-sqlite/Drizzle initialized with a migration runner. (Schemas come with features; the *runner* exists now.)
10. **Theming + native-chrome wrappers:** design tokens; Expo UI / native-tabs / glass stubbed **behind our own abstractions** so they're swappable as those alpha APIs churn.
11. **EAS** Build/Submit/Update configured; **app installs on a real device**; internal distribution channel set up (dogfooding starts here).
12. **Create the 5 living artifacts** (Architecture Book, ADR log, DoD, Rule changelog, golden-path placeholder) — even mostly empty. The **Architecture Book already exists at `.claude/rules/mobile/`** (born with the scaffold) — the remaining four join it there; do **not** create a second book elsewhere.
13. **Splash screen** built pixel-perfect / native-correct through the full DoD.

## Exit criteria

- App builds and ships to a real device via EAS internal channel.
- CI green: types, lint (incl. custom rules), unit, Maestro on both platforms.
- Crashlytics + Analytics confirmed receiving data.
- Splash passes **every** DoD item on iOS and Android.
- All 5 artifacts exist; first ADRs written (K-1…K-5 become real ADRs here).

## Risks & decisions

- **This is the highest-leverage phase** — every choice here is copied by every later feature. Spend the time.
- Native-chrome APIs are alpha; the wrapper layer (step 10) is the insurance against their churn.
- Don't build feature schemas yet — resist scope creep. The skeleton walks; it doesn't run.
</content>
