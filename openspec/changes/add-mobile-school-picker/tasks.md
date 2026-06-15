# Tasks — Complete the school / school-group picker (multi-select + confirm, accent+code search, full-flow dismissal)

All paths are in `mobile/` unless noted. Order follows the Migration Plan in `design.md`. This is a
narrow **GROW** of Phase 2's school-selection picker — do **not** touch the read seam, the persister,
the store identity/API, or the nested-nav shape (all already correct). Do **not** add the startup
gate, the school-not-found fallback, or the calendar subscription commit (D4 — out of scope).

## 1. `data/` — project `code` + the pure search helper (D2; 90% logic gate)

- [x] 1.1 `src/features/school-selection/data/types.ts` — add `code: string` to `SchoolListItem`
  (the generated `SchoolForList` already carries `code`). Keep the shape minimal (only what the screen
  renders + what search needs).
- [x] 1.2 `src/features/school-selection/data/queries.ts` — `toSchoolListItem` projects `school.code`
  into the domain shape. No other change to the read seam (it stays the only generated-hook import
  site, B-1).
- [x] 1.3 `src/features/school-selection/data/search.ts` — a pure `normalize(s: string)`
  (`.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[\s-]/g, "")` — Hermes
  Unicode property escapes; **no new dependency**, mirroring Flutter `stringIncludes`) and
  `schoolMatches(needle: string, school: SchoolListItem): boolean` (empty needle → matches all; else
  normalized substring match against `name` OR `code`).
- [x] 1.4 `src/features/school-selection/data/index.ts` — export `schoolMatches` (and `normalize` if
  the test imports it) from the `data/` sub-barrel.
- [x] 1.5 `src/features/school-selection/data/search.test.ts` (90% gate): asserts diacritic-insensitive
  match ("eiffel" matches "Université Gustave Eiffel"), space/hyphen insensitivity, name-vs-code match
  (a code-only needle matches), empty needle matches all, a genuine no-match returns false.

## 2. School screen — filter through the helper (D2; presentational, 70% floor)

- [x] 2.1 `src/features/school-selection/ui/school-picker-screen.tsx` — the `useMemo` filter calls
  `schoolMatches(filter, school)` (imported from `@/features/school-selection/data`) instead of the
  inline `name.toLowerCase().includes`. The screen stays presentational (no normalization inline). The
  existing `testID="onboarding-school-filter"` + row testIDs are kept (Maestro).
- [x] 2.2 Extend `src/features/school-selection/ui/school-picker-screen.test.tsx`: typing an
  accent-stripped needle ("eiffel") and a code-only needle still narrows the list to the expected
  school (proves it filters through the helper); a non-matching needle empties the list.

## 3. Group screen — multi-select toggle + confirm-commit + full-flow dismissal (D1, D3; 70% floor)

- [x] 3.1 `src/features/school-selection/ui/school-group-picker-screen.tsx` — replace the
  single-leaf-immediate-commit with a **pending selection set** (`useState<string[]>` or a `Set`):
  - a **leaf** node is now a **toggle** — tap adds/removes its `value` from the pending set; it renders
    `accessibilityState={{ selected }}` and a translated label; keep `testID="onboarding-group-leaf-<value>"`.
  - a **branch** node is unchanged (expand/collapse, `accessibilityState={{ expanded }}`, not selectable).
  - a primary **confirm** control (`testID="onboarding-group-confirm"`, `accessibilityRole="button"`,
    translated `accessibilityLabel`, `minHeight: 48` + `hitSlop`) commits in one write:
    `selectSchool(schoolId); selectGroup([...pending])`, then `router.dismissTo("/onboarding")` (D3).
  - confirming with an **empty** pending set is **guarded** — show the accessible
    `onboarding.group.empty.selectionGuard` message (polite live region / alert role), **no commit**.
  - keep the existing accessible loading / error (retry) / empty states.
- [x] 3.2 Extend `src/features/school-selection/ui/school-group-picker-screen.test.tsx` — extend the
  `expo-router` mock to include `dismissTo` (alongside `back`); assert: a leaf tap toggles its selected
  state (and a second tap de-selects); a branch expands/collapses to reveal a leaf without selecting;
  confirm with ≥1 leaf calls `selectSchool("univeiffel")` + `selectGroup` with the **full set** and
  `router.dismissTo("/onboarding")`; confirm with nothing selected shows the guard and does **not** call
  `selectGroup` / `dismissTo`.

## 4. i18n catalogs (FR + EN) — `src/i18n/locales/{en,fr}.json` (`tsc` bidirectional parity)

