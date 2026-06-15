# Design — Complete the school / school-group picker (multi-select groups + confirm, accent+code search, full-flow dismissal)

This change is Phase 3 ship 2 of 5. It **grows** the school-selection picker Phase 2 built (Feature
C / TIM-134) and Phase 3 ship 1 (ADR 015) put a welcome surface in front of — it does **not** start
fresh and does **not** touch the read seam, persister, store identity, or nested-nav shape, all of
which are already correct. The gap analysis below is the load-bearing part of this design: it
establishes that **most of the picker already exists**, so the ship is narrow.

## Gap analysis — what EXISTS (Phase 2 + ship 1) vs. the genuine gap

Read in full before designing: `mobile/src/features/school-selection/` (`data/`, `store/`, `ui/`),
`mobile/src/app/onboarding/`, the generated `schools.ts` + `timeCalendar.schemas.ts`, the Flutter
`app/lib/modules/{add_school,school}` + `add_grade` modules, the existing `mobile/.maestro/onboarding.yaml`,
and `docs/react-native-migration/inbox/2026-06-14-school-selection-dod-manual.md`.

**Already done and correct (untouched by this ship):**

- **The read seam.** `data/queries.ts` wraps `useSchoolControllerFindSchools` /
  `useSchoolGroupControllerFindSchoolGroups` over the single `customFetch` (the **only**
  generated-hook import site, B-1), maps the DTOs to `SchoolListItem` / `SchoolGroupNode`, exposes
  TanStack state flags + `refetch`.
- **Offline persister + query policy** — `data/persist.ts` + the query client (ADR 013). Untouched.
- **Identity-only selection store** — `store/{store,types,hooks}.ts`: persists `schoolId` +
  `groupValues` (**already a `string[]`** — its own tests round-trip `["l1","a"]`), total validators,
  `selectSchool` resets the group, `isOnboardingComplete()` derived from selection existence. The
  store API already supports a multi-group set; **no store change is needed**.
- **Nested onboarding Stack** (ship 1, welcome-first): `index` (welcome) → `school` → `groups`, a
  `Stack` sibling of `(tabs)`, thin routes re-exporting feature `ui/` barrels.
- **Accessible loading / error (retry) / empty states** on both screens; the group tree's
  expand/collapse branches with `accessibilityState={{ expanded }}`.
- **A11y, i18n FR/EN, theming, the live-read Maestro flow, the 90/70 coverage gate** — all green.

