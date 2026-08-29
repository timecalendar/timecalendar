# Round 3 triage and owner questions

Status: Round 3 owner answers recorded. This is product-discovery evidence, not a functional
specification or renderer architecture.

## Why this document exists

Round 2 left 187 questionnaire rows marked `UNANSWERED`. This audit assigned every one of
those rows exactly one disposition without treating current React Native behavior, Flutter,
or an implementation preference as a product answer. At triage publication, twelve rows were
directly answered by already accepted owner decisions and the other 175 remained `UNANSWERED`.
The Round 3 answer record below supersedes that historical readiness state while preserving the
audit as evidence of what was asked.

The six audit dispositions are deliberately separate from the questionnaire decision statuses:

- `DIRECTLY_SUPPORTED_ANSWER`: an accepted owner decision already answers the row;
- `REPOSITORY_OR_STANDARDS_RESEARCH`: an agent can establish facts, or record a bounded
  evidence blocker, without asking the owner to guess;
- `RECOMMENDATION_LED_SPECIFICATION`: confirmed principles and standards support a safe
  default, but the owner must still accept it as product behavior;
- `GENUINE_OWNER_CHOICE`: several reasonable product outcomes remain;
- `LATER_CHOICE_DEPENDENCY`: answering now would pre-decide another product or architecture
  choice; and
- `EXPLICIT_OUT_OF_SCOPE_CANDIDATE`: omission is not exclusion, so the owner must explicitly
  confirm out or defer it.

## Round 3 owner answer record (2026-08-29)

