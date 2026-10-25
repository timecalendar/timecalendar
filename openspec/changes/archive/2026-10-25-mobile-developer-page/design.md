# Design

## Context

See proposal.md (Why). Current state that shapes the approach (all paths under `mobile/`):

- `src/features/settings/ui/settings-screen.tsx` ends with a section titled
  `environment.selector.section` ("Test environment" / "Environnement de test",
  testID `settings-section-environment`), rendered when
  `getBackendEnvironmentCapability() !== "production"`. It holds `<EnvironmentSettingsControl />`
  (from the `@/features/environment` barrel) and a navigation row to `/settings-gallery`
  (`settingsHub.gallery.*`, testID `settings-gallery`).
- `EnvironmentSettingsControl` (`src/features/environment/ui/environment-settings-control.tsx`)
  returns `null` in production and renders the legacy `SettingsRow` adapter with `first`
  (testID `settings-environment`) plus a `NativeSettingsRadioDialog` on Android / `Alert` on iOS.
  It works inside any `NativeSettingsSection`; it is not coupled to the Settings screen.
- `/settings-gallery` (`src/features/settings/ui/settings-gallery-screen.tsx`) is the model for
  the gate: `if (getBackendEnvironmentCapability() === "production") return <Redirect href="/settings" />`,
  then a `<Stack.Screen options={{ title: t(...) }} />`. Its test mocks `@/features/environment`
  with a mutable `mockCapability` and mocks `expo-router`'s `Redirect` to a `Text` carrying the href.
- **The dev import has no in-app entry.** `src/app/dev-import.tsx` re-exports
  `DevImportScreen` (`@/features/calendar-sources`). It reads `token` from search params and only
  acts when `isDevVariant()` (`src/config/variant.ts`, `extra.appVariant === "development"`).
  With no token it shows its loading state forever. Its deep link
  `timecalendar-dev://dev-import?token=…` is a contract for `.maestro/helpers/import-seeded-calendar.yaml`,
  `perf/run.mjs` and `e2e/maestro-selectors.test.ts`.
- Capability vs variant: `eas.json` sets `BACKEND_ENVIRONMENT_CAPABILITY` to
  development/preview/production per profile, but `APP_VARIANT=development` only on the
  development profile. A preview build therefore has capability `preview` and variant
  `production`: the dev import screen is inert there.
- `src/components/settings-route-structure.test.ts` asserts every root route file is registered on
  the root Stack (`discoveredRoutes()` vs `rootRegistrations`) and classifies headerless exceptions.
  A new `developer.tsx` must be registered or this test fails.
- `eslint.config.js` builds every `no-restricted-imports` config from
  `restrictedImports(extraPatterns, flags)`. Flat config replaces options, so a new ban must be a
  flag inside the helper, and an opt-out block must re-include `routeEntrypointImportPattern`
  because `timecalendar/routes-not-importable` also matches `src/features/**`.
- Material icons are vector drawables in `src/assets/icons/material/` registered in
  `native-settings-icons.ts`; `NativeSettingsIcon.android` is typed to that registry, so a new icon
  needs a new file. Neither `developer_mode` nor `download` exists yet.
- No `.maestro/` flow references `settings-environment`, `settings-gallery` or
  `settings-section-environment` (`e2e/README.md` records that environment switching proof lives in
  component suites).

## Goals / Non-Goals

**Goals:**

- One developer home at `/developer`, gated exactly like `/settings-gallery`, built from the native
  settings seam so it looks like the other Settings-family pages on both platforms.
- Settings keeps one gated row to it and nothing else developer-related.
- Make "the environment control lives on the developer page" a lint failure, not prose.

**Non-Goals:**

- Moving `/settings-gallery` to `/developer/gallery`, the gallery registry or `gallery.*` strings
  (slice 2.2).
- Changing `EnvironmentSettingsControl` (its `SettingsRow` adapter, testIDs or copy) — retiring the
  adapter is roadmap slice 3.5 / ADR D.
- Moving or renaming `/dev-import`, or changing what the dev import screen does.
- Any new Maestro flow.

## Decisions

### D1. Gate and redirect mirror the gallery

