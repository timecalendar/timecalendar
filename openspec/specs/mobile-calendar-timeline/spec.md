# mobile-calendar-timeline Specification

## Purpose

TBD - created by archiving change add-mobile-calendar-timeline. Update Purpose after archive.
## Requirements
### Requirement: GestureHandlerRootView mounted at the app root

The app root layout SHALL retain `GestureHandlerRootView` from the already-present `react-native-gesture-handler` package as the outermost wrapper for the Expo 56 runtime and existing/future owned gesture consumers. The wrapper SHALL NOT be documented or tested as a calendar-kit requirement.

#### Scenario: Root layout retains the gesture owner

- **WHEN** `src/app/_layout.tsx` is inspected
- **THEN** a `GestureHandlerRootView` with a flex-filling style wraps the provider/Stack tree
- **AND** no comment or test claims that calendar-kit owns the wrapper

### Requirement: Salvaged overlap-layout engine, pure and 90%-gated

The feature `data/` sublayer SHALL own a pure overlap-layout function (ported + validated in the spike
from the Flutter `EventForUI.listFromEvents`) that packs overlapping intervals into the minimum
unbounded number of columns and assigns fractional horizontal positions. It SHALL be unit-tested to the
90% logic threshold and SHALL import no React, no calendar-kit, no `@/db`, and no translation function.

#### Scenario: Disjoint intervals share one column

- **WHEN** non-overlapping intervals are laid out
- **THEN** each gets `columns = 1` and spans the full width (`startX = 0`, `endX = 1`)

#### Scenario: Classic three-way overlap splits into exact thirds

- **WHEN** three mutually overlapping intervals A/B/C are laid out
- **THEN** they are placed in three columns and each spans exactly one third of the width

#### Scenario: Five-way cluster packs into five even columns

- **WHEN** five mutually overlapping intervals are laid out
- **THEN** they pack into five columns, each one fifth of the width

#### Scenario: A freed column is reused

- **WHEN** an interval ends before a later overlapping interval starts in the same cluster
- **THEN** the later interval reuses the freed column rather than forcing a new one

#### Scenario: The engine is pure

- **WHEN** the engine is unit-tested
- **THEN** it runs without rendering, without a backend, and without a camera/clock, and clears the 90% logic gate

### Requirement: Salvaged time-grid math, pure and 90%-gated

The feature `data/` sublayer SHALL retain pure time-grid math: minute-to-pixel position given pixels-per-hour and a day start-minute, event pixel height from duration, an hour-label list for an explicit window, and now-indicator position. The existing Flutter-parity constants and defaults (07:00–21:00 window, 60px/hour default, 50px hours column, 20px minimum tile width) SHALL remain named and unchanged. T03 SHALL add explicit 00:00–24:00 bounds plus pure content-height, major/minor boundary, maximum-offset, and clamp behavior without making full-day values implicit defaults. Existing pure logic SHALL retain its 90% gate; branches and arithmetic introduced for T03 SHALL have 100% statement and branch coverage and property/boundary proof. The module MUST import no React, renderer, platform localization, or device state.

#### Scenario: Minute maps to pixel

- **WHEN** a time in minutes-from-midnight is converted with a given pixels-per-hour and day start-minute
- **THEN** the returned pixel offset is `(minutes - startMinute) / 60 * pixelsPerHour`

#### Scenario: Legacy hour labels span their explicit window

- **WHEN** the existing hour-label list is requested for the 07:00–21:00 window or with no options
- **THEN** it lists each hour boundary from the start hour to the end hour inclusive
- **AND** its default behavior is unchanged by T03

#### Scenario: Full-day geometry includes its closing boundary

- **WHEN** T03 full-day geometry is requested
- **THEN** its content and line coordinates span minute 0 through minute 1440
- **AND** its visible hour-start labels span hours 0 through 23 without a duplicate terminal label

#### Scenario: Vertical offset clamps for every viewport size

- **WHEN** an offset is below zero, inside the scrollable extent, above the maximum, or the viewport is at least as tall as the content
- **THEN** the pure clamp returns respectively zero, the same valid offset, the maximum, or zero

#### Scenario: Now-indicator position

- **WHEN** the current time falls within an explicit grid window
- **THEN** the now-indicator's pixel and fractional position match the minute-to-pixel mapping for that time

#### Scenario: The math is pure and fully covers introduced arithmetic

- **WHEN** time-grid tests run without rendering, backend, clock, locale, or device access
- **THEN** retained logic clears its existing gate and every T03-introduced statement and branch is covered

### Requirement: Domain CalendarEvent type and events-source seam

The feature `data/` sublayer SHALL expose a `CalendarEvent` domain type (exposing `Date` timestamps and
a `#RRGGBB` color, with the sync-model fields designed in) and a single events-source hook
`useCalendarEvents(range)` returning `CalendarEvent[]` filtered to the range. The seam SHALL be the only
place the calendar's event source is determined, so calendar sync (a later ship) plugs in by swapping
only the source.

