# Discovery scope and evidence

Status: evidence inventory, not an approved functional specification.

## Purpose

This document prevents the replacement renderer from inheriting accidental requirements from current code, historical Flutter code, implementation-specific OpenSpec artifacts, or the legacy implementation prompt. It records what we know, how we know it, and what still requires product-owner confirmation.

## Evidence hierarchy

The hierarchy is about authority for future product scope, not about whether a source is technically useful.

| Priority | Source | What it may establish | What it cannot establish by itself |
| --- | --- | --- | --- |
| 1 | Explicit product-owner decision for this project | Future in-scope and out-of-scope behavior | Technical facts that still require measurement |
| 2 | Approved future functional specification | The reviewed product contract | Implementation design unless explicitly constrained |
| 3 | Current OpenSpec product specifications and accepted ADRs | Existing system contracts and costly prior decisions | That every existing contract must survive the replacement unchanged |
| 4 | Current React Native behavior and tests | What users or developers may experience today | That observed behavior is desired or correct |
| 5 | Product reports and measured traces | Real problems, workflows, and performance evidence | The best solution or an unmeasured universal conclusion |
| 6 | Flutter behavior | Historical product intent and edge cases worth asking about | Required parity, current correctness, or suitable architecture |
| 7 | Roadmaps, backlog notes, and the legacy prompt | Candidate requirements, risks, and prior thinking | Confirmed scope or acceptance thresholds |

When sources conflict, we do not pick a winner silently. We record the conflict and ask the product owner unless it is a purely factual matter that can be measured.

## Explicitly confirmed by the product owner in this session

| ID | Confirmed statement | Status |
| --- | --- | --- |
| C-001 | Create a dedicated, numbered documentation area for this project. | `CONFIRMED_IN` |
| C-002 | Explore what the product really needs before implementation. | `CONFIRMED_IN` |
| C-003 | Never infer an unconfirmed product requirement. | `CONFIRMED_IN` |
| C-004 | Do not treat the Flutter implementation as authoritative. | `CONFIRMED_IN` |
| C-005 | Treat features and performance as important first-class concerns. | `CONFIRMED_IN` |
| C-006 | Target expert-level engineering, excellent code quality, and work suitable for open sourcing with pride. | `CONFIRMED_IN` |
| C-007 | Do not knowingly introduce technical compromises or technical debt. | `CONFIRMED_IN` |
| C-008 | Produce a large, durable question backlog that a future session can use to build the functional specification. | `CONFIRMED_IN` |
| C-009 | This session is documentation and discovery, not renderer implementation. | `CONFIRMED_IN` |

These statements deliberately remain broad. For example, C-005 does not confirm 1,000 events, 250 ms, 60 fps, 120 fps, a specific device, or a specific gesture. Those details are unanswered.

## Current React Native behavior observed

The following is an inventory, not a parity promise.

| Area | Observation | Status |
| --- | --- | --- |
| Surface | The Calendar screen currently offers `day`, `week`, and `agenda` modes. | `OBSERVED` |
| Initial mode | The controller initializes to `week` on each mount. | `OBSERVED` |
| Week size | The current screen always passes `showWeekends`, so the adapter requests seven days. | `OBSERVED` |
| Agenda | Agenda is a separate `SectionList` presentation selected in place, outside the timeline renderer. | `OBSERVED` |
| Time window | The timeline is configured with named 07:00 and 21:00 boundaries. | `OBSERVED` |
| Events | The domain source merges synced and personal events, then applies hidden-event and calendar-visibility filters. | `OBSERVED` |
| Event action | Pressing a timeline or agenda event opens the unified event-details route. | `OBSERVED` |
| Navigation | The screen has Today navigation and consumes a one-shot `focusDate` route parameter. | `OBSERVED` |
| Date state | The controller keeps separate anchor and visible dates and updates its loaded window around calendar-kit callbacks. | `OBSERVED` |
| Event loading | Timeline data is selected through a quarter-quantized window with a two-month buffer. | `OBSERVED` |
| Paging | The calendar-kit adapter configures four pages per side. | `OBSERVED` |
| All-day | All-day events are projected to date-only values and rendered in a header lane. | `OBSERVED` |
| All-day end | The adapter converts the stored exclusive end to calendar-kit's inclusive final day with an end-minus-one-millisecond rule and a zero-duration guard. | `OBSERVED` |
| Long timed events | Tests document that calendar-kit may put a timed event of at least 24 hours in its all-day row while retaining a timed accessibility label. | `OBSERVED` |
| Current time | The renderer asks calendar-kit to show a current-time indicator. | `OBSERVED` |
| Timezone | The renderer receives the resolved display timezone; timed day boundaries and labels use it, while all-day dates use a floating UTC-day-key convention. | `OBSERVED` |
| Localization | Current calendar copy and date formatting support French and English. | `OBSERVED` |
| Theme | The adapter maps application theme tokens to calendar-kit and uses event colors for tiles. | `OBSERVED` |
| Insets | The screen passes the iOS bottom safe-area inset and zero on Android. | `OBSERVED` |
| Renderer boundary | The screen talks to a renderer-neutral facade; the calendar-kit adapter is isolated below it. | `OBSERVED` |
| Imperative API | The current renderer handle exposes only `goToDate`, with animation and scroll-to-current-time options. | `OBSERVED` |
| Zoom | The current owned facade exposes no zoom contract. | `OBSERVED` |
| Verification | Current tests mostly prove screen wiring and pure utilities; real gestures, paging, dense performance, and assistive-technology behavior remain device work. | `OBSERVED` |

