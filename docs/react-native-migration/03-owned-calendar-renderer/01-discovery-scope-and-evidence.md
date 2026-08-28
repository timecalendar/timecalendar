# Discovery scope and evidence

Status: evidence inventory, not an approved functional specification.

## Purpose

This document prevents the replacement renderer from inheriting accidental requirements from current code, historical Flutter code, implementation-specific OpenSpec artifacts, or the legacy implementation prompt. It records what we know, how we know it, and what still requires product-owner confirmation.

## Evidence hierarchy

The hierarchy is about authority for future product scope, not about whether a source is technically useful.

| Priority | Source                                                    | What it may establish                                       | What it cannot establish by itself                                  |
| -------- | --------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| 1        | Explicit product-owner decision for this project          | Future in-scope and out-of-scope behavior                   | Technical facts that still require measurement                      |
| 2        | Approved future functional specification                  | The reviewed product contract                               | Implementation design unless explicitly constrained                 |
| 3        | Current OpenSpec product specifications and accepted ADRs | Existing system contracts and costly prior decisions        | That every existing contract must survive the replacement unchanged |
| 4        | Current React Native behavior and tests                   | What users or developers may experience today               | That observed behavior is desired or correct                        |
| 5        | Product reports and measured traces                       | Real problems, workflows, and performance evidence          | The best solution or an unmeasured universal conclusion             |
| 6        | Flutter behavior                                          | Historical product intent and edge cases worth asking about | Required parity, current correctness, or suitable architecture      |
| 7        | Roadmaps, backlog notes, and the legacy prompt            | Candidate requirements, risks, and prior thinking           | Confirmed scope or acceptance thresholds                            |

When sources conflict, we do not pick a winner silently. We record the conflict and ask the product owner unless it is a purely factual matter that can be measured.

## Explicitly confirmed by the product owner in this session

| ID    | Confirmed statement                                                                                            | Status         |
| ----- | -------------------------------------------------------------------------------------------------------------- | -------------- |
| C-001 | Create a dedicated, numbered documentation area for this project.                                              | `CONFIRMED_IN` |
| C-002 | Explore what the product really needs before implementation.                                                   | `CONFIRMED_IN` |
| C-003 | Never infer an unconfirmed product requirement.                                                                | `CONFIRMED_IN` |
| C-004 | Do not treat the Flutter implementation as authoritative.                                                      | `CONFIRMED_IN` |
| C-005 | Treat features and performance as important first-class concerns.                                              | `CONFIRMED_IN` |
| C-006 | Target expert-level engineering, excellent code quality, and work suitable for open sourcing with pride.       | `CONFIRMED_IN` |
| C-007 | Do not knowingly introduce technical compromises or technical debt.                                            | `CONFIRMED_IN` |
| C-008 | Produce a large, durable question backlog that a future session can use to build the functional specification. | `CONFIRMED_IN` |
| C-009 | This session is documentation and discovery, not renderer implementation.                                      | `CONFIRMED_IN` |

These statements deliberately remain broad. For example, C-005 does not confirm 1,000 events, 250 ms, 60 fps, 120 fps, a specific device, or a specific gesture. Those details are unanswered.

## Current React Native behavior observed

The following is an inventory, not a parity promise.