#### Scenario: CalendarEvent exposes domain types

- **WHEN** the `CalendarEvent` type is inspected
- **THEN** `startsAt`/`endsAt` are `Date`, `color` is a `#RRGGBB` string, and the sync-model fields (`allDay`, `teachers`, `tags`, `canceled`, `location`, `description`, `userCalendarId`) are present so the sync ship maps onto it without a shape change

#### Scenario: This ship feeds the seam from a fixture plus personal events

- **WHEN** `useCalendarEvents(range)` runs in this ship
- **THEN** it returns events drawn from a committed dense-week fixture merged with the existing personal-events read, mapped to `CalendarEvent` and filtered to the range
- **AND** no `calendar_events` table is created or read (that is the later sync ship)

#### Scenario: Range filtering

- **WHEN** a range `{ from, to }` is passed
- **THEN** only events intersecting the range are returned

#### Scenario: Sync plugs in behind the unchanged seam

- **WHEN** the later sync ship lands
- **THEN** it swaps `useCalendarEvents`'s source to the synced rows without changing the hook signature, the `CalendarEvent` shape, or any consumer

### Requirement: Day/week timeline screen as a brand surface

At the T04 milestone, the feature `renderer/` sublayer SHALL provide a horizontally paged, vertically scrollable empty owned week surface on the real Calendar route as a designed brand surface themed from `@/theme` tokens. It SHALL retain the native month/year title, complete previous/current/next empty pages, labelled screen-reader one-week actions, complete clock grid, and one pinned left gutter while adding localized dated day headers and five/seven aligned columns without importing a vendor renderer. Timeline events, current-time indicator/positioning, distinct day behavior, event activation, and zoom SHALL remain absent until their numbered slices land.

#### Scenario: Owned dated full-day shell renders on the real route

- **WHEN** `timecalendar-dev://calendar` is opened
- **THEN** the native title, dated header, bounded paged lanes, pinned gutter, and vertically scrollable complete-day grid render through the existing thin Calendar route
- **AND** no calendar-kit, fallback, compatibility, or duplicate renderer mounts

#### Scenario: Brand surface uses owned tokens

- **WHEN** the T04 shell renders in a supported theme
- **THEN** its surface, Today cue, borders, lines, labels, text, and navigation presentation derive from `@/theme` and shared semantic primitives

#### Scenario: Later timeline capabilities remain absent

- **WHEN** the T04 shell is inspected or exercised
- **THEN** it contains no event/all-day tiles, current-time indicator or initial-now positioning, distinct day behavior, date-selection action, event activation, or zoom

#### Scenario: Empty motion has no event write path

- **WHEN** the paged and scrolled dated shell is used
- **THEN** it neither reads events for presentation nor mutates or rewrites synced or personal event facts

### Requirement: Internationalization and accessibility

Every user-facing string added or retained on the T04 Calendar and Settings surfaces SHALL be translated in French and English with typed key parity. Numeric date labels SHALL use the pure locale/display-zone formatting seam, and hour labels SHALL use the pure explicit device-clock formatter rather than translation keys. The native month/year title SHALL remain the sole page header; the committed weekday/date row SHALL be chronological readable content beneath it, not a second page title or set of selectable controls. The canvas SHALL expose one committed locale- and display-zone-aware week label with translated increment/decrement actions. Today SHALL have localized semantics and a non-color cue. Neighbour pages, decorative boundaries, and duplicate gutter semantics SHALL not create additional focus contexts. Only an accepted changed-week settle SHALL announce the destination once; preference changes, vertical movement, intermediate motion, and recycled pages SHALL not announce a week.

#### Scenario: French and English dated headings

- **WHEN** the same launch week renders in French and English
- **THEN** every committed day cell uses the corresponding localized weekday/date and effective display zone
- **AND** neither catalog exposes a raw translation key or omits the Settings switch label

#### Scenario: One committed week context is accessible

- **WHEN** assistive technology traverses the settled T04 shell
- **THEN** it encounters one adjustable committed week context followed by chronologically ordered visible date labels
- **AND** recycled pages, grid boundaries, and repeated gutter content do not expose duplicate headings or canvas targets

#### Scenario: Settings switch describes its state

- **WHEN** assistive technology traverses the Calendar section of Settings
- **THEN** Show weekends is exposed as one translated switch with its current checked state and a valid platform target
- **AND** changing it produces the same persisted five/seven-column result as touch interaction

#### Scenario: Vertical movement preserves settled semantics

- **WHEN** the student scrolls vertically without changing week
- **THEN** the date row, canvas label, and native title continue to name the committed week
- **AND** no date announcement is emitted

#### Scenario: Settled week context is announced once

- **WHEN** the committed week changes after an accepted horizontal swipe or control action
- **THEN** its localized date context is announced once
- **AND** weekend toggles, transient movement, cancellation, or obsolete completion is not announced as a week change

### Requirement: Wiring proven in CI grid and performance on-device

