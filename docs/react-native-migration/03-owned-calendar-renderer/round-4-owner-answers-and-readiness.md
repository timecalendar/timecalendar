# Round 4 owner answers and readiness

Status: Round 4 owner answers recorded on 2026-09-07. Product interrogation is wrapped up;
bounded research and later architecture decisions remain. This is product-discovery evidence,
not the approved functional specification or renderer architecture.

## Why this document exists

Round 3 left 49 questionnaire rows `UNANSWERED`. Round 4 asked the owner only about
user-visible behavior and authority boundaries. It did not ask the owner to invent workload
percentiles, memory limits, algorithms, profiler choices, or dependency policy.

This record captures the owner's corrections as well as accepted recommendations. The
[questionnaire](./02-functional-specification-questionnaire.md) remains the row-level source of
truth.

## Owner decisions

### Timeline and agenda continuity

- Timeline and agenda share date context in both directions.
- Agenda's active date is the visible date section nearest the top.
- Entering agenda from the current week targets today. Entering it from any other week targets
  that week's Monday.
- Returning to day uses agenda's active date. Returning to week uses the Monday-based week that
  contains it.
- Today in agenda preserves agenda mode and scrolls to today's section.
- A date deep link preserves agenda mode and scrolls to the requested date.
- A multi-day event appears in every covered agenda date section.
- Agenda omits dates that have no events; it does not render empty date sections.
- The Show weekends setting affects week mode only and never hides agenda dates or events.

### Local data and synchronization boundary

- Calendar navigation reads device-local data and never starts a network request.
- Merely changing date does not show a loading state.
- Initial network synchronization completes before Calendar becomes available and owns its own
  loading and failure UI.
- A successful initial synchronization with zero events opens Calendar normally with an empty
  day/week grid.
- Routine synchronization runs in the background at app startup without a Calendar refreshing
  status. Calendar keeps local events visible and applies completed changes atomically.
- A locally empty range is a valid empty date, not evidence that distant data is still loading.
- A local data-store failure follows the general accessible failure and retry contract.

This corrects the earlier assumption that distant date navigation might wait for network data
and supersedes the former Calendar-owned initial-loader wording in `R-001`, `R-002`, and `V-014`.

### All-day overflow

- A collapsed all-day lane shows a bounded number of rows.
- Each day column displays its own `+N` count below that day's visible all-day events. `N` is the
  number of events hidden for that date and is therefore at least one whenever the affordance is
  present.
- A hidden multi-day all-day event contributes to the hidden count of every covered date.
- Activating a per-date `+N` expands the all-day lane for the whole visible day/week.
- One global collapse affordance lives beside the hours gutter; expansion belongs to each date's
  `+N` action.
- The expanded lane has a bounded maximum height and scrolls internally as one whole lane.
- A vertical gesture beginning inside the expanded lane scrolls that lane; a vertical gesture
  beginning in the timed grid scrolls the timed grid.
- Changing visible day/week or changing mode resets the destination to collapsed before settle.
  Expansion is not persisted.
- While collapsed, assistive technology exposes visible all-day events plus each date's
  “show N more” action. Hidden events become navigable after expansion. Collapsing while focus is
  on a newly hidden event returns focus to the appropriate expansion control.

The exact collapsed row count and maximum expanded height remain design/device research, not an
owner-supplied number.

### Event content and accessibility

- Missing titles use `(No title)` in English and `(Sans titre)` in French.
- Missing locations are omitted.
- Missing or invalid colors use a neutral, theme-safe fallback.
- Malformed optional fields are omitted while the event remains usable.
- A malformed required date skips only that event under the privacy-safe error contract.
- A multi-day event appears in each covered agenda section.
- An all-day accessible name contains title/fallback, “all day,” covered date or range, and
  location when present.
- Event activation exposes a concise hint that it opens event details.
- At narrow widths or short heights, use ordinary truncation. Show title first and location when
  space remains; complete title, time, and location remain available through accessibility and
  event details.
- A cramped window never changes the user's mode automatically. The complete selected five- or
  seven-day week remains the week-mode outcome; the user may choose day mode themselves.

### Gestures and zoom

- Two-finger pinch has precedence.
- One-finger motion locks to either horizontal paging or vertical scrolling and cannot drive both.
- Movement beyond tap tolerance cancels an event press, preventing a scroll or page gesture from
  opening the touched event.
- Zooming in makes short or crowded events easier to read. Zooming out reveals the day's overall
  rhythm, including afternoon breaks and total break time.
- Day and week share one per-installation zoom value across fresh opens, mode changes,
  orientations, and window resizing.
- Non-pinch zoom-in, zoom-out, and reset actions preserve the clock time at the viewport center.
- Zoom controls disable and announce their measured minimum/maximum limits. Screen-reader event
  order and content do not change merely because visual zoom changes.

Automated tests should cover deterministic gesture state, geometry, direction locking, focus,
and environment transitions where stable. They must not become brittle coordinate-heavy test
theatre. Recorded human physical-device QA accepts real gesture feel, pinch arbitration,
orientation, and resizing.

### Orientation, resizing, and manual acceptance

- Portrait and landscape are supported on phones and tablets.
- Resizable and split-screen tablet windows are supported.
- Representative compact, medium, and expanded window shapes require recorded human QA by the
  owner. Agent inspection or automated results alone cannot satisfy this gate.
