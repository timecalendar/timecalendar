---
kind: product
status: draft
decision: pending
---

# Product shaping: owned calendar renderer

## Problem and evidence

The React Native Calendar's day/week surface is code-complete on
`@howljs/calendar-kit` 2.5.6, a committed vendor patch, and an adapter behind the repository's
renderer seam. The product owner has required that calendar-kit not ship in the React Native
launch and has explicitly allowed a clean breaking replacement because the app is not yet shipped.

Observed code establishes the current boundary and behavior. Four owner-answer rounds establish
the desired product behavior. They do not establish a target implementation. The exact current
failure reproduction, representative production workload shapes, release resource budgets, and
physical-device floor remain named research gaps rather than fabricated evidence.

The evidence trail is preserved in the
[questionnaire](./research/functional-specification-questionnaire.md),
[discovery inventory](./research/discovery-scope-and-evidence.md), and
[Round 4 answer record](./research/round-4-owner-answers-and-readiness.md).

## Users and desired outcomes

### P01 — Understand the schedule at a glance

**Outcome:** A student can open day or week, find the next class and room quickly, follow classes
and breaks hour by hour, and plan the next day or week from correct local calendar data.

**Acceptance evidence:** Representative empty, normal, dense, overlap, all-day, multi-day, missing
content, and invalid-event fixtures show correct dates, time positions, titles, rooms, and event
activation in French and English, light and dark themes.

### P02 — Navigate one coherent date context

**Outcome:** Day, week, and agenda share predictable Monday-based date state across paging, Today,
deep links, mode changes, restarts, orientation changes, and window resizing without wrong-date or
partial intermediate frames.

**Acceptance evidence:** Automated state and geometry tests plus human phone/tablet checks prove
the specified settle rules, persisted mode/zoom behavior, agenda transfer, visible clock-position
continuity, and atomic geometry replacement.

### P03 — Preserve correct event semantics

**Outcome:** Timed, all-day, multi-day, cross-midnight, overlapping, hidden, synced, personal,
missing-field, and invalid events render or fail in the explicitly defined way without changing
calendar data or leaking content.

**Acceptance evidence:** Deterministic unit, property, integration, and fabricated-fixture tests
cover interval, timezone, segmentation, overlap, truncation, all-day overflow, filtering, malformed
input isolation, and event-details routing.

### P04 — Make the complete Calendar operable accessibly

**Outcome:** VoiceOver, TalkBack, Switch Control, largest supported text, reduced motion, and
increased-contrast users can understand chronological schedule content and complete every Calendar
action without relying on pinch, color, visual truncation, or recycled mount order.

**Acceptance evidence:** Automated semantic/focus invariants and recorded human assistive-technology
passes on the binding device/window matrix prove labels, order, actions, focus recovery, hit areas,
zoom alternatives, announcements, and full event meaning.

### P05 — Feel immediate while remaining resource-bounded

**Outcome:** Locally available Calendar actions meet the accepted first-frame and interaction
latencies, gestures feel native at the active display rate, and long sessions do not accumulate
pages, events, views, semantic nodes, memory, or idle work.

**Acceptance evidence:** Reproducible release-build profiles cover warm and cold entry, paging,
Today, arbitrary local-date navigation, mode changes, dense fixtures, and a 30-minute stress run on
the approved device floor with recorded frame, memory, node, battery, and thermal evidence.

### P06 — Keep rendering local and synchronization separate

**Outcome:** Date navigation reads device-local data without a network loader; completed sync
changes apply atomically; background sync failure leaves local events visible; and local-store
failure has accessible retry behavior.

**Acceptance evidence:** Offline, zero-event, background-sync success/failure, atomic replacement,
and local-store recovery scenarios prove the boundary without a Calendar-owned refresh state.

### P07 — Work across the supported mobile environment

**Outcome:** The Calendar supports the accepted iOS/Android floors, phone/tablet portrait and
landscape, representative split/resizable windows, French/English, light/dark themes, the effective
display timezone, and correctly fingerprinted Expo development/release builds.

**Acceptance evidence:** Compatibility smoke tests and recorded human compact/medium/expanded
window checks on the binding physical-device matrix prove behavior, geometry, focus, and native
configuration transitions.

### P08 — Ship a clean owned replacement

**Outcome:** The React Native launch contains an internally reusable TimeCalendar renderer and no
calendar-kit dependency, vendor patch, adapter, fallback, dual renderer, compatibility shim, or
deliberate quality debt.

**Acceptance evidence:** Repository audits, dependency/build checks, approved architecture records,
quality gates, and final release-candidate parity evidence demonstrate one owned implementation and
the absence of forbidden transitional machinery.

## Outcome traceability

