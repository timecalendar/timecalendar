# Mobile Architecture Book — pointer

The full **Architecture Book** for `mobile/` (the React Native app) lives at
**`docs/mobile/architecture-book/`**. It is *not* auto-loaded into context — read the
relevant file(s) on demand when working on `mobile/`. (It used to live under
`.claude/rules/mobile/`, which loaded all ~170k tokens every turn; it was relocated so
only this index is always in context.)

## When to read it

Working on `mobile/`? Read the topical file for the area you're touching **before**
making changes — these are binding rules (R-1: prose only carries what lint/types/CI
can't encode). For a load-bearing decision, also read the relevant ADR.

## The five living artifacts (all under `docs/mobile/architecture-book/`)

- **`architecture.md`** — the hub: the five artifacts, working rules R-1…R-6, the topical-file index.
- **`decisions/`** — ADR log (`README.md` is the index; one file per decision, 001–024+).
- **`definition-of-done.md`** — the per-feature finite-perfection checklist (every feature passes it).
- **`architecture-changelog.md`** — dated append-only log of every rule change.
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
| `eas.md` | Build profiles, the `fingerprint` runtime policy, channels, human-invoked builds |
| `calendar.md` | The calendar surface — `@howljs/calendar-kit` behind a chrome seam, events-source seam, sync, details |
| `features.md` | Per-feature index (Settings, Personal events, School selection, Calendar, Home, Hidden events, …) |

> Changing a rule? Update the topical file **and** append to `architecture-changelog.md`
> (migration-approach §7). Adding a load-bearing decision? Write an ADR in `decisions/`.
