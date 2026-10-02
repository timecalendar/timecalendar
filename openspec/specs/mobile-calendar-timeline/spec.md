# mobile-calendar-timeline Specification

## Purpose

The owned Day/Week Calendar timeline: its native vertical and windowed horizontal scroll owners, dated header, clock grid, event tiles, zoom, current-time cue, accessibility and the evidence each slice must record.

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

At the T05 milestone, the feature `renderer/` sublayer SHALL provide horizontally paged, vertically scrollable empty owned day and week surfaces on the real Calendar route as one designed brand surface themed from `@/theme` tokens. Day SHALL show exactly one display-zone civil date; week SHALL show the complete Monday-first launch week as five or seven visible columns according to Show weekends. Both modes SHALL retain the native month/year title, complete pages in one windowed native horizontal pager, mode-labelled screen-reader actions, complete clock grid, synchronized pinned date header, and one pinned left gutter without importing or mounting a second renderer. Timeline events, current-time indicator/positioning, event activation, zoom, and selectable dates SHALL remain absent until their numbered slices land.

#### Scenario: Owned day and week shell render on the real route

- **WHEN** the student selects Day or Week on `timecalendar-dev://calendar`
- **THEN** the same owned shell renders the native title, mode-correct dated header, bounded paged lanes, pinned gutter, and vertically scrollable complete-day grid
- **AND** no calendar-kit, fallback, compatibility, duplicate renderer, second horizontal pager or scroll owner, or second vertical scroll owner mounts

#### Scenario: Brand surface uses owned tokens

- **WHEN** either T05 timeline mode renders in a supported theme
- **THEN** its surface, Today cue, borders, lines, labels, text, and navigation presentation derive from `@/theme` and shared semantic primitives

#### Scenario: Later timeline capabilities remain absent

- **WHEN** the T05 shell is inspected or exercised
- **THEN** it contains no event/all-day tiles, current-time indicator or initial-now positioning, date-selection action, event activation, or zoom

#### Scenario: Empty motion has no event write path

- **WHEN** a paged and scrolled day or week shell is used
- **THEN** it neither reads events for presentation nor mutates or rewrites synced or personal event facts

### Requirement: Internationalization and accessibility

Every user-facing string added or retained on the T04 Calendar and Settings surfaces SHALL be translated in French and English with typed key parity. Numeric date labels SHALL use the pure locale/display-zone formatting seam, and hour labels SHALL use the pure explicit device-clock formatter rather than translation keys. The native month/year title SHALL remain the sole page header; the committed weekday/date row SHALL be chronological readable content beneath it, not a second page title or set of selectable controls. The canvas SHALL expose one committed locale- and display-zone-aware week label with translated increment/decrement actions. Today SHALL have localized semantics and a non-color cue. Neighbour pages, decorative boundaries, and duplicate gutter semantics SHALL not create additional focus contexts. Only an accepted changed-week settle SHALL announce the destination once; preference changes, vertical movement, intermediate motion, and neighbour pages SHALL not announce a week.

#### Scenario: French and English dated headings

- **WHEN** the same launch week renders in French and English
- **THEN** every committed day cell uses the corresponding localized weekday/date and effective display zone
- **AND** neither catalog exposes a raw translation key or omits the Settings switch label

#### Scenario: One committed week context is accessible

- **WHEN** assistive technology traverses the settled T04 shell
- **THEN** it encounters one adjustable committed week context followed by chronologically ordered visible date labels
- **AND** neighbour pages, grid boundaries, and repeated gutter content do not expose duplicate headings or canvas targets

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

Every enabled Calendar control at the T05 milestone SHALL produce an observable supported result. The view selector SHALL expose distinct Day, Week, and Agenda choices on both platforms. Add, mode selection, mode-correct previous/next, Today, vertical scrolling, Settings weekend visibility, Agenda refresh/retry, and Agenda event activation SHALL preserve localized accessibility behavior. Today and a valid one-shot `focusDate` SHALL retain Day or Week and replace pending motion at the corresponding target day or containing launch week while preserving the settled clock offset; current-time positioning, complete direct-intent focus/animation semantics, and Agenda section movement remain assigned to later slices.

#### Scenario: Three view choices are implemented on both platforms

- **WHEN** the student opens either platform Calendar view selector
- **THEN** Day, Week, and Agenda are present in the same order and the selected choice is represented
- **AND** every offered choice renders a distinct working surface or the retained Agenda presentation

#### Scenario: T05 exposes only implemented timeline behavior

- **WHEN** the student selects Day or Week
- **THEN** the shell offers one-day or five/seven-day presentation, bounded vertical time scrolling, and mode-labelled previous/next actions
- **AND** it offers no selectable dates, zoom, current-time positioning, or event activation

#### Scenario: Retained and movement controls remain accessible

- **WHEN** the student uses a retained Calendar, mode, paging, vertical, or weekend-visibility interaction
- **THEN** every action has a translated or correctly formatted accessible presentation and an observable supported result
- **AND** every visible retained control preserves its platform minimum target

#### Scenario: Today and focus date retain timeline mode without inventing vertical behavior

- **WHEN** Today or a valid one-shot focus date replaces a non-current timeline destination
- **THEN** Day commits the target civil date and Week commits its containing Monday-first launch week in the effective display timezone
- **AND** pending motion is invalidated and the established clock offset is preserved rather than moved to current time

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

### Requirement: T02 commits one settled date context

The Calendar controller SHALL remain the authority for the committed date, native title, and canvas label, and SHALL store only the committed date. During finger-held or interrupted movement, the committed selected date, native title, and canvas accessibility context SHALL continue to represent the old settled page. A settle SHALL publish the destination selected date, native title, and canvas accessibility context together and SHALL be reported at most once per settled page. Snap-back, a settle on the already committed page, and scroll events that describe stale geometry or another mode's content MUST NOT change committed state.

#### Scenario: Held drag preserves the old heading

- **WHEN** the student drags a week partway and holds without settling
- **THEN** the native title and canvas accessibility label and the selected date continue to name the original committed week
- **AND** no intermediate date is announced

#### Scenario: Accepted settle commits one coherent destination

- **WHEN** the pager settles on an adjacent page
- **THEN** the page position, selected date, native title, and canvas accessibility label change to the same destination in one commit
- **AND** no wrong-date, unexplained blank, or partial settled frame is exposed

#### Scenario: Obsolete completion is discarded

- **WHEN** a scroll event describes a previous page width, content width, or mode, or a settle repeats the committed page
- **THEN** it does not change the committed date, native title, canvas label, or announcement count

#### Scenario: Today and retained direct dates resolve to whole weeks

- **WHEN** the existing Today action or retained one-shot focus date selects a date while Week is active
- **THEN** the committed week anchor becomes the complete policy week containing that date
- **AND** the surface never rests on a seven-day interval that straddles two launch weeks

### Requirement: T02 paging is operable and announces only settled context

The Calendar week surface SHALL expose translated previous-week and next-week accessibility actions as decrement/increment on the adjustable canvas. Each action SHALL scroll the pager one page through the same settle path as a swipe. No separate full-date row or visible arrow toolbar SHALL render. One vertically pinned localized weekday/date strip SHALL render beneath the native month/year title and move from the same native horizontal offset as the clock pages. Its committed slot SHALL remain the sole accessible date row until settlement. Only a settle on a changed week SHALL announce the localized destination week once. Neighbour pages MUST NOT create duplicate native focus trees, and reduced-motion operation SHALL settle without nonessential travel animation.

#### Scenario: Previous and next actions move one week

- **WHEN** the student activates the labelled previous-week or next-week action
- **THEN** the corresponding adjacent week is reached through the same settle path as a swipe
- **AND** the action remains operable without performing a gesture

#### Scenario: One accepted settle produces one announcement

- **WHEN** the pager settles on a different week
- **THEN** the localized settled week, committed header slot, and dated columns update and the week is announced exactly once
- **AND** finger movement, snap-back, stale scroll events, duplicate settles, and preference changes produce no extra week announcement

#### Scenario: Recycled neighbours are not duplicate semantics

- **WHEN** assistive technology traverses the settled Calendar week
- **THEN** it encounters one adjustable committed week context with labelled paging actions and one chronological committed date row
- **AND** neighbour pages and header slots are hidden from the accessibility tree until their page settles

#### Scenario: Reduced motion settles directly

- **WHEN** reduced motion is enabled and a week change is requested
- **THEN** the same destination is committed and announced through the settle path without nonessential travel animation

