# i18n wired (FR + EN) for mobile, no-hardcoded-strings rule paid off

## Why

`mobile/` has the **lint half** of i18n but not the **runtime half**: `eslint-plugin-i18next` is installed and `i18next/no-literal-string` runs as `error` (jsx-only), but there is no i18next runtime, no catalogs, and no `t()` to call — so six scaffold/template files carry file-level `eslint-disable` suppressions tagged `TODO(i18n-step-6)`. Foundation roadmap step 6 (and migration-approach §1's vertical-slice order: UI → data → storage → **i18n** → a11y) makes i18n a wired, CI-green cross-cutting system *before* the first real feature (Settings, Phase 1.5) needs it, so that translation is the path of least resistance the day a feature lands rather than a retrofit. Per R-1 the rule must be enforced, not just documented; this change makes the rule honest by giving it a runtime to point at and removing the suppressions that currently hollow it out.

## What Changes

- **i18next + react-i18next runtime** added to `mobile/`, initialized once at app startup (alongside the existing QueryClient/Theme providers in `src/app/_layout.tsx`), with FR and EN catalogs.
- **Device-locale detection via `expo-localization`**, **EN fallback** when the device locale is neither `fr` nor `en`. No in-app language switcher and no persisted override — that is a Settings (Phase 1.5) concern and would pull the unbuilt MMKV storage seam (step 9) forward; the skeleton follows the device locale only.
- **Flat "natural" keys**: `keySeparator: false` + `nsSeparator: false`, so a key is one literal dotted string (`calendar.actions.previous`) that is byte-for-byte identical in code and in the catalog JSON — directly greppable. The dotted segments are a naming convention, not i18next nesting.
- **Typed keys**: a `react-i18next` module augmentation generates the key union from the EN catalog, so `t('…')` is type-checked — a missing or mistyped key is a `tsc` error. This is the compile-time enforcement that the whole key path exists.
- **Suppressions removed (all six files), tabs reshaped to the real app**: the two tab routes survive as navigation chrome but are relabeled to the real app's vocabulary (Flutter's bottom nav is Accueil / Calendrier / Profil) and **gutted to minimal localized stubs**: `(tabs)/index` → Home (Accueil), `(tabs)/explore` → renamed `profile` → Profile (Profil). The **Calendar tab is deliberately deferred** (calendar is built last; wiring a tab to it now would be speculative scaffolding). The `app-tabs` / `app-tabs.web` labels are localized. The demo *bodies* and now-orphaned helpers (`web-badge`, `hint-row`, `animated-icon`) are **deleted** — translating Expo boilerplate that dies at the next feature is waste. `schools-screen` — the live API round-trip surface kept for the test/e2e harness — has its real strings localized and its disable removed.
- **One proof test**: a unit test asserting a translated string renders through the real i18next instance (default locale), so the wiring is CI-verified, not just present.
- **Architecture Book updated**: an i18n section records the runtime choice, the flat-key + typed-key decisions, the EN-fallback/device-only posture, and resolves the lint-section note that currently says step 6 "still owes the i18n wiring and removal of the tagged template-file suppressions."
- **Roadmap step 6 marked done** in `docs/react-native-migration/01-roadmap/01-foundation.md`.

## Capabilities

### New Capabilities

- `mobile-i18n`: the mobile app's internationalization system — runtime init and provider placement, locale detection + fallback posture, the flat-key + typed-key contract, catalog layout (FR + EN), how the `no-literal-string` rule is satisfied (suppressions removed) and how it stays enforced, and the CI/test proof.

### Modified Capabilities

<!-- none. mobile-lint-format already owns the i18next/no-literal-string rule; this change removes the temporary per-file suppressions it anticipated but does not change the rule's spec-level requirements. The mobile-architecture-book gains an i18n section, which is normal book evolution, not a requirement change to that capability. -->

## Impact

- `mobile/`: new dependencies (`i18next`, `react-i18next`, `expo-localization`); new `src/i18n/` (init, locale detection, `locales/en.json`, `locales/fr.json`, the typed-keys augmentation); `src/app/_layout.tsx` gains the i18n init/provider; `(tabs)/index` gutted to a localized Home stub; `(tabs)/explore` renamed to `(tabs)/profile`, gutted to a localized Profile stub; `app-tabs` / `app-tabs.web` triggers relabeled (Accueil + Profil) and localized; `schools-screen.tsx` localized; **deletion** of the orphaned demo helpers (`hint-row`, `animated-icon`, `animated-icon.web`, `web-badge`). Navigation continues to resolve (two triggers, two route files).
- `mobile/eslint.config.js`: no rule change expected; the six `eslint-disable` headers are deleted. (If demo-screen deletion removes the only files needing a given disable, nothing else is touched.)
- `.claude/rules/mobile/architecture.md`: i18n section added; the lint-section "step 6 still owes…" note resolved.
- `docs/react-native-migration/01-roadmap/01-foundation.md`: step 6 marked done.
- No server/web/`app/` code touched; no native config change (expo-localization autolinks; native projects are CNG-regenerated on the next prebuild).
