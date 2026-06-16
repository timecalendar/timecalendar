# Tasks — Hidden events (Phase 05 Ship A)

All paths are under `mobile/` unless noted. Run the gates (`npx tsc --noEmit`,
`npm run lint`, `npm test`) in `mobile/` after each implementation group. Mirror the
write/read-back + restart-simulation test rigor of `user_calendars` (Phase 03) and
`calendar_events` (Phase 04).

## 1. ADR + storage-backend decision (do first — it gates the data design)

- [x] 1.1 Re-read the Flutter wire format to confirm parity before coding:
  `app/lib/modules/hidden_event/{models/hidden_event.dart,repositories/hidden_event_repository.dart,providers/hidden_event_provider.dart,screens/hidden_events_screen.dart}`,
  `app/lib/modules/event_details/widgets/{event_details_hidden_dialog.dart,event_details_header.dart}`,
  and `app/lib/modules/calendar/providers/events_provider.dart` (the filter). Confirm:
  single record `{ uidHiddenEvents: String[], namedHiddenEvents: String[] }`, default-empty,
  filter on the merged list, hide action only for `EventKind.Calendar`.
- [x] 1.2 Write **ADR 023** at `.claude/rules/mobile/decisions/023-hidden-events-storage.md`
  (copy `TEMPLATE.md`): record the **MMKV-over-Drizzle** storage-backend decision with the same
  rigor as ADR 018 (genuinely weigh Drizzle, reject it for a flat non-relational two-list blob),
  the verbatim-single-blob importer-fidelity decision, the one-key shape, and the merged-list
  filter (Flutter parity). Include Context / Decision / Consequences / Revisit-if.
- [x] 1.3 Add the ADR 023 row to `.claude/rules/mobile/decisions/README.md` (the index table).

## 2. The `data/` store (MMKV, total parser, one write path) — 90%-gated

- [x] 2.1 Create `src/features/hidden-events/data/types.ts`: the `HiddenEventsSet`
  (`{ uidHiddenEvents: string[]; namedHiddenEvents: string[] }`), `HIDDEN_EVENTS_KEYS.set =
  "hiddenEvents.set"`, the total `parseHiddenEvents(raw): HiddenEventsSet` (unset / non-JSON /
  wrong-shape / non-string-array → the empty set, never throws — mirror `parseGroupValues`), and
  `encodeHiddenEvents(set): string` (JSON.stringify preserving the `{ uidHiddenEvents,
  namedHiddenEvents }` shape verbatim).
- [x] 2.2 Create `src/features/hidden-events/data/store.ts`: pure imperative get/set over
  `@/storage` (`getString`/`setString`) — `getHiddenEvents()`, and the four mutators
  `hideByUid` / `hideByName` / `unhideUid` / `unhideName` (read → next-set append-if-absent /
  filter-out, deduped → write the whole encoded blob). The mutators may throw on a write failure
  (the failure surface; the catching is in the hook, §2.4).
- [x] 2.3 Create `src/features/hidden-events/data/hooks.ts`: `useHiddenEvents(): HiddenEventsSet`
  (reactive over `useStoredString(HIDDEN_EVENTS_KEYS.set)` + `parseHiddenEvents`, mirroring
  `useSelectedSchool`).
- [x] 2.4 In `hooks.ts` add `useHideActions()` returning the four mutators wrapped with the
  observability + failure-state handling: a thrown write → `@/firebase` `recordError(error,
  "hidden-events/<action>")` + expose an accessible error flag (the one place the UI calls writes).
- [x] 2.5 Create the barrels: `src/features/hidden-events/data/index.ts` (sub-barrel) and
  `src/features/hidden-events/index.ts` (feature barrel — re-exports the data sub-barrel + the ui
  sub-barrel, no self-cycle, B-2).
- [x] 2.6 Tests (90% logic gate): `data/types.test.ts` (parser: empty / corrupt / verbatim-shape
  round-trip; encode round-trip), `data/store.test.ts` (each mutator: append, dedup no-op,
  remove, remove-absent no-op; **write-then-read-back**; a **restart-simulation** reading back a
  prior write through a stateful Map-backed `@/storage` fake — mirror user-calendars). Verify the
  importer-fidelity verbatim blob shape explicitly.

## 3. The filter at the events-source seam (no consumer change)

- [x] 3.1 In `src/features/calendar/data/events.ts` `useCalendarEvents(range)`: read
  `useHiddenEvents()` (import from `@/features/hidden-events` — a `data → data` cross-feature
  read), build a `uidSet`/`nameSet`, and filter the **merged** list (before the range filter) to
  exclude `uidSet.has(event.id) || nameSet.has(event.title)`. Keep the seam signature + the
  `CalendarEvent` shape unchanged; include the hidden set in the `useMemo` deps.
- [x] 3.2 Update `src/features/calendar/data/events.test.ts` (or add one): a uid-hidden event and
  a name-hidden title are excluded from the merged result; the merged-list parity (a same-titled
  personal event is also excluded by a name match); an empty hidden set excludes nothing.

## 4. The hide / un-hide action on the event-details screen

- [x] 4.1 In `src/features/calendar/ui/event-details-screen.tsx`: add a header overflow menu via
  `<Stack.Screen options={{ headerRight: ... }}>` (or an in-content action), offered ONLY for a
  synced event (`event.userCalendarId` present). Read `useHiddenEvents()` to decide hidden-vs-not.