| Project outcome | Detailed contract sections | Primary questionnaire areas |
| --------------- | -------------------------- | --------------------------- |
| `P01`           | 2, 5, 7, 8                 | `P-*`, `U-*`, `S-*`, `V-*`  |
| `P02`           | 5, 6, 10, 13               | `N-*`, `S-*`, `D-*`, `R-*`  |
| `P03`           | 8, 10, 11                  | `E-*`, `D-*`, `R-*`         |
| `P04`           | 12, 16.2                   | `A-*`, `I-*`, `V-*`         |
| `P05`           | 13, 16                     | `PF-*`, `Q-*`, `M-*`        |
| `P06`           | 3.2, 6, 11                 | `B-*`, `R-*`, `M-*`         |
| `P07`           | 4, 10, 16.2                | `PL-*`, `D-*`, `M-*`        |
| `P08`           | 3, 14, 15, 16              | `B-*`, `Q-*`, `M-*`, `X-*`  |

## Appetite and constraints

This is a pre-launch replacement of the highest-risk Calendar surface, not an elapsed-time
commitment. Correctness, privacy, and complete accessibility outrank latency and fluidity, which
outrank visual richness. The work may break the unshipped Calendar during coordinated development,
but it may not knowingly trade away the launch contract or accumulate compatibility baggage.

Product approval authorizes technical design, not implementation. Major dependency, rendering,
responsibility-boundary, or migration choices require measured alternatives and explicit approval
in project-local decision records.

## In scope

- Owned day and whole-week timelines plus integration with the existing agenda mode.
- Timeline grid, headers, hour labels, current-time presentation, bounded paging and scrolling,
  all-day presentation, event layout/activation, zoom, and complete accessibility.
- Synced and personal local events, filtering, display timezone, localization, theming, shared date
  context, event-details routing, orientation, and resizable-window behavior.
- Deterministic correctness, resource/performance evidence, clean calendar-kit removal, and the
  repository migration/supersession work required by the approved replacement.

The exact behavior is normative in sections 3–16 below.

## Out of scope and non-goals

The first delivery excludes month/custom multi-day modes, agenda redesign, Home/embedded reuse,
search/filter UI, event creation or direct manipulation, recurrence editing, per-event timezone
display, routine keyboard/mouse optimization, web, public-package promises, and general parity with
Flutter, calendar-kit, current incidental behavior, or the historical prompt. Section 14 is the
complete exclusion contract.

## Assumptions and unknowns

- The owner-answer record accurately captures the intended contract; approval of this consolidated
  document is still pending.
- Twenty-nine `NEEDS_RESEARCH` rows cover user/workload evidence, failure reproduction, device
  floor, zoom/density/contrast, resource budgets/tooling, and repository migration work.
- Six `UNANSWERED` rows are deliberately architecture-stage questions: `PF-021`, `B-006`,
  `B-010`, `B-011`, `B-012`, and `B-014`.
- Several acceptance values can only be measured after an owned renderer and release build exist.
- The React Native app remains unshipped and the wider launch plan can accommodate a coordinated
  breaking Calendar migration.

## Alternatives

- **Do nothing / ship calendar-kit:** smallest engineering intervention, but contradicts the
  owner's stated launch outcome and retains the patched dependency.
- **Patch, fork, wrap, or dual-run calendar-kit:** may reduce short-term replacement work, but
  creates the compatibility and maintenance baggage explicitly excluded from this project.
- **Reduce the Calendar contract:** potentially cheaper, but requires a new product decision and
  would currently sacrifice confirmed workflows, accessibility, or quality outcomes.
- **Build an owned renderer:** recommended because it matches the confirmed clean-replacement
  intent while leaving the technical stack open to evidence.
- **Pause or kill the React Native launch replacement:** valid if the product contract is not
  approved or measured architecture cannot meet it within an acceptable maintenance burden.

## Risks and kill criteria

The largest risks are unmeasured dense-schedule performance, accessible virtualization and focus,
gesture arbitration, orientation/resizable geometry, dependency maintenance, and a stale global
roadmap that still calls the calendar-kit Phase 04 result complete.

Pause or kill this project if the owner does not approve a coherent product contract, if measured
options cannot meet correctness and complete accessibility without an unacceptable platform or
maintenance burden, or if the wider React Native launch no longer requires an owned renderer.
Revise and re-approve rather than silently weakening `P01`–`P08` if evidence invalidates a premise.

## Recommendation

`go`, conditional on explicit approval of this exact product contract. Then complete bounded
pre-architecture research, compare technical options, and request approval of the target design
and every implementation-constraining decision before creating delivery epics.

## Approval

Pending. The owner approved many row-level answers during Rounds 1–4 but has not approved this
consolidated contract as the product authority. Valid next decisions are `approve`, `revise`,
`pause`, or `kill`.

---

## Detailed functional contract

