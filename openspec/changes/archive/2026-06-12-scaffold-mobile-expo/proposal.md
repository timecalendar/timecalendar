## Why

The React Native migration (Phase 01 — Foundation, steps 1–2 of `docs/react-native-migration/01-roadmap/01-foundation.md`) needs its walking skeleton to exist before any cross-cutting system can be wired: a `mobile/` Expo app as a standalone npm project (a sibling of `server/` and `app/`, not a workspace member — see design D7), plus the first home for the Architecture Book. Expo SDK 56 is now stable (K-1's "revisit if" clause applies — we scaffold directly on 56 and skip the planned 55→56 interim upgrade), so this is the cheapest moment to start.

## What Changes

- New `mobile/` Expo app as a **standalone npm project** with its own `package-lock.json` (like `server/`; NOT added to the root workspace — Expo's exact `react` pin vs Next's floating range makes shared hoisting a permanent version-coupling conflict), on the latest stable Expo SDK 56 (React Native 0.85), New Architecture + Hermes, `expo-dev-client`.
- TypeScript strict mode per the migration stack doc: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Native projects managed via CNG (Continuous Native Generation): `mobile/android/` and `mobile/ios/` are gitignored and regenerated with `npx expo prebuild`.
- App identity via dynamic `app.config.ts` with the standard `APP_VARIANT` pattern: production identifier `fr.samuelprak.timecalendar` (preserves store identity per the migration plan), development variant `fr.samuelprak.timecalendar.dev` so dev builds coexist with the installed Flutter app on real devices.
- Minimum OS floors per K-2 folded in (roadmap step 2): iOS 15.1 / Android `minSdk` 24 via `expo-build-properties`.
- The Architecture Book is created at `.claude/rules/mobile/` — this directory IS the Architecture Book (not a mirror of one living elsewhere), seeded with the already-decided rules (R-1…R-6, TS strict, CNG, app variants, monorepo layout). Migration docs updated to state this location so the two never diverge.
- Definition of done for this change: the default app launches on an iOS simulator and an Android emulator via `npx expo run:ios` / `run:android` (dev-client builds, not Expo Go).

Out of scope (later foundation steps): Orval/API client, ESLint/Prettier/custom rules, Jest/Maestro, i18n, a11y, Firebase, MMKV/SQLite, theming wrappers, EAS, CI wiring, the other four living artifacts, the splash screen DoD pass.

## Capabilities

### New Capabilities
- `mobile-app-scaffold`: the `mobile/` standalone Expo project — SDK/runtime baseline (SDK 56, New Arch, Hermes, dev-client), TS strict config, CNG native-project management, `APP_VARIANT` app identity, K-2 minimum OS floors, and launchability on both platforms.
- `mobile-architecture-book`: the living Architecture Book at `.claude/rules/mobile/` — its location, seed content, and the requirement that migration docs reference it as the single source of rules.

### Modified Capabilities

(none — existing specs cover the Flutter app and server; no requirement changes there)

## Impact

- New top-level `mobile/` directory (standalone Expo app with its own lockfile, CNG — no committed native dirs). Root `package.json`/`package-lock.json` untouched.
- New `.claude/rules/mobile/*.md` (Architecture Book).
- `docs/react-native-migration/00-exploration/migration-approach.md` and `01-roadmap/01-foundation.md` updated to point the Architecture Book artifact at `.claude/rules/mobile/`.
- No changes to `app/` (Flutter), `web/`, `server/`, or `openapi/`.