- [x] 4.2 Not-hidden: open a native-default chooser (R-3 — an RN `Alert`/action-sheet, no Material
  dialog port) with two translated, accessible choices — "hide this event"
  (`hideByUid(event.id)`) and "hide all events of the same name" (`hideByName(event.title)`) — via
  `useHideActions()`; on success pop back (`router.back()`).
- [x] 4.3 Currently-hidden: offer an "un-hide" action (`unhideUid(event.id)` and/or
  `unhideName(event.title)` for whichever set contains it).
- [x] 4.4 Surface the `useHideActions()` failure flag as an accessible failure state (a polite
  live region / `alert`).
- [x] 4.5 Update `event-details-screen.test.tsx`: the menu appears only for a synced event; the
  hide-this/hide-by-name choices call the correct mutator; the un-hide path for a currently-hidden
  event; a write failure surfaces the error (mock `@/features/hidden-events` + `@/firebase`).

## 5. The hidden-events management screen + route

- [x] 5.1 Create `src/features/hidden-events/ui/hidden-events-screen.tsx` (presentational, 70%
  floor): read `useHiddenEvents()` + `useSyncedEvents()` (from `@/features/calendar/data`, to
  resolve each uid → title/time). Render a name-hidden section (each title + un-hide control) and
  a uid-hidden section (each uid that still resolves to a synced event → its title + time + un-hide
  control; non-resolving uids not listed, Flutter parity), an accessible empty state, themed from
  `@/theme` (R-3, heading-role section titles, touchable un-hide labels ≥44pt).
- [x] 5.2 Create `src/features/hidden-events/ui/index.ts` (ui sub-barrel) and wire it into the
  feature barrel (§2.5).
- [x] 5.3 Create the thin route `src/app/hidden-events.tsx` re-exporting the screen through the
  `ui/` sub-barrel (route-structure rule).
- [x] 5.4 Register it in `src/app/_layout.tsx` as a `<Stack.Screen name="hidden-events" />`
  sibling of `(tabs)` (deep-linkable `timecalendar-dev://hidden-events`).
- [x] 5.5 Add a Profile-tab entry link (`<Link href="/hidden-events">`, accessible, translated)
  beside the existing `/personal-events`, `/settings` entries.
- [x] 5.6 Test `hidden-events-screen.test.tsx`: lists name-hidden + resolving uid-hidden entries
  with un-hide controls; the un-hide control calls the mutator; a non-resolving uid is not listed;
  the empty state renders (mock `@/features/hidden-events` + the synced-events read).

## 6. i18n (flat typed keys, FR + EN parity)

- [x] 6.1 Add flat keys to `src/i18n/locales/en.json` and `fr.json` (both — `tsc` parity fails
  otherwise): the hide-chooser title + the two options + cancel, the un-hide labels, the
  management screen title + section headers (named group / uid group) + empty state, the un-hide
  control label, the write-error message, and the Profile entry label
  (`hiddenEvents.*`). FR copy mirrors the Flutter strings ("Masquer cet événement", "Masquer tous
  les événements de même nom", "Événements masqués", "Aucun événement masqué", etc.).

## 7. E2E + docs

- [x] 7.1 Add `.maestro/hidden-events.yaml`: deep-link the management route + assert it renders
  (empty state, since no seeded hidden set — record the seeded-data limitation in the file, same
  posture as the calendar/home flows); assert reachability from Profile.
- [x] 7.2 Update the Architecture Book: `.claude/rules/mobile/storage.md` (the new MMKV hidden-set
  store — a "Hidden events store" subsection, pointing at ADR 023), `.claude/rules/mobile/calendar.md`
  (the events-source seam now filters hidden events; the event-details hide action — the hide-event
  deferral in "Deferred" is now LANDED), `.claude/rules/mobile/features.md` (a new "Hidden events"
  feature section + the event-details hide-action note + the Profile entry), and
  `.claude/rules/mobile/firebase.md` if a new `recordError` context is worth noting.
- [x] 7.3 Append a dated entry to `.claude/rules/mobile/architecture-changelog.md` (newest last):
  the `add-mobile-hidden-events` ship — MMKV store, the filter-at-the-seam, the hide/un-hide action,
  the management screen, ADR 023, no new dep/native/schema change.

## 8. Local verification (must be green)

- [x] 8.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 8.2 `npm run lint` clean (`--max-warnings 0`) in `mobile/` — incl. feature-boundary B-1..B-4
  (the `data → data` calendar→hidden-events edge is allowed; no seam imported from `ui/`),
  no-hardcoded-strings, a11y, import-order.
- [x] 8.3 `npm test -- --coverage` green in `mobile/` — `hidden-events/data/**` clears the 90%
  gate; the screens meet the 70% floor; the write/read-back + restart-simulation tests pass.

## 9. CI proof + DoD

- [x] 9.1 Confirm the CI proof obligations are covered by the §2.6/§3.2/§4.5/§5.6 tests (the write
  paths are TESTED — the irreplaceable-data requirement): parser totality, the four mutators,
  write/read-back, restart-simulation, the seam filter, the hide/un-hide wiring, the synced-only
  gating, the observability path (failed write → `recordError`).
- [x] 9.2 Walk the Definition of Done axes: Observability ✅ (write → `recordError`; read N/A),
  i18n (FR+EN parity), a11y (heading roles, touchable labels, ≥44pt, live-region error), native
  correctness (R-3 native-default chooser, both platforms — the populated hide round-trip + manual
  VoiceOver/TalkBack is the on-device pass; record an inbox note
  `docs/react-native-migration/inbox/<today>-hidden-events-on-device.md` for the
  manual-only checks), coverage. No third state — each axis ✅ or ➖ + reason.
