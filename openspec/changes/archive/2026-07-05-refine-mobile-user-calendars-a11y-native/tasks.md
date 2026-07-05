# Tasks — Refine user calendars (a11y + native, iterate-screen panel)

All paths are under `mobile/` unless noted. This refines the merged screen
(`b3104f5`) — do NOT re-implement the data layer, the delete pattern, the events-seam
filter, or the route/Profile wiring. Run the gates (`npx tsc --noEmit`, `npm run lint`,
`npm test -- --coverage`) in `mobile/` after each implementation group. **No new
dependency, no new Drizzle table, no new migration, no native/`app.config.ts`/babel change.**

## 1. The i18n keys (do first — tsc parity fails otherwise; flat typed keys, FR + EN)

- [x] 1.1 Add to BOTH `src/i18n/locales/en.json` and `fr.json`:
  `userCalendars.rowLabel` (EN "{{name}}, {{school}}" / FR "{{name}}, {{school}}"),
  `userCalendars.visibilityHint` (EN "Shows or hides this calendar" / FR "Affiche ou masque
  ce calendrier"), `userCalendars.delete.action` (EN "Delete" / FR "Supprimer" — the
  dedicated Android trash label, decoupled from `userCalendars.delete.confirm`), and
  `userCalendars.add.short` (EN "Add" / FR "Ajouter"). Keep the existing `userCalendars.add`
  ("Add a calendar" / "Ajouter un calendrier") as the accessible long name. FR/EN key parity
  must hold.

## 2. The reactive read memo (identity stability — Decision 6)

- [x] 2.1 In `src/features/calendar-sources/data/user-calendars/hooks.ts`, change
  `useUserCalendars` to `return useMemo(() => data.map(rowToCalendar), [data])` (import
  `useMemo` from `react`). Do NOT touch the personal-events read (same pre-existing issue,
  out of scope — flagged in design.md).

## 3. The row restructure — the crux a11y fix (Decision 1)

- [x] 3.1 In `ui/user-calendars-screen.tsx` `CalendarRow`, merge the leading checkbox
  `Pressable` and the name/school text `View` into ONE **row-level toggle `Pressable`** that
  spans the row's flexible width: `accessibilityRole="checkbox"`,
  `accessibilityState={{ checked: calendar.visible }}`,
  `accessibilityLabel={t("userCalendars.rowLabel", { name, school })}`,
  `accessibilityHint={t("userCalendars.visibilityHint")}`, `onPress={onToggle}`. Move the
  `accessibilityActions=[{ name: "delete", label: deleteLabel }]` + `onAccessibilityAction`
  (dispatch `"delete"` → `requestDelete`) onto THIS toggle Pressable.
- [x] 3.2 Keep the delete a **sibling** `Pressable` inside the same parent row `View`. The
  parent row `View` stays plain — do NOT add `accessible={true}` (it would flatten the
  two-target design). No nested touchables (lint error rule holds).
- [x] 3.3 Hide the now-redundant row text from AT: wrap the name/subtitle in the toggle's
  text container with `importantForAccessibility="no-hide-descendants"` and
  `accessibilityElementsHidden` so the name is not spoken three times per row (the toggle
  label carries it). Keep the `testID={`user-calendar-row-${calendar.id}`}` on the toggle
  Pressable (the element the test now targets), not the parent View.
- [x] 3.4 Row title typography: give the name `ThemedText` the `school-row.tsx:58-64`
  `rowName` `Platform.select` body override (iOS 17/22/400, Android 400) so it reads as body,
  not emphasis.

## 4. The checked indicator (Decision 2)

- [x] 4.1 Replace the `checkDot` `View` with a checkmark: iOS
  `<SymbolView name="checkmark" size={…} tintColor={theme.onPrimary} />` (SymbolView already
  imported), Android `<ThemedText themeColor="onPrimary">✓</ThemedText>` (no icon font, no
  new dep). Fill the checked box with `theme.primaryStrong` and tint the mark `onPrimary`
  (the documented 5.87:1 pair — `tokens.ts`). Unchecked box keeps the `primary` border on a
  transparent fill. Remove the `checkDot` style. NO new token.

## 5. Pressed-state feedback (Decision 3 pattern, from school-row.tsx:24-30)

- [x] 5.1 On the row toggle Pressable, the delete Pressable, and the header add Pressable:
  add `android_ripple={{ color: theme.ripple, foreground: true }}` and an iOS pressed
  background via `style={({ pressed }) => [ …base, Platform.OS === "ios" && pressed &&
  { backgroundColor: theme.backgroundSelected } ]}`.

## 6. The add affordance → native header action (Decision 3)

- [x] 6.1 Move the add out of the in-body bordered button into the existing `<Stack.Screen>`
  `options.headerRight` (mirror `event-details-screen.tsx:149-160`): a `Pressable`,
  `accessibilityRole="button"`, `accessibilityLabel={t("userCalendars.add")}` (the long
  string), `hitSlop={Spacing.two}`, pressed feedback (task 5.1), rendering
  `<ThemedText type="smallBold" themeColor="primary">{t("userCalendars.add.short")}</ThemedText>`
  → `router.push("/onboarding/school")`. Remove the old `styles.addButton` in-body button and
  its style.

## 7. The empty state — gate on load + center (Decision from disposition item 6)

- [x] 7.1 Surface a `loaded` flag from the read so the empty state waits for the first
  resolve. Either read `updatedAt` from `useLiveQuery` in `hooks.ts` and expose it (e.g. a
  `useUserCalendarsLoaded()` or return shape) OR derive loaded in the screen — keep it
  minimal and typed; `useLiveQuery` `updatedAt` is `undefined` until the first resolve.