`DeveloperScreen` checks `getBackendEnvironmentCapability() === "production"` first and returns
`<Redirect href="/settings" />`. The redirect target is `/settings`, not `/`, because Settings is
where the entry lives and the gallery already does this.
*Alternative:* gate in `_layout.tsx` (conditionally register the screen). Rejected: an unregistered
route still resolves through Expo Router's file system, and it breaks the route-structure test's
"every route is registered" invariant. *Alternative:* gate on `__DEV__`. Rejected: false in
preview and in the release-config E2E build; the owner asked for development + preview.

### D2. Where the moved pieces live (boundaries B-1…B-4)

- `EnvironmentSettingsControl` **stays in `features/environment/ui`** and is consumed through the
  `@/features/environment` barrel. A cross-feature barrel import from `features/developer/ui` is
  allowed by B-1/B-2 (B-2 only forbids a feature importing its own barrel); the control owns
  environment behavior and moving it into `developer` would split the environment feature.
- The dev import screen **stays in `features/calendar-sources/ui`** at `/dev-import`. The developer
  page only navigates to it by href; it imports nothing from calendar-sources.
- The gallery screen stays in `features/settings/ui`; the developer page links to `/settings-gallery`
  by href and imports nothing from settings.
- `features/developer` is a UI-only feature: `index.ts` (`export * from "./ui"`), `ui/index.ts`,
  `ui/developer-screen.tsx`. No `data/` sublayer.

### D3. Dev import entry: token dialog, development variant only

The owner wants the page to host the dev import, but today it has no entry point, only a deep
link that needs a token. The page adds an action row "Import a calendar by token" that opens the
existing chrome `NativeTextEntryDialog` and, on submit, calls
`router.push({ pathname: "/dev-import", params: { token: value.trim() } })`. Submit is disabled
while the trimmed buffer is empty; the `onSubmit` handler also re-checks the trimmed value, because
the iOS dialog submits from its native buffer. The row and its section render only when
`isDevVariant()` is true, because on any other variant the import screen is inert (a dead row
breaks the "no dead destination" rule the Settings spec already holds). Dialog ids are declared as
static `testID` objects, like `rename-calendar-dialog.tsx`, so Maestro selector guards can see them:
`developer-dev-import-{dialog,input,message,cancel,submit}`.
*Alternatives:* (a) a value row showing the deep-link format — informative but not a tool; (b) move
`/dev-import` under `/developer/import` — breaks the Maestro/perf deep-link contract for no gain;
(c) show the row disabled on preview — Android M3 and iOS HIG both prefer hiding unavailable
developer options over showing dead ones. Chosen: token dialog, hidden when inert.

### D4. Page composition and copy

Order: Backend → Test data → Design, matching how often each is used (environment first, it is the
environment indicator). Rows and icons:

| Section (title key) | Row | Kind | Icon (iOS / Android) | testID |
| --- | --- | --- | --- | --- |
| `developer.section.backend` | `EnvironmentSettingsControl` (unchanged) | action | `server.rack` / `dns` | `settings-environment` |
| `developer.section.testData` | `developer.devImport.label` + `.hint` | action | `square.and.arrow.down` / `download` | `developer-dev-import` |
| `developer.section.design` | `developer.gallery.label` + `.hint` | navigation → `/settings-gallery` | `square.grid.2x2` / `grid_view` | `developer-gallery` |

Section testIDs: `developer-section-{backend,test-data,design}`. Header title `developer.title`
("Developer" / "Développeur"). Settings row: section `settingsHub.section.developer`
("Developer" / "Développeur", testID `settings-section-developer`), row
`settingsHub.developer.label` ("Developer tools" / "Outils de développement") with hint
`settingsHub.developer.hint`, icon `hammer` / `developer_mode`, testID `settings-developer`. The
section is rendered outside the `sections` array (it is gated), as the last section.
Removed keys: `settingsHub.gallery.label`, `settingsHub.gallery.hint`,
`environment.selector.section` (no other consumer).
Exact strings (EN / FR):

