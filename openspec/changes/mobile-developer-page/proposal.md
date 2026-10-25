# Developer page (`/developer`)

## Why

The developer tools (backend environment switch, the settings gallery link) sit in a "Test
environment" section at the bottom of the Settings hub, mixed in with user settings. The calendar
dev import has no in-app entry at all: it can only be reached with a hand-built
`timecalendar-dev://dev-import?token=…` deep link. Owner decision 2 of the design-system audit
(`docs/mobile/design-system-audit/README.md`) moves the dev tools out of Settings onto a dedicated
developer page that the slice-2.2 gallery will also live under. This is roadmap slice 2.1.

## What Changes

- New `developer` feature: `src/features/developer/ui/developer-screen.tsx`, mounted by a thin
  `src/app/developer.tsx` route and registered on the root Stack with the compact native header
  and a localized title.
- The page is built from the native-settings seam (`@/components/chrome` `NativeSettingsHost` /
  `NativeSettingsSection` / `NativeSettingsRow`): a SwiftUI Form on iOS and a Material list on
  Android, like the other Settings-family pages. It has three sections:
  - **Backend:** the existing `EnvironmentSettingsControl`, unchanged (same picker, confirmation,
    single-flight reset and accessible value).
  - **Test data** (development app variant only): an "Import a calendar by token" action row that
    opens the native text-entry dialog and pushes `/dev-import?token=<token>`. The import screen,
    its variant gate and its deep link stay unchanged.
  - **Design:** a navigation row to the existing `/settings-gallery`. The gallery route does not
    move in this slice.
- Gate: when the backend capability is `production` the page redirects to `/settings` (the same
  gate and redirect as `/settings-gallery`). Development and preview builds show it.
- Settings hub: the "Test environment" section (environment control + gallery row) is replaced
  by one "Developer" section with exactly one navigation row opening `/developer`. It renders
  only when the capability is not `production`.
- **Lint gate (Principle 1):** `EnvironmentSettingsControl` can only be imported from
  `src/features/developer/**`. A new `banDeveloperTools` flag in `eslint.config.js`
  `restrictedImports` bans the named export from `@/features/environment` and deep imports of
  `@/features/environment/ui/**`, with one opt-out block for the developer feature.
- Two Material Symbols vector drawables (`developer_mode`, `download`) are added and registered
  in `native-settings-icons.ts` for the new rows.
- FR/EN strings: new `developer.*` keys and `settingsHub.section.developer` /
  `settingsHub.developer.*`. The unused `settingsHub.gallery.*` and `environment.selector.section`
  keys are removed. Typed parity covers both catalogs.
- Tests: developer screen (both platforms, production redirect, preview vs development rows,
  token dialog submit/cancel/empty), Settings hub (one developer row, gating, no environment or
  gallery row), route-structure (thin route + registration + localized title), and lint
  inject-and-revert evidence.
- Architecture Book: `navigation.md`, `features.md`, `lint-format.md` and a dated
  `CHANGELOG.md` entry (2026-10-25).

## Capabilities

### New Capabilities

- `mobile-developer-page`: the capability-gated `/developer` page, its sections (environment
  switch, dev import by token, gallery entry), its production redirect, accessibility and
  localization, and the lint rule that keeps the environment control on it.

### Modified Capabilities

- `mobile-settings-hub`: the capability-gated Environment group becomes a capability-gated
  Developer group with exactly one row opening `/developer`; tests cover that row instead of the
  environment control.
- `mobile-backend-environments`: the environment entry (the app's only environment indicator),
  its confirmation and its selector live on the developer page instead of the Settings hub's
  final section.

## Impact

- Code (`mobile/`): new `src/features/developer/{index.ts,ui/index.ts,ui/developer-screen.tsx,
  ui/developer-screen.test.tsx}`, new `src/app/developer.tsx`; `src/app/_layout.tsx`;
  `src/features/settings/ui/settings-screen.tsx` + test;
  `src/components/settings-route-structure.test.ts`; `src/components/chrome/native-settings-icons.ts`
  + two `src/assets/icons/material/*.xml`; `src/i18n/locales/{en,fr}.json`; `eslint.config.js`.
- Unchanged: `EnvironmentSettingsControl`, the `/dev-import` route and its deep link (Maestro
  helper `import-seeded-calendar.yaml`, `perf/run.mjs`), `/settings-gallery`.
- No new npm dependency, no `app.config.ts` / `eas.json` change. Two new Android vector drawables
  change the native asset set; the app is not in production, so this costs nothing.
- No Maestro flow references the moved rows (`.maestro/` has no `settings-environment` /
  `settings-gallery` selector); `e2e/maestro-selectors.test.ts` keeps passing.
- No ADR: roadmap ADR C (in-house gallery on `/developer`) belongs to slice 2.2. This slice moves
  existing tools behind an existing gate.
