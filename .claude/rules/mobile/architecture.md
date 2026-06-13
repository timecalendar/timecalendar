# Architecture Book — TimeCalendar mobile (React Native)

> **This directory (`.claude/rules/mobile/`) IS the Architecture Book** — the living set of rules that drive development of `mobile/`. It is not a mirror of a book maintained elsewhere. It holds only rules that *can't* be encoded in tooling; every rule that can be a lint rule, a type, or a CI gate must be (R-1), and prose here links to the enforcing rule once it exists.
>
> **How it changes:** per `docs/react-native-migration/00-exploration/migration-approach.md` §7 — propose, ADR if load-bearing, update the book, append to the [Rule changelog](./architecture-changelog.md) (one of the five living artifacts below). Revising this book is success, not failure: patterns are earned over Phases 0–1.5, not declared on day one.
>
> Topical files (navigation.md, data.md, …) will split out of this one when the content earns it. Until then, everything lives here.

## The five living artifacts

Migration-approach §2 names five living artifacts that drive the migration. All five are siblings under this directory (`.claude/rules/mobile/`) — there is no second book elsewhere. R-1 pointer style: the book links to each, each artifact owns its concern; the book does not duplicate their content. (Created by the `add-mobile-living-artifacts` change, 2026-06 — foundation step 12.)

- **Architecture Book** — *this file* (`architecture.md`): the rules tooling can't encode.
- **ADR log** — [`decisions/`](./decisions/README.md): one record per load-bearing decision (context · choice · revisit-if), with a [README index](./decisions/README.md) and a [template](./decisions/TEMPLATE.md). Seeded with K-1…K-5 as real ADRs ([001](./decisions/001-sdk-target.md)–[005](./decisions/005-calendar-spike.md)).
- **Definition of Done** — [`definition-of-done.md`](./definition-of-done.md): the per-feature finite-perfection checklist every feature passes (the obligations this book defers — manual screen-reader passes, touch targets, contrast, reduced motion, coverage — are captured there).
- **Rule changelog** — [`architecture-changelog.md`](./architecture-changelog.md): the dated, append-only log of every rule change (the act of changing rules is itself recorded; §7).
- **Golden-path exemplar** — [`golden-path.md`](./golden-path.md): a placeholder until Phase 1.5 extracts the real exemplar from features 1–3 (earned, not declared).

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

### Navigation & route structure (established by the `add-mobile-test-harness` change, 2026-06)
Two rules discovered when the schools route was deep-link-tested on a simulator (R-4: load-bearing, so recorded here):
- **Route screens that need a test are thin entrypoints over a `@/components` module.** Expo Router's `require.context` bundles **every** `*.tsx` under `src/app/` as a route — a colocated `*.test.tsx` drags `@testing-library/react-native` (Node-only `console`/`picocolors`) into the Metro bundle and breaks it. The `routes-not-importable` lint then forbids importing the route from a test elsewhere. So the screen lives in `src/components/<name>-screen.tsx` (tested there), and `src/app/<name>.tsx` is a one-line `export { default } from "@/components/<name>-screen"`. Enforced indirectly by the lint boundary (R-1); the Metro-bundling half can't be a lint rule, hence this prose.
- **Non-tab routes require a root `Stack` with the tabs in a `(tabs)` group.** Under a root `NativeTabs` layout, only declared `NativeTabs.Trigger` routes are reachable — a bare sibling route is registered but **cannot** be navigated to (verified: `/explore` navigated via deep link, `/schools` did not; `hidden` triggers are documented as unreachable too). The layout is therefore `src/app/_layout.tsx` = root `Stack` (+ the QueryClient/Theme providers), `src/app/(tabs)/_layout.tsx` = the native tabs, tab screens under `(tabs)/`, and non-tab routes (deep-link / modal / onboarding targets) as `Stack` siblings of `(tabs)`.

### App identity: `APP_VARIANT` (D4)
- Dynamic `app.config.ts`: unset/`production` → `fr.samuelprak.timecalendar` / "TimeCalendar" / scheme `timecalendar` (preserves store identity — RN ships as an *update* to the Flutter app); `development` → `fr.samuelprak.timecalendar.dev` / "TimeCalendar (Dev)" / scheme `timecalendar-dev` (coexists with the store app on devices).
- The `ios`/`android`/`start` npm scripts set `APP_VARIANT=development`. Switching variants requires `expo prebuild --clean`.
- Known deferral: the `.dev` identifier needs its own Firebase registration — owned by the Firebase foundation step.