- [x] 4.1 Add flat dotted keys to **both** catalogs: `onboarding.group.confirm` (the confirm action
  label, e.g. "Confirm" / "Confirmer"), `onboarding.group.confirmLabel` (its accessibility label, e.g.
  "Confirm your group selection"), `onboarding.group.empty.selectionGuard` (e.g. "Select at least one
  group." / "Sélectionnez au moins un groupe."). Re-author the existing `onboarding.group.nodeLabel`
  for the **toggle** semantics (e.g. "Toggle {{name}}" rather than "Select {{name}}"), updating both
  catalogs. Keep FR + EN complete (a missing/extra key fails `tsc`).

## 5. Maestro flow — extend only where stable (D5)

- [x] 5.1 `mobile/.maestro/onboarding.yaml` — keep the welcome → CTA → live `GET /schools` →
  "My Gaming Academia" assertion unchanged. OPTIONALLY add a **stable** school-search step (type
  "Gaming" / a non-matching needle into `onboarding-school-filter`, assert the seeded school still
  shows / disappears) — only if reliable across both platforms. Do **NOT** add a multi-select group
  toggle/confirm step (group leaf selectors are fixture-dependent — D5; proven by §3.2 Jest instead).
  Update the header comment to note the completed picker is Jest-proven, the e2e proves the live read
  (+ optional search).

## 6. Definition-of-Done walk — automatable axes (do them)

- [x] 6.1 **Architecture** — follows the Architecture Book: golden-path layered module (pure search
  logic in `data/`, the screens presentational); B-1 (the `data/` seam stays the only generated-hook
  site; the screens consume `@/features/school-selection/{data,store}` sub-barrels, not the seams or
  the feature barrel — B-2); route-structure unchanged. Load-bearing decisions in `design.md` (D1–D5) +
  **ADR 016** (§8). No new lint rule introduced (R-1 — new behavior behind existing gates).
- [x] 6.2 **Types** — `npx tsc --noEmit` clean in `mobile/`; no unjustified `any`.
- [x] 6.3 **Lint** — `npm run lint` clean (`--max-warnings 0`): no hardcoded strings, a11y props on the
  new leaf toggle + confirm control, no parent-relative imports, import order, feature boundaries.
- [x] 6.4 **Unit/component tests** — the §1.5 search helper green under the 90% gate; the §2.2 + §3.2
  screen tests green under the 70% floor; the K-3 gate stays green with **no `jest.config.js` change**
  (the new logic is in `data/`, already under the 90% glob; screens stay under the 70% floor).
- [x] 6.5 **E2E** — `mobile/.maestro/onboarding.yaml` extended per §5 (live read preserved; optional
  stable search; no fixture-dependent group step); runs on iOS + Android via `ci-mobile-e2e.yml`
  (on-demand) — on-device run is §7.
- [x] 6.6 **i18n** — zero hardcoded strings (lint); FR + EN complete (`tsc` bidirectional parity). ✅ §4.
- [x] 6.7 **Accessibility (automatable half)** — a11y lint passes; each leaf toggle declares a role +
  translated label + `accessibilityState={{ selected }}`; the confirm control declares a role +
  translated label + ≥44pt/48dp hit area (`minHeight: 48` + `hitSlop`); branches keep
  `accessibilityState={{ expanded }}`; the empty guard uses a polite live region / alert role;
  `allowFontScaling` not disabled; no animation added → reduced-motion trivially met. Manual passes → §7.
- [x] 6.8 **Native correctness (automatable half)** — RN-core primitives + Expo Router `dismissTo`
  (the platform's nav — R-3); the on-device feel review is §7 (inbox).
- [x] 6.9 **Performance** — the search filter is a normalized substring scan over the already-loaded
  list (no new query); the tree render is unchanged. No new jank surface; on-device perf eyeball → §7.
- [x] 6.10 **Observability** — ➖ **N/A with reason**: the selection commit is synchronous MMKV writes
  (infallible — the store's own doc records "MMKV reads/writes are synchronous + infallible, no error
  path"); the reads are recoverable `isError` UI (unchanged). No crash-worthy throw to `recordError`
  (the auto-installed `@/firebase` global handler still catches any unexpected throw). Recorded in the
  DoD audit trail.
- [x] 6.11 **Product analytics** — **deferred-with-owner**: a "school selected" / "groups confirmed"
  event is meaningful, but the analytics taxonomy is owned by the cross-feature step that defines it
  (mirroring A2/B2/C1/ship-1's deferral). The confirm `onPress` is the recorded firing point. Recorded
  in the DoD audit trail.
- [x] 6.12 **Theming / light-dark** — the leaf selected-state + confirm control render
  scheme-appropriate `@/theme` tokens (e.g. the brand `primary` as a selected accent / the
  `backgroundSelected` token for a chosen leaf) with verified contrast; **no raw color literals**.
  On-device contrast eyeball → §7.
- [x] 6.13 **Documentation** — Architecture Book + changelog + ADR 016 + golden-path note (§8). This §6
  + §7 is the DoD audit trail.
- [x] 6.14 **Native config sanity** — **no native module / no `app.config.ts` change** and **no new
  dependency** (diacritic stripping via Hermes `normalize`; `dismissTo` is core expo-router).

## 7. Definition-of-Done walk — manual on-device axes (inboxed, HUMAN-tagged — extend the existing note)

Irreducibly on-device; implementer/reviewer **skip-and-continue**. These **extend** the existing
school-selection DoD note rather than duplicating it (D6).

- [ ] 7.1 Manual **VoiceOver** pass (iOS) — the group step's **new** surface: each leaf's
  selected/unselected announcement on toggle, the confirm control (role/label), the empty-selection
  guard announcement, focus order through a multi-pick tree. (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 7.2 Manual **TalkBack** pass (Android) — same as §7.1. (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 7.3 On-device **native-correctness feel** — toggling multiple leaves, confirming, and the
  full-stack **dismissal** back to the onboarding entry, both platforms, light + dark. (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 7.4 **Touch-target by finger** — each leaf toggle + the confirm control. (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 7.5 **Color-contrast** eyeball — the selected-leaf accent + the confirm control on background,
  both schemes, against the documented AA pairs in `tokens.ts`. (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 7.6 **E2E** — run the extended `mobile/.maestro/onboarding.yaml` on iOS + Android and confirm
  `settings.yaml` / `personal-events.yaml` still pass, via `ci-mobile-e2e.yml`. (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)

## 8. Docs + ADR (R-1 pointers + ownership)

- [x] 8.1 **ADR** `.claude/rules/mobile/decisions/016-school-group-multi-select-commit.md` (multi-select
  group selection committed by an explicit confirm; the unchanged identity-only store; the
  `dismissTo` completion; Context / Decision / Consequences / Revisit-if — per `design.md` §"Decision:
  ADR 016"). Add the index row to `.claude/rules/mobile/decisions/README.md`.
- [x] 8.2 **Architecture Book — `features.md`** — update the "School selection" section: the group step
  is now **multi-select with an explicit confirm-commit** (pointer to ADR 016); the search is
  accent-insensitive name-or-code via a `data/` helper; the completion dismisses the onboarding Stack.
  Pointer style (R-1).
- [x] 8.3 **Architecture Book — `data.md`** — note the school-selection `data/search.ts` pure helper as
  the data-layer's pure-logic example (normalize + match, 90%-gated). Pointer style.
- [x] 8.4 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (Live, 2026-06-15):
  `add-mobile-school-picker` — Phase-3 ship 2; the group step → multi-select + explicit confirm-commit
  (ADR 016); accent+code search behind a `data/` helper; full-stack `dismissTo` completion; no new
  rule/dep/native change. → `features.md`, `data.md`; ADR 016.
- [x] 8.5 Update `.claude/rules/mobile/golden-path.md` if a "closest reference" shifts (the
  school-selection `data/search.ts` is a clean pure-`data/`-helper example; the group screen is now the
  multi-select reference). Pointer-only if nothing material moves.
- [x] 8.6 Update `docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md` step 2:
  School / school-group selection — completed (multi-select groups + confirm-commit, accent+code
  search, full-flow dismissal); on-device DoD axes inboxed (extended the existing note). Tick the step.
- [x] 8.7 **Append** the §7 on-device DoD items to the existing
  `docs/react-native-migration/inbox/2026-06-14-school-selection-dod-manual.md` (a new dated section
  "Ship 2 — completed picker (multi-select + confirm)" with What / Why / How-to-verify per item) —
  do **not** create a duplicate note (D6).

## 9. Local verification (gates)

- [x] 9.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 9.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`).
- [x] 9.3 `npm test` green in `mobile/` (the §1.5 search helper at 90%; the §2.2 + §3.2 screen tests at
  the 70% floor; the K-3 gate green; `jest.config.js` unchanged).

## 10. Validate

- [x] 10.1 `openspec validate add-mobile-school-picker --strict` passes.
