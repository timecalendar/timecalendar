# User calendars ("Mes calendriers") — autonomous ship-loop prompt

The copy-this prompt that drives the **user-calendars management screen** to completion
autonomously. Launch with `/loop <paste the fenced block below>` (no interval — dynamic
self-pacing, since the ship is a long `/ship` pipeline wrapping a `/iterate-screen` device
loop). The block is self-orienting and idempotent: each wake it re-derives state from
`origin/main` + the OpenSpec archive, advances the ship, and re-fires until the exit
criteria are met.

**This ports the Flutter `user_calendars_screen`** (`app/lib/modules/calendar/screens/user_calendars_screen.dart`
+ `widgets/user_calendars_view/`) — the "Mes calendriers" list: per-calendar visibility
checkbox, delete, and an add affordance. It is a **parity gap**: Phase 03 shipped the durable
`user_calendars` token store (ADR 018) and its reactive read (`useUserCalendars()`) but
**deliberately shipped no list UI** ("no list UI ships this phase" — 03 exit criteria). This
ship is the missing management surface. It belongs in the Phase 07 (auxiliary features) parity
bucket but was never enumerated as a step there — this prompt is its home.

**Unlike the Phase-05 ships, this writes NO new irreplaceable data and adds NO schema:** the
whole data layer already exists (`repository.remove` / `repository.setVisible` / reactive
`useUserCalendars()`, all tested — `mobile/src/features/calendar-sources/data/user-calendars/`).
The one real *behavioral* change is that the visibility checkbox must filter events out of the
timeline. Everything else is a screen over an existing seam.

**Decisions baked in** (confirmed with the user 2026-07-05; the delete pattern decided by the
three-reviewer `/iterate-screen` panel — native / RN / a11y):

- **One ship** (not split) — profile entry + list + visibility toggle + timeline wiring +
  delete + add affordance, in one `/ship` PR.
- **Profile entry:** a new "Calendriers" / "Calendars" `Link` on the Profile screen
  (`mobile/src/app/(tabs)/profile.tsx`), same accessible-link shape as the existing
  Settings / onboarding / personal-events / hidden-events / notifications entries →
  `/user-calendars`.
