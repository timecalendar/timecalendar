## ADDED Requirements

### Requirement: T09 publishes one complete bounded V1 timeline presentation

The Calendar data seam SHALL publish a `version: 1` presentation containing exactly the previous, committed, and next Day or Week pages for the settled renderer generation. Each page SHALL contain its ordered civil-date columns and every supported event tile belonging to those columns. Page identities and generation SHALL follow the committed anchor synchronously with pager recentering. Until its required local reads resolve, a replacement range SHALL project the last complete event snapshot onto the requested dates without relabeling old events as a new date. Dates outside the retained snapshot SHALL have empty tiles until the read completes. Replacement event data SHALL preserve the requested page identities, and stale completions SHALL be discarded. Superseded page models and query results SHALL be released; no unbounded page cache or permanent full-event JavaScript index SHALL be introduced.

#### Scenario: Swiping does not replay the previous week while a local read is pending

- **WHEN** a swipe settles on either adjacent week and the replacement local read is still pending
- **THEN** that week is immediately the centre page with its already-loaded event tiles
- **AND** resolving the read updates tiles without changing page identities or replaying the swipe

#### Scenario: Settled Week owns three complete populated pages

- **WHEN** a committed Week and its immediate neighbours contain valid ordinary local classes
- **THEN** the V1 presentation contains exactly three page models with the matching ordered display-zone columns and classes
- **AND** every tile belongs to the page/date computed from its interval rather than a recycled pager slot

#### Scenario: Out-of-order completion cannot publish a mixed generation

- **WHEN** a newer anchor or local-data generation supersedes a still-resolving range
- **THEN** the stale completion is discarded and cannot overwrite the newer request
- **AND** retained events remain on their actual dates within the requested pages until one complete replacement snapshot publishes

#### Scenario: Repeated local paging stays bounded

- **WHEN** the student settles many adjacent pages
- **THEN** the renderer retains only the previous, current, and next page plus at most the resolving replacement generation
- **AND** released page event payloads do not accumulate with session length

### Requirement: T09 renders ordinary local timed classes at their clock coordinates

For T09, each supported event SHALL be a positive-duration timed interval contained within one display-zone civil date and not crossing a timezone-offset transition. Its tile SHALL use the validated start/end minute inputs and the live Calendar pixels-per-hour scale to occupy its actual vertical clock range. The tile SHALL show its title, SHALL show location when present, SHALL use a safe event-derived surface color, and SHALL show checklist summary progress when one exists. Title and location SHALL use the same compact text size and line height, with hierarchy expressed through weight. Neither text SHALL impose a line limit or ellipsis; native word/character wrapping SHALL continue until the rounded event surface clips content at its actual time boundary. Each full-column tile SHALL begin flush with its left day boundary, leave two native layout units before the next vertical separator, and use a two-unit corner radius. Tile planning, sorting, formatting, and checklist aggregation SHALL execute only when the complete local presentation changes; a gesture frame SHALL perform only worklet-safe pixel projection from the already validated minute inputs.

#### Scenario: One-hour class appears at the right time

- **WHEN** a valid class named `Maths` with room `B12` spans 10:00–11:00 on one visible display-zone date
- **THEN** its tile begins at the 10:00 grid coordinate, ends at the 11:00 coordinate, and visibly contains `Maths` and `B12`
- **AND** a zoom change keeps both endpoints aligned with the same clock grid without re-reading or re-sorting events per frame

#### Scenario: Ordinary personal event uses the same geometry

- **WHEN** a valid positive-duration personal event falls on a visible date
- **THEN** it receives the same timed-tile geometry and presentation model as a synced class
- **AND** its original `personal` identity remains attached to activation

#### Scenario: Narrow event content wraps without ellipses

- **WHEN** an ordinary event has a title or location wider than its Day or Week column
- **THEN** both fields use the same compact text size and wrap across native word or character boundaries without an ellipsis
- **AND** the rounded tile starts flush with its left day boundary, retains two layout units before the next separator, and clips only at its actual vertical time boundary

#### Scenario: Deferred event shapes are not misdrawn

- **WHEN** a local event is date-only, zero-duration, cross-midnight, or crosses a timezone-offset transition
- **THEN** T09 emits no ordinary timed tile for that event
- **AND** it does not fabricate a positive height, reinterpret midnight as all-day, or corrupt the valid sibling tiles

#### Scenario: Overlap and short-event follow-ups remain explicit

- **WHEN** positive timed events are unusually short or overlap on one date
- **THEN** T09 preserves their validated identity and actual-time inputs without claiming minimum-readable-height or overlap-column behavior
- **AND** deterministic ordering is stable for the later T10/T11 presentation rules

### Requirement: T09 exposes one accessible committed-page event target per tile