- `developer.title`: "Developer" / "Développeur"
- `developer.section.backend`: "Backend" / "Serveur"
- `developer.section.testData`: "Test data" / "Données de test"
- `developer.section.design`: "Design" / "Design"
- `developer.devImport.label`: "Import a calendar by token" / "Importer un calendrier par jeton"
- `developer.devImport.hint`: "Opens a field to enter a calendar token" / "Ouvre un champ pour saisir un jeton de calendrier"
- `developer.devImport.dialogTitle`: "Import a calendar" / "Importer un calendrier"
- `developer.devImport.fieldLabel`: "Calendar token" / "Jeton du calendrier"
- `developer.devImport.placeholder`: "Token" / "Jeton"
- `developer.devImport.cancel`: "Cancel" / "Annuler"
- `developer.devImport.submit`: "Import" / "Importer"
- `developer.gallery.label`: "Settings gallery" / "Galerie des réglages"
- `developer.gallery.hint`: "Opens every settings control for a device check" / "Ouvre tous les contrôles de réglages pour une vérification sur l'appareil"
- `settingsHub.section.developer`: "Developer" / "Développeur"
- `settingsHub.developer.label`: "Developer tools" / "Outils de développement"
- `settingsHub.developer.hint`: "Opens the environment switch, test data and the gallery" / "Ouvre le choix d’environnement, les données de test et la galerie"

The two `developer.gallery.*` values are the existing `settingsHub.gallery.*` values verbatim
(only the key moves). Use the apostrophe style already present in each catalog entry.

### D5. Lint: `banDeveloperTools`

Add to `eslint.config.js`:

- `developerToolsImportPath = { name: "@/features/environment", importNames: ["EnvironmentSettingsControl"], message }`
- `developerToolsDeepImportPattern = { regex: "^@/features/environment/ui($|/)", message }`
- flag `banDeveloperTools = true` in `restrictedImports` (pattern into `patterns`, path into `paths`);
- block `timecalendar/developer-tools-home` (`files: ["src/features/developer/**", "src/features/environment/**"]`,
  `restrictedImports([routeEntrypointImportPattern], { banDeveloperTools: false })`), placed after
  `routes-not-importable` and before `calendar-sources-is-a-leaf`.

Message: "The environment control lives on the developer page — mount it from
src/features/developer/ui only (navigation.md → Developer page)." Inject-and-revert proof: add the
import to `settings-screen.tsx` → lint error; add a deep import in `src/app/` → lint error; the
developer screen's import → clean. Record the three outputs in `evidence.md` in the change folder.
*Alternative:* a Jest grep contract test. Rejected: lint is the book's first-choice gate and the
helper already has the flag pattern; a grep test would also match comments and mocks.

### D6. Route

`src/app/developer.tsx` is exactly
`export { DeveloperScreen as default } from "@/features/developer/ui"` and the root layout adds
`<Stack.Screen name="developer" />` next to `settings-gallery` (compact default header, not in the
headerless set). A flat `developer.tsx` coexists with the `developer/` directory that slice 2.2
adds for `gallery.tsx` / `gallery/[story].tsx`; the route-structure test's `discoveredRoutes()`
already handles nested directories, so slice 2.2 only adds registrations.

## Risks / Trade-offs

- [The only environment indicator is now two taps deep instead of one] → It still names the
  effective environment with its accessible value; the spec moves the indicator rule to the
  developer page explicitly. Testers on preview builds learn one path: Settings → Developer.
- [The Settings test asserted 11 Compose icons under development capability] → Count stays 11
  (gallery icon out, developer icon in, environment control mocked); update the iOS symbol list
  (`square.grid.2x2` → `hammer`).
- [New Android drawables must be the exact Material Symbols Outlined 24px vectors] → Fetch
  `developer_mode` and `download` from google/material-design-icons `symbols/android/<name>/materialsymbolsoutlined/<name>_24px.xml`;
  normalise to the existing files' shape (`android:tint="?attr/colorControlNormal"`, white fill).
- [Lint flag forgotten in a future block] → `restrictedImports` defaults the flag on, so every
  block that re-sets the rule inherits it; only the opt-out block turns it off.

## Migration Plan

No data migration. The app is not in production; ship as one PR. Rollback is a revert.