## Flutter behavior observed

The Flutter code is useful for discovering questions and edge cases. It is not a requirement source.

| Area | Observation | Status |
| --- | --- | --- |
| Modes | The inspected Flutter calendar exposes week and planning modes, not a distinct day mode. | `OBSERVED` |
| Week size | It chooses five or seven visible days from a persisted `show_weekends` preference whose default is true. | `OBSERVED` |
| Time window | The week view uses 07:00 to 21:00 and a 50-pixel hours column. | `OBSERVED` |
| Vertical scale | Hour height starts at 60, is pinch-adjustable, clamped from viewport-derived values, and persisted. | `OBSERVED` |
| Pinch | The implementation attempts to preserve the content position under the focal point while scaling. | `OBSERVED` |
| Vertical synchronization | Separate hours and week scroll views are synchronized through a custom controller. | `OBSERVED` |
| Vertical restoration | A process-memory scroll offset is reused when the week layout is recreated. | `OBSERVED` |
| Horizontal navigation | A horizontal builder renders week-sized pages with custom snapping physics. | `OBSERVED` |
| Date navigation | A shared current-day notifier drives animated week navigation. | `OBSERVED` |
| Overlap layout | Events are packed into columns by historical app-owned logic. | `OBSERVED` |
| Current time | A current-day line and dot are drawn when now is inside the grid hours. | `OBSERVED` |
| Rendering behavior | Pinch updates call widget state repeatedly, and each week owns a vertically scrollable event tree. | `OBSERVED` |

Nothing above confirms that the owned React Native renderer must reproduce the Flutter mode model, exact dimensions, persistence behavior, gesture physics, or internal structure.

## Existing written contracts and candidate requirements

The repository currently contains several layers of written intent:

- The archived `mobile-calendar-timeline` OpenSpec is implementation-specific to the original calendar-kit adoption. It includes useful product candidates such as day/week views, event tiles, navigation, localization, and accessibility, but also obsolete structural requirements such as the former chrome wrapper and calendar-kit dependency.
- The `mobile-calendar-agenda` OpenSpec establishes the current agenda as an in-place, separate list surface. Whether agenda is part of this replacement project's scope, merely an integration constraint, or due for redesign remains unanswered.
- The accepted renderer-boundary ADR keeps orchestration and event loading in the screen and dependency adaptation in the renderer. It explicitly allows revisiting the contract if an owned renderer needs a materially different product-facing API.
- The accepted display-timezone ADR and active OpenSpec change establish current cross-application timezone behavior. We still need the owner to confirm whether this project preserves that behavior unchanged, refines it, or treats it as an external invariant.
- Event-details, hidden-events, personal-events, calendar-sync, and user-calendar specs rely on calendar events appearing and remaining tappable or filterable. Those consumers create integration constraints, but they do not decide the new renderer's detailed UX.
- Architecture-book accessibility, theming, testing, and Definition of Done documents describe current project quality policy. The owner requested an even stronger quality posture, whose concrete bar remains to be defined.

## Material conflicts and unsupported assumptions

