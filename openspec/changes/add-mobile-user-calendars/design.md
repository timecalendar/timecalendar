## Context

Phase 03 landed the durable `user_calendars` token store (ADR 018) with a full, tested
data layer — `repository.remove(id)`, `repository.setVisible(id, visible)`, and the
reactive `useUserCalendars()` — but shipped **no list UI**. The Flutter
`user_calendars_screen` ("Mes calendriers") is the missing surface: a per-calendar
visibility checkbox, a delete, and an add affordance (a FAB → school selection). This
change is a **screen over an existing seam**, plus **one** behavioral change: the
visibility flag must filter a calendar's events out of the timeline.

Constraints (binding, from the ship spec + the Architecture Book):

- **No new schema, no new migration, no new dependency, no native/`app.config.ts`/babel
  change.** `react-native-gesture-handler ~2.31` (the iOS swipe) is already installed and
  the app is already wrapped in `GestureHandlerRootView` at `src/app/_layout.tsx`. If any
  of these turn out to be needed, the scope was misread — stop and escalate.
- **Do not re-implement the data layer.** This change adds a `ui/` sublayer, one
  observability-wrapped actions hook alongside the data layer, one events-seam filter, and
  a Profile link — nothing else in `data/user-calendars/`.
- The delete pattern is **panel-decided** (the `/iterate-screen` native/rn/a11y panel) and
  is not reopened here; the panel gates execution (labels, targets, focus order) only.

The nearest exemplar is the `hidden-events` sibling (Phase 05 Ship A): a management screen
that reads a reactive set, filters at the same events-source seam, wraps its writes in an
observability hook, and surfaces failures with `WriteErrorNotice`. This change copies its
altitude and rigor.

## Goals / Non-Goals

**Goals:**

- A reachable "Mes calendriers" management screen: list every held calendar, toggle its
  visibility, delete it (confirm-gated, no undo), add another.
- `visible: false` hides that calendar's events from **both** Home and Calendar (day/week/
  agenda) and back on re-shows them; personal events always render; a deleted calendar's
  events vanish immediately and stay gone across a relaunch.
- Full DoD on every machine-verifiable axis (i18n FR/EN parity, a11y roles/labels/state/
  announcements/targets, observability, coverage — the events filter branch at the 90%
  gate, the presentational screen at the 70% floor).

**Non-Goals:**

- **Notifications.** Visibility is a pure client-side render flag; it does not touch the
  notification-subscription `calendarIds` (which still reflects the held rows). Out of
  scope, matching Flutter's `visible`.
- **Sync gating.** Sync keeps fetching **all** held calendars regardless of `visible`
  (tokens stay complete); toggling is instant and reactive with no re-sync.
- **A `calendar_events` purge on delete.** No synchronous cross-feature purge; orphaned
  rows are reclaimed by the next drop+replace sync (see Decision 1).
- **Undo.** `remove()` is irreversible; no undo snackbar (it would lie).
- **New editing of calendar identity** (rename, re-tokenize) — out of scope; the screen
  reads name/school from the store.

## Decisions

### Decision 1 — Visibility is a render-filter at the single events-source seam; delete needs no `calendar_events` purge (the load-bearing, ADR-worthy call)

`visible` means exactly one thing: **whether a calendar's events render in the timeline**.
It is enforced in exactly one place — `useCalendarEvents(range)` in
`calendar/data/events.ts`, the single seam both Home (`home-screen.tsx`) and Calendar
(`calendar-screen.tsx`) read. That seam already filters hidden events (uid/name sets) in a
`useMemo`; the visibility filter is one more filter of the identical shape:

```
const visibleIds = new Set(
  calendars.filter((c) => c.visible).map((c) => c.id),
)
// keep iff personal (always) OR its calendar is currently visible
event.userCalendarId === undefined || visibleIds.has(event.userCalendarId)
```

`calendars` comes from `useUserCalendars()` — a **data → data cross-feature read**, the
same legitimate edge the hidden-events filter and the home/notifications selectors already
use (`events.ts` carries a blessing comment for exactly this). It runs on the **merged**
synced+personal list, before the range filter, behind the unchanged seam signature and
`CalendarEvent` shape — so day/week, agenda, and home all honor visibility with **no
consumer change**.

The load-bearing consequence: **a deleted calendar drops out of `useUserCalendars()`**, so
its id leaves the visible set and its events vanish immediately — correctness holds with
**no `calendar_events` purge**. Delete stays a single-seam write (`repository.remove(id)`);
the orphaned `calendar_events` rows are reclaimed by the next drop+replace sync (which
fetches only the still-held tokens). Optionally the screen may kick a background
`useSyncCalendars().sync()` after a delete for prompt DB cleanup — a nicety, not a
correctness requirement.

