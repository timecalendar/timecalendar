# Functional specification questionnaire

Status: unanswered decision backlog. This is not a specification.

The questions below exist because no implementation, historical behavior, or prior document may silently decide the new renderer's product contract. A future session should ask the product owner these questions in manageable groups, record the exact answers, and confirm the resulting requirements.

## Answering protocol

For every row, replace `UNANSWERED` with exactly one status and the answer:

- `CONFIRMED_IN: ...`
- `CONFIRMED_OUT: ...`
- `DEFERRED: ...` plus a revisit trigger
- `NEEDS_RESEARCH: ...` plus a bounded research action
- `UNANSWERED`

Do not use “probably,” current behavior, Flutter behavior, or a technical preference as a product answer. If the owner is uncertain, keep the question unanswered or mark it for research. When a topic is answered, restate the resulting requirement and non-requirement to the owner before treating it as settled.

## Blocking first pass

Start with these IDs because their answers reshape most later questions:

`P-001`, `P-002`, `P-003`, `P-005`, `P-008`, `U-001`, `U-003`, `PL-001`, `PL-003`, `S-001` through `S-010`, `N-006`, `N-007`, `T-001`, `T-008`, `T-010`, `E-001`, `E-004`, `E-008`, `E-013`, `D-001`, `D-006`, `A-001`, `A-003`, `PF-001` through `PF-008`, `B-001`, `B-004`, `Q-001`, `Q-002`, `M-001`, and `M-004`.

Do not start architecture design until the blocking product questions are answered or deliberately deferred.

## P. Product intent and success

| ID | Question | Answer |
| --- | --- | --- |
| P-001 | What user problem must an owned renderer solve? | `UNANSWERED` |
| P-002 | Is replacing `@howljs/calendar-kit` itself a confirmed goal, or is replacement only one candidate response to current problems? | `UNANSWERED` |
| P-003 | Which reported failures have users actually experienced, and which came only from development or profiling? | `UNANSWERED` |
| P-004 | For each reported wrong date, blank frame, rebuild, mounting issue, or profiler crash, what exact reproduction and impact are known? | `UNANSWERED` |
| P-005 | What are the top three outcomes, in priority order, that would make this project successful? | `UNANSWERED` |
| P-006 | Which outcome is allowed to win when visual richness, accessibility, interaction fluidity, memory, and implementation complexity conflict? | `UNANSWERED` |
| P-007 | Is the goal strict behavioral continuity, an intentional calendar redesign, or a mixture with explicitly named changes? | `UNANSWERED` |
| P-008 | What does “no technical compromise” mean operationally for this project? | `UNANSWERED` |
| P-009 | What does “no technical debt” forbid at initial release, and what deliberately documented follow-up, if any, is acceptable? | `UNANSWERED` |
| P-010 | What does “proud to open source” require beyond correctness: public API clarity, documentation, examples, benchmarks, contribution guide, or something else? | `UNANSWERED` |
| P-011 | Is the renderer intended only for TimeCalendar, for eventual reuse inside this repository, or for eventual standalone publication? | `UNANSWERED` |
| P-012 | Which behaviors would be unacceptable even if every performance target were met? | `UNANSWERED` |

## U. Users and real workflows

| ID | Question | Answer |
| --- | --- | --- |
| U-001 | Who are the primary users of the calendar timeline? | `UNANSWERED` |
| U-002 | Are there distinct user groups with materially different calendar needs? | `UNANSWERED` |
| U-003 | What are the three most frequent calendar tasks for the primary user? | `UNANSWERED` |
| U-004 | What is the most time-critical task a user performs on this screen? | `UNANSWERED` |
| U-005 | Do users mainly inspect today, plan the current week, browse future weeks, or search historical dates? | `UNANSWERED` |
| U-006 | How often do users switch calendar modes in one session, and why? | `UNANSWERED` |
| U-007 | What real schedule shapes must be supported: university classes, work shifts, appointments, travel, or others? | `UNANSWERED` |
| U-008 | Do users routinely have several source calendars visible at once? | `UNANSWERED` |
| U-009 | Are there users who rely on one-handed use, keyboard/switch input, screen readers, large text, or low-end devices as their primary mode? | `UNANSWERED` |
| U-010 | What user research, support reports, analytics, or dogfood feedback may be consulted before scope is finalized? | `UNANSWERED` |

