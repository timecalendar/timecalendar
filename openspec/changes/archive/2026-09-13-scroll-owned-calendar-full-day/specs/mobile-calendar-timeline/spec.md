## ADDED Requirements

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

The renderer SHALL place one left hour gutter outside the three-page horizontal translation and SHALL drive its vertical label plane and every page's vertical grid plane from one authoritative offset. The native Calendar date heading SHALL remain outside vertical motion. Horizontal week settlement, rerender, retained tab/view changes, and lifecycle/layout cancellation SHALL preserve the same visible clock position, except that a smaller viewport MAY clamp an otherwise invalid offset. Frame-frequency vertical values MUST remain off React state; only a settled, clamped offset MAY be reported for restoration.

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

### Requirement: T03 locks one-finger interaction to one axis and cancels presses

One-finger movement on the timed surface SHALL remain undecided within tap tolerance, then lock to exactly one dominant horizontal or vertical axis. The chosen axis SHALL remain fixed through diagonal continuation and reversal until the gesture terminates. Horizontal lock SHALL drive only the T02 one-week path; vertical lock SHALL drive only the bounded clock offset and MUST NOT request or announce a week. Movement beyond tap tolerance SHALL cancel press eligibility and the native gesture owner SHALL cancel active JavaScript responders. Two-finger behavior remains reserved for the later pinch slice.

#### Scenario: Horizontal movement cannot scroll vertically

- **WHEN** horizontal movement wins axis selection and later becomes diagonal or reverses
- **THEN** only the bounded horizontal page transform changes
- **AND** the visible vertical clock offset remains unchanged

#### Scenario: Vertical movement cannot page a week

- **WHEN** vertical movement wins axis selection and later becomes diagonal or reverses
- **THEN** only the bounded vertical offset changes
- **AND** no week request, date revision, title change, or settled-week announcement occurs

#### Scenario: Ambiguous diagonal movement waits for dominance

- **WHEN** one-finger displacement exceeds neither the tap tolerance nor the required axis dominance
- **THEN** neither horizontal nor vertical movement is committed
- **AND** a later dominant displacement selects one axis without a two-axis slide or settle jump

#### Scenario: Movement cancels a pending press

- **WHEN** movement exceeds tap tolerance before release
- **THEN** the interaction becomes ineligible to activate a press
- **AND** scroll or page movement cannot also produce a tap result

#### Scenario: Cancellation returns to valid resting state

- **WHEN** an active or undecided gesture fails, is cancelled, backgrounds, resizes, or unmounts
- **THEN** both axes finish at their last valid committed or clamped resting values
- **AND** stale horizontal or vertical completion callbacks cannot restart motion

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

## MODIFIED Requirements

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

### Requirement: Day/week timeline screen as a brand surface

At the T03 milestone, the feature `renderer/` sublayer SHALL provide a horizontally paged, vertically scrollable empty owned week surface on the real Calendar route as a designed brand surface themed from `@/theme` tokens. It SHALL retain the native month/year title, complete previous/current/next empty pages, and labelled screen-reader one-week actions while adding the complete clock grid and one pinned left gutter without importing a vendor renderer. Timeline events, current-time indicator/positioning, distinct day behavior, weekday columns, weekend filtering, event activation, and zoom SHALL remain absent until their numbered slices land.

#### Scenario: Owned full-day shell renders on the real route

- **WHEN** `timecalendar-dev://calendar` is opened
- **THEN** the native title, bounded paged lane, pinned gutter, and vertically scrollable complete-day grid render through the existing thin Calendar route
- **AND** no calendar-kit, fallback, compatibility, or duplicate renderer mounts

#### Scenario: Brand surface uses owned tokens

- **WHEN** the T03 shell renders in a supported theme
- **THEN** its surface, borders, lines, labels, text, and navigation presentation derive from `@/theme` and shared semantic primitives

#### Scenario: Later timeline capabilities remain absent

- **WHEN** the T03 shell is inspected or exercised
- **THEN** it contains no event/all-day tiles, current-time indicator or initial-now positioning, weekday/date columns, weekend filtering, distinct day behavior, event activation, or zoom

#### Scenario: Empty motion has no event write path

- **WHEN** the paged and scrolled shell is used
- **THEN** it neither reads events for presentation nor mutates or rewrites synced or personal event facts

### Requirement: Internationalization and accessibility

Every user-facing string added or retained on the T03 Calendar week surface SHALL be translated in French and English with typed key parity. Numeric hour labels SHALL be produced through the pure explicit device-clock formatter rather than translation keys. The native month/year title SHALL remain the sole page header. The canvas SHALL expose the committed locale- and display-zone-aware week date as one adjustable accessibility label with translated increment/decrement actions. Neighbour pages, decorative grid lines, and duplicate gutter semantics SHALL not create additional focus contexts. Retained interactive controls SHALL expose translated labels and valid roles/states. Only an accepted changed-week settle SHALL announce the localized destination once; vertical movement, intermediate motion, and recycled pages SHALL not announce.