- Orientation or window-size changes cancel or settle active gestures, preserve mode, date/week,
  zoom, and visible clock position, and atomically swap to complete replacement geometry.
- Native/Expo configuration changes needed to enable these outcomes are allowed. Native-affecting
  changes ship with a compatible new binary/runtime fingerprint, not an incompatible OTA.

This supersedes the earlier portrait-only/full-screen product posture. The current native
configuration remains a repository fact to change during implementation, not the desired product
contract.

### Daylight-saving presentation

- Keep the familiar 24-hour wall-clock grid on every date.
- A nonexistent spring-forward hour remains an ordinary empty visual hour; do not introduce a
  special 23-hour grid.
- Do not introduce a repeated-hour row or special fall-back explanation in the first delivery.
- Underlying instant projection, local dates, navigation, and deterministic behavior must remain
  correct and crash-free. The simplified visual presentation is not permission to normalize bad
  input silently or move events to a wrong date.

### Performance and resource posture

- Today and arbitrary date navigation over local data require a first correct frame within
  250 ms p95 and usable interaction within 500 ms p95.
- A cold app start requires the first correct Calendar frame from local data within one second
  p95, subject to release-baseline validation on the accepted physical devices.
- The renderer must not exhibit unbounded memory, native-view, semantic-node, or recurring idle
  work.
- Acceptance includes a 30-minute paging, scrolling, zooming, and mode-switch stress run on the
  accepted non-flagship floor with battery and thermal observation.
- Numeric memory, node, idle-CPU, variance, and regression thresholds are engineering research
  derived from release traces. They are not owner guesses.

### Migration authority and residual risk

- The current `CalendarEvent` shape, `useCalendarEvents(range)` seam, renderer facade, and Calendar
  implementation have no compatibility promise.
- Engineering is explicitly authorized to break and replace them through a coordinated clean
  migration when that produces the correct owned-renderer contract.
- A broken Calendar on `main` during development is acceptable because the React Native app is
  unshipped.
- Do not add compatibility shims or preserve obsolete APIs merely for backward compatibility.
- No P0/P1 correctness, accessibility, privacy, or performance defect may ship.
- No lower-severity defect is pre-approved. A known lower-severity residual may ship only after
  the owner explicitly reviews its documented impact and risk. The current posture is to approve
  no such compromise.

## Explicit corrections to the questioning

The owner rejected or corrected several assumptions in the Round 4 questions:

- Agenda has no separate explicit date-selection gesture; its active date comes from scrolling.
- The all-day `+N` count belongs under each date, not in the hours gutter. The global collapse
  affordance belongs by the gutter.
- Calendar date navigation does not fetch from the network. Synchronization is a separate app
  concern.
- “Tablet support” did not mean portrait-only full-screen support. Landscape and resizable windows
  are desired on phones/tablets and require deliberate configuration plus human QA.
- Complex DST-specific visuals are not a launch priority; the product chooses a stable 24-hour
  visual grid while retaining correct underlying date/instant behavior.
- Dependency admission criteria are engineering/architecture work and should not be presented as
  an owner product question.

## Questionnaire disposition after Round 4

The 280 unique questionnaire rows now total:

| Status           | Count |
| ---------------- | ----: |
| `CONFIRMED_IN`   |   190 |
| `CONFIRMED_OUT`  |    50 |
| `DEFERRED`       |     5 |
| `NEEDS_RESEARCH` |    29 |
| `UNANSWERED`     |     6 |

The 29 bounded research rows are:

- user evidence: `U-002`, `U-005`, `U-006`, `U-008`, `U-009`, `U-010`;
- current failure/device evidence: `P-004`, `PL-003`;
- zoom, density, and contrast: `T-011`, `T-012`, `E-020`, `V-009`;
- workload and release budgets: `PF-006`–`PF-011`, `PF-018`–`PF-020`, `PF-022`,
  `PF-025`–`PF-028`;
- repository/migration audit: `B-009`, `M-011`, `M-012`.

The six `UNANSWERED` rows are architecture-stage decisions, not missing owner product choices:

- `PF-021`: visible work and bounded overscan;
- `B-006`: declarative versus imperative renderer API and its shape;
- `B-010`: final Hermes/New Architecture constraint;
- `B-011`: Reanimated/Gesture Handler status;
- `B-012`: evidence required before adding a native/rendering dependency; and
- `B-014`: dependency ownership, maintenance, license, release, and security criteria.

Do not ask the owner to choose these without measured architecture options.

## Readiness conclusion

The broad owner interrogation is complete enough to stop asking speculative product questions.
Discovery is not fully closed because the bounded research has not run, the non-functional and
acceptance documents do not exist, and the six architecture questions intentionally wait for the
architecture phase.

The next documentation sequence is:

1. finish the bounded research that can run before implementation;
2. draft the functional specification from confirmed product behavior and explicit exclusions;
3. obtain the owner's explicit approval of that functional specification;
4. write measurable non-functional requirements and the acceptance plan, preserving blocked
   release measurements as named gates rather than fabricated results; and
5. only then compare architecture options and decide the six remaining architecture rows.

No renderer implementation, technology choice, compatibility layer, or functional-specification
approval is created by this record.
