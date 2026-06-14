## 1. The @expo/ui chrome wrapper — add the date/time control (the seam first)

- [x] 1.1 Extend `mobile/src/components/chrome/expo-ui.tsx` (the existing single import site for
  `@expo/ui`) to also re-export `@expo/ui`'s date/time control. Import the **`@expo/ui/community/datetime-picker`**
  subpath (`import DateTimePicker from "@expo/ui/community/datetime-picker"` — or its named export;
  inspect `node_modules/@expo/ui/build/community/datetime-picker/index.d.ts` for the exact default vs.
  named shape). Re-export it (typed) as `DateTimePicker`. **Confirm this control is `@expo/ui`'s own
  SwiftUI/Compose date/time control, NOT `@react-native-community/datetimepicker`** (design D1 / ADR
  012) — so there is no new dependency. Keep the wrapper **thin** (no higher-level composed
  date-field, no forced theming of the OS-chromed control — R-3). Update the file header comment to
  note the second `@expo/ui` consumer (the date/time control) under the same ADR-010 universal posture.
- [x] 1.2 Export `DateTimePicker` from the chrome barrel `mobile/src/components/chrome/index.ts`
  (`export { DateTimePicker } from "@/components/chrome/expo-ui"`); update the `@expo/ui` note to
  record the second control.
- [x] 1.3 Confirm the chrome lint boundary is satisfied: `@expo/ui` (and the
  `@expo/ui/community/datetime-picker` subpath) is imported only inside `src/components/chrome/**`
  (the `^@expo/ui($|/)` ban + the `timecalendar/chrome-seams` exemption already cover the subpath — no
  `eslint.config.js` change needed; verify the regex matches the subpath).

## 2. i18n catalogs (FR + EN) — `src/i18n/locales/{en,fr}.json`

- [x] 2.1 Add flat dotted `personalEvents.*` keys to **both** `en.json` and `fr.json` (FR/EN parity is
  `tsc`-typed bidirectionally — a missing/extra key in either fails the typecheck). At minimum:
  - List: `personalEvents.list.title`, `personalEvents.list.empty`, `personalEvents.list.add`
  - Form: `personalEvents.form.titleLabel`, `personalEvents.form.titlePlaceholder`,
    `personalEvents.form.startLabel`, `personalEvents.form.endLabel`,
    `personalEvents.form.locationLabel`, `personalEvents.form.locationPlaceholder`,
    `personalEvents.form.descriptionLabel`, `personalEvents.form.descriptionPlaceholder`,
    `personalEvents.form.colorLabel`, `personalEvents.form.save`, `personalEvents.form.delete`,
    `personalEvents.form.createTitle`, `personalEvents.form.editTitle`
  - Validation: `personalEvents.form.error.titleRequired`, `personalEvents.form.error.endBeforeStart`,
    `personalEvents.form.error.saveFailed`, `personalEvents.form.error.deleteFailed`
  - a11y: `personalEvents.color.swatchLabel` (or per-swatch labels), `personalEvents.list.rowLabel`
  Final key names are at the implementer's discretion **following the existing flat convention** (the
  string in code is the string in the catalog). Pick natural FR + EN copy.

## 3. Feature logic — `src/features/personal-events/form/` (90% coverage glob)

- [x] 3.1 `mobile/src/features/personal-events/form/types.ts`: the `EventFormValues` shape (`title:
  string`, `startsAt: Date`, `endsAt: Date`, `color: string`, `location: string`, `description:
  string` — all populated in the editing state, strings default `""`) and the validation-result type
  (`{ valid: boolean; errors: { title?: string; range?: string } }` carrying **error keys**, not
  sentences).
- [x] 3.2 `mobile/src/features/personal-events/form/validate.ts`: a **pure** `validateEventForm(values:
  EventFormValues)` — title required (non-empty after `trim()`) → `personalEvents.form.error.titleRequired`;
  end strictly after start (`endsAt > startsAt`) → `personalEvents.form.error.endBeforeStart`. No `t()`
  inside (i18n-agnostic; the screen maps key → `t()`). No `@/db` / no side effects.