### Minimum OS floors (K-2, revisit fired)
- **Effective floors: iOS 16.4 / Android API 24.** K-2 said iOS 15.1, but SDK 56's own minimum deployment target is 16.4, which prevails (K-2's "SDK raises its own minimum" clause — flagged in migration-approach §8). Android's SDK minimum (21) is below our 24, so the K-2 floor stands there.
- Encoded in `app.config.ts` via `expo-build-properties` (kept explicit even where redundant: documents intent, survives SDK default drift).
- Consequence: the Liquid Glass degradation baseline is now iOS 16.4–25 → non-glass fallback; iOS 26+ → Liquid Glass.

## Data layer (established by the `add-mobile-api-client` change, 2026-06)

Rationale and alternatives live in that change's `design.md` (D1–D8) and its ADR (`adr-001-committed-spec-seam.md`, indexed in the [`decisions/` log](./decisions/README.md#pending-lifts) as a pending lift — it stays authoritative here in the archive until next revised).

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
- **No hardcoded user-facing strings** (`i18next/no-literal-string`, error). The i18n runtime now backs this rule (see the i18n section below); the scaffold-era `TODO(i18n-step-6)` per-file disables were removed by the `add-mobile-i18n` change. Only the `timecalendar/tests` block exempts literal strings (test fixtures assert them on purpose).
- **A11y on touchables** (`react-native-a11y` touchable rules): touchables/pressables must declare a role or label+hint. The runtime semantics these rules guard — and the heading-role contract lint *can't* see — now live in the a11y section below; the rules are live but unexercised until the first interactive control.
- **Navigation** — `@react-navigation/*` imports banned; Expo Router is the only navigation API.
- **Import boundaries (current layout only):** no parent-relative imports (`../`) — the `@/` alias is the only cross-directory path, which is precisely what makes the alias-pattern rules sound; files outside `src/app/` may not import `@/app/*` (routes are entrypoints, not modules); `axios` banned. Feature-module boundaries (e.g. only a module's `data/queries` touching generated hooks) are deliberately deferred until feature folders exist — expected tooling upgrade then is `eslint-plugin-boundaries`.
- **No raw `fetch`** outside `src/api/mutator.ts`. Caveat: this catches the bare global, not `globalThis.fetch`-style evasion — it guards against accident, not adversaries; review covers the rest.
- **Generated code** (`src/api/generated/`) is exempt from hand-written-code rules but still Prettier-formatted; Orval's `afterAllFilesWrite: prettier --write` keeps regen output aligned with the committed format.

## Testing (established by the `add-mobile-test-harness` change, 2026-06)

Foundation step 5. Rationale and alternatives live in that change's `design.md` (D1–D8) and its specs; these entries are pointers plus the caveats tooling can't carry (R-1).

### Unit / component harness — `jest-expo` (D1)
- **`jest-expo` preset** owns the transform/ignore lists (the RN failure mode the preset exists to prevent — no hand-rolled transform config). `@testing-library/react-native`; tests colocated as `*.test.ts(x)` next to source. `npm test` = `jest --ci`, the same entrypoint locally and in CI (like lint).
- **Mock at the `customFetch` seam, not the network.** Component tests `jest.mock` `src/api/mutator` and drive the *real* generated Orval hook + a real `QueryClient` — the mutator is the designed seam (see Data layer above), so mocking there exercises everything above it without a server. The schools-screen test (`src/components/schools-screen.test.tsx`) is the reference.
- **Coverage is reported, never gated yet.** CI runs `npm test -- --coverage`; **no `coverageThreshold`** (K-3 deferred). Enforced-by-CI: the `test-mobile` job (R-1).

### E2E — Maestro, real round-trip (D2, D5, D6, D7)
- **One flow, real data, deep-linked.** `mobile/.maestro/schools.yaml` launches the dev-variant app, opens `timecalendar-dev://schools`, and asserts a seeded school renders — proving app → generated client → `customFetch` → NestJS → Postgres end to end, nothing mocked. Flows are shared across platforms (stable seeded-text assertions, no per-platform selectors); the `schools` route exists as the round-trip surface and dies when real onboarding lands.
- **Single-command local run:** `mobile/e2e/run_e2e.sh` — lifecycle `up` → `maestro test .maestro/` → lifecycle `down` (teardown on success *and* failure), `--keep-up` debug escape hatch and `--native` passthrough, exits with Maestro's status. It does **not** build/install the app: a release-config dev-variant binary must already be installed (see `mobile/e2e/README.md`).
- **Shared server lifecycle.** The server half is owned by `ci/e2e-server.sh` (compose-first, `--native` for Docker-less macOS) — the same lifecycle the Flutter harness uses. See the `e2e-server-lifecycle` spec; do not re-hand-roll server boot/seed/teardown in a harness.
- **E2E builds are release-config, no Metro, dev-variant identity.** CI builds on GitHub runners via `expo prebuild` + native tooling (Android: Gradle `assembleRelease` → `adb install`; iOS: `xcodebuild -configuration Release -sdk iphonesimulator` → `simctl install`) — never EAS, never debug+Metro. `EXPO_PUBLIC_API_URL` is baked at build time: `http://10.0.2.2:3005` (Android emulator → host) / `http://localhost:3005` (iOS simulator).

### Dev-variant network exceptions (D6)
- **Local-server access rides the `development` variant only**, in `app.config.ts`: Android `usesCleartextTraffic: true` (via `expo-build-properties` — release builds block cleartext HTTP by default, which would silently break the `10.0.2.2` call) and iOS `NSAppTransportSecurity.NSAllowsLocalNetworking` (belt-and-braces over ATS's loopback exemption). **Production identity is untouched — the store app can never talk cleartext.** Verified by `expo config --json` diff between variants; can't be a lint rule (config-shape, not source), hence this prose (R-1).

### CI topology (D8 — workflows split 2026-06, see below)
- `test-mobile` gains the Jest step (after lint). New `e2e-mobile-android` (ubuntu, KVM emulator, reuses the `build-server` image artifact via `E2E_SERVER_IMAGE`) and `e2e-mobile-ios` (macOS runner, Postgres/Redis provisioned natively because GitHub macOS runners have no Docker — the `--native` seam). Both upload Maestro debug output + server logs on failure (R-1).

### Workflow split + on-demand E2E (established 2026-06, post-harness)
The monolith `.github/workflows/build.yaml` was split by concern; native E2E is no longer run on every push (cold native build + device boot is ~20–30 min/platform — toolchain cost, not app size).
- **`ci-build-deploy.yml`** — server/web images, server tests, deploy (every push; deploy self-gates to main/production).
- **`ci-mobile.yml`** — `test-mobile` (gen-drift, tsc, lint, Jest); path-filtered to `mobile/**` + `openapi/**`.
- **`ci-mobile-e2e.yml`** — `e2e-mobile-android` + `e2e-mobile-ios`, **on-demand**: PRs only with the **`run-e2e` label**, always on main/production when mobile/openapi changed. Self-contained — builds its own server image (`cache-from: type=gha`, a fast hit when `ci-build-deploy` already built that SHA) since artifacts don't cross workflow runs. The Android job inherits the label gate via `needs: build-server`.
- **`ci-flutter.yml`** — legacy `test-app` + Flutter `test-e2e`, demoted to main/production pushes touching `app/**` (R-5 bounded maintenance).
- **Branch-protection caveat:** path-filtered jobs that are skipped don't report a status — if any of these become *required* checks, a skip can block a PR. None are required today.

### CI E2E caching speedups (recorded debt — not yet done)
- Native E2E runs cold every time in CI (local builds are fast only because Gradle/DerivedData/Pods caches persist on disk). Deferred speedups: ① **AVD snapshot caching** for the Android emulator (skip cold boot); ② **iOS DerivedData cache** keyed on the lockfile (point `xcodebuild -derivedDataPath` outside the `prebuild --clean` tree so it survives); ③ confirm the **Gradle build cache** (not just deps) is active. Realistic gain ~Android 28→18 min, iOS 18→10 min on warm caches. Orthogonal to the on-demand split above. **Trigger:** when E2E run time becomes a friction point. Roadmap mirror: `docs/react-native-migration/01-roadmap/01-foundation.md` step 5.

### K-3 deferral (recorded debt)
- **No `coverageThreshold` yet.** Coverage is reported from day one so the gate has a baseline to land on, but the threshold is deliberately unset per K-3's cargo-cult revisit clause. **Trigger:** the first logic-bearing feature (Settings) earns the threshold — that feature's DoD includes setting it.

## i18n (established by the `add-mobile-i18n` change, 2026-06)

Foundation step 6 (migration-approach §1's vertical-slice order: UI → data → storage → **i18n** → a11y). This step added the *runtime* half of i18n — the lint half (`i18next/no-literal-string`, see Lint & format) was already live with nothing to point at. Rationale and alternatives live in that change's `design.md` (D1–D8) and `specs/mobile-i18n/spec.md`; these entries are pointers plus the caveats tooling can't carry (R-1).

### Runtime — i18next + react-i18next (+ expo-localization) (D1)
- One module-scoped i18next instance lives in `src/i18n/index.ts`, created with `createInstance()` and `.use(initReactI18next)` so `useTranslation()`/`t()` resolve it **without an `<I18nextProvider>`** (initReactI18next registers it as react-i18next's default). Initialization is **synchronous** from bundled JSON catalogs — no network, no suspense/loading gate; the app renders already-localized. Wired by a side-effect `import "@/i18n"` at the top of `src/app/_layout.tsx`.
- `i18next` chosen because the already-live lint rule assumes i18next/`t()` idioms (Lingui/FormatJS were rejected — they'd orphan that rule for no benefit at this scale).

### Locale detection — device locale, EN fallback, no switcher (D2)
- `src/i18n/detect-locale.ts` reads `expo-localization`'s device locales and returns the first that matches `fr` or `en`, else **`en`**. EN (not FR) fallback is deliberate for the non-FR/EN long tail despite the French-first store identity — a predictable English baseline beats forcing French on, e.g., a German device. The store app still ships FR for FR devices.
- **No in-app language switcher and no persisted override** — that's a Settings (Phase 1.5) concern and would pull the unbuilt MMKV storage seam (step 9) forward. The skeleton follows the device only.
- `expo-localization` is a native module: added to `app.config.ts` `plugins`; it autolinks and native projects are CNG-regenerated on the next `prebuild` (the e2e build already prebuilds). No hand-edited native config.

### Flat, greppable keys — `keySeparator: false` + `nsSeparator: false` (D3)
- A key is one literal dotted string (`profile.tab.label`) stored verbatim as a flat top-level JSON key, so the string in code is byte-for-byte the string in the catalog — `grep` finds both call site and definition. Both separators are disabled so object-nesting is *structurally* unresolvable and the convention can't silently drift back to nested lookups; the dotted segments are a **naming convention**, not i18next structure. Plurals still work (i18next suffixes the flat key: `…_one` / `…_other`). **Escape hatch** if a catalog grows: split source JSON into multiple files merged into the one `translation` namespace at init — reintroducing real `:` namespaces is the one thing that breaks the grep property, so we won't.

### Typed keys + FR/EN parity, both compile-time (D4, D5)
- `src/i18n/i18next.d.ts` augments `react-i18next`'s `CustomTypeOptions` with `resources: { translation: typeof en }` and `keySeparator: false`, so the `t()` key argument is the union of EN catalog keys — a missing/mistyped key is a **`tsc` error**, not a silent key-as-fallback. EN (`src/i18n/locales/en.json`) is the canonical key set; FR (`fr.json`) is the translation.
- FR/EN parity is enforced **bidirectionally** in `index.ts` by typing each catalog against the other's key set (`Record<keyof typeof en, string>` and vice-versa): a *missing* FR key and an *extra* FR key both fail `tsc`. No separate parity script (recorded as optional deferred debt if catalogs grow). FR + EN are both required complete this step — a missing FR key *should* fail CI.

### Proof in CI (D8)
- `src/i18n/i18n.test.tsx` renders a localized component through the real instance under the default locale and asserts the **translated** value renders (not the raw key) — proving init + `t()` + catalog resolve end to end, not merely that the files exist. i18n is initialized for the whole Jest suite via `jest/setup-i18n.ts` (`setupFilesAfterEnv`), mirroring the app's startup wiring, so every component test resolves real strings. Gated by the `test-mobile` job (tsc + lint + Jest), R-1.

### Scaffold reshaped to the real app (D7)
- The two tab routes survive as navigation chrome, relabeled to the real app's vocabulary (Flutter bottom nav = Accueil / Calendrier / Profil) and gutted to minimal localized stubs: `(tabs)/index.tsx` → Home (**Accueil**); `(tabs)/explore.tsx` **renamed** `(tabs)/profile.tsx` → Profile (**Profil**), with the `app-tabs` trigger `name` and `href` changed to match. The **Calendar tab is deliberately deferred** (calendar is built last; a tab to a deferred screen is speculative — R-2). `app-tabs` / `app-tabs.web` labels are localized; the web tab bar's Expo-demo brand/Docs-link were dropped. `schools-screen.tsx` (the live API round-trip surface for the test/e2e harness) is localized.
- The Expo-logo splash animation (`AnimatedSplashOverlay`) and the orphaned demo helpers (`animated-icon`, `web-badge`, `hint-row`) were **deleted**; the real splash is roadmap step 13. All six `eslint-disable i18next/no-literal-string` (`TODO(i18n-step-6)`) headers are gone — only the `timecalendar/tests` block exempts literal strings.

### Deferred (recorded debt — not built)
- **No locale-aware date/number formatting** — earns its place with the first feature that needs it (Hermes `Intl` is available; not wired now).
- **No in-app language switcher / persisted override** — Settings (Phase 1.5), needs the MMKV seam (step 9).
- **No ICU MessageFormat, no catalog-parity/sort CI lint** — `tsc` covers parity today; revisit if catalogs grow.

## Accessibility (established by the `add-mobile-a11y` change, 2026-06)

Foundation step 7 (migration-approach §1's vertical-slice order: UI → data → storage → i18n → **a11y**). Like i18n, the **lint half** landed early (with `add-mobile-lint-format`, step 4); this step adds the *runtime* half — heading semantics, accessible async status, a CI proof that the accessibility tree resolves — and records what lint can't enforce. Rationale and alternatives live in that change's `design.md` (D1–D6) and `specs/mobile-a11y/spec.md`; these entries are pointers plus the caveats tooling can't carry (R-1).

### What the live lint rules enforce, and where they bite (D4)
- Four `react-native-a11y` rules run as **error**: `has-accessibility-props`, `has-valid-accessibility-descriptors`, `has-valid-accessibility-role`, `no-nested-touchables` (see Lint & format above; `mobile-lint-format` owns them). `i18next/no-literal-string` covers `accessibilityLabel`/`accessibilityHint` so a11y copy is translated too.
- The touchable rules' **first live consumer is the `__DEV__`-only `FirebaseDebugPanel`** (added by `add-mobile-firebase`, step 8): its two `Pressable`s each declare `accessibilityRole="button"` + a translated `accessibilityLabel`, which is exactly what `has-accessibility-props` / `has-valid-accessibility-role` require. Before it, `mobile/src/` had no touchable and the rules guarded an empty surface — wiring the cross-cutting rule before the feature is the foundation philosophy, and no touchable was invented to "prove" them (R-2). The **first real product interactive control (onboarding/Settings)** remains where the runtime obligations below (touch targets, meaningful labels, screen-reader passes) first bite.

### The heading-role contract — encoded in `ThemedText` (D1, R-1)
- `ThemedText` maps `type="title"` and `type="subtitle"` to `accessibilityRole="header"`, so titles are exposed to VoiceOver/TalkBack as headings (rotor/heading navigation) without each call site declaring the role. A caller-supplied `accessibilityRole` **still wins** (the default is applied only when unset; `{...rest}` spreads last). Encoded in the **component**, not a lint rule, because lint cannot know which `<Text>` is semantically a heading — that's authorial intent tied to the visual `type`, and the component already owns `type→style`, so it owns `type→role` too. Body/default/small/link/code variants carry **no** role.
- Async status: the schools screen's loading/error text carry `accessibilityLiveRegion="polite"` (Android announces the change) and a status role (`text` / `alert`) so assistive tech conveys the state rather than reading a silent node. Kept minimal — the schools screen dies when real onboarding lands (D2).

### Proof in CI (D3)
- `src/components/themed-text.test.tsx` renders title/subtitle through the real accessibility tree and asserts `getByRole("header")` finds the node — a *resolved semantic*, not merely that a prop was passed (the layer lint can't see). It also covers the negative path (default variant has no header role) and explicit-role-wins. Gated by the `test-mobile` job (tsc + lint + Jest), R-1. Mirrors the i18n proof test.

### What lint can't encode → prose, each with reason + owner (D5, R-1)
None of these is a sound lint rule today; each is recorded so the owning step/feature inherits it:
- **Dynamic Type / font scaling** — RN `Text` scales with the OS font size by default; the posture is simply **never** pass `allowFontScaling={false}`. Not a lint rule this slice (no offender exists); a `no-restricted-syntax` guard is deferred debt, to add the day someone reaches for it.
- **Touch-target minimums (44pt iOS / 48dp Android)** — a runtime layout property, not statically checkable; no touchable exists yet. Owned by the first interactive control and the DoD a11y checklist.
- **Meaningful labels** — lint guarantees a label *exists* on a touchable, never that it's *meaningful* or correctly translated; human review + the translated-copy rule cover semantics.
- **Manual screen-reader passes (VoiceOver / TalkBack)** — focus order, grouping, announcement quality: runtime behavior no static tool can assert. Owned by the [Definition of Done](./definition-of-done.md) (Accessibility axis); this change names a11y's slot in it.
- **Reduced motion** — no animations exist now (the Expo splash animation was deleted in step 6); the real splash (step 13) and any future animation must honor `AccessibilityInfo.isReduceMotionEnabled`. Recorded so step 13 inherits the obligation.
- **Color contrast** — a theme-token property, not lint-encodable; owned by theming (step 10) and the splash DoD.

### Deferred (recorded debt — not built)
- **No new lint rules, no a11y infrastructure** — no Dynamic-Type override-guard rule, no touch-target helper, no reduced-motion hook, no contrast check. Each is earned by the step/feature that first needs it.
- **No manual screen-reader DoD checklist** — now lives in the [Definition of Done](./definition-of-done.md) (Accessibility axis); this change only named a11y's place in it.

## Firebase — Crashlytics + Analytics (established by the `add-mobile-firebase` change, 2026-06)

Foundation step 8 — the first real instrumentation in the skeleton (`mobile/src/` had no crash reporting, analytics, or global error handling before this; only a typed `ApiError` and query-driven `isError` states). It also discharges the scaffold-era deferral *"the `.dev` identifier needs its own Firebase registration."* Rationale and alternatives live in that change's `design.md` (D1–D7) and `specs/mobile-firebase/spec.md`; these entries are pointers plus the caveats tooling can't carry (R-1).

### SDK + API
- **`@react-native-firebase/{app,crashlytics,analytics}` v24, modular API only** (`getAnalytics`/`logEvent`, `getCrashlytics`/`log`/`recordError`/`crash`). The namespaced `firebase.crashlytics()` style is deprecated in v22+. The Firebase **JS/Web SDK was rejected** — it can't capture native crashes (D1). **Auth + Messaging deferred** to the features that need them despite the Flutter app using both (R-2).

### One Firebase project per environment (D2)
- Google best practice — Analytics/Crashlytics/quotas/billing are project-scoped, so dev noise must not pollute production. `app.config.ts` switches `googleServicesFile` by `APP_VARIANT` (reusing the existing `IS_DEV` branch): dev `fr.samuelprak.timecalendar.dev` → **`timecalendar-dev`** project; production `fr.samuelprak.timecalendar` → **`timecalendar-samuelprak`** (shared with the Flutter app, reusing its committed config files).
- The four config files live **committed** in `mobile/firebase/` (`google-services{,.dev}.json`, `GoogleService-Info{,.dev}.plist`). Client API keys are **not secret** (shipped in the binary); the Flutter app commits its pair too. **Manual prerequisite:** the `.dev` apps must be registered in the `timecalendar-dev` console and the files dropped in — see `mobile/firebase/README.md`. Native builds / e2e fail until then; `tsc`/lint/Jest don't read the files, so CI `test-mobile` is unaffected. Can't be a lint rule (console + binary config), hence this prose (R-1).

### iOS static frameworks (D3) — mandatory, highest-risk
- `expo-build-properties` carries `ios.useFrameworks: "static"` (merged into the existing block alongside the iOS/Android floors and the dev cleartext flag) — the Firebase iOS SDK ships static frameworks. This alters pod linking **app-wide**; if a pod breaks, the documented escape is `ios.forceStaticLinking` for the RNFB pods. Verified only by a real prebuild (config-shape, not source) — prose, not lint (R-1).

### Wrapper seam, no startup side-effect (D4)
- `src/firebase/index.ts` is the **single seam** the app touches — `logEvent` / `logMessage` / `recordError` / `crashTest` over the modular SDK; feature code imports `@/firebase`, never `@react-native-firebase/*` directly (swappable, per the step-10 "behind our own abstractions" posture). Each helper resolves the native instance **lazily** inside its body, so importing the module never touches native code (safe in Jest).
- **Deliberately unlike i18n: there is no `import "@/firebase"` in `_layout.tsx`.** RNFirebase **auto-initializes** the native default app from the bundled config files and **auto-installs the global JS exception handler** — so unhandled JS errors reach Crashlytics for free and there is nothing to run at startup. A side-effect import to mirror i18n would be cargo-culting; revisit only if a real startup action appears (consent toggle, user-id attribute).

### Debug-build reporting + verification surface (D5, D6)
- `mobile/firebase.json` sets `crashlytics_debug_enabled: true` so a local `npm run ios/android` (debug + Metro, dev variant) reports a forced crash; release/e2e builds report regardless.
- The `__DEV__`-gated `FirebaseDebugPanel` on the Profile tab (log a test event / force a test crash) is the on-demand verification surface — and the **first live exercise of the a11y touchable rules** (see the a11y section). Gated by `__DEV__` so it never renders in production.

### What CI proves vs. what's manual (D7)
- `src/firebase/firebase.test.ts` mocks the native modules (`jest/setup-firebase.ts`, suite-wide, mirroring `setup-i18n`) and asserts the wrapper drives the SDK with the expected args — wiring proven in CI (`test-mobile`: tsc + lint + Jest, R-1). CI **cannot** assert an event/crash *arrives* in the console — that half is the documented **manual on-device step**: DebugView for the event, the Crashlytics dashboard for the crash (`add-mobile-firebase` tasks §7). The Maestro e2e is unchanged (asserts a seeded school name); Firebase just must not break app launch.

### Deferred (recorded debt — not built)
- **Auth, Messaging** — their own features.
- **Analytics consent / GDPR gate** — collection is on-by-default now to verify; a consent gate is owned by a later feature. The French user base makes it real; recorded so that feature inherits it.
- **Custom event taxonomy; native dSYM symbolication** beyond what the Crashlytics config plugin wires automatically.

## Storage — MMKV (key-value) + expo-sqlite/Drizzle migration runner (established by the `add-mobile-storage` change, 2026-06)

Foundation step 9 — the walking skeleton's two persistence seams and the **migration runner**, wired and CI-green before any feature needs them, with **no feature schema, no feature tables, no persisted keys** (roadmap risk note: the skeleton walks, it doesn't run). The shape follows the `src/firebase/` and `src/api/mutator.ts` posture — thin owned seams over native backends, lazy/module-scoped, one CI proof each. Rationale and alternatives live in that change's `design.md` (D1–D8) and `specs/mobile-storage/spec.md`; these entries are pointers plus the caveats tooling can't carry (R-1).

### Two swappable seams (D1, D2)
- **`src/storage/` over `react-native-mmkv` v4** (a JSI **Nitro Module**, New-Arch-native — the only supported mode under SDK 56; needs the `react-native-nitro-modules` peer). One module-scoped `createMMKV()` instance; a **minimal typed API** — `getString`/`setString`, `getBoolean`/`setBoolean`, `getNumber`/`setNumber`, `has` (over `contains`), `remove`. No JSON-object helper, no encryption/multi-instance until a consumer needs them (R-2). v4 over v3 (`createMMKV()` not `new MMKV()`, `remove` not `delete`).
- **`src/db/` over `expo-sqlite` + `drizzle-orm`** (`drizzle-orm/expo-sqlite`). One module-scoped `openDatabaseSync("timecalendar.db")` handle and `drizzle(expo)` instance. `expo-sqlite` is the Expo-managed SQLite (stays in the Expo upgrade lane) — `op-sqlite` was rejected for leaving that lane with no current need (R-2).
- Feature code imports `@/storage` / `@/db`, never the backends directly — **lint-enforced** (see below), the encoded form of the boundary the firebase section only documented in prose.

### Startup migration runner over a committed bundle (D3, D4)
- `runMigrations()` in `src/db/migrate.ts` — a **non-hook** async function calling Drizzle's `migrate(db, migrations)` from `drizzle-orm/expo-sqlite/migrator`, passed the committed bundle. Non-hook (not `useMigrations()`) because the runner is infrastructure, not UI: testable in isolation, invokable from a startup side-effect, decoupled from render. Invoked fire-and-forget (`void runMigrations()`) at the top of `src/app/_layout.tsx`, mirroring the `import "@/i18n"` wiring. A failure is `recordError`'d through the `@/firebase` seam (a failed migration is a crash-worthy event) — never swallowed.
- The committed bundle (`src/db/migrations/` — `meta/_journal.json` + `migrations.js`) is **empty this step** (zero migrations). `migrate()` still creates/advances Drizzle's `__drizzle_migrations` tracking table and leaves the DB at version 0 — a valid, idempotent green run that **proves the runner runs**. We did **not** invent a `_meta`/no-op table to "prove" it (that's a feature schema by another name — R-2). The bundle's shape is exactly what `drizzle-kit generate` (driver `expo`) emits, minus `.sql` imports; the **first feature** regenerates it via `npm run generate:migrations` once it adds `src/db/schema.ts` (the `migrations.js` `.js` side is hand-stable; `migrations.d.ts` types it since tsconfig doesn't `allowJs`).
- **The `useMigrations()` hook (loading-gate) pattern is what features inherit** when a feature's *first read must wait on its tables* — gate a loading screen on `{ success, error }`. Recorded here; not used this step (no screen to gate, no schema to migrate).

### SQL-bundling toolchain (D5)
- Drizzle's Expo migrator consumes a **bundled** `migrations.js` that inline-imports `.sql` files at build time, and Metro must resolve `.sql`. So this step **created** (where none existed) `mobile/babel.config.js` (`babel-preset-expo` + `["inline-import", { extensions: [".sql"] }]`) and `mobile/metro.config.js` (`getDefaultConfig(__dirname)` + `config.resolver.sourceExts.push("sql")`), plus `mobile/drizzle.config.ts` (`dialect: "sqlite"`, `driver: "expo"`, `schema: "./src/db/schema.ts"`, `out: "./src/db/migrations"`) and the `generate:migrations` npm script (`drizzle-kit generate`). These are **inert today** (no `.sql` files) but are the contract the first schema-bearing feature relies on — it adds a schema and runs one command, not build plumbing. Both configs are built from the Expo defaults plus only the documented Drizzle additions (not config drift). Caveat: these are config-shape, verified by build/e2e, not lint (R-1).

### Native config flows through CNG (D8 — no new build-properties)
- `expo-sqlite` registers as a **config plugin** entry in `app.config.ts` `plugins`; `react-native-mmkv` v4/Nitro **autolinks with no plugin entry**. Both link under the **existing** iOS `useFrameworks: "static"` (set by firebase) — **no new `expo-build-properties` change**. Native projects regenerate on the next `expo prebuild`; never hand-edited. If a Nitro/SQLite pod breaks under static linking, the escape is the same `ios.forceStaticLinking` lever firebase named. Verified only by a real prebuild (config-shape, not source) — prose, not lint (R-1).

### The seam-import lint boundary (D6, R-1)
- `mobile/eslint.config.js` (`storageBackendImportPatterns`, applied via the shared `restrictedImports()` to **all** files; re-set without the storage patterns for `src/storage/**` + `src/db/**` in the `timecalendar/storage-seams` block, since those dirs *are* the wrappers): a `no-restricted-imports` pattern bans `react-native-mmkv`, `expo-sqlite`, and `drizzle-orm` (+ subpaths) everywhere except the seam dirs. The swappable-seam posture is now **enforced**, not just documented — and this retroactively closes the gap the firebase section left in prose. Flat-config caveat: re-setting `no-restricted-imports` *replaces* options (doesn't merge), hence the separate seam-dir block.

### What CI proves vs. what's on-device (D7)
- `src/storage/storage.test.ts` round-trips each typed helper through the seam — a **genuine** round-trip (MMKV v4's built-in in-memory mock, `createMockMMKV`), not a hand-written stub. **Caveat the planner flagged and that bit:** MMKV v4's auto-mock (`isTest()` → `createMockMMKV`) does *not* load under jest-expo on its own — its factory module imports `react-native-nitro-modules` at the top level, whose import chain throws off-device *before* `isTest()` runs. So `jest/setup-storage.ts` stubs `react-native-nitro-modules` suite-wide (mirroring `setup-firebase`/`setup-db`); MMKV's own mock then provides the real round-trip.
- `src/db/migrate.test.ts` drives `runMigrations()` with the SQLite seam mocked suite-wide (`jest/setup-db.ts` mocks `expo-sqlite`, `drizzle-orm/expo-sqlite`, and `.../migrator` — expo-sqlite has **no off-device JS**, exactly firebase's native-module situation) and asserts `migrate()` is called with the committed bundle, and that a thrown migration error is recorded through `@/firebase`. This proves the **wiring** (handle → drizzle → migrator → observability) in CI (`test-mobile`: tsc + lint + Jest, R-1).
- CI **cannot** assert tables materialize on disk; that half is **on-device** — the Maestro e2e launches the app, which runs `runMigrations()` at startup, so a launch that doesn't crash is the real-application proof (exactly firebase's "must not break app launch"). No new Maestro flow this step.

### Deferred (recorded debt — not built)
- **No feature schema, no feature tables, no persisted keys** — the first feature owns the first migration and the first key.
- **No query/repository layer, no `useLiveQuery`, no offline-sync, no TanStack Query SQLite persister** — earned by features.
- **No MMKV encryption / multi-instance / secure-store** — single default instance now; encryption is a later decision when sensitive data appears.
- **K-3 coverage threshold** still owned by the first logic-bearing feature (Settings).