- [x] 7.2 In the screen: render nothing (no empty state, no live region) until `loaded`. When
  `loaded && calendars.length === 0`, render a **centered** (flex:1, center) empty state — a
  title + the existing `userCalendars.empty` secondary line, the secondary line keeping
  `accessibilityLiveRegion="polite"` + `accessibilityRole="text"`. When there are calendars,
  render the list as today.

## 8. Tests — correct the dead test + extend (disposition items 1, 10)

- [x] 8.1 Update `ui/user-calendars-screen.test.tsx` "reaches delete through the row's
  accessibility action": fire `accessibilityAction` on the **toggle element** (now
  `getByTestId(`user-calendar-row-…`)` = the toggle Pressable, or `getByRole("checkbox")`),
  not the old plain View — proving the action is on a reachable element. Adjust the toggle
  label assertions to the `userCalendars.rowLabel` output ("ENSEEIHT, Toulouse INP").
- [x] 8.2 Strengthen the cancel-path test: assert `alertSpy` was called, that the cancel
  button (`buttons[0]`) has `style: "cancel"`, and that it carries no `onPress`; keep the
  `remove` not-called assertion.
- [x] 8.3 Add a `Platform.OS === "android"` render test (`jest.spyOn` / set
  `Platform.OS`) covering the Android row shape: no swipe wrapper, the text delete affordance
  (`userCalendars.delete.action`) renders, the toggle + delete are reachable. This must RAISE
  screen coverage, not lower it.
- [x] 8.4 Add an empty-state gating assertion: before the read resolves (loaded false / no
  `updatedAt`) the empty state + live region do NOT render; once loaded-empty they do. Adjust
  the existing empty-state test's mock to supply the `loaded` signal.

## 9. Deferred handoffs (inbox — do NOT block the ship)

- [ ] 9.1 (HUMAN: see inbox/2026-07-05-user-calendars-device-pass-refine.md) The iOS swipe
  grammar/physics rework + the explicit iOS-gated toggle announce — device-verify then apply
  together. Written to the inbox; skip-and-continue.
- [ ] 9.2 (HUMAN: see inbox/2026-07-05-destructive-token-contrast.md) The designed
  `danger`/`error` token pair + the pink-text AA contrast fix (with the exact failing ratios)
  — token-layer/design-owned follow-up. Written to the inbox; skip-and-continue.

## 10. Architecture Book (R-1: the fix is encoded in code/tests above; the Book records it)

- [x] 10.1 Update `docs/mobile/architecture-book/features.md` (the "User calendars —
  management screen + visibility filter" entry): the add is now a **native header action**
  (`headerRight`, event-details pattern) and the per-row delete **accessibility action is
  carried by the row-level toggle Pressable** (a real accessibility element — the plain row
  View is not one on iOS); the checkbox merged the name/school into one toggle with a
  visibility hint and a checkmark-on-`primaryStrong` checked indicator; the empty state is
  gated on the read resolving; the read is memoized. Overwrite to describe the current state
  (no diff-speak).
- [x] 10.2 Append a dated entry to
  `docs/mobile/architecture-book/architecture-changelog.md` (newest last): the
  `refine-mobile-user-calendars-a11y-native` ship — the toggle-element-carries-the-a11y-action
  fix (the plain-View action was dead on iOS), the checkmark/`primaryStrong` indicator, the
  header add action, pressed states, the load-gated empty state, the memoized read; the two
  deferred buckets (device pass, token layer) inboxed; no new dep/schema/native change, ADR
  031 unchanged.
- [x] 10.3 No new ADR (ADR 031 stands — no load-bearing contract change). If implementation
  reveals a contract shift, stop and flag it before writing one.

## 11. Local verification (must be green)

- [x] 11.1 `npx tsc --noEmit` clean in `mobile/` (incl. FR/EN i18n key parity).
- [x] 11.2 `npm run lint` clean (`--max-warnings 0`) in `mobile/` — feature boundaries
  B-1..B-4, `no-nested-touchables` (toggle + delete are siblings, never nested),
  `i18next/no-literal-string` (the new `accessibilityHint`/labels are translated),
  import-order.
- [x] 11.3 `npm test -- --coverage` green in `mobile/` — the screen holds its 70% floor
  (the Android-shape test raises it), and events.ts / actions.ts stay at the 90% gate
  (their logic is untouched). CI runs `--coverage`; a plain `npm test` passes the gate blind
  — verify WITH `--coverage`.

## 12. CI proof + DoD

- [x] 12.1 The CI proof of the runtime-behavior fix is the corrected screen test: the delete
  accessibility action fired on the reachable toggle element (§8.1) — it now proves a handler
  AT can actually reach, where the old test proved a dead one. Plus the Android-shape render
  (§8.3) and the load-gated empty state (§8.4). No gesture simulation.
- [x] 12.2 Walk the DoD axes: a11y ✅ (reachable delete action, checkbox role + state +
  visibility hint, legible checked indicator both schemes, ≥48dp toggle target, pressed
  feedback, load-gated live region), i18n ✅ (FR+EN parity for the four new keys), native
  correctness ✅ (native header action, cross-platform checkmark/trash, R-3), observability ➖
  (unchanged — the write posture is already wired), coverage ✅. Device-only + token-layer
  axes are inboxed (§9), skip-and-continue.