**Draft date:** 2026-09-07  
**Scope:** TimeCalendar React Native Calendar screen, owned day/week timeline, and agenda
integration on iOS and Android

## 1. Purpose and authority

This document defines the user-visible functional contract for replacing
`@howljs/calendar-kit` with an owned TimeCalendar day/week timeline before the React Native
launch. It is deliberately technology-neutral. It does not select a rendering stack, gesture
library, page-recycling strategy, data API, or component architecture.

The row-level source for every decision is the
[functional specification questionnaire](./research/functional-specification-questionnaire.md). The
[discovery evidence](./research/discovery-scope-and-evidence.md) and
[Round 4 answer record](./research/round-4-owner-answers-and-readiness.md) preserve the reasoning and
corrections behind those decisions.

Until the product owner approves this document, it is a draft and does not authorize architecture
or implementation. After approval, this document becomes the product-behavior authority. Named
research gates remain binding unknowns rather than permission to invent values or weaken the
contract.

Normative terms such as **must**, **must not**, and **may** describe the intended first-delivery
contract.

## 2. Product outcome and priorities

The Calendar must let a student understand a day or week, identify the exact course and room at a
glance, follow classes and breaks hour by hour, and organize the day during short app visits. Its
most time-critical workflow is finding the next class and room during a break or immediately after
class. It must also support evening planning for the next day or week and opening a class to attach
homework or exam notes through the existing event-details flow.

When goals conflict, the decision order is:

1. correct dates and content, privacy, and complete accessibility;
2. the accepted fluidity and latency commitments;
3. visual richness.

Implementation convenience must not override the first group or silently weaken the second.

The first delivery is a clean, reusable internal TimeCalendar module. It is not a public npm
package and carries no public API-compatibility or semantic-versioning promise.

Sources: `P-001`, `P-005`–`P-012`, `U-001`, `U-003`, `U-004`, `P-010`, `P-011`.

## 3. Scope and ownership

### 3.1 In scope

The first delivery includes:

- an owned day timeline and whole-week timeline;
- their grid, day headers, pinned hour labels, current-time presentation, paging, vertical
  scrolling, all-day lane, event layout, event activation, and zoom behavior;
- correct integration with the existing agenda mode in the same Calendar screen;
- synced and personal timed events, all-day events, multi-day events, and invalid-event isolation;
- the existing effective display-timezone, calendar visibility, hidden-event, localization,
  theme, unified event-details, and event editability rules named in this specification;
- complete accessible operation and a chronological accessibility representation on the Calendar
  screen; and
- phone and tablet operation in the supported orientations and window sizes.

### 3.2 Product responsibility boundary

The Calendar screen owns product state and orchestration: mode choice and persistence, shared date
context, Today and deep-link intent, settings and menus, local event access, synchronization status
outside the renderer, filtering, and navigation to event details.

The owned timeline is responsible for day/week presentation and interaction. Agenda remains a
separate list presentation, but it consumes the same validated date/event semantics and shares
active date context with the timeline.

Deterministic date, timezone, interval, segmentation, overlap, label-input, and geometry semantics
must be independently defined and verifiable. This requirement states a responsibility outcome,
not a technology or module design.

Sources: `S-001`–`S-006`, `B-001`, `B-004`, `Q-005`, `Q-006`, `Q-012`.

## 4. Supported product environments

The renderer must support:

- React Native on iOS and Android in TimeCalendar development and release builds;
- Android API 24 and iOS 16.4 as minimum-version compatibility smoke-test targets;
- phones and tablets in portrait and landscape;
- full-screen, split-screen, and resizable tablet windows, including representative compact,
  medium, and expanded shapes;
- French and English;
- light and dark themes;
- the app's selected effective display timezone; and
- project-owned Expo development builds and compatible OTA updates.

Expo Go is not supported. A calendar change that affects native behavior or configuration must
ship with a compatible new binary/runtime fingerprint rather than as an incompatible OTA update.

Ordinary keyboard, trackpad, mouse, and computer-style navigation optimization is deferred.
Platform accessibility focus and activation remain first-class and are not part of that deferral.

Sources: `PL-001`–`PL-010`, `D-014`, `B-013`, `M-004`.

## 5. Calendar modes and week model

The Calendar screen has three modes: day, week, and agenda. The owned renderer supplies day and
week; agenda remains the existing separate presentation.

- A new installation opens Calendar in week mode.
- The last selected day/week/agenda mode persists per installation across navigation,
  backgrounding, foregrounding, and process restart.
- Reinstall resets the mode to week.
- Calendar-source changes do not reset the selected mode.
- Day mode shows exactly one selected day.
- Week mode shows exactly one complete Monday-based calendar week.
- Week mode shows Monday through Sunday by default.
- Settings > Calendar provides a **Show weekends** switch, on by default. Turning it off changes
  week mode to Monday through Friday.