### Requirement: T02 paging evidence is tied to the tested revision

The change MUST prove pure week arithmetic, settle idempotence, bounded windowed retention, renderer and Calendar wiring, retained Agenda/T01 behavior, and owned-renderer repository integrity with focused automated checks. Its testable build evidence SHALL identify the exact revision, build/runtime, fabricated fixture, device and OS, active refresh rate for timing claims, and observed held-drag, fast-fling, reversal, control, announcement, frame, and mounted-page outcomes. Automated results MUST NOT be presented as proof of native feel or assistive-technology behavior.

#### Scenario: Focused automation covers deterministic behavior

- **WHEN** the T02 data, renderer, controller/screen, i18n, and repository-contract suites run
- **THEN** they cover boundary-safe whole-week arithmetic, one-page settles, snap-back, stale scroll-event filtering, duplicate settles, re-base without motion, repeated actions, one announcement, bounded windowed retention, and preserved T01/Agenda behavior
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

- **WHEN** the Calendar owner rerenders while a page is settling
- **THEN** changed callback identities do not re-register the scroll handler or drop the settle
- **AND** the settle commits the adjacent page
- **AND** repeated swipes navigate beyond the mounted window

#### Scenario: App switcher interrupts paging

- **WHEN** the app becomes inactive or backgrounded while dragging or settling
- **THEN** the committed date is kept and the next settle commits normally
- **AND** stale scroll events cannot commit a different page after returning to the app
- **AND** predominantly vertical gestures do not page

#### Scenario: A new touch arrives during settlement

- **WHEN** a new touch grabs the pager during its deceleration
- **THEN** the native scroll view takes the motion over without waiting for a React commit
- **AND** a grab released without moving settles the page the pager rests on

#### Scenario: iOS recognizer resets after a short release

- **WHEN** a short drag on iOS is released without leaving the committed page
- **THEN** UIKit snaps the pager back to the committed page
- **AND** no settle, commit, or announcement is reported

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

### Requirement: T03 pins gutter and date context while preserving clock position

The renderer SHALL place one left hour gutter outside the windowed native horizontal pager and SHALL place the gutter and every page grid in one native vertical ScrollView content row. That ScrollView SHALL use automatic content-inset adjustment on the first native descendant chain so the iOS tab bar does not obscure the closing hours. The native Calendar date heading SHALL remain outside vertical motion. Horizontal week settlement, rerender, retained tab/view changes, and lifecycle/layout cancellation SHALL preserve the same visible clock position, except that native restoration MAY clamp an invalid offset against changed geometry. Frame-frequency values MUST remain off React state; only a settled native raw offset MAY be reported for restoration because React Native does not expose UIKit's computed adjusted inset in scroll events.

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

The owned timeline SHALL render one vertically pinned, clipped date-header viewport beneath the existing native month/year title and above vertical clock motion. The viewport SHALL reserve the same fixed hour-gutter width as the timed surface and SHALL contain one visual header slot per mounted page, keyed and positioned like that page and derived from the same frozen page presentation. Each slot SHALL render one equal-width cell per visible date. The horizontal pager's Reanimated scroll handler SHALL write its continuous native offset into a shared value that drives a UI-thread header-strip transform, so each visual header remains aligned with and moves in the same direction and progress as its clock page without adding another pager, responder, gesture owner, timer, or per-frame JavaScript state write. Each visual header SHALL show the locale's narrow one-letter weekday form above a larger calendar date number, while its accessible label SHALL retain an unambiguous localized weekday and date. Ordinary date text SHALL use a lighter-than-background secondary gray in dark appearance. The effective display-zone date matching Today SHALL use the primary color for its weekday glyph and a fixed, fully circular primary-filled number badge whose number uses the screen background color. The filled circle and typography SHALL provide a non-color distinction, and the cell SHALL expose localized Today semantics without becoming a selectable date control.

#### Scenario: Seven dated columns align

- **WHEN** weekends are enabled at a supported width
- **THEN** the header shows seven equal-width localized Monday-to-Sunday cells beside the gutter spacer
- **AND** each cell aligns with the corresponding vertical clock column on every mounted page

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
- **THEN** the header remains visible during vertical motion, and horizontal motion carries the source header out while the matching destination header and grid enter together from the pager's native offset
- **AND** the native title, canvas label, Agenda range, committed anchor, and accessible date context remain on the settled page until a settle

#### Scenario: Pager wrapper receives a callable UI-thread handler

- **WHEN** the horizontal pager wrapper delivers fractional forward or backward scroll offsets
- **THEN** its Reanimated scroll handler writes the offset to a shared value that drives the header transform on the UI thread
- **AND** React Native `Animated`, `runOnJS`, React state, timers, or an independent animation do not process each frame

#### Scenario: Cancelled horizontal motion recenters one coherent surface

- **WHEN** a drag snaps back, the app goes inactive, the weekend preference or layout changes, or a stale scroll event arrives
- **THEN** the header strip follows the native pager back to the committed page without committing or announcing a different date range
- **AND** no independently animated header, second pager settlement, or obsolete transform remains

### Requirement: T04 changes week presentation without filtering Agenda

Weekend visibility SHALL affect only the owned Week header and clock columns. Agenda SHALL continue to query and present the same seven-day range from the committed launch-week anchor, including Saturday and Sunday events and empty date sections where existing Agenda behavior includes them. Changing the preference SHALL preserve the committed anchor, settled vertical offset, page identity, event facts, and existing Agenda/details routes and SHALL emit no week-transition announcement by itself.

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
- **THEN** header and every mounted page grid adopt the same five- or seven-column model
- **AND** no date commit, week announcement, Agenda-range change, or event-data mutation occurs

### Requirement: T05 switches day and week through one committed date context

The Calendar controller SHALL own one committed timeline mode and civil anchor. Switching Day to Week SHALL select the complete launch week containing the day; switching Week to Day SHALL select the week's explicit first day, Monday at launch. The renderer, native title, date header, selected date, accessibility context, and dependent range SHALL project the same committed replacement without an intermediate mixed-mode or wrong-date state. Repeating a switch SHALL remain deterministic.

#### Scenario: Week switches to its first day

- **WHEN** a settled week is switched to Day
- **THEN** the day anchor is that week's explicit first date
- **AND** the title, single header column, canvas label, and selected date agree on it

#### Scenario: Day switches to its containing week

- **WHEN** a settled day is switched to Week
- **THEN** the week anchor is the Monday-first launch week containing that day
- **AND** the title, visible week columns, canvas label, and selected date agree on it

#### Scenario: Repeated switching stays coherent

- **WHEN** the student repeatedly switches Day and Week
- **THEN** each replacement settles directly on the required date context
- **AND** no intermediate mixed columns, stale title, or duplicate settlement announcement is exposed

### Requirement: T05 preserves clock position and rejects stale mode callbacks

The owned day and week surfaces SHALL share the same full-day vertical geometry, native `ScrollView`, and screen-owned settled clock offset. A day/week mode replacement SHALL preserve that offset, remount the horizontal pager for the new mode on the committed date's page, ignore scroll events that describe the old mode's content, move the pinned header projection with the new pager, and SHALL NOT commit or announce an obsolete destination.

#### Scenario: Mode switch preserves a settled afternoon coordinate

- **WHEN** the timeline is settled at an afternoon vertical offset and the student switches Day or Week
- **THEN** the destination exposes the same settled raw clock offset through the unchanged native vertical owner
- **AND** it does not restore a process-persisted offset or scroll to current time

#### Scenario: Mode switch during a partial drag cancels the old page

- **WHEN** the view mode changes while the old mode is partially dragged or awaiting settlement
- **THEN** the old motion is abandoned, the pager and header are placed on the new mode's committed page, and later events from the old content are ignored
- **AND** only the requested mode/date context remains committed and announced

### Requirement: T05 keeps Agenda available without claiming T18 transfer

Agenda SHALL remain the existing separate view and its choice SHALL be persistable with Day and Week. T05 SHALL retain the currently settled timeline anchor/range when entering Agenda and use that retained anchor coherently when returning to Day or Week. It SHALL NOT claim Agenda active-section feedback, scrolling to a transferred date, multi-day section expansion, or the complete bidirectional date behavior assigned to T18.

#### Scenario: Agenda remains usable from either timeline mode

- **WHEN** the student selects Agenda from Day or Week
- **THEN** the existing Agenda loading, refresh/retry, grouping, checklist, and event-details activation behavior remains available
- **AND** timeline-only clock position remains owned by the timeline

