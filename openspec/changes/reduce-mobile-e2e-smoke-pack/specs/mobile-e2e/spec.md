## ADDED Requirements

### Requirement: The native smoke pack contains exactly three business journeys

Maestro discovery SHALL expose exactly three top-level YAML flows under `mobile/.maestro/`: fresh-user school/programme import, personal-event lifecycle, and subscribed-calendar visibility. Nested setup flows MAY be shared, but SHALL NOT be independently discovered or counted as business journeys. Increasing the pack beyond five top-level business journeys MUST require a new board decision.

#### Scenario: Harness discovery sees the durable inventory

- **WHEN** the focused harness proof enumerates `mobile/.maestro/*.yaml`
- **THEN** it finds exactly the three named business journeys in deterministic order
- **AND** every helper YAML is nested below the top-level directory

#### Scenario: A fourth top-level YAML is introduced

- **WHEN** a contributor adds or moves another YAML directly under `mobile/.maestro/`
- **THEN** baseline CI fails with the unexpected top-level inventory before a native runner is allocated

### Requirement: Fresh-user import proves the real school-to-calendar path

The fresh-user journey SHALL clear application state, follow the shipped welcome, seeded school selection, programme, connect, and URL-import screens, and submit a deterministic iCalendar fixture served by the harness-managed backend in the test/E2E environment. It SHALL finish on a rendered synced calendar and open a seeded synced-event detail with real content.

#### Scenario: A fresh student imports a timetable

- **WHEN** the flow selects the seeded school returned by the live schools endpoint, enters a programme, continues to URL import, and submits the harness fixture URL
- **THEN** the backend creates and synchronizes the calendar through the generated client and persistence seams with nothing mocked
- **AND** the flow observes the fixture event in Agenda and opens details showing its seeded title and content

#### Scenario: Production does not expose the fixture

- **WHEN** the server module graph is built outside the test/E2E environment
- **THEN** the deterministic iCalendar fixture route is not registered

### Requirement: Personal-event smoke covers edit and restart persistence

The personal-event journey SHALL enter creation through the shipped Home or Calendar surface, create an event, reopen it from the rendered calendar/home surface, edit it, save it, cold-reopen the app without clearing state, verify the edit persisted, and delete the event through the confirmed destructive path.

#### Scenario: A personal event survives edits and restart

- **WHEN** a student creates a personal event with deterministic text, edits a stable text field, saves, and cold-reopens the owning surface
- **THEN** the edited event renders from the real local database and opens with the edited value
- **AND** confirmed deletion removes it from the rendered surface

### Requirement: Subscribed-calendar visibility updates the rendered schedule

The calendar-management journey SHALL import the seeded subscribed calendar, positively observe its schedule, toggle the calendar hidden, cold-reopen the rendered calendar and prove the schedule is absent, toggle it visible again, and cold-reopen the rendered calendar to prove the schedule is restored. The flow SHALL leave visibility restored.

#### Scenario: A subscription is hidden and restored

- **WHEN** the flow toggles the seeded calendar off through its stable visibility switch and later toggles it on through the same management surface
- **THEN** a target event disappears while a positive current-screen or control anchor prevents an empty-screen false positive
- **AND** the target event reappears after restoration, proving the persisted filter is consumed by schedule rendering

### Requirement: Removed device behavior remains at the cheapest valuable seam

Detailed Activity pagination/tie ordering, settings destinations, environment switching, feedback, rename convergence, checklist permutations, UI variants, and retry-recovery fixtures SHALL NOT remain independently executed native journeys. Static selector integrity and structural harness-classifier fixtures SHALL remain baseline CI checks. The implementation SHALL add focused server, store/persistence, or component coverage only for valuable behavior found absent during the removal audit.

#### Scenario: A removed flow has existing focused coverage

- **WHEN** the implementation audit maps a removed native assertion to an existing deterministic lower-level test
- **THEN** no duplicate replacement test is added

#### Scenario: Valuable behavior has no cheaper proof

- **WHEN** the audit identifies valuable ordering, persistence, or navigation behavior with no existing focused coverage
- **THEN** the smallest appropriate server, integration, or component test is added and runs in baseline CI

### Requirement: Smoke changes receive one bounded exact-head native proof

After focused static tests pass, this suite reduction SHALL receive one deliberate manual workflow dispatch for the final exact commit on both Android and iOS. A repeat SHALL require a relevant code/config change or concrete transient-failure evidence recorded with the issue. Broader release-candidate parity remains human-directed exploratory acceptance rather than additional daily top-level journeys.

#### Scenario: The final smoke implementation is ready for native evidence

- **WHEN** the final implementation commit passes selector, harness, classifier, fixture, and relevant focused tests
- **THEN** one manual dispatch targets that immutable commit and selects both platforms

#### Scenario: Infrastructure prevents trustworthy proof

- **WHEN** the bounded dispatch cannot produce trustworthy platform evidence because of runner infrastructure
- **THEN** the failure and retained artifacts are reported as grouped E2E-health debt
- **AND** the suite is not expanded into repeated remediation or rerun chains

## MODIFIED Requirements

### Requirement: Real-round-trip Maestro flow

The three mobile Maestro journeys SHALL exercise real persistence and, where applicable, the harness-managed NestJS/Postgres backend with nothing mocked. The fresh-user import SHALL use the live schools read and a harness-served deterministic iCalendar source; the visibility journey SHALL use a real held seeded subscription; the personal-event journey SHALL use the real device-local database. Flows and nested helpers SHALL remain shared across platforms, use stable seeded/localized selectors, and preserve the cold-start `stopApp` → `openLink` idiom with bounded waits.

