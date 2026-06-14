# Design — Personal events CRUD UI (list + form over B1, native @expo/ui date/time pickers, full DoD)

## Context

This is **B2** of Feature B (Personal events, ADR [004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md)):
the **UI layer** (list + create/edit/delete form + native date/time pickers + validation) over the
**data layer** B1 (`add-mobile-personal-events-data` / TIM-132) already shipped. B1 is done and
covered. **B2 builds on it — it adds no data-layer logic; it renders + mutates over B1's repository
and reactive hook.**

What B1 exposes (via `@/features/personal-events`) and B2 consumes verbatim:
- `PersonalEvent` — `{ uid, title, color, startsAt: Date, endsAt: Date, exportedAt: Date,
  location?: string, description?: string }` (the domain type; `Date`s at the boundary, `#RRGGBB`
  color, the mappers isolate the TEXT-ISO storage format).
- `usePersonalEvents(): PersonalEvent[]` — the reactive `useLiveQuery` read (the list source).
- `repository`: `findAll`, `getById(uid)`, `upsert(event)` (by uid — one write path for create +
  edit, mirroring the Flutter `put`), `remove(uid)`, `findInRange(from, to)`.
- `newEventId(): string` — a v4 uuid over `expo-crypto` (the importer supplies its own uid).

Constraints shaping the design (all binding — Architecture Book):
- **Route-structure rule.** A tested screen lives in `src/components/<name>.tsx` with a thin
  `src/app/<name>.tsx` re-export (keeps the colocated `*.test.tsx` out of the Metro route tree);
  non-tab routes are `Stack` siblings of `(tabs)` (a bare sibling under the native tabs is
  unreachable). The Home **tab** route itself (`(tabs)/index.tsx`) stays thin over a
  `@/components` module for the same reason.
- **Chrome lint boundary (R-1).** `@expo/ui` (+ subpaths, regex `^@expo/ui($|/)`) is
  `no-restricted-imports`-banned outside `src/components/chrome/**`. So **any** `@expo/ui` import —
  the universal `Picker` (A2) and now the date/time control — must live in the chrome wrapper; the
  form imports `@/components/chrome`.
- **K-3 coverage gate (ADR 003, enforced).** `src/features/**` (and `hooks`, `storage`, `db`,
  `theme`, `i18n`, `firebase`) are gated at 90% lines+branches; `src/components/**` + `src/app/**`
  fall under the 70% global floor. **So form/validation logic must live under
  `src/features/personal-events/` (90%-gated); presentational screens under `src/components/`
  (70% floor).** This is the central placement decision (D2).
- **R-2 / R-3.** Add only the wrapper surface + the controls the form needs (no speculative
  `@expo/ui` re-export zoo, no native ColorPicker from a sample of one); the date/time picker is a
  native control reviewed against each *platform*, not the Flutter form (R-3).
- **ADR 011 (storage representation).** Dates are canonical UTC ISO-8601 TEXT, color is `#RRGGBB`
  TEXT, uid from `expo-crypto` — the mappers (B1) own the conversion; B2 must hand the repository
  `Date`s and a `#RRGGBB` string and let B1's `eventToRow` normalize (do not re-encode here).
- **ADR 010 (the @expo/ui chrome wrapper, universal entry).** B2 is the second `@expo/ui` consumer;
  it extends the existing wrapper under the universal-entry posture ADR 010 set.

## Goals / Non-Goals

**Goals:**
- A Home-tab personal-events list (reactive, with an empty state + an Add action) and a single
  create/edit form route (optional `uid` → prefill + delete), reachable + deep-linkable.
- Form/validation **logic** in `src/features/personal-events/form/` (90%-gated); screens
  presentational (70% floor).
- Native date/time pickers via the **extended `@expo/ui` chrome wrapper** (second consumer), and a
  small preset color-swatch picker (custom RN, no new native dep), storing `#RRGGBB` verbatim.
- A genuine write **error path** through `@/firebase` (a failed `upsert`/`remove`).
- Full i18n (FR + EN, `tsc`-typed parity); the a11y obligations (roles, labels, touch targets).
- CI proof: the validation/build logic, the list, the form save/delete + picker→state wiring, and
  the firebase error path. A Maestro CRUD e2e (create-via-text → list → delete). On-device axes
  inboxed + HUMAN-tagged.
- The DoD walked — automatable axes done here, on-device axes inboxed.

**Non-Goals:**
- **No data-layer change** — B2 renders + mutates over B1's repository/hook/mappers; the schema,
  migration, and `@/db` seam are untouched.