#### Scenario: T05 does not infer an Agenda active date

- **WHEN** the student scrolls Agenda and returns to Day or Week before T18
- **THEN** T05 uses the retained settled timeline anchor rather than claiming the nearest Agenda section
- **AND** no new Agenda date-selection or active-section feedback control appears

### Requirement: T05 labels and announces the committed mode correctly

French and English resources SHALL provide typed-parity Day, Week, Agenda, previous-day, next-day, previous-week, and next-week presentation. Day SHALL expose one chronological date header and a localized full-date canvas label; Week SHALL retain its chronological visible date headers and week label. Only an accepted horizontal date settlement SHALL announce the localized destination once. Intermediate paging, cancellation, stale callbacks, vertical movement, and mode replacement SHALL not announce an obsolete date.

#### Scenario: Day accessibility actions name days

- **WHEN** assistive technology operates the settled Day canvas
- **THEN** increment and decrement actions are labelled as next and previous day in the active language
- **AND** the single committed date header and canvas label describe the same display-zone date

#### Scenario: Week accessibility actions retain week labels

- **WHEN** assistive technology operates the settled Week canvas
- **THEN** increment and decrement actions are labelled as next and previous week in the active language
- **AND** only the committed center dates are exposed chronologically

#### Scenario: Accepted settlement announces once

- **WHEN** a day or week page is accepted at idle
- **THEN** the localized destination date context is announced exactly once
- **AND** a cancelled, stale, intermediate, vertical, or mode-replacement callback does not announce an obsolete destination

### Requirement: T05 proof is revision-bound and retains owned-renderer contracts

The change MUST prove mode/date transition tables, display-zone civil stepping, one/five/seven geometry, persistence and corrupt recovery, backend-reset survival, preserved clock coordinates, mode-change cancellation, platform menu parity, localized labels, Today/focusDate coherence, Agenda/details availability, automatic insets, one vertical owner, one windowed horizontal pager, bounded mounted pages, synchronized headers, and no second renderer through focused tests and repository contracts. Native partial-drag switching, platform menus, restart, visible-hour preservation, weekend traversal, header synchronization, and assistive technology SHALL be recorded against the exact tested revision/build through the owner checklist rather than claimed from host automation.

#### Scenario: Focused automation proves deterministic T05 behavior

- **WHEN** the affected data, preference, storage, renderer, Calendar screen, i18n, and repository-contract suites run
- **THEN** they cover every day/week mapping and paging unit, valid/missing/corrupt mode values, reset survival, stale callback rejection, preserved offset, and retained navigation
- **AND** no vendor, second renderer, second pager/scroll owner, fixed-duration day arithmetic, weekend-skipping day step, or weakened test gate appears

#### Scenario: Native evidence is not fabricated

- **WHEN** local non-device verification completes
- **THEN** the handoff records exact commands and results for the tested revision without claiming physical platform behavior
- **AND** the exact build/revision and complete T05 owner checklist remain recorded for explicit owner acceptance

### Requirement: T07 replaces timed viewport geometry atomically

The owned Day/Week renderer SHALL treat each normalized timed-viewport width/height pair and its effective automatic native insets as one monotonic geometry revision. Before replacing geometry, it SHALL snapshot one coherent committed date identity, timeline mode, bounded pixels-per-hour scale, raw offset, and visible clock anchor. Replacement SHALL preserve the date, mode, scale, and clock anchor, and SHALL NOT request a date transition, switch Week to Day, or expose a frame composed from old and new dimensions.

#### Scenario: Width and height replace together

- **WHEN** rotation or native window resizing changes the timed viewport
- **THEN** width and height commit under one new geometry revision
- **AND** header, pager, clock canvas, and vertical bounds consume that same revision

#### Scenario: Resize preserves committed presentation state

- **WHEN** a Day or Week surface at non-default zoom is resized
- **THEN** its selected date, explicit mode, pixels-per-hour scale, and clock anchor remain unchanged
- **AND** no resize-driven date request, accessibility date announcement, Agenda-range change, or mode persistence write occurs

#### Scenario: Repeated transient measurements remain coherent

- **WHEN** the platform emits multiple complete layout pairs during rotation or interactive resizing
- **THEN** each accepted pair supersedes the previous geometry monotonically and idempotently
- **AND** no callback can reconstruct a mixed width/height snapshot

### Requirement: T07 preserves and clamps the visible clock anchor

The renderer SHALL capture the wall-clock coordinate at the usable center of the old timed viewport and solve the replacement raw offset against the usable center of the new viewport at the unchanged scale. The usable center and raw bounds SHALL include actual automatic top/bottom native insets. The clock coordinate SHALL remain stable when the solution is in range and SHALL clamp to the nearest valid 00:00/24:00 bound when the replacement viewport makes exact preservation impossible.

#### Scenario: Height-only resize preserves clock context

- **WHEN** viewport height changes without a width change while an afternoon clock coordinate is visible
- **THEN** the same clock coordinate remains at the new usable viewport center unless clamped
- **AND** the result uses live native insets rather than an assumed zero inset or the last React-only measurement

#### Scenario: Width-only resize does not move time

- **WHEN** viewport width changes without a height or inset change
- **THEN** the settled scale and visible clock coordinate remain unchanged
- **AND** only horizontal lane geometry is redistributed

#### Scenario: Closing boundary remains reachable

- **WHEN** height or bottom inset changes near the end of the full-day surface
- **THEN** the raw offset clamps to the updated inset-aware lower bound
- **AND** the exact 24:00 closing boundary remains reachable above native chrome with its presentation hairline intact

### Requirement: T07 invalidates stale motion across geometry revisions

A geometry replacement SHALL be a cancellation boundary for pending vertical settlement, native-owner state, and active pinch work begun under the prior revision. The renderer SHALL cancel or settle that work coherently, re-place the horizontal pager and header on the committed page at the new page width without animation once the new content has laid out, ignore horizontal scroll events whose layout or content width describes the prior geometry, apply the replacement vertical offset without animation, and reject every late completion whose geometry revision is stale. Fresh native ownership SHALL reopen only after an interaction begins under the new revision.

#### Scenario: Rotation interrupts horizontal motion

- **WHEN** rotation or resizing occurs during page drag, settle, or dated-header projection
- **THEN** no page commits from the interrupted motion, and the pager and header are re-placed on the committed date at the new width
- **AND** late scroll or settle events from the prior geometry cannot commit or relabel the new layout

#### Scenario: Rotation interrupts vertical motion

- **WHEN** geometry changes during vertical drag, momentum, or a queued end-drag frame
- **THEN** old settlement work is cancelled before the new clock-anchor offset is applied
- **AND** a late scroll completion cannot replace the resized offset

#### Scenario: Rotation interrupts pinch

- **WHEN** geometry changes after pinch starts but before its settlement reaches React
- **THEN** pinch is cancelled or finalized against one coherent pre-replacement snapshot and the new geometry revision owns the restored result
- **AND** a stale zoom settlement cannot persist scale or offset over the replacement snapshot

### Requirement: T07 keeps one responsive native renderer

At every supported compact, medium, and expanded timed-viewport size, the owned renderer SHALL retain one automatic-inset native vertical owner, and one windowed native horizontal pager with at most five mounted pages. Day SHALL render one complete column and Week SHALL render five or seven complete equal-width columns according to the existing weekend preference. The pinned dated header and clock grid SHALL derive their content lane from the same committed geometry. The renderer SHALL NOT add a column scroller, second pager, compatibility renderer, or width-driven mode switch.

#### Scenario: One, five, and seven columns stay aligned

- **WHEN** Day, five-day Week, and seven-day Week are each resized through representative compact, medium, and expanded widths
- **THEN** every dated-header cell remains aligned with its complete clock column on every mounted page
- **AND** no partial column, blank weekend lane, overlapping gutter, or independent horizontal column motion appears

#### Scenario: Native ownership and insets survive resize

- **WHEN** the Calendar is inspected before and after width-only, height-only, and combined changes
- **THEN** it retains one `contentInsetAdjustmentBehavior="automatic"` vertical owner and one windowed horizontal pager
- **AND** native tab-bar reachability, bounce/deceleration ownership, and the no-second-renderer contract remain unchanged

#### Scenario: Agenda and details remain available

- **WHEN** the student opens Agenda or event details and returns after an orientation/window change
- **THEN** the existing Agenda range, refresh, checklist, and activation behavior remain available
- **AND** returning to Day or Week restores the committed date, mode, scale, and resized clock position

### Requirement: T07 evidence is revision and build bound