The change MUST prove complete-day geometry, native settled-offset retention, explicit clock formatting, native scroll/pager ownership, five/seven civil-date derivation, dated header/grid alignment, Today identity, default/persisted preference behavior, bounded seven-day paging, localized settled semantics, Calendar remount and Week/Agenda restoration, unchanged Agenda dates, retained event activation, revision rejection, and current owned-renderer integrity with focused Jest and repository checks. The changed-code React Doctor scan MUST report no blocking warning or error in the renderer without suppression, gate weakening, compiler opt-out, or moving the same issue behind an alias. The implementation MUST preserve the three established Maestro journeys and their shared Agenda helper. Native readability, Dynamic Type, header/grid alignment, gesture continuity, preference restart, VoiceOver/TalkBack traversal, and retained Calendar/Agenda checks SHALL be recorded through the ticket's testable build and owner checklist rather than claimed from this host.

#### Scenario: Dated columns are proven without a vendor mock

- **WHEN** focused pure, preference, renderer, Settings, and Calendar suites run
- **THEN** they exercise five/seven civil dates, weekend identity, default/false/true persistence, Today identity, equal column structure, locale/zone labels, native owner configuration, pager settlement, and retained vertical offset
- **AND** they require no calendar-kit Jest setup, fallback renderer, handwritten worklet runtime, host-locale assumption, or device-local date arithmetic

#### Scenario: Callable Reanimated progress is proven at the PagerView boundary

- **WHEN** the focused renderer suite delivers fractional page-scroll events through the actual prop retained by the supported PagerView mock
- **THEN** that prop is callable and its Reanimated shared values/style project forward and backward header motion before settlement
- **AND** cancellation and replacement paths recenter the same values without committing or announcing a week

#### Scenario: Retained paging, Agenda, and details wiring is proven

- **WHEN** the Calendar screen suite hides weekends, pages, switches to Agenda and back, and activates a fabricated weekend event
- **THEN** paging advances seven civil dates, Week retains its clock offset, Agenda retains its seven-day range, and the existing unified event-details route receives that event identity

#### Scenario: Owned renderer footprint remains coherent

- **WHEN** source, storage classification, dependency, Jest, coverage, lint, formatting, changed-code React Doctor, Maestro harness, and repository-contract checks run
- **THEN** the renderer is split into bounded feature-private coordination and passive presentation units and the changed-code scan reports no blocking diagnostic
- **AND** no React Native `Animated`, manual-memoization workaround, vendor, alternate pager/scroll path, fallback, compatibility, duplicate renderer, suppression, or unrelated sensitive-surface change appears

#### Scenario: Native evidence is not fabricated

- **WHEN** local verification completes on the non-virtualized development host
- **THEN** it records deterministic automated results without claiming native readability, restart, layout, gesture, or assistive-technology execution
- **AND** the testable build identifies the revision and exact T04 device checklist still awaiting owner verification

### Requirement: Observability is N/A for this read-only surface

This read-only rendering surface has no crash-worthy write/throw path, so the Observability DoD axis MUST
be marked N/A with a recorded reason, and the app SHALL NOT import `@react-native-firebase/*` directly
anywhere it adds.

#### Scenario: No write path to record

- **WHEN** the change is reviewed for the Observability DoD axis
- **THEN** it is marked N/A because the surface only reads and renders (a failed read is a recoverable UI state, not a recorded crash) — mirroring the school-selection read path

### Requirement: Calendar day and week retain full-bleed renderer ownership

The T01 owned shell SHALL receive the complete positive width and height of the existing Calendar content owner without an Agenda responsive cap. Agenda SHALL retain its measured standard lane. Existing platform-owned header structure and the working Add action SHALL remain outside the renderer, while controls for capabilities absent at this milestone SHALL not remain enabled.

#### Scenario: Owned canvas fills its owner

- **WHEN** the shell renders at phone or portrait-tablet width
- **THEN** its canvas fills the Calendar content owner without a responsive gutter or content cap

#### Scenario: Agenda retains its measured lane

- **WHEN** Agenda is selected
- **THEN** its headers, states, and rows remain in the existing measured standard lane
- **AND** its grouping, refresh, checklist, and event-press behavior remain unchanged

#### Scenario: Platform Calendar chrome remains screen-owned

- **WHEN** the T01 shell renders
- **THEN** the native header, working Add action, and working view selector remain owned by the Calendar screen
- **AND** the owned renderer exports no imperative chrome or navigation API

### Requirement: T01 exposes a stable owned Calendar shell

The Calendar day/week branch SHALL render a feature-owned React Native surface with the native month/year title and a stable positive-size canvas. The committed week date SHALL be exposed as an adjustable canvas label, use the effective display zone and active French or English locale, and remain correct across Calendar mount/unmount and tab leave/return. The shell SHALL render no timeline events and SHALL NOT represent that intentional absence as an empty local-data result.

#### Scenario: Calendar opens the owned shell