- **Add affordance:** yes — a `+` control on the screen routes to school selection
  (`/onboarding/school`), Flutter-FAB parity. A second, in-context path to add a calendar
  (Profile's onboarding link stays too).
- **Visibility = timeline render-filter ONLY.** `visible: false` hides a calendar's events from
  the Home + Calendar views; it does **not** touch notifications (out of scope — a pure
  client-side render flag, matching Flutter's `visible`). Sync keeps fetching **all** calendars
  regardless of `visible` (tokens stay complete), so toggling is instant and reactive — the
  exact model hidden-events uses. **No re-sync on toggle.**
- **Delete pattern — PANEL-DECIDED: a visible trailing delete button per row (both platforms),
  confirm-gated by a native `Alert` (`style: "destructive"` on iOS), post-delete
  `AccessibilityInfo.announceForAccessibility`, failure surfaced via `WriteErrorNotice`.** This
  mirrors the house hide-chooser (`event-details-screen.tsx:77`, `jest.spyOn(Alert, "alert")`
  tested) and the `hidden-events` row grammar. Rationale the panel converged on: swipe-/long-
  press-only are exclusionary for screen-reader/motor users (WCAG 2.5.1) and **untestable under
  the 90% branch-coverage gate**; an undo-snackbar would *lie* because `remove()` is irreversible.
  Zero new dependencies, no schema change.
- **iOS swipe-to-delete IS in this ship** (iOS-only, the native reviewer's platform-pure reflex) —
  `ReanimatedSwipeable` trailing red action, gated by the SAME `Alert` (full-swipe opens the
  confirm rather than instant-commit, since delete is non-undoable), **and it MUST carry
  `accessibilityActions=[{name:"delete", label}]` + `onAccessibilityAction`** so it is not
  exclusionary (WCAG 2.5.1). The visible trailing delete button STAYS on both platforms as the
  discoverable, motor-accessible, machine-testable baseline; iOS adds swipe on top. Android gets NO
  swipe (Material: destructive swipe wants a real undo, which `remove()` can't give). Both the
  button, the swipe, and the accessibility action call ONE shared `confirmDelete(id, name)` handler
  — that handler + the `Alert`/`onAccessibilityAction` paths are unit-tested; only the raw gesture
  recognition is device-verified (it can't be simulated under jest-expo, so it must not gate
  coverage).
- **No undo.** Delete = `repository.remove(id)`; the visible-set filter hides the calendar's
  events immediately; orphaned `calendar_events` rows are reclaimed by the next drop+replace sync.
  Do NOT add a synchronous cross-feature purge of `calendar_events` (keeps delete a single-seam
  write; the filter already guarantees correctness). Optionally kick a background sync after
  delete for prompt DB cleanup.
- Human-only / device-only work is inboxed, never blocks the loop.

---

```
Autonomously ship the user-calendars management screen ("Mes calendriers") for the RN migration — the missing list UI over the durable user_calendars store from Phase 03. It ports the Flutter user_calendars_screen (app/lib/modules/calendar/screens/user_calendars_screen.dart + app/lib/modules/calendar/widgets/user_calendars_view/*). You are FULLY AUTONOMOUS — no human approval for any command (run simulators/emulators, tests, merge PRs, push, all of it). You CONDUCT; you do not write production code yourself — every unit of shippable work is delegated to sub-agents per the /ship pipeline, and the screen itself is driven to native quality via the /iterate-screen skill. Adhere to the Architecture Book (docs/mobile/architecture-book/architecture.md + topical files) and pass the full Definition of Done.

## THE thing that makes this ship different: it's a SCREEN over an EXISTING data layer — the one real behavioral change is the timeline filter
No new schema, no new migration, no new irreplaceable data. The user_calendars data layer already exists and is tested: mobile/src/features/calendar-sources/data/user-calendars/ — repository.remove(id), repository.setVisible(id, visible), and the reactive useUserCalendars() hook. DO NOT re-implement any of it. The single behavioral change is that the visibility checkbox must FILTER a calendar's events out of the Home + Calendar timeline. Get that seam right; the rest is a presentational screen mirroring the hidden-events sibling.

## The single wiring point — the visibility filter lives at useCalendarEvents
mobile/src/features/calendar/data/events.ts is THE single events-source seam that BOTH Home (home-screen.tsx) and Calendar (calendar-screen.tsx) read. It already filters hidden events (uid + name sets) — the visible-calendar filter is the identical shape, one more filter in the same useMemo. Rule: keep an event iff event.userCalendarId === undefined (personal events — always shown) OR the event's calendar is currently visible. Build the visible set from useUserCalendars() (a data→data cross-feature read — the SAME legitimate edge hidden-events already uses; the comment in events.ts blesses it): visibleIds = new Set(calendars.filter(c => c.visible).map(c => c.id)); keep iff userCalendarId === undefined || visibleIds.has(userCalendarId). A deleted calendar drops out of useUserCalendars(), so its id leaves the set and its events vanish immediately — correctness holds with NO calendar_events purge. This single change covers day/week/agenda AND home with no consumer change.

## The worklist — ONE ship (plan → apply → simplify → review-loop → archive → PR → wait-green → zero-touch merge)
Delegate every phase to the sub-agents (change-planner / change-implementer / change-simplifier / change-reviewer). Mine the Flutter parity first: user_calendars_screen.dart (list + FAB → school selection), widgets/user_calendars_view/user_calendar_list_item.dart (checkbox toggles visible; delete via swipe + long-press sheet, confirm-gated), calendar_action_menu.dart, and the provider providers/user_calendar_provider.dart (toggleVisibility / deleteCalendar just mutate + refresh — no re-sync).

Scope of the ship:
1. PROFILE ENTRY — a new "Calendriers"/"Calendars" Link on mobile/src/app/(tabs)/profile.tsx, same accessible-link shape (accessibilityRole="link", translated label, hitSlop, ≥44/48 target) as the existing entries → href="/user-calendars". i18n key profile.userCalendars.link (FR "Calendriers" / EN "Calendars").
2. ROUTE — mobile/src/app/user-calendars.tsx, a thin re-export of the screen (mirror mobile/src/app/hidden-events.tsx exactly — Stack.Screen title set inside the screen).
3. SCREEN — mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx, PRESENTATIONAL (70% floor test — mirror hidden-events-screen.tsx). Reads useUserCalendars(). Each row = a plain View (NOT a pressable — no-nested-touchables is an error rule) containing:
   - a leading visibility control: a Pressable with accessibilityRole="checkbox", accessibilityState={{ checked: visible }}, accessibilityLabel="{name}, {school}" (name + school in the LABEL, state in accessibilityState — never bake "visible/masqué" into the label), onPress → setVisible(id, !visible). The checked-state change announces for free; do NOT also announceForAccessibility on toggle.
   - the calendar name (title; fall back to a "Calendrier" placeholder if empty, Flutter parity) + the schoolName subtitle (fall back "Calendrier personnel" per Flutter).
   - a trailing delete button: a sibling Pressable, accessibilityRole="button", accessibilityLabel="Supprimer le calendrier {name}" (never a bare "Supprimer"), minHeight/minWidth 44 + hitSlop, trash icon via expo-symbols SymbolView (mirror school-selection/ui/status-symbol.tsx) → opens the confirm Alert.
   - Empty state (no calendars): themed textSecondary line with accessibilityLiveRegion="polite" + accessibilityRole="text" (the house contract — hidden-events-screen.tsx).
4. ADD AFFORDANCE — a "+" / "Add a calendar" control (a header action or a clearly-labelled button; the /iterate-screen native reviewer picks the platform-correct placement) → router.push("/onboarding/school"). accessibilityRole="button", translated label.
5. VISIBILITY WIRING — the useCalendarEvents filter described above (the one behavioral change). Extend events.ts's existing test to prove: a hidden (visible:false) calendar's synced events are excluded from day/week/agenda + home; personal events (userCalendarId undefined) are always kept; toggling back to visible re-includes them.
6. DELETE — a single shared confirmDelete(id, name) handler = Alert.alert(title, "Êtes-vous sûr de vouloir supprimer le calendrier {name} ?", [{text: Annuler, style: cancel}, {text: Supprimer, style: destructive, onPress: () => remove(id)}]); on success AccessibilityInfo.announceForAccessibility("{name} supprimé") (works both platforms — iOS has no accessibilityLiveRegion). THREE paths call it: (a) the visible trailing delete button (both platforms — the discoverable, motor-accessible, testable baseline); (b) iOS-ONLY swipe — wrap the row in ReanimatedSwipeable (react-native-gesture-handler ~2.31, already installed; the app is wrapped in GestureHandlerRootView at src/app/_layout.tsx) with a renderRightActions red panel (expo-symbols trash), full-swipe/open → confirmDelete (open the confirm, do NOT instant-commit — delete is non-undoable); gate it on Platform.OS === "ios"; (c) the row's accessibilityActions=[{name:"delete", label: t(...)}] + onAccessibilityAction → confirmDelete, so VoiceOver/TalkBack users reach delete without the gesture (WCAG 2.5.1 — REQUIRED for the swipe path to be non-exclusionary). Test the button press, the Alert confirm/cancel branches, and onAccessibilityAction by invoking the handler directly (jest.spyOn(Alert, "alert") + captured onPress) — the raw swipe gesture is device-verified only and must not gate the 90% branch coverage. The visible-set filter removes the deleted calendar's events immediately; do NOT synchronously purge calendar_events — orphans are reclaimed by the next drop+replace sync (optionally kick useSyncCalendars after delete for prompt cleanup — planner's call). NO undo snackbar (remove() is irreversible; a snackbar would lie).

Actions + observability: add a small observability-wrapped actions hook alongside the data layer (mirror useHideActions) that wraps setVisible + remove — a failed write is a crash-worthy local-persistence failure → @/firebase recordError, and exposes a `failed` flag the screen renders via WriteErrorNotice. A toggle-visibility read/filter is total/infallible. Every branch (toggle on/off, delete confirm/cancel, write-failure notice, empty state) is machine-coverable with jest.spyOn(Alert, "alert") + invoking the captured button onPress — hold the 90% branch gate honestly with NO gesture simulation.

## Drive the SCREEN to native quality with /iterate-screen (not just a build-and-merge)
Once the change is code-complete and green, run the /iterate-screen loop on user-calendars-screen.tsx: propose → the three persistent expert reviewers (native / rn / a11y) → consolidated fix pass → disposition re-review → the user's on-device pass (both platforms, both color schemes) → converge. The delete pattern is ALREADY panel-decided (visible trailing button + Alert) — do not relitigate it; the panel reviews EXECUTION (label correctness, target sizes, focus order, the checkbox+delete two-target row, the add-affordance placement, empty state, theming). The user's device is the only rendering truth.

## HUMAN-ONLY / DEVICE-ONLY items — inbox immediately, never block the loop
- Visual + a11y device pass of the screen on both platforms (VoiceOver/TalkBack row semantics, the post-delete focus landing — AccessibilityInfo.setAccessibilityFocus on the list header is the fix if it disorients — contrast, touch targets, Dynamic Type/font scaling). Write a docs/react-native-migration/inbox/ HUMAN note.
- DEVICE-VERIFY the iOS swipe-to-delete gesture (it's built in this ship but jest-expo can't simulate the pan): the swipe reveals the red trash action, full-swipe/open opens the confirm Alert (not instant-commit), it composes cleanly with vertical scroll and the leading checkbox, and VoiceOver reaches "Supprimer" via the row's accessibilityActions. Fold into the device-pass note above; if the native reviewer, once swipe is proven, judges the visible iOS trailing button redundant, hiding it on iOS is a device-pass decision (Android keeps it) — but keep it until swipe + accessibilityActions is device-confirmed.
- Any design-asset gap: ship a tasteful native-default version (R-3) and inbox a polish follow-up; do NOT stall.

## Per-iteration algorithm (this prompt re-fires each wake — be idempotent)
1. ORIENT: git fetch origin; check git log origin/main + openspec/changes/archive/ to see whether the ship already merged; read this doc.
2. If the ship is merged AND the screen has been through /iterate-screen to a clean device pass AND the inbox notes exist → verify EXIT CRITERIA (below), tick it in docs/react-native-migration/01-roadmap/07-auxiliary-features.md (add the enumerated step if missing), STOP the loop (no further wakeup), and report.
3. Otherwise advance the ship: if not yet code-complete/merged, run the full /ship pipeline (.claude/commands/ship.md) — delegate plan/apply/simplify/review to the sub-agents; you own only git/PR/merge. If merged but the screen hasn't been iterated to a clean device pass, run /iterate-screen next.
4. Ship invariants: reviewer is the sole merge gate (cap 3 review rounds, then inbox-escalate + leave the PR draft only if truly stuck); wait for GREEN with gh pr checks <pr> --watch before gh pr merge --squash --delete-branch (NEVER --auto — main is unprotected); do NOT add the run-e2e label (E2E runs on main only); optionally run Maestro LOCALLY via mobile/e2e/run_e2e.sh for confidence (add/toggle/delete a calendar, confirm a hidden calendar's events leave the timeline).
5. After a successful merge, schedule the next wakeup (dynamic /loop) to run the /iterate-screen device loop. After a genuine hard block you can't resolve, inbox it and continue rather than halting.

## EXIT CRITERIA
- Profile shows a "Calendriers"/"Calendars" entry → the user-calendars screen.
- The screen lists every held calendar with a visibility checkbox, name + school subtitle, a trailing delete button, an add ("+") path to school selection, and an empty state — all typed, lint-clean, unit/component-tested (70% presentational floor; the events.ts filter branch at the 90% gate), i18n FR/EN parity, a11y (roles/labels/state/announcements/targets).
- Toggling a calendar's checkbox off hides ITS events from BOTH Home and Calendar (and back on re-shows them); personal events always render; deleting a calendar removes it and its events immediately and persists across a relaunch.
- Full DoD on every machine-verifiable axis; the human device/visual/a11y axes inboxed. The Architecture Book updated (features.md entry for the user-calendars management surface; an ADR only if something load-bearing was decided, e.g. the visibility-filter-at-the-seam contract) + architecture-changelog.md appended.

## Guardrails
- DO NOT rebuild the data layer — remove/setVisible/useUserCalendars exist and are tested. This ship adds a SCREEN + a filter + a profile link, nothing in data/user-calendars/ except the observability-wrapped actions hook.
- The delete pattern is decided (visible trailing button + Alert, both platforms; iOS swipe deferred+inboxed). Don't reopen it; the panel gates execution only.
- No new dependency, no new Drizzle table, no new migration. If the planner thinks any is needed, STOP and surface it — it means the scope was misread.
- Report faithfully at merge: change name, PR link, merge SHA, inbox handoffs, what's next. If CI is red, a branch is untested, or a step was skipped, say so plainly.
- Delegate, don't code. Sub-agents do the shippable work; /iterate-screen drives the screen; you conduct.
```
