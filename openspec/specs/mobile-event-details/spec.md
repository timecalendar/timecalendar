# mobile-event-details Specification

## Purpose

TBD - created by archiving change add-mobile-event-details. Update Purpose after archive.

## Requirements

### Requirement: Rich event-details read over the verbatim row, 90%-gated

The calendar feature `data/` sublayer SHALL own the first consumer of the verbatim `calendar_events`
row (ADR 021): a `getByUid(uid)` read returning the single matching row mapped to a **rich**
`EventDetails` domain type, plus a pure `rowToEventDetails(row)` mapper. The rich type SHALL carry the
fields the lossy rendering `CalendarEvent` drops — `groupColor`, `type`, `exportedAt`, and the **full**
tags as `{ name; color; icon }` (not name-only) — alongside `title`, `color`, `startsAt`/`endsAt`
(`Date`), `location`, `description`, `teachers`, `canceled`, and `userCalendarId`. The mapper SHALL be
pure (no `db`), decode the JSON columns defensively (a corrupt/legacy/unparseable value degrades to a
safe default `[]`/`null` rather than throwing the read), and be unit-tested to the 90% logic threshold.
`getByUid` SHALL import the backend only through the `@/db` seam (B-1) and reuse the already-exported
`eq` operator (no new operator).

#### Scenario: Rich fields survive the read

- **WHEN** a stored `calendar_events` row is mapped to `EventDetails`
- **THEN** the result carries `groupColor`, `type`, `exportedAt` (as a `Date`), and the full
  `tags: { name; color; icon }[]` — the fields the lossy `rowToCalendarEvent` projection drops

#### Scenario: Corrupt JSON column degrades safely

- **WHEN** a row's `tags` / `teachers` / `fields` JSON column holds a corrupt or non-conforming value
- **THEN** the mapper yields a safe default (`[]` / `null` / `false`) for that field and does not throw

#### Scenario: getByUid returns the single row or null

- **WHEN** `getByUid(uid)` is called
- **THEN** it queries `calendar_events` by `uid` through the `@/db` seam and returns the mapped
  `EventDetails` for the matching row, or `null` when no row matches

#### Scenario: The mapper is pure and gated

- **WHEN** `rowToEventDetails` is unit-tested
- **THEN** it runs without a backend, maps every field including null↔undefined, and clears the 90%
  logic gate

### Requirement: Reactive event-details hook with loading and not-found states

The calendar feature `data/` sublayer SHALL expose a reactive `useEventDetails(uid)` hook over the
seam's `useLiveQuery` that resolves the rich `EventDetails` for a uid, re-rendering if a sync replaces
the row while the screen is open, and surfacing a not-found result (no matching row) distinctly from a
loading state.

#### Scenario: Resolves a present event

- **WHEN** `useEventDetails(uid)` is read for a uid present in `calendar_events`
- **THEN** it yields the rich `EventDetails` for that row

#### Scenario: Surfaces not-found

