## ADDED Requirements

### Requirement: Reminder visibility follows calendars and its own durable dismissal
The first-launch feature SHALL expose a reactive first-iCal-reminder decision that is visible only when onboarding is resolved, the public calendar-sources read has loaded, there are zero durable user calendars, and `FirstIcalReminderState` is `pending`. Missing or malformed reminder storage SHALL decode to `pending`; confirmation SHALL persist `dismissed` behind `@/storage` under a key separate from onboarding resolution. Any positive calendar count SHALL hide the reminder reactively. Returning later to zero calendars SHALL show it only if it was never dismissed.

#### Scenario: Skip does not dismiss the reminder
- **WHEN** a zero-calendar user confirms onboarding Skip and reaches the tabs
- **THEN** the reminder is visible
- **AND** its state remains `pending`

#### Scenario: Existing calendar hides the reminder
- **WHEN** at least one durable user calendar exists
- **THEN** the reminder is absent regardless of dismissal state

#### Scenario: Import hides the reminder automatically
- **WHEN** a visible reminder user successfully imports a calendar
- **THEN** the reactive calendar count hides the reminder without a separate UI write

#### Scenario: Later zero-calendar state respects dismissal only
- **WHEN** all calendars are later deleted
- **THEN** the reminder returns if its state is `pending`
- **AND** it remains absent if its state is `dismissed`

#### Scenario: Dismissal survives relaunch and backend switching
- **WHEN** reminder dismissal has been confirmed
- **THEN** it remains dismissed across relaunches and backend-bound resets
- **AND** onboarding resolution is unchanged

### Requirement: Home and Calendar compose the same bottom-safe-area reminder
Home and Calendar SHALL render the same shared reminder component as the bottom item of their vertical layout. The card SHALL have rounded top corners, a prominent localized “Import your first iCal” message, an import CTA, and a dismiss affordance. It SHALL own the bottom safe area and reserve its measured normal-flow height so it does not overlap tab chrome, calendar controls, Android FABs, or scroll content. Text SHALL wrap and scale on small screens without clipping.

#### Scenario: Reminder appears identically on both tabs
- **WHEN** an eligible zero-calendar pending-reminder user opens Home and Calendar
- **THEN** both tabs show the same shared component and copy at the bottom safe area
- **AND** no tab-specific duplicate implementation exists

#### Scenario: Large text and small screens remain usable
- **WHEN** Dynamic Type enlarges reminder text on a small supported screen
- **THEN** the card grows in normal flow and all copy/actions remain visible or reachable
- **AND** underlying tab content and controls are not covered

### Requirement: Reminder actions reuse the existing journey and shared confirmation
The reminder import CTA SHALL enter `/onboarding/school`, the existing school/programme/Connect/manual import journey, without duplicating route or import logic. Its dismiss affordance SHALL open the same import-later confirmation component and title/body/confirm copy used by onboarding Skip. Cancel, backdrop dismissal, or platform back SHALL keep the reminder visible and write nothing. Confirm SHALL write only reminder state `dismissed` and hide it immediately.

#### Scenario: CTA enters the existing import journey
- **WHEN** the user activates the reminder import CTA
- **THEN** `/onboarding/school` opens
- **AND** no new QR, URL, create, resolve, or persistence path is invoked by the card

#### Scenario: Cancel keeps the reminder
- **WHEN** the user opens reminder dismissal and cancels or dismisses the dialog
- **THEN** the reminder stays visible
- **AND** reminder state remains `pending`

#### Scenario: Confirm dismisses only the reminder
- **WHEN** the user confirms reminder dismissal
- **THEN** reminder state becomes `dismissed` and the card hides immediately
- **AND** onboarding resolution and calendars are unchanged

### Requirement: Reminder UI is localized, accessible, and behavior-tested
All reminder and dialog strings, accessibility labels, and hints SHALL be typed and present in French and English. The card heading SHALL expose heading semantics; CTA and dismiss SHALL have meaningful labels and 44pt iOS / 48dp Android targets; decorative icons SHALL not take focus. Component/route tests SHALL cover both tab hosts, loaded versus unresolved reads, cancel/confirm, CTA routing, reactive hide-after-import, dismissal relaunch, focus/semantics, and small-screen/Dynamic Type layout behavior.

#### Scenario: Assistive technology traverses one coherent card
- **WHEN** VoiceOver or TalkBack focuses the reminder
- **THEN** it encounters a localized heading followed by the import and dismiss actions in logical order
- **AND** no decorative icon adds an extra focus stop

#### Scenario: Focused tests cover the shared behavior
- **WHEN** the reminder suites run
- **THEN** Home and Calendar visibility, CTA routing, cancel/confirm, relaunch durability, and hide-after-import are asserted
- **AND** the implementation remains one shared component
