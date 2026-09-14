## MODIFIED Requirements

### Requirement: Day/week timeline screen as a brand surface

At the T05 milestone, the feature `renderer/` sublayer SHALL provide horizontally paged, vertically scrollable empty owned day and week surfaces on the real Calendar route as one designed brand surface themed from `@/theme` tokens. Day SHALL show exactly one display-zone civil date; week SHALL show the complete Monday-first launch week as five or seven visible columns according to Show weekends. Both modes SHALL retain the native month/year title, complete previous/current/next pages, mode-labelled screen-reader actions, complete clock grid, synchronized pinned date header, and one pinned left gutter without importing or mounting a second renderer. Timeline events, current-time indicator/positioning, event activation, zoom, and selectable dates SHALL remain absent until their numbered slices land.

#### Scenario: Owned day and week shell render on the real route

- **WHEN** the student selects Day or Week on `timecalendar-dev://calendar`
- **THEN** the same owned shell renders the native title, mode-correct dated header, bounded paged lanes, pinned gutter, and vertically scrollable complete-day grid
- **AND** no calendar-kit, fallback, compatibility, duplicate renderer, second pager, or second vertical scroll owner mounts

#### Scenario: Brand surface uses owned tokens

- **WHEN** either T05 timeline mode renders in a supported theme
- **THEN** its surface, Today cue, borders, lines, labels, text, and navigation presentation derive from `@/theme` and shared semantic primitives

#### Scenario: Later timeline capabilities remain absent

- **WHEN** the T05 shell is inspected or exercised
- **THEN** it contains no event/all-day tiles, current-time indicator or initial-now positioning, date-selection action, event activation, or zoom

#### Scenario: Empty motion has no event write path

- **WHEN** a paged and scrolled day or week shell is used
- **THEN** it neither reads events for presentation nor mutates or rewrites synced or personal event facts

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

## ADDED Requirements

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

### Requirement: T05 pages by the selected civil unit

Day mode SHALL page exactly one effective-display-zone civil date per accepted previous/next gesture or accessibility action. Week mode SHALL retain exactly one complete launch-week step. Both modes SHALL keep exactly the previous, current, and next direct native pager children and accept a destination only after idle settlement. Show weekends SHALL affect week columns only and SHALL never skip Saturday or Sunday in day mode.

#### Scenario: Day paging crosses a hidden weekend one date at a time

- **WHEN** Show weekends is off and the student pages Day forward from Friday
- **THEN** the next accepted pages are Saturday and then Sunday before Monday
- **AND** every page contains one column

#### Scenario: Week paging retains complete-week stride

- **WHEN** the student pages Week in either direction
- **THEN** the accepted anchor changes by one seven-civil-date launch week
- **AND** its visible columns remain five or seven according to Show weekends

#### Scenario: Both modes retain three pages and idle settlement

- **WHEN** either timeline mode is inspected during horizontal navigation
- **THEN** only its previous, current, and next pages are mounted as direct native pager children
- **AND** the old committed date remains authoritative until one adjacent page settles idle

### Requirement: T05 preserves clock position and rejects stale mode callbacks

The owned day and week surfaces SHALL share the same full-day vertical geometry, native `ScrollView`, and screen-owned settled clock offset. A day/week mode replacement SHALL preserve that offset, invalidate any pending or stale page request from the old mode/generation, recenter the pager and pinned header projection, and SHALL NOT commit or announce an obsolete destination.

#### Scenario: Mode switch preserves a settled afternoon coordinate

- **WHEN** the timeline is settled at an afternoon vertical offset and the student switches Day or Week
- **THEN** the destination exposes the same settled raw clock offset through the unchanged native vertical owner
- **AND** it does not restore a process-persisted offset or scroll to current time

#### Scenario: Mode switch during a partial drag cancels the old page

- **WHEN** the view mode changes while the old mode is partially dragged or awaiting settlement
- **THEN** the old request is cancelled, both pager/header progress recenter, and its later callbacks are rejected
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

The change MUST prove mode/date transition tables, display-zone civil stepping, one/five/seven geometry, persistence and corrupt recovery, backend-reset survival, preserved clock coordinates, mode-change cancellation, platform menu parity, localized labels, Today/focusDate coherence, Agenda/details availability, automatic insets, one vertical owner, one pager, three-page retention, synchronized headers, and no second renderer through focused tests and repository contracts. Native partial-drag switching, platform menus, restart, visible-hour preservation, weekend traversal, header synchronization, and assistive technology SHALL be recorded against the exact tested revision/build through the owner checklist rather than claimed from host automation.

#### Scenario: Focused automation proves deterministic T05 behavior

- **WHEN** the affected data, preference, storage, renderer, Calendar screen, i18n, and repository-contract suites run
- **THEN** they cover every day/week mapping and paging unit, valid/missing/corrupt mode values, reset survival, stale callback rejection, preserved offset, and retained navigation
- **AND** no vendor, second renderer, second pager/scroll owner, fixed-duration day arithmetic, weekend-skipping day step, or weakened test gate appears

#### Scenario: Native evidence is not fabricated

- **WHEN** local non-device verification completes
- **THEN** the handoff records exact commands and results for the tested revision without claiming physical platform behavior
- **AND** the exact build/revision and complete T05 owner checklist remain recorded for explicit owner acceptance
