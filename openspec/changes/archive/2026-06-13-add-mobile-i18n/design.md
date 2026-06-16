# Design — mobile i18n (FR + EN)

## Context

`mobile/` already enforces `i18next/no-literal-string` (`error`, jsx-only) via `eslint-plugin-i18next`, but has **no i18n runtime** — so six scaffold files carry `eslint-disable` headers tagged `TODO(i18n-step-6)`. This change adds the runtime, catalogs, and the proof that the rule guards something real, then removes the suppressions. It is foundation step 6 (migration-approach §1's vertical-slice order: UI → data → storage → **i18n** → a11y).

Constraints shaping the design:
- **No real feature exists yet.** Settings (the natural home of a language switcher) is Phase 1.5; the splash screen is step 13; calendar is built *last*. The skeleton "walks, it doesn't run" — this step wires a framework with only scaffold consumers.
- **MMKV storage (step 9) is not built**, so nothing can persist a user locale override yet.
- **R-1**: encode in tooling before prose. The lint rule already exists; the new enforcement lever here is compile-time typed keys.
- **R-2 / R-3**: platform-appropriate, no speculative divergence; the platform — not the Flutter app — is the design reference. The Flutter app is consulted only for real-world vocabulary (tab names), not copied.
- **The Flutter app has no translation catalog to port**: it declares `supportedLocales: [fr, en]` but ships zero `.arb` files and hardcodes Dart strings. The RN catalog is built fresh.

## Goals / Non-Goals

**Goals:**
- i18next + react-i18next initialized once at app startup, FR + EN catalogs loaded.
- Locale follows the device (`expo-localization`); deterministic EN fallback.
- Keys are flat, greppable dotted strings, identical in code and catalog.
- `t()` is type-checked against the catalog (missing/typo'd key = `tsc` error).
- All six `TODO(i18n-step-6)` suppressions removed; `npm run lint` green with no per-file i18n disables outside tests.
- One unit test proves a translated string renders through the real i18next instance.
- Architecture Book gains an i18n section; roadmap step 6 marked done.

**Non-Goals:**
- **No in-app language switcher / persisted override** — deferred to Settings (Phase 1.5); would pull the unbuilt MMKV seam forward.
- **No locale-aware date/number formatting** — earns its place with the first feature that needs it (Hermes `Intl` is available; not wired now).
- **No real feature screens.** Tab routes stay scaffold-thin stubs.
- **No Calendar tab** — calendar is built last; wiring a tab to it now is speculative scaffolding.
- **No ICU MessageFormat / catalog-lint CI gate** — recorded as deferred debt, not built.
- **No change to the `no-literal-string` rule's mode or options** — only the suppressions are removed.

## Decisions

### D1 — Runtime: i18next + react-i18next (+ expo-localization)
The installed `eslint-plugin-i18next` assumes i18next/`t()` idioms, so i18next is the zero-friction pairing. `react-i18next` gives the `useTranslation()` hook and `<Trans>`; `expo-localization` reads the device locale. *Alternatives:* Lingui (compile-time extraction, ICU) and FormatJS/react-intl (ICU-first) — both rejected because they'd orphan or replace the already-chosen lint rule, contradicting the "rule already live" starting point, for no benefit at this scale.

### D2 — Locale detection: device locale, EN fallback, no switcher
`expo-localization`'s device locales are matched against `['fr','en']`; first match wins; otherwise **EN**. EN (not FR) fallback was chosen deliberately for non-FR/EN devices despite the app's French-first store identity — a predictable English baseline beats forcing French on, e.g., a German device. No persisted override (see Non-Goals / D2-rationale: MMKV unbuilt, Settings owns the switcher). *Alternative:* FR fallback — rejected as worse default for the long tail of non-FR/EN devices.

### D3 — Flat "natural" keys: `keySeparator: false` + `nsSeparator: false`
A key is one literal dotted string (`profile.tab.label`), stored verbatim as a flat JSON key:
```json
{ "profile.tab.label": "Profile" }
```
So the string in code is byte-for-byte the string in the catalog — `grep` finds both the call site and the definition. Disabling both separators makes object-nesting *structurally* impossible to resolve, so the convention can't silently drift back to nested lookups. The dotted segments are a **naming convention**, not i18next structure. *Trade-off:* flat JSON loses nested visual grouping when editing — accepted, greppability is the priority. Plurals still work (i18next suffixes the flat key: `…_one` / `…_other`). *Escape hatch* if catalogs grow: split source JSON into multiple files merged into one `translation` namespace at init — preserves flat keys; reintroducing real `:` namespaces is the one thing that breaks the grep property, so we won't. *Alternative:* default nested keys + namespaces — rejected for the grep pain that motivated this whole sub-decision.

### D4 — Typed keys via react-i18next module augmentation
A `src/i18n/i18next.d.ts` augments `CustomTypeOptions` with `resources: { translation: typeof en }` and `keySeparator: false`, so the `t()` key argument is the union of flat catalog keys. A missing or mistyped key is a **compile error**, not a silent key-as-fallback. This is the R-1 enforcement that "the whole path exists" — stronger than any runtime check. EN is the source-of-truth catalog the types derive from; FR is checked for key-parity by the same `typeof` shape (a missing FR key surfaces as a type mismatch if we type FR against EN — see D5). *Alternative:* untyped `t()` — rejected, loses compile-time catch, off-brand for the repo's CI-gate posture.

### D5 — Catalog layout & parity
`src/i18n/locales/en.json` and `fr.json`, single `translation` namespace, flat dotted keys. EN is the canonical key set (types derive from it). FR parity is guarded by typing `fr` as `typeof en` (or a `satisfies` check) so a missing/extra FR key fails `tsc`. No separate parity script needed now (recorded as optional deferred debt if catalogs grow).

### D6 — Init & provider placement
i18n is initialized in a `src/i18n/index.ts` module imported for its side effect at the top of `src/app/_layout.tsx`, and `<I18nextProvider>` (or reliance on the default instance via `initReactI18next`) wraps the tree alongside the existing QueryClient/Theme providers. Initialization is synchronous (catalogs are bundled JSON, not lazily fetched), so no suspense/loading gate is needed — the app renders already-localized.

### D7 — Suppressions removed; tabs reshaped to the real app, calendar deferred
The two tab routes are navigation chrome and survive, but are relabeled to the real app's vocabulary (Flutter bottom nav = Accueil / Calendrier / Profil) and gutted to minimal localized stubs:
- `(tabs)/index.tsx` → Home (**Accueil**) stub.
- `(tabs)/explore.tsx` → renamed `(tabs)/profile.tsx` → Profile (**Profil**) stub; the `app-tabs` trigger `name` and label change with it.
- **Calendar tab deferred** (built last; a tab to a deferred screen is speculative — R-2).
- `app-tabs.tsx` / `app-tabs.web.tsx` labels localized.
- `schools-screen.tsx` real strings localized (it stays — the live API round-trip surface for the test/e2e harness).
- Orphaned demo helpers deleted: `web-badge`, `hint-row`, `animated-icon` (+ `.web` variants).

All six `eslint-disable i18next/no-literal-string` headers are removed. The test-file exemption (`timecalendar/tests` block) stays — test fixtures assert literal strings on purpose.

### D8 — Proof in CI
The existing Jest harness gets one test rendering a localized component (default locale) and asserting the translated EN string appears — proving init + provider + `t()` + catalog resolve end to end, not just that the files exist. The Maestro e2e asserts a *seeded school name* (data, not chrome), so localizing UI chrome doesn't touch it.

## Risks / Trade-offs

- **Flat JSON loses editing-time grouping** → keys are namespaced by convention (`profile.*`, `schools.*`); revisit file-splitting (merged into one namespace) only if a catalog gets large.
- **Renaming `explore` → `profile` route changes a deep-link path** → no production deep link targets `explore` (scaffold-only); the documented test deep link is `timecalendar-dev://schools`, untouched. Verify no Maestro flow references `explore`.
- **Typing FR against EN could block a legitimately-in-progress translation** → acceptable: FR + EN are both required complete this step (migration-approach §"i18n — FR + EN complete"); a missing FR key *should* fail CI.
- **`expo-localization` is a native module** → autolinks; native projects are CNG/gitignored and regenerated on the next `prebuild` (the e2e build already prebuilds). No hand-edited native config.
- **EN fallback vs French-first store identity** → deliberate (D2); the store app still ships FR for FR devices; fallback only affects the non-FR/EN long tail.
- **Deleting demo helpers could orphan an import** → grep/LSP for references before deletion; `tsc` + lint catch any stragglers in CI.

## Migration Plan

Additive, no runtime data or server impact; rollback = revert the change. Order: add deps → build `src/i18n/` (init, detection, catalogs, types) → wire `_layout.tsx` → relabel/gut tab stubs + rename `explore`→`profile` → localize `schools-screen` → delete orphaned helpers + all suppressions → add proof test → update Architecture Book + roadmap. Gate locally and in CI on `tsc`, `npm run lint` (zero warnings, no i18n disables), `npm test`.

## Open Questions

None blocking. Deferred (recorded, not built): catalog-parity/sort CI lint; locale-aware date/number formatting; in-app language switcher + MMKV persistence (Settings, Phase 1.5).
