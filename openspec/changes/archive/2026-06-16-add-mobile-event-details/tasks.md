## 1. Rich event-details read (`data/`, 90%-gated — D3)

- [x] 1.1 Create `src/features/calendar/data/event-details.ts`. Define the rich domain type
  `EventDetails` (`id`/uid, `title`, `color`, `groupColor`, `type: EventTypeEnum`, `startsAt`/`endsAt`/
  `exportedAt` as `Date`, `location?`, `description?`, `teachers: string[]`, `tags: EventDetailsTag[]`
  where `EventDetailsTag = { name: string; color: string; icon: string }` mirroring the generated
  `EventTag`, `canceled: boolean`, `userCalendarId: string`). This is the RICH counterpart to the lossy
  rendering `CalendarEvent` (ADR 021/D1 — the verbatim fidelity is in the row; this is its first
  consumer).
- [x] 1.2 In the same file, add the pure `rowToEventDetails(row): EventDetails` mapper: ISO TEXT → `Date`
  (incl. `exportedAt`), null `location`/`description` → undefined, `allDay` already boolean; decode
  `teachers`/`tags`/`fields` JSON **defensively** (a corrupt/non-conforming value → `[]`/`null`, never
  throw — the ADR-021/D2 total-read posture; reuse the same defensive decode the sync `data/sync/types.ts`
  uses, factoring a shared helper OR a tiny local `try/catch`); keep the **full** tags
  (`{name,color,icon}`, NOT name-only — the lossy projection drops color/icon); narrow `type` to the
  `EventTypeEnum` union with a safe fallback for an unknown verbatim value (importer fidelity — ADR 021's
  note); `canceled` from `fields?.canceled ?? false`. Pure — no `db`, no React, no `t()`.
- [x] 1.3 Add the `getByUid(uid: string): Promise<EventDetails | null>` repository read — `db.select()
  .from(calendarEvents).where(eq(calendarEvents.uid, uid))`, mapping the single row via
  `rowToEventDetails`, returning `null` when empty. Put it where `@/db` is already imported (in
  `data/sync/repository.ts` next to `findInRange`, or a focused module in `data/`) — the only `@/db`
  import site (B-1). `eq` is already re-exported from `@/db` (no new operator — R-2).
- [x] 1.4 Add the reactive `useEventDetails(uid: string | undefined): { event: EventDetails | null;
  loading: boolean }` hook over the seam's `useLiveQuery` (mirroring `useSyncedEvents` in
  `data/sync/hooks.ts`): query `calendar_events` by uid reactively, map via `rowToEventDetails`,
  distinguish loading from not-found (`event === null` after load). The screen re-renders if a sync
  replaces the row while open.
- [x] 1.5 Write `src/features/calendar/data/event-details.test.ts` (90%): `rowToEventDetails` keeps
  `groupColor`/`type`/`exportedAt`/full-tags; corrupt `tags`/`teachers`/`fields` JSON → safe defaults
  (no throw); null `location`/`description` → undefined; `canceled` from `fields.canceled`; an unknown
  `type` value falls back safely. Test `getByUid`'s query shape against the mocked `@/db` seam
  (`jest.mock("@/db")` — the query-builder spy posture from `user-calendars/repository.test.ts`),
  returning `null` for no row and the mapped event for a row. Clear the 90% logic gate.

## 2. Full date/time formatters (`data/format.ts`, 90%-gated — D5)

- [x] 2.1 Add two functions to `src/features/calendar/data/format.ts` (over the existing `date-fns` +
  `LOCALES` map — NO new dep): `formatEventDateRange(start: Date, end: Date, locale: AppLocale): string`
  (the full date + the `HH:mm – HH:mm` range — Flutter `eventDateTimeText`, but 24-hour per R-3, not
  `jm`; same-day shows one date + both times) and `formatFullDateTime(date: Date, locale: AppLocale):
  string` (the footer "<full date> · HH:mm" for `exportedAt` — Flutter `fullDateTimeText`). Display only,
  pure, locale-aware. Reuse the `date-fns` `format` patterns (`PPP`/`d MMMM yyyy`-style + `HH:mm`).
- [x] 2.2 Extend `src/features/calendar/data/format.test.ts`: `formatEventDateRange` shows the full date
  + the `HH:mm – HH:mm` range, FR vs. EN (the date is locale-appropriate); `formatFullDateTime` shows the
  full date + the time; both locales; a midnight/boundary time. Clear the 90% gate.

## 3. data/ barrel

