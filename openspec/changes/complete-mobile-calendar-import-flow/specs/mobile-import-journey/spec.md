## MODIFIED Requirements

### Requirement: The draft survives a failed import and is cleared on success or on leaving the journey
A create, token-resolution, or durable-upsert failure SHALL preserve the draft and entered URL so
the student can retry without re-entering their institution and programme. Once durable calendar
identity commits, the source route SHALL use root-targeted dismissal to replace the onboarding
entry with the calendar-import result. Unmounting the onboarding provider SHALL clear the draft;
the source screen SHALL NOT clear it before navigation. Event-hydration failure SHALL occur on the
root result after onboarding has been removed and SHALL retry sync rather than calendar creation.

#### Scenario: A failed import keeps the context
- **WHEN** creation, token resolution, or the durable upsert fails
- **THEN** the draft and entered URL remain available for checkpointed Retry
- **AND** the student remains in the guarded source flow until they retry, choose another source, or leave

#### Scenario: A successful import clears the draft and leaves the journey
- **WHEN** a QR or iCal attempt commits its `user_calendars` row
- **THEN** root-targeted dismissal places the calendar-import result above the existing tabs entry
- **AND** the onboarding Stack unmounts and clears its draft by provider ownership
- **AND** no protected onboarding route renders between persistence and the result

#### Scenario: Event-hydration failure cannot recreate the calendar
- **WHEN** the root result cannot commit synced events locally
- **THEN** its Retry action runs only the coordinated event sync
- **AND** the removed QR/iCal source route cannot repeat calendar creation

#### Scenario: A successful import from a directly opened route does not throw
- **WHEN** a legal directly opened QR or iCal route commits a durable calendar
- **THEN** root-targeted dismissal replaces the current root entry with the result when necessary
- **AND** the existing tabs anchor remains below it

## ADDED Requirements

### Requirement: Import source navigation has bounded native history
The import-method chooser SHALL push one selected QR or iCal source. Changing method after QR
failure SHALL dismiss to the existing chooser while preserving the completed journey draft.
Repeated recovery SHALL NOT append alternating source routes. Intentional export-guide page pushes
SHALL remain unchanged.

#### Scenario: Changing method dismisses the failed QR route
- **WHEN** the student chooses Change method after a failed valid QR attempt
- **THEN** the chooser opens without clearing the completed guide or draft
- **AND** choosing QR starts a new scanner instance

#### Scenario: Choosing iCal after QR failure opens its input directly
- **WHEN** the student chooses Change method, then iCal
- **THEN** the chooser commits the iCal handoff and opens `/onboarding/ical-url`
- **AND** the focused source guard accepts the completed draft without redirecting to the guide
- **AND** native Back from iCal returns to the import-method chooser

#### Scenario: Repeated source use does not grow a hidden chain
- **WHEN** the student returns to the chooser and selects QR or iCal repeatedly
- **THEN** each selection owns at most one source entry above the chooser
- **AND** no recovery shortcut stacks one source sibling over another

#### Scenario: Inactive source cannot hijack navigation
- **WHEN** a retained QR or iCal screen is not focused and the journey state changes
- **THEN** its guard does not navigate
- **AND** illegal entry is checked again when that screen becomes focused

### Requirement: One root result owns loading, failure, and terminal success
The app SHALL register a thin, root-level calendar-import result route above the existing tabs
anchor and outside the onboarding provider. The route SHALL carry no private import parameters and
SHALL request a coordinated sync pass that begins after any older in-flight pass. It SHALL show a
localized accessible loading state, a recoverable event-loading failure, or terminal success only
after `calendar_events` commits. It SHALL be headerless, use the readable safe layout, and provide
controls meeting the platform target minimum.

#### Scenario: Result starts with event loading
- **WHEN** the result route mounts after durable calendar persistence
- **THEN** it requests one fresh-after-current calendar sync and announces localized loading politely
- **AND** no duplicate sync starts from repeated renders or button presses

#### Scenario: Event failure is truthful and retryable
- **WHEN** the fresh sync fails before the event transaction commits
- **THEN** the result states that the calendar was added but events could not be loaded
- **AND** Retry requests another fresh sync without returning to onboarding or creating a calendar
- **AND** a secondary action can continue to the existing Calendar tab for later pull-to-refresh

#### Scenario: Success waits for the local event commit
- **WHEN** the fresh sync transaction commits the server response, including a valid empty response
- **THEN** the result announces that the timetable is ready
- **AND** a subsequent name-convergence warning or Activity refresh failure does not revoke success

#### Scenario: Primary success action reuses the tabs entry
- **WHEN** the student activates View my timetable
- **THEN** `dismissTo` removes the result and selects Calendar in the existing tabs navigator
- **AND** the root stack contains neither onboarding, the result, nor a duplicate tabs entry afterward

#### Scenario: Native Back cannot re-enter onboarding
- **WHEN** native Back or the platform back gesture leaves any result phase
- **THEN** the existing tabs entry becomes active
- **AND** onboarding and its completed source routes are absent from history

#### Scenario: The result carries no private navigation state
- **WHEN** result navigation and route parameters are inspected
- **THEN** no calendar URL, token, institution, programme, checkpoint, or raw error is present
