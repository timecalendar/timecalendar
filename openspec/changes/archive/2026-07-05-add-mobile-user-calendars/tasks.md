# Tasks — User calendars ("Mes calendriers")

All paths are under `mobile/` unless noted. Run the gates
(`npx tsc --noEmit`, `npm run lint`, `npm test -- --coverage`) in `mobile/` after each
implementation group. **Do NOT re-implement the data layer** — `remove` / `setVisible` /
`useUserCalendars` already exist and are tested; this ship adds only the actions hook, the
screen, the events-seam filter, and a Profile link.

## 1. Parity mining (do first — confirm before coding)

- [x] 1.1 Re-read the Flutter parity to confirm behavior before coding:
  `app/lib/modules/calendar/screens/user_calendars_screen.dart` (list + FAB → school
  selection), `app/lib/modules/calendar/widgets/user_calendars_view/user_calendar_list_item.dart`
  (checkbox toggles `visible`; name/`Calendrier` + school/`Calendrier personnel` fallbacks;
  delete via swipe + long-press sheet, confirm-gated), `.../calendar_action_menu.dart`, and
  `app/lib/modules/calendar/providers/user_calendar_provider.dart` (`toggleVisibility` /
  `deleteCalendar` just mutate + refresh — NO re-sync). Confirm: visibility is render-only,
  delete is confirm-gated + non-undoable, add routes to school selection.

## 2. The observability-wrapped actions hook (data layer) — 90%-gated

- [x] 2.1 Create `src/features/calendar-sources/data/user-calendars/actions.ts`:
  `useUserCalendarActions()` returning `{ setVisible(id, visible), remove(id), failed }`,
  each mutator wrapped with `useRecordedAction("user-calendars")` (the shared write
  controller — `@/hooks/use-recorded-action`) over the existing repository `setVisible` /
  `remove`. Use the async `run(action, () => promise): Promise<boolean>` overload (the
  repository writes are `Promise<void>`). Mirror `hidden-events/data/hooks.ts`
  `useHideActions`. Import the repository from `./repository` (the data sublayer), never
  `@/db` directly.
- [x] 2.2 Re-export `useUserCalendarActions` through the sublayer barrel
  `data/user-calendars/index.ts`, the `data/index.ts` sub-barrel, and the feature barrel
  `index.ts` (no cycle — B-2).
- [x] 2.3 Test `data/user-calendars/actions.test.ts` (90% gate): each mutator's success
  branch (calls the repository, resolves `true`, `failed` stays/returns false) and its
  failure branch (a rejecting repository → `recordUnknownError` called with
  `"user-calendars/<action>"`, resolves `false`, `failed` becomes true); a success after a
  failure clears `failed`. Mock the repository + `@/firebase` (mirror the hidden-events
  actions test posture).

## 3. The visibility filter at the events-source seam — the one behavioral change (90%-gated)

- [x] 3.1 In `src/features/calendar/data/events.ts` `useCalendarEvents(range)`: read
  `useUserCalendars()` (import from `@/features/calendar-sources/data` — the same
  legitimate `data → data` cross-feature edge the hidden-events filter uses; extend the
  existing blessing comment). Build `visibleIds = new Set(calendars.filter(c => c.visible).map(c => c.id))`
  and keep a merged event iff `event.userCalendarId === undefined || visibleIds.has(event.userCalendarId)`,
  applied on the merged list alongside the existing hidden filter, before the range filter.
  Keep the seam signature + `CalendarEvent` shape unchanged; add `calendars` to the
  `useMemo` deps.
- [x] 3.2 Extend `src/features/calendar/data/events.test.ts` (the filter branch is at the
  90% gate): mock `useUserCalendars` (a new `jest.mock("@/features/calendar-sources/data")`)
  and prove — a hidden (`visible:false`) calendar's synced events are excluded; a visible
  calendar's events are kept; a personal event (`userCalendarId: undefined`) is always kept
  regardless of any calendar's visibility; toggling a calendar back to `visible:true`
  re-includes its events; an event whose `userCalendarId` matches no known calendar is
  excluded (a deleted calendar — it left the set). Keep the existing hidden-filter +
  range-filter assertions green.

## 4. The management screen (presentational) — 70% floor

- [x] 4.1 Create `src/features/calendar-sources/ui/user-calendars-screen.tsx`
  (presentational; mirror `hidden-events/ui/hidden-events-screen.tsx`): a `ThemedView` +
  `SafeAreaView`, `<Stack.Screen options={{ title: t("userCalendars.title") }}>` (title set
  INSIDE the screen), the `WriteErrorNotice` (driven by `useUserCalendarActions().failed`),
  an accessible empty state (polite live region + `text` role) when the list is empty, and
  a scrolling list of rows otherwise. Themed from `@/theme` (R-3).