The renderer SHALL expose supported tiles on the committed centre page as chronological accessible buttons while keeping adjacent pages, decorative grid nodes, and noncommitted current-time indicators out of the accessibility tree. The committed current-time rule MAY expose its single localized status independently of event traversal. Each tile SHALL expose exactly one localized label containing its full title, formatted time range, optional location, and optional checklist progress exactly once, plus the existing view-details hint. Child title/location/progress visuals SHALL not become duplicate nodes. Visually off-viewport tiles in the bounded committed page SHALL remain mounted and reachable; hidden, cancelled, invalid, unsupported, and invisible-source events SHALL expose no visual or semantic target.

#### Scenario: Screen reader hears the normal tile once

- **WHEN** assistive technology reaches the 10:00–11:00 `Maths` tile in room `B12`
- **THEN** it encounters one button whose label contains the title, full time range, and room once
- **AND** the tile's child text and checklist visual do not repeat those phrases as separate nodes

#### Scenario: Neighbour pages do not duplicate semantics

- **WHEN** the three-page working set contains a recycled copy of a date while paging is unsettled
- **THEN** only the committed centre page's event targets participate in accessibility traversal
- **AND** settlement exposes the destination targets only after the complete presentation commits

#### Scenario: Filtered rows are absent from both representations

- **WHEN** an event is hidden, cancelled, malformed, unsupported by T09, or owned by an invisible source
- **THEN** no tile, accessible button, activation handler, or checklist UID entry is produced for it

### Requirement: T09 activates original identity without changing gesture ownership

Every supported tile SHALL activate the original event UID supplied by the validated data model; page direction, date segment, list position, React key, and recycled slot SHALL never replace that identity. A tile press SHALL be cancelled by vertical scroll, horizontal paging, or pinch ownership according to the existing native gesture hierarchy. Event rendering SHALL add no second pager, vertical scroll owner, responder-based gesture engine, compatibility renderer, network request, or continuous animation loop.

#### Scenario: Tile activation uses the source event

- **WHEN** the student taps a settled synced or personal timed tile
- **THEN** the renderer emits that tile's original UID to the screen-owned activation callback
- **AND** the exact same identity reaches the unified event-details route

#### Scenario: Movement does not accidentally activate a tile

- **WHEN** a touch beginning on a tile becomes a vertical scroll, horizontal page, or pinch
- **THEN** native movement ownership cancels the pending press
- **AND** no event route is pushed during that gesture

#### Scenario: Page navigation remains local offline

- **WHEN** the student pages away from and back to a populated date while offline
- **THEN** only bounded local queries and presentation replacement occur
- **AND** no sync, generated API call, network loader, or event write is started by navigation

### Requirement: T09 proof is range, identity, accessibility, and revision bound

Deterministic proof SHALL cover range planning and half-open boundaries, V1 model completeness, stale-completion rejection, page retention, same-day support classification, stable chronological ordering, actual-time tile geometry across bounded zoom, visible/semantic filtering, composed accessible labels, checklist integration, original-identity activation, press cancellation, and zero network calls on page navigation. Introduced pure range/domain/page logic SHALL have 100% statement and branch coverage. The implementation handoff SHALL record exact commands and results plus initial fabricated row/preparation/retention measurements without claiming representative p50/p95 data. Host automation SHALL NOT claim native assistive-technology, offline device, appearance, or gesture-feel results; the complete canonical owner checklist SHALL remain bound to the exact tested revision and build.

#### Scenario: Ordinary fabricated range is measured without overclaiming

- **WHEN** the T09 fixture populates the previous/current/next pages with ordinary local rows
- **THEN** evidence records queried rows, accepted/rejected counts, page/event retention, and deterministic preparation timing for that fixture
- **AND** it does not describe the sample as representative workload percentiles

#### Scenario: Host evidence remains honest

- **WHEN** local non-device verification completes
- **THEN** it reports pure, repository, hook, component, and screen results only
- **AND** screen-reader quality, physical offline behavior, native gesture cancellation, and appearance remain pending owner/device verdicts

#### Scenario: Owner acceptance identifies the exact result

- **WHEN** T09 is presented for owner acceptance
- **THEN** the handoff names the exact tested commit/PR head, build, fabricated seed/reset steps, command outcomes, and every canonical checklist row
- **AND** feedback is resolved on the same issue and explicit human acceptance precedes Reviewer merge

## MODIFIED Requirements

### Requirement: T03 exposes one complete bounded wall-clock day

The owned Calendar timeline SHALL render explicit 00:00–24:00 wall-clock geometry at the configured pixels-per-hour scale. It SHALL expose every minute of that day through a vertically bounded viewport and draw major hour and minor half-hour lines from the same minute-to-pixel mapping. The visible gutter SHALL omit the clipped 00:00 label and render compact secondary-text hour-start labels from 01:00 through 23:00, without adding a terminal 24:00 label. Vertical day-column separators and major horizontal hour lines SHALL use the same separator token; minor half-hour lines SHALL use a subordinate treatment of that token. The full-day helpers MUST NOT change the existing 07:00–21:00 defaults used by other time-grid consumers.

