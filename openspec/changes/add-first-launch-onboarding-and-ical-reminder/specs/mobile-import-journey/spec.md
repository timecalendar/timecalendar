## MODIFIED Requirements

### Requirement: The draft survives a failed import and is cleared on success or on leaving the journey
A failed import SHALL preserve the draft and the entered URL so the student can retry or switch between the QR and URL routes without re-entering their institution and programme. After a durable calendar upsert succeeds, the shared import-success exit SHALL record onboarding resolution `calendarImported`, clear the draft, and leave the import journey for the eligible tabs rather than returning to the manual-import step. A directly opened single-entry import route SHALL deterministically replace to `/calendar` without throwing. No failure before the durable upsert SHALL resolve onboarding.

#### Scenario: A failed import keeps the context and resolution
- **WHEN** creation, token resolution, or the durable upsert fails
- **THEN** the draft is unchanged and the entered URL remains available for retry
- **AND** onboarding resolution remains unchanged

#### Scenario: A successful onboarding import resolves and reaches tabs
- **WHEN** an import succeeds from inside the journey
- **THEN** `calendarImported` is persisted and the draft is cleared before the onboarding Stack is left
- **AND** the student reaches eligible tabs instead of the manual-import step

#### Scenario: A successful import from a directly opened route is deterministic
- **WHEN** an import succeeds on a route opened directly with a single navigation entry
- **THEN** the shared exit replaces to `/calendar` without throwing
- **AND** onboarding is durably resolved
