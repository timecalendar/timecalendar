# Design — Harden the template (Phase 1.5): extract the golden-path exemplar + reusable scaffolding, reconcile the Architecture Book

## Context

The roadmap's Phase 1.5 ([`02-pattern-establishment.md`](../../../docs/react-native-migration/01-roadmap/02-pattern-establishment.md)
step 4) closes Phase 2's pattern-establishment arc: after three deliberately-varied features
([ADR 004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md) order), **extract
the golden-path template** the rest of the app copies, reconcile the Architecture Book to what they
*actually* taught, and record the pattern as ADRs.

The three features have landed (automatable DoD axes green; on-device axes inboxed per each change):

- **Settings** — `src/features/settings/prefs/` (`types.ts` + `store.ts` + `hooks.ts` + `index.ts`),
  presentational `src/components/settings-screen.tsx`, thin `src/app/settings.tsx`. Axis: **local KV
  (`@/storage`) + native `@expo/ui` controls + i18n**. Total, defensively-validated prefs; reactive
  hooks over the seam; the C1 theme-override + i18n startup/runtime wiring.
- **Personal events** — `src/features/personal-events/{data,form}/` (two sublayers, two sub-barrels +
  a feature barrel re-exporting both), `src/components/personal-events-list.tsx` +
  `personal-event-form-screen.tsx`, thin `src/app/personal-event-form.tsx`. Axis: **device-local CRUD
  (`@/db`/Drizzle) + multi-field form + a real write error path** through `@/firebase`.
- **School selection** — `src/features/school-selection/{data,store}/` (query layer in `data/`,
  selection store in `store/`, two sub-barrels + a feature barrel), `src/components/onboarding/`
  screens, thin `src/app/onboarding/` route group. Axis: **server read (TanStack Query over the
  generated hooks + `customFetch`) + offline persister (`@/storage`) + nested navigation**.

The convergence is striking and consistent — the same `src/features/<feature>/<layer>/` shape, the
same barrel discipline, the same "logic at 90%, presentation at 70%" split (ADR 003), the same
total-validated-store posture, the same thin-route + presentational-screen split (the route-structure
rule), the same i18n-flat-key / a11y-on-touchables call-site conventions. That convergence *is* the
earned pattern. This change's job is fidelity: bless what landed, point at it, reconcile the book's
older speculative prose — and **not** gold-plate (migration-approach §4) or fold in the separate
encodable feature-boundary lint (TIM-135).

## Goals / Non-Goals

**Goals**

- Replace the golden-path placeholder with a real, accurate, R-1-pointer-style exemplar drawn from the
  three landed features.
- Make "start a new feature by copying it" literally true with the lightest sound mechanism.
- Reconcile the Architecture Book prose the three features refined (feature-folder shape, data seam,
  query-runtime policy, chrome-wrapper reality) — pointer style preserved.
- Bless the layered feature-module pattern as an ADR; log the change.

**Non-Goals**

- No `eslint-plugin-boundaries` (TIM-135) — separate encodable slice; recorded as follow-up debt here.
- No feature behavior, no runtime code path, no re-architecture of the three features, no generator.
- No duplicate ADRs for already-recorded decisions (009–013 stand).

## Decisions

### D1 — The exemplar is **multi-feature by axis**, not a single blessed "reference feature"

The golden-path placeholder anticipates "*the* reference feature." But the three features deliberately
stress **different axes** — no single one exercises local-KV *and* device-CRUD *and* server-read. Blessing
one as "the" exemplar would force the other two axes into footnotes and mislead a new feature whose axis
differs. So the exemplar is **organized by axis**, naming the canonical landed feature for each:

- **Local key-value + native controls + i18n → Settings** (`src/features/settings/prefs/` +
  `settings-screen.tsx`).
- **Structured device-local CRUD + forms + write error path → Personal events**
  (`src/features/personal-events/{data,form}/` + the list/form screens).
- **Server read + offline cache + nested navigation → School selection**
  (`src/features/school-selection/{data,store}/` + `src/components/onboarding/`).

Cross-cutting conventions that **all three share** (the folder shape, the barrel discipline, the
90/70 split, the thin-route rule, total-validated stores, i18n/a11y call-site conventions) are
documented once as the "common spine," then each axis points at its canonical feature for the parts
unique to it. This matches reality (the variety is the point) and gives a new feature the nearest
real template for *its* axis rather than a forced one-size example.

*Rejected:* picking School selection as "the" exemplar because it is the richest (server + offline +
nav) — it has no `@/db` CRUD and no multi-field form, so a CRUD feature copying it would be misled.

### D2 — Reusable scaffolding: a **documented copy-this checklist + a minimal skeleton template tree**, not a generator

