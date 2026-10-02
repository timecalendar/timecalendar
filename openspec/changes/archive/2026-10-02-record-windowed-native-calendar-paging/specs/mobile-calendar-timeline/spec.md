## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: T02 keeps a bounded three-page working set

**Reason**: The windowed native horizontal ScrollView replaces the three-page pager and its replacement generations (Architecture Book ADR 062; calendar-native-paging D01 and D02).

**Migration**: The bounded working set is now the requirement "Calendar pages through a windowed native horizontal ScrollView": about five mounted pages keyed by content address in a re-based content window.

### Requirement: Wiring proven in CI grid and performance on-device

**Reason**: Its proof scenarios named the PagerView page-scroll boundary, which no longer exists.

**Migration**: Replaced by "Calendar wiring is proven in CI and on device", which proves the same wiring at the horizontal ScrollView's scroll-handler boundary.

### Requirement: T05 pages by the selected civil unit

**Reason**: It required exactly three direct native pager children and idle settlement.

**Migration**: Replaced by "T05 pages by the selected civil unit through the windowed pager", which keeps the day and week strides and commits on a page-aligned settle.

### Requirement: T09 publishes one complete bounded V1 timeline presentation

**Reason**: It required a three-page presentation tied to a renderer generation.

**Migration**: Replaced by "T09 presents each page from a bounded chunk window": one frozen presentation per mounted page, an explicit page status, and a bounded chunk store.

## RENAMED Requirements

- FROM: `### Requirement: T02 commits one revisioned settled week context`
- TO: `### Requirement: T02 commits one settled date context`
