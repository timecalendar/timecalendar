## Why

Phase 04 ("Calendar core", roadmap step 3) adds the **read-only event details screen** — the
view reached by **tapping an event** in the calendar. The rendering surface (day / week / agenda)
and calendar sync have all landed (`add-mobile-calendar-timeline` / `-agenda` / `-sync`, ADRs
[019](../../../.claude/rules/mobile/decisions/019-calendar-rendering-adopt-calendar-kit.md)/[020](../../../.claude/rules/mobile/decisions/020-calendar-kit-seam.md)/[021](../../../.claude/rules/mobile/decisions/021-calendar-event-storage-and-sync.md)),
but the calendar tiles are **not yet tappable** — the agenda tile is a non-touchable
`accessibilityRole="text"` ("the tap target lands with event details, a later item — so it is not a
dead touchable"), and the calendar-kit grid never wired `onPressEvent`. This change makes synced
calendar events tappable and shows their full info read-only.

This is also the **first consumer of the verbatim-stored rich row** the sync ship deliberately
persisted (ADR 021/D1: "the verbatim fidelity lives in the ROW, never the [lossy rendering] domain").
The rendering `CalendarEvent` is a deliberately-lossy projection (tags → names, no `groupColor`/
`type`/`fields`/rich-tag `{color,icon}`/teachers-as-rich). The details screen needs the **rich** data
(teachers, description, location, tags with name/color/icon, calendar name, last-updated) — so this
ship adds the rich read that consumes what ADR 021 stored.

Flutter parity is the `event_details` module **VIEW HALF ONLY**: the title block (color square +
title + full date/time), tags, content lines (location / calendar name / teachers / description), and
the "Mis à jour …" footer. The interactive checklist and the Hide/Edit/Delete header menu are
**state-writing features deferred to their own ships** (see Decisions / Deferred).

## What Changes

A **read-only** event details screen for **synced calendar events**, reached by tapping an event in
the day/week timeline grid and the agenda list, grown in place in `src/features/calendar/`.

- A **rich read** in `src/features/calendar/data/`: a `getByUid(uid)` repository read on
  `calendar_events` and a new pure `rowToEventDetails(row)` mapper producing a **rich
  `EventDetails`** domain type (`title`, `color`, `groupColor`, `type`, `startsAt`/`endsAt`/
  `exportedAt` as `Date`, `location`, `description`, `teachers: string[]`, the **full**
  `tags: EventDetailsTag[]` = `{ name; color; icon }`, `canceled`, `userCalendarId`). This is the
  **rich** counterpart to the lossy `rowToCalendarEvent` rendering projection — it decodes the JSON
  columns defensively (corrupt → safe default, never throws — the ADR-021/D2 posture) and keeps the
  `groupColor`/`type`/rich-tags the lossy domain drops. A reactive `useEventDetails(uid)` hook over
  `useLiveQuery` exposes it to the screen with a loading / not-found state. (Design D3.)
- A **full-date-and-time formatter** added to `src/features/calendar/data/format.ts`:
  `formatEventDateRange(start, end, locale)` (the full date + the `HH:mm – HH:mm` range — Flutter
  `eventDateTimeText`) and `formatFullDateTime(date, locale)` (the "updated" footer — Flutter
  `fullDateTimeText`). Display-only over the existing `date-fns` dep, locale-aware, **90%-gated**.
  (Design D5.)
- A presentational **details screen** `src/features/calendar/ui/event-details-screen.tsx`
  (70% floor): a `ScrollView` rendering the title block (a labeled color swatch + the title as a
  heading + the full date/time), tag bubbles (each `{name,color,icon}`, only if any), content lines
  (an icon + text — location, calendar name when 2+ calendars, teachers newline-joined, description —
  each only when present), and the "Updated {date}" footer. A designed brand surface themed from
  `@/theme` (R-3 — native idioms + brand tokens, **not** a Material port). An accessible **not-found**
  state when the uid resolves to no row (e.g. a stale deep link / an event dropped by a sync).
  **Read-only — no edit / delete / hide / checklist.**
- **Tap-through wiring (the only change to landed screens):** the agenda tile becomes a touchable
  (`accessibilityRole="button"` + a translated label + `onPress`) → `router.push("/event-details/<uid>")`;
  the calendar-kit grid passes `onPressEvent` through the chrome seam (`CalendarBody`) → the same push.
  A thin route `src/app/event-details/[uid].tsx` re-exports the screen (route-structure rule),
  registered as a `<Stack.Screen name="event-details/[uid]" />` sibling of `(tabs)`, deep-linkable
  (`timecalendar-dev://event-details/<uid>`).
- **Personal events keep their existing editable form route** — a tapped personal event is NOT routed
  to this read-only screen (Design D2). This ship makes only **synced calendar events** tappable; the
  details screen reads `calendar_events`, which holds no personal-event rows. Personal events stay on
  their edit path.
- FR + EN flat i18n keys (the screen title, section/content labels, the "updated" prefix, the
  not-found message, the tap a11y label; the date strings come from the locale-aware formatter, not
  catalog keys).
- Jest/component proofs: the rich mapper + the two new formatters at 90%; the screen + the tap wiring
  at the 70% floor.
- Architecture Book updates: `calendar.md` (the rich read + the details screen + the tap-through;
  remove event details from "Deferred"), `features.md` (the details entry), the
  `architecture-changelog.md` entry. **No new ADR** — the rich read **consumes** ADR 021's
  verbatim storage (its whole point); the read-only-vs-edit and unified-vs-separate calls are
  recorded in `design.md` as decisions, not new reversible-pattern ADRs (Design D8).

## Capabilities

### New Capabilities
- `mobile-event-details`: the read-only event details screen for synced calendar events — the rich
  `getByUid` read + `rowToEventDetails` mapper + reactive `useEventDetails` hook (the first consumer
  of ADR 021's verbatim row), the full date/time formatters, the presentational details screen (title
  block, tags, content lines, footer, not-found state), the tap-through from the timeline + agenda
  views, the new `event-details/[uid]` route, and its i18n / a11y / CI-proof posture.

### Modified Capabilities
<!-- None at the spec level. The agenda list's `mobile-calendar-agenda` capability stated the tile is
     "not a dead touchable" because the tap target "lands with event details, a later item" — this is
     that item; making the tile touchable FULFILLS that forward reference rather than changing a
     behavior requirement. The timeline `mobile-calendar-timeline` / sync `mobile-calendar-sync`
     capabilities are extended at the implementation level (the grid gains `onPressEvent`; a `getByUid`
     read is added) but no existing spec REQUIREMENT changes its behavior — the events-source seam, the
     verbatim storage, the drop+replace, and the calendar-kit ban all stand unchanged. -->

## Impact

- **Dependencies:** none. `date-fns` (the formatter dep) already landed with the agenda; this ship
  adds two new functions to the existing `format.ts`. No native change, no new plugin, **no EAS
  fingerprint bump**.
- **New code:** `src/features/calendar/data/event-details.ts` (the rich `EventDetails` type +
  `rowToEventDetails` mapper + `getByUid` repository read + `useEventDetails` hook) + tests;
  `src/features/calendar/ui/event-details-screen.tsx` (+ test); `src/app/event-details/[uid].tsx`
  (thin route); two new functions in `data/format.ts` (+ tests). The `data/` and `ui/` sub-barrels
  gain exports.
- **Modified code:** `src/features/calendar/ui/agenda-list.tsx` (the tile becomes touchable +
  `onPress`); `src/features/calendar/ui/calendar-screen.tsx` (pass `onPressEvent` to `CalendarBody`);
  `src/components/chrome/calendar-kit.tsx` (re-export nothing new — `onPressEvent` is already a
  `CalendarBody` prop the seam forwards; confirm it passes through); `src/app/_layout.tsx` (register
  the `event-details/[uid]` Stack screen); `src/features/calendar/data/index.ts` +
  `data/format.ts` (re-export the new read + formatters).
- **New schema:** none — `getByUid` is a read of the existing `calendar_events` table (the rich row
  is already stored verbatim; this ship is its first consumer). No migration.
- **i18n:** new flat keys in `en.json` + `fr.json` (tsc-typed parity, both directions).
- **Tests:** colocated Jest (the rich mapper + getByUid wiring + the two formatters at 90%; the
  screen + tap wiring at the 70% floor); a Maestro reachability assertion (the details route is
  deep-linkable; a real populated render needs seeded synced data the dev harness lacks — same
  limitation `calendar.yaml` already records).
- **Docs:** `calendar.md`, `features.md`, `architecture-changelog.md`. No ADR, no
  `decisions/README.md` change.
- **No route change for existing screens** beyond the new `event-details/[uid]` route + the tap
  wiring. **Observability ➖ N/A** — read-only; a `getByUid` miss is a recoverable accessible
  not-found state, not a crash-worthy throw (Design D7).