"A new feature can be started by copying it" (exit criterion) needs a concrete copy source. Two
mechanisms were weighed:

1. **A code generator / scaffolding CLI** (plop, hygen, a custom script) that stamps out a feature
   folder. Powerful, but it is **heavy tooling the repo's posture rejects** (R-2: documented
   conventions + tsc/lint/coverage gates over machinery); it adds a dependency + a template DSL to
   maintain, and from a sample of three features the "right" generated shape is not yet stable enough
   to freeze into codegen (the same earn-don't-declare logic that kept the exemplar a placeholder
   until now).
2. **A documented "starting a new feature" checklist + a minimal skeleton template directory** of
   real, valid, lint-clean files a developer copies and renames. Lightest sound mechanism: the
   template is plain files (no DSL), the checklist is prose in the golden-path doc, and the existing
   gates (tsc/lint/coverage) catch any copy mistake immediately.

**Decision: option (2).** A skeleton template tree (the minimal `<feature>/data/{types,index}.ts` +
a presentational `*-screen.tsx` + a thin route + a colocated `*.test.tsx`, each a tiny valid stub
with `TODO` markers and inline pointers to the canonical feature for that axis) plus the
"starting a new feature" checklist in the golden-path doc. The generator is recorded as **deferred
debt** with its trigger (feature count grows enough that hand-copy friction is real, and the shape
has stopped evolving).

