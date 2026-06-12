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

## Data layer (established by the `add-mobile-api-client` change, 2026-06)

Rationale and alternatives live in that change's `design.md` (D1–D8) and its ADR (`adr-001-committed-spec-seam.md`, to be lifted into the `decisions/` log when the five-artifacts step creates it).

### Committed-spec seam
- `openapi/openapi.json` is the **single server↔mobile contract artifact**, committed. Regenerate with `npm run generate:openapi` in `server/` (needs the local docker-compose services up — same prerequisite as `npm test`). The script runs from the built `dist/`: the `@nestjs/swagger` CLI plugin injects response/property schemas at compile time, so a ts-node run would emit a spec missing every response type.
- Enforced by CI (R-1): the `test` job's "Check committed OpenAPI spec matches the server code" step fails on drift and names the regen command.

### Generated client: Orval → `mobile/src/api/generated/`
- TanStack Query v5 hooks + types, generated by Orval (tags-split, `httpClient: 'fetch'`) from the committed spec; regenerate with `npm run generate` in `mobile/`. Generated output is **committed and never hand-edited** — fresh clones typecheck without codegen; API changes land as reviewable per-controller diffs.
- Enforced by CI (R-1): the `test-mobile` job regenerates, fails on drift naming the regen command, then typechecks.

### Single fetch mutator
- Every generated operation calls `customFetch` in `mobile/src/api/mutator.ts`: base-URL prefixing, JSON headers, non-2xx → typed `ApiError<TBody>` carrying status + parsed body. **No axios in mobile.**
- Enforced by codegen config (`orval.config.ts` mutator) and by lint (R-1, debt paid by the `add-mobile-lint-format` change): `no-restricted-globals` bans `fetch` everywhere except `src/api/mutator.ts`, and `no-restricted-imports` bans `axios` — both in `mobile/eslint.config.js` (see Lint & format below).

### Base URL
- `mobile/src/api/config.ts`: `EXPO_PUBLIC_API_URL` ?? production default (`https://api.timecalendar.host:1443`), inlined at build time. The Android-emulator `10.0.2.2` gotcha is documented at the constant.

### Query runtime
- One module-scoped `QueryClient` with **stock defaults**, mounted in `mobile/src/app/_layout.tsx`. Query policy (staleTime/retry/offline persister) is deliberately unset — the first real server-read feature earns it (migration-approach principle 5).

## Lint & format (established by the `add-mobile-lint-format` change, 2026-06)

Rationale and alternatives live in that change's `design.md` (D1–D7). Everything below is encoded in `mobile/eslint.config.js` (R-1) — these entries are pointers plus the caveats the config can't carry.

### Toolchain
- **ESLint 9 flat config** on `eslint-config-expo/flat`; **Prettier identical to web/server** (kept in sync by hand — `mobile/.prettierrc` is a deliberate copy, per the standalone-project placement) and enforced as a lint error via `eslint-plugin-prettier` — one gate covers style and format, `eslint --fix` repairs both.
- **Zero warnings is the policy, encoded in the script**: `npm run lint` is `expo lint --max-warnings 0`, and CI runs that same entrypoint — local and CI cannot diverge on what "clean" means.
- **Pre-commit:** `lint-staged` block in `mobile/package.json` (`eslint --cache --fix`), picked up by the root husky hook.
- `eslint-plugin-react-native-a11y` is ESLint-8-era: loaded via `fixupPluginRules` (`@eslint/compat`) with an npm `override` pinning its eslint peer. If its rules misbehave under a future ESLint, the agreed fallback is a minimal local rule for touchables (design D4).

### Rule inventory
The rules and their exact options live in `mobile/eslint.config.js` (named blocks: `timecalendar/architecture`, `routes-not-importable`, `mutator-owns-fetch`, `generated-code`). What the config can't carry:
- **No hardcoded user-facing strings** (`i18next/no-literal-string`, error). **Known debt:** scaffold template files carry file-level disables tagged `TODO(i18n-step-6)` — the i18n step's DoD includes removing them.
- **A11y on touchables** (`react-native-a11y` touchable rules): touchables/pressables must declare a role or label+hint.
- **Navigation** — `@react-navigation/*` imports banned; Expo Router is the only navigation API.
- **Import boundaries (current layout only):** no parent-relative imports (`../`) — the `@/` alias is the only cross-directory path, which is precisely what makes the alias-pattern rules sound; files outside `src/app/` may not import `@/app/*` (routes are entrypoints, not modules); `axios` banned. Feature-module boundaries (e.g. only a module's `data/queries` touching generated hooks) are deliberately deferred until feature folders exist — expected tooling upgrade then is `eslint-plugin-boundaries`.
- **No raw `fetch`** outside `src/api/mutator.ts`. Caveat: this catches the bare global, not `globalThis.fetch`-style evasion — it guards against accident, not adversaries; review covers the rest.
- **Generated code** (`src/api/generated/`) is exempt from hand-written-code rules but still Prettier-formatted; Orval's `afterAllFilesWrite: prettier --write` keeps regen output aligned with the committed format.