- [x] 4.2 Each row is a plain `View` (NOT a `Pressable` — `no-nested-touchables` is an error
  rule) containing: (a) a leading visibility `Pressable`,
  `accessibilityRole="checkbox"`, `accessibilityState={{ checked: visible }}`,
  `accessibilityLabel="{name}, {school}"` (state NOT in the label), `hitSlop`, ≥44 target,
  `onPress` → `setVisible(id, !visible)` (do NOT `announceForAccessibility`); (b) the name
  title (fallback "Calendrier") + the school subtitle (fallback "Calendrier personnel");
  (c) a trailing delete `Pressable`, `accessibilityRole="button"`,
  `accessibilityLabel={t("userCalendars.delete.label", { name })}`, `minHeight`/`minWidth`
  44 + `hitSlop`, rendering the cross-platform trash affordance — iOS
  `SymbolView name="trash"` (mirror `school-selection/ui/status-symbol.tsx`), Android a
  themed destructive text label ("Supprimer") (NO new dep, no blank Android button) — →
  `confirmDelete(id, name)`.
- [x] 4.3 The shared `confirmDelete(id, name)` handler: `Alert.alert(t("userCalendars.delete.title"),
  t("userCalendars.delete.message", { name }), [{ text: t("common.cancel"), style: "cancel" },
  { text: t("userCalendars.delete.confirm"), style: "destructive", onPress: async () => {
  if (await remove(id)) AccessibilityInfo.announceForAccessibility(t("userCalendars.deleted", { name })) } }])`.
  Reuse a `common.cancel` key if one exists; else add it. (Optionally kick
  `useSyncCalendars().sync()` after a successful delete for prompt DB cleanup — planner's
  discretion; correctness does not require it.)
- [x] 4.4 Add the row's `accessibilityActions=[{ name: "delete", label: t("userCalendars.delete.label", { name }) }]`
  + `onAccessibilityAction` (dispatch `"delete"` → `confirmDelete(id, name)`) so VoiceOver/
  TalkBack reach delete without the gesture (WCAG 2.5.1 — required for the iOS swipe to be
  non-exclusionary).
- [x] 4.5 iOS-only swipe: wrap the row in `ReanimatedSwipeable`
  (`react-native-gesture-handler/ReanimatedSwipeable`, already installed; app already in
  `GestureHandlerRootView` at `_layout.tsx`) with a `renderRightActions` red trash panel,
  full-swipe/open → `confirmDelete` (OPEN the confirm, do NOT instant-commit). Gate on
  `Platform.OS === "ios"`; Android renders the bare row (no swipe).
- [x] 4.6 The add affordance: a "+" / "Ajouter un calendrier" control (header action or a
  clearly-labelled button — the `/iterate-screen` panel picks placement),
  `accessibilityRole="button"`, `accessibilityLabel={t("userCalendars.add")}`, →
  `router.push("/onboarding/school")`.
- [x] 4.7 Create `ui/index.ts` re-export (extend the existing one) and wire the screen into
  the feature barrel `index.ts` (B-2, no cycle).
- [x] 4.8 Test `ui/user-calendars-screen.test.tsx` (70% floor; mock
  `@/features/calendar-sources/data` for `useUserCalendars` + `useUserCalendarActions`,
  `jest.spyOn(Alert, "alert")`): the list renders rows with name/school + fallbacks; the
  empty state renders; the checkbox press calls `setVisible(id, !visible)`; the delete
  button opens the `Alert` and invoking the captured confirm `onPress` calls `remove` +
  `AccessibilityInfo.announceForAccessibility` while the cancel `onPress` does not;
  `onAccessibilityAction` with `"delete"` opens the same confirm; the `failed` flag renders
  `WriteErrorNotice`. Do NOT simulate the swipe pan (device-only).

## 5. The route + the Profile entry

- [x] 5.1 Create the thin route `src/app/user-calendars.tsx` re-exporting the screen through
  the `ui/` sub-barrel (mirror `src/app/hidden-events.tsx` — a one-line
  `export { UserCalendarsScreen as default } from "@/features/calendar-sources/ui"`).
- [x] 5.2 Register it in `src/app/_layout.tsx` as a `<Stack.Screen name="user-calendars" />`
  sibling of `(tabs)` (deep-linkable `timecalendar-dev://user-calendars`).
- [x] 5.3 Add a Profile-tab entry link in `src/app/(tabs)/profile.tsx`:
  `<Link href="/user-calendars" asChild>` with the same accessible-link shape as the
  existing entries (`accessibilityRole="link"`, `accessibilityLabel={t("profile.userCalendars.link")}`,
  `hitSlop={Spacing.two}`, `styles.settingsLink`), beside the hidden-events / notifications
  entries.

## 6. i18n (flat typed keys, FR + EN parity)

