## ADDED Requirements

### Requirement: Calendar surfaces identify stale sources without hiding events

When one or more held calendars have `status: stale`, the Calendar screen SHALL show a
compact accessible recovery banner above the still-rendered last-good timetable. The banner
SHALL explain that a source needs attention without claiming the cached events are current
and SHALL provide a labelled button routing to `/user-calendars`. `healthy` and `unknown`
states SHALL not render this banner.

#### Scenario: Stale calendar keeps rendering with a recovery banner
- **WHEN** a held calendar is stale and cached events exist
- **THEN** the events remain visible and Calendar shows an accessible source-attention banner
  with a button to calendar management

#### Scenario: Unknown health does not alarm the user
- **WHEN** all held calendar health values are `healthy` or `unknown`
- **THEN** no stale-source recovery banner is rendered

### Requirement: Calendar management provides per-source guided re-add actions

Each stale calendar row SHALL show a localized stale indicator, a reason-specific
explanation, and a labelled “Add updated calendar” action that enters the existing
school/add-calendar flow with non-sensitive recovery context. The AMU guide code SHALL map
to explicit French and English 2026–27 service-transition guidance; an expired-window reason
without a guide SHALL map to generic re-add guidance. No visible string, accessibility
label/hint, route parameter, analytics event, or Crashlytics context SHALL include a feed URL
or token.

#### Scenario: AMU row explains the transition
- **WHEN** a calendar has `guide: amu_2026_2027`
- **THEN** its row explains in the active locale that AMU changed schedule service for the
  2026–27 year and offers the existing re-add flow

#### Scenario: Generic expired window offers neutral recovery
- **WHEN** a calendar is stale for `expired_export_window` with no guide
- **THEN** its row explains that the saved export period ended and offers re-add without
  exposing the source

#### Scenario: Recovery parameters contain no source secret
- **WHEN** the user activates the re-add action
- **THEN** navigation uses only calendar/school identity and stable recovery codes
- **AND** no feed URL or token is passed or rendered

### Requirement: Recovery never automatically removes the old calendar

Starting or completing the re-add flow SHALL NOT rewrite or delete the old calendar. The old
calendar and its last-good events SHALL remain until the user deliberately invokes the
existing confirm-gated delete after verifying the replacement.

#### Scenario: Failed re-add leaves the old timetable intact
- **WHEN** a student starts recovery but the new calendar cannot be added
- **THEN** the old calendar identity and cached events remain unchanged

#### Scenario: Successful re-add does not silently delete
- **WHEN** a replacement calendar is added successfully
- **THEN** the original calendar remains until the user confirms its deletion through the
  existing management control

### Requirement: Stale recovery UI is localized, accessible, and QA-gated

All new text SHALL have typed French/English parity. Banner and row status changes SHALL be
announced as appropriate without duplicate live-region noise; recovery controls SHALL meet
platform target sizes, preserve large text, and have descriptive labels that do not contain
source secrets. Component tests SHALL cover stale/unknown rendering, navigation, AMU/generic
copy, large-text layout branches where applicable, and accessibility roles/labels. A
dedicated Maestro flow SHALL prove stale content remains visible and recovery reaches the
add-calendar flow; native E2E SHALL run through the PR `run-e2e` CI path.

#### Scenario: Component behavior is covered
- **WHEN** mobile Jest runs
- **THEN** stale versus unknown UI, localized AMU/generic guidance, recovery routing, and
  accessible controls are asserted

#### Scenario: CI proves the recovery journey
- **WHEN** the labelled native E2E workflow runs the stale-source Maestro fixture
- **THEN** it sees last-good calendar content, opens the recovery surface, and reaches the
  existing add-calendar flow on Android and iOS

#### Scenario: Device-only checks are handed to a human
- **WHEN** implementation is ready for QA on this non-simulator host
- **THEN** a `docs/react-native-migration/inbox/` note tagged `(HUMAN: …)` lists visual,
  VoiceOver/TalkBack, large-text, and supported-device checks rather than blocking code work