| Area              | Observation                                                                                                                                                  | Status     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| Surface           | The Calendar screen currently offers `day`, `week`, and `agenda` modes.                                                                                      | `OBSERVED` |
| Initial mode      | The controller initializes to `week` on each mount.                                                                                                          | `OBSERVED` |
| Week size         | The current screen always passes `showWeekends`, so the adapter requests seven days.                                                                         | `OBSERVED` |
| Agenda            | Agenda is a separate `SectionList` presentation selected in place, outside the timeline renderer.                                                            | `OBSERVED` |
| Time window       | The timeline is configured with named 07:00 and 21:00 boundaries.                                                                                            | `OBSERVED` |
| Events            | The domain source merges synced and personal events, then applies hidden-event and calendar-visibility filters.                                              | `OBSERVED` |
| Event action      | Pressing a timeline or agenda event opens the unified event-details route.                                                                                   | `OBSERVED` |
| Navigation        | The screen has Today navigation and consumes a one-shot `focusDate` route parameter.                                                                         | `OBSERVED` |
| Date state        | The controller keeps separate anchor and visible dates and updates its loaded window around calendar-kit callbacks.                                          | `OBSERVED` |
| Event loading     | Timeline data is selected through a quarter-quantized window with a two-month buffer.                                                                        | `OBSERVED` |
| Paging            | The calendar-kit adapter configures four pages per side.                                                                                                     | `OBSERVED` |
| All-day           | All-day events are projected to date-only values and rendered in a header lane.                                                                              | `OBSERVED` |
| All-day end       | The adapter converts the stored exclusive end to calendar-kit's inclusive final day with an end-minus-one-millisecond rule and a zero-duration guard.        | `OBSERVED` |
| Long timed events | Tests document that calendar-kit may put a timed event of at least 24 hours in its all-day row while retaining a timed accessibility label.                  | `OBSERVED` |
| Current time      | The renderer asks calendar-kit to show a current-time indicator.                                                                                             | `OBSERVED` |
| Timezone          | The renderer receives the resolved display timezone; timed day boundaries and labels use it, while all-day dates use a floating UTC-day-key convention.      | `OBSERVED` |
| Localization      | Current calendar copy and date formatting support French and English.                                                                                        | `OBSERVED` |
| Theme             | The adapter maps application theme tokens to calendar-kit and uses event colors for tiles.                                                                   | `OBSERVED` |
| Insets            | The screen passes the iOS bottom safe-area inset and zero on Android.                                                                                        | `OBSERVED` |
| Renderer boundary | The screen talks to a renderer-neutral facade; the calendar-kit adapter is isolated below it.                                                                | `OBSERVED` |
| Imperative API    | The current renderer handle exposes only `goToDate`, with animation and scroll-to-current-time options.                                                      | `OBSERVED` |
| Zoom              | The current owned facade exposes no zoom contract.                                                                                                           | `OBSERVED` |
| Verification      | Current tests mostly prove screen wiring and pure utilities; real gestures, paging, dense performance, and assistive-technology behavior remain device work. | `OBSERVED` |

## Flutter behavior observed

The Flutter code is useful for discovering questions and edge cases. It is not a requirement source.

| Area                     | Observation                                                                                              | Status     |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | ---------- |
| Modes                    | The inspected Flutter calendar exposes week and planning modes, not a distinct day mode.                 | `OBSERVED` |
| Week size                | It chooses five or seven visible days from a persisted `show_weekends` preference whose default is true. | `OBSERVED` |
| Time window              | The week view uses 07:00 to 21:00 and a 50-pixel hours column.                                           | `OBSERVED` |
| Vertical scale           | Hour height starts at 60, is pinch-adjustable, clamped from viewport-derived values, and persisted.      | `OBSERVED` |
| Pinch                    | The implementation attempts to preserve the content position under the focal point while scaling.        | `OBSERVED` |
| Vertical synchronization | Separate hours and week scroll views are synchronized through a custom controller.                       | `OBSERVED` |
| Vertical restoration     | A process-memory scroll offset is reused when the week layout is recreated.                              | `OBSERVED` |
| Horizontal navigation    | A horizontal builder renders week-sized pages with custom snapping physics.                              | `OBSERVED` |
| Date navigation          | A shared current-day notifier drives animated week navigation.                                           | `OBSERVED` |
| Overlap layout           | Events are packed into columns by historical app-owned logic.                                            | `OBSERVED` |
| Current time             | A current-day line and dot are drawn when now is inside the grid hours.                                  | `OBSERVED` |
| Rendering behavior       | Pinch updates call widget state repeatedly, and each week owns a vertically scrollable event tree.       | `OBSERVED` |

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