**Alternatives considered:**

- *Filter by matching the visible set against `calendar_events` at the sync layer / a
  synchronous purge of `calendar_events` on delete.* Rejected: it makes delete a two-seam
  cross-feature write (calendar-sources → calendar), duplicates the source-of-truth
  (`user_calendars` already is it), and risks a partial write leaving orphans **visible**.
  The render-filter makes the `user_calendars` table the single source of truth for "what
  shows"; a missing row = nothing shows, no matter what stale `calendar_events` remain.
- *A sync gate (don't fetch a hidden calendar).* Rejected: it would make toggling slow
  (a re-sync) and lose the complete token set; Flutter's `visible` is render-only.
- *A separate `visibleCalendarIds` store.* Rejected: `visible` already exists on the
  `user_calendars` row (ADR 018) and `setVisible` is already tested — a second store would
  be a redundant, drift-prone source of truth.

This is the ADR candidate (flagged in ADR_NOTES): it establishes what `visible` means
system-wide and why delete requires no cross-feature purge. The apply step writes it as a
new ADR (next free number, 031) and links `calendar.md` / `events.ts` to it.

### Decision 2 — The screen lives in `calendar-sources/ui/`, the actions hook alongside the data layer — no new feature folder

The "your calendars" concern is already owned by `src/features/calendar-sources/` (the
Phase-03 data layer lives at `data/user-calendars/`; the hooks doc even names "a later
'your calendars' ship" as the screen consumer). So the screen is a new `ui/` sublayer file
(`ui/user-calendars-screen.tsx`, re-exported through `ui/index.ts` and the feature barrel),
and the observability-wrapped actions hook is `data/user-calendars/actions.ts`
(re-exported through the `data/user-calendars/` + `data/` + feature barrels). No new
feature folder — the ship grows the cluster in place (the ADR-017 growth-in-place
precedent the calendar-sources ships already established). The feature-module boundaries
(B-1..B-4) hold: the screen imports the data seam, never `@/db`/`@/storage`/the generated
client directly; the barrels have no cycle.

### Decision 3 — Delete: a visible trailing button on both platforms + a native `Alert` confirm + announce + `WriteErrorNotice`; iOS swipe on top, reachable via `accessibilityActions`; no undo

Panel-decided (do not reopen). One shared `confirmDelete(id, name)` handler:

```
Alert.alert(
  t("userCalendars.delete.title"),
  t("userCalendars.delete.message", { name }),
  [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("userCalendars.delete.confirm"), style: "destructive",
      onPress: () => { if (remove(id)) AccessibilityInfo.announceForAccessibility(t("userCalendars.deleted", { name })) } },
  ],
)
```

Three paths call it:

- **(a) The visible trailing delete button** — a sibling `Pressable` in the row (both
  platforms), `accessibilityRole="button"`, `accessibilityLabel` = the full
  "Supprimer le calendrier {name}" (never a bare "Supprimer"), `minHeight`/`minWidth` 44 +
  `hitSlop`. The discoverable, motor-accessible, machine-testable baseline.
- **(b) iOS-only swipe** — the row wrapped in `ReanimatedSwipeable`
  (`react-native-gesture-handler`, already installed) with a `renderRightActions` red panel
  (trash), full-swipe/open → `confirmDelete` (open the confirm, do **not** instant-commit —
  delete is non-undoable). Gated on `Platform.OS === "ios"`. Android gets **no** swipe
  (Material's destructive swipe wants a real undo, which `remove()` can't give).
- **(c) The row's `accessibilityActions=[{ name: "delete", label }]` +
  `onAccessibilityAction`** → `confirmDelete`, so VoiceOver/TalkBack reach delete without
  the gesture (WCAG 2.5.1 — this is what makes the swipe path non-exclusionary).

On success, `AccessibilityInfo.announceForAccessibility` (works on both platforms — iOS has
no `accessibilityLiveRegion`). **No undo.** The visible-set filter (Decision 1) removes the
deleted calendar's events immediately.

**Testability:** the button press, the `Alert` confirm/cancel branches, and
`onAccessibilityAction` are unit-tested by `jest.spyOn(Alert, "alert")` + invoking the
captured button `onPress` directly — the raw swipe pan **cannot** be simulated under
jest-expo, so it must **not** gate the 90% coverage; it is device-verified only (inboxed).

**Alternatives considered:** swipe-only / long-press-only (Flutter's pattern) — rejected as
exclusionary for screen-reader/motor users and untestable under the coverage gate; an
undo-snackbar — rejected because `remove()` is irreversible (a snackbar would lie).

### Decision 4 — The visibility toggle is a checkbox with state-in-`accessibilityState`, not in the label

The leading control is a `Pressable`, `accessibilityRole="checkbox"`,
`accessibilityState={{ checked: visible }}`, `accessibilityLabel="{name}, {school}"` (name
+ school in the LABEL; the visible/hidden **state** lives in `accessibilityState`, never
baked into the label — the a11y house contract). `onPress` → `setVisible(id, !visible)`. Do
**not** `announceForAccessibility` on toggle — the `checked`-state change announces for
free. The name falls back to a "Calendrier" placeholder when empty and the subtitle to
"Calendrier personnel" when there is no `schoolName` (Flutter parity —
`user_calendar_list_item.dart`).

### Decision 5 — `useUserCalendarActions`: an observability-wrapped write hook mirroring `useHideActions`

`data/user-calendars/actions.ts` exposes `useUserCalendarActions()` returning
`{ setVisible(id, visible), remove(id), failed }` — each mutator wrapped with
`useRecordedAction("user-calendars")` (the shared write controller). The repository
`setVisible`/`remove` are **async** (`Promise<void>`), so the hook uses the async
`run(action, () => promise): Promise<boolean>` overload; the screen's `confirmDelete` gates
its success announce on the resolved boolean. A failed write → `@/firebase`
`recordError(error, "user-calendars/<action>")` + the `failed` flag rendered via
`WriteErrorNotice` (a local-persistence write with no server backup is crash-worthy — the
personal-events / hidden-events posture). The visibility **read/filter** is total/
infallible (a missing row = the calendar simply isn't in the visible set) and is **not**
recorded.

### Decision 6 — The trailing trash affordance is cross-platform, not iOS-only

`expo-symbols` `SymbolView` renders **only on iOS** (the house `StatusSymbol` returns
`null` on Android; `@expo/vector-icons` is **not** a dependency and none may be added). A
blank Android delete button is unacceptable. Resolution: on iOS render
`SymbolView name="trash"` (mirroring `status-symbol.tsx`); on Android render a themed text
label ("Supprimer") in the destructive/`primary` color — no new dependency, no blank
button, and the accessible name is the full "Supprimer le calendrier {name}" on both. The
`/iterate-screen` panel refines the exact placement/weight; this is the concrete default so
the screen is never shipped blank on Android.

### Decision 7 — The add affordance routes to school selection

A "+" / "Ajouter un calendrier" control (a header action or a clearly-labelled button —
the `/iterate-screen` native reviewer picks the platform-correct placement) does
`router.push("/onboarding/school")` (Flutter FAB parity). `accessibilityRole="button"`,
translated label. The Profile onboarding link stays as the second add path.

## Risks / Trade-offs

- **[Orphaned `calendar_events` rows persist between a delete and the next sync]** → They
  are invisible (Decision 1's filter drops them) and reclaimed by the next drop+replace
  sync; the optional post-delete `sync()` shortens the window. Acceptable: correctness is
  never affected, only transient disk use.
- **[The iOS swipe gesture is not covered by automated tests]** → jest-expo cannot simulate
  the pan; the button + `Alert` + `accessibilityActions` paths that share `confirmDelete`
  ARE unit-tested, so the delete logic is fully covered. The raw gesture recognition (swipe
  reveals the red action, full-swipe opens the confirm, composes with vertical scroll +
  the leading checkbox, VoiceOver reaches "Supprimer") is inboxed for a device pass.
- **[Two touch targets in one row — checkbox + delete]** → Both are ≥44/48 with `hitSlop`;
  the row itself is a plain `View` (NOT a `Pressable` — `no-nested-touchables` is an error
  rule), so the two controls never nest. The `/iterate-screen` panel verifies focus order
  and target spacing on device.
- **[Post-delete focus landing may disorient a screen-reader user]** → Inboxed for the
  device pass; if it disorients, `AccessibilityInfo.setAccessibilityFocus` on the list
  header is the fix (recorded in the inbox note, not pre-implemented).

## Migration Plan

Pure additive feature work — no data migration, no rollback concern (no schema/store
change). Deploy is the normal squash-merge → the next EAS build. The visibility filter is
backward-compatible: every existing `user_calendars` row already has `visible: true` (the
column default since ADR 018 / the second migration), so before any toggle every calendar
shows exactly as today.

## Open Questions

None blocking. The only device-only unknowns (post-delete focus landing, the iOS swipe
gesture feel, the on-device VoiceOver/TalkBack row semantics, contrast/target/Dynamic-Type
on both platforms and both color schemes) are inboxed for the human device pass and do not
block the machine-verifiable ship.