- Locale, device region, and display timezone never change Monday as the product week start.
- A settled week page never straddles two weeks or rests on a partial week.
- An empty day or week retains the time grid and clearly communicates that no events are present.
- A narrow or resized window never changes week mode to day automatically; the user changes mode
  explicitly.

The Show weekends setting affects week mode only. It never removes weekend dates or events from
agenda.

Sources: `S-001`–`S-013`, `S-017`, `N-001`, `N-002`, `D-006`, `D-007`, `D-012`.

## 6. Shared date context and navigation

### 6.1 Paging

- Day mode pages exactly one calendar day at a time.
- Week mode pages exactly one complete Monday-based week at a time.
- One swipe or fling settles only one page, even for a fast fling.
- Paging uses native-feeling platform physics while preserving the same settled outcomes on both
  platforms.
- During a finger-held transition, the title and selected date continue to represent the old
  settled page.
- On settle, the page, title, selected date, accessibility context, and dependent event content
  update together.
- Dates years away remain navigable whenever synchronized local data exists. There is no fixed
  twelve-month navigation limit.

### 6.2 Day/week switching

- Switching from day to week shows the Monday-based week containing the day-mode date.
- Switching from week to day selects that week's Monday.
- The timeline preserves its visible clock position and shared zoom value across a day/week mode
  switch.
- Focus follows a stable event identity when possible; otherwise it moves predictably to the
  settled date heading.

### 6.3 Agenda integration

Timeline and agenda share date context in both directions.

- Agenda's active date is the visible date section nearest the top.
- Entering agenda from the current week targets today.
- Entering agenda from another week targets that week's Monday.
- Returning from agenda to day uses agenda's active date.
- Returning from agenda to week uses the Monday-based week containing agenda's active date.
- Agenda omits dates with no events.
- A multi-day event appears in every agenda date section it covers.
- Timeline-only zoom and visible-clock state remain timeline state; agenda does not replace them.

There is no separate agenda date-selection interaction.

### 6.4 Today and direct date navigation

- Today preserves the current mode and the timeline zoom value.
- In day mode, Today selects the current date and scrolls to the current time.
- In week mode, Today selects the current Monday-based week and scrolls to the current time.
- In agenda, Today preserves agenda mode and scrolls to today's section.
- A deep-linked date preserves day, week, or agenda mode. It selects the requested day/week or
  scrolls agenda to the requested section.
- Today and deep-linked moves animate unless reduced motion requests a direct settle.
- If navigation moves focus away from an event, focus moves to the destination date heading and
  the settled date is announced once.

“Today” and the current-time indicator use the current date and instant in the selected effective
display timezone.

Sources: `N-001`–`N-018`, `S-009`, `D-004`, `D-005`, `A-012`, `A-013`, `A-021`.

## 7. Timeline grid, scrolling, and zoom

### 7.1 Grid and vertical position

- Day and week expose the complete 24-hour wall-clock day through vertical scrolling.
- The hours column remains pinned while timed content scrolls vertically.
- Day headers remain pinned during vertical scrolling.
- Hour labels honor the device's 12/24-hour preference.
- The grid shows major hour lines and smaller divisions whose presentation may vary with zoom.
- A fresh day open selects today; a fresh week open selects the current Monday-based week.
- A fresh timeline viewport scrolls to the current time without using event times to choose its
  position. It leaves useful previous-hour context and targets the current-time indicator at
  approximately 30% from the viewport top.
- The exact fresh-position percentage is design tuning, validated against the accepted Google
  Calendar reference, rather than a fixed pixel contract.
- While Calendar remains mounted, day/week switches preserve the visible clock position.
- A process restart follows the fresh-current-time rule rather than restoring an old scroll
  offset.

### 7.2 Zoom

Pinch-to-zoom is mandatory. During a pinch, the clock time under the gesture focal point must
remain visually stationary without a perceptible settle jump or drift. This is a user-visible
invariant; matching Google Calendar's private curves or implementation is not required.

Zoom must also be fully operable without pinch:

- Calendar exposes zoom-in, zoom-out, and reset actions in its menu.
- Non-pinch zoom actions preserve the clock time at the viewport center.
- Controls disable and announce when the measured minimum or maximum is reached.
- Zoom is continuous within the measured bounds.
- One per-installation zoom value is shared by day and week and persists across fresh opens,
  Today, day/week switches, orientation changes, and window resizing.
- Reinstall may reset zoom to the measured default.
- Visual zoom never changes the chronological screen-reader representation or its event content.

Zooming in must make short or crowded events easier to read. Zooming out must reveal enough of the
day's rhythm to understand afternoon breaks, total break time, and how the day unfolds.

The numeric default and minimum/maximum zoom values remain the bounded `T-011` and `T-012`
research gates.

