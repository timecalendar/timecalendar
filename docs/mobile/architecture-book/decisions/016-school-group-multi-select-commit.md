# 016 — School-group selection: multi-select committed by an explicit confirm, dismissing the onboarding Stack

> Origin: the `add-mobile-school-picker` change (Phase 3 ship 2), design D1 + D3.
> Completes the school-selection picker Phase 2 (Feature C / TIM-134) established as
> a read seam with a deliberately-minimal single-leaf-immediate-commit group step.
> The full wiring lives in the Architecture Book "Features → School selection" and
> "Data layer"; this is the load-bearing decision. Builds on ADR
> [013](./013-query-persister-and-policy.md) (the identity-only store) and ADR
> [015](./015-onboarding-flow-shape.md) (the deferred post-onboarding destination).

## Status

Accepted.

## Context

Phase 3 ship 2 completes the school / school-group picker to functional parity with
the Flutter `school` / `school_group` modules. Phase 2 (Feature C) established the
read seam with a **single-leaf-immediate-commit** group step: tapping one leaf did
`selectSchool(schoolId); selectGroup([value]); router.back()` on the first tap, with
no review and no multi-pick. But the store's `groupValues` and the Flutter
`SetSchoolGroupDto.groups` are **both arrays** — the single-pick UI was the Phase-2
pattern-establishment minimum (Feature C's job was the read seam, not a perfected
picker). A real student often has more than one group (a major + an elective, an `L1`
cohort with a `TD` subgroup).

The **commit posture** — how a source selection is gathered and persisted, and when
the onboarding flow completes — is copied by the later Phase-3 source steps (QR scan,
iCal import; ships 3–5: each "selects/enters a source → confirms → persists identity →
completes"), so it earns an ADR (R-4). And the completion navigation was wrong:
`router.back()` pops one screen (groups → school list), stranding a user with a
completed selection on the intermediate list.

## Decision

The group step is **multi-select with an explicit confirm-commit**:

- Each **leaf** is a **toggle** — a tap adds/removes its value from a pending
  selection set (component state, not the store), and the node reflects
  `accessibilityState={{ selected }}`.
- **Branch** nodes are unchanged — expand/collapse only (`accessibilityState={{ expanded }}`),
  not selectable.
- One primary **confirm** control commits the whole set in a single write —
  `selectSchool(schoolId); selectGroup([...pending])` — through the **unchanged**
  identity-only store (it already persists a `string[]` of values, not DTOs).
- Confirming an **empty** set is **guarded**: an accessible message, no commit
  (`selectGroup([])` would persist "school, no group" — a valid store state, but the
  flow wants an explicit pick, matching the Flutter assistant which never commits an
  empty grade).
- On a successful confirm, the flow **dismisses the whole onboarding Stack** via
  `router.dismissTo("/onboarding")` (SDK-56 expo-router imperative API) — back to the
  onboarding entry (the welcome surface), not popping one screen.

The pending-selection set is **trivial screen state** (a set of toggled ids), so it
lives in the `ui/` screen; the only logic extracted to `data/` is the pure search
helper (D2). The store schema/API is **unchanged**.

*Alternatives rejected.* Single-select (fails functional parity — a student may have
>1 group); commit-on-every-toggle (no review, chatty per-tap MMKV writes, a mistaken
tap mutates the persisted selection); persisting the selected DTO subtree (violates
the identity-only store contract — values not DTOs; the tree is in the query cache); a
`form/` sublayer for the pending set (over-built — it is trivial screen state, not
validatable form logic with localizable error keys — R-2); `router.back()` (strands
the user on the intermediate school list); `router.dismissAll()` (can over-pop past
the onboarding entry when onboarding was itself pushed).

## Consequences

- The later source steps (QR / iCal, ships 3–5) inherit the posture: "toggle/enter a
  source → confirm → persist identity → dismiss onboarding."
- The store stays identity-only and unchanged (it already accepts the array).
- **No new dependency** — the accent-insensitive search's diacritic stripping uses
  Hermes `normalize("NFD")` + a combining-marks range strip (U+0300–U+036F), not a
  `\p{Diacritic}` property escape (Hermes has known gaps in RegExp Unicode property
  escapes), and `dismissTo` is core expo-router. No `app.config.ts` / native change.
- **No new lint rule / type / CI gate (R-1)** — the new behavior sits behind the
  existing encoded boundaries (feature-module boundaries B-1…B-4, no-hardcoded-strings,
  a11y touchable rules, route-structure, the 90/70 coverage gate).
- The post-onboarding **destination** (a startup gate / route to the calendar) remains
  ADR [015](./015-onboarding-flow-shape.md)'s deferred decision, owned by the
  calendar/home step — this ship only fixes "don't strand on the intermediate list."

## Revisit if

- The calendar subscription step (ship 5 / Phase 4) needs the group commit to also PUT
  `SetSchoolGroupDto` (`groups` + `icalUrl`) — the confirm grows a write to `data/`.
- A school's group model needs single-select semantics for some schools (re-weigh the
  multi-select default per school).
- The post-onboarding destination decision (ADR 015's deferred gate) changes where the
  dismissal lands.
