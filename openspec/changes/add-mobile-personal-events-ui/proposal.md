# Personal events CRUD UI: list + create/edit/delete form over B1's data layer, native @expo/ui date/time pickers, full DoD

## Why

Phase 2's **Feature B — Personal events** (ADR [004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md))
is the device-local **CRUD + forms + native date/time pickers** axis. B1
(`add-mobile-personal-events-data` / TIM-132, merged) landed Feature B's **data layer** — the
first real `src/db/schema.ts` (`personalEvents`, importer-targetable columns), the first real
migration, the `@/db` seam widening, and the `src/features/personal-events/data/` module:
the `PersonalEvent` domain type, the pure row↔domain mappers, the async repository
(`findAll` / `getById` / `upsert`-by-uid / `remove` / `findInRange`), the `newEventId()` uid
wrapper (`expo-crypto`), and the reactive `usePersonalEvents()` hook. B1 explicitly shipped
**no screen, no form, no picker, no list, no route** and named this B-issue (B2 / TIM-133) as
their owner. Feature B is not DoD-complete until B2 lands.

This change is the **UI layer** over B1's data layer: a personal-events **list** (the Home tab),
a **create/edit form** (one route, optional `uid` param → prefill + delete), **native date/time
pickers**, **validation**, **i18n** (FR+EN), **a11y**, a **Maestro CRUD e2e**, and the **full
Definition of Done** walked on both platforms. It is the **second feature through the entire DoD**
(after Settings/A2) and the first with a multi-field **form** — so it is where the form-validation
pattern, the date/time-picker chrome adoption, and a genuine write **error path** (a failed DB
write, unlike A1's infallible MMKV) first appear.

## What Changes

- **List on the Home tab.** `src/app/(tabs)/index.tsx` ("Accueil", today an empty stub) renders the
  personal-events list via B1's `usePersonalEvents()` (reactive `useLiveQuery`), with an **Add**
  action and an empty state. The list content is a **presentational** component
  `src/components/personal-events-list.tsx` (tested beside it); the tab route stays thin. Each row
  shows the title, the color swatch, the date/time range, and (optional) location, and navigates to
  the form prefilled for **edit**.
- **One create/edit form route.** A thin route `src/app/personal-event-form.tsx`
  (`export { default } from "@/components/personal-event-form-screen"`) over a presentational
  `src/components/personal-event-form-screen.tsx`, registered as a `<Stack.Screen>` **sibling of
  `(tabs)`** in `src/app/_layout.tsx` (route-structure rule — a bare sibling under the native tabs is
  unreachable). An optional `uid` route param drives **create** (no param → blank form, defaults,
  no delete) vs. **edit** (param → prefill from `getById`, show a **delete** control). Dev deep link
  `timecalendar-dev://personal-event-form` (create) for Maestro.
- **Form/validation LOGIC lives in the feature folder** (90%-gated per ADR
  [003](../../../.claude/rules/mobile/decisions/003-coverage-threshold.md)), not the presentational
  screen. New `src/features/personal-events/form/`: a pure `validateEventForm(...)` (title required;
  end strictly after start; trimmed strings) and a pure `buildEventFromForm(...)` that assembles a
  `PersonalEvent` from form fields (assigning `newEventId()` + `exportedAt = new Date()` on create,
  preserving the existing uid on edit — mirroring the Flutter `buildEvent`), plus a thin
  `useSaveEvent()` / `useDeleteEvent()` mutation hook layer over B1's `repository` that records a
  failed write through `@/firebase`. Screens stay presentational and only render + call these.
- **Native date/time pickers through the `@expo/ui` chrome seam.** A new control re-exported from
  `src/components/chrome/expo-ui.tsx`: `@expo/ui`'s `DateTimePicker` (its universal/community
  date-time control — SwiftUI `DatePicker` on iOS, Jetpack Compose date/time dialogs on Android, a
  plain fallback off-device). Imported via the `@expo/ui` subpath that the chrome lint boundary
  already bans outside `src/components/chrome/**`, so it **must** live in the wrapper; the form
  imports `@/components/chrome`. This is the **second `@expo/ui` consumer** (the first was A2's
  `Picker`) — it extends the *same* wrapper and the *same* universal-entry posture ADR 010 set, so
  it needs **no new ADR** for the chrome decision; the load-bearing choice this change *does* make
  an ADR for is **which** date/time control to use (below).
- **Color selection** as a small preset-palette swatch row — a custom, testable, a11y-labeled RN
  component `src/components/color-swatch-picker.tsx` (no new native dep), storing the chosen
  `#RRGGBB` TEXT verbatim (ADR 011). A handful of brand-adjacent preset colors (the MVP; arbitrary
  custom color via a native ColorPicker is deferred — R-2, design D4).
- **Title** as RN core `TextInput`; **location / description** optional RN core `TextInput`s
  (multiline for description). RN core over `@expo/ui`'s `TextInput` (stable, idiomatic, fully
  controllable + testable — design D3).
- **Validation feedback** — the Save action is disabled / shows an inline error when the title is
  empty or the end is not after the start (`validateEventForm`), all localized.
- **i18n** — new flat dotted keys (`personalEvents.*`) for the list (title, empty state, add),
  the form (field labels, placeholders, save/delete, validation messages, the color label), FR + EN
  complete (`tsc`-typed bidirectional parity).