Sources: `T-001`–`T-018`, `N-009`, `N-010`, `A-003`, `A-004`, `A-011`.

### 7.3 Visual presentation

The owned timeline must refine the Calendar experience rather than copy calendar-kit's visuals.
Architecture Book tokens and an owner-approved reference screenshot are the visual sources, with
product-owner design sign-off required before acceptance.

- TimeCalendar identity comes from its typography, spacing, theme tokens, and event source-color
  identity.
- iOS and Android must convey equivalent product meaning and behavior. They do not require
  pixel-identical presentation or identical gesture physics.
- Day headers show the localized weekday and calendar date in day and week modes.
- Today and current time use non-color cues in addition to color.
- A current-time indicator is required for the selected effective display timezone.
- The current-time indicator's exact style and approximately 30%-from-top fresh placement remain
  design tuning against the accepted Google Calendar reference.
- Typography remains recognizably TimeCalendar and preserves content at the accepted largest text
  sizes.
- Readability and contrast take priority over exact source-color fidelity.

Sources: `V-001`–`V-011`, `V-015`, `V-016`, `T-004`, `T-018`.

## 8. Event domain and display semantics

### 8.1 Event sources and activation

Synced and personal events appear together after the existing calendar-visibility and hidden-event
filters are applied. No separate visual distinction between the two kinds is required.

One tap opens the unified event-details surface:

- a synced event opens read-only;
- a personal event opens editable.

There is no persistent selected-event state. Cancelled events are hidden in this delivery.

### 8.2 Timed events

- Timed events use the selected effective display timezone.
- A timed event lasting 24 hours or longer remains timed; duration alone never moves it to the
  all-day lane.
- A timed event crossing local midnight produces one clipped segment on every covered local day.
- Every segment exposes the full event identity and accessible label, indicates continuation, has
  an unambiguous activation target, and opens the same event details.
- A segment that continues beyond the visible day has a top or bottom continuation cue.
- Back-to-back events whose end and start are equal do not overlap and may share a column without
  an artificial gap.
- Simultaneously overlapping events use equal-width, side-by-side columns. No event covers
  another.
- Placement is deterministic for identical data: start instant, then end instant, then stable
  event identity.
- A zero-duration timed event renders as a small tappable instant marker and exposes its title and
  time accessibly.

The supported numeric overlap density and any aggregation threshold remain the bounded `E-020`
research gate. Whatever threshold is selected must preserve deterministic, unambiguous touch and
accessibility targets.

### 8.3 All-day events

- All-day events appear in a lane above the timed grid.
- Imported all-day events use floating calendar dates. Changing display timezone does not change
  their named dates.
- The all-day end date is exclusive; an event from the 10th to the 11th covers only the 10th.
- Multi-day all-day events are supported across every covered date.
- A zero-day all-day event is invalid and is skipped in isolation.

The collapsed all-day lane shows a bounded number of rows. Each visible date owns a **+N** action
beneath that date's visible all-day events, where `N` is the number hidden on that date. A hidden
multi-day event contributes once to the count of every date it covers.

Activating any per-date **+N** action expands the all-day lane for the whole visible day or week.
The expanded lane:

- has a bounded maximum height;
- scrolls vertically as one whole lane independently of the timed grid; and
- has one global collapse action beside the hours gutter.

A vertical gesture scrolls the all-day lane only when it begins inside that lane; a gesture that
begins in the timed grid scrolls the timed grid. Changing the visible day/week or changing mode
resets the destination to collapsed before it settles. Expansion is not persisted.

The exact collapsed row count and expanded maximum height remain bounded design/device research.

### 8.4 Content, truncation, and color

- A normal timed tile shows event title and location. Time is conveyed visually by grid position.
- Under constrained width or height, use ordinary truncation: title has priority and location is
  shown only when it fits.
- Full title, time range, and location remain available through accessibility and event details.
- A missing title uses `(No title)` in English or `(Sans titre)` in French.
- A missing location is omitted.
- A malformed optional field is omitted without discarding an otherwise valid event.
- Source color identifies the event or calendar but may be adjusted in light or dark theme until
  content contrast is acceptable.
- A missing or invalid color uses a neutral, theme-safe fallback.
- Readable content has priority over exact preservation of source color.

The deterministic contrast and color-adjustment algorithm remains the bounded `V-009` research
gate.

Sources: `E-001`–`E-026`, `I-001`–`I-003`, `V-008`–`V-013`, `A-009`, `A-010`, `A-019`, `A-020`.

## 9. Gesture and touch behavior

Gesture arbitration must produce these outcomes:

- a two-finger gesture gives pinch precedence;
- one-finger movement locks to horizontal paging or vertical scrolling and never drives both;
- movement beyond tap tolerance cancels an event press so a page or scroll gesture cannot open an
  event accidentally;
