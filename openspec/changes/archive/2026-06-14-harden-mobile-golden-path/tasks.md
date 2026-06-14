# Tasks — Harden the template (Phase 1.5): extract the golden-path exemplar + reusable scaffolding, reconcile the Architecture Book

> This is a docs / scaffolding / template-hardening change — no feature behavior, no
> runtime code path. The "contract" is fidelity: **every pointer must resolve to a real
> file**, and the skeleton template must stay outside `src/` (design D2/D6). Verify each
> path you cite actually exists before writing the pointer.

## 0. Read-first (fidelity inputs)

- [x] Re-read the three landed features so the exemplar reflects what they ACTUALLY taught
  (not Phase-0 guesses):
  - Settings: `mobile/src/features/settings/prefs/{types,store,hooks,index}.ts`,
    `mobile/src/components/settings-screen.tsx`, `mobile/src/app/settings.tsx`.
  - Personal events: `mobile/src/features/personal-events/{data,form}/` (+ both sub-barrels +
    the feature `index.ts`), `mobile/src/components/{personal-events-list,personal-event-form-screen}.tsx`,
    `mobile/src/app/personal-event-form.tsx`.
  - School selection: `mobile/src/features/school-selection/{data,store}/` (+ barrels),
    `mobile/src/components/onboarding/`, `mobile/src/app/onboarding/`, `mobile/src/api/query-client.ts`.
  - Cross-cutting seams the exemplar points at: `mobile/src/storage/index.ts`, `mobile/src/db/index.ts`,
    `mobile/src/api/mutator.ts`, `mobile/src/components/chrome/`.
- [x] Re-read `.claude/rules/mobile/golden-path.md` (the placeholder being replaced) and the
  Architecture Book sections to reconcile (Data layer → Query runtime; Settings preferences;
  Storage → First feature schema; Theming & native-chrome → `@expo/ui`).

## 1. Replace the golden-path placeholder with the real exemplar (spec: golden-path requirement; design D1, D3)

- [x] Rewrite `.claude/rules/mobile/golden-path.md` from placeholder → real reference. Remove
  every "no reference feature to copy yet" / "do not copy this file's structure" placeholder
  statement.
- [x] Organize by **axis**, naming the canonical landed feature for each (design D1):
  local-KV + native-controls + i18n → **Settings**; device-CRUD + forms + write-error →
  **Personal events**; server-read + offline-persist + nested-nav → **School selection**.