- **a11y** — every interactive control (Add, rows, swatches, pickers, Save, Delete) carries a role +
  translated label and ≥44pt/48dp touch targets; the swatches are a labeled single-select group;
  no `allowFontScaling={false}`. Manual screen-reader / on-device axes inboxed + HUMAN-tagged.
- **Observability** — a failed `upsert` / `remove` is recorded through the `@/firebase` seam
  (a write **can** fail, unlike A1's synchronous infallible MMKV prefs — DoD Observability is
  satisfied, not N/A). Proven in CI via a forced-rejection test.
- **Jest** — extend `jest/setup-expo-ui.ts` so the new `DateTimePicker` renders + can be driven; CI
  proof tests for the validation/build logic (90% gate), the list, the form wiring (save/delete →
  repository, picker → state), and the firebase error path.
- **Maestro CRUD e2e** — `mobile/.maestro/personal-events.yaml`: create (type a title via the
  `TextInput`, accept default dates) → assert in the list → open it → delete → assert gone. It
  deliberately does **not** drive the native date/time picker popup (non-deterministic across iOS +
  Android — the picker→state wiring is proven by Jest; design D5).
- **Architecture Book** gains a **"Personal events — CRUD UI"** subsection under "Storage → First
  feature schema — personal events"; the `@expo/ui` chrome note records the second consumer +
  `DateTimePicker`; a changelog entry; **ADR 012** records the date/time-control choice. Roadmap
  step 2 updated. The manual on-device DoD axes are inboxed.

## Capabilities

### New Capabilities

- `mobile-personal-events-ui`: the Personal-events feature's UI layer — the Home-tab list over
  B1's reactive `usePersonalEvents()`, the single create/edit form route (optional `uid` param →
  prefill + delete), the form/validation **logic** in `src/features/personal-events/form/`
  (`validateEventForm`, `buildEventFromForm`, the save/delete mutation hooks recording failures
  through `@/firebase`), the native date/time pickers via the extended `@expo/ui` chrome wrapper,
  the preset color-swatch picker storing `#RRGGBB` verbatim, the RN-core text inputs, the FR/EN
  strings, the a11y obligations, and what CI proves (logic + wiring + the error path) vs. what is
  verified manually on-device (native-picker feel/contrast, VoiceOver/TalkBack, the
  Maestro-through-the-native-picker).

### Modified Capabilities

<!-- none. mobile-personal-events-data (B1) is consumed unchanged — B2 renders + mutates over its
existing repository/hook and adds no data-layer logic, so its requirements do not change.
mobile-theming's @expo/ui chrome wrapper gains a second control (DateTimePicker) — normal seam
evolution per R-1/R-2 under the existing ADR 010 (universal entry), not a contract change; the new
control is owned by and described in this change's spec. mobile-settings-screen (A2) is untouched.
mobile-architecture-book gains a "Personal events — CRUD UI" note — normal book evolution. -->

## Impact

- `mobile/`: new `src/components/personal-events-list.tsx` (+ `.test.tsx`); new
  `src/components/personal-event-form-screen.tsx` (+ `.test.tsx`); new
  `src/components/color-swatch-picker.tsx` (+ `.test.tsx`); new thin route
  `src/app/personal-event-form.tsx`; edited tab route `src/app/(tabs)/index.tsx` (renders the list +
  Add); `src/app/_layout.tsx` gains `<Stack.Screen name="personal-event-form" />`; new feature logic
  `src/features/personal-events/form/{validate,build,hooks,types,index}.ts` (+ tests); `en.json` /
  `fr.json` gain the `personalEvents.*` keys; `jest/setup-expo-ui.ts` extended to mock
  `DateTimePicker`; new `mobile/.maestro/personal-events.yaml`.
- **`app.config.ts`: no change.** The date/time picker is `@expo/ui`'s own control (already
  installed, autolinks, no `plugins` entry — verified against `node_modules/@expo/ui@56.0.17`,
  design D1). **No new dependency.** Native projects regenerate on the next `npx expo prebuild`;
  never hand-edit `mobile/ios` / `mobile/android`.
- `.claude/rules/mobile/architecture.md`: a "Personal events — CRUD UI" subsection added; the
  `@expo/ui` chrome note records the second consumer (`DateTimePicker`).
  `.claude/rules/mobile/architecture-changelog.md`: an entry appended.
  `.claude/rules/mobile/decisions/012-personal-event-datetime-picker.md`: new ADR + README index row.
- `docs/react-native-migration/01-roadmap/02-pattern-establishment.md`: step 2 updated (B2 UI
  landed; Feature B DoD pass pending the inboxed on-device axes).
- `docs/react-native-migration/inbox/2026-06-14-personal-events-ui-dod-manual.md`: the manual
  on-device DoD axes (VoiceOver + TalkBack over the list + form + native pickers, native-picker +
  swatch feel/contrast iOS + Android, touch-target by finger, light/dark eyeball, low-end-Android
  jank on the list, Crashlytics arrival of a forced write failure, Maestro-through-native-picker if
  it can be made reliable) — what / why / how to verify.
- No server / web / `app/` code touched. No OpenAPI change. No K-3 `jest.config.js` change (logic
  goes under the existing `src/features/**` 90% glob; screens are presentational under the 70%
  floor — the gate stays exactly as A1 set it).