- **No calendar overlay / timeline** — personal events is CRUD-only here (ADR 004 / roadmap step 2;
  the overlay lands in Phase 05 once the timeline exists). The list is a simple vertical list, not a
  calendar.
- **No arbitrary-color custom picker** — a preset palette of swatches for the MVP (D4); a native
  ColorPicker (a platform-split, churning surface) is deferred until a real need exists (R-2).
- **No recurrence / reminders / tags / attachments** — the Flutter `PersonalEvent` has none of these
  beyond title/color/times/location/description; B2 matches that field set exactly (R-2/R-3).
- **No new dependency, no `app.config.ts`/babel change** — the date/time control is `@expo/ui`'s
  own (already installed, autolinks; D1).
- **No K-3 `jest.config.js` change** — logic lands under the existing 90% `src/features/**` glob;
  screens under the 70% floor.
- **No swipe-to-delete / list reordering / search** — out of scope; delete is from the edit form
  (matches the Flutter app's edit-then-delete flow). A list-level delete affordance can be earned later.

## Decisions

### D1 — Date/time picker: `@expo/ui`'s own `DateTimePicker`, inside the existing chrome wrapper (ADR 012)
This is the headline load-bearing call. The trade space (all SDK-56-verified):
- **(a) `@expo/ui`'s `DateTimePicker`** — exported from `@expo/ui/community/datetime-picker`.
  **Critically, it is NOT `@react-native-community/datetimepicker`.** Inspecting
  `node_modules/@expo/ui@56.0.17/src/community/datetime-picker/`: the iOS variant renders SwiftUI's
  `DatePicker` (`../../swift-ui/DatePicker`), the Android variant renders Jetpack Compose date/time
  dialogs (`../../jetpack-compose/DatePicker`), and the `.web` variant a plain fallback. It only
  *mirrors the RNC public prop types* (`value`, `mode: "date"|"time"|"datetime"`, `onValueChange`,
  `minimumDate`, `maximumDate`, `display`) for API familiarity. It pulls in **no** extra package —
  it is part of `@expo/ui`, which is **already installed**, **autolinks** (ships
  `expo-module.config.json`, no `app.plugin.js` — verified), and is **already behind our chrome
  wrapper** (ADR 010). Same native-controls library, same seam, same universal-entry posture.
- **(b) `@expo/ui/swift-ui` + `@expo/ui/jetpack-compose` DatePicker directly** — a deliberate
  platform split. This is exactly the ADR-010 revisit trigger and the speculative divergence R-2
  forbids when the universal/community control already works on both platforms. Rejected.
- **(c) `@react-native-community/datetimepicker` directly** — the stable, Expo-blessed standalone
  module. But it is a **new dependency** (not installed; `npx expo install` adds it), it is **not**
  an alpha native-chrome API (so it would not naturally sit in the alpha-chrome seam), and choosing
  it would mean **two** date-picker code paths and ignoring the equivalent control `@expo/ui` already
  ships behind our existing seam. Rejected for the MVP: adding a dependency + a parallel native
  surface when `@expo/ui`'s control covers both platforms is the LCD/extra-surface cost R-2 rejects.

**Decision: option (a).** Use `@expo/ui`'s `DateTimePicker` (the `@expo/ui/community/datetime-picker`
subpath), re-exported from the **existing** `src/components/chrome/expo-ui.tsx` wrapper. Rationale:
it is the **most idiomatic SDK-56 native control** (SwiftUI / Compose, the platform's own
date/time UI — R-3), it adds **no dependency**, it rides the **same `@expo/ui` chrome seam and ADR
010 posture** as A2's `Picker` (one library, one seam, one blast radius), and it keeps us in the
Expo upgrade lane. It belongs behind the chrome wrapper because the `@expo/ui` subpath is already
lint-banned outside `src/components/chrome/**` — so the wrapper is mandatory, not optional, and the
seam already exists. **It needs no new chrome ADR** (ADR 010 already governs the wrapper + universal
posture); the **control-choice** decision — which date/time control among (a)/(b)/(c), and the
reasoning that `@expo/ui`'s control is not the RNC module despite mirroring its types — is
load-bearing and reused by every later native control with a platform-divergent surface (B/C
features), so **it earns ADR 012** (next free number — B1 took 011).