- the expanded all-day lane and timed grid own vertical gestures that start inside their
  respective bounds; and
- small events expand their effective hit area to at least 44 points on iOS or 48 dp on Android.

Dense or overlapping events must retain deterministic, unambiguous targets.

Calendar does not require haptics. Long press, drag-to-create, drag-to-reschedule,
resize-to-change-duration, and actions on empty grid space are outside the first delivery.

Sources: `I-004`–`I-014`, `A-019`, `A-020`.

## 10. Date, timezone, locale, and environment changes

- The renderer preserves the app's selected effective display-timezone preference exactly.
- Timed events, Today, the current-time indicator, local-day segmentation, and navigation use that
  single display timezone.
- Per-calendar and per-event timezone display is not supported in the first delivery.
- All-day events retain floating-date semantics independently of display timezone.
- Launch date semantics are Gregorian. Non-Gregorian system calendars are not rendered, and the
  limitation must be explicit.
- French and English are the complete launch locale set.
- Date navigation and Monday-week arithmetic must remain correct across daylight-saving gaps and
  repeats.

Every date uses a familiar 24-hour wall-clock visual grid. On spring-forward dates, the nonexistent
hour remains an ordinary empty visual hour. On fall-back dates, the grid does not add a repeated
hour row or special daylight-saving explanation. The underlying instant projection, event dates,
navigation, and behavior must nevertheless remain deterministic, correct, and crash-free.

When locale, display timezone, theme, font scale, orientation, or window size changes, Calendar
must cancel or settle the active gesture, preserve mode, selected date/week, zoom, and visible
clock position, then atomically replace the old complete state with the new complete state. It must
never expose mixed old/new labels, dates, events, theme, or geometry.

Sources: `D-001`–`D-016`, `R-008`, `R-009`, `PF-017`.

## 11. Local data, synchronization, and failures

Calendar rendering reads device-local data. Date navigation never starts or waits for a network
request and never presents a date-change loader. A locally empty range is a real empty date.
Calendar has no pull-to-refresh or other manual refresh action in this delivery.

Initial network synchronization finishes before Calendar becomes available and owns its own
loading and failure UI. If initial synchronization succeeds with zero events, Calendar opens
normally: day/week shows the visible empty grid and agenda omits empty dates.

Routine synchronization runs separately in the background at app startup:

- Calendar shows no refreshing or stale-data indicator for routine synchronization;
- existing local events remain visible; and
- completed changes replace local event state atomically.

For recoverable data failures, keep valid cached/local events visible where possible, communicate
the problem accessibly, and expose a retry path. Exact presentation belongs to later design.

One malformed event must never blank valid events:

- invalid or missing required dates, a zero-day all-day range, or an end before the start cause
  only that event to be skipped;
- malformed optional fields are omitted where the remaining event is valid; and
- reporting contains privacy-safe metadata only.

If a focused event disappears during an update, retain focus by stable identity when still valid;
otherwise move it to the relevant date heading. If event details are opening or open, close or
replace them with an accessible “no longer available” state.

An unexpected renderer failure must expose an accessible chronological representation and retry,
not a blank Calendar. Event content and personal data must never appear in logs, analytics,
benchmarks, crash metadata, or error reports.

Sources: `N-015`, `N-018`, `V-014`, `R-001`–`R-012`, `I-010`, `M-007`.

## 12. Accessibility contract

The engineering baseline is applicable WCAG 2.2 Level A/AA outcomes interpreted for native
software through WCAG2ICT and EN 301 549, together with current Apple and Android guidance. This is
an engineering acceptance baseline, not a legal declaration.

### 12.1 Complete operation

- Every timeline operation has an alternative that does not require pinch, horizontal swipe, or
  another multi-finger gesture.
- Today, paging actions, zoom-in, zoom-out, and reset provide the required alternatives.
- VoiceOver, TalkBack, Voice Control, Switch Control, and other platform accessibility controls
  can navigate and activate every required action.
- The Calendar remains fully operable at the largest supported iOS Dynamic Type and Android font
  scale settings.
- At large text sizes, the visual grid may simplify, but no required content or operation may
  disappear.
- Reduced motion removes nonessential animation and makes Today/deep-link moves settle directly.
- Increased contrast, bold text, button shapes, and color filters are supported wherever the
  platform provides them.
- Today, current time, focus, and errors use non-color cues in addition to color.

### 12.2 Chronological semantics and focus

The Calendar screen exposes one chronological accessibility representation grouped by settled
date. It is not a separate destination and must not duplicate the visual grid as a competing focus
tree. All-day and timed events have a deterministic chronological order.

- A timed event's accessible name contains its title or localized fallback, full time range, and
  location when present.
