## Why

The just-merged "Mes calendriers" management screen (`add-mobile-user-calendars`, commit
`b3104f5`) shipped correct **data** wiring but a `/iterate-screen` native/rn/a11y panel
found the **presentation and accessibility contract is broken on device**: the row's delete
accessibility action is DEAD on iOS (it sits on a plain non-accessible `View`, which UIKit
never exposes as an element — all three reviewers verified this against installed RN 0.85.3
sources), the checked indicator renders black on pink in dark mode, no Pressable gives
pressed feedback, the add control is off-platform on both OSes, the empty state flashes and
can false-announce on entry, and the reactive read defeats the events-seam `useMemo` (ADR
031) it exists to feed. The screen's own test passes while the a11y feature is dead — it
fires the action on a node assistive tech can never reach. This refinement lands the panel's
verifiable fixes so the screen meets the Definition of Done it was merged short of.

## What Changes

- **CRUX — the row's delete accessibility action moves to a real accessibility element.**
  The leading checkbox `Pressable` and the name/school text merge into ONE row-level
  **toggle `Pressable`** (`accessibilityRole="checkbox"`, `accessibilityState={{ checked }}`,
  the merged "{name}, {school}" label); the delete `accessibilityActions` +
  `onAccessibilityAction` move onto THAT Pressable (an accessibility element AT can reach).
  Delete stays a **sibling** `Pressable` (no nested touchables); the parent row stays a
  plain non-touchable `View` (no `accessible={true}` — that would flatten the two-target
  design). The full-row toggle target clears Android's 48dp floor. The now-redundant text is
  hidden from AT (`importantForAccessibility`/`accessibilityElementsHidden`) so the name is
  not spoken three times per row.
- **The checked indicator becomes a checkmark on a `primaryStrong` fill** (iOS
  `SymbolView name="checkmark"`, Android `✓` `ThemedText`), tinted `onPrimary` — replacing
  the 12px dot whose `theme.background` knockout renders black-on-pink in dark mode. Uses the
  existing `onPrimary`-on-`primaryStrong` token pair (5.87:1); NO new token.
- **Pressed-state feedback** on the row toggle, delete, and the add action, via the shipped
  `school-row` pattern (`android_ripple` foreground + iOS `pressed` `backgroundSelected`).
- **An `accessibilityHint` on the toggle** ("Shows or hides this calendar" / "Affiche ou
  masque ce calendrier") — the only signal that checked means visible; state stays unbaked.
- **The add affordance moves into the native header** (`Stack.Screen options.headerRight`),
  a primary-tinted `smallBold` Pressable (the shipped event-details pattern) with a short
  visible label ("Add"/"Ajouter") and the long string kept as its `accessibilityLabel` —
  replacing the off-platform 1px-bordered top-left text button.
- **The empty state is gated on load and centered.** A `loaded` flag (from `useLiveQuery`'s
  `updatedAt`, undefined until the first async resolve) suppresses the empty state and its
  live region until the read resolves, so it neither flashes nor false-announces "no
  calendars" on entry; when shown it is a centered title + secondary line.
- **The reactive read is memoized.** `useUserCalendars()` returns
  `useMemo(() => data.map(rowToCalendar), [data])` so it stops handing a fresh array identity
  to the events-seam `useMemo` every render (the identity ADR 031's filter relies on).
- **Row title typography + i18n hygiene.** The title takes `school-row`'s body override (the
  `ThemedText` default reads as emphasis); the checkbox label moves to an i18n template
  `userCalendars.rowLabel`, the Android trash label gets a dedicated
  `userCalendars.delete.action` key (decoupled from the Alert confirm string), and a short
  `userCalendars.add.short` label serves the header action.
- **Tests are corrected and extended.** The a11y-action test fires on the toggle element
  (not the dead node); the cancel-path test asserts the `Alert` opened and the cancel button
  is `style: "cancel"` with no `onPress`; a `Platform.OS === "android"` render test covers
  the Android row shape (raising, not lowering, screen coverage).
- **NO new dependency, NO new Drizzle table, NO new migration.** This is a screen +
  hooks-memo + i18n + test refinement. Two panel findings are **deferred with recorded
  reasons** (design.md): the swipe grammar/physics + explicit iOS toggle announce (device-
  only-verifiable) and the destructive-red token + text-contrast fix (a design-system token
  decision spanning more than this screen).

## Capabilities

### New Capabilities

<!-- None — this refines the existing mobile-user-calendars capability. -->

### Modified Capabilities

- `mobile-user-calendars`: the per-row delete **accessibility action** now sits on the
  row-level toggle `Pressable` (a real accessibility element) rather than the plain row
  container; the visibility control is a **single row-level toggle** carrying the merged
  name/school label, a visibility `accessibilityHint`, and a checkmark-on-`primaryStrong`
  checked indicator; the add affordance is a **native header action**; the empty state is
  **gated on the read resolving**; the reactive read is **memoized**; and the automated tests
  assert the a11y action on a reachable element, the cancel branch, and the Android shape.

## Impact

- Modified: `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx` (the row
  restructure, checked indicator, pressed states, header add action, gated/centered empty
  state, typography) and its test `user-calendars-screen.test.tsx` (a11y action on the
  toggle, cancel-branch assertions, Android-shape render test).
- Modified: `mobile/src/features/calendar-sources/data/user-calendars/hooks.ts` (the
  `useMemo`) — `useUserCalendars` identity stability; the events-seam `useCalendarEvents`
  (`calendar/data/events.ts`) is the beneficiary, unchanged.
- Modified: `mobile/src/i18n/locales/{en,fr}.json` (new `userCalendars.rowLabel`,
  `userCalendars.visibilityHint`, `userCalendars.delete.action`, `userCalendars.add.short`).
- Docs: `docs/mobile/architecture-book/features.md` (the user-calendars entry — the header
  add action + the toggle-element-carries-the-a11y-action pattern) and
  `architecture-changelog.md` (a dated entry). **No new ADR** — ADR 031 stands (no
  load-bearing contract change; the visibility-filter-at-the-seam is unchanged).
- Two deferred findings inboxed under `docs/react-native-migration/inbox/` (the device-pass
  swipe + iOS-toggle-announce, and the destructive-token/contrast follow-up).
- **No new dependency, no new Drizzle table, no new migration, no native/`app.config.ts`/
  babel change.**
