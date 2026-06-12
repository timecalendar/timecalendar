## Context

Phase 01 (Foundation) of the React Native migration starts here: roadmap steps 1–2 of `docs/react-native-migration/01-roadmap/01-foundation.md`. The repo already has an npm workspace (`web`, `openapi/javascript`), a Flutter app at `app/` (ships as `fr.samuelprak.timecalendar` on both stores), and a NestJS server. Nothing RN exists yet.

Checked against npm at proposal time: `expo@latest = 56.0.11` (React Native 0.85.3 — the proposal initially said 0.86; the actual SDK 56 pairing is 0.85) — SDK 56 is stable. K-1's revisit clause ("SDK 56 ships stable before Phase 0 completes → start directly on 56") therefore applies.

## Goals / Non-Goals

**Goals:**
- A `mobile/` Expo SDK 56 app as a standalone npm project (sibling of `server/` and `app/`) that builds and launches the default screen on an iOS simulator and an Android emulator via dev-client builds.
- TypeScript strict baseline per the stack doc.
- CNG-managed native projects, `APP_VARIANT`-based app identity, K-2 minimum OS floors.
- The Architecture Book born at `.claude/rules/mobile/`, seeded with the decisions this change makes real, and referenced from the migration docs.

**Non-Goals:**
- Everything in foundation steps 3–13: API client, lint/format/custom rules, test harnesses, i18n, a11y, Firebase, storage seams, theming wrappers, EAS, CI, the other four living artifacts, the splash DoD pass. The skeleton only has to *launch*.
- Real-device installs (that's the EAS step).
- Any change to `app/`, `web/`, `server/`, `openapi/`.

## Decisions

### D1 — Scaffold with `create-expo-app` default template, pinned to SDK 56
`npx create-expo-app@latest mobile` (default template: TypeScript + Expo Router + example screens), then add `expo-dev-client`. Expo Router is the planned navigation backbone (stack doc §4), so taking it from the template avoids rework in the very next steps; the template's example screen serves as "the default app launches" for this change's DoD. Alternative considered: `blank-typescript` template (no router) — rejected, we'd reinstall Router within a step or two.

### D2 — Start directly on SDK 56 (K-1 revisit clause)
SDK 56 is stable on npm, so the planned 55→56 interim-upgrade ADR is moot. New Architecture + Hermes are the defaults (and on SDK 55+, the only option) — no configuration needed, just asserted.

### D3 — CNG: native dirs are generated, never committed
`mobile/.gitignore` ignores `android/` and `ios/`; `npx expo prebuild` regenerates them from `app.config.ts` + config plugins. This is the idiomatic Expo path and what every later step assumes (Firebase config plugins, `expo-build-properties`, EAS). Decided with the user.

### D4 — App identity: `APP_VARIANT` pattern with the Flutter app's production identifier
Dynamic `app.config.ts` (Expo's documented standard, `docs.expo.dev/build-reference/variants`):
- No `APP_VARIANT` / `APP_VARIANT=production` → `fr.samuelprak.timecalendar`, name "TimeCalendar" — preserves store identity so RN ultimately ships as an *update* to the Flutter app.
- `APP_VARIANT=development` → `fr.samuelprak.timecalendar.dev`, name "TimeCalendar (Dev)" — dev builds coexist with the store Flutter app on a real device.

`mobile/package.json` scripts (`ios`, `android`) set `APP_VARIANT=development` so the frictionless local path always produces the dev variant. Switching variants locally requires `expo prebuild --clean` (CNG regenerates identity). Consequence noted for step 8: the `.dev` identifier will need its own entry in the Firebase config files (or Firebase verification happens on production-identity builds) — deferred to the Firebase step.

### D5 — K-2 floors via `expo-build-properties`, clamped to SDK minimums
Config plugin sets `ios.deploymentTarget: "15.1"` and `android.minSdkVersion: 24`. If SDK 56's own minimums are already higher, the effective floor is the SDK's — that is exactly K-2's "revisit if a chosen SDK raises its own minimum" clause; the implementer records the *actual* resulting floors in the Architecture Book and flags the K-2 revisit in the migration doc if they exceed iOS 15.1 / API 24. Explicit config is kept even if redundant: it documents intent and survives SDK default drift.

### D6 — TypeScript strict per stack doc §2
Extend Expo's base tsconfig; enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Gate: `tsc --noEmit` clean. (ESLint comes in step 4, not here.)

### D7 — `mobile/` is a standalone npm project, NOT a workspace member (revised during implementation)
Originally planned as a root-workspace member; reversed after task 1.3 hit the structural conflict in practice. Expo pins `react` to an exact version per SDK (19.2.3 for SDK 56) while Next floats it (`^19.1.1` → latest patch), and npm workspaces share one hoisted tree with no pnpm-style isolation — so every Expo SDK upgrade and every web dependency bump becomes a version negotiation, escalating to unsolvable once the two ever want different React majors. Empirically: expo-doctor failed on duplicate `react`/`react-dom`, npm `overrides` silently don't apply to workspaces' direct dependencies, and `npm dedupe` exited with ERESOLVE.

`mobile/` therefore keeps its own `package-lock.json` and `node_modules`, exactly like `server/` (which was already standalone — the workspace is really "web + its generated client", and apps in this repo are standalone siblings). Mobile loses nothing: the planned API client is Orval-generated from the OpenAPI spec *file* (a path, not a workspace package), and mobile gets its own ESLint/Jest in later foundation steps anyway. Benefits: Expo's most-tested single-app path, no Metro monorepo config, clean `expo-doctor` (21/21 on first standalone install), zero coupling to web's React cadence. Root `husky`/`lint-staged` (currently Dart-only) are untouched.

**Revisit if:** real package-level sharing between web and mobile emerges (beyond codegen), or the repo moves to pnpm (whose isolated `node_modules` would solve the coupling properly).

### D8 — `.claude/rules/mobile/` IS the Architecture Book
Decided with the user: no separate `architecture.md` elsewhere, no mirror to keep in sync. Seed: a single `.claude/rules/mobile/architecture.md` containing the book's charter (what it is, how it changes — pointing at migration-approach §7), the R-1…R-6 working rules, and the rules this change establishes (TS strict flags, CNG, `APP_VARIANT` identity, standalone-project layout per D7, SDK/floor decisions). Topical file splits happen later, when the book earns them. Both migration docs (`migration-approach.md` §2 artifact table, `01-foundation.md` step 12) are updated to name this location so the "five artifacts" step doesn't recreate the book somewhere else.

## Risks / Trade-offs

- [SDK 56 raises min OS above K-2] → handled by design (D5): clamp, record actuals, flag K-2 revisit. No silent drift.
- [npm hoisting breaks Metro resolution or autolinking in the workspace] → this risk *materialized* (duplicate `react` across web/mobile); resolved by D7's reversal to a standalone project, which removes the risk class entirely.
- [Default template ships example screens, not a real app] → acceptable by definition: this change's DoD is "default app launches"; the splash screen (step 13) replaces it through the full DoD later.
- [Dev-variant Firebase mismatch later] → known and deferred (D4); step 8 owns it.
- [Native toolchain assumptions (Xcode, JDK, Android SDK) undocumented] → `mobile/README.md` records the prerequisites and the two launch commands.

## Migration Plan

Purely additive. Rollback = delete `mobile/`, delete `.claude/rules/mobile/`, revert the doc edits (root `package.json`/`package-lock.json` are untouched per D7).

## Open Questions

None blocking. (Firebase registration of the `.dev` identifier is deliberately deferred to foundation step 8.)