## PL. Supported platforms and environments

| ID | Question | Answer |
| --- | --- | --- |
| PL-001 | Which operating systems are in scope? | `UNANSWERED` |
| PL-002 | What minimum and maximum supported iOS and Android versions must acceptance cover? | `UNANSWERED` |
| PL-003 | What exact low-end Android capability profile or representative device defines the hard floor? | `UNANSWERED` |
| PL-004 | Which recent or high-refresh devices must also be tested? | `UNANSWERED` |
| PL-005 | Must phones and tablets both have first-class layouts? | `UNANSWERED` |
| PL-006 | Is landscape orientation supported, unsupported, or deferred? | `UNANSWERED` |
| PL-007 | Must split-screen and resizable-window modes work? | `UNANSWERED` |
| PL-008 | Must external keyboards, trackpads, mice, or hardware navigation controls work? | `UNANSWERED` |
| PL-009 | Is web explicitly out of scope for this renderer? | `UNANSWERED` |
| PL-010 | Must the renderer work identically in Expo Go, development builds, release builds, and OTA-updated builds, or only a defined subset? | `UNANSWERED` |

## S. Calendar surfaces and modes

| ID | Question | Answer |
| --- | --- | --- |
| S-001 | Is a day timeline required? | `UNANSWERED` |
| S-002 | If day mode is required, what user need is not met by week or agenda? | `UNANSWERED` |
| S-003 | Is a week timeline required? | `UNANSWERED` |
| S-004 | Is agenda/list mode required? | `UNANSWERED` |
| S-005 | Is agenda part of this project's implementation scope, or an existing external surface that must only keep integrating correctly? | `UNANSWERED` |
| S-006 | Should day, week, and agenda remain modes of one screen or become distinct routes/surfaces? | `UNANSWERED` |
| S-007 | What mode opens for a new user? | `UNANSWERED` |
| S-008 | Should the last selected mode persist across navigation, app restarts, account changes, or none of those? | `UNANSWERED` |
| S-009 | Does week mode show five days, seven days, another count, or a configurable count? | `UNANSWERED` |
| S-010 | If multiple week sizes exist, what is the default and where does the user change it? | `UNANSWERED` |
| S-011 | Does “hide weekends” mean Monday through Friday, or a locale/configurable work-week definition? | `UNANSWERED` |
| S-012 | Must a week be displayed as a single viewport, or may days scroll horizontally within a week? | `UNANSWERED` |
| S-013 | Is a multi-day mode other than week needed, such as three-day or work-week? | `UNANSWERED` |
| S-014 | Is a month surface part of this project, an integration target, or explicitly out of scope? | `UNANSWERED` |
| S-015 | Is the Home today timeline expected to reuse the new renderer or remain independent? | `UNANSWERED` |
| S-016 | Is a mini/embedded renderer for future consumers in scope now? | `UNANSWERED` |
| S-017 | When there are no visible events, should the time grid remain visible, show an empty message, or use another presentation? | `UNANSWERED` |
| S-018 | Must users be able to compare two dates or calendars simultaneously? | `UNANSWERED` |

## N. Date navigation and state continuity

| ID | Question | Answer |
| --- | --- | --- |
| N-001 | What is the horizontal paging unit in day mode? | `UNANSWERED` |
| N-002 | What is the horizontal paging unit in week mode? | `UNANSWERED` |
| N-003 | Should a gesture always snap exactly one page, or may a fast fling cross multiple pages? | `UNANSWERED` |
| N-004 | What gesture feel defines “native”: platform defaults, identical cross-platform behavior, or a named reference? | `UNANSWERED` |
| N-005 | What date does the screen title represent while a page is moving and after it settles? | `UNANSWERED` |
| N-006 | When switching day to week, which date must become the week anchor? | `UNANSWERED` |
| N-007 | When switching week to day, which day must become visible? | `UNANSWERED` |
| N-008 | If several week days are equally visible during a switch, how is the retained day chosen? | `UNANSWERED` |
| N-009 | Must the vertical scroll offset be preserved across day/week switches? | `UNANSWERED` |
| N-010 | Must zoom be preserved across day/week switches? | `UNANSWERED` |
| N-011 | Must an event selection, focused accessibility element, or open context state survive a mode switch? | `UNANSWERED` |
| N-012 | What state should be shared when switching between timeline and agenda? | `UNANSWERED` |
| N-013 | What exactly should the Today action change: date, vertical time, mode, zoom, selection, or a subset? | `UNANSWERED` |
| N-014 | Should Today animate, jump immediately, or follow reduced-motion settings? | `UNANSWERED` |
| N-015 | What should programmatic `goToDate` do when the target is outside loaded data? | `UNANSWERED` |
| N-016 | What should a deep-linked `focusDate` preserve or reset? | `UNANSWERED` |
| N-017 | Is navigation logically unbounded, or is there a supported past/future horizon? | `UNANSWERED` |
| N-018 | What must be announced or displayed while a requested date is loading or has no data? | `UNANSWERED` |

