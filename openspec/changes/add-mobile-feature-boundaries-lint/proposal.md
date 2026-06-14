# Encode the feature-module import boundaries with eslint-plugin-boundaries

## Why

Phase 1.5 (`harden-mobile-golden-path`, PR #159) **blessed** the layered
feature-module pattern as [ADR 014](../../../.claude/rules/mobile/decisions/014-layered-feature-module-pattern.md)
and documented its import boundaries in the
[golden-path exemplar](../../../.claude/rules/mobile/golden-path.md) — but it
**deferred the encodable enforcement to TIM-135**. The Architecture Book ("Lint &
format → Rule inventory"), the golden-path exemplar ("Seam conventions"), ADR 009,
and ADR 014 all name "`eslint-plugin-boundaries` (TIM-135)" as the pending follow-up
that formalizes boundaries currently **review-enforced only**.

This change is that follow-up. R-1 is the spine of this whole architecture — *encode
before you document* — and these four boundaries are the last load-bearing rules in
`mobile/` that live in prose + reviewer diligence rather than a CI gate. They are
also the boundaries that protect the seams every prior foundation step built (the
generated-API seam, the `@/db` seam, the feature barrels): a screen reaching past a
feature barrel into `@/api/generated` or `@/db`, or a sublayer closing an import
cycle through its own feature barrel, is exactly the drift this lint stops cold the
moment it lands — not at review, weeks later.

It also discharges the **open question ADR 009 parked for this exact moment**: when
`eslint-plugin-boundaries` lands, either *allow* the infra→`features/settings/prefs`
edge as a documented seam, or *promote* the prefs store to an infra-level module.

## What Changes

- Add `eslint-plugin-boundaries` (v6, ESLint-9 flat-config native) as a `mobile/`
  devDependency, plus `eslint-import-resolver-typescript` as an **explicit**
  devDependency (it is required to resolve the `@/` alias for boundary analysis and
  is currently only a transitive of `eslint-config-expo` — depending on a transitive
  is fragile across an expo-config bump).
- Add a new `timecalendar/feature-boundaries` block to `mobile/eslint.config.js`
  (mirroring the existing `timecalendar/*` named-block style + heavy explanatory
  comments — the config file *is* the rule's documentation, R-1) that declares the
  element taxonomy (`settings['boundaries/elements']`) and a single
  `boundaries/dependencies` rule (the non-deprecated v6 successor to
  `element-types` + `entry-point`) expressing the four boundaries B-1…B-4 from
  ADR 014 / golden-path.md:
  - **B-1** — only a feature's `data/` sublayer may import `@/api/generated/**` or
    the `@/db` seam.
  - **B-2** — a feature sublayer may not import its own feature-level barrel (cycle).
  - **B-3** — screens (`src/components/**`) and routes (`src/app/**`) consume a
    feature through its barrel, never `@/api/generated/**` or `@/db` directly.
  - **B-4** — the **ADR-009 infra→feature edge** (`@/hooks/use-color-scheme` and
    `@/i18n` importing `@/features/settings/prefs` + `…/prefs/store`) is **allowed**
    — the resolution chosen for ADR 009's parked revisit (allow as a documented
    seam, not promote — see design D5).
- The existing seam bans in `eslint.config.js` (`no-restricted-imports` for
  `react-native-mmkv` / `expo-sqlite` / `drizzle-orm` / `axios` / chrome-alpha,
  `no-restricted-globals` for `fetch`) stay **as-is** — boundaries layers *on top*
  for the feature-internal structure; it does not duplicate or replace them.
- **No source-behavior change** — the current tree is already compliant (verified
  exhaustively; see design D6 and tasks §3). The change adds the gate around code
  that already obeys it, then proves the gate bites by injecting + reverting a
  deliberate violation.
- Update the living artifacts (R-1): flip the "still-pending eslint-plugin-boundaries
  (TIM-135)" lines in the Architecture Book, golden-path.md, ADR 009, and ADR 014
  to "now encoded"; record ADR 009's fired revisit + the allow-the-edge resolution;
  update the ADR README index cells; append a Rule changelog entry.

## Capabilities

### New Capabilities
<!-- none — this encodes an already-blessed pattern; no new capability is introduced -->

### Modified Capabilities
- `mobile-lint-format`: ADDED requirement — the feature-module import boundaries
  are now lint-enforced (`eslint-plugin-boundaries`), layered on the existing seam
  bans; the documented infra→feature edge is explicitly allowed.

## Impact

- **Affected specs:** `mobile-lint-format` (one ADDED requirement).
- **Affected code:** `mobile/eslint.config.js`, `mobile/package.json` +
  `mobile/package-lock.json` (two devDependencies). **No `src/` change** — the tree
  is already compliant.
- **Affected docs:** `.claude/rules/mobile/architecture.md` (Lint & format),
  `.claude/rules/mobile/golden-path.md` (Seam conventions + ADR-014 pointer),
  `.claude/rules/mobile/decisions/009-settings-feature-prefs.md` (fired revisit +
  resolution), `.claude/rules/mobile/decisions/014-layered-feature-module-pattern.md`
  (consequences), `.claude/rules/mobile/decisions/README.md` (index cells),
  `.claude/rules/mobile/architecture-changelog.md` (new entry).
- **No ADR 015** — this is the *encoding* of ADR 014's already-blessed decision
  (tooling, not a new architectural call, mirroring `add-mobile-import-order-lint`);
  the one genuinely-new load-bearing call (the infra-edge resolution) is owned by
  ADR 009's revisit (design D7).
- **Out of scope / untouched:** `app.config.ts`, babel, metro, native config,
  `jest.config.js`, the OpenAPI spec, `server/`, `web/`, `app/`. No new runtime
  dependency, nothing that autolinks.
- **No runtime behavior change** — a lint rule is inert at runtime; there is no Jest
  proof test (a lint rule's enforcement *is* its gate, R-1 — a "boundaries hold"
  Jest test would be cargo-cult; the manual inject-and-revert in tasks §3 is the
  proof the rule fires).

## Definition of Done walk (recorded — no third state)

- **Architecture** ✅ — the boundaries lint *is* the architecture being enforced;
  ADR 009's edge resolved + recorded, ADR 014 consequences updated.
- **Lint** ✅ — the new `boundaries/dependencies` rule lands; `npm run lint`
  (`--max-warnings 0`) stays green (current code compliant); deprecation-clean
  (uses the v6 `dependencies` rule, not the deprecated `element-types`/`entry-point`).
- **Types** ✅ — `npx tsc --noEmit` clean (config-only change).
- **Unit/component tests** ✅ — `npm test` green; the K-3 coverage gate is unaffected
  (no `src/` change, no `jest.config.js` change).
- **Documentation** ✅ — Architecture Book + golden-path + ADR 009 + ADR 014 +
  README + Rule changelog all updated (R-1 / five-living-artifacts mandate).
- **E2E** ➖ N/A — no runtime behavior changes; the Maestro flows are untouched.
- **i18n** ➖ N/A — no user-facing strings added.
- **Accessibility** ➖ N/A — no UI, no interactive control.
- **Native correctness** ➖ N/A — no native code, no `app.config.ts`/prebuild change.
- **Performance** ➖ N/A — lint-time only; no runtime path.
- **Observability** ➖ N/A — no error path, no instrumentation surface.
- **Product analytics** ➖ N/A — not a user action.
