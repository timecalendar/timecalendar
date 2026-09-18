## ADDED Requirements

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
- **AND** the committed anchor, vertical offset, page generation, and event data are unchanged

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

The owned renderer SHALL render a current-time indicator on the clock column whose display-zone date matches the clock's date, with a visible shape distinction in addition to any color, and one typographic current-time label in the hour gutter for the committed centre page. The gutter label SHALL use the same locale, display zone, and device 12/24-hour convention as the gutter hour labels, SHALL be the accessible node of the pair, and SHALL carry localized current-time semantics in French and English. The indicator's vertical placement SHALL derive from the live pixels-per-hour scale on the UI thread. The renderer SHALL pass explicit full-day start and end bounds plus the settled dynamic scale to the shared now-position helper, whose 07:00–21:00 defaults SHALL remain unchanged for other consumers. A clock tick or rollover SHALL emit no accessibility announcement.

#### Scenario: The indicator is not conveyed by color alone

- **WHEN** the timeline is inspected in light and dark appearance, or without color perception
- **THEN** the current-time indicator is identifiable by its shape cue and the gutter time label
- **AND** the Today date cue retains its existing typography and outlined-shape distinction

#### Scenario: Only today's column carries the indicator

- **WHEN** a Week page shows several dates and one of them is today
- **THEN** the indicator spans only that date's column
- **AND** a page containing no today column renders no indicator and no gutter label

#### Scenario: The indicator follows the zoom scale

- **WHEN** the student pinches or uses the zoom commands
- **THEN** the indicator stays at the same clock coordinate as the grid lines and gutter labels at the new scale
- **AND** its position is computed from the shared scale on the UI thread without per-frame React state

#### Scenario: Shared now-position defaults are untouched

- **WHEN** the owned renderer and the Home mini-timeline both read the shared now-position helper
- **THEN** the renderer supplies explicit 00:00–24:00 bounds and its settled scale
- **AND** the helper's default 07:00–21:00 window and Home's existing presentation are unchanged

### Requirement: T08 keeps Today meaning and indicator visibility in agreement

When the display-zone current date is not present among the visible columns — including a weekend date while the weekend preference hides Saturday and Sunday — the renderer SHALL show neither the Today date cue nor the current-time indicator nor the gutter time label. Crossing midnight under that configuration SHALL change nothing but clock meaning: no unsolicited scroll reset, date request, week announcement, or mode change SHALL occur. Weekend preference changes SHALL continue to leave Agenda's range and event facts untouched.

#### Scenario: Hidden weekend removes both signals together

- **WHEN** the clock reads a Saturday or Sunday and weekends are hidden
- **THEN** no visible column is marked Today and no indicator or gutter time label appears
- **AND** the five weekday columns, committed anchor, and settled clock offset are unchanged

#### Scenario: Crossing midnight with weekends hidden is inert

- **WHEN** a hidden-weekend Week surface crosses from Saturday into Sunday
- **THEN** Today meaning and indicator visibility remain absent and in agreement
- **AND** no scroll reset, transition request, announcement, or Agenda-range change occurs

#### Scenario: A non-today page stays unmarked

- **WHEN** the student pages to an adjacent day or week that does not contain today
- **THEN** that page shows no indicator and the gutter shows no current-time label
- **AND** returning to the committed page restores both without moving the viewport

### Requirement: T08 evidence is revision bound and keeps the owned-renderer contracts

Deterministic coverage SHALL include the pure fresh-open offset helper at full statement and branch coverage with boundary cases at 00:00, mid-day, 24:00, zero and non-zero insets, and the bounded scale range; the clock hook's focus, foreground, minute-alignment, rollover, and cleanup behaviour under controlled timers; indicator presence on today, absence on non-today pages and hidden weekends; and screen-level agreement between the Today cue and the indicator. The repository contract SHALL assert that the displayed-precision timer exists only in the named calendar clock module with focus, application-state, and teardown handling, that no other calendar production file arms a timer, that no calendar production file runs a repeating animation, and that the renderer inventory, single automatic-inset vertical owner, single three-page pager, and no-second-renderer rules still hold. Device-only presentation, assistive-technology, and feel results SHALL NOT be claimed by host automation, and the complete canonical owner checklist SHALL be recorded against the exact tested revision and build.

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