## T. Time grid, scrolling, and zoom

| ID | Question | Answer |
| --- | --- | --- |
| T-001 | What wall-clock range should the timeline display by default? | `UNANSWERED` |
| T-002 | Is the displayed time range fixed, user-configurable, derived from events, or mode-specific? | `UNANSWERED` |
| T-003 | Must events outside the displayed range be clipped, summarized, indicated, or make the range expand? | `UNANSWERED` |
| T-004 | Which hour-label format is required in each locale and user setting? | `UNANSWERED` |
| T-005 | Must the hours column remain fixed while event content scrolls? | `UNANSWERED` |
| T-006 | Must day headers remain fixed during vertical scrolling? | `UNANSWERED` |
| T-007 | What grid interval is visible: hours only, half-hours, quarters, or zoom-dependent subdivisions? | `UNANSWERED` |
| T-008 | Is pinch-to-zoom a required product feature? | `UNANSWERED` |
| T-009 | If pinch is required, what user problem does it solve? | `UNANSWERED` |
| T-010 | Must zoom preserve the time under the gesture focal point, and what visible tolerance is acceptable? | `UNANSWERED` |
| T-011 | What is the default zoom or hour height on each device class? | `UNANSWERED` |
| T-012 | What are the minimum and maximum useful zoom levels? | `UNANSWERED` |
| T-013 | Are zoom steps discrete or continuous? | `UNANSWERED` |
| T-014 | Are visible zoom-in, zoom-out, and reset controls required? | `UNANSWERED` |
| T-015 | Where should non-pinch zoom controls live without obscuring calendar content? | `UNANSWERED` |
| T-016 | Should zoom persist, and if so per device, per mode, per orientation, or globally? | `UNANSWERED` |
| T-017 | Should vertical scroll position persist across mode changes, tab changes, app backgrounding, or restarts? | `UNANSWERED` |
| T-018 | What initial vertical position should a fresh timeline use: fixed start, current time, first event, persisted offset, or another rule? | `UNANSWERED` |

## E. Event types, semantics, and layout