#### Scenario: Top and bottom of day are reachable

- **WHEN** the student scrolls the timed surface to either vertical limit
- **THEN** the viewport clamps at the start or end of the complete 00:00–24:00 geometry
- **AND** it cannot overscroll into an unbounded blank range after motion settles

#### Scenario: Major and minor geometry shares one scale

- **WHEN** the grid is generated at a supported pixels-per-hour value
- **THEN** hour boundaries and half-hour boundaries appear at their exact minute-to-pixel positions
- **AND** content height, maximum offset, and every line position derive from the same explicit full-day bounds

#### Scenario: Grid hierarchy uses one separator family

- **WHEN** the timeline renders in light or dark appearance
- **THEN** vertical column separators and major horizontal hour lines use the same separator color
- **AND** half-hour lines remain visually subordinate without changing their coordinates

#### Scenario: Existing partial-window defaults remain stable

- **WHEN** an existing consumer calls the time-grid helpers without T03 full-day options
- **THEN** its start and end remain 07:00 and 21:00
- **AND** T03 does not silently widen that consumer's window

### Requirement: T03 hour labels follow explicit device clock preference

The Calendar screen SHALL read the device calendar's nullable `uses24hourClock` value through the installed Expo SDK 56 Localization seam and pass it explicitly to a pure hour-label formatter. The formatter SHALL render 24-hour labels when true, 12-hour labels when false, and the established 24-hour brand format when the platform reports null. The owned gutter SHALL visually render only hour starts 01:00 through 23:00 using compact secondary-text typography; the 00:00 formatter value and midnight geometry SHALL remain available but visually unlabeled. The formatter MUST NOT infer the device preference from app language or read platform globals inside pure formatting code.

#### Scenario: Device requests 24-hour labels

- **WHEN** the explicit device preference is true
- **THEN** the visible gutter renders 01:00 through 23:00 in 24-hour form
- **AND** no AM/PM marker or visible 00:00 label is shown

#### Scenario: Device requests 12-hour labels

- **WHEN** the explicit device preference is false
- **THEN** the visible gutter renders morning, noon, and evening hour starts in 12-hour form with the appropriate day period
- **AND** changing app language alone does not overwrite the supplied device clock choice

#### Scenario: Device preference is unavailable

- **WHEN** the platform returns null for `uses24hourClock`
- **THEN** the formatter and visible 01:00–23:00 gutter labels use the deterministic 24-hour fallback
- **AND** the result does not depend on the test host's locale or timezone

### Requirement: T04 aligns dated headers and clock columns with a non-color Today cue

The owned timeline SHALL render one vertically pinned, clipped date-header viewport beneath the existing native month/year title and above vertical clock motion. The viewport SHALL reserve the same fixed hour-gutter width as the timed surface and SHALL contain previous/current/next visual header slots derived from the same ordered column records as their clock pages. Each slot SHALL render one equal-width cell per visible date. A callable Reanimated event handler attached through an animated PagerView wrapper SHALL project the existing pager's continuous native position and offset into shared values and a UI-thread header-strip transform, so each visual header remains aligned with and moves in the same direction and progress as its clock page without adding another pager, responder, gesture owner, timer, or per-frame JavaScript state write. Each visual header SHALL show the locale's narrow one-letter weekday form above a larger calendar date number, while its accessible label SHALL retain an unambiguous localized weekday and date. Ordinary date text SHALL use a lighter-than-background secondary gray in dark appearance. The effective display-zone date matching Today SHALL use the primary color for its weekday glyph and a fixed, fully circular primary-filled number badge whose number uses the screen background color. The filled circle and typography SHALL provide a non-color distinction, and the cell SHALL expose localized Today semantics without becoming a selectable date control.

#### Scenario: Seven dated columns align

- **WHEN** weekends are enabled at a supported width
- **THEN** the header shows seven equal-width localized Monday-to-Sunday cells beside the gutter spacer
- **AND** each cell aligns with the corresponding vertical clock column on all three bounded pages

#### Scenario: Five dated columns redistribute width

- **WHEN** weekends are disabled at the same width
- **THEN** five equal-width Monday-to-Friday header and clock columns fill the available width
- **AND** no blank Saturday/Sunday lanes, partial week, or horizontal column scroller remains

#### Scenario: Visual weekdays are narrow but semantics stay unambiguous

- **WHEN** the same week renders in a supported system language
- **THEN** each visual cell uses that locale's narrow weekday glyph and a larger day number
- **AND** assistive technology receives the localized short weekday and date rather than an ambiguous repeated letter