**Where the template lives — a decision with a real constraint.** A skeleton placed under
`mobile/src/` would be **bundled by Metro and walked by the test/coverage harness** (the same
`require.context` route-bundling and Jest-glob hazards the route-structure and coverage rules already
fight). So the skeleton template lives **outside `src/`** — under
`docs/react-native-migration/02-pattern-establishment/golden-path-template/` (alongside the docs that
describe it), as `.ts.txt` / `.tsx.txt`-suffixed files (or a fenced-code appendix in the golden-path
doc) so they are **not** compiled, bundled, linted-as-source, or coverage-counted. A developer copies
them into `src/features/<feature>/…`, drops the suffix, and renames. This keeps the template real and
copyable without contaminating the build or the coverage denominator. (The golden-path doc's "copy
this" section points at this tree.)

*Rejected:* live skeleton files under `src/features/_template/` — they would be bundled, route-walked
(if any `.tsx` landed under `src/app`), and counted against coverage (an empty stub at 0% would break
the K-3 gate), exactly the hazards the foundation rules exist to prevent.

### D3 — Reconcile, don't rewrite: the Architecture Book prose the three features refined

The book is reconciled in place (pointer style preserved); four prose areas earned an update:

- **Feature-folder shape.** ADR 009 / the Settings section recorded the *first* folder
  (`prefs/`) as "deliberately thin, sample size of one, the exemplar earned from three features in
  Phase 1.5, not declared from one." Phase 1.5 is now here: the shape is real and varied
  (`data/` = the data/query/repository seam; `store/` = a persisted-state seam; `form/` = form
  logic; each with a sub-barrel; a feature-level barrel re-exporting the sublayers without a cycle).
  The book gains a short "Feature-module pattern" pointer to the new golden-path section + the new ADR.
- **Data-layer query seam.** The "only `data/` touches the generated hooks" boundary is real
  (School selection's `data/queries.ts` is the only generated-hook import site; personal-events'
  `data/repository.ts` the only `@/db` import site). The Data-layer section already says feature-module
  boundaries are "deliberately deferred until feature folders exist — expected tooling upgrade then is
  `eslint-plugin-boundaries`." Feature folders now exist; the note is reconciled to point at the
  golden-path boundary convention (review-enforced today) + the still-pending lint (TIM-135).
- **Query-runtime policy.** The Data-layer "Query runtime" note says the policy is "deliberately
  unset — the first real server-read feature earns it." School selection earned it
  (`src/api/query-client.ts`, ADR 013). The note is reconciled from "unset/deferred" to "landed →
  see ADR 013 + the query-client module."
- **Chrome-wrapper pattern.** Theming recorded `@expo/ui` as "boundary-only until its first
  consumer." It now has two (`Picker` for Settings, `DateTimePicker` for Personal events). The
  golden-path "native controls" convention points at the real two-consumer seam; the book's chrome
  notes already carry these (verified) — the exemplar links, doesn't re-derive.

No rule is **added** here (R-1: adding a rule means encoding it; this change encodes nothing new). The
exemplar and ADR are the artifact; the book updates are reconciliations + pointers.

### D4 — Bless the layered feature-module pattern as an ADR (promoting ADR 009 from sample-of-one)

ADR 009 ("First feature folder; Settings owns app preferences") recorded the *first* folder with an
explicit caveat: "deliberately thin — one feature's data layer, not a blessed framework; the exemplar
is earned from three features in Phase 1.5, not declared from one." That earn-point is now reached. A
new ADR records the **cross-feature layered-module pattern** the three converged on as the blessed
golden-path pattern: `src/features/<feature>/<layer>/` (where `<layer>` ∈ {`data`, `store`, `form`,
…} as the feature's axis needs), per-sublayer `index.ts` barrels + a feature-level barrel (no cycle:
sublayers never import the feature barrel), the seam boundaries (`data/` owns generated-hook / `@/db`
access; the store is total + validated over `@/storage`; presentational screens in `src/components/`;
thin routes in `src/app/`), and the 90/70 logic/presentation coverage split (ADR 003). It **does not
supersede** ADR 009 (009's *infra→feature edge* decision for prefs still stands and still owns its own
revisit); it *generalizes* the folder-shape half. Its revisit trigger: the boundary lint (TIM-135)
lands and may formalize/adjust the shape, or a feature's axis needs a sublayer the pattern doesn't name.

*Why an ADR and not just the exemplar doc:* the folder shape + seam boundaries are load-bearing
(every future feature copies them; reversing them ripples across the app), which is exactly R-4's ADR
trigger. The golden-path doc is the *how-to*; the ADR is the *decision record*.

### D5 — TIM-135 (`eslint-plugin-boundaries`) stays out of scope; recorded as follow-up debt

The exemplar *documents* the import boundaries (only `data/` touches generated hooks / `@/db`; sublayers
don't import the feature barrel; presentational screens don't import generated API hooks). **Encoding**
those as a lint rule is the separate TIM-135 slice (an encodable-rule change with its own design — R-1
says encode, but encoding a brand-new lint config + its caveats is a cohesive change of its own, not a
rider on a docs extraction). Folding it in would blur a clean docs/scaffolding change with a tooling
change and double its blast radius. The golden-path doc + the new ADR both name the boundary as
**review-enforced today, lint-pending (TIM-135)** so the next agent inherits the open item rather than
discovering it. This is the same posture ADR 009 already set.

### D6 — No Jest proof test; the gate is tsc/lint over any `src/`-resident files + docs-fidelity review

Unlike the feature changes, this ships **no runtime app behavior** — it is docs + an out-of-`src/`
skeleton template + ADR + changelog. A fabricated "the docs are correct" Jest test would be cargo-cult
(the same justified-N/A posture as `add-mobile-eas` and `add-mobile-import-order-lint`). The enforcing
gates are: (a) the skeleton template lives **outside `src/`** (D2) so it is not compiled/bundled/
coverage-counted — meaning the existing `test-mobile` job (tsc + lint + Jest + coverage) stays green
**unchanged**; (b) docs fidelity is enforced by review against the real files (every pointer must
resolve — the implementer verifies each path exists). The DoD's E2E / Unit axes are **➖ N/A with
reason** for this change (no runtime behavior); recorded so the reviewer doesn't expect a proof test.

## Risks / Trade-offs

- **Risk: the exemplar freezes a pattern that the next feature (the calendar) breaks.** Mitigated by
  D1 (axis-organized, not one rigid template) + every ADR/doc carrying a revisit trigger; the calendar
  spike (ADR 005) is explicitly allowed to generalize the pattern, not forced into it (roadmap risk
  note). The pattern is *blessed*, not *frozen*.
- **Risk: documentation drift** — the exemplar points at real files that later move/rename. Mitigated
  by the pointer style (R-1: link, don't duplicate) so a move is a one-line pointer fix, and by the
  template living beside the docs (D2) so both age together.
- **Trade-off: a copy-checklist + template tree is more manual than a generator.** Accepted (R-2,
  D2) — the friction is low at the current feature count and the generator is recorded debt with a
  clear trigger.
- **Risk: scope creep into TIM-135 or a generator.** Mitigated by D5 + the Non-Goals — both are
  explicitly recorded as deferred, not done.

## Migration Plan

Additive and reversible. Rewriting `golden-path.md`, reconciling Architecture Book prose, adding one
ADR + README row, appending the changelog, adding an out-of-`src/` template tree + a roadmap update.
No code, schema, native config, or dependency changes — rollback is a plain revert. The
`test-mobile` / e2e CI jobs are unaffected (nothing under `src/` changed).

## Open Questions

None blocking. The one deferred decision — when to encode the feature boundary as a lint rule and
when (if ever) to add a generator — is recorded as follow-up debt (D2, D5) with triggers, owned by
TIM-135 and the "copy friction is real" trigger respectively, not by this change.
