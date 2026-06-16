# Design — add-mobile-event-details

Read-only event details for synced calendar events (Phase-04 item 3, Flutter `event_details`
view-half). The decisions below are recorded here (not as ADRs) because this ship introduces **no new
load-bearing reversible pattern** — it consumes ADR 021's verbatim storage and reuses the landed
calendar/feature/route patterns. The two calls a reviewer will scrutinize (read-only scope + deferrals;
unified-vs-separate details) are settled here with rationale (Design D1/D2/D8).

## D1 — Scope is the VIEW HALF ONLY: no edit, no delete, no hide, no checklist

This ship is a **pure presentational read** of a calendar event's fields. The Flutter
`event_details` module carries three interactive surfaces this ship **defers**, each because it is a
**state-writing feature** that does not belong in a "read-only details" view:

- **Edit / Delete** — synced calendar events are not user-editable (they come from the source
  calendar; the Flutter header menu's Edit/Delete apply to user-owned events, not synced ones). Out of
  scope by definition of "read-only". Personal events keep their existing editable form (D2).
- **Checklist** (`event_details/providers/checklist_item_provider` + a `checklist_item` repository/
  store) — an **interactive add/toggle feature** backed by its own repository and store. That is an
  edit feature with its own persistence (a fourth Drizzle table, its own importer-fidelity question),
  **not** part of the view half. **Deferred to its own feature/ship** — recorded in the inbox so the
  roadmap tracks it. Including it would blow this ship's read-only scope and pull in a write surface.
- **Hide event** (the header "Masquer"/Hide menu) — the **hidden-events feature**: it **writes**
  hidden-event state (its own store/table) and filters the calendar. A state-writing feature, **not a
  read**. **Deferred to its own feature** (the hidden-events ship). This details screen has **no header
  menu** this ship.

So the screen has **no header overflow menu and no write path of any kind** — back navigation only.
The deferrals are stated in `calendar.md` "Deferred" and an inbox note so they are not lost.

*Rejected:* shipping a read-only checklist (Flutter's is interactive — a read-only checklist is not a
real parity surface and still needs the `checklist_item` read wiring; defer the whole feature).

## D2 — Synced calendar events get the new read-only screen; personal events keep their editable form

A tapped **synced calendar event** → the new read-only details screen. A tapped **personal event** →
its **existing editable form route** (`/personal-event-form?uid=<uid>`), unchanged. Rationale:

- Personal events are **user-owned and editable** — the user created them; tapping one to *view-only*
  would be a worse UX than the edit form they already have (which shows all the same fields, editable).
  They already have a complete tap destination.
- The details screen reads `calendar_events` via `getByUid`; **personal events live in a different
  table** (`personal_events`) with a different (smaller) shape — they carry no `groupColor`/`type`/rich
  tags/teachers. A unified screen would need a second read path + a discriminated union + a
  "which-table" lookup by uid, for no gain (a personal event has no richer info to show than its form).
- This ship makes **only synced calendar events tappable** (the agenda + grid tiles that render synced
  events). Personal events render in the same merged list (the events-source seam merges both), so the
  tap handler must route by **whether the uid resolves to a `calendar_events` row**: it pushes the
  details route with the uid; the details screen's `getByUid` returns the row for a synced event. For a
  personal event the merged tile is ALSO tappable but routes to the personal-event form instead.

**The routing decision lives at the tap site, keyed on the event's origin.** The merged
`CalendarEvent` does not currently carry an explicit "synced vs personal" discriminator beyond
`userCalendarId` (synced events have one; personal events have `userCalendarId === undefined` —
see `events.ts` `personalToCalendarEvent`). So the tap handler routes: `userCalendarId !== undefined`
→ `/event-details/<uid>` (synced); `userCalendarId === undefined` → `/personal-event-form?uid=<uid>`
(personal, the existing edit route). This reuses the existing field, adds no new shape, and keeps each
event on the right destination.

*Rejected:* one unified details screen for both (a discriminated read for no richer personal-event
info — over-built, R-2); making personal events non-tappable (they are tappable in Flutter — tapping
opens the editable view; routing to the existing form is the parity-correct, least-surprising choice).

## D3 — The rich read: a `getByUid` + `rowToEventDetails` over the verbatim row, NOT the lossy domain

The details screen needs the **rich** event data the rendering `CalendarEvent` deliberately drops
(ADR 021/D1: the domain is a lossy projection; the verbatim fidelity is in the ROW). So this ship adds
the **first consumer of the verbatim row**:

- A pure **`rowToEventDetails(row): EventDetails`** mapper in `calendar/data/event-details.ts` — the
  rich counterpart to the lossy `rowToCalendarEvent`. It decodes the JSON columns **defensively** (the
  ADR-021/D2 total-read posture — a corrupt/legacy value degrades to `[]`/`null`, never throws the
  read), and produces a rich `EventDetails`:
  - `title`, `color`, **`groupColor`** (kept — the lossy domain drops it), `startsAt`/`endsAt`/
    **`exportedAt`** as `Date` (the footer needs `exportedAt`; the lossy domain drops it),
    `location`, `description`, `teachers: string[]`, the **full** `tags: EventDetailsTag[]`
    (`{ name; color; icon }` — the lossy domain projects to `string[]` names only; the details tags
    need color+icon), `canceled` (from `fields?.canceled`), `userCalendarId`. `type` is carried
    (the verbatim TEXT, narrowed to the `EventTypeEnum` union at the edge with a safe fallback —
    importer fidelity, ADR 021's note).
  - The `EventDetailsTag` shape mirrors the generated `EventTag` (`{ name; color; icon }`); decoding
    reuses the same defensive JSON decode the sync mapper uses (factor the shared decoder, or duplicate
    the tiny `try/catch` — keep it pure and 90%-gated).
- A **`getByUid(uid): Promise<CalendarEvent... >`** repository read on `calendar_events` — `db.select()
  .from(calendarEvents).where(eq(calendarEvents.uid, uid))`, returning the single row mapped via
  `rowToEventDetails`, or `null` when no row matches. Lives in `calendar/data/sync/repository.ts`
  (the only `@/db` import site, B-1) **or** a new `event-details.ts` data module that imports the seam
  — keep it in `data/`, the only place that touches `@/db`. **`eq` is already re-exported** from `@/db`
  (used by user-calendars); no new operator (R-2).
- A reactive **`useEventDetails(uid): { event: EventDetails | null; loading: boolean }`** hook over
  the seam's `useLiveQuery` (mirroring `useSyncedEvents`), so the screen re-renders if a sync replaces
  the row while open and resolves a not-found state. **Where the rich type lives:** `calendar/data/`
  (with the other domain types), exported from the `data/` sub-barrel — the details screen reads it via
  the sibling sub-barrel (B-2), never `@/db` (B-1).

*Rejected:* widening the rendering `CalendarEvent` with the rich fields (it is a deliberately-lossy
rendering projection feeding the grid/agenda; the grid does not need `groupColor`/rich-tags/`type` —
widening it would bloat every tile's data for one consumer, against ADR 021/D1's "fidelity in the row,
not the domain"); reading the lossy `CalendarEvent` in the details screen and re-deriving (the rich
data is simply absent from it — the row is the only source).

## D4 — Tap-through: the agenda tile becomes touchable; the grid wires `onPressEvent` through the seam

Two tap sites, both routing through one handler (D2 routing):

- **Agenda tile** (`ui/agenda-list.tsx`): currently `accessibilityRole="text"`, no `onPress` ("the tap
  target lands with event details"). It becomes a `Pressable` with `accessibilityRole="button"`, a
  translated `accessibilityLabel` (the existing tile label + a "view details" hint), and `onPress` →
  the router push. The now-indicator column stays decorative.
- **Calendar-kit grid** (`ui/calendar-screen.tsx`): `CalendarBody` accepts an `onPressEvent`
  prop (confirmed in the calendar-kit types: `onPressEvent?: (event: OnEventResponse) => void` on the
  body) — the screen passes `onPressEvent={(e) => handlePress(e.id, e.userCalendarId)}`. The chrome
  seam (`calendar-kit.tsx`) already re-exports `CalendarBody`; `onPressEvent` is a pass-through prop,
  so the seam needs **no change** beyond confirming the prop reaches the wrapped `CalendarBody`. The
  `EventItem` already carries the fields needed to route (the screen carries `userCalendarId` onto the
  mapped `EventItem` so the press handler can route without a re-query — mirroring how `location`/
  `startsAt` are already carried on the `EventItem`).
- **The handler** lives in the screen (the agenda gets it as a prop, the grid inline): `(uid,
  userCalendarId) => router.push(userCalendarId ? \`/event-details/${uid}\` :
  \`/personal-event-form?uid=${uid}\`)`. Both screens import `router` from `expo-router` (the agenda
  list already takes screen-provided props; pass `onPressEvent` down).

## D5 — Full date/time formatters extend the existing `format.ts` (no new dep)

The title block shows the full date + time range (Flutter `eventDateTimeText` =
`yMMMMd · jm – jm`), and the footer shows the full date+time (Flutter `fullDateTimeText`). The agenda's
`format.ts` already has `formatTimeRange` (times only) over `date-fns`; this ship adds:

- `formatEventDateRange(start, end, locale)` — the full date + the time range. Same-day:
  `"<full date> · HH:mm – HH:mm"`. (Cross-day events are rare for synced timetable events; format the
  start date + both times, or both full date-times — keep it simple and locale-aware, **24-hour**
  per the agenda's R-3 decision, not Flutter's `jm` AM/PM.)
- `formatFullDateTime(date, locale)` — the footer's "<full date> · HH:mm" for `exportedAt`.

Both are **display-only**, pure, locale-aware over the existing `date-fns` + `date-fns/locale`,
**90%-gated**. No new dependency, no rrule/Temporal. (Reuses the agenda's `LOCALES` map; a new app
locale still needs an entry there.)

## D6 — The screen is a brand surface (R-3), accessible, themed from `@/theme`

- A `ScrollView` (the content can exceed the viewport — teachers + a long description). Sections:
  **title block** (a `Radii.small` color **swatch** with a translated `accessibilityLabel` naming it
  the event color, the title as `ThemedText type="title"` → heading role, the full date/time as
  `ThemedText`), **tags** (a wrapping row of bubbles, each the tag `color` background + the tag `name`;
  the `icon` is best-effort — Flutter uses FontAwesome icon names; **render the icon name as text or
  omit the icon if no icon font is wired** — do NOT add an icon-font dep this ship; a bubble with
  name+color is the parity-meaningful surface, the icon is recorded debt), **content lines** (an icon
  + text each, only when the field is present: location, the calendar **name** when the user has 2+
  calendars, teachers newline-joined, description), and the **footer** ("Updated <full date/time>").
- **Icons for content lines:** use the existing icon approach in the app (whatever `@expo/vector-icons`
  / Ionicons the app already ships, or a `ThemedText` glyph) — do NOT introduce FontAwesome to match
  Flutter exactly (R-3 — the platform is the design reference). If no icon set is wired, a labeled text
  line (no icon, or a simple Ionicons glyph) is acceptable; record the choice in `design.md`/the book.
- **a11y:** the title is a heading; section headers (if any) carry heading roles; each content line is
  an accessible element with its label conveyed (icon decorative / `accessibilityElementsHidden`, the
  text the label); the color swatch is labeled (not a silent decorative node); the back affordance is
  the standard `Stack` header back button (accessible by default) — confirm the route shows a header
  with a back control, or add an accessible back control. Tags row exposed sensibly (each bubble's name
  is its label). Dynamic Type respected (never `allowFontScaling={false}`).
- **Not-found state:** when `getByUid`/`useEventDetails` resolves to `null` (a stale deep link, or the
  event dropped by a sync's drop+replace), render an accessible message (a polite live region +
  translated copy) — **not** a crash, not a blank screen. This is the read-only analog of the school
  read's `isError` state.

## D7 — Observability ➖ N/A (read-only)

A read-only render of a local row has **no crash-worthy write/throw path**. A `getByUid` that finds no
row is a **recoverable** accessible not-found state (D6), not an exception — mirroring the day/week
timeline, the agenda, and the school-selection read path (all `isError`/empty, not `recordError`'d).
The `useLiveQuery` read itself does not throw on the happy path; a corrupt JSON column degrades to a
safe default in the mapper (D3), not a throw. So the Observability DoD axis is **N/A with a recorded
reason**, and the change imports `@react-native-firebase/*` nowhere it adds. (The only calendar-feature
firebase touch stays the sync `replaceAll` transaction failure — unchanged, not this ship's surface.)

## D8 — No new ADR

The load-bearing decisions this ship leans on are already ADRs: the calendar rendering seam (019/020),
the verbatim calendar-event storage this read consumes (021), the layered feature-module pattern (014),
the route structure rule, and the @expo/ui-style chrome seam. The read-only-vs-edit scope (D1), the
synced-vs-personal routing (D2), and the rich-read-over-the-verbatim-row (D3) are **executions of**
those existing decisions, not new reversible patterns reused across features — so they are recorded
here, not as ADRs. (If a *second* rich-row consumer later wants a different rich-projection shape, that
is when an "event-details rich domain" ADR earns its place — recorded as the revisit trigger in
`calendar.md`.)

## What CI proves vs. on-device

- **CI proves OUR wiring:** the `rowToEventDetails` mapper (rich-field survival incl. `groupColor`/
  `type`/full-tags/`exportedAt`, corrupt-JSON → safe default, null↔undefined) + the two new formatters
  at 90%; the `getByUid` query shape against the mocked `@/db` seam; the screen's row→sections wiring
  (title/date/tags/lines/footer render with translated+formatted text, the not-found state) + the
  tap-through (a press fires the router push with the right route by origin) at the 70% floor.
- **On-device / Maestro:** the details **route is deep-linkable** (`timecalendar-dev://event-details/
  <uid>`) and a tap from the agenda reaches it — but a **real populated render needs a seeded synced
  event the dev harness does not provide** (the same seeded-data limitation `.maestro/calendar.yaml`
  already records — no `user_calendars` token + synced `calendar_events` reachable by deep link). So
  Maestro asserts **reachability** (the tap target exists; a deep link to the route renders the
  screen's chrome / not-found state), and the **real populated details render + a11y + native-correct
  visual pass is the on-device manual pass** (folded into the calendar inbox note).