| ID | Question | Answer |
| --- | --- | --- |
| E-001 | Which event types must the timeline render at launch? | `UNANSWERED` |
| E-002 | Are synced events and personal events visually or behaviorally distinct? | `UNANSWERED` |
| E-003 | Are canceled events shown, hidden, or styled differently? | `UNANSWERED` |
| E-004 | Are all-day events required in the timeline? | `UNANSWERED` |
| E-005 | Are multi-day all-day events required? | `UNANSWERED` |
| E-006 | Are timed events that cross midnight required? | `UNANSWERED` |
| E-007 | Are timed events lasting 24 hours or longer required, and should they remain in timed lanes? | `UNANSWERED` |
| E-008 | Is the current floating-date interpretation of all-day events the desired product contract? | `UNANSWERED` |
| E-009 | Is an exclusive all-day end date the desired domain contract, or merely current storage behavior? | `UNANSWERED` |
| E-010 | How should a zero-duration timed event render? | `UNANSWERED` |
| E-011 | How should a zero-duration all-day event render? | `UNANSWERED` |
| E-012 | How should an event whose end precedes its start be handled and surfaced? | `UNANSWERED` |
| E-013 | How should a timed event crossing days be segmented, labeled, and made tappable on each day? | `UNANSWERED` |
| E-014 | Should a multi-day event appear in agenda sections for every covered day or only its start day? | `UNANSWERED` |
| E-015 | How are events clipped at the visible time range while preserving their true start/end semantics? | `UNANSWERED` |
| E-016 | Should clipping be visually indicated at the top or bottom edge? | `UNANSWERED` |
| E-017 | Do back-to-back events count as non-overlapping with no visual gap requirement? | `UNANSWERED` |
| E-018 | When events overlap, is equal-width column packing required or may later events partially cover earlier events? | `UNANSWERED` |
| E-019 | What deterministic tie-break order applies when events have identical starts or geometry? | `UNANSWERED` |
| E-020 | Is there a maximum useful number of visible overlap columns before the UI should aggregate or switch representation? | `UNANSWERED` |
| E-021 | What minimum visible event height is needed, and may visual height exceed true duration for tapability? | `UNANSWERED` |
| E-022 | Which fields must appear visually on a normal-width timed tile? | `UNANSWERED` |
| E-023 | Which fields may disappear as a tile narrows or shortens? | `UNANSWERED` |
| E-024 | Which full fields must remain available to accessibility even when visually hidden? | `UNANSWERED` |
| E-025 | How should missing title, location, color, or malformed optional fields render? | `UNANSWERED` |
| E-026 | What should event color mean, and what fallback applies when it is absent or invalid? | `UNANSWERED` |

## I. Event and screen interactions

| ID | Question | Answer |
| --- | --- | --- |
| I-001 | What should a tap on a synced event do? | `UNANSWERED` |
| I-002 | What should a tap on a personal event do? | `UNANSWERED` |
| I-003 | Should a first tap select and a second tap open, or should one tap open immediately? | `UNANSWERED` |
| I-004 | Is long-press behavior required? | `UNANSWERED` |
| I-005 | Is event drag-and-drop rescheduling in scope? | `UNANSWERED` |
| I-006 | Is drag-to-create an event in scope? | `UNANSWERED` |
| I-007 | Is resize-to-change-duration in scope? | `UNANSWERED` |
| I-008 | Should tapping empty grid space do anything? | `UNANSWERED` |
| I-009 | Is a visible selected-event state required? | `UNANSWERED` |
| I-010 | What happens if an event disappears from the source while selected or being opened? | `UNANSWERED` |
| I-011 | Must pull-to-refresh work directly on the timeline, only in agenda, elsewhere, or nowhere? | `UNANSWERED` |
| I-012 | Are haptics required for paging, zoom limits, selection, or no calendar interaction? | `UNANSWERED` |
| I-013 | How should horizontal paging, vertical scrolling, pinch, and event press gestures arbitrate when they begin together? | `UNANSWERED` |
| I-014 | Must a touch target extend beyond a very small event's visible geometry, and how should overlap ambiguity be resolved? | `UNANSWERED` |

## D. Calendar dates, locale, and timezone

| ID | Question | Answer |
| --- | --- | --- |
| D-001 | Must the renderer preserve the app's current effective display-timezone preference exactly? | `UNANSWERED` |
| D-002 | Should timed events always be projected into one global display zone? | `UNANSWERED` |
| D-003 | Is per-calendar or per-event timezone display needed now or explicitly out of scope? | `UNANSWERED` |
| D-004 | What does “today” mean when the display zone differs from the device zone? | `UNANSWERED` |
| D-005 | Which zone determines the current-time indicator? | `UNANSWERED` |
| D-006 | Which day starts the week for each locale or user preference? | `UNANSWERED` |
| D-007 | Can users override the week start independently of locale? | `UNANSWERED` |
| D-008 | Must date navigation remain correct across daylight-saving transitions in the selected display zone? | `UNANSWERED` |
| D-009 | How should nonexistent local times during spring-forward be displayed? | `UNANSWERED` |
| D-010 | How should repeated local times during fall-back be distinguished? | `UNANSWERED` |
| D-011 | Are non-Gregorian system calendars supported, normalized to Gregorian, or explicitly unsupported? | `UNANSWERED` |
| D-012 | Must first-day-of-week and weekend definitions follow the app locale, device locale, display zone, or explicit settings? | `UNANSWERED` |
| D-013 | Must time format honor 12/24-hour device preference, or always use 24-hour time? | `UNANSWERED` |
| D-014 | Are French and English the complete launch locale set for this project? | `UNANSWERED` |
| D-015 | What must update immediately when locale or display timezone changes while the calendar is open? | `UNANSWERED` |
| D-016 | Which date arithmetic invariants require property-based tests across zones and DST boundaries? | `UNANSWERED` |