Deterministic coverage SHALL include pure resize snapshots, clock-anchor invariance and clamp boundaries, stale-revision rejection, one/five/seven-column alignment, one vertical owner, one windowed horizontal pager, bounded mounted pages, automatic insets, and absence of a second renderer. Native evidence SHALL identify the exact revision, runtime fingerprint, compatible binary/build, device model, OS, physical/simulator status, and tested dimensions. The full canonical owner checklist SHALL cover both phone rotations, repeated representative tablet window sizes, resize during drag/pinch, shared navigation/chrome, height-only 24:00 reachability, and touched prior interactions.

#### Scenario: Host automation stays within its evidence boundary

- **WHEN** deterministic checks run on the non-virtualized host
- **THEN** they report source, reducer, component, repository, config, and disposable-prebuild results only
- **AND** they do not claim actual rotation, multitasking, native gesture feel, or device chrome results

#### Scenario: Owner acceptance uses a compatible build

- **WHEN** T07 is presented for owner acceptance
- **THEN** the handoff names a fresh native binary whose runtime fingerprint matches the tested revision rather than an OTA-only JS reload
- **AND** every canonical checklist item is marked pass, fail, or explicitly deferred through the permitted T28 path before acceptance is recorded

### Requirement: T08 opens a fresh timeline around the current time

A freshly mounted owned Day or Week timeline SHALL position the current display-zone minute near 30% of the usable timed viewport measured from its top, using the first complete timed-viewport geometry snapshot of that mount and the live automatic native insets. The solved raw offset SHALL be clamped to the explicit 00:00–24:00 bounds at the settled pixels-per-hour scale. The fresh-open position SHALL be applied at most once per mount and SHALL NOT be chosen from event data, restored from a previous process, or persisted. A named viewport-fraction constant SHALL express the 30% policy.

#### Scenario: Mid-morning open shows preceding context

- **WHEN** Calendar is opened fresh while the display-zone clock reads mid-morning
- **THEN** the current minute appears near 30% from the top of the usable timed viewport
- **AND** the preceding hours remain visible above it without scrolling

#### Scenario: Early-morning and late-night clamp inside the day

- **WHEN** Calendar is opened fresh near 00:00 or near 24:00 in the display zone
- **THEN** the raw offset clamps to the nearest inset-aware full-day bound instead of scrolling past the day
- **AND** the current-time indicator remains visible without any student scrolling

#### Scenario: A mounted viewport is not re-positioned

- **WHEN** a clock tick, foreground return, geometry revision, zoom settlement, or accepted date/mode transition occurs after the first positioning
- **THEN** the student's settled vertical offset or the T07 clock anchor is preserved
- **AND** no second fresh-open seek, scroll reset, or animated scroll occurs

### Requirement: T08 drives Today and the indicator from one lifecycle-scoped clock

The Calendar controller SHALL own exactly one injected clock value and supply it to the dated-header Today cue, the Today action, and the current-time indicator. That clock SHALL advance at displayed minute precision, aligned to the wall-clock minute boundary, only while the Calendar route is focused and the application is foreground. Route blur, an application state other than active, and unmount SHALL cancel the pending timer and schedule no further work. Returning to focus or foreground SHALL recompute the clock immediately. The owned renderer SHALL arm no timer of its own and SHALL receive the clock as part of its presentation model.

#### Scenario: Today and the indicator roll over together

- **WHEN** the clock crosses midnight while Calendar remains mounted
- **THEN** the dated-header Today cue, the Today action's availability, and the indicator's owning column all move to the new display-zone date from the same tick
- **AND** the committed anchor, vertical offset, page identity, and event data are unchanged

#### Scenario: Leaving Calendar stops recurring work

- **WHEN** the student navigates to another tab or the application leaves the foreground
- **THEN** the pending minute timer is cancelled and no further clock work is scheduled
- **AND** unmount leaves no pending timer, interval, or animation frame behind

#### Scenario: Returning refreshes meaning, not position

- **WHEN** the student returns to a still-mounted Calendar after a background period
- **THEN** the clock value, Today cue, and indicator reflect the current instant
- **AND** the previously visible scroll position and committed date are retained

#### Scenario: Updates stay at displayed precision

- **WHEN** the clock is observed over one minute of foreground time
- **THEN** exactly one aligned update occurs at the minute boundary
- **AND** no continuous animation loop, sub-minute tick, or per-frame React state write drives the indicator

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

### Requirement: T08 evidence is revision bound and keeps the owned-renderer contracts

Deterministic coverage SHALL include the pure fresh-open offset helper at full statement and branch coverage with boundary cases at 00:00, mid-day, 24:00, zero and non-zero insets, and the bounded scale range; the clock hook's focus, foreground, minute-alignment, rollover, and cleanup behaviour under controlled timers; indicator presence on today, absence on non-today pages and hidden weekends; and screen-level agreement between the Today cue and the indicator. The repository contract SHALL assert that the displayed-precision timer exists only in the named calendar clock module with focus, application-state, and teardown handling, that no other calendar production file arms a timer, that no calendar production file runs a repeating animation, and that the renderer inventory, single automatic-inset vertical owner, single windowed horizontal pager, and no-second-renderer rules still hold. Device-only presentation, assistive-technology, and feel results SHALL NOT be claimed by host automation, and the complete canonical owner checklist SHALL be recorded against the exact tested revision and build.

#### Scenario: The timer contract is checked by name

- **WHEN** the repository contract suite runs
- **THEN** it identifies the single clock module as the only calendar timer owner and proves its focus, application-state, and cleanup handling
- **AND** it fails a repeating animation or a timer armed anywhere else in the calendar feature, including the renderer

#### Scenario: Host automation stays within its evidence boundary

- **WHEN** deterministic checks run on the non-virtualized host
- **THEN** they report pure helper, hook, component, screen, and repository-contract results only
- **AND** they do not claim real-device indicator legibility, light/dark appearance, assistive-technology behaviour, or background-timer behaviour

#### Scenario: Owner acceptance is recorded against the tested build

- **WHEN** T08 is presented for owner acceptance
- **THEN** the handoff names the exact revision, build, fabricated fixture setup, and deterministic clock scenarios, and states that the build carries no clock override
- **AND** every canonical checklist item is marked pass, fail, or explicitly deferred through the permitted T28 path before acceptance is recorded

### Requirement: T10 admits timed points with exact bounded membership

The Calendar event domain SHALL accept a timed event whose end instant equals its start instant as a point without rewriting either instant. A point SHALL intersect a half-open range exactly when its instant is greater than or equal to the range start and less than the range end. Positive timed intervals SHALL retain half-open intersection, reversed timed ranges SHALL be rejected per row, and date-only ranges SHALL still require a strictly later exclusive end.

#### Scenario: Point belongs at the lower range boundary

- **WHEN** a zero-duration event occurs exactly at a retained range's lower boundary
- **THEN** the bounded local read and timeline presentation include it once
- **AND** the same point is absent from the preceding range whose exclusive upper boundary equals that instant

#### Scenario: Point is excluded at the upper range boundary

- **WHEN** a zero-duration event occurs exactly at the retained range's exclusive upper boundary
- **THEN** it is absent from that range
- **AND** it becomes eligible at the next range's inclusive lower boundary

#### Scenario: Interval and reversed-range semantics remain distinct

- **WHEN** one event has positive duration and another ends before it starts
- **THEN** the positive event uses the existing half-open intersection rule
- **AND** the reversed event is rejected without changing either stored row

### Requirement: T10 separates faithful event visuals from platform-minimum targets

The owned timeline SHALL render a zero-duration event as a fixed 4dp instant marker centered on its clock coordinate and SHALL render a positive event at its exact minute-derived visual height. The single interactive wrapper associated with either visual SHALL be at least 44pt high on iOS and 48dp high on Android, SHALL remain within the 00:00–24:00 clock plane, and SHALL retain the full single-column event width. The wrapper SHALL preserve original-UID activation and native movement/pinch press cancellation without introducing another gesture owner.

#### Scenario: Noon point has marker and minimum target

- **WHEN** a zero-duration event occurs at 12:00 on iOS or Android
- **THEN** its visual marker is centered at the 12:00 coordinate without invented duration
- **AND** its interactive wrapper is respectively at least 44pt or 48dp and opens that event's original identity

#### Scenario: Two-minute visual remains duration-faithful

- **WHEN** a two-minute event is rendered at any supported zoom
- **THEN** its visual height equals two minutes at the live pixels-per-hour scale
- **AND** its interactive wrapper meets the platform minimum without stretching the visual block