| ID     | Conflict or assumption                                                                                                                                                               | Why it cannot be silently resolved                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| CF-001 | The archived timeline spec says a five-day default; current React Native behavior and the architecture book say seven days; Flutter defaulted to seven with a five/seven preference. | Only the owner can choose the future product default and whether a preference exists.                                                        |
| CF-002 | The legacy prompt requires day, week, and agenda; inspected Flutter exposes week and planning, while current React Native exposes all three.                                         | Current availability does not prove future necessity.                                                                                        |
| CF-003 | The legacy prompt requires pinch zoom because Flutter has it; the current React Native facade has no zoom API.                                                                       | Historical parity is explicitly non-authoritative.                                                                                           |
| CF-004 | The legacy prompt sets at least 1,000 loaded events as non-negotiable.                                                                                                               | No owner-confirmed workload, event horizon, distribution, or percentile supports that number yet.                                            |
| CF-005 | Earlier roadmap prose targeted 120 fps; the device note later reframed the realistic bar as the device refresh rate; the prompt adds a 250 ms interaction target.                    | Metrics, measurement boundaries, target devices, and pass percentiles are unconfirmed.                                                       |
| CF-006 | The prompt proposes at most five mounted pages and one or two pages of overscan; the current adapter uses four pages per side.                                                       | Page count is an implementation choice that should follow measured UX and memory goals.                                                      |
| CF-007 | The prompt says mode changes must not remount the expensive tree and must preserve date, vertical offset, zoom, and selection.                                                       | The user-visible continuity contract and each retained state need separate confirmation.                                                     |
| CF-008 | The prompt requires all-day, multi-day timed, invalid-range, and zero-duration semantics.                                                                                            | Some behavior exists in storage/tests, but desired display and error handling have not been confirmed for the new surface.                   |
| CF-009 | The prompt treats current product behavior as the oracle when documentation disagrees.                                                                                               | The owner explicitly prohibited inferring future requirements from an implementation.                                                        |
| CF-010 | The prompt preselects React Native views, Reanimated, Gesture Handler, Hermes, New Architecture, and a Skia decision process.                                                        | Runtime facts may constrain options, but technology selection must follow confirmed needs and evidence.                                      |
| CF-011 | The prompt assigns accessibility ownership and detailed semantic behavior to the renderer.                                                                                           | Accessibility outcomes matter, but exact interaction, alternate representations, and component ownership need confirmation and user testing. |
| CF-012 | Current all-day storage uses floating UTC day keys, while timed events are projected into a chosen display zone.                                                                     | This is an existing cross-app contract; replacement scope and any desired corrections must be explicit.                                      |
| CF-013 | Agenda currently groups an event only by its start day, while the prompt says events should index by every rendered local day.                                                       | Multi-day behavior differs by surface and requires a product decision.                                                                       |
| CF-014 | Current tile visuals may place white or theme-background text on arbitrary imported event colors. The theme guide says imported colors cannot be assumed to carry readable text.     | The future visual and contrast policy needs an explicit, testable rule.                                                                      |
| CF-015 | The prompt says the logical date range is unbounded. Current data loading is bounded and historical Flutter paging depends on week-number indexing.                                  | The actual navigation horizon and offline data horizon are product decisions.                                                                |
| CF-016 | The prompt says no loader during mode changes, while the current screen exposes sync and empty/error status independently of renderer initialization.                                | Loading, stale-data, transition, and failure UX must be specified separately.                                                                |

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

## Round 1 confirmation summary

Recorded on 2026-08-27. The row-level source of truth is the questionnaire; this is the
plain-language confirmation required by its answering protocol.

### Requirements confirmed in

- The React Native launch uses an owned day/week timeline on iOS and Android. Day, week,
  and the existing agenda remain modes of one Calendar screen; agenda is an integration
  boundary, not a renderer rewrite.
- Students must be able to understand a day or week, see classes and breaks in time order,
  and identify the next course and room during a glance-length visit.
- A new user starts in week mode. Week mode offers Monday–Friday and Monday–Sunday, defaults
  to seven days, and always settles on a complete Monday-based calendar week.
- The selected day anchors a day-to-week switch. A week-to-day switch selects that week's
  Monday.
- The logical timeline contains the full 24-hour day. A fresh day or week viewport scrolls
  to the current time without using event times, leaving previous-hour context above it and
  placing the current-time indicator roughly 30% down the viewport; the exact placement is
  design tuning to validate against Google Calendar rather than a fixed pixel contract.
- Pinch zoom is P0 and must keep the time under the fingers visually stationary, matching
  Google Calendar's visible behavior. Every operation also needs a non-pinch alternative.
- Synced and personal events, all-day events, and timed events crossing midnight are in
  scope. Existing filtering, editability, details routing, display-timezone, French/English,
  accessible-error, and privacy contracts remain intact.
- Release builds are authoritative for performance. The hard-budget interactions are first
  open, pinch, horizontal and vertical scrolling, and event appearance after paging.
- The first accepted release uses one cutover and does not ship calendar-kit.

### Requirements and claims confirmed out

- Do not claim React Native production-user evidence: the React Native app has never shipped.
- Do not treat Flutter behavior, calendar-kit behavior, the historical prompt's 1,000-event
  number, page counts, technologies, or workarounds as product requirements.
- Do not reimplement or redesign agenda in this project.
- Do not require Google's private animation curves or implementation; only the visible zoom
  invariant and side-by-side result matter.
- Do not use an Android minimum-version increase as a substitute for meeting the agreed
  non-flagship performance floor.

### Round 2 disposition

The owner answered Round 2 and its focused clarification on 2026-08-28. The accepted
decisions are recorded below and in the row-level questionnaire. The first response to
question 3 settled the fresh **date** anchor without answering the separate vertical-time
rule; the follow-up then confirmed current-time positioning, Today behavior, and zoom
continuity. Production workload percentiles remain research-blocked rather than owner
questions.

## Round 1 bounded research (2026-08-27)

