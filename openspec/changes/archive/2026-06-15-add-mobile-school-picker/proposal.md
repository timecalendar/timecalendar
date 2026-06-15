# Complete the school / school-group picker: multi-select groups + a confirm-commit, accent-insensitive name+code search, full-flow dismissal

## Why

Phase 3 ("Onboarding & calendar sources") **ship 2 of 5 — the full school / school-group picker**
(roadmap `docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md`, step 2): grow Phase
2's school-selection **read path** into the **complete picker**, to functional parity with the
Flutter `add_school` / `school` / `school_group` modules, so a user can fully select their school
**and** their group(s) and have that selection persisted as the basis for the later calendar
subscription.

**Most of the picker already exists and is correct** — Phase 2's Feature C (TIM-134) shipped the
whole seam: the server read (`useSchools` / `useSchoolGroups` over the single `customFetch`, the
only generated-hook import site), the offline persister + query policy (ADR 013), the identity-only
selection store with total validators (`schoolId` + `groupValues` — already an **array**) and the
derived `isOnboardingComplete()`, the nested onboarding Stack, the accessible loading/error/empty
states, and the live-read Maestro flow. Ship 1 (ADR 015) put the welcome surface in front. So this
ship is a **narrow, focused GROW** of three genuine gaps against full Flutter parity — not a rebuild.

## What Changes

The gap analysis (existing RN picker vs. full Flutter `school` / `school_group` parity) found three
genuine gaps; everything else (the read seam, persister, store identity, nested nav, a11y states) is
already done and correct, so it is left untouched.

- **Group selection becomes multi-select with an explicit confirm/commit (the load-bearing gap).**
  Today the group step commits **one** leaf immediately on tap (`selectGroup([value]); router.back()`).
  The Flutter wire format (`SetSchoolGroupDto.groups` is an **array**) and the store
  (`groupValues: string[]`, already array-shaped — `["l1","a"]` in its own tests) are both multi-value
  by design; only the UI was single-pick. The group step SHALL let the user **toggle one or more leaf
  groups** (an accessible selected/unselected state per leaf, branches still expand/collapse) and
  commit the **set** through one explicit "confirm" action that persists `selectSchool(schoolId)` +
  `selectGroup(values)` and completes the flow. The store API and its identity-only contract are
  **unchanged** (it already accepts an array). Recorded as **ADR 016** (the commit posture every later
  source step inherits).
- **School search reaches Flutter parity: accent-insensitive, on name AND code.** Today the filter is
  a plain `name.toLowerCase().includes(needle)`. The Flutter `stringIncludes` normalizes diacritics +
  strips spaces/hyphens and matches `name` **or** `code`. This ship adds a small **pure normalize +
  match helper in the feature `data/` layer** (tested under the 90% logic gate), projects `code` into
  the `SchoolListItem` domain shape (the generated `SchoolForList` already carries `code`), and the
  school screen filters through it.
- **Completing the flow dismisses the whole onboarding Stack, not one screen.** Today the leaf select
  does `router.back()`, which pops only the group screen back to the school list. On confirm, the flow
  SHALL dismiss the entire `onboarding` group (via Expo Router's stack dismissal) back to its entry /
  the surface that opened it, so a completed selection leaves onboarding rather than stranding the user
  on the intermediate school list.
- **i18n (FR + EN, `tsc`-typed parity).** New flat keys for the multi-select group step: the confirm
  action + its accessibility label, the per-leaf selected/unselected accessibility state copy, and an
  empty-selection guard message if the user confirms with nothing selected. The existing
  `onboarding.group.nodeLabel` ("Select …") is re-authored for the toggle semantics.
- **Tests.** The new pure search helper is unit-tested (90% logic glob). The group-picker screen test
  is extended for the multi-select toggle + confirm-commit + full-flow dismissal; the school-picker
  test for the accent/code search. The K-3 coverage gate stays green with **no `jest.config.js`
  change** (the new logic lives in `data/`, already under the 90% glob; screens stay under the 70%
  floor).
- **Maestro.** `mobile/.maestro/onboarding.yaml` is **extended** only where reliably driveable across
  both platforms — the school search + the school→group push are stable; driving the multi-select
  group toggle/confirm is fixture-dependent (group leaf values vary by school) so it stays
  Jest-proven, matching the Phase-2 rationale (a flaky e2e is worse than none).
- **An ADR (next free number — 016)** records the multi-select-with-confirm commit posture; plus the
  Architecture Book `features.md` + `data.md` updates, the ADR README row, the Rule changelog entry,
  and the roadmap step-2 tick.
- **Full Definition of Done** walked axis-by-axis (automatable axes done; on-device axes referenced to
  the **existing** school-selection DoD inbox note, extended for the new multi-select/confirm surface
  rather than duplicated).

## Capabilities

### New Capabilities
<!-- none — this grows an existing capability -->

### Modified Capabilities
- `mobile-school-selection`: the group-selection behavior changes from single-leaf-immediate-commit to
  **multi-select with an explicit confirm-commit**; the school search behavior changes from
  plain-substring to **accent-insensitive, name-or-code**; and the flow-completion behavior changes
  from a single `router.back()` to a **whole-Stack dismissal**. These are spec-level behavior changes
  to that capability's requirements (not just implementation), so they need a delta spec.

## Impact

- **Code (mobile only):** `mobile/src/features/school-selection/` — `data/` (a new pure search
  helper + `code` added to `SchoolListItem` + its mapper/types), `ui/school-group-picker-screen.tsx`
  (multi-select + confirm), `ui/school-picker-screen.tsx` (search through the helper), the colocated
  tests; `mobile/src/i18n/locales/{en,fr}.json`; `mobile/.maestro/onboarding.yaml` (extended).
- **No store schema change** — `groupValues: string[]` and the identity-only contract already support
  the set; the store API is unchanged.
- **No new dependency, no `app.config.ts` / native change, no OpenAPI / server / `app/` change** — the
  generated `SchoolForList.code` and `SchoolGroupItem` tree already exist; no codegen needed.
- **No new lint rule / type / CI gate (R-1)** — this adds runtime behavior behind the *existing*
  encoded boundaries (feature-module boundaries B-1…B-4, no-hardcoded-strings, a11y touchable rules,
  route-structure, the 90/70 coverage gate). The new logic must pass the existing gates.
- **Docs:** ADR 016 + README row; Architecture Book `features.md` (School-selection group step) +
  `data.md` (the search helper); the Rule changelog; the roadmap step-2 tick; the school-selection DoD
  inbox note extended for the new surface.