- [x] 3.3 `mobile/src/features/personal-events/form/build.ts`: a **pure** `buildEventFromForm(values:
  EventFormValues, existing?: PersonalEvent): PersonalEvent` — trim strings (empty location/description
  → `undefined`); `uid = existing?.uid ?? newEventId()` (B1's `@/features/personal-events` /
  `expo-crypto` wrapper); `exportedAt = new Date()`; pass `startsAt`/`endsAt`/`color` through (the
  Flutter `buildEvent` semantics, design D8). Hand `Date`s + the `#RRGGBB` string to the domain type —
  do **not** re-encode to ISO/hex here (B1's `eventToRow` owns that, ADR 011). For testability, accept
  the `newEventId`/clock via the module import (the test mocks them) or assert the non-deterministic
  fields structurally.
- [x] 3.4 `mobile/src/features/personal-events/form/hooks.ts`: `useSaveEvent()` and `useDeleteEvent()`
  — thin async wrappers over B1's `repository.upsert` / `repository.remove`; on rejection, `recordError`
  through `@/firebase` and expose a failure flag (the D6 error path; **do not swallow**). `useEventToEdit(uid?:
  string)` — loads an existing event for prefill via `repository.getById` (returns `undefined` for
  create). Import the repository + types from `@/features/personal-events` (the B1 barrel), `@/firebase`
  for `recordError`.
- [x] 3.5 `mobile/src/features/personal-events/form/index.ts`: barrel re-exporting the public surface
  (`validateEventForm`, `buildEventFromForm`, `useSaveEvent`, `useDeleteEvent`, `useEventToEdit`,
  `EventFormValues`). Do **not** create an import cycle with the B1 `data/` barrel (the feature-level
  `personal-events/index.ts` may re-export both `data` and `form` — verify no cycle).

## 4. Presentational components — `src/components/` (70% floor)

- [x] 4.1 `mobile/src/components/color-swatch-picker.tsx`: a custom RN component — a row of `Pressable`
  swatches over a small preset `#RRGGBB` palette (an `as const` array; default = the first/brand
  preset). Props: `value: string`, `onChange: (hex: string) => void`. Each swatch:
  `accessibilityRole="button"`, `accessibilityState={{ selected: hex === value }}`,
  `accessibilityLabel={t(...)}`, ≥44pt/48dp hit area, the selected one visibly ringed. No raw color
  literals outside the palette constant; use `@/theme` tokens for chrome (ring/spacing). No new native
  dep (design D4).
- [x] 4.2 `mobile/src/components/personal-events-list.tsx`: a **presentational** list body over B1's
  `usePersonalEvents()` (`@/features/personal-events`). Renders rows (title, color swatch, date/time
  range; each row an accessible `Pressable` navigating to `/personal-event-form?uid=<uid>` for edit),
  a localized empty state, and an accessible Add control (role + label, ≥44pt/48dp) navigating to
  `/personal-event-form` (create). Use `@/theme` tokens, `ThemedText`/`ThemedView`, `SafeAreaView`;
  `FlatList` or a mapped list. No `allowFontScaling={false}`.
- [x] 4.3 `mobile/src/components/personal-event-form-screen.tsx`: the **presentational** form (design
  D2 — owns no validation/build/persist logic). Read the optional `uid` route param
  (`useLocalSearchParams`); `useEventToEdit(uid)` for prefill. Hold local `EventFormValues` state
  (`useState`); render: a title `TextInput` (RN core, controlled — D3), the `DateTimePicker`s for
  start + end (from `@/components/chrome`, `mode="datetime"` or date+time, each with a stable `testID`),
  the `ColorSwatchPicker`, optional location + description `TextInput`s (description multiline). A Save
  control: on press, `validateEventForm` → if invalid, render the localized error(s) and do not save;
  if valid, `buildEventFromForm(values, existing)` → `useSaveEvent().save(...)` → on success navigate
  back, on failure show `error.saveFailed`. In edit mode (a `uid`), a Delete control →
  `useDeleteEvent().remove(uid)` → back / `error.deleteFailed`. Every control: role + translated label
  + ≥44pt/48dp. All strings via `t()`. `@/theme` tokens; no raw colors; no `allowFontScaling={false}`.
- [x] 4.4 Edit `mobile/src/app/(tabs)/index.tsx` (the Home/"Accueil" tab, currently an empty stub) to
  render `<PersonalEventsList />` (keep the route thin — it composes the `@/components` module, the
  route-structure rule; the list's own test lives beside the component). Replace/keep the
  `home.title` key as the list header per the i18n keys (implementer's choice).

## 5. Route + reachability

- [x] 5.1 Create the thin route `mobile/src/app/personal-event-form.tsx`:
  `export { default } from "@/components/personal-event-form-screen"` (no logic, no colocated test —
  route-screen rule).
- [x] 5.2 In `mobile/src/app/_layout.tsx`, add `<Stack.Screen name="personal-event-form" />` as a
  sibling of `<Stack.Screen name="(tabs)" />` / `schools` / `settings` (non-tab routes must be `Stack`
  siblings of `(tabs)` — route-structure rule). Keep `_layout.tsx` thin (preserve `import "@/i18n"`,
  `void runMigrations()`, `<SplashScreen />`).
- [x] 5.3 Confirm reachability via the dev deep link `timecalendar-dev://personal-event-form` (create)
  and `timecalendar-dev://personal-event-form?uid=<uid>` (edit) — the Maestro target.

## 6. Jest mock — extend `jest/setup-expo-ui.ts`

- [x] 6.1 Extend `mobile/jest/setup-expo-ui.ts` to also mock the `@expo/ui/community/datetime-picker`
  subpath (its native module has no off-device JS — mirror the existing `Host`/`Picker` mock and
  `setup-firebase`/`setup-splash`/`setup-storage`). The mock `DateTimePicker` must render an assertable
  element carrying its `testID` and let the test **drive `onValueChange(event, nextDate)`** (e.g. a
  pressable that fires the callback with a fixed test date), so the proof test can assert the form's
  start/end state updates. Match the real prop shape (`value`, `mode`, `onValueChange`, `testID`).
  Mock the subpath module explicitly (`jest.mock("@expo/ui/community/datetime-picker", ...)`) since the
  existing `jest.mock("@expo/ui", ...)` does not cover subpaths.
- [x] 6.2 Confirm `setup-expo-ui.ts` registration in `jest.config.js` `setupFilesAfterEnv` still works
  (no new file — extending the existing one); the existing A2 picker suites stay green.

## 7. CI proof tests (R-1)

- [x] 7.1 `mobile/src/features/personal-events/form/validate.test.ts` (90%): empty/whitespace title →
  invalid + title error key; end ≤ start → invalid + range error key; valid → valid, no errors.
  Exhaustive branches.
- [x] 7.2 `mobile/src/features/personal-events/form/build.test.ts` (90%): create → fresh uid
  (`newEventId` mocked) + `exportedAt` ~now; edit → preserves `existing.uid`; strings trimmed, empty
  optional → `undefined`; `Date`s/`color` passed through. Do not re-test B1's mappers.
- [x] 7.3 `mobile/src/features/personal-events/form/hooks.test.ts` (90%): success → `repository.upsert`
  / `remove` called; **rejected** repository call → `recordError` invoked through the mocked
  `@/firebase` seam + failure flag set (the D6 error path); `useEventToEdit(uid)` → `getById`. Mock the
  repository (`@/features/personal-events`) and `@/firebase` (B1's testing posture; `@/db` mocked
  suite-wide by `setup-db.ts`).
- [x] 7.4 `mobile/src/components/color-swatch-picker.test.tsx` (70%): renders the preset swatches with
  labels + selected state; pressing a swatch calls `onChange` with its `#RRGGBB`.
- [x] 7.5 `mobile/src/components/personal-events-list.test.tsx` (70%): renders rows from a mocked
  `usePersonalEvents`; the localized empty state when empty; the Add control (role + label).
- [x] 7.6 `mobile/src/components/personal-event-form-screen.test.tsx` (70%): renders the localized
  labels through the real theme + i18n trees; typing the title + Save (valid) calls `useSaveEvent`
  with a built event; Save with an empty title shows the localized validation error and does **not**
  save; edit mode (a `uid`) renders Delete and tapping it calls `useDeleteEvent`; driving the start
  `DateTimePicker`'s `onValueChange` updates the form state. Mock the save/delete/edit hooks (or the
  repository + firebase) so the wiring is asserted without a real DB.
- [x] 7.7 Confirm the **K-3 coverage gate stays green** with the new files: logic under
  `src/features/personal-events/form/**` meets 90%; the screens under `src/components/**` fall under
  the 70% floor. `jest.config.js` `coverageThreshold` SHALL NOT change.

## 8. Maestro flow — `mobile/.maestro/personal-events.yaml`

- [x] 8.1 Create `mobile/.maestro/personal-events.yaml` mirroring `settings.yaml`/`schools.yaml`:
  `appId: fr.samuelprak.timecalendar.dev`; `launchApp` → `stopApp` → `openLink:
  timecalendar-dev://personal-event-form` → the iOS-only `tapOn: "Open"` (in `runFlow when: platform:
  iOS`) → type a title into the title `TextInput` (by `testID`) → tap **Save** (by `testID`) → assert
  the new title is visible in the **list** (Home tab, `extendedWaitUntil`, generous timeout) → tap the
  row to edit → tap **Delete** → assert the title is **gone**. Header comment: it proves the full
  create→list→delete round-trip through real migrations → SQLite → repository → live query; it
  deliberately uses **default dates** and does **not** open/drive the native date/time picker
  (non-deterministic across platforms — design D5; picker→state wiring proven by the Jest test). If a
  stable native-picker selector proves reliable on **both** platforms during implementation, a
  date-change step MAY be added as a bonus — only if reliable; do not ship a flaky flow.

## 9. Definition-of-Done walk — automatable axes (do them)

B2 is the second feature through the full DoD, the first with a multi-field form + a real write error
path. Each axis is ✅ a task, ➖ N/A-with-reason, or deferred to the inbox (§10). No third state
(`definition-of-done.md`).

- [x] 9.1 **Architecture** — follows the Architecture Book (route-structure, chrome/theme/i18n
  boundaries, the logic-in-features / presentation-in-components split of D2); load-bearing decisions
  in `design.md` (D1–D8); the date/time-control choice recorded as **ADR 012** (§11). Respects
  import/module boundaries (no `@expo/ui` outside chrome; no `drizzle-orm` outside `@/db` — B2 only
  touches `@/db` via B1's repository).
- [x] 9.2 **Types** — `npx tsc --noEmit` clean in `mobile/`; no unjustified `any` (the `@expo/ui`
  date/time types + the form types cover it).
- [x] 9.3 **Lint** — `npm run lint` clean in `mobile/` (`--max-warnings 0`): no hardcoded strings, a11y
  props valid on every touchable (rows, Add, swatches, Save, Delete), `@expo/ui` only inside `chrome/`,
  no parent-relative imports, routes not imported from tests, import order.
- [x] 9.4 **Unit/component tests** — the §7 proofs green; the **90% logic globs** land green via the
  validate/build/hooks tests; the **70% floor** holds for the screens; the K-3 gate is unchanged
  (9.4 / 7.7).
- [x] 9.5 **i18n** — zero hardcoded strings (lint); FR + EN complete (`tsc` bidirectional parity). ✅ via §2.
- [x] 9.6 **Accessibility (automatable half)** — a11y lint passes; every interactive control declares a
  role + translated label + a ≥44pt/48dp hit target; the swatch group is single-select-labeled; the
  native pickers carry OS accessibility; `allowFontScaling` not disabled. Manual screen-reader /
  touch-by-finger / contrast halves → §10 (inbox).
- [x] 9.7 **Theming / light-dark** — the list/form/swatches render scheme-appropriate `@/theme` tokens;
  the native date/time control adopts the platform's light/dark appearance (D1 — not force-themed,
  R-3). No raw color literals (the swatch palette is the one allowed `#RRGGBB` constant — it is **data**
  stored verbatim per ADR 011, not chrome styling; document this at the constant).
- [x] 9.8 **Native correctness (automatable half)** — uses native `@expo/ui` date/time controls via the
  wrapper (R-2/R-3); RN-core text inputs; the on-device feel/native-correctness review is §10 (inbox).
- [x] 9.9 **Observability** — ✅ **wired** (not N/A): a rejected `upsert`/`remove` is recorded through
  `@/firebase` `recordError` in the save/delete hooks (a DB write can fail, unlike A1's infallible
  MMKV), proven by the forced-rejection test (§7.3). Crashlytics **arrival** is the manual half → §10.
- [x] 9.10 **Product analytics** — **deferred-with-owner** (not silent N/A): an "event created" /
  "event deleted" event is meaningful, but its natural firing point is the save/delete hooks (logic,
  unit-provable through `@/firebase`) and verifying arrival needs on-device DebugView; the analytics
  taxonomy is owned by the cross-feature step that defines it (mirroring A2's `settings_changed`). B2
  does not add the event; the save/delete hooks are the recorded firing point. Record in the DoD record.
- [x] 9.11 **Performance** — the list uses an efficient list primitive (`FlatList` with keyed rows) so
  many events do not jank; Reassure/low-end-Android jank check is the on-device half → §10.
- [x] 9.12 **Documentation** — Architecture Book updates + changelog (§11); ADR 012 (§11). Record that
  the DoD axes are walked here (this §9 + §10 is the audit trail).
- [x] 9.13 **Native config sanity** — run `npx expo prebuild --clean` and a dev build; confirm the
  native date/time control renders on iOS + Android and `@expo/ui` autolinked **without** an
  `app.config.ts` plugin entry (design D1 — config-shape, verified by build, not lint). If the
  date/time control unexpectedly needs a native plugin/dep, that is the ADR-012 contingency
  (`@react-native-community/datetimepicker` behind the same wrapper) — record it and proceed.

## 10. Definition-of-Done walk — manual on-device axes (inboxed, HUMAN-tagged)

Irreducibly on-device; implementer/reviewer **skip-and-continue** (do not block). All items, with
what/why/how-to-verify, are in
`docs/react-native-migration/inbox/2026-06-14-personal-events-ui-dod-manual.md`.

- [ ] 10.1 Manual **VoiceOver** pass (iOS) — the list (rows, Add), the form (inputs, pickers, swatches,
  Save/Delete), focus order + announcement quality. (HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)
- [ ] 10.2 Manual **TalkBack** pass (Android). (HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)
- [ ] 10.3 On-device **native date/time picker feel / native-correctness** — iOS (SwiftUI), light +
  dark. (HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)
- [ ] 10.4 On-device **native date/time picker feel / native-correctness** — Android (Compose), light +
  dark. (HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)
- [ ] 10.5 **Color-swatch + form** native-correctness + **touch-target by finger** (rows, Add, swatches,
  Save, Delete comfortably tappable). (HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)
- [ ] 10.6 **Color-contrast** eyeball — list/form text on background + the swatch ring, both schemes,
  against the documented AA pairs in `tokens.ts`. (HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)
- [ ] 10.7 **Performance / no-jank** — scroll a list with many events on a low-end Android; create/edit/
  delete feel smooth. (HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)
- [ ] 10.8 **Observability arrival** — force a write failure and confirm the error reaches Crashlytics
  (DebugView/dashboard — the manual half of §9.9). (HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)
- [ ] 10.9 **E2E** — run `mobile/.maestro/personal-events.yaml` (+ confirm `schools.yaml` /
  `settings.yaml` still pass) through `ci-mobile-e2e.yml` (on-demand, `run-e2e` label / on main).
  Optionally evaluate whether a native-picker date-change is reliable enough to add (design D5).
  (HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)

## 11. Docs + ADR (R-1 pointers + ownership)

- [x] 11.1 **ADR** `.claude/rules/mobile/decisions/012-personal-event-datetime-picker.md` (copy
  `TEMPLATE.md`; next free number — B1 took 011): the date/time-control choice — adopt **`@expo/ui`'s
  own `DateTimePicker`** (`@expo/ui/community/datetime-picker`, SwiftUI/Compose, **not**
  `@react-native-community/datetimepicker` despite mirroring its types) **behind the existing
  `src/components/chrome/expo-ui.tsx` wrapper** under ADR 010's universal posture (no new dep,
  autolinks, no plugin); the rejected alternatives (`@expo/ui` platform-specific entries — the ADR-010
  revisit / R-2 split; `@react-native-community/datetimepicker` directly — a new dep + a parallel
  native surface for no gain); Consequences (every later native control with a divergent surface copies
  this seam + choice) + Revisit-if (`@expo/ui`'s control proves unstable enough to warrant the RNC
  fallback behind the same wrapper API). Add the index row to
  `.claude/rules/mobile/decisions/README.md`.
- [x] 11.2 **Architecture Book — "Theming & native-chrome"**: update the `@expo/ui` wrapper note to
  record the **second consumer** (the `DateTimePicker` date/time control, B2) and that the universal/
  community date/time control — not the RNC module — is used; pointer to ADR 012.
- [x] 11.3 **Architecture Book — "Storage → First feature schema — personal events"**: add a
  **"Personal events — CRUD UI"** subsection (the Home-tab list over `usePersonalEvents`; the single
  create/edit form route + delete; the form/validation logic in `src/features/personal-events/form/`
  (90%) vs. the presentational screens (70%); the native date/time pickers via the chrome wrapper
  (ADR 012); the preset color-swatch picker storing `#RRGGBB` verbatim; the `@/firebase` write error
  path; what CI proves vs. on-device). Pointer style (R-1), not duplication.
- [x] 11.4 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (Live section): the
  Personal-events CRUD UI + the second `@expo/ui` chrome consumer (`DateTimePicker`) + ADR 012; note B2
  is the first feature with a multi-field form + a real write error path through `@/firebase`.
- [x] 11.5 Update `docs/react-native-migration/01-roadmap/02-pattern-establishment.md` step 2: B2 UI
  (list + form + native pickers + delete) landed; **Feature B's full DoD pass is pending the inboxed
  on-device axes** (§10).
- [x] 11.6 Create `docs/react-native-migration/inbox/2026-06-14-personal-events-ui-dod-manual.md`
  (mirror `2026-06-14-settings-screen-dod-manual.md`): the §10 items, each with What / Why /
  How-to-verify / Blocks (per the inbox README convention).

## 12. Local verification (gates)

- [x] 12.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 12.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`).
- [x] 12.3 `npm test` green in `mobile/` (all §7 proofs + existing suites; the K-3 gate green, 90%
  logic + 70% floor).
- [x] 12.4 `npx expo prebuild --clean` succeeds and a dev build renders the native date/time control on
  both platforms (§9.13).

## 13. Validate

- [x] 13.1 `npx openspec validate add-mobile-personal-events-ui --strict` passes.
