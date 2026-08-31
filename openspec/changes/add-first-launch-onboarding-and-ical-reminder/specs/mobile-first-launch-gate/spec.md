## ADDED Requirements

### Requirement: Startup prerequisites complete before durable eligibility is read
The app SHALL await the committed React Native database migrations and then a named future Phase 09 importer prerequisite before mounting any database-backed feature reader, startup synchronization, or navigation screen. Migration/importer failure or timeout SHALL keep post-onboarding routes unavailable and SHALL expose an accessible retry surface; a watchdog MUST NOT mark startup ready. The Phase 09 prerequisite SHALL be a typed no-op seam in this change and SHALL NOT inspect or import Flutter data.

#### Scenario: Migrations and future importer precede the calendar read
- **WHEN** the app starts with migrations or the future-importer prerequisite pending
- **THEN** no calendar-source read, startup sync, Home, Calendar, or onboarding route is mounted
- **AND** eligibility is evaluated only after both prerequisites resolve in order

#### Scenario: A failed or stalled prerequisite cannot expose tabs
- **WHEN** a prerequisite rejects or remains pending beyond the watchdog interval
- **THEN** the app presents an accessible recovery/retry surface
- **AND** Home and Calendar remain unavailable

#### Scenario: Phase 09 remains a prerequisite seam only
- **WHEN** this change is inspected
- **THEN** the ordered startup coordinator has a named typed importer slot after migrations
- **AND** no Flutter storage reader or importer implementation is present

### Requirement: A pure durable decision controls the initial route graph
After prerequisites and the first public calendar-sources read resolve, the app SHALL require onboarding exactly when there are zero durable user calendars and no onboarding resolution. Calendar-sources SHALL expose `{ calendars, loaded }` from one live-query result so eligibility cannot combine a loaded flag from one query with stale/default data from another. The app SHALL use Expo Router protected screens so post-onboarding routes are absent from the active route graph while onboarding is required; Home or Calendar MUST NOT mount beneath an effect redirect or splash overlay. One or more calendars, `skipped`, or `calendarImported` SHALL make tabs eligible. The onboarding group SHALL be available only while eligibility is unresolved, so changing the durable resolution removes the active onboarding route and lets the root Stack select tabs atomically. Tabs SHALL precede the unprotected development-token-import exception in declaration order so route-name fallback cannot select that exception after Skip. The development-only token-import route SHALL remain the sole direct import exception.

#### Scenario: Fresh empty install enters onboarding without a tabs paint
- **WHEN** a normal cold launch finishes prerequisites with zero calendars and no resolution
- **THEN** the welcome-first onboarding stack is the first available route
- **AND** neither Home nor Calendar mounts before it

#### Scenario: Skipped empty install enters tabs
- **WHEN** startup finishes with zero calendars and resolution `skipped`
- **THEN** the tabs are eligible
- **AND** onboarding is not forced

#### Scenario: Reminder dismissal alone does not resolve onboarding
- **WHEN** startup finishes with zero calendars, reminder state `dismissed`, and no onboarding resolution
- **THEN** onboarding is still required
- **AND** the independent reminder key does not make tabs eligible

#### Scenario: Existing or recovered calendar prevents onboarding
- **WHEN** startup finishes with one or more calendars and no resolution key
- **THEN** the tabs are eligible immediately
- **AND** `calendarImported` is durably seeded for future launches

#### Scenario: Loaded and calendars are one atomic snapshot
- **WHEN** the startup gate consumes the public calendar-source readiness state
- **THEN** `loaded` and `calendars` derive from the same live-query result
- **AND** an independently settled empty default cannot override a recovered calendar row

#### Scenario: Deleting the last calendar never reopens onboarding
- **WHEN** a user who previously skipped or held a calendar later has zero calendars
- **THEN** the existing resolution continues to make tabs eligible in-session and after relaunch

#### Scenario: Development token import remains usable
- **WHEN** a fresh development-variant install opens the existing dev-import token route
- **THEN** the action runs only through its existing variant gate after startup prerequisites
- **AND** its successful durable calendar write makes post-onboarding routes eligible

### Requirement: Onboarding resolution is typed, durable, and independent
The first-launch feature SHALL persist `OnboardingResolution = "skipped" | "calendarImported" | undefined` behind a typed feature store that uses only `@/storage`. Missing or malformed values SHALL decode to `undefined`. The key SHALL be environment-independent and SHALL be separate from the first-iCal-reminder state. A Skip SHALL write only `skipped`; a successful calendar import SHALL write `calendarImported` before leaving onboarding.

#### Scenario: Skip and reminder state do not alias
- **WHEN** the user confirms onboarding Skip
- **THEN** resolution becomes `skipped`
- **AND** the reminder state remains pending

#### Scenario: Successful import resolves before navigation
- **WHEN** QR or URL import has durably persisted a calendar
- **THEN** resolution becomes `calendarImported` before the shared success exit reaches tabs

#### Scenario: Resolution survives relaunch and backend switching
- **WHEN** the app relaunches or clears backend-bound storage after a valid resolution was written
- **THEN** the same validated resolution is returned
- **AND** onboarding is not reopened

#### Scenario: Invalid storage is safe
- **WHEN** the resolution key is absent or contains an unknown value
- **THEN** the store returns `undefined` without throwing

### Requirement: Skip requires one accessible shared confirmation
Activating onboarding Skip SHALL open the shared import-later confirmation component. The dialog SHALL explain that personal events remain usable and an iCal can be imported later from Settings. Cancel, backdrop dismissal, and the platform back request SHALL close the dialog and remain in onboarding without writing. Confirm SHALL durably write `skipped`; the root protected Stack SHALL then remove onboarding and select its tabs anchor, where personal-event creation SHALL remain usable with zero calendars.

#### Scenario: Cancel keeps onboarding unresolved
- **WHEN** the user activates Skip and then cancels or dismisses the dialog
- **THEN** the welcome screen remains active
- **AND** no onboarding resolution is written

#### Scenario: Confirm unlocks personal-calendar use
- **WHEN** the user confirms Skip
- **THEN** `skipped` is persisted before the tabs open
- **AND** creating a personal event is available with zero imported calendars

#### Scenario: Dialog semantics and focus are accessible
- **WHEN** the confirmation opens under VoiceOver or TalkBack
- **THEN** focus enters the modal at its localized heading and background content is excluded
- **AND** both translated actions meet the platform touch-target minimums and support Dynamic Type

### Requirement: First-launch behavior is localized and verified
All new visible text, accessibility labels, hints, recovery copy, and confirmation copy SHALL use typed French and English keys with bidirectional parity. Automated tests SHALL cover the prerequisite order/failure/retry paths, the startup matrix, protected-route no-mount behavior, total storage parsing, independent state writes, skip cancellation/confirmation, relaunch durability, and a recovered migrated token.

#### Scenario: Catalogs and accessibility copy have parity
- **WHEN** TypeScript and lint run
- **THEN** every new key exists in French and English and is a valid typed translation key
- **AND** no new user-facing literal or accessibility violation is reported

#### Scenario: Startup matrix is covered
- **WHEN** the focused unit and route suites run
- **THEN** fresh/empty, skipped/empty, dismissed-reminder/empty, and one-or-more-calendar cases are asserted
- **AND** a pending or failed prerequisite cannot render Home or Calendar