- **WHEN** the student opens Calendar in the shell mode
- **THEN** the native month/year title and owned canvas render without a crash
- **AND** the committed week is discoverable as the adjustable canvas label

#### Scenario: Calendar returns to a stable shell

- **WHEN** the Calendar screen unmounts and mounts again, or the student leaves its tab and returns
- **THEN** the native title and owned canvas render again without stale vendor state or duplicate renderers

#### Scenario: Stored events are not misreported as absent

- **WHEN** local events exist while T01's shell is active
- **THEN** the shell renders no event tiles by design
- **AND** it does not claim that the underlying event collection is empty
- **AND** the same events remain available through Agenda

### Requirement: T01 retains only working Calendar controls

Every enabled Calendar control at the T04 milestone SHALL produce an observable supported result. The view selector SHALL expose the dated full-day Week surface and Agenda; it SHALL NOT expose a Day/Week switch before T05 implements distinct day behavior. Add, Week/Agenda selection, one-week previous/next, Today, vertical scrolling, Settings weekend visibility, Agenda refresh/retry, and Agenda event activation SHALL preserve localized accessibility behavior. Today SHALL resolve and commit the launch week containing the current display-zone date through the same coherent date path and SHALL preserve the settled clock offset because current-time positioning belongs to a later slice.

#### Scenario: View choices are implemented

- **WHEN** the student opens the Calendar view selector
- **THEN** every offered choice renders a distinct working surface
- **AND** no enabled choice silently does nothing

#### Scenario: T04 exposes only implemented timeline behavior

- **WHEN** the T04 week surface renders
- **THEN** it offers dated five/seven-day presentation, bounded vertical time scrolling, and labelled previous/next one-week actions
- **AND** it offers no date selection, day/week switching, zoom, current-time positioning, or event activation

#### Scenario: Retained and movement controls remain accessible

- **WHEN** the student uses a retained Calendar, paging, vertical, or weekend-visibility interaction
- **THEN** every action has a translated or correctly formatted accessible presentation and an observable supported result
- **AND** every visible retained control preserves its platform minimum target

#### Scenario: Today commits the current launch week without inventing vertical behavior

- **WHEN** Today is available from a non-current week and the student activates it
- **THEN** the selected date and paged surface settle on the complete launch week containing today in the effective display timezone
- **AND** the established clock offset is preserved rather than moved to current time

### Requirement: T02 pages exactly one complete launch week

The owned Calendar week surface SHALL resolve its committed date to the week containing that date under an explicit first-weekday policy, with Monday supplied for the first delivery in every locale and display timezone. One horizontal swipe, fling, previous action, or next action SHALL settle at either the current week or exactly one adjacent complete week. Week arithmetic MUST use display-zone calendar days and MUST NOT add or subtract fixed 24-hour durations.

#### Scenario: Swipe settles one adjacent week

- **WHEN** the student completes a qualifying horizontal swipe or fling in either direction
- **THEN** the surface settles on exactly the preceding or following complete launch week
- **AND** fling speed never skips a second week or leaves a partial week settled

#### Scenario: Cancelled movement returns to the current week

- **WHEN** movement does not qualify for a page change or is reversed back before release
- **THEN** the surface settles on the current committed week
- **AND** the selected date, native title, and canvas label remain unchanged

#### Scenario: Week policy is explicit

- **WHEN** a date is normalized or shifted for paging
- **THEN** the caller supplies the first-weekday policy explicitly
- **AND** the launch policy resolves complete Monday-first weeks without deriving week start from locale, device region, or display timezone

#### Scenario: Civil-week arithmetic crosses boundaries

- **WHEN** paging crosses a month, year, daylight-saving gap, or daylight-saving repeat in the effective display timezone
- **THEN** the destination remains the policy week's local midnight anchor exactly seven calendar days away
- **AND** no fixed-duration drift changes the local date or time

### Requirement: T02 commits one revisioned settled week context

The Calendar controller SHALL remain the authority for the committed week date, native title, and canvas label. During finger-held or interrupted movement, the committed selected date, native title, and canvas accessibility context SHALL continue to represent the old settled week. An accepted destination acknowledgement SHALL publish the destination page position, selected date, native title, dependent Agenda range, renderer generation, and canvas accessibility context together. Each transition revision SHALL be accepted at most once; cancelled, duplicate, or stale acknowledgements MUST NOT change committed state.

#### Scenario: Held drag preserves the old heading

- **WHEN** the student drags a week partway and holds without settling
- **THEN** the native title and canvas accessibility label and the selected date continue to name the original committed week
- **AND** no intermediate date is announced

#### Scenario: Accepted settle commits one coherent destination

- **WHEN** the current transition revision finishes on an adjacent page
- **THEN** the page position, selected date, native title, canvas accessibility label, and Agenda range change to the same destination week in one accepted commit
- **AND** no wrong-date, unexplained blank, or partial settled frame is exposed

#### Scenario: Obsolete completion is discarded