- [x] 6.1 Add flat keys to BOTH `src/i18n/locales/en.json` and `fr.json` (tsc parity fails
  otherwise): `profile.userCalendars.link` (FR "Calendriers" / EN "Calendars"),
  `userCalendars.title` (FR "Mes calendriers"), `userCalendars.empty` (FR "Aucun calendrier
  importé."), `userCalendars.namePlaceholder` (FR "Calendrier"),
  `userCalendars.personalSubtitle` (FR "Calendrier personnel"), `userCalendars.add`
  (FR "Ajouter un calendrier"), `userCalendars.delete.label` (FR "Supprimer le calendrier
  {{name}}"), `userCalendars.delete.title` (FR "Confirmer la suppression"),
  `userCalendars.delete.message` (FR "Êtes-vous sûr de vouloir supprimer le calendrier
  {{name}} ?"), `userCalendars.delete.confirm` (FR "Supprimer"), `userCalendars.deleted`
  (FR "{{name}} supprimé"), `userCalendars.error` (FR the write-error message), and
  `common.cancel` (FR "Annuler") if not already present. FR copy mirrors the Flutter strings.

## 7. E2E + docs (Architecture Book)

- [x] 7.1 Add `.maestro/user-calendars.yaml`: deep-link the management route + assert it
  renders (empty state, since no seeded calendars — record the seeded-data limitation in the
  file, same posture as the calendar/home/hidden-events flows); assert reachability from
  Profile. Do NOT add the `run-e2e` label (E2E runs on main only).
- [x] 7.2 Write the new ADR (next free number — **031** at time of writing) at
  `docs/mobile/architecture-book/decisions/031-user-calendar-visibility-filter-at-seam.md`
  (copy `TEMPLATE.md`): the **visibility-filter-at-the-events-source-seam** contract — what
  `visible` means system-wide (render-only, not a sync gate, not notifications), why the
  filter lives at `useCalendarEvents` (one seam covers day/week/agenda + home), and why
  delete needs **no `calendar_events` purge** (the deleted calendar leaves the visible set;
  the render-filter makes `user_calendars` the single source of truth for "what shows").
  Include Context / Decision / Consequences / Revisit-if and the alternatives from design.md
  (§Decision 1). Add its row to `decisions/README.md` (the index table).
- [x] 7.3 Update `docs/mobile/architecture-book/features.md`: a new "User calendars —
  management screen + visibility filter" subsection under the Calendar sources cluster (the
  screen, the actions hook, the seam filter, the delete pattern, the Profile entry, the
  Observability ✅ posture, CI-vs-device split). Update `calendar.md` (the events-source seam
  now ALSO filters by calendar visibility; link ADR 031). Note the new `recordError` context
  `"user-calendars/<action>"` in `firebase.md` if worth listing.
- [x] 7.4 Append a dated entry to `docs/mobile/architecture-book/architecture-changelog.md`
  (newest last): the `add-mobile-user-calendars` ship — the management screen over the
  existing data layer, the visibility-filter-at-the-seam (ADR 031), the panel-decided delete
  pattern (button + Alert both platforms, iOS swipe + accessibilityActions), the actions
  hook, no new dep/native/schema change.

## 8. Local verification (must be green)

- [x] 8.1 `npx tsc --noEmit` clean in `mobile/` (incl. FR/EN i18n key parity).
- [x] 8.2 `npm run lint` clean (`--max-warnings 0`) in `mobile/` — incl. feature boundaries
  B-1..B-4 (the `data → data` calendar → calendar-sources edge is allowed; no seam imported
  from `ui/`; no `@/db`/`@/storage`/generated-client import outside `data/`),
  `no-nested-touchables`, no-hardcoded-strings, a11y, import-order.
- [x] 8.3 `npm test -- --coverage` green in `mobile/` — the actions hook + the events.ts
  filter branch clear the 90% gate; the screen meets the 70% floor. (CI runs
  `--coverage`; a plain `npm test` passes the gate blind — verify WITH `--coverage`.)

## 9. CI proof + DoD

- [x] 9.1 Confirm the CI proof obligations are covered by §2.3/§3.2/§4.8: the actions hook
  success + failure-record branches, the visibility filter (hidden/visible/personal/
  toggle-back/deleted-drops-out), and the screen's toggle + delete-confirm/cancel +
  accessibility-action + write-failure-notice + empty-state branches — all machine-covered
  with NO gesture simulation. The events.ts filter is the runtime-behavior CI proof
  (mirroring the hidden-events filter proof).
- [x] 9.2 Walk the Definition of Done axes: Observability ✅ (write → `recordError`; read
  N/A), i18n (FR+EN parity), a11y (checkbox role + state, delete button label, add-button
  label, accessibility action, post-delete announce, ≥44/48 targets, live-region error +
  empty), native correctness (R-3 — native `Alert` confirm, iOS swipe, cross-platform trash
  affordance), coverage. No third state — each axis ✅ or ➖ + reason.
- [x] 9.3 The device-only / human-only checks are inboxed and DO NOT block the ship (skip
  and continue): the on-device visual + a11y pass (both platforms, both color schemes —
  VoiceOver/TalkBack row semantics, the two-target checkbox+delete row focus order, the
  post-delete focus landing, contrast, targets, Dynamic Type) and the iOS swipe-to-delete
  gesture device-verify (swipe reveals the red trash, full-swipe/open opens the confirm not
  instant-commit, composes with vertical scroll + the leading checkbox, VoiceOver reaches
  "Supprimer" via `accessibilityActions`). See
  `docs/react-native-migration/inbox/2026-07-05-user-calendars-device-pass.md` (HUMAN).