#### Scenario: Movement cancels a tiny-event press

- **WHEN** a touch beginning in a point or short-event target becomes vertical scrolling, horizontal paging, or pinch ownership
- **THEN** the pending press is cancelled by the existing native gesture hierarchy
- **AND** no details route opens

#### Scenario: Day-edge target remains bounded

- **WHEN** a point is placed at 00:00 or immediately before the 24:00 boundary
- **THEN** its interaction geometry clamps inside the clock plane
- **AND** its visual coordinate and half-open day membership remain unchanged

### Requirement: T10 resolves readable event colors deterministically

Calendar event appearance SHALL be produced by one pure resolver from an untrusted source color, active light/dark scheme, and increased-contrast input. It SHALL normalize valid `#RRGGBB` values, replace invalid values with the neutral fallback, return opaque source/accent/surface/foreground/outline colors, provide at least 4.5:1 foreground-to-surface contrast, and provide an event-boundary cue of at least 3:1 against the canvas. The same inputs SHALL always produce the same output and no resolved color SHALL depend on the host locale or platform globals.

#### Scenario: Arbitrary source colors remain readable in both schemes

- **WHEN** black, white, saturated, mid-tone, mixed-case, and neutral imported colors are resolved for light and dark schemes
- **THEN** every foreground/surface pair meets or exceeds 4.5:1
- **AND** every event retains a normalized source-derived accent whose boundary treatment meets or exceeds 3:1 against the canvas

#### Scenario: Invalid color uses neutral policy

- **WHEN** the source color is missing, malformed, or not six-digit hex
- **THEN** the resolver uses the neutral fallback as its normalized source
- **AND** it still returns contrast-safe light/dark appearance without mutating persisted color

#### Scenario: Increased contrast strengthens the boundary

- **WHEN** the same event is resolved with increased contrast enabled
- **THEN** its wash uses the documented increased-contrast composition and its foreground outline distinguishes the geometry without color alone
- **AND** title/accessibility content and original identity are unchanged

### Requirement: T10 keeps complete meaning when visual content is constrained

Every T10 timeline target SHALL expose one localized button name containing the resolved title or localized fallback, full formatted time, and location when present, plus the existing concise details hint. The visual block SHALL prioritize title; location and checklist visuals SHALL appear only when their complete line budget fits. Point markers MAY omit visual text, but constrained geometry SHALL never remove content from the accessible name or event-details destination. Child visual content SHALL remain excluded from the accessibility tree.

#### Scenario: Missing title is localized

- **WHEN** a missing or whitespace-only title is presented in English or French
- **THEN** the visual/accessibility presentation uses respectively `(No title)` or `(Sans titre)`
- **AND** the raw row remains unchanged

#### Scenario: Title wins at constrained size

- **WHEN** a long title and long location are presented in a narrow or very short tile
- **THEN** visual title content is retained before location or checklist content
- **AND** the button name and details view retain the full title, time, and location

#### Scenario: One semantic target carries the complete event

- **WHEN** assistive technology reaches a normal, two-minute, or point event on the committed page
- **THEN** it encounters one button with complete localized meaning and original-identity activation
- **AND** child text, marker visuals, neighbour pages, and expanded hit geometry add no duplicate semantic node

### Requirement: T10 proof is fixture-, privacy-, and revision-bound

Deterministic proof SHALL use fabricated fixtures containing a noon point, a two-minute event, missing and long text, arbitrary colors, invalid required rows, malformed optional arrays/content, and a valid Maths sibling. Pure point/range/color/presentation logic SHALL achieve 100% statement and branch coverage. Component proof SHALL cover visual versus interaction geometry, platform minimums, text priority, accessible labels, activation, and press cancellation. Handoff evidence SHALL identify exact commands and tested head and SHALL NOT claim physical-device accessibility, target feel, increased-contrast rendering, or global visual acceptance.

#### Scenario: Fabricated malformed siblings do not erase Maths

- **WHEN** the complete T10 fixture is decoded and rendered
- **THEN** valid Maths, the noon point, and the two-minute event retain distinct identities and targets
- **AND** every invalid required row or malformed optional value is handled according to its own rule

#### Scenario: Host evidence remains bounded

- **WHEN** all focused and local-green checks pass on the development host
- **THEN** the handoff records their exact commands, outcomes, and tested commit
- **AND** final native device/accessibility acceptance remains assigned to T28

### Requirement: T11 packs positive intervals into deterministic equal-width clusters

The Calendar timeline SHALL validate overlap inputs as finite positive-duration intervals and SHALL order them by start instant, end instant, and stable source/event identity using locale-independent comparison. Input position SHALL NOT affect ordering or placement. Intervals SHALL overlap only when each starts strictly before the other's end, so an interval ending exactly when another starts SHALL free its column. Every maximal overlap-connected cluster SHALL use the minimum number of columns required by its maximum simultaneous occupancy, and every member SHALL receive one equal-width, non-covering column across that complete cluster.

#### Scenario: Input permutations keep the same placement

- **WHEN** the same valid intervals, including identical start/end bounds with distinct stable identities, arrive in different input orders
- **THEN** each identity receives the same output order, column, column count, and fractional horizontal bounds in every permutation
- **AND** no input index, title, or locale-dependent value participates in the tie-break

#### Scenario: Adjacent intervals share the full lane

- **WHEN** one interval ends at the exact instant another begins and neither overlaps another event
- **THEN** both intervals reuse column zero in separate one-column clusters
- **AND** each occupies the available width without an artificial overlap gap

#### Scenario: Transitive cluster uses minimum equal columns

- **WHEN** intervals form one transitive overlap-connected cluster whose maximum simultaneous occupancy is three
- **THEN** every cluster member receives one of exactly three equal-width columns
- **AND** no two time-overlapping visual rectangles cover one another

#### Scenario: Invalid interval cannot enter packing

- **WHEN** an overlap input has equal, reversed, invalid, or non-finite endpoints
- **THEN** the positive-interval boundary rejects it before sorting or placement
- **AND** point-event facts remain on their existing point-presentation path without invented duration

### Requirement: T11 placement is prepared from complete clusters before viewport clipping

The immutable timeline presentation SHALL calculate positive-interval overlap placement from every retained event in the relevant civil day before any vertical viewport clipping. A transitive cluster member outside the visible clock region SHALL still contribute to the cluster's column count and placement. Vertical scrolling, viewport clipping, and live zoom frames SHALL NOT sort, repack, or change an identity's horizontal placement. Gesture-frame work SHALL be limited to projection from prepared minute and fractional geometry.

#### Scenario: Off-screen member still determines visible placement

- **WHEN** an off-screen interval overlaps a second interval that connects transitively to a visible interval
- **THEN** all three are packed as one complete cluster before clipping
- **AND** scrolling the off-screen member into or out of view does not change any identity's column

#### Scenario: Zoom preserves columns

- **WHEN** a packed cluster is viewed at the minimum, default, and maximum supported zoom or changes scale during a pinch
- **THEN** every identity retains its prepared column and fractional horizontal bounds
- **AND** no frame performs interval sorting, clustering, local read, or React state write

### Requirement: T11 explicitly disambiguates intersecting effective targets

The renderer SHALL derive each retained event's effective target rectangle from its prepared horizontal placement and platform-minimum interaction geometry. Targets intersecting with positive area SHALL form deterministic conflict components. A single-event component SHALL keep one direct visual, pointer, and semantic event button. A multi-event component SHALL preserve every visual tile and SHALL expose one localized pointer chooser trigger over the component union in place of competing pointer targets. That chooser trigger MUST be excluded from the accessibility tree. Each underlying visible tile SHALL remain the sole semantic button for its original identity, with a target tied to meaningful visible geometry. Native reachability and unambiguous activation remain pending final QA and SHALL NOT be inferred from automation. Activating an event semantic button SHALL open exactly that identity; activating the pointer chooser SHALL present one accessible modal choice per involved original identity in stable start/end/identity order.

#### Scenario: Separated overlap columns remain directly openable

- **WHEN** simultaneous visual tiles occupy distinct columns and their effective target rectangles do not intersect
- **THEN** each tile retains one button and opens its original identity directly
- **AND** no chooser or duplicate semantic target is introduced

#### Scenario: Expanded tiny pointer targets require an explicit choice

- **WHEN** platform-minimum geometry makes two or more pointer targets intersect
- **THEN** activating their non-semantic pointer overlay opens a localized chooser instead of guessing an event from render order
- **AND** every involved event remains visibly rendered and retains exactly one chronological semantic button tied to that visual tile