**The Flutter parity reference (corrected from the prompt's assumption).** The Flutter `school`
module is the **list + search** (`school_selection_content.dart`: an `AppSearchBar` filtering via
`stringIncludes(search, name) || stringIncludes(search, code)` — diacritic-normalized, space/hyphen-
stripped). The Flutter `add_school` / `add_grade` modules are the **"I can't find my school" manual
fallback** (the user types a free-text school/formation name) — which in this migration is the
**QR / iCal source steps (ships 3–5)**, explicitly out of scope here. Flutter's actual **group
selection is delegated to a WebView assistant** (`assistant_screen.dart` loads the `/assistants` web
page with `schoolId`); the native `SchoolGroupItem` tree + `SetSchoolGroupDto.groups` (an **array**)
live server-side. So the RN app already renders the group tree **natively** — more native than
Flutter, exactly R-3 (the platform is the design reference). The parity to match is **functional**:
multi-group selection committed as a set, and accent+code search.

**The three genuine gaps this ship closes:**

1. **Group selection is single-leaf-immediate-commit, no confirm.** `onSelectLeaf` does
   `selectSchool(schoolId); selectGroup([value]); router.back()` on the first tap. The store and the
   wire format are both **multi-value**; only the UI is single-pick, and there is no review/confirm
   step. → D1 (load-bearing → ADR 016).
2. **Search is plain substring on name only.** `name.toLowerCase().includes(needle)`. Flutter
   normalizes diacritics + strips spacing and matches name **or** code; `code` isn't even projected
   into `SchoolListItem`. → D2.
3. **Completion pops one screen.** `router.back()` returns to the school list, not out of onboarding.
   → D3.

Everything else is out of scope (D4): the startup gate (ADR 015's recorded deferral, owned by the
calendar/home step), the school-not-found manual fallback (QR/iCal, ships 3–5), and the actual
calendar subscription / `icalUrl` commit (`SetSchoolGroupDto` / `GetSchoolGroupsIcalUrl` — Phase 4).

## D1 — The group step becomes multi-select with an explicit confirm-commit (load-bearing → ADR 016)

**Decision.** The group-picker screen holds a **pending selection set** (`Set<string>` / a
`string[]` in component state) of chosen leaf `value`s. A leaf node is a **toggle**: tap adds/removes
its value from the pending set and the node reflects `accessibilityState={{ selected }}` (replacing
the current "select immediately" leaf). Branch nodes are unchanged (expand/collapse only, not
selectable). A new **primary "confirm" control** commits the set in one write —
`selectSchool(schoolId); selectGroup([...pending])` — then completes the flow (D3). Confirming with an
empty set is **guarded**: an accessible message, no empty-set commit (`selectGroup([])` would persist
"school, no group" — a valid store state, but here we want an explicit pick, matching the Flutter
assistant which never commits an empty grade).

**Why this is the right shape (and load-bearing).** The store's `groupValues: string[]` and the
Flutter `SetSchoolGroupDto.groups` array were always multi-value; the single-pick UI was the Phase-2
"pattern establishment" minimum (Feature C's job was to *establish the read seam*, not perfect the
picker — its own DoD note calls it the "read path"). A user with multiple groups (e.g. a major +
elective, or a `L1` cohort with a `TD` subgroup) must pick more than one. The **commit posture** —
toggle a set, confirm once, persist the set, leave onboarding — is copied by **every later source
step** (QR adds a token, iCal adds a URL; each "selects then commits then completes"), so it earns an
ADR (R-4). The store stays identity-only and unchanged (it already accepts the array) — the only
change is the **UI interaction model + the explicit commit point**.

*Alternatives rejected:* (a) keep single-select — fails functional parity (Flutter commits an array;
a real student often has >1 group). (b) Commit on every toggle (no confirm) — no review, and it
would write storage on each tap (chatty, and a mistaken tap mutates the persisted selection); the
confirm gives one atomic commit + a review moment. (c) Persist the *DTO subtree* of selected
`SchoolGroupItem`s — violates the identity-only store contract (ADR 013/the store's own doc: persist
values, not DTOs; the tree is in the query cache). (d) A separate `confirm/` form sublayer — the
selection state is trivial screen state (a set of toggled ids), not validatable form logic with
localizable error keys; a `form/` sublayer would be over-built (R-2). The pending set + confirm lives
in the `ui/` screen; the only logic extracted to `data/` is the search helper (D2), which *is* pure
reusable logic.

## D2 — Accent-insensitive, name-or-code search behind a pure `data/` helper

**Decision.** Add a pure helper in the feature `data/` layer — `data/search.ts` —
`schoolMatches(needle: string, school: SchoolListItem): boolean` (plus a `normalize` it builds on),
matching Flutter's `stringIncludes`: lowercase, **strip diacritics**, **strip spaces and hyphens**,
then substring-match the needle against the normalized **name OR code**. Project `code` into the
`SchoolListItem` domain shape (`data/types.ts` + `toSchoolListItem` in `queries.ts` — the generated
`SchoolForList` already carries `code`, `imageUrl`, `name`, `id`). The school screen's `useMemo`
filter calls `schoolMatches` instead of the inline `name.includes`.

**Diacritic stripping without a new dependency.** Flutter uses the `diacritic` package; RN/Hermes has
`String.prototype.normalize("NFD")` + a combining-marks strip
(`.normalize("NFD").replace(/\p{Diacritic}/gu, "")`) — Unicode property escapes are supported under
Hermes/SDK 56. **No new dependency** (R-2; mirrors how the codebase avoids pulling libs for
one-liners). The space/hyphen strip is a `.replace(/[\s-]/g, "")`.

**Why a `data/` helper, not inline in the screen.** It is **pure, reusable logic** with real edge
cases (accents, spacing, name-vs-code, empty needle) that deserve unit tests under the 90% gate — the
golden-path posture (logic in a tested sublayer, the screen presentational). The school screen stays
presentational (70% floor); the helper is `data/`-90%-gated. This keeps the screen test focused on
"filters through the helper" rather than re-testing normalization. *Rejected:* inline matching in the
screen `useMemo` — untestable in isolation, screen drifts toward logic (anti-golden-path).

## D3 — Completing the picker dismisses the whole onboarding Stack (`router.dismissTo`)

**Decision.** On a successful confirm-commit, replace `router.back()` with **`router.dismissTo("/onboarding")`**
(verified present in SDK 56's expo-router imperative API: `dismissTo(href)`, alongside `dismiss(count)`
/ `dismissAll()`). This dismisses the nested onboarding Stack back to its **entry** (the welcome
surface) — leaving the picker rather than stranding the user on the intermediate school list (which
is what `router.back()` does today: pop groups → land on school list).

**Why `dismissTo("/onboarding")` over the alternatives.** `router.back()` pops exactly one screen
(groups → school list) — wrong, the user is mid-flow with a completed selection. `router.dismissAll()`
dismisses *all* stacks including back past the onboarding group's own entry, which can over-pop when
onboarding was itself pushed. `dismissTo("/onboarding")` targets the onboarding entry deterministically:
from the welcome surface a real first-run user can see their pick took effect (and the future
calendar/home gate — ADR 015's deferred redirect — will route them on from there). The actual landing
*destination after onboarding* (e.g. straight to the calendar) is the **startup-gate decision still
deferred to the calendar/home step** (ADR 015 D3 / decision 3) — this ship only fixes "don't strand
on the intermediate list," it does not decide the post-onboarding home (that has no consumer yet).

*Note for the implementer:* the group screen's test mocks `expo-router`; extend the mock from
`{ router: { back } }` to include `dismissTo` and assert it is called with `/onboarding`.

## D4 — Explicitly out of scope (recorded so the implementer/reviewer don't scope-creep)

- **First-launch startup gate / auto-redirect** — ADR 015's recorded deferral (no calendar/home
  consumer yet; `isOnboardingComplete()` stands ready). Not this ship.
- **"I can't find my school" manual fallback** (Flutter `add_school` / `add_grade`) — this is the
  QR-scan + iCal-import **source steps**, Phase 3 **ships 3–5**. Not this ship.
- **Calendar subscription commit** — `SetSchoolGroupDto` (`groups` + `icalUrl`) PUT,
  `GetSchoolGroupsIcalUrl`, and durable `user_calendars` token persistence are the **identity-
  persistence step (ship 5)** and **Phase 4 (calendar core)**. This ship persists the *selection
  identity* (school + group values) — the basis the subscription is built from — not the subscription
  itself.
- **The Flutter WebView assistant** — replaced by the native tree (already built); not re-introduced.

## D5 — Maestro: extend only where reliably driveable (the Phase-2 rationale stands)

**Decision.** Extend `mobile/.maestro/onboarding.yaml` only with **stable, cross-platform** steps. The
welcome → CTA → live `GET /schools` assertion is unchanged. The **school search** is reliably
driveable (type into the existing `testID="onboarding-school-filter"`, assert the seeded "My Gaming
Academia" still matches and a non-matching needle hides it) — add it if it proves stable. Driving the
**multi-select group toggle + confirm** is **not** added: the group leaf `value`s vary by school
fixture (the existing flow already documents this — the group selectors are fixture-dependent and a
tap-into-nested-step assertion is brittle across both platforms). The multi-select/confirm/dismiss
wiring is proven **deterministically by the Jest screen test** instead. A flaky e2e is worse than
none (the established posture). If a stable group leaf selector is ever confirmed reliable on both
platforms, a confirm step MAY be added later as a bonus.

## D6 — Human-blocked items (the existing inbox note, extended — not duplicated)

The on-device DoD axes for this surface are an **extension of the existing**
`docs/react-native-migration/inbox/2026-06-14-school-selection-dod-manual.md` (which already covers
VoiceOver/TalkBack on the school + group steps, native-feel, offline, touch-target, contrast, perf,
and the e2e run). This ship **appends a short section** to that note for the **new** multi-select
surface — the leaf toggle's selected-state announcement, the confirm control, and the full-flow
dismissal feel — rather than creating a duplicate note. Tagged `(HUMAN: see
inbox/2026-06-14-school-selection-dod-manual.md)` in `tasks.md`, skip-and-continue. No new
HUMAN-blocking work beyond these manual on-device passes — there are no credentials/console/native
prerequisites (no new dependency, no `app.config.ts` change).

## Migration plan (order)

1. `data/types.ts` — add `code: string` to `SchoolListItem`; `data/queries.ts` `toSchoolListItem`
   projects `code`.
2. `data/search.ts` — the pure `normalize` + `schoolMatches(needle, school)` helper; export from the
   `data/` sub-barrel. `data/search.test.ts` (90% gate): accents, spacing/hyphen, name-vs-code match,
   empty needle, no-match.
3. `ui/school-picker-screen.tsx` — the `useMemo` filter calls `schoolMatches`; extend its test for the
   accent/code search through the helper.
4. `ui/school-group-picker-screen.tsx` — pending-selection set state; leaf = toggle with
   `accessibilityState={{ selected }}`; a primary confirm control (role + translated label + ≥48
   hit area) committing `selectSchool` + `selectGroup([...set])` then `router.dismissTo("/onboarding")`;
   the empty-selection guard. Extend its test: toggle, branch expand/collapse, full-set confirm-commit,
   `dismissTo` called, empty guard.
5. i18n FR + EN: `onboarding.group.confirm`, `onboarding.group.confirmLabel`,
   `onboarding.group.selectedState` / `.unselectedState` (or use `accessibilityState` + a translated
   base label), `onboarding.group.empty.selectionGuard`; re-author `onboarding.group.nodeLabel` for
   toggle semantics. `tsc` parity both directions.
6. Extend `mobile/.maestro/onboarding.yaml` per D5 (search step only if stable; no group commit step).
7. Docs: ADR 016 + README row; Architecture Book `features.md` (the group step is now multi-select +
   confirm; the search helper) + `data.md` (the search helper as a `data/` pure-logic example); the
   Rule changelog entry; the golden-path note if a reference shifts; the roadmap step-2 tick; append
   the multi-select section to the existing school-selection DoD inbox note.
8. Gates: `npx tsc --noEmit`, `npm run lint`, `npm test` (90% on `data/` incl. the new helper; 70%
   floor on the screens; `jest.config.js` unchanged).

## Decision: ADR 016 (multi-select group selection committed by an explicit confirm)

**Status:** Accepted (recorded in `.claude/rules/mobile/decisions/016-school-group-multi-select-commit.md`).

**Context.** Phase 3 ship 2 completes the school-selection picker. Phase 2 (Feature C) established the
read seam with a deliberately-minimal **single-leaf-immediate-commit** group step; the store's
`groupValues` and the Flutter `SetSchoolGroupDto.groups` are both arrays. The commit posture (how a
source selection is gathered and persisted, and when the flow completes) is copied by the later source
steps (QR / iCal, ships 3–5), so it earns an ADR (R-4).

**Decision.** The group step is **multi-select with an explicit confirm-commit**: leaves toggle into a
pending set (with an accessible selected state), branches expand/collapse, and one primary confirm
persists the whole set through the unchanged identity-only store (`selectSchool` + `selectGroup(set)`)
and dismisses the onboarding Stack (`router.dismissTo("/onboarding")`). An empty confirm is guarded.
The store schema/API is **unchanged** (it already persists a `string[]` set, values not DTOs).

**Alternatives rejected.** Single-select (fails functional parity — a student may have >1 group);
commit-on-every-toggle (no review, chatty per-tap storage writes); persisting the selected DTO subtree
(violates the identity-only store contract); a `form/` sublayer for the pending set (over-built — it is
trivial screen state, not validatable form logic, R-2); `router.back()` (strands the user on the
intermediate school list); `router.dismissAll()` (can over-pop past the onboarding entry).

**Consequences.** The later source steps (QR / iCal) inherit "toggle/enter a source → confirm → persist
identity → dismiss onboarding." The store stays identity-only and unchanged. No new dependency
(diacritic stripping via Hermes `normalize("NFD")`), no native change, no new lint rule (the existing
boundaries / i18n / a11y / coverage gates cover it). The post-onboarding **destination** (a startup
gate / route to the calendar) remains ADR 015's deferred decision, owned by the calendar/home step.

**Revisit if.** The calendar subscription step (ship 5 / Phase 4) needs the group commit to also PUT
`SetSchoolGroupDto` (`groups` + `icalUrl`) — the confirm grows a write to `data/` then; or a school's
group model needs single-select semantics for some schools (re-weigh the multi-select default per
school); or the post-onboarding destination decision (ADR 015's deferred gate) changes where the
dismissal lands.