**Contingency (recorded, not built):** if `@expo/ui`'s `DateTimePicker` proves unstable enough on a
platform that it must be swapped for `@react-native-community/datetimepicker`, that swap lives
**behind the same `chrome/expo-ui.tsx` (or a sibling `chrome/datetime-picker.tsx`) API** — exactly
what the seam is for (ADR 010 revisit / ADR 012 revisit). The implementer **confirms a clean
`npx expo prebuild` + dev build renders the picker on both platforms** before handoff (config-shape,
verified by build, not lint — R-1).

### D2 — Logic in `src/features/personal-events/form/` (90%-gated); screens presentational (70% floor)
The K-3 gate (ADR 003) is the forcing function: domain/form logic must sit under a 90% glob, and a
presentational screen forced to 90% lines+branches is the cargo-cult gate ADR 003 warns against. So
the clean split:
- **Logic — `src/features/personal-events/form/`** (mirroring Settings' `prefs/` shape and B1's
  `data/` shape — a module of functions/hooks, no class, R-2):
  - `types.ts` — the form-state shape (`EventFormValues`: `title`, `startsAt: Date`, `endsAt: Date`,
    `color: string`, `location: string`, `description: string` — all populated, strings not
    `undefined` in the editing state) and the validation-result type.
  - `validate.ts` — **pure** `validateEventForm(values): { valid; errors }`: title required
    (non-empty after trim), end strictly after start; returns localizable **error keys** (not
    sentences — the screen maps key → `t()`), so the function is pure and i18n-agnostic.
  - `build.ts` — **pure** `buildEventFromForm(values, existing?): PersonalEvent`: assembles a
    `PersonalEvent`, trimming strings (empty location/description → `undefined`), assigning
    `uid = existing?.uid ?? newEventId()` and `exportedAt = new Date()` (the Flutter `buildEvent`
    semantics — new uid + now on create; existing uid + refreshed exportedAt on edit). Pure given
    an injectable clock/uid in the test (or assert the non-deterministic fields structurally).
  - `hooks.ts` — `useSaveEvent()` / `useDeleteEvent()`: thin async wrappers over B1's
    `repository.upsert` / `repository.remove` that, on rejection, `recordError` through `@/firebase`
    and surface a failure flag to the screen (the error path — D6). `useEventToEdit(uid?)` loads an
    existing event for prefill via `repository.getById` (or returns undefined for create).
  - `index.ts` — the barrel.
- **Presentation — `src/components/`** (70% floor, behavior-tested):
  - `personal-events-list.tsx` — the list body over `usePersonalEvents()` + the Add action + empty
    state.
  - `personal-event-form-screen.tsx` — the form: text inputs, the color-swatch picker, the date/time
    pickers, Save, conditional Delete; holds local `EventFormValues` state, calls `validateEventForm`
    / `buildEventFromForm` / the save/delete hooks; renders validation errors via `t()`.
  - `color-swatch-picker.tsx` — the preset-palette swatch row (D4).

*Alternative:* the form/list as feature-folder screens under `src/features/personal-events/screens/`
(rejected — drags presentation under the 90% logic gate, contra ADR 003; the route-structure rule
designates `src/components/` as the screen home, matching every existing screen). Logic inline in
the screen (rejected — pulls untestable-without-render logic under the 70% floor and loses the 90%
guarantee on the bug-prone validation/build code).

### D3 — Text inputs: RN core `TextInput`, not `@expo/ui`'s `TextInput`
Title (required), location, description (multiline) use RN core `TextInput`. Rationale: RN core
`TextInput` is **stable** (not alpha — no chrome-seam requirement, no churn risk), fully
**controllable** (`value` + `onChangeText`, the controlled-component pattern the form state needs),
trivially **testable** under jest-expo (no native mock — it renders in the RN test renderer), and
**idiomatic** (every RN form uses it). `@expo/ui`'s universal `TextInput` would drag another alpha
native control behind the chrome seam for no benefit over the stable core component — the LCD/extra
-surface cost R-2 rejects when the native picker is the only control that genuinely needs the native
chrome. Styled from `@/theme` tokens; no `allowFontScaling={false}` (a11y Dynamic-Type posture).

*Alternative:* `@expo/ui` `TextInput` (rejected — alpha, needs the chrome seam + a Jest mock, no
gain over core; R-2). A form library (Formik/react-hook-form) (rejected — a 6-field form does not
earn a dependency; local `useState` + the pure `validateEventForm` is proportionate, R-2).