- **WHEN** an acknowledgement belongs to a cancelled, superseded, or already accepted transition revision
- **THEN** it does not change the committed week, native title, canvas label, range, renderer generation, or announcement count

#### Scenario: Today and retained direct dates resolve to whole weeks

- **WHEN** the existing Today action or retained one-shot focus date selects a date while Week is active
- **THEN** the committed week anchor becomes the complete policy week containing that date
- **AND** the surface never rests on a seven-day interval that straddles two launch weeks

### Requirement: T02 keeps a bounded three-page working set

The horizontal renderer SHALL mount only the committed week and its immediate predecessor and successor. It MAY retain at most one pending replacement generation while motion or a committed-anchor replacement is in progress. Superseded generations SHALL be released, and repeated paging SHALL NOT increase retained page, gesture, timer, or completion work with session length.

#### Scenario: Adjacent pages cover active movement

- **WHEN** a horizontal interaction begins from a settled week
- **THEN** complete previous, current, and next empty pages are available for movement
- **AND** no fourth settled or cache page is mounted

#### Scenario: Settle replaces the working set without a visual jump

- **WHEN** an adjacent destination is accepted
- **THEN** the renderer rebuilds the same three slots around the new committed week at the already-visible cumulative page position without a post-commit transform jump or unexplained blank page
- **AND** no more than one replacement generation remains pending

#### Scenario: Long paging remains bounded

- **WHEN** the student pages forward and backward repeatedly
- **THEN** the retained page count remains three after every settle
- **AND** cancelled or superseded generations do not accumulate

### Requirement: T02 paging is operable and announces only settled context

The Calendar week surface SHALL expose translated previous-week and next-week accessibility actions as decrement/increment on the adjustable canvas. Each action SHALL enter the same one-page revisioned transition path as a swipe. No separate full-date row or visible arrow toolbar SHALL render. One vertically pinned localized weekday/date strip SHALL render beneath the native month/year title and move from the same native page-scroll progress as the clock pages. Its current slot SHALL remain the sole accessible committed date row until settlement. Development builds SHALL show per-week preview labels, measured viewport bounds, and stable contrasting tints within the moving pages; production builds SHALL omit these diagnostics. Only an accepted changed-week settle SHALL announce the localized destination week once. Adjacent recycled pages MUST NOT create duplicate native focus trees, and reduced-motion operation SHALL settle without nonessential travel animation.

#### Scenario: Previous and next actions move one week

- **WHEN** the student activates the labelled previous-week or next-week action
- **THEN** the corresponding adjacent week is requested through the same revisioned settle path as a swipe
- **AND** the action remains operable without performing a gesture

#### Scenario: One accepted settle produces one announcement

- **WHEN** a current transition revision settles on a different week
- **THEN** the localized settled week, centered header slot, and dated columns update and the week is announced exactly once
- **AND** finger movement, snap-back, cancellation, stale completion, duplicate delivery, and preference changes produce no extra week announcement

#### Scenario: Recycled neighbours are not duplicate semantics

- **WHEN** assistive technology traverses the settled Calendar week
- **THEN** it encounters one adjustable committed week context with labelled paging actions and one chronological committed date row
- **AND** moving previous/next visual slots are hidden from the accessibility tree until their week becomes the centered committed generation

#### Scenario: Reduced motion settles directly

- **WHEN** reduced motion is enabled and a week change is requested
- **THEN** the same destination is committed and announced through the revisioned path without nonessential travel animation

### Requirement: T02 paging evidence is tied to the tested revision

The change MUST prove pure week arithmetic, transition idempotence, three-page retention, renderer and Calendar wiring, retained Agenda/T01 behavior, and owned-renderer repository integrity with focused automated checks. Its testable build evidence SHALL identify the exact revision, build/runtime, fabricated fixture, device and OS, active refresh rate for timing claims, and observed held-drag, fast-fling, reversal, control, announcement, frame, and retained-generation outcomes. Automated results MUST NOT be presented as proof of native feel or assistive-technology behavior.

#### Scenario: Focused automation covers deterministic behavior

- **WHEN** the T02 data, renderer, controller/screen, i18n, and repository-contract suites run
- **THEN** they cover boundary-safe whole-week arithmetic, one-page decisions, snap-back, cancellation, stale and duplicate acknowledgement, frame-coherent page-position replacement, repeated actions, one announcement, stable three-page retention, and preserved T01/Agenda behavior
- **AND** every edited suite runs through the supported Gesture Handler/Reanimated Jest setup without a handwritten worklet runtime

#### Scenario: Native evidence records actual conditions

- **WHEN** native gesture or frame evidence is reported
- **THEN** it names the exact build/revision, platform, device or simulator, OS, fixture, and active refresh rate when making timing claims
- **AND** missing physical-device or assistive-technology checks remain explicit for owner QA or T28

#### Scenario: Current owned-renderer integrity remains enforced