## V. Visual design and content presentation

| ID | Question | Answer |
| --- | --- | --- |
| V-001 | Is the current calendar visual design intended to be preserved, refined, or redesigned? | `UNANSWERED` |
| V-002 | What approved design source is authoritative for the new timeline? | `UNANSWERED` |
| V-003 | Which elements make the calendar recognizably TimeCalendar? | `UNANSWERED` |
| V-004 | Must iOS and Android share identical calendar geometry or only equivalent product meaning? | `UNANSWERED` |
| V-005 | How should today be distinguished without relying on color alone? | `UNANSWERED` |
| V-006 | Is a current-time line required, and what should it look like? | `UNANSWERED` |
| V-007 | What should day headers show in day and week modes? | `UNANSWERED` |
| V-008 | How should event colors be transformed between light and dark themes? | `UNANSWERED` |
| V-009 | What deterministic foreground/scrim policy guarantees readable text over arbitrary imported event colors? | `UNANSWERED` |
| V-010 | May event color be changed for contrast, or must source color remain visually exact? | `UNANSWERED` |
| V-011 | Which states besides calendar identity need non-color indicators? | `UNANSWERED` |
| V-012 | How should an all-day lane expand when many all-day events exist? | `UNANSWERED` |
| V-013 | Should the all-day lane collapse, scroll, show a count, or always show every event? | `UNANSWERED` |
| V-014 | What empty, loading, stale, and error visuals are approved? | `UNANSWERED` |
| V-015 | What typography and truncation rules apply at normal and maximum text sizes? | `UNANSWERED` |
| V-016 | Are screenshots, design tokens, or design review sign-off required acceptance artifacts? | `UNANSWERED` |

## A. Accessibility and inclusive interaction

| ID | Question | Answer |
| --- | --- | --- |
| A-001 | Which accessibility standards and conformance level are required? | `UNANSWERED` |
| A-002 | Which assistive technologies must be tested on each platform? | `UNANSWERED` |
| A-003 | Is complete timeline operation without pinch or multi-finger gestures required? | `UNANSWERED` |
| A-004 | Is complete timeline operation without horizontal swipe required? | `UNANSWERED` |
| A-005 | Must keyboard and Switch Control users be able to navigate events in chronological order? | `UNANSWERED` |
| A-006 | What is the intended screen-reader mental model: grid, list by date, adjustable timeline, or another structure? | `UNANSWERED` |
| A-007 | Should screen readers interact with the visual timeline, an alternate list, or both? | `UNANSWERED` |
| A-008 | If both timeline and alternate list exist, how does the user discover and switch representations? | `UNANSWERED` |
| A-009 | What information must every timed event's accessible name include? | `UNANSWERED` |
| A-010 | What information must every all-day event's accessible name include? | `UNANSWERED` |
| A-011 | Are accessibility hints required for opening, selecting, or manipulating events? | `UNANSWERED` |
| A-012 | What must be announced after a page settles? | `UNANSWERED` |
| A-013 | What must not be announced during a gesture to avoid noise? | `UNANSWERED` |
| A-014 | How is logical accessibility order defined across days, all-day events, timed events, and overlapping events? | `UNANSWERED` |
| A-015 | When pages recycle, what focus-retention behavior is required? | `UNANSWERED` |
| A-016 | What should happen when the focused event scrolls offscreen or disappears? | `UNANSWERED` |
| A-017 | What maximum Dynamic Type or Android font-scale setting must remain usable? | `UNANSWERED` |
| A-018 | At very large text sizes, may the visual grid simplify or redirect to a list representation? | `UNANSWERED` |
| A-019 | Are 44-point iOS and 48-dp Android touch targets hard requirements for event tiles as well as controls? | `UNANSWERED` |
| A-020 | How should tiny or densely overlapping events expose unambiguous touch and accessibility targets? | `UNANSWERED` |
| A-021 | Which animations are essential, optional, or prohibited under reduced motion? | `UNANSWERED` |
| A-022 | Is increased-contrast or high-contrast system mode explicitly supported and tested? | `UNANSWERED` |
| A-023 | Must bold text, button shapes, color filters, or other platform accessibility settings be tested? | `UNANSWERED` |
| A-024 | Who performs manual VoiceOver, TalkBack, Switch Control, and large-text acceptance, on which devices? | `UNANSWERED` |