The labels below distinguish repository observations, external facts, inferences, and
recommendations. The Round 2 disposition after the research records which recommendations
the owner subsequently confirmed.

### PL-003 — platform floor and representative hardware

**Repository observation.** Expo SDK 56 and the committed native configuration currently set
iOS 16.4 and Android API 24 as the effective OS floors. The React Native app hard-codes seven
days and has no React Native weekend preference. The only existing user control is the legacy
Flutter Settings switch `Afficher les week-ends`; historical code stores it under
`show_weekends` with a `true` default.

**External facts.** Expo's SDK table lists SDK 56 with Android 7+ and iOS 16.4+. Samsung
positions the Galaxy A16 5G as an entry device in France; the French specification records
4 GB RAM and a 90 Hz display. Android's performance guidance gives approximately 16 ms,
11 ms, and 8 ms frame windows at 60, 90, and 120 Hz respectively.

**Inference.** Android API level is not a hardware-performance class. Raising API 24 would
remove older OS versions without proving acceptable behavior on a current affordable phone.

**Recommendation.** Keep API 24 unless a separate compatibility or store analysis justifies
a change. Make a physical French-market Galaxy A16 5G (4 GB/90 Hz) the binding Android
performance floor. Use iPhone SE 3 as the 60 Hz iOS floor and Galaxy S23 plus iPhone 15 Pro
as the 120 Hz checks. Run compatibility smoke tests at Android API 24 and iOS 16.4, but do
not pretend simulator/emulator results are physical-device performance evidence.

Sources:

- [Expo SDK platform support](https://docs.expo.dev/versions/latest/)
- [Samsung France Galaxy A16/A16 5G specifications](https://news.samsung.com/fr/galaxy_a16_5g_et_a16)
- [Samsung Galaxy S23 120 Hz specification](https://www.samsung.com/es/smartphones/galaxy-s/galaxy-s23-phantom-black-128gb-sm-s911bzkdeub/)
- [Apple iPhone SE 3 specification](https://support.apple.com/en-us/111866)
- [Apple iPhone 15 Pro 120 Hz specification](https://support.apple.com/en-ie/111829)
- [Android slow-rendering guidance](https://developer.android.com/topic/performance/vitals/render)

### D-006 — week start

**External fact.** Week-start conventions are locale or region data, not timezone data.
Unicode CLDR exposes a first-day value and defaults the world region to Monday; it also
supports regional differences. ECMA-402 models the same concept separately from timezones.

**Product observation.** The owner requires Monday-based whole-week snapping for the
France-school product and wants the behavior to remain stable in French and English while
traveling or changing display timezone.

**Recommendation.** Use Monday as an explicit Calendar product rule for both French and
English and for every display timezone. Do not add Sunday–Saturday at launch. Language and
travel must not move the user's selected calendar week. Revisit a user-configurable week
start only if the target market expands beyond the France-school scope.

Sources:

- [Unicode CLDR week data](https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/supplemental/weekData.json)
- [ECMA-402 `Intl.Locale` week information](https://tc39.es/ecma402/)

### A-001 — accessibility acceptance target

**External facts.** WCAG 2.2 is the current W3C Recommendation; W3C's WCAG2ICT and mobile
guidance explain how its criteria apply to non-web software and native mobile screens. EN
301 549 includes general requirements and clause 11 for non-web software. Apple and Android
both require semantic exposure and real assistive-technology testing; Apple's test guidance
calls for completing tasks with VoiceOver, Voice Control, and Switch Control, while Android
documents TalkBack, Voice Access, Switch Access, and a 48 dp target. France's current RGAA
scope includes mobile applications, but the published RGAA 4 technical method does not fully
cover native apps and points native evaluation to EN 301 549. RGAA 5 is still being prepared.

**Recommendation, not legal advice.** Treat applicable WCAG 2.2 Level A and AA outcomes as
the product acceptance baseline, interpreted for native software through WCAG2ICT and EN
301 549 clauses 5 and 11, plus current Apple and Android platform guidance. Require recorded
manual passes for VoiceOver, TalkBack, Voice Control, Switch Control, large text/font scale,
reduced motion, increased contrast, color independence, logical focus order, and complete
non-pinch operation. Ask counsel separately if TimeCalendar needs a formal legal declaration
or audited claim; engineering acceptance must not wait for that legal determination.

Sources:

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C guidance for mobile applications](https://www.w3.org/TR/wcag2mobile-22/)
- [W3C WCAG2ICT](https://www.w3.org/TR/wcag2ict-22/)
- [ETSI EN 301 549 V3.2.1](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf)
- [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility/)
- [Apple app accessibility testing](https://developer.apple.com/documentation/accessibility/performing-accessibility-testing-for-your-app)
- [Android accessibility testing](https://developer.android.com/guide/topics/ui/accessibility/testing)
- [Android accessibility principles](https://developer.android.com/guide/topics/ui/accessibility/principles)
- [French RGAA scope](https://accessibilite.numerique.gouv.fr/obligations/champ-application/)
- [DesignGouv native-app method note](https://design.numerique.gouv.fr/accessibilite-numerique/rgaa/)

### PF-002 through PF-005 — proposed performance contract

**External facts.** Android's render guidance ties the frame deadline to refresh rate rather
than one fixed FPS target. Apple treats roughly 50–100 ms of main-thread unresponsiveness as
noticeable and provides hitch/hang analysis in Instruments. React Native explicitly says to
measure performance in release builds because development mode adds substantial JS work.

**Recommendation.** Record both UI and JS timing in release builds on the binding devices.
For each scripted interaction, after a warm-up and at least 30 repetitions:

- target the active display deadline (16.67/11.11/8.33 ms at 60/90/120 Hz);
- require the 95th-percentile frame to meet one active-display deadline, the 99th percentile
  to meet two deadlines, and no app-caused main-thread stall of 100 ms or more;
- require the first correct calendar frame within 250 ms at p95 on warm Calendar entry and
  usable interaction within 500 ms at p95; record cold-start separately with a proposed
  one-second p95 budget;
- require locally available events for a settled page in its first correct frame; if a range
  query must complete after settle, require p95 at or below 250 ms and a hard limit below one
  second;
- require pinch response within the next presented frame and no perceptible focal-time drift
  in side-by-side Google Calendar testing; and
- report median, p95, p99, longest stall, missed-deadline ratio, device refresh mode, thermal
  state, build SHA, dataset ID, and tool/version. An average FPS alone cannot pass.

These are proposed gates, not measured capability. A baseline spike must prove the
instrumentation and may tighten or relax a number only with trace evidence and owner review.
Release-config development builds are diagnostic; release builds decide acceptance.

Sources:

- [Android slow-rendering guidance](https://developer.android.com/topic/performance/vitals/render)
- [Apple UI responsiveness guidance](https://developer.apple.com/documentation/xcode/understanding-user-interface-responsiveness)
- [React Native performance guidance](https://reactnative.dev/docs/performance.html)

### PF-006 through PF-008 — production workload evidence

**Access observation.** The current Kubernetes context can list pods in namespace
`timecalendar-production`, and three application pods were running during this check.
`kubectl auth can-i create pods/exec -n timecalendar-production` returned `no`. The database
stores each synced source's events as JSON in `calendar_content.events`; no direct database
endpoint or read-only credential was available to this run. No production event values,
titles, locations, identifiers, URLs, tokens, or personal data were read.

**Data limitation.** The server can establish the distribution per synced calendar source.
It cannot establish how many sources a student enables together, because that selection is
client-local. Source-count acceptance therefore needs either privacy-safe opt-in client
telemetry later or a separately confirmed synthetic assumption.

**Safe operator query plan.** An authorized production operator should run the query from a
read replica or a PostgreSQL session with `default_transaction_read_only=on`, inside
`BEGIN TRANSACTION READ ONLY`, with a 60-second local statement timeout. It should:

1. use `json_array_length(events)` to return only calendar-level count percentiles
   (`p50/p75/p90/p95/p99/max`), never calendar rows;
2. expand JSON only inside aggregate CTEs and return date-horizon, events-per-week,
   events-per-local-day, duration, all-day, multi-day, cross-midnight, adjacency, and overlap
   concurrency distributions for Europe/Paris, America/New_York, and Asia/Tokyo;
3. treat end times as exclusive and order an end before an equal start in overlap sweeps, so
   adjacent events do not count as overlapping;
4. count malformed, zero-duration, missing-field, and invalid-range records without returning
   their values;
5. enforce a minimum cohort size (recommended: at least 20 calendars) before returning a
   grouped bucket, suppress smaller groups, and return no school, calendar, token, URL, UID,
   title, location, teacher, tag, or description dimension; and
6. save only the aggregate result and query SHA. Convert p50/p95/p99 shapes into deterministic,
   fabricated fixtures with no copied event content.

A minimal first pass is:

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '60s';

WITH per_calendar AS (
  SELECT json_array_length(cc.events) AS event_count
  FROM calendar_content AS cc
  JOIN calendar AS c ON c.id = cc."calendarId"
  WHERE c."deletedAt" IS NULL
)
SELECT count(*) AS calendar_count,
       percentile_disc(ARRAY[0.50, 0.75, 0.90, 0.95, 0.99])
         WITHIN GROUP (ORDER BY event_count) AS event_count_percentiles,
       max(event_count) AS event_count_max
FROM per_calendar;

ROLLBACK;
```

The heavier event-shape and sweep-line queries should first be explained against production
statistics and stopped if the plan is not index/bounds-safe. Until an authorized operator
runs this plan, PF-006–PF-008 remain `NEEDS_RESEARCH`; 1,000 events is only a synthetic stress
case.

### E-008 and E-013 — event semantics

**External fact.** RFC 5545 forbids `TZID` on DATE values and defines a VEVENT `DTEND` as
non-inclusive. That supports the current floating-date plus exclusive-end representation for
standard iCalendar all-day events, but does not itself decide TimeCalendar's product contract.

**Recommendation.** Confirm the current floating-date/exclusive-end contract. For a timed
event crossing midnight, render one clipped visual segment per covered local day; each segment
retains one full accessible event label, indicates continuation where visually useful, exposes
an unambiguous hit target, and opens the same event details. A timed event never moves to the
all-day lane merely because it lasts 24 hours or longer.

Source: [IETF RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545)

### B-004 — proposed responsibility split

The remaining boundaries matter because date and event semantics must be deterministic and
testable without mounting a renderer, while product data loading and failure behavior must not
become coupled to page recycling or gestures.

| Owner                              | Proposed responsibilities                                                                                                                                                                                                                                            | Explicit non-responsibilities                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Calendar product screen/controller | mode choice and persistence; selected/anchor date; Today and deep-link intent; display timezone, locale, and theme inputs; sync and range loading; merged/filtered event source; empty/loading/error UI; details and add routes; switching to agenda                 | frame-frequency gesture state; overlap geometry; calendar-kit or owned-renderer internals |
| Owned timeline renderer            | day/week grid and headers; all-day lane; bounded page lifecycle; horizontal paging; synchronized vertical scroll; pinch and alternative zoom controls; current-time presentation; visible/settled callbacks; event hit testing; visible-grid accessibility semantics | sync, persistence store ownership, product navigation, agenda rendering, source filtering |
| Pure calendar domain engine        | local-day and Monday-week arithmetic; timezone projection; all-day floating-date rules; exclusive-end handling; timed segmentation and clipping; indexing; deterministic overlap geometry; coordinate/zoom invariants; semantic label inputs; validation             | React state, native views, gestures, routes, storage, network access                      |
| Existing agenda surface            | chronological list grouping and virtualization; list-specific accessibility; its pull-to-refresh presentation; event press presentation                                                                                                                              | timeline geometry, horizontal paging, pinch, duplicate event/date rules                   |

The screen owns shared mode/date state. Renderer and agenda consume the same validated domain
semantics but keep independent presentation and virtualization. An ADR is required if the final
split changes the accepted renderer-boundary rule.

### Q-001 and Q-002 — objective quality and debt gates

**Recommendation.** The first accepted renderer must meet all of these gates:

- zero TypeScript errors, lint warnings, formatting drift, React Doctor findings, architecture
  boundary violations, and unreviewed suppressions;
- repository coverage floors plus 100% statement and branch coverage for the owned pure
  date/week/timezone/segmentation/indexing/overlap/zoom-invariant modules; deterministic
  property-based tests for date, DST, interval, and geometry invariants;
- component and device tests for real gesture arbitration, focus order, recycling, dynamic
  type/font scale, themes, locales, display zones, and accessible alternate actions;
- release traces passing the agreed frame, latency, memory-growth, and bounded-node gates on
  the exact dataset/device matrix, with reproducible scripts and raw non-personal results;
- useful accessible recovery for recoverable failures and privacy-safe reporting of unexpected
  failures; no event content in logs, analytics, benchmarks, or crash metadata;
- an ADR for costly-to-reverse technology/boundary choices, public invariants for the pure
  engine, and comments only where the reason cannot be expressed in names, types, or tests;
- no `TODO`, `FIXME`, `HACK`, compatibility shim, temporary dual renderer, unexplained magic
  timeout, disabled check, knowingly flaky test, or accepted P0/P1 correctness, accessibility,
  privacy, or performance defect at the accepted React Native launch; and
- calendar-kit, its patch and adapter, temporary flags/scaffolding, and obsolete instrumentation
  removed before launch. Calendar-kit removal should happen as early as practical: because the
  React Native app has not shipped, an incomplete calendar may temporarily exist on `main`
  during development. That development allowance is not a waiver of the first-release gates and
  does not permit a temporary dual renderer or fallback.

This makes “excellent” auditable without claiming bug-free software or requiring meaningless
metrics such as universal 100% coverage of presentation glue.

## Contradictions and missing precision after Round 1

| ID        | Finding                                                                                                                           | Round 2 or research disposition                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| R1-GAP-01 | P-002 allows retention only if new evidence proves calendar-kit reliable, while M-001 says it must never ship.                    | Resolved: remove calendar-kit as early as practical; it must not ship, and there is no fallback path.                                       |
| R1-GAP-02 | P-005 lists three outcomes but does not settle the order when correctness, accessibility, fluidity, and visual richness conflict. | Resolved by Round 2 question 1.                                                                                                             |
| R1-GAP-03 | “Persist the last mode” does not define navigation, process restart, reinstall, or calendar-source boundaries.                    | Resolved by Round 2 question 2.                                                                                                             |
| R1-GAP-04 | The full-day grid is confirmed, but the initial viewport and Today behavior are not.                                              | Resolved by the Round 2 clarification: current day/week date anchors, current-time vertical positioning, Today mode/zoom preservation, and zoom continuity are confirmed. Event-selection and animation details remain later non-blocking questions. |
| R1-GAP-05 | Monday whole-week paging is confirmed, but Sunday-first support and the React Native weekend-control location are not.            | Resolved by Round 2 question 4.                                                                                                             |
| R1-GAP-06 | All-day storage facts are known but E-008 remains an owner decision.                                                              | Resolved by Round 2 question 5.                                                                                                             |
| R1-GAP-07 | Cross-midnight timed events are required, but per-segment labels, continuation cues, and hit targets are not explicit.            | Resolved by Round 2 question 6.                                                                                                             |
| R1-GAP-08 | “120 fps” cannot bind a 60 or 90 Hz panel, and the proposed budgets have no measured baseline yet.                                | Metrics and initial budgets are confirmed; a release-profile baseline remains `NEEDS_RESEARCH`.                                            |
| R1-GAP-09 | The acceptance matrix names dimensions but not exact devices or a finite dataset catalog.                                        | Matrix and catalog are confirmed; numeric production percentiles remain `NEEDS_RESEARCH` behind authorized read-only DB access.            |

## Round 2 — owner questions and recommendations

Please answer by number. “Accept recommendation” is sufficient; add corrections only where
needed. These are ordered by how many later questions they unblock.

1. **Priority when goals conflict.** Recommend this order: (a) correct dates/content, privacy,
   and complete accessibility; (b) the hard fluidity/latency budgets; (c) visual richness.
   Implementation convenience never overrides (a) or silently weakens (b). Accept?
2. **Mode persistence.** Recommend storing the last day/week/agenda choice per installation,
   preserving it across tab navigation, backgrounding, and app/process restart; a reinstall
   resets to week. Calendar-source changes do not reset it. Accept?
3. **Initial vertical position and Today.** Recommend: keep the settled vertical position while
   the Calendar screen remains mounted; on a fresh screen/app open, show now when viewing today,
   otherwise show the first timed event with a small lead-in, falling back to 08:00 when the day
   has no timed event. Today selects today and scrolls to now without changing mode or zoom.
   Accept?
4. **Week start and weekend control.** Recommend Monday-first for both French and English and in
   every display timezone; Sunday-first is out of launch scope. Add a React Native
   Settings → Calendar “Show weekends” switch, on by default. Accept?
5. **All-day date meaning.** Standard imported all-day events are floating calendar dates: they
   stay on the same named dates when display timezone changes, and their end date is exclusive
   (an event from 10 to 11 covers only the 10th). Confirm yes/no.
6. **Timed events crossing midnight.** Recommend one clipped timed segment on every covered
   local day; all segments identify continuation, expose the full accessible label, have an
   unambiguous target, and open the same event details. Events of 24 hours or more remain timed.
   Accept?
7. **Accessibility bar.** Recommend applicable WCAG 2.2 A/AA outcomes interpreted for native
   software through WCAG2ICT and EN 301 549, plus Apple/Android guidance. Acceptance includes
   recorded VoiceOver, TalkBack, Voice Control, Switch Control, large text, reduced motion,
   increased contrast, logical focus order, and non-pinch operation on physical devices. Accept?
8. **Performance devices and budgets.** Recommend Galaxy A16 5G as the 4 GB/90 Hz Android floor,
   iPhone SE 3 as the 60 Hz iOS floor, and Galaxy S23 plus iPhone 15 Pro for 120 Hz. Use the
   refresh-relative p95/p99/stall and 250/500 ms interaction budgets above; keep API 24 and
   smoke-test minimum OS versions separately. Accept as the initial binding matrix, subject to
   one baseline spike proving the measurement method?
9. **Architecture and first-release quality.** Accept the four-owner responsibility table and
   the objective quality/debt gates above? In particular, this means no production dual
   renderer or temporary flag, no unresolved P0/P1 defect, and removal of calendar-kit and its
   patch at cutover.
10. **Finite acceptance datasets.** Recommend exactly these named fixture families: empty;
    normal p50; dense p95; supported-worst p99; 1,000-event stress-only; adjacent events;
    identical starts; maximum overlap; very short and zero-duration; invalid ranges; all-day
    single/multi-day; timed cross-midnight and 24+ hour; DST gap/repeat; long/missing text;
    arbitrary colors; hidden calendars/events; live event insertion/removal; loading/stale/error;
    and maximum text size. Production research supplies the numeric p50/p95/p99 shapes. Accept,
    or name one missing family?

## Round 2 owner response (2026-08-28)

The owner accepted questions 1, 2, and 4 through 10, including the all-day confirmation in
question 5. The two free-text responses are split across the exact questions they answer:

| Round 2 item | Recorded decision | Remaining precision |
| ------------ | ----------------- | ------------------- |
| 1 — Priority | `CONFIRMED_IN`: correct dates/content, privacy, and complete accessibility; then agreed performance budgets; then visual richness. | None for this ordering. |
| 2 — Mode persistence | `CONFIRMED_IN`: persist per installation across navigation, backgrounding, and process restart; reinstall resets to week; calendar-source changes do not reset it. | None for the stated boundaries. |
| 3 — Fresh position and Today | `CONFIRMED_IN`: a fresh day-mode open selects the current day and a fresh week-mode open selects the current Monday-based week. Event presence must never make a fresh open select another day or week. A fresh viewport scrolls to the current time without using event times, leaves previous-hour context, and aims to place now roughly 30% down from the top. Today selects the current day/week, scrolls to now, and preserves mode and zoom; zoom also persists across fresh opens and day/week switches. | Exact current-time placement is design tuning for side-by-side Google Calendar validation. Mounted-screen vertical-offset persistence, Today selection handling and Today animation remain unanswered later questions. |
| 4 — Week rule | `CONFIRMED_IN`: Monday-first in French and English and every display timezone; no Sunday-first at launch; Settings → Calendar owns a default-on “Show weekends” switch. | None for launch. |
| 5 — All-day dates | `CONFIRMED_IN`: imported all-day events are floating dates with an exclusive end. | None for this contract. |
| 6 — Cross-midnight events | `CONFIRMED_IN`: render one clipped timed segment per covered local day; every segment exposes continuation, a complete accessible label and target, and opens the same event; 24-hour-or-longer timed events stay timed. | Exact visual styling remains design work, not an unanswered semantic. |
| 7 — Accessibility | `CONFIRMED_IN`: accept the proposed native WCAG 2.2 A/AA, WCAG2ICT, EN 301 549, platform-guidance, assistive-technology, large-text, motion, contrast, focus, and non-pinch engineering bar. | Any legal declaration remains outside this engineering recommendation. |
| 8 — Performance | `CONFIRMED_IN`: accept the proposed device matrix, refresh-relative metrics, initial 250/500 ms budgets, API 24 floor, and minimum-OS compatibility smoke tests. | `NEEDS_RESEARCH`: the release-profile baseline must validate capability and measurement; PF-006–PF-008 still need privacy-safe production aggregates. |
| 9 — Boundaries and quality | `CONFIRMED_IN`: accept the four-owner split and objective quality/debt gates. Remove calendar-kit as early as practical; an incomplete calendar on `main` during development is acceptable because React Native is unshipped. | This does not relax the accepted launch gates or authorize dual-renderer fallback. |
| 10 — Dataset catalog | `CONFIRMED_IN`: accept the finite fixture-family catalog. | `NEEDS_RESEARCH`: production aggregates supply the numeric p50/p95/p99 shapes. |

### Focused Round 2 clarification (2026-08-28)

The owner clarified that both fresh day and week views should show the current time with
some preceding-hour context. Google Calendar's placement—slightly above the viewport's
middle, approximately 30% from the top—is the comparison target, while the exact percentage
remains design tuning. The owner also expected zoom to remain preserved as it does in Google
Calendar and accepted the proposed Today rule: select the current day/week, scroll to now,
and preserve mode and zoom.

All Round 2 owner decisions and the focused clarification are now recorded. Architecture
planning may rely on the confirmed date anchor, fresh vertical-time rule, Today behavior, and
zoom continuity while leaving the explicitly named non-blocking interaction details open. The
release-profile baseline and privacy-safe production workload percentiles remain bounded
technical research dependencies rather than product questions.