- **WHEN** the CI repository contract inspects the Calendar renderer
- **THEN** it permits only the intended owned paging implementation and existing approved dependencies
- **AND** it continues to reject vendor, fallback, compatibility, duplicate renderer, unbounded page inventory, or unexpected sensitive-surface drift

#### Scenario: Owner rerender during asynchronous settle

- **WHEN** a page request rerenders the Calendar owner before its animation completes
- **THEN** changed callback identities do not cancel that transition
- **AND** completion commits the adjacent week and replenishes the three-slot working set
- **AND** repeated settled swipes can navigate beyond the initial three weeks

#### Scenario: App switcher interrupts paging

- **WHEN** the app becomes inactive or backgrounded while dragging or settling
- **THEN** pending motion is cancelled and the viewport recentres on the committed week
- **AND** stale gesture or animation callbacks cannot commit after returning to the app
- **AND** predominantly vertical gestures do not request a week

#### Scenario: A new touch arrives during settlement

- **WHEN** a new pan begins before an accepted page settle has committed
- **THEN** that pan is ignored until a fresh gesture begins after the commit
- **AND** the three visual slots are not reused before their committed anchor changes

#### Scenario: iOS recognizer resets after a short release

- **WHEN** END starts snap-back and iOS emits BEGAN with the released drag coordinates
- **THEN** BEGAN does not cancel or replace the running animation
- **AND** the viewport finishes at the committed week's zero offset
- **AND** a subsequent touch that fails before ACTIVE cannot interrupt snap-back

### Requirement: T03 exposes one complete bounded wall-clock day

The owned Calendar week surface SHALL render explicit 00:00–24:00 wall-clock geometry at the configured pixels-per-hour scale. It SHALL expose every minute of that day through a vertically bounded viewport, draw major hour and minor half-hour lines from the same minute-to-pixel mapping, and render hour-start labels from 00:00 through 23:00 without duplicating 00:00 at the terminal 24:00 boundary. The new full-day helpers MUST NOT change the existing 07:00–21:00 defaults used by other time-grid consumers.

#### Scenario: Top and bottom of day are reachable

- **WHEN** the student scrolls the empty timed surface to either vertical limit
- **THEN** the viewport clamps at the start or end of the complete 00:00–24:00 geometry
- **AND** it cannot overscroll into an unbounded blank range after motion settles

#### Scenario: Major and minor geometry shares one scale

- **WHEN** the grid is generated at a supported pixels-per-hour value
- **THEN** hour boundaries and half-hour boundaries appear at their exact minute-to-pixel positions
- **AND** content height, maximum offset, and every line position derive from the same explicit full-day bounds

#### Scenario: Existing partial-window defaults remain stable

- **WHEN** an existing consumer calls the time-grid helpers without T03 full-day options
- **THEN** its start and end remain 07:00 and 21:00
- **AND** T03 does not silently widen that consumer's window

### Requirement: T03 pins gutter and date context while preserving clock position

The renderer SHALL place one left hour gutter outside the three-page native pager and SHALL place the gutter and every page grid in one native vertical ScrollView content row. That ScrollView SHALL use automatic content-inset adjustment on the first native descendant chain so the iOS tab bar does not obscure the closing hours. The native Calendar date heading SHALL remain outside vertical motion. Horizontal week settlement, rerender, retained tab/view changes, and lifecycle/layout cancellation SHALL preserve the same visible clock position, except that native restoration MAY clamp an invalid offset against changed geometry. Frame-frequency values MUST remain off React state; only a settled native raw offset MAY be reported for restoration because React Native does not expose UIKit's computed adjusted inset in scroll events.

#### Scenario: Vertical movement keeps labels aligned

- **WHEN** the student scrolls from the top through an intermediate time to the bottom
- **THEN** every visible gutter label remains aligned with its corresponding major grid line
- **AND** the native date heading stays visible without vertical translation

#### Scenario: Horizontal paging retains the visible time

- **WHEN** the student pages one week horizontally from a scrolled clock position
- **THEN** the destination week settles at the same vertical offset
- **AND** the gutter does not move horizontally or expose a duplicate gutter

#### Scenario: Timeline position survives retained view changes

- **WHEN** the student leaves Week for Agenda and returns while the Calendar screen remains retained
- **THEN** Week restores the last settled valid vertical offset
- **AND** Agenda grouping, refresh, checklist, and event activation remain unchanged

#### Scenario: Layout and lifecycle changes preserve a valid position

- **WHEN** layout, backgrounding, or unmount interrupts vertical motion
- **THEN** transient motion is cancelled and obsolete completion work is ignored
- **AND** the preserved position is the prior settled offset or its new valid clamp rather than an unexplained jump

### Requirement: T03 delegates one-finger motion to native axis owners

The timed surface SHALL use one native vertical ScrollView and one native horizontal pager so UIKit and Android own drag recognition, deceleration, overscroll, and cancellation. A completed horizontal page SHALL drive only the T02 one-week path; vertical scrolling SHALL drive only the bounded clock offset and MUST NOT request or announce a week. The implementation MUST NOT add a parent custom pan recognizer or simultaneous transform path that can move both axes. Two-finger behavior remains reserved for the later pinch slice.