The authoritative inputs are the owner's
[free-form response](/TIM/issues/TIM-267#comment-266868c3-ff11-441e-8c13-32362aef1aa5), the
[row-level interpretation](/TIM/issues/TIM-267#comment-bb1aca00-d72e-4fa8-9b0b-1a981d21928f),
and answered interaction `ef6f4c48-a37f-442a-a376-ffe625c1c8c1`. The interaction records these
eight exact choices:

- `round3_05_mid_swipe=keep_until_settle`;
- `round3_07_zero_timed=instant_marker`;
- `round3_07_invalid_range=skip_bad_only`;
- `round3_07_continuation=show_cue`;
- `round3_07_back_to_back=not_overlap`;
- `round3_07_overlap_columns=equal_columns`;
- `round3_07_tie_order=stable_order`; and
- `round3_07_relayout=keep_last_complete`.

The resulting product meaning, applied row by row in the questionnaire, is:

1. **Reuse/publication:** build a clean, reusable internal TimeCalendar Lego piece that the team
   is proud of. A public npm package, standalone example, public compatibility promise, and
   package-specific licensing are not part of the first delivery; later extraction remains
   possible without becoming a current public-API commitment.
2. **Devices and controls:** phone and tablet portrait layouts are first-class. Tablet landscape
   may be allowed without bespoke landscape polish, but changing the current portrait-only native
   contract is a separate sensitive native-config/ADR decision. Ordinary keyboard/computer control
   is deferred; complete accessibility control remains first-class. Split-window detail was not
   answered and remains explicit.
3. **Surface boundary:** accept the recommendation for university and personal events in owned
   day/week rendering. Month/custom-day modes, renderer-owned search/filtering, side-by-side
   comparison, mini rendering, and Home reuse are outside this delivery. Agenda remains an
   independent presentation.
4. **Direct manipulation:** editing, empty-grid creation, long-press, drag, resize, rescheduling,
   recurrence editing, and per-event/per-calendar timezone display are outside the first delivery,
   not forbidden forever. Later editing must remain feasible without choosing its architecture now.
5. **Paging:** accept whole day/week pages, one page per swipe, platform-native physics, settled
   title changes, reduced-motion-aware Today/deep-link movement, and preservation of mode/zoom.
   There is no resting partial week; while a finger holds the transition, the old title and selected
   day remain until settle (`keep_until_settle`). The proposed twelve-month product limit is
   rejected: synchronized dates years away remain navigable.
6. **Grid and zoom:** accept the full-day grid, pinned labels/headers, zoom-dependent divisions,
   continuous pinch, visible non-pinch controls, locale/time-format behavior, Gregorian launch
   behavior, and visible-clock continuity. Measured default/minimum/maximum zoom values remain
   technical research rather than owner-supplied numbers.
7. **Unusual/crowded events:** cancelled events are hidden in this iteration, with future display
   still possible. Use an instant marker, skip only an invalid event, show continuation cues, treat
   back-to-back events as non-overlapping, use equal columns and stable ordering, and keep the last
   complete layout until its replacement is ready. The numeric crowding threshold remains bounded
   agent-owned research.
8. **Tile content:** visually show event name and location; grid position conveys visual time and
   timed-event accessibility labels always include time. Source colors may be adjusted for
   acceptable active-theme contrast. Missing-field rules and exact color ranges/contrast algorithms
   remain unresolved technical or product detail rather than invented answers.
9. **Operation/accessibility:** Calendar has no refresh gesture or haptics. Home retains
   pull-to-refresh for now, and Settings may gain a later action. Chronological accessibility order
   is navigation on the same Calendar screen, not a separate destination. The accepted non-gesture,
   focus, large-text, reduced-motion, target-size, and physical-device evidence requirements remain.
10. **Visual/loading/error:** refine rather than copy the current calendar, use a normal loading
    indicator instead of a skeleton, preserve stale data with status and retry, and never show a
    wrong date, unexplained blank, unlabeled stale events, or a theme flash. Exact all-day overflow
    and truncation rules remain unresolved.
11. **Live changes/recovery:** settle gestures before environment changes, swap complete geometry
    atomically, isolate malformed rows with privacy-safe reporting, handle disappearing events
    accessibly, and retain an accessible failure representation.
12. **Evidence/acceptance/release:** accept two-platform testing, privacy-safe dogfood evidence,
    product-owner behavior/design acceptance, and engineering review. This pre-production delivery
    has no rollback, calendar-kit fallback, dual renderer, or staged production rollout. Eventual
    production rollout policy belongs to later release planning.

The row table remains canonical. A grouped answer settles only the keys directly supported by the
owner's words or an accepted recommendation; unanswered precision and bounded research remain
visible rather than being filled by inference.

### Readiness after recording Round 3

The questionnaire's 280 unique rows now total 172 `CONFIRMED_IN`, 45 `CONFIRMED_OUT`, five
`DEFERRED`, nine `NEEDS_RESEARCH`, and 49 `UNANSWERED`.

Remaining `UNANSWERED` keys, in questionnaire order:

- Users/platform: `U-002`, `U-005`, `U-006`, `U-008`, `U-009`, `U-010`; `PL-007`, `PL-010`.
- Navigation/time: `N-012`, `N-015`, `N-018`; `T-009`.
- Events/interactions/dates/visuals/accessibility: `E-014`, `E-025`; `I-013`; `D-009`,
  `D-010`; `V-012`, `V-013`; `A-010`, `A-011`.
- Performance: `PF-009`–`PF-011`, `PF-014`, `PF-015`, `PF-018`–`PF-028`.
- Boundaries/migration: `B-002`, `B-003`, `B-005`, `B-006`, `B-009`–`B-014`; `M-011`,
  `M-012`.

The nine bounded research keys are `P-004`, `PL-003`, `T-011`, `T-012`, `E-020`, `V-009`,
and `PF-006`–`PF-008`. No new owner question is created here: remaining factual work stays with
agents, while unresolved product precision remains visible for later discovery. Functional
specification, architecture, and implementation are still unauthorized.

## Exact 187-row audit

The lists below are the row-level audit. A focused check compares their union with the 187
Round 2 `UNANSWERED` keys and fails on a missing, extra, or duplicated key.

### `DIRECTLY_SUPPORTED_ANSWER` — 12

`P-007`, `U-004`, `PL-009`, `N-002`, `E-005`, `I-003`, `D-008`, `D-016`, `V-006`,
`M-005`, `M-006`, `X-009`.

These transitions are recorded in the questionnaire. In short: this is an explicitly scoped
mixture rather than general parity; finding the next class and room is the most time-critical
task; web and exact React Native/Flutter parity are out; a week page is one Monday-based week;
multi-day all-day events are covered by the accepted fixture contract; one tap opens details;
DST correctness and property tests are required; and the accepted fresh-position rule requires
a current-time indicator.

### `REPOSITORY_OR_STANDARDS_RESEARCH` — 17

`U-002`, `U-005`, `U-006`, `U-008`, `U-009`, `U-010`, `T-009`, `D-009`, `D-010`,
`PF-009`, `PF-010`, `PF-011`, `PF-025`, `B-009`, `B-010`, `M-011`, `M-012`.

- Usage frequency, source-count, user-group, and primary-input claims have no production React
  Native evidence. Source-count is client-local, so server aggregation cannot answer it.
  Resolve these through a privacy-safe opt-in dogfood/usability study, not owner recollection.
- Spring gaps and autumn repeats are real instants projected into the selected display zone;
  local labels must distinguish repeated times and invalid wall-clock input must not be silently
  normalized. The authoritative implementation references are ECMA-402 and the IANA timezone
  data consumed by the chosen date engine.
- `PF-009`–`PF-011` remain blocked on aggregate workload shapes. `PF-025` should use release
  traces from platform tools plus both React Native UI and JS timing; an in-app average FPS
  display cannot be acceptance evidence.
- Current repository facts are now explicit: Hermes and New Architecture are the binding SDK 56
  runtime; app-owned day/time/overlap/format utilities need revalidation; and the calendar-kit
  adapter, patch, page-buffer workaround, hard-coded seven-day input, fixed 07:00–21:00 adapter
  window, and current callback timing must not be copied accidentally. ADRs 019, 020, 032, and
  033 plus the archived calendar-kit OpenSpecs need an explicit supersede/retire pass after the
  owned architecture is accepted.

### `RECOMMENDATION_LED_SPECIFICATION` — 29

`N-001`, `T-003`, `T-005`, `T-006`, `T-007`, `T-011`, `T-012`, `T-013`, `E-010`,
`E-011`, `E-012`, `E-015`, `E-016`, `E-017`, `E-019`, `E-025`, `I-009`, `V-008`,
`V-009`, `V-010`, `A-004`, `A-005`, `A-009`, `A-010`, `A-024`, `PF-016`, `R-004`,
`R-005`, `Q-008`.

These rows have strong defaults from the accepted date, accessibility, privacy, and quality
principles. They appear in Round 3 questions 5–12 where needed. Numeric density and performance
limits remain evidence dependencies rather than defaults.

### `GENUINE_OWNER_CHOICE` — 51

`P-010`, `P-011`, `U-007`, `PL-005`, `PL-006`, `PL-007`, `PL-008`, `S-012`, `S-017`,
`N-003`, `N-004`, `N-005`, `N-008`, `N-009`, `N-014`, `N-016`, `T-002`, `T-004`,
`T-014`, `E-003`, `E-018`, `E-026`, `I-004`, `I-011`, `I-012`, `D-011`, `D-013`, `D-014`,
`V-001`, `V-002`, `V-003`, `V-004`, `V-005`, `V-007`, `V-011`, `V-016`, `A-006`,
`A-007`, `A-017`, `A-019`, `A-021`, `A-023`, `PF-017`, `R-001`, `R-002`, `R-003`,
`Q-019`, `Q-020`, `M-007`, `M-008`, `M-009`.

These choices are grouped into the 12 dependency-ordered questions below. The owner is not
asked to supply a device measurement, workload percentile, or undocumented architecture choice.

### `LATER_CHOICE_DEPENDENCY` — 57

`PL-010`, `N-011`, `N-012`, `N-015`, `N-017`, `N-018`, `T-015`, `T-017`, `E-014`,
`E-020`, `E-021`, `E-022`, `E-023`, `E-024`, `I-010`, `I-013`, `I-014`, `D-015`,
`V-012`, `V-013`, `V-014`, `V-015`, `A-008`, `A-011`, `A-012`, `A-013`, `A-014`,
`A-015`, `A-016`, `A-018`, `A-020`, `PF-014`, `PF-015`, `PF-018`, `PF-019`, `PF-020`,
`PF-021`, `PF-022`, `PF-023`, `PF-024`, `PF-026`, `PF-027`, `PF-028`, `R-008`,
`R-009`, `R-012`, `B-002`, `B-003`, `B-005`, `B-006`, `B-011`, `B-012`, `B-013`,
`B-014`, `Q-016`, `Q-017`, `Q-018`.

Interaction-state details follow the selected interaction/accessibility model; overflow and
density limits follow privacy-safe workload research; exact performance budgets follow the
release baseline; public API/version/license artifacts follow the publication decision; and
facade, dependency, native-config, runtime, and OTA constraints belong to the later measured
architecture decision. In particular, repository inspection can describe the current
`CalendarEvent` and `useCalendarEvents(range)` seams, but only the later architecture decision can
make them authoritative or replace them through a coordinated migration. None should be silently
fixed during functional discovery.

### `EXPLICIT_OUT_OF_SCOPE_CANDIDATE` — 21

`S-013`, `S-014`, `S-015`, `S-016`, `S-018`, `I-005`, `I-006`, `I-007`, `I-008`,
`D-003`, `B-007`, `B-008`, `X-001`, `X-002`, `X-003`, `X-004`, `X-005`, `X-006`,
`X-007`, `X-008`, `X-010`.

Round 3 questions 1, 3, and 4 ask for explicit exclusions. `X-009` is no longer in this list:
the accepted iOS/Android scope directly confirms web out.

## Bounded factual checks for Round 3

### Repository/platform observations

- `mobile/app.config.ts`, the runtime architecture rule, and ADR 042 bind iPhone and iPad to
  portrait/full-screen. iPad multitasking is disabled. This is current binding evidence, not
  permission to infer whether every tablet layout is first-class product scope.
- The mobile runtime is iOS and Android only. Expo Go is not a project runtime; development,
  preview-store, and production-store builds are separate profiles, and native-affecting changes
  create a new fingerprint runtime rather than an OTA-compatible shell.
- The current screen exposes day/week/agenda, one-tap details, Today, a separate agenda
  `SectionList`, cached-data refresh status, and a renderer-neutral `goToDate` facade. These are
  observations unless an accepted row says otherwise.
- The app-owned overlap helper already uses half-open timed intervals: an end equal to another
  start is non-overlapping. It sorts by start, then end, then input order. This is useful evidence
  for `E-017`/`E-019`, not approval of that future presentation.
- The Architecture Book requires translated semantics, logical accessible state, font scaling,
  reduced motion, tokenized light/dark contrast, and privacy-safe errors. The accepted Round 2
  accessibility bar additionally requires physical-device assistive-technology evidence.

### Current authoritative-source checks

- Expo SDK 56 currently documents Android 7+ and iOS 16.4+ and React Native 0.85. Expo describes
  Expo Go as a fixed-native playground and development builds as the production-project
  development environment. This supports excluding Expo Go parity from acceptance, while the
  repository's minimum-OS rules remain the binding product baseline.
- React Native's current performance guide says development mode adds substantial JavaScript
  work and performance must be checked in release builds. Android's current render guidance
  gives approximately 16/11/8 ms at 60/90/120 Hz and recommends release or non-debuggable
  builds. These facts preserve the accepted refresh-relative release contract; they do not
  prove the unimplemented renderer meets it.
- Apple requires main-task testing with VoiceOver, Voice Control, and Switch Control on physical
  devices. Android requires manual and automated accessibility testing, including TalkBack and
  switch access. W3C's WCAG2Mobile and WCAG2ICT remain the authoritative native interpretation
  aids already accepted in Round 2.

Primary sources:

- [Expo SDK 56 reference](https://docs.expo.dev/versions/v56.0.0/)
- [Expo SDK 56 app configuration](https://docs.expo.dev/versions/v56.0.0/config/app/)
- [Expo development-build FAQ](https://docs.expo.dev/develop/development-builds/faq/)
- [React Native performance](https://reactnative.dev/docs/performance)
- [Android slow-rendering guidance](https://developer.android.com/topic/performance/vitals/render)
- [Apple app accessibility testing](https://developer.apple.com/documentation/accessibility/performing-accessibility-testing-for-your-app)
- [Android accessibility testing](https://developer.android.com/guide/topics/ui/accessibility/testing)
- [W3C WCAG2Mobile](https://www.w3.org/TR/wcag2mobile-22/)
- [W3C WCAG2ICT](https://www.w3.org/TR/wcag2ict-22/)
- [ECMA-402](https://tc39.es/ecma402/)
- [IETF RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545)

### `PF-006`–`PF-008` production aggregate attempt

Observation on 2026-08-28:

- the current Kubernetes identity can list production pods and services and can read the
  deployment secret reference;
- it still cannot create `pods/exec` or `pods/portforward` requests in
  `timecalendar-production`;
- the database URL was held in process memory only and was never printed or persisted;
- a direct PostgreSQL connection from this workspace timed out before a session could start;
  therefore no query ran and no event content, raw row, identifier, or personal field was read.

Exact blocker: the production database is not network-reachable from this execution workspace,
and both in-cluster read paths available to this identity are denied. The next agent-owned action
is to run the existing aggregate-only SQL from an authorized network execution context with
`BEGIN TRANSACTION READ ONLY`, `default_transaction_read_only=on`, a 60-second local statement
timeout, minimum cohort suppression, and aggregate-only output. The safe query plan in the
evidence document remains executable and does not require owner labor. Until it runs,
`PF-006`–`PF-008` and dependent `PF-009`–`PF-011` remain `NEEDS_RESEARCH`/research-blocked.

### `P-004`, `PL-003`, and the release-profile baseline

- This Linux host has no `adb`, attached device, iOS tooling, or `/dev/kvm`. The company host
  policy also reserves emulator/simulator E2E for CI on `main`.
- The owned renderer does not exist yet, so a release-profile baseline for it cannot be measured.
  Profiling calendar-kit would only document the remembered `P-004` symptoms; it cannot prove
  owned-renderer capability or tune its acceptance budgets.
- `P-004` therefore remains a bounded current-renderer reproduction task on the accepted physical
  device/dataset matrix. `PL-003` remains a physical Galaxy A16 5G capability validation, not an
  Android-version decision. The owned baseline becomes executable only after a traceable renderer
  spike exists and must use a release binary, named fixture, exact device/OS/refresh mode, warm-up,
  repetitions, thermal state, UI/JS traces, and build SHA.

Missing device access or an unimplemented renderer is a measurement blocker, not a product
choice and not evidence for relaxing the accepted budget.

## Historical Round 3 questions as asked

The text below is preserved as the historical question set the owner answered. Every
`Recommend` paragraph records the proposal at question time, not current accepted scope. Where a
recommendation conflicts with the answer record above—especially the twelve-month horizon,
cancelled-event display, Calendar refresh, haptics, skeleton loading, staged rollout, or rollback—
the answer record and row table supersede it.

1. **How reusable must the first delivery be?** (`P-010`, `P-011`, `B-007`, `B-008`,
   `Q-016`–`Q-018`, `X-010`) In ELI5 terms: are we building a very clean part of TimeCalendar,
   or a public Lego set that strangers can install on day one? **Recommend** a reusable internal
   TimeCalendar module with published invariants, accessibility behavior, and reproducible
   benchmarks, but no standalone package, example app, compatibility promise, or package-specific
   license in the first delivery. Revisit extraction when a second real consumer exists. This
   keeps product quality high without paying a permanent public-API support cost before demand.

2. **Which screen shapes and hardware controls are first-class?** (`PL-005`–`PL-008`) The app
   already has a binding portrait/full-screen iPhone+iPad contract; that fact does not decide the
   desired layout quality. **Recommend** first-class portrait layouts on iPhone, iPad, and Android
   phones; a usable non-bespoke Android-tablet layout; no landscape, split-screen, or resizable
   window at launch; and complete focus/activation through platform accessibility controls, with
   ordinary keyboard/trackpad shortcuts beyond that deferred. Wider launch scope multiplies every
   layout, gesture, large-text, and device acceptance case.

3. **Confirm the timeline content and surface boundary.** (`U-007`, `S-013`–`S-016`, `S-018`,
   `X-001`, `X-002`, `X-005`, `X-006`) In ELI5 terms: should this one project grow new calendar
   screens or special schedule types too? **Recommend** first-class university classes and personal
   student events using ordinary all-day/timed shapes, while confirming out month,
   three-day/custom-day modes, renderer-owned search/filtering, side-by-side calendar comparison,
   a mini/embedded renderer, and reuse for Home. Day/week are the owned renderer; existing agenda
   and Home keep integrating over shared date/event rules. Saying “out” prevents accidental scope
   growth; it does not forbid a later separately specified feature.

4. **Confirm that the grid displays events but does not edit them.** (`I-004`–`I-008`, `D-003`,
   `X-003`, `X-004`, `X-007`, `X-008`) **Recommend** one tap opens details, while long-press,
   empty-grid actions, drag-create, drag/resize/reschedule, recurrence editing, and per-event or
   per-calendar timezone display are out of the first delivery. Creation/editing stays in existing
   forms and all timed events use the one selected display zone. Adding direct manipulation would
   introduce a separate editing, conflict, undo, accessibility, and sync product.

5. **How should date paging feel?** (`S-012`, `N-001`, `N-003`–`N-005`, `N-008`, `N-014`,
   `N-016`, `N-017`) **Recommend** one day per day page and one whole Monday-based week per week
   page; one page per swipe/fling; platform-default gesture physics on each operating system while
   keeping those paging outcomes identical; the title changes only when a page settles; a
   partially visible week retains its prior selected day until settle; Today and deep-link jumps
   animate unless reduced motion requests a direct settle; a deep link preserves mode/zoom and
   selects its date; and launch navigation is limited to the locally synchronized twelve-month
   past/future window with an accessible boundary message. Multi-page flings feel fast but make
   date, title, loading, and screen-reader state easier to lose.

6. **How should the time grid and zoom controls behave?** (`N-009`, `T-002`–`T-007`,
   `T-011`–`T-015`, `T-017`, `D-011`, `D-013`, `D-014`) **Recommend** keeping the full 24-hour day
   vertically scrollable; pinned hour labels and day headers; major hour lines plus zoom-dependent
   smaller divisions; continuous pinch within measured min/max sizes; visible zoom-in, zoom-out,
   and reset actions in the Calendar menu; French and English as the complete launch locales with
   the device's 12/24-hour preference honored; Gregorian dates at launch even when the device uses
   a non-Gregorian system calendar, with that limitation stated rather than silently displaying a
   different calendar; and preservation of the same visible clock time across day/week switches
   and while the mounted tab is retained. Process restart uses the already accepted fresh-now
   rule. This preserves context and makes zoom fully operable without hiding controls over a dense
   grid; adding another calendar system later requires its own date-model and localization work.

7. **What happens to unusual or crowded events?** (`E-003`, `E-010`–`E-012`, `E-015`–`E-021`,
   `E-025`, `PF-017`) **Recommend** visibly marking canceled events; rendering a zero-duration
   timed event as a minimum-height instant marker; rejecting a zero-day all-day or end-before-start
   event from the grid while recording a private error; showing top/bottom continuation cues when
   clipped; treating end-equals-next-start as non-overlap; and using deterministic equal-width
   columns ordered by start, end, then stable event identity. Keep the last correct frame while
   valid replacement geometry is prepared. The numeric overlap/aggregation threshold remains
   blocked on `PF-006`–`PF-011`, not an owner guess.

8. **What information must an event tile communicate?** (`E-022`–`E-026`, `V-008`–`V-010`,
   `A-009`, `A-010`) **Recommend** showing title first, then time and location when space permits;
   the accessible name always includes title/fallback, calendar date or “all day,” time range when
   timed, location when present, continuation, and canceled state. Preserve source color as
   identity, but allow a deterministic light/dark tone or decorative accent while text uses a
   verified neutral foreground/scrim. Exact source color is less important than readable content
   under the already accepted priority order.

9. **How should people operate and understand a dense timeline without relying on perfect touch?**
   (`I-009`–`I-014`, `N-011`, `A-004`–`A-021`, `A-023`, `A-024`) **Recommend** no persistent
   selected-event state because one tap opens details; no pull-to-refresh gesture on the timeline
   because refresh remains automatic, with manual pull-to-refresh kept in agenda; no required
   calendar haptics at launch; paging/Today/zoom buttons alongside gestures; screen readers operate
   a chronological representation grouped by date rather than a duplicate focus tree over the
   visual grid; settled-date announcements only, never gesture chatter; focus retained by stable
   event identity or moved predictably to the date heading; full largest OS text settings with the
   chronological representation when the grid cannot remain legible; nonessential animation
   removed under reduced motion; 44-point iOS / 48-dp Android targets through hit-area expansion
   and deterministic overlap choices; and physical-device checks for bold text, button shapes,
   increased contrast, and color filters where the platform provides them. Physical-device
   evidence must show that these alternatives work; passing automated checks alone is not enough.

10. **What visual direction and loading/error presentation should we specify?** (`S-017`,
    `V-001`–`V-005`, `V-007`, `V-011`–`V-016`, `R-001`–`R-003`, `PF-016`) **Recommend** refining rather than
    copying the current calendar, with the Architecture Book tokens and an owner-approved reference
    screenshot as the source and owner design sign-off as the acceptance artifact; recognizable
    TimeCalendar typography, spacing, and source-color identity without copying calendar-kit;
    equivalent platform meaning rather than identical pixels; localized weekday plus date in day
    headers; today, current time, cancellation, selection/focus, and errors never conveyed by color
    alone; an empty grid that still shows time; a quiet grid/skeleton on first load; last-known
    events plus a stale status during refresh; and an accessible retry while cached events remain
    after failure. A transition never shows the wrong date, an unexplained blank, unlabelled stale
    events, or a theme flash. This gives design a clear contract without freezing calendar-kit
    visuals.

11. **How should live changes and bad input recover?** (`I-010`, `D-015`, `R-004`, `R-005`,
    `R-008`, `R-009`, `R-012`) **Recommend** applying locale, timezone, theme, and text-size changes
    after canceling/settling the active gesture; atomically replacing event geometry after a page
    settles; skipping one malformed event while the rest render and recording only a privacy-safe
    error; closing details with an accessible “no longer available” state if its event disappears;
    and exposing the chronological representation plus retry after a renderer-level failure. A
    single bad row must not blank the student's whole schedule.

12. **Who accepts the release, and how can it be rolled back?** (`Q-008`, `Q-019`, `Q-020`,
    `M-007`–`M-009`) **Recommend** two-platform end-to-end coverage for open, day/week switch,
    paging, Today, zoom plus non-pinch controls, event open, live refresh, and failure recovery;
    privacy-safe internal dogfood telemetry for latency/error counts only; no external audit beyond
    the already accepted accessibility/performance evidence unless law or a named risk requires it;
    product-owner acceptance for behavior and design, plus engineering review of architecture,
    accessibility evidence, performance evidence, and repository quality; and a staged store
    rollout whose rollback restores the prior complete app binary or compatible OTA, never
    calendar-kit or a hidden dual renderer. This separates repository merge from the
    human-authorized release act and keeps rollback compatible with the one-renderer rule.

## After recording the answers

The answers are recorded in the row-level questionnaire with derived status counts and remaining
key lists. This record does not create the functional specification, architecture options, ADR,
implementation plan, renderer, or rollout act. Those remain unauthorized until their separate
discovery and approval gates are satisfied.