- An all-day event's accessible name contains its title or localized fallback, “all day,” covered
  date or date range, and location when present.
- Event activation has a concise hint that it opens event details.
- Visual zoom does not change chronological event order or content.
- Paging announces the settled date/week and relevant event context once; it does not announce
  intermediate gesture state.
- Page recycling and mode changes preserve focus by stable event identity when possible; otherwise
  focus moves predictably to the settled date heading.

When the all-day lane is collapsed, accessibility exposes visible all-day events plus each date's
“show N more” action. Hidden events enter navigation only after expansion. If collapse hides the
focused event, focus returns to the expansion action for the relevant date.

Controls and event targets meet the 44-point iOS and 48-dp Android minimum through hit-area
expansion where necessary.

Sources: `A-001`–`A-024`, `V-005`, `V-006`, `V-011`, `I-014`.

## 13. User-visible continuity and responsiveness

Detailed measurement procedures belong in later acceptance research and the approved technical
design, but the following accepted product outcomes constrain them:

- transitions never show a wrong date, unexplained blank or partial frame, unlabeled stale events,
  or theme flash;
- while replacement geometry is prepared, the last complete correct layout remains visible and is
  replaced atomically by the next complete layout;
- for locally available data, a warm Calendar entry, mode request, Today action, or arbitrary date
  navigation produces its first correct frame within 250 ms p95 and usable interaction within
  500 ms p95, subject to release-baseline validation;
- cold app start produces the first correct Calendar frame from local data within one second p95,
  subject to release-baseline validation;
- paging, vertical scrolling, and pinch feel native and meet the active display's accepted frame
  deadlines; and
- the renderer remains correct, responsive, and resource-bounded during the required 30-minute
  paging, scrolling, zooming, and mode-switch stress run.

These targets do not permit a wrong first frame, network-bound date navigation, unbounded retained
pages/events/views/semantic nodes, a continuous idle render loop, or unnecessary recurring work.

Sources: `PF-001`–`PF-005`, `PF-012`–`PF-024`, excluding the still-unresolved `PF-021` architecture
choice.

## 14. Explicitly outside the first delivery

The first delivery does not include:

- month view or custom multi-day modes;
- reimplementation or redesign of the existing agenda presentation;
- Home/mini/embedded renderer reuse;
- side-by-side date or calendar comparison;
- renderer-owned search or filtering controls;
- event creation from the grid or an empty-grid action;
- long-press behavior, drag-and-drop rescheduling, drag-to-create, or resize-to-duration;
- client recurrence expansion or recurrence editing;
- per-event or per-calendar timezone display;
- ordinary keyboard, mouse, trackpad, or computer-navigation optimization;
- web support;
- a standalone public package, public API stability promise, package license, package example, or
  contribution guide;
- a calendar-kit fallback, dual renderer, feature flag, compatibility shim, rollback path, or
  staged percentage rollout; or
- general visual or behavioral parity with the current React Native calendar, Flutter, calendar-kit,
  or the historical implementation prompt.

Later direct manipulation and internal reuse must remain possible through separately approved
scope, but they must not be partially implemented or used to broaden this delivery.

Sources: `S-013`–`S-018`, `I-004`–`I-012`, `D-003`, `PL-008`, `PL-009`, `Q-003`, `Q-016`–`Q-019`,
`M-002`, `M-005`, `M-006`, `M-008`, `M-009`, `X-001`–`X-010`.

## 15. Migration and compatibility contract

`@howljs/calendar-kit`, its patch, and its adapter must not ship in the React Native launch and
should be removed as early as practical.

The existing `CalendarEvent` shape, `useCalendarEvents(range)` seam, renderer facade, Calendar
implementation, adapter behavior, page buffering, time window, and callback assumptions carry no
compatibility promise. They may be broken and replaced through a coordinated migration.

The React Native app is unshipped, so Calendar may be temporarily incomplete or broken on `main`
during development. That allowance does not permit a compatibility layer, dual renderer, fallback,
or relaxation of the launch contract.

Sources: `P-002`, `B-002`, `B-003`, `B-005`, `Q-002`–`Q-004`, `M-001`–`M-003`, `M-010`.

## 16. Research and architecture gates

### 16.1 Research that must remain visible

The functional behavior above is settled, but these values or evidence must be resolved in the
non-functional requirements, acceptance plan, design work, or architecture evaluation:

