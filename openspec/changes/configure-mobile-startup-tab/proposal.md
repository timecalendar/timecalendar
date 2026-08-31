## Why

Flutter lets students choose whether a normal app launch opens Home or Calendar, but the React Native app always resolves to Home and currently has no first-launch routing coordinator. Phase 10 parity needs this preference to survive restarts without weakening onboarding, deep-link, notification-tap, migration, or splash-first-paint guarantees.

## What Changes

- Add a typed, persisted `home | calendar` startup-tab preference owned by Settings, defaulting missing, malformed, unknown, and unsupported imported values to Home.
- Add a localized Settings destination and native Home/Calendar picker; changing it persists immediately but never navigates the current app session.
- Add a single cold-launch resolution seam that waits for database migrations, leaves an insertion point for the Phase 09 Flutter importer, resolves calendar identity/onboarding, and only then applies the stored tab as the no-intent fallback.
- Preserve explicit route priority: deep links, notification taps, onboarding/import completion, and later explicit navigation are never replaced by the startup-tab fallback; keep `(tabs)` as the root `unstable_settings` back-stack anchor.
- Hold the splash until the winning launch destination is committed so Home cannot flash before Calendar or onboarding.
- Expose and test the Phase 09 mapping/setter target for Flutter `startup_screen` without implementing the legacy-store importer or modifying Flutter production code.
- Update current Settings, navigation, storage, testing, and migration-facing architecture guidance, including the Architecture Book changelog and a load-bearing ADR for launch resolution ownership and precedence.

## Capabilities

### New Capabilities

- `mobile-startup-routing`: Defines the persisted startup choice, Settings UI, one-shot resolved-launch coordinator, precedence rules, importer mapping target, and no-wrong-tab first paint.

### Modified Capabilities

- `mobile-settings-prefs`: Extends the typed Settings preference layer with the Home/Calendar startup preference and safe Flutter-value mapping/setter.
- `mobile-settings-hub`: Adds the working startup-screen preference destination to the Preferences group.
- `mobile-onboarding-flow`: Replaces the historical no-startup-gate deferral with onboarding as the no-intent destination for a fresh user whose calendar identity has resolved empty.
- `mobile-splash`: Makes migrations and launch destination commitment real readiness prerequisites rather than fire-and-forget/no-op placeholders.
- `mobile-fcm-tap-routing`: Coordinates killed-state notification resolution with the launch resolver so a notification target wins over the stored default.

## Impact

- **Mobile code:** `mobile/src/features/settings/`, a new startup-resolution feature seam, root/tabs navigation wiring, migration readiness, notification cold-start routing, `@/storage` key classification, FR/EN catalogs, Jest route/component tests, and Maestro launch/relaunch flows.
- **Documentation:** Settings, navigation, storage, testing, Phase 09/10 migration guidance, Architecture Book changelog, and a new ADR.
- **Flutter:** `app/` is read-only behavioral evidence. The RN setter accepts Flutter's `startup_screen` values; the Phase 09 importer remains out of scope.
- **Contracts/dependencies:** no server or OpenAPI change, no generated-client change, no SQLite/server migration, no new package, and no native/store/EAS/CI configuration change.
- **Sensitive surfaces:** binding `docs/mobile/architecture-book/` guidance changes and receives ADR/changelog treatment; legacy `app/` remains reference-only. No other sensitive surface is expected.
- **Explicitly out of scope:** weekend visibility, group colors, pinch zoom, Agenda expansion, the Phase 09 native importer itself, Flutter maintenance, backend work, and release/deploy actions.
