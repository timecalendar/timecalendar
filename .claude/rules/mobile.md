# Mobile Architecture Book — pointer

The full **Architecture Book** for `mobile/` (the React Native app) lives at
**`docs/mobile/architecture-book/`**. It is *not* auto-loaded into context — read the
relevant file(s) on demand when working on `mobile/`. Only this index is always in context.

## Release status — read first

The React Native app in `mobile/` is **not in production**. It is a new application being built
to replace the live Flutter app (v3) at the v4 cutover. No user runs a React Native build.

Consequences for every decision:

- There are no installed React Native binaries to keep compatible. A native dependency or an EAS
  fingerprint change costs nothing until the first public release; never argue against a change
  because it "needs a new store build" or "breaks OTA compatibility".
- Store, TestFlight and Play internal uploads are previews for the team, not releases.
- Production users, crash rates and live data belong to the Flutter app. Parity with Flutter is
  the bar; Flutter's behavior is the reference, not a legacy to preserve.

## When to read it

Working on `mobile/`? Read the topical file for the area you're touching **before**
making changes — these are binding rules (Principle 1: constraints are encoded in types,
lint, tests or CI before they are documented). For a load-bearing decision, also read the relevant ADR.

## Core artifacts (all under `docs/mobile/architecture-book/`)

- **`architecture.md`** — the hub: Principles 1–5, the module structure, the topical-file index.
- **`decisions/`** — ADR log (`README.md` is the index; one numbered file per decision).
- **`definition-of-done.md`** — the per-feature finite-perfection checklist (every feature passes it).
- **`CHANGELOG.md`** — dated log of every rule change, newest entry first.
- **`golden-path.md`** (+ `golden-path-template/`) — the blessed how-to for a new feature.

## Topical rule files (read the one that matches your change)

| File | Covers |
| --- | --- |
| `runtime.md` | Expo SDK/RN baseline, CNG native projects, `APP_VARIANT`, OS floors, native-dep autolink/permission config |
| `navigation.md` | Expo Router route structure — thin routes over `ui/`, the `(tabs)` + `Stack`-sibling layout |
| `data.md` | Committed OpenAPI spec seam, Orval client, the single `customFetch` mutator, query policy + offline persister |
| `storage.md` | The `@/storage` (MMKV) + `@/db` (SQLite/Drizzle) seams, migration runner, every Drizzle table schema |
| `lint-format.md` | ESLint/Prettier toolchain, rule inventory, feature-module boundaries B-1…B-4 |
| `testing.md` | jest-expo harness, mock-at-mutator, coverage gate, Maestro E2E, CI topology |
| `i18n.md` | i18next runtime, device-locale + EN fallback, flat typed keys, FR/EN parity |
| `accessibility.md` | The `ThemedText` heading-role contract + what lint can/can't encode |
| `theming.md` | The `src/theme/` token layer, `buildNavTheme`, the `src/components/chrome/` wrapper seam |
| `firebase.md` | Crashlytics + Analytics behind the `@/firebase` seam, one project per environment |
| `eas.md` | Build profiles, `fingerprint` runtime policy, local store builds, channels, no cross-channel promotion |
| `calendar.md` | The calendar surface — `@howljs/calendar-kit` behind a chrome seam, events-source seam, sync, details |
| `features.md` | Per-feature index (Settings, Personal events, School selection, Calendar, Home, Hidden events, …) |

## Release operations (outside the book)

- **`docs/mobile/releases/`** — the operator guide and readiness checklist: signing custody, the
  first store preview, the v4 cutover, and what is still owner-only. Read it with `eas.md`.
- **`mobile/EAS.md`** — the commands.
- **`docs/mobile/ota/`** is **exploration**: how that decision was reached. It is not maintained
  against the config and must not be read as rules. `eas.md` and the ADRs win.

> Changing a rule? Update the topical file **and** add a dated entry to `CHANGELOG.md`.
> Adding a load-bearing decision? Write an ADR in `decisions/` (Principle 4).
