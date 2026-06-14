# Harden the template (Phase 1.5): extract the golden-path exemplar + reusable scaffolding from the three landed features, and reconcile the Architecture Book to what they actually taught

## Why

Phase 2's three deliberately-varied pattern-establishment features have all landed their
automatable Definition-of-Done axes — Settings (local KV + native controls + i18n,
`add-mobile-settings-prefs` / `add-mobile-settings-screen`), Personal events (structured
device-local CRUD + multi-field form + write error path,
`add-mobile-personal-events-data` / `add-mobile-personal-events-ui`), and School selection
(server read + offline persister + nested navigation, `add-mobile-school-selection`). Per the
roadmap ([`02-pattern-establishment.md`](../../../docs/react-native-migration/01-roadmap/02-pattern-establishment.md)
step 4) and migration-approach §4, the pattern is now **earned** and must be **extracted and
hardened**: the golden-path exemplar blessed, reusable scaffolding made real, and the
Architecture Book reconciled to reality.

The [golden-path exemplar](../../../.claude/rules/mobile/golden-path.md) is, by design, still an
explicit Phase-1.5 **placeholder** — it says "there is no reference feature to copy yet" and "do
not copy this file's structure as if it were the pattern." This change is exactly the step that
file anticipates: it replaces the placeholder with the **real** exemplar drawn from what the three
features *actually* converged on — not Phase-0 guesses.

The extraction is low-risk by nature: it is primarily **documentation + thin skeleton scaffolding
+ ADR + changelog**. It writes no feature behavior. Its discipline is fidelity — every claim must
point at a real file (R-1 pointer style), and any Architecture Book prose the three features
*refined* (the feature-folder shape that emerged with `data/` / `store/` / `form/` sublayers + two
barrel levels; the data-layer query seam; the now-earned query-runtime policy; the chrome-wrapper
two-consumer reality) must be reconciled — not re-invented.

## What Changes

- **Replace the golden-path placeholder with the real exemplar.** `.claude/rules/mobile/golden-path.md`
  is rewritten from "no reference yet" to the blessed reference: which landed feature is canonical for
  each axis (Settings = local-KV/native-controls/i18n; Personal events = device-CRUD/forms/write-error;
  School selection = server-read/offline-persist/nested-nav), the **feature-folder layout that emerged**
  (`src/features/<feature>/<layer>/` with `data/` / `store/` / `form/` sublayers, a per-sublayer
  `index.ts` barrel + a feature-level barrel; presentational screens in `src/components/`; thin routes
  in `src/app/`), the data/query/store/db **seam conventions** (only `data/` touches the generated
  hooks or `@/db`; the store is total + defensively-validated over `@/storage`; one write path; mappers
  at the row↔domain edge), the **screen/test/e2e skeleton shape**, and the **i18n/a11y call-site
  conventions** — every section pointing at the real files the three features ship (R-1 pointer style).
- **Reusable scaffolding — a documented copy-this checklist + a skeleton template directory.** Make
  "a new feature can be started by copying it" literally true: a minimal, valid, lint-clean skeleton
  template tree living **outside `mobile/src/`** (under the Phase-2 docs tree, suffixed so Metro /
  the route harness / the coverage harness never touch it — design D2) plus a step-by-step
  "starting a new feature" checklist in the golden-path doc. The mechanism is the lightest sound one
  — documented convention + the existing tsc/lint/coverage gates — not a code generator
  (justified in `design.md`; R-2).
- **Reconcile the Architecture Book to reality.** Update the prose the three features proved or
  refined, keeping the book's pointer style: the **feature-folder shape** (the foundation only
  speculated `data/ store/ form/`; now it is real and varied — record what each sublayer means and
  when a feature has one); the **data-layer query seam** (the `data/`-only-touches-generated-hooks
  boundary, currently review-enforced); the **query-runtime policy** (no longer "deliberately unset" —
  School selection earned it; the Data-layer "Query runtime" note is reconciled to point at the landed
  policy + ADR 013); the **chrome-wrapper pattern** (now a real two-consumer seam). No rule is *added*
  here — only reconciled to what already landed.
- **A new ADR for the load-bearing pattern this extraction blesses** — the layered feature-module
  pattern (`src/features/<feature>/<layer>/` + barrels + the data/store/form/screen seam boundaries),
  promoting it from "first feature folder, deliberately thin, sample size of one" (ADR 009) to the
  blessed golden-path pattern earned from three features. Plus the README index row.
- **A Rule changelog entry** recording the extraction (the act of blessing the pattern + reconciling
  the book is itself a rule change, per migration-approach §7).
- **Roadmap step-4 update** marking Phase 1.5 / the golden-path extraction landed, and noting the Phase-2
  calendar spike as next.

## Non-Goals

- **No `eslint-plugin-boundaries` / feature-boundary lint** (the deferred TIM-135 slice). The exemplar
  *documents* the import boundaries the three features established (only `data/` touches generated hooks
  / `@/db`); **encoding** them as a lint rule is a separate encodable-rule change with its own design.
  This change records it as follow-up debt (the golden-path doc names the boundary review-enforces today
  and points at the future lint).
- **No new feature behavior, no new runtime code path.** This is template hardening: docs, skeleton
  template files, ADR, changelog. No screen, hook, store, query, schema, migration, route, or native
  config is added or changed.
- **No re-architecting the three landed features.** The exemplar is *extracted from* them as they are;
  if a small inconsistency between the three is noted, it is recorded as an observation, not refactored
  here (migration-approach §4: the variety is the signal, not a defect to flatten).
- **No code generator / scaffolding CLI.** The repo prefers documented conventions + tsc/lint/coverage
  gates over heavy tooling (R-2); a generator is recorded as deferred debt with its trigger.
- **No new ADR for already-recorded decisions.** The query policy + persister (ADR 013), the `@expo/ui`
  chrome wrapper (ADR 010), the date/time picker (ADR 012), the personal-event storage (ADR 011), the
  Settings feature folder (ADR 009) all stand; this change blesses the *cross-feature layered-module
  pattern* they each instance, it does not duplicate their decisions.
- **No `app.config.ts` / babel / dependency / OpenAPI / server / web / `app/` change.** Pure
  docs + a skeleton template tree (outside `src/`, so nothing under `src/` changes); the build is
  unaffected (no Jest proof test — the extraction ships no runtime behavior; its gate is review of the
  docs fidelity — see `design.md` D6).