#### Scenario: Choosing one crowded event is unambiguous

- **WHEN** the user activates a focused event semantic button or selects an event row from the chooser
- **THEN** the existing details route receives that event's original UID exactly once
- **AND** no sibling event, neighbour page, column number, or array index can be activated instead

#### Scenario: Chooser cancellation and replacement are safe

- **WHEN** the user cancels the chooser, or an event press arrives while paging or vertical motion owns the gesture
- **THEN** no details route opens
- **AND** stale identities and underlying pointer targets remain unavailable for activation

#### Scenario: Assistive technology encounters events rather than the pointer overlay

- **WHEN** a committed page contains a multi-event target conflict
- **THEN** traversal exposes each visual event tile once in complete chronological order and never exposes the pointer chooser overlay
- **AND** neighbour pages, child visuals, and the open chooser's background add no duplicate semantic nodes

#### Scenario: Native conflict geometry fails safely

- **WHEN** VoiceOver, TalkBack, Voice Control, or switch operation cannot reach and activate the intended conflict identity with meaningful visual geometry
- **THEN** the failing device/build/tool/identity is recorded as final QA rework
- **AND** the implementation requests a scoped D06 revision rather than adding hidden buttons or a duplicate tree

### Requirement: T11 proof is permutation-, density-, and revision-bound

Deterministic proof SHALL cover input permutations, stable tie-breaks, invalid input, adjacency, identical bounds, transitive clusters, minimum column count, equal widths, non-covering visuals, viewport and zoom stability, direct activation, chooser activation/cancellation/replacement, and semantic-node uniqueness. Evidence SHALL use identified fabricated adjacent, two-way, three-way, five-way, point, and tiny-target cases and SHALL record exact event, cluster, placement, mounted-visual, committed-semantic, open-chooser-semantic, and activation counts against the tested revision. Host automation SHALL NOT claim a final supported density, physical target feel, or VoiceOver/TalkBack acceptance.

#### Scenario: Fabricated dense cluster remains complete

- **WHEN** the identified five-way fabricated cluster and its adjacent/tiny companions are laid out and rendered
- **THEN** every retained identity has a deterministic placement or point visual and an unambiguous activation path
- **AND** the evidence reports exact counts without hiding events or applying an event-count threshold

#### Scenario: Evidence keeps device claims explicit

- **WHEN** focused and local-green host checks pass
- **THEN** the handoff records their exact commands, results, tested head, and fabricated frame/node measurements
- **AND** missing native-device accessibility and target-feel evidence remains explicitly assigned to the planned final-device slice

### Requirement: T12 publishes one committed chronological accessibility projection

The Calendar data layer SHALL derive one immutable accessibility projection from the complete committed validated page. It SHALL order every supported timed event by display-zone civil date, start instant, end instant, source, and original UID using locale-independent identity comparison. Each original identity SHALL occur exactly once. Zoom, viewport position, visual culling, React mount order, and mounted page positions MUST NOT determine semantic order or identity. Adjacent pages and filtered, malformed, unsupported, cancelled, hidden-source, or duplicate identities SHALL NOT enter the projection.

#### Scenario: Week traversal is chronological across columns

- **WHEN** a committed week contains events on multiple visible dates with tied start/end bounds
- **THEN** the projection orders them by date, start, end, source, and UID and contains each identity once
- **AND** changing input order, zoom, or vertical offset does not change the result

#### Scenario: Neighbour pages remain absent

- **WHEN** neighbour pages are mounted in the pager
- **THEN** only the committed page contributes event nodes to traversal
- **AND** a settle swaps to the destination projection without exposing both pages

#### Scenario: Invalid duplicate identity is rejected

- **WHEN** one committed page would contain the same source/UID identity more than once
- **THEN** projection preparation rejects the invalid model in development and test
- **AND** it does not rename, merge, or silently drop one copy to fabricate uniqueness

### Requirement: T12 keeps off-viewport traversal complete and bounded

The committed page SHALL keep every projected event natively reachable through the existing bounded timeline owner, including events beginning at 01:00 and 23:00 when neither is initially visible. Reaching or restoring an off-viewport event SHALL move the existing vertical owner to reveal the associated visible target before native focus or activation. The renderer SHALL retain no semantic page history, unbounded cache, second scroll owner, hidden mirror list, or arbitrary event cap. Zoom SHALL change geometry without changing reachable identities, order, or complete labels.

#### Scenario: Both clock extremes are reachable

- **WHEN** the initial viewport is centred near 10:00 and the committed page also contains 01:00 and 23:00 events
- **THEN** supported assistive traversal reaches all three events once in time order and reveals each associated tile
- **AND** it does not require switching to Agenda or mounting a duplicate accessibility list

#### Scenario: Zoom preserves semantic content

- **WHEN** the same committed page moves among minimum, default, and maximum zoom
- **THEN** every event retains its identity, relative traversal position, and complete localized label
- **AND** only its visible and activation geometry changes with the shared clock scale

#### Scenario: Long sessions remain bounded

- **WHEN** the student pages repeatedly through many dates
- **THEN** semantic nodes and focus refs are retained only for the committed page
- **AND** released page identities do not accumulate with session length

### Requirement: T12 restores logical focus after accepted context changes

The Calendar SHALL remember the last natively accessibility-focused event by original source/UID and relevant date, using an inbound platform accessibility-focus event tied to that event's sole visible target. Pointer press, event activation, keyboard/input `onFocus`, and an outbound focus request MUST NOT fabricate this memory. Only a live identity on the committed page of the focused Calendar route may update it. After details return, accepted paging, or a Day/Week mode change, Calendar SHALL wait for the complete matching presentation and native target registration, reveal the target when necessary, and request focus once on that surviving identity. If the identity is absent, focus SHALL fall back to its relevant committed date heading when present, otherwise to the existing visible month/year navigation title. That title SHALL have a header role and an accessible label containing its visible month/year words and the full date context of the accepted presentation. Stale settles, transient motion, zoom frames, and adjacent pages SHALL NOT move focus. The accepted date context SHALL be announced once; title focus that conveys the context MUST NOT be paired with a second settled-context announcement.

#### Scenario: Native accessibility focus is the only event-memory signal

- **WHEN** VoiceOver or TalkBack moves accessibility focus to a committed visible event target
- **THEN** the native observer reports that target's original identity and date to the bounded focus coordinator
- **AND** an unmatched, stale, off-route, adjacent-page, input-focus, press, or outbound-focus event does not overwrite the remembered identity

#### Scenario: Details return restores the surviving event

- **WHEN** a user opens an event and returns while the same identity remains in the committed presentation
- **THEN** the Calendar reveals and focuses that event's existing visible semantic target once
- **AND** it does not focus a recycled sibling, duplicate the event node, or repeat the settled context announcement

#### Scenario: Missing identity falls back by date

- **WHEN** paging or a mode change removes the previously focused identity from the committed presentation
- **THEN** focus moves to the relevant date heading if that date remains present, otherwise to the committed page heading
- **AND** no stale ref or array position determines the destination

#### Scenario: Missing date falls back to the visible month/year title

- **WHEN** the remembered event and date are both absent after the accepted presentation settles
- **THEN** focus moves to the existing visible Calendar navigation title, retaining its localized month/year text and exposing an accessible label with those words plus the accepted full-date context
- **AND** its registered ref, page key, and label match the settled presentation, including after late registration or route return
- **AND** no first-date-cell substitution, hidden heading, extra toolbar, pending-date label, or duplicate settled announcement is introduced

#### Scenario: Obsolete settlement cannot steal focus

- **WHEN** the pager moves on before a settled page's target mounts or registers
- **THEN** that page's restoration cannot scroll or request native focus
- **AND** only the latest settled, ready context may restore focus and announce settlement

### Requirement: T12 preserves the native verification boundary

The implementation SHALL retain the checked-in fabricated 01:00/10:00/23:00 and overlap fixture plus repeatable preparation/reset steps. Automated checks SHALL prove deterministic projection, one native target per identity, overlay exclusion, exact routing, bounded ownership, and focus behavior on the exact PR head. Actual iOS and Android screen reader, voice, and switch operation SHALL remain pending and unverified on the final QA checklist until executed. Final QA evidence SHALL record the tested head/build, platform/device, traversal order, offscreen reachability, focused target geometry, exact-identity activation, page/zoom alternatives, details return, mode change, largest text, and touched regressions. Host tests or earlier epics MUST NOT be reported as native evidence. If the approved visual-target tree fails bounded reachability or activation geometry, request a scoped D06 revision before adding another semantic strategy.

