## Context

`mobile/e2e/run_e2e.sh` currently discovers every YAML directly under `mobile/.maestro/` and runs each in its own Maestro process. There are seventeen such top-level files, while nested YAML already serves as non-discovered setup. The suite mixes user-value journeys with destination reachability, detailed pagination/order checks, UI variants, and mutation permutations that are cheaper and more deterministic in Jest, server tests, or shell fixtures.

The native workflow is already a daily/manual health signal under ADR 055, not a pull-request gate. ADR 038 still governs process isolation and structural startup retry classification. This change narrows the business signal without changing those lifecycle or retry guarantees.

## Goals / Non-Goals

**Goals:**

- Make exactly three business journeys discoverable at `mobile/.maestro/*.yaml`.
- Exercise the highest-value import, personal-event, and subscribed-calendar visibility paths with real persistence and a real backend where applicable.
- Preserve fast selector, harness, classifier, and workflow-structure protection in baseline CI.
- Retain removed behavior at a cheaper seam only when an explicit coverage audit finds a real gap.
- Separate daily smoke health from broader human release-candidate exploratory acceptance.

**Non-Goals:**

- Product behavior or navigation changes made for automation.
- Recreating every removed device assertion in a lower-level test.
- Changing native E2E triggers, build configuration, retry policy, API contracts, schemas, deploy configuration, or legacy Flutter.
- Covering Activity pagination, settings destinations, environment switching, feedback, rename convergence, checklist permutations, notifications, assistant, or migration as daily device journeys.

## Decision 1 — Discovery is the journey manifest

Only three YAML files remain directly under `mobile/.maestro/`, named in lexical execution order for fresh-user import, personal-event CRUD, and subscribed-calendar visibility. All reusable setup lives below `mobile/.maestro/helpers/` (or another nested directory) and is invoked with `runFlow`; helpers are never symlinked or mirrored at the top level.

`run_e2e.sh` keeps deriving its list from the top-level glob and keeps one Maestro process per result. Its focused shell proof gains an exact inventory/count assertion, so a fourth top-level business flow or an accidentally promoted helper fails baseline CI. This keeps discovery transparent and preserves ADR 038 instead of adding a second manifest.

Alternatives considered: a hard-coded three-file array would duplicate the filesystem contract; Maestro tags would make local and CI selection easier to drift; leaving non-running top-level YAML in place would make “three journeys” unverifiable from discovery.

## Decision 2 — The import journey uses a harness-owned iCalendar fixture

The first flow starts from cleared application state, follows the shipped welcome → seeded school → programme → connect → URL-import screens, and submits a deterministic iCalendar URL served by the harness-managed NestJS process only in the E2E/test environment. Because the calendar-create request sends the URL to the backend, a loopback fixture URL is reachable by the backend in both compose and native server modes without platform-specific app networking.

The fixture yields a calendar and next-day, date-neutral event suitable for the forward-only agenda window. The flow waits for the create/sync handoff, opens Agenda, asserts the synced title, and opens its real details. Focused server tests prove that the fixture is unavailable outside the E2E/test environment and that its payload remains parseable and date-safe.

Alternatives considered: a live university URL is nondeterministic; the existing dev-import token skips the user-visible school/programme/import submission; adding an app-only shortcut would be a product change solely for automation.

## Decision 3 — Retained local mutations prove persistence on shipped surfaces

The personal-event journey enters from the Home or Calendar add control, creates an event with default dates, opens it from the rendered Home/Calendar surface, edits a stable text field, saves, cold-reopens without clearing state, verifies the edited value, and then confirms deletion. It does not drive native date/time pickers.

The subscribed-calendar journey imports the existing seeded smoke calendar through a nested helper, positively anchors a target event and a companion event in Agenda, toggles the calendar off via `user-calendar-visibility-<id>`, cold-reopens Agenda to prove the schedule is absent, toggles it on again, and cold-reopens Agenda to prove both schedule rendering and persisted restoration. Positive companion/screen anchors prevent vacuous negative assertions.

Alternatives considered: retaining the hidden-event flow tests a different feature; toggling without cold re-entry would prove only optimistic UI; testing through the standalone personal-events list would miss the shipped Home/Calendar entry requirement.

## Decision 4 — Removed assertions are audited, not cloned

The implementation records a short mapping from each removed top-level flow to existing server, data/store, component, selector-integrity, or harness-classifier coverage. A lower-level test is added only where the behavior is valuable, absent, and cheaper at that seam. Activity ordering stays server-owned; retry fixtures stay shell/Jest-owned; selector integrity remains recursive across retained flows and nested helpers.

Alternatives considered: deleting without an audit risks accidental gaps; mechanically porting every assertion preserves suite volume under a different name and overfits tests to implementation details.

## Decision 5 — Three is the durable smoke budget

The Architecture Book and a new ADR define the daily pack as these three journeys. Increasing beyond five top-level business journeys requires a new board decision; candidate additions should normally replace a lower-value journey or land at a cheaper seam. Phase 10 release-candidate acceptance remains broader and human-directed, including parity areas intentionally absent from the daily pack.

After focused static checks pass, the implementation head is pushed and one manual native workflow dispatch targets that exact commit for both Android and iOS. A second dispatch is allowed only after a relevant code/config change or when artifacts identify a concrete transient infrastructure failure; otherwise failures are reported as grouped E2E-health debt.

Alternatives considered: treating the three-flow list as a one-time cleanup would allow immediate regrowth; making all release-candidate checks automated would recreate the cost and flake profile this change removes.

## Risks / Trade-offs

- **[Risk] Fewer device flows detect fewer cross-screen regressions before a release candidate.** → Keep deterministic coverage at cheaper seams and require broader human release-candidate exploratory acceptance.
- **[Risk] The harness iCalendar endpoint leaks into a production build.** → Gate it on the server test/E2E environment and prove production registration excludes it.
- **[Risk] A negative visibility assertion passes on an empty or wrong screen.** → Pair it with a positive screen/companion anchor and restore visibility before the flow ends.
- **[Risk] The new journeys become long composites.** → Share setup, keep one nominal path per journey, avoid exhaustive branches, and retain existing bounded cold-start waits.
- **[Risk] The exact-head native run is blocked by runner infrastructure.** → Stop after the bounded attempt, preserve artifacts, and report grouped platform health debt rather than expanding scope or blindly rerunning.
