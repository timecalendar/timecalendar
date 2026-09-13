## ADDED Requirements

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

The owned week surface SHALL render one committed date-header row beneath the existing native month/year title and above vertical clock motion. The row SHALL reserve the same fixed hour-gutter width as the timed surface and SHALL render one equal-width cell per visible date. Every previous/current/next clock page SHALL render the same count and ordering of equal-width day columns, with vertical boundaries aligned to the committed header structure at supported phone and portrait-tablet widths. Each header SHALL show a locale-aware weekday and calendar date. The effective display-zone date matching Today SHALL have a visible shape or typography cue in addition to any color and SHALL expose Today meaning semantically without becoming a selectable date control.

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

#### Scenario: Week headers stay pinned to committed context

- **WHEN** the student scrolls vertically or holds an unsettled horizontal page transition
- **THEN** the header remains visible and continues to label the committed week
- **AND** only an accepted week settle replaces its dates together with the native title, canvas label, Agenda range, and page generation

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

## MODIFIED Requirements

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

The change MUST prove complete-day geometry, native settled-offset retention, explicit clock formatting, native scroll/pager ownership, five/seven civil-date derivation, dated header/grid alignment, Today identity, default/persisted preference behavior, bounded seven-day paging, localized settled semantics, Calendar remount and Week/Agenda restoration, unchanged Agenda dates, retained event activation, revision rejection, and current owned-renderer integrity with focused Jest and repository checks. It MUST preserve the three established Maestro journeys and their shared Agenda helper. Native readability, Dynamic Type, header/grid alignment, gesture continuity, preference restart, VoiceOver/TalkBack traversal, and retained Calendar/Agenda checks SHALL be recorded through the ticket's testable build and owner checklist rather than claimed from this host.

#### Scenario: Dated columns are proven without a vendor mock

- **WHEN** focused pure, preference, renderer, Settings, and Calendar suites run
- **THEN** they exercise five/seven civil dates, weekend identity, default/false/true persistence, Today identity, equal column structure, locale/zone labels, native owner configuration, pager settlement, and retained vertical offset
- **AND** they require no calendar-kit Jest setup, fallback renderer, handwritten worklet runtime, host-locale assumption, or device-local date arithmetic

#### Scenario: Retained paging, Agenda, and details wiring is proven

- **WHEN** the Calendar screen suite hides weekends, pages, switches to Agenda and back, and activates a fabricated weekend event
- **THEN** paging advances seven civil dates, Week retains its clock offset, Agenda retains its seven-day range, and the existing unified event-details route receives that event identity

#### Scenario: Owned renderer footprint remains coherent

- **WHEN** source, storage classification, dependency, Jest, coverage, lint, formatting, React Doctor, Maestro harness, and repository-contract checks run
- **THEN** only the intended Calendar/Settings modules and approved dependencies are present
- **AND** no vendor, alternate pager/scroll path, fallback, compatibility, duplicate renderer, or unrelated sensitive-surface change appears

#### Scenario: Native evidence is not fabricated

- **WHEN** local verification completes on the non-virtualized development host
- **THEN** it records deterministic automated results without claiming native readability, restart, layout, gesture, or assistive-technology execution
- **AND** the testable build identifies the revision and exact T04 device checklist still awaiting owner verification

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

### Requirement: T02 paging is operable and announces only settled context

The Calendar week surface SHALL expose translated previous-week and next-week accessibility actions as decrement/increment on the adjustable canvas. Each action SHALL enter the same one-page revisioned transition path as a swipe. No separate full-date row or visible arrow toolbar SHALL render. One committed localized weekday/date row SHALL render in the week columns beneath the native month/year title. Development builds SHALL show per-week preview labels, measured viewport bounds, and stable contrasting tints within the moving pages; production builds SHALL omit these diagnostics. Only an accepted changed-week settle SHALL announce the localized destination week once. Adjacent recycled pages MUST NOT create duplicate native focus trees, and reduced-motion operation SHALL settle without nonessential travel animation.

#### Scenario: Previous and next actions move one week

- **WHEN** the student activates the labelled previous-week or next-week action
- **THEN** the corresponding adjacent week is requested through the same revisioned settle path as a swipe
- **AND** the action remains operable without performing a gesture

#### Scenario: One accepted settle produces one announcement

- **WHEN** a current transition revision settles on a different week
- **THEN** the localized settled week and dated columns update and the week is announced exactly once
- **AND** finger movement, snap-back, cancellation, stale completion, duplicate delivery, and preference changes produce no extra week announcement

#### Scenario: Recycled neighbours are not duplicate semantics

- **WHEN** assistive technology traverses the settled Calendar week
- **THEN** it encounters one adjustable committed week context with labelled paging actions and one chronological committed date row
- **AND** offscreen previous/next visual slots are hidden from the accessibility tree until committed

#### Scenario: Reduced motion settles directly

- **WHEN** reduced motion is enabled and a week change is requested
- **THEN** the same destination is committed and announced through the revisioned path without nonessential travel animation