- [x] 3.1 Extend `src/features/calendar/data/index.ts` to re-export the rich read surface (`EventDetails`,
  `EventDetailsTag`, `rowToEventDetails`, `getByUid`, `useEventDetails`) and the two new formatters
  (`formatEventDateRange`, `formatFullDateTime`). Keep the existing exports.

## 4. Details screen (`ui/`, 70% floor — D6)

- [x] 4.1 Create `src/features/calendar/ui/event-details-screen.tsx` (presentational): read the `uid`
  route param (`useLocalSearchParams<{ uid?: string }>()` — mirror `personal-event-form-screen.tsx`),
  read `useEventDetails(uid)`, and render through the sibling `data/` sub-barrel (B-2 — never `@/db`,
  B-1). Sections (each only when its data is present, mirroring Flutter `event_details_content`):
  - **Title block:** a `Radii.small` color **swatch** (the event `color`) with a translated
    `accessibilityLabel` (not a silent node); the `title` as `ThemedText type="title"` (heading role);
    the `formatEventDateRange(startsAt, endsAt, locale)` as `ThemedText`.
  - **Tags:** if `tags.length > 0`, a wrapping row of bubbles — each the tag `color` background + the
    tag `name` (the `icon` is best-effort: render an icon ONLY if an icon set is already wired in the
    app, else omit — do NOT add an icon-font dep; record the omission). Each bubble's name is its a11y
    surface.
  - **Content lines:** an icon-or-label + text for `location`, the **calendar name** (resolve via the
    `user-calendars` `useUserCalendars()` read — show ONLY when the user has 2+ calendars, matching
    Flutter; `userCalendarId` → the calendar's `name`), `teachers` (newline-joined), `description` —
    each rendered only when present/non-empty. Use the app's existing icon approach (e.g. Ionicons via
    `@expo/vector-icons` if already present) treated as decorative (`accessibilityElementsHidden` /
    `importantForAccessibility="no"`), the text as the accessible content; OR a labeled text line if no
    icon set is wired. (R-3 — do NOT port FontAwesome to match Flutter.)
  - **Footer:** the translated "updated" prefix + `formatFullDateTime(exportedAt, locale)`.
  - Wrap in a `ScrollView` (content can exceed the viewport). Theme everything from `@/theme` tokens.
- [x] 4.2 Add the **not-found state**: when `useEventDetails(uid)` resolves to `{ event: null, loading:
  false }` (a stale deep link / an event dropped by a sync), render an accessible translated message in a
  polite live region (`accessibilityLiveRegion="polite"` + `accessibilityRole="text"`) — NOT a crash,
  NOT a blank screen. While loading, render nothing crash-worthy (a spinner or empty is fine).
- [x] 4.3 Ensure an accessible **back affordance**: register the route so the `Stack` shows a header with
  the default (accessible) back button, or add an explicit accessible back control. Confirm the title is
  a heading and Dynamic Type is respected (never `allowFontScaling={false}`).
- [x] 4.4 Extend `src/features/calendar/ui/index.ts` to also export `EventDetailsScreen`.

## 5. Tap-through wiring (D2/D4)

- [x] 5.1 In `src/features/calendar/ui/agenda-list.tsx`: make the event tile a `Pressable`
  (`accessibilityRole="button"`, a translated `accessibilityLabel` = the existing tile label + a
  view-details hint, ≥44pt/48dp target), `onPress` calling a screen-provided `onPressEvent(event)`
  prop (the agenda list takes a new `onPressEvent: (event: CalendarEvent) => void` prop — the screen
  owns the router). The now-indicator column stays decorative.
- [x] 5.2 In `src/features/calendar/ui/calendar-screen.tsx`: define a single `handlePressEvent(uid,
  userCalendarId)` that routes by origin (D2) — `router.push(userCalendarId ? \`/event-details/${uid}\`
  : \`/personal-event-form?uid=${uid}\`)` (`router` from `expo-router`). Carry `userCalendarId` onto the
  mapped `EventItem` (mirroring how `location`/`startsAt` are already carried) so the grid press handler
  can route without a re-query. Pass `onPressEvent={(e) => handlePressEvent(e.id, e.userCalendarId)}` to
  the grid's `CalendarBody`, and `onPressEvent={(ev) => handlePressEvent(ev.id, ev.userCalendarId)}` to
  `<AgendaList>`.