#### Scenario: Seeded schools and imported events render through the real stack

- **WHEN** the fresh-user flow reads the seeded school, submits the harness iCalendar fixture, and reaches the calendar
- **THEN** the generated client, `customFetch`, NestJS, Postgres, calendar sync, and local persistence produce the rendered fixture event and resolvable details

#### Scenario: Local persisted mutations render after restart

- **WHEN** the personal-event and subscribed-calendar journeys cold-reopen without clearing state after their writes
- **THEN** rendered Home/Calendar state reflects the canonical persisted values rather than only optimistic UI

### Requirement: The rewritten flows stay cross-platform and cold-start-idiomatic

The retained business flows and their nested helpers SHALL remain shared across iOS and Android, using localized/seeded text and platform-neutral testIDs with no selector fork beyond the optional iOS custom-scheme confirmation. They SHALL use the established state-preserving cold-reentry idiom and bounded waits around app readiness and first synced-data assertions.

#### Scenario: A retained journey runs unchanged on both platforms

- **WHEN** any retained top-level flow runs on the iOS simulator and Android emulator
- **THEN** both execute the same business interactions and assertions, with only the existing optional iOS deep-link confirmation branch

### Requirement: Single-command local e2e run

The repository SHALL provide one command that boots the server stack once, discovers exactly the three top-level Maestro YAML journeys, runs each against the connected simulator/emulator in a separate Maestro CLI process, reports pass/fail, and tears the stack down once including on failure. Nested helper YAML SHALL run only when invoked by a top-level journey. The `--keep-up` debugging escape hatch SHALL remain available.

#### Scenario: One command runs the isolated smoke pack

- **WHEN** `mobile/e2e/run_e2e.sh` runs with an installed E2E build and connected device
- **THEN** it brings the shared server lifecycle up once, invokes one Maestro process for each of the three top-level journeys in lexical order, exits with the first terminal non-zero status or zero after all pass, and tears down once

#### Scenario: Helpers are not independently executed

- **WHEN** reusable setup YAML exists below a nested helper directory
- **THEN** top-level discovery excludes it while retained flows can invoke it with `runFlow`

#### Scenario: --keep-up leaves the stack for debugging

- **WHEN** the wrapper runs with `--keep-up`
- **THEN** the server stack remains up and the command reports how to inspect logs and tear it down manually

## REMOVED Requirements

### Requirement: The calendar flow asserts a real synced tile and real event details

**Reason**: Calendar rendering and details are folded into the fresh-user import journey instead of remaining a separate business flow.

**Migration**: Retain the real synced event and details assertions in the fresh-user journey.

### Requirement: The home flow asserts a populated today timeline

**Reason**: A separate Home reachability journey is outside the three-journey smoke budget.

**Migration**: Retain component coverage for Home rendering and use Home or Calendar as the personal-event journey's shipped entry surface.

### Requirement: The event-checklists flow round-trips a checklist through the real DB

**Reason**: Checklist permutations are not one of the three representative business journeys.

**Migration**: Keep focused checklist data/store and component coverage; add nothing unless the removal audit finds a genuine gap.

### Requirement: The hidden-events flow round-trips a hide/un-hide on a real synced event

**Reason**: The representative calendar-management mutation is subscribed-calendar visibility, not per-event hiding.

**Migration**: Keep focused hidden-event store/filter/component coverage and replace the native flow with subscribed-calendar visibility.

### Requirement: A rename round trip proves the server converged, not just the local row

**Reason**: Rename convergence is too narrow and mutation-heavy for the durable daily smoke pack.

**Migration**: Retain focused server and client persistence/convergence tests where present; the removal audit fills only demonstrated gaps.

### Requirement: The Activity flow proves the real unread and pagination round trip

**Reason**: Detailed pagination and tie ordering belong in deterministic server tests rather than a long native scroll journey.

**Migration**: Preserve server ordering/page-boundary coverage and focused client pagination tests.

### Requirement: The Activity flow proves current routing and cancelled inertness safely

**Reason**: Activity route variants and cancelled-row behavior are outside the three-journey smoke budget.

**Migration**: Preserve focused component/navigation coverage where valuable and already present.

### Requirement: The checklist Maestro journey observes progress after returning to a summary

**Reason**: Checklist summary permutations are removed from native journey execution.

**Migration**: Preserve the focused renderer-identity and checklist progress tests in baseline CI.

### Requirement: Flow selectors resolve against the shipped app

**Reason**: The existing requirement embeds flow-specific incident cases for journeys removed from native execution; selector integrity remains mandatory under a smaller, generic contract.

**Migration**: Replace it with the concise static-baseline requirement below.

## ADDED Requirements

### Requirement: Static E2E integrity remains a baseline gate

Baseline CI SHALL recursively inspect retained top-level flows and nested helpers, fail any `id:` selector that resolves to no shipped `testID`, reject platform-asymmetric bare `back`, and retain the structural retry-classifier and shell-harness fixtures. The guards SHALL be updated to refer to the new journey/helper paths without weakening their matching behavior.

#### Scenario: A retained selector drifts

- **WHEN** a retained flow or helper references a removed or renamed shipped `testID`
- **THEN** the baseline selector proof names the YAML location and fails before native execution

#### Scenario: Harness recovery logic changes

- **WHEN** retry classification, process isolation, or top-level discovery changes
- **THEN** the existing mutation-backed shell/Jest fixtures fail unless the structural contract remains satisfied
