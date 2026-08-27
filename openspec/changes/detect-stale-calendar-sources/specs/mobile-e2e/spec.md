## ADDED Requirements

### Requirement: Seeded calendar flows use the live native view menu

Calendar-family Maestro flows that require Agenda SHALL open the stable `calendar-view`
control and select its visible `Agenda` native menu action on Android and iOS. They SHALL NOT
target the removed `calendar-view-agenda` item id. The anchor `calendar.yaml` flow SHALL keep
the real seeded-event and event-details assertions after switching views.

#### Scenario: Calendar round-trip reaches Agenda through the native menu

- **WHEN** `calendar.yaml` completes the seeded dev import
- **THEN** it opens `calendar-view`, selects `Agenda`, sees `E2E Today Lecture`, opens that
  synced event, and sees `Room E2E Lecture`

#### Scenario: Every affected flow avoids the removed selector

- **WHEN** the native suite runs all committed calendar-family Maestro flows
- **THEN** no affected flow refers to `calendar-view-agenda`, and each retains its existing
  seeded content and journey assertions

#### Scenario: Both native jobs prove the integrated head

- **WHEN** the exact integrated PR head is ready for Reviewer sign-off
- **THEN** the labelled Android and iOS native E2E jobs both pass without a timeout-only
  workaround, mock-only import path, workflow change, or weakened seeded-data assertion

### Requirement: Settings child routes return through supported platform interactions

The shared Settings Maestro flow SHALL activate the visible native header back affordance
on iOS and SHALL retain the supported system-back interaction on Android after visiting each
Settings child route. Navigation and destination assertions SHALL remain required on both
platforms.

#### Scenario: My calendars returns to Settings

- **WHEN** the flow opens **My calendars** from `settings-calendar-summary`
- **THEN** iOS activates `BackButton`, Android performs system back, and both platforms
  observe **Settings** before continuing

#### Scenario: Appearance and language returns to Settings

- **WHEN** the flow opens **Appearance & language** from Settings
- **THEN** iOS activates `BackButton`, Android performs system back, and both platforms
  observe **Settings** after the return

#### Scenario: Return remains a strict gate

- **WHEN** either platform cannot activate its supported return interaction
- **THEN** the flow fails without an optionalized command, removed Settings assertion,
  timeout-only workaround, product-navigation change, or CI/workflow change

### Requirement: Stale recovery observes retained content through the native agenda label

The stale-source Maestro flow SHALL require the unique retained-event title within the
visible agenda row's accessibility text on Android and iOS. The assertion SHALL support the
grouped iOS label without becoming optional, changing its 60-second synchronization bound,
or weakening any downstream recovery gate. Its immediately following required wait and tap
SHALL match the visible `Review` title within the control's accessibility label on both
platforms while preserving the existing 60-second wait.

#### Scenario: Grouped iOS label proves the retained event

- **WHEN** iOS exposes the agenda row as a grouped label containing `E2E Last Good Lecture`
  together with its time, room, and details action
- **THEN** the flow observes the required title and continues to the recovery journey

#### Scenario: Android retains the same semantic proof

- **WHEN** Android renders the seeded retained event in Agenda
- **THEN** the same title-bearing selector observes `E2E Last Good Lecture` within 60 seconds

#### Scenario: Downstream recovery gates remain mandatory

- **WHEN** the retained event has been observed
- **THEN** the flow still requires **Review**, **E2E Stale Calendar**, **Source needs
  attention**, **Add updated calendar**, and the final school-selection destination

#### Scenario: Grouped iOS label activates the Review control

- **WHEN** iOS exposes the visible Review button as a grouped accessibility label containing
  `Review` together with its calendar-source guidance
- **THEN** the required wait observes that title within 60 seconds and the required tap uses
  the same title-bearing selector before every later recovery gate runs