## PF. Performance and resource budgets

| ID | Question | Answer |
| --- | --- | --- |
| PF-001 | Which user interactions receive hard performance budgets? | `UNANSWERED` |
| PF-002 | What exact metric defines fluid scrolling and paging: frame rate, frame-time percentile, dropped-frame count, or another measure? | `UNANSWERED` |
| PF-003 | Is the target the device refresh rate, a fixed minimum, or a percentile-based service level? | `UNANSWERED` |
| PF-004 | On which exact devices and OS versions is each performance target binding? | `UNANSWERED` |
| PF-005 | Must measurements use release builds, release-config development builds, or both? | `UNANSWERED` |
| PF-006 | What event dataset represents normal use? | `UNANSWERED` |
| PF-007 | What event dataset represents the supported worst case? | `UNANSWERED` |
| PF-008 | Is 1,000 loaded events a real supported workload, and if so over what date horizon and source count? | `UNANSWERED` |
| PF-009 | How many events may occur on one visible day in the supported worst case? | `UNANSWERED` |
| PF-010 | What maximum simultaneous overlap cluster must remain fully interactive? | `UNANSWERED` |
| PF-011 | What maximum number of all-day events or spans must be supported in one visible period? | `UNANSWERED` |
| PF-012 | What latency budget applies from a mode request to the first correct frame? | `UNANSWERED` |
| PF-013 | What latency budget applies from a mode request to usable interaction? | `UNANSWERED` |
| PF-014 | What latency budget applies to Today and arbitrary date navigation? | `UNANSWERED` |
| PF-015 | What latency budget applies to the first calendar render after app start? | `UNANSWERED` |
| PF-016 | What visual defects are forbidden during transitions: blank, wrong date, stale events, theme flash, loader, or others? | `UNANSWERED` |
| PF-017 | Is a single stale-but-correct prior frame acceptable while new geometry becomes ready? | `UNANSWERED` |
| PF-018 | What steady-state memory budget applies to the calendar screen? | `UNANSWERED` |
| PF-019 | What maximum memory growth is acceptable after repeated paging, zooming, and mode switching? | `UNANSWERED` |
| PF-020 | What native-view or semantic-node budget, if any, is required? | `UNANSWERED` |
| PF-021 | Must mounted work depend only on visible content, or may bounded prefetched content scale with a confirmed overscan? | `UNANSWERED` |
| PF-022 | What CPU budget applies while idle on the calendar screen? | `UNANSWERED` |
| PF-023 | What battery or thermal acceptance test is required for prolonged calendar interaction? | `UNANSWERED` |
| PF-024 | How long must a paging/zoom stress run remain stable? | `UNANSWERED` |
| PF-025 | Which profiler or measurement tools are trusted for frame, JS, UI, memory, and native-node evidence? | `UNANSWERED` |
| PF-026 | How many runs and what percentile or variance rules make a benchmark result acceptable? | `UNANSWERED` |
| PF-027 | Where will benchmark fixtures, scripts, raw results, and device metadata be stored for reproducibility? | `UNANSWERED` |
| PF-028 | What regression threshold fails CI or blocks release after the initial baseline is established? | `UNANSWERED` |

## R. Reliability, lifecycle, and failure behavior