#### Scenario: Final native QA passes the approved tree

- **WHEN** every required iOS and Android assistive path traverses each fixture event once, reveals both extremes, and activates the labelled visible identity
- **THEN** the final QA record names every executed result and any rerun required after relevant edits
- **AND** the native checklist may be marked passed only for the tested head and build

#### Scenario: Final native QA fails the approved tree

- **WHEN** any required platform cannot reach an off-viewport event or cannot unambiguously activate its visible identity
- **THEN** the slice records the failing platform/tool/build/fixture as rework and requests the scoped D06 revision
- **AND** no hidden duplicate, accessibility-only destination, experimental order API, or unapproved semantic layer is added

#### Scenario: Automation proves only deterministic contracts

- **WHEN** pure, component, screen, repository-contract, and CI checks pass
- **THEN** they prove ordering, uniqueness, labels, callbacks, focus state, owner count, and stop-condition wiring
- **AND** they do not claim VoiceOver, TalkBack, Voice Control, switch, large-text, or physical activation behavior without the recorded native run

### Requirement: T06 uses one bounded dynamic wall-clock scale

The owned Day/Week renderer SHALL use one finite pixels-per-hour value for gutter labels, minor and major lines, the 24:00 closing boundary, day columns, every mounted pager page, and scroll content height. Initial T06 values SHALL be 40 px/hour minimum, 60 px/hour default, and 120 px/hour maximum; pinch SHALL remain continuous within those inclusive bounds and menu commands SHALL move by 10 px/hour. Day and Week SHALL share the same value. Agenda, event facts, page count, and native owner count SHALL remain unchanged.

#### Scenario: Every clock primitive follows one scale
- **WHEN** zoom changes from one valid value to another
- **THEN** every label, grid boundary, page, day column, closing boundary, and content extent derives from the new value
- **AND** no fixed 60 px/hour canvas coordinate remains outside the named default

#### Scenario: Initial bounds are deterministic
- **WHEN** repeated zoom commands or continuous pinch input cross either initial limit
- **THEN** the scale clamps exactly to 40 or 120 px/hour
- **AND** reset returns exactly to 60 px/hour

#### Scenario: Renderer ownership remains singular
- **WHEN** the zoomed shell is inspected in Day and Week
- **THEN** it retains one automatic-inset native vertical owner, and one windowed native horizontal pager
- **AND** no compatibility, fallback, or second renderer is mounted

### Requirement: T06 preserves the chosen focal clock coordinate

Pinch SHALL preserve the wall-clock coordinate under the live gesture focal point, and menu zoom SHALL preserve the coordinate at the measured usable viewport center. Geometry SHALL use the live raw native offset, actual timed viewport, and current native top/bottom insets. Focal preservation SHALL be exact before boundary clamping and SHALL settle at the nearest valid native offset when the day boundary makes exact preservation impossible.

#### Scenario: Unclamped pinch keeps clock time stationary
- **WHEN** scale changes during a pinch whose solved offset lies within the native scroll range
- **THEN** `(rawOffset + focalY) / pixelsPerHour` is unchanged within deterministic numeric tolerance
- **AND** releasing the gesture introduces no second correction or jump

#### Scenario: Menu commands anchor the usable viewport center
- **WHEN** Zoom in, Zoom out, or Reset changes scale
- **THEN** the clock coordinate at the center between the live automatic insets remains stationary unless clamped by a day boundary

#### Scenario: Insets and boundaries are explicit
- **WHEN** top/bottom insets are zero or non-zero and the solved offset is before 00:00 or after 24:00
- **THEN** the raw offset clamps against the inset-aware native range
- **AND** no assumed zero inset or last-settled React offset participates in the focal equation

### Requirement: T06 pinch takes precedence over one-finger interactions

The installed Gesture Handler/Reanimated path SHALL give an active two-finger pinch precedence over one-finger presses, native vertical drag/momentum, and native horizontal drag/settle. A pinch start SHALL prevent an unaccepted page from committing, cancel press recognition, and coordinate the accepted native owners without adding custom replacement physics. Pointer-count changes, cancellation, app backgrounding, mode or date replacement, and unmount SHALL leave one coherent settled scale/offset/header state.

#### Scenario: Second finger interrupts vertical motion
- **WHEN** a second finger begins pinch during native vertical drag or momentum
- **THEN** pinch owns the interaction and preserves its focal clock coordinate
- **AND** release produces no drift or delayed vertical correction

#### Scenario: Second finger interrupts horizontal motion
- **WHEN** a second finger begins pinch during horizontal drag or settle
- **THEN** no day/week destination commits from that interrupted motion
- **AND** the dated header and centered grid remain aligned with no delayed page change

#### Scenario: Finger-count and lifecycle changes settle coherently
- **WHEN** the pinch loses a finger, is cancelled, backgrounds, unmounts, or meets a mode or date replacement
- **THEN** scale, offset, pager, and header follow one cancellation/settlement path
- **AND** no stale callback overwrites the newer committed context

### Requirement: T06 keeps frame-frequency zoom geometry off React state

Live scale, native raw offset, viewport/inset geometry, focal point, and pinch baseline SHALL reside in feature-private UI-thread state while a gesture is active. Scroll and pinch frames SHALL NOT write React state, persistence, formatted labels, event data, or navigation. React SHALL receive only discrete measurement/configuration changes and settled zoom/offset results.

#### Scenario: Pinch frames remain UI-thread local
- **WHEN** a continuous pinch and native scroll emit frame-frequency updates
- **THEN** shared values and worklet-compatible pure geometry compute the visual result
- **AND** no per-frame `setState`, persistence write, event query, formatting pass, or `runOnJS` bridge occurs

#### Scenario: Settlement crosses the boundary once
- **WHEN** a pinch or menu command settles successfully
- **THEN** the controller receives one coherent clamped scale/offset result for persistence and later restoration

### Requirement: T06 provides accessible bound-aware zoom commands

The screen-owned Calendar menu SHALL expose localized Zoom in, Zoom out, and Reset actions for Day and Week. Zoom in/out SHALL be disabled at their measured inclusive bounds and Reset SHALL be disabled at the default. A successful menu command SHALL announce the settled rounded percentage relative to the default once; a limit SHALL communicate its state without requiring pinch, color, or gesture discovery. Controls SHALL retain platform minimum targets and SHALL NOT change the chronological accessibility representation.

#### Scenario: Zoom is operable without pinch
- **WHEN** a student uses the Calendar menu in Day or Week
- **THEN** Zoom in, Zoom out, and Reset produce the same bounded zoom domain as pinch
- **AND** each successful command preserves viewport-center clock time and announces one settled result

#### Scenario: Limits communicate disabled state
- **WHEN** zoom is at 40 or 120 px/hour or at the 60 px/hour default
- **THEN** respectively Zoom out, Zoom in, or Reset exposes disabled state
- **AND** translated labels communicate the available action or reached limit

#### Scenario: Agenda does not gain visual zoom
- **WHEN** Agenda is active
- **THEN** its list, accessibility order, scroll position, refresh, and event activation remain unchanged
- **AND** returning to Day or Week restores the shared timeline zoom

### Requirement: T06 evidence is deterministic and revision-bound

Pure focal geometry, scale validation, inset-aware clamps, repeated commands, finger-count transitions, persistence, and reset preservation SHALL have deterministic automated coverage. Renderer and repository-contract checks SHALL retain automatic insets, one vertical owner, one windowed horizontal pager, native header synchronization, no second renderer, and no per-frame React state path. Native arbitration, focal stability, bound communication, restart persistence, and prior accepted interactions SHALL be recorded against the exact tested build and full canonical owner checklist.

#### Scenario: Pure zoom behavior has property and boundary proof
- **WHEN** the focused data tests run
- **THEN** every introduced statement and branch is covered
- **AND** properties prove unclamped focal invariance, inclusive clamps, finite recovery, repeated commands, and valid offsets across viewport/inset combinations

#### Scenario: Existing Calendar behavior remains available
- **WHEN** focused renderer, screen, settings, storage, and repository-contract suites run
- **THEN** native pager/header synchronization, bounded windowed retention, one vertical owner, weekend preferences, Agenda/details access, and absence of a second renderer remain proven

