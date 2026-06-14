# Design — feature-module boundary lint (eslint-plugin-boundaries)

## Context

The layered feature-module pattern is **already blessed** —
[ADR 014](../../../.claude/rules/mobile/decisions/014-layered-feature-module-pattern.md)
records it, the [golden-path exemplar](../../../.claude/rules/mobile/golden-path.md)
documents the how-to, and three landed features (Settings, Personal events, School
selection) embody it. What is *missing* is the R-1 encoding: the import boundaries
are **review-enforced only**. ADR 014's Decision §(1)/(3), its closing paragraph
("**encoding** them as `eslint-plugin-boundaries` is the separate pending TIM-135
slice"), the golden-path "Seam conventions" note, and ADR 009's revisit clause all
explicitly name this change as the encoder.

The four boundaries to encode (authoritative source: golden-path.md "Seam
conventions" + "Barrel discipline", ADR 014 Decision):

- **B-1** — a feature's `data/` sublayer is the **only** place that may import the
  generated Orval hooks (`@/api/generated/**`) and the `@/db` seam.
- **B-2 (no cycle)** — a feature sublayer (`data/`/`store/`/`form/`) must **not**
  import its own feature-level barrel (`@/features/<feature>`); it imports a
  sibling's *sub-barrel* directly.
- **B-3 (entry point)** — external consumers (screens in `src/components/**`, routes
  in `src/app/**`) consume the feature via its barrel, never reaching into
  `@/api/generated/**` or `@/db` directly.
- **B-4 (the ADR-009 infra→feature edge)** — `@/hooks/use-color-scheme` and `@/i18n`
  legitimately import `@/features/settings/prefs` (barrel) and
  `@/features/settings/prefs/store` (sub-module, imported directly to dodge a cycle).
  This documented infra→feature seam must remain **allowed**.

This is a tooling/config change confined to `mobile/eslint.config.js` +
`mobile/package.json`. The real decisions are *which plugin rule surface*, *the
element taxonomy*, *how each boundary is expressed*, and *how to resolve ADR 009*.

## Goals / Non-Goals

**Goals:**
- Encode B-1…B-4 as a CI-gated lint rule layered on the existing seam bans.
- Keep `mobile/eslint.config.js` readable — the config *is* the rule's documentation
  (R-1), matching the file's existing heavily-commented `timecalendar/*` voice.
- Land **green** (current tree is compliant) and **prove the rule bites** (inject +
  revert a deliberate violation per boundary).
- Resolve ADR 009's parked infra-edge revisit and record it.

**Non-Goals:**
- Re-doing the golden-path exemplar / ADR 014 (already shipped — PR #159).
- Any `src/` behavior change, refactor, or new dependency that autolinks.
- Replacing or duplicating the existing `no-restricted-imports` /
  `no-restricted-globals` seam bans — boundaries layers *on top* of them.
- A generic "no-unknown-files / every-file-belongs-to-an-element" lockdown — that is
  a stricter posture than the four boundaries require and would false-positive on
  the many `src/` files that are not part of a feature (see D4).

## Decisions

### D1 — `eslint-plugin-boundaries` v6, the unified `boundaries/dependencies` rule

`eslint-plugin-boundaries@6.0.2` (peer `eslint >= 6.0.0`; verified working under the
installed ESLint **9.39.4** flat config). It is the de-facto standard for
architectural import boundaries in the ESLint ecosystem and the exact plugin every
upstream doc (ADR 014, golden-path, ADR 009, the Architecture Book) names — using a
different plugin would orphan those pointers for no benefit.

**Rule surface — the v6 `boundaries/dependencies` rule, not the deprecated
`element-types` + `entry-point` + `no-private`.** v6 unified the older trio into a
single `boundaries/dependencies` rule; the v5 names still function but emit a
deprecation warning ("Rule name `boundaries/element-types` is deprecated. Use
`boundaries/dependencies` instead") and the legacy tuple-selector syntax (`["type",
{ cap }]`) emits a second warning. Because `npm run lint` runs `--max-warnings 0`,
shipping the deprecated surface would either fail the gate or require a suppression —
both worse than just writing the modern rule. So this change uses **only**
`boundaries/dependencies` with the **object-selector** form
(`{ type, captured, internalPath }`) and `{{ }}` Handlebars message templates. This
was verified empirically during planning (a probe config ran clean on the real tree
and fired correctly on injected violations — see D6).

*Rejected:* `element-types`/`entry-point` (deprecated in v6 → deprecation warnings
under `--max-warnings 0`); the `dependencies`/`external` plugins of
`eslint-plugin-import` (heavier, no element model, can't express "only `data/` may
reach the seam" cleanly).

### D2 — The element taxonomy (`settings['boundaries/elements']`)

Each `from`/`to` in a rule references an **element type**; an element is a path
pattern. The taxonomy is the minimal set that lets B-1…B-4 be expressed. Patterns
use `mode: "folder"` (match the element's containing folder, right-to-left), with
capture groups for the feature/layer names:

| type | pattern | mode | capture | what it is |
| --- | --- | --- | --- | --- |
| `feature-sublayer` | `src/features/*/*` | folder | `["feature","layer"]` | a `data/`/`store/`/`form/`/`prefs/` sublayer of a feature |
| `feature-barrel` | `src/features/*` | folder | `["feature"]` | the feature-level dir (its `index.ts` is the barrel) |
| `generated-api` | `src/api/generated` | folder | — | the Orval-generated client |
| `db-seam` | `src/db` | folder | — | the `@/db` seam |
| `route` | `src/app` | folder | — | Expo Router route entrypoints |
| `component` | `src/components` | folder | — | presentational screens |
| `infra-color-scheme` | `src/hooks/use-color-scheme.*` | file | — | the C1 theme seam (B-4 allow-side) |
| `infra-i18n` | `src/i18n` | folder | — | the i18n runtime (B-4 allow-side) |

Element order matters (boundaries matches the **first** element a file matches):
`feature-sublayer` (`src/features/*/*`) is listed **before** `feature-barrel`
(`src/features/*`) so a sublayer file is classified as the sublayer, not the barrel.

Files not matched by any element are simply **unclassified** and unconstrained — this
is intentional (D4): `no-unknown` / `no-unknown-files` are left **off** so the rule
governs only the elements it names, never the whole tree.

### D3 — How each boundary maps to a `boundaries/dependencies` rule

`default: "allow"` with three **disallow** rules (allow-by-default + targeted
denials is the conservative posture — it can only *forbid* the four bad edges, never
accidentally forbid a legitimate one it didn't think of):

- **B-1** — `from: { type: "feature-sublayer", captured: { layer: "!(data)" } }`
  `disallow: [{ to: { type: ["generated-api","db-seam"] } }]`. The `!(data)`
  micromatch negation means "any sublayer except `data/`". (A feature's `data/`
  sublayer is therefore *not* in `from`, so it may import the seam — correct.)
- **B-3** — `from: { type: ["component","route"] }`
  `disallow: [{ to: { type: ["generated-api","db-seam"] } }]`. Screens/routes never
  touch the seam directly.
- **B-2** — `from: { type: "feature-sublayer" }`
  `disallow: [{ to: { type: "feature-barrel", captured: { feature: "{{ from.captured.feature }}" }, internalPath: "index.*" } }]`.
  The `captured.feature` template binds the *same* feature, and `internalPath:
  "index.*"` targets the barrel file specifically — so a sublayer importing **its
  own** feature barrel is forbidden, while importing a **sibling's sub-barrel**
  (a different element / not the feature barrel) is untouched. This is the precise
  cycle ADR 014 / the feature-barrel comments call out.
- **B-4** — handled by `default: "allow"` with **no** disallow rule naming
  `infra-color-scheme`/`infra-i18n` as `from`. The infra→feature edge is allowed
  because nothing forbids it. (Recorded explicitly in D5/D7 as the ADR-009
  resolution, even though it needs no positive rule — the *absence* of a disallow is
  the deliberate decision.)

Each rule carries a `message` naming its boundary (B-1/B-2/B-3) so a violation points
the author straight at golden-path.md.

### D4 — Why `default: "allow"` (disallow-only), not `default: "disallow"`

A `default: "disallow"` posture forces an explicit `allow` for **every** legitimate
edge in the whole `src/` graph — every screen→`@/theme`, every hook→`@/storage`,
every `data/`→`@/api/generated`. That is a large, brittle allow-list that would
false-positive constantly and demand maintenance on every new import shape, for a
change whose mandate is exactly four boundaries. The four boundaries are *prohibitions*
("X must not reach Y"), which `disallow` expresses directly. So `default: "allow"` +
three disallows is both correct and minimal. `no-unknown` / `no-unknown-files` stay
**off** for the same reason — they would demand that *every* file belong to a named
element, which is a whole-tree taxonomy this change does not need and ADR 014 does not
ask for.

This is the same conservative philosophy as the existing seam bans: enumerate the
forbidden, leave the rest alone.

### D5 — The `@/` alias needs a real import resolver (load-bearing operational fact)

boundaries must **resolve** an import specifier to a file path to classify its target
element. If the `@/` alias (`tsconfig.json` `paths`) resolves to *nothing*,
`import { db } from "@/db"` is unclassifiable and the boundary silently never fires
(the dangerous false-negative). In the final config the gate *does* bite, because
`eslint-config-expo/flat` already ships `import/resolver: { typescript: true }`,
which cascades and resolves the alias (confirmed: the injected violations error even
with the boundaries block's own `import/resolver` removed).

The block nonetheless sets
`settings['import/resolver'] = { typescript: { project: "./tsconfig.json" }, node: {...} }`,
and **`eslint-import-resolver-typescript` is added as an explicit `mobile/`
devDependency** — belt-and-braces over the inherited expo resolver, not strictly
necessary today. The resolver currently exists only *transitively* (via
`eslint-config-expo@56` → `3.10.1`); a boundary gate silently depending on a
transitive is fragile — an expo-config bump could drop or move it and the gate would
go quiet without failing. An explicit dependency is the honest contract. (This
resolver setting is
scoped to the boundaries block; it does not change how the existing
`no-restricted-imports` string-pattern bans work — those never needed resolution.)

### D6 — Current tree is compliant; the rule is proven to bite

Two facts established by exhaustive grep + an empirical probe during planning:

1. **Compliant today.** The only importers of `@/api/generated/**` are
   `school-selection/data/queries.ts` + `…/data/persist.ts`; the only importers of
   `@/db` are `personal-events/data/{repository,hooks,types}.ts` — all `data/`
   sublayers (B-1 ✓). No sublayer imports its own feature barrel (B-2 ✓). No
   screen/route imports `@/api/generated` or `@/db` (B-3 ✓). The infra edge is
   exactly `use-color-scheme` → `@/features/settings/prefs` and `i18n/index.ts` →
   `@/features/settings/prefs/store` (B-4, allowed ✓). A probe config ran clean.
2. **The rule fires.** Injecting (a) a `@/db` import into a `src/components/*.tsx`
   screen, (b) a `@/db` import into a `form/` sublayer, and (c) a feature-barrel
   import into a `form/` sublayer each produced the matching B-3/B-1/B-2 error. Then
   reverted. tasks §3 repeats this inject-and-revert as the recorded verification
   (a lint rule's enforcement *is* its gate — no Jest proof test, R-1).

   A subtlety this surfaced (recorded so the implementer doesn't re-derive it):
   `src/i18n/index.ts` imports `@/features/settings/prefs/store` — a sublayer's
   **internal non-index file**, not its index barrel. A naive "force every feature
   import through the index entry point" rule would *break* this documented B-4 edge.
   The chosen design avoids that trap: B-3 disallows only the *seam types*
   (`generated-api`/`db-seam`) from screens/routes — it does **not** force
   feature imports through an index entry point — so the legitimate infra→`store`
   reach is untouched. This is why the design encodes *prohibitions*, not an
   entry-point lockdown.

### D7 — ADR 009 resolution: **allow the infra→feature edge as a documented seam**

ADR 009's revisit clause: *"`eslint-plugin-boundaries` lands (TIM-135/D1) — resolve
the infra→feature edge then (allow it as a documented seam, or promote the store to
infra)."* This change fires that revisit and chooses **(a) allow it**, for three
reasons already latent in ADR 009:

- It is a **sample of one** cross-cutting-prefs consumer. Promoting the prefs store
  to a top-level infra module from a single consumer is precisely the speculative
  cross-feature abstraction **R-2** forbids — ADR 009 itself rejected a `src/prefs/`
  service "speculative from a sample size of one."
- The edge is already a **clean DAG** (ADR 009 proved no cycle: `@/i18n → store`
  reads only `@/storage` + the `detect-locale` leaf; `use-color-scheme → prefs`
  hooks don't close a cycle). Encoding it as an *allowed* edge changes nothing about
  the graph — it only blesses what is already true.
- Promotion would move feature-owned domain state (a user *preference*) out of the
  feature that owns it — the opposite of the feature-module pattern this very change
  is encoding.

Encoded via D4's `default: "allow"`: no disallow names `infra-*` as `from`, so the
edge passes. The fired revisit + this resolution are recorded **in ADR 009** (dated
2026-06-14, status update) and cross-referenced from **ADR 014's consequences** and
the **Rule changelog**. Revisit-if for ADR 009 is narrowed: a **second** feature
needing cross-cutting prefs would re-open the promote-to-infra option.

### D8 — No ADR 015; proportionate recording

ADR 014 already blessed the layered pattern and *named this lint as its encoding*;
ADR 009 owns the infra-edge call. The boundaries taxonomy itself embodies **no new
load-bearing architectural decision** — it is the mechanical R-1 encoding of an
already-recorded pattern (exactly as `add-mobile-import-order-lint` added a lint rule
with "No ADR — tooling, not architectural"). So this change adds **no ADR 015**; it
records the landing in ADR 014's consequences, the infra-edge resolution in ADR 009,
the README index cells, and a Rule changelog entry. Were a *new* taxonomy decision to
prove load-bearing later (e.g. a calendar feature needing a sublayer the pattern
doesn't name → an `element-types` shape change), ADR 014's own revisit covers it.

## Risks / Trade-offs

- **Resolver coupling (D5).** boundaries depends on the TS path resolver; if the
  resolver setting is wrong, the rule *silently passes* (resolves to nothing) rather
  than erroring — a false-negative, the dangerous failure mode. **Mitigation:** the
  explicit devDependency + the tasks §3 inject-and-revert verification, which would
  catch a mis-wired resolver immediately (the violation wouldn't fire).
- **v6 API surface churn.** v6 deprecated `element-types`/`entry-point`; a future v7
  could change `boundaries/dependencies`. **Mitigation:** the rule is one named
  block, heavily commented, version-pinned in `package.json`; an upgrade is a
  localized, reviewable edit — the same blast-radius posture as every other seam.
- **`internalPath: "index.*"` for B-2 depends on the barrel being named `index.*`.**
  All current feature barrels are `index.ts` (verified). If a feature barrel were
  ever named otherwise, B-2 would stop matching it — but the route-structure /
  golden-path conventions mandate `index.ts` barrels, so this is consistent with the
  rest of the codebase, not a new constraint.
- **No whole-tree lockdown (D4).** `no-unknown-files` is off, so a typo'd new sublayer
  path that *doesn't* match `src/features/*/*` would be unclassified and unguarded.
  Accepted: matching the conservative, prohibition-only mandate; review + the
  golden-path checklist cover taxonomy drift, and tightening to `no-unknown-files` is
  a future option if feature sprawl makes it pay off (recorded as the deferred lever).