| ID | Question | Answer |
| --- | --- | --- |
| R-001 | What should render while event data is loading for the first time? | `UNANSWERED` |
| R-002 | What should render during a refresh when stale cached events exist? | `UNANSWERED` |
| R-003 | What should happen after a recoverable event-source failure? | `UNANSWERED` |
| R-004 | What should happen if date normalization or layout rejects a malformed event? | `UNANSWERED` |
| R-005 | May one malformed event be skipped while the rest render, and how is that reported? | `UNANSWERED` |
| R-006 | What state must survive backgrounding and foregrounding? | `UNANSWERED` |
| R-007 | What state must survive memory pressure or process death? | `UNANSWERED` |
| R-008 | What happens if locale, timezone, theme, font scale, orientation, or window size changes mid-gesture? | `UNANSWERED` |
| R-009 | What happens if the event collection changes materially during paging or zooming? | `UNANSWERED` |
| R-010 | What user-facing recovery is required after an internal renderer error? | `UNANSWERED` |
| R-011 | Which renderer failures are sent to crash/error reporting, with what privacy constraints? | `UNANSWERED` |
| R-012 | Is an error boundary or fallback representation required, and what behavior may it expose? | `UNANSWERED` |

## B. Boundaries and technical constraints

These questions are intentionally after the product sections. They must not be used to backfill product requirements.

| ID | Question | Answer |
| --- | --- | --- |
| B-001 | Which current cross-feature contracts are mandatory invariants for this project? | `UNANSWERED` |
| B-002 | Is the current `CalendarEvent` shape authoritative, or may the domain model be corrected with a coordinated migration? | `UNANSWERED` |
| B-003 | Is the current `useCalendarEvents(range)` seam authoritative, or may data access become indexed/range-scoped behind a new contract? | `UNANSWERED` |
| B-004 | Which responsibilities belong to the product screen, renderer, pure domain engine, and agenda surface? | `UNANSWERED` |
| B-005 | Must the current renderer facade remain source-compatible during development? | `UNANSWERED` |
| B-006 | Is an imperative renderer API required, and which product operations must it express? | `UNANSWERED` |
| B-007 | Must the renderer be usable without TimeCalendar navigation, settings, translation, and theme providers? | `UNANSWERED` |
| B-008 | Is future package extraction a current design constraint or only a possible later refactor? | `UNANSWERED` |
| B-009 | Which existing pure utilities are trusted, which require revalidation, and which may be replaced? | `UNANSWERED` |
| B-010 | Are Hermes and React Native New Architecture hard runtime constraints for all supported builds? | `UNANSWERED` |
| B-011 | Are Reanimated and Gesture Handler constraints, candidates, or implementation details to decide from evidence? | `UNANSWERED` |
| B-012 | What evidence is required before adding any native or rendering dependency? | `UNANSWERED` |
| B-013 | Are changes to native projects, Expo configuration, runtime fingerprint, or OTA compatibility allowed? | `UNANSWERED` |
| B-014 | What dependency ownership, bus-factor, license, release cadence, and security criteria must a candidate pass? | `UNANSWERED` |

## Q. Engineering quality and open-source readiness

| ID | Question | Answer |
| --- | --- | --- |
| Q-001 | What objective conditions define “perfect code quality” for this project? | `UNANSWERED` |
| Q-002 | What objective conditions define “no technical debt” at the first accepted release? | `UNANSWERED` |
| Q-003 | Is any temporary feature flag, compatibility layer, duplicated engine, or fallback permitted during development? | `UNANSWERED` |
| Q-004 | If temporary scaffolding is permitted, what deletion gate and deadline prevent it from becoming debt? | `UNANSWERED` |
| Q-005 | Which correctness properties require unit tests? | `UNANSWERED` |
| Q-006 | Which properties require property-based or fuzz tests? | `UNANSWERED` |
| Q-007 | Which interactions require component tests with real rather than mocked gesture/rendering code? | `UNANSWERED` |
| Q-008 | Which workflows require end-to-end tests on both platforms? | `UNANSWERED` |
| Q-009 | Which behaviors can only be accepted manually on physical devices? | `UNANSWERED` |
| Q-010 | Are the repository's current 90% logic and 70% global coverage thresholds sufficient for this engine? | `UNANSWERED` |
| Q-011 | Is branch, mutation, or invariant coverage required for pure date/layout/indexing code? | `UNANSWERED` |
| Q-012 | What public documentation is required for algorithms, invariants, coordinate systems, and accessibility behavior? | `UNANSWERED` |
| Q-013 | Which architectural decisions require ADRs before code begins? | `UNANSWERED` |
| Q-014 | Must benchmark and correctness fixtures be deterministic and distributable without private user data? | `UNANSWERED` |
| Q-015 | What code-comment standard applies to non-obvious geometry and worklet/thread invariants? | `UNANSWERED` |
| Q-016 | What API stability or semantic-versioning promise is needed if the renderer is later published? | `UNANSWERED` |
| Q-017 | Which open-source license is intended for the renderer and any extracted fixtures or tools? | `UNANSWERED` |
| Q-018 | Are a standalone example app, contribution guide, architecture guide, and benchmark guide required before calling it open-source-ready? | `UNANSWERED` |
| Q-019 | What external security, privacy, accessibility, and performance review is required before release? | `UNANSWERED` |
| Q-020 | Who has final acceptance authority for product behavior, design, accessibility, performance, and architecture? | `UNANSWERED` |

