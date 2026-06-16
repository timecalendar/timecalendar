## 1. Dependencies

- [x] 1.1 Add `i18next`, `react-i18next`, and `expo-localization` to `mobile/package.json` (use the Expo-aligned `expo-localization` version via `npx expo install`); update the lockfile.
- [x] 1.2 Confirm `expo-doctor` is clean (version alignment) after install.

## 2. i18n runtime (`src/i18n/`)

- [x] 2.1 Create `src/i18n/locales/en.json` and `fr.json` as flat dotted-key catalogs (single `translation` namespace) covering every surviving string: tab labels (`home.tab.label`/`profile.tab.label` or similar), Home + Profile stub text, and the schools screen (`schools.title`, `schools.loading`, `schools.error`).
- [x] 2.2 Create `src/i18n/detect-locale.ts`: read device locale via `expo-localization`, return `fr` or `en` on match, else `en`.
- [x] 2.3 Create `src/i18n/index.ts`: initialize i18next via `initReactI18next` with `resources` (en, fr), `lng` from 2.2, `fallbackLng: 'en'`, `keySeparator: false`, `nsSeparator: false`, and `interpolation.escapeValue: false`. One module-scoped instance.
- [x] 2.4 Create `src/i18n/i18next.d.ts`: augment `react-i18next` `CustomTypeOptions` with `resources: { translation: typeof en }` and `keySeparator: false` for typed `t()` keys.
- [x] 2.5 Type the FR catalog against EN (e.g. `fr.json` consumed through a `satisfies typeof en` check or a typed re-export) so missing/extra FR keys fail `tsc`.

## 3. Wire into the app

- [x] 3.1 Import `@/i18n` for its init side effect at the top of `src/app/_layout.tsx` and mount `<I18nextProvider>` (or rely on the default instance) alongside the existing QueryClient/Theme providers.
- [x] 3.2 Verify the tree renders localized text (manual smoke or the proof test in §5).

## 4. Reshape scaffold to the real app + remove suppressions

- [x] 4.1 `app-tabs.tsx` / `app-tabs.web.tsx`: relabel triggers to Accueil/Home and Profil/Profile via `t()`; rename the `explore` trigger `name` to `profile`; remove the `eslint-disable` headers.
- [x] 4.2 `(tabs)/index.tsx`: gut the demo body to a minimal localized Home stub; remove the disable.
- [x] 4.3 Rename `(tabs)/explore.tsx` → `(tabs)/profile.tsx`; gut to a minimal localized Profile stub; remove the disable.
- [x] 4.4 `src/components/schools-screen.tsx`: replace literal strings with `t()` calls; remove the disable.
- [x] 4.5 Delete orphaned demo helpers: `web-badge.tsx`, `hint-row.tsx`, `animated-icon.tsx`, `animated-icon.web.tsx` (confirm no remaining references via LSP/grep first).
- [x] 4.6 Grep the repo for any leftover `TODO(i18n-step-6)` / `eslint-disable i18next/no-literal-string` outside the `**/*.test.*` exemption — there must be none.

## 5. Test the wiring

- [x] 5.1 Add a unit test rendering a localized component through the real i18next instance, asserting the translated EN string renders (not the key).
- [x] 5.2 Confirm the `schools-screen` test still passes (or update its assertions to the now-localized default-locale strings).
- [x] 5.3 Confirm no Maestro flow references the old `explore` route (the documented deep link `timecalendar-dev://schools` is unaffected).

## 6. Gates

- [x] 6.1 `npx tsc --noEmit` clean (typed keys + FR/EN parity hold).
- [x] 6.2 `npm run lint` clean with `--max-warnings 0` and no i18n suppressions in app source.
- [x] 6.3 `npm test` green.

## 7. Docs

- [x] 7.1 Add an i18n section to `.claude/rules/mobile/architecture.md` (runtime choice, flat-key + typed-key contract, device-locale/EN-fallback posture, deferred items) and resolve the lint-section note that step 6 "still owes the i18n wiring and removal of the tagged template-file suppressions."
- [x] 7.2 Mark step 6 done in `docs/react-native-migration/01-roadmap/01-foundation.md`.