### D4 — Color: a preset-palette swatch picker (custom RN), not a native ColorPicker
Color is stored as `#RRGGBB` TEXT verbatim (ADR 011). The Flutter app used a full `MaterialPicker`
(arbitrary color). For the RN MVP, B2 ships a **small preset palette** of selectable swatches —
`src/components/color-swatch-picker.tsx`, a custom RN component: a row of `Pressable` swatches, each
a brand-adjacent `#RRGGBB`, single-select, each carrying `accessibilityRole="button"` +
`accessibilityState={{ selected }}` + a translated `accessibilityLabel`, ≥44pt/48dp hit target, the
selected one visibly ringed. Rationale (R-2): a preset palette is **fully testable** (deterministic
swatch set, no native mock), **a11y-labelable**, **no new native dependency**, and **proportionate** —
arbitrary-color freedom is not a load-bearing MVP need (the importer preserves whatever `#RRGGBB`
Flutter stored; new events pick from presets). A native ColorPicker (`@expo/ui` exposes none in the
universal entry; a third-party one is a new churning native dep + a platform-split surface) is the
speculative divergence R-2 forbids from a sample of one. The palette stores the chosen string
verbatim; B1's `eventToRow` writes it unchanged (ADR 011).

*Recorded deferral:* arbitrary custom color (a native ColorPicker or a hex input) is earned when a
user need appears (recorded, not built — R-2). The preset set is a small `as const` array in the
component (or a `colors.ts` constant); the default for a new event is the first/brand preset.