| ID | Conflict or assumption | Why it cannot be silently resolved |
| --- | --- | --- |
| CF-001 | The archived timeline spec says a five-day default; current React Native behavior and the architecture book say seven days; Flutter defaulted to seven with a five/seven preference. | Only the owner can choose the future product default and whether a preference exists. |
| CF-002 | The legacy prompt requires day, week, and agenda; inspected Flutter exposes week and planning, while current React Native exposes all three. | Current availability does not prove future necessity. |
| CF-003 | The legacy prompt requires pinch zoom because Flutter has it; the current React Native facade has no zoom API. | Historical parity is explicitly non-authoritative. |
| CF-004 | The legacy prompt sets at least 1,000 loaded events as non-negotiable. | No owner-confirmed workload, event horizon, distribution, or percentile supports that number yet. |
| CF-005 | Earlier roadmap prose targeted 120 fps; the device note later reframed the realistic bar as the device refresh rate; the prompt adds a 250 ms interaction target. | Metrics, measurement boundaries, target devices, and pass percentiles are unconfirmed. |
| CF-006 | The prompt proposes at most five mounted pages and one or two pages of overscan; the current adapter uses four pages per side. | Page count is an implementation choice that should follow measured UX and memory goals. |
| CF-007 | The prompt says mode changes must not remount the expensive tree and must preserve date, vertical offset, zoom, and selection. | The user-visible continuity contract and each retained state need separate confirmation. |
| CF-008 | The prompt requires all-day, multi-day timed, invalid-range, and zero-duration semantics. | Some behavior exists in storage/tests, but desired display and error handling have not been confirmed for the new surface. |
| CF-009 | The prompt treats current product behavior as the oracle when documentation disagrees. | The owner explicitly prohibited inferring future requirements from an implementation. |
| CF-010 | The prompt preselects React Native views, Reanimated, Gesture Handler, Hermes, New Architecture, and a Skia decision process. | Runtime facts may constrain options, but technology selection must follow confirmed needs and evidence. |
| CF-011 | The prompt assigns accessibility ownership and detailed semantic behavior to the renderer. | Accessibility outcomes matter, but exact interaction, alternate representations, and component ownership need confirmation and user testing. |
| CF-012 | Current all-day storage uses floating UTC day keys, while timed events are projected into a chosen display zone. | This is an existing cross-app contract; replacement scope and any desired corrections must be explicit. |
| CF-013 | Agenda currently groups an event only by its start day, while the prompt says events should index by every rendered local day. | Multi-day behavior differs by surface and requires a product decision. |
| CF-014 | Current tile visuals may place white or theme-background text on arbitrary imported event colors. The theme guide says imported colors cannot be assumed to carry readable text. | The future visual and contrast policy needs an explicit, testable rule. |
| CF-015 | The prompt says the logical date range is unbounded. Current data loading is bounded and historical Flutter paging depends on week-number indexing. | The actual navigation horizon and offline data horizon are product decisions. |
| CF-016 | The prompt says no loader during mode changes, while the current screen exposes sync and empty/error status independently of renderer initialization. | Loading, stale-data, transition, and failure UX must be specified separately. |

## Candidate boundary to validate, not a decision

The current repository suggests this possible responsibility split:

```text
Calendar product screen
  navigation, mode choice, menus, synchronization, event source, status UI
          |
          v
Timeline renderer boundary
  visible dates, timeline interaction, page lifecycle, event presentation semantics
          |
          v
Pure calendar domain logic
  dates, timezone projection, clipping, indexing, overlap geometry, labels

Separate agenda surface
  chronological/list representation and its own virtualization
```

Every arrow and responsibility remains open to refinement. In particular, the product owner must decide whether agenda belongs to this project, whether it is the accessible alternative to the grid, and which date/scroll state is shared across surfaces.

## What is in scope now

- Discover user goals, workflows, event semantics, navigation rules, accessibility outcomes, performance budgets, quality expectations, supported environments, and explicit exclusions.
- Identify contradictions and facts that require bounded research or real-device measurement.
- Record owner decisions in a form suitable for a future functional specification.
- Preserve the current implementation unchanged while discovery is incomplete.

## What is not yet in product scope

No individual renderer feature is confirmed yet merely because it appears in current React Native code, Flutter code, a test, an ADR, an OpenSpec, the roadmap, or the legacy prompt. This includes day mode, week mode, agenda, zoom, all-day lanes, five-day weeks, seven-day weeks, current-time indicators, infinite paging, event editing, exact performance targets, and any specific technology.

## Research completed for this inventory

The discovery read and cross-checked:

- the legacy owned-renderer prompt and Phase 04 roadmap/performance/visual notes;
- the calendar, accessibility, testing, theming, and Definition of Done architecture guidance;
- calendar ADRs 019, 020, 021, 032, 033, and 035;
- canonical calendar timeline and agenda OpenSpecs plus related event, sync, visibility, and timezone requirements;
- the current renderer facade, calendar-kit adapter, screen/controller/header, agenda, event source, time-grid, overlap layout, and relevant tests;
- the Flutter calendar screen, week layout, page snapping, synchronized vertical scrolling, zoom persistence, settings, and event layout.

This was source inspection only. No runtime profiling, device testing, user research, analytics review, or external library evaluation was performed. Those would require confirmed questions and bounded research goals first.