- [x] Document the **common spine** (shared by all three), each as a **pointer** to real files
  (R-1, no inline duplication):
  - the `src/features/<feature>/<layer>/` folder shape (`data/` / `store/` / `form/` sublayers;
    a feature adds only the sublayers its axis needs);
  - the barrel discipline (sub-barrel per sublayer + feature-level barrel; sublayers never import
    the feature barrel — point at `personal-events/index.ts`'s comment and `school-selection/index.ts`);
  - the seam conventions: `data/` is the only generated-hook / `@/db` import site (point at
    `school-selection/data/queries.ts`, `personal-events/data/repository.ts`); the store is total +
    defensively-validated over `@/storage` with one write path (point at `settings/prefs/store.ts`,
    `school-selection/store/store.ts`); mappers at the row↔domain edge (`personal-events/data/types.ts`);
  - the presentational-screen-in-`src/components/` + thin-route-in-`src/app/` split (route-structure
    rule; point at `settings.tsx` + `settings-screen.tsx`, `onboarding/` + `components/onboarding/`);
  - the 90/70 logic/presentation coverage split (point at ADR 003 + `jest.config.js`);
  - the screen/test/e2e skeleton shape (point at a real `*-screen.test.tsx` + a `.maestro/*.yaml`);
  - the i18n/a11y call-site conventions (flat keys, FR/EN parity, validation returns *keys*,
    accessible loading/error live regions, touchable roles+labels — point at
    `school-selection/data`/`onboarding` screen + `personal-events/form/validate.ts`).
- [x] Keep the "closest real references" framing only insofar as it's now the *blessed* set
  (remove the "they die when onboarding lands / schools harness" stale lines — schools harness is
  already retired).
- [x] Add a **"Starting a new feature" checklist** section (the copy-this how-to) — see task 2.

## 2. Reusable scaffolding: the skeleton template tree + the copy checklist (design D2)

- [x] Create the skeleton template tree **outside `mobile/src/`** so Metro/route-harness/coverage
  never touch it (design D2/D6): under
  `docs/react-native-migration/02-pattern-establishment/golden-path-template/`.
- [x] Provide minimal, valid, lint-clean stub files with `TODO` markers + inline pointers to the
  canonical feature for that axis, suffixed so they are NOT compiled/bundled/linted-as-source
  (e.g. `.ts.txt` / `.tsx.txt`):
  - `feature/data/types.ts.txt` (domain type + a total parser stub),
  - `feature/data/index.ts.txt` (sub-barrel),
  - `feature/index.ts.txt` (feature barrel),
  - `components/feature-screen.tsx.txt` (presentational screen stub: `useTranslation`,
    `ThemedView`/`ThemedText`, an accessible control),
  - `app/feature.tsx.txt` (thin route re-export),
  - `components/feature-screen.test.tsx.txt` (colocated test skeleton: render-through-real-trees,
    assert localized text not keys).
- [x] Write the "Starting a new feature" checklist in `golden-path.md` pointing at this tree:
  the ordered steps (copy → rename → drop the `.txt` suffix → wire FR/EN keys → add the route to
  `_layout.tsx` as a Stack sibling → add a Maestro flow → run tsc/lint/test), with a note that the
  existing gates catch copy mistakes.
- [x] Record the **code generator as deferred debt** in `golden-path.md` (or design pointer) with
  its trigger (hand-copy friction becomes real AND the shape has stopped evolving) — R-2.

## 3. Reconcile the Architecture Book to reality (spec: reconcile requirement; design D3)

> Pointer style preserved; reconcile prose, add no new rule.

- [x] **Query-runtime note** (Data layer → "Query runtime"): change from "deliberately unset — the
  first real server-read feature earns it" → "landed: `src/api/query-client.ts` (the earned
  staleTime/gcTime/retry policy) + the offline persister; see ADR 013." Point, don't duplicate.
- [x] **Data-layer feature-module boundary note**: reconcile the "feature-module boundaries
  deliberately deferred until feature folders exist" line — feature folders now exist; point at the
  golden-path boundary convention (only `data/` touches generated hooks / `@/db`, review-enforced
  today) + the pending `eslint-plugin-boundaries` lint (TIM-135).
- [x] **Feature-folder shape**: add a short "Feature-module pattern" pointer (in the Settings or a
  dedicated brief section) → the golden-path exemplar + the new ADR 014, noting the shape is now
  earned/blessed (not "sample of one").
- [x] **Chrome-wrapper reality**: verify the `@expo/ui` notes already reflect the two consumers
  (Picker + DateTimePicker); the exemplar links to them — no book change needed unless a stale
  "boundary-only" line remains (fix if so).
- [x] Confirm **no new rule is encoded** here (R-1): the change reconciles + points; it adds no lint
  rule / type / CI gate.

## 4. ADR — bless the layered feature-module pattern (spec: pattern-ADR requirement; design D4)

- [x] Copy `openspec/changes/harden-mobile-golden-path/adr-014-layered-feature-module-pattern.md`
  to `.claude/rules/mobile/decisions/014-layered-feature-module-pattern.md`.
- [x] Verify it does NOT supersede ADR 009 (009's infra→feature edge stands); it generalizes the
  folder-shape half from sample-of-one → blessed pattern.
- [x] Add the ADR README index row (`.claude/rules/mobile/decisions/README.md`): number 014, title,
  status Accepted, revisit trigger (TIM-135 boundary lint / a feature axis needing a new sublayer).
- [x] Confirm the ADR records the feature-boundary lint (TIM-135) as the pending encodable follow-up
  (design D5) so the next agent inherits it.

## 5. Rule changelog (spec: changelog requirement; migration-approach §7)

- [x] Append a dated entry to `.claude/rules/mobile/architecture-changelog.md` (newest last):
  golden-path exemplar extracted from the three features, Architecture Book reconciled (query
  runtime, data-layer boundary note, feature-folder shape), the skeleton template + copy checklist
  added, ADR 014 blessed; point at the affected sections; note "no new rule encoded — reconciliation
  + pattern blessing; TIM-135 boundary lint recorded as follow-up debt."

## 6. Roadmap update

- [x] Update `docs/react-native-migration/01-roadmap/02-pattern-establishment.md` step 4 to mark the
  golden-path extraction / Phase 1.5 hardening as landed (mirroring how steps 1–3 carry their
  landed-summary), and note the calendar spike (ADR 005) as the next Phase-2 step.

## 7. Definition-of-Done walk (spec: DoD living-artifact)

This change ships **no runtime app behavior** — record each axis honestly (✅ Done or ➖ N/A + reason,
no third state):

- [x] **Architecture** — ✅ follows the book; the novel decision (layered module pattern) is recorded
  as ADR 014 (R-4).
- [x] **Types / Lint** — ✅ `npx tsc --noEmit` + `npm run lint` stay green (the template tree is outside
  `src/`, so it isn't compiled/linted-as-source — verify it doesn't accidentally land under `src/`).
- [x] **Unit/component tests, Coverage** — ➖ N/A: no runtime code added; the `test-mobile` suite +
  coverage are unchanged and stay green (design D6). The skeleton template files are NOT counted
  (outside `src/`).
- [x] **E2E** — ➖ N/A: no behavior to flow; existing Maestro flows unchanged.
- [x] **i18n / Accessibility / Native correctness / Performance / Observability / Product analytics**
  — ➖ N/A: docs + ADR + out-of-`src/` template; no UI, no string, no error path, no event.
- [x] **Documentation** — ✅ the golden-path exemplar + ADR 014 + changelog ARE the deliverable.

## 8. Local verification (gates)

- [x] In `mobile/`: `npx tsc --noEmit` — clean (unchanged; sanity that nothing under `src/` regressed).
- [x] In `mobile/`: `npm run lint` — clean (unchanged).
- [x] In `mobile/`: `npm test` — green (unchanged; confirm coverage denominator is unaffected — the
  template tree must NOT be under `src/`).
- [x] Pointer audit: every file path cited in `golden-path.md`, the reconciled book sections, and ADR
  014 resolves to a real file (grep/`ls` each).

## 9. Validate

- [x] `npx openspec validate harden-mobile-golden-path --strict` — passes.
