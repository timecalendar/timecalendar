# Architecture Book — TimeCalendar mobile (React Native)

> **This directory (`.claude/rules/mobile/`) IS the Architecture Book** — the living set of rules that drive development of `mobile/`. It is not a mirror of a book maintained elsewhere. It holds only rules that *can't* be encoded in tooling; every rule that can be a lint rule, a type, or a CI gate must be (R-1), and prose here links to the enforcing rule once it exists.
>
> **How it changes:** per `docs/react-native-migration/00-exploration/migration-approach.md` §7 — propose, ADR if load-bearing, update the book, append to the Rule changelog (the changelog is one of the five living artifacts; it will be created in the "five artifacts" foundation step). Revising this book is success, not failure: patterns are earned over Phases 0–1.5, not declared on day one.
>
> Topical files (navigation.md, data.md, …) will split out of this one when the content earns it. Until then, everything lives here.

## Working rules (R-1…R-6)

Seeded from migration-approach §6, which holds the full text and rationale:

- **R-1 — Encode before you document.** Lint rule / type / CI gate first; prose is the last resort, and every prose rule links to its enforcing rule or states why it isn't encodable.
- **R-2 — Platform-appropriate by intent, shared by convenience, never LCD by laziness.** Shared implementation while iOS/Android idioms align; split via composition (with an ADR) when they genuinely differ. No speculative divergence.
- **R-3 — The platform is the design reference, not the Flutter app.** Visual change is expected and intended.
- **R-4 — Blockage triage.** Load-bearing blockers → deep-dive + ADR + book update. Leaf problems → fix locally, no ceremony.
- **R-5 — Bounded Flutter maintenance during migration.** Security/critical fixes only in `app/`.
- **R-6 — Serial quality gate.** No feature starts until the previous one is DoD-complete (Phases 0–1).

## Scaffold-time rules (established by the `scaffold-mobile-expo` change, 2026-06)

Rationale for each lives in the change's `design.md` (D1–D8) unless noted.

### Runtime baseline
- **Expo SDK 56** (React Native **0.85.3**), scaffolded directly per K-1's revisit clause (SDK 56 went stable before Phase 0 — the planned 55→56 interim upgrade was skipped). New Architecture + Hermes are SDK defaults and the only supported mode.
- **`expo-dev-client`**: local builds are development builds, never Expo Go.
- **Expo Router** is the navigation backbone (came with the template; planned in the stack doc §4).

### Project placement (D7 — revised during implementation)
- `mobile/` is a **standalone npm project** with its own lockfile, a sibling of `server/` and `app/` — **not** a root-workspace member. Expo pins `react` exactly per SDK; Next floats it; npm workspaces can't isolate the two (overrides don't apply to workspace direct deps; duplicates break expo-doctor). The root workspace remains "web + its generated client."
- **Revisit if:** real package-level sharing between web and mobile emerges (beyond codegen), or the repo moves to pnpm.

### TypeScript
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` on top of `expo/tsconfig.base`; `npx tsc --noEmit` must stay clean. (Encoded in `mobile/tsconfig.json` — this entry is a pointer, per R-1.)

### Native projects: CNG
- `mobile/ios/` and `mobile/android/` are **generated, gitignored, never hand-edited**. All native config flows through `app.config.ts` + config plugins; `npx expo prebuild --clean` is the only way native projects change.

### App identity: `APP_VARIANT` (D4)
- Dynamic `app.config.ts`: unset/`production` → `fr.samuelprak.timecalendar` / "TimeCalendar" / scheme `timecalendar` (preserves store identity — RN ships as an *update* to the Flutter app); `development` → `fr.samuelprak.timecalendar.dev` / "TimeCalendar (Dev)" / scheme `timecalendar-dev` (coexists with the store app on devices).
- The `ios`/`android`/`start` npm scripts set `APP_VARIANT=development`. Switching variants requires `expo prebuild --clean`.
- Known deferral: the `.dev` identifier needs its own Firebase registration — owned by the Firebase foundation step.

### Minimum OS floors (K-2, revisit fired)
- **Effective floors: iOS 16.4 / Android API 24.** K-2 said iOS 15.1, but SDK 56's own minimum deployment target is 16.4, which prevails (K-2's "SDK raises its own minimum" clause — flagged in migration-approach §8). Android's SDK minimum (21) is below our 24, so the K-2 floor stands there.
- Encoded in `app.config.ts` via `expo-build-properties` (kept explicit even where redundant: documents intent, survives SDK default drift).
- Consequence: the Liquid Glass degradation baseline is now iOS 16.4–25 → non-glass fallback; iOS 26+ → Liquid Glass.