## M. Migration, rollout, and completion

| ID | Question | Answer |
| --- | --- | --- |
| M-001 | Must the new renderer replace calendar-kit in one cutover, or may it ship through a controlled internal rollout? | `UNANSWERED` |
| M-002 | If a flag is allowed, who can access it and may both implementations ever be mounted at once? | `UNANSWERED` |
| M-003 | What current behaviors must be proven before calendar-kit can be removed? | `UNANSWERED` |
| M-004 | What device, locale, theme, timezone, accessibility, and dataset matrix forms the final acceptance gate? | `UNANSWERED` |
| M-005 | Is exact visual comparison against current React Native behavior needed anywhere? | `UNANSWERED` |
| M-006 | Is exact functional comparison against Flutter needed anywhere, or only explicitly selected historical behaviors? | `UNANSWERED` |
| M-007 | What telemetry or dogfood evidence is required before general release? | `UNANSWERED` |
| M-008 | Is a staged percentage rollout required after internal acceptance? | `UNANSWERED` |
| M-009 | What rollback mechanism is required if the new renderer fails after release? | `UNANSWERED` |
| M-010 | When may the calendar-kit dependency, patch, adapter, tests, and documentation be deleted? | `UNANSWERED` |
| M-011 | Which old workarounds must be explicitly identified so they are not accidentally ported? | `UNANSWERED` |
| M-012 | Which existing ADRs and OpenSpecs must be superseded or rewritten when the final decision is made? | `UNANSWERED` |
| M-013 | What artifacts must exist at completion: specs, ADR, code, tests, benchmarks, device reports, accessibility report, migration notes, or others? | `UNANSWERED` |
| M-014 | What unresolved risk, if any, is acceptable when declaring the project complete? | `UNANSWERED` |

## X. Explicit exclusion check

Each item must be confirmed in, confirmed out, or deferred. An omission is not an exclusion.

| ID | Candidate capability | Answer |
| --- | --- | --- |
| X-001 | Month view | `UNANSWERED` |
| X-002 | Custom multi-day counts beyond day/work-week/week | `UNANSWERED` |
| X-003 | Event creation from the grid | `UNANSWERED` |
| X-004 | Event drag, resize, or rescheduling | `UNANSWERED` |
| X-005 | Search and filtering controls inside the renderer | `UNANSWERED` |
| X-006 | Per-calendar columns or side-by-side calendar comparison | `UNANSWERED` |
| X-007 | Recurrence expansion or editing in the client | `UNANSWERED` |
| X-008 | Per-event or per-calendar timezone display | `UNANSWERED` |
| X-009 | Web support | `UNANSWERED` |
| X-010 | Standalone package publication in the first delivery | `UNANSWERED` |

## Completion gate for discovery

Discovery is complete only when:

- every blocking question is answered, deliberately deferred, or assigned a bounded research action;
- the important non-blocking questions are resolved enough to remove material ambiguity;
- the owner has reviewed a concise list of `CONFIRMED_IN`, `CONFIRMED_OUT`, and `DEFERRED` items;
- performance targets include metrics, datasets, devices, build type, measurement method, and pass criteria;
- accessibility targets include interaction model, assistive technologies, device matrix, and manual acceptance ownership;
- no architecture choice is masquerading as a functional requirement;
- the owner explicitly authorizes creation of `03-functional-specification.md`.