- **WHEN** `useEventDetails(uid)` is read for a uid with no matching row (a stale deep link, or an
  event dropped by a sync's drop+replace)
- **THEN** it yields a not-found result the screen can render as an accessible message (not a throw,
  not a silent blank)

### Requirement: Full date/time formatters, display-only, 90%-gated

The calendar feature `data/` sublayer's date/time formatter SHALL gain two display-only, locale-aware
functions over the existing `date-fns` dependency: an event date+time range (the full date plus the
`HH:mm – HH:mm` range — Flutter `eventDateTimeText`) and a full date-time for the "updated" footer
(Flutter `fullDateTimeText`). They SHALL format only (no parsing, no recurrence), resolve their locale
from the app's i18n locale (FR/EN), use 24-hour time (R-3, matching the agenda formatter), add no new
dependency, and be unit-tested to the 90% logic threshold.

#### Scenario: Event date range is full and locale-aware

- **WHEN** an event's start and end are formatted for the title block in French and English
- **THEN** the result includes the full date (locale-appropriate) and the `HH:mm – HH:mm` time range

#### Scenario: Footer full date-time

- **WHEN** an `exportedAt` timestamp is formatted for the footer
- **THEN** the result is the full date plus the time (locale-aware, 24-hour)

#### Scenario: Display only, pure, no new dep

- **WHEN** the new formatters are unit-tested
- **THEN** they format `Date` inputs without parsing strings or recurrence, clear the 90% gate, and add
  no new dependency to `mobile/package.json`

### Requirement: Not-found state for a missing event

The details screen SHALL render an accessible not-found message when its uid resolves to no
`calendar_events` row, rather than crashing or showing a blank screen.

#### Scenario: Stale or dropped event

- **WHEN** the details screen is opened for a uid with no matching row
- **THEN** it shows a translated not-found message in a polite live region (no crash, no blank screen,
  no `recordError`)

### Requirement: Tap-through from the timeline and agenda views

At the T01 milestone, the existing agenda list SHALL keep its event tiles tappable and SHALL open the unified event-details screen for both synced and personal events. Agenda tiles SHALL remain accessible touchables with translated view-details labels and platform minimum targets. The owned day/week shell SHALL expose no event tiles or event activation until the owned timed-event slice lands. Routing SHALL remain identity-based: both event kinds open `event-details/<uid>`, and personal-event edit/delete remains one tap deeper through the details screen.

#### Scenario: Agenda tile remains a touchable

- **WHEN** the agenda list renders an event tile
- **THEN** the tile is an accessible touchable with a translated label, view-details hint, and platform minimum target

#### Scenario: Tapping a synced agenda event opens details

- **WHEN** a synced event tile in Agenda is tapped
- **THEN** the app navigates to the unified event-details route for that event's uid

#### Scenario: Tapping a personal agenda event opens details

- **WHEN** a personal event tile in Agenda is tapped
- **THEN** the app navigates to the unified event-details route for that event's uid
- **AND** editing remains available from the details screen rather than directly from the tile

#### Scenario: Owned shell does not expose unavailable event activation

- **WHEN** the T01 day/week shell renders
- **THEN** it presents no event tiles, stale activation callback, or silent event press target

#### Scenario: Details return preserves Calendar usability

- **WHEN** the student returns from a fabricated event's details screen
- **THEN** Calendar remains usable and Agenda can be reached again

### Requirement: Deep-linkable details route, thin entrypoint

The details screen SHALL be reachable as a dynamic route `event-details/[uid]` — a thin re-export of
the feature `ui/` screen (route-structure rule), registered as a `Stack` sibling of `(tabs)`, with the
uid as a route param resolved through `getByUid`/`useEventDetails`. It SHALL be deep-linkable
(`timecalendar-dev://event-details/<uid>`).

#### Scenario: Thin route over the feature ui

- **WHEN** the route file is inspected
- **THEN** `src/app/event-details/[uid].tsx` is a one-line re-export of the screen through the feature
  `ui/` sub-barrel, and the screen + its colocated test live under `src/features/calendar/ui/`

#### Scenario: Registered and deep-linkable

- **WHEN** the root layout is inspected
- **THEN** the `event-details/[uid]` route is registered as a `<Stack.Screen>` sibling of `(tabs)` and
  resolves a deep link `timecalendar-dev://event-details/<uid>`

### Requirement: Event-details internationalization and accessibility

Every user-facing string the details screen adds SHALL be translated (FR + EN, no hardcoded strings),
with date strings supplied by the locale-aware formatter (locale data, not catalog copy). The title,
content lines, color swatch, tag bubbles, the not-found message, and the tap targets SHALL be
accessible.

#### Scenario: FR/EN parity for added keys

- **WHEN** the i18n catalogs are typechecked
- **THEN** every new event-details key (the screen title, content/section labels, the "updated" prefix,
  the not-found message, the tap a11y label) exists in both `en.json` and `fr.json` (bidirectional
  `tsc` parity)
- **AND** no user-facing string is hardcoded (date strings come from the formatter)

#### Scenario: Accessible title, swatch, lines, and tags

- **WHEN** the details screen renders
- **THEN** the title carries a heading role, the color swatch is accessibly labeled (not a silent
  node), each content line conveys its text to assistive tech with any icon treated as decorative, and
  tag bubbles expose their names

### Requirement: Event-details wiring proven in CI, populated render on-device

The change MUST prove the rich mapper, the `getByUid` read shape, the new formatters, the screen's
row→sections rendering (including the not-found state), and the tap-through routing by Jest, and MUST
record the real populated details render on both platforms as part of the calendar surface's on-device
manual pass (the dev harness seeds no synced event reachable by deep link).

#### Scenario: Screen and tap wiring proven without seeded data

- **WHEN** the screen test renders the details screen for a fixture rich event and presses a tile
- **THEN** the title, formatted date, tags, content lines, and footer render with translated/formatted
  text (not raw keys), the not-found state renders for a missing uid, and a tile press fires the router
  push with the origin-correct route (details for a synced event, the form for a personal event)

#### Scenario: Maestro asserts reachability

- **WHEN** the Maestro calendar flow exercises the tap target / a deep link to the details route
- **THEN** the details route is reachable (the screen mounts; with no seeded synced event it shows the
  screen chrome / the not-found state) — the real populated render is the on-device manual pass

#### Scenario: Populated render folded into the calendar on-device pass

- **WHEN** the change is reviewed for the performance and native-correctness DoD axes
- **THEN** the details screen (title block, tags with color, content lines, footer, the back
  affordance) on real synced data is covered by the calendar surface's existing inboxed on-device pass

### Requirement: Event-details observability is N/A for this read-only surface

The event-details READ surface SHALL NOT record to Crashlytics, because it has no crash-worthy
write/throw path (a `getByUid` miss is a recoverable not-found state and a corrupt column degrades
safely). Any WRITE the screen triggers — the hide / un-hide visibility action — SHALL carry its own
observability posture owned by the `mobile-hidden-events` capability (a failed write is recorded through
`@/firebase` `recordError`).

#### Scenario: The read surface has no write path to record

- **WHEN** the event-details read surface (rich read, formatters, render, not-found) is reviewed for
  observability
- **THEN** it has no crash-worthy throw of its own (a not-found uid is a recoverable accessible state,
  mirroring the day/week timeline and the agenda read path)

#### Scenario: The hide action's observability is owned by hidden-events

- **WHEN** the hide / un-hide action on the screen writes the hidden set
- **THEN** its failure is recorded through `@/firebase` `recordError` per the `mobile-hidden-events`
  capability (the screen does not silently swallow a hide-write failure)

### Requirement: The event-details screen renders both synced and personal events behind one read seam

The event-details screen SHALL render BOTH a synced event (a `calendar_events` row) AND a personal
event (a `personal_events` row) behind one widened read (`useEventDetails(uid)` / `getByUid(uid)`
resolving either kind for the uid). The read SHALL return a discriminated result tagging the event
kind (`"synced"` / `"personal"`); the personal branch SHALL fill the fields a personal event lacks
with safe defaults (group color = color, empty tags/teachers, empty `userCalendarId`). The screen
SHALL render the shared title block, formatted date/time, content lines, and footer for both kinds.
This widens the previously synced-only details surface (which built `EventDetails` only from a
`calendar_events` row) so that personal events also have a details surface (Flutter parity — both
`EventInterface` open the same screen). The title block (labeled color swatch + heading + formatted
full date/time), the tag bubbles, the content lines (location / calendar name with 2+ calendars /
teachers / description — each only when present), the "updated" footer, and the `@/theme`-derived
theming (R-3) of the prior synced-only requirement are preserved here for both kinds.

#### Scenario: A synced event renders its rich details

- **WHEN** the details screen is opened for a synced event's uid
- **THEN** the rich `calendar_events` row is read and the title / date / tags / lines / footer render
  (the existing read-only behavior is preserved)

#### Scenario: A personal event renders its details

- **WHEN** the details screen is opened for a personal event's uid
- **THEN** the `personal_events` row is read and the title / date / location / description render,
  with the personal-event safe defaults for the sync-only fields

#### Scenario: A not-found uid still renders the accessible not-found state

- **WHEN** the uid resolves to neither a synced nor a personal event
- **THEN** the accessible not-found state renders (not a crash or a blank)

### Requirement: The event-details screen surfaces an interactive checklist for both event kinds

The event-details screen SHALL render the interactive checklist section (the `event-checklists`
feature's component) for BOTH event kinds, keyed on the event uid. This lands the "edit half" of event
details that Phase 04 deferred: the checklist is the first interactive (write-capable) section on the
previously read-only details screen.

#### Scenario: The checklist renders for a synced event

- **WHEN** the details screen renders a synced event
- **THEN** the checklist section appears below the event details, joined on the event uid

#### Scenario: The checklist renders for a personal event

- **WHEN** the details screen renders a personal event
- **THEN** the checklist section appears, joined on the personal event's uid

### Requirement: The event-details header actions are origin-keyed — hide/un-hide for synced, Edit for personal

The event-details screen SHALL show origin-keyed header actions. For a SYNCED event it SHALL keep the
hide / un-hide action (Phase 05 Ship A). For a PERSONAL event it SHALL show an **Edit** action that
navigates to the personal-event edit form (`/personal-event-form?uid=<uid>`), so the personal-event
edit/delete flow stays fully reachable from the unified details surface (relocated one tap, not
dropped). The two header actions SHALL be mutually exclusive by kind.

#### Scenario: A synced event offers hide/un-hide

- **WHEN** the details screen renders a synced event
- **THEN** the header offers the hide / un-hide action (and no Edit action)

#### Scenario: A personal event offers Edit

- **WHEN** the details screen renders a personal event
- **THEN** the header offers an Edit action that opens the personal-event edit form (and no
  hide/un-hide action)

#### Scenario: Edit reaches the form

- **WHEN** the user taps Edit on a personal event's details
- **THEN** the personal-event edit form opens for that uid (create/edit/delete of the event itself
  stays reachable)

### Requirement: Event-details orchestration is focused and directly verifiable

The exported `EventDetailsScreen` React function SHALL remain below 200 lines and SHALL express loading, resolved not-found, and resolved-event outcomes as straightforward top-level control flow. Header action selection, async state presentation, and rich event content SHALL live in focused calendar `ui/` modules that preserve the existing sublayer dependency direction. Internal extracted modules SHALL NOT widen the calendar feature's public API beyond the existing `EventDetailsScreen` export.

The decomposition SHALL preserve the complete unified event-details behavior: synced visible events offer the hide chooser; synced hidden events offer unhide; personal events offer Edit; both event kinds render the rich details and checklist; loading and not-found retain their accessible translated states. Header actions SHALL retain their exact persistence and navigation timing, and content SHALL retain calendar-name threshold/fallback, locale/display-zone/all-day formatting, translations, accessibility semantics, test IDs, and visual layout.

#### Scenario: Loading remains a direct screen outcome

- **WHEN** the rich event read is still loading
- **THEN** the screen renders the translated accessible loading state with the standard header
- **AND** it does not render the not-found state or resolved content

#### Scenario: Not found remains a direct screen outcome

- **WHEN** loading has completed and neither event source resolves the uid
- **THEN** the screen renders the translated accessible not-found state with the standard header
- **AND** it does not expose a synced or personal header action

#### Scenario: Synced visible behavior is preserved

- **WHEN** a resolved synced event is absent from both hidden-event sets
- **THEN** the header exposes the existing hide action and native uid/name chooser
- **AND** choosing either hide mode navigates back only when that persistence call succeeds
- **AND** a failed write keeps the screen mounted with the accessible hide error notice

#### Scenario: Synced hidden behavior is preserved

- **WHEN** a resolved synced event's uid, name, or both are present in hidden-event state
- **THEN** the header exposes the existing unhide action
- **AND** activating it removes every matching uid/name entry without navigating away

#### Scenario: Personal behavior is preserved

- **WHEN** a resolved personal event renders
- **THEN** the header exposes Edit and no hide/unhide action
- **AND** Edit pushes `/personal-event-form?uid=<event uid>`
- **AND** the personal event's rich details and checklist remain mounted

#### Scenario: Rich content contracts survive extraction

- **WHEN** either event kind renders through the extracted content boundary
- **THEN** title, color, tags, optional content lines, updated footer, and checklist retain their current ordering, translations, accessibility semantics, and styling
- **AND** calendar name appears only with at least two held calendars and uses the whitespace-safe fallback
- **AND** locale, display zone, and all-day values continue through the existing formatters

#### Scenario: Extracted modules remain feature-internal

- **WHEN** the calendar UI barrels and imports are inspected
- **THEN** routes and cross-feature consumers continue to import only the existing `EventDetailsScreen` public surface
- **AND** extracted modules use the feature's sibling sublayer barrels without introducing a cycle or direct infrastructure import

### Requirement: Event-details maintainability diagnostics are resolved or evidence-classified

The implementation SHALL run React Doctor in verbose changed-file scope after the decomposition. The `EventDetailsScreen` high-control-flow-complexity finding SHALL be absent. Manual memoization SHALL be removed from the changed screen UI only when it has no semantic referential-identity or measured performance role; memoization outside the changed UI remains out of scope. Every remaining changed-file finding SHALL be classified with code and contract evidence and SHALL NOT be hidden by configuration or suppression.

The tag renderer SHALL preserve every tag occurrence, including identical duplicates. It SHALL NOT use tag name alone as identity because the generated `EventTag` contract exposes only `name`, `color`, and `icon` and establishes no unique field. A stable domain identifier SHALL be used only if uniqueness is proven from the committed contract and data path; otherwise an occurrence-aware presentation identity MAY remain as a documented React Doctor limitation because the tag bubbles hold no local state.

#### Scenario: High complexity is removed

- **WHEN** React Doctor scans the changed event-details files after implementation
- **THEN** it does not report `EventDetailsScreen` for high React-function control-flow complexity
- **AND** the exported screen function is below 200 lines

#### Scenario: Changed-file findings are classified rather than suppressed

- **WHEN** React Doctor reports any other diagnostic in a changed file
- **THEN** the PR and handoff identify it as resolved, false positive, or evidence-backed limitation with the relevant code/contract reason
- **AND** no React Doctor configuration, ignore, or suppression is added for this refactor

#### Scenario: Duplicate tags are not collapsed

- **WHEN** an event contains two tags with the same name, color, and icon
- **THEN** both tag bubbles render
- **AND** the implementation does not claim that name or the available composite fields are a unique domain identifier

#### Scenario: Memoization removal stays bounded

- **WHEN** the changed event-details UI is reviewed for manual memoization
- **THEN** only memoization with no semantic or measured performance role is removed under the enabled React Compiler
- **AND** memoization in unchanged data, renderer, checklist, and other feature modules is not broadened into this change

### Requirement: Every event-details outcome uses one readable lane

Event details SHALL place loaded content, loading, missing/not-found, recoverable error content, and the resolved event checklist in one `readable` lane measured inside the existing safe-area/presentation owner. The surface SHALL remain one column at every supported portrait width and SHALL preserve the existing title → metadata → event action → checklist source and accessibility order.

#### Scenario: Loaded details and checklist stay readable on tablet

- **WHEN** a synced or personal event resolves at a portrait-tablet owner width
- **THEN** its title, date, tags, metadata, update text, action feedback, and checklist align within the centered readable lane
- **AND** checklist CRUD and event hide/unhide-or-edit behavior remain unchanged

#### Scenario: Loading and missing states share the lane

- **WHEN** event details are loading or the requested event is missing
- **THEN** the accessible status content is constrained by the same readable lane used by loaded content
- **AND** the existing live-region and status semantics are preserved

#### Scenario: Large text retains one ordered column

- **WHEN** font scaling stresses the details content at 834 or a wider owner
- **THEN** content remains a wrapping one-column readable lane
- **AND** source and focus order are not changed by the eligible optional-column breakpoint

#### Scenario: Compact details behavior is preserved

- **WHEN** the details owner reports a width below 600
- **THEN** loaded and status content use compact readable-lane gutters
- **AND** routing, scrolling, actions, metadata, and checklist behavior remain unchanged