#### Scenario: Horizontal paging preserves vertical position

- **WHEN** the native pager owns a horizontal movement that later becomes diagonal or reverses
- **THEN** only the bounded horizontal page changes
- **AND** the visible vertical clock offset remains unchanged

#### Scenario: Vertical scrolling cannot page a week

- **WHEN** the native ScrollView owns a vertical movement that later becomes diagonal or reverses
- **THEN** only the bounded vertical offset changes
- **AND** no week request, date revision, title change, or settled-week announcement occurs

#### Scenario: Platform arbitration avoids two-axis motion

- **WHEN** one-finger movement begins diagonally within the nested native surfaces
- **THEN** platform recognizer arbitration selects the scroll or pager interaction
- **AND** the surface does not visibly slide on both axes or jump when ownership settles

#### Scenario: Movement cancels a pending press

- **WHEN** native scrolling or paging recognizes movement before release
- **THEN** the platform cancels press activation in that subtree
- **AND** scroll or page movement cannot also produce a tap result

#### Scenario: Cancellation returns to valid resting state

- **WHEN** native movement is cancelled, backgrounds, resizes, or unmounts
- **THEN** both axes finish at their last valid committed or clamped resting values
- **AND** stale page or scroll completion callbacks cannot restart motion

### Requirement: T03 hour labels follow explicit device clock preference

The Calendar screen SHALL read the device calendar's nullable `uses24hourClock` value through the installed Expo SDK 56 Localization seam and pass it explicitly to a pure hour-label formatter. The formatter SHALL render 24-hour labels when true, 12-hour labels when false, and the established 24-hour brand format when the platform reports null. It MUST NOT infer the device preference from app language or read platform globals inside pure formatting code.

#### Scenario: Device requests 24-hour labels

- **WHEN** the explicit device preference is true
- **THEN** the gutter renders hour starts in 24-hour form, including the midnight start
- **AND** no AM/PM marker is shown

#### Scenario: Device requests 12-hour labels

- **WHEN** the explicit device preference is false
- **THEN** the gutter renders midnight, morning, noon, and evening hour starts in 12-hour form with the appropriate day period
- **AND** changing app language alone does not overwrite the supplied device clock choice

#### Scenario: Device preference is unavailable

- **WHEN** the platform returns null for `uses24hourClock`
- **THEN** the formatter uses the deterministic 24-hour fallback
- **AND** the result does not depend on the test host's locale or timezone

### Requirement: T04 derives visible dates from one complete civil week

The Calendar data sublayer SHALL derive an ordered seven-date launch week from a committed anchor, effective display zone, and explicit first-weekday policy. Monday SHALL be supplied for the first delivery in French, English, and every display timezone. When weekends are hidden, presentation SHALL remove Saturday and Sunday by civil weekday identity and return the remaining five dates without changing the launch-week anchor, page identity, or seven-calendar-day paging distance. The helper MUST use display-zone civil-day arithmetic and MUST NOT derive week start or weekend identity from locale, device region, array position, or fixed-duration milliseconds.

#### Scenario: Default launch week contains Monday through Sunday

- **WHEN** visible dates are derived with Monday as the first weekday and weekends enabled
- **THEN** exactly seven ordered civil dates from Monday through Sunday are returned
- **AND** every date belongs to the complete launch week containing the committed anchor

#### Scenario: Weekend filtering uses weekday identity

- **WHEN** weekends are disabled under the launch policy
- **THEN** Saturday and Sunday are absent and Monday through Friday remain in chronological order
- **AND** the result is not produced by blindly slicing the first five positions

#### Scenario: Explicit alternate policy retains correct weekend identity

- **WHEN** the pure helper is exercised with a non-Monday first-weekday input
- **THEN** Saturday and Sunday are still identified and filtered by their civil weekday identities
- **AND** the helper does not embed Monday as an invariant even though Monday remains the launch input

#### Scenario: Civil dates cross calendar and offset boundaries

- **WHEN** a launch week crosses a month, year, daylight-saving gap, or daylight-saving repeat
- **THEN** its day keys remain consecutive local calendar dates at their display-zone day boundaries
- **AND** no fixed-duration drift duplicates, skips, or shifts a visible date

### Requirement: T04 persists a default-on weekend preference through Settings

Settings SHALL own one typed `Show weekends` boolean through the existing `@/storage` MMKV seam. A missing value, including a first install or older installation, SHALL resolve to `true`; explicit `true` and `false` values SHALL round-trip and update reactive consumers. The key SHALL be classified as environment-independent so backend changes preserve it, while reinstalling the app resets it to the default. The existing Calendar section of Settings SHALL expose the value as a localized native switch with valid role, label, state, and platform touch target.

#### Scenario: Missing preference shows weekends