- [x] 5.3 Confirm `onPressEvent` passes through the chrome seam: `src/components/chrome/calendar-kit.tsx`
  re-exports `CalendarBody` whose props already include `onPressEvent?: (event: OnEventResponse) => void`
  (verified in the calendar-kit types) — so the seam needs NO change beyond confirming the prop reaches
  the wrapped component (the screen never imports `@howljs/calendar-kit` directly — the ban holds). If a
  type re-export is needed for `OnEventResponse`/`EventItem`, add it to the seam.

## 6. Route (route-structure rule — D6)

- [x] 6.1 Create `src/app/event-details/[uid].tsx` — a one-line re-export:
  `export { EventDetailsScreen as default } from "@/features/calendar/ui"`. Add a header comment noting
  the dev deep link `timecalendar-dev://event-details/<uid>`.
- [x] 6.2 Register the route in `src/app/_layout.tsx` as `<Stack.Screen name="event-details/[uid]" />` (a
  sibling of `(tabs)`), with `options` showing a header + accessible back (or a screen-level header) so
  the title/back are present. Confirm it does not break the existing Stack screens.

## 7. i18n

- [x] 7.1 Add flat keys to `src/i18n/locales/en.json`: the screen title (`eventDetails.title`), the
  content-line labels/a11y (`eventDetails.location`, `eventDetails.calendarName`, `eventDetails.teachers`,
  `eventDetails.description` — used as a11y labels for the lines), the color-swatch a11y label
  (`eventDetails.colorLabel`), the "updated" footer prefix (`eventDetails.updated` = `"Updated {{date}}"`),
  the not-found message (`eventDetails.notFound`), and the tap a11y hint
  (`eventDetails.openLabel`/`calendar.event.openHint` — the view-details hint on the tile). Date strings
  come from the formatter, NOT catalog keys (D5).
- [x] 7.2 Add the identical key set (translated) to `src/i18n/locales/fr.json` — bidirectional `tsc`
  parity must pass. ("Mis à jour {{date}}" for `eventDetails.updated`.)

## 8. Jest proof (D9 — wiring proven without seeded data)

- [x] 8.1 Create `src/features/calendar/ui/event-details-screen.test.tsx`: mock the rich read
  (`jest.mock` the `data/` `useEventDetails` or the `@/db` seam) to return a fixture rich event (with
  tags, teachers, location, description, a `groupColor`, an `exportedAt`); render the screen through real
  theme + i18n and assert the **title** (heading), the **formatted date** (not a raw key), the **tags**,
  the **content lines** (location/teachers/description; the calendar-name line only when 2+ calendars —
  mock `useUserCalendars`), and the **footer** render with translated/formatted text. Assert the
  **not-found** state renders an accessible message for `event: null`.
