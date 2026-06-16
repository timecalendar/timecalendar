# Hidden events: hide / un-hide synced events by uid or by name, persisted durably and filtered at the events-source seam

## Why

Phase 05 Ship A — **Hidden events**, full parity with the Flutter `hidden_event`
module. A student often wants a recurring class (or one instance of it) gone from
their timetable. Flutter lets the user hide a synced event **by this instance**
(`uidHiddenEvents`) or **by name** (`namedHiddenEvents`, all events sharing a title —
e.g. a weekly lecture), persists the hidden set locally, and filters those events out
of every view (`EventsForViewNotifier`); a hidden-events screen un-hides them.

The hidden set is part of the Phase-09 importer's **IRREPLACEABLE** set — there is no
server backup. Lose it on the device and the user re-hides everything by hand. So the
store MUST mirror the Flutter wire format **verbatim** for importer fidelity (the
[ADR 011](../../../.claude/rules/mobile/decisions/011-personal-event-storage.md) /
[018](../../../.claude/rules/mobile/decisions/018-user-calendar-storage.md) /
[021](../../../.claude/rules/mobile/decisions/021-calendar-event-storage-and-sync.md)
posture), every write path must be correct and tested (write/read-back + a
restart-simulation), and a failed write is a crash-worthy local-persistence failure.

The Flutter wire format (read from the code, not guessed —
`app/lib/modules/hidden_event/`): a **single sembast record** in store
`hidden_events` = `{ uidHiddenEvents: String[], namedHiddenEvents: String[] }`,
**default-empty when the record is absent**. The filter
(`calendar/providers/events_provider.dart` `EventsForViewNotifier`):
`!uidHiddenEvents.contains(event.uid) && !namedHiddenEvents.contains(event.title)`,
applied to the **combined** events list. The hide **action** (the event-details
header overflow menu) is offered **only for `EventKind.Calendar`** (synced) events —
you do not hide your own personal events — and opens a radio dialog: "hide this event"
(uid) vs "hide all events of the same name" (named).

## What Changes

- **A new `src/features/hidden-events/` feature folder** (`data/` + `ui/`), the home
  of the hide/un-hide concern (named for the concern, ADR-014 layered pattern).
- **A `data/` store over the `@/storage` MMKV seam** holding the single flat blob
  `{ uidHiddenEvents: string[], namedHiddenEvents: string[] }` under **one** flat key
  `hiddenEvents.set` (a JSON-encoded record, mirroring the school-selection
  `groupValues` JSON-array-over-one-key precedent): a **total defensive parser** (an
  unset / corrupt / legacy value → the empty set, never throws), one imperative write
  path (`hideByUid` / `hideByName` / `unhideUid` / `unhideName`), and a reactive read
  (`useHiddenEvents()`) over the seam's `useStoredString`. **Storage-backend decision
  (MMKV, not Drizzle) recorded as a new ADR** — see design + ADR 023.
- **The events-source seam absorbs the filter** — `useCalendarEvents(range)`
  (`calendar/data/events.ts`) reads `useHiddenEvents()` and filters out any event whose
  `id` (uid) is in the uid set OR whose `title` is in the named set, **after** the
  merge, **before** the range filter — covering day/week/agenda AND home with **no
  consumer change** (the seam was designed to absorb exactly this). The filter applies
  to the merged list (Flutter parity: a hidden *name* can also match a same-titled
  personal event), while the hide *action* is gated to synced events.
- **The hide action on the read-only event-details screen** — the screen gains a
  header overflow menu (only for a **synced** event, i.e. one carrying a
  `userCalendarId`) opening a native-default "Hide event" surface with the two radio
  options (hide this instance / hide all of this name), each a translated accessible
  control. If the viewed event is **currently hidden**, the surface instead offers
  **un-hide** (never a one-way trap from the details screen).
- **A hidden-events management screen** (`ui/hidden-events-screen.tsx`) + a thin route
  (`src/app/hidden-events.tsx`, a `Stack` sibling of `(tabs)`) reached from a Profile
  entry link — lists the named-hidden titles and the uid-hidden events (resolving each
  uid to its title via the synced events), each with an un-hide control. Empty state
  when nothing is hidden. This ships in THIS change (un-hide must be reachable for
  hide-by-name, which has no per-event details surface).
- **Observability ✅** — a failed hidden-set write records through `@/firebase`
  `recordError(error, "hidden-events/...")` plus an accessible failure surface; a
  filter read is total/infallible (never throws — defensive parse to the empty
  default).
- **A new ADR 023** (the MMKV-vs-Drizzle storage-backend call + the verbatim-blob /
  importer-fidelity decision).

## Capabilities

### New Capabilities

- `mobile-hidden-events`: hide a synced calendar event by its uid (this instance) or
  by its title (all of the same name), persist the hidden set durably (MMKV, verbatim
  for the Phase-09 importer), filter hidden events out of every calendar view through
  the unchanged events-source seam, and un-hide from a reachable management surface,
  with a crash-worthy-write observability posture.

### Modified Capabilities

- `mobile-event-details`: the read-only details screen gains a hide / un-hide action
  (a header overflow menu offered only for synced events) — a new write path on a
  previously read-only screen.
- `mobile-calendar-sync`: `useCalendarEvents(range)` (the single events-source seam)
  now additionally filters out hidden events behind the unchanged seam signature and
  the unchanged `CalendarEvent` shape — no calendar-view consumer change.

## Impact

- New: `mobile/src/features/hidden-events/{data,ui,index}.ts(x)` (store + types +
  hooks + barrels; the management screen + its test).
- New route: `mobile/src/app/hidden-events.tsx`; registered in
  `mobile/src/app/_layout.tsx` (`<Stack.Screen>` sibling of `(tabs)`).
- Modified: `mobile/src/features/calendar/data/events.ts` (the filter), and
  `mobile/src/features/calendar/data/index.ts` if the hidden set is read there.
- Modified: `mobile/src/features/calendar/ui/event-details-screen.tsx` (the hide /
  un-hide header action) — and its test.
- Modified: `mobile/src/features/profile` entry / the Profile tab screen (a
  "Hidden events" link) and `mobile/src/i18n/locales/{en,fr}.json` (the hide-dialog,
  management-screen, and error strings).
- New: `mobile/.maestro/hidden-events.yaml` (render + reachability of the management
  screen; the populated hide round-trip is seeded-data-limited like the other flows).
- Docs: `.claude/rules/mobile/{storage.md,calendar.md,features.md,firebase.md,architecture-changelog.md}`
  + ADR 023 + the ADR README index.
- **No new dependency, no `app.config.ts`/babel/native change, no Drizzle
  schema/migration change** (MMKV-backed; the `@/db` seam is untouched).