- **WHEN** no weekend preference exists in storage
- **THEN** Settings and the Calendar week both resolve `showWeekends` to `true`
- **AND** the initial visible week contains seven dated columns

#### Scenario: Turning weekends off persists

- **WHEN** the student turns the Settings switch off and restarts the app
- **THEN** the stored value remains `false` and the switch remains off
- **AND** the week surface renders five weekday columns

#### Scenario: Turning weekends back on restores both dates

- **WHEN** the student turns the switch on after hiding weekends
- **THEN** Saturday and Sunday return without changing the committed launch-week anchor
- **AND** the value remains `true` across a restart

#### Scenario: Backend reset preserves presentation preference

- **WHEN** the selected backend environment is reset through the existing journalled reset flow
- **THEN** the weekend preference remains unchanged as environment-independent state
- **AND** backend-bound calendar data can be cleared without resetting the switch

### Requirement: T04 aligns dated headers and clock columns with a non-color Today cue

The owned week surface SHALL render one vertically pinned, clipped date-header viewport beneath the existing native month/year title and above vertical clock motion. The viewport SHALL reserve the same fixed hour-gutter width as the timed surface and SHALL contain previous/current/next visual header slots derived from the same ordered column records as their clock pages. Each slot SHALL render one equal-width cell per visible date. A callable Reanimated event handler attached through an animated PagerView wrapper SHALL project the existing pager's continuous native position and offset into shared values and a UI-thread header-strip transform, so each visual header remains aligned with and moves in the same direction and progress as its clock page without adding another pager, responder, gesture owner, timer, or per-frame JavaScript state write. Each header SHALL show a locale-aware weekday and calendar date. The effective display-zone date matching Today SHALL have a visible shape or typography cue in addition to any color and SHALL expose Today meaning semantically without becoming a selectable date control.

#### Scenario: Seven dated columns align

- **WHEN** weekends are enabled at a supported width
- **THEN** the header shows seven equal-width localized Monday-to-Sunday cells beside the gutter spacer
- **AND** each cell aligns with the corresponding vertical clock column on all three bounded pages

#### Scenario: Five dated columns redistribute width

- **WHEN** weekends are disabled at the same width
- **THEN** five equal-width Monday-to-Friday header and clock columns fill the available width
- **AND** no blank Saturday/Sunday lanes, partial week, or horizontal column scroller remains

#### Scenario: Today is not conveyed by color alone

- **WHEN** one visible column matches the current date in the effective display zone
- **THEN** that column has a visible non-color shape or typography distinction and localized Today semantics
- **AND** changing only locale or device timezone cannot select the wrong display-zone date

#### Scenario: Week headers stay vertically pinned and move with horizontal paging

- **WHEN** the student scrolls vertically or holds an unsettled horizontal page transition
- **THEN** the header remains visible during vertical motion, and horizontal motion carries the source header out while the matching destination header and grid enter together from the pager's native progress
- **AND** the native title, canvas label, Agenda range, committed anchor, and accessible date context remain on the settled revision until an accepted week settle

#### Scenario: Pager wrapper receives a callable UI-thread handler

- **WHEN** PagerView delivers fractional forward or backward `onPageScroll` position and offset events
- **THEN** its JavaScript wrapper invokes a callable Reanimated handler and the corresponding shared values drive the header transform on the UI thread
- **AND** React Native `Animated`, `runOnJS`, React state, timers, or an independent animation do not process each frame

#### Scenario: Cancelled horizontal motion recenters one coherent surface

- **WHEN** a drag snaps back, app inactivity cancels motion, the generation is replaced, layout policy changes, or a stale page callback arrives
- **THEN** the header strip and native pager return to the center slot without committing or announcing a different week
- **AND** no independently animated header, second pager settlement, or obsolete transform remains

### Requirement: T04 changes week presentation without filtering Agenda

Weekend visibility SHALL affect only the owned Week header and clock columns. Agenda SHALL continue to query and present the same seven-day range from the committed launch-week anchor, including Saturday and Sunday events and empty date sections where existing Agenda behavior includes them. Changing the preference SHALL preserve the committed anchor, settled vertical offset, page generation semantics, event facts, and existing Agenda/details routes and SHALL emit no week-transition announcement by itself.

#### Scenario: Agenda retains weekend dates

- **WHEN** weekends are hidden in Week and the student switches to Agenda
- **THEN** Agenda uses the unchanged seven-day committed range and retains weekend events
- **AND** returning to Week restores the five-column view at the settled clock offset

#### Scenario: Paging still advances seven civil dates

- **WHEN** weekends are hidden and a swipe or labelled action settles the adjacent page
- **THEN** the committed anchor advances exactly one complete seven-date launch week
- **AND** the next visible Monday-to-Friday columns do not overlap or skip a launch week

#### Scenario: Preference change is not a date transition

- **WHEN** the reactive weekend preference changes while the same week remains committed
- **THEN** header and all three page grids adopt the same five- or seven-column model
- **AND** no date revision, week announcement, Agenda-range change, or event-data mutation occurs