- [x] 8.2 Extend `src/features/calendar/ui/calendar-screen.test.tsx` (or the agenda test): assert a tile
  press fires the router push with the **origin-correct** route — a synced event (`userCalendarId` set)
  → `/event-details/<uid>`, a personal event (`userCalendarId === undefined`) → `/personal-event-form?uid=
  <uid>` (mock `expo-router`'s `router.push` and assert the arg). Assert the agenda tile is now a
  touchable with a role + label.
- [x] 8.3 Confirm the coverage split holds: `data/event-details.ts` + the new `data/format.ts` functions
  clear 90% (the `src/features/*/!(ui)/**` glob); `ui/event-details-screen.tsx` + the touched screens
  fall under the 70% global floor (the `!(ui)` extglob excludes `ui/`).

## 9. Maestro

- [x] 9.1 Extend `mobile/.maestro/calendar.yaml` (or add a focused flow): assert the details route is
  reachable — either tap an event tile (in the agenda view) and assert the details screen mounts, OR
  deep-link `timecalendar-dev://event-details/<some-uid>` and assert the screen chrome / the **not-found
  message** renders (no synced event is seeded — the same SEEDED-DATA LIMITATION the file's header
  already records). Add a comment: the real POPULATED details render (tags, lines, footer on real synced
  data) is the on-device manual pass; CI proves the wiring deterministically in Jest. Do NOT seed a token
  + events (out of scope — its own infra change, as the header notes).

## 10. Architecture Book + docs (R-1; no ADR — D8)

- [x] 10.1 Update `/.claude/rules/mobile/calendar.md`: in the "Deferred" section, **remove** "event
  details" from the deferred list and add a live "## Event details (read-only)" section: the rich read
  (`getByUid` + `rowToEventDetails` — the FIRST consumer of ADR 021's verbatim row; the rich
  `EventDetails` vs. the lossy rendering `CalendarEvent`; the defensive JSON decode), the reactive
  `useEventDetails` hook + not-found state, the two new full date/time formatters, the read-only details
  screen (title block / tags / content lines / footer; R-3 brand surface, no icon-font dep), the
  tap-through (the agenda tile now touchable; the grid's `onPressEvent` through the chrome seam; the
  synced→details / personal→form routing keyed on `userCalendarId`), the new `event-details/[uid]` route,
  observability ➖ N/A. R-1 pointer style; reference ADRs 019/020/021 — note **no new ADR** (D8) and the
  recorded revisit trigger (a second rich-row consumer wanting a different projection → an event-details
  rich-domain ADR).
- [x] 10.2 Update `/.claude/rules/mobile/features.md` calendar section: extend the "Calendar" entry to
  record the read-only event details (the rich read consuming the verbatim row, the details screen, the
  tap-through from both views, the synced-vs-personal routing, the new route, observability ➖ N/A) and
  note the deferred hide-event + checklist features.
- [x] 10.3 Append a live entry to `/.claude/rules/mobile/architecture-changelog.md` (date `2026-06-16`,
  slug `add-mobile-event-details`): what moved (the read-only event details screen — the rich `getByUid`
  read + `rowToEventDetails` over ADR 021's verbatim row, the reactive `useEventDetails` + not-found
  state, the two full date/time formatters, the details screen, the tap-through making the agenda/grid
  tiles touchable, the new `event-details/[uid]` route, the synced→details / personal→form routing), why
  (Phase-04 item 3 — the first consumer of the verbatim-stored rich row; completes the tap target the
  agenda ship forward-referenced), pointers (calendar.md, features.md, ADRs 019/020/021). Note **no new
  ADR / no dependency / no schema change**, observability ➖ N/A, and that edit/delete/hide/checklist are
  deferred.
- [x] 10.4 Confirm the `lint-format.md` rule inventory needs no change (no new lint rule — the details
  screen rides existing feature-boundary B-1..B-4, no-hardcoded-strings, a11y, import-order, coverage
  gates; the calendar-kit ban still holds — the grid `onPressEvent` goes through the chrome seam). State
  so in the change.

## 11. Human handoff (inbox)

- [x] 11.1 (HUMAN: see inbox/2026-06-16-event-details-on-device.md) Write an inbox note: the **real
  populated details render on iOS + Android** (DoD native-correctness + performance — a designed brand
  surface, R-3) needs a real synced event the dev harness/CI cannot seed (the calendar SEEDED-DATA
  limitation). Verify on a device with a real synced calendar: tapping an event in the day/week grid AND
  the agenda opens the read-only details; the title block (color swatch + title + full date/time), tag
  bubbles (name + color), content lines (location / calendar name when 2+ calendars / teachers /
  description), and the "updated" footer render correctly and on-brand; the back affordance works;
  VoiceOver + TalkBack convey the title heading, the labeled swatch, and each content line; a stale deep
  link shows the not-found state. (May extend the existing `inbox/2026-06-16-calendar-sync-on-device.md`
  note instead of a new file — implementer's choice; record which.) Skip-and-continue — CI cannot render
  real synced data.
- [x] 11.2 (HUMAN: see inbox/2026-06-16-event-details-deferrals.md) Record the deferred sibling features
  so the roadmap tracks them: the **checklist** (interactive add/toggle, its own `checklist_item`
  repository/store — a fourth Drizzle table + an importer-fidelity question) and the **hide-event /
  hidden-events** feature (writes hidden-event state + filters the calendar) are each their own future
  ship, intentionally out of this read-only view half (D1).

## 12. Local verification (run in `mobile/`)

- [x] 12.1 `npx tsc --noEmit` — clean (FR/EN parity included; the rich `EventDetails` type, the
  `EventTypeEnum` narrowing, the route param, and the `onPressEvent` prop types compile).
- [x] 12.2 `npm run lint` — clean (`--max-warnings 0`; no hardcoded strings — date strings from the
  formatter, all labels via `t()`; feature boundaries B-1..B-4; import order; the calendar-kit ban still
  holds — `onPressEvent` rides the chrome seam).
- [x] 12.3 `npm test` — green, including `event-details.test.ts` + the new `format.test.ts` cases (90%)
  and the screen + tap-wiring tests (70% floor), with the coverage thresholds met.
- [x] 12.4 `openspec validate add-mobile-event-details --strict` — passes.