#### Scenario: Native evidence is not inferred from host tests
- **WHEN** local verification runs on the non-virtualized host
- **THEN** it reports only deterministic host results
- **AND** iOS/Android arbitration, release jump, automatic-inset stability, VoiceOver/TalkBack, and device feel remain explicit build-bound checklist evidence rather than fabricated claims

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

- **WHEN** neighbour pages are mounted while paging is unsettled
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

Deterministic proof SHALL cover chunk planning and half-open boundaries, V1 model completeness, stale-completion rejection, page retention, same-day support classification, stable chronological ordering, actual-time tile geometry across bounded zoom, visible/semantic filtering, composed accessible labels, checklist integration, original-identity activation, press cancellation, and zero network calls on page navigation. Introduced pure range/domain/page logic SHALL have 100% statement and branch coverage. The implementation handoff SHALL record exact commands and results plus initial fabricated row/preparation/retention measurements without claiming representative p50/p95 data. Host automation SHALL NOT claim native assistive-technology, offline device, appearance, or gesture-feel results; the complete canonical owner checklist SHALL remain bound to the exact tested revision and build.

#### Scenario: Ordinary fabricated range is measured without overclaiming

- **WHEN** the T09 fixture populates the mounted pages with ordinary local rows
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

### Requirement: Calendar pages through a windowed native horizontal ScrollView

The Day/Week timeline SHALL page through one React Native horizontal ScrollView nested beside the hour gutter inside the native vertical ScrollView, with native one-page snapping on both platforms. Pages SHALL be absolute indexes, the civil `EpochDay` in Day mode and the week ordinal aligned to the first weekday in Week mode, keyed by the content address `mode:epochDay` and positioned at index × a pixel-aligned page width equal to the pager's width. The content SHALL span a window of 260 pages on either side of a base index and SHALL re-base without motion when a settle lands within 30 pages of an edge, so navigation has no visible date limit. The renderer SHALL mount only the centre page and two pages on either side. During ordinary paging the scroll owner and every page that remains in the window MUST NOT remount; a Day/Week switch MAY remount the scroll owner. The UI thread SHALL derive the rounded and settled page from the native offset and SHALL call React only on page-boundary crossings and settles. Repeated paging SHALL NOT increase mounted pages, retained presentations, gesture, timer, or completion work with session length. The calendar feature SHALL NOT import `react-native-pager-view`.

#### Scenario: Neighbour pages cover active movement

- **WHEN** a horizontal interaction begins from a settled page
- **THEN** the settled page and two complete pages on each side of it are mounted
- **AND** no other page is mounted

#### Scenario: A crossing keeps mounted pages

- **WHEN** the rounded page crosses a page boundary
- **THEN** only the page entering the window mounts and only the page leaving it unmounts
- **AND** the scroll owner and every page still in the window keep their identity

#### Scenario: Fast swipes land before React commits

- **WHEN** three swipes land before React commits a crossing
- **THEN** native paging lands on the third page
- **AND** the date commits once, on that page

#### Scenario: Far dates re-base without motion

- **WHEN** a settle lands within 30 pages of the content edge
- **THEN** the window re-bases around that page with a non-animated scroll
- **AND** the visible page, title, and committed date do not change

#### Scenario: Long paging remains bounded

- **WHEN** the student pages forward and backward repeatedly
- **THEN** at most five pages are mounted after every settle
- **AND** page presentations stay within the bounded presentation cache

### Requirement: Calendar wiring is proven in CI and on device

The change MUST prove complete-day geometry, native settled-offset retention, explicit clock formatting, native scroll/pager ownership, five/seven civil-date derivation, dated header/grid alignment, Today identity, default/persisted preference behavior, bounded seven-day paging, localized settled semantics, Calendar remount and Week/Agenda restoration, unchanged Agenda dates, retained event activation, stale-event rejection, and current owned-renderer integrity with focused Jest and repository checks. The changed-code React Doctor scan MUST report no blocking warning or error in the renderer without suppression, gate weakening, compiler opt-out, or moving the same issue behind an alias. The implementation MUST preserve the three established Maestro journeys and their shared Agenda helper. Native readability, Dynamic Type, header/grid alignment, gesture continuity, preference restart, VoiceOver/TalkBack traversal, and retained Calendar/Agenda checks SHALL be recorded through the ticket's testable build and owner checklist rather than claimed from this host.

#### Scenario: Dated columns are proven without a vendor mock

- **WHEN** focused pure, preference, renderer, Settings, and Calendar suites run
- **THEN** they exercise five/seven civil dates, weekend identity, default/false/true persistence, Today identity, equal column structure, locale/zone labels, native owner configuration, pager settlement, and retained vertical offset
- **AND** they require no calendar-kit Jest setup, fallback renderer, handwritten worklet runtime, host-locale assumption, or device-local date arithmetic

#### Scenario: UI-thread paging progress is proven at the scroll-handler boundary

- **WHEN** the focused renderer suite delivers fractional horizontal scroll, drag and momentum events through the Reanimated scroll-handler mock for every handler key
- **THEN** the shared horizontal offset drives the header-strip transform forward and backward, and a page settles only when the offset is page-aligned with no finger down and no momentum
- **AND** snap-back and events that describe another content size settle no page and announce no date

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

### Requirement: T05 pages by the selected civil unit through the windowed pager

Day mode SHALL page exactly one effective-display-zone civil date per accepted previous/next gesture or accessibility action. Week mode SHALL retain exactly one complete launch-week step. Both modes SHALL page through the windowed native horizontal pager and commit a destination only when the pager settles page-aligned with no finger down and no momentum. Show weekends SHALL affect week columns only and SHALL never skip Saturday or Sunday in day mode.

#### Scenario: Day paging crosses a hidden weekend one date at a time

- **WHEN** Show weekends is off and the student pages Day forward from Friday
- **THEN** the next accepted pages are Saturday and then Sunday before Monday
- **AND** every page contains one column

#### Scenario: Week paging retains complete-week stride

- **WHEN** the student pages Week in either direction
- **THEN** the accepted anchor changes by one seven-civil-date launch week
- **AND** its visible columns remain five or seven according to Show weekends

#### Scenario: Both modes keep the windowed pager and settle-time commit

- **WHEN** either timeline mode is inspected during horizontal navigation
- **THEN** the settled page and at most two pages on either side are mounted in the windowed pager
- **AND** the old committed date remains authoritative until one page settles

### Requirement: T09 presents each page from a bounded chunk window

The Calendar data seam SHALL present each mounted Day or Week page as one frozen `PagePresentationV1` built from a screen-level window store. The store SHALL read the 28-day chunks, aligned to the first weekday, that hold the mounted pages plus one chunk on either side; SHALL guard each chunk write with the sequence of the read that requested it; and SHALL keep a chunk's previous rows until its re-read lands. Each page SHALL carry an explicit `loading`, `ready`, or `error` status and SHALL contain its ordered civil-date columns and, when ready, every supported event tile belonging to those columns. A loading page SHALL render its dates and grid without tiles and SHALL NOT be presented or announced as empty. Page identity SHALL be the content address `mode:epochDay`, independent of the committed anchor and of mount position. Stale completions SHALL be discarded. Resident chunks and cached presentations SHALL stay bounded, at most six chunks and sixteen cached pages; no unbounded page cache or permanent full-event JavaScript index SHALL be introduced.

#### Scenario: Swiping does not replay the previous week while a local read is pending

- **WHEN** a swipe settles on a page whose chunk is resident while a re-read of that chunk is pending
- **THEN** that page is immediately the committed page with its event tiles
- **AND** a later re-read updates tiles without changing page identities or replaying the swipe

#### Scenario: Mounted Week pages are complete and populated

- **WHEN** a committed Week and its neighbours contain valid ordinary local classes
- **THEN** each mounted page presentation contains its matching ordered display-zone columns and classes
- **AND** every tile belongs to the page/date computed from its interval rather than its mount position

#### Scenario: Out-of-order completion cannot overwrite a newer read

- **WHEN** a newer read of a chunk supersedes a still-resolving one
- **THEN** the stale completion is discarded and cannot overwrite the newer rows
- **AND** the chunk's previous rows stay presented until the newer read lands

#### Scenario: An unread page presents loading, not empty

- **WHEN** a page enters the window before its chunk has been read
- **THEN** it presents its dates and grid with no tiles and a busy state
- **AND** it is never labelled or announced as an empty day

#### Scenario: Repeated local paging stays bounded

- **WHEN** the student settles many adjacent pages
- **THEN** at most six chunks stay resident and at most sixteen page presentations stay cached
- **AND** released page event payloads do not accumulate with session length