#### Scenario: French and English settled headings

- **WHEN** the full-day shell settles the same launch week in French and English
- **THEN** its committed canvas label uses the corresponding locale and effective display zone
- **AND** neither catalog exposes a raw translation key

#### Scenario: One committed week context is accessible

- **WHEN** assistive technology traverses the settled T03 shell
- **THEN** it discovers one localized committed week label on an adjustable canvas
- **AND** recycled pages, grid lines, and repeated gutter content do not expose duplicate headings or canvas targets

#### Scenario: Paging controls describe supported actions

- **WHEN** assistive technology traverses Calendar chrome and the owned week surface
- **THEN** previous, next, and every retained action have translated labels, valid roles/states, platform targets, and supported results
- **AND** absent future timeline behavior is not exposed as an action

#### Scenario: Vertical movement preserves settled semantics

- **WHEN** the student scrolls vertically without changing week
- **THEN** the canvas label and native title continue to name the committed week
- **AND** no date announcement is emitted

#### Scenario: Settled week context is announced once

- **WHEN** the committed week changes after an accepted horizontal swipe or control action
- **THEN** its localized date context is announced once
- **AND** vertical movement, transient horizontal movement, cancellation, or obsolete completion is not announced

### Requirement: Wiring proven in CI grid and performance on-device

The change MUST prove complete-day geometry, vertical clamps, label formatting input, one-axis/press state, aligned shared offsets, bounded one-week paging, localized settled semantics, Calendar remount and Week/Agenda offset restoration, retained Agenda event activation, revision rejection, and current owned-renderer integrity with focused Jest and repository checks. It MUST preserve the three established Maestro journeys and their shared Agenda helper. Native vertical feel, diagonal/reversal arbitration, frame continuity, gutter alignment, device clock toggling, retained generations, settled announcements, mount/return, and Agenda/details checks SHALL be recorded through the ticket's testable build and owner checklist rather than claimed from this host.

#### Scenario: Full-day motion is proven without a vendor mock

- **WHEN** focused pure and renderer suites run
- **THEN** they exercise full-day positions, clamps, true/false/null clock formatting, axis locking, responder cancellation configuration, shared gutter/grid offsets, three-page continuity, and top/bottom reachability
- **AND** they require no calendar-kit Jest setup, fallback renderer, handwritten worklet runtime, or host-locale assumption

#### Scenario: Retained paging, Agenda, and details wiring is proven

- **WHEN** the Calendar screen suite scrolls to an intermediate time, pages the empty week, switches to Agenda and back, and activates a fabricated event
- **THEN** the week retains its clock offset, Agenda uses the committed date range, and the existing unified event-details route receives that event identity

#### Scenario: Owned renderer footprint remains coherent

- **WHEN** source, dependency, Jest, coverage, lint, formatting, React Doctor, Maestro harness, and repository-contract checks run
- **THEN** only the intended full-day owned modules and approved motion/localization dependencies are present
- **AND** no vendor, alternate pager/scroll path, fallback, compatibility, duplicate renderer, or unrelated sensitive-surface change appears

#### Scenario: Native evidence is not fabricated

- **WHEN** local verification completes on the non-virtualized development host
- **THEN** it records deterministic automated results without claiming native gesture, frame, device-clock, or assistive-technology execution
- **AND** the testable build identifies the revision and exact T03 device checklist still awaiting owner verification

### Requirement: T01 retains only working Calendar controls

Every enabled Calendar control at the T03 milestone SHALL produce an observable supported result. The view selector SHALL expose the full-day paged Week surface and Agenda; it SHALL NOT expose a Day/Week switch before T05 implements distinct day behavior. Add, Week/Agenda selection, one-week previous/next, Today, vertical scrolling, Agenda refresh/retry, and Agenda event activation SHALL preserve localized accessibility behavior. Today SHALL resolve and commit the launch week containing the current display-zone date through the same coherent date path and SHALL preserve the T03 clock offset because current-time positioning belongs to a later slice.

#### Scenario: View choices are implemented

- **WHEN** the student opens the Calendar view selector
- **THEN** every offered choice renders a distinct working surface
- **AND** no enabled choice silently does nothing

#### Scenario: T03 exposes only implemented timeline movement

- **WHEN** the T03 week surface renders
- **THEN** it offers bounded vertical time scrolling plus the horizontal gesture and labelled previous/next one-week actions
- **AND** it offers no weekday selection, day/week switching, zoom, current-time positioning, or event activation

#### Scenario: Retained and movement controls remain accessible

- **WHEN** the student uses a retained Calendar, paging, or vertical interaction
- **THEN** every action has a translated or correctly formatted accessible presentation and an observable supported result
- **AND** every visible retained control preserves its platform minimum target

#### Scenario: Today commits the current launch week without inventing vertical behavior

- **WHEN** Today is available from a non-current week and the student activates it
- **THEN** the selected date and paged surface settle on the complete launch week containing today in the effective display timezone
- **AND** the established T03 clock offset is preserved rather than moved to current time