#### Scenario: Today is not conveyed by color alone

- **WHEN** one visible column matches the current date in the effective display zone
- **THEN** its number appears inside a fixed fully circular filled badge and its weekday uses primary styling in addition to localized Today semantics
- **AND** changing only locale or device timezone cannot select the wrong display-zone date

#### Scenario: Week headers stay vertically pinned and move with horizontal paging

- **WHEN** the student scrolls vertically or holds an unsettled horizontal page transition
- **THEN** the header remains visible during vertical motion, and horizontal motion carries the source header out while the matching destination header and grid enter together from the pager's native progress
- **AND** the native title, canvas label, Agenda range, committed anchor, and accessible date context remain on the settled revision until an accepted settle

#### Scenario: Pager wrapper receives a callable UI-thread handler

- **WHEN** PagerView delivers fractional forward or backward `onPageScroll` position and offset events
- **THEN** its JavaScript wrapper invokes a callable Reanimated handler and the corresponding shared values drive the header transform on the UI thread
- **AND** React Native `Animated`, `runOnJS`, React state, timers, or an independent animation do not process each frame

#### Scenario: Cancelled horizontal motion recenters one coherent surface

- **WHEN** a drag snaps back, app inactivity cancels motion, the generation is replaced, layout policy changes, or a stale page callback arrives
- **THEN** the header strip and native pager return to the center slot without committing or announcing a different date range
- **AND** no independently animated header, second pager settlement, or obsolete transform remains

### Requirement: T08 shows the current time with a non-color cue

The owned renderer SHALL render a current-time indicator on the clock column whose display-zone date matches the clock's date, with a filled leading cap and rule as a visible shape distinction in addition to any color. It SHALL NOT render a duplicate current-time label in the hour gutter. The indicator on the committed centre page SHALL be the single accessible node for the cue and SHALL carry localized current-time semantics using the same locale, display zone, and device 12/24-hour convention as the hour formatter. The indicator's vertical placement SHALL derive from the live pixels-per-hour scale on the UI thread. The renderer SHALL pass explicit full-day start and end bounds plus the settled dynamic scale to the shared now-position helper, whose 07:00–21:00 defaults SHALL remain unchanged for other consumers. A clock tick or rollover SHALL emit no accessibility announcement.

#### Scenario: The indicator is not conveyed by color alone

- **WHEN** the timeline is inspected in light and dark appearance, without color perception, or through assistive technology
- **THEN** the current-time indicator remains identifiable by its leading cap and rule, and the committed rule exposes one localized current-time label
- **AND** Today retains its filled circular number badge and typography distinction

#### Scenario: Only today's column carries the indicator

- **WHEN** a Week page shows several dates and one of them is today
- **THEN** the indicator spans only that date's column
- **AND** a page containing no today column renders no indicator or current-time accessibility node

#### Scenario: The indicator follows the zoom scale

- **WHEN** the student pinches or uses the zoom commands
- **THEN** the indicator stays at the same clock coordinate as the grid lines and gutter labels at the new scale
- **AND** its position is computed from the shared scale on the UI thread without per-frame React state

#### Scenario: Shared now-position defaults are untouched

- **WHEN** the owned renderer and the Home mini-timeline both read the shared now-position helper
- **THEN** the renderer supplies explicit 00:00–24:00 bounds and its settled scale
- **AND** the helper's default 07:00–21:00 window and Home's existing presentation are unchanged

### Requirement: T08 keeps Today meaning and indicator visibility in agreement

When the display-zone current date is not present among the visible columns, including a weekend date while the weekend preference hides Saturday and Sunday, the renderer SHALL show neither the Today date cue nor the current-time indicator nor its accessibility node. Crossing midnight under that configuration SHALL change nothing but clock meaning: no unsolicited scroll reset, date request, range announcement, or mode change SHALL occur. Weekend preference changes SHALL continue to leave Agenda's range and event facts untouched.

#### Scenario: Hidden weekend removes both signals together

- **WHEN** the clock reads a Saturday or Sunday and weekends are hidden
- **THEN** no visible column is marked Today and no visual or semantic current-time indicator appears
- **AND** the five weekday columns, committed anchor, and settled clock offset are unchanged

#### Scenario: Crossing midnight with weekends hidden is inert

- **WHEN** a hidden-weekend Week surface crosses from Saturday into Sunday
- **THEN** Today meaning and current-time visibility remain absent and in agreement
- **AND** no scroll reset, transition request, announcement, or Agenda-range change occurs

#### Scenario: A non-today page stays unmarked

- **WHEN** the student pages to an adjacent day or week that does not contain today
- **THEN** that page shows no current-time indicator or semantics
- **AND** returning to a committed page containing today restores both without moving the viewport