| Area                         | Questionnaire IDs                              | Required outcome                                                                                |
| ---------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| User and workflow evidence   | `U-002`, `U-005`, `U-006`, `U-008`–`U-010`     | Privacy-safe opt-in dogfood/usability evidence without event content or personal data.          |
| Current failure reproduction | `P-004`                                        | Exact reproduction, build/device/dataset metadata, screen capture, and traces.                  |
| Binding device floor         | `PL-003`                                       | Release validation of the proposed French-market Galaxy A16 5G floor.                           |
| Zoom and density             | `T-011`, `T-012`, `E-020`                      | Measured default/bounds and supported overlap treatment.                                        |
| Contrast                     | `V-009`                                        | Deterministic color/foreground/scrim algorithm verified against the accessibility contract.     |
| Workload fixtures            | `PF-006`–`PF-011`                              | Privacy-safe aggregate shapes and fabricated p50/p95/p99 fixtures without copied data.          |
| Release resource budgets     | `PF-018`–`PF-020`, `PF-022`, `PF-025`–`PF-028` | Reproducible release metrics, tools, repetition rules, artifact location, and regression gates. |
| Repository migration audit   | `B-009`, `M-011`, `M-012`                      | Revalidate utilities and identify code, ADR, and OpenSpec retirement/supersession work.         |

Missing research evidence must not be converted into guessed product values or an assumed pass.
Research that needs an implemented renderer remains a downstream acceptance gate rather than a
blocker to approving this behavioral specification.

### 16.2 Downstream acceptance obligations

The non-functional requirements and acceptance plan must preserve the already accepted quality
and evidence posture rather than reopening it as product scope:

- release builds are authoritative for performance acceptance;
- the binding physical-device matrix is Galaxy A16 5G, iPhone SE 3, Galaxy S23, and iPhone 15 Pro,
  subject to the named Galaxy A16 validation gate;
- recorded human physical-device evidence is required for actual gesture feel, pinch arbitration
  and focal stability, assistive-technology operation, focus, largest text, reduced motion,
  increased contrast, phone/tablet orientation, and representative resizable windows;
- automated checks are required for deterministic date, interval, timezone, segmentation,
  indexing, overlap, geometry, zoom, gesture-state, focus, recycling, and environment-change
  behavior, but automation or agent inspection alone cannot replace the named human gates;
- the pure deterministic date/week/timezone/segmentation/indexing/overlap/zoom modules require 100%
  statement and branch coverage plus property-based invariant coverage;
- benchmark and correctness fixtures must be deterministic and fabricated from aggregate shapes,
  with no copied event content or identifiers;
- the finite fixture catalog must cover empty, normal p50, dense p95, supported-worst p99,
  1,000-event stress-only, adjacency, identical starts, maximum overlap, very short and
  zero-duration events, invalid ranges, single/multi-day all-day events, cross-midnight and
  24-hour-plus timed events, daylight-saving gaps/repeats, long/missing text, arbitrary colors,
  hidden calendars/events, live insertion/removal, initial-sync and local-failure/recovery states,
  and maximum text size; and
- product-owner review accepts behavior and design, while engineering review accepts architecture,
  accessibility evidence, performance evidence, and repository quality.

Launch also requires zero TypeScript errors, lint warnings, formatting drift, React Doctor
findings, architecture-boundary violations, and unreviewed suppressions. No `TODO`, `FIXME`,
`HACK`, compatibility shim, temporary dual renderer, unexplained magic timeout, disabled check,
knowingly flaky test, or accepted P0/P1 correctness, accessibility, privacy, or performance defect
may remain. No lower-severity defect is pre-approved; any known residual requires explicit
case-by-case owner approval after its impact and risk are documented. Costly-to-reverse technology
or responsibility-boundary choices require an ADR.

Exact scripts, repetitions, reports, raw-result locations, and measurable resource/regression
budgets belong in later acceptance research and the approved technical design.

Sources: `P-008`, `P-009`, `A-024`, `PF-004`, `PF-005`, `Q-001`, `Q-002`, `Q-005`–`Q-015`,
`Q-020`, `M-004`, `M-013`, `M-014`.

### 16.3 Deliberately unresolved architecture decisions

The following questionnaire rows remain outside this functional specification and must be decided
only after measured architecture options exist:

- `PF-021`: visible work and bounded prefetch/overscan;
- `B-006`: whether and how an imperative renderer API exists;
- `B-010`: final Hermes/New Architecture constraint;
- `B-011`: the role of Reanimated, Gesture Handler, or alternatives;
- `B-012`: evidence required for a native or rendering dependency; and
- `B-014`: dependency ownership, maintenance, licensing, release, and security criteria.

No architecture option may weaken the functional contract to make its implementation easier.

## 17. Completion and approval

This functional specification is ready for product-owner review when it:

- states only explicitly confirmed behavior, exclusions, and deferrals;
- preserves every named research and architecture gate;
- contains no inferred compatibility promise or implementation choice; and
- remains traceable to the questionnaire IDs cited by each section.

Approval of this document authorizes the product contract, not a renderer architecture or
implementation. Architecture options, the non-functional requirements, and the acceptance plan
remain separate reviewed artifacts.

**Product-owner decision:** Pending.
