# Architecture Book — TimeCalendar mobile (React Native)

> **This directory (`.claude/rules/mobile/`) IS the Architecture Book** — the living set of rules that drive development of `mobile/`. It holds only rules that *can't* be encoded in tooling; every rule that can be a lint rule, a type, or a CI gate must be (R-1), and prose links to the enforcing gate.
>
> **How it changes:** per `docs/react-native-migration/00-exploration/migration-approach.md` §7 — propose, ADR if load-bearing, update the relevant rule file, append to the [Rule changelog](./architecture-changelog.md). Revising the book is success, not failure: patterns are earned over the phases, not declared on day one.
>
> **Layout:** this file is the **hub** — the five living artifacts, the working rules, and the index of topical rule files. The per-domain rules live in the [topical files](#topical-rule-files); per-feature rules in [features.md](./features.md); the how-to for a new feature in [golden-path.md](./golden-path.md).

## The five living artifacts

Migration-approach §2 names five living artifacts that drive the migration. All five are siblings under this directory — there is no second book elsewhere. Each owns its concern; the hub points, it does not duplicate.

- **Architecture Book** — *this hub* + the [topical rule files](#topical-rule-files): the rules tooling can't encode.
- **ADR log** — [`decisions/`](./decisions/README.md): one record per load-bearing decision (context · choice · revisit-if), with a [README index](./decisions/README.md) and a [template](./decisions/TEMPLATE.md).
- **Definition of Done** — [`definition-of-done.md`](./definition-of-done.md): the per-feature finite-perfection checklist every feature passes (it owns the obligations the rules defer — manual screen-reader passes, touch targets, contrast, reduced motion, coverage).
- **Rule changelog** — [`architecture-changelog.md`](./architecture-changelog.md): the dated, append-only log of every rule change (the act of changing rules is itself recorded; §7).
- **Golden-path exemplar** — [`golden-path.md`](./golden-path.md): the real exemplar extracted from the three pattern-establishment features (blessed as ADR [014](./decisions/014-layered-feature-module-pattern.md)), carrying the out-of-`src/` [skeleton template](./golden-path-template/) and the "starting a new feature" checklist.

## Working rules (R-1…R-6)

The cross-cutting rules every change obeys. Full text + rationale in migration-approach §6.

- **R-1 — Encode before you document.** Lint rule / type / CI gate first; prose is the last resort, and every prose rule links to its enforcing rule or states why it isn't encodable.
- **R-2 — Platform-appropriate by intent, shared by convenience, never LCD by laziness.** Shared implementation while iOS/Android idioms align; split via composition (with an ADR) when they genuinely differ. No speculative divergence.
- **R-3 — The platform is the design reference, not the Flutter app.** Visual change is expected and intended.
- **R-4 — Blockage triage.** Load-bearing blockers → deep-dive + ADR + book update. Leaf problems → fix locally, no ceremony.
- **R-5 — Bounded Flutter maintenance during migration.** Security/critical fixes only in `app/`.
- **R-6 — Serial quality gate.** No feature starts until the previous one is DoD-complete (Phases 0–1).

## Topical rule files

The per-domain rules. Each file is present-tense and pointer-style (R-1); history lives in the [changelog](./architecture-changelog.md), decisions in [`decisions/`](./decisions/README.md).

| File | Covers |
| --- | --- |
| [runtime.md](./runtime.md) | Expo SDK / RN baseline, standalone-project placement, TS strict, CNG native projects, `APP_VARIANT` identity, minimum OS floors |
| [navigation.md](./navigation.md) | Expo Router route structure — thin routes over `@/components`, the `(tabs)` + `Stack`-sibling layout |
| [data.md](./data.md) | Committed OpenAPI spec seam, Orval client, the single `customFetch` mutator, query policy + offline persister |
| [storage.md](./storage.md) | The `@/storage` (MMKV) + `@/db` (SQLite/Drizzle) seams, the migration runner, the personal-events schema |
| [lint-format.md](./lint-format.md) | ESLint/Prettier toolchain + the full rule inventory + feature-module boundaries (B-1…B-4) |
| [testing.md](./testing.md) | jest-expo harness, mock-at-mutator, the coverage gate, Maestro E2E, CI topology |
| [i18n.md](./i18n.md) | i18next runtime, device-locale + EN fallback, flat typed keys, FR/EN parity |
| [accessibility.md](./accessibility.md) | The `ThemedText` heading-role contract + what lint can and can't encode |
| [theming.md](./theming.md) | The `src/theme/` token layer, `buildNavTheme`, the `src/components/chrome/` alpha-API wrapper seam |
| [firebase.md](./firebase.md) | Crashlytics + Analytics behind the `@/firebase` seam, one project per environment |
| [eas.md](./eas.md) | Build profiles, the `fingerprint` runtime policy, channels, human-invoked builds |
| [features.md](./features.md) | Per-feature index (Settings, Personal events, School selection, Splash) — feature-specific rules + pointers |

## Starting a new feature

Copy the [golden-path exemplar](./golden-path.md)'s checklist and [skeleton template](./golden-path-template/). The feature-module shape, the seam boundaries, and the 90/70 coverage split are ADR [014](./decisions/014-layered-feature-module-pattern.md) + [lint-format.md](./lint-format.md); the landed features are indexed in [features.md](./features.md).