### D5 — Maestro CRUD flow: text-typed create → list → delete; no native date/time picker drive
`mobile/.maestro/personal-events.yaml` mirrors `settings.yaml`/`schools.yaml`: cold-launch the dev
variant, deep-link to the create form (`timecalendar-dev://personal-event-form`), **type a title via
the RN-core `TextInput`** (deterministic — a real text field, addressable by `testID`), **accept the
default start/end dates** (do not open the native picker), tap **Save**, assert the new title appears
in the **list** (Home tab), open it, tap **Delete**, assert it is gone. **What it proves:** the full
CRUD round-trip through the real `runMigrations()` → SQLite → repository → reactive `useLiveQuery`
list (create writes a row, the live query re-renders, delete removes it) — end to end, nothing
mocked, on a real device. **What it deliberately does NOT do:** open and drive the native SwiftUI/
Compose date/time picker. Native date/time popups are OS-level and **not reliably addressable** by
Maestro across both iOS and Android — a picker-drive flow would be flaky, and a flaky e2e erodes the
gate. The picker→state **wiring** is proven deterministically by the Jest proof test (D6, driving the
picker's `onValueChange`). State this split in the flow's header comment. Default dates make the
create deterministic without a picker. (If a stable native-picker selector proves reliable on both
platforms during implementation, a date-change step MAY be added as a bonus — only if reliable.)

### D6 — Jest: extend the @expo/ui mock; proof tests for logic + wiring + the error path
`@expo/ui`'s native module has no off-device JS (the A2 situation), and the existing
`jest/setup-expo-ui.ts` already mocks the universal `Host`/`Picker`. **Extend it** to also mock the
`@expo/ui/community/datetime-picker` subpath: a `DateTimePicker` that renders an assertable element
carrying its `testID` and exposes its current `value` + a way to **drive `onValueChange`** (e.g. a
pressable that fires `onValueChange(event, nextDate)` with a fixed test date), mirroring how the
mock `Picker` drives `onValueChange`. Mock at the native seam, not the screen (testing posture).

Proof tests (R-1, gated by `test-mobile`: tsc + lint + Jest):
- **`src/features/personal-events/form/validate.test.ts`** (90% logic) — `validateEventForm`:
  empty/whitespace title → invalid with the title error key; end ≤ start → invalid with the range
  error key; valid input → valid, no errors. Exhaustive branches (the 90% gate's purpose).
- **`src/features/personal-events/form/build.test.ts`** (90% logic) — `buildEventFromForm`: create
  assigns a fresh uid (`newEventId` mocked) + `exportedAt` ~now; edit preserves `existing.uid`;
  strings trimmed, empty location/description → `undefined`; `Date`s passed through. The mappers
  (B1) are not re-tested — B2 hands `Date`s + `#RRGGBB` and trusts `eventToRow`.
- **`src/features/personal-events/form/hooks.test.ts`** (90% logic) — `useSaveEvent`/`useDeleteEvent`
  call `repository.upsert`/`remove` on success; on a **rejected** repository call, `recordError` is
  invoked through the (mocked) `@/firebase` seam and the failure flag is set (the D6 error path).
  `useEventToEdit(uid)` calls `getById`. The repository + `@/firebase` are mocked (the B1 testing
  posture — `jest.mock("@/features/personal-events")`/`@/db` as B1 established).
- **`src/components/personal-events-list.test.tsx`** (70%) — renders rows from a mocked
  `usePersonalEvents`, the localized empty state when empty, and the Add control (role + label).
- **`src/components/personal-event-form-screen.test.tsx`** (70%) — renders the localized labels;
  typing the title + tapping Save (valid) calls `useSaveEvent` with a built event; Save with an
  empty title shows the localized validation error and does not save; in edit mode (a `uid`) the
  Delete control renders and tapping it calls `useDeleteEvent`; driving the date `DateTimePicker`'s
  `onValueChange` updates the form's start/end state (the picker→state wiring).
- **`src/components/color-swatch-picker.test.tsx`** (70%) — renders the preset swatches with labels +
  selected state; pressing a swatch calls `onChange` with its `#RRGGBB`.

This proves the **logic + wiring + the error path** in CI. CI **cannot** prove the native picker's
feel, the OS popup, real VoiceOver/TalkBack, on-device contrast, Crashlytics arrival, or
Maestro-through-the-native-picker — those are the **on-device** half (inboxed, D7).

### D7 — CI-provable vs. manual DoD split (mirrors A2 / splash / firebase)
The DoD is walked in `tasks.md` §9 (automatable) + §10 (manual, inboxed). The split:
- **Automatable (done as tasks, green in CI):** Architecture (route-structure + chrome/theme/i18n
  boundaries, the logic/presentation split of D2, ADR 012 recorded), Types (`tsc`), Lint
  (`--max-warnings 0`: no hardcoded strings, a11y props on every touchable, no `@expo/ui` outside
  chrome, no parent-relative imports, routes not imported from tests, import order), Unit/component
  (the D6 proofs; the 90% logic globs land green via the form/validate/build/hooks tests, the 70%
  floor holds for the screens), i18n (FR+EN parity), a11y *automatable half* (a11y lint; roles +
  translated labels on every control; native pickers carry OS a11y), **Observability** (the failed
  `upsert`/`remove` is recorded through `@/firebase`, proven by the forced-rejection test — **not**
  N/A this time, unlike A1's infallible MMKV), Theming (tokens, light/dark; the native picker adopts
  the platform appearance, R-3).
- **Manual / on-device (inboxed + HUMAN-tagged, skip-and-continue):** manual **VoiceOver** (iOS) +
  **TalkBack** (Android) over the list + form + the native pickers + the swatch group (focus order,
  picker announcement, swatch selection announcement); **native-picker + swatch feel /
  native-correctness** iOS (SwiftUI) + Android (Compose), light + dark; **touch-target** by finger on
  the Add/rows/swatches/Save/Delete; **contrast** eyeball both schemes; **performance/no-jank** on
  the list with many events on a low-end Android; **Crashlytics arrival** of a forced write failure
  (DebugView/dashboard — the manual half of Observability CI can't assert); the
  **Maestro-through-native-picker** date change (only if reliable — D5). In
  `docs/react-native-migration/inbox/2026-06-14-personal-events-ui-dod-manual.md`, with
  what/why/how-to-verify each.
- **Product analytics:** the DoD axis is **considered**, not blanket-N/A. An "event created" /
  "event deleted" event would be a meaningful product event, but firing it needs the on-device
  DebugView verification half CI can't assert, and the natural firing point is the save/delete
  hooks (the logic layer, unit-provable through `@/firebase`). **Decision:** B2 does **not** add
  analytics now — it keeps the analytics taxonomy decision for the cross-feature step that defines
  it (mirroring A2's `settings_changed` deferral). Recorded as **deferred-with-owner** (the
  save/delete hooks in `form/hooks.ts` are the firing point when the taxonomy lands) — not a silent
  N/A.

### D8 — exportedAt + uid semantics for locally-created events (verified against Flutter)
Verified against `app/lib/modules/personal_event/controllers/add_personal_event_controller.dart`:
the Flutter `buildEvent` assigns `uid = Uuid().v4()` and `exportedAt = DateTime.now()` for a **new**
event, and on **edit** preserves the existing `uid` while refreshing `exportedAt = DateTime.now()`.
B2's `buildEventFromForm` mirrors this exactly: create → `uid = newEventId()` (B1's `expo-crypto`
wrapper), `exportedAt = new Date()`; edit → `uid = existing.uid`, `exportedAt = new Date()`. So
`exportedAt` is **"the moment this event was last written from this app"** (its name comes from the
Flutter export/backup lineage — recorded so its semantics aren't mistaken for a created-at). B1's
`eventToRow` normalizes all three timestamps to canonical UTC ISO-8601 (ADR 011) — B2 hands `Date`s
and does not touch the string format. (Not an ADR — it follows the Flutter model + ADR 011, no novel
cross-cutting decision; recorded here so the implementer doesn't invent a different semantics.)

## Risks / Trade-offs

- **`@expo/ui`'s `DateTimePicker` is alpha + OS-chromed (highest risk).** Same posture as A2's
  `Picker`: the chrome wrapper localizes churn to `expo-ui.tsx`, the boundary lint keeps it there,
  the native appearance is the platform's (R-3, reviewed on-device). If it breaks on a platform, the
  blast radius is the wrapper and the ADR-012 contingency names the fallback
  (`@react-native-community/datetimepicker` behind the same wrapper API). The implementer confirms a
  clean `prebuild` + dev build renders it on both platforms before handoff.
- **Native picker not deterministically drivable in Maestro.** Mitigated by D5/D6: the e2e proves the
  full CRUD round-trip via a typed title + default dates (real value, deterministic), the Jest proof
  proves picker→state wiring; no flaky picker-drive flow is shipped.
- **The Jest mock could pass while the real native control is broken.** Inherent to mocking a native
  module (firebase/splash/A2). Mitigated: the mock reproduces the real `onValueChange(event, date)`
  shape so the screen↔state wiring is genuinely exercised; the on-device axes (inbox) + the Maestro
  CRUD round-trip catch a broken native render at app level.
- **Preset palette vs. arbitrary color.** A user who created an arbitrary-colored event in the
  Flutter app keeps that exact `#RRGGBB` on import (verbatim, ADR 011) but can only re-pick from the
  presets when editing. Accepted MVP trade-off (R-2); arbitrary color is the recorded deferral (D4).
- **First real write error path.** B2 is where a feature's write can genuinely fail (DB write),
  unlike A1's infallible MMKV. The `@/firebase` `recordError` wiring + the forced-rejection test are
  the automatable half; Crashlytics **arrival** is the inboxed manual half (firebase's CI-vs-manual
  split).
- **Editing the Home tab from an empty stub.** `(tabs)/index.tsx` becomes the list entrypoint. Kept
  thin (re-exports/uses the `@/components` list module — route-structure rule); the empty-stub home
  title key may be replaced or kept as the list header (implementer's choice within the i18n keys).

## Migration Plan

Additive; rollback = revert (no schema, no migration, no native source hand-edits, no data — the new
routes/components/keys/mock simply disappear; B1's data layer is untouched). Order: extend
`chrome/expo-ui.tsx` with `DateTimePicker` + barrel export (the seam first) → add the FR/EN
`personalEvents.*` i18n keys → build `src/features/personal-events/form/` (validate, build, hooks,
types, barrel) + their 90% tests → build `src/components/color-swatch-picker.tsx`,
`personal-events-list.tsx`, `personal-event-form-screen.tsx` + the thin route
`src/app/personal-event-form.tsx` + edit `(tabs)/index.tsx` → wire `<Stack.Screen
name="personal-event-form" />` in `_layout.tsx` → extend `jest/setup-expo-ui.ts` for
`DateTimePicker` → write the component proof tests → write `.maestro/personal-events.yaml` → confirm
a clean `expo prebuild` + dev build renders the picker on both platforms → ADR 012 + README row,
Architecture Book (CRUD-UI subsection + the `@expo/ui` second-consumer note) + changelog, roadmap
step 2 update, inbox file. Gate on `npx tsc --noEmit`, `npm run lint` (zero warnings), `npm test`
(all proofs + the K-3 gate green). No `app.config.ts`/babel change; no OpenAPI regen; no
server/web/`app/` touch.

## Open Questions

None blocking. Deferred (recorded, not built): arbitrary custom color / native ColorPicker (earned
by a user need — D4); a `@react-native-community/datetimepicker` fallback behind the wrapper (only if
`@expo/ui`'s control proves unstable — ADR 012 revisit); an "event created/deleted" analytics event
in the save/delete hooks (when the analytics taxonomy is defined — D7); a list-level swipe-to-delete
/ search / reordering (earned later — Non-Goals); the Maestro native-picker date-change drive (only
if reliable on both platforms — D5); the manual on-device DoD axes (inbox — D7).
